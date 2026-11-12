/**
 * Het beginscherm van het sollicitatiegesprek (formulier versie 2, design 3.0).
 *
 * Doel: in een paar seconden scannen wie er tegenover je zit. Bovenaan wie het is en
 * wanneer het gesprek is, dan vier kerncijfers, dan hooguit twee punten om eerst te
 * bespreken (elk één keer, met een vaste vraag waar die er is), en pas daaronder de
 * details en de werkervaring uit het cv als tijdlijn.
 *
 * Bewust puur: alles hier komt uit gegevens die er al zijn (Voortraject en
 * Voorbereiding uit shared/intakeV2.ts). Er wordt niets verzonnen: onbekend blijft
 * "Nog niet bekend", een vraag staat er alleen als er een vaste zin voor is, en de
 * duur per baan staat er alleen als de datums dat toelaten.
 */
import type { Bron, Voortraject, Voorbereiding, Bekend } from "./intakeV2";

export interface Tegel { label: string; hoofd: string; sub: string; bron: Bron | null }
export type PuntSoort = "tegen" | "onbekend" | "vraag" | "let";
export interface Punt { soort: PuntSoort; label: string; titel: string; tekst: string; vraag: string | null }
export interface TijdRegel { functie: string; werkgever: string | null; periode: string; duur: string; nu: boolean }
export interface Feit extends Bekend { citaat: boolean }

const DIENSTEN_KORT: Record<string, string> = { "1-2": "1 tot 2 diensten", "3-4": "3 tot 4 diensten", "5+": "5+ diensten" };
const WERKMOMENT: Record<string, string> = { doordeweeks: "Doordeweeks", avond_weekend: "Avond en weekend", flexibel: "Flexibel" };
const WERKVORM: Record<string, string> = { studie: "naast de studie", ander_werk: "naast een andere baan", hoofdbaan: "als hoofdbaan" };
const START: Record<string, string> = { direct: "Direct", twee_weken: "Binnen twee weken", later: "Later" };

const tekst = (x: unknown) => (typeof x === "string" ? x.trim() : "");
const kort = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t);
const hoofdletter = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/** Vier kerncijfers: ervaring, gewenste inzet, kan beginnen, werkgebied. */
export function tegels(v: Voortraject): Tegel[] {
  const j = v.job || {};
  const uit: Tegel[] = [];

  // Ervaring: het cv met datums gaat voor, dan wat de kandidaat aan Job vertelde.
  const cvUitleg = v.cv.status === "gelezen" ? tekst(v.cv.uitleg) : "";
  const m = /^(.+?) ervaring in de functie/.exec(cvUitleg);
  const jobErv = tekst(j.ervaring);
  const duurJob = /(\d+(?:[.,]\d+)?(?:\s*(?:tot|à|-)\s*\d+)?\s*(?:jaar|maanden|maand))/i.exec(jobErv);
  if (m) uit.push({ label: "Ervaring", hoofd: hoofdletter(m[1]), sub: "In de functie, volgens het cv", bron: "cv" });
  else if (/^Geen ervaring/i.test(cvUitleg)) uit.push({ label: "Ervaring", hoofd: "Geen", sub: "In deze functie, volgens het cv", bron: "cv" });
  else if (duurJob) uit.push({ label: "Ervaring", hoofd: hoofdletter(duurJob[1]), sub: kort(jobErv, 60), bron: "job" });
  else if (jobErv) uit.push({ label: "Ervaring", hoofd: "Zie hieronder", sub: kort(jobErv, 60), bron: "job" });
  else uit.push({ label: "Ervaring", hoofd: "Nog niet bekend", sub: "Vraag het in het gesprek", bron: null });

  // Gewenste inzet
  const d = DIENSTEN_KORT[String(j.diensten ?? "")];
  const inzetSub = [WERKMOMENT[String(j.werkmoment ?? "")], WERKVORM[String(j.werkvorm ?? "")]].filter(Boolean).join(", ");
  if (d) uit.push({ label: "Gewenste inzet", hoofd: d, sub: hoofdletter(inzetSub) || "Per week", bron: "job" });
  else if (inzetSub) uit.push({ label: "Gewenste inzet", hoofd: hoofdletter(inzetSub.split(",")[0]), sub: "Aantal diensten nog niet bekend", bron: "job" });
  else if (tekst(v.formulier.beschikbaarheid)) uit.push({ label: "Gewenste inzet", hoofd: "Zie aanmelding", sub: kort(tekst(v.formulier.beschikbaarheid), 60), bron: "formulier" });
  else uit.push({ label: "Gewenste inzet", hoofd: "Nog niet bekend", sub: "Vraag het in het gesprek", bron: null });

  // Kan beginnen
  const s = START[String(j.startdatum ?? "")] || tekst(j.startdatum);
  uit.push(s ? { label: "Kan beginnen", hoofd: hoofdletter(s), sub: "Volgens Job", bron: "job" } : { label: "Kan beginnen", hoofd: "Nog niet bekend", sub: "Vraag het in het gesprek", bron: null });

  // Werkgebied
  const gebied = tekst(j.werkgebied);
  const km = /tot (\d{1,3}) ?km/i.exec(gebied);
  const vervoer = tekst(j.vervoer);
  if (km || gebied) uit.push({ label: "Werkgebied", hoofd: km ? `Tot ${km[1]} km` : kort(hoofdletter(gebied), 22), sub: vervoer ? hoofdletter(kort(vervoer, 50)) : "Vervoer nog onbekend", bron: "job" });
  else uit.push({ label: "Werkgebied", hoofd: "Nog niet bekend", sub: vervoer ? hoofdletter(kort(vervoer, 50)) : "Vraag het in het gesprek", bron: vervoer ? "job" : null });
  return uit;
}

/** Vaste vragen per onderwerp. Geen passende zin: dan geen vraag. */
const VRAAG: [RegExp, string][] = [
  [/\btalen?\b/i, "Welke talen spreek je, en hoe goed?"],
  [/\bervaring|werkzaamheden|functievraag/i, "Waar heb je gewerkt, hoe lang, en wat deed je daar precies?"],
  [/\binzet|diensten|werkmoment|werkvorm/i, "Hoeveel diensten per week wil je werken, en op welke momenten?"],
  [/\bwerkgebied|vervoer|reis/i, "Waar woon je, en hoe kom je naar je werk?"],
  [/\bstartdatum|kan beginnen|beginnen\b/i, "Wanneer kun je beginnen?"],
  [/\bhotels?|sterren/i, "In welke hotels heb je gewerkt, en wat deed je daar?"],
];
export function vasteVraag(onderwerp: string): string | null {
  for (const [r, v] of VRAAG) if (r.test(onderwerp)) return v;
  return null;
}

/** De punten om eerst te bespreken: hooguit twee, elk één keer, met een label en waar mogelijk een vaste vraag. */
export function punten(vb: Voorbereiding): Punt[] {
  const uit: Punt[] = [];
  const gezien = new Set<string>();
  for (const p of vb.bespreekpunten) {
    if (gezien.has(p)) continue;
    gezien.add(p);
    if (vb.tegenstrijdig.includes(p)) {
      const [titel, ...rest] = p.split(": ");
      const t = rest.join(": ").replace(/\s*Vraag het bij de kennismaking\.?\s*$/i, "").trim();
      uit.push({ soort: "tegen", label: "Spreekt elkaar tegen", titel: rest.length ? titel : "Gegevens verschillen", tekst: rest.length ? t : p, vraag: vasteVraag(p) });
    } else if (/^Vraag van de kandidaat:?/i.test(p)) {
      uit.push({ soort: "vraag", label: "Vraag van de kandidaat", titel: hoofdletter(p.replace(/^Vraag van de kandidaat:?\s*/i, "")), tekst: "Neem dit mee in het gesprek.", vraag: null });
    } else if (/ is nog niet bekend$/i.test(p)) {
      const o = p.replace(/ is nog niet bekend$/i, "");
      uit.push({ soort: "onbekend", label: "Nog onbekend", titel: o, tekst: "Onbekend is geen nee.", vraag: vasteVraag(o) });
    } else if (/^Bij Job onduidelijk gebleven:?/i.test(p)) {
      const o = p.replace(/^Bij Job onduidelijk gebleven:?\s*/i, "");
      uit.push({ soort: "onbekend", label: "Nog onbekend", titel: hoofdletter(o), tekst: "Bij Job onduidelijk gebleven.", vraag: vasteVraag(o) });
    } else {
      uit.push({ soort: "let", label: "Let op", titel: p, tekst: "", vraag: vasteVraag(p) });
    }
  }
  return uit.slice(0, 2);
}

/** Wat we al weten. Letterlijke antwoorden van Job staan als citaat. */
export function feiten(vb: Voorbereiding): Feit[] {
  return vb.bekend.map((b) => ({ ...b, citaat: b.bron === "job" && ["Ervaring", "Werkzaamheden", "Hotels"].includes(b.label) }));
}

/** "YYYY-MM", "YYYY" of "heden" naar een maandnummer; null als onbekend. */
function maand(s: string | null | undefined, peil: Date, eindVanJaar: boolean): number | null {
  if (!s) return null;
  if (s === "heden") return peil.getUTCFullYear() * 12 + peil.getUTCMonth();
  const m = /^(\d{4})(?:-(\d{2}))?$/.exec(s.trim());
  if (!m) return null;
  return Number(m[1]) * 12 + (m[2] ? Number(m[2]) - 1 : eindVanJaar ? 11 : 0);
}

/** Duur van een baan: "2 mnd", "1 jaar", "1,5 jaar". Leeg als de datums dat niet toelaten. */
export function duur(begin: string | null | undefined, einde: string | null | undefined, peil: Date): string {
  const b = maand(begin, peil, false);
  const e = maand(einde, peil, true);
  if (b === null || e === null || e < b) return "";
  const n = e - b + 1;
  if (n < 12) return `${n} mnd`;
  const jaar = Math.floor(n / 6) / 2; // naar beneden op halve jaren: liever iets te weinig dan te veel
  return `${String(jaar).replace(".", ",")} jaar`;
}

const jaarVan = (s: string | null | undefined) => (s && /^\d{4}/.test(s) ? s.slice(0, 4) : "");

/** De werkervaring uit het cv, nieuwste eerst, hooguit zes regels. */
export function tijdlijn(v: Voortraject, peil: Date = new Date()): TijdRegel[] {
  const sleutel = (p: { einde?: string | null; begin?: string | null }) => (p.einde === "heden" ? "9999" : p.einde || p.begin || "");
  return [...v.cv.periodes]
    .sort((a, b) => String(sleutel(b)).localeCompare(String(sleutel(a))))
    .slice(0, 6)
    .map((p) => {
      const nu = p.einde === "heden";
      const b = jaarVan(p.begin), e = jaarVan(p.einde);
      const periode = nu ? (b ? `sinds ${b}` : "nu") : b && e ? (b === e ? b : `${b} tot ${e}`) : b || e || "";
      return { functie: p.functie, werkgever: p.werkgever || null, periode, duur: nu ? "nu" : duur(p.begin, p.einde, peil), nu };
    });
}

/** "vandaag 15:00", "morgen 10:30" of "wo 12 nov, 15:00". Leeg zonder datum. */
export function gespreksmoment(datum: string | null | undefined, tijd: string | null | undefined, nu: Date = new Date()): string {
  if (!datum || !/^\d{4}-\d{2}-\d{2}/.test(datum)) return "";
  const t = tijd && /^\d{2}:\d{2}/.test(tijd) ? tijd.slice(0, 5) : "";
  const vandaag = new Date(Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate()));
  const d = new Date(`${datum.slice(0, 10)}T00:00:00Z`);
  const verschil = Math.round((d.getTime() - vandaag.getTime()) / 864e5);
  const dag = verschil === 0 ? "vandaag" : verschil === 1 ? "morgen" : verschil === -1 ? "gisteren"
    : d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).replace(".", "");
  return [dag, t].filter(Boolean).join(verschil >= -1 && verschil <= 1 ? " " : ", ");
}

/** Twee letters voor het rondje: eerste letter van voornaam en achternaam. */
export function initialen(naam: string): string {
  const w = (naam || "").trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "?";
  return ((w[0][0] || "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
}
