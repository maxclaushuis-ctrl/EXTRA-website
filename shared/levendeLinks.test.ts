/**
 * Housetests voor kapotte vacature- en bloglinks: `npm run levendelinks:test`.
 */

import { buigDodeLinksOm, levendPad, lopendeVacatures, vacatureVerlopen } from "./levendeLinks";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, conditie: boolean, detail?: string) {
  if (conditie) { geslaagd++; console.log(`  ✓ ${naam}`); }
  else { gefaald++; console.log(`  ✗ ${naam}${detail ? `: ${detail}` : ""}`); }
}

const nu = new Date("2026-10-29T12:00:00Z");
const oud = { slug: "kok-oud", publishedAt: "2026-07-01T09:00:00Z" };
const nieuw = { slug: "kok-nieuw", publishedAt: "2026-10-01T09:00:00Z" };
test("vacature van 1 juli is op 29 oktober verlopen", vacatureVerlopen(oud, nu));
test("vacature van 1 oktober is nog geldig", !vacatureVerlopen(nieuw, nu));
test("lopendeVacatures houdt alleen de geldige over", lopendeVacatures([oud, nieuw], nu).map((v) => v.slug).join() === "kok-nieuw");

const levend = { vacatures: new Set(["kok-nieuw"]), blogs: new Set(["zzp-inhuren-horeca"]) };
const html = [
  '<a href="/vacatures/kok-oud">Kok</a>',
  '<a href="/vacatures/kok-nieuw">Kok</a>',
  '<a href="https://www.doehetextra.nl/vacatures/kok-oud">Kok</a>',
  '<a href="/blog/gastervaring-hotel-verbeteren">Gast</a>',
  '<a href="/blog/zzp-inhuren-horeca#d2">ZZP</a>',
  '<a href="/vacatures">Alle</a>',
  '<a href="/hotelpersoneel-inhuren">Hotels</a>',
].join("");
const uit = buigDodeLinksOm(html, levend);
test("verlopen vacature gaat naar /vacatures", uit.includes('<a href="/vacatures">Kok</a>'), uit);
test("geldige vacature blijft staan", uit.includes('href="/vacatures/kok-nieuw"'));
test("absolute link wordt ook omgebogen", uit.includes('href="https://www.doehetextra.nl/vacatures">Kok'), uit);
test("onbekend artikel gaat naar /blog", uit.includes('<a href="/blog">Gast</a>'), uit);
test("bestaand artikel met anker blijft staan", uit.includes('href="/blog/zzp-inhuren-horeca#d2"'));
test("overige links blijven ongemoeid", uit.includes('href="/vacatures">Alle') && uit.includes('href="/hotelpersoneel-inhuren"'));
test("onbekende lijst (null) verandert niets", buigDodeLinksOm(html, { vacatures: null, blogs: null }) === html);
test("tekst blijft staan", uit.includes(">Gast</a>") && uit.includes(">ZZP</a>"));

test("levendPad buigt verlopen vacature om", levendPad("/vacatures/kok-oud", levend) === "/vacatures");
test("levendPad laat geldige staan", levendPad("/vacatures/kok-nieuw", levend) === "/vacatures/kok-nieuw");
test("levendPad laat andere paden staan", levendPad("/blog", levend) === "/blog");

const lijst = `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", itemListElement: [
  { "@type": "ListItem", position: 1, name: "Oud", url: "https://www.doehetextra.nl/vacatures/kok-oud" },
  { "@type": "ListItem", position: 2, name: "Nieuw", url: "https://www.doehetextra.nl/vacatures/kok-nieuw" },
] })}</script>`;
const lijstUit = buigDodeLinksOm(lijst, levend);
const geparsed = JSON.parse(lijstUit.replace(/^<script[^>]*>|<\/script>$/g, ""));
test("ItemList houdt alleen de geldige vacature over", geparsed.itemListElement.length === 1 && geparsed.itemListElement[0].name === "Nieuw", lijstUit);
test("positie wordt opnieuw genummerd", geparsed.itemListElement[0].position === 1);
test("ItemList met alleen geldige items blijft letterlijk gelijk", buigDodeLinksOm(lijst, { vacatures: new Set(["kok-oud", "kok-nieuw"]), blogs: null }) === lijst);

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
