/**
 * Unit-tests voor shared/landenAlias.ts
 * Run met:  npx tsx shared/landenAlias.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 *
 * Waar het hier om gaat: deze tabel bepaalt straks wat er in de database komt
 * te staan als landcode van een echte medewerker. De tests bewaken drie dingen.
 * Eén: elke alias verwijst naar een land dat écht in shared/landen.ts staat —
 * een typefout in de rechterkolom levert anders stilzwijgend niets op. Twee: er
 * wordt niets geraden; wat niet in de lijst staat geeft null. Drie: de twee
 * waarden met een aantekening blijven buiten de koppeling.
 */
import { zoekLand } from "./landen";
import {
  LAND_ALIASSEN,
  NIET_KOPPELEN,
  zoekAlias,
  zoekLandMetAlias,
} from "./landenAlias";

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`); }
}

console.log("\n— Elke alias wijst naar een bestaand land —");
const zonderLand = LAND_ALIASSEN.filter(a => !zoekLand(a.land));
ok(
  zonderLand.length === 0
    ? `alle ${LAND_ALIASSEN.length} aliassen vinden hun land`
    : `ONBEKEND LAND bij: ${zonderLand.map(a => `${a.alias} → ${a.land}`).join(", ")}`,
  zonderLand.length === 0,
);
ok("het zijn er 16, precies de goedgekeurde lijst", LAND_ALIASSEN.length === 16);

console.log("\n— Geen dubbelop en geen overlap met de landenlijst —");
const aliassen = LAND_ALIASSEN.map(a => a.alias);
ok("geen dubbele aliassen", new Set(aliassen).size === aliassen.length);
const alEenLand = aliassen.filter(a => zoekLand(a));
ok(
  alEenLand.length === 0
    ? "geen alias is zelf al een landnaam"
    : `OVERLAP: ${alEenLand.join(", ")}`,
  alEenLand.length === 0,
);

console.log("\n— De koppelingen zelf —");
ok("Bengalese → Bangladesh", zoekAlias("Bengalese") === "Bangladesh");
ok("Bangladeshi → Bangladesh", zoekAlias("Bangladeshi") === "Bangladesh");
ok("Gambiaanse → Gambia", zoekAlias("Gambiaanse") === "Gambia");
ok("Agentinian → Argentinië", zoekAlias("Agentinian") === "Argentinië");
ok("Yemen → Jemen", zoekAlias("Yemen") === "Jemen");
ok("Britse → Verenigd Koninkrijk", zoekAlias("Britse") === "Verenigd Koninkrijk");
ok("Nederlands → Nederland", zoekAlias("Nederlands") === "Nederland");
ok("Italian → Italië", zoekAlias("Italian") === "Italië");

console.log("\n— Er wordt niets geraden —");
ok("een onbekende waarde geeft null", zoekAlias("Bengaals") === null);
ok("hoofdletters tellen mee", zoekAlias("bengalese") === null);
ok("lege waarde geeft null", zoekAlias("") === null);
ok("null geeft null", zoekAlias(null) === null);
ok("undefined geeft null", zoekAlias(undefined) === null);
ok("spaties eromheen matchen wel", zoekAlias("  Bengalese  ") === "Bangladesh");

console.log("\n— De twee met een aantekening blijven buiten de lijst —");
for (const waarde of NIET_KOPPELEN) {
  ok(`"${waarde}" wordt niet gekoppeld`, zoekAlias(waarde) === null && !zoekLand(waarde));
}
ok("het zijn er precies twee", NIET_KOPPELEN.length === 2);

console.log("\n— zoekLandMetAlias: echte naam gaat vóór alias —");
const nl = zoekLandMetAlias("Nederland");
ok("Nederland vindt NL zonder alias", nl.land?.iso === "NL" && nl.viaAlias === false);
const via = zoekLandMetAlias("Bengalese");
ok("Bengalese vindt BD via de alias", via.land?.iso === "BD" && via.viaAlias === true);
ok("Bengalese krijgt zone NON_EU", via.land?.zone === "NON_EU");
const it = zoekLandMetAlias("Italian");
ok("Italian krijgt zone EU", it.land?.iso === "IT" && it.land?.zone === "EU");
const nlAlias = zoekLandMetAlias("Nederlands");
ok("Nederlands krijgt zone NL", nlAlias.land?.iso === "NL" && nlAlias.land?.zone === "NL");
const niks = zoekLandMetAlias("Cuba, has a W document");
ok("een aantekening levert geen land", niks.land === undefined && niks.viaAlias === false);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
