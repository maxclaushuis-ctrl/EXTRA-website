/**
 * Zwevende AI-assistent voor het dashboard — knop rechtsonder, op elke
 * dashboardpagina beschikbaar (gemount in DashboardMockup.tsx, direct na
 * </main> zodat hij buiten de overflow/margin van de content valt).
 *
 * Gedrag: vragen gaan naar POST /api/admin/assistent/vraag; wanneer de
 * assistent een actie klaarzet (bijv. een template-verzending) verschijnt
 * een bevestigkaart met de ontvangers — pas na een klik op "Bevestigen"
 * wordt er echt verstuurd (POST .../acties/:id/bevestig). De assistent
 * zelf kan dus nooit versturen; zie server/assistant/assistentLogic.ts
 * voor het volledige veiligheidsmodel.
 *
 * De gespreksgeschiedenis leeft alleen in component-state: pagina verversen
 * = schone lei. Bewust — dit is een vraag-en-antwoordhulp, geen archief.
 */
import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import {
  annuleerActie,
  bevestigActie,
  stelVraag,
  type ActieVoorstel,
  type AssistentBericht,
} from '../api/assistentClient';

interface ChatBericht extends AssistentBericht {
  actie?: ActieVoorstel;
}

type ActieStatus =
  | { fase: 'wachtend' }
  | { fase: 'bezig' }
  | { fase: 'bevestigd'; samenvatting: string }
  | { fase: 'geannuleerd' }
  | { fase: 'mislukt'; melding: string };

const VOORBEELDVRAGEN = [
  'Hoeveel aanmeldingen hadden we afgelopen maand?',
  'Hoeveel websitebezoekers hadden we in juni?',
  'Hoeveel leads staan er in de salesflow per fase?',
  'Welke WhatsApp-templates zijn goedgekeurd?',
];

function ActieKaart({ actie, status, onBevestig, onAnnuleer }: {
  actie: ActieVoorstel;
  status: ActieStatus;
  onBevestig: () => void;
  onAnnuleer: () => void;
}) {
  const previewGetoond = actie.ontvangersPreview.slice(0, 5);
  const rest = actie.aantalOntvangers - previewGetoond.length;
  return (
    <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[13px]">
      <div className="font-semibold text-amber-900 mb-1">Actie wacht op jouw bevestiging</div>
      <div className="text-gray-800">{actie.omschrijving}</div>
      <div className="text-gray-600 mt-1">Aanleiding: {actie.reden}</div>
      <div className="text-gray-600 mt-1">
        Ontvangers: {previewGetoond.join(', ')}{rest > 0 ? ` en nog ${rest} anderen` : ''}
      </div>
      {status.fase === 'wachtend' && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={onBevestig}
            className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800"
          >
            Bevestigen en versturen
          </button>
          <button
            onClick={onAnnuleer}
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
          >
            Annuleren
          </button>
        </div>
      )}
      {status.fase === 'bezig' && (
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Bezig met versturen…
        </div>
      )}
      {status.fase === 'bevestigd' && (
        <div className="mt-3 text-xs font-semibold text-green-700">✓ {status.samenvatting}</div>
      )}
      {status.fase === 'geannuleerd' && (
        <div className="mt-3 text-xs font-semibold text-gray-500">Geannuleerd — er is niets verstuurd.</div>
      )}
      {status.fase === 'mislukt' && (
        <div className="mt-3 text-xs font-semibold text-red-600">{status.melding}</div>
      )}
    </div>
  );
}

export default function AiAssistent() {
  const [open, setOpen] = useState(false);
  const [berichten, setBerichten] = useState<ChatBericht[]>([]);
  const [invoer, setInvoer] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [actieStatussen, setActieStatussen] = useState<Record<string, ActieStatus>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [berichten, bezig]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function verstuur(tekst: string) {
    const vraag = tekst.trim();
    if (!vraag || bezig) return;
    setFout(null);
    setInvoer('');
    const historie: ChatBericht[] = [...berichten, { rol: 'gebruiker', tekst: vraag }];
    setBerichten(historie);
    setBezig(true);
    try {
      const resultaat = await stelVraag(historie.map(b => ({ rol: b.rol, tekst: b.tekst })));
      setBerichten(prev => [...prev, { rol: 'assistent', tekst: resultaat.antwoord, actie: resultaat.actie }]);
      if (resultaat.actie) {
        setActieStatussen(prev => ({ ...prev, [resultaat.actie!.id]: { fase: 'wachtend' } }));
      }
    } catch (e: any) {
      setFout(e?.message || 'Er ging iets mis — probeer het opnieuw.');
    } finally {
      setBezig(false);
    }
  }

  async function handleBevestig(actie: ActieVoorstel) {
    setActieStatussen(prev => ({ ...prev, [actie.id]: { fase: 'bezig' } }));
    try {
      const r = await bevestigActie(actie.id);
      const samenvatting = r.failed > 0
        ? `Verstuurd naar ${r.sent} van ${r.total} ontvangers (${r.failed} mislukt — zie WhatsApp Beheer voor details).`
        : `Verstuurd naar alle ${r.sent} ontvangers.`;
      setActieStatussen(prev => ({ ...prev, [actie.id]: { fase: 'bevestigd', samenvatting } }));
    } catch (e: any) {
      setActieStatussen(prev => ({
        ...prev,
        [actie.id]: { fase: 'mislukt', melding: e?.message || 'Versturen mislukt' },
      }));
    }
  }

  async function handleAnnuleer(actie: ActieVoorstel) {
    setActieStatussen(prev => ({ ...prev, [actie.id]: { fase: 'geannuleerd' } }));
    try { await annuleerActie(actie.id); } catch { /* al lokaal geannuleerd; server-TTL ruimt op */ }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="AI-assistent openen"
        // bottom-20: de toaster zit op bottom-0 right-0 z-50 — deze knop blijft daar onder vandaan.
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[min(400px,calc(100vw-2rem))] h-[min(620px,calc(100vh-5rem))] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Kop */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <div>
            <div className="text-sm font-bold leading-tight">AI-assistent</div>
            <div className="text-[11px] text-purple-200 leading-tight">Vraag naar je dashboard-data</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Sluiten" className="p-1 rounded-lg hover:bg-white/15">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Berichten */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
        {berichten.length === 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 px-1 mb-2">
              Stel een vraag over je data, of vraag me een template-verzending klaar te zetten — versturen gebeurt altijd pas na jouw bevestiging.
            </p>
            <div className="flex flex-col gap-1.5">
              {VOORBEELDVRAGEN.map(v => (
                <button
                  key={v}
                  onClick={() => verstuur(v)}
                  className="text-left text-xs px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}
        {berichten.map((b, i) => (
          <div key={i} className={b.rol === 'gebruiker' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                b.rol === 'gebruiker'
                  ? 'max-w-[85%] rounded-2xl rounded-br-md bg-purple-700 text-white px-3 py-2 text-[13px] whitespace-pre-wrap'
                  : 'max-w-[92%] rounded-2xl rounded-bl-md bg-white border border-gray-200 text-gray-800 px-3 py-2 text-[13px] whitespace-pre-wrap'
              }
            >
              {b.tekst}
              {b.actie && (
                <ActieKaart
                  actie={b.actie}
                  status={actieStatussen[b.actie.id] || { fase: 'wachtend' }}
                  onBevestig={() => handleBevestig(b.actie!)}
                  onAnnuleer={() => handleAnnuleer(b.actie!)}
                />
              )}
            </div>
          </div>
        ))}
        {bezig && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-white border border-gray-200 px-3 py-2 flex items-center gap-2 text-[13px] text-gray-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Bezig met uitzoeken…
            </div>
          </div>
        )}
        {fout && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fout}</div>
        )}
      </div>

      {/* Invoer */}
      <form
        onSubmit={e => { e.preventDefault(); verstuur(invoer); }}
        className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-200 bg-white shrink-0"
      >
        <input
          ref={inputRef}
          value={invoer}
          onChange={e => setInvoer(e.target.value)}
          disabled={bezig}
          placeholder="Stel een vraag…"
          className="flex-1 text-[13px] px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={bezig || !invoer.trim()}
          aria-label="Versturen"
          className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center hover:bg-purple-800 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
