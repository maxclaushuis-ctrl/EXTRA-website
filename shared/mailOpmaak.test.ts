/**
 * Huistests voor de gedeelde mailopmaak (design 3.0).
 * Draaien zonder database of mailservice: `npm run mailopmaak:test`.
 */

import {
  mailOpmaak, bannerUrl, brancheVanFunctie, brancheVanLocatie, bruinHartje, zonderPaars,
  escapeHtml, alinea, knop, infoBlok, stappen, gegevens, melding, donkerBlok, afsluiting,
  ACCENT, KLEUR, type Branche,
} from "./mailOpmaak";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, conditie: boolean, detail?: string) {
  if (conditie) { geslaagd++; console.log(`  ✓ ${naam}`); }
  else { gefaald++; console.log(`  ✗ ${naam}${detail ? `: ${detail}` : ""}`); }
}

const BRANCHES: Branche[] = ["algemeen", "hotels", "events", "logistiek"];

console.log("brancheVanFunctie");
test("housekeeping is hotels", brancheVanFunctie("housekeeping") === "hotels");
test("horecamedewerker is hotels", brancheVanFunctie("horecamedewerker") === "hotels");
test("chef is hotels", brancheVanFunctie("chef") === "hotels");
test("frontoffice is hotels", brancheVanFunctie("frontoffice") === "hotels");
test("Front Office Medewerker is hotels", brancheVanFunctie("Front Office Medewerker") === "hotels");
test("afwas is hotels", brancheVanFunctie("Afwas") === "hotels");
test("orderpicker is logistiek", brancheVanFunctie("Orderpicker") === "logistiek");
test("magazijnmedewerker is logistiek", brancheVanFunctie("Magazijnmedewerker") === "logistiek");
test("eventmedewerker is events", brancheVanFunctie("Eventmedewerker") === "events");
test("leeg is algemeen", brancheVanFunctie("") === "algemeen");
test("null is algemeen", brancheVanFunctie(null) === "algemeen");
test("onbekend is algemeen", brancheVanFunctie("Boekhouder") === "algemeen");

console.log("brancheVanLocatie");
test("hotel is hotels", brancheVanLocatie("hotel") === "hotels");
test("restaurant is hotels", brancheVanLocatie("restaurant") === "hotels");
test("eventlocatie is events", brancheVanLocatie("eventlocatie") === "events");
test("cateraar is events", brancheVanLocatie("cateraar") === "events");
test("logistiek is logistiek", brancheVanLocatie("logistiek") === "logistiek");
test("anders is algemeen", brancheVanLocatie("anders") === "algemeen");
test("leeg is algemeen", brancheVanLocatie(undefined) === "algemeen");

console.log("mailOpmaak");
for (const b of BRANCHES) {
  const html = mailOpmaak({ branche: b, titel: "Test", voorkop: "Voorkop", kop: "Kop", inhoud: infoBlok(b, "x") + stappen(b, ["een"]) });
  test(`${b}: juiste banner`, html.includes(bannerUrl(b)));
  test(`${b}: accentkleur van het info-blok`, html.includes(`background:${ACCENT[b].vlak}`));
  test(`${b}: bolletje in de accentkleur`, html.includes(`background:${ACCENT[b].stip}`));
}
{
  const algemeen = mailOpmaak({ titel: "T", voorkop: "V", inhoud: stappen("algemeen", ["a"]) });
  test("zonder branche is het algemeen", algemeen.includes(bannerUrl("algemeen")));
  test("algemeen: bolletjes off-white met donkere rand", algemeen.includes(`background:${KLEUR.offwhite};border:1.5px solid ${KLEUR.espresso}`));
  test("algemeen gebruikt geen roze", !algemeen.includes(ACCENT.hotels.stip) && !algemeen.includes(ACCENT.hotels.vlak));
  const hotels = mailOpmaak({ branche: "hotels", titel: "T", inhoud: stappen("hotels", ["a"]) });
  test("hotels: bolletjes zonder rand", !hotels.includes(`border:1.5px solid ${KLEUR.espresso};line-height`));
}
{
  const html = mailOpmaak({ titel: "<b>", kop: "Kop", preheader: "<script>", inhoud: "" });
  test("titel wordt geëscaped", html.includes("<title>&lt;b&gt;</title>"));
  test("preheader wordt geëscaped", !html.includes("<script>") && html.includes("&lt;script&gt;"));
  test("is een volledig document", html.startsWith("<!DOCTYPE html>") && html.trim().endsWith("</html>"));
  test("taal staat erop", html.includes('<html lang="nl">') && mailOpmaak({ titel: "t", inhoud: "", taal: "en" }).includes('<html lang="en">'));
  test("volledige voet heeft de iconen", html.includes("icoon-instagram.png") && html.includes("icoon-mail.png"));
  test("korte voet heeft geen iconen", !mailOpmaak({ titel: "t", inhoud: "", voet: "kort" }).includes("icoon-instagram.png"));
  test("voet noemt het adres", html.includes("Herengracht 372"));
  test("geen paars meer", !/7c3aed|5b2eb5|ede9fe|f5f3ff/i.test(html));
  test("geen svg (Gmail toont dat niet)", !/<svg/i.test(html));
  test("afbeeldingen staan op de site", (html.match(/<img src="([^"]+)"/g) || []).every((m) => m.includes("https://www.doehetextra.nl/email/")));
  test("tabellen zijn gebalanceerd", (html.match(/<table/g) || []).length === (html.match(/<\/table>/g) || []).length);
  test("voetExtra komt in de voet", mailOpmaak({ titel: "t", inhoud: "", voetExtra: "Uitschrijven" }).includes("Uitschrijven"));
  test("na komt erin (trackingpixel)", mailOpmaak({ titel: "t", inhoud: "", na: '<img src="https://x/p.gif">' }).includes("https://x/p.gif"));
}

console.log("Bouwstenen");
test("knop escapet de link", knop("Ga", 'https://x.nl/?a=1&b="2"').includes('href="https://x.nl/?a=1&amp;b=&quot;2&quot;"'));
test("knop vol is donker", knop("Ga", "#").includes(`background:${KLEUR.espresso}`));
test("knop rand is wit", knop("Ga", "#", "rand").includes(`background:${KLEUR.wit}`));
test("alinea klein is kleiner", alinea("x", { klein: true }).includes("font-size:13px"));
test("stappen nummeren vanaf 1", stappen("hotels", ["a", "b", "c"]).includes(">3</span>"));
test("gegevens laten lege waarden weg", !gegevens([["Naam", "Sanne"], ["Leeg", ""], ["Null", null]]).includes("Leeg"));
test("gegevens tonen het label", gegevens([["Naam", "Sanne"]], { label: "Genoteerd" }).includes("Genoteerd"));
test("gegevens escapen het label", gegevens([["<i>", "x"]]).includes("&lt;i&gt;"));
test("melding stop is anders dan let-op", melding("stop", "a") !== melding("let-op", "a"));
test("donker blok gebruikt de accentkleur voor de eerste knop",
  donkerBlok("hotels", "k", "t", [{ tekst: "Bel", href: "tel:1" }]).includes(`background:${ACCENT.hotels.stip}`));
test("donker blok is off-white bij algemeen",
  donkerBlok("algemeen", "k", "t", [{ tekst: "Bel", href: "tel:1" }]).includes(`background:${KLEUR.offwhite};color:${KLEUR.espresso}`));
test("afsluiting heeft het bruine hartje", afsluiting().includes("&#129294;") && afsluiting().includes("Tot snel!"));
test("afsluiting Engels", afsluiting("en").includes("See you soon!"));
test("afsluiting zonder hartje", !afsluiting("nl", { hartje: false }).includes("&#129294;"));
test("escapeHtml", escapeHtml(`<a href="x">'`) === "&lt;a href=&quot;x&quot;&gt;&#39;");

console.log("Oude huisstijl");
test("paars hartje wordt bruin", bruinHartje("Welkom bij EXTRA 💜") === "Welkom bij EXTRA 🤎");
test("meerdere hartjes", bruinHartje("💜💜") === "🤎🤎");
test("ander emoji blijft", bruinHartje("📅 🤝") === "📅 🤝");
test("leeg blijft leeg", bruinHartje("") === "");
test("paarse knop wordt espresso", zonderPaars("#7C3AED", "x") === KLEUR.espresso);
test("lichtpaars vlak wordt off-white", zonderPaars("#f5f3ff", "x") === KLEUR.offwhite);
test("eigen kleur blijft", zonderPaars("#123456", "x") === "#123456");
test("geen kleur geeft de standaard", zonderPaars(undefined, "#abcdef") === "#abcdef");

console.log("Geen gedachtestreepjes");
{
  const html = mailOpmaak({ branche: "hotels", titel: "t", voorkop: "v", kop: "k", inhoud: afsluiting() });
  const zichtbaar = html.replace(/<[^>]+>/g, " ");
  test("de opmaak zelf bevat geen — of –", !/[—–]/.test(zichtbaar));
}

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
