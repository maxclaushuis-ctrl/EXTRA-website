/**
 * npm run blog:opruimen           → toont wat er opgeruimd zou worden
 * npm run blog:opruimen -- --doe  → zet die artikelen op "archived"
 *
 * Waarom dit script bestaat
 * -------------------------
 * In de ontwikkeldatabase staan artikelen die met de AI-schrijver zijn
 * gegenereerd en nooit langs de redactie zijn gegaan. Ze zijn niet zichtbaar
 * voor bezoekers — dev en productie zijn twee losse databases — maar ze vullen
 * wel het blogoverzicht in het beheerscherm. Een lijst waarin je zelf moet
 * onthouden welke artikelen je niet wilt hebben, is een lijst waar je op enig
 * moment een verkeerd artikel uit publiceert.
 *
 * De regel is simpel: wat geen bronbestand in content/blog/ heeft, is niet
 * redactioneel vastgelegd. Die artikelen krijgen status "archived".
 *
 * ARCHIVEREN, NIET VERWIJDEREN. De rij blijft staan, met inhoud en al. Het
 * dashboard toont alleen gepubliceerd, concept en ingepland (zie
 * WebsiteStatsTab.tsx), dus gearchiveerde artikelen verdwijnen uit beeld zonder
 * dat er iets onherstelbaar weg is. Wil je er later toch iets mee, dan zet je de
 * status terug.
 *
 * ALLEEN DE ONTWIKKELDATABASE. Het script kent geen productieoptie en weigert te
 * draaien als DATABASE_URL gelijk is aan PROD_DATABASE_URL. Op de live site is
 * "geen bronbestand" namelijk geen goede reden om iets te archiveren: daar staan
 * artikelen die via het beheerscherm zijn geschreven en die geen bestand in de
 * repository hebben.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { blogPosts } from '@shared/schema';

const CONTENT_DIR = join(process.cwd(), 'content', 'blog');

const argv = process.argv.slice(2);
const doeHet = argv.includes('--doe');

/** De slugs waarvan een bronbestand in de repository staat. */
function vastgelegdeSlugs(): Set<string> {
  if (!existsSync(CONTENT_DIR)) return new Set();
  return new Set(
    readdirSync(CONTENT_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, '').toLowerCase())
  );
}

function controleerDatabase(): void {
  const dev = process.env.DATABASE_URL;
  if (!dev) {
    console.error('❌ DATABASE_URL is niet gezet — geen ontwikkeldatabase gevonden.');
    process.exit(1);
  }
  if (process.env.PROD_DATABASE_URL && dev === process.env.PROD_DATABASE_URL) {
    console.error('❌ DATABASE_URL wijst naar PRODUCTIE. Dit script draait alleen op de');
    console.error('   ontwikkeldatabase — zie de toelichting bovenaan het bestand.');
    process.exit(1);
  }
}

async function main(): Promise<void> {
  controleerDatabase();

  const vastgelegd = vastgelegdeSlugs();
  console.log(`\n🧹 Blogopruiming in de ONTWIKKELdatabase`);
  console.log(`   modus: ${doeHet ? 'ARCHIVEREN (schrijft)' : 'alleen tonen'}`);
  console.log(`   vastgelegd in content/blog/: ${vastgelegd.size} artikel(en)\n`);

  const { db, pool } = await import('../server/db');

  try {
    const alle = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        status: blogPosts.status,
      })
      .from(blogPosts);

    const opruimen = alle.filter(
      (a) => a.status !== 'archived' && !vastgelegd.has(a.slug.toLowerCase())
    );
    const behouden = alle.filter((a) => vastgelegd.has(a.slug.toLowerCase()));

    if (behouden.length) {
      console.log('Blijft staan (heeft een bronbestand):');
      for (const a of behouden) console.log(`   ✓ ${a.slug}  — ${a.title}`);
      console.log('');
    }

    if (opruimen.length === 0) {
      console.log('✓ Niets op te ruimen.\n');
      return;
    }

    console.log(`${doeHet ? 'Gearchiveerd' : 'Wordt gearchiveerd'} (geen bronbestand):`);
    for (const a of opruimen) {
      console.log(`   • [${a.status}] ${a.slug}  — ${a.title}`);
      if (doeHet) {
        await db
          .update(blogPosts)
          .set({ status: 'archived', updatedAt: new Date() })
          .where(eq(blogPosts.id, a.id));
      }
    }

    if (doeHet) {
      console.log(`\n✅ ${opruimen.length} artikel(en) gearchiveerd. De inhoud staat er nog;`);
      console.log('   ze verdwijnen alleen uit de lijsten in het beheerscherm.\n');
    } else {
      console.log(`\n${opruimen.length} artikel(en) zouden worden gearchiveerd.`);
      console.log('Doorvoeren:  npm run blog:opruimen -- --doe\n');
    }
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
