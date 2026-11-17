/**
 * Huistests voor shared/blogFaq.ts. Draaien: npm run blogfaq:test
 */
import { readFileSync, readdirSync } from "fs";
import { faqUitArtikel, faqPageJsonLd } from "./blogFaq";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}`); }
}

const art = `<p>Intro</p><h2>Iets anders</h2><h3>Geen vraag</h3><p>Hoort er niet bij.</p>
<h2>Veelgestelde vragen</h2>
<h3>Kost spoed meer?</h3>
<p>Alleen na 15:00 uur. Zie <a href="/x">de uitleg</a> &amp; meer.</p>
<h3>Wie geeft leiding?</h3>
<p>Jouw chef.</p>
<p>Wil je meer weten? <a href="/personeelsaanvraag">Vraag aan</a>.</p>`;
const f = faqUitArtikel(art);
test("vindt alleen de vragen onder de kop Veelgestelde vragen", f.length === 2 && f[0][0] === "Kost spoed meer?");
test("antwoord zonder HTML en met leesbare tekens", f[0][1] === "Alleen na 15:00 uur. Zie de uitleg & meer.");
test("de afsluitende alinea hoort niet bij het laatste antwoord", f[1][1] === "Jouw chef.");
test("stopt bij de volgende h2", faqUitArtikel(art + "<h2>Bronnen</h2><h3>Nog een kop</h3><p>Tekst</p>").length === 2);
test("geen kop, geen vragen", faqUitArtikel("<h2>Vijf vragen</h2><h3>A?</h3><p>B</p>").length === 0);
test("leeg of ontbrekend artikel", faqUitArtikel("").length === 0 && faqUitArtikel(null).length === 0);
test("kop met toevoeging telt ook", faqUitArtikel("<h2>Veelgestelde vragen over koks</h2><h3>A?</h3><p>B</p>").length === 1);
test("schema pas vanaf twee vragen", faqPageJsonLd([["a", "b"]]) === undefined && !!faqPageJsonLd(f));
const ld = JSON.parse(faqPageJsonLd(f)!);
test("schema heeft type en vragen", ld["@type"] === "FAQPage" && ld.mainEntity.length === 2 && ld.mainEntity[1].acceptedAnswer.text === "Jouw chef.");
test("kleiner-dan-teken kan het script niet afsluiten", !faqPageJsonLd([["a", "</script>"], ["b", "c"]])!.includes("</script>"));

// De artikelen in content/blog volgen de conventie.
const map = new URL("../content/blog/", import.meta.url);
for (const naam of readdirSync(map).filter((n) => n.endsWith(".html"))) {
  const html = readFileSync(new URL(naam, map), "utf-8");
  if (!/<h2[^>]*>\s*Veelgestelde vragen/i.test(html)) continue;
  const items = faqUitArtikel(html);
  test(`${naam}: minstens twee vragen met antwoord (${items.length})`, items.length >= 2 && items.every(([q, a]) => q.length > 5 && a.length > 10));
}

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
