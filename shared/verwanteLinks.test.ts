/**
 * Unit-tests voor shared/verwanteLinks.ts
 * Run met:  npx tsx shared/verwanteLinks.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 *
 * De belangrijkste test is die van de linkgrafiek. De hele reden voor een ring
 * in plaats van "de eerste zes andere" is dat de inkomende links gelijk verdeeld
 * moeten zijn. Dat is geen gevoel maar een eigenschap, en die wordt hier geteld.
 */
import {
  ringVolgorde, verwanteItems, verwantFragment, linkGrafiek, AANTAL_VERWANT,
  type RingItem,
} from "./verwanteLinks";

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

/** De negen pagina's uit de Ahrefs-melding, in de vorm die hier binnenkomt. */
const VACATURES: RingItem[] = [
  { slug: 'ontbijtchef-amsterdam-pulitzer', title: 'Ontbijtchef Amsterdam – Pulitzer', groep: 'Amsterdam' },
  { slug: 'kok-amsterdam-marriott', title: 'Kok Amsterdam – Marriott', groep: 'Amsterdam' },
  { slug: 'kok-amsterdam-marriott-fulltime', title: 'Kok Amsterdam Fulltime – Marriott', groep: 'Amsterdam' },
  { slug: 'housekeeping-amsterdam-amrath-parttime', title: 'Housekeeping Amsterdam – Grand Hotel Amrâth', groep: 'Amsterdam' },
  { slug: 'housekeeping-scheveningen-kurhaus-fulltime', title: 'Housekeeping Scheveningen Fulltime', groep: 'Scheveningen' },
  { slug: 'housekeeping-scheveningen-kurhaus-parttime', title: 'Housekeeping Scheveningen – Amrâth Kurhaus', groep: 'Scheveningen' },
  { slug: 'zelfstandig-werkend-kok-amsterdam-pulitzer', title: 'Kok Amsterdam – Pulitzer', groep: 'Amsterdam' },
  { slug: 'housekeeping-amsterdam-amrath-fulltime', title: 'Housekeeping Amsterdam Fulltime – Amrâth', groep: 'Amsterdam' },
];

console.log("\n— ringVolgorde(): vast en groepsgewijs —");
{
  const a = ringVolgorde(VACATURES).map(i => i.slug);
  const b = ringVolgorde([...VACATURES].reverse()).map(i => i.slug);
  eq("de volgorde van de database maakt niet uit", a, b);

  const groepen = ringVolgorde(VACATURES).map(i => i.groep);
  const eersteScheveningen = groepen.indexOf('Scheveningen');
  const laatsteScheveningen = groepen.lastIndexOf('Scheveningen');
  ok("dezelfde groep staat bij elkaar",
     laatsteScheveningen - eersteScheveningen === groepen.filter(g => g === 'Scheveningen').length - 1);
}
{
  eq("lege lijst", ringVolgorde([]), []);
  eq("null crasht niet", ringVolgorde(null as any), []);
  eq("items zonder slug vallen af", ringVolgorde([{ slug: '', title: 'x' }, { slug: 'a', title: '' }] as any), []);
}

console.log("\n— verwanteItems() —");
{
  const uit = verwanteItems(VACATURES, 'kok-amsterdam-marriott', 4);
  eq("er komen er precies vier", uit.length, 4);
  ok("nooit zichzelf", !uit.some(i => i.slug === 'kok-amsterdam-marriott'));
  ok("geen duplicaten", new Set(uit.map(i => i.slug)).size === uit.length);
}
{
  eq("onbekende slug geeft niets", verwanteItems(VACATURES, 'bestaat-niet'), []);
  eq("lege slug geeft niets", verwanteItems(VACATURES, ''), []);
  eq("één item geeft niets", verwanteItems([VACATURES[0]], VACATURES[0].slug), []);
  eq("lege lijst geeft niets", verwanteItems([], 'x'), []);
}
{
  // Meer vragen dan er zijn mag niet tot zichzelf of duplicaten leiden.
  const drie = VACATURES.slice(0, 3);
  const uit = verwanteItems(drie, drie[0].slug, 10);
  eq("nooit meer dan er zijn", uit.length, 2);
  ok("en nog steeds niet zichzelf", !uit.some(i => i.slug === drie[0].slug));
}
{
  const a = verwanteItems(VACATURES, 'kok-amsterdam-marriott', 4).map(i => i.slug);
  const b = verwanteItems([...VACATURES].reverse(), 'kok-amsterdam-marriott', 4).map(i => i.slug);
  eq("zelfde uitkomst, ongeacht de invoervolgorde", a, b);
}
{
  // Buren in de ring horen bij dezelfde groep zolang die groep groot genoeg is.
  const uit = verwanteItems(VACATURES, 'housekeeping-scheveningen-kurhaus-fulltime', 1);
  eq("de eerste link blijft binnen de eigen stad", uit[0].groep, 'Scheveningen');
}

console.log("\n— de linkgrafiek: iedereen krijgt evenveel —");
{
  const k = 4;
  const grafiek = linkGrafiek(VACATURES, k);
  eq("elke pagina staat in de grafiek", grafiek.size, VACATURES.length);

  const inkomend = new Map<string, number>();
  for (const item of VACATURES) inkomend.set(item.slug, 0);
  for (const [van, naar] of grafiek) {
    eq(`${van} linkt naar ${k} pagina's`, naar.length, k);
    ok(`${van} linkt niet naar zichzelf`, !naar.includes(van));
    for (const doel of naar) inkomend.set(doel, (inkomend.get(doel) ?? 0) + 1);
  }

  const aantallen = [...inkomend.values()];
  ok("iedere pagina krijgt precies evenveel inkomende links",
     aantallen.every(a => a === k),
     JSON.stringify([...inkomend.entries()]));
  ok("en dat is meer dan de ene die Ahrefs meldde", k > 1);
}
{
  // Ook bij een oneven aantal en gemengde groepen moet de verdeling kloppen.
  const veel: RingItem[] = Array.from({ length: 37 }, (_, i) => ({
    slug: `v-${i}`, title: `Vacature ${i}`, groep: ['Amsterdam', 'Utrecht', 'Den Haag'][i % 3],
  }));
  const grafiek = linkGrafiek(veel, 5);
  const inkomend = new Map<string, number>(veel.map(v => [v.slug, 0]));
  for (const [, naar] of grafiek) for (const d of naar) inkomend.set(d, (inkomend.get(d) ?? 0) + 1);
  ok("37 items, 5 links: iedereen krijgt er 5", [...inkomend.values()].every(a => a === 5),
     JSON.stringify([...inkomend.values()]));
}
{
  // Twee items is het kleinste zinnige geval.
  const twee = VACATURES.slice(0, 2);
  const grafiek = linkGrafiek(twee, 4);
  ok("twee items linken naar elkaar", [...grafiek.values()].every(n => n.length === 1));
}

console.log("\n— verwantFragment() —");
{
  const html = verwantFragment('/vacatures', 'Andere vacatures', VACATURES.slice(0, 2));
  ok("een nav met een label", html.startsWith('<nav aria-label="Andere vacatures">'), html);
  ok("een kop", html.includes('<h2>Andere vacatures</h2>'));
  ok("twee links", (html.match(/<a href="/g) || []).length === 2);
  ok("het pad klopt", html.includes('href="/vacatures/ontbijtchef-amsterdam-pulitzer"'));
  ok("de groep staat erbij", html.includes('— Amsterdam'));
}
{
  eq("zonder items geen blok", verwantFragment('/blog', 'Meer', []), '');
  eq("null crasht niet", verwantFragment('/blog', 'Meer', null as any), '');
}
{
  const stout = [{ slug: 'a&b', title: '<script>alert(1)</script>', groep: '"Amsterdam"' }];
  const html = verwantFragment('/vacatures', 'Andere', stout);
  ok("geen ongeëscapete tag in de titel", !html.includes('<script>'), html);
  ok("aanhalingstekens in de groep zijn ontsnapt", !/— "Amsterdam"/.test(html), html);
  ok("de slug is url-veilig", html.includes('href="/vacatures/a%26b"'), html);
}

console.log("\n— de standaardwaarde —");
ok("vier onderlinge links is de standaard", AANTAL_VERWANT === 4);
ok("en dat is genoeg om de melding op te lossen", AANTAL_VERWANT > 1);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
