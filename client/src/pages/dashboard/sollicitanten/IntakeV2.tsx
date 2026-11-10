/**
 * Sollicitatieformulier versie 2: het gesprek op kantoor (desktop en tablet).
 *
 * De vragen, keuzelijsten en alle afleidingen staan in shared/intakeV2.ts. Dit scherm is
 * een hulpmiddel bij een gesprek, geen script: de kandidaat vertelt, de interviewer legt
 * de kern vast. Wat het voortraject al weet staat klaar met de bron erbij.
 *
 * Opslaan gaat vanzelf en is altijd zichtbaar (opslaan, opgeslagen, mislukt). Lukt het niet,
 * dan blijft het werk in dit tabblad bewaard en probeert het scherm het opnieuw. Er wordt
 * nooit vanzelf doorgegaan naar een volgend hoofdstuk.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BRANCHE, DAGDELEN, DAGEN, DAGEN_KORT, DISC, type Cel, type DiscLetter, type Raster } from "@shared/sollicitantRegels";
import {
  AANKONDIGING, APP_UITLEG, BINDING, CONTACT, ERVARING_DUUR, EXTRAATJE, HOOFDSTUKKEN, KANALEN, KEUZEFACTOREN, KLEDING, KLEUR_WERK,
  LAAT_THUIS, LASTMINUTE, LOCATIES, MAX_KEUZES, PATROON, PRIORITEITEN, PROFIEL_STATUS, SAMENWERKEN, START_HULP, TAAKNIVEAUS,
  TAALNIVEAUS, TALEN_MEER, TALEN_VAST, UITBETALING, VERVOER, WERKRECHT,
  datumInWoorden, ervaringsvraag, extraTakenVoor, functievragen, gelijk, isV2, kledingTekst, openPunten, rasterTelling3, samenvattingRegels, startIntake,
  takenVoor, voorbereiding, werkvoorkeuren,
  type Actie, type Bron, type FunctieCtx, type Hoofdstuk, type IntakeV2, type TaalAntwoord, type Voorbereiding,
} from "@shared/intakeV2";
import type { KaartData } from "./Kaart";
import { FotoMaker, IV_CSS, IntakeScherm } from "./Intake";
import { JobGesprekPaneel } from "../JobBeheer";
import { Dialoog, Knop, api, melding, useData } from "./gedeeld";

/** Kiest het formulier dat bij dit dossier hoort: een begonnen intake houdt zijn eigen versie. */
export function IntakeStart(p: { id: number; sluit: () => void; klaar: () => void }) {
  const { data, fout } = useData<KaartData>(`/api/sollicitanten/kaart/${p.id}`);
  if (fout) return <div className="iv"><style>{IV_CSS}</style><div className="iv-laden">{fout} <button className="iv-knopje" style={{ marginLeft: 12 }} onClick={p.sluit}>Terug</button></div></div>;
  if (!data) return <div className="iv"><style>{IV_CSS}</style><div className="iv-laden">Laden...</div></div>;
  return data.intakeVersie === 2 && data.voortraject ? <IntakeV2Scherm {...p} data={data} /> : <IntakeScherm {...p} />;
}

const BRON_NAAM: Record<Bron, string> = { job: "Job", cv: "cv", formulier: "aanmelding", gesprek: "gesprek" };
const sleutel = (id: number) => `extra-intake2-${id}`;
function leesBewaard(id: number): { revisie: number; intake: IntakeV2; nr: number } | null {
  try { const x = sessionStorage.getItem(sleutel(id)); return x ? JSON.parse(x) : null; } catch { return null; }
}
function schrijfBewaard(id: number, w: { revisie: number; intake: IntakeV2; nr: number } | null) {
  try { if (w) sessionStorage.setItem(sleutel(id), JSON.stringify(w)); else sessionStorage.removeItem(sleutel(id)); } catch { /* geen opslag in dit tabblad: het scherm werkt gewoon door */ }
}
const vandaag = () => new Date().toISOString().slice(0, 10);
const uurMin = (d: Date) => d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
/** Antwoorden over beschikbaarheid: bij een wijziging hoort de datum waarop het voor het laatst is besproken. */
const BESCHIKBAAR = new Set(["uren", "uren_min", "uren_max", "raster", "tijden", "patroon", "startdatum", "aankondiging", "lastminute"]);

type Paneel = null | "voorbereiding" | "cv" | "job" | "notities";
type Opslag = "rust" | "bezig" | "opgeslagen" | "fout";

function IntakeV2Scherm({ id, sluit, klaar, data }: { id: number; sluit: () => void; klaar: () => void; data: KaartData }) {
  const k = data.kandidaat;
  const f = data.functieCtx as FunctieCtx;
  const vb = useMemo(() => voorbereiding(data.voortraject!), [data.voortraject]);
  const begonnen = !!data.dossier && data.dossier.intakeStatus !== "niet_gestart" && isV2(data.dossier.intake);

  const [intake, setIntake] = useState<IntakeV2 | null>(null);
  const [nr, setNr] = useState(0);
  const [bezocht, setBezocht] = useState<Set<number>>(new Set());
  const [opslag, setOpslag] = useState<Opslag>("rust");
  const [opgeslagenOm, setOpgeslagenOm] = useState<Date | null>(null);
  const [paneel, setPaneel] = useState<Paneel>(null);
  const [uitleg, setUitleg] = useState(false);
  const [afronden, setAfronden] = useState<{ hoofdstuk: Hoofdstuk; tekst: string }[] | null>(null);
  const [conflict, setConflict] = useState<{ tekst: string; intake: IntakeV2 | null; revisie: number | null } | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fotoKlaar, setFotoKlaar] = useState(!!data.dossier?.foto || !!data.dossier?.fotoOvergeslagen);
  const [hersteld, setHersteld] = useState(false);

  const stand = useRef<IntakeV2 | null>(null);
  const nrRef = useRef(0);
  const revisie = useRef(data.dossier?.intakeRevisie || 0);
  const wachtend = useRef(false);
  const onderweg = useRef(false);
  const gestopt = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const inhoud = useRef<HTMLDivElement>(null);
  // Het dashboard eromheen tekent regelmatig opnieuw en geeft dan nieuwe functies door. Via een ref
  // blijft het opslaan hieronder één vaste functie, zodat er nooit twee keer tegelijk bewaard wordt.
  const klaarRef = useRef(klaar);
  klaarRef.current = klaar;

  // Begin: de bewaarde stand, of wat het voortraject al weet. Na een verversing of een
  // verbroken verbinding komt niet verstuurd werk terug uit dit tabblad.
  useEffect(() => {
    let start: IntakeV2 = begonnen ? (data.dossier!.intake as unknown as IntakeV2) : startIntake(data.voortraject!);
    let beginNr = begonnen ? Math.min(9, Math.max(1, data.dossier!.intakeStap || 1)) : 0;
    const bewaard = leesBewaard(id);
    if (bewaard && bewaard.revisie === revisie.current && !gelijk(bewaard.intake, start)) {
      start = bewaard.intake; beginNr = bewaard.nr || beginNr; wachtend.current = true; setHersteld(true);
    } else schrijfBewaard(id, null);
    stand.current = start; nrRef.current = beginNr;
    setIntake(start); setNr(beginNr);
    setBezocht(new Set(Array.from({ length: Math.max(0, beginNr - 1) }, (_, n) => n + 1)));
    if (wachtend.current) timer.current = setTimeout(() => void stuur(), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stuur = useCallback(async (): Promise<boolean> => {
    if (onderweg.current || !wachtend.current || !stand.current || gestopt.current) return !wachtend.current;
    if (nrRef.current < 1) return true;
    onderweg.current = true; wachtend.current = false;
    setOpslag("bezig");
    try {
      const r = await api<{ revisie: number }>(`/api/sollicitanten/intake2/${id}`, { method: "PUT", body: { intake: stand.current, stap: nrRef.current, revisie: revisie.current } });
      revisie.current = r.revisie;
      if (!wachtend.current) schrijfBewaard(id, null); else schrijfBewaard(id, { revisie: revisie.current, intake: stand.current!, nr: nrRef.current });
      setOpslag("opgeslagen"); setOpgeslagenOm(new Date()); setHersteld(false);
    } catch (e: any) {
      if (e?.data?.conflict) {
        gestopt.current = true;
        setConflict({ tekst: e.message, intake: (e.data.intake as IntakeV2) || null, revisie: e.data.revisie ?? null });
      } else if (e?.data?.afgerond) {
        gestopt.current = true; schrijfBewaard(id, null);
        melding("Deze intake is al afgerond."); klaarRef.current();
      } else {
        wachtend.current = true;
        setOpslag("fout");
        clearTimeout(timer.current);
        timer.current = setTimeout(() => void stuur(), 5000);
      }
      onderweg.current = false;
      return false;
    }
    onderweg.current = false;
    if (wachtend.current) return stuur();
    return true;
  }, [id]);

  function plan(direct = false) {
    wachtend.current = true;
    if (stand.current) schrijfBewaard(id, { revisie: revisie.current, intake: stand.current, nr: nrRef.current });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void stuur(), direct ? 0 : 700);
  }

  function zet(patch: Partial<IntakeV2>) {
    const oud = stand.current;
    if (!oud) return;
    const nieuw = { ...oud, ...patch } as IntakeV2;
    for (const veld of Object.keys(patch)) {
      // Een overgenomen antwoord dat in het gesprek verandert, is daarmee aangepast.
      if (oud.bronnen?.[veld] && veld !== "bevestigd" && !gelijk(oud[veld], (patch as any)[veld])) {
        nieuw.bevestigd = { ...(nieuw.bevestigd || {}), [veld]: "aangepast" };
      }
      if (BESCHIKBAAR.has(veld)) nieuw.beschikbaarheid_bevestigd_op = vandaag();
    }
    stand.current = nieuw;
    setIntake(nieuw);
    plan();
  }
  function bevestig(veld: string) {
    const oud = stand.current;
    if (!oud) return;
    const nieuw = { ...oud, bevestigd: { ...(oud.bevestigd || {}), [veld]: "klopt" as const } };
    stand.current = nieuw; setIntake(nieuw); plan();
  }

  function gaNaar(n: number) {
    const van = nrRef.current;
    setBezocht((b) => new Set(b).add(van));
    nrRef.current = n; setNr(n); setUitleg(false);
    plan(true);
    inhoud.current?.scrollTo({ top: 0 });
  }

  // Bij wegklikken of sluiten van het tabblad: wat nog niet verstuurd is, gaat alsnog mee.
  useEffect(() => {
    const weg = () => {
      if (!wachtend.current || !stand.current || gestopt.current || nrRef.current < 1) return;
      fetch(`/api/sollicitanten/intake2/${id}`, { method: "PUT", keepalive: true, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intake: stand.current, stap: nrRef.current, revisie: revisie.current }) }).catch(() => {});
    };
    const terug = () => { if (wachtend.current) void stuur(); };
    window.addEventListener("pagehide", weg);
    window.addEventListener("online", terug);
    return () => { window.removeEventListener("pagehide", weg); window.removeEventListener("online", terug); clearTimeout(timer.current); weg(); };
  }, [id, stuur]);

  if (!intake) return <div className="iv iv2"><style>{IV_CSS}{CSS2}</style><div className="iv-laden">Laden...</div></div>;

  const h = nr >= 1 ? HOOFDSTUKKEN[nr - 1] : null;
  const open = openPunten(intake, f, fotoKlaar);
  const isKlaar = (n: number) => n !== nr && bezocht.has(n) && !open.some((o) => o.hoofdstuk === HOOFDSTUKKEN[n - 1].code);
  const aantalKlaar = HOOFDSTUKKEN.filter((_, n) => isKlaar(n + 1)).length;
  const afnemer = (data.dossier?.intakeDoor || data.ik || "").split(" ")[0];
  const vul = (t: string) => t.replace(/\{voornaam\}/g, k.voornaam);

  async function sluitAf() {
    clearTimeout(timer.current);
    if (wachtend.current && !(await stuur())) { melding("Nog niet alles is opgeslagen. Het blijft in dit tabblad bewaard; probeer het zo nog eens."); return; }
    sluit();
  }
  async function rondAf(toch = false) {
    if (bezig) return;
    const nog = openPunten(stand.current!, f, fotoKlaar);
    if (nog.length && !toch) { setAfronden(nog); return; }
    setBezig(true);
    clearTimeout(timer.current);
    try {
      if (wachtend.current && !(await stuur())) throw new Error("Opslaan lukt nu niet. Controleer de verbinding en probeer het opnieuw.");
      await api(`/api/sollicitanten/intake2/${id}/afronden`, { method: "POST", body: { intake: stand.current } });
      gestopt.current = true; wachtend.current = false; schrijfBewaard(id, null);
      melding("Intake afgerond. De beoordeling staat klaar.");
      klaarRef.current();
    } catch (e: any) {
      if (e?.data?.conflict) { gestopt.current = true; setConflict({ tekst: e.message, intake: (e.data.intake as IntakeV2) || null, revisie: e.data.revisie ?? null }); }
      else melding(e.message);
      setBezig(false);
    }
  }
  function laadLaatste() {
    if (conflict?.intake && conflict.revisie !== null) {
      stand.current = conflict.intake; revisie.current = conflict.revisie; setIntake(conflict.intake);
    }
    wachtend.current = false; gestopt.current = false; schrijfBewaard(id, null);
    setConflict(null); setOpslag("rust");
  }

  const p: Deel = { i: intake, zet, bevestig, data, f, vb, voornaam: k.voornaam };
  return (
    <div className="iv iv2">
      <style>{IV_CSS}{CSS2}</style>
      <header className="i2-balk">
        <div className="i2-logo"><img src="/d3/logo-w.svg" alt="EXTRA" /></div>
        <div className="i2-wie"><span>Kennismaking</span><i aria-hidden>›</i><b>{k.naam}</b></div>
        <span className="i2-branche" style={{ background: BRANCHE[data.branche].vlak, color: BRANCHE[data.branche].tekst }}>{BRANCHE[data.branche].label}</span>
        <span className="i2-door">Interviewer: {afnemer || "jij"}</span>
        <span className={`i2-opslag ${opslag}`} role="status" aria-live="polite">
          {opslag === "bezig" ? "Opslaan..." : opslag === "fout" ? <>Opslaan mislukt, blijft hier bewaard <button onClick={() => { clearTimeout(timer.current); void stuur(); }}>Nu opnieuw</button></>
            : opslag === "opgeslagen" && opgeslagenOm ? `Opgeslagen om ${uurMin(opgeslagenOm)}` : hersteld ? "Niet verstuurd werk teruggezet" : begonnen ? "Concept bewaard" : "Nog niet begonnen"}
        </span>
        <button className="i2-sluit" onClick={sluitAf} aria-label="Sluiten, het concept blijft bewaard">Sluiten</button>
      </header>
      <div className="i2-gereedschap">
        <button className={paneel === "voorbereiding" ? "aan" : ""} onClick={() => setPaneel(paneel === "voorbereiding" ? null : "voorbereiding")}><Icoon naam="lijst" /> Voorbereiding</button>
        {k.heeftCv && <button className={paneel === "cv" ? "aan" : ""} onClick={() => setPaneel(paneel === "cv" ? null : "cv")}><Icoon naam="cv" /> Cv</button>}
        {data.job && <button className={paneel === "job" ? "aan" : ""} onClick={() => setPaneel(paneel === "job" ? null : "job")}><Icoon naam="praat" /> Gesprek met Job</button>}
        <button className={paneel === "notities" ? "aan" : ""} onClick={() => setPaneel(paneel === "notities" ? null : "notities")}><Icoon naam="notitie" /> Notities{intake.notities?.trim() ? " ●" : ""}</button>
      </div>

      <div className="i2-lijf">
        <nav className="i2-nav" aria-label="Hoofdstukken">
          {HOOFDSTUKKEN.map((x, n) => (
            <button key={x.code} className={n + 1 === nr ? "nu" : isKlaar(n + 1) ? "klaar" : ""} onClick={() => gaNaar(n + 1)} aria-current={n + 1 === nr ? "step" : undefined}>
              <span aria-hidden>{isKlaar(n + 1) ? "✓" : n + 1}</span>{x.titel}
            </button>
          ))}
          <p className="i2-teller">{aantalKlaar} van 9 afgerond</p>
        </nav>

        <main className="i2-inhoud" ref={inhoud}>
          <div className="i2-kolom">
            {!h ? (
              <Start vb={vb} data={data} begin={() => gaNaar(1)} open={setPaneel} />
            ) : <>
              <button className="i2-uitleg" onClick={() => setUitleg((u) => !u)} aria-expanded={uitleg}>? Uitleg</button>
              <p className="i2-kicker">{h.titel.toUpperCase()} · CIRCA {h.minuten} {h.minuten === 1 ? "MINUUT" : "MINUTEN"}</p>
              <h1>{vul(h.kop)}</h1>
              <p className="i2-doel">{h.doel}</p>
              {uitleg && <div className="i2-uitlegpaneel">{h.uitleg}</div>}
              {h.code === "opening" && <Opening {...p} afnemer={afnemer} />}
              {h.code === "talen" && <Talen {...p} />}
              {h.code === "ervaring" && <Ervaring {...p} />}
              {h.code === "motivatie" && <Motivatie {...p} />}
              {h.code === "werkvoorkeuren" && <Werkvoorkeuren {...p} />}
              {h.code === "praktisch" && <Praktisch {...p} afnemer={afnemer} />}
              {h.code === "beschikbaarheid" && <Beschikbaarheid {...p} />}
              {h.code === "afronden" && <Afronden {...p} />}
              {h.code === "foto" && (
                <Vraag nr={1} tekst="Mogen we een foto van je maken voor je dossier?" hint="Vertel waarvoor: zodat de planner en de klant weten wie er komt. De foto is vrijwillig en telt nergens in mee.">
                  <FotoMaker id={id} kleur={BRANCHE[data.branche].foto} branche={BRANCHE[data.branche].label} klaar={fotoKlaar} zetKlaar={setFotoKlaar} bestaand={data.dossier?.foto || null} />
                </Vraag>
              )}
            </>}
          </div>
        </main>

        {paneel && (
          <aside className="i2-paneel" aria-label={paneel}>
            <div className="i2-paneelkop"><b>{paneel === "voorbereiding" ? "Voorbereiding" : paneel === "cv" ? "Cv" : paneel === "job" ? "Gesprek met Job" : "Notities"}</b><button onClick={() => setPaneel(null)} aria-label="Paneel sluiten">×</button></div>
            {paneel === "voorbereiding" && <Voorbereid vb={vb} data={data} />}
            {paneel === "cv" && <CvPaneel data={data} />}
            {paneel === "job" && <JobGesprekPaneel candidateId={k.id} kolom />}
            {paneel === "notities" && <>
              <p className="i2-klein">Voor jezelf en je collega's. Geen BSN, IBAN of documentnummers.</p>
              <textarea className="iv-invoer" style={{ minHeight: 260 }} value={intake.notities || ""} onChange={(e) => zet({ notities: e.target.value })} placeholder="Wat wil je onthouden uit dit gesprek?" aria-label="Notities" />
            </>}
          </aside>
        )}
      </div>

      {h && (
        <footer className="i2-voet">
          <button className="i2-vorige" disabled={nr <= 1} onClick={() => gaNaar(nr - 1)}>← {nr > 1 ? `Vorige: ${HOOFDSTUKKEN[nr - 2].titel}` : "Vorige"}</button>
          {nr < 9
            ? <button className="i2-volgende" onClick={() => gaNaar(nr + 1)}>Volgende: {HOOFDSTUKKEN[nr].titel} →</button>
            : <button className="i2-volgende" disabled={bezig} onClick={() => rondAf()}>{bezig ? "Afronden..." : "Intake afronden"}</button>}
        </footer>
      )}

      {afronden && (
        <Dialoog titel="Nog niet alles is besproken" sluit={() => setAfronden(null)} breed={560}>
          <p className="sv-sub" style={{ marginBottom: 10 }}>Je kunt toch afronden. Wat hier staat blijft dan onbekend; onbekend telt niet als nee of als onvoldoende.</p>
          <ul style={{ margin: "0 0 14px 18px", lineHeight: 1.7 }}>
            {afronden.slice(0, 14).map((x) => <li key={x.hoofdstuk + x.tekst}><button className="sv-knop sv-knop-link" onClick={() => { setAfronden(null); gaNaar(HOOFDSTUKKEN.findIndex((y) => y.code === x.hoofdstuk) + 1); }}>{HOOFDSTUKKEN.find((y) => y.code === x.hoofdstuk)!.titel}</button>: {x.tekst}</li>)}
          </ul>
          <div className="sv-rij" style={{ justifyContent: "flex-end" }}>
            <Knop onClick={() => setAfronden(null)}>Terug naar de intake</Knop>
            <Knop soort="donker" disabled={bezig} onClick={() => { setAfronden(null); void rondAf(true); }}>Toch afronden</Knop>
          </div>
        </Dialoog>
      )}
      {conflict && (
        <Dialoog titel="Deze intake is intussen aangepast" sluit={() => {}} breed={520}>
          <p style={{ marginBottom: 14 }}>{conflict.tekst}</p>
          <div className="sv-rij" style={{ justifyContent: "flex-end" }}>
            <Knop onClick={sluit}>Sluiten</Knop>
            <Knop soort="donker" onClick={laadLaatste}>Laatste stand laden</Knop>
          </div>
        </Dialoog>
      )}
    </div>
  );
}

// ─── Bouwstenen ─────────────────────────────────────────────────────────────

interface Deel {
  i: IntakeV2; zet: (p: Partial<IntakeV2>) => void; bevestig: (veld: string) => void;
  data: KaartData; f: FunctieCtx; vb: Voorbereiding; voornaam: string;
}

function Icoon({ naam }: { naam: "cv" | "praat" | "notitie" | "lijst" }) {
  const d = naam === "cv" ? "M6 2h8l4 4v16H6zM14 2v4h4" : naam === "praat" ? "M4 5h16v11H9l-5 4z" : naam === "notitie" ? "M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" : "M4 6h16M4 12h16M4 18h10";
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}

function Vraag({ nr, tekst, hint, children, optie }: { nr: number; tekst: string; hint?: ReactNode; children: ReactNode; optie?: boolean }) {
  return (
    <section className="i2-vraag">
      <span className="i2-nr" aria-hidden>{String(nr).padStart(2, "0")}</span>
      <div className="i2-vlijf">
        <h2>{tekst}{optie && <small> · alleen als het past</small>}</h2>
        {hint && <p className="i2-hint">{hint}</p>}
        {children}
      </div>
    </section>
  );
}
function JeZegt({ children }: { children: ReactNode }) {
  return <div className="i2-zegt"><span>JE ZEGT, IN JE EIGEN WOORDEN</span>{children}</div>;
}
/** Wat het voortraject al weet, met de bron. De interviewer bevestigt of past aan; herhalen hoeft niet. */
function Bekend({ label, waarde, bron, veld, p }: { label?: string; waarde: string; bron: Bron; veld?: string; p?: Deel }) {
  const status = veld ? p?.i.bevestigd?.[veld] : undefined;
  return (
    <div className="i2-bekend">
      <div><span>AL BEKEND UIT {BRON_NAAM[bron].toUpperCase()}{label ? ` · ${label.toUpperCase()}` : ""}</span><p>{waarde}</p></div>
      {veld && p && (status === "aangepast"
        ? <em>Aangepast in het gesprek</em>
        : <button className={status === "klopt" ? "aan" : ""} onClick={() => p.bevestig(veld)}>{status === "klopt" ? "✓ Klopt" : "Klopt"}</button>)}
    </div>
  );
}
/** Meerkeuze met een maximum. Is het maximum bereikt, dan zegt het scherm dat, in plaats van stil te wisselen. */
function Chips({ opties, waarde, zet, max, anders, andersWaarde, zetAnders }: {
  opties: string[]; waarde: string[]; zet: (w: string[]) => void; max?: number; anders?: boolean; andersWaarde?: string; zetAnders?: (t: string) => void;
}) {
  const alle = anders ? [...opties, "Anders"] : opties;
  const vol = !!max && waarde.length >= max;
  return <>
    <div className="i2-chips" role="group">
      {alle.map((o) => {
        const aan = waarde.includes(o);
        return <button key={o} className={aan ? "aan" : ""} aria-pressed={aan} disabled={!aan && vol} onClick={() => zet(aan ? waarde.filter((x) => x !== o) : [...waarde, o])}>{aan && <b aria-hidden>✓ </b>}{o}</button>;
      })}
    </div>
    {vol && <p className="i2-klein">Je hebt er {max} gekozen. Haal er eerst een weg om een andere te kiezen.</p>}
    {anders && waarde.includes("Anders") && <input className="iv-invoer" value={andersWaarde || ""} onChange={(e) => zetAnders?.(e.target.value)} placeholder="Namelijk" aria-label="Anders, namelijk" />}
  </>;
}
/** Eén keuze. Nog een keer tikken haalt de keuze weg: dan is het weer onbekend. */
function Keuze<T extends string>({ opties, waarde, zet, naam }: { opties: readonly { code: T; label: string; uitleg?: string }[]; waarde: T | null | undefined; zet: (w: T | null) => void; naam: string }) {
  return (
    <div className="i2-chips" role="radiogroup" aria-label={naam}>
      {opties.map((o) => <button key={o.code} role="radio" aria-checked={waarde === o.code} className={waarde === o.code ? "aan rond" : "rond"} onClick={() => zet(waarde === o.code ? null : o.code)} title={o.uitleg}><i aria-hidden />{o.label}</button>)}
    </div>
  );
}
function Tekst({ label, waarde, zet, plek, rijen = 2 }: { label: string; waarde?: string; zet: (t: string) => void; plek?: string; rijen?: number }) {
  return <label className="i2-tekst"><span>{label}</span><textarea rows={rijen} value={waarde || ""} onChange={(e) => zet(e.target.value)} placeholder={plek} /></label>;
}
function Getal({ label, waarde, zet, eenheid, max = 200 }: { label: string; waarde?: number | null; zet: (n: number | null) => void; eenheid: string; max?: number }) {
  return (
    <label className="i2-getal"><span>{label}</span>
      <div><input type="number" inputMode="numeric" min={0} max={max} value={typeof waarde === "number" ? waarde : ""} onChange={(e) => { const n = e.target.value === "" ? null : Number(e.target.value); zet(n === null || (Number.isFinite(n) && n >= 0 && n <= max) ? n : waarde ?? null); }} /><em>{eenheid}</em></div>
    </label>
  );
}

// ─── Voorbereiding ──────────────────────────────────────────────────────────

function Voorbereid({ vb, data }: { vb: Voorbereiding; data: KaartData }) {
  const cv = data.voortraject!.cv;
  return (
    <div className="i2-voor">
      <dl>
        {vb.bekend.map((b) => <div key={b.label}><dt>{b.label}</dt><dd>{b.waarde}<small>{BRON_NAAM[b.bron]}</small></dd></div>)}
      </dl>
      {vb.ontbreekt.length > 0 && <p className="i2-voorregel"><b>Nog niet bekend</b>{vb.ontbreekt.join(", ")}. Onbekend is geen nee.</p>}
      {vb.tegenstrijdig.length > 0 && <div className="i2-let"><b>Gegevens spreken elkaar tegen</b>{vb.tegenstrijdig.map((t) => <p key={t}>{t}</p>)}</div>}
      {vb.bespreekpunten.length > 0 && <div className="i2-punten"><b>Om op door te vragen</b><ol>{vb.bespreekpunten.map((t) => <li key={t}>{t}</li>)}</ol></div>}
      {cv.periodes.length > 0 && <>
        <p className="i2-lbl">WERKERVARING VOLGENS HET CV</p>
        <ul className="i2-periodes">{cv.periodes.slice(0, 6).map((x, n) => <li key={n}><b>{x.functie}</b>{x.werkgever ? ` bij ${x.werkgever}` : ""}<small>{[x.begin, x.einde].filter(Boolean).join(" tot ") || "periode onbekend"}</small></li>)}</ul>
        <p className="i2-klein">Door AI uit het cv gehaald. Open het cv om het na te lezen; bij twijfel geldt wat de kandidaat vertelt.</p>
      </>}
    </div>
  );
}
function Start({ vb, data, begin, open }: { vb: Voorbereiding; data: KaartData; begin: () => void; open: (p: Paneel) => void }) {
  const k = data.kandidaat;
  return <>
    <p className="i2-kicker">VOORBEREIDING · VOOR JE BEGINT</p>
    <h1>Dit weten we al van {k.voornaam}</h1>
    <p className="i2-doel">Lees dit even door. In het gesprek hoef je niet opnieuw te vragen wat hier al duidelijk staat.</p>
    <div className="i2-startkaart"><Voorbereid vb={vb} data={data} /></div>
    <div className="i2-startknoppen">
      {k.heeftCv && <button className="iv-knopje" onClick={() => open("cv")}>Cv openen</button>}
      {data.job && <button className="iv-knopje" onClick={() => open("job")}>Gesprek met Job openen</button>}
      <button className="i2-volgende" onClick={begin}>Start het gesprek →</button>
    </div>
  </>;
}
function CvPaneel({ data }: { data: KaartData }) {
  const k = data.kandidaat;
  const bron = `/api/admin/candidates/${k.id}/cv?preview=1`;
  return <>
    {k.cv?.soort === "pdf" ? <iframe className="i2-cv" src={bron} title={`Cv van ${k.voornaam}`} />
      : k.cv?.soort === "afbeelding" ? <img className="i2-cv" src={bron} alt={`Cv van ${k.voornaam}`} style={{ height: "auto" }} />
        : <p className="i2-klein">Dit bestand kan niet hier getoond worden. Download het om het te openen.</p>}
    <a className="iv-knopje" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", marginTop: 10 }} href={`/api/admin/candidates/${k.id}/cv`}>Cv downloaden</a>
  </>;
}

// ─── 1 Opening ──────────────────────────────────────────────────────────────

function Opening({ i, zet, data, voornaam }: Deel & { afnemer: string }) {
  const k = data.kandidaat;
  return <>
    <JeZegt>
      <p>Leuk dat je er bent, {voornaam}. We kijken vandaag welk werk bij je past en laten je zien hoe EXTRA werkt.</p>
      {data.job && <p>Job heeft al wat informatie opgehaald. Daar gaan we op verder.</p>}
    </JeZegt>
    {(k.heeftCv || data.job) && (
      <div className="i2-vinkjes">
        <p className="i2-klein">Zeg alleen dat je iets hebt bekeken als dat zo is.</p>
        {k.heeftCv && <label><input type="checkbox" checked={!!i.cv_bekeken} onChange={(e) => zet({ cv_bekeken: e.target.checked })} /> Ik heb het cv bekeken</label>}
        {data.job && <label><input type="checkbox" checked={!!i.job_bekeken} onChange={(e) => zet({ job_bekeken: e.target.checked })} /> Ik heb het gesprek met Job bekeken</label>}
      </div>
    )}
    <Vraag nr={1} tekst="Wat sprak je aan toen je EXTRA tegenkwam?" hint="Een korte notitie is genoeg. Dit telt nergens in mee.">
      <Tekst label="Antwoord kandidaat" waarde={i.aanleiding} zet={(t) => zet({ aanleiding: t })} />
    </Vraag>
  </>;
}

// ─── 2 Talen ────────────────────────────────────────────────────────────────

function Talen({ i, zet, vb, ...rest }: Deel) {
  const talen = i.talen || [];
  const [ander, setAnder] = useState("");
  const bekend = vb.bekend.find((b) => b.label === "Talen");
  const wijzig = (n: number, patch: Partial<TaalAntwoord>) => zet({ talen: talen.map((t, x) => (x === n ? { ...t, ...patch } : t)) });
  const voegToe = (taal: string) => { const t = taal.trim(); if (t && !talen.some((x) => x.taal.toLowerCase() === t.toLowerCase())) zet({ talen: [...talen, { taal: t, niveau: null, bron: "zelf" }] }); };
  const nogNiet = [...TALEN_VAST, ...TALEN_MEER].filter((t) => !talen.some((x) => x.taal === t));
  return <>
    {bekend && <Bekend waarde={bekend.waarde} bron={bekend.bron} veld={i.bronnen?.talen ? "talen" : undefined} p={{ i, zet, vb, ...rest }} />}
    <Vraag nr={1} tekst="In welke talen kun je op je werk goed overleggen?" hint="Leg per taal het niveau vast. Weet je het nog niet, laat het niveau dan open.">
      {talen.map((t, n) => (
        <div className="i2-taal" key={t.taal}>
          <div className="i2-taalkop"><b>{t.taal}</b><button className="i2-weg" onClick={() => zet({ talen: talen.filter((_, x) => x !== n) })} aria-label={`${t.taal} weghalen`}>×</button></div>
          <Keuze naam={`Niveau ${t.taal}`} opties={TAALNIVEAUS} waarde={t.niveau} zet={(w) => wijzig(n, { niveau: w })} />
          <div className="i2-bronkeuze" role="radiogroup" aria-label={`Bron niveau ${t.taal}`}>
            <button role="radio" aria-checked={t.bron === "zelf"} className={t.bron === "zelf" ? "aan" : ""} onClick={() => wijzig(n, { bron: "zelf" })}>Zegt de kandidaat zelf</button>
            <button role="radio" aria-checked={t.bron === "gesprek"} className={t.bron === "gesprek" ? "aan" : ""} onClick={() => wijzig(n, { bron: "gesprek" })}>Gehoord in dit gesprek</button>
            {!t.niveau && <em>Niveau nog niet vastgesteld</em>}
          </div>
        </div>
      ))}
      <p className="i2-lbl" style={{ marginTop: 14 }}>TAAL TOEVOEGEN</p>
      <div className="i2-chips klein">{nogNiet.map((t) => <button key={t} onClick={() => voegToe(t)}>+ {t}</button>)}</div>
      <div className="i2-rij"><input className="iv-invoer" style={{ marginTop: 0 }} value={ander} onChange={(e) => setAnder(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { voegToe(ander); setAnder(""); } }} placeholder="Andere taal" aria-label="Andere taal" /><button className="iv-knopje" onClick={() => { voegToe(ander); setAnder(""); }}>Toevoegen</button></div>
    </Vraag>
  </>;
}

// ─── 3 Ervaring ─────────────────────────────────────────────────────────────

function Ervaring({ i, zet, data, f, vb }: Deel) {
  const taken = [...takenVoor(f), ...(i.taken_eigen || [])];
  const extra = extraTakenVoor(f).filter((t) => !taken.includes(t));
  const [eigen, setEigen] = useState("");
  const fv = functievragen(f);
  const cv = data.voortraject!.cv;
  const ervaring = vb.bekend.find((b) => b.label === "Ervaring");
  const werk = vb.bekend.find((b) => b.label === "Werkzaamheden");
  const zetTaak = (naam: string, patch: Partial<{ niveau: any; voorbeeld: string }>) => zet({ taken: { ...(i.taken || {}), [naam]: { ...(i.taken?.[naam] || { niveau: null }), ...patch } } });
  const voegToe = (t: string) => { const x = t.trim(); if (x && !taken.includes(x)) zet({ taken_eigen: [...(i.taken_eigen || []), x] }); };
  const zonder = i.ervaring_duur === "Geen ervaring";
  return <>
    {ervaring && <Bekend label="Ervaring" waarde={ervaring.waarde} bron={ervaring.bron} />}
    {werk && <Bekend label="Werkzaamheden" waarde={werk.waarde} bron={werk.bron} />}
    {cv.periodes.length > 0 && (
      <div className="i2-bekend blok"><div><span>AL BEKEND UIT CV · DOOR AI GELEZEN, LEES HET CV BIJ TWIJFEL NA</span>
        <ul className="i2-periodes">{cv.periodes.slice(0, 5).map((x, n) => <li key={n}><b>{x.functie}</b>{x.werkgever ? ` bij ${x.werkgever}` : ""}<small>{[x.begin, x.einde].filter(Boolean).join(" tot ") || "periode onbekend"}</small></li>)}</ul>
      </div></div>
    )}
    {vb.tegenstrijdig.length > 0 && <div className="i2-let"><b>Vraag hier even op door</b>{vb.tegenstrijdig.map((t) => <p key={t}>{t}</p>)}</div>}

    <Vraag nr={1} tekst={ervaringsvraag(vb.werkgever)} hint="Laat vertellen. Korte periodes of een gat zeggen op zichzelf niets; vraag ernaar als je het wilt begrijpen.">
      <Tekst label="Antwoord kandidaat" waarde={i.ervaring_dienst} zet={(t) => zet({ ervaring_dienst: t })} rijen={3} />
    </Vraag>

    <Vraag nr={2} tekst="Welke taken pakte je zelf op en waarbij werkte je samen met iemand?" hint="Leg per taak vast wat de kandidaat vertelt. Niemand hoeft iets voor te doen. Niet besproken blijft open.">
      {zonder ? <p className="i2-klein">Geen ervaring in deze functie: de taken hoeven niet ingevuld.</p> : taken.map((t) => {
        const a = i.taken?.[t];
        return (
          <div className="i2-taak" key={t}>
            <div className="i2-taakkop"><b>{t}</b><small>volgens de kandidaat</small>
              {(i.taken_eigen || []).includes(t) && <button className="i2-weg" onClick={() => { const rest = { ...(i.taken || {}) }; delete rest[t]; zet({ taken_eigen: (i.taken_eigen || []).filter((x) => x !== t), taken: rest }); }} aria-label={`${t} weghalen`}>×</button>}
            </div>
            <Keuze naam={t} opties={TAAKNIVEAUS} waarde={a?.niveau} zet={(w) => zetTaak(t, { niveau: w })} />
            {a?.niveau && a.niveau !== "geen" && <input className="iv-invoer" value={a.voorbeeld || ""} onChange={(e) => zetTaak(t, { voorbeeld: e.target.value })} placeholder="Kort voorbeeld, bijvoorbeeld: twaalf kamers per dienst" aria-label={`Voorbeeld bij ${t}`} />}
          </div>
        );
      })}
      {!zonder && <>
        <p className="i2-lbl" style={{ marginTop: 14 }}>ALLEEN ALS DE KANDIDAAT HET NOEMT</p>
        <div className="i2-chips klein">{extra.map((t) => <button key={t} onClick={() => voegToe(t)}>+ {t}</button>)}</div>
        <div className="i2-rij"><input className="iv-invoer" style={{ marginTop: 0 }} value={eigen} onChange={(e) => setEigen(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { voegToe(eigen); setEigen(""); } }} placeholder="Andere taak" aria-label="Andere taak" /><button className="iv-knopje" onClick={() => { voegToe(eigen); setEigen(""); }}>Toevoegen</button></div>
      </>}
    </Vraag>

    {!zonder && fv.map((v, n) => (
      <Vraag key={v} nr={3 + n} tekst={v} optie hint="Sla over als het antwoord al duidelijk is.">
        <Tekst label="Antwoord kandidaat" waarde={n === 0 ? i.ervaring_extra : i.ervaring_extra2} zet={(t) => zet(n === 0 ? { ervaring_extra: t } : { ervaring_extra2: t })} />
      </Vraag>
    ))}

    <Vraag nr={zonder ? 3 : 3 + fv.length} tekst="Hoeveel ervaring heeft de kandidaat in deze functie, alles bij elkaar?" hint={<>Jouw vaststelling na het gesprek. Tel periodes die overlappen één keer. Weet je het niet zeker, laat het dan open.{cv.uitleg ? <> Het cv zegt: <b>{cv.uitleg}</b></> : null}</>}>
      <div className="i2-chips" role="radiogroup" aria-label="Ervaring in de functie">
        {ERVARING_DUUR.map((o) => <button key={o} role="radio" aria-checked={i.ervaring_duur === o} className={i.ervaring_duur === o ? "aan rond" : "rond"} onClick={() => zet({ ervaring_duur: i.ervaring_duur === o ? undefined : o })}><i aria-hidden />{o}</button>)}
      </div>
    </Vraag>
  </>;
}

// ─── 4 Motivatie ────────────────────────────────────────────────────────────

function Motivatie({ i, zet }: Deel) {
  const [toelichting, setToelichting] = useState(!!i.prioriteiten_toelichting);
  return <>
    <Vraag nr={1} tekst="Wat hoop je vooral uit EXTRA te halen?" hint={`Laat eerst vertellen. Kies daarna hoogstens ${MAX_KEUZES}. Noemt iemand veel, vraag dan: wat zijn voor jou de twee belangrijkste?`}>
      <Chips opties={PRIORITEITEN} waarde={i.prioriteiten || []} zet={(w) => zet({ prioriteiten: w })} max={MAX_KEUZES} anders andersWaarde={i.prioriteiten_anders} zetAnders={(t) => zet({ prioriteiten_anders: t })} />
      {toelichting ? <Tekst label="Toelichting" waarde={i.prioriteiten_toelichting} zet={(t) => zet({ prioriteiten_toelichting: t })} /> : <button className="i2-plus" onClick={() => setToelichting(true)}>+ Toelichting</button>}
    </Vraag>
    <Vraag nr={2} tekst="Waar let je vooral op als je een dienst kiest?" hint={`Kies hoogstens ${MAX_KEUZES}.`}>
      <Chips opties={KEUZEFACTOREN} waarde={i.keuzefactoren || []} zet={(w) => zet({ keuzefactoren: w })} max={MAX_KEUZES} anders andersWaarde={i.keuzefactoren_anders} zetAnders={(t) => zet({ keuzefactoren_anders: t })} />
    </Vraag>
    <Vraag nr={3} tekst="Waar heb je met plezier gewerkt? Wat maakte het daar fijn?" hint="Nog geen werkervaring? Vraag dan: wat zou een werkplek voor jou fijn maken?">
      <Tekst label="Antwoord kandidaat" waarde={i.fijne_plek} zet={(t) => zet({ fijne_plek: t })} rijen={3} />
      <p className="i2-lbl" style={{ marginTop: 14 }}>WAT HOOR JE TERUG? HOOGSTENS {MAX_KEUZES}</p>
      <Chips opties={BINDING} waarde={i.binding || []} zet={(w) => zet({ binding: w })} max={MAX_KEUZES} anders andersWaarde={i.binding_anders} zetAnders={(t) => zet({ binding_anders: t })} />
    </Vraag>
    <Vraag nr={4} tekst="Wat zou voor jou een reden zijn om ergens niet terug te komen?" optie>
      <Tekst label="Antwoord kandidaat" waarde={i.niet_terug} zet={(t) => zet({ niet_terug: t })} />
      {i.niet_terug?.trim() && (
        <div className="i2-grens">
          <Keuze naam="Voorkeur of harde grens" opties={[{ code: "voorkeur", label: "Voorkeur" }, { code: "harde_grens", label: "Harde grens" }] as const} waarde={i.niet_terug_soort} zet={(w) => zet({ niet_terug_soort: w })} />
          <p className="i2-klein">Leg een harde grens alleen vast als de kandidaat dit zelf zo zegt. Vraag het na: is dit iets wat je liever niet hebt, of werk je daar echt niet?</p>
        </div>
      )}
    </Vraag>
  </>;
}

// ─── 5 Werkvoorkeuren en contact ────────────────────────────────────────────

function Werkvoorkeuren({ i, zet, voornaam }: Deel) {
  const wp = i.werkprofiel || {};
  const kleuren = wp.kleuren || [];
  const voorkeuren = werkvoorkeuren(i);
  const zetWp = (patch: Partial<NonNullable<IntakeV2["werkprofiel"]>>) => zet({ werkprofiel: { ...wp, ...patch } });
  const wissel = (l: DiscLetter) => zetWp({ kleuren: kleuren.includes(l) ? kleuren.filter((x) => x !== l) : kleuren.length < 2 ? [...kleuren, l] : kleuren, status: wp.status || "voorlopig" });
  return <>
    <Vraag nr={1} tekst="Wat helpt jou om op een nieuwe plek lekker te starten?" hint="Tik aan wat je hoort. Wie duidelijke uitleg fijn vindt, is daarmee niet minder zelfstandig.">
      <Chips opties={START_HULP} waarde={i.start_hulp || []} zet={(w) => zet({ start_hulp: w })} />
      <Tekst label="Toelichting" waarde={i.start_toelichting} zet={(t) => zet({ start_toelichting: t })} plek="In de woorden van de kandidaat" />
    </Vraag>
    <Vraag nr={2} tekst="Werk je liever op vertrouwde plekken, of vind je afwisseling juist leuk?">
      <Keuze naam="Vaste of wisselende locaties" opties={LOCATIES} waarde={i.locaties} zet={(w) => zet({ locaties: w })} />
      <p className="i2-lbl" style={{ marginTop: 14 }}>ALS HET TER SPRAKE KOMT: SAMENWERKEN</p>
      <Keuze naam="Samenwerken" opties={SAMENWERKEN} waarde={i.samenwerken} zet={(w) => zet({ samenwerken: w })} />
    </Vraag>
    <Vraag nr={3} tekst="Vind je het fijn als we af en toe even inchecken, of zoek je ons liever zelf op?">
      <Keuze naam="Contact" opties={CONTACT} waarde={i.contact} zet={(w) => zet({ contact: w })} />
      <p className="i2-lbl" style={{ marginTop: 14 }}>HOE BEREIKEN WE JE HET LIEFST?</p>
      <Keuze naam="Voorkeurskanaal" opties={KANALEN} waarde={i.kanaal} zet={(w) => zet({ kanaal: w })} />
    </Vraag>

    <section className="i2-profiel">
      <h2>Werkprofiel van {voornaam}</h2>
      <p className="i2-hint">Een herkenbare samenvatting van wat {voornaam} zelf heeft gezegd. Geen test, geen cijfer en geen reden om iemand wel of niet aan te nemen. Je mag dit openlaten.</p>
      {voorkeuren.length > 0 ? <ul className="i2-voorkeuren">{voorkeuren.map((v) => <li key={v.tekst}>{v.tekst}<small>{v.bron}</small></li>)}</ul> : <p className="i2-klein">Nog geen voorkeuren vastgelegd in dit hoofdstuk of bij Motivatie.</p>}
      <p className="i2-lbl" style={{ marginTop: 16 }}>WELKE KLEUR HERKEN JE HIERIN? HOOGSTENS TWEE, JE KIEST ZELF</p>
      <div className="i2-kleuren">
        {(["D", "I", "S", "C"] as DiscLetter[]).map((l) => {
          const aan = kleuren.includes(l);
          return <button key={l} aria-pressed={aan} className={aan ? "aan" : ""} disabled={!aan && kleuren.length >= 2} onClick={() => wissel(l)}><i style={{ background: DISC[l].kleur }} aria-hidden /><span><b>{KLEUR_WERK[l].label}</b><small>{KLEUR_WERK[l].herken}</small></span></button>;
        })}
      </div>
      <p className="i2-lbl" style={{ marginTop: 16 }}>HOE ZEKER IS DIT?</p>
      <Keuze naam="Status werkprofiel" opties={PROFIEL_STATUS} waarde={wp.status} zet={(w) => zetWp({ status: w || undefined })} />
      {wp.status && <p className="i2-klein">{PROFIEL_STATUS.find((s) => s.code === wp.status)?.uitleg}. Vraag gerust: herken je jezelf hierin?</p>}
      <Tekst label="Waar baseer je dit op?" waarde={wp.onderbouwing} zet={(t) => zetWp({ onderbouwing: t })} plek="Bijvoorbeeld: vertelt vooral over collega's en vaste hotels" />
    </section>
  </>;
}

// ─── 6 Praktische zaken ─────────────────────────────────────────────────────

function Praktisch({ i, zet, data, f, vb, afnemer, ...rest }: Deel & { afnemer: string }) {
  const k = data.kandidaat;
  const gebied = vb.bekend.find((b) => b.label === "Werkgebied");
  const kleding = kledingTekst(f);
  const metRijbewijs = f.functie === "logistiek" || (i.vervoer || []).some((v) => v === "Auto" || v === "Scooter") || i.rijbewijs != null || i.voertuig != null;
  const [rij, setRij] = useState(metRijbewijs);
  const cert = i.certificaten || [];
  const acties = i.acties || [];
  const zetActie = (n: number, patch: Partial<Actie>) => zet({ acties: acties.map((a, x) => (x === n ? { ...a, ...patch } : a)) });
  const eigenaars = ["Kandidaat", afnemer || "Interviewer", "Planner"];
  let nr = 0;
  return <>
    {gebied && <Bekend label="Werkgebied en vervoer" waarde={gebied.waarde} bron={gebied.bron} veld={i.bronnen?.vervoer ? "vervoer" : undefined} p={{ i, zet, data, f, vb, ...rest }} />}
    <Vraag nr={++nr} tekst="Hoe ga je meestal naar je werk?">
      <Chips opties={VERVOER} waarde={i.vervoer || []} zet={(w) => zet({ vervoer: w })} />
    </Vraag>
    <Vraag nr={++nr} tekst="Hoelang wil je ongeveer onderweg zijn naar je werk?" hint="Noteer wat de kandidaat noemt: een tijd, een afstand of allebei. Reken het een niet om naar het ander.">
      <div className="i2-rij wijd">
        <Getal label="Reistijd, enkele reis" waarde={i.reistijd_min} zet={(n) => zet({ reistijd_min: n })} eenheid="minuten" max={240} />
        <Getal label="Afstand" waarde={i.reisafstand_km} zet={(n) => zet({ reisafstand_km: n })} eenheid="km" max={300} />
      </div>
    </Vraag>
    <Vraag nr={++nr} tekst="En lukt het dan ook om weer thuis te komen als het laat wordt?">
      <Keuze naam="Terugreis na een late dienst" opties={LAAT_THUIS} waarde={i.laat_thuis} zet={(w) => zet({ laat_thuis: w })} />
    </Vraag>
    {rij ? (
      <Vraag nr={++nr} tekst="Rijbewijs en eigen vervoer" optie hint="Alleen als het voor het werk of de reis nodig is. Een rijbewijs is nog geen auto: leg ze apart vast.">
        <div className="i2-rij wijd">
          <div><p className="i2-lbl">RIJBEWIJS B</p><Keuze naam="Rijbewijs" opties={[{ code: "ja", label: "Ja" }, { code: "nee", label: "Nee" }] as const} waarde={i.rijbewijs} zet={(w) => zet({ rijbewijs: w })} /></div>
          <div><p className="i2-lbl">EIGEN AUTO OF SCOOTER BESCHIKBAAR</p><Keuze naam="Voertuig" opties={[{ code: "ja", label: "Ja" }, { code: "nee", label: "Nee" }] as const} waarde={i.voertuig} zet={(w) => zet({ voertuig: w })} /></div>
        </div>
      </Vraag>
    ) : <button className="i2-plus los" onClick={() => setRij(true)}>+ Rijbewijs en eigen vervoer vastleggen</button>}
    {kleding && (
      <Vraag nr={++nr} tekst="Heb je de werkkleding al?" hint={`Voor deze functie: ${kleding.charAt(0).toLowerCase() + kleding.slice(1)}.`}>
        <Keuze naam="Werkkleding" opties={KLEDING} waarde={i.kleding} zet={(w) => zet({ kleding: w })} />
      </Vraag>
    )}
    <Vraag nr={++nr} tekst="Heb je certificaten die voor het werk tellen?" optie hint="Bijvoorbeeld EHBO, BHV, HACCP, VCA of een heftruckcertificaat. Met de datum tot wanneer het geldig is.">
      {cert.map((c, n) => (
        <div className="i2-rij" key={n}>
          <input className="iv-invoer" style={{ marginTop: 0 }} value={c.naam} onChange={(e) => zet({ certificaten: cert.map((x, y) => (y === n ? { ...x, naam: e.target.value } : x)) })} placeholder="Certificaat" aria-label="Certificaat" />
          <input className="iv-invoer" style={{ marginTop: 0, maxWidth: 190 }} type="date" value={c.geldig_tot || ""} onChange={(e) => zet({ certificaten: cert.map((x, y) => (y === n ? { ...x, geldig_tot: e.target.value } : x)) })} aria-label="Geldig tot" />
          <button className="i2-weg" onClick={() => zet({ certificaten: cert.filter((_, y) => y !== n) })} aria-label="Certificaat weghalen">×</button>
        </div>
      ))}
      <button className="i2-plus" onClick={() => zet({ certificaten: [...cert, { naam: "" }] })}>+ Certificaat toevoegen</button>
    </Vraag>

    <section className="i2-controle">
      <h2>Controle: identiteit en werkrecht</h2>
      <p className="i2-hint">Dit gaat mee naar de bestaande ref. en doc. check. Noteer alleen óf je het document zag. Geen nummers, geen BSN, geen kopie.</p>
      <p className="i2-lbl">HEB JE HET PASPOORT OF DE ID-KAART VAN {k.voornaam.toUpperCase()} GEZIEN?</p>
      <Keuze naam="ID gezien" opties={[{ code: "Gezien", label: "Gezien" }, { code: "Niet gezien", label: "Niet gezien" }] as const} waarde={i.id_gezien} zet={(w) => zet({ id_gezien: w || undefined })} />
      <p className="i2-lbl" style={{ marginTop: 14 }}>WERKRECHT{k.twvNodig ? " · VOLGENS DE AANMELDING IS EEN TWV NODIG" : k.zone === "NL" || k.zone === "EU" ? " · VOLGENS DE AANMELDING GEEN TWV NODIG" : ""}</p>
      <Keuze naam="Werkrecht" opties={WERKRECHT} waarde={i.werkrecht} zet={(w) => zet({ werkrecht: w || undefined })} />
    </section>

    <section className="i2-controle">
      <h2>Wat moet er nog geregeld worden?</h2>
      <p className="i2-hint">Elk open punt krijgt iemand die het oppakt. Zo blijft niets hangen.</p>
      {acties.map((a, n) => (
        <div className="i2-actie" key={n}>
          <input type="checkbox" checked={!!a.klaar} onChange={(e) => zetActie(n, { klaar: e.target.checked })} aria-label="Afgerond" />
          <input className="iv-invoer" style={{ marginTop: 0 }} value={a.tekst} onChange={(e) => zetActie(n, { tekst: e.target.value })} placeholder="Wat moet er gebeuren?" aria-label="Open punt" />
          <select className="iv-invoer" style={{ marginTop: 0, maxWidth: 170 }} value={a.eigenaar} onChange={(e) => zetActie(n, { eigenaar: e.target.value })} aria-label="Wie pakt het op">{eigenaars.map((e) => <option key={e}>{e}</option>)}</select>
          <button className="i2-weg" onClick={() => zet({ acties: acties.filter((_, y) => y !== n) })} aria-label="Punt weghalen">×</button>
        </div>
      ))}
      <button className="i2-plus" onClick={() => zet({ acties: [...acties, { tekst: "", eigenaar: "Kandidaat" }] })}>+ Open punt toevoegen</button>
    </section>
  </>;
}

// ─── 7 Beschikbaarheid ──────────────────────────────────────────────────────

function Beschikbaarheid({ i, zet, vb }: Deel) {
  const inzet = vb.bekend.find((b) => b.label === "Gewenste inzet");
  const start = vb.bekend.find((b) => b.label === "Kan beginnen");
  const raster = i.raster || {};
  const [modus, setModus] = useState<"ja" | "nee" | "leeg">("ja");
  const t = rasterTelling3(raster);
  const zetCel = (dag: string, deel: string) => zet({ raster: { ...raster, [dag]: { ...(raster[dag] || {}), [deel]: (modus === "leeg" ? null : modus) as Cel } } });
  const zetDag = (dag: string) => zet({ raster: { ...raster, [dag]: Object.fromEntries(DAGDELEN.map((d) => [d.code, (modus === "leeg" ? null : modus) as Cel])) } });
  const dagenMetJa = DAGEN_KORT.filter((dag) => DAGDELEN.some((d) => raster[dag]?.[d.code] === "ja"));
  const zetTijd = (dag: string, patch: { van?: string; tot?: string }) => zet({ tijden: { ...(i.tijden || {}), [dag]: { ...(i.tijden?.[dag] || {}), ...patch } } });
  return <>
    {inzet && <Bekend label="Gewenste inzet" waarde={inzet.waarde} bron={inzet.bron} />}
    {start && <Bekend label="Kan beginnen" waarde={start.waarde} bron={start.bron} />}
    <Vraag nr={1} tekst="Hoeveel uur per week zou je het liefst werken?" hint="Dit is wat iemand wil, niet wat we toezeggen. Minimum en maximum alleen als de kandidaat ze noemt.">
      <div className="i2-rij wijd">
        <Getal label="Liefst" waarde={i.uren} zet={(n) => zet({ uren: n })} eenheid="uur per week" max={60} />
        <Getal label="Minimaal nodig" waarde={i.uren_min} zet={(n) => zet({ uren_min: n })} eenheid="uur" max={60} />
        <Getal label="Maximaal" waarde={i.uren_max} zet={(n) => zet({ uren_max: n })} eenheid="uur" max={60} />
      </div>
    </Vraag>
    <Vraag nr={2} tekst="Welke dagen en tijden passen meestal goed?" hint="Kies eerst wat je wilt aangeven en tik dan de dagdelen aan. Wat je niet aantikt, blijft onbekend.">
      <div className="i2-modus" role="radiogroup" aria-label="Wat geef je aan">
        <button role="radio" aria-checked={modus === "ja"} className={modus === "ja" ? "aan ja" : "ja"} onClick={() => setModus("ja")}><i aria-hidden>✓</i>Beschikbaar</button>
        <button role="radio" aria-checked={modus === "nee"} className={modus === "nee" ? "aan nee" : "nee"} onClick={() => setModus("nee")}><i aria-hidden>✕</i>Niet beschikbaar</button>
        <button role="radio" aria-checked={modus === "leeg"} className={modus === "leeg" ? "aan leeg" : "leeg"} onClick={() => setModus("leeg")}><i aria-hidden>?</i>Onbekend</button>
      </div>
      <div className="i2-raster">
        <span />{DAGDELEN.map((d) => <span key={d.code} className="i2-rkop">{d.label}<small>{d.tijd}</small></span>)}<span />
        {DAGEN_KORT.map((dag, n) => <FragmentRij key={dag} dag={dag} lang={DAGEN[n]} raster={raster} zetCel={zetCel} zetDag={zetDag} modus={modus} />)}
      </div>
      <p className="i2-klein" style={{ marginTop: 10 }}>{t.ja} beschikbaar · {t.nee} niet beschikbaar · {t.onbekend} onbekend</p>
      {dagenMetJa.length > 0 && <>
        <p className="i2-lbl" style={{ marginTop: 16 }}>EXACTE TIJDEN, ALS DE KANDIDAAT ZE NOEMT</p>
        <div className="i2-tijden">
          {dagenMetJa.map((dag) => (
            <div key={dag}><b>{dag}</b>
              <input className="iv-invoer" type="time" value={i.tijden?.[dag]?.van || ""} onChange={(e) => zetTijd(dag, { van: e.target.value })} aria-label={`${dag} vanaf`} />
              <span>tot</span>
              <input className="iv-invoer" type="time" value={i.tijden?.[dag]?.tot || ""} onChange={(e) => zetTijd(dag, { tot: e.target.value })} aria-label={`${dag} tot`} />
            </div>
          ))}
        </div>
      </>}
    </Vraag>
    <Vraag nr={3} tekst="Is dat meestal een vast patroon, of wisselt het per week?">
      <Keuze naam="Patroon" opties={PATROON} waarde={i.patroon} zet={(w) => zet({ patroon: w })} />
      {i.patroon === "wisselend" && <p className="i2-klein">Het weekpatroon hierboven is dan een indicatie. De echte data geeft de medewerker door in de app.</p>}
    </Vraag>
    <Vraag nr={4} tekst="Hoe ver van tevoren hoor je het liefst wanneer je werkt?" optie>
      <Keuze naam="Aankondiging" opties={AANKONDIGING} waarde={i.aankondiging} zet={(w) => zet({ aankondiging: w })} />
      <p className="i2-lbl" style={{ marginTop: 14 }}>MOGEN WE JE BELLEN ALS ER OP HET LAATSTE MOMENT IEMAND UITVALT?</p>
      <Keuze naam="Lastminute" opties={LASTMINUTE} waarde={i.lastminute} zet={(w) => zet({ lastminute: w })} />
    </Vraag>
    <Vraag nr={5} tekst="Vanaf wanneer kun je beginnen?" optie>
      <input className="iv-invoer" style={{ maxWidth: 220 }} type="date" value={i.startdatum || ""} onChange={(e) => zet({ startdatum: e.target.value })} aria-label="Startdatum" />
    </Vraag>
    {i.beschikbaarheid_bevestigd_op && <p className="i2-klein">Voor het laatst besproken op {datumInWoorden(i.beschikbaarheid_bevestigd_op)}.</p>}
  </>;
}
function FragmentRij({ dag, lang, raster, zetCel, zetDag, modus }: { dag: string; lang: string; raster: Raster; zetCel: (dag: string, deel: string) => void; zetDag: (dag: string) => void; modus: "ja" | "nee" | "leeg" }) {
  return <>
    <span className="i2-rdag">{lang}</span>
    {DAGDELEN.map((d) => {
      const c = raster[dag]?.[d.code] ?? null;
      const tekst = c === "ja" ? "beschikbaar" : c === "nee" ? "niet beschikbaar" : "onbekend";
      return <button key={d.code} className={`i2-cel ${c || ""}`} onClick={() => zetCel(dag, d.code)} aria-label={`${lang} ${d.label}: ${tekst}`}>{c === "ja" ? "✓" : c === "nee" ? "✕" : ""}</button>;
    })}
    <button className="i2-heledag" onClick={() => zetDag(dag)} aria-label={`${lang}: hele dag ${modus === "ja" ? "beschikbaar" : modus === "nee" ? "niet beschikbaar" : "onbekend"}`}>hele dag</button>
  </>;
}

// ─── 8 Afronden ─────────────────────────────────────────────────────────────

function Afronden({ i, zet, voornaam }: Deel) {
  const regels = samenvattingRegels(i, voornaam);
  const r = i.referentie || {};
  const zetRef = (patch: Partial<NonNullable<IntakeV2["referentie"]>>) => zet({ referentie: { ...r, ...patch } });
  const uitleg = i.app_uitleg || [];
  const soort = r.geen ? "geen" : r.later ? "later" : "nu";
  return <>
    <Vraag nr={1} tekst="Vat samen en vraag of het klopt" hint="De samenvatting komt uit wat je hebt vastgelegd. Klopt iets niet, pas het aan in het hoofdstuk of schrijf het hieronder.">
      {regels.length > 0
        ? <JeZegt>{regels.map((t) => <p key={t}>{t}</p>)}<p>Klopt dat?</p></JeZegt>
        : <p className="i2-klein">Er is nog te weinig vastgelegd bij Motivatie, Werkvoorkeuren en Beschikbaarheid om samen te vatten.</p>}
      <Keuze naam="Samenvatting" opties={[{ code: "klopt", label: "Klopt" }, { code: "aangepast", label: "Aangepast" }, { code: "niet_bevestigd", label: "Nog niet bevestigd" }] as const} waarde={i.samenvatting} zet={(w) => zet({ samenvatting: w || undefined })} />
      {i.samenvatting === "aangepast" && <Tekst label="Wat zei de kandidaat erover?" waarde={i.samenvatting_correctie} zet={(t) => zet({ samenvatting_correctie: t })} />}
    </Vraag>
    <Vraag nr={2} tekst="Leg de app uit" hint="Vink af wat je hebt laten zien.">
      <div className="i2-vinkjes">{APP_UITLEG.map((a) => <label key={a}><input type="checkbox" checked={uitleg.includes(a)} onChange={(e) => zet({ app_uitleg: e.target.checked ? [...uitleg, a] : uitleg.filter((x) => x !== a) })} /> {a}</label>)}</div>
    </Vraag>
    <Vraag nr={3} tekst="Zou je gebruik willen maken van dagbetaling, of vind je maandelijkse uitbetaling prima?" hint="Na de uitleg over uitbetaling en Jixbee. Niet besproken blijft open.">
      <Keuze naam="Uitbetaling" opties={UITBETALING} waarde={i.uitbetaling} zet={(w) => zet({ uitbetaling: w })} />
    </Vraag>
    <Vraag nr={4} tekst="Lijkt het je leuk om op deze manier voor extra's te sparen?" hint="Na de uitleg over EXTRAATJE. Niet besproken blijft open.">
      <Keuze naam="EXTRAATJE" opties={EXTRAATJE} waarde={i.extraatje} zet={(w) => zet({ extraatje: w })} />
    </Vraag>
    <Vraag nr={5} tekst="Wie kan iets vertellen over hoe jij werkt, en mogen we die persoon benaderen?">
      <div className="i2-chips" role="radiogroup" aria-label="Referentie">
        <button role="radio" aria-checked={soort === "nu" && !!i.referentie} className={soort === "nu" && i.referentie ? "aan rond" : "rond"} onClick={() => zetRef({ geen: false, later: false })}><i aria-hidden />Referentie opgeven</button>
        <button role="radio" aria-checked={soort === "later"} className={soort === "later" ? "aan rond" : "rond"} onClick={() => zet({ referentie: { later: true } })}><i aria-hidden />Levert later aan</button>
        <button role="radio" aria-checked={soort === "geen"} className={soort === "geen" ? "aan rond" : "rond"} onClick={() => zet({ referentie: { geen: true } })}><i aria-hidden />Geen geschikte referentie</button>
      </div>
      {soort === "nu" && i.referentie && <>
        <div className="i2-rij wijd">
          <label className="i2-tekst"><span>Naam</span><input className="iv-invoer" style={{ marginTop: 0 }} value={r.naam || ""} onChange={(e) => zetRef({ naam: e.target.value })} /></label>
          <label className="i2-tekst"><span>Werkrelatie</span><input className="iv-invoer" style={{ marginTop: 0 }} value={r.relatie || ""} onChange={(e) => zetRef({ relatie: e.target.value })} placeholder="Bijvoorbeeld: leidinggevende bij het hotel" /></label>
          <label className="i2-tekst"><span>Telefoon of e-mail</span><input className="iv-invoer" style={{ marginTop: 0 }} value={r.telefoon || ""} onChange={(e) => zetRef({ telefoon: e.target.value })} /></label>
        </div>
        <p className="i2-lbl" style={{ marginTop: 12 }}>MOGEN WE DEZE PERSOON BENADEREN?</p>
        <Keuze naam="Toestemming referentie" opties={[{ code: "ja", label: "Ja, dat mag" }, { code: "nee", label: "Nee, nog niet" }] as const} waarde={r.toestemming === true ? "ja" : r.toestemming === false ? "nee" : null} zet={(w) => zetRef({ toestemming: w === "ja" ? true : w === "nee" ? false : null })} />
        {r.toestemming !== true && <p className="i2-klein">Zonder toestemming gaat het nummer niet mee naar de referentiecheck.</p>}
      </>}
      {soort === "later" && <p className="i2-klein">De referentie blijft open staan bij de controles tot de kandidaat hem aanlevert.</p>}
      {soort === "geen" && <p className="i2-klein">Dit gaat met de reden mee naar de referentiecheck. Een collega kan daar alsnog een referentie invullen.</p>}
    </Vraag>
    <Vraag nr={6} tekst="Wat wil je verder nog weten over werken via EXTRA?">
      <Tekst label="Vraag van de kandidaat" waarde={i.vragen} zet={(t) => zet({ vragen: t })} />
    </Vraag>
    <div className="i2-slot">
      <b>De volgende stap</b>
      <p>Na dit gesprek beoordeel jij het gesprek. Daarna volgen de controles: het ID, het werkrecht en de referentie. Pas als die rond zijn, gaat {voornaam} naar Onboarding.</p>
      <p>Vertel {voornaam} alleen wat er nu echt gebeurt. Beloof niets over aanname, loon of diensten.</p>
    </div>
  </>;
}

// ─── Stijl ──────────────────────────────────────────────────────────────────

const CSS2 = `
.iv2{font-size:16px}
.iv2 .i2-balk{height:60px;background:#F8F7F4;border-bottom:1px solid #E4E0D8;display:flex;align-items:center;gap:16px;padding-right:20px;flex:none}
.iv2 .i2-logo{background:#37352C;height:100%;width:150px;display:flex;align-items:center;justify-content:center;flex:none}.iv2 .i2-logo img{height:22px}
.iv2 .i2-wie{display:flex;align-items:center;gap:10px;font-size:19px;min-width:0}.iv2 .i2-wie span{font-weight:700}.iv2 .i2-wie b{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.iv2 .i2-wie i{font-style:normal;color:#8A8478}
.iv2 .i2-branche{padding:4px 12px;border-radius:99px;font-size:14px;font-weight:700;white-space:nowrap}
.iv2 .i2-door{border-left:1px solid #DDD8CE;padding-left:16px;color:#5C594F;white-space:nowrap}
.iv2 .i2-opslag{margin-left:auto;font-size:14px;color:#6B665C;white-space:nowrap}.iv2 .i2-opslag.opgeslagen{color:#2F6B3E}.iv2 .i2-opslag.fout{color:#A2321F;font-weight:700}
.iv2 .i2-opslag button{margin-left:8px;border:1px solid #A2321F;background:#fff;color:#A2321F;border-radius:8px;height:30px;padding:0 10px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.iv2 .i2-sluit{height:36px;padding:0 14px;border-radius:9px;border:1px solid #DDD8CE;background:#fff;font:inherit;font-size:14px;font-weight:700;cursor:pointer;color:#37352C}
.iv2 .i2-gereedschap{display:flex;justify-content:flex-end;gap:4px;padding:8px 20px;border-bottom:1px solid #E9E5DD;background:#FCFBF9;flex:none}
.iv2 .i2-gereedschap button{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border:0;background:none;font:inherit;font-size:15px;font-weight:600;color:#37352C;cursor:pointer;border-radius:9px}
.iv2 .i2-gereedschap button.aan,.iv2 .i2-gereedschap button:hover{background:#EFECE6}
.iv2 .i2-lijf{flex:1;display:flex;min-height:0}
.iv2 .i2-nav{width:240px;flex:none;padding:18px 12px;border-right:1px solid #E9E5DD;overflow:auto;display:flex;flex-direction:column;gap:2px}
.iv2 .i2-nav button{display:flex;align-items:center;gap:12px;border:0;background:none;font:inherit;font-size:16px;padding:11px 12px;border-radius:10px;cursor:pointer;color:#37352C;text-align:left;border-left:4px solid transparent}
.iv2 .i2-nav button span{width:24px;height:24px;border-radius:50%;border:1.5px solid #B9B3A7;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex:none;color:#6B665C}
.iv2 .i2-nav button.klaar span{border-color:#37352C;color:#37352C}
.iv2 .i2-nav button.nu{background:#EBD0E4;font-weight:800;border-left-color:#B98AAE}.iv2 .i2-nav button.nu span{border-color:#37352C;color:#37352C}
.iv2 .i2-teller{margin:auto 12px 0;padding-top:14px;border-top:1px solid #E4E0D8;font-size:14px;color:#5C594F}
.iv2 .i2-inhoud{flex:1;overflow:auto;padding:26px 36px 130px;min-width:0}
.iv2 .i2-kolom{max-width:900px;margin:0 auto;position:relative}
.iv2 .i2-kicker{font-size:12.5px;font-weight:800;letter-spacing:.1em;color:#5C594F;margin:0}
.iv2 h1{font-size:34px;font-weight:800;margin:6px 0 4px;letter-spacing:-.01em;line-height:1.15;padding-right:110px}
.iv2 .i2-doel{color:#5C594F;margin:0 0 20px;font-size:16.5px}
.iv2 .i2-uitleg{position:absolute;right:0;top:0;height:36px;padding:0 14px;border-radius:99px;border:1px solid #DDD8CE;background:#fff;font:inherit;font-weight:700;cursor:pointer;font-size:14px}
.iv2 .i2-uitlegpaneel{background:#fff;border:1px solid #E4E0D8;border-radius:14px;padding:14px 16px;margin:0 0 18px;font-size:15px;color:#5C594F;line-height:1.55}
.iv2 .i2-vraag{display:grid;grid-template-columns:44px minmax(0,1fr);gap:0 14px;padding:22px 0;border-top:1px solid #E4E0D8}
.iv2 .i2-nr{font-size:19px;color:#6B665C;font-weight:600;padding-top:2px;border-right:1px solid #DDD8CE;height:26px}
.iv2 .i2-vraag h2,.iv2 .i2-profiel h2,.iv2 .i2-controle h2{font-size:21px;font-weight:800;margin:0 0 4px;line-height:1.3}
.iv2 .i2-vraag h2 small{font-size:13px;font-weight:600;color:#8A8478}
.iv2 .i2-hint{color:#5C594F;font-size:15px;margin:0 0 12px;line-height:1.5}
.iv2 .i2-klein{color:#6B665C;font-size:14px;margin:8px 0 0;line-height:1.5}
.iv2 .i2-lbl{font-size:11.5px;font-weight:800;letter-spacing:.08em;color:#6B665C;margin:0 0 6px}
.iv2 .i2-chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}
.iv2 .i2-chips button{min-height:46px;padding:0 18px;border-radius:10px;border:1.5px solid #CFC9BD;background:#fff;font:inherit;font-weight:600;cursor:pointer;color:#37352C;display:inline-flex;align-items:center;gap:8px}
.iv2 .i2-chips button.aan{background:#EBD0E4;border-color:#B98AAE;font-weight:800}
.iv2 .i2-chips button:disabled{opacity:.45;cursor:default}
.iv2 .i2-chips button.rond i{width:16px;height:16px;border-radius:50%;border:1.5px solid #37352C;display:inline-block;flex:none}
.iv2 .i2-chips button.rond.aan i{box-shadow:inset 0 0 0 3px #EBD0E4;background:#37352C}
.iv2 .i2-chips.klein button{min-height:36px;padding:0 12px;font-size:14px;border-style:dashed}
.iv2 .i2-plus{border:0;background:none;font:inherit;font-weight:700;color:#37352C;text-decoration:underline;cursor:pointer;padding:10px 0 0;font-size:15px}
.iv2 .i2-plus.los{display:block;padding:18px 0;border-top:1px solid #E4E0D8;width:100%;text-align:left}
.iv2 .i2-tekst{display:block;border:1.5px solid #CFC9BD;border-radius:12px;background:#fff;padding:10px 14px;margin-top:10px;flex:1;min-width:0}
.iv2 .i2-tekst span{display:block;font-size:12.5px;font-weight:800;color:#37352C;margin-bottom:2px}
.iv2 .i2-tekst textarea{width:100%;border:0;font:inherit;font-size:17px;resize:vertical;background:none;color:#37352C;outline:none;min-height:30px}
.iv2 .i2-tekst input.iv-invoer{border:0;padding:2px 0;font-size:17px;outline:none}
.iv2 .i2-tekst:focus-within{border-color:#37352C}
.iv2 .i2-getal{display:block;flex:1;min-width:150px}.iv2 .i2-getal span{display:block;font-size:12.5px;font-weight:800;margin-bottom:4px}
.iv2 .i2-getal div{display:flex;align-items:center;gap:8px;border:1.5px solid #CFC9BD;border-radius:12px;background:#fff;padding:0 12px;height:50px}
.iv2 .i2-getal input{width:70px;border:0;font:inherit;font-size:19px;font-weight:700;outline:none;background:none;color:#37352C}.iv2 .i2-getal em{font-style:normal;color:#6B665C;font-size:14px}
.iv2 .i2-getal div:focus-within{border-color:#37352C}
.iv2 .i2-rij{display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap}.iv2 .i2-rij.wijd{align-items:flex-end;gap:14px}.iv2 .i2-rij>.iv-invoer{flex:1;min-width:160px}
.iv2 .i2-weg{width:34px;height:34px;border-radius:50%;border:1px solid #DDD8CE;background:#fff;font-size:18px;cursor:pointer;color:#5C594F;flex:none}
.iv2 .i2-zegt{background:#F1EEE8;border-radius:14px;padding:16px 20px;margin:0 0 18px}
.iv2 .i2-zegt span{font-size:11.5px;font-weight:800;letter-spacing:.08em;color:#6B665C}.iv2 .i2-zegt p{font-size:19px;font-weight:700;margin:6px 0 0;line-height:1.4}
.iv2 .i2-bekend{display:flex;justify-content:space-between;align-items:center;gap:14px;border-left:4px solid #9DBBD8;background:#EEF4FA;border-radius:0 12px 12px 0;padding:10px 14px;margin:0 0 12px}
.iv2 .i2-bekend span{font-size:11px;font-weight:800;letter-spacing:.08em;color:#1D4566}.iv2 .i2-bekend p{margin:2px 0 0;font-weight:700}
.iv2 .i2-bekend button{height:38px;padding:0 16px;border-radius:99px;border:1.5px solid #1D4566;background:#fff;font:inherit;font-weight:700;color:#1D4566;cursor:pointer;white-space:nowrap}
.iv2 .i2-bekend button.aan{background:#1D4566;color:#fff}.iv2 .i2-bekend em{font-style:normal;font-size:13.5px;font-weight:700;color:#1D4566;white-space:nowrap}
.iv2 .i2-bekend.blok{display:block}
.iv2 .i2-periodes{list-style:none;margin:6px 0 0;padding:0}.iv2 .i2-periodes li{padding:4px 0;font-size:15px}.iv2 .i2-periodes small{color:#5C594F;margin-left:8px}
.iv2 .i2-let{background:#FFF6D6;border-radius:12px;padding:12px 14px;margin:0 0 12px;font-size:15px}.iv2 .i2-let b{display:block}.iv2 .i2-let p{margin:4px 0 0}
.iv2 .i2-vinkjes{margin:0 0 6px;display:flex;flex-direction:column;gap:4px}
.iv2 .i2-vinkjes label{display:flex;align-items:center;gap:12px;min-height:44px;font-weight:600;cursor:pointer}
.iv2 .i2-vinkjes input,.iv2 .i2-actie input[type=checkbox]{width:24px;height:24px;accent-color:#37352C;flex:none}
.iv2 .i2-taal,.iv2 .i2-taak{border:1px solid #E4E0D8;background:#fff;border-radius:14px;padding:12px 14px;margin-top:10px}
.iv2 .i2-taalkop,.iv2 .i2-taakkop{display:flex;align-items:center;gap:10px}.iv2 .i2-taalkop b,.iv2 .i2-taakkop b{font-size:17px}.iv2 .i2-taakkop small{color:#6B665C;font-size:13px}
.iv2 .i2-taalkop .i2-weg,.iv2 .i2-taakkop .i2-weg{margin-left:auto}
.iv2 .i2-bronkeuze{display:flex;gap:6px;align-items:center;margin-top:10px;flex-wrap:wrap}
.iv2 .i2-bronkeuze button{height:34px;padding:0 12px;border-radius:99px;border:1px solid #CFC9BD;background:#fff;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;color:#37352C}
.iv2 .i2-bronkeuze button.aan{background:#37352C;color:#F8F7F4;border-color:#37352C}.iv2 .i2-bronkeuze em{font-style:normal;font-size:13.5px;color:#6B665C;margin-left:6px}
.iv2 .i2-grens{margin-top:10px}
.iv2 .i2-profiel,.iv2 .i2-controle{border-top:1px solid #E4E0D8;padding:22px 0}
.iv2 .i2-voorkeuren{list-style:none;margin:8px 0 0;padding:0}.iv2 .i2-voorkeuren li{padding:7px 0;border-bottom:1px solid #EEEAE3;font-weight:600;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}.iv2 .i2-voorkeuren small{font-weight:500;color:#6B665C;font-size:13px}
.iv2 .i2-kleuren{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.iv2 .i2-kleuren button{display:flex;gap:12px;align-items:flex-start;text-align:left;border:1.5px solid #CFC9BD;border-radius:12px;background:#fff;padding:12px 14px;font:inherit;cursor:pointer;color:#37352C}
.iv2 .i2-kleuren button.aan{border-color:#37352C;background:#F4F1EC;box-shadow:inset 0 0 0 1px #37352C}.iv2 .i2-kleuren button:disabled{opacity:.45;cursor:default}
.iv2 .i2-kleuren i{width:16px;height:16px;border-radius:50%;flex:none;margin-top:3px}.iv2 .i2-kleuren b{display:block}.iv2 .i2-kleuren small{color:#5C594F;font-size:13.5px;line-height:1.4;display:block}
.iv2 .i2-actie{display:flex;gap:10px;align-items:center;margin-top:10px}
.iv2 .i2-modus{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.iv2 .i2-modus button{height:44px;padding:0 16px;border-radius:10px;border:1.5px solid #CFC9BD;background:#fff;font:inherit;font-weight:700;cursor:pointer;color:#37352C;display:inline-flex;align-items:center;gap:8px}
.iv2 .i2-modus i{font-style:normal;width:22px;height:22px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;color:#fff;background:#B9B3A7}
.iv2 .i2-modus .ja i{background:#3F7A34}.iv2 .i2-modus .nee i{background:#8A3B2B}.iv2 .i2-modus button.aan{border-color:#37352C;box-shadow:inset 0 0 0 1px #37352C;background:#F4F1EC}
.iv2 .i2-raster{display:grid;grid-template-columns:110px repeat(4,1fr) 80px;gap:6px;align-items:center}
.iv2 .i2-rkop{display:flex;flex-direction:column;font-size:14px;font-weight:700}.iv2 .i2-rkop small{color:#6B665C;font-size:12px;font-weight:500}
.iv2 .i2-rdag{font-weight:600}
.iv2 .i2-cel{height:46px;border-radius:10px;border:1.5px dashed #CFC9BD;background:#F8F7F4;font:inherit;font-size:17px;font-weight:800;color:#fff;cursor:pointer}
.iv2 .i2-cel.ja{background:#3F7A34;border:1.5px solid #3F7A34}.iv2 .i2-cel.nee{background:#8A3B2B;border:1.5px solid #8A3B2B}
.iv2 .i2-heledag{border:0;background:none;font:inherit;font-size:13px;color:#5C594F;text-decoration:underline;cursor:pointer;height:44px}
.iv2 .i2-tijden{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px}
.iv2 .i2-tijden div{display:flex;align-items:center;gap:8px}.iv2 .i2-tijden b{width:30px}.iv2 .i2-tijden .iv-invoer{margin-top:0;padding:8px 10px}
.iv2 .i2-slot{background:#F1EEE8;border-radius:14px;padding:16px 20px;margin-top:8px}.iv2 .i2-slot p{margin:6px 0 0;color:#37352C;line-height:1.5}
.iv2 .i2-voet{position:fixed;left:0;right:0;bottom:0;height:80px;background:#F8F7F4;border-top:1px solid #E4E0D8;display:flex;align-items:center;justify-content:space-between;padding:0 28px 0 268px;z-index:2}
.iv2 .i2-vorige{height:52px;padding:0 22px;border-radius:12px;border:1.5px solid #B9B3A7;background:#fff;font:inherit;font-weight:700;font-size:16px;cursor:pointer;color:#37352C}
.iv2 .i2-vorige:disabled{opacity:.35;cursor:default}
.iv2 .i2-volgende{height:52px;padding:0 34px;border-radius:12px;border:0;background:#F2DF4E;color:#37352C;font:inherit;font-weight:800;font-size:17px;cursor:pointer}
.iv2 .i2-volgende:disabled{opacity:.5}
.iv2 .i2-paneel{width:400px;flex:none;border-left:1px solid #E4E0D8;background:#fff;overflow:auto;padding:16px 18px 110px}
.iv2 .i2-paneelkop{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.iv2 .i2-paneelkop b{font-size:18px}
.iv2 .i2-paneelkop button{width:34px;height:34px;border-radius:50%;border:1px solid #DDD8CE;background:#fff;font-size:20px;cursor:pointer}
.iv2 .i2-cv{width:100%;height:70vh;border:1px solid #E4E0D8;border-radius:10px}
.iv2 .i2-voor dl{margin:0}.iv2 .i2-voor dl div{display:grid;grid-template-columns:130px 1fr;gap:10px;padding:8px 0;border-bottom:1px solid #EEEAE3;font-size:15px}
.iv2 .i2-voor dt{color:#5C594F}.iv2 .i2-voor dd{margin:0;font-weight:700}.iv2 .i2-voor dd small{display:inline-block;margin-left:8px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#1D4566;background:#EEF4FA;border-radius:99px;padding:2px 8px}
.iv2 .i2-voorregel{font-size:15px;margin:12px 0 0}.iv2 .i2-voorregel b{display:block}
.iv2 .i2-punten{background:#F1EEE8;border-radius:12px;padding:12px 14px;margin-top:12px;font-size:15px}.iv2 .i2-punten ol{margin:6px 0 0 18px;padding:0}.iv2 .i2-punten li{margin-top:4px}
.iv2 .i2-voor .i2-let{margin-top:12px}.iv2 .i2-voor .i2-lbl{margin-top:16px}
.iv2 .i2-startkaart{background:#fff;border:1px solid #E4E0D8;border-radius:16px;padding:8px 20px 18px}
.iv2 .i2-startknoppen{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:18px;flex-wrap:wrap}
.iv2 button:focus-visible,.iv2 input:focus-visible,.iv2 textarea:focus-visible,.iv2 select:focus-visible{outline:2px solid #37352C;outline-offset:2px}
@media (max-width:1180px){.iv2 .i2-paneel{position:fixed;right:0;top:60px;bottom:0;z-index:5;box-shadow:-12px 0 30px -18px rgba(0,0,0,.35);width:min(420px,92vw)}}
@media (max-width:900px){
  .iv2 .i2-logo{width:96px}.iv2 .i2-door{display:none}.iv2 .i2-wie{font-size:17px}.iv2 .i2-wie span,.iv2 .i2-wie i{display:none}
  .iv2 .i2-lijf{flex-direction:column}
  .iv2 .i2-nav{width:auto;flex-direction:row;border-right:0;border-bottom:1px solid #E9E5DD;padding:8px 12px;overflow-x:auto;gap:4px}
  .iv2 .i2-nav button{white-space:nowrap;padding:8px 12px;border-left:0;font-size:15px}.iv2 .i2-teller{display:none}
  .iv2 .i2-inhoud{padding:20px 18px 120px}.iv2 h1{font-size:28px}
  .iv2 .i2-voet{padding:0 18px}.iv2 .i2-volgende{padding:0 20px}
  .iv2 .i2-raster{grid-template-columns:86px repeat(4,1fr) 64px}.iv2 .i2-kleuren{grid-template-columns:1fr}
  .iv2 .i2-vraag{grid-template-columns:34px minmax(0,1fr);gap:0 10px}
}
`;
