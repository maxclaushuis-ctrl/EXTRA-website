import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

// Planbord-stijl: zwarte cijfers, grijze labels, dunne lijnen — kleur alleen
// als status. KpiColor blijft in de signatuur voor bestaande callers, maar
// stuurt niets gekleurds meer aan.
type KpiColor = 'purple' | 'green' | 'blue' | 'amber' | 'rose' | 'gray';

const LIJN = 'border-[#ececef]';

function KpiCard({ label, value, sub, isLoading }: {
  icon?: any; label: string; value: string | number; sub?: string; color?: KpiColor; isLoading?: boolean;
}) {
  return (
    <div className={`bg-white border ${LIJN} rounded-xl p-5`}>
      {isLoading ? (
        <Skeleton className="h-8 w-16 mb-1" />
      ) : (
        <div className="text-3xl font-extrabold text-gray-900 mb-1 leading-none tracking-tight">{value}</div>
      )}
      <div className="text-sm text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-3">{children}</h2>;
}

function InsightCard({ type, title, text }: { type: 'warning' | 'success' | 'info'; title: string; text: string }) {
  const stip = type === 'warning' ? 'bg-amber-400' : type === 'success' ? 'bg-green-500' : 'bg-gray-300';
  return (
    <div className={`rounded-xl border ${LIJN} bg-white p-4`}>
      <div className="flex items-center gap-2 mb-1.5 text-sm font-semibold text-gray-900">
        <span className={`w-2 h-2 rounded-full shrink-0 ${stip}`} />{title}
      </div>
      <p className="text-xs leading-relaxed text-gray-500">{text}</p>
    </div>
  );
}

function Ga4KpiCard({ label, value, prev, isLoading, invertGoed }: {
  label: string; value: string | number; prev?: number; color?: KpiColor; isLoading?: boolean; invertGoed?: boolean;
}) {
  const isNum = typeof value === 'number' && typeof prev === 'number' && prev > 0;
  const trend = isNum ? ((value as number) - (prev as number)) / (prev as number) * 100 : null;
  const isUp = trend !== null && trend > 0;
  const isGood = invertGoed ? !isUp : isUp;
  return (
    <div className={`bg-white border ${LIJN} rounded-xl p-4`}>
      {isLoading ? <Skeleton className="h-7 w-16 mb-1" /> : (
        <div className="text-2xl font-extrabold text-gray-900 mb-0.5 leading-none tracking-tight">
          {typeof value === 'number' ? value.toLocaleString('nl-NL') : value}
        </div>
      )}
      <div className="text-xs text-gray-500">{label}</div>
      {trend !== null && !isLoading && (
        <div className={`text-xs mt-1 font-medium ${isGood ? 'text-green-600' : 'text-red-500'}`}>
          {isUp ? '↑' : '↓'} {Math.abs(Math.round(trend))}% vs vorige periode
        </div>
      )}
    </div>
  );
}

/**
 * Eén waarheid over de koppelingen, in één compacte regel.
 * GA4 kent drie toestanden: niet gekoppeld · gekoppeld maar wacht op eerste
 * data · actief. Alle uitleg en setup-stappen staan op het tabblad Koppelingen.
 */
export type Ga4Toestand = 'niet_gekoppeld' | 'fout' | 'wacht_op_data' | 'actief';

function StatusChip({ label, toestand }: { label: string; toestand: 'actief' | 'wachten' | 'uit' }) {
  const stijl = toestand === 'wachten'
    ? 'bg-[#fdf8ec] text-[#9a6b15] border-[#f3e3bd]'
    : `bg-white text-gray-500 border ${LIJN}`;
  const stip = toestand === 'actief' ? 'bg-green-500' : toestand === 'wachten' ? 'bg-amber-400' : 'bg-gray-300';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${stijl}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${stip}`} />{label}
    </span>
  );
}

function StatusStrip({ ga4, onNaarKoppelingen }: { ga4: Ga4Toestand; onNaarKoppelingen: () => void }) {
  const ga4Label = ga4 === 'actief' ? 'Google Analytics actief'
    : ga4 === 'wacht_op_data' ? 'GA4 gekoppeld — wacht op eerste data'
    : ga4 === 'fout' ? 'GA4-koppeling werkt niet — zie Koppelingen'
    : 'GA4 niet gekoppeld';
  const ga4Toestand = ga4 === 'actief' ? 'actief' as const : (ga4 === 'wacht_op_data' || ga4 === 'fout') ? 'wachten' as const : 'uit' as const;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <StatusChip label="Database actief" toestand="actief" />
      <StatusChip label={ga4Label} toestand={ga4Toestand} />
      <StatusChip label="Search Console niet gekoppeld" toestand="uit" />
      <button onClick={onNaarKoppelingen} className="text-xs text-purple-600 hover:text-purple-800 hover:underline ml-1">
        Koppelingen beheren →
      </button>
    </div>
  );
}

function FunnelBar({ label, count, total, eerste }: { label: string; count: number; total: number; eerste?: boolean }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3.5 py-2 text-[13px]">
      <div className="w-44 text-gray-500 text-right shrink-0">{label}</div>
      <div className="flex-1 bg-[#fafafa] rounded-full h-7 relative overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 3)}%`, background: eerste ? '#7c3aed' : '#d5cdeb' }} />
        <span className={`absolute inset-0 flex items-center justify-center text-[12.5px] font-bold ${eerste ? 'text-white' : 'text-gray-800'}`}>
          {count.toLocaleString('nl-NL')}
        </span>
      </div>
      <div className="w-11 font-bold text-gray-500 shrink-0">{pct}%</div>
    </div>
  );
}

// Helper: group candidates by month
function groupByMonth(candidates: Candidate[]) {
  const map: Record<string, { label: string; aanmeldingen: number; metCv: number; aangenomen: number }> = {};
  candidates.filter(Boolean).forEach(c => {
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' });
    if (!map[key]) map[key] = { label, aanmeldingen: 0, metCv: 0, aangenomen: 0 };
    map[key].aanmeldingen++;
    if (c?.hasCv) map[key].metCv++;
    if (c.status === 'aangenomen') map[key].aangenomen++;
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

// ─── Tab 1: Overzicht ──────────────────────────────────────────────────────────

function TabOverzicht({ candidates, staffingRequests, blogs, isLoading, ga4, onNaarKoppelingen }: {
  candidates: Candidate[]; staffingRequests: StaffingRequest[]; blogs: BlogPost[]; isLoading: boolean; ga4: Ga4Toestand; onNaarKoppelingen: () => void;
}) {
  const now = new Date();
  const dagen = (n: number) => n * 86400000;
  const last7 = candidates.filter(c => (now.getTime() - new Date(c.createdAt).getTime()) < dagen(7)).length;
  const vorige7 = candidates.filter(c => { const t = now.getTime() - new Date(c.createdAt).getTime(); return t >= dagen(7) && t < dagen(14); }).length;
  const last30 = candidates.filter(c => (now.getTime() - new Date(c.createdAt).getTime()) < dagen(30)).length;
  const vorige30 = candidates.filter(c => { const t = now.getTime() - new Date(c.createdAt).getTime(); return t >= dagen(30) && t < dagen(60); }).length;
  const aangenomen = candidates.filter(c => c.status === 'aangenomen').length;
  const afgewezen = candidates.filter(c => c.status === 'afgewezen').length;
  const inBehandeling = candidates.filter(c => c.status === 'in_behandeling').length;
  const metCv = candidates.filter(c => c?.hasCv).length;
  const published = blogs.filter(b => b.status === 'published').length;
  const totaal = candidates.length;
  const conversiePct = totaal > 0 ? Math.round((aangenomen / totaal) * 100) : 0;
  const cvPct = totaal > 0 ? Math.round((metCv / totaal) * 100) : 0;
  const weekDelta = vorige7 > 0 ? Math.round(((last7 - vorige7) / vorige7) * 100) : null;

  const monthlyData = useMemo(() => groupByMonth(candidates), [candidates]);

  const functieTelling: Record<string, number> = {};
  for (const c of candidates) {
    const f = c.functionType === 'horecamedewerker' ? 'Horecamedewerker'
      : c.functionType === 'chef' ? 'Chef'
      : c.functionType === 'housekeeping' ? 'Housekeeping' : 'Overig';
    functieTelling[f] = (functieTelling[f] ?? 0) + 1;
  }
  const functieData = Object.entries(functieTelling).sort(([, a], [, b]) => b - a);
  const functieMax = Math.max(...functieData.map(([, n]) => n), 1);

  const statusRegels = [
    { naam: 'In behandeling', aantal: inBehandeling, pill: 'bg-[#fdf6e3] text-[#9a6b15]', balk: '#e8c76a' },
    { naam: 'Aangenomen',     aantal: aangenomen,    pill: 'bg-[#e9f7ef] text-[#1a7f4b]', balk: '#7fd3a4' },
    { naam: 'Afgewezen',      aantal: afgewezen,     pill: 'bg-[#fdeeee] text-[#b3403a]', balk: '#f1a6a2' },
  ];

  return (
    <div className="space-y-8">
      <StatusStrip ga4={ga4} onNaarKoppelingen={onNaarKoppelingen} />

      {/* Vier kerncijfers in één band */}
      <section>
        <div className={`grid grid-cols-2 lg:grid-cols-4 bg-white border ${LIJN} rounded-xl overflow-hidden`}>
          {[
            { cijfer: last7, lbl: 'Aanmeldingen deze week', sub: weekDelta === null ? 'vorige week: 0' : <><b className={weekDelta >= 0 ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>{weekDelta >= 0 ? '+' : ''}{weekDelta}%</b> t.o.v. vorige week</> },
            { cijfer: last30, lbl: 'Afgelopen 30 dagen', sub: `vorige periode: ${vorige30}` },
            { cijfer: inBehandeling, lbl: 'In behandeling', sub: 'wachten op review' },
            { cijfer: `${conversiePct}%`, lbl: 'Conversie naar aangenomen', sub: `${aangenomen} van ${totaal} totaal` },
          ].map((k, i) => (
            <div key={i} className={`p-5 border-[#ececef] ${i > 0 ? 'border-l' : ''} ${i >= 2 ? 'max-lg:border-t' : ''}`}>
              {isLoading ? <Skeleton className="h-8 w-14 mb-1" /> : (
                <div className="text-3xl font-extrabold text-gray-900 leading-none tracking-tight">{k.cijfer}</div>
              )}
              <div className="text-[13px] text-gray-500 mt-1.5">{k.lbl}</div>
              <div className="text-xs text-gray-400 mt-1">{k.sub}</div>
            </div>
          ))}
        </div>
        <p className="text-[13px] text-gray-500 mt-3">
          Totaal <b className="text-gray-900 font-semibold">{totaal}</b> aanmeldingen
          &nbsp;·&nbsp; CV geüpload <b className="text-gray-900 font-semibold">{metCv}</b> ({cvPct}%)
          &nbsp;·&nbsp; Personeelsaanvragen <b className="text-gray-900 font-semibold">{staffingRequests.length}</b>
          &nbsp;·&nbsp; Gepubliceerde blogs <b className="text-gray-900 font-semibold">{published}</b>
        </p>
      </section>

      {/* Maandgrafiek (monochroom, huidige maand paars) + functieverdeling als regels */}
      <section>
        <SectionTitle>Aanmeldingen per maand</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`lg:col-span-2 bg-white border ${LIJN} rounded-xl p-5`}>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Aanmeldingen over tijd</h3>
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={monthlyData} margin={{ top: 22, right: 8, left: 8, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11.5, fill: '#9ca3af' }} axisLine={{ stroke: '#ececef' }} tickLine={false} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: '#fafafa' }} />
                  <Bar dataKey="aanmeldingen" name="Aanmeldingen" radius={[5, 5, 0, 0]} maxBarSize={44}
                    label={{ position: 'top', fontSize: 11.5, fill: '#374151', fontWeight: 600 }}>
                    {monthlyData.map((_, i) => (
                      <Cell key={i} fill={i === monthlyData.length - 1 ? '#7c3aed' : '#e5e2ee'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <p className="text-[11.5px] text-gray-400 mt-2">Paars = huidige maand · aantallen per kalendermaand</p>
          </div>

          <div className={`bg-white border ${LIJN} rounded-xl p-5`}>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Per functie</h3>
            {isLoading ? <Skeleton className="h-40 w-full" /> : (
              <div>
                {functieData.map(([naam, n], i) => (
                  <div key={naam} className={`flex items-center gap-2.5 py-2.5 text-[13px] ${i < functieData.length - 1 ? 'border-b border-[#ececef]' : ''}`}>
                    <span className="w-32 text-gray-800 truncate">{naam}</span>
                    <span className="flex-1 h-1.5 bg-[#fafafa] rounded-full overflow-hidden">
                      <i className="block h-full rounded-full" style={{ width: `${Math.max((n / functieMax) * 100, 3)}%`, background: i === 0 ? '#7c3aed' : '#d5cdeb' }} />
                    </span>
                    <span className="w-9 text-right font-bold text-gray-900">{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Status als tabelregels met pill */}
      <section>
        <SectionTitle>Status</SectionTitle>
        <div className={`bg-white border ${LIJN} rounded-xl overflow-hidden`}>
          {statusRegels.map((s, i) => {
            const pct = totaal > 0 ? Math.round((s.aantal / totaal) * 100) : 0;
            return (
              <div key={s.naam} className={`flex items-center px-5 py-3.5 text-[13.5px] ${i < statusRegels.length - 1 ? 'border-b border-[#ececef]' : ''}`}>
                <span className="w-40 font-semibold text-gray-900">{s.naam}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${s.pill}`}>{pct}%</span>
                <span className="flex-1 h-1.5 bg-[#fafafa] rounded-full overflow-hidden mx-4">
                  <i className="block h-full rounded-full" style={{ width: `${Math.max(pct, 1)}%`, background: s.balk }} />
                </span>
                <span className="w-14 text-right font-extrabold text-[15px] text-gray-900">{s.aantal}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─── Tab 2: Formulier conversies ──────────────────────────────────────────────

function TabConversies({ candidates, isLoading }: { candidates: Candidate[]; isLoading: boolean }) {
  const metCv = candidates.filter(c => c?.hasCv).length;
  const aangenomen = candidates.filter(c => c.status === 'aangenomen').length;
  const total = candidates.length;
  const cvPct = total > 0 ? Math.round((metCv / total) * 100) : 0;
  const aangenomenPct = total > 0 ? Math.round((aangenomen / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Funnel */}
      <section>
        <SectionTitle>Aanmeldfunnel werkzoekenden</SectionTitle>
        <div className={`bg-white border ${LIJN} rounded-xl p-5`}>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Van aanmelding naar aanname</h3>
          {isLoading ? <Skeleton className="h-32 w-full" /> : (
            <>
              <FunnelBar label="Aangemeld in systeem" count={total}      total={total} eerste />
              <FunnelBar label="CV geüpload"          count={metCv}      total={total} />
              <FunnelBar label="Aangenomen"           count={aangenomen} total={total} />
              <p className="text-[11.5px] text-gray-400 mt-2">Paginabezoek en formulierstart verschijnen hier zodra GA4 data levert.</p>
            </>
          )}
        </div>
      </section>

      {/* Inzichten */}
      <section>
        <SectionTitle>Inzichten</SectionTitle>
        {isLoading ? <Skeleton className="h-24 w-full" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Tab: Koppelingen ─────────────────────────────────────────────────────────
// Dé ene plek voor koppelingstatus en setup — alle andere tabbladen tonen
// alleen data. Eén regel per tool; geen herhaalde uitlegblokken.

function TabKoppelingen({ ga4, ga4Fout }: { ga4: Ga4Toestand; ga4Fout?: string }) {
  const tools = [
    { naam: 'Interne database', info: 'Aanmeldingen, CV-uploads, statussen, blogs, personeelsaanvragen', status: 'actief' as const, detail: 'Actief' },
    { naam: 'Google Analytics 4', info: 'Bezoekers, paginaprestaties, verkeersbronnen, apparaten',
      status: ga4 === 'actief' ? 'actief' as const : (ga4 === 'wacht_op_data' || ga4 === 'fout') ? 'wachten' as const : 'uit' as const,
      detail: ga4 === 'actief' ? 'Actief' : ga4 === 'wacht_op_data' ? 'Gekoppeld — wacht op eerste data' : ga4 === 'fout' ? 'Koppeling geeft een fout' : 'Niet gekoppeld' },
    { naam: 'Google Search Console', info: 'Zoekwoordposities, impressies en klikken vanuit Google', status: 'uit' as const, detail: 'Niet gekoppeld' },
    { naam: 'Hotjar / MS Clarity', info: 'Heatmaps en sessie-opnames', status: 'uit' as const, detail: 'Niet gekoppeld' },
    { naam: 'Meta Pixel', info: 'Social campagne-attributie en retargeting', status: 'uit' as const, detail: 'Niet gekoppeld' },
  ];
  const stijl = { actief: 'bg-green-50 text-green-700 border-green-200', wachten: 'bg-amber-50 text-amber-700 border-amber-200', uit: 'bg-gray-50 text-gray-500 border-gray-200' };
  return (
    <div className="space-y-8 max-w-3xl">
      <section>
        <SectionTitle>Koppelingen</SectionTitle>
        <Card className="border-0 shadow-sm overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-gray-50">
              {tools.map((t, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-semibold text-gray-800">{t.naam}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{t.info}</div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${stijl[t.status]}`}>{t.detail}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {ga4 === 'fout' && ga4Fout && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-red-700 mb-0.5">Foutmelding van Google</p>
          <p className="text-xs text-red-600 font-mono break-all">{ga4Fout}</p>
        </div>
      )}

      {ga4 !== 'actief' && (
        <section>
          <SectionTitle>{ga4 === 'wacht_op_data' ? 'GA4 gekoppeld — nog geen data?' : ga4 === 'fout' ? 'GA4-koppeling herstellen' : 'Google Analytics 4 koppelen'}</SectionTitle>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              {(ga4 === 'wacht_op_data' || ga4 === 'fout' ? [
                { step: '1', title: 'Controleer de GA_PROPERTY_ID', text: 'Het property-nummer in de omgevingsvariabelen moet exact overeenkomen met de GA4-property van doehetextra.nl' },
                { step: '2', title: 'Controleer het service-account', text: 'Het service-account moet als Viewer zijn toegevoegd in Google Analytics → Beheer → Propertytoegang' },
                { step: '3', title: 'Wacht op de eerste meting', text: 'Na een correcte koppeling verschijnt het tabblad "Google Analytics" hier automatisch zodra de eerste data binnen is (kan tot 24 uur duren)' },
              ] : [
                { step: '1', title: 'Maak een GA4-property aan', text: 'Via analytics.google.com, voor doehetextra.nl' },
                { step: '2', title: 'Plaats de meetcode', text: 'De gtag.js-snippet in de <head> van de site, of via Google Tag Manager' },
                { step: '3', title: 'Koppel aan dit dashboard', text: 'Service-account als Viewer toevoegen en de GA_PROPERTY_ID instellen — daarna verschijnen bezoekerscijfers hier vanzelf' },
              ]).map((s, i) => (
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
      )}
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
        <SectionTitle>Blog overzicht</SectionTitle>
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
                      <td className="px-4 py-3.5 text-xs text-gray-400 hidden lg:table-cell">
                        {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                  {published.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">Geen gepubliceerde artikelen</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      <p className="text-xs text-gray-400">
        Zoekwoordposities en organisch verkeer per artikel verschijnen hier zodra Google Search Console is gekoppeld — zie het tabblad Koppelingen.
      </p>
    </div>
  );
}

// ─── Tab GA4: Google Analytics ────────────────────────────────────────────────

const GA4_COLORS = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${Math.round(s)}s`;
}

function TabGa4({ overview, trend, sources, pages, devices, isLoading }: {
  overview: any; trend: any[]; sources: any[]; pages: any[]; devices: any[]; isLoading: boolean;
}) {
  const trendData = (trend ?? []).map((t: any) => ({
    date: `${t.date.slice(4, 6)}/${t.date.slice(6, 8)}`,
    sessies: t.sessions,
    gebruikers: t.users,
  }));

  const hasOverview = overview && overview.sessions;
  const hasData = !isLoading && hasOverview;

  return (
    <div className="space-y-8">

      {/* KPI cards */}
      <section>
        <SectionTitle>Website overzicht — live GA4 data (laatste 30 dagen)</SectionTitle>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4"><Skeleton className="h-7 w-16 mb-1" /><Skeleton className="h-3 w-24 mt-1" /></CardContent></Card>)}
          </div>
        ) : !hasData ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
            <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-amber-800">Geen GA4 data beschikbaar</p>
            <p className="text-xs text-amber-700 mt-1">Controleer of de GA_PROPERTY_ID correct is ingesteld en het service account toegang heeft als Viewer in Google Analytics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Ga4KpiCard label="Sessies"          value={overview.sessions?.value ?? 0}    prev={overview.sessions?.prev}    color="purple" />
            <Ga4KpiCard label="Gebruikers"       value={overview.users?.value ?? 0}        prev={overview.users?.prev}       color="blue"   />
            <Ga4KpiCard label="Pageviews"        value={overview.pageviews?.value ?? 0}    prev={overview.pageviews?.prev}   color="green"  />
            <Ga4KpiCard label="Bounce rate"      value={`${overview.bounceRate?.value ?? 0}%`} color="amber" invertGoed />
            <Ga4KpiCard label="Gem. sessieduur"  value={fmtDuration(overview.avgDuration?.value ?? 0)} color="purple" />
          </div>
        )}
      </section>

      {/* Trend */}
      <section>
        <SectionTitle>Bezoektrend afgelopen 30 dagen</SectionTitle>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 px-2 pb-4">
            {isLoading ? <Skeleton className="h-52 w-full" /> : trendData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Geen trenddata</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="grad-sess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-user" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="sessies"    stroke="#7c3aed" fill="url(#grad-sess)" strokeWidth={2} name="Sessies"    dot={false} />
                  <Area type="monotone" dataKey="gebruikers" stroke="#3b82f6" fill="url(#grad-user)" strokeWidth={2} name="Gebruikers" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Sources + Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section>
          <SectionTitle>Verkeersbronnen</SectionTitle>
          <Card className="border-0 shadow-sm h-full">
            <CardContent className="pt-5 pb-4 px-5">
              {isLoading ? <Skeleton className="h-48 w-full" /> : (sources ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Geen data</p>
              ) : (
                <div className="space-y-3">
                  {(sources ?? []).map((s: any, i: number) => {
                    const maxS = Math.max(...(sources ?? []).map((x: any) => x.sessions), 1);
                    const pct = Math.round((s.sessions / maxS) * 100);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-36 text-xs text-gray-600 shrink-0 truncate">{s.channel}</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: GA4_COLORS[i % GA4_COLORS.length] }} />
                          <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold text-white mix-blend-normal" style={{ textShadow: '0 0 3px rgba(0,0,0,0.4)' }}>
                            {s.sessions.toLocaleString('nl-NL')}
                          </span>
                        </div>
                        <div className="w-10 text-xs text-gray-500 shrink-0 text-right">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <SectionTitle>Apparaten</SectionTitle>
          <Card className="border-0 shadow-sm h-full">
            <CardContent className="pt-5 pb-4">
              {isLoading ? <Skeleton className="h-48 w-full" /> : (devices ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Geen data</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={(devices ?? []).map((d: any) => ({ name: d.device, value: d.sessions }))} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                        {(devices ?? []).map((_: any, i: number) => <Cell key={i} fill={GA4_COLORS[i % GA4_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => v.toLocaleString('nl-NL')} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-3 px-2">
                    {(devices ?? []).map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: GA4_COLORS[i % GA4_COLORS.length] }} />
                          <span className="text-gray-600 capitalize">{d.device}</span>
                        </div>
                        <span className="font-semibold text-gray-700">{d.sessions.toLocaleString('nl-NL')} sessies</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Top pagina's */}
      <section>
        <SectionTitle>Top pagina's (laatste 30 dagen)</SectionTitle>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagina (pad)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pageviews</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Gebruikers</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Gem. duur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i}><td colSpan={5} className="px-5 py-3"><Skeleton className="h-5 w-full" /></td></tr>
                  ))
                ) : (pages ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">Geen pagina-data beschikbaar</td></tr>
                ) : (
                  (pages ?? []).map((p: any, i: number) => (
                    <tr key={i} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">{i + 1}</div>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-mono text-gray-600 max-w-xs truncate">{p.path}</td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-700">{p.pageviews.toLocaleString('nl-NL')}</td>
                      <td className="px-4 py-3.5 text-right text-sm text-gray-500 hidden sm:table-cell">{p.users.toLocaleString('nl-NL')}</td>
                      <td className="px-4 py-3.5 text-right text-sm text-gray-500 hidden md:table-cell">{fmtDuration(p.avgDuration)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

type TabId = 'overzicht' | 'conversies' | 'google-analytics' | 'seo' | 'koppelingen';

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

  const { data: ga4Status } = useQuery<{ configured: boolean; werkt?: boolean; heeftData?: boolean; fout?: string }>({
    queryKey: ['/api/admin/ga4/status'],
    retry: false,
  });
  const ga4Configured = ga4Status?.configured ?? false;

  const { data: ga4Overview, isLoading: ga4OverviewLoading } = useQuery<any>({
    queryKey: ['/api/admin/ga4/overview'],
    enabled: ga4Configured,
    retry: false,
  });
  const { data: ga4Trend, isLoading: ga4TrendLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/ga4/trend'],
    enabled: ga4Configured,
    retry: false,
  });
  const { data: ga4Sources, isLoading: ga4SourcesLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/ga4/sources'],
    enabled: ga4Configured,
    retry: false,
  });
  const { data: ga4Pages, isLoading: ga4PagesLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/ga4/pages'],
    enabled: ga4Configured,
    retry: false,
  });
  const { data: ga4Devices, isLoading: ga4DevicesLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/ga4/devices'],
    enabled: ga4Configured,
    retry: false,
  });
  const ga4Loading = ga4OverviewLoading || ga4TrendLoading || ga4SourcesLoading || ga4PagesLoading || ga4DevicesLoading;

  const candidates = (candidatesData?.candidates ?? []).filter(Boolean);
  const blogs = blogData?.posts ?? [];
  const staffingRequests = staffingData ?? [];
  const isLoading = candidatesLoading || blogLoading || staffingLoading;

  // Eén waarheid over GA4: gekoppeld én data → actief; gekoppeld zonder data →
  // wachten; anders niet gekoppeld. Het GA4-tabblad bestaat alleen mét data —
  // placeholders krijgen geen eigen tabblad.
  const heeftGa4Data = !!(ga4Overview && ga4Overview.sessions) || !!ga4Status?.heeftData;
  const ga4: Ga4Toestand = heeftGa4Data ? 'actief'
    : !ga4Configured ? 'niet_gekoppeld'
    : ga4Status?.werkt === false ? 'fout'
    : 'wacht_op_data';

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overzicht',  label: 'Overzicht' },
    { id: 'conversies', label: 'Aanmeldingen' },
    ...(heeftGa4Data ? [{ id: 'google-analytics' as TabId, label: 'Google Analytics' }] : []),
    { id: 'seo',         label: 'SEO & Content' },
    { id: 'koppelingen', label: 'Koppelingen' },
  ];
  // Als het GA4-tabblad verdwijnt terwijl het openstond: terug naar Overzicht.
  const zichtbareTab: TabId = tabs.some(t => t.id === activeTab) ? activeTab : 'overzicht';

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
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                zichtbareTab === t.id
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6 flex-1">
        {zichtbareTab === 'overzicht'        && <TabOverzicht  candidates={candidates} staffingRequests={staffingRequests} blogs={blogs} isLoading={isLoading} ga4={ga4} onNaarKoppelingen={() => setActiveTab('koppelingen')} />}
        {zichtbareTab === 'conversies'       && <TabConversies candidates={candidates} isLoading={isLoading} />}
        {zichtbareTab === 'google-analytics' && <TabGa4 overview={ga4Overview} trend={ga4Trend ?? []} sources={ga4Sources ?? []} pages={ga4Pages ?? []} devices={ga4Devices ?? []} isLoading={ga4Loading} />}
        {zichtbareTab === 'seo'              && <TabSeo blogs={blogs} isLoading={isLoading} />}
        {zichtbareTab === 'koppelingen'      && <TabKoppelingen ga4={ga4} ga4Fout={ga4Status?.fout} />}
      </div>
    </div>
  );
}
