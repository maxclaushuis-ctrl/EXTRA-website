/**
 * Google Search Console op het tabblad SEO & Content (Website Statistieken).
 * Data uit /api/admin/gsc/overzicht (server/gsc.ts), logica in shared/gsc.ts.
 * Bron: mock-up tracker/gsc.html.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GSC_PERIODES, positieKlasse, verschil, type GscPeriode, type GscKans } from '@shared/gsc';

const LIJN = 'border-[#ececef]';

type Cijfers = { klikken: number; vertoningen: number; ctr: number; positie: number };
type Overzicht = {
  site: string; start: string; eind: string;
  totaal: Cijfers; vorige: Cijfers | null;
  perDag: (Cijfers & { datum: string })[];
  zoekwoorden: { aantal: number; top: (Cijfers & { zoekwoord: string })[] };
  paginas: { aantal: number; top: (Cijfers & { pad: string })[] };
  kansen: GscKans[];
};
export type GscStatus = { configured: boolean; werkt?: boolean; site?: string; fout?: string };

const getal = (n: number) => Math.round(n).toLocaleString('nl-NL');
const komma = (n: number, d = 1) => n.toLocaleString('nl-NL', { minimumFractionDigits: d, maximumFractionDigits: d });
const procent = (ctr: number) => `${komma(ctr * 100)}%`;
const korteDatum = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '');

function Titel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">{children}</h2>;
}

function Pil({ aan, onClick, children }: { aan?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`h-7 px-3 rounded-full border text-xs font-semibold whitespace-nowrap ${aan ? 'bg-[#37352C] border-[#37352C] text-[#F8F7F4]' : `bg-white ${LIJN} text-gray-600 hover:text-gray-900`}`}>
      {children}
    </button>
  );
}

function Positie({ pos }: { pos: number }) {
  const k = positieKlasse(pos);
  const stijl = k === 'top' ? 'bg-[#E8F3E6] text-[#2F7A3E]' : k === 'pagina1' ? 'bg-[#F9EEDA] text-[#9A6B12]' : 'bg-[#EDEAE4] text-gray-600';
  return <span className={`inline-block min-w-[40px] text-center px-2 py-0.5 rounded-full text-xs font-bold ${stijl}`}>{komma(pos)}</span>;
}

/** Tegel met vergelijking. Bij positie is lager beter. */
function Tegel({ label, waarde, nu, vorige, soort }: { label: string; waarde: string; nu: number; vorige?: number | null; soort: 'aantal' | 'ctr' | 'positie' }) {
  let regel: React.ReactNode = null;
  if (vorige != null && vorige > 0) {
    if (soort === 'aantal') {
      const v = verschil(nu, vorige);
      if (v !== null) regel = <span className={v >= 0 ? 'text-[#2F7A3E]' : 'text-[#B3362B]'}>{v >= 0 ? '▲' : '▼'} {Math.abs(Math.round(v))}% t.o.v. vorige periode</span>;
    } else if (soort === 'ctr') {
      const p = (nu - vorige) * 100;
      regel = <span className={p >= 0 ? 'text-[#2F7A3E]' : 'text-[#B3362B]'}>{p >= 0 ? '▲' : '▼'} {komma(Math.abs(p))} punt</span>;
    } else {
      const p = nu - vorige;
      regel = <span className={p <= 0 ? 'text-[#2F7A3E]' : 'text-[#B3362B]'}>{p <= 0 ? '▲' : '▼'} {komma(Math.abs(p))} {p <= 0 ? 'hoger' : 'lager'}</span>;
    }
  }
  return (
    <div className={`bg-white border ${LIJN} rounded-2xl px-5 py-4`}>
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="text-[30px] font-extrabold tracking-tight text-gray-900 leading-tight my-1">{waarde}</div>
      <div className="text-xs font-bold min-h-[16px]">{regel}</div>
    </div>
  );
}

const th = 'text-[11px] font-bold uppercase tracking-[0.06em] text-gray-400 py-2 px-2 border-b border-[#ececef] whitespace-nowrap';
const td = 'py-2.5 px-2 border-b border-[#f3f1ec] tabular-nums whitespace-nowrap';

export default function GscSectie({ status, onNaarKoppelingen }: { status?: GscStatus; onNaarKoppelingen: () => void }) {
  const [periode, setPeriode] = useState<GscPeriode>('28');
  const [engels, setEngels] = useState(false);
  const werkt = !!status?.configured && status?.werkt !== false;

  const { data, isLoading, error } = useQuery<Overzicht>({
    queryKey: [`/api/admin/gsc/overzicht?periode=${periode}${engels ? '&taal=en' : ''}`],
    enabled: werkt,
    retry: false,
    staleTime: 10 * 60_000,
  });

  if (!status) return <Skeleton className="h-40 w-full" />;
  if (!status.configured || status.werkt === false) {
    return (
      <div className="bg-[#fdf8ec] border border-[#f3e3bd] rounded-2xl px-5 py-4">
        <p className="text-sm font-semibold text-[#7a5410]">Google Search Console is nog niet gekoppeld</p>
        {status.fout && <p className="text-xs text-[#9a6b15] mt-1">{status.fout}</p>}
        <button onClick={onNaarKoppelingen} className="text-xs font-semibold text-[#37352C] underline mt-2">Naar Koppelingen</button>
      </div>
    );
  }

  const periodeLabel = GSC_PERIODES.find(p => p.id === periode)?.label.toLowerCase() ?? '';
  const trend = (data?.perDag ?? []).map(d => ({ datum: korteDatum(d.datum), klikken: d.klikken, vertoningen: d.vertoningen }));

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Titel>Google Search Console · {periode === 'alles' ? 'alle beschikbare data (16 maanden)' : `laatste ${periodeLabel}`}</Titel>
        <div className="flex gap-1.5 flex-wrap">
          {GSC_PERIODES.map(p => <Pil key={p.id} aan={periode === p.id} onClick={() => setPeriode(p.id)}>{p.label}</Pil>)}
          <Pil aan={engels} onClick={() => setEngels(e => !e)}>Alleen Engels</Pil>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-semibold text-red-700">Search Console gaf een fout</p>
          <p className="text-xs text-red-600 mt-1 break-all">{(error as Error).message}</p>
        </div>
      ) : isLoading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[104px] rounded-2xl" />)}</div>
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tegel label="Klikken uit Google" waarde={getal(data.totaal.klikken)} nu={data.totaal.klikken} vorige={data.vorige?.klikken} soort="aantal" />
            <Tegel label="Vertoningen" waarde={getal(data.totaal.vertoningen)} nu={data.totaal.vertoningen} vorige={data.vorige?.vertoningen} soort="aantal" />
            <Tegel label="CTR" waarde={procent(data.totaal.ctr)} nu={data.totaal.ctr} vorige={data.vorige?.ctr} soort="ctr" />
            <Tegel label="Gemiddelde positie" waarde={komma(data.totaal.positie)} nu={data.totaal.positie} vorige={data.vorige?.positie} soort="positie" />
          </div>

          <div className={`bg-white border ${LIJN} rounded-2xl px-5 py-4`}>
            <div className="flex items-center justify-between mb-2">
              <Titel>Klikken en vertoningen per dag</Titel>
              <div className="flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-[#37352C] inline-block" />Klikken</span>
                <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-[#9CC3E6] inline-block" />Vertoningen</span>
              </div>
            </div>
            {trend.length === 0 ? <p className="text-sm text-gray-400 py-10 text-center">Nog geen data voor deze periode</p> : (
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f3f1ec" vertical={false} />
                  <XAxis dataKey="datum" tick={{ fontSize: 11, fill: '#7A7468' }} tickLine={false} axisLine={false} minTickGap={40} />
                  <YAxis yAxisId="k" tick={{ fontSize: 11, fill: '#7A7468' }} tickLine={false} axisLine={false} width={36} />
                  <YAxis yAxisId="v" orientation="right" tick={{ fontSize: 11, fill: '#7A7468' }} tickLine={false} axisLine={false} width={48} />
                  <Tooltip formatter={(v: any, n: any) => [getal(Number(v)), n === 'klikken' ? 'Klikken' : 'Vertoningen']} />
                  <Line yAxisId="v" type="monotone" dataKey="vertoningen" stroke="#9CC3E6" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="k" type="monotone" dataKey="klikken" stroke="#37352C" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className={`bg-white border ${LIJN} rounded-2xl px-5 py-4 min-w-0`}>
              <div className="flex items-center justify-between mb-2"><Titel>Top zoekwoorden</Titel><span className="text-xs text-gray-400">{getal(data.zoekwoorden.aantal)} zoekwoorden</span></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className={`${th} text-left`}>Zoekwoord</th><th className={`${th} text-right`}>Klikken</th><th className={`${th} text-right`}>Vertoningen</th><th className={`${th} text-right`}>CTR</th><th className={`${th} text-right`}>Positie</th></tr></thead>
                  <tbody>
                    {data.zoekwoorden.top.map(z => (
                      <tr key={z.zoekwoord}>
                        <td className={`${td} font-semibold text-gray-800 max-w-0 w-full truncate`} title={z.zoekwoord}>{z.zoekwoord}</td>
                        <td className={`${td} text-right`}>{getal(z.klikken)}</td><td className={`${td} text-right`}>{getal(z.vertoningen)}</td>
                        <td className={`${td} text-right`}>{procent(z.ctr)}</td><td className={`${td} text-right`}><Positie pos={z.positie} /></td>
                      </tr>
                    ))}
                    {data.zoekwoorden.top.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-400">Geen zoekwoorden in deze periode</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={`bg-white border ${LIJN} rounded-2xl px-5 py-4 min-w-0`}>
              <div className="flex items-center justify-between mb-2"><Titel>Top pagina's</Titel><span className="text-xs text-gray-400">{getal(data.paginas.aantal)} pagina's</span></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className={`${th} text-left`}>Pagina</th><th className={`${th} text-right`}>Klikken</th><th className={`${th} text-right`}>Vertoningen</th><th className={`${th} text-right`}>Positie</th></tr></thead>
                  <tbody>
                    {data.paginas.top.map(p => (
                      <tr key={p.pad}>
                        <td className={`${td} font-mono text-xs text-gray-600 max-w-0 w-full truncate`} title={p.pad}>{p.pad}</td>
                        <td className={`${td} text-right`}>{getal(p.klikken)}</td><td className={`${td} text-right`}>{getal(p.vertoningen)}</td>
                        <td className={`${td} text-right`}><Positie pos={p.positie} /></td>
                      </tr>
                    ))}
                    {data.paginas.top.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-gray-400">Geen pagina's in deze periode</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={`bg-white border ${LIJN} rounded-2xl px-5 py-4`}>
            <div className="flex items-center justify-between mb-1">
              <Titel>Kansen: veel vertoningen, net niet bovenaan</Titel>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E8F3E6] text-[#2F7A3E]">Positie 8 tot 20</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">Zoekwoorden waar we vaak verschijnen maar weinig klikken krijgen. Een betere title of een paar interne links kan hier het meeste opleveren.</p>
            {data.kansen.length === 0 ? <p className="text-sm text-gray-400 py-4">Geen kansen in deze periode</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className={`${th} text-left`}>Zoekwoord</th><th className={`${th} text-left`}>Pagina</th><th className={`${th} text-right`}>Vertoningen</th><th className={`${th} text-right`}>Klikken</th><th className={`${th} text-right`}>Positie</th></tr></thead>
                  <tbody>
                    {data.kansen.map(k => (
                      <tr key={k.zoekwoord}>
                        <td className={`${td} font-semibold text-gray-800`}>{k.zoekwoord}</td>
                        <td className={`${td} font-mono text-xs text-gray-600`}>{k.pad}</td>
                        <td className={`${td} text-right`}>{getal(k.vertoningen)}</td><td className={`${td} text-right`}>{getal(k.klikken)}</td>
                        <td className={`${td} text-right`}><Positie pos={k.positie} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Bron: Google Search Console, property {data.site.replace('sc-domain:', '')}, van {korteDatum(data.start)} tot en met {korteDatum(data.eind)}. Google loopt twee tot drie dagen achter.
          </p>
        </>
      )}
    </section>
  );
}
