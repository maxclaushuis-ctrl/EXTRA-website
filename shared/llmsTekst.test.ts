/**
 * Huistests voor shared/llmsTekst.ts. Draaien: npm run llms:test
 */
import { readFileSync } from "fs";
import { engelsePaden, fragmentNaarTekst } from "./llmsTekst";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}`); }
}

const html = `<header class="hdr"><a href="/">EXTRA</a><nav>Ik zoek extra personeel</nav></header>
<main id="inhoud"><section><h1>Tijdelijk personeel</h1><nav aria-label="Kruimelpad">Home / Personeel</nav>
<p>Betaal per uur &amp; schaal op.</p><svg><text>HET UITZENDBUREAU</text></svg>
<form><label>Bedrijfsnaam</label><button>Bel mij terug</button></form></section></main>
<footer class="ftr">Herengracht 372</footer><script type="application/ld+json">{"a":1}</script>`;
const t = fragmentNaarTekst(html);
test("houdt de inhoud", t.includes("Tijdelijk personeel") && t.includes("Betaal per uur & schaal op."));
test("menu en voettekst zijn weg", !t.includes("Ik zoek extra personeel") && !t.includes("Herengracht"));
test("kruimelpad, formulier, icoontekst en schema zijn weg", !t.includes("Home / Personeel") && !t.includes("Bedrijfsnaam") && !t.includes("HET UITZENDBUREAU") && !t.includes('"a"'));
test("zonder main blijft de tekst over", fragmentNaarTekst("<div><p>Losse tekst</p><footer>voet</footer></div>") === "Losse tekst");

const echt = fragmentNaarTekst(readFileSync(new URL("../client/public/prerender/tijdelijk-horeca-personeel.html", import.meta.url), "utf-8"));
test("echt fragment: inhoud blijft", echt.includes("Voor welke periodes kun") && echt.length > 2000);
test("echt fragment: geen menu of voettekst", !echt.includes("Ik zoek extra werk") && !echt.includes("Privacybeleid") && !echt.includes("Algemene voorwaarden"));

const paden = ["/", "/en", "/en/hospitality-staff-amsterdam", "/en/kitchen-staff", "/en/privacy-policy", "/en/terms-and-conditions", "/en/cookie-policy", "/enquete"];
const en = engelsePaden(["/en", "/en/hospitality-staff-amsterdam", "/en/bestaat-niet"], paden);
test("vaste volgorde eerst, daarna de rest", en.join(",") === "/en,/en/hospitality-staff-amsterdam,/en/kitchen-staff");
test("geen beleidspagina's en geen pad dat alleen op en lijkt", !en.includes("/en/privacy-policy") && !en.includes("/enquete"));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
