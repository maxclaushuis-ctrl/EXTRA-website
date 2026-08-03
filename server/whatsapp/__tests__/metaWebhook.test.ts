/**
 * Unit-tests voor de Meta Cloud API webhook-onderdelen:
 *   - verifyMetaSignature (goed / fout / ontbrekend)
 *   - handleVerifyHandshake (GET verify-handshake)
 *   - processIncomingPayload met Meta entry[]-payload → juiste storage-calls (mocks)
 *   - statusupdate failed met code 131047 → opt-out-pad
 *
 * Run met:  npx tsx server/whatsapp/__tests__/metaWebhook.test.ts
 * Geen database of draaiende server nodig — dependencies worden geïnjecteerd.
 */
import crypto from 'crypto';
import { verifyMetaSignature, handleVerifyHandshake, safeEqualSecret } from '../webhookVerify';
import { processIncomingPayload, extractWebhookValues, type InboundProcessorDeps } from '../inboundProcessor';
import { normalizePhone } from '../phone';

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean, detail?: string) {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${detail ? '\n      ' + detail : ''}`); }
}

function assertEq(label: string, actual: unknown, expected: unknown) {
  ok(label, JSON.stringify(actual) === JSON.stringify(expected),
    `actual:   ${JSON.stringify(actual)}\n      expected: ${JSON.stringify(expected)}`);
}

// ─── Mock-deps factory ───────────────────────────────────────────────────────

interface CallLog {
  applyStatusEvent: any[][];
  resolveAndUpsertConversation: any[][];
  insertInboundMessage: any[][];
  insertAppEcho: any[][];
  clearEscalation: any[][];
  findConversationContact: any[][];
  handleBlockedByUser: any[][];
  handleIncomingStop: any[][];
  tryAutoReply: any[][];
}

function makeMockDeps(opts?: {
  applyStatusEventResult?: boolean;
  insertResult?: number | null;
  echoInsertResult?: number | null;
  matchCategory?: 'candidate' | 'prospect' | 'unmatched';
}): { deps: InboundProcessorDeps; calls: CallLog } {
  const calls: CallLog = {
    applyStatusEvent: [],
    resolveAndUpsertConversation: [],
    insertInboundMessage: [],
    insertAppEcho: [],
    clearEscalation: [],
    findConversationContact: [],
    handleBlockedByUser: [],
    handleIncomingStop: [],
    tryAutoReply: [],
  };

  // Zelfde blocked-codes als optInService.isBlockedByUserError (131026/131047/470).
  const BLOCKED = new Set(['131026', '131047', '470']);

  const deps: InboundProcessorDeps = {
    storage: {
      async applyStatusEvent(...args: any[]) { calls.applyStatusEvent.push(args); return opts?.applyStatusEventResult ?? true; },
      async resolveAndUpsertConversation(args: any) {
        calls.resolveAndUpsertConversation.push([args]);
        return { candidateId: 42, prospectContactId: null, category: opts?.matchCategory ?? 'candidate', displayName: 'Test Persoon' };
      },
      async insertInboundMessage(msg: any) { calls.insertInboundMessage.push([msg]); return opts?.insertResult === undefined ? 123 : opts.insertResult; },
      async insertAppEcho(msg: any) { calls.insertAppEcho.push([msg]); return opts?.echoInsertResult === undefined ? 456 : opts.echoInsertResult; },
      async clearEscalation(phone: string) { calls.clearEscalation.push([phone]); },
      describeNonTextMessage(type: string) { return `[${type}]`; },
    },
    optInService: {
      isBlockedByUserError(code?: string | null, msg?: string | null) {
        return !!(code && BLOCKED.has(String(code))) || (msg || '').toLowerCase().includes('user blocked');
      },
      async findConversationContact(phone: string) { calls.findConversationContact.push([phone]); return { candidateId: 42, prospectContactId: null }; },
      async handleBlockedByUser(args: any) { calls.handleBlockedByUser.push([args]); },
      isStopMessage(text?: string | null) { return (text || '').trim().toLowerCase() === 'stop'; },
      async handleIncomingStop(args: any) { calls.handleIncomingStop.push([args]); },
    },
    normalizePhone,
    tryAutoReply: async (args) => { calls.tryAutoReply.push([args]); },
    logPrefix: '[test]',
  };
  return { deps, calls };
}

// Meta entry[]-payload zoals Meta Cloud API die POST.
function metaEntryPayload(value: any, field = 'messages') {
  return {
    object: 'whatsapp_business_account',
    entry: [{ id: 'WABA_ID', changes: [{ field, value }] }],
  };
}

/**
 * Echo-payload zoals Meta die in Coexistence stuurt op het veld
 * smb_message_echoes: `from` is óns nummer, `to` is de klant.
 */
function echoPayload(echoes: any[]) {
  return metaEntryPayload({
    messaging_product: 'whatsapp',
    metadata: { display_phone_number: '+31 85 130 5915', phone_number_id: 'PNID' },
    message_echoes: echoes,
  }, 'smb_message_echoes');
}

async function main() {
  console.log('\n🔐 Meta webhook unit-tests\n');

  // ─── 1. Signature-verificatie ────────────────────────────────────────────
  console.log('— verifyMetaSignature —');
  const secret = 'test_app_secret_123';
  const body = Buffer.from(JSON.stringify({ hello: 'world' }));
  const goodSig = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

  ok('geldige signature → true', verifyMetaSignature(body, goodSig, secret) === true);
  ok('verkeerde signature → false', verifyMetaSignature(body, 'sha256=' + 'ab'.repeat(32), secret) === false);
  ok('signature met verkeerd secret → false',
    verifyMetaSignature(body, 'sha256=' + crypto.createHmac('sha256', 'ander_secret').update(body).digest('hex'), secret) === false);
  ok('ontbrekende signature-header → false', verifyMetaSignature(body, undefined, secret) === false);
  ok('lege signature-header → false', verifyMetaSignature(body, '', secret) === false);
  ok('signature met verkeerde lengte → false', verifyMetaSignature(body, 'sha256=abc', secret) === false);
  ok('leeg app-secret → false', verifyMetaSignature(body, goodSig, '') === false);
  ok('andere body → false', verifyMetaSignature(Buffer.from('{"tampered":1}'), goodSig, secret) === false);

  // ─── 2. Verify-handshake ─────────────────────────────────────────────────
  console.log('\n— handleVerifyHandshake —');
  const token = 'mijn_verify_token';
  assertEq('geldige handshake → challenge',
    handleVerifyHandshake({ 'hub.mode': 'subscribe', 'hub.verify_token': token, 'hub.challenge': '1158201444' }, token),
    '1158201444');
  assertEq('verkeerde token → null',
    handleVerifyHandshake({ 'hub.mode': 'subscribe', 'hub.verify_token': 'fout', 'hub.challenge': 'x' }, token),
    null);
  assertEq('verkeerde mode → null',
    handleVerifyHandshake({ 'hub.mode': 'unsubscribe', 'hub.verify_token': token, 'hub.challenge': 'x' }, token),
    null);
  assertEq('geen verify-token geconfigureerd → null',
    handleVerifyHandshake({ 'hub.mode': 'subscribe', 'hub.verify_token': '', 'hub.challenge': 'x' }, ''),
    null);
  // Timing-safe vergelijking: ongelijke lengte mag niet crashen op
  // crypto.timingSafeEqual (die gooit bij verschillende buffer-lengtes).
  assertEq('kortere token → null (geen crash op lengteverschil)',
    handleVerifyHandshake({ 'hub.mode': 'subscribe', 'hub.verify_token': 'kort', 'hub.challenge': 'x' }, token),
    null);
  assertEq('langere token → null (geen crash op lengteverschil)',
    handleVerifyHandshake({ 'hub.mode': 'subscribe', 'hub.verify_token': token + 'extra', 'hub.challenge': 'x' }, token),
    null);
  assertEq('ontbrekende hub.verify_token → null',
    handleVerifyHandshake({ 'hub.mode': 'subscribe', 'hub.challenge': 'x' }, token),
    null);

  console.log('\n— safeEqualSecret —');
  assertEq('gelijke secrets → true', safeEqualSecret('abc123', 'abc123'), true);
  assertEq('verschillende secrets, gelijke lengte → false', safeEqualSecret('abc123', 'abc124'), false);
  assertEq('verschillende lengte → false', safeEqualSecret('ab', 'abc123'), false);
  assertEq('lege expected → false', safeEqualSecret('abc', ''), false);
  assertEq('lege provided → false', safeEqualSecret('', 'abc'), false);

  // .trim() op de env-waarde: een per ongeluk meegekopieerde newline in het
  // Replit-secret mag de handshake niet stilzwijgend laten falen.
  console.log('\n— verify-token uit env wordt getrimd —');
  {
    const oud = process.env.META_WA_BOT_VERIFY_TOKEN;
    process.env.META_WA_BOT_VERIFY_TOKEN = `  ${token}\n`;
    assertEq('env-token met spaties/newline → challenge',
      handleVerifyHandshake({ 'hub.mode': 'subscribe', 'hub.verify_token': token, 'hub.challenge': '42' }),
      '42');
    if (oud === undefined) delete process.env.META_WA_BOT_VERIFY_TOKEN;
    else process.env.META_WA_BOT_VERIFY_TOKEN = oud;
  }

  // ─── 3. extractWebhookValues ─────────────────────────────────────────────
  console.log('\n— extractWebhookValues —');
  assertEq('plat 360dialog-formaat → [body]', extractWebhookValues({ messages: [] }).length, 1);
  assertEq('Meta entry[] → value', extractWebhookValues(metaEntryPayload({ messages: [] })).length, 1);
  assertEq('meerdere entries/changes', extractWebhookValues({
    entry: [
      { changes: [{ value: { a: 1 } }, { value: { b: 2 } }] },
      { changes: [{ value: { c: 3 } }] },
    ],
  }).length, 3);
  assertEq('lege/kapotte body → []', extractWebhookValues(null).length, 0);

  // ─── 4. Meta entry[]-payload met inkomend bericht → storage-calls ────────
  console.log('\n— processIncomingPayload: inkomend tekstbericht (Meta entry[]) —');
  {
    const { deps, calls } = makeMockDeps();
    await processIncomingPayload(metaEntryPayload({
      messaging_product: 'whatsapp',
      metadata: { display_phone_number: '3197000000000', phone_number_id: 'PNID' },
      contacts: [{ profile: { name: 'Meta Tester' }, wa_id: '31600000999' }],
      messages: [{
        id: 'wamid.TEST001',
        from: '31600000999',
        timestamp: '1722500000',
        type: 'text',
        text: { body: 'Hallo via Meta!' },
      }],
    }), deps);

    assertEq('resolveAndUpsertConversation 1x aangeroepen', calls.resolveAndUpsertConversation.length, 1);
    const conv = calls.resolveAndUpsertConversation[0]?.[0];
    assertEq('  → phoneNumber genormaliseerd', conv?.phoneNumber, '31600000999');
    assertEq('  → inbound=true', conv?.inbound, true);
    assertEq('  → bodyPreview', conv?.bodyPreview, 'Hallo via Meta!');

    assertEq('insertInboundMessage 1x aangeroepen', calls.insertInboundMessage.length, 1);
    const msg = calls.insertInboundMessage[0]?.[0];
    assertEq('  → waMessageId', msg?.waMessageId, 'wamid.TEST001');
    assertEq('  → fromNumber', msg?.fromNumber, '31600000999');
    assertEq('  → messageType text', msg?.messageType, 'text');
    assertEq('  → body', msg?.body, 'Hallo via Meta!');
    assertEq('  → candidateId uit match', msg?.candidateId, 42);
    assertEq('  → matchCategory', msg?.matchCategory, 'candidate');
    assertEq('  → status received', msg?.status, 'received');

    assertEq('tryAutoReply 1x getriggerd', calls.tryAutoReply.length, 1);
    assertEq('  → contactName uit profile', calls.tryAutoReply[0]?.[0]?.contactName, 'Meta Tester');
    assertEq('geen STOP-handler', calls.handleIncomingStop.length, 0);
  }

  // ─── 5. Duplicate (idempotentie) → geen auto-reply ───────────────────────
  console.log('\n— processIncomingPayload: duplicate wa_message_id —');
  {
    const { deps, calls } = makeMockDeps({ insertResult: null });
    await processIncomingPayload(metaEntryPayload({
      contacts: [{ profile: { name: 'Meta Tester' }, wa_id: '31600000999' }],
      messages: [{ id: 'wamid.DUP', from: '31600000999', type: 'text', text: { body: 'nogmaals' } }],
    }), deps);
    assertEq('insert geprobeerd', calls.insertInboundMessage.length, 1);
    assertEq('géén auto-reply bij duplicate', calls.tryAutoReply.length, 0);
    assertEq('géén STOP-handler bij duplicate', calls.handleIncomingStop.length, 0);
  }

  // ─── 6. STOP-bericht → opt-out-pad, geen auto-reply ──────────────────────
  console.log('\n— processIncomingPayload: STOP-bericht —');
  {
    const { deps, calls } = makeMockDeps();
    await processIncomingPayload(metaEntryPayload({
      contacts: [{ profile: { name: 'Stopper' }, wa_id: '31600000999' }],
      messages: [{ id: 'wamid.STOP1', from: '+31600000999', type: 'text', text: { body: 'STOP' } }],
    }), deps);
    // handleIncomingStop draait fire-and-forget → geef de microtask-queue even tijd
    await new Promise(r => setTimeout(r, 10));
    assertEq('handleIncomingStop aangeroepen', calls.handleIncomingStop.length, 1);
    assertEq('  → rawBody', calls.handleIncomingStop[0]?.[0]?.rawBody, 'STOP');
    assertEq('  → phoneNumber genormaliseerd', calls.handleIncomingStop[0]?.[0]?.phoneNumber, '31600000999');
    assertEq('géén auto-reply bij STOP', calls.tryAutoReply.length, 0);
  }

  // ─── 7. Status-update failed met code 131047 → opt-out-pad ───────────────
  console.log('\n— processIncomingPayload: status failed 131047 → opt-out —');
  {
    const { deps, calls } = makeMockDeps();
    await processIncomingPayload(metaEntryPayload({
      messaging_product: 'whatsapp',
      statuses: [{
        id: 'wamid.OUT001',
        status: 'failed',
        timestamp: '1722500100',
        recipient_id: '31600000999',
        errors: [{ code: 131047, title: 'Re-engagement message', message: 'Re-engagement message' }],
      }],
    }), deps);

    assertEq('applyStatusEvent aangeroepen', calls.applyStatusEvent.length, 1);
    assertEq('  → args', calls.applyStatusEvent[0], ['wamid.OUT001', 'failed', '131047', 'Re-engagement message']);
    assertEq('findConversationContact aangeroepen', calls.findConversationContact.length, 1);
    assertEq('  → met genormaliseerd nummer', calls.findConversationContact[0]?.[0], '31600000999');
    assertEq('handleBlockedByUser aangeroepen', calls.handleBlockedByUser.length, 1);
    const blocked = calls.handleBlockedByUser[0]?.[0];
    assertEq('  → candidateId doorgegeven', blocked?.candidateId, 42);
    assertEq('  → errorCode', blocked?.errorCode, '131047');
  }

  // ─── 8. Status delivered → géén opt-out-pad ──────────────────────────────
  console.log('\n— processIncomingPayload: status delivered (geen opt-out) —');
  {
    const { deps, calls } = makeMockDeps();
    await processIncomingPayload(metaEntryPayload({
      statuses: [{ id: 'wamid.OUT002', status: 'delivered', recipient_id: '31600000999' }],
    }), deps);
    assertEq('applyStatusEvent aangeroepen', calls.applyStatusEvent.length, 1);
    assertEq('geen handleBlockedByUser', calls.handleBlockedByUser.length, 0);
  }

  // ─── 9. Onbekend wa_message_id bij status → geen verdere verwerking ──────
  console.log('\n— processIncomingPayload: status voor onbekend bericht —');
  {
    const { deps, calls } = makeMockDeps({ applyStatusEventResult: false });
    await processIncomingPayload(metaEntryPayload({
      statuses: [{ id: 'wamid.UNKNOWN', status: 'failed', recipient_id: '31600000999', errors: [{ code: 131047 }] }],
    }), deps);
    assertEq('applyStatusEvent geprobeerd', calls.applyStatusEvent.length, 1);
    assertEq('geen opt-out-pad voor onbekend bericht', calls.handleBlockedByUser.length, 0);
  }

  // ─── 10. Plat 360dialog-formaat blijft werken via dezelfde processor ─────
  console.log('\n— processIncomingPayload: plat 360dialog-formaat —');
  {
    const { deps, calls } = makeMockDeps();
    await processIncomingPayload({
      contacts: [{ profile: { name: 'D360 Tester' }, wa_id: '31600000999' }],
      messages: [{ id: 'D360_001', from: '31600000999', type: 'text', text: { body: 'plat formaat' } }],
    }, deps);
    assertEq('insertInboundMessage aangeroepen', calls.insertInboundMessage.length, 1);
    assertEq('  → waMessageId', calls.insertInboundMessage[0]?.[0]?.waMessageId, 'D360_001');
  }

  // ─── 11. App-echo: tekstbericht vanaf de telefoon ────────────────────────
  console.log('\n— processIncomingPayload: app-echo (tekst vanaf de telefoon) —');
  {
    const { deps, calls } = makeMockDeps();
    await processIncomingPayload(echoPayload([{
      id: 'wamid.ECHO001',
      from: '31851305915',          // ons eigen nummer
      to: '31600000999',            // de klant
      timestamp: '1722500200',
      type: 'text',
      text: { body: 'Ja hoor, ik regel het even' },
    }]), deps);

    assertEq('insertAppEcho aangeroepen', calls.insertAppEcho.length, 1);
    const echo = calls.insertAppEcho[0]?.[0];
    assertEq('  → direction outbound', echo?.direction, 'outbound');
    assertEq('  → waMessageId', echo?.waMessageId, 'wamid.ECHO001');
    // Het gesprek hangt aan de KLANT (to), niet aan ons eigen nummer (from).
    assertEq('  → toNumber = klant', echo?.toNumber, '31600000999');
    assertEq('  → fromNumber = extra (ons nummer)', echo?.fromNumber, 'extra');
    assertEq('  → body', echo?.body, 'Ja hoor, ik regel het even');
    assertEq('  → messageType', echo?.messageType, 'text');
    assertEq('  → status sent (al de deur uit)', echo?.status, 'sent');
    assertEq('  → matchCategory uit de match', echo?.matchCategory, 'candidate');
    assertEq('  → candidateId uit de match', echo?.candidateId, 42);

    // De ongelezen-teller mag NIET omhoog: dit is een uitgaand bericht.
    assertEq('conversation-upsert aangeroepen', calls.resolveAndUpsertConversation.length, 1);
    const conv = calls.resolveAndUpsertConversation[0]?.[0];
    assertEq('  → inbound=false (ongelezen-teller ongemoeid)', conv?.inbound, false);
    assertEq('  → op het klantnummer', conv?.phoneNumber, '31600000999');
    assertEq('  → preview is de echo-tekst', conv?.bodyPreview, 'Ja hoor, ik regel het even');
    assertEq('  → tijdstip uit de echo', (conv?.at as Date)?.toISOString(), new Date(1722500200 * 1000).toISOString());

    // Een echo is geen inkomend bericht: geen inbound-insert, geen auto-reply,
    // geen STOP-detectie. Anders zou de AI op ons eigen bericht antwoorden.
    assertEq('géén insertInboundMessage', calls.insertInboundMessage.length, 0);
    assertEq('géén auto-reply op eigen bericht', calls.tryAutoReply.length, 0);
    assertEq('géén STOP-handler', calls.handleIncomingStop.length, 0);

    // Antwoorden vanaf de telefoon telt als oppakken: uit de wachtrij.
    assertEq('clearEscalation aangeroepen', calls.clearEscalation.length, 1);
    assertEq('  → op het klantnummer', calls.clearEscalation[0]?.[0], '31600000999');
  }

  // ─── 12. App-echo: duplicate webhook → geen tweede rij ───────────────────
  console.log('\n— processIncomingPayload: app-echo duplicate —');
  {
    const { deps, calls } = makeMockDeps({ echoInsertResult: null });
    await processIncomingPayload(echoPayload([{
      id: 'wamid.ECHO001', from: '31851305915', to: '31600000999',
      timestamp: '1722500200', type: 'text', text: { body: 'nogmaals' },
    }]), deps);
    assertEq('insertAppEcho geprobeerd', calls.insertAppEcho.length, 1);
    // null = "bestond al". De verwerking loopt netjes door (dit assert wordt
    // alleen bereikt als er geen exception is gegooid) en er komt geen tweede
    // insert-poging.
    assertEq('precies één insert-poging, geen retry', calls.insertAppEcho.length, 1);
    assertEq('conversation-upsert wel gedraaid (preview blijft kloppen)', calls.resolveAndUpsertConversation.length, 1);
    // Cruciaal: bij een herhaalde webhook NIET nogmaals de escalatie wissen.
    // Er kan intussen een nieuwe escalatie zijn ontstaan, en die zou dan
    // stilletjes uit de wachtrij verdwijnen.
    assertEq('géén clearEscalation bij duplicate', calls.clearEscalation.length, 0);
  }

  // ─── 13. App-echo: media ─────────────────────────────────────────────────
  console.log('\n— processIncomingPayload: app-echo (afbeelding) —');
  {
    const { deps, calls } = makeMockDeps();
    await processIncomingPayload(echoPayload([{
      id: 'wamid.ECHO002', from: '31851305915', to: '31600000999',
      timestamp: '1722500300', type: 'image',
      image: { id: 'MEDIA_ID_1', mime_type: 'image/jpeg' },
    }]), deps);
    const echo = calls.insertAppEcho[0]?.[0];
    assertEq('  → messageType image', echo?.messageType, 'image');
    assertEq('  → mediaUrl = media-id', echo?.mediaUrl, 'MEDIA_ID_1');
    assertEq('  → mediaMimeType', echo?.mediaMimeType, 'image/jpeg');
    assertEq('  → body beschrijvend', echo?.body, '[image]');
  }

  // ─── 14. App-echo: revoke en edit worden alleen gelogd ───────────────────
  console.log('\n— processIncomingPayload: app-echo revoke/edit —');
  {
    const { deps, calls } = makeMockDeps();
    await processIncomingPayload(echoPayload([
      { id: 'wamid.ECHO003', from: '31851305915', to: '31600000999', type: 'revoke', revoke: { original_message_id: 'wamid.ECHO001' } },
      { id: 'wamid.ECHO004', from: '31851305915', to: '31600000999', type: 'edit', edit: { original_message_id: 'wamid.ECHO001' }, text: { body: 'aangepast' } },
    ]), deps);
    assertEq('geen insert bij revoke/edit', calls.insertAppEcho.length, 0);
    assertEq('geen conversation-wijziging bij revoke/edit', calls.resolveAndUpsertConversation.length, 0);
    assertEq('geen clearEscalation bij revoke/edit', calls.clearEscalation.length, 0);
  }

  // ─── 15. App-echo met ongeldig to-nummer → overgeslagen ──────────────────
  console.log('\n— processIncomingPayload: app-echo zonder bruikbaar to-nummer —');
  {
    const { deps, calls } = makeMockDeps();
    await processIncomingPayload(echoPayload([
      { id: 'wamid.ECHO005', from: '31851305915', to: '', type: 'text', text: { body: 'x' } },
      { id: 'wamid.ECHO006', from: '31851305915', to: '31600000999', type: 'text', text: { body: 'wel goed' } },
    ]), deps);
    assertEq('alleen de bruikbare echo ingeschoten', calls.insertAppEcho.length, 1);
    assertEq('  → dat is de tweede', calls.insertAppEcho[0]?.[0]?.waMessageId, 'wamid.ECHO006');
  }

  // ─── 16. Echo's en inkomende berichten in één payload ────────────────────
  console.log('\n— processIncomingPayload: messages én message_echoes in één value —');
  {
    const { deps, calls } = makeMockDeps();
    await processIncomingPayload(metaEntryPayload({
      contacts: [{ profile: { name: 'Klant' }, wa_id: '31600000999' }],
      messages: [{ id: 'wamid.IN9', from: '31600000999', type: 'text', text: { body: 'vraag' } }],
      message_echoes: [{ id: 'wamid.ECHO007', from: '31851305915', to: '31600000999', type: 'text', text: { body: 'antwoord vanaf telefoon' } }],
    }), deps);
    assertEq('inkomend bericht verwerkt', calls.insertInboundMessage.length, 1);
    assertEq('echo verwerkt', calls.insertAppEcho.length, 1);
    assertEq('twee conversation-upserts', calls.resolveAndUpsertConversation.length, 2);
    assertEq('  → eerste inbound', calls.resolveAndUpsertConversation[0]?.[0]?.inbound, true);
    assertEq('  → tweede outbound', calls.resolveAndUpsertConversation[1]?.[0]?.inbound, false);
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
