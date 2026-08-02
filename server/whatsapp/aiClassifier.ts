/**
 * Fase 3 — classificatie, escalatiereden en (voorbereiding) taakdetectie.
 *
 * ONTWERPKEUZE: één AI-call per inkomend bericht, niet drie.
 * Het model geeft ÉÉN JSON-object terug dat tegelijk bevat:
 *   1. het onderwerp-label van het gesprek   (fase 3)
 *   2. of het antwoordt of escaleert + waarom (fase 3)
 *   3. het antwoord zelf                     (bestond al)
 *   4. een taak-suggestie                     (fase 3B — hier al meegevraagd
 *      en geparsed, maar nog niet gepersisteerd; 3B hoeft dus géén tweede
 *      API-call toe te voegen)
 *
 * TAALONAFHANKELIJKHEID: de classificatie mag NIET op Nederlandse (of Engelse)
 * trefwoorden leunen. De categorieën zijn daarom vaste, taalneutrale enum-waarden
 * die het model op BETEKENIS moet kiezen; de prompt zegt dat expliciet en geeft
 * voorbeelden in meerdere talen. Het antwoordveld `reply` blijft in de taal van
 * de klant — dat is een aparte regel in de systeemprompt van de aanroeper.
 */

export const AI_CATEGORIES = [
  'sollicitatie',
  'afmelding',
  'klacht',
  'algemene_vraag',
  'overig',
] as const;
export type AiCategory = (typeof AI_CATEGORIES)[number];

export const ESCALATION_REASONS = [
  'boos',
  'buiten_kennisbank',
  'wil_telefonisch',
  'mens_gevraagd',
  'overig',
] as const;
export type EscalationReason = (typeof ESCALATION_REASONS)[number];

/** Fase 3B: taakcategorieën. Nu al meegevraagd, nog niet weggeschreven. */
export const TASK_CATEGORIES = ['uren_jixbee', 'contract', 'overig'] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export interface AiTaskSuggestion {
  needed: boolean;
  category: TaskCategory;
  /** Korte, feitelijke samenvatting in het NEDERLANDS voor de planner. */
  summary: string;
}

export interface AiTurnResult {
  category: AiCategory;
  action: 'reply' | 'escalate';
  escalationReason: EscalationReason | null;
  /** Leeg bij action='escalate'. Kan een [BIJLAGE:n]-marker bevatten. */
  reply: string;
  task: AiTaskSuggestion | null;
  /**
   * true als het model geen bruikbare JSON teruggaf en we op de oude
   * platte-tekst-interpretatie zijn teruggevallen. Alleen voor logging.
   */
  usedFallback: boolean;
}

export function isAiCategory(v: unknown): v is AiCategory {
  return typeof v === 'string' && (AI_CATEGORIES as readonly string[]).includes(v);
}

export function isEscalationReason(v: unknown): v is EscalationReason {
  return typeof v === 'string' && (ESCALATION_REASONS as readonly string[]).includes(v);
}

export function isTaskCategory(v: unknown): v is TaskCategory {
  return typeof v === 'string' && (TASK_CATEGORIES as readonly string[]).includes(v);
}

/**
 * Het JSON-contract dat aan de systeemprompt wordt geplakt.
 *
 * Wordt zowel gebruikt door de volledige auto-reply-call als door de
 * classificatie-only-call (die het reply-veld simpelweg negeert), zodat er
 * maar één definitie van de categorieën bestaat.
 */
export function buildStructuredOutputInstruction(opts: { withReply: boolean }): string {
  const replyVeld = opts.withReply
    ? `  "reply": "<the message to send to the customer, in THEIR language; empty string when action is \\"escalate\\">",`
    : `  "reply": "",`;

  return `
=== OUTPUT FORMAT — HARD REQUIREMENT ===
Respond with a SINGLE valid JSON object and nothing else. No markdown, no code fences, no commentary.

{
  "category": "sollicitatie" | "afmelding" | "klacht" | "algemene_vraag" | "overig",
  "action": "reply" | "escalate",
  "escalation_reason": "boos" | "buiten_kennisbank" | "wil_telefonisch" | "mens_gevraagd" | "overig" | null,
${replyVeld}
  "task": { "needed": true | false, "category": "uren_jixbee" | "contract" | "overig", "summary": "<short factual summary in DUTCH>" }
}

=== LANGUAGE INDEPENDENCE — HARD REQUIREMENT ===
The enum values above are internal identifiers, NOT words to match on. Incoming
messages arrive in ANY language (Dutch, English, Spanish, Portuguese, Polish,
Romanian, Arabic, …). Classify on MEANING, never on keywords of one language.
The identifiers happen to be Dutch words; that is irrelevant to the decision.

"category" — what the conversation is about:
- "sollicitatie": someone wants to work / apply / asks about starting, an
  intake, a trial shift, or their application status.
  ("Ik wil graag solliciteren" / "Are you still hiring?" / "Quiero trabajar")
- "afmelding": someone cannot work a shift they were scheduled for, wants to
  cancel, swap or drop a shift, calls in sick.
  ("Ik kan morgen niet" / "I'm sick, can't come tomorrow" / "Nie mogę jutro")
- "klacht": dissatisfaction — about pay, hours, a location, a colleague, the
  agency itself; also anything that reads as an accusation or frustration.
  ("Ik ben nog steeds niet betaald" / "This is unacceptable")
- "algemene_vraag": a question about how something works — pay date, app,
  contract, travel expenses, clothing, registering hours, address of a venue.
  ("Wanneer word ik betaald?" / "Where do I register my hours?")
- "overig": greetings, thanks, small talk, out-of-scope, or truly unclear.

"action" and "escalation_reason":
- "reply" when you can answer correctly and safely from the knowledge base.
  Then escalation_reason MUST be null.
- "escalate" when a human planner must take over. Then reply MUST be "" and
  escalation_reason MUST be one of:
  - "boos": the sender is angry, upset or threatening, regardless of language.
  - "buiten_kennisbank": the answer is not in the knowledge base, or you are
    not sure enough to answer (also: pay disputes, legal, contract specifics).
  - "wil_telefonisch": the sender asks to be called or to call someone.
  - "mens_gevraagd": the sender explicitly asks for a human/planner/Max/Eveline
    or says they do not want to talk to a bot.
  - "overig": escalation is needed but none of the above fits.

"task" — does a colleague have to DO something in another system afterwards?
Set "needed": true only when the message asks for a concrete administrative
action, not for information. Judge on meaning, in any language.
- "uren_jixbee": hours have to be registered/corrected in Jixbee for someone.
  This includes messages that report worked hours after the fact, ask someone
  to add hours, or report that hours are missing.
- "contract": a contract, ID document or signature has to be handled.
- "overig": another concrete action for a colleague.
"summary" is ALWAYS in Dutch, one line, and contains the facts the colleague
needs (who, what, which location, which times), even when the incoming message
was in another language. When "needed" is false, use an empty summary.
A task can exist together with action "reply" — answering the sender and
creating an internal task are independent.`;
}

/** Compacte systeemprompt voor de classificatie-only-call (auto-reply staat uit). */
export function buildClassifyOnlySystemPrompt(): string {
  return `You are a triage assistant for EXTRA, a hospitality staffing agency in Amsterdam.
You do NOT write replies. You only label the conversation for the human planners.
Base your judgement on the LAST INCOMING message, using the earlier messages as context.
Always set "action" to "escalate" only if a human truly must take over; otherwise "reply" with an empty reply string.
${buildStructuredOutputInstruction({ withReply: false })}`;
}

function stripCodeFence(raw: string): string {
  const t = raw.trim();
  if (!t.startsWith('```')) return t;
  return t.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '').trim();
}

/** Pakt het eerste {...}-blok uit een string (model plakt soms tekst eromheen). */
function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Parse het modelantwoord naar een AiTurnResult.
 *
 * Gooit nooit. Bij onbruikbare JSON valt hij terug op het OUDE gedrag:
 * platte tekst = antwoord, de letterlijke tekst "ESCALATE" = escalatie zonder
 * reden. Zo blijft een gesprek nooit onbeantwoord door een parse-fout.
 */
export function parseAiTurnResponse(raw: string | null | undefined): AiTurnResult {
  const text = (raw ?? '').trim();

  const fallback = (): AiTurnResult => {
    const isEscalate = text === 'ESCALATE' || /^ESCALATE\b/.test(text);
    return {
      category: 'overig',
      action: isEscalate ? 'escalate' : 'reply',
      escalationReason: isEscalate ? 'overig' : null,
      reply: isEscalate ? '' : text,
      task: null,
      usedFallback: true,
    };
  };

  if (!text) return fallback();

  const candidate = extractJsonObject(stripCodeFence(text));
  if (!candidate) return fallback();

  let parsed: any;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return fallback();
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback();

  // Als het object geen enkel verwacht veld heeft, is het geen antwoord van ons
  // contract maar toevallige JSON in de tekst → behandel als platte tekst.
  const heeftContractVeld = ['category', 'action', 'reply', 'escalation_reason', 'task']
    .some(k => k in parsed);
  if (!heeftContractVeld) return fallback();

  const category: AiCategory = isAiCategory(parsed.category) ? parsed.category : 'overig';

  const replyText = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';

  // action bepalen. Onbekende/ontbrekende action → afleiden uit de reply:
  // geen tekst betekent dat er niets te versturen valt, dus escaleren.
  let action: 'reply' | 'escalate';
  if (parsed.action === 'escalate') action = 'escalate';
  else if (parsed.action === 'reply') action = 'reply';
  else action = replyText ? 'reply' : 'escalate';

  // Model zegt "reply" maar levert geen tekst → dan is er niets te sturen.
  if (action === 'reply' && !replyText) action = 'escalate';

  const rawReason = parsed.escalation_reason ?? parsed.escalationReason ?? null;
  const escalationReason: EscalationReason | null =
    action === 'escalate'
      ? (isEscalationReason(rawReason) ? rawReason : 'overig')
      : null;

  let task: AiTaskSuggestion | null = null;
  const t = parsed.task;
  if (t && typeof t === 'object' && t.needed === true) {
    const summary = typeof t.summary === 'string' ? t.summary.trim() : '';
    if (summary) {
      task = {
        needed: true,
        category: isTaskCategory(t.category) ? t.category : 'overig',
        summary,
      };
    }
  }

  return {
    category,
    action,
    escalationReason,
    reply: action === 'reply' ? replyText : '',
    task,
    usedFallback: false,
  };
}

/** Nederlandse weergave-labels — gedeeld met de UI via de API-respons. */
export const AI_CATEGORY_LABELS: Record<AiCategory, string> = {
  sollicitatie: 'Sollicitatie',
  afmelding: 'Afmelding',
  klacht: 'Klacht',
  algemene_vraag: 'Algemene vraag',
  overig: 'Overig',
};

export const ESCALATION_REASON_LABELS: Record<EscalationReason, string> = {
  boos: 'Boos',
  buiten_kennisbank: 'Buiten kennisbank',
  wil_telefonisch: 'Wil telefonisch',
  mens_gevraagd: 'Mens gevraagd',
  overig: 'Overig',
};
