/**
 * WIE KRIJGT DEZE CAMPAGNE? — de pure beslisregels.
 *
 * Uitgelicht uit server/prospectSegmentResolver.ts toen daar een derde manier
 * bij kwam om iemand in een campagne te krijgen. Er zijn er nu drie, en ze
 * kunnen elkaar tegenspreken:
 *
 *   1. de filters van de campagne (branche, functiegroep, type, taal, fase, tags);
 *   2. handmatig toegevoegde contacten, die de filters mogen negeren;
 *   3. handmatig uitgesloten contacten.
 *
 * De volgorde waarin die drie het van elkaar winnen is geen detail — het bepaalt
 * of iemand een mail krijgt die hij niet had moeten krijgen. Daarom staat het
 * hier los, zonder database, met tests ernaast (npm run doelgroep:test).
 *
 * De regels, van sterk naar zwak:
 *
 *   A. Uitgeschreven, geblokkeerd of zonder e-mailadres → nooit. Ook niet als
 *      iemand handmatig is toegevoegd. Dit is de enige regel die niemand met
 *      een klik kan overrulen, en dat hoort zo: een afmelding respecteren is
 *      geen voorkeursinstelling.
 *   B. Handmatig uitgesloten → niet. Ook als het contact óók handmatig is
 *      toegevoegd; een expliciete "nee" weegt zwaarder dan een expliciete "ja".
 *   C. Handmatig toegevoegd → wel, ongeacht de filters.
 *   D. Anders: de filters bepalen het.
 */

/** Alleen de velden die voor de doelgroep meetellen. */
export interface DoelgroepContact {
  id: number;
  email?: string | null;
  contactType?: string | null;
  taal?: string | null;
  branche?: string | null;
  brancheTags?: string[] | null;
  functiegroep?: string | null;
  functieTags?: string[] | null;
  customTags?: string | null;
  phase?: string | null;
  unsubscribed?: boolean | null;
  contactStatus?: string | null;
}

export interface DoelgroepFilters {
  typeFilter?: string | null;
  taalFilter?: string | null;
  brancheFilter?: string[] | null;
  functieFilter?: string[] | null;
  phaseFilter?: string[] | null;
  /** JSON-string met een array, zoals het in de database staat. */
  tagFilter?: string | null;
  excludedContactIds?: number[] | null;
  extraContactIds?: number[] | null;
}

/** Waarom zit dit contact in de lijst? Voor de Ontvangers-tab. */
export type Herkomst = 'segment' | 'handmatig';

function lijst(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

function tagsUit(json: unknown): string[] {
  try {
    const parsed = JSON.parse(String(json ?? '[]'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Regel A: mag dit contact überhaupt mail ontvangen?
 *
 * Losgetrokken omdat het de enige controle is die boven alles gaat en dus
 * nergens per ongeluk overgeslagen mag worden.
 */
export function magMailOntvangen(c: DoelgroepContact): boolean {
  if (!c.email) return false;
  if (c.unsubscribed) return false;
  if (c.contactStatus === 'uitgeschreven' || c.contactStatus === 'geblokkeerd') return false;
  return true;
}

/** Regel D: voldoet dit contact aan de filters van de campagne? */
export function pastInFilters(c: DoelgroepContact, f: DoelgroepFilters): boolean {
  if (f.typeFilter && f.typeFilter !== 'alles' && c.contactType !== f.typeFilter) return false;
  if (f.taalFilter && f.taalFilter !== 'alles' && c.taal !== f.taalFilter) return false;

  const branches = lijst(f.brancheFilter);
  if (branches.length > 0) {
    const heeft = branches.some(b => c.branche === b || lijst(c.brancheTags).includes(b));
    if (!heeft) return false;
  }

  const functies = lijst(f.functieFilter);
  if (functies.length > 0) {
    // Primair: het gestandaardiseerde `functiegroep`-veld. Fallback: de legacy
    // `functieTags`-array voor contacten van vóór april 2026.
    const groep = (c.functiegroep || '').toLowerCase();
    const legacy = lijst(c.functieTags).map(t => (t || '').toLowerCase());
    const gezocht = functies.map(f2 => f2.toLowerCase());
    if (!gezocht.includes(groep) && !gezocht.some(f2 => legacy.includes(f2))) return false;
  }

  const tags = tagsUit(f.tagFilter);
  if (tags.length > 0) {
    const eigen = tagsUit(c.customTags);
    if (!tags.some(t => eigen.includes(t))) return false;
  }

  const fases = lijst(f.phaseFilter);
  if (fases.length > 0 && !fases.includes(c.phase || 'nieuw')) return false;

  return true;
}

export interface DoelgroepRegel {
  contact: DoelgroepContact;
  herkomst: Herkomst;
  uitgesloten: boolean;
}

/**
 * De volledige lijst voor de Ontvangers-tab: iedereen die in beeld is, met
 * herkomst en of hij is uitgesloten. Contacten die sowieso geen mail mogen
 * krijgen (regel A) staan er niet in — die zijn geen keuze.
 */
export function doelgroepMetHerkomst(
  contacten: DoelgroepContact[],
  f: DoelgroepFilters,
): DoelgroepRegel[] {
  const uitgesloten = new Set<number>(Array.isArray(f.excludedContactIds) ? f.excludedContactIds : []);
  const extra = new Set<number>(Array.isArray(f.extraContactIds) ? f.extraContactIds : []);

  const uit: DoelgroepRegel[] = [];
  for (const c of contacten ?? []) {
    if (!magMailOntvangen(c)) continue;
    const handmatig = extra.has(c.id);
    if (!handmatig && !pastInFilters(c, f)) continue;
    uit.push({
      contact: c,
      herkomst: handmatig ? 'handmatig' : 'segment',
      uitgesloten: uitgesloten.has(c.id),
    });
  }
  return uit;
}

/** Wie krijgt de mail daadwerkelijk. */
export function doelgroep(contacten: DoelgroepContact[], f: DoelgroepFilters): DoelgroepContact[] {
  return doelgroepMetHerkomst(contacten, f)
    .filter(r => !r.uitgesloten)
    .map(r => r.contact);
}
