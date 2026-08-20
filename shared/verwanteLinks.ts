/**
 * ONDERLINGE LINKS TUSSEN DETAILPAGINA'S.
 *
 * Aanleiding: de Ahrefs-crawl meldt negen pagina's met "only one dofollow
 * incoming internal link" — acht vacatures en één blogartikel. Dat is precies
 * wat je verwacht na de vorige ronde: die pagina's wáren weespagina's, kregen
 * een plek in de overzichtslijst op /vacatures en /blog, en hebben nu dus
 * precies één link. Eén is beter dan nul, maar het blijft een doodlopende tak:
 * al het gewicht van de site loopt via één pad naar beneden en nergens terug.
 *
 * De oplossing is niet ingewikkeld — laat detailpagina's naar elkaar linken —
 * maar de valkuil zit in de selectie.
 *
 * WAAROM NIET "DE EERSTE ZES ANDERE"
 * ----------------------------------
 * De voor de hand liggende aanpak is: toon op elke pagina de eerste zes andere
 * items. Dan krijgen die zes items honderd links en houdt de rest er nog steeds
 * één. Je verplaatst het probleem in plaats van het op te lossen.
 *
 * Daarom een ring: item i linkt naar i+1, i+2, ... i+k, modulo het aantal.
 * Iedere pagina krijgt daarmee exact evenveel inkomende links als hij uitgaande
 * heeft. Geen enkele pagina blijft achter, geen enkele slokt alles op. Dat is
 * te bewijzen en het wordt bewezen: shared/verwanteLinks.test.ts bouwt de
 * volledige linkgrafiek en telt de inkomende links per pagina.
 *
 * De volgorde van de ring is niet willekeurig. Items met dezelfde groep —
 * dezelfde stad bij een vacature, dezelfde categorie bij een artikel — komen
 * naast elkaar te staan, zodat de ring ze automatisch aan elkaar knoopt. Een
 * vacature in Amsterdam linkt dus eerst naar de andere Amsterdamse vacatures.
 *
 * Pure functies, geen imports.
 */

export interface RingItem {
  slug: string;
  title: string;
  /** Groep om op te clusteren: locatie bij een vacature, categorie bij een artikel. */
  groep?: string | null;
}

/** Standaard aantal onderlinge links per pagina. */
export const AANTAL_VERWANT = 4;

/**
 * Zet de items in een vaste, groepsgewijze volgorde.
 *
 * Vaste volgorde is een eis, geen bijvangst: verandert de volgorde bij elke
 * aanroep, dan wijst de ring elke crawl een andere kant op en ziet Google een
 * site die zichzelf steeds herschikt. Gesorteerd wordt op groep en daarbinnen
 * op slug — allebei stabiel en onafhankelijk van de volgorde die de database
 * toevallig teruggeeft.
 */
export function ringVolgorde(items: RingItem[]): RingItem[] {
  return (items || [])
    .filter(i => i && i.slug && i.title)
    .slice()
    .sort((a, b) => {
      const ga = (a.groep || '').toLowerCase();
      const gb = (b.groep || '').toLowerCase();
      if (ga !== gb) return ga < gb ? -1 : 1;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
}

/**
 * De items waarnaar deze pagina moet linken.
 *
 * Geeft een lege lijst als de slug niet in de lijst voorkomt of als er te
 * weinig items zijn om iets zinnigs te doen.
 */
export function verwanteItems(
  items: RingItem[],
  huidigeSlug: string,
  aantal: number = AANTAL_VERWANT,
): RingItem[] {
  const ring = ringVolgorde(items);
  const n = ring.length;
  if (n < 2 || !huidigeSlug) return [];

  const start = ring.findIndex(i => i.slug === huidigeSlug);
  if (start === -1) return [];

  // Nooit meer dan er zijn, en nooit zichzelf: vandaar n - 1.
  const k = Math.max(0, Math.min(aantal, n - 1));
  const uit: RingItem[] = [];
  for (let stap = 1; stap <= k; stap++) uit.push(ring[(start + stap) % n]);
  return uit;
}

function esc(tekst: string): string {
  return String(tekst ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Het HTML-blok dat onder een detailpagina komt.
 *
 * Zelfde opzet als lijstFragment in server/contentFragment.ts: een <nav> met
 * een kop en een lijst, verder niets. Geen styling, want dit is de versie voor
 * wie geen JavaScript uitvoert.
 */
export function verwantFragment(
  basis: '/blog' | '/vacatures',
  titel: string,
  items: RingItem[],
): string {
  const bruikbaar = (items || []).filter(i => i && i.slug && i.title);
  if (bruikbaar.length === 0) return '';

  const regels = bruikbaar
    .map(i => {
      const label = i.groep ? `${esc(i.title)} — ${esc(i.groep)}` : esc(i.title);
      return `<li><a href="${basis}/${encodeURIComponent(i.slug)}">${label}</a></li>`;
    })
    .join('');

  return `<nav aria-label="${esc(titel)}"><h2>${esc(titel)}</h2><ul>${regels}</ul></nav>`;
}

/**
 * Bouwt de volledige linkgrafiek. Alleen gebruikt door de test en door
 * scripts/check-internal-links.ts-achtige controles.
 */
export function linkGrafiek(
  items: RingItem[],
  aantal: number = AANTAL_VERWANT,
): Map<string, string[]> {
  const ring = ringVolgorde(items);
  const grafiek = new Map<string, string[]>();
  for (const item of ring) {
    grafiek.set(item.slug, verwanteItems(ring, item.slug, aantal).map(i => i.slug));
  }
  return grafiek;
}
