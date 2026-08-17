/**
 * Unit-tests voor server/contentFragment.ts
 * Run met:  npx tsx server/contentFragment.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 * Zelfde opzet als server/redirects.test.ts.
 */
import { blogFragment, vacatureFragment, schoonHtml, lijstFragment } from "./contentFragment";

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean, extra?: string) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${extra ? `\n      ${extra}` : ""}`); }
}

console.log("\n— schoonHtml(): gevaarlijke inhoud eruit —");
ok("script met inhoud verdwijnt", !schoonHtml('<p>a</p><script>alert(1)</script>').includes("alert"));
ok("losse script-tag verdwijnt", !/<script/i.test(schoonHtml('<script src="x.js">')));
ok("iframe verdwijnt", !/<iframe/i.test(schoonHtml('<iframe src="https://kwaad.nl"></iframe>')));
ok("onerror-handler verdwijnt", !/onerror/i.test(schoonHtml('<img src=x onerror="alert(1)">')));
ok("onclick zonder aanhalingstekens verdwijnt", !/onclick/i.test(schoonHtml('<a onclick=alert(1)>x</a>')));
ok("javascript:-link onschadelijk", !/javascript:/i.test(schoonHtml('<a href="javascript:alert(1)">x</a>')));

console.log("\n— schoonHtml(): gewone opmaak blijft —");
const rijk = '<h2>Kop</h2><p>Tekst met <strong>nadruk</strong> en een <a href="/vacatures">link</a>.</p>'
  + '<ul><li>punt</li></ul><table><tr><td>cel</td></tr></table><img src="/images/x.webp" alt="x">';
const schoon = schoonHtml(rijk);
for (const stuk of ["<h2>", "<strong>", 'href="/vacatures"', "<ul>", "<table>", "<img", 'alt="x"']) {
  ok(`blijft staan: ${stuk}`, schoon.includes(stuk));
}

console.log("\n— blogFragment() —");
const blog = blogFragment({
  title: "Housekeeping personeel inhuren",
  slug: "housekeeping-personeel-inhuren",
  metaDescription: "Uitzendbureau, schoonmaakbedrijf of eigen team?",
  content: "<p>Er zijn drie manieren.</p><h2>De drie modellen</h2>",
  author: "EXTRA Redactie",
  category: "Housekeeping",
  readTime: "7 min",
  publishedAt: new Date("2026-08-13T10:00:00Z"),
});
ok("exact één <h1>", (blog.match(/<h1[\s>]/g) || []).length === 1);
ok("titel staat in de h1", blog.includes("<h1>Housekeeping personeel inhuren</h1>"));
ok("meta-omschrijving als intro", blog.includes("Uitzendbureau, schoonmaakbedrijf of eigen team?"));
ok("artikelinhoud zit erin", blog.includes("Er zijn drie manieren."));
ok("kop uit de inhoud blijft een h2", blog.includes("<h2>De drie modellen</h2>"));
ok("auteur, categorie en leestijd", blog.includes("EXTRA Redactie") && blog.includes("Housekeeping") && blog.includes("7 min"));
ok("publicatiedatum als <time>", blog.includes('<time datetime="2026-08-13">'));
ok("kruimelpad naar /blog", blog.includes('href="/blog"'));
ok("navigatie eronder", blog.includes('href="/personeelsaanvraag"') && blog.includes('href="/aanmelden"'));
ok("geen lege body", blog.length > 300);

console.log("\n— blogFragment(): randgevallen —");
const kaal = blogFragment({ title: "Zonder alles", slug: "x" });
ok("zonder inhoud nog steeds een h1", kaal.includes("<h1>Zonder alles</h1>"));
ok("zonder inhoud geen 'undefined' in de HTML", !/undefined|null/.test(kaal), kaal);
const quotes = blogFragment({ title: 'Titel met "aanhalingstekens" & <tags>', slug: "y" });
ok("titel wordt ge-escaped", quotes.includes("&quot;") && quotes.includes("&lt;tags&gt;") && quotes.includes("&amp;"));
const nieuwspad = blogFragment({ title: "T", slug: "s" }, "/nieuws");
ok("nieuws-variant verwijst naar /nieuws", nieuwspad.includes('href="/nieuws"'));

console.log("\n— vacatureFragment() —");
const vac = vacatureFragment({
  title: "Zelfstandig werkend kok",
  slug: "zelfstandig-werkend-kok-amsterdam-pulitzer",
  location: "Amsterdam",
  serviceType: "Oproep",
  shortDescription: "Voor Pulitzer Amsterdam zoeken we een kok.",
  introductionText: "<p>Je werkt in een brigade van acht.</p>",
  responsibilities: ["Mise en place", "Uitserveren"],
  requirements: ["Twee jaar ervaring"],
  offer: ["Dagbetaling"],
  ctaText: "Solliciteer direct",
});
ok("exact één <h1>", (vac.match(/<h1[\s>]/g) || []).length === 1);
ok("locatie en dienstverband", vac.includes("Amsterdam") && vac.includes("Oproep"));
ok("korte omschrijving", vac.includes("Voor Pulitzer Amsterdam zoeken we een kok."));
ok("taken als lijst", vac.includes("<li>Mise en place</li>") && vac.includes("<li>Uitserveren</li>"));
ok("eisen en aanbod", vac.includes("Twee jaar ervaring") && vac.includes("Dagbetaling"));
ok("sollicitatie-CTA", vac.includes("Solliciteer direct") && vac.includes('href="/aanmelden"'));
const vacKaal = vacatureFragment({ title: "Kok", slug: "kok" });
ok("lege arrays leveren geen lege lijsten op", !vacKaal.includes("<ul></ul>"));
ok("zonder velden geen 'undefined'", !/undefined|null/.test(vacKaal), vacKaal);
ok("standaard-CTA valt terug", vacKaal.includes("Solliciteer op deze vacature"));

console.log("\n— lijstFragment(): de overzichtspagina's —");
{
  const vac = lijstFragment("/vacatures", "Alle vacatures", [
    { slug: "kok-amsterdam-marriott", title: "Kok Amsterdam", bij: "Amsterdam" },
    { slug: "housekeeping-scheveningen-kurhaus-fulltime", title: "Housekeeping Scheveningen", bij: "Scheveningen" },
  ]);
  ok("elke vacature krijgt een link", (vac.match(/<a href="\/vacatures\//g) || []).length === 2);
  ok("de slug staat in de href", vac.includes('href="/vacatures/kok-amsterdam-marriott"'));
  ok("de titel is de anchortekst", vac.includes("Kok Amsterdam"));
  ok("de locatie staat erbij", vac.includes("Amsterdam"));
  ok("het is een nav met een kop", vac.includes("<nav") && vac.includes("<h2>Alle vacatures</h2>"));
}
{
  const blog = lijstFragment("/blog", "Alle artikelen", [
    { slug: "zzp-inhuren-horeca", title: "Zzp'ers inhuren in de horeca" },
  ]);
  ok("blogartikel krijgt een link", blog.includes('href="/blog/zzp-inhuren-horeca"'));
  ok("zonder tweede regel geen liggend streepje", !blog.includes("—"));
}
{
  ok("lege lijst levert niets op", lijstFragment("/blog", "Alle artikelen", []) === "");
  ok("null-lijst crasht niet", lijstFragment("/blog", "Alle artikelen", null as any) === "");
  const rommel = lijstFragment("/blog", "Alle artikelen", [
    { slug: "", title: "Zonder slug" } as any,
    { slug: "wel-goed", title: "Wel goed" },
  ]);
  ok("een item zonder slug valt eruit", (rommel.match(/<li>/g) || []).length === 1);
  const raar = lijstFragment("/blog", "Alle artikelen", [{ slug: "a b&c", title: 'Titel met <tags> & "quotes"' }]);
  ok("slug wordt ge-encodeerd in de URL", raar.includes("a%20b%26c"));
  ok("titel wordt ge-escaped", raar.includes("&lt;tags&gt;") && raar.includes("&quot;"));
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
