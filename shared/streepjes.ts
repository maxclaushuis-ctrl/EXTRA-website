/**
 * Streepjes als leesteken vervangen. Op de site horen geen gedachtestreepjes of
 * liggende streepjes (– en —). Gebruikt door scripts/vacature-streepjes.ts.
 * Huistests: shared/streepjes.test.ts (`npm run streepjes:test`).
 */

/** Eén tekst: bereik wordt "tot", een streepje tussen woorden een komma, een opsommingsstreepje vervalt. */
export function zonderStreepjes(tekst: string): string {
  return tekst
    // Bereik tussen getallen: "€20–€24", "9 – 17", "9 - 17"
    .replace(/(\d)(?:\s*[–—]\s*|\s+-\s+)(€\s?)?(?=\d)/g, (_m, a: string, euro?: string) => `${a} tot ${euro ?? ""}`)
    // Opsommingsstreepje aan het begin van een regel
    .replace(/^([ \t]*)[–—][ \t]+/gm, "$1")
    // Streepje direct voor een ander leesteken vervalt
    .replace(/[ \t]+[–—](?=[,.:;!?])/g, "")
    // Streepje als leesteken tussen woorden
    .replace(/[ \t]+[–—][ \t]+|[ \t]+-[ \t]+(?=\p{L})/gu, ", ")
    // Geen dubbele leestekens door de vervanging
    .replace(/,\s*([,.:;!?])/g, "$1");
}

/** Ook in lijsten en objecten (verantwoordelijkheden, FAQ). Andere waarden blijven gelijk. */
export function zonderStreepjesDiep<T>(waarde: T): T {
  if (typeof waarde === "string") return zonderStreepjes(waarde) as T;
  if (Array.isArray(waarde)) return waarde.map((w) => zonderStreepjesDiep(w)) as T;
  if (waarde && typeof waarde === "object") {
    const uit: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(waarde as Record<string, unknown>)) uit[k] = zonderStreepjesDiep(v);
    return uit as T;
  }
  return waarde;
}

/** Staat er nog een – of — in (ergens in de waarde)? */
export function heeftStreepje(waarde: unknown): boolean {
  if (typeof waarde === "string") return /[–—]/.test(waarde);
  if (Array.isArray(waarde)) return waarde.some(heeftStreepje);
  if (waarde && typeof waarde === "object") return Object.values(waarde).some(heeftStreepje);
  return false;
}
