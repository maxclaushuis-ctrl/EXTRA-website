/**
 * SALESFLOW — persoonsgericht kanban-bord (direct-mailing opvolging).
 * Pipedrive-stijl: wit bord, dunne scheidingslijnen, kleur alleen als status-stip.
 *
 * Robuustheid:
 * - GEEN window.prompt/confirm (die worden in de Replit-preview geblokkeerd
 *   waardoor "er niks gebeurt") — alles via echte dialogen.
 * - Fouten van het bord of de batches-lijst zijn ALTIJD zichtbaar als rode
 *   banner op de pagina, met een knop om het opnieuw te proberen.
 * - Een nieuwe batch wordt direct geselecteerd in het batch-filter.
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, pointerWithin, rectIntersection,
  type CollisionDetection, type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';

// Drop-doel bepalen op basis van de MUISPOSITIE, niet de kaart-rechthoek.
// Met rectIntersection (de default) 'wint' de bronkolom vaak omdat de brede
// kaart daar nog het meest mee overlapt — de kaart springt dan terug.
const dropOpMuispositie: CollisionDetection = (args) => {
  const raak = pointerWithin(args);
  return raak.length > 0 ? raak : rectIntersection(args);
};
import { Plus, Search, Settings2, Check, ArrowUp, ArrowDown, Trash2, FolderPlus, AlertTriangle, RefreshCw } from 'lucide-react';

interface Rule { phase: string; label: string; position: number; triggerDays: number | null; triggerAction: string | null; isEndState: boolean; behavior?: string; asksChannel?: boolean; asksAppointment?: boolean; useBusinessDays?: boolean; }
interface Card {
  id: number; phase: string; eigenaarUserId: number | null; eigenaarNaam: string | null;
  nextActionAt: string | null; nextActionType: string | null; channel: string | null;
  appointmentAt: string | null;
  notReachedCount: number; snoozeUntil: string | null; notes: string | null; batchId: number | null;
  contactNaam: string; contactFunctie: string | null; contactEmail: string | null;
  companyId: number; bedrijfNaam: string; categorie: string | null; city: string | null;
  daysOverdue: number; createdByName: string | null;
}
interface Batch { id: number; name: string; categorie: string | null; cardCount: number; }
interface Owner { id: number; naam: string; email: string; }

// 'none' en 'afspraak' zijn geen echte trigger-acties maar keuzes in dezelfde
// dropdown: 'none' → geen reminder, 'afspraak' → vraag om een datum en maak
// evenmin een reminder. Ze worden bij het opslaan vertaald naar
// triggerAction + asksAppointment (zie opslaan() in FasesInstellen).
const ACTIE_OPTIES: [string, string][] = [
  ['none', 'Geen actie'], ['afspraak', 'Afspraak plannen'],
  ['bellen', 'Bellen'], ['opnieuw_bellen', 'Opnieuw bellen'],
  ['opvolgen', 'Opvolgen'], ['mailen', 'Mailen'], ['appen', 'Appen'], ['langsgaan', 'Langsgaan'],
];
const actieLabel = (a: string | null | undefined) =>
  ACTIE_OPTIES.find(([v]) => v === a)?.[1] ?? (a ? a.charAt(0).toUpperCase() + a.slice(1) : 'reminder');
/** Bij deze keuzes is een termijn in werkdagen betekenisloos. */
const zonderTermijn = (actie: string) => actie === 'none' || actie === 'afspraak';

const foutTekst = (e: any) => e?.data?.message || e?.message || 'Onbekende fout';

function initialen(naam: string) { return naam.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(); }

function statusVan(card: Card, rule?: Rule): { kleur: string; tekst: string; laat: boolean } {
  if (rule?.behavior === 'deal') return { kleur: '#3aa76d', tekst: 'Deal gesloten', laat: false };
  if (rule?.behavior === 'snooze') return { kleur: '#c9ccd8', tekst: card.snoozeUntil ? `Terug op ${fmt(card.snoozeUntil)}` : 'Afgesloten', laat: false };
  // Afspraakfase: de datum die JIJ hebt ingevoerd, niet een berekende actie.
  // Een afspraak die geweest is wordt grijs — informatief, nooit 'te laat',
  // want er hangt bewust geen opvolgactie aan.
  if (rule?.asksAppointment) {
    if (!card.appointmentAt) return { kleur: '#c9ccd8', tekst: 'Datum nog invullen', laat: false };
    const min = minutenTot(card.appointmentAt);
    if (min < 0) return { kleur: '#c9ccd8', tekst: `Afspraak was ${fmtMoment(card.appointmentAt)}`, laat: false };
    if (min < 60 * 24) return { kleur: '#e8a13c', tekst: `Afspraak ${fmtMoment(card.appointmentAt)}`, laat: false };
    return { kleur: '#3aa76d', tekst: `Afspraak ${fmtMoment(card.appointmentAt)}`, laat: false };
  }
  if (!card.nextActionAt) return { kleur: '#c9ccd8', tekst: 'Geen actie gepland', laat: false };
  const actie = actieLabel(card.nextActionType);
  if (card.daysOverdue > 0) return { kleur: '#d6453d', tekst: `${actie} — ${card.daysOverdue} dg te laat`, laat: true };
  const dagen = daysUntil(card.nextActionAt);
  if (dagen <= 1) return { kleur: '#e8a13c', tekst: `${actie} — ${dagen === 0 ? 'vandaag' : 'morgen'}`, laat: false };
  return { kleur: '#3aa76d', tekst: `${actie} — ${fmt(card.nextActionAt)}`, laat: false };
}
function fmt(d: string) { return new Date(d + 'T00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }); }
function daysUntil(d: string) { return Math.round((new Date(d + 'T00:00').getTime() - new Date(new Date().toDateString()).getTime()) / 86400000); }

/** 'YYYY-MM-DDTHH:MM' → '19 aug 14:00'. De server stuurt dit als tekst, dus
 *  hier gebeurt géén tijdzone-conversie: 14:00 blijft 14:00. */
function fmtMoment(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const datum = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  const tijd = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const vandaag = new Date().toDateString() === d.toDateString();
  return `${vandaag ? 'vandaag' : datum} ${tijd}`;
}
function minutenTot(s: string) { return Math.round((new Date(s).getTime() - Date.now()) / 60000); }
/** Standaardwaarde voor het datum-tijdveld: morgen 10:00, in lokale tijd. */
function morgenTien() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function KaartView({ card, rule }: { card: Card; rule?: Rule }) {
  const st = statusVan(card, rule);
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-purple-300 hover:shadow-sm transition-colors">
      <div className="text-[13px] font-semibold text-gray-900 leading-tight">{card.contactNaam}</div>
      <div className="text-[12px] text-gray-500">{card.bedrijfNaam}{card.contactFunctie ? ` · ${card.contactFunctie}` : ''}</div>
      <div className="flex items-center gap-2 mt-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st.kleur }} />
        <span className={`text-[11.5px] ${st.laat ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{st.tekst}</span>
        {card.eigenaarNaam && (
          <span className="ml-auto w-5 h-5 rounded-full bg-purple-50 text-purple-700 text-[9px] font-bold flex items-center justify-center" title={card.eigenaarNaam}>
            {initialen(card.eigenaarNaam)}
          </span>
        )}
      </div>
      {(card.channel || card.createdByName) && (
        <div className="text-[10.5px] text-gray-400 mt-1.5">
          {card.channel && <>Via {card.channel === 'linkedin' ? 'LinkedIn' : 'e-mail'}</>}
          {card.channel && card.createdByName && ' · '}
          {card.createdByName && <>Toegevoegd door {card.createdByName}</>}
        </div>
      )}
    </div>
  );
}

function DraggableKaart({ card, rule, onOpen }: { card: Card; rule?: Rule; onOpen: (c: Card) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} onClick={() => onOpen(card)}
      className={`mb-2 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}>
      <KaartView card={card} rule={rule} />
    </div>
  );
}

function Kolom({ rule, cards, batchId, onBatchAdvance, onKaartOpen }: { rule: Rule; cards: Card[]; batchId: number | null; onBatchAdvance: (from: string) => void; onKaartOpen: (c: Card) => void; }) {
  const { setNodeRef, isOver } = useDroppable({ id: rule.phase });
  const triggerRegel = rule.isEndState
    ? (rule.behavior === 'deal' ? 'Bedrijf → Bestaande klanten' : rule.behavior === 'snooze' ? 'Sluimert → terug in eerste kolom' : 'Eindfase')
    : rule.asksAppointment ? 'Afspraakdatum invoeren'
    : rule.triggerAction && rule.triggerDays != null ? `Na ${rule.triggerDays} dagen → ${actieLabel(rule.triggerAction)}`
    : rule.triggerAction == null ? 'Geen actie'
    : 'Voorbereiden';
  return (
    <div ref={setNodeRef} className={`flex-1 min-w-[200px] border-r border-gray-100 last:border-r-0 flex flex-col ${isOver ? 'bg-purple-50/40' : ''}`}>
      <div className="px-3 pt-3 pb-2.5 border-b-2" style={{ borderColor: rule.isEndState ? '#d9ece0' : '#e6e2f5' }}>
        <div className="flex items-baseline">
          <span className="text-[13px] font-semibold text-gray-800">{rule.label}</span>
          <span className="ml-auto text-[12px] text-gray-400">{cards.length}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-gray-400">{triggerRegel}</span>
          {batchId && !rule.isEndState && cards.length > 0 && (
            <button onClick={() => onBatchAdvance(rule.phase)} title="Hele kolom doorzetten" className="ml-auto text-[10px] text-purple-600 hover:text-purple-800">batch ▸</button>
          )}
        </div>
      </div>
      <div className="p-2.5 bg-gray-50/60 flex-1 min-h-[420px]">
        {cards.map(c => <DraggableKaart key={c.id} card={c} rule={rule} onOpen={onKaartOpen} />)}
      </div>
    </div>
  );
}

function FoutBanner({ titel, fout, onRetry, retryLabel }: { titel: string; fout: any; onRetry: () => void; retryLabel?: string }) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-[13px]">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="flex-1"><b>{titel}:</b> {foutTekst(fout)}</span>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 border-red-300 text-red-700 hover:bg-red-100 shrink-0">
        <RefreshCw className="w-3.5 h-3.5" /> {retryLabel ?? 'Opnieuw proberen'}
      </Button>
    </div>
  );
}

export default function SalesFlowTab() {
  const { toast } = useToast();
  const [batch, setBatch] = useState<string>('alle');
  const [eigenaar, setEigenaar] = useState<string>('alle');
  const [categorie, setCategorie] = useState<string>('alle');
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  // Uitgestelde drag-acties die eerst input nodig hebben (kanaal / sluimerduur)
  const [detailKaart, setDetailKaart] = useState<Card | null>(null);
  const [kanaalVoor, setKanaalVoor] = useState<{ cardId: number; phase: string } | null>(null);
  const [sluimerVoor, setSluimerVoor] = useState<{ cardId: number; phase: string } | null>(null);
  const [afspraakVoor, setAfspraakVoor] = useState<{ cardId: number; phase: string; huidig: string | null } | null>(null);
  const [advanceVraag, setAdvanceVraag] = useState<{ batchId: number; fromPhase: string; fromLabel: string; toPhase: string; toLabel: string; aantal: number } | null>(null);

  // distance 3: slepen start vrijwel direct; kaarten hebben geen klik-actie dus dit is veilig.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

  // Defensief: als de server (bv. met oude code) géén nette lijst teruggeeft,
  // tonen we een lege lijst in plaats van een wit foutscherm.
  const batchesQuery = useQuery<Batch[]>({ queryKey: ['/api/sales/flow/batches'], queryFn: () => apiRequest('/api/sales/flow/batches') as Promise<any> });
  const batches = Array.isArray(batchesQuery.data) ? batchesQuery.data : [];
  // Eigenaren = alle admin-accounts (volgt automatisch de Admin-accounts-pagina).
  const ownersQuery = useQuery<Owner[]>({ queryKey: ['/api/sales/flow/owners'], queryFn: () => apiRequest('/api/sales/flow/owners') as Promise<any> });
  const owners = Array.isArray(ownersQuery.data) ? ownersQuery.data : [];
  const flowQuery = useQuery<{ rules: Rule[]; cards: Card[] }>({
    queryKey: ['/api/sales/flow', batch, eigenaar, categorie],
    queryFn: () => apiRequest(`/api/sales/flow?batch=${batch}&eigenaar=${eigenaar}&categorie=${categorie}`) as Promise<any>,
  });
  const { data, isLoading } = flowQuery;

  const [moveFout, setMoveFout] = useState<string | null>(null);
  const move = useMutation({
    mutationFn: (v: { id: number; phase: string; channel?: string; snoozeUntil?: string | null; appointmentAt?: string | null }) =>
      apiRequest('PATCH', `/api/sales/flow/cards/${v.id}/move`, {
        phase: v.phase, channel: v.channel ?? null, snoozeUntil: v.snoozeUntil ?? null,
        ...(v.appointmentAt !== undefined ? { appointmentAt: v.appointmentAt } : {}),
      }),
    // Optimistisch: de kaart blijft direct in de nieuwe kolom staan; alleen als
    // de server weigert, springt hij terug mét een zichtbare foutmelding.
    onMutate: async (v) => {
      setMoveFout(null);
      await queryClient.cancelQueries({ queryKey: ['/api/sales/flow'] });
      const prev = queryClient.getQueriesData<{ rules: Rule[]; cards: Card[] }>({ queryKey: ['/api/sales/flow'] });
      queryClient.setQueriesData<{ rules: Rule[]; cards: Card[] }>({ queryKey: ['/api/sales/flow'] }, (old) =>
        old ? { ...old, cards: old.cards.map(c => c.id === v.id ? { ...c, phase: v.phase } : c) } : old);
      return { prev };
    },
    onError: (e: any, _v, ctx: any) => {
      ctx?.prev?.forEach(([key, data]: [any, any]) => queryClient.setQueryData(key, data));
      setMoveFout(foutTekst(e));
      toast({ title: 'Verplaatsen mislukt', description: foutTekst(e), variant: 'destructive' });
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['/api/sales/flow'] }); },
  });
  const batchAdvance = useMutation({
    mutationFn: (v: { batchId: number; fromPhase: string; toPhase: string }) => apiRequest('POST', '/api/sales/flow/batch-advance', v),
    onSuccess: (r: any) => { queryClient.invalidateQueries({ queryKey: ['/api/sales/flow'] }); toast({ title: `${r.moved} kaart(en) doorgezet` }); },
    onError: (e: any) => toast({ title: 'Batch-actie mislukt', description: foutTekst(e), variant: 'destructive' }),
  });

  const rules = Array.isArray(data?.rules) ? data!.rules : [];
  const cards = Array.isArray(data?.cards) ? data!.cards : [];
  const ruleByPhase = useMemo(() => Object.fromEntries(rules.map(r => [r.phase, r])), [rules]);
  const perFase = useMemo(() => {
    const m: Record<string, Card[]> = {};
    for (const r of rules) m[r.phase] = [];
    for (const c of cards) (m[c.phase] ??= []).push(c);
    return m;
  }, [rules, cards]);
  const countByPhase = useMemo(() => Object.fromEntries(rules.map(r => [r.phase, (perFase[r.phase] ?? []).length])), [rules, perFase]);

  const acties = useMemo(() => {
    const open = cards.filter(c => c.nextActionAt && ruleByPhase[c.phase]?.behavior !== 'deal' && ruleByPhase[c.phase]?.behavior !== 'snooze');
    return { vandaag: open.filter(c => c.daysOverdue === 0 && daysUntil(c.nextActionAt!) <= 0).length, laat: open.filter(c => c.daysOverdue > 0).length };
  }, [cards, ruleByPhase]);

  // Een klik direct ná een sleep mag het detailvenster niet openen.
  const netGesleept = useRef(false);
  const openKaart = (c: Card) => { if (!netGesleept.current) setDetailKaart(c); };

  function onDragStart(e: DragStartEvent) { netGesleept.current = true; setActiveCard(cards.find(c => c.id === e.active.id) ?? null); }
  function onDragEnd(e: DragEndEvent) {
    setTimeout(() => { netGesleept.current = false; }, 150);
    setActiveCard(null);
    const cardId = Number(e.active.id);
    const naarFase = e.over?.id as string | undefined;
    const card = cards.find(c => c.id === cardId);
    if (!card || !naarFase || card.phase === naarFase) return;
    const rule = ruleByPhase[naarFase];
    if (rule?.asksAppointment) { setAfspraakVoor({ cardId, phase: naarFase, huidig: card.appointmentAt }); return; }
    if (rule?.asksChannel) { setKanaalVoor({ cardId, phase: naarFase }); return; }
    if (rule?.behavior === 'snooze') { setSluimerVoor({ cardId, phase: naarFase }); return; }
    move.mutate({ id: cardId, phase: naarFase });
  }

  function onBatchAdvance(fromPhase: string) {
    if (batch === 'alle') return;
    const idx = rules.findIndex(r => r.phase === fromPhase);
    const next = rules[idx + 1];
    if (!next) return;
    setAdvanceVraag({
      batchId: parseInt(batch, 10), fromPhase, fromLabel: rules[idx].label,
      toPhase: next.phase, toLabel: next.label, aantal: (perFase[fromPhase] ?? []).length,
    });
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-start gap-3 flex-wrap mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Salesflow</h1>
          <p className="text-[13px] text-gray-500">Persoonlijke opvolging van direct mailings — gekoppeld aan Leads &amp; Prospects. <span className="text-gray-300">v10</span></p>
        </div>
        <div className="flex gap-2 ml-2 flex-wrap items-center">
          <SfSelect label="Batch" value={batch} onChange={setBatch} width="w-[190px]"
            opts={[['alle', 'Alle batches'], ...(batches ?? []).map(b => [String(b.id), `${b.name} (${b.cardCount})`] as [string, string])]} />
          <SfSelect label="Eigenaar" value={eigenaar} onChange={setEigenaar} width="w-[140px]"
            opts={[['alle', 'Iedereen'], ...owners.map(o => [String(o.id), o.naam] as [string, string])]} />
          <SfSelect label="Categorie" value={categorie} onChange={setCategorie} width="w-[130px]" opts={[['alle', 'Alle'], ['Hotel', 'Hotel'], ['Logistiek', 'Logistiek'], ['Events', 'Events']]} />
        </div>
      </div>

      {flowQuery.isError && <FoutBanner titel="Bord laden mislukt" fout={flowQuery.error} onRetry={() => flowQuery.refetch()} />}
      {batchesQuery.isError && <FoutBanner titel="Batches laden mislukt" fout={batchesQuery.error} onRetry={() => batchesQuery.refetch()} />}
      {moveFout && <FoutBanner titel="Verplaatsen mislukt — kaart is teruggezet" fout={{ message: moveFout }} onRetry={() => setMoveFout(null)} retryLabel="Sluiten" />}

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-[13px] text-gray-600"><b className="text-gray-900">{acties.vandaag} acties vandaag</b>{acties.laat > 0 && <> · <span className="text-red-600 font-semibold">{acties.laat} te laat</span></>}</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBatchOpen(true)} className="gap-1.5 text-gray-600"><FolderPlus className="w-4 h-4" /> Nieuwe batch</Button>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="gap-1.5 text-gray-600"><Settings2 className="w-4 h-4" /> Fases instellen</Button>
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4" /> Persoon toevoegen</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-sm py-20 text-center">Laden…</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={dropOpMuispositie} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex border border-gray-200 rounded-xl bg-white overflow-x-auto">
            {rules.map(r => <Kolom key={r.phase} rule={r} cards={perFase[r.phase] ?? []} batchId={batch !== 'alle' ? parseInt(batch, 10) : null} onBatchAdvance={onBatchAdvance} onKaartOpen={openKaart} />)}
          </div>
          {/* dropAnimation uit: geen 'terugvlieg'-animatie bij loslaten — de kaart
              staat door de optimistische update al direct in de nieuwe kolom. */}
          <DragOverlay dropAnimation={null}>{activeCard ? <div className="w-[210px]"><KaartView card={activeCard} rule={ruleByPhase[activeCard.phase]} /></div> : null}</DragOverlay>
        </DndContext>
      )}

      <div className="flex items-center gap-4 mt-3.5 text-[11.5px] text-gray-400">
        <Legenda kleur="#3aa76d" tekst="Actie gepland" />
        <Legenda kleur="#e8a13c" tekst="Vandaag/morgen" />
        <Legenda kleur="#d6453d" tekst="Te laat" />
        <Legenda kleur="#c9ccd8" tekst="Wacht / sluimert / geweest" />
      </div>

      {/* Afspraakdatum invullen bij verplaatsen naar een afspraak-kolom */}
      <AfspraakDialog
        open={!!afspraakVoor}
        huidig={afspraakVoor?.huidig ?? null}
        onClose={() => setAfspraakVoor(null)}
        onKies={(waarde) => {
          if (afspraakVoor) move.mutate({ id: afspraakVoor.cardId, phase: afspraakVoor.phase, appointmentAt: waarde });
          setAfspraakVoor(null);
        }}
      />

      <KaartDetail card={detailKaart} rule={detailKaart ? ruleByPhase[detailKaart.phase] : undefined} batches={batches ?? []} onClose={() => setDetailKaart(null)} />
      <PersoonToevoegen open={addOpen} batches={batches ?? []} owners={owners} huidigeBatch={batch} onClose={() => setAddOpen(false)} />
      <FasesInstellen open={settingsOpen} rules={rules} counts={countByPhase} onClose={() => setSettingsOpen(false)} />
      <NieuweBatch open={batchOpen} onClose={() => setBatchOpen(false)} onCreated={(b) => setBatch(String(b.id))} />

      {/* Kanaal kiezen bij verplaatsen naar een 'vraagt kanaal'-kolom */}
      <Dialog open={!!kanaalVoor} onOpenChange={(o) => !o && setKanaalVoor(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Via welk kanaal?</DialogTitle></DialogHeader>
          <p className="text-[13px] text-gray-500 -mt-1">Hoe is het bericht verstuurd?</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => { if (kanaalVoor) move.mutate({ id: kanaalVoor.cardId, phase: kanaalVoor.phase, channel: 'email' }); setKanaalVoor(null); }}>E-mail</Button>
            <Button variant="outline" onClick={() => { if (kanaalVoor) move.mutate({ id: kanaalVoor.cardId, phase: kanaalVoor.phase, channel: 'linkedin' }); setKanaalVoor(null); }}>LinkedIn</Button>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setKanaalVoor(null)}>Annuleren</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sluimerduur kiezen bij 'geen interesse' */}
      <SluimerDialog
        open={!!sluimerVoor}
        onClose={() => setSluimerVoor(null)}
        onKies={(snoozeUntil) => { if (sluimerVoor) move.mutate({ id: sluimerVoor.cardId, phase: sluimerVoor.phase, snoozeUntil }); setSluimerVoor(null); }}
      />

      {/* Bevestiging voor hele kolom doorzetten */}
      <Dialog open={!!advanceVraag} onOpenChange={(o) => !o && setAdvanceVraag(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Hele kolom doorzetten</DialogTitle></DialogHeader>
          <p className="text-[13px] text-gray-600">
            {advanceVraag?.aantal} kaart(en) in <b>"{advanceVraag?.fromLabel}"</b> doorzetten naar <b>"{advanceVraag?.toLabel}"</b>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvanceVraag(null)}>Annuleren</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { if (advanceVraag) batchAdvance.mutate({ batchId: advanceVraag.batchId, fromPhase: advanceVraag.fromPhase, toPhase: advanceVraag.toPhase }); setAdvanceVraag(null); }}>Doorzetten</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Detailvenster van een kaart (klik op een kaart op het bord).
 * Zoals in Pipedrive: gegevens + acties, waaronder "Van bord verwijderen"
 * (correctie — de persoon blijft gewoon in Leads & Prospects staan).
 */
function KaartDetail({ card, rule, batches, onClose }: { card: Card | null; rule?: Rule; batches: Batch[]; onClose: () => void }) {
  const { toast } = useToast();
  const [bevestig, setBevestig] = useState(false);
  const [afspraak, setAfspraak] = useState('');
  useEffect(() => { setBevestig(false); setAfspraak(card?.appointmentAt ?? ''); }, [card?.id, card?.appointmentAt]);
  const zetAfspraak = useMutation({
    mutationFn: (waarde: string | null) => apiRequest('PATCH', `/api/sales/flow/cards/${card!.id}`, { appointmentAt: waarde }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/flow'] });
      toast({ title: 'Afspraakdatum opgeslagen' });
    },
    onError: (e: any) => toast({ title: 'Opslaan mislukt', description: foutTekst(e), variant: 'destructive' }),
  });
  const verwijder = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/sales/flow/cards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/flow'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales/flow/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales/flow/contacts'] });
      toast({ title: 'Van het bord verwijderd', description: `${card?.contactNaam} staat nog gewoon in Leads & Prospects.` });
      onClose();
    },
    onError: (e: any) => toast({ title: 'Verwijderen mislukt', description: foutTekst(e), variant: 'destructive' }),
  });
  if (!card) return null;
  const st = statusVan(card, rule);
  const batchNaam = card.batchId ? batches.find(b => b.id === card.batchId)?.name : null;
  const rij = (label: string, waarde: string | null | undefined) => waarde ? (
    <div className="flex text-[13px] py-1"><span className="w-32 text-gray-400 shrink-0">{label}</span><span className="text-gray-800">{waarde}</span></div>
  ) : null;
  return (
    <Dialog open={!!card} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{card.contactNaam}</DialogTitle></DialogHeader>
        <div className="-mt-1">
          <div className="text-[13px] text-gray-500 mb-2">{card.bedrijfNaam}{card.contactFunctie ? ` · ${card.contactFunctie}` : ''}</div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st.kleur }} />
            <span className={`text-[12.5px] ${st.laat ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>{rule?.label} — {st.tekst}</span>
          </div>
          <div className="border-t border-gray-100 pt-2">
            {rij('E-mail', card.contactEmail)}
            {rij('Categorie', card.categorie)}
            {rij('Plaats', card.city)}
            {rij('Eigenaar', card.eigenaarNaam)}
            {rij('Batch', batchNaam)}
            {rij('Kanaal', card.channel === 'linkedin' ? 'LinkedIn' : card.channel === 'email' ? 'E-mail' : null)}
            {rij('Toegevoegd door', card.createdByName)}
            {card.notReachedCount > 0 ? rij('Niet bereikt', `${card.notReachedCount}×`) : null}
          </div>
          {rule?.asksAppointment && (
            <div className="border-t border-gray-100 mt-2 pt-2.5">
              <label className="text-[12px] text-gray-400 block mb-1">Datum en tijd van het gesprek</label>
              <div className="flex gap-2">
                <Input type="datetime-local" value={afspraak} onChange={e => setAfspraak(e.target.value)} className="h-9 text-sm" />
                <Button size="sm" variant="outline" disabled={zetAfspraak.isPending || afspraak === (card.appointmentAt ?? '')}
                  onClick={() => zetAfspraak.mutate(afspraak === '' ? null : afspraak)} className="shrink-0">
                  {zetAfspraak.isPending ? 'Bezig…' : 'Opslaan'}
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          {bevestig ? (
            <Button variant="destructive" size="sm" disabled={verwijder.isPending} onClick={() => verwijder.mutate(card.id)} className="gap-1.5">
              <Trash2 className="w-4 h-4" /> {verwijder.isPending ? 'Bezig…' : 'Definitief van bord halen'}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setBevestig(true)} className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
              <Trash2 className="w-4 h-4" /> Van bord verwijderen
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Sluiten</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Datum + tijd van het gesprek. Bewust een gewoon datetime-local-veld: de
 * browser levert daar zelf een kalender bij, in de taal van het systeem, en de
 * waarde ('YYYY-MM-DDTHH:MM') gaat één op één naar de server — geen
 * tijdzone-omrekening onderweg.
 *
 * "Nog niet bekend" is een volwaardige uitkomst: de kaart mag ook zonder datum
 * in de kolom staan. Hij toont dan 'Datum nog invullen' in grijs.
 */
function AfspraakDialog({ open, huidig, onClose, onKies }: { open: boolean; huidig: string | null; onClose: () => void; onKies: (waarde: string | null) => void }) {
  const [waarde, setWaarde] = useState('');
  useEffect(() => { if (open) setWaarde(huidig ?? morgenTien()); }, [open, huidig]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Wanneer is de afspraak?</DialogTitle></DialogHeader>
        <p className="text-[13px] text-gray-500 -mt-1">Deze datum komt op de kaart te staan. Er wordt géén reminder van gemaakt.</p>
        <Input type="datetime-local" value={waarde} onChange={e => setWaarde(e.target.value)} className="h-9 text-sm"
          onKeyDown={e => { if (e.key === 'Enter' && waarde) onKies(waarde); }} />
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" onClick={() => onKies(null)}>Nog niet bekend</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Annuleren</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" disabled={!waarde} onClick={() => onKies(waarde)}>Opslaan</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SluimerDialog({ open, onClose, onKies }: { open: boolean; onClose: () => void; onKies: (snoozeUntil: string | null) => void }) {
  const [maanden, setMaanden] = useState('3');
  const kies = () => {
    const n = parseInt(maanden, 10);
    if (!isNaN(n) && n > 0) {
      const d = new Date(); d.setMonth(d.getMonth() + n);
      onKies(d.toISOString().slice(0, 10));
    } else onKies(null);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Geen interesse — later opnieuw?</DialogTitle></DialogHeader>
        <p className="text-[13px] text-gray-500 -mt-1">Na deze periode komt de kaart automatisch terug in de eerste kolom.</p>
        <div className="flex items-center gap-2">
          <Input type="number" min={1} max={24} value={maanden} onChange={e => setMaanden(e.target.value)} className="h-9 w-24 text-sm" />
          <span className="text-[13px] text-gray-600">maanden</span>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onKies(null)}>Niet opnieuw benaderen</Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={kies}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SfSelect({ label, value, onChange, opts, width }: { label: string; value: string; onChange: (v: string) => void; opts: [string, string][]; width?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[12.5px] text-gray-400">{label}:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={`h-9 ${width ?? 'w-[150px]'}`}><SelectValue /></SelectTrigger>
        <SelectContent>{opts.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
function Legenda({ kleur, tekst }: { kleur: string; tekst: string }) {
  return <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: kleur }} />{tekst}</span>;
}

function NieuweBatch({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (b: { id: number; name: string }) => void }) {
  const { toast } = useToast();
  const [naam, setNaam] = useState('');
  const [categorie, setCategorie] = useState('geen');
  const maak = useMutation({
    mutationFn: () => apiRequest('POST', '/api/sales/flow/batches', { name: naam.trim(), categorie: categorie !== 'geen' ? categorie : null }),
    onSuccess: async (b: any) => {
      await queryClient.invalidateQueries({ queryKey: ['/api/sales/flow/batches'] });
      toast({ title: `Batch "${b.name}" aangemaakt`, description: 'De batch is nu geselecteerd in het filter.' });
      setNaam(''); setCategorie('geen'); onClose();
      if (b?.id) onCreated({ id: b.id, name: b.name });
    },
    onError: (e: any) => { console.error('[salesflow] batch aanmaken fout:', e); },
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nieuwe batch (mailing-ronde)</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[12px] text-gray-500 mb-1 block">Naam</label>
            <Input autoFocus value={naam} onChange={e => setNaam(e.target.value)} placeholder="Bijv. Mailing Hotels — juli" className="h-9 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && naam.trim() && !maak.isPending) maak.mutate(); }} />
          </div>
          <div>
            <label className="text-[12px] text-gray-500 mb-1 block">Categorie (optioneel)</label>
            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="geen">Geen</SelectItem>
                <SelectItem value="Hotel">Hotel</SelectItem>
                <SelectItem value="Logistiek">Logistiek</SelectItem>
                <SelectItem value="Events">Events</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {maak.isError && <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">Fout: {foutTekst(maak.error)}</div>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={() => maak.mutate()} disabled={!naam.trim() || maak.isPending} className="bg-purple-600 hover:bg-purple-700">{maak.isPending ? 'Bezig…' : 'Aanmaken'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ZoekContact { id: number; name: string; function: string | null; bedrijfNaam: string; categorie: string | null; opBord: boolean; }
function PersoonToevoegen({ open, batches, owners, huidigeBatch, onClose }: { open: boolean; batches: Batch[]; owners: Owner[]; huidigeBatch: string; onClose: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const ingelogdeNaam = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'Onbekend';
  const [q, setQ] = useState('');
  const [batchId, setBatchId] = useState<string>('geen');
  const [owner, setOwner] = useState<string>('');
  // Bij elk openen: standaard de batch van het actieve filter, en als eigenaar
  // de ingelogde gebruiker (als die in de eigenarenlijst staat).
  useEffect(() => {
    if (!open) return;
    setBatchId(huidigeBatch !== 'alle' ? huidigeBatch : 'geen');
    const zelf = owners.find(o => o.email?.toLowerCase() === user?.email?.toLowerCase());
    setOwner(zelf ? String(zelf.id) : (owners[0] ? String(owners[0].id) : ''));
  }, [open, huidigeBatch, owners, user?.email]);
  const zoek = useQuery<ZoekContact[]>({
    queryKey: ['/api/sales/flow/contacts', q],
    queryFn: () => apiRequest(`/api/sales/flow/contacts?search=${encodeURIComponent(q)}`) as Promise<any>,
    enabled: open,
  });
  const resultaten = zoek.data;
  const add = useMutation({
    mutationFn: (contactId: number) => apiRequest('POST', '/api/sales/flow/cards', { contactId, batchId: batchId !== 'geen' ? parseInt(batchId, 10) : null, eigenaar: owner || undefined, createdByName: ingelogdeNaam }),
    onSuccess: (_r, contactId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/flow'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales/flow/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales/flow/batches'] });
      const naam = resultaten?.find(c => c.id === contactId)?.name;
      const batchNaam = batchId !== 'geen' ? batches.find(b => String(b.id) === batchId)?.name : null;
      toast({ title: 'Toegevoegd aan het bord', description: batchNaam ? `${naam} — in batch "${batchNaam}"` : naam });
    },
    onError: (e: any) => { console.error('[salesflow] toevoegen fout:', e); },
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Persoon toevoegen aan het bord</DialogTitle></DialogHeader>
        {add.isError && <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">Fout: {foutTekst(add.error)}</div>}
        {zoek.isError && <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">Zoeken mislukt: {foutTekst(zoek.error)}</div>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-gray-500 mb-1 block">Batch (optioneel)</label>
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geen">Geen batch</SelectItem>
                  {batches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] text-gray-500 mb-1 block">Eigenaar</label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Kies eigenaar" /></SelectTrigger>
                <SelectContent>
                  {owners.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.naam}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Zoek in de hele leadlijst op naam of bedrijf…" className="pl-9 h-9 text-sm" />
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 -mx-1 px-1">
            {zoek.isLoading && <div className="text-[13px] text-gray-400 py-6 text-center">Zoeken…</div>}
            {(resultaten ?? []).map(c => (
              <div key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 truncate">{c.name}</div>
                  <div className="text-[11.5px] text-gray-500 truncate">{c.bedrijfNaam}{c.function ? ` · ${c.function}` : ''}{c.categorie ? ` · ${c.categorie}` : ''}</div>
                </div>
                {c.opBord
                  ? <span className="text-[11px] text-green-600 flex items-center gap-1 shrink-0"><Check className="w-3.5 h-3.5" /> Op bord</span>
                  : <Button variant="ghost" size="sm" className="h-7 text-purple-600 hover:text-purple-800 shrink-0" disabled={add.isPending} onClick={() => add.mutate(c.id)}>Toevoegen</Button>}
              </div>
            ))}
            {resultaten && resultaten.length === 0 && !zoek.isLoading && <div className="text-[13px] text-gray-400 py-6 text-center">Geen contacten gevonden</div>}
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Klaar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FaseBewerking { label: string; triggerDays: string; triggerAction: string }
function FasesInstellen({ open, rules, counts, onClose }: { open: boolean; rules: Rule[]; counts: Record<string, number>; onClose: () => void }) {
  const { toast } = useToast();
  const inval = () => queryClient.invalidateQueries({ queryKey: ['/api/sales/flow'] });
  const [bevestigVerwijder, setBevestigVerwijder] = useState<string | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  // Lokale bewerkstaat: wijzigingen worden pas doorgevoerd bij "Opslaan".
  const [edits, setEdits] = useState<Record<string, FaseBewerking>>({});
  const vanRule = (r: Rule): FaseBewerking => ({
    label: r.label,
    triggerDays: r.triggerDays == null ? '' : String(r.triggerDays),
    // asksAppointment wint: die fase heeft per definitie geen trigger-actie.
    triggerAction: r.asksAppointment ? 'afspraak' : (r.triggerAction ?? 'none'),
  });
  useEffect(() => {
    if (open) { setEdits(Object.fromEntries(rules.map(r => [r.phase, vanRule(r)]))); setFoutmelding(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const val = (r: Rule): FaseBewerking => edits[r.phase] ?? vanRule(r);
  const zet = (phase: string, r: Rule, patch: Partial<FaseBewerking>) =>
    setEdits(prev => ({ ...prev, [phase]: { ...(prev[phase] ?? vanRule(r)), ...patch } }));

  const reorder = useMutation({
    mutationFn: (order: string[]) => apiRequest('POST', '/api/sales/flow/rules/reorder', { order }),
    onSuccess: inval, onError: (e: any) => setFoutmelding(`Herordenen mislukt: ${foutTekst(e)}`),
  });
  const voegToe = useMutation({
    mutationFn: (label: string) => apiRequest('POST', '/api/sales/flow/rules', { label, triggerDays: 3, triggerAction: 'opvolgen' }),
    onSuccess: () => { inval(); toast({ title: 'Kolom toegevoegd' }); }, onError: (e: any) => setFoutmelding(`Kolom toevoegen mislukt: ${foutTekst(e)}`),
  });
  const verwijder = useMutation({
    mutationFn: (phase: string) => apiRequest('DELETE', `/api/sales/flow/rules/${phase}`),
    onSuccess: () => { inval(); toast({ title: 'Kolom verwijderd' }); setBevestigVerwijder(null); },
    onError: (e: any) => { setFoutmelding(`Verwijderen mislukt: ${foutTekst(e)}`); setBevestigVerwijder(null); },
  });

  // Alle gewijzigde rijen in één keer opslaan.
  async function opslaan() {
    setFoutmelding(null);
    setBezig(true);
    try {
      let aantal = 0;
      for (const r of rules) {
        const e = edits[r.phase];
        if (!e) continue;
        const body: any = {};
        const label = e.label.trim();
        if (label && label !== r.label) body.label = label;
        if (!r.isEndState) {
          // 'afspraak' is geen trigger-actie maar een vlag; 'none' betekent
          // geen actie. Beide leveren een lege termijn op — de server dwingt
          // dat ook af, zodat "Geen actie" nooit meer een reminder oplevert.
          const wilAfspraak = e.triggerAction === 'afspraak';
          const ta = zonderTermijn(e.triggerAction) ? null : e.triggerAction;
          const td = zonderTermijn(e.triggerAction)
            ? null
            : (e.triggerDays.trim() === '' ? null : parseInt(e.triggerDays, 10));
          if (!Number.isNaN(td as any) && td !== r.triggerDays) body.triggerDays = td;
          if (ta !== (r.triggerAction ?? null)) body.triggerAction = ta;
          if (wilAfspraak !== !!r.asksAppointment) body.asksAppointment = wilAfspraak;
        }
        if (Object.keys(body).length > 0) {
          await apiRequest('PATCH', `/api/sales/flow/rules/${r.phase}`, body);
          aantal++;
        }
      }
      inval();
      toast({ title: aantal > 0 ? `${aantal} kolom(men) opgeslagen` : 'Geen wijzigingen' });
      onClose();
    } catch (e: any) {
      setFoutmelding(`Opslaan mislukt: ${foutTekst(e)}`);
    } finally {
      setBezig(false);
    }
  }

  const [nieuw, setNieuw] = useState('');
  const move = (i: number, dir: -1 | 1) => {
    const order = rules.map(r => r.phase);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    reorder.mutate(order);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Fases instellen</DialogTitle></DialogHeader>
        <p className="text-[12.5px] text-gray-500 -mt-1">Pas kolomnaam, actie en het aantal werkdagen aan en klik op <b>Opslaan</b>. Kolommen toevoegen, verplaatsen of verwijderen gebeurt direct.</p>
        <p className="text-[12px] text-gray-400 -mt-2"><b>Geen actie</b> = geen reminder. <b>Afspraak plannen</b> vraagt bij het verslepen om een datum en tijd, en maakt evenmin een reminder aan.</p>
        {foutmelding && <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{foutmelding}</div>}
        <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-[auto,1fr,130px,90px,auto] gap-2 px-1 text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide items-center">
            <span></span><span>Kolomnaam</span><span>Actie</span><span>Werkdagen</span><span></span>
          </div>
          {rules.map((r, i) => (
            <div key={r.phase} className="grid grid-cols-[auto,1fr,130px,90px,auto] gap-2 items-center">
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => move(i, 1)} disabled={i === rules.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
              </div>
              <Input value={val(r).label} onChange={e => zet(r.phase, r, { label: e.target.value })} className="h-9 text-sm" />
              {r.isEndState ? (
                <span className="text-[12px] text-gray-400 pl-1">{r.behavior === 'deal' ? 'Deal' : 'Eindfase'}</span>
              ) : (
                <Select value={val(r).triggerAction} onValueChange={v => zet(r.phase, r, { triggerAction: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTIE_OPTIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              )}
              {/* Zonder actie is een termijn betekenisloos — het veld staat dan
                  uit. Voorheen kon je hier "0" laten staan bij "Geen actie",
                  wat tóch een reminder opleverde die meteen te laat was. */}
              {r.isEndState || zonderTermijn(val(r).triggerAction) ? (
                <span className="text-[12px] text-gray-300 pl-2">—</span>
              ) : (
                <Input type="number" min={0} max={90} value={val(r).triggerDays} placeholder="geen"
                  onChange={e => zet(r.phase, r, { triggerDays: e.target.value })} className="h-9 text-sm" />
              )}
              {bevestigVerwijder === r.phase ? (
                <button onClick={() => verwijder.mutate(r.phase)} className="text-[11px] font-semibold text-red-600 hover:text-red-800 whitespace-nowrap">Zeker?</button>
              ) : (
                <button title={counts[r.phase] > 0 ? 'Kolom bevat kaarten' : 'Kolom verwijderen'}
                  onClick={() => { if (counts[r.phase] > 0) { toast({ title: 'Kolom niet leeg', description: 'Verplaats eerst de kaarten' }); return; } setBevestigVerwijder(r.phase); setTimeout(() => setBevestigVerwijder(v => v === r.phase ? null : v), 3000); }}
                  className={`${counts[r.phase] > 0 ? 'text-gray-200' : 'text-gray-400 hover:text-red-600'}`}><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1 border-t border-gray-100 mt-1">
          <Input value={nieuw} onChange={e => setNieuw(e.target.value)} placeholder="Naam van nieuwe kolom…" className="h-9 text-sm"
            onKeyDown={e => { if (e.key === 'Enter' && nieuw.trim() && !voegToe.isPending) { voegToe.mutate(nieuw.trim()); setNieuw(''); } }} />
          <Button variant="outline" size="sm" disabled={!nieuw.trim() || voegToe.isPending} onClick={() => { voegToe.mutate(nieuw.trim()); setNieuw(''); }} className="gap-1.5 shrink-0"><Plus className="w-4 h-4" /> Kolom</Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={bezig}>Annuleren</Button>
          <Button onClick={opslaan} disabled={bezig} className="bg-purple-600 hover:bg-purple-700">{bezig ? 'Bezig…' : 'Opslaan'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
