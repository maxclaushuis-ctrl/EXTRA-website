/**
 * Huistests Job 5, het pure deel (shared/jobGesprek.ts): schakelaar, controle van wat het model
 * teruggeeft, de harde grenzen en het samenstellen van het bericht.
 * Draaien: npx tsx shared/jobGesprek.test.ts
 */
import { eerdereAntwoorden, gesprekAan, gesprekModel, grensFouten, reactieMag, stelGesprekSamen, vraagMag, valideerGesprek, GESPREK_MODEL_STANDAARD } from "./jobGesprek";
import { kennis } from "./jobKennis";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

// Schakelaar en model
test("schakelaar: testomgeving vanzelf aan", gesprekAan({ TESTOMGEVING: "1" }));
test("schakelaar: testomgeving uit met 0", !gesprekAan({ TESTOMGEVING: "1", JOB_GESPREK_AI: "0" }));
test("schakelaar: elders alleen met 1", !gesprekAan({}) && gesprekAan({ JOB_GESPREK_AI: "1" }));
test("model: standaard, of uit JOB_GESPREK_MODEL", gesprekModel({}) === GESPREK_MODEL_STANDAARD && gesprekModel({ JOB_GESPREK_MODEL: " gpt-5.4 " }) === "gpt-5.4");

// Eerdere antwoorden
const gesch = "Job: Vertel eens: hoeveel jaar ervaring heb je?\nKandidaat: Hi\nJob: Heb je al eens in de horeca gewerkt?\nKandidaat: 2 jaar\nJob: Waar was dat?";
test("eerdere antwoorden uit de geschiedenis", JSON.stringify(eerdereAntwoorden(gesch)) === JSON.stringify(["Hi", "2 jaar"]));

// Valideren
const zegNet = valideerGesprek({ soort: ["antwoord"], velden: { ervaring: "2 jaar in de horeca" }, bewijs: { ervaring: "2 jaar" }, reactie: "Je hebt gelijk, sorry.", vraag: "Waar was dat?", vraagt: "hotels" }, "Zeg ik net", "ervaring", ["Hi", "2 jaar"]);
test("zeg ik net: citaat uit een eerder bericht telt", zegNet.velden.ervaring === "2 jaar in de horeca", JSON.stringify(zegNet.velden));
const zonder = valideerGesprek({ soort: ["antwoord"], velden: { ervaring: "2 jaar" }, bewijs: { ervaring: "2 jaar" } }, "Zeg ik net", "ervaring", []);
test("zonder eerder bericht geen veld met een verzonnen citaat", zonder.velden.ervaring === undefined || zonder.velden.ervaring === "2 jaar", JSON.stringify(zonder.velden));
const verzonnen = valideerGesprek({ soort: ["antwoord"], velden: { diensten: "5+" }, bewijs: { diensten: "5 dagen" } }, "Zeg ik net", "ervaring", ["Hi", "2 jaar"]);
test("een citaat dat nergens staat valt weg", verzonnen.velden.diensten === undefined);
const groet = valideerGesprek({ soort: ["onduidelijk"], velden: { ervaring: "Hi" }, bewijs: { ervaring: "Hi" } }, "Hi", "ervaring", []);
test("een groet slaat niets op", Object.keys(groet.velden).length === 0);
test("vraagt: een bekend veld of klaar", valideerGesprek({ soort: ["antwoord"], vraagt: "werkgebied" }, "x", "diensten", []).vraagt === "werkgebied" && valideerGesprek({ soort: ["antwoord"], vraagt: "iets" }, "x", "diensten", []).vraagt === null);

// Grenzen
test("grens: bedrag of per uur", grensFouten("Je verdient 15 euro per uur.", "nl").length > 0 && grensFouten("Dat is € 14,50.", "nl").length > 0);
test("grens: belofte of aangenomen", grensFouten("Je bent aangenomen!", "nl").length > 0 && grensFouten("Ik beloof dat je werk krijgt.", "nl").length > 0);
test("grens: link", grensFouten("Kijk op www.voorbeeld.nl", "nl").length > 0);
test("grens: BSN of IBAN", grensFouten("Je nummer 123456782 klopt.", "nl").length > 0 && grensFouten("Op NL91ABNA0417164300 gestort.", "nl").length > 0);
test("grens: twee vragen", grensFouten("Waar was dat? En hoe lang?", "nl").length > 0);
test("grens: verkeerde taal", grensFouten("Thanks, how many shifts do you want to work?", "nl").length > 0);
test("grens: een gewone zin mag", grensFouten("Twee jaar, mooi. Waar was dat, in een restaurant, café of hotel?", "nl").length === 0);
test("reactie: geen vraag", !reactieMag("Mooi, waar was dat?", "nl") && reactieMag("Twee jaar, mooi.", "nl"));
test("vraag: moet eindigen met een vraagteken", vraagMag("Hoe ver wil je ongeveer reizen naar je werk?", "nl") && !vraagMag("Vertel over je werk.", "nl"));
test("de teksten bevatten geen gedachtestreepjes", !/[\u2013\u2014]/.test(grensFouten.toString() + stelGesprekSamen.toString()));

// Samenstellen
const g = (o: any) => valideerGesprek({ soort: ["antwoord"], ...o }, "x", "diensten", []);
const regels = [{ tekst: "Hoe ver wil je ongeveer reizen naar je werk?", keuzes: ["Tot 25 km", "Tot 35 km"] }];
const s1 = stelGesprekSamen({ gesprek: g({ reactie: "Vier dagen, helder.", vraag: "Hoe ver wil je reizen?", vraagt: "werkgebied" }), regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl" });
test("samen: reactie en vraag van het model, knoppen blijven", s1.berichten[0].tekst === "Vier dagen, helder. Hoe ver wil je reizen?" && (s1.berichten[0].keuzes || []).length === 2 && s1.gebruikt.vraag && s1.gebruikt.reactie);
const s2 = stelGesprekSamen({ gesprek: g({ reactie: "Je krijgt 15 euro per uur.", vraag: "Hoe ver wil je reizen?", vraagt: "werkgebied" }), regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl" });
test("samen: reactie met een bedrag valt weg", s2.berichten[0].tekst === "Hoe ver wil je reizen?" && !s2.gebruikt.reactie);
const s3 = stelGesprekSamen({ gesprek: g({ reactie: "Helder.", vraag: "Hoeveel diensten wil je?", vraagt: "diensten" }), regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl" });
test("samen: vraag over een ander veld dan de regels: de vaste vraag", s3.berichten[0].tekst === "Helder. Hoe ver wil je ongeveer reizen naar je werk?" && !s3.gebruikt.vraag);
const loon = valideerGesprek({ soort: ["antwoord", "vraag"], kennis: "loon", reactie: "Dat is ongeveer 15 euro.", vraag: "Hoe ver wil je reizen?", vraagt: "werkgebied" }, "wat verdien ik", "diensten", []);
const s4 = stelGesprekSamen({ gesprek: loon, regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl" });
test("samen: loonvraag krijgt de vaste tekst uit de kennisbank, nooit de reactie van het model", s4.berichten[0].tekst.startsWith(kennis("loon")!.nl) && !/15/.test(s4.berichten[0].tekst));
const aut = [{ tekst: "Wat staat er op je verblijfsdocument over werken?", keuzes: ["a", "b"] }];
const s5 = stelGesprekSamen({ gesprek: g({ reactie: "Helder.", vraag: "Mag je in Nederland werken?", vraagt: "werkautorisatie" }), regels: aut, onderwerp: "werkautorisatie", standaard: aut[0].tekst, taal: "nl" });
test("samen: werkvergunning blijft letterlijk", s5.berichten[0].tekst === "Helder. Wat staat er op je verblijfsdocument over werken?" && !s5.gebruikt.vraag);
const metOpmerking = [{ tekst: "Een collega kijkt daar even naar. Hoeveel diensten per week zou je willen werken?" }];
const s6 = stelGesprekSamen({ gesprek: g({ reactie: "Oké.", vraag: "Hoeveel diensten per week past bij jou?", vraagt: "diensten" }), regels: metOpmerking, onderwerp: "diensten", standaard: "Hoeveel diensten per week zou je willen werken?", taal: "nl" });
test("samen: een vaste opmerking van de regels gaat voor de reactie van het model", s6.berichten[0].tekst === "Een collega kijkt daar even naar. Hoeveel diensten per week past bij jou?");
const eind = [{ tekst: "Bijna klaar! Je krijgt een mail met een knop om je cv te sturen.", cvUpload: true }];
const s7 = stelGesprekSamen({ gesprek: g({ reactie: "Direct beginnen, top.", vraag: "", vraagt: "klaar" }), regels: eind, onderwerp: null, standaard: null, taal: "nl" });
test("samen: aan het eind de reactie voor het vaste bericht, vlaggen blijven", s7.berichten[0].tekst.startsWith("Direct beginnen, top. Bijna klaar!") && s7.berichten[0].cvUpload === true);
const s8 = stelGesprekSamen({ gesprek: null, regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl" });
test("samen: zonder model de vaste berichten", s8.berichten[0].tekst === regels[0].tekst);

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
