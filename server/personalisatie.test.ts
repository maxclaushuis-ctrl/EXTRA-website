/**
 * Unit-tests voor server/personalisatie.ts
 * Run met:  npx tsx server/personalisatie.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 *
 * De vraag die deze tests beantwoorden is heel concreet: kan er ooit een
 * letterlijke {{voornaam}} in een verzonden mail belanden? Alles hieronder gaat
 * daarover.
 */
import {
  personaliseer, waarden, onbekendePlaceholders, gebruikteTags, ontbrekendeVelden,
  aanhefTwijfel, TWIJFEL_UITLEG,
  AANSPREEK_TERUGVAL, BEDRIJF_TERUGVAL, TAG_ALIASSEN,
} from "./personalisatie";

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean, extra?: string) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${extra ? `\n      ${extra}` : ""}`); }
}

function eq(label: string, actual: unknown, expected: unknown) {
  const gelijk = JSON.stringify(actual) === JSON.stringify(expected);
  ok(label, gelijk, gelijk ? undefined : `actual:   ${JSON.stringify(actual)}\n      expected: ${JSON.stringify(expected)}`);
}

const LARS = {
  voornaam: 'Lars', achternaam: 'Schrijnemakers', naam: 'Lars Schrijnemakers',
  company: 'Pulitzer Amsterdam', function: 'Food & Beverage Manager', stad: 'Amsterdam',
};
const KAAL = { voornaam: '', achternaam: '', naam: '', company: '', function: '', stad: '' };

console.log("\n— de gewone schrijfwijze —");
eq("voornaam", personaliseer('Beste {{voornaam}},', LARS), 'Beste Lars,');
eq("bedrijf", personaliseer('voor {{bedrijf}}', LARS), 'voor Pulitzer Amsterdam');
eq("stad", personaliseer('in {{stad}}', LARS), 'in Amsterdam');
eq("volledige naam", personaliseer('{{naam}}', LARS), 'Lars Schrijnemakers');
eq("achternaam", personaliseer('{{achternaam}}', LARS), 'Schrijnemakers');
eq("meerdere in één zin", personaliseer('Hi {{voornaam}}, hoe gaat het bij {{bedrijf}}?', LARS), 'Hi Lars, hoe gaat het bij Pulitzer Amsterdam?');
eq("dezelfde tag twee keer", personaliseer('{{voornaam}} en nog eens {{voornaam}}', LARS), 'Lars en nog eens Lars');

console.log("\n— de schrijfwijzen die eerst bléven staan —");
eq("spaties binnen de accolades", personaliseer('Hi {{ voornaam }},', LARS), 'Hi Lars,');
eq("spatie aan één kant", personaliseer('Hi {{voornaam }},', LARS), 'Hi Lars,');
eq("enkele accolade", personaliseer('Hi {voornaam},', LARS), 'Hi Lars,');
eq("rechte haken", personaliseer('Hi [voornaam],', LARS), 'Hi Lars,');
eq("dubbele rechte haken", personaliseer('Hi [[voornaam]],', LARS), 'Hi Lars,');
eq("hoofdletters", personaliseer('Hi {{Voornaam}},', LARS), 'Hi Lars,');
eq("hoofdletters en spaties", personaliseer('Hi {{ VOORNAAM }},', LARS), 'Hi Lars,');

console.log("\n— aliassen uit andere pakketten —");
eq("first_name", personaliseer('{{first_name}}', LARS), 'Lars');
eq("firstname", personaliseer('{{firstname}}', LARS), 'Lars');
eq("company", personaliseer('{{company}}', LARS), 'Pulitzer Amsterdam');
eq("functie", personaliseer('{{functie}}', LARS), 'Food & Beverage Manager');
eq("plaats", personaliseer('{{plaats}}', LARS), 'Amsterdam');

console.log("\n— de functietitel komt uit de kolom die echt bestaat —");
{
  // prospect_contacts heeft een kolom `function`, geen `functietitel`.
  // Hierdoor bleef {{functietitel}} vóór deze wijziging altijd leeg.
  eq("uit function", personaliseer('{{functietitel}}', { function: 'Directeur' }), 'Directeur');
  eq("functietitel wint als beide er zijn", personaliseer('{{functietitel}}', { function: 'a', functietitel: 'b' }), 'b');
}

console.log("\n— zonder gegevens komt er nooit een tag in beeld —");
{
  const uit = personaliseer('Beste {{voornaam}}, bij {{bedrijf}} in {{stad}} als {{functietitel}}.', KAAL);
  ok("geen accolades meer over", !/[{}[\]]/.test(uit), uit);
  eq("terugval op daar en uw organisatie", uit, 'Beste daar, bij uw organisatie in  als .');
  eq("de terugval is bewust gekozen", AANSPREEK_TERUGVAL, 'daar');
  eq("en die voor het bedrijf ook", BEDRIJF_TERUGVAL, 'uw organisatie');
}
eq("null-velden crashen niet", personaliseer('Hi {{voornaam}}', { voornaam: null, naam: null } as any), 'Hi daar');
eq("leeg contact", personaliseer('Hi {{voornaam}}', {}), 'Hi daar');
eq("lege tekst", personaliseer('', LARS), '');
eq("null-tekst", personaliseer(null as any, LARS), '');

console.log("\n— naam wordt opgebouwd als hij ontbreekt —");
eq("uit voor- en achternaam", personaliseer('{{naam}}', { voornaam: 'Kim', achternaam: 'Foster' }), 'Kim Foster');
eq("alleen een voornaam", personaliseer('{{naam}}', { voornaam: 'Kim' }), 'Kim');

console.log("\n— tekst die géén tag is, blijft met rust —");
eq("losse accolades", personaliseer('Kosten { per uur }', LARS), 'Kosten { per uur }');
eq("onbekende tag blijft staan", personaliseer('{{voormaam}}', LARS), '{{voormaam}}');
eq("css-achtige tekst", personaliseer('body { color: red }', LARS), 'body { color: red }');
eq("een markdown-link blijft heel", personaliseer('[onze werkwijze](https://x.nl)', LARS), '[onze werkwijze](https://x.nl)');
eq("json-achtige tekst", personaliseer('{"a": 1}', LARS), '{"a": 1}');

console.log("\n— onbekendePlaceholders(): de waarschuwing vóór verzenden —");
eq("tikfout wordt gevonden", onbekendePlaceholders('Beste {{voormaam}},'), ['{{voormaam}}']);
eq("goede tag geeft geen waarschuwing", onbekendePlaceholders('Beste {{voornaam}},'), []);
eq("alias geeft geen waarschuwing", onbekendePlaceholders('{{first_name}}'), []);
eq("spaties tellen niet mee", onbekendePlaceholders('{{ voornaam }}'), []);
eq("twee verschillende", onbekendePlaceholders('{{a1}} en {{b2}}').length, 2);
eq("dezelfde twee keer telt één keer", onbekendePlaceholders('{{xx}} {{xx}}'), ['{{xx}}']);
eq("enkele accolades geven geen vals alarm", onbekendePlaceholders('body { color: red }'), []);
eq("lege tekst", onbekendePlaceholders(''), []);

console.log("\n— gebruikteTags() —");
eq("welke tags staan erin", gebruikteTags('Beste {{voornaam}} bij {{bedrijf}}').sort(), ['bedrijf', 'voornaam']);
eq("alias telt als het echte veld", gebruikteTags('{{first_name}}'), ['voornaam']);
eq("onbekende tag telt niet mee", gebruikteTags('{{voormaam}}'), []);
eq("geen tags", gebruikteTags('Gewone tekst'), []);

console.log("\n— ontbrekendeVelden(): wie krijgt de terugval te zien —");
eq("volledig contact mist niets", ontbrekendeVelden(['voornaam', 'bedrijf'], LARS), []);
eq("zonder voornaam", ontbrekendeVelden(['voornaam'], { company: 'X' }), ['voornaam']);
eq("zonder bedrijf", ontbrekendeVelden(['bedrijf'], { voornaam: 'Kim' }), ['bedrijf']);
eq("allebei", ontbrekendeVelden(['voornaam', 'bedrijf'], {}).sort(), ['bedrijf', 'voornaam']);
eq("een tag die niet in de tekst staat telt niet", ontbrekendeVelden(['voornaam'], LARS), []);
eq("witruimte telt als leeg", ontbrekendeVelden(['voornaam'], { voornaam: '   ' }), ['voornaam']);

console.log("\n— waarden() —");
{
  const w = waarden(LARS);
  eq("voornaam", w.voornaam, 'Lars');
  eq("functietitel uit function", w.functietitel, 'Food & Beverage Manager');
  eq("alle zes velden", Object.keys(w).sort(), ['achternaam', 'bedrijf', 'functietitel', 'naam', 'stad', 'voornaam']);
  ok("elk veld in TAG_ALIASSEN heeft een waarde", Object.keys(TAG_ALIASSEN).every(v => v in w));
}

console.log("\n— aanhefTwijfel(): namen die er wél zijn maar geen naam zijn —");
{
  // Gewone namen mogen nooit gemeld worden; een valse waarschuwing bij 300
  // ontvangers maakt het scherm onbruikbaar.
  for (const naam of ['Lars', 'Kim', 'Jan-Peter', 'Iiro', 'Junio Andrea', "Hubert-Jan", 'José', 'Eveline', 'Anne']) {
    eq(`"${naam}" is gewoon goed`, aanhefTwijfel(naam), null);
  }
}
{
  eq("leeg", aanhefTwijfel(''), 'leeg');
  eq("null", aanhefTwijfel(null), 'leeg');
  eq("alleen spaties", aanhefTwijfel('   '), 'leeg');
}
{
  // Dit is het geval waar geen enkele controle op afging: er stáát een
  // voornaam, dus geen waarschuwing, en de mail begint met
  // "Beste Reserveringen,".
  eq("Info", aanhefTwijfel('Info'), 'postbusnaam');
  eq("Reserveringen", aanhefTwijfel('Reserveringen'), 'postbusnaam');
  eq("Front Office", aanhefTwijfel('Front office'), 'postbusnaam');
  eq("sales in kleine letters", aanhefTwijfel('sales'), 'postbusnaam');
  eq("Banqueting", aanhefTwijfel('Banqueting'), 'postbusnaam');
}
{
  eq("losse initiaal", aanhefTwijfel('H'), 'initiaal');
  eq("initiaal met punt", aanhefTwijfel('H.'), 'initiaal');
  eq("dubbele initiaal", aanhefTwijfel('J.P.'), 'initiaal');
}
{
  eq("geschreeuw", aanhefTwijfel('LARS'), 'hoofdletters');
  eq("twee woorden in hoofdletters", aanhefTwijfel('JAN PETER'), 'hoofdletters');
  eq("een normale naam met hoofdletter niet", aanhefTwijfel('Lars'), null);
}
{
  eq("een e-mailadres als naam", aanhefTwijfel('info@hotel.nl'), 'geen_naam');
  eq("cijfers erin", aanhefTwijfel('Kim2'), 'geen_naam');
  eq("underscore", aanhefTwijfel('jan_p'), 'geen_naam');
  eq("alleen leestekens", aanhefTwijfel('---'), 'geen_naam');
}
{
  ok("elke reden heeft een uitleg", (['leeg','postbusnaam','initiaal','hoofdletters','geen_naam'] as const).every(r => !!TWIJFEL_UITLEG[r]));
}

console.log("\n— de preheader: de plek waar het écht misging —");
{
  // De preheader is de voorbeeldtekst naast de onderwerpregel in de inbox. Die
  // werd opgebouwd uit de ruwe bloktekst en pas daarna afgekapt op 100 tekens,
  // zónder personalisatie. Iedereen zag dus letterlijk "Beste {{voornaam}}," in
  // zijn inbox staan, nog voordat de mail geopend was.
  //
  // Deze test bewaakt de volgorde: eerst vervangen, dan afkappen. Andersom
  // wordt een tag halverwege doorgesneden en is hij niet meer te vervangen.
  const ruw = 'Beste {{voornaam}}, fijn dat we voor {{bedrijf}} mogen werken. '.repeat(4);

  const goed = personaliseer(ruw, LARS).slice(0, 100);
  ok("vervangen en dan afkappen levert geen tag op", !/[{}]/.test(goed), goed);
  ok("en de voornaam staat erin", goed.includes('Lars'), goed);

  const fout = personaliseer(ruw.slice(0, 100), LARS);
  ok("afkappen en dan vervangen laat een halve tag staan", /\{\{|\}\}/.test(fout) || fout.length < 100, fout);
}
{
  // Zonder voornaam moet ook de preheader leesbaar blijven.
  const p = personaliseer('Beste {{voornaam}}, namens {{bedrijf}}.', KAAL);
  eq("terugval werkt ook hier", p, 'Beste daar, namens uw organisatie.');
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
