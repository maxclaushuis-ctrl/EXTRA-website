/**
 * EXTRA Planbord webhook
 *
 * Stuurt één fire-and-forget POST naar het Planbord-project zodra een
 * sollicitant via "Aannemen als medewerker" wordt gepromoveerd tot
 * medewerker. Mag NOOIT throwen — de aannemen-flow moet ook doorgaan
 * als de webhook faalt.
 *
 * Configuratie (env):
 *   PLANBORD_WEBHOOK_URL  — endpoint van het ontvangende Planbord-project
 *   WEBHOOK_SECRET        — gedeelde secret, gaat mee als x-webhook-secret header
 */

// Contractversie van de payload. v1 = originele platte payload; v2 = idem +
// top-level `payloadVersion` en een additief `data.intake`-blok. Bestaande
// v1-velden zijn NOOIT gewijzigd of verwijderd.
export const PLANBORD_PAYLOAD_VERSION = 2 as const;

/**
 * Genormaliseerde ervaringsduur. `raw` is de letterlijke opgeslagen waarde uit
 * het intake-formulier; `code` is een canonieke code (zie normalizeErvaringsduur).
 */
export interface IntakeErvaringsduur {
  raw: string;
  code: ErvaringsduurCode;
}

export type ErvaringsduurCode =
  // Schaal Horeca / Logistiek
  | 'geen'
  | 'm0_6'
  | 'm6_12'
  | 'j1_2'
  | 'j2_3'
  | 'j3_5'
  | 'j5_plus'
  // Schaal Chef / Housekeeping
  | 'j1_3'
  | 'j5_10'
  | 'j10_plus'
  // Niet te mappen waarde (nooit gokken)
  | 'onbekend';

/**
 * Additief intake-blok (contract v2). Volledig nieuw; verandert niets aan v1.
 * Alle velden staan PLAT onder `data.intake` (geen sub-objecten), exact zoals
 * de contractspec ze opsomt.
 * Conventie voor lege waarden: sleutels zijn ALTIJD aanwezig; een ontbrekende,
 * lege string of lege array wordt `null`.
 *
 * Naast de vaste velden hieronder bevat het blok de matchingvelden van de
 * betreffende functie (per-functie, letterlijk zoals opgeslagen) plus de
 * beschikbaarheidsvelden — allemaal als directe sleutels (zie index-signature).
 */
export interface IntakeBlock {
  functionType: string | null;
  interviewer: string | null;
  ervaringsduur: IntakeErvaringsduur | null;
  experienceLevel: string | null;
  // Beschikbaarheid (altijd aanwezig, leeg → null)
  availableHours: string | null;
  preferredDays: string[] | null;
  preferredTimes: string[] | null;
  logAvailableHours: string | null;
  logAvailableFrom: string | null;
  logPreferredDays: string[] | null;
  logPreferredTimes: string[] | null;
  // Per-functie matchingvelden komen hier als directe sleutels bij.
  [key: string]: unknown;
}

export interface PlanbordPayloadData {
  id: string;
  applicationId?: number;
  candidateId?: number;
  employeeId?: number;
  firstName: string;
  lastName: string;
  function: string;
  email?: string | null;
  phone?: string | null;
  region?: string | null;
  birthDate?: string | null;
  city?: string | null;
  nationality?: string | null;
  tags?: {
    profiel?: string[];
    talen?: string[];
    vaardigheden?: string[];
  };
  sterren?: {
    ervaringsniveau?: number;
    verschijning?: number;
    attitude?: number;
    communicatie?: number;
    algemeneIndruk?: number;
  };
  scores?: {
    softskills?: number;
    bar?: number;
    bediening?: number;
    diner?: number;
  };
  opmerking?: string | null;
  referentie?: { naam?: string; relatie?: string; telefoon?: string };
  branche?: string | null;
  opdrachtgever?: string | null;
  contractType?: string | null;
  startDate?: string | null;
  language?: string | null;
  referralCode?: string | null; // Aanbreng-code van de kandidaat — optioneel & additief
  // Contract v2: additief intake-blok. Optioneel zodat v1-aanroepen blijven werken.
  intake?: IntakeBlock;
}

// ─── Normalisatie ervaringsduur ────────────────────────────────────────────
// Sleutel = raw-waarde, kleine letters, en-streepje (–) → gewoon streepje (-),
// en ALLE witruimte verwijderd. Zo mappen beide streepjes- en spatievarianten
// naar dezelfde code.
function ervaringsduurKey(raw: string): string {
  return raw.toLowerCase().replace(/–/g, '-').replace(/\s/g, '');
}

const HORECA_LOG_DURATION_MAP: Record<string, ErvaringsduurCode> = {
  geenervaring: 'geen',
  '<6maanden': 'm0_6',
  '6-12maanden': 'm6_12',
  '1-2jaar': 'j1_2',
  '2-3jaar': 'j2_3',
  '3-5jaar': 'j3_5',
  '5+jaar': 'j5_plus',
};

const CHEF_HK_DURATION_MAP: Record<string, ErvaringsduurCode> = {
  '1-3jaarervaring': 'j1_3',
  '3-5jaarervaring': 'j3_5',
  '5-10jaarervaring': 'j5_10',
  '10>jaarervaring': 'j10_plus',
};

/**
 * Zet een ruwe ervaringsduur-waarde om naar { raw, code }.
 * - Ontbrekende/lege waarde → `null` (duurvraag niet ingevuld).
 * - Waarde die niet mapt → { raw, code: 'onbekend' } + error-log. Nooit gokken.
 */
export function normalizeErvaringsduur(
  rawValue: unknown,
  functionType?: string | null,
): IntakeErvaringsduur | null {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    return null;
  }
  const raw = String(rawValue);
  const isChefHk = functionType === 'chef' || functionType === 'housekeeping';
  const map = isChefHk ? CHEF_HK_DURATION_MAP : HORECA_LOG_DURATION_MAP;
  const code = map[ervaringsduurKey(raw)];
  if (!code) {
    console.error(
      `[planbord-webhook] ervaringsduur niet te mappen: raw=${JSON.stringify(raw)} functionType=${JSON.stringify(functionType)} → code="onbekend"`,
    );
    return { raw, code: 'onbekend' };
  }
  return { raw, code };
}

// Welk formData-veld de ervaringsduur bevat, per functie.
export function pickErvaringsduurRaw(fd: any, functionType?: string | null): unknown {
  switch (functionType) {
    case 'chef':
      return fd?.chefYearsAsKok;
    case 'housekeeping':
      return fd?.hkYearsExperience;
    case 'logistiek':
      return fd?.logExperience;
    default: // horecamedewerker, frontoffice
      return fd?.horecaExperience;
  }
}

// Matchingvelden per functie (letterlijk zoals opgeslagen in formData).
const MATCHING_FIELDS: Record<string, string[]> = {
  horecamedewerker: [
    'experienceTypes', 'canWorkIndependently', 'canCarry3Plates', 'isBarista',
    'canShakeCocktails', 'isAssistantChef', 'canWashDishes', 'isPromoWorker',
    'serviceSkills', 'barSkills', 'dinerSkills',
  ],
  frontoffice: [
    'experienceTypes', 'canWorkIndependently', 'canCarry3Plates', 'isBarista',
    'canShakeCocktails', 'isAssistantChef', 'canWashDishes', 'isPromoWorker',
    'serviceSkills', 'barSkills', 'dinerSkills',
  ],
  chef: ['chefKitchenTypes', 'chefDiplomas', 'chefLeadershipExp'],
  housekeeping: ['hkTasks', 'hkLocationTypes', 'hkHotelStars'],
  logistiek: [
    'logLicenseB', 'logLicenseCCE', 'logHeftruckCert', 'logVCA', 'logOtherCertificates',
    'logWorkEnvironments', 'logScanEquipment', 'logPhysicalLoad', 'logWorkStyle',
    'logNightShifts', 'logTransport', 'logMaxTravelTime',
  ],
};

// Lege waarde → null (ontbrekend, lege string of lege array). Anders ongewijzigd.
function nz<T>(v: T): T | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  if (Array.isArray(v) && v.length === 0) return null;
  return v;
}

/**
 * Bouwt het additieve intake-blok (contract v2) uit ruwe formData.
 * Herbruikbaar voor de webhook én de backfill-export (stap 3).
 * LET OP: appearance, attitude en assessmentRating worden bewust NIET
 * meegestuurd — die blijven alleen lokaal opgeslagen.
 */
export function buildIntakePayloadBlock(fd: any, functionType?: string | null): IntakeBlock {
  const block: IntakeBlock = {
    functionType: functionType ?? null,
    interviewer: nz(fd?.interviewer),
    ervaringsduur: normalizeErvaringsduur(pickErvaringsduurRaw(fd, functionType), functionType),
    experienceLevel: nz(fd?.experienceLevel) as string | null,
    // Beschikbaarheid — altijd dezelfde 7 sleutels aanwezig (leeg → null).
    availableHours: nz(fd?.availableHours) as string | null,
    preferredDays: nz(fd?.preferredDays) as string[] | null,
    preferredTimes: nz(fd?.preferredTimes) as string[] | null,
    logAvailableHours: nz(fd?.logAvailableHours) as string | null,
    logAvailableFrom: nz(fd?.logAvailableFrom) as string | null,
    logPreferredDays: nz(fd?.logPreferredDays) as string[] | null,
    logPreferredTimes: nz(fd?.logPreferredTimes) as string[] | null,
  };
  // Per-functie matchingvelden als directe sleutels toevoegen.
  const matchingKeys = MATCHING_FIELDS[functionType ?? ''] ?? MATCHING_FIELDS.horecamedewerker;
  for (const key of matchingKeys) {
    block[key] = nz(fd?.[key]);
  }
  return block;
}

export async function sendPlanbordWebhook(data: PlanbordPayloadData): Promise<void> {
  const url = process.env.PLANBORD_WEBHOOK_URL;
  const secret = process.env.WEBHOOK_SECRET;

  // Eén duidelijke, altijd-aanwezige resultaatregel per aanroep, zodat levering
  // aantoonbaar is. Bevat applicationId, payloadVersion en het eindresultaat.
  const logResult = (result: 'verzonden' | 'overgeslagen' | 'mislukt', reason?: string) => {
    console.log(
      `[planbord-webhook] applicationId=${data.applicationId ?? 'n/a'} ` +
      `payloadVersion=${PLANBORD_PAYLOAD_VERSION} result=${result}` +
      (reason ? ` reason=${reason}` : ''),
    );
  };

  console.error(
    '[planbord-webhook] called, url=', !!url, 'secret=', !!secret, 'employeeId=', data.id
  );

  if (!url || !secret) {
    logResult('overgeslagen', 'PLANBORD_WEBHOOK_URL of WEBHOOK_SECRET ontbreekt');
    return;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
      },
      body: JSON.stringify({
        event: 'applicant.ready',
        payloadVersion: PLANBORD_PAYLOAD_VERSION,
        timestamp: new Date().toISOString(),
        source: 'EXTRA Horecapersoneel',
        data,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const txt = await res.text().catch(() => '');
    console.error(
      '[planbord-webhook] result status=', res.status, 'body=', txt.slice(0, 300)
    );

    if (!res.ok) {
      logResult('mislukt', `http_${res.status}`);
      return;
    }

    logResult('verzonden', `http_${res.status}`);
  } catch (err: any) {
    console.error('[planbord-webhook] result status= NONE err=', err?.message ?? err);
    logResult('mislukt', `exception:${err?.message ?? 'onbekend'}`);
  }
}
