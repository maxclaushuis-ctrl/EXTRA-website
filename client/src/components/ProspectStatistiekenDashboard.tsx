import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/queryClient";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  Legend, ResponsiveContainer, BarChart, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp, TrendingDown, Minus, Send, MailOpen, MousePointer, UserMinus,
  Download, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  BarChart2, Eye, ArrowRight, FlaskConical, Trophy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
type PeriodeOptie = '7d' | '30d' | '90d' | 'jaar' | 'custom';
type SortBy = 'open_rate' | 'click_rate' | 'verzonden' | 'naam' | 'datum';
type SortDir = 'asc' | 'desc';

interface KPI {
  totaal_verzonden: number; totaal_verzonden_vorige: number;
  gem_open_rate: number; gem_open_rate_vorige: number;
  gem_click_rate: number; gem_click_rate_vorige: number;
  uitschrijvingen: number; uitschrijvingen_vorige: number;
}
interface TijdlijnPunt {
  periode: string; verzonden: number; open_rate: number; click_rate: number;
  geopend: number; geklikt: number;
}
interface BrancheStats {
  branche: string; campagnes: number; bereikt: number;
  open_rate: number; click_rate: number;
}
interface OverviewData {
  kpi: KPI; tijdlijn: TijdlijnPunt[]; per_branche: BrancheStats[]; granularity: string;
}
interface CampagneRegel {
  id: number; naam: string; type: string; status: string; datum: string | null;
  branche_filter: string[]; abTestActief: boolean;
  verzonden: number; geopend: number; geklikt: number; uitgeschreven: number;
  open_rate: number; click_rate: number;
}
interface CampagnesData {
  campagnes: CampagneRegel[]; total: number; page: number; per_page: number;
}
interface ActiviteitItem {
  id: number; type: string; timestamp: string; url?: string;
  email: string; campaign_name: string;
  contact_naam: string | null; contact_bedrijf: string | null;
}
interface ActivityData {
  activiteiten: ActiviteitItem[]; total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BRANCHES = ['Hotel', 'Restaurant', 'Cateraar', 'Evenementenlocatie', 'Logistiek'];

function calcVanaf(opt: PeriodeOptie, customVanaf?: string): string {
  if (opt === 'custom' && customVanaf) return customVanaf;
  const nu = new Date();
  if (opt === '7d') return new Date(nu.getTime() - 7 * 86400000).toISOString().split('T')[0];
  if (opt === '90d') return new Date(nu.getTime() - 90 * 86400000).toISOString().split('T')[0];
  if (opt === 'jaar') return `${nu.getFullYear()}-01-01`;
  return new Date(nu.getTime() - 30 * 86400000).toISOString().split('T')[0];
}

function calcTot(opt: PeriodeOptie, customTot?: string): string {
  if (opt === 'custom' && customTot) return customTot;
  return new Date().toISOString().split('T')[0];
}

function trendPijl(curr: number, prev: number, invertGoed = false) {
  if (prev === 0) return null;
  const pct = ((curr - prev) / prev) * 100;
  const beter = invertGoed ? pct < 0 : pct > 0;
  const neutral = Math.abs(pct) < 1;
  if (neutral) return <span className="text-slate-400 text-xs flex items-center gap-0.5"><Minus className="h-3 w-3" />0%</span>;
  return (
    <span className={`text-xs flex items-center gap-0.5 font-medium ${beter ? 'text-green-600' : 'text-red-500'}`}>
      {beter ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function kleurDot(val: number, type: 'open' | 'click') {
  const drempels = type === 'open' ? [25, 15] : [5, 2];
  if (val >= drempels[0]) return 'text-green-500';
  if (val >= drempels[1]) return 'text-yellow-500';
  return 'text-red-500';
}

function kleurRand(val: number, type: 'open' | 'click') {
  const drempels = type === 'open' ? [25, 15] : [5, 2];
  if (val >= drempels[0]) return 'border-green-400';
  if (val >= drempels[1]) return 'border-orange-400';
  return 'border-red-400';
}

function formatPeriode(p: string, gran: string): string {
  try {
    const d = new Date(p);
    if (gran === 'day') return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    if (gran === 'week') return `Wk ${getWeek(d)} (${d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })})`;
    return d.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
  } catch { return p; }
}

function getWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function activiteitIcoon(type: string) {
  switch (type) {
    case 'open': return <span title="Geopend" className="text-blue-500">👁️</span>;
    case 'click': return <span title="Geklikt" className="text-purple-500">🖱️</span>;
    case 'unsubscribe': return <span title="Uitgeschreven" className="text-red-500">🚫</span>;
    case 'sent': return <span title="Verzonden" className="text-green-500">📨</span>;
    default: return <span>📧</span>;
  }
}

function tijdGeleden(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Zojuist';
  if (mins < 60) return `${mins} min geleden`;
  const uren = Math.floor(mins / 60);
  if (uren < 24) return `${uren}u geleden`;
  return `${Math.floor(uren / 24)}d geleden`;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

// ─── KPI Kaart ────────────────────────────────────────────────────────────────
function KpiKaart({
  label, value, prev, icon: Icon, suffix = '', borderKleur = '', invertGoed = false, loading,
}: {
  label: string; value: number; prev: number; icon: any;
  suffix?: string; borderKleur?: string; invertGoed?: boolean; loading: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border-2 ${borderKleur || 'border-slate-100'} flex-1 min-w-0`}>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500 font-medium">{label}</p>
            <Icon className="h-4 w-4 text-slate-300" />
          </div>
          <p className="text-4xl font-bold text-slate-800 leading-none mb-2">
            {value.toLocaleString('nl-NL')}{suffix}
          </p>
          <div className="flex items-center gap-1.5">
            {trendPijl(value, prev, invertGoed)}
            <span className="text-xs text-slate-300">vs. vorige periode</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Hoofdcomponent ──────────────────────────────────────────────────────────
export default function ProspectStatistiekenDashboard() {
  const { toast } = useToast();

  // Filters
  const [periode, setPeriode] = useState<PeriodeOptie>('30d');
  const [customVanaf, setCustomVanaf] = useState('');
  const [customTot, setCustomTot] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  // Campagne tabel
  const [sortBy, setSortBy] = useState<SortBy>('open_rate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  // Activity
  const [activityOffset, setActivityOffset] = useState(0);
  const [allActivity, setAllActivity] = useState<ActiviteitItem[]>([]);

  // Computed
  const vanaf = calcVanaf(periode, customVanaf);
  const tot = calcTot(periode, customTot);

  const buildParams = useCallback((extra: Record<string, any> = {}) => {
    const p = new URLSearchParams({ vanaf, tot, ...extra });
    selectedBranches.forEach(b => p.append('branche', b));
    return p.toString();
  }, [vanaf, tot, selectedBranches]);

  // Queries
  const overviewQ = useQuery<OverviewData>({
    queryKey: ['/api/admin/stats/overview', vanaf, tot, selectedBranches.join(',')],
    queryFn: () => fetchJson<OverviewData>(`/api/admin/stats/overview?${buildParams()}`),
    staleTime: 60_000,
  });

  const campagnesQ = useQuery<CampagnesData>({
    queryKey: ['/api/admin/stats/campaigns', vanaf, tot, selectedBranches.join(','), sortBy, sortDir, page],
    queryFn: () => fetchJson<CampagnesData>(`/api/admin/stats/campaigns?${buildParams({ sort_by: sortBy, sort_dir: sortDir, page: String(page), per_page: '10' })}`),
    staleTime: 60_000,
  });

  const activityQ = useQuery<ActivityData>({
    queryKey: ['/api/admin/stats/activity', activityOffset],
    queryFn: () => fetchJson<ActivityData>(`/api/admin/stats/activity?limit=20&offset=${activityOffset}`),
    staleTime: 60_000,
  });

  // Merge activity on load more
  const { data: overview, isLoading: ovLoading } = overviewQ;
  const { data: campagnesData, isLoading: campLoading } = campagnesQ;
  const activityData = activityQ.data;

  const toggleBranche = (b: string) => {
    setSelectedBranches(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
    setPage(1);
  };

  const handleSort = (col: SortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
    setPage(1);
  };

  const handleExportCsv = () => {
    const url = `/api/admin/stats/export/csv?${buildParams()}`;
    window.open(url, '_blank');
  };

  const handleMeerActiviteit = () => {
    setActivityOffset(o => o + 20);
  };

  // Format tijdlijn voor recharts
  const chartData = useMemo(() => (overview?.tijdlijn || []).map(p => ({
    ...p,
    name: formatPeriode(p.periode, overview?.granularity || 'day'),
  })), [overview]);

  // Branche data voor horizontal bar
  const brancheData = overview?.per_branche || [];
  const maxBrancheRate = Math.max(...brancheData.map(b => b.open_rate), 1);

  const kpi = overview?.kpi;

  const periodeLabel: Record<PeriodeOptie, string> = {
    '7d': 'Laatste 7 dagen', '30d': 'Laatste 30 dagen',
    '90d': 'Laatste 90 dagen', 'jaar': 'Dit jaar', 'custom': 'Aangepast',
  };

  const totalPages = Math.ceil((campagnesData?.total || 0) / 10);

  return (
    <div className="min-h-full bg-slate-50">
      {/* Topbalk */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Statistieken</h1>
            <p className="text-xs text-slate-400">E-mail marketing prestaties</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Periode filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  {periodeLabel[periode]}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {(Object.entries(periodeLabel) as [PeriodeOptie, string][]).map(([k, v]) => (
                  <DropdownMenuItem key={k} onClick={() => { setPeriode(k); setPage(1); }} className={periode === k ? 'bg-purple-50 text-purple-700' : ''}>
                    {v}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Custom date picker */}
            {periode === 'custom' && (
              <div className="flex items-center gap-1.5 text-xs">
                <input type="date" value={customVanaf} onChange={e => { setCustomVanaf(e.target.value); setPage(1); }}
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
                <span className="text-slate-400">—</span>
                <input type="date" value={customTot} onChange={e => { setCustomTot(e.target.value); setPage(1); }}
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
              </div>
            )}

            {/* Export knop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <Download className="h-3.5 w-3.5" />Exporteren
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCsv} className="text-xs">
                  Exporteer als CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { overviewQ.refetch(); campagnesQ.refetch(); activityQ.refetch(); }}>
              <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${ovLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Branche filter pills */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Branche:</span>
          <button
            onClick={() => { setSelectedBranches([]); setPage(1); }}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedBranches.length === 0 ? 'bg-purple-600 text-white border-purple-600' : 'border-slate-200 text-slate-500 hover:border-purple-300'}`}
          >
            Alle branches
          </button>
          {BRANCHES.map(b => (
            <button key={b}
              onClick={() => toggleBranche(b)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedBranches.includes(b) ? 'bg-purple-600 text-white border-purple-600' : 'border-slate-200 text-slate-500 hover:border-purple-300'}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-[1400px]">

        {/* ── KPI Kaarten ── */}
        <div className="flex gap-4 flex-wrap">
          <KpiKaart
            label="Totaal verzonden" value={kpi?.totaal_verzonden ?? 0}
            prev={kpi?.totaal_verzonden_vorige ?? 0} icon={Send}
            loading={ovLoading}
          />
          <KpiKaart
            label="Gem. open rate" value={kpi?.gem_open_rate ?? 0}
            prev={kpi?.gem_open_rate_vorige ?? 0} icon={MailOpen}
            suffix="%" borderKleur={kpi ? kleurRand(kpi.gem_open_rate, 'open') : ''}
            loading={ovLoading}
          />
          <KpiKaart
            label="Gem. click rate" value={kpi?.gem_click_rate ?? 0}
            prev={kpi?.gem_click_rate_vorige ?? 0} icon={MousePointer}
            suffix="%" borderKleur={kpi ? kleurRand(kpi.gem_click_rate, 'click') : ''}
            loading={ovLoading}
          />
          <KpiKaart
            label="Uitschrijvingen" value={kpi?.uitschrijvingen ?? 0}
            prev={kpi?.uitschrijvingen_vorige ?? 0} icon={UserMinus}
            invertGoed loading={ovLoading}
          />
        </div>

        {/* ── Hoofdgrafiek ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">Prestaties over tijd</p>
          {ovLoading ? (
            <div className="h-56 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-slate-300 animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-300">
              <BarChart2 className="h-10 w-10 mb-2" />
              <p className="text-sm">Geen data in deze periode</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#94A3B8' }} domain={[0, 100]} />
                <RechartTooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Open rate' || name === 'Click rate') return [`${value}%`, name];
                    return [value.toLocaleString('nl-NL'), name];
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar yAxisId="left" dataKey="verzonden" name="Verzonden" fill="#BFDBFE" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="open_rate" name="Open rate"
                  stroke="#7C3AED" strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="click_rate" name="Click rate"
                  stroke="#059669" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Rij 3: Campagne ranglijst + Branche prestaties ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Campagne ranglijst */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Campagne ranglijst</p>
              <span className="text-xs text-slate-400">{campagnesData?.total ?? 0} campagnes</span>
            </div>

            {campLoading ? (
              <div className="p-5 space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (campagnesData?.campagnes?.length ?? 0) === 0 ? (
              <div className="py-16 text-center text-slate-300">
                <BarChart2 className="h-10 w-10 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Nog geen campagnes verzonden in deze periode</p>
                <p className="text-xs text-slate-300 mt-1">Probeer een andere periode te selecteren</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-3 font-semibold text-slate-400 w-6">#</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-400 cursor-pointer hover:text-slate-600"
                          onClick={() => handleSort('naam')}>
                          <span className="flex items-center gap-1">
                            Campagne {sortBy === 'naam' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                          </span>
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-400 cursor-pointer hover:text-slate-600"
                          onClick={() => handleSort('verzonden')}>
                          <span className="flex items-center justify-end gap-1">
                            Verzonden {sortBy === 'verzonden' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                          </span>
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-400 cursor-pointer hover:text-slate-600"
                          onClick={() => handleSort('open_rate')}>
                          <span className="flex items-center justify-end gap-1">
                            Open {sortBy === 'open_rate' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                          </span>
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-400 cursor-pointer hover:text-slate-600"
                          onClick={() => handleSort('click_rate')}>
                          <span className="flex items-center justify-end gap-1">
                            Click {sortBy === 'click_rate' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                          </span>
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-400 cursor-pointer hover:text-slate-600"
                          onClick={() => handleSort('datum')}>
                          <span className="flex items-center justify-end gap-1">
                            Datum {sortBy === 'datum' && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {campagnesData!.campagnes.map((c, idx) => (
                        <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors cursor-pointer">
                          <td className="px-4 py-3 text-slate-300 font-medium">{(page - 1) * 10 + idx + 1}</td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-slate-700 truncate max-w-[200px]">{c.naam}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-slate-400 capitalize">{c.type}</span>
                                {c.abTestActief && <span className="text-purple-400"><FlaskConical className="h-2.5 w-2.5 inline" /> A/B</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 font-medium">{c.verzonden.toLocaleString('nl-NL')}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${kleurDot(c.open_rate, 'open')}`}>{c.open_rate}%</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${kleurDot(c.click_rate, 'click')}`}>{c.click_rate}%</span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400">
                            {c.datum ? new Date(c.datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="px-5 py-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Pagina {page} van {totalPages}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="h-3.5 w-3.5" /> Vorige
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                        Volgende <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Branche prestaties */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <p className="text-sm font-semibold text-slate-700">Branche prestaties</p>
            </div>
            <div className="p-5">
              {ovLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : brancheData.length === 0 ? (
                <div className="py-10 text-center text-slate-300">
                  <p className="text-sm">Geen branche data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {brancheData.map(b => (
                    <div key={b.branche}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-600">{b.branche}</span>
                        <span className="text-slate-400">{b.bereikt.toLocaleString('nl-NL')} bereikt</span>
                      </div>
                      {/* Open rate bar */}
                      <div className="relative mb-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="h-2 rounded-full bg-purple-500 transition-all"
                              style={{ width: `${Math.min(100, (b.open_rate / maxBrancheRate) * 100)}%` }} />
                          </div>
                          <span className={`text-xs font-semibold w-10 text-right ${kleurDot(b.open_rate, 'open')}`}>{b.open_rate}%</span>
                        </div>
                      </div>
                      {/* Click rate bar */}
                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${Math.min(100, (b.click_rate / maxBrancheRate) * 100)}%` }} />
                          </div>
                          <span className={`text-xs font-medium w-10 text-right ${kleurDot(b.click_rate, 'click')}`}>{b.click_rate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Legenda */}
                  <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <div className="w-3 h-2 bg-purple-500 rounded-full" />Open rate
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <div className="w-3 h-1.5 bg-emerald-500 rounded-full" />Click rate
                    </div>
                  </div>
                </div>
              )}

              {/* Branche tabel */}
              {brancheData.length > 0 && (
                <div className="mt-4 border-t border-slate-50 pt-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-left py-1.5 font-medium">Branche</th>
                        <th className="text-right py-1.5 font-medium">Camp.</th>
                        <th className="text-right py-1.5 font-medium">Open</th>
                        <th className="text-right py-1.5 font-medium">Click</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brancheData.map(b => (
                        <tr key={b.branche} className="border-t border-slate-50">
                          <td className="py-1.5 text-slate-600 font-medium">{b.branche}</td>
                          <td className="py-1.5 text-right text-slate-400">{b.campagnes}</td>
                          <td className={`py-1.5 text-right font-semibold ${kleurDot(b.open_rate, 'open')}`}>{b.open_rate}%</td>
                          <td className={`py-1.5 text-right font-semibold ${kleurDot(b.click_rate, 'click')}`}>{b.click_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recente activiteit ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Recente activiteit</p>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => activityQ.refetch()}>
              <RefreshCw className={`h-3 w-3 mr-1 ${activityQ.isLoading ? 'animate-spin' : ''}`} />
              Vernieuwen
            </Button>
          </div>

          {activityQ.isLoading ? (
            <div className="p-5 space-y-2">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (activityData?.activiteiten?.length ?? 0) === 0 ? (
            <div className="py-16 text-center text-slate-300">
              <Eye className="h-10 w-10 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nog geen activiteit beschikbaar</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-50">
                {activityData!.activiteiten.map(a => {
                  const naam = a.contact_naam || a.email.split('@')[0];
                  const bedrijf = a.contact_bedrijf;
                  return (
                    <div key={a.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                      <span className="mt-0.5 text-base">{activiteitIcoon(a.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium text-slate-800">{naam}</span>
                          {bedrijf && <span className="text-slate-400"> ({bedrijf})</span>}
                          {' '}
                          {a.type === 'open' && 'opende'}
                          {a.type === 'click' && 'klikte op'}
                          {a.type === 'unsubscribe' && 'schreef zich uit van'}
                          {a.type === 'sent' && 'ontving'}
                          {' '}
                          <span className="font-medium text-slate-700">"{a.campaign_name}"</span>
                          {a.type === 'click' && a.url && (
                            <span className="text-xs text-slate-400 ml-1 truncate max-w-[200px] inline-block align-bottom">
                              — {a.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 40)}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-slate-300 flex-shrink-0 mt-0.5">{tijdGeleden(a.timestamp)}</span>
                    </div>
                  );
                })}
              </div>
              {(activityData?.total ?? 0) > activityOffset + 20 && (
                <div className="px-5 py-3 border-t border-slate-50">
                  <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500"
                    onClick={handleMeerActiviteit}>
                    Meer laden <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Leeg state — helemaal geen data */}
        {!ovLoading && kpi?.totaal_verzonden === 0 && (campagnesData?.total ?? 0) === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <BarChart2 className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Nog geen statistieken beschikbaar</h3>
            <p className="text-sm text-slate-400 mb-6">Verstuur je eerste campagne om statistieken te zien</p>
            <Button className="bg-purple-600 hover:bg-purple-700 gap-2" size="sm">
              <ArrowRight className="h-3.5 w-3.5" />Ga naar Campagnes
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
