/**
 * Unit-tests voor server/whatsapp/metaClient.ts en de provider-switch.
 * Mockt global fetch — geen netwerk, database of server nodig.
 *
 * Run met:  npx tsx server/whatsapp/__tests__/metaClient.test.ts
 */
import { META_GRAPH_BASE_URL, isMetaConfigured, sendTextMessage, sendTemplateMessage, sendMediaMessage, markAsRead } from '../metaClient';
import * as waProvider from '../provider';

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

// ─── fetch-mock ──────────────────────────────────────────────────────────────

interface RecordedCall { url: string; init: any; }
const recorded: RecordedCall[] = [];
const realFetch = globalThis.fetch;

function mockFetch(handler: (url: string, init: any) => { status: number; body: any }) {
  recorded.length = 0;
  (globalThis as any).fetch = async (url: any, init: any) => {
    recorded.push({ url: String(url), init });
    const { status, body } = handler(String(url), init);
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

async function main() {
  console.log('\n📡 metaClient + provider unit-tests\n');

  // ─── Config-detectie ───────────────────────────────────────────────────────
  console.log('— isMetaConfigured —');
  delete process.env.META_WA_BOT_ACCESS_TOKEN;
  delete process.env.META_WA_BOT_PHONE_NUMBER_ID;
  ok('zonder env → false', isMetaConfigured() === false);

  process.env.META_WA_BOT_ACCESS_TOKEN = 'TEST_TOKEN_abc123';
  process.env.META_WA_BOT_PHONE_NUMBER_ID = '111222333444555';
  ok('met token + phone-number-id → true', isMetaConfigured() === true);

  // ─── sendTextMessage: URL / headers / payload ──────────────────────────────
  console.log('\n— sendTextMessage: succes —');
  mockFetch(() => ({ status: 200, body: { messaging_product: 'whatsapp', messages: [{ id: 'wamid.SENT001' }] } }));
  const r1 = await sendTextMessage('31612345678', 'Hallo vanaf Meta!');
  assertEq('resultaat ok', r1.ok, true);
  assertEq('waMessageId', r1.waMessageId, 'wamid.SENT001');
  assertEq('juiste URL', recorded[0]?.url, `${META_GRAPH_BASE_URL}/111222333444555/messages`);
  assertEq('method POST', recorded[0]?.init?.method, 'POST');
  assertEq('Authorization Bearer-header', recorded[0]?.init?.headers?.['Authorization'], 'Bearer TEST_TOKEN_abc123');
  assertEq('Content-Type header', recorded[0]?.init?.headers?.['Content-Type'], 'application/json');
  const sentPayload = JSON.parse(recorded[0]?.init?.body || '{}');
  assertEq('payload.messaging_product', sentPayload.messaging_product, 'whatsapp');
  assertEq('payload.to', sentPayload.to, '31612345678');
  assertEq('payload.type', sentPayload.type, 'text');
  assertEq('payload.text.body', sentPayload.text, { body: 'Hallo vanaf Meta!' });
  ok('AbortSignal (timeout) meegegeven', recorded[0]?.init?.signal != null);

  // ─── sendTextMessage: Meta-error netjes vertaald ──────────────────────────
  console.log('\n— sendTextMessage: Meta-error —');
  mockFetch(() => ({
    status: 400,
    body: {
      error: {
        message: '(#131047) Re-engagement message',
        type: 'OAuthException',
        code: 131047,
        error_data: { messaging_product: 'whatsapp', details: 'Message failed to send because more than 24 hours have passed since the customer last replied to this number.' },
        error_subcode: 2494010,
        fbtrace_id: 'Ab12Cd34',
      },
    },
  }));
  const r2 = await sendTextMessage('31612345678', 'te laat');
  assertEq('resultaat niet ok', r2.ok, false);
  assertEq('error.code', r2.error?.code, '131047');
  assertEq('error.title', r2.error?.title, 'OAuthException');
  assertEq('error.message', r2.error?.message, '(#131047) Re-engagement message');
  ok('error.details bevat 24 hours', (r2.error?.details || '').includes('24 hours'));
  assertEq('error.httpStatus', r2.error?.httpStatus, 400);

  // ─── sendTextMessage: netwerkfout ─────────────────────────────────────────
  console.log('\n— sendTextMessage: netwerkfout —');
  (globalThis as any).fetch = async () => { throw new TypeError('fetch failed: getaddrinfo ENOTFOUND'); };
  const r3 = await sendTextMessage('31612345678', 'geen netwerk');
  assertEq('resultaat niet ok', r3.ok, false);
  assertEq('error.code network_error', r3.error?.code, 'network_error');
  ok('error.message aanwezig', !!r3.error?.message);

  // ─── sendTextMessage: niet geconfigureerd ─────────────────────────────────
  console.log('\n— sendTextMessage: niet geconfigureerd —');
  const savedToken = process.env.META_WA_BOT_ACCESS_TOKEN;
  delete process.env.META_WA_BOT_ACCESS_TOKEN;
  const r4 = await sendTextMessage('31612345678', 'x');
  assertEq('resultaat niet ok', r4.ok, false);
  assertEq('error.code not_configured', r4.error?.code, 'not_configured');
  process.env.META_WA_BOT_ACCESS_TOKEN = savedToken;

  // ─── sendTemplateMessage payload ──────────────────────────────────────────
  console.log('\n— sendTemplateMessage —');
  mockFetch(() => ({ status: 200, body: { messages: [{ id: 'wamid.TPL001' }] } }));
  const comps = [{ type: 'body', parameters: [{ type: 'text', parameter_name: 'variable_1', text: 'Max' }] }];
  const r5 = await sendTemplateMessage('31612345678', 'gesprek_inplannen_reminder', 'nl', comps);
  assertEq('ok', r5.ok, true);
  const tplPayload = JSON.parse(recorded[0]?.init?.body || '{}');
  assertEq('type template', tplPayload.type, 'template');
  assertEq('template.name', tplPayload.template?.name, 'gesprek_inplannen_reminder');
  assertEq('template.language.code', tplPayload.template?.language, { code: 'nl' });
  assertEq('template.components', tplPayload.template?.components, comps);

  // ─── sendMediaMessage payload ─────────────────────────────────────────────
  console.log('\n— sendMediaMessage —');
  mockFetch(() => ({ status: 200, body: { messages: [{ id: 'wamid.MEDIA1' }] } }));
  await sendMediaMessage('31612345678', { type: 'document', id: 'MEDIA_ID_1', caption: 'Zie bijlage', filename: 'protocol.pdf' });
  const medPayload = JSON.parse(recorded[0]?.init?.body || '{}');
  assertEq('type document', medPayload.type, 'document');
  assertEq('document object', medPayload.document, { id: 'MEDIA_ID_1', caption: 'Zie bijlage', filename: 'protocol.pdf' });
  const rNoMedia = await sendMediaMessage('31612345678', { type: 'image' } as any);
  assertEq('zonder id/link → invalid_media', rNoMedia.error?.code, 'invalid_media');

  // ─── markAsRead payload ───────────────────────────────────────────────────
  console.log('\n— markAsRead —');
  mockFetch(() => ({ status: 200, body: { success: true } }));
  const r6 = await markAsRead('wamid.INB001');
  assertEq('ok', r6.ok, true);
  const readPayload = JSON.parse(recorded[0]?.init?.body || '{}');
  assertEq('status read', readPayload.status, 'read');
  assertEq('message_id', readPayload.message_id, 'wamid.INB001');

  // ─── Provider-switch ──────────────────────────────────────────────────────
  console.log('\n— provider-switch (WHATSAPP_PROVIDER) —');
  delete process.env.WHATSAPP_PROVIDER;
  assertEq('default → 360dialog', waProvider.activeProvider(), '360dialog');
  process.env.WHATSAPP_PROVIDER = 'meta';
  assertEq("'meta' → meta", waProvider.activeProvider(), 'meta');
  process.env.WHATSAPP_PROVIDER = 'onzin';
  assertEq('onbekende waarde → 360dialog (fallback)', waProvider.activeProvider(), '360dialog');

  // provider.sendText bij meta → Graph API-call met uniform resultaat
  process.env.WHATSAPP_PROVIDER = 'meta';
  mockFetch(() => ({ status: 200, body: { messages: [{ id: 'wamid.VIA_PROVIDER' }] } }));
  const p1 = await waProvider.sendText('31612345678', 'via provider');
  assertEq('provider=meta in resultaat', p1.provider, 'meta');
  assertEq('waMessageId doorgegeven', p1.waMessageId, 'wamid.VIA_PROVIDER');
  ok('URL is Graph API', (recorded[0]?.url || '').startsWith(META_GRAPH_BASE_URL));

  // provider.sendText bij 360dialog → oude URL + D360-API-KEY header + zelfde payload
  process.env.WHATSAPP_PROVIDER = '360dialog';
  process.env.WHATSAPP_360_API_KEY = 'D360_TEST_KEY';
  delete process.env.WHATSAPP_360_BASE_URL;
  mockFetch(() => ({ status: 200, body: { messages: [{ id: 'wamid.D360' }] } }));
  const p2 = await waProvider.sendText('31612345678', 'via 360dialog');
  assertEq('provider=360dialog in resultaat', p2.provider, '360dialog');
  assertEq('oude 360dialog-URL', recorded[0]?.url, 'https://waba-v2.360dialog.io/messages');
  assertEq('D360-API-KEY header', recorded[0]?.init?.headers?.['D360-API-KEY'], 'D360_TEST_KEY');
  assertEq('zelfde payload als voorheen', JSON.parse(recorded[0]?.init?.body || '{}'),
    { messaging_product: 'whatsapp', to: '31612345678', type: 'text', text: { body: 'via 360dialog' } });

  // provider-error-mapping bij meta
  process.env.WHATSAPP_PROVIDER = 'meta';
  mockFetch(() => ({ status: 400, body: { error: { code: 131047, message: 'Re-engagement message', error_data: { details: 'window verlopen' } } } }));
  const p3 = await waProvider.sendText('31612345678', 'fout');
  assertEq('ok=false', p3.ok, false);
  assertEq('errorCode', p3.errorCode, '131047');
  ok('errorMessage bevat details', (p3.errorMessage || '').includes('window verlopen'));
  assertEq('httpStatus', p3.httpStatus, 400);
  assertEq('httpStatusForFailure → 400', waProvider.httpStatusForFailure(p3), 400);

  // configErrorMessage per provider
  console.log('\n— configErrorMessage —');
  process.env.WHATSAPP_PROVIDER = '360dialog';
  delete process.env.WHATSAPP_360_API_KEY;
  assertEq('360dialog zonder key', waProvider.configErrorMessage(), 'WHATSAPP_360_API_KEY niet ingesteld');
  process.env.WHATSAPP_360_API_KEY = 'x';
  assertEq('360dialog met key → null', waProvider.configErrorMessage(), null);
  process.env.WHATSAPP_PROVIDER = 'meta';
  delete process.env.META_WA_BOT_ACCESS_TOKEN;
  assertEq('meta zonder token', waProvider.configErrorMessage(), 'META_WA_BOT_ACCESS_TOKEN of META_WA_BOT_PHONE_NUMBER_ID niet ingesteld');
  process.env.META_WA_BOT_ACCESS_TOKEN = 'y';
  assertEq('meta met token+id → null', waProvider.configErrorMessage(), null);

  (globalThis as any).fetch = realFetch;
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
