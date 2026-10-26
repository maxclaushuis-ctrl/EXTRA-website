/**
 * Huistests voor shared/vacatureWeergave.ts. `npm run vacatureweergave:test`.
 */
import { afdelingVan, brancheVan, isBranche, korteTitel, plaats, loonLabel, splitsAanbod, alineas, tel, opsomming } from "./vacatureWeergave";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, conditie: boolean, detail?: string) {
  if (conditie) { geslaagd++; console.log(`  ✓ ${naam}`); }
  else { gefaald++; console.log(`  ✗ ${naam}${detail ? `: ${detail}` : ""}`); }
}
const is = (naam: string, a: unknown, b: unknown) => test(naam, a === b, `${JSON.stringify(a)} is niet ${JSON.stringify(b)}`);

console.log("afdelingVan");
is("Housekeeping", afdelingVan({ functionType: "Housekeeping", title: "" }), "Housekeeping");
is("Chef wordt Keuken", afdelingVan({ functionType: "Chef", title: "Ontbijtchef" }), "Keuken");
is("Kok wordt Keuken", afdelingVan({ functionType: "Kok", title: "" }), "Keuken");
is("Bediening wordt F&B", afdelingVan({ functionType: "Bediening", title: "" }), "F&B");
is("Bartender wordt F&B", afdelingVan({ functionType: "Bartender", title: "" }), "F&B");
is("Banqueting", afdelingVan({ functionType: "Banqueting", title: "" }), "Banqueting");
is("Front office", afdelingVan({ functionType: "Front office", title: "" }), "Front office");
is("Afwasser wordt Afwas", afdelingVan({ functionType: "Afwasser", title: "" }), "Afwas");
is("Orderpicker wordt Logistiek", afdelingVan({ functionType: "Orderpicker", title: "" }), "Logistiek");
is("leeg type: titel beslist", afdelingVan({ functionType: "", title: "Zelfstandig werkend kok Amsterdam" }), "Keuken");
is("onbekend blijft zichtbaar", afdelingVan({ functionType: "Schilder", title: "" }), "Schilder");

console.log("brancheVan");
is("hotel is hotels", brancheVan({ functionType: "Housekeeping", title: "", workplace: "Hotel" }), "hotels");
is("eventlocatie is events", brancheVan({ functionType: "Bediening", title: "", workplace: "Eventlocatie" }), "events");
is("catering is events", brancheVan({ functionType: "Bediening", title: "", workplace: "Catering" }), "events");
is("orderpicker is logistiek", brancheVan({ functionType: "Orderpicker", title: "", workplace: "Magazijn" }), "logistiek");
is("restaurant is hotels", brancheVan({ functionType: "Chef", title: "", workplace: "Restaurant" }), "hotels");
test("isBranche", isBranche("events") && !isBranche("horeca") && !isBranche(null));

console.log("korteTitel");
is("lange SEO-titel", korteTitel("Housekeeping medewerker Amsterdam – Grand Hotel Amrâth gezocht (Fulltime)", "Amsterdam"), "Housekeeping medewerker");
is("plaats met toevoeging", korteTitel("Housekeeping medewerker Scheveningen – Amrâth Kurhaus gezocht (Parttime)", "Scheveningen (Den Haag)"), "Housekeeping medewerker");
is("zonder streepje", korteTitel("Ontbijtchef", "Amsterdam"), "Ontbijtchef");
is("dienstverband tussen haakjes weg", korteTitel("Kok (Fulltime)", "Utrecht"), "Kok");
is("lege titel blijft leeg", korteTitel("", "Amsterdam"), "");
is("plaats", plaats("Scheveningen (Den Haag)"), "Scheveningen");

console.log("loonLabel");
is("bedrag", loonLabel("18"), "€18,00");
is("bedrag met decimalen", loonLabel("17.29"), "€17,29");
is("komma", loonLabel("18,50"), "€18,50");
is("bereik", loonLabel("20-24"), "€20 tot €24");
is("bereik met streepje en spaties", loonLabel("20 – 24"), "€20 tot €24");
is("getal", loonLabel(18), "€18,00");
is("leeg", loonLabel(""), null);
is("null", loonLabel(null), null);
is("onzin", loonLabel("in overleg"), null);
is("nul", loonLabel("0"), null);

console.log("splitsAanbod");
test("met streepje", JSON.stringify(splitsAanbod("Dagbetaling mogelijk – je krijgt je geld snel na je dienst")) === JSON.stringify(["Dagbetaling mogelijk", "je krijgt je geld snel na je dienst"]));
test("met dubbele punt", JSON.stringify(splitsAanbod("EXTRAATJE: punten voor korting")) === JSON.stringify(["EXTRAATJE", "punten voor korting"]));
test("zonder toelichting", JSON.stringify(splitsAanbod("All-in uurloon van €18 per uur")) === JSON.stringify(["All-in uurloon van €18 per uur", null]));
test("koppelteken in een woord splitst niet", splitsAanbod("All-in uurloon")[1] === null);

console.log("alineas");
test("splitst op lege regels", alineas("een\n\ntwee", null, "drie").length === 3);
test("enkele regelovergang wordt spatie", alineas("een\ntwee")[0] === "een twee");
test("leeg geeft niets", alineas("", null, undefined, "  ").length === 0);

console.log("tel en opsomming");
test("tel", JSON.stringify(tel(["a", "b", "a"], (x) => x)) === JSON.stringify([["a", 2], ["b", 1]]));
is("twee", opsomming(["Amsterdam", "Scheveningen", "Amsterdam"]), "Amsterdam en Scheveningen");
is("drie", opsomming(["A", "B", "C"]), "A, B en C");
is("een", opsomming(["A"]), "A");

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
