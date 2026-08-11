/**
 * Unit-tests voor server/whatsapp/templateLogic.ts (de DB-loze template-
 * logica: slug, variabelen, statusvertaling, validatie, provider-payload).
 * Bewust NIET voor templates.ts zelf — dat importeert ../db, wat zonder
 * DATABASE_URL direct een exception gooit (zelfde reden waarom storage.ts
 * geen eigen unit-test heeft; zie phone.ts/phone.test.ts voor het patroon).
 *
 * Run met:  npx tsx server/whatsapp/__tests__/templates.test.ts
 */
import {
  slugify, extractVariables, toProviderBodyText, mapProviderStatus,
  validateButtonFields, validateBeforeSubmit, buildTemplateComponents,
} from '../templateLogic';

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

// Minimale fabriek voor een WhatsappTemplate-achtig object — alleen de velden
// die validateBeforeSubmit()/buildTemplateComponents() daadwerkelijk lezen.
function fakeTemplate(overrides: Record<string, any> = {}): any {
  return {
    id: 1,
    key: 'test_template',
    name: 'Test template',
    description: null,
    category: 'UTILITY',
    language: 'nl',
    bodyPreview: 'Hoi {voornaam}, je afspraak is op {datum}.',
    variables: ['voornaam', 'datum'],
    status: 'concept',
    ctaSignup: false,
    buttonText: null,
    buttonUrl: null,
    buttonDynamic: false,
    buttonExample: null,
    exampleValues: { voornaam: 'Max', datum: '12 maart' },
    metaStatusReason: null,
    metaStatusRaw: null,
    submittedAt: null,
    statusSyncedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

console.log('\n— slugify() —');
assertEq('lowercase + spaties → underscore', slugify('Herinnering Kennismakingsgesprek'), 'herinnering_kennismakingsgesprek');
assertEq('diakrieten worden verwijderd', slugify('Café Overëenkomst'), 'cafe_overeenkomst');
assertEq('leidende/sluitende underscores weg', slugify('  !!Actie!!  '), 'actie');
assertEq('lege input → fallback', slugify(''), 'template');
assertEq('max 60 tekens', slugify('a'.repeat(80)).length, 60);

console.log('\n— extractVariables() —');
assertEq('eerste-voorkomen-volgorde, gededupliceerd', extractVariables('Hoi {voornaam}, {voornaam} nogmaals, en {datum}'), ['voornaam', 'datum']);
assertEq('geen variabelen → lege array', extractVariables('Gewone tekst zonder placeholders'), []);
assertEq('lege/undefined input → lege array', extractVariables(''), []);

console.log('\n— toProviderBodyText() —');
assertEq(
  'positionele {{n}}-mapping volgens variables-volgorde',
  toProviderBodyText('Hoi {voornaam}, je afspraak is op {datum}.', ['voornaam', 'datum']),
  'Hoi {{1}}, je afspraak is op {{2}}.',
);
assertEq('geen variabelen → tekst ongewijzigd', toProviderBodyText('Gewone tekst', []), 'Gewone tekst');

console.log('\n— mapProviderStatus() —');
assertEq('PENDING → in_review', mapProviderStatus('PENDING'), 'in_review');
assertEq('submitted → in_review', mapProviderStatus('submitted'), 'in_review');
assertEq('in_appeal → in_review', mapProviderStatus('in_appeal'), 'in_review');
assertEq('APPROVED → approved', mapProviderStatus('APPROVED'), 'approved');
assertEq('REJECTED → rejected', mapProviderStatus('REJECTED'), 'rejected');
assertEq('DISABLED → rejected', mapProviderStatus('DISABLED'), 'rejected');
assertEq('onbekend/leeg → in_review (nooit verzonnen)', mapProviderStatus(null), 'in_review');

console.log('\n— validateButtonFields() —');
assertEq('geen knop ingevuld → geen fouten', validateButtonFields({}), []);
assertEq('tekst zonder url → 1 fout', validateButtonFields({ buttonText: 'Aanmelden' }).length, 1);
assertEq('url zonder tekst → 1 fout', validateButtonFields({ buttonUrl: 'https://doehetextra.nl' }).length, 1);
assertEq('http (geen https) → fout', validateButtonFields({ buttonText: 'Ga', buttonUrl: 'http://onveilig.nl' }).length, 1);
assertEq('tekst > 25 tekens → fout', validateButtonFields({ buttonText: 'a'.repeat(26), buttonUrl: 'https://x.nl' }).length, 1);
assertEq('geldige knop → geen fouten', validateButtonFields({ buttonText: 'Aanmelden', buttonUrl: 'https://doehetextra.nl' }), []);

console.log('\n— validateBeforeSubmit() —');
assertEq('compleet + alle voorbeeldwaarden → geen fouten', validateBeforeSubmit(fakeTemplate()), []);
assertEq('ontbrekende voorbeeldwaarde → fout', validateBeforeSubmit(fakeTemplate({ exampleValues: { voornaam: 'Max' } })).length, 1);
assertEq('lege naam → fout', validateBeforeSubmit(fakeTemplate({ name: '  ' })).some((e: any) => e.field === 'name'), true);
assertEq('lege body → fout', validateBeforeSubmit(fakeTemplate({ bodyPreview: '' })).some((e: any) => e.field === 'bodyPreview'), true);
assertEq('ongeldige categorie → fout', validateBeforeSubmit(fakeTemplate({ category: 'ONGELDIG' })).some((e: any) => e.field === 'category'), true);
assertEq(
  'dynamische knop zonder voorbeeldwaarde → fout',
  validateBeforeSubmit(fakeTemplate({ buttonText: 'Bekijk', buttonUrl: 'https://doehetextra.nl/shift/', buttonDynamic: true, buttonExample: null }))
    .some((e: any) => e.field === 'buttonExample'),
  true,
);

console.log('\n— buildTemplateComponents() —');
{
  const components = buildTemplateComponents(fakeTemplate());
  assertEq('body-component eerst, met {{n}}-tekst', components[0], {
    type: 'BODY',
    text: 'Hoi {{1}}, je afspraak is op {{2}}.',
    example: { body_text: [['Max', '12 maart']] },
  });
  assertEq('geen knop ingevuld → geen BUTTONS-component', components.length, 1);
}
{
  const met_knop = buildTemplateComponents(fakeTemplate({ buttonText: 'Aanmelden', buttonUrl: 'https://doehetextra.nl' }));
  assertEq('statische knop → BUTTONS-component zonder example', met_knop[1], {
    type: 'BUTTONS',
    buttons: [{ type: 'URL', text: 'Aanmelden', url: 'https://doehetextra.nl' }],
  });
}
{
  const dynamisch = buildTemplateComponents(fakeTemplate({
    buttonText: 'Bekijk', buttonUrl: 'https://doehetextra.nl/shift/', buttonDynamic: true, buttonExample: '1234',
  }));
  assertEq('dynamische knop → example is de kale variabelewaarde', dynamisch[1], {
    type: 'BUTTONS',
    buttons: [{ type: 'URL', text: 'Bekijk', url: 'https://doehetextra.nl/shift/', example: ['1234'] }],
  });
}
{
  const zonderVariabelen = buildTemplateComponents(fakeTemplate({ bodyPreview: 'Vaste tekst zonder variabelen.', variables: [] }));
  assertEq('geen variabelen → body-component zonder example', zonderVariabelen[0], {
    type: 'BODY',
    text: 'Vaste tekst zonder variabelen.',
  });
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
