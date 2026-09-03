/**
 * CONVERSIE-EVENTS NAAR GA4
 *
 * Waarom via gtag en niet via de dataLayer: de site laadt gtag.js rechtstreeks
 * in client/index.html (G-097EFEQ8YN) én een GTM-container (GTM-KV5BP52). Uit
 * een netwerkmeting op 3 september 2026 bleek dat alleen gtag hits verstuurt;
 * de GTM-container stuurt niets naar GA4. Een dataLayer.push zou dus nergens
 * aankomen. Verandert dat — bijvoorbeeld omdat Wrkt alsnog een GA4-tag in GTM
 * zet — dan is TRANSPORT hieronder het enige wat om moet.
 *
 * generate_lead staat NIET in dit bestand: die vuurt al op de bedankpagina
 * (client/src/pages/AanvraagOntvangen.tsx). Hem hier nog eens afvuren zou elke
 * personeelsaanvraag dubbel tellen.
 */

type Transport = "gtag" | "datalayer";

/** Zie de toelichting hierboven voordat je dit omzet. */
const TRANSPORT: Transport = "gtag";

type EventParams = Record<string, string | number | boolean | undefined>;

function stuurEvent(naam: string, params: EventParams): void {
  if (typeof window === "undefined") return;

  if (TRANSPORT === "datalayer") {
    const venster = window as any;
    if (!venster.dataLayer) venster.dataLayer = [];
    venster.dataLayer.push({ event: naam, ...params });
    return;
  }

  const gtag = (window as any).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", naam, params);
}

/**
 * Eén keer per paginalading. De aanmeldflow kan de afrondstap in theorie twee
 * keer raken (bijvoorbeeld na een mislukte CV-upload die opnieuw geprobeerd
 * wordt); dan mag er niet twee keer geteld worden.
 */
let aanmeldingGemeld = false;

/**
 * Kandidaat heeft de aanmelding afgerond.
 *
 * Afvuren op het moment dat de backend de aanmelding definitief heeft
 * opgeslagen (de PATCH met partial: false), niet bij het openen van het
 * formulier en niet op de afwijsroute.
 */
export function meldAanmelding(taal: "nl" | "en"): void {
  if (aanmeldingGemeld) return;
  aanmeldingGemeld = true;
  stuurEvent("sign_up", {
    method: "website",
    form_id: "aanmelden",
    language: taal,
  });
}

/** Alleen voor tests en verhalen waarin de flow opnieuw begint. */
export function resetMeting(): void {
  aanmeldingGemeld = false;
}
