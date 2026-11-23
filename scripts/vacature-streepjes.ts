/**
 * Streepjes als leesteken uit de teksten van gepubliceerde vacatures halen.
 * Op de site horen geen gedachtestreepjes of liggende streepjes (– en —).
 *
 *   npx tsx scripts/vacature-streepjes.ts              voorvertoning, PRODUCTIE; schrijft niets
 *   npx tsx scripts/vacature-streepjes.ts --ja         voert de wijzigingen door, met back-up
 *   --dev                                              in de database van deze omgeving
 *
 * Regels (puur, getest in shared/streepjes.test.ts):
 *   "€20–€24", "9 - 17"         → "€20 tot €24", "9 tot 17"
 *   "vast contract – alles"     → "vast contract, alles"
 *   "– punt" aan het begin       → "punt"
 * Wat daarna nog een – of — bevat, wordt gemeld en niet aangepast.
 *
 * Alleen de tekstvelden die op de site staan (TEKSTVELDEN behalve internalTitle,
 * plus featuredImageAlt). Slug, status, data, loon en canonical blijven staan.
 * Elke rij die wijzigt, gaat eerst als JSON naar .vacature-backups/ (niet in git).
 * Terugdraaien: die JSON-velden terugzetten (vraag Claude om het script).
 * Twee keer draaien is veilig: de tweede keer is er niets meer te doen.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { vacancyPosts } from "@shared/schema";
import { TEKSTVELDEN, knipsel } from "@shared/vacatureInvoer";
import { zonderStreepjesDiep, heeftStreepje } from "@shared/streepjes";

const argv = process.argv.slice(2);
const naarDev = argv.includes("--dev");
const ja = argv.includes("--ja");

const VELDEN = [...TEKSTVELDEN.filter((v) => v !== "internalTitle"), "featuredImageAlt"] as const;

function kiesDatabase(): string {
  if (naarDev) {
    if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is niet gezet."); process.exit(1); }
    return "deze omgeving (DATABASE_URL)";
  }
  const prod = process.env.PROD_DATABASE_URL;
  if (!prod) {
    console.error("PROD_DATABASE_URL is niet gezet. Zelfde instelling als bij publish:blog.");
    console.error("Alleen in deze omgeving kan met --dev.");
    process.exit(1);
  }
  process.env.DATABASE_URL = prod;
  return "PRODUCTIE (doehetextra.nl)";
}

const alsTekst = (v: unknown): string =>
  v == null ? "" : typeof v === "string" ? v : Array.isArray(v) && v.every((x) => typeof x === "string") ? v.join("\n") : JSON.stringify(v);

async function main(): Promise<void> {
  const doel = kiesDatabase();
  console.log(`\nDatabase: ${doel}`);
  console.log(ja ? "Modus:    doorvoeren\n" : "Modus:    voorvertoning (er wordt niets geschreven)\n");
  const { db, pool } = await import("../server/db");
  try {
    const rijen = await db.select().from(vacancyPosts).where(eq(vacancyPosts.status, "published"));
    let aantalRijen = 0;
    let aantalVelden = 0;
    const handmatig: string[] = [];
    const titels: string[] = [];

    for (const rij of rijen as Record<string, any>[]) {
      const wijziging: Record<string, unknown> = {};
      for (const veld of VELDEN) {
        const oud = rij[veld];
        if (oud == null) continue;
        const nieuw = zonderStreepjesDiep(oud);
        if (heeftStreepje(nieuw)) handmatig.push(`${rij.slug} · ${veld}`);
        if (alsTekst(nieuw) === alsTekst(oud)) continue;
        wijziging[veld] = nieuw;
        const k = knipsel(alsTekst(oud), alsTekst(nieuw));
        if (!Object.keys(wijziging).slice(0, -1).length) console.log(`/vacatures/${rij.slug}`);
        console.log(`  ~ ${veld}\n      oud:   ${k.oud.replace(/\n/g, " / ")}\n      nieuw: ${k.nieuw.replace(/\n/g, " / ")}`);
      }
      titels.push(`  ${String(wijziging.title ?? rij.title)}   (${rij.slug})`);
      const n = Object.keys(wijziging).length;
      if (!n) continue;
      aantalRijen++;
      aantalVelden += n;
      console.log("");
      if (ja) {
        const map = join(process.cwd(), ".vacature-backups");
        mkdirSync(map, { recursive: true });
        const pad = join(map, `streepjes-${rij.slug}-${new Date().toISOString().replace(/[:.]/g, "")}.json`);
        writeFileSync(pad, JSON.stringify(rij, null, 2));
        await db.update(vacancyPosts).set({ ...wijziging, updatedAt: new Date() } as any).where(eq(vacancyPosts.slug, rij.slug));
        console.log(`  Bijgewerkt. Oude versie in .vacature-backups/${pad.split("/").pop()}\n`);
      }
    }

    console.log("Titels van alle gepubliceerde vacatures na deze wijziging:");
    console.log(titels.sort().join("\n"));
    if (handmatig.length) {
      console.log("\nNog een streepje dat het script niet zelf aanpast (handmatig bekijken):");
      for (const h of handmatig) console.log(`  ${h}`);
    }
    console.log(`\n${rijen.length} gepubliceerde vacatures, ${aantalRijen} met wijzigingen (${aantalVelden} velden).`);
    if (!ja && aantalRijen) console.log("Doorvoeren: npx tsx scripts/vacature-streepjes.ts --ja" + (naarDev ? " --dev" : ""));
    if (ja) console.log("Klaar.");
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((err) => { console.error("Mislukt:", err?.message || err); process.exit(1); });
