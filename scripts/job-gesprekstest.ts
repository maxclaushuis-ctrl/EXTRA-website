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
 *
 * Er wordt niets opgeslagen en niets verstuurd: geen database, geen WhatsApp, geen mail.
 * Het volledige verslag komt in job-gesprekstest.txt; op het scherm staat de samenvatting.
 */
import { writeFileSync } from "fs";
import { echteAi, verwerkBeurt, type AiAanroep } from "../server/job/jobBeurt";
import { start, type JobState, type Onderwerp } from "../shared/jobRegels";
import { berichtControle } from "../shared/jobBeurt";
import { GESPREKKEN, STANDAARD, type Gesprek } from "./jobGesprekken";

interface Beurtlog { kandidaat: string; job: string[]; onderwerpVoor: Onderwerp | null; ms: number; bron: string; soorten: string; tokens?: { in: number; uit: number } }
interface Uitslag { naam: string; model: string; ok: boolean; fouten: string[]; beurten: Beurtlog[]; vragen: number; state: JobState; rechter?: { goed: number; totaal: number; opmerkingen: string[] } }

const BEZIG = ["bezig", "wacht_cv", "geen_reactie"];

async function voerUit(g: Gesprek, ai: AiAanroep, model: string): Promise<Uitslag> {
  const nu = new Date();
  const r0 = start(g.ctx, g.taal, nu);
  let state = r0.state;
  const geschiedenis: string[] = r0.berichten.map((b) => `Job: ${b.tekst}`);
  let laatsteJob = r0.berichten[r0.berichten.length - 1]?.tekst || "";
  const beurten: Beurtlog[] = [];
  const gebruikt: Partial<Record<Onderwerp, number>> = {};
  const tussen = [...(g.tussendoor || [])];
  const gevraagd = new Set<Onderwerp>();
  if (state.laatsteOnderwerp) gevraagd.add(state.laatsteOnderwerp);
  let vragen = r0.berichten.filter((b) => b.tekst.includes("?")).length;
  const fouten: string[] = [];

  for (let stap = 0; stap < 24; stap++) {
    const bezig = BEZIG.includes(state.status);
    const o = bezig ? state.laatsteOnderwerp : null;
    let bericht: string | null = null;
    const ti = tussen.findIndex((t) => (bezig ? t.bij === o : t.bij === "na"));
    if (ti >= 0) { bericht = tussen[ti].tekst; tussen.splice(ti, 1); }
    else if (bezig && o) {
      const a = g.antwoorden[o];
      const n = gebruikt[o] || 0;
      bericht = Array.isArray(a) ? a[Math.min(n, a.length - 1)] : a ?? STANDAARD[g.taal][o] ?? null;
      gebruikt[o] = n + 1;
      if ((gebruikt[o] || 0) > 4) { fouten.push(`lus: vraag over ${o} kwam meer dan vier keer`); break; }
    }
    if (!bericht) break;
    const u = await verwerkBeurt({ state, ctx: g.ctx, tekst: bericht, laatsteVraag: laatsteJob, geschiedenis: geschiedenis.slice(-24).join("\n"), nu, ai });
    const teksten = u.r.berichten.map((b) => b.tekst);
    beurten.push({ kandidaat: bericht, job: teksten, onderwerpVoor: o, ms: u.ai?.ms ?? 0, bron: u.bron, soorten: u.beurt?.soorten.join("+") || "-", tokens: u.ai?.tokens });
    geschiedenis.push(`Kandidaat: ${bericht}`);
    for (const t of teksten) { geschiedenis.push(`Job: ${t}`); if (t.includes("?")) vragen++; }
    if (teksten.length) laatsteJob = teksten[teksten.length - 1];
    state = u.r.state;
    if (BEZIG.includes(state.status) && state.laatsteOnderwerp) gevraagd.add(state.laatsteOnderwerp);
    for (const t of teksten) for (const f of berichtControle(t, state.taal)) fouten.push(`bericht "${t.slice(0, 60)}": ${f}`);
    // Twee keer exact hetzelfde bericht van Job achter elkaar is een lus.
    const vorige = beurten[beurten.length - 2];
    if (vorige && teksten.length && vorige.job.join("|") === teksten.join("|")) fouten.push(`zelfde bericht twee keer: "${teksten[0].slice(0, 60)}"`);
    if (!BEZIG.includes(state.status) && !tussen.some((t) => t.bij === "na")) break;
  }

  const v = g.verwacht;
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
  if (v.maxVragen && vragen > v.maxVragen) fouten.push(`${vragen} vragen, hooguit ${v.maxVragen}`);
  if (v.eindstatus && !v.eindstatus.includes(state.status)) fouten.push(`eindstatus ${state.status}, verwacht ${v.eindstatus.join(" of ")}`);
  if (v.taal && state.taal !== v.taal) fouten.push(`gesprekstaal ${state.taal}, verwacht ${v.taal}`);
  for (const rv of v.reactie || []) {
    const b = beurten.filter((x) => rv.na.test(x.kandidaat));
    if (!b.length) { fouten.push(`bericht ${rv.na} niet verstuurd in de test`); continue; }
    for (const x of b) {
      const t = x.job.join(" ");
      if (rv.moet && !rv.moet.test(t)) fouten.push(`na "${x.kandidaat.slice(0, 40)}": antwoord "${t.slice(0, 90)}" mist ${rv.moet}`);
      if (rv.nietMoet && rv.nietMoet.test(t)) fouten.push(`na "${x.kandidaat.slice(0, 40)}": antwoord "${t.slice(0, 90)}" bevat ${rv.nietMoet}`);
    }
  }
  if (beurten.some((b) => b.bron === "terugval")) fouten.push(`AI viel ${beurten.filter((b) => b.bron === "terugval").length} keer uit (terugval gebruikt)`);
  return { naam: g.naam, model, ok: fouten.length === 0, fouten, beurten, vragen, state };
}

/** De rechter: sluit elke reactie van Job aan op de kandidaat en de vraag? */
async function beoordeel(u: Uitslag, rechter: AiAanroep): Promise<Uitslag["rechter"]> {
  const transcript = u.beurten.map((b, i) => `[${i + 1}] Kandidaat: ${b.kandidaat}\n    Job: ${b.job.join(" / ") || "(geen bericht)"}`).join("\n");
  const systeem = `Je beoordeelt een WhatsApp-gesprek tussen Job (AI-recruiter van uitzendbureau EXTRA) en een kandidaat. Beoordeel elke reactie van Job streng op:
1. Sluit het aan op wat de kandidaat net schreef (antwoord, vraag, correctie, frustratie, bedankje)?
2. Is het logisch na de vorige vraag, zonder herhaling van iets wat al beantwoord is?
3. Kort en natuurlijk (hooguit twee zinnen en één vraag), warm en direct, geen standaardlof?
4. Verzint Job geen feiten of beloftes?
Antwoord uitsluitend met JSON: {"beurten": [{"nr": 1, "goed": true, "reden": "kort"}]}`;
  const r = await rechter(systeem, transcript);
  if (!r?.inhoud) return undefined;
  try {
    const j = JSON.parse(r.inhoud.slice(r.inhoud.indexOf("{"), r.inhoud.lastIndexOf("}") + 1));
    const lijst: { nr: number; goed: boolean; reden: string }[] = Array.isArray(j?.beurten) ? j.beurten : [];
    return { goed: lijst.filter((x) => x.goed).length, totaal: lijst.length, opmerkingen: lijst.filter((x) => !x.goed).map((x) => `[${x.nr}] ${x.reden}`) };
  } catch { return undefined; }
}

async function inGroepen<T, U>(lijst: T[], n: number, f: (x: T) => Promise<U>): Promise<U[]> {
  const uit: U[] = new Array(lijst.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < lijst.length) { const k = i++; uit[k] = await f(lijst[k]); } }));
  return uit;
}

async function main() {
  console.log("Gesprekstest gestart. Dit duurt even; per gesprek verschijnt een regel.");
  const modellen = (process.argv[2] || process.env.JOB_TEST_MODELLEN || process.env.JOB_AI_MODEL || "gpt-4o-mini").split(",").map((m) => m.trim()).filter(Boolean);
  const rechterModel = process.env.JOB_TEST_RECHTER === "0" ? null : process.env.JOB_TEST_RECHTER || "gpt-4o";
  const filter = (process.env.JOB_TEST_FILTER || "").toLowerCase();
  const gesprekken = GESPREKKEN.filter((g) => !filter || g.naam.toLowerCase().includes(filter));
  if (!echteAi()) { console.error("Geen AI-koppeling gevonden. Draai dit in de testomgeving op Replit (AI_INTEGRATIONS_OPENAI_* in de Secrets)."); process.exit(1); }
  const rechter = rechterModel ? echteAi(rechterModel, 120_000, true) : null;
  const parallel = Math.max(1, Number(process.env.JOB_TEST_PARALLEL || 1));
  const verslag: string[] = [`Gesprekstest Job 4, ${new Date().toISOString()}`, `Modellen: ${modellen.join(", ")}; rechter: ${rechterModel || "uit"}; gesprekken: ${gesprekken.length}`, ""];
  const samenvatting: string[] = [];

  for (const model of modellen) {
    // Ruime tijdslimiet en stil: bij de snelheidslimiet van de AI wacht de test en probeert opnieuw.
    const ai = echteAi(model, 90_000, true)!;
    let klaar = 0;
    const uitslagen = await inGroepen(gesprekken, parallel, async (g) => {
      const u = await voerUit(g, ai, model);
      if (rechter) u.rechter = await beoordeel(u, rechter);
      klaar++;
      console.log(`  [${model}] ${klaar}/${gesprekken.length} ${u.ok ? "✓" : "✗"} ${u.naam}`);
      return u;
    });
    const ms = uitslagen.flatMap((u) => u.beurten.map((b) => b.ms)).filter((x) => x > 0).sort((a, b) => a - b);
    const gem = ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : 0;
    const p95 = ms.length ? ms[Math.min(ms.length - 1, Math.floor(ms.length * 0.95))] : 0;
    const tin = uitslagen.flatMap((u) => u.beurten.map((b) => b.tokens?.in || 0)).reduce((a, b) => a + b, 0);
    const tuit = uitslagen.flatMap((u) => u.beurten.map((b) => b.tokens?.uit || 0)).reduce((a, b) => a + b, 0);
    const beurtenTotaal = uitslagen.reduce((a, u) => a + u.beurten.length, 0);
    const rg = uitslagen.reduce((a, u) => a + (u.rechter?.goed || 0), 0);
    const rt = uitslagen.reduce((a, u) => a + (u.rechter?.totaal || 0), 0);
    const goed = uitslagen.filter((u) => u.ok).length;
    samenvatting.push(`${model}: ${goed}/${uitslagen.length} gesprekken zonder fout; rechter ${rt ? `${rg}/${rt} beurten goed` : "uit"}; ${beurtenTotaal} beurten, gem. ${gem} ms, p95 ${p95} ms; tokens ${tin} in, ${tuit} uit (${beurtenTotaal ? Math.round((tin + tuit) / beurtenTotaal) : 0} per beurt)`);
    for (const u of uitslagen) {
      const kop = `${u.ok ? "✓" : "✗"} [${model}] ${u.naam}${GESPREKKEN.find((g) => g.naam === u.naam)?.eerdereFout ? " (eerdere fout)" : ""}${u.rechter ? `, rechter ${u.rechter.goed}/${u.rechter.totaal}` : ""}`;
      samenvatting.push(`  ${kop}`);
      for (const f of u.fouten) samenvatting.push(`      - ${f}`);
      for (const o of u.rechter?.opmerkingen || []) samenvatting.push(`      * rechter ${o}`);
      verslag.push(kop, ...u.fouten.map((f) => `   - ${f}`), ...(u.rechter?.opmerkingen || []).map((o) => `   * rechter ${o}`));
      for (const b of u.beurten) verslag.push(`   K: ${b.kandidaat}`, ...b.job.map((t) => `   J: ${t}`), `      (${b.bron} ${b.soorten} ${b.ms} ms, vraag was ${b.onderwerpVoor ?? "-"})`);
      verslag.push(`   Velden: ${JSON.stringify(u.state.velden)}`, `   Status: ${u.state.status}, taal ${u.state.taal}, ${u.vragen} vragen`, "");
    }
  }
  console.log("\n" + samenvatting.join("\n"));
  writeFileSync("job-gesprekstest.txt", [...verslag, "", "Samenvatting", ...samenvatting].join("\n"));
  console.log("\nVolledig verslag: job-gesprekstest.txt");
  process.exit(0);
}

main().catch((e) => { console.error("Mislukt:", e?.message || e); process.exit(1); });
