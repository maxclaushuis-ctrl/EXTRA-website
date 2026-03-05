import * as XLSX from 'xlsx';
import { db } from './db';
import { applications } from '@shared/schema';
import { and, eq, sql } from 'drizzle-orm';

// ─── Header normalisation ───────────────────────────────────────────────────
function normalizeHeader(str: string): string {
  return String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// ─── Alias dictionaries per role ────────────────────────────────────────────
const HORECA_ALIASES: Record<string, string[]> = {
  applied_at:       ['tijdstempel', 'datum', 'timestamp', 'tijdstempelvandeinzending'],
  interviewer:      ['wie', 'interviewer'],
  full_name:        ['voornaamaachternaam', 'naam', 'voornaamachternaam', 'volledigenaam'],
  softskills_score: ['softskills', 'softskillsscore'],
  bar_score:        ['barscore', 'bar', 'barvaardigheden'],
  bediening_score:  ['bedieningscore', 'bediening', 'bedieningsvaardigheden'],
  diner_score:      ['dinerscore', 'diner', 'dinervaardigheden'],
  phone:            ['telefoonnummer', 'telefoon', 'tel'],
  language:         ['taal', 'talen', 'language'],
  twv:              ['twv', 'tww', 'tewerkstellingvergunning', 'tewerkstellingvergunningnodig', 'tewerkstellingvergunningnodigchef'],
  city:             ['woonplaats', 'plaats', 'stad'],
  birthdate:        ['geboortedatum', 'gebdat'],
  nationality:      ['nationaliteit'],
  channel:          ['kanaal', 'channel', 'via'],
  email:            ['email', 'emailadres', 'emailadres', 'mailadres', 'eamil'],
};

const HOUSEKEEPING_ALIASES: Record<string, string[]> = {
  applied_at:       ['tijdstempel', 'datum', 'timestamp', 'tijdstempelvandeinzending'],
  interviewer:      ['wie', 'interviewer'],
  full_name:        ['voornaamaachternaam', 'naam', 'voornaamachternaam', 'volledigenaam'],
  indruk_score:     ['indruk', 'indrukscore', 'totaalscore', 'score'],
  phone:            ['telefoonnummer', 'telefoon', 'tel'],
  language:         ['taal', 'talen'],
  twv:              ['twv', 'tww', 'tewerkstellingvergunning'],
  city:             ['woonplaats', 'plaats'],
  birthdate:        ['geboortedatum'],
  nationality:      ['nationaliteit'],
  channel:          ['kanaal'],
  availability:     ['beschikbaarheid'],
  preferred_days:   ['voorkeurwerkdagen', 'werkdagen'],
  preferred_daypart:['voorkeurmomentvandegag', 'voorkeurmomentvanddedag', 'voorkeurmomentvandegdag',
                     'voorkeurmomentvanddag', 'voorkeurmomentvandedag'],
};

const CHEF_ALIASES: Record<string, string[]> = {
  applied_at:       ['tijdstempel', 'datum', 'timestamp', 'tijdstempelvandeinzending'],
  interviewer:      ['wie', 'interviewer'],
  full_name:        ['voornaamaachternaam', 'naam', 'voornaamachternaam', 'volledigenaam'],
  totaalscore:      ['totaalscore', 'score', 'totaalscore'],
  phone:            ['telefoonnummer', 'telefoon', 'tel'],
  language:         ['taal', 'talen'],
  twv:              ['twv', 'tww', 'tewerkstellingvergunning'],
  city:             ['woonplaats', 'plaats'],
  birthdate:        ['geboortedatum'],
  nationality:      ['nationaliteit'],
  channel:          ['kanaal'],
  email:            ['email', 'emailadres', 'mailadres'],
};

const ROLE_ALIASES: Record<string, Record<string, string[]>> = {
  horeca:       HORECA_ALIASES,
  housekeeping: HOUSEKEEPING_ALIASES,
  chef:         CHEF_ALIASES,
};

const SHEET_NAMES: Record<string, string[]> = {
  horeca:       ['Horecamedewerker', 'Horeca', 'Horecamedewerkers'],
  housekeeping: ['Housekeeping'],
  chef:         ['Chef', 'Chefs'],
};

// ─── Score parsing ───────────────────────────────────────────────────────────
export function parseScore(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.includes('%')) {
      const n = parseInt(trimmed);
      return isNaN(n) ? null : Math.min(100, Math.max(0, n));
    }
    const n = parseFloat(trimmed);
    if (isNaN(n)) return null;
    if (n >= 0 && n <= 1) return Math.round(n * 100);
    if (n >= 1 && n <= 100) return Math.round(n);
    return null;
  }
  if (typeof value === 'number') {
    if (value >= 0 && value <= 1) return Math.round(value * 100);
    if (value >= 1 && value <= 100) return Math.round(value);
  }
  return null;
}

// ─── Date parsing ────────────────────────────────────────────────────────────
function parseDate(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const d = new Date(date.y, date.m - 1, date.d, date.H || 0, date.M || 0, date.S || 0);
      return d.toISOString();
    }
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return null;
    const iso = new Date(s);
    if (!isNaN(iso.getTime())) return iso.toISOString();
    const nlMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (nlMatch) {
      const d = new Date(Number(nlMatch[3]), Number(nlMatch[2]) - 1, Number(nlMatch[1]));
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
  }
  return null;
}

// ─── TWV parsing ─────────────────────────────────────────────────────────────
function parseTwv(value: any): boolean {
  if (value === null || value === undefined || value === '') return false;
  const s = String(value).trim().toLowerCase();
  return ['ja', 'yes', '1', 'true', 'j'].includes(s);
}

// ─── Phone normalisation ─────────────────────────────────────────────────────
function normalizePhone(value: any): string | null {
  if (!value) return null;
  return String(value).trim().replace(/\s+/g, ' ');
}

// ─── Column mapping ──────────────────────────────────────────────────────────
function buildColumnMapping(
  headers: string[],
  aliases: Record<string, string[]>
): { mapping: Record<string, string>; missing: string[] } {
  const normToOrig: Record<string, string> = {};
  for (const h of headers) {
    normToOrig[normalizeHeader(h)] = h;
  }

  const mapping: Record<string, string> = {};

  for (const [field, aliasList] of Object.entries(aliases)) {
    let found = false;
    for (const alias of aliasList) {
      const normAlias = normalizeHeader(alias);
      if (normToOrig[normAlias]) {
        mapping[field] = normToOrig[normAlias];
        found = true;
        break;
      }
      for (const [normH, origH] of Object.entries(normToOrig)) {
        if (normH.includes(normAlias) || normAlias.includes(normH)) {
          mapping[field] = origH;
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }

  const missing = Object.keys(aliases).filter(f => !mapping[f]);
  return { mapping, missing };
}

// ─── Row normalisation ───────────────────────────────────────────────────────
function normalizeRow(
  rawRow: Record<string, any>,
  mapping: Record<string, string>,
  role: string
): Record<string, any> {
  const get = (field: string) => {
    const col = mapping[field];
    return col ? rawRow[col] : undefined;
  };

  const fullName = String(get('full_name') || '').trim();
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(' ') || null;

  const result: Record<string, any> = {
    firstName,
    lastName,
    fullName,
    email: get('email') ? String(get('email')).trim().toLowerCase() : null,
    phone: normalizePhone(get('phone')),
    city: get('city') ? String(get('city')).trim() : null,
    interviewer: get('interviewer') ? String(get('interviewer')).trim() : null,
    nationality: get('nationality') ? String(get('nationality')).trim() : null,
    language: get('language') ? String(get('language')).trim() : null,
    channel: get('channel') ? String(get('channel')).trim() : null,
    birthdate: parseDate(get('birthdate')),
    appliedAt: parseDate(get('applied_at')),
    twv: parseTwv(get('twv')),
    rawJson: rawRow,
  };

  if (role === 'horeca') {
    result.softskillsScore = parseScore(get('softskills_score'));
    result.barScore = parseScore(get('bar_score'));
    result.bedieningScore = parseScore(get('bediening_score'));
    result.dinerScore = parseScore(get('diner_score'));
  } else if (role === 'housekeeping') {
    result.indrukScore = parseScore(get('indruk_score'));
  } else if (role === 'chef') {
    result.totaalscore = parseScore(get('totaalscore'));
  }

  return result;
}

// ─── Unique key for dedup ────────────────────────────────────────────────────
function buildDedupeKey(row: Record<string, any>, role: string): string {
  const datePart = row.appliedAt ? row.appliedAt.substring(0, 10) : 'unknown';
  if (row.email) return `${role}|email:${row.email}|${datePart}`;
  if (row.phone) return `${role}|phone:${row.phone}|${datePart}`;
  return `${role}|name:${row.fullName?.toLowerCase()}|bd:${row.birthdate || ''}|city:${row.city?.toLowerCase() || ''}|${datePart}`;
}

// ─── Parse XLSX buffer ───────────────────────────────────────────────────────
export function parseXlsx(buffer: Buffer, role: string): {
  sheetFound: boolean;
  sheetName: string;
  availableSheets: string[];
  headers: string[];
  mapping: Record<string, string>;
  missing: string[];
  rows: Record<string, any>[];
} {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const availableSheets = wb.SheetNames;

  const candidates = SHEET_NAMES[role] || [];
  let sheetName = '';
  for (const candidate of candidates) {
    if (availableSheets.some(s => s.toLowerCase() === candidate.toLowerCase())) {
      sheetName = availableSheets.find(s => s.toLowerCase() === candidate.toLowerCase())!;
      break;
    }
  }
  if (!sheetName && availableSheets.length === 1) sheetName = availableSheets[0];

  if (!sheetName) {
    return { sheetFound: false, sheetName: '', availableSheets, headers: [], mapping: {}, missing: [], rows: [] };
  }

  const ws = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { raw: true, defval: null });

  if (rawRows.length === 0) {
    return { sheetFound: true, sheetName, availableSheets, headers: [], mapping: {}, missing: [], rows: [] };
  }

  const headers = Object.keys(rawRows[0]);
  const aliases = ROLE_ALIASES[role] || {};
  const { mapping, missing } = buildColumnMapping(headers, aliases);

  const rows = rawRows
    .filter(r => {
      const vals = Object.values(r).filter(v => v !== null && v !== undefined && v !== '');
      return vals.length > 0;
    })
    .map(r => normalizeRow(r, mapping, role));

  return { sheetFound: true, sheetName, availableSheets, headers, mapping, missing, rows };
}

// ─── Map role row to DB record ────────────────────────────────────────────────
function rowToDbRecord(row: Record<string, any>, role: string, batchId: string) {
  const functionType = role === 'horeca' ? 'horecamedewerker' : role;
  const formData: Record<string, any> = {
    birthDate: row.birthdate || null,
    nationality: row.nationality || null,
    languages: row.language ? [row.language] : [],
    needsWorkPermit: row.twv ? 'ja' : 'nee',
    channel: row.channel || null,
    source: 'xlsx_import',
  };

  const record: Record<string, any> = {
    functionType,
    interviewer: row.interviewer || null,
    status: 'nieuw',
    firstName: row.firstName || null,
    lastName: row.lastName || null,
    email: row.email || null,
    phone: row.phone || null,
    city: row.city || null,
    formData,
    source: 'xlsx_import',
    importBatchId: batchId,
    createdAt: row.appliedAt ? new Date(row.appliedAt) : new Date(),
  };

  if (role === 'horeca') {
    record.softskillsScore = row.softskillsScore ?? null;
    record.barScore = row.barScore ?? null;
    record.bedieningScore = row.bedieningScore ?? null;
    record.dinerScore = row.dinerScore ?? null;
  } else if (role === 'housekeeping') {
    record.softskillsScore = row.indrukScore ?? null;
  } else if (role === 'chef') {
    record.softskillsScore = row.totaalscore ?? null;
  }

  return record;
}

// ─── Preview endpoint handler ─────────────────────────────────────────────────
export async function previewImport(buffer: Buffer, role: string) {
  const parsed = parseXlsx(buffer, role);
  if (!parsed.sheetFound) {
    return {
      error: `Sheet voor '${role}' niet gevonden. Beschikbare sheets: ${parsed.availableSheets.join(', ')}`,
    };
  }
  return {
    sheetName: parsed.sheetName,
    availableSheets: parsed.availableSheets,
    columnMapping: parsed.mapping,
    missingFields: parsed.missing,
    totalRows: parsed.rows.length,
    previewRows: parsed.rows.slice(0, 10),
  };
}

// ─── Commit endpoint handler ──────────────────────────────────────────────────
export async function commitImport(buffer: Buffer, role: string, batchId: string) {
  const parsed = parseXlsx(buffer, role);
  if (!parsed.sheetFound) {
    return {
      error: `Sheet voor '${role}' niet gevonden. Beschikbare sheets: ${parsed.availableSheets.join(', ')}`,
    };
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors: { row: number; reason: string }[] = [];

  const seenKeys = new Set<string>();

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i];
    try {
      if (!row.firstName && !row.lastName && !row.email && !row.phone) {
        skipped++;
        continue;
      }

      const dedupeKey = buildDedupeKey(row, role);
      if (seenKeys.has(dedupeKey)) {
        skipped++;
        continue;
      }
      seenKeys.add(dedupeKey);

      const record = rowToDbRecord(row, role, batchId);

      const existing = await findExisting(row, role);

      if (existing) {
        await db.update(applications)
          .set({
            importBatchId: batchId,
            formData: record.formData,
            softskillsScore: record.softskillsScore ?? existing.softskillsScore,
            barScore: record.barScore ?? existing.barScore,
            bedieningScore: record.bedieningScore ?? existing.bedieningScore,
            dinerScore: record.dinerScore ?? existing.dinerScore,
          })
          .where(eq(applications.id, existing.id));
        updated++;
      } else {
        await db.insert(applications).values(record as any);
        inserted++;
      }
    } catch (err: any) {
      errors.push({ row: i + 2, reason: err.message || 'Onbekende fout' });
    }
  }

  return { inserted, updated, skipped, errors, batchId };
}

async function findExisting(row: Record<string, any>, role: string) {
  const functionType = role === 'horeca' ? 'horecamedewerker' : role;
  const appliedDate = row.appliedAt ? row.appliedAt.substring(0, 10) : null;

  if (row.email) {
    const res = await db.select().from(applications)
      .where(and(
        eq(applications.functionType, functionType),
        eq(applications.email, row.email),
        appliedDate ? sql`DATE(${applications.createdAt}) = ${appliedDate}` : sql`1=1`
      )).limit(1);
    if (res.length > 0) return res[0];
  }

  if (row.phone) {
    const res = await db.select().from(applications)
      .where(and(
        eq(applications.functionType, functionType),
        eq(applications.phone, row.phone),
        appliedDate ? sql`DATE(${applications.createdAt}) = ${appliedDate}` : sql`1=1`
      )).limit(1);
    if (res.length > 0) return res[0];
  }

  if (row.firstName && row.lastName) {
    const res = await db.select().from(applications)
      .where(and(
        eq(applications.functionType, functionType),
        eq(applications.firstName, row.firstName),
        eq(applications.lastName, row.lastName),
        appliedDate ? sql`DATE(${applications.createdAt}) = ${appliedDate}` : sql`1=1`
      )).limit(1);
    if (res.length > 0) return res[0];
  }

  return null;
}
