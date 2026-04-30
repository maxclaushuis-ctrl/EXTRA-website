// ─── Apollo.io CSV Import (Blok 5) ───────────────────────────────────────────
// Parseert Apollo-export bestanden en mapt de standaard Apollo-kolommen
// (First Name, Last Name, Title, Company, Email, Industry, City, …) naar
// EXTRA prospect_contacts. Detecteert tegelijk de juiste FUNCTIEGROEP
// (Bediening | Chef | Housekeeping | Logistiek) op basis van de Title-kolom
// zodat contacten meteen klaarstaan voor de jaarcampagne.

import { storage } from './storage';
import { FUNCTIEGROEPEN, type Functiegroep, type InsertProspectContact } from '@shared/schema';

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

// Excel zet voor lange numerieke velden vaak een ' (apostrof) zodat het niet
// als getal wordt geïnterpreteerd. Strip die prefix + omringende whitespace.
function schoonTelefoon(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const t = v.replace(/^['`\s]+/, '').trim();
  return t.length > 0 ? t : undefined;
}

export function normaliseerRij(
  row: Record<string, string>,
  extraMapping?: Record<string, keyof NormApolloRow>,
): NormApolloRow {
  const norm: NormApolloRow = {};
  for (const [origKey, val] of Object.entries(row)) {
    const lower = origKey.toLowerCase().trim();
    const sysField = APOLLO_HEADER_MAP[lower] ?? extraMapping?.[lower];
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
  // Telefoonnummers schoonmaken (Excel ' prefix)
  norm.telefoon = schoonTelefoon(norm.telefoon);
  norm.telefoonBedrijf = schoonTelefoon(norm.telefoonBedrijf);
  return norm;
}

// ─── 2b. AI-fallback: herken onbekende headers ───────────────────────────────
// Wanneer Apollo (of een andere tool) niet-standaard kolomnamen exporteert die
// niet in APOLLO_HEADER_MAP staan, vraag GPT om de mapping voor te stellen.
// Cache binnen één request om dubbele AI-calls te voorkomen.
const SYS_FIELDS: Array<keyof NormApolloRow> = [
  'voornaam','achternaam','naam','functietitel','bedrijf','email','emailStatus',
  'branche','stad','regio','land','telefoon','telefoonBedrijf','linkedin','website','seniority','departments',
];

export async function aiHeaderMapping(headers: string[]): Promise<Record<string, keyof NormApolloRow>> {
  const onbekend = headers.filter(h => !APOLLO_HEADER_MAP[h.toLowerCase().trim()]);
  if (onbekend.length === 0) return {};

  let OpenAI: any;
  try { OpenAI = (await import('openai')).default; } catch { return {}; }
  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) return {};

  const client = new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? 'unused',
  });

  const prompt = `Je krijgt een lijst CSV-kolomnamen uit een contact-export tool (Apollo, HubSpot, etc.).
Map ELKE kolom naar exact één van deze interne velden, of null als de kolom niet relevant is voor een contact-import:
${SYS_FIELDS.join(', ')}.

Belangrijk: alleen contactgegevens herkennen. Negeer financiële velden, datums, scores, etc. → null.

Kolommen om te mappen:
${onbekend.map((h, i) => `${i + 1}. "${h}"`).join('\n')}

Antwoord ALLEEN met JSON in dit formaat (geen uitleg, geen markdown):
{"mapping": {"<originele kolomnaam>": "<intern veld of null>"}}`;

  try {
    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Je bent een datamappings-expert. Antwoord uitsluitend met geldige JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });
    const raw = resp.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    const mapping: Record<string, keyof NormApolloRow> = {};
    for (const [k, v] of Object.entries(parsed.mapping || {})) {
      if (typeof v === 'string' && SYS_FIELDS.includes(v as any)) {
        mapping[k.toLowerCase().trim()] = v as keyof NormApolloRow;
      }
    }
    return mapping;
  } catch (err: any) {
    console.warn('[apollo-import] AI header mapping failed:', err?.message);
    return {};
  }
}

// ─── 3. Functiegroep-detectie op basis van Title ─────────────────────────────
// Mapt Apollo job titles naar 1 van de 4 vaste FUNCTIEGROEPEN. Deze groepen
// worden door de e-mailcampagne gebruikt om het juiste segment te selecteren.
// Volgorde is belangrijk: specifiekere patronen vóór algemenere.
//
// Helper: F&B kan geschreven worden als "F&B", "F & B", "Food & Beverage",
// "Food and Beverage" of "Food Beverage". Dit fragment vangt alle varianten.
const FB = /(?:\bf\s*&\s*b\b|food\s*(?:&|and|\s)\s*beverage)/i;

const FUNCTIEGROEP_PATTERNS: Array<{ groep: Functiegroep; patterns: RegExp[] }> = [
  // Chef-keuken (kookprofessionals) — eerst, want "Chef" kan ook in "Chef de Réception" voorkomen
  { groep: 'Chef', patterns: [
      /executive\s*chef/i, /head\s*chef/i, /chef\s*de\s*cuisine/i, /chef[-\s]?kok/i,
      /\bsous[-\s]?chef/i, /\bgastronomic\b/i, /culinary\s*director/i,
      /\bcook\b/i, /\bkok\b/i, /\bcommis\b/i, /chef\s*de\s*partie/i,
      /demi[-\s]?chef/i, /\bgrillmaster/i, /\bpastry\s*chef/i, /\bbanquet\s*chef/i,
  ]},
  // Housekeeping (kamermeisjes, schoonmaak)
  { groep: 'Housekeeping', patterns: [
      /housekeep/i, /huishoud/i, /\bcamerista\b/i, /\broom\s*attendant/i,
      /\blinen\s*manager/i, /\blaundry\s*manager/i,
  ]},
  // Logistiek (catering- en evenementenlogistiek, voorraadbeheer)
  { groep: 'Logistiek', patterns: [
      /\blogistic/i, /\blogistiek/i, /warehouse/i, /\bmagazijn/i,
      /\borderpicker/i, /\bsupply\s*chain/i, /\binventory/i, /voorraad/i,
  ]},
  // Bediening (alles servicegericht: F&B, restaurant, banqueting, receptie, front office)
  { groep: 'Bediening', patterns: [
      new RegExp(`${FB.source}.*director`, 'i'),
      new RegExp(`director\\s+of\\s+${FB.source}`, 'i'),
      new RegExp(`(?:deputy|assistant)\\s+director\\s+of\\s+${FB.source}`, 'i'),
      new RegExp(`${FB.source}.*manager`, 'i'),
      new RegExp(`(?:assistant|deputy)\\s+${FB.source}\\s+manager`, 'i'),
      /\bbanquet/i, /\bevents?\s*manager/i, /\bgroup\s*&?\s*events/i, /banket/i,
      /\bm\s*&\s*e\s+manager/i, /meetings?\s*&?\s*events?/i,
      /restaurant\s*manager/i, /restaurantmanager/i, /\boutlet\s*manager/i, /bedrijfsleider/i,
      /floor\s*manager/i, /floormanager/i, /shift\s*leader/i, /\bsupervisor\b/i,
      /\bwaiter\b/i, /\bwaitress\b/i, /\bserver\b/i, /\bbarista\b/i, /\bbartender\b/i,
      /front\s*office/i, /\breceptie\b/i, /\breception(?:ist)?\b/i, /front\s*desk/i, /night\s*audit/i,
      /\bhost(?:ess)?\b/i, /\bguest\s*relations/i, /\bconcierge\b/i,
  ]},
];

export function detecteerFunctiegroep(title: string | undefined): Functiegroep | null {
  if (!title) return null;
  for (const { groep, patterns } of FUNCTIEGROEP_PATTERNS) {
    if (patterns.some(p => p.test(title))) return groep;
  }
  return null;
}

// ─── 4. Preview-statistieken ─────────────────────────────────────────────────

export interface ApolloPreviewRij extends NormApolloRow {
  functiegroep: Functiegroep | null;
  isDubbel: boolean;
  isOngeldigEmail: boolean;
}

export interface ApolloPreviewResultaat {
  totaal: number;
  geldigNieuw: number;
  dubbelInDb: number;
  dubbelInBestand: number;
  ongeldigEmail: number;
  zonderFunctiegroep: number;
  perFunctiegroep: Array<{ groep: Functiegroep; aantal: number }>;
  perBranche: Array<{ branche: string; aantal: number }>;
  voorbeelden: ApolloPreviewRij[];   // eerste 50 rijen, voor tabel-preview
  alleNormRijen: ApolloPreviewRij[]; // volledig, gaat ook door naar commit
  // Header-diagnostiek
  totaalKolommen: number;
  herkendeKolommen: number;
  herkendeMapping: Array<{ kolom: string; veld: string; bron: 'standaard' | 'ai' }>;
  niegmappedKolommen: string[];
  aiGebruikt: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function maakPreview(csvText: string): Promise<ApolloPreviewResultaat> {
  const { headers, rows: ruweRijen } = parseCsv(csvText);
  const bestaande = await storage.getProspectContacts({});
  const bestaandeEmails = new Set(bestaande.map(b => b.email.toLowerCase()));

  // AI-fallback: probeer onbekende headers via GPT te mappen
  const onbekendeHeaders = headers.filter(h => !APOLLO_HEADER_MAP[h.toLowerCase().trim()]);
  let aiMapping: Record<string, keyof NormApolloRow> = {};
  let aiGebruikt = false;
  if (onbekendeHeaders.length > 0) {
    aiMapping = await aiHeaderMapping(headers);
    aiGebruikt = Object.keys(aiMapping).length > 0;
  }

  // Bouw mapping-overzicht voor diagnostiek in de UI
  const herkendeMapping: Array<{ kolom: string; veld: string; bron: 'standaard' | 'ai' }> = [];
  const niegmappedKolommen: string[] = [];
  for (const h of headers) {
    const lower = h.toLowerCase().trim();
    if (APOLLO_HEADER_MAP[lower]) {
      herkendeMapping.push({ kolom: h, veld: APOLLO_HEADER_MAP[lower], bron: 'standaard' });
    } else if (aiMapping[lower]) {
      herkendeMapping.push({ kolom: h, veld: aiMapping[lower], bron: 'ai' });
    } else {
      niegmappedKolommen.push(h);
    }
  }

  const emailsInBestand = new Set<string>();
  const norm: ApolloPreviewRij[] = [];
  let dubbelInDb = 0, dubbelInBestand = 0, ongeldigEmail = 0, zonderGroep = 0, geldigNieuw = 0;
  const groepTeller = new Map<Functiegroep, number>();
  const brancheTeller = new Map<string, number>();

  for (const ruw of ruweRijen) {
    const r = normaliseerRij(ruw, aiMapping);
    const email = (r.email || '').toLowerCase().trim();
    const groep = detecteerFunctiegroep(r.functietitel);

    let dub = false, ong = false;
    if (!email || !EMAIL_RE.test(email)) { ongeldigEmail++; ong = true; }
    else if (bestaandeEmails.has(email)) { dubbelInDb++; dub = true; }
    else if (emailsInBestand.has(email)) { dubbelInBestand++; dub = true; }
    else { emailsInBestand.add(email); geldigNieuw++; }

    if (!groep && !ong && !dub) zonderGroep++;
    if (groep) groepTeller.set(groep, (groepTeller.get(groep) || 0) + 1);
    if (r.branche) brancheTeller.set(r.branche, (brancheTeller.get(r.branche) || 0) + 1);

    norm.push({ ...r, functiegroep: groep, isDubbel: dub, isOngeldigEmail: ong });
  }

  const perFunctiegroep = FUNCTIEGROEPEN
    .map(g => ({ groep: g, aantal: groepTeller.get(g) || 0 }))
    .filter(x => x.aantal > 0)
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
    zonderFunctiegroep: zonderGroep,
    perFunctiegroep,
    perBranche,
    voorbeelden: norm.slice(0, 50),
    alleNormRijen: norm,
    totaalKolommen: headers.length,
    herkendeKolommen: herkendeMapping.length,
    herkendeMapping,
    niegmappedKolommen,
    aiGebruikt,
  };
}

// ─── 5. Commit-import ─────────────────────────────────────────────────────────

export interface ApolloCommitOpties {
  alleenGeverifieerd?: boolean;     // skip rijen met emailStatus !== 'Verified'
  branchefilter?: string[];         // alleen rijen waarvan branche in deze lijst zit
  defaultPhase?: string;            // default 'nieuw'
  defaultFunctiegroep?: Functiegroep | null; // override voor rijen zonder auto-detectie
}

export interface ApolloCommitResultaat {
  aangemaakt: number;
  overgeslagen: number;
  fouten: string[];
  perFunctiegroep: Array<{ groep: Functiegroep; aantal: number }>;
}

export async function commitImport(
  rijen: ApolloPreviewRij[],
  opties: ApolloCommitOpties = {},
): Promise<ApolloCommitResultaat> {
  const bestaande = await storage.getProspectContacts({});
  const bestaandeEmails = new Set(bestaande.map(b => b.email.toLowerCase()));
  const fouten: string[] = [];
  const groepTeller = new Map<Functiegroep, number>();
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

    // Functiegroep: gedetecteerd uit title, anders fallback uit opties
    const functiegroep: Functiegroep | null = r.functiegroep || opties.defaultFunctiegroep || null;

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
      functiegroep,
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
      await storage.createProspectContact(insertData);
      aangemaakt++;
      bestaandeEmails.add(email);
      if (functiegroep) groepTeller.set(functiegroep, (groepTeller.get(functiegroep) || 0) + 1);
    } catch (err: any) {
      fouten.push(`Insert mislukt voor ${email}: ${err?.message || 'onbekend'}`);
      overgeslagen++;
    }
  }

  const perFunctiegroep = FUNCTIEGROEPEN
    .map(g => ({ groep: g, aantal: groepTeller.get(g) || 0 }))
    .filter(x => x.aantal > 0)
    .sort((a, b) => b.aantal - a.aantal);

  return { aangemaakt, overgeslagen, fouten: fouten.slice(0, 50), perFunctiegroep };
}
