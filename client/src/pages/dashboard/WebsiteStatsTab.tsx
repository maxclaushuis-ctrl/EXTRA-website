import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  TrendingUp, TrendingDown, Users, FileText, CheckCircle2, XCircle,
  Clock, BarChart3, Target, AlertCircle, Info, ExternalLink,
  ChefHat, Building2, Sparkles, Calendar, Upload
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Candidate = {
  id: number;
  firstName: string;
  lastName: string;
  status: string;
  functionType: string;
  hasCv: boolean;
  createdAt: string;
  nationality?: string | null;
};

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  status: string;
  category: string;
  author: string;
  readTime: string;
  createdAt: string;
  publishedAt?: string | null;
  focusKeyword?: string | null;
};

type StaffingRequest = {
  id: number;
  companyName: string;
  status: string;
  createdAt: string;
};

// ─── Shared helpers ─────────────────────────────────────────────────────────────

type KpiColor = 'purple' | 'green' | 'blue' | 'amber' | 'rose' | 'gray';
const colorMap: Record<KpiColor, { bg: string; text: string; icon: string }> = {
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-500'  },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-500'   },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'text-amber-500'  },
  rose:   { bg: 'bg-rose-50',   text: 'text-rose-700',   icon: 'text-rose-500'   },
  gray:   { bg: 'bg-gray-50',   text: 'text-gray-600',   icon: 'text-gray-400'   },
};

function KpiCard({ icon: Icon, label, value, sub, color, isLoading }: {
  icon: any; label: string; value: string | number; sub?: string; color: KpiColor; isLoading?: boolean;
}) {
  const c = colorMap[color];
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className={`p-2 rounded-lg ${c.bg} w-fit mb-3`}>
          <Icon className={`h-4 w-4 ${c.icon}`} />
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <div className={`text-3xl font-bold ${c.text} mb-1 leading-none`}>{value}</div>
        )}
        <div className="text-sm font-medium text-gray-600">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wider mb-4">{children}</h2>;
}

function InsightCard({ type, title, text }: { type: 'warning' | 'success' | 'info'; title: string; text: string }) {
  const styles = {
    warning: { bg: 'bg-amber-50 border-amber-100', title: 'text-amber-800', text: 'text-amber-700', icon: <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> },
    success: { bg: 'bg-green-50 border-green-100', title: 'text-green-800', text: 'text-green-700', icon: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> },
    info:    { bg: 'bg-blue-50 border-blue-100',   title: 'text-blue-800',  text: 'text-blue-700',  icon: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /> },
  };
  const s = styles[type];
  return (
    <div className={`rounded-xl border p-4 ${s.bg}`}>
      <div className={`flex items-start gap-2 mb-1.5 text-sm font-semibold ${s.title}`}>{s.icon}{title}</div>
      <p className={`text-xs leading-relaxed ${s.text}`}>{text}</p>
    </div>
  );
}

function Ga4Banner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <Info className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Websiteverkeer vereist Google Analytics 4</p>
        <p className="text-xs text-amber-700 mt-0.5">Paginabezoekers, bounce rates, verkeersbronnen en apparaatdata zijn alleen beschikbaar na koppeling met GA4. De cijfers hieronder komen rechtstreeks uit de EXTRA-database.</p>
      </div>
    </div>
  );
}

function FunnelBar({ label, count, total, color, note }: { label: string; count: number; total: number; color: string; note?: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-40 text-sm text-gray-600 text-right shrink-0">
        {label}
        {note && <span className="block text-xs text-gray-400">{note}</span>}
      </div>
      <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(pct, 3)}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-700">
          {count.toLocaleString()}
        </span>
      </div>
      <div className="w-12 text-sm font-semibold text-gray-500 shrink-0">{pct}%</div>
    </div>
  );
}

// Helper: group candidates by month
function groupByMonth(candidates: Candidate[]) {
  const map: Record<string, { label: string; aanmeldingen: number; metCv: number; aangenomen: number }> = {};
  candidates.forEach(c => {
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' });
    if (!map[key]) map[key] = { label, aanmeldingen: 0, metCv: 0, aangenomen: 0 };
    map[key].aanmeldingen++;
    if (c.hasCv) map[key].metCv++;
    if (c.status === 'aangenomen') map[key].aangenomen++;
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

// ─── Tab 1: Overzicht ──────────────────────────────────────────────────────────

function TabOverzicht({ candidates, staffingRequests, blogs, isLoading }: {
  candidates: Candidate[]; staffingRequests: StaffingRequest[]; blogs: BlogPost[]; isLoading: boolean;
}) {
  const now = new Date();
  const last7 = candidates.filter(c => (now.getTime() - new Date(c.createdAt).getTime()) < 7 * 86400000).length;
  const last30 = candidates.filter(c => (now.getTime() - new Date(c.createdAt).getTime()) < 30 * 86400000).length;
  const aangenomen = candidates.filter(c => c.status === 'aangenomen').length;
  const afgewezen = candidates.filter(c => c.status === 'afgewezen').length;
  const inBehandeling = candidates.filter(c => c.status === 'in_behandeling').length;
  const metCv = candidates.filter(c => c.hasCv).length;
  const published = blogs.filter(b => b.status === 'published').length;
  const horeca = candidates.filter(c => c.functionType === 'horecamedewerker').length;
  const chef = candidates.filter(c => c.functionType === 'chef').length;
  const housekeeping = candidates.filter(c => c.functionType === 'housekeeping').length;

  const monthlyData = useMemo(() => groupByMonth(candidates), [candidates]);

  const functionData = [
    { name: 'Horecamedewerker', value: horeca, color: '#7c3aed' },
    { name: 'Chef', value: chef, color: '#a78bfa' },
    { name: 'Housekeeping', value: housekeeping, color: '#c4b5fd' },
    { name: 'Overig', value: candidates.length - horeca - chef - housekeeping, color: '#ede9fe' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <Ga4Banner />

      {/* KPIs */}
      <section>
        <SectionTitle>Aanmeldingen — live data</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <KpiCard icon={Users}       label="Totaal aanmeldingen"    value={candidates.length} sub="alle tijden"            color="purple" isLoading={isLoading} />
          <KpiCard icon={Calendar}    label="Afgelopen 7 dagen"      value={last7}             sub="nieuwe aanmeldingen"    color="blue"   isLoading={isLoading} />
          <KpiCard icon={Calendar}    label="Afgelopen 30 dagen"     value={last30}            sub="nieuwe aanmeldingen"    color="blue"   isLoading={isLoading} />
          <KpiCard icon={Clock}       label="In behandeling"         value={inBehandeling}     sub="wachten op review"      color="amber"  isLoading={isLoading} />
          <KpiCard icon={CheckCircle2} label="Aangenomen"            value={aangenomen}        sub="kandidaten"             color="green"  isLoading={isLoading} />
          <KpiCard icon={XCircle}     label="Afgewezen"              value={afgewezen}         sub="kandidaten"             color="rose"   isLoading={isLoading} />
          <KpiCard icon={Upload}      label="CV geüpload"            value={metCv}             sub="aanmeldingen compleet"  color="purple" isLoading={isLoading} />
          <KpiCard icon={Building2}   label="Personeelsaanvragen"    value={staffingRequests.length} sub="van werkgevers"   color="blue"   isLoading={isLoading} />
          <KpiCard icon={FileText}    label="Gepubliceerde blogs"    value={published}         sub="actieve artikelen"      color="green"  isLoading={isLoading} />
          <KpiCard icon={ChefHat}     label="Horecamedewerkers"      value={horeca}            sub="van alle aanmeldingen"  color="purple" isLoading={isLoading} />
          <KpiCard icon={ChefHat}     label="Chefs"                  value={chef}              sub="van alle aanmeldingen"  color="purple" isLoading={isLoading} />
          <KpiCard icon={Sparkles}    label="Housekeeping"           value={housekeeping}      sub="van alle aanmeldingen"  color="amber"  isLoading={isLoading} />
        </div>
      </section>

      {/* Grafieken */}
      <section>
        <SectionTitle>Aanmeldingen per maand</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-0 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Aanmeldingen over tijd</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 px-2 pb-4">
              {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="aanmeldingen" fill="#7c3aed" name="Aanmeldingen" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="metCv" fill="#a78bfa" name="Met CV" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="aangenomen" fill="#22c55e" name="Aangenomen" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-0 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Verdeling per functie</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={functionData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                        {functionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-1">
                    {functionData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                          <span className="text-gray-600">{d.name}</span>
                        </div>
                        <span className="font-semibold text-gray-700">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Status verdeling */}
      <section>
        <SectionTitle>Status verdeling</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">In behandeling</span>
                <span className="text-sm font-bold text-amber-700">{candidates.length > 0 ? Math.round((inBehandeling / candidates.length) * 100) : 0}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${candidates.length > 0 ? (inBehandeling / candidates.length) * 100 : 0}%` }} />
              </div>
              <div className="text-2xl font-bold text-amber-700 mt-3">{inBehandeling}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Aangenomen</span>
                <span className="text-sm font-bold text-green-700">{candidates.length > 0 ? Math.round((aangenomen / candidates.length) * 100) : 0}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: `${candidates.length > 0 ? (aangenomen / candidates.length) * 100 : 0}%` }} />
              </div>
              <div className="text-2xl font-bold text-green-700 mt-3">{aangenomen}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Afgewezen</span>
                <span className="text-sm font-bold text-rose-700">{candidates.length > 0 ? Math.round((afgewezen / candidates.length) * 100) : 0}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-400 rounded-full" style={{ width: `${candidates.length > 0 ? (afgewezen / candidates.length) * 100 : 0}%` }} />
              </div>
              <div className="text-2xl font-bold text-rose-700 mt-3">{afgewezen}</div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

// ─── Tab 2: Formulier conversies ──────────────────────────────────────────────

function TabConversies({ candidates, isLoading }: { candidates: Candidate[]; isLoading: boolean }) {
  const metCv = candidates.filter(c => c.hasCv).length;
  const aangenomen = candidates.filter(c => c.status === 'aangenomen').length;
  const total = candidates.length;
  const cvPct = total > 0 ? Math.round((metCv / total) * 100) : 0;
  const aangenomenPct = total > 0 ? Math.round((aangenomen / total) * 100) : 0;

  const funnelData = [
    { stap: 'In DB', count: total },
    { stap: 'CV geüpload', count: metCv },
    { stap: 'Aangenomen', count: aangenomen },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Deels beschikbare data</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Hoeveel mensen de pagina bezochten en het formulier startten is alleen meetbaar via Google Analytics 4.
            Hieronder zien we de stappen die wel in de database staan: aanmeldingen in het systeem, CV uploads en aannames.
          </p>
        </div>
      </div>

      {/* Funnel */}
      <section>
        <SectionTitle>Aanmeldfunnel werkzoekenden — database data</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-base font-semibold text-gray-800">Funnel overzicht</CardTitle>
              <p className="text-sm text-gray-500">Op basis van kandidaatdata in de database</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {isLoading ? <Skeleton className="h-32 w-full" /> : (
                <>
                  <div className="mb-2 text-xs text-gray-400 flex items-center gap-1"><Info className="h-3 w-3" /> Paginabezoek en formulierstart: GA4 vereist</div>
                  <FunnelBar label="Aangemeld in systeem"  count={total}     total={total} color="bg-purple-500" />
                  <FunnelBar label="CV geüpload"           count={metCv}     total={total} color="bg-purple-300" note={`${cvPct}% van aanmeldingen`} />
                  <FunnelBar label="Aangenomen"            count={aangenomen} total={total} color="bg-green-400" note={`${aangenomenPct}% van aanmeldingen`} />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-base font-semibold text-gray-800">Conversie grafiek</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {isLoading ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={funnelData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="stap" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7c3aed" name="Aantal" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CV upload trend per maand */}
      <section>
        <SectionTitle>CV uploads per maand</SectionTitle>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 px-2 pb-4">
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={groupByMonth(candidates)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="aanmeldingen" stroke="#7c3aed" strokeWidth={2} name="Aanmeldingen" dot={false} />
                  <Line type="monotone" dataKey="metCv" stroke="#22c55e" strokeWidth={2} name="CV geüpload" dot={false} />
                  <Line type="monotone" dataKey="aangenomen" stroke="#f59e0b" strokeWidth={2} name="Aangenomen" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Inzichten */}
      <section>
        <SectionTitle>Inzichten</SectionTitle>
        {isLoading ? <Skeleton className="h-24 w-full" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InsightCard
              type={cvPct < 30 ? 'warning' : 'success'}
              title={`${cvPct}% van aanmeldingen heeft een CV geüpload`}
              text={cvPct < 30
                ? 'De meeste kandidaten melden zich aan zonder CV. Overweeg de CV-stap eerder in het formulier te plaatsen of een duidelijkere CTA toe te voegen.'
                : 'Een groot deel van de kandidaten uploadt een CV. Het aanmeldingsproces lijkt goed te werken.'
              }
            />
            <InsightCard
              type={aangenomenPct < 10 ? 'info' : 'success'}
              title={`${aangenomenPct}% conversieratio aanmelding → aangenomen`}
              text={`Van de ${total} aanmeldingen zijn er ${aangenomen} aangenomen. ${aangenomen === 0 ? 'Begin met het beoordelen van kandidaten via de Kandidaten tab.' : 'De selectie loopt.'}`}
            />
            <InsightCard
              type="info"
              title="Paginabezoek en formulierstart niet meetbaar"
              text="Om te zien hoeveel mensen de aanmeldpagina bezoeken maar afhaken, is Google Analytics 4 nodig. Koppel GA4 om de volledige funnel te zien."
            />
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Tab 3: Pagina prestaties ─────────────────────────────────────────────────

function TabPaginas() {
  const pages = [
    { pagina: 'Homepage', url: '/' },
    { pagina: 'Ik zoek extra werk', url: '/ik-zoek-extra-werk' },
    { pagina: 'Aanmelden', url: '/aanmelden' },
    { pagina: 'Personeel gezocht', url: '/personeel-gezocht' },
    { pagina: 'Horeca personeel gezocht', url: '/horeca-personeel-gezocht' },
    { pagina: 'Hotelpersoneel inhuren', url: '/hotelpersoneel-inhuren' },
    { pagina: 'Eventpersoneel inhuren', url: '/eventpersoneel-inhuren' },
    { pagina: 'Cateringpersoneel inhuren', url: '/cateringpersoneel-inhuren' },
    { pagina: 'Horecapersoneel restaurants', url: '/horecapersoneel-restaurants' },
    { pagina: 'Horeca uitzendbureau Amsterdam', url: '/horeca-uitzendbureau-amsterdam' },
    { pagina: 'Horeca personeel Amsterdam', url: '/horeca-personeel-amsterdam' },
    { pagina: 'Horeca vacatures Amsterdam', url: '/horeca-vacatures-amsterdam' },
    { pagina: 'Housekeeping vacatures', url: '/housekeeping-vacatures-amsterdam' },
    { pagina: 'Chef vacatures Amsterdam', url: '/chef-vacatures-amsterdam' },
    { pagina: 'Blog overzicht', url: '/nieuws' },
    { pagina: 'Contact', url: '/contact' },
    { pagina: 'Vacatures overzicht', url: '/vacatures' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-base font-semibold text-amber-800 mb-1">Google Analytics 4 vereist voor paginadata</p>
            <p className="text-sm text-amber-700 mb-3">
              Paginabezoekers, bounce rates, gemiddelde tijd op pagina en verkeersbronnen per pagina zijn niet beschikbaar zonder GA4.
              Hieronder staan alle pagina-URLs die getrackt moeten worden na koppeling.
            </p>
            <div className="text-sm text-amber-800 font-medium mb-2">Wat GA4 je geeft per pagina:</div>
            <ul className="text-sm text-amber-700 space-y-1 list-disc pl-4">
              <li>Aantal bezoekers en pageviews per URL</li>
              <li>Gemiddelde tijd op pagina</li>
              <li>Bounce rate (verlaten zonder actie)</li>
              <li>Verkeersbron (Google, direct, social)</li>
              <li>Apparaat (mobiel vs desktop)</li>
              <li>Conversies per pagina (bijv. formulier ingevuld)</li>
            </ul>
          </div>
        </div>
      </div>

      <section>
        <SectionTitle>Pagina-URLs om te tracken in GA4</SectionTitle>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagina</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">URL</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Views</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bounce</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gem. tijd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pages.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-700">{p.pagina}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 font-mono">{p.url}</td>
                    <td className="px-4 py-3 text-center"><span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">GA4 vereist</span></td>
                    <td className="px-4 py-3 text-center"><span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">GA4 vereist</span></td>
                    <td className="px-4 py-3 text-center"><span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">GA4 vereist</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>Koppeling instellen</SectionTitle>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-4">
            {[
              { step: '1', title: 'Maak een GA4 property aan', text: 'Ga naar analytics.google.com → maak een nieuwe property aan voor doehetextra.nl' },
              { step: '2', title: 'Voeg de GA4 tracking code toe', text: 'Plaats de gtag.js snippet in de <head> van alle paginas, of gebruik Google Tag Manager' },
              { step: '3', title: 'Stel doelen in', text: 'Maak conversiedoelen aan voor: formulier ingevuld, CV geüpload, WhatsApp klik, telefoon klik' },
              { step: '4', title: 'Koppel aan dit dashboard', text: 'Na koppeling via de GA4 API verschijnen hier automatisch live bezoekerscijfers per pagina' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-sm font-bold flex items-center justify-center shrink-0">{s.step}</div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{s.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.text}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ─── Tab 4: SEO & Content ─────────────────────────────────────────────────────

function TabSeo({ blogs, isLoading }: { blogs: BlogPost[]; isLoading: boolean }) {
  const published = blogs.filter(b => b.status === 'published');
  const drafts = blogs.filter(b => b.status === 'draft');
  const scheduled = blogs.filter(b => b.status === 'scheduled');

  return (
    <div className="space-y-8">

      {/* Blog statistieken */}
      <section>
        <SectionTitle>Blog overzicht — live data</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <KpiCard icon={FileText}    label="Totaal artikelen" value={blogs.length}     color="purple" isLoading={isLoading} />
          <KpiCard icon={CheckCircle2} label="Gepubliceerd"    value={published.length} color="green"  isLoading={isLoading} />
          <KpiCard icon={Calendar}    label="Ingepland"        value={scheduled.length} color="amber"  isLoading={isLoading} />
          <KpiCard icon={FileText}    label="Concepten"        value={drafts.length}    color="gray"   isLoading={isLoading} />
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Artikel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Categorie</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Focus keyword</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Leestijd</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Views</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CTR</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Gepubliceerd</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {published.map((b, i) => (
                    <tr key={b.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-sm font-bold flex items-center justify-center">{i + 1}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-sm font-semibold text-gray-800">{b.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5 font-mono">/nieuws/{b.slug}</div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">{b.category}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 hidden md:table-cell max-w-48 truncate">
                        {b.focusKeyword || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-gray-500 hidden sm:table-cell">{b.readTime}</td>
                      <td className="px-4 py-3.5 text-center"><span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">GA4 vereist</span></td>
                      <td className="px-4 py-3.5 text-center"><span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">GSC vereist</span></td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 hidden lg:table-cell">
                        {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                  {published.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-8 text-center text-gray-400 text-sm">Geen gepubliceerde artikelen</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {/* SEO sectie */}
      <section>
        <SectionTitle>SEO data — zoekwoorden en posities</SectionTitle>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-base font-semibold text-amber-800 mb-1">Google Search Console vereist</p>
              <p className="text-sm text-amber-700 mb-3">
                Zoekwoordposities, impressies, klikken en CTR in Google zijn alleen beschikbaar via de Search Console API.
              </p>
              <div className="text-sm text-amber-800 font-medium mb-2">Na koppeling Search Console zie je:</div>
              <ul className="text-sm text-amber-700 space-y-1 list-disc pl-4">
                <li>Gemiddelde positie per zoekwoord in Google</li>
                <li>Aantal keer dat doehetextra.nl getoond wordt (impressies)</li>
                <li>Klikken vanuit Google per pagina en keyword</li>
                <li>Click-through rate (CTR) per zoekwoord</li>
                <li>Welke blogs organisch verkeer aantrekken</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integraties */}
      <section>
        <SectionTitle>Benodigde koppelingen</SectionTitle>
        <Card className="border-0 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tool</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Wat het biedt</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { naam: 'Interne database', info: 'Aanmeldingen, CV uploads, statussen, blogs, personeelsaanvragen', actief: true },
                { naam: 'Google Analytics 4', info: 'Websitebezoekers, paginaweergaven, bounce rate, apparaten, verkeersbronnen', actief: false },
                { naam: 'Google Search Console', info: 'Zoekwoorden, posities in Google, impressies, klikken, CTR', actief: false },
                { naam: 'Hotjar / MS Clarity', info: 'Heatmaps, sessie-opnames, scroll depth, afhakpunten in formulieren', actief: false },
                { naam: 'Meta Pixel', info: 'Social media campagne-attributie en retargeting', actief: false },
              ].map((s, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">{s.naam}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell">{s.info}</td>
                  <td className="px-5 py-3.5 text-center">
                    {s.actief ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Actief
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full border border-gray-200 font-medium">
                        <ExternalLink className="h-3 w-3" /> Koppelen
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overzicht',   label: 'Overzicht'           },
  { id: 'conversies',  label: 'Aanmeldingen'         },
  { id: 'paginas',     label: 'Pagina prestaties'    },
  { id: 'seo',         label: 'SEO & Content'        },
] as const;

type TabId = typeof TABS[number]['id'];

export default function WebsiteStatsTab() {
  const [activeTab, setActiveTab] = useState<TabId>('overzicht');

  const { data: candidatesData, isLoading: candidatesLoading } = useQuery<{ candidates: Candidate[] }>({
    queryKey: ['/api/admin/candidates'],
  });
  const { data: blogData, isLoading: blogLoading } = useQuery<{ posts: BlogPost[]; total: number }>({
    queryKey: ['/api/admin/blog'],
  });
  const { data: staffingData, isLoading: staffingLoading } = useQuery<StaffingRequest[]>({
    queryKey: ['/api/admin/staffing-requests'],
  });

  const candidates = candidatesData?.candidates ?? [];
  const blogs = blogData?.posts ?? [];
  const staffingRequests = staffingData ?? [];
  const isLoading = candidatesLoading || blogLoading || staffingLoading;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <div className="mb-5">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <BarChart3 className="h-6 w-6 text-purple-600" /> Website Statistieken
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Prestaties en conversies van doehetextra.nl</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — alleen actieve tab rendert */}
      <div className="p-6 flex-1">
        {activeTab === 'overzicht'  && <TabOverzicht  candidates={candidates} staffingRequests={staffingRequests} blogs={blogs} isLoading={isLoading} />}
        {activeTab === 'conversies' && <TabConversies candidates={candidates} isLoading={isLoading} />}
        {activeTab === 'paginas'    && <TabPaginas />}
        {activeTab === 'seo'        && <TabSeo blogs={blogs} isLoading={isLoading} />}
      </div>
    </div>
  );
}
