/**
 * Unit-tests voor server/assistant/assistentLogic.ts
 * Run met:  npx tsx server/whatsapp/__tests__/assistentLogic.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 * (Staat bij de andere wa-tests zodat `npm run wa:test` alles in één keer
 * draait — de assistent leunt op dezelfde WhatsApp-verzendinfrastructuur.)
 */
import {
  ACTIE_TTL_MS,
  TOOL_DEFINITIES,
  isActieVerlopen,
  ontbrekendeVariabelen,
  parsePeriode,
  vindGroep,
} from '../../assistant/assistentLogic';

let passed = 0;
let failed = 0;

function assertEq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}\n      actual:   ${JSON.stringify(actual)}\n      expected: ${JSON.stringify(expected)}`);
  }
}

function assertThrows(label: string, fn: () => void) {
  try {
    fn();
    failed++;
    console.error(`  ✗ ${label} — gooide GEEN fout`);
  } catch {
    passed++;
    console.log(`  ✓ ${label}`);
  }
}

const NU = new Date('2026-08-12T12:00:00');

console.log('\n— parsePeriode() —');

// 1. Expliciete periode (juni)
{
  const p = parsePeriode('2026-06-01', '2026-06-30', NU);
  assertEq('juni: vanIso', p.vanIso, '2026-06-01');
  assertEq('juni: totIso', p.totIso, '2026-06-30');
  assertEq('juni: tot is einde van de dag', p.tot.getHours() >= 23, true);
}

// 2. Zonder invoer: 30 dagen terug
{
  const p = parsePeriode(undefined, undefined, NU);
  assertEq('default: totIso = vandaag', p.totIso, '2026-08-12');
  assertEq('default: vanIso = 30 dagen terug', p.vanIso, '2026-07-13');
}

// 3. Ongeldige invoer
assertThrows('van na tot → fout', () => parsePeriode('2026-07-01', '2026-06-01', NU));
assertThrows('geen ISO-formaat → fout', () => parsePeriode('1 juni', '2026-06-30', NU));
assertThrows('alleen van, geen tot → fout', () => parsePeriode('2026-06-01', undefined, NU));

console.log('\n— vindGroep() —');

const GROEPEN = [
  { id: 1, name: 'Marriott Groep' },
  { id: 2, name: 'Hotel Okura' },
  { id: 3, name: 'Marriott Den Haag' },
];

// 4. Exacte match (case-insensitief)
assertEq('exact "hotel okura"', vindGroep(GROEPEN, 'hotel okura'), { soort: 'gevonden', groep: { id: 2, name: 'Hotel Okura' } });

// 5. Genormaliseerde match (spaties/hoofdletters)
assertEq('"marriottgroep" vindt "Marriott Groep"', vindGroep(GROEPEN, 'marriottgroep'), { soort: 'gevonden', groep: { id: 1, name: 'Marriott Groep' } });

// 6. Meerdere substring-treffers → nooit gokken
{
  const r = vindGroep(GROEPEN, 'marriott');
  assertEq('"marriott" → meerdere opties', r.soort, 'meerdere');
  if (r.soort === 'meerdere') assertEq('  beide Marriotts genoemd', r.opties.length, 2);
}

// 7. Eén substring-treffer → gevonden
assertEq('"okura" → Hotel Okura', vindGroep(GROEPEN, 'okura').soort, 'gevonden');

// 8. Niets gevonden → beschikbare namen terug
{
  const r = vindGroep(GROEPEN, 'hilton');
  assertEq('"hilton" → niets', r.soort, 'niets');
  if (r.soort === 'niets') assertEq('  beschikbare lijst compleet', r.beschikbaar.length, 3);
}

// 9. Lege zoekterm
assertEq('lege zoekterm → niets', vindGroep(GROEPEN, '').soort, 'niets');

console.log('\n— ontbrekendeVariabelen() —');

// 10. Auto-variabelen tellen nooit als ontbrekend
assertEq('voornaam/achternaam/naam zijn auto', ontbrekendeVariabelen(['voornaam', 'achternaam', 'naam'], undefined), []);

// 11. Overige variabelen zonder waarde ontbreken
assertEq('datum ontbreekt', ontbrekendeVariabelen(['voornaam', 'datum'], undefined), ['datum']);

// 12. Meegeleverde waarde dekt de variabele
assertEq('datum meegeleverd', ontbrekendeVariabelen(['voornaam', 'datum'], { datum: '1 september' }), []);

// 13. Lege string telt niet als waarde
assertEq('lege waarde telt niet', ontbrekendeVariabelen(['datum'], { datum: '   ' }), ['datum']);

// 14. Hoofdletters in auto-variabelen
assertEq('Voornaam (hoofdletter) is ook auto', ontbrekendeVariabelen(['Voornaam'], undefined), []);

console.log('\n— isActieVerlopen() —');

// 15/16. TTL-grens
assertEq('binnen TTL → niet verlopen', isActieVerlopen(1000, 1000 + ACTIE_TTL_MS), false);
assertEq('voorbij TTL → verlopen', isActieVerlopen(1000, 1000 + ACTIE_TTL_MS + 1), true);

console.log('\n— TOOL_DEFINITIES —');

// 17. Elke tool heeft naam + parameters (vangt kapotte definities vóór runtime)
assertEq(
  'alle tools hebben function.name en parameters',
  TOOL_DEFINITIES.every(t => t.type === 'function' && !!t.function?.name && !!t.function?.parameters),
  true,
);

// 18. De actie-tool bestaat en vereist groep/template/reden
{
  const actieTool = TOOL_DEFINITIES.find(t => t.function.name === 'zet_template_verzending_klaar');
  assertEq('actie-tool vereist groep+template+reden', (actieTool?.function.parameters as any)?.required, ['groep', 'template', 'reden']);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
