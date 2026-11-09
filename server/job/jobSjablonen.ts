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
export const NAMEN: Record<SjabloonSoort, string> = { start: "job_start_v2", herinnering: "job_herinnering", afspraak: "job_afspraak" };
/** Eerste versie van het startsjabloon: Job gebruikt hem zolang job_start_v2 nog niet is goedgekeurd. */
export const START_OUD = "job_start";

interface Def { soort: SjabloonSoort; taal: "nl" | "en"; tekst: string; voorbeeld: string[]; knoppen?: string[] }

export const SJABLOON_DEFS: Def[] = [
  { soort: "start", taal: "nl",
    tekst: "Hi {{1}},\n\nIk ben Job, de AI-recruiter van EXTRA. Leuk dat je je hebt aangemeld voor {{2}}! Ik stel je een paar korte vragen.\n\nVertel eens: {{3}}?",
    voorbeeld: ["Lisa", "housekeeping", "wat is je ervaring met housekeeping tot nu toe"] },
  { soort: "start", taal: "en",
    tekst: "Hi {{1}},\n\nI'm Job, the AI recruiter at EXTRA. Great that you signed up for {{2}}! I have a few quick questions for you.\n\nTell me: {{3}}?",
    voorbeeld: ["Lisa", "housekeeping", "what experience do you have in housekeeping so far"] },
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

/**
 * De variabelen van het startsjabloon. job_start_v2 zet "Vertel eens:" en het
 * vraagteken zelf om de vraag (Meta wil geen variabele aan het eind), dus daar
 * gaat alleen de kern van de eerste vraag in. Het oude sjabloon krijgt de hele vraag.
 */
export function startParameters(naam: string, voornaam: string, functie: string, eersteVraag: string): string[] {
  if (naam !== NAMEN.start) return [voornaam, functie, eersteVraag];
  const kern = eersteVraag.trim().replace(/^(vertel eens|tell me)\s*:\s*/i, "").replace(/\?+\s*$/, "");
  return [voornaam, functie, kern];
}

/** De componenten zoals de Graph API ze verwacht. Puur, getest in shared/job.test.ts via jobSjablonen.test. */
export function componenten(d: Def): any[] {
  const c: any[] = [{ type: "BODY", text: d.tekst, example: { body_text: [d.voorbeeld] } }];
  if (d.knoppen?.length) c.push({ type: "BUTTONS", buttons: d.knoppen.map((t) => ({ type: "QUICK_REPLY", text: t })) });
  return c;
}

export function metaActief(): boolean {
  return (process.env.WHATSAPP_PROVIDER || "").trim().toLowerCase() === "meta" && meta.isMetaConfigured() && !!meta.wabaId();
}

/**
 * Bij een fout van Meta over het WhatsApp-account: welke accounts kan de
 * token wel bereiken? Meta geeft dat via debug_token (de token mag zichzelf
 * controleren). Zo ziet de beheerder direct welk ID in META_WA_BOT_WABA_ID hoort.
 */
async function accountHint(): Promise<string> {
  const token = process.env.META_WA_BOT_ACCESS_TOKEN || "";
  if (!token) return "";
  try {
    const url = `${meta.META_GRAPH_BASE_URL}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`;
    const r = await fetch(url);
    const d: any = await r.json().catch(() => ({}));
    const scopes: { scope: string; target_ids?: string[] }[] = d?.data?.granular_scopes || [];
    const ids = Array.from(new Set(scopes.filter((x) => /^whatsapp_business_(management|messaging)$/.test(x.scope)).flatMap((x) => x.target_ids || [])));
    const rechten = (d?.data?.scopes || []) as string[];
    if (!d?.data?.is_valid) return " De token is niet (meer) geldig: maak een nieuwe token aan.";
    const mist = ["whatsapp_business_messaging", "whatsapp_business_management"].filter((x) => !rechten.includes(x));
    if (mist.length) return ` De token mist de rechten: ${mist.join(", ")}.`;
    const huidig = meta.wabaId();
    if (ids.length) return ids.includes(huidig) ? "" : ` De token heeft toegang tot WhatsApp-account ${ids.join(" of ")}. Zet dat ID in META_WA_BOT_WABA_ID.`;
    // "Applies to all objects": de token mag alles waar de systeemgebruiker bij kan.
    // Kan hij het telefoonnummer lezen, dan klopt waarschijnlijk het account-ID niet.
    const tel = process.env.META_WA_BOT_PHONE_NUMBER_ID || "";
    if (!tel) return " META_WA_BOT_PHONE_NUMBER_ID ontbreekt.";
    const t = await fetch(`${meta.META_GRAPH_BASE_URL}/${encodeURIComponent(tel)}?fields=display_phone_number`, { headers: { Authorization: `Bearer ${token}` } });
    const td: any = await t.json().catch(() => ({}));
    if (t.ok && td?.display_phone_number) {
      // Wat voor ding is het ingestelde ID volgens Meta? Dan weet de beheerder precies wat er mis is.
      let soort = "";
      if (!huidig) soort = " META_WA_BOT_WABA_ID is leeg.";
      else if (!/^\d+$/.test(huidig)) soort = ` META_WA_BOT_WABA_ID (${huidig}) bevat meer dan alleen cijfers.`;
      else {
        try {
          const m = await fetch(`${meta.META_GRAPH_BASE_URL}/${huidig}?metadata=1&fields=id,name`, { headers: { Authorization: `Bearer ${token}` } });
          const md: any = await m.json().catch(() => ({}));
          const type = md?.metadata?.type as string | undefined;
          const namen: Record<string, string> = {
            whatsapp_business_account: "een WhatsApp Business-account (dat is goed)",
            whatsapp_business_phone_number: "het telefoonnummer-ID, niet het account-ID",
            business: "het ID van het Business-portfolio, niet van het WhatsApp-account",
            application: "het app-ID, niet het WhatsApp-account-ID",
            user: "een gebruikers-ID, niet het WhatsApp-account-ID",
          };
          if (type === "whatsapp_business_account") return ` Het ingestelde ID (${huidig}) is wel een WhatsApp Business-account en de token werkt, dus de fout zit in het verzoek zelf.`;
          if (type) soort = ` Het ingestelde ID (${huidig}) is volgens Meta ${namen[type] || `van het soort "${type}"`}.`;
          else if (md?.error) return ` De token kan het telefoonnummer (${td.display_phone_number}) wel lezen, maar het WhatsApp-account ${huidig} niet. Geef de systeemgebruiker toegang tot dit account: Bedrijfsinstellingen, WhatsApp-accounts, dit account, tabblad Mensen, systeemgebruiker toevoegen met volledige controle.`;
        } catch { /* geen soort */ }
      }
      // Welke WhatsApp Business-accounts heeft deze systeemgebruiker? Dan staat het juiste ID er meteen bij.
      let lijst = "";
      try {
        const a = await fetch(`${meta.META_GRAPH_BASE_URL}/me/assigned_whatsapp_business_accounts?fields=id,name`, { headers: { Authorization: `Bearer ${token}` } });
        const ad: any = await a.json().catch(() => ({}));
        const rijen = (ad?.data || []) as { id: string; name?: string }[];
        if (rijen.length) lijst = ` Deze systeemgebruiker heeft deze WhatsApp Business-accounts: ${rijen.map((r) => `${r.name || "zonder naam"} (${r.id})`).join(", ")}. Zet het ID van het testaccount in META_WA_BOT_WABA_ID.`;
      } catch { /* geen lijst */ }
      return ` Het telefoonnummer (${td.display_phone_number}) is wel bereikbaar, dus de token werkt. Het ID in META_WA_BOT_WABA_ID is waarschijnlijk niet het WhatsApp Business-account-ID.${soort}${lijst || " Neem het ID van het account uit WhatsApp Manager."}`;
    }
    return " De token kan ook het telefoonnummer niet lezen: wijs het WhatsApp-account van dit nummer toe aan de systeemgebruiker (volledige controle) en maak daarna een nieuwe token.";
  } catch { return ""; }
}

interface Stand { naam: string; taal: string; status: string; reden?: string }
let cache: { at: number; lijst: Stand[] } | null = null;
const CACHE_MS = 10 * 60 * 1000;

/** Status van de sjablonen bij Meta (10 minuten in het geheugen). */
export async function standBijMeta(vers = false): Promise<{ ok: boolean; lijst: Stand[]; fout?: string }> {
  if (!metaActief()) return { ok: false, lijst: [], fout: "Meta is niet gekoppeld (WHATSAPP_PROVIDER=meta en de META_WA_BOT_*-gegevens)." };
  if (!vers && cache && Date.now() - cache.at < CACHE_MS) return { ok: true, lijst: cache.lijst };
  const r = await meta.listTemplates();
  if (!r.ok) return { ok: false, lijst: cache?.lijst || [], fout: (r.error?.message || "Meta gaf een fout.") + (r.error?.details ? ` (${r.error.details})` : "") + (await accountHint()) };
  const namen = [...Object.values(NAMEN), START_OUD];
  const lijst = (r.templates || []).filter((t) => namen.includes(t.name)).map((t) => ({ naam: t.name, taal: t.language, status: t.status, reden: t.rejectedReason && t.rejectedReason !== "NONE" ? t.rejectedReason : undefined }));
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
  const klaar = (naam: string) => { const goed = s.lijst.filter((t) => t.naam === naam && t.status === "APPROVED").map((t) => t.taal); return goed.includes("nl") && goed.includes("en"); };
  if (klaar(NAMEN[soort])) return NAMEN[soort];
  // Start: tot job_start_v2 is goedgekeurd blijft het eerste startsjabloon werken.
  if (soort === "start" && klaar(START_OUD)) return START_OUD;
  return "";
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
    if (r.ok) uit.ingediend.push(label); else uit.fouten.push(`${label}: ${r.error?.message || "onbekende fout"}${r.error?.details ? ` (${r.error.details})` : ""}`);
    // Zelfde fout bij elk sjabloon (bijvoorbeeld een verkeerd account): één keer melden is genoeg.
    if (!r.ok && uit.ingediend.length === 0 && uit.fouten.length === 1 && /does not exist|permission/i.test(r.error?.message || "")) {
      uit.fouten[0] = `${r.error?.message || "Meta gaf een fout."}${r.error?.details ? ` (${r.error.details})` : ""}${await accountHint()}`;
      break;
    }
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
