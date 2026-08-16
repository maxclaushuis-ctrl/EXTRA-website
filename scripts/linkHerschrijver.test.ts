/**
 * Unit-tests voor scripts/linkHerschrijver.ts
 * Run met:  npx tsx scripts/linkHerschrijver.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 * Zelfde opzet als server/redirects.test.ts en server/contentFragment.test.ts.
 *
 * Let op: deze tests draaien tegen de échte routelijst uit client/src/App.tsx en
 * de échte redirectmap. Dat is bewust — het gaat er juist om dat de beoordeling
 * klopt met wat de site werkelijk serveert.
 */
import { beoordeelHref, vondsten, herschrijf, padVan, type SlugKennis } from './linkHerschrijver';

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean, extra?: string) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${extra ? `\n      ${extra}` : ''}`); }
}

function eq(label: string, actual: unknown, expected: unknown) {
  const gelijk = JSON.stringify(actual) === JSON.stringify(expected);
  ok(label, gelijk, gelijk ? undefined : `actual: ${JSON.stringify(actual)}  expected: ${JSON.stringify(expected)}`);
}

console.log('\n— padVan(): wat is een intern pad? —');
eq('gewoon pad', padVan('/contact'), '/contact');
eq('eigen origin eraf', padVan('https://www.doehetextra.nl/contact'), '/contact');
eq('eigen origin zonder www', padVan('https://doehetextra.nl/contact'), '/contact');
eq('#fragment eraf', padVan('/ik-zoek-extra-werk#functies'), '/ik-zoek-extra-werk');
eq('?query eraf', padVan('/contact?ref=google'), '/contact');
eq('externe link telt niet mee', padVan('https://google.com/iets'), null);
eq('mailto telt niet mee', padVan('mailto:info@doehetextra.nl'), null);
eq('tel telt niet mee', padVan('tel:+31201234567'), null);
eq('puur anker telt niet mee', padVan('#top'), null);
eq('protocol-relatief telt niet mee', padVan('//cdn.example.com/x.js'), null);
eq('relatief pad zonder / telt niet mee', padVan('contact.html'), null);

console.log('\n— beoordeelHref(): de kapotte link uit de Ahrefs-crawl —');
eq(
  '/werkgevers loopt sinds de 301 naar /personeelsaanvraag',
  beoordeelHref('/werkgevers'),
  { ruw: '/werkgevers', pad: '/werkgevers', soort: 'omweg', doel: '/personeelsaanvraag' }
);
ok(
  'ook als volledige URL geschreven',
  beoordeelHref('https://www.doehetextra.nl/werkgevers')?.doel === '/personeelsaanvraag'
);
ok(
  'ook met een #fragment erachter',
  beoordeelHref('/werkgevers#tarieven')?.doel === '/personeelsaanvraag'
);
ok('de bestemming zelf is in orde', beoordeelHref('/personeelsaanvraag')?.soort === 'ok');

console.log('\n— beoordeelHref(): de hernoemde slug —');
ok(
  'de oude slug wordt herkend als omweg, niet als bestaande route',
  beoordeelHref('/blog/minimumuurtaief-van-36--voor-zzp-ers')?.soort === 'omweg'
);
eq(
  'en wijst naar het herschreven artikel',
  beoordeelHref('/blog/minimumuurtaief-van-36--voor-zzp-ers')?.doel,
  '/blog/zzp-inhuren-horeca'
);
eq(
  '/nieuws/<oude-slug> komt in één keer op de goede plek uit',
  beoordeelHref('/nieuws/minimumuurtaief-van-36--voor-zzp-ers')?.doel,
  '/blog/zzp-inhuren-horeca'
);

console.log('\n— beoordeelHref(): gewone paden —');
ok('bestaande route', beoordeelHref('/contact')?.soort === 'ok');
ok('onbekend pad is kapot', beoordeelHref('/deze-pagina-bestaat-niet')?.soort === 'kapot');
eq('root wordt overgeslagen', beoordeelHref('/'), null);
eq('externe link wordt overgeslagen', beoordeelHref('https://www.linkedin.com/company/extra'), null);

console.log('\n— beoordeelHref(): slugs tegen de database houden —');
const kennis: SlugKennis = {
  blog: new Set(['housekeeping-personeel-inhuren']),
  vacature: new Set(['kok-amsterdam-marriott']),
};
ok('bestaand artikel', beoordeelHref('/blog/housekeeping-personeel-inhuren', kennis)?.soort === 'ok');
ok('verwijderd artikel is kapot', beoordeelHref('/blog/een-oud-artikel', kennis)?.soort === 'kapot');
ok('bestaande vacature', beoordeelHref('/vacatures/kok-amsterdam-marriott', kennis)?.soort === 'ok');
ok('verlopen vacature is kapot', beoordeelHref('/vacatures/kok-die-weg-is', kennis)?.soort === 'kapot');
ok(
  'zonder sluglijst blijft /blog/<wat-dan-ook> ongemoeid (patroon uit App.tsx)',
  beoordeelHref('/blog/een-oud-artikel')?.soort === 'ok'
);
ok(
  'een omweg gaat vóór de sluglijst',
  beoordeelHref('/blog/minimumuurtaief-van-36--voor-zzp-ers', kennis)?.soort === 'omweg'
);
ok('de blogindex zelf is geen slug', beoordeelHref('/blog', kennis)?.soort === 'ok');

console.log('\n— vondsten(): scannen van een artikel —');
const artikel = `
  <p>Werk je met zzp'ers? Lees dan onze <a href="/werkgevers">informatie voor werkgevers</a>.</p>
  <p>Of <a href="/personeelsaanvraag">vraag direct personeel aan</a>.</p>
  <p>Kijk ook op <a href="https://www.horeca.nl">horeca.nl</a> en mail <a href="mailto:info@doehetextra.nl">ons</a>.</p>
  <p>Nog een keer: <a href="/werkgevers">werkgevers</a>.</p>
`;
const gevonden = vondsten(artikel);
eq('twee unieke interne links (extern en mailto tellen niet mee)', gevonden.length, 2);
eq('de dubbele href staat er één keer in', gevonden.filter((v) => v.pad === '/werkgevers').length, 1);
eq('één omweg', gevonden.filter((v) => v.soort === 'omweg').length, 1);
eq('geen kapotte links', gevonden.filter((v) => v.soort === 'kapot').length, 0);
eq('lege inhoud levert niets op', vondsten('').length, 0);
eq('null-inhoud crasht niet', vondsten(null as any).length, 0);

console.log('\n— herschrijf(): alleen in de href, nergens anders —');
const herschreven = herschrijf(artikel, '/werkgevers', '/personeelsaanvraag');
ok('beide voorkomens vervangen', !herschreven.includes('href="/werkgevers"'));
ok('de linktekst blijft ongemoeid', herschreven.includes('>informatie voor werkgevers</a>'));
ok('de tweede linktekst blijft ook staan', herschreven.includes('>werkgevers</a>'));
eq(
  'na herschrijven zijn er geen omwegen meer',
  vondsten(herschreven).filter((v) => v.soort === 'omweg').length,
  0
);

const losseTekst = '<p>Ga naar /werkgevers voor meer.</p><a href="/werkgevers">hier</a>';
const losseHerschreven = herschrijf(losseTekst, '/werkgevers', '/personeelsaanvraag');
ok('een pad in de lopende tekst verandert niet mee', losseHerschreven.includes('Ga naar /werkgevers voor meer'));
ok('de href verandert wel', losseHerschreven.includes('href="/personeelsaanvraag"'));

const metFragment = `<a href="/werkgevers#tarieven">tarieven</a>`;
eq(
  '#fragment blijft behouden',
  herschrijf(metFragment, '/werkgevers#tarieven', '/personeelsaanvraag'),
  `<a href="/personeelsaanvraag#tarieven">tarieven</a>`
);

const metOrigin = `<a href="https://www.doehetextra.nl/werkgevers">x</a>`;
eq(
  'een absolute link blijft absoluut',
  herschrijf(metOrigin, 'https://www.doehetextra.nl/werkgevers', '/personeelsaanvraag'),
  `<a href="https://www.doehetextra.nl/personeelsaanvraag">x</a>`
);

const enkeleQuote = `<a href='/werkgevers'>x</a>`;
ok(
  'ook enkele aanhalingstekens',
  herschrijf(enkeleQuote, '/werkgevers', '/personeelsaanvraag').includes(`href='/personeelsaanvraag'`)
);

console.log('\n— herschrijf(): idempotent —');
const eenmaal = herschrijf(artikel, '/werkgevers', '/personeelsaanvraag');
const tweemaal = herschrijf(eenmaal, '/werkgevers', '/personeelsaanvraag');
eq('tweede keer draaien verandert niets', tweemaal, eenmaal);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
