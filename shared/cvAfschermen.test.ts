/**
 * Huistests cv afschermen (Job 3.0, fase 4). Fictieve cv's, geen echte personen.
 * Run met:  npx tsx shared/cvAfschermen.test.ts
 */
import { afschermen, secties } from "./cvAfschermen";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

const dossier = { voornaam: "Lotte", achternaam: "Visser", email: "lotte.visser@voorbeeld.nl", telefoon: "+31600000041", postcode: "1055 AB" };
const cv = `Lotte Visser
Voorbeeldstraat 12, 1055 AB Amsterdam
06 00000041 · lotte.visser@voorbeeld.nl · linkedin.com/in/lottevisser
Geboren: 14-03-1999

Profiel
Vrolijke en harde werker, geboren op 14 maart 1999.

Werkervaring
Housekeeper, Hotel Amstelzicht, Amsterdam
maart 2024 tot heden
Kamers opmaken, badkamers schoonmaken, werken met de kamerlijst.

Schoonmaker, Kantoorschoonmaak Noord
01-2022 - 12-2023
Kantoren schoonmaken in de avond. Referentie: Lotte haar leidinggevende, tel. 020 123 45 67.

Opleiding
MBO Facilitair medewerker, 2019 tot 2022

Hobby's
Hardlopen met mijn hond

Referenties
Mevrouw de Vries, 06 11111111`;

const a = afschermen(cv, dossier);
test("Gaat door naar de AI", a.ok, a.reden);
test("Alleen werk en opleiding: koppen gevonden", a.secties);
test("Werkervaring blijft", a.tekst.includes("Housekeeper, Hotel Amstelzicht") && a.tekst.includes("maart 2024 tot heden"));
test("Maand-jaar-datums blijven", a.tekst.includes("01-2022 - 12-2023") && a.tekst.includes("2019 tot 2022"));
test("Opleiding blijft", a.tekst.includes("MBO Facilitair medewerker"));
test("Naam weg", !/lotte|visser/i.test(a.tekst), a.tekst);
test("E-mail weg", !a.tekst.includes("@"));
test("Telefoon weg (ook in werkervaring)", !/020 123 45 67|0600000041|06 00000041/.test(a.tekst), a.tekst);
test("Adres en postcode weg", !/Voorbeeldstraat|1055/.test(a.tekst));
test("Geboortedatum weg", !/14-03-1999|14 maart 1999/.test(a.tekst));
test("Profiel, hobby's en referenties weg", !/Vrolijke|hond|de Vries/.test(a.tekst));
test("Links weg", !/linkedin/i.test(a.tekst));

const zonderKoppen = afschermen("Ik werkte 2 jaar als afwasser bij Eetcafe De Brug, van 2021 tot 2023. Bel me op 0612345678. Groet, Sem Jansen", { voornaam: "Sem", achternaam: "Jansen", telefoon: "0612345678" });
test("Zonder koppen: hele tekst gefilterd", zonderKoppen.ok && !zonderKoppen.secties && zonderKoppen.tekst.includes("afwasser") && !/Sem|Jansen|0612345678/.test(zonderKoppen.tekst), JSON.stringify(zonderKoppen));

const bsn = afschermen("Werkervaring\nKok bij Restaurant De Haven 2022 tot 2024\nBSN 111222333, IBAN NL91ABNA0417164300", { voornaam: "Kevin", achternaam: "Bakker" });
test("BSN en IBAN weg", bsn.ok && !/111222333|NL91/.test(bsn.tekst), bsn.tekst);

test("Leeg cv gaat niet door", afschermen("   ", dossier).ok === false && afschermen("   ", dossier).reden === "leeg");
test("Secties: zonder werkkop geen selectie", secties("Hobby's\nvoetbal").gevonden === false);

// Tweede controle: een telefoonnummer in een vorm die het filter mist, maar wel van het dossier is
const raar = afschermen("Werkervaring\nBarman bij Cafe Noord 2020 tot 2023, bereikbaar op 06.00.00.00.41", dossier);
test("Tweede controle stopt bij een overgebleven dossiergegeven", raar.ok === false && raar.reden === "controle", JSON.stringify(raar));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
