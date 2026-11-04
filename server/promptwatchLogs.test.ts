/**
 * Housetests voor de Promptwatch-logdoorstuur.
 * Draaien zonder framework of database: `npm run promptwatchlogs:test`.
 */

import fs from "fs";
import path from "path";
import os from "os";
import { EventEmitter } from "events";
import {
  splitsUrl,
  eventVanRequest,
  verdeelInBatches,
  backoffMs,
  batchMagWeg,
  isOpenbarePagina,
  schoonQuery,
  schoonReferrer,
  PromptwatchDoorstuur,
  maakPromptwatchDoorstuur,
  type PromptwatchEvent,
  type FlushUitkomst,
} from "./promptwatchLogs";

let geslaagd = 0;
let gefaald = 0;

function test(naam: string, conditie: boolean, detail?: string) {
  if (conditie) {
    geslaagd++;
    console.log(`  ✓ ${naam}`);
  } else {
    gefaald++;
    console.log(`  ✗ ${naam}${detail ? ` — ${detail}` : ""}`);
  }
}

function maakEvent(deel: Partial<PromptwatchEvent> = {}): PromptwatchEvent {
  return {
    timestamp: "2026-08-24T12:00:00.000Z",
    status_code: 200,
    request_method: "GET",
    request_path: "/",
    query_string: null,
    content_type: "text/html",
    client_ip: "10.0.0.1",
    hostname: "www.doehetextra.nl",
    user_agent: "GPTBot/1.3",
    referrer: null,
    ...deel,
  };
}

async function main() {
  console.log("splitsUrl");
  test("pad zonder query", splitsUrl("/vacatures").query === null && splitsUrl("/vacatures").pad === "/vacatures");
  test("pad met query", splitsUrl("/zoek?q=chef&stad=adam").query === "q=chef&stad=adam");
  test("query wordt van pad gehaald", splitsUrl("/zoek?q=chef").pad === "/zoek");
  test("lege query wordt null", splitsUrl("/zoek?").query === null);
  test("lege url wordt /", splitsUrl("").pad === "/");
  test("alleen ? wordt / met null", splitsUrl("?").pad === "/" && splitsUrl("?").query === null);

  console.log("eventVanRequest");
  const nu = new Date("2026-08-24T12:00:00.000Z");
  const basisReq = {
    method: "GET",
    originalUrl: "/en/jobs?lang=en",
    ip: "203.0.113.7",
    hostname: "www.doehetextra.nl",
    headers: {
      "user-agent": "Mozilla/5.0; compatible; GPTBot/1.3",
      referer: "https://chat.openai.com/",
      host: "www.doehetextra.nl",
    } as Record<string, string | string[] | undefined>,
  };
  const e1 = eventVanRequest(basisReq, { statusCode: 200, contentType: "text/html; charset=utf-8" }, nu);
  test("timestamp ISO 8601 UTC met ms", e1.timestamp === "2026-08-24T12:00:00.000Z");
  test("pad zonder querystring", e1.request_path === "/en/jobs");
  test("query zonder campagneparameters wordt null", e1.query_string === null);
  test("client_ip uit req.ip", e1.client_ip === "203.0.113.7");
  test("hostname uit req.hostname", e1.hostname === "www.doehetextra.nl");
  test("user_agent ongewijzigd", e1.user_agent === "Mozilla/5.0; compatible; GPTBot/1.3");
  test("referrer doorgegeven", e1.referrer === "https://chat.openai.com/");
  test("content_type doorgegeven", e1.content_type === "text/html; charset=utf-8");
  test("status_code doorgegeven", e1.status_code === 200);

  const kaalReq = { method: "HEAD", originalUrl: "/healthz", headers: {} };
  const e2 = eventVanRequest(kaalReq, { statusCode: 304, contentType: undefined }, nu);
  test("geen referer wordt null", e2.referrer === null);
  test("geen query wordt null", e2.query_string === null);
  test("geen content-type wordt lege string (niet null)", e2.content_type === "");
  test("geen user-agent wordt lege string (niet null)", e2.user_agent === "");
  test("geen ip wordt lege string", e2.client_ip === "");
  test("alle 10 velden aanwezig", Object.keys(e2).length === 10);
  const verplicht = ["timestamp", "status_code", "request_method", "request_path", "query_string", "content_type", "client_ip", "hostname", "user_agent", "referrer"];
  test("exact de velden uit de specificatie", verplicht.every((v) => v in e2));
  test("alleen query_string en referrer mogen null zijn",
    Object.entries(e2).every(([k, v]) => v !== null || k === "query_string" || k === "referrer"));

  const arrayHeaderReq = {
    method: "GET",
    originalUrl: "/",
    headers: { "user-agent": ["EersteBot/1.0", "TweedeBot/2.0"], host: "doehetextra.nl:443" } as any,
  };
  const e3 = eventVanRequest(arrayHeaderReq, { statusCode: 200, contentType: ["text/html", "x"] }, nu);
  test("array-header pakt eerste waarde", e3.user_agent === "EersteBot/1.0");
  test("hostname-fallback uit host-header zonder poort", e3.hostname === "doehetextra.nl");
  test("array content-type pakt eerste waarde", e3.content_type === "text/html");

  // Fase 0, stap 0.2: alleen openbare pagina's, zonder tokens.
  console.log("isOpenbarePagina (toelatingslijst)");
  test("homepage gaat mee", isOpenbarePagina("GET", "/"));
  test("openbare pagina gaat mee", isOpenbarePagina("GET", "/vacatures"));
  test("Engelse pagina gaat mee", isOpenbarePagina("GET", "/en/jobs"));
  test("trailing slash en hoofdletters gaan mee", isOpenbarePagina("GET", "/Vacatures/"));
  test("HEAD-verzoek van een crawler gaat mee", isOpenbarePagina("HEAD", "/selectieproces"));
  test("blogartikel gaat mee", isOpenbarePagina("GET", "/blog/fictief-artikel"));
  test("vacature gaat mee", isOpenbarePagina("GET", "/vacatures/fictieve-vacature"));
  test("robots.txt gaat mee", isOpenbarePagina("GET", "/robots.txt"));
  test("sitemap.xml gaat mee", isOpenbarePagina("GET", "/sitemap.xml"));
  test("llms.txt en llms-full.txt gaan mee", isOpenbarePagina("GET", "/llms.txt") && isOpenbarePagina("GET", "/llms-full.txt"));
  test("oude URL met 301 naar openbare pagina gaat mee", isOpenbarePagina("GET", "/over-extra-uitzendbureau"));
  test("interne API gaat niet mee", !isOpenbarePagina("GET", "/api/admin/candidates"));
  test("accepteerlink gaat niet mee", !isOpenbarePagina("GET", "/api/candidates/123/accept"));
  test("cv-uploadroute gaat niet mee", !isOpenbarePagina("GET", "/api/cv-upload-token"));
  test("WhatsApp-webhook met geheim pad gaat niet mee", !isOpenbarePagina("POST", "/api/whatsapp/webhook/fictief-geheim"));
  test("ook GET op webhookpad gaat niet mee", !isOpenbarePagina("GET", "/api/whatsapp/webhook/fictief-geheim"));
  test("cv-uploadpagina (noindex) gaat niet mee", !isOpenbarePagina("GET", "/cv-upload"));
  test("dashboard gaat niet mee", !isOpenbarePagina("GET", "/dashboard"));
  test("bedankpagina (noindex) gaat niet mee", !isOpenbarePagina("GET", "/aanvraag-ontvangen"));
  test("pitchdeck gaat niet mee", !isOpenbarePagina("GET", "/pitchdeck/fictief/"));
  test("statisch bestand gaat niet mee", !isOpenbarePagina("GET", "/assets/index-abc123.js"));
  test("onbekend pad gaat niet mee", !isOpenbarePagina("GET", "/wp-login.php"));
  test("POST op openbare pagina gaat niet mee", !isOpenbarePagina("POST", "/vacatures"));
  test("kapotte codering gaat niet mee", !isOpenbarePagina("GET", "/%E0%A4%A"));
  test("api verstopt achter codering gaat niet mee", !isOpenbarePagina("GET", "/%61pi/admin"));

  console.log("schoonQuery");
  test("utm_source van ChatGPT blijft", schoonQuery("utm_source=chatgpt.com") === "utm_source=chatgpt.com");
  test("token verdwijnt, utm blijft", schoonQuery("token=fictief123&utm_source=chatgpt.com") === "utm_source=chatgpt.com");
  test("alleen token wordt null", schoonQuery("token=fictief123") === null);
  test("ref-code en id verdwijnen", schoonQuery("ref=ABC123&id=42") === null);
  test("alle vijf utm-parameters blijven",
    schoonQuery("utm_source=a&utm_medium=b&utm_campaign=c&utm_term=d&utm_content=e") === "utm_source=a&utm_medium=b&utm_campaign=c&utm_term=d&utm_content=e");
  test("lege query blijft null", schoonQuery(null) === null && schoonQuery("") === null);

  console.log("schoonReferrer");
  test("externe referrer blijft gelijk", schoonReferrer("https://chatgpt.com/") === "https://chatgpt.com/");
  test("query met token verdwijnt uit referrer",
    schoonReferrer("https://www.doehetextra.nl/cv-upload?token=fictief123") === "https://www.doehetextra.nl/cv-upload");
  test("fragment verdwijnt uit referrer", schoonReferrer("https://www.perplexity.ai/zoek#x") === "https://www.perplexity.ai/zoek");
  test("geen referrer wordt null", schoonReferrer(undefined) === null && schoonReferrer("") === null);
  test("vreemde referrer wordt null", schoonReferrer("niet-een-url") === null && schoonReferrer("javascript:alert(1)") === null);

  console.log("eventVanRequest schoont query en referrer");
  const crawlerReq = {
    method: "GET",
    originalUrl: "/vacatures?utm_source=chatgpt.com&token=fictief123",
    ip: "203.0.113.9",
    hostname: "www.doehetextra.nl",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
      referer: "https://www.doehetextra.nl/cv-upload?token=fictief456",
    } as Record<string, string | string[] | undefined>,
  };
  const e4 = eventVanRequest(crawlerReq, { statusCode: 200, contentType: "text/html" }, nu);
  test("crawler-user-agent blijft ongewijzigd", e4.user_agent === "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)");
  test("IP blijft voor botverificatie", e4.client_ip === "203.0.113.9");
  test("pad blijft", e4.request_path === "/vacatures");
  test("token weg, utm blijft", e4.query_string === "utm_source=chatgpt.com");
  test("referrer zonder token", e4.referrer === "https://www.doehetextra.nl/cv-upload");
  test("geen token meer in het hele event", !JSON.stringify(e4).includes("fictief"));
  test("nog steeds exact 10 velden", Object.keys(e4).length === 10);

  console.log("verdeelInBatches");
  test("2500 events in batches van 1000 → 3 batches", verdeelInBatches(new Array(2500).fill(0), 1000).length === 3);
  test("laatste batch heeft de rest", verdeelInBatches(new Array(2500).fill(0), 1000)[2].length === 500);
  test("lege lijst → geen batches", verdeelInBatches([], 1000).length === 0);
  test("volgorde blijft behouden", verdeelInBatches([1, 2, 3, 4], 2).flat().join(",") === "1,2,3,4");

  console.log("backoffMs");
  test("0 mislukkingen → geen wachttijd", backoffMs(0) === 0);
  test("1e mislukking → 5s", backoffMs(1) === 5_000);
  test("2e mislukking → 10s", backoffMs(2) === 10_000);
  test("4e mislukking → 40s", backoffMs(4) === 40_000);
  test("aftopping op 5 minuten", backoffMs(20) === 300_000);

  console.log("batchMagWeg");
  test("2xx → batch mag weg", batchMagWeg({ ok: true, status: 200, netwerkfout: false }));
  test("4xx → batch mag weg (niet retryen)", batchMagWeg({ ok: false, status: 401, netwerkfout: false }));
  test("5xx → batch blijft (retry)", !batchMagWeg({ ok: false, status: 503, netwerkfout: false }));
  test("netwerkfout → batch blijft (retry)", !batchMagWeg({ ok: false, status: 0, netwerkfout: true }));

  console.log("PromptwatchDoorstuur — flush op drempel");
  {
    const verzonden: PromptwatchEvent[][] = [];
    let klok = 1_000_000;
    const d = new PromptwatchDoorstuur({
      apiKey: "test",
      flushDrempel: 5,
      maxPerBatch: 1000,
      spoolPad: path.join(os.tmpdir(), `pw-test-${process.pid}-a.jsonl`),
      verstuur: async (events) => {
        verzonden.push(events);
        return { ok: true, status: 200, netwerkfout: false, received: events.length, accepted: 1, dropped: events.length - 1 };
      },
      log: () => {},
      waarschuw: () => {},
      nu: () => klok,
    });
    for (let i = 0; i < 4; i++) d.voegToe(maakEvent());
    await Promise.resolve();
    test("onder drempel nog niets verstuurd", verzonden.length === 0);
    d.voegToe(maakEvent());
    await new Promise((r) => setTimeout(r, 10));
    test("bij drempel (5) direct geflusht", verzonden.length === 1 && verzonden[0].length === 5);
    test("wachtrij daarna leeg", d.aantalInWachtrij() === 0);
  }

  console.log("PromptwatchDoorstuur — 5xx, spool en herstel");
  {
    const spoolPad = path.join(os.tmpdir(), `pw-test-${process.pid}-b.jsonl`);
    fs.rmSync(spoolPad, { force: true });
    let klok = 1_000_000;
    let antwoord: FlushUitkomst = { ok: false, status: 503, netwerkfout: false };
    const verzonden: PromptwatchEvent[][] = [];
    const waarschuwingen: string[] = [];
    const d = new PromptwatchDoorstuur({
      apiKey: "test",
      flushDrempel: 999,
      spoolPad,
      verstuur: async (events) => { verzonden.push(events); return antwoord; },
      log: () => {},
      waarschuw: (r) => waarschuwingen.push(r),
      nu: () => klok,
    });
    d.voegToe(maakEvent({ request_path: "/a" }));
    d.voegToe(maakEvent({ request_path: "/b" }));
    await d.flush();
    test("mislukte batch staat in spool", fs.existsSync(spoolPad) && fs.readFileSync(spoolPad, "utf8").trim().split("\n").length === 2);
    test("mislukking gaf waarschuwing", waarschuwingen.some((w) => w.includes("mislukt")));
    const pogingenNa5xx = verzonden.length;
    await d.flush();
    test("backoff: direct opnieuw flushen doet geen POST", verzonden.length === pogingenNa5xx);
    klok += backoffMs(1) + 1;
    antwoord = { ok: true, status: 200, netwerkfout: false, received: 2, accepted: 2, dropped: 0 };
    await d.flush();
    test("na backoff wordt spool opnieuw verstuurd", verzonden.length === pogingenNa5xx + 1);
    test("spool leeg na succes", !fs.existsSync(spoolPad));
    test("volgorde uit spool behouden", verzonden[verzonden.length - 1][0].request_path === "/a");
    fs.rmSync(spoolPad, { force: true });
  }

  console.log("PromptwatchDoorstuur — 4xx laat batch definitief vallen");
  {
    const spoolPad = path.join(os.tmpdir(), `pw-test-${process.pid}-c.jsonl`);
    fs.rmSync(spoolPad, { force: true });
    let klok = 1_000_000;
    const waarschuwingen: string[] = [];
    const d = new PromptwatchDoorstuur({
      apiKey: "test",
      flushDrempel: 999,
      spoolPad,
      verstuur: async () => ({ ok: false, status: 401, netwerkfout: false }),
      log: () => {},
      waarschuw: (r) => waarschuwingen.push(r),
      nu: () => klok,
    });
    d.voegToe(maakEvent());
    await d.flush();
    test("4xx: niets in spool", !fs.existsSync(spoolPad));
    test("4xx: wachtrij leeg (losgelaten)", d.aantalInWachtrij() === 0);
    test("4xx: wel een waarschuwing gelogd", waarschuwingen.some((w) => w.includes("401")));
    klok += 10;
    d.voegToe(maakEvent());
    const eerder = waarschuwingen.length;
    await d.flush();
    test("4xx geeft geen backoff-blokkade voor nieuw verkeer", waarschuwingen.length > eerder);
  }

  console.log("PromptwatchDoorstuur — begrensde wachtrij en spool");
  {
    const spoolPad = path.join(os.tmpdir(), `pw-test-${process.pid}-d.jsonl`);
    fs.rmSync(spoolPad, { force: true });
    let klok = 1_000_000;
    const d = new PromptwatchDoorstuur({
      apiKey: "test",
      flushDrempel: 999_999,
      maxWachtrij: 10,
      spoolPad,
      maxSpoolBytes: 200,
      verstuur: async () => ({ ok: false, status: 0, netwerkfout: true }),
      log: () => {},
      waarschuw: () => {},
      nu: () => klok,
    });
    for (let i = 0; i < 25; i++) d.voegToe(maakEvent({ request_path: `/p${i}` }));
    test("wachtrij afgetopt op maxWachtrij", d.aantalInWachtrij() === 10);
    await d.flush();
    const spoolNa1 = fs.existsSync(spoolPad) ? fs.statSync(spoolPad).size : 0;
    test("netwerkfout: batch naar spool", spoolNa1 > 0);
    klok += backoffMs(1) + 1;
    for (let i = 0; i < 10; i++) d.voegToe(maakEvent());
    await d.flush();
    klok += backoffMs(2) + 1;
    for (let i = 0; i < 10; i++) d.voegToe(maakEvent());
    await d.flush();
    const spoolNa3 = fs.existsSync(spoolPad) ? fs.statSync(spoolPad).size : 0;
    test("spool groeit niet voorbij de limiet + één batch", spoolNa3 <= 200 + 10 * 400);
    fs.rmSync(spoolPad, { force: true });
  }

  console.log("PromptwatchDoorstuur — uur-zonder-succes-alert");
  {
    const spoolPad = path.join(os.tmpdir(), `pw-test-${process.pid}-e.jsonl`);
    fs.rmSync(spoolPad, { force: true });
    let klok = 1_000_000;
    const waarschuwingen: string[] = [];
    const d = new PromptwatchDoorstuur({
      apiKey: "test",
      flushDrempel: 999_999,
      spoolPad,
      verstuur: async () => ({ ok: false, status: 0, netwerkfout: true }),
      log: () => {},
      waarschuw: (r) => waarschuwingen.push(r),
      nu: () => klok,
    });
    d.voegToe(maakEvent());
    await d.flush();
    test("nog geen alert binnen het uur", !waarschuwingen.some((w) => w.includes("ALERT")));
    klok += 61 * 60 * 1000;
    await d.flush();
    test("na >1 uur zonder succes één ALERT", waarschuwingen.filter((w) => w.includes("ALERT")).length === 1);
    klok += 60 * 1000;
    await d.flush();
    test("alert herhaalt niet binnen het uur", waarschuwingen.filter((w) => w.includes("ALERT")).length === 1);
    fs.rmSync(spoolPad, { force: true });
  }

  console.log("Serialisatie");
  {
    const e = maakEvent({ query_string: "q=chef", referrer: "https://google.com" });
    const terug = JSON.parse(JSON.stringify([e]))[0];
    test("event overleeft JSON-rondgang", JSON.stringify(terug) === JSON.stringify(e));
    const body = JSON.stringify([maakEvent(), maakEvent()]);
    test("body is een JSON-array", body.startsWith("[") && JSON.parse(body).length === 2);
  }

  // Middleware zoals in server/index.ts, met een fictieve key. De timer wordt
  // direct gestopt en de drempel van 500 wordt niet gehaald, dus er wordt
  // niets naar Promptwatch verstuurd.
  console.log("Middleware (zonder te versturen)");
  {
    const vorige = process.env.PROMPTWATCH_LOGS_API_KEY;
    process.env.PROMPTWATCH_LOGS_API_KEY = "fictieve-testkey";
    const pw = maakPromptwatchDoorstuur()!;
    pw.doorstuur.stop();
    const verzoek = (method: string, originalUrl: string, ua = "Mozilla/5.0 (compatible; GPTBot/1.3)") => {
      const res = new EventEmitter() as any;
      res.statusCode = 200;
      res.getHeader = () => "text/html";
      const req = { method, originalUrl, ip: "203.0.113.1", hostname: "www.doehetextra.nl", headers: { "user-agent": ua } };
      pw.middleware(req, res, () => {});
      res.emit("finish");
    };
    verzoek("GET", "/vacatures");
    verzoek("GET", "/api/candidates/1/accept?token=fictief");
    verzoek("POST", "/api/whatsapp/webhook/fictief-geheim");
    verzoek("GET", "/cv-upload?token=fictief");
    verzoek("GET", "/robots.txt");
    test("alleen de twee openbare verzoeken staan in de wachtrij", pw.doorstuur.aantalInWachtrij() === 2);
    if (vorige === undefined) delete process.env.PROMPTWATCH_LOGS_API_KEY;
    else process.env.PROMPTWATCH_LOGS_API_KEY = vorige;
  }

  console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
  process.exit(gefaald > 0 ? 1 : 0);
}

main();
