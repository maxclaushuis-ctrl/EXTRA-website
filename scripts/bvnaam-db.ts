/**
 * De officiële naam is EXTRA B.V. (KvK en SNA-verklaring, bevestigd door Max
 * 23-11-2026). Dit script vervangt "EXTRA Uitzendbureau B.V." door "EXTRA B.V."
 * in de blogs en vacatures in de database; de code en de
 * crawlerfragmenten zijn in de vorige commit al omgezet.
 *
 *   npx tsx scripts/bvnaam-db.ts           voorvertoning, PRODUCTIE; schrijft niets
 *   npx tsx scripts/bvnaam-db.ts --ja      voert door, met back-up per rij
 *   --dev                                    in de database van deze omgeving
 *
 * Twee keer draaien is veilig: de tweede keer is er niets meer te vervangen.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { blogPosts, vacancyPosts } from "@shared/schema";

const argv = process.argv.slice(2);
const naarDev = argv.includes("--dev");
const ja = argv.includes("--ja");

export const VERVANG: [string, string][] = [
  ["EXTRA Uitzendbureau B.V.", "EXTRA B.V."],
];

function vervang(w: unknown): unknown {
  if (typeof w === "string") { let s = w; for (const [a, b] of VERVANG) s = s.split(a).join(b); return s; }
  if (Array.isArray(w)) return w.map(vervang);
  return w;
}

const BLOGVELDEN = ["title", "excerpt", "content", "metaTitle", "metaDescription"] as const;
const VACATUREVELDEN = ["title", "shortDescription", "introductionText", "aboutRole", "workEnvironment",
  "responsibilities", "requirements", "offer", "faqItems", "ctaText", "metaTitle", "metaDescription",
  "ogTitle", "ogDescription"] as const;

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
  let totaal = 0;
  try {
    const tabellen = [
      { naam: "blog", tabel: blogPosts, velden: BLOGVELDEN as readonly string[] },
      { naam: "vacature", tabel: vacancyPosts, velden: VACATUREVELDEN as readonly string[] },
    ];
    for (const { naam, tabel, velden } of tabellen) {
      const rijen = (await db.select().from(tabel as any)) as Record<string, any>[];
      for (const rij of rijen) {
        const wijziging: Record<string, unknown> = {};
        for (const v of velden) {
          if (rij[v] == null) continue;
          const nieuw = vervang(rij[v]);
          if (JSON.stringify(nieuw) !== JSON.stringify(rij[v])) wijziging[v] = nieuw;
        }
        if (!Object.keys(wijziging).length) continue;
        totaal++;
        console.log(`${naam}: ${rij.slug}  (${Object.keys(wijziging).join(", ")})`);
        if (ja) {
          const map = join(process.cwd(), naam === "blog" ? ".blog-backups" : ".vacature-backups");
          mkdirSync(map, { recursive: true });
          const pad = join(map, `bvnaam-${rij.slug}-${new Date().toISOString().replace(/[:.]/g, "")}.json`);
          writeFileSync(pad, JSON.stringify(rij, null, 2));
          await db.update(tabel as any).set({ ...wijziging, updatedAt: new Date() } as any).where(eq((tabel as any).id, rij.id));
          console.log(`  bijgewerkt, back-up in ${pad.split("/").slice(-2).join("/")}`);
        }
      }
    }
    console.log(`\n${totaal} rij(en) met de oude bedrijfsnaam.`);
    if (!ja && totaal) console.log("Doorvoeren: npx tsx scripts/bvnaam-db.ts --ja" + (naarDev ? " --dev" : ""));
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((err) => { console.error("Mislukt:", err?.message || err); process.exit(1); });
