/**
 * npm run blog:archiveer -- <slug>          → zet het artikel in PRODUCTIE op "archived"
 * npm run blog:archiveer -- <slug> --dev    → hetzelfde in de ontwikkeldatabase
 * npm run blog:archiveer -- <slug> --toon   → laat alleen zien wat er gevonden wordt
 *
 * Waarom dit script bestaat
 * -------------------------
 * Een artikel dat per ongeluk gepubliceerd is (zoals een testartikel) moet van
 * de site af. Verwijderen is onnodig en onomkeerbaar; de status "archived"
 * haalt het uit het blogoverzicht, de sitemap, de verwante links en de
 * prerender, en de rij blijft staan voor als je het ooit terug wilt.
 *
 * ARCHIVEREN, NIET VERWIJDEREN. Er wordt nooit een rij gewist.
 *
 * Kiest de database op dezelfde manier als scripts/publish-blog.ts:
 * PROD_DATABASE_URL, tenzij --dev.
 */
import { eq } from 'drizzle-orm';
import { blogPosts } from '@shared/schema';

const argv = process.argv.slice(2);
const naarDev = argv.includes('--dev');
const alleenTonen = argv.includes('--toon');
const slug = argv.find((a) => !a.startsWith('--'))?.toLowerCase();

function kiesDatabase(): string {
  if (naarDev) {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is niet gezet — geen ontwikkeldatabase gevonden.');
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

async function main(): Promise<void> {
  if (!slug) {
    console.error('Gebruik: npm run blog:archiveer -- <slug> [--dev] [--toon]');
    process.exit(1);
  }
  const waar = kiesDatabase();
  const { db, pool } = await import('../server/db');
  try {
    const rijen = await db
      .select({ id: blogPosts.id, title: blogPosts.title, status: blogPosts.status })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));

    console.log(`\nDatabase: ${waar}`);
    if (rijen.length === 0) {
      console.log(`Geen artikel gevonden met slug "${slug}". Niets gedaan.\n`);
      return;
    }
    for (const r of rijen) console.log(`   id ${r.id} · ${r.status} · ${r.title}`);

    if (alleenTonen) {
      console.log('\n--toon: niets gewijzigd.\n');
      return;
    }

    for (const r of rijen) {
      if (r.status === 'archived') continue;
      await db.update(blogPosts).set({ status: 'archived' }).where(eq(blogPosts.id, r.id));
      console.log(`✅ id ${r.id} op "archived" gezet`);
    }
    console.log('\nKlaar. De rij blijft bestaan; via het beheerscherm kun je de status terugzetten.\n');
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
