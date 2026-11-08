/**
 * De drie WhatsApp-sjablonen van Job bij Meta (docs/JOB.md).
 *
 * Met WHATSAPP_PROVIDER=meta en de Meta-gegevens in de Secrets kan het
 * dashboard (tabblad Job) de sjablonen zelf indienen. Job gebruikt een
 * sjabloon zodra Meta het heeft goedgekeurd; de Secrets JOB_WA_SJABLOON_*
 * zijn dan niet meer nodig (als ze wel gezet zijn, gaan ze voor).
 *
 * Het nummer waar Job vanaf stuurt (voor wa.me-links) komt uit JOB_WA_NUMMER,
 * of anders uit Meta zelf (display_phone_number van het telefoonnummer-ID).
 */
import * as meta from "../whatsapp/metaClient";

export type SjabloonSoort = "start" | "herinnering" | "afspraak";
export const NAMEN: Record<SjabloonSoort, string> = { start: "job_start", herinnering: "job_herinnering", afspraak: "job_afspraak" };

interface Def { soort: SjabloonSoort; taal: "nl" | "en"; tekst: string; voorbeeld: string[]; knoppen?: string[] }

export const SJABLOON_DEFS: Def[] = [
  { soort: "start", taal: "nl",
    tekst: "Hoi {{1}}, ik ben Job, de AI-recruiter van EXTRA. Leuk dat je je hebt aangemeld voor {{2}}! Ik stel je een paar korte vragen; typ MENS als je liever een collega spreekt. Eerste vraag: {{3}} Je kunt hier gewoon antwoorden.",
    voorbeeld: ["Lisa", "bediening en bar", "Vertel eens: waar heb je tot nu toe in de horeca gewerkt?"] },
  { soort: "start", taal: "en",
    tekst: "Hi {{1}}, I'm Job, the AI recruiter of EXTRA. Thanks for signing up for {{2}}! I have a few quick questions; type HUMAN if you'd rather talk to a colleague. First question: {{3}} You can simply reply here.",
    voorbeeld: ["Lisa", "service and bar", "Tell me: where have you worked in hospitality so far?"] },
  { soort: "herinnering", taal: "nl",
    tekst: "Hoi {{1}}, je aanmelding bij EXTRA is nog niet af. Nog een paar korte vragen, dan kun je meteen een kennismaking plannen. Zullen we verder?",
    voorbeeld: ["Noor"], knoppen: ["Verder", "Liever bellen"] },
  { soort: "herinnering", taal: "en",
    tekst: "Hi {{1}}, your application at EXTRA isn't finished yet. A few more quick questions, then you can book a meeting right away. Shall we continue?",
    voorbeeld: ["Noor"], knoppen: ["Continue", "Call me instead"] },
  { soort: "afspraak", taal: "nl",
    tekst: "Hoi {{1}}, morgen om {{2}} is je kennismaking met {{3}} bij EXTRA, Herengracht 372 in Amsterdam. Neem je paspoort of ID-kaart mee. Lukt het?",
    voorbeeld: ["Lisa", "14:00", "Charlotte"], knoppen: ["Ik kom", "Verzetten"] },
  { soort: "afspraak", taal: "en",
    tekst: "Hi {{1}}, tomorrow at {{2}} you have your meeting with {{3}} at EXTRA, Herengracht 372 in Amsterdam. Bring your passport or ID card. Does that still work?",
    voorbeeld: ["Lisa", "14:00", "Charlotte"], knoppen: ["I'll be there", "Reschedule"] },
];

/** De componenten zoals de Graph API ze verwacht. Puur, getest in shared/job.test.ts via jobSjablonen.test. */
export function componenten(d: Def): any[] {
  const c: any[] = [{ type: "BODY", text: d.tekst, example: { body_text: [d.voorbeeld] } }];
  if (d.knoppen?.length) c.push({ type: "BUTTONS", buttons: d.knoppen.map((t) => ({ type: "QUICK_REPLY", text: t })) });
  return c;
}

export function metaActief(): boolean {
  return (process.env.WHATSAPP_PROVIDER || "").trim().toLowerCase() === "meta" && meta.isMetaConfigured() && !!meta.wabaId();
}

interface Stand { naam: string; taal: string; status: string; reden?: string }
let cache: { at: number; lijst: Stand[] } | null = null;
const CACHE_MS = 10 * 60 * 1000;

/** Status van de sjablonen bij Meta (10 minuten in het geheugen). */
export async function standBijMeta(vers = false): Promise<{ ok: boolean; lijst: Stand[]; fout?: string }> {
  if (!metaActief()) return { ok: false, lijst: [], fout: "Meta is niet gekoppeld (WHATSAPP_PROVIDER=meta en de META_WA_BOT_*-gegevens)." };
  if (!vers && cache && Date.now() - cache.at < CACHE_MS) return { ok: true, lijst: cache.lijst };
  const r = await meta.listTemplates();
  if (!r.ok) return { ok: false, lijst: cache?.lijst || [], fout: r.error?.message || "Meta gaf een fout." };
  const namen = Object.values(NAMEN);
  const lijst = (r.templates || []).filter((t) => namen.includes(t.name)).map((t) => ({ naam: t.name, taal: t.language, status: t.status, reden: t.rejectedReason }));
  cache = { at: Date.now(), lijst };
  return { ok: true, lijst };
}

/**
 * Het sjabloon dat Job gebruikt: een Secret gaat voor; anders het eigen
 * sjabloon als Meta het voor beide talen heeft goedgekeurd. Leeg = geen
 * sjabloon (Job valt terug op het webgesprek of de mail).
 */
export async function sjabloonNaam(soort: SjabloonSoort): Promise<string> {
  const env = { start: process.env.JOB_WA_SJABLOON_START, herinnering: process.env.JOB_WA_SJABLOON_HERINNERING, afspraak: process.env.JOB_WA_SJABLOON_AFSPRAAK }[soort];
  if (env && env.trim()) return env.trim();
  if (!metaActief()) return "";
  const s = await standBijMeta().catch(() => null);
  if (!s?.ok) return "";
  const goed = s.lijst.filter((t) => t.naam === NAMEN[soort] && t.status === "APPROVED").map((t) => t.taal);
  return goed.includes("nl") && goed.includes("en") ? NAMEN[soort] : "";
}

/** Dient de sjablonen in die nog niet bij Meta staan. Bestaande laat het staan. */
export async function dienIn(): Promise<{ ingediend: string[]; bestond: string[]; fouten: string[] }> {
  const uit = { ingediend: [] as string[], bestond: [] as string[], fouten: [] as string[] };
  if (!metaActief()) { uit.fouten.push("Meta is niet gekoppeld."); return uit; }
  const s = await standBijMeta(true);
  for (const d of SJABLOON_DEFS) {
    const label = `${NAMEN[d.soort]} (${d.taal})`;
    if (s.lijst.some((t) => t.naam === NAMEN[d.soort] && t.taal === d.taal)) { uit.bestond.push(label); continue; }
    const r = await meta.submitTemplate({ name: NAMEN[d.soort], language: d.taal, category: "UTILITY", components: componenten(d) });
    if (r.ok) uit.ingediend.push(label); else uit.fouten.push(`${label}: ${r.error?.message || "onbekende fout"}`);
  }
  cache = null;
  return uit;
}

let nummerCache: string | null = null;
/** Het WhatsApp-nummer van Job in E.164, voor wa.me-links. */
export async function jobNummer(): Promise<string | null> {
  const env = (process.env.JOB_WA_NUMMER || "").trim();
  if (env) return env;
  if (nummerCache) return nummerCache;
  if (!metaActief() || !process.env.META_WA_BOT_PHONE_NUMBER_ID) return null;
  try {
    const r = await fetch(`${meta.META_GRAPH_BASE_URL}/${process.env.META_WA_BOT_PHONE_NUMBER_ID}?fields=display_phone_number`, {
      headers: { Authorization: `Bearer ${process.env.META_WA_BOT_ACCESS_TOKEN || ""}` },
      signal: AbortSignal.timeout(10000),
    });
    const d: any = await r.json().catch(() => ({}));
    const n = String(d?.display_phone_number || "").replace(/[^\d+]/g, "");
    if (n) nummerCache = n.startsWith("+") ? n : `+${n}`;
  } catch { /* geen nummer: de knoppen vallen terug op de weblink */ }
  return nummerCache;
}
