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
import { reserveLezing, valideerLezing } from "@shared/jobLezen";

export function aiBeschikbaar(): boolean {
  return !!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
}

const UITLEG_VELDEN = `
- ervaring: korte samenvatting van de werkervaring (tekst, in de taal van de kandidaat)
- ervaringNiveau: "geen" (nooit in dit soort werk gewerkt), "starter" (heel weinig) of "ervaren"
- functievraag: het antwoord op de functiegerichte vervolgvraag (tekst)
- specialisatieHint: true als de ervaring wijst op evenementen, banqueting, catering of bruiloften
- specialisatie: "ja" of "nee", alleen als de kandidaat antwoordt op de vraag of evenementen en banqueting erbij mogen
- werkautorisatie: alleen bij de vraag over het verblijfsdocument: "vrij" (arbeid vrij toegestaan, TWV niet vereist), "twv" (TWV vereist of niet toegestaan), "onbekend" (weet het niet) of "anders"
- geldigTot: tot wanneer het verblijfsdocument geldig is (tekst)
- diensten: "1-2", "3-4" of "5+" diensten per week
- werkgebied: "tot 25 km", "tot 35 km", "tot 50 km" of een regio (tekst)
- vervoer: fiets, auto, scooter, ov of iets anders (tekst)
- hotels: de hotels waar de kandidaat werkte, zoals genoemd (tekst)
- sterren: "3" (3 sterren of minder), "4" of "5": alleen als de kandidaat zelf het aantal sterren van het beste hotel noemt; nooit zelf afleiden uit een hotelnaam
- werkmoment: "doordeweeks", "avond_weekend" of "flexibel" (wanneer nodig), wanneer de kandidaat kan werken
- startdatum: "direct", "twee_weken" (binnen twee weken) of "later", wanneer de kandidaat kan beginnen
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
  : `- vervolgvraag: alleen als de laatste vraag over ervaring ging en de kandidaat werkervaring noemt: één korte vervolgvraag in het ${taal === "en" ? "Engels" : "Nederlands"} over wat de kandidaat daar precies deed, passend bij die plek en bij de functie ${functieLabel(ctx.functie, "nl")}. Vraag niet naar iets wat daar niet voorkomt (bij festivals bijvoorbeeld niet naar diners of tafelbediening, wel naar bar, drankuitgifte of kassa). Eindigt met een vraagteken. Anders weglaten.`}

Antwoord uitsluitend met JSON: {"velden": {...}, "taal": "...", "twijfel": null, "ack": "", "vervolgvraag": null}`;
}

export async function leesMetAi(tekst: string, onderwerp: Onderwerp | null, ctx: JobContext, bekend: JobVelden, taal: JobTaal): Promise<Lezing | null> {
  if (!aiBeschikbaar()) return null;
  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "unused",
    });
    const args: any = {
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 500,
      messages: [
        { role: "system", content: prompt(onderwerp, ctx, bekend, taal) },
        { role: "user", content: tekst.slice(0, 2000) },
      ],
    };
    let completion: any;
    try {
      completion = await client.chat.completions.create({ ...args, response_format: { type: "json_object" } });
    } catch {
      completion = await client.chat.completions.create(args);
    }
    const inhoud: string = completion?.choices?.[0]?.message?.content || "";
    const json = inhoud.slice(inhoud.indexOf("{"), inhoud.lastIndexOf("}") + 1);
    if (!json) return null;
    return valideerLezing(JSON.parse(json));
  } catch (e: any) {
    console.warn("[Job] AI niet bereikbaar, reserve-lezer gebruikt:", e?.message || e);
    return null;
  }
}

/**
 * Leest een antwoord: eerst de AI, anders de reserve-lezer. Wat de AI mist bij
 * een keuzevraag (bijvoorbeeld "3 of 4"), vult de reserve-lezer aan.
 */
export async function lees(tekst: string, onderwerp: Onderwerp | null, ctx: JobContext, bekend: JobVelden, taal: JobTaal): Promise<Lezing> {
  const reserve = reserveLezing(tekst, onderwerp);
  const ai = await leesMetAi(tekst, onderwerp, ctx, bekend, taal);
  if (!ai) return reserve;
  return {
    velden: { ...reserve.velden, ...ai.velden },
    taal: ai.taal ?? reserve.taal,
    twijfel: ai.twijfel,
    ack: ai.ack,
    ...(ai.vervolgvraag && onderwerp === "ervaring" ? { vervolgvraag: ai.vervolgvraag } : {}),
  };
}
