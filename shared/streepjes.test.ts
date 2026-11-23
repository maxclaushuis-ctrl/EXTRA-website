/**
 * Huistests voor shared/streepjes.ts. `npm run streepjes:test`.
 */
import { zonderStreepjes, zonderStreepjesDiep, heeftStreepje } from "./streepjes";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, conditie: boolean, detail?: string) {
  if (conditie) { geslaagd++; console.log(`  ✓ ${naam}`); }
  else { gefaald++; console.log(`  ✗ ${naam}${detail ? `: ${detail}` : ""}`); }
}
const is = (naam: string, a: unknown, b: unknown) => test(naam, JSON.stringify(a) === JSON.stringify(b), `${JSON.stringify(a)} is niet ${JSON.stringify(b)}`);

console.log("zonderStreepjes");
is("titel", zonderStreepjes("Housekeeping medewerker Amsterdam – Grand Hotel Amrâth gezocht (Fulltime)"), "Housekeeping medewerker Amsterdam, Grand Hotel Amrâth gezocht (Fulltime)");
is("lopende tekst", zonderStreepjes("en een vast contract – alles wat je nodig hebt"), "en een vast contract, alles wat je nodig hebt");
is("em dash", zonderStreepjes("snel — maar ook ondersteunend"), "snel, maar ook ondersteunend");
is("bereik in euro", zonderStreepjes("Parttime uren, €20–€24 all-in"), "Parttime uren, €20 tot €24 all-in");
is("bereik met spaties", zonderStreepjes("van 9 – 17 uur"), "van 9 tot 17 uur");
is("bereik met koppelteken en spaties", zonderStreepjes("van 9 - 17 uur"), "van 9 tot 17 uur");
is("koppelteken in woord blijft", zonderStreepjes("all-in, EXTRAATJE-systeem, F&B-team"), "all-in, EXTRAATJE-systeem, F&B-team");
is("koppelteken tussen woorden met spaties", zonderStreepjes("flexibel - en goed betaald"), "flexibel, en goed betaald");
is("opsommingsstreepje", zonderStreepjes("– kamers schoonmaken\n– bedden opmaken"), "kamers schoonmaken\nbedden opmaken");
is("geen dubbele komma", zonderStreepjes("Nederlands of Engels –, prima"), "Nederlands of Engels, prima");
is("streepje voor punt", zonderStreepjes("en meer – ."), "en meer.");
is("zonder streepje ongewijzigd", zonderStreepjes("Parttime medewerker FEBO Nieuwendijk"), "Parttime medewerker FEBO Nieuwendijk");
is("telefoonnummer blijft", zonderStreepjes("bel 085-1305915"), "bel 085-1305915");
is("datum blijft", zonderStreepjes("2026-11-23"), "2026-11-23");

console.log("zonderStreepjesDiep");
is("lijst", zonderStreepjesDiep(["a – b", "c"]), ["a, b", "c"]);
is("objecten", zonderStreepjesDiep([{ question: "Wat – nu?", answer: "Dit – dat" }]), [{ question: "Wat, nu?", answer: "Dit, dat" }]);
is("null blijft null", zonderStreepjesDiep(null), null);
is("getal blijft getal", zonderStreepjesDiep(20), 20);

console.log("heeftStreepje");
is("in tekst", heeftStreepje("a–b"), true);
is("niet na vervanging", heeftStreepje(zonderStreepjes("a – b")), false);
is("in lijst", heeftStreepje(["x", "y — z"]), true);
is("koppelteken telt niet", heeftStreepje("all-in"), false);

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
