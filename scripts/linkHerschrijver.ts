/**
 * LINKS IN REDACTIONELE HTML BEOORDELEN EN HERSCHRIJVEN.
 *
 * De pure helft van scripts/content-links.ts: geen database, geen drizzle, geen
 * netwerk — alleen strings in, strings uit. Daardoor is dit deel te testen met
 * `npx tsx scripts/linkHerschrijver.test.ts`, terwijl content-links.ts zelf een
 * databaseverbinding nodig heeft.
 *
 * De routekennis komt uit scripts/routeKennis.ts, dezelfde bron die de
 * build-check op client/src gebruikt. Eén definitie van "welke paden bestaan er",
 * of het nu om een href in een component gaat of om een href in een blogartikel.
 */
import { isKnownRoute, eindbestemming, normalize } from './routeKennis';
import { resolveRedirect } from '../server/redirects';

/** Beide eigen origins; een link met volledige URL telt net zo goed mee. */
export const EIGEN_ORIGINS = ['https://www.doehetextra.nl', 'https://doehetextra.nl'];

/** Wat dit script bewust niet nakijkt (extern, mail, telefoon, puur anker). */
const OVERSLAAN = ['http://', 'https://', 'mailto:', 'tel:', '//', '#'];

const HREF = /href\s*=\s*["']([^"']+)["']/g;

/**
 * De slugs die daadwerkelijk in de database staan.
 *
 * Zonder deze lijst is elke /blog/<wat-dan-ook> een "bekende route": App.tsx
 * kent alleen het patroon /blog/:slug en dat matcht ook een artikel dat allang
 * verwijderd is. Met de lijst erbij wordt een link naar een niet-bestaand
 * artikel wél als kapot herkend — precies het soort link dat Ahrefs vindt en
 * een build-check op de code nooit kan vinden.
 */
export interface SlugKennis {
  blog: Set<string>;
  vacature: Set<string>;
}

export interface Vondst {
  /** De href precies zoals hij in de HTML staat — nodig om exact te vervangen. */
  ruw: string;
  /** Het padgedeelte: zonder origin, zonder #fragment, zonder ?query. */
  pad: string;
  soort: 'ok' | 'omweg' | 'kapot';
  /** Waar het heen moet (alleen bij 'omweg'). */
  doel?: string;
}

/** Haalt het padgedeelte uit een href (of null als het geen intern pad is). */
export function padVan(ruw: string): string | null {
  let rest = String(ruw ?? '').trim();

  const origin = EIGEN_ORIGINS.find((o) => rest.toLowerCase().startsWith(o));
  if (origin) rest = rest.slice(origin.length) || '/';
  else if (OVERSLAAN.some((p) => rest.toLowerCase().startsWith(p))) return null;

  if (!rest.startsWith('/')) return null;

  const pad = rest.split('#')[0].split('?')[0];
  return pad === '' ? null : pad;
}

/** Bestaat dit artikel of deze vacature nog? null = geen artikel-/vacaturepad. */
function slugBestaat(pad: string, kennis?: SlugKennis): boolean | null {
  if (!kennis) return null;
  const m = normalize(pad).match(/^\/(blog|nieuws|vacatures)\/([^/]+)$/);
  if (!m) return null;
  const set = m[1] === 'vacatures' ? kennis.vacature : kennis.blog;
  return set.has(m[2]);
}

/**
 * Beoordeelt één href.
 *
 * Volgorde is belangrijk. Een expliciete 301 gaat vóór de routepatronen uit
 * App.tsx: /blog/<oude-slug> matcht het patroon /blog/:slug en zou daarmee als
 * "bestaat" gelden, terwijl er juist een redirect voor is aangelegd omdat de
 * slug hernoemd is. Eerst redirect, dan bestaan.
 *
 * De root "/" wordt overgeslagen: die bestaat altijd en levert alleen ruis op.
 * Externe links, mailto/tel en pure ankers vallen buiten scope — die kan dit
 * script niet nakijken zonder het net op te gaan, en dat is bewust niet wat het
 * doet (zelfde afweging als in check-internal-links.ts: deterministisch, geen
 * browser, veilig in een build).
 */
export function beoordeelHref(ruw: string, kennis?: SlugKennis): Vondst | null {
  const pad = padVan(ruw);
  if (pad === null || pad === '/') return null;

  if (resolveRedirect(normalize(pad))) {
    return { ruw, pad, soort: 'omweg', doel: eindbestemming(pad) };
  }

  const bestaat = slugBestaat(pad, kennis);
  if (bestaat !== null) return { ruw, pad, soort: bestaat ? 'ok' : 'kapot' };

  return { ruw, pad, soort: isKnownRoute(pad) ? 'ok' : 'kapot' };
}

/** Alle href's in een stuk HTML, ontdubbeld op de ruwe waarde. */
export function vondsten(html: string, kennis?: SlugKennis): Vondst[] {
  const uniek = new Map<string, Vondst>();
  for (const m of String(html ?? '').matchAll(HREF)) {
    const v = beoordeelHref(m[1], kennis);
    if (v && !uniek.has(v.ruw)) uniek.set(v.ruw, v);
  }
  return [...uniek.values()];
}

/**
 * Vervangt in de HTML het padgedeelte van één href door de eindbestemming.
 *
 * Alleen binnen `href="…"` — zodat een pad dat toevallig ook in de lopende tekst
 * staat ("ga naar /werkgevers") niet stilletjes meeverandert. Query en #fragment
 * blijven behouden, en de origin ook: of een link absoluut of relatief is
 * geschreven is een redactionele keuze die dit script niet hoort te overrulen.
 *
 * Split/join in plaats van een regex, omdat een href tekens kan bevatten die in
 * een regex een betekenis hebben (haakjes, plus, punt) en hier letterlijk zijn.
 */
export function herschrijf(html: string, ruw: string, doel: string): string {
  const oudPad = padVan(ruw);
  if (oudPad === null) return String(html ?? '');

  const nieuweRuw = ruw.replace(oudPad, doel);
  return String(html ?? '')
    .split(`href="${ruw}"`)
    .join(`href="${nieuweRuw}"`)
    .split(`href='${ruw}'`)
    .join(`href='${nieuweRuw}'`);
}
