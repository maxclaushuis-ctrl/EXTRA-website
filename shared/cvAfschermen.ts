/**
 * Cv-tekst afschermen voordat hij naar de AI gaat (Job 3.0, fase 4).
 *
 * 1. Alleen de delen over werk en opleiding: werkervaring, opleiding,
 *    cursussen, certificaten en vaardigheden. Kop met naam en contact,
 *    personalia, profiel, hobby's en referenties vallen weg. Vindt de
 *    functie geen enkele kop, dan gaat de hele tekst door het filter.
 * 2. Daarna eruit: e-mail, telefoon, links, volledige datums (zoals een
 *    geboortedatum), de naam uit het dossier, postcode en adres, BSN, IBAN
 *    en documentnummers (via het privacyfilter van Job).
 * 3. Een tweede controle stopt alles als er nog iets van het dossier in staat.
 *
 * Puur en getest (shared/cvAfschermen.test.ts). Geen bestand, geen beeld:
 * alleen tekst.
 */
import { filterPrivacy } from "./jobPrivacy";

export interface CvDossier {
  voornaam?: string | null;
  achternaam?: string | null;
  email?: string | null;
  telefoon?: string | null;
  postcode?: string | null;
}

export interface Afgeschermd {
  tekst: string;
  ok: boolean;
  /** Waarom niet door: "leeg" of "controle" (er stond nog iets van het dossier in). */
  reden?: "leeg" | "controle";
  /** True als er koppen gevonden zijn en alleen die delen meegaan. */
  secties: boolean;
}

const HOUDEN = /^(werk\s?ervaring|ervaring|relevante ervaring|arbeidsverleden|loopbaan|werkgeschiedenis|banen|work experience|experience|employment(?: history)?|professional experience|work history|opleiding(?:en)?|scholing|education|cursussen|cursus|trainingen|training|courses|certificaten|certificaat|certificering(?:en)?|certificates|certifications|diploma'?s|vaardigheden|skills|competenties)\b/i;
const WEG = /^(persoonlijke gegevens|personalia|persoonsgegevens|contact(?:gegevens)?|profiel|over mij|persoonlijk profiel|hobby'?s|interesses|referenties|references|talen|languages|personal(?: details| information| profile)?|about me|profile|summary|samenvatting)\b/i;

const MAANDEN = "januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december|jan|feb|mrt|apr|jun|jul|aug|sep|sept|okt|nov|dec|january|february|march|may|june|july|october";

const GEEN_LETTER = new RegExp("[^\\p{L}\\s']", "gu");

function isKop(regel: string): boolean {
  const r = regel.trim().replace(/[:•\-–|]+$/g, "").trim();
  return r.length > 0 && r.length <= 40 && !/\d{4}/.test(r);
}

/** Alleen de delen over werk en opleiding. */
export function secties(tekst: string): { tekst: string; gevonden: boolean } {
  const regels = tekst.replace(/\r/g, "").split("\n");
  let houden = false, gevonden = false;
  const uit: string[] = [];
  for (const regel of regels) {
    const r = regel.trim();
    if (isKop(r) && HOUDEN.test(r.replace(GEEN_LETTER, " ").trim())) { houden = true; gevonden = true; uit.push(r); continue; }
    if (isKop(r) && WEG.test(r.replace(GEEN_LETTER, " ").trim())) { houden = false; continue; }
    if (houden) uit.push(regel);
  }
  return gevonden ? { tekst: uit.join("\n"), gevonden } : { tekst, gevonden: false };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cijfers = (s: string) => s.replace(/\D/g, "");

export function afschermen(invoer: string, d: CvDossier): Afgeschermd {
  const deel = secties(invoer || "");
  // Eerst BSN, IBAN, adres en documentnummers (het privacyfilter van Job), dan de rest.
  let t = filterPrivacy(deel.tekst).tekst;
  t = t.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[e-mail]");
  t = t.replace(/\b(https?:\/\/|www\.)\S+/gi, "[link]");
  t = t.replace(/\b(linkedin|instagram|facebook)\.com\S*/gi, "[link]");
  // Volledige datums (dag, maand en jaar), zoals een geboortedatum. Maand en jaar blijven staan.
  t = t.replace(/\b\d{1,2}[-/.]\d{1,2}[-/.](19|20)\d{2}\b/g, "[datum]");
  t = t.replace(new RegExp(`\\b\\d{1,2}\\s+(${MAANDEN})\\.?\\s+(19|20)\\d{2}\\b`, "gi"), "[datum]");
  // Telefoonnummers: negen cijfers of meer, met spaties, streepjes of een plus.
  t = t.replace(/(?:\+\d{1,3}[\s-]?(?:\(0\)\s?)?|(?<!\d)0)\d(?:[\s-]?\d){7,10}(?!\d)/g, "[telefoon]");
  // Naam uit het dossier
  const delen = [d.voornaam, ...(d.achternaam || "").split(/\s+/)].map((x) => (x || "").trim()).filter((x) => x.length >= 2 && !/^(van|de|der|den|het|ter|ten|la|le|da|di)$/i.test(x));
  for (const n of delen) t = t.replace(new RegExp(`(?<![\\p{L}])${escape(n)}(?![\\p{L}])`, "giu"), "[naam]");
  if (d.postcode) t = t.replace(new RegExp(escape(d.postcode.replace(/\s+/g, "")).replace(/(\d{4})/, "$1\\s?"), "gi"), "[postcode]");
  t = t.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, 8000);

  if (t.replace(/\[[^\]]+\]/g, "").replace(/\W/g, "").length < 20) return { tekst: "", ok: false, reden: "leeg", secties: deel.gevonden };
  // Tweede controle: staat er nog iets van het dossier in, dan gaat er niets naar de AI.
  const laag = t.toLowerCase();
  const tel = cijfers(d.telefoon || "");
  const mis = (d.email && laag.includes(d.email.toLowerCase()))
    || (tel.length >= 7 && cijfers(t).includes(tel.slice(-7)))
    || delen.some((n) => n.length >= 3 && new RegExp(`(?<![\\p{L}])${escape(n)}(?![\\p{L}])`, "iu").test(t));
  if (mis) return { tekst: "", ok: false, reden: "controle", secties: deel.gevonden };
  return { tekst: t, ok: true, secties: deel.gevonden };
}
