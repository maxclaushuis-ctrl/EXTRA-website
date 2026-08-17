/**
 * Unit-tests voor server/emailKolommen.ts
 * Run met:  npx tsx server/emailKolommen.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 * Zelfde opzet als server/redirects.test.ts.
 */
import { kolommenHtml, kolommenTekst, breedtes, KOLOM_MEDIA_CSS } from "./emailKolommen";

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean, extra?: string) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${extra ? `\n      ${extra}` : ""}`); }
}

function eq(label: string, actual: unknown, expected: unknown) {
  const gelijk = JSON.stringify(actual) === JSON.stringify(expected);
  ok(label, gelijk, gelijk ? undefined : `actual: ${JSON.stringify(actual)}  expected: ${JSON.stringify(expected)}`);
}

const basis = { tekstHtml: "Hallo daar", beeldUrl: "https://cdn.example.com/eveline.jpg", beeldAlt: "Eveline" };

console.log("\n— breedtes() —");
eq("half is 50/50", breedtes("half"), [50, 50]);
eq("beeld-klein geeft de tekst meer ruimte", breedtes("beeld-klein"), [65, 35]);
eq("beeld-groot draait dat om", breedtes("beeld-groot"), [35, 65]);
eq("zonder waarde: half", breedtes(undefined as any), [50, 50]);

console.log("\n— kolommenHtml(): de opbouw —");
{
  const html = kolommenHtml(basis);
  ok("geen flexbox of grid — die doen het niet in mail", !html.includes("display:flex") && !html.includes("display:grid"));
  ok("twee kolommen als inline-block", (html.match(/display:inline-block/g) || []).length === 2);
  ok("font-size:0 op de omhulling, anders breekt de tweede kolom af", html.startsWith('<div style="font-size:0'));
  ok("breedte 50% per kolom", (html.match(/width:50%/g) || []).length >= 2);
  ok("de tekst zit erin", html.includes("Hallo daar"));
  ok("de afbeelding zit erin", html.includes("eveline.jpg"));
  ok("alt-tekst meegenomen", html.includes('alt="Eveline"'));
  ok("de afbeelding schaalt mee", html.includes("max-width:100%") && html.includes("height:auto"));
}

console.log("\n— kolommenHtml(): de Outlook-tabel —");
{
  const html = kolommenHtml(basis);
  ok("voorwaardelijke tabel voor Outlook", html.includes("<!--[if mso]>") && html.includes("<![endif]-->"));
  ok("met twee cellen erin", (html.match(/<td width=/g) || []).length === 2);
  ok("role=presentation, zodat schermlezers het niet als datatabel voorlezen", html.includes('role="presentation"'));
  ok("de tabel staat volledig binnen de mso-commentaren",
    !html.replace(/<!--\[if mso\]>[\s\S]*?<!\[endif\]-->/g, "").includes("<table"));
  const klein = kolommenHtml({ ...basis, verhouding: "beeld-klein" });
  ok("de cellen krijgen dezelfde breedtes als de divs", klein.includes('<td width="65%"') && klein.includes('<td width="35%"'));
}

console.log("\n— kolommenHtml(): volgorde van de kolommen —");
{
  const rechts = kolommenHtml({ ...basis, beeldPositie: "rechts" });
  const links = kolommenHtml({ ...basis, beeldPositie: "links" });
  ok("beeld rechts: tekst komt eerst", rechts.indexOf("Hallo daar") < rechts.indexOf("eveline.jpg"));
  ok("beeld links: afbeelding komt eerst", links.indexOf("eveline.jpg") < links.indexOf("Hallo daar"));
  ok("standaard staat het beeld rechts", kolommenHtml(basis).indexOf("Hallo daar") < kolommenHtml(basis).indexOf("eveline.jpg"));
  ok("de tussenruimte staat aan de juiste kant (beeld rechts)", rechts.includes("padding:0 16px 0 0"));
  ok("en klapt om bij beeld links", links.includes("padding:0 0 0 16px"));
  ok("de volgorde in de Outlook-tabel volgt de divs", links.indexOf("[if mso]") < links.indexOf("eveline.jpg"));
}

console.log("\n— kolommenHtml(): verhouding en uitlijning —");
{
  const klein = kolommenHtml({ ...basis, verhouding: "beeld-klein" });
  ok("beeld-klein geeft 65/35", klein.includes("width:65%") && klein.includes("width:35%"));
  const midden = kolommenHtml({ ...basis, verticaal: "midden" });
  ok("verticaal midden", midden.includes("vertical-align:middle") && midden.includes('valign="middle"'));
  const top = kolommenHtml(basis);
  ok("standaard is bovenaan uitlijnen", top.includes("vertical-align:top"));
}

console.log("\n— kolommenHtml(): randgevallen —");
eq("helemaal leeg levert niets op", kolommenHtml({}), "");
{
  const alleenTekst = kolommenHtml({ tekstHtml: "Alleen tekst" });
  ok("zonder afbeelding: gewone alinea, geen halve kolomindeling", !alleenTekst.includes("inline-block") && alleenTekst.includes("Alleen tekst"));
  const alleenBeeld = kolommenHtml({ beeldUrl: "https://cdn.example.com/x.jpg" });
  ok("zonder tekst: alleen de afbeelding", !alleenBeeld.includes("inline-block") && alleenBeeld.includes("x.jpg"));
  const leegBeeld = kolommenHtml({ tekstHtml: "tekst", beeldUrl: "   " });
  ok("lege afbeeldings-URL telt als geen afbeelding", !leegBeeld.includes("<img"));
}

console.log("\n— kolommenHtml(): links en veiligheid —");
{
  const metLink = kolommenHtml({ ...basis, beeldLink: "https://doehetextra.nl/contact" });
  ok("klik-link om de afbeelding", metLink.includes('<a href="https://doehetextra.nl/contact"'));
  const zonderSchema = kolommenHtml({ ...basis, beeldLink: "doehetextra.nl/contact" });
  ok("een URL zonder schema krijgt https", zonderSchema.includes('href="https://doehetextra.nl/contact"'));
  const kwaad = kolommenHtml({ ...basis, beeldLink: "javascript:alert(1)" });
  ok("javascript:-link verdwijnt", !/javascript:/i.test(kwaad));
  ok("en de afbeelding blijft gewoon staan", kwaad.includes("eveline.jpg"));
  const kwaadBeeld = kolommenHtml({ tekstHtml: "t", beeldUrl: "javascript:alert(1)" });
  ok("javascript: als afbeeldings-URL levert geen img op", !kwaadBeeld.includes("<img"));
  const quotes = kolommenHtml({ ...basis, beeldAlt: 'Eve "de" Lien' });
  ok("aanhalingstekens in de alt-tekst breken het attribuut niet", quotes.includes("&quot;") && !quotes.includes('alt="Eve "de"'));
  const mailto = kolommenHtml({ ...basis, beeldLink: "mailto:info@doehetextra.nl" });
  ok("mailto blijft mailto", mailto.includes('href="mailto:info@doehetextra.nl"'));
}

console.log("\n— kolommenHtml(): geüploade afbeeldingen —");
{
  // De bouwer slaat een upload op als data-URL; die moet gewoon werken.
  const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";
  const geupload = kolommenHtml({ tekstHtml: "tekst", beeldUrl: dataUrl });
  ok("een geüploade afbeelding blijft staan", geupload.includes(dataUrl));
  ok("en levert twee kolommen op, geen losse alinea", geupload.includes("display:inline-block"));
  const nepData = kolommenHtml({ tekstHtml: "tekst", beeldUrl: "data:text/html;base64,PHNjcmlwdD4=" });
  ok("een data-URL die geen afbeelding is, wordt geweigerd", !nepData.includes("<img"));
  const dataAlsLink = kolommenHtml({ ...basis, beeldLink: "data:text/html;base64,PHNjcmlwdD4=" });
  ok("data-URL als klik-link wordt geweigerd", !dataAlsLink.includes("<a href"));
}

console.log("\n— kolommenHtml(): de tekst wordt niet aangetast —");
{
  const metOpmaak = kolommenHtml({ ...basis, tekstHtml: 'Kijk op <a href="https://doehetextra.nl">de site</a>.<br/>Groet' });
  ok("links uit de tekst blijven staan", metOpmaak.includes('<a href="https://doehetextra.nl">de site</a>'));
  ok("regeleindes blijven staan", metOpmaak.includes("<br/>"));
  const kleur = kolommenHtml({ ...basis, kleur: "#7c3aed" });
  ok("eigen tekstkleur", kleur.includes("color:#7c3aed"));
}

console.log("\n— stapelen op mobiel —");
ok("er is een media-regel voor de kolommen", KOLOM_MEDIA_CSS.includes(".kolom") && KOLOM_MEDIA_CSS.includes("width:100%"));
ok("en eentje die de tussenruimte weghaalt", KOLOM_MEDIA_CSS.includes(".kolom-binnen"));
ok("de kolommen dragen die class", kolommenHtml(basis).includes('class="kolom"'));
ok("de binnenkant ook", kolommenHtml(basis).includes('class="kolom-binnen"'));

console.log("\n— kolommenTekst() —");
eq("geeft alleen de tekst terug", kolommenTekst("  Hallo  "), "Hallo");
eq("leeg blijft leeg", kolommenTekst(undefined), "");

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
