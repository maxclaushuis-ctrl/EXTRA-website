/**
 * Cv-analyse en kandidaatmatch (Job 3.0, fase 4).
 *
 * Zodra een cv binnenkomt: tekst uit het bestand halen (pdf en docx; een foto,
 * oud Word-bestand of scan niet), afschermen (shared/cvAfschermen.ts), de
 * afgeschermde tekst door de AI laten uitlezen tot werkperiodes, kerntaken en
 * certificaten, en dat opslaan in cv_analyses. De score rekent
 * shared/kandidaatMatch.ts uit met vaste regels; de AI beslist nooit.
 *
 * Alleen tekst gaat naar de AI, nooit het bestand of een beeld, en alleen als
 * de tweede controle van het afschermen niets van het dossier meer vindt.
 *
 * Schakelaar JOB_V3_MATCH: in de testomgeving vanzelf aan, uit met 0;
 * elders alleen met 1.
 */
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { candidates, cvAnalyses, jobGesprekken, kandidaatMatches, type CvAnalyse } from "@shared/schema";
import { afschermen } from "@shared/cvAfschermen";
import { matchKaart, modelVoor, type FunctieModel, type MatchKaart, type Periode } from "@shared/kandidaatMatch";
import { soortVan, valideerAnalyse } from "@shared/cvLezen";
export { soortVan, valideerAnalyse };
import type { JobVelden } from "@shared/jobRegels";

export function matchAan(): boolean {
  const w = process.env.JOB_V3_MATCH;
  return w === "1" || (process.env.TESTOMGEVING === "1" && w !== "0");
}

/** Tekst uit een pdf of docx. Null bij een foto, een oud .doc of iets anders. */
export async function tekstUitBestand(buffer: Buffer, bestand: string): Promise<string | null> {
  const ext = (bestand.split("?")[0].split(".").pop() || "").toLowerCase();
  if (ext === "pdf") {
    const mod: any = await import("pdf-parse");
    const PDFParse = mod.PDFParse || mod.default?.PDFParse;
    const p = new PDFParse({ data: new Uint8Array(buffer) });
    try { const r = await p.getText(); return String(r?.text || ""); }
    finally { try { await p.destroy?.(); } catch { /* niets */ } }
  }
  if (ext === "docx") {
    const AdmZip: any = ((await import("adm-zip" as any)) as any).default;
    const zip = new AdmZip(buffer);
    const xml = zip.getEntry("word/document.xml")?.getData().toString("utf-8") || "";
    return (xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [])
      .map((p: string) => p.replace(/<w:tab\/>/g, " ").replace(/<w:br\/>/g, "\n").replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, "$1").replace(/<[^>]+>/g, ""))
      .map((r: string) => r.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'"))
      .join("\n");
  }
  return null;
}

function prompt(model: FunctieModel, gesprekErvaring: string | null, peil: Date, aanvullingen: { vraag: string; antwoord?: string }[] = []): string {
  return `Je leest een afgeschermd cv voor uitzendbureau EXTRA in Amsterdam. Persoonsgegevens zijn al vervangen door [naam], [telefoon] en dergelijke.
De kandidaat meldde zich aan voor: ${model.naam}.
Kerntaken van deze functie, genummerd: ${model.kerntaken.map((k, i) => `${i} = ${k}`).join("; ")}.
Telt als verwante ervaring: ${model.verwant}.
Peildatum: ${peil.toISOString().slice(0, 7)}.
${gesprekErvaring ? `In het gesprek met Job zei de kandidaat over ervaring: "${gesprekErvaring.slice(0, 300)}"` : "Uit het gesprek is nog niets over ervaring bekend."}
${aanvullingen.filter((a) => a.antwoord).length ? `Na het lezen van het cv vroeg Job nog (tel de antwoorden mee: voeg kerntaken toe aan de periode waar het over gaat, zet einde op "heden" als de kandidaat daar nog werkt, voeg een periode of certificaat toe als de kandidaat dat noemt; verzin niets):\n${aanvullingen.filter((a) => a.antwoord).map((a) => `- Vraag: ${a.vraag}\n  Antwoord: "${String(a.antwoord).slice(0, 300)}"`).join("\n")}` : ""}

Haal per werkperiode uit het cv:
- functie en werkgever zoals in het cv
- soort: "zelfde" als het werk echt deze functie is (titel of werkzaamheden), "verwant" alleen als het past bij wat als verwant telt, anders "anders"
- kerntaken: de nummers van de kerntaken die de beschreven werkzaamheden aantonen; niet afleiden uit alleen een functietitel; elke kerntaak één keer
- begin en einde: "YYYY-MM" als de maand er staat, "YYYY" als alleen het jaar er staat, "heden" bij tot heden of nu, anders null
- citaat: de regel uit het cv waar het staat (hooguit 150 tekens)
Certificaten: alleen wat er letterlijk staat.
Gesprek: alleen als het gesprek ervaring in deze functie noemt die NIET al als periode in het cv staat: {"functie": "...", "duurMaanden": getal, "kerntaken": [...], "citaat": "..."}; anders null.

Verzin niets. Wat niet in het cv staat, laat je weg. Seizoen-, stage- en uitzendwerk telt gewoon als werk. Naam, leeftijd, afkomst, opmaak en spelling doen niet mee.
Antwoord uitsluitend met JSON: {"periodes": [...], "certificaten": [...], "gesprek": null}`;
}

async function leesMetAi(tekst: string, model: FunctieModel, gesprekErvaring: string | null, peil: Date, aanvullingen: { vraag: string; antwoord?: string }[] = []): Promise<{ periodes: Periode[]; certificaten: string[] } | "geen_ai"> {
  if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) return "geen_ai";
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL, apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "unused" });
  const stop = new AbortController();
  const wekker = setTimeout(() => stop.abort(), 60_000);
  try {
    const r: any = await client.chat.completions.create({
      model: "gpt-4o-mini", temperature: 0, max_tokens: 1500, response_format: { type: "json_object" },
      messages: [{ role: "system", content: prompt(model, gesprekErvaring, peil, aanvullingen) }, { role: "user", content: tekst }],
    } as any, { signal: stop.signal, maxRetries: 1 } as any);
    const inhoud: string = r?.choices?.[0]?.message?.content || "";
    const json = inhoud.slice(inhoud.indexOf("{"), inhoud.lastIndexOf("}") + 1);
    return valideerAnalyse(json ? JSON.parse(json) : {}, model);
  } finally { clearTimeout(wekker); }
}

const bezig = new Set<number>();

/** Analyseert het huidige cv van een kandidaat en bewaart het resultaat. */
export async function analyseerCv(candidateId: number): Promise<CvAnalyse | null> {
  const [c] = await db.select().from(candidates).where(eq(candidates.id, candidateId));
  if (!c || !c.hasCv || !c.cvFilename) return null;
  const bestand = String(c.cvFilename);
  const soort = soortVan(bestand);
  const model = modelVoor(c.functieEersteKeus, c.functionType, (c.bronDetails as any)?.branche ?? null);
  const [g] = await db.select().from(jobGesprekken).where(eq(jobGesprekken.candidateId, candidateId));
  const velden = (g?.velden || {}) as JobVelden;
  const bewaar = async (v: Partial<typeof cvAnalyses.$inferInsert>) => {
    const [a] = await db.insert(cvAnalyses).values({ candidateId, bestand, soort, status: "fout", ...v }).returning();
    return a;
  };
  if (soort === "afbeelding" || soort === "anders" || /\.doc$/i.test(bestand.split("?")[0])) return bewaar({ status: "niet_leesbaar" });
  try {
    const { downloadCvFile } = await import("../objectStorageFiles");
    const f = await downloadCvFile(bestand);
    if (!f) return bewaar({ status: "fout", fout: "Bestand niet gevonden" });
    const ruw = (await tekstUitBestand(f.buffer, bestand)) || "";
    if (ruw.replace(/\s/g, "").length < 80) return bewaar({ status: "geen_tekst", tekens: ruw.length });
    const af = afschermen(ruw, { voornaam: c.firstName, achternaam: c.lastName, email: c.email, telefoon: c.phone, postcode: c.postcode });
    if (!af.ok) return bewaar({ status: af.reden === "leeg" ? "geen_tekst" : "afschermen", tekens: ruw.length });
    const peil = new Date();
    const uit = await leesMetAi(af.tekst, model, velden.ervaring || null, peil, velden.cvVragen || []);
    if (uit === "geen_ai") return bewaar({ status: "geen_ai", tekens: af.tekst.length });
    const a = await bewaar({ status: "klaar", tekens: af.tekst.length, periodes: uit.periodes, certificaten: uit.certificaten, model: "gpt-4o-mini" });
    // Momentopname van de match, voor de geschiedenis en de consistentie
    const k = matchKaart(model, uit.periodes, uit.certificaten, { ervaringNiveau: velden.ervaringNiveau ?? null }, peil);
    await db.insert(kandidaatMatches).values({
      candidateId, cvAnalyseId: a.id, functie: model.sleutel, toestand: k.uitkomst.toestand, score: k.uitkomst.score ?? null, laag: k.uitkomst.laag ?? null, hoog: k.uitkomst.hoog ?? null,
      dekking: k.uitkomst.dekking, voorlopig: k.uitkomst.voorlopig, onzekerheid: k.uitkomst.onzekerheid, eis: k.eis.status, label: k.uitkomst.label, invoer: k.berekening,
    });
    return a;
  } catch (e: any) {
    console.warn("[Cv-analyse] mislukt:", e?.message || e);
    return bewaar({ status: "fout", fout: String(e?.message || e).slice(0, 300) });
  }
}

/** Start de analyse op de achtergrond (het gesprek wacht er nooit op). */
export function startCvAnalyse(candidateId: number): void {
  if (!matchAan() || bezig.has(candidateId)) return;
  bezig.add(candidateId);
  analyseerCv(candidateId).catch((e) => console.warn("[Cv-analyse] mislukt:", e?.message || e)).finally(() => {
    bezig.delete(candidateId);
    // Wacht Job op het lezen, dan nu de cv-vraag of het slotbericht (ook als het lezen mislukte).
    import("./jobService").then((m) => m.naCvAnalyse(candidateId)).catch((e) => console.warn("[Cv-analyse] vervolg in het gesprek mislukt:", e?.message || e));
  });
}
export function analyseBezig(candidateId: number): boolean { return bezig.has(candidateId); }

export const MELDING: Record<string, string> = {
  niet_leesbaar: "Dit cv is een foto, een oud Word-bestand of een ander bestandstype en wordt niet automatisch uitgelezen.",
  geen_tekst: "In dit cv staat geen leesbare tekst (bijvoorbeeld een scan). Niet automatisch uitgelezen.",
  afschermen: "Het afschermen van persoonsgegevens lukte niet veilig. Er is niets naar de AI gestuurd.",
  geen_ai: "De AI is niet beschikbaar; het cv is niet uitgelezen.",
  fout: "Het uitlezen van het cv is mislukt.",
};

export interface MatchBlok {
  status: "uit" | "geen_cv" | "nog_niet" | "bezig" | string;
  op?: string | null;
  melding?: string;
  kaart?: MatchKaart | null;
}

/** De match voor de kaart: altijd live gerekend uit de laatste analyse en wat het gesprek nu weet. */
export function matchUit(c: { hasCv: boolean | null; cvFilename: string | null; functieEersteKeus?: string | null; functionType: string | null; bronDetails?: unknown; id: number },
  a: CvAnalyse | undefined, velden: JobVelden | undefined, nu = new Date()): MatchBlok {
  if (!matchAan()) return { status: "uit" };
  if (!c.hasCv || !c.cvFilename) return { status: "geen_cv" };
  if (bezig.has(c.id)) return { status: "bezig" };
  if (!a || a.bestand !== c.cvFilename) return { status: "nog_niet" };
  if (a.status !== "klaar") return { status: a.status, op: a.aangemaaktOp ? String(a.aangemaaktOp) : null, melding: MELDING[a.status] || MELDING.fout };
  const model = modelVoor(c.functieEersteKeus, c.functionType, (c.bronDetails as any)?.branche ?? null);
  const kaart = matchKaart(model, (a.periodes || []) as Periode[], (a.certificaten || []) as string[], { ervaringNiveau: velden?.ervaringNiveau ?? null }, nu);
  return { status: "klaar", op: a.aangemaaktOp ? String(a.aangemaaktOp) : null, kaart };
}

/** De laatste analyse per kandidaat. */
export async function laatsteAnalyses(ids: number[]): Promise<Map<number, CvAnalyse>> {
  if (!ids.length || !matchAan()) return new Map();
  const rijen = await db.select().from(cvAnalyses).where(inArray(cvAnalyses.candidateId, ids)).orderBy(desc(cvAnalyses.id));
  const m = new Map<number, CvAnalyse>();
  for (const r of rijen) if (!m.has(r.candidateId)) m.set(r.candidateId, r);
  return m;
}
