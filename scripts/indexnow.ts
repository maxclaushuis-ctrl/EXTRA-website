/**
 * npm run indexnow            → meldt alle indexeerbare URL's aan bij IndexNow
 * npm run indexnow -- --lijst → toont alleen de lijst, meldt niets aan
 *
 * Waarom dit script bestaat
 * -------------------------
 * De automatische aanmelding in server/routes.ts dekt wat er vanaf nu wijzigt:
 * een blog die gepubliceerd wordt, een vacature die live gaat. Wat er vandáág
 * al staat, is nooit aangemeld — Ahrefs telde 65 zulke pagina's. Dit script is
 * die eenmalige inhaalslag.
 *
 * Draai het ook na een grote wijziging (een reeks pagina's herschreven, een
 * batch vacatures geïmporteerd). Voor het dagelijkse werk is het niet nodig.
 *
 * De lijst komt uit dezelfde bronnen als /sitemap.xml: shared/routeMeta.ts voor
 * de vaste pagina's, plus de gepubliceerde blogartikelen en vacatures uit de
 * database. Pagina's met noindex of met een canonical naar een andere URL
 * blijven eruit — die wil je juist níét in de index hebben.
 *
 * Leest de PRODUCTIEdatabase, want dat zijn de slugs die daadwerkelijk op
 * doehetextra.nl staan. Schrijft nooit iets.
 */
import { ROUTE_META, SITE_ORIGIN } from '@shared/routeMeta';
import { meldAan, normaliseerUrls, sleutelLocatie, INDEXNOW_SLEUTEL } from '../server/indexnow';

const argv = process.argv.slice(2);
const alleenLijst = argv.includes('--lijst');

/**
 * Moet vóór de import van server/db gebeuren: die leest process.env.DATABASE_URL
 * op moduleniveau en gooit meteen als hij leeg is. Vandaar de dynamische import
 * verderop in main().
 */
function kiesDatabase(): void {
  const prod = process.env.PROD_DATABASE_URL;
  if (!prod) {
    console.error('❌ PROD_DATABASE_URL is niet gezet.\n');
    console.error('   De live site draait op een andere database dan de testomgeving,');
    console.error('   en het gaat hier om de slugs die écht op doehetextra.nl staan.\n');
    console.error('   Eenmalig instellen:');
    console.error('   1. Replit → Deployments → Settings → Production app secrets');
    console.error('   2. kopieer de waarde van DATABASE_URL');
    console.error('   3. Replit → Secrets → nieuwe secret PROD_DATABASE_URL, plak de waarde');
    console.error('   4. open een NIEUWE shell (secrets worden alleen bij opstarten geladen)');
    process.exit(1);
  }
  process.env.DATABASE_URL = prod;
}

async function main(): Promise<void> {
  kiesDatabase();

  const { db, pool } = await import('../server/db');
  const { blogPosts, vacancyPosts } = await import('@shared/schema');
  const { eq } = await import('drizzle-orm');

  try {
    const blogs = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'));

    const vacatures = await db
      .select({ slug: vacancyPosts.slug })
      .from(vacancyPosts)
      .where(eq(vacancyPosts.status, 'published'));

    const vaste = ROUTE_META.filter((m) => !m.noindex && !m.canonical).map((m) => m.path);
    const paden = [
      ...vaste,
      ...blogs.map((b) => `/blog/${b.slug}`),
      ...vacatures.map((v) => `/vacatures/${v.slug}`),
    ];
    const urls = normaliseerUrls(paden);

    console.log(`\n📣 IndexNow`);
    console.log(`   sleutelbestand: ${sleutelLocatie()}`);
    console.log(`   vaste pagina's: ${vaste.length}`);
    console.log(`   blogartikelen:  ${blogs.length}`);
    console.log(`   vacatures:      ${vacatures.length}`);
    console.log(`   totaal:         ${urls.length} URL(s)\n`);

    if (alleenLijst) {
      for (const u of urls) console.log('   ' + u);
      console.log('\nNiets aangemeld (--lijst). Weglaten om wél aan te melden.\n');
      return;
    }

    // Bewust geforceerd én zonder herhaalvenster: dit is een handmatige,
    // eenmalige actie waarvan de bedoeling juist is dat alles meegaat.
    const uit = await meldAan(urls, { geforceerd: true, negeerHerhaalvenster: true });

    if (uit.verzonden.length) {
      console.log(`\n✅ ${uit.verzonden.length} URL(s) aangemeld.`);
      console.log('   Bing, Yandex, Seznam, Naver, Yep en Amazon krijgen dit doorgezet.');
      console.log('   Google doet niet mee aan IndexNow — daarvoor blijft sitemap.xml het pad.\n');
    }
    if (uit.overgeslagen.length) {
      console.error(`⚠️  ${uit.overgeslagen.length} URL(s) niet aangemeld.`);
      console.error(`   Statussen: ${uit.statussen.join(', ') || 'geen antwoord'}`);
      console.error(`   Bij 403: controleer of ${sleutelLocatie()} bereikbaar is`);
      console.error(`   en exact "${INDEXNOW_SLEUTEL}" bevat.\n`);
      process.exitCode = 1;
    }
  } finally {
    await pool.end().catch(() => {});
  }
}

main()
  .then(() => process.exit(typeof process.exitCode === 'number' ? process.exitCode : 0))
  .catch((err) => {
    console.error('❌ Mislukt:', err?.message || err);
    process.exit(1);
  });
