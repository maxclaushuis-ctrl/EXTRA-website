/**
 * Huistests Job 5, het pure deel (shared/jobGesprek.ts): schakelaar, controle van wat het model
 * teruggeeft, de harde grenzen en het samenstellen van het bericht.
 * Draaien: npx tsx shared/jobGesprek.test.ts
 */
import { eerdereAntwoorden, eerdereJobBerichten, gesprekAan, gesprekModel, grensFouten, reactieMag, stelGesprekSamen, vraagMag, valideerGesprek, wijzigingBevestiging, zonderHerhaaldStopwoord, preciezerWerkmoment, alGenoteerd, GESPREK_MODEL_STANDAARD } from "./jobGesprek";
import { werkmoment } from "./jobLezen";
import { teksten } from "./jobRegels";
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
test("samen: duidelijk antwoord met knoppen: geen reactie, de korte vaste vraag, knoppen blijven", s1.berichten[0].tekst === regels[0].tekst && (s1.berichten[0].keuzes || []).length === 2 && !s1.gebruikt.vraag && !s1.gebruikt.reactie, s1.berichten[0].tekst);
const s2 = stelGesprekSamen({ gesprek: g({ reactie: "Je krijgt 15 euro per uur.", vraag: "Hoe ver wil je reizen?", vraagt: "werkgebied" }), regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl" });
test("samen: reactie met een bedrag valt weg", s2.berichten[0].tekst === regels[0].tekst && !s2.gebruikt.reactie, s2.berichten[0].tekst);
const s3 = stelGesprekSamen({ gesprek: g({ reactie: "Helder.", vraag: "Hoeveel diensten wil je?", vraagt: "diensten" }), regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl" });
test("samen: vraag over een ander veld dan de regels: de vaste vraag", s3.berichten[0].tekst === "Hoe ver wil je ongeveer reizen naar je werk?" && !s3.gebruikt.vraag, s3.berichten[0].tekst);
const loon = valideerGesprek({ soort: ["antwoord", "vraag"], kennis: "loon", reactie: "Dat is ongeveer 15 euro.", vraag: "Hoe ver wil je reizen?", vraagt: "werkgebied" }, "wat verdien ik", "diensten", []);
const s4 = stelGesprekSamen({ gesprek: loon, regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl" });
test("samen: loonvraag krijgt de vaste tekst uit de kennisbank, nooit de reactie van het model", s4.berichten[0].tekst.startsWith(kennis("loon")!.nl) && !/15/.test(s4.berichten[0].tekst));
const aut = [{ tekst: "Wat staat er op je verblijfsdocument over werken?", keuzes: ["a", "b"] }];
const s5 = stelGesprekSamen({ gesprek: g({ reactie: "Helder.", vraag: "Mag je in Nederland werken?", vraagt: "werkautorisatie" }), regels: aut, onderwerp: "werkautorisatie", standaard: aut[0].tekst, taal: "nl" });
test("samen: werkvergunning blijft letterlijk", s5.berichten[0].tekst === "Wat staat er op je verblijfsdocument over werken?" && !s5.gebruikt.vraag, s5.berichten[0].tekst);
const metOpmerking = [{ tekst: "Een collega kijkt daar even naar. Hoeveel diensten per week zou je willen werken?" }];
const s6 = stelGesprekSamen({ gesprek: g({ reactie: "Oké.", vraag: "Hoeveel diensten per week past bij jou?", vraagt: "diensten" }), regels: metOpmerking, onderwerp: "diensten", standaard: "Hoeveel diensten per week zou je willen werken?", taal: "nl" });
test("samen: een vaste opmerking van de regels gaat voor de reactie van het model", s6.berichten[0].tekst === "Een collega kijkt daar even naar. Hoeveel diensten per week past bij jou?");
const eind = [{ tekst: "Bijna klaar! Je krijgt een mail met een knop om je cv te sturen.", cvUpload: true }];
const s7 = stelGesprekSamen({ gesprek: g({ reactie: "Direct beginnen, top.", vraag: "", vraagt: "klaar" }), regels: eind, onderwerp: null, standaard: null, taal: "nl" });
test("samen: aan het eind na een duidelijk antwoord direct het vaste bericht, vlaggen blijven", s7.berichten[0].tekst.startsWith("Bijna klaar!") && s7.berichten[0].cvUpload === true, s7.berichten[0].tekst);
const s8 = stelGesprekSamen({ gesprek: null, regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl" });
test("samen: zonder model de vaste berichten", s8.berichten[0].tekst === regels[0].tekst);

// ─── Rustig doorvragen: direct door bij een duidelijk antwoord, eerst afhandelen bij een vraag of correctie ───
const vrij = [{ tekst: "Waar was dat?" }];
const r1 = stelGesprekSamen({ gesprek: g({ reactie: "Twee jaar, mooi.", vraag: "Waar was dat, in een restaurant of hotel?", vraagt: "hotels" }), regels: vrij, onderwerp: "hotels", standaard: vrij[0].tekst, taal: "nl" });
test("rustig: getypt duidelijk antwoord: geen reactie, wel de eigen vraag van het model (geen knoppen)", r1.berichten[0].tekst === "Waar was dat, in een restaurant of hotel?" && !r1.gebruikt.reactie, r1.berichten[0].tekst);
const gc = (o: any) => valideerGesprek({ soort: ["correctie"], ...o }, "x", "werkgebied", []);
const r2 = stelGesprekSamen({ gesprek: gc({ reactie: "Helder, ik heb het aangepast.", vraag: "", vraagt: "werkmoment" }), regels: [{ tekst: "Wanneer kun je meestal werken?", keuzes: ["a", "b"] }], onderwerp: "werkmoment", standaard: "Wanneer kun je meestal werken?", taal: "nl",
  bevestiging: "Ik heb het aangepast naar 25 km enkele reis.", eerder: ["Helder. Hoeveel diensten?"] });
test("rustig: correctie: de bevestiging uit het dossier gaat voor, niet de woorden van het model", r2.berichten[0].tekst === "Ik heb het aangepast naar 25 km enkele reis. Wanneer kun je meestal werken?" && r2.gebruikt.bevestiging === true && !r2.gebruikt.reactie, r2.berichten[0].tekst);
const r3 = stelGesprekSamen({ gesprek: gc({ reactie: "Ik zet het op 1 tot 2 diensten.", vraag: "", vraagt: "werkgebied" }), regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl" });
test("rustig: correctie zonder bevestiging uit het dossier: Job zegt niets toe, alleen de vraag", r3.berichten[0].tekst === regels[0].tekst && !r3.gebruikt.reactie, r3.berichten[0].tekst);
const r4 = stelGesprekSamen({ gesprek: g({ soort: ["antwoord", "vraag"], kennis: "loon", reactie: "", vraag: "", vraagt: "werkgebied" }), regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl", bevestiging: "Ik heb het aangepast naar 1 tot 2 diensten per week." });
test("rustig: correctie en loonvraag: eerst de bevestiging, dan het antwoord, dan de vraag", r4.berichten[0].tekst.startsWith("Ik heb het aangepast naar 1 tot 2 diensten per week. " + kennis("loon")!.nl) && r4.berichten[0].tekst.endsWith(regels[0].tekst), r4.berichten[0].tekst);
const r5 = stelGesprekSamen({ gesprek: g({ soort: ["antwoord"], reactie: "Je hebt gelijk, sorry.", vraag: "", vraagt: "werkgebied" }), regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl", bericht: "Dit heb ik toch net gezegd?" });
test("rustig: een verwijzing naar een eerder antwoord krijgt de korte erkenning", r5.berichten[0].tekst === `Je hebt gelijk, sorry. ${regels[0].tekst}`, r5.berichten[0].tekst);
const r6 = stelGesprekSamen({ gesprek: valideerGesprek({ soort: ["frustratie"], reactie: "Helder, nog twee korte vragen.", vraag: "", vraagt: "werkgebied" }, "x", "werkgebied", []), regels, onderwerp: "werkgebied", standaard: regels[0].tekst, taal: "nl", eerder: ["Helder. Hoeveel diensten per week?"] });
test("rustig: ergernis wordt erkend, zonder het stopwoord dat al eens vooraan stond", r6.berichten[0].tekst === `Nog twee korte vragen. ${regels[0].tekst}`, r6.berichten[0].tekst);

test("stopwoord: tweede keer 'Helder,' gaat eraf", zonderHerhaaldStopwoord("Helder, fulltime dus.", ["Helder. Wat deed je?"]) === "Fulltime dus.");
test("stopwoord: eerste keer mag", zonderHerhaaldStopwoord("Top, dat is duidelijk.", ["Hoeveel jaar ervaring heb je?"]) === "Top, dat is duidelijk.");
test("stopwoord: blijft er bijna niets over, dan leeg", zonderHerhaaldStopwoord("Helder.", ["Helder, dank je."]) === "" && zonderHerhaaldStopwoord("Top!", ["Top, mooi."]) === "");
test("stopwoord: een ander woord vooraan blijft staan", zonderHerhaaldStopwoord("Je hebt gelijk, sorry.", ["Helder."]) === "Je hebt gelijk, sorry.");
test("geschiedenis: de berichten van Job", eerdereJobBerichten("Job: Hoi!\nKandidaat: hoi\nJob: Helder. Wat deed je?").join("|") === "Hoi!|Helder. Wat deed je?");

const leeg: any = {};
test("bevestiging: correctie van het werkgebied, letterlijk zoals opgeslagen", wijzigingBevestiging({ werkgebied: "tot 25 km" } as any, { werkgebied: "25 km enkele reis" } as any, { correctie: true, gevraagd: "werkmoment", taal: "nl" }) === "Ik heb het aangepast naar 25 km enkele reis.");
test("bevestiging: correctie van de diensten", wijzigingBevestiging({ diensten: "5+" } as any, { diensten: "1-2" } as any, { correctie: true, gevraagd: "werkgebied", taal: "nl" }) === "Ik heb het aangepast naar 1 tot 2 diensten per week.");
test("bevestiging: losse aanvulling terwijl de open vraag onbeantwoord blijft", wijzigingBevestiging({ diensten: "5+" } as any, { diensten: "5+", werkmomentTekst: "alleen in de avond" } as any, { correctie: false, gevraagd: "werkgebied", taal: "nl" }) === "Genoteerd: alleen in de avond.");
test("bevestiging: antwoord plus extra in één bericht: geen bevestiging, Job gaat door", wijzigingBevestiging(leeg, { werkgebied: "tot 25 km", werkmomentTekst: "alleen in de avond" } as any, { correctie: false, gevraagd: "werkgebied", taal: "nl" }) === "");
test("bevestiging: alleen het antwoord op de open vraag: niets", wijzigingBevestiging(leeg, { diensten: "5+" } as any, { correctie: false, gevraagd: "diensten", taal: "nl" }) === "");
test("bevestiging: Engels", wijzigingBevestiging(leeg, { werkmoment: "avond_weekend" } as any, { correctie: false, gevraagd: "werkgebied", taal: "en" }) === "Noted: evenings and weekends.");
test("bevestiging: een bedrag in een vrije tekst komt er niet in", wijzigingBevestiging(leeg, { werkgebied: "€ 20 per uur" } as any, { correctie: true, gevraagd: "werkgebied", taal: "nl" }) === "");

test("knoppen: werkmoment is kort en de derde knop heet Flexibel", teksten("nl").werkmoment === "Wanneer kun je meestal werken?" && teksten("nl").werkmomentKeuzes[2] === "Flexibel" && teksten("en").werkmomentKeuzes[2] === "Flexible");
test("knoppen: Flexibel en het oude Wanneer nodig betekenen allebei flexibel", werkmoment("Flexibel") === "flexibel" && werkmoment("Wanneer nodig") === "flexibel" && werkmoment("Flexible") === "flexibel");
test("knoppen: de vraag noemt de opties niet", !/doordeweeks|avond/i.test(teksten("nl").werkmoment) && !/studie/i.test(teksten("nl").werkvorm));

test("werkmoment: 'toch alleen s avonds' is geen avond en weekend, de eigen woorden blijven", JSON.stringify(preciezerWerkmoment({ werkmoment: "avond_weekend" } as any, "Nee, toch alleen 's avonds")) === JSON.stringify({ werkmomentTekst: "alleen 's avonds" }));
test("werkmoment: de knop Avond en weekend blijft de knop", preciezerWerkmoment({ werkmoment: "avond_weekend" } as any, "Avond en weekend").werkmoment === "avond_weekend");
test("werkmoment: avonden en weekenden in eigen woorden blijft avond en weekend", preciezerWerkmoment({ werkmoment: "avond_weekend" } as any, "avonden en in het weekend").werkmoment === "avond_weekend");
test("bevestiging: Flexibel gecorrigeerd naar alleen 's avonds noemt alleen de avond", wijzigingBevestiging({ werkmoment: "flexibel" } as any, { werkmomentTekst: "alleen 's avonds" } as any, { correctie: true, gevraagd: "werkvorm", taal: "nl" }) === "Ik heb het aangepast naar alleen 's avonds.");

test("al genoteerd: de gewenste waarde stond er al", alGenoteerd({ diensten: "1-2" } as any, { diensten: "1-2" } as any, "nl") === "Dat staat al zo genoteerd: 1 tot 2 diensten per week.");
test("al genoteerd: staat er iets anders, dan niets", alGenoteerd({ diensten: "1-2" } as any, { diensten: "5+" } as any, "nl") === "");
test("werkmoment: avond maar niet in het weekend: de volledige beperking", JSON.stringify(preciezerWerkmoment({ werkmoment: "avond_weekend" } as any, "Ik kan 's avonds, maar in het weekend kan ik niet.")) === JSON.stringify({ werkmomentTekst: "'s avonds, maar in het weekend kan ik niet" }));
test("werkmoment: ook als het model alleen de avond in eigen woorden zet, blijft de weekendbeperking erbij", /weekend kan ik niet/.test(preciezerWerkmoment({ werkmomentTekst: "'s avonds" } as any, "Ik kan 's avonds, maar in het weekend kan ik niet").werkmomentTekst || ""));
test("werkmoment: alleen de zin over wanneer, niet de rest van het bericht", preciezerWerkmoment({ werkmoment: "avond_weekend" } as any, "Ik werkte twee jaar in een hotel. Ik kan 's avonds, maar niet in het weekend.").werkmomentTekst === "'s avonds, maar niet in het weekend");
test("werkmoment: Engels, evenings but not weekends", /not weekends/.test(preciezerWerkmoment({ werkmoment: "avond_weekend" } as any, "I can do evenings but not weekends").werkmomentTekst || ""));
test("werkmoment: een vraag in hetzelfde bericht komt niet in de beschikbaarheid", preciezerWerkmoment({ werkmoment: "avond_weekend" } as any, "Vanaf maandag kan ik twee avonden per week, behalve op vrijdag. Wat verdien ik eigenlijk?").werkmomentTekst === "Vanaf maandag kan ik twee avonden per week, behalve op vrijdag");
test("werkmoment: een uitzondering (behalve op vrijdag) blijft bewaard, ook als het model die weglaat", /behalve op vrijdag/.test(preciezerWerkmoment({ werkmomentTekst: "twee avonden per week" } as any, "Vanaf maandag kan ik twee avonden per week, behalve op vrijdag.").werkmomentTekst || ""));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
