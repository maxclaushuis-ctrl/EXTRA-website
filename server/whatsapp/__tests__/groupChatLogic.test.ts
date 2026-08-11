/**
 * Unit-tests voor server/whatsapp/groupChatLogic.ts (de DB-loze logica voor
 * groepsgesprekken: deelnemer-normalisatie, validatie vóór aanmaken/
 * versturen). Bewust NIET voor groupChats.ts zelf — dat importeert ../db,
 * wat zonder DATABASE_URL direct een exception gooit. Zelfde patroon als
 * templates.test.ts.
 *
 * Run met:  npx tsx server/whatsapp/__tests__/groupChatLogic.test.ts
 */
import {
  MAX_GROUP_PARTICIPANTS, MAX_SUBJECT_LENGTH,
  normalizeParticipants, validateBeforeCreate, validateBeforeSend,
} from '../groupChatLogic';

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

console.log('\n— MAX_GROUP_PARTICIPANTS —');
assertEq('grens is 8 (WhatsApp Groups API-limiet)', MAX_GROUP_PARTICIPANTS, 8);

console.log('\n— normalizeParticipants() —');
{
  const { participants, errors } = normalizeParticipants([
    { phone: '0612345678', naam: 'Jamie' },
    { phone: '+31 6 1234 5678', naam: 'Jamie dubbel' }, // normaliseert naar hetzelfde nummer → dedupe
    { phone: '0687654321', naam: '  ' },
  ]);
  assertEq('normaliseert naar E.164 zonder +', participants[0].phone, '31612345678');
  ok('dedupliceert op genormaliseerd nummer (2 uniek, niet 3)', participants.length === 2, JSON.stringify(participants));
  ok('lege/whitespace naam wordt null', participants[1].naam === null, JSON.stringify(participants[1]));
  ok('geen fout bij dedupe (stil genegeerd)', errors.length === 0, JSON.stringify(errors));
}
{
  const { participants, errors } = normalizeParticipants([{ phone: 'niet-een-nummer' }]);
  ok('ongeldig nummer → fout, niet in de lijst', participants.length === 0 && errors.length === 1, JSON.stringify({ participants, errors }));
}
{
  const { participants, errors } = normalizeParticipants(undefined);
  ok('undefined input → lege lijst, geen crash', participants.length === 0 && errors.length === 0);
}

console.log('\n— validateBeforeCreate() —');
{
  const errors = validateBeforeCreate({ subject: 'Klus Hotel Okura', participants: [{ phone: '31612345678', naam: null }] });
  ok('geldige invoer → geen fouten', errors.length === 0, JSON.stringify(errors));
}
{
  const errors = validateBeforeCreate({ subject: '', participants: [] });
  ok('lege naam → fout', errors.some(e => e.field === 'subject'));
}
{
  const errors = validateBeforeCreate({ subject: 'x'.repeat(MAX_SUBJECT_LENGTH + 1), participants: [] });
  ok('naam boven de 128-tekenlimiet → fout', errors.some(e => e.field === 'subject'));
}
{
  const negen = Array.from({ length: 9 }, (_, i) => ({ phone: `3161234567${i}`, naam: null }));
  const errors = validateBeforeCreate({ subject: 'Te veel deelnemers', participants: negen });
  ok('9 deelnemers (boven de limiet van 8) → fout', errors.some(e => e.field === 'participants'), JSON.stringify(errors));
}
{
  const acht = Array.from({ length: 8 }, (_, i) => ({ phone: `3161234567${i}`, naam: null }));
  const errors = validateBeforeCreate({ subject: 'Precies 8', participants: acht });
  ok('exact 8 deelnemers → geen fout (grens zelf is toegestaan)', errors.length === 0, JSON.stringify(errors));
}
{
  const errors = validateBeforeCreate({ subject: 'Lange omschrijving', description: 'x'.repeat(2049), participants: [] });
  ok('omschrijving boven de 2048-tekenlimiet → fout', errors.some(e => e.field === 'description'));
}

console.log('\n— validateBeforeSend() —');
{
  const errors = validateBeforeSend({ status: 'active', body: 'Hoi allemaal' });
  ok('actieve groep + tekst → geen fouten', errors.length === 0, JSON.stringify(errors));
}
{
  const errors = validateBeforeSend({ status: 'deleted', body: 'Hoi' });
  ok('verwijderde groep → fout', errors.some(e => e.field === 'status'));
}
{
  const errors = validateBeforeSend({ status: 'active', body: '   ' });
  ok('lege/whitespace tekst → fout', errors.some(e => e.field === 'body'));
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
