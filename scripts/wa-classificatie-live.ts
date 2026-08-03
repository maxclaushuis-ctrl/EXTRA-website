/**
 * Live-controle van de WhatsApp-classificatie (fase 3).
 *
 * WAAROM APART: server/whatsapp/__tests__/aiClassifier.test.ts test het
 * CONTRACT (parsing, terugvalpaden, promptgaranties) en draait overal, ook
 * zonder sleutel. Dit script test of het MODEL de juiste keuze maakt. Daar is
 * een echte API-call voor nodig, dus dit hoort niet in de unit-tests.
 *
 * Draaien (daar waar AI_INTEGRATIONS_* gezet is, bv. op de server):
 *   npx tsx scripts/wa-classificatie-live.ts
 *
 * Kosten: één gpt-4o-mini-call per case (nu 8). Verwaarloosbaar, maar het is
 * geen test die je in een loop zet.
 *
 * Exitcode 0 = alle cases zoals verwacht, 1 = minstens één afwijking.
 * Het script verstuurt NIETS en raakt de database niet aan.
 */
import OpenAI from 'openai';
import {
  parseAiTurnResponse,
  buildStructuredOutputInstruction,
  type AiCategory,
  type EscalationReason,
  type TaskCategory,
} from '../server/whatsapp/aiClassifier';

interface LiveCase {
  naam: string;
  bericht: string;
  verwachtCategorie: AiCategory;
  /** null = er hoort géén taak uit te komen. */
  verwachtTaak: TaskCategory | null;
  /**
   * true = we verwachten dat de AI escaleert in plaats van antwoordt.
   *
   * Fase 3C: dit veld wordt BEIDE KANTEN OP gecontroleerd. Weglaten betekent
   * "hier hoort géén escalatie uit te komen", en dat wordt ook getoetst. Zonder
   * die tweede helft werd een overbodige escalatie stilzwijgend als geslaagd
   * gerapporteerd.
   */
  verwachtEscalatie?: boolean;
  /**
   * Optioneel: welke reden erbij hoort. Alleen invullen waar de reden zelf het
   * punt van de case is — dan meet je of de escalatieregel klopt en niet alleen
   * dát er geëscaleerd werd. Leeglaten = reden niet getoetst.
   */
  verwachtEscalatieReden?: EscalationReason;
}

// De eerste twee zijn de door Max aangeleverde testcases. Ze komen in het
// ENGELS binnen: dat is precies het punt — de classificatie mag niet op
// Nederlandse trefwoorden gebouwd zijn.
//
// FASE 3C — waarom hier verwachtingen zijn VERSCHOVEN en niet alleen de prompt:
// de eerste live-run gaf acht keer hetzelfde resultaat als de tweede, dus de
// afwijkingen kwamen niet van modelruis maar van een te krappe taxonomie.
// Waar de verwachting zelf niet klopte, is de verwachting aangepast; waar de
// prompt te vaag was, is de prompt aangescherpt. Beide staan hieronder benoemd.
//
// TWEEDE RONDE (na de aangescherpte prompt): case 1 en 8 weken nog af, opnieuw
// twee keer identiek. Bij consistent modelgedrag dat verdedigbaar is, verschuift
// de verwachting en niet de prompt — anders scherp je aiClassifier.ts aan op één
// synthetisch geval, en dat is overfitten op de testset. De prompt is in deze
// ronde dan ook niet aangeraakt; alleen de twee verwachtingen hieronder.
const CASES: LiveCase[] = [
  {
    // Was 'algemene_vraag'. Dit is geen vraag over hoe iets werkt maar een
    // verzoek om een handeling ("zet mijn uren erin") → nieuwe categorie.
    //
    // De escalatie hier was eerst onze fout, niet die van het model. We lazen
    // "Max pls ..." als het naamprobleem uit de mens_gevraagd-regel, maar er
    // staat meer: "Eveline didnt answer thats why i ask you directly" is een
    // expliciet verzoek om mens-contact — hij zegt letterlijk dat hij een
    // persoon probeerde te bereiken en daarom nu een ander aanspreekt. Het
    // model past de aangescherpte regel dus correct toe. De reden wordt hier
    // wél getoetst, want juist die regel is in fase 3C herschreven.
    //
    // De taak blijft daarnaast staan: escalatie en taak zijn onafhankelijk, er
    // moet nog steeds iemand uren invoeren.
    naam: 'EN — uren toevoegen in Jixbee voor twee mensen (urgent)',
    bericht:
      'Max pls add the hours on jixbee for me and Florin cuz i have some urgent payments to do. ' +
      'Eveline didnt answer thats why i ask you directly. Thx',
    verwachtCategorie: 'verzoek',
    verwachtTaak: 'uren_jixbee',
    verwachtEscalatie: true,
    verwachtEscalatieReden: 'mens_gevraagd',
  },
  {
    // Idem: uren achteraf melden is geen informatievraag, iemand moet ze invoeren.
    naam: 'EN — vergeten uren achteraf melden',
    bericht:
      'Hi there Eveline! How are you? Excuse me for texting you on your day off. Yesterday I ' +
      'completely forgot about registering the hours that I worked. I was at Pulitzer from ' +
      '05:00-14:35 (15min brake)',
    verwachtCategorie: 'verzoek',
    verwachtTaak: 'uren_jixbee',
  },
  {
    naam: 'NL — sollicitatie',
    bericht: 'Hoi! Ik zag jullie vacature voor bediening, heb 3 jaar ervaring. Kan ik solliciteren?',
    verwachtCategorie: 'sollicitatie',
    verwachtTaak: null,
  },
  {
    naam: 'ES — sollicitatie in het Spaans',
    bericht: 'Hola, quiero trabajar con vosotros como camarero. Tengo experiencia. ¿Cómo puedo aplicar?',
    verwachtCategorie: 'sollicitatie',
    verwachtTaak: null,
  },
  {
    // Was verwachtTaak: null. Dat was fout van ons: een ziekmelding LAAT wél
    // werk achter (dienst opnieuw invullen). Het model maakte er terecht een
    // taak van, alleen zonder passende categorie — vandaar 'vervanging'.
    naam: 'NL — afmelding voor een dienst',
    bericht: 'Sorry, ik ben ziek geworden. Ik kan morgen niet werken bij het Marriott.',
    verwachtCategorie: 'afmelding',
    verwachtTaak: 'vervanging',
  },
  {
    naam: 'PL — afmelding in het Pools',
    bericht: 'Przepraszam, nie mogę jutro przyjść do pracy, jestem chory.',
    verwachtCategorie: 'afmelding',
    verwachtTaak: 'vervanging',
  },
  {
    naam: 'NL — boze klacht (verwacht escalatie)',
    bericht:
      'Dit is de derde keer dat mijn loon te laat is. Ik ben er echt klaar mee, ik wil NU iemand ' +
      'aan de lijn en geen standaardantwoord.',
    verwachtCategorie: 'klacht',
    verwachtTaak: null,
    verwachtEscalatie: true,
  },
  {
    // verwachtTaak was 'contract': er valt op dit moment niets te DOEN aan een
    // contract — er moet iemand terugbellen, en dat is precies wat de escalatie
    // al regelt. Een taak erbij is dubbel werk in de takenlijst.
    //
    // De categorie is na twee gelijke runs 'overig' geworden en niet 'verzoek'.
    // Het bericht heeft binnen deze taxonomie geen inhoudelijk onderwerp buiten
    // de vraag om een mens zelf; het contract wordt genoemd, maar er wordt niets
    // over gevraagd. De vraag om een mens is al vastgelegd in action=escalate +
    // reden mens_gevraagd, dus de categorie hoeft dat niet te herhalen.
    //
    // Dit is de minst zekere van de acht: 'verzoek' en 'algemene_vraag' zijn
    // allebei te verdedigen. Reden om dit later te herzien: als planners dit
    // label structureel met de hand corrigeren (zichtbaar aan
    // aiCategorySource='handmatig'), dan klopt de grens niet.
    naam: 'EN — vraagt expliciet om een mens',
    bericht: 'Can I please speak to a real person about my contract? A bot is not helping me here.',
    verwachtCategorie: 'overig',
    verwachtTaak: null,
    verwachtEscalatie: true,
    verwachtEscalatieReden: 'mens_gevraagd',
  },
];

const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error(
    'Geen AI_INTEGRATIONS_OPENAI_API_KEY (of OPENAI_API_KEY) in de omgeving.\n' +
      'Dit script doet echte API-calls; draai het waar die sleutel staat.',
  );
  process.exit(2);
}

const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });

// Vereenvoudigde versie van de systeemprompt uit tryAutoReply: dezelfde
// contract-instructie, zonder kennisbank en zonder contactgegevens. Genoeg om
// te zien of de classificatie op betekenis werkt.
const SYSTEM_PROMPT = `You are the official WhatsApp assistant for EXTRA, a hospitality staffing agency in Amsterdam.
Always reply in the same language the customer writes in.
Keep replies short (max 2-3 sentences).
If you are not sure, or the topic is sensitive (complaints, payments, legal), escalate to a human planner.
${buildStructuredOutputInstruction({ withReply: true })}`;

async function draaiCase(c: LiveCase) {
  const args: any = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: c.bericht },
    ],
    max_tokens: 600,
    temperature: 0.2, // lager dan productie: we willen hier reproduceerbaarheid
  };

  let completion: any;
  try {
    completion = await client.chat.completions.create({ ...args, response_format: { type: 'json_object' } });
  } catch {
    completion = await client.chat.completions.create(args);
  }

  const raw = completion.choices?.[0]?.message?.content?.trim() ?? '';
  return { raw, turn: parseAiTurnResponse(raw) };
}

(async () => {
  let ok = 0;
  let mis = 0;

  for (const c of CASES) {
    const { raw, turn } = await draaiCase(c);
    const afwijkingen: string[] = [];

    if (turn.usedFallback) afwijkingen.push('model gaf geen bruikbare JSON (fallback gebruikt)');
    if (turn.category !== c.verwachtCategorie) {
      afwijkingen.push(`categorie ${turn.category} ≠ verwacht ${c.verwachtCategorie}`);
    }
    const taakCat = turn.task?.category ?? null;
    if (taakCat !== c.verwachtTaak) {
      afwijkingen.push(`taak ${taakCat ?? 'geen'} ≠ verwacht ${c.verwachtTaak ?? 'geen'}`);
    }
    if (c.verwachtEscalatie && turn.action !== 'escalate') {
      afwijkingen.push('verwachtte escalatie, kreeg een antwoord');
    }
    if (c.verwachtEscalatieReden && turn.escalationReason !== c.verwachtEscalatieReden) {
      afwijkingen.push(
        `escalatiereden ${turn.escalationReason ?? 'geen'} ≠ verwacht ${c.verwachtEscalatieReden}`,
      );
    }
    if (!c.verwachtEscalatie && turn.action === 'escalate') {
      afwijkingen.push(
        `escaleerde onverwacht${turn.escalationReason ? ` (reden: ${turn.escalationReason})` : ''}`,
      );
    }

    if (afwijkingen.length === 0) {
      ok++;
      console.log(`✓ ${c.naam}`);
    } else {
      mis++;
      console.log(`✗ ${c.naam}`);
      for (const a of afwijkingen) console.log(`    ! ${a}`);
      console.log(`    ruwe output: ${raw.replace(/\s+/g, ' ').slice(0, 300)}`);
    }
    console.log(
      `    label=${turn.category} action=${turn.action}` +
        `${turn.escalationReason ? ` reden=${turn.escalationReason}` : ''}` +
        `${turn.task ? ` taak=${turn.task.category}: ${turn.task.summary}` : ''}`,
    );
    if (turn.reply) console.log(`    antwoord: ${turn.reply.replace(/\s+/g, ' ')}`);
    console.log('');
  }

  console.log(`${ok} zoals verwacht, ${mis} afwijkend (van ${CASES.length}).`);
  if (mis > 0) {
    console.log(
      'Let op: dit is een taalmodel, geen deterministische functie. Eén afwijking is een ' +
        'signaal om de prompt aan te scherpen, geen bewijs dat het kapot is — draai hem twee keer.',
    );
  }
  process.exit(mis === 0 ? 0 : 1);
})();
