/**
 * Berichten bundelen (WhatsApp): wie twee berichten kort na elkaar stuurt, krijgt
 * één antwoord van Job in plaats van twee.
 *
 * - Een getypt bericht wacht WACHT_MS (6 seconden). Komt er binnen die tijd nog
 *   een bericht, dan begint het wachten opnieuw en gaan ze samen door.
 * - Een aangetikte knop of lijstregel gaat meteen door, samen met wat er nog wacht.
 * - Komt er een bericht binnen terwijl Job nog bezig is met het vorige antwoord,
 *   dan wacht het en gaat het daarna mee in het volgende antwoord.
 *
 * Alleen in het geheugen van de server: geen opslag, geen database. Puur en getest
 * met een nepklok (shared/jobBundel.test.ts).
 */
export const WACHT_MS = 6000;

export interface Deel { tekst: string; knop: boolean }

export interface Klok {
  zet: (fn: () => void, ms: number) => unknown;
  wis: (t: unknown) => void;
}

const echteKlok: Klok = { zet: (fn, ms) => setTimeout(fn, ms), wis: (t) => clearTimeout(t as any) };

interface Rij { delen: Deel[]; timer: unknown; bezig: boolean }

export class Bundelaar<K> {
  private rijen = new Map<K, Rij>();
  constructor(
    private verwerk: (sleutel: K, delen: Deel[]) => Promise<void>,
    private wacht = WACHT_MS,
    private klok: Klok = echteKlok,
  ) {}

  /** Een bericht erbij. Geeft niets terug: het antwoord volgt later. */
  voegToe(sleutel: K, deel: Deel): void {
    const r = this.rijen.get(sleutel) || { delen: [], timer: null, bezig: false };
    this.rijen.set(sleutel, r);
    r.delen.push(deel);
    if (r.bezig) return; // gaat mee zodra het vorige antwoord klaar is
    this.plan(sleutel, r, deel.knop ? 0 : this.wacht);
  }

  /** Wachten er nog berichten (of is Job bezig) voor deze sleutel? */
  wachtend(sleutel: K): boolean {
    const r = this.rijen.get(sleutel);
    return !!r && (r.bezig || r.delen.length > 0);
  }

  private plan(sleutel: K, r: Rij, ms: number) {
    if (r.timer !== null) this.klok.wis(r.timer);
    r.timer = this.klok.zet(() => { void this.door(sleutel); }, ms);
  }

  private async door(sleutel: K) {
    const r = this.rijen.get(sleutel);
    if (!r) return;
    r.timer = null;
    if (r.bezig || !r.delen.length) return;
    const delen = r.delen.splice(0);
    r.bezig = true;
    try {
      await this.verwerk(sleutel, delen);
    } catch (e: any) {
      console.warn("[Job] gebundelde berichten verwerken mislukt:", e?.message || e);
    } finally {
      r.bezig = false;
      if (r.delen.length) {
        // Tijdens het nadenken kwam er iets bij: dat krijgt nu zijn eigen wachttijd,
        // of gaat meteen door als het een knop was.
        this.plan(sleutel, r, r.delen.some((d) => d.knop) ? 0 : this.wacht);
      } else {
        this.rijen.delete(sleutel);
      }
    }
  }
}
