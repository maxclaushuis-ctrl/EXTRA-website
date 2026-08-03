/**
 * NIET IN DE BUILD — losse harness om de WhatsApp-inbox te fotograferen.
 *
 * Waarom apart: pages/dashboard/whatsapp/index.tsx hangt aan useAuth() en aan
 * de echte API. Deze harness zet exact dezelfde compositie neer (Sidebar ·
 * ChatView · ProfilePanel) met verzonnen data en een gesmoorde fetch, zodat de
 * layout te bekijken is zonder server, database of inlog.
 *
 * Draaien:  npx vite --config vite.harness.config.ts
 * Openen:   /layout-harness.html            (profielpaneel open)
 *           /layout-harness.html?profiel=dicht
 */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './pages/dashboard/whatsapp/Sidebar';
import ChatView from './pages/dashboard/whatsapp/ChatView';
import ProfilePanel from './pages/dashboard/whatsapp/ProfilePanel';
import { WA_FONT } from './pages/dashboard/whatsapp/theme';
import type { Conversation, Message, Stats, Task, TeamMember } from './api/whatsappClient';

// ── Gesmoorde fetch: ProfilePanel haalt contact + notities op. ───────────────
const nep: Record<string, unknown> = {
  '/api/whatsapp/contacten': {
    total: 1,
    items: [{
      contactType: 'medewerker', contactId: 1,
      firstName: 'Eduardo', lastName: 'Silva',
      phone: '31612345678', email: 'eduardo@example.com', language: 'en',
      functie: 'housekeeping', sourceStatus: 'aangenomen',
      whatsappOptInStatus: 'actief', whatsappOptInChangedAt: null, whatsappOptInReason: null,
    }],
  },
  '/notes': [],
};
window.fetch = (async (input: RequestInfo | URL) => {
  const url = String(typeof input === 'string' ? input : (input as Request).url ?? input);
  const body = Object.entries(nep).find(([k]) => url.includes(k))?.[1] ?? {};
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}) as typeof fetch;

const nu = Date.now();
const min = (m: number) => new Date(nu - m * 60_000).toISOString();

const TEAM: TeamMember[] = [
  { id: 1, name: 'Eveline de Wit' },
  { id: 2, name: 'Max Verhoeven' },
];

const STATS: Stats = {
  candidate: { total: 6, unread: 3 },
  prospect: { total: 4, unread: 0 },
  unmatched: { total: 2, unread: 1 },
  totalUnread: 4,
};

const basis = {
  candidateId: 1, prospectContactId: null, contactCompany: null, contactNotes: null,
  matchCategory: 'candidate' as const, inboxStatus: 'open' as const, snoozedUntil: null,
};

const GESPREKKEN: Conversation[] = [
  {
    ...basis, id: 1, phoneNumber: '31612345678', displayName: 'Eduardo Silva',
    assignedToId: 1, assignedToName: 'Eveline de Wit', labels: ['housekeeping'],
    lastMessageAt: min(4), lastMessagePreview: 'Max pls add the hours on jixbee for me and Florin',
    unreadCount: 2, lastInboundAt: min(4),
    aiCategory: 'verzoek', aiCategorySource: 'ai',
    escalationReason: null, escalatedAt: null, displayStatus: 'open',
  },
  {
    ...basis, id: 2, phoneNumber: '31687654321', displayName: 'Marta Kowalska',
    assignedToId: null, assignedToName: null, labels: ['spoed'],
    lastMessageAt: min(19), lastMessagePreview: 'Przepraszam, nie mogę jutro przyjść do pracy',
    unreadCount: 1, lastInboundAt: min(19),
    aiCategory: 'afmelding', aiCategorySource: 'ai',
    escalationReason: null, escalatedAt: null, displayStatus: 'open',
  },
  {
    ...basis, id: 3, phoneNumber: '31611223344', displayName: 'Youssef El Amrani',
    assignedToId: null, assignedToName: null, labels: [],
    lastMessageAt: min(52), lastMessagePreview: 'Dit is de derde keer dat mijn loon te laat is.',
    unreadCount: 1, lastInboundAt: min(52),
    aiCategory: 'klacht', aiCategorySource: 'ai',
    escalationReason: 'boos', escalatedAt: min(51), displayStatus: 'wacht_op_planner',
  },
  {
    ...basis, id: 4, phoneNumber: '31655667788', displayName: 'Sanne Bakker',
    assignedToId: 2, assignedToName: 'Max Verhoeven', labels: ['nieuw'],
    lastMessageAt: min(140), lastMessagePreview: 'Ik zag jullie vacature voor bediening, kan ik solliciteren?',
    unreadCount: 0, lastInboundAt: min(140),
    aiCategory: 'sollicitatie', aiCategorySource: 'handmatig',
    escalationReason: null, escalatedAt: null, displayStatus: 'afgehandeld_ai',
  },
  {
    ...basis, id: 5, phoneNumber: '31699887766', displayName: 'Peter van Dijk',
    assignedToId: null, assignedToName: null, labels: [],
    lastMessageAt: min(320), lastMessagePreview: 'Hoe werkt het inplannen in de app precies?',
    unreadCount: 0, lastInboundAt: min(320),
    aiCategory: 'algemene_vraag', aiCategorySource: 'ai',
    escalationReason: null, escalatedAt: null, displayStatus: 'afgehandeld_ai',
  },
];

const BERICHTEN: Message[] = [
  {
    id: 1, direction: 'inbound', waMessageId: 'wa1', fromNumber: '31612345678', toNumber: '31851305915',
    messageType: 'text',
    body: 'Max pls add the hours on jixbee for me and Florin cuz i have some urgent payments to do. Eveline didnt answer thats why i ask you directly. Thx',
    mediaUrl: null, mediaMimeType: null, status: 'delivered', errorCode: null, errorMessage: null,
    matchCategory: 'candidate', createdAt: min(9),
  },
  {
    id: 2, direction: 'outbound', waMessageId: 'wa2', fromNumber: '31851305915', toNumber: '31612345678',
    messageType: 'text',
    body: 'Hi Eduardo! Thanks for letting us know — I have passed this on to the planning team so your hours get registered today.',
    mediaUrl: null, mediaMimeType: null, status: 'read', errorCode: null, errorMessage: null,
    matchCategory: 'candidate', sentByUserId: null, createdAt: min(8),
  },
  {
    id: 3, direction: 'inbound', waMessageId: 'wa3', fromNumber: '31612345678', toNumber: '31851305915',
    messageType: 'text', body: 'Thank you! And can you check the break time as well?',
    mediaUrl: null, mediaMimeType: null, status: 'delivered', errorCode: null, errorMessage: null,
    matchCategory: 'candidate', createdAt: min(4),
  },
];

const TAKEN: Task[] = [
  {
    id: 1, conversationId: 1, phoneNumber: '31612345678',
    summary: 'Uren van Eduardo en Florin invoeren in Jixbee', category: 'uren_jixbee',
    assignedToId: 1, assignedToName: 'Eveline de Wit', status: 'open',
    sourceMessageId: 1, createdAt: min(9), completedAt: null, completedById: null, completedByName: null,
    contactName: 'Eduardo Silva', matchCategory: 'candidate',
  },
  {
    id: 2, conversationId: 2, phoneNumber: '31687654321',
    summary: 'Vervanging zoeken voor de dienst van morgen', category: 'vervanging',
    assignedToId: null, assignedToName: null, status: 'open',
    sourceMessageId: 2, createdAt: min(19), completedAt: null, completedById: null, completedByName: null,
    contactName: 'Marta Kowalska', matchCategory: 'candidate',
  },
];

function Harness() {
  const params = new URLSearchParams(window.location.search);
  const [profielOpen, setProfielOpen] = useState(params.get('profiel') !== 'dicht');
  const [tab, setTab] = useState<'candidate' | 'unmatched' | 'prospect'>('candidate');
  const [search, setSearch] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [snoozedView, setSnoozedView] = useState(false);
  const [hideAiHandled, setHideAiHandled] = useState(true);
  const [takenOpen, setTakenOpen] = useState(params.get('taken') === 'open');
  const [selectedPhone, setSelectedPhone] = useState('31612345678');
  const [composerText, setComposerText] = useState('');
  const conv = GESPREKKEN.find(c => c.phoneNumber === selectedPhone) ?? null;

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 57px)', minHeight: 480,
      fontFamily: WA_FONT, overflow: 'hidden',
    }}>
      <Sidebar
        tab={tab} onTab={setTab} stats={STATS}
        search={search} onSearch={setSearch}
        assignedToMe={assignedToMe} onToggleAssignedToMe={() => setAssignedToMe(v => !v)}
        snoozedView={snoozedView} onToggleSnoozedView={() => setSnoozedView(v => !v)}
        hideAiHandled={hideAiHandled} onToggleHideAiHandled={() => setHideAiHandled(v => !v)}
        hiddenAiCount={2}
        conversations={GESPREKKEN}
        selectedPhone={selectedPhone}
        onSelect={setSelectedPhone}
        taken={{
          open: takenOpen, onToggleOpen: () => setTakenOpen(v => !v),
          tasks: TAKEN, openTotaal: TAKEN.length,
          statusFilter: 'open', onStatusFilter: () => {},
          assigneeFilter: 'alle', onAssigneeFilter: () => {},
          teamMembers: TEAM, onToggleTask: () => {}, onAssign: () => {},
          onSelectConversation: () => {}, bezig: [], fout: null,
        }}
      />
      <ChatView
        conv={conv}
        messages={BERICHTEN}
        teamMembers={TEAM}
        composerText={composerText}
        onComposerText={setComposerText}
        onSend={async () => {}}
        sending={false}
        sendError={null}
        aiLoading={false}
        onAiSuggest={() => {}}
        onSnooze={async () => {}}
        profielOpen={profielOpen}
        onToggleProfiel={() => setProfielOpen(v => !v)}
      />
      {conv && profielOpen && (
        <ProfilePanel
          conv={conv}
          teamMembers={TEAM}
          onQuickReply={setComposerText}
          onConversationChanged={() => {}}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Harness />);
