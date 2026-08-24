/**
 * Housetests voor validatie en mailteksten rond binnenkomende aanvragen.
 * Draaien zonder database of mailservice: `npm run aanvraagmails:test`.
 */

import {
  escapeHtml,
  tekstNaarHtml,
  valideerContactBericht,
  contactBerichtInternMail,
  contactBerichtBevestigingMail,
  aanvraagBevestigingMail,
  TELEFOON,
  ADRES,
} from "./aanvraagMails";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, conditie: boolean, detail?: string) {
  if (conditie) { geslaagd++; console.log(`  ✓ ${naam}`); }
  else { gefaald++; console.log(`  ✗ ${naam}${detail ? ` — ${detail}` : ""}`); }
}

const geldig = { naam: "Sanne de Vries", email: "sanne@hotel.nl", bericht: "Wij zoeken housekeeping voor komend weekend." };

console.log("escapeHtml");
test("escapet <", escapeHtml("<script>") === "&lt;script&gt;");
test("escapet &", escapeHtml("Fish & Chips") === "Fish &amp; Chips");
test("escapet aanhalingstekens", escapeHtml(`"x" 'y'`) === "&quot;x&quot; &#39;y&#39;");
test("null wordt lege string", escapeHtml(null) === "");
test("undefined wordt lege string", escapeHtml(undefined) === "");
test("getal blijft leesbaar", escapeHtml(42) === "42");

console.log("tekstNaarHtml");
test("regeleindes worden <br>", tekstNaarHtml("een\ntwee") === "een<br>twee");
test("windows-regeleindes ook", tekstNaarHtml("een\r\ntwee") === "een<br>twee");
test("escapet vóór het omzetten", tekstNaarHtml("<b>\nx") === "&lt;b&gt;<br>x");

console.log("valideerContactBericht");
{
  const r = valideerContactBericht(geldig);
  test("geldig bericht komt erdoor", r.ok && Object.keys(r.fouten).length === 0);
  test("waarden komen terug", r.waarden.naam === "Sanne de Vries" && r.waarden.email === "sanne@hotel.nl");
}
test("lege invoer faalt op drie velden", (() => {
  const r = valideerContactBericht({});
  return !r.ok && Object.keys(r.fouten).length === 3;
})());
test("naam van één teken faalt", !valideerContactBericht({ ...geldig, naam: "S" }).ok);
test("naam wordt getrimd", valideerContactBericht({ ...geldig, naam: "  Sanne  " }).waarden.naam === "Sanne");
test("alleen spaties als naam faalt", !valideerContactBericht({ ...geldig, naam: "    " }).ok);
test("adres zonder @ faalt", !valideerContactBericht({ ...geldig, email: "sannehotel.nl" }).ok);
test("adres zonder punt faalt", !valideerContactBericht({ ...geldig, email: "sanne@hotel" }).ok);
test("adres met spatie faalt", !valideerContactBericht({ ...geldig, email: "san ne@hotel.nl" }).ok);
test("adres met subdomein mag", valideerContactBericht({ ...geldig, email: "s@mail.hotel.co.uk" }).ok);
test("adres met plus mag", valideerContactBericht({ ...geldig, email: "sanne+werk@hotel.nl" }).ok);
test("kort bericht faalt", !valideerContactBericht({ ...geldig, bericht: "hoi" }).ok);
test("bericht van 5001 tekens faalt", !valideerContactBericht({ ...geldig, bericht: "a".repeat(5001) }).ok);
test("bericht van 5000 tekens mag", valideerContactBericht({ ...geldig, bericht: "a".repeat(5000) }).ok);
test("naam van 121 tekens faalt", !valideerContactBericht({ ...geldig, naam: "a".repeat(121) }).ok);
test("niet-tekstvelden falen netjes", (() => {
  const r = valideerContactBericht({ naam: 42, email: {}, bericht: [] });
  return !r.ok && Object.keys(r.fouten).length === 3;
})());
test("foutmeldingen zijn Nederlands en concreet", (() => {
  const f = valideerContactBericht({}).fouten;
  return f.naam.includes("naam") && f.email.includes("e-mailadres") && f.bericht.length > 10;
})());

console.log("contactBerichtInternMail");
{
  const m = contactBerichtInternMail(geldig);
  test("onderwerp bevat de naam", m.subject.includes("Sanne de Vries"));
  test("html bevat het e-mailadres", m.html.includes("sanne@hotel.nl"));
  test("html bevat het bericht", m.html.includes("housekeeping"));
  test("tekstversie is gevuld", m.text.length > 40);
  const kwaad = contactBerichtInternMail({ ...geldig, naam: '<img src=x onerror="alert(1)">' });
  test("invoer wordt geëscaped in de html", !kwaad.html.includes("<img") && kwaad.html.includes("&lt;img"));
  test("onderwerp bevat geen html-escaping", kwaad.subject.includes("<img"));
}

console.log("contactBerichtBevestigingMail");
{
  const m = contactBerichtBevestigingMail(geldig);
  test("spreekt aan met de voornaam", m.html.includes("Hoi Sanne,") && !m.html.includes("Hoi Sanne de Vries"));
  test("noemt het telefoonnummer", m.html.includes(TELEFOON));
  test("noemt geen placeholdernummer", !m.html.includes("020-123") && !m.text.includes("020-123"));
  test("toont wat er is gestuurd", m.html.includes("housekeeping"));
  test("noemt het adres in de voet", m.html.includes("Herengracht 372"));
  test("tekstversie noemt telefoon en adres", m.text.includes(TELEFOON) && m.text.includes(ADRES));
  const eenNaam = contactBerichtBevestigingMail({ ...geldig, naam: "Sanne" });
  test("werkt ook bij één naam", eenNaam.html.includes("Hoi Sanne,"));
}

console.log("aanvraagBevestigingMail");
{
  const m = aanvraagBevestigingMail({
    bedrijfsnaam: "Hotel Amsterdam",
    contactpersoon: "Peter Jansen",
    telefoon: "06 12345678",
    email: "peter@hotelamsterdam.nl",
    locatienaam: "Amsterdam Zuid",
    functies: ["Housekeeping", "Bediening"],
    opmerkingen: "Vier personen, zaterdag vanaf 08:00.",
  });
  test("onderwerp is herkenbaar", m.subject.includes("aanvraag") && m.subject.includes("EXTRA"));
  test("spreekt aan met de voornaam", m.html.includes("Hoi Peter,"));
  test("herhaalt het opgegeven nummer", m.html.includes("06 12345678"));
  test("noemt beide functies", m.html.includes("Housekeeping, Bediening"));
  test("noemt de toelichting", m.html.includes("zaterdag vanaf 08:00"));
  test("maakt onderscheid tussen kantooruren en daarbuiten",
    m.html.includes("binnen een uur") && m.html.includes("eerstvolgende werkdag"));
  test("geeft het eigen telefoonnummer voor spoed", m.html.includes(TELEFOON));
  test("tekstversie bevat dezelfde belofte", m.text.includes("binnen een uur") && m.text.includes("eerstvolgende werkdag"));

  const kaal = aanvraagBevestigingMail({
    bedrijfsnaam: "Klein Café", contactpersoon: "Ana", telefoon: "0612345678", email: "a@b.nl",
  });
  test("werkt zonder optionele velden", kaal.html.includes("Hoi Ana,") && kaal.html.includes("Klein Café"));
  test("laat lege rijen weg", !kaal.html.includes("Functies") && !kaal.html.includes("Toelichting"));
  test("lege functielijst geeft geen rij", !aanvraagBevestigingMail({
    bedrijfsnaam: "X", contactpersoon: "Y", telefoon: "1", email: "a@b.nl", functies: [],
  }).html.includes("Functies"));

  const kwaad = aanvraagBevestigingMail({
    bedrijfsnaam: '</td><script>alert(1)</script>', contactpersoon: "Z", telefoon: "1", email: "a@b.nl",
  });
  test("escapet ook hier de invoer", !kwaad.html.includes("<script>") && kwaad.html.includes("&lt;script&gt;"));
}

console.log("Consistentie");
{
  const alle = [
    contactBerichtInternMail(geldig),
    contactBerichtBevestigingMail(geldig),
    aanvraagBevestigingMail({ bedrijfsnaam: "A", contactpersoon: "B", telefoon: "1", email: "a@b.nl" }),
  ];
  test("elke mail heeft onderwerp, html en tekst",
    alle.every((m) => m.subject.length > 5 && m.html.length > 100 && m.text.length > 40));
  test("geen enkele mail bevat een openstaande placeholder",
    alle.every((m) => !/\{\{|\}\}|TODO|LOREM/i.test(m.html)));
  test("html is gebalanceerd genoeg om te renderen",
    alle.every((m) => (m.html.match(/<div/g) || []).length === (m.html.match(/<\/div>/g) || []).length));
}

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
