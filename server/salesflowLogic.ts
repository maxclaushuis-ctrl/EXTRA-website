/**
 * Pure beslislogica voor de salesflow — geen database, geen Express.
 * Gebruikt door moveCardToPhase() in server/salesflow.ts; getest in
 * server/salesflowLogic.test.ts.
 *
 * Waarom apart: de vraag "waarom staat hier een reminder?" was in de praktijk
 * lastig te beantwoorden, omdat de voorwaarde midden in een lange functie
 * stond. Hier staat hij op één plek, met een expliciete reden per uitkomst.
 */

export interface FaseRegel {
  /** Eindfase (Deal / Geen interesse): daar is de opvolging klaar. */
  isEndState: boolean;
  /** Vraagt deze fase om een afspraakdatum in plaats van een reminder? */
  asksAppointment: boolean;
  /** Gekozen actie, of null bij "Geen actie". */
  triggerAction: string | null;
  /** Termijn in dagen, of null als er geen termijn is ingesteld. */
  triggerDays: number | null;
}

export type ReminderOordeel =
  | { maakt: true }
  | { maakt: false; reden: string };

/**
 * Mag deze fase een reminder aanmaken?
 *
 * De aanleiding voor deze functie: tot v8 gold alleen `triggerDays != null`.
 * Wie in "Fases instellen" de actie op "Geen actie" zette maar het aantal
 * werkdagen op 0 liet staan, kreeg daardoor tóch een reminder — met
 * vervaldatum vandaag en zonder actietype, dus met de nietszeggende titel
 * "Actie". Die stond de dag erna als "te laat" op het bord én in de
 * ochtendmail. Precies wat "Geen actie" hoort te voorkomen.
 *
 * Nu moeten alle voorwaarden kloppen, en 0 dagen is een geldige termijn zolang
 * er ook een actie bij hoort ("bel vandaag nog").
 */
export function beoordeelReminder(regel: FaseRegel): ReminderOordeel {
  if (regel.isEndState) {
    return { maakt: false, reden: 'eindfase' };
  }
  if (regel.asksAppointment) {
    return { maakt: false, reden: 'afspraakfase — de datum voer je zelf in' };
  }
  if (regel.triggerAction == null || String(regel.triggerAction).trim() === '') {
    return { maakt: false, reden: 'geen actie ingesteld' };
  }
  if (regel.triggerDays == null) {
    return { maakt: false, reden: 'geen termijn ingesteld' };
  }
  return { maakt: true };
}

/**
 * Leest een regel-rij uit de database (snake_case) als FaseRegel.
 * Losse functie zodat de test niet afhankelijk is van de kolomnamen.
 */
export function faseRegelUitRij(rij: any): FaseRegel {
  return {
    isEndState: rij?.is_end_state === true,
    asksAppointment: rij?.asks_appointment === true,
    triggerAction: rij?.trigger_action ?? null,
    triggerDays: rij?.trigger_days ?? null,
  };
}
