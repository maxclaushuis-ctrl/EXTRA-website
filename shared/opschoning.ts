/**
 * Welke onvolledige aanmeldingen de nachtelijke opschoning (server/routes.ts) mag verwijderen.
 *
 * De opschoning is gemaakt voor het oude aanmeldformulier: daar is een kandidaat zonder cv
 * die na 30 dagen nog op "in behandeling" staat een afgebroken aanmelding. Bij aanmeldformulier 3
 * is dat anders: iedereen staat op "in behandeling" tot er een gesprek is, en het cv komt later
 * via Job (of nooit, bij functies zonder ervaringseis). Die kandidaten mogen dus nooit op deze
 * grond verdwijnen (besluit Max 16 nov 2026). Zelfde uitzondering als bij de cv-herinneringen.
 */
export const OPSCHOON_NA_DAGEN = 30;

export interface OpschoonKandidaat {
  hasCv?: boolean | null;
  status?: string | null;
  createdAt?: Date | string | null;
  aanmeldVersie?: string | null;
}

export function magOpgeschoond(c: OpschoonKandidaat, nu: Date): boolean {
  if (c.aanmeldVersie === "3") return false;
  if (c.hasCv) return false;
  if (c.status !== "in_behandeling") return false;
  if (!c.createdAt) return false;
  const gemaakt = new Date(c.createdAt);
  if (isNaN(gemaakt.getTime())) return false;
  return gemaakt.getTime() < nu.getTime() - OPSCHOON_NA_DAGEN * 24 * 60 * 60 * 1000;
}
