const BASE_URL = '/api/whatsapp';
const headers = { 'Content-Type': 'application/json' };

export interface Conversation {
  id: number;
  phoneNumber: string;
  candidateId: number | null;
  prospectContactId: number | null;
  matchCategory: 'candidate' | 'prospect' | 'unmatched';
  displayName: string | null;
  contactCompany: string | null;
  contactNotes: string | null;
  assignedToId: number | null;
  assignedToName: string | null;
  labels: string[] | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
  lastInboundAt: string | null;
}

export interface Message {
  id: number;
  direction: 'inbound' | 'outbound';
  waMessageId: string | null;
  fromNumber: string;
  toNumber: string;
  messageType: string;
  body: string | null;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  status: string;
  errorCode: string | null;
  errorMessage: string | null;
  matchCategory: 'candidate' | 'prospect' | 'unmatched';
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
export const haalGesprekken = (category?: 'candidate' | 'prospect' | 'unmatched') =>
  get<Conversation[]>(`/conversations${category ? `?category=${category}` : ''}`);
export const haalBerichten = (phoneNumber: string) =>
  get<Message[]>(`/conversations/${encodeURIComponent(phoneNumber)}/messages`);
export const markeerGelezen = (phoneNumber: string) =>
  post<{ success: boolean }>(`/conversations/${encodeURIComponent(phoneNumber)}/mark-read`);
export const stuurBericht = (nummer: string, tekst: string) =>
  post<{ success: boolean; messageId: string | null; dbId: number }>('/stuur', { nummer, tekst });

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
export const voegLedenToe = (id: number, members: Array<{ phoneNumber: string; displayName?: string }>) =>
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
  phone: string;
  functionType: string;
  status: string;
  city: string | null;
  alreadyInGroup: boolean;
}

export interface ImportProspect {
  id: number;
  name: string;
  phone: string;
  company: string | null;
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
