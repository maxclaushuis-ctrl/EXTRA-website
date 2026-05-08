/**
 * Helper voor het versturen van WhatsApp template-berichten via 360dialog
 * (Cloud API). Templates zijn verplicht buiten het 24-uurs customer-care
 * window — we gebruiken ze hier voor automatische follow-ups (bv. de
 * Calendly-reminder na 3 dagen) én eventueel handmatige test-verstuur.
 *
 * Persistentie loopt via dezelfde whatsapp_messages-tabel als gewone outbound,
 * zodat de berichten in de inbox / het audit-spoor opduiken.
 */
import * as waStorage from './storage';
import { normalizePhone } from './phone';

const WA_BASE_URL = process.env.WHATSAPP_360_BASE_URL || 'https://waba-v2.360dialog.io';
const WA_360_KEY = process.env.WHATSAPP_360_API_KEY || '';

// ─── Template-register ────────────────────────────────────────────────────────
// Vul hier de exacte (door META goedgekeurde) template-namen + taalcodes in.
// Zodra de NL-variant approved is, vul je 'nl' in (nu null = niet beschikbaar).
export type Taal = 'nl' | 'en';

interface TemplateConfig {
  name: string;
  language: string;     // BCP-47 / 360dialog code, bv. 'nl', 'en', 'en_US'
}

const CALENDLY_REMINDER_TEMPLATES: Record<Taal, TemplateConfig | null> = {
  nl: { name: 'gesprek_inplannen_reminder', language: 'nl' },
  en: { name: 'interview_scheduling_reminder', language: 'en' },
};

/** Geeft de template terug die we voor deze taal willen gebruiken, met fallback. */
function kiesCalendlyTemplate(taal: Taal): { config: TemplateConfig; gebruikteTaal: Taal } {
  const directe = CALENDLY_REMINDER_TEMPLATES[taal];
  if (directe) return { config: directe, gebruikteTaal: taal };
  // Fallback: probeer EN, anders NL
  const en = CALENDLY_REMINDER_TEMPLATES.en;
  if (en) return { config: en, gebruikteTaal: 'en' };
  const nl = CALENDLY_REMINDER_TEMPLATES.nl;
  if (nl) return { config: nl, gebruikteTaal: 'nl' };
  throw new Error('Geen Calendly-reminder-template geconfigureerd');
}

/** Bepaalt de juiste taal op basis van het `language`-veld op een kandidaat. */
export function bepaalTaal(language: string | null | undefined): Taal {
  const v = (language || '').trim().toLowerCase();
  if (!v) return 'nl';
  if (v.startsWith('ned') || v === 'nl' || v === 'dutch' || v === 'nederlands') return 'nl';
  return 'en';
}

export interface CalendlyReminderResultaat {
  success: boolean;
  waMessageId?: string | null;
  dbId?: number;
  error?: string;
  gebruikteTaal?: Taal;
}

/**
 * Verstuur een WhatsApp Calendly-reminder naar een kandidaat.
 * Persisteert direct in whatsapp_messages (queued → sent/failed).
 */
export async function stuurCalendlyReminderTemplate(args: {
  phone: string;
  voornaam: string;
  taal: Taal;
  candidateId: number;
  triggeredByUserId?: number | null;
}): Promise<CalendlyReminderResultaat> {
  if (!WA_360_KEY) return { success: false, error: 'WHATSAPP_360_API_KEY niet ingesteld' };

  const normalized = normalizePhone(args.phone);
  if (!normalized) return { success: false, error: 'Ongeldig telefoonnummer' };

  const { config, gebruikteTaal } = kiesCalendlyTemplate(args.taal);

  const voornaam = (args.voornaam || '').trim() || 'daar';

  const payload = {
    messaging_product: 'whatsapp',
    to: normalized,
    type: 'template',
    template: {
      name: config.name,
      language: { code: config.language },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: voornaam }],
        },
      ],
    },
  };

  // 1. Conversation upsert + queued-rij in DB.
  const now = new Date();
  const match = await waStorage.resolveAndUpsertConversation({
    phoneNumber: normalized,
    inbound: false,
    bodyPreview: `[template:${config.name}] Hi ${voornaam}, …`,
    at: now,
  });

  const messageRowId = await waStorage.insertOutboundQueued({
    direction: 'outbound',
    fromNumber: 'extra',
    toNumber: normalized,
    messageType: 'template',
    body: `[template:${config.name}/${config.language}] Hi ${voornaam}, …`,
    candidateId: match.candidateId ?? args.candidateId,
    prospectContactId: match.prospectContactId,
    matchCategory: match.category,
    sentByUserId: args.triggeredByUserId ?? null,
    rawPayload: payload as any,
  });

  // 2. API-call.
  try {
    const r = await fetch(`${WA_BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'D360-API-KEY': WA_360_KEY },
      body: JSON.stringify(payload),
    });
    const responseText = await r.text();
    let data: any = {};
    try { data = JSON.parse(responseText); } catch { /* niet-JSON */ }

    if (!r.ok || data?.error || data?.meta?.success === false) {
      const errorMsg = data?.meta?.developer_message || data?.error?.message || data?.error || data?.message || responseText.slice(0, 500);
      const errorCode = data?.error?.code ? String(data.error.code) : String(r.status);
      const errorString = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
      await waStorage.updateOutboundResult(messageRowId, {
        status: 'failed',
        errorCode,
        errorMessage: errorString,
      });
      return { success: false, error: `360dialog: ${errorString}`, dbId: messageRowId, gebruikteTaal };
    }

    const waMessageId = data?.messages?.[0]?.id ?? null;
    await waStorage.updateOutboundResult(messageRowId, { waMessageId, status: 'sent' });
    return { success: true, waMessageId, dbId: messageRowId, gebruikteTaal };
  } catch (err: any) {
    await waStorage.updateOutboundResult(messageRowId, {
      status: 'failed',
      errorCode: 'network_error',
      errorMessage: err?.message || String(err),
    });
    return { success: false, error: err?.message || String(err), dbId: messageRowId, gebruikteTaal };
  }
}
