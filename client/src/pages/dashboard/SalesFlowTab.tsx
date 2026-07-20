/**
 * SALESFLOW — persoonsgericht kanban-bord (direct-mailing opvolging).
 * Pipedrive-stijl: wit bord, dunne scheidingslijnen, kleur alleen als status-stip.
 * Verslepen roept /api/sales/flow/cards/:id/move aan → engine logt + plant reminder.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { Plus, Phone, X, Search, ChevronDown } from 'lucide-react';

interface Rule { phase: string; label: string; position: number; triggerDays: number | null; triggerAction: string | null; isEndState: boolean; }
interface Card {
  id: number; phase: string; eigenaarUserId: number | null; eigenaarNaam: string | null;
  nextActionAt: string | null; nextActionType: string | null; channel: string | null;
  notReachedCount: number; snoozeUntil: string | null; notes: string | null; batchId: number | null;
  contactNaam: string; contactFunctie: string | null; contactEmail: string | null;
  companyId: number; bedrijfNaam: string; categorie: string | null; city: string | null;
  daysOverdue: number;
}
interface Batch { id: number; name: string; categorie: string | null; cardCount: number; }

const ACTION_LABEL: Record<string, string> = { bellen: 'Bellen', opnieuw_bellen: 'Opnieuw bellen', opvolgen: 'Opvolgen' };

function initialen(naam: string) {
  return naam.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// Status-stip: rood = te laat, oranje = vandaag/morgen, groen = later gepland, grijs = geen/sluimer.
function statusVan(card: Card): { kleur: string; tekst: string; laat: boolean } {
  if (card.phase === 'deal') return { kleur: '#3aa76d', tekst: 'Deal gesloten', laat: false };
  if (card.phase === 'geen_interesse') {
    return { kleur: '#c9ccd8', tekst: card.snoozeUntil ? `Terug op ${fmt(card.snoozeUntil)}` : 'Afgesloten', laat: false };
  }
  if (!card.nextActionAt) return { kleur: '#c9ccd8', tekst: 'Geen actie gepland', laat: false };
  const actie = ACTION_LABEL[card.nextActionType || ''] || 'Actie';
  if (card.daysOverdue > 0) return { kleur: '#d6453d', tekst: `${actie} — ${card.daysOverdue} dg te laat`, laat: true };
  const dagen = daysUntil(card.nextActionAt);
  if (dagen <= 1) return { kleur: '#e8a13c', tekst: `${actie} — ${dagen === 0 ? 'vandaag' : 'morgen'}`, laat: false };
  return { kleur: '#3aa76d', tekst: `${actie} — ${fmt(card.nextActionAt)}`, laat: false };
}
function fmt(d: string) { return new Date(d + 'T00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }); }
function daysUntil(d: string) { return Math.round((new Date(d + 'T00:00').getTime() - new Date(new Date().toDateString()).getTime()) / 86400000); }

function KaartView({ card }: { card: Card }) {
  const st = statusVan(card);
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
      {card.channel && <div className="text-[10.5px] text-gray-400 mt-1.5">Via {card.channel === 'linkedin' ? 'LinkedIn' : 'e-mail'}</div>}
    </div>
  );
}

function DraggableKaart({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      className={`mb-2 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}>
      <KaartView card={card} />
    </div>
  );
}

function Kolom({ rule, cards, batchId, onBatchAdvance }: { rule: Rule; cards: Card[]; batchId: number | null; onBatchAdvance: (from: string) => void; }) {
  const { setNodeRef, isOver } = useDroppable({ id: rule.phase });
  const triggerRegel = rule.isEndState
    ? (rule.phase === 'deal' ? 'Bedrijf → Bestaande klanten' : 'Sluimert → terug in Selectie')
    : rule.triggerDays != null ? `Na ${rule.triggerDays} dagen → ${ACTION_LABEL[rule.triggerAction || ''] || 'reminder'}` : 'Voorbereiden';
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
            <button onClick={() => onBatchAdvance(rule.phase)} title="Hele kolom doorzetten"
              className="ml-auto text-[10px] text-purple-600 hover:text-purple-800">batch ▸</button>
          )}
        </div>
      </div>
      <div className="p-2.5 bg-gray-50/60 flex-1 min-h-[420px]">
        {cards.map(c => <DraggableKaart key={c.id} card={c} />)}
      </div>
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: batches } = useQuery<Batch[]>({ queryKey: ['/api/sales/flow/batches'] });
  const { data, isLoading } = useQuery<{ rules: Rule[]; cards: Card[] }>({
    queryKey: ['/api/sales/flow', batch, eigenaar, categorie],
    queryFn: () => apiRequest(`/api/sales/flow?batch=${batch}&eigenaar=${eigenaar}&categorie=${categorie}`) as Promise<any>,
  });

  const move = useMutation({
    mutationFn: (v: { id: number; phase: string; channel?: string; snoozeUntil?: string }) =>
      apiRequest('PATCH', `/api/sales/flow/cards/${v.id}/move`, { phase: v.phase, channel: v.channel ?? null, snoozeUntil: v.snoozeUntil ?? null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/sales/flow'] }); },
    onError: (e: any) => toast({ title: 'Verplaatsen mislukt', description: e.message, variant: 'destructive' }),
  });
  const batchAdvance = useMutation({
    mutationFn: (v: { batchId: number; fromPhase: string; toPhase: string }) => apiRequest('POST', '/api/sales/flow/batch-advance', v),
    onSuccess: (r: any) => { queryClient.invalidateQueries({ queryKey: ['/api/sales/flow'] }); toast({ title: `${r.moved} kaart(en) doorgezet` }); },
    onError: (e: any) => toast({ title: 'Batch-actie mislukt', description: e.message, variant: 'destructive' }),
  });

  const rules = data?.rules ?? [];
  const cards = data?.cards ?? [];
  const perFase = useMemo(() => {
    const m: Record<string, Card[]> = {};
    for (const r of rules) m[r.phase] = [];
    for (const c of cards) (m[c.phase] ??= []).push(c);
    return m;
  }, [rules, cards]);

  const acties = useMemo(() => {
    const open = cards.filter(c => c.nextActionAt && c.phase !== 'deal' && c.phase !== 'geen_interesse');
    return { vandaag: open.filter(c => c.daysOverdue === 0 && daysUntil(c.nextActionAt!) <= 0).length, laat: open.filter(c => c.daysOverdue > 0).length };
  }, [cards]);

  function onDragStart(e: DragStartEvent) { setActiveCard(cards.find(c => c.id === e.active.id) ?? null); }
  function onDragEnd(e: DragEndEvent) {
    setActiveCard(null);
    const cardId = Number(e.active.id);
    const naarFase = e.over?.id as string | undefined;
    const card = cards.find(c => c.id === cardId);
    if (!card || !naarFase || card.phase === naarFase) return;
    // 'bericht_gestuurd' vraagt om kanaalkeuze; 'geen_interesse' om sluimer-datum.
    if (naarFase === 'bericht_gestuurd') {
      const kanaal = window.prompt('Kanaal? Typ "email" of "linkedin"', 'email');
      if (kanaal !== 'email' && kanaal !== 'linkedin') { toast({ title: 'Verplaatsing geannuleerd', description: 'Kies email of linkedin' }); return; }
      move.mutate({ id: cardId, phase: naarFase, channel: kanaal }); return;
    }
    if (naarFase === 'geen_interesse') {
      const maanden = window.prompt('Over hoeveel maanden opnieuw benaderen? (leeg = niet)', '3');
      let snooze: string | undefined;
      if (maanden && /^\d+$/.test(maanden)) { const d = new Date(); d.setMonth(d.getMonth() + parseInt(maanden, 10)); snooze = d.toISOString().slice(0, 10); }
      move.mutate({ id: cardId, phase: naarFase, snoozeUntil: snooze }); return;
    }
    move.mutate({ id: cardId, phase: naarFase });
  }

  function onBatchAdvance(fromPhase: string) {
    if (batch === 'alle') return;
    const idx = rules.findIndex(r => r.phase === fromPhase);
    const next = rules[idx + 1];
    if (!next) return;
    if (window.confirm(`Alle kaarten in "${rules[idx].label}" doorzetten naar "${next.label}"?`))
      batchAdvance.mutate({ batchId: parseInt(batch, 10), fromPhase, toPhase: next.phase });
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Salesflow</h1>
          <p className="text-[13px] text-gray-500">Persoonlijke opvolging van direct mailings — gekoppeld aan Leads &amp; Prospects.</p>
        </div>
        <div className="flex gap-2 ml-2 flex-wrap">
          <Filter label="Batch" value={batch} onChange={setBatch} opts={[['alle', 'Alle batches'], ...(batches ?? []).map(b => [String(b.id), `${b.name} (${b.cardCount})`] as [string, string])]} />
          <Filter label="Eigenaar" value={eigenaar} onChange={setEigenaar} opts={[['alle', 'Iedereen'], ['max', 'Max'], ['tommy', 'Tommy']]} />
          <Filter label="Categorie" value={categorie} onChange={setCategorie} opts={[['alle', 'Alle'], ['Hotel', 'Hotel'], ['Logistiek', 'Logistiek'], ['Events', 'Events']]} />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[13px] text-gray-600"><b className="text-gray-900">{acties.vandaag} acties vandaag</b>{acties.laat > 0 && <> · <span className="text-red-600 font-semibold">{acties.laat} te laat</span></>}</span>
          <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[13px] font-medium px-3.5 py-2 rounded-lg">
            <Plus className="w-4 h-4" /> Persoon toevoegen
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-sm py-20 text-center">Laden…</div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex border border-gray-200 rounded-xl bg-white overflow-x-auto">
            {rules.map(r => (
              <Kolom key={r.phase} rule={r} cards={perFase[r.phase] ?? []} batchId={batch !== 'alle' ? parseInt(batch, 10) : null} onBatchAdvance={onBatchAdvance} />
            ))}
          </div>
          <DragOverlay>{activeCard ? <div className="w-[210px]"><KaartView card={activeCard} /></div> : null}</DragOverlay>
        </DndContext>
      )}

      <div className="flex items-center gap-4 mt-3.5 text-[11.5px] text-gray-400">
        <Legenda kleur="#3aa76d" tekst="Actie gepland" />
        <Legenda kleur="#e8a13c" tekst="Vandaag/morgen" />
        <Legenda kleur="#d6453d" tekst="Te laat" />
        <Legenda kleur="#c9ccd8" tekst="Wacht / sluimert" />
      </div>

      {addOpen && <PersoonToevoegen batches={batches ?? []} onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function Filter({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: [string, string][] }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[12.5px] text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
      <span className="text-gray-400">{label}:</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="bg-transparent font-medium text-gray-800 outline-none cursor-pointer">
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
function Legenda({ kleur, tekst }: { kleur: string; tekst: string }) {
  return <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: kleur }} />{tekst}</span>;
}

interface ZoekContact { id: number; name: string; function: string | null; bedrijfNaam: string; categorie: string | null; opBord: boolean; }
function PersoonToevoegen({ batches, onClose }: { batches: Batch[]; onClose: () => void }) {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [batchId, setBatchId] = useState<string>(batches[0] ? String(batches[0].id) : '');
  const { data: resultaten } = useQuery<ZoekContact[]>({
    queryKey: ['/api/sales/flow/contacts', q],
    queryFn: () => apiRequest(`/api/sales/flow/contacts?search=${encodeURIComponent(q)}`) as Promise<any>,
  });
  const add = useMutation({
    mutationFn: (contactId: number) => apiRequest('POST', '/api/sales/flow/cards', { contactId, batchId: batchId ? parseInt(batchId, 10) : null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/sales/flow'] }); queryClient.invalidateQueries({ queryKey: ['/api/sales/flow/contacts'] }); toast({ title: 'Toegevoegd aan Selectie' }); },
    onError: (e: any) => toast({ title: 'Toevoegen mislukt', description: e.message, variant: 'destructive' }),
  });
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-24" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Persoon toevoegen aan het bord</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="text-[12px] text-gray-500">Batch (optioneel)
            <select value={batchId} onChange={e => setBatchId(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Geen batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Zoek op naam of bedrijf…"
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm" />
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
            {(resultaten ?? []).map(c => (
              <div key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 truncate">{c.name}</div>
                  <div className="text-[11.5px] text-gray-500 truncate">{c.bedrijfNaam}{c.function ? ` · ${c.function}` : ''}</div>
                </div>
                {c.opBord
                  ? <span className="text-[11px] text-gray-400">Al op bord</span>
                  : <button onClick={() => add.mutate(c.id)} className="text-[12px] text-purple-600 hover:text-purple-800 font-medium">Toevoegen</button>}
              </div>
            ))}
            {resultaten && resultaten.length === 0 && <div className="text-[13px] text-gray-400 py-6 text-center">Geen contacten gevonden</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
