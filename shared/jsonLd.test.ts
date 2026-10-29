/**
 * Housetests voor veiligeJsonLd: `npm run jsonld:test`.
 */

import { veiligeJsonLd } from "./jsonLd";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, conditie: boolean, detail?: string) {
  if (conditie) { geslaagd++; console.log(`  ✓ ${naam}`); }
  else { gefaald++; console.log(`  ✗ ${naam}${detail ? `: ${detail}` : ""}`); }
}

const kwaad = { "@type": "JobPosting", title: "Kok</script><script>alert(1)</script>" };
const uit = veiligeJsonLd(kwaad);
test("geen </script> meer in de uitvoer", !/<\/script/i.test(uit), uit);
test("geen < meer in de uitvoer", !uit.includes("<"), uit);
test("JSON blijft gelijk na parsen", JSON.stringify(JSON.parse(uit)) === JSON.stringify(kwaad));

const tekst = JSON.stringify({ a: "<b>" });
test("werkt ook op een JSON-string", veiligeJsonLd(tekst) === '{"a":"\\u003cb>"}', veiligeJsonLd(tekst));
test("normale data blijft ongewijzigd", veiligeJsonLd({ naam: "EXTRA" }) === '{"naam":"EXTRA"}');

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
