/**
 * Tests voor het reviewcijfer.
 *
 * De laatste test is de belangrijkste: die scant de publieke client-broncode op
 * losse reviewaantallen. Die scan is de reden dat de vier getallen (188, 215,
 * 232, 234) niet nog eens terugkomen.
 *
 * Draaien: npm run reviews:test
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import {
  REVIEW_AANTAL,
  REVIEW_SCORE,
  reviewScoreTekst,
  reviewAantalTekst,
  reviewScoreUitVijf,
} from "./reviews";

let gefaald = 0;
let geslaagd = 0;

function ok(omschrijving: string, waar: boolean) {
  if (waar) {
    geslaagd++;
    console.log(`  ✓ ${omschrijving}`);
  } else {
    gefaald++;
    console.log(`  ✗ ${omschrijving}`);
  }
}

function eq(omschrijving: string, gekregen: unknown, verwacht: unknown) {
  const gelijk = JSON.stringify(gekregen) === JSON.stringify(verwacht);
  if (!gelijk) {
    console.log(`    verwacht: ${JSON.stringify(verwacht)}`);
    console.log(`    gekregen: ${JSON.stringify(gekregen)}`);
  }
  ok(omschrijving, gelijk);
}

console.log("\nREVIEWCIJFER\n");

eq("het aantal is 237", REVIEW_AANTAL, 237);
eq("de score is 4,8", REVIEW_SCORE, 4.8);

ok("het aantal is een geheel getal", Number.isInteger(REVIEW_AANTAL));
ok("het aantal is positief", REVIEW_AANTAL > 0);
ok("de score ligt tussen 1 en 5", REVIEW_SCORE >= 1 && REVIEW_SCORE <= 5);

console.log("\nWEERGAVE\n");

eq("Nederlands gebruikt een komma", reviewScoreTekst("nl"), "4,8");
eq("Engels gebruikt een punt", reviewScoreTekst("en"), "4.8");
eq("zonder taal is het Nederlands", reviewScoreTekst(), "4,8");
eq("het aantal met woord erbij", reviewAantalTekst(), "237 Google reviews");
eq("score uit vijf, Nederlands", reviewScoreUitVijf("nl"), "4,8/5");
eq("score uit vijf, Engels", reviewScoreUitVijf("en"), "4.8/5");

ok("de score houdt één decimaal", reviewScoreTekst("en").split(".")[1].length === 1);
ok("het aantal komt letterlijk in de tekst voor", reviewAantalTekst().includes(String(REVIEW_AANTAL)));

console.log("\nGEEN LOSSE GETALLEN IN DE BRONCODE\n");

/**
 * Alles onder client/src, behalve de mappen die niet publiek zijn. Het
 * dashboard en het CRM tonen eigen cijfers die hier niets mee te maken hebben.
 */
const NIET_SCANNEN = ["dashboard", "crm", "components/crm", "layoutHarness.tsx"];

function bestandenOnder(map: string): string[] {
  const gevonden: string[] = [];
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam);
    if (NIET_SCANNEN.some(uitzondering => pad.includes(uitzondering))) continue;
    if (statSync(pad).isDirectory()) {
      gevonden.push(...bestandenOnder(pad));
    } else if (naam.endsWith(".tsx") || naam.endsWith(".ts")) {
      gevonden.push(pad);
    }
  }
  return gevonden;
}

/** "232 Google reviews", "215 reviews", "4,8 uit 188 reviews" — allemaal fout. */
const LOS_AANTAL = /\b\d{2,4}\s*(google\s+)?reviews\b/i;

const clientMap = join(process.cwd(), "client", "src");
const overtredingen: string[] = [];

for (const bestand of bestandenOnder(clientMap)) {
  const regels = readFileSync(bestand, "utf8").split("\n");
  regels.forEach((regel, i) => {
    if (LOS_AANTAL.test(regel)) {
      overtredingen.push(`${bestand.replace(process.cwd() + "/", "")}:${i + 1} → ${regel.trim()}`);
    }
  });
}

if (overtredingen.length > 0) {
  console.log("    losse reviewaantallen gevonden:");
  for (const regel of overtredingen) console.log(`      ${regel}`);
}
ok(
  `geen enkel ingetypt reviewaantal in client/src (${overtredingen.length} gevonden)`,
  overtredingen.length === 0,
);

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald\n`);
process.exit(gefaald > 0 ? 1 : 0);
