/**
 * De sollicitantenkaart, één variant per stap (borden I2, I2c, I2d met I4, I6).
 * Stappen D3, D6, D7, D8 en D9 van het bouwplan.
 */
import { Fragment, useEffect, useRef, useState } from "react";
import {
  BRANCHE, DAGDELEN, DAGEN_KORT, DISC, ONDERDELEN, SCHUIVEN, beschikbaarheidSamenvatting, beoordelingCompleet, disc, magAccepteren,
  magOnboarden, motivatie, rasterTelling, referentieStatus, terugzetLabel, voortgangIndex, geenGehoorTeller,
  type ArchiefHerkomst, type Beoordeling, type Branche, type Check, type Intake, type Script, type Stap,
} from "@shared/sollicitantRegels";
import { JobGesprekPaneel } from "../JobBeheer";
import { AfwijzenDialoog } from "./Afwijzen";
import {
  BrancheChip, Chip, Dialoog, Foto, Kaartje, Knop, Voortgang, api, dagDatum, kortDatum, langDatum, melding, tijdstip, useData,
} from "./gedeeld";

export interface KaartData {
  kandidaat: {
    id: number; voornaam: string; achternaam: string; naam: string; email: string | null; telefoon: string | null; geboren: string | null;
    leeftijd: number | null; nationaliteit: string | null; zone: string | null; woonplaats: string | null; functie: string; functieNaam: string;
    afwas: boolean; twvNodig: boolean; heeftCv: boolean; status: string; gespreksdatum: string | null; gesprekstijd: string | null;
    talen: string | null; ervaring: string | null; beschikbaarheid: string | null; aangemeld: string; whatsapp: string; bewaardTot: string | null; postcode?: string | null; woonland?: string | null;
    cv?: { naam: string; soort: "pdf" | "afbeelding" | "word" | "anders"; gecontroleerdDoor: string | null } | null;
  };
  stap: Stap; branche: Branche; script: Script; interviewer: string | null; bevestigd: boolean;
  dossier: null | {
    intakeStatus: string; intakeStap: number; intake: Intake; intakeDoor: string | null; intakeAfgerondAt: string | null;
    beoordeling: Beoordeling; beoordeeldDoor: string | null; beoordeeldAt: string | null; controle: Check;
    twijfelVan: string | null; twijfelDoor: string | null; twijfelAt: string | null; geaccepteerdDoor: string | null; geaccepteerdAt: string | null;
    gearchiveerdUit: string | null; archiefReden: string; gearchiveerdDoor: string | null; gearchiveerdAt: string | null;
    foto: string | null; fotoOvergeslagen: boolean; stapSinds: string;
  };
  job: null | { velden: Record<string, unknown>; twijfels: string[]; status: string };
  tijdlijn: { at: string; tekst: string }[];
  afwijsmailAan: boolean;
  /** De ingelogde gebruiker; die neemt de intake af. */
  ik?: string;
}

type Terug = { label: string; doe: () => void };

export function SollicitantKaart({ id, terug, naarLijst, startIntake }: {
  id: number; terug: Terug; naarLijst: (l: "beoordelen" | "refdoc" | "extra" | "onboarding" | "archief" | "gesprekken") => void; startIntake: () => void;
}) {
  const { data, fout, opnieuw } = useData<KaartData>(`/api/sollicitanten/kaart/${id}`);
  const [afwijzen, setAfwijzen] = useState<null | { aanleiding?: "niet_verschenen" | "negatief" }>(null);
  const [bezig, setBezig] = useState(false);
  const [verzetten, setVerzetten] = useState(false);
  const [persoon, setPersoon] = useState(false);
  if (fout) return <div className="sv-dossier"><button className="sv-terug" onClick={terug.doe}>← {terug.label}</button><div className="sv-fout">{fout}</div></div>;
  if (!data) return <div className="sv-dossier"><p className="sv-grijs">Laden...</p></div>;
  const k = data.kandidaat;
  const d = data.dossier;
  const stap = data.stap;

  async function actie(soort: string, extra: Record<string, unknown> = {}, na?: () => void) {
    setBezig(true);
    try {
      await api(`/api/sollicitanten/actie/${id}`, { method: "POST", body: { actie: soort, ...extra } });
      na ? na() : opnieuw();
    } catch (e: any) { melding(e.message); }
    finally { setBezig(false); }
  }

  const archiefStap: ArchiefHerkomst = stap === "gesprek_gepland" ? "gesprek_gepland" : stap === "onboarding" || stap === "archief" ? "ref_doc_check" : stap;
  const afwijsDialoog = afwijzen && (
    <AfwijzenDialoog id={id} naam={k.naam} voornaam={k.voornaam} stap={archiefStap} aanleiding={afwijzen.aanleiding}
      sluit={() => { setAfwijzen(null); opnieuw(); }}
      klaar={(r) => {
        setAfwijzen(null);
        melding(afwijzen.aanleiding === "niet_verschenen" ? `${k.voornaam} staat nu als Niet verschenen in het archief.` : `Afgewezen: ${k.voornaam} staat in het archief.${r.verstuurd ? " De mail is verstuurd." : ""}`);
        naarLijst(stap === "gesprek_gepland" ? "gesprekken" : stap === "beoordelen" ? "beoordelen" : stap === "extra_check" ? "extra" : "refdoc");
      }} />
  );

  if (stap === "gesprek_gepland") {
    return (
      <div className="sv-dossier">
        <button className="sv-terug" onClick={terug.doe}>← {terug.label}</button>
        <VoorIntake data={data} bezig={bezig} startIntake={startIntake} nietVerschenen={() => setAfwijzen({ aanleiding: "niet_verschenen" })}
          afwijzen={() => setAfwijzen({})} verzetten={() => setVerzetten(true)} persoon={() => setPersoon(true)} />
        {afwijsDialoog}
        {verzetten && <VerzetDialoog data={data} sluit={() => setVerzetten(false)} klaar={() => { setVerzetten(false); melding("Het gesprek is verzet."); opnieuw(); }} />}
        {persoon && <PersoonDialoog data={data} sluit={() => setPersoon(false)} klaar={() => { setPersoon(false); opnieuw(); }} />}
      </div>
    );
  }

  const intake = (d?.intake || {}) as Intake;
  const ctl = (d?.controle || {}) as Check;
  const huidig = voortgangIndex(stap === "archief" ? ((d?.gearchiveerdUit as Stap) || "gesprek_gepland") : stap);
  const chip = stap === "extra_check" && d?.twijfelDoor
    ? <Chip soort="twijfel">EXTRA check · twijfel van {d.twijfelDoor.split(" ")[0]}, {kortDatum(d.twijfelAt)}</Chip>
    : stap === "onboarding"
      ? <Chip soort="ok">✓ Geaccepteerd{d?.geaccepteerdDoor ? ` door ${d.geaccepteerdDoor.split(" ")[0]}` : ""}{d?.geaccepteerdAt ? `, ${kortDatum(d.geaccepteerdAt)}` : ""} · {magAccepteren(ctl, k.twvNodig) ? "ref. en doc. check in orde" : d?.twijfelDoor ? "via EXTRA check" : "ref. en doc. check"}</Chip>
      : stap === "archief"
        ? <Chip soort="fout">In het archief · {d?.archiefReden}{d?.gearchiveerdAt ? `, ${kortDatum(d.gearchiveerdAt)}` : ""}</Chip>
        : null;

  const rechts = (
    <div className="sv-kolom">
      <BeschikbaarheidKaart raster={intake.raster} />
      <Persoonsgegevens data={data} aanpassen={() => setPersoon(true)} />
      <Tijdlijn data={data} />
    </div>
  );

  return (
    <div className="sv-dossier">
      <button className="sv-terug" onClick={terug.doe}>← {terug.label}</button>
      <Kopkaart data={data} huidig={huidig} chip={chip} alles={stap === "onboarding"} />

      {stap === "extra_check" && (
        <Kaartje className="sv-besluitkaart">
          <div className="sv-besluit">
            <div><h3>Besluit</h3><p className="sv-grijs" style={{ marginTop: 4 }}>{k.voornaam} staat op EXTRA check. Bekijk de kaart en kies wat het wordt.</p>
              {!magOnboarden(ctl, k.twvNodig) && <p className="sv-klein" style={{ marginTop: 4 }}>Onboarden kan zodra je bij de documentcheck hebt gezet dat je het ID{k.twvNodig ? " en het verblijfsdocument" : ""} hebt gezien.</p>}
            </div>
            <div className="sv-rij">
              <Knop onClick={() => setAfwijzen({})} disabled={bezig}>Afwijzen</Knop>
              <Knop soort="groen" disabled={bezig || !magOnboarden(ctl, k.twvNodig)} onClick={() => actie("onboarden", {}, () => { melding("Onboarden: de sollicitant staat nu in Onboarding."); naarLijst("onboarding"); })}>Onboarden</Knop>
            </div>
          </div>
        </Kaartje>
      )}
      {stap === "archief" && (
        <Kaartje>
          <div className="sv-besluit">
            <div><h3>In het archief</h3><p className="sv-grijs" style={{ marginTop: 4 }}>Gestopt in {terugzetLabel((d?.gearchiveerdUit || "kandidaten") as ArchiefHerkomst)} · {d?.archiefReden}{d?.gearchiveerdDoor ? ` · door ${d.gearchiveerdDoor.split(" ")[0]}` : ""}. Bewaard tot {langDatum(k.bewaardTot)}.</p></div>
            <Knop soort="donker" disabled={bezig} onClick={() => actie("terugzetten", {}, () => { melding(`${k.voornaam} is teruggezet.`); opnieuw(); })}>↺ Terugzetten</Knop>
          </div>
        </Kaartje>
      )}

      {stap === "ref_doc_check" && <>
        {(
          <Kaartje className="sv-besluitkaart">
            <div className="sv-besluit">
              <div>
                <h3>Besluit</h3>
                <div className="sv-rij" style={{ marginTop: 8 }}>
                  {ctl.idGezien && (!k.twvNodig || ctl.verblijfGezien) ? <Chip soort="ok">✓ ID gezien</Chip> : <Chip soort="waarschuw">{ctl.idGezien ? "Verblijfsdocument niet gezien" : "ID niet gezien"}</Chip>}
                  <RefChip ctl={ctl} />
                </div>
              </div>
              <div className="sv-rij">
                <Knop onClick={() => setAfwijzen({})} disabled={bezig}>Afwijzen</Knop>
                <Knop soort="geel" disabled={bezig} onClick={() => actie("twijfel", {}, () => { melding("Op EXTRA check gezet. Klik op EXTRA check om de twijfelgevallen te zien."); naarLijst("refdoc"); })}>Twijfel</Knop>
                <Knop soort="groen" disabled={bezig || !magAccepteren(ctl, k.twvNodig)} onClick={() => actie("accepteren", {}, () => { melding("Geaccepteerd: door naar Onboarding."); opnieuw(); })}>Accepteren</Knop>
              </div>
            </div>
            <p className="sv-klein" style={{ marginTop: 10 }}>Accepteren kan pas als het ID en de referentie allebei in orde zijn. Dan gaat {k.voornaam} door naar Onboarding. Twijfel zet de sollicitant onder EXTRA check. Afwijzen of een negatieve referentie stuurt de sollicitant naar het archief.</p>
          </Kaartje>
        )}
        <div className="sv-onder" style={{ marginBottom: 16 }}>
          <DocumentInvoer data={data} ctl={ctl} bijgewerkt={opnieuw} />
          <ReferentieInvoer data={data} ctl={ctl} bijgewerkt={opnieuw} negatief={() => setAfwijzen({ aanleiding: "negatief" })} />
        </div>
      </>}

      <KpiRij intake={intake} script={data.script} />

      <div className="sv-twee">
        <div className="sv-kolom">
          {stap === "beoordelen" ? (
            <BeoordelingInvoer data={data} bezig={bezig}
              afwijzen={() => setAfwijzen({})}
              twijfel={() => actie("twijfel", {}, () => { melding("Op EXTRA check gezet. Klik op EXTRA check om de twijfelgevallen te zien."); naarLijst("refdoc"); })}
              naarCheck={() => actie("naar_check", {}, () => { melding("Door naar de ref. en doc. check."); opnieuw(); })} />
          ) : <BeoordelingLezen data={data} />}
          <UitDeIntake intake={intake} script={data.script} metReferentie={stap === "beoordelen"} />
          {(stap === "onboarding" || stap === "archief" || stap === "extra_check") && <>
            <ReferentieLezen ctl={ctl} />
            {stap === "extra_check" && !magOnboarden(ctl, k.twvNodig)
              ? <DocumentInvoer data={data} ctl={ctl} bijgewerkt={opnieuw} />
              : <DocumentLezen data={data} ctl={ctl} />}
          </>}
        </div>
        {rechts}
      </div>

      {afwijsDialoog}
      {persoon && <PersoonDialoog data={data} sluit={() => setPersoon(false)} klaar={() => { setPersoon(false); opnieuw(); }} />}
    </div>
  );
}

// ─── Kop en KPI's ───────────────────────────────────────────────────────────

function Kopkaart({ data, huidig, chip, alles }: { data: KaartData; huidig: number; chip: React.ReactNode; alles?: boolean }) {
  const k = data.kandidaat;
  const d = data.dossier;
  const [jobOpen, setJobOpen] = useState(false);
  return (
    <Kaartje>
      <div className="sv-tussen">
        <div className="sv-kop">
          <Foto src={d?.foto} branche={data.branche} />
          <div>
            <div className="sv-rij"><h1>{k.naam}</h1><BrancheChip b={data.branche} /></div>
            <p className="sv-sub">{[k.functieNaam, k.leeftijd !== null ? `${k.leeftijd} jaar` : null, k.woonplaats, d?.intakeAfgerondAt ? `intake ${kortDatum(d.intakeAfgerondAt)}${d.intakeDoor ? ` met ${d.intakeDoor}` : ""}` : null].filter(Boolean).join(" · ")}</p>
            {chip && <div style={{ marginTop: 8 }}>{chip}</div>}
          </div>
        </div>
        <div className="sv-rij">
          {data.job && <Knop onClick={() => setJobOpen((o) => !o)}>{jobOpen ? "Gesprek met Job sluiten" : "Gesprek met Job"}</Knop>}
          {d?.intakeStatus === "afgerond" && <IntakeBekijken data={data} />}
          <CvKnoppen data={data} />
        </div>
      </div>
      <Voortgang huidig={huidig} alles={alles} />
      {jobOpen && <div style={{ marginTop: 16 }}><JobGesprekPaneel candidateId={k.id} /></div>}
    </Kaartje>
  );
}

function IntakeBekijken({ data }: { data: KaartData }) {
  const [open, setOpen] = useState(false);
  const i = (data.dossier?.intake || {}) as Intake;
  return <>
    <Knop onClick={() => setOpen(true)}>Intake bekijken →</Knop>
    {open && (
      <Dialoog titel={`Intake van ${data.kandidaat.voornaam}`} sluit={() => setOpen(false)} breed={760}>
        <IntakeSamenvatting intake={i} />
        <div className="sv-rij" style={{ justifyContent: "flex-end", marginTop: 16 }}><Knop onClick={() => setOpen(false)}>Sluiten</Knop></div>
      </Dialoog>
    )}
  </>;
}

export function IntakeSamenvatting({ intake: i }: { intake: Intake }) {
  const lijst = (x: unknown) => (Array.isArray(x) && x.length ? x.join(", ") : "Niet ingevuld");
  const waarde = (x: unknown) => (x === undefined || x === null || x === "" ? "Niet ingevuld" : String(x));
  const rijen: [string, string][] = [
    ["1.1 ID", waarde(i.id_gezien)],
    ["2.1 Talen", `${lijst(i.talen)}${i.talen_anders ? ` (${i.talen_anders})` : ""}`],
    ["2.2 Werkvergunning", waarde(i.nationaliteit)],
    ["3.1 Ervaring", i.ervaring_werk ? i.ervaring_werk : lijst(i.ervaring_soort)],
    ["3.2 Werkervaring", waarde(i.ervaring_jaren)],
    ["3.3 Alleen dienst", waarde(i.alleen_dienst)],
    ["3.4 Drie borden", waarde(i.drie_borden)],
    ["3.5 Cocktails", i.cocktails === undefined ? "Niet ingevuld" : `${i.cocktails} van 5`],
    ["3.6 Barista", i.barista === undefined ? "Niet ingevuld" : `${i.barista} van 5`],
    ["3.7 Andere bijbaan", waarde(i.bijbaan)],
    ["3.8 Vaardigheden", i.vaardigheden ? `Bediening ${i.vaardigheden.bediening ?? "-"} · Bar ${i.vaardigheden.bar ?? "-"} · Diner ${i.vaardigheden.diner ?? "-"}` : "Niet ingevuld"],
    ["4.2 Belangrijkst", waarde(i.belangrijkst)],
    ["6.1 Vervoer", `${lijst(i.vervoer)}${i.studenten_ov && i.studenten_ov !== "Geen" ? ` · studenten-OV ${i.studenten_ov.toLowerCase()}` : ""}`],
    ["6.2 Rijbewijzen", lijst(i.rijbewijzen)],
    ["6.3 Kleding", lijst(i.kleding)],
    ["6.4 EHBO", i.ehbo === "Ja" ? `Ja${i.ehbo_geldig ? `, geldig tot ${i.ehbo_geldig}` : ""}` : waarde(i.ehbo)],
    ["7.1 Uren per week", waarde(i.uren)],
    ["8.1 Referentie", i.referentie?.geen ? "Geen werkervaring, geen referentie mogelijk" : [i.referentie?.naam, i.referentie?.telefoon].filter(Boolean).join(" · ") || "Niet ingevuld"],
    ["8.2 Vragen", waarde(i.vragen)],
  ];
  const m = motivatie(i.stellingen, i.belangrijkst);
  const ds = disc(i.woordparen);
  rijen.splice(11, 0, ["4.1 Motivatie", m.volledig ? m.scores.map((s) => `${s.label} ${s.score}`).join(" · ") : "Niet ingevuld"]);
  rijen.splice(13, 0, ["5.1 Werkstijl", ds.volledig ? `${ds.profiel} · D ${ds.scores.D}, I ${ds.scores.I}, S ${ds.scores.S}, C ${ds.scores.C}` : "Niet ingevuld"]);
  return <dl className="sv-gegevens">{rijen.map(([a, b]) => <Fragment key={a}><dt>{a}</dt><dd>{b}</dd></Fragment>)}</dl>;
}

function KpiRij({ intake: i, script }: { intake: Intake; script: Script }) {
  const m = motivatie(i.stellingen, i.belangrijkst);
  const ds = disc(i.woordparen);
  const r = rasterTelling(i.raster);
  return (
    <div className="sv-kpirij">
      <Kaartje><label>MOTIVATIE</label><strong>{m.volledig ? m.profiel.map((p) => p.label).join(" · ") : "Nog niet bekend"}</strong><small>{m.volledig ? `${m.profiel[0].score} en ${m.profiel[1].score} van 100` : "Uit onderdeel 4"}</small></Kaartje>
      <Kaartje><label>WERKSTIJL (DISC)</label>
        <strong>{ds.volledig ? <>{ds.volgorde.slice(0, 2).map((l) => <span key={l} style={{ width: 12, height: 12, borderRadius: 6, background: DISC[l].kleur, display: "inline-block" }} />)}{ds.profiel}</> : "Nog niet bekend"}</strong>
        <small>{ds.volledig ? `${DISC[ds.volgorde[0]].naam} en ${DISC[ds.volgorde[1]].naam}` : "Uit onderdeel 5"}</small></Kaartje>
      <Kaartje><label>ERVARING</label><strong>{(i.ervaring_jaren || "Niet ingevuld").replace("-", " tot ")}</strong><small>{script === "algemeen" ? (i.ervaring_werk || "").slice(0, 60) : (i.ervaring_soort || []).join(" en ")}</small></Kaartje>
      <Kaartje><label>BESCHIKBAAR</label><strong>{i.uren ? `${i.uren} uur per week` : "Niet ingevuld"}</strong><small>{r.ja} dagdelen, {beschikbaarheidSamenvatting(i.raster)}</small></Kaartje>
    </div>
  );
}

// ─── Linkerkolom ────────────────────────────────────────────────────────────

function BeoordelingInvoer({ data, bezig, afwijzen, twijfel, naarCheck }: { data: KaartData; bezig: boolean; afwijzen: () => void; twijfel: () => void; naarCheck: () => void }) {
  const [b, setB] = useState<Beoordeling>((data.dossier?.beoordeling || {}) as Beoordeling);
  const [opgeslagen, setOpgeslagen] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  function zet(code: keyof Beoordeling, v: number) {
    const nieuw = { ...b, [code]: v };
    setB(nieuw); setOpgeslagen(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      api(`/api/sollicitanten/beoordeling/${data.kandidaat.id}`, { method: "PUT", body: { beoordeling: nieuw } }).then(() => setOpgeslagen(true)).catch((e) => melding(e.message));
    }, 400);
  }
  const compleet = beoordelingCompleet(b);
  const wacht = async (doe: () => void) => {
    clearTimeout(timer.current);
    await api(`/api/sollicitanten/beoordeling/${data.kandidaat.id}`, { method: "PUT", body: { beoordeling: b } }).catch(() => {});
    doe();
  };
  return (
    <Kaartje titel="Beoordeling" rechts={`door ${(data.dossier?.intakeDoor || "jou").split(" ")[0]} · vul in nu ${data.kandidaat.voornaam} weg is${opgeslagen ? "" : " · opslaan..."}`}>
      {SCHUIVEN.map((s) => {
        const v = b[s.code];
        return (
          <div className="sv-schuif" key={s.code}>
            <b>{s.naam}</b>
            <div>
              <input type="range" min={0} max={100} step={1} value={typeof v === "number" ? v : 50} aria-label={s.naam}
                className={`${"tweezijdig" in s ? "twee" : ""} ${typeof v === "number" ? "" : "leeg"}`}
                onChange={(e) => zet(s.code, Number(e.target.value))} onClick={(e) => zet(s.code, Number((e.target as HTMLInputElement).value))} />
              <div className="einden"><span>{s.links}</span><span>{s.rechts}</span></div>
            </div>
            <strong>{typeof v === "number" ? v : "-"}</strong>
          </div>
        );
      })}
      <div className="sv-tussen" style={{ borderTop: "1px solid #EEEAE3", paddingTop: 16, alignItems: "center" }}>
        <div className="sv-rij">
          <Knop onClick={afwijzen} disabled={bezig}>Afwijzen</Knop>
          <Knop soort="geel" onClick={() => wacht(twijfel)} disabled={bezig || !compleet} title={compleet ? "" : "Vul eerst alle vier de schuiven in"}>Twijfel</Knop>
        </div>
        <Knop soort="donker" onClick={() => wacht(naarCheck)} disabled={bezig || !compleet} title={compleet ? "" : "Vul eerst alle vier de schuiven in"}>Ref. en doc. checken →</Knop>
      </div>
      {!compleet && <p className="sv-klein" style={{ marginTop: 8 }}>Zet alle vier de schuiven, dan worden Twijfel en Ref. en doc. checken actief.</p>}
    </Kaartje>
  );
}

function BeoordelingLezen({ data }: { data: KaartData }) {
  const b = (data.dossier?.beoordeling || {}) as Beoordeling;
  return (
    <Kaartje titel="Beoordeling" rechts={[data.dossier?.beoordeeldDoor?.split(" ")[0], kortDatum(data.dossier?.beoordeeldAt)].filter(Boolean).join(" · ")}>
      <div className="sv-cijfers">{SCHUIVEN.map((s) => <div key={s.code}><span>{s.kort}</span><b>{b[s.code] ?? "-"}</b></div>)}</div>
    </Kaartje>
  );
}

function UitDeIntake({ intake: i, script, metReferentie }: { intake: Intake; script: Script; metReferentie: boolean }) {
  const jaNee = (x?: string) => x || "Niet ingevuld";
  const kleding = i.kleding || [];
  const kledingTekst = script === "algemeen" ? null : kleding.length === 3 ? "Compleet" : kleding.length ? `Mist ${["Wit hemd", "Zwarte pantalon", "Nette zwarte schoenen"].filter((x) => !kleding.includes(x)).join(", ").toLowerCase()}` : "Niet ingevuld";
  return (
    <Kaartje titel="Uit de intake">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <p className="sv-lbl">ERVARING</p>
          <dl className="sv-gegevens">
            {script !== "algemeen" ? <>
              <dt>Alleen dienst</dt><dd>{jaNee(i.alleen_dienst)}</dd>
              <dt>Drie borden</dt><dd>{jaNee(i.drie_borden)}</dd>
              {script === "horeca" && <><dt>Cocktails</dt><dd>{i.cocktails ?? "-"} van 5</dd><dt>Barista</dt><dd>{i.barista ?? "-"} van 5</dd></>}
              <dt>Inschatting</dt><dd>Bediening {i.vaardigheden?.bediening ?? "-"}{script === "horeca" ? ` · Bar ${i.vaardigheden?.bar ?? "-"}` : ""} · Diner {i.vaardigheden?.diner ?? "-"}</dd>
            </> : <><dt>Werk</dt><dd>{i.ervaring_werk || "Niet ingevuld"}</dd></>}
            <dt>Andere bijbaan</dt><dd>{i.bijbaan || "Niet ingevuld"}</dd>
          </dl>
        </div>
        <div>
          <p className="sv-lbl">PRAKTISCH</p>
          <dl className="sv-gegevens">
            <dt>Vervoer</dt><dd>{(i.vervoer || []).join(", ") || "Niet ingevuld"}{i.studenten_ov && i.studenten_ov !== "Geen" ? ` · studenten-OV ${i.studenten_ov.toLowerCase()}` : ""}</dd>
            <dt>Rijbewijs</dt><dd>{(i.rijbewijzen || []).join(", ") || "Niet ingevuld"}</dd>
            {kledingTekst && <><dt>Kleding</dt><dd>{kledingTekst}</dd></>}
            <dt>EHBO</dt><dd>{i.ehbo === "Ja" ? `Ja${i.ehbo_geldig ? `, geldig tot ${i.ehbo_geldig.split("-").reverse().join("-")}` : ""}` : jaNee(i.ehbo)}</dd>
            <dt>Talen</dt><dd>{[...(i.talen || []).filter((t) => t !== "Anders, namelijk"), i.talen_anders].filter(Boolean).join(", ") || "Niet ingevuld"}</dd>
          </dl>
        </div>
      </div>
      <div style={{ borderTop: "1px solid #EEEAE3", marginTop: 14, paddingTop: 14 }}>
        <p className="sv-lbl">AFRONDEN</p>
        <dl className="sv-gegevens">
          {metReferentie && <><dt>Referentie</dt><dd>{i.referentie?.geen ? "Geen werkervaring, geen referentie mogelijk" : [i.referentie?.naam, i.referentie?.telefoon].filter(Boolean).join(" · ") || "Niet ingevuld"}</dd></>}
          <dt>Vraag van de sollicitant</dt><dd>{i.vragen || "Geen"}</dd>
        </dl>
      </div>
    </Kaartje>
  );
}

function RefChip({ ctl }: { ctl: Check }) {
  const s = referentieStatus(ctl);
  if (s === "positief") return <Chip soort="ok">✓ Referentie positief</Chip>;
  if (s === "overgeslagen") return <Chip soort="ok">✓ Referentie overgeslagen</Chip>;
  if (s === "negatief") return <Chip soort="fout">Referentie negatief</Chip>;
  const n = geenGehoorTeller(ctl);
  if (n >= 2) return <Chip soort="fout">{n} keer geen gehoor</Chip>;
  return <Chip soort="waarschuw">Referentie open{n ? ` · ${n} van 2 pogingen` : ""}</Chip>;
}

function laatstGesproken(ctl: Check) {
  const p = [...(ctl.pogingen || [])].reverse().find((x) => x.uitkomst === "gesproken");
  if (!p) return null;
  const n = (ctl.pogingen || []).indexOf(p) + 1;
  return `${p.door} · ${kortDatum(p.at)}, ${tijdstip(p.at)} · ${n}e poging`;
}

function ReferentieLezen({ ctl }: { ctl: Check }) {
  return (
    <Kaartje titel="Referentie" rechts={<RefChip ctl={ctl} />}>
      <dl className="sv-gegevens">
        <dt>Referent</dt><dd>{ctl.referent || (ctl.overgeslagen ? `Overgeslagen: ${ctl.overslaanReden}` : "Niet ingevuld")}</dd>
        {laatstGesproken(ctl) && <><dt>Gebeld door</dt><dd>{laatstGesproken(ctl)}</dd></>}
        {ctl.overgeslagen && <><dt>Overgeslagen door</dt><dd>{ctl.overslaanDoor} · {kortDatum(ctl.overslaanAt)} · {ctl.overslaanReden}</dd></>}
      </dl>
      {ctl.verslag && <><p className="sv-lbl" style={{ marginTop: 14 }}>REFERENTIEVERSLAG</p><div className="sv-verslag">{ctl.verslag}</div></>}
    </Kaartje>
  );
}

function DocumentLezen({ data, ctl }: { data: KaartData; ctl: Check }) {
  const k = data.kandidaat;
  return (
    <Kaartje titel="Documentcheck" rechts={ctl.idGezien && (!k.twvNodig || ctl.verblijfGezien) ? <Chip soort="ok">✓ In orde</Chip> : <Chip soort="waarschuw">Niet compleet</Chip>}>
      <dl className="sv-gegevens">
        <dt>ID</dt><dd>{ctl.idGezien ? `Gezien · ${kortDatum(ctl.idAt)}, ${ctl.idDoor}` : "Niet gezien"}</dd>
        <dt>Werkvergunning</dt><dd>{k.twvNodig ? `TWV nodig${ctl.verblijfGezien ? ` · verblijfsdocument gezien ${kortDatum(ctl.verblijfAt)}, ${ctl.verblijfDoor}` : ""}` : `Niet nodig${k.zone === "NL" ? " · Nederlandse nationaliteit" : k.zone === "EU" ? " · EU-nationaliteit" : ""}`}</dd>
      </dl>
    </Kaartje>
  );
}

// ─── Invoer bij de ref. en doc. check ───────────────────────────────────────

async function zetCheck(id: number, body: Record<string, unknown>) {
  return api<{ controle: Check }>(`/api/sollicitanten/check/${id}`, { method: "PUT", body });
}

function DocumentInvoer({ data, ctl, bijgewerkt }: { data: KaartData; ctl: Check; bijgewerkt: () => void }) {
  const k = data.kandidaat;
  const intakeGezien = data.dossier?.intake?.id_gezien === "Gezien";
  const zet = (body: Record<string, unknown>) => zetCheck(k.id, body).then(bijgewerkt).catch((e) => melding(e.message));
  const inOrde = !!ctl.idGezien && (!k.twvNodig || !!ctl.verblijfGezien);
  return (
    <Kaartje titel="Documentcheck" rechts={inOrde ? <Chip soort="ok">✓ In orde</Chip> : !intakeGezien ? <Chip soort="waarschuw">ID niet gezien bij intake</Chip> : <Chip soort="let">Verblijfsdocument checken</Chip>}>
      <dl className="sv-gegevens" style={{ marginBottom: 14 }}>
        <dt>Bij de intake</dt><dd>{intakeGezien ? "Gezien" : "Niet gezien"}{data.dossier?.intakeAfgerondAt ? ` · ${kortDatum(data.dossier.intakeAfgerondAt)}, ${(data.dossier.intakeDoor || "").split(" ")[0]}` : ""}</dd>
        <dt>Werkvergunning</dt><dd>{k.twvNodig ? "TWV nodig" : `Niet nodig${k.zone === "NL" ? " · Nederlandse nationaliteit" : ""}`}</dd>
      </dl>
      {!(intakeGezien && ctl.idGezien) && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Heb je de ID-kaart of het paspoort van {k.voornaam} nu gezien?</p>
          <div className="sv-wissel">
            <button className={ctl.idGezien ? "aan" : ""} onClick={() => zet({ idGezien: true })}>{ctl.idGezien ? "✓ " : ""}Gezien</button>
            <button className={!ctl.idGezien ? "aan" : ""} onClick={() => zet({ idGezien: false })}>{!ctl.idGezien ? "✓ " : ""}Nog niet gezien</button>
          </div>
          {ctl.idGezien && ctl.idDoor && <p className="sv-klein" style={{ marginTop: 6 }}>Gezien door {ctl.idDoor} · {kortDatum(ctl.idAt)}, {tijdstip(ctl.idAt)}</p>}
        </div>
      )}
      {k.twvNodig && (
        <div>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Heb je het verblijfsdocument van {k.voornaam} gezien?</p>
          <div className="sv-wissel">
            <button className={ctl.verblijfGezien ? "aan" : ""} onClick={() => zet({ verblijfGezien: true })}>{ctl.verblijfGezien ? "✓ " : ""}Gezien</button>
            <button className={!ctl.verblijfGezien ? "aan" : ""} onClick={() => zet({ verblijfGezien: false })}>{!ctl.verblijfGezien ? "✓ " : ""}Nog niet gezien</button>
          </div>
          <p className="sv-klein" style={{ marginTop: 6 }}>De TWV-aanvraag loopt via het onderdeel TWV.</p>
        </div>
      )}
      {intakeGezien && ctl.idGezien && !k.twvNodig && <p className="sv-grijs">ID gezien bij de intake. Er hoeft niets meer.</p>}
    </Kaartje>
  );
}

function ReferentieInvoer({ data, ctl, bijgewerkt, negatief }: { data: KaartData; ctl: Check; bijgewerkt: () => void; negatief: () => void }) {
  const k = data.kandidaat;
  const [referent, setReferent] = useState(ctl.referent || "");
  const [telefoon, setTelefoon] = useState(ctl.telefoon || "");
  const [verslag, setVerslag] = useState(ctl.verslag || "");
  const [overslaan, setOverslaan] = useState(false);
  const [reden, setReden] = useState("");
  useEffect(() => { setReferent(ctl.referent || ""); setTelefoon(ctl.telefoon || ""); setVerslag(ctl.verslag || ""); }, [ctl.referent, ctl.telefoon, ctl.verslag]);
  const zet = (body: Record<string, unknown>) => zetCheck(k.id, body).then(bijgewerkt).catch((e) => melding(e.message));
  const bewaarTekst = (veld: string, waarde: string, oud?: string) => { if ((oud || "") !== waarde) zetCheck(k.id, { [veld]: waarde }).catch((e) => melding(e.message)); };
  const s = referentieStatus(ctl);
  const gesproken = (ctl.pogingen || []).some((p) => p.uitkomst === "gesproken");
  const uitIntake = !!data.dossier?.intake?.referentie?.naam && ctl.referent === data.dossier.intake.referentie.naam;
  const badge = s === "positief" ? <Chip soort="ok">✓ Positief</Chip> : s === "negatief" ? <Chip soort="fout">Negatief</Chip> : s === "overgeslagen" ? <Chip soort="ok">Overgeslagen</Chip> : <Chip soort="open">Open</Chip>;
  return (
    <Kaartje titel="Referentiecheck" rechts={badge}>
      {s === "overgeslagen" ? (
        <div>
          <p>Goedgekeurd zonder referentie: <b>{ctl.overslaanReden}</b>.</p>
          <p className="sv-klein" style={{ marginTop: 4 }}>Door {ctl.overslaanDoor} · {kortDatum(ctl.overslaanAt)}, {tijdstip(ctl.overslaanAt)}</p>
          <button className="sv-knop sv-knop-link" style={{ marginTop: 10 }} onClick={() => zet({ overslaanTerug: true })}>Toch een referentie bellen</button>
        </div>
      ) : <>
        <label className="sv-veld"><span>Referent{uitIntake ? <small style={{ textTransform: "none", fontWeight: 600, color: "#A39E94" }}> · uit de intake</small> : null}</span>
          <input type="text" value={referent} placeholder="Naam, functie en bedrijf" onChange={(e) => setReferent(e.target.value)} onBlur={() => bewaarTekst("referent", referent, ctl.referent)} /></label>
        <label className="sv-veld"><span>Telefoon</span>
          <input type="tel" value={telefoon} onChange={(e) => setTelefoon(e.target.value)} onBlur={() => bewaarTekst("telefoon", telefoon, ctl.telefoon)} /></label>
        <p style={{ fontWeight: 700, margin: "6px 0 8px" }}>Heb je de referent gesproken?</p>
        <div className="sv-wissel">
          <button className={gesproken ? "aan" : ""} onClick={() => zet({ poging: "gesproken" })}>Gesproken</button>
          <button onClick={() => zet({ poging: "geen_gehoor" })}>Geen gehoor</button>
        </div>
        {(ctl.pogingen || []).length > 0 && <p className="sv-klein" style={{ marginTop: 6 }}>{(ctl.pogingen || []).map((p, i) => `${i + 1}e poging: ${p.uitkomst === "gesproken" ? "gesproken" : "geen gehoor"} (${p.door}, ${kortDatum(p.at)} ${tijdstip(p.at)})`).join(" · ")}</p>}
        {geenGehoorTeller(ctl) >= 2 && !gesproken && <p className="sv-klein" style={{ marginTop: 6, color: "#A2321F" }}>Twee keer geen gehoor. Probeer het nog eens, keur goed zonder referentie of kies Twijfel.</p>}
        {gesproken && <>
          <p className="sv-lbl" style={{ marginTop: 14 }}>REFERENTIEVERSLAG</p>
          <textarea value={verslag} placeholder="Wat vertelde de referent?" onChange={(e) => setVerslag(e.target.value)} onBlur={() => bewaarTekst("verslag", verslag, ctl.verslag)} aria-label="Referentieverslag" />
          <p style={{ fontWeight: 700, margin: "12px 0 8px" }}>Uitkomst</p>
          <div className="sv-wissel">
            <button className={ctl.uitkomst === "positief" ? "aan" : ""} onClick={() => zet({ uitkomst: "positief", verslag })}>{ctl.uitkomst === "positief" ? "✓ " : ""}Positief</button>
            <button className={ctl.uitkomst === "negatief" ? "aan" : ""} onClick={() => zetCheck(k.id, { uitkomst: "negatief", verslag }).then(() => { bijgewerkt(); negatief(); }).catch((e) => melding(e.message))}>{ctl.uitkomst === "negatief" ? "✓ " : ""}Negatief</button>
          </div>
        </>}
        <div style={{ borderTop: "1px solid #EEEAE3", marginTop: 16, paddingTop: 12 }}>
          {!overslaan ? (
            <p className="sv-klein">Geen referentie mogelijk? <button className="sv-knop sv-knop-link" onClick={() => setOverslaan(true)}>Goedkeuren zonder referentie</button></p>
          ) : (
            <div>
              <label className="sv-veld"><span>Reden</span><input type="text" value={reden} onChange={(e) => setReden(e.target.value)} placeholder="Waarom geen referentie?" maxLength={300} /></label>
              <div className="sv-rij" style={{ marginBottom: 10 }}>
                {["Eerste baan", "Referent onbereikbaar", "Eigen bedrijf, geen leidinggevende"].map((x) => <button key={x} className="sv-knop" style={{ height: 32 }} onClick={() => setReden(x)}>{x}</button>)}
              </div>
              <div className="sv-rij">
                <Knop onClick={() => { setOverslaan(false); setReden(""); }}>Annuleren</Knop>
                <Knop soort="donker" disabled={reden.trim().length < 3} onClick={() => zet({ overslaan: { reden } }).then(() => setOverslaan(false))}>Goedkeuren zonder referentie</Knop>
              </div>
              <p className="sv-klein" style={{ marginTop: 6 }}>Wordt vastgelegd met jouw naam, de reden en het tijdstip.</p>
            </div>
          )}
        </div>
      </>}
    </Kaartje>
  );
}

// ─── Rechterkolom ───────────────────────────────────────────────────────────

function BeschikbaarheidKaart({ raster }: { raster?: Intake["raster"] }) {
  const t = rasterTelling(raster);
  return (
    <Kaartje titel="Beschikbaarheid" rechts={`${t.ja} beschikbaar · ${t.nee} niet`}>
      <div className="sv-matrix">
        <span />{DAGDELEN.map((d) => <span key={d.code}>{d.label}</span>)}
        {DAGEN_KORT.map((dag) => <Fragment key={dag}>
          <span>{dag}</span>
          {DAGDELEN.map((d) => { const c = raster?.[dag]?.[d.code]; return <i key={dag + d.code} className={c || ""} title={`${dag} ${d.label}: ${c === "ja" ? "beschikbaar" : c === "nee" ? "niet beschikbaar" : "niet opgegeven"}`} />; })}
        </Fragment>)}
      </div>
    </Kaartje>
  );
}

function Persoonsgegevens({ data, aanpassen }: { data: KaartData; aanpassen: () => void }) {
  const k = data.kandidaat;
  const ctl = (data.dossier?.controle || {}) as Check;
  return (
    <Kaartje titel="Persoonsgegevens" rechts={<button className="sv-knop sv-knop-link" onClick={aanpassen}>Aanpassen</button>}>
      <dl className="sv-gegevens">
        <dt>Telefoon</dt><dd>{k.telefoon || "Onbekend"}</dd>
        <dt>E-mail</dt><dd style={{ wordBreak: "break-all" }}>{k.email || "Onbekend"}</dd>
        <dt>Geboren</dt><dd>{k.geboren ? langDatum(k.geboren) : "Onbekend"}</dd>
        <dt>Woonplaats</dt><dd>{k.woonplaats || "Onbekend"}</dd>
        <dt>Documenten</dt><dd>{ctl.idGezien ? "ID gezien" : "ID niet gezien"} · {k.twvNodig ? "TWV nodig" : "geen TWV nodig"}</dd>
      </dl>
    </Kaartje>
  );
}

function Tijdlijn({ data }: { data: KaartData }) {
  return (
    <Kaartje titel="Tijdlijn">
      <div className="sv-tijdlijn">
        {data.tijdlijn.map((t, i) => <div key={i}><b>{kortDatum(t.at)}</b><span>{t.tekst}</span></div>)}
      </div>
    </Kaartje>
  );
}

// ─── Vóór de intake (I2, mock-up kaart v3) ──────────────────────────────────

function VoorIntake({ data, bezig, startIntake, nietVerschenen, afwijzen, verzetten, persoon }: {
  data: KaartData; bezig: boolean; startIntake: () => void; nietVerschenen: () => void; afwijzen: () => void; verzetten: () => void; persoon: () => void;
}) {
  const k = data.kandidaat;
  const d = data.dossier;
  const concept = d?.intakeStatus === "concept";
  const totaal = ONDERDELEN.length;
  const klaar = concept ? Math.max(0, (d?.intakeStap || 1) - 1) : 0;
  const initialen = `${k.voornaam.charAt(0)}${k.achternaam.charAt(0)}`.toUpperCase();
  return <>
    <div className="sv3-kop">
      <div className="sv3-wie">
        {d?.foto ? <Foto src={d.foto} branche={data.branche} /> : <div className="sv3-avatar" style={{ background: BRANCHE[data.branche].vlak, color: BRANCHE[data.branche].tekst }}>{initialen}</div>}
        <div style={{ minWidth: 0 }}>
          <h1>{k.naam}</h1>
          <p className="sv3-sub">{[k.functieNaam, BRANCHE[data.branche].label, k.leeftijd !== null ? `${k.leeftijd} jaar` : null, k.woonplaats].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <div className="sv3-gereedschap">
        <CvKnoppen data={data} />
        <MeerMenu items={[
          { label: "Verzetten", doe: verzetten },
          { label: "Niet verschenen", doe: nietVerschenen },
          { label: "Gegevens aanpassen", doe: persoon },
          { label: "Afwijzen", doe: afwijzen, rood: true },
        ]} disabled={bezig} />
      </div>
    </div>
    <div className="sv3-status">
      {k.gespreksdatum
        ? <span className="sv-chip" style={{ background: "#E8F0FA", color: "#1D4566" }}>Gesprek {dagDatum(k.gespreksdatum)}{k.gesprekstijd ? `, ${k.gesprekstijd}` : ""}{data.interviewer ? ` · ${data.interviewer}` : ""}</span>
        : <Chip soort="open">Nog geen gesprek gepland</Chip>}
      {data.bevestigd && <Chip soort="ok">✓ Bevestigd door {k.voornaam}</Chip>}
      {k.cv?.gecontroleerdDoor && <Chip soort="ok">✓ Cv gecontroleerd door {k.cv.gecontroleerdDoor}</Chip>}
      {!k.heeftCv && <Chip soort="waarschuw">Nog geen cv</Chip>}
    </div>
    <Voortgang huidig={2} onder={[kortDatum(k.aangemeld), data.job ? `gesprek met Job${data.job.status === "gepland" ? " · gepland" : ""}` : null, k.gespreksdatum ? `${dagDatum(k.gespreksdatum).split(" ").slice(0, 3).join(" ")}${k.gesprekstijd ? `, ${k.gesprekstijd}` : ""}` : null]} />

    <div className="sv3-volgende">
      <div>
        <small>VOLGENDE STAP</small>
        <b>{concept ? "Intake afronden" : k.gespreksdatum ? "Intake afnemen tijdens het gesprek" : "Gesprek plannen"}</b>
        {concept && <div className="sv3-balk" aria-label={`${klaar} van ${totaal} onderdelen klaar`}>{ONDERDELEN.map((o) => <i key={o.nr} className={o.nr <= klaar ? "ok" : ""} />)}</div>}
      </div>
      {k.gespreksdatum || concept
        ? <button className="sv3-knop-licht" onClick={startIntake} disabled={bezig}>{concept ? `Verder met onderdeel ${d?.intakeStap || 1}` : "Intakeformulier starten"} <span aria-hidden>→</span></button>
        : <button className="sv3-knop-licht" onClick={verzetten} disabled={bezig}>Gesprek plannen <span aria-hidden>→</span></button>}
    </div>

    <div className="sv3-raster" style={data.job ? undefined : { gridTemplateColumns: "1fr" }}>
      <div className="sv3-links">
        <GegevensKaart data={data} aanpassen={persoon} />
        <Kaartje titel="Tijdlijn">
          <div className="sv-tijdlijn">{data.tijdlijn.map((t, i) => <div key={i}><b>{kortDatum(t.at)}</b><span>{t.tekst}</span></div>)}</div>
        </Kaartje>
      </div>
      {data.job && <aside className="sv3-chat"><JobGesprekPaneel candidateId={k.id} kolom /></aside>}
    </div>
  </>;
}

/** Gegevens als label boven waarde: alles op één regel, te lange tekst krijgt ... met de volledige tekst als tooltip. */
function GegevensKaart({ data, aanpassen }: { data: KaartData; aanpassen: () => void }) {
  const k = data.kandidaat;
  const ctl = (data.dossier?.controle || {}) as Check;
  const v = (data.job?.velden || {}) as Record<string, unknown>;
  const tekst = (x: unknown) => (typeof x === "string" && x.trim() ? x.trim() : null);
  const veld = (label: string, waarde: string | null, breed = false, leeg = "Volgt in de intake") => (
    <div className={`sv3-veld${breed ? " breed" : ""}`}><span>{label}</span><b title={waarde || undefined}>{waarde || <i>{leeg}</i>}</b></div>
  );
  const adres = k.woonland ? `Woont nog in ${k.woonland}` : [k.postcode, k.woonplaats].filter(Boolean).join(" ") || null;
  return (
    <Kaartje titel="Gegevens" rechts={<button className="sv-knop sv-knop-link" onClick={aanpassen}>Aanpassen</button>}>
      <p className="sv3-lbl">CONTACT</p>
      <div className="sv3-velden">
        {veld("Telefoon", k.telefoon && /^\+316\d{8}$/.test(k.telefoon) ? `+31 6 ${k.telefoon.slice(4, 8)} ${k.telefoon.slice(8)}` : k.telefoon, false, "Onbekend")}
        {veld("Geboren", k.geboren ? `${langDatum(k.geboren)}${k.leeftijd !== null ? ` · ${k.leeftijd} jaar` : ""}` : null, false, "Onbekend")}
        {veld("E-mail", k.email, true, "Onbekend")}
        {veld("Adres", adres, false, "Onbekend")}
        {veld("Nationaliteit", k.nationaliteit, false, "Onbekend")}
        {veld("Werkvergunning", k.twvNodig ? "Nodig" : "Niet nodig")}
        {veld("ID", ctl.idGezien ? "Gezien" : "Tonen bij de intake")}
      </div>
      <div className="sv3-scheiding" />
      <p className="sv3-lbl">WERK</p>
      <div className="sv3-velden">
        {veld("Functie", k.functieNaam)}
        {veld("Ervaring", tekst(v.ervaring) || k.ervaring, true)}
        {veld("Diensten", k.beschikbaarheid || (tekst(v.diensten) ? `${v.diensten} per week` : null))}
        {veld("Werkgebied", tekst(v.werkgebied))}
        {veld("Talen", k.talen || tekst(v.talen))}
        {veld("Vervoer", tekst(v.vervoer))}
      </div>
    </Kaartje>
  );
}

/** Cv bekijken en downloaden, met de voorvertoning rechts over de kaart. */
function CvKnoppen({ data }: { data: KaartData }) {
  const [open, setOpen] = useState(false);
  const k = data.kandidaat;
  if (!k.heeftCv) return null;
  return <>
    <Knop onClick={() => setOpen(true)}><CvIcoon /> Cv bekijken</Knop>
    <a className="sv-knop sv3-icoon" href={`/api/admin/candidates/${k.id}/cv`} title="Cv downloaden" aria-label="Cv downloaden"><NeerIcoon /></a>
    {open && <CvVoorvertoning data={data} sluit={() => setOpen(false)} />}
  </>;
}

function CvVoorvertoning({ data, sluit }: { data: KaartData; sluit: () => void }) {
  const k = data.kandidaat;
  const cv = k.cv;
  const bron = `/api/admin/candidates/${k.id}/cv?preview=1`;
  useEffect(() => {
    const toets = (e: KeyboardEvent) => { if (e.key === "Escape") sluit(); };
    window.addEventListener("keydown", toets);
    return () => window.removeEventListener("keydown", toets);
  }, [sluit]);
  return (
    <div className="sv3-scherm" onClick={(e) => { if (e.target === e.currentTarget) sluit(); }} role="dialog" aria-modal="true" aria-label={`Cv van ${k.voornaam}`}>
      <div className="sv3-paneel">
        <header>
          <div style={{ minWidth: 0 }}><b>{cv?.naam || "Cv"}</b><span>Cv van {k.naam}{cv?.gecontroleerdDoor ? ` · gecontroleerd door ${cv.gecontroleerdDoor}` : ""}</span></div>
          <div className="sv-rij" style={{ flexWrap: "nowrap" }}>
            <a className="sv-knop sv3-icoon" href={`/api/admin/candidates/${k.id}/cv`} title="Downloaden" aria-label="Downloaden"><NeerIcoon /></a>
            <a className="sv-knop sv3-icoon" href={cv?.soort === "word" ? `/api/admin/candidates/${k.id}/cv-html` : bron} target="_blank" rel="noreferrer" title="Openen in nieuw tabblad" aria-label="Openen in nieuw tabblad"><NieuwIcoon /></a>
            <Knop onClick={sluit}>Sluiten</Knop>
          </div>
        </header>
        <div className="sv3-pdf">
          {cv?.soort === "afbeelding"
            ? <img src={bron} alt={`Cv van ${k.voornaam}`} />
            : cv?.soort === "anders"
              ? <p className="sv-grijs" style={{ padding: 24 }}>Dit bestand kan niet in de browser getoond worden. Download het om het te bekijken.</p>
              : <iframe title={`Cv van ${k.voornaam}`} src={cv?.soort === "word" ? `/api/admin/candidates/${k.id}/cv-html` : bron} />}
        </div>
      </div>
    </div>
  );
}

function MeerMenu({ items, disabled }: { items: { label: string; doe: () => void; rood?: boolean }[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const klik = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const toets = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", klik);
    document.addEventListener("keydown", toets);
    return () => { document.removeEventListener("mousedown", klik); document.removeEventListener("keydown", toets); };
  }, [open]);
  return (
    <div className="sv3-meer" ref={ref}>
      <button className="sv-knop sv3-icoon" aria-haspopup="menu" aria-expanded={open} aria-label="Meer acties" title="Meer acties" disabled={disabled} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
      </button>
      {open && <div className="sv3-menu" role="menu">{items.map((i) => <button key={i.label} role="menuitem" className={i.rood ? "rood" : ""} onClick={() => { setOpen(false); i.doe(); }}>{i.label}</button>)}</div>}
    </div>
  );
}

const CvIcoon = () => <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>;
const NeerIcoon = () => <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>;
const NieuwIcoon = () => <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;

function VerzetDialoog({ data, sluit, klaar }: { data: KaartData; sluit: () => void; klaar: () => void }) {
  const [datum, setDatum] = useState(data.kandidaat.gespreksdatum || "");
  const [tijd, setTijd] = useState(data.kandidaat.gesprekstijd || "");
  const [interviewer, setInterviewer] = useState(data.interviewer || "");
  const [fout, setFout] = useState("");
  return (
    <Dialoog titel={`Gesprek van ${data.kandidaat.voornaam} verzetten`} sluit={sluit} breed={480}>
      <label className="sv-veld"><span>Datum</span><input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} /></label>
      <label className="sv-veld"><span>Tijd</span><input type="time" value={tijd} step={1800} onChange={(e) => setTijd(e.target.value)} /></label>
      <label className="sv-veld"><span>Interviewer</span><input type="text" value={interviewer} onChange={(e) => setInterviewer(e.target.value)} placeholder="Voornaam" /></label>
      <p className="sv-klein">Het vinkje Bevestigd vervalt. Laat {data.kandidaat.voornaam} zelf weten dat het gesprek verzet is.</p>
      {fout && <div className="sv-fout">{fout}</div>}
      <div className="sv-rij" style={{ justifyContent: "flex-end", marginTop: 14 }}>
        <Knop onClick={sluit}>Annuleren</Knop>
        <Knop soort="donker" onClick={() => api(`/api/sollicitanten/actie/${data.kandidaat.id}`, { method: "POST", body: { actie: "verzetten", datum, tijd, interviewer } }).then(klaar).catch((e) => setFout(e.message))}>Verzetten</Knop>
      </div>
    </Dialoog>
  );
}

function PersoonDialoog({ data, sluit, klaar }: { data: KaartData; sluit: () => void; klaar: () => void }) {
  const k = data.kandidaat;
  const [v, setV] = useState({ telefoon: k.telefoon || "", email: k.email || "", geboren: k.geboren ? String(k.geboren).slice(0, 10) : "", woonplaats: k.woonplaats || "", nationaliteit: k.nationaliteit || "" });
  const [fout, setFout] = useState("");
  const veld = (key: keyof typeof v, label: string, type = "text") => (
    <label className="sv-veld"><span>{label}</span><input type={type} value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value })} /></label>
  );
  return (
    <Dialoog titel="Persoonsgegevens aanpassen" sluit={sluit} breed={520}>
      {veld("telefoon", "Telefoon", "tel")}{veld("email", "E-mail", "email")}{veld("geboren", "Geboortedatum", "date")}{veld("woonplaats", "Woonplaats")}{veld("nationaliteit", "Nationaliteit")}
      {fout && <div className="sv-fout">{fout}</div>}
      <div className="sv-rij" style={{ justifyContent: "flex-end", marginTop: 10 }}>
        <Knop onClick={sluit}>Annuleren</Knop>
        <Knop soort="donker" onClick={() => api(`/api/sollicitanten/persoon/${k.id}`, { method: "PUT", body: v }).then(() => { melding("Persoonsgegevens opgeslagen."); klaar(); }).catch((e) => setFout(e.message))}>Opslaan</Knop>
      </div>
    </Dialoog>
  );
}
