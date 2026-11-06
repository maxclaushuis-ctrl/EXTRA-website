/**
 * Vult de testomgeving met fictieve kandidaten en vier testaccounts.
 * Run met:  npm run testdata:vullen
 *
 * Twee beveiligingen (scripts/testdataRegels.ts):
 *   1. Alleen met TESTOMGEVING=1 in de omgeving.
 *   2. Alleen op een database zonder echte kandidaten: staat er één
 *      kandidaat zonder @voorbeeld.nl-adres, dan stopt het script.
 *
 * Het script voegt alleen toe. Het verwijdert, overschrijft of migreert
 * niets. Bestaande testkandidaten met hetzelfde mailadres worden
 * overgeslagen, dus twee keer draaien geeft geen dubbele personen.
 *
 * Wachtwoorden van de testaccounts worden hier aangemaakt en één keer in
 * de shell getoond. Ze staan nergens anders.
 */
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../server/db";
import { candidates, users } from "../shared/schema";
import { landvelden } from "../shared/landen";
import { magVullen, testrijen, TESTACCOUNTS } from "./testdataRegels";

function wachtwoord(): string {
  // 12 tekens uit letters en cijfers, zonder verwarrende tekens.
  const tekens = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = randomBytes(12);
  return Array.from(b, (x) => tekens[x % tekens.length]).join("");
}

async function main() {
  const bestaand = await db.select({ email: candidates.email }).from(candidates);
  const besluit = magVullen({
    testomgeving: process.env.TESTOMGEVING === "1",
    bestaandeEmails: bestaand.map((r) => r.email),
  });
  if (!besluit.ok) {
    console.error(`Gestopt: ${besluit.reden}`);
    process.exit(1);
  }
  const alBekend = new Set(bestaand.map((r) => (r.email || "").toLowerCase()));

  // Testaccounts
  const aangemaakt: { email: string; wachtwoord: string }[] = [];
  for (const a of TESTACCOUNTS) {
    const [bestaat] = await db.select({ id: users.id }).from(users).where(eq(users.email, a.email));
    if (bestaat) continue;
    const ww = wachtwoord();
    await db.insert(users).values({
      email: a.email,
      password: await bcrypt.hash(ww, 12),
      firstName: a.firstName,
      lastName: a.lastName,
      role: a.role,
      status: "active",
    });
    aangemaakt.push({ email: a.email, wachtwoord: ww });
  }

  // Kandidaten
  let toegevoegd = 0;
  let overgeslagen = 0;
  for (const r of testrijen(new Date())) {
    if (alBekend.has(r.email.toLowerCase())) { overgeslagen++; continue; }
    const land = landvelden(r.nationality);
    await db.insert(candidates).values({
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      birthDate: r.birthDate,
      nationality: land.nationality,
      nationalityIso: land.nationalityIso,
      nationalityZone: land.nationalityZone,
      city: r.city,
      language: r.language,
      functionType: r.functionType,
      status: r.status,
      rejectionReason: r.rejectionReason,
      needsTwv: r.needsTwv,
      twvStatus: r.needsTwv ? "info_nodig" : null,
      interviewDate: r.interviewDate,
      interviewTime: r.interviewTime,
      sourceChannel: r.sourceChannel,
      hasCv: r.hasCv,
      horecaExperience: r.horecaExperience,
      availability: r.availability,
      canDoWashing: r.canDoWashing ?? false,
      isAssistantChef: r.isAssistantChef ?? false,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.createdAt,
    });
    toegevoegd++;
  }

  console.log(`\nKandidaten: ${toegevoegd} toegevoegd, ${overgeslagen} bestonden al.`);
  if (aangemaakt.length > 0) {
    console.log("\nNieuwe testaccounts (wachtwoord wordt maar één keer getoond; bewaar het in je wachtwoordmanager):");
    for (const a of aangemaakt) console.log(`  ${a.email}   ${a.wachtwoord}`);
  } else {
    console.log("Testaccounts bestonden al; wachtwoorden ongewijzigd.");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("Vullen mislukt:", e?.message || e);
  process.exit(1);
});
