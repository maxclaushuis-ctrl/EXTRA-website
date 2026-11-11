/**
 * Van Onboarding naar Medewerkers, de onboardingmail en Planboard (besluit Max, 11 nov 2026).
 *
 * Bij de knop "Medewerker aanmaken" in Onboarding gebeuren drie dingen:
 *  1. de medewerker wordt aangemaakt (zoals al gebouwd);
 *  2. de onboardingmail gaat uit, met de template die de interviewer koos
 *     (de best passende staat voorgeselecteerd, op taal en functiegroep);
 *  3. de medewerker gaat via de bestaande webhook naar Planboard, met de velden
 *     die de oude route "Aannemen als medewerker" ook stuurt. Het volledige
 *     profiel uit formulier versie 2 komt er pas bij als de nieuwe flow live is.
 *
 * In de testomgeving gaat er niets naar Planboard, en de mail alleen naar het
 * mailvenster. Bewust puur (geen server-imports), zodat de tests onder kale tsx draaien.
 */

export type Functiegroep = "Bediening" | "Chef" | "Housekeeping" | "Logistiek";

/** Dezelfde functiewaarden als de oude route (FUNCTIE_MAPPING in server/routes.ts), zodat Planboard niets nieuws ziet. */
export const PLANBORD_FUNCTIE: Record<string, string> = {
  horecamedewerker: "bediening", chef: "chef", housekeeping: "housekeeping", frontoffice: "front-office", logistiek: "orderpicker",
};
/** Dezelfde branchewaarden als de oude route (BRANCHE_MAPPING in server/routes.ts). */
export const PLANBORD_BRANCHE: Record<string, string> = {
  horecamedewerker: "Hotel", chef: "Restaurant", housekeeping: "Hotel", frontoffice: "Hotel", logistiek: "Logistiek",
};

const klein = (s?: string | null) => (s || "").trim().toLowerCase();

/** Voor het voorselecteren van de onboardingtemplate. Geen eigen groep (front office, afwas): de standaardtemplate. */
export function functiegroepVoor(functionType?: string | null, eersteKeus?: string | null, afwas?: boolean): Functiegroep | null {
  const t = klein(functionType), k = klein(eersteKeus);
  if (afwas || k === "afwas") return null;
  if (t === "housekeeping" || k === "housekeeping") return "Housekeeping";
  if (t === "chef" || k === "keuken") return "Chef";
  if (t === "logistiek") return "Logistiek";
  if (t === "frontoffice" || k === "frontoffice") return null;
  if (t === "horecamedewerker") return "Bediening";
  return null;
}

export interface KandidaatVoorPlanbord {
  id: number; firstName: string; lastName: string; email?: string | null; phone?: string | null;
  birthDate?: string | null; city?: string | null; nationality?: string | null; language?: string | null;
  functionType?: string | null; referralCode?: string | null;
}

/**
 * De payload voor de bestaande webhook, met alleen velden die de oude route ook stuurt.
 * Geen applicationId en geen cv-blok: die horen bij de oude aanmeldingen. Planboard haalt
 * het cv op via een applicationId; voor de nieuwe flow regelen we dat als alles live is.
 */
export function planbordPayload(k: KandidaatVoorPlanbord, medewerkerId: number) {
  const t = klein(k.functionType);
  const leeg = (v?: string | null) => (v && String(v).trim() ? String(v).trim() : null);
  return {
    id: String(medewerkerId),
    candidateId: k.id,
    employeeId: medewerkerId,
    firstName: k.firstName,
    lastName: k.lastName,
    function: PLANBORD_FUNCTIE[t] || k.functionType || "",
    email: leeg(k.email),
    phone: leeg(k.phone),
    birthDate: leeg(k.birthDate),
    city: leeg(k.city),
    nationality: leeg(k.nationality),
    branche: PLANBORD_BRANCHE[t] || null,
    opdrachtgever: null,
    contractType: null,
    startDate: null,
    language: leeg(k.language) || "Nederlands",
    referralCode: leeg(k.referralCode),
  };
}

export type StapUitkomst = { status: "verzonden" | "overgeslagen" | "mislukt"; reden?: string };

/** Eén korte melding voor de interviewer na de klik. */
export function uitkomstTekst(voornaam: string, mail: StapUitkomst, planbord: StapUitkomst): string {
  const m = mail.status === "verzonden" ? "onboardingmail verstuurd"
    : mail.status === "mislukt" ? `onboardingmail niet verstuurd (${mail.reden || "onbekende fout"}); verstuur hem vanuit Medewerkers`
    : `geen onboardingmail${mail.reden ? ` (${mail.reden})` : ""}`;
  const p = planbord.status === "verzonden" ? "doorgezet naar Planboard"
    : planbord.status === "mislukt" ? "niet doorgezet naar Planboard, kijk in het log"
    : `niet naar Planboard${planbord.reden ? ` (${planbord.reden})` : ""}`;
  return `${voornaam} staat in Medewerkers: ${m}, ${p}.`;
}
