/**
 * Inplannen van de kennismaking door Job (bord D op het canvas).
 *
 * Puur: geen database. Bepaalt welke momenten een kandidaat te zien krijgt.
 * De regels:
 *  - Alleen momenten waarop een interviewer echt vrij is.
 *  - Een geboekt moment verdwijnt direct (de database bewaakt het met een
 *    unieke index op interviewer, datum en tijd; zie server/job/jobStorage.ts).
 *  - Een half uur per gesprek.
 *  - Niet vandaag, en niet binnen 12 uur: de interviewer moet het kunnen zien.
 *  - Alle tijden zijn Nederlandse tijd (Europe/Amsterdam).
 *
 * Standaard (besluit Max, 6 november 2026):
 *  - Charlotte: maandag tot en met vrijdag 10:30 tot 15:30, niet 12:00 tot 13:00.
 *  - Lea: maandag tot en met vrijdag 13:00 tot 17:00.
 * In het dashboard per interviewer aan te passen.
 */

export interface Interviewer {
  naam: string;
  /** 1 = maandag … 7 = zondag */
  dagen: number[];
  van: string;   // "10:30"
  tot: string;   // "15:30" (laatste gesprek eindigt hier)
  pauzeVan?: string | null;
  pauzeTot?: string | null;
  actief?: boolean;
}

export const GESPREKSDUUR_MIN = 30;
export const MIN_VOORLOOP_UUR = 12;
export const DAGEN_VOORUIT = 14;

export const STANDAARD_INTERVIEWERS: Interviewer[] = [
  { naam: "Charlotte", dagen: [1, 2, 3, 4, 5], van: "10:30", tot: "15:30", pauzeVan: "12:00", pauzeTot: "13:00", actief: true },
  { naam: "Lea", dagen: [1, 2, 3, 4, 5], van: "13:00", tot: "17:00", actief: true },
];

export interface Bezet {
  interviewer: string;
  datum: string; // YYYY-MM-DD
  tijd: string;  // HH:MM
}

export interface Moment {
  datum: string;
  tijd: string;
  interviewer: string;
}

const TZ = "Europe/Amsterdam";

/** Datum en tijd in Nederland, als "YYYY-MM-DD" en "HH:MM". */
export function amsterdam(d: Date): { datum: string; tijd: string; weekdag: number } {
  const delen = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
  }).formatToParts(d);
  const w = (t: string) => delen.find((p) => p.type === t)?.value || "";
  const uur = w("hour") === "24" ? "00" : w("hour");
  const wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(w("weekday")) + 1;
  return { datum: `${w("year")}-${w("month")}-${w("day")}`, tijd: `${uur}:${w("minute")}`, weekdag: wd };
}

/** Weekdag (1 = maandag) van een kalenderdatum, los van tijdzones. */
export function weekdag(datum: string): number {
  const d = new Date(`${datum}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

export function plusDag(datum: string, n: number): string {
  const d = new Date(`${datum}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const minuten = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** De starttijden van een interviewer op een dag waarop hij werkt. */
export function tijdenVan(i: Interviewer): string[] {
  const uit: string[] = [];
  const pv = i.pauzeVan ? minuten(i.pauzeVan) : null;
  const pt = i.pauzeTot ? minuten(i.pauzeTot) : null;
  for (let m = minuten(i.van); m + GESPREKSDUUR_MIN <= minuten(i.tot); m += GESPREKSDUUR_MIN) {
    if (pv !== null && pt !== null && m < pt && m + GESPREKSDUUR_MIN > pv) continue;
    uit.push(hhmm(m));
  }
  return uit;
}

/**
 * Vrije momenten vanaf morgen, maximaal `DAGEN_VOORUIT` dagen vooruit.
 * Per datum en tijd hooguit één moment; bij meerdere vrije interviewers krijgt
 * degene met de minste gesprekken die dag het, zodat het werk verdeeld wordt.
 */
export function vrijeMomenten(interviewers: Interviewer[], bezet: Bezet[], nu: Date, dagen = DAGEN_VOORUIT): Moment[] {
  const actief = interviewers.filter((i) => i.actief !== false && i.dagen.length > 0);
  const bezetSet = new Set(bezet.map((b) => `${b.interviewer}|${b.datum}|${b.tijd}`));
  const perDag = new Map<string, number>();
  for (const b of bezet) perDag.set(`${b.interviewer}|${b.datum}`, (perDag.get(`${b.interviewer}|${b.datum}`) || 0) + 1);

  const grens = amsterdam(new Date(nu.getTime() + MIN_VOORLOOP_UUR * 60 * 60 * 1000));
  const vandaag = amsterdam(nu).datum;
  const uit: Moment[] = [];
  for (let n = 1; n <= dagen; n++) {
    const datum = plusDag(vandaag, n);
    const wd = weekdag(datum);
    const kandidaten = new Map<string, Interviewer[]>();
    for (const i of actief) {
      if (!i.dagen.includes(wd)) continue;
      for (const tijd of tijdenVan(i)) {
        if (`${datum} ${tijd}` < `${grens.datum} ${grens.tijd}`) continue;
        if (bezetSet.has(`${i.naam}|${datum}|${tijd}`)) continue;
        const lijst = kandidaten.get(tijd) || [];
        lijst.push(i);
        kandidaten.set(tijd, lijst);
      }
    }
    for (const tijd of Array.from(kandidaten.keys()).sort()) {
      const lijst = kandidaten.get(tijd)!;
      lijst.sort((a, b) => (perDag.get(`${a.naam}|${datum}`) || 0) - (perDag.get(`${b.naam}|${datum}`) || 0) || a.naam.localeCompare(b.naam));
      uit.push({ datum, tijd, interviewer: lijst[0].naam });
    }
  }
  return uit;
}

/** Is dit moment (nog) vrij voor een interviewer? Voor de controle vlak voor het boeken. */
export function momentGeldig(interviewers: Interviewer[], bezet: Bezet[], nu: Date, m: { datum: string; tijd: string }): Moment | null {
  return vrijeMomenten(interviewers, bezet, nu).find((v) => v.datum === m.datum && v.tijd === m.tijd) || null;
}

const DAGNAAM = {
  nl: ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};
const MAAND = {
  nl: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

/** "Dinsdag 10 november" of "Tuesday 10 November". */
export function dagTekst(datum: string, taal: "nl" | "en"): string {
  const wd = weekdag(datum);
  const dag = Number(datum.slice(8, 10));
  const maand = MAAND[taal].at(Number(datum.slice(5, 7)) - 1) || "";
  const naam = DAGNAAM[taal].at(wd - 1) || "";
  const s = `${naam} ${dag} ${maand}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Moet de herinnering voor een afspraak nu uit? De dag ervoor vanaf 18:00, tot het gesprek. */
export function afspraakHerinneringNodig(a: { datum: string; tijd: string; herinneringVerstuurd: boolean }, nu: Date): boolean {
  if (a.herinneringVerstuurd) return false;
  const n = amsterdam(nu);
  const nuStr = `${n.datum} ${n.tijd}`;
  const vanaf = `${plusDag(a.datum, -1)} 18:00`;
  const gesprek = `${a.datum} ${a.tijd}`;
  return nuStr >= vanaf && nuStr < gesprek;
}

/** Een iCalendar-bestand voor "Zet in agenda". Tijden in Nederlandse tijd. */
export function agendaBestand(a: { datum: string; tijd: string; interviewer: string; uid: string }): string {
  const start = `${a.datum.replace(/-/g, "")}T${a.tijd.replace(":", "")}00`;
  const eindMin = minuten(a.tijd) + GESPREKSDUUR_MIN;
  const eind = `${a.datum.replace(/-/g, "")}T${hhmm(eindMin).replace(":", "")}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EXTRA Uitzendbureau//Job//NL",
    "BEGIN:VEVENT",
    `UID:${a.uid}@doehetextra.nl`,
    `DTSTART;TZID=Europe/Amsterdam:${start}`,
    `DTEND;TZID=Europe/Amsterdam:${eind}`,
    `SUMMARY:Kennismaking bij EXTRA met ${a.interviewer}`,
    "LOCATION:Herengracht 372\\, 1016 CH Amsterdam",
    "DESCRIPTION:Neem je paspoort of ID-kaart mee.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
