/**
 * npm run publish:blog <slug>          → plaatst het artikel in de PRODUCTIEdatabase
 * npm run publish:blog:dev <slug>      → plaatst het in de ontwikkeldatabase
 * npm run publish:blog                 → toont welke artikelen klaarstaan
 *
 * Waarom dit script bestaat
 * -------------------------
 * Dev en productie draaien op twee verschillende databases. Een deploy
 * ("Republish") zet alleen CODE live; rijen in blog_posts verhuizen niet mee.
 * Een blog die je in de testomgeving aanmaakt, staat dus nooit vanzelf op
 * doehetextra.nl. Dat leverde elke keer dezelfde handmatige reeks op:
 * verbindingsstring opzoeken, exporteren, seed-script per artikel schrijven.
 *
 * Hier is dat één regel. Het script:
 *   1. kiest zelf de juiste database (PROD_DATABASE_URL, tenzij --dev),
 *   2. leest het artikel uit content/blog/<slug>.{json,html},
 *   3. controleert de velden vóór het schrijft,
 *   4. werkt een bestaande slug bij in plaats van een duplicaat te maken.
 *
 * Een nieuw artikel toevoegen = twee bestanden neerzetten in content/blog/.
 * Geen scriptwijziging nodig.
 *
 * IDEMPOTENT: blog_posts heeft géén unique index op slug, dus zonder controle
 * zou een tweede run een duplicaat opleveren. Het script zoekt daarom eerst op
 * slug. Twee keer draaien is veilig.
 *
 * Schrijft RECHTSTREEKS naar de database, net als scripts/import-contacten.ts.
 * Bewust niet via de admin-API zoals scripts/seed-vacatures.ts doet: die stuurt
 * een `admin_token`-cookie mee, maar adminMiddleware in server/routes.ts
 * controleert een échte ingelogde sessie (req.session.userId + userRole).
 * Een token levert daar dus gewoon 403 op.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { blogPosts } from '@shared/schema';

const CONTENT_DIR = join(process.cwd(), 'content', 'blog');

/** De zes categorieën die de site kent (client/src/pages/Nieuws.tsx). */
const CATEGORIEEN = [
  'Hospitality',
  'Events & Catering',
  'Horeca',
  'Housekeeping',
  'EXTRA Nieuws',
  'Branche',
] as const;

const VERPLICHT = [
  'title',
  'slug',
  'excerpt',
  'metaTitle',
  'metaDescription',
  'focusKeyword',
  'category',
  'imageUrl',
  'author',
  'readTime',
] as const;

interface BlogMeta {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  category: string;
  imageUrl: string;
  imageAlt?: string;
  author: string;
  readTime: string;
  tags?: string[];
}

// ─── Argumenten ──────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const naarDev = argv.includes('--dev');
const alsConcept = argv.includes('--concept');
const slug = argv.find((a) => !a.startsWith('-'));

function beschikbareSlugs(): string[] {
  if (!existsSync(CONTENT_DIR)) return [];
  return readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

function toonBeschikbaar(): void {
  const slugs = beschikbareSlugs();
  if (slugs.length === 0) {
    console.log('Er staan nog geen artikelen in content/blog/.');
    return;
  }
  console.log('Beschikbare artikelen:\n');
  for (const s of slugs) console.log('  ' + s);
  console.log('\nPlaatsen op de live site:');
  console.log('  npm run publish:blog ' + slugs[slugs.length - 1]);
  console.log('\nEerst in de testomgeving bekijken:');
  console.log('  npm run publish:blog:dev ' + slugs[slugs.length - 1]);
}

// ─── Inlezen en controleren ──────────────────────────────────────────────────

function leesArtikel(s: string): { meta: BlogMeta; content: string } {
  const jsonPad = join(CONTENT_DIR, s + '.json');
  const htmlPad = join(CONTENT_DIR, s + '.html');

  if (!existsSync(jsonPad) || !existsSync(htmlPad)) {
    console.error(`❌ Artikel "${s}" niet gevonden.`);
    console.error(`   Verwacht: content/blog/${s}.json en content/blog/${s}.html\n`);
    toonBeschikbaar();
    process.exit(1);
  }

  let meta: BlogMeta;
  try {
    meta = JSON.parse(readFileSync(jsonPad, 'utf8'));
  } catch (err: any) {
    console.error(`❌ content/blog/${s}.json is geen geldige JSON: ${err?.message || err}`);
    process.exit(1);
  }

  const content = readFileSync(htmlPad, 'utf8').trim();
  const fouten: string[] = [];
  const waarschuwingen: string[] = [];

  for (const veld of VERPLICHT) {
    if (!meta[veld] || String(meta[veld]).trim() === '') fouten.push(`veld "${veld}" ontbreekt`);
  }
  if (meta.slug !== s) fouten.push(`slug in het JSON-bestand ("${meta.slug}") wijkt af van de bestandsnaam ("${s}")`);
  if (content.length < 500) fouten.push('het HTML-bestand is vrijwel leeg');
  if (meta.category && !CATEGORIEEN.includes(meta.category as any)) {
    fouten.push(`categorie "${meta.category}" bestaat niet — kies uit: ${CATEGORIEEN.join(' · ')}`);
  }

  // Afbeeldingen: verwijzen naar iets dat er niet is levert een gebroken hero op
  // die je pas ná het publiceren ziet. Dus vooraf controleren.
  const beelden = new Set<string>();
  if (meta.imageUrl?.startsWith('/images/')) beelden.add(meta.imageUrl);
  for (const m of content.matchAll(/src="(\/images\/[^"]+)"/g)) beelden.add(m[1]);
  for (const beeld of beelden) {
    if (!existsSync(join(process.cwd(), 'client', 'public', beeld.replace(/^\//, '')))) {
      fouten.push(`afbeelding ${beeld} staat niet in client/public${beeld}`);
    }
  }

  // De meta-omschrijving staat óók zichtbaar op de pagina als cursieve intro
  // onder de titel (NieuwsArtikel.tsx). Te lang wordt afgekapt in Google.
  if (meta.metaDescription && meta.metaDescription.length > 160) {
    waarschuwingen.push(`metaDescription is ${meta.metaDescription.length} tekens (Google kapt af rond 160)`);
  }
  if (meta.metaTitle && meta.metaTitle.length > 60) {
    waarschuwingen.push(`metaTitle is ${meta.metaTitle.length} tekens (Google kapt af rond 60)`);
  }
  const interneLinks = [...content.matchAll(/href="(?:https:\/\/www\.doehetextra\.nl)?(\/[^"#]*)"/g)].length;
  if (interneLinks < 3) waarschuwingen.push(`slechts ${interneLinks} interne link(s) — richtlijn is 3 à 8`);

  for (const w of waarschuwingen) console.warn('⚠️  ' + w);
  if (fouten.length > 0) {
    console.error('\n❌ Niet geplaatst:');
    for (const f of fouten) console.error('   • ' + f);
    process.exit(1);
  }

  return { meta, content };
}

// ─── Database kiezen ─────────────────────────────────────────────────────────

/**
 * Moet vóór de import van server/db gebeuren: die leest process.env.DATABASE_URL
 * op moduleniveau en gooit meteen als hij leeg is. Vandaar de dynamische import
 * verderop in main().
 */
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
    console.error('❌ PROD_DATABASE_URL is niet gezet.\n');
    console.error('   De live site draait op een andere database dan de testomgeving,');
    console.error('   dus het script moet weten waar het naartoe moet schrijven.\n');
    console.error('   Eenmalig instellen:');
    console.error('   1. Replit → Deployments → Settings → Production app secrets');
    console.error('   2. kopieer de waarde van DATABASE_URL');
    console.error('   3. Replit → Secrets → nieuwe secret PROD_DATABASE_URL, plak de waarde');
    console.error('   4. open een NIEUWE shell (secrets worden alleen bij opstarten geladen)\n');
    console.error('   Alleen in de testomgeving plaatsen kan zonder dit:');
    console.error('   npm run publish:blog:dev ' + (slug ?? '<slug>'));
    process.exit(1);
  }
  process.env.DATABASE_URL = prod;
  return 'PRODUCTIE (doehetextra.nl)';
}

// ─── Plaatsen ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!slug) {
    toonBeschikbaar();
    return;
  }

  const { meta, content } = leesArtikel(slug);
  const doel = kiesDatabase();

  console.log(`\n🌱 ${meta.title}`);
  console.log(`   database: ${doel}`);
  console.log(`   status:   ${alsConcept ? 'concept (niet zichtbaar op de site)' : 'gepubliceerd'}\n`);

  const { db, pool } = await import('../server/db');

  try {
    const [bestaand] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));

    // status en publishedAt worden hier gezet met een echt Date-object; dat is
    // precies wat het publish-endpoint in routes.ts ook doet. Een ISO-string
    // meesturen loopt stuk op de zod/drizzle-validatie.
    const velden = {
      title: meta.title,
      slug: meta.slug,
      excerpt: meta.excerpt,
      content,
      metaTitle: meta.metaTitle,
      metaDescription: meta.metaDescription,
      focusKeyword: meta.focusKeyword,
      category: meta.category,
      imageUrl: meta.imageUrl,
      imageAlt: meta.imageAlt ?? '',
      author: meta.author,
      readTime: meta.readTime,
      tags: meta.tags ?? [],
      status: alsConcept ? 'draft' : 'published',
      publishedAt: alsConcept ? null : new Date(),
      updatedAt: new Date(),
    };

    let id: number;
    if (bestaand) {
      await db.update(blogPosts).set(velden).where(eq(blogPosts.id, bestaand.id));
      id = bestaand.id;
      console.log(`✅ Bijgewerkt (id ${id})`);
    } else {
      const [nieuw] = await db.insert(blogPosts).values(velden).returning({ id: blogPosts.id });
      id = nieuw.id;
      console.log(`✅ Aangemaakt (id ${id})`);
    }

    const basis = naarDev ? '' : 'https://www.doehetextra.nl';
    console.log(`   ${basis}/blog/${meta.slug}\n`);

    if (!alsConcept && !naarDev) {
      console.log('Klaar — het artikel staat live. Geen deploy nodig, dit is data.\n');
    }
    console.log('Optioneel, voor crawlers zonder JavaScript:');
    console.log('  npx playwright-core install chromium   (eenmalig)');
    console.log('  npm run build && npm run prerender');
    console.log(`  commit client/public/prerender/blog__${meta.slug}.html`);
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
