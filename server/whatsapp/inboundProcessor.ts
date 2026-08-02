/**
 * Gedeelde verwerkingslogica voor inkomende WhatsApp webhook-payloads.
 *
 * Wordt gebruikt door BEIDE webhooks:
 *   - POST /api/whatsapp/webhook/:secret   (360dialog — plat formaat óf entry[])
 *   - POST /api/whatsapp/meta-webhook      (Meta Cloud API — altijd entry[])
 *
 * Verantwoordelijk voor:
 *   1. Unwrappen van het Meta entry[]-formaat naar losse "value"-objecten
 *   2. Status-events → applyStatusEvent, incl. failed + blocked → opt-out
 *   3. Inkomende berichten → normalisatie, matching, idempotente insert,
 *      conversation-upsert, STOP-detectie, auto-reply-trigger
 *
 * Dependencies zijn injecteerbaar (voor unit-tests zonder database); zonder
 * expliciete deps worden de echte modules lazy geïmporteerd.
 */

export interface InboundMatch {
  candidateId: number | null;
  prospectContactId: number | null;
  category: 'candidate' | 'prospect' | 'unmatched';
  displayName?: string | null;
}

export interface AutoReplyArgs {
  phoneNumber: string;
  matchCategory: 'candidate' | 'prospect' | 'unmatched';
  candidateId: number | null;
  prospectContactId: number | null;
  contactName: string | null;
  /**
   * Fase 3B: rij-id van het INKOMENDE bericht waar dit op reageert. Een taak
   * die hieruit volgt hangt daaraan vast, zodat hetzelfde bericht nooit twee
   * taken kan opleveren (unieke index op source_message_id).
   */
  inboundMessageId?: number | null;
}

export interface InboundProcessorDeps {
  storage: {
    applyStatusEvent(waMessageId: string, status: string, errorCode?: string, errorMessage?: string): Promise<boolean>;
    resolveAndUpsertConversation(args: { phoneNumber: string; inbound: boolean; bodyPreview: string; at: Date }): Promise<InboundMatch>;
    insertInboundMessage(msg: any): Promise<number | null>;
    describeNonTextMessage(type: string, msg: any): string;
  };
  optInService: {
    isBlockedByUserError(errorCode?: string | null, errorMessage?: string | null): boolean;
    findConversationContact(phoneNumber: string): Promise<{ candidateId: number | null; prospectContactId: number | null }>;
    handleBlockedByUser(args: { phoneNumber: string; candidateId: number | null; prospectContactId: number | null; errorCode?: string | null; errorMessage?: string | null }): Promise<void>;
    isStopMessage(text: string | null | undefined): boolean;
    handleIncomingStop(args: { phoneNumber: string; candidateId: number | null; prospectContactId: number | null; matchCategory: 'candidate' | 'prospect' | 'unmatched'; contactName: string | null; rawBody: string }): Promise<void>;
  };
  normalizePhone(raw: string): string | null;
  /** Auto-reply-trigger; optioneel (bv. uit in tests). */
  tryAutoReply?: (opts: AutoReplyArgs) => Promise<void>;
  /** Log-prefix, bv. '[WA webhook]' of '[WA meta-webhook]'. */
  logPrefix?: string;
}

async function defaultDeps(): Promise<InboundProcessorDeps> {
  const storage = await import('./storage');
  const optInService = await import('./optInService');
  const { normalizePhone } = await import('./phone');
  return { storage, optInService, normalizePhone };
}

/**
 * Unwrap: Meta/Cloud API stuurt { object, entry: [{ changes: [{ value: {...} }] }] };
 * 360dialog stuurt (meestal) direct het platte value-object. Geeft alle
 * value-objecten terug die verwerkt moeten worden.
 */
export function extractWebhookValues(body: any): any[] {
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body.entry)) {
    const values: any[] = [];
    for (const entry of body.entry) {
      for (const change of entry?.changes ?? []) {
        if (change?.value) values.push(change.value);
      }
    }
    return values;
  }
  return [body];
}

/**
 * Verwerk één webhook-payload (plat 360dialog-formaat of Meta entry[]-formaat).
 * Gooit nooit — alle fouten worden gelogd zodat de webhook altijd 200 kan
 * teruggeven (Meta/360dialog mogen niet blijven retryen op interne fouten).
 */
export async function processIncomingPayload(
  body: any,
  deps?: Partial<InboundProcessorDeps>,
): Promise<void> {
  const base = (deps?.storage && deps?.optInService && deps?.normalizePhone)
    ? (deps as InboundProcessorDeps)
    : { ...(await defaultDeps()), ...deps };
  const { storage, optInService, normalizePhone, tryAutoReply } = base;
  const logPrefix = base.logPrefix || '[WA webhook]';

  try {
    const values = extractWebhookValues(body);
    if (Array.isArray(body?.entry) && values.length > 0) {
      console.log(`${logPrefix} Cloud API entry-format gedetecteerd, unwrapping… (${values.length} value(s))`);
    }

    for (const value of values) {
      // 1. Status-events (sent/delivered/read/failed)
      if (Array.isArray(value.statuses)) {
        for (const s of value.statuses) {
          try {
            const id = s?.id;
            const status = s?.status; // sent | delivered | read | failed
            if (!id || !status) continue;
            const errCode = s?.errors?.[0]?.code ? String(s.errors[0].code) : undefined;
            const errMsg  = s?.errors?.[0]?.title || s?.errors?.[0]?.message;
            const updated = await storage.applyStatusEvent(id, status, errCode, errMsg);
            if (!updated) {
              console.log(`${logPrefix} status-event voor onbekend wa_message_id=${id} (${status})`);
              continue;
            }
            // Fase 1: Meta error → opt-out detectie. Bij failed delivery met
            // "user blocked"-signaal zetten we de bijbehorende contacten op opt_out.
            if (status === 'failed' && optInService.isBlockedByUserError(errCode, errMsg)) {
              try {
                const recipient = String(s?.recipient_id || '');
                const normalized = recipient ? (normalizePhone(recipient) || recipient) : '';
                if (normalized) {
                  const ids = await optInService.findConversationContact(normalized);
                  await optInService.handleBlockedByUser({
                    phoneNumber: normalized,
                    candidateId: ids.candidateId,
                    prospectContactId: ids.prospectContactId,
                    errorCode: errCode,
                    errorMessage: errMsg,
                  });
                }
              } catch (e: any) {
                console.error(`${logPrefix} blocked-by-user-handler error:`, e?.message);
              }
            }
          } catch (e: any) {
            console.error(`${logPrefix} fout bij status-event:`, e?.message);
          }
        }
      }

      // 2. Inkomende berichten
      if (Array.isArray(value.messages)) {
        const contactProfile = value?.contacts?.[0]?.profile?.name as string | undefined;

        for (const msg of value.messages) {
          try {
            const fromRaw = String(msg.from || '');
            const normalizedFrom = normalizePhone(fromRaw);
            if (!normalizedFrom) {
              console.warn(`${logPrefix} ongeldig from-nummer: "${fromRaw}"`);
              continue;
            }

            const at = msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date();
            const type: string = msg.type || 'unknown';

            let body_: string;
            let mediaUrl: string | null = null;
            let mediaMime: string | null = null;

            if (type === 'text') {
              body_ = msg.text?.body || '';
            } else if (['image', 'audio', 'document', 'video', 'sticker'].includes(type)) {
              body_ = storage.describeNonTextMessage(type, msg);
              mediaUrl = msg[type]?.id || null; // media-id; download-URL haal je later op via de media-API
              mediaMime = msg[type]?.mime_type || null;
            } else {
              body_ = storage.describeNonTextMessage(type, msg);
            }

            const match = await storage.resolveAndUpsertConversation({
              phoneNumber: normalizedFrom,
              inbound: true,
              bodyPreview: body_,
              at,
            });

            const inserted = await storage.insertInboundMessage({
              direction: 'inbound',
              waMessageId: msg.id || null,
              fromNumber: normalizedFrom,
              toNumber: 'extra',
              messageType: ['text', 'image', 'audio', 'document', 'video', 'location', 'sticker', 'contacts', 'interactive'].includes(type) ? type : 'unknown',
              body: body_,
              mediaUrl,
              mediaMimeType: mediaMime,
              rawPayload: msg,
              status: 'received',
              candidateId: match.candidateId,
              prospectContactId: match.prospectContactId,
              matchCategory: match.category,
            });

            if (inserted === null) {
              console.log(`${logPrefix} duplicate wa_message_id=${msg.id} → skip`);
            } else {
              console.log(`${logPrefix} inbound ${type} van ${normalizedFrom} → match=${match.category} (${contactProfile || '?'})`);

              // Fase 1: STOP-detectie. Bij een opt-out keyword:
              //   - opt-in op 'opt_out' zetten voor candidate/employee/prospect
              //   - interne notitie aanmaken voor de planner
              //   - GEEN auto-reply sturen
              const isStop = type === 'text' && body_ && optInService.isStopMessage(body_);
              if (isStop) {
                optInService.handleIncomingStop({
                  phoneNumber: normalizedFrom,
                  candidateId: match.candidateId,
                  prospectContactId: match.prospectContactId,
                  matchCategory: match.category,
                  contactName: contactProfile || null,
                  rawBody: body_,
                }).catch((e: any) => console.error(`${logPrefix} STOP-handler error:`, e?.message));
              } else if (type === 'text' && body_ && tryAutoReply) {
                // Auto-reply alleen voor tekstberichten (geen audio/image/etc.) en
                // alleen als het géén STOP-bericht is.
                tryAutoReply({
                  phoneNumber: normalizedFrom,
                  matchCategory: match.category,
                  candidateId: match.candidateId,
                  prospectContactId: match.prospectContactId,
                  contactName: contactProfile || null,
                  inboundMessageId: inserted,
                }).catch((e: any) => console.error(`${logPrefix} auto-reply error:`, e?.message));
              }
            }
          } catch (e: any) {
            console.error(`${logPrefix} fout bij verwerken message:`, e?.message, e?.stack);
          }
        }
      }
    }
  } catch (e: any) {
    console.error(`${logPrefix} top-level fout:`, e?.message, e?.stack);
  }
}
