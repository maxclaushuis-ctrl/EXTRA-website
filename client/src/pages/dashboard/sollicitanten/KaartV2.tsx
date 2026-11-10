/**
 * Het beoordelingsdashboard bij een intake van formulier versie 2.
 *
 * Alles wat hier staat komt uit vastgelegde antwoorden (shared/intakeV2.ts). Wat niet is
 * ingevuld, staat er als onbekend of staat er niet; er zijn geen standaardwaarden.
 * De kaart voor versie 1 (Kaart.tsx) blijft zoals hij was.
 */
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { DISC, idInOrde, referentieStatus, geenGehoorTeller, type Check } from "@shared/sollicitantRegels";
import {
  AANKONDIGING, BEOORDEEL_INSTRUCTIE, CONTACT, EXTRAATJE, KANAAL_ZIN, KLEDING, KLEUR_WERK, LAAT_THUIS, LASTMINUTE, LOCATIES,
  PATROON, SAMENWERKEN, SCHUIVEN_V2, TAAKNIVEAUS, TAALNIVEAUS, UITBETALING, VRAGEN, WERKRECHT,
  beoordelingV2Compleet, datumInWoorden, inzetStatus, keuzes, kpis, laterInspelen, plannerskaart, referentieOpen, samenvattingRegels, urenTekst,
  weekpatroon, werkprofielKaart, werkvoorkeuren, type BeoordelingV2, type FunctieCtx, type IntakeV2,
} from "@shared/intakeV2";
import type { KaartData } from "./Kaart";
import { Chip, Dialoog, Kaartje, Knop, api, kortDatum, melding, tijdstip } from "./gedeeld";

const lbl = (l: readonly { code: string; label: string }[], code: unknown) => l.find((x) => x.code === code)?.label || "";
const of = (x: unknown, anders = "Nog niet bekend") => (x === undefined || x === null || x === "" ? anders : String(x));

// ─── Vier kaarten bovenaan ──────────────────────────────────────────────────

export function KpiRijV2({ intake, f, cvUitleg, voornaam }: { intake: IntakeV2; f: FunctieCtx; cvUitleg?: string | null; voornaam: string }) {
  const [open, setOpen] = useState(false);
  const rij = kpis(intake, f, cvUitleg);
  const wp = werkprofielKaart(intake);
  return <>
    <div className="sv-kpirij">
      {rij.map((x) => (
        <Kaartje key={x.label}>
          <label>{x.label.toUpperCase()}</label>
          <strong>{x.kleuren?.map((l) => <span key={l} title={KLEUR_WERK[l].label} style={{ width: 12, height: 12, borderRadius: 6, background: DISC[l].kleur, display: "inline-block", flex: "none" }} />)}{x.hoofd}</strong>
          {x.label === "Werkprofiel"
            ? <small>{wp.status ? `${wp.statusLabel} · ` : ""}<button className="sv-knop sv-knop-link" style={{ fontSize: 12.5, height: "auto" }} onClick={() => setOpen(true)}>Bekijk onderbouwing</button></small>
            : <small>{x.sub}</small>}
        </Kaartje>
      ))}
    </div>
    {open && (
      <Dialoog titel={`Werkprofiel van ${voornaam}`} sluit={() => setOpen(false)} breed={620}>
        <WerkprofielUitleg intake={intake} voornaam={voornaam} />
        <div className="sv-rij" style={{ justifyContent: "flex-end", marginTop: 16 }}><Knop onClick={() => setOpen(false)}>Sluiten</Knop></div>
      </Dialoog>
    )}
  </>;
}

function WerkprofielUitleg({ intake, voornaam }: { intake: IntakeV2; voornaam: string }) {
  const wp = werkprofielKaart(intake);
  const v = werkvoorkeuren(intake);
  return <>
    <p className="sv-sub" style={{ marginBottom: 12 }}>Een samenvatting van wat {voornaam} zelf zei over werken. Geen test en geen selectiecriterium. De kleuren koos de interviewer; ze zijn niet uitgerekend.</p>
    <dl className="sv-gegevens" style={{ marginBottom: 14 }}>
      <dt>Kleuren</dt><dd>{wp.kleuren.length ? wp.kleuren.map((l) => <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 12 }}><i style={{ width: 10, height: 10, borderRadius: 5, background: DISC[l].kleur, display: "inline-block" }} />{KLEUR_WERK[l].label}</span>) : wp.titel}</dd>
      <dt>Status</dt><dd>{wp.statusLabel || "Niet vastgesteld"}</dd>
      <dt>Onderbouwing</dt><dd>{wp.onderbouwing || "Geen onderbouwing ingevuld"}</dd>
    </dl>
    <p className="sv-lbl">UITGESPROKEN VOORKEUREN, MET HET ANTWOORD WAAR HET UIT KOMT</p>
    {v.length ? <dl className="sv-gegevens">{v.map((x) => <Fragment key={x.tekst}><dt style={{ maxWidth: 240 }}>{x.bron}</dt><dd>{x.tekst}</dd></Fragment>)}</dl> : <p className="sv-grijs">Geen voorkeuren vastgelegd.</p>}
  </>;
}

// ─── Beoordeling door de interviewer ────────────────────────────────────────

type Stand = { communicatief: number | null; representatief: number | null; indruk: number | null; onderbouwing: string };
const vanDossier = (b: BeoordelingV2 | null | undefined): Stand => ({
  communicatief: typeof b?.communicatief === "number" ? b.communicatief : null,
  representatief: typeof b?.representatief === "number" ? b.representatief : null,
  indruk: typeof b?.indruk === "number" ? b.indruk : null,
  onderbouwing: b?.onderbouwing || "",
});

export function BeoordelingInvoerV2({ data, bezig, afwijzen, twijfel, naarCheck }: { data: KaartData; bezig: boolean; afwijzen: () => void; twijfel: () => void; naarCheck: () => void }) {
  const id = data.kandidaat.id;
  const [b, setB] = useState<Stand>(vanDossier(data.dossier?.beoordeling as BeoordelingV2));
  const [opslag, setOpslag] = useState<"rust" | "bezig" | "opgeslagen" | "fout">("rust");
  const [uitleg, setUitleg] = useState(false);
  const stand = useRef(b);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const bewaar = async () => {
    setOpslag("bezig");
    try { await api(`/api/sollicitanten/beoordeling2/${id}`, { method: "PUT", body: { beoordeling: stand.current } }); setOpslag("opgeslagen"); return true; }
    catch (e: any) { setOpslag("fout"); melding(e.message); return false; }
  };
  function zet(patch: Partial<Stand>, traag = false) {
    const nieuw = { ...stand.current, ...patch };
    stand.current = nieuw; setB(nieuw); setOpslag("bezig");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void bewaar(), traag ? 800 : 400);
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  const compleet = beoordelingV2Compleet(b) && !!b.onderbouwing.trim();
  const mist = !beoordelingV2Compleet(b) ? "Zet eerst alle drie de schuiven." : !b.onderbouwing.trim() ? "Schrijf eerst in een of twee zinnen waar je beoordeling op rust." : "";
  const verder = async (doe: () => void) => { clearTimeout(timer.current); if (await bewaar()) doe(); };
  const door = (data.dossier?.beoordeeldDoor || data.ik || "").split(" ")[0];
  return (
    <Kaartje titel="Beoordeling interviewer" rechts={<>{door ? `Door ${door} · ` : ""}schaal 1 tot 100 · <span role="status" style={{ color: opslag === "fout" ? "#A2321F" : undefined }}>{opslag === "bezig" ? "opslaan..." : opslag === "fout" ? "opslaan mislukt" : opslag === "opgeslagen" ? "opgeslagen" : "vul in na het gesprek"}</span></>}>
      <button className="sv-knop sv-knop-link" style={{ marginBottom: 10 }} onClick={() => setUitleg((u) => !u)} aria-expanded={uitleg}>{uitleg ? "Uitleg verbergen" : "Zo beoordeel je"}</button>
      {uitleg && <ul className="sv2-instructie">{BEOORDEEL_INSTRUCTIE.map((t) => <li key={t}>{t}</li>)}</ul>}
      {SCHUIVEN_V2.map((s) => {
        const v = b[s.code];
        const leeg = v === null;
        return (
          <div className="sv2-schuif" key={s.code}>
            <b>{s.naam}</b>
            <div>
              <input type="range" min={1} max={100} step={1} value={leeg ? 50 : v} className={leeg ? "leeg" : ""} aria-label={s.naam} aria-valuetext={leeg ? "Niet beoordeeld" : String(v)}
                onChange={(e) => zet({ [s.code]: Number(e.target.value) } as Partial<Stand>)}
                onPointerUp={(e) => { if (leeg) zet({ [s.code]: Number((e.target as HTMLInputElement).value) } as Partial<Stand>); }} />
              <small>{s.hulp}</small>
            </div>
            <div className="sv2-cijfer">
              <input type="number" min={1} max={100} inputMode="numeric" value={leeg ? "" : v} aria-label={`${s.naam}, exact cijfer`}
                onChange={(e) => { const t = e.target.value; if (t === "") return zet({ [s.code]: null } as Partial<Stand>); const n = Math.round(Number(t)); if (Number.isFinite(n) && n >= 1 && n <= 100) zet({ [s.code]: n } as Partial<Stand>); }} />
              {leeg ? <em>Niet beoordeeld</em> : <button onClick={() => zet({ [s.code]: null } as Partial<Stand>)} aria-label={`${s.naam} wissen`}>wissen</button>}
            </div>
          </div>
        );
      })}
      <label className="sv-veld" style={{ marginTop: 4 }}><span style={{ textTransform: "none", fontSize: 15, fontWeight: 800, color: "#37352C", letterSpacing: 0 }}>Wat onderbouwt jouw beoordeling?</span>
        <textarea value={b.onderbouwing} maxLength={1000} placeholder="Een of twee feiten uit het gesprek. Bijvoorbeeld: geeft concrete voorbeelden en legt uit welke taken zij zelfstandig doet." onChange={(e) => zet({ onderbouwing: e.target.value }, true)} aria-label="Onderbouwing van de beoordeling" /></label>
      <div className="sv-tussen" style={{ borderTop: "1px solid #EEEAE3", paddingTop: 16, marginTop: 10, alignItems: "center" }}>
        <div className="sv-rij">
          <Knop onClick={afwijzen} disabled={bezig}>Afwijzen</Knop>
          <Knop soort="geel" onClick={() => verder(twijfel)} disabled={bezig || !compleet} title={mist}>Twijfel</Knop>
        </div>
        <Knop soort="donker" onClick={() => verder(naarCheck)} disabled={bezig || !compleet} title={mist}>Ref. en doc. checken →</Knop>
      </div>
      <p className="sv-klein" style={{ marginTop: 8 }}>{mist || "Afwijzen is altijd jouw besluit: een laag cijfer wijst niemand vanzelf af. Twijfel zet de kandidaat op EXTRA check, waar een collega meekijkt."}</p>
    </Kaartje>
  );
}

export function BeoordelingLezenV2({ data }: { data: KaartData }) {
  const b = vanDossier(data.dossier?.beoordeling as BeoordelingV2);
  return (
    <Kaartje titel="Beoordeling interviewer" rechts={[data.dossier?.beoordeeldDoor?.split(" ")[0], kortDatum(data.dossier?.beoordeeldAt), "schaal 1 tot 100"].filter(Boolean).join(" · ")}>
      <div className="sv-cijfers" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>{SCHUIVEN_V2.map((s) => <div key={s.code}><span>{s.naam.toUpperCase()}</span><b>{b[s.code] ?? "Niet beoordeeld"}</b></div>)}</div>
      <p className="sv-lbl" style={{ marginTop: 14 }}>ONDERBOUWING</p>
      <p>{b.onderbouwing || <span className="sv-grijs">Geen onderbouwing ingevuld</span>}</p>
    </Kaartje>
  );
}

// ─── Rechterkolom: weekpatroon en controles ─────────────────────────────────

export function WeekpatroonKaart({ intake }: { intake: IntakeV2 }) {
  const w = weekpatroon(intake);
  const uren = urenTekst(intake);
  const extra = [lbl(PATROON, intake.patroon), intake.lastminute ? `lastminute: ${lbl(LASTMINUTE, intake.lastminute).toLowerCase()}` : "", intake.aankondiging && intake.aankondiging !== "geen_voorkeur" ? `hoort het liefst: ${lbl(AANKONDIGING, intake.aankondiging).toLowerCase()}` : ""].filter(Boolean);
  return (
    <Kaartje titel="Beschikbaarheid" rechts="Gebruikelijk weekpatroon">
      <div className="sv2-week">
        {w.map((d) => (
          <Fragment key={d.dag}>
            <b>{d.dag}</b>
            <i className={d.status} aria-hidden />
            <span className={d.status === "beschikbaar" ? "" : "sv-grijs"}>{d.tekst}</span>
          </Fragment>
        ))}
      </div>
      <dl className="sv-gegevens" style={{ marginTop: 14, borderTop: "1px solid #EEEAE3", paddingTop: 12 }}>
        <dt>Gewenste uren</dt><dd>{uren || "Nog niet bekend"}</dd>
        {intake.startdatum && <><dt>Kan beginnen</dt><dd>{datumInWoorden(intake.startdatum)}</dd></>}
        {extra.length > 0 && <><dt>Patroon</dt><dd>{extra.join(" · ")}</dd></>}
      </dl>
      <p className="sv-klein" style={{ marginTop: 10 }}>Dit is een gewone week, geen toezegging per datum. Actuele datums via de app.{intake.beschikbaarheid_bevestigd_op ? ` Besproken op ${datumInWoorden(intake.beschikbaarheid_bevestigd_op)}.` : ""}</p>
    </Kaartje>
  );
}

export function ControlesKaart({ data }: { data: KaartData }) {
  const k = data.kandidaat;
  const intake = (data.dossier?.intake || {}) as unknown as IntakeV2;
  const ctl = (data.dossier?.controle || {}) as Check;
  const idOk = idInOrde(ctl, k.twvNodig);
  const ref = referentieStatus(ctl);
  const refOpen = ref === "open" ? referentieOpen(intake) : null;
  const refTekst = ref === "positief" ? "Positief" : ref === "negatief" ? "Negatief" : ref === "overgeslagen" ? `Overgeslagen: ${ctl.overslaanReden || "zonder reden"}` : ref === "bezig" ? `Gebeld, ${geenGehoorTeller(ctl)} keer geen gehoor` : refOpen || "Nog te bellen";
  const idTekst = idOk ? `Gezien${ctl.idDoor ? ` door ${ctl.idDoor}` : ""}${ctl.idAt ? `, ${kortDatum(ctl.idAt)}` : ""}` : ctl.idGezien && k.twvNodig ? "ID gezien, verblijfsdocument nog niet" : "Nog te controleren";
  const acties = (intake.acties || []).filter((a) => !a.klaar && a.tekst?.trim());
  const status = inzetStatus(data.stap, data.medewerker?.status);
  const rij = (label: string, ok: boolean, tekst: string, fout = false) => (
    <><dt>{label}</dt><dd className="sv2-ctl"><i className={ok ? "ok" : fout ? "fout" : ""} aria-hidden />{tekst}</dd></>
  );
  return (
    <Kaartje titel="Controles">
      <dl className="sv-gegevens sv2-controles">
        {rij("Identiteit en werkrecht", idOk, `${idTekst}${k.twvNodig ? " · TWV nodig" : intake.werkrecht === "nog_controleren" ? " · werkrecht nog controleren" : ""}`)}
        {rij("Referentie", ref === "positief" || ref === "overgeslagen", refTekst, ref === "negatief")}
        {acties.map((a) => <Fragment key={a.tekst}>{rij("Open punt", false, `${a.tekst}${a.eigenaar ? ` · ${a.eigenaar}` : ""}`)}</Fragment>)}
      </dl>
      <p className="sv2-status"><b>Status: {status.tekst.charAt(0).toLowerCase() + status.tekst.slice(1)}</b></p>
      {status.code !== "inzetbaar" && status.code !== "gestopt" && <p className="sv-klein">Een goed gesprek of afgeronde controles maken iemand nog niet inzetbaar. Dat is pas zo als de medewerker in Medewerkers op actief staat.</p>}
    </Kaartje>
  );
}

// ─── Wat zoekt de kandidaat, en hoe zet je iemand goed in ───────────────────

export function WatZoekt({ intake, voornaam }: { intake: IntakeV2; voornaam: string }) {
  const p = plannerskaart(intake);
  return (
    <Kaartje titel={`Wat zoekt ${voornaam}?`}>
      {p.rijen.length ? <dl className="sv2-zoekt">{p.rijen.map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{r.waarde}</dd></div>)}</dl> : <p className="sv-grijs">Hier is in het gesprek nog niets over vastgelegd.</p>}
      {p.aandacht.map((a) => <p className="sv2-aandacht" key={a}><i aria-hidden />{a}</p>)}
    </Kaartje>
  );
}

/** Voor de planner: hoe je iemand goed inzet, en waar we later op terug kunnen komen. */
export function InzetKaart({ intake, voornaam }: { intake: IntakeV2; voornaam: string }) {
  const p = plannerskaart(intake);
  const later = laterInspelen(intake, voornaam);
  if (!p.doen.length && !p.lieverNiet.length && !p.grenzen.length && !later.length) return null;
  const blok = (titel: string, lijst: string[], klasse: string) => lijst.length > 0 && (
    <div className={`sv2-blok ${klasse}`}><p className="sv-lbl">{titel}</p><ul>{lijst.map((x) => <li key={x}>{x}</li>)}</ul></div>
  );
  return (
    <Kaartje titel={`Zo zet je ${voornaam} goed in`} rechts="Uit de antwoorden van het gesprek">
      <div className="sv2-inzet">
        {blok("DOEN", p.doen, "doen")}
        {blok("LIEVER NIET (VOORKEUR)", p.lieverNiet, "liever")}
        {blok("HARDE GRENS", p.grenzen, "grens")}
      </div>
      {later.length > 0 && <>
        <p className="sv-lbl" style={{ marginTop: 16 }}>LATER OP INSPELEN</p>
        <dl className="sv-gegevens">{later.map((l) => <Fragment key={l.behoefte}><dt>{l.behoefte}</dt><dd style={{ fontWeight: 500 }}>{l.opvolging}</dd></Fragment>)}</dl>
        <p className="sv-klein" style={{ marginTop: 8 }}>Een geheugensteun voor planner en begeleider. Er wordt niets automatisch verstuurd.</p>
      </>}
    </Kaartje>
  );
}

// ─── Intake bekijken: alle antwoorden per hoofdstuk ─────────────────────────

export function IntakeSamenvattingV2({ intake: i, voornaam, kandidaatId }: { intake: IntakeV2; voornaam: string; kandidaatId: number }) {
  const [historie, setHistorie] = useState(false);
  const bron = (veld: string) => (i.bronnen?.[veld] ? ` (uit ${i.bronnen[veld] === "formulier" ? "de aanmelding" : i.bronnen[veld] === "job" ? "Job" : "het cv"}${i.bevestigd?.[veld] === "klopt" ? ", bevestigd" : i.bevestigd?.[veld] === "aangepast" ? ", aangepast in het gesprek" : ""})` : "");
  const lijst = (x: unknown) => (Array.isArray(x) && x.length ? x.join(", ") : "Nog niet bekend");
  const r = i.referentie;
  const delen: [string, [string, ReactNode][]][] = [
    ["Opening", [["Aanleiding", of(i.aanleiding, "Niet genoteerd")]]],
    ["Talen", (i.talen || []).length ? (i.talen || []).map((t) => [t.taal, `${t.niveau ? lbl(TAALNIVEAUS, t.niveau) : "Niveau nog niet vastgesteld"} · ${t.bron === "gesprek" ? "gehoord in het gesprek" : "zegt de kandidaat zelf"}`] as [string, ReactNode]) : [["Talen", "Nog niet bekend"]]],
    ["Ervaring", [
      ["Ervaring in de functie", of(i.ervaring_duur)],
      ["Een normale dienst", of(i.ervaring_dienst, "Niet genoteerd")],
      ...Object.entries(i.taken || {}).filter(([, t]) => t.niveau).map(([naam, t]) => [naam, `${lbl(TAAKNIVEAUS, t.niveau)}${t.voorbeeld ? ` · ${t.voorbeeld}` : ""} · volgens de kandidaat`] as [string, ReactNode]),
      ...(i.ervaring_extra ? [["Aanvullend", i.ervaring_extra] as [string, ReactNode]] : []),
      ...(i.ervaring_extra2 ? [["Aanvullend", i.ervaring_extra2] as [string, ReactNode]] : []),
    ]],
    ["Motivatie", [
      ["Wil uit EXTRA halen", lijst(keuzes(i.prioriteiten, i.prioriteiten_anders))],
      ...(i.prioriteiten_toelichting ? [["Toelichting", i.prioriteiten_toelichting] as [string, ReactNode]] : []),
      ["Let op bij een dienst", lijst(keuzes(i.keuzefactoren, i.keuzefactoren_anders))],
      ["Fijne werkplek", of(i.fijne_plek, "Niet genoteerd")],
      ["Komt graag terug bij", lijst(keuzes(i.binding, i.binding_anders))],
      ["Reden om niet terug te komen", i.niet_terug ? `${i.niet_terug} · ${i.niet_terug_soort === "harde_grens" ? "harde grens" : i.niet_terug_soort === "voorkeur" ? "voorkeur" : "voorkeur of grens niet vastgelegd"}` : "Niet besproken"],
    ]],
    ["Werkvoorkeuren", [
      ["Goede start", lijst(i.start_hulp)],
      ...(i.start_toelichting ? [["Toelichting", i.start_toelichting] as [string, ReactNode]] : []),
      ["Locaties", of(lbl(LOCATIES, i.locaties))],
      ["Samenwerken", of(lbl(SAMENWERKEN, i.samenwerken), "Niet besproken")],
      ["Contact", of([lbl(CONTACT, i.contact), i.kanaal ? KANAAL_ZIN[i.kanaal] : ""].filter(Boolean).join(", "))],
      ["Werkprofiel", `${werkprofielKaart(i).titel}${werkprofielKaart(i).statusLabel ? ` · ${werkprofielKaart(i).statusLabel.toLowerCase()}` : ""}`],
    ]],
    ["Praktische zaken", [
      ["Vervoer", `${lijst(i.vervoer)}${bron("vervoer")}`],
      ["Reistijd", typeof i.reistijd_min === "number" ? `maximaal ${i.reistijd_min} minuten` : "Nog niet bekend"],
      ["Afstand", typeof i.reisafstand_km === "number" ? `tot ${i.reisafstand_km} km${bron("reisafstand_km")}` : "Nog niet bekend"],
      ["Thuiskomen na een late dienst", of(lbl(LAAT_THUIS, i.laat_thuis))],
      ...(i.rijbewijs ? [["Rijbewijs B", i.rijbewijs === "ja" ? "Ja" : "Nee"] as [string, ReactNode]] : []),
      ...(i.voertuig ? [["Eigen auto of scooter", i.voertuig === "ja" ? "Ja" : "Nee"] as [string, ReactNode]] : []),
      ...(i.kleding ? [["Werkkleding", lbl(KLEDING, i.kleding)] as [string, ReactNode]] : []),
      ...((i.certificaten || []).filter((c) => c.naam.trim()).map((c) => ["Certificaat", `${c.naam}${c.geldig_tot ? ` · geldig tot ${datumInWoorden(c.geldig_tot)}` : " · geldigheid onbekend"}`] as [string, ReactNode])),
      ["ID", of(i.id_gezien, "Niet vastgelegd")],
      ["Werkrecht", of(lbl(WERKRECHT, i.werkrecht), "Niet vastgelegd")],
      ...((i.acties || []).filter((a) => a.tekst.trim()).map((a) => [a.klaar ? "Afgerond punt" : "Open punt", `${a.tekst} · ${a.eigenaar}`] as [string, ReactNode])),
    ]],
    ["Beschikbaarheid", [
      ["Gewenste uren", of(urenTekst(i))],
      ...weekpatroon(i).map((d) => [d.dag, d.tekst] as [string, ReactNode]),
      ["Patroon", of(lbl(PATROON, i.patroon))],
      ["Kan beginnen", i.startdatum ? datumInWoorden(i.startdatum) : "Nog niet bekend"],
      ["Hoort het liefst", of(lbl(AANKONDIGING, i.aankondiging), "Niet besproken")],
      ["Lastminute", of(lbl(LASTMINUTE, i.lastminute), "Niet besproken")],
      ["Besproken op", i.beschikbaarheid_bevestigd_op ? datumInWoorden(i.beschikbaarheid_bevestigd_op) : "Niet vastgelegd"],
    ]],
    ["Afronden", [
      ["Samenvatting", i.samenvatting === "klopt" ? "Klopt volgens de kandidaat" : i.samenvatting === "aangepast" ? `Aangepast: ${i.samenvatting_correctie || "zonder toelichting"}` : i.samenvatting === "niet_bevestigd" ? "Nog niet bevestigd" : "Niet voorgelegd"],
      ...(samenvattingRegels(i, voornaam).map((t, n) => [n === 0 ? "Voorgelezen" : "", t] as [string, ReactNode])),
      ["App uitgelegd", lijst(i.app_uitleg)],
      ["Uitbetaling", of(lbl(UITBETALING, i.uitbetaling), "Nog niet besproken")],
      ["EXTRAATJE", of(lbl(EXTRAATJE, i.extraatje), "Nog niet besproken")],
      ["Referentie", !r ? "Niet besproken" : r.geen ? "Geen geschikte referentie" : r.later ? "Levert later aan" : `${[r.naam, r.relatie].filter(Boolean).join(", ") || "Naam niet ingevuld"} · ${r.toestemming === true ? "mag benaderd worden" : r.toestemming === false ? "geen toestemming om te bellen" : "toestemming niet vastgelegd"}`],
      ["Vraag van de kandidaat", of(i.vragen, "Geen")],
      ...(i.notities?.trim() ? [["Notities", i.notities] as [string, ReactNode]] : []),
    ]],
  ];
  return <>
    <p className="sv-klein" style={{ marginBottom: 12 }}>Formulier versie 2. Wat de kandidaat vertelt, wat de interviewer vaststelt en wat gecontroleerd is staan apart. <button className="sv-knop sv-knop-link" onClick={() => setHistorie((x) => !x)}>{historie ? "Historie verbergen" : "Historie van de antwoorden"}</button></p>
    {historie && <Historie kandidaatId={kandidaatId} />}
    {delen.map(([titel, rijen]) => (
      <div key={titel} style={{ marginBottom: 16 }}>
        <p className="sv-lbl">{titel.toUpperCase()}</p>
        <dl className="sv-gegevens">{rijen.map(([a, b], n) => <Fragment key={titel + n}><dt>{a}</dt><dd>{b}</dd></Fragment>)}</dl>
      </div>
    ))}
  </>;
}

interface HistorieRij { id: number; onderdeel: string; vraag: string; waarde: unknown; bron: string; status: string; door: string | null; at: string }
const STATUS_TEKST: Record<string, string> = { overgenomen: "Overgenomen", bevestigd: "Bevestigd", aangepast: "Aangepast", ingevuld: "Ingevuld", gewist: "Gewist" };
function waardeTekst(w: unknown, diep = 0): string {
  if (w === null || w === undefined || w === "") return "leeg";
  if (typeof w === "string" || typeof w === "number") return String(w);
  if (typeof w === "boolean") return w ? "ja" : "nee";
  if (Array.isArray(w)) return w.map((x) => waardeTekst(x, diep + 1)).filter((x) => x !== "leeg").join(diep ? " " : ", ") || "leeg";
  // Een antwoord met onderdelen (referentie, taken, weekpatroon): de ingevulde onderdelen achter elkaar.
  const delen = Object.entries(w as Record<string, unknown>).map(([k, v]) => {
    const t = waardeTekst(v, diep + 1);
    return t === "leeg" ? "" : diep === 0 && typeof v === "object" ? `${k}: ${t}` : typeof v === "boolean" ? `${k} ${t}` : t;
  }).filter(Boolean);
  return delen.join(diep ? " " : ", ") || "leeg";
}
export function Historie({ kandidaatId }: { kandidaatId: number }) {
  const [rijen, setRijen] = useState<HistorieRij[] | null>(null);
  useEffect(() => { api<HistorieRij[]>(`/api/sollicitanten/intake2/${kandidaatId}/historie`).then(setRijen).catch((e) => melding(e.message)); }, [kandidaatId]);
  if (!rijen) return <p className="sv-grijs">Laden...</p>;
  if (!rijen.length) return <p className="sv-grijs" style={{ marginBottom: 12 }}>Nog geen historie.</p>;
  return (
    <div className="sv2-historie">
      {rijen.map((x) => (
        <div key={x.id}>
          <b>{kortDatum(x.at)} {tijdstip(x.at)}</b>
          <span><i>{STATUS_TEKST[x.status] || x.status}{x.bron !== "gesprek" ? ` uit ${x.bron === "formulier" ? "de aanmelding" : x.bron === "job" ? "Job" : x.bron}` : ""}{x.door ? ` door ${x.door}` : ""}:</i> {VRAGEN[x.vraag] || x.vraag} <em>{waardeTekst(x.waarde).slice(0, 160)}</em></span>
        </div>
      ))}
    </div>
  );
}

// ─── Onboarding: naar het medewerkersdossier ────────────────────────────────

export function MedewerkerKaart({ data, bijgewerkt }: { data: KaartData; bijgewerkt: () => void }) {
  const [bezig, setBezig] = useState(false);
  const k = data.kandidaat;
  const m = data.medewerker;
  async function maak() {
    if (bezig) return;
    setBezig(true);
    try {
      const r = await api<{ nieuw: boolean; gekoppeld?: boolean }>(`/api/sollicitanten/medewerker/${k.id}`, { method: "POST" });
      melding(r.nieuw ? `${k.voornaam} staat nu in Medewerkers.` : r.gekoppeld ? "Gekoppeld aan de bestaande medewerker." : `${k.voornaam} stond al in Medewerkers.`);
      bijgewerkt();
    } catch (e: any) { melding(e.message); }
    finally { setBezig(false); }
  }
  return (
    <Kaartje className="sv-besluitkaart">
      <div className="sv-besluit">
        <div>
          <h3>Medewerkersdossier</h3>
          <p className="sv-grijs" style={{ marginTop: 4 }}>{m
            ? `${k.voornaam} staat in Medewerkers (status: ${m.status}). De antwoorden, de beoordeling en de voorkeuren uit het gesprek blijven in dit dossier staan en zijn vanuit het medewerkersdossier te openen.`
            : `Maak ${k.voornaam} aan in Medewerkers. De antwoorden, de beoordeling en de voorkeuren uit het gesprek gaan mee; er wordt niets verstuurd.`}</p>
        </div>
        {m ? <Chip soort="ok">✓ Medewerker aangemaakt</Chip> : <Knop soort="donker" disabled={bezig} onClick={maak}>Medewerker aanmaken</Knop>}
      </div>
    </Kaartje>
  );
}

export const CSS_V2 = `
.sv .sv2-instructie{margin:0 0 14px 18px;padding:0;font-size:13.5px;color:#5C594F;line-height:1.6}
.sv .sv2-schuif{display:grid;grid-template-columns:190px minmax(160px,1fr) 150px;gap:16px;align-items:start;margin-bottom:18px}
.sv .sv2-schuif>b{font-size:15.5px;line-height:1.3;padding-top:2px}
.sv .sv2-schuif input[type=range]{width:100%;accent-color:#37352C;height:24px}
.sv .sv2-schuif input[type=range].leeg{-webkit-appearance:none;appearance:none;height:6px;margin:9px 0;border-radius:99px;background:#E4E0D8;cursor:pointer}
.sv .sv2-schuif input[type=range].leeg::-moz-range-track{background:#E4E0D8;height:6px;border-radius:99px}.sv .sv2-schuif input[type=range].leeg::-moz-range-progress{background:transparent}
.sv .sv2-schuif input[type=range].leeg::-webkit-slider-thumb{opacity:0}.sv .sv2-schuif input[type=range].leeg::-moz-range-thumb{opacity:0}
.sv .sv2-schuif small{display:block;color:#6B665C;font-size:12.5px;margin-top:2px}
.sv .sv2-cijfer{display:flex;align-items:center;gap:8px;justify-content:flex-end}
.sv .sv2-cijfer input{width:64px;height:40px;border:1px solid #DDD8CE;border-radius:10px;font:inherit;font-size:19px;font-weight:800;text-align:center;color:#37352C;background:#fff}
.sv .sv2-cijfer em{font-style:normal;font-size:12px;color:#8A8478;width:64px;line-height:1.2}
.sv .sv2-cijfer button{border:0;background:none;font:inherit;font-size:12px;color:#6B665C;text-decoration:underline;cursor:pointer;width:64px;text-align:left;padding:0}
.sv .sv2-week{display:grid;grid-template-columns:44px 22px 1fr;gap:9px 8px;align-items:center;font-size:15px}
.sv .sv2-week i{width:11px;height:11px;border-radius:50%;display:inline-block;border:1.5px solid #A39E94}
.sv .sv2-week i.beschikbaar{background:#3F7A34;border-color:#3F7A34}
.sv .sv2-week i.niet{border:0;border-radius:0;height:2px;width:10px;background:#5C594F}
.sv .sv2-controles{grid-template-columns:minmax(120px,auto) 1fr}
.sv .sv2-ctl{display:flex;align-items:baseline;gap:8px;font-weight:500!important}
.sv .sv2-ctl i{width:10px;height:10px;border-radius:50%;border:1.5px solid #A39E94;display:inline-block;flex:none}
.sv .sv2-ctl i.ok{background:#3F7A34;border-color:#3F7A34}.sv .sv2-ctl i.fout{background:#A2321F;border-color:#A2321F}
.sv .sv2-status{border-top:1px solid #EEEAE3;margin-top:14px;padding-top:12px;font-size:15px}
.sv .sv2-zoekt{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:10px 28px;margin:0}
.sv .sv2-zoekt div{display:grid;grid-template-columns:170px 1fr;gap:10px;font-size:14px}
.sv .sv2-zoekt dt{color:#8A8478}.sv .sv2-zoekt dd{margin:0;font-weight:600}
.sv .sv2-aandacht{display:flex;align-items:center;gap:10px;background:#FFF6D6;border-radius:10px;padding:10px 14px;margin:12px 0 0;font-weight:600}
.sv .sv2-aandacht i{width:10px;height:10px;border-radius:50%;background:#E3B23C;flex:none}
.sv .sv2-inzet{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.sv .sv2-blok{border-radius:12px;padding:12px 14px;background:#F8F7F4}
.sv .sv2-blok ul{margin:6px 0 0 16px;padding:0;font-size:14px;line-height:1.55}
.sv .sv2-blok.doen{background:#EEF3E8}.sv .sv2-blok.liever{background:#FFF6D6}.sv .sv2-blok.grens{background:#FBE3DE}
.sv .sv2-historie{max-height:300px;overflow:auto;border:1px solid #EEEAE3;border-radius:12px;padding:8px 12px;margin-bottom:16px;font-size:13px}
.sv .sv2-historie div{display:grid;grid-template-columns:96px 1fr;gap:10px;padding:5px 0;border-bottom:1px solid #F4F1EC}
.sv .sv2-historie i{font-style:normal;color:#6B665C}.sv .sv2-historie em{font-style:normal;font-weight:700}
.sv .sv2-links{display:flex;gap:22px;margin-top:16px;flex-wrap:wrap}
@media (max-width:700px){.sv .sv2-schuif{grid-template-columns:1fr}.sv .sv2-cijfer{justify-content:flex-start}.sv .sv2-zoekt div{grid-template-columns:1fr;gap:2px}}
`;
