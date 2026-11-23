/**
 * Huistest voor kiesServerHtml (client/src/lib/serverHtml.ts): de inhoud van de
 * server blijft alleen staan op het pad waarop de bezoeker binnenkwam.
 * Draaien: npx tsx shared/serverHtml.test.ts
 */
import { kiesServerHtml } from "../client/src/lib/serverHtml";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`  ✓ ${naam}`); } else { gefaald++; console.log(`  ✗ ${naam}`); }
}

const html = '<div class="d3">inhoud</div>';
test("zelfde pad: inhoud van de server", kiesServerHtml("/hotels", "/hotels", html) === html);
test("ander pad: gewoon laadscherm", kiesServerHtml("/hotels", "/contact", "") === "" && kiesServerHtml("/hotels", "/contact", html) === "");
test("geen inhoud van de server: gewoon laadscherm", kiesServerHtml("/", "/", "") === "");
test("homepage", kiesServerHtml("/", "/", html) === html);

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
