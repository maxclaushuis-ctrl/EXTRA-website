/**
 * Kapotte links naar vacatures en blogartikelen voorkomen.
 *
 * Achtergrond: een vacature is 90 dagen na publicatie verlopen (server/seo.ts
 * geeft dan een 404, zodat Google geen verouderd JobPosting-schema ziet).
 * Maar de sitemap, de vacaturelijst en de vaste vacaturekaarten op de
 * design-3.0-pagina's linkten er gewoon naar door. En een blogartikel dat in
 * de code staat maar (nog) niet in de productiedatabase, gaf hetzelfde beeld.
 *
 * Deze module bepaalt wat "levend" is en buigt links naar iets dat niet
 * (meer) bestaat om naar het overzicht, in plaats van naar een 404.
 * Er wordt niets verwijderd: de inhoud blijft staan, alleen de link gaat
 * naar een pagina die wel werkt.
 */

import { veiligeJsonLd } from "./jsonLd";

export const VACATURE_GELDIG_DAGEN = 90;

type MetDatum = { publishedAt?: Date | string | null; createdAt?: Date | string | null };

export function vacatureGeldigTot(v: MetDatum): Date {
  const basis = new Date(v.publishedAt || v.createdAt || Date.now());
  basis.setDate(basis.getDate() + VACATURE_GELDIG_DAGEN);
  return basis;
}

export function vacatureVerlopen(v: MetDatum, nu: Date = new Date()): boolean {
  return vacatureGeldigTot(v) < nu;
}

/** Alleen de vacatures die nog geldig zijn. */
export function lopendeVacatures<T extends MetDatum>(lijst: T[], nu: Date = new Date()): T[] {
  return lijst.filter((v) => !vacatureVerlopen(v, nu));
}

export type LevendeSlugs = { vacatures: Set<string> | null; blogs: Set<string> | null };

const DOMEIN = "(?:https?://(?:www\\.)?doehetextra\\.nl)?";
const LINK = new RegExp(`href="(${DOMEIN})/(vacatures|blog|nieuws)/([a-z0-9-]+)/?(#[^"]*)?"`, "gi");

/**
 * Buigt in een stuk HTML elke link naar een niet-bestaande vacature of een
 * niet-bestaand artikel om naar het overzicht (/vacatures of /blog).
 * Is een lijst onbekend (null, bijvoorbeeld bij een databasestoring), dan
 * blijven die links ongemoeid: liever niets doen dan alles ombuigen.
 */
export function buigDodeLinksOm(html: string, levend: LevendeSlugs): string {
  return dunItemListsUit(html, levend).replace(LINK, (heel, domein: string, soort: string, slug: string) => {
    const set = soort.toLowerCase() === "vacatures" ? levend.vacatures : levend.blogs;
    if (!set || set.has(slug.toLowerCase())) return heel;
    return `href="${domein}/${soort.toLowerCase() === "vacatures" ? "vacatures" : "blog"}"`;
  });
}

/** Zelfde regel voor één pad, voor gebruik op losse <a>-elementen in de browser. */
export function levendPad(pad: string, levend: LevendeSlugs): string {
  const m = pad.match(/^\/(vacatures|blog|nieuws)\/([a-z0-9-]+)\/?(#.*)?$/i);
  if (!m) return pad;
  const set = m[1].toLowerCase() === "vacatures" ? levend.vacatures : levend.blogs;
  if (!set || set.has(m[2].toLowerCase())) return pad;
  return m[1].toLowerCase() === "vacatures" ? "/vacatures" : "/blog";
}

const JSONLD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

/**
 * Een ItemList in structured data (zoals op /vacatures) noemt elke vacature
 * met haar URL. Verlopen of onbekende items gaan eruit en de posities worden
 * opnieuw genummerd, zodat Google geen lijst met 404's krijgt.
 */
function dunItemListsUit(html: string, levend: LevendeSlugs): string {
  return html.replace(JSONLD, (heel, inhoud: string) => {
    let data: any;
    try { data = JSON.parse(inhoud); } catch { return heel; }
    if (!data || data["@type"] !== "ItemList" || !Array.isArray(data.itemListElement)) return heel;
    const voor = data.itemListElement.length;
    data.itemListElement = data.itemListElement.filter((it: any) => {
      const pad = typeof it?.url === "string" ? it.url.replace(/^https?:\/\/(www\.)?doehetextra\.nl/i, "") : "";
      return !pad || levendPad(pad, levend) === pad;
    });
    if (data.itemListElement.length === voor) return heel;
    data.itemListElement.forEach((it: any, i: number) => { it.position = i + 1; });
    return `<script type="application/ld+json">${veiligeJsonLd(data)}</script>`;
  });
}
