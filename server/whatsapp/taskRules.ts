/**
 * Fase 3B — regels rond taken die de AI uit een bericht afleidt.
 *
 * WAAROM APART VAN storage.ts: dit bestand importeert bewust geen database.
 * Zo is de beslissing "wordt dit een taak, en hoe ziet die er dan uit" te
 * testen zonder Postgres, en blijft storage.ts puur het wegschrijven.
 */
import { isTaskCategory, type AiTaskSuggestion, type TaskCategory } from './aiClassifier';

/** Langer dan dit past niet in de takenlijst en helpt de planner niet meer. */
export const MAX_SUMMARY_LEN = 200;

// Bewust GEEN \p{L}\p{N} met de /u-vlag: het project compileert zonder
// expliciete `target`, en dan staat TypeScript unicode-property-escapes niet
// toe (TS1501). Deze ranges dekken cijfers, latijn (incl. accenten) en zo'n
// beetje elk ander schrift dat boven À begint.
const TEKEN_MET_BETEKENIS = /[0-9A-Za-zÀ-￿]/;
const GEEN_TEKEN_MET_BETEKENIS = /[^0-9A-Za-zÀ-￿\s]/g;

export interface TaskDraft {
  summary: string;
  category: TaskCategory;
}

/**
 * Normaliseer een samenvatting voor OPSLAG: witruimte platslaan, afkappen op
 * een woordgrens. Geeft '' terug als er niets bruikbaars overblijft.
 */
export function normalizeSummary(raw: string | null | undefined): string {
  const s = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  // Een samenvatting zonder enige letter of cijfer ("...", "-") is geen taak.
  if (!TEKEN_MET_BETEKENIS.test(s)) return '';
  if (s.length <= MAX_SUMMARY_LEN) return s;
  const afgekapt = s.slice(0, MAX_SUMMARY_LEN - 1);
  const spatie = afgekapt.lastIndexOf(' ');
  return (spatie > MAX_SUMMARY_LEN * 0.6 ? afgekapt.slice(0, spatie) : afgekapt) + '…';
}

/**
 * Normaliseer een samenvatting voor VERGELIJKEN (dedupe). Agressiever dan
 * normalizeSummary: kleine letters, leestekens en diakrieten weg, zodat
 * "Uren registreren voor Eduardo." en "uren registreren voor eduardo"
 * als hetzelfde tellen.
 */
export function dedupeKey(raw: string | null | undefined): string {
  return (raw ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(GEEN_TEKEN_MET_BETEKENIS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Zet een taak-suggestie van het model om in iets dat we mogen opslaan.
 * null = geen taak aanmaken.
 *
 * Bewust streng: liever een taak missen die de planner toch in het gesprek
 * ziet staan, dan de takenlijst vullen met lege of onzinnige regels — een
 * takenlijst die je moet opschonen, gebruikt niemand.
 */
export function buildTaskDraft(task: AiTaskSuggestion | null | undefined): TaskDraft | null {
  if (!task || task.needed !== true) return null;
  const summary = normalizeSummary(task.summary);
  if (!summary) return null;
  return {
    summary,
    category: isTaskCategory(task.category) ? task.category : 'overig',
  };
}

/**
 * Bestaat er in ditzelfde gesprek al een OPEN taak die hetzelfde zegt?
 *
 * Nodig omdat iemand zijn verzoek vaak twee keer stuurt ("heb je het al
 * gezien?"). De unieke index op source_message_id vangt alleen dubbele
 * webhooks van hetzelfde bericht; dit vangt twee verschillende berichten met
 * dezelfde strekking.
 */
export function isDuplicateOfOpenTask(
  summary: string,
  openSummaries: Array<string | null | undefined>,
): boolean {
  const key = dedupeKey(summary);
  if (!key) return false;
  return openSummaries.some(s => dedupeKey(s) === key);
}

/** Nederlandse weergave-labels voor de takenlijst in de UI. */
export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  uren_jixbee: 'Uren / Jixbee',
  contract: 'Contract',
  overig: 'Overig',
};
