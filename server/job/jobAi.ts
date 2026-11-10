/**
 * Job: het antwoord van de kandidaat uitlezen met de AI.
 *
 * Eén AI-aanroep per antwoord. De AI vult alleen velden in en geeft een korte
 * bevestiging; welke vraag Job daarna stelt, bepalen de vaste regels in
 * shared/jobRegels.ts. Wat de AI teruggeeft, gaat altijd door
 * valideerLezing (shared/jobLezen.ts): onbekende velden of waarden vallen weg.
 *
 * Geen AI-sleutel, een storing of een onbruikbaar antwoord? Dan leest de
 * reserve-lezer het antwoord met eenvoudige regels. Het gesprek loopt altijd door.
 *
 * Dezelfde sleutel en hetzelfde model als de bestaande WhatsApp-AI
 * (AI_INTEGRATIONS_OPENAI_*, gpt-4o-mini).
 */
import type { JobContext, JobTaal, JobVelden, Lezing, Onderwerp } from "@shared/jobRegels";
import { functieLabel, isHotelPad } from "@shared/jobRegels";
import { bewijsCheck, herformuleringGoed, reserveLezing, valideerLezing } from "@shared/jobLezen";
import { modelVoor } from "@shared/kandidaatMatch";

export function aiBeschikbaar(): boolean {
  return !!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
}

const UITLEG_VELDEN = `
- ervaring: korte samenvatting van de werkervaring (tekst, in de taal van de kandidaat), ALLEEN als de laatste vraag over ervaring ging
- ervaringNiveau: ALLEEN als de laatste vraag over ervaring ging: "geen" (nooit in dit soort werk gewerkt), "starter" (heel weinig) of "ervaren". "Nog niet in een hotel gewerkt" betekent niet dat iemand geen ervaring heeft.
- functievraag: het antwoord op de functiegerichte vervolgvraag (tekst)
- specialisatieHint: true als de ervaring wijst op evenementen, banqueting, catering of bruiloften
- specialisatie: "ja" of "nee", alleen als de kandidaat antwoordt op de vraag of evenementen en banqueting erbij mogen
- werkautorisatie: ALLEEN als de laatste vraag over het verblijfsdocument ging, anders altijd weglaten: "vrij" (arbeid vrij toegestaan, TWV niet vereist), "twv" (TWV vereist of niet toegestaan), "onbekend" (weet het niet) of "anders"
- geldigTot: tot wanneer het verblijfsdocument geldig is (tekst), ALLEEN als de laatste vraag over het verblijfsdocument of de geldigheid ging
- diensten: "1-2", "3-4" of "5+" diensten per week
- werkgebied: "tot 25 km", "tot 35 km", "tot 50 km" of een regio (tekst)
- vervoer: fiets, auto, scooter, ov of iets anders (tekst)
- hotels: de hotels waar de kandidaat werkte, zoals genoemd (tekst)
- sterren: "3" (3 sterren of minder), "4" of "5": alleen als de kandidaat zelf het aantal sterren van het beste hotel noemt; nooit zelf afleiden uit een hotelnaam
- werkmoment: "doordeweeks", "avond_weekend" of "flexibel" (wanneer nodig), wanneer de kandidaat kan werken
- startdatum: "direct", "twee_weken" (binnen twee weken) of "later", wanneer de kandidaat kan beginnen
- werkvorm: "studie" (naast de studie), "ander_werk" (naast een andere baan) of "hoofdbaan"
- talen: de talen die de kandidaat noemt, met niveau als dat genoemd wordt (tekst)
- nlOfEn: false ALLEEN als duidelijk is dat de kandidaat geen Nederlands én geen Engels spreekt; true als Nederlands of Engels genoemd wordt; anders weglaten
- cvParaat: "ja" of "nee", alleen bij de vraag of het cv paraat is
- zoekt: wat de kandidaat zoekt, bijvoorbeeld bijbaan naast studie of fulltime (tekst)`;

function prompt(onderwerp: Onderwerp | null, ctx: JobContext, bekend: JobVelden, taal: JobTaal): string {
  return `Je leest één antwoord van een kandidaat in een WhatsApp-gesprek met Job, de AI-recruiter van uitzendbureau EXTRA in Amsterdam.
De kandidaat heet ${ctx.voornaam} en meldde zich aan voor ${functieLabel(ctx.functie, "nl")}.
De laatste vraag van Job ging over: ${onderwerp ?? "onbekend"}.
Wat al bekend is: ${JSON.stringify(bekend)}

Haal uit het antwoord alle velden die erin staan, ook velden waar niet naar gevraagd werd (één rijk antwoord kan meerdere velden vullen). Verzin niets: wat niet in het antwoord staat, laat je weg.
Velden:${UITLEG_VELDEN}

Geef ook:
- taal: "nl" als de kandidaat Nederlands schrijft, "en" bij Engels, "anders" bij een andere taal
- twijfel: alleen als het antwoord iets bevat waar een collega naar moet kijken (bijvoorbeeld een vergunning die verlopen is, of iets wat niet klopt). Kort, in het Nederlands. Anders null.
- ack: een korte reactie in het ${taal === "en" ? "Engels" : "Nederlands"} (hooguit 8 woorden) die laat merken dat je het antwoord echt gelezen hebt, door iets concreets uit het antwoord te noemen, bijvoorbeeld "Twee jaar achter de bar, dat is mooi." of "Festivals, gezellig druk werk.". Geen vraag, geen beloftes, geen standaardzinnen zoals "Mooi, dank je!" of "Top, bedankt!". Bij een kort of keuze-antwoord (zoals "1 tot 2", "Ja", "Tot 35 km", "Direct" of een lijstje talen) laat je ack leeg. Herhaal nooit iets wat al eerder gezegd is. Laat ack ook leeg als er niets bijzonders in het antwoord staat.
${isHotelPad(ctx)
  ? `- vervolgvraag: alleen als de laatste vraag over ervaring ging en uit het antwoord NIET duidelijk is dat de kandidaat ervaring heeft als ${functieLabel(ctx.functie, "nl")} (bijvoorbeeld alleen "AD", "public areas", "linnenkamer" of ander werk bij housekeeping): één korte, vriendelijke vraag in het ${taal === "en" ? "Engels" : "Nederlands"} of de kandidaat ook als ${functieLabel(ctx.functie, "nl")} werkte, bijvoorbeeld "Heb je ook op de kamers gewerkt?". Vraag niet naar hotels of sterren, die vraagt Job zelf. Past het antwoord wel bij de functie, laat dan weg. Eindigt met een vraagteken.`
  : `- vervolgvraag: alleen als de laatste vraag over ervaring ging en de kandidaat werkervaring noemt: één korte vervolgvraag in het ${taal === "en" ? "Engels" : "Nederlands"} over wat de kandidaat daar precies deed, passend bij die plek en bij de functie ${functieLabel(ctx.functie, "nl")}. Vraag niet naar iets wat daar niet voorkomt (bij festivals bijvoorbeeld niet naar diners of tafelbediening, wel naar bar, drankuitgifte of kassa). Noemt de kandidaat al een duidelijke functie die voor zich spreekt (zoals barman, barvrouw of bartender), laat dan weg. Eindigt met een vraagteken. Anders weglaten.`}

Antwoord uitsluitend met JSON: {"velden": {...}, "taal": "...", "twijfel": null, "ack": "", "vervolgvraag": null}`;
}

/** Wat de interviewer van elk invulveld wil weten (fase 2). */
const VELD_DOEL: Partial<Record<Onderwerp, string>> = {
  ervaring: "ervaring: wat de kandidaat precies deed, hoe lang en waar, en of dat past bij de functie",
  functievraag: "functievraag: wat de kandidaat in die functie zelf deed (de kerntaken)",
  hotels: "hotels: in welke hotels de kandidaat werkte (alleen hotelfuncties)",
  sterren: "sterren: hoeveel sterren het beste hotel had (alleen als de kandidaat in een hotel werkte)",
  restaurant: "restaurant: wat voor restaurant het was (fine dining, à la carte, lunch of café)",
  specialisatie: "specialisatie: of evenementen en banqueting erbij mogen",
  werkautorisatie: "werkautorisatie: wat er op het verblijfsdocument staat over werken",
  geldigheid: "geldigheid: tot wanneer het verblijfsdocument geldig is",
  diensten: "diensten: hoeveel diensten per week (1 tot 2, 3 tot 4, 5 of meer)",
  werkgebied: "werkgebied: hoe ver de kandidaat wil reizen of in welke regio",
  werkmoment: "werkmoment: wanneer de kandidaat kan werken (doordeweeks, avond en weekend, flexibel)",
  startdatum: "startdatum: wanneer de kandidaat kan beginnen",
  werkvorm: "werkvorm: naast de studie, naast ander werk of als hoofdbaan",
  cv: "cv: of de kandidaat een cv paraat heeft",
};

/**
 * Fase 2, begrijpen: de AI leest het antwoord in de context van het hele gesprek, vult alleen
 * velden die het antwoord echt draagt (met citaat) en mag één logische vervolgvraag voorstellen.
 * Welke velden nodig zijn en in welke volgorde, blijft bij de vaste regels.
 */
export function begrijpPrompt(onderwerp: Onderwerp | null, ctx: JobContext, bekend: JobVelden, taal: JobTaal, laatsteVraag: string, geschiedenis: string): string {
  const model = modelVoor(ctx.functie, ctx.functie, ctx.label ?? null);
  const open = (Object.keys(VELD_DOEL) as Onderwerp[]).map((o) => `- ${VELD_DOEL[o]}`).join("\n");
  return `Je bent Job, de AI-recruiter van uitzendbureau EXTRA in Amsterdam. Je voert een kort WhatsApp-gesprek met ${ctx.voornaam}, die zich aanmeldde voor ${ctx.functieNaam?.nl || functieLabel(ctx.functie, "nl")}${ctx.label ? ` (label ${ctx.label})` : ""}.
Het doel: een interviewer moet straks betrouwbare antwoorden hebben op de invulvelden. Het gesprek moet logisch en menselijk zijn: je reageert op wat de kandidaat echt zegt.

Wat de functie vraagt (${model.naam}, ${model.soort === "vereist" ? "ervaring vereist" : model.soort === "gewenst" ? "ervaring gewenst" : "starters welkom"}): kerntaken ${model.kerntaken.join(", ")}; telt als verwant: ${model.verwant}${model.soort === "vereist" ? `; eis: ${model.eisTekst}` : ""}.

Invulvelden en wat de interviewer wil weten:
${open}

Wat al bekend is: ${JSON.stringify(bekend)}
Het gesprek tot nu toe (oudste eerst):
${geschiedenis || "(nog niets)"}

De laatste vraag van Job (over: ${onderwerp ?? "onbekend"}) was: "${laatsteVraag}"
Hieronder volgt het antwoord van de kandidaat.

Geef terug:
- velden: alleen wat het antwoord echt zegt. Velden:${UITLEG_VELDEN}
  Bij ervaring: geef een volledige samenvatting, inclusief wat al bekend was. ervaringNiveau is ten opzichte van de functie waarvoor de kandidaat zich aanmeldde: wie zich als kok aanmeldt en alleen afwaservaring heeft, is voor koken een "starter", niet "ervaren".
- bewijs: per ingevuld veld het letterlijke stukje uit het antwoord waar het op staat.
- doorvraag: alleen als het antwoord de vraag niet duidelijk beantwoordt, of als de ervaring niet duidelijk past bij de functie (bijvoorbeeld kok met alleen afwaservaring, of "in de bediening" zonder te zeggen wat): één korte, vriendelijke vraag die logisch aansluit op wat de kandidaat net zei, om het invulveld wel goed te krijgen. {"tekst": "...?", "voor": "<invulveld>"}. Voorbeelden: na "afwasser en busboy" bij een aanmelding voor de keuken: "Heb je naast het afwassen ook meegeholpen met koken of voorbereiden?"; na "ergens in de buurt": "Hoe ver wil je ongeveer reizen vanaf je huis?". Is het antwoord duidelijk genoeg, dan null. Herhaal nooit een vraag die al gesteld is en vraag nooit iets wat al bekend is.
- nvt: vragen die door dit antwoord niet meer van toepassing zijn, uit: hotels, sterren, restaurant, functievraag, specialisatie. Werkte de kandidaat nooit in een hotel (bijvoorbeeld alleen in snackbars of restaurants), dan ["sterren"]. Vraag nooit naar hotelsterren bij iemand zonder hotelervaring.
- taal: "nl", "en" of "anders"
- twijfel: alleen iets waar een collega naar moet kijken (kort, Nederlands), anders null. Past de ervaring niet bij de functie, zeg dat hier feitelijk (bijvoorbeeld "Aangemeld voor de keuken, ervaring alleen als afwasser en busboy").
- ack: een korte, natuurlijke reactie in het ${taal === "en" ? "Engels" : "Nederlands"} (hooguit 8 woorden) die laat merken dat je het antwoord echt gelezen hebt. Geen vraag, geen overdreven lof ("indrukwekkend"), geen standaardzin. Bij een kort of keuze-antwoord leeg. Leeg als er een doorvraag is die zelf al reageert.

Verzin niets. Antwoord uitsluitend met JSON: {"velden": {...}, "bewijs": {...}, "taal": "...", "twijfel": null, "ack": "", "doorvraag": null, "nvt": []}`;
}

/** Standaardvragen herformuleren aan? In de testomgeving vanzelf, uit met JOB_V3_FORMULEREN=0; elders alleen met 1. */
export function formulerenAan(): boolean {
  const w = process.env.JOB_V3_FORMULEREN;
  return w === "1" || (process.env.TESTOMGEVING === "1" && w !== "0");
}

/**
 * Herformuleert een standaardvraag zodat hij aansluit op wat de kandidaat net zei. Zelfde invulveld,
 * zelfde knoppen. Lukt het niet binnen 6 seconden of klopt de uitkomst niet, dan null (de standaardvraag blijft).
 */
export async function formuleerVraag(standaard: string, onderwerp: Onderwerp, keuzes: string[] | undefined, ctx: JobContext, taal: JobTaal,
  gesprek: { geschiedenis: string }, antwoord: string, reactie: string): Promise<string | null> {
  if (!aiBeschikbaar()) return null;
  const stop = new AbortController();
  const wekker = setTimeout(() => stop.abort(), 6000);
  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL, apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "unused" });
    const systeem = `Je bent Job, de AI-recruiter van uitzendbureau EXTRA in Amsterdam, in een WhatsApp-gesprek met ${ctx.voornaam} (aanmelding: ${ctx.functieNaam?.nl || functieLabel(ctx.functie, "nl")}).
Herformuleer de volgende vraag zodat hij natuurlijk aansluit op het laatste antwoord van de kandidaat.
- Vraag precies naar hetzelfde als de oorspronkelijke vraag (${VELD_DOEL[onderwerp] || onderwerp}), niet naar iets anders.
- Eén vraag, hooguit 25 woorden, eindigt met een vraagteken, in het ${taal === "en" ? "Engels" : "Nederlands"}, je-vorm, vriendelijk en gewoon.
- Herhaal de reactie niet${reactie ? ` (Job zegt al: "${reactie}")` : ""} en vraag niets wat al bekend is. Geen beloftes, geen links, geen emoji.
${keuzes?.length ? `- De kandidaat krijgt daaronder deze knoppen: ${keuzes.join(", ")}. De vraag moet daarbij passen.` : ""}
Het gesprek tot nu toe:
${gesprek.geschiedenis || "(nog niets)"}
Kandidaat: ${antwoord.slice(0, 300)}

Oorspronkelijke vraag: "${standaard}"
Antwoord uitsluitend met JSON: {"vraag": "..."}`;
    const r: any = await client.chat.completions.create({
      model: process.env.JOB_AI_MODEL || "gpt-4o-mini", temperature: 0.3, max_tokens: 120, response_format: { type: "json_object" },
      messages: [{ role: "system", content: systeem }],
    } as any, { signal: stop.signal, maxRetries: 0 } as any);
    const inhoud: string = r?.choices?.[0]?.message?.content || "";
    const json = inhoud.slice(inhoud.indexOf("{"), inhoud.lastIndexOf("}") + 1);
    const vraag = json ? String(JSON.parse(json)?.vraag || "").trim() : "";
    return herformuleringGoed(onderwerp, vraag) ? vraag : null;
  } catch (e: any) {
    console.warn("[Job] herformuleren niet gelukt, standaardvraag gebruikt:", e?.message || e);
    return null;
  } finally { clearTimeout(wekker); }
}

/** Fase 2 aan? In de testomgeving vanzelf, uit met JOB_V3_BEGRIJPEN=0; elders alleen met 1. */
export function begrijpenAan(): boolean {
  const w = process.env.JOB_V3_BEGRIJPEN;
  return w === "1" || (process.env.TESTOMGEVING === "1" && w !== "0");
}

/** Hoe lang Job hooguit op de AI wacht (Job 3.0, fase 1). */
export const AI_TIJDSLIMIET_MS = 12_000;

export async function leesMetAi(tekst: string, onderwerp: Onderwerp | null, ctx: JobContext, bekend: JobVelden, taal: JobTaal, gesprek?: { laatsteVraag: string; geschiedenis: string }): Promise<Lezing | null> {
  if (!aiBeschikbaar()) return null;
  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "unused",
    });
    const args: any = {
      model: process.env.JOB_AI_MODEL || "gpt-4o-mini",
      temperature: 0,
      max_tokens: gesprek ? 700 : 500,
      messages: [
        { role: "system", content: gesprek ? begrijpPrompt(onderwerp, ctx, bekend, taal, gesprek.laatsteVraag, gesprek.geschiedenis) : prompt(onderwerp, ctx, bekend, taal) },
        { role: "user", content: tekst.slice(0, 2000) },
      ],
    };
    // Job 3.0: na 12 seconden (beide pogingen samen) neemt de reserve-lezer het over,
    // zodat de kandidaat nooit lang op een antwoord wacht. Uit met JOB_V3_TIMEOUT=0.
    const metLimiet = process.env.JOB_V3_TIMEOUT !== "0";
    const stop = new AbortController();
    const wekker = metLimiet ? setTimeout(() => stop.abort(), AI_TIJDSLIMIET_MS) : null;
    const opties: any = metLimiet ? { signal: stop.signal, maxRetries: 0 } : undefined;
    let completion: any;
    try {
      try {
        completion = await client.chat.completions.create({ ...args, response_format: { type: "json_object" } }, opties);
      } catch (e) {
        if (stop.signal.aborted) throw e;
        completion = await client.chat.completions.create(args, opties);
      }
    } finally {
      if (wekker) clearTimeout(wekker);
    }
    const inhoud: string = completion?.choices?.[0]?.message?.content || "";
    const json = inhoud.slice(inhoud.indexOf("{"), inhoud.lastIndexOf("}") + 1);
    if (!json) return null;
    const ruw = JSON.parse(json);
    const l = valideerLezing(ruw);
    // Fase 2: alleen velden die het antwoord echt draagt.
    return gesprek ? { ...l, velden: bewijsCheck(l.velden, ruw?.bewijs, tekst, onderwerp) } : l;
  } catch (e: any) {
    console.warn("[Job] AI niet bereikbaar, reserve-lezer gebruikt:", e?.message || e);
    return null;
  }
}

/**
 * Leest een antwoord: eerst de AI, anders de reserve-lezer. Wat de AI mist bij
 * een keuzevraag (bijvoorbeeld "3 of 4"), vult de reserve-lezer aan.
 */
export async function lees(tekst: string, onderwerp: Onderwerp | null, ctx: JobContext, bekend: JobVelden, taal: JobTaal, gesprek?: { laatsteVraag: string; geschiedenis: string }): Promise<Lezing> {
  const reserve = reserveLezing(tekst, onderwerp);
  const ai = await leesMetAi(tekst, onderwerp, ctx, bekend, taal, ctx.begrijpen ? gesprek : undefined);
  if (!ai) return reserve;
  // Een doorvraag van de AI: de reserve-lezer mag het open veld dan niet alsnog met de ruwe tekst vullen.
  const reserveVelden = ai.doorvraag ? Object.fromEntries(Object.entries(reserve.velden).filter(([k]) => k !== ai.doorvraag!.voor && !(ai.doorvraag!.voor === "hotels" && k === "hotels"))) : reserve.velden;
  return {
    velden: { ...reserveVelden, ...ai.velden },
    taal: ai.taal ?? reserve.taal,
    twijfel: ai.twijfel,
    ack: ai.ack,
    ...(ai.vervolgvraag && onderwerp === "ervaring" ? { vervolgvraag: ai.vervolgvraag } : {}),
    ...(ai.doorvraag ? { doorvraag: ai.doorvraag } : {}),
    ...(ai.nvt ? { nvt: ai.nvt } : {}),
  };
}
