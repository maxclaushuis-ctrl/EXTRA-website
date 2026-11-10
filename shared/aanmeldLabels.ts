/**
 * Aanmelden per label (mock-up aanmelden v2, akkoord Max 8 nov 2026).
 *
 * Wie via een werkpagina van Hotels, Events of Logistiek komt, ziet alleen de
 * functies van dat label, in de kleur van dat label. Het label gaat mee naar
 * de kandidaat (bron_details.branche) en bepaalt verderop het label in
 * Sollicitanten en Kandidaten, de vragen van Job en het intakeformulier.
 *
 * De functies per label komen van de bestaande werkpagina's. Elke functie
 * heeft een vaste code (opgeslagen als functie_eerste_keus) en hoort bij een
 * bestaande functionType van de kandidaat.
 */

export type AanmeldLabel = "hotels" | "events" | "logistiek";
export type FunctionType = "housekeeping" | "horecamedewerker" | "chef" | "frontoffice" | "logistiek";
export type Paspoort = "nl" | "eu" | "buiten";

export interface LabelFunctie { code: string; nl: string; en: string; functionType: FunctionType; afwas?: boolean }

export const LABELS: Record<AanmeldLabel, { nl: string; en: string; werkNl: string; werkEn: string; functies: LabelFunctie[]; kort: { nl: string; en: string } }> = {
  hotels: {
    nl: "Hotels", en: "Hotels", werkNl: "Werk in hotels", werkEn: "Work in hotels",
    kort: { nl: "Housekeeping, front office, F&B, keuken", en: "Housekeeping, front office, F&B, kitchen" },
    functies: [
      { code: "housekeeping", nl: "Housekeeping", en: "Housekeeping", functionType: "housekeeping" },
      { code: "frontoffice", nl: "Front office", en: "Front office", functionType: "frontoffice" },
      { code: "fb", nl: "F&B", en: "F&B", functionType: "horecamedewerker" },
      { code: "banqueting", nl: "Banqueting", en: "Banqueting", functionType: "horecamedewerker" },
      { code: "keuken", nl: "Keuken", en: "Kitchen", functionType: "chef" },
      { code: "afwas", nl: "Afwas", en: "Dishwashing", functionType: "chef", afwas: true },
    ],
  },
  events: {
    nl: "Events", en: "Events", werkNl: "Werk bij events", werkEn: "Work at events",
    kort: { nl: "Bediening, bar, runner, host of hostess", en: "Waiting staff, bar, runner, host or hostess" },
    functies: [
      { code: "bediening", nl: "Bediening", en: "Waiting staff", functionType: "horecamedewerker" },
      { code: "bar", nl: "Bar", en: "Bar", functionType: "horecamedewerker" },
      { code: "dinerloper", nl: "Dinerloper", en: "Food runner", functionType: "horecamedewerker" },
      { code: "runner", nl: "Runner", en: "Runner", functionType: "horecamedewerker" },
      { code: "host", nl: "Host of hostess", en: "Host or hostess", functionType: "horecamedewerker" },
      { code: "supervisor", nl: "Event supervisor", en: "Event supervisor", functionType: "horecamedewerker" },
    ],
  },
  logistiek: {
    nl: "Logistiek", en: "Logistics", werkNl: "Werk in de logistiek", werkEn: "Work in logistics",
    kort: { nl: "Orderpicker, heftruck, inpak, magazijn", en: "Order picker, forklift, packing, warehouse" },
    functies: [
      { code: "orderpicker", nl: "Orderpicker", en: "Order picker", functionType: "logistiek" },
      { code: "heftruck", nl: "Heftruck of reachtruck", en: "Forklift or reach truck", functionType: "logistiek" },
      { code: "inpak", nl: "Inpak en productie", en: "Packing and production", functionType: "logistiek" },
      { code: "expeditie", nl: "Expeditie", en: "Shipping", functionType: "logistiek" },
      { code: "magazijn", nl: "Magazijn", en: "Warehouse", functionType: "logistiek" },
      { code: "voorraad", nl: "Voorraad en kwaliteit", en: "Stock and quality", functionType: "logistiek" },
    ],
  },
};

/** "Weet ik nog niet": de functionType die bij het label past; de functie volgt bij de kennismaking. */
export const OPEN_CODE = "open";
const OPEN_TYPE: Record<AanmeldLabel, FunctionType> = { hotels: "horecamedewerker", events: "horecamedewerker", logistiek: "logistiek" };

/** Labels waar je meer dan één functie mag aanvinken. De eerste keuze is de hoofdfunctie (daar gaan de vragen van Job over). */
export const MEER_FUNCTIES: AanmeldLabel[] = ["events"];
export function meerFunctiesMogelijk(label: AanmeldLabel | null | undefined): boolean {
  return !!label && MEER_FUNCTIES.includes(label);
}

/**
 * De gekozen functies, netjes: de eerste is de hoofdfunctie. Zonder lijst, of bij een
 * label met één keuze, alleen de hoofdfunctie. Null als de lijst niet klopt (onbekende
 * code, "Weet ik nog niet" samen met een functie, of de eerste is niet de hoofdfunctie).
 */
export function functieLijst(label: AanmeldLabel | null, functie: string, functies?: string[] | null): string[] | null {
  if (!functies || !functies.length || !meerFunctiesMogelijk(label)) return [functie];
  const uniek = Array.from(new Set(functies));
  if (uniek[0] !== functie) return null;
  if (uniek.includes(OPEN_CODE)) return uniek.length === 1 ? uniek : null;
  const lijst = LABELS[label as AanmeldLabel].functies;
  return uniek.every((c) => lijst.some((f) => f.code === c)) ? uniek : null;
}

/** Codes van het vorige formulier (één lijst voor iedereen); blijven werken. */
const OUDE_CODES: Record<string, { functionType: FunctionType; afwas?: boolean; label: AanmeldLabel; nl: string; en: string }> = {
  bediening: { functionType: "horecamedewerker", label: "events", nl: "Bediening en bar", en: "Waiting staff and bar" },
  keuken: { functionType: "chef", label: "hotels", nl: "Keuken", en: "Kitchen" },
  afwas: { functionType: "chef", afwas: true, label: "hotels", nl: "Afwas", en: "Dishwashing" },
  housekeeping: { functionType: "housekeeping", label: "hotels", nl: "Housekeeping", en: "Housekeeping" },
  frontoffice: { functionType: "frontoffice", label: "hotels", nl: "Front office", en: "Front office" },
  logistiek: { functionType: "logistiek", label: "logistiek", nl: "Logistiek", en: "Logistics" },
};

export function isLabel(x: unknown): x is AanmeldLabel {
  return x === "hotels" || x === "events" || x === "logistiek";
}

/**
 * Zoekt een functie op. Met label: alleen de functies van dat label (plus
 * "open"). Zonder label: de codes van het vorige formulier.
 */
export function functieVan(code: string, label: AanmeldLabel | null): { functionType: FunctionType; afwas: boolean; label: AanmeldLabel; nl: string; en: string } | null {
  if (label) {
    if (code === OPEN_CODE) return { functionType: OPEN_TYPE[label], afwas: false, label, nl: LABELS[label].werkNl.toLowerCase(), en: LABELS[label].werkEn.toLowerCase() };
    const f = LABELS[label].functies.find((x) => x.code === code);
    if (f) return { functionType: f.functionType, afwas: !!f.afwas, label, nl: f.nl, en: f.en };
    // Een oude code die bij dit label past (bijvoorbeeld een opgeslagen link) mag ook.
    const oud = OUDE_CODES[code];
    return oud && oud.label === label ? { functionType: oud.functionType, afwas: !!oud.afwas, label, nl: oud.nl, en: oud.en } : null;
  }
  const oud = OUDE_CODES[code];
  return oud ? { functionType: oud.functionType, afwas: !!oud.afwas, label: oud.label, nl: oud.nl, en: oud.en } : null;
}

/** Werkpagina's per label (NL en EN). Op deze pagina's onthoudt de site het label voor het formulier. */
export const LABEL_PADEN: Record<AanmeldLabel, string[]> = {
  hotels: [
    "/horeca-vacatures-amsterdam", "/housekeeping-vacatures-amsterdam", "/front-office-vacatures-amsterdam", "/chef-vacatures-amsterdam", "/housekeeping-werk",
    "/en/hospitality-jobs", "/en/housekeeping-jobs", "/en/front-office-jobs", "/en/chef-jobs",
  ],
  events: ["/events-werk", "/en/event-jobs"],
  logistiek: ["/logistiek-werk", "/en/logistics-jobs"],
};

export function labelVanPad(pad: string): AanmeldLabel | null {
  const schoon = (pad || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  for (const l of Object.keys(LABEL_PADEN) as AanmeldLabel[]) if (LABEL_PADEN[l].includes(schoon)) return l;
  return null;
}

/** Paspoort of ID-kaart: drie knoppen in plaats van een landenlijst. */
export function zoneVanPaspoort(p: Paspoort): { nationality: string | null; nationalityIso: string | null; nationalityZone: "NL" | "EU" | "NON_EU" } {
  if (p === "nl") return { nationality: "Nederland", nationalityIso: "NL", nationalityZone: "NL" };
  return { nationality: null, nationalityIso: null, nationalityZone: p === "eu" ? "EU" : "NON_EU" };
}
