/**
 * De intake op de iPad: negen onderdelen (borden I3c-1 tot en met I3c-9, D4 en D5).
 * Elk antwoord wordt meteen als concept bewaard; wegklikken en terugkomen gaat
 * verder op hetzelfde onderdeel. De vragen staan in shared/sollicitantRegels.ts.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BRANCHE, DAGDELEN, DAGEN, DAGEN_KORT, DISC, ONDERDELEN, SCRIPT_NAAM, STELLINGEN, WOORDPAREN, disc, motivatie, openVragen,
  rasterTelling, vragenVoor, vulIn, type Cel, type Intake, type Vraag,
} from "@shared/sollicitantRegels";
import type { KaartData } from "./Kaart";
import { Dialoog, Knop, api, melding, useData } from "./gedeeld";

const DIENSTEN: Record<string, string> = { "1": "1 dienst per week", "2": "meestal 2 diensten per week", "3": "3 of meer diensten per week", weekend: "vooral in het weekend", flexibel: "flexibel" };
function jobWistAl(job: KaartData["job"], sleutel?: Vraag["job"]): string {
  const v = (job?.velden || {}) as Record<string, unknown>;
  if (!sleutel) return "";
  if (sleutel === "talen") return String(v.talen || "");
  if (sleutel === "ervaring") return String(v.ervaring || "");
  if (sleutel === "werkgebied") return [v.vervoer, v.werkgebied].filter(Boolean).map(String).join(", ");
  if (sleutel === "diensten") return v.diensten ? DIENSTEN[String(v.diensten)] || String(v.diensten) : "";
  return "";
}
const TAALWOORDEN: [RegExp, string][] = [[/nederlands|dutch/i, "Nederlands"], [/engels|english/i, "Engels"], [/arabisch|arabic/i, "Arabisch"], [/duits|german/i, "Duits"], [/frans|french/i, "Frans"], [/spaans|spanish/i, "Spaans"]];

export function IntakeScherm({ id, sluit, klaar }: { id: number; sluit: () => void; klaar: () => void }) {
  const { data } = useData<KaartData>(`/api/sollicitanten/kaart/${id}`);
  const [intake, setIntake] = useState<Intake | null>(null);
  const [nr, setNr] = useState(1);
  const [uitleg, setUitleg] = useState(false);
  const [opslag, setOpslag] = useState<"" | "bezig" | "fout">("");
  const [afronden, setAfronden] = useState<string[] | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fotoKlaar, setFotoKlaar] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const laatste = useRef<{ intake: Intake; nr: number } | null>(null);
  const inhoud = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || intake) return;
    const i: Intake = { ...((data.dossier?.intake || {}) as Intake) };
    if (!i.talen && data.job?.velden?.talen) {
      const t = String(data.job.velden.talen);
      i.talen = TAALWOORDEN.filter(([r]) => r.test(t)).map(([, n]) => n);
    }
    setIntake(i);
    setNr(Math.min(9, Math.max(1, data.dossier?.intakeStap || 1)));
    setFotoKlaar(!!data.dossier?.foto || !!data.dossier?.fotoOvergeslagen);
  }, [data, intake]);

  const bewaar = useCallback(async (i: Intake, stap: number) => {
    setOpslag("bezig");
    try { await api(`/api/sollicitanten/intake/${id}`, { method: "PUT", body: { intake: i, stap } }); setOpslag(""); }
    catch { setOpslag("fout"); }
  }, [id]);

  function zet(patch: Partial<Intake>) {
    setIntake((oud) => {
      const nieuw = { ...(oud || {}), ...patch } as Intake;
      laatste.current = { intake: nieuw, nr };
      clearTimeout(timer.current);
      timer.current = setTimeout(() => bewaar(nieuw, nr), 500);
      return nieuw;
    });
  }
  function gaNaar(n: number) {
    clearTimeout(timer.current);
    if (intake) bewaar(intake, n);
    setNr(n); setUitleg(false);
    inhoud.current?.scrollTo({ top: 0 });
  }
  // Bij wegklikken: het laatste concept nog versturen.
  useEffect(() => {
    const weg = () => {
      if (!laatste.current) return;
      fetch(`/api/sollicitanten/intake/${id}`, { method: "PUT", keepalive: true, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intake: laatste.current.intake, stap: laatste.current.nr }) }).catch(() => {});
    };
    window.addEventListener("pagehide", weg);
    return () => { window.removeEventListener("pagehide", weg); weg(); };
  }, [id]);

  if (!data || !intake) return <div className="iv"><div className="iv-laden">Laden...</div><style>{IV_CSS}</style></div>;
  const k = data.kandidaat;
  const o = ONDERDELEN[nr - 1];
  const vragen = vragenVoor(o, data.script);
  const afnemer = data.dossier?.intakeDoor || data.ik || "";
  const w = { voornaam: k.voornaam, interviewer: afnemer.split(" ")[0] || undefined, nationaliteit: k.nationaliteit || undefined };
  const volgende = ONDERDELEN[nr];

  async function rondAf(toch = false) {
    const open = openVragen(intake!, data!.script, fotoKlaar);
    if (open.length && !toch) { setAfronden(open); return; }
    setBezig(true);
    clearTimeout(timer.current);
    try {
      await api(`/api/sollicitanten/intake/${id}/afronden`, { method: "POST", body: { intake } });
      laatste.current = null;
      melding("Intake afgerond. De beoordeling staat klaar.");
      klaar();
    } catch (e: any) { melding(e.message); setBezig(false); }
  }

  return (
    <div className="iv">
      <style>{IV_CSS}</style>
      <header className="iv-balk">
        <b className="iv-logo">EXTRA</b><span className="iv-streep" />
        <span>Intake · {k.naam}</span>
        <span className="iv-rechts">{SCRIPT_NAAM[data.script]} · {afnemer || "jij"}</span>
        <button className="iv-sluit" onClick={() => { if (intake) bewaar(intake, nr); sluit(); }} aria-label="Intake sluiten, het concept blijft bewaard">Sluiten</button>
      </header>
      <div className="iv-strook">{ONDERDELEN.map((x) => <i key={x.nr} className={x.nr < nr ? "klaar" : x.nr === nr ? "nu" : ""} />)}</div>
      <div className="iv-lijf">
        <nav className="iv-lijst" aria-label="Onderdelen">
          <p>ONDERDELEN</p>
          {ONDERDELEN.map((x) => (
            <button key={x.nr} className={x.nr === nr ? "nu" : x.nr < nr ? "klaar" : ""} onClick={() => gaNaar(x.nr)}>
              <span>{x.nr < nr ? "✓" : x.nr}</span>{x.titel}
            </button>
          ))}
          <p className="iv-opslag">{opslag === "bezig" ? "Opslaan..." : opslag === "fout" ? "Opslaan mislukt, probeer het zo nog eens" : "Concept bewaard"}</p>
        </nav>
        <main className="iv-inhoud" ref={inhoud}>
          <div className="iv-kolom">
            <button className="iv-uitleg" onClick={() => setUitleg((u) => !u)} aria-expanded={uitleg}>? Uitleg</button>
            {uitleg && <div className="iv-uitlegpaneel">{o.uitleg}</div>}
            <p className="iv-kicker">Onderdeel {o.nr} van 9</p>
            <h1>{o.titel}</h1>
            <p className="iv-doel">{vulIn(o.doel, w)}</p>
            {o.jeZegt && <JeZegt tekst={vulIn(o.jeZegt, w)} />}
            {vragen.map((v) => {
              if (v.als && intake[v.als.vraag] !== v.als.is) return null;
              return (
                <VraagBlok key={v.id} v={v} tekst={vulIn(v.tekst, w)} wistAl={jobWistAl(data.job, v.job)} intake={intake} zet={zet} script={data.script} voornaam={k.voornaam}
                  autoVolgende={() => gaNaar(nr + 1)} brancheKleur={BRANCHE[data.branche].foto} brancheNaam={BRANCHE[data.branche].label} id={id}
                  fotoKlaar={fotoKlaar} zetFotoKlaar={setFotoKlaar} bestaandeFoto={data.dossier?.foto || null} />
              );
            })}
            {o.jeZegtNa && <JeZegt tekst={vulIn(o.jeZegtNa, w)} />}
          </div>
        </main>
      </div>
      <footer className="iv-voet">
        <button className="iv-vorige" disabled={nr === 1} onClick={() => gaNaar(nr - 1)}>← Vorige</button>
        {volgende ? (
          <button className="iv-volgende" onClick={() => gaNaar(nr + 1)}>Volgende: {volgende.titel} →</button>
        ) : (
          <button className="iv-volgende" disabled={bezig} onClick={() => rondAf()}>Intake afronden</button>
        )}
      </footer>
      {afronden && (
        <Dialoog titel="Nog niet alles is ingevuld" sluit={() => setAfronden(null)} breed={560}>
          <p className="sv-sub" style={{ marginBottom: 10 }}>Je kunt de intake toch afronden. Deze vragen blijven dan leeg:</p>
          <ul style={{ margin: "0 0 14px 18px", lineHeight: 1.7 }}>{afronden.slice(0, 12).map((x) => <li key={x}>{x}</li>)}{afronden.length > 12 && <li>en nog {afronden.length - 12}</li>}</ul>
          <div className="sv-rij" style={{ justifyContent: "flex-end" }}>
            <Knop onClick={() => setAfronden(null)}>Terug naar de intake</Knop>
            <Knop soort="donker" disabled={bezig} onClick={() => { setAfronden(null); rondAf(true); }}>Toch afronden</Knop>
          </div>
        </Dialoog>
      )}
    </div>
  );
}

function JeZegt({ tekst }: { tekst: string }) {
  return <div className="iv-zegt"><span>JE ZEGT</span><p>{tekst}</p></div>;
}

function VraagBlok(p: {
  v: Vraag; tekst: string; wistAl: string; intake: Intake; zet: (x: Partial<Intake>) => void; script: string; voornaam: string;
  autoVolgende: () => void; brancheKleur: string; brancheNaam: string; id: number; fotoKlaar: boolean; zetFotoKlaar: (b: boolean) => void; bestaandeFoto: string | null;
}) {
  const { v, intake, zet } = p;
  const waarde = intake[v.id];
  const jobStand = intake.job?.[v.id] || "klopt";
  const zetJob = (s: "klopt" | "aanpassen") => zet({ job: { ...(intake.job || {}), [v.id]: s } });
  return (
    <section className="iv-vraag">
      {v.beoordeel ? (
        <p className="iv-vtekst"><span className="iv-tag">JIJ BEOORDEELT</span> {v.tekst}</p>
      ) : v.soort !== "foto" && (
        <p className="iv-vtekst"><span className="iv-nr">{v.nr}</span> {v.soort === "keuze" && v.id === "studenten_ov" ? <span className="iv-sublbl">STUDENTEN-OV</span> : v.soort === "maand" ? <span className="iv-sublbl">{v.tekst}</span> : <>“{p.tekst}”</>}</p>
      )}
      {v.hint && <p className="iv-hint">{v.hint}</p>}
      {p.wistAl && (
        <div className="iv-wistal">
          <span><b>Job wist al:</b> {p.wistAl}</span>
          <span className="iv-mini">
            <button className={jobStand === "klopt" ? "aan" : ""} onClick={() => zetJob("klopt")}>Klopt</button>
            <button className={jobStand === "aanpassen" ? "aan" : ""} onClick={() => zetJob("aanpassen")}>Aanpassen</button>
          </span>
        </div>
      )}
      {v.soort === "keuze" && (
        <div className="iv-chips">
          {v.opties!.map((o) => (
            <button key={o} className={waarde === o ? "aan" : ""} onClick={() => { zet({ [v.id]: waarde === o ? undefined : o }); if (v.autoVolgende && waarde !== o) setTimeout(p.autoVolgende, 250); }}>{o}</button>
          ))}
        </div>
      )}
      {v.id === "id_gezien" && (
        <div className="iv-hulp">
          <b>Na je keuze ga je meteen door naar de volgende vraag.</b>
          <p>Niet gezien? Dan komt er automatisch een notitie in het dossier: <span className="iv-noot">ID niet gecontroleerd bij de intake</span></p>
        </div>
      )}
      {v.id === "nationaliteit" && waarde === "TWV nodig" && (
        <div className="iv-hulp"><p>TWV nodig staat straks direct in het profiel van {p.voornaam}, en de aanvraag loopt via het onderdeel TWV. Vraag naar het verblijfsdocument; dat check je bij de ref. en doc. check.</p></div>
      )}
      {v.soort === "meer" && <Meer v={v} waarde={(waarde as string[]) || []} anders={(intake[`${v.id}_anders`] as string) || ""} zet={zet} />}
      {v.soort === "score" && <Score min={v.min!} max={v.max!} waarde={waarde as number | undefined} kies={(n) => zet({ [v.id]: n })} labels={v.labels} />}
      {v.soort === "tekst" && (
        v.id === "vragen" || v.id === "ervaring_werk"
          ? <textarea className="iv-invoer" value={(waarde as string) || ""} placeholder={v.placeholder} onChange={(e) => zet({ [v.id]: e.target.value })} />
          : <input className="iv-invoer" type="text" value={(waarde as string) || ""} placeholder={v.placeholder} onChange={(e) => zet({ [v.id]: e.target.value })} />
      )}
      {v.soort === "getal" && <input className="iv-invoer" style={{ maxWidth: 220 }} type="number" inputMode="decimal" min={0} max={80} value={(waarde as number | undefined) ?? ""} placeholder={v.placeholder} onChange={(e) => zet({ [v.id]: e.target.value === "" ? undefined : Number(e.target.value) })} />}
      {v.soort === "maand" && <input className="iv-invoer" style={{ maxWidth: 240 }} type="month" value={(waarde as string) || ""} onChange={(e) => zet({ [v.id]: e.target.value })} aria-label={v.tekst} />}
      {v.soort === "vaardigheden" && (
        <div className="iv-vaard">
          {(["bediening", "bar", "diner"] as const).filter((s) => s !== "bar" || p.script === "horeca").map((s) => {
            const huidig = (intake.vaardigheden || {})[s];
            return (
              <div key={s} className="iv-vaardrij">
                <b>{s[0].toUpperCase() + s.slice(1)}</b>
                <Score min={1} max={5} waarde={huidig} kies={(n) => zet({ vaardigheden: { ...(intake.vaardigheden || {}), [s]: n } })} />
              </div>
            );
          })}
          <p className="iv-hint">{v.labels!.join(" · ")}</p>
        </div>
      )}
      {v.soort === "stellingen" && <Stellingen waarde={intake.stellingen || []} zet={(a) => zet({ stellingen: a })} belangrijkst={intake.belangrijkst} />}
      {v.soort === "woordparen" && <Woordparen waarde={intake.woordparen || []} zet={(a) => zet({ woordparen: a })} voornaam={p.voornaam} />}
      {v.soort === "raster" && <RasterInvoer waarde={intake.raster || {}} zet={(r) => zet({ raster: r })} />}
      {v.soort === "referentie" && <Referentie waarde={intake.referentie || {}} zet={(r) => zet({ referentie: r })} />}
      {v.soort === "foto" && <FotoMaker id={p.id} kleur={p.brancheKleur} branche={p.brancheNaam} klaar={p.fotoKlaar} zetKlaar={p.zetFotoKlaar} bestaand={p.bestaandeFoto} />}
    </section>
  );
}

function Meer({ v, waarde, anders, zet }: { v: Vraag; waarde: string[]; anders: string; zet: (x: Partial<Intake>) => void }) {
  const [nieuw, setNieuw] = useState<string | null>(null);
  const opties = [...v.opties!, ...waarde.filter((w) => !v.opties!.includes(w))];
  function wissel(o: string) {
    let n = waarde.includes(o) ? waarde.filter((x) => x !== o) : [...waarde, o];
    if (v.exclusief && o === v.exclusief && !waarde.includes(o)) n = [o];
    else if (v.exclusief && o !== v.exclusief) n = n.filter((x) => x !== v.exclusief);
    zet({ [v.id]: n });
  }
  return <>
    <div className="iv-chips">
      {opties.map((o) => <button key={o} className={waarde.includes(o) ? "aan" : ""} aria-pressed={waarde.includes(o)} onClick={() => wissel(o)}>{o}</button>)}
      {v.eigen && nieuw === null && <button className="iv-plus" onClick={() => setNieuw("")} aria-label="Zelf toevoegen">+</button>}
    </div>
    {nieuw !== null && (
      <div className="iv-rij">
        <input className="iv-invoer" autoFocus type="text" value={nieuw} placeholder="Zelf toevoegen" onChange={(e) => setNieuw(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && nieuw.trim()) { zet({ [v.id]: [...waarde, nieuw.trim()] }); setNieuw(null); } }} />
        <button className="iv-knopje" onClick={() => { if (nieuw.trim()) zet({ [v.id]: [...waarde, nieuw.trim()] }); setNieuw(null); }}>Toevoegen</button>
      </div>
    )}
    {v.andersOptie && waarde.includes(v.andersOptie) && (
      <input className="iv-invoer" type="text" value={anders} placeholder={v.placeholder} onChange={(e) => zet({ [`${v.id}_anders`]: e.target.value })} />
    )}
  </>;
}

function Score({ min, max, waarde, kies, labels }: { min: number; max: number; waarde?: number; kies: (n: number) => void; labels?: [string, string] }) {
  return <div>
    <div className="iv-score">{Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => <button key={n} className={waarde === n ? "aan" : ""} aria-pressed={waarde === n} onClick={() => kies(n)}>{n}</button>)}</div>
    {labels && <p className="iv-hint" style={{ marginTop: 6 }}>{labels[0]} … {labels[1]}</p>}
  </div>;
}

function Stellingen({ waarde, zet, belangrijkst }: { waarde: (number | null)[]; zet: (a: (number | null)[]) => void; belangrijkst?: string }) {
  const m = motivatie(waarde, belangrijkst);
  return <>
    <div className="iv-stellingen">
      {STELLINGEN.map((s, i) => (
        <div key={i} className="iv-stelling">
          <span>{i + 1}. {s}</span>
          <div className="iv-score klein">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={waarde[i] === n ? "aan" : ""} onClick={() => { const a = [...waarde]; while (a.length < 12) a.push(null); a[i] = n; zet(a); }}>{n}</button>)}</div>
        </div>
      ))}
    </div>
    {m.volledig && (
      <div className="iv-profiel">
        <p className="iv-sublbl">MOTIVATIEPROFIEL</p>
        {m.scores.map((s, i) => (
          <div key={s.code} className="iv-balkrij"><b>{s.label}</b><span className="iv-balk2"><i style={{ width: `${s.score}%`, background: i < 2 ? "#37352C" : "#C9C3B8" }} /></span><b>{s.score}</b></div>
        ))}
      </div>
    )}
  </>;
}

function Woordparen({ waarde, zet, voornaam }: { waarde: (0 | 1 | null)[]; zet: (a: (0 | 1 | null)[]) => void; voornaam: string }) {
  const d = disc(waarde);
  return <>
    <div className="iv-paren">
      {WOORDPAREN.map((paar, i) => (
        <div key={i} className="iv-paar">
          <span className="iv-nr">{i + 1}</span>
          {[0, 1].map((k) => (
            <button key={k} className={waarde[i] === k ? "aan" : ""} onClick={() => { const a = [...waarde]; while (a.length < 12) a.push(null); a[i] = k as 0 | 1; zet(a); }}>{paar[k][0]}</button>
          )).reduce<React.ReactNode[]>((acc, el, j) => (j ? [...acc, <i key="of">of</i>, el] : [el]), [])}
        </div>
      ))}
    </div>
    {d.volledig && (
      <div className="iv-profiel">
        <p className="iv-sublbl">DISC-PROFIEL VAN {voornaam.toUpperCase()}</p>
        {d.volgorde.map((l) => (
          <div key={l} className="iv-balkrij">
            <b><span className="iv-letter" style={{ background: DISC[l].kleur }}>{l}</span> {DISC[l].naam} <small>{DISC[l].omschrijving}</small></b>
            <span className="iv-balk2"><i style={{ width: `${(d.scores[l] / 6) * 100}%`, background: DISC[l].kleur }} /></span><b>{d.scores[l]}</b>
          </div>
        ))}
        <p style={{ marginTop: 10 }}><b>Profiel {d.profiel} · {DISC[d.volgorde[0]].kleurNaam} en {DISC[d.volgorde[1]].kleurNaam.toLowerCase()}.</b> {d.zin}</p>
      </div>
    )}
  </>;
}

function RasterInvoer({ waarde, zet }: { waarde: NonNullable<Intake["raster"]>; zet: (r: NonNullable<Intake["raster"]>) => void }) {
  const t = rasterTelling(waarde);
  const volgende = (c: Cel): Cel => (c === null || c === undefined ? "ja" : c === "ja" ? "nee" : null);
  return <>
    <p className="iv-teller">{t.ja} beschikbaar · {t.nee} niet beschikbaar</p>
    <div className="iv-raster">
      <span />{DAGDELEN.map((d) => <span key={d.code} className="iv-rkop"><b>{d.label}</b><small>{d.tijd}</small></span>)}
      {DAGEN.map((dag, i) => {
        const kort = DAGEN_KORT[i];
        return [
          <span key={dag} className="iv-rdag">{dag}</span>,
          ...DAGDELEN.map((d) => {
            const c = waarde[kort]?.[d.code] ?? null;
            return (
              <button key={kort + d.code} className={`iv-cel ${c || ""}`} aria-label={`${dag} ${d.label}: ${c === "ja" ? "beschikbaar" : c === "nee" ? "niet beschikbaar" : "niet opgegeven"}`}
                onClick={() => zet({ ...waarde, [kort]: { ...(waarde[kort] || {}), [d.code]: volgende(c) } })}>
                {c === "ja" ? "Beschikbaar" : c === "nee" ? "Niet beschikbaar" : ""}
              </button>
            );
          }),
        ];
      })}
    </div>
    <div className="iv-legenda"><span><i className="ja" />Beschikbaar</span><span><i className="nee" />Niet beschikbaar</span><span><i />Niet opgegeven</span></div>
  </>;
}

function Referentie({ waarde, zet }: { waarde: NonNullable<Intake["referentie"]>; zet: (r: NonNullable<Intake["referentie"]>) => void }) {
  return <>
    <div className="iv-rij">
      <input className="iv-invoer" type="text" placeholder="Naam en bedrijf" disabled={!!waarde.geen} value={waarde.naam || ""} onChange={(e) => zet({ ...waarde, naam: e.target.value })} />
      <input className="iv-invoer" type="tel" placeholder="Telefoonnummer" disabled={!!waarde.geen} value={waarde.telefoon || ""} onChange={(e) => zet({ ...waarde, telefoon: e.target.value })} />
    </div>
    <div className="iv-chips"><button className={waarde.geen ? "aan" : ""} aria-pressed={!!waarde.geen} onClick={() => zet(waarde.geen ? { ...waarde, geen: false } : { geen: true })}>Geen werkervaring, geen referentie mogelijk</button></div>
  </>;
}

// ─── Foto (D5): camera, uitknippen op de iPad zelf, branchekleur ────────────

const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";
const MAAT = 480;
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const laadModule = new Function("u", "return import(u)") as (u: string) => Promise<any>;
let segmenter: Promise<any> | null = null;
function haalSegmenter() {
  if (!segmenter) {
    segmenter = (async () => {
      const vision = await laadModule(`${MP}/vision_bundle.mjs`);
      const fileset = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
      return vision.ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL }, runningMode: "IMAGE", outputCategoryMask: false, outputConfidenceMasks: true,
      });
    })();
    segmenter.catch(() => { segmenter = null; });
  }
  return segmenter;
}

/** Zet de persoon op de branchekleur. Lukt het uitknippen niet, dan de foto zelf in de cirkel. */
async function knipUit(bron: HTMLCanvasElement, kleur: string): Promise<{ url: string; uitgeknipt: boolean }> {
  const uit = document.createElement("canvas");
  uit.width = MAAT; uit.height = MAAT;
  const ctx = uit.getContext("2d")!;
  ctx.fillStyle = kleur; ctx.fillRect(0, 0, MAAT, MAAT);
  try {
    const seg = await Promise.race([haalSegmenter(), new Promise((_, n) => setTimeout(() => n(new Error("te traag")), 15000))]);
    const r = (seg as any).segment(bron);
    const masker: Float32Array = r.confidenceMasks[0].getAsFloat32Array();
    const mw: number = r.confidenceMasks[0].width, mh: number = r.confidenceMasks[0].height;
    const tmp = document.createElement("canvas");
    tmp.width = bron.width; tmp.height = bron.height;
    const t = tmp.getContext("2d")!;
    t.drawImage(bron, 0, 0);
    const px = t.getImageData(0, 0, tmp.width, tmp.height);
    for (let y = 0; y < tmp.height; y++) for (let x = 0; x < tmp.width; x++) {
      const m = masker[Math.floor((y / tmp.height) * mh) * mw + Math.floor((x / tmp.width) * mw)] || 0;
      const a = Math.max(0, Math.min(1, (m - 0.35) / 0.3));
      px.data[(y * tmp.width + x) * 4 + 3] = Math.round(a * 255);
    }
    t.putImageData(px, 0, 0);
    r.close?.();
    ctx.drawImage(tmp, 0, 0, MAAT, MAAT);
    return { url: uit.toDataURL("image/jpeg", 0.85), uitgeknipt: true };
  } catch (e: any) {
    console.warn("[Foto] uitknippen mislukt:", e?.message || e);
    ctx.drawImage(bron, 0, 0, MAAT, MAAT);
    return { url: uit.toDataURL("image/jpeg", 0.85), uitgeknipt: false };
  }
}

function FotoMaker({ id, kleur, branche, klaar, zetKlaar, bestaand }: { id: number; kleur: string; branche: string; klaar: boolean; zetKlaar: (b: boolean) => void; bestaand: string | null }) {
  const [fase, setFase] = useState<"camera" | "genomen" | "bezig" | "klaar" | "overgeslagen" | "geencamera">(bestaand ? "klaar" : "camera");
  const [resultaat, setResultaat] = useState<string | null>(bestaand);
  const [melding2, setMelding2] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const doek = useRef<HTMLCanvasElement>(null);
  const stroom = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (fase !== "camera") return;
    let weg = false;
    haalSegmenter().catch(() => {});
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 960 } }, audio: false })
      .then((s) => { if (weg) { s.getTracks().forEach((t) => t.stop()); return; } stroom.current = s; if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}); } })
      .catch(() => !weg && setFase("geencamera"));
    if (!navigator.mediaDevices?.getUserMedia) setFase("geencamera");
    return () => { weg = true; stroom.current?.getTracks().forEach((t) => t.stop()); stroom.current = null; };
  }, [fase]);

  function maak() {
    const v = video.current, c = doek.current;
    if (!v || !c || !v.videoWidth) return;
    const z = Math.min(v.videoWidth, v.videoHeight);
    c.width = MAAT; c.height = MAAT;
    const ctx = c.getContext("2d")!;
    ctx.save(); ctx.translate(MAAT, 0); ctx.scale(-1, 1);
    ctx.drawImage(v, (v.videoWidth - z) / 2, (v.videoHeight - z) / 2, z, z, 0, 0, MAAT, MAAT);
    ctx.restore();
    setFase("genomen");
  }
  async function gebruik() {
    if (!doek.current) return;
    setFase("bezig");
    const r = await knipUit(doek.current, kleur);
    try {
      await api(`/api/sollicitanten/foto/${id}`, { method: "PUT", body: { foto: r.url } });
      setResultaat(r.url); setFase("klaar"); zetKlaar(true);
      setMelding2(r.uitgeknipt ? "" : "Uitknippen lukte niet (geen verbinding met het model). De foto is bewaard zonder uitknippen.");
    } catch (e: any) { melding(e.message); setFase("genomen"); }
  }
  async function overslaan() {
    await api(`/api/sollicitanten/foto/${id}`, { method: "PUT", body: { overgeslagen: true } }).catch((e) => melding(e.message));
    stroom.current?.getTracks().forEach((t) => t.stop());
    setFase("overgeslagen"); zetKlaar(true);
  }

  return (
    <div className="iv-foto">
      <div className="iv-cirkel" style={{ background: fase === "klaar" ? kleur : "#2B2A24" }}>
        {fase === "camera" && <video ref={video} playsInline muted style={{ transform: "scaleX(-1)" }} />}
        <canvas ref={doek} style={{ display: fase === "genomen" || fase === "bezig" ? "block" : "none" }} />
        {fase === "klaar" && resultaat && <img src={resultaat} alt="" />}
        {fase === "camera" && <span className="iv-badge live">● Live</span>}
        {fase === "genomen" && <span className="iv-badge">✓ Gemaakt</span>}
        {fase === "klaar" && <span className="iv-badge">{branche}</span>}
        {(fase === "overgeslagen" || fase === "geencamera") && <span className="iv-badge">{fase === "overgeslagen" ? "Overgeslagen" : "Geen camera"}</span>}
      </div>
      <div className="iv-fotoknoppen">
        {fase === "camera" && <><button className="iv-volgende" onClick={maak}>Maak foto</button><button className="iv-knopje" onClick={overslaan}>Foto overslaan</button></>}
        {fase === "genomen" && <><button className="iv-knopje" onClick={() => setFase("camera")}>Maak opnieuw</button><button className="iv-volgende" onClick={gebruik}>Gebruik foto</button></>}
        {fase === "bezig" && <p>Achtergrond weghalen...</p>}
        {fase === "klaar" && <><p style={{ color: "#4F7A3A", fontWeight: 700 }}>✓ Opgeslagen bij het dossier</p><button className="iv-knopje" onClick={() => { setResultaat(null); setFase("camera"); }}>Nieuwe foto</button></>}
        {fase === "overgeslagen" && <><p>Geen foto. Je kunt de intake afronden.</p><button className="iv-knopje" onClick={() => setFase("camera")}>Toch een foto maken</button></>}
        {fase === "geencamera" && <><p>De camera is niet beschikbaar. Geef de browser toestemming voor de camera, of sla de foto over.</p><button className="iv-knopje" onClick={() => setFase("camera")}>Opnieuw proberen</button><button className="iv-knopje" onClick={overslaan}>Foto overslaan</button></>}
        {melding2 && <p className="iv-hint">{melding2}</p>}
        {!klaar && fase !== "camera" && fase !== "genomen" && fase !== "bezig" && null}
      </div>
      <p className="iv-hint" style={{ marginTop: 12 }}>Na Gebruik foto haalt de iPad zelf de achtergrond weg en zet de sollicitant op de kleur van de branche ({branche}). Er gaat niets naar een externe dienst.</p>
    </div>
  );
}

const IV_CSS = `
.iv{position:fixed;inset:0;z-index:120;background:#F8F7F4;display:flex;flex-direction:column;color:#37352C;font-size:16px}
.iv *{box-sizing:border-box}
.iv-laden{margin:auto;color:#8A8478}
.iv-balk{height:56px;background:#37352C;color:#F8F7F4;display:flex;align-items:center;gap:14px;padding:0 20px;flex:none}
.iv-logo{font-weight:900;letter-spacing:.08em}.iv-streep{width:1px;height:22px;background:rgba(255,255,255,.3)}
.iv-rechts{margin-left:auto;opacity:.75;font-size:14px}
.iv-sluit{background:none;border:1px solid rgba(255,255,255,.35);color:#F8F7F4;border-radius:9px;height:34px;padding:0 12px;font:inherit;font-size:14px;cursor:pointer}
.iv-strook{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;background:#37352C;padding:0 20px 8px;flex:none}
.iv-strook i{height:4px;border-radius:2px;background:rgba(255,255,255,.2)}.iv-strook i.klaar{background:#C7DFF4}.iv-strook i.nu{background:#F8F7F4}
.iv-lijf{flex:1;display:flex;min-height:0}
.iv-lijst{width:210px;flex:none;padding:18px 12px;border-right:1px solid #E9E5DD;overflow:auto}
.iv-lijst>p{font-size:11px;font-weight:800;letter-spacing:.08em;color:#8A8478;margin:0 8px 10px}
.iv-lijst button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;font:inherit;font-size:15px;padding:9px 8px;border-radius:10px;cursor:pointer;color:#5C594F;text-align:left}
.iv-lijst button span{width:26px;height:26px;border-radius:50%;border:1.5px solid #C9C3B8;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex:none}
.iv-lijst button.klaar span{background:#4F7A3A;border-color:#4F7A3A;color:#fff}
.iv-lijst button.nu{background:#fff;font-weight:800;color:#37352C;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.iv-lijst button.nu span{background:#37352C;border-color:#37352C;color:#fff}
.iv-opslag{margin-top:18px!important;font-weight:600!important;letter-spacing:0!important;font-size:12px!important}
.iv-inhoud{flex:1;overflow:auto;padding:28px 32px 120px}
.iv-kolom{max-width:860px;margin:0 auto;position:relative}
.iv-uitleg{position:absolute;right:0;top:0;height:36px;padding:0 14px;border-radius:99px;border:1px solid #DDD8CE;background:#fff;font:inherit;font-weight:700;cursor:pointer}
.iv-uitlegpaneel{background:#fff;border:1px solid #E4E0D8;border-radius:14px;padding:14px 16px;margin:46px 0 10px;font-size:14.5px;color:#5C594F;line-height:1.55}
.iv-kicker{color:#8A8478;font-weight:700;margin:0}
.iv h1{font-size:32px;font-weight:800;margin:4px 0 6px}
.iv-doel{color:#6B665C;margin:0 0 18px}
.iv-zegt{background:#F4F1EC;border-radius:14px;padding:14px 18px;margin:0 0 20px}
.iv-zegt span{font-size:11px;font-weight:800;letter-spacing:.08em;color:#8A8478}.iv-zegt p{font-size:18px;margin:4px 0 0}
.iv-vraag{background:#fff;border-radius:18px;padding:20px 22px;margin-bottom:14px;box-shadow:0 1px 2px rgba(55,53,44,.05)}
.iv-vtekst{font-size:22px;font-weight:700;margin:0 0 6px;line-height:1.3}
.iv-nr{color:#A39E94;font-weight:700;margin-right:6px}
.iv-tag,.iv-sublbl{font-size:11px;font-weight:800;letter-spacing:.08em;color:#8A8478;vertical-align:middle}
.iv-hint{color:#8A8478;font-size:14px;margin:0 0 10px}
.iv-wistal{display:flex;justify-content:space-between;align-items:center;gap:12px;border-left:3px solid #9DBBD8;padding:4px 0 4px 12px;margin:8px 0 12px;font-size:14.5px;flex-wrap:wrap}
.iv-mini{display:inline-flex;gap:4px}
.iv-mini button{height:30px;padding:0 12px;border-radius:99px;border:1px solid #C9DDF0;background:#fff;font:inherit;font-size:13px;font-weight:700;color:#1D4566;cursor:pointer}
.iv-mini button.aan{background:#1D4566;color:#fff;border-color:#1D4566}
.iv-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.iv-chips button,.iv-plus{min-height:48px;padding:0 18px;border-radius:99px;border:1.5px solid #DDD8CE;background:#fff;font:inherit;font-weight:600;cursor:pointer;color:#37352C}
.iv-chips button.aan{background:#EBD0E4;border-color:#37352C}
.iv-plus{width:48px;padding:0;border-style:dashed;font-size:22px}
.iv-hulp{background:#F8F7F4;border-radius:12px;padding:12px 14px;margin-top:12px;font-size:14px;color:#5C594F}
.iv-hulp p{margin:4px 0 0}.iv-noot{background:#FFF3C4;color:#5C4A00;border-radius:6px;padding:1px 6px;font-weight:600}
.iv-invoer{font:inherit;font-size:16px;border:1px solid #DDD8CE;border-radius:12px;padding:12px 14px;width:100%;margin-top:8px;background:#fff;color:#37352C}
textarea.iv-invoer{min-height:100px}
.iv-invoer::placeholder{color:#A9A49A}
.iv-rij{display:flex;gap:10px;align-items:center}
.iv-knopje{height:48px;padding:0 18px;border-radius:12px;border:1px solid #DDD8CE;background:#fff;font:inherit;font-weight:700;cursor:pointer;color:#37352C;white-space:nowrap}
.iv-score{display:flex;gap:8px;flex-wrap:wrap}
.iv-score button{width:48px;height:48px;border-radius:12px;border:1.5px solid #DDD8CE;background:#fff;font:inherit;font-weight:800;font-size:17px;cursor:pointer;color:#37352C}
.iv-score.klein button{width:44px;height:44px}
.iv-score button.aan{background:#EBD0E4;border-color:#37352C}
.iv-vaardrij{display:flex;align-items:center;gap:16px;margin:8px 0}.iv-vaardrij b{width:110px}
.iv-stelling{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:8px 0;border-bottom:1px solid #F1EEE8;flex-wrap:wrap}
.iv-profiel{background:#F8F7F4;border-radius:14px;padding:14px 16px;margin-top:14px}
.iv-balkrij{display:grid;grid-template-columns:minmax(160px,260px) 1fr 36px;gap:12px;align-items:center;margin:8px 0}
.iv-balkrij small{color:#8A8478;font-weight:500;margin-left:4px}
.iv-balk2{height:10px;background:#E9E5DD;border-radius:99px;overflow:hidden}.iv-balk2 i{display:block;height:100%;border-radius:99px}
.iv-letter{display:inline-flex;width:24px;height:24px;border-radius:6px;color:#fff;align-items:center;justify-content:center;font-size:13px;margin-right:4px}
.iv-paar{display:flex;align-items:center;gap:10px;padding:6px 0}
.iv-paar button{min-width:170px;min-height:48px;border-radius:99px;border:1.5px solid #DDD8CE;background:#fff;font:inherit;font-weight:600;cursor:pointer;color:#37352C}
.iv-paar button.aan{background:#EBD0E4;border-color:#37352C}
.iv-paar i{color:#A39E94;font-style:normal}
.iv-teller{font-weight:700;margin:6px 0 10px}
.iv-raster{display:grid;grid-template-columns:120px repeat(4,1fr);gap:6px;align-items:center}
.iv-rkop{display:flex;flex-direction:column;font-size:14px}.iv-rkop small{color:#8A8478;font-size:12px}
.iv-rdag{font-weight:600}
.iv-cel{height:44px;border-radius:10px;border:1px solid #E4E0D8;background:#F1EEE8;font:inherit;font-size:12.5px;font-weight:700;color:#fff;cursor:pointer}
.iv-cel.ja{background:#4F7A3A;border-color:#4F7A3A}.iv-cel.nee{background:#C8553D;border-color:#C8553D}
.iv-legenda{display:flex;gap:16px;margin-top:12px;font-size:14px;color:#5C594F}
.iv-legenda span{display:inline-flex;align-items:center;gap:6px}.iv-legenda i{width:16px;height:16px;border-radius:4px;background:#F1EEE8;border:1px solid #E4E0D8}
.iv-legenda i.ja{background:#4F7A3A}.iv-legenda i.nee{background:#C8553D}
.iv-foto{display:flex;flex-direction:column;align-items:center;text-align:center}
.iv-cirkel{position:relative;width:240px;height:240px;border-radius:50%;overflow:hidden}
.iv-cirkel video,.iv-cirkel canvas,.iv-cirkel img{width:100%;height:100%;object-fit:cover}
.iv-badge{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px}
.iv-badge.live{color:#fff}.iv-badge.live::first-letter{color:#FF4D4D}
.iv-fotoknoppen{display:flex;gap:10px;align-items:center;justify-content:center;margin-top:16px;flex-wrap:wrap}
.iv-fotoknoppen p{margin:0}
.iv-voet{position:fixed;left:0;right:0;bottom:0;height:76px;background:#fff;border-top:1px solid #E9E5DD;display:flex;align-items:center;justify-content:space-between;padding:0 24px;z-index:2}
.iv-vorige{height:48px;padding:0 18px;border-radius:12px;border:1px solid #DDD8CE;background:#fff;font:inherit;font-weight:700;cursor:pointer;color:#37352C}
.iv-vorige:disabled{opacity:.35;cursor:default}
.iv-volgende{height:52px;padding:0 24px;border-radius:12px;border:0;background:#37352C;color:#F8F7F4;font:inherit;font-weight:800;font-size:16px;cursor:pointer}
.iv-volgende:disabled{opacity:.5}
.iv button:focus-visible,.iv input:focus-visible,.iv textarea:focus-visible{outline:2px solid #37352C;outline-offset:2px}
@media (max-width:900px){.iv-lijst{display:none}.iv-inhoud{padding:20px 16px 110px}.iv-raster{grid-template-columns:70px repeat(4,1fr)}.iv-cel{font-size:0}.iv-balkrij{grid-template-columns:1fr 80px 30px}.iv-paar button{min-width:0;flex:1}}
`;
