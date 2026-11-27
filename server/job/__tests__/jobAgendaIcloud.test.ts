/**
 * Huistests: de CalDAV-verbinding met iCloud, tegen een nagebootste server (geen netwerk).
 * Run met:  npx tsx server/job/__tests__/jobAgendaIcloud.test.ts
 */
import { agendaConfig, AgendaFout, element, IcloudAgenda, kalenderData, multistatus, type Haal } from "../jobAgendaIcloud";
import { leesAfspraken } from "../../../shared/jobAgenda";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}`); }
}

const WACHTWOORD = "abcd-efgh-ijkl-mnop";

// ─── Config ──
test("Zonder Secrets: uit", agendaConfig({}) === null);
test("AGENDA_KOPPELING=0: uit", agendaConfig({ ICLOUD_AGENDA_GEBRUIKER: "agenda@voorbeeld.nl", ICLOUD_AGENDA_WACHTWOORD: WACHTWOORD, AGENDA_KOPPELING: "0" }) === null);
const cfgTest = agendaConfig({ ICLOUD_AGENDA_GEBRUIKER: "agenda@voorbeeld.nl", ICLOUD_AGENDA_WACHTWOORD: WACHTWOORD, TESTOMGEVING: "1" })!;
test("Testomgeving: leest EXTRA, schrijft in EXTRA test", cfgTest.lezen === "EXTRA" && cfgTest.schrijven === "EXTRA test" && cfgTest.omgeving === "test");
const cfgProd = agendaConfig({ ICLOUD_AGENDA_GEBRUIKER: "agenda@voorbeeld.nl", ICLOUD_AGENDA_WACHTWOORD: WACHTWOORD })!;
test("Productie: leest en schrijft in EXTRA", cfgProd.lezen === "EXTRA" && cfgProd.schrijven === "EXTRA" && cfgProd.omgeving === "prod");

// ─── XML ──
const ms = `<?xml version="1.0"?><multistatus xmlns="DAV:"><response><href>/1/calendars/abc/</href>
<propstat><prop><displayname>EXTRA</displayname><resourcetype><collection/><calendar xmlns="urn:ietf:params:xml:ns:caldav"/></resourcetype></prop><status>HTTP/1.1 200 OK</status></propstat>
<propstat><prop><getctag/></prop><status>HTTP/1.1 404 Not Found</status></propstat></response></multistatus>`;
const r = multistatus(ms);
test("Multistatus: één response met href", r.length === 1 && r[0].href === "/1/calendars/abc/" && r[0].ok);
test("Alleen de propstat met 200", element(r[0].props, "displayname") === "EXTRA" && element(r[0].props, "getctag") === null);
test("Calendar-data met entiteiten", kalenderData(`<C:calendar-data>BEGIN:VCALENDAR&#13;\nSUMMARY:Eef &amp; Lea&#13;\nEND:VCALENDAR</C:calendar-data>`) === "BEGIN:VCALENDAR\r\nSUMMARY:Eef & Lea\r\nEND:VCALENDAR");
test("Calendar-data in CDATA", kalenderData(`<cal:calendar-data><![CDATA[SUMMARY:a & b]]></cal:calendar-data>`) === "SUMMARY:a & b");

// ─── Nagebootste iCloud ──
interface Verzoek { url: string; methode: string; kop: Record<string, string>; body: string }
const verzoeken: Verzoek[] = [];
const eventIcs = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", "UID:x1", "SUMMARY:Lea hartkastje halen", "DTSTART;TZID=Europe/Amsterdam:20261204T140000", "DTEND;TZID=Europe/Amsterdam:20261204T150000", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#13;");
function maakServer(opties: { status401?: boolean; geenUitklap?: boolean } = {}): Haal {
  return async (url, init) => {
    const kop = (init.headers || {}) as Record<string, string>;
    verzoeken.push({ url, methode: String(init.method), kop, body: String(init.body || "") });
    const verwacht = `Basic ${Buffer.from(`agenda@voorbeeld.nl:${WACHTWOORD}`).toString("base64")}`;
    if (opties.status401 || kop.Authorization !== verwacht) return new Response("", { status: 401 });
    if (url === "https://caldav.icloud.com/" && init.method === "PROPFIND")
      return new Response(`<multistatus xmlns="DAV:"><response><href>/</href><propstat><prop><current-user-principal><href>/123/principal/</href></current-user-principal></prop><status>HTTP/1.1 200 OK</status></propstat></response></multistatus>`, { status: 207 });
    if (url === "https://caldav.icloud.com/123/principal/")
      return new Response(null, { status: 301, headers: { location: "https://p42-caldav.icloud.com:443/123/principal/" } });
    if (url === "https://p42-caldav.icloud.com/123/principal/")
      return new Response(`<multistatus xmlns="DAV:"><response><href>/123/principal/</href><propstat><prop><calendar-home-set xmlns="urn:ietf:params:xml:ns:caldav"><href xmlns="DAV:">https://p42-caldav.icloud.com:443/123/calendars/</href></calendar-home-set></prop><status>HTTP/1.1 200 OK</status></propstat></response></multistatus>`, { status: 207 });
    if (url === "https://p42-caldav.icloud.com/123/calendars/" && init.method === "PROPFIND")
      return new Response(`<multistatus xmlns="DAV:">
<response><href>/123/calendars/</href><propstat><prop><displayname/><resourcetype><collection/></resourcetype></prop><status>HTTP/1.1 200 OK</status></propstat></response>
<response><href>/123/calendars/inbox/</href><propstat><prop><resourcetype><collection/><schedule-inbox xmlns="urn:ietf:params:xml:ns:caldav"/></resourcetype></prop><status>HTTP/1.1 200 OK</status></propstat></response>
<response><href>/123/calendars/ABC-1/</href><propstat><prop><displayname>EXTRA</displayname><resourcetype><collection/><calendar xmlns="urn:ietf:params:xml:ns:caldav"/></resourcetype></prop><status>HTTP/1.1 200 OK</status></propstat></response>
<response><href>/123/calendars/ABC-2/</href><propstat><prop><displayname>EXTRA test</displayname><resourcetype><collection/><calendar xmlns="urn:ietf:params:xml:ns:caldav"/></resourcetype></prop><status>HTTP/1.1 200 OK</status></propstat></response>
</multistatus>`, { status: 207 });
    if (opties.geenUitklap && init.method === "REPORT" && String(init.body).includes("expand")) return new Response("", { status: 403 });
    if (url === "https://p42-caldav.icloud.com/123/calendars/ABC-1/" && init.method === "REPORT")
      return new Response(`<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><response><href>/123/calendars/ABC-1/x1.ics</href><propstat><prop><getetag>"1"</getetag><C:calendar-data>${xmlEsc(eventIcs)}</C:calendar-data></prop><status>HTTP/1.1 200 OK</status></propstat></response></multistatus>`, { status: 207 });
    if (init.method === "PUT" && url.startsWith("https://p42-caldav.icloud.com/123/calendars/ABC-2/")) return new Response(null, { status: 201 });
    if (init.method === "DELETE") return new Response(null, { status: 204 });
    return new Response("", { status: 500 });
  };
}

async function main() {
  const ag = new IcloudAgenda(cfgTest, maakServer());
  const lijst = await ag.agendas();
  test("Agenda's gevonden via principal en doorverwijzing", lijst.map((k) => k.naam).join(",") === "EXTRA,EXTRA test");
  test("Inloggegevens blijven mee over de doorverwijzing", verzoeken.every((v) => v.kop.Authorization?.startsWith("Basic ")));
  const ruw = await ag.afspraken("EXTRA", new Date("2026-12-04T00:00:00Z"), new Date("2026-12-05T00:00:00Z"));
  test("Afspraken gelezen uit EXTRA", ruw.length === 1 && ruw[0].href === "https://p42-caldav.icloud.com/123/calendars/ABC-1/x1.ics");
  const rep = verzoeken.find((v) => v.methode === "REPORT")!;
  test("Herhalingen laat Job door iCloud uitklappen, binnen het venster", rep.body.includes("<c:expand") && rep.body.includes('start="20261204T000000Z"'));
  const items = leesAfspraken(ruw.map((x) => x.ics), "2026-12-04", "2026-12-04");
  test("Gelezen afspraak klopt", items.length === 1 && items[0].titel === "Lea hartkastje halen" && items[0].van === "2026-12-04 14:00");
  await ag.plaats("EXTRA test", "job-afspraak-test-42.ics", "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n");
  const put = verzoeken.find((v) => v.methode === "PUT")!;
  test("Schrijven gaat naar EXTRA test, onder Jobs eigen bestandsnaam", put.url === "https://p42-caldav.icloud.com/123/calendars/ABC-2/job-afspraak-test-42.ics");
  test("Nooit naar EXTRA geschreven in de test", !verzoeken.some((v) => v.methode === "PUT" && v.url.includes("/ABC-1/")));
  let fout = "";
  try { await ag.kalender("Bestaat niet"); } catch (e: any) { fout = e.message; }
  test("Onbekende agenda: duidelijke melding", fout.includes('"Bestaat niet"'));

  const zonder = new IcloudAgenda(cfgTest, maakServer({ geenUitklap: true }));
  const ruw2 = await zonder.afspraken("EXTRA", new Date("2026-12-04T00:00:00Z"), new Date("2026-12-05T00:00:00Z"));
  test("Kan iCloud niet uitklappen: opnieuw zonder, en toch gelezen", ruw2.length === 1);

  const fouteAg = new IcloudAgenda(cfgTest, maakServer({ status401: true }));
  let f401: unknown = null;
  try { await fouteAg.agendas(); } catch (e) { f401 = e; }
  test("Verkeerd wachtwoord: AgendaFout met uitleg", f401 instanceof AgendaFout && (f401 as Error).message.includes("401") && (f401 as Error).message.includes("app-specifiek"));
  test("Het wachtwoord staat nooit in de foutmelding", !(f401 as Error).message.includes(WACHTWOORD) && !JSON.stringify(f401).includes(WACHTWOORD));

  const weg = new IcloudAgenda(cfgTest, async () => { throw new Error(`netwerk ${WACHTWOORD}`); });
  let fNet: unknown = null;
  try { await weg.agendas(); } catch (e) { fNet = e; }
  test("Geen verbinding: nette melding zonder details", fNet instanceof AgendaFout && (fNet as Error).message.includes("niet bereikbaar") && !(fNet as Error).message.includes(WACHTWOORD));

  console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
  process.exit(gefaald > 0 ? 1 : 0);
}
void main();
