/**
 * npm run twv:nationaliteit-rapport
 *
 * ALLEEN LEZEN. Dit script schrijft niets naar de database.
 *
 * Vergelijkt candidates.nationality (vrije tekst) met de landenlijst in
 * shared/landen.ts en rapporteert hoeveel rijen een landcode zouden krijgen en
 * hoeveel niet. Bedoeld om te bekijken vóórdat er ook maar iets wordt gevuld:
 * niet-matchende waarden blijven leeg, er wordt nooit een code geraden.
 *
 * Met --alle draait hij over alle kandidaten in plaats van alleen de rijen met
 * needs_twv = true.
 */
import { db } from "../server/db";
import { candidates } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { landcode, bepaalZone, zoekLand } from "@shared/landen";

async function main() {
  const alleRijen = process.argv.includes("--alle");

  const rijen = await db
    .select({
      id: candidates.id,
      voornaam: candidates.firstName,
      achternaam: candidates.lastName,
      nationaliteit: candidates.nationality,
      iso: candidates.nationalityIso,
      needsTwv: candidates.needsTwv,
    })
    .from(candidates)
    .where(alleRijen ? sql`true` : eq(candidates.needsTwv, true))
    .orderBy(candidates.id);

  const bereik = alleRijen ? "alle kandidaten" : "kandidaten met needs_twv = true";
  console.log(`\nTWV-nationaliteitsrapport — ${bereik}`);
  console.log(`${rijen.length} rijen bekeken. Er is niets gewijzigd.\n`);

  const leeg = rijen.filter(r => !r.nationaliteit?.trim());
  const metTekst = rijen.filter(r => r.nationaliteit?.trim());
  const gematcht = metTekst.filter(r => zoekLand(r.nationaliteit));
  const nietGematcht = metTekst.filter(r => !zoekLand(r.nationaliteit));

  console.log("── Samenvatting ────────────────────────────────────────────");
  console.log(`  geen nationaliteit ingevuld : ${String(leeg.length).padStart(4)}`);
  console.log(`  matcht op de landenlijst    : ${String(gematcht.length).padStart(4)}  → krijgt een landcode`);
  console.log(`  matcht niet                 : ${String(nietGematcht.length).padStart(4)}  → blijft leeg, handmatig corrigeren`);
  console.log(`  totaal                      : ${String(rijen.length).padStart(4)}\n`);

  if (gematcht.length > 0) {
    console.log("── Wat er gevuld zou worden ────────────────────────────────");
    const perLand = new Map<string, number>();
    for (const r of gematcht) {
      const sleutel = `${r.nationaliteit!.trim()} → ${landcode(r.nationaliteit)} (${bepaalZone(r.nationaliteit)})`;
      perLand.set(sleutel, (perLand.get(sleutel) ?? 0) + 1);
    }
    for (const [sleutel, aantal] of [...perLand.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(aantal).padStart(3)}×  ${sleutel}`);
    }
    console.log();
  }

  if (nietGematcht.length > 0) {
    console.log("── Wat leeg blijft ─────────────────────────────────────────");
    const perWaarde = new Map<string, number[]>();
    for (const r of nietGematcht) {
      const w = r.nationaliteit!.trim();
      perWaarde.set(w, [...(perWaarde.get(w) ?? []), r.id]);
    }
    for (const [waarde, ids] of [...perWaarde.entries()].sort((a, b) => b[1].length - a[1].length)) {
      const zichtbaar = ids.slice(0, 8).join(", ");
      const rest = ids.length > 8 ? ` … en ${ids.length - 8} meer` : "";
      console.log(`  ${String(ids.length).padStart(3)}×  "${waarde}"  — id ${zichtbaar}${rest}`);
    }
    console.log("\n  Deze waarden staan niet in shared/landen.ts. Meestal is het een");
    console.log("  bijvoeglijk naamwoord (\"Bangladeshi\" in plaats van \"Bangladesh\").");
    console.log("  Ze worden NIET automatisch omgezet — dat zou een gok zijn.\n");
  }

  const alGevuld = rijen.filter(r => r.iso);
  if (alGevuld.length > 0) {
    console.log(`── Al gevuld ───────────────────────────────────────────────`);
    console.log(`  ${alGevuld.length} rijen hebben al een landcode.\n`);
  }

  console.log("Klaar. Er is niets naar de database geschreven.\n");
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Rapport mislukt:", err?.message || err);
    process.exit(1);
  });
