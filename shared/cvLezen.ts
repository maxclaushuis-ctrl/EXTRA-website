/**
 * Cv-analyse (Job 3.0, fase 4): het soort bestand en een strenge controle van
 * wat de AI uit het cv haalt. Puur en getest (server/job/__tests__/cvAnalyse.test.ts).
 * Onbekende velden of waarden vallen weg, zodat de AI nooit iets kan forceren.
 */
import type { FunctieModel, Periode } from "./kandidaatMatch";

export type CvSoort = "pdf" | "word" | "afbeelding" | "anders";
export function soortVan(bestand: string): CvSoort {
  const ext = (bestand.split("?")[0].split(".").pop() || "").toLowerCase();
  return ext === "pdf" ? "pdf" : ext === "docx" || ext === "doc" ? "word" : ["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(ext) ? "afbeelding" : "anders";
}

const PERIODE_DATUM = /^\d{4}(-\d{2})?$/;
const MAAND_NAAM = [["jan"], ["feb"], ["mrt", "maa", "mar"], ["apr"], ["mei", "may"], ["jun"], ["jul"], ["aug"], ["sep"], ["okt", "oct"], ["nov"], ["dec"]];
/** Laat alleen geldige periodes door; onbekende waarden vallen weg. */
export function valideerAnalyse(ruw: any, model: FunctieModel): { periodes: Periode[]; certificaten: string[] } {
  const tekst = (w: unknown, max: number) => (typeof w === "string" && w.trim() ? w.trim().slice(0, max) : null);
  const datum = (w: unknown, magHeden: boolean) => {
    const s = tekst(w, 30);
    if (!s) return null;
    if (magHeden && /\b(heden|nu|present|now|current|huidig)\b/i.test(s)) return "heden";
    if (PERIODE_DATUM.test(s)) return s;
    // Soepel: "maart 2024", "03-2024" of "03/2024"
    const mj = /^(\d{1,2})[-/](\d{4})$/.exec(s);
    if (mj && Number(mj[1]) >= 1 && Number(mj[1]) <= 12) return `${mj[2]}-${mj[1].padStart(2, "0")}`;
    const nm = /^([a-z]+)\.?\s+(\d{4})$/i.exec(s);
    const n = nm ? MAAND_NAAM.findIndex((m) => m.some((x) => nm[1].toLowerCase().startsWith(x))) : -1;
    if (nm && n >= 0) return `${nm[2]}-${String(n + 1).padStart(2, "0")}`;
    return null;
  };
  const kerntaken = (w: unknown) => Array.from(new Set((Array.isArray(w) ? w : []).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < model.kerntaken.length)));
  const soort = (w: unknown): Periode["soort"] => (w === "zelfde" || w === "verwant" ? w : "anders");
  const periodes: Periode[] = (Array.isArray(ruw?.periodes) ? ruw.periodes : []).slice(0, 30).map((p: any) => ({
    functie: tekst(p?.functie, 80) || "Onbekende functie",
    werkgever: tekst(p?.werkgever, 80),
    soort: soort(p?.soort),
    kerntaken: kerntaken(p?.kerntaken),
    begin: datum(p?.begin, false),
    einde: datum(p?.einde, true),
    bron: "cv" as const,
    citaat: tekst(p?.citaat, 200),
  }));
  const g = ruw?.gesprek;
  const maanden = Number(g?.duurMaanden);
  if (g && Number.isFinite(maanden) && maanden > 0 && maanden < 600) {
    periodes.push({ functie: tekst(g?.functie, 80) || model.naam, soort: "zelfde", kerntaken: kerntaken(g?.kerntaken), begin: null, einde: null, duurMaanden: Math.round(maanden), bron: "gesprek", citaat: tekst(g?.citaat, 200) });
  }
  const certificaten = (Array.isArray(ruw?.certificaten) ? ruw.certificaten : []).map((c: unknown) => tekst(c, 80)).filter(Boolean).slice(0, 15) as string[];
  return { periodes, certificaten };
}

