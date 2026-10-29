/**
 * Housetests voor de pitchdeck-tracker: `npm run pitchdecks:test`.
 */

import { apparaatVan, isCode, isDeck, kijktijd, leesPing, leesStatus, moetMailen, pitchdeckGeopendMail } from "./pitchdecks";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, conditie: boolean, detail?: string) {
  if (conditie) { geslaagd++; console.log(`  ✓ ${naam}`); }
  else { gefaald++; console.log(`  ✗ ${naam}${detail ? `: ${detail}` : ""}`); }
}

test("eg is een deck", isDeck("eg"));
test("onbekend deck wordt geweigerd", !isDeck("../etc") && !isDeck(undefined));
test("geldige code", isCode("7f3a9cb21e"));
test("code met hoofdletters of te kort wordt geweigerd", !isCode("7F3A9CB21E") && !isCode("abc") && !isCode("7f3a9cb21e<"));

test("iPhone herkend", apparaatVan("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile") === "iPhone");
test("iPad herkend", apparaatVan("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)") === "iPad");
test("Android-telefoon herkend", apparaatVan("Mozilla/5.0 (Linux; Android 14) Mobile Safari") === "Android-telefoon");
test("Mac herkend", apparaatVan("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)") === "Mac");
test("Windows herkend", apparaatVan("Mozilla/5.0 (Windows NT 10.0; Win64; x64)") === "Windows");
test("lege user-agent", apparaatVan(undefined) === "Onbekend");

const sleutel = "0123456789abcdef0123456789abcdef";
test("ping wordt gelezen", JSON.stringify(leesPing({ id: 5, sleutel, sec: 90.7, slide: 4 })) === JSON.stringify({ id: 5, sleutel, sec: 90, slide: 4 }));
test("ping zonder geldige sleutel wordt geweigerd", leesPing({ id: 5, sleutel: "x", sec: 1 }) === null);
test("ping met negatieve en enorme waarden wordt begrensd", (() => { const p = leesPing({ id: 5, sleutel, sec: 1e12, slide: -3 }); return !!p && p.sec === 21600 && p.slide === 0; })());

test("niet geopend", leesStatus(0, 12, 0) === "niet");
test("deels gelezen", leesStatus(5, 12, 1) === "deels");
test("helemaal gelezen", leesStatus(12, 12, 2) === "helemaal");
test("kijktijd 6:40", kijktijd(400) === "6:40");
test("kijktijd 0:05", kijktijd(5) === "0:05");

const nu = new Date("2026-11-02T08:14:00Z");
test("eerste opening geeft een mail", moetMailen(null, nu));
test("binnen 30 minuten geen tweede mail", !moetMailen(new Date("2026-11-02T08:00:00Z"), nu));
test("na een uur weer wel", moetMailen(new Date("2026-11-02T07:00:00Z"), nu));

const mail = pitchdeckGeopendMail({ deck: "eg", ontvanger: "Sanne <b>Jansen</b>", bedrijf: "EG Group", apparaat: "iPhone", geopendOp: nu, keer: 3 }, "https://www.doehetextra.nl/dashboard");
test("onderwerp noemt ontvanger en deck", mail.subject.includes("opent nu de pitchdeck van EG Group"), mail.subject);
test("naam wordt ontsmet in de html", !mail.html.includes("<b>Jansen</b>") && mail.html.includes("&lt;b&gt;"));
test("tijd in Amsterdamse tijd", mail.text.includes("09:14"), mail.text);
test("keer geopend in de mail", mail.html.includes("3e keer"));
const zonder = pitchdeckGeopendMail({ deck: "csu", ontvanger: null, bedrijf: null, apparaat: "Mac", geopendOp: nu, keer: 1 }, "https://x");
test("mail zonder persoonlijke link", zonder.subject === "De pitchdeck van CSU wordt nu bekeken", zonder.subject);
test("geen gedachtestreepje in de mailtekst", !/[–—]/.test(mail.html + mail.text + zonder.html));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
