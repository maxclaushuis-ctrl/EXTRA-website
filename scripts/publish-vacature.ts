/**
 * Vacatures uit content/vacatures/ in de database zetten, zonder ze met de hand
 * in het dashboard te plakken. Zelfde aanpak als scripts/publish-blog.ts.
 *
 *   npx tsx scripts/publish-vacature.ts                     toont wat er klaarstaat
 *   npx tsx scripts/publish-vacature.ts --dev <slug>        in de database van deze omgeving (testomgeving)
 *   npx tsx scripts/publish-vacature.ts --dev --alle        alle vacatures uit de map, in deze omgeving
 *   npx tsx scripts/publish-vacature.ts <slug> | --alle     in de PRODUCTIEdatabase (PROD_DATABASE_URL)
 *   --concept                                               als concept, niet zichtbaar op de site
 *
 * Een vacature met een slug die al in de database staat, wordt NIET aangepast:
 * het script slaat hem over en meldt dat. Zo overschrijft het nooit iets wat in
 * het dashboard is gewijzigd. Twee keer draaien is dus veilig.
 *
 * Alles wordt eerst gecontroleerd (shared/vacatureInvoer.ts). Is er één fout, dan
 * schrijft het script niets. JobPosting, FAQ, breadcrumbs, het fragment voor
 * crawlers, de sitemap en de links naar andere vacatures volgen vanzelf uit de
 * database; daar is geen extra stap voor nodig.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { inArray } from "drizzle-orm";
import { vacancyPosts } from "@shared/schema";
import { controleerVacature, dubbeleMeta, type VacatureInvoer } from "@shared/vacatureInvoer";

const MAP = join(process.cwd(), "content", "vacatures");
const argv = process.argv.slice(2);
const naarDev = argv.includes("--dev");
const alsConcept = argv.includes("--concept");
const alle = argv.includes("--alle");
const slugArg = argv.find((a) => !a.startsWith("-"));

function beschikbaar(): string[] {
  if (!existsSync(MAP)) return [];
  return readdirSync(MAP).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
}

function lees(slug: string): VacatureInvoer {
  const pad = join(MAP, slug + ".json");
  if (!existsSync(pad)) {
    console.error(`Vacature "${slug}" niet gevonden in content/vacatures/.`);
    process.exit(1);
  }
  try {
    return JSON.parse(readFileSync(pad, "utf8"));
  } catch (err: any) {
    console.error(`content/vacatures/${slug}.json is geen geldige JSON: ${err?.message || err}`);
    process.exit(1);
  }
}

function kiesDatabase(): string {
  if (naarDev) {
    if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is niet gezet."); process.exit(1); }
    return "deze omgeving (DATABASE_URL)";
  }
  const prod = process.env.PROD_DATABASE_URL;
  if (!prod) {
    console.error("PROD_DATABASE_URL is niet gezet. Zelfde instelling als bij publish:blog.");
    console.error("Alleen in deze omgeving plaatsen kan met --dev.");
    process.exit(1);
  }
  process.env.DATABASE_URL = prod;
  return "PRODUCTIE (doehetextra.nl)";
}

async function main(): Promise<void> {
  const slugs = alle ? beschikbaar() : slugArg ? [slugArg] : [];
  if (slugs.length === 0) {
    const b = beschikbaar();
    console.log(b.length ? "Klaar om te plaatsen:\n\n" + b.map((s) => "  " + s).join("\n") : "Er staan nog geen vacatures in content/vacatures/.");
    console.log("\nEerst bekijken in de testomgeving: npx tsx scripts/publish-vacature.ts --dev --alle");
    return;
  }

  const vacatures = slugs.map((s) => ({ slug: s, d: lees(s) }));
  let fout = false;
  for (const { slug, d } of vacatures) {
    const r = controleerVacature(d, slug);
    for (const w of r.waarschuwingen) console.warn(`Let op (${slug}): ${w}`);
    for (const f of r.fouten) { console.error(`Fout (${slug}): ${f}`); fout = true; }
  }
  for (const f of dubbeleMeta(vacatures.map((v) => v.d))) { console.error(`Fout: ${f}`); fout = true; }
  if (fout) { console.error("\nNiets geplaatst."); process.exit(1); }

  const doel = kiesDatabase();
  console.log(`\nDatabase: ${doel}`);
  console.log(`Status:   ${alsConcept ? "concept (niet zichtbaar)" : "gepubliceerd"}\n`);
  const { db, pool } = await import("../server/db");
  try {
    const bestaand = await db.select({ slug: vacancyPosts.slug }).from(vacancyPosts).where(inArray(vacancyPosts.slug, slugs));
    const alAanwezig = new Set(bestaand.map((b) => b.slug));
    const metaInDb = await db.select({ slug: vacancyPosts.slug, metaTitle: vacancyPosts.metaTitle, metaDescription: vacancyPosts.metaDescription }).from(vacancyPosts);
    for (const f of dubbeleMeta([...metaInDb.filter((m) => !alAanwezig.has(m.slug)).map((m) => ({ slug: m.slug, metaTitle: m.metaTitle || "", metaDescription: m.metaDescription || "" })), ...vacatures.map((v) => v.d)])) {
      console.warn(`Let op: ${f}`);
    }
    let geplaatst = 0;
    for (const { slug, d } of vacatures) {
      if (alAanwezig.has(slug)) { console.log(`Overgeslagen: ${slug} staat al in de database (er is niets gewijzigd).`); continue; }
      const nu = new Date();
      await db.insert(vacancyPosts).values({
        title: d.title, slug: d.slug, internalTitle: d.internalTitle ?? null,
        functionType: d.functionType, serviceType: d.serviceType, location: d.location, region: d.region, workplace: d.workplace,
        client: d.client ?? null, salaryMin: d.salaryMin,
        shortDescription: d.shortDescription, introductionText: d.introductionText, aboutRole: d.aboutRole ?? null, workEnvironment: d.workEnvironment ?? null,
        responsibilities: d.responsibilities, requirements: d.requirements, offer: d.offer,
        faqItems: d.faqItems ?? null, ctaText: d.ctaText ?? null,
        focusKeyword: d.focusKeyword, metaTitle: d.metaTitle, metaDescription: d.metaDescription, canonicalUrl: d.canonicalUrl,
        ogTitle: d.ogTitle ?? null, ogDescription: d.ogDescription ?? null,
        featuredImage: d.featuredImage ?? null, featuredImageAlt: d.featuredImageAlt ?? null,
        status: alsConcept ? "draft" : "published", publishedAt: alsConcept ? null : nu, createdAt: nu, updatedAt: nu,
      } as any);
      geplaatst++;
      console.log(`Geplaatst: /vacatures/${slug}`);
    }
    console.log(`\n${geplaatst} geplaatst, ${vacatures.length - geplaatst} overgeslagen.`);
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((err) => { console.error("Mislukt:", err?.message || err); process.exit(1); });
