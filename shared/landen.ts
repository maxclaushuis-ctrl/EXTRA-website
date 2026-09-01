/**
 * Landen, landcodes en TWV-zone — één lijst voor het hele project.
 *
 * WAAROM DIT BESTAAT
 * ------------------
 * De landenlijst stond in client/src/pages/Aanmelden.tsx en was daarmee alleen
 * bruikbaar in de browser. De server kon er niet bij, dus bij het opslaan van
 * een sollicitatie was er geen manier om van "Bangladesh" een landcode te
 * maken. Het gevolg staat in de database: candidates.nationality is vrije tekst
 * met twee soorten waarden door elkaar — landnamen uit het aanmeldformulier
 * ("Bangladesh") en bijvoeglijke naamwoorden uit de XLSX-import
 * ("Bangladeshi"). Daar valt niets betrouwbaars mee te filteren.
 *
 * Deze lijst staat in shared/ zodat het formulier én de server dezelfde bron
 * gebruiken. Er komt geen tweede vertaaltabel bij.
 *
 * DRIE DINGEN DIE JE MOET WETEN VOORDAT JE HIER IETS WIJZIGT
 * ---------------------------------------------------------
 * 1. `zone` is niet hetzelfde als `groep`. De zes Caribische rijksdelen staan
 *    in de EU/EER-groep van de dropdown (zo stond het er), maar hun zone is
 *    "NL" omdat iemand met de Nederlandse nationaliteit geen TWV nodig heeft.
 *    De oude getFlow() controleerde ze daarom vóór de EU-lijst; die volgorde
 *    zit nu in de `zone`-waarde zelf.
 * 2. Zwitserland staat in de EU/EER-groep en krijgt zone "EU". Dat is niet
 *    staatkundig juist — Zwitserland zit niet in de EER — maar het is wel de
 *    bestaande werking van het formulier, en voor werkvergunningen klopt de
 *    uitkomst. Bewust ongewijzigd overgenomen.
 * 3. Drie codes zijn niet eenduidig; zie de opmerkingen in de lijst.
 *
 * De volgorde van ALLE_LANDNAMEN is exact die van de oude ALL_COUNTRIES:
 * Nederland, dan de EU/EER-groep alfabetisch, dan een scheidingsteken, dan de
 * rest. Daar hangt de dropdown aan.
 *
 * TOEVOEGINGEN NA DE VERHUIZING
 * -----------------------------
 * De lijst begon als een letterlijke kopie van de oude ALL_COUNTRIES. Landen die
 * daarna zijn toegevoegd staan hieronder bij, en staan óók in
 * shared/landen.test.ts in BEWUST_TOEGEVOEGD. Die test controleert dat de oude
 * lijst regel voor regel intact is als je de toevoegingen weglaat: een land dat
 * per ongeluk verdwijnt of van plek verschuift valt zo alsnog op.
 *
 * - Gambia (GM). Ontbrak in de oude lijst, terwijl er wél kandidaten met
 *   nationaliteit "Gambiaanse" in de TWV-administratie staan. Niet te verwarren
 *   met Gabon (GA), dat een ander land is en nog steeds niet in de lijst staat.
 */

export type LandZone = "NL" | "EU" | "NON_EU";

export interface Land {
  /** Landnaam zoals hij in het aanmeldformulier staat. Dit is de sleutel. */
  naam: string;
  /** ISO 3166-1 alpha-2. */
  iso: string;
  /** Bepaalt of er een tewerkstellingsvergunning nodig is. */
  zone: LandZone;
  /** In welke groep van de dropdown het land staat. */
  groep: "eu_eer" | "overig";
}

/** Scheidingsteken in de dropdown tussen de EU/EER-groep en de rest. */
export const LANDEN_SCHEIDING = "---";

export const LANDEN: Land[] = [
  { naam: "Nederland", iso: "NL", zone: "NL", groep: "overig" },

  // ── EU/EER-groep ─────────────────────────────────────────────────────────
  { naam: "Oostenrijk",   iso: "AT", zone: "EU", groep: "eu_eer" },
  { naam: "België",       iso: "BE", zone: "EU", groep: "eu_eer" },
  { naam: "Bulgarije",    iso: "BG", zone: "EU", groep: "eu_eer" },
  { naam: "Kroatië",      iso: "HR", zone: "EU", groep: "eu_eer" },
  { naam: "Cyprus",       iso: "CY", zone: "EU", groep: "eu_eer" },
  { naam: "Tsjechië",     iso: "CZ", zone: "EU", groep: "eu_eer" },
  { naam: "Denemarken",   iso: "DK", zone: "EU", groep: "eu_eer" },
  { naam: "Estland",      iso: "EE", zone: "EU", groep: "eu_eer" },
  { naam: "Finland",      iso: "FI", zone: "EU", groep: "eu_eer" },
  { naam: "Frankrijk",    iso: "FR", zone: "EU", groep: "eu_eer" },
  { naam: "Duitsland",    iso: "DE", zone: "EU", groep: "eu_eer" },
  { naam: "Griekenland",  iso: "GR", zone: "EU", groep: "eu_eer" },
  { naam: "Hongarije",    iso: "HU", zone: "EU", groep: "eu_eer" },
  { naam: "Ierland",      iso: "IE", zone: "EU", groep: "eu_eer" },
  { naam: "Italië",       iso: "IT", zone: "EU", groep: "eu_eer" },
  { naam: "Letland",      iso: "LV", zone: "EU", groep: "eu_eer" },
  { naam: "Litouwen",     iso: "LT", zone: "EU", groep: "eu_eer" },
  { naam: "Luxemburg",    iso: "LU", zone: "EU", groep: "eu_eer" },
  { naam: "Malta",        iso: "MT", zone: "EU", groep: "eu_eer" },
  { naam: "Polen",        iso: "PL", zone: "EU", groep: "eu_eer" },
  { naam: "Portugal",     iso: "PT", zone: "EU", groep: "eu_eer" },
  { naam: "Roemenië",     iso: "RO", zone: "EU", groep: "eu_eer" },
  { naam: "Slowakije",    iso: "SK", zone: "EU", groep: "eu_eer" },
  { naam: "Slovenië",     iso: "SI", zone: "EU", groep: "eu_eer" },
  { naam: "Spanje",       iso: "ES", zone: "EU", groep: "eu_eer" },
  { naam: "Zweden",       iso: "SE", zone: "EU", groep: "eu_eer" },
  { naam: "IJsland",      iso: "IS", zone: "EU", groep: "eu_eer" },
  { naam: "Liechtenstein",iso: "LI", zone: "EU", groep: "eu_eer" },
  { naam: "Noorwegen",    iso: "NO", zone: "EU", groep: "eu_eer" },
  { naam: "Zwitserland",  iso: "CH", zone: "EU", groep: "eu_eer" }, // zie punt 2 hierboven

  // Caribisch deel van het Koninkrijk: staat in de EU/EER-groep van de
  // dropdown, maar de zone is NL — geen TWV nodig.
  { naam: "Curaçao",        iso: "CW", zone: "NL", groep: "eu_eer" },
  { naam: "Aruba",          iso: "AW", zone: "NL", groep: "eu_eer" },
  { naam: "Sint Maarten",   iso: "SX", zone: "NL", groep: "eu_eer" },
  // Bonaire, Sint Eustatius en Saba delen één ISO-code (BQ, "Caribisch
  // Nederland"). Dat is geen fout: de codelijst kent ze niet apart.
  { naam: "Bonaire",        iso: "BQ", zone: "NL", groep: "eu_eer" },
  { naam: "Sint Eustatius", iso: "BQ", zone: "NL", groep: "eu_eer" },
  { naam: "Saba",           iso: "BQ", zone: "NL", groep: "eu_eer" },

  // ── Overige landen ───────────────────────────────────────────────────────
  { naam: "Afghanistan",              iso: "AF", zone: "NON_EU", groep: "overig" },
  { naam: "Albanië",                  iso: "AL", zone: "NON_EU", groep: "overig" },
  { naam: "Algerije",                 iso: "DZ", zone: "NON_EU", groep: "overig" },
  { naam: "Angola",                   iso: "AO", zone: "NON_EU", groep: "overig" },
  { naam: "Argentinië",               iso: "AR", zone: "NON_EU", groep: "overig" },
  { naam: "Armenië",                  iso: "AM", zone: "NON_EU", groep: "overig" },
  { naam: "Australië",                iso: "AU", zone: "NON_EU", groep: "overig" },
  { naam: "Azerbeidzjan",             iso: "AZ", zone: "NON_EU", groep: "overig" },
  { naam: "Bangladesh",               iso: "BD", zone: "NON_EU", groep: "overig" },
  { naam: "Belarus",                  iso: "BY", zone: "NON_EU", groep: "overig" },
  { naam: "Bhutan",                   iso: "BT", zone: "NON_EU", groep: "overig" },
  { naam: "Bolivia",                  iso: "BO", zone: "NON_EU", groep: "overig" },
  { naam: "Bosnië en Herzegovina",    iso: "BA", zone: "NON_EU", groep: "overig" },
  { naam: "Brazilië",                 iso: "BR", zone: "NON_EU", groep: "overig" },
  { naam: "Cambodja",                 iso: "KH", zone: "NON_EU", groep: "overig" },
  { naam: "Cameroen",                 iso: "CM", zone: "NON_EU", groep: "overig" },
  { naam: "Canada",                   iso: "CA", zone: "NON_EU", groep: "overig" },
  { naam: "Chili",                    iso: "CL", zone: "NON_EU", groep: "overig" },
  { naam: "China",                    iso: "CN", zone: "NON_EU", groep: "overig" },
  { naam: "Colombia",                 iso: "CO", zone: "NON_EU", groep: "overig" },
  // "Congo" is in de dropdown niet nader bepaald. CG is Congo-Brazzaville;
  // Congo-Kinshasa (DR Congo) is CD. Wie dit ooit uitsplitst moet de bestaande
  // rijen nalopen — daarom staat het hier expliciet.
  { naam: "Congo",                    iso: "CG", zone: "NON_EU", groep: "overig" },
  { naam: "Cuba",                     iso: "CU", zone: "NON_EU", groep: "overig" },
  { naam: "Dominicaanse Republiek",   iso: "DO", zone: "NON_EU", groep: "overig" },
  { naam: "Ecuador",                  iso: "EC", zone: "NON_EU", groep: "overig" },
  { naam: "Egypte",                   iso: "EG", zone: "NON_EU", groep: "overig" },
  { naam: "El Salvador",              iso: "SV", zone: "NON_EU", groep: "overig" },
  { naam: "Eritrea",                  iso: "ER", zone: "NON_EU", groep: "overig" },
  { naam: "Ethiopië",                 iso: "ET", zone: "NON_EU", groep: "overig" },
  { naam: "Filipijnen",               iso: "PH", zone: "NON_EU", groep: "overig" },
  { naam: "Gambia",                   iso: "GM", zone: "NON_EU", groep: "overig" },
  { naam: "Georgië",                  iso: "GE", zone: "NON_EU", groep: "overig" },
  { naam: "Ghana",                    iso: "GH", zone: "NON_EU", groep: "overig" },
  { naam: "Guatemala",                iso: "GT", zone: "NON_EU", groep: "overig" },
  { naam: "Guinee",                   iso: "GN", zone: "NON_EU", groep: "overig" },
  { naam: "Haïti",                    iso: "HT", zone: "NON_EU", groep: "overig" },
  { naam: "Honduras",                 iso: "HN", zone: "NON_EU", groep: "overig" },
  { naam: "India",                    iso: "IN", zone: "NON_EU", groep: "overig" },
  { naam: "Indonesië",                iso: "ID", zone: "NON_EU", groep: "overig" },
  { naam: "Irak",                     iso: "IQ", zone: "NON_EU", groep: "overig" },
  { naam: "Iran",                     iso: "IR", zone: "NON_EU", groep: "overig" },
  { naam: "Israël",                   iso: "IL", zone: "NON_EU", groep: "overig" },
  { naam: "Ivoorkust",                iso: "CI", zone: "NON_EU", groep: "overig" },
  { naam: "Jamaica",                  iso: "JM", zone: "NON_EU", groep: "overig" },
  { naam: "Japan",                    iso: "JP", zone: "NON_EU", groep: "overig" },
  { naam: "Jemen",                    iso: "YE", zone: "NON_EU", groep: "overig" },
  { naam: "Jordanië",                 iso: "JO", zone: "NON_EU", groep: "overig" },
  { naam: "Kaapverdië",               iso: "CV", zone: "NON_EU", groep: "overig" },
  { naam: "Kazachstan",               iso: "KZ", zone: "NON_EU", groep: "overig" },
  { naam: "Kenia",                    iso: "KE", zone: "NON_EU", groep: "overig" },
  { naam: "Kirgizië",                 iso: "KG", zone: "NON_EU", groep: "overig" },
  // Kosovo heeft geen officiële ISO 3166-1-code. XK is de code die de EU en
  // veel banken in de praktijk gebruiken; hij is "user-assigned", geen norm.
  { naam: "Kosovo",                   iso: "XK", zone: "NON_EU", groep: "overig" },
  { naam: "Koeweit",                  iso: "KW", zone: "NON_EU", groep: "overig" },
  { naam: "Laos",                     iso: "LA", zone: "NON_EU", groep: "overig" },
  { naam: "Libanon",                  iso: "LB", zone: "NON_EU", groep: "overig" },
  { naam: "Libië",                    iso: "LY", zone: "NON_EU", groep: "overig" },
  { naam: "Marokko",                  iso: "MA", zone: "NON_EU", groep: "overig" },
  { naam: "Mexico",                   iso: "MX", zone: "NON_EU", groep: "overig" },
  { naam: "Moldavië",                 iso: "MD", zone: "NON_EU", groep: "overig" },
  { naam: "Mongolië",                 iso: "MN", zone: "NON_EU", groep: "overig" },
  { naam: "Montenegro",               iso: "ME", zone: "NON_EU", groep: "overig" },
  { naam: "Mozambique",               iso: "MZ", zone: "NON_EU", groep: "overig" },
  { naam: "Myanmar",                  iso: "MM", zone: "NON_EU", groep: "overig" },
  { naam: "Nepal",                    iso: "NP", zone: "NON_EU", groep: "overig" },
  { naam: "Nicaragua",                iso: "NI", zone: "NON_EU", groep: "overig" },
  { naam: "Nigeria",                  iso: "NG", zone: "NON_EU", groep: "overig" },
  { naam: "Noord-Macedonië",          iso: "MK", zone: "NON_EU", groep: "overig" },
  { naam: "Oekraïne",                 iso: "UA", zone: "NON_EU", groep: "overig" },
  { naam: "Oezbekistan",              iso: "UZ", zone: "NON_EU", groep: "overig" },
  { naam: "Oman",                     iso: "OM", zone: "NON_EU", groep: "overig" },
  { naam: "Pakistan",                 iso: "PK", zone: "NON_EU", groep: "overig" },
  { naam: "Panama",                   iso: "PA", zone: "NON_EU", groep: "overig" },
  { naam: "Paraguay",                 iso: "PY", zone: "NON_EU", groep: "overig" },
  { naam: "Peru",                     iso: "PE", zone: "NON_EU", groep: "overig" },
  { naam: "Russische Federatie",      iso: "RU", zone: "NON_EU", groep: "overig" },
  { naam: "Rwanda",                   iso: "RW", zone: "NON_EU", groep: "overig" },
  { naam: "Saudi-Arabië",             iso: "SA", zone: "NON_EU", groep: "overig" },
  { naam: "Senegal",                  iso: "SN", zone: "NON_EU", groep: "overig" },
  { naam: "Servië",                   iso: "RS", zone: "NON_EU", groep: "overig" },
  { naam: "Sierra Leone",             iso: "SL", zone: "NON_EU", groep: "overig" },
  { naam: "Singapore",                iso: "SG", zone: "NON_EU", groep: "overig" },
  { naam: "Somalië",                  iso: "SO", zone: "NON_EU", groep: "overig" },
  { naam: "Sri Lanka",                iso: "LK", zone: "NON_EU", groep: "overig" },
  { naam: "Sudan",                    iso: "SD", zone: "NON_EU", groep: "overig" },
  { naam: "Suriname",                 iso: "SR", zone: "NON_EU", groep: "overig" },
  { naam: "Syrië",                    iso: "SY", zone: "NON_EU", groep: "overig" },
  { naam: "Tadzjikistan",             iso: "TJ", zone: "NON_EU", groep: "overig" },
  { naam: "Tanzania",                 iso: "TZ", zone: "NON_EU", groep: "overig" },
  { naam: "Thailand",                 iso: "TH", zone: "NON_EU", groep: "overig" },
  { naam: "Togo",                     iso: "TG", zone: "NON_EU", groep: "overig" },
  { naam: "Tunesië",                  iso: "TN", zone: "NON_EU", groep: "overig" },
  { naam: "Turkije",                  iso: "TR", zone: "NON_EU", groep: "overig" },
  { naam: "Turkmenistan",             iso: "TM", zone: "NON_EU", groep: "overig" },
  { naam: "Uganda",                   iso: "UG", zone: "NON_EU", groep: "overig" },
  { naam: "Uruguay",                  iso: "UY", zone: "NON_EU", groep: "overig" },
  { naam: "Venezuela",                iso: "VE", zone: "NON_EU", groep: "overig" },
  { naam: "Verenigd Koninkrijk",      iso: "GB", zone: "NON_EU", groep: "overig" },
  { naam: "Verenigde Arabische Emiraten", iso: "AE", zone: "NON_EU", groep: "overig" },
  { naam: "Verenigde Staten",         iso: "US", zone: "NON_EU", groep: "overig" },
  { naam: "Vietnam",                  iso: "VN", zone: "NON_EU", groep: "overig" },
  { naam: "Zuid-Afrika",              iso: "ZA", zone: "NON_EU", groep: "overig" },
  { naam: "Zuid-Korea",               iso: "KR", zone: "NON_EU", groep: "overig" },
  { naam: "Zuid-Sudan",               iso: "SS", zone: "NON_EU", groep: "overig" },
];

/** Namen in de EU/EER-groep, in de volgorde waarin ze hierboven staan. */
export const EU_EER_LANDNAMEN: string[] = LANDEN
  .filter(l => l.groep === "eu_eer")
  .map(l => l.naam);

/**
 * De dropdown van /aanmelden: Nederland, dan de EU/EER-groep alfabetisch, dan
 * het scheidingsteken, dan de rest in lijstvolgorde. Exact zoals ALL_COUNTRIES
 * het deed; shared/landen.test.ts vergelijkt dat regel voor regel.
 */
export const ALLE_LANDNAMEN: string[] = [
  "Nederland",
  ...[...EU_EER_LANDNAMEN].sort(),
  LANDEN_SCHEIDING,
  ...LANDEN.filter(l => l.groep === "overig" && l.naam !== "Nederland").map(l => l.naam),
];

const OP_NAAM = new Map(LANDEN.map(l => [l.naam, l]));

/** Het land bij een exacte naam, of undefined. Geen fuzzy matching: liever
 *  niets dan een gok. */
export function zoekLand(naam: string | null | undefined): Land | undefined {
  if (!naam) return undefined;
  return OP_NAAM.get(naam.trim());
}

/** De landcode bij een naam, of null als de naam niet in de lijst staat. */
export function landcode(naam: string | null | undefined): string | null {
  return zoekLand(naam)?.iso ?? null;
}

/**
 * De drie nationaliteitsvelden in één keer, voor elke plek die een kandidaat
 * wegschrijft. Zo is er precies één manier waarop code en zone worden afgeleid,
 * en kan er geen endpoint achterblijven met alleen de vrije tekst.
 *
 * Staat de naam niet exact in de lijst, dan blijven iso en zone NULL. Ook de
 * zone: bepaalZone() valt voor een schermflow terug op NON_EU, maar dat is een
 * keuze voor de wizard en niet iets dat je als feit in de database wilt zetten.
 */
export function landvelden(naam: string | null | undefined): {
  nationality: string | null;
  nationalityIso: string | null;
  nationalityZone: LandZone | null;
} {
  const schoon = naam?.trim() || null;
  const land = zoekLand(schoon);
  return {
    nationality: schoon,
    nationalityIso: land?.iso ?? null,
    nationalityZone: land?.zone ?? null,
  };
}

/**
 * Vervangt de oude getFlow() uit Aanmelden.tsx. Een onbekende naam telt als
 * NON_EU: dat is de veilige kant, want dan volgt de TWV-vraag.
 */
export function bepaalZone(naam: string | null | undefined): LandZone {
  return zoekLand(naam)?.zone ?? "NON_EU";
}
