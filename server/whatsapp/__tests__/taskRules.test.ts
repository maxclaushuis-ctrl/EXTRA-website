/**
 * Fase 3B — tests voor taskRules.ts.
 *
 * Draaien met:  npx tsx server/whatsapp/__tests__/taskRules.test.ts
 *
 * Deze tests raken bewust GEEN database: taskRules.ts importeert niets uit
 * drizzle, juist zodat de beslissing "wordt dit een taak" los te testen is.
 */
import {
  MAX_SUMMARY_LEN,
  normalizeSummary,
  dedupeKey,
  buildTaskDraft,
  isDuplicateOfOpenTask,
  TASK_CATEGORY_LABELS,
} from '../taskRules';

let geslaagd = 0;
let gezakt = 0;

function ok(naam: string, waarde: boolean) {
  if (waarde) { geslaagd++; console.log(`  ✓ ${naam}`); }
  else { gezakt++; console.error(`  ✗ ${naam}`); }
}

function assertEq(naam: string, gekregen: any, verwacht: any) {
  const gelijk = JSON.stringify(gekregen) === JSON.stringify(verwacht);
  if (gelijk) { geslaagd++; console.log(`  ✓ ${naam}`); }
  else { gezakt++; console.error(`  ✗ ${naam}\n      verwacht: ${JSON.stringify(verwacht)}\n      gekregen: ${JSON.stringify(gekregen)}`); }
}

console.log('\n=== normalizeSummary ===');
assertEq('gewone tekst blijft heel', normalizeSummary('Uren doorgeven in Jixbee'), 'Uren doorgeven in Jixbee');
assertEq('witruimte platgeslagen', normalizeSummary('  Uren   doorgeven\n\tin Jixbee  '), 'Uren doorgeven in Jixbee');
assertEq('null → lege string', normalizeSummary(null), '');
assertEq('undefined → lege string', normalizeSummary(undefined), '');
assertEq('lege string → lege string', normalizeSummary('   '), '');
assertEq('alleen leestekens → lege string', normalizeSummary('...'), '');
assertEq('alleen streepjes → lege string', normalizeSummary('- - -'), '');
assertEq('cijfer telt als betekenis', normalizeSummary('2026'), '2026');
assertEq('accent telt als betekenis', normalizeSummary('café'), 'café');
assertEq('niet-latijns schrift blijft staan', normalizeSummary('umowa o pracę'), 'umowa o pracę');

// Afkappen: precies op de grens niets doen, daarboven wél.
const exactMax = 'a'.repeat(MAX_SUMMARY_LEN);
assertEq('exact MAX_SUMMARY_LEN blijft ongewijzigd', normalizeSummary(exactMax), exactMax);
ok('exact MAX heeft geen ellips', !normalizeSummary(exactMax).endsWith('…'));

const langMetSpaties = ('woord '.repeat(60)).trim(); // ruim over de limiet
const afgekapt = normalizeSummary(langMetSpaties);
ok('te lang wordt afgekapt', afgekapt.length <= MAX_SUMMARY_LEN);
ok('afgekapte tekst eindigt op ellips', afgekapt.endsWith('…'));
ok('afgekapt op een woordgrens (geen half woord)', !/woor…$/.test(afgekapt));

// Eén lang woord zonder spaties: dan mág hij midden in het woord kappen,
// anders zou er niets overblijven.
const eenLangWoord = 'x'.repeat(MAX_SUMMARY_LEN + 50);
const afgekaptWoord = normalizeSummary(eenLangWoord);
ok('lang woord zonder spaties wordt toch afgekapt', afgekaptWoord.length <= MAX_SUMMARY_LEN);
ok('lang woord houdt de ellips', afgekaptWoord.endsWith('…'));
ok('lang woord blijft substantieel', afgekaptWoord.length > MAX_SUMMARY_LEN * 0.9);

console.log('\n=== dedupeKey ===');
assertEq('hoofdletters weg', dedupeKey('Uren Registreren'), 'uren registreren');
assertEq('leestekens weg', dedupeKey('Uren registreren voor Eduardo.'), 'uren registreren voor eduardo');
assertEq('diakrieten weg', dedupeKey('café'), 'cafe');
assertEq('dubbele spaties samengevoegd', dedupeKey('uren   registreren'), 'uren registreren');
assertEq('null → lege string', dedupeKey(null), '');
assertEq('alleen leestekens → lege string', dedupeKey('!!!'), '');
ok(
  'zelfde strekking, andere schrijfwijze → zelfde sleutel',
  dedupeKey('Uren registreren voor Eduardo.') === dedupeKey('uren  registreren voor eduardo'),
);
ok(
  'echt andere taak → andere sleutel',
  dedupeKey('Uren registreren voor Eduardo') !== dedupeKey('Contract opsturen naar Eduardo'),
);

console.log('\n=== buildTaskDraft ===');
assertEq('null in → null uit', buildTaskDraft(null), null);
assertEq('undefined in → null uit', buildTaskDraft(undefined), null);
assertEq(
  'needed=false → geen taak',
  buildTaskDraft({ needed: false, summary: 'Uren doorgeven', category: 'uren_jixbee' } as any),
  null,
);
assertEq(
  'needed ontbreekt → geen taak (streng, niet gokken)',
  buildTaskDraft({ summary: 'Uren doorgeven', category: 'uren_jixbee' } as any),
  null,
);
assertEq(
  'needed als string "true" telt niet',
  buildTaskDraft({ needed: 'true', summary: 'Uren doorgeven', category: 'uren_jixbee' } as any),
  null,
);
assertEq(
  'lege samenvatting → geen taak',
  buildTaskDraft({ needed: true, summary: '   ', category: 'uren_jixbee' } as any),
  null,
);
assertEq(
  'samenvatting zonder letters → geen taak',
  buildTaskDraft({ needed: true, summary: '???', category: 'contract' } as any),
  null,
);
assertEq(
  'geldige taak komt er netjes uit',
  buildTaskDraft({ needed: true, summary: '  Uren doorgeven in Jixbee ', category: 'uren_jixbee' } as any),
  { summary: 'Uren doorgeven in Jixbee', category: 'uren_jixbee' },
);
assertEq(
  'onbekende categorie valt terug op overig',
  buildTaskDraft({ needed: true, summary: 'Iets anders', category: 'verzonnen_categorie' } as any),
  { summary: 'Iets anders', category: 'overig' },
);
assertEq(
  'ontbrekende categorie valt terug op overig',
  buildTaskDraft({ needed: true, summary: 'Iets anders' } as any),
  { summary: 'Iets anders', category: 'overig' },
);
assertEq(
  'contract-categorie blijft contract',
  buildTaskDraft({ needed: true, summary: 'Contract opsturen', category: 'contract' } as any),
  { summary: 'Contract opsturen', category: 'contract' },
);
// Engelstalige samenvatting: de classificatie is taalonafhankelijk, dus de
// regels eromheen mogen ook niet op Nederlandse woorden leunen.
assertEq(
  'Engelse samenvatting werkt net zo goed',
  buildTaskDraft({ needed: true, summary: 'Check hours in Jixbee for Florin', category: 'uren_jixbee' } as any),
  { summary: 'Check hours in Jixbee for Florin', category: 'uren_jixbee' },
);

console.log('\n=== isDuplicateOfOpenTask ===');
ok('lege lijst → nooit duplicaat', isDuplicateOfOpenTask('Uren doorgeven', []) === false);
ok(
  'identieke samenvatting → duplicaat',
  isDuplicateOfOpenTask('Uren doorgeven', ['Uren doorgeven']) === true,
);
ok(
  'andere schrijfwijze → nog steeds duplicaat',
  isDuplicateOfOpenTask('Uren registreren voor Eduardo', ['uren registreren voor eduardo.']) === true,
);
ok(
  'andere taak → geen duplicaat',
  isDuplicateOfOpenTask('Contract opsturen', ['Uren doorgeven']) === false,
);
ok(
  'match ergens midden in de lijst wordt gevonden',
  isDuplicateOfOpenTask('Contract opsturen', ['Uren doorgeven', 'Contract opsturen', 'Iets anders']) === true,
);
ok(
  'null-waarden in de lijst laten het niet klappen',
  isDuplicateOfOpenTask('Uren doorgeven', [null, undefined, 'Uren doorgeven']) === true,
);
ok(
  'lege nieuwe samenvatting → geen duplicaat (die komt er toch niet in)',
  isDuplicateOfOpenTask('', ['Uren doorgeven']) === false,
);
ok(
  'samenvatting zonder betekenis matcht niet met lege bestaande',
  isDuplicateOfOpenTask('...', ['...']) === false,
);

console.log('\n=== TASK_CATEGORY_LABELS ===');
assertEq('uren_jixbee heeft een leesbaar label', TASK_CATEGORY_LABELS.uren_jixbee, 'Uren / Jixbee');
assertEq('contract heeft een leesbaar label', TASK_CATEGORY_LABELS.contract, 'Contract');
assertEq('overig heeft een leesbaar label', TASK_CATEGORY_LABELS.overig, 'Overig');
assertEq('precies drie categorieën', Object.keys(TASK_CATEGORY_LABELS).sort(), ['contract', 'overig', 'uren_jixbee']);

console.log(`\n${gezakt === 0 ? '✅' : '❌'} taskRules: ${geslaagd} geslaagd, ${gezakt} gezakt\n`);
process.exit(gezakt === 0 ? 0 : 1);
