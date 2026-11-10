/**
 * Wat Job over EXTRA mag zeggen (Job 4). Alleen feiten die al vastliggen: in de
 * goedgekeurde teksten van Job, de planning en de vaste bedrijfsgegevens op de site.
 * Waar geen goedgekeurd antwoord voor is (loon, contractdetails, rooster, reiskosten),
 * zegt Job eerlijk dat een collega dat bij de kennismaking bespreekt. Hij verzint
 * niets en belooft niets. Puur, getest in shared/jobBeurt.test.ts.
 *
 * De AI kiest alleen de sleutel; de tekst komt altijd letterlijk uit deze lijst.
 */
export type KennisSleutel =
  | "extra" | "kantoor" | "kennismaking" | "na_aanmelding" | "job_ai" | "contact"
  | "loon" | "contract" | "rooster" | "reiskosten" | "cv_nodig" | "waarom_vraag";

export interface KennisItem { sleutel: KennisSleutel; onderwerp: string; nl: string; en: string; doorgeven?: boolean }

export const KENNIS: KennisItem[] = [
  { sleutel: "extra", onderwerp: "wat EXTRA is en doet",
    nl: "EXTRA is een uitzendbureau in Amsterdam voor hotels, events en logistiek, en iedereen werkt bij ons in loondienst.",
    en: "EXTRA is a staffing agency in Amsterdam for hotels, events and logistics, and everyone works for us on the payroll." },
  { sleutel: "kantoor", onderwerp: "waar het kantoor is",
    nl: "Ons kantoor is aan de Herengracht 372 in Amsterdam.",
    en: "Our office is at Herengracht 372 in Amsterdam." },
  { sleutel: "kennismaking", onderwerp: "hoe de kennismaking gaat",
    nl: "De kennismaking duurt een half uur op ons kantoor aan de Herengracht 372; neem je paspoort of ID-kaart mee.",
    en: "The meeting takes half an hour at our office at Herengracht 372; please bring your passport or ID card." },
  { sleutel: "na_aanmelding", onderwerp: "wat er na de vragen gebeurt",
    nl: "Na deze vragen bekijkt een collega je aanmelding en je cv, en daarna kies je zelf een moment voor een kennismaking.",
    en: "After these questions a colleague looks at your application and CV, and then you choose a moment for a short meeting yourself." },
  { sleutel: "job_ai", onderwerp: "of Job een mens of een AI is",
    nl: "Ik ben Job, een AI; typ MENS als je liever een collega spreekt.",
    en: "I'm Job, an AI; type HUMAN if you'd rather talk to a colleague." },
  { sleutel: "contact", onderwerp: "hoe je EXTRA belt of bereikt",
    nl: "Je kunt ons bellen op 085 130 59 15, of typ MENS voor een collega.",
    en: "You can call us on 085 130 59 15, or type HUMAN for a colleague." },
  { sleutel: "loon", onderwerp: "loon, salaris, uurloon, wat je verdient", doorgeven: true,
    nl: "Wat je verdient hangt af van de functie en de opdracht; dat bespreekt een collega met je bij de kennismaking.",
    en: "What you earn depends on the role and the assignment; a colleague will go through that with you at the meeting." },
  { sleutel: "contract", onderwerp: "contract, uren, vast of flexibel", doorgeven: true,
    nl: "Je werkt bij EXTRA in loondienst; de details van je contract bespreekt een collega bij de kennismaking.",
    en: "At EXTRA you work on the payroll; a colleague will go through the details of your contract at the meeting." },
  { sleutel: "rooster", onderwerp: "werktijden, rooster, waar je precies gaat werken", doorgeven: true,
    nl: "Waar en wanneer je precies werkt, bespreekt een collega met je bij de kennismaking.",
    en: "A colleague will go through where and when exactly you'd work at the meeting." },
  { sleutel: "reiskosten", onderwerp: "reiskosten, vervoer, parkeren", doorgeven: true,
    nl: "Dat bespreekt een collega met je bij de kennismaking.",
    en: "A colleague will go through that with you at the meeting." },
  { sleutel: "cv_nodig", onderwerp: "of een cv nodig is",
    nl: "Een cv helpt ons om je ervaring goed te zien; heb je er geen, dan kijken we samen bij de kennismaking.",
    en: "A CV helps us see your experience; if you don't have one, we'll go through it together at the meeting." },
  { sleutel: "waarom_vraag", onderwerp: "waarom Job iets vraagt, of waarom er na het formulier nog vragen komen",
    nl: "In het formulier staan je gegevens; met deze paar korte vragen weet een collega welk werk bij je past.",
    en: "The form has your details; with these few quick questions a colleague knows which work suits you." },
];

export function kennis(sleutel: string | null | undefined): KennisItem | null {
  return KENNIS.find((k) => k.sleutel === sleutel) ?? null;
}

/** Voor de AI: welke onderwerpen er zijn (zonder de teksten, die vult Job zelf in). */
export function kennisOverzicht(): string {
  return KENNIS.map((k) => `- ${k.sleutel}: ${k.onderwerp}`).join("\n");
}

export const ONBEKENDE_VRAAG = {
  nl: "Daar kan ik je nu geen goed antwoord op geven; ik geef je vraag door aan een collega.",
  en: "I can't give you a good answer to that right now; I'll pass your question on to a colleague.",
};
