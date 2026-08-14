/**
 * Unit-tests voor shared/vaardigheden.ts
 * Run met:  npx tsx shared/vaardigheden.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 * Zelfde opzet als server/redirects.test.ts en server/salesflowLogic.test.ts.
 */
import {
  vaardighedenUitKandidaat, telVaardigheden, naarSnakeCase,
  VAARDIGHEDEN, VAARDIGHEID_LABELS,
} from "./vaardigheden";

let passed = 0;
let failed = 0;

function assertEq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { passed++; console.log(`  ✓ ${label}`); }
  else {
    failed++;
    console.error(`  ✗ ${label}\n      actual:   ${JSON.stringify(actual)}\n      expected: ${JSON.stringify(expected)}`);
  }
}

console.log("\n— naarSnakeCase() —");
assertEq("isAssistantChef", naarSnakeCase("isAssistantChef"), "is_assistant_chef");
assertEq("canCarryThreePlates", naarSnakeCase("canCarryThreePlates"), "can_carry_three_plates");
assertEq("al lowercase blijft gelijk", naarSnakeCase("functie"), "functie");

console.log("\n— vaardighedenUitKandidaat(): camelCase (drizzle) —");
assertEq("assistent chef", vaardighedenUitKandidaat({ isAssistantChef: true }), ["Assistent chef"]);
assertEq(
  "meerdere, altijd in schermvolgorde",
  vaardighedenUitKandidaat({ isPromoter: true, isBarista: true, isAssistantChef: true }),
  ["Assistent chef", "Barista", "Promowerk"],
);
assertEq("alles aan", vaardighedenUitKandidaat(
  { isAssistantChef: true, isBarista: true, canMakeCocktails: true, canCarryThreePlates: true, canDoWashing: true, isPromoter: true },
), VAARDIGHEID_LABELS);

console.log("\n— vaardighedenUitKandidaat(): snake_case (ruwe query) —");
assertEq("is_assistant_chef", vaardighedenUitKandidaat({ is_assistant_chef: true }), ["Assistent chef"]);
assertEq("can_carry_three_plates", vaardighedenUitKandidaat({ can_carry_three_plates: true }), ["3 borden dragen"]);

console.log("\n— vaardighedenUitKandidaat(): niets, of geen kandidaat —");
assertEq("geen kandidaat (handmatige medewerker)", vaardighedenUitKandidaat(null), []);
assertEq("undefined", vaardighedenUitKandidaat(undefined), []);
assertEq("leeg object", vaardighedenUitKandidaat({}), []);
assertEq("alles op false", vaardighedenUitKandidaat({ isAssistantChef: false, isBarista: false }), []);
assertEq(
  "null telt niet als ja (kolom bestaat, nooit ingevuld)",
  vaardighedenUitKandidaat({ isAssistantChef: null, isBarista: null }),
  [],
);
assertEq(
  "waarheidachtige waarde is géén ja — alleen echte true",
  vaardighedenUitKandidaat({ isAssistantChef: 1 as any, isBarista: 'ja' as any }),
  [],
);

console.log("\n— telVaardigheden() —");
const mensen = [
  { vaardigheden: ["Assistent chef", "Barista"] },
  { vaardigheden: ["Assistent chef"] },
  { vaardigheden: [] },
  { vaardigheden: null },
  {},
  { vaardigheden: ["Promowerk", "Barista"] },
];
assertEq("telt en sorteert op schermvolgorde", telVaardigheden(mensen), [
  { label: "Assistent chef", aantal: 2 },
  { label: "Barista", aantal: 2 },
  { label: "Promowerk", aantal: 1 },
]);
assertEq("vaardigheden zonder treffers vallen weg", telVaardigheden([{ vaardigheden: ["Afwas"] }]), [
  { label: "Afwas", aantal: 1 },
]);
assertEq("lege lijst geeft lege telling", telVaardigheden([]), []);
assertEq("alleen mensen zonder vaardigheden", telVaardigheden([{ vaardigheden: [] }, {}]), []);

console.log("\n— samenhang —");
assertEq("elke definitie heeft een uniek label", new Set(VAARDIGHEID_LABELS).size, VAARDIGHEDEN.length);
assertEq("Assistent chef staat vooraan", VAARDIGHEID_LABELS[0], "Assistent chef");

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
