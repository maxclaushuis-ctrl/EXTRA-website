/**
 * Schrijfwijzen die in de TWV-administratie voorkomen en géén landnaam zijn.
 *
 * WAAROM DIT BESTAAT
 * ------------------
 * shared/landen.ts kent alleen echte landnamen, exact zoals ze in het
 * aanmeldformulier staan. Dat is bewust: een vergunningplicht afleiden uit een
 * gok op een half woord is precies wat je niet wilt. Maar het veld nationality
 * is op twee plekken vrije tekst — het interne TWV-scherm en de CSV-import — en
 * daar staan nationaliteiten ("Bengalese"), Engelse landnamen ("Yemen") en
 * typefouten ("Agentinian") in.
 *
 * Van de 72 TWV-rijen matchten er 31 op de landenlijst en 39 niet. Deze tabel
 * dekt 37 van die 39. Elke regel is één voor één met de hand goedgekeurd; er
 * zit geen enkele automatische afleiding in, geen fuzzy match, geen "begint
 * met". Wat hier niet in staat, blijft leeg — dat is het punt.
 *
 * WAT ER BEWUST NIET IN STAAT
 * ---------------------------
 * Twee waarden zijn geen nationaliteit maar een aantekening van een
 * medewerker: "Cuba, has a W document" en "Pakistaan, TWV vereist". Daar zit
 * informatie in die niet in een landcode past, en die rijen horen met de hand
 * bekeken te worden. Ze staan hier niet in en blijven dus leeg.
 *
 * WAAR HIJ WEL EN NIET WORDT GEBRUIKT
 * -----------------------------------
 * Alleen in de eenmalige backfill van de landcodes. De schrijfpaden gebruiken
 * hem NIET: die krijgen hun waarde uit de keuzelijst en horen een echte
 * landnaam op te leveren. Zou je hem daar ook inzetten, dan wordt slordige
 * invoer stilzwijgend goedgemaakt in plaats van zichtbaar.
 */
import { zoekLand, type Land } from "./landen";

export interface LandAlias {
  /** De tekst zoals hij letterlijk in de database staat. */
  alias: string;
  /** De landnaam uit shared/landen.ts waar hij naar verwijst. */
  land: string;
  /** Waarom deze koppeling klopt. */
  reden: string;
}

export const LAND_ALIASSEN: LandAlias[] = [
  { alias: "Bengalese",      land: "Bangladesh",          reden: "nationaliteit, niet de landnaam" },
  { alias: "Bangladeshi",    land: "Bangladesh",          reden: "Engelse nationaliteit" },
  { alias: "Surinaamse",     land: "Suriname",            reden: "nationaliteit, niet de landnaam" },
  { alias: "Venezolaanse",   land: "Venezuela",           reden: "nationaliteit, niet de landnaam" },
  { alias: "Gambiaanse",     land: "Gambia",              reden: "nationaliteit, niet de landnaam" },
  { alias: "Nigeriaanse",    land: "Nigeria",             reden: "nationaliteit, niet de landnaam" },
  { alias: "Nigerian",       land: "Nigeria",             reden: "Engelse nationaliteit" },
  { alias: "Argentijnse",    land: "Argentinië",          reden: "nationaliteit, niet de landnaam" },
  { alias: "Agentinian",     land: "Argentinië",          reden: "typefout in de Engelse nationaliteit" },
  { alias: "Britse",         land: "Verenigd Koninkrijk", reden: "nationaliteit, niet de landnaam" },
  { alias: "Sierra Leoonse", land: "Sierra Leone",        reden: "nationaliteit, niet de landnaam" },
  { alias: "Syrische",       land: "Syrië",               reden: "nationaliteit, niet de landnaam" },
  { alias: "Turkse",         land: "Turkije",             reden: "nationaliteit, niet de landnaam" },
  { alias: "Yemen",          land: "Jemen",               reden: "Engelse landnaam" },
  { alias: "Italian",        land: "Italië",              reden: "Engelse nationaliteit" },
  { alias: "Nederlands",     land: "Nederland",           reden: "nationaliteit, niet de landnaam" },
];

/**
 * Waarden die er als een nationaliteit uitzien maar het niet zijn: er staat een
 * aantekening bij. Bewust NIET gekoppeld. Deze constante staat hier zodat de
 * telling ze apart kan noemen in plaats van ze op één hoop te gooien met
 * onbekende invoer.
 */
export const NIET_KOPPELEN: string[] = [
  "Cuba, has a W document",
  "Pakistaan, TWV vereist",
];

const OP_ALIAS: Record<string, string> = {};
for (const a of LAND_ALIASSEN) OP_ALIAS[a.alias] = a.land;

/**
 * De landnaam achter een alias, of null. Exacte match na trim — hoofdletters
 * tellen mee, precies zoals zoekLand() dat doet.
 */
export function zoekAlias(tekst: string | null | undefined): string | null {
  if (!tekst) return null;
  return OP_ALIAS[tekst.trim()] ?? null;
}

/**
 * Zoekt eerst een echte landnaam, dan pas een alias. Geeft er ook bij terug
 * langs welke weg het gevonden is, zodat een rapport kan laten zien welke rijen
 * op een alias leunen en welke gewoon klopten.
 */
export function zoekLandMetAlias(tekst: string | null | undefined): {
  land: Land | undefined;
  viaAlias: boolean;
} {
  const direct = zoekLand(tekst);
  if (direct) return { land: direct, viaAlias: false };
  const naam = zoekAlias(tekst);
  if (!naam) return { land: undefined, viaAlias: false };
  return { land: zoekLand(naam), viaAlias: true };
}
