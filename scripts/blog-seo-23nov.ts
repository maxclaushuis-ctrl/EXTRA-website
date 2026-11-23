/**
 * Kannibalisatie tussen twee blogs en hun landingspagina oplossen (akkoord Max,
 * 23-11-2026). Past alleen de velden hieronder aan, en alleen als de database
 * nog de oude waarde bevat. Staat er iets anders (bijvoorbeeld een aanpassing
 * uit het dashboard), dan slaat het script dat veld over en meldt het. Zo
 * overschrijft het nooit iets wat iemand anders heeft gewijzigd.
 *
 *   npx tsx scripts/blog-seo-23nov.ts            voorvertoning, PRODUCTIE; schrijft niets
 *   npx tsx scripts/blog-seo-23nov.ts --ja       voert door, met back-up per artikel
 *   --dev                                        in de database van deze omgeving
 *
 * Waarom niet publish:blog? Dat zet het hele artikel opnieuw neer vanuit
 * content/blog/, inclusief de tekst. Hier gaat het om twee meta-velden en één
 * zin, dus de rest blijft staan zoals hij in de database staat.
 *
 * Terugdraaien: de back-up in .blog-backups/ (niet in git) bevat de oude rij.
 * Twee keer draaien is veilig: de tweede keer vindt het de oude waarden niet meer.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { blogPosts } from "@shared/schema";

const argv = process.argv.slice(2);
const naarDev = argv.includes("--dev");
const ja = argv.includes("--ja");

type Veld = "metaTitle" | "focusKeyword" | "content";
interface Bewerking { slug: string; veld: Veld; oud: string; nieuw: string; deel?: boolean }

/** deel: true = alleen dit stuk tekst binnen het veld vervangen (de rest blijft). */
const BEWERKINGEN: Bewerking[] = [
  { slug: "housekeeping-personeel-inhuren", veld: "metaTitle",
    oud: "Housekeeping personeel inhuren: 3 modellen vergeleken",
    nieuw: "Housekeeping uitbesteden of inhuren? 3 modellen vergeleken" },
  { slug: "housekeeping-personeel-inhuren", veld: "focusKeyword",
    oud: "housekeeping personeel inhuren", nieuw: "housekeeping uitbesteden" },
  { slug: "betrouwbaar-horeca-uitzendbureau-kiezen", veld: "metaTitle",
    oud: "Betrouwbaar horeca-uitzendbureau kiezen: dit verandert",
    nieuw: "Wtta: check of je horeca-uitzendbureau er klaar voor is" },
  { slug: "betrouwbaar-horeca-uitzendbureau-kiezen", veld: "focusKeyword",
    oud: "betrouwbaar horeca-uitzendbureau kiezen", nieuw: "Wtta horeca uitzendbureau" },
  { slug: "betrouwbaar-horeca-uitzendbureau-kiezen", veld: "content", deel: true,
    oud: "Meestal uit precies de posten waar deze vijf vragen over gaan.</p>",
    nieuw: "Meestal uit precies de posten waar deze vijf vragen over gaan. Wil je bureaus breder vergelijken, lees dan <a href=\"/horeca-uitzendbureau-amsterdam\">zo kies je een horeca uitzendbureau in Amsterdam</a>.</p>" },
];

function kiesDatabase(): string {
  if (naarDev) {
    if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is niet gezet."); process.exit(1); }
    return "deze omgeving (DATABASE_URL)";
  }
  const prod = process.env.PROD_DATABASE_URL;
  if (!prod) { console.error("PROD_DATABASE_URL is niet gezet. Zelfde instelling als bij publish:blog."); process.exit(1); }
  process.env.DATABASE_URL = prod;
  return "PRODUCTIE (doehetextra.nl)";
}

async function main(): Promise<void> {
  console.log(`\nDatabase: ${kiesDatabase()}`);
  console.log(ja ? "Modus:    doorvoeren\n" : "Modus:    voorvertoning (er wordt niets geschreven)\n");
  const { db, pool } = await import("../server/db");
  try {
    const slugs = Array.from(new Set(BEWERKINGEN.map((b) => b.slug)));
    for (const slug of slugs) {
      const [rij] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
      console.log(`/blog/${slug}`);
      if (!rij) { console.log("  staat niet in de database, overgeslagen\n"); continue; }
      const wijziging: Record<string, string> = {};
      for (const b of BEWERKINGEN.filter((x) => x.slug === slug)) {
        const huidig = String((rij as any)[b.veld] ?? "");
        const al = b.deel ? huidig.includes(b.nieuw) : huidig === b.nieuw;
        if (al) { console.log(`  = ${b.veld}: al aangepast`); continue; }
        const past = b.deel ? huidig.split(b.oud).length === 2 : huidig === b.oud;
        if (!past) {
          console.log(`  ! ${b.veld}: staat niet zoals verwacht, NIET aangepast`);
          console.log(`      in de database: ${b.deel ? "(zin niet gevonden)" : huidig}`);
          continue;
        }
        wijziging[b.veld] = b.deel ? huidig.replace(b.oud, b.nieuw) : b.nieuw;
        console.log(`  ~ ${b.veld}\n      oud:   ${b.deel ? b.oud.slice(0, 90) : b.oud}\n      nieuw: ${b.deel ? b.nieuw.slice(0, 160) : b.nieuw}`);
      }
      if (ja && Object.keys(wijziging).length) {
        const map = join(process.cwd(), ".blog-backups");
        mkdirSync(map, { recursive: true });
        const pad = join(map, `${slug}-${new Date().toISOString().replace(/[:.]/g, "")}.json`);
        writeFileSync(pad, JSON.stringify(rij, null, 2));
        await db.update(blogPosts).set({ ...wijziging, updatedAt: new Date() } as any).where(eq(blogPosts.slug, slug));
        console.log(`  Bijgewerkt. Oude versie in .blog-backups/${pad.split("/").pop()}`);
      }
      console.log("");
    }
    if (!ja) console.log("Doorvoeren: npx tsx scripts/blog-seo-23nov.ts --ja" + (naarDev ? " --dev" : ""));
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((err) => { console.error("Mislukt:", err?.message || err); process.exit(1); });
