/**
 * Pure logica voor het opsplitsen van een enkel naamveld in voornaam/
 * achternaam — geen database. Gebruikt door:
 *   - scripts/split-imported-contact-names.ts (eenmalige backfill van de
 *     ~5500 geïmporteerde telefooncontacten)
 *   - server/routes.ts (GET .../available-contacts, als laatste redmiddel
 *     wanneer er geen echte candidate/prospect/imported-contact-split is)
 *
 * BEST-EFFORT, GEEN GARANTIE: dit is dezelfde simpele regel die al twee keer
 * elders in dit project wordt gebruikt (routes.ts GET /import/prospects,
 * ProfilePanel.tsx bij het bewerken van een gekoppeld contact) — eerste
 * woord = voornaam, de rest = achternaam. Bij een naam als "Chef Jan",
 * "Hotel Okura - Marie" of een naam van één woord ("Jan") klopt dat niet
 * één-op-één. Vandaar dat elk resultaat achteraf per contact te corrigeren
 * moet blijven, in plaats van dit als eindstation te behandelen.
 */

export interface SplitName {
  firstName: string;
  /** Leeg (niet null) als de naam maar uit één woord bestaat. */
  lastName: string;
}

/** Splitst een vrij naamveld op de hierboven beschreven best-effort manier. */
export function splitFullName(naam: string | null | undefined): SplitName {
  const trimmed = (naam || '').trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const [eerste, ...rest] = trimmed.split(/\s+/);
  return { firstName: eerste, lastName: rest.join(' ') };
}
