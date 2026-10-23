/**
 * GOOGLE-REVIEWS — pure logica voor de koppeling met Google Business Profile
 *
 * Wat hier staat, raakt geen netwerk en geen database. Het netwerkdeel staat in
 * server/googleBusiness.ts; de tests in shared/googleReviews.test.ts.
 *
 * WAAROM DEZE KOPPELING
 * De score en het aantal reviews stonden met de hand in shared/reviews.ts. Dat
 * blijft het vangnet: lukt het ophalen bij Google niet, of is de koppeling nog
 * niet gemaakt, dan toont de site exact wat daar staat. Komt er wel een stand
 * van Google binnen, dan wint die.
 *
 * WELKE REVIEWS DE SITE TOONT
 * Google weet niet of een review van een medewerker of van een klant komt. Dat
 * bepaalt Max per review in het dashboard. Op de site komen alleen reviews die
 * als "medewerker" zijn gemarkeerd, met minimaal MIN_STERREN_PUBLIEK sterren en
 * een tekst (keuze van Max, 23-10-2026). De score en het totaal blijven wél
 * het volledige Google-gemiddelde, dus over alle reviews.
 *
 * REGELS VAN GOOGLE
 * Reviews worden ongewijzigd getoond, met de naam van de schrijver en de
 * vermelding dat ze van Google komen. Niet inkorten in de opslag, niet
 * herschrijven. Inkorten in beeld (met "lees meer") mag de site zelf doen.
 */
import { REVIEW_AANTAL, REVIEW_SCORE } from "./reviews";

export const CATEGORIEEN = ["onbekend", "medewerker", "klant", "verborgen"] as const;
export type Categorie = (typeof CATEGORIEEN)[number];

export function isCategorie(x: unknown): x is Categorie {
  return typeof x === "string" && (CATEGORIEEN as readonly string[]).includes(x);
}

/** Minimaal aantal sterren voor een review op de publieke site. */
export const MIN_STERREN_PUBLIEK = 4;

/** Hoeveel medewerkerreviews de site maximaal krijgt. */
export const MAX_PUBLIEK = 6;

/** Zo stuurt de Business Profile API (v4) een review terug. */
export interface GoogleReviewRuw {
  reviewId?: string;
  name?: string;
  reviewer?: { displayName?: string; profilePhotoUrl?: string; isAnonymous?: boolean };
  starRating?: string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewReply?: { comment?: string; updateTime?: string };
}

const STERREN: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

/** "FIVE" wordt 5. Onbekend of ontbrekend wordt null, nooit een gok. */
export function sterrenUitGoogle(waarde: unknown): number | null {
  if (typeof waarde !== "string") return null;
  return STERREN[waarde.toUpperCase()] ?? null;
}

/**
 * Google zet bij vertaalde reviews beide versies in één veld:
 *   "(Translated by Google) ...\n\n(Original)\n..."
 * De site toont de oorspronkelijke tekst, in de taal van de schrijver.
 */
export function oorspronkelijkeTekst(tekst: unknown): string {
  if (typeof tekst !== "string") return "";
  const marker = "(Original)";
  const i = tekst.indexOf(marker);
  if (i >= 0) return tekst.slice(i + marker.length).trim();
  return tekst.replace(/^\(Translated by Google\)\s*/, "").trim();
}

export interface ReviewRij {
  reviewId: string;
  auteur: string;
  auteurFoto: string | null;
  sterren: number | null;
  tekst: string;
  reactie: string | null;
  geplaatstOp: Date | null;
  bijgewerktOp: Date | null;
}

function datum(x: unknown): Date | null {
  if (typeof x !== "string") return null;
  const d = new Date(x);
  return isNaN(d.getTime()) ? null : d;
}

/** Zet een review van Google om naar een rij voor de database. Null als de review geen id heeft. */
export function naarRij(r: GoogleReviewRuw): ReviewRij | null {
  const id = r.reviewId || (typeof r.name === "string" ? r.name.split("/").pop() : undefined);
  if (!id) return null;
  const anoniem = r.reviewer?.isAnonymous === true;
  return {
    reviewId: id,
    auteur: anoniem ? "Anonieme Google-gebruiker" : (r.reviewer?.displayName || "Google-gebruiker").trim(),
    auteurFoto: anoniem ? null : r.reviewer?.profilePhotoUrl || null,
    sterren: sterrenUitGoogle(r.starRating),
    tekst: oorspronkelijkeTekst(r.comment),
    reactie: r.reviewReply?.comment ? oorspronkelijkeTekst(r.reviewReply.comment) : null,
    geplaatstOp: datum(r.createTime),
    bijgewerktOp: datum(r.updateTime),
  };
}

export interface OpgeslagenReview {
  auteur: string;
  auteurFoto: string | null;
  sterren: number | null;
  tekst: string;
  categorie: string;
  geplaatstOp: Date | string | null;
}

export interface PubliekeReview {
  naam: string;
  foto: string | null;
  sterren: number;
  tekst: string;
  datum: string | null;
}

function tijd(x: Date | string | null): number {
  if (!x) return 0;
  const t = new Date(x).getTime();
  return isNaN(t) ? 0 : t;
}

/** De reviews voor de tab Medewerkers: gemarkeerd, minimaal 4 sterren, met tekst, nieuwste eerst. */
export function selecteerMedewerkers(rijen: OpgeslagenReview[], max = MAX_PUBLIEK): PubliekeReview[] {
  return rijen
    .filter((r) => r.categorie === "medewerker")
    .filter((r) => typeof r.sterren === "number" && r.sterren >= MIN_STERREN_PUBLIEK)
    .filter((r) => r.tekst.trim().length > 0)
    .sort((a, b) => tijd(b.geplaatstOp) - tijd(a.geplaatstOp))
    .slice(0, max)
    .map((r) => ({
      naam: r.auteur,
      foto: r.auteurFoto,
      sterren: r.sterren as number,
      tekst: r.tekst,
      datum: r.geplaatstOp ? new Date(r.geplaatstOp).toISOString() : null,
    }));
}

export interface Stand {
  score: number;
  aantal: number;
  bron: "google" | "vast";
}

/**
 * De score en het aantal voor de site. Komt er een bruikbare stand van Google,
 * dan wint die; anders het vaste getal uit shared/reviews.ts.
 */
export function publiekeStand(google: { gemiddelde: number | null; totaal: number | null } | null): Stand {
  const g = google?.gemiddelde, n = google?.totaal;
  if (typeof g === "number" && typeof n === "number" && n > 0 && g >= 1 && g <= 5) {
    return { score: Math.round(g * 10) / 10, aantal: Math.round(n), bron: "google" };
  }
  return { score: REVIEW_SCORE, aantal: REVIEW_AANTAL, bron: "vast" };
}

/** "4,8" in het Nederlands, "4.8" in het Engels. */
export function scoreTekst(score: number, taal: "nl" | "en" = "nl"): string {
  const t = score.toFixed(1);
  return taal === "nl" ? t.replace(".", ",") : t;
}

export const GOOGLE_SCOPE = "https://www.googleapis.com/auth/business.manage";

/** De toestemmingspagina van Google. offline + consent: anders komt er geen refresh token. */
export function toestemmingsUrl(clientId: string, redirectUri: string, state: string): string {
  const p = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

/** Locatienaam uit de Business Information API ("locations/123") plus account ("accounts/9") naar het v4-pad. */
export function reviewsPad(account: string, locatie: string): string {
  const loc = locatie.startsWith("accounts/") ? locatie.split("/").slice(2).join("/") : locatie;
  return `${account}/${loc}/reviews`;
}
