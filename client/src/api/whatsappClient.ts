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
export const haalStats = () => get<Stats>('/stats');
export const haalWebhookStatus = () => get<WebhookStatus>('/webhook-status');
export const registreerWebhook = (url?: string) =>
  post<{ success: boolean; url: string }>('/registreer-webhook', { url });

export const updateContactInfo = (phoneNumber: string, data: { displayName: string; contactCompany?: string; contactNotes?: string }) =>
  put<{ success: boolean }>(`/conversations/${encodeURIComponent(phoneNumber)}/contact-info`, data);
