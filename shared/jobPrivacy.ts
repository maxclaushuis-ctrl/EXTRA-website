/**
 * Privacyfilter voor Job (Job 3.0, fase 1).
 *
 * Herkent gevoelige gegevens in een bericht van de kandidaat vóórdat Job het
 * bewaart of aan de AI geeft, en vervangt ze door [verwijderd]:
 * - BSN: 9 cijfers die de elfproef halen;
 * - IBAN: landcode, controlegetal en rekeningnummer (mod 97);
 * - documentnummer van paspoort of ID-kaart: alleen als het bericht over een
 *   paspoort, ID-kaart of document gaat, want het patroon lijkt op gewone woorden;
 * - adres: postcode met huisnummer, of een straatnaam met huisnummer.
 *
 * Puur: geen opslag, geen netwerk. Getest in shared/jobPrivacy.test.ts.
 */

export type PrivacySoort = "bsn" | "iban" | "document" | "adres";

export interface PrivacyUitkomst {
  tekst: string;
  gevonden: PrivacySoort[];
  /** Er blijft geen inhoud over naast [verwijderd]. */
  leeg: boolean;
}

export const VERWIJDERD = "[verwijderd]";

function elfproef(cijfers: string): boolean {
  if (!/^\d{9}$/.test(cijfers) || /^0+$/.test(cijfers)) return false;
  let som = 0;
  for (let i = 0; i < 8; i++) som += Number(cijfers[i]) * (9 - i);
  som -= Number(cijfers[8]);
  return som % 11 === 0;
}

function ibanGeldig(ruw: string): boolean {
  const iban = ruw.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const verplaatst = iban.slice(4) + iban.slice(0, 4);
  let rest = 0;
  for (const teken of verplaatst) {
    const waarde = /\d/.test(teken) ? teken : String(teken.charCodeAt(0) - 55);
    for (const c of waarde) rest = (rest * 10 + Number(c)) % 97;
  }
  return rest === 1;
}

const OVER_DOCUMENT = /\b(paspoort|passport|id[- ]?kaart|identiteitskaart|identity card|id card|rijbewijs|driving licen[cs]e|document(nummer)?|verblijfs(vergunning|document)|residence permit)/i;
const GEEN_TELLING = "(?!\\s*(?:jaar|maand|maanden|week|weken|uur|dagen|dag|keer|sterren|ster|euro|years?|months?|weeks?|hours?|days?|times|stars?)\\b)";
const STRAAT = new RegExp(`\\b[A-Za-zÀ-ÿ'.]+(?:straat|laan|weg|plein|gracht|kade|singel|dijk|steeg|dreef|street|road|avenue)\\s+\\d{1,4}\\s?[a-zA-Z]?\\b${GEEN_TELLING}`, "gi");
const PC = "\\d{4}(?:\\s?[A-Z]{2}|[a-z]{2})";
const POSTCODE_NUMMER = new RegExp(`\\b${PC}\\s*,?\\s*\\d{1,4}\\s?[a-zA-Z]?\\b${GEEN_TELLING}|\\b\\d{1,4}\\s?[a-zA-Z]?\\s*,\\s*${PC}\\b`, "g");
const POSTCODE_LOS = new RegExp(`\\b${PC}\\b`, "g");

export function filterPrivacy(invoer: string): PrivacyUitkomst {
  let tekst = invoer || "";
  const gevonden = new Set<PrivacySoort>();
  const vervang = (re: RegExp, soort: PrivacySoort, geldig: (m: string) => boolean = () => true) => {
    tekst = tekst.replace(re, (m) => {
      if (!geldig(m)) return m;
      gevonden.add(soort);
      return VERWIJDERD;
    });
  };

  // IBAN eerst: daarin kunnen 9 cijfers op rij staan.
  vervang(/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,3})?\b/gi, "iban", ibanGeldig);
  // BSN: 9 cijfers (ook als 123 456 782 of 1234.56.782) die de elfproef halen.
  vervang(/\b\d{3}[\s.]?\d{3}[\s.]?\d{3}\b|\b\d{4}[\s.]?\d{2}[\s.]?\d{3}\b/g, "bsn", (m) => elfproef(m.replace(/[\s.]/g, "")));
  // Documentnummer: 9 tekens, letters en cijfers door elkaar, alleen in een bericht over een document.
  if (OVER_DOCUMENT.test(tekst)) {
    vervang(/\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{8,9}\b/g, "document");
  }
  // Adres
  vervang(STRAAT, "adres");
  vervang(POSTCODE_NUMMER, "adres");
  vervang(POSTCODE_LOS, "adres");

  const rest = tekst.split(VERWIJDERD).join(" ").replace(/[\s,.:;!?-]+/g, " ").trim();
  const leeg = gevonden.size > 0 && !/[A-Za-zÀ-ÿ0-9]{2,}/.test(rest.replace(/\b(mijn|my|is|het|de|bsn|iban|nummer|number|adres|address|paspoort|passport|rekeningnummer|bank|account|hier|here|dit|this|en|and)\b/gi, ""));
  return { tekst, gevonden: Array.from(gevonden), leeg };
}

/** Wat Job terugzegt als er iets is weggefilterd (één zin, geen vraag). */
export function privacyMelding(taal: "nl" | "en"): string {
  return taal === "en"
    ? "Please don't send personal details like this in the chat; we'll collect them safely through the form later."
    : "Stuur zulke persoonlijke gegevens liever niet via de chat; die vragen we later veilig via het formulier.";
}
