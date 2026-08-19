/**
 * PERSONALISATIE — merge-tags in campagnemails.
 *
 * Aanleiding: de vraag vlak voor een verzending van "krijgt iedereen wel echt
 * zijn eigen voornaam te zien, of staat er straks {{voornaam}} in de mail?"
 * Bij het nalopen bleek dat een terechte zorg, om drie redenen.
 *
 * 1. De vervanging was letterlijk. `{{voornaam}}` werd vervangen, maar
 *    `{{ voornaam }}` met spaties niet, en `{voornaam}` met één accolade ook
 *    niet. Zo'n tag blijft dan gewoon in de verzonden mail staan.
 * 2. De onderwerpregel had een eigen, kortere vervanging: alleen voornaam,
 *    bedrijf en naam. `{{stad}}` of `{{functietitel}}` in een onderwerp bleef
 *    onvervangen — en dat is precies het stukje tekst dat iedereen als eerste
 *    ziet, ook wie de mail niet opent.
 * 3. Zonder voornaam viel de body terug op "daar" ("Beste daar,"), maar de
 *    onderwerpregel op een lege string ("Hi ,").
 *
 * Dit bestand is de enige plek waar een merge-tag nog vervangen wordt, zodat
 * die drie dingen niet meer uit elkaar kunnen lopen. Pure functies, geen
 * imports — zodat het onder bare `tsx` te testen is.
 */

export interface PersonalisatieContact {
  voornaam?: string | null;
  achternaam?: string | null;
  naam?: string | null;
  bedrijf?: string | null;
  company?: string | null;
  functietitel?: string | null;
  /** Zoals de kolom in prospect_contacts heet. Zie `waarden()`. */
  function?: string | null;
  stad?: string | null;
}

/**
 * De terugval als er geen voornaam bekend is.
 *
 * "Beste daar," leest raar, maar het is oneindig veel beter dan "Beste
 * {{voornaam}}," of "Beste ,". Wie dit niet wil, moet de ontvangers zonder
 * voornaam uitsluiten — daar waarschuwt het scherm nu voor.
 */
export const AANSPREEK_TERUGVAL = 'daar';

/** Terugval voor de bedrijfsnaam. */
export const BEDRIJF_TERUGVAL = 'uw organisatie';

/**
 * Alle namen die als merge-tag herkend worden, met hun aliassen.
 *
 * De aliassen zijn er omdat mensen typen wat ze kennen: uit een ander
 * mailpakket komt `{{first_name}}`, uit een Word-sjabloon `{{voorNaam}}`.
 */
export const TAG_ALIASSEN: Record<string, string[]> = {
  voornaam: ['voornaam', 'firstname', 'first_name', 'fname'],
  achternaam: ['achternaam', 'lastname', 'last_name', 'lname'],
  naam: ['naam', 'volledigenaam', 'fullname', 'full_name', 'name'],
  bedrijf: ['bedrijf', 'bedrijfsnaam', 'company', 'organisatie'],
  functietitel: ['functietitel', 'functie', 'jobtitle', 'job_title', 'title'],
  stad: ['stad', 'plaats', 'city'],
};

/** Alle herkende schrijfwijzen, in kleine letters. */
const ALIAS_NAAR_VELD = new Map<string, string>();
for (const [veld, aliassen] of Object.entries(TAG_ALIASSEN)) {
  for (const a of aliassen) ALIAS_NAAR_VELD.set(a, veld);
}

/**
 * De waarde per veld, inclusief terugval.
 *
 * `functietitel` komt uit `function`: zo heet de kolom in prospect_contacts.
 * Dat is geen schoonheidsprijs, maar de tag heet in de mailbouwer nu eenmaal
 * {{functietitel}} en de kolom heet nu eenmaal `function`. Vóór deze commit
 * werd alleen naar een veld `functietitel` gekeken dat niet bestaat, waardoor
 * die tag altijd leeg bleef.
 */
export function waarden(contact: PersonalisatieContact): Record<string, string> {
  const voornaam = (contact.voornaam || '').trim();
  const achternaam = (contact.achternaam || '').trim();
  const naam = (contact.naam || '').trim() || [voornaam, achternaam].filter(Boolean).join(' ');
  const bedrijf = (contact.bedrijf || contact.company || '').trim();
  const functietitel = (contact.functietitel || contact.function || '').trim();
  const stad = (contact.stad || '').trim();

  return {
    voornaam: voornaam || AANSPREEK_TERUGVAL,
    achternaam,
    naam: naam || AANSPREEK_TERUGVAL,
    bedrijf: bedrijf || BEDRIJF_TERUGVAL,
    functietitel,
    stad,
  };
}

/**
 * Herkent een merge-tag in vier schrijfwijzen: {{tag}}, {tag}, [tag] en [[tag]],
 * met willekeurige spaties eromheen en ongeacht hoofdletters.
 *
 * Waarom ook de enkele accolade en de rechte haak: dat is wat mensen typen als
 * ze het even niet meer weten, en het gevolg is een mail met "Hi {voornaam],"
 * erin. Het risico van te ruim zoeken is klein, want er wordt alleen vervangen
 * als wat er tussen staat exact een bekende tagnaam is — losse tekst tussen
 * accolades blijft dus gewoon staan.
 */
const TAG_PATROON = /\{\{\s*([a-z_]+)\s*\}\}|\[\[\s*([a-z_]+)\s*\]\]|\{\s*([a-z_]+)\s*\}|\[\s*([a-z_]+)\s*\]/gi;

/** Vervangt alle herkende merge-tags. Onbekende tags blijven onaangeroerd. */
export function personaliseer(tekst: string, contact: PersonalisatieContact): string {
  if (!tekst) return '';
  const w = waarden(contact);
  return tekst.replace(TAG_PATROON, (heel, a, b, c, d) => {
    const naam = String(a ?? b ?? c ?? d ?? '').toLowerCase();
    const veld = ALIAS_NAAR_VELD.get(naam);
    if (!veld) return heel;      // geen bekende tag: laten staan
    return w[veld] ?? '';
  });
}

/**
 * Alles wat op een merge-tag lijkt maar niet herkend wordt.
 *
 * Dit is de waarschuwing vóór het verzenden. Een tikfout als {{voormaam}} of
 * een tag uit een ander pakket wordt hier gevonden; die zou anders letterlijk
 * in de mail belanden. Alleen dubbele accolades en dubbele haken tellen mee —
 * enkele accolades komen te vaak voor in gewone tekst en zouden bij elke
 * campagne vals alarm geven.
 */
export function onbekendePlaceholders(tekst: string): string[] {
  if (!tekst) return [];
  const gevonden = new Set<string>();
  const patroon = /\{\{\s*([^}\n]{1,40}?)\s*\}\}|\[\[\s*([^\]\n]{1,40}?)\s*\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = patroon.exec(tekst)) !== null) {
    const ruw = String(m[1] ?? m[2] ?? '').trim();
    if (!ruw) continue;
    if (ALIAS_NAAR_VELD.has(ruw.toLowerCase())) continue;
    gevonden.add(m[0]);
  }
  return [...gevonden];
}

/** Welke merge-tags gebruikt deze tekst? Geeft de genormaliseerde veldnamen. */
export function gebruikteTags(tekst: string): string[] {
  if (!tekst) return [];
  const gevonden = new Set<string>();
  const patroon = new RegExp(TAG_PATROON.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = patroon.exec(tekst)) !== null) {
    const naam = String(m[1] ?? m[2] ?? m[3] ?? m[4] ?? '').toLowerCase();
    const veld = ALIAS_NAAR_VELD.get(naam);
    if (veld) gevonden.add(veld);
  }
  return [...gevonden];
}

/**
 * Voornamen waarbij "Beste {{voornaam}}," raar uitpakt.
 *
 * Een leeg veld valt op — daar waarschuwt ontbrekendeVelden voor. Het echte
 * risico zit in een voornaam die er wél is maar geen voornaam ís. Een
 * CRM-contactpersoon die "Reserveringen" of "Info" heet levert netjes
 * "Beste Reserveringen," op, en daar gaat geen enkele controle op af.
 *
 * Dit zijn de gevallen die een mens er zo uit pikt en een computer niet:
 * postbusnamen, initialen, geschreeuw in hoofdletters, en resten van een
 * e-mailadres dat als naam is ingevuld.
 */
const POSTBUSNAMEN = new Set([
  'info', 'sales', 'contact', 'algemeen', 'office', 'team', 'directie',
  'reserveringen', 'reservations', 'receptie', 'reception', 'frontoffice',
  'front', 'boekingen', 'bookings', 'events', 'banqueting', 'banquet',
  'administratie', 'admin', 'hr', 'finance', 'inkoop', 'planning',
  'noreply', 'no-reply', 'mail', 'email', 'hotel', 'restaurant',
]);

export type AanhefTwijfel =
  | 'leeg'
  | 'postbusnaam'
  | 'initiaal'
  | 'hoofdletters'
  | 'geen_naam';

/**
 * Ziet deze voornaam eruit als iets wat je in een aanhef wilt zetten?
 *
 * Geeft null als hij goed is, en anders de reden. Bewust streng aan de kant van
 * melden: een valse waarschuwing kost een blik, een gemiste kost een mail met
 * "Beste Reserveringen," erin.
 */
export function aanhefTwijfel(voornaam?: string | null): AanhefTwijfel | null {
  const v = (voornaam || '').trim();
  if (!v) return 'leeg';

  // Een adres of iets met cijfers erin is nooit een voornaam.
  if (/[@0-9_]/.test(v)) return 'geen_naam';

  // "H." of "J" — klopt technisch, maar "Beste H.," is geen aanhef.
  if (/^[a-z]\.?$/i.test(v)) return 'initiaal';
  if (/^([a-z]\.){2,}$/i.test(v)) return 'initiaal';

  const kaal = v.replace(/[^a-zà-ÿ]/gi, '').toLowerCase();
  if (!kaal) return 'geen_naam';
  if (POSTBUSNAMEN.has(kaal)) return 'postbusnaam';

  // ALLES IN HOOFDLETTERS. Alleen melden bij meer dan één letter, anders
  // overlapt het met de initiaal hierboven.
  if (v.length > 1 && v === v.toUpperCase() && /[a-zà-ÿ]/i.test(v)) return 'hoofdletters';

  return null;
}

/** Nederlandse omschrijving van een twijfelgeval, voor in het scherm. */
export const TWIJFEL_UITLEG: Record<AanhefTwijfel, string> = {
  leeg: 'geen voornaam',
  postbusnaam: 'lijkt een afdeling, geen persoon',
  initiaal: 'alleen een initiaal',
  hoofdletters: 'staat in hoofdletters',
  geen_naam: 'lijkt geen naam',
};

/**
 * Mist dit contact een waarde voor een tag die in de tekst staat?
 *
 * Geeft de velden terug waarvoor de mail zou terugvallen op "daar" of "uw
 * organisatie". Daarmee kan het scherm vóór het verzenden zeggen: "12 van de
 * 340 ontvangers hebben geen voornaam".
 */
export function ontbrekendeVelden(
  tags: string[],
  contact: PersonalisatieContact,
): string[] {
  const rauw: Record<string, string> = {
    voornaam: (contact.voornaam || '').trim(),
    achternaam: (contact.achternaam || '').trim(),
    naam: (contact.naam || '').trim(),
    bedrijf: (contact.bedrijf || contact.company || '').trim(),
    functietitel: (contact.functietitel || contact.function || '').trim(),
    stad: (contact.stad || '').trim(),
  };
  return tags.filter((t) => !rauw[t]);
}
