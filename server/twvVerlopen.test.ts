/**
 * Unit-tests voor server/twvVerlopen.ts
 * Run met:  npx tsx server/twvVerlopen.test.ts
 *
 * Geen test-framework en geen database: print PASS/FAIL en exit non-zero bij
 * fouten. De beslissing is een pure functie met `vandaag` als argument, juist
 * zodat deze tests niet afhangen van wanneer ze draaien.
 *
 * De grensgevallen zijn hier het punt. Een vergunning die vandaag afloopt is
 * vandaag nog geldig; pas morgen is hij verlopen. Eén dag verschil is het
 * verschil tussen iemand terecht inplannen en iemand onterecht laten werken.
 */
import {
  moetVerlopen,
  dagenVerlopen,
  bepaalVerlopenRijen,
  bepaalLegeStatusRijen,
  moetMeldenVerlopen,
  bepaalTeMeldenRijen,
  bepaalTegenstrijdigeRijen,
  naarDag,
} from "./twvVerlopen";

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`); }
}

const VANDAAG = new Date("2026-06-15T11:30:00");

console.log("\n— De grens ligt op de einddatum zelf —");
ok("gisteren verlopen → wel",
  moetVerlopen({ id: 1, twvStatus: 'twv_verstrekt', twvEndDate: "2026-06-14" }, VANDAAG));
ok("verloopt vandaag → NIET (vandaag nog geldig)",
  !moetVerlopen({ id: 2, twvStatus: 'twv_verstrekt', twvEndDate: "2026-06-15" }, VANDAAG));
ok("verloopt morgen → niet",
  !moetVerlopen({ id: 3, twvStatus: 'twv_verstrekt', twvEndDate: "2026-06-16" }, VANDAAG));
ok("vorig jaar verlopen → wel",
  moetVerlopen({ id: 4, twvStatus: 'twv_verstrekt', twvEndDate: "2025-01-01" }, VANDAAG));
ok("het tijdstip binnen vandaag doet niet mee",
  moetVerlopen({ id: 5, twvStatus: 'twv_verstrekt', twvEndDate: "2026-06-14" }, new Date("2026-06-15T00:00:01")));

console.log("\n— Alleen verstrekte vergunningen verlopen —");
for (const status of ['twv_nodig', 'twv_aangevraagd', 'info_nodig', 'twv_verlopen'] as const) {
  ok(`${status} met verstreken datum → niet aanraken`,
    !moetVerlopen({ id: 6, twvStatus: status, twvEndDate: "2020-01-01" }, VANDAAG));
}
ok("lege status met verstreken datum → niet aanraken",
  !moetVerlopen({ id: 7, twvStatus: null, twvEndDate: "2020-01-01" }, VANDAAG));

console.log("\n— Zonder einddatum gebeurt er niets —");
ok("verstrekt zonder einddatum → niet",
  !moetVerlopen({ id: 8, twvStatus: 'twv_verstrekt', twvEndDate: null }, VANDAAG));
ok("lege string als datum → niet",
  !moetVerlopen({ id: 9, twvStatus: 'twv_verstrekt', twvEndDate: "" }, VANDAAG));
ok("onleesbare datum geeft null", naarDag("31-12-2020") === null);
ok("en verloopt dus niet",
  !moetVerlopen({ id: 10, twvStatus: 'twv_verstrekt', twvEndDate: "31-12-2020" }, VANDAAG));
ok("een Date-object werkt net zo goed als een string",
  moetVerlopen({ id: 11, twvStatus: 'twv_verstrekt', twvEndDate: new Date("2026-06-01T09:00:00") }, VANDAAG));

console.log("\n— dagenVerlopen —");
ok("gisteren = 1 dag", dagenVerlopen({ id: 12, twvEndDate: "2026-06-14" }, VANDAAG) === 1);
ok("vandaag = 0 dagen", dagenVerlopen({ id: 13, twvEndDate: "2026-06-15" }, VANDAAG) === 0);
ok("morgen = -1", dagenVerlopen({ id: 14, twvEndDate: "2026-06-16" }, VANDAAG) === -1);
ok("geen datum = 0", dagenVerlopen({ id: 15, twvEndDate: null }, VANDAAG) === 0);

console.log("\n— De selectie over een hele lijst —");
const lijst = [
  { id: 101, twvStatus: 'twv_verstrekt', twvEndDate: "2026-06-14" },  // wel
  { id: 102, twvStatus: 'twv_verstrekt', twvEndDate: "2026-06-15" },  // niet: vandaag
  { id: 103, twvStatus: 'twv_verstrekt', twvEndDate: null },          // niet: geen datum
  { id: 104, twvStatus: 'twv_verlopen',  twvEndDate: "2020-01-01" },  // niet: al verlopen
  { id: 105, twvStatus: 'twv_nodig',     twvEndDate: "2020-01-01" },  // niet: andere status
  { id: 106, twvStatus: 'twv_verstrekt', twvEndDate: "2019-03-03" },  // wel
];
const teVerlopen = bepaalVerlopenRijen(lijst, VANDAAG);
ok("twee van de zes", teVerlopen.length === 2);
ok("en het zijn 101 en 106", teVerlopen.map(r => r.id).join(",") === "101,106");
ok("de invoerlijst is niet gewijzigd", lijst[0].twvStatus === 'twv_verstrekt');

console.log("\n— Lege status op de TWV-lijst —");
const metLege = [
  { id: 201, needsTwv: true,  twvStatus: null },
  { id: 202, needsTwv: true,  twvStatus: undefined },
  { id: 203, needsTwv: true,  twvStatus: 'twv_nodig' },
  { id: 204, needsTwv: false, twvStatus: null },        // niet: staat niet op de lijst
];
const leeg = bepaalLegeStatusRijen(metLege);
ok("twee rijen met een lege status", leeg.length === 2);
ok("en het zijn 201 en 202", leeg.map(r => r.id).join(",") === "201,202");
ok("een rij zonder needsTwv telt niet mee", !leeg.some(r => r.id === 204));

// ── De meldingsronde ─────────────────────────────────────────────────────────
//
// Dit blok bestaat om één concrete fout: de eerste versie filterde alleen op
// status en op "er staat een einddatum". In productie stond één rij op
// twv_verlopen met einddatum 2027-04-09 — met de hand of via een import zo
// gezet. Die had een mail gekregen met "verlopen op 9 april 2027".
console.log("\n— Wie een verlopen-melding krijgt —");
ok("verlopen sinds gisteren, nog niet gemeld → wel",
  moetMeldenVerlopen({ id: 300, twvStatus: 'twv_verlopen', twvEndDate: "2026-06-14" }, VANDAAG));
ok("einddatum in de toekomst → niet, wat de status ook zegt",
  !moetMeldenVerlopen({ id: 301, twvStatus: 'twv_verlopen', twvEndDate: "2027-04-09" }, VANDAAG));
ok("einddatum is vandaag → niet, vandaag is hij nog geldig",
  !moetMeldenVerlopen({ id: 302, twvStatus: 'twv_verlopen', twvEndDate: "2026-06-15" }, VANDAAG));
ok("geen einddatum → niet",
  !moetMeldenVerlopen({ id: 303, twvStatus: 'twv_verlopen', twvEndDate: null }, VANDAAG));
ok("al gemeld → niet nog een keer",
  !moetMeldenVerlopen({ id: 304, twvStatus: 'twv_verlopen', twvEndDate: "2026-06-14", twvExpiredNotifiedAt: new Date("2026-06-15") }, VANDAAG));
ok("status twv_verstrekt met verstreken datum → niet hier; die gaat eerst door verwerkVerlopenTwv",
  !moetMeldenVerlopen({ id: 305, twvStatus: 'twv_verstrekt', twvEndDate: "2020-01-01" }, VANDAAG));
ok("onleesbare datum → niet",
  !moetMeldenVerlopen({ id: 306, twvStatus: 'twv_verlopen', twvEndDate: "31-12-2020" }, VANDAAG));

const meldLijst = [
  { id: 401, twvStatus: 'twv_verlopen',  twvEndDate: "2026-06-14", twvExpiredNotifiedAt: null },
  { id: 402, twvStatus: 'twv_verlopen',  twvEndDate: "2027-04-09", twvExpiredNotifiedAt: null },
  { id: 403, twvStatus: 'twv_verlopen',  twvEndDate: "2026-06-15", twvExpiredNotifiedAt: null },
  { id: 404, twvStatus: 'twv_verlopen',  twvEndDate: "2020-01-01", twvExpiredNotifiedAt: new Date("2025-01-01") },
  { id: 405, twvStatus: 'twv_verstrekt', twvEndDate: "2020-01-01", twvExpiredNotifiedAt: null },
  { id: 406, twvStatus: 'twv_verlopen',  twvEndDate: null,         twvExpiredNotifiedAt: null },
];
const teMelden = bepaalTeMeldenRijen(meldLijst, VANDAAG);
ok("één van de zes krijgt een melding", teMelden.length === 1);
ok("en dat is 401", teMelden.map(r => r.id).join(",") === "401");
ok("de invoerlijst is niet gewijzigd", meldLijst[1].twvExpiredNotifiedAt === null);

console.log("\n— Rijen waarvan status en datum elkaar tegenspreken —");
const tegenstrijdig = bepaalTegenstrijdigeRijen(meldLijst, VANDAAG);
ok("twee tegenstrijdige rijen", tegenstrijdig.length === 2);
ok("en dat zijn 402 en 403", tegenstrijdig.map(r => r.id).join(",") === "402,403");
ok("een rij zonder einddatum is niet tegenstrijdig, alleen onvolledig",
  !tegenstrijdig.some(r => r.id === 406));
ok("een al gemelde rij met verstreken datum is niet tegenstrijdig",
  !tegenstrijdig.some(r => r.id === 404));

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
