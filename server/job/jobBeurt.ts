/**
 * Job 4: één beurt per bericht (schakelaar JOB_V4).
 *
 * Waarom: tot nu toe las de AI alleen velden uit, schreef een tweede AI-aanroep de vraag
 * opnieuw, en vulden vaste regels de gaten op (een vraag of klacht werd dan als
 * hotelnaam opgeslagen, verwarring kreeg dezelfde vraag terug, een bedankje de
 * statuszin). Nu begrijpt de AI het hele bericht in één keer, in de context van het
 * gesprek, en bewaken de vaste regels wat er mag:
 *   1. AI: wat is het (antwoord, vraag, correctie, verwarring, frustratie, bedankje...),
 *      welke velden draagt het (met citaat), welke vraag is logisch daarna.
 *   2. Controle (shared/jobBeurt.ts): alleen gedragen velden, feiten alleen uit de
 *      kennisbank (shared/jobKennis.ts), de vraag moet gaan over het veld dat de regels
 *      aanwijzen, hooguit twee zinnen en één vraag.
 *   3. De vaste regels (shared/jobRegels.ts) bepalen de flow, de status en de acties.
 * Geen AI of geen bruikbaar antwoord: gecontroleerde terugval (alleen duidelijke
 * antwoorden opslaan, anders verduidelijken, na drie keer onbekend en verder).
 *
 * verwerkBeurt is los van de database en krijgt de AI-aanroep mee, zodat de
 * gesprekstest (scripts/job-gesprekstest.ts) precies dezelfde weg gebruikt.
 */
import {
  openOnderwerpenOpVolgorde, verwerk, vraag, functieLabel, herkenCommando, isHotelPad, teksten,
  type JobContext, type JobState, type JobTaal, type JobVelden, type Lezing, type Onderwerp, type Resultaat, type Uitgaand,
} from "@shared/jobRegels";
import { reserveLezing } from "@shared/jobLezen";
import { alsLezing, reactieGoed, stelSamen, valideerBeurt, type Beurt, type Samenstelling } from "@shared/jobBeurt";
import { kennisOverzicht } from "@shared/jobKennis";
import { modelVoor } from "@shared/kandidaatMatch";
import { VELD_DOEL } from "./jobAi";

/** In de testomgeving vanzelf aan, uit met JOB_V4=0; elders alleen met JOB_V4=1. */
export function beurtAan(): boolean {
  const w = process.env.JOB_V4;
  return w === "1" || (process.env.TESTOMGEVING === "1" && w !== "0");
}

export interface AiUitkomst { inhoud: string; ms: number; model: string; tokens?: { in: number; uit: number } }
export type AiAanroep = (systeem: string, bericht: string) => Promise<AiUitkomst | null>;

const MAX_POGINGEN = 3;
const BEZIG = ["bezig", "wacht_cv", "geen_reactie", "gestopt"];

const T = {
  nl: {
    nietBegrepen: "Ik begrijp je antwoord niet helemaal.",
    frustratie: "Ik snap het, nog maar een paar korte vragen.",
    onbekendVerder: "Geen probleem, dat bespreken we bij de kennismaking.",
    graagGedaan: "Graag gedaan! 😊",
    begrenzen: "Ik help je graag verder, maar dan wel op een normale toon.",
    stopGedrag: "Ik stop dit gesprek hier en geef het door aan een collega.",
  },
  en: {
    nietBegrepen: "I didn't quite get that.",
    frustratie: "I get it, just a few more quick questions.",
    onbekendVerder: "No problem, we'll go through that at the meeting.",
    graagGedaan: "You're welcome! 😊",
    begrenzen: "Happy to help, but let's keep it respectful.",
    stopGedrag: "I'm stopping this conversation here and passing it on to a colleague.",
  },
};
export const BEURT_TEKSTEN = T;

function bekendLeesbaar(v: JobVelden): string {
  const delen: string[] = [];
  const zet = (k: string, w: unknown) => { if (w !== undefined && w !== null && w !== "") delen.push(`${k}: ${typeof w === "string" ? w : JSON.stringify(w)}`); };
  zet("ervaring", v.ervaring); zet("ervaringsniveau", v.ervaringNiveau); zet("wat deed je precies", v.functievraag);
  zet("hotels", v.hotels); zet("sterren", v.sterren); zet("restaurant", v.restaurantSoort); zet("evenementen ook", v.specialisatie);
  zet("werkautorisatie", v.werkautorisatie); zet("geldig tot", v.geldigTot); zet("diensten per week", v.diensten); zet("werkgebied", v.werkgebied);
  zet("vervoer", v.vervoer); zet("wanneer", v.werkmoment); zet("beginnen", v.startdatum); zet("naast", v.werkvorm); zet("talen", v.talen);
  zet("cv paraat", v.cvParaat);
  return delen.length ? delen.join("; ") : "(nog niets)";
}

/** De velden voor de beurt: zonder "alleen bij de eigen vraag", want correcties en aanvullingen mogen altijd (met citaat). */
const BEURT_VELDEN = `
- ervaring: samenvatting van de werkervaring: wat, hoe lang, waar (tekst, in de taal van de kandidaat). Bij een aanvulling of correctie later in het gesprek: de volledige bijgewerkte samenvatting.
- ervaringNiveau: "geen" (nooit in dit soort werk gewerkt), "starter" (heel weinig) of "ervaren", ten opzichte van de functie.
- functievraag: wat de kandidaat in die functie zelf deed (tekst)
- specialisatieHint: true als de ervaring wijst op evenementen, banqueting, catering of bruiloften
- specialisatie: "ja" of "nee", alleen als antwoord op de vraag of evenementen en banqueting erbij mogen
- werkautorisatie: alleen als antwoord op de vraag over het verblijfsdocument: "vrij" (arbeid vrij toegestaan), "twv" (TWV vereist of niet toegestaan), "onbekend" of "anders"
- geldigTot: tot wanneer het verblijfsdocument geldig is (tekst), alleen als antwoord op die vraag
- diensten: "1-2", "3-4" of "5+" diensten per week
- werkgebied: "tot 25 km", "tot 35 km", "tot 50 km" of een regio (tekst)
- vervoer: fiets, auto, scooter, ov of iets anders (tekst)
- hotels: de hotels waar de kandidaat werkte, zoals genoemd (tekst). Nooit in een hotel gewerkt: laat leeg en zet "hotels" en "sterren" in nvt.
- sterren: "3" (3 sterren of minder), "4" of "5", alleen als de kandidaat het aantal zelf noemt; nooit afleiden uit een hotelnaam
- restaurantSoort: wat voor restaurant (tekst), alleen als antwoord op die vraag
- werkmoment: "doordeweeks", "avond_weekend" of "flexibel"
- startdatum: "direct", "twee_weken" (binnen twee weken) of "later"
- werkvorm: "studie" (naast de studie), "ander_werk" (naast een andere baan) of "hoofdbaan"
- talen: de talen die de kandidaat noemt (tekst)
- nlOfEn: false alleen als duidelijk is dat de kandidaat geen Nederlands en geen Engels spreekt
- cvParaat: "ja" of "nee", alleen als antwoord op de vraag of het cv paraat is`;

/** De instructie voor de AI. Puur, zodat de test hem ook kan bekijken. */
export function beurtPrompt(i: { ctx: JobContext; state: JobState; laatsteVraag: string; geschiedenis: string; modus: "vragen" | "na" }): string {
  const { ctx, state } = i;
  const taal = state.taal === "en" ? "Engels" : "Nederlands";
  const model = modelVoor(ctx.functie, ctx.functie, ctx.label ?? null);
  const open = openOnderwerpenOpVolgorde(state.velden, ctx).filter((o) => !state.velden.onbekend?.includes(o));
  const functie = ctx.meerFuncties ? "werk bij EXTRA (meerdere functies)" : ctx.functieNaam?.nl || functieLabel(ctx.functie, "nl");
  const statusUitleg: Record<string, string> = {
    cv_controle: "Alle vragen zijn gesteld; een collega bekijkt nu het cv. Daarna krijgt de kandidaat een bericht om een moment te kiezen.",
    planner: "Alle vragen zijn gesteld; een collega bekijkt de aanmelding en neemt contact op.",
    plannen: "De kandidaat is uitgenodigd en kan in WhatsApp een moment kiezen voor de kennismaking.",
    gepland: "De kennismaking staat gepland.",
  };
  const kern = `Je bent Job, de AI-recruiter van uitzendbureau EXTRA in Amsterdam, in een WhatsApp-gesprek met ${ctx.voornaam}, die zich aanmeldde voor ${functie}${ctx.label ? ` (via ${ctx.label})` : ""}. Je bent een goede recruiter: je luistert, begrijpt wat iemand bedoelt (ook bij tikfouten of korte antwoorden), reageert passend en verzamelt efficiënt wat nodig is. De gesprekstaal is ${taal}; Job spreekt alleen Nederlands en Engels.

Wat de functie vraagt: ${model.naam} (${model.soort === "vereist" ? "ervaring vereist" : model.soort === "gewenst" ? "ervaring gewenst" : "starters welkom"}); kerntaken: ${model.kerntaken.join(", ")}; verwant: ${model.verwant}.
Uit het formulier: paspoort ${ctx.nationalityZone === "NL" ? "Nederlands" : ctx.nationalityZone === "EU" ? "ander EU-land" : ctx.nationalityZone === "NON_EU" ? "buiten de EU" : "onbekend"}; cv ${ctx.hasCv ? "ontvangen" : "nog niet ontvangen"}.
Al bekend uit het gesprek: ${bekendLeesbaar(state.velden)}

Het gesprek tot nu toe (oudste eerst):
${i.geschiedenis || "(nog niets)"}`;

  const regels = `
Wat je teruggeeft (alleen JSON):
- soort: lijst met wat het bericht is, een of meer van: "antwoord" (beantwoordt een vraag van Job), "correctie" (verbetert iets wat eerder gezegd is), "vraag" (de kandidaat vraagt zelf iets), "hulp" (snapt niet hoe iets werkt), "verwarring" (begrijpt de vraag niet), "frustratie", "bedankje" (bedankt of sluit af), "onduidelijk" (geen bruikbaar antwoord, bijvoorbeeld iets wat niet bij de vraag past), "andere_taal" (niet Nederlands of Engels), "mens" (wil een mens spreken), "grens" (zie onder). Een bericht kan meerdere dingen tegelijk zijn, bijvoorbeeld ["antwoord","vraag"].
- velden: ALLES wat het bericht echt zegt, ook antwoorden op vragen die nog moeten komen (noemt iemand bij de ervaring een hotel, het aantal diensten of hoe ver hij wil reizen, vul dan ook hotels, diensten of werkgebied in). Een kort antwoord ("5", "nh", "maakt niet uit") is een gewoon antwoord op de vraag die Job stelde. Een vraag, klacht of iets wat niet bij de vraag past is NOOIT ervaring, een hotelnaam of ander gegeven. Bij een correctie het verbeterde veld. Velden:${BEURT_VELDEN}
  ervaringNiveau is ten opzichte van de functie: wie zich als kok aanmeldt en alleen afwaservaring heeft, is voor koken "starter". "Nog niet in een hotel gewerkt" zegt niets over ervaring in het algemeen.
- bewijs: per ingevuld veld het letterlijke stukje uit het bericht (overgenomen zoals het er staat, ook met tikfouten).
- kennis: als soort "vraag" bevat: welk onderwerp uit deze lijst de vraag beantwoordt, anders "onbekend". Schrijf het antwoord zelf NIET, Job voegt de goedgekeurde tekst toe. Onderwerpen:
${kennisOverzicht()}
- vraagKandidaat: de vraag van de kandidaat in een paar woorden (voor een collega), anders null.
- grens: alleen bij grensoverschrijdend gedrag van de kandidaat zelf, gericht aan Job, EXTRA of een medewerker, en alleen als je zeker bent: {"regel": "G1" (concrete dreiging met geweld of schade) | "G2" (seksuele intimidatie) | "G3" (discriminatie of haat) | "G4" (gerichte, ernstige belediging), "bewijs": "letterlijk stukje"}. Voorbeelden G4: "Hou je bek met je vragen, idioot", "kankerbedrijf". Geen grens: een losse krachtterm ("kut, ik ben mijn cv kwijt"), frustratie ("DIT DUURT TE LANG"), kritiek ("jullie organisatie is slecht"), een citaat van iemand anders ("mijn baas noemde me een idioot"). Zet bij een grens ook "frustratie" in soort als dat past.
- taal: de taal van dit bericht zelf: "nl", "en", "anders" of null als het te kort of neutraal is (ok, ja, een naam, een plaats, een getal).
- nvt: vragen die door dit bericht niet meer van toepassing zijn, uit: hotels, sterren, restaurant, functievraag, specialisatie (bijvoorbeeld ["hotels","sterren"] als de kandidaat nooit in een hotel werkte).
- twijfel: alleen iets waar een collega naar moet kijken (kort, Nederlands), anders null. Past de ervaring niet bij de functie, zeg dat hier feitelijk.
- reactie: een korte, natuurlijke reactie in het ${taal} op wat de kandidaat zei, hooguit één zin, geen vraag. Verplicht bij frustratie (kort erkennen) en bij een correctie (bevestigen). Anders alleen als die iets concreets toevoegt; meestal leeg. Geen opvulzinnen als "goed om te weten" of "bedankt voor je antwoord". Nooit beginnen met "Top", "Fantastisch", "Super", "Mooi", "Prima", "Dank je" of vergelijkbaar; geen lof, geen beloftes, geen feiten over EXTRA (die komen uit de kennisbank).`;

  if (i.modus === "na") {
    return `${kern}

Stand van zaken: ${statusUitleg[state.status] || "Alle vragen zijn gesteld."} Job stelt nu geen vragen meer.
De kandidaat stuurt nog een bericht. Begrijp wat het is en reageer passend.
${regels}
- vraag: "" en volgende: "klaar".
Antwoord uitsluitend met JSON: {"soort": [], "velden": {}, "bewijs": {}, "kennis": null, "vraagKandidaat": null, "grens": null, "taal": null, "twijfel": null, "reactie": "", "doorvragen": null, "vraag": "", "volgende": "klaar"}`;
  }

  const openTekst = open.length ? open.map((o, n) => `${n + 1}. ${VELD_DOEL[o] || o}`).join("\n") : "(geen, dit is de laatste stap)";
  return `${kern}

Job vroeg zojuist (over ${state.laatsteOnderwerp ?? "onbekend"}): "${i.laatsteVraag}"
Vragen die nog open staan, in deze volgorde:
${openTekst}
${regels}
- doorvragen: als het antwoord op de ervaringsvraag niet laat zien of de ervaring de kerntaken van deze functie betreft (bijvoorbeeld "Ik maak al jaren schoon" bij housekeeping: in hotelkamers, kantoren of bij mensen thuis?), of als een ander antwoord te vaag is voor de beoordeling: het veld, anders null. Eén keer per veld is meestal genoeg. Vraag nooit naar iets wat al bekend is.
- vraag en volgende: de vraag die Job hierna stelt, in het ${taal}, één korte zin die eindigt met een vraagteken, je-vorm, warm en direct, aansluitend op wat de kandidaat zei.
  * Beantwoordt het bericht de open vraag niet (vraag, verwarring, onduidelijk, frustratie): stel dezelfde vraag opnieuw, eenvoudiger of met een korte uitleg of voorbeeld. volgende = ${state.laatsteOnderwerp ?? "het open veld"}.
  * Te vaag (doorvragen): één concrete doorvraag. volgende = dat veld.
  * Anders: de eerstvolgende vraag uit de lijst die na dit bericht nog open is; sla over wat het bericht al beantwoordde. volgende = dat veld, of "klaar" als er niets meer open is.
Antwoord uitsluitend met JSON: {"soort": [], "velden": {}, "bewijs": {}, "kennis": null, "vraagKandidaat": null, "grens": null, "taal": null, "twijfel": null, "reactie": "", "doorvragen": null, "vraag": "", "volgende": ""}`;
}

export interface BeurtUitkomst {
  r: Resultaat;
  beurt: Beurt | null;
  gebruikt: Samenstelling["gebruikt"] | null;
  bron: "ai" | "terugval" | "regels";
  ai: AiUitkomst | null;
}

/** Gecontroleerde terugval zonder AI: alleen duidelijke antwoorden, anders verduidelijken. */
function terugvalLezing(tekst: string, onderwerp: Onderwerp | null): Lezing {
  const r = reserveLezing(tekst, onderwerp);
  const vrij: Onderwerp[] = ["ervaring", "functievraag", "hotels", "restaurant", "geldigheid"];
  const lijktVraag = /\?|^(wat|waar|wanneer|hoe|waarom|wie|kan|mag|moet|what|where|when|how|why|who|can|do|is)\b/i.test(tekst.trim());
  if (onderwerp && vrij.includes(onderwerp)) {
    const woorden = tekst.trim().split(/\s+/).length;
    if (lijktVraag || woorden < 2) return { ...r, velden: {}, geenAntwoord: true, ack: "" };
    return { ...r, ack: "" };
  }
  // Keuzevragen: alleen als de reserve-lezer het veld echt vond.
  const veld: Partial<Record<Onderwerp, keyof JobVelden>> = { diensten: "diensten", werkgebied: "werkgebied", werkmoment: "werkmoment", startdatum: "startdatum", werkvorm: "werkvorm", sterren: "sterren", specialisatie: "specialisatie", werkautorisatie: "werkautorisatie", cv: "cvParaat" };
  const k = onderwerp ? veld[onderwerp] : undefined;
  if (k && r.velden[k] === undefined) return { ...r, velden: {}, geenAntwoord: true, ack: "" };
  return { ...r, ack: "" };
}

const VELD_VAN_ONDERWERP: Partial<Record<Onderwerp, keyof JobVelden>> = {
  ervaring: "ervaring", functievraag: "functievraag", hotels: "hotels", sterren: "sterren", restaurant: "restaurantSoort", specialisatie: "specialisatie",
  werkautorisatie: "werkautorisatie", geldigheid: "geldigTot", diensten: "diensten", werkgebied: "werkgebied", werkmoment: "werkmoment",
  startdatum: "startdatum", werkvorm: "werkvorm", cv: "cvParaat",
};

/** Is het veld van deze vraag na dit antwoord gevuld (of al bekend)? */
function veldGevuld(o: Onderwerp, nieuw: JobVelden, bekend: JobVelden): boolean {
  const v = { ...bekend, ...nieuw };
  const k = VELD_VAN_ONDERWERP[o];
  if (!k) return true;
  // Een vervallen vraag (geen hotelervaring) telt ook als beantwoord.
  if ((o === "sterren" || o === "hotels") && (nieuw.geenHotel || bekend.geenHotel)) return true;
  return v[k] !== undefined && v[k] !== null && v[k] !== "";
}

function standaardVraag(s: JobState, ctx: JobContext): string | null {
  return s.status === "bezig" || s.status === "wacht_cv" ? (s.laatsteOnderwerp ? vraag(s.laatsteOnderwerp, s.taal, ctx, s.velden).tekst : null) : null;
}

/**
 * Eén bericht van de kandidaat verwerken. Geeft het resultaat van de vaste regels terug
 * met de berichten zoals Job ze verstuurt.
 */
export async function verwerkBeurt(i: { state: JobState; ctx: JobContext; tekst: string; laatsteVraag: string; geschiedenis: string; nu: Date; ai: AiAanroep | null }): Promise<BeurtUitkomst> {
  const ctx: JobContext = { ...i.ctx, begrijpen: true };
  const s0 = i.state;
  const tekst = i.tekst;
  // Commando's (MENS, ENGLISH, VERZETTEN...) en het antwoord op een open cv-vraag: de vaste regels.
  if (herkenCommando(tekst, s0.laatsteOnderwerp) || s0.velden.cvVraag) {
    return { r: verwerk(s0, ctx, { tekst }, null, i.nu), beurt: null, gebruikt: null, bron: "regels", ai: null };
  }
  const modus: "vragen" | "na" = BEZIG.includes(s0.status) ? "vragen" : "na";
  const onderwerp = modus === "vragen" ? s0.laatsteOnderwerp : null;

  // 1. De AI
  let ai: AiUitkomst | null = null;
  let beurt: Beurt | null = null;
  if (i.ai) {
    ai = await i.ai(beurtPrompt({ ctx, state: s0, laatsteVraag: i.laatsteVraag, geschiedenis: i.geschiedenis, modus }), tekst).catch(() => null);
    if (ai?.inhoud) {
      try {
        const json = ai.inhoud.slice(ai.inhoud.indexOf("{"), ai.inhoud.lastIndexOf("}") + 1);
        if (json) beurt = valideerBeurt(JSON.parse(json), tekst, onderwerp);
      } catch { beurt = null; }
    }
  }
  const taal: JobTaal = s0.taal;
  const t = T[taal];

  // 2. Na het gesprek (cv-controle, planner, plannen, gepland): begrijpen, geen vaste zin op alles.
  if (modus === "na") {
    const r = verwerk(s0, ctx, { tekst }, null, i.nu);
    if (!beurt) return { r, beurt, gebruikt: null, bron: "terugval", ai };
    if (beurt.soorten.includes("mens")) return { r: verwerk(s0, ctx, { tekst: taal === "en" ? "HUMAN" : "MENS" }, null, i.nu), beurt, gebruikt: null, bron: "ai", ai };
    if (beurt.grens) return grensStop(r.state, beurt, taal, ai);
    if (beurt.kennis) {
      // Weet Job het niet, dan krijgt een collega de vraag door (zonder de status te veranderen).
      const acties = beurt.kennis === "onbekend" ? [...r.acties, { soort: "planner" as const, reden: `Vraag van de kandidaat: ${beurt.vraagKandidaat || tekst.slice(0, 200)}` }] : r.acties;
      const sam = stelSamen({ beurt, regels: [], onderwerp: null, standaard: null, taal });
      return { r: { ...r, acties, berichten: sam.berichten }, beurt, gebruikt: sam.gebruikt, bron: "ai", ai };
    }
    if (beurt.soorten.includes("bedankje") && !beurt.soorten.some((x) => ["vraag", "hulp", "frustratie", "correctie"].includes(x))) {
      // Een tweede bedankje achter elkaar: niets meer sturen.
      const al = i.laatsteVraag.trim() === t.graagGedaan;
      return { r: { ...r, berichten: al ? [] : [{ tekst: t.graagGedaan }] }, beurt, gebruikt: { reactie: false, vraag: false, kennis: null }, bron: "ai", ai };
    }
    const sam = stelSamen({ beurt, regels: r.berichten, onderwerp: null, standaard: null, taal });
    return { r: { ...r, berichten: sam.berichten }, beurt, gebruikt: sam.gebruikt, bron: "ai", ai };
  }

  // 3. Tijdens de vragen
  if (beurt?.soorten.includes("mens") && !beurt.soorten.includes("antwoord")) {
    return { r: verwerk(s0, ctx, { tekst: taal === "en" ? "HUMAN" : "MENS" }, null, i.nu), beurt, gebruikt: null, bron: "ai", ai };
  }
  let state: JobState = { ...s0, velden: { ...s0.velden }, twijfels: [...s0.twijfels] };
  if (beurt?.grens) {
    if (beurt.grens.regel === "G4" && !state.velden.begrensd) {
      // Eerste gerichte belediging: één keer begrenzen, de vraag blijft staan.
      state.velden.begrensd = true;
      const herhaal = onderwerp ? vraag(onderwerp, taal, ctx, state.velden) : null;
      const r: Resultaat = { state: { ...state, laatsteInkomendAt: i.nu.toISOString(), laatsteActiviteitAt: i.nu.toISOString() }, berichten: [{ tekst: t.begrenzen }, ...(herhaal ? [herhaal] : [])], acties: [] };
      return { r, beurt, gebruikt: null, bron: "ai", ai };
    }
    return grensStop(state, beurt, taal, ai);
  }

  let lezing: Lezing = beurt ? alsLezing(beurt) : terugvalLezing(tekst, onderwerp);
  // De AI noemt het een antwoord maar vult het open veld niet: dan de gecontroleerde terugval voor
  // dat veld (een duidelijk antwoord gaat door, anders telt het als onduidelijk). Zo ontstaat geen lus.
  let zonderVeld = false;
  // Alleen als de AI helemaal niets invulde: vulde hij andere velden (een correctie, een antwoord op een
  // latere vraag), dan blijven die staan en komt de open vraag gewoon terug.
  if (beurt && onderwerp && !lezing.geenAntwoord && !beurt.doorvragen && Object.keys(lezing.velden).length === 0 && !veldGevuld(onderwerp, lezing.velden, state.velden)) {
    const vrij: Onderwerp[] = ["ervaring", "functievraag", "hotels", "restaurant", "geldigheid"];
    // Vrije tekst die de AI niet als gegeven herkende, wordt nooit ruw opgeslagen ("Look for job" als hotel).
    const t2 = vrij.includes(onderwerp) ? { ...lezing, velden: {}, geenAntwoord: true } : terugvalLezing(tekst, onderwerp);
    if (t2.geenAntwoord) { lezing = { ...lezing, geenAntwoord: true }; zonderVeld = true; }
    else {
      // Alleen het veld van deze vraag uit de terugval, niets anders (de reserve-lezer is grof).
      const k = VELD_VAN_ONDERWERP[onderwerp];
      const extra: JobVelden = {};
      if (k && (t2.velden as any)[k] !== undefined) (extra as any)[k] = (t2.velden as any)[k];
      if (onderwerp === "ervaring" && t2.velden.ervaringNiveau) extra.ervaringNiveau = t2.velden.ervaringNiveau;
      lezing = { ...lezing, velden: { ...extra, ...lezing.velden } };
    }
  }
  // Doorvragen: één concrete vraag voor een te vaag antwoord (de regels bewaken het maximum).
  if (beurt?.doorvragen && beurt.vraag.trim().endsWith("?") && (beurt.vraag.match(/\?/g) || []).length === 1) {
    lezing = { ...lezing, doorvraag: { tekst: beurt.vraag.trim(), voor: beurt.doorvragen } };
  }
  // Een vraag die Job niet kan beantwoorden: een collega krijgt hem mee (Job zei dat hij hem doorgeeft).
  if (beurt?.kennis === "onbekend") {
    const notitie = `Vraag van de kandidaat: ${beurt.vraagKandidaat || tekst.slice(0, 200)}`;
    if (!state.twijfels.includes(notitie)) state.twijfels.push(notitie);
  }
  // Blijft het antwoord onduidelijk: na drie keer staat de vraag als onbekend en gaat Job verder.
  let naarOnbekend = false;
  const onduidelijk = lezing.geenAntwoord && (zonderVeld || !beurt || beurt.soorten.some((x) => x === "onduidelijk" || x === "verwarring")) && !beurt?.kennis;
  if (onduidelijk && onderwerp) {
    const p = { ...(state.velden.pogingen || {}) };
    p[onderwerp] = (p[onderwerp] || 0) + 1;
    state.velden.pogingen = p;
    if (p[onderwerp]! >= MAX_POGINGEN) {
      // Het veld blijft leeg ("Niet bekend" in het dossier); de kennismaking vult het aan.
      // geenAntwoord blijft staan: niets opslaan; de regels slaan de onbekende vraag over.
      state.velden.onbekend = [...(state.velden.onbekend || []), onderwerp];
      lezing = { ...lezing, velden: {} };
      naarOnbekend = true;
    }
  }

  const r = verwerk(state, ctx, { tekst }, lezing, i.nu);
  const std = standaardVraag(r.state, ctx);
  // Frustratie wordt altijd kort erkend; komt de reactie van de AI niet door de controle, dan een vaste korte zin.
  if (beurt && beurt.soorten.includes("frustratie") && !beurt.kennis && !reactieGoed(beurt.reactie, r.state.taal)) beurt = { ...beurt, reactie: T[r.state.taal].frustratie };
  const sam = stelSamen({ beurt, regels: r.berichten, onderwerp: r.state.status === "bezig" || r.state.status === "wacht_cv" ? r.state.laatsteOnderwerp : null, standaard: std, taal: r.state.taal });
  let berichten = sam.berichten;
  // Terugval zonder AI bij een onduidelijk antwoord: zeg dat Job het niet begreep.
  if (naarOnbekend && berichten.length) berichten = [{ ...berichten[0], tekst: `${T[r.state.taal].onbekendVerder} ${berichten[0].tekst}` }, ...berichten.slice(1)];
  else if (!beurt && lezing.geenAntwoord && berichten.length) berichten = [{ ...berichten[0], tekst: `${T[r.state.taal].nietBegrepen} ${berichten[0].tekst}` }, ...berichten.slice(1)];
  return { r: { ...r, berichten }, beurt, gebruikt: sam.gebruikt, bron: beurt ? "ai" : "terugval", ai };
}

function grensStop(state: JobState, beurt: Beurt, taal: JobTaal, ai: AiUitkomst | null): BeurtUitkomst {
  const reden = `Gedrag ${beurt.grens!.regel}: "${beurt.grens!.bewijs}". Job heeft het gesprek gepauzeerd; een collega beslist.`;
  const s: JobState = { ...state, status: "planner", twijfels: state.twijfels.includes(reden) ? state.twijfels : [...state.twijfels, reden] };
  return { r: { state: s, berichten: [{ tekst: T[taal].stopGedrag }], acties: [{ soort: "planner", reden }] }, beurt, gebruikt: null, bron: "ai", ai };
}

/**
 * De echte AI-koppeling (dezelfde als de rest van Job), met een tijdslimiet. Bij een
 * snelheidslimiet (429) of een tijdelijke fout wacht hij kort en probeert het opnieuw,
 * binnen de tijdslimiet. Lukt het niet, dan null (Job valt gecontroleerd terug).
 */
export function echteAi(model = process.env.JOB_AI_MODEL || "gpt-4o-mini", limietMs = 15_000, stil = false): AiAanroep | null {
  if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) return null;
  return async (systeem, bericht) => {
    const start = Date.now();
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL, apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "unused" });
    const nieuw = /^(gpt-5|o\d)/.test(model);
    const args: any = {
      model,
      messages: [{ role: "system", content: systeem }, { role: "user", content: bericht.slice(0, 2000) }],
      response_format: { type: "json_object" },
      ...(nieuw ? { max_completion_tokens: 2000 } : { temperature: 0.2, max_tokens: 700 }),
    };
    let laatsteFout = "";
    for (let poging = 0; poging < 6; poging++) {
      const over = limietMs - (Date.now() - start);
      if (over < 1500) break;
      const stop = new AbortController();
      const wekker = setTimeout(() => stop.abort(), over);
      try {
        const c: any = await client.chat.completions.create(args, { signal: stop.signal, maxRetries: 0 } as any);
        return { inhoud: c?.choices?.[0]?.message?.content || "", ms: Date.now() - start, model, tokens: c?.usage ? { in: c.usage.prompt_tokens, uit: c.usage.completion_tokens } : undefined };
      } catch (e: any) {
        laatsteFout = e?.message || String(e);
        const status = e?.status ?? e?.response?.status;
        if (stop.signal.aborted || !(status === 429 || status >= 500)) break;
        // Wachten zoals de server vraagt (retry-after), anders oplopend: 1, 2, 4 seconden...
        const h = e?.headers;
        const ra = Number(typeof h?.get === "function" ? h.get("retry-after") : h?.["retry-after"]);
        const wacht = Math.min(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 1000 * 2 ** poging, Math.max(0, limietMs - (Date.now() - start) - 1500));
        if (wacht <= 0) break;
        await new Promise((r) => setTimeout(r, wacht));
      } finally { clearTimeout(wekker); }
    }
    if (!stil) console.warn(`[Job] AI-beurt mislukt (${model}):`, laatsteFout);
    return null;
  };
}

export { isHotelPad, teksten };
export type { Uitgaand };
