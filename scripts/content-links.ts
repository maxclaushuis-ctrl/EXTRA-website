/**
 * npm run content:links          → rapport over de PRODUCTIEdatabase (leest alleen)
 * npm run content:links -- --dev → rapport over de ontwikkeldatabase
 * npm run content:links:fix      → zet de gevonden links recht in PRODUCTIE
 *
 * Waarom dit script bestaat
 * -------------------------
 * scripts/check-internal-links.ts bewaakt elke `href` in client/src en faalt de
 * build zodra er eentje naar een 404 of via een redirect wijst. Die check ziet
 * alleen de code — en precies daar zat het gat.
 *
 * De Ahrefs-crawl van 16 augustus meldde een 404 op /werkgevers, gevonden vanuit
 * /blog/minimumuurtaief-van-36--voor-zzp-ers. Die link staat niet in de code: hij
 * staat in de HTML van dat artikel, en die HTML staat in de database. P15 had
 * /werkgevers netjes uit de componenten gehaald, maar de artikelen die de
 * AI-schrijver in routes.ts vóór die fix had gegenereerd, dragen hem nog mee.
 * Geen build-check ter wereld kijkt daar.
 *
 * Dit script sluit dat gat: het leest dezelfde routekennis als de build-check
 * (scripts/routeKennis.ts) en houdt daar de links uit blog_posts en vacancy_posts
 * tegenaan. Standaard leest het alleen. Met --fix schrijft het:
 *
 *   1. hernoemt het de slugs uit SLUG_HERNOEMINGEN hieronder;
 *   2. vervangt het elke link die via een 301 loopt door zijn eindbestemming;
 *   3. rapporteert het wat het níét kan repareren (een kapotte link zonder
 *      redirect — daar is een menselijke keuze voor nodig).
 *
 * Volgorde is met opzet: door eerst te hernoemen en dán de links te herschrijven,
 * lopen verwijzingen naar de oude slug vanzelf mee — de 301 in server/redirects.ts
 * wijst ze de weg.
 *
 * IDEMPOTENT. Twee keer draaien verandert de tweede keer niets: een slug die al
 * hernoemd is wordt overgeslagen, en een link die al rechtstreeks wijst levert
 * geen omweg meer op.
 *
 * Schrijft rechtstreeks naar de database, net als scripts/publish-blog.ts.
 */
import { eq } from 'drizzle-orm';
import { blogPosts, vacancyPosts } from '@shared/schema';
import { vondsten, herschrijf, type SlugKennis } from './linkHerschrijver';

// ─── Slugs die hernoemd moeten worden ────────────────────────────────────────

/**
 * Elke regel hier hoort een 301 in server/redirects.ts te hebben, anders geeft
 * de oude URL na het hernoemen een 404. Ze horen dus in dezelfde commit thuis.
 *
 * De typefout in "minimumuurtaief" (de r van "tarief" ontbreekt) stond al in de
 * P14-prompt met de aantekening: hernoemen zolang het artikel nauwelijks verkeer
 * of links heeft. De crawl van 16 augustus bevestigt dat — PageRank 0, één
 * inkomende link.
 */
const SLUG_HERNOEMINGEN: { oud: string; nieuw: string }[] = [
  {
    oud: 'minimumuurtaief-van-36--voor-zzp-ers',
    nieuw: 'minimumuurtarief-van-36-voor-zzp-ers',
  },
];

// ─── Argumenten ──────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const naarDev = argv.includes('--dev');
const repareren = argv.includes('--fix');

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
    console.error('   De live site draait op een andere database dan de testomgeving.\n');
    console.error('   Eenmalig instellen:');
    console.error('   1. Replit → Deployments → Settings → Production app secrets');
    console.error('   2. kopieer de waarde van DATABASE_URL');
    console.error('   3. Replit → Secrets → nieuwe secret PROD_DATABASE_URL, plak de waarde');
    console.error('   4. open een NIEUWE shell (secrets worden alleen bij opstarten geladen)\n');
    console.error('   Alleen de testomgeving nakijken kan zonder dit:');
    console.error('   npm run content:links -- --dev');
    process.exit(1);
  }
  process.env.DATABASE_URL = prod;
  return 'PRODUCTIE (doehetextra.nl)';
}

// ─── Uitvoeren ───────────────────────────────────────────────────────────────

/** De tekstvelden waar redactionele HTML in kan staan. */
const BLOG_VELDEN = ['content', 'excerpt'] as const;
const VACATURE_VELDEN = [
  'shortDescription',
  'introductionText',
  'aboutRole',
  'workEnvironment',
  'faqItems',
] as const;

interface Regel {
  soort: 'blog' | 'vacature';
  id: number;
  slug: string;
  titel: string;
  velden: Record<string, string | null>;
}

async function main(): Promise<void> {
  const doel = kiesDatabase();

  console.log(`\n🔗 Interne links in de database nakijken`);
  console.log(`   database: ${doel}`);
  console.log(`   modus:    ${repareren ? 'REPAREREN (schrijft)' : 'alleen rapporteren'}\n`);

  const { db, pool } = await import('../server/db');

  try {
    // ── 1. Slugs hernoemen ──────────────────────────────────────────────────
    if (SLUG_HERNOEMINGEN.length) {
      for (const { oud, nieuw } of SLUG_HERNOEMINGEN) {
        const [bestaand] = await db
          .select({ id: blogPosts.id })
          .from(blogPosts)
          .where(eq(blogPosts.slug, oud));

        if (!bestaand) {
          console.log(`   slug "${oud}" — niet (meer) aanwezig, overgeslagen`);
          continue;
        }
        if (!repareren) {
          console.log(`   slug "${oud}" → "${nieuw}"  (wordt hernoemd met --fix)`);
          continue;
        }

        const [botsing] = await db
          .select({ id: blogPosts.id })
          .from(blogPosts)
          .where(eq(blogPosts.slug, nieuw));
        if (botsing) {
          console.error(`   ❌ slug "${nieuw}" bestaat al (id ${botsing.id}) — niet hernoemd`);
          continue;
        }

        await db
          .update(blogPosts)
          .set({ slug: nieuw, updatedAt: new Date() })
          .where(eq(blogPosts.id, bestaand.id));
        console.log(`   ✅ slug hernoemd: "${oud}" → "${nieuw}" (id ${bestaand.id})`);
      }
      console.log('');
    }

    // ── 2. Alles inlezen ────────────────────────────────────────────────────
    const blogs = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        content: blogPosts.content,
        excerpt: blogPosts.excerpt,
      })
      .from(blogPosts);

    const vacatures = await db
      .select({
        id: vacancyPosts.id,
        slug: vacancyPosts.slug,
        title: vacancyPosts.title,
        shortDescription: vacancyPosts.shortDescription,
        introductionText: vacancyPosts.introductionText,
        aboutRole: vacancyPosts.aboutRole,
        workEnvironment: vacancyPosts.workEnvironment,
        faqItems: vacancyPosts.faqItems,
      })
      .from(vacancyPosts);

    // Welke artikelen en vacatures bestaan er écht? Zonder deze twee lijsten
    // zou elke /blog/<wat-dan-ook> als geldig gelden — App.tsx kent immers
    // alleen het patroon /blog/:slug. Ook concepten tellen mee: die zijn niet
    // openbaar, maar een link ernaartoe is een redactionele keuze en geen fout
    // die dit script hoort te melden.
    const slugKennis: SlugKennis = {
      blog: new Set(blogs.map((b) => b.slug.toLowerCase())),
      vacature: new Set(vacatures.map((v) => v.slug.toLowerCase())),
    };

    const regels: Regel[] = [
      ...blogs.map((b) => ({
        soort: 'blog' as const,
        id: b.id,
        slug: b.slug,
        titel: b.title,
        velden: Object.fromEntries(BLOG_VELDEN.map((v) => [v, (b as any)[v] ?? null])),
      })),
      ...vacatures.map((v) => ({
        soort: 'vacature' as const,
        id: v.id,
        slug: v.slug,
        titel: v.title,
        velden: Object.fromEntries(VACATURE_VELDEN.map((k) => [k, (v as any)[k] ?? null])),
      })),
    ];

    // ── 3. Nakijken en eventueel repareren ──────────────────────────────────
    let gecontroleerd = 0;
    let omwegen = 0;
    let hersteld = 0;
    const kapot: string[] = [];

    for (const regel of regels) {
      const nieuweVelden: Record<string, string> = {};

      for (const [veld, waarde] of Object.entries(regel.velden)) {
        if (!waarde) continue;
        let html = waarde;

        for (const v of vondsten(waarde, slugKennis)) {
          gecontroleerd++;
          if (v.soort === 'ok') continue;

          const waar = `${regel.soort} /${regel.soort === 'blog' ? 'blog' : 'vacatures'}/${regel.slug} (${veld})`;

          if (v.soort === 'kapot') {
            kapot.push(`${waar}: "${v.ruw}" — geen route en geen redirect`);
            continue;
          }

          omwegen++;
          console.log(`   ${waar}\n      "${v.ruw}" → "${v.doel}"`);
          if (repareren && v.doel) {
            html = herschrijf(html, v.ruw, v.doel);
            hersteld++;
          }
        }

        if (repareren && html !== waarde) nieuweVelden[veld] = html;
      }

      if (repareren && Object.keys(nieuweVelden).length) {
        const tabel = regel.soort === 'blog' ? blogPosts : vacancyPosts;
        await db
          .update(tabel as any)
          .set({ ...nieuweVelden, updatedAt: new Date() })
          .where(eq((tabel as any).id, regel.id));
        console.log(`   ✅ bijgewerkt: ${regel.titel} (id ${regel.id})`);
      }
    }

    // ── 4. Slot ─────────────────────────────────────────────────────────────
    console.log(
      `\n${gecontroleerd} interne link(s) gecontroleerd in ${blogs.length} artikel(en) en ` +
        `${vacatures.length} vacature(s).`
    );

    if (kapot.length) {
      console.error(`\n⚠️  ${kapot.length} link(s) wijzen nergens heen — die vragen een keuze:`);
      for (const k of kapot) console.error('   • ' + k);
      console.error(
        `\n   Los op door de pagina te bouwen, óf door een 301 toe te voegen in\n` +
          `   server/redirects.ts en dit script daarna opnieuw te draaien.`
      );
    }

    if (omwegen === 0 && kapot.length === 0) {
      console.log('✓ Geen kapotte links en geen omwegen. Niets te doen.\n');
    } else if (repareren) {
      console.log(`\n✅ ${hersteld} link(s) rechtgezet. Dit is data — geen deploy nodig.\n`);
    } else {
      console.log(`\n${omwegen} link(s) lopen via een 301. Rechtzetten:  npm run content:links:fix\n`);
    }

    if (kapot.length) process.exitCode = 1;
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
