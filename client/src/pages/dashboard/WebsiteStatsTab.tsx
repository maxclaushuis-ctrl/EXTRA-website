import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Eye, Clock, MousePointerClick,
  Globe, Smartphone, Monitor, Search, Share2, MessageCircle, Phone,
  FileText, BarChart3, Target, Lightbulb, AlertCircle, CheckCircle2,
  ArrowRight, Info, ExternalLink, ChevronRight
} from 'lucide-react';

// ─── Placeholder data ──────────────────────────────────────────────────────────

const dailyVisitors = [
  { dag: 'Ma', bezoekers: 142, uniek: 118 },
  { dag: 'Di', bezoekers: 198, uniek: 161 },
  { dag: 'Wo', bezoekers: 231, uniek: 187 },
  { dag: 'Do', bezoekers: 176, uniek: 143 },
  { dag: 'Vr', bezoekers: 284, uniek: 229 },
  { dag: 'Za', bezoekers: 112, uniek: 94 },
  { dag: 'Zo', bezoekers: 89, uniek: 72 },
];

const weeklyVisitors = [
  { week: 'Week 1', bezoekers: 1204, uniek: 978 },
  { week: 'Week 2', bezoekers: 1387, uniek: 1122 },
  { week: 'Week 3', bezoekers: 1056, uniek: 871 },
  { week: 'Week 4', bezoekers: 1541, uniek: 1248 },
];

const monthlyVisitors = [
  { maand: 'Sep', bezoekers: 3241, uniek: 2617 },
  { maand: 'Okt', bezoekers: 3876, uniek: 3124 },
  { maand: 'Nov', bezoekers: 4102, uniek: 3318 },
  { maand: 'Dec', bezoekers: 3587, uniek: 2901 },
  { maand: 'Jan', bezoekers: 4214, uniek: 3409 },
  { maand: 'Feb', bezoekers: 4891, uniek: 3954 },
  { maand: 'Mar', bezoekers: 5188, uniek: 4193 },
];

const trafficSources = [
  { name: 'Google Organisch', value: 48, color: '#7c3aed' },
  { name: 'Direct', value: 22, color: '#a78bfa' },
  { name: 'Social Media', value: 15, color: '#c4b5fd' },
  { name: 'Referral', value: 9, color: '#ddd6fe' },
  { name: 'Betaald', value: 6, color: '#ede9fe' },
];

const deviceSplit = [
  { name: 'Mobiel', value: 61, color: '#7c3aed' },
  { name: 'Desktop', value: 33, color: '#a78bfa' },
  { name: 'Tablet', value: 6, color: '#ddd6fe' },
];

const topPages = [
  { pagina: 'Homepage', url: '/', views: 5188, uniek: 4193, tijd: '1:42', bounce: '38%', type: 'Landing', doelgroep: 'Beide' },
  { pagina: 'Ik zoek extra werk', url: '/ik-zoek-extra-werk', views: 2341, uniek: 1987, tijd: '2:18', bounce: '29%', type: 'Landing', doelgroep: 'Werkzoekenden' },
  { pagina: 'Aanmelden', url: '/aanmelden', views: 1876, uniek: 1654, tijd: '3:47', bounce: '21%', type: 'Formulier', doelgroep: 'Werkzoekenden' },
  { pagina: 'Personeel gezocht', url: '/personeel-gezocht', views: 1432, uniek: 1289, tijd: '1:55', bounce: '44%', type: 'Landing', doelgroep: 'Werkgevers' },
  { pagina: 'Horeca uitzendbureau Amsterdam', url: '/horeca-uitzendbureau-amsterdam', views: 1187, uniek: 1043, tijd: '2:31', bounce: '35%', type: 'SEO Pillar', doelgroep: 'Werkgevers' },
  { pagina: 'Horeca vacatures Amsterdam', url: '/horeca-vacatures-amsterdam', views: 943, uniek: 851, tijd: '1:48', bounce: '41%', type: 'Landing', doelgroep: 'Werkzoekenden' },
  { pagina: 'Blog overzicht', url: '/nieuws', views: 721, uniek: 634, tijd: '1:22', bounce: '52%', type: 'Blog', doelgroep: 'Beide' },
  { pagina: 'Hotelpersoneel inhuren', url: '/hotelpersoneel-inhuren', views: 612, uniek: 548, tijd: '2:04', bounce: '39%', type: 'SEO', doelgroep: 'Werkgevers' },
];

const blogPerformance = [
  { titel: 'Hoe werkt een horeca uitzendbureau?', views: 412, tijd: '3:12', organisch: 78, conversie: 4.2, keyword: 'horeca uitzendbureau amsterdam' },
  { titel: 'Flexibel werken in de horeca: alles wat je moet weten', views: 387, tijd: '2:48', organisch: 65, conversie: 2.8, keyword: 'flexibel horeca personeel' },
  { titel: 'Waarom kiezen voor tijdelijk hotelpersoneel?', views: 298, tijd: '2:33', organisch: 71, conversie: 3.6, keyword: 'hotelpersoneel amsterdam' },
  { titel: 'NEN 4400 1 en wat het betekent voor jou', views: 241, tijd: '4:01', organisch: 82, conversie: 1.9, keyword: 'nen 4400 uitzendbureau' },
  { titel: 'De beste evenementen locaties in Amsterdam', views: 198, tijd: '1:57', organisch: 44, conversie: 1.2, keyword: 'evenementen personeel amsterdam' },
];

const seoKeywords = [
  { keyword: 'horeca uitzendbureau amsterdam', positie: 4, impressies: 2841, klikken: 312, ctr: '11.0%', trend: 'up' },
  { keyword: 'horeca personeel inhuren', positie: 7, impressies: 1923, klikken: 148, ctr: '7.7%', trend: 'up' },
  { keyword: 'flexibel horeca personeel', positie: 11, impressies: 1247, klikken: 76, ctr: '6.1%', trend: 'stable' },
  { keyword: 'hotelpersoneel amsterdam', positie: 9, impressies: 987, klikken: 72, ctr: '7.3%', trend: 'up' },
  { keyword: 'evenementen personeel amsterdam', positie: 14, impressies: 743, klikken: 38, ctr: '5.1%', trend: 'down' },
  { keyword: 'horeca vacatures amsterdam', positie: 6, impressies: 2104, klikken: 241, ctr: '11.5%', trend: 'up' },
];

const recommendations = [
  { type: 'warning', icon: AlertCircle, title: '/aanmelden heeft hoge uitval bij stap 2', text: '38% van de bezoekers die stap 1 invullen verlaten het formulier bij stap 2 (Skills). Overweeg de stap te vereenvoudigen.', actie: 'Bekijk formulier analytics' },
  { type: 'success', icon: CheckCircle2, title: 'Blog "Hoe werkt een horeca uitzendbureau?" presteert uitstekend', text: '82% van het verkeer komt organisch via Google. De pagina converteert 4,2% naar aanmeldingen.', actie: 'Schrijf vergelijkbare content' },
  { type: 'info', icon: Info, title: 'Mobiele bezoekers haken vaker af bij formulieren', text: '61% van de bezoekers gebruikt mobiel, maar de formulier-conversie op mobiel is 18% lager dan op desktop.', actie: 'Test mobiele UX' },
  { type: 'warning', icon: AlertCircle, title: 'Personeelsaanvraagpagina heeft hoge bounce rate (44%)', text: 'Bezoekers verlaten de pagina snel. Voeg social proof toe of een directe WhatsApp CTA boven de voud.', actie: 'Optimaliseer pagina' },
  { type: 'success', icon: CheckCircle2, title: 'Google organisch verkeer groeide 18% deze maand', text: 'De SEO pillar paginas trekken steeds meer verkeer. /horeca-uitzendbureau-amsterdam staat nu op positie 4.', actie: 'Bekijk SEO rapport' },
];

const integrationSources: { naam: string; beschrijving: string; beschikbaar: boolean; kleur: string }[] = [
  { naam: 'Google Analytics 4', beschrijving: 'Bezoekers, gedrag, conversies, apparaten, locaties', beschikbaar: false, kleur: 'orange' },
  { naam: 'Google Search Console', beschrijving: 'Impressies, klikken, CTR, gemiddelde positie in Google', beschikbaar: false, kleur: 'blue' },
  { naam: 'Database (intern)', beschrijving: 'Aanmeldingen, CV uploads, kandidaatstatus', beschikbaar: true, kleur: 'green' },
  { naam: 'Hotjar / MS Clarity', beschrijving: 'Heatmaps, sessie-opnames, scroll depth, rage clicks', beschikbaar: false, kleur: 'red' },
  { naam: 'Meta Pixel', beschrijving: 'Social media campagne-attributie en retargeting', beschikbaar: false, kleur: 'blue' },
  { naam: 'Leadinfo', beschrijving: 'Bedrijfsherkenning op basis van IP-adres (B2B bezoekers)', beschikbaar: false, kleur: 'purple' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, trend, color }: {
  icon: any; label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral'; color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-500'  },
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-500'   },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'text-amber-500'  },
    rose:   { bg: 'bg-rose-50',   text: 'text-rose-700',   icon: 'text-rose-500'   },
    sky:    { bg: 'bg-sky-50',    text: 'text-sky-700',    icon: 'text-sky-500'    },
  };
  const c = colorMap[color] ?? colorMap.purple;
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${c.bg}`}>
            <Icon className={`h-4 w-4 ${c.icon}`} />
          </div>
          {trend && (
            <span className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-rose-600' : 'text-gray-400'}`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
              {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
            </span>
          )}
        </div>
        <div className={`text-2xl font-bold ${c.text} mb-0.5`}>{value}</div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function DataSourceBadge({ beschikbaar, naam }: { beschikbaar: boolean; naam: string }) {
  return beschikbaar ? (
    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
      <CheckCircle2 className="h-3 w-3" /> {naam}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
      <Info className="h-3 w-3" /> Integratie nodig: {naam}
    </span>
  );
}

function FunnelBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-36 text-xs text-gray-600 text-right shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">{count.toLocaleString()}</span>
      </div>
      <div className="w-10 text-xs text-gray-400 shrink-0">{pct}%</div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function WebsiteStatsTab() {
  const [periode, setPeriode] = useState<'dag' | 'week' | 'maand'>('maand');
  const [pageFilter, setPageFilter] = useState('alle');
  const [doelgroepFilter, setDoelgroepFilter] = useState('alle');

  const chartData = periode === 'dag' ? dailyVisitors.map(d => ({ label: d.dag, bezoekers: d.bezoekers, uniek: d.uniek }))
    : periode === 'week' ? weeklyVisitors.map(d => ({ label: d.week, bezoekers: d.bezoekers, uniek: d.uniek }))
    : monthlyVisitors.map(d => ({ label: d.maand, bezoekers: d.bezoekers, uniek: d.uniek }));

  const filteredPages = topPages.filter(p => {
    const typeOk = pageFilter === 'alle' || p.type.toLowerCase().includes(pageFilter.toLowerCase());
    const doeOk = doelgroepFilter === 'alle' || p.doelgroep === doelgroepFilter || p.doelgroep === 'Beide';
    return typeOk && doeOk;
  });

  return (
    <div className="p-6 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" /> Website Statistieken
          </h1>
          <p className="text-sm text-gray-500">Overzicht van websiteprestaties, bezoekers en conversies</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Info className="h-3 w-3" /> Voorbeelddata — koppel GA4 voor live cijfers
          </span>
        </div>
      </div>

      {/* ── A. KPI Cards ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">KPI Overzicht — Afgelopen maand</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <KpiCard icon={Users}            label="Totale bezoekers"          value="5.188"  sub="deze maand"         trend="up"      color="purple" />
          <KpiCard icon={Users}            label="Unieke bezoekers"           value="4.193"  sub="+12% vs vorige maand" trend="up"    color="blue"   />
          <KpiCard icon={Clock}            label="Gem. tijd op site"          value="2:14"   sub="minuten"           trend="up"      color="green"  />
          <KpiCard icon={Eye}              label="Paginaweergaven"            value="14.841" sub="totaal"            trend="up"      color="sky"    />
          <KpiCard icon={TrendingDown}     label="Bounce rate"                value="37%"    sub="lager = beter"     trend="up"      color="green"  />
          <KpiCard icon={FileText}         label="Blogweergaven"              value="2.257"  sub="alle artikelen"    trend="up"      color="amber"  />
          <KpiCard icon={Target}           label="Bezoekers /aanmelden"       value="1.876"  sub="formulierpagina"   trend="up"      color="purple" />
          <KpiCard icon={Target}           label="Bezoekers personeelsaanvraag" value="641" sub="werkgevers"        trend="neutral" color="blue"   />
          <KpiCard icon={MousePointerClick} label="Ingediende formulieren"   value="214"    sub="aanmeldingen"      trend="up"      color="green"  />
          <KpiCard icon={TrendingUp}       label="Conversieratio aanmelden"   value="11,4%"  sub="bezoek → formulier" trend="up"    color="green"  />
          <KpiCard icon={MessageCircle}    label="WhatsApp klikken"           value="387"    sub="op alle paginas"   trend="up"      color="green"  />
          <KpiCard icon={Phone}            label="Telefoon klikken"           value="142"    sub="op alle paginas"   trend="neutral" color="amber"  />
          <KpiCard icon={Search}           label="Organisch (Google)"         value="2.489"  sub="48% van verkeer"   trend="up"      color="purple" />
          <KpiCard icon={Share2}           label="Social media verkeer"       value="778"    sub="15% van verkeer"   trend="up"      color="rose"   />
          <KpiCard icon={Globe}            label="Direct verkeer"             value="1.141"  sub="22% van verkeer"   trend="neutral" color="sky"    />
        </div>
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <Info className="h-3 w-3" /> Live data vereist koppeling met <strong>Google Analytics 4</strong>. Bovenstaande cijfers zijn voorbeelddata.
        </p>
      </section>

      {/* ── B. Verkeer & bezoekers ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Verkeer en bezoekers</h2>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
            {(['dag', 'week', 'maand'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriode(p)}
                className={`px-3 py-1.5 transition-colors ${periode === p ? 'bg-purple-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Lijndiagram bezoekers */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Bezoekers over tijd</CardTitle>
              <DataSourceBadge beschikbaar={false} naam="Google Analytics 4" />
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="bezoekers" stroke="#7c3aed" strokeWidth={2} dot={false} name="Totaal" />
                  <Line type="monotone" dataKey="uniek" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Uniek" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Verkeersbronnen */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Verkeersbronnen</CardTitle>
              <DataSourceBadge beschikbaar={false} naam="Google Analytics 4" />
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={trafficSources} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {trafficSources.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {trafficSources.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                      <span className="text-gray-600">{s.name}</span>
                    </div>
                    <span className="font-semibold text-gray-700">{s.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Apparaten */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Desktop vs mobiel</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-4 mb-3">
                {deviceSplit.map((d, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className="text-lg font-bold text-purple-700">{d.value}%</div>
                    <div className="text-xs text-gray-500">{d.name}</div>
                  </div>
                ))}
              </div>
              <div className="flex h-3 rounded-full overflow-hidden">
                {deviceSplit.map((d, i) => (
                  <div key={i} style={{ width: `${d.value}%`, background: d.color }} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Smartphone className="h-3 w-3" /> 61% mobiel — formulierconversie op mobiel is 18% lager. Optimaliseer de mobiele ervaring.
              </p>
            </CardContent>
          </Card>

          {/* Doelgroep split */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Werkzoekenden vs werkgevers</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3 mt-1">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-purple-700">Werkzoekenden</span>
                    <span className="text-gray-500">68% — 3.528 bezoekers</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '68%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-blue-700">Werkgevers</span>
                    <span className="text-gray-500">32% — 1.660 bezoekers</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: '32%' }} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Info className="h-3 w-3" /> Gebaseerd op pagina-categorisatie. Live data vereist GA4.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── C. Pagina-performance ─────────────────────────────────────────── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pagina-performance</h2>
          <div className="flex gap-2">
            <Select value={pageFilter} onValueChange={setPageFilter}>
              <SelectTrigger className="h-8 text-xs w-36">
                <SelectValue placeholder="Paginatype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle types</SelectItem>
                <SelectItem value="landing">Landing</SelectItem>
                <SelectItem value="formulier">Formulier</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="seo">SEO Pillar</SelectItem>
              </SelectContent>
            </Select>
            <Select value={doelgroepFilter} onValueChange={setDoelgroepFilter}>
              <SelectTrigger className="h-8 text-xs w-36">
                <SelectValue placeholder="Doelgroep" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle doelgroepen</SelectItem>
                <SelectItem value="Werkzoekenden">Werkzoekenden</SelectItem>
                <SelectItem value="Werkgevers">Werkgevers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagina</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Views</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Uniek</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Gem. tijd</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Bounce</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Type</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Doelgroep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPages.map((p, i) => (
                  <tr key={i} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-800 text-sm">{p.pagina}</div>
                      <div className="text-xs text-gray-400">{p.url}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-700">{p.views.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500 hidden sm:table-cell">{p.uniek.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500 hidden md:table-cell">{p.tijd}</td>
                    <td className="px-3 py-2.5 text-right hidden lg:table-cell">
                      <span className={`text-xs font-medium ${parseFloat(p.bounce) > 45 ? 'text-rose-600' : parseFloat(p.bounce) < 30 ? 'text-green-600' : 'text-amber-600'}`}>
                        {p.bounce}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.type}</span>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.doelgroep === 'Werkzoekenden' ? 'bg-purple-50 text-purple-700' : p.doelgroep === 'Werkgevers' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}>
                        {p.doelgroep}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <DataSourceBadge beschikbaar={false} naam="Google Analytics 4" />
      </section>

      {/* ── D. Formulierconversies & funnels ──────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Formulierconversies</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Werkzoekenden funnel */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Funnel werkzoekenden</CardTitle>
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">11,4% conversie</span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-5">
              <FunnelBar label="Pagina bezocht"     count={1876} total={1876} color="bg-purple-500" />
              <FunnelBar label="Formulier gestart"  count={1241} total={1876} color="bg-purple-400" />
              <FunnelBar label="Stap 2 bereikt"     count={814}  total={1876} color="bg-purple-300" />
              <FunnelBar label="CV geüpload"        count={498}  total={1876} color="bg-purple-200" />
              <FunnelBar label="Gesprek ingepland"  count={214}  total={1876} color="bg-purple-100" />
              <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-700 flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span><strong>Let op:</strong> 34% van de starters verlaat het formulier bij stap 2 (Skills). Dit is het grootste afhakpunt.</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Werkgevers funnel */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Funnel werkgevers</CardTitle>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">8,7% conversie</span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-5">
              <FunnelBar label="Pagina bezocht"       count={641} total={641} color="bg-blue-500" />
              <FunnelBar label="Formulier gestart"    count={312} total={641} color="bg-blue-400" />
              <FunnelBar label="Formulier verzonden"  count={56}  total={641} color="bg-blue-300" />
              <FunnelBar label="WhatsApp / bellen"    count={387} total={641} color="bg-green-400" />
              <div className="mt-3 p-2.5 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs text-green-700 flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span><strong>Inzicht:</strong> Werkgevers verkiezen WhatsApp/telefoon boven het formulier. Overweeg WhatsApp CTA prominenter te plaatsen.</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Conversie staafdiagram */}
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Conversie per formulierstap — werkzoekenden</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  { stap: 'Pagina bezocht', count: 1876 },
                  { stap: 'Gestart',        count: 1241 },
                  { stap: 'Stap 2',         count: 814  },
                  { stap: 'CV upload',      count: 498  },
                  { stap: 'Ingepland',      count: 214  },
                ]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="stap" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" name="Aantal" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <DataSourceBadge beschikbaar={true} naam="Interne database (aanmeldingen)" />
          <DataSourceBadge beschikbaar={false} naam="Google Analytics 4 (paginaweergaven)" />
          <DataSourceBadge beschikbaar={false} naam="Hotjar (sessie-opnames per stap)" />
        </div>
      </section>

      {/* ── E. Blog & SEO prestaties ──────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Blog en SEO prestaties</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Top blogs */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700">Meest bezochte blogs</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {blogPerformance.map((b, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{b.titel}</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-0.5"><Eye className="h-3 w-3" /> {b.views}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-0.5"><Clock className="h-3 w-3" /> {b.tijd}</span>
                        <span className="text-xs text-green-600 font-medium">{b.organisch}% organisch</span>
                        <span className="text-xs text-purple-600 font-medium">{b.conversie}% conv.</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">Keyword: {b.keyword}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SEO keywords */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">Top zoekwoorden Google</CardTitle>
                <DataSourceBadge beschikbaar={false} naam="Search Console" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-1.5 text-gray-400 font-medium">Zoekwoord</th>
                    <th className="text-center py-1.5 text-gray-400 font-medium">Pos.</th>
                    <th className="text-right py-1.5 text-gray-400 font-medium hidden sm:table-cell">Imp.</th>
                    <th className="text-right py-1.5 text-gray-400 font-medium">Klikken</th>
                    <th className="text-right py-1.5 text-gray-400 font-medium">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {seoKeywords.map((k, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2 text-gray-700 font-medium pr-2">{k.keyword}</td>
                      <td className="py-2 text-center">
                        <span className={`font-bold ${k.positie <= 5 ? 'text-green-600' : k.positie <= 10 ? 'text-amber-600' : 'text-gray-500'}`}>
                          #{k.positie}
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-500 hidden sm:table-cell">{k.impressies.toLocaleString()}</td>
                      <td className="py-2 text-right font-semibold text-gray-700">{k.klikken}</td>
                      <td className="py-2 text-right">
                        <span className={`font-medium ${parseFloat(k.ctr) > 9 ? 'text-green-600' : 'text-gray-600'}`}>{k.ctr}</span>
                        {k.trend === 'up' && <TrendingUp className="inline h-3 w-3 text-green-500 ml-1" />}
                        {k.trend === 'down' && <TrendingDown className="inline h-3 w-3 text-rose-500 ml-1" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── F. Aanbevelingen ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Inzichten en aanbevelingen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recommendations.map((r, i) => {
            const Icon = r.icon;
            const isWarning = r.type === 'warning';
            const isSuccess = r.type === 'success';
            return (
              <div key={i} className={`rounded-xl border p-4 ${isWarning ? 'bg-amber-50 border-amber-100' : isSuccess ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
                <div className={`flex items-center gap-2 mb-2 text-sm font-semibold ${isWarning ? 'text-amber-800' : isSuccess ? 'text-green-800' : 'text-blue-800'}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {r.title}
                </div>
                <p className={`text-xs leading-relaxed mb-3 ${isWarning ? 'text-amber-700' : isSuccess ? 'text-green-700' : 'text-blue-700'}`}>{r.text}</p>
                <button className={`text-xs font-medium flex items-center gap-1 ${isWarning ? 'text-amber-700 hover:text-amber-900' : isSuccess ? 'text-green-700 hover:text-green-900' : 'text-blue-700 hover:text-blue-900'}`}>
                  {r.actie} <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Integratieoverzicht ────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Benodigde koppelingen voor live data</h2>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Tool</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Wat het biedt</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {integrationSources.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.naam}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{s.beschrijving}</td>
                    <td className="px-4 py-3 text-center">
                      {s.beschikbaar ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                          <CheckCircle2 className="h-3 w-3" /> Actief
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
                          <ExternalLink className="h-3 w-3" /> Koppelen
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
