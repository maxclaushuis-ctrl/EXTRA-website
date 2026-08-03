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
 *   4. App-echo's (Meta Coexistence) → berichten die op de telefoon zelf zijn
 *      getypt, zodat het dashboard niet meer half-blind is
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
    /** Fase 3D: echo van een bericht dat op de telefoon zelf is getypt. */
    insertAppEcho(msg: any): Promise<number | null>;
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

      // 3. App-echo's (Meta Coexistence, veld smb_message_echoes).
      //
      // Dit zijn berichten die iemand in de WhatsApp-app op de telefoon zelf
      // heeft getypt. Zonder deze tak mist het dashboard precies die helft van
      // het gesprek: de klant ziet een antwoord, de planner in de inbox niet.
      // Berichten die wij via de Cloud API sturen zitten hier NIET in — die
      // sluit Meta expliciet uit, dus er ontstaat geen dubbele rij.
      //
      // Let op de richting: `from` is óns eigen nummer, `to` is de klant. Het
      // gesprek hangt dus aan `to`, niet aan `from` zoals bij inbound.
      if (Array.isArray(value.message_echoes)) {
        for (const echo of value.message_echoes) {
          try {
            const type: string = echo?.type || 'unknown';

            // Intrekken en bewerken: alleen loggen, zoals afgesproken. Beide
            // verwijzen naar een origineel bericht dat wij mogelijk nooit
            // hebben gezien (van vóór de koppeling), en er hangt geen weergave
            // in de inbox aan. Bewust géén update of delete op bestaande
            // rijen: dat is een datawijziging, en die hoort niet stilletjes
            // uit een webhook te komen.
            if (type === 'revoke' || type === 'edit') {
              const origineel = echo?.[type]?.original_message_id || '?';
              console.log(`${logPrefix} app-echo ${type} (origineel wa_message_id=${origineel}) → alleen gelogd, geen wijziging`);
              continue;
            }

            const toRaw = String(echo?.to || '');
            const normalizedTo = normalizePhone(toRaw);
            if (!normalizedTo) {
              console.warn(`${logPrefix} app-echo met ongeldig to-nummer: "${toRaw}"`);
              continue;
            }

            const at = echo.timestamp ? new Date(Number(echo.timestamp) * 1000) : new Date();

            let body_: string;
            let mediaUrl: string | null = null;
            let mediaMime: string | null = null;

            if (type === 'text') {
              body_ = echo.text?.body || '';
            } else if (['image', 'audio', 'document', 'video', 'sticker'].includes(type)) {
              body_ = storage.describeNonTextMessage(type, echo);
              mediaUrl = echo[type]?.id || null;
              mediaMime = echo[type]?.mime_type || null;
            } else {
              body_ = storage.describeNonTextMessage(type, echo);
            }

            // inbound: false — dit is een UITGAAND bericht. De ongelezen-teller
            // en last_inbound_at (waar de 24-uursklok op draait) blijven dus
            // ongemoeid; alleen de preview en het tijdstip in de lijst schuiven
            // mee, precies zoals bij een bericht uit het dashboard.
            const match = await storage.resolveAndUpsertConversation({
              phoneNumber: normalizedTo,
              inbound: false,
              bodyPreview: body_,
              at,
            });

            const inserted = await storage.insertAppEcho({
              direction: 'outbound',
              waMessageId: echo.id || null,
              fromNumber: 'extra', // ons eigen nummer; zelfde placeholder als bij dashboard-sends
              toNumber: normalizedTo,
              messageType: ['text', 'image', 'audio', 'document', 'video', 'location', 'sticker', 'contacts', 'interactive'].includes(type) ? type : 'unknown',
              body: body_,
              mediaUrl,
              mediaMimeType: mediaMime,
              rawPayload: echo,
              // Al verstuurd voordat wij ervan hoorden. Latere status-events
              // (delivered/read) komen gewoon binnen op hetzelfde wa_message_id.
              status: 'sent',
              candidateId: match.candidateId,
              prospectContactId: match.prospectContactId,
              matchCategory: match.category,
            });

            if (inserted === null) {
              console.log(`${logPrefix} duplicate app-echo wa_message_id=${echo.id} → skip`);
            } else {
              console.log(`${logPrefix} app-echo ${type} naar ${normalizedTo} → match=${match.category} (verstuurd vanaf de telefoon)`);
            }
          } catch (e: any) {
            console.error(`${logPrefix} fout bij verwerken app-echo:`, e?.message, e?.stack);
          }
        }
      }
    }
  } catch (e: any) {
    console.error(`${logPrefix} top-level fout:`, e?.message, e?.stack);
  }
}
