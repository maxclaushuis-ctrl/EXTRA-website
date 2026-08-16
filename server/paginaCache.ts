/**
 * KORTE CACHE VOOR DE SEO-CATCH-ALL.
 *
 * Aanleiding: de Ahrefs-crawl van 16 augustus meldde één trage pagina —
 * /blog/housekeeping-personeel-inhuren met een TTFB van 1.357 ms, tegenover
 * minder dan 150 ms voor de statische routes. Het verschil zit hem in wat er
 * per verzoek gebeurt: een statische route wordt volledig uit het manifest en
 * een bestand op schijf beantwoord, terwijl /blog/:slug en /vacatures/:slug
 * eerst een databaseronde doen (server/seo.ts, stap 2).
 *
 * Of die 1,36 seconde volledig op het conto van de database komt, is uit één
 * meting niet hard te maken — een koude serverless-instantie telt ook mee. Wat
 * wel vaststaat: een crawler die zeventien artikelen en vacatures achter elkaar
 * ophaalt, betaalt die ronde nu zeventien keer, en dat is puur weggegooid werk.
 *
 * Bewust een eigen mini-implementatie en geen bibliotheek: het is dertig regels,
 * het draait in het verzoekpad van elke pagina, en een cache die je zelf kunt
 * lezen is er eentje waarvan je weet wanneer hij verkeerd staat.
 *
 * De klok is injecteerbaar zodat verlopen zonder wachten te testen is —
 * zie server/paginaCache.test.ts.
 */

export interface CacheOpties {
  /** Hoe lang een waarde geldig blijft. */
  ttlMs: number;
  /** Hoeveel sleutels er maximaal in mogen; daarboven verdwijnt de oudste. */
  max: number;
  /** Alleen voor tests. */
  nu?: () => number;
}

interface Vak<T> {
  waarde: T;
  vervalt: number;
}

/**
 * Kleine TTL-cache met een harde bovengrens.
 *
 * De bovengrens is er tegen ongebreideld geheugengebruik: de sleutel is een
 * slug uit de URL, en die kan een bezoeker (of een scanner) zelf verzinnen.
 * Zonder grens zou elke onzin-URL een vakje in het geheugen opeisen.
 *
 * Bij overschrijding verdwijnt de oudst toegevoegde sleutel (invoegvolgorde van
 * Map). Bewust geen LRU: dat vraagt boekhouding bij élke lees-actie, en het
 * verschil is bij zeventien pagina's en een grens van tweehonderd theoretisch.
 */
export class TtlCache<T> {
  private readonly vakken = new Map<string, Vak<T>>();
  private readonly ttlMs: number;
  private readonly max: number;
  private readonly nu: () => number;

  constructor(opties: CacheOpties) {
    this.ttlMs = opties.ttlMs;
    this.max = opties.max;
    this.nu = opties.nu ?? Date.now;
  }

  get(sleutel: string): T | undefined {
    const vak = this.vakken.get(sleutel);
    if (!vak) return undefined;
    if (vak.vervalt <= this.nu()) {
      this.vakken.delete(sleutel);
      return undefined;
    }
    return vak.waarde;
  }

  set(sleutel: string, waarde: T): void {
    // Eerst verwijderen, dan zetten: zo schuift een bijgewerkte sleutel
    // achteraan in de invoegvolgorde en wordt hij niet als eerste opgeruimd.
    this.vakken.delete(sleutel);
    this.vakken.set(sleutel, { waarde, vervalt: this.nu() + this.ttlMs });

    while (this.vakken.size > this.max) {
      const oudste = this.vakken.keys().next();
      if (oudste.done) break;
      this.vakken.delete(oudste.value);
    }
  }

  /** Aantal vakjes, inclusief eventueel verlopen vakjes die nog niet zijn opgehaald. */
  get grootte(): number {
    return this.vakken.size;
  }

  leeg(): void {
    this.vakken.clear();
  }
}

/**
 * Haalt een waarde uit de cache of vult hem aan.
 *
 * `undefined` wordt óók onthouden — een slug die niet bestaat kost anders bij
 * elk verzoek opnieuw een databaseronde, en juist die 404's komen in bulk
 * binnen (oude URL's, scanners). Vandaar het omhulsel: `{ waarde }` in de cache
 * onderscheidt "niets gevonden, en dat weten we" van "nog niet gekeken".
 *
 * Een fout wordt niet onthouden. Een databasestoring van één seconde mag geen
 * minuut lang lege pagina's opleveren.
 */
export async function metCache<T>(
  cache: TtlCache<{ waarde: T }>,
  sleutel: string,
  ophalen: () => Promise<T>
): Promise<T> {
  const bestaand = cache.get(sleutel);
  if (bestaand) return bestaand.waarde;

  const waarde = await ophalen();
  cache.set(sleutel, { waarde });
  return waarde;
}
