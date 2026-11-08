/**
 * Kandidaten 3.0 (borden G en H): het overzicht met bolletjes per toestand en
 * het dossier met aandachtspunt, profiel, contact, tijdlijn en het gesprek met
 * Job. Schakelaar KANDIDATEN_V2 (in de testomgeving vanzelf aan).
 * Afwijzen gebruikt de dialoog en de route van Sollicitanten.
 */
import { Fragment, useEffect, useMemo, useState } from "react";
import { BRANCHE, BRANCHES, type Branche } from "@shared/sollicitantRegels";
import { KLEUREN, KLEUR_VOLGORDE, type Kleur } from "@shared/kandidaatRegels";
import { AfwijzenDialoog } from "../sollicitanten/Afwijzen";
import { CSS, Dialoog, Knop, Leeg, Meldingen, api, kortDatum, melding, tijdstip, useData } from "../sollicitanten/gedeeld";

interface Rij {
  id: number; naam: string; functie: string; functieCode: string; branche: Branche; kleur: Kleur; cijfer: string | null;
  status: string; sinds: string; sindsTekst: string; planner: string; plannerId: number | null; mijn: boolean; aangemeld: string;
}
interface Overzicht { rijen: Rij[]; tellers: { perKleur: Record<Kleur, number>; perBranche: Record<string, number>; aandacht: number }; planners: { id: number; naam: string }[] }
interface Filter { kleuren: Kleur[]; functie: string; planner: string; datum: string }
const STANDAARD: Filter = { kleuren: ["geel", "rood"], functie: "", planner: "", datum: "" };
const SLEUTEL = "extra-kandidaten-filter";

function leesFilter(): Filter {
  try { const f = JSON.parse(localStorage.getItem(SLEUTEL) || "null"); if (f && Array.isArray(f.kleuren)) return { ...STANDAARD, ...f }; } catch { /* geen opslag */ }
  return STANDAARD;
}

function Stip({ kleur, cijfer, maat = 20 }: { kleur: Kleur; cijfer?: string | null; maat?: number }) {
  return (
    <span aria-label={KLEUREN[kleur].label} title={KLEUREN[kleur].label} style={{ width: maat, height: maat, borderRadius: "50%", background: KLEUREN[kleur].kleur, color: kleur === "geel" ? "#5A4A00" : "#fff", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{cijfer || ""}</span>
  );
}

const FUNCTIE_OPTIES = [["horecamedewerker", "Bediening en bar"], ["bediening", "Bediening en bar (nieuw formulier)"], ["chef", "Keuken"], ["keuken", "Keuken (nieuw formulier)"], ["afwas", "Afwas"], ["housekeeping", "Housekeeping"], ["frontoffice", "Front office"], ["logistiek", "Logistiek"]];

export function KandidatenV2({ naarArchief, naarWhatsapp, oudeWeergave }: { naarArchief: () => void; naarWhatsapp: () => void; oudeWeergave: () => void }) {
  const { data, fout, opnieuw } = useData<Overzicht>("/api/admin/kandidaten/overzicht");
  const [branche, setBranche] = useState<Branche | "alle">("alle");
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState<Filter>(leesFilter);
  const [concept, setConcept] = useState<Filter | null>(null);
  const [open, setOpen] = useState<number | null>(() => { try { const id = Number(new URLSearchParams(window.location.search).get("kandidaat")); return id > 0 ? id : null; } catch { return null; } });

  useEffect(() => { try { localStorage.setItem(SLEUTEL, JSON.stringify(filter)); } catch { /* geen opslag */ } }, [filter]);

  const pas = (f: Filter, rijen: Rij[]) => {
    const nu = Date.now();
    return rijen.filter((r) => (branche === "alle" || r.branche === branche)
      && (!f.kleuren.length || f.kleuren.includes(r.kleur))
      && (!f.functie || r.functieCode === f.functie)
      && (!f.planner || (f.planner === "geen" ? !r.plannerId : f.planner === "mij" ? r.mijn : String(r.plannerId) === f.planner))
      && (!f.datum || nu - new Date(r.aangemeld).getTime() <= Number(f.datum) * 86400000)
      && (!zoek.trim() || [r.naam].some((x) => x.toLowerCase().includes(zoek.trim().toLowerCase()))));
  };
  const lijst = useMemo(() => (data ? pas(filter, data.rijen) : []), [data, filter, branche, zoek]); // eslint-disable-line react-hooks/exhaustive-deps

  if (open) {
    const ids = lijst.map((r) => r.id);
    return (
      <div className="sv" style={{ borderRadius: 18, overflow: "hidden" }}>
        <style>{CSS}{KCSS}</style>
        <Dossier id={open} ids={ids.includes(open) ? ids : [open, ...ids]} context={`${branche === "alle" ? "Alle" : BRANCHE[branche].label}${filter.kleuren.length ? ` · ${filter.kleuren.map((k) => KLEUREN[k].label.toLowerCase()).join(", ")}` : ""}`}
          naar={(id) => setOpen(id)} terug={() => { setOpen(null); opnieuw(); }} naarWhatsapp={naarWhatsapp} />
        <Meldingen />
      </div>
    );
  }

  const telBranche = (b: Branche | "alle") => (data ? (b === "alle" ? data.tellers.perBranche.alle : data.tellers.perBranche[b]) : 0);
  const conceptN = concept && data ? pas(concept, data.rijen).length : 0;
  return (
    <div className="sv" style={{ borderRadius: 18, overflow: "hidden" }}>
      <style>{CSS}{KCSS}</style>
      <div className="sv-lijst">
        <div className="sv-tussen">
          <div>
            <h1>Kandidaten</h1>
            <p className="sv-sub">{data ? `${data.tellers.aandacht} ${data.tellers.aandacht === 1 ? "kandidaat vraagt" : "kandidaten vragen"} je aandacht` : "Laden..."}</p>
          </div>
        </div>
        <div className="sv-tabs" style={{ marginTop: 18 }}>
          {(["alle", ...BRANCHES] as const).map((b) => (
            <button key={b} className={`tab ${branche === b ? "aan" : ""}`} onClick={() => setBranche(b)}>{b === "alle" ? "Alle" : BRANCHE[b].label} <span className="sv-grijs" style={{ fontSize: 13 }}>{telBranche(b)}</span></button>
          ))}
          <span style={{ flex: 1 }} />
          <input type="search" placeholder="Zoek kandidaat" value={zoek} onChange={(e) => setZoek(e.target.value)} style={{ width: 240, height: 40 }} aria-label="Zoek kandidaat" />
          <div style={{ position: "relative" }}>
            <button className="sv-knop" style={concept ? { borderColor: "#37352C" } : undefined} onClick={() => setConcept(concept ? null : filter)} aria-expanded={!!concept}>Filter{filter.kleuren.length || filter.functie || filter.planner || filter.datum ? " ●" : ""}</button>
            {concept && data && (
              <div className="k-filter" role="dialog" aria-label="Filter">
                <p className="sv-lbl">STATUS</p>
                {KLEUR_VOLGORDE.map((k) => (
                  <label key={k} className="k-filterrij">
                    <input type="checkbox" checked={concept.kleuren.includes(k)} onChange={(e) => setConcept({ ...concept, kleuren: e.target.checked ? [...concept.kleuren, k] : concept.kleuren.filter((x) => x !== k) })} />
                    <Stip kleur={k} cijfer={KLEUREN[k].cijfer} maat={14} /><span style={{ flex: 1 }}>{KLEUREN[k].label}</span><span className="sv-grijs">{data.tellers.perKleur[k] || 0}</span>
                  </label>
                ))}
                <label className="sv-veld" style={{ marginTop: 10 }}><span>Functie</span>
                  <select value={concept.functie} onChange={(e) => setConcept({ ...concept, functie: e.target.value })}><option value="">Alle</option>{FUNCTIE_OPTIES.map(([w, l]) => <option key={w} value={w}>{l}</option>)}</select></label>
                <label className="sv-veld"><span>Planner</span>
                  <select value={concept.planner} onChange={(e) => setConcept({ ...concept, planner: e.target.value })}><option value="">Alle</option><option value="geen">Niet toegewezen</option><option value="mij">Mij</option>{data.planners.map((p) => <option key={p.id} value={String(p.id)}>{p.naam}</option>)}</select></label>
                <label className="sv-veld"><span>Aanmelddatum</span>
                  <select value={concept.datum} onChange={(e) => setConcept({ ...concept, datum: e.target.value })}><option value="">Alle</option><option value="1">Vandaag</option><option value="7">Laatste 7 dagen</option><option value="30">Laatste 30 dagen</option></select></label>
                <div className="sv-tussen" style={{ alignItems: "center", marginTop: 6 }}>
                  <button className="sv-knop sv-knop-link" onClick={() => setConcept({ kleuren: [], functie: "", planner: "", datum: "" })}>Wis filters</button>
                  <Knop soort="donker" style={{ height: 36 }} onClick={() => { setFilter(concept); setConcept(null); }}>Toon {conceptN} kandidaten</Knop>
                </div>
              </div>
            )}
          </div>
          <button className="sv-knop" onClick={naarArchief}>Archief</button>
        </div>
        <div className="sv-legenda">{KLEUR_VOLGORDE.map((k) => <span key={k}><Stip kleur={k} cijfer={KLEUREN[k].cijfer} maat={14} />{KLEUREN[k].label}</span>)}</div>
        {fout && <div className="sv-fout">Laden mislukt. Probeer het opnieuw. <button className="sv-knop sv-knop-link" onClick={opnieuw}>Opnieuw</button></div>}
        <table className="sv-tabel">
          <thead><tr><th>Kandidaat</th><th>Status</th><th className="k-breed">Sinds</th><th className="k-breed">Planner</th><th aria-label="Openen" style={{ width: 30 }} /></tr></thead>
          <tbody>{lijst.map((r) => (
            <tr key={r.id} className="klik" tabIndex={0} onClick={() => setOpen(r.id)} onKeyDown={(e) => { if (e.key === "Enter") setOpen(r.id); }}>
              <td><div className="sv-rij" style={{ flexWrap: "nowrap" }}><Stip kleur={r.kleur} cijfer={r.cijfer} /><div><b style={{ fontSize: 15 }}>{r.naam}</b><div className="sv-klein">{r.functie}</div></div></div></td>
              <td style={{ whiteSpace: "normal" }}>{r.status}<div className="k-smal sv-klein">{r.sindsTekst} · {r.planner}</div></td>
              <td className="k-breed sv-grijs">{r.sindsTekst}</td>
              <td className="k-breed" style={{ color: r.plannerId ? undefined : "#8A8478" }}>{r.planner}</td>
              <td style={{ color: "#B3AEA3" }}>›</td>
            </tr>
          ))}</tbody>
        </table>
        {data && !lijst.length && (
          <Leeg>{zoek ? `Geen kandidaat gevonden voor '${zoek}'.` : filter.kleuren.join() === "geel,rood" || filter.kleuren.join() === "rood,geel"
            ? <>Niemand vraagt nu je aandacht. <button className="sv-knop sv-knop-link" onClick={() => setFilter({ ...filter, kleuren: [] })}>Toon alle lopende kandidaten</button></>
            : branche !== "alle" ? `Geen lopende kandidaten in ${BRANCHE[branche].label}.` : "Geen kandidaten met dit filter."}</Leeg>
        )}
        <p className="sv-klein" style={{ marginTop: 16 }}>Wie een gesprek heeft gepland, staat bij Sollicitanten. Het oude overzicht staat er nog: <button className="sv-knop sv-knop-link" onClick={oudeWeergave}>open de oude weergave</button>.</p>
      </div>
      <Meldingen />
    </div>
  );
}

// ─── Dossier (bord H) ───────────────────────────────────────────────────────

interface DossierData {
  id: number; voornaam: string; naam: string; status: string; functie: string; branche: Branche; leeftijd: number | null; plaats: string | null; aangemeld: string; bron: string | null;
  bolletje: { kleur: Kleur; cijfer: string | null; tekst: string; reden: string; sinds: string; sindsTekst: string; gele: { reden: string; tekst: string; titel: string; actie: string }[] };
  planner: { id: number; label: string } | null;
  matches: { id: number; soort: string; matchId: number; redenen: string[]; naam: string; wanneer: string | null; stand: string }[];
  profiel: { ervaring: string | null; diensten: string | null; werkgebied: string | null; nationaliteit: string | null; talen: string | null; werkautorisatie: string | null; cv: string | null; uitJob: boolean };
  contact: { telefoon: string | null; whatsapp: string | null; email: string | null; postcode: string | null; woonland: string | null; whatsappStatus: string; toestemmingOp: string | null; gesprekstaal: string | null };
  job: null | { status: string; kanaal: string; token: string; gestart: string; berichten: { richting: string; tekst: string; at: string; bijlage: boolean }[] };
  tijdlijn: { at: string; tekst: string; notitie: boolean }[];
}

const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
function wanneer(x: string): string {
  const d = new Date(x), nu = new Date();
  const dag = d.toDateString() === nu.toDateString() ? "vandaag" : new Date(nu.getTime() - 86400000).toDateString() === d.toDateString() ? "gisteren" : kortDatum(x);
  return `${dag} ${tijdstip(x)}`;
}

function Dossier({ id, ids, context, naar, terug, naarWhatsapp }: { id: number; ids: number[]; context: string; naar: (id: number) => void; terug: () => void; naarWhatsapp: () => void }) {
  const { data: d, fout, opnieuw } = useData<DossierData>(`/api/admin/kandidaten/dossier/${id}`);
  const [afwijzen, setAfwijzen] = useState(false);
  const [geenCv, setGeenCv] = useState(false);
  const [inplannen, setInplannen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [uit, setUit] = useState<Record<string, boolean>>({});
  const [notitie, setNotitie] = useState("");
  const i = ids.indexOf(id);
  const volgende = () => { const n = ids.filter((x) => x !== id); if (n.length) naar(n[Math.min(i, n.length - 1)]); else terug(); };

  useEffect(() => {
    try { const u = new URL(window.location.href); u.searchParams.set("tab", "kandidaten"); u.searchParams.set("kandidaat", String(id)); window.history.replaceState(null, "", u.toString()); } catch { /* geen URL */ }
    return () => { try { const u = new URL(window.location.href); u.searchParams.delete("kandidaat"); window.history.replaceState(null, "", u.toString()); } catch { /* geen URL */ } };
  }, [id]);

  if (fout) return <div className="sv-dossier"><button className="sv-terug" onClick={terug}>← Kandidaten</button><div className="sv-fout">{fout}</div></div>;
  if (!d) return <div className="sv-dossier"><p className="sv-grijs">Laden...</p></div>;

  async function post(pad: string, body: unknown = {}) {
    setBezig(true);
    try { return await api<any>(`/api/admin/kandidaten/${pad}`, { method: "POST", body }); }
    finally { setBezig(false); }
  }
  async function accepteer(zonderCv = false) {
    try {
      const r = await post(`${id}/accepteren`, { zonderCv });
      melding(`Uitgenodigd: ${d!.voornaam} krijgt ${r.mail ? "een mail met een afspraakknop" : "geen mail (geen e-mailadres)"}.`);
      volgende();
    } catch (e: any) {
      if (/geen cv/i.test(e.message)) setGeenCv(true); else melding(e.message);
    }
  }
  const geel = d.bolletje.kleur === "geel" || d.bolletje.kleur === "rood";
  const eerste = d.bolletje.gele[0];
  const besluit = (
    <div className="sv-rij">
      <Knop onClick={() => setAfwijzen(true)} disabled={bezig} style={{ height: 44 }}>Afwijzen</Knop>
      <Knop soort="groen" onClick={() => accepteer()} disabled={bezig || d.matches.length > 0 || d.status !== "in_behandeling"} style={{ height: 44 }} title={d.matches.length ? "Beoordeel eerst het mogelijke dubbele dossier" : ""}>{d.status === "in_behandeling" ? "Accepteren" : "Uitgenodigd"}</Knop>
    </div>
  );
  const webLink = d.job ? `/job-gesprek?token=${encodeURIComponent(d.job.token)}` : null;

  return (
    <div className="sv-dossier" style={{ background: "#F8F7F4" }}>
      <div className="sv-tussen" style={{ alignItems: "center", marginBottom: 14 }}>
        <button className="sv-terug" style={{ margin: 0 }} onClick={terug}>← Kandidaten <span className="sv-grijs">· {context}</span></button>
        {ids.length > 1 && <div className="sv-rij">
          <button className="sv-knop" disabled={i <= 0} onClick={() => naar(ids[i - 1])}>‹ Vorige</button>
          <span className="sv-grijs">{i + 1} van {ids.length}</span>
          <button className="sv-knop" disabled={i < 0 || i >= ids.length - 1} onClick={() => naar(ids[i + 1])}>Volgende ›</button>
        </div>}
      </div>

      <div className="sv-tussen" style={{ borderBottom: "1px solid #E4E0D8", paddingBottom: 16 }}>
        <div>
          <div className="sv-rij" style={{ flexWrap: "nowrap" }}><Stip kleur={d.bolletje.kleur} cijfer={d.bolletje.cijfer} maat={22} /><h1 style={{ fontSize: 30 }}>{d.naam}</h1></div>
          <p className="sv-sub" style={{ fontSize: 14.5 }}>{[d.functie, BRANCHE[d.branche].label !== d.functie ? BRANCHE[d.branche].label : null, d.leeftijd !== null ? `${d.leeftijd} jaar` : null, d.plaats, `aangemeld ${wanneer(d.aangemeld)}${d.bron ? ` via ${d.bron}` : ""}`].filter(Boolean).join(" · ")}</p>
          {!geel && <p style={{ marginTop: 6 }}>{d.bolletje.tekst} <span className="sv-grijs">· {d.bolletje.sindsTekst}</span></p>}
        </div>
        <div style={{ textAlign: "right", fontSize: 13 }}>
          <div>Planner: {d.planner ? d.planner.label : "niet toegewezen"}</div>
          <button className="sv-knop sv-knop-link" onClick={() => post(`${id}/planner`, {}).then(opnieuw).catch((e) => melding(e.message))}>aan mij toewijzen</button>
          {d.planner && <> · <button className="sv-knop sv-knop-link" onClick={() => post(`${id}/planner`, { loslaten: true }).then(opnieuw).catch((e) => melding(e.message))}>loslaten</button></>}
          {!geel && <div style={{ marginTop: 10 }}>{besluit}</div>}
        </div>
      </div>

      {geel && eerste && (
        <div className={`k-aandacht ${d.bolletje.kleur === "rood" ? "rood" : ""}`}>
          <p className="k-boven">{d.bolletje.kleur === "rood" ? "Geen reactie" : "Twijfel"} · wacht {d.bolletje.sindsTekst}</p>
          <h2 style={{ fontSize: 20, margin: "2px 0 6px" }}>{eerste.titel || eerste.tekst}</h2>
          <p style={{ fontSize: 14.5 }}>{uitleg(d, eerste.reden)}</p>
          {d.bolletje.gele.length > 1 && <p className="sv-klein" style={{ marginTop: 6 }}>Ook: {d.bolletje.gele.slice(1).map((g) => g.tekst.replace(/^Twijfel: /, "")).join(" · ")}</p>}
          <p style={{ marginTop: 8 }}><b>Volgende actie:</b> {eerste.actie}</p>
          {d.matches.map((m) => (
            <div key={m.id} className="k-match">
              <p>Zelfde {m.redenen.join(" en ")} als {m.soort === "medewerker" ? "medewerker" : "een aanmelding van"} {m.naam}{m.wanneer ? ` (${MAANDEN[new Date(m.wanneer).getMonth()]} ${new Date(m.wanneer).getFullYear()})` : ""}. {m.stand}</p>
              <div className="sv-rij" style={{ marginTop: 8 }}>
                <Knop onClick={() => post(`match/${m.id}`, { status: "zelfde_persoon" }).then(opnieuw).catch((e) => melding(e.message))}>Zelfde persoon</Knop>
                <Knop onClick={() => post(`match/${m.id}`, { status: "iemand_anders" }).then(opnieuw).catch((e) => melding(e.message))}>Iemand anders</Knop>
                {m.soort === "kandidaat" && <a className="sv-knop sv-knop-link" href={`/dashboard?tab=kandidaten&kandidaat=${m.matchId}`} target="_blank" rel="noreferrer">Vergelijken</a>}
              </div>
            </div>
          ))}
          <div className="sv-tussen" style={{ alignItems: "center", marginTop: 14 }}>
            <div className="sv-rij">
              {d.contact.telefoon && <a className="sv-knop" href={`tel:${d.contact.telefoon}`}>Bel {d.voornaam}</a>}
              {d.job && (d.job.kanaal === "whatsapp" ? <Knop onClick={naarWhatsapp}>Bericht via Job</Knop> : webLink && <a className="sv-knop" href={webLink} target="_blank" rel="noreferrer">Open webgesprek</a>)}
            </div>
            {besluit}
          </div>
        </div>
      )}
      {d.status === "in_behandeling" || d.status === "gepland" ? (
        <p className="sv-klein" style={{ margin: "10px 0 0", textAlign: "right" }}><button className="sv-knop sv-knop-link" onClick={() => setInplannen(true)}>Of plan zelf een moment</button></p>
      ) : null}

      <div className="k-twee">
        <div className="sv-kolom">
          <div className="sv-kaart">
            <h2 style={{ fontSize: 17 }}>Profiel</h2>
            <div className="k-profiel">
              <div>
                <p className="sv-lbl">WERK</p>
                <Waarde label="Functie" w={d.functie} />
                <Waarde label="Ervaring" w={d.profiel.ervaring} zelf={d.profiel.uitJob} />
                <Waarde label="Diensten" w={d.profiel.diensten} zelf={d.profiel.uitJob} />
                <Waarde label="Werkgebied" w={d.profiel.werkgebied} zelf={d.profiel.uitJob} />
              </div>
              <div>
                <p className="sv-lbl">PERSOON</p>
                <Waarde label="Nationaliteit" w={d.profiel.nationaliteit} />
                <Waarde label="Talen" w={d.profiel.talen} zelf={d.profiel.uitJob} />
                <div className="k-waarde"><span>Cv</span><div>{d.profiel.cv !== null ? <b>Ontvangen · <a href={`/api/admin/candidates/${d.id}/cv?preview=1`} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>bekijken</a></b> : <b>Nog niet ontvangen</b>}</div></div>
                <Waarde label="Documenten" w="Identiteit en werkautorisatie nog niet gecontroleerd" />
              </div>
            </div>
          </div>
          <Uitklap titel="Contact en toestemming" samenvatting={`${d.contact.telefoon || "geen telefoon"} · ${d.contact.whatsappStatus === "actief" ? `WhatsApp-toestemming${d.contact.toestemmingOp ? ` ${kortDatum(d.contact.toestemmingOp)}` : ""}` : "geen WhatsApp"}`} open={!!uit.contact} wissel={() => setUit({ ...uit, contact: !uit.contact })}>
            <dl className="sv-gegevens">
              <dt>Mobiel</dt><dd>{d.contact.telefoon || "Onbekend"}</dd>
              {d.contact.whatsapp && <><dt>WhatsApp</dt><dd>{d.contact.whatsapp}</dd></>}
              <dt>E-mail</dt><dd style={{ wordBreak: "break-all" }}>{d.contact.email || "Onbekend"}</dd>
              <dt>{d.contact.woonland ? "Woont in" : "Postcode"}</dt><dd>{d.contact.woonland || [d.contact.postcode, d.plaats].filter(Boolean).join(" ") || "Onbekend"}</dd>
              <dt>Toestemming WhatsApp</dt><dd>{d.contact.whatsappStatus === "actief" ? (d.contact.toestemmingOp ? `${wanneer(d.contact.toestemmingOp)}, via de knop op het formulier` : "Ja") : "Koos voor verder zonder WhatsApp"}</dd>
              <dt>Bron</dt><dd>{d.bron || "Onbekend"}</dd>
              <dt>Taal van het gesprek</dt><dd>{d.contact.gesprekstaal === "en" ? "Engels" : d.contact.gesprekstaal === "nl" ? "Nederlands" : "Onbekend"}</dd>
            </dl>
          </Uitklap>
          <Uitklap titel="Tijdlijn en notities" samenvatting={`${d.tijdlijn.length} gebeurtenissen`} open={!!uit.tijdlijn} wissel={() => setUit({ ...uit, tijdlijn: !uit.tijdlijn })}>
            <div className="sv-tijdlijn">{d.tijdlijn.map((t, n) => <div key={n}><b>{kortDatum(t.at)}</b><span style={t.notitie ? { fontStyle: "italic" } : undefined}>{t.tekst}</span></div>)}</div>
            <label className="sv-veld" style={{ marginTop: 14 }}><span>Notitie</span><textarea value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Gaat mee naar Sollicitanten" /></label>
            <Knop disabled={!notitie.trim() || bezig} onClick={() => post(`${id}/notitie`, { tekst: notitie }).then(() => { setNotitie(""); melding("Notitie opgeslagen."); opnieuw(); }).catch((e) => melding(e.message))}>Notitie opslaan</Knop>
          </Uitklap>
        </div>
        <aside className="k-job">
          <div className="sv-tussen" style={{ marginBottom: 10 }}>
            <h3>Gesprek met Job</h3>
            {d.job && <span className="sv-klein">{kortDatum(d.job.gestart)} {tijdstip(d.job.gestart)}{d.job.berichten.length ? ` tot ${tijdstip(d.job.berichten[d.job.berichten.length - 1].at)}` : ""}</span>}
          </div>
          {!d.job ? (
            <div><p className="sv-grijs" style={{ marginBottom: 10 }}>Nog geen gesprek met Job.</p>
              <Knop soort="donker" disabled={bezig} onClick={() => api(`/api/admin/job/start/${id}`, { method: "POST", body: {} }).then(() => { melding("Job is gestart."); opnieuw(); }).catch((e) => melding(e.message))}>Start Job</Knop></div>
          ) : (
            <>
              <div className="k-berichten">
                {d.job.berichten.map((b, n) => (
                  <Fragment key={n}>
                    {b.bijlage && <span className="k-systeem">Cv ontvangen</span>}
                    <div className={`k-bericht ${b.richting === "in" ? "in" : "uit"}`}><p>{b.tekst}</p><small>{tijdstip(b.at)}</small></div>
                  </Fragment>
                ))}
                {!d.job.berichten.length && <p className="sv-grijs">Nog geen berichten.</p>}
              </div>
              {d.job.kanaal === "whatsapp" ? <button className="sv-knop sv-knop-link" style={{ marginTop: 10 }} onClick={naarWhatsapp}>Open in de WhatsApp-inbox</button>
                : webLink && <a className="sv-knop sv-knop-link" style={{ marginTop: 10, display: "inline-block" }} href={webLink} target="_blank" rel="noreferrer">Open webgesprek</a>}
            </>
          )}
        </aside>
      </div>

      {afwijzen && <AfwijzenDialoog id={id} naam={d.naam} voornaam={d.voornaam} stap="kandidaten" sluit={() => setAfwijzen(false)}
        klaar={(r) => { setAfwijzen(false); melding(`Afgewezen: ${d.voornaam} staat in het archief.${r.verstuurd ? " De mail is verstuurd." : ""}`); volgende(); }} />}
      {geenCv && (
        <Dialoog titel="Er is nog geen cv" sluit={() => setGeenCv(false)} breed={460}>
          <p className="sv-sub" style={{ marginBottom: 16 }}>{d.voornaam} heeft nog geen cv gestuurd. Toch uitnodigen?</p>
          <div className="sv-rij" style={{ justifyContent: "flex-end" }}><Knop onClick={() => setGeenCv(false)}>Annuleren</Knop><Knop soort="groen" onClick={() => { setGeenCv(false); accepteer(true); }}>Toch uitnodigen</Knop></div>
        </Dialoog>
      )}
      {inplannen && <Inplannen id={id} voornaam={d.voornaam} sluit={() => setInplannen(false)} klaar={() => { setInplannen(false); melding(`Ingepland: ${d.voornaam} staat nu bij Sollicitanten · Gesprekken.`); volgende(); }} />}
    </div>
  );
}

function uitleg(d: DossierData, reden: string): string {
  const v = d.voornaam;
  switch (reden) {
    case "werkautorisatie": return `${v} heeft de nationaliteit ${d.profiel.nationaliteit || "van buiten de EU"}. Werkautorisatie volgens Job: ${({ twv: "TWV vereist", onbekend: "weet het niet", anders: "ander antwoord" } as Record<string, string>)[d.profiel.werkautorisatie || ""] || "onbekend"}.`;
    case "ervaring": return `${v} gaf aan geen ervaring te hebben, en deze functie vraagt ervaring.`;
    case "mens": return `${v} vroeg Job om een collega te spreken.`;
    case "cv": return `Het cv van ${v} is binnen. Job kon niet alle criteria zelf beoordelen.`;
    case "jong": return `${v} is ${d.leeftijd} jaar. Beoordeel volgens het beleid of dat kan voor deze functie.`;
    case "buitenland": return `${v} woont nog in ${d.contact.woonland || "het buitenland"}. Job vraagt wanneer de verhuizing naar Nederland is.`;
    case "gestopt": return `${v} heeft STOP gestuurd of zich afgemeld. Er gaan geen berichten meer uit.`;
    case "geen_job": return `${v} heeft nog niet met Job gepraat.`;
    case "uitgenodigd_lang": return `${v} is uitgenodigd, maar heeft nog geen moment gekozen.`;
    case "geen_reactie": return `${v} reageerde niet op twee herinneringen van Job. ${d.bolletje.tekst.replace(/, geen reactie op 2 herinneringen$/, "")}.`;
    case "match": return `Deze aanmelding lijkt op een eerder dossier. Bekijk of het dezelfde persoon is.`;
    default: return d.bolletje.tekst;
  }
}

function Waarde({ label, w, zelf }: { label: string; w: string | null; zelf?: boolean }) {
  return <div className="k-waarde"><span>{label}</span><div><b>{w || "Onbekend"}</b>{zelf && w && <i>zelf opgegeven</i>}</div></div>;
}

function Uitklap({ titel, samenvatting, open, wissel, children }: { titel: string; samenvatting: string; open: boolean; wissel: () => void; children: React.ReactNode }) {
  return (
    <div className="sv-kaart" style={{ padding: 0 }}>
      <button className="k-uitklap" onClick={wissel} aria-expanded={open}><span style={{ transform: open ? "rotate(90deg)" : undefined, display: "inline-block" }}>›</span><b>{titel}</b><span className="sv-grijs" style={{ marginLeft: "auto" }}>{samenvatting}</span></button>
      {open && <div style={{ padding: "0 22px 20px" }}>{children}</div>}
    </div>
  );
}

function Inplannen({ id, voornaam, sluit, klaar }: { id: number; voornaam: string; sluit: () => void; klaar: () => void }) {
  const { data, fout } = useData<{ datum: string; tijd: string }[]>("/api/admin/kandidaten/momenten");
  const [keuze, setKeuze] = useState<{ datum: string; tijd: string } | null>(null);
  const [bezig, setBezig] = useState(false);
  const [melding2, setMelding2] = useState("");
  const perDag = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const x of data || []) { const l = m.get(x.datum) || []; if (!l.includes(x.tijd)) l.push(x.tijd); m.set(x.datum, l); }
    return Array.from(m.entries());
  }, [data]);
  return (
    <Dialoog titel={`Gesprek met ${voornaam} inplannen`} sluit={sluit} breed={620}>
      <p className="sv-sub" style={{ marginBottom: 12 }}>Vrije momenten van de interviewers. {voornaam} krijgt de bevestigingsmail met het agenda-bestand.</p>
      {fout && <div className="sv-fout">{fout}</div>}
      {!data && !fout && <p className="sv-grijs">Laden...</p>}
      {data && !perDag.length && <p className="sv-grijs">Geen vrije momenten in de komende twee weken. Pas de werktijden aan bij Job.</p>}
      <div style={{ maxHeight: 360, overflow: "auto" }}>
        {perDag.map(([datum, tijden]) => (
          <div key={datum} style={{ marginBottom: 12 }}>
            <p className="sv-lbl">{new Date(`${datum}T12:00:00Z`).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }).toUpperCase()}</p>
            <div className="sv-wissel">{tijden.map((t) => <button key={t} className={keuze?.datum === datum && keuze.tijd === t ? "aan" : ""} onClick={() => setKeuze({ datum, tijd: t })}>{t}</button>)}</div>
          </div>
        ))}
      </div>
      {melding2 && <div className="sv-fout">{melding2}</div>}
      <div className="sv-rij" style={{ justifyContent: "flex-end", marginTop: 12 }}>
        <Knop onClick={sluit}>Annuleren</Knop>
        <Knop soort="donker" disabled={!keuze || bezig} onClick={() => { setBezig(true); api(`/api/admin/kandidaten/${id}/inplannen`, { method: "POST", body: keuze }).then(klaar).catch((e) => { setMelding2(e.message); setBezig(false); }); }}>Inplannen</Knop>
      </div>
    </Dialoog>
  );
}

const KCSS = `
.sv .k-filter{position:absolute;right:0;top:46px;width:300px;background:#fff;border:1px solid #E4E0D8;border-radius:14px;padding:16px;z-index:20;box-shadow:0 12px 30px -12px rgba(55,53,44,.35)}
.sv .k-filterrij{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13.5px;cursor:pointer}
.sv .k-aandacht{background:#FFFBEA;border:1px solid #EFDC8C;border-radius:16px;padding:18px 20px;margin-top:16px}
.sv .k-aandacht.rood{background:#FBE3DE;border-color:#F0B8AC}
.sv .k-boven{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#7A6200}
.sv .k-aandacht.rood .k-boven{color:#A2321F}
.sv .k-match{background:#fff;border:1px solid #EFDC8C;border-radius:12px;padding:12px 14px;margin-top:10px}
.sv .k-twee{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:16px;margin-top:18px;align-items:start}
.sv .k-profiel{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:12px}
.sv .k-waarde{display:grid;grid-template-columns:120px 1fr;gap:10px;padding:6px 0;font-size:13.5px}
.sv .k-waarde>span{color:#8A8478}
.sv .k-waarde i{display:block;font-size:12px;color:#8A8478}
.sv .k-uitklap{display:flex;align-items:center;gap:10px;width:100%;height:48px;padding:0 22px;border:0;background:none;font:inherit;cursor:pointer;color:#37352C;text-align:left}
.sv .k-job{background:#F2EEE7;border-radius:16px;padding:18px;max-height:840px;overflow:auto}
.sv .k-berichten{display:flex;flex-direction:column;gap:8px}
.sv .k-bericht{max-width:85%;padding:8px 12px;font-size:13px}
.sv .k-bericht p{margin:0;white-space:pre-wrap}
.sv .k-bericht small{display:block;font-size:10px;color:#8A8478;margin-top:2px}
.sv .k-bericht.uit{align-self:flex-start;background:#fff;border:1px solid #ECE7DF;border-radius:4px 14px 14px 14px}
.sv .k-bericht.in{align-self:flex-end;background:#E3F0E5;color:#1F3B26;border-radius:14px 4px 14px 14px}
.sv .k-systeem{align-self:center;background:#EFEAE2;border-radius:99px;padding:2px 10px;font-size:12px;color:#5C594F}
.sv .k-smal{display:none}
@media (max-width:1023px){.sv .k-twee{grid-template-columns:1fr}}
@media (max-width:640px){.sv .k-breed{display:none}.sv .k-smal{display:block}.sv .k-profiel{grid-template-columns:1fr}.sv .k-filter{position:fixed;left:0;right:0;bottom:0;top:auto;width:auto;border-radius:16px 16px 0 0}}
`;

/** Staat Kandidaten 3.0 aan? Pas opvragen na het inloggen als admin (zie useSollicitantenV2). */
export function useKandidatenV2(ingelogdAlsAdmin: boolean): boolean {
  const [aan, setAan] = useState(false);
  useEffect(() => {
    if (!ingelogdAlsAdmin) { setAan(false); return; }
    let weg = false;
    api<{ kandidaten?: boolean }>("/api/sollicitanten/status").then((s) => { if (!weg) setAan(!!s.kandidaten); }).catch(() => { if (!weg) setAan(false); });
    return () => { weg = true; };
  }, [ingelogdAlsAdmin]);
  return aan;
}
