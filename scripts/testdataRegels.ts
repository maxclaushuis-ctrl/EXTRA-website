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
  { email: `tester${TEST_DOMEIN}`, firstName: "Tester", lastName: "EXTRA", role: "admin" as const },
  { email: `sanne${TEST_DOMEIN}`, firstName: "Sanne", lastName: "de Wit", role: "admin" as const },
  { email: `tom${TEST_DOMEIN}`, firstName: "Tom", lastName: "Jansen", role: "admin" as const },
];
