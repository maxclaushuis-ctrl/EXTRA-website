/**
 * Sollicitanten, Onboarding en Archief (stappen D1 tot en met D10).
 * Eén component met drie ingangen uit het menu; de navigatie binnen de schermen
 * loopt via de staat hier, zodat het menu en de rest van het dashboard gelijk blijven.
 *
 * Schakelaar: SOLLICITANTEN_V2=1 of TESTOMGEVING=1 (zie server/sollicitanten).
 */
import { Fragment, useEffect, useMemo, useState } from "react";
import { BRANCHE } from "@shared/sollicitantRegels";
import { Gesprekken, Stappenlijst, weekLabel, type Lijst } from "./Overzicht";
import { SollicitantKaart } from "./Kaart";
import { IntakeStart } from "./IntakeV2";
import { CSS_V2 } from "./KaartV2";
import { AfwijzenDialoog } from "./Afwijzen";
import { CSS, Knop, Leeg, Meldingen, api, kortDatum, melding, useData } from "./gedeeld";

export type Ingang = "sollicitanten" | "onboarding" | "archief";
type Scherm =
  | { soort: "lijst"; lijst: Lijst }
  | { soort: "onboarding" }
  | { soort: "archief" }
  | { soort: "kaart"; id: number; van: Scherm }
  | { soort: "intake"; id: number; van: Scherm };

/**
 * Staat Sollicitanten 3.0 aan? Vraagt het pas op als iemand als admin is
 * ingelogd, en opnieuw na elke (her)login: vóór het inloggen antwoordt de
 * server met 401 en zou de schakelaar anders op "uit" blijven staan.
 */
export function useSollicitantenV2(ingelogdAlsAdmin: boolean): boolean | null {
  const [aan, setAan] = useState<boolean | null>(null);
  useEffect(() => {
    if (!ingelogdAlsAdmin) { setAan(null); return; }
    let weg = false;
    api<{ aan: boolean }>("/api/sollicitanten/status").then((s) => { if (!weg) setAan(!!s.aan); }).catch(() => { if (!weg) setAan(false); });
    return () => { weg = true; };
  }, [ingelogdAlsAdmin]);
  return aan;
}

function terugLabel(s: Scherm, van: string): string {
  if (s.soort === "onboarding") return "Onboarding";
  if (s.soort === "archief") return "Archief";
  if (s.soort === "lijst") {
    if (s.lijst === "gesprekken") return van ? `Sollicitanten · week ${weekLabel(van)}` : "Sollicitanten · deze week";
    if (s.lijst === "beoordelen") return "Beoordelen";
    if (s.lijst === "extra") return "Sollicitanten · Ref. en doc. check · EXTRA check";
    return "Ref. en doc. check";
  }
  return "Terug";
}

export function SollicitantenV2({ ingang, oudeWeergave }: { ingang: Ingang; oudeWeergave?: { tekst: string; doe: () => void } }) {
  const start: Scherm = ingang === "onboarding" ? { soort: "onboarding" } : ingang === "archief" ? { soort: "archief" } : { soort: "lijst", lijst: "gesprekken" };
  const [scherm, setScherm] = useState<Scherm>(start);
  const [weekVan, setWeekVan] = useState("");
  useEffect(() => { setScherm(start); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ingang]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [scherm]);

  const open = (id: number) => setScherm((s) => ({ soort: "kaart", id, van: s.soort === "kaart" || s.soort === "intake" ? s.van : s }));
  const kies = (l: Lijst) => setScherm({ soort: "lijst", lijst: l });

  let inhoud: JSX.Element;
  if (scherm.soort === "lijst") {
    inhoud = scherm.lijst === "gesprekken"
      ? <Gesprekken open={open} kies={kies} van={weekVan} zetVan={setWeekVan} />
      : <Stappenlijst key={scherm.lijst} lijst={scherm.lijst} open={open} kies={kies} />;
  } else if (scherm.soort === "onboarding") {
    inhoud = <OnboardingLijst open={open} />;
  } else if (scherm.soort === "archief") {
    inhoud = <ArchiefLijst open={open} />;
  } else if (scherm.soort === "kaart") {
    const s = scherm;
    inhoud = (
      <SollicitantKaart key={s.id} id={s.id} terug={{ label: terugLabel(s.van, weekVan), doe: () => setScherm(s.van) }}
        naarLijst={(l) => setScherm(l === "onboarding" ? { soort: "onboarding" } : l === "archief" ? { soort: "archief" } : { soort: "lijst", lijst: l })}
        startIntake={() => setScherm({ soort: "intake", id: s.id, van: s.van })} />
    );
  } else {
    const s = scherm;
    inhoud = <IntakeStart id={s.id} sluit={() => setScherm({ soort: "kaart", id: s.id, van: s.van })} klaar={() => setScherm({ soort: "kaart", id: s.id, van: s.van })} />;
  }
  return (
    <div className="sv" style={{ borderRadius: 18, minHeight: "calc(100vh - 120px)" }}>
      <style>{CSS}{CSS_V2}</style>
      {inhoud}
      {oudeWeergave && ((scherm.soort === "lijst" && scherm.lijst === "gesprekken") || scherm.soort === "onboarding") && (
        <p className="sv-klein" style={{ padding: "0 40px 24px", background: "#F8F7F4" }}>{oudeWeergave.tekst} <button className="sv-knop sv-knop-link" onClick={oudeWeergave.doe}>Open de oude weergave</button>.</p>
      )}
      <Meldingen />
    </div>
  );
}

// ─── Onboarding (J) en Archief (J2) ─────────────────────────────────────────

interface OnboardingRij { id: number; naam: string; functie: string; branche: keyof typeof BRANCHE; geaccepteerd: string; interviewer: string; medewerkerId?: number | null }
interface ArchiefRij { id: number; naam: string; voornaam: string; functie: string; branche: keyof typeof BRANCHE; gestoptIn: string; terugNaar: string; reden: string; datum: string; door: string; bewaardTot: string }

function useZoeken<T extends { naam: string }>(rijen: T[] | null, datum: (r: T) => string) {
  const [zoek, setZoek] = useState("");
  const [oudst, setOudst] = useState(false);
  const [pagina, setPagina] = useState(0);
  const lijst = useMemo(() => {
    let r = (rijen || []).filter((x) => x.naam.toLowerCase().includes(zoek.trim().toLowerCase()));
    r = [...r].sort((a, b) => (new Date(datum(b)).getTime() - new Date(datum(a)).getTime()) * (oudst ? -1 : 1));
    return r;
  }, [rijen, zoek, oudst, datum]);
  return { zoek, setZoek: (z: string) => { setZoek(z); setPagina(0); }, oudst, setOudst, pagina, setPagina, lijst, zichtbaar: lijst.slice(pagina * 10, pagina * 10 + 10) };
}

function Kop({ titel, uitleg, z }: { titel: string; uitleg: string; z: { zoek: string; setZoek: (s: string) => void; oudst: boolean; setOudst: (f: (b: boolean) => boolean) => void } }) {
  return <>
    <div className="sv-tussen">
      <h1>{titel}</h1>
      <div className="sv-rij">
        <input type="search" placeholder="⌕ Zoek op naam" value={z.zoek} onChange={(e) => z.setZoek(e.target.value)} style={{ width: 200, height: 40 }} aria-label="Zoek op naam" />
        <button className="sv-knop" onClick={() => z.setOudst((o) => !o)}>{z.oudst ? "Oudste eerst ▾" : "Nieuwste eerst ▾"}</button>
      </div>
    </div>
    <p className="sv-sub" style={{ margin: "4px 0 18px" }}>{uitleg}</p>
  </>;
}

function Voet({ z }: { z: { lijst: unknown[]; pagina: number; setPagina: (f: (p: number) => number) => void } }) {
  if (!z.lijst.length) return null;
  return (
    <div className="sv-voet">
      <span>{z.pagina * 10 + 1} tot {Math.min(z.lijst.length, z.pagina * 10 + 10)} van {z.lijst.length}</span>
      <span className="sv-rij">
        {z.pagina > 0 && <button className="sv-knop sv-knop-link" onClick={() => z.setPagina((p) => p - 1)}>‹ Vorige</button>}
        {(z.pagina + 1) * 10 < z.lijst.length && <button className="sv-knop sv-knop-link" onClick={() => z.setPagina((p) => p + 1)}>Volgende ›</button>}
      </span>
    </div>
  );
}

function OnboardingLijst({ open }: { open: (id: number) => void }) {
  const { data, fout } = useData<OnboardingRij[]>("/api/sollicitanten/onboarding");
  const z = useZoeken(data, (r) => r.geaccepteerd);
  return (
    <div className="sv-lijst">
      <Kop titel="Onboarding" uitleg="Iedereen die door de procedure is gekomen." z={z} />
      {fout && <div className="sv-fout">{fout}</div>}
      <table className="sv-tabel">
        <thead><tr><th>Naam</th><th>Functie</th><th>Branche</th><th>Geaccepteerd</th><th>Interviewer</th><th>In Medewerkers</th><th aria-label="Openen" /></tr></thead>
        <tbody>{z.zichtbaar.map((r) => (
          <tr key={r.id} className="klik" tabIndex={0} onClick={() => open(r.id)} onKeyDown={(e) => { if (e.key === "Enter") open(r.id); }}>
            <td><b>{r.naam}</b></td><td>{r.functie}</td><td>{BRANCHE[r.branche].label}</td><td className="sv-grijs">{kortDatum(r.geaccepteerd)}</td><td className="sv-grijs">{r.interviewer}</td><td className="sv-grijs">{r.medewerkerId ? "✓ Aangemaakt" : "Nog niet"}</td><td className="sv-grijs" style={{ textAlign: "right" }}>›</td>
          </tr>
        ))}</tbody>
      </table>
      {data && !z.lijst.length && <Leeg>Nog niemand in Onboarding.</Leeg>}
      <Voet z={z} />
    </div>
  );
}

function ArchiefLijst({ open }: { open: (id: number) => void }) {
  const { data, fout, opnieuw } = useData<ArchiefRij[]>("/api/sollicitanten/archief");
  const z = useZoeken(data, (r) => r.datum);
  const [vraag, setVraag] = useState<number | null>(null);
  const [bezig, setBezig] = useState(false);
  async function terug(r: ArchiefRij) {
    setBezig(true);
    try {
      await api(`/api/sollicitanten/actie/${r.id}`, { method: "POST", body: { actie: "terugzetten" } });
      melding(`${r.voornaam} staat weer op ${r.terugNaar}.`);
      setVraag(null); opnieuw();
    } catch (e: any) { melding(e.message); }
    finally { setBezig(false); }
  }
  return (
    <div className="sv-lijst">
      <Kop titel="Archief" uitleg="Iedereen die is afgevallen of afgewezen, met de stap en de reden. Verkeerd gegaan? Zet iemand terug naar de stap waar die stond. Gegevens blijven 6 maanden bewaard." z={z} />
      {fout && <div className="sv-fout">{fout}</div>}
      <div style={{ overflowX: "auto" }}>
        <table className="sv-tabel sv-archief">
          <thead><tr><th>Naam</th><th>Functie</th><th>Branche</th><th>Gestopt in</th><th>Reden</th><th>Datum</th><th>Door</th><th>Bewaard tot</th><th aria-label="Terugzetten" /></tr></thead>
          <tbody>{z.zichtbaar.map((r) => (
            <Fragment key={r.id}>
              <tr className="klik" onClick={() => open(r.id)}>
                <td className="breek"><b>{r.naam}</b></td><td className="breek">{r.functie}</td><td>{BRANCHE[r.branche].label}</td><td className="breek">{r.gestoptIn}</td><td className="breek">{r.reden}</td>
                <td className="sv-grijs">{kortDatum(r.datum)}</td><td className="sv-grijs">{r.door.split(" ")[0]}</td><td className="sv-grijs">{kortDatum(r.bewaardTot)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <Knop soort={vraag === r.id ? "donker" : "wit"} style={{ height: 32, padding: "0 12px" }} onClick={() => setVraag(vraag === r.id ? null : r.id)}>↺ Terugzetten</Knop>
                </td>
              </tr>
              {vraag === r.id && (
                <tr><td colSpan={9} style={{ height: "auto", padding: 12, background: "#F8F7F4" }}>
                  <div className="sv-kaart" style={{ borderRadius: 14, whiteSpace: "normal" }}>
                    <b>{r.voornaam} terugzetten?</b>
                    <p style={{ margin: "6px 0 12px" }}>{r.voornaam} gaat terug naar <b>{r.terugNaar}</b>, waar die stond. Alles wat al was ingevuld blijft staan. Wordt vastgelegd met jouw naam en het tijdstip.</p>
                    <div className="sv-rij">
                      <Knop onClick={() => { setVraag(null); melding("Geannuleerd. Er is niets veranderd."); }}>Annuleren</Knop>
                      <Knop soort="donker" disabled={bezig} onClick={() => terug(r)}>Terugzetten</Knop>
                    </div>
                  </div>
                </td></tr>
              )}
            </Fragment>
          ))}</tbody>
        </table>
      </div>
      {data && !z.lijst.length && <Leeg>Het archief is leeg.</Leeg>}
      <Voet z={z} />
    </div>
  );
}

// ─── Afwijzen vanuit Kandidaten (D10) ───────────────────────────────────────

export function KandidaatAfwijzen({ id, voornaam, achternaam, status, klaar }: { id: number; voornaam: string; achternaam: string; status: string; klaar: () => void }) {
  const [open, setOpen] = useState(false);
  if (status === "afgewezen" || status === "aangenomen") return null;
  return (
    <div className="sv" style={{ marginTop: 12 }}>
      <style>{CSS}</style>
      <div className="sv-rij" style={{ justifyContent: "flex-end" }}>
        <Knop onClick={() => setOpen(true)}>Afwijzen met reden en mail</Knop>
      </div>
      {open && (
        <AfwijzenDialoog id={id} naam={`${voornaam} ${achternaam}`.trim()} voornaam={voornaam} stap="kandidaten"
          sluit={() => setOpen(false)}
          klaar={(r) => { setOpen(false); melding(`Afgewezen: ${voornaam} staat in het archief.${r.verstuurd ? " De mail is verstuurd." : ""}`); klaar(); }} />
      )}
      <Meldingen />
    </div>
  );
}
