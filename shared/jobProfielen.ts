/**
 * Job: de functievragen per functie (vraagversie 2).
 *
 * Basis: de 19 functieprofielen uit "Vragen per functie: Job en het sollicitatiegesprek"
 * (versie 2), met de afspraken van Max van 25 november 2026 als leidend:
 *   - na de openingsvraag hoogstens drie functievragen; één goed antwoord kan genoeg zijn;
 *   - per functie alleen de vraag die nog iets oplevert (wat al gezegd is, vraagt Job niet);
 *   - runner, dinerloper, front office, host en heftruck zoals Max ze beschreef.
 *
 * Een profiel is een lijst "punten": gegevens die Job wil weten, elk met een vraag. De AI
 * vult punten uit wat de kandidaat zegt (met citaat); de regels kiezen het volgende punt.
 * Elk punt wordt hooguit één keer gevraagd. Blijft het daarna onbekend, dan is het een open
 * punt voor het gesprek: onbekend is nooit nee.
 *
 * Alleen nieuwe gesprekken gebruiken dit (JobVelden.vraagversie = 2). Lopende gesprekken
 * houden hun eigen vragen. Puur, getest in shared/jobProfielen.test.ts.
 */
import type { JobContext, JobTaal, JobVelden } from "./jobRegels";

export type Punten = Record<string, string>;

export interface Punt {
  sleutel: string;
  /** Wat Job hiermee wil weten (voor de AI en de planner). */
  doel: string;
  /** Toegestane waarden; zonder lijst is het een korte tekst in de woorden van de kandidaat. */
  waarden?: string[];
  /** De vaste vraag (de AI mag hem in eigen woorden stellen). */
  vraag: { nl: string; en: string } | ((p: Punten, taal: JobTaal) => string);
  /** Knoppen onder de vraag, met de waarde die elke knop betekent. */
  keuzes?: { nl: string; en: string; waarde: string }[] | ((p: Punten) => { nl: string; en: string; waarde: string }[]);
  /** Alleen vragen als dit klopt. */
  alleenAls?: (p: Punten, v: JobVelden) => boolean;
  /** Ook vragen als de kandidaat geen ervaring heeft. */
  ookStarter?: boolean;
  /** Nooit zelf vragen; alleen vastleggen als de kandidaat het noemt. */
  alleenVastleggen?: boolean;
  /** Dit punt is ingevuld als al deze sleutels een waarde hebben (standaard: de eigen sleutel). */
  klaarAls?: (p: Punten) => boolean;
  /** Een doorvraag die een ander punt vult (het antwoord komt bij die sleutel). */
  vult?: string;
  /** Telt het antwoord als beantwoord (ook als nog niet alles bekend is)? Standaard: ingevuld. */
  beantwoordAls?: (p: Punten) => boolean;
  /** Hoe vaak Job het punt hooguit vraagt als het antwoord onbruikbaar is (standaard twee keer). */
  maxPogingen?: number;
}

export interface Profiel {
  code: string;
  naam: { nl: string; en: string };
  /** Het vrije stuk van de openingsvraag: "hoeveel jaar ervaring heb je ... tot nu toe?" */
  opening: { nl: string; en: string };
  /** Wat Job moet begrijpen (voor de AI). */
  luisteren: string;
  punten: Punt[];
}

export const MAX_FUNCTIEVRAGEN = 3;

const ja = (x: string | undefined) => x === "ja";
const ervaren = (v: JobVelden) => v.ervaringNiveau !== "geen";
const knop = (nl: string, en: string, waarde: string) => ({ nl, en, waarde });

const TAKEN = (doel: string, nl: string, en: string): Punt => ({ sleutel: "taken", doel, vraag: { nl, en } });

const RUNNER_UITLEG = {
  nl: "Als runner loop je met dienbladen, of je loopt hapjes en drankjes uit, haalt glazen op en springt bij waar nodig. Is dat het soort werk dat je zoekt?",
  en: "As a runner you carry trays, or you walk around with snacks and drinks, collect glasses and help out where needed. Is that the kind of work you're looking for?",
};

export const PROFIELEN: Record<string, Profiel> = {
  housekeeping: {
    code: "housekeeping", naam: { nl: "Housekeeping", en: "Housekeeping" },
    opening: { nl: "in de housekeeping van een hotel", en: "in hotel housekeeping" },
    luisteren: "Ervaring is vereist. Maak onderscheid tussen hotelkamers, algemene ruimtes en ander schoonmaakwerk (kantoren, huizen): ander schoonmaakwerk telt niet als hotelervaring. \"Ik werkte in een hotel\" zegt nog niet wat iemand deed. \"Ik wil housekeeping leren\" betekent dat de ervaring nog onbekend is (laat ervaringNiveau leeg): vraag dan of iemand al hotelkamers heeft schoongemaakt. Kamers per dienst en sterren zijn context, geen maatstaf.",
    punten: [
      // Afspraak 25 nov 2026: "ik wil het leren" blijft onbekend; Job vraagt eerst of iemand al hotelkamers schoonmaakte.
      { sleutel: "eerderKamers", doel: "of iemand al eens hotelkamers schoonmaakte (bij iemand die het wil leren)", waarden: ["ja", "nee"], ookStarter: true,
        alleenAls: (p, v) => !!v.wilLeren && !p.soort,
        vraag: { nl: "Heb je al eens hotelkamers schoongemaakt?", en: "Have you cleaned hotel rooms before?" },
        keuzes: [knop("Ja", "Yes", "ja"), knop("Nog niet", "Not yet", "nee")] },
      { sleutel: "soort", doel: "of iemand zelf hotelkamers schoonmaakte, de algemene ruimtes, allebei, of alleen ander schoonmaakwerk", waarden: ["kamers", "algemeen", "allebei", "ander", "nog_niet"],
        alleenAls: (p) => p.eerderKamers !== "nee",
        vraag: { nl: "Maakte je daar de hotelkamers schoon, de algemene ruimtes of allebei?", en: "Did you clean the hotel rooms there, the public areas or both?" } },
      { sleutel: "kamersPerDienst", doel: "hoeveel kamers iemand ongeveer per dienst deed (context)", alleenAls: (p) => p.soort === "kamers" || p.soort === "allebei",
        vraag: { nl: "Hoeveel kamers deed je ongeveer tijdens een normale dienst?", en: "About how many rooms did you do in a normal shift?" } },
      { sleutel: "sterren", doel: "het hoogste aantal sterren van een hotel waar iemand werkte", waarden: ["3", "4", "5"], alleenAls: (p) => ["kamers", "algemeen", "allebei"].includes(p.soort),
        vraag: { nl: "Wat was het hoogste aantal sterren van een hotel waar je werkte?", en: "What was the highest star rating of a hotel you worked at?" },
        keuzes: [knop("3 of minder", "3 or fewer", "3"), knop("4 sterren", "4 stars", "4"), knop("5 sterren", "5 stars", "5")] },
    ],
  },
  frontoffice: {
    code: "frontoffice", naam: { nl: "Front office", en: "Front office" },
    opening: { nl: "aan de receptie van een hotel", en: "at a hotel reception" },
    luisteren: "Ervaring is vereist. Goed Engels voor gastcontact is de basis; goed Engels zonder Nederlands is voldoende. Gasten ook in het Nederlands kunnen helpen is een voorkeur. Zegt iemand alleen Nederlands te spreken en gasten niet in het Engels te kunnen helpen, zet engels dan op nee. \"Ik checkte dagelijks gasten in het Engels in\" beantwoordt de taalvraag voor het Engels al. Leg Engels en Nederlands apart vast als ja of nee, alleen uit wat de kandidaat zegt; de taal waarin iemand appt is nooit bewijs. Klantenservice of een balie buiten een hotel is verwant, geen receptie-ervaring.",
    punten: [
      { sleutel: "taken", doel: "welke taken iemand zelf deed aan de receptie (inchecken, uitchecken, reserveringen, gasten helpen)",
        vraag: { nl: "Welke taken pakte je zelf op aan de receptie?", en: "Which tasks did you handle yourself at the reception?" } },
      { sleutel: "taal", doel: "in welke taal iemand gasten goed kan helpen: engels en nederlands apart, ja of nee", ookStarter: true,
        klaarAls: (p) => !!p.engels && !!p.nederlands, beantwoordAls: (p) => !!p.engels || !!p.nederlands,
        vraag: { nl: "In welke talen kun je gasten goed helpen, bijvoorbeeld bij het inchecken?", en: "In which languages can you help guests well, for example when checking in?" } },
      // Besluit Max 25 nov 2026: Engels nog onbekend na de taalvraag, dan één keer gericht doorvragen.
      { sleutel: "engelsCheck", doel: "of iemand gasten in het Engels kan ontvangen en hun vragen kan beantwoorden", ookStarter: true, vult: "engels", waarden: ["ja", "nee"], maxPogingen: 1,
        alleenAls: (p, v) => (v.puntenGevraagd || []).includes("taal") && !p.engels, klaarAls: (p) => !!p.engels,
        vraag: { nl: "Kun je gasten ook in het Engels ontvangen en hun vragen beantwoorden?", en: "Can you also welcome guests in English and answer their questions?" },
        keuzes: [knop("Ja", "Yes", "ja"), knop("Nee", "No", "nee")] },
      { sleutel: "systeem", doel: "met welk reserveringssysteem iemand werkte",
        vraag: { nl: "Met welk reserveringssysteem werkte je?", en: "Which reservation system did you work with?" } },
      { sleutel: "sterren", doel: "het hoogste aantal sterren van een hotel waar iemand werkte", waarden: ["3", "4", "5"],
        vraag: { nl: "Wat was het hoogste aantal sterren van een hotel waar je werkte?", en: "What was the highest star rating of a hotel you worked at?" },
        keuzes: [knop("3 of minder", "3 or fewer", "3"), knop("4 sterren", "4 stars", "4"), knop("5 sterren", "5 stars", "5")] },
      { sleutel: "engels", doel: "kan gasten goed in het Engels helpen", waarden: ["ja", "nee"], alleenVastleggen: true, vraag: { nl: "", en: "" } },
      { sleutel: "nederlands", doel: "kan gasten goed in het Nederlands helpen", waarden: ["ja", "nee"], alleenVastleggen: true, vraag: { nl: "", en: "" } },
    ],
  },
  keuken: {
    code: "keuken", naam: { nl: "Keuken", en: "Kitchen" },
    opening: { nl: "als kok of in een keuken", en: "as a cook or in a kitchen" },
    luisteren: "Ervaring is vereist: zelfstandig op een post koken. Let goed op wie wat deed: \"Ik hielp in de keuken, mijn collega stond zelfstandig op de warme kant\" betekent dat de kandidaat hielp en de collega zelfstandig kookte; zet zelfstandig dan op nee. Werkgevers en opleiding staan in het cv; vraag ze niet, behalve de opleiding bij iemand zonder werkervaring.",
    punten: [
      { sleutel: "taken", doel: "wat iemand zelf deed tijdens een drukke dienst (posten, gerechten, mise-en-place)",
        vraag: { nl: "Wat deed je zelf tijdens een drukke dienst in de keuken?", en: "What did you do yourself during a busy shift in the kitchen?" } },
      { sleutel: "zelfstandig", doel: "of iemand zelfstandig een post of gerechten deed (ja), of alleen meehielp (nee)", waarden: ["ja", "nee"],
        vraag: { nl: "Welke gerechten of onderdelen maakte je zelfstandig?", en: "Which dishes or parts did you make on your own?" } },
      { sleutel: "richting", doel: "of keukenhulp het werk is dat iemand zoekt (alleen voorstellen, nooit stil omzetten)", waarden: ["ja", "nee", "weet_niet"], alleenAls: (p) => p.zelfstandig === "nee",
        vraag: { nl: "Dan klinkt keukenhulp als een mogelijke richting. Is dat ook het werk dat je zoekt?", en: "Then kitchen assistant sounds like a possible direction. Is that also the work you're looking for?" },
        keuzes: [knop("Ja", "Yes", "ja"), knop("Nee, ik zoek werk als kok", "No, I'm looking for work as a cook", "nee"), knop("Weet ik niet", "I don't know", "weet_niet")] },
      { sleutel: "opleiding", doel: "bij iemand zonder werkervaring: of iemand een koksopleiding deed of doet", ookStarter: true, alleenAls: (_p, v) => v.ervaringNiveau === "geen",
        vraag: { nl: "Heb je een koksopleiding gedaan of ben je ermee bezig?", en: "Have you done a chef's training, or are you doing one now?" } },
    ],
  },
  afwas: {
    code: "afwas", naam: { nl: "Afwas", en: "Dishwashing" },
    opening: { nl: "in de afwas of een spoelkeuken", en: "in dishwashing or a dish room" },
    luisteren: "Starters zijn welkom. Vraag niet naar hotels of sterren. Het gaat erom of het werk past.",
    punten: [
      { sleutel: "past", doel: "of staand, fysiek werk in een warme, drukke keuken past", waarden: ["ja", "weet_niet", "nee"], ookStarter: true,
        vraag: { nl: "Afwassen is staand en fysiek werk in een warme, drukke keuken. Is dat het soort werk dat je zoekt?", en: "Dishwashing is standing, physical work in a hot, busy kitchen. Is that the kind of work you're looking for?" },
        keuzes: [knop("Ja", "Yes", "ja"), knop("Weet ik niet", "Not sure", "weet_niet"), knop("Liever niet", "Rather not", "nee")] },
    ],
  },
  fb: {
    code: "fb", naam: { nl: "F&B", en: "F&B" },
    opening: { nl: "in de bediening, de bar of het ontbijt", en: "in service, at the bar or at breakfast" },
    luisteren: "Ontbijt, bediening en bar kunnen naast elkaar voorkomen: leg alle genoemde taken vast.",
    punten: [TAKEN("wat iemand meestal deed tijdens een dienst (ontbijt, bediening, bar)", "Wat deed je meestal tijdens een dienst?", "What did you usually do during a shift?")],
  },
  banqueting: {
    code: "banqueting", naam: { nl: "Banqueting", en: "Banqueting" },
    opening: { nl: "in banqueting of de bediening", en: "in banqueting or service" },
    luisteren: "Opbouw, vergaderservice, buffet en uitserveren kunnen naast elkaar voorkomen: leg alle genoemde taken vast.",
    punten: [TAKEN("wat iemand deed tijdens bijeenkomsten of diners (opbouw, koffie en lunch, uitserveren)", "Wat was jouw taak tijdens een bijeenkomst of diner?", "What was your role during a meeting or dinner?")],
  },
  bediening: {
    code: "bediening", naam: { nl: "Bediening", en: "Waiting staff" },
    opening: { nl: "in de bediening", en: "in service" },
    luisteren: "Starters zijn welkom. Leg ook vast wat iemand niet deed.",
    punten: [TAKEN("wat iemand zelf deed in de bediening", "Wat deed je zelf tijdens de bediening?", "What did you do yourself while serving?")],
  },
  bar: {
    code: "bar", naam: { nl: "Bar", en: "Bar" },
    opening: { nl: "achter de bar", en: "behind the bar" },
    luisteren: "Starters zijn welkom. \"Ik tapte bier op festivals\" beantwoordt de barvraag al.",
    punten: [TAKEN("wat iemand maakte of schonk (tappen, wijn, cocktails, koffie, kassa)", "Wat maakte of schonk je meestal?", "What did you usually make or pour?")],
  },
  dinerloper: {
    code: "dinerloper", naam: { nl: "Dinerloper", en: "Food runner" },
    opening: { nl: "met diners uitserveren of in de bediening", en: "serving dinners or in service" },
    luisteren: "Alleen kandidaten met relevante ervaring. Het gaat vooral om high-end diners waar iemand zelfstandig met drie borden tegelijk aan tafel uitserveert en de serveeretiquette kent. Dienbladen lopen of borden tot aan de zaal brengen bewijst dat niet. \"Ik heb veel op bruiloften gewerkt\" is aanleiding voor: \"Heb je daar ook zelf met drie borden tegelijk aan tafel uitgeserveerd?\" Is alleen de etiquette nog onduidelijk, vraag dan bijvoorbeeld: \"Hoe serveerden jullie de gasten aan tafel?\" Er is geen minimumaantal maanden. Niemand hoeft iets voor te doen. Etiquette is ja als iemand concreet beschrijft hoe aan tafel werd uitgeserveerd (bijvoorbeeld van één kant, per tafel tegelijk, een vaste volgorde), nee als iemand zegt dat niet te kennen of nooit aan tafel te hebben uitgeserveerd.",
    punten: [
      { sleutel: "drieBorden", doel: "of iemand zelf met drie borden tegelijk aan tafel uitserveerde", waarden: ["ja", "nee"],
        vraag: { nl: "Heb je daar ook zelf met drie borden tegelijk aan tafel uitgeserveerd?", en: "Did you also serve at the table yourself there, carrying three plates at once?" } },
      { sleutel: "etiquette", doel: "of iemand de serveeretiquette aan tafel kent (uit een concrete beschrijving)", waarden: ["ja", "nee"], alleenAls: (p) => p.drieBorden !== "nee",
        vraag: { nl: "Hoe serveerden jullie de gasten aan tafel?", en: "How did you serve the guests at the table?" } },
    ],
  },
  runner: {
    code: "runner", naam: { nl: "Runner", en: "Runner" },
    opening: { nl: "bij evenementen of in de horeca", en: "at events or in hospitality" },
    luisteren: "Starters zijn welkom. In restaurants loopt een runner met dienbladen. Op cateringevenementen gaat het vaak om hapjes en drankjes uitlopen, glazen ophalen en bijspringen waar nodig. Beschrijft iemand dit werk al concreet, leg dat dan vast als runnerwerk (wat iemand deed); uitleg of dezelfde vraag is dan overbodig. Zet past alleen als de kandidaat zelf zegt of het werk bij hem past: eerder runnerwerk is nog geen \"dit past bij mij\".",
    punten: [
      { sleutel: "runnerwerk", doel: "runnerwerk dat iemand eerder deed, in eigen woorden (dienbladen, hapjes en drankjes uitlopen, glazen ophalen)", alleenVastleggen: true, vraag: { nl: "", en: "" } },
      { sleutel: "past", doel: "of het werk van een runner past bij wat iemand zoekt (alleen als de kandidaat dat zelf zegt)", waarden: ["ja", "weet_niet", "nee"], ookStarter: true, vraag: RUNNER_UITLEG,
        klaarAls: (p) => !!p.past || !!p.runnerwerk,
        keuzes: [knop("Ja", "Yes", "ja"), knop("Weet ik niet", "Not sure", "weet_niet"), knop("Liever niet", "Rather not", "nee")] },
    ],
  },
  host: {
    code: "host", naam: { nl: "Host of hostess", en: "Host or hostess" },
    opening: { nl: "met het ontvangen van gasten", en: "welcoming guests" },
    luisteren: "Goed Engels is voldoende; Nederlands geeft hier geen voordeel. Ervaring met gasten of bezoekers buiten de horeca, bijvoorbeeld op een beurs of aan een balie, is relevant. Leg engels vast als ja of nee, alleen uit wat de kandidaat zegt; de taal waarin iemand appt is nooit bewijs.",
    punten: [
      { sleutel: "waar", doel: "waar iemand eerder gasten of bezoekers ontving en wat iemand daar deed",
        vraag: { nl: "Waar heb je eerder gasten of bezoekers ontvangen?", en: "Where have you welcomed guests or visitors before?" } },
      { sleutel: "engels", doel: "of iemand gasten goed in het Engels kan helpen", waarden: ["ja", "nee"], ookStarter: true,
        vraag: { nl: "Kun je gasten ook goed in het Engels helpen?", en: "Can you help guests well in English too?" },
        keuzes: [knop("Ja", "Yes", "ja"), knop("Nee", "No", "nee")] },
    ],
  },
  supervisor: {
    code: "supervisor", naam: { nl: "Event supervisor", en: "Event supervisor" },
    opening: { nl: "bij evenementen of in de horeca", en: "at events or in hospitality" },
    luisteren: "Ervaring met het aansturen van een team heeft de voorkeur; iemand met veel relevante eventervaring kan ook in aanmerking komen. Er is geen ondergrens in jaren. \"We stonden met twaalf man\" vertelt hoe groot het team was, maar laat open of iemand zelf leidinggaf. Een floormanager of teamleider gaf wel leiding. Leg ervaring en verantwoordelijkheid kort vast voor de collega.",
    punten: [
      { sleutel: "leiding", doel: "of iemand tijdens een evenement zelf een team aanstuurde", waarden: ["ja", "enkele_keer", "nee"],
        vraag: { nl: "Heb je tijdens een evenement zelf een team aangestuurd?", en: "Have you led a team yourself during an event?" },
        keuzes: [knop("Ja", "Yes", "ja"), knop("Een enkele keer", "Once or twice", "enkele_keer"), knop("Nog niet", "Not yet", "nee")] },
      { sleutel: "verantwoordelijk", doel: "waar iemand verantwoordelijk voor was als leidinggevende", alleenAls: (p) => p.leiding === "ja" || p.leiding === "enkele_keer",
        vraag: { nl: "Waar was jij toen verantwoordelijk voor?", en: "What were you responsible for then?" } },
      // Besluit Max 25 nov 2026: nog geen team aangestuurd maar wel eventervaring, dan wat iemand zelf regelde.
      { sleutel: "regelde", doel: "wat iemand zelf regelde tijdens een druk evenement (kort, voor de collega)", alleenAls: (p) => p.leiding === "nee",
        vraag: { nl: "Wat regelde jij zelf tijdens een druk evenement?", en: "What did you take care of yourself during a busy event?" } },
      { sleutel: "teamgrootte", doel: "hoe groot het team was (alleen als de kandidaat het noemt)", alleenVastleggen: true, vraag: { nl: "", en: "" } },
    ],
  },
  orderpicker: {
    code: "orderpicker", naam: { nl: "Orderpicker", en: "Order picker" },
    opening: { nl: "als orderpicker of in een magazijn", en: "as an order picker or in a warehouse" },
    luisteren: "Starters zijn welkom. Een middel (scanner, voice, papieren lijst) zegt niets over het niveau; leg vast wat iemand deed.",
    punten: [TAKEN("hoe iemand bestellingen verzamelde en wat iemand verder deed", "Hoe verzamelde je de bestellingen?", "How did you pick the orders?")],
  },
  heftruck: {
    code: "heftruck", naam: { nl: "Heftruck of reachtruck", en: "Forklift or reach truck" },
    opening: { nl: "op een heftruck of reachtruck", en: "on a forklift or reach truck" },
    luisteren: "Wie zelf op de truck reed, kan ook zonder geldig certificaat op gesprek komen; een ontbrekend of verlopen certificaat is geen probleem vooraf. Houd per truck apart bij of iemand er zelf op reed en welk certificaat iemand zegt te hebben. Meerijden of ingewerkt worden is niet zelf rijden. \"Ik reed op allebei, maar mijn certificaat is alleen voor de heftruck\" geeft meteen: heftruck gereden en certificaat opgegeven, reachtruck gereden en geen certificaat. Een certificaat dat de kandidaat noemt, is opgegeven; pas de documentcontrole maakt het meer.",
    punten: [
      { sleutel: "gereden", doel: "op welke truck iemand zelf reed", waarden: ["heftruck", "reachtruck", "allebei", "geen"], ookStarter: true,
        vraag: { nl: "Op welke truck heb je zelf gereden?", en: "Which truck have you driven yourself?" },
        keuzes: [knop("Heftruck", "Forklift", "heftruck"), knop("Reachtruck", "Reach truck", "reachtruck"), knop("Allebei", "Both", "allebei")] },
      { sleutel: "certificaat", doel: "per truck het certificaat volgens de kandidaat: certHeftruck en certReachtruck, elk opgegeven, verlopen of geen", ookStarter: true,
        klaarAls: (p) => certKlaar(p),
        vraag: (p, taal) => certVraag(p, taal),
        keuzes: (p) => certKeuzes(p) },
      { sleutel: "certHeftruck", doel: "certificaat heftruck volgens de kandidaat", waarden: ["opgegeven", "verlopen", "geen"], alleenVastleggen: true, vraag: { nl: "", en: "" } },
      { sleutel: "certReachtruck", doel: "certificaat reachtruck volgens de kandidaat", waarden: ["opgegeven", "verlopen", "geen"], alleenVastleggen: true, vraag: { nl: "", en: "" } },
    ],
  },
  inpak: {
    code: "inpak", naam: { nl: "Inpak en productie", en: "Packing and production" },
    opening: { nl: "met inpakken of productiewerk", en: "with packing or production work" },
    luisteren: "Starters zijn welkom. Leg vast wat iemand inpakte of klaarmaakte, aan een lijn of zelfstandig.",
    punten: [TAKEN("wat iemand inpakte of klaarmaakte", "Wat pakte je in of maakte je klaar?", "What did you pack or prepare?")],
  },
  expeditie: {
    code: "expeditie", naam: { nl: "Expeditie", en: "Shipping" },
    opening: { nl: "in de expeditie of een magazijn", en: "in shipping or a warehouse" },
    luisteren: "Starters zijn welkom. Leg taken en middelen (pompwagen, elektrische pallettruck) apart vast.",
    punten: [TAKEN("wat iemand deed voordat een zending vertrok", "Wat deed je voordat een zending vertrok?", "What did you do before a shipment left?")],
  },
  magazijn: {
    code: "magazijn", naam: { nl: "Magazijn", en: "Warehouse" },
    opening: { nl: "in een magazijn", en: "in a warehouse" },
    luisteren: "Starters zijn welkom.",
    punten: [TAKEN("wat iemand op een gewone dag in het magazijn deed", "Wat deed je op een gewone dag in het magazijn?", "What did you do on a normal day in the warehouse?")],
  },
  voorraad: {
    code: "voorraad", naam: { nl: "Voorraad en kwaliteit", en: "Stock and quality" },
    opening: { nl: "met voorraad of kwaliteitscontrole", en: "with stock or quality control" },
    luisteren: "\"Ik controleerde of de aantallen op de pakbon klopten\" beantwoordt al wat iemand controleerde.",
    punten: [
      { sleutel: "soort", doel: "of iemand vooral met voorraad, kwaliteitscontroles of allebei bezig was", waarden: ["voorraad", "kwaliteit", "allebei"],
        vraag: { nl: "Hield je je vooral bezig met voorraad, kwaliteitscontroles of allebei?", en: "Did you mainly work on stock, quality checks or both?" },
        keuzes: [knop("Voorraad", "Stock", "voorraad"), knop("Kwaliteit", "Quality", "kwaliteit"), knop("Allebei", "Both", "allebei")] },
      { sleutel: "controle", doel: "wat iemand precies controleerde", alleenAls: (p) => p.soort === "kwaliteit" || p.soort === "allebei",
        vraag: { nl: "Wat controleerde je precies?", en: "What exactly did you check?" } },
    ],
  },
  open: {
    code: "open", naam: { nl: "Weet ik nog niet", en: "Not sure yet" },
    opening: { nl: "in de horeca of de logistiek", en: "in hospitality or logistics" },
    luisteren: "De kandidaat koos nog geen functie. Een kandidaat komt alleen voor een functie in aanmerking als duidelijk is dat die ervoor openstaat.",
    punten: [{ sleutel: "werk", doel: "wat voor werk iemand eerder deed", ookStarter: true, vraag: { nl: "Wat voor werk heb je eerder gedaan?", en: "What kind of work have you done before?" } }],
  },
};

// ─── Heftruck: certificaat per truck ────────────────────────────────────────

const trucksGereden = (p: Punten): ("heftruck" | "reachtruck")[] =>
  p.gereden === "allebei" ? ["heftruck", "reachtruck"] : p.gereden === "heftruck" || p.gereden === "reachtruck" ? [p.gereden] : ["heftruck", "reachtruck"];
const certSleutel = (t: "heftruck" | "reachtruck") => (t === "heftruck" ? "certHeftruck" : "certReachtruck");
function certKlaar(p: Punten): boolean {
  return trucksGereden(p).every((t) => !!p[certSleutel(t)]);
}
function certVraag(p: Punten, taal: JobTaal): string {
  const trucks = trucksGereden(p);
  if (trucks.length === 1) {
    const naam = trucks[0] === "heftruck" ? (taal === "nl" ? "heftruck" : "forklift") : (taal === "nl" ? "reachtruck" : "reach truck");
    return taal === "nl" ? `Heb je voor de ${naam} een certificaat?` : `Do you have a certificate for the ${naam}?`;
  }
  return taal === "nl" ? "Voor welke truck heb je een geldig certificaat?" : "Which truck do you have a valid certificate for?";
}
function certKeuzes(p: Punten) {
  return trucksGereden(p).length === 1
    ? [knop("Ja, geldig", "Yes, valid", "opgegeven"), knop("Ja, verlopen", "Yes, expired", "verlopen"), knop("Nee", "No", "geen")]
    : [knop("Heftruck", "Forklift", "heftruck"), knop("Reachtruck", "Reach truck", "reachtruck"), knop("Allebei", "Both", "allebei"), knop("Geen", "None", "geen")];
}
/** Een knop bij de certificaatvraag omzetten naar de status per truck. */
function certUitKnop(p: Punten, waarde: string): Punten {
  const trucks = trucksGereden(p);
  if (trucks.length === 1) return { [certSleutel(trucks[0])]: waarde };
  const uit: Punten = {};
  for (const t of trucks) uit[certSleutel(t)] = waarde === "allebei" || waarde === t ? "opgegeven" : "geen";
  return uit;
}

// ─── Welk profiel ───────────────────────────────────────────────────────────

/** Codes van het vorige formulier en functionTypes zonder eigen code. */
const OUDE_CODE: Record<string, string> = { logistiek: "magazijn", horecamedewerker: "bediening", chef: "keuken" };

/** Het profiel voor dit gesprek: de voorkeursfunctie als iemand er meer koos, anders de gekozen functie. */
export function profielVoor(ctx: Pick<JobContext, "functieCode" | "functie">, punten?: Punten): Profiel | null {
  const keuze = punten?.voorkeur && PROFIELEN[punten.voorkeur] ? punten.voorkeur : null;
  const code = keuze || ctx.functieCode || "";
  return PROFIELEN[code] || PROFIELEN[OUDE_CODE[code] || ""] || PROFIELEN[ctx.functie] || PROFIELEN[OUDE_CODE[ctx.functie] || ""] || null;
}

/** Het vrije stuk van de openingsvraag voor dit gesprek. */
export function openingVoor(ctx: Pick<JobContext, "functieCode" | "functie" | "meerFuncties">, taal: JobTaal): string | null {
  if (ctx.meerFuncties) return taal === "nl" ? "in de horeca" : "in hospitality";
  return profielVoor(ctx)?.opening[taal] ?? null;
}

// ─── Het volgende punt ──────────────────────────────────────────────────────

const ingevuld = (pt: Punt, p: Punten) => (pt.klaarAls ? pt.klaarAls(p) : !!p[pt.sleutel]);

/** De voorkeursvraag bij meer gekozen functies (events): één punt vooraf. */
export function voorkeurOpen(ctx: Pick<JobContext, "functies">, v: JobVelden): boolean {
  return !!ctx.functies && ctx.functies.length > 1 && !v.punten?.voorkeur && !(v.puntenGevraagd || []).includes("voorkeur");
}

/**
 * Het punt dat Job nu vraagt, of null als er niets meer te vragen valt: alles bekend, al
 * gevraagd, niet van toepassing, of de drie functievragen zijn op.
 */
export function volgendPunt(ctx: Pick<JobContext, "functieCode" | "functie" | "functies">, v: JobVelden): Punt | null {
  // De drie functievragen zijn op: alleen de vraag die nu openstaat mag nog (opnieuw) gesteld worden.
  const op = (v.functievragen || 0) >= MAX_FUNCTIEVRAGEN;
  const mag = (pt: Punt) => (!op || pt.sleutel === v.puntGevraagd ? pt : null);
  if (voorkeurOpen(ctx, v)) return mag(VOORKEUR_PUNT);
  const p = v.punten || {};
  const profiel = profielVoor(ctx, p);
  if (!profiel) return null;
  const gevraagd = v.puntenGevraagd || [];
  for (const pt of profiel.punten) {
    if (pt.alleenVastleggen || ingevuld(pt, p) || gevraagd.includes(pt.sleutel)) continue;
    if (!pt.ookStarter && !ervaren(v)) continue;
    if (pt.alleenAls && !pt.alleenAls(p, v)) continue;
    return mag(pt);
  }
  return null;
}

const VOORKEUR_PUNT: Punt = {
  sleutel: "voorkeur", doel: "naar welke van de gekozen functies de voorkeur het meest uitgaat", vraag: { nl: "", en: "" },
};

/** De vraag van een punt, met knoppen. */
export function puntVraag(pt: Punt, ctx: Pick<JobContext, "functies">, p: Punten, taal: JobTaal): { tekst: string; keuzes?: string[] } {
  if (pt.sleutel === "voorkeur" && ctx.functies) {
    const namen = ctx.functies.map((f) => f[taal].toLowerCase());
    const lijst = namen.length > 1 ? `${namen.slice(0, -1).join(", ")} ${taal === "nl" ? "en" : "and"} ${namen[namen.length - 1]}` : namen[0];
    return {
      tekst: taal === "nl" ? `Je koos ${lijst}. Waar gaat je voorkeur het meest naar uit?` : `You chose ${lijst}. Which one do you prefer most?`,
      keuzes: ctx.functies.map((f) => f[taal]),
    };
  }
  const tekst = typeof pt.vraag === "function" ? pt.vraag(p, taal) : pt.vraag[taal];
  const k = typeof pt.keuzes === "function" ? pt.keuzes(p) : pt.keuzes;
  return k ? { tekst, keuzes: k.map((x) => x[taal]) } : { tekst };
}

/** Welke knop (waarde) het antwoord is, of null. */
export function keuzeWaarde(pt: Punt, ctx: Pick<JobContext, "functies">, p: Punten, tekst: string): string | null {
  const n = (x: string) => x.trim().toLowerCase().replace(/[.!?,]+/g, "").replace(/\s+/g, " ");
  const s = n(tekst);
  if (!s) return null;
  if (pt.sleutel === "voorkeur" && ctx.functies) {
    const f = ctx.functies.find((x) => n(x.nl) === s || n(x.en) === s);
    return f ? f.code : null;
  }
  const k = typeof pt.keuzes === "function" ? pt.keuzes(p) : pt.keuzes;
  const hit = k?.find((x) => n(x.nl) === s || n(x.en) === s);
  return hit ? hit.waarde : null;
}

/**
 * Een kort ja of nee op een ja/nee-punt, ook zonder AI ("Nee, dat deden de vaste obers" is nee).
 * Alleen aan het begin van het antwoord en alleen bij een kort antwoord; anders null.
 */
export function jaNee(pt: Punt, tekst: string): string | null {
  if (!pt.waarden || !pt.waarden.includes("ja") || !pt.waarden.includes("nee")) return null;
  const t = tekst.trim().toLowerCase();
  if (t.split(/\s+/).length > 10 || /weet (ik )?niet|geen idee|not sure|don'?t know/.test(t)) return null;
  // Ook kort of slordig getypt: "jaa", "jep", "yess".
  if (/^(ja+|jawel|jazeker|zeker|klopt|jep|jup|yes+|yep|yeah|yea|absoluut|altijd)\b/.test(t)) return "ja";
  if (/^(nee|neen|nooit|niet|no|nope|never|nog niet|not yet)\b/.test(t)) return "nee";
  return null;
}

// ─── Wat de AI teruggeeft ───────────────────────────────────────────────────

/**
 * Laat alleen punten door die bij dit profiel horen, met een toegestane waarde. Een tekst wordt
 * ingekort. Een knop bij de certificaatvraag wordt per truck omgezet.
 */
export function geldigePunten(ctx: Pick<JobContext, "functieCode" | "functie" | "functies">, bekend: Punten, ruw: unknown): Punten {
  if (!ruw || typeof ruw !== "object") return {};
  const uit: Punten = {};
  const r = ruw as Record<string, unknown>;
  if (typeof r.voorkeur === "string" && ctx.functies?.some((f) => f.code === r.voorkeur)) uit.voorkeur = r.voorkeur;
  const profiel = profielVoor(ctx, { ...bekend, ...uit });
  if (!profiel) return uit;
  for (const pt of profiel.punten) {
    const w = r[pt.sleutel];
    if (typeof w !== "string" || !w.trim()) continue;
    const s = w.trim();
    if (pt.sleutel === "certificaat" || pt.vult) continue;
    if (pt.waarden) { if (pt.waarden.includes(s)) uit[pt.sleutel] = s; }
    else uit[pt.sleutel] = s.slice(0, 300);
  }
  return uit;
}

/** Een antwoord op een knop van dit punt omzetten naar punten. */
export function puntenUitKnop(pt: Punt, p: Punten, waarde: string): Punten {
  if (pt.sleutel === "certificaat") return certUitKnop(p, waarde);
  return { [pt.vult || pt.sleutel]: waarde };
}

// ─── Onderbouwt het citaat de waarde? ───────────────────────────────────────

const kaal = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const ONTKENNING = /\b(niet|geen|nooit|nee|no|not|never|none)\b/;
const VULWOORD = new Set(["de", "het", "een", "en", "of", "van", "met", "in", "op", "aan", "bij", "voor", "ik", "je", "we", "wij", "zelf", "ook", "vooral", "soms", "alleen", "the", "and", "or", "an", "with", "at", "for", "mostly", "also"]);
function woordGelijk(a: string, b: string): boolean {
  if (a === b) return true;
  const n = Math.min(a.length, b.length);
  if (n < 4) return false;
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  // Zelfde stam ("inchecke" en "inchecken", "cocktail" en "cocktails").
  return i >= Math.max(4, Math.ceil(0.75 * n));
}
/**
 * Draagt het citaat van de kandidaat deze waarde? Elk inhoudswoord van de waarde moet in het citaat staan
 * (tikfouten in de uitgang mogen), en een ontkenning moet in allebei staan of in geen van beide.
 * "Opera" bij "Wij gebruikten Mews": nee. "Zelfstandig ingecheckt" bij "Ik checkte niet zelfstandig in": nee.
 */
export function waardeGedragen(waarde: string, citaat: string): boolean {
  const w = kaal(waarde), c = kaal(citaat);
  if (!w || !c) return false;
  if (ONTKENNING.test(w) !== ONTKENNING.test(c)) return false;
  if (c.includes(w)) return true;
  const cw = c.split(" ");
  const inhoud = w.split(" ").filter((x) => x.length > 1 && !VULWOORD.has(x) && !ONTKENNING.test(x));
  return inhoud.length > 0 && inhoud.every((x) => cw.some((y) => woordGelijk(x, y)));
}

// ─── Duidelijke tegenspraak tussen bericht en gelezen waarde ────────────────
// Voor de punten die bepalen of een collega meekijkt. Het model kan zich vergissen; dan ziet de planner nooit de
// verkeerde waarde, maar een open punt met de letterlijke zin van de kandidaat.

const NIET = /\b(niet|geen|nooit|nog niet|not|never|no|cannot|can'?t|don'?t|didn'?t)\b/i;
/** Uitdrukkingen met een ontkenning die juist iets positiefs zeggen ("Engels is geen probleem"). */
const WEL_POSITIEF = /\b(geen probleem|geen moeite|niet moeilijk|no problem|not a problem|not difficult|nooit een probleem)\b/gi;
const ANDER = /\b(collega|collega'?s|de obers|obers|iemand anders|anderen|de vaste|mijn baas|colleagues?|someone else|the waiters|other staff)\b/i;
const ZELF = /\b(ik|i)\b/i;
const ONDERWERP: Record<string, RegExp> = { engels: /\b(engels|english)\b/i, nederlands: /\b(nederlands|dutch)\b/i, drieBorden: /\b(drie|3|three)\b.*\b(bord|borden|plates?|tegelijk|at once|at a time|serveer|serveerde|uitserveren|uitgeserveerd|serve|served|carried|droeg)\b|\b(bord|borden|plates?)\b.*\b(drie|3|three)\b/i };
// Zonder grens achteraan: "heftruckcertificaat" noemt ook de heftruck.
const HEF = /\b(heftruck|vorkheftruck|forklift)/i, REACH = /\b(reachtruck|reach truck|reach-truck)/i;
const GELDIG = /\b(geldig|valid|nog goed|up to date)\b/i;
const CERT = /\b(certificaat|certificaten|certificate|pas|papiertje|diploma)\b/i;
const VERLOPEN = /\b(verlopen|expired|niet meer geldig|no longer valid)\b/i;
const GEEN_CERT = /\b(geen certificaat|zonder certificaat|no certificate|without a certificate|niet gehaald)\b/i;

/** Zinnen en zinsdelen (een komma, "maar" en "but" splitsen ook). */
function zinsdelen(tekst: string): string[] {
  return tekst.split(/(?<=[.!?;])\s+|\s*,\s*|\s+\b(?:maar|but)\b\s+/i).map((x) => x.trim()).filter(Boolean);
}
const ontkend = (x: string) => NIET.test(x.replace(WEL_POSITIEF, ""));

/**
 * Spreekt het bericht deze waarde duidelijk tegen? Dan de letterlijke zin(nen) die dat laten zien, anders null.
 * Alleen duidelijke gevallen: twijfel of geen vermelding is geen tegenspraak.
 */
export function tegenspraak(sleutel: string, waarde: string, tekst: string): string | null {
  const delen = zinsdelen(tekst);
  const zinnen = tekst.split(/(?<=[.!?;])\s+/).map((x) => x.trim()).filter(Boolean);
  if (sleutel === "engels" || sleutel === "nederlands") {
    const over = delen.filter((d) => ONDERWERP[sleutel].test(d));
    if (!over.length) return null;
    if (waarde === "ja" && over.every(ontkend)) return over.join(" ");
    // "nee" terwijl de kandidaat het alleen positief noemt, in zinnen zonder enige ontkenning.
    const zinMet = zinnen.filter((z) => ONDERWERP[sleutel].test(z));
    if (waarde === "nee" && over.every((d) => !ontkend(d)) && zinMet.every((z) => !ontkend(z)) && zinMet.every((z) => !/\b(alleen|only|een beetje|a bit|a little)\b/i.test(z))) return over.join(" ");
    return null;
  }
  if (sleutel === "drieBorden") {
    const over = delen.filter((d) => ONDERWERP.drieBorden.test(d));
    if (!over.length) return null;
    const nietZelf = (d: string) => ontkend(d) || (ANDER.test(d) && !ZELF.test(d.replace(ANDER, "")));
    if (waarde === "ja" && over.every(nietZelf)) return over.join(" ");
    if (waarde === "nee" && over.every((d) => !nietZelf(d) && ZELF.test(d))) return over.join(" ");
    return null;
  }
  if (sleutel === "gereden") {
    const h = HEF.test(tekst), r = REACH.test(tekst), beide = /\b(allebei|beide|both)\b/i.test(tekst);
    const zinTruck = zinnen.filter((z) => HEF.test(z) || REACH.test(z));
    if (!h && !r) return null;
    if (waarde === "heftruck" && r && !h) return zinTruck.join(" ");
    if (waarde === "reachtruck" && h && !r) return zinTruck.join(" ");
    if (waarde === "allebei" && (h !== r) && !beide) return zinTruck.join(" ");
    if (waarde === "geen" && zinTruck.some((z) => /\b(reed|gereden|rijd|rijden|drove|drive|driven)\b/i.test(z) && !ontkend(z))) return zinTruck.join(" ");
    return null;
  }
  if (sleutel === "certHeftruck" || sleutel === "certReachtruck") {
    // Alleen de zinsdelen over deze truck, plus een algemeen deel ("mijn certificaat is verlopen") dat geen truck noemt.
    // Zo zet "Mijn reachtruckcertificaat is verlopen" een geldig heftruckcertificaat niet ter discussie.
    const truck = sleutel === "certHeftruck" ? HEF : REACH;
    const over = delen.filter((d) => truck.test(d) || ((CERT.test(d) || VERLOPEN.test(d)) && !HEF.test(d) && !REACH.test(d)));
    const t = over.join(" ");
    if (!over.length || !(CERT.test(t) || VERLOPEN.test(t) || GELDIG.test(t))) return null;
    const verlopen = VERLOPEN.test(t), geen = GEEN_CERT.test(t), geldig = over.some((d) => GELDIG.test(d) && !VERLOPEN.test(d) && !ontkend(d));
    if (waarde === "opgegeven" && (verlopen || geen) && !geldig) return t;
    if (waarde === "verlopen" && ((geen && !verlopen) || (geldig && !verlopen))) return t;
    if (waarde === "geen" && (verlopen || geldig) && !geen) return t;
    return null;
  }
  return null;
}

/** De regel voor de planner bij een tegenspraak: welk punt, wat het model las en wat de kandidaat letterlijk zei. */
export function tegenspraakRegel(sleutel: string, waarde: string, zin: string, eerder = false): string {
  return eerder
    ? `Controleren: ${LABEL[sleutel] || sleutel} is weer open. Eerder opgeslagen was "${waarde}", later schreef de kandidaat: "${zin.slice(0, 200)}"`
    : `Controleren: ${LABEL[sleutel] || sleutel} is open gelaten. Het model las "${waarde}", de kandidaat schreef: "${zin.slice(0, 200)}"`;
}

// ─── Voor de planner ────────────────────────────────────────────────────────

const LEESBAAR: Record<string, Record<string, string>> = {
  soort: { kamers: "hotelkamers", algemeen: "algemene ruimtes", allebei: "kamers en algemene ruimtes", ander: "ander schoonmaakwerk", nog_niet: "nog geen hotelkamers", voorraad: "voorraad", kwaliteit: "kwaliteit" },
  ja: { ja: "ja", nee: "nee", weet_niet: "weet het niet", enkele_keer: "een enkele keer" },
};
const LABEL: Record<string, string> = {
  voorkeur: "Voorkeur", taken: "Taken", soort: "Soort werk", kamersPerDienst: "Kamers per dienst", sterren: "Hoogste sterren", systeem: "Systeem",
  engels: "Engels voor gastcontact", nederlands: "Nederlands voor gastcontact", zelfstandig: "Zelfstandig gekookt", richting: "Keukenhulp als richting",
  opleiding: "Opleiding", past: "Werk past", runnerwerk: "Eerder runnerwerk", eerderKamers: "Al eens hotelkamers schoongemaakt", drieBorden: "Drie borden aan tafel", etiquette: "Serveeretiquette", waar: "Gasten ontvangen",
  leiding: "Team aangestuurd", verantwoordelijk: "Verantwoordelijk voor", teamgrootte: "Teamgrootte", gereden: "Zelf gereden",
  certHeftruck: "Certificaat heftruck", certReachtruck: "Certificaat reachtruck", controle: "Controleerde", werk: "Eerder werk", regelde: "Regelde zelf",
};

/** De punten als leesbare regels voor de planner, met wat nog open staat. */
export function puntenRegels(ctx: Pick<JobContext, "functieCode" | "functie" | "functies">, v: JobVelden): string[] {
  const p = v.punten || {};
  const regels: string[] = [];
  for (const [k, w] of Object.entries(p)) {
    const label = LABEL[k] || k;
    // "Allebei" hangt af van de functie: bij voorraad en kwaliteit zijn het geen kamers.
    const soortTekst = w === "allebei" && profielVoor(ctx, p)?.punten.some((x) => x.sleutel === "soort" && x.waarden?.includes("voorraad")) ? "voorraad en kwaliteitscontrole" : LEESBAAR.soort[w] || w;
    const tekst = k === "voorkeur" ? (ctx.functies?.find((f) => f.code === w)?.nl || w) : k === "soort" ? soortTekst : k === "sterren" ? (w === "3" ? "3 of minder" : `${w} sterren`) : LEESBAAR.ja[w] || w;
    regels.push(`${label}: ${tekst}${["engels", "nederlands", "certHeftruck", "certReachtruck"].includes(k) ? " (door kandidaat verteld)" : ""}`);
  }
  const profiel = profielVoor(ctx, p);
  for (const k of v.puntenGevraagd || []) {
    const pt = profiel?.punten.find((x) => x.sleutel === k);
    if (pt && !(pt.beantwoordAls ? pt.beantwoordAls(p) : ingevuld(pt, p))) regels.push(`Open: ${pt.doel}`);
  }
  return regels;
}

/** Een korte samenvatting voor het bestaande veld "functievraag" (kaart en profiel). */
export function puntenSamenvatting(ctx: Pick<JobContext, "functieCode" | "functie" | "functies">, v: JobVelden): string {
  const regels = puntenRegels(ctx, v);
  const open = regels.filter((r) => r.startsWith("Open: ")).map((r) => r.slice(6));
  const bekend = regels.filter((r) => !r.startsWith("Open: "));
  return [...bekend, ...(open.length ? [`nog open: ${open.join(", ")}`] : [])].join("; ").slice(0, 600);
}

/** Wat de AI over dit profiel moet weten: de punten met hun sleutel en toegestane waarden. */
export function profielPrompt(ctx: Pick<JobContext, "functieCode" | "functie" | "functies">, v: JobVelden): string {
  const p = v.punten || {};
  const profiel = profielVoor(ctx, p);
  if (!profiel) return "";
  const regels = profiel.punten.filter((pt) => pt.sleutel !== "certificaat" && !pt.vult).map((pt) => `  - ${pt.sleutel}: ${pt.doel}${pt.waarden ? ` (${pt.waarden.join(" | ")})` : " (korte tekst)"}${p[pt.sleutel] ? ` [bekend: ${p[pt.sleutel]}]` : ""}`);
  if (ctx.functies && ctx.functies.length > 1) regels.unshift(`  - voorkeur: de code van de functie waar de voorkeur naar uitgaat (${ctx.functies.map((f) => f.code).join(" | ")})`);
  return `Functie: ${profiel.naam.nl}. Wat Job moet begrijpen: ${profiel.luisteren}\nPunten die je mag vastleggen (in velden.punten, met per punt een citaat in bewijs.punten):\n${regels.join("\n")}`;
}
