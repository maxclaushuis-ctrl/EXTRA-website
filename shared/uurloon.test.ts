/**
 * Tests voor het lezen van een uurloon uit de vacaturewizard.
 * Draaien: npm run uurloon:test
 */
import { leesUurloon } from "./uurloon";

let gefaald = 0;
let geslaagd = 0;

function eq(omschrijving: string, gekregen: unknown, verwacht: unknown) {
  const gelijk = Object.is(gekregen, verwacht);
  if (!gelijk) {
    console.log(`    verwacht: ${JSON.stringify(verwacht)}`);
    console.log(`    gekregen: ${JSON.stringify(gekregen)}`);
    gefaald++;
    console.log(`  ✗ ${omschrijving}`);
  } else {
    geslaagd++;
    console.log(`  ✓ ${omschrijving}`);
  }
}

console.log("\nNEDERLANDSE EN ENGELSE NOTATIE\n");

eq("komma als scheidingsteken", leesUurloon("18,00"), 18);
eq("punt als scheidingsteken", leesUurloon("18.00"), 18);
eq("heel getal", leesUurloon("18"), 18);
eq("halve cent", leesUurloon("18,55"), 18.55);
eq("euroteken ervoor", leesUurloon("€18,00"), 18);
eq("euroteken met spatie", leesUurloon("€ 18,50"), 18.5);
eq("spaties eromheen", leesUurloon("  18,00  "), 18);

console.log("\nWAT ER GEEN BEDRAG IS\n");

eq("lege string", leesUurloon(""), null);
eq("null", leesUurloon(null), null);
eq("undefined", leesUurloon(undefined), null);
eq("tekst", leesUurloon("op aanvraag"), null);
eq("bereik", leesUurloon("14-18"), null);
eq("twee scheidingstekens", leesUurloon("1.250,00"), null);
eq("nul is geen loon", leesUurloon("0"), null);
eq("nul met decimalen ook niet", leesUurloon("0,00"), null);
eq("negatief", leesUurloon("-5"), null);
eq("losse komma", leesUurloon(","), null);

console.log("\nGETALLEN DIE ER AL IN STAAN\n");

eq("een echt getal blijft", leesUurloon(18.5), 18.5);
eq("nul als getal is null", leesUurloon(0), null);
eq("NaN is null", leesUurloon(NaN), null);
eq("oneindig is null", leesUurloon(Infinity), null);

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald\n`);
process.exit(gefaald > 0 ? 1 : 0);
