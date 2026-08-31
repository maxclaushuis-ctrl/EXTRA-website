/**
 * Beslislogica voor het automatisch verlopen van tewerkstellingsvergunningen.
 *
 * WAAROM DIT EEN APART BESTAND IS
 * -------------------------------
 * Tot nu toe stond "is deze vergunning verlopen?" op twee plekken, en die twee
 * gaven een verschillend antwoord. Het TWV-scherm rekende het in de browser uit
 * en toonde een rij met status twv_verstrekt en een verstreken einddatum als
 * "TWV Verlopen", zonder dat ergens weg te schrijven. De CSV-export las
 * rechtstreeks uit de database en noemde diezelfde rij "TWV Verstrekt". Wie het
 * ene document naast het andere legde, zag twee getallen.
 *
 * De regel staat nu één keer, hier, als pure functie zonder database. Daardoor
 * is hij te testen zonder verbinding (zie server/twvVerlopen.test.ts) en is er
 * geen tweede plek meer die zelf iets afleidt.
 *
 * WAT DE REGEL IS
 * ---------------
 * Een rij verloopt als de status twv_verstrekt is EN er een einddatum staat EN
 * die einddatum vóór vandaag ligt. Niet "vandaag of eerder": op de einddatum
 * zelf is de vergunning nog geldig.
 *
 * Geen einddatum betekent nooit automatisch verlopen. Een rij die met de hand
 * of via een CSV-import op twv_verlopen is gezet zonder datum blijft staan zoals
 * hij staat; die wordt hier niet aangeraakt en ook niet stilzwijgend van een
 * datum voorzien.
 */

export type TwvStatus =
  | 'twv_nodig'
  | 'twv_aangevraagd'
  | 'info_nodig'
  | 'twv_verstrekt'
  | 'twv_verlopen';

/** Het minimum dat de beslissing nodig heeft. Bewust geen hele kandidaat. */
export interface TwvRij {
  id: number;
  twvStatus?: TwvStatus | string | null;
  twvEndDate?: string | Date | null;
}

/**
 * Zet een datumwaarde om naar middernacht lokale tijd, of null als er niets
 * bruikbaars in zit. Een datumkolom komt uit Postgres als "2025-01-01"; een
 * lege string of onzin levert null, en null verloopt nooit.
 */
export function naarDag(waarde: string | Date | null | undefined): Date | null {
  if (!waarde) return null;
  const d = waarde instanceof Date ? new Date(waarde.getTime()) : new Date(String(waarde));
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * De hele regel in één functie. `vandaag` wordt meegegeven zodat de test niet
 * afhangt van wanneer hij draait.
 */
export function moetVerlopen(rij: TwvRij, vandaag: Date): boolean {
  if (rij.twvStatus !== 'twv_verstrekt') return false;
  const eind = naarDag(rij.twvEndDate);
  if (!eind) return false;
  const dagVanVandaag = new Date(vandaag.getTime());
  dagVanVandaag.setHours(0, 0, 0, 0);
  return eind.getTime() < dagVanVandaag.getTime();
}

/** Aantal dagen dat een vergunning al verlopen is. Nul of minder = niet verlopen. */
export function dagenVerlopen(rij: TwvRij, vandaag: Date): number {
  const eind = naarDag(rij.twvEndDate);
  if (!eind) return 0;
  const dagVanVandaag = new Date(vandaag.getTime());
  dagVanVandaag.setHours(0, 0, 0, 0);
  return Math.round((dagVanVandaag.getTime() - eind.getTime()) / 86_400_000);
}

/** Welke rijen omgezet moeten worden. Verandert niets aan de invoer. */
export function bepaalVerlopenRijen<T extends TwvRij>(rijen: T[], vandaag: Date): T[] {
  return rijen.filter(r => moetVerlopen(r, vandaag));
}

/**
 * Welke rijen een lege status hebben terwijl ze wél op de TWV-lijst staan.
 * Die tonen op het scherm als "TWV Nodig" en in de export als "Onbekend" —
 * dezelfde soort dubbele afleiding als hierboven, en de reden voor de eenmalige
 * backfill naar twv_nodig.
 */
export function bepaalLegeStatusRijen<T extends { id: number; needsTwv?: boolean | null; twvStatus?: TwvStatus | string | null }>(
  rijen: T[],
): T[] {
  return rijen.filter(r => r.needsTwv === true && (r.twvStatus === null || r.twvStatus === undefined));
}
