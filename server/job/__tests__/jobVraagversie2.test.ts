/**
 * Huistests vraagversie 2 via dezelfde weg als echte berichten (verwerkBeurt, Job 5), met een
 * nagebootste AI: het model geeft de JSON die in de test staat. Zo is te zien wat de regels en de
 * controles ermee doen. Fictieve kandidaten. Draaien: npx tsx server/job/__tests__/jobVraagversie2.test.ts
 */
process.env.TESTOMGEVING = "1";
import { verwerkBeurt, type AiAanroep } from "../jobBeurt";
import { plannerRedenen, profielVelden, samenvatting, start, type JobContext, type JobState } from "@shared/jobRegels";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}
const NU = new Date("2026-11-25T10:00:00Z");
const ctx = (functieCode: string, functie: string, extra: Partial<JobContext> = {}): JobContext => ({ voornaam: "Noor", functie, functieCode, nationalityZone: "NL", hasCv: false, stopV3: true, begrijpen: true, vraagversie2: true, ...extra });
const nep = (json: Record<string, unknown>): AiAanroep => async () => ({ inhoud: JSON.stringify(json), ms: 1, model: "nep" });

interface Stand { state: JobState; laatste: string; gesch: string[] }
function begin(c: JobContext): Stand {
  const r = start(c, "nl", NU);
  return { state: r.state, laatste: r.berichten[r.berichten.length - 1].tekst, gesch: r.berichten.map((b) => `Job: ${b.tekst}`) };
}
async function stap(s: Stand, c: JobContext, tekst: string, json: Record<string, unknown>) {
  const u = await verwerkBeurt({ state: s.state, ctx: c, tekst, laatsteVraag: s.laatste, geschiedenis: s.gesch.join("\n"), nu: NU, ai: nep(json) });
  const job = u.r.berichten.map((b) => b.tekst);
  const volgende: Stand = { state: u.r.state, laatste: job[job.length - 1] || s.laatste, gesch: [...s.gesch, `Kandidaat: ${tekst}`, ...job.map((t) => `Job: ${t}`)] };
  return { u, job: job.join(" / "), s: volgende };
}

async function main() {
  const fo = ctx("frontoffice", "frontoffice", { label: "hotels" });

  // ─── Drie functievragen achter elkaar: een volgend punt is geen herhaling ───
  let s = begin(fo);
  let x = await stap(s, fo, "Drie jaar receptie", { soort: ["antwoord"], velden: { ervaring: "drie jaar receptie", ervaringNiveau: "ervaren" }, bewijs: { ervaring: "Drie jaar receptie" }, reactie: "", vraag: "Welke taken pakte je zelf op aan de receptie?", vraagt: "functievraag", vraagtPunt: "taken" });
  test("punt 1: taken", x.s.state.velden.puntGevraagd === "taken" && /taken/.test(x.job), x.job);
  x = await stap(x.s, fo, "Inchecken en reserveringen", { soort: ["antwoord"], velden: { punten: { taken: "inchecken en reserveringen" } }, bewijs: { punten: { taken: "Inchecken en reserveringen" } }, reactie: "Inchecken en reserveringen, dat is de kern.", vraag: "In welke talen help je gasten?", vraagt: "functievraag", vraagtPunt: "taal" });
  test("punt 2: taal (geen poging geteld)", x.s.state.velden.puntGevraagd === "taal" && !x.s.state.velden.pogingen?.functievraag, JSON.stringify(x.s.state.velden.pogingen));
  x = await stap(x.s, fo, "Engels en Nederlands", { soort: ["antwoord"], velden: { punten: { engels: "ja", nederlands: "ja" } }, bewijs: { punten: { engels: "Engels", nederlands: "Nederlands" } }, reactie: "", vraag: "Met welk systeem werkte je?", vraagt: "functievraag", vraagtPunt: "systeem" });
  test("punt 3: systeem, en functievraag niet als onbekend gemarkeerd", x.s.state.velden.puntGevraagd === "systeem" && !(x.s.state.velden.onbekend || []).includes("functievraag"), JSON.stringify(x.s.state.velden.onbekend));
  const bijSysteem = x.s;

  // ─── Antwoord plus eigen vraag in één bericht ───
  x = await stap(bijSysteem, fo, "Wij gebruikten Opera. Wat verdien ik eigenlijk?", { soort: ["antwoord", "vraag"], kennis: "loon", vraagKandidaat: "loon", velden: { punten: { systeem: "Opera" } }, bewijs: { punten: { systeem: "Opera" } }, reactie: "", vraag: "Hoeveel diensten per week wil je werken?", vraagt: "diensten" });
  test("Opera plus loonvraag: systeem is Opera", x.s.state.velden.punten?.systeem === "Opera");
  test("Opera plus loonvraag: het goedgekeurde loonantwoord, dan de volgende vraag", /hangt af van de functie en de opdracht/.test(x.job) && /diensten/.test(x.job), x.job);

  // ─── Alleen de loonvraag ───
  x = await stap(bijSysteem, fo, "Wat verdien ik eigenlijk?", { soort: ["vraag"], kennis: "loon", velden: {}, reactie: "", vraag: "Met welk systeem werkte je?", vraagt: "functievraag", vraagtPunt: "systeem" });
  test("alleen loonvraag: systeem blijft open en de vraag komt terug", !x.s.state.velden.punten?.systeem && x.s.state.velden.puntGevraagd === "systeem" && /hangt af van de functie/.test(x.job) && /systeem/.test(x.job), x.job);
  // Het model ziet de vraag ten onrechte als antwoord en vult niets: dan ook niets opslaan.
  x = await stap(bijSysteem, fo, "Wat verdien ik eigenlijk?", { soort: ["antwoord"], velden: {}, reactie: "", vraag: "Met welk systeem werkte je?", vraagt: "functievraag", vraagtPunt: "systeem" });
  test("model mist de vraag: de loonvraag wordt geen systeem", !x.s.state.velden.punten?.systeem, JSON.stringify(x.s.state.velden.punten));
  // Het model zet de loonvraag zelf als systeem, zonder citaat dat klopt.
  x = await stap(bijSysteem, fo, "Wat verdien ik eigenlijk?", { soort: ["antwoord"], velden: { punten: { systeem: "Opera" } }, bewijs: { punten: { systeem: "Opera" } }, reactie: "", vraag: "", vraagt: "diensten" });
  test("verzonnen citaat: valt weg", !x.s.state.velden.punten?.systeem);

  // ─── De vraag en het veld horen bij elkaar ───
  const bijTaal = (await stap(begin(fo), fo, "Drie jaar, vooral inchecken en reserveringen", { soort: ["antwoord"], velden: { ervaring: "drie jaar receptie", ervaringNiveau: "ervaren", punten: { taken: "inchecken en reserveringen" } }, bewijs: { ervaring: "Drie jaar", punten: { taken: "inchecken en reserveringen" } }, reactie: "", vraag: "", vraagt: "functievraag", vraagtPunt: "taal" })).s;
  x = await stap(bijTaal, fo, "Engels en Nederlands", { soort: ["antwoord"], velden: { punten: { engels: "ja", nederlands: "ja" } }, bewijs: { punten: { engels: "Engels", nederlands: "Nederlands" } }, reactie: "", vraag: "Welke taken deed je aan de balie?", vraagt: "functievraag", vraagtPunt: "taken" });
  test("model vraagt over een ander punt dan de regels: de vaste vraag van het punt dat de regels kozen", x.s.state.velden.puntGevraagd === "systeem" && /Met welk reserveringssysteem werkte je\?/.test(x.job), x.job);
  const su = ctx("supervisor", "horecamedewerker", { label: "events" });
  const sv = begin(su);
  x = await stap(sv, su, "Vijf jaar festivals", { soort: ["antwoord"], velden: { ervaring: "vijf jaar festivals", ervaringNiveau: "ervaren" }, bewijs: { ervaring: "Vijf jaar festivals" }, reactie: "Vijf jaar festivals, dan heb je wat drukte gezien.", vraag: "Heb je op die festivals zelf weleens een team aangestuurd?", vraagt: "functievraag", vraagtPunt: "leiding" });
  test("functiepunt: altijd de vraag uit het profiel met de knoppen; een duidelijk antwoord krijgt geen herhaling", /^Heb je tijdens een evenement zelf een team aangestuurd\?$/.test(x.job) && (x.u.r.berichten[x.u.r.berichten.length - 1].keuzes || []).join("|") === "Ja|Een enkele keer|Nog niet", x.job);
  x = await stap(sv, su, "Vijf jaar festivals", { soort: ["antwoord"], velden: { ervaring: "vijf jaar festivals", ervaringNiveau: "ervaren" }, bewijs: { ervaring: "Vijf jaar festivals" }, reactie: "", vraag: "Wat regelde jij zelf tijdens een druk evenement?", vraagt: "functievraag", vraagtPunt: "regelde" });
  test("model springt naar een ander punt: de vaste vraag met de juiste knoppen", /Heb je tijdens een evenement zelf een team aangestuurd\?/.test(x.job) && (x.u.r.berichten[x.u.r.berichten.length - 1].keuzes || []).length === 3, x.job);

  // ─── "Dat heb ik toch net gezegd?" ───
  const hk = ctx("housekeeping", "housekeeping", { label: "hotels" });
  let h = await stap(begin(hk), hk, "Twee jaar in een hotel", { soort: ["antwoord"], velden: { ervaring: "twee jaar in een hotel", ervaringNiveau: "ervaren" }, bewijs: { ervaring: "Twee jaar in een hotel" }, reactie: "", vraag: "Maakte je daar de kamers schoon, de algemene ruimtes of allebei?", vraagt: "functievraag", vraagtPunt: "soort" });
  // Het model las het antwoord niet goed: het punt bleef leeg, Job vraagt het opnieuw.
  h = await stap(h.s, hk, "Vooral de kamers, soms de lobby", { soort: ["antwoord"], velden: {}, reactie: "", vraag: "Deed je vooral kamers of algemene ruimtes?", vraagt: "functievraag", vraagtPunt: "soort" });
  test("eerste keer niet gelezen: hetzelfde punt nog open", h.s.state.velden.puntGevraagd === "soort" && !h.s.state.velden.punten?.soort);
  h = await stap(h.s, hk, "Dat heb ik toch net gezegd?", { soort: ["antwoord", "frustratie"], velden: { punten: { soort: "allebei" } }, bewijs: { punten: { soort: "Vooral de kamers, soms de lobby" } }, reactie: "Je hebt gelijk, sorry: kamers en soms de lobby.", vraag: "Hoeveel kamers deed je ongeveer per dienst?", vraagt: "functievraag", vraagtPunt: "kamersPerDienst" });
  test("dat heb ik toch net gezegd: punt uit het eerdere bericht, sorry, door naar het volgende punt", h.s.state.velden.punten?.soort === "allebei" && /sorry/i.test(h.job) && /kamers/.test(h.job) && h.s.state.velden.puntGevraagd === "kamersPerDienst", h.job);

  // ─── Correctie: reactie blijft, ook met hetzelfde openingswoord ───
  const ku = ctx("keuken", "chef", { label: "hotels" });
  let k = await stap(begin(ku), ku, "Twee jaar, ik stond op de warme kant", { soort: ["antwoord"], velden: { ervaring: "twee jaar, warme kant", ervaringNiveau: "ervaren", punten: { zelfstandig: "ja" } }, bewijs: { ervaring: "Twee jaar", punten: { zelfstandig: "ik stond op de warme kant" } }, reactie: "Helder.", vraag: "Wat deed je zelf tijdens een drukke dienst?", vraagt: "functievraag", vraagtPunt: "taken" });
  k = await stap(k.s, ku, "Nee, ik hielp in de keuken, mijn collega stond zelfstandig op de warme kant", { soort: ["correctie"], velden: { ervaring: "twee jaar meegeholpen; de collega stond zelfstandig op de warme kant", punten: { zelfstandig: "nee", taken: "meehelpen in de keuken" } }, bewijs: { ervaring: "ik hielp in de keuken", punten: { zelfstandig: "mijn collega stond zelfstandig op de warme kant", taken: "ik hielp in de keuken" } }, reactie: "Helder, dan heb ik dat aangepast.", vraag: "", vraagt: "functievraag", vraagtPunt: "richting" });
  test("correctie: zelfstandig is nee en de ervaring is vervangen", k.s.state.velden.punten?.zelfstandig === "nee" && /collega/.test(k.s.state.velden.ervaring || "") && !/^twee jaar, warme kant$/.test(k.s.state.velden.ervaring || ""), k.s.state.velden.ervaring);
  test("correctie: Job bevestigt de aanpassing uit het dossier, niet met een stopwoord", /^Ik heb je ervaring aangepast\./.test(k.job) && !/^Helder/.test(k.job), k.job);
  test("correctie: daarna de vraag over keukenhulp als richting", /keukenhulp/.test(k.job), k.job);

  // ─── Voorkeur dinerloper bij bediening aangevinkt ───
  const ev = ctx("bediening", "horecamedewerker", { label: "events", meerFuncties: true, functies: [{ code: "bediening", nl: "Bediening", en: "Waiting staff" }, { code: "dinerloper", nl: "Dinerloper", en: "Food runner" }] });
  let e = await stap(begin(ev), ev, "Twee jaar bruiloften", { soort: ["antwoord"], velden: { ervaring: "twee jaar bruiloften", ervaringNiveau: "ervaren" }, bewijs: { ervaring: "Twee jaar bruiloften" }, reactie: "", vraag: "", vraagt: "functievraag", vraagtPunt: "voorkeur" });
  test("meer functies: eerst de voorkeur, met knoppen", /Je koos bediening en dinerloper/.test(e.job), e.job);
  e = await stap(e.s, ev, "Vooral dinerloper eigenlijk", { soort: ["antwoord"], velden: { punten: { voorkeur: "dinerloper" } }, bewijs: { punten: { voorkeur: "dinerloper" } }, reactie: "", vraag: "Heb je op die bruiloften ook zelf met drie borden tegelijk aan tafel uitgeserveerd?", vraagt: "functievraag", vraagtPunt: "drieBorden" });
  test("voorkeur dinerloper: de vraag van dinerloper, in de woorden van het model", e.s.state.velden.punten?.voorkeur === "dinerloper" && /drie borden/.test(e.job), e.job);
  e = await stap(e.s, ev, "Nee, dat deden de vaste obers", { soort: ["antwoord"], velden: { punten: { drieBorden: "nee" } }, bewijs: { punten: { drieBorden: "Nee, dat deden de vaste obers" } }, reactie: "", vraag: "", vraagt: "diensten" });
  test("voorkeur dinerloper: geen drie borden, een collega kijkt", plannerRedenen(e.s.state.velden, ev, e.s.state.twijfels).some((r) => /drie borden/.test(r)));

  // ─── Zonder vraagversie 2 (schakelaar uit): het oude gesprek ───
  const oud = { ...hk, vraagversie2: false };
  const o = await stap(begin(oud), oud, "Twee jaar kamers in het Hilton", { soort: ["antwoord"], velden: { ervaring: "twee jaar kamers in het Hilton", ervaringNiveau: "ervaren", hotels: "Hilton" }, bewijs: { ervaring: "Twee jaar kamers", hotels: "Hilton" }, reactie: "Twee jaar, mooi.", vraag: "Hoeveel sterren had het Hilton?", vraagt: "sterren" });
  test("schakelaar uit: geen vraagversie, oude flow (sterren na hotels)", o.s.state.velden.vraagversie === undefined && o.s.state.laatsteOnderwerp === "sterren" && !/Twee jaar, mooi/.test(o.job) && /sterren/.test(o.job), o.job);

  // ─── Nalooppunten 25 november, tweede ronde ───
  // 1. Herkansing per functiepunt: onduidelijk en duidelijk bij taken, dan hetzelfde bij taal; systeem blijft bereikbaar.
  for (const pad of ["Job 5", "Job 4"]) {
    if (pad === "Job 4") process.env.JOB_GESPREK_AI = "0";
    const vaag = { soort: ["onduidelijk"], velden: {}, reactie: "", vraag: "", vraagt: "functievraag" };
    let p = await stap(begin(fo), fo, "Drie jaar receptie", { soort: ["antwoord"], velden: { ervaring: "drie jaar receptie", ervaringNiveau: "ervaren" }, bewijs: { ervaring: "Drie jaar receptie" }, reactie: "", vraag: "", vraagt: "functievraag" });
    const regels: string[] = [];
    const log = (t: string) => regels.push(`${t} -> ${p.job} [open: ${p.s.state.velden.puntGevraagd ?? "-"}]`);
    p = await stap(p.s, fo, "Van alles eigenlijk", vaag); log("taken vaag");
    const t1 = p.s.state.velden.puntGevraagd === "taken" && /receptie/.test(p.job);
    p = await stap(p.s, fo, "Inchecken en reserveringen", { soort: ["antwoord"], velden: { punten: { taken: "inchecken en reserveringen" } }, bewijs: { punten: { taken: "Inchecken en reserveringen" } }, reactie: "", vraag: "", vraagt: "functievraag" }); log("taken duidelijk");
    const t2 = p.s.state.velden.puntGevraagd === "taal" && /talen/.test(p.job);
    p = await stap(p.s, fo, "Hangt ervan af", vaag); log("taal vaag");
    const t3 = p.s.state.velden.puntGevraagd === "taal" && /talen|taal/.test(p.job);
    p = await stap(p.s, fo, "Engels en Nederlands", { soort: ["antwoord"], velden: { punten: { engels: "ja", nederlands: "ja" } }, bewijs: { punten: { engels: "Engels", nederlands: "Nederlands" } }, reactie: "", vraag: "", vraagt: "functievraag" }); log("taal duidelijk");
    const t4 = p.s.state.velden.puntGevraagd === "systeem" && /reserveringssysteem/.test(p.job) && !(p.s.state.velden.onbekend || []).includes("functievraag");
    test(`${pad}: onduidelijk bij taken krijgt een eigen herkansing`, t1, regels[0]);
    test(`${pad}: daarna door naar taal`, t2, regels[1]);
    test(`${pad}: onduidelijk bij taal krijgt ook een eigen herkansing`, t3, regels[2]);
    test(`${pad}: daarna wordt het systeem nog gevraagd`, t4, regels[3]);
    console.log(regels.map((r) => `     ${pad} | ${r}`).join("\n"));
    delete process.env.JOB_GESPREK_AI;
  }
  // 2. Twee routes naar een fout dossier dicht.
  x = await stap(bijSysteem, fo, "Wat verdien ik?", { soort: ["antwoord"], velden: { punten: { systeem: "Opera" } }, bewijs: {}, reactie: "", vraag: "", vraagt: "functievraag" });
  test("model zet systeem Opera zonder bewijs bij een loonvraag: veld blijft leeg", !x.s.state.velden.punten?.systeem, JSON.stringify(x.s.state.velden.punten));
  x = await stap(bijSysteem, fo, "Wat verdien ik?", { soort: ["antwoord"], velden: { punten: { systeem: "Wat verdien ik" } }, bewijs: { punten: { systeem: "Wat verdien ik" } }, reactie: "", vraag: "", vraagt: "functievraag" });
  test("een letterlijk citaat over loon is geen bewijs voor een systeem", !x.s.state.velden.punten?.systeem, JSON.stringify(x.s.state.velden.punten));
  let z = await verwerkBeurt({ state: bijSysteem.state, ctx: fo, tekst: "Ik ben benieuwd naar het uurloon", laatsteVraag: bijSysteem.laatste, geschiedenis: bijSysteem.gesch.join("\n"), nu: NU, ai: null });
  test("AI valt uit, \"Ik ben benieuwd naar het uurloon\": veld blijft leeg", !z.r.state.velden.punten?.systeem, JSON.stringify(z.r.state.velden.punten));
  z = await verwerkBeurt({ state: bijSysteem.state, ctx: fo, tekst: "Opera", laatsteVraag: bijSysteem.laatste, geschiedenis: bijSysteem.gesch.join("\n"), nu: NU, ai: null });
  test("AI valt uit, \"Opera\": wordt opgeslagen", z.r.state.velden.punten?.systeem === "Opera", JSON.stringify(z.r.state.velden.punten));
  x = await stap(bijSysteem, fo, "Wij gebruikten Opera. Wat verdien ik?", { soort: ["antwoord", "vraag"], kennis: "loon", velden: { punten: { systeem: "Opera" } }, bewijs: { punten: { systeem: "Wij gebruikten Opera" } }, reactie: "", vraag: "", vraagt: "diensten" });
  test("Opera plus loonvraag: exact Opera in het veld en een antwoord op de loonvraag", x.s.state.velden.punten?.systeem === "Opera" && /hangt af van de functie en de opdracht/.test(x.job), `${x.s.state.velden.punten?.systeem} | ${x.job}`);
  x = await stap(bijSysteem, fo, "Opera", { soort: ["antwoord"], velden: { punten: { systeem: "Opera" } }, bewijs: { punten: { systeem: "Opera" } }, reactie: "", vraag: "", vraagt: "functievraag" });
  test("zonder citaat maar de waarde staat er letterlijk: ook goed", x.s.state.velden.punten?.systeem === "Opera");
  // 3. De juiste sleutel met de verkeerde vraagtekst: Job verstuurt de vraag van het punt.
  x = await stap(bijTaal, fo, "Engels en Nederlands", { soort: ["antwoord"], velden: { punten: { engels: "ja", nederlands: "ja" } }, bewijs: { punten: { engels: "Engels", nederlands: "Nederlands" } }, reactie: "", vraag: "In welke talen help je gasten?", vraagt: "functievraag", vraagtPunt: "systeem" });
  test("juiste sleutel, verkeerde vraagtekst: Job vraagt naar het reserveringssysteem", x.s.state.velden.puntGevraagd === "systeem" && /reserveringssysteem/.test(x.job) && !/talen/.test(x.job), x.job);

  // ─── Derde ronde: het citaat moet de waarde onderbouwen, in Job 5 en Job 4 ───
  for (const pad of ["Job 5", "Job 4"]) {
    if (pad === "Job 4") process.env.JOB_GESPREK_AI = "0";
    x = await stap(bijSysteem, fo, "Wij gebruikten Mews", { soort: ["antwoord"], velden: { punten: { systeem: "Opera" } }, bewijs: { punten: { systeem: "Wij gebruikten Mews" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    const pz = [plannerRedenen(x.s.state.velden, fo, x.s.state.twijfels).join(" "), x.s.state.velden.functievraag || "", JSON.stringify(x.s.state.velden.punten)].join(" | ");
    test(`${pad}: model zegt Opera bij "Wij gebruikten Mews" met dat citaat: de planner ziet nooit Opera`, !/Opera/.test(pz) && /Mews/.test(x.s.state.velden.punten?.systeem || ""), pz);
    x = await stap(bijSysteem, fo, "Wij gebruikten Opera", { soort: ["antwoord"], velden: { punten: { systeem: "Opera" } }, bewijs: { punten: { systeem: "Wij gebruikten Opera" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    test(`${pad}: "Wij gebruikten Opera" met dat citaat: exact Opera`, x.s.state.velden.punten?.systeem === "Opera", x.s.state.velden.punten?.systeem);
    delete process.env.JOB_GESPREK_AI;
  }

  // ─── Het model vergist zich bij een punt dat bepaalt of een collega meekijkt (Job 5 en Job 4) ───
  const dl2 = ctx("dinerloper", "horecamedewerker", { label: "events" });
  const ht2 = ctx("heftruck", "logistiek", { label: "logistiek" });
  const plannerTekst = (st: JobState, c: JobContext) => [st.velden.functievraag || "", JSON.stringify(st.velden.punten || {}), ...plannerRedenen(st.velden, c, st.twijfels)].join(" | ");
  for (const pad of ["Job 5", "Job 4"]) {
    if (pad === "Job 4") process.env.JOB_GESPREK_AI = "0";
    // Front office: Nederlands lukt nog niet, het model zegt ja.
    let f = await stap(begin(fo), fo, "Twee jaar receptie, inchecken en reserveringen", { soort: ["antwoord"], velden: { ervaring: "twee jaar receptie, inchecken en reserveringen", ervaringNiveau: "ervaren", punten: { taken: "inchecken en reserveringen" } }, bewijs: { ervaring: "Twee jaar receptie", punten: { taken: "inchecken en reserveringen" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    f = await stap(f.s, fo, "Ik help gasten in het Engels. In het Nederlands lukt dat nog niet.", { soort: ["antwoord"], velden: { punten: { engels: "ja", nederlands: "ja" } }, bewijs: { punten: { engels: "Ik help gasten in het Engels", nederlands: "In het Nederlands lukt dat" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    let pz = plannerTekst(f.s.state, fo);
    test(`${pad}: model zegt Nederlands ja bij "lukt nog niet": Engels ja, Nederlands open met de zin`, f.s.state.velden.punten?.engels === "ja" && !f.s.state.velden.punten?.nederlands && /In het Nederlands lukt dat nog niet\./.test(pz), pz);
    // Dinerloper: de collega serveerde met drie borden, het model zegt ja.
    let d = await stap(begin(dl2), dl2, "Twee zomers op bruiloften", { soort: ["antwoord"], velden: { ervaring: "twee zomers op bruiloften", ervaringNiveau: "ervaren" }, bewijs: { ervaring: "Twee zomers op bruiloften" }, reactie: "", vraag: "", vraagt: "functievraag" });
    d = await stap(d.s, dl2, "Ik bracht de borden tot aan de zaal. Mijn collega serveerde ze met drie tegelijk uit.", { soort: ["antwoord"], velden: { punten: { drieBorden: "ja" } }, bewijs: { punten: { drieBorden: "met drie tegelijk uit" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    pz = plannerTekst(d.s.state, dl2);
    test(`${pad}: model zegt drie borden ja terwijl de collega uitserveerde: open, de zin voor de planner, een collega kijkt mee`, !d.s.state.velden.punten?.drieBorden && /Mijn collega serveerde ze met drie tegelijk uit/.test(pz) && !/drie borden/i.test(d.job), `${pz} | ${d.job}`);
    // Heftruck: reachtruck met verlopen certificaat, het model zegt heftruck en opgegeven.
    const h = await stap(begin(ht2), ht2, "Ik reed op de reachtruck. Mijn certificaat is verlopen.", { soort: ["antwoord"], velden: { ervaring: "reachtruck, certificaat verlopen", ervaringNiveau: "ervaren", punten: { gereden: "heftruck", certReachtruck: "opgegeven" } }, bewijs: { ervaring: "Ik reed op de reachtruck", punten: { gereden: "Ik reed op de reachtruck", certReachtruck: "Mijn certificaat" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    pz = plannerTekst(h.s.state, ht2);
    test(`${pad}: model zegt heftruck en opgegeven bij reachtruck en verlopen: nooit heftruck of opgegeven, beide open met de zin`, h.s.state.velden.punten?.gereden !== "heftruck" && h.s.state.velden.punten?.certReachtruck !== "opgegeven" && /Zelf gereden is open gelaten/.test(pz) && /Mijn certificaat is verlopen/.test(pz), pz);
    delete process.env.JOB_GESPREK_AI;
  }

  // ─── Gewone antwoorden: de nieuwe regels mogen niets ten onrechte openzetten (Job 5 en Job 4) ───
  /** Dossier, samenvatting en kaart zoals de planner ze ziet. */
  const watPlannerZiet = (st: JobState, c: JobContext) => [`Samenvatting: ${samenvatting(st.velden, c)}`, ...Object.entries(profielVelden(st.velden)).map(([k, w]) => `${k}: ${w}`), `Kaart: ${st.velden.functievraag || "-"}`, `Punten: ${JSON.stringify(st.velden.punten || {})}`, ...plannerRedenen(st.velden, c, st.twijfels).map((x) => `Collega: ${x}`)].join("\n");
  const vast: Record<string, Record<string, unknown>> = { diensten: { diensten: "3-4" }, werkgebied: { werkgebied: "tot 25 km" }, werkmoment: { werkmoment: "flexibel" }, startdatum: { startdatum: "direct" }, werkvorm: { werkvorm: "studie" }, cv: { cvParaat: "nee" } };
  async function totHetEind(x0: Awaited<ReturnType<typeof stap>>, c: JobContext) {
    let x = x0;
    for (let i = 0; i < 12 && x.s.state.status === "bezig"; i++) {
      const o = x.s.state.laatsteOnderwerp || "";
      const pt = x.s.state.velden.puntGevraagd;
      const velden = o === "functievraag" && pt === "sterren" ? { punten: { sterren: "4" } } : vast[o] || {};
      const tekst = o === "functievraag" && pt === "sterren" ? "4 sterren" : String(Object.values(velden)[0] ?? "Nee");
      x = await stap(x.s, c, tekst, { soort: ["antwoord"], velden, bewijs: o === "functievraag" ? { punten: { sterren: "4 sterren" } } : {}, reactie: "", vraag: "", vraagt: null });
    }
    return x;
  }
  for (const pad of ["Job 5", "Job 4"]) {
    if (pad === "Job 4") process.env.JOB_GESPREK_AI = "0";
    // Certificaten per truck: "verlopen" bij de reachtruck zet het geldige heftruckcertificaat niet ter discussie.
    const CERTS = "Mijn heftruckcertificaat is geldig. Mijn reachtruckcertificaat is verlopen.";
    let h = await stap(begin(ht2), ht2, "Vier jaar, ik reed op allebei", { soort: ["antwoord"], velden: { ervaring: "vier jaar heftruck en reachtruck", ervaringNiveau: "ervaren", punten: { gereden: "allebei" } }, bewijs: { ervaring: "Vier jaar", punten: { gereden: "ik reed op allebei" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    const naGereden = h;
    h = await stap(naGereden.s, ht2, CERTS, { soort: ["antwoord"], velden: { punten: { certHeftruck: "opgegeven", certReachtruck: "verlopen" } }, bewijs: { punten: { certHeftruck: "Mijn heftruckcertificaat is geldig", certReachtruck: "Mijn reachtruckcertificaat is verlopen" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    let pz = watPlannerZiet(h.s.state, ht2);
    test(`${pad}: geldig heftruck en verlopen reachtruck komen elk bij de juiste truck, geen controleregel`, h.s.state.velden.punten?.certHeftruck === "opgegeven" && h.s.state.velden.punten?.certReachtruck === "verlopen" && !h.s.state.twijfels.length && /Certificaat heftruck: opgegeven/.test(pz) && /Certificaat reachtruck: verlopen/.test(pz), pz);
    h = await stap(naGereden.s, ht2, CERTS, { soort: ["antwoord"], velden: { punten: { certHeftruck: "verlopen", certReachtruck: "opgegeven" } }, bewijs: { punten: { certHeftruck: "Mijn heftruckcertificaat", certReachtruck: "Mijn reachtruckcertificaat" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    pz = watPlannerZiet(h.s.state, ht2);
    test(`${pad}: model verwisselt de trucks: beide open met de eigen zin, nooit het verkeerde feit`, !h.s.state.velden.punten?.certHeftruck && !h.s.state.velden.punten?.certReachtruck && /Mijn heftruckcertificaat is geldig/.test(pz) && /Mijn reachtruckcertificaat is verlopen/.test(pz) && !/Certificaat heftruck: verlopen|Certificaat reachtruck: opgegeven/.test(pz), pz);
    // Correctie van iets wat eerder is opgeslagen: na de beurt en aan het eind.
    let f = await stap(begin(fo), fo, "Twee jaar receptie, inchecken en reserveringen", { soort: ["antwoord"], velden: { ervaring: "twee jaar receptie, inchecken en reserveringen", ervaringNiveau: "ervaren", punten: { taken: "inchecken en reserveringen" } }, bewijs: { ervaring: "Twee jaar receptie", punten: { taken: "inchecken en reserveringen" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    f = await stap(f.s, fo, "Engels en Nederlands", { soort: ["antwoord"], velden: { punten: { engels: "ja", nederlands: "ja" } }, bewijs: { punten: { engels: "Engels", nederlands: "Nederlands" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    const voorCorrectie = f;
    const CORR = "Sorry, ik bedoelde: in het Nederlands lukt het nog niet. We gebruikten Opera.";
    // a. Het model ziet de correctie.
    let fa = await stap(voorCorrectie.s, fo, CORR, { soort: ["antwoord", "correctie"], velden: { punten: { nederlands: "nee", systeem: "Opera" } }, bewijs: { punten: { nederlands: "in het Nederlands lukt het nog niet", systeem: "We gebruikten Opera" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    let pa = watPlannerZiet(fa.s.state, fo);
    test(`${pad}: correctie gezien: Nederlands nee in dossier en kaart, nergens nog ja`, fa.s.state.velden.punten?.nederlands === "nee" && fa.s.state.velden.punten?.systeem === "Opera" && /Nederlands voor gastcontact: nee/.test(pa) && !/Nederlands voor gastcontact: ja/.test(pa), pa);
    fa = await totHetEind(fa, fo);
    pa = watPlannerZiet(fa.s.state, fo);
    test(`${pad}: correctie gezien, aan het eind: nog steeds nee en geen oude ja`, fa.s.state.status !== "bezig" && /Nederlands voor gastcontact: nee/.test(pa) && !/Nederlands voor gastcontact: ja/.test(pa), pa);
    // b. Het model mist de correctie: de oude waarde gaat weer open, met de zin, en staat nergens meer als feit.
    let fb = await stap(voorCorrectie.s, fo, CORR, { soort: ["antwoord"], velden: { punten: { systeem: "Opera" } }, bewijs: { punten: { systeem: "We gebruikten Opera" } }, reactie: "", vraag: "", vraagt: "functievraag" });
    let pb = watPlannerZiet(fb.s.state, fo);
    test(`${pad}: correctie gemist: Nederlands weer open met de zin, geen ja meer in dossier of kaart`, !fb.s.state.velden.punten?.nederlands && fb.s.state.velden.punten?.systeem === "Opera" && /Nederlands voor gastcontact is weer open\. Eerder opgeslagen was "ja"/.test(pb) && !/Nederlands voor gastcontact: ja/.test(pb), pb);
    fb = await totHetEind(fb, fo);
    pb = watPlannerZiet(fb.s.state, fo);
    test(`${pad}: correctie gemist, aan het eind: open punt blijft, geen oude ja, Engels ja blijft staan`, fb.s.state.status !== "bezig" && !/Nederlands voor gastcontact: ja/.test(pb) && /Engels voor gastcontact: ja/.test(pb) && /weer open/.test(pb), pb);
    if (pad === "Job 5") console.log("     Aan het eind ziet de planner (correctie gemist):\n" + pb.split("\n").map((l) => `       ${l}`).join("\n"));
    delete process.env.JOB_GESPREK_AI;
  }

  console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
  process.exit(gefaald > 0 ? 1 : 0);
}
main();
