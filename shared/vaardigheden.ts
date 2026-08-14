/**
 * VAARDIGHEDEN — de subfuncties die iemand bij de aanmelding zelf opgeeft.
 *
 * Waarom dit bestand bestaat: bij Medewerkers is `functie` een vrij tekstveld
 * en de hoofdindeling (Housekeeping, Horeca, Chef, Front office, Logistiek)
 * ligt vast in een database-enum. Wat daartussen zit — kan iemand cocktails
 * maken, is hij assistent-kok, draait hij promowerk — werd al wél gevraagd op
 * het aanmeldformulier en opgeslagen als losse ja/nee-kolommen op de kandidaat,
 * maar was nergens terug te vinden of te filteren.
 *
 * Deze lijst is de enige plek waar die kolommen aan een leesbaar label hangen.
 * Server (storage.getEmployees) en client (MedewerkersTab) gebruiken hem
 * allebei, zodat een nieuwe vaardigheid toevoegen één regel is.
 *
 * Let op: de gegevens hangen aan de KANDIDAAT, niet aan de medewerker. Een
 * medewerker die via een aanmelding is binnengekomen heeft een candidateId en
 * dus vaardigheden; iemand die handmatig als medewerker is aangemaakt heeft die
 * koppeling niet en houdt een lege lijst. Dat is geen fout, dat is simpelweg
 * "nooit gevraagd" — de UI zegt dat ook zo.
 */

import type { Employee } from './schema';

/** Een medewerker zoals de lijst hem teruggeeft: mét de vaardigheden van zijn kandidaat. */
export type EmployeeMetVaardigheden = Employee & { vaardigheden: string[] };

export interface VaardigheidDefinitie {
  /** Kolomnaam op de kandidaat (camelCase, zoals drizzle hem teruggeeft). */
  sleutel: string;
  /** Wat de gebruiker leest. */
  label: string;
}

/**
 * Volgorde = volgorde op het scherm. Bewust niet alfabetisch: de vaardigheden
 * die het vaakst voorkomen en waar het vaakst op gezocht wordt, staan vooraan.
 */
export const VAARDIGHEDEN: VaardigheidDefinitie[] = [
  { sleutel: 'isAssistantChef', label: 'Assistent chef' },
  { sleutel: 'isBarista', label: 'Barista' },
  { sleutel: 'canMakeCocktails', label: 'Cocktails' },
  { sleutel: 'canCarryThreePlates', label: '3 borden dragen' },
  { sleutel: 'canDoWashing', label: 'Afwas' },
  { sleutel: 'isPromoter', label: 'Promowerk' },
];

/** Alle labels, in schermvolgorde. */
export const VAARDIGHEID_LABELS: string[] = VAARDIGHEDEN.map(v => v.label);

/**
 * Zet de ja/nee-kolommen van een kandidaat om in een lijst leesbare labels.
 *
 * Accepteert bewust `any`: de rij komt uit drizzle (camelCase) maar kan ook uit
 * een ruwe query komen (snake_case). Beide schrijfwijzen worden herkend, zodat
 * een joinvorm die morgen verandert dit niet stilletjes leegmaakt.
 *
 * Geen kandidaat of geen enkele vlag aan → lege lijst.
 */
export function vaardighedenUitKandidaat(kandidaat: any): string[] {
  if (!kandidaat) return [];
  return VAARDIGHEDEN.filter(v => {
    const camel = kandidaat[v.sleutel];
    const snake = kandidaat[naarSnakeCase(v.sleutel)];
    return camel === true || snake === true;
  }).map(v => v.label);
}

/** isAssistantChef → is_assistant_chef */
export function naarSnakeCase(s: string): string {
  return s.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
}

/**
 * Telt per vaardigheid hoeveel mensen hem hebben — voor de aantallen achter de
 * knoppen. Alleen vaardigheden die daadwerkelijk voorkomen komen terug, in de
 * vaste volgorde van VAARDIGHEDEN hierboven.
 */
export function telVaardigheden(
  mensen: Array<{ vaardigheden?: string[] | null }>,
): Array<{ label: string; aantal: number }> {
  const teller = new Map<string, number>();
  for (const m of mensen) {
    for (const label of m.vaardigheden ?? []) {
      teller.set(label, (teller.get(label) ?? 0) + 1);
    }
  }
  return VAARDIGHEID_LABELS
    .filter(label => (teller.get(label) ?? 0) > 0)
    .map(label => ({ label, aantal: teller.get(label)! }));
}
