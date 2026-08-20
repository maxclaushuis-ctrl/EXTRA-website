/**
 * Unit-tests voor shared/taal.ts
 * Run met:  npx tsx shared/taal.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 */
import { isEngelsPad, taalVanPad } from "./taal";

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`); }
}

console.log("\n— Engels —");
ok("/en zelf", isEngelsPad("/en"));
ok("/en met schuine streep", isEngelsPad("/en/"));
ok("een Engelse pagina", isEngelsPad("/en/hotel-staffing-amsterdam"));
ok("met query-string", isEngelsPad("/en/contact?ref=footer"));
ok("met hash", isEngelsPad("/en/about#team"));

console.log("\n— Nederlands —");
ok("de homepage", !isEngelsPad("/"));
ok("een gewone pagina", !isEngelsPad("/vacatures"));
ok("een pad dat met en begint maar het niet is", !isEngelsPad("/energie"));
ok("en zonder schuine streep vooraan", !isEngelsPad("en/contact"));
ok("leeg", !isEngelsPad(""));
ok("null", !isEngelsPad(null));
ok("undefined", !isEngelsPad(undefined));

console.log("\n— taalVanPad —");
ok("nl", taalVanPad("/vacatures") === "nl");
ok("en", taalVanPad("/en/rewards") === "en");
ok("null valt terug op nl", taalVanPad(null) === "nl");

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
