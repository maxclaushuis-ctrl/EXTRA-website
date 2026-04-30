// ─── Apollo.io CSV Import (Blok 5) ───────────────────────────────────────────
// Parseert Apollo-export bestanden en mapt de standaard Apollo-kolommen
// (First Name, Last Name, Title, Company, Email, Industry, City, …) naar
// EXTRA prospect_contacts. Detecteert tegelijk de juiste functietag op basis
// van de Title-kolom zodat contacten meteen klaarstaan voor de jaarcampagne.

import { storage } from './storage';
import type { FunctionTag, InsertProspectContact } from '@shared/schema';

// ─── 1. Robuuste CSV-parser ──────────────────────────────────────────────────
// Apollo escaped quoted velden ("…") en kan komma's in velden bevatten.
// Deze parser ondersteunt RFC4180 quoting + dubbele quote-escape ("").
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Normaliseer regelinvoer en strip BOM
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const records: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inQuotes) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { cur.push(field); field = ''; }
      else if (ch === '\n') { cur.push(field); records.push(cur); cur = []; field = ''; }
      else field += ch;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); records.push(cur); }

  if (records.length === 0) return { headers: [], rows: [] };
  const headers = records[0].map(h => h.trim());
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < records.length; r++) {
    const rec = records[r];
    if (rec.length === 1 && rec[0].trim() === '') continue;
    const row: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      row[headers[c]] = (rec[c] ?? '').trim();
    }
    rows.push(row);
  }
  return { headers, rows };
}

// ─── 2. Apollo header → systeemveld mapping ──────────────────────────────────
// Sleutels zijn lowercase (case-insensitive matching). Apollo's eigen export
// header staat links, ons interne veld staat rechts.
const APOLLO_HEADER_MAP: Record<string, keyof NormApolloRow> = {
  'first name':           'voornaam',
  'firstname':            'voornaam',
  'last name':            'achternaam',
  'lastname':             'achternaam',
  'name':                 'naam',
  'full name':            'naam',
  'title':                'functietitel',
  'job title':            'functietitel',
  'company':              'bedrijf',
  'company name':         'bedrijf',
  'organization':         'bedrijf',
  'email':                'email',
  'email address':        'email',
  'work email':           'email',
  'email status':         'emailStatus',
  'industry':             'branche',
  'industries':           'branche',
  'city':                 'stad',
  'state':                'regio',
  'country':              'land',
  'company country':      'land',
  'mobile phone':         'telefoon',
  'corporate phone':      'telefoon',
  'work direct phone':    'telefoon',
  'company phone':        'telefoonBedrijf',
  'person linkedin url':  'linkedin',
  'linkedin url':         'linkedin',
  'website':              'website',
  'company website':      'website',
  'seniority':            'seniority',
  'departments':          'departments',
};

export interface NormApolloRow {
  voornaam?: string;
  achternaam?: string;
  naam?: string;            // valt terug op First+Last
  functietitel?: string;
  bedrijf?: string;
  email?: string;
  emailStatus?: string;     // Verified / Guessed / Unverified
  branche?: string;
  stad?: string;
  regio?: string;
  land?: string;
  telefoon?: string;
  telefoonBedrijf?: string;
  linkedin?: string;
  website?: string;
  seniority?: string;
  departments?: string;
}

export function normaliseerRij(row: Record<string, string>): NormApolloRow {
  const norm: NormApolloRow = {};
  for (const [origKey, val] of Object.entries(row)) {
    const sysField = APOLLO_HEADER_MAP[origKey.toLowerCase().trim()];
    if (sysField && val) {
      (norm as any)[sysField] = val;
    }
  }
  // Naam samenstellen
  if (!norm.naam) {
    const v = (norm.voornaam || '').trim();
    const a = (norm.achternaam || '').trim();
    if (v || a) norm.naam = `${v} ${a}`.trim();
  }
  return norm;
}

// ─── 3. Functietag-detectie op basis van Title ───────────────────────────────
// Volgorde is belangrijk: meer-specifieke patronen eerst (F&B Director vóór
// F&B Manager, Chef vóór Keukenbrigade).
const TAG_KEYWORDS: Array<{ slug: string; patterns: RegExp[] }> = [
  { slug: 'fb-director',         patterns: [/\bf\s*&?\s*b\b.*director/i, /food\s*&?\s*beverage\s*director/i] },
  { slug: 'fb-manager',          patterns: [/\bf\s*&?\s*b\b.*manager/i, /food\s*&?\s*beverage\s*manager/i] },
  { slug: 'banqueting',          patterns: [/\bbanquet/i, /\bevents?\s*manager/i, /\bgroup\s*&?\s*events/i, /banket/i] },
  { slug: 'restaurant-manager',  patterns: [/restaurant\s*manager/i, /restaurantmanager/i, /\boutlet\s*manager/i] },
  { slug: 'floor-manager',       patterns: [/floor\s*manager/i, /floormanager/i, /shift\s*leader/i, /supervisor/i] },
  { slug: 'chef',                patterns: [/executive\s*chef/i, /head\s*chef/i, /chef\s*de\s*cuisine/i, /chef[-\s]?kok/i, /\bsous[-\s]?chef/i, /\bgastronomic\b/i] },
  { slug: 'keukenbrigade',       patterns: [/\bcook\b/i, /\bkok\b/i, /\bcommis\b/i, /chef\s*de\s*partie/i, /demi[-\s]?chef/i, /\bgrillmaster/i] },
  { slug: 'housekeeping',        patterns: [/housekeep/i, /huishoud/i, /\bcamerista\b/i, /\broom\s*attendant/i] },
  { slug: 'receptie',            patterns: [/front\s*office/i, /\breceptie\b/i, /\breception(?:ist)?\b/i, /front\s*desk/i, /night\s*audit/i] },
  { slug: 'algemeen-hotel',      patterns: [/general\s*manager/i, /hotel\s*manager/i, /\bdirecteur\b/i, /\bowner\b/i, /managing\s*director/i] },
];

export function detecteerFunctietagId(title: string | undefined, tags: FunctionTag[]): number | null {
  if (!title) return null;
  for (const { slug, patterns } of TAG_KEYWORDS) {
    if (patterns.some(p => p.test(title))) {
      const tag = tags.find(t => t.slug === slug);
      if (tag) return tag.id;
    }
  }
  return null;
}

// ─── 4. Preview-statistieken ─────────────────────────────────────────────────

export interface ApolloPreviewRij extends NormApolloRow {
  functietagId: number | null;
  functietagNaam: string | null;
  isDubbel: boolean;
  isOngeldigEmail: boolean;
}

export interface ApolloPreviewResultaat {
  totaal: number;
  geldigNieuw: number;
  dubbelInDb: number;
  dubbelInBestand: number;
  ongeldigEmail: number;
  zonderFunctietag: number;
  perTag: Array<{ tagId: number; naam: string; aantal: number }>;
  perBranche: Array<{ branche: string; aantal: number }>;
  voorbeelden: ApolloPreviewRij[];   // eerste 50 rijen, voor tabel-preview
  alleNormRijen: ApolloPreviewRij[]; // volledig, gaat ook door naar commit
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function maakPreview(csvText: string): Promise<ApolloPreviewResultaat> {
  const { rows: ruweRijen } = parseCsv(csvText);
  const tags = await storage.getFunctionTags();
  const bestaande = await storage.getProspectContacts({});
  const bestaandeEmails = new Set(bestaande.map(b => b.email.toLowerCase()));

  const emailsInBestand = new Set<string>();
  const norm: ApolloPreviewRij[] = [];
  let dubbelInDb = 0, dubbelInBestand = 0, ongeldigEmail = 0, zonderTag = 0, geldigNieuw = 0;
  const tagTeller = new Map<number, number>();
  const brancheTeller = new Map<string, number>();

  for (const ruw of ruweRijen) {
    const r = normaliseerRij(ruw);
    const email = (r.email || '').toLowerCase().trim();
    const tagId = detecteerFunctietagId(r.functietitel, tags);
    const tagNaam = tagId ? (tags.find(t => t.id === tagId)?.naam ?? null) : null;

    let dub = false, ong = false;
    if (!email || !EMAIL_RE.test(email)) { ongeldigEmail++; ong = true; }
    else if (bestaandeEmails.has(email)) { dubbelInDb++; dub = true; }
    else if (emailsInBestand.has(email)) { dubbelInBestand++; dub = true; }
    else { emailsInBestand.add(email); geldigNieuw++; }

    if (!tagId && !ong && !dub) zonderTag++;
    if (tagId) tagTeller.set(tagId, (tagTeller.get(tagId) || 0) + 1);
    if (r.branche) brancheTeller.set(r.branche, (brancheTeller.get(r.branche) || 0) + 1);

    norm.push({ ...r, functietagId: tagId, functietagNaam: tagNaam, isDubbel: dub, isOngeldigEmail: ong });
  }

  const perTag = Array.from(tagTeller.entries())
    .map(([tagId, aantal]) => ({ tagId, naam: tags.find(t => t.id === tagId)?.naam ?? '?', aantal }))
    .sort((a, b) => b.aantal - a.aantal);
  const perBranche = Array.from(brancheTeller.entries())
    .map(([branche, aantal]) => ({ branche, aantal }))
    .sort((a, b) => b.aantal - a.aantal)
    .slice(0, 10);

  return {
    totaal: ruweRijen.length,
    geldigNieuw,
    dubbelInDb,
    dubbelInBestand,
    ongeldigEmail,
    zonderFunctietag: zonderTag,
    perTag,
    perBranche,
    voorbeelden: norm.slice(0, 50),
    alleNormRijen: norm,
  };
}

// ─── 5. Commit-import ─────────────────────────────────────────────────────────

export interface ApolloCommitOpties {
  alleenGeverifieerd?: boolean;     // skip rijen met emailStatus !== 'Verified'
  branchefilter?: string[];         // alleen rijen waarvan branche in deze lijst zit
  defaultPhase?: string;            // default 'nieuw'
  extraTagIds?: number[];           // extra functietags die voor ALLE rijen aan-gezet worden
}

export interface ApolloCommitResultaat {
  aangemaakt: number;
  overgeslagen: number;
  fouten: string[];
  perTag: Array<{ tagId: number; naam: string; aantal: number }>;
}

export async function commitImport(
  rijen: ApolloPreviewRij[],
  opties: ApolloCommitOpties = {},
): Promise<ApolloCommitResultaat> {
  const tags = await storage.getFunctionTags();
  const bestaande = await storage.getProspectContacts({});
  const bestaandeEmails = new Set(bestaande.map(b => b.email.toLowerCase()));
  const fouten: string[] = [];
  const tagTeller = new Map<number, number>();
  let aangemaakt = 0, overgeslagen = 0;

  for (const r of rijen) {
    const email = (r.email || '').toLowerCase().trim();
    if (!email || !EMAIL_RE.test(email)) { overgeslagen++; continue; }
    if (bestaandeEmails.has(email)) { overgeslagen++; continue; }
    if (opties.alleenGeverifieerd && r.emailStatus && r.emailStatus.toLowerCase() !== 'verified') {
      overgeslagen++; continue;
    }
    if (opties.branchefilter && opties.branchefilter.length > 0) {
      if (!r.branche || !opties.branchefilter.some(b => r.branche!.toLowerCase().includes(b.toLowerCase()))) {
        overgeslagen++; continue;
      }
    }
    if (!r.naam) { fouten.push(`Naam ontbreekt voor ${email}`); overgeslagen++; continue; }

    const notitieRegels: string[] = [];
    if (r.linkedin) notitieRegels.push(`LinkedIn: ${r.linkedin}`);
    if (r.seniority) notitieRegels.push(`Seniority: ${r.seniority}`);
    if (r.departments) notitieRegels.push(`Departments: ${r.departments}`);
    if (r.regio) notitieRegels.push(`Regio: ${r.regio}`);
    if (r.land) notitieRegels.push(`Land: ${r.land}`);
    if (r.telefoonBedrijf && r.telefoonBedrijf !== r.telefoon) notitieRegels.push(`Bedrijfstel: ${r.telefoonBedrijf}`);
    if (r.website) notitieRegels.push(`Website: ${r.website}`);

    const insertData: InsertProspectContact = {
      name: r.naam,
      email,
      voornaam: r.voornaam || null,
      achternaam: r.achternaam || null,
      function: r.functietitel || null,
      company: r.bedrijf || null,
      stad: r.stad || null,
      telefoon: r.telefoon || null,
      branche: r.branche || null,
      brancheTags: r.branche ? [r.branche] : [],
      functieTags: r.functietitel ? [r.functietitel] : [],
      functiegroep: r.functietagNaam || null,
      taal: 'Nederlands',
      contactType: 'prospect',
      contactStatus: 'actief',
      customTags: '[]',
      notes: notitieRegels.length > 0 ? notitieRegels.join('\n') : null,
      source: 'apollo_import',
      unsubscribed: false,
      unsubscribedAt: null,
      crmContactId: null,
      phase: opties.defaultPhase || 'nieuw',
    } as any;

    try {
      const created = await storage.createProspectContact(insertData);
      aangemaakt++;
      bestaandeEmails.add(email);

      // Functietags koppelen via m2m
      const tagIds = new Set<number>();
      if (r.functietagId) tagIds.add(r.functietagId);
      for (const id of opties.extraTagIds || []) tagIds.add(id);
      if (tagIds.size > 0) {
        const tagIdsArr = Array.from(tagIds);
        try {
          await storage.setProspectContactFunctionTags(created.id, tagIdsArr);
          for (const id of tagIdsArr) tagTeller.set(id, (tagTeller.get(id) || 0) + 1);
        } catch (err) {
          fouten.push(`Functietag-koppeling mislukte voor ${email}`);
        }
      }
    } catch (err: any) {
      fouten.push(`Insert mislukt voor ${email}: ${err?.message || 'onbekend'}`);
      overgeslagen++;
    }
  }

  const perTag = Array.from(tagTeller.entries())
    .map(([tagId, aantal]) => ({ tagId, naam: tags.find(t => t.id === tagId)?.naam ?? '?', aantal }))
    .sort((a, b) => b.aantal - a.aantal);

  return { aangemaakt, overgeslagen, fouten: fouten.slice(0, 50), perTag };
}
