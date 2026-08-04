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
    /** Haalt een gesprek uit de "wacht op planner"-wachtrij. */
    clearEscalation(phoneNumber: string): Promise<void>;
    describeNonTextMessage(type: string, msg: any): string;
    /** Koppelt een gedownload bestand aan een bericht (laat media_url ongemoeid). */
    updateMessageMedia(id: number, media: { objectPath: string; mimeType?: string | null; filename?: string | null }): Promise<void>;
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
  /**
   * Media binnenhalen bij de provider en in Object Storage zetten. Injecteerbaar
   * zodat tests geen netwerk en geen bucket nodig hebben.
   */
  haalMediaOpEnBewaar?: (args: {
    mediaId: string;
    type: string;
    mimeTypeUitPayload?: string | null;
    filenameUitPayload?: string | null;
    waMessageId?: string | null;
  }) => Promise<{ ok: boolean; objectPath?: string; mimeType?: string; filename?: string; fout?: string }>;
  /** Log-prefix, bv. '[WA webhook]' of '[WA meta-webhook]'. */
  logPrefix?: string;
}

async function defaultDeps(): Promise<InboundProcessorDeps> {
  const storage = await import('./storage');
  const optInService = await import('./optInService');
  const { normalizePhone } = await import('./phone');
  const { haalMediaOpEnBewaar } = await import('./mediaService');
  return { storage, optInService, normalizePhone, haalMediaOpEnBewaar };
}

/** Types waarvan Meta een media-id meestuurt dat wij kunnen ophalen. */
const MEDIA_TYPES = ['image', 'audio', 'document', 'video', 'sticker'];

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
  const { storage, optInService, normalizePhone, tryAutoReply, haalMediaOpEnBewaar } = base;
  const logPrefix = base.logPrefix || '[WA webhook]';

  /**
   * Bestand ophalen en aan het bericht koppelen. Bewust ná de insert en in een
   * eigen try/catch: een mislukte download mag nooit het opslaan van het
   * bericht zelf blokkeren. Lukt het niet, dan blijft de tekstbeschrijving
   * staan en zit het ruwe media-id nog in media_url voor diagnose.
   */
  async function bewaarMedia(args: {
    messageId: number;
    mediaId: string;
    type: string;
    mimeTypeUitPayload?: string | null;
    filenameUitPayload?: string | null;
    waMessageId?: string | null;
  }): Promise<void> {
    if (!haalMediaOpEnBewaar) return;
    try {
      const res = await haalMediaOpEnBewaar({
        mediaId: args.mediaId,
        type: args.type,
        mimeTypeUitPayload: args.mimeTypeUitPayload,
        filenameUitPayload: args.filenameUitPayload,
        waMessageId: args.waMessageId,
      });
      if (!res.ok || !res.objectPath) {
        console.warn(`${logPrefix} media ${args.type} (media_id=${args.mediaId}) niet opgehaald: ${res.fout || 'onbekende fout'}`);
        return;
      }
      await storage.updateMessageMedia(args.messageId, {
        objectPath: res.objectPath,
        mimeType: res.mimeType,
        filename: res.filename,
      });
      console.log(`${logPrefix} media ${args.type} opgeslagen → ${res.objectPath}`);
    } catch (err: any) {
      console.warn(`${logPrefix} media ${args.type} (media_id=${args.mediaId}) mislukt: ${err?.message || err}`);
    }
  }

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

            // Intrekken en bewerken: alleen loggen — dezelfde afspraak als bij
            // de app-echo's hieronder. Zonder deze guard viel een 'edit' door
            // naar de default van describeNonTextMessage en belandde er een
            // kaal "[edit]" in de inbox, zonder enige context over welk
            // bericht er dan bewerkt was.
            if (type === 'revoke' || type === 'edit') {
              const origineel = msg?.[type]?.original_message_id || '?';
              console.log(`${logPrefix} inkomende ${type} (origineel wa_message_id=${origineel}) → alleen gelogd, geen wijziging`);
              continue;
            }

            let body_: string;
            let mediaUrl: string | null = null;
            let mediaMime: string | null = null;

            if (type === 'text') {
              body_ = msg.text?.body || '';
            } else if (MEDIA_TYPES.includes(type)) {
              body_ = storage.describeNonTextMessage(type, msg);
              mediaUrl = msg[type]?.id || null; // ruw Meta media-id; blijft hier staan, ook na de download
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

              // Bijlage meteen binnenhalen: de CDN-url achter het media-id is
              // maar een paar minuten geldig, dus wachten tot iemand het
              // gesprek opent is geen optie.
              if (mediaUrl && MEDIA_TYPES.includes(type)) {
                await bewaarMedia({
                  messageId: inserted,
                  mediaId: mediaUrl,
                  type,
                  mimeTypeUitPayload: mediaMime,
                  filenameUitPayload: msg?.[type]?.filename || null,
                  waMessageId: msg.id || null,
                });
              }

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
            } else if (MEDIA_TYPES.includes(type)) {
              body_ = storage.describeNonTextMessage(type, echo);
              mediaUrl = echo[type]?.id || null; // ruw Meta media-id; blijft hier staan, ook na de download
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

              // Ook wat Max of een planner vanaf de telefoon stuurt halen we
              // binnen; anders staat de ene helft van het gesprek wel in beeld
              // en de andere helft niet.
              if (mediaUrl && MEDIA_TYPES.includes(type)) {
                await bewaarMedia({
                  messageId: inserted,
                  mediaId: mediaUrl,
                  type,
                  mimeTypeUitPayload: mediaMime,
                  filenameUitPayload: echo?.[type]?.filename || null,
                  waMessageId: echo.id || null,
                });
              }

              // Wie vanaf zijn telefoon antwoordt heeft het gesprek net zo
              // goed opgepakt als iemand die het vanuit het dashboard doet.
              // Zonder dit blijft het bovenaan de "wacht op planner"-wachtrij
              // hangen terwijl er allang gereageerd is. Zelfde aanroep als na
              // een dashboard-send; clearEscalation raakt alleen rijen die
              // daadwerkelijk geëscaleerd zijn.
              //
              // BEWUST alleen bij een verse insert: bij een herhaalde webhook
              // (inserted === null) is dit al eerder gebeurd, en zou een
              // NIEUWE escalatie die intussen is ontstaan onterecht worden
              // weggegooid.
              try {
                await storage.clearEscalation(normalizedTo);
              } catch (e: any) {
                console.error(`${logPrefix} clearEscalation na app-echo mislukt:`, e?.message);
              }
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
