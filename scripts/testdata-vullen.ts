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
import { candidates, users, sollicitantDossiers, sollicitantGebeurtenissen } from "../shared/schema";
import { bewaardTot } from "../shared/sollicitantRegels";
import { landvelden } from "../shared/landen";
import { magVullen, testrijen, testdossiers, TESTACCOUNTS } from "./testdataRegels";

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

  // Dossiers voor Sollicitanten: elke stap gevuld, zodat de tester alles kan doorlopen.
  let dossiers = 0;
  const dagenTerug = (n: number) => new Date(Date.now() - n * 86400000);
  const TIJDEN = ["10:30:00", "11:00:00", "13:00:00", "13:30:00", "14:30:00", "15:00:00"];
  for (const [nr, t] of testdossiers().entries()) {
    const [c] = await db.select().from(candidates).where(eq(candidates.email, t.email));
    if (!c) continue;
    const [al] = await db.select().from(sollicitantDossiers).where(eq(sollicitantDossiers.candidateId, c.id));
    if (al) continue;
    const sinds = dagenTerug(t.inStap);
    const intakeAt = dagenTerug(t.gesprek ?? t.inStap);
    const controle = { ...(t.controle || {}) } as Record<string, unknown>;
    if (Array.isArray(controle.pogingen)) controle.pogingen = (controle.pogingen as any[]).map((p) => ({ ...p, at: sinds.toISOString() }));
    if (controle.idGezien) controle.idAt = intakeAt.toISOString();
    if (controle.overgeslagen) controle.overslaanAt = sinds.toISOString();
    await db.insert(sollicitantDossiers).values({
      candidateId: c.id, stap: t.stap, stapSinds: sinds, branche: c.functionType === "logistiek" ? "logistiek" : "hotels", interviewer: "Sanne",
      intakeStatus: Object.keys(t.intake).length ? "afgerond" : "niet_gestart", intakeStap: 9, intake: t.intake,
      intakeDoor: Object.keys(t.intake).length ? "Sanne de Wit" : null, intakeAfgerondAt: Object.keys(t.intake).length ? intakeAt : null,
      beoordeling: t.beoordeling || {}, beoordeeldDoor: t.beoordeling ? "Sanne de Wit" : null, beoordeeldAt: t.beoordeling ? intakeAt : null,
      controle,
      twijfelVan: t.twijfelVan || null, twijfelDoor: t.twijfelVan ? "Sanne de Wit" : null, twijfelAt: t.twijfelVan ? sinds : null,
      geaccepteerdDoor: t.stap === "onboarding" ? "Sanne de Wit" : null, geaccepteerdAt: t.stap === "onboarding" ? sinds : null, geaccepteerdVia: t.stap === "onboarding" ? "ref_doc_check" : null,
      gearchiveerdUit: t.archief?.uit || null, archiefReden: t.archief?.reden || null, gearchiveerdDoor: t.archief ? "Tom Jansen" : null, gearchiveerdAt: t.archief ? sinds : null,
      vorigeStatus: t.archief || t.stap === "onboarding" ? "gepland" : null,
    });
    const velden: Record<string, unknown> = {};
    if (t.gesprek !== null) { const d = dagenTerug(t.gesprek); velden.interviewDate = d.toISOString().slice(0, 10); velden.interviewTime = TIJDEN[nr % TIJDEN.length]; }
    if (t.status) velden.status = t.status;
    if (t.archief) { velden.rejectionReason = t.archief.reden; velden.retentionUntil = bewaardTot(sinds); }
    if (Object.keys(velden).length) await db.update(candidates).set(velden as any).where(eq(candidates.id, c.id));
    await db.insert(sollicitantGebeurtenissen).values([
      ...(Object.keys(t.intake).length ? [{ candidateId: c.id, soort: "intake_afgerond", tekst: "Intake afgerond door Sanne", door: "Sanne", at: intakeAt }] : []),
      { candidateId: c.id, soort: `stap_${t.stap}`, tekst: t.stap === "archief" ? "Afgewezen door Tom (testgegevens)" : `Naar ${t.stap.replace(/_/g, " ")} (testgegevens)`, door: "Sanne", at: sinds },
    ]);
    dossiers++;
  }
  console.log(`Sollicitanten: ${dossiers} dossiers toegevoegd.`);
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
