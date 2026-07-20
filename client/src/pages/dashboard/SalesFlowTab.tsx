/**
 * SALESFLOW — persoonsgericht kanban-bord (direct-mailing opvolging).
 * Pipedrive-stijl: wit bord, dunne scheidingslijnen, kleur alleen als status-stip.
 * Verslepen roept /api/sales/flow/cards/:id/move aan → engine logt + plant reminder.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { Plus, X, Search, Settings2, Check } from 'lucide-react';

interface Rule { phase: string; label: string; position: number; triggerDays: number | null; triggerAction: string | null; isEndState: boolean; useBusinessDays?: boolean; }
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

function initialen(naam: string) { return naam.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(); }

function statusVan(card: Card): { kleur: string; tekst: string; laat: boolean } {
  if (card.phase === 'deal') return { kleur: '#3aa76d', tekst: 'Deal gesloten', laat: false };
  if (card.phase === 'geen_interesse') return { kleur: '#c9ccd8', tekst: card.snoozeUntil ? `Terug op ${fmt(card.snoozeUntil)}` : 'Afgesloten', laat: false };
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
    <div ref={setNodeRef} {...listeners} {...attributes} className={`mb-2 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}>
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
            <button onClick={() => onBatchAdvance(rule.phase)} title="Hele kolom doorzetten" className="ml-auto text-[10px] text-purple-600 hover:text-purple-800">batch ▸</button>
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: batches } = useQuery<Batch[]>({ queryKey: ['/api/sales/flow/batches'], queryFn: () => apiRequest('/api/sales/flow/batches') as Promise<any> });
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
      <div className="flex items-start gap-3 flex-wrap mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Salesflow</h1>
          <p className="text-[13px] text-gray-500">Persoonlijke opvolging van direct mailings — gekoppeld aan Leads &amp; Prospects.</p>
        </div>
        <div className="flex gap-2 ml-2 flex-wrap items-center">
          <SfSelect label="Batch" value={batch} onChange={setBatch} width="w-[190px]"
            opts={[['alle', 'Alle batches'], ...(batches ?? []).map(b => [String(b.id), `${b.name} (${b.cardCount})`] as [string, string])]} />
          <SfSelect label="Eigenaar" value={eigenaar} onChange={setEigenaar} width="w-[140px]" opts={[['alle', 'Iedereen'], ['max', 'Max'], ['tommy', 'Tommy']]} />
          <SfSelect label="Categorie" value={categorie} onChange={setCategorie} width="w-[130px]" opts={[['alle', 'Alle'], ['Hotel', 'Hotel'], ['Logistiek', 'Logistiek'], ['Events', 'Events']]} />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-[13px] text-gray-600"><b className="text-gray-900">{acties.vandaag} acties vandaag</b>{acties.laat > 0 && <> · <span className="text-red-600 font-semibold">{acties.laat} te laat</span></>}</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="gap-1.5 text-gray-600">
            <Settings2 className="w-4 h-4" /> Fases instellen
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4" /> Persoon toevoegen
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-sm py-20 text-center">Laden…</div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex border border-gray-200 rounded-xl bg-white overflow-x-auto">
            {rules.map(r => <Kolom key={r.phase} rule={r} cards={perFase[r.phase] ?? []} batchId={batch !== 'alle' ? parseInt(batch, 10) : null} onBatchAdvance={onBatchAdvance} />)}
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

      <PersoonToevoegen open={addOpen} batches={batches ?? []} onClose={() => setAddOpen(false)} />
      <FasesInstellen open={settingsOpen} rules={rules} onClose={() => setSettingsOpen(false)} />
    </div>
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

interface ZoekContact { id: number; name: string; function: string | null; bedrijfNaam: string; categorie: string | null; opBord: boolean; }
function PersoonToevoegen({ open, batches, onClose }: { open: boolean; batches: Batch[]; onClose: () => void }) {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [batchId, setBatchId] = useState<string>('geen');
  const [nieuweBatch, setNieuweBatch] = useState('');
  const { data: resultaten, isLoading } = useQuery<ZoekContact[]>({
    queryKey: ['/api/sales/flow/contacts', q],
    queryFn: () => apiRequest(`/api/sales/flow/contacts?search=${encodeURIComponent(q)}`) as Promise<any>,
    enabled: open,
  });
  const maakBatch = useMutation({
    mutationFn: (name: string) => apiRequest('POST', '/api/sales/flow/batches', { name }),
    onSuccess: (b: any) => { queryClient.invalidateQueries({ queryKey: ['/api/sales/flow/batches'] }); setBatchId(String(b.id)); setNieuweBatch(''); toast({ title: `Batch "${b.name}" aangemaakt` }); },
    onError: (e: any) => toast({ title: 'Batch aanmaken mislukt', description: e.message, variant: 'destructive' }),
  });
  const add = useMutation({
    mutationFn: (contactId: number) => apiRequest('POST', '/api/sales/flow/cards', { contactId, batchId: batchId !== 'geen' ? parseInt(batchId, 10) : null }),
    onSuccess: (_r, contactId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/flow'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales/flow/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales/flow/batches'] });
      const naam = resultaten?.find(c => c.id === contactId)?.name;
      toast({ title: 'Toegevoegd aan Selectie', description: naam });
    },
    onError: (e: any) => toast({ title: 'Toevoegen mislukt', description: e?.data?.message || e.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Persoon toevoegen aan het bord</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[12px] text-gray-500 mb-1 block">Batch (optioneel)</label>
            <div className="flex gap-2">
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger className="h-9 flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geen">Geen batch</SelectItem>
                  {batches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-2">
              <Input value={nieuweBatch} onChange={e => setNieuweBatch(e.target.value)} placeholder="…of nieuwe batch aanmaken" className="h-9 text-sm" />
              <Button variant="outline" size="sm" disabled={!nieuweBatch.trim() || maakBatch.isPending} onClick={() => maakBatch.mutate(nieuweBatch.trim())}>Aanmaken</Button>
            </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Zoek op naam of bedrijf…" className="pl-9 h-9 text-sm" />
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 -mx-1 px-1">
            {isLoading && <div className="text-[13px] text-gray-400 py-6 text-center">Zoeken…</div>}
            {(resultaten ?? []).map(c => (
              <div key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 truncate">{c.name}</div>
                  <div className="text-[11.5px] text-gray-500 truncate">{c.bedrijfNaam}{c.function ? ` · ${c.function}` : ''}</div>
                </div>
                {c.opBord
                  ? <span className="text-[11px] text-green-600 flex items-center gap-1 shrink-0"><Check className="w-3.5 h-3.5" /> Op bord</span>
                  : <Button variant="ghost" size="sm" className="h-7 text-purple-600 hover:text-purple-800 shrink-0"
                      disabled={add.isPending} onClick={() => add.mutate(c.id)}>Toevoegen</Button>}
              </div>
            ))}
            {resultaten && resultaten.length === 0 && !isLoading && <div className="text-[13px] text-gray-400 py-6 text-center">Geen contacten gevonden</div>}
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Klaar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FasesInstellen({ open, rules, onClose }: { open: boolean; rules: Rule[]; onClose: () => void }) {
  const { toast } = useToast();
  const [edits, setEdits] = useState<Record<string, { label: string; triggerDays: string }>>({});
  const val = (r: Rule) => edits[r.phase] ?? { label: r.label, triggerDays: r.triggerDays == null ? '' : String(r.triggerDays) };
  const set = (phase: string, patch: Partial<{ label: string; triggerDays: string }>) =>
    setEdits(e => ({ ...e, [phase]: { ...(e[phase] ?? { label: rules.find(r => r.phase === phase)!.label, triggerDays: rules.find(r => r.phase === phase)!.triggerDays?.toString() ?? '' }), ...patch } }));

  const save = useMutation({
    mutationFn: async () => {
      for (const r of rules) {
        const v = edits[r.phase];
        if (!v) continue;
        const body: any = {};
        if (v.label !== r.label) body.label = v.label;
        const td = v.triggerDays === '' ? null : parseInt(v.triggerDays, 10);
        if (td !== r.triggerDays && !r.isEndState) body.triggerDays = td;
        if (Object.keys(body).length) await apiRequest('PATCH', `/api/sales/flow/rules/${r.phase}`, body);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/sales/flow'] }); setEdits({}); toast({ title: 'Fases bijgewerkt' }); onClose(); },
    onError: (e: any) => toast({ title: 'Opslaan mislukt', description: e.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Fases instellen</DialogTitle></DialogHeader>
        <p className="text-[12.5px] text-gray-500 -mt-1">Pas de kolomnamen en het aantal werkdagen voor de automatische reminder aan.</p>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-[1fr,120px] gap-3 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            <span>Kolomnaam</span><span>Reminder na (werkdagen)</span>
          </div>
          {rules.map(r => {
            const v = val(r);
            return (
              <div key={r.phase} className="grid grid-cols-[1fr,120px] gap-3 items-center">
                <Input value={v.label} onChange={e => set(r.phase, { label: e.target.value })} className="h-9 text-sm" />
                {r.isEndState
                  ? <span className="text-[12px] text-gray-400 pl-2">— eindfase —</span>
                  : <Input type="number" min={0} max={90} value={v.triggerDays} onChange={e => set(r.phase, { triggerDays: e.target.value })}
                      placeholder="geen" className="h-9 text-sm" />}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || Object.keys(edits).length === 0} className="bg-purple-600 hover:bg-purple-700">Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
