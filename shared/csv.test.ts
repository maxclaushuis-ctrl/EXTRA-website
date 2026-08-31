/**
 * Unit-tests voor shared/csv.ts
 * Run met:  npx tsx shared/csv.test.ts
 *
 * De aanleiding staat bovenaan csv.ts: `line.split(',')` verschoof een hele rij
 * zodra er een komma in een notitieveld stond. De eerste twee tests hieronder
 * zijn precies dat geval.
 */
import { parseCsv, parseCsvMetKoppen } from "./csv";

let passed = 0;
let failed = 0;
function ok(label: string, voorwaarde: boolean) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`); }
}
const zelfde = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

console.log("\n— Het geval waar de oude parser op stukliep —");
ok("komma binnen aanhalingstekens blijft één veld",
  zelfde(parseCsv('a,"b,c",d'), [["a", "b,c", "d"]]));
ok("een notitie met komma schuift de rij niet op", (() => {
  const r = parseCsvMetKoppen(
    'email,twvStatus,twvNotes\njan@x.nl,twv_verstrekt,"Verlengd, wacht op IND"');
  return r[0].twvstatus === "twv_verstrekt" && r[0].twvnotes === "Verlengd, wacht op IND";
})());

console.log("\n— Aanhalingstekens —");
ok('"" wordt één aanhalingsteken',
  zelfde(parseCsv('a,"zeg ""hallo""",b'), [["a", 'zeg "hallo"', "b"]]));
ok("regeleinde binnen een veld blijft in dat veld",
  zelfde(parseCsv('a,"regel1\nregel2",c'), [["a", "regel1\nregel2", "c"]]));
ok("een aanhalingsteken midden in een veld is gewoon tekst",
  zelfde(parseCsv('5" plank,b'), [['5" plank', "b"]]));

console.log("\n— Regeleindes en lege regels —");
ok("\\r\\n telt als één regeleinde",
  zelfde(parseCsv("a,b\r\nc,d"), [["a", "b"], ["c", "d"]]));
ok("lege regels vervallen",
  zelfde(parseCsv("a,b\n\n\nc,d"), [["a", "b"], ["c", "d"]]));
ok("een rij met lege velden blijft staan",
  zelfde(parseCsv("a,b\n,,"), [["a", "b"], ["", "", ""]]));
ok("laatste regel zonder regeleinde telt mee",
  zelfde(parseCsv("a,b\nc,d"), [["a", "b"], ["c", "d"]]));
ok("lege invoer geeft niets", zelfde(parseCsv(""), []));

console.log("\n— Excel-eigenaardigheden —");
ok("BOM verdwijnt uit de eerste kolomkop",
  parseCsvMetKoppen("﻿email,naam\njan@x.nl,Jan")[0].email === "jan@x.nl");
ok("puntkomma als scheidingsteken",
  zelfde(parseCsv("a;b;c", { scheidingsteken: ";" }), [["a", "b", "c"]]));

console.log("\n— Koppen —");
const metKoppen = parseCsvMetKoppen(
  "email,firstName,lastName,twvStatus,twvStartDate,twvEndDate,twvNotes\n" +
  "jan@example.com,Jan,Jansen,twv_verstrekt,2024-01-01,2025-01-01,Verlengd");
ok("één rij", metKoppen.length === 1);
ok("koppen zijn kleingemaakt", metKoppen[0].firstname === "Jan");
ok("datums komen heel binnen", metKoppen[0].twvenddate === "2025-01-01");
ok("spaties eromheen zijn weg",
  parseCsvMetKoppen("email , naam\n jan@x.nl , Jan ")[0].naam === "Jan");
ok("te korte rij geeft lege strings in plaats van undefined",
  parseCsvMetKoppen("a,b,c\n1,2")[0].c === "");

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
