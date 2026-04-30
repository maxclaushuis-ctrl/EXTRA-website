// ─── SendGrid Inbound Parse handler — Blok 3 ────────────────────────────────────
// Verwerkt inkomende reply-mails (POST multipart/form-data van SendGrid Inbound Parse).
// Matcht het from-adres of In-Reply-To header op een prospect_contact / mail_send,
// slaat het bericht op in prospect_replies, en zet de pijplijn-fase op 'in_gesprek'.

import { storage } from './storage';
import type { MailSend, ProspectContact } from '@shared/schema';

export interface InboundPayload {
  // SendGrid Inbound Parse multipart fields
  from?: string;            // "Naam <adres@dom.nl>"
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  envelope?: string;        // JSON: { from, to: [..] }
  headers?: string;         // raw header block
  email?: string;           // raw RFC822 message (alleen indien 'send_raw' aan)
  charsets?: string;
  spam_score?: string;
  spam_report?: string;
  attachments?: string;
  [k: string]: any;
}

export interface ReplyResultaat {
  ok: boolean;
  reden?: string;
  replyId?: number;
  contactId?: number | null;
  campaignId?: number | null;
  mailSendId?: number | null;
}

const RE_EMAIL = /<([^>]+)>|([\w.\-+]+@[\w.\-]+\.[A-Za-z]{2,})/;
const RE_HEADER_INREPLYTO = /^\s*In-Reply-To:\s*(<[^>]+>)/im;
const RE_HEADER_REFERENCES = /^\s*References:\s*([^\r\n]+)/im;

function parseEmailAddress(raw: string | undefined): { email: string | null; name: string | null } {
  if (!raw) return { email: null, name: null };
  const m = raw.match(RE_EMAIL);
  const email = (m?.[1] || m?.[2] || '').trim().toLowerCase() || null;
  const namePart = email ? raw.replace(/<[^>]+>/, '').replace(email, '').trim().replace(/^"|"$/g, '').trim() : null;
  return { email, name: namePart || null };
}

function extractMessageIds(headers: string | undefined): { inReplyTo: string | null; references: string[] } {
  if (!headers) return { inReplyTo: null, references: [] };
  const ir = headers.match(RE_HEADER_INREPLYTO);
  const ref = headers.match(RE_HEADER_REFERENCES);
  const refList = ref ? Array.from(ref[1].matchAll(/<[^>]+>/g)).map(m => m[0]) : [];
  return { inReplyTo: ir?.[1] || null, references: refList };
}

function stripAngleBrackets(id: string | null): string | null {
  if (!id) return null;
  return id.replace(/^<|>$/g, '').trim();
}

// Probeert een mail_send te vinden op basis van In-Reply-To of References headers.
// SendGrid hangt soms iets achter de message-id; we proberen verschillende varianten.
async function vindMailSendUitHeaders(inReplyTo: string | null, references: string[]): Promise<MailSend | null> {
  const candidates: string[] = [];
  if (inReplyTo) candidates.push(stripAngleBrackets(inReplyTo) || '');
  for (const r of references) candidates.push(stripAngleBrackets(r) || '');
  for (const cand of candidates) {
    if (!cand) continue;
    const ms = await storage.getMailSendBySgMessageId(cand);
    if (ms) return ms;
    // Probeer ook zonder eventueel domain-deel na een '@' (sg message-ids zijn vaak puur)
    const base = cand.split('@')[0];
    if (base !== cand) {
      const ms2 = await storage.getMailSendBySgMessageId(base);
      if (ms2) return ms2;
    }
  }
  return null;
}

async function vindContactOpEmail(email: string): Promise<ProspectContact | null> {
  try {
    const all = await storage.getProspectContacts({ search: email, limit: 5 } as any);
    const lower = email.toLowerCase();
    return all.find(c => (c.email || '').toLowerCase() === lower) || null;
  } catch {
    return null;
  }
}

export async function verwerkInboundReply(payload: InboundPayload): Promise<ReplyResultaat> {
  const fromParsed = parseEmailAddress(payload.from);
  if (!fromParsed.email) {
    return { ok: false, reden: 'Geen geldig from-adres' };
  }

  // Header-info parsen voor message-id correlatie
  const { inReplyTo, references } = extractMessageIds(payload.headers);
  const linkedSend = await vindMailSendUitHeaders(inReplyTo, references);

  // Contact-resolutie: eerst via mail_send.contactId, anders match op email
  let contact: ProspectContact | null = null;
  if (linkedSend?.contactId) {
    contact = (await storage.getProspectContact(linkedSend.contactId)) || null;
  }
  if (!contact) {
    contact = await vindContactOpEmail(fromParsed.email);
  }

  // Negeer auto-replies als ze afkomstig zijn van mailer-daemons of out-of-office
  const subj = (payload.subject || '').toLowerCase();
  const isAutoReply = /^(out\s*of\s*office|automatic reply|automatisch antwoord|auto-reply|delivery status notification|undeliver)/i.test(subj)
    || /mailer-daemon|postmaster|noreply|no-reply/i.test(fromParsed.email);

  const reply = await storage.createProspectReply({
    contactId: contact?.id ?? null,
    campaignId: linkedSend?.campaignId ?? null,
    mailSendId: linkedSend?.id ?? null,
    fromEmail: fromParsed.email,
    fromName: fromParsed.name,
    subject: payload.subject || null,
    bodyText: payload.text || null,
    bodyHtml: payload.html || null,
    inReplyTo: stripAngleBrackets(inReplyTo),
    rawEnvelope: {
      envelope: payload.envelope || null,
      to: payload.to || null,
      headers: payload.headers ? String(payload.headers).slice(0, 8000) : null,
      autoReply: isAutoReply,
      spamScore: payload.spam_score || null,
    } as any,
  } as any);

  // Autonome side-effects bij echte (niet-auto) replies:
  if (!isAutoReply) {
    if (linkedSend) {
      try {
        await storage.updateMailSend(linkedSend.id, { replyAt: new Date() } as any);
        await storage.incrementCampaignCounter(linkedSend.campaignId, 'replyCount');
      } catch (err) {
        console.warn('[Inbound] kon mail_send niet updaten met replyAt', err);
      }
    }
    if (contact) {
      try {
        await storage.updateProspectContact(contact.id, {
          phase: 'in_gesprek',
          lastReplyAt: new Date(),
        } as any);
      } catch (err) {
        console.warn('[Inbound] kon contact niet updaten met phase=in_gesprek', err);
      }

      // Blok 4: stop alle lopende flows voor dit contact direct (real-time auto-stop).
      try {
        const { stopFlowsBijReply } = await import('./flowEngine');
        const res = await stopFlowsBijReply(contact.id, 'reply_ontvangen');
        if (res.gestopt > 0) {
          console.log(`[Inbound] ${res.gestopt} actieve flow(s) gestopt voor contact ${contact.id} na reply`);
        }
      } catch (err) {
        console.warn('[Inbound] auto-stop flows mislukte:', err);
      }
    }
  }

  return {
    ok: true,
    replyId: reply.id,
    contactId: contact?.id ?? null,
    campaignId: linkedSend?.campaignId ?? null,
    mailSendId: linkedSend?.id ?? null,
  };
}
