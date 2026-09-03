/**
 * HERKOMST VASTLEGGEN — de browserkant
 *
 * Bij het eerste bezoek leggen we vast waar iemand vandaan kwam en bewaren dat
 * in localStorage. Bij een aanmelding of personeelsaanvraag gaat het mee naar
 * de backend, zodat in het CRM te zien is welk kanaal een kandidaat of lead
 * opleverde.
 *
 * Eén keer schrijven, daarna nooit overschrijven: iemand die via ChatGPT
 * binnenkomt, twee dagen later direct terugkomt en dán pas het formulier
 * invult, hoort bij ChatGPT te blijven horen. Anders krijgt "(direct)" de eer
 * voor alles wat de andere kanalen hebben gebracht.
 *
 * Het rekenwerk staat in shared/herkomst.ts en is daar getest. Hier staat
 * alleen wat een browser nodig heeft.
 */

import {
  bepaalHerkomst,
  isGeldigeHerkomst,
  leesGaClientId,
  type Herkomst,
} from "@shared/herkomst";

export const OPSLAG_SLEUTEL = "extra_attribution";

/** Privémodus of geblokkeerde opslag mag nooit de site slopen. */
function veiligLezen(sleutel: string): string | null {
  try {
    return window.localStorage.getItem(sleutel);
  } catch {
    return null;
  }
}

function veiligSchrijven(sleutel: string, waarde: string): void {
  try {
    window.localStorage.setItem(sleutel, waarde);
  } catch {
    /* Geen opslag beschikbaar. De site werkt door, de herkomst gaat verloren. */
  }
}

/**
 * Legt de herkomst vast als dat nog niet gebeurd is.
 * Aanroepen bij het opstarten van de app, vóór de eerste navigatie.
 */
export function bewaarHerkomstEenmalig(): void {
  if (typeof window === "undefined") return;

  const bestaand = leesRuweHerkomst();
  if (bestaand) {
    // Het _ga-cookie bestaat pas nadat gtag geladen is. Stond het er bij het
    // eerste bezoek nog niet, dan vullen we het alsnog aan — de rest blijft.
    if (!bestaand.ga_client_id) {
      const clientId = leesGaClientId(document.cookie);
      if (clientId) {
        veiligSchrijven(OPSLAG_SLEUTEL, JSON.stringify({ ...bestaand, ga_client_id: clientId }));
      }
    }
    return;
  }

  const herkomst = bepaalHerkomst({
    zoekstring: window.location.search,
    verwijzer: document.referrer,
    pad: window.location.pathname,
    cookieTekst: document.cookie,
    eigenHost: window.location.hostname,
  });
  veiligSchrijven(OPSLAG_SLEUTEL, JSON.stringify(herkomst));
}

function leesRuweHerkomst(): Herkomst | null {
  const opgeslagen = veiligLezen(OPSLAG_SLEUTEL);
  if (!opgeslagen) return null;
  try {
    const ontleed = JSON.parse(opgeslagen);
    return isGeldigeHerkomst(ontleed) ? ontleed : null;
  } catch {
    return null;
  }
}

/**
 * De herkomst zoals die met een formulier meegestuurd wordt.
 *
 * Het ga_client_id wordt hier vers gelezen: staat het cookie er inmiddels wel,
 * dan gebruiken we dat. Zonder dat id is een aanmelding in het CRM niet aan een
 * sessie in Analytics te koppelen.
 *
 * Is er niets vastgelegd (opslag geblokkeerd, cookie gewist), dan komt er een
 * herkomst terug die eerlijk zegt dat we het niet weten in plaats van niets.
 */
export function herkomstVoorFormulier(): Herkomst {
  const bewaard = leesRuweHerkomst();
  const versClientId =
    typeof document !== "undefined" ? leesGaClientId(document.cookie) : null;

  if (bewaard) {
    return { ...bewaard, ga_client_id: bewaard.ga_client_id || versClientId };
  }

  return {
    source: "(unknown)",
    medium: "(unknown)",
    landing_page: typeof window !== "undefined" ? window.location.pathname : "",
    gclid: null,
    ga_client_id: versClientId,
  };
}
