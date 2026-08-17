/**
 * TWEEKOLOMSBLOK VOOR DE MAILBOUWER — tekst naast een afbeelding.
 *
 * Aanleiding: de bouwer kende alleen blokken die de volle breedte pakken. Een
 * mail als de zomerupdate, waarin een collega wordt voorgesteld met een foto
 * ernaast, moest daardoor als los tekstblok en los afbeeldingsblok onder elkaar.
 *
 * Waarom dit een eigen bestand is
 * -------------------------------
 * E-mail-HTML is geen web-HTML. Flexbox en grid doen het niet in Outlook, en
 * een <td> laat zich niet betrouwbaar stapelen op een telefoon: zet je hem op
 * display:block, dan blijft de omliggende tabel zijn oorspronkelijke breedte
 * houden en loopt de inhoud het scherm uit. Dat is hier ook daadwerkelijk
 * gebeurd bij de eerste opzet, zichtbaar in een render op 420 pixels breed.
 *
 * Daarom het gangbare patroon: twee <div>'s met display:inline-block, die
 * krimpen wél netjes, met daaromheen een voorwaardelijke tabel die alleen
 * Outlook ziet. Elke client krijgt zo de vorm die hij aankan.
 *
 * De font-size:0 op de buitenste div is geen stijlkeuze maar noodzaak: zonder
 * dat valt de witruimte tussen twee inline-blocks als een spatie van een paar
 * pixels binnen de 100% en breekt de tweede kolom naar de volgende regel.
 *
 * Stapelen op mobiel gebeurt met een media query (KOLOM_MEDIA_CSS). Outlook
 * negeert media queries en houdt de kolommen naast elkaar — dat is precies de
 * bedoeling: de desktopweergave is daar de veilige weergave.
 *
 * Te testen met `npx tsx server/emailKolommen.test.ts`.
 *
 * De tekst komt hier al gepersonaliseerd en met verwerkte links binnen. Dit
 * bestand gaat alleen over de opmaak, niet over de inhoud.
 */

export type BeeldPositie = 'links' | 'rechts';
/** Hoeveel ruimte de afbeelding krijgt ten opzichte van de tekst. */
export type Verhouding = 'half' | 'beeld-klein' | 'beeld-groot';
export type VerticaleUitlijning = 'top' | 'midden';

export interface KolommenInput {
  /** Al gepersonaliseerd en door de link-parser gehaald. */
  tekstHtml?: string;
  kleur?: string;
  beeldUrl?: string;
  beeldAlt?: string;
  /** Optionele klik-link op de afbeelding. */
  beeldLink?: string;
  beeldPositie?: BeeldPositie;
  verhouding?: Verhouding;
  verticaal?: VerticaleUitlijning;
}

/**
 * De regel die in de <style> van de mail hoort. Zonder deze regel blijven de
 * kolommen ook op een telefoon naast elkaar staan, en dan wordt de tekstkolom
 * een pilaar van drie woorden breed.
 */
export const KOLOM_MEDIA_CSS =
  '.kolom { width:100% !important; max-width:100% !important; } ' +
  '.kolom-binnen { padding:0 0 16px 0 !important; }';

/** Attribuutwaarden veilig maken. */
function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Voor een klik-link: alleen http(s), mailto en tel — dezelfde regel als de
 * link-parser in emailGenerator.ts. Een `javascript:`-URL doet in een mailclient
 * niets, maar hij hoort ook niet in de HTML terecht te komen.
 *
 * Een pad zonder schema ("doehetextra.nl/contact") krijgt https ervoor: in een
 * mail bestaat "relatief" niet, dus dat zou anders een dode link zijn.
 */
function veiligeLink(url?: string): string | null {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return null;
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null; // ander schema: weigeren
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

/**
 * Voor de afbeelding zelf gelden andere regels dan voor een link.
 *
 * De bouwer slaat een geüploade afbeelding op als `data:image/...;base64,...`
 * (zie de upload-knop in EmailBuilderPage.tsx) en die moet dus wél door. Een
 * data-URL die géén afbeelding is, weigeren we: dat is de enige vorm waarmee je
 * hier iets anders dan een plaatje binnen zou smokkelen.
 */
function veiligeBeeldUrl(url?: string): string | null {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return null;
  if (/^data:image\/[a-z0-9.+-]+;/i.test(trimmed)) return trimmed;
  if (/^https?:/i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return null;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

/** Breedtes in procenten: [tekst, beeld]. */
export function breedtes(verhouding: Verhouding = 'half'): [number, number] {
  switch (verhouding) {
    case 'beeld-klein': return [65, 35];
    case 'beeld-groot': return [35, 65];
    case 'half':
    default: return [50, 50];
  }
}

/**
 * Bouwt het tweekolomsblok.
 *
 * Randgevallen zijn bewust vriendelijk: zonder afbeelding wordt het een gewone
 * tekstalinea over de volle breedte, zonder tekst blijft de afbeelding alleen
 * over. Een half ingevuld blok mag nooit een scheve of lege tabel opleveren in
 * de inbox van een klant.
 */
export function kolommenHtml(input: KolommenInput): string {
  const tekst = String(input.tekstHtml ?? '').trim();
  const beeldUrl = veiligeBeeldUrl(input.beeldUrl);
  const kleur = esc(input.kleur || '#374151');

  const tekstStijl = `font-size:15px;color:${kleur};line-height:1.7`;

  if (!beeldUrl && !tekst) return '';

  if (!beeldUrl) {
    return `<p style="${tekstStijl};margin:0 0 16px">${tekst}</p>`;
  }

  const img =
    `<img src="${esc(beeldUrl)}" alt="${esc(input.beeldAlt || '')}" ` +
    `style="width:100%;max-width:100%;height:auto;border:0;border-radius:8px;display:block" />`;
  const beeld = (() => {
    const link = veiligeLink(input.beeldLink);
    return link ? `<a href="${esc(link)}" style="text-decoration:none">${img}</a>` : img;
  })();

  if (!tekst) {
    return `<div style="margin:0 0 16px">${beeld}</div>`;
  }

  const [wTekst, wBeeld] = breedtes(input.verhouding);
  const beeldLinks = input.beeldPositie === 'links';
  const vAlign = input.verticaal === 'midden' ? 'middle' : 'top';

  /** Eén kolom: buitenste div houdt de breedte, binnenste de tussenruimte. */
  const kolom = (breedte: number, padding: string, inhoud: string, extraStijl = '') =>
    `<div class="kolom" style="display:inline-block;vertical-align:${vAlign};width:${breedte}%;max-width:${breedte}%">` +
    `<div class="kolom-binnen" style="padding:${padding};${extraStijl}">${inhoud}</div>` +
    `</div>`;

  const tekstKolom = kolom(
    wTekst,
    beeldLinks ? '0 0 0 16px' : '0 16px 0 0',
    tekst,
    `${tekstStijl};text-align:left`
  );
  const beeldKolom = kolom(
    wBeeld,
    beeldLinks ? '0 16px 0 0' : '0 0 0 16px',
    beeld,
    'font-size:0;line-height:0'
  );

  const eerste = beeldLinks ? beeldKolom : tekstKolom;
  const tweede = beeldLinks ? tekstKolom : beeldKolom;
  const wEerste = beeldLinks ? wBeeld : wTekst;
  const wTweede = beeldLinks ? wTekst : wBeeld;

  // De voorwaardelijke tabel ziet alleen Outlook; alle andere clients zien de
  // twee inline-blocks. Zo krijgt elke client de vorm die hij aankan.
  return (
    `<div style="font-size:0;line-height:0;text-align:left;margin:0 0 16px">` +
    `<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td width="${wEerste}%" valign="${vAlign}"><![endif]-->` +
    eerste +
    `<!--[if mso]></td><td width="${wTweede}%" valign="${vAlign}"><![endif]-->` +
    tweede +
    `<!--[if mso]></td></tr></table><![endif]-->` +
    `</div>`
  );
}

/**
 * Platte-tekstvariant. De afbeelding valt weg — in een tekstmail is een
 * bestandsnaam geen informatie — en alleen de tekst blijft over.
 */
export function kolommenTekst(tekst?: string): string {
  return String(tekst ?? '').trim();
}
