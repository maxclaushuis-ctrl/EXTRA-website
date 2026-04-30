import { db } from "./db";
import { sql } from "drizzle-orm";

// ─── Tijdzone-aware helpers (Blok 2) ─────────────────────────────────────────
// Alle berekeningen gebeuren in Europe/Amsterdam, ongeacht de OS-tijdzone.
// Default-zone is configureerbaar maar standaard "Europe/Amsterdam".

export const DEFAULT_TZ = "Europe/Amsterdam";

interface ZonedParts {
  jaar: number;
  maand: number;   // 1-12
  dag: number;     // 1-31
  uren: number;    // 0-23
  minuten: number; // 0-59
  weekdag: number; // ISO: 1=ma .. 7=zo
}

/** Pak datum-onderdelen in de gegeven IANA-tijdzone (DST-aware via Intl). */
export function getZonedParts(d: Date, tz: string = DEFAULT_TZ): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "0";
  const weekdayMap: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
  };
  let h = parseInt(get("hour"), 10);
  if (h === 24) h = 0; // sommige browsers leveren 24:xx
  return {
    jaar: parseInt(get("year"), 10),
    maand: parseInt(get("month"), 10),
    dag: parseInt(get("day"), 10),
    uren: h,
    minuten: parseInt(get("minute"), 10),
    weekdag: weekdayMap[get("weekday")] ?? 1,
  };
}

/** ISO-weekdag (1=ma..7=zo) van een datum in de opgegeven tijdzone. */
export function tzWeekday(d: Date, tz: string = DEFAULT_TZ): number {
  return getZonedParts(d, tz).weekdag;
}

/**
 * Construeer een UTC-Date die in de opgegeven tijdzone overeenkomt met
 * (jaar, maand, dag, uren, minuten). DST-correct via twee-staps offset-iteratie.
 */
export function zonedDateToUtc(
  jaar: number,
  maand: number,
  dag: number,
  uren: number,
  minuten: number,
  tz: string = DEFAULT_TZ,
): Date {
  // Initiële gok: de gegeven onderdelen alsof ze UTC zijn.
  let utcGuess = Date.UTC(jaar, maand - 1, dag, uren, minuten, 0, 0);
  // Twee iteraties zijn voldoende rond DST-overgangen.
  for (let i = 0; i < 2; i++) {
    const parts = getZonedParts(new Date(utcGuess), tz);
    const wantMin = ((((jaar * 12 + (maand - 1)) * 31) + dag) * 24 + uren) * 60 + minuten;
    const gotMin = ((((parts.jaar * 12 + (parts.maand - 1)) * 31) + parts.dag) * 24 + parts.uren) * 60 + parts.minuten;
    const diffMin = wantMin - gotMin;
    if (diffMin === 0) break;
    utcGuess += diffMin * 60_000;
  }
  return new Date(utcGuess);
}

/**
 * Verschuif de tijd van een Date naar (uren, minuten) op dezelfde lokale dag
 * in de opgegeven tijdzone. Behoudt de zoned datum, herberekent UTC.
 */
export function setZonedTime(d: Date, uren: number, minuten: number, tz: string = DEFAULT_TZ): Date {
  const p = getZonedParts(d, tz);
  return zonedDateToUtc(p.jaar, p.maand, p.dag, uren, minuten, tz);
}

/** Voeg N kalenderdagen toe in de opgegeven tijdzone (DST-veilig). */
export function addZonedDays(d: Date, dagen: number, tz: string = DEFAULT_TZ): Date {
  const p = getZonedParts(d, tz);
  // Gebruik UTC-rekening op een hulpdatum om dagen-overflow netjes af te handelen.
  const helper = new Date(Date.UTC(p.jaar, p.maand - 1, p.dag + dagen, 12, 0, 0));
  return zonedDateToUtc(
    helper.getUTCFullYear(),
    helper.getUTCMonth() + 1,
    helper.getUTCDate(),
    p.uren,
    p.minuten,
    tz,
  );
}

// ─── Werkdag / verzenddag-utiliteiten (TZ-aware) ─────────────────────────────

/** Dagen-lijst (ISO) interpreteren of fallback op werkdagen. */
export function bepaalToegestaneDagen(
  verzendDagen: number[] | null | undefined,
  alleenWerkdagen: boolean,
): number[] {
  if (Array.isArray(verzendDagen) && verzendDagen.length > 0) {
    return [...new Set(verzendDagen.filter(n => n >= 1 && n <= 7))].sort();
  }
  return alleenWerkdagen ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7];
}

/** True als de datum (in TZ) op een toegestane dag valt. */
export function isToegestaneDag(
  d: Date,
  toegestaneDagen: number[],
  tz: string = DEFAULT_TZ,
): boolean {
  return toegestaneDagen.includes(tzWeekday(d, tz));
}

/** Behoud voor backwards compatibility (Ma-Vr in TZ). */
export function isWerkdag(datum: Date, tz: string = DEFAULT_TZ): boolean {
  const w = tzWeekday(datum, tz);
  return w >= 1 && w <= 5;
}

/** Eerstvolgende datum (≥ start) die in een toegestane dag valt, op start-uur. */
export function getEerstvolgendeToegestaneDag(
  start: Date,
  toegestaneDagen: number[],
  uren: number,
  minuten: number,
  tz: string = DEFAULT_TZ,
): Date {
  let kandidaat = setZonedTime(start, uren, minuten, tz);
  // Als we de tijd terug-zetten en daarmee voor 'start' eindigen → verschuif een dag.
  if (kandidaat.getTime() < start.getTime()) {
    kandidaat = addZonedDays(kandidaat, 1, tz);
  }
  for (let i = 0; i < 14; i++) {
    if (isToegestaneDag(kandidaat, toegestaneDagen, tz)) return kandidaat;
    kandidaat = addZonedDays(kandidaat, 1, tz);
  }
  return kandidaat;
}

// ─── Tijdvenster (TZ-aware) ─────────────────────────────────────────────────

export function isBinnenTijdvenster(
  datum: Date,
  start: string,
  eind: string,
  tz: string = DEFAULT_TZ,
): boolean {
  const p = getZonedParts(datum, tz);
  const [sU, sM] = start.split(":").map(Number);
  const [eU, eM] = eind.split(":").map(Number);
  const m = p.uren * 60 + p.minuten;
  return m >= sU * 60 + sM && m <= eU * 60 + eM;
}

// ─── Vaste verzendslots (Blok 2) ─────────────────────────────────────────────

export interface VerzendSlot {
  dag: number;   // ISO 1=ma..7=zo
  tijd: string;  // "HH:MM"
}

/**
 * Als verzendSlots aanwezig is, kies de eerstvolgende slot ≥ vanaf in de TZ.
 * Geen fallback: returnt null als slots leeg zijn.
 */
export function eerstvolgendSlot(
  vanaf: Date,
  slots: VerzendSlot[],
  tz: string = DEFAULT_TZ,
): Date | null {
  if (!slots || slots.length === 0) return null;
  const geldig = slots
    .filter(s => s && s.dag >= 1 && s.dag <= 7 && /^\d{1,2}:\d{2}$/.test(s.tijd))
    .map(s => {
      const [u, m] = s.tijd.split(":").map(Number);
      return { dag: s.dag, uren: u, minuten: m };
    });
  if (geldig.length === 0) return null;

  // Probeer per dag de komende 14 dagen.
  for (let offset = 0; offset < 14; offset++) {
    const kandidaatDatum = addZonedDays(vanaf, offset, tz);
    const dagInTz = tzWeekday(kandidaatDatum, tz);
    const slotsOpDag = geldig.filter(s => s.dag === dagInTz);
    if (slotsOpDag.length === 0) continue;
    // Sorteer op tijd binnen die dag, kies eerste ≥ vanaf.
    slotsOpDag.sort((a, b) => a.uren * 60 + a.minuten - (b.uren * 60 + b.minuten));
    for (const s of slotsOpDag) {
      const candidate = setZonedTime(kandidaatDatum, s.uren, s.minuten, tz);
      if (candidate.getTime() >= vanaf.getTime()) return candidate;
    }
  }
  return null;
}

// ─── Hoofdberekening: werkelijk verzendmoment ───────────────────────────────

export interface BerekenOpties {
  alleenWerkdagen?: boolean;
  tijdvensterStart?: string;
  tijdvensterEind?: string;
  tijdzone?: string;
  verzendDagen?: number[] | null;
  verzendSlots?: VerzendSlot[] | null;
}

/**
 * Bereken het werkelijke verzendmoment in UTC, rekening houdend met:
 *   1. vaste verzendslots (indien gegeven) → eerstvolgende slot in TZ
 *   2. anders: tijdvenster + toegestane dagen in TZ
 */
export function berekenWerkelijkVerzendMoment(
  gewenstMoment: Date,
  alleenWerkdagenOfOpties: boolean | BerekenOpties = true,
  tijdvensterStartLegacy: string = "08:00",
  tijdvensterEindLegacy: string = "18:00",
  tijdzoneLegacy: string = DEFAULT_TZ,
): Date {
  // Backwards-compatibele aanroep met losse parameters.
  const opt: BerekenOpties =
    typeof alleenWerkdagenOfOpties === "object" && alleenWerkdagenOfOpties !== null
      ? alleenWerkdagenOfOpties
      : {
          alleenWerkdagen: alleenWerkdagenOfOpties as boolean,
          tijdvensterStart: tijdvensterStartLegacy,
          tijdvensterEind: tijdvensterEindLegacy,
          tijdzone: tijdzoneLegacy,
        };

  const tz = opt.tijdzone || DEFAULT_TZ;
  const tvStart = opt.tijdvensterStart || "08:00";
  const tvEind = opt.tijdvensterEind || "18:00";
  const toegestaneDagen = bepaalToegestaneDagen(opt.verzendDagen ?? null, opt.alleenWerkdagen ?? true);

  // 1. Vaste slots hebben voorrang.
  if (opt.verzendSlots && opt.verzendSlots.length > 0) {
    const m = eerstvolgendSlot(gewenstMoment, opt.verzendSlots, tz);
    if (m) return m;
  }

  // 2. Tijdvenster + toegestane dagen.
  const [startU, startM] = tvStart.split(":").map(Number);
  const [eindU, eindM] = tvEind.split(":").map(Number);
  const p = getZonedParts(gewenstMoment, tz);
  const huidigMin = p.uren * 60 + p.minuten;
  const startMin = startU * 60 + startM;
  const eindMin = eindU * 60 + eindM;

  // (a) Niet op een toegestane dag → schuif naar eerstvolgende toegestane dag op start-tijd.
  if (!toegestaneDagen.includes(p.weekdag)) {
    return getEerstvolgendeToegestaneDag(gewenstMoment, toegestaneDagen, startU, startM, tz);
  }
  // (b) Voor het venster → zelfde dag op start.
  if (huidigMin < startMin) {
    return setZonedTime(gewenstMoment, startU, startM, tz);
  }
  // (c) Na het venster → volgende toegestane dag op start.
  if (huidigMin > eindMin) {
    const morgen = addZonedDays(gewenstMoment, 1, tz);
    return getEerstvolgendeToegestaneDag(morgen, toegestaneDagen, startU, startM, tz);
  }
  // (d) Binnen venster en op toegestane dag → geen correctie.
  return gewenstMoment;
}

// ─── Reden van verschuiving (TZ-aware) ──────────────────────────────────────

export function berekenReden(
  gewenst: Date,
  werkelijk: Date,
  alleenWerkdagenOfOpties: boolean | BerekenOpties = true,
  tijdvensterStartLegacy: string = "08:00",
  tijdvensterEindLegacy: string = "18:00",
  tijdzoneLegacy: string = DEFAULT_TZ,
): string | null {
  if (Math.abs(gewenst.getTime() - werkelijk.getTime()) < 60_000) return null;

  const opt: BerekenOpties =
    typeof alleenWerkdagenOfOpties === "object" && alleenWerkdagenOfOpties !== null
      ? alleenWerkdagenOfOpties
      : {
          alleenWerkdagen: alleenWerkdagenOfOpties as boolean,
          tijdvensterStart: tijdvensterStartLegacy,
          tijdvensterEind: tijdvensterEindLegacy,
          tijdzone: tijdzoneLegacy,
        };
  const tz = opt.tijdzone || DEFAULT_TZ;

  const dagNamen = ["", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
  const toegestaneDagen = bepaalToegestaneDagen(opt.verzendDagen ?? null, opt.alleenWerkdagen ?? true);
  const p = getZonedParts(gewenst, tz);

  if (opt.verzendSlots && opt.verzendSlots.length > 0) {
    return `Tijdstip is verschoven naar het eerstvolgende vaste verzendslot`;
  }
  if (!toegestaneDagen.includes(p.weekdag)) {
    return `Tijdstip valt op ${dagNamen[p.weekdag]}, niet in toegestane verzenddagen`;
  }
  const tvStart = opt.tijdvensterStart || "08:00";
  const tvEind = opt.tijdvensterEind || "18:00";
  const [sU, sM] = tvStart.split(":").map(Number);
  const [eU, eM] = tvEind.split(":").map(Number);
  const cur = p.uren * 60 + p.minuten;
  const sm = sU * 60 + sM;
  const em = eU * 60 + eM;
  const klok = `${String(p.uren).padStart(2, "0")}:${String(p.minuten).padStart(2, "0")}`;
  if (cur < sm) return `Tijdstip (${klok}) valt voor het verzendvenster (start: ${tvStart})`;
  if (cur > em) return `Tijdstip (${klok}) valt na het verzendvenster (eind: ${tvEind})`;
  return "Verzendmoment is aangepast";
}

// ─── Formattering (TZ-aware) ────────────────────────────────────────────────

export function formatNLDatum(datum: Date, tz: string = DEFAULT_TZ): string {
  const dagen = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
  const maanden = ["januari", "februari", "maart", "april", "mei", "juni",
    "juli", "augustus", "september", "oktober", "november", "december"];
  const p = getZonedParts(datum, tz);
  // p.weekdag is ISO (1=ma..7=zo); converteer naar zondag-startindex voor dagen[]
  const dagIndex = p.weekdag === 7 ? 0 : p.weekdag;
  const dag = dagen[dagIndex];
  const maand = maanden[p.maand - 1];
  const uren = String(p.uren).padStart(2, "0");
  const minuten = String(p.minuten).padStart(2, "0");
  return `${dag} ${p.dag} ${maand} ${p.jaar} om ${uren}:${minuten}`;
}

// Backwards compat: oude getVolgendeWerkdag (TZ-aware nu)
export function getVolgendeWerkdag(datum: Date, tz: string = DEFAULT_TZ): Date {
  let d = addZonedDays(datum, 1, tz);
  for (let i = 0; i < 14 && !isWerkdag(d, tz); i++) {
    d = addZonedDays(d, 1, tz);
  }
  return d;
}

// ─── Scheduler logger ────────────────────────────────────────────────────────
export async function logScheduler(
  type: string,
  campaignId: number | null,
  bericht: string,
): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO scheduler_log (type, campaign_id, bericht, timestamp)
      VALUES (${type}, ${campaignId ?? null}, ${bericht}, NOW())
    `);
  } catch (err) {
    console.error('[schedulerLog] Write fout:', err);
  }
}

// ─── Instellingen ────────────────────────────────────────────────────────────
export async function getInstelling(sleutel: string, standaard: string): Promise<string> {
  try {
    const result = await db.execute(sql`
      SELECT waarde FROM instellingen WHERE sleutel = ${sleutel} LIMIT 1
    `);
    const row = (result.rows as any[])[0];
    return row?.waarde ?? standaard;
  } catch {
    return standaard;
  }
}

export async function setInstelling(sleutel: string, waarde: string): Promise<void> {
  await db.execute(sql`
    INSERT INTO instellingen (sleutel, waarde, bijgewerkt_op)
    VALUES (${sleutel}, ${waarde}, NOW())
    ON CONFLICT (sleutel) DO UPDATE SET waarde = ${waarde}, bijgewerkt_op = NOW()
  `);
}

export async function initInstellingen(): Promise<void> {
  const defaults: Record<string, string> = {
    'verzend_alleen_werkdagen': '1',
    'verzend_tijdvenster_start': '08:00',
    'verzend_tijdvenster_eind': '18:00',
    'tijdzone': DEFAULT_TZ,
    'verzend_dagen_default': '1,2,3,4,5',
    'verzend_slots_jaarcampagne': '[{"dag":2,"tijd":"14:30"},{"dag":3,"tijd":"10:30"}]',
    'email_from_address': 'max@doehetextra.nl',
    'email_from_name': 'EXTRA',
  };
  for (const [sleutel, waarde] of Object.entries(defaults)) {
    await db.execute(sql`
      INSERT INTO instellingen (sleutel, waarde)
      VALUES (${sleutel}, ${waarde})
      ON CONFLICT (sleutel) DO NOTHING
    `);
  }
}
