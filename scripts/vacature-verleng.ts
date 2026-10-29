/**
 * npm run vacature:verleng                       → toont alle gepubliceerde vacatures en welke verlopen zijn
 * npm run vacature:verleng -- <slug> [<slug>…]   → verlengt die vacatures met 90 dagen (PRODUCTIE)
 * npm run vacature:verleng -- --alle-verlopen    → verlengt alle verlopen vacatures
 * Voeg --dev toe voor de ontwikkeldatabase en --toon om alleen te kijken.
 *
 * Waarom dit script bestaat
 * -------------------------
 * Een vacature is 90 dagen na publicatie verlopen. De pagina geeft dan een
 * 404 en verdwijnt uit de sitemap en de lijsten (shared/levendeLinks.ts),
 * zodat Google geen vacature ziet die misschien al vervuld is. Staat de
 * vacature nog open, dan zet dit script de publicatiedatum op vandaag: de
 * pagina is direct weer bereikbaar, voor 90 dagen.
 *
 * Alleen gebruiken voor vacatures die echt nog open zijn.
 *
 * Wijzigt alleen published_at en updated_at van bestaande, gepubliceerde
 * vacatures. Er wordt nooit een rij verwijderd of aangemaakt.
 */
import { and, eq, inArray } from 'drizzle-orm';
import { vacancyPosts } from '@shared/schema';
import { vacatureGeldigTot, vacatureVerlopen } from '@shared/levendeLinks';

const argv = process.argv.slice(2);
const naarDev = argv.includes('--dev');
const alleenTonen = argv.includes('--toon');
const alleVerlopen = argv.includes('--alle-verlopen');
const slugs = argv.filter((a) => !a.startsWith('--')).map((s) => s.toLowerCase());

function kiesDatabase(): string {
  if (naarDev) {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is niet gezet. Geen ontwikkeldatabase gevonden.');
      process.exit(1);
    }
    return 'ontwikkeling';
  }
  const prod = process.env.PROD_DATABASE_URL;
  if (!prod) {
    console.error('❌ PROD_DATABASE_URL is niet gezet. Zie scripts/publish-blog.ts voor de');
    console.error('   eenmalige instelling, of gebruik --dev voor de testomgeving.');
    process.exit(1);
  }
  process.env.DATABASE_URL = prod;
  return 'PRODUCTIE (doehetextra.nl)';
}

const dag = (d: Date) => d.toISOString().slice(0, 10);

async function main(): Promise<void> {
  const waar = kiesDatabase();
  const { db, pool } = await import('../server/db');
  try {
    const rijen = await db
      .select({ id: vacancyPosts.id, slug: vacancyPosts.slug, title: vacancyPosts.title, publishedAt: vacancyPosts.publishedAt, createdAt: vacancyPosts.createdAt })
      .from(vacancyPosts)
      .where(eq(vacancyPosts.status, 'published'));

    console.log(`\nDatabase: ${waar}\n`);
    for (const r of rijen) {
      console.log(`   ${vacatureVerlopen(r) ? 'VERLOPEN' : 'geldig  '}  tot ${dag(vacatureGeldigTot(r))}  ${r.slug}`);
    }

    const doel = alleVerlopen ? rijen.filter((r) => vacatureVerlopen(r)) : rijen.filter((r) => slugs.includes(r.slug.toLowerCase()));
    const onbekend = slugs.filter((s) => !rijen.some((r) => r.slug.toLowerCase() === s));
    if (onbekend.length) console.log(`\nNiet gevonden of niet gepubliceerd: ${onbekend.join(', ')}`);
    if (!alleVerlopen && slugs.length === 0) {
      console.log('\nNiets verlengd. Geef slugs mee of --alle-verlopen.\n');
      return;
    }
    if (doel.length === 0) {
      console.log('\nGeen vacatures om te verlengen.\n');
      return;
    }
    if (alleenTonen) {
      console.log(`\n--toon: zou ${doel.length} vacature(s) verlengen. Niets gewijzigd.\n`);
      return;
    }
    const nu = new Date();
    await db
      .update(vacancyPosts)
      .set({ publishedAt: nu, updatedAt: nu })
      .where(and(eq(vacancyPosts.status, 'published'), inArray(vacancyPosts.id, doel.map((r) => r.id))));
    for (const r of doel) console.log(`✅ verlengd tot ${dag(vacatureGeldigTot({ publishedAt: nu }))}: ${r.slug}`);
    console.log('\nKlaar. Binnen een paar minuten zijn de pagina\'s weer bereikbaar.\n');
  } finally {
    await pool.end().catch(() => {});
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Mislukt:', err?.message || err);
    process.exit(1);
  });
