/**
 * WhatsApp-inbox (Fase 2) — herbouw naar mockups/extra-whatsapp-mockup.html.
 * Compositie + state: Sidebar (400px) · ChatView (flex) · ProfilePanel (300px,
 * inklapbaar via de knop in de chatheader — ChatView heeft flex:1 en vult de
 * vrijgekomen ruimte vanzelf).
 *
 * Vervangt WhatsAppBeheer in de dashboard-routing; WhatsAppBeheer.tsx blijft
 * bestaan tot fase 4.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  haalGesprekken,
  haalBerichten,
  haalStats,
  haalTeamMembers,
  markeerGelezen,
  stuurBericht,
  stuurMedia,
  snoozeGesprek,
  vraagAiSuggestie,
  haalTaken,
  zetTaakStatus,
  zetTaakToegewezene,
  type Conversation,
  type Message,
  type Stats,
  type TeamMember,
  type Task,
  type TaskStatus,
} from '../../../api/whatsappClient';
import { WA_FONT, WA } from './theme';
import Sidebar, { type InboxTab, type SidebarTab } from './Sidebar';
import type { TakenAssigneeFilter } from './TakenPanel';
import ChatView from './ChatView';
import ProfilePanel from './ProfilePanel';

export default function WhatsAppInbox() {
  const { user } = useAuth();
  /**
   * Twee tab-states, met opzet.
   *
   * `sidebarTab` is wat je ziet; `tab` is de gesprekscategorie die de API
   * voedt. Ze lopen alleen uiteen zolang je op Taken staat: de gesprekken en
   * de stats blijven dan gewoon doorpollen voor de categorie waar je vandaan
   * kwam, zodat het gesprek rechts open blijft en de badges op de andere drie
   * tabs blijven kloppen terwijl je taken afvinkt. Eén gedeelde state zou
   * betekenen dat `haalGesprekken('taken')` de deur uit gaat — een categorie
   * die de server niet kent.
   */
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('candidate');
  const [tab, setTab] = useState<InboxTab>('candidate');
  const [search, setSearch] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [snoozedView, setSnoozedView] = useState(false);
  // Fase 3: standaard AAN — de planner ziet alleen wat nog aandacht vraagt.
  const [hideAiHandled, setHideAiHandled] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [composerText, setComposerText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  /**
   * Rechterpaneel in-/uitklappen (knop in de chatheader). Bewust gewone state
   * en géén localStorage: het is een keuze voor even ("ik wil dit gesprek
   * groter lezen"), geen instelling. Per bezoek is genoeg.
   */
  const [profielOpen, setProfielOpen] = useState(true);

  // Fase 3B: taken. Bewust aparte state van `conversations` — een taak
  // overleeft het sluiten van een gesprek en verdwijnt dus niet mee.
  const [tasks, setTasks] = useState<Task[]>([]);
  const [takenOpenTotaal, setTakenOpenTotaal] = useState(0);
  const [taakStatusFilter, setTaakStatusFilter] = useState<TaskStatus | 'alle'>('open');
  const [taakAssigneeFilter, setTaakAssigneeFilter] = useState<TakenAssigneeFilter>('alle');
  const [taakBezig, setTaakBezig] = useState<number[]>([]);
  const [taakFout, setTaakFout] = useState<string | null>(null);

  // Deeplink vanuit de Contacten-pagina (zelfde mechanisme als WhatsAppBeheer).
  useEffect(() => {
    try {
      const phone = sessionStorage.getItem('extra_open_wa_phone');
      if (phone) {
        setSelectedPhone(phone);
        sessionStorage.removeItem('extra_open_wa_phone');
        sessionStorage.removeItem('extra_open_wa_name');
      }
    } catch { /* ignore */ }
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([
        haalGesprekken(tab, { snoozed: snoozedView ? 'only' : 'exclude' }),
        haalStats(),
      ]);
      setConversations(c);
      setStats(s);
    } catch { /* ignore */ }
  }, [tab, snoozedView]);

  // Poll gesprekken + stats (zelfde ritme als de oude inbox).
  useEffect(() => {
    let stop = false;
    const tick = async () => { if (!stop) await refreshConversations(); };
    tick();
    const id = setInterval(tick, 5000);
    return () => { stop = true; clearInterval(id); };
  }, [refreshConversations]);

  useEffect(() => {
    haalTeamMembers().then(setTeamMembers).catch(() => {});
  }, []);

  // Fase 3B: taken ophalen. Loopt ALTIJD, ook met het paneel dichtgeklapt —
  // anders klopt de teller op de kop niet en zie je nooit dat er iets ligt.
  // Rustiger ritme dan de gesprekken: een taak is geen chatbericht.
  const refreshTaken = useCallback(async () => {
    try {
      const assignedToId =
        taakAssigneeFilter === 'niemand' ? 'niemand' as const
        // -1 en niet undefined: als we de ingelogde gebruiker (nog) niet
        // kennen, hoort "Van mij" een lege lijst te geven — niet stilletjes
        // alle taken van iedereen.
        : taakAssigneeFilter === 'mij' ? (user?.id ?? -1)
        : undefined;
      const r = await haalTaken({ status: taakStatusFilter, assignedToId });
      setTasks(r.tasks);
      setTakenOpenTotaal(r.openTotaal);
    } catch { /* stil: de takenlijst mag de inbox nooit blokkeren */ }
  }, [taakStatusFilter, taakAssigneeFilter, user?.id]);

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
    setTaakBezig(v => [...v, task.id]);
    setTaakFout(null);
    setTasks(list => list.map(t => (t.id === task.id ? { ...t, status: nieuw } : t)));
    setTakenOpenTotaal(n => Math.max(0, n + (nieuw === 'klaar' ? -1 : 1)));
    try {
      await zetTaakStatus(task.id, nieuw);
      await refreshTaken();
    } catch (e: any) {
      setTaakFout(e.message || 'Taak bijwerken mislukt');
      await refreshTaken();
    } finally {
      setTaakBezig(v => v.filter(id => id !== task.id));
    }
  }

  async function handleTaakToewijzen(task: Task, assignedToId: number | null) {
    setTaakBezig(v => [...v, task.id]);
    setTaakFout(null);
    try {
      const r = await zetTaakToegewezene(task.id, assignedToId);
      setTasks(list => list.map(t => (
        t.id === task.id ? { ...t, assignedToId: r.assignedToId, assignedToName: r.assignedToName } : t
      )));
      await refreshTaken();
    } catch (e: any) {
      setTaakFout(e.message || 'Toewijzen mislukt');
      await refreshTaken();
    } finally {
      setTaakBezig(v => v.filter(id => id !== task.id));
    }
  }

  /**
   * Wisselen van sub-tabblad. Naar Taken springen laat de gesprekscategorie
   * én het geselecteerde gesprek staan: je vinkt een taak af terwijl het
   * gesprek waar hij uit komt rechts open blijft. Tussen de drie
   * gesprekstabs onderling blijft het oude gedrag — daar hoort de selectie
   * juist wél te vervallen, want dat gesprek staat in de andere lijst niet.
   */
  function handleSidebarTab(t: SidebarTab) {
    setSidebarTab(t);
    if (t === 'taken') return;
    setTab(t);
    setSelectedPhone(null);
  }

  /**
   * Doorklik vanuit een taak naar het gesprek. Een taak kan bij een gesprek
   * horen dat in een ANDERE tab staat; dan schakelen we eerst van tab, anders
   * klik je op een taak en opent er een leeg scherm. Je verlaat daarbij het
   * Taken-tabblad, zodat je meteen ziet in welke lijst dit gesprek thuishoort.
   * Kent de taak geen categorie, dan blijf je staan waar je bent en opent het
   * gesprek alleen rechts — beter dan naar een lijst springen die er niet is.
   */
  function handleTaakNaarGesprek(task: Task) {
    if (task.matchCategory) {
      if (task.matchCategory !== tab) setTab(task.matchCategory);
      setSidebarTab(task.matchCategory);
    }
    setSelectedPhone(task.phoneNumber);
  }

  // Poll berichten van het geselecteerde gesprek.
  useEffect(() => {
    if (!selectedPhone) { setMessages([]); return; }
    let stop = false;
    const tick = async () => {
      try {
        const m = await haalBerichten(selectedPhone);
        if (!stop) setMessages(m);
      } catch { /* ignore */ }
    };
    tick();
    markeerGelezen(selectedPhone).catch(() => {});
    const id = setInterval(tick, 4000);
    return () => { stop = true; clearInterval(id); };
  }, [selectedPhone]);

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.displayName?.toLowerCase().includes(q) || c.phoneNumber.includes(search.replace(/\D/g, '') || search),
      );
    }
    if (assignedToMe && user?.id != null) {
      list = list.filter(c => c.assignedToId === user.id);
    }
    return list;
  }, [conversations, search, assignedToMe, user?.id]);

  // Fase 3: gesprekken waar de AI het laatste woord had verbergen. Het
  // geselecteerde gesprek blijft altijd staan — anders klapt de chat dicht
  // zodra de AI antwoordt terwijl je er nog naar kijkt.
  const zichtbareConversations = useMemo(() => {
    if (!hideAiHandled) return filteredConversations;
    return filteredConversations.filter(
      c => c.displayStatus !== 'afgehandeld_ai' || c.phoneNumber === selectedPhone,
    );
  }, [filteredConversations, hideAiHandled, selectedPhone]);

  const hiddenAiCount = filteredConversations.length - zichtbareConversations.length;

  const selectedConv = conversations.find(c => c.phoneNumber === selectedPhone) ?? null;

  async function handleSend(text: string, file: File | null) {
    if (!selectedPhone) return;
    if (!text.trim() && !file) return;
    setSending(true);
    setSendError(null);
    try {
      if (file) {
        await stuurMedia(selectedPhone, file, text.trim() || undefined);
      } else {
        await stuurBericht(selectedPhone, text);
      }
      setComposerText('');
      setMessages(await haalBerichten(selectedPhone));
      refreshConversations();
    } catch (e: any) {
      setSendError(e.message || 'Versturen mislukt');
    } finally {
      setSending(false);
    }
  }

  async function handleAiSuggest() {
    if (!selectedPhone || messages.length === 0 || aiLoading) return;
    setAiLoading(true);
    setSendError(null);
    try {
      const r = await vraagAiSuggestie(
        messages,
        selectedConv?.displayName,
        selectedConv?.contactCompany,
        'individual',
        selectedPhone,
      );
      setComposerText(r.suggestion);
    } catch (e: any) {
      setSendError(e.message || 'AI-suggestie mislukt');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSnooze(untilIso: string | null) {
    if (!selectedConv) return;
    try {
      await snoozeGesprek(selectedConv.id, untilIso);
      // In de actieve weergave verdwijnt een gesnoozed gesprek uit de lijst.
      if (untilIso && !snoozedView) setSelectedPhone(null);
      await refreshConversations();
    } catch (e: any) {
      setSendError(e.message || 'Snoozen mislukt');
    }
  }

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 57px)', minHeight: 480,
      fontFamily: WA_FONT, color: WA.text, overflow: 'hidden', background: '#fff',
    }}>
      <Sidebar
        tab={sidebarTab}
        onTab={handleSidebarTab}
        stats={stats}
        search={search}
        onSearch={setSearch}
        assignedToMe={assignedToMe}
        onToggleAssignedToMe={() => setAssignedToMe(v => !v)}
        snoozedView={snoozedView}
        onToggleSnoozedView={() => { setSnoozedView(v => !v); setSelectedPhone(null); }}
        hideAiHandled={hideAiHandled}
        onToggleHideAiHandled={() => setHideAiHandled(v => !v)}
        hiddenAiCount={hiddenAiCount}
        conversations={zichtbareConversations}
        selectedPhone={selectedPhone}
        onSelect={setSelectedPhone}
        taken={{
          tasks,
          openTotaal: takenOpenTotaal,
          statusFilter: taakStatusFilter,
          onStatusFilter: setTaakStatusFilter,
          assigneeFilter: taakAssigneeFilter,
          onAssigneeFilter: setTaakAssigneeFilter,
          teamMembers,
          onToggleTask: handleTaakToggle,
          onAssign: handleTaakToewijzen,
          onSelectConversation: handleTaakNaarGesprek,
          bezig: taakBezig,
          fout: taakFout,
        }}
      />
      <ChatView
        conv={selectedConv}
        messages={messages}
        teamMembers={teamMembers}
        composerText={composerText}
        onComposerText={setComposerText}
        onSend={handleSend}
        sending={sending}
        sendError={sendError}
        aiLoading={aiLoading}
        onAiSuggest={handleAiSuggest}
        onSnooze={handleSnooze}
        profielOpen={profielOpen}
        onToggleProfiel={() => setProfielOpen(v => !v)}
      />
      {selectedConv && profielOpen && (
        <ProfilePanel
          conv={selectedConv}
          teamMembers={teamMembers}
          onQuickReply={setComposerText}
          onConversationChanged={refreshConversations}
        />
      )}
    </div>
  );
}
