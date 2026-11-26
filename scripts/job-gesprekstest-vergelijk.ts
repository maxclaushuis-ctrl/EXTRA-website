/**
 * Legt de voor- en nameting van de gesprekstest naast elkaar: de vijf voor-en-nagesprekken met de letterlijke
 * berichten van kandidaat en Job, wat Job opsloeg en wat de planner ziet.
 *
 *   npx tsx scripts/job-gesprekstest-vergelijk.ts gesprekstest-voor.json gesprekstest-na.json > vergelijking.txt
 *
 * Eisen, per model: beide metingen zijn afgerond; alle vijf verwachte gesprekken staan in beide; elke vaste reeks is
 * volledig en letterlijk zoals vastgelegd verstuurd; de plannerweergave direct na de reeks is opgeslagen.
 * Foutcode 0: aan alles voldaan; 1: iets ontbreekt of verschilt, of een bestand is onleesbaar.
 */
import { readFileSync } from "fs";
import { GESPREKKEN_V2 } from "./jobGesprekken";

interface Beurt { kandidaat: string; job: string[]; opgeslagen?: string; vraagWas?: string | null; punt?: string | null; bron?: string }
interface Gesprek { naam: string; model: string; status: string; fouten: string[]; vasteReeks: string[] | null; naReeks: { velden: Record<string, unknown>; planner: string[]; status: string } | null; beurten: Beurt[]; velden: Record<string, unknown>; planner: string[]; collega: string[] }
export interface Meting { klaar: boolean; afgebroken: string | null; instellingen?: Record<string, unknown> | null; gesprekken: Gesprek[] }

/** De vijf voor-en-nagesprekken met hun vaste reeks, zoals vastgelegd in scripts/jobGesprekken.ts. */
export const VERWACHT: { naam: string; vast: string[] }[] = GESPREKKEN_V2.filter((g) => g.sleutel && g.vast).map((g) => ({ naam: g.naam, vast: g.vast! }));

function lees(pad: string): Meting {
  const j = JSON.parse(readFileSync(pad, "utf8"));
  return { klaar: j?.klaar === true, afgebroken: j?.afgebroken ?? null, instellingen: j?.instellingen ?? null, gesprekken: Array.isArray(j?.gesprekken) ? j.gesprekken : [] };
}

const zelfde = (a: string[] | null | undefined, b: string[]) => !!a && a.length === b.length && a.every((x, i) => x === b[i]);

/** De vergelijking als tekst plus alles wat niet aan de eisen voldoet. */
export function vergelijk(voor: Meting, na: Meting, verwacht = VERWACHT): { regels: string[]; fouten: string[] } {
  const regels: string[] = [];
  const fouten: string[] = [];
  for (const [kant, m] of [["voormeting", voor], ["nameting", na]] as const) {
    if (!m.klaar) fouten.push(`de ${kant} is niet afgerond${m.afgebroken ? ` (${m.afgebroken})` : ""}`);
  }
  // Zelfde modelinstellingen voor en na, anders zegt de vergelijking niets over de nieuwe versie.
  if (voor.instellingen || na.instellingen) {
    const a = JSON.stringify(voor.instellingen ?? null), b = JSON.stringify(na.instellingen ?? null);
    regels.push(`Instellingen voor: ${a}`, `Instellingen na:   ${b}`, "");
    if (a !== b) fouten.push("de modelinstellingen van voor- en nameting verschillen");
  }
  if (verwacht.length !== 5) fouten.push(`${verwacht.length} voor-en-nagesprekken vastgelegd, verwacht vijf`);
  const modellen = Array.from(new Set([...voor.gesprekken, ...na.gesprekken].map((g) => g.model))).sort();
  if (!modellen.length) fouten.push("geen gesprekken gevonden");
  for (const model of modellen) {
    for (const v of verwacht) {
      const a = voor.gesprekken.find((g) => g.model === model && g.naam === v.naam);
      const b = na.gesprekken.find((g) => g.model === model && g.naam === v.naam);
      regels.push("=".repeat(80), `${v.naam} [${model}]`, "=".repeat(80));
      const foutenVoorGesprek = fouten.length;
      for (const [kant, g] of [["voormeting", a], ["nameting", b]] as const) {
        if (!g) { fouten.push(`${v.naam} [${model}]: ontbreekt in de ${kant}`); continue; }
        if (!zelfde(g.vasteReeks, v.vast)) fouten.push(`${v.naam} [${model}]: de ${kant} verstuurde ${g.vasteReeks?.length ?? 0} van de ${v.vast.length} vaste berichten, of niet letterlijk zoals vastgelegd`);
        if (!g.naReeks?.planner?.length) fouten.push(`${v.naam} [${model}]: in de ${kant} ontbreekt de plannerweergave direct na de reeks`);
        const prefix = g.beurten.slice(0, v.vast.length);
        if (!zelfde(prefix.map((beurt) => beurt.kandidaat), v.vast)) {
          fouten.push(`${v.naam} [${model}]: het beurtlog van de ${kant} mist een vast bericht of bevat een afwijkende tekst of volgorde`);
        }
        if (prefix.some((beurt) => !beurt.job.some((tekst) => tekst.trim().length > 0))) {
          fouten.push(`${v.naam} [${model}]: in de ${kant} gaf Job in de reeks een keer geen antwoord`);
        }
      }
      const ok = fouten.length === foutenVoorGesprek;
      regels.push(`Vaste reeks: ${ok ? "in beide metingen volledig en letterlijk zoals vastgelegd" : "NIET VOLLEDIG OF NIET GELIJK"} (${v.vast.length} berichten)`, "");
      for (let i = 0; i < v.vast.length; i++) {
        const ba = a?.beurten[i], bb = b?.beurten[i];
        regels.push(`Beurt ${i + 1}, kandidaat: ${v.vast[i]}`);
        regels.push(`  VOOR  Job${ba?.bron ? ` [${ba.bron === "terugval" ? "TERUGVAL, vaste regels" : ba.bron}]` : ""}: ${ba ? ba.job.join(" / ") || "(geen bericht)" : "(niet verstuurd)"}`, `        opgeslagen: ${ba?.opgeslagen ?? "-"}${ba && ba.kandidaat !== v.vast[i] ? `  [kreeg: ${ba.kandidaat}]` : ""}`);
        regels.push(`  NA    Job${bb?.bron ? ` [${bb.bron === "terugval" ? "TERUGVAL, vaste regels" : bb.bron}]` : ""}: ${bb ? bb.job.join(" / ") || "(geen bericht)" : "(niet verstuurd)"}`, `        opgeslagen: ${bb?.opgeslagen ?? "-"}${bb && bb.kandidaat !== v.vast[i] ? `  [kreeg: ${bb.kandidaat}]` : ""}`, "");
      }
      regels.push("Direct na de vaste reeks ziet de planner:");
      regels.push("  VOOR:", ...(a?.naReeks?.planner || ["(niet opgeslagen)"]).map((p) => `    ${p}`));
      regels.push("  NA:", ...(b?.naReeks?.planner || ["(niet opgeslagen)"]).map((p) => `    ${p}`), "");
      regels.push(`Uitslag voor: ${a ? `${a.status}${a.fouten.length ? ` (${a.fouten.join("; ")})` : ""}` : "-"}`, `Uitslag na:   ${b ? `${b.status}${b.fouten.length ? ` (${b.fouten.join("; ")})` : ""}` : "-"}`, "");
    }
  }
  return { regels, fouten };
}

if (/job-gesprekstest-vergelijk\.ts$/.test(process.argv[1] || "")) {
  try {
    const [pv, pn] = process.argv.slice(2);
    if (!pv || !pn) throw new Error("Gebruik: npx tsx scripts/job-gesprekstest-vergelijk.ts voor.json na.json");
    const { regels, fouten } = vergelijk(lees(pv), lees(pn));
    console.log([...regels, `Controle: ${fouten.length ? `${fouten.length} probleem(en)` : "beide metingen afgerond, alle vijf vaste reeksen volledig en gelijk, plannerweergave aanwezig"}`, ...fouten.map((f) => `  - ${f}`)].join("\n"));
    process.exit(fouten.length ? 1 : 0);
  } catch (e: any) {
    console.log(`Vergelijking mislukt: ${e?.message || e}`);
    process.exit(1);
  }
}
