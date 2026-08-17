/**
 * HOE GROOT MAG EEN E-MAIL ZIJN?
 *
 * Aanleiding: een testmail van de zomerupdate kwam binnen met "Deze e-mail is te
 * groot voor de beveiligingsfilters" in plaats van de mail zelf. Oorzaak: een
 * foto die als data:-URL in de HTML werd meegebakken. Een telefoonfoto van 3 MB
 * wordt in base64 zo'n 4 MB tekst — in de mail zelf, niet als bijlage.
 *
 * Het vervelende is dat je dat pas ziet ná het versturen. Deze module maakt het
 * meetbaar vóór die tijd, zodat het scherm het kan zeggen in plaats van de
 * inbox van de ontvanger.
 *
 * De grenzen
 * ----------
 * Er is geen officiële limiet; elke partij hanteert zijn eigen getal. De twee
 * die er in de praktijk toe doen:
 *
 *   - Gmail kapt de weergave af ("Bericht is ingekort") rond 102 kB HTML. Alles
 *     daaronder verdwijnt achter een "Volledig bericht weergeven"-link — en dat
 *     is precies waar de afmeldlink staat. Dat is geen cosmetisch probleem.
 *   - Filters en gateways van zakelijke providers gaan bij enkele megabytes
 *     over op weigeren of onderdrukken, zoals hier gebeurde.
 *
 * Vandaar drie niveaus in plaats van één harde grens: ruim (geen actie), krap
 * (waarschuwen, hij komt aan maar wordt mogelijk ingekort) en te groot (niet
 * versturen zonder er iets aan te doen).
 */

/** Vanaf hier kapt Gmail de weergave af. */
export const GMAIL_KNIPGRENS = 102 * 1024;

/** Ruime bovengrens: hierboven gaan filters en gateways klagen. */
export const TE_GROOT = 2 * 1024 * 1024;

export type Grootteoordeel = 'ruim' | 'krap' | 'te_groot';

export interface Groottemeting {
  bytes: number;
  /** Leesbaar, bv. "1,4 MB". */
  leesbaar: string;
  oordeel: Grootteoordeel;
  /** Wat er aan de hand is, in één zin. Leeg bij 'ruim'. */
  melding: string;
  /** Hoeveel bytes aan data:-URL's erin zitten — vrijwel altijd de oorzaak. */
  ingebakkenBeeldBytes: number;
  /** Aantal ingebakken afbeeldingen. */
  ingebakkenBeelden: number;
}

/** Byte-lengte van de HTML zoals hij over de lijn gaat (UTF-8, niet tekens). */
export function bytesVan(html: string): number {
  return Buffer.byteLength(String(html ?? ''), 'utf8');
}

export function leesbaar(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/**
 * Zoekt data:-URL's op en telt hun omvang.
 *
 * Dit is bijna altijd waar het gewicht zit, en het is ook het enige deel dat je
 * met één handeling kunt oplossen (de afbeelding uploaden in plaats van
 * meebakken). Daarom wordt het apart geteld: een melding die alleen "te groot"
 * zegt, laat de lezer raden.
 */
export function ingebakkenBeelden(html: string): { aantal: number; bytes: number } {
  const treffers = String(html ?? '').match(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi) || [];
  return {
    aantal: treffers.length,
    bytes: treffers.reduce((som, t) => som + Buffer.byteLength(t, 'utf8'), 0),
  };
}

/** Meet de mail en zeg wat er aan de hand is. */
export function meetMail(html: string): Groottemeting {
  const bytes = bytesVan(html);
  const beelden = ingebakkenBeelden(html);

  let oordeel: Grootteoordeel = 'ruim';
  if (bytes >= TE_GROOT) oordeel = 'te_groot';
  else if (bytes >= GMAIL_KNIPGRENS) oordeel = 'krap';

  let melding = '';
  if (oordeel === 'te_groot') {
    melding = `Deze mail is ${leesbaar(bytes)}. Dat is te groot: filters van zakelijke providers weigeren hem of tonen alleen een waarschuwing.`;
  } else if (oordeel === 'krap') {
    melding = `Deze mail is ${leesbaar(bytes)}. Gmail kapt boven ${leesbaar(GMAIL_KNIPGRENS)} de weergave af met "Bericht is ingekort" — inclusief de afmeldlink onderaan.`;
  }

  if (melding && beelden.aantal > 0) {
    melding += ` ${beelden.aantal} ingesloten afbeelding${beelden.aantal === 1 ? '' : 'en'} ` +
      `${beelden.aantal === 1 ? 'is' : 'zijn'} samen ${leesbaar(beelden.bytes)} — ` +
      `dat is ${Math.round((beelden.bytes / bytes) * 100)}% van de mail. Upload ze opnieuw; ze worden dan als link meegestuurd in plaats van meegebakken.`;
  }

  return {
    bytes,
    leesbaar: leesbaar(bytes),
    oordeel,
    melding,
    ingebakkenBeeldBytes: beelden.bytes,
    ingebakkenBeelden: beelden.aantal,
  };
}
