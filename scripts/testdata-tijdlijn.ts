/**
 * Testomgeving: geeft kandidaten in Kandidaten die nog nooit een gesprek met Job
 * hadden een gesprek zoals het er volgens de tijdlijn nu uit zou zien: gestart bij
 * de aanmelding, herinneringen na 22 en 70 uur, en na 118 uur zonder antwoord
 * "geen reactie" (rood). Zo kloppen de kleuren in Kandidaten met de tijdlijn.
 * Run met:  npm run testdata:tijdlijn
 *
 * Beveiliging en regels:
 *   - Alleen met TESTOMGEVING=1 in de omgeving.
 *   - Er wordt niets verstuurd: geen WhatsApp, geen mail. De berichten worden
 *     alleen in het gesprek gezet, met kanaal "web".
 *   - Alleen toevoegen: een nieuw gesprek met berichten voor kandidaten zonder
 *     gesprek. Bestaande gesprekken en kandidaten worden niet gewijzigd.
 *   - Twee keer draaien doet niets extra (wie al een gesprek heeft, slaat het over).
 */
import { randomBytes } from "crypto";
import { inArray } from "drizzle-orm";
import { db } from "../server/db";
import { candidates, jobBerichten, jobGesprekken } from "../shared/schema";
import { inKandidaten } from "../shared/kandidaatRegels";
import { teksten, type JobTaal } from "../shared/jobRegels";
import { tijdlijnStand } from "./testdataRegels";

async function main() {
  if (process.env.TESTOMGEVING !== "1") {
    console.error("Gestopt: TESTOMGEVING staat niet op 1. Dit script werkt alleen in een testomgeving.");
    process.exit(1);
  }
  const nu = new Date();
  const cs = (await db.select().from(candidates)).filter((c) => inKandidaten({ status: c.status, interviewDate: c.interviewDate ? String(c.interviewDate) : null }) && c.status === "in_behandeling");
  const met = cs.length ? new Set((await db.select({ id: jobGesprekken.candidateId }).from(jobGesprekken).where(inArray(jobGesprekken.candidateId, cs.map((c) => c.id)))).map((r) => r.id)) : new Set<number>();
  let toegevoegd = 0;
  const telling: Record<string, number> = {};
  for (const c of cs) {
    if (met.has(c.id)) continue;
    const stand = tijdlijnStand(new Date(c.createdAt as any), nu);
    if (!stand) continue;
    const taal: JobTaal = c.gesprekstaal === "en" ? "en" : "nl";
    const t = teksten(taal);
    const [g] = await db.insert(jobGesprekken).values({
      candidateId: c.id, token: randomBytes(12).toString("base64url"), kanaal: "web", taal,
      status: stand.status, velden: {}, laatsteOnderwerp: "ervaring", twijfels: [],
      herinneringen: stand.herinneringen, herinneringAt: stand.herinneringAt,
      gestartAt: stand.berichten[0].at, laatsteActiviteitAt: stand.laatsteActiviteitAt,
    } as any).onConflictDoNothing().returning();
    if (!g) continue;
    for (const b of stand.berichten) {
      const tekst = b.soort === "start" ? `${t.welkom(c.firstName, "werk bij EXTRA")}\n\n${t.ervaring(c.functionType || "horecamedewerker")}`
        : b.soort === "eerste" ? t.herinnering1(c.firstName) : t.herinnering2(c.firstName);
      await db.insert(jobBerichten).values({ gesprekId: g.id, richting: "uit", tekst, kanaal: "web", aangemaaktAt: b.at } as any);
    }
    toegevoegd++;
    const sleutel = stand.status === "geen_reactie" ? "rood (geen reactie)" : `oranje, ${stand.herinneringen} herinnering(en)`;
    telling[sleutel] = (telling[sleutel] || 0) + 1;
  }
  console.log(`Klaar: ${toegevoegd} gesprekken nagebootst, er is niets verstuurd.`);
  for (const [k, n] of Object.entries(telling)) console.log(`  ${k}: ${n}`);
  process.exit(0);
}

main().catch((e) => { console.error("Mislukt:", e?.message || e); process.exit(1); });
