import { useState, useEffect, useRef, useMemo } from 'react';
import {
  haalGesprekken,
  haalBerichten,
  stuurBericht,
  markeerGelezen,
  haalStats,
  haalWebhookStatus,
  registreerWebhook,
  updateContactInfo,
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
  haalImportKandidaten,
  haalImportKlanten,
  parseCsv,
  haalAiSettings,
  updateAiSettings,
  vraagAiSuggestie,
  haalAiKnowledge,
  maakAiKnowledge,
  updateAiKnowledge,
  verwijderAiKnowledge,
  type AiKnowledgeEntry,
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
  type AiSettings,
} from '../../api/whatsappClient';

const NAVY = '#1F3A5F';
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
  const [showSettings, setShowSettings] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
  const [webhookBusy, setWebhookBusy] = useState(false);
  const [webhookMsg, setWebhookMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [editingContact, setEditingContact] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);
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
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [aiSettingsLoading, setAiSettingsLoading] = useState(false);
  const [aiSettingsSaving, setAiSettingsSaving] = useState(false);
  const [aiSettingsMsg, setAiSettingsMsg] = useState<string | null>(null);
  const [bulkAiLoading, setBulkAiLoading] = useState(false);
  const [aiKnowledge, setAiKnowledge] = useState<AiKnowledgeEntry[]>([]);
  const [aiKnowledgeLoading, setAiKnowledgeLoading] = useState(false);
  const [newKnowledgeTitle, setNewKnowledgeTitle] = useState('');
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('');
  const [knowledgeSavingId, setKnowledgeSavingId] = useState<number | 'new' | null>(null);

  type ImportTab = 'whatsapp' | 'kandidaten' | 'klanten' | 'csv' | 'handmatig';
  const [importTab, setImportTab] = useState<ImportTab>('whatsapp');
  const [importCandidates, setImportCandidates] = useState<ImportCandidate[]>([]);
  const [importProspects, setImportProspects] = useState<ImportProspect[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvParsed, setCsvParsed] = useState<Array<{ name: string; phone: string; alreadyInGroup: boolean }>>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvParsing, setCsvParsing] = useState(false);
  const [manualName, setManualName] = useState('');
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
    vraagAiSuggestie(messages, conv?.displayName, conv?.contactCompany, 'individual')
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

  const filteredConversations = useMemo(() => {
    let list = conversations;
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
    return list;
  }, [conversations, search, filterUnread, filterAssignee, filterLabel]);

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
    if (!reply.trim() || !selectedPhone) return;
    setSending(true);
    setSendError(null);
    try {
      await stuurBericht(selectedPhone, reply);
      setReply('');
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
      const r = await vraagAiSuggestie(messages, conv?.displayName, conv?.contactCompany, 'individual');
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

  async function loadAiSettings() {
    setAiSettingsLoading(true);
    setAiKnowledgeLoading(true);
    try {
      const [s, k] = await Promise.all([haalAiSettings(), haalAiKnowledge()]);
      setAiSettings(s);
      setAiKnowledge(k);
    } catch { /* ignore */ }
    finally { setAiSettingsLoading(false); setAiKnowledgeLoading(false); }
  }

  async function saveAiSettings() {
    if (!aiSettings) return;
    setAiSettingsSaving(true);
    setAiSettingsMsg(null);
    try {
      const updated = await updateAiSettings({
        toneOfVoice: aiSettings.toneOfVoice,
        guidelines: aiSettings.guidelines,
        cancellationProtocol: aiSettings.cancellationProtocol,
        extraContext: aiSettings.extraContext,
        autoReplyEnabled: aiSettings.autoReplyEnabled,
        autoReplyOnlyForKnown: aiSettings.autoReplyOnlyForKnown,
        autoReplyMinIntervalSec: aiSettings.autoReplyMinIntervalSec,
      });
      setAiSettings(updated);
      setAiSettingsMsg('Opgeslagen!');
      setTimeout(() => setAiSettingsMsg(null), 2000);
    } catch (e: any) {
      setAiSettingsMsg(e.message || 'Opslaan mislukt');
    } finally {
      setAiSettingsSaving(false);
    }
  }

  async function addKnowledgeEntry() {
    if (!newKnowledgeTitle.trim() || !newKnowledgeContent.trim()) return;
    setKnowledgeSavingId('new');
    try {
      const created = await maakAiKnowledge({ title: newKnowledgeTitle.trim(), content: newKnowledgeContent.trim() });
      setAiKnowledge(prev => [...prev, created]);
      setNewKnowledgeTitle('');
      setNewKnowledgeContent('');
    } catch (e: any) {
      alert(e.message || 'Toevoegen mislukt');
    } finally {
      setKnowledgeSavingId(null);
    }
  }

  async function saveKnowledgeEntry(entry: AiKnowledgeEntry) {
    setKnowledgeSavingId(entry.id);
    try {
      const updated = await updateAiKnowledge(entry.id, {
        title: entry.title,
        content: entry.content,
        enabled: entry.enabled,
      });
      setAiKnowledge(prev => prev.map(k => k.id === entry.id ? updated : k));
    } catch (e: any) {
      alert(e.message || 'Opslaan mislukt');
    } finally {
      setKnowledgeSavingId(null);
    }
  }

  async function removeKnowledgeEntry(id: number) {
    if (!window.confirm('Weet je zeker dat je dit protocol wilt verwijderen?')) return;
    try {
      await verwijderAiKnowledge(id);
      setAiKnowledge(prev => prev.filter(k => k.id !== id));
    } catch (e: any) {
      alert(e.message || 'Verwijderen mislukt');
    }
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
    setEditName(selectedConv.displayName || '');
    setEditCompany(selectedConv.contactCompany || '');
    setEditNotes(selectedConv.contactNotes || '');
    setEditingContact(true);
  }

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPhone || !editName.trim()) return;
    setEditSaving(true);
    try {
      await updateContactInfo(selectedPhone, {
        displayName: editName.trim(),
        contactCompany: editCompany.trim() || undefined,
        contactNotes: editNotes.trim() || undefined,
      });
      setEditingContact(false);
      const c = await haalGesprekken(tab);
      setConversations(c);
    } catch { /* ignore */ }
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
    setCsvText('');
    setCsvParsed([]);
    setCsvErrors([]);
    setManualName('');
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

    let membersToAdd: Array<{ phoneNumber: string; displayName?: string }> = [];

    if (importTab === 'whatsapp') {
      membersToAdd = Array.from(selectedContacts).map(phone => {
        const c = availableContacts.find(ac => ac.phoneNumber === phone);
        return { phoneNumber: phone, displayName: c?.displayName || undefined };
      });
    } else if (importTab === 'kandidaten') {
      membersToAdd = Array.from(selectedContacts).map(phone => {
        const c = importCandidates.find(ic => ic.phone === phone);
        return { phoneNumber: phone, displayName: c?.name || undefined };
      });
    } else if (importTab === 'klanten') {
      membersToAdd = Array.from(selectedContacts).map(phone => {
        const c = importProspects.find(ip => ip.phone === phone);
        return { phoneNumber: phone, displayName: c?.name || undefined };
      });
    } else if (importTab === 'csv') {
      membersToAdd = Array.from(selectedContacts).map(phone => {
        const c = csvParsed.find(cp => cp.phone === phone);
        return { phoneNumber: phone, displayName: c?.name || undefined };
      });
    } else if (importTab === 'handmatig') {
      if (manualPhone.trim()) {
        membersToAdd = [{ phoneNumber: manualPhone.trim(), displayName: manualName.trim() || undefined }];
      }
    }

    try {
      await voegLedenToe(selectedGroupId, membersToAdd);
      setGroupMembers(await haalGroepLeden(selectedGroupId));
      setGroups(await haalGroepen());
      setShowAddMembers(false);
      setSelectedContacts(new Set());
      setManualName('');
      setManualPhone('');
    } catch { /* ignore */ }
    setAddingMembers(false);
  }

  async function handleAddManual() {
    if (!selectedGroupId || !manualPhone.trim()) return;
    setAddingMembers(true);
    try {
      await voegLedenToe(selectedGroupId, [{ phoneNumber: manualPhone.trim(), displayName: manualName.trim() || undefined }]);
      setGroupMembers(await haalGroepLeden(selectedGroupId));
      setGroups(await haalGroepen());
      setManualName('');
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

      {/* Titel + view toggle + instellingen */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: NAVY }}>WhatsApp</h2>
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 2 }}>
            <button
              onClick={() => { setMainView('gesprekken'); setSelectedGroupId(null); }}
              style={{
                padding: '5px 14px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 6,
                background: mainView === 'gesprekken' ? '#fff' : 'transparent',
                color: mainView === 'gesprekken' ? NAVY : '#6B7280',
                cursor: 'pointer', fontFamily: FONT,
                boxShadow: mainView === 'gesprekken' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Gesprekken
            </button>
            <button
              onClick={() => { setMainView('groepen'); setSelectedPhone(null); }}
              style={{
                padding: '5px 14px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 6,
                background: mainView === 'groepen' ? '#fff' : 'transparent',
                color: mainView === 'groepen' ? NAVY : '#6B7280',
                cursor: 'pointer', fontFamily: FONT,
                boxShadow: mainView === 'groepen' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Groepen
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => { setShowAiSettings(!showAiSettings); if (!showAiSettings && !aiSettings) loadAiSettings(); setShowSettings(false); }}
            title="AI-instellingen"
            style={{
              background: showAiSettings ? '#F0F4FA' : 'transparent',
              border: '1px solid #E5E7EB', borderRadius: 8,
              padding: '6px 10px', cursor: 'pointer', fontSize: 14, color: showAiSettings ? NAVY : '#6B7280',
              fontWeight: showAiSettings ? 600 : 400,
            }}
          >
            \u2728 AI
          </button>
          <button
            onClick={() => { setShowSettings(!showSettings); setShowAiSettings(false); }}
            title="Webhook-instellingen"
            style={{
              background: showSettings ? '#F0F4FA' : 'transparent',
              border: '1px solid #E5E7EB', borderRadius: 8,
              padding: '6px 10px', cursor: 'pointer', fontSize: 16, color: '#6B7280',
            }}
          >
            \u2699
          </button>
        </div>
      </div>

      {showAiSettings && (
        <div style={{
          padding: '16px 20px', background: '#FAFBFC', border: '1px solid #E5E7EB',
          borderRadius: 10, marginBottom: 12, fontSize: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>\u2728 AI Richtlijnen</div>
          {aiSettingsLoading ? (
            <div style={{ color: '#9CA3AF', fontSize: 12 }}>Laden...</div>
          ) : aiSettings ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Tone of voice</label>
                <textarea value={aiSettings.toneOfVoice} onChange={e => setAiSettings({ ...aiSettings, toneOfVoice: e.target.value })}
                  rows={2} style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Bijv: Professioneel maar warm en persoonlijk..." />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Algemene richtlijnen</label>
                <textarea value={aiSettings.guidelines} onChange={e => setAiSettings({ ...aiSettings, guidelines: e.target.value })}
                  rows={3} style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Bijv: Je bent een planningsassistent van EXTRA..." />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Afmeldprotocol</label>
                <textarea value={aiSettings.cancellationProtocol} onChange={e => setAiSettings({ ...aiSettings, cancellationProtocol: e.target.value })}
                  rows={3} style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Bijv: Als iemand zich wil afmelden voor een dienst..." />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Extra context</label>
                <textarea value={aiSettings.extraContext} onChange={e => setAiSettings({ ...aiSettings, extraContext: e.target.value })}
                  rows={2} style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Eventuele extra instructies of context voor de AI..." />
              </div>

              {/* ─── Kennisbank / Protocollen ───────────────────────────── */}
              <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>📚 Kennisbank / Protocollen</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 10 }}>
                  Voeg zoveel protocollen of context-stukken toe als je wilt. De AI gebruikt elk ingeschakeld item bij het genereren van antwoorden.
                </div>
                {aiKnowledgeLoading ? (
                  <div style={{ color: '#9CA3AF', fontSize: 12 }}>Laden...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {aiKnowledge.map(entry => (
                      <div key={entry.id} style={{
                        border: '1px solid #E5E7EB', borderRadius: 8, padding: 10,
                        background: entry.enabled ? '#fff' : '#F9FAFB', opacity: entry.enabled ? 1 : 0.6,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <input type="checkbox" checked={entry.enabled}
                            onChange={e => setAiKnowledge(prev => prev.map(k => k.id === entry.id ? { ...k, enabled: e.target.checked } : k))}
                            title="Actief"
                            style={{ cursor: 'pointer' }} />
                          <input type="text" value={entry.title}
                            onChange={e => setAiKnowledge(prev => prev.map(k => k.id === entry.id ? { ...k, title: e.target.value } : k))}
                            placeholder="Titel (bijv. Afmeldprotocol)"
                            style={{ flex: 1, padding: '6px 8px', fontSize: 12, fontWeight: 600, border: '1px solid #E5E7EB', borderRadius: 4, fontFamily: FONT, color: NAVY, boxSizing: 'border-box' }} />
                          <button onClick={() => saveKnowledgeEntry(entry)} disabled={knowledgeSavingId === entry.id}
                            style={{ background: knowledgeSavingId === entry.id ? '#E5E7EB' : '#10B981', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                            title="Opslaan">
                            {knowledgeSavingId === entry.id ? '...' : 'Opslaan'}
                          </button>
                          <button onClick={() => removeKnowledgeEntry(entry.id)}
                            style={{ background: 'transparent', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                            title="Verwijderen">
                            ×
                          </button>
                        </div>
                        <textarea value={entry.content}
                          onChange={e => setAiKnowledge(prev => prev.map(k => k.id === entry.id ? { ...k, content: e.target.value } : k))}
                          rows={3} style={{ width: '100%', padding: '6px 8px', fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 4, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box' }}
                          placeholder="Inhoud van het protocol..." />
                      </div>
                    ))}

                    {/* Nieuw protocol toevoegen */}
                    <div style={{ border: '1px dashed #D1D5DB', borderRadius: 8, padding: 10, background: '#FAFBFC' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>➕ Nieuw protocol toevoegen</div>
                      <input type="text" value={newKnowledgeTitle} onChange={e => setNewKnowledgeTitle(e.target.value)}
                        placeholder="Titel (bijv. Vakantieperiode)"
                        style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 4, fontFamily: FONT, marginBottom: 6, boxSizing: 'border-box' }} />
                      <textarea value={newKnowledgeContent} onChange={e => setNewKnowledgeContent(e.target.value)}
                        rows={2} style={{ width: '100%', padding: '6px 8px', fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 4, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box', marginBottom: 6 }}
                        placeholder="Inhoud van het protocol..." />
                      <button onClick={addKnowledgeEntry}
                        disabled={knowledgeSavingId === 'new' || !newKnowledgeTitle.trim() || !newKnowledgeContent.trim()}
                        style={{
                          background: (knowledgeSavingId === 'new' || !newKnowledgeTitle.trim() || !newKnowledgeContent.trim()) ? '#E5E7EB' : NAVY,
                          color: (knowledgeSavingId === 'new' || !newKnowledgeTitle.trim() || !newKnowledgeContent.trim()) ? '#9CA3AF' : '#fff',
                          border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}>
                        {knowledgeSavingId === 'new' ? 'Toevoegen...' : 'Toevoegen'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Auto-antwoord modus ───────────────────────────────── */}
              <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>🤖 Auto-antwoord modus</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 10 }}>
                  Wanneer ingeschakeld, beantwoordt de AI inkomende berichten zelfstandig zonder dat een planner hoeft te bevestigen.
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: aiSettings.autoReplyEnabled ? '#FEF3C7' : '#fff', border: `1px solid ${aiSettings.autoReplyEnabled ? '#F59E0B' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={aiSettings.autoReplyEnabled}
                    onChange={e => setAiSettings({ ...aiSettings, autoReplyEnabled: e.target.checked })}
                    style={{ cursor: 'pointer', width: 16, height: 16 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: aiSettings.autoReplyEnabled ? '#92400E' : NAVY }}>
                      {aiSettings.autoReplyEnabled ? '🟢 AAN — bot reageert automatisch' : '⚪ UIT — alleen suggesties tonen'}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>
                      Bij twijfel of gevoelige onderwerpen escaleert de AI automatisch naar de planner.
                    </div>
                  </div>
                </label>

                {aiSettings.autoReplyEnabled && (
                  <div style={{ marginTop: 10, padding: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#374151', cursor: 'pointer' }}>
                      <input type="checkbox" checked={aiSettings.autoReplyOnlyForKnown}
                        onChange={e => setAiSettings({ ...aiSettings, autoReplyOnlyForKnown: e.target.checked })}
                        style={{ cursor: 'pointer' }} />
                      <span>Alleen automatisch antwoorden bij <strong>bekende contacten</strong> (kandidaten/klanten in de database)</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#374151' }}>
                      <span>Minimaal interval tussen auto-antwoorden:</span>
                      <input type="number" min={0} max={3600}
                        value={aiSettings.autoReplyMinIntervalSec}
                        onChange={e => setAiSettings({ ...aiSettings, autoReplyMinIntervalSec: Math.max(0, Number(e.target.value) || 0) })}
                        style={{ width: 60, padding: '4px 6px', fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 4, fontFamily: FONT, boxSizing: 'border-box' }} />
                      <span>seconden</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#92400E', background: '#FEF3C7', padding: '6px 8px', borderRadius: 4, border: '1px solid #FDE68A' }}>
                      ⚠ Let op: berichten worden direct verstuurd. Test dit eerst grondig en houd de eerste dagen het gesprek in de gaten.
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={saveAiSettings} disabled={aiSettingsSaving}
                  style={{ background: aiSettingsSaving ? '#E5E7EB' : NAVY, color: aiSettingsSaving ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: aiSettingsSaving ? 'wait' : 'pointer', fontFamily: FONT }}>
                  {aiSettingsSaving ? 'Opslaan...' : 'Instellingen opslaan'}
                </button>
                {aiSettingsMsg && <span style={{ fontSize: 11, color: aiSettingsMsg === 'Opgeslagen!' ? '#059669' : '#DC2626' }}>{aiSettingsMsg}</span>}
              </div>
            </div>
          ) : null}
          <div style={{ marginTop: 12, padding: '8px 10px', background: '#F0F4FA', borderRadius: 6, fontSize: 11, color: '#6B7280' }}>
            Deze richtlijnen + kennisbank worden gebruikt door de AI om antwoordsuggesties te genereren bij inkomende WhatsApp-berichten. Met de auto-antwoord modus reageert de bot zelf zonder tussenkomst.
          </div>
        </div>
      )}

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
            {/* Linkerkolom: gesprekkenlijst */}
            <div style={{
              width: 340, display: 'flex', flexDirection: 'column',
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden',
            }}>
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

              <div style={{ padding: '8px 10px', borderBottom: '1px solid #E5E7EB' }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Zoek op naam of nummer..."
                  style={{
                    width: '100%', padding: '7px 10px', fontSize: 12,
                    border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none',
                    fontFamily: FONT, boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  <select
                    value={filterUnread}
                    onChange={e => setFilterUnread(e.target.value as FilterUnread)}
                    style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, border: '1px solid #E5E7EB', fontFamily: FONT, color: filterUnread !== 'all' ? NAVY : '#6B7280', fontWeight: filterUnread !== 'all' ? 600 : 400 }}
                  >
                    <option value="all">Alle</option>
                    <option value="unread">Ongelezen</option>
                  </select>
                  <select
                    value={filterAssignee}
                    onChange={e => setFilterAssignee(e.target.value)}
                    style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, border: '1px solid #E5E7EB', fontFamily: FONT, color: filterAssignee !== 'all' ? NAVY : '#6B7280', fontWeight: filterAssignee !== 'all' ? 600 : 400 }}
                  >
                    <option value="all">Iedereen</option>
                    <option value="unassigned">Niet toegewezen</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={String(m.id)}>{m.name}</option>
                    ))}
                  </select>
                  {allLabelsInUse.length > 0 && (
                    <select
                      value={filterLabel}
                      onChange={e => setFilterLabel(e.target.value)}
                      style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, border: '1px solid #E5E7EB', fontFamily: FONT, color: filterLabel !== 'all' ? NAVY : '#6B7280', fontWeight: filterLabel !== 'all' ? 600 : 400 }}
                    >
                      <option value="all">Labels</option>
                      {allLabelsInUse.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  )}
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setFilterUnread('all'); setFilterAssignee('all'); setFilterLabel('all'); }}
                      style={{ fontSize: 10, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px' }}
                    >
                      \u2715 Reset
                    </button>
                  )}
                </div>
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
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedPhone(c.phoneNumber)}
                      style={{
                        padding: '10px 14px',
                        background: selected ? '#F0F4FA' : '#fff',
                        borderLeft: selected ? `3px solid ${NAVY}` : '3px solid transparent',
                        borderBottom: '1px solid #F3F4F6',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{
                          fontSize: 13, fontWeight: unread ? 700 : 600,
                          color: name === 'Onbekend' ? '#9CA3AF' : NAVY,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {name}
                        </div>
                        <div style={{ fontSize: 10, color: '#94A3B8', flexShrink: 0, marginLeft: 6 }}>
                          {timeAgo(c.lastMessageAt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                        <span style={{ fontSize: 11, color: '#64748B' }}>
                          +{c.phoneNumber}
                          {c.matchCategory === 'prospect' && c.contactCompany ? ` \u00B7 ${c.contactCompany}` : ''}
                          {c.matchCategory === 'unmatched' && c.contactCompany ? ` \u00B7 ${c.contactCompany}` : ''}
                        </span>
                        {c.assignedToName && (
                          <span style={{ fontSize: 9, color: '#8B5CF6', background: '#EDE9FE', borderRadius: 3, padding: '0 4px', flexShrink: 0 }}>
                            {c.assignedToName.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 12, color: unread ? '#1F2937' : '#64748B',
                        fontWeight: unread ? 600 : 400,
                        marginTop: 3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: 280,
                      }}>
                        {(c.lastMessagePreview || '\u2014').slice(0, 60)}
                      </div>
                      {(c.labels?.length || unread) ? (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                          {unread && (
                            <span style={{
                              background: '#DC2626', color: '#fff', borderRadius: 10,
                              padding: '0 7px', fontSize: 10, fontWeight: 700,
                            }}>{c.unreadCount}</span>
                          )}
                          {c.labels?.map(l => (
                            <span key={l} style={{
                              fontSize: 9, padding: '1px 6px', borderRadius: 3,
                              background: labelColor(l) + '18', color: labelColor(l),
                              fontWeight: 600,
                            }}>{l}</span>
                          ))}
                        </div>
                      ) : null}
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
                  <div style={{ padding: '12px 18px', borderBottom: '1px solid #E5E7EB', background: '#FAFBFC' }}>
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
                          {selectedConv.matchCategory === 'unmatched' && (
                            <button
                              onClick={openEditContact}
                              title={selectedConv.displayName ? 'Naam bewerken' : 'Naam toevoegen'}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', padding: '1px 3px' }}
                            >
                              \u270F\uFE0F
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                          {threadSubline(selectedConv)}
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                          {selectedConv.labels?.map(l => (
                            <span key={l} style={{
                              fontSize: 10, padding: '1px 6px', borderRadius: 3,
                              background: labelColor(l) + '18', color: labelColor(l),
                              fontWeight: 600, cursor: 'pointer',
                            }} onClick={() => handleRemoveLabel(l)} title={`Verwijder label "${l}"`}>
                              {l} \u00D7
                            </span>
                          ))}
                          {showLabelInput ? (
                            <form onSubmit={handleAddLabel} style={{ display: 'inline-flex', gap: 2 }}>
                              <input
                                value={labelInput}
                                onChange={e => setLabelInput(e.target.value)}
                                placeholder="label..."
                                autoFocus
                                onBlur={() => { if (!labelInput.trim()) setShowLabelInput(false); }}
                                style={{ width: 70, fontSize: 10, padding: '1px 4px', border: '1px solid #D1D5DB', borderRadius: 3, outline: 'none', fontFamily: FONT }}
                              />
                            </form>
                          ) : (
                            <button
                              onClick={() => setShowLabelInput(true)}
                              style={{ fontSize: 10, color: '#9CA3AF', background: 'none', border: '1px dashed #D1D5DB', borderRadius: 3, padding: '1px 6px', cursor: 'pointer' }}
                            >
                              + label
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
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

                  {editingContact && selectedConv.matchCategory === 'unmatched' && (
                    <div style={{ padding: '12px 18px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 2 }}>Contact bewerken</div>
                        <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Naam (verplicht)" required
                          style={{ padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT }} />
                        <input value={editCompany} onChange={e => setEditCompany(e.target.value)} placeholder="Bedrijf / context (optioneel)"
                          style={{ padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT }} />
                        <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notities (optioneel)" rows={2}
                          style={{ padding: '8px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT, resize: 'vertical' }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="submit" disabled={editSaving || !editName.trim()}
                            style={{ background: editSaving || !editName.trim() ? '#E5E7EB' : NAVY, color: editSaving || !editName.trim() ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                            {editSaving ? 'Opslaan...' : 'Opslaan'}
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
                                ✨ AI suggestie
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
                            \u26A0 24u-venster mogelijk verstreken — WhatsApp kan vrije tekstberichten afwijzen. Stuur een template of wacht tot deze persoon iets stuurt.
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
                        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            placeholder={within24h ? 'Typ een antwoord...' : 'Typ een antwoord (24u-venster mogelijk verlopen)...'}
                            disabled={sending}
                            style={{ flex: 1, padding: '10px 14px', fontSize: 13, border: '1px solid #E5E7EB', borderRadius: 6, outline: 'none', fontFamily: FONT, background: '#fff' }}
                          />
                          <button type="button" onClick={requestAiSuggestion} disabled={aiLoading || messages.length === 0}
                            title="AI suggestie opvragen"
                            style={{ background: aiLoading ? '#E5E7EB' : '#F0F4FA', color: aiLoading ? '#9CA3AF' : NAVY, border: '1px solid #C7D2E0', borderRadius: 6, padding: '0 10px', fontSize: 15, cursor: aiLoading ? 'wait' : 'pointer' }}>
                            {aiLoading ? '\u23F3' : '\u2728'}
                          </button>
                          <button type="submit" disabled={sending || !reply.trim()}
                            style={{ background: (sending || !reply.trim()) ? '#E5E7EB' : NAVY, color: (sending || !reply.trim()) ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '0 18px', fontSize: 13, fontWeight: 600, cursor: (sending || !reply.trim()) ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
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
                      style={{ background: 'none', border: 'none', fontSize: 16, color: '#6B7280', cursor: 'pointer' }}>\u2715</button>
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
                          <div style={{ padding: '10px 18px', background: '#F0F4FA', borderBottom: '1px solid #E5E7EB' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>Contacten importeren</div>
                              <button onClick={() => setShowAddMembers(false)} style={{ background: 'none', border: 'none', fontSize: 14, color: '#6B7280', cursor: 'pointer' }}>{'\u2715'}</button>
                            </div>

                            <div style={{ display: 'flex', gap: 0, marginBottom: 10, background: '#E5E7EB', borderRadius: 6, padding: 2 }}>
                              {([
                                ['whatsapp', 'WhatsApp'],
                                ['kandidaten', 'Kandidaten'],
                                ['klanten', 'Klanten'],
                                ['csv', 'CSV Upload'],
                                ['handmatig', 'Handmatig'],
                              ] as [ImportTab, string][]).map(([key, label]) => (
                                <button
                                  key={key}
                                  onClick={() => loadImportTab(key)}
                                  style={{
                                    flex: 1, padding: '5px 4px', fontSize: 10, fontWeight: importTab === key ? 700 : 500,
                                    background: importTab === key ? '#fff' : 'transparent',
                                    color: importTab === key ? NAVY : '#6B7280',
                                    border: 'none', borderRadius: 5, cursor: 'pointer', fontFamily: FONT,
                                  }}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>

                            {(importTab === 'whatsapp' || importTab === 'kandidaten' || importTab === 'klanten') && (
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
                              <div>
                                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>
                                  Voeg een enkel contact toe met naam en telefoonnummer.
                                </div>
                                <input
                                  value={manualName}
                                  onChange={e => setManualName(e.target.value)}
                                  placeholder="Naam (optioneel)"
                                  style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT, boxSizing: 'border-box', marginBottom: 6 }}
                                />
                                <input
                                  value={manualPhone}
                                  onChange={e => setManualPhone(e.target.value)}
                                  placeholder="Telefoonnummer (bijv. 0612345678)"
                                  style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 6, outline: 'none', fontFamily: FONT, boxSizing: 'border-box', marginBottom: 8 }}
                                />
                                <button onClick={handleAddManual} disabled={addingMembers || !manualPhone.trim()}
                                  style={{ background: addingMembers || !manualPhone.trim() ? '#E5E7EB' : NAVY, color: addingMembers || !manualPhone.trim() ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                                  {addingMembers ? 'Toevoegen...' : 'Toevoegen'}
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
                        {groupMembers.map(m => (
                          <div key={m.id} style={{
                            padding: '8px 18px', borderBottom: '1px solid #F3F4F6',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: m.displayName ? '#1F2937' : '#9CA3AF' }}>
                                {m.displayName || 'Onbekend'}
                              </div>
                              <div style={{ fontSize: 10, color: '#6B7280' }}>+{m.phoneNumber}</div>
                            </div>
                            <button onClick={() => handleRemoveMember(m.phoneNumber)}
                              style={{ background: 'none', border: 'none', fontSize: 12, color: '#DC2626', cursor: 'pointer', padding: '2px 6px' }}
                              title="Lid verwijderen">
                              \u2715
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bulk bericht sectie */}
                    <div style={{ padding: '16px 18px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>Bericht sturen naar hele groep</div>
                        <button onClick={requestBulkAiSuggestion} disabled={bulkAiLoading}
                          title="AI suggestie voor groepsbericht"
                          style={{ background: bulkAiLoading ? '#E5E7EB' : '#F0F4FA', color: bulkAiLoading ? '#9CA3AF' : NAVY, border: '1px solid #C7D2E0', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: bulkAiLoading ? 'wait' : 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {bulkAiLoading ? '\u23F3' : '\u2728'} AI suggestie
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
                        placeholder="Typ hier je bericht voor de hele groep..."
                        rows={4}
                        disabled={bulkSending}
                        style={{
                          width: '100%', padding: '10px 14px', fontSize: 13, border: '1px solid #E5E7EB',
                          borderRadius: 6, outline: 'none', fontFamily: FONT, resize: 'vertical',
                          boxSizing: 'border-box',
                        }}
                      />

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
