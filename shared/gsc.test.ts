/**
 * Huistests voor de Search Console-logica. Draaien zonder netwerk of database:
 * `npm run gsc:test`.
 */
import { datumBereik, kiesSite, leesPeriode, padVan, verschil, positieKlasse, kansen, cijfers, ENGELS_REGEX } from "./gsc";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, conditie: boolean, detail?: unknown) {
  if (conditie) { geslaagd++; console.log(`  ✓ ${naam}`); }
  else { gefaald++; console.log(`  ✗ ${naam}`, detail ?? ""); }
}

console.log("Periode en datums");
test("onbekende periode wordt 28", leesPeriode("abc") === "28" && leesPeriode(undefined) === "28");
test("geldige periode blijft", leesPeriode("7") === "7" && leesPeriode("alles") === "alles");
const nu = new Date("2026-11-03T10:00:00Z");
const b28 = datumBereik("28", nu);
test("28 dagen eindigt twee dagen terug", b28.eind === "2026-11-01", b28);
test("28 dagen begint 27 dagen eerder", b28.start === "2026-10-05", b28);
test("vorige periode sluit aan", b28.vorigeEind === "2026-10-04" && b28.vorigeStart === "2026-09-07", b28);
const b7 = datumBereik("7", nu);
test("7 dagen", b7.start === "2026-10-26" && b7.eind === "2026-11-01" && b7.vorigeStart === "2026-10-19" && b7.vorigeEind === "2026-10-25", b7);
const ba = datumBereik("alles", nu);
test("alles heeft geen vergelijking", ba.vorigeStart === null && ba.vorigeEind === null);
test("alles gaat zestien maanden terug", ba.start === "2025-07-04", ba);

console.log("Property kiezen");
test("domein-property heeft voorkeur", kiesSite([{ siteUrl: "https://www.doehetextra.nl/", permissionLevel: "siteRestrictedUser" }, { siteUrl: "sc-domain:doehetextra.nl", permissionLevel: "siteRestrictedUser" }]) === "sc-domain:doehetextra.nl");
test("anders https met www", kiesSite([{ siteUrl: "http://doehetextra.nl/" }, { siteUrl: "https://www.doehetextra.nl/" }]) === "https://www.doehetextra.nl/");
test("niet-geverifieerd telt niet", kiesSite([{ siteUrl: "sc-domain:doehetextra.nl", permissionLevel: "siteUnverifiedUser" }]) === null);
test("andere sites tellen niet", kiesSite([{ siteUrl: "https://voorbeeld.nl/" }]) === null);
test("lege lijst", kiesSite([]) === null && kiesSite(undefined) === null);

console.log("Engelse pagina's");
const re = new RegExp(ENGELS_REGEX);
test("/en telt", re.test("https://www.doehetextra.nl/en"));
test("/en/hotel-staffing telt", re.test("https://www.doehetextra.nl/en/hotel-staffing-amsterdam"));
test("/energie telt niet", !re.test("https://www.doehetextra.nl/energie"));
test("homepage telt niet", !re.test("https://www.doehetextra.nl/"));

console.log("Opmaak en vergelijken");
test("pad van url", padVan("https://www.doehetextra.nl/dagbetaling") === "/dagbetaling" && padVan("https://www.doehetextra.nl") === "/");
test("verschil", Math.round(verschil(112, 100)!) === 12 && verschil(5, 0) === null && verschil(5, null) === null);
test("positieklassen", positieKlasse(1.2) === "top" && positieKlasse(5.7) === "top" && positieKlasse(6.9) === "pagina1" && positieKlasse(20) === "pagina1" && positieKlasse(24.5) === "ver");
test("cijfers zonder rij zijn nul", JSON.stringify(cijfers(undefined)) === JSON.stringify({ klikken: 0, vertoningen: 0, ctr: 0, positie: 0 }));

console.log("Kansen");
const k = kansen([
  { keys: ["horeca uitzendbureau amsterdam", "https://www.doehetextra.nl/horeca-personeel-inhuren"], clicks: 48, impressions: 3880, position: 8.4 },
  { keys: ["horeca uitzendbureau amsterdam", "https://www.doehetextra.nl/"], clicks: 3, impressions: 400, position: 15 },
  { keys: ["extra uitzendbureau", "https://www.doehetextra.nl/"], clicks: 214, impressions: 1020, position: 1.2 },
  { keys: ["uitzendbureau amsterdam", "https://www.doehetextra.nl/"], clicks: 31, impressions: 6210, position: 12.6 },
  { keys: ["horeca vacatures amsterdam", "https://www.doehetextra.nl/horeca-vacatures-amsterdam"], clicks: 22, impressions: 3110, position: 24.5 },
  { keys: ["zeldzaam", "https://www.doehetextra.nl/x"], clicks: 0, impressions: 10, position: 9 },
]);
test("alleen positie 8 tot 20 met genoeg vertoningen", k.length === 2, k);
test("gesorteerd op vertoningen", k[0]?.zoekwoord === "uitzendbureau amsterdam", k);
test("per zoekwoord de pagina met de meeste vertoningen", k[1]?.pad === "/horeca-personeel-inhuren", k);

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
