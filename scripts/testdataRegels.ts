/**
 * Regels en inhoud voor het vullen van de testomgeving (scripts/testdata-vullen.ts).
 *
 * Alles hier is puur: geen database, geen omgeving. Daardoor zijn de twee
 * beveiligingen testbaar in scripts/testdataRegels.test.ts:
 *
 *   1. Het script draait alleen met TESTOMGEVING=1.
 *   2. Het script weigert een database die al echte gegevens bevat. Echt is
 *      alles wat niet op @voorbeeld.nl eindigt of geen e-mailadres heeft.
 *
 * Alle personen zijn verzonnen. Telefoonnummers zijn 06 0000 xxxx en bestaan
 * niet. Mailadressen eindigen op @voorbeeld.nl, zodat de tweede beveiliging
 * ze bij een volgende run herkent als testgegevens.
 */

export const TEST_DOMEIN = "@voorbeeld.nl";

export interface VulBesluit {
  ok: boolean;
  reden: string;
}

/** Mag het script deze database vullen? */
export function magVullen(opties: { testomgeving: boolean; bestaandeEmails: (string | null)[] }): VulBesluit {
  if (!opties.testomgeving) {
    return { ok: false, reden: "TESTOMGEVING staat niet op 1. Dit script vult alleen een testomgeving." };
  }
  const echt = opties.bestaandeEmails.filter((e) => !e || !e.toLowerCase().endsWith(TEST_DOMEIN));
  if (echt.length > 0) {
    return { ok: false, reden: `Deze database bevat ${echt.length} kandidaten die geen testgegevens zijn; dit lijkt geen lege testdatabase.` };
  }
  return { ok: true, reden: "Lege testdatabase of alleen testgegevens." };
}

export type Functie = "housekeeping" | "horecamedewerker" | "chef" | "frontoffice" | "logistiek";
export type Status = "in_behandeling" | "gepland" | "aangenomen" | "afgewezen";

export interface Testkandidaat {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  nationality: string;
  city: string;
  language: string;
  functionType: Functie;
  status: Status;
  /** Dagen ten opzichte van de maandag van de testweek; null = geen gesprek. */
  gesprekDag: number | null;
  gesprekTijd: string | null;
  sourceChannel: string;
  hasCv: boolean;
  horecaExperience: string;
  availability: string;
  needsTwv: boolean;
  rejectionReason: string | null;
  notes: string;
  /** Dagen geleden aangemeld. */
  dagenGeleden: number;
  canDoWashing?: boolean;
  isAssistantChef?: boolean;
}

/** Maandag van de week waarin `vandaag` valt, als YYYY-MM-DD. */
export function maandagVan(vandaag: Date): Date {
  const d = new Date(Date.UTC(vandaag.getUTCFullYear(), vandaag.getUTCMonth(), vandaag.getUTCDate()));
  const dag = d.getUTCDay(); // 0 = zondag
  const terug = dag === 0 ? 6 : dag - 1;
  d.setUTCDate(d.getUTCDate() - terug);
  return d;
}

export function isoDatum(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function plusDagen(d: Date, n: number): Date {
  const k = new Date(d.getTime());
  k.setUTCDate(k.getUTCDate() + n);
  return k;
}

const NL = "Nederland";

/** De vaste set testkandidaten. Dezelfde namen als in de mock-ups op het canvas. */
export function testkandidaten(): Testkandidaat[] {
  let tel = 0;
  const k = (
    firstName: string, lastName: string, functionType: Functie, status: Status,
    rest: Partial<Testkandidaat> = {},
  ): Testkandidaat => {
    tel += 1;
    const nr = String(tel).padStart(4, "0");
    const slug = `${firstName}.${lastName}`.toLowerCase().normalize("NFD").replace(/[^a-z.]/g, "");
    return {
      firstName, lastName, functionType, status,
      email: `${slug}${TEST_DOMEIN}`,
      phone: `+316 0000 ${nr}`.replace(/\s/g, ""),
      birthDate: `200${(tel % 6) + 1}-0${(tel % 9) + 1}-1${tel % 9}`,
      nationality: NL,
      city: "Amsterdam",
      language: "Nederlands, Engels",
      gesprekDag: null, gesprekTijd: null,
      sourceChannel: "website - aanmeldflow",
      hasCv: true,
      horecaExperience: "1 - 2 jaar",
      availability: "Avonden en weekend",
      needsTwv: false,
      rejectionReason: null,
      notes: "Testpersoon, verzonnen.",
      dagenGeleden: 3,
      ...rest,
    };
  };

  return [
    // Gesprekken deze week (weekoverzicht I): 13 stuks, maandag tot en met vrijdag
    k("Iris", "de Groot", "horecamedewerker", "gepland", { gesprekDag: 0, gesprekTijd: "10:00", dagenGeleden: 6 }),
    k("Kevin", "Smit", "horecamedewerker", "gepland", { gesprekDag: 0, gesprekTijd: "13:00", canDoWashing: true, horecaExperience: "Geen ervaring", dagenGeleden: 5 }),
    k("Bram", "Visser", "logistiek", "gepland", { gesprekDag: 0, gesprekTijd: "15:00", dagenGeleden: 7 }),
    k("Eva", "Hoekstra", "housekeeping", "gepland", { gesprekDag: 1, gesprekTijd: "09:30", dagenGeleden: 4 }),
    k("Lisa", "de Vries", "horecamedewerker", "gepland", { gesprekDag: 1, gesprekTijd: "14:00", city: "Amsterdam-Oost", dagenGeleden: 7, notes: "Testpersoon. Festival en café/bar, 12 uur per week." }),
    k("Tim", "Bos", "logistiek", "gepland", { gesprekDag: 1, gesprekTijd: "16:00", dagenGeleden: 3 }),
    k("Marta", "García", "housekeeping", "gepland", { gesprekDag: 2, gesprekTijd: "10:00", nationality: "Spanje", language: "Spaans, Engels", dagenGeleden: 5 }),
    k("Yara", "Mansour", "frontoffice", "gepland", { gesprekDag: 2, gesprekTijd: "11:00", dagenGeleden: 9 }),
    k("Daniel", "Kowalski", "logistiek", "gepland", { gesprekDag: 2, gesprekTijd: "15:00", nationality: "Polen", language: "Pools, Engels", dagenGeleden: 12 }),
    k("Ahmed", "Ouazzani", "chef", "gepland", { gesprekDag: 3, gesprekTijd: "11:00", isAssistantChef: true, dagenGeleden: 6 }),
    k("Sophie", "Laan", "horecamedewerker", "gepland", { gesprekDag: 3, gesprekTijd: "14:30", dagenGeleden: 5 }),
    k("Nina", "Jansen", "housekeeping", "gepland", { gesprekDag: 4, gesprekTijd: "10:30", dagenGeleden: 3 }),
    k("Samir", "Benali", "chef", "gepland", { gesprekDag: 4, gesprekTijd: "13:00", nationality: "Marokko", language: "Arabisch, Engels, Nederlands basis", needsTwv: true, isAssistantChef: true, horecaExperience: "3 - 5 jaar", notes: "Testpersoon. Werkautorisatie onduidelijk: twijfelgeval voor de planner." }),

    // Nieuw aangemeld, nog bij Job of de planner (Kandidaten G)
    k("Tess", "Kramer", "horecamedewerker", "in_behandeling", { canDoWashing: true, horecaExperience: "Geen ervaring", city: "Amstelveen", dagenGeleden: 1, birthDate: "2008-03-14" }),
    k("Noor", "Hendriks", "horecamedewerker", "in_behandeling", { city: "Amsterdam-West", dagenGeleden: 2 }),
    k("Mehmet", "Yilmaz", "logistiek", "in_behandeling", { dagenGeleden: 9 }),
    k("Fleur", "van Dijk", "housekeeping", "in_behandeling", { dagenGeleden: 6 }),
    k("Joris", "Mulder", "horecamedewerker", "in_behandeling", { dagenGeleden: 5, hasCv: false }),
    k("Amira", "El Idrissi", "frontoffice", "in_behandeling", { dagenGeleden: 4 }),
    k("Ruben", "de Boer", "chef", "in_behandeling", { dagenGeleden: 3, hasCv: false }),
    k("Sara", "Willems", "horecamedewerker", "in_behandeling", { dagenGeleden: 2 }),
    k("Luuk", "Peters", "horecamedewerker", "in_behandeling", { dagenGeleden: 0, hasCv: false }),
    k("Sanne", "Vermeulen", "housekeeping", "in_behandeling", { dagenGeleden: 0 }),
    k("Daan", "Koning", "logistiek", "in_behandeling", { dagenGeleden: 1 }),
    k("Julia", "Dekker", "frontoffice", "in_behandeling", { dagenGeleden: 8, language: "Engels", nationality: "Verenigd Koninkrijk", needsTwv: true }),

    // Kandidaten 3.0: elke toestand van het overzicht (bord G), zie testJobGesprekken()
    k("Jesse", "van Dam", "horecamedewerker", "in_behandeling", { dagenGeleden: 4, hasCv: false }),
    k("Mila", "Vos", "housekeeping", "in_behandeling", { dagenGeleden: 2, hasCv: false }),
    k("Ravi", "Sharma", "logistiek", "in_behandeling", { dagenGeleden: 1, nationality: "India", language: "Engels" }),
    k("Zoë", "Peeters", "horecamedewerker", "in_behandeling", { dagenGeleden: 1, nationality: "België", city: "Antwerpen" }),
    k("Lina", "Haddad", "chef", "in_behandeling", { dagenGeleden: 0 }),
    k("Bo", "Hermans", "horecamedewerker", "in_behandeling", { dagenGeleden: 0, hasCv: false }),

    // Aangenomen (Onboarding J)
    k("Milan", "Jacobs", "horecamedewerker", "aangenomen", { dagenGeleden: 20 }),
    k("Sofia", "Rossi", "housekeeping", "aangenomen", { dagenGeleden: 18, nationality: "Italië", language: "Italiaans, Engels" }),
    k("Thomas", "Brouwer", "logistiek", "aangenomen", { dagenGeleden: 25 }),
    k("Esmee", "van Leeuwen", "frontoffice", "aangenomen", { dagenGeleden: 15 }),
    k("Finn", "de Jong", "chef", "aangenomen", { dagenGeleden: 30 }),
    k("Lotte", "Smits", "horecamedewerker", "aangenomen", { dagenGeleden: 22 }),

    // Afgewezen of afgevallen (Archief J2)
    k("Yasmin", "Aziz", "housekeeping", "afgewezen", { dagenGeleden: 10, rejectionReason: "beoordeling" }),
    k("Lars", "Meijer", "horecamedewerker", "afgewezen", { dagenGeleden: 9, rejectionReason: "zelf_afgehaakt" }),
    k("Eline", "Bakker", "frontoffice", "afgewezen", { dagenGeleden: 8, rejectionReason: "te_jong", birthDate: "2010-05-02" }),
    k("Omar", "Haddad", "chef", "afgewezen", { dagenGeleden: 7, rejectionReason: "id_niet_getoond" }),
    k("Femke", "Smits", "horecamedewerker", "afgewezen", { dagenGeleden: 6, rejectionReason: "beoordeling" }),
    k("Bas", "Kuipers", "logistiek", "afgewezen", { dagenGeleden: 5, rejectionReason: "niet_verschenen" }),
    k("Anouk", "Visser", "housekeeping", "afgewezen", { dagenGeleden: 4, rejectionReason: "zelf_afgehaakt" }),
    k("Pim", "Hendriksen", "horecamedewerker", "afgewezen", { dagenGeleden: 14, rejectionReason: "geen_reactie", hasCv: false }),
    k("Roos", "Timmermans", "horecamedewerker", "afgewezen", { dagenGeleden: 12, rejectionReason: "referentie_negatief" }),
  ];
}

/** Zet de vaste set om naar rijen met echte datums, ten opzichte van `vandaag`. */
export function testrijen(vandaag: Date) {
  const maandag = maandagVan(vandaag);
  return testkandidaten().map((t) => {
    const { gesprekDag, gesprekTijd, dagenGeleden, ...rest } = t;
    return {
      ...rest,
      interviewDate: gesprekDag === null ? null : isoDatum(plusDagen(maandag, gesprekDag)),
      interviewTime: gesprekTijd,
      createdAt: plusDagen(vandaag, -dagenGeleden),
    };
  });
}

/** De vier testaccounts. Wachtwoorden maakt het script zelf aan en toont het één keer in de shell. */
export const TESTACCOUNTS = [
  { email: `max.test${TEST_DOMEIN}`, firstName: "Max", lastName: "Test", role: "admin" as const },
  { email: `tester${TEST_DOMEIN}`, firstName: "Max", lastName: "Tester", role: "admin" as const },
  { email: `sanne${TEST_DOMEIN}`, firstName: "Sanne", lastName: "de Wit", role: "admin" as const },
  { email: `tom${TEST_DOMEIN}`, firstName: "Tom", lastName: "Jansen", role: "admin" as const },
];

// ─── Dossiers voor Sollicitanten (D1 tot en met D10) ────────────────────────
// Zodat de tester elke stap meteen ziet: Beoordelen, Ref. en doc. check,
// EXTRA check, Onboarding en het Archief met Terugzetten. Lisa de Vries en de
// andere gesprekken van deze week blijven vóór de intake staan.

type Antwoorden = Record<string, unknown>;
function intakeVoorbeeld(o: { id?: "Gezien" | "Niet gezien"; twv?: boolean; geenReferentie?: boolean; referent?: string; afwas?: boolean }): Antwoorden {
  const raster: Record<string, Record<string, "ja" | "nee">> = {
    Ma: { avond: "ja" }, Wo: { avond: "ja" }, Vr: { avond: "ja", nacht: "ja" }, Za: { overdag: "ja", avond: "ja" }, Zo: { avond: "ja" }, Di: { ochtend: "nee" },
  };
  return {
    id_gezien: o.id ?? "Gezien",
    talen: ["Nederlands", "Engels"],
    nationaliteit: o.twv ? "TWV nodig" : "Ja, geen TWV nodig",
    ervaring_soort: ["Festival", "Café/bar"],
    ervaring_jaren: "1-2 jaar",
    alleen_dienst: "Ja",
    drie_borden: "Ja",
    ...(o.afwas ? {} : { cocktails: 3, barista: 2 }),
    bijbaan: "Nee, studeert naast het werk",
    vaardigheden: { bediening: 4, bar: 3, diner: 3 },
    stellingen: [5, 3, 3, 4, 4, 3, 4, 4, 3, 5, 3, 2],
    belangrijkst: "Gezellige collega's",
    woordparen: [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1],
    vervoer: ["Fiets"],
    studenten_ov: "Weekend",
    rijbewijzen: ["Geen"],
    kleding: ["Wit hemd", "Zwarte pantalon", "Nette zwarte schoenen"],
    ehbo: "Nee",
    uren: 12,
    raster,
    referentie: o.geenReferentie ? { geen: true } : { naam: o.referent ?? "Mark, bedrijfsleider Café Voorbeeld", telefoon: "0600000000" },
    vragen: "Kan ik ook op festivals werken?",
  };
}

export interface Testdossier {
  email: string;
  stap: "beoordelen" | "ref_doc_check" | "extra_check" | "onboarding" | "archief";
  /** Dagen geleden in deze stap gekomen. */
  inStap: number;
  /** Dagen geleden het gesprek; null = gespreksdatum niet aanpassen. */
  gesprek: number | null;
  status?: Status;
  intake: Antwoorden;
  beoordeling?: Record<string, number>;
  controle?: Record<string, unknown>;
  twijfelVan?: "beoordelen" | "ref_doc_check";
  archief?: { uit: string; reden: string };
}

export function testdossiers(): Testdossier[] {
  const e = (voornaam: string, achternaam: string) => `${voornaam}.${achternaam}`.toLowerCase().normalize("NFD").replace(/[^a-z.]/g, "") + TEST_DOMEIN;
  const b = { communicatief: 72, representatief: 80, extravert: 64, indruk: 76 };
  return [
    { email: e("Mehmet", "Yilmaz"), stap: "beoordelen", inStap: 0, gesprek: 0, status: "gepland", intake: intakeVoorbeeld({}) },
    { email: e("Fleur", "van Dijk"), stap: "beoordelen", inStap: 1, gesprek: 1, status: "gepland", intake: intakeVoorbeeld({}) },
    { email: e("Amira", "El Idrissi"), stap: "beoordelen", inStap: 2, gesprek: 2, status: "gepland", intake: intakeVoorbeeld({ id: "Niet gezien" }) },
    { email: e("Sara", "Willems"), stap: "ref_doc_check", inStap: 1, gesprek: 2, status: "gepland", intake: intakeVoorbeeld({}), beoordeling: b, controle: { idGezien: true, idDoor: "Sanne", referent: "Mark, bedrijfsleider Café Voorbeeld", telefoon: "0600000000" } },
    { email: e("Daan", "Koning"), stap: "ref_doc_check", inStap: 4, gesprek: 5, status: "gepland", intake: intakeVoorbeeld({ id: "Niet gezien" }), beoordeling: b, controle: { referent: "Mark, bedrijfsleider Café Voorbeeld", telefoon: "0600000000", pogingen: [{ at: "", door: "Tom", uitkomst: "geen_gehoor" }] } },
    { email: e("Julia", "Dekker"), stap: "ref_doc_check", inStap: 9, gesprek: 10, status: "gepland", intake: intakeVoorbeeld({ twv: true }), beoordeling: b, controle: { idGezien: true, idDoor: "Sanne", referent: "Mark, bedrijfsleider Café Voorbeeld", uitkomst: "positief", pogingen: [{ at: "", door: "Sanne", uitkomst: "gesproken" }], verslag: "Betrouwbaar en vrolijk. Altijd op tijd." } },
    { email: e("Joris", "Mulder"), stap: "ref_doc_check", inStap: 3, gesprek: 4, status: "gepland", intake: intakeVoorbeeld({ geenReferentie: true }), beoordeling: b, controle: { idGezien: true, idDoor: "Tom", overgeslagen: true, overslaanReden: "eerste baan", overslaanDoor: "Tom" } },
    { email: e("Noor", "Hendriks"), stap: "extra_check", inStap: 1, gesprek: 3, status: "gepland", intake: intakeVoorbeeld({}), beoordeling: { communicatief: 55, representatief: 60, extravert: 30, indruk: 50 }, controle: { idGezien: true, idDoor: "Sanne" }, twijfelVan: "ref_doc_check" },
    { email: e("Milan", "Jacobs"), stap: "onboarding", inStap: 3, gesprek: 8, intake: intakeVoorbeeld({}), beoordeling: b, controle: { idGezien: true, idDoor: "Sanne", referent: "Mark, bedrijfsleider Café Voorbeeld", uitkomst: "positief", pogingen: [{ at: "", door: "Sanne", uitkomst: "gesproken" }], verslag: "Zeer goed in gastcontact." } },
    { email: e("Roos", "Timmermans"), stap: "archief", inStap: 2, gesprek: 6, intake: intakeVoorbeeld({}), beoordeling: b, controle: { idGezien: true, idDoor: "Tom", uitkomst: "negatief", verslag: "Kwam vaak te laat." }, archief: { uit: "ref_doc_check", reden: "referentie_negatief" } },
    { email: e("Femke", "Smits"), stap: "archief", inStap: 1, gesprek: 5, intake: intakeVoorbeeld({}), beoordeling: { communicatief: 40, representatief: 45, extravert: 20, indruk: 35 }, controle: { idGezien: true, idDoor: "Sanne" }, twijfelVan: "beoordelen", archief: { uit: "extra_check", reden: "beoordeling" } },
    { email: e("Bas", "Kuipers"), stap: "archief", inStap: 3, gesprek: 3, intake: {}, archief: { uit: "gesprek_gepland", reden: "niet_verschenen" } },
  ];
}

// ─── Gesprekken met Job voor Kandidaten 3.0 ─────────────────────────────────
export interface TestJob {
  email: string;
  status: "bezig" | "wacht_cv" | "planner" | "geen_reactie" | "plannen";
  herinneringen: number;
  /** Uren geleden de laatste activiteit. */
  uur: number;
  velden: Record<string, unknown>;
  twijfels?: string[];
  woonland?: string;
  functieEersteKeus?: string;
  /** Een mogelijk dubbel dossier met deze testkandidaat. */
  matchMet?: string;
}

export function testJobGesprekken(): TestJob[] {
  const e = (v: string, a: string) => `${v}.${a}`.toLowerCase().normalize("NFD").replace(/[^a-z.]/g, "") + TEST_DOMEIN;
  return [
    { email: e("Jesse", "van Dam"), status: "geen_reactie", herinneringen: 2, uur: 30, velden: { ervaring: "Twee jaar bediening", ervaringNiveau: "ervaren" } },
    { email: e("Mila", "Vos"), status: "bezig", herinneringen: 1, uur: 20, velden: { ervaring: "Hotel in Utrecht", ervaringNiveau: "ervaren", functievraag: "Zestien kamers" } },
    { email: e("Ravi", "Sharma"), status: "planner", herinneringen: 0, uur: 5, velden: { ervaring: "Magazijn", ervaringNiveau: "ervaren", werkautorisatie: "onbekend" }, twijfels: ["Werkautorisatie: weet het niet. Controleren vóór het uitnodigen."] },
    { email: e("Zoë", "Peeters"), status: "bezig", herinneringen: 0, uur: 0.1, velden: {}, woonland: "België" },
    { email: e("Lina", "Haddad"), status: "bezig", herinneringen: 0, uur: 2, velden: { ervaring: "Keuken van een brasserie", ervaringNiveau: "ervaren" }, matchMet: e("Lotte", "Smits") },
    { email: e("Tess", "Kramer"), status: "wacht_cv", herinneringen: 2, uur: 50, velden: { ervaring: "Geen", ervaringNiveau: "geen", functievraag: "x", diensten: "1-2", werkgebied: "Tot 10 km", talen: "Nederlands", cvParaat: "nee" }, functieEersteKeus: "afwas" },
    { email: e("Ruben", "de Boer"), status: "planner", herinneringen: 0, uur: 3, velden: { ervaring: "Nog nooit in een keuken gewerkt", ervaringNiveau: "geen" }, twijfels: ["Functie chef vraagt ervaring en die ontbreekt."] },
  ];
}
