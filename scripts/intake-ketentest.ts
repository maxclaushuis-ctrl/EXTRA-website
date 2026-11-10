/**
 * Ketentest formulier versie 2: van nieuwe intake tot medewerkersdossier, tegen de echte
 * routes en de echte database van de testomgeving.
 *
 *   npm run intake:ketentest
 *
 * Alleen in de testomgeving (TESTOMGEVING=1). De test maakt eigen, fictieve kandidaten aan
 * (bron "ketentest", e-mail op voorbeeld.nl), verwijdert niets en verstuurt niets: afwijzen
 * gebeurt zonder mail en er gaat geen bericht naar WhatsApp of Job.
 *
 * De routes draaien in dit proces op een eigen poort, met dezelfde code als de site. Alleen het
 * inloggen is vervangen: de test geeft per verzoek mee als welke bestaande gebruiker hij werkt.
 * Dat inloggen zelf afgeschermd is, wordt apart getest tegen de draaiende site.
 */
import express from "express";
import { createHash, randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db, pool } from "../server/db";
import { candidates, cvAnalyses, employees, intakeAntwoorden, jobBerichten, jobGesprekken, sollicitantDossiers, sollicitantGebeurtenissen, users } from "../shared/schema";
import { registerSollicitantenRoutes } from "../server/sollicitanten/sollicitantRoutes";
import { ensureDatabaseSchema } from "../server/ensureSchema";
import { kpis, plannerskaart, startIntake, voorbereiding, weekpatroon, type IntakeV2 } from "../shared/intakeV2";

if (process.env.TESTOMGEVING !== "1") { console.error("Deze test draait alleen in de testomgeving (TESTOMGEVING=1)."); process.exit(1); }

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}
const kop = (t: string) => console.log(`\n── ${t}`);

const run = `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
const mijn: number[] = [];
let nr = 0;
async function kandidaat(o: Partial<typeof candidates.$inferInsert> & { voornaam: string; functionType: string }) {
  nr++;
  const { voornaam, ...rest } = o;
  const [c] = await db.insert(candidates).values({
    firstName: voornaam, lastName: "Ketentest", email: `ketentest.${run}.${nr}@voorbeeld.nl`, phone: null, birthDate: "1999-04-12",
    nationality: "Nederlandse", nationalityIso: "NL", nationalityZone: "NL", city: "Amsterdam", language: "Nederlands",
    // Geen gespreksdatum: zo komen de testpersonen niet in de weekagenda van Sollicitanten te staan.
    status: "gepland", interviewDate: null, interviewTime: null, sourceChannel: "ketentest", hasCv: false,
    ...rest,
  } as any).returning();
  mijn.push(c.id);
  return c;
}
/** Vingerafdruk van alle dossiers die niet van deze test zijn: die mogen nergens door veranderen. */
async function afdrukAnderen() {
  const rijen = mijn.length ? await db.select().from(sollicitantDossiers).where(notInArray(sollicitantDossiers.candidateId, mijn)).orderBy(sollicitantDossiers.id) : await db.select().from(sollicitantDossiers).orderBy(sollicitantDossiers.id);
  const [k] = await db.select({ n: sql<number>`count(*)::int` }).from(candidates).where(mijn.length ? notInArray(candidates.id, mijn) : sql`true`);
  return { n: rijen.length, kandidaten: k.n, hash: createHash("sha256").update(JSON.stringify(rijen)).digest("hex") };
}

async function main() {
  await ensureDatabaseSchema();
  const gebruikers = await db.select({ id: users.id, firstName: users.firstName }).from(users).orderBy(users.id).limit(2);
  if (!gebruikers.length) { console.error("Geen gebruikers in deze database."); process.exit(1); }
  const A = gebruikers[0], B = gebruikers[1] || gebruikers[0];

  const app = express();
  app.use(express.json({ limit: "2mb" }));
  let ingelogd = true;
  registerSollicitantenRoutes(app, (req, res, next) => {
    if (!ingelogd) return res.status(401).json({ message: "Niet ingelogd" });
    (req as any).session = { userId: Number(req.headers["x-test-gebruiker"]) || A.id };
    next();
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const basis = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/sollicitanten`;
  async function roep(pad: string, o: { method?: string; body?: unknown; als?: number } = {}) {
    const r = await fetch(basis + pad, { method: o.method || "GET", headers: { "Content-Type": "application/json", "x-test-gebruiker": String(o.als ?? A.id) }, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
    return { status: r.status, d: (await r.json().catch(() => ({}))) as any };
  }

  const vooraf = await afdrukAnderen();
  const berichtenVooraf = (await db.select({ n: sql<number>`count(*)::int` }).from(jobBerichten))[0].n;
  const v1Vooraf = await db.select().from(sollicitantDossiers).where(and(eq(sollicitantDossiers.intakeStatus, "afgerond"), eq(sollicitantDossiers.intakeVersie, 1))).orderBy(sollicitantDossiers.id);

  // ── 1 en 2: versie 1 blijft werken ────────────────────────────────────────
  kop("Het oude formulier en bestaande dossiers");
  test("1 bestaande afgeronde intakes staan op versie 1", v1Vooraf.every((d) => d.intakeVersie === 1 && d.intakeRevisie === 0), `${v1Vooraf.length} dossiers`);
  if (v1Vooraf[0]) {
    const k = await roep(`/kaart/${v1Vooraf[0].candidateId}`);
    test("1 een oud dossier opent als versie 1 met dezelfde antwoorden", k.d.intakeVersie === 1 && k.d.voortraject === null && JSON.stringify(k.d.dossier.intake) === JSON.stringify(v1Vooraf[0].intake));
    const p = await roep(`/intake2/${v1Vooraf[0].candidateId}`, { method: "PUT", body: { intake: { _versie: 2 }, revisie: 0 } });
    test("1 het nieuwe formulier kan een oud dossier niet overschrijven", p.status === 409, String(p.status));
  } else console.log("  (geen bestaande afgeronde intake van versie 1 in deze database: overgeslagen)");

  const oud = await kandidaat({ voornaam: "Oscar", functionType: "horecamedewerker" });
  await db.insert(sollicitantDossiers).values({ candidateId: oud.id, stap: "gesprek_gepland", intakeStatus: "concept", intakeStap: 3, intake: { id_gezien: "Gezien", talen: ["Nederlands"], ervaring_jaren: "1-2" }, intakeDoor: "Sanne de Wit" });
  {
    const k = await roep(`/kaart/${oud.id}`);
    test("2 een concept van het oude formulier blijft versie 1, ook met de schakelaar aan", k.d.intakeVersie === 1 && k.d.dossier.intakeStap === 3);
    const fout = await roep(`/intake2/${oud.id}`, { method: "PUT", body: { intake: { _versie: 2 }, revisie: 0 } });
    test("2 het nieuwe formulier weigert een oud concept", fout.status === 409 && /oude formulier/.test(fout.d.message), fout.d.message);
    const p = await roep(`/intake/${oud.id}`, { method: "PUT", body: { intake: { id_gezien: "Gezien", talen: ["Nederlands"], ervaring_jaren: "1-2", uren: 16, referentie: { naam: "Fictieve Referent", telefoon: "0600000000" } }, stap: 8 } });
    const a = await roep(`/intake/${oud.id}/afronden`, { method: "POST", body: {} });
    test("2 het oude concept is in het oude formulier af te maken", p.status === 200 && a.status === 200 && a.d.stap === "beoordelen");
    const b = await roep(`/beoordeling/${oud.id}`, { method: "PUT", body: { beoordeling: { communicatief: 70, representatief: 60, extravert: 40, indruk: 65 } } });
    const n = await roep(`/actie/${oud.id}`, { method: "POST", body: { actie: "naar_check" } });
    const [d] = await db.select().from(sollicitantDossiers).where(eq(sollicitantDossiers.candidateId, oud.id));
    test("2 de oude beoordeling met vier schuiven werkt nog", b.status === 200 && n.status === 200 && d.stap === "ref_doc_check" && (d.beoordeling as any).extravert === 40 && d.intakeVersie === 1);
    test("2 de nieuwe beoordeling raakt een oud dossier niet", (await roep(`/beoordeling2/${oud.id}`, { method: "PUT", body: { beoordeling: { communicatief: 10 } } })).status === 409);
  }

  // ── 3, 4, 7: nieuwe intake, juiste persoon, gegevens uit het voortraject ──
  kop("Nieuwe intake met gegevens uit Job en cv");
  const fleur = await kandidaat({ voornaam: "Fleur", functionType: "housekeeping", functieEersteKeus: "housekeeping", hasCv: true, cvFilename: `cv/ketentest-${run}.pdf`, bronDetails: { branche: "hotels" } } as any);
  await db.insert(jobGesprekken).values({ candidateId: fleur.id, token: randomBytes(24).toString("base64url"), kanaal: "web", taal: "nl", status: "gepland",
    velden: { ervaring: "3 jaar in hotels", ervaringNiveau: "geen", diensten: "3-4", werkmoment: "avond_weekend", startdatum: "direct", werkgebied: "tot 15 km", vervoer: "fiets en ov", talen: "Nederlands en Engels" },
    twijfels: ["Vraag van de kandidaat: krijg ik reiskosten vergoed?"] } as any);
  await db.insert(cvAnalyses).values({ candidateId: fleur.id, bestand: `cv/ketentest-${run}.pdf`, soort: "pdf", status: "klaar", tekens: 1200, model: "ketentest",
    periodes: [{ functie: "Kamermeisje", werkgever: "Hotel Voorbeeld", soort: "zelfde", kerntaken: [0, 1], begin: "2024-01", einde: "2025-06", bron: "cv" }], certificaten: [] });
  const aantalVoor = (await db.select({ n: sql<number>`count(*)::int` }).from(candidates))[0].n;
  let kaart = await roep(`/kaart/${fleur.id}`);
  const vt = kaart.d.voortraject;
  test("3 een nieuwe intake begint in versie 2", kaart.d.intakeVersie === 2 && !!vt);
  test("4 gegevens uit Job staan klaar met de bron", vt?.job?.werkgebied === "tot 15 km" && voorbereiding(vt).bekend.some((b) => b.label === "Gewenste inzet" && b.bron === "job"));
  test("4 het cv is gelezen en de werkgever is bekend", vt?.cv.status === "gelezen" && vt.cv.periodes[0]?.werkgever === "Hotel Voorbeeld" && voorbereiding(vt).werkgever === "Hotel Voorbeeld");
  test("extra: tegenstrijdige gegevens worden gemeld en staan bovenaan de bespreekpunten", voorbereiding(vt).tegenstrijdig.length >= 1 && /verschil/i.test(voorbereiding(vt).bespreekpunten[0] || ""), JSON.stringify(voorbereiding(vt).bespreekpunten));
  test("4 hoogstens twee bespreekpunten", voorbereiding(vt).bespreekpunten.length <= 2);
  test("8 functie hoort bij de kandidaat: housekeeping", kaart.d.functieCtx.functie === "housekeeping" && kaart.d.functieCtx.label === "hotels");
  let intake: IntakeV2 = startIntake(vt);
  test("7 wat bekend is staat al ingevuld: talen en vervoer hoeven niet opnieuw gevraagd", intake.talen?.length === 2 && intake.vervoer?.join(",") === "Fiets,OV" && intake.bronnen?.vervoer === "job");

  let r = await roep(`/intake2/${fleur.id}`, { method: "PUT", body: { intake, stap: 1, revisie: 0 } });
  let revisie = r.d.revisie;
  const [d1] = await db.select().from(sollicitantDossiers).where(eq(sollicitantDossiers.candidateId, fleur.id));
  const aantalNa = (await db.select({ n: sql<number>`count(*)::int` }).from(candidates))[0].n;
  test("3 het concept hoort bij dezelfde persoon, er is geen nieuwe persoon gemaakt", r.status === 200 && d1.intakeVersie === 2 && d1.intakeStatus === "concept" && aantalNa === aantalVoor);
  test("3 er is precies één dossier voor deze kandidaat", (await db.select().from(sollicitantDossiers).where(eq(sollicitantDossiers.candidateId, fleur.id))).length === 1);
  test("2 het oude formulier kan een intake van versie 2 niet overschrijven", (await roep(`/intake/${fleur.id}`, { method: "PUT", body: { intake: { talen: ["x"] }, stap: 2 } })).status === 409);

  // ── 6: correcties houden hun historie ─────────────────────────────────────
  kop("Correcties en historie");
  intake = { ...intake, vervoer: ["Fiets", "OV", "Auto"], bevestigd: { ...(intake.bevestigd || {}), vervoer: "aangepast", talen: "klopt" } };
  r = await roep(`/intake2/${fleur.id}`, { method: "PUT", body: { intake, stap: 2, revisie } }); revisie = r.d.revisie;
  let hist = (await roep(`/intake2/${fleur.id}/historie`)).d as any[];
  const vervoer = hist.filter((x) => x.vraag === "vervoer");
  test("6 het overgenomen antwoord blijft staan naast de correctie", vervoer.some((x) => x.status === "overgenomen" && x.bron === "job" && JSON.stringify(x.waarde) === '["Fiets","OV"]') && vervoer.some((x) => x.status === "aangepast" && x.bron === "gesprek"), JSON.stringify(vervoer.map((x) => x.status)));
  test("6 bevestigen van een bekend antwoord is vastgelegd met de bron", hist.some((x) => x.vraag === "talen" && x.status === "bevestigd" && x.bron === "job"));
  test("6 bij elke regel staat wie het deed en wanneer", hist.every((x) => !!x.door && !!x.at));

  // ── 12: bewaren, verversen, twee mensen tegelijk ──────────────────────────
  kop("Bewaren en samenwerken");
  kaart = await roep(`/kaart/${fleur.id}`);
  test("12 na verversen staat het concept er weer, op hetzelfde hoofdstuk", kaart.d.dossier.intakeStatus === "concept" && kaart.d.dossier.intakeStap === 2 && kaart.d.dossier.intakeRevisie === revisie && kaart.d.dossier.intake.vervoer.length === 3);
  const collega = await roep(`/intake2/${fleur.id}`, { method: "PUT", body: { intake: { ...intake, aanleiding: "Via een vriendin" }, stap: 2, revisie }, als: B.id });
  const stale = await roep(`/intake2/${fleur.id}`, { method: "PUT", body: { intake: { ...intake, aanleiding: "Overschrijft de collega" }, stap: 2, revisie } });
  const [d2] = await db.select().from(sollicitantDossiers).where(eq(sollicitantDossiers.candidateId, fleur.id));
  test("12 twee mensen tegelijk: de tweede overschrijft de eerste niet", collega.status === 200 && stale.status === 409 && stale.d.conflict === true && (d2.intake as any).aanleiding === "Via een vriendin");
  test("12 de melding geeft de laatste stand terug om verder te gaan", stale.d.revisie === collega.d.revisie && stale.d.intake?.aanleiding === "Via een vriendin");
  revisie = collega.d.revisie; intake = stale.d.intake;
  test("12 een ongeldige intake wordt geweigerd", (await roep(`/intake2/${fleur.id}`, { method: "PUT", body: { intake: "x", revisie } })).status === 400);

  // ── Het gesprek zelf ──────────────────────────────────────────────────────
  intake = {
    ...intake,
    talen: [{ taal: "Nederlands", niveau: "uitgebreid", bron: "gesprek" }, { taal: "Engels", niveau: "werkgesprekken", bron: "zelf" }],
    ervaring_dienst: "Twaalf kamers per dienst, samen met een collega", ervaring_duur: "1 tot 2 jaar",
    taken: { "Kamers opmaken": { niveau: "zelfstandig", voorbeeld: "Twaalf kamers per dienst" }, "Badkamers schoonmaken": { niveau: "zelfstandig" }, "Werken met een kamerlijst": { niveau: "begeleiding" } },
    prioriteiten: ["Flexibiliteit", "Gezelligheid en contact"], keuzefactoren: ["Werktijden", "Reistijd"], fijne_plek: "In een klein hotel met een vast team", binding: ["Een vertrouwd team", "Waardering"],
    niet_terug: "Onduidelijke afspraken over eindtijden", niet_terug_soort: "voorkeur",
    start_hulp: ["Meelopen met een collega"], locaties: "vast", samenwerken: "team", contact: "regelmatig", kanaal: "whatsapp",
    werkprofiel: { kleuren: ["I", "S"], status: "voorlopig", onderbouwing: "Vertelt vooral over collega's en vaste hotels" },
    reistijd_min: 30, laat_thuis: "afhankelijk", id_gezien: "Gezien", werkrecht: "geen_twv",
    acties: [{ tekst: "Kopie certificaat nasturen", eigenaar: "Kandidaat" }],
    uren: 14, uren_min: 12, uren_max: 16, patroon: "wisselend", lastminute: "soms",
    raster: { Ma: { avond: "ja" }, Di: { ochtend: "nee", overdag: "nee", avond: "nee", nacht: "nee" }, Wo: { avond: "ja" }, Vr: { avond: "ja" }, Za: { ochtend: "ja", overdag: "ja" }, Zo: { ochtend: "ja", overdag: "ja" } },
    tijden: { Ma: { van: "16:00", tot: "22:00" }, Wo: { van: "16:00", tot: "22:00" } },
    beschikbaarheid_bevestigd_op: new Date().toISOString().slice(0, 10),
    samenvatting: "klopt", app_uitleg: ["Diensten bekijken en reageren", "Uitbetaling en Jixbee", "EXTRAATJE"], uitbetaling: "dagbetaling", extraatje: "ja",
    referentie: { naam: "Fictieve Leidinggevende", relatie: "Leidinggevende", telefoon: "0600000000", toestemming: true },
  };
  r = await roep(`/intake2/${fleur.id}`, { method: "PUT", body: { intake, stap: 8, revisie } }); revisie = r.d.revisie;

  // ── Afronden: één keer ────────────────────────────────────────────────────
  kop("Afronden en beoordelen");
  const [af1, af2] = await Promise.all([roep(`/intake2/${fleur.id}/afronden`, { method: "POST", body: { intake } }), roep(`/intake2/${fleur.id}/afronden`, { method: "POST", body: { intake } })]);
  const gebeurd = await db.select().from(sollicitantGebeurtenissen).where(and(eq(sollicitantGebeurtenissen.candidateId, fleur.id), eq(sollicitantGebeurtenissen.soort, "intake_afgerond")));
  test("12 twee keer tegelijk afronden gebeurt maar één keer", af1.status === 200 && af2.status === 200 && gebeurd.length === 1, `${af1.status} ${af2.status} ${gebeurd.length}`);
  kaart = await roep(`/kaart/${fleur.id}`);
  const dz = kaart.d.dossier;
  test("9 de schuiven beginnen leeg: geen 0 en geen 50", kaart.d.stap === "beoordelen" && JSON.stringify(dz.beoordeling) === "{}");
  test("13 na het gesprek is de kandidaat niet aangenomen en is er geen medewerker", kaart.d.kandidaat.status !== "aangenomen" && kaart.d.medewerker === null);
  test("16 het ID en de referentie uit de intake staan klaar in de bestaande check", dz.controle.idGezien === true && dz.controle.referent === "Fictieve Leidinggevende, Leidinggevende" && dz.controle.telefoon === "0600000000");
  test("14 open punten staan in de tijdlijn met wie het oppakt", kaart.d.tijdlijn.some((t: any) => /Kopie certificaat nasturen \(Kandidaat\)/.test(t.tekst)));
  test("11 uren, weekpatroon en samenvatting zeggen hetzelfde", kpis(dz.intake, kaart.d.functieCtx)[3].hoofd === "12 tot 16 uur per week" && weekpatroon(dz.intake)[0].tekst === "16:00 tot 22:00" && weekpatroon(dz.intake)[3].status === "onbekend");
  test("extra: wisselende beschikbaarheid blijft een patroon, geen toezegging", dz.intake.patroon === "wisselend" && plannerskaart(dz.intake).aandacht.includes("Nog bespreken: terugreis na een late dienst"));
  test("12 opslaan na afronden wordt geweigerd", (await roep(`/intake2/${fleur.id}`, { method: "PUT", body: { intake, revisie: dz.intakeRevisie } })).d.afgerond === true);

  test("9 doorgaan zonder beoordeling kan niet", (await roep(`/actie/${fleur.id}`, { method: "POST", body: { actie: "naar_check" } })).status === 400);
  let b = await roep(`/beoordeling2/${fleur.id}`, { method: "PUT", body: { beoordeling: { communicatief: 83 } } });
  test("9 een exact cijfer wordt exact bewaard, de rest blijft leeg", b.d.beoordeling.communicatief === 83 && !("representatief" in b.d.beoordeling) && !("indruk" in b.d.beoordeling));
  test("9 met één schuif kan je niet door", (await roep(`/actie/${fleur.id}`, { method: "POST", body: { actie: "naar_check" } })).status === 400);
  b = await roep(`/beoordeling2/${fleur.id}`, { method: "PUT", body: { beoordeling: { representatief: 0, indruk: 150 } } });
  test("9 0 en 150 worden niet bewaard", !("representatief" in b.d.beoordeling) && !("indruk" in b.d.beoordeling) && b.d.beoordeling.communicatief === 83);
  await roep(`/beoordeling2/${fleur.id}`, { method: "PUT", body: { beoordeling: { representatief: 78, indruk: 81 } } });
  const zonderTekst = await roep(`/actie/${fleur.id}`, { method: "POST", body: { actie: "naar_check" } });
  test("10 zonder onderbouwing kan je niet door", zonderTekst.status === 400 && /waar je beoordeling op rust/.test(zonderTekst.d.message), zonderTekst.d.message);
  await roep(`/beoordeling2/${fleur.id}`, { method: "PUT", body: { beoordeling: { onderbouwing: "Geeft concrete voorbeelden en legt uit welke taken zij zelfstandig doet." } } });
  b = await roep(`/beoordeling2/${fleur.id}`, { method: "PUT", body: { beoordeling: { communicatief: 85 } }, als: B.id });
  const [d3] = await db.select().from(sollicitantDossiers).where(eq(sollicitantDossiers.candidateId, fleur.id));
  hist = (await roep(`/intake2/${fleur.id}/historie`)).d as any[];
  test("10 onderbouwing, beoordelaar en tijdstip zijn bewaard", (d3.beoordeling as any).onderbouwing?.startsWith("Geeft concrete") && !!d3.beoordeeldDoor && !!d3.beoordeeldAt && (d3.beoordeling as any).communicatief === 85);
  test("10 een gewijzigd cijfer staat in de historie", hist.some((x) => x.onderdeel === "beoordeling" && x.vraag === "communicatief" && x.waarde === 83) && hist.some((x) => x.onderdeel === "beoordeling" && x.vraag === "communicatief" && x.waarde === 85 && x.status === "aangepast"));
  test("10 de beoordeling staat los van het werkprofiel en de match", !("werkprofiel" in (d3.beoordeling as any)) && !("extravert" in (d3.beoordeling as any)));

  // ── 13, 16: controles ─────────────────────────────────────────────────────
  kop("Controles en Onboarding");
  r = await roep(`/actie/${fleur.id}`, { method: "POST", body: { actie: "naar_check" } });
  test("13 een positieve beoordeling zet de kandidaat op de controles, niet op inzetbaar", r.d.stap === "ref_doc_check" && (await db.select().from(candidates).where(eq(candidates.id, fleur.id)))[0].status !== "aangenomen");
  test("13 accepteren kan niet zolang de referentie open staat", (await roep(`/actie/${fleur.id}`, { method: "POST", body: { actie: "accepteren" } })).status === 400);
  test("17 een medewerker aanmaken kan niet voor Onboarding", (await roep(`/medewerker/${fleur.id}`, { method: "POST" })).status === 409);
  await roep(`/check/${fleur.id}`, { method: "PUT", body: { poging: "gesproken" } });
  r = await roep(`/check/${fleur.id}`, { method: "PUT", body: { uitkomst: "positief", verslag: "Werkt netjes en is op tijd." } });
  test("16 de referentiecheck sluit aan: gesproken en positief maakt accepteren mogelijk", r.d.magAccepteren === true && r.d.referentie === "positief");
  r = await roep(`/actie/${fleur.id}`, { method: "POST", body: { actie: "accepteren" } });
  test("16 na de controles gaat de kandidaat naar Onboarding", r.d.stap === "onboarding");
  test("17 in Onboarding is er nog geen medewerker: dat is een eigen handeling", (await roep(`/kaart/${fleur.id}`)).d.medewerker === null);

  // ── 17: medewerkersdossier ────────────────────────────────────────────────
  const [m1, m2] = await Promise.all([roep(`/medewerker/${fleur.id}`, { method: "POST" }), roep(`/medewerker/${fleur.id}`, { method: "POST" })]);
  const mw = await db.select().from(employees).where(eq(employees.candidateId, fleur.id));
  test("17 twee keer tegelijk aanmaken geeft één medewerker", mw.length === 1 && m1.d.medewerkerId === m2.d.medewerkerId, `${mw.length} medewerkers`);
  test("17 nog een keer aanmaken geeft dezelfde medewerker terug", (await roep(`/medewerker/${fleur.id}`, { method: "POST" })).d.nieuw === false && (await db.select().from(employees).where(eq(employees.candidateId, fleur.id))).length === 1);
  const prof = await roep(`/medewerkerprofiel/${mw[0].id}`);
  const p = prof.d.profiel;
  test("17 het medewerkersdossier heeft dezelfde gegevens als de intake", prof.d.versie === 2 && prof.d.kandidaatId === fleur.id && p.inzet.tekst === "12 tot 16 uur per week" && p.weekpatroon[0].tekst === "16:00 tot 22:00" && p.uitbetaling === "dagbetaling" && p.extraatje === "ja" && p.contact.frequentie === "regelmatig");
  test("17 voorkeuren, grenzen en bronnen gaan mee", p.planner.lieverNiet.includes("Onduidelijke afspraken over eindtijden") && p.planner.grenzen.length === 0 && p.taken.every((t: any) => t.bron === "volgens kandidaat") && p.werkprofiel.titel === "Sociaal · Stabiel");
  test("17 de beoordeling en de controles gaan mee", prof.d.beoordeling.communicatief === 85 && prof.d.controle.idGezien === true && prof.d.controle.referentie === "positief");
  test("17 Onboarding laat zien dat de medewerker is aangemaakt", ((await roep(`/onboarding`)).d as any[]).find((x) => x.id === fleur.id)?.medewerkerId === mw[0].id);
  test("13 de medewerker begint op nieuw, niet op actief", mw[0].status === "nieuw");

  // ── 5: onbekend blijft onbekend ───────────────────────────────────────────
  kop("Zonder cv en zonder gegevens");
  const noor = await kandidaat({ voornaam: "Noor", functionType: "logistiek", functieEersteKeus: "orderpicker", bronDetails: { branche: "logistiek" } } as any);
  kaart = await roep(`/kaart/${noor.id}`);
  const vb = voorbereiding(kaart.d.voortraject);
  test("extra: kandidaat zonder cv: het cv staat bij nog niet bekend, niet als minpunt", kaart.d.voortraject.cv.status === "geen" && vb.ontbreekt.includes("Cv") && kaart.d.voortraject.job === null);
  test("8 logistiek krijgt geen kamertaken", kaart.d.functieCtx.functie === "logistiek");
  const leeg = startIntake(kaart.d.voortraject);
  test("5 alleen de taal uit de aanmelding staat klaar, de rest is leeg", Object.keys(leeg).filter((k) => k !== "_versie" && k !== "bronnen").join(",") === "talen" && leeg.bronnen?.talen === "formulier" && leeg.talen?.[0].niveau === null);
  r = await roep(`/intake2/${noor.id}`, { method: "PUT", body: { intake: leeg, stap: 1, revisie: 0 } });
  await roep(`/intake2/${noor.id}/afronden`, { method: "POST", body: { intake: leeg } });
  kaart = await roep(`/kaart/${noor.id}`);
  const lk = kpis(kaart.d.dossier.intake, kaart.d.functieCtx);
  test("5 lege antwoorden blijven onbekend: geen nul, geen nee", lk.every((x) => x.hoofd === "Nog niet bekend" || x.hoofd === "Nog niet vastgesteld") && kaart.d.dossier.intake.uren === undefined && kaart.d.dossier.controle.idGezien === undefined);
  test("5 geen referentie opgegeven is niet overgeslagen", kaart.d.dossier.controle.overgeslagen === undefined);

  // ── 14, 15: twijfel en afwijzen ───────────────────────────────────────────
  kop("Twijfel, afwijzen en terugzetten");
  await roep(`/beoordeling2/${noor.id}`, { method: "PUT", body: { beoordeling: { communicatief: 35, representatief: 60, indruk: 45, onderbouwing: "Korte antwoorden, weinig voorbeelden." } } });
  test("9 een laag cijfer wijst niemand vanzelf af", (await roep(`/kaart/${noor.id}`)).d.stap === "beoordelen");
  r = await roep(`/actie/${noor.id}`, { method: "POST", body: { actie: "twijfel" } });
  kaart = await roep(`/kaart/${noor.id}`);
  test("14 twijfel zet de kandidaat op EXTRA check met de naam van wie twijfelt", r.d.stap === "extra_check" && !!kaart.d.dossier.twijfelDoor && !!kaart.d.dossier.twijfelAt);
  const voorAfwijzen = await afdrukAnderen();
  const antwoordenVoor = (await db.select({ n: sql<number>`count(*)::int` }).from(intakeAntwoorden).where(eq(intakeAntwoorden.candidateId, fleur.id)))[0].n;
  r = await roep(`/actie/${noor.id}`, { method: "POST", body: { actie: "afwijzen", reden: "anders", redenTekst: "Ketentest", mail: false } });
  const [dn] = await db.select().from(sollicitantDossiers).where(eq(sollicitantDossiers.candidateId, noor.id));
  const naAfwijzen = await afdrukAnderen();
  test("15 afwijzen archiveert het dossier en bewaart alles", r.status === 200 && dn.stap === "archief" && dn.intakeVersie === 2 && dn.intakeStatus === "afgerond" && (dn.beoordeling as any).communicatief === 35);
  test("20 bij afwijzen is geen mail verstuurd", r.d.verstuurd === false);
  test("15 afwijzen raakt geen enkel ander dossier", naAfwijzen.hash === voorAfwijzen.hash && naAfwijzen.n === voorAfwijzen.n);
  test("15 de antwoorden van een andere kandidaat staan er nog", (await db.select({ n: sql<number>`count(*)::int` }).from(intakeAntwoorden).where(eq(intakeAntwoorden.candidateId, fleur.id)))[0].n === antwoordenVoor);
  test("10 na afwijzen kan de beoordeling niet meer veranderen", (await roep(`/beoordeling2/${noor.id}`, { method: "PUT", body: { beoordeling: { communicatief: 99 } } })).status === 409);
  r = await roep(`/actie/${noor.id}`, { method: "POST", body: { actie: "terugzetten" } });
  test("15 terugzetten uit het archief brengt de kandidaat terug met alle gegevens", r.d.naar === "extra_check" && (await roep(`/kaart/${noor.id}`)).d.dossier.intake._versie === 2);

  // ── Meer functies ─────────────────────────────────────────────────────────
  kop("Meer gewenste functies");
  const sam = await kandidaat({ voornaam: "Sam", functionType: "horecamedewerker", functieEersteKeus: "runner", bronDetails: { branche: "events", functies: ["runner", "bar"] } } as any);
  kaart = await roep(`/kaart/${sam.id}`);
  test("extra: meer gewenste functies komen mee naar het formulier", JSON.stringify(kaart.d.functieCtx.functies) === '["runner","bar"]' && kaart.d.functieCtx.eersteKeus === "runner");

  // ── 18: terugschakelen ────────────────────────────────────────────────────
  kop("Terugschakelen naar het oude formulier");
  const concept = await kandidaat({ voornaam: "Mila", functionType: "horecamedewerker", functieEersteKeus: "bediening" });
  r = await roep(`/intake2/${concept.id}`, { method: "PUT", body: { intake: { _versie: 2, aanleiding: "Hoorde het van een collega" }, stap: 1, revisie: 0 } });
  const nieuw = await kandidaat({ voornaam: "Daan", functionType: "horecamedewerker" });
  process.env.INTAKE_V2 = "0";
  test("18 schakelaar uit: de status meldt het oude formulier", (await roep(`/status`)).d.intakeV2 === false);
  test("18 schakelaar uit: een nieuwe intake begint in het oude formulier", (await roep(`/kaart/${nieuw.id}`)).d.intakeVersie === 1);
  test("18 schakelaar uit: het nieuwe formulier start geen nieuwe intake", (await roep(`/intake2/${nieuw.id}`, { method: "PUT", body: { intake: { _versie: 2 }, revisie: 0 } })).status === 409);
  kaart = await roep(`/kaart/${fleur.id}`);
  test("18 schakelaar uit: een afgerond dossier van versie 2 blijft compleet leesbaar", kaart.d.intakeVersie === 2 && kaart.d.dossier.intake.uren === 14 && kaart.d.dossier.beoordeling.communicatief === 85 && !!kaart.d.voortraject);
  kaart = await roep(`/kaart/${concept.id}`);
  const door = await roep(`/intake2/${concept.id}`, { method: "PUT", body: { intake: { _versie: 2, aanleiding: "Hoorde het van een collega", uren: 20 }, stap: 2, revisie: r.d.revisie } });
  test("18 schakelaar uit: een begonnen intake van versie 2 gaat verder in versie 2", kaart.d.intakeVersie === 2 && door.status === 200);
  test("18 schakelaar uit: het medewerkersprofiel blijft werken", (await roep(`/medewerkerprofiel/${mw[0].id}`)).d.profiel?.inzet.uren === 14);
  delete process.env.INTAKE_V2;
  test("18 schakelaar weer aan: niets is kwijt", (await roep(`/kaart/${concept.id}`)).d.dossier.intake.uren === 20 && (await roep(`/kaart/${nieuw.id}`)).d.intakeVersie === 2);

  // ── 19, 20: bereikbaarheid en rechten ─────────────────────────────────────
  kop("Bereikbaarheid, rechten en berichten");
  kaart = await roep(`/kaart/${fleur.id}`);
  test("19 cv, intake en gesprek met Job zijn vanaf de kaart bereikbaar", kaart.d.kandidaat.heeftCv === true && !!kaart.d.job && kaart.d.dossier.intakeStatus === "afgerond" && (await roep(`/profiel/${fleur.id}`)).d.versie === 2);
  ingelogd = false;
  const dicht = await Promise.all([roep(`/kaart/${fleur.id}`), roep(`/intake2/${fleur.id}`, { method: "PUT", body: { intake: {}, revisie: 0 } }), roep(`/intake2/${fleur.id}/historie`), roep(`/medewerkerprofiel/${mw[0].id}`), roep(`/medewerker/${fleur.id}`, { method: "POST" }), roep(`/beoordeling2/${fleur.id}`, { method: "PUT", body: {} })]);
  ingelogd = true;
  test("20 zonder inloggen is geen enkele route bereikbaar", dicht.every((x) => x.status === 401), dicht.map((x) => x.status).join(","));
  test("20 er is geen enkel bericht via Job verstuurd", (await db.select({ n: sql<number>`count(*)::int` }).from(jobBerichten))[0].n === berichtenVooraf);

  // ── 1: alles van anderen is nog precies zoals het was ─────────────────────
  kop("Bestaande dossiers achteraf");
  const achteraf = await afdrukAnderen();
  test("1 geen enkel bestaand dossier is veranderd", achteraf.hash === vooraf.hash && achteraf.n === vooraf.n, `${vooraf.n} dossiers`);
  test("1 er zijn geen bestaande kandidaten bijgekomen of verdwenen", achteraf.kandidaten === vooraf.kandidaten);
  const v1Na = await db.select().from(sollicitantDossiers).where(inArray(sollicitantDossiers.id, v1Vooraf.map((d) => d.id).concat([-1]))).orderBy(sollicitantDossiers.id);
  test("1 antwoorden, cijfers, notities en tijdstippen van oude intakes zijn gelijk", JSON.stringify(v1Na) === JSON.stringify(v1Vooraf));

  console.log(`\nKandidaten van deze test (blijven staan, bron "ketentest"): ${mijn.join(", ")}`);
  console.log(`${geslaagd} geslaagd, ${gefaald} gefaald`);
  server.close();
  await pool.end().catch(() => {});
  process.exit(gefaald > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
