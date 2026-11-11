/**
 * Huistests: Job herhaalt zich nooit (shared/jobHerhaling.ts).
 * Run met:  npx tsx shared/jobHerhaling.test.ts
 *
 * Naast losse tests een simulatie: duizenden gesprekken voor elke functie, elk paspoort, met en
 * zonder cv, beide versies van Job, met een AI die niets begrijpt, half begrijpt of ontbreekt, en
 * kandidaten die nee zeggen, het niet weten, iets onduidelijks sturen of een vraag terugstellen.
 * In geen enkel gesprek mag Job twee keer achter elkaar hetzelfde sturen, een vraag vaker dan twee
 * keer stellen of blijven hangen.
 */
import { verwerkBeurt, type AiAanroep } from "../server/job/jobBeurt";
import { start, verwerk, plannerRedenen, type JobContext, type JobState, type Lezing, type Onderwerp } from "./jobRegels";
import { ontkenning, weetNiet, herkansing, zonderHerhaling, zelfdeVraag, geenDubbelBericht, normaal } from "./jobHerhaling";
import { teksten, vraag } from "./jobRegels";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}
const NU = new Date("2026-11-11T11:00:00Z");
const nl = teksten("nl");
const ai = (a: object | null): AiAanroep | null => (a === null ? null : async () => ({ inhoud: JSON.stringify(a), ms: 5, model: "nep" }));
const tekst = (r: { berichten: { tekst: string }[] }) => r.berichten.map((b) => b.tekst).join(" | ");

const kok: JobContext = { voornaam: "Max", functie: "chef", label: "hotels", nationalityZone: "NL", hasCv: false, stopV3: true };

async function main() {
  // ─── Wat het antwoord zegt ───
  test("nee: de zinnen uit het gesprek van Max", !!ontkenning("hotels", "Ik heb niet in hotels gewerkt maar gewoon praktijkles op school van de hotelschool")?.geenHotel && !!ontkenning("hotels", "Ik heb niet gewerkt bij hotels")?.geenHotel);
  test("nee: kort", ["Nee", "nee hoor", "Nog niet", "Nooit", "geen", "No", "not yet", "Nergens"].every((t) => !!ontkenning("hotels", t)?.geenHotel));
  test("nee: geen hotelervaring en never worked in a hotel", !!ontkenning("hotels", "Ik heb geen hotelervaring")?.geenHotel && !!ontkenning("hotels", "I never worked in a hotel")?.geenHotel);
  test("geen nee: een hotelnaam", !ontkenning("hotels", "Bij het Hilton en het NH Krasnapolsky"));
  test("geen nee: niet alleen in hotels", !ontkenning("hotels", "Niet alleen in hotels, ook in restaurants"));
  test("geen nee: een hotelschool is geen hotelwerk, maar ook geen ontkenning", !ontkenning("hotels", "Ik heb op de hotelschool gezeten"));
  test("geen nee: weet ik niet", !ontkenning("hotels", "Weet ik niet") && weetNiet("Weet ik niet") && weetNiet("geen idee eigenlijk") && weetNiet("I don't know"));
  test("nee bij sterren: geen hotel, ook sterren vervallen", !!ontkenning("sterren", "Het was geen hotel")?.geenHotel);
  test("nee bij ervaring: geen ervaring", ontkenning("ervaring", "Nee, nog nooit")?.ervaringNiveau === "geen" && ontkenning("ervaring", "Geen ervaring")?.ervaringNiveau === "geen");
  test("geen nee bij ervaring als er een duur in staat", !ontkenning("ervaring", "Geen ervaring in hotels maar wel 3 jaar in restaurants"));
  test("nee bij restaurant, functievraag, specialisatie en cv", !!ontkenning("restaurant", "Het was geen restaurant")?.restaurantSoort && ontkenning("functievraag", "Niks bijzonders")?.functievraag === "-" && ontkenning("specialisatie", "Nee")?.specialisatie === "nee" && ontkenning("cv", "Nee")?.cvParaat === "nee");
  test("nee heeft geen betekenis bij diensten of werkgebied", !ontkenning("diensten", "Nee") && !ontkenning("werkgebied", "geen"));

  // ─── Andere woorden ───
  const onderwerpen: Onderwerp[] = ["ervaring", "hotels", "sterren", "restaurant", "functievraag", "specialisatie", "diensten", "werkgebied", "werkmoment", "startdatum", "werkvorm", "cv"];
  for (const taal of ["nl", "en"] as const) {
    test(`herkansing (${taal}): voor elke vraag anders dan de gewone vraag`, onderwerpen.every((o) => { const h = herkansing(o, taal, kok); return !!h && !zelfdeVraag(h.tekst, vraag(o, taal, kok, {}).tekst) && (h.tekst.match(/\?/g) || []).length === 1; }));
  }
  test("herkansing: werkautorisatie en geldigheid niet anders gesteld (vaste tekst)", !herkansing("werkautorisatie", "nl", kok) && !herkansing("geldigheid", "nl", kok));

  // ─── Het gesprek van Max (11 november, 12:00) ───
  {
    const s: JobState = { ...start(kok, "nl", NU).state, velden: { ervaring: "3 jaar werkervaring", ervaringNiveau: "ervaren" }, laatsteOnderwerp: "hotels" };
    const aiZonderNvt = { soort: ["correctie"], velden: {}, nvt: [], reactie: "Dank voor de verduidelijking!", vraag: "Bij welke hotels heb je gewerkt?", volgende: "hotels" };
    const u = await verwerkBeurt({ state: s, ctx: kok, tekst: "Ik heb niet in hotels gewerkt maar gewoon praktijkles op school van de hotelschool", laatsteVraag: "Dat klinkt goed, je hebt al een mooie ervaring opgebouwd! In welke hotels heb je precies gewerkt?", geschiedenis: "", nu: NU, ai: ai(aiZonderNvt) });
    test("Max: na nee geen hotelvraag meer", u.r.state.laatsteOnderwerp !== "hotels" && u.r.state.velden.geenHotel === true, `${u.r.state.laatsteOnderwerp}: ${tekst(u.r)}`);
    test("Max: ook geen sterrenvraag", u.r.state.laatsteOnderwerp !== "sterren");
    test("Max: Job gaat door naar de volgende vraag", u.r.state.laatsteOnderwerp === "diensten" && tekst(u.r) === nl.diensten, tekst(u.r));
    test("Max: het dossier zegt nog niet in een hotel gewerkt, niet onbekend", u.r.state.velden.hotels === "nog niet in een hotel gewerkt" && !u.r.state.velden.onbekend?.includes("hotels"));
    test("Max: geen 'Dank voor de verduidelijking' meer", !tekst(u.r).includes("verduidelijking"));
  }

  // ─── Twee keer onduidelijk, nooit drie keer ───
  {
    const s: JobState = { ...start(kok, "nl", NU).state, velden: { ervaring: "3 jaar", ervaringNiveau: "ervaren" }, laatsteOnderwerp: "hotels" };
    const nutteloos = { soort: ["onduidelijk"], velden: {}, reactie: "", vraag: "Bij welke hotels heb je gewerkt?", volgende: "hotels" };
    const u1 = await verwerkBeurt({ state: s, ctx: kok, tekst: "blabla", laatsteVraag: nl.hotels, geschiedenis: "", nu: NU, ai: ai(nutteloos) });
    test("onduidelijk 1: dezelfde vraag, andere woorden", u1.r.state.laatsteOnderwerp === "hotels" && tekst(u1.r) === "Ik vraag het even anders. Heb je al eens in een hotel gewerkt, en zo ja, in welk hotel?", tekst(u1.r));
    test("onduidelijk 1: met een knop Nog niet", u1.r.berichten[u1.r.berichten.length - 1].keuzes?.[0] === "Nog niet");
    const u2 = await verwerkBeurt({ state: u1.r.state, ctx: kok, tekst: "hmm", laatsteVraag: tekst(u1.r), geschiedenis: "", nu: NU, ai: ai(nutteloos) });
    test("onduidelijk 2: niet nog eens, onbekend en verder", u2.r.state.laatsteOnderwerp !== "hotels" && u2.r.state.velden.onbekend?.includes("hotels") === true && tekst(u2.r).startsWith("Geen probleem, dat bespreken we bij de kennismaking."), tekst(u2.r));
    const knop = await verwerkBeurt({ state: u1.r.state, ctx: kok, tekst: "Nog niet", laatsteVraag: tekst(u1.r), geschiedenis: "", nu: NU, ai: ai(nutteloos) });
    test("knop Nog niet: hotelvraag beantwoord", knop.r.state.velden.geenHotel === true && knop.r.state.laatsteOnderwerp === "diensten");
  }

  // ─── Werkautorisatie onbekend wordt nooit stil ───
  {
    const ctx: JobContext = { ...kok, nationalityZone: "NON_EU", hasCv: true };
    const s: JobState = { ...start(ctx, "nl", NU).state, velden: { ervaring: "3 jaar", ervaringNiveau: "ervaren", hotels: "NH", sterren: "4" }, laatsteOnderwerp: "werkautorisatie" };
    const u = await verwerkBeurt({ state: s, ctx, tekst: "Ik ben student", laatsteVraag: nl.werkautorisatie, geschiedenis: "", nu: NU, ai: ai({ soort: ["onduidelijk"], velden: {} }) });
    test("werkautorisatie onduidelijk: 'weet ik niet', een collega controleert", u.r.state.velden.werkautorisatie === "onbekend" && plannerRedenen(u.r.state.velden, ctx, []).some((r) => r.includes("Werkautorisatie")), JSON.stringify(u.r.state.velden.werkautorisatie));
    test("werkautorisatie: de vaste vraag niet letterlijk herhaald", !tekst(u.r).includes(nl.werkautorisatie));
  }

  // ─── Een eigen vraag van de kandidaat is geen herhaling ───
  {
    const s: JobState = { ...start(kok, "nl", NU).state, velden: { ervaring: "3 jaar", ervaringNiveau: "ervaren", hotels: "NH", sterren: "4" }, laatsteOnderwerp: "diensten" };
    const u = await verwerkBeurt({ state: s, ctx: kok, tekst: "Wat verdien ik?", laatsteVraag: nl.diensten, geschiedenis: "", nu: NU, ai: ai({ soort: ["vraag"], kennis: "loon", vraag: "", volgende: "diensten" }) });
    test("eigen vraag: antwoord en dan de open vraag", u.r.state.laatsteOnderwerp === "diensten" && tekst(u.r).includes(nl.diensten) && tekst(u.r).startsWith("Wat je verdient"), tekst(u.r));
    let st = u.r.state, vorige = tekst(u.r);
    for (let n = 0; n < 4; n++) {
      const v = await verwerkBeurt({ state: st, ctx: kok, tekst: "En hoe zit het met reiskosten?", laatsteVraag: vorige, geschiedenis: "", nu: NU, ai: ai({ soort: ["vraag"], kennis: n % 2 ? "loon" : "reiskosten", vraag: "", volgende: "diensten" }) });
      st = v.r.state; vorige = tekst(v.r);
    }
    test("eigen vragen: na drie keer gaat Job toch verder", st.laatsteOnderwerp !== "diensten", String(st.laatsteOnderwerp));
  }

  // ─── Na de vragen: nooit twee keer hetzelfde bericht ───
  test("na de vragen: wachtPlanner twee keer wordt afgewisseld", geenDubbelBericht([{ tekst: nl.wachtPlanner }], nl.wachtPlanner, "nl")[0].tekst !== nl.wachtPlanner);
  test("na de vragen: en daarna weer terug", (() => { const b = geenDubbelBericht([{ tekst: nl.wachtPlanner }], nl.wachtPlanner, "nl")[0].tekst; return geenDubbelBericht([{ tekst: nl.wachtPlanner }], b, "nl")[0].tekst === nl.wachtPlanner; })());
  test("na de vragen: een ander bericht blijft", geenDubbelBericht([{ tekst: nl.cvControleWacht }], nl.wachtPlanner, "nl")[0].tekst === nl.cvControleWacht);

  // ─── Simulatie ───
  const contexten: [string, JobContext][] = [
    ["housekeeping", { voornaam: "A", functie: "housekeeping", label: "hotels", nationalityZone: "NL", hasCv: false, stopV3: true }],
    ["front office", { voornaam: "A", functie: "frontoffice", label: "hotels", nationalityZone: "EU", hasCv: false, stopV3: true }],
    ["keuken", { voornaam: "A", functie: "chef", label: "hotels", nationalityZone: "NON_EU", hasCv: false, stopV3: true }],
    ["afwas", { voornaam: "A", functie: "afwas", label: "hotels", nationalityZone: "NL", hasCv: true, stopV3: true }],
    ["F&B", { voornaam: "A", functie: "horecamedewerker", label: "hotels", nationalityZone: "NON_EU", hasCv: true, stopV3: true }],
    ["events", { voornaam: "A", functie: "horecamedewerker", label: "events", nationalityZone: "NL", hasCv: false, stopV3: true, meerFuncties: true }],
    ["logistiek", { voornaam: "A", functie: "logistiek", label: "logistiek", nationalityZone: "EU", hasCv: true, stopV3: true }],
  ];
  const zinnen = ["Nee", "Ik heb niet gewerkt bij hotels", "weet ik niet", "?", "Wat bedoel je", "pff", "asdf", "ok", "Dank je", "Nog niet", "geen idee", "huh", "dat zeg ik liever niet", "ja", "1", "misschien", "Ik weet het echt niet zeker", "nergens"];
  const aiSoorten: (object | null)[] = [
    null,
    { soort: ["onduidelijk"], velden: {}, reactie: "", vraag: "", volgende: "" },
    { soort: ["antwoord"], velden: {}, reactie: "Dank voor de verduidelijking!", vraag: "", volgende: "" },
    { soort: ["correctie"], velden: {}, nvt: [], reactie: "Helder.", vraag: "", volgende: "" },
    { soort: ["verwarring"], velden: {}, reactie: "", vraag: "", volgende: "" },
    { soort: ["frustratie"], velden: {}, reactie: "", vraag: "", volgende: "" },
    { soort: ["bedankje"], velden: {}, reactie: "", vraag: "", volgende: "" },
    { soort: ["vraag"], velden: {}, kennis: "loon", reactie: "", vraag: "", volgende: "" },
  ];
  let zaad = 7;
  const kies = <T,>(x: T[]): T => { zaad = (zaad * 1103515245 + 12345) % 2147483648; return x[zaad % x.length]; };

  let gesprekken = 0, dubbel = 0, vaker = 0, hangt = 0, stilWerkrecht = 0;
  const voorbeelden: string[] = [];
  for (const versie of ["job4", "oud"] as const) {
    for (const [naam, ctx0] of contexten) {
      for (let n = 0; n < 220; n++) {
        const ctx: JobContext = versie === "oud" ? { ...ctx0, begrijpen: true } : ctx0;
        let r = start(ctx, "nl", NU);
        let vorig = r.berichten.map((b) => b.tekst).join(" ");
        const gesteld: Record<string, number> = { [r.state.laatsteOnderwerp || "-"]: 1 };
        let stappen = 0;
        let metKennis = false, kennisReeks = false;
        while (["bezig", "wacht_cv"].includes(r.state.status) && r.state.laatsteOnderwerp && stappen < 40) {
          stappen++;
          const zin = kies(zinnen);
          const voor = r.state;
          const gekozen = kies(aiSoorten);
          metKennis = versie === "job4" && !!(gekozen as any)?.kennis;
          if (versie === "job4") {
            const u = await verwerkBeurt({ state: voor, ctx, tekst: zin, laatsteVraag: vorig, geschiedenis: "", nu: NU, ai: ai(gekozen) });
            r = u.r;
          } else {
            const lezing: Lezing = { velden: {}, taal: null, twijfel: null, ack: "" };
            const na = verwerk(voor, ctx, { tekst: zin }, lezing, NU);
            r = zonderHerhaling(voor, na, ctx, zin, NU, { laatsteVraag: vorig });
          }
          const nu = r.berichten.map((b) => b.tekst).join(" ");
          if (nu && normaal(nu) === normaal(vorig)) { dubbel++; if (voorbeelden.length < 5) voorbeelden.push(`${versie} ${naam}: dubbel "${nu}" na "${zin}"`); }
          if (r.state.laatsteOnderwerp && ["bezig", "wacht_cv"].includes(r.state.status)) {
            const o = r.state.laatsteOnderwerp;
            gesteld[o] = (o === voor.laatsteOnderwerp ? gesteld[o] || 0 : 0) + 1;
            // Een vraag hooguit twee keer achter elkaar; stelt de kandidaat zelf vragen, dan hooguit vier keer.
            kennisReeks = o === voor.laatsteOnderwerp ? kennisReeks || metKennis : metKennis;
            if (gesteld[o] > (kennisReeks ? 4 : 2)) { vaker++; if (voorbeelden.length < 5) voorbeelden.push(`${versie} ${naam}: ${o} ${gesteld[o]} keer, laatste "${nu}" na "${zin}"`); }
          }
          if (nu) vorig = nu;
        }
        gesprekken++;
        if (stappen >= 40) { hangt++; if (voorbeelden.length < 5) voorbeelden.push(`${versie} ${naam}: blijft hangen op ${r.state.laatsteOnderwerp}`); }
        if (ctx.nationalityZone === "NON_EU" && !["bezig"].includes(r.state.status) && !r.state.velden.werkautorisatie) stilWerkrecht++;
      }
    }
  }
  test(`simulatie: ${gesprekken} gesprekken, nooit twee keer hetzelfde bericht`, dubbel === 0, voorbeelden.join(" || "));
  test("simulatie: een vraag nooit vaker dan twee keer achter elkaar", vaker === 0, voorbeelden.join(" || "));
  test("simulatie: geen gesprek blijft hangen", hangt === 0, voorbeelden.join(" || "));
  test("simulatie: werkautorisatie nooit stil onbekend bij een paspoort van buiten de EU", stilWerkrecht === 0, String(stilWerkrecht));

  console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
  process.exit(gefaald > 0 ? 1 : 0);
}
main();
