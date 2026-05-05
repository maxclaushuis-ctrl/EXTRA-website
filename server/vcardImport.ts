// vCard (.vcf) import voor prospect_contacts.
// Ondersteunt vCard 2.1 / 3.0 / 4.0 (iCloud, Google, Outlook). Pakt FN, N,
// EMAIL, TEL, ORG, TITLE. Verwerkt line-folding en quoted-printable.

import { storage } from './storage';
import { normalizePhone } from './whatsapp/phone';

export interface VcardRij {
  voornaam: string | null;
  achternaam: string | null;
  fullName: string;
  email: string | null;
  emailIsPlaceholder: boolean;
  telefoon: string | null;
  telefoonOriginal: string | null;
  bedrijf: string | null;
  functietitel: string | null;
}

export interface VcardPreview {
  totaalKaarten: number;
  geldigNieuw: number;
  zonderEmailEnTel: number;
  dubbelInBestand: number;
  dubbelInDb: number;
  metEmail: number;
  alleenTelefoon: number;
  voorbeelden: VcardRij[];
  alleRijen: VcardRij[];
}

export interface VcardCommitResult {
  aangemaakt: number;
  overgeslagen: number;
  fouten: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function unfoldLines(raw: string): string[] {
  // vCard line-folding: een regel die start met spatie/tab is een vervolg van
  // de vorige regel (RFC 6350 § 3.2). Ondersteun zowel CRLF als LF.
  const norm = raw.replace(/\r\n?/g, '\n');
  const out: string[] = [];
  for (const line of norm.split('\n')) {
    if (line.length === 0) { out.push(''); continue; }
    if ((line[0] === ' ' || line[0] === '\t') && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function decodeQuotedPrintable(value: string): string {
  try {
    // Soft line-break (= aan einde regel) verwijderen, dan %-decode op de
    // hex-escapes via een tijdelijke percent-string.
    const cleaned = value.replace(/=\r?\n/g, '');
    const bytes: number[] = [];
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '=' && i + 2 < cleaned.length) {
        const hex = cleaned.slice(i + 1, i + 3);
        if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
          bytes.push(parseInt(hex, 16));
          i += 2;
          continue;
        }
      }
      bytes.push(cleaned.charCodeAt(i));
    }
    return Buffer.from(bytes).toString('utf-8');
  } catch {
    return value;
  }
}

function decodeValue(value: string, params: Record<string, string>): string {
  let v = value;
  // Quoted-printable (oude vCard 2.1 export, vaak Outlook)
  const enc = (params['ENCODING'] || '').toUpperCase();
  if (enc === 'QUOTED-PRINTABLE') v = decodeQuotedPrintable(v);
  // Geëscapete tekens (RFC 6350 § 3.4): \n, \, en ;
  v = v.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
  return v.trim();
}

interface ParsedProp {
  key: string;
  params: Record<string, string>;
  value: string;
}

function parseLine(line: string): ParsedProp | null {
  const colonIdx = line.indexOf(':');
  if (colonIdx < 0) return null;
  const left = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1);
  const segments = left.split(';');
  const key = (segments.shift() || '').toUpperCase();
  if (!key) return null;
  const params: Record<string, string> = {};
  for (const seg of segments) {
    const eq = seg.indexOf('=');
    if (eq >= 0) {
      params[seg.slice(0, eq).toUpperCase()] = seg.slice(eq + 1);
    } else {
      // Bv. "TYPE" zonder waarde, of vCard 2.1 stijl "HOME"
      params[seg.toUpperCase()] = '';
    }
  }
  return { key, params, value };
}

// ── Parser ─────────────────────────────────────────────────────────────────

export function parseVcards(rawText: string): VcardRij[] {
  const lines = unfoldLines(rawText);
  const rijen: VcardRij[] = [];

  let inCard = false;
  let voornaam: string | null = null;
  let achternaam: string | null = null;
  let fn: string | null = null;
  let email: string | null = null;
  let tel: string | null = null;
  let telOriginal: string | null = null;
  let bedrijf: string | null = null;
  let titel: string | null = null;

  const flushCard = () => {
    const naam = (fn || [voornaam, achternaam].filter(Boolean).join(' ') || '').trim();
    if (!naam && !email && !tel) return; // helemaal niets bruikbaars
    rijen.push({
      voornaam: voornaam || null,
      achternaam: achternaam || null,
      fullName: naam || (email || tel || 'Onbekend'),
      email: email,
      emailIsPlaceholder: false,
      telefoon: tel,
      telefoonOriginal: telOriginal,
      bedrijf: bedrijf,
      functietitel: titel,
    });
  };

  const reset = () => {
    voornaam = null; achternaam = null; fn = null;
    email = null; tel = null; telOriginal = null;
    bedrijf = null; titel = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    if (/^BEGIN:VCARD$/i.test(line)) { inCard = true; reset(); continue; }
    if (/^END:VCARD$/i.test(line)) { if (inCard) flushCard(); inCard = false; reset(); continue; }
    if (!inCard) continue;

    const p = parseLine(line);
    if (!p) continue;

    switch (p.key) {
      case 'FN': {
        if (!fn) fn = decodeValue(p.value, p.params);
        break;
      }
      case 'N': {
        // N:Family;Given;Additional;Prefix;Suffix
        const parts = decodeValue(p.value, p.params).split(';');
        if (!achternaam && parts[0]) achternaam = parts[0].trim() || null;
        if (!voornaam && parts[1]) voornaam = parts[1].trim() || null;
        break;
      }
      case 'EMAIL': {
        if (!email) {
          const v = decodeValue(p.value, p.params).toLowerCase();
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) email = v;
        }
        break;
      }
      case 'TEL': {
        if (!tel) {
          const raw = decodeValue(p.value, p.params);
          // Voorkeur voor mobiel/cell wanneer beschikbaar — maar bij 1ste hit
          // pakken we hem; latere CELL kan voorrang krijgen
          const cleaned = raw.replace(/[^\d+]/g, '');
          const norm = normalizePhone(cleaned);
          if (norm) {
            tel = norm;
            telOriginal = raw;
          }
        } else {
          // Als we al een nummer hebben maar deze is CELL/MOBILE en de vorige
          // niet, vervang dan. (TYPE-param check voor zowel "TYPE=CELL" als
          // los "CELL"/"MOBILE" in vCard 2.1.)
          const isCell = /CELL|MOBILE/i.test(p.params['TYPE'] || '')
            || Object.keys(p.params).some(k => /CELL|MOBILE/i.test(k));
          if (isCell) {
            const raw = decodeValue(p.value, p.params);
            const norm = normalizePhone(raw.replace(/[^\d+]/g, ''));
            if (norm) { tel = norm; telOriginal = raw; }
          }
        }
        break;
      }
      case 'ORG': {
        if (!bedrijf) {
          // ORG kan structured zijn (Company;Department) — pak eerste deel
          const v = decodeValue(p.value, p.params).split(';')[0].trim();
          if (v) bedrijf = v;
        }
        break;
      }
      case 'TITLE': {
        if (!titel) titel = decodeValue(p.value, p.params) || null;
        break;
      }
    }
  }

  return rijen;
}

// ── Preview + Commit ──────────────────────────────────────────────────────

function placeholderEmail(phone: string): string {
  return `wa+${phone.replace(/[^\d]/g, '')}@no-email.local`;
}

export async function maakVcardPreview(rawText: string): Promise<VcardPreview> {
  const parsed = parseVcards(rawText);
  const totaalKaarten = parsed.length;

  // Dedupe in bestand: eerst op email, dan op telefoon
  const gezienEmails = new Set<string>();
  const gezienTel = new Set<string>();
  let dubbelInBestand = 0;
  let zonderEmailEnTel = 0;
  let metEmail = 0;
  let alleenTelefoon = 0;

  const uniekeRijen: VcardRij[] = [];
  for (const r of parsed) {
    if (!r.email && !r.telefoon) { zonderEmailEnTel++; continue; }
    const dedupeKey = r.email || (r.telefoon ? `tel:${r.telefoon}` : '');
    if (dedupeKey && (gezienEmails.has(dedupeKey) || gezienTel.has(dedupeKey))) {
      dubbelInBestand++;
      continue;
    }
    if (r.email) gezienEmails.add(r.email);
    if (r.telefoon) gezienTel.add(`tel:${r.telefoon}`);

    // Vul placeholder email als die ontbreekt (telefoon-only contact)
    let rij = r;
    if (!rij.email && rij.telefoon) {
      rij = { ...rij, email: placeholderEmail(rij.telefoon), emailIsPlaceholder: true };
      alleenTelefoon++;
    } else if (rij.email) {
      metEmail++;
    }
    uniekeRijen.push(rij);
  }

  // Dedupe tegen DB (op email + op telefoon)
  const bestaande = await storage.getProspectContacts({});
  const bestEmails = new Set(bestaande.map(c => (c.email || '').toLowerCase()).filter(Boolean));
  const bestTelefoons = new Set(bestaande.map(c => c.telefoon).filter(Boolean) as string[]);

  let dubbelInDb = 0;
  const finaal: VcardRij[] = [];
  for (const r of uniekeRijen) {
    const emailDub = r.email && !r.emailIsPlaceholder && bestEmails.has(r.email.toLowerCase());
    const telDub = r.telefoon && bestTelefoons.has(r.telefoon);
    if (emailDub || telDub) { dubbelInDb++; continue; }
    finaal.push(r);
  }

  return {
    totaalKaarten,
    geldigNieuw: finaal.length,
    zonderEmailEnTel,
    dubbelInBestand,
    dubbelInDb,
    metEmail,
    alleenTelefoon,
    voorbeelden: finaal.slice(0, 8),
    alleRijen: finaal,
  };
}

export async function commitVcardImport(rijen: VcardRij[]): Promise<VcardCommitResult> {
  let aangemaakt = 0;
  let overgeslagen = 0;
  const fouten: string[] = [];

  // Re-check tegen DB op het moment van commit (kan gewijzigd zijn sinds preview)
  const bestaande = await storage.getProspectContacts({});
  const bestEmails = new Set(bestaande.map(c => (c.email || '').toLowerCase()).filter(Boolean));
  const bestTelefoons = new Set(bestaande.map(c => c.telefoon).filter(Boolean) as string[]);

  for (const r of rijen) {
    try {
      let email = r.email;
      const telefoon = r.telefoon;
      if (!email && telefoon) email = placeholderEmail(telefoon);
      if (!email) { overgeslagen++; continue; }

      if (bestEmails.has(email.toLowerCase()) || (telefoon && bestTelefoons.has(telefoon))) {
        overgeslagen++; continue;
      }

      const naam = r.fullName || [r.voornaam, r.achternaam].filter(Boolean).join(' ') || email;

      await storage.createProspectContact({
        name: naam,
        email,
        company: r.bedrijf || null,
        function: r.functietitel || null,
        brancheTags: [],
        functieTags: [],
        notes: null,
        source: 'vcard_import',
        unsubscribed: false,
        unsubscribedAt: null,
        crmContactId: null,
        voornaam: r.voornaam || null,
        achternaam: r.achternaam || null,
        telefoon: telefoon || null,
        telefoonOriginal: r.telefoonOriginal || null,
        stad: null,
        taal: 'Nederlands',
        branche: null,
        functiegroep: null,
        contactType: 'prospect',
        customTags: '[]',
        contactStatus: 'actief',
      });
      bestEmails.add(email.toLowerCase());
      if (telefoon) bestTelefoons.add(telefoon);
      aangemaakt++;
    } catch (err: any) {
      fouten.push(`${r.fullName || r.email || '?'}: ${err?.message || 'fout'}`);
    }
  }

  return { aangemaakt, overgeslagen, fouten };
}
