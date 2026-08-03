/**
 * De Takenpagina — eigen item in de hoofdnavigatie, groep COMMUNICATIE.
 *
 * Taken zaten hiervoor als vierde tabblad in de WhatsApp-sidebar, naast
 * Medewerkers/Kandidaten/Klanten. Dat klopte niet: die drie zijn categorieën
 * gesprekken, een taak is dat niet, en je moest de inbox openen om te zien of
 * er nog iets lag. Nu is het een eigen pagina met een eigen teller in de
 * navigatie.
 *
 * Deze pagina bezit de data (ophalen, pollen, afvinken, toewijzen); TakenLijst
 * tekent alleen. Dezelfde verdeling als in de inbox, en het is meteen waarom
 * TakenLijst zonder server te fotograferen is in de layout-harness.
 *
 * ⚠️ Paginaschil (marges, kleuren, koptekst) komt uit huisstijl.ts. Bewust NIET
 * gemodelleerd naar WhatsAppContacten.tsx: die pagina heeft nog eigen FONT/NAVY
 * constanten en losse px-waarden, en is dus geen voorbeeld meer.
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { HUISSTIJL } from '@/lib/huisstijl';
import {
  haalTaken,
  haalTeamMembers,
  zetTaakStatus,
  zetTaakToegewezene,
  type Task,
  type TaskStatus,
  type TeamMember,
} from '../../api/whatsappClient';
import TakenLijst, { type TakenAssigneeFilter } from './whatsapp/TakenLijst';

export default function TakenPagina() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'alle'>('open');
  const [assigneeFilter, setAssigneeFilter] = useState<TakenAssigneeFilter>('alle');
  const [bezig, setBezig] = useState<number[]>([]);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    haalTeamMembers().then(setTeamMembers).catch(() => {});
  }, []);

  const refreshTaken = useCallback(async () => {
    try {
      const assignedToId =
        assigneeFilter === 'niemand' ? 'niemand' as const
        // -1 en niet undefined: als we de ingelogde gebruiker (nog) niet
        // kennen, hoort "Van mij" een lege lijst te geven — niet stilletjes
        // alle taken van iedereen.
        : assigneeFilter === 'mij' ? (user?.id ?? -1)
        : undefined;
      const r = await haalTaken({ status: statusFilter, assignedToId });
      setTasks(r.tasks);
    } catch { /* stil: een mislukte poll mag de pagina niet leegtrekken */ }
  }, [statusFilter, assigneeFilter, user?.id]);

  // Rustiger ritme dan de gesprekken (5s): een taak is geen chatbericht.
  useEffect(() => {
    let stop = false;
    const tick = async () => { if (!stop) await refreshTaken(); };
    tick();
    const id = setInterval(tick, 15000);
    return () => { stop = true; clearInterval(id); };
  }, [refreshTaken]);

  /**
   * Afvinken of weer openzetten. Raakt het gesprek NIET aan: dat is precies
   * waarom taken een eigen tabel hebben. Optimistisch bijwerken zodat het
   * vinkje meteen reageert; de poll corrigeert als er iets misging.
   */
  async function handleTaakToggle(task: Task) {
    const nieuw: TaskStatus = task.status === 'klaar' ? 'open' : 'klaar';
    setBezig(v => [...v, task.id]);
    setFout(null);
    setTasks(list => list.map(t => (t.id === task.id ? { ...t, status: nieuw } : t)));
    try {
      await zetTaakStatus(task.id, nieuw);
      await refreshTaken();
    } catch (e: any) {
      setFout(e.message || 'Taak bijwerken mislukt');
      await refreshTaken();
    } finally {
      setBezig(v => v.filter(id => id !== task.id));
    }
  }

  async function handleTaakToewijzen(task: Task, assignedToId: number | null) {
    setBezig(v => [...v, task.id]);
    setFout(null);
    try {
      const r = await zetTaakToegewezene(task.id, assignedToId);
      setTasks(list => list.map(t => (
        t.id === task.id ? { ...t, assignedToId: r.assignedToId, assignedToName: r.assignedToName } : t
      )));
      await refreshTaken();
    } catch (e: any) {
      setFout(e.message || 'Toewijzen mislukt');
      await refreshTaken();
    } finally {
      setBezig(v => v.filter(id => id !== task.id));
    }
  }

  /**
   * Doorklik naar het gesprek. Binnen de inbox was dit één setState; vanaf een
   * eigen pagina moet het over een moduletgrens heen, dus via hetzelfde
   * mechanisme dat de Contacten-pagina al gebruikt: het nummer in
   * sessionStorage, daarna een 'extra:switch-tab'-event.
   *
   * Nieuw is extra_open_wa_tab. Zonder die sleutel opent de inbox op zijn eigen
   * laatst gekozen categorie en staat het gesprek in een tab die je niet ziet —
   * je klikt op een taak en er gebeurt zichtbaar niets.
   */
  function handleTaakNaarGesprek(task: Task) {
    try {
      sessionStorage.setItem('extra_open_wa_phone', task.phoneNumber);
      sessionStorage.setItem('extra_open_wa_name', task.contactName || task.phoneNumber);
      if (task.matchCategory) sessionStorage.setItem('extra_open_wa_tab', task.matchCategory);
      else sessionStorage.removeItem('extra_open_wa_tab');
    } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('extra:switch-tab', { detail: { tab: 'whatsapp' } }));
  }

  return (
    <div style={{ padding: HUISSTIJL.MAAT.kaartPadding + 4, maxWidth: 900 }}>
      <h1 style={{
        fontSize: HUISSTIJL.TYPOGRAFIE.h1.fontSize,
        fontWeight: HUISSTIJL.TYPOGRAFIE.h1.fontWeight,
        color: HUISSTIJL.KLEUR.inkt,
        fontFamily: 'inherit',
        margin: 0,
      }}>
        Taken
      </h1>
      <p style={{
        fontSize: HUISSTIJL.TYPOGRAFIE.secundair.fontSize,
        color: HUISSTIJL.KLEUR.secundair,
        margin: `4px 0 ${HUISSTIJL.MAAT.kaartPadding}px`,
      }}>
        Uit WhatsApp-gesprekken herkende acties. Afvinken sluit het gesprek niet.
      </p>

      <TakenLijst
        tasks={tasks}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilter={setAssigneeFilter}
        teamMembers={teamMembers}
        onToggleTask={handleTaakToggle}
        onAssign={handleTaakToewijzen}
        onSelectConversation={handleTaakNaarGesprek}
        bezig={bezig}
        fout={fout}
      />
    </div>
  );
}
