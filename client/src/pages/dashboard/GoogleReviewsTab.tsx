/**
 * Dashboard: Google-reviews.
 *
 * Koppelen met Google Business Profile, handmatig ophalen en per review kiezen
 * waar hij hoort: Medewerker (komt op de site bij 4 of 5 sterren), Klant of
 * Niet tonen. Een nieuwe review staat op "Nog kiezen" en komt niet op de site.
 */
import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest, fetchJson } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Star, RefreshCw, Link, Copy, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Status {
  geconfigureerd: boolean;
  gekoppeld: boolean;
  locatieNaam: string | null;
  gemiddelde: number | null;
  totaal: number | null;
  gekoppeldOp: string | null;
  laatsteSync: string | null;
  laatsteFout: string | null;
  redirectUri: string;
}

interface Review {
  id: number;
  auteur: string;
  auteurFoto: string | null;
  sterren: number | null;
  tekst: string;
  reactie: string | null;
  categorie: string;
  geplaatstOp: string | null;
}

const KEUZES: { waarde: string; label: string }[] = [
  { waarde: 'onbekend', label: 'Nog kiezen' },
  { waarde: 'medewerker', label: 'Medewerker' },
  { waarde: 'klant', label: 'Klant' },
  { waarde: 'verborgen', label: 'Niet tonen' },
];

const MELDINGEN: Record<string, string> = {
  gekoppeld: 'Gekoppeld met Google. De reviews zijn opgehaald.',
  'gekoppeld-met-fout': 'Gekoppeld, maar het ophalen lukte nog niet. Zie de foutmelding hieronder.',
  geweigerd: 'Je hebt bij Google geen toestemming gegeven.',
  ongeldig: 'De koppeling is verlopen of ongeldig. Probeer het opnieuw.',
  mislukt: 'Koppelen mislukt. Zie de serverlog voor details.',
};

function datum(x: string | null) {
  return x ? new Date(x).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
}

export default function GoogleReviewsTab() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('alle');
  const melding = useMemo(() => {
    try { return MELDINGEN[new URLSearchParams(window.location.search).get('google') || ''] || null; } catch { return null; }
  }, []);

  const status = useQuery<Status>({ queryKey: ['/api/admin/google/status'], queryFn: () => fetchJson<Status>('/api/admin/google/status') });
  const reviews = useQuery<Review[]>({
    queryKey: ['/api/admin/google/reviews'],
    queryFn: () => fetchJson<Review[]>('/api/admin/google/reviews'),
    enabled: !!status.data?.gekoppeld,
  });

  const sync = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/google/sync'),
    onSuccess: (r: any) => {
      toast({ title: 'Opgehaald', description: `${r?.opgehaald ?? 0} reviews bijgewerkt.` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/google/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/google/reviews'] });
    },
    onError: (e: any) => {
      toast({ title: 'Ophalen mislukt', description: String(e?.message || e), variant: 'destructive' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/google/status'] });
    },
  });

  const zetCategorie = useMutation({
    mutationFn: ({ id, categorie }: { id: number; categorie: string }) => apiRequest('PATCH', `/api/admin/google/reviews/${id}`, { categorie }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/google/reviews'] }),
    onError: (e: any) => toast({ title: 'Opslaan mislukt', description: String(e?.message || e), variant: 'destructive' }),
  });

  const s = status.data;
  const lijst = (reviews.data || []).filter((r) => filter === 'alle' || r.categorie === filter);
  const telling = (c: string) => (reviews.data || []).filter((r) => r.categorie === c).length;
  const opSite = (reviews.data || []).filter((r) => r.categorie === 'medewerker' && (r.sterren ?? 0) >= 4 && r.tekst.trim()).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Star className="w-5 h-5" /> Google-reviews</h1>
        <p className="text-sm text-gray-500 mt-1">
          De score en het aantal komen elke dag automatisch van Google. Kies per review waar hij hoort.
          Medewerkerreviews met 4 of 5 sterren komen op de site.
        </p>
      </div>

      {melding && <div className="rounded-xl border bg-gray-50 px-4 py-3 text-sm">{melding}</div>}

      <section className="rounded-2xl border bg-white p-5 space-y-4">
        {status.isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : !s?.geconfigureerd ? (
          <div className="space-y-3 text-sm">
            <p className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Nog niet ingesteld</p>
            <ol className="list-decimal pl-5 space-y-1 text-gray-600">
              <li>Vraag in Google Cloud toegang aan tot de Business Profile API's en zet ze aan.</li>
              <li>Maak een OAuth-client (webtoepassing) en zet deze redirect-URI erin.</li>
              <li>Zet de Client ID en het Client Secret in de Secrets van Replit als GBP_CLIENT_ID en GBP_CLIENT_SECRET, en publiceer opnieuw.</li>
            </ol>
            <RedirectUri uri={s?.redirectUri || ''} />
          </div>
        ) : !s.gekoppeld ? (
          <div className="space-y-3 text-sm">
            <p>Log één keer in met het Google-account dat het bedrijfsprofiel van EXTRA beheert.</p>
            <a href="/api/admin/google/koppelen" className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2.5 font-semibold">
              <Link className="w-4 h-4" /> Koppelen met Google
            </a>
            <RedirectUri uri={s.redirectUri} />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <div className="text-3xl font-bold">{s.gemiddelde != null ? s.gemiddelde.toFixed(1).replace('.', ',') : '-'}</div>
              <div className="text-xs text-gray-500">uit {s.totaal ?? '-'} Google-reviews</div>
            </div>
            <div className="text-sm text-gray-600 space-y-0.5">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-600" /> Gekoppeld{s.locatieNaam ? ` met ${s.locatieNaam}` : ''}</div>
              <div>Laatst opgehaald: {datum(s.laatsteSync)}</div>
              <div>Op de site: {opSite} medewerkerreviews</div>
            </div>
            <button
              onClick={() => sync.mutate()}
              disabled={sync.isPending}
              className="ml-auto inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {sync.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Nu ophalen
            </button>
          </div>
        )}
        {s?.laatsteFout && (
          <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">Laatste fout: {s.laatsteFout}</p>
        )}
      </section>

      {s?.gekoppeld && (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[{ waarde: 'alle', label: `Alle (${reviews.data?.length ?? 0})` }, ...KEUZES.map((k) => ({ waarde: k.waarde, label: `${k.label} (${telling(k.waarde)})` }))].map((k) => (
              <button
                key={k.waarde}
                onClick={() => setFilter(k.waarde)}
                className={`rounded-full px-3 py-1.5 text-sm border ${filter === k.waarde ? 'bg-gray-900 text-white border-gray-900' : 'bg-white'}`}
              >
                {k.label}
              </button>
            ))}
          </div>
          {reviews.isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          {lijst.map((r) => (
            <article key={r.id} className="rounded-2xl border bg-white p-4 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  {r.auteurFoto ? <img src={r.auteurFoto} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" /> : null}
                  <b className="truncate">{r.auteur}</b>
                  <span className="text-amber-500">{'★'.repeat(r.sterren ?? 0)}<span className="text-gray-300">{'★'.repeat(5 - (r.sterren ?? 0))}</span></span>
                  <span className="text-gray-400">{datum(r.geplaatstOp)}</span>
                </div>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{r.tekst || <i className="text-gray-400">Alleen sterren, geen tekst</i>}</p>
                {r.reactie && <p className="text-xs text-gray-500 mt-2 border-l-2 pl-2">Reactie EXTRA: {r.reactie}</p>}
              </div>
              <div className="flex sm:flex-col gap-1 shrink-0">
                {KEUZES.map((k) => (
                  <button
                    key={k.waarde}
                    onClick={() => zetCategorie.mutate({ id: r.id, categorie: k.waarde })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${r.categorie === k.waarde ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600'}`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </article>
          ))}
          {!reviews.isLoading && lijst.length === 0 && <p className="text-sm text-gray-500">Geen reviews in deze selectie.</p>}
        </section>
      )}
    </div>
  );
}

function RedirectUri({ uri }: { uri: string }) {
  const { toast } = useToast();
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500">Redirect-URI:</span>
      <code className="bg-gray-100 rounded px-2 py-1 break-all">{uri}</code>
      <button
        onClick={() => { navigator.clipboard?.writeText(uri); toast({ title: 'Gekopieerd' }); }}
        className="p-1 rounded hover:bg-gray-100"
        aria-label="Kopieer redirect-URI"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
