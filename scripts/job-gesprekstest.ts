/**
 * Gesprekstest met de echte AI (Job 4). Voert de vaste testgesprekken uit
 * scripts/jobGesprekken.ts volledig uit, via precies dezelfde weg als echte berichten
 * (verwerkBeurt), en controleert per gesprek en per bericht wat er moet kloppen.
 * Optioneel beoordeelt een tweede AI ("rechter") per beurt of Job aansluit.
 *
 * Draaien in de testomgeving (de AI-sleutel staat in de Secrets van Replit):
 *   npm run job:gesprekstest
 *   npm run job:gesprekstest -- gpt-4o-mini,gpt-4.1-mini          (modellen vergelijken)
 *   JOB_TEST_RECHTER=0 npm run job:gesprekstest                  (zonder rechter)
 *   JOB_TEST_FILTER=kok npm run job:gesprekstest                 (alleen gesprekken met "kok" in de naam)
 *   JOB_GESPREK_AI=0 npm run job:gesprekstest                    (Job 4 in plaats van Job 5, om te vergelijken)
 *
 * Er wordt niets opgeslagen en niets verstuurd: geen database, geen WhatsApp, geen mail.
 * Het volledige verslag komt in job-gesprekstest.txt (of JOB_TEST_UIT), ook als de test halverwege stopt.
 * Foutcode: 0 alles geslaagd, 1 een controle gefaald, 2 niets gefaald maar wel gesprekken niet uitgevoerd
 * (op een versie zonder vraagversie 2 draaien de v2-gesprekken niet), 3 afgebroken (geen AI-koppeling of vastgelopen).
 */
import { writeFileSync } from "fs";
import * as KM from "../shared/kandidaatMatch";
import * as RG from "../shared/jobRegels";
import { echteAi, verwerkBeurt, type AiAanroep } from "../server/job/jobBeurt";
import { plannerRedenen, profielVelden, samenvatting as plannerSamenvatting, start, type JobState, type Onderwerp } from "../shared/jobRegels";
import { berichtControle } from "../shared/jobBeurt";
import { GESPREKKEN, GESPREKKEN_V2, STANDAARD, type Gesprek } from "./jobGesprekken";
import { gesprekAan, gesprekModel } from "../shared/jobGesprek";

interface Beurtlog { kandidaat: string; job: string[]; onderwerpVoor: Onderwerp | null; ms: number; bron: string; soorten: string; tokens?: { in: number; uit: number }; opgeslagen?: string; punt?: string; punten?: Record<string, string>; planner?: string[] }
type Status = "geslaagd" | "gefaald" | "niet uitgevoerd";
/** Wat de kandidaat er met hetzelfde fictieve cv aan overhoudt: score, functie-eis en of een collega meekijkt. */
interface Kandidaatuitkomst { toestand: string; score: number | null; eis: string; eisTekst: string; collega: boolean }
interface Uitslag { naam: string; model: string; ok: boolean; status: Status; reden?: string; nietBeoordeeld?: string[]; vasteReeks?: string[]; naReeks?: { velden: Record<string, unknown>; planner: string[]; status: string; laatsteVraag: string }; uitkomst?: Kandidaatuitkomst; fouten: string[]; beurten: Beurtlog[]; vragen: number; state: JobState; collega: string[]; planner: string[]; groep?: string; rechter?: { goed: number; totaal: number; opmerkingen: string[] } }

const BEZIG = ["bezig", "wacht_cv", "geen_reactie"];
/** Velden van vraagversie 2 los gelezen: zo typecheckt de runner ook op de versie van vóór vraagversie 2. */
const vv = (s: JobState): Record<string, any> => s.velden as Record<string, any>;
const PEIL = new Date("2026-11-25T12:00:00Z");

export async function voerUit(g: Gesprek, ai: AiAanroep, model: string): Promise<Uitslag> {
  const nu = new Date();
  const r0 = start(g.ctx, g.taal, nu);
  let state = r0.state;
  // De oude versie (nulmeting) kent vraagversie 2 niet: de schakelaar staat in de context, maar het gesprek start zonder.
  const oudeVersie = !!(g.ctx as any).vraagversie2 && (r0.state.velden as any).vraagversie !== 2;
  if (oudeVersie && g.alleenVersie2) {
    return { naam: g.naam, model, ok: true, status: "niet uitgevoerd", reden: "alleen voor vraagversie 2; deze versie kent die niet", fouten: [], beurten: [], vragen: 0, state, collega: [], planner: [], groep: g.groep };
  }
  const geschiedenis: string[] = r0.berichten.map((b) => `Job: ${b.tekst}`);
  let laatsteJob = r0.berichten[r0.berichten.length - 1]?.tekst || "";
  // Midden in een gesprek beginnen: eerdere beurten en de stand op dat moment.
  if (g.voorgeschiedenis?.length) {
    for (const v of g.voorgeschiedenis) geschiedenis.push(`Kandidaat: ${v.kandidaat}`, `Job: ${v.job}`);
    laatsteJob = g.voorgeschiedenis[g.voorgeschiedenis.length - 1].job;
    state = { ...state, velden: { ...state.velden, ...(g.startVelden as object) }, laatsteOnderwerp: g.startOnderwerp ?? state.laatsteOnderwerp };
  }
  const beurten: Beurtlog[] = [];
  const gebruikt: Partial<Record<Onderwerp, number>> = {};
  const tussen = [...(g.tussendoor || [])];
  const gevraagd = new Set<Onderwerp>();
  const puntenGevraagd = new Set<string>();
  const puntGebruikt: Record<string, number> = {};
  if (vv(state).puntGevraagd) puntenGevraagd.add(vv(state).puntGevraagd);
  if (state.laatsteOnderwerp) gevraagd.add(state.laatsteOnderwerp);
  let vragen = r0.berichten.filter((b) => b.tekst.includes("?")).length;
  const fouten: string[] = [];
  let naReeks: Uitslag["naReeks"];

  for (let stap = 0; stap < 24; stap++) {
    const bezig = BEZIG.includes(state.status);
    const o = bezig ? state.laatsteOnderwerp : null;
    let bericht: string | null = null;
    const punt = o === "functievraag" ? vv(state).puntGevraagd : undefined;
    const ti = tussen.findIndex((t) => (bezig ? (t.bij === o && (!t.punt || t.punt === punt)) || (t.bij === "eerstvolgende" && beurten.length === 1) : t.bij === "na"));
    // Vaste reeks: deze berichten gaan op volgorde, welke vraag er ook openstaat. Zo krijgen de oude en de nieuwe
    // versie tot en met de beoordeelde beurt letterlijk dezelfde kandidaatberichten.
    if (g.vast && beurten.length < g.vast.length) bericht = bezig ? g.vast[beurten.length] : null;
    else if (ti >= 0) { bericht = tussen[ti].tekst; tussen.splice(ti, 1); }
    else if (bezig && o === "functievraag" && punt && g.puntAntwoorden?.[punt] !== undefined) {
      const a = g.puntAntwoorden[punt];
      const n = puntGebruikt[punt] || 0;
      bericht = Array.isArray(a) ? a[Math.min(n, a.length - 1)] : a;
      puntGebruikt[punt] = n + 1;
      if (n + 1 > 3) { fouten.push(`lus: functievraag over ${punt} kwam meer dan drie keer`); break; }
    } else if (bezig && o === "functievraag" && !punt && g.antwoorden.functievraag === undefined && g.puntAntwoorden) {
      // Een versie zonder functiepunten (nulmeting): het eerste antwoord uit de punten.
      const a = Object.values(g.puntAntwoorden)[0];
      bericht = Array.isArray(a) ? a[0] : a;
      gebruikt.functievraag = (gebruikt.functievraag || 0) + 1;
      if ((gebruikt.functievraag || 0) > 4) { fouten.push("lus: functievraag kwam meer dan vier keer"); break; }
    } else if (bezig && o) {
      const a = g.antwoorden[o];
      const n = gebruikt[o] || 0;
      bericht = Array.isArray(a) ? a[Math.min(n, a.length - 1)] : a ?? STANDAARD[g.taal][o] ?? null;
      gebruikt[o] = n + 1;
      if ((gebruikt[o] || 0) > 4) { fouten.push(`lus: vraag over ${o} kwam meer dan vier keer`); break; }
    }
    if (!bericht) break;
    const u = await verwerkBeurt({ state, ctx: g.ctx, tekst: bericht, laatsteVraag: laatsteJob, geschiedenis: geschiedenis.slice(-24).join("\n"), nu, ai });
    const teksten = u.r.berichten.map((b) => b.tekst);
    beurten.push({ kandidaat: bericht, job: teksten, onderwerpVoor: o, ms: u.ai?.ms ?? 0, bron: u.bron, soorten: u.beurt?.soorten.join("+") || "-", tokens: u.ai?.tokens, opgeslagen: verschil(state.velden, u.r.state.velden), punt, punten: { ...(vv(u.r.state).punten || {}) }, planner: plannerVan(u.r.state, g.ctx) });
    geschiedenis.push(`Kandidaat: ${bericht}`);
    for (const t of teksten) { geschiedenis.push(`Job: ${t}`); if (t.includes("?")) vragen++; }
    if (teksten.length) laatsteJob = teksten[teksten.length - 1];
    state = u.r.state;
    // De stand direct na de vaste reeks: die is in beide versies op precies dezelfde berichten gebaseerd.
    if (g.vast && beurten.length === g.vast.length) naReeks = { velden: JSON.parse(JSON.stringify(state.velden)), planner: plannerVan(state, g.ctx), status: state.status, laatsteVraag: laatsteJob };
    if (BEZIG.includes(state.status) && state.laatsteOnderwerp) gevraagd.add(state.laatsteOnderwerp);
    if (BEZIG.includes(state.status) && state.laatsteOnderwerp === "functievraag" && vv(state).puntGevraagd) puntenGevraagd.add(vv(state).puntGevraagd);
    for (const t of teksten) for (const f of berichtControle(t, state.taal)) fouten.push(`bericht "${t.slice(0, 60)}": ${f}`);
    // Twee keer exact hetzelfde bericht van Job achter elkaar is een lus.
    const vorige = beurten[beurten.length - 2];
    if (vorige && teksten.length && vorige.job.join("|") === teksten.join("|")) fouten.push(`zelfde bericht twee keer: "${teksten[0].slice(0, 60)}"`);
    if (!BEZIG.includes(state.status) && !tussen.some((t) => t.bij === "na")) break;
  }

  const v = g.verwacht;
  // De vaste reeks moet helemaal en letterlijk verstuurd zijn, anders is dit stuk niet vergelijkbaar.
  const vasteReeks = g.vast ? beurten.slice(0, g.vast.length).map((b) => b.kandidaat) : undefined;
  if (g.vast && (vasteReeks!.length !== g.vast.length || vasteReeks!.some((b, i) => b !== g.vast![i]))) fouten.push(`vaste reeks niet zoals vastgelegd verstuurd (${vasteReeks!.length} van ${g.vast.length}): het gesprek stopte eerder`);
  // Controles op functiepunten zeggen niets over de oude versie: die staan apart als niet beoordeeld.
  const nietBeoordeeld: string[] = [];
  const alleenNieuw = (wat: string) => { if (oudeVersie) { nietBeoordeeld.push(wat); return false; } return true; };
  for (const [veld, re] of Object.entries(v.velden || {})) {
    const w = (state.velden as any)[veld];
    if (w === undefined || !(re as RegExp).test(String(w))) fouten.push(`veld ${veld} is "${w ?? "leeg"}", verwacht ${re}`);
  }
  for (const n of v.nooit || []) {
    const w = (state.velden as any)[n.veld];
    if (w !== undefined && n.bevat.test(String(w))) fouten.push(`veld ${n.veld} bevat "${w}" (mag niet)`);
  }
  for (const o of v.nietGevraagd || []) if (gevraagd.has(o)) fouten.push(`vraag over ${o} gesteld (hoefde niet)`);
  for (const o of v.welGevraagd || []) if (!gevraagd.has(o)) fouten.push(`vraag over ${o} niet gesteld`);
  if (Object.keys(v.punten || {}).length && alleenNieuw(`punten ${Object.keys(v.punten!).join(", ")}`)) for (const [k, re] of Object.entries(v.punten || {})) {
    const w = vv(state).punten?.[k];
    if (w === undefined || !re.test(w)) fouten.push(`punt ${k} is "${w ?? "leeg"}", verwacht ${re}`);
  }
  if (v.puntenLeeg?.length && alleenNieuw(`lege punten ${v.puntenLeeg.join(", ")}`)) for (const k of v.puntenLeeg) if (vv(state).punten?.[k] !== undefined) fouten.push(`punt ${k} is "${vv(state).punten[k]}" (moest leeg blijven)`);
  if (Object.keys(v.puntNiet || {}).length && alleenNieuw(`verkeerde waarden ${Object.keys(v.puntNiet!).join(", ")}`)) for (const [k, re] of Object.entries(v.puntNiet || {})) {
    const w = vv(state).punten?.[k];
    if (w !== undefined && re.test(w)) fouten.push(`punt ${k} is "${w}" (de kandidaat zei iets anders)`);
  }
  if (v.puntNietGevraagd?.length && alleenNieuw(`niet gevraagd ${v.puntNietGevraagd.join(", ")}`)) for (const k of v.puntNietGevraagd) if (puntenGevraagd.has(k)) fouten.push(`functievraag over ${k} gesteld (was al bekend)`);
  if (v.puntWelGevraagd?.length && alleenNieuw(`wel gevraagd ${v.puntWelGevraagd.join(", ")}`)) for (const k of v.puntWelGevraagd) if (!puntenGevraagd.has(k)) fouten.push(`functievraag over ${k} niet gesteld`);
  // Kijkt een collega mee vóór de uitnodiging? De redenen gelden ook als het cv nog moet komen.
  const collega = plannerRedenen(state.velden, g.ctx, state.twijfels);
  if (v.collega === true && !collega.length) fouten.push("geen collega, verwacht wel");
  if (v.collega === false && collega.length) fouten.push(`collega kijkt mee (${collega.join(" ")}), verwacht niet`);
  if (v.maxFunctievragen !== undefined && !oudeVersie && (vv(state).functievragen || 0) > v.maxFunctievragen) fouten.push(`${vv(state).functievragen} functievragen, hooguit ${v.maxFunctievragen}`);
  if (vv(state).vraagversie === 2 && (vv(state).functievragen || 0) > 3) fouten.push(`${vv(state).functievragen} functievragen, de grens is drie`);
  if (v.maxVragen && vragen > v.maxVragen) fouten.push(`${vragen} vragen, hooguit ${v.maxVragen}`);
  if (v.eindstatus && !v.eindstatus.includes(state.status)) fouten.push(`eindstatus ${state.status}, verwacht ${v.eindstatus.join(" of ")}`);
  if (v.taal && state.taal !== v.taal) fouten.push(`gesprekstaal ${state.taal}, verwacht ${v.taal}`);
  // Een gepland tussenbericht dat nooit is verstuurd: dan is die situatie niet getest.
  for (const t of tussen) fouten.push(`tussenbericht "${t.tekst.slice(0, 50)}" (bij ${t.bij}${t.punt ? `, ${t.punt}` : ""}) is nooit verstuurd`);
  for (const rv of v.reactie || []) {
    const b = beurten.filter((x) => rv.na.test(x.kandidaat));
    if (!b.length) { fouten.push(`bericht ${rv.na} niet verstuurd in de test`); continue; }
    for (const x of b) {
      if ((rv.puntLeeg || rv.puntGevuld) && oudeVersie) nietBeoordeeld.push(`punt ${rv.puntLeeg || rv.puntGevuld} na "${x.kandidaat.slice(0, 40)}"`);
      if (rv.puntLeeg && !oudeVersie && x.punten?.[rv.puntLeeg] !== undefined) fouten.push(`na "${x.kandidaat.slice(0, 40)}": punt ${rv.puntLeeg} is "${x.punten[rv.puntLeeg]}" (moest leeg blijven)`);
      if (rv.puntGevuld && !oudeVersie && x.punten?.[rv.puntGevuld] === undefined) fouten.push(`na "${x.kandidaat.slice(0, 40)}": punt ${rv.puntGevuld} niet vastgelegd`);
      const t = x.job.join(" ");
      if (rv.moet && !rv.moet.test(t)) fouten.push(`na "${x.kandidaat.slice(0, 40)}": antwoord "${t.slice(0, 90)}" mist ${rv.moet}`);
      if (rv.nietMoet && rv.nietMoet.test(t)) fouten.push(`na "${x.kandidaat.slice(0, 40)}": antwoord "${t.slice(0, 90)}" bevat ${rv.nietMoet}`);
      // De plannerkaart direct na deze beurt, niet pas aan het eind van het gesprek.
      const kaart = (x.planner || []).join(" | ");
      if (rv.planner && !rv.planner.test(kaart)) fouten.push(`na "${x.kandidaat.slice(0, 40)}": de planner ziet "${kaart.slice(0, 160)}" en mist ${rv.planner}`);
      if (rv.plannerNiet && rv.plannerNiet.test(kaart)) fouten.push(`na "${x.kandidaat.slice(0, 40)}": de planner ziet "${kaart.slice(0, 160)}" met ${rv.plannerNiet}`);
    }
  }
  if (beurten.some((b) => b.bron === "terugval")) fouten.push(`AI viel ${beurten.filter((b) => b.bron === "terugval").length} keer uit (terugval gebruikt)`);
  // Wat de planner uiteindelijk ziet: de samenvatting, de profielvelden en waarom een collega meekijkt.
  const planner = plannerVan(state, g.ctx);
  for (const re of v.plannerNooit || []) for (const regel of [...planner, ...(naReeks?.planner || [])]) if (re.test(regel)) fouten.push(`de planner ziet "${regel.slice(0, 90)}" (mag niet: ${re})`);
  const uitkomst = g.cv ? kandidaatuitkomst(g, state, collega.length > 0) : undefined;
  const ok = fouten.length === 0;
  return { naam: g.naam, model, ok, status: ok ? "geslaagd" : "gefaald", ...(nietBeoordeeld.length ? { nietBeoordeeld } : {}), ...(vasteReeks ? { vasteReeks, naReeks } : {}), ...(uitkomst ? { uitkomst } : {}), fouten, beurten, vragen, state, collega, planner, groep: g.groep };
}

/** Wat de planner ziet: de samenvatting, de profielvelden, het kaartveld en de twijfels. */
function plannerVan(state: JobState, ctx: Gesprek["ctx"]): string[] {
  const pv = profielVelden(state.velden);
  return [`Samenvatting: ${plannerSamenvatting(state.velden, ctx)}`, ...Object.entries(pv).map(([k, w]) => `${k}: ${w}`), ...(state.velden.functievraag ? [`Functie (kaart): ${state.velden.functievraag}`] : []), ...state.twijfels.map((t) => `Twijfel: ${t}`)];
}

/** De match met het fictieve cv van dit gesprek, zoals de cv-analyse hem met dit dossier zou maken. */
function kandidaatuitkomst(g: Gesprek, state: JobState, collega: boolean): Kandidaatuitkomst {
  const km = KM as any, rg = RG as any;
  const v = vv(state);
  const versie2 = v.vraagversie === 2;
  const keuze = (g.ctx as any).functieCode ?? g.ctx.functie;
  const functie = km.matchFunctie ? km.matchFunctie(keuze, v) : keuze;
  const model = km.modelVoor(functie, g.ctx.functie, (g.ctx as any).label ?? null, versie2);
  const geen = rg.geenErvaringTelt ? rg.geenErvaringTelt(v) : v.ervaringNiveau === "geen";
  const kennis = km.gesprekKennisUit ? km.gesprekKennisUit(v, geen) : { ervaringNiveau: geen ? "geen" : v.ervaringNiveau ?? null };
  const k = km.matchKaart(model, g.cv!.periodes, g.cv!.certificaten || [], kennis, PEIL, { versie2, functie, formulierKeuze: keuze });
  return { toestand: k.uitkomst.toestand, score: k.uitkomst.score ?? null, eis: k.eis.status, eisTekst: k.eis.tekst, collega };
}

/** Wat deze beurt in het dossier veranderde, leesbaar (voor het verslag). */
function verschil(oud: Record<string, any>, nieuw: Record<string, any>): string {
  const uit: string[] = [];
  const stil = ["pogingen", "doorvragen", "puntGevraagd", "functievragen", "puntenGevraagd", "taalWissels", "vraagversie"];
  for (const k of Object.keys(nieuw)) {
    if (stil.includes(k)) continue;
    const a = JSON.stringify(oud[k]); const b = JSON.stringify(nieuw[k]);
    if (a === b) continue;
    if (k === "punten" || k === "puntBewijs") {
      for (const pk of Object.keys(nieuw[k] || {})) if ((oud[k] || {})[pk] !== nieuw[k][pk]) uit.push(`${k === "punten" ? "punt" : "citaat"} ${pk} = ${JSON.stringify(nieuw[k][pk])}`);
    } else uit.push(`${k} = ${b}`);
  }
  return uit.join("; ") || "(niets nieuws)";
}

/** De rechter: sluit elke reactie van Job aan op de kandidaat en de vraag? */
async function beoordeel(u: Uitslag, rechter: AiAanroep): Promise<Uitslag["rechter"]> {
  const transcript = u.beurten.map((b, i) => `[${i + 1}] Kandidaat: ${b.kandidaat}\n    Job: ${b.job.join(" / ") || "(geen bericht)"}`).join("\n");
  const systeem = `Je beoordeelt een WhatsApp-gesprek tussen Job (AI-recruiter van uitzendbureau EXTRA) en een kandidaat. Beoordeel elke reactie van Job streng op:
1. Sluit het aan op wat de kandidaat net schreef (antwoord, vraag, correctie, frustratie, bedankje)?
2. Is het logisch na de vorige vraag, zonder herhaling van iets wat al beantwoord is?
3. Kort en natuurlijk (hooguit twee zinnen en één vraag), warm en direct, geen standaardlof?
4. Verzint Job geen feiten of beloftes?
Achtergrond: vaste stappen van Job zijn waar en horen bij de flow: hij stuurt echt een mail met een uploadknop als de kandidaat het cv later stuurt, een collega bekijkt daarna de aanmelding en de kandidaat kiest zelf een moment; de vraag naar het aantal sterren van het beste hotel hoort bij hotelfuncties. Beoordeel die stappen niet als verzonnen.
Antwoord uitsluitend met JSON: {"beurten": [{"nr": 1, "goed": true, "reden": "kort"}]}`;
  const r = await rechter(systeem, transcript);
  if (!r?.inhoud) return undefined;
  try {
    const j = JSON.parse(r.inhoud.slice(r.inhoud.indexOf("{"), r.inhoud.lastIndexOf("}") + 1));
    const lijst: { nr: number; goed: boolean; reden: string }[] = Array.isArray(j?.beurten) ? j.beurten : [];
    return { goed: lijst.filter((x) => x.goed).length, totaal: lijst.length, opmerkingen: lijst.filter((x) => !x.goed).map((x) => `[${x.nr}] ${x.reden}`) };
  } catch { return undefined; }
}

/** Tekst gelijk maken voor de vergelijking: kleine letters, alleen letters en cijfers. */
function kaal(t: string): string { return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
function afstand(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let vorige = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) { const tmp = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, vorige + (a[i - 1] === b[j - 1] ? 0 : 1)); vorige = tmp; }
  }
  return d[b.length];
}
function lijkt(a: string, b: string): number { const m = Math.max(a.length, b.length); return m ? 1 - afstand(a, b) / m : 1; }
/**
 * Zelfde inhoud, andere spelling? "opera" en "Opera" wel, "inchecke" en "inchecken" wel, "Opera" en "Mews" niet.
 * Per woord met een kleine tikfoutmarge; minstens 60% van de woorden moet een tegenhanger hebben.
 */
const ONTKEND = /\b(niet|geen|nooit|nee|no|not|never|none)\b/;
export function gelijkeInhoud(a: string, b: string): boolean {
  const x = kaal(a), y = kaal(b);
  if (x === y) return true;
  // "Zelfstandig ingecheckt" en "niet zelfstandig ingecheckt" lijken op elkaar, maar zeggen het tegendeel.
  if (ONTKEND.test(x) !== ONTKEND.test(y)) return false;
  if (lijkt(x, y) >= 0.8) return true;
  const wa = x.split(" ").filter((w) => w.length > 2), wb = y.split(" ").filter((w) => w.length > 2);
  if (!wa.length || !wb.length) return false;
  const raak = (w: string, lijst: string[]) => lijst.some((v) => v === w || (Math.min(w.length, v.length) >= 4 && lijkt(w, v) >= 0.75));
  const gedeeld = Math.min(wa.filter((w) => raak(w, wb)).length, wb.filter((w) => raak(w, wa)).length);
  return gedeeld / Math.max(wa.length, wb.length) >= 0.6;
}
/**
 * Vergelijkt gesprekken met dezelfde inhoud: de vastgelegde punten, of een collega meekijkt en (met hetzelfde fictieve cv)
 * de matchscore en de functie-eis. Elk verschil is een regel.
 */
export function verschillenInGroep(lijst: { naam: string; punten: Record<string, string>; collega: boolean; uitkomst?: Kandidaatuitkomst }[]): string[] {
  const uit: string[] = [];
  const [eerste, ...rest] = lijst;
  if (!eerste) return uit;
  for (const ander of rest) {
    const sleutels = Array.from(new Set([...Object.keys(eerste.punten), ...Object.keys(ander.punten)])).sort();
    for (const k of sleutels) {
      const a = eerste.punten[k], b = ander.punten[k];
      if (a === undefined || b === undefined) uit.push(`punt ${k}: "${a ?? "leeg"}" tegenover "${b ?? "leeg"}" (${ander.naam})`);
      else if (!gelijkeInhoud(a, b)) uit.push(`punt ${k}: "${a}" tegenover "${b}" (${ander.naam})`);
    }
    if (eerste.collega !== ander.collega) uit.push(`collega: ${eerste.collega ? "ja" : "nee"} tegenover ${ander.collega ? "ja" : "nee"} (${ander.naam})`);
    const a = eerste.uitkomst, b = ander.uitkomst;
    if (a && b) {
      if (a.toestand !== b.toestand || a.score !== b.score) uit.push(`matchscore: ${a.score ?? a.toestand} tegenover ${b.score ?? b.toestand} (${ander.naam})`);
      if (a.eis !== b.eis || a.eisTekst !== b.eisTekst) uit.push(`functie-eis: ${a.eis} "${a.eisTekst}" tegenover ${b.eis} "${b.eisTekst}" (${ander.naam})`);
    } else if (a || b) uit.push(`matchscore alleen bij één van de twee berekend (${ander.naam})`);
  }
  return uit;
}

async function inGroepen<T, U>(lijst: T[], n: number, f: (x: T) => Promise<U>): Promise<U[]> {
  const uit: U[] = new Array(lijst.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < lijst.length) { const k = i++; uit[k] = await f(lijst[k]); } }));
  return uit;
}

async function main() {
  console.log("Gesprekstest gestart. Dit duurt even; per gesprek verschijnt een regel.");
  // Standaard hetzelfde model als Job in deze omgeving gebruikt (Job 5: JOB_GESPREK_MODEL).
  const standaard = gesprekAan(process.env) ? gesprekModel(process.env) : process.env.JOB_AI_MODEL || "gpt-4o-mini";
  const modellen = (process.argv[2] || process.env.JOB_TEST_MODELLEN || standaard).split(",").map((m: string) => m.trim()).filter(Boolean);
  const rechterModel = process.env.JOB_TEST_RECHTER === "0" ? null : process.env.JOB_TEST_RECHTER || "gpt-4o";
  const filter = (process.env.JOB_TEST_FILTER || "").toLowerCase();
  // JOB_TEST_SET=v2 alleen de nieuwe functievragen, =oud alleen de bestaande; standaard allebei.
  const set = (process.env.JOB_TEST_SET || "").toLowerCase();
  const basis = set === "v2" ? GESPREKKEN_V2 : set === "oud" ? GESPREKKEN : [...GESPREKKEN_V2, ...GESPREKKEN];
  // De belangrijkste situaties draaien vaker (herhaal), om te zien of Job het telkens goed doet. De eerste keer houdt
  // de gewone naam (daarop vergelijkt de voor-en-nameting); een herhaling staat los van de spellingparen.
  const alle = herhaald(basis, process.env.JOB_TEST_HERHAAL === "0" ? 1 : undefined);
  const gesprekken = alle.filter((g) => !filter || g.naam.toLowerCase().includes(filter));
  const uit = process.env.JOB_TEST_UIT || "job-gesprekstest.txt";
  const uitJson = uit.replace(/\.txt$/, "") + ".json";
  const instellingen = instellingenNu(modellen, rechterModel);
  const kop = [`Gesprekstest Job, ${new Date().toISOString()}`, `Modellen: ${modellen.join(", ")}; rechter: ${rechterModel || "uit"}; gesprekken: ${gesprekken.length}`, `Instellingen: ${JSON.stringify(instellingen)}`, ""];
  const alleUitslagen: Uitslag[] = [];
  const extra: string[] = [];
  let afgebroken: string | null = null;
  let klaar = false;
  // Het verslag gaat na elk afgerond gesprek naar schijf (tekst en json), zodat een onderbreking niets kost.
  const schrijf = () => {
    const regels = [...kop, ...alleUitslagen.flatMap((u) => verslagVan(u, alle)), ...extra, "", ...samenvattingVan(alleUitslagen, alle),
      ...(klaar ? [] : ["", `TEST LOOPT NOG of is onderbroken: ${alleUitslagen.length} van ${gesprekken.length * modellen.length} gesprekken klaar.`]),
      ...(afgebroken ? ["", `AFGEBROKEN: ${afgebroken}`] : [])];
    writeFileSync(uit, regels.join("\n"));
    writeFileSync(uitJson, JSON.stringify({ gestart: kop[0], instellingen, klaar, afgebroken, gesprekken: alleUitslagen.map(alsJson) }, null, 1));
  };
  try {
    if (!echteAi()) throw new Error("Geen AI-koppeling gevonden. Draai dit in de testomgeving op Replit (AI_INTEGRATIONS_OPENAI_* in de Secrets).");
    const rechter = rechterModel ? echteAi(rechterModel, 120_000, true) : null;
    const parallel = Math.max(1, Number(process.env.JOB_TEST_PARALLEL || 1));
    for (const model of modellen) {
      // Ruime tijdslimiet en stil: bij de snelheidslimiet van de AI wacht de test en probeert opnieuw.
      const ai = echteAi(model, 90_000, true)!;
      let n = 0;
      await inGroepen(gesprekken, parallel, async (g) => {
        // Een gesprek dat vastloopt, telt als gefaald met de reden; de rest gaat door.
        const u: Uitslag = await voerUit(g, ai, model).catch((e) => ({ naam: g.naam, model, ok: false, status: "gefaald" as Status, fouten: [`gesprek liep vast: ${e?.message || e}`], beurten: [], vragen: 0, state: start(g.ctx, g.taal, new Date()).state, collega: [], planner: [], groep: g.groep }));
        if (rechter && u.status !== "niet uitgevoerd" && u.beurten.length) u.rechter = await beoordeel(u, rechter).catch(() => undefined);
        n++;
        console.log(`  [${model}] ${n}/${gesprekken.length} ${u.status === "niet uitgevoerd" ? "-" : u.ok ? "✓" : "✗"} ${u.naam}${u.status === "niet uitgevoerd" ? " (niet uitgevoerd)" : ""}`);
        alleUitslagen.push(u);
        schrijf();
        return u;
      });
    }
    // Zelfde inhoud, andere spelling: punten, collega en (met hetzelfde fictieve cv) matchscore en functie-eis moeten gelijk zijn.
    const groepen = new Map<string, Uitslag[]>();
    for (const u of alleUitslagen) if (u.groep && u.status !== "niet uitgevoerd") groepen.set(`${u.model} ${u.groep}`, [...(groepen.get(`${u.model} ${u.groep}`) || []), u]);
    for (const [naam, lijst] of Array.from(groepen.entries())) {
      extra.push(`Vergelijking ${naam}:`);
      for (const u of lijst) extra.push(`  ${u.naam}: punten ${JSON.stringify(vv(u.state).punten || {})}; collega ${u.collega.length ? "ja" : "nee"}${u.uitkomst ? `; match ${u.uitkomst.score ?? u.uitkomst.toestand}, eis ${u.uitkomst.eis} (${u.uitkomst.eisTekst})` : ""}`);
      const verschillen = verschillenInGroep(lijst.map((u) => ({ naam: u.naam, punten: { ...(vv(u.state).punten || {}) }, collega: u.collega.length > 0, uitkomst: u.uitkomst })));
      extra.push(`  Zelfde uitkomst voor de kandidaat: ${verschillen.length ? "nee" : "ja"}`, ...verschillen.map((x) => `   - ${x}`), "");
      if (verschillen.length) for (const u of lijst) { u.fouten.push(`spellingpaar ${naam}: ${verschillen.join("; ")}`); u.ok = false; u.status = "gefaald"; }
    }
  } catch (e: any) {
    afgebroken = e?.message || String(e);
  } finally {
    klaar = !afgebroken;
    schrijf();
    const fout = alleUitslagen.filter((u) => u.status === "gefaald").length;
    const niet = alleUitslagen.filter((u) => u.status === "niet uitgevoerd").length;
    const code = afgebroken ? 3 : fout ? 1 : niet ? 2 : 0;
    console.log("\n" + samenvattingVan(alleUitslagen, alle).join("\n") + (afgebroken ? `\nAFGEBROKEN: ${afgebroken}` : ""));
    console.log(`\nVolledig verslag: ${uit} (en ${uitJson}). Foutcode ${code}.`);
    process.exitCode = code;
  }
}

/** Elk gesprek zo vaak als het vraagt (herhaal); met max = 1 alles één keer. */
export function herhaald(lijst: Gesprek[], max?: number): Gesprek[] {
  const uit: Gesprek[] = [];
  for (const g of lijst) {
    const n = Math.max(1, Math.min(max ?? g.herhaal ?? 1, 5));
    uit.push(g);
    for (let i = 2; i <= n; i++) uit.push({ ...g, naam: `${g.naam} (herhaling ${i})`, groep: undefined });
  }
  return uit;
}

/** De instellingen die de uitkomst bepalen: voor en na moeten gelijk zijn (scripts/job-gesprekstest-vergelijk.ts). */
export function instellingenNu(modellen: string[], rechter: string | null): Record<string, string | null> {
  const e = process.env;
  return { modellen: modellen.join(","), rechter, JOB_GESPREK_AI: e.JOB_GESPREK_AI ?? null, JOB_GESPREK_MODEL: e.JOB_GESPREK_MODEL ?? null, JOB_AI_MODEL: e.JOB_AI_MODEL ?? null,
    JOB_FUNCTIEVRAGEN: e.JOB_FUNCTIEVRAGEN ?? null, TESTOMGEVING: e.TESTOMGEVING ?? null, JOB_TEST_SET: e.JOB_TEST_SET ?? null, JOB_TEST_FILTER: e.JOB_TEST_FILTER ?? null, JOB_TEST_HERHAAL: e.JOB_TEST_HERHAAL ?? null };
}

/** Het verslag van één gesprek: elke beurt letterlijk, wat Job opsloeg en wat de planner ziet. */
function verslagVan(u: Uitslag, alle: Gesprek[]): string[] {
  const g = alle.find((x) => x.naam === u.naam);
  const teken = u.status === "niet uitgevoerd" ? "-" : u.ok ? "✓" : "✗";
  const kop = `${teken} [${u.model}] ${u.naam} [${u.status}${u.status === "niet uitgevoerd" ? `: ${u.reden}` : ""}]${g?.vast ? " (vast voor-en-nagesprek)" : ""}${g?.eerdereFout ? " (eerdere fout)" : ""}${u.rechter ? `, rechter ${u.rechter.goed}/${u.rechter.totaal}` : ""}`;
  if (u.status === "niet uitgevoerd") return [kop, ""];
  const uit = [kop, ...u.fouten.map((f) => `   - ${f}`), ...(u.nietBeoordeeld || []).map((n) => `   ~ niet beoordeeld op deze versie: ${n}`), ...(u.rechter?.opmerkingen || []).map((o) => `   * rechter ${o}`)];
  if (u.vasteReeks) uit.push(`   Vaste reeks (${u.vasteReeks.length} berichten, vingerafdruk ${vingerafdruk(u.vasteReeks)}):`, ...u.vasteReeks.map((b, i) => `     ${i + 1}. ${b}`),
    ...(u.naReeks ? ["   Direct na de vaste reeks ziet de planner:", ...u.naReeks.planner.map((p) => `     ${p}`)] : []));
  u.beurten.forEach((b, i) => uit.push(`   K${i + 1}: ${b.kandidaat}`, ...b.job.map((t) => `   J: ${t}`), `      opgeslagen: ${b.opgeslagen}`, `      (${b.bron} ${b.soorten} ${b.ms} ms, vraag was ${b.onderwerpVoor ?? "-"}${b.punt ? ` over ${b.punt}` : ""})`, ...(b.planner?.length ? [`      planner na deze beurt: ${b.planner.join(" | ")}`] : [])));
  uit.push(`   Velden: ${JSON.stringify(u.state.velden)}`, `   Status: ${u.state.status}, taal ${u.state.taal}, ${u.vragen} vragen`, `   Collega kijkt mee: ${u.collega.length ? `ja (${u.collega.join(" ")})` : "nee"}`);
  if (u.uitkomst) uit.push(`   Met het fictieve cv: match ${u.uitkomst.score ?? u.uitkomst.toestand}, eis ${u.uitkomst.eis} (${u.uitkomst.eisTekst})`);
  uit.push("   De planner ziet:", ...u.planner.map((p) => `     ${p}`), "");
  return uit;
}

function samenvattingVan(lijst: Uitslag[], alle: Gesprek[]): string[] {
  const uit: string[] = ["Samenvatting"];
  for (const model of Array.from(new Set(lijst.map((u) => u.model)))) {
    const us = lijst.filter((u) => u.model === model);
    const ms = us.flatMap((u) => u.beurten.map((b) => b.ms)).filter((x) => x > 0).sort((a, b) => a - b);
    const gem = ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : 0;
    const p95 = ms.length ? ms[Math.min(ms.length - 1, Math.floor(ms.length * 0.95))] : 0;
    const tin = us.flatMap((u) => u.beurten.map((b) => b.tokens?.in || 0)).reduce((a, b) => a + b, 0);
    const tuit = us.flatMap((u) => u.beurten.map((b) => b.tokens?.uit || 0)).reduce((a, b) => a + b, 0);
    const beurtenTotaal = us.reduce((a, u) => a + u.beurten.length, 0);
    const rg = us.reduce((a, u) => a + (u.rechter?.goed || 0), 0), rt = us.reduce((a, u) => a + (u.rechter?.totaal || 0), 0);
    const tel = (s: Status) => us.filter((u) => u.status === s).length;
    uit.push(`${model}: ${tel("geslaagd")} geslaagd, ${tel("gefaald")} gefaald, ${tel("niet uitgevoerd")} niet uitgevoerd (van ${us.length}); rechter ${rt ? `${rg}/${rt} beurten goed` : "uit"}; ${beurtenTotaal} beurten, gem. ${gem} ms, p95 ${p95} ms; tokens ${tin} in, ${tuit} uit`);
    for (const u of us) {
      const g = alle.find((x) => x.naam === u.naam);
      uit.push(`  ${u.status === "niet uitgevoerd" ? "-" : u.ok ? "✓" : "✗"} ${u.naam} [${u.status}]${g?.vast ? " (vast voor-en-nagesprek)" : ""}`);
      for (const f of u.fouten) uit.push(`      - ${f}`);
      if (u.nietBeoordeeld?.length) uit.push(`      niet beoordeeld op deze versie: ${u.nietBeoordeeld.join("; ")}`);
    }
  }
  const tel = (s: Status) => lijst.filter((u) => u.status === s).length;
  uit.push("", `Totaal: ${tel("geslaagd")} geslaagd, ${tel("gefaald")} gefaald, ${tel("niet uitgevoerd")} niet uitgevoerd. Foutcode: 0 alles geslaagd, 1 een controle gefaald, 2 alleen niet uitgevoerd, 3 afgebroken (bijvoorbeeld geen AI-koppeling).`);
  return uit;
}

/** Korte vingerafdruk van de vaste reeks, om de voor- en nameting snel naast elkaar te leggen. */
export function vingerafdruk(berichten: string[]): string {
  let h = 2166136261;
  for (const ch of berichten.join("\u0000")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

/** Wat de vergelijking van voor- en nameting nodig heeft (scripts/job-gesprekstest-vergelijk.ts). */
function alsJson(u: Uitslag) {
  return { naam: u.naam, model: u.model, status: u.status, fouten: u.fouten, nietBeoordeeld: u.nietBeoordeeld || [], vasteReeks: u.vasteReeks || null, naReeks: u.naReeks || null,
    beurten: u.beurten.map((b) => ({ kandidaat: b.kandidaat, job: b.job, opgeslagen: b.opgeslagen, vraagWas: b.onderwerpVoor, punt: b.punt || null, bron: b.bron, planner: b.planner || [] })),
    velden: u.state.velden, status_gesprek: u.state.status, collega: u.collega, planner: u.planner, uitkomst: u.uitkomst || null };
}

// Alleen draaien als script (de huistest van de runner importeert voerUit).
if (/job-gesprekstest\.ts$/.test(process.argv[1] || "")) main().then(() => process.exit(process.exitCode ?? 0), (e) => { console.error("Mislukt:", e?.message || e); process.exit(3); });
