/**
 * Een testlink voor het webgesprek met Job, alleen in EXTRA-test (TESTOMGEVING=1).
 *
 *   npm run job:testlink            (bediening, Nederlands)
 *   npm run job:testlink -- en      (Engels)
 *
 * Maakt één nieuwe, fictieve testkandidaat aan (e-mail op voorbeeld.nl, geen telefoonnummer) en start
 * het gesprek met Job via het web, zonder startmail. Zo stuurt Job nooit iets naar WhatsApp of e-mail.
 * Verwijdert en wijzigt niets van bestaande kandidaten. Print de link naar het webgesprek.
 */
import { randomBytes } from "node:crypto";
import { db, pool } from "../server/db";
import { candidates } from "../shared/schema";
import { gesprekLink, startGesprek } from "../server/job/jobService";

if (process.env.TESTOMGEVING !== "1") { console.error("Alleen in de testomgeving (TESTOMGEVING=1)."); process.exit(1); }

async function main() {
  const taal = process.argv[2] === "en" ? "en" : "nl";
  const code = `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const [c] = await db.insert(candidates).values({
    firstName: "Testkandidaat", lastName: `Job ${code}`, email: `job-test.${code}@voorbeeld.nl`, phone: null,
    nationality: "Nederlandse", nationalityIso: "NL", nationalityZone: "NL", city: "Amsterdam", language: taal === "en" ? "Engels" : "Nederlands",
    functionType: "horecamedewerker", sourceChannel: "job-testlink", hasCv: false, gesprekstaal: taal,
  } as any).returning();
  const g = await startGesprek(c.id, { voorkeur: "web", taal, mail: false });
  if (!g) throw new Error("het gesprek kon niet starten");
  console.log(`Testkandidaat ${c.id} (fictief, ${c.email})`);
  console.log(`Webgesprek met Job: ${gesprekLink(g.token)}`);
  // De gepubliceerde testomgeving kan een ander adres hebben dan deze Shell: het pad werkt op elk adres.
  console.log(`Of achter het adres van de gepubliceerde testomgeving: /job-gesprek?token=${encodeURIComponent(g.token)}`);
}

main().then(async () => { await pool.end().catch(() => {}); process.exit(0); }).catch(async (e) => { console.error(`Mislukt: ${e?.message || e}`); await pool.end().catch(() => {}); process.exit(1); });
