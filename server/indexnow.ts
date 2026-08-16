/**
 * INDEXNOW — zoekmachines meteen vertellen dat er iets gewijzigd is.
 *
 * Waarom
 * ------
 * Een nieuw blogartikel of een nieuwe vacature moet nu wachten tot een crawler
 * langskomt. Bij een site van deze omvang is dat dagen tot weken. IndexNow
 * draait dat om: één HTTP-verzoek en de deelnemende zoekmachines weten het
 * binnen minuten. Ahrefs meldde 65 pagina's die "to submit to IndexNow" stonden
 * — dat is dit.
 *
 * Wie doet er mee
 * ---------------
 * Bing, Yandex, Seznam, Naver, Yep en Amazon. Eén melding wordt door alle
 * deelnemers gedeeld, dus één endpoint volstaat. **Google doet niet mee** — dat
 * is de eerlijke verwachting die hierbij hoort. Voor Google blijft de sitemap
 * plus Search Console het pad.
 *
 * Dat het geen Google is, maakt het niet nutteloos: Bing voedt ChatGPT's
 * zoekfunctie, en juist die LLM-zichtbaarheid was de reden om twee blogs per
 * week te gaan schrijven.
 *
 * Hoe de sleutel werkt
 * --------------------
 * IndexNow controleert of je de site bezit door een sleutelbestand op te vragen
 * dat op de site zelf staat: client/public/<sleutel>.txt, met de sleutel als
 * enige inhoud. Vandaar dat de sleutel hier gewoon in de code staat — hij is
 * per definitie openbaar. Kwaad kan dat niet: met deze sleutel kun je alleen
 * URL's van dit domein aanmelden.
 *
 * Wat dit bestand bewust NIET doet
 * --------------------------------
 * Falen. Een zoekmachine die er even uit ligt mag geen publicatie tegenhouden.
 * Alles wordt gelogd en weggeslikt; de aanroeper hoeft niet te wachten en niet
 * te controleren.
 */
import { SITE_ORIGIN } from "@shared/routeMeta";
import { TtlCache } from "./paginaCache";

/**
 * De sleutel. Staat óók als client/public/<sleutel>.txt in de repository —
 * die twee moeten gelijk blijven, anders geeft IndexNow een 403.
 *
 * Hexadecimaal, 32 tekens; de specificatie staat 8 tot 128 toe.
 */
export const INDEXNOW_SLEUTEL = "11e996a187c83370d897014b53032f96";

/** Het gedeelde endpoint dat de melding naar alle deelnemers doorzet. */
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** De specificatie staat maximaal 10.000 URL's per verzoek toe. */
export const MAX_PER_VERZOEK = 10_000;

/**
 * Dezelfde URL niet vaker dan eens per vijf minuten aanmelden.
 *
 * IndexNow adviseert dat expliciet, en het is hier geen theorie: het
 * beheerscherm slaat een artikel tijdens het redigeren meerdere keren op. Zonder
 * deze rem levert één redactiesessie tien meldingen van dezelfde URL op, met een
 * 429 (en een slechtere reputatie) als resultaat.
 */
export const HERHAALVENSTER_MS = 5 * 60 * 1000;

const recentGemeld = new TtlCache<boolean>({ ttlMs: HERHAALVENSTER_MS, max: 1000 });

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

/** De volledige URL van het sleutelbestand. */
export function sleutelLocatie(origin: string = SITE_ORIGIN): string {
  return `${origin}/${INDEXNOW_SLEUTEL}.txt`;
}

/**
 * Maakt van paden of volledige URL's een schone lijst absolute URL's.
 *
 * - een pad ("/blog/x") krijgt de origin ervoor;
 * - een volledige URL op een ánder domein verdwijnt: IndexNow geeft daar een
 *   422 op, en één foute URL laat het hele verzoek vallen;
 * - dubbelen verdwijnen, met behoud van volgorde;
 * - een #fragment gaat eraf (dat is geen aparte pagina) en een lege waarde ook.
 */
export function normaliseerUrls(invoer: string[], origin: string = SITE_ORIGIN): string[] {
  const uniek = new Set<string>();
  const uit: string[] = [];

  for (const ruw of invoer ?? []) {
    const waarde = String(ruw ?? "").trim();
    if (!waarde) continue;

    let url: string;
    if (waarde.startsWith("/")) url = origin + waarde;
    else if (waarde.startsWith(origin)) url = waarde;
    else continue; // ander domein of onbruikbare waarde

    url = url.split("#")[0];
    if (url.endsWith("/") && url !== origin + "/") url = url.slice(0, -1);
    if (uniek.has(url)) continue;

    uniek.add(url);
    uit.push(url);
  }

  return uit;
}

/** Verdeelt de lijst over verzoeken van maximaal MAX_PER_VERZOEK URL's. */
export function verdeel(urls: string[], max: number = MAX_PER_VERZOEK): string[][] {
  const uit: string[][] = [];
  for (let i = 0; i < urls.length; i += max) uit.push(urls.slice(i, i + max));
  return uit;
}

/** Bouwt de JSON die het endpoint verwacht. */
export function bouwPayload(urls: string[], origin: string = SITE_ORIGIN): IndexNowPayload {
  return {
    host: new URL(origin).host,
    key: INDEXNOW_SLEUTEL,
    keyLocation: sleutelLocatie(origin),
    urlList: urls,
  };
}

/**
 * Wat betekent de statuscode? Alleen om een bruikbare logregel te maken; de
 * aanroeper doet er niets mee.
 */
export function duidStatus(status: number): string {
  switch (status) {
    case 200: return "aangemeld";
    case 202: return "ontvangen, sleutel wordt nog gecontroleerd";
    case 400: return "verkeerd formaat";
    case 403: return "sleutel ongeldig of sleutelbestand niet gevonden";
    case 422: return "URL hoort niet bij dit domein";
    case 429: return "te veel verzoeken — even wachten";
    default:  return `onverwachte status ${status}`;
  }
}

export interface MeldOpties {
  /** Voor tests en voor het handmatige script: sla de productiecontrole over. */
  geforceerd?: boolean;
  /** Voor tests. */
  fetchImpl?: typeof fetch;
  /** Voor tests. */
  logger?: { log: (m: string) => void; warn: (m: string) => void };
  /** Negeer het herhaalvenster (bij een handmatige, bewuste bulkmelding). */
  negeerHerhaalvenster?: boolean;
}

export interface MeldResultaat {
  verzonden: string[];
  overgeslagen: string[];
  statussen: number[];
}

/**
 * Meldt één of meer gewijzigde URL's aan.
 *
 * Doet niets buiten productie: de ontwikkelomgeving draait op een andere
 * database met andere slugs, en die aanmelden zou onzin-URL's opleveren. Met
 * `geforceerd: true` kan het handmatige script er wél doorheen.
 *
 * Werpt nooit. Een mislukte melding is een logregel, geen fout.
 */
export async function meldAan(
  paden: string[],
  opties: MeldOpties = {}
): Promise<MeldResultaat> {
  const logger = opties.logger ?? console;
  const doeHet = opties.geforceerd || process.env.NODE_ENV === "production";
  const leeg: MeldResultaat = { verzonden: [], overgeslagen: [], statussen: [] };

  const urls = normaliseerUrls(paden);
  if (urls.length === 0) return leeg;

  if (process.env.INDEXNOW_UIT === "1") {
    logger.log(`[indexnow] uitgeschakeld via INDEXNOW_UIT — ${urls.length} URL(s) niet gemeld`);
    return { ...leeg, overgeslagen: urls };
  }
  if (!doeHet) {
    logger.log(`[indexnow] niet in productie — ${urls.length} URL(s) niet gemeld`);
    return { ...leeg, overgeslagen: urls };
  }

  const teMelden: string[] = [];
  const overgeslagen: string[] = [];
  for (const url of urls) {
    if (!opties.negeerHerhaalvenster && recentGemeld.get(url)) overgeslagen.push(url);
    else teMelden.push(url);
  }
  if (teMelden.length === 0) {
    logger.log(`[indexnow] alles al gemeld binnen ${HERHAALVENSTER_MS / 60000} minuten`);
    return { ...leeg, overgeslagen };
  }

  const doeVerzoek = opties.fetchImpl ?? fetch;
  const statussen: number[] = [];
  const verzonden: string[] = [];

  for (const groep of verdeel(teMelden)) {
    try {
      const antwoord = await doeVerzoek(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(bouwPayload(groep)),
      });
      statussen.push(antwoord.status);

      if (antwoord.status === 200 || antwoord.status === 202) {
        verzonden.push(...groep);
        for (const url of groep) recentGemeld.set(url, true);
        logger.log(`[indexnow] ${groep.length} URL(s) — ${duidStatus(antwoord.status)}`);
      } else {
        overgeslagen.push(...groep);
        logger.warn(`[indexnow] ${groep.length} URL(s) mislukt: ${duidStatus(antwoord.status)}`);
      }
    } catch (err: any) {
      overgeslagen.push(...groep);
      logger.warn(`[indexnow] verzoek mislukt: ${err?.message || err}`);
    }
  }

  return { verzonden, overgeslagen, statussen };
}

/** Alleen voor tests: het herhaalvenster leegmaken. */
export function vergeetHerhaalvenster(): void {
  recentGemeld.leeg();
}
