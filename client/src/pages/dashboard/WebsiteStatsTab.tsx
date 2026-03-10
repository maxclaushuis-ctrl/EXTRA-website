import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Eye, Clock, MousePointerClick,
  Search, Share2, MessageCircle, Phone, BarChart3, Target,
  AlertCircle, CheckCircle2, Info, ChevronRight, ExternalLink
} from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────────

const monthlyVisitors = [
  { label: 'Sep', bezoekers: 3241, uniek: 2617 },
  { label: 'Okt', bezoekers: 3876, uniek: 3124 },
  { label: 'Nov', bezoekers: 4102, uniek: 3318 },
  { label: 'Dec', bezoekers: 3587, uniek: 2901 },
  { label: 'Jan', bezoekers: 4214, uniek: 3409 },
  { label: 'Feb', bezoekers: 4891, uniek: 3954 },
  { label: 'Mar', bezoekers: 5188, uniek: 4193 },
];

const weeklyVisitors = [
  { label: 'Week 1', bezoekers: 1204, uniek: 978 },
  { label: 'Week 2', bezoekers: 1387, uniek: 1122 },
  { label: 'Week 3', bezoekers: 1056, uniek: 871 },
  { label: 'Week 4', bezoekers: 1541, uniek: 1248 },
];

const dailyVisitors = [
  { label: 'Ma', bezoekers: 142, uniek: 118 },
  { label: 'Di', bezoekers: 198, uniek: 161 },
  { label: 'Wo', bezoekers: 231, uniek: 187 },
  { label: 'Do', bezoekers: 176, uniek: 143 },
  { label: 'Vr', bezoekers: 284, uniek: 229 },
  { label: 'Za', bezoekers: 112, uniek: 94 },
  { label: 'Zo', bezoekers: 89, uniek: 72 },
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
  { pagina: 'Homepage', url: '/', views: 5188, uniek: 4193, tijd: '1:42', bounce: 38, type: 'Landing', doelgroep: 'Beide' },
  { pagina: 'Ik zoek extra werk', url: '/ik-zoek-extra-werk', views: 2341, uniek: 1987, tijd: '2:18', bounce: 29, type: 'Landing', doelgroep: 'Werkzoekenden' },
  { pagina: 'Aanmelden', url: '/aanmelden', views: 1876, uniek: 1654, tijd: '3:47', bounce: 21, type: 'Formulier', doelgroep: 'Werkzoekenden' },
  { pagina: 'Personeel gezocht', url: '/personeel-gezocht', views: 1432, uniek: 1289, tijd: '1:55', bounce: 44, type: 'Landing', doelgroep: 'Werkgevers' },
  { pagina: 'Horeca uitzendbureau Amsterdam', url: '/horeca-uitzendbureau-amsterdam', views: 1187, uniek: 1043, tijd: '2:31', bounce: 35, type: 'SEO Pillar', doelgroep: 'Werkgevers' },
  { pagina: 'Horeca vacatures Amsterdam', url: '/horeca-vacatures-amsterdam', views: 943, uniek: 851, tijd: '1:48', bounce: 41, type: 'Landing', doelgroep: 'Werkzoekenden' },
  { pagina: 'Blog overzicht', url: '/nieuws', views: 721, uniek: 634, tijd: '1:22', bounce: 52, type: 'Blog', doelgroep: 'Beide' },
  { pagina: 'Hotelpersoneel inhuren', url: '/hotelpersoneel-inhuren', views: 612, uniek: 548, tijd: '2:04', bounce: 39, type: 'SEO', doelgroep: 'Werkgevers' },
  { pagina: 'Chef vacatures Amsterdam', url: '/chef-vacatures-amsterdam', views: 487, uniek: 431, tijd: '1:34', bounce: 47, type: 'Landing', doelgroep: 'Werkzoekenden' },
  { pagina: 'Cateringpersoneel inhuren', url: '/cateringpersoneel-inhuren', views: 398, uniek: 362, tijd: '1:51', bounce: 43, type: 'SEO', doelgroep: 'Werkgevers' },
];

const blogPerformance = [
  { titel: 'Hoe werkt een horeca uitzendbureau?', views: 412, tijd: '3:12', organisch: 78, conversie: 4.2, keyword: 'horeca uitzendbureau amsterdam' },
  { titel: 'Flexibel werken in de horeca: alles wat je moet weten', views: 387, tijd: '2:48', organisch: 65, conversie: 2.8, keyword: 'flexibel horeca personeel' },
  { titel: 'Waarom kiezen voor tijdelijk hotelpersoneel?', views: 298, tijd: '2:33', organisch: 71, conversie: 3.6, keyword: 'hotelpersoneel amsterdam' },
  { titel: 'NEN 4400 1 en wat het betekent voor jou', views: 241, tijd: '4:01', organisch: 82, conversie: 1.9, keyword: 'nen 4400 uitzendbureau' },
  { titel: 'De beste evenementen locaties in Amsterdam', views: 198, tijd: '1:57', organisch: 44, conversie: 1.2, keyword: 'evenementen personeel amsterdam' },
];

const seoKeywords = [
  { keyword: 'horeca uitzendbureau amsterdam', positie: 4, impressies: 2841, klikken: 312, ctr: 11.0, trend: 'up' },
  { keyword: 'horeca personeel inhuren', positie: 7, impressies: 1923, klikken: 148, ctr: 7.7, trend: 'up' },
  { keyword: 'flexibel horeca personeel', positie: 11, impressies: 1247, klikken: 76, ctr: 6.1, trend: 'stable' },
  { keyword: 'hotelpersoneel amsterdam', positie: 9, impressies: 987, klikken: 72, ctr: 7.3, trend: 'up' },
  { keyword: 'evenementen personeel amsterdam', positie: 14, impressies: 743, klikken: 38, ctr: 5.1, trend: 'down' },
  { keyword: 'horeca vacatures amsterdam', positie: 6, impressies: 2104, klikken: 241, ctr: 11.5, trend: 'up' },
];

const integrations = [
  { naam: 'Google Analytics 4', beschrijving: 'Bezoekers, gedrag, conversies, apparaten', nodig: true },
  { naam: 'Google Search Console', beschrijving: 'Impressies, klikken, CTR, positie in Google', nodig: true },
  { naam: 'Interne database', beschrijving: 'Aanmeldingen, CV uploads, kandidaatstatus', nodig: false },
  { naam: 'Hotjar / MS Clarity', beschrijving: 'Heatmaps, scroll depth, sessie-opnames', nodig: true },
  { naam: 'Meta Pixel', beschrijving: 'Social media campagne-attributie', nodig: true },
];

// ─── Shared helpers ─────────────────────────────────────────────────────────────

type KpiColor = 'purple' | 'green' | 'blue' | 'amber' | 'rose' | 'sky';

const colorMap: Record<KpiColor, { bg: string; text: string; icon: string }> = {
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-500'  },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-500'   },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'text-amber-500'  },
  rose:   { bg: 'bg-rose-50',   text: 'text-rose-700',   icon: 'text-rose-500'   },
  sky:    { bg: 'bg-sky-50',    text: 'text-sky-700',    icon: 'text-sky-500'    },
};

function KpiCard({ icon: Icon, label, value, sub, trend, color }: {
  icon: any; label: string; value: string; sub?: string; trend?: 'up' | 'down'; color: KpiColor;
}) {
  const c = colorMap[color];
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${c.bg}`}>
            <Icon className={`h-4 w-4 ${c.icon}`} />
          </div>
          {trend && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-green-600' : 'text-rose-600'}`}>
              {trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            </span>
          )}
        </div>
        <div className={`text-3xl font-bold ${c.text} mb-1 leading-none`}>{value}</div>
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
      <div className={`flex items-start gap-2 mb-1.5 text-sm font-semibold ${s.title}`}>
        {s.icon}{title}
      </div>
      <p className={`text-xs leading-relaxed ${s.text}`}>{text}</p>
    </div>
  );
}

function FunnelBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-36 text-sm text-gray-600 text-right shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-700">{count.toLocaleString()}</span>
      </div>
      <div className="w-12 text-sm font-semibold text-gray-500 shrink-0">{pct}%</div>
    </div>
  );
}

function DataBadge({ live }: { live: boolean }) {
  return live ? (
    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200 font-medium">
      <CheckCircle2 className="h-3 w-3" /> Live
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
      <Info className="h-3 w-3" /> Voorbeelddata — GA4 vereist
    </span>
  );
}

// ─── Tab 1: Overzicht ──────────────────────────────────────────────────────────

function TabOverzicht() {
  const [periode, setPeriode] = useState<'dag' | 'week' | 'maand'>('maand');
  const chartData = periode === 'dag' ? dailyVisitors : periode === 'week' ? weeklyVisitors : monthlyVisitors;

  const kpis: { icon: any; label: string; value: string; sub?: string; trend?: 'up' | 'down'; color: KpiColor }[] = [
    { icon: Users,            label: 'Totale bezoekers',    value: '5.188',  sub: 'deze maand',          trend: 'up',   color: 'purple' },
    { icon: Users,            label: 'Unieke bezoekers',    value: '4.193',  sub: '+12% vs vorige maand', trend: 'up',   color: 'blue'   },
    { icon: Clock,            label: 'Gem. tijd op site',   value: '2:14',   sub: 'minuten',              trend: 'up',   color: 'green'  },
    { icon: Eye,              label: 'Paginaweergaven',     value: '14.841', sub: 'totaal',               trend: 'up',   color: 'sky'    },
    { icon: TrendingDown,     label: 'Bounce rate',         value: '37%',    sub: 'lager = beter',        trend: 'up',   color: 'green'  },
    { icon: Target,           label: 'Conversieratio',      value: '11,4%',  sub: '/aanmelden',           trend: 'up',   color: 'purple' },
    { icon: MousePointerClick, label: 'Ingediende formulieren', value: '214', sub: 'aanmeldingen',        trend: 'up',   color: 'green'  },
    { icon: MessageCircle,    label: 'WhatsApp klikken',    value: '387',    sub: 'alle paginas',         trend: 'up',   color: 'green'  },
    { icon: Phone,            label: 'Telefoon klikken',    value: '142',    sub: 'alle paginas',                        color: 'amber'  },
    { icon: Search,           label: 'Organisch verkeer',   value: '2.489',  sub: '48% van totaal',       trend: 'up',   color: 'purple' },
    { icon: Share2,           label: 'Social verkeer',      value: '778',    sub: '15% van totaal',       trend: 'up',   color: 'rose'   },
    { icon: TrendingUp,       label: 'Direct verkeer',      value: '1.141',  sub: '22% van totaal',                      color: 'sky'    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Belangrijkste cijfers — afgelopen maand</SectionTitle>
          <DataBadge live={false} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
        </div>
      </section>

      {/* Grafieken */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Bezoekers over tijd</SectionTitle>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
            {(['dag', 'week', 'maand'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriode(p)}
                className={`px-3 py-1.5 transition-colors ${periode === p ? 'bg-purple-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardContent className="pt-4 px-2 pb-4">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bezoekers" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Totaal" />
                  <Line type="monotone" dataKey="uniek" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="5 3" name="Uniek" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {/* Verkeersbronnen */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-gray-700">Verkeersbronnen</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="space-y-2">
                  {trafficSources.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: s.color }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{s.value}%</span>
                      <span className="text-xs text-gray-500 w-24 truncate">{s.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Desktop vs Mobiel */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-gray-700">Desktop vs mobiel</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <div className="flex gap-3 mb-3">
                  {deviceSplit.map((d, i) => (
                    <div key={i} className="text-center">
                      <div className="text-xl font-bold text-purple-700">{d.value}%</div>
                      <div className="text-xs text-gray-500">{d.name}</div>
                    </div>
                  ))}
                </div>
                <div className="flex h-3 rounded-full overflow-hidden">
                  {deviceSplit.map((d, i) => (
                    <div key={i} style={{ width: `${d.value}%`, background: d.color }} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">61% mobiel — formulierconversie mobiel 18% lager</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Tab 2: Formulier conversies ──────────────────────────────────────────────

function TabConversies() {
  const funnelData = [
    { stap: 'Pagina bezocht', count: 1876 },
    { stap: 'Gestart',        count: 1241 },
    { stap: 'Stap 2',         count: 814  },
    { stap: 'CV upload',      count: 498  },
    { stap: 'Ingepland',      count: 214  },
  ];

  return (
    <div className="space-y-8">
      {/* Funnels */}
      <section>
        <SectionTitle>Conversie funnels</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800">Werkzoekenden</CardTitle>
                <span className="text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">11,4% conversie</span>
              </div>
              <p className="text-sm text-gray-500">Van paginabezoek tot gesprek ingepland</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <FunnelBar label="Pagina bezocht"    count={1876} total={1876} color="bg-purple-500" />
              <FunnelBar label="Formulier gestart" count={1241} total={1876} color="bg-purple-400" />
              <FunnelBar label="Stap 2 bereikt"    count={814}  total={1876} color="bg-purple-300" />
              <FunnelBar label="CV geüpload"       count={498}  total={1876} color="bg-purple-200" />
              <FunnelBar label="Gesprek ingepland" count={214}  total={1876} color="bg-purple-100" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800">Werkgevers</CardTitle>
                <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">8,7% conversie</span>
              </div>
              <p className="text-sm text-gray-500">Van paginabezoek tot contact</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <FunnelBar label="Pagina bezocht"      count={641} total={641} color="bg-blue-500" />
              <FunnelBar label="Formulier gestart"   count={312} total={641} color="bg-blue-400" />
              <FunnelBar label="Formulier verzonden" count={56}  total={641} color="bg-blue-300" />
              <FunnelBar label="WhatsApp / bellen"   count={387} total={641} color="bg-green-400" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Insights */}
      <section>
        <SectionTitle>Inzichten</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <InsightCard type="warning" title="34% haakt af bij stap 2" text="De meeste kandidaten verlaten het formulier bij de Skills-stap. Dit is het grootste afhakpunt in de funnel." />
          <InsightCard type="success" title="Werkgevers kiezen voor WhatsApp" text="387 werkgevers kozen voor WhatsApp of telefoon versus 56 die het formulier invulden. WhatsApp CTA converteert sterk." />
          <InsightCard type="info" title="Mobiele conversie 18% lager" text="61% van bezoekers gebruikt mobiel, maar de formulierconversie op mobiel is significant lager dan op desktop." />
        </div>
      </section>

      {/* Conversiestappen grafiek */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Conversie per stap — werkzoekenden</SectionTitle>
          <DataBadge live={false} />
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 px-2 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stap" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" name="Aantal" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ─── Tab 3: Pagina prestaties ─────────────────────────────────────────────────

function TabPaginas() {
  const [typeFilter, setTypeFilter] = useState('alle');
  const [doelgroepFilter, setDoelgroepFilter] = useState('alle');

  const filtered = topPages.filter(p => {
    const typeOk = typeFilter === 'alle' || p.type.toLowerCase() === typeFilter.toLowerCase();
    const doeOk = doelgroepFilter === 'alle' || p.doelgroep === doelgroepFilter || p.doelgroep === 'Beide';
    return typeOk && doeOk;
  });

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <SectionTitle>Paginaprestaties</SectionTitle>
          <div className="flex gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 text-sm w-40">
                <SelectValue placeholder="Paginatype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle types</SelectItem>
                <SelectItem value="Landing">Landing</SelectItem>
                <SelectItem value="Formulier">Formulier</SelectItem>
                <SelectItem value="Blog">Blog</SelectItem>
                <SelectItem value="SEO Pillar">SEO Pillar</SelectItem>
                <SelectItem value="SEO">SEO</SelectItem>
              </SelectContent>
            </Select>
            <Select value={doelgroepFilter} onValueChange={setDoelgroepFilter}>
              <SelectTrigger className="h-9 text-sm w-40">
                <SelectValue placeholder="Doelgroep" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle doelgroepen</SelectItem>
                <SelectItem value="Werkzoekenden">Werkzoekenden</SelectItem>
                <SelectItem value="Werkgevers">Werkgevers</SelectItem>
              </SelectContent>
            </Select>
            <DataBadge live={false} />
          </div>
        </div>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagina</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Views</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Uniek</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Gem. tijd</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bounce</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Doelgroep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p, i) => (
                  <tr key={i} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold text-gray-800">{p.pagina}</div>
                      <div className="text-xs text-gray-400">{p.url}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-700">{p.views.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-sm text-gray-500 hidden sm:table-cell">{p.uniek.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-sm text-gray-500 hidden md:table-cell">{p.tijd}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`text-sm font-semibold ${p.bounce > 45 ? 'text-rose-600' : p.bounce < 30 ? 'text-green-600' : 'text-amber-600'}`}>
                        {p.bounce}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">{p.type}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        p.doelgroep === 'Werkzoekenden' ? 'bg-purple-50 text-purple-700'
                        : p.doelgroep === 'Werkgevers' ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-50 text-gray-600'
                      }`}>
                        {p.doelgroep}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">Geen paginas gevonden voor deze filter</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}

// ─── Tab 4: SEO & Content ─────────────────────────────────────────────────────

function TabSeo() {
  return (
    <div className="space-y-8">
      {/* Blogs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Meest bezochte blogs</SectionTitle>
          <DataBadge live={false} />
        </div>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Artikel</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Views</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Leestijd</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Organisch</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {blogPerformance.map((b, i) => (
                  <tr key={i} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-sm font-bold flex items-center justify-center">{i + 1}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-semibold text-gray-800">{b.titel}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{b.keyword}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-700">{b.views}</td>
                    <td className="px-4 py-3.5 text-right text-sm text-gray-500 hidden sm:table-cell">{b.tijd}</td>
                    <td className="px-4 py-3.5 text-right hidden md:table-cell">
                      <span className="text-sm font-semibold text-green-600">{b.organisch}%</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`text-sm font-semibold ${b.conversie >= 3 ? 'text-green-600' : b.conversie >= 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {b.conversie}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* SEO zoekwoorden */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Top zoekwoorden Google</SectionTitle>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Info className="h-3 w-3" /> Vereist Google Search Console koppeling
          </span>
        </div>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Zoekwoord</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Positie</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Impressies</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Klikken</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CTR</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {seoKeywords.map((k, i) => (
                  <tr key={i} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{k.keyword}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                        k.positie <= 5 ? 'bg-green-50 text-green-700'
                        : k.positie <= 10 ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-50 text-gray-500'
                      }`}>#{k.positie}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm text-gray-500 hidden sm:table-cell">{k.impressies.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-700">{k.klikken}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`text-sm font-semibold ${k.ctr >= 9 ? 'text-green-600' : 'text-gray-600'}`}>{k.ctr}%</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {k.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {k.trend === 'down' && <TrendingDown className="h-4 w-4 text-rose-500" />}
                      {k.trend === 'stable' && <span className="text-xs text-gray-400">stabiel</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* SEO inzichten */}
      <section>
        <SectionTitle>SEO inzichten</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <InsightCard type="success" title="'Horeca uitzendbureau amsterdam' staat op positie 4" text="Dit belangrijke zoekwoord stijgt snel. De pagina /horeca-uitzendbureau-amsterdam trekt al 1.187 bezoekers per maand." />
          <InsightCard type="warning" title="Blog over evenementen locaties heeft lage conversie" text="Het artikel genereert 198 views maar slechts 1,2% conversie. Overweeg een sterkere CTA of een betere link naar /aanmelden." />
          <InsightCard type="info" title="Blog over NEN 4400 1 heeft hoogste leestijd" text="Bezoekers lezen dit artikel gemiddeld 4 minuten. Dit duidt op hoge relevantie. Schrijf meer content rondom dit thema." />
        </div>
      </section>

      {/* Integraties */}
      <section>
        <SectionTitle>Benodigde koppelingen voor live data</SectionTitle>
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
              {integrations.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">{s.naam}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell">{s.beschrijving}</td>
                  <td className="px-5 py-3.5 text-center">
                    {!s.nodig ? (
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
  { id: 'conversies',  label: 'Formulier conversies' },
  { id: 'paginas',     label: 'Pagina prestaties'    },
  { id: 'seo',         label: 'SEO & Content'        },
] as const;

type TabId = typeof TABS[number]['id'];

export default function WebsiteStatsTab() {
  const [activeTab, setActiveTab] = useState<TabId>('overzicht');

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <BarChart3 className="h-6 w-6 text-purple-600" /> Website Statistieken
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Prestaties, bezoekers en conversies van doehetextra.nl</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
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

      {/* Tab content — only renders active tab */}
      <div className="p-6 flex-1">
        {activeTab === 'overzicht'  && <TabOverzicht />}
        {activeTab === 'conversies' && <TabConversies />}
        {activeTab === 'paginas'    && <TabPaginas />}
        {activeTab === 'seo'        && <TabSeo />}
      </div>
    </div>
  );
}
