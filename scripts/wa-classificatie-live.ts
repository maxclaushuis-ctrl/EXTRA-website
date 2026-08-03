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
   * Fase 3C: dit veld wordt nu BEIDE KANTEN OP gecontroleerd. Weglaten betekent
   * "hier hoort géén escalatie uit te komen", en dat wordt ook getoetst. Zonder
   * die tweede helft zag de vorige run een onterechte escalatie op case 1 en 2
   * ("Max pls ...", "Hi there Eveline!" werden als mens_gevraagd gelezen) niet
   * eens staan — precies de fout die de aangescherpte prompt moet wegnemen.
   */
  verwachtEscalatie?: boolean;
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
const CASES: LiveCase[] = [
  {
    // Was 'algemene_vraag'. Dit is geen vraag over hoe iets werkt maar een
    // verzoek om een handeling ("zet mijn uren erin") → nieuwe categorie.
    naam: 'EN — uren toevoegen in Jixbee voor twee mensen (urgent)',
    bericht:
      'Max pls add the hours on jixbee for me and Florin cuz i have some urgent payments to do. ' +
      'Eveline didnt answer thats why i ask you directly. Thx',
    verwachtCategorie: 'verzoek',
    verwachtTaak: 'uren_jixbee',
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
    // Twee correcties in één case. (1) verwachtTaak was 'contract': er valt op
    // dit moment niets te DOEN aan een contract — er moet iemand terugbellen,
    // en dat is precies wat de escalatie al regelt. Een taak erbij is dubbel
    // werk in de takenlijst. (2) De categorie is geen informatievraag: hij
    // vraagt om een handeling (zet er een mens op) → 'verzoek', volgens
    // dezelfde beslisregel als case 1 en 2.
    //
    // Dit is de minst zekere van de acht: 'algemene_vraag' is óók te
    // verdedigen, want het onderwerp is zijn contract. De live-run beslist.
    naam: 'EN — vraagt expliciet om een mens',
    bericht: 'Can I please speak to a real person about my contract? A bot is not helping me here.',
    verwachtCategorie: 'verzoek',
    verwachtTaak: null,
    verwachtEscalatie: true,
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
