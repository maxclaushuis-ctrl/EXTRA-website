/**
 * Huistests voor shared/vacatureInvoer.ts en de vacatures in content/vacatures/.
 * Draaien: npm run vacatureinvoer:test
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { controleerVacature, dubbeleMeta, type VacatureInvoer } from "./vacatureInvoer";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean, detail?: string) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${detail ? `: ${detail}` : ""}`); }
}

const goed: VacatureInvoer = {
  title: "Parttime medewerker Voorbeeld", slug: "parttime-medewerker-voorbeeld", functionType: "Bediening", serviceType: "Parttime",
  location: "Amsterdam", region: "Amsterdam", workplace: "Restaurant", salaryMin: "18,00",
  focusKeyword: "vacature voorbeeld", metaTitle: "Vacature Voorbeeld: parttime, €18 per uur",
  metaDescription: "Parttime werken bij Voorbeeld in Amsterdam: €18 all-in per uur, toeslag na 22:00 en de dag erna uitbetaald. Solliciteer via WhatsApp.",
  canonicalUrl: "https://www.doehetextra.nl/vacatures/parttime-medewerker-voorbeeld",
  shortDescription: "Kort.", introductionText: "Voor de vacature Voorbeeld zoeken we mensen.",
  responsibilities: ["a"], requirements: ["b"], offer: ["c: d"], faqItems: JSON.stringify([{ q: "v", a: "a" }]),
};
const fout = (d: Partial<VacatureInvoer>) => controleerVacature({ ...goed, ...d }, goed.slug).fouten;

test("een complete vacature is goed", fout({}).length === 0, fout({}).join("; "));
test("slug moet gelijk zijn aan de bestandsnaam", controleerVacature(goed, "iets-anders").fouten.some((f) => f.includes("bestandsnaam")));
test("slug alleen kleine letters en koppeltekens", fout({ slug: "Parttime_Voorbeeld" }).some((f) => f.includes("kleine letters")));
test("canonical moet bij de slug passen", fout({ canonicalUrl: "https://www.doehetextra.nl/vacatures/ander" }).length > 0);
test("nooit een loon van nul of een placeholder", fout({ salaryMin: "0" }).length > 0 && fout({ salaryMin: "n.t.b." }).length > 0);
test("metaTitle hooguit 60 tekens", fout({ metaTitle: "x".repeat(61) }).some((f) => f.includes("metaTitle")));
test("metaDescription tussen 110 en 160 tekens", fout({ metaDescription: "te kort" }).length > 0 && fout({ metaDescription: "x".repeat(161) }).length > 0);
test("onbekend dienstverband wordt geweigerd", fout({ serviceType: "Flex" }).length > 0);
test("lege lijsten worden geweigerd", fout({ offer: [] }).length > 0);
test("faq moet geldige JSON met q en a zijn", fout({ faqItems: "{" }).length > 0 && fout({ faqItems: JSON.stringify([{ q: "x" }]) }).length > 0);
test("geen gedachtestreepje in de tekst", fout({ shortDescription: "Werk – nu" }).some((f) => f.includes("streepje")));
test("dubbele meta wordt gevonden", dubbeleMeta([goed, { ...goed, slug: "twee" }]).length === 2);

// De echte vacatures in content/vacatures/
const map = join(process.cwd(), "content", "vacatures");
const bestanden = readdirSync(map).filter((f) => f.endsWith(".json"));
const alle = bestanden.map((f) => ({ naam: f.replace(/\.json$/, ""), d: JSON.parse(readFileSync(join(map, f), "utf8")) as VacatureInvoer }));
for (const { naam, d } of alle) {
  const r = controleerVacature(d, naam);
  test(`${naam}: voldoet aan de regels`, r.fouten.length === 0, r.fouten.join("; "));
  test(`${naam}: geen waarschuwingen`, r.waarschuwingen.length === 0, r.waarschuwingen.join("; "));
}
test("content: meta title en description zijn uniek", dubbeleMeta(alle.map((a) => a.d)).length === 0, dubbeleMeta(alle.map((a) => a.d)).join("; "));
const febo = alle.filter((a) => a.naam.includes("febo"));
test("FEBO: vier vestigingen", febo.length === 4);
test("FEBO: €18 all-in, minimaal 16 uur, 18 jaar, 04:30, 15% na 22:00", febo.every(({ d }) =>
  d.salaryMin === "18,00" && d.introductionText.includes("16 uur") && d.introductionText.includes("04:30") &&
  d.requirements.some((r) => r.includes("18 jaar")) && d.offer.some((o) => o.includes("15%") && o.includes("22:00"))));
test("FEBO: werkgever is EXTRA, niet FEBO", febo.every(({ d }) => (d.workEnvironment || "").includes("loondienst bij EXTRA")));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
