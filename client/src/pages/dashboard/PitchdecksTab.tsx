/**
 * Dashboard: Pitchdecks.
 *
 * Per ontvanger een eigen link maken en zien wie welke presentatie opent,
 * wanneer, op welk apparaat, hoe lang en tot welke slide. De naam van de
 * ontvanger staat alleen hier; de link bevat een willekeurige code.
 * Server: server/pitchdeckTracker.ts. Logica: shared/pitchdecks.ts.
 */
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, fetchJson, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Copy, Loader2, Plus, X } from 'lucide-react';
import { D3Kop, D3Tegels, StatusLabel } from '@/pages/dashboard/d3';
import { kijktijd, leesStatus, type Deck } from '@shared/pitchdecks';

interface Link { id: number; deck: string; code: string; ontvanger: string; bedrijf: string | null; actief: boolean; aangemaaktOp: string }
interface Opening { id: number; deck: string; linkId: number | null; apparaat: string; aantalSlides: number; maxSlide: number; kijktijdSec: number; geopendOp: string }
interface Overzicht { decks: Deck[]; links: Link[]; openingen: Opening[] }

const KLEUR: Record<string, string> = { rose: '#EBD0E4', pistachio: '#CEDBBC', sky: '#C7DFF4' };
const SLEUTEL = ['/api/admin/pitchdecks'];
const BASIS = 'https://www.doehetextra.nl';

function wanneer(x: string | null) {
  if (!x) return '';
  const d = new Date(x);
  const dag = d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
  const tijd = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  return `${dag.charAt(0).toUpperCase()}${dag.slice(1)}, ${tijd}`;
}

function linkUrl(l: Link) {
  return `${BASIS}/pitchdeck/${l.deck}?k=${l.code}`;
}

export default function PitchdecksTab() {
  const { toast } = useToast();
  const [nieuw, setNieuw] = useState(false);
  const [deckFilter, setDeckFilter] = useState<string>('alle');
  const data = useQuery<Overzicht>({ queryKey: SLEUTEL, queryFn: () => fetchJson<Overzicht>('/api/admin/pitchdecks'), refetchInterval: 60_000 });

  const decks = data.data?.decks ?? [];
  const deckVan = (naam: string) => decks.find((d) => d.naam === naam);
  const links = data.data?.links ?? [];
  const openingen = data.data?.openingen ?? [];
  const linkVan = useMemo(() => new Map(links.map((l) => [l.id, l])), [links]);

  const perLink = useMemo(() => {
    const m = new Map<number, { keer: number; laatst: string | null; max: number; slides: number }>();
    for (const o of openingen) {
      if (o.linkId == null) continue;
      const r = m.get(o.linkId) ?? { keer: 0, laatst: null, max: 0, slides: 0 };
      r.keer++;
      if (!r.laatst || o.geopendOp > r.laatst) r.laatst = o.geopendOp;
      r.max = Math.max(r.max, o.maxSlide);
      r.slides = Math.max(r.slides, o.aantalSlides);
      m.set(o.linkId, r);
    }
    return m;
  }, [openingen]);

  const zichtbareOpeningen = openingen.filter((o) => deckFilter === 'alle' || o.deck === deckFilter);
  const zichtbareLinks = links.filter((l) => deckFilter === 'alle' || l.deck === deckFilter);

  const weekGeleden = Date.now() - 7 * 864e5;
  const dezeWeek = zichtbareOpeningen.filter((o) => new Date(o.geopendOp).getTime() > weekGeleden);
  const lezers = new Set(dezeWeek.map((o) => o.linkId ?? `anoniem-${o.deck}`)).size;
  const metTijd = zichtbareOpeningen.filter((o) => o.kijktijdSec > 0);
  const gemiddeld = metTijd.length ? Math.round(metTijd.reduce((t, o) => t + o.kijktijdSec, 0) / metTijd.length) : 0;
  const helemaal = zichtbareOpeningen.filter((o) => o.aantalSlides > 0 && o.maxSlide >= o.aantalSlides).length;
  const nietGeopend = zichtbareLinks.filter((l) => l.actief && !perLink.get(l.id)).length;

  const kopieer = (l: Link) => {
    navigator.clipboard?.writeText(linkUrl(l));
    toast({ title: 'Link gekopieerd', description: `${l.ontvanger}, ${deckVan(l.deck)?.titel ?? l.deck}` });
  };

  const zetActief = useMutation({
    mutationFn: (v: { id: number; actief: boolean }) => apiRequest('PATCH', `/api/admin/pitchdecks/links/${v.id}`, { actief: v.actief }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SLEUTEL }),
    onError: (e: any) => toast({ title: 'Niet gelukt', description: String(e?.message || e), variant: 'destructive' }),
  });

  return (
    <div className="space-y-5">
      <D3Kop titel="Pitchdecks" uitleg="Wie opent welke presentatie, wanneer en hoe ver er gelezen wordt">
        <button type="button" className="d3-knop vol" onClick={() => setNieuw(true)}><Plus /> Nieuwe link</button>
      </D3Kop>

      <div className="d3-tabs" role="tablist" aria-label="Presentatie">
        {[{ naam: 'alle', titel: 'Alle' }, ...decks].map((d) => (
          <button key={d.naam} type="button" role="tab" aria-selected={deckFilter === d.naam} className="d3-tab" onClick={() => setDeckFilter(d.naam)}>
            {d.titel}
          </button>
        ))}
      </div>

      <D3Tegels
        label="Cijfers"
        tegels={[
          { sleutel: 'week', titel: 'Geopend deze week', getal: dezeWeek.length, sub: `door ${lezers} ${lezers === 1 ? 'ontvanger' : 'ontvangers'}` },
          { sleutel: 'tijd', titel: 'Gemiddelde kijktijd', getal: kijktijd(gemiddeld), sub: 'minuten per opening' },
          { sleutel: 'helemaal', titel: 'Tot de laatste slide', getal: helemaal, sub: `van ${zichtbareOpeningen.length} openingen`, soort: 'goed' },
          { sleutel: 'niet', titel: 'Nog niet geopend', getal: nietGeopend, sub: 'links zonder opening', soort: nietGeopend ? 'letop' : 'standaard' },
        ]}
      />

      {data.isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
      {data.isError && <p className="text-sm text-red-700">Het overzicht kon niet geladen worden.</p>}

      <section className="d3-paneel">
        <div className="d3-voet" style={{ borderTop: 0, borderBottom: '1px solid #E4E0D8' }}><b style={{ color: '#37352C', fontSize: 15 }}>Openingen</b><span>Nieuwste bovenaan</span></div>
        {zichtbareOpeningen.length === 0 ? (
          <p className="p-6 text-sm d3-zacht">Nog geen openingen. Zodra iemand een deck opent, staat hij hier en krijg je een mail.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="d3-tabel">
              <thead><tr><th>Datum en tijd</th><th>Deck</th><th>Ontvanger</th><th>Apparaat</th><th>Kijktijd</th><th>Gelezen tot</th></tr></thead>
              <tbody>
                {zichtbareOpeningen.slice(0, 100).map((o) => {
                  const l = o.linkId != null ? linkVan.get(o.linkId) : undefined;
                  const deel = o.aantalSlides ? Math.min(100, Math.round((o.maxSlide / o.aantalSlides) * 100)) : 0;
                  return (
                    <tr key={o.id}>
                      <td className="d3-datum">{wanneer(o.geopendOp)}</td>
                      <td><DeckNaam deck={deckVan(o.deck)} naam={o.deck} /></td>
                      <td>{l ? <><b>{l.ontvanger}</b>{l.bedrijf && <span className="d3-sub">{l.bedrijf}</span>}</> : <span className="d3-zacht">Onbekende ontvanger</span>}</td>
                      <td>{o.apparaat}</td>
                      <td className="d3-datum">{kijktijd(o.kijktijdSec)}</td>
                      <td>
                        <span className="d3-score">
                          <span className="m" style={{ width: 90 }}><i style={{ width: `${deel}%` }} /></span>
                          <span style={{ fontWeight: 500 }}>{o.aantalSlides ? `${Math.min(o.maxSlide, o.aantalSlides)} van ${o.aantalSlides}` : ''}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="d3-paneel">
        <div className="d3-voet" style={{ borderTop: 0, borderBottom: '1px solid #E4E0D8' }}><b style={{ color: '#37352C', fontSize: 15 }}>Links</b><span>Eén link per ontvanger</span></div>
        {zichtbareLinks.length === 0 ? (
          <p className="p-6 text-sm d3-zacht">Nog geen links. Maak er een met "Nieuwe link".</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="d3-tabel">
              <thead><tr><th>Deck</th><th>Ontvanger</th><th>Link</th><th>Laatst geopend</th><th>Keer</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {zichtbareLinks.map((l) => {
                  const r = perLink.get(l.id);
                  const st = leesStatus(r?.max ?? 0, r?.slides ?? 0, r?.keer ?? 0);
                  return (
                    <tr key={l.id} style={l.actief ? undefined : { opacity: 0.55 }}>
                      <td><DeckNaam deck={deckVan(l.deck)} naam={l.deck} /></td>
                      <td><b>{l.ontvanger}</b>{l.bedrijf && <span className="d3-sub">{l.bedrijf}</span>}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <code style={{ fontSize: 12, background: '#EDEAE4', borderRadius: 6, padding: '3px 8px', color: '#5C594F' }}>doehetextra.nl/pitchdeck/{l.deck}?k={l.code}</code>
                          <button type="button" className="d3-link" onClick={() => kopieer(l)}><Copy className="inline w-3.5 h-3.5 mr-1" />Kopieer</button>
                        </span>
                      </td>
                      <td className="d3-datum">{r?.laatst ? wanneer(r.laatst) : <span className="d3-zacht">Nog niet</span>}</td>
                      <td>{r?.keer ?? 0}</td>
                      <td>
                        {!l.actief ? <StatusLabel soort="stop">Uitgezet</StatusLabel>
                          : st === 'helemaal' ? <StatusLabel soort="goed">Helemaal gelezen</StatusLabel>
                          : st === 'deels' ? <StatusLabel soort="letop">Deels gelezen</StatusLabel>
                          : <StatusLabel>Niet geopend</StatusLabel>}
                      </td>
                      <td>
                        <button type="button" className="d3-link" onClick={() => zetActief.mutate({ id: l.id, actief: !l.actief })}>
                          {l.actief ? 'Uitzetten' : 'Weer aanzetten'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs d3-zacht">Openingen terwijl je ingelogd bent in het dashboard tellen niet mee. Er wordt geen IP-adres opgeslagen, alleen het soort apparaat. Een uitgezette link opent de deck nog wel, maar telt als onbekende ontvanger.</p>

      {nieuw && <NieuweLink decks={decks} sluit={() => setNieuw(false)} gemaakt={(l) => { setNieuw(false); kopieer(l); }} />}
    </div>
  );
}

function DeckNaam({ deck, naam }: { deck?: Deck; naam: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <i style={{ width: 10, height: 10, borderRadius: '50%', background: KLEUR[deck?.kleur ?? ''] ?? '#E4E0D8', display: 'inline-block' }} />
      {deck?.titel ?? naam}
    </span>
  );
}

function NieuweLink({ decks, sluit, gemaakt }: { decks: Deck[]; sluit: () => void; gemaakt: (l: Link) => void }) {
  const { toast } = useToast();
  const [deck, setDeck] = useState(decks[0]?.naam ?? '');
  const [ontvanger, setOntvanger] = useState('');
  const [bedrijf, setBedrijf] = useState(decks[0]?.titel ?? '');
  const maak = useMutation({
    mutationFn: async () => {
      const r = await apiRequest('POST', '/api/admin/pitchdecks/links', { deck, ontvanger, bedrijf });
      return (typeof (r as any)?.json === 'function' ? await (r as any).json() : r) as Link;
    },
    onSuccess: (l) => { queryClient.invalidateQueries({ queryKey: SLEUTEL }); gemaakt(l); },
    onError: (e: any) => toast({ title: 'Link maken mislukt', description: String(e?.message || e), variant: 'destructive' }),
  });
  const veld = 'w-full rounded-xl border px-3 h-10 text-sm bg-white';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={sluit}>
      <form
        className="w-full max-w-md rounded-2xl border bg-white p-6 space-y-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (ontvanger.trim()) maak.mutate(); }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Nieuwe link maken</h2>
          <button type="button" onClick={sluit} aria-label="Sluiten" className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <label className="block text-xs font-semibold text-gray-600">Deck
          <select className={`${veld} mt-1`} value={deck} onChange={(e) => { setDeck(e.target.value); setBedrijf(decks.find((d) => d.naam === e.target.value)?.titel ?? ''); }}>
            {decks.map((d) => <option key={d.naam} value={d.naam}>{d.titel}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold text-gray-600">Naam ontvanger
          <input className={`${veld} mt-1`} value={ontvanger} onChange={(e) => setOntvanger(e.target.value)} autoFocus maxLength={120} />
        </label>
        <label className="block text-xs font-semibold text-gray-600">Bedrijf
          <input className={`${veld} mt-1`} value={bedrijf} onChange={(e) => setBedrijf(e.target.value)} maxLength={120} />
        </label>
        <p className="text-xs text-gray-500">De link krijgt een willekeurige code. De naam staat alleen in het dashboard, nooit in de link zelf.</p>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="d3-knop" onClick={sluit}>Annuleren</button>
          <button type="submit" className="d3-knop vol" disabled={!ontvanger.trim() || maak.isPending}>
            {maak.isPending ? <Loader2 className="animate-spin" /> : null} Link maken en kopiëren
          </button>
        </div>
      </form>
    </div>
  );
}
