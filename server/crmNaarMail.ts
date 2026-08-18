/**
 * VAN CRM NAAR MAILLIJST — één adresboek in plaats van twee.
 *
 * Aanleiding: er stonden twee losse verzamelingen contactpersonen in de app.
 * "Bestaande klanten" en "Leads & Prospects" (crm_companies + crm_contacts) aan
 * de ene kant, en "Contacten" onder Campagnes (prospect_contacts) aan de
 * andere. Ze wisten niets van elkaar. Het gevolg zag je pas bij het versturen:
 * 337 klanten in het CRM, en een campagne die twee ontvangers vond.
 *
 * De verleiding is om prospect_contacts dan maar weg te gooien en campagnes
 * rechtstreeks op crm_contacts te richten. Dat kan niet. Aan prospect_contacts
 * hangt de hele verzendadministratie: afmeldingen, bounces, spamklachten,
 * WhatsApp-koppelingen en opt-out, flow-voortgang, en elke statistiek.
 * crm_contacts heeft daar geen enkel veld voor, en die geschiedenis mag je niet
 * kwijtraken — een afmelding negeren is niet alleen vervelend, het mag niet.
 *
 * Dus andersom: het CRM wordt de plek waar je contactpersonen beheert, en
 * prospect_contacts wordt de verzendlaag die daaruit volgt. Dit bestand bepaalt
 * wat er dan precies overgezet wordt.
 *
 * DE SCHEIDSLIJN
 * --------------
 * Twee soorten velden, en het verschil is de kern van dit bestand:
 *
 *   CRM-velden      naam, bedrijf, functie, stad, branche, klant-of-prospect.
 *                   Het CRM is de baas. Elke synchronisatie schrijft ze over.
 *
 *   verzendvelden   afgemeld, geblokkeerd, bounce-status, spamklacht, fase,
 *                   WhatsApp-opt-in, tags, taal, notities.
 *                   Die ontstaan tijdens het mailen en worden hier NOOIT
 *                   aangeraakt. Iemand die zich heeft afgemeld en daarna in het
 *                   CRM wordt bijgewerkt, blijft afgemeld.
 *
 * Die tweede regel is de belangrijkste in dit bestand. Als hij ooit sneuvelt,
 * krijgt iemand die "nee" zei alsnog post.
 *
 * Bewust zonder imports, zodat dit onder bare `tsx` te testen is.
 */

/**
 * Velden waarin het CRM altijd het laatste woord heeft, ook als het daar leeg is.
 *
 * Kort lijstje, en dat is met opzet. `email` en `contactType` bepalen of en in
 * welke campagne iemand terechtkomt; daar mag geen oude waarde blijven hangen.
 * `name` is NOT NULL en heeft altijd een waarde. `crmContactId` is de koppeling.
 */
export const CRM_VELDEN_ALTIJD = [
  'name', 'email', 'contactType', 'crmContactId',
] as const;

/**
 * Velden die het CRM alleen mag vullen, niet leegmaken.
 *
 * Reden: veel van deze gegevens kwamen uit een Apollo- of CSV-import en staan
 * daar rijker in dan in het CRM. Een CRM-contactpersoon zonder functietitel mag
 * niet de functietitel wissen die uit de import kwam — die wordt gebruikt in de
 * aanhef en in de segmentering. Leeg in het CRM betekent hier "geen mening",
 * niet "maak leeg".
 */
export const CRM_VELDEN_INDIEN_GEVULD = [
  'voornaam', 'achternaam', 'company', 'function', 'stad', 'branche',
] as const;

/** Alle velden die het CRM bezit. */
export const CRM_VELDEN = [
  ...CRM_VELDEN_ALTIJD, ...CRM_VELDEN_INDIEN_GEVULD,
] as const;

/**
 * Velden die tijdens het mailen ontstaan en hier nooit geschreven worden.
 * Staat hier als lijst zodat de test hem kan controleren — een nieuw veld dat
 * per ongeluk in CRM_VELDEN belandt, valt dan meteen op.
 */
export const VERZENDVELDEN = [
  'unsubscribed', 'unsubscribedAt', 'contactStatus', 'phase',
  'bounceStatus', 'lastBounceAt', 'bounceReden', 'spamReported', 'spamReportedAt',
  'lastReplyAt', 'whatsappOptInStatus', 'whatsappOptInChangedAt', 'whatsappOptInReason',
  'customTags', 'taal', 'notes', 'telefoonOriginal',
] as const;

/** CRM-type → branche zoals de campagnefilters hem kennen. */
export const BRANCHE_PER_TYPE: Record<string, string> = {
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  cateraar: 'Cateraar',
  eventlocatie: 'Evenementenlocatie',
  logistiek: 'Logistiek',
};

export interface CrmBedrijfInvoer {
  id: number;
  name?: string | null;
  type?: string | null;
  isClient?: boolean | null;
  city?: string | null;
}

export interface CrmContactInvoer {
  id: number;
  companyId: number;
  name?: string | null;
  function?: string | null;
  email?: string | null;
  phone?: string | null;
}

/**
 * De CRM-velden zoals ze op een prospect_contacts-rij terechtkomen.
 *
 * Bewust een `type` en geen `interface`: alleen een type-alias krijgt van
 * TypeScript een impliciete indexsignatuur, en zonder die signatuur mag
 * `verschil()` hem niet als Record<string, unknown> doorlopen.
 */
export type MailVelden = {
  name: string;
  voornaam: string | null;
  achternaam: string | null;
  email: string;
  company: string | null;
  function: string | null;
  stad: string | null;
  branche: string | null;
  contactType: 'klant' | 'prospect';
  crmContactId: number;
};

/**
 * Is dit een e-mailadres waar je iets naartoe kunt sturen?
 *
 * Bewust ruim: één @, iets ervoor, en achter de punt minstens twee letters.
 * Strenger controleren op vorm levert vooral valse afwijzingen op; of een adres
 * echt bestaat merk je toch pas aan de bounce.
 *
 * Wel expliciet geweigerd: het verzonnen adres dat de WhatsApp-koppeling maakt
 * voor nummers zonder e-mail. Dat is geen adres, dat is een plaatshouder.
 */
export function geldigEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const e = email.trim().toLowerCase();
  if (!e || e.length > 254) return false;
  if (e.endsWith('@onbekend.local')) return false;
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/.test(e);
}

/** Genormaliseerde sleutel om op e-mailadres te kunnen vergelijken. */
export function emailSleutel(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

/**
 * Splitst "Lars Schrijnemakers" in een voor- en achternaam.
 *
 * Tussenvoegsels horen bij de achternaam: "Jan van der Berg" wordt "Jan" +
 * "van der Berg". Dat is niet alleen netter, het is ook wat je in een aanhef
 * wilt zien. Eén woord betekent alleen een voornaam — bij "Beste {{voornaam}},"
 * is dat het bruikbare deel.
 */
const TUSSENVOEGSELS = new Set([
  'van', 'de', 'den', 'der', 'het', 'ten', 'ter', 'te', 'op', 'aan', 'in',
  "'t", 'du', 'des', 'la', 'le', 'di', 'da', 'von', 'zu',
]);

export function splitsNaam(naam: unknown): { voornaam: string | null; achternaam: string | null } {
  const schoon = typeof naam === 'string' ? naam.replace(/\s+/g, ' ').trim() : '';
  if (!schoon) return { voornaam: null, achternaam: null };

  // "Schrijnemakers, Lars" — komt uit exports voor.
  if (schoon.includes(',')) {
    const [achter, voor] = schoon.split(',', 2).map((s) => s.trim());
    if (voor && achter) return { voornaam: voor, achternaam: achter };
  }

  const delen = schoon.split(' ');
  if (delen.length === 1) return { voornaam: delen[0], achternaam: null };

  // Alles vanaf het eerste tussenvoegsel hoort bij de achternaam.
  let grens = 1;
  for (let i = 1; i < delen.length; i++) {
    if (TUSSENVOEGSELS.has(delen[i].toLowerCase())) { grens = i; break; }
    grens = delen.length - 1;
  }
  return {
    voornaam: delen.slice(0, grens).join(' ') || null,
    achternaam: delen.slice(grens).join(' ') || null,
  };
}

/** CRM-type naar branche. Onbekend type geeft null — dan liever geen branche. */
export function brancheUitType(type: unknown): string | null {
  if (typeof type !== 'string') return null;
  return BRANCHE_PER_TYPE[type.trim().toLowerCase()] ?? null;
}

/**
 * Gokt een functiegroep uit een vrije functietitel.
 *
 * Dit is een gok en wordt daarom alleen gebruikt om een leeg veld te vullen,
 * nooit om een keuze van een mens te overschrijven. "Director of Food and
 * Beverage" wordt Bediening; dat klopt vaak, maar niet altijd, en dat is precies
 * waarom het veld daarna met rust gelaten wordt.
 */
const FUNCTIE_SLEUTELS: Array<[RegExp, string]> = [
  // \w* achter de stam, want "Housekeeping" en "Logistics" zijn verbuigingen
  // van "housekeep" en "logistic". Met een \b erachter matcht er niets.
  [/\b(chef|kok|cook|kitchen|keuken|culinair|sous)\w*/i, 'Chef'],
  [/\b(housekeep|huishoud|kamermeisje|room ?division|linnen|schoonmaak)\w*/i, 'Housekeeping'],
  [/\b(logistiek|logistic|warehouse|magazijn|transport|chauffeur|driver)\w*/i, 'Logistiek'],
  [/\b(f ?& ?b|food|beverage|bediening|service|banquet|restaurant|bar|front ?office|reception|receptie|horeca)\w*/i, 'Bediening'],
];

export function functiegroepUitFunctie(functie: unknown): string | null {
  if (typeof functie !== 'string' || !functie.trim()) return null;
  for (const [patroon, groep] of FUNCTIE_SLEUTELS) {
    if (patroon.test(functie)) return groep;
  }
  return null;
}

/**
 * Zet een CRM-contactpersoon om naar de velden van een verzendcontact.
 *
 * Geeft null als er geen bruikbaar e-mailadres is. Zo'n contactpersoon hoort
 * gewoon in het CRM te blijven staan — je kunt hem alleen niet mailen, en dan
 * heeft een rij in de verzendlijst geen zin.
 */
export function mailVeldenUitCrm(
  bedrijf: CrmBedrijfInvoer,
  contact: CrmContactInvoer,
): MailVelden | null {
  if (!geldigEmail(contact.email)) return null;

  const { voornaam, achternaam } = splitsNaam(contact.name);
  const naam = typeof contact.name === 'string' ? contact.name.trim() : '';

  return {
    // Zonder naam is het e-mailadres het enige wat je kunt tonen; het veld is
    // NOT NULL, dus leeg laten kan niet.
    name: naam || emailSleutel(contact.email),
    voornaam,
    achternaam,
    email: emailSleutel(contact.email),
    company: (bedrijf.name ?? '').trim() || null,
    function: (contact.function ?? '').trim() || null,
    stad: (bedrijf.city ?? '').trim() || null,
    branche: brancheUitType(bedrijf.type),
    contactType: bedrijf.isClient ? 'klant' : 'prospect',
    crmContactId: contact.id,
  };
}

/**
 * Wat moet er bijgewerkt worden aan een bestaande verzendrij?
 *
 * Geeft alleen de velden terug die daadwerkelijk anders zijn, zodat een
 * synchronisatie zonder wijzigingen geen enkele UPDATE doet. Verzendvelden
 * komen hier per definitie niet in voor: `gewenst` bevat ze niet.
 */
export function verschil(
  bestaand: Record<string, unknown>,
  gewenst: MailVelden,
): Partial<MailVelden> {
  const uit: Record<string, unknown> = {};

  const anders = (veld: string) => {
    const nieuw = (gewenst as Record<string, unknown>)[veld];
    const oud = bestaand?.[veld];
    // null en '' betekenen hier hetzelfde: niets ingevuld.
    if ((oud ?? '') === '' && (nieuw ?? '') === '') return false;
    return (oud ?? null) !== (nieuw ?? null);
  };

  for (const veld of CRM_VELDEN_ALTIJD) {
    if (anders(veld)) uit[veld] = (gewenst as Record<string, unknown>)[veld];
  }
  for (const veld of CRM_VELDEN_INDIEN_GEVULD) {
    const nieuw = (gewenst as Record<string, unknown>)[veld];
    if ((nieuw ?? '') === '') continue;   // leeg in het CRM = geen mening
    if (anders(veld)) uit[veld] = nieuw;
  }
  return uit as unknown as Partial<MailVelden>;
}

/**
 * Velden die alleen ingevuld worden als ze nog leeg zijn.
 *
 * De functiegroep is een gok (zie hierboven) en het telefoonnummer wordt door
 * de WhatsApp-koppeling naar E.164 genormaliseerd — allebei mag je niet
 * overschrijven met wat er toevallig in het CRM staat.
 */
export function aanvullingen(
  bestaand: Record<string, unknown>,
  contact: CrmContactInvoer,
): Record<string, unknown> {
  const uit: Record<string, unknown> = {};
  if (!bestaand?.functiegroep) {
    const gok = functiegroepUitFunctie(contact.function);
    if (gok) uit.functiegroep = gok;
  }
  const telefoon = (contact.phone ?? '').trim();
  if (!bestaand?.telefoon && telefoon) uit.telefoon = telefoon;
  return uit;
}

/**
 * De velden die een nieuwe verzendrij meekrijgt bovenop de CRM-velden.
 *
 * Dit zijn verzendvelden, en die worden hier dus alleen bij het aanmaken gezet —
 * daarna nooit meer. De pijplijnfase volgt bij het aanmaken wel de herkomst:
 * iemand die als bestaande klant in het CRM staat, begint niet als "nieuw".
 */
export function beginwaarden(
  contact: CrmContactInvoer,
  contactType: 'klant' | 'prospect' = 'prospect',
): Record<string, unknown> {
  const gok = functiegroepUitFunctie(contact.function);
  const telefoon = (contact.phone ?? '').trim();
  return {
    source: 'crm',
    taal: 'Nederlands',
    contactStatus: 'actief',
    phase: contactType === 'klant' ? 'klant' : 'nieuw',
    unsubscribed: false,
    ...(gok ? { functiegroep: gok } : {}),
    ...(telefoon ? { telefoon } : {}),
  };
}
