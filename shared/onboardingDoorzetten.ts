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
 *
 * Profiel voor Planboard (akkoord Max, 18 nov 2026): achter de schakelaar PLANBORD_PROFIEL
 * gaat er een extra blok `profiel` mee, voor het zijpaneel en de medewerkerspagina in
 * Planboard. Alleen toevoegen: zonder de schakelaar is de payload precies zoals hiervoor.
 */
import { functieNamen, plannerskaart, type BeoordelingV2, type FunctieCtx, type IntakeV2 } from "./intakeV2";

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
export function planbordPayload(k: KandidaatVoorPlanbord, medewerkerId: number, profiel?: PlanbordProfiel | null) {
  const t = klein(k.functionType);
  const leeg = (v?: string | null) => (v && String(v).trim() ? String(v).trim() : null);
  return {
    ...(profiel ? { profiel } : {}),
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

// ─── Profiel voor Planboard ─────────────────────────────────────────────────

/** Schakelaar PLANBORD_PROFIEL: in de testomgeving vanzelf aan, uit met 0; elders alleen met 1. */
export function planbordProfielAan(env: { PLANBORD_PROFIEL?: string; TESTOMGEVING?: string }): boolean {
  const w = env.PLANBORD_PROFIEL;
  return w === "1" || (env.TESTOMGEVING === "1" && w !== "0");
}

/**
 * Het blok `data.profiel` (payloadVersion 3). De sleutels zijn er altijd; wat onbekend is, is null.
 * Representatief en de onderbouwing van de interviewer gaan bewust niet mee.
 */
export interface PlanbordProfiel {
  versie: 1;
  /** De schuiven uit het sollicitatiegesprek, 1 tot en met 100. */
  beoordeling: { algeheleIndruk: number | null; communicatie: number | null; datum: string | null; door: string | null } | null;
  ervaring: { duur: string; functie: string | null } | null;
  functies: string[] | null;
  /** Taken met het niveau zelfstandig, volgens de kandidaat. */
  zelfstandigIn: string[] | null;
  talen: { taal: string; niveau: string | null }[] | null;
  /** Alleen harde grenzen, geen voorkeuren. */
  letOp: string[] | null;
}

export interface ProfielInvoer {
  intake: IntakeV2 | null;
  beoordeling: BeoordelingV2 | null;
  beoordeeldAt?: Date | string | null;
  beoordeeldDoor?: string | null;
  functie: FunctieCtx;
}

const cijfer = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 1 && v <= 100 ? Math.round(v) : null);
const gevuld = <T>(x: T[]) => (x.length ? x : null);

/** De datum in Nederland als JJJJ-MM-DD, of null. */
function datumNL(v: Date | string | null | undefined): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const deel = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const pak = (soort: string) => deel.find((x) => x.type === soort)?.value || "";
  return `${pak("year")}-${pak("month")}-${pak("day")}`;
}

/** Bouwt het profiel uit de beoordeling en de intake. Is er niets bekend, dan null: er gaat dan geen blok mee. */
export function planbordProfiel(inv: ProfielInvoer): PlanbordProfiel | null {
  const b: BeoordelingV2 = inv.beoordeling || {};
  const indruk = cijfer(b.indruk), communicatie = cijfer(b.communicatief);
  const beoordeling = indruk === null && communicatie === null ? null
    : { algeheleIndruk: indruk, communicatie, datum: datumNL(inv.beoordeeldAt), door: (inv.beoordeeldDoor || "").trim().split(/\s+/)[0] || null };
  const i = inv.intake;
  if (!beoordeling && !i) return null;
  const functies = functieNamen(inv.functie);
  const duur = (i?.ervaring_duur || "").trim();
  const zelfstandig = Object.entries(i?.taken || {}).filter(([, t]) => t?.niveau === "zelfstandig").map(([naam]) => naam);
  const talen = (i?.talen || []).filter((t) => t && typeof t.taal === "string" && t.taal.trim()).map((t) => ({ taal: t.taal.trim(), niveau: t.niveau || null }));
  return {
    versie: 1,
    beoordeling,
    ervaring: duur ? { duur, functie: functies[0] || null } : null,
    functies: gevuld(functies),
    zelfstandigIn: gevuld(zelfstandig),
    talen: gevuld(talen),
    letOp: i ? gevuld(plannerskaart(i).grenzen) : null,
  };
}

/** Wat er in het profiel zit, voor de tijdlijn. Zonder inhoud, dus zonder persoonsgegevens. */
export function profielSamenvatting(p: PlanbordProfiel | null): string {
  if (!p) return "zonder profiel";
  const delen = [
    p.beoordeling ? "beoordeling" : "",
    p.ervaring ? "ervaring" : "",
    p.zelfstandigIn ? `${p.zelfstandigIn.length} ${p.zelfstandigIn.length === 1 ? "taak" : "taken"}` : "",
    p.talen ? `${p.talen.length} ${p.talen.length === 1 ? "taal" : "talen"}` : "",
    p.letOp ? `${p.letOp.length} keer let op` : "",
  ].filter(Boolean);
  return delen.length ? `met profiel: ${delen.join(", ")}` : "met profiel";
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
