/**
 * Integration-tests voor de WhatsApp-webhook.
 * Zet WHATSAPP_WEBHOOK_SECRET en draait tegen een live server op localhost:5000.
 *
 * Gebruik:
 *   npm run dev                                          # in andere terminal
 *   npx tsx server/whatsapp/__tests__/webhook.test.ts
 *
 * Cleanup: verwijdert eigen test-records aan het einde.
 */
import { db } from '../../db';
import { candidates, whatsappMessages, whatsappConversations } from '@shared/schema';
import { eq, like } from 'drizzle-orm';

const SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || '';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';
const TEST_PHONE_NORMALIZED = '31600000999'; // dummy NL nummer
const TEST_PHONE_RAW = '+31600000999';
const TEST_UNKNOWN_NORMALIZED = '31600001234';
const TEST_PREFIX = 'TEST_WA_'; // zodat we kunnen opruimen

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean, detail?: string) {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${detail ? '\n      ' + detail : ''}`); }
}

async function postWebhook(body: any) {
  const r = await fetch(`${BASE}/api/whatsapp/webhook/${SECRET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r;
}

function inboundMsg(id: string, from: string, text: string) {
  return {
    contacts: [{ profile: { name: 'Test User' }, wa_id: from }],
    messages: [{
      id,
      from,
      type: 'text',
      timestamp: String(Math.floor(Date.now() / 1000)),
      text: { body: text },
    }],
  };
}

async function cleanup() {
  await db.delete(whatsappMessages).where(like(whatsappMessages.waMessageId, `${TEST_PREFIX}%`));
  await db.delete(whatsappConversations).where(eq(whatsappConversations.phoneNumber, TEST_PHONE_NORMALIZED));
  await db.delete(whatsappConversations).where(eq(whatsappConversations.phoneNumber, TEST_UNKNOWN_NORMALIZED));
  await db.delete(candidates).where(eq(candidates.email, 'test_wa_phase1@example.invalid'));
}

async function main() {
  console.log(`\n🔌 Webhook-integration tests tegen ${BASE}\n`);

  if (!SECRET) {
    console.error('FOUT: WHATSAPP_WEBHOOK_SECRET niet ingesteld in env. Stop.');
    process.exit(1);
  }

  await cleanup();

  // 1. Maak test-kandidaat aan met genormaliseerd nummer
  const [cand] = await db.insert(candidates).values({
    firstName: 'Test',
    lastName: 'WhatsApp',
    email: 'test_wa_phase1@example.invalid',
    phone: TEST_PHONE_NORMALIZED, // al genormaliseerd
    functionType: 'horeca' as any,
  } as any).returning({ id: candidates.id });

  console.log(`Test-kandidaat aangemaakt: id=${cand.id}, phone=${TEST_PHONE_NORMALIZED}\n`);

  // 2. Webhook met bekend nummer → match=candidate
  console.log('— Test 1: bekend kandidaat-nummer —');
  const id1 = `${TEST_PREFIX}001`;
  const r1 = await postWebhook(inboundMsg(id1, TEST_PHONE_RAW, 'Hallo, dit is een testbericht'));
  ok('webhook returns 200', r1.status === 200, `status=${r1.status}`);
  await new Promise(r => setTimeout(r, 300)); // even tijd voor write
  const [m1] = await db.select().from(whatsappMessages).where(eq(whatsappMessages.waMessageId, id1));
  ok('bericht in DB', !!m1);
  ok('match_category=candidate', m1?.matchCategory === 'candidate', `actual=${m1?.matchCategory}`);
  ok('candidate_id correct', m1?.candidateId === cand.id, `actual=${m1?.candidateId}`);
  ok('from_number genormaliseerd', m1?.fromNumber === TEST_PHONE_NORMALIZED, `actual=${m1?.fromNumber}`);
  ok('body bevat tekst', m1?.body === 'Hallo, dit is een testbericht');

  const [conv1] = await db.select().from(whatsappConversations).where(eq(whatsappConversations.phoneNumber, TEST_PHONE_NORMALIZED));
  ok('conversation aangemaakt', !!conv1);
  ok('conversation candidate_id', conv1?.candidateId === cand.id);
  ok('unread_count = 1', conv1?.unreadCount === 1);

  // 3. Webhook met onbekend nummer → match=unmatched
  console.log('\n— Test 2: onbekend nummer —');
  const id2 = `${TEST_PREFIX}002`;
  const r2 = await postWebhook(inboundMsg(id2, TEST_UNKNOWN_NORMALIZED, 'Wie is dit'));
  ok('webhook 200', r2.status === 200);
  await new Promise(r => setTimeout(r, 300));
  const [m2] = await db.select().from(whatsappMessages).where(eq(whatsappMessages.waMessageId, id2));
  ok('bericht in DB', !!m2);
  ok('match_category=unmatched', m2?.matchCategory === 'unmatched', `actual=${m2?.matchCategory}`);
  ok('candidate_id null', m2?.candidateId === null);

  // 4. Idempotentie: zelfde wa_message_id 2x → géén duplicate
  console.log('\n— Test 3: idempotentie (dubbele wa_message_id) —');
  const beforeCount = await db.select({ c: whatsappMessages.id }).from(whatsappMessages).where(eq(whatsappMessages.waMessageId, id1));
  await postWebhook(inboundMsg(id1, TEST_PHONE_RAW, 'Dit zou genegeerd moeten worden'));
  await new Promise(r => setTimeout(r, 300));
  const afterCount = await db.select({ c: whatsappMessages.id }).from(whatsappMessages).where(eq(whatsappMessages.waMessageId, id1));
  ok('géén duplicate na 2e POST', afterCount.length === beforeCount.length, `before=${beforeCount.length} after=${afterCount.length}`);

  // 5. Verkeerde secret → 401
  console.log('\n— Test 4: verkeerde secret —');
  const r3 = await fetch(`${BASE}/api/whatsapp/webhook/wrongsecret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inboundMsg(`${TEST_PREFIX}999`, TEST_PHONE_RAW, 'should be rejected')),
  });
  ok('401 bij verkeerde secret', r3.status === 401, `status=${r3.status}`);

  // Cleanup
  console.log('\n— Cleanup —');
  await cleanup();
  console.log('  test-records verwijderd');

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
