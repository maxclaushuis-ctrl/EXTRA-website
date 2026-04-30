// ─── SendGrid Event-webhook handler — Blok 3 ────────────────────────────────────
// Verwerkt inkomende event-payloads van SendGrid (delivered, open, click, bounce,
// spamreport, dropped, deferred, processed, unsubscribe, group_unsubscribe).
// Idempotent op sg_event_id, en met automatische fase-overgang bij bounce/spam.

import { storage } from './storage';
import type { InsertSendgridEventLog, MailSend } from '@shared/schema';

// Genormaliseerd event van SendGrid (subset van het echte schema)
export interface SgEvent {
  email?: string;
  timestamp?: number;          // Unix seconds
  event?: string;              // delivered|open|click|bounce|spamreport|dropped|deferred|processed|unsubscribe|group_unsubscribe
  sg_event_id?: string;
  sg_message_id?: string;
  reason?: string;             // bij bounce/dropped
  type?: string;               // bij bounce: 'bounce' | 'blocked'
  url?: string;                // bij click
  useragent?: string;
  ip?: string;
  // CustomArgs die wij mee-stuurden bij verzenden
  mail_send_id?: string | number;
  campaign_id?: string | number;
  contact_id?: string | number;
  variant?: string;
  [k: string]: any;
}

export interface VerwerkResultaat {
  ontvangen: number;
  verwerkt: number;
  duplicaten: number;
  onbekend: number;
  fouten: number;
  per_event: Record<string, number>;
}

function asInt(v: any): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function eventTimestampToDate(ts: any): Date | null {
  const n = asInt(ts);
  if (!n) return null;
  return new Date(n * 1000);
}

// Probeert de bijbehorende mail_send te vinden:
// 1) via customArg `mail_send_id` (meest betrouwbaar)
// 2) via sg_message_id (gegokt uit reply: alleen exacte match)
async function resolveMailSend(ev: SgEvent): Promise<MailSend | null> {
  const directId = asInt(ev.mail_send_id);
  if (directId) {
    const ms = await storage.getMailSend(directId);
    if (ms) return ms;
  }
  if (ev.sg_message_id) {
    // SendGrid duwt soms een suffix achter message-id (bijv. ".filterdrecv-..."). Strip alles na de eerste punt.
    const base = String(ev.sg_message_id).split('.')[0];
    const ms = await storage.getMailSendBySgMessageId(base);
    if (ms) return ms;
    const msFull = await storage.getMailSendBySgMessageId(String(ev.sg_message_id));
    if (msFull) return msFull;
  }
  return null;
}

// Bepaalt of een bounce hard of soft is. SendGrid 'bounce' = hard, 'blocked' = soft.
function isHardBounce(ev: SgEvent): boolean {
  const t = (ev.type || '').toLowerCase();
  if (t === 'bounce') return true;
  if (t === 'blocked') return false;
  // Fallback op reden: 5xx codes = hard
  const r = (ev.reason || '').match(/\b5\d{2}\b/);
  return !!r;
}

export async function verwerkSendgridEvents(events: SgEvent[]): Promise<VerwerkResultaat> {
  const stats: VerwerkResultaat = {
    ontvangen: events.length, verwerkt: 0, duplicaten: 0, onbekend: 0, fouten: 0, per_event: {},
  };

  for (const ev of events) {
    const eventType = (ev.event || '').toLowerCase();
    if (!eventType || !ev.sg_event_id) {
      stats.onbekend++;
      continue;
    }
    stats.per_event[eventType] = (stats.per_event[eventType] || 0) + 1;

    try {
      const mailSend = await resolveMailSend(ev);
      const occurredAt = eventTimestampToDate(ev.timestamp);

      const logEntry: InsertSendgridEventLog = {
        sgEventId: String(ev.sg_event_id),
        sgMessageId: ev.sg_message_id ? String(ev.sg_message_id) : null,
        event: eventType,
        email: ev.email ? String(ev.email).toLowerCase() : null,
        mailSendId: mailSend?.id ?? null,
        campaignId: mailSend?.campaignId ?? (asInt(ev.campaign_id) ?? null),
        contactId: mailSend?.contactId ?? (asInt(ev.contact_id) ?? null),
        payload: ev as any,
        occurredAt,
      };

      const created = await storage.createSendgridEvent(logEntry);
      if (!created) {
        stats.duplicaten++;
        continue; // al verwerkt
      }
      stats.verwerkt++;

      if (!mailSend) {
        // Onbekend; niets meer te doen voor mail_send / contact updates
        continue;
      }

      await applyEventEffect(eventType, ev, mailSend, occurredAt);
    } catch (err) {
      stats.fouten++;
      console.error('[SgEventHandler] fout bij verwerken event:', err);
    }
  }

  return stats;
}

async function applyEventEffect(
  eventType: string,
  ev: SgEvent,
  mailSend: MailSend,
  occurredAt: Date | null,
): Promise<void> {
  const stamp = occurredAt || new Date();

  switch (eventType) {
    case 'delivered': {
      if (!mailSend.deliveredAt) {
        await storage.updateMailSend(mailSend.id, { deliveredAt: stamp } as any);
        await storage.incrementCampaignCounter(mailSend.campaignId, 'deliveredCount');
      }
      await storage.createMailEvent({ mailSendId: mailSend.id, type: 'delivered', timestamp: stamp, ipAdres: ev.ip || null } as any);
      break;
    }

    case 'open': {
      // Voorkom dubbele open-tellers per send
      const isFirstOpen = !mailSend.deliveredAt || true; // we tellen open per event, niet per uniek
      await storage.createMailEvent({
        mailSendId: mailSend.id, type: 'open', timestamp: stamp, ipAdres: ev.ip || null,
      } as any);
      // open_count alleen optellen voor uniek-per-send: check of er al een open-event was
      const existing = await storage.getMailEventsByMailSend(mailSend.id);
      const opens = existing.filter(e => e.type === 'open').length;
      if (opens <= 1) {
        await storage.incrementCampaignCounter(mailSend.campaignId, 'openCount');
      }
      void isFirstOpen;
      break;
    }

    case 'click': {
      await storage.createMailEvent({
        mailSendId: mailSend.id, type: 'click', timestamp: stamp, url: ev.url || null, ipAdres: ev.ip || null,
      } as any);
      const existing = await storage.getMailEventsByMailSend(mailSend.id);
      const clicks = existing.filter(e => e.type === 'click').length;
      if (clicks <= 1) {
        await storage.incrementCampaignCounter(mailSend.campaignId, 'clickCount');
      }
      break;
    }

    case 'bounce': {
      const hard = isHardBounce(ev);
      await storage.updateMailSend(mailSend.id, {
        bouncedAt: stamp,
        bounceType: hard ? 'bounce' : 'blocked',
        bounceReason: ev.reason || null,
      } as any);
      await storage.incrementCampaignCounter(mailSend.campaignId, 'bounceCount');
      await storage.createMailEvent({ mailSendId: mailSend.id, type: 'bounce', timestamp: stamp } as any);
      // Hard bounce → contact uitsluiten van toekomstige campagnes
      if (hard && mailSend.contactId) {
        try {
          await storage.updateProspectContact(mailSend.contactId, {
            bounceStatus: 'hard',
            lastBounceAt: stamp,
            bounceReden: ev.reason || null,
            phase: 'uitgesloten',
          } as any);
          // Blok 4: stop alle lopende flows direct.
          const { stopFlowsBijReply } = await import('./flowEngine');
          await stopFlowsBijReply(mailSend.contactId, 'hard_bounce');
        } catch (err) {
          console.warn('[SgEventHandler] kon contact niet updaten bij hard bounce', err);
        }
      } else if (mailSend.contactId) {
        try {
          await storage.updateProspectContact(mailSend.contactId, {
            bounceStatus: 'soft', lastBounceAt: stamp, bounceReden: ev.reason || null,
          } as any);
        } catch {}
      }
      break;
    }

    case 'spamreport': {
      await storage.updateMailSend(mailSend.id, { spamReportedAt: stamp } as any);
      await storage.incrementCampaignCounter(mailSend.campaignId, 'spamCount');
      await storage.createMailEvent({ mailSendId: mailSend.id, type: 'spamreport', timestamp: stamp } as any);
      if (mailSend.contactId) {
        try {
          await storage.updateProspectContact(mailSend.contactId, {
            spamReported: true, spamReportedAt: stamp, phase: 'uitgesloten',
          } as any);
          // Blok 4: stop alle lopende flows direct.
          const { stopFlowsBijReply } = await import('./flowEngine');
          await stopFlowsBijReply(mailSend.contactId, 'spam_gemeld');
        } catch {}
      }
      break;
    }

    case 'dropped': {
      await storage.updateMailSend(mailSend.id, {
        droppedAt: stamp, droppedReason: ev.reason || null,
      } as any);
      await storage.createMailEvent({ mailSendId: mailSend.id, type: 'dropped', timestamp: stamp } as any);
      break;
    }

    case 'unsubscribe':
    case 'group_unsubscribe': {
      await storage.createMailEvent({ mailSendId: mailSend.id, type: 'unsubscribe', timestamp: stamp } as any);
      if (mailSend.contactId) {
        try {
          await storage.updateProspectContact(mailSend.contactId, {
            unsubscribed: true, contactStatus: 'uitgeschreven', phase: 'uitgesloten',
          } as any);
          // Blok 4: stop alle lopende flows direct.
          const { stopFlowsBijReply } = await import('./flowEngine');
          await stopFlowsBijReply(mailSend.contactId, 'uitgeschreven');
        } catch {}
      }
      break;
    }

    case 'deferred':
    case 'processed':
    default: {
      await storage.createMailEvent({ mailSendId: mailSend.id, type: eventType, timestamp: stamp } as any);
      break;
    }
  }
}
