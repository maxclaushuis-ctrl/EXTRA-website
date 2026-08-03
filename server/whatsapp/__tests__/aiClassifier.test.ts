/**
 * Unit-tests voor server/whatsapp/aiClassifier.ts
 * Run met:  npx tsx server/whatsapp/__tests__/aiClassifier.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 *
 * WAT HIER GETEST WORDT: het contract tussen model en applicatie — de parsing,
 * de terugvalpaden en de prompt-garanties. Dat is het deel dat stuk kan gaan
 * zonder dat iemand het merkt.
 *
 * WAT HIER NIET GETEST WORDT: of het model zélf de juiste categorie kiest.
 * Daar is een echte API-call voor nodig; die staat in
 * scripts/wa-classificatie-live.ts en draait alleen waar de OpenAI-sleutel is.
 */
import {
  parseAiTurnResponse,
  buildStructuredOutputInstruction,
  buildClassifyOnlySystemPrompt,
  isAiCategory,
  isEscalationReason,
  isTaskCategory,
  AI_CATEGORIES,
  ESCALATION_REASONS,
  TASK_CATEGORIES,
} from '../aiClassifier';

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

function ok(label: string, cond: boolean) {
  assertEq(label, cond, true);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n— type guards —');

ok('isAiCategory("sollicitatie")', isAiCategory('sollicitatie'));
ok('isAiCategory("application") = false (geen vertaling accepteren)', !isAiCategory('application'));
ok('isAiCategory(null) = false', !isAiCategory(null));
ok('isEscalationReason("boos")', isEscalationReason('boos'));
ok('isEscalationReason("angry") = false', !isEscalationReason('angry'));
ok('isTaskCategory("uren_jixbee")', isTaskCategory('uren_jixbee'));
ok('isTaskCategory("hours") = false', !isTaskCategory('hours'));
// Fase 3C: twee nieuwe waarden na de live-run.
ok('isAiCategory("verzoek")', isAiCategory('verzoek'));
ok('isTaskCategory("vervanging")', isTaskCategory('vervanging'));
assertEq('6 categorieën', AI_CATEGORIES.length, 6);
assertEq('5 escalatieredenen', ESCALATION_REASONS.length, 5);
assertEq('4 taakcategorieën', TASK_CATEGORIES.length, 4);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n— parseAiTurnResponse: normaal antwoord —');

const normaal = parseAiTurnResponse(JSON.stringify({
  category: 'algemene_vraag',
  action: 'reply',
  escalation_reason: null,
  reply: 'Hoi Sam! Je wordt elke vrijdag uitbetaald.',
  task: { needed: false, category: 'overig', summary: '' },
}));
assertEq('category', normaal.category, 'algemene_vraag');
assertEq('action', normaal.action, 'reply');
assertEq('escalationReason leeg bij reply', normaal.escalationReason, null);
assertEq('reply-tekst', normaal.reply, 'Hoi Sam! Je wordt elke vrijdag uitbetaald.');
assertEq('geen taak bij needed=false', normaal.task, null);
assertEq('geen fallback', normaal.usedFallback, false);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n— parseAiTurnResponse: escalatie —');

const esc = parseAiTurnResponse(JSON.stringify({
  category: 'klacht',
  action: 'escalate',
  escalation_reason: 'boos',
  reply: '',
  task: { needed: false, category: 'overig', summary: '' },
}));
assertEq('category klacht', esc.category, 'klacht');
assertEq('action escalate', esc.action, 'escalate');
assertEq('reden boos', esc.escalationReason, 'boos');
assertEq('reply leeg', esc.reply, '');

const escOnbekendeReden = parseAiTurnResponse(JSON.stringify({
  category: 'klacht', action: 'escalate', escalation_reason: 'furious', reply: '',
}));
assertEq('onbekende reden → overig', escOnbekendeReden.escalationReason, 'overig');

const escMetTekst = parseAiTurnResponse(JSON.stringify({
  category: 'klacht', action: 'escalate', escalation_reason: 'boos',
  reply: 'Dit had niet verstuurd mogen worden',
}));
assertEq('reply wordt genegeerd bij escalate', escMetTekst.reply, '');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n— parseAiTurnResponse: inconsistente modeloutput —');

const legeReply = parseAiTurnResponse(JSON.stringify({
  category: 'overig', action: 'reply', escalation_reason: null, reply: '',
}));
assertEq('action=reply zonder tekst → escalate', legeReply.action, 'escalate');
assertEq('… met reden overig', legeReply.escalationReason, 'overig');

const geenAction = parseAiTurnResponse(JSON.stringify({
  category: 'afmelding', reply: 'Dank je voor het doorgeven!',
}));
assertEq('ontbrekende action + tekst → reply', geenAction.action, 'reply');

const onbekendeCategorie = parseAiTurnResponse(JSON.stringify({
  category: 'sollicitation', action: 'reply', reply: 'Hoi!',
}));
assertEq('onbekende categorie → overig', onbekendeCategorie.category, 'overig');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n— parseAiTurnResponse: verpakkingen —');

const metFence = parseAiTurnResponse('```json\n{"category":"afmelding","action":"reply","reply":"Oké, genoteerd."}\n```');
assertEq('code fence wordt gestript', metFence.category, 'afmelding');
assertEq('… reply intact', metFence.reply, 'Oké, genoteerd.');

const metPraatje = parseAiTurnResponse('Sure! Here is the JSON:\n{"category":"klacht","action":"escalate","escalation_reason":"boos","reply":""}\nHope this helps.');
assertEq('tekst eromheen wordt genegeerd', metPraatje.category, 'klacht');
assertEq('… reden gevonden', metPraatje.escalationReason, 'boos');

const genest = parseAiTurnResponse('{"category":"algemene_vraag","action":"reply","reply":"Zie {hier}","task":{"needed":false,"category":"overig","summary":""}}');
assertEq('geneste accolades tellen correct', genest.reply, 'Zie {hier}');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n— parseAiTurnResponse: fallback op het oude gedrag —');

const platteTekst = parseAiTurnResponse('Hoi Peter, je dienst staat gepland op maandag.');
assertEq('platte tekst → reply', platteTekst.action, 'reply');
assertEq('… tekst behouden', platteTekst.reply, 'Hoi Peter, je dienst staat gepland op maandag.');
assertEq('… fallback gemarkeerd', platteTekst.usedFallback, true);
assertEq('… categorie overig', platteTekst.category, 'overig');

const oudeEscalate = parseAiTurnResponse('ESCALATE');
assertEq('letterlijke ESCALATE blijft werken', oudeEscalate.action, 'escalate');
assertEq('… reden overig', oudeEscalate.escalationReason, 'overig');
assertEq('… fallback gemarkeerd', oudeEscalate.usedFallback, true);

// Leeg modelantwoord: de parser maakt er GEEN escalatie van, maar een lege
// reply. Dat is bewust — routes.ts ziet de lege tekst en slaat het versturen
// over (zie de `if (!reply) return` daar), zodat er niets leegs de deur uit
// gaat én er geen valse escalatie in de wachtrij belandt.
const leegAntwoord = parseAiTurnResponse('');
assertEq('leeg antwoord → fallback', leegAntwoord.usedFallback, true);
assertEq('leeg antwoord → action reply', leegAntwoord.action, 'reply');
assertEq('leeg antwoord → lege tekst (routes skipt het versturen)', leegAntwoord.reply, '');
assertEq('null → fallback', parseAiTurnResponse(null).usedFallback, true);

const kapotteJson = parseAiTurnResponse('{"category":"klacht","action":');
assertEq('kapotte JSON → fallback (nooit gooien)', kapotteJson.usedFallback, true);

const vreemdeJson = parseAiTurnResponse('{"foo":1,"bar":2}');
assertEq('JSON zonder contractvelden → fallback', vreemdeJson.usedFallback, true);

// ─────────────────────────────────────────────────────────────────────────────
// Fase 3B — de taak-suggestie wordt nu al meegevraagd en geparsed, zodat er in
// fase 3B geen tweede AI-call bij hoeft. Beide testcases van Max komen in het
// ENGELS binnen; de samenvatting moet Nederlands zijn.
console.log('\n— taak-suggestie (fase 3B), Engelstalige testcases —');

// TESTCASE 1: "Max pls add the hours on jixbee for me and Florin cuz i have
// some urgent payments to do. Eveline didnt answer thats why i ask you directly."
const case1 = parseAiTurnResponse(JSON.stringify({
  category: 'algemene_vraag',
  action: 'reply',
  escalation_reason: null,
  reply: "Hi Paul, thanks for your message! I'll pass this on so your hours and Florin's are added to Jixbee as soon as possible.",
  task: {
    needed: true,
    category: 'uren_jixbee',
    summary: 'Uren registreren in Jixbee voor Paul en Florin, urgent i.v.m. uitbetaling',
  },
}));
assertEq('case 1: taak aangemaakt', case1.task !== null, true);
assertEq('case 1: categorie uren_jixbee', case1.task?.category, 'uren_jixbee');
assertEq('case 1: Nederlandse samenvatting', case1.task?.summary,
  'Uren registreren in Jixbee voor Paul en Florin, urgent i.v.m. uitbetaling');
assertEq('case 1: antwoord gaat gewoon door (taak ≠ escalatie)', case1.action, 'reply');
ok('case 1: antwoord blijft in het Engels', case1.reply.startsWith('Hi Paul'));

// TESTCASE 2: "…Yesterday I completely forgot about registering the hours that
// I worked. I was at Pulitzer from 05:00-14:35 (15min brake)"
const case2 = parseAiTurnResponse(JSON.stringify({
  category: 'algemene_vraag',
  action: 'reply',
  escalation_reason: null,
  reply: "Hi Eduardo, thanks for letting me know! I'll make sure your hours from yesterday at Pulitzer (05:00–14:35, 15 min break) get registered.",
  task: {
    needed: true,
    category: 'uren_jixbee',
    summary: 'Uren registreren voor Eduardo, Pulitzer 05:00-14:35, 15 min pauze',
  },
}));
assertEq('case 2: taak aangemaakt', case2.task !== null, true);
assertEq('case 2: categorie uren_jixbee', case2.task?.category, 'uren_jixbee');
assertEq('case 2: Nederlandse samenvatting met tijden', case2.task?.summary,
  'Uren registreren voor Eduardo, Pulitzer 05:00-14:35, 15 min pauze');

// Een taak zonder samenvatting is voor de planner waardeloos → niet aannemen.
const taakZonderSamenvatting = parseAiTurnResponse(JSON.stringify({
  category: 'overig', action: 'reply', reply: 'Ok!',
  task: { needed: true, category: 'uren_jixbee', summary: '   ' },
}));
assertEq('taak zonder samenvatting wordt genegeerd', taakZonderSamenvatting.task, null);

const taakOnbekendeCategorie = parseAiTurnResponse(JSON.stringify({
  category: 'overig', action: 'reply', reply: 'Ok!',
  task: { needed: true, category: 'payroll', summary: 'Iets doen' },
}));
assertEq('onbekende taakcategorie → overig', taakOnbekendeCategorie.task?.category, 'overig');

const taakBijEscalatie = parseAiTurnResponse(JSON.stringify({
  category: 'klacht', action: 'escalate', escalation_reason: 'boos', reply: '',
  task: { needed: true, category: 'contract', summary: 'Contract nakijken van Ana' },
}));
assertEq('taak overleeft een escalatie', taakBijEscalatie.task?.category, 'contract');

// ─────────────────────────────────────────────────────────────────────────────
// De classificatie mag niet op Nederlandse trefwoorden leunen. Dat is een
// eigenschap van de PROMPT, dus daar testen we hem ook op: de instructie moet
// expliciet zeggen dat de enum-waarden identifiers zijn en moet voorbeelden in
// meerdere talen bevatten.
console.log('\n— prompt: taalonafhankelijkheid —');

const instr = buildStructuredOutputInstruction({ withReply: true });
ok('bevat het taalonafhankelijkheids-blok', instr.includes('LANGUAGE INDEPENDENCE'));
ok('zegt dat de waarden identifiers zijn', /internal identifiers/i.test(instr));
ok('verbiedt expliciet keyword-matching', /never on keywords|NOT words to match/i.test(instr));
ok('geeft een Engels voorbeeld', instr.includes('Are you still hiring?'));
ok('geeft een Spaans voorbeeld', instr.includes('Quiero trabajar'));
ok('geeft een Pools voorbeeld', instr.includes('Nie mogę jutro'));
ok('eist Nederlandse taaksamenvatting', /summary" is ALWAYS in Dutch/.test(instr));
ok('noemt uren-na-de-tijd melden als taak', /report worked hours after the fact/.test(instr));
for (const c of AI_CATEGORIES) ok(`prompt noemt categorie ${c}`, instr.includes(c));
for (const r of ESCALATION_REASONS) ok(`prompt noemt reden ${r}`, instr.includes(r));

const metReply = buildStructuredOutputInstruction({ withReply: true });
const zonderReply = buildStructuredOutputInstruction({ withReply: false });
ok('withReply=true vraagt om een bericht', metReply.includes('the message to send to the customer'));
ok('withReply=false laat reply leeg', zonderReply.includes('"reply": ""'));

const classifyOnly = buildClassifyOnlySystemPrompt();
ok('classify-only schrijft geen antwoorden', classifyOnly.includes('You do NOT write replies'));
ok('classify-only gebruikt hetzelfde contract', classifyOnly.includes('OUTPUT FORMAT'));

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} geslaagd, ${failed} gefaald\n`);
process.exit(failed === 0 ? 0 : 1);
