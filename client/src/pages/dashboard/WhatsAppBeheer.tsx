import { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Settings as SettingsIcon, Hourglass, AlertTriangle, Pencil, MessageCircle, Briefcase, UserPlus, Building2, Upload, Plus, X, Trash2, SlidersHorizontal, Tag } from 'lucide-react';
import {
  haalGesprekken,
  haalBerichten,
  stuurBericht,
  stuurMedia,
  markeerGelezen,
  markeerOngelezen,
  updateInboxStatus,
  haalStats,
  haalWebhookStatus,
  registreerWebhook,
  updateContactInfo,
  koppelContactAanGesprek,
  bewerkContactNaam,
  haalTeamMembers,
  wijsGesprekToe,
  updateLabels,
  haalNotities,
  maakNotitie,
  haalGroepen,
  maakGroep,
  updateGroep,
  verwijderGroep,
  haalGroepLeden,
  voegLedenToe,
  verwijderLid,
  haalBeschikbareContacten,
  stuurBulkBericht,
  haalBulkVerzendingen,
  updateConversationCategory,
  haalImportKandidaten,
  haalImportMedewerkers,
  haalImportKlanten,
  parseCsv,
  vraagAiSuggestie,
  type Conversation,
  type Message,
  type Stats,
  type WebhookStatus,
  type TeamMember,
  type InternalNote,
  type Group,
  type GroupMember,
  type AvailableContact,
  type BulkSendResult,
  type BulkSendRecord,
  type ImportCandidate,
  type ImportProspect,
  type ImportEmployee,
} from '../../api/whatsappClient';

// Primaire accentkleur — afgestemd op de rest van het dashboard (Tailwind purple-700).
// Variabele heet nog NAVY voor backwards compatibiliteit met alle inline-styles in dit bestand.
const NAVY = '#7E22CE';
const FONT = "'Poppins', system-ui, -apple-system, sans-serif";

type Tab = 'candidate' | 'prospect' | 'unmatched';
type ThreadView = 'messages' | 'notes';
type FilterUnread = 'all' | 'unread';
type MainView = 'gesprekken' | 'groepen';

const TAB_LABELS: Record<Tab, string> = {
  candidate: 'Medewerkers',
  prospect: 'Klanten',
  unmatched: 'Kandidaten',
};

const STATUS_LABEL: Record<string, string> = {
  queued: '\u231B in wachtrij',
  sent: '\u2713 verzonden',
  delivered: '\u2713\u2713 bezorgd',
  read: '\u2713\u2713 gelezen',
  failed: '\u2717 mislukt',
  received: '',
};

const LABEL_COLORS: Record<string, string> = {
  urgent: '#DC2626',
  opvolgen: '#F59E0B',
  wacht: '#6366F1',
  belangrijk: '#059669',
  nieuw: '#3B82F6',
};

function labelColor(label: string): string {
  return LABEL_COLORS[label] || '#6B7280';
}

export default function WhatsAppBeheer() {
  const [mainView, setMainView] = useState<MainView>('gesprekken');
  const [tab, setTab] = useState<Tab>('candidate');
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
  const [webhookBusy, setWebhookBusy] = useState(false);
  const [webhookMsg, setWebhookMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [editingContact, setEditingContact] = useState(false);
  // 'rename' = alleen voor/achternaam wijzigen op gekoppelde candidate/prospect.
  // 'add'    = nieuw contact aanmaken vanuit een unmatched gesprek (bestaand gedrag).
  const [editMode, setEditMode] = useState<'add' | 'rename'>('add');
  const [editVoornaam, setEditVoornaam] = useState('');
  const [editAchternaam, setEditAchternaam] = useState('');
  const [editCategorie, setEditCategorie] = useState<'klant' | 'medewerker' | 'kandidaat'>('kandidaat');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [threadView, setThreadView] = useState<ThreadView>('messages');
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [filterUnread, setFilterUnread] = useState<FilterUnread>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterLabel, setFilterLabel] = useState<string>('all');
  const [labelInput, setLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  // Nieuwe sidebar-filters (Open/Opgelost/Spam/Alle + multi-select labels) en sort-order.
  const [inboxFilter, setInboxFilter] = useState<'open' | 'resolved' | 'spam' | 'all'>('open');
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  // Popover-state voor de gebundelde sub-filters (Iedereen + Labels) achter het filter-icoon
  // naast de zoekbalk. Vervangt de losse drie dropdowns die de zoekbalk te druk maakten.
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  // Popover voor "+ Label toevoegen" boven het geopende gesprek — bevat presets én vrije input,
  // zodat de header rustig blijft.
  const [showLabelPopover, setShowLabelPopover] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notesEndRef = useRef<HTMLDivElement>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [availableContacts, setAvailableContacts] = useState<AvailableContact[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [addingMembers, setAddingMembers] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkSendResult | null>(null);
  const [bulkHistory, setBulkHistory] = useState<BulkSendRecord[]>([]);
  const [showBulkHistory, setShowBulkHistory] = useState(false);
  const [confirmBulkSend, setConfirmBulkSend] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDismissed, setAiDismissed] = useState(false);
  const [aiLastInboundId, setAiLastInboundId] = useState<number | null>(null);
  const [bulkAiLoading, setBulkAiLoading] = useState(false);

  type ImportTab = 'whatsapp' | 'medewerkers' | 'kandidaten' | 'klanten' | 'csv' | 'handmatig';
  const [importTab, setImportTab] = useState<ImportTab>('whatsapp');
  const [importCandidates, setImportCandidates] = useState<ImportCandidate[]>([]);
  const [importProspects, setImportProspects] = useState<ImportProspect[]>([]);
  const [importEmployees, setImportEmployees] = useState<ImportEmployee[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvParsed, setCsvParsed] = useState<Array<{ name: string; phone: string; alreadyInGroup: boolean }>>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvParsing, setCsvParsing] = useState(false);
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [importFilterFunc, setImportFilterFunc] = useState<string>('all');
  const [importFilterStatus, setImportFilterStatus] = useState<string>('all');
  const [importFilterBranche, setImportFilterBranche] = useState<string>('all');

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const [c, s] = await Promise.all([haalGesprekken(tab), haalStats()]);
        if (!stop) {
          setConversations(c);
          setStats(s);
        }
      } catch { /* ignore */ }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => { stop = true; clearInterval(id); };
  }, [tab]);

  useEffect(() => {
    haalWebhookStatus().then(setWebhookStatus).catch(() => {});
    haalTeamMembers().then(setTeamMembers).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedPhone) { setMessages([]); setNotes([]); setThreadView('messages'); setAiSuggestion(''); setAiDismissed(false); setAiLastInboundId(null); return; }
    let stop = false;
    const tick = async () => {
      try {
        const m = await haalBerichten(selectedPhone);
        if (!stop) setMessages(m);
      } catch { /* ignore */ }
    };
    tick();
    markeerGelezen(selectedPhone).catch(() => {});
    haalNotities(selectedPhone).then(setNotes).catch(() => {});
    const id = setInterval(tick, 4000);
    return () => { stop = true; clearInterval(id); };
  }, [selectedPhone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (messages.length === 0 || aiDismissed || aiLoading) return;
    const lastInbound = [...messages].reverse().find(m => m.direction === 'inbound');
    if (!lastInbound) return;
    if (lastInbound.id === aiLastInboundId) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.direction !== 'inbound') return;
    setAiLastInboundId(lastInbound.id);
    setAiSuggestion('');
    setAiError(null);
    setAiLoading(true);
    const conv = conversations.find(c => c.phoneNumber === selectedPhone);
    vraagAiSuggestie(messages, conv?.displayName, conv?.contactCompany, 'individual', selectedPhone)
      .then(r => { setAiSuggestion(r.suggestion); })
      .catch(e => { setAiError(e.message || 'AI suggestie mislukt'); })
      .finally(() => setAiLoading(false));
  }, [messages, selectedPhone]);

  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes.length]);

  useEffect(() => {
    if (mainView === 'groepen') {
      haalGroepen().then(setGroups).catch(() => {});
    }
  }, [mainView]);

  useEffect(() => {
    if (selectedGroupId) {
      haalGroepLeden(selectedGroupId).then(setGroupMembers).catch(() => {});
      setBulkResult(null);
      setBulkText('');
      setShowAddMembers(false);
      setEditingGroup(false);
      setConfirmBulkSend(false);
      setShowBulkHistory(false);
    } else {
      setGroupMembers([]);
    }
  }, [selectedGroupId]);

  const allLabelsInUse = useMemo(() => {
    const set = new Set<string>();
    conversations.forEach(c => c.labels?.forEach(l => set.add(l)));
    return Array.from(set).sort();
  }, [conversations]);

  // Tellingen voor de inbox-sidebar (Open / Opgelost / Spam / Alle).
  // Dit telt binnen de huidige categorie-tab (gesprekken is al daarop gefilterd).
  const inboxCounts = useMemo(() => {
    const counts = { open: 0, resolved: 0, spam: 0, all: conversations.length };
    for (const c of conversations) {
      const s = (c.inboxStatus ?? 'open') as 'open' | 'resolved' | 'spam';
      counts[s]++;
    }
    return counts;
  }, [conversations]);

  // Per-categorie ongelezen-tellingen voor de tabs bovenaan kolom 2.
  // Houdt rekening met de huidige inbox-filter zodat het overeenkomt met wat zichtbaar is.
  const filteredConversations = useMemo(() => {
    let list = conversations;
    // Inbox-status filter (sidebar — primair filter)
    if (inboxFilter !== 'all') {
      list = list.filter(c => (c.inboxStatus ?? 'open') === inboxFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.displayName?.toLowerCase().includes(q)) || c.phoneNumber.includes(search)
      );
    }
    if (filterUnread === 'unread') {
      list = list.filter(c => c.unreadCount > 0);
    }
    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') {
        list = list.filter(c => !c.assignedToId);
      } else {
        const id = parseInt(filterAssignee);
        list = list.filter(c => c.assignedToId === id);
      }
    }
    if (filterLabel !== 'all') {
      list = list.filter(c => c.labels?.includes(filterLabel));
    }
    // Multi-select labels uit sidebar (AND-filter — toon alleen gesprekken met ALLE geselecteerde labels).
    if (selectedLabels.size > 0) {
      list = list.filter(c => {
        const lbls = c.labels ?? [];
        for (const want of selectedLabels) if (!lbls.includes(want)) return false;
        return true;
      });
    }
    // Sortering — nieuwste eerst is default; oudste eerst toggle voor afhandelen oude berichten.
    const sorted = [...list].sort((a, b) => {
      const at = new Date(a.lastMessageAt).getTime();
      const bt = new Date(b.lastMessageAt).getTime();
      return sortOrder === 'newest' ? bt - at : at - bt;
    });
    return sorted;
  }, [conversations, search, filterUnread, filterAssignee, filterLabel, inboxFilter, selectedLabels, sortOrder]);

  const selectedConv = conversations.find(c => c.phoneNumber === selectedPhone);
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const within24h = useMemo(() => {
    if (!selectedConv?.lastInboundAt) return false;
    const last = new Date(selectedConv.lastInboundAt).getTime();
    return Date.now() - last < 24 * 60 * 60 * 1000;
  }, [selectedConv]);

  const hasActiveFilters = filterUnread !== 'all' || filterAssignee !== 'all' || filterLabel !== 'all';

  const filteredAvailable = useMemo(() => {
    if (!contactSearch.trim()) return availableContacts;
    const q = contactSearch.toLowerCase();
    return availableContacts.filter(c =>
      c.displayName?.toLowerCase().includes(q) || c.phoneNumber.includes(contactSearch)
    );
  }, [availableContacts, contactSearch]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPhone) return;
    if (!reply.trim() && !attachedFile) return;
    setSending(true);
    setSendError(null);
    try {
      if (attachedFile) {
        await stuurMedia(selectedPhone, attachedFile, reply.trim() || undefined);
      } else {
        await stuurBericht(selectedPhone, reply);
      }
      setReply('');
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setAiSuggestion('');
      setAiDismissed(false);
      const m = await haalBerichten(selectedPhone);
      setMessages(m);
    } catch (e: any) {
      setSendError(e.message || 'Versturen mislukt');
    } finally {
      setSending(false);
    }
  }

  async function requestAiSuggestion() {
    if (messages.length === 0 || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    setAiDismissed(false);
    const conv = conversations.find(c => c.phoneNumber === selectedPhone);
    try {
      const r = await vraagAiSuggestie(messages, conv?.displayName, conv?.contactCompany, 'individual', selectedPhone);
      setAiSuggestion(r.suggestion);
    } catch (e: any) {
      setAiError(e.message || 'AI suggestie mislukt');
    } finally {
      setAiLoading(false);
    }
  }

  async function requestBulkAiSuggestion() {
    if (bulkAiLoading) return;
    setBulkAiLoading(true);
    try {
      const fakeMessages = [{ id: 0, direction: 'inbound' as const, waMessageId: null, fromNumber: '', toNumber: '', messageType: 'text', body: 'Ik verwacht een groepsbericht voor deze groep', mediaUrl: null, mediaMimeType: null, status: 'received', errorCode: null, errorMessage: null, matchCategory: 'candidate' as const, createdAt: new Date().toISOString() }];
      const r = await vraagAiSuggestie(fakeMessages, null, null, 'bulk');
      setBulkText(r.suggestion);
    } catch { /* ignore */ }
    finally { setBulkAiLoading(false); }
  }

  async function handleRegisterWebhook() {
    setWebhookBusy(true);
    setWebhookMsg(null);
    try {
      await registreerWebhook();
      setWebhookMsg({ kind: 'ok', text: 'Webhook geregistreerd bij 360dialog' });
      setWebhookStatus(await haalWebhookStatus());
    } catch (e: any) {
      setWebhookMsg({ kind: 'err', text: e.message?.includes('Bad request') || e.message?.includes('permission')
        ? 'Webhook kan niet via API gezet worden \u2014 vraag 360dialog support om de URL handmatig in te stellen.'
        : (e.message || 'Mislukt') });
    } finally {
      setWebhookBusy(false);
    }
  }

  function openEditContact() {
    if (!selectedConv) return;
    // Splits bestaande displayName op spatie als voor-/achternaam-suggestie
    const parts = (selectedConv.displayName || '').trim().split(/\s+/);
    setEditVoornaam(parts[0] || '');
    setEditAchternaam(parts.slice(1).join(' ') || '');
    // Pre-selecteer categorie op basis van huidig tabblad / matchCategory
    const initCat: 'klant' | 'medewerker' | 'kandidaat' =
      selectedConv.matchCategory === 'prospect' ? 'klant'
      : selectedConv.matchCategory === 'candidate' ? 'medewerker'
      : 'kandidaat';
    setEditCategorie(initCat);
    setEditEmail('');
    setEditNotes(selectedConv.contactNotes || '');
    setEditError(null);
    // Bekend contact (candidate of prospect) → alleen naam bewerken.
    // Onbekend → volledige "toevoegen aan contacten"-flow.
    const isKnown = !!(selectedConv.candidateId || selectedConv.prospectContactId);
    setEditMode(isKnown ? 'rename' : 'add');
    setEditingContact(true);
  }

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPhone || !editVoornaam.trim() || !editAchternaam.trim()) return;
    setEditSaving(true);
    setEditError(null);
    try {
      if (editMode === 'rename') {
        // Werk voor- en achternaam bij op de onderliggende candidate/prospect-rij.
        await bewerkContactNaam(selectedPhone, {
          voornaam: editVoornaam.trim(),
          achternaam: editAchternaam.trim(),
        });
        setEditingContact(false);
        const c = await haalGesprekken(tab);
        setConversations(c);
      } else {
        await koppelContactAanGesprek(selectedPhone, {
          voornaam: editVoornaam.trim(),
          achternaam: editAchternaam.trim(),
          categorie: editCategorie,
          email: editCategorie === 'klant' ? (editEmail.trim() || undefined) : undefined,
          notities: editNotes.trim() || undefined,
        });
        // Synchroniseer manualCategory zodat het gesprek in de juiste tab blijft
        // (en niet door de auto-matcher naar een andere tab wordt verplaatst).
        const targetCategory: 'candidate' | 'prospect' | 'unmatched' =
          editCategorie === 'klant' ? 'prospect'
          : editCategorie === 'medewerker' ? 'candidate'
          : 'candidate'; // 'kandidaat' creëert ook een candidate-rij
        await updateConversationCategory(selectedPhone, targetCategory);
        setEditingContact(false);
        // Verversing: schakel naar het juiste tabblad zodat het gesprek zichtbaar blijft
        const newTab: Tab = targetCategory;
        setTab(newTab);
        const c = await haalGesprekken(newTab);
        setConversations(c);
      }
    } catch (err: any) {
      setEditError(err?.message || 'Opslaan mislukt');
    }
    setEditSaving(false);
  }

  async function handleAssign(memberId: string) {
    if (!selectedPhone) return;
    if (memberId === '') {
      await wijsGesprekToe(selectedPhone, null, null);
    } else {
      const member = teamMembers.find(m => m.id === parseInt(memberId));
      if (member) await wijsGesprekToe(selectedPhone, member.id, member.name);
    }
    const c = await haalGesprekken(tab);
    setConversations(c);
  }

  async function handleAddLabel(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPhone || !labelInput.trim()) return;
    const current = selectedConv?.labels || [];
    const newLabel = labelInput.trim().toLowerCase();
    if (current.includes(newLabel)) { setLabelInput(''); return; }
    await updateLabels(selectedPhone, [...current, newLabel]);
    setLabelInput('');
    setShowLabelInput(false);
    const c = await haalGesprekken(tab);
    setConversations(c);
  }

  async function handleRemoveLabel(label: string) {
    if (!selectedPhone || !selectedConv) return;
    const current = selectedConv.labels || [];
    await updateLabels(selectedPhone, current.filter(l => l !== label));
    const c = await haalGesprekken(tab);
    setConversations(c);
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPhone || !newNote.trim()) return;
    setNoteSaving(true);
    try {
      await maakNotitie(selectedPhone, newNote.trim());
      setNewNote('');
      const n = await haalNotities(selectedPhone);
      setNotes(n);
    } catch { /* ignore */ }
    setNoteSaving(false);
  }

  function convDisplayName(c: Conversation): string {
    if (c.displayName) return c.displayName;
    return 'Onbekend';
  }

  function threadSubline(c: Conversation): string {
    const phone = `+${c.phoneNumber}`;
    if (c.matchCategory === 'candidate') {
      return `${phone} \u00B7 Medewerker${c.candidateId ? ` \u00B7 #${c.candidateId}` : ''}`;
    }
    if (c.matchCategory === 'prospect') {
      return `${phone} \u00B7 Klant${c.contactCompany ? ` \u00B7 ${c.contactCompany}` : (c.prospectContactId ? ` \u00B7 #${c.prospectContactId}` : '')}`;
    }
    if (c.displayName) {
      return `${phone} \u00B7 Kandidaat${c.contactCompany ? ` \u00B7 ${c.contactCompany}` : ''}`;
    }
    return `${phone} \u00B7 Kandidaat`;
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    try {
      const g = await maakGroep(newGroupName.trim(), newGroupDesc.trim() || undefined);
      setGroups(prev => [g, ...prev]);
      setSelectedGroupId(g.id);
      setNewGroupName('');
      setNewGroupDesc('');
      setShowNewGroup(false);
    } catch { /* ignore */ }
    setCreatingGroup(false);
  }

  async function handleUpdateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGroupId || !editGroupName.trim()) return;
    await updateGroep(selectedGroupId, editGroupName.trim(), editGroupDesc.trim() || undefined);
    setGroups(await haalGroepen());
    setEditingGroup(false);
  }

  async function handleDeleteGroup() {
    if (!selectedGroupId) return;
    if (!confirm('Weet je zeker dat je deze groep wilt verwijderen?')) return;
    await verwijderGroep(selectedGroupId);
    setSelectedGroupId(null);
    setGroups(await haalGroepen());
  }

  async function openAddMembers() {
    if (!selectedGroupId) return;
    setShowAddMembers(true);
    setSelectedContacts(new Set());
    setContactSearch('');
    setImportTab('whatsapp');
    setImportCandidates([]);
    setImportProspects([]);
    setImportEmployees([]);
    setCsvText('');
    setCsvParsed([]);
    setCsvErrors([]);
    setManualFirstName('');
    setManualLastName('');
    setManualPhone('');
    setImportFilterFunc('all');
    setImportFilterStatus('all');
    setImportFilterBranche('all');
    try {
      const contacts = await haalBeschikbareContacten(selectedGroupId);
      setAvailableContacts(contacts);
    } catch { /* ignore */ }
  }

  async function loadImportTab(tab: ImportTab) {
    if (!selectedGroupId) return;
    setImportTab(tab);
    setSelectedContacts(new Set());
    setContactSearch('');
    if (tab === 'kandidaten' && importCandidates.length === 0) {
      setImportLoading(true);
      try {
        setImportCandidates(await haalImportKandidaten(selectedGroupId));
      } catch { /* ignore */ }
      setImportLoading(false);
    }
    if (tab === 'klanten' && importProspects.length === 0) {
      setImportLoading(true);
      try {
        setImportProspects(await haalImportKlanten(selectedGroupId));
      } catch { /* ignore */ }
      setImportLoading(false);
    }
    if (tab === 'medewerkers' && importEmployees.length === 0) {
      setImportLoading(true);
      try {
        setImportEmployees(await haalImportMedewerkers(selectedGroupId));
      } catch { /* ignore */ }
      setImportLoading(false);
    }
  }

  async function handleParseCsv() {
    if (!selectedGroupId || !csvText.trim()) return;
    setCsvParsing(true);
    try {
      const result = await parseCsv(csvText, selectedGroupId);
      setCsvParsed(result.contacts);
      setCsvErrors(result.errors);
      setSelectedContacts(new Set(result.contacts.filter(c => !c.alreadyInGroup).map(c => c.phone)));
    } catch { /* ignore */ }
    setCsvParsing(false);
  }

  async function handleAddSelectedMembers() {
    if (!selectedGroupId || selectedContacts.size === 0) return;
    setAddingMembers(true);

    let membersToAdd: Array<{ phoneNumber: string; displayName?: string; firstName?: string; lastName?: string }> = [];

    if (importTab === 'whatsapp') {
      membersToAdd = Array.from(selectedContacts).map(phone => {
        const c = availableContacts.find(ac => ac.phoneNumber === phone);
        // displayName uit het bestaande WA-contact opsplitsen op de eerste spatie
        // zodat {{voornaam}}/{{achternaam}}-variabelen ook hier werken.
        const dn = c?.displayName || '';
        const parts = dn.trim().split(/\s+/);
        const firstName = parts[0] || undefined;
        const lastName = parts.slice(1).join(' ') || undefined;
        return { phoneNumber: phone, displayName: dn || undefined, firstName, lastName };
      });
    } else if (importTab === 'kandidaten') {
      membersToAdd = Array.from(selectedContacts).map(phone => {
        const c = importCandidates.find(ic => ic.phone === phone);
        return { phoneNumber: phone, displayName: c?.name || undefined, firstName: c?.firstName, lastName: c?.lastName };
      });
    } else if (importTab === 'medewerkers') {
      membersToAdd = Array.from(selectedContacts).map(phone => {
        const c = importEmployees.find(ie => ie.phone === phone);
        return { phoneNumber: phone, displayName: c?.name || undefined, firstName: c?.firstName, lastName: c?.lastName };
      });
    } else if (importTab === 'klanten') {
      membersToAdd = Array.from(selectedContacts).map(phone => {
        const c = importProspects.find(ip => ip.phone === phone);
        return { phoneNumber: phone, displayName: c?.name || undefined, firstName: c?.firstName, lastName: c?.lastName };
      });
    } else if (importTab === 'csv') {
      membersToAdd = Array.from(selectedContacts).map(phone => {
        const c = csvParsed.find(cp => cp.phone === phone);
        const dn = c?.name || '';
        const parts = dn.trim().split(/\s+/);
        return {
          phoneNumber: phone,
          displayName: dn || undefined,
          firstName: parts[0] || undefined,
          lastName: parts.slice(1).join(' ') || undefined,
        };
      });
    } else if (importTab === 'handmatig') {
      if (manualPhone.trim()) {
        const fn = manualFirstName.trim();
        const ln = manualLastName.trim();
        const composed = [fn, ln].filter(Boolean).join(' ');
        membersToAdd = [{
          phoneNumber: manualPhone.trim(),
          displayName: composed || undefined,
          firstName: fn || undefined,
          lastName: ln || undefined,
        }];
      }
    }

    try {
      await voegLedenToe(selectedGroupId, membersToAdd);
      setGroupMembers(await haalGroepLeden(selectedGroupId));
      setGroups(await haalGroepen());
      setShowAddMembers(false);
      setSelectedContacts(new Set());
      setManualFirstName('');
      setManualLastName('');
      setManualPhone('');
    } catch { /* ignore */ }
    setAddingMembers(false);
  }

  async function handleAddManual() {
    if (!selectedGroupId || !manualPhone.trim()) return;
    setAddingMembers(true);
    try {
      const fn = manualFirstName.trim();
      const ln = manualLastName.trim();
      const composed = [fn, ln].filter(Boolean).join(' ');
      await voegLedenToe(selectedGroupId, [{
        phoneNumber: manualPhone.trim(),
        displayName: composed || undefined,
        firstName: fn || undefined,
        lastName: ln || undefined,
      }]);
      setGroupMembers(await haalGroepLeden(selectedGroupId));
      setGroups(await haalGroepen());
      setManualFirstName('');
      setManualLastName('');
      setManualPhone('');
    } catch { /* ignore */ }
    setAddingMembers(false);
  }

  async function handleRemoveMember(phone: string) {
    if (!selectedGroupId) return;
    await verwijderLid(selectedGroupId, phone);
    setGroupMembers(await haalGroepLeden(selectedGroupId));
    setGroups(await haalGroepen());
  }

  function toggleContactSelection(phone: string) {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone); else next.add(phone);
      return next;
    });
  }

  async function handleBulkSend() {
    if (!selectedGroupId || !bulkText.trim()) return;
    setBulkSending(true);
    setBulkResult(null);
    try {
      const result = await stuurBulkBericht(selectedGroupId, bulkText.trim());
      setBulkResult(result);
      setBulkText('');
      setConfirmBulkSend(false);
    } catch (e: any) {
      setBulkResult({ bulkSendId: 0, total: 0, sent: 0, failed: 0, results: [{ phone: '', displayName: null, status: 'failed', error: e.message || 'Onbekende fout' }] });
    }
    setBulkSending(false);
  }

  async function openBulkHistory() {
    setShowBulkHistory(true);
    try {
      setBulkHistory(await haalBulkVerzendingen());
    } catch { /* ignore */ }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 500, fontFamily: FONT }}>

      {/* Page header — zelfde patroon als Kandidaten/Sollicitanten:
          h1 + subtitel links, action-knoppen rechts. De Gesprekken/Groepen-toggle is bewust
          verwijderd: groepen-functionaliteit blijft in de code maar is niet meer bereikbaar
          via deze view (zie groepen-tab in de Communicatie-submenu — komt later). */}
      <div className="flex items-center justify-between mb-4" style={{ fontFamily: FONT }}>
        <div>
          <h1 className="text-xl font-bold">WhatsApp</h1>
          <p className="text-xs text-gray-500 hidden sm:block">Beheer al je WhatsApp-gesprekken op één plek</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Webhook-instellingen"
            style={{
              background: showSettings ? '#F0F4FA' : 'transparent',
              border: '1px solid #E5E7EB', borderRadius: 8,
              padding: '6px 10px', cursor: 'pointer', color: showSettings ? NAVY : '#6B7280',
              display: 'flex', alignItems: 'center',
            }}
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </div>


      {showSettings && (
        <div style={{
          padding: '12px 16px', background: '#FAFBFC', border: '1px solid #E5E7EB',
          borderRadius: 10, marginBottom: 12, fontSize: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ color: '#374151', flex: 1 }}>
              <strong style={{ color: NAVY }}>Webhook:</strong>{' '}
              {webhookStatus?.configured && webhookStatus.url
                ? <span style={{ color: '#059669', fontFamily: 'monospace', wordBreak: 'break-all' }}>{webhookStatus.url}</span>
                : <span style={{ color: '#DC2626' }}>niet geregistreerd bij 360dialog</span>}
              {!webhookStatus?.secretSet && (
                <span style={{ color: '#DC2626', marginLeft: 8 }}>\u00B7 WHATSAPP_WEBHOOK_SECRET ontbreekt</span>
              )}
            </div>
            <button
              onClick={handleRegisterWebhook}
              disabled={webhookBusy || !webhookStatus?.secretSet}
              style={{
                background: webhookBusy || !webhookStatus?.secretSet ? '#E5E7EB' : NAVY,
                color: webhookBusy || !webhookStatus?.secretSet ? '#9CA3AF' : '#fff',
                border: 'none', borderRadius: 6, padding: '6px 12px',
                fontSize: 12, fontWeight: 600, cursor: webhookBusy ? 'wait' : 'pointer', flexShrink: 0,
              }}
            >
              {webhookBusy ? 'Bezig...' : 'Webhook registreren'}
            </button>
          </div>
          {webhookMsg && (
            <div style={{
              marginTop: 8, padding: '6px 10px', borderRadius: 6, fontSize: 11,
              background: webhookMsg.kind === 'ok' ? '#F0FDF4' : '#FEF2F2',
              color: webhookMsg.kind === 'ok' ? '#059669' : '#DC2626',
              border: `1px solid ${webhookMsg.kind === 'ok' ? '#BBF7D0' : '#FECACA'}`,
            }}>
              {webhookMsg.text}
            </div>
          )}
        </div>
      )}

      {/* Hoofdgrid */}
      <div style={{ display: 'flex', flex: 1, gap: 12, minHeight: 0 }}>

        {/* ════════ GESPREKKEN VIEW ════════ */}
        {mainView === 'gesprekken' && (
          <>
            {/* ─── Kolom 1: Gesprekkenlijst ─────────────────────────────────────
                2-koloms layout (sidebar verwijderd op 2026-05-06): inbox-status zit nu
                als pill-rij boven de zoekbalk, label-filters via de bestaande dropdown. */}
            <div style={{
              width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column',
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden',
            }}>
              {/* Categorie-tabs (Medewerkers/Klanten/Kandidaten) */}
              <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#FAFBFC' }}>
                {(Object.keys(TAB_LABELS) as Tab[]).map(t => {
                  const active = tab === t;
                  const unread = stats?.[t]?.unread ?? 0;
                  return (
                    <button
                      key={t}
                      onClick={() => { setTab(t); setSelectedPhone(null); }}
                      style={{
                        flex: 1, padding: '12px 8px', border: 'none', background: 'none',
                        fontSize: 12, fontWeight: 600,
                        color: active ? NAVY : '#6B7280',
                        borderBottom: active ? `2px solid ${NAVY}` : '2px solid transparent',
                        cursor: 'pointer', fontFamily: FONT,
                      }}
                    >
                      {TAB_LABELS[t]} {unread > 0 && (
                        <span style={{
                          background: '#DC2626', color: '#fff', borderRadius: 10,
                          padding: '1px 6px', fontSize: 10, marginLeft: 4,
                        }}>{unread}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Inbox-status filter-pills (vervanging van de oude sidebar).
                  Active = paars (purple-600), inactive = wit met grijze rand,
                  identiek aan de pill-rij in Sollicitanten. */}
              <div style={{
                display: 'flex', gap: 6, padding: '10px 10px 8px',
                borderBottom: '1px solid #F3F4F6', overflowX: 'auto',
              }}>
                {([
                  { key: 'open',     label: 'Open',     count: inboxCounts.open     },
                  { key: 'resolved', label: 'Opgelost', count: inboxCounts.resolved },
                  { key: 'spam',     label: 'Spam',     count: inboxCounts.spam     },
                  { key: 'all',      label: 'Alle',     count: inboxCounts.all      },
                ] as const).map(item => {
                  const active = inboxFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setInboxFilter(item.key)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 999, flexShrink: 0,
                        fontSize: 11, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
                        background: active ? '#9333EA' : '#fff',
                        color: active ? '#fff' : '#4B5563',
                        border: active ? '1px solid #9333EA' : '1px solid #E5E7EB',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span>{item.label}</span>
                      {item.count > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          padding: '0 6px', borderRadius: 999, minWidth: 16, textAlign: 'center',
                          background: active ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                          color: active ? '#fff' : '#6B7280',
                        }}>{item.count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Zoekbalk + filter-icoon (sub-filters in popover).
                  De vorige drie losse dropdowns (Alle/Iedereen/Labels) zijn vervangen door één
                  filter-knop naast de zoekbalk; sub-filters klap je open via dat icoon. */}
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #E5E7EB', position: 'relative' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Zoek op naam of nummer..."
                    style={{
                      flex: 1, padding: '7px 10px', fontSize: 12,
                      border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none',
                      fontFamily: FONT, boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFilterPopover(v => !v)}
                    title="Sub-filters (toegewezen aan / labels)"
                    aria-label="Sub-filters tonen"
                    style={{
                      flexShrink: 0, width: 28, height: 28, display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center',
                      borderRadius: 6, cursor: 'pointer',
                      background: (filterAssignee !== 'all' || filterLabel !== 'all') ? '#F3E8FF' : '#fff',
                      border: '1px solid ' + ((filterAssignee !== 'all' || filterLabel !== 'all') ? '#C4B5FD' : '#E5E7EB'),
                      color: (filterAssignee !== 'all' || filterLabel !== 'all') ? NAVY : '#6B7280',
                      position: 'relative',
                    }}
                  >
                    <SlidersHorizontal size={14} />
                    {(filterAssignee !== 'all' || filterLabel !== 'all') && (
                      <span style={{
                        position: 'absolute', top: -3, right: -3,
                        width: 8, height: 8, borderRadius: '50%', background: NAVY,
                        border: '1px solid #fff',
                      }} />
                    )}
                  </button>
                </div>
                {showFilterPopover && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 10, marginTop: 4,
                    background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.08)', padding: 12, zIndex: 20,
                    minWidth: 220, display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                        Toegewezen aan
                      </div>
                      <select
                        value={filterAssignee}
                        onChange={e => setFilterAssignee(e.target.value)}
                        style={{ width: '100%', fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontFamily: FONT, color: filterAssignee !== 'all' ? NAVY : '#374151', background: '#fff' }}
                      >
                        <option value="all">Iedereen</option>
                        <option value="unassigned">Niet toegewezen</option>
                        {teamMembers.map(m => (
                          <option key={m.id} value={String(m.id)}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    {allLabelsInUse.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                          Label
                        </div>
                        <select
                          value={filterLabel}
                          onChange={e => setFilterLabel(e.target.value)}
                          style={{ width: '100%', fontSize: 12, padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontFamily: FONT, color: filterLabel !== 'all' ? NAVY : '#374151', background: '#fff' }}
                        >
                          <option value="all">Alle labels</option>
                          {allLabelsInUse.map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {(filterAssignee !== 'all' || filterLabel !== 'all') && (
                      <button
                        onClick={() => { setFilterAssignee('all'); setFilterLabel('all'); }}
                        style={{ fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}
                      >
                        {'\u2715'} Filters resetten
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilterPopover(false)}
                      style={{ alignSelf: 'flex-end', fontSize: 11, color: NAVY, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', fontWeight: 600 }}
                    >
                      Sluiten
                    </button>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredConversations.length === 0 && (
                  <div style={{ padding: 30, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
                    {search || hasActiveFilters ? 'Geen resultaten' : 'Geen gesprekken in deze categorie'}
                  </div>
                )}
                {filteredConversations.map(c => {
                  const selected = c.phoneNumber === selectedPhone;
                  const unread = c.unreadCount > 0;
                  const name = convDisplayName(c);
                  const status = (c.inboxStatus ?? 'open') as 'open' | 'resolved' | 'spam';
                  // Status-stip: blauw = open, groen = opgelost, rood = spam.
                  // Wanneer ongelezen: rood pulsje overheen voor visuele urgentie.
                  const statusColor = status === 'resolved' ? '#10B981' : status === 'spam' ? '#DC2626' : NAVY;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedPhone(c.phoneNumber)}
                      style={{
                        padding: '11px 14px 11px 12px',
                        background: selected ? '#E8F0F8' : '#fff',
                        borderBottom: '1px solid #F3F4F6',
                        cursor: 'pointer',
                        display: 'flex', gap: 10,
                      }}
                      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = '#fff'; }}
                    >
                      {/* Status-stip links */}
                      <div style={{ flexShrink: 0, paddingTop: 5 }}>
                        <span style={{
                          display: 'block', width: 8, height: 8, borderRadius: '50%',
                          background: unread ? '#DC2626' : statusColor,
                        }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                          <div style={{
                            fontSize: 13, fontWeight: unread ? 700 : 600,
                            color: name === 'Onbekend' ? '#9CA3AF' : NAVY,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {name}
                          </div>
                          <div style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>
                            {timeAgo(c.lastMessageAt)}
                          </div>
                        </div>
                        <div style={{
                          fontSize: 12, color: unread ? '#1F2937' : '#6B7280',
                          fontWeight: unread ? 600 : 400,
                          marginTop: 3,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {(c.lastMessagePreview || '\u2014').slice(0, 50)}
                        </div>
                        {(c.labels?.length || unread) ? (
                          <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                            {c.labels?.slice(0, 3).map(l => (
                              <span key={l} style={{
                                fontSize: 9, padding: '1px 6px', borderRadius: 3,
                                background: labelColor(l) + '18', color: labelColor(l),
                                fontWeight: 600,
                              }}>{l}</span>
                            ))}
                            {unread && (
                              <span style={{
                                background: '#DC2626', color: '#fff', borderRadius: 10,
                                padding: '0 7px', fontSize: 10, fontWeight: 700, marginLeft: 'auto',
                              }}>{c.unreadCount}</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rechterkolom: thread */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden',
              minWidth: 0,
            }}>
              {!selectedConv && (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#9CA3AF', fontSize: 13,
                }}>
                  Selecteer een gesprek links
                </div>
              )}

              {selectedConv && (
                <>
                  <div style={{ padding: '16px 22px', borderBottom: '1px solid #E5E7EB', background: '#FAFBFC' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>
                            {selectedConv.matchCategory === 'candidate' && selectedConv.candidateId ? (
                              <a href={`/admin/kandidaten/${selectedConv.candidateId}`} style={{ color: NAVY, textDecoration: 'none' }}
                                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                {convDisplayName(selectedConv)}
                              </a>
                            ) : selectedConv.matchCategory === 'prospect' && selectedConv.prospectContactId ? (
                              <a href={`/admin/prospects`} style={{ color: NAVY, textDecoration: 'none' }}
                                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                {convDisplayName(selectedConv)}
                              </a>
                            ) : (
                              convDisplayName(selectedConv)
                            )}
                          </div>
                          {/* Naam toevoegen/bewerken — voor onbekend contact = nieuw record aanmaken,
                              voor bekend contact (candidate/prospect) = voor- en achternaam wijzigen
                              op het onderliggende record. */}
                          <button
                            onClick={openEditContact}
                            title={
                              (selectedConv.candidateId || selectedConv.prospectContactId)
                                ? 'Naam bewerken'
                                : (selectedConv.displayName ? 'Naam bewerken' : 'Naam toevoegen')
                            }
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '2px 4px', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                          {threadSubline(selectedConv)}
                        </div>
                        {/* Compacte label-rij: alleen toegekende labels + één "+ Label toevoegen"-knop.
                            De preset-knoppen (taal/functie) en custom-input zitten in de popover hieronder. */}
                        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap', alignItems: 'center', position: 'relative' }}>
                          {selectedConv.labels?.map(l => (
                            <span key={l} style={{
                              fontSize: 10, padding: '2px 7px', borderRadius: 3,
                              background: labelColor(l) + '18', color: labelColor(l),
                              fontWeight: 600, cursor: 'pointer',
                            }} onClick={() => handleRemoveLabel(l)} title={`Verwijder label "${l}"`}>
                              {l} ×
                            </span>
                          ))}
                          <button
                            onClick={() => setShowLabelPopover(v => !v)}
                            style={{
                              fontSize: 10, color: NAVY, background: 'none',
                              border: '1px dashed #C4B5FD', borderRadius: 3,
                              padding: '2px 7px', cursor: 'pointer', display: 'inline-flex',
                              alignItems: 'center', gap: 3, fontWeight: 600,
                            }}
                          >
                            <Tag size={9} /> Label toevoegen
                          </button>
                          {showLabelPopover && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, marginTop: 6,
                              background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
                              boxShadow: '0 6px 20px rgba(0,0,0,0.1)', padding: 12,
                              zIndex: 20, minWidth: 260, display: 'flex',
                              flexDirection: 'column', gap: 10,
                            }}>
                              {/* Preset-groepen — binnen elke groep onderling exclusief, tussen groepen vrij combineerbaar.
                                  Taalgroep stuurt ook de AI-reply-taal aan (zie backend resolveLanguageFromLabels). */}
                              {([
                                { key: 'taal',    titel: 'Taal',    labels: ['nl', 'en'] as const,
                                  display: (l: string) => l.toUpperCase() },
                                { key: 'functie', titel: 'Functie', labels: ['horeca', 'chef', 'housekeeping', 'logistiek'] as const,
                                  display: (l: string) => l.charAt(0).toUpperCase() + l.slice(1) },
                              ] as const).map(groep => (
                                <div key={groep.key}>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                                    {groep.titel}
                                  </div>
                                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {groep.labels.map(presetLabel => {
                                      const isAssigned = selectedConv.labels?.includes(presetLabel);
                                      return (
                                        <button
                                          key={presetLabel}
                                          disabled={isAssigned}
                                          onClick={async () => {
                                            if (!selectedPhone) return;
                                            const current = selectedConv.labels || [];
                                            const sameGroup: readonly string[] = groep.labels;
                                            const next = [...current.filter(l => !sameGroup.includes(l)), presetLabel];
                                            await updateLabels(selectedPhone, next);
                                            const c = await haalGesprekken(tab);
                                            setConversations(c);
                                            setShowLabelPopover(false);
                                          }}
                                          style={{
                                            fontSize: 11, fontWeight: 600,
                                            color: isAssigned ? '#9CA3AF' : '#374151',
                                            background: isAssigned ? '#F3F4F6' : '#fff',
                                            border: '1px solid ' + (isAssigned ? '#E5E7EB' : '#D1D5DB'),
                                            borderRadius: 4, padding: '3px 9px',
                                            cursor: isAssigned ? 'not-allowed' : 'pointer',
                                            fontFamily: FONT,
                                          }}
                                        >
                                          {isAssigned ? '✓ ' : '+ '}{groep.display(presetLabel)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                                  Eigen label
                                </div>
                                <form onSubmit={(e) => { handleAddLabel(e); setShowLabelPopover(false); }} style={{ display: 'flex', gap: 4 }}>
                                  <input
                                    value={labelInput}
                                    onChange={e => setLabelInput(e.target.value)}
                                    placeholder="bv. spoed, vip..."
                                    autoFocus
                                    style={{ flex: 1, fontSize: 12, padding: '5px 8px', border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT }}
                                  />
                                  <button
                                    type="submit"
                                    disabled={!labelInput.trim()}
                                    style={{
                                      fontSize: 11, fontWeight: 600,
                                      background: labelInput.trim() ? NAVY : '#E5E7EB',
                                      color: labelInput.trim() ? '#fff' : '#9CA3AF',
                                      border: 'none', borderRadius: 6, padding: '0 12px',
                                      cursor: labelInput.trim() ? 'pointer' : 'not-allowed',
                                    }}
                                  >
                                    Voeg toe
                                  </button>
                                </form>
                              </div>
                              <button
                                onClick={() => setShowLabelPopover(false)}
                                style={{ alignSelf: 'flex-end', fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
                              >
                                Sluiten
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>Categorie</div>
                          <select
                            value={selectedConv.matchCategory}
                            onChange={async e => {
                              if (!selectedPhone) return;
                              const next = e.target.value as 'candidate' | 'prospect' | 'unmatched';
                              await updateConversationCategory(selectedPhone, next);
                              const c = await haalGesprekken(tab);
                              setConversations(c);
                            }}
                            title="Verplaats dit gesprek naar een ander tabblad. Handmatige keuze blijft staan ook bij nieuwe berichten."
                            style={{
                              fontSize: 11, padding: '4px 6px', borderRadius: 4,
                              border: '1px solid #D1D5DB', fontFamily: FONT,
                              color: NAVY, minWidth: 120,
                            }}
                          >
                            <option value="candidate">Medewerkers</option>
                            <option value="prospect">Klanten</option>
                            <option value="unmatched">Kandidaten</option>
                          </select>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>Toegewezen aan</div>
                          <select
                            value={selectedConv.assignedToId ? String(selectedConv.assignedToId) : ''}
                            onChange={e => handleAssign(e.target.value)}
                            style={{
                              fontSize: 11, padding: '4px 6px', borderRadius: 4,
                              border: '1px solid #D1D5DB', fontFamily: FONT,
                              color: selectedConv.assignedToId ? NAVY : '#9CA3AF',
                              minWidth: 120,
                            }}
                          >
                            <option value="">Niemand</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={String(m.id)}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {editingContact && (
                    <div style={{ padding: '12px 18px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 2 }}>
                          {editMode === 'rename' ? 'Naam bewerken' : 'Toevoegen aan contacten'}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input value={editVoornaam} onChange={e => setEditVoornaam(e.target.value)} placeholder="Voornaam *" required
                            style={{ flex: 1, padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT }} />
                          <input value={editAchternaam} onChange={e => setEditAchternaam(e.target.value)} placeholder="Achternaam *" required
                            style={{ flex: 1, padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT }} />
                        </div>
                        {editMode === 'add' && (
                          <>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Categorie</div>
                              <select
                                value={editCategorie}
                                onChange={e => setEditCategorie(e.target.value as 'klant' | 'medewerker' | 'kandidaat')}
                                style={{
                                  width: '100%', padding: '8px 10px', fontSize: 12,
                                  border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none',
                                  fontFamily: FONT, color: NAVY, background: '#fff', cursor: 'pointer',
                                }}
                              >
                                <option value="klant">Klanten — bedrijfscontact</option>
                                <option value="medewerker">Medewerkers — aangenomen</option>
                                <option value="kandidaat">Kandidaten — sollicitant</option>
                              </select>
                            </div>
                            {editCategorie === 'klant' && (
                              <input value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email" placeholder="E-mail (optioneel — voor mailcampagnes)"
                                style={{ padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT }} />
                            )}
                            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notities op gesprek (optioneel)" rows={2}
                              style={{ padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT, resize: 'vertical' }} />
                          </>
                        )}
                        {editMode === 'rename' && (
                          <div style={{ fontSize: 11, color: '#6B7280' }}>
                            Wijzigt voor- en achternaam in {selectedConv.candidateId ? 'het kandidaten/medewerkers-record' : 'het klantcontact'}.
                          </div>
                        )}
                        {editError && (
                          <div style={{ fontSize: 11, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', padding: '6px 8px', borderRadius: 6 }}>
                            {editError}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="submit" disabled={editSaving || !editVoornaam.trim() || !editAchternaam.trim()}
                            style={{ background: editSaving || !editVoornaam.trim() || !editAchternaam.trim() ? '#E5E7EB' : NAVY, color: editSaving || !editVoornaam.trim() || !editAchternaam.trim() ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                            {editSaving ? 'Opslaan...' : (editMode === 'rename' ? 'Naam opslaan' : 'Opslaan als contact')}
                          </button>
                          <button type="button" onClick={() => setEditingContact(false)}
                            style={{ background: '#fff', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>
                            Annuleren
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
                    <button onClick={() => setThreadView('messages')}
                      style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none', color: threadView === 'messages' ? NAVY : '#9CA3AF', borderBottom: threadView === 'messages' ? `2px solid ${NAVY}` : '2px solid transparent', cursor: 'pointer', fontFamily: FONT }}>
                      Berichten
                    </button>
                    <button onClick={() => setThreadView('notes')}
                      style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none', color: threadView === 'notes' ? '#F59E0B' : '#9CA3AF', borderBottom: threadView === 'notes' ? '2px solid #F59E0B' : '2px solid transparent', cursor: 'pointer', fontFamily: FONT }}>
                      Interne notities {notes.length > 0 && <span style={{ fontSize: 10, background: '#FEF3C7', color: '#B45309', borderRadius: 10, padding: '0 5px', marginLeft: 4 }}>{notes.length}</span>}
                    </button>
                  </div>

                  {threadView === 'messages' && (
                    <>
                      <div style={{ flex: 1, overflowY: 'auto', padding: '18px', background: '#F8F9FB' }}>
                        {messages.length === 0 && (
                          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: 40 }}>Geen berichten in dit gesprek</div>
                        )}
                        {messages.map(m => (
                          <div key={m.id} style={{
                            display: 'flex',
                            justifyContent: m.direction === 'inbound' ? 'flex-start' : 'flex-end',
                            marginBottom: 10,
                          }}>
                            <div style={{
                              maxWidth: '70%',
                              background: m.direction === 'inbound' ? '#fff' : NAVY,
                              color: m.direction === 'inbound' ? '#1F2937' : '#fff',
                              padding: '8px 12px',
                              borderRadius: m.direction === 'inbound' ? '10px 10px 10px 2px' : '10px 10px 2px 10px',
                              border: m.direction === 'inbound' ? '1px solid #E5E7EB' : 'none',
                              fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
                            }}>
                              {m.body}
                              <div style={{
                                fontSize: 10, marginTop: 4,
                                color: m.direction === 'inbound' ? '#9CA3AF' : 'rgba(255,255,255,0.7)',
                                textAlign: 'right',
                              }}>
                                {new Date(m.createdAt).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                {m.direction === 'outbound' && (
                                  <span style={{ marginLeft: 6, color: m.status === 'failed' ? '#FCA5A5' : 'inherit' }}>
                                    {STATUS_LABEL[m.status] || m.status}
                                  </span>
                                )}
                              </div>
                              {m.errorMessage && (
                                <div style={{ fontSize: 10, color: '#FCA5A5', marginTop: 2 }}>{m.errorMessage}</div>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      <div style={{ padding: '12px 18px', borderTop: '1px solid #E5E7EB', background: '#fff' }}>
                        {(aiLoading || aiSuggestion || aiError) && !aiDismissed && (
                          <div style={{
                            padding: '10px 14px', background: '#F0F4FA', border: '1px solid #C7D2E0',
                            borderRadius: 8, marginBottom: 8, position: 'relative',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: aiSuggestion ? 6 : 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: NAVY, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Sparkles size={12} /> AI suggestie
                                {aiLoading && <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 400 }}>— bezig met genereren...</span>}
                              </div>
                              <button onClick={() => { setAiDismissed(true); setAiSuggestion(''); setAiError(null); }}
                                style={{ background: 'none', border: 'none', fontSize: 14, color: '#9CA3AF', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                                title="Sluiten">✕</button>
                            </div>
                            {aiError && (
                              <div style={{ fontSize: 11, color: '#DC2626' }}>{aiError}</div>
                            )}
                            {aiSuggestion && (
                              <>
                                <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, padding: '4px 0', whiteSpace: 'pre-wrap' }}>{aiSuggestion}</div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                  <button onClick={() => { setReply(aiSuggestion); setAiDismissed(true); setAiSuggestion(''); }}
                                    style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 5, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                                    Overnemen
                                  </button>
                                  <button onClick={() => { setReply(aiSuggestion); setAiDismissed(true); setAiSuggestion(''); }}
                                    style={{ background: '#fff', color: NAVY, border: '1px solid ' + NAVY, borderRadius: 5, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                                    Bewerken
                                  </button>
                                  <button onClick={requestAiSuggestion} disabled={aiLoading}
                                    style={{ background: '#fff', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 5, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontFamily: FONT }}>
                                    Opnieuw
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        {!within24h && (
                          <div style={{
                            padding: '8px 12px', background: '#FFF7ED', border: '1px solid #FED7AA',
                            borderRadius: 6, fontSize: 11, color: '#9A3412', marginBottom: 8,
                          }}>
                            <AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> 24u-venster mogelijk verstreken — WhatsApp kan vrije tekstberichten afwijzen. Stuur een template of wacht tot deze persoon iets stuurt.
                          </div>
                        )}
                        {sendError && (
                          <div style={{
                            padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA',
                            borderRadius: 6, fontSize: 11, color: '#DC2626', marginBottom: 8,
                          }}>
                            {sendError}
                          </div>
                        )}
                        {attachedFile && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE',
                            borderRadius: 6, fontSize: 12, color: '#1E40AF', marginBottom: 8,
                          }}>
                            <span style={{ fontSize: 16 }}>📎</span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {attachedFile.name} <span style={{ color: '#6B7280' }}>({(attachedFile.size / 1024).toFixed(0)} KB)</span>
                            </span>
                            <button type="button" onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                              style={{ background: 'transparent', color: '#DC2626', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700, padding: '0 4px' }}
                              title="Bijlage verwijderen">×</button>
                          </div>
                        )}
                        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              if (f.size > 16 * 1024 * 1024) {
                                setSendError('Bestand te groot (max 16 MB)');
                                if (fileInputRef.current) fileInputRef.current.value = '';
                                return;
                              }
                              setAttachedFile(f);
                              setSendError(null);
                            }}
                            style={{ display: 'none' }}
                          />
                          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending}
                            title="Bijlage toevoegen (foto, video, document)"
                            style={{ background: attachedFile ? '#DBEAFE' : '#F0F4FA', color: NAVY, border: '1px solid #C7D2E0', borderRadius: 6, padding: '0 12px', fontSize: 18, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', lineHeight: 1 }}>
                            +
                          </button>
                          <textarea
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            onKeyDown={e => {
                              // Enter zonder Shift = verzenden (zoals bij andere chat-clients).
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e as unknown as React.FormEvent);
                              }
                            }}
                            placeholder={attachedFile ? 'Optioneel: bijschrift bij bijlage...' : (within24h ? 'Typ een antwoord...' : 'Typ een antwoord (24u-venster mogelijk verlopen)...')}
                            disabled={sending}
                            rows={2}
                            style={{ flex: 1, padding: '12px 14px', fontSize: 13, border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none', fontFamily: FONT, background: '#fff', resize: 'vertical', minHeight: 60, lineHeight: 1.4 }}
                          />
                          <button type="button" onClick={requestAiSuggestion} disabled={aiLoading || messages.length === 0}
                            title="AI suggestie opvragen"
                            style={{ background: aiLoading ? '#E5E7EB' : '#F0F4FA', color: aiLoading ? '#9CA3AF' : NAVY, border: '1px solid #C7D2E0', borderRadius: 6, padding: '0 10px', cursor: aiLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center' }}>
                            {aiLoading ? <Hourglass size={14} /> : <Sparkles size={14} />}
                          </button>
                          <button type="submit" disabled={sending || (!reply.trim() && !attachedFile)}
                            style={{ background: (sending || (!reply.trim() && !attachedFile)) ? '#E5E7EB' : NAVY, color: (sending || (!reply.trim() && !attachedFile)) ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '0 18px', fontSize: 13, fontWeight: 600, cursor: (sending || (!reply.trim() && !attachedFile)) ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                            {sending ? '...' : 'Stuur'}
                          </button>
                        </form>
                      </div>
                    </>
                  )}

                  {threadView === 'notes' && (
                    <>
                      <div style={{ flex: 1, overflowY: 'auto', padding: '18px', background: '#FFFBEB' }}>
                        {notes.length === 0 && (
                          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: 40 }}>Nog geen interne notities voor dit gesprek</div>
                        )}
                        {[...notes].reverse().map(n => (
                          <div key={n.id} style={{
                            marginBottom: 12, padding: '10px 14px',
                            background: '#fff', border: '1px solid #FDE68A', borderRadius: 8,
                            borderLeft: '3px solid #F59E0B',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>{n.authorName}</span>
                              <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                                {new Date(n.createdAt).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.body}</div>
                          </div>
                        ))}
                        <div ref={notesEndRef} />
                      </div>

                      <div style={{ padding: '12px 18px', borderTop: '1px solid #FDE68A', background: '#FFFBEB' }}>
                        <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                            placeholder="Schrijf een interne notitie..."
                            disabled={noteSaving}
                            style={{ flex: 1, padding: '10px 14px', fontSize: 13, border: '1px solid #FDE68A', borderRadius: 6, outline: 'none', fontFamily: FONT, background: '#fff' }}
                          />
                          <button type="submit" disabled={noteSaving || !newNote.trim()}
                            style={{ background: (noteSaving || !newNote.trim()) ? '#E5E7EB' : '#F59E0B', color: (noteSaving || !newNote.trim()) ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: (noteSaving || !newNote.trim()) ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                            {noteSaving ? '...' : 'Notitie'}
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ════════ GROEPEN VIEW ════════ */}
        {mainView === 'groepen' && (
          <>
            {/* Linkerkolom: groepenlijst */}
            <div style={{
              width: 300, display: 'flex', flexDirection: 'column',
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #E5E7EB', background: '#FAFBFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Groepen</div>
                <button
                  onClick={() => { setShowNewGroup(true); setNewGroupName(''); setNewGroupDesc(''); }}
                  style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
                >
                  + Nieuwe groep
                </button>
              </div>

              {showNewGroup && (
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                  <form onSubmit={handleCreateGroup}>
                    <input
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      placeholder="Groepsnaam (bijv. Horeca Amsterdam)"
                      autoFocus
                      required
                      style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT, boxSizing: 'border-box', marginBottom: 6 }}
                    />
                    <input
                      value={newGroupDesc}
                      onChange={e => setNewGroupDesc(e.target.value)}
                      placeholder="Beschrijving (optioneel)"
                      style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT, boxSizing: 'border-box', marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="submit" disabled={creatingGroup || !newGroupName.trim()}
                        style={{ background: creatingGroup || !newGroupName.trim() ? '#E5E7EB' : NAVY, color: creatingGroup || !newGroupName.trim() ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                        {creatingGroup ? 'Aanmaken...' : 'Aanmaken'}
                      </button>
                      <button type="button" onClick={() => setShowNewGroup(false)}
                        style={{ background: '#fff', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontFamily: FONT }}>
                        Annuleren
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {groups.length === 0 && !showNewGroup && (
                  <div style={{ padding: 30, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
                    Nog geen groepen aangemaakt
                  </div>
                )}
                {groups.map(g => {
                  const selected = g.id === selectedGroupId;
                  return (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      style={{
                        padding: '12px 14px',
                        background: selected ? '#F0F4FA' : '#fff',
                        borderLeft: selected ? `3px solid ${NAVY}` : '3px solid transparent',
                        borderBottom: '1px solid #F3F4F6',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{g.name}</div>
                      {g.description && (
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.description}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
                        {g.memberCount} {g.memberCount === 1 ? 'lid' : 'leden'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: '10px 14px', borderTop: '1px solid #E5E7EB', background: '#FAFBFC' }}>
                <button
                  onClick={openBulkHistory}
                  style={{ width: '100%', background: 'none', border: '1px solid #D1D5DB', borderRadius: 6, padding: '6px', fontSize: 11, color: '#6B7280', cursor: 'pointer', fontFamily: FONT }}
                >
                  Verzendgeschiedenis
                </button>
              </div>
            </div>

            {/* Rechterkolom: groepdetails */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden',
              minWidth: 0,
            }}>
              {/* Bulk history overlay */}
              {showBulkHistory && (
                <>
                  <div style={{ padding: '12px 18px', borderBottom: '1px solid #E5E7EB', background: '#FAFBFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>Verzendgeschiedenis</div>
                    <button onClick={() => setShowBulkHistory(false)}
                      style={{ background: 'none', border: 'none', fontSize: 16, color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={16} /></button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
                    {bulkHistory.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: 40 }}>Nog geen bulkverzendingen gedaan</div>
                    )}
                    {bulkHistory.map(b => (
                      <div key={b.id} style={{
                        padding: '12px 16px', marginBottom: 10, background: '#F9FAFB',
                        border: '1px solid #E5E7EB', borderRadius: 8,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{b.groupName}</span>
                          <span style={{ fontSize: 10, color: '#94A3B8' }}>
                            {new Date(b.createdAt).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#374151', marginBottom: 6, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                          {b.messageBody.length > 120 ? b.messageBody.slice(0, 120) + '...' : b.messageBody}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                          <span style={{ color: '#059669' }}>{b.sentCount} verzonden</span>
                          {b.failedCount > 0 && <span style={{ color: '#DC2626' }}>{b.failedCount} mislukt</span>}
                          <span style={{ color: '#94A3B8' }}>van {b.totalRecipients} ontvangers</span>
                          {b.sentByName && <span style={{ color: '#6B7280' }}>door {b.sentByName}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!showBulkHistory && !selectedGroup && (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#9CA3AF', fontSize: 13,
                }}>
                  Selecteer een groep links of maak een nieuwe aan
                </div>
              )}

              {!showBulkHistory && selectedGroup && (
                <>
                  {/* Groep header */}
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E7EB', background: '#FAFBFC' }}>
                    {editingGroup ? (
                      <form onSubmit={handleUpdateGroup} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input value={editGroupName} onChange={e => setEditGroupName(e.target.value)} placeholder="Groepsnaam" required
                          style={{ flex: 1, padding: '6px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT }} />
                        <input value={editGroupDesc} onChange={e => setEditGroupDesc(e.target.value)} placeholder="Beschrijving"
                          style={{ flex: 1, padding: '6px 10px', fontSize: 13, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT }} />
                        <button type="submit" style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Opslaan</button>
                        <button type="button" onClick={() => setEditingGroup(false)} style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: 6, padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontFamily: FONT, color: '#6B7280' }}>Annuleren</button>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>{selectedGroup.name}</div>
                          {selectedGroup.description && (
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{selectedGroup.description}</div>
                          )}
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
                            {groupMembers.length} {groupMembers.length === 1 ? 'lid' : 'leden'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => { setEditingGroup(true); setEditGroupName(selectedGroup.name); setEditGroupDesc(selectedGroup.description || ''); }}
                            style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: '#6B7280', cursor: 'pointer', fontFamily: FONT }}
                          >
                            Bewerken
                          </button>
                          <button
                            onClick={handleDeleteGroup}
                            style={{ background: 'none', border: '1px solid #FECACA', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: '#DC2626', cursor: 'pointer', fontFamily: FONT }}
                          >
                            Verwijderen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Twee secties: leden + bulk bericht */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {/* Leden sectie */}
                    <div style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <div style={{ padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>Leden</div>
                        <button onClick={openAddMembers}
                          style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                          + Leden toevoegen
                        </button>
                      </div>

                      {/* Leden importeren overlay */}
                        {showAddMembers && (
                          <div style={{ padding: '14px 18px', background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Leden toevoegen</div>
                                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>Kies waar je contacten vandaan wilt halen</div>
                              </div>
                              <button onClick={() => setShowAddMembers(false)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }} title="Sluiten"><X size={16} /></button>
                            </div>

                            {/* Tab-strip in twee groepen: "Uit database" en "Zelf invoeren" */}
                            <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                              {([
                                { group: 'database', label: 'Uit database', tabs: [
                                  { key: 'medewerkers' as ImportTab, label: 'Medewerkers', icon: Briefcase, count: importEmployees.length },
                                  { key: 'kandidaten' as ImportTab, label: 'Kandidaten', icon: UserPlus, count: importCandidates.length },
                                  { key: 'klanten' as ImportTab, label: 'Klanten', icon: Building2, count: importProspects.length },
                                  { key: 'whatsapp' as ImportTab, label: 'WhatsApp', icon: MessageCircle, count: availableContacts.length },
                                ]},
                                { group: 'invoer', label: 'Zelf invoeren', tabs: [
                                  { key: 'csv' as ImportTab, label: 'CSV', icon: Upload, count: 0 },
                                  { key: 'handmatig' as ImportTab, label: 'Handmatig', icon: Plus, count: 0 },
                                ]},
                              ]).map(grp => (
                                <div key={grp.group} style={{ flex: grp.group === 'database' ? '1 1 320px' : '0 0 auto' }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, paddingLeft: 2 }}>{grp.label}</div>
                                  <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 3 }}>
                                    {grp.tabs.map(t => {
                                      const Icon = t.icon;
                                      const active = importTab === t.key;
                                      return (
                                        <button
                                          key={t.key}
                                          onClick={() => loadImportTab(t.key)}
                                          title={t.label}
                                          style={{
                                            flex: 1, minWidth: 64, padding: '8px 10px', fontSize: 11,
                                            fontWeight: active ? 700 : 500,
                                            background: active ? NAVY : 'transparent',
                                            color: active ? '#fff' : '#475569',
                                            border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: FONT,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                            transition: 'all 0.12s',
                                          }}
                                        >
                                          <Icon size={13} />
                                          <span>{t.label}</span>
                                          {t.count > 0 && (
                                            <span style={{
                                              background: active ? 'rgba(255,255,255,0.22)' : '#F1F5F9',
                                              color: active ? '#fff' : '#64748B',
                                              fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
                                            }}>{t.count}</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {(importTab === 'whatsapp' || importTab === 'medewerkers' || importTab === 'kandidaten' || importTab === 'klanten') && (
                              <input
                                value={contactSearch}
                                onChange={e => setContactSearch(e.target.value)}
                                placeholder="Zoek op naam of nummer..."
                                style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT, boxSizing: 'border-box', marginBottom: 6 }}
                              />
                            )}

                            {importTab === 'kandidaten' && (
                              <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                                <select value={importFilterFunc} onChange={e => setImportFilterFunc(e.target.value)}
                                  style={{ padding: '4px 8px', fontSize: 10, border: '1px solid #D1D5DB', borderRadius: 5, fontFamily: FONT, color: '#374151', background: '#fff' }}>
                                  <option value="all">Alle functies</option>
                                  <option value="housekeeping">Housekeeping</option>
                                  <option value="horecamedewerker">Horecamedewerker</option>
                                  <option value="chef">Chef</option>
                                  <option value="frontoffice">Front Office</option>
                                  <option value="logistiek">Logistiek</option>
                                </select>
                                <select value={importFilterStatus} onChange={e => setImportFilterStatus(e.target.value)}
                                  style={{ padding: '4px 8px', fontSize: 10, border: '1px solid #D1D5DB', borderRadius: 5, fontFamily: FONT, color: '#374151', background: '#fff' }}>
                                  <option value="all">Alle statussen</option>
                                  <option value="in_behandeling">In behandeling</option>
                                  <option value="gepland">Gepland</option>
                                  <option value="aangenomen">Aangenomen</option>
                                  <option value="afgewezen">Afgewezen</option>
                                </select>
                              </div>
                            )}

                            {importTab === 'klanten' && (
                              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                                <select value={importFilterBranche} onChange={e => setImportFilterBranche(e.target.value)}
                                  style={{ padding: '4px 8px', fontSize: 10, border: '1px solid #D1D5DB', borderRadius: 5, fontFamily: FONT, color: '#374151', background: '#fff' }}>
                                  <option value="all">Alle branches</option>
                                  {Array.from(new Set(importProspects.map(p => p.branche).filter(Boolean))).sort().map(b => (
                                    <option key={b!} value={b!}>{b}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {importLoading && (
                              <div style={{ padding: 20, textAlign: 'center', color: '#6B7280', fontSize: 12 }}>Laden...</div>
                            )}

                            {importTab === 'whatsapp' && !importLoading && (
                              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}>
                                {filteredAvailable.length === 0 && (
                                  <div style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 11 }}>
                                    {contactSearch ? 'Geen contacten gevonden' : 'Alle contacten zijn al lid'}
                                  </div>
                                )}
                                {filteredAvailable.map(c => {
                                  const checked = selectedContacts.has(c.phoneNumber);
                                  return (
                                    <div key={c.phoneNumber} onClick={() => toggleContactSelection(c.phoneNumber)}
                                      style={{ padding: '8px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: checked ? '#EEF2FF' : '#fff' }}>
                                      <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${checked ? NAVY : '#D1D5DB'}`, background: checked ? NAVY : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>\u2713</span>}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: c.displayName ? '#1F2937' : '#9CA3AF' }}>{c.displayName || 'Onbekend'}</div>
                                        <div style={{ fontSize: 10, color: '#6B7280' }}>
                                          +{c.phoneNumber}
                                          {c.contactCompany ? ` \u00B7 ${c.contactCompany}` : ''}
                                          <span style={{ marginLeft: 4, fontSize: 9, color: '#94A3B8' }}>
                                            {c.matchCategory === 'candidate' ? 'Medewerker' : c.matchCategory === 'prospect' ? 'Klant' : 'Kandidaat'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {importTab === 'medewerkers' && !importLoading && (() => {
                              const q = contactSearch.toLowerCase();
                              const filtered = importEmployees.filter(c => {
                                if (c.alreadyInGroup) return false;
                                if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(contactSearch) && !(c.opdrachtgever || '').toLowerCase().includes(q)) return false;
                                return true;
                              });
                              const empStatusColors: Record<string, string> = { nieuw: '#3B82F6', actief: '#10B981', inactief: '#94A3B8', uit_dienst: '#9CA3AF' };
                              return (
                                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}>
                                  {filtered.length === 0 && (
                                    <div style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 11 }}>
                                      {importEmployees.length === 0 ? 'Geen medewerkers met telefoonnummer' : 'Geen match met deze zoekterm'}
                                    </div>
                                  )}
                                  {filtered.map(c => {
                                    const checked = selectedContacts.has(c.phone);
                                    return (
                                      <div key={c.id} onClick={() => toggleContactSelection(c.phone)}
                                        style={{ padding: '8px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: checked ? '#EEF2FF' : '#fff' }}>
                                        <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${checked ? NAVY : '#D1D5DB'}`, background: checked ? NAVY : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                          {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{'\u2713'}</span>}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{c.name}</div>
                                          <div style={{ fontSize: 10, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                            <span>+{c.phone}</span>
                                            {c.functie && <span style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, fontSize: 9 }}>{c.functie}</span>}
                                            <span style={{ color: empStatusColors[c.status] || '#6B7280', fontWeight: 600, fontSize: 9 }}>{c.status}</span>
                                            {c.opdrachtgever && <span style={{ color: '#374151', fontSize: 9 }}>{c.opdrachtgever}</span>}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}

                            {importTab === 'kandidaten' && !importLoading && (() => {
                              const q = contactSearch.toLowerCase();
                              const filtered = importCandidates.filter(c => {
                                if (c.alreadyInGroup) return false;
                                if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(contactSearch)) return false;
                                if (importFilterFunc !== 'all' && c.functionType !== importFilterFunc) return false;
                                if (importFilterStatus !== 'all' && c.status !== importFilterStatus) return false;
                                return true;
                              });
                              const funcLabels: Record<string, string> = { housekeeping: 'HK', horecamedewerker: 'Horeca', chef: 'Chef', frontoffice: 'FO', logistiek: 'Log' };
                              const statusColors: Record<string, string> = { in_behandeling: '#F59E0B', gepland: '#3B82F6', aangenomen: '#10B981', afgewezen: '#EF4444' };
                              return (
                                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}>
                                  {filtered.length === 0 && (
                                    <div style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 11 }}>
                                      {importCandidates.length === 0 ? 'Geen kandidaten met telefoonnummer' : 'Geen match met deze filters'}
                                    </div>
                                  )}
                                  {filtered.map(c => {
                                    const checked = selectedContacts.has(c.phone);
                                    return (
                                      <div key={c.id} onClick={() => toggleContactSelection(c.phone)}
                                        style={{ padding: '8px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: checked ? '#EEF2FF' : '#fff' }}>
                                        <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${checked ? NAVY : '#D1D5DB'}`, background: checked ? NAVY : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                          {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>\u2713</span>}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{c.name}</div>
                                          <div style={{ fontSize: 10, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                            <span>+{c.phone}</span>
                                            <span style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 600 }}>{funcLabels[c.functionType] || c.functionType}</span>
                                            <span style={{ color: statusColors[c.status] || '#6B7280', fontSize: 9, fontWeight: 600 }}>{c.status.replace('_', ' ')}</span>
                                            {c.city && <span style={{ color: '#94A3B8', fontSize: 9 }}>{c.city}</span>}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}

                            {importTab === 'klanten' && !importLoading && (() => {
                              const q = contactSearch.toLowerCase();
                              const filtered = importProspects.filter(c => {
                                if (c.alreadyInGroup) return false;
                                if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(contactSearch) && !(c.company || '').toLowerCase().includes(q)) return false;
                                if (importFilterBranche !== 'all' && c.branche !== importFilterBranche) return false;
                                return true;
                              });
                              return (
                                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}>
                                  {filtered.length === 0 && (
                                    <div style={{ padding: 16, textAlign: 'center', color: '#9CA3AF', fontSize: 11 }}>
                                      {importProspects.length === 0 ? 'Geen klanten met telefoonnummer' : 'Geen match met deze filters'}
                                    </div>
                                  )}
                                  {filtered.map(c => {
                                    const checked = selectedContacts.has(c.phone);
                                    return (
                                      <div key={c.id} onClick={() => toggleContactSelection(c.phone)}
                                        style={{ padding: '8px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: checked ? '#EEF2FF' : '#fff' }}>
                                        <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${checked ? NAVY : '#D1D5DB'}`, background: checked ? NAVY : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                          {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>\u2713</span>}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{c.name}</div>
                                          <div style={{ fontSize: 10, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                            <span>+{c.phone}</span>
                                            {c.company && <span style={{ color: '#374151', fontWeight: 600, fontSize: 9 }}>{c.company}</span>}
                                            {c.branche && <span style={{ background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, fontSize: 9 }}>{c.branche}</span>}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}

                            {importTab === 'csv' && (
                              <div>
                                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6 }}>
                                  Plak CSV-data: <strong>naam;telefoonnummer</strong> of alleen <strong>telefoonnummer</strong> per regel. Nederlandse 06-nummers worden automatisch omgezet naar +31.
                                </div>
                                <textarea
                                  value={csvText}
                                  onChange={e => { setCsvText(e.target.value); setCsvParsed([]); setCsvErrors([]); }}
                                  placeholder={"Jan de Vries;0612345678\nPiet Jansen;+31687654321\nof alleen nummers:\n0698765432"}
                                  rows={5}
                                  style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical', marginBottom: 6 }}
                                />
                                <button onClick={handleParseCsv} disabled={csvParsing || !csvText.trim()}
                                  style={{ background: csvParsing || !csvText.trim() ? '#E5E7EB' : NAVY, color: csvParsing || !csvText.trim() ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, marginBottom: 8 }}>
                                  {csvParsing ? 'Verwerken...' : 'Verwerk CSV'}
                                </button>
                                {csvErrors.length > 0 && (
                                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '6px 10px', marginBottom: 6, fontSize: 10, color: '#DC2626' }}>
                                    {csvErrors.map((e, i) => <div key={i}>{e}</div>)}
                                  </div>
                                )}
                                {csvParsed.length > 0 && (
                                  <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}>
                                    {csvParsed.map((c, i) => {
                                      const checked = selectedContacts.has(c.phone);
                                      return (
                                        <div key={i} onClick={() => !c.alreadyInGroup && toggleContactSelection(c.phone)}
                                          style={{ padding: '8px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8, cursor: c.alreadyInGroup ? 'default' : 'pointer', background: c.alreadyInGroup ? '#F9FAFB' : checked ? '#EEF2FF' : '#fff', opacity: c.alreadyInGroup ? 0.5 : 1 }}>
                                          <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${c.alreadyInGroup ? '#E5E7EB' : checked ? NAVY : '#D1D5DB'}`, background: c.alreadyInGroup ? '#E5E7EB' : checked ? NAVY : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {(checked || c.alreadyInGroup) && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>\u2713</span>}
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>{c.name || '(geen naam)'}</div>
                                            <div style={{ fontSize: 10, color: '#6B7280' }}>
                                              +{c.phone}
                                              {c.alreadyInGroup && <span style={{ marginLeft: 6, color: '#94A3B8', fontSize: 9 }}>al in groep</span>}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {importTab === 'handmatig' && (
                              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                                <div style={{ fontSize: 11, color: '#475569', marginBottom: 12, lineHeight: 1.5 }}>
                                  Voor- en achternaam apart invullen — die kun je dan in groepsberichten gebruiken als <code style={{ background: '#F1F5F9', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>{'{{voornaam}}'}</code> en <code style={{ background: '#F1F5F9', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>{'{{achternaam}}'}</code>.
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                  <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 }}>Voornaam</label>
                                    <input
                                      value={manualFirstName}
                                      onChange={e => setManualFirstName(e.target.value)}
                                      placeholder="Bijv. Jan"
                                      style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT, boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 }}>Achternaam</label>
                                    <input
                                      value={manualLastName}
                                      onChange={e => setManualLastName(e.target.value)}
                                      placeholder="Bijv. de Vries"
                                      style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT, boxSizing: 'border-box' }}
                                    />
                                  </div>
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                  <label style={{ fontSize: 10, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 }}>Telefoonnummer <span style={{ color: '#DC2626' }}>*</span></label>
                                  <input
                                    value={manualPhone}
                                    onChange={e => setManualPhone(e.target.value)}
                                    placeholder="0612345678 of +31612345678"
                                    style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT, boxSizing: 'border-box' }}
                                  />
                                </div>
                                <button onClick={handleAddManual} disabled={addingMembers || !manualPhone.trim()}
                                  style={{ width: '100%', background: addingMembers || !manualPhone.trim() ? '#E5E7EB' : NAVY, color: addingMembers || !manualPhone.trim() ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '9px 14px', fontSize: 12, fontWeight: 600, cursor: addingMembers || !manualPhone.trim() ? 'not-allowed' : 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                  <Plus size={14} /> {addingMembers ? 'Bezig met toevoegen...' : 'Toevoegen aan groep'}
                                </button>
                              </div>
                            )}

                            {importTab !== 'handmatig' && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <span style={{ fontSize: 11, color: '#6B7280' }}>{selectedContacts.size} geselecteerd</span>
                                  {selectedContacts.size > 0 && (
                                    <button onClick={() => setSelectedContacts(new Set())} style={{ background: 'none', border: 'none', fontSize: 10, color: '#DC2626', cursor: 'pointer', textDecoration: 'underline', fontFamily: FONT }}>wissen</button>
                                  )}
                                  {importTab === 'medewerkers' && (() => {
                                    const q = contactSearch.toLowerCase();
                                    const avail = importEmployees.filter(c => {
                                      if (c.alreadyInGroup) return false;
                                      if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(contactSearch) && !(c.opdrachtgever || '').toLowerCase().includes(q)) return false;
                                      return true;
                                    });
                                    return avail.length > 0 ? (
                                      <button onClick={() => setSelectedContacts(new Set(avail.map(c => c.phone)))}
                                        style={{ background: 'none', border: 'none', fontSize: 10, color: NAVY, cursor: 'pointer', textDecoration: 'underline', fontFamily: FONT }}>
                                        selecteer alles ({avail.length})
                                      </button>
                                    ) : null;
                                  })()}
                                  {importTab === 'kandidaten' && (() => {
                                    const q = contactSearch.toLowerCase();
                                    const avail = importCandidates.filter(c => {
                                      if (c.alreadyInGroup) return false;
                                      if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(contactSearch)) return false;
                                      if (importFilterFunc !== 'all' && c.functionType !== importFilterFunc) return false;
                                      if (importFilterStatus !== 'all' && c.status !== importFilterStatus) return false;
                                      return true;
                                    });
                                    return avail.length > 0 ? (
                                      <button onClick={() => setSelectedContacts(new Set(avail.map(c => c.phone)))}
                                        style={{ background: 'none', border: 'none', fontSize: 10, color: NAVY, cursor: 'pointer', textDecoration: 'underline', fontFamily: FONT }}>
                                        selecteer alles ({avail.length})
                                      </button>
                                    ) : null;
                                  })()}
                                  {importTab === 'klanten' && (() => {
                                    const q = contactSearch.toLowerCase();
                                    const avail = importProspects.filter(c => {
                                      if (c.alreadyInGroup) return false;
                                      if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(contactSearch) && !(c.company || '').toLowerCase().includes(q)) return false;
                                      if (importFilterBranche !== 'all' && c.branche !== importFilterBranche) return false;
                                      return true;
                                    });
                                    return avail.length > 0 ? (
                                      <button onClick={() => setSelectedContacts(new Set(avail.map(c => c.phone)))}
                                        style={{ background: 'none', border: 'none', fontSize: 10, color: NAVY, cursor: 'pointer', textDecoration: 'underline', fontFamily: FONT }}>
                                        selecteer alles ({avail.length})
                                      </button>
                                    ) : null;
                                  })()}
                                </div>
                                <button onClick={handleAddSelectedMembers} disabled={addingMembers || selectedContacts.size === 0}
                                  style={{ background: addingMembers || selectedContacts.size === 0 ? '#E5E7EB' : NAVY, color: addingMembers || selectedContacts.size === 0 ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                                  {addingMembers ? 'Toevoegen...' : `Toevoegen (${selectedContacts.size})`}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Ledenlijst */}
                      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {groupMembers.length === 0 && (
                          <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
                            Nog geen leden — klik op "+ Leden toevoegen" om te beginnen
                          </div>
                        )}
                        {groupMembers.map(m => {
                          const initials = (m.displayName || '?').trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '?';
                          return (
                          <div key={m.id} style={{
                            padding: '10px 18px', borderBottom: '1px solid #F3F4F6',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: m.displayName ? '#E0E7FF' : '#F1F5F9',
                                color: m.displayName ? NAVY : '#94A3B8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700, flexShrink: 0,
                              }}>{initials}</div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: m.displayName ? '#1F2937' : '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {m.displayName || 'Naam onbekend'}
                                </div>
                                <div style={{ fontSize: 10, color: '#6B7280' }}>+{m.phoneNumber}</div>
                              </div>
                            </div>
                            <button onClick={() => handleRemoveMember(m.phoneNumber)}
                              style={{ background: 'none', border: '1px solid transparent', borderRadius: 6, color: '#9CA3AF', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = 'transparent'; }}
                              title="Lid verwijderen">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bulk bericht sectie */}
                    <div style={{ padding: '16px 18px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>Bericht sturen naar hele groep</div>
                        <button onClick={requestBulkAiSuggestion} disabled={bulkAiLoading}
                          title="AI suggestie voor groepsbericht"
                          style={{ background: bulkAiLoading ? '#E5E7EB' : '#F0F4FA', color: bulkAiLoading ? '#9CA3AF' : NAVY, border: '1px solid #C7D2E0', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: bulkAiLoading ? 'wait' : 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {bulkAiLoading ? <Hourglass size={12} /> : <Sparkles size={12} />} AI suggestie
                        </button>
                      </div>
                      <div style={{
                        padding: '8px 12px', background: '#FFF7ED', border: '1px solid #FED7AA',
                        borderRadius: 6, fontSize: 11, color: '#9A3412', marginBottom: 10,
                      }}>
                        Elk lid ontvangt dit als individueel 1-op-1 bericht. Let op: berichten buiten het 24u-venster kunnen door WhatsApp geweigerd worden.
                      </div>

                      <textarea
                        value={bulkText}
                        onChange={e => setBulkText(e.target.value)}
                        placeholder="Typ hier je bericht voor de hele groep — gebruik {{voornaam}} voor personalisatie..."
                        rows={4}
                        disabled={bulkSending}
                        style={{
                          width: '100%', padding: '10px 14px', fontSize: 13, border: '1px solid #E5E7EB',
                          borderRadius: 6, outline: 'none', fontFamily: FONT, resize: 'vertical',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                        <span>Variabelen:</span>
                        {(['{{voornaam}}', '{{achternaam}}', '{{naam}}'] as const).map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setBulkText(t => (t || '') + (t && !t.endsWith(' ') ? ' ' : '') + v)}
                            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 4, padding: '1px 6px', fontSize: 10, color: NAVY, cursor: 'pointer', fontFamily: 'monospace' }}
                            title="Klik om in te voegen"
                          >{v}</button>
                        ))}
                      </div>

                      {!confirmBulkSend ? (
                        <button
                          onClick={() => setConfirmBulkSend(true)}
                          disabled={!bulkText.trim() || groupMembers.length === 0 || bulkSending}
                          style={{
                            marginTop: 8, width: '100%',
                            background: (!bulkText.trim() || groupMembers.length === 0 || bulkSending) ? '#E5E7EB' : NAVY,
                            color: (!bulkText.trim() || groupMembers.length === 0 || bulkSending) ? '#9CA3AF' : '#fff',
                            border: 'none', borderRadius: 6, padding: '10px', fontSize: 13, fontWeight: 600,
                            cursor: (!bulkText.trim() || groupMembers.length === 0) ? 'not-allowed' : 'pointer',
                            fontFamily: FONT,
                          }}
                        >
                          Stuur naar {groupMembers.length} {groupMembers.length === 1 ? 'lid' : 'leden'}
                        </button>
                      ) : (
                        <div style={{
                          marginTop: 8, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA',
                          borderRadius: 8,
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#991B1B', marginBottom: 6 }}>
                            Bevestig verzending
                          </div>
                          <div style={{ fontSize: 11, color: '#7F1D1D', marginBottom: 10 }}>
                            Je staat op het punt om dit bericht naar <strong>{groupMembers.length}</strong> personen te sturen. Dit kan niet ongedaan gemaakt worden.
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handleBulkSend} disabled={bulkSending}
                              style={{ background: bulkSending ? '#E5E7EB' : '#DC2626', color: bulkSending ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: bulkSending ? 'wait' : 'pointer', fontFamily: FONT }}>
                              {bulkSending ? 'Bezig met verzenden...' : `Ja, verstuur naar ${groupMembers.length} personen`}
                            </button>
                            <button onClick={() => setConfirmBulkSend(false)} disabled={bulkSending}
                              style={{ background: '#fff', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: 6, padding: '8px 16px', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>
                              Annuleren
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Resultaat van bulk verzending */}
                      {bulkResult && (
                        <div style={{
                          marginTop: 12, padding: '12px 16px', borderRadius: 8,
                          background: bulkResult.failed === 0 ? '#F0FDF4' : '#FFF7ED',
                          border: `1px solid ${bulkResult.failed === 0 ? '#BBF7D0' : '#FED7AA'}`,
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: bulkResult.failed === 0 ? '#059669' : '#9A3412', marginBottom: 6 }}>
                            {bulkResult.failed === 0
                              ? `Alle ${bulkResult.sent} berichten verzonden`
                              : `${bulkResult.sent} verzonden, ${bulkResult.failed} mislukt`}
                          </div>
                          {bulkResult.results.filter(r => r.status === 'failed').length > 0 && (
                            <div style={{ fontSize: 11, color: '#9A3412' }}>
                              <div style={{ fontWeight: 600, marginBottom: 4 }}>Mislukte verzendingen:</div>
                              {bulkResult.results.filter(r => r.status === 'failed').map((r, i) => (
                                <div key={i} style={{ marginBottom: 2 }}>
                                  {r.displayName || r.phone}: {r.error || 'Onbekende fout'}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'nu';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}u`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' });
}
