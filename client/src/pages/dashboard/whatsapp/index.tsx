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
  type Conversation,
  type Message,
  type Stats,
  type TeamMember,
} from '../../../api/whatsappClient';
import { WA_FONT, WA } from './theme';
import Sidebar, { type InboxTab } from './Sidebar';
import ChatView from './ChatView';
import ProfilePanel from './ProfilePanel';

export default function WhatsAppInbox() {
  const { user } = useAuth();
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

  // De hele Taken-state stond hier: tasks, openTotaal, de twee filters, bezig
  // en fout, plus het ophalen en de handlers. Alles is verhuisd naar
  // TakenPagina.tsx, want Taken is geen onderdeel meer van de inbox.

  /**
   * Deeplink vanuit de Contacten- of de Takenpagina. Nieuw is
   * extra_open_wa_tab: de categorie waarin het gesprek staat. Zonder die
   * sleutel opent de inbox op zijn eigen (laatst gekozen) tabblad en staat het
   * gesprek in een categorie die niet in beeld is — dan klik je op een taak en
   * lijkt er niets te gebeuren.
   *
   * De tab moet vóór het nummer worden gezet: onTab wist bij een handmatige
   * klik het geselecteerde gesprek, dus andersom zou de deeplink zichzelf
   * ongedaan maken. Hier gebeurt dat niet omdat we setTab rechtstreeks
   * aanroepen, maar de volgorde blijft de veilige.
   */
  useEffect(() => {
    try {
      const phone = sessionStorage.getItem('extra_open_wa_phone');
      if (phone) {
        const gewensteTab = sessionStorage.getItem('extra_open_wa_tab');
        if (gewensteTab === 'candidate' || gewensteTab === 'unmatched' || gewensteTab === 'prospect') {
          setTab(gewensteTab);
        }
        setSelectedPhone(phone);
        sessionStorage.removeItem('extra_open_wa_phone');
        sessionStorage.removeItem('extra_open_wa_name');
        sessionStorage.removeItem('extra_open_wa_tab');
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
        tab={tab}
        onTab={t => { setTab(t); setSelectedPhone(null); }}
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
