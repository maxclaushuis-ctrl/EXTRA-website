/**
 * GOOGLE BUSINESS PROFILE — netwerk en database
 *
 * Haalt de score, het aantal en alle reviews op bij Google en bewaart ze in
 * google_reviews. De pure logica (omzetten, selecteren, terugvallen op het
 * vaste getal) staat in shared/googleReviews.ts.
 *
 * NODIG IN DE SECRETS VAN REPLIT (zet Max zelf, nooit via de chat)
 *   GBP_CLIENT_ID      OAuth-client uit Google Cloud
 *   GBP_CLIENT_SECRET  idem
 * Zonder deze twee doet dit bestand niets en blijft de site het vaste getal
 * uit shared/reviews.ts tonen.
 *
 * De refresh token komt uit de callback van Google rechtstreeks in de tabel
 * google_koppeling. Hij staat nergens anders en gaat nooit terug naar de
 * browser.
 *
 * GOOGLE-API'S
 *   accounts   mybusinessaccountmanagement.googleapis.com/v1/accounts
 *   locaties   mybusinessbusinessinformation.googleapis.com/v1/{account}/locations
 *   reviews    mybusiness.googleapis.com/v4/{account}/{locatie}/reviews
 * Voor alle drie moet het Google Cloud-project toegang hebben gekregen tot de
 * Business Profile API's (aanvraag via Google). Zonder die toegang antwoordt
 * Google met een quotumfout; die komt dan als laatste_fout in het dashboard.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";
import { googleKoppeling, googleReviews } from "@shared/schema";
import { naarRij, reviewsPad, publiekeStand, selecteerMedewerkers, type GoogleReviewRuw } from "@shared/googleReviews";
import { REVIEW_AANTAL } from "@shared/reviews";

const KOPPELING_ID = 1;

export function gbpGeconfigureerd(): boolean {
  return !!(process.env.GBP_CLIENT_ID && process.env.GBP_CLIENT_SECRET);
}

async function googleJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const tekst = await res.text();
  let body: any = null;
  try { body = tekst ? JSON.parse(tekst) : null; } catch { body = tekst; }
  if (!res.ok) {
    const melding = body?.error?.message || body?.error_description || body?.error || `HTTP ${res.status}`;
    throw new Error(`Google ${res.status}: ${typeof melding === "string" ? melding : JSON.stringify(melding)}`);
  }
  return body;
}

/** Ruilt de code uit de callback in voor tokens. Geeft alleen de refresh token terug. */
export async function ruilCodeOm(code: string, redirectUri: string): Promise<string> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GBP_CLIENT_ID || "",
    client_secret: process.env.GBP_CLIENT_SECRET || "",
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const r = await googleJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r?.refresh_token) throw new Error("Google gaf geen refresh token terug. Trek de toegang in bij je Google-account en koppel opnieuw.");
  return r.refresh_token as string;
}

async function toegangsToken(refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: process.env.GBP_CLIENT_ID || "",
    client_secret: process.env.GBP_CLIENT_SECRET || "",
    grant_type: "refresh_token",
  });
  const r = await googleJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return r.access_token as string;
}

async function haalKoppeling() {
  const [rij] = await db.select().from(googleKoppeling).where(sql`${googleKoppeling.id} = ${KOPPELING_ID}`);
  return rij || null;
}

/** Slaat de nieuwe refresh token op (rij 1 aanmaken of bijwerken). */
export async function bewaarKoppeling(refreshToken: string, userId: number | undefined): Promise<void> {
  await db
    .insert(googleKoppeling)
    .values({ id: KOPPELING_ID, refreshToken, gekoppeldDoor: userId ?? null, gekoppeldOp: new Date(), laatsteFout: null })
    .onConflictDoUpdate({
      target: googleKoppeling.id,
      set: { refreshToken, gekoppeldDoor: userId ?? null, gekoppeldOp: new Date(), laatsteFout: null },
    });
}

/** Ontkoppelen: token leegmaken. Opgehaalde reviews en categorieën blijven staan. */
export async function ontkoppel(): Promise<void> {
  await db.update(googleKoppeling).set({ refreshToken: null }).where(sql`${googleKoppeling.id} = ${KOPPELING_ID}`);
}

async function zoekLocatie(token: string): Promise<{ account: string; locatie: string; naam: string }> {
  const headers = { Authorization: `Bearer ${token}` };
  const acc = await googleJson("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", { headers });
  const accounts: any[] = acc?.accounts || [];
  for (const a of accounts) {
    const loc = await googleJson(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${a.name}/locations?readMask=name,title&pageSize=100`,
      { headers },
    );
    const eerste = (loc?.locations || [])[0];
    if (eerste) return { account: a.name, locatie: eerste.name, naam: eerste.title || "" };
  }
  throw new Error("Geen bedrijfsprofiel gevonden onder dit Google-account. Log in met het account dat het profiel van EXTRA beheert.");
}

export interface SyncUitkomst {
  opgehaald: number;
  gemiddelde: number | null;
  totaal: number | null;
}

/** Haalt alles op bij Google en werkt de database bij. Gooit bij een fout, na het vastleggen ervan. */
export async function synchroniseerGoogleReviews(): Promise<SyncUitkomst> {
  if (!gbpGeconfigureerd()) throw new Error("GBP_CLIENT_ID en GBP_CLIENT_SECRET staan niet in de Secrets.");
  const k = await haalKoppeling();
  if (!k?.refreshToken) throw new Error("Nog niet gekoppeld met Google.");
  try {
    const token = await toegangsToken(k.refreshToken);
    let account = k.account, locatie = k.locatie, naam = k.locatieNaam;
    if (!account || !locatie) {
      const gevonden = await zoekLocatie(token);
      account = gevonden.account; locatie = gevonden.locatie; naam = gevonden.naam;
    }
    const pad = reviewsPad(account, locatie);
    let pageToken: string | undefined;
    let gemiddelde: number | null = null, totaal: number | null = null, opgehaald = 0;
    let rondes = 0;
    do {
      const qs = new URLSearchParams({ pageSize: "50" });
      if (pageToken) qs.set("pageToken", pageToken);
      const r = await googleJson(`https://mybusiness.googleapis.com/v4/${pad}?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (typeof r?.averageRating === "number") gemiddelde = r.averageRating;
      if (typeof r?.totalReviewCount === "number") totaal = r.totalReviewCount;
      for (const ruw of (r?.reviews || []) as GoogleReviewRuw[]) {
        const rij = naarRij(ruw);
        if (!rij) continue;
        // categorie wordt bewust niet overschreven: die is van Max.
        await db
          .insert(googleReviews)
          .values({ ...rij, opgehaaldOp: new Date() })
          .onConflictDoUpdate({
            target: googleReviews.reviewId,
            set: {
              auteur: rij.auteur, auteurFoto: rij.auteurFoto, sterren: rij.sterren, tekst: rij.tekst,
              reactie: rij.reactie, geplaatstOp: rij.geplaatstOp, bijgewerktOp: rij.bijgewerktOp, opgehaaldOp: new Date(),
            },
          });
        opgehaald++;
      }
      pageToken = r?.nextPageToken || undefined;
      rondes++;
    } while (pageToken && rondes < 40);

    await db
      .update(googleKoppeling)
      .set({ account, locatie, locatieNaam: naam, gemiddelde, totaal, laatsteSync: new Date(), laatsteFout: null })
      .where(sql`${googleKoppeling.id} = ${KOPPELING_ID}`);
    publiekCache = null;

    if (typeof totaal === "number" && totaal !== REVIEW_AANTAL) {
      console.log(
        `[google-reviews] Google telt ${totaal} reviews, shared/reviews.ts noemt ${REVIEW_AANTAL}. ` +
          `De site toont het getal van Google; werk REVIEW_AANTAL bij voor de geprerenderde pagina's.`,
      );
    }
    return { opgehaald, gemiddelde, totaal };
  } catch (err: any) {
    await db
      .update(googleKoppeling)
      .set({ laatsteFout: String(err?.message || err).slice(0, 500) })
      .where(sql`${googleKoppeling.id} = ${KOPPELING_ID}`)
      .catch(() => {});
    throw err;
  }
}

/** Status voor het dashboard. Bevat nooit de token zelf. */
export async function koppelingStatus() {
  const k = await haalKoppeling().catch(() => null);
  return {
    geconfigureerd: gbpGeconfigureerd(),
    gekoppeld: !!k?.refreshToken,
    locatieNaam: k?.locatieNaam || null,
    gemiddelde: k?.gemiddelde ?? null,
    totaal: k?.totaal ?? null,
    gekoppeldOp: k?.gekoppeldOp ?? null,
    laatsteSync: k?.laatsteSync ?? null,
    laatsteFout: k?.laatsteFout ?? null,
  };
}

let publiekCache: { tot: number; data: unknown } | null = null;

/** Wat de site krijgt: score, aantal en de gekozen medewerkerreviews. Tien minuten in het geheugen. */
export async function publiekeReviews() {
  if (publiekCache && publiekCache.tot > Date.now()) return publiekCache.data;
  let stand = publiekeStand(null);
  let medewerkers: ReturnType<typeof selecteerMedewerkers> = [];
  try {
    const k = await haalKoppeling();
    stand = publiekeStand(k ? { gemiddelde: k.gemiddelde, totaal: k.totaal } : null);
    const rijen = await db.select().from(googleReviews).where(sql`${googleReviews.categorie} = 'medewerker'`);
    medewerkers = selecteerMedewerkers(rijen);
  } catch (err: any) {
    // Tabel nog niet aangemaakt of database even weg: dan gewoon het vaste getal.
    console.warn("[google-reviews] publieke stand terugvallen op vast getal:", err?.message || err);
  }
  const data = { ...stand, medewerkers };
  publiekCache = { tot: Date.now() + 10 * 60 * 1000, data };
  return data;
}

export function wisPubliekeCache(): void {
  publiekCache = null;
}
