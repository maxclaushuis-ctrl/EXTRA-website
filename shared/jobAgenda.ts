/**
 * De koppeling van Job met de gedeelde agenda in iCloud (mock-up "Job plant in de agenda EXTRA",
 * akkoord Max 27 november 2026). Puur: geen netwerk, geen database.
 *
 * Lezen: welke tijden in de agenda bezet zijn voor welke interviewer.
 *  1. De naam van de interviewer in de titel ("Lea hartkastje halen") blokkeert die interviewer.
 *  2. Een afspraak zonder naam blokkeert niemand.
 *  3. "Optie" of "Sollicitant" zonder naam neemt één interviewer in beslag: werken er op dat moment
 *     twee, dan blijft de ander vrij.
 *  4. Een hele dag met een naam ("Charlotte vrij") sluit die hele dag voor die interviewer.
 * De vaste werktijden blijven leidend: de agenda haalt er alleen tijden uit.
 *
 * Schrijven: na een boeking zet Job "Lea: Sollicitant Andres (logistiek)" in de agenda.
 * Verzet of annuleert de kandidaat, dan haalt Job die afspraak weg en is het moment weer vrij.
 * Job herkent zijn eigen afspraken aan de UID (job-afspraak-<omgeving>-<id>) en raakt andere nooit aan.
 */

import { amsterdam, plusDag, tijdenVan, weekdag, GESPREKSDUUR_MIN, type Bezet, type Interviewer } from "./jobPlanning";

// ─── iCalendar lezen ─────────────────────────────────────────────────────────

export interface AgendaItem {
  uid: string;
  titel: string;
  /** Begin en eind in Nederlandse tijd, "YYYY-MM-DD HH:MM". Bij een hele dag: 00:00 tot 00:00 van de dag erna. */
  van: string;
  tot: string;
  heleDag: boolean;
}

/** Vouwt doorlopende regels terug (RFC 5545: een regel die met een spatie of tab begint hoort bij de vorige). */
export function ontvouw(ics: string): string[] {
  const uit: string[] = [];
  for (const regel of ics.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")) {
    if ((regel.startsWith(" ") || regel.startsWith("\t")) && uit.length) uit[uit.length - 1] += regel.slice(1);
    else if (regel.length) uit.push(regel);
  }
  return uit;
}

export function tekstUit(waarde: string): string {
  return waarde.replace(/\\([nN])/g, "\n").replace(/\\([,;\\])/g, "$1");
}

export function tekstIn(waarde: string): string {
  return waarde.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

interface Eigenschap { naam: string; params: Record<string, string>; waarde: string }

function eigenschap(regel: string): Eigenschap | null {
  // De dubbele punt na de parameters; parameters kunnen een waarde tussen aanhalingstekens hebben.
  let inQuote = false, i = 0;
  for (; i < regel.length; i++) {
    const ch = regel[i];
    if (ch === '"') inQuote = !inQuote;
    else if (ch === ":" && !inQuote) break;
  }
  if (i >= regel.length) return null;
  const kop = regel.slice(0, i), waarde = regel.slice(i + 1);
  const delen = kop.split(";");
  const params: Record<string, string> = {};
  for (const p of delen.slice(1)) {
    const k = p.indexOf("=");
    if (k > 0) params[p.slice(0, k).toUpperCase()] = p.slice(k + 1).replace(/^"|"$/g, "");
  }
  return { naam: delen[0].toUpperCase(), params, waarde };
}


/** Verschil tussen Nederlandse tijd en UTC op dat moment, in minuten (60 of 120). */
function offsetMinuten(utcMs: number): number {
  const a = amsterdam(new Date(utcMs));
  const lokaal = Date.UTC(+a.datum.slice(0, 4), +a.datum.slice(5, 7) - 1, +a.datum.slice(8, 10), +a.tijd.slice(0, 2), +a.tijd.slice(3, 5));
  return Math.round((lokaal - Math.floor(utcMs / 60000) * 60000) / 60000);
}

/** Nederlandse datum en tijd naar een UTC-moment. */
export function amsterdamNaarUtc(datum: string, tijd: string): Date {
  const naief = Date.UTC(+datum.slice(0, 4), +datum.slice(5, 7) - 1, +datum.slice(8, 10), +tijd.slice(0, 2), +tijd.slice(3, 5));
  let utc = naief - offsetMinuten(naief) * 60000;
  utc = naief - offsetMinuten(utc) * 60000;
  return new Date(utc);
}

function utcStempel(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Een DTSTART of DTEND als Nederlandse tijd "YYYY-MM-DD HH:MM", plus of het een hele dag is. */
export function tijdstip(e: Eigenschap): { moment: string; heleDag: boolean } | null {
  const w = e.waarde.trim();
  const datum = (s: string) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  if (e.params.VALUE === "DATE" || /^\d{8}$/.test(w)) {
    if (!/^\d{8}/.test(w)) return null;
    return { moment: `${datum(w)} 00:00`, heleDag: true };
  }
  const m = /^(\d{8})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(w);
  if (!m) return null;
  if (m[5]) {
    const utc = new Date(Date.UTC(+m[1].slice(0, 4), +m[1].slice(4, 6) - 1, +m[1].slice(6, 8), +m[2], +m[3]));
    const a = amsterdam(utc);
    return { moment: `${a.datum} ${a.tijd}`, heleDag: false };
  }
  // Met TZID of zwevend: we nemen aan dat het Nederlandse tijd is (alle agenda's van EXTRA staan daarop).
  return { moment: `${datum(m[1])} ${m[2]}:${m[3]}`, heleDag: false };
}

function minutenTussen(a: string, b: string): number {
  const t = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10), +s.slice(11, 13), +s.slice(14, 16));
  return Math.round((t(b) - t(a)) / 60000);
}

function plusMinuten(moment: string, min: number): string {
  const t = Date.UTC(+moment.slice(0, 4), +moment.slice(5, 7) - 1, +moment.slice(8, 10), +moment.slice(11, 13), +moment.slice(14, 16)) + min * 60000;
  return new Date(t).toISOString().slice(0, 16).replace("T", " ");
}

interface RuwEvent {
  uid: string; titel: string; start: { moment: string; heleDag: boolean } | null; eind: { moment: string; heleDag: boolean } | null;
  duur: number | null; rrule: string | null; exdates: string[]; recurrenceId: string | null; geannuleerd: boolean;
}

function duurMinuten(d: string): number | null {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(d.trim());
  if (!m) return null;
  return (+(m[2] || 0)) * 7 * 1440 + (+(m[3] || 0)) * 1440 + (+(m[4] || 0)) * 60 + (+(m[5] || 0));
}

function ruweEvents(ics: string): RuwEvent[] {
  const uit: RuwEvent[] = [];
  let e: RuwEvent | null = null;
  let diepte = 0; // VALARM en andere componenten binnen een VEVENT overslaan
  for (const regel of ontvouw(ics)) {
    const p = eigenschap(regel);
    if (!p) continue;
    if (p.naam === "BEGIN") {
      if (p.waarde.toUpperCase() === "VEVENT" && !e) { e = { uid: "", titel: "", start: null, eind: null, duur: null, rrule: null, exdates: [], recurrenceId: null, geannuleerd: false }; diepte = 0; }
      else if (e) diepte++;
      continue;
    }
    if (p.naam === "END") {
      if (e && diepte > 0) { diepte--; continue; }
      if (e && p.waarde.toUpperCase() === "VEVENT") { uit.push(e); e = null; }
      continue;
    }
    if (!e || diepte > 0) continue;
    switch (p.naam) {
      case "UID": e.uid = p.waarde.trim(); break;
      case "SUMMARY": e.titel = tekstUit(p.waarde).trim(); break;
      case "DTSTART": e.start = tijdstip(p); break;
      case "DTEND": e.eind = tijdstip(p); break;
      case "DURATION": e.duur = duurMinuten(p.waarde); break;
      case "RRULE": e.rrule = p.waarde.trim(); break;
      case "EXDATE": for (const w of p.waarde.split(",")) { const t = tijdstip({ ...p, waarde: w }); if (t) e.exdates.push(t.moment.slice(0, 10)); } break;
      case "RECURRENCE-ID": { const t = tijdstip(p); e.recurrenceId = t ? t.moment.slice(0, 10) : null; break; }
      case "STATUS": e.geannuleerd = p.waarde.trim().toUpperCase() === "CANCELLED"; break;
    }
  }
  return uit;
}

const BYDAY: Record<string, number> = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 };

/**
 * De data waarop een terugkerende afspraak valt, binnen [van, tot]. Alleen DAILY en WEEKLY (met BYDAY,
 * INTERVAL, COUNT en UNTIL): genoeg voor vaste blokken. Andere herhalingen tellen alleen op hun eerste dag.
 */
export function herhalingen(startDatum: string, rrule: string | null, van: string, tot: string, uitgezonderd: string[] = []): string[] {
  if (!rrule) return startDatum >= van && startDatum <= tot ? [startDatum] : [];
  const r: Record<string, string> = {};
  for (const deel of rrule.split(";")) { const [k, v] = deel.split("="); if (k && v) r[k.toUpperCase()] = v; }
  const freq = r.FREQ;
  if (freq !== "DAILY" && freq !== "WEEKLY") return startDatum >= van && startDatum <= tot ? [startDatum] : [];
  const interval = Math.max(1, +(r.INTERVAL || 1));
  const tel = r.COUNT ? +r.COUNT : Infinity;
  const until = r.UNTIL ? `${r.UNTIL.slice(0, 4)}-${r.UNTIL.slice(4, 6)}-${r.UNTIL.slice(6, 8)}` : null;
  const dagen = freq === "WEEKLY" ? (r.BYDAY ? r.BYDAY.split(",").map((d) => BYDAY[d.slice(-2)]).filter(Boolean) : [weekdag(startDatum)]) : null;
  const uit: string[] = [];
  let n = 0;
  const startMaandag = plusDag(startDatum, 1 - weekdag(startDatum));
  for (let d = startDatum, stap = 0; stap < 800; d = plusDag(d, 1), stap++) {
    if (until && d > until) break;
    if (d > tot) break;
    let raak: boolean;
    if (freq === "DAILY") raak = stap % interval === 0;
    else {
      const week = Math.floor(minutenTussen(`${startMaandag} 00:00`, `${d} 00:00`) / (7 * 1440));
      raak = week % interval === 0 && dagen!.includes(weekdag(d));
    }
    if (!raak) continue;
    n++;
    if (n > tel) break;
    if (d >= van && !uitgezonderd.includes(d)) uit.push(d);
  }
  return uit;
}

/**
 * Alle afspraken uit een of meer iCalendar-teksten die (deels) tussen `van` en `tot` (datums) vallen.
 * Werkt met uitgeklapte herhalingen van de server en met een eigen eenvoudige uitklap.
 */
export function leesAfspraken(icsLijst: string[], van: string, tot: string): AgendaItem[] {
  const uit: AgendaItem[] = [];
  for (const ics of icsLijst) {
    const events = ruweEvents(ics);
    const vervangen = new Map<string, Set<string>>();
    for (const e of events) if (e.recurrenceId) {
      const s = vervangen.get(e.uid) || new Set<string>();
      s.add(e.recurrenceId);
      vervangen.set(e.uid, s);
    }
    for (const e of events) {
      if (!e.start || e.geannuleerd) continue;
      const heleDag = e.start.heleDag;
      let duur: number;
      if (e.eind) duur = minutenTussen(e.start.moment, e.eind.moment);
      else if (e.duur !== null) duur = e.duur;
      else duur = heleDag ? 1440 : 0;
      if (duur <= 0) duur = heleDag ? 1440 : 0;
      const startDatum = e.start.moment.slice(0, 10);
      const tijd = e.start.moment.slice(11, 16);
      const data = e.recurrenceId
        ? (startDatum >= plusDag(van, -Math.ceil(duur / 1440)) && startDatum <= tot ? [startDatum] : [])
        : herhalingen(startDatum, e.rrule, plusDag(van, -Math.ceil(duur / 1440)), tot, [...e.exdates, ...Array.from(vervangen.get(e.uid) || [])]);
      for (const d of data) {
        const begin = `${d} ${tijd}`;
        const eind = plusMinuten(begin, duur);
        if (eind <= `${van} 00:00`) continue;
        if (begin.slice(0, 10) > tot) continue;
        uit.push({ uid: e.uid, titel: e.titel, van: begin, tot: eind, heleDag });
      }
    }
  }
  return uit.sort((a, b) => a.van.localeCompare(b.van));
}

// ─── Van wie is een afspraak ─────────────────────────────────────────────────

const normaal = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Komt de naam als los woord in de titel voor? "Lea" wel in "Eef & Lea zitten", niet in "Leanne" of "Galea". */
export function noemtNaam(titel: string, naam: string): boolean {
  const n = normaal(naam).trim();
  if (!n) return false;
  const esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}($|[^a-z0-9])`).test(normaal(titel));
}

export function isOptie(titel: string): boolean {
  return /(^|[^a-z])(optie|sollicitant|sollicitatie)($|[^a-z])/.test(normaal(titel));
}

export interface AgendaBezet extends Bezet {
  /** De titel uit de agenda, alleen voor de planner. */
  titel: string;
}

/** Overlapt het halfuur dat om `tijd` begint met de afspraak? */
function overlapt(datum: string, tijd: string, a: AgendaItem): boolean {
  const begin = `${datum} ${tijd}`;
  const eind = plusMinuten(begin, GESPREKSDUUR_MIN);
  return begin < a.tot && eind > a.van;
}

/**
 * Welke halfuren bezet zijn per interviewer, volgens de agenda. `eigenUid` slaat Jobs eigen afspraken
 * uit deze omgeving over: die staan al in de database.
 */
export function bezetUitAgenda(items: AgendaItem[], interviewers: Interviewer[], data: string[], eigenUid?: (uid: string) => boolean): AgendaBezet[] {
  const uit: AgendaBezet[] = [];
  const bezet = new Set<string>();
  const zet = (interviewer: string, datum: string, tijd: string, titel: string) => {
    const k = `${interviewer}|${datum}|${tijd}`;
    if (bezet.has(k)) return;
    bezet.add(k);
    uit.push({ interviewer, datum, tijd, titel });
  };
  const relevant = items.filter((a) => !(eigenUid && eigenUid(a.uid)));
  const opties: AgendaItem[] = [];
  for (const a of relevant) {
    const namen = interviewers.filter((i) => noemtNaam(a.titel, i.naam));
    if (!namen.length) {
      if (!a.heleDag && isOptie(a.titel)) opties.push(a);
      continue;
    }
    for (const i of namen) for (const datum of data) {
      if (!i.dagen.includes(weekdag(datum))) continue;
      for (const tijd of tijdenVan(i)) if (overlapt(datum, tijd, a)) zet(i.naam, datum, tijd, a.titel);
    }
  }
  // Opties zonder naam: één interviewer per optie. Liefst iemand die het hele blok kan, zodat het één persoon blijft.
  for (const a of opties) {
    for (const datum of data) {
      const werkend = interviewers.filter((i) => i.actief !== false && i.dagen.includes(weekdag(datum)));
      const halfuren = (i: Interviewer) => tijdenVan(i).filter((t) => overlapt(datum, t, a));
      const kandidaten = werkend.filter((i) => halfuren(i).length > 0);
      if (!kandidaten.length) continue;
      const vrijHeel = kandidaten.find((i) => halfuren(i).every((t) => !bezet.has(`${i.naam}|${datum}|${t}`)));
      if (vrijHeel) { for (const t of halfuren(vrijHeel)) zet(vrijHeel.naam, datum, t, a.titel); continue; }
      // Anders per halfuur de eerste die dan nog vrij is.
      const tijden = Array.from(new Set(kandidaten.flatMap(halfuren))).sort();
      for (const t of tijden) {
        const i = kandidaten.find((x) => halfuren(x).includes(t) && !bezet.has(`${x.naam}|${datum}|${t}`));
        if (i) zet(i.naam, datum, t, a.titel);
      }
    }
  }
  return uit.sort((a, b) => `${a.datum} ${a.tijd} ${a.interviewer}`.localeCompare(`${b.datum} ${b.tijd} ${b.interviewer}`));
}

/** De datums vanaf morgen waarvoor Job momenten aanbiedt. */
export function agendaData(nu: Date, dagen: number): string[] {
  const vandaag = amsterdam(nu).datum;
  return Array.from({ length: dagen }, (_, n) => plusDag(vandaag, n + 1));
}

// ─── Schrijven ───────────────────────────────────────────────────────────────

export type Omgeving = "test" | "prod";

export const UID_DOMEIN = "doehetextra.nl";
export function afspraakUid(omgeving: Omgeving, id: number): string {
  return `job-afspraak-${omgeving}-${id}@${UID_DOMEIN}`;
}
export function afspraakBestandsnaam(omgeving: Omgeving, id: number): string {
  return `job-afspraak-${omgeving}-${id}.ics`;
}
/** Het afspraaknummer uit een UID van Job in deze omgeving, of null als het niet van Job (hier) is. */
export function afspraakIdUitUid(uid: string, omgeving: Omgeving): number | null {
  const m = new RegExp(`^job-afspraak-${omgeving}-(\\d+)@${UID_DOMEIN.replace(/\./g, "\\.")}$`).exec(uid.trim());
  return m ? Number(m[1]) : null;
}

const FUNCTIE_LABEL: Record<string, string> = {
  housekeeping: "housekeeping", horecamedewerker: "horeca", chef: "keuken", frontoffice: "front office", logistiek: "logistiek",
  bediening: "bediening", keuken: "keuken", afwas: "afwas", fb: "F&B", banqueting: "banqueting", bar: "bar",
  dinerloper: "dinerloper", runner: "runner", host: "host",
};

/** De functie tussen haakjes in de titel: liefst de gekozen functie, anders de soort. */
export function functieLabel(functieEersteKeus: string | null | undefined, functionType: string | null | undefined): string {
  const k = (functieEersteKeus || "").trim().toLowerCase();
  if (k && FUNCTIE_LABEL[k]) return FUNCTIE_LABEL[k];
  const f = (functionType || "").trim().toLowerCase();
  if (f && FUNCTIE_LABEL[f]) return FUNCTIE_LABEL[f];
  return k || f || "onbekend";
}

/** "Lea: Sollicitant Andres (logistiek)" (besluit Max, 27 november 2026). Alleen de voornaam. */
export function afspraakTitel(interviewer: string, voornaam: string, functie: string): string {
  const v = (voornaam || "").trim().split(/\s+/)[0] || "onbekend";
  return `${interviewer}: Sollicitant ${v} (${functie})`;
}

export interface AfspraakVoorAgenda {
  id: number; interviewer: string; voornaam: string; functie: string; datum: string; tijd: string; dossierLink: string;
}

/** Het iCalendar-bestand dat Job in de agenda zet. Tijden in UTC, zodat elke agenda ze goed toont. */
export function afspraakEvent(a: AfspraakVoorAgenda, omgeving: Omgeving, nu: Date = new Date()): string {
  const start = amsterdamNaarUtc(a.datum, a.tijd);
  const eind = new Date(start.getTime() + GESPREKSDUUR_MIN * 60000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EXTRA Uitzendbureau//Job agenda//NL",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${afspraakUid(omgeving, a.id)}`,
    `DTSTAMP:${utcStempel(nu)}`,
    `DTSTART:${utcStempel(start)}`,
    `DTEND:${utcStempel(eind)}`,
    `SUMMARY:${tekstIn(afspraakTitel(a.interviewer, a.voornaam, a.functie))}`,
    `LOCATION:${tekstIn("Herengracht 372, 1016 CH Amsterdam")}`,
    `DESCRIPTION:${tekstIn(`Ingepland door Job.\nDossier: ${a.dossierLink}`)}`,
    "X-EXTRA-JOB:1",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

// ─── Gelijk trekken ──────────────────────────────────────────────────────────

export interface AanwezigEvent { href: string; uid: string; titel: string; van: string }
export interface GeplandeAfspraak extends AfspraakVoorAgenda { status: string }

export interface AgendaPlan {
  /** Neerzetten of bijwerken: nieuw, of de tijd of titel klopt niet meer. */
  plaats: AfspraakVoorAgenda[];
  /** Weghalen: alleen Jobs eigen afspraken uit deze omgeving waarvan de afspraak verzet of geannuleerd is. */
  verwijder: AanwezigEvent[];
  /** Afspraaknummers die al goed in de agenda staan. */
  goed: number[];
}

/**
 * Wat er moet gebeuren om de agenda gelijk te trekken met de afspraken in de database.
 * `afspraken` bevat alle afspraken die Job kent in het venster, met hun status.
 */
export function agendaPlan(afspraken: GeplandeAfspraak[], aanwezig: AanwezigEvent[], omgeving: Omgeving): AgendaPlan {
  const perId = new Map<number, AanwezigEvent[]>();
  for (const e of aanwezig) {
    const id = afspraakIdUitUid(e.uid, omgeving);
    if (id === null) continue; // niet van Job, of van een andere omgeving: nooit aanraken
    perId.set(id, [...(perId.get(id) || []), e]);
  }
  const plaats: AfspraakVoorAgenda[] = [], verwijder: AanwezigEvent[] = [], goed: number[] = [];
  for (const a of afspraken) {
    const er = perId.get(a.id) || [];
    if (a.status === "gepland") {
      const titel = afspraakTitel(a.interviewer, a.voornaam, a.functie);
      if (er.some((e) => e.van === `${a.datum} ${a.tijd}` && e.titel === titel)) goed.push(a.id);
      else plaats.push(a);
    } else if (a.status === "verzet" || a.status === "geannuleerd") {
      verwijder.push(...er);
    }
  }
  // Een UID van Job zonder bekende afspraak (bijvoorbeeld buiten het venster) blijft staan.
  return { plaats, verwijder, goed };
}
