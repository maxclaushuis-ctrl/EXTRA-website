/**
 * Pitchdecks: welke presentaties er zijn en de pure logica van de tracker.
 *
 * Een deck staat op /pitchdeck/<naam>. Per ontvanger maak je in het dashboard
 * een link met een willekeurige code (?k=...). Bij het openen meldt de pagina
 * zich bij de server; daarna stuurt hij af en toe de kijktijd en de verste
 * slide door. De naam van de ontvanger staat alleen in de database, nooit in
 * de link. Er wordt geen IP-adres opgeslagen, alleen het soort apparaat.
 *
 * Bewust puur (geen server-imports), zodat `npm run pitchdecks:test` het onder
 * kale tsx kan draaien.
 */
import { AFZENDER_NAAM } from "./aanvraagMails";
import { escapeHtml, gegevens, alinea, knop, mailOpmaak } from "./mailOpmaak";

export type DeckKleur = "rose" | "pistachio" | "sky";
export interface Deck { naam: string; titel: string; kleur: DeckKleur }

export const PITCHDECKS: Deck[] = [
  { naam: "gofo", titel: "GOFO", kleur: "pistachio" },
  { naam: "dpd", titel: "DPD", kleur: "pistachio" },
  { naam: "eg", titel: "EG Group", kleur: "rose" },
  { naam: "vitam", titel: "Vitam", kleur: "rose" },
  { naam: "csu", titel: "CSU", kleur: "pistachio" },
  { naam: "action", titel: "Action", kleur: "pistachio" },
];

export const DECK_NAMEN = PITCHDECKS.map((d) => d.naam);

export function deckTitel(naam: string): string {
  return PITCHDECKS.find((d) => d.naam === naam)?.titel ?? naam;
}

export function isDeck(naam: unknown): naam is string {
  return typeof naam === "string" && DECK_NAMEN.includes(naam);
}

/** Een code is 10 tekens uit a-z en 0-9. Alles daarbuiten telt als "geen code". */
export function isCode(k: unknown): k is string {
  return typeof k === "string" && /^[a-z0-9]{10}$/.test(k);
}

/** Het soort apparaat uit de user-agent. Meer slaan we niet op. */
export function apparaatVan(ua: string | null | undefined): string {
  const u = ua || "";
  if (/iPad/i.test(u) || (/Macintosh/i.test(u) && /Mobile/i.test(u))) return "iPad";
  if (/iPhone/i.test(u)) return "iPhone";
  if (/Android/i.test(u)) return /Mobile/i.test(u) ? "Android-telefoon" : "Android-tablet";
  if (/Windows/i.test(u)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(u)) return "Mac";
  if (/Linux/i.test(u)) return "Linux";
  return "Onbekend";
}

const MAX_SEC = 6 * 60 * 60;
const MAX_SLIDES = 200;
const geheel = (x: unknown, max: number) => {
  const n = Math.floor(Number(x));
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
};

/** Een tussentijdse melding van de pagina, gecontroleerd en begrensd. */
export function leesPing(invoer: any): { id: number; sleutel: string; sec: number; slide: number } | null {
  const id = geheel(invoer?.id, 2_000_000_000);
  const sleutel = typeof invoer?.sleutel === "string" && /^[a-f0-9]{32}$/.test(invoer.sleutel) ? invoer.sleutel : null;
  if (!id || !sleutel) return null;
  return { id, sleutel, sec: geheel(invoer?.sec, MAX_SEC), slide: geheel(invoer?.slide, MAX_SLIDES) };
}

export function leesAantalSlides(x: unknown): number {
  return geheel(x, MAX_SLIDES);
}

export type LeesStatus = "helemaal" | "deels" | "niet";

/** Helemaal gelezen = de laatste slide is in beeld geweest. */
export function leesStatus(maxSlide: number, aantalSlides: number, keer: number): LeesStatus {
  if (!keer) return "niet";
  if (aantalSlides > 0 && maxSlide >= aantalSlides) return "helemaal";
  return "deels";
}

/** Kijktijd als m:ss. */
export function kijktijd(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Geen nieuwe mail als dezelfde link binnen dit aantal minuten al gemeld is. */
export const MAIL_RUST_MINUTEN = 30;

export function moetMailen(vorigeOpening: Date | null, nu: Date = new Date()): boolean {
  if (!vorigeOpening) return true;
  return nu.getTime() - vorigeOpening.getTime() > MAIL_RUST_MINUTEN * 60_000;
}

export interface OpeningVoorMail {
  deck: string;
  ontvanger: string | null;
  bedrijf: string | null;
  apparaat: string;
  geopendOp: Date;
  keer: number;
}

function wanneer(d: Date): string {
  return d.toLocaleString("nl-NL", {
    timeZone: "Europe/Amsterdam", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  }).replace(" om ", ", ");
}

/** Mail aan kantoor: iemand opent nu een pitchdeck. */
export function pitchdeckGeopendMail(o: OpeningVoorMail, dashboardUrl: string): { subject: string; html: string; text: string } {
  const deck = deckTitel(o.deck);
  const wie = o.ontvanger ? o.ontvanger : "Iemand zonder persoonlijke link";
  const bij = o.ontvanger && o.bedrijf ? ` (${o.bedrijf})` : "";
  const keer = o.keer > 1 ? `${o.keer}e keer` : "1e keer";
  const subject = o.ontvanger ? `${o.ontvanger} opent nu de pitchdeck van ${deck}` : `De pitchdeck van ${deck} wordt nu bekeken`;
  const html = mailOpmaak({
    titel: subject,
    voorkop: "Pitchdeck geopend",
    kop: o.ontvanger ? `${escapeHtml(o.ontvanger)} kijkt nu naar je pitchdeck` : `De pitchdeck van ${escapeHtml(deck)} wordt bekeken`,
    preheader: `${wie}${bij}, ${wanneer(o.geopendOp)}`,
    voet: "kort",
    inhoud: [
      alinea(o.ontvanger
        ? `De pitchdeck van ${escapeHtml(deck)} is net geopend via de link van ${escapeHtml(o.ontvanger)}${escapeHtml(bij)}. Goed moment om straks even te bellen.`
        : `De pitchdeck van ${escapeHtml(deck)} is net geopend via de algemene link, zonder persoonlijke code.`),
      gegevens([
        ["Deck", escapeHtml(deck)],
        ["Geopend", escapeHtml(wanneer(o.geopendOp))],
        ["Apparaat", escapeHtml(o.apparaat)],
        ["Keer geopend", escapeHtml(keer)],
      ]),
      knop("Bekijk in het dashboard", dashboardUrl),
    ].join(""),
  });
  const text = `${subject}\n\nDeck: ${deck}\nGeopend: ${wanneer(o.geopendOp)}\nApparaat: ${o.apparaat}\nKeer geopend: ${keer}\n\n${dashboardUrl}\n\n${AFZENDER_NAAM}`;
  return { subject, html, text };
}
