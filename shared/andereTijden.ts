/**
 * Andere tijden aanbieden (Kandidaten, schakelaar KANDIDATEN_AFSPRAKEN, besluit Max 18 november 2026).
 *
 * Kiest een kandidaat in WhatsApp "Geen tijd die past", dan zoekt Job zelf nieuwe momenten:
 *  1. Job vraagt wat beter past: een dag, een dagdeel of later.
 *  2. Job biedt de drie dichtstbijzijnde vrije momenten aan die daarbij passen.
 *  3. Past het weer niet, dan volgt een tweede ronde. Daarna, of als er niets vrij is, of als de
 *     kandidaat liever gebeld wordt, pakt een planner het op (de kandidaat is dan rood).
 *
 * Puur: geen database, geen berichten. De service (server/job/jobService.ts) bewaart de staat in
 * `velden.andereTijden` en verstuurt wat hier is bepaald. Een aangeboden moment is niet gereserveerd,
 * wie het eerst kiest krijgt het; de database bewaakt dubbel boeken.
 */
import { weekdag, type LijstSectie, type Moment } from "./jobPlanning";

export const MAX_RONDEN = 2;
export const VOORKEUR_PREFIX = "voorkeur:";

export interface AndereTijden {
  /** Aantal rondes met nieuwe momenten dat al is aangeboden. */
  ronde: number;
  /** Job heeft gevraagd wat beter past en wacht op het antwoord. */
  wacht: boolean;
  /** Alle momenten die al zijn aangeboden (YYYY-MM-DDTHH:MM), zodat ze niet terugkomen. */
  aangeboden: string[];
  /** Wat de kandidaat aangaf ("dinsdag", "middag", "later", "liever gebeld"), voor de planner. */
  voorkeur?: string;
}

export type Voorkeur =
  | { soort: "dag"; dag: number }
  | { soort: "deel"; deel: "ochtend" | "middag" }
  | { soort: "later" }
  | { soort: "bellen" };

type Taal = "nl" | "en";

const DAGEN = {
  nl: ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
};
const T = {
  nl: {
    vraag: "Geen probleem, ik zoek nieuwe momenten voor je. Wat past je beter?",
    aanbod: "Dit zijn de dichtstbijzijnde momenten die passen. Kies een moment dat je uitkomt.",
    ochtend: "Ochtend", middag: "Middag", later: "Later dan deze", bellen: "Liever gebeld worden",
    kopDag: "Dag", kopDeel: "Dagdeel", kopAnders: "Anders",
    label: { ochtend: "ochtend", middag: "middag", later: "later", bellen: "liever gebeld" },
  },
  en: {
    vraag: "No problem, I'll find new times for you. What suits you better?",
    aanbod: "These are the nearest times that fit. Pick one that suits you.",
    ochtend: "Morning", middag: "Afternoon", later: "Later than these", bellen: "Call me instead",
    kopDag: "Day", kopDeel: "Part of day", kopAnders: "Other",
    label: { ochtend: "morning", middag: "afternoon", later: "later", bellen: "prefers a call" },
  },
};

export const sleutel = (m: { datum: string; tijd: string }) => `${m.datum}T${m.tijd}`;

/** De keuzelijst "Wat past je beter?". Titels hooguit 24 tekens, 9 regels in totaal. */
export function voorkeurLijst(taal: Taal): LijstSectie[] {
  const t = T[taal];
  return [
    { titel: t.kopDag, rijen: DAGEN[taal].map((d, i) => ({ id: `${VOORKEUR_PREFIX}dag${i + 1}`, titel: d })) },
    { titel: t.kopDeel, rijen: [{ id: `${VOORKEUR_PREFIX}ochtend`, titel: t.ochtend }, { id: `${VOORKEUR_PREFIX}middag`, titel: t.middag }] },
    { titel: t.kopAnders, rijen: [{ id: `${VOORKEUR_PREFIX}later`, titel: t.later }, { id: `${VOORKEUR_PREFIX}bellen`, titel: t.bellen }] },
  ];
}

/** Het antwoord (de titel van de regel) als voorkeur, of null als het er geen is. */
export function gekozenVoorkeur(antwoord: string): Voorkeur | null {
  const a = (antwoord || "").trim().toLowerCase();
  if (!a) return null;
  for (const taal of ["nl", "en"] as const) {
    const t = T[taal];
    const i = DAGEN[taal].findIndex((d) => d.toLowerCase() === a);
    if (i >= 0) return { soort: "dag", dag: i + 1 };
    if (a === t.ochtend.toLowerCase()) return { soort: "deel", deel: "ochtend" };
    if (a === t.middag.toLowerCase()) return { soort: "deel", deel: "middag" };
    if (a === t.later.toLowerCase()) return { soort: "later" };
    if (a === t.bellen.toLowerCase()) return { soort: "bellen" };
  }
  return null;
}

/** Korte tekst voor de planner: wat de kandidaat aangaf. */
export function voorkeurLabel(v: Voorkeur, taal: Taal = "nl"): string {
  if (v.soort === "dag") return DAGEN[taal][v.dag - 1].toLowerCase();
  if (v.soort === "deel") return T[taal].label[v.deel];
  return T[taal].label[v.soort];
}

/** De drie dichtstbijzijnde vrije momenten die bij de voorkeur passen en nog niet zijn aangeboden. */
export function momentenVoorVoorkeur(momenten: Moment[], v: Voorkeur, al: string[], max = 3): Moment[] {
  if (v.soort === "bellen") return [];
  const gehad = new Set(al);
  const volgorde = [...momenten].sort((a, b) => sleutel(a).localeCompare(sleutel(b)));
  const laatste = al.length ? [...al].sort().at(-1)! : "";
  const uit: Moment[] = [];
  const gezien = new Set<string>();
  for (const m of volgorde) {
    const k = sleutel(m);
    if (gehad.has(k) || gezien.has(k)) continue;
    if (v.soort === "dag" && weekdag(m.datum) !== v.dag) continue;
    if (v.soort === "deel" && (v.deel === "ochtend" ? m.tijd >= "12:00" : m.tijd < "12:00")) continue;
    if (v.soort === "later" && laatste && k <= laatste) continue;
    gezien.add(k);
    uit.push(m);
    if (uit.length >= max) break;
  }
  return uit;
}

export type Vervolg =
  | { soort: "vraag"; staat: AndereTijden; tekst: string; lijst: LijstSectie[] }
  | { soort: "aanbod"; staat: AndereTijden; tekst: string; momenten: Moment[] }
  | { soort: "planner"; staat: AndereTijden };

const uniek = (l: string[]) => Array.from(new Set(l));

/**
 * De kandidaat koos "Geen tijd die past". `getoond` zijn de momenten uit de lijst die hij net zag.
 * Eerst vragen wat beter past; na twee rondes is het aan een planner.
 */
export function geenTijd(at: AndereTijden | undefined, getoond: string[], taal: Taal): Vervolg {
  const ronde = at?.ronde ?? 0;
  const aangeboden = uniek([...(at?.aangeboden || []), ...getoond]);
  if (ronde >= MAX_RONDEN) return { soort: "planner", staat: { ronde, wacht: false, aangeboden, voorkeur: at?.voorkeur } };
  return { soort: "vraag", staat: { ronde, wacht: true, aangeboden, voorkeur: at?.voorkeur }, tekst: T[taal].vraag, lijst: voorkeurLijst(taal) };
}

/** Het antwoord op "Wat past je beter?": nieuwe momenten, of een planner als er niets past of de kandidaat gebeld wil worden. */
export function voorkeurAntwoord(at: AndereTijden, v: Voorkeur, momenten: Moment[], taal: Taal): Vervolg {
  const label = voorkeurLabel(v, "nl");
  const ms = momentenVoorVoorkeur(momenten, v, at.aangeboden);
  if (!ms.length) return { soort: "planner", staat: { ...at, wacht: false, voorkeur: label } };
  return {
    soort: "aanbod", momenten: ms, tekst: T[taal].aanbod,
    staat: { ronde: at.ronde + 1, wacht: false, aangeboden: uniek([...at.aangeboden, ...ms.map(sleutel)]), voorkeur: label },
  };
}

/** Tekst op de knop van de keuzelijst "Wat past je beter?". */
export const VOORKEUR_KNOP = { nl: "Kies", en: "Choose" };

/** Bericht als een planner zelf momenten klaarzet voor de kandidaat. */
export function plannerAanbodTekst(taal: Taal): string {
  return taal === "en"
    ? "A colleague from EXTRA has picked these times for you. Choose a moment that suits you."
    : "Een collega van EXTRA heeft deze momenten voor je klaargezet. Kies een moment dat je uitkomt.";
}
