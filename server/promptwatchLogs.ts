/**
 * Promptwatch logdoorstuur — bouwopdracht Wrkt Digital 20-08-2026.
 *
 * Waarom: het Promptwatch-browserscript ziet alleen echte bezoekers.
 * AI-crawlers (GPTBot, ClaudeBot, PerplexityBot, …) voeren geen JavaScript
 * uit en zijn dus alleen zichtbaar in de serverlogs. Deze module vangt elk
 * verzoek naar een openbare pagina af (de crawler-herkenning gebeurt bewust
 * aan de Promptwatch-kant — voorfilteren op user-agent zou nieuwe crawlers
 * missen) en stuurt ze gebatcht door naar `POST https://logs.promptwatch.com/event`.
 * Sinds fase 0, stap 0.2 gaan interne routes, tokens en interne referrers
 * niet meer mee; zie isOpenbarePagina, schoonQuery en schoonReferrer.
 *
 * Ontwerpkeuzes, in lijn met de eisen uit de bouwopdracht:
 *
 * 1. Volledig buiten het request-pad. De middleware doet per request alleen
 *    een `res.on("finish")`-listener + één array-push; het versturen gebeurt
 *    op een timer. Een trage of onbereikbare Promptwatch-endpoint kan de
 *    site dus nooit vertragen.
 * 2. Batching: flush elke 60 s of zodra er 500 events staan (wat het eerst
 *    komt), maximaal 1000 events per POST — ruim onder de 50 MB-limiet.
 * 3. Betrouwbaarheid: bij netwerkfouten en 5xx gaat de batch naar een
 *    disk-spool (JSONL) en geldt exponential backoff; bij 4xx wordt de batch
 *    gelogd en definitief losgelaten (niet blijven retryen). De spool is
 *    begrensd zodat een langdurige storing nooit de schijf vol schrijft.
 *    NB: op Replit-deployments is de disk per deploy; de spool overleeft een
 *    procescrash, niet een redeploy — dat is daar het haalbare maximum.
 * 4. Secrets: de API-key komt uitsluitend uit de omgevingsvariabele
 *    PROMPTWATCH_LOGS_API_KEY (Replit Secret). Zonder key, of buiten een
 *    Replit-publicatie (REPLIT_DEPLOYMENT=1), is de hele module een no-op
 *    met één duidelijke opstartregel. Zie promptwatchModus.
 * 5. Observability: per flush één logregel met verzonden/accepted/dropped/
 *    status. `dropped` is verwacht gedrag (al het niet-crawlerverkeer) en
 *    levert bewust géén error-log op; de relevante indicator is `accepted`.
 *    Als er een uur lang geen enkele succesvolle flush was terwijl er wel
 *    verkeer is, verschijnt er één waarschuwing per uur.
 *
 * De kernfuncties zijn puur en zonder Express-afhankelijkheid, zodat
 * `npm run promptwatchlogs:test` ze onder kale tsx kan draaien.
 */

import fs from "fs";
import path from "path";
import os from "os";

import { clientIp } from "./clientIp";
import { ROUTE_META_BY_PATH, DYNAMIC_ROUTE_PATTERNS, normalizeMetaPath } from "../shared/routeMeta";
import { resolveRedirect } from "./redirects";

// ── Types ────────────────────────────────────────────────────────────────

/** Eén event in het formaat dat Promptwatch verwacht. Alle velden moeten
 *  aanwezig zijn; alleen query_string en referrer mogen null zijn. */
export interface PromptwatchEvent {
  timestamp: string;
  status_code: number;
  request_method: string;
  request_path: string;
  query_string: string | null;
  content_type: string;
  client_ip: string;
  hostname: string;
  user_agent: string;
  referrer: string | null;
}

/** Het minimale request/response-oppervlak dat we nodig hebben — bewust
 *  smaller dan Express' eigen types zodat tests kale objecten kunnen geven. */
export interface RequestSnapshot {
  method: string;
  originalUrl: string;
  ip?: string;
  hostname?: string;
  headers: Record<string, string | string[] | undefined>;
}
export interface ResponseSnapshot {
  statusCode: number;
  contentType?: unknown; // res.getHeader("content-type") kan string|number|string[]|undefined zijn
}

// ── Pure helpers ─────────────────────────────────────────────────────────

/** Splitst een originalUrl in pad (zonder query) en query-string (zonder ?,
 *  null wanneer afwezig of leeg). Fragmenten (#) komen server-side niet voor,
 *  maar worden voor de zekerheid bij het pad gelaten zoals ontvangen. */
export function splitsUrl(originalUrl: string): { pad: string; query: string | null } {
  const i = originalUrl.indexOf("?");
  if (i === -1) return { pad: originalUrl || "/", query: null };
  const query = originalUrl.slice(i + 1);
  return { pad: originalUrl.slice(0, i) || "/", query: query === "" ? null : query };
}

/** Eerste waarde van een header die string of string[] kan zijn. */
function eersteHeader(waarde: string | string[] | undefined): string | undefined {
  return Array.isArray(waarde) ? waarde[0] : waarde;
}

// ── Wat mag naar Promptwatch (fase 0, stap 0.2) ─────────────────────────
//
// Promptwatch heeft voor crawler- en AI-vindbaarheidsanalyse alleen
// openbare paginaverzoeken nodig: pad, status, user-agent en IP (voor de
// botverificatie), hostname, referrer en de campagnebron. Interne routes
// (/api, dashboard, cv-upload) bevatten soms geheime tokens of webhook-
// geheimen en gaan daarom niet meer mee.
//
// Bewust een toelatingslijst in plaats van een uitsluitlijst: een nieuwe
// interne route is zo vanzelf afgeschermd. De lijst volgt uit dezelfde bron
// als de sitemap (shared/routeMeta.ts), zodat een nieuwe openbare pagina
// vanzelf meegaat.

/** Bestanden die crawlers ophalen en die Promptwatch moet blijven zien. */
const CRAWLER_BESTANDEN = new Set(["/robots.txt", "/sitemap.xml", "/llms.txt", "/llms-full.txt"]);

/** Zoekparameters die mee mogen: alleen de campagnebron, bijvoorbeeld
 *  utm_source=chatgpt.com waarmee ChatGPT zijn links markeert. */
const TOEGESTANE_PARAMETERS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]);

/** Bekend openbaar pad: indexeerbare route, blog, vacature of crawlerbestand. */
function isBekendOpenbaarPad(genormaliseerd: string): boolean {
  if (CRAWLER_BESTANDEN.has(genormaliseerd)) return true;
  const meta = ROUTE_META_BY_PATH[genormaliseerd];
  if (meta) return !meta.noindex;
  return DYNAMIC_ROUTE_PATTERNS.some((r) => r.pattern.test(genormaliseerd));
}

/** true als het verzoek een openbare pagina is die naar Promptwatch mag.
 *  Oude URL's die met een 301 naar een openbare pagina gaan, tellen mee:
 *  crawlers die nog oude adressen bezoeken zijn juist nuttig om te zien. */
export function isOpenbarePagina(methode: string, pad: string): boolean {
  if (methode !== "GET" && methode !== "HEAD") return false;
  let gedecodeerd: string;
  try {
    gedecodeerd = decodeURI(pad || "/");
  } catch {
    return false;
  }
  const genormaliseerd = normalizeMetaPath(gedecodeerd);
  if (genormaliseerd === "/api" || genormaliseerd.startsWith("/api/")) return false;
  if (isBekendOpenbaarPad(genormaliseerd)) return true;
  const bestemming = resolveRedirect(genormaliseerd);
  if (!bestemming) return false;
  const bestemmingPad = bestemming.startsWith("/") ? bestemming.split("?")[0] : (() => {
    try { return new URL(bestemming).pathname; } catch { return ""; }
  })();
  return bestemmingPad !== "" && isBekendOpenbaarPad(normalizeMetaPath(bestemmingPad));
}

/** Houdt van de query alleen de toegestane campagneparameters over. */
export function schoonQuery(query: string | null): string | null {
  if (!query) return null;
  const uit = new URLSearchParams();
  new URLSearchParams(query).forEach((waarde, sleutel) => {
    if (TOEGESTANE_PARAMETERS.has(sleutel.toLowerCase())) uit.append(sleutel, waarde);
  });
  const tekst = uit.toString();
  return tekst === "" ? null : tekst;
}

/** Referrer zonder query of fragment: alleen herkomst en pad. Zo lekt een
 *  token uit de vorige pagina nooit via de referrer mee. */
export function schoonReferrer(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin + url.pathname;
  } catch {
    return null;
  }
}

/** Bouwt één Promptwatch-event uit een request/response-momentopname.
 *  `nu` wordt geïnjecteerd zodat tests deterministisch zijn. Query en
 *  referrer worden altijd geschoond (zie schoonQuery en schoonReferrer). */
export function eventVanRequest(
  req: RequestSnapshot,
  res: ResponseSnapshot,
  nu: Date,
): PromptwatchEvent {
  const { pad, query } = splitsUrl(req.originalUrl);
  const contentType = res.contentType;
  return {
    timestamp: nu.toISOString(),
    status_code: res.statusCode,
    request_method: req.method,
    request_path: pad,
    query_string: schoonQuery(query),
    // Alle velden moeten aanwezig zijn; alleen query_string/referrer mogen
    // null zijn. Ontbrekende waarden worden dus een lege string.
    content_type:
      typeof contentType === "string" ? contentType
      : Array.isArray(contentType) ? String(contentType[0] ?? "")
      : contentType == null ? ""
      : String(contentType),
    // req.ip is hier niet bruikbaar: achter de load balancer van Google levert
    // dat met `trust proxy: 1` het Google-adres op in plaats van dat van de
    // bezoeker, waardoor Promptwatch geen enkele bot kon verifiëren. Zie de
    // toelichting in server/clientIp.ts.
    client_ip: clientIp(req.headers["x-forwarded-for"], req.ip, (req as any).socket?.remoteAddress),
    hostname: req.hostname || eersteHeader(req.headers.host)?.split(":")[0] || "",
    user_agent: eersteHeader(req.headers["user-agent"]) || "",
    referrer: schoonReferrer(eersteHeader(req.headers.referer) ?? eersteHeader(req.headers.referrer)),
  };
}

/** Verdeelt events in batches van maximaal `max` stuks (volgorde behouden). */
export function verdeelInBatches<T>(items: T[], max: number): T[][] {
  if (max < 1) throw new Error("batchgrootte moet minstens 1 zijn");
  const uit: T[][] = [];
  for (let i = 0; i < items.length; i += max) uit.push(items.slice(i, i + max));
  return uit;
}

/** Exponential backoff: 5s, 10s, 20s, … afgetopt op 5 minuten. */
export function backoffMs(mislukkingenOpRij: number): number {
  if (mislukkingenOpRij <= 0) return 0;
  return Math.min(5_000 * 2 ** (mislukkingenOpRij - 1), 300_000);
}

/** Response-vorm van de Promptwatch-endpoint (alleen wat wij gebruiken). */
export interface FlushUitkomst {
  ok: boolean;            // HTTP 2xx
  status: number;         // HTTP-status (0 bij netwerkfout)
  netwerkfout: boolean;
  received?: number;
  accepted?: number;
  dropped?: number;
}

/** Interpreteert een uitkomst: mag de batch weg (verstuurd of 4xx-drop),
 *  of moet hij bewaard blijven voor een nieuwe poging (netwerk/5xx)? */
export function batchMagWeg(uitkomst: FlushUitkomst): boolean {
  if (uitkomst.ok) return true;
  if (uitkomst.netwerkfout) return false;
  // 4xx: niet blijven retryen — loggen en laten vallen. 5xx: bewaren.
  return uitkomst.status >= 400 && uitkomst.status < 500;
}

// ── Doorstuur met buffer, spool en backoff ───────────────────────────────

export interface DoorstuurOpties {
  apiKey: string;
  endpoint?: string;
  flushIntervalMs?: number;   // standaard 60_000
  flushDrempel?: number;      // standaard 500 — flush direct bij dit aantal
  maxPerBatch?: number;       // standaard 1000
  maxWachtrij?: number;       // standaard 10_000 — daarboven valt het oudste weg
  spoolPad?: string;          // JSONL-bestand voor mislukte batches
  maxSpoolBytes?: number;     // standaard 5 MB
  verstuur?: (events: PromptwatchEvent[]) => Promise<FlushUitkomst>;
  log?: (regel: string) => void;
  waarschuw?: (regel: string) => void;
  nu?: () => number;          // ms-klok, injecteerbaar voor tests
}

export class PromptwatchDoorstuur {
  private wachtrij: PromptwatchEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private bezig = false;
  private mislukkingenOpRij = 0;
  private volgendePogingNa = 0;
  private laatsteSucces: number;
  private laatsteUurWaarschuwing = 0;
  private weggevallenDoorVolleWachtrij = 0;

  private readonly endpoint: string;
  private readonly flushIntervalMs: number;
  private readonly flushDrempel: number;
  private readonly maxPerBatch: number;
  private readonly maxWachtrij: number;
  private readonly spoolPad: string;
  private readonly maxSpoolBytes: number;
  private readonly verstuurFn: (events: PromptwatchEvent[]) => Promise<FlushUitkomst>;
  private readonly log: (regel: string) => void;
  private readonly waarschuw: (regel: string) => void;
  private readonly nu: () => number;

  constructor(private readonly opties: DoorstuurOpties) {
    this.endpoint = opties.endpoint ?? "https://logs.promptwatch.com/event";
    this.flushIntervalMs = opties.flushIntervalMs ?? 60_000;
    this.flushDrempel = opties.flushDrempel ?? 500;
    this.maxPerBatch = opties.maxPerBatch ?? 1000;
    this.maxWachtrij = opties.maxWachtrij ?? 10_000;
    this.spoolPad = opties.spoolPad ?? path.join(os.tmpdir(), "promptwatch-spool.jsonl");
    this.maxSpoolBytes = opties.maxSpoolBytes ?? 5 * 1024 * 1024;
    this.verstuurFn = opties.verstuur ?? ((events) => this.verstuurViaFetch(events));
    this.log = opties.log ?? ((r) => console.log(r));
    this.waarschuw = opties.waarschuw ?? ((r) => console.warn(r));
    this.nu = opties.nu ?? (() => Date.now());
    this.laatsteSucces = this.nu();
  }

  /** O(1), synchroon, geen I/O — veilig vanuit het request-pad. */
  voegToe(event: PromptwatchEvent): void {
    if (this.wachtrij.length >= this.maxWachtrij) {
      this.wachtrij.shift();
      this.weggevallenDoorVolleWachtrij++;
    }
    this.wachtrij.push(event);
    if (this.wachtrij.length >= this.flushDrempel) {
      // Niet awaiten: de aanroeper (res.on("finish")) mag hier niet op wachten.
      void this.flush();
    }
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.flush(), this.flushIntervalMs);
    // De timer mag het proces nooit in leven houden.
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  aantalInWachtrij(): number {
    return this.wachtrij.length;
  }

  /** Eén flush-cyclus: eerst de spool (oudste eerst), dan de wachtrij.
   *  Respecteert backoff; hooguit één POST per aanroep per bron. */
  async flush(): Promise<void> {
    if (this.bezig) return;
    if (this.nu() < this.volgendePogingNa) return;
    this.bezig = true;
    try {
      await this.flushSpool();
      await this.flushWachtrij();
      this.controleerStilte();
    } finally {
      this.bezig = false;
    }
  }

  private async flushWachtrij(): Promise<void> {
    if (this.wachtrij.length === 0) return;
    if (this.nu() < this.volgendePogingNa) return;
    const batch = this.wachtrij.splice(0, this.maxPerBatch);
    const uitkomst = await this.veiligVersturen(batch);
    this.verwerkUitkomst(batch, uitkomst, "wachtrij");
  }

  private async flushSpool(): Promise<void> {
    const events = this.leesSpool(this.maxPerBatch);
    if (events.length === 0) return;
    const uitkomst = await this.veiligVersturen(events);
    if (batchMagWeg(uitkomst)) {
      this.verwijderUitSpool(events.length);
    }
    this.verwerkUitkomst(events, uitkomst, "spool", /*alInSpool=*/ true);
  }

  private async veiligVersturen(batch: PromptwatchEvent[]): Promise<FlushUitkomst> {
    try {
      return await this.verstuurFn(batch);
    } catch {
      return { ok: false, status: 0, netwerkfout: true };
    }
  }

  private verwerkUitkomst(
    batch: PromptwatchEvent[],
    uitkomst: FlushUitkomst,
    bron: "wachtrij" | "spool",
    alInSpool = false,
  ): void {
    if (uitkomst.ok) {
      this.mislukkingenOpRij = 0;
      this.volgendePogingNa = 0;
      this.laatsteSucces = this.nu();
      // dropped is verwacht gedrag (niet-crawlerverkeer) — geen error-log.
      this.log(
        `[promptwatch] flush ${bron}: ${batch.length} events, ` +
        `received=${uitkomst.received ?? "?"} accepted=${uitkomst.accepted ?? "?"} ` +
        `dropped=${uitkomst.dropped ?? "?"} (HTTP ${uitkomst.status})`,
      );
      if (this.weggevallenDoorVolleWachtrij > 0) {
        this.waarschuw(
          `[promptwatch] wachtrij liep vol: ${this.weggevallenDoorVolleWachtrij} events weggevallen`,
        );
        this.weggevallenDoorVolleWachtrij = 0;
      }
      return;
    }
    if (batchMagWeg(uitkomst)) {
      // 4xx: definitief laten vallen, wél zichtbaar maken.
      this.waarschuw(
        `[promptwatch] flush ${bron} geweigerd met HTTP ${uitkomst.status}; ` +
        `${batch.length} events losgelaten (4xx wordt niet geretryd)`,
      );
      return;
    }
    // Netwerk of 5xx: bewaren en backoff.
    this.mislukkingenOpRij++;
    this.volgendePogingNa = this.nu() + backoffMs(this.mislukkingenOpRij);
    if (!alInSpool) this.schrijfNaarSpool(batch);
    this.waarschuw(
      `[promptwatch] flush ${bron} mislukt (${uitkomst.netwerkfout ? "netwerkfout" : `HTTP ${uitkomst.status}`}); ` +
      `${batch.length} events in spool, volgende poging over ${Math.round(backoffMs(this.mislukkingenOpRij) / 1000)}s`,
    );
  }

  /** Eén waarschuwing per uur als er wel verkeer is maar al ≥1 uur geen
   *  succesvolle flush ("nul succesvolle flushes in het laatste uur"). */
  private controleerStilte(): void {
    const uur = 60 * 60 * 1000;
    const nu = this.nu();
    const erIsVerkeer = this.wachtrij.length > 0 || this.spoolBytes() > 0;
    if (erIsVerkeer && nu - this.laatsteSucces >= uur && nu - this.laatsteUurWaarschuwing >= uur) {
      this.laatsteUurWaarschuwing = nu;
      this.waarschuw(
        "[promptwatch] ALERT: al ruim een uur geen succesvolle flush naar " +
        this.endpoint + " terwijl er wel verkeer in de buffer staat",
      );
    }
  }

  // ── Spool (JSONL op disk) ──────────────────────────────────────────────

  private spoolBytes(): number {
    try {
      return fs.statSync(this.spoolPad).size;
    } catch {
      return 0;
    }
  }

  private schrijfNaarSpool(events: PromptwatchEvent[]): void {
    try {
      if (this.spoolBytes() >= this.maxSpoolBytes) {
        this.waarschuw(
          `[promptwatch] spool vol (≥${this.maxSpoolBytes} bytes): ${events.length} events weggevallen`,
        );
        return;
      }
      const regels = events.map((e) => JSON.stringify(e)).join("\n") + "\n";
      fs.appendFileSync(this.spoolPad, regels, "utf8");
    } catch {
      // Disk-problemen mogen de site nooit raken; stil laten vallen.
    }
  }

  private leesSpool(max: number): PromptwatchEvent[] {
    try {
      if (!fs.existsSync(this.spoolPad)) return [];
      const inhoud = fs.readFileSync(this.spoolPad, "utf8");
      const events: PromptwatchEvent[] = [];
      for (const regel of inhoud.split("\n")) {
        if (events.length >= max) break;
        if (!regel.trim()) continue;
        try {
          events.push(JSON.parse(regel));
        } catch {
          // Kapotte regel (bijv. halve write bij crash): overslaan.
        }
      }
      return events;
    } catch {
      return [];
    }
  }

  private verwijderUitSpool(aantal: number): void {
    try {
      if (!fs.existsSync(this.spoolPad)) return;
      const regels = fs.readFileSync(this.spoolPad, "utf8").split("\n").filter((r) => r.trim());
      const rest = regels.slice(aantal);
      if (rest.length === 0) fs.rmSync(this.spoolPad, { force: true });
      else fs.writeFileSync(this.spoolPad, rest.join("\n") + "\n", "utf8");
    } catch {
      // idem: nooit laten escaleren.
    }
  }

  // ── Echte verzending ───────────────────────────────────────────────────

  private async verstuurViaFetch(events: PromptwatchEvent[]): Promise<FlushUitkomst> {
    const antwoord = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.opties.apiKey,
      },
      body: JSON.stringify(events),
      signal: AbortSignal.timeout(30_000),
    });
    let received: number | undefined, accepted: number | undefined, dropped: number | undefined;
    try {
      const json: any = await antwoord.json();
      received = json?.details?.outcome?.received;
      accepted = json?.details?.outcome?.accepted;
      dropped = json?.details?.outcome?.dropped;
    } catch {
      // Geen JSON terug — status alleen is genoeg om te beslissen.
    }
    return {
      ok: antwoord.ok,
      status: antwoord.status,
      netwerkfout: false,
      received,
      accepted,
      dropped,
    };
  }
}

// ── Express-koppeling ────────────────────────────────────────────────────

/** Uitkomst van de omgevingscontrole: wel of niet doorsturen, en waarom. */
export interface PromptwatchModus {
  actief: boolean;
  /** Eén regel voor de opstartlog. */
  melding: string;
  /** true → als waarschuwing loggen (productie die niet goed is ingesteld). */
  waarschuwing: boolean;
}

/**
 * Fase 0: Promptwatch verstuurt alleen vanuit een Replit-publicatie. Replit
 * zet daar REPLIT_DEPLOYMENT op "1"; in de workspace en de preview ontbreekt
 * die. NODE_ENV is hiervoor niet betrouwbaar (een productiebuild in de
 * preview draait ook met production). Development verstuurt dus nooit, ook
 * niet als de sleutel in de Secrets staat. Puur, zodat de tests elke
 * combinatie kunnen nalopen zonder iets te versturen.
 */
export function promptwatchModus(env: Record<string, string | undefined>): PromptwatchModus {
  const sleutel = env.PROMPTWATCH_LOGS_API_KEY;
  const deployment = env.REPLIT_DEPLOYMENT;
  const isProductie = deployment === "1";

  if (!isProductie) {
    if (deployment !== undefined && deployment !== "") {
      return {
        actief: false,
        waarschuwing: true,
        melding: `[promptwatch] uit: REPLIT_DEPLOYMENT heeft een onverwachte waarde (verwacht "1" in productie); er wordt niets verstuurd`,
      };
    }
    return {
      actief: false,
      waarschuwing: false,
      melding: sleutel
        ? "[promptwatch] uit in development: sleutel aanwezig, maar alleen een publicatie verstuurt logs"
        : "[promptwatch] uit in development (geen sleutel, geen publicatie)",
    };
  }

  if (!sleutel || sleutel.trim() === "") {
    return {
      actief: false,
      waarschuwing: true,
      melding: "[promptwatch] WAARSCHUWING: productie zonder geldige PROMPTWATCH_LOGS_API_KEY; crawlerbezoeken worden niet doorgestuurd",
    };
  }
  if (sleutel !== sleutel.trim()) {
    return {
      actief: true,
      waarschuwing: true,
      melding: "[promptwatch] actief in productie, maar de sleutel bevat spaties of een regeleinde; controleer de Secret als Promptwatch HTTP 401 geeft",
    };
  }
  return { actief: true, waarschuwing: false, melding: "[promptwatch] actief in productie" };
}

/** Leest de omgeving en levert middleware + gestarte doorstuur, of null
 *  wanneer er niet verstuurd mag worden (development, of productie zonder
 *  sleutel). Dan is alles een no-op. De reden staat in de opstartlog. */
export function maakPromptwatchDoorstuur(
  env: Record<string, string | undefined> = process.env,
  logger: { log: (r: string) => void; warn: (r: string) => void } = console,
): {
  doorstuur: PromptwatchDoorstuur;
  middleware: (req: any, res: any, next: any) => void;
} | null {
  const modus = promptwatchModus(env);
  if (modus.waarschuwing) logger.warn(modus.melding);
  else logger.log(modus.melding);
  if (!modus.actief) return null;
  const apiKey = env.PROMPTWATCH_LOGS_API_KEY as string;
  const doorstuur = new PromptwatchDoorstuur({ apiKey });
  const middleware = (req: any, res: any, next: any) => {
    res.on("finish", () => {
      try {
        // Alleen openbare pagina's; interne routes en tokens gaan niet mee.
        if (!isOpenbarePagina(req.method, splitsUrl(req.originalUrl || "/").pad)) return;
        doorstuur.voegToe(
          eventVanRequest(
            {
              method: req.method,
              originalUrl: req.originalUrl,
              ip: req.ip,
              hostname: req.hostname,
              headers: req.headers,
            },
            { statusCode: res.statusCode, contentType: res.getHeader?.("content-type") },
            new Date(),
          ),
        );
      } catch {
        // Logdoorstuur mag nooit een request laten falen.
      }
    });
    next();
  };
  doorstuur.start();
  return { doorstuur, middleware };
}
