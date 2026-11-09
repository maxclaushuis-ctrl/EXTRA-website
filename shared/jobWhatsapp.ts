/**
 * Keuzes van Job in WhatsApp: knoppen (hooguit 3, titel hooguit 20 tekens)
 * en het terugvertalen van een antwoord ("2" of een getikte knop) naar de keuze.
 * Puur, getest in shared/jobWhatsapp.test.ts.
 */
import type { Uitgaand } from "./jobRegels";

/** Knoptitels voor WhatsApp: hooguit 20 tekens (Meta). Te lange keuzes krijgen een vaste korte versie. */
const KORTE_KNOP: Record<string, string> = {
  "Arbeid vrij toegestaan": "Vrij toegestaan",
  "Work freely permitted": "Freely permitted",
  "Work permit (TWV) required": "TWV required",
};
export function knopTitel(keuze: string): string {
  return keuze.length <= 20 ? keuze : (KORTE_KNOP[keuze] || keuze.slice(0, 20));
}

/** Knoppen voor WhatsApp bij 1 tot 3 keuzes; anders null (dan komen ze genummerd onder de tekst). */
export function whatsappKnoppen(b: Uitgaand): string[] | null {
  const k = b.keuzes || [];
  if (k.length < 1 || k.length > 3) return null;
  const titels = k.map(knopTitel);
  return new Set(titels).size === titels.length ? titels : null;
}

/** Een genummerd antwoord ("2") wordt de tekst van die keuze. */
export function keuzeUitNummer(tekst: string, keuzes: string[] | null | undefined): string {
  if (!keuzes || !keuzes.length) return tekst;
  // Een getikte knop met een ingekorte titel wordt weer de volledige keuze.
  const knop = keuzes.find((k) => k !== knopTitel(k) && knopTitel(k).toLowerCase() === (tekst || "").trim().toLowerCase());
  if (knop) return knop;
  const m = (tekst || "").trim().match(/^(\d)\.?$/);
  if (!m) return tekst;
  const k = keuzes[Number(m[1]) - 1];
  return k || tekst;
}
