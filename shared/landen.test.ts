/**
 * Unit-tests voor shared/landen.ts
 * Run met:  npx tsx shared/landen.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 *
 * Het zwaartepunt ligt op ÉÉN vraag: verandert er iets aan het gedrag van het
 * aanmeldformulier? De lijst is verhuisd uit Aanmelden.tsx, en een verhuizing
 * die stilletjes een land laat vallen of een andere flow oplevert is erger dan
 * geen verhuizing. Daarom staan de oude ALL_COUNTRIES en de oude getFlow()
 * hieronder letterlijk overgeschreven, en vergelijken we regel voor regel.
 */
import {
  LANDEN,
  ALLE_LANDNAMEN,
  EU_EER_LANDNAMEN,
  bepaalZone,
  landcode,
  zoekLand,
} from "./landen";

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`); }
}

// ── De oude code, letterlijk overgenomen uit Aanmelden.tsx op commit a38792b ──
const OUD_EU_EER = [
  "Oostenrijk", "België", "Bulgarije", "Kroatië", "Cyprus", "Tsjechië",
  "Denemarken", "Estland", "Finland", "Frankrijk", "Duitsland", "Griekenland",
  "Hongarije", "Ierland", "Italië", "Letland", "Litouwen", "Luxemburg",
  "Malta", "Polen", "Portugal", "Roemenië", "Slowakije", "Slovenië",
  "Spanje", "Zweden", "IJsland", "Liechtenstein", "Noorwegen", "Zwitserland",
  "Curaçao", "Aruba", "Sint Maarten", "Bonaire", "Sint Eustatius", "Saba",
];

const OUD_OVERIG = [
  "Afghanistan", "Albanië", "Algerije", "Angola", "Argentinië", "Armenië",
  "Australië", "Azerbeidzjan", "Bangladesh", "Belarus", "Bhutan", "Bolivia",
  "Bosnië en Herzegovina", "Brazilië", "Cambodja", "Cameroen", "Canada",
  "Chili", "China", "Colombia", "Congo", "Cuba", "Dominicaanse Republiek",
  "Ecuador", "Egypte", "El Salvador", "Eritrea", "Ethiopië", "Filipijnen",
  "Georgië", "Ghana", "Guatemala", "Guinee", "Haïti", "Honduras",
  "India", "Indonesië", "Irak", "Iran", "Israël", "Ivoorkust",
  "Jamaica", "Japan", "Jemen", "Jordanië", "Kaapverdië", "Kazachstan",
  "Kenia", "Kirgizië", "Kosovo", "Koeweit", "Laos", "Libanon",
  "Libië", "Marokko", "Mexico", "Moldavië", "Mongolië", "Montenegro",
  "Mozambique", "Myanmar", "Nepal", "Nicaragua", "Nigeria", "Noord-Macedonië",
  "Oekraïne", "Oezbekistan", "Oman", "Pakistan", "Panama", "Paraguay",
  "Peru", "Russische Federatie", "Rwanda", "Saudi-Arabië", "Senegal",
  "Servië", "Sierra Leone", "Singapore", "Somalië", "Sri Lanka",
  "Sudan", "Suriname", "Syrië", "Tadzjikistan", "Tanzania", "Thailand",
  "Togo", "Tunesië", "Turkije", "Turkmenistan", "Uganda", "Uruguay",
  "Venezuela", "Verenigd Koninkrijk", "Verenigde Arabische Emiraten",
  "Verenigde Staten", "Vietnam", "Zuid-Afrika", "Zuid-Korea", "Zuid-Sudan",
];

const OUD_ALL_COUNTRIES = ["Nederland", ...[...OUD_EU_EER].sort(), "---", ...OUD_OVERIG];

function oudeGetFlow(nationality: string): "NL" | "EU" | "NON_EU" {
  if (nationality === "Nederland") return "NL";
  const NL_CARIBBEAN = ["Curaçao", "Aruba", "Sint Maarten", "Bonaire", "Sint Eustatius", "Saba"];
  if (NL_CARIBBEAN.includes(nationality)) return "NL";
  if (OUD_EU_EER.includes(nationality)) return "EU";
  return "NON_EU";
}

// ── De dropdown moet identiek blijven ────────────────────────────────────────
console.log("\n— Dropdown-volgorde gelijk aan de oude ALL_COUNTRIES —");
ok(`even lang (${ALLE_LANDNAMEN.length})`, ALLE_LANDNAMEN.length === OUD_ALL_COUNTRIES.length);
const eersteAfwijking = ALLE_LANDNAMEN.findIndex((n, i) => n !== OUD_ALL_COUNTRIES[i]);
ok(
  eersteAfwijking === -1
    ? "regel voor regel identiek"
    : `AFWIJKING op positie ${eersteAfwijking}: "${ALLE_LANDNAMEN[eersteAfwijking]}" vs "${OUD_ALL_COUNTRIES[eersteAfwijking]}"`,
  eersteAfwijking === -1,
);
ok("Nederland staat vooraan", ALLE_LANDNAMEN[0] === "Nederland");
ok("scheidingsteken staat op dezelfde plek", ALLE_LANDNAMEN.indexOf("---") === OUD_ALL_COUNTRIES.indexOf("---"));

// ── De zone-indeling moet identiek blijven ───────────────────────────────────
console.log("\n— bepaalZone geeft hetzelfde als de oude getFlow —");
const zoneAfwijkingen = OUD_ALL_COUNTRIES
  .filter(n => n !== "---")
  .filter(n => bepaalZone(n) !== oudeGetFlow(n));
ok(
  zoneAfwijkingen.length === 0
    ? `alle ${OUD_ALL_COUNTRIES.length - 1} landen gelijk`
    : `AFWIJKING bij: ${zoneAfwijkingen.join(", ")}`,
  zoneAfwijkingen.length === 0,
);
ok("Nederland is NL", bepaalZone("Nederland") === "NL");
ok("Bonaire is NL, niet EU", bepaalZone("Bonaire") === "NL");
ok("Polen is EU", bepaalZone("Polen") === "EU");
ok("Zwitserland is EU (bestaande werking)", bepaalZone("Zwitserland") === "EU");
ok("Bangladesh is NON_EU", bepaalZone("Bangladesh") === "NON_EU");

console.log("\n— Onbekende invoer valt naar de veilige kant —");
ok("onbekend land is NON_EU", bepaalZone("Bangladeshi") === "NON_EU");
ok("leeg is NON_EU", bepaalZone("") === "NON_EU");
ok("null is NON_EU", bepaalZone(null) === "NON_EU");
ok("undefined is NON_EU", bepaalZone(undefined) === "NON_EU");

// ── Landcodes ────────────────────────────────────────────────────────────────
console.log("\n— Landcodes —");
ok(`elk land heeft er één (${LANDEN.length} landen)`, LANDEN.every(l => /^[A-Z]{2}$/.test(l.iso)));
ok("Nederland → NL", landcode("Nederland") === "NL");
ok("Bangladesh → BD", landcode("Bangladesh") === "BD");
ok("Sierra Leone → SL", landcode("Sierra Leone") === "SL");
ok("Verenigd Koninkrijk → GB", landcode("Verenigd Koninkrijk") === "GB");

console.log("\n— Geen gok bij onbekende namen —");
ok('"Bangladeshi" geeft null, geen BD', landcode("Bangladeshi") === null);
ok('"Sierra Leoonse" geeft null', landcode("Sierra Leoonse") === null);
ok('"nederland" (kleine letter) geeft null', landcode("nederland") === null);
ok("lege waarde geeft null", landcode("") === null);
ok("null geeft null", landcode(null) === null);
ok("spaties eromheen matchen wel", landcode("  Nederland  ") === "NL");

console.log("\n— Lijstintegriteit —");
const namen = LANDEN.map(l => l.naam);
ok("geen dubbele landnamen", new Set(namen).size === namen.length);
ok("evenveel landen als in de oude lijsten", LANDEN.length === 1 + OUD_EU_EER.length + OUD_OVERIG.length);
ok("EU/EER-groep telt 36", EU_EER_LANDNAMEN.length === 36);
ok("zoekLand geeft het hele object terug", zoekLand("Polen")?.iso === "PL" && zoekLand("Polen")?.zone === "EU");

// Dubbele codes mogen, maar alleen waar de codelijst ze zelf niet uitsplitst.
const codeTelling = new Map<string, string[]>();
for (const l of LANDEN) codeTelling.set(l.iso, [...(codeTelling.get(l.iso) ?? []), l.naam]);
const dubbel = [...codeTelling.entries()].filter(([, n]) => n.length > 1);
ok(
  "alleen BQ komt vaker voor, en precies drie keer",
  dubbel.length === 1 && dubbel[0][0] === "BQ" && dubbel[0][1].length === 3,
);
console.log(`    (BQ wordt gedeeld door: ${codeTelling.get("BQ")?.join(", ")})`);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
