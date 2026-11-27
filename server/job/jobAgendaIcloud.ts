/**
 * De verbinding met iCloud Agenda via CalDAV, zonder extra pakketten.
 *
 * Secrets (alleen door Max in Replit gezet, nooit in code of logs):
 *   ICLOUD_AGENDA_GEBRUIKER   het Apple-account van de website (agenda@doehetextra.nl)
 *   ICLOUD_AGENDA_WACHTWOORD  een app-specifiek wachtwoord van dat account
 * Schakelaars:
 *   AGENDA_KOPPELING=0        koppeling uit: Job werkt weer met alleen de vaste werktijden
 *   ICLOUD_AGENDA_LEZEN       de agenda waaruit Job leest wie bezet is (standaard "EXTRA")
 *   ICLOUD_AGENDA_SCHRIJVEN   de agenda waarin Job afspraken zet (standaard "EXTRA test" in de
 *                             testomgeving, anders "EXTRA")
 *
 * Deze module kent geen database. Het wachtwoord komt nooit in een foutmelding of log.
 */

import { tekstUit } from "../../shared/jobAgenda";

export interface AgendaConfig {
  gebruiker: string;
  wachtwoord: string;
  lezen: string;
  schrijven: string;
  omgeving: "test" | "prod";
}

export function agendaConfig(env: Record<string, string | undefined> = process.env): AgendaConfig | null {
  if (env.AGENDA_KOPPELING === "0") return null;
  const gebruiker = (env.ICLOUD_AGENDA_GEBRUIKER || "").trim();
  const wachtwoord = (env.ICLOUD_AGENDA_WACHTWOORD || "").trim();
  if (!gebruiker || !wachtwoord) return null;
  const test = env.TESTOMGEVING === "1";
  return {
    gebruiker, wachtwoord,
    lezen: (env.ICLOUD_AGENDA_LEZEN || "EXTRA").trim(),
    schrijven: (env.ICLOUD_AGENDA_SCHRIJVEN || (test ? "EXTRA test" : "EXTRA")).trim(),
    omgeving: test ? "test" : "prod",
  };
}

export type Haal = (url: string, init: RequestInit) => Promise<Response>;

const BASIS = "https://caldav.icloud.com/";
const TIMEOUT_MS = 12000;

/** Een fout zonder geheimen: alleen de stap en de HTTP-status. */
export class AgendaFout extends Error {
  constructor(public stap: string, public status?: number) {
    super(status ? `${stap} gaf ${status}${status === 401 ? " (gebruiker of app-specifiek wachtwoord klopt niet)" : ""}` : stap);
  }
}

function ontsnap(s: string): string {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

/** De inhoud van het eerste element met deze lokale naam (namespace-voorvoegsel maakt niet uit). */
export function element(xml: string, naam: string): string | null {
  const m = new RegExp(`<(?:[A-Za-z0-9_-]+:)?${naam}(?:\\s[^>]*)?(?:/>|>([\\s\\S]*?)</(?:[A-Za-z0-9_-]+:)?${naam}>)`).exec(xml);
  if (!m) return null;
  const binnen = m[1] ?? "";
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(binnen);
  return cdata ? cdata[1] : binnen;
}

export interface DavAntwoord { href: string; props: string; ok: boolean }

/** Splitst een multistatus-antwoord in de losse responses. */
export function multistatus(xml: string): DavAntwoord[] {
  const uit: DavAntwoord[] = [];
  const re = /<(?:[A-Za-z0-9_-]+:)?response(?:\s[^>]*)?>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?response>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const blok = m[1];
    const href = ontsnap((element(blok, "href") || "").trim());
    // Alleen de propstat met status 200 telt.
    const props: string[] = [];
    const pre = /<(?:[A-Za-z0-9_-]+:)?propstat(?:\s[^>]*)?>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?propstat>/g;
    let p: RegExpExecArray | null;
    while ((p = pre.exec(blok))) if (/\s200\s/.test(element(p[1], "status") || "")) props.push(p[1]);
    uit.push({ href, props: props.join("\n"), ok: props.length > 0 });
  }
  return uit;
}

export function kalenderData(props: string): string | null {
  const d = element(props, "calendar-data");
  return d === null ? null : ontsnap(d);
}

export interface Kalender { naam: string; url: string }

export class IcloudAgenda {
  private home: string | null = null;
  private kalenders: Kalender[] | null = null;
  private gevondenAt = 0;

  constructor(private cfg: AgendaConfig, private haal: Haal = (u, i) => fetch(u, i)) {}

  private kop(extra: Record<string, string> = {}): Record<string, string> {
    return { Authorization: `Basic ${Buffer.from(`${this.cfg.gebruiker}:${this.cfg.wachtwoord}`).toString("base64")}`, ...extra };
  }

  /** Een verzoek met dezelfde inlog over redirects heen (iCloud stuurt door naar een eigen server). */
  private async verzoek(stap: string, url: string, init: RequestInit & { headers?: Record<string, string> }, goed: number[]): Promise<{ status: number; tekst: string; url: string }> {
    let adres = url;
    for (let n = 0; n < 4; n++) {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
      let r: Response;
      try {
        r = await this.haal(adres, { ...init, headers: this.kop(init.headers || {}), redirect: "manual", signal: ac.signal });
      } catch {
        throw new AgendaFout(`${stap}: iCloud niet bereikbaar`);
      } finally {
        clearTimeout(t);
      }
      if ([301, 302, 307, 308].includes(r.status) && r.headers.get("location")) {
        adres = new URL(r.headers.get("location")!, adres).toString();
        continue;
      }
      const tekst = await r.text().catch(() => "");
      if (!goed.includes(r.status)) throw new AgendaFout(stap, r.status);
      return { status: r.status, tekst, url: adres };
    }
    throw new AgendaFout(`${stap}: te veel doorverwijzingen`);
  }

  private async propfind(stap: string, url: string, diepte: "0" | "1", body: string) {
    return this.verzoek(stap, url, { method: "PROPFIND", headers: { Depth: diepte, "Content-Type": "application/xml; charset=utf-8" }, body }, [207]);
  }

  /** Zoekt de agenda's van het account. Een uur bewaard. */
  async agendas(vers = false): Promise<Kalender[]> {
    if (!vers && this.kalenders && Date.now() - this.gevondenAt < 60 * 60 * 1000) return this.kalenders;
    const p1 = await this.propfind("Inloggen bij iCloud", BASIS, "0",
      `<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>`);
    const principal = element(element(p1.tekst, "current-user-principal") || "", "href");
    if (!principal) throw new AgendaFout("Geen account gevonden bij iCloud");
    const purl = new URL(ontsnap(principal.trim()), p1.url).toString();
    const p2 = await this.propfind("Agenda's zoeken", purl, "0",
      `<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><c:calendar-home-set/></d:prop></d:propfind>`);
    const homeHref = element(element(p2.tekst, "calendar-home-set") || "", "href");
    if (!homeHref) throw new AgendaFout("Geen agenda's gevonden bij iCloud");
    this.home = new URL(ontsnap(homeHref.trim()), p2.url).toString();
    const p3 = await this.propfind("Agenda's lezen", this.home, "1",
      `<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:displayname/><d:resourcetype/></d:prop></d:propfind>`);
    const lijst: Kalender[] = [];
    for (const a of multistatus(p3.tekst)) {
      if (!a.ok) continue;
      const type = element(a.props, "resourcetype") || "";
      if (!/calendar/.test(type)) continue;
      const naam = tekstUit(ontsnap((element(a.props, "displayname") || "").trim()));
      if (!naam) continue;
      lijst.push({ naam, url: new URL(a.href, p3.url).toString() });
    }
    this.kalenders = lijst;
    this.gevondenAt = Date.now();
    return lijst;
  }

  async kalender(naam: string): Promise<Kalender> {
    const zoek = (l: Kalender[]) => l.find((k) => k.naam.trim().toLowerCase() === naam.trim().toLowerCase());
    let k = zoek(await this.agendas());
    if (!k) k = zoek(await this.agendas(true));
    if (!k) throw new AgendaFout(`Agenda "${naam}" niet gevonden bij het account. Is hij gedeeld en geaccepteerd?`);
    return k;
  }

  /** Alle afspraken (als iCalendar) tussen twee momenten, met href. Herhalingen laat iCloud uitklappen. */
  async afspraken(naam: string, vanUtc: Date, totUtc: Date): Promise<{ href: string; ics: string }[]> {
    const k = await this.kalender(naam);
    const stempel = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const body = (uitklappen: boolean) => `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop><d:getetag/>${uitklappen ? `<c:calendar-data><c:expand start="${stempel(vanUtc)}" end="${stempel(totUtc)}"/></c:calendar-data>` : "<c:calendar-data/>"}</d:prop>
  <c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VEVENT"><c:time-range start="${stempel(vanUtc)}" end="${stempel(totUtc)}"/></c:comp-filter></c:comp-filter></c:filter>
</c:calendar-query>`;
    const lees = (uitklappen: boolean) => this.verzoek(`Agenda "${naam}" lezen`, k.url, { method: "REPORT", headers: { Depth: "1", "Content-Type": "application/xml; charset=utf-8" }, body: body(uitklappen) }, [207]);
    let r: { status: number; tekst: string; url: string };
    try {
      r = await lees(true);
    } catch (e) {
      // Kan de server herhalingen niet uitklappen, dan zonder: shared/jobAgenda.ts klapt dagelijks en wekelijks zelf uit.
      if (!(e instanceof AgendaFout) || ![400, 403, 415, 501].includes(e.status || 0)) throw e;
      r = await lees(false);
    }
    const uit: { href: string; ics: string }[] = [];
    for (const a of multistatus(r.tekst)) {
      if (!a.ok) continue;
      const ics = kalenderData(a.props);
      if (ics) uit.push({ href: new URL(a.href, r.url).toString(), ics });
    }
    return uit;
  }

  /** Zet een afspraak neer of werkt hem bij, onder een vaste bestandsnaam. */
  async plaats(naam: string, bestand: string, ics: string): Promise<void> {
    const k = await this.kalender(naam);
    const url = new URL(encodeURIComponent(bestand), k.url.endsWith("/") ? k.url : `${k.url}/`).toString();
    await this.verzoek("Afspraak in de agenda zetten", url, { method: "PUT", headers: { "Content-Type": "text/calendar; charset=utf-8" }, body: ics }, [200, 201, 204]);
  }

  /** Haalt een afspraak weg. Alleen voor Jobs eigen afspraken; de aanroeper controleert dat. */
  async verwijder(href: string): Promise<void> {
    await this.verzoek("Afspraak uit de agenda halen", href, { method: "DELETE" }, [200, 204, 404]);
  }
}
