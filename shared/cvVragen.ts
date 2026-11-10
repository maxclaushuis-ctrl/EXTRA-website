/**
 * Cv-vragen van Job (Job 3.0, fase 4, hoofdstuk 8).
 *
 * Na het lezen van het cv stelt Job hoogstens twee vragen in totaal, één per
 * bericht, en alleen als het antwoord de beoordeling wezenlijk kan verbeteren.
 * Bij een duidelijk cv geen enkele. Volgorde:
 * 1. Cv niet te lezen en het gesprek geeft geen ervaring: om een pdf of Word vragen.
 * 2. Ervaring in de functie, de werkzaamheden of een harde eis is onbekend.
 * 3. De laatste periode in de functie ligt een tijd terug (telt mee bij "recent").
 * Nooit vragen wat al bekend is, nooit naar redenen voor een onderbreking.
 * Puur en getest (shared/cvVragen.test.ts).
 */
import { bereken, datumTekst, invoerVan, type FunctieModel, type GesprekKennis, type Periode } from "./kandidaatMatch";

export type CvVraagSoort = "leesbaar" | "ervaring" | "werkzaamheden" | "certificaat" | "zelfstandig" | "recent";
export interface CvVraag { soort: CvVraagSoort; nl: string; en: string }

export const MAX_CV_VRAGEN = 2;

const ERVARING_VRAAG: Record<string, { nl: string; en: string }> = {
  housekeeping: { nl: "Heb je al ervaring met hotelkamers schoonmaken of ander schoonmaakwerk?", en: "Do you have any experience cleaning hotel rooms or other cleaning work?" },
  frontoffice: { nl: "Heb je al eens op een receptie of front office gewerkt? Zo ja, hoe lang ongeveer?", en: "Have you worked at a reception or front office before? If so, for about how long?" },
  kok: { nl: "Heb je al eens als kok gewerkt? Zo ja, hoe lang ongeveer?", en: "Have you worked as a cook before? If so, for about how long?" },
  heftruck: { nl: "Heb je al eens op een heftruck of reachtruck gereden? Zo ja, hoe lang ongeveer?", en: "Have you driven a forklift or reach truck before? If so, for about how long?" },
  keukenassistent: { nl: "Heb je al eens in een keuken gewerkt? Zo ja, hoe lang ongeveer?", en: "Have you worked in a kitchen before? If so, for about how long?" },
  bediening: { nl: "Heb je al eens in de bediening of achter de bar gewerkt? Zo ja, hoe lang ongeveer?", en: "Have you worked in service or behind a bar before? If so, for about how long?" },
  events: { nl: "Heb je al eens bij events of in de bediening gewerkt? Zo ja, hoe lang ongeveer?", en: "Have you worked at events or in service before? If so, for about how long?" },
  afwas: { nl: "Heb je al eens in een spoelkeuken of afwas gewerkt? Zo ja, hoe lang ongeveer?", en: "Have you worked as a dishwasher before? If so, for about how long?" },
  orderpicken: { nl: "Heb je al eens in een magazijn gewerkt, bijvoorbeeld met orderpicken of inpakken? Zo ja, hoe lang ongeveer?", en: "Have you worked in a warehouse before, for example order picking or packing? If so, for about how long?" },
};

export interface CvVraagInvoer {
  /** Status van de cv-analyse: klaar, niet_leesbaar, geen_tekst, afschermen, geen_ai of fout. */
  status: string;
  model: FunctieModel;
  periodes: Periode[];
  certificaten: string[];
  gesprek: GesprekKennis;
  /** De soorten die al gesteld zijn. */
  gesteld: string[];
  peil: Date;
}

/** De volgende cv-vraag, of null als Job niets hoeft te vragen. */
export function cvVraagVoor(i: CvVraagInvoer): CvVraag | null {
  if (i.gesteld.length >= MAX_CV_VRAGEN) return null;
  const nieuw = (v: CvVraag | null) => (v && !i.gesteld.includes(v.soort) ? v : null);

  // 1. Niet te lezen: alleen vragen als het gesprek ook geen ervaring geeft.
  if (i.status === "niet_leesbaar" || i.status === "geen_tekst") {
    if (i.gesprek.ervaringNiveau === "ervaren" || i.gesprek.ervaringNiveau === "starter") return null;
    return nieuw({ soort: "leesbaar", nl: "Ik kon je cv niet goed lezen. Heb je het ook als pdf of Word-bestand?", en: "I couldn't read your CV properly. Do you also have it as a PDF or Word file?" });
  }
  if (i.status !== "klaar") return null;

  const { invoer } = invoerVan(i.model, i.periodes, i.certificaten, i.gesprek, i.peil);
  const u = bereken(invoer);
  // Wie zelf zegt geen ervaring te hebben voor een functie die dat vraagt: niets meer vragen, de beoordelaar beslist.
  if (u.toestand === "eis_niet_voldaan") return null;
  // Al een sterke, zekere match: een vraag voegt niets toe.
  if (u.toestand === "score" && (u.score ?? 0) >= 95 && (invoer.eis === "voldaan" || invoer.eis === "geen")) return null;

  const zelfde = i.periodes.filter((p) => p.soort === "zelfde" && p.bron === "cv");
  const laatste = [...zelfde].sort((a, b) => String(b.einde === "heden" ? "9999" : b.einde || b.begin || "").localeCompare(String(a.einde === "heden" ? "9999" : a.einde || a.begin || "")))[0];
  const kandidaten: (CvVraag | null)[] = [];

  // 2a. Ervaring in de functie onbekend.
  if (invoer.A === null) {
    const v = ERVARING_VRAAG[i.model.sleutel];
    if (v) kandidaten.push({ soort: "ervaring", ...v });
  }
  // 2b. Alleen een functietitel: welke werkzaamheden.
  if (invoer.B === "titel" && laatste) {
    kandidaten.push(laatste.werkgever
      ? { soort: "werkzaamheden", nl: `Welke werkzaamheden deed je bij ${laatste.werkgever} vooral?`, en: `What did you mainly do at ${laatste.werkgever}?` }
      : { soort: "werkzaamheden", nl: `Welke werkzaamheden deed je als ${laatste.functie.toLowerCase()} vooral?`, en: `What did you mainly do as ${laatste.functie.toLowerCase()}?` });
  }
  // 2c. Een harde eis onbekend.
  if (invoer.eis === "onbekend" && i.model.eisRegel === "certificaat") {
    kandidaten.push({ soort: "certificaat", nl: "Heb je een geldig certificaat voor de heftruck of reachtruck?", en: "Do you have a valid forklift or reach truck certificate?" });
  }
  if (invoer.eis === "onbekend" && i.model.eisRegel === "kerntaak0" && invoer.B !== "titel") {
    kandidaten.push({ soort: "zelfstandig", nl: "Kookte je daar zelfstandig op een post?", en: "Did you cook independently on a station there?" });
  }
  // 3. Laatste periode in de functie ligt minstens zes maanden terug (telt mee bij "recent").
  if (typeof invoer.D === "number" && invoer.D >= 6 && i.model.soort !== "starters" && laatste?.einde && laatste.einde !== "heden") {
    const f = laatste.functie.toLowerCase();
    kandidaten.push({
      soort: "recent",
      nl: `Je laatste functie als ${f} op je cv loopt tot ${datumTekst(laatste.einde)}. Heb je daarna nog als ${f} gewerkt?`,
      en: `Your last job as ${f} on your CV runs until ${laatste.einde}. Have you worked as ${f} since then?`,
    });
  }
  for (const k of kandidaten) { const v = nieuw(k); if (v) return v; }
  return null;
}
