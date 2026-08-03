const BASE_URL = '/api/whatsapp';
const headers = { 'Content-Type': 'application/json' };

export interface Conversation {
  id: number;
  phoneNumber: string;
  candidateId: number | null;
  prospectContactId: number | null;
  matchCategory: 'candidate' | 'prospect' | 'unmatched';
  displayName: string | null;
  /**
   * Alléén-lezen fallback-naam uit de eenmalige contactenimport (augustus
   * 2026), server-side opgezocht wanneer er geen échte match is. Nooit een
   * vervanging voor displayName — puur voor weergave. Zie
   * server/whatsapp/storage.ts (listConversations) en
   * scripts/import-contacten.ts.
   */
  importedContactName?: string | null;
  contactCompany: string | null;
  contactNotes: string | null;
  assignedToId: number | null;
  assignedToName: string | null;
  labels: string[] | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
  lastInboundAt: string | null;
  inboxStatus: 'open' | 'resolved' | 'spam';
  /** Fase 2: gesprek gesnoozed tot dit tijdstip (null = niet gesnoozed). */
  snoozedUntil?: string | null;
  /** Fase 3: onderwerp-label, door de AI bepaald of handmatig gezet. */
  aiCategory?: AiCategory | null;
  /** 'handmatig' = door een planner gezet; de AI overschrijft dat niet meer. */
  aiCategorySource?: 'ai' | 'handmatig' | null;
  /** Fase 3: waarom de AI overdroeg aan een mens (null = geen escalatie). */
  escalationReason?: EscalationReason | null;
  /** Gevuld = wacht op planner. Bepaalt ook de volgorde in de lijst. */
  escalatedAt?: string | null;
  /** Afgeleid: was het laatste bericht een AI-antwoord? Nooit opgeslagen. */
  aiHandledLast?: boolean;
  /** Afgeleide status — de enige waarheid over "wat is de stand van dit gesprek". */
  displayStatus?: ConversationDisplayStatus;
  createdAt?: string;
}

/**
 * Fase 3: labels en escalatieredenen.
 * Let op: dit zijn vaste identifiers, géén weergavetekst. De Nederlandse
 * weergave staat in AI_CATEGORY_LABELS / ESCALATION_REASON_LABELS hieronder.
 * De server kiest ze op BETEKENIS, taalonafhankelijk.
 */
/** Moet gelijk blijven aan AI_CATEGORIES in server/whatsapp/aiClassifier.ts. */
export const AI_CATEGORIES = ['sollicitatie', 'afmelding', 'klacht', 'algemene_vraag', 'verzoek', 'overig'] as const;
export type AiCategory = (typeof AI_CATEGORIES)[number];

export const AI_CATEGORY_LABELS: Record<AiCategory, string> = {
  sollicitatie: 'Sollicitatie',
  afmelding: 'Afmelding',
  klacht: 'Klacht',
  algemene_vraag: 'Algemene vraag',
  verzoek: 'Verzoek',
  overig: 'Overig',
};

export type EscalationReason = 'boos' | 'buiten_kennisbank' | 'wil_telefonisch' | 'mens_gevraagd' | 'overig';

export const ESCALATION_REASON_LABELS: Record<EscalationReason, string> = {
  boos: 'Boos',
  buiten_kennisbank: 'Buiten kennisbank',
  wil_telefonisch: 'Wil telefonisch',
  mens_gevraagd: 'Mens gevraagd',
  overig: 'Escalatie',
};

export type ConversationDisplayStatus =
  | 'wacht_op_planner'
  | 'afgehandeld_ai'
  | 'gesnoozed'
  | 'opgelost'
  | 'spam'
  | 'open';

export interface Message {
  id: number;
  direction: 'inbound' | 'outbound';
  waMessageId: string | null;
  fromNumber: string;
  toNumber: string;
  messageType: string;
  body: string | null;
  /**
   * Ruwe media-referentie van de provider — bij Meta een media-id, geen URL.
   * Alleen bruikbaar voor diagnose; om te weten of er écht een bestand te
   * tonen is kijk je naar heeftBijlage.
   */
  mediaUrl: string | null;
  mediaMimeType: string | null;
  /** Oorspronkelijke bestandsnaam, voor de downloadlink bij documenten. */
  mediaFilename?: string | null;
  /**
   * Staat het bestand daadwerkelijk in Object Storage? Zo ja, dan is het op te
   * halen via GET /api/whatsapp/messages/:id/media. Het opslagpad zelf blijft
   * bewust server-side.
   */
  heeftBijlage?: boolean;
  status: string;
  errorCode: string | null;
  errorMessage: string | null;
  matchCategory: 'candidate' | 'prospect' | 'unmatched';
  /** Bij outbound: user-id van de verzender; null = automatisch verstuurd (AI-agent). */
  sentByUserId?: number | null;
  /**
   * Bij outbound: 'app' = vanaf de telefoon zelf getypt (echo van Meta).
   * null of afwezig = via het dashboard of de AI-agent, te onderscheiden aan
   * sentByUserId. Alleen 'app' wordt ooit geschreven.
   */
  sentSource?: string | null;
  createdAt: string;
}

export interface Stats {
  candidate: { total: number; unread: number };
  prospect: { total: number; unread: number };
  unmatched: { total: number; unread: number };
  totalUnread: number;
}

export interface AccountInfo {
  id: string;
  label: string;
  status: 'connected' | 'disconnected';
  telefoon: string | null;
}

export interface WebhookStatus {
  configured: boolean;
  url: string | null;
  secretSet: boolean;
}

export interface TeamMember {
  id: number;
  name: string;
}

export interface InternalNote {
  id: number;
  conversationId: number;
  authorId: number | null;
  authorName: string;
  body: string;
  createdAt: string;
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE_URL}${path}`, { headers, credentials: 'include' });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

async function post<T>(path: string, body?: any): Promise<T> {
  const r = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || (data as any)?.error) {
    throw new Error((data as any)?.error || `${path}: ${r.status}`);
  }
  return data as T;
}

async function put<T>(path: string, body?: any): Promise<T> {
  const r = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || (data as any)?.error) {
    throw new Error((data as any)?.error || `${path}: ${r.status}`);
  }
  return data as T;
}

export const haalAccounts = () => get<AccountInfo[]>('/accounts');
export const haalGesprekken = (
  category?: 'candidate' | 'prospect' | 'unmatched',
  opts?: { snoozed?: 'exclude' | 'only' | 'all' },
) => {
  const qs = new URLSearchParams();
  if (category) qs.set('category', category);
  if (opts?.snoozed) qs.set('snoozed', opts.snoozed);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return get<Conversation[]>(`/conversations${suffix}`);
};

/** Fase 2: snooze een gesprek tot `until` (ISO-string), of hef op met null. */
export const snoozeGesprek = async (conversationId: number, until: string | null) => {
  const r = await fetch(`${BASE_URL}/conversations/${conversationId}/snooze`, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify({ until }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || (data as any)?.error) {
    throw new Error((data as any)?.error || `snooze: ${r.status}`);
  }
  return data as { success: boolean; snoozedUntil: string | null };
};
export const haalBerichten = (phoneNumber: string) =>
  get<Message[]>(`/conversations/${encodeURIComponent(phoneNumber)}/messages`);
export const markeerGelezen = (phoneNumber: string) =>
  post<{ success: boolean }>(`/conversations/${encodeURIComponent(phoneNumber)}/mark-read`);
export const markeerOngelezen = (phoneNumber: string) =>
  post<{ success: boolean }>(`/conversations/${encodeURIComponent(phoneNumber)}/mark-unread`);
export const updateInboxStatus = (phoneNumber: string, status: 'open' | 'resolved' | 'spam') =>
  put<{ success: boolean }>(`/conversations/${encodeURIComponent(phoneNumber)}/inbox-status`, { status });

/** Fase 3: handmatige override van het AI-label. null = weer aan de AI overlaten. */
export const zetAiCategorie = (phoneNumber: string, category: AiCategory | null) =>
  put<{ success: boolean; category: AiCategory | null; source: 'ai' | 'handmatig' }>(
    `/conversations/${encodeURIComponent(phoneNumber)}/ai-category`,
    { category },
  );
export const stuurBericht = (nummer: string, tekst: string) =>
  post<{ success: boolean; messageId: string | null; dbId: number }>('/stuur', { nummer, tekst });

/* ------------------------------------------------------------------ *
 * Fase 3B — taken
 *
 * Een taak staat LOS van het gesprek: je kunt een gesprek sluiten terwijl
 * de taak nog open staat, en andersom. Daarom een eigen tabel, eigen
 * status en eigen endpoints.
 * ------------------------------------------------------------------ */

export const TASK_CATEGORIES = ['uren_jixbee', 'vervanging', 'contract', 'overig'] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

/** Moet gelijk blijven aan TASK_CATEGORY_LABELS in server/whatsapp/taskRules.ts. */
export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  uren_jixbee: 'Uren / Jixbee',
  vervanging: 'Vervanging',
  contract: 'Contract',
  overig: 'Overig',
};

export type TaskStatus = 'open' | 'klaar';

export interface Task {
  id: number;
  conversationId: number;
  phoneNumber: string;
  summary: string;
  category: TaskCategory;
  assignedToId: number | null;
  assignedToName: string | null;
  status: TaskStatus;
  /** Bericht waar de taak uit volgde; null bij handmatig aangemaakte taken. */
  sourceMessageId: number | null;
  createdAt: string;
  completedAt: string | null;
  completedById: number | null;
  completedByName: string | null;
  /** Uit het gesprek gejoined, puur voor weergave. */
  contactName: string | null;
  /** Uit het gesprek gejoined: in welke tab het gesprek staat (voor de doorklik). */
  matchCategory: 'candidate' | 'prospect' | 'unmatched' | null;
}

export interface TakenResultaat {
  tasks: Task[];
  /** Totaal open taken, ongeacht het actieve filter — voor de teller. */
  openTotaal: number;
}

/**
 * Haal taken op. `assignedToId: 'niemand'` geeft de taken die nog van
 * niemand zijn.
 */
export const haalTaken = (opts?: { status?: TaskStatus | 'alle'; assignedToId?: number | 'niemand' }) => {
  const qs = new URLSearchParams();
  if (opts?.status) qs.set('status', opts.status);
  if (opts?.assignedToId != null) qs.set('assignedToId', String(opts.assignedToId));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return get<TakenResultaat>(`/tasks${suffix}`);
};

/** Afvinken of weer openzetten. Raakt de status van het gesprek niet aan. */
export const zetTaakStatus = (taskId: number, status: TaskStatus) =>
  put<{ success: boolean; status: TaskStatus }>(`/tasks/${taskId}/status`, { status });

/** Toewijzen aan een collega, of vrijgeven met null. */
export const zetTaakToegewezene = (taskId: number, assignedToId: number | null) =>
  put<{ success: boolean; assignedToId: number | null; assignedToName: string | null }>(
    `/tasks/${taskId}/assignee`,
    { assignedToId },
  );

export const stuurMedia = async (nummer: string, file: File, caption?: string) => {
  const fd = new FormData();
  fd.append('nummer', nummer);
  fd.append('file', file);
  if (caption) fd.append('caption', caption);
  const r = await fetch(`${BASE_URL}/stuur-media`, {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || (data as any)?.error) throw new Error((data as any)?.error || `stuur-media: ${r.status}`);
  return data as { success: boolean; messageId: string | null; dbId: number; mediaType: string; mediaId: string };
};
export const haalStats = () => get<Stats>('/stats');
export const haalWebhookStatus = () => get<WebhookStatus>('/webhook-status');
export const registreerWebhook = (url?: string) =>
  post<{ success: boolean; url: string }>('/registreer-webhook', { url });

export const updateContactInfo = (phoneNumber: string, data: { displayName: string; contactCompany?: string; contactNotes?: string }) =>
  put<{ success: boolean }>(`/conversations/${encodeURIComponent(phoneNumber)}/contact-info`, data);

export const bewerkContactNaam = (phoneNumber: string, data: { voornaam: string; achternaam: string }) =>
  put<{ success: boolean }>(`/conversations/${encodeURIComponent(phoneNumber)}/edit-naam`, data);

export type KoppelContactCategorie = 'klant' | 'medewerker' | 'kandidaat';
export const koppelContactAanGesprek = (
  phoneNumber: string,
  data: { voornaam: string; achternaam: string; categorie: KoppelContactCategorie; email?: string; notities?: string },
) =>
  post<{ success: boolean; createdType: 'candidate' | 'prospect'; createdId: number; categorie: KoppelContactCategorie }>(
    `/conversations/${encodeURIComponent(phoneNumber)}/koppel-contact`,
    data,
  );

export interface Group {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: number;
  groupId: number;
  phoneNumber: string;
  displayName: string | null;
  addedAt: string;
}

export interface AvailableContact {
  phoneNumber: string;
  displayName: string | null;
  matchCategory: 'candidate' | 'prospect' | 'unmatched';
  contactCompany: string | null;
}

export interface BulkSendResult {
  bulkSendId: number;
  total: number;
  sent: number;
  failed: number;
  results: Array<{ phone: string; displayName: string | null; status: 'sent' | 'failed'; error?: string }>;
}

export interface BulkSendRecord {
  id: number;
  groupId: number | null;
  groupName: string;
  messageBody: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  sentByName: string | null;
  createdAt: string;
}

async function del<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as any)?.error || `${path}: ${r.status}`);
  return data as T;
}

export const haalGroepen = () => get<Group[]>('/groups');
export const maakGroep = (name: string, description?: string) =>
  post<Group>('/groups', { name, description });
export const updateGroep = (id: number, name: string, description?: string) =>
  put<{ success: boolean }>(`/groups/${id}`, { name, description });
export const verwijderGroep = (id: number) =>
  del<{ success: boolean }>(`/groups/${id}`);
export const haalGroepLeden = (id: number) =>
  get<GroupMember[]>(`/groups/${id}/members`);
export const voegLedenToe = (id: number, members: Array<{ phoneNumber: string; displayName?: string; firstName?: string; lastName?: string }>) =>
  post<{ added: number; skipped: number }>(`/groups/${id}/members`, { members });
export const verwijderLid = (groupId: number, phone: string) =>
  del<{ success: boolean }>(`/groups/${groupId}/members/${encodeURIComponent(phone)}`);
export const haalBeschikbareContacten = (groupId: number) =>
  get<AvailableContact[]>(`/groups/${groupId}/available-contacts`);
export const stuurBulkBericht = (groupId: number, tekst: string) =>
  post<BulkSendResult>(`/groups/${groupId}/send`, { tekst });
export const haalBulkVerzendingen = () =>
  get<BulkSendRecord[]>('/bulk-sends');

export interface ImportCandidate {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  functionType: string;
  status: string;
  city: string | null;
  alreadyInGroup: boolean;
}

export interface ImportProspect {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string | null;
  branche: string | null;
  alreadyInGroup: boolean;
}

export interface ImportEmployee {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  functie: string | null;
  status: string;
  opdrachtgever: string | null;
  branche: string | null;
  alreadyInGroup: boolean;
}

export interface CsvParseResult {
  contacts: Array<{ name: string; phone: string; alreadyInGroup: boolean }>;
  errors: string[];
}

export const haalImportKandidaten = (groupId: number) =>
  get<ImportCandidate[]>(`/import/candidates?groupId=${groupId}`);
export const haalImportKlanten = (groupId: number) =>
  get<ImportProspect[]>(`/import/prospects?groupId=${groupId}`);
export const haalImportMedewerkers = (groupId: number) =>
  get<ImportEmployee[]>(`/import/employees?groupId=${groupId}`);
export const parseCsv = (csvData: string, groupId: number) =>
  post<CsvParseResult>('/import/csv', { csvData, groupId });

export const haalTeamMembers = () => get<TeamMember[]>('/team-members');

export const wijsGesprekToe = (phoneNumber: string, assignedToId: number | null, assignedToName: string | null) =>
  put<{ success: boolean }>(`/conversations/${encodeURIComponent(phoneNumber)}/assign`, { assignedToId, assignedToName });

export const updateLabels = (phoneNumber: string, labels: string[]) =>
  put<{ success: boolean }>(`/conversations/${encodeURIComponent(phoneNumber)}/labels`, { labels });

export const updateConversationCategory = (phoneNumber: string, category: 'candidate' | 'prospect' | 'unmatched' | null) =>
  put<{ success: boolean }>(`/conversations/${encodeURIComponent(phoneNumber)}/category`, { category });

export const haalNotities = (phoneNumber: string) =>
  get<InternalNote[]>(`/conversations/${encodeURIComponent(phoneNumber)}/notes`);

export const maakNotitie = (phoneNumber: string, body: string) =>
  post<InternalNote>(`/conversations/${encodeURIComponent(phoneNumber)}/notes`, { body });

export interface AiSettings {
  id: number;
  toneOfVoice: string;
  voiceExamples: string;
  guidelines: string;
  cancellationProtocol: string;
  extraContext: string;
  autoReplyEnabled: boolean;
  autoReplyOnlyForKnown: boolean;
  autoReplyMinIntervalSec: number;
  updatedAt: string;
}

export interface AiKnowledgeEntry {
  id: number;
  title: string;
  content: string;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string;
}

export const haalAiSettings = () => get<AiSettings>('/ai-settings');
export const updateAiSettings = (data: Partial<Omit<AiSettings, 'id' | 'updatedAt'>>) =>
  put<AiSettings>('/ai-settings', data);
export const vraagAiSuggestie = (messages: Message[], contactName?: string | null, contactCompany?: string | null, mode?: 'individual' | 'bulk', phoneNumber?: string | null) =>
  post<{ suggestion: string }>('/ai-suggest', { messages, contactName, contactCompany, mode: mode || 'individual', phoneNumber: phoneNumber || undefined });

export const haalAiKnowledge = () => get<AiKnowledgeEntry[]>('/ai-knowledge');
export const maakAiKnowledge = (data: { title: string; content: string; enabled?: boolean }) =>
  post<AiKnowledgeEntry>('/ai-knowledge', data);
export const updateAiKnowledge = (id: number, data: Partial<{ title: string; content: string; enabled: boolean; sortOrder: number }>) =>
  put<AiKnowledgeEntry>(`/ai-knowledge/${id}`, data);
export const verwijderAiKnowledge = (id: number) =>
  del(`/ai-knowledge/${id}`);

export type AiAttachmentFieldKey =
  | 'tone_of_voice'
  | 'voice_examples'
  | 'guidelines'
  | 'cancellation_protocol'
  | 'extra_context'
  | 'knowledge';

export interface AiAttachment {
  id: number;
  fieldKey: AiAttachmentFieldKey;
  knowledgeId: number | null;
  filename: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  extractedText: string;
  enabled: boolean;
  uploadedAt: string;
}

export const haalAiAttachments = () => get<AiAttachment[]>('/ai-attachments');

export const uploadAiAttachment = async (
  fieldKey: AiAttachmentFieldKey,
  file: File,
  knowledgeId?: number | null,
): Promise<AiAttachment> => {
  const fd = new FormData();
  fd.append('fieldKey', fieldKey);
  fd.append('file', file);
  if (knowledgeId != null) fd.append('knowledgeId', String(knowledgeId));
  const r = await fetch(`${BASE_URL}/ai-attachments`, {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || (data as any)?.error) throw new Error((data as any)?.error || `ai-attachments: ${r.status}`);
  return data as AiAttachment;
};

export const updateAiAttachment = (id: number, data: { enabled?: boolean; knowledgeId?: number | null }) =>
  put<AiAttachment>(`/ai-attachments/${id}`, data);

export const verwijderAiAttachment = (id: number) =>
  del(`/ai-attachments/${id}`);

// ─── Fase 1: Contacten ───────────────────────────────────────────────────────
export type WaContactType = 'sollicitant' | 'kandidaat' | 'medewerker';
export type WaOptInStatus = 'actief' | 'opt_out' | 'verzending_faalt';

export interface WaContact {
  contactType: WaContactType;
  contactId: number;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  language: string | null;
  functie: string | null;
  sourceStatus: string | null;
  whatsappOptInStatus: WaOptInStatus;
  whatsappOptInChangedAt: string | null;
  whatsappOptInReason: string | null;
}

export interface WaContactenLijst {
  total: number;
  items: WaContact[];
}

export interface WaContactenStats {
  sollicitant: { actief: number; opt_out: number; verzending_faalt: number; totaal: number };
  kandidaat:   { actief: number; opt_out: number; verzending_faalt: number; totaal: number };
  medewerker:  { actief: number; opt_out: number; verzending_faalt: number; totaal: number };
}

export interface WaContactenFilter {
  type?: 'alle' | WaContactType;
  opt_in?: 'alle' | WaOptInStatus;
  language?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export const haalContacten = (filter: WaContactenFilter = {}) => {
  const qs = new URLSearchParams();
  if (filter.type)     qs.set('type', filter.type);
  if (filter.opt_in)   qs.set('opt_in', filter.opt_in);
  if (filter.language) qs.set('language', filter.language);
  if (filter.q)        qs.set('q', filter.q);
  if (filter.page)     qs.set('page', String(filter.page));
  if (filter.pageSize) qs.set('pageSize', String(filter.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return get<WaContactenLijst>(`/contacten${suffix}`);
};

export const haalContactenStats = () => get<WaContactenStats>('/contacten/stats');

export const updateContactOptIn = (
  type: WaContactType,
  contactId: number,
  status: WaOptInStatus,
  reden?: string,
) => put<{ success: boolean; name: string | null; status: WaOptInStatus }>(
  `/contacten/${type}/${contactId}/opt-in`,
  { status, reden },
);

// ─── Fase 3E — bewerkbare profielvelden ──────────────────────────────────────

/**
 * De vijf functies uit candidateFunctionEnum. Ook de dropdown voor medewerkers
 * gebruikt deze lijst: employees.functie is vrije tekst, maar een vrij tekstveld
 * levert in de praktijk zes schrijfwijzen van hetzelfde woord op.
 */
export const WA_FUNCTIES = [
  'housekeeping', 'horecamedewerker', 'chef', 'frontoffice', 'logistiek',
] as const;
export type WaFunctie = typeof WA_FUNCTIES[number];

export const WA_FUNCTIE_LABELS: Record<WaFunctie, string> = {
  housekeeping: 'Housekeeping',
  horecamedewerker: 'Horeca',
  chef: 'Chef',
  frontoffice: 'Front office',
  logistiek: 'Logistiek',
};

/**
 * Statussen per brontabel. Gescheiden gehouden omdat het twee verschillende
 * enums zijn: een medewerker kan niet 'afgewezen' worden en een kandidaat niet
 * 'uitgestroomd'. `uitLijst` markeert de statussen waarbij het contact uit
 * /api/whatsapp/contacten valt — de UI waarschuwt daarvoor.
 */
export const WA_STATUSSEN: Record<'kandidaat' | 'medewerker', Array<{ waarde: string; label: string; uitLijst: boolean }>> = {
  kandidaat: [
    { waarde: 'in_behandeling', label: 'Sollicitant', uitLijst: false },
    { waarde: 'gepland', label: 'In kennismaking', uitLijst: false },
    { waarde: 'aangenomen', label: 'Aangenomen', uitLijst: true },
    { waarde: 'afgewezen', label: 'Afgewezen', uitLijst: true },
  ],
  medewerker: [
    { waarde: 'nieuw', label: 'Nieuw', uitLijst: false },
    { waarde: 'actief', label: 'Actief', uitLijst: false },
    { waarde: 'inactief', label: 'Inactief', uitLijst: true },
    { waarde: 'uitgestroomd', label: 'Uitgestroomd', uitLijst: true },
  ],
};

export interface WaProfielPatch {
  functie?: string;
  status?: string;
  phone?: string;
}

export interface WaProfielResultaat {
  success: boolean;
  contactId: number;
  name: string | null;
  phone: string | null;
  status: string | null;
  functie: string | null;
  /** true = deze status haalt het contact uit de WhatsApp-contactenlijst. */
  uitContactenlijst: boolean;
}

/** Schrijft functie/status/telefoon door naar het candidates- of employees-record. */
export const updateContactProfiel = (
  type: WaContactType,
  contactId: number,
  patch: WaProfielPatch,
) => put<WaProfielResultaat>(`/contacten/${type}/${contactId}/profiel`, patch);
