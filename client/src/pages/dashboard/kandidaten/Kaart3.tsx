/**
 * Kandidaatkaart 3: het dossier in Kandidaten in de huisstijl van het
 * brandboek (Dashboard 3.0). Zelfde gegevens, routes en knoppen als het
 * dossier in index.tsx; alleen de opmaak en de volgorde zijn anders.
 * Schakelaar KANDIDATEN_KAART3 (in de testomgeving vanzelf aan).
 *
 * Het blok Kandidaatmatch toont nog geen score: die komt met de cv-analyse
 * (Job 3.0, fase 4). Het gesprek met Job is alleen lezen; overnemen kan niet
 * vanuit dit scherm.
 */
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { BRANCHE } from "@shared/sollicitantRegels";
import { AfwijzenDialoog } from "../sollicitanten/Afwijzen";
import { Dialoog, api, kortDatum, melding, tijdstip, useData } from "../sollicitanten/gedeeld";
import { Inplannen, MAANDEN, uitleg, wanneer, type DossierData } from "./index";

const PADEN: Record<string, string> = {
  housekeeping: "M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 15h18M3 18v2M21 18v2M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3",
  chef: "M7 14v6h10v-6M7 14a4 4 0 0 1-1.2-7.8A4.5 4.5 0 0 1 12 4a4.5 4.5 0 0 1 6.2 2.2A4 4 0 0 1 17 14zM7 17h10",
  frontoffice: "M5 16a7 7 0 0 1 14 0zM3 19h18M12 9V7M10 7h4",
  logistiek: "M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9",
  horeca: "M4 16h16M6 16a6 6 0 0 1 12 0M12 8V6M3 19h18",
  oog: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  kruis: "M6 6l12 12M18 6L6 18",
  vink: "M5 12.5l4.5 4.5L19 7.5",
  meer: "M5 12h.01M12 12h.01M19 12h.01",
  links: "M15 6l-6 6 6 6",
  rechts: "M9 6l6 6-6 6",
  doc: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
  groot: "M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7",
  neer: "M12 4v11M7 10l5 5 5-5M4 20h16",
  slot: "M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3",
  clip: "M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7",
};
function Ic({ n }: { n: string }) {
  return <svg className="k3-ic" viewBox="0 0 24 24" aria-hidden="true"><path d={PADEN[n]} /></svg>;
}
const FUNCTIE_ICOON: Record<string, string> = { housekeeping: "housekeeping", chef: "chef", keuken: "chef", afwas: "chef", frontoffice: "frontoffice", logistiek: "logistiek" };
const VAK: Record<string, string> = { hotels: "hos", logistiek: "log", events: "evt" };

function initialen(naam: string): string {
  const w = naam.split(/\s+/).filter((x) => /^[A-ZÀ-Ý]/.test(x));
  return ((w[0]?.[0] || "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase() || "?";
}

export function Dossier3({ id, ids, context, naar, terug, naarWhatsapp }: { id: number; ids: number[]; context: string; naar: (id: number) => void; terug: () => void; naarWhatsapp: () => void }) {
  const { data: d, fout, opnieuw } = useData<DossierData>(`/api/admin/kandidaten/dossier/${id}`);
  const [afwijzen, setAfwijzen] = useState(false);
  const [accepteren, setAccepteren] = useState(false);
  const [inplannen, setInplannen] = useState(false);
  const [cvGroot, setCvGroot] = useState(false);
  const [menu, setMenu] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [notitie, setNotitie] = useState("");
  const [tijdlijnOpen, setTijdlijnOpen] = useState(false);
  const wortel = useRef<HTMLDivElement>(null);
  const kop = useRef<HTMLDivElement>(null);
  const berichten = useRef<HTMLDivElement>(null);
  const i = ids.indexOf(id);
  const volgende = () => { const n = ids.filter((x) => x !== id); if (n.length) naar(n[Math.min(i, n.length - 1)]); else terug(); };

  useEffect(() => {
    try { const u = new URL(window.location.href); u.searchParams.set("tab", "kandidaten"); u.searchParams.set("kandidaat", String(id)); window.history.replaceState(null, "", u.toString()); } catch { /* geen URL */ }
    return () => { try { const u = new URL(window.location.href); u.searchParams.delete("kandidaat"); window.history.replaceState(null, "", u.toString()); } catch { /* geen URL */ } };
  }, [id]);
  // De kop blijft staan en het gesprek schuift mee. Het hoofdvlak van het dashboard heeft overflow:auto
  // zonder eigen hoogte; daardoor werkt sticky er niet in. Zolang deze kaart open is: overflow clip
  // (knipt hetzelfde, maar is geen scrollvlak). Bij het sluiten komt de oude waarde terug.
  useEffect(() => {
    const main = wortel.current?.closest("main") as HTMLElement | null;
    if (!main) return;
    const oud = main.style.overflow;
    main.style.overflow = "clip";
    return () => { main.style.overflow = oud; };
  }, []);
  // Hoogte van de kop en van vaste balken bovenin (zoals de testomgevingsbalk), en het gesprek onderaan
  useEffect(() => {
    const w = wortel.current, k = kop.current; if (!w || !k) return;
    const zet = () => {
      let boven = 0;
      for (let el = document.elementFromPoint(window.innerWidth / 2, 1) as HTMLElement | null; el && el !== document.body; el = el.parentElement) {
        const r = el.getBoundingClientRect();
        if (getComputedStyle(el).position === "fixed" && r.top <= 0 && r.height < 90 && !w.contains(el)) { boven = r.bottom; break; }
      }
      w.style.setProperty("--k3-boven", `${Math.round(boven)}px`);
      w.style.setProperty("--k3-kop", `${k.offsetHeight}px`);
    };
    zet();
    const raf = requestAnimationFrame(() => { const b = berichten.current; if (b) b.scrollTop = b.scrollHeight; });
    window.addEventListener("resize", zet);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", zet); };
  }, [d?.id, d?.job?.berichten.length]);
  useEffect(() => {
    if (!menu) return;
    const dicht = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest(".k3-meer")) setMenu(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    document.addEventListener("click", dicht); window.addEventListener("keydown", esc);
    return () => { document.removeEventListener("click", dicht); window.removeEventListener("keydown", esc); };
  }, [menu]);

  if (fout) return <div className="k3" ref={wortel}><button className="k3-knop" onClick={terug}>Terug naar Kandidaten</button><div className="sv-fout" style={{ marginTop: 12 }}>{fout}</div></div>;
  if (!d) return <div className="k3" ref={wortel}><p className="k3-zacht">Laden...</p></div>;

  async function post(pad: string, body: unknown = {}) {
    setBezig(true);
    try { return await api<any>(`/api/admin/kandidaten/${pad}`, { method: "POST", body }); }
    finally { setBezig(false); }
  }
  async function accepteer() {
    try {
      const r = await post(`${id}/accepteren`, { zonderCv: d!.profiel.cv === null });
      setAccepteren(false);
      melding(`Door naar de kennismaking: ${d!.voornaam} krijgt ${r.mail ? "een mail met een afspraakknop" : "geen mail (geen e-mailadres)"}.`);
      volgende();
    } catch (e: any) { setAccepteren(false); melding(e.message); }
  }

  const vak = VAK[d.branche] || "";
  const icoon = FUNCTIE_ICOON[d.functieCode || ""] || "horeca";
  const lopend = d.status === "in_behandeling";
  const accepterenUit = bezig || d.matches.length > 0 || !lopend || d.job?.status === "gestopt";
  const accepterenWaarom = d.matches.length ? "Beoordeel eerst het mogelijke dubbele dossier" : d.job?.status === "gestopt" ? `${d.voornaam} heeft STOP gestuurd` : !lopend ? `${d.voornaam} is al uitgenodigd` : "";
  const stKlas = d.bolletje.kleur === "rood" ? "stop" : d.bolletje.kleur === "geel" ? "letop" : "neutraal";
  const webLink = d.job ? `/job-gesprek?token=${encodeURIComponent(d.job.token)}` : null;
  const zelf = d.profiel.uitJob ? "gesprek" : "formulier";
  const cv = d.cvBestand || (d.profiel.cv !== null ? { naam: "cv", soort: "anders" as const, at: null, via: null } : null);
  const cvBron = `/api/admin/candidates/${d.id}/cv?preview=1`;
  const cvHtml = `/api/admin/candidates/${d.id}/cv-html`;
  const meer = [
    d.contact.telefoon ? { label: `Bel ${d.voornaam}`, doe: () => { window.location.href = `tel:${d.contact.telefoon}`; } } : null,
    d.job?.kanaal === "whatsapp" ? { label: "Openen in de WhatsApp-inbox", doe: naarWhatsapp } : webLink ? { label: "Open het webgesprek", doe: () => window.open(webLink, "_blank", "noopener") } : null,
    d.status === "in_behandeling" || d.status === "gepland" ? { label: "Zelf een kennismaking plannen", doe: () => setInplannen(true) } : null,
  ].filter(Boolean) as { label: string; doe: () => void }[];

  const gele = d.bolletje.kleur === "geel" || d.bolletje.kleur === "rood" ? d.bolletje.gele : [];
  const aantalPunten = gele.length + d.matches.length;

  return (
    <div className="k3" ref={wortel}>
      <header className="k3-kop" ref={kop}>
        <div className="k3-kruimel">
          <button className="k3-link" onClick={terug}>Kandidaten</button><span>/</span><span className="k3-context">{context}</span>
          {ids.length > 1 && <div className="k3-nav">
            <button className="k3-knop klein icoon" disabled={i <= 0} onClick={() => naar(ids[i - 1])} aria-label="Vorige kandidaat"><Ic n="links" /></button>
            <span className="k3-num">{i + 1} van {ids.length}</span>
            <button className="k3-knop klein icoon" disabled={i < 0 || i >= ids.length - 1} onClick={() => naar(ids[i + 1])} aria-label="Volgende kandidaat"><Ic n="rechts" /></button>
          </div>}
        </div>
        <div className="k3-hoofd">
          <div className={`k3-ini ${vak}`} aria-hidden="true">{initialen(d.naam)}</div>
          <div className="k3-wie">
            <h1 title={d.naam}>{d.naam}</h1>
            <div className="k3-regel">
              <span className={`k3-fn ${vak}`}><Ic n={icoon} />{d.functie}</span>
              <span className={`k3-st ${stKlas}`}>{d.bolletje.tekst} · {d.bolletje.sindsTekst}</span>
              <span className={`k3-verantw ${d.planner ? "" : "leeg"}`}>
                <span className="k3-ava" aria-hidden="true">{d.planner ? initialen(d.planner.label) : ""}</span>
                {d.planner ? <>Verantwoordelijk: <b>{d.planner.label}</b></> : "Nog niet toegewezen"}
                <button className="k3-link klein" disabled={bezig} onClick={() => post(`${id}/planner`, {}).then(opnieuw).catch((e) => melding(e.message))}>aan mij toewijzen</button>
                {d.planner && <button className="k3-link klein" disabled={bezig} onClick={() => post(`${id}/planner`, { loslaten: true }).then(opnieuw).catch((e) => melding(e.message))}>loslaten</button>}
              </span>
            </div>
            <div className="k3-sub">{[BRANCHE[d.branche].label !== d.functie ? BRANCHE[d.branche].label : null, d.leeftijd !== null ? `${d.leeftijd} jaar` : null, d.plaats, `aangemeld ${wanneer(d.aangemeld)}${d.bron ? ` via ${d.bron}` : ""}`].filter(Boolean).join(" · ")}</div>
          </div>
          <div className="k3-acties">
            <div className="k3-rij">
              {meer.length > 0 && <div className="k3-meer">
                <button className="k3-knop icoon" aria-haspopup="true" aria-expanded={menu} aria-label="Meer acties" onClick={() => setMenu(!menu)}><Ic n="meer" /></button>
                {menu && <div className="k3-menu" role="menu">{meer.map((m) => <button key={m.label} role="menuitem" onClick={() => { setMenu(false); m.doe(); }}>{m.label}</button>)}</div>}
              </div>}
              <button className="k3-knop" disabled={!cv} onClick={() => setCvGroot(true)}><Ic n="oog" />{cv ? "Bekijk cv" : "Geen cv"}</button>
              <button className="k3-knop weg" disabled={bezig} onClick={() => setAfwijzen(true)}><Ic n="kruis" />Afwijzen</button>
              <button className="k3-knop vol" disabled={accepterenUit} title={accepterenWaarom} onClick={() => setAccepteren(true)}><Ic n="vink" />{lopend ? "Accepteren" : "Uitgenodigd"}</button>
            </div>
            <span className="k3-uitleg">{accepterenWaarom && accepterenUit && !bezig ? accepterenWaarom : "Accepteren = door naar de kennismaking, nog geen aanname."}</span>
          </div>
        </div>
      </header>

      <div className="k3-romp"><div className="k3-werk">
        <div className="k3-raster">
          <section className="k3-paneel" aria-labelledby="k3-match">
            <div className="k3-paneel-kop"><h2 id="k3-match">Kandidaatmatch</h2></div>
            <div className="k3-paneel-in">
              <div className="k3-match">
                <div className="k3-ring" role="img" aria-label="Nog geen kandidaatmatch">
                  <svg viewBox="0 0 92 92"><circle cx="46" cy="46" r="40" fill="none" stroke="#CFC9BE" strokeWidth="7" strokeDasharray="4 6" /></svg>
                  <b>Nog geen score</b>
                </div>
                <div className="k3-match-tekst">
                  <div className="k3-voor">{d.functie}</div>
                  <h3>Nog geen kandidaatmatch</h3>
                  <p>De score op basis van het cv komt met de cv-analyse. Beoordeel nu op het cv en het gesprek met Job.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="k3-paneel k3-aandacht" aria-labelledby="k3-aandacht">
            <div className="k3-paneel-kop"><h2 id="k3-aandacht">Aandachtspunten</h2><span className="k3-num k3-zacht">{aantalPunten || "geen"}</span></div>
            <div className="k3-paneel-in">
              {aantalPunten === 0 && <p className="k3-zacht">{d.bolletje.tekst}. Geen aandachtspunten.</p>}
              {aantalPunten > 0 && <ul>
                {gele.map((g, n) => (
                  <li key={n} className={d.bolletje.kleur === "rood" ? "rood" : ""}><div><b>{g.titel || g.tekst.replace(/^Twijfel: /, "")}</b><span>{uitleg(d, g.reden)}</span>{g.actie && <span className="k3-actie">Volgende actie: {g.actie}</span>}</div></li>
                ))}
                {d.matches.map((m) => (
                  <li key={`m${m.id}`}><div>
                    <b>Mogelijk dubbel dossier</b>
                    <span>Zelfde {m.redenen.join(" en ")} als {m.soort === "medewerker" ? "medewerker" : "een aanmelding van"} {m.naam}{m.wanneer ? ` (${MAANDEN[new Date(m.wanneer).getMonth()]} ${new Date(m.wanneer).getFullYear()})` : ""}. {m.stand}</span>
                    <div className="k3-rij" style={{ marginTop: 8 }}>
                      <button className="k3-knop klein" disabled={bezig} onClick={() => post(`match/${m.id}`, { status: "zelfde_persoon" }).then(opnieuw).catch((e) => melding(e.message))}>Zelfde persoon</button>
                      <button className="k3-knop klein" disabled={bezig} onClick={() => post(`match/${m.id}`, { status: "iemand_anders" }).then(opnieuw).catch((e) => melding(e.message))}>Iemand anders</button>
                      {m.soort === "kandidaat" && <a className="k3-link klein" href={`/dashboard?tab=kandidaten&kandidaat=${m.matchId}`} target="_blank" rel="noreferrer">Vergelijken</a>}
                    </div>
                  </div></li>
                ))}
              </ul>}
            </div>
          </section>

          <section className="k3-paneel" aria-labelledby="k3-gegevens">
            <div className="k3-paneel-kop"><h2 id="k3-gegevens">Kandidaatgegevens</h2></div>
            <div className="k3-paneel-in">
              <Groep titel="Werk">
                <Rij label="Functie" w={d.functie} />
                <Rij label="Ervaring" w={d.profiel.ervaring} bron={zelf} />
                <Rij label="Diensten" w={d.profiel.diensten} bron={zelf} />
                <Rij label="Werkgebied" w={d.profiel.werkgebied} bron={d.profiel.werkgebied ? "gesprek" : undefined} />
              </Groep>
              <Groep titel="Persoon">
                <Rij label="Nationaliteit" w={d.profiel.nationaliteit} bron="formulier" />
                <Rij label="Talen" w={d.profiel.talen} bron={zelf} />
                <Rij label="Leeftijd" w={d.leeftijd !== null ? `${d.leeftijd} jaar` : null} bron="formulier" />
                <Rij label="Documenten" w="Identiteit en werkautorisatie nog niet gecontroleerd" />
              </Groep>
              <Groep titel="Contact">
                <Rij label="Mobiel" w={d.contact.telefoon} />
                {d.contact.whatsapp && <Rij label="WhatsApp" w={d.contact.whatsapp} />}
                <Rij label="E-mail" w={d.contact.email} />
                <Rij label={d.contact.woonland ? "Woont in" : "Postcode"} w={d.contact.woonland || [d.contact.postcode, d.plaats].filter(Boolean).join(" ") || null} />
                <Rij label="WhatsApp-toestemming" w={d.contact.whatsappStatus === "actief" ? (d.contact.toestemmingOp ? wanneer(d.contact.toestemmingOp) : "Ja") : "Verder zonder WhatsApp"} />
                <Rij label="Taal gesprek" w={d.contact.gesprekstaal === "en" ? "Engels" : d.contact.gesprekstaal === "nl" ? "Nederlands" : null} />
              </Groep>
            </div>
          </section>

          <section className="k3-paneel k3-cv" aria-labelledby="k3-cv">
            <div className="k3-paneel-kop"><h2 id="k3-cv">Cv</h2>{cv ? <span className="k3-st goed">Ontvangen</span> : <span className="k3-st neutraal">Niet ontvangen</span>}</div>
            <div className="k3-paneel-in">
              {!cv ? <div className="k3-geencv">Nog geen cv ontvangen.</div> : <>
                <div className="k3-cvnaam"><Ic n="doc" /><div><b title={cv.naam}>{cv.naam}</b><span>{cv.via && cv.at ? `Ontvangen via ${cv.via} · ${kortDatum(cv.at)} ${tijdstip(cv.at)}` : "Ontvangen"}</span></div></div>
                <button className="k3-cvvoorbeeld" onClick={() => setCvGroot(true)} aria-label="Cv vergroten">
                  {cv.soort === "afbeelding" ? <img src={cvBron} alt="" /> : cv.soort === "anders" ? <span className="k3-zacht">Geen voorbeeld voor dit bestand</span>
                    : <iframe title={`Voorbeeld cv van ${d.voornaam}`} src={cv.soort === "word" ? cvHtml : `${cvBron}#toolbar=0&navpanes=0&view=FitH`} tabIndex={-1} />}
                  <span className="k3-hint" aria-hidden="true"><Ic n="groot" /></span>
                </button>
                <div className="k3-rij">
                  <button className="k3-knop breed" onClick={() => setCvGroot(true)}><Ic n="groot" />Cv vergroten</button>
                  <a className="k3-knop breed" href={`/api/admin/candidates/${d.id}/cv`}><Ic n="neer" />Downloaden</a>
                </div>
              </>}
            </div>
          </section>

          <section className="k3-paneel k3-breed">
            <button className="k3-uitklap" onClick={() => setTijdlijnOpen(!tijdlijnOpen)} aria-expanded={tijdlijnOpen}>
              <span className={`k3-pijl ${tijdlijnOpen ? "open" : ""}`} aria-hidden="true" /><b>Tijdlijn en notities</b><span className="k3-zacht">{d.tijdlijn.length} {d.tijdlijn.length === 1 ? "gebeurtenis" : "gebeurtenissen"}</span>
            </button>
            {tijdlijnOpen && <div className="k3-paneel-in" style={{ paddingTop: 0 }}>
              <div className="k3-tijdlijn">{d.tijdlijn.map((t, n) => <div key={n}><b>{kortDatum(t.at)}</b><span style={t.notitie ? { fontStyle: "italic" } : undefined}>{t.tekst}</span></div>)}</div>
              <label className="k3-veld"><span>Notitie</span><textarea value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Gaat mee naar Sollicitanten" /></label>
              <button className="k3-knop" disabled={!notitie.trim() || bezig} onClick={() => post(`${id}/notitie`, { tekst: notitie }).then(() => { setNotitie(""); melding("Notitie opgeslagen."); opnieuw(); }).catch((e) => melding(e.message))}>Notitie opslaan</button>
            </div>}
          </section>
        </div>

        <aside className="k3-chat" aria-label="Gesprek met Job">
          <div className="k3-chat-kop">
            <div><b>Gesprek met Job</b><span>{d.job ? `${d.job.kanaal === "whatsapp" ? "WhatsApp" : "Webgesprek"} · ${d.job.berichten.length} berichten` : "Nog niet gestart"}</span></div>
            {d.job && d.job.berichten.length > 0 && <button className="k3-knop klein" onClick={() => { const b = berichten.current; if (b) b.scrollTop = b.scrollHeight; }}>Naar laatste</button>}
          </div>
          {!d.job ? (
            <div className="k3-chat-leeg">
              <p className="k3-zacht">Nog geen gesprek met Job.</p>
              <button className="k3-knop vol" disabled={bezig} onClick={() => api(`/api/admin/job/start/${id}`, { method: "POST", body: {} }).then(() => { melding("Job is gestart."); opnieuw(); }).catch((e) => melding(e.message))}>Start Job</button>
            </div>
          ) : <>
            <div className="k3-legenda" aria-hidden="true"><span><i className="j" />Job, links</span><span><i className="k" />{d.voornaam}, rechts</span></div>
            <div className="k3-berichten" ref={berichten} tabIndex={0} aria-label="Berichten, scrollbaar">
              {d.job.berichten.map((b, n) => {
                const job = b.richting !== "in";
                return (
                  <Fragment key={n}>
                    {n === 0 || new Date(d.job!.berichten[n - 1].at).toDateString() !== new Date(b.at).toDateString() ? <div className="k3-dag">{new Date(b.at).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" })}</div> : null}
                    <div className={`k3-bericht ${job ? "job" : "kandidaat"}`}>
                      <span className={`k3-av ${job ? "" : vak}`} aria-hidden="true">{job ? "J" : initialen(d.naam)}</span>
                      <div className="k3-bel">
                        <span className="k3-naam">{job ? "Job" : d.voornaam}</span>
                        {b.bijlage && <span className="k3-bijlage"><Ic n="clip" />Bijlage ontvangen</span>}
                        {b.tekst && <span>{b.tekst}</span>}
                        <span className="k3-meta">{tijdstip(b.at)}</span>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
              {!d.job.berichten.length && <p className="k3-zacht">Nog geen berichten.</p>}
            </div>
            <div className="k3-chat-voet"><Ic n="slot" /><span>Alleen lezen. Overnemen kan niet vanuit dit scherm.</span></div>
          </>}
        </aside>
      </div></div>

      {cvGroot && cv && <CvGroot d={d} cv={cv} bron={cvBron} html={cvHtml} sluit={() => setCvGroot(false)} />}
      {accepteren && (
        <Dialoog titel={`${d.naam} accepteren`} sluit={() => setAccepteren(false)} breed={480}>
          <p className="sv-sub" style={{ marginBottom: 16 }}>
            {d.profiel.cv === null ? "Er is nog geen cv. " : ""}{d.voornaam} gaat door naar de kennismaking.{d.job?.kanaal === "whatsapp" ? " Job stuurt een bericht om zelf een moment te kiezen." : ""} {d.contact.email ? "Er gaat een mail met een afspraakknop." : "Er gaat geen mail (geen e-mailadres)."} Dit is nog geen aanname: beschikbaarheid, documenten en referentie volgen bij de kennismaking.
          </p>
          <div className="sv-rij" style={{ justifyContent: "flex-end" }}>
            <button className="k3-knop" onClick={() => setAccepteren(false)}>Annuleren</button>
            <button className="k3-knop vol" disabled={bezig} onClick={accepteer}>Door naar kennismaking</button>
          </div>
        </Dialoog>
      )}
      {afwijzen && <AfwijzenDialoog id={id} naam={d.naam} voornaam={d.voornaam} stap="kandidaten" sluit={() => setAfwijzen(false)}
        klaar={(r) => { setAfwijzen(false); melding(`Afgewezen: ${d.voornaam} staat in het archief.${r.verstuurd ? " De mail is verstuurd." : ""}`); volgende(); }} />}
      {inplannen && <Inplannen id={id} voornaam={d.voornaam} sluit={() => setInplannen(false)} klaar={() => { setInplannen(false); melding(`Ingepland: ${d.voornaam} staat nu bij Sollicitanten · Gesprekken.`); volgende(); }} />}
    </div>
  );
}

function Groep({ titel, children }: { titel: string; children: ReactNode }) {
  return <div className="k3-groep"><h3>{titel}</h3><dl>{children}</dl></div>;
}
function Rij({ label, w, bron }: { label: string; w: string | null; bron?: string }) {
  return (
    <div className="k3-vk"><dt>{label}</dt><dd className={w ? "" : "onbekend"}>{w || "Niet bekend"}{w && bron ? <span className="k3-bron">{bron}</span> : null}</dd></div>
  );
}

function CvGroot({ d, cv, bron, html, sluit }: { d: DossierData; cv: NonNullable<DossierData["cvBestand"]>; bron: string; html: string; sluit: () => void }) {
  const knop = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const vorige = document.activeElement as HTMLElement | null;
    knop.current?.focus({ preventScroll: true });
    const toets = (e: KeyboardEvent) => { if (e.key === "Escape") sluit(); };
    window.addEventListener("keydown", toets);
    return () => { window.removeEventListener("keydown", toets); vorige?.focus?.({ preventScroll: true }); };
  }, [sluit]);
  return (
    <div className="k3-laag" onClick={(e) => { if (e.target === e.currentTarget) sluit(); }}>
      <div className="k3-cvvenster" role="dialog" aria-modal="true" aria-label={`Cv van ${d.voornaam}`}>
        <div className="k3-cvbalk">
          <div><b title={cv.naam}>{cv.naam}</b><span>Cv van {d.naam}</span></div>
          <div className="k3-rij" style={{ flexWrap: "nowrap" }}>
            <a className="k3-knop" href={`/api/admin/candidates/${d.id}/cv`}><Ic n="neer" />Downloaden</a>
            <button className="k3-knop vol" ref={knop} onClick={sluit}>Terug naar de kandidaat <kbd>Esc</kbd></button>
          </div>
        </div>
        <div className="k3-cvinhoud">
          {cv.soort === "afbeelding" ? <img src={bron} alt={`Cv van ${d.voornaam}`} />
            : cv.soort === "anders" ? <p className="k3-zacht" style={{ padding: 24 }}>Dit bestand kan niet in de browser getoond worden. Download het om het te bekijken.</p>
              : <iframe title={`Cv van ${d.voornaam}`} src={cv.soort === "word" ? html : bron} />}
        </div>
      </div>
    </div>
  );
}

/** Opmaak: tokens 1 op 1 uit het brandboek EXTRA 2026 en dashboard3.css. Merkkleur alleen voor de hoofdactie. */
export const K3CSS = `
.sv .k3{--espresso:#37352C;--espresso-2:#2C2A23;--offwhite:#F8F7F4;--wit:#fff;--rose:#EBD0E4;--pistachio:#CEDBBC;--sky:#C7DFF4;
  --tekst-2:#5C594F;--label:#7A7468;--rand:#E4E0D8;--vlak:#EDEAE4;--rij:#FBFAF8;--lijn:#EFECE6;
  --letop-vlak:#FBF1DC;--letop-rand:#EBCF95;--letop:#8A6414;--stop-vlak:#F9E3E1;--stop-rand:#E6B3AE;--stop:#9A3A2F;--goed-vlak:#EEF3E7;--goed-rand:#CEDBBC;--goed:#456B2E;
  background:var(--offwhite);color:var(--espresso);font-family:"Jakarta","Plus Jakarta Sans",ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:1.45;border-radius:18px}
.sv .k3 :focus-visible{outline:2px solid var(--espresso);outline-offset:2px;border-radius:6px}
.sv .k3-zacht{color:var(--label)}
.sv .k3-num{font-variant-numeric:tabular-nums}
.sv .k3-ic{width:16px;height:16px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.sv .k3-kop{position:sticky;top:var(--k3-boven,0px);z-index:20;background:var(--offwhite);border-bottom:1px solid var(--rand);padding:12px 24px 14px;border-radius:18px 18px 0 0}
.sv .k3-kruimel{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--label);margin-bottom:10px;min-width:0}
.sv .k3-context{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sv .k3-nav{margin-left:auto;display:flex;align-items:center;gap:6px;flex:none}
.sv .k3-hoofd{display:flex;align-items:center;gap:12px 14px;flex-wrap:wrap}
.sv .k3-ini{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:700;flex:none;background:var(--wit);box-shadow:inset 0 0 0 1px var(--rand)}
.sv .k3-ini.hos{background:var(--rose);box-shadow:none}.sv .k3-ini.log{background:var(--pistachio);box-shadow:none}.sv .k3-ini.evt{background:var(--sky);box-shadow:none}
.sv .k3-wie{min-width:0;flex:1 1 340px}
.sv .k3-wie h1{margin:0;font-size:22px;line-height:1.15;letter-spacing:-.03em;font-weight:700;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.sv .k3-regel{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px;font-size:13px;color:var(--tekst-2)}
.sv .k3-sub{font-size:12px;color:var(--label);margin-top:4px}
.sv .k3-fn{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px 0 8px;border-radius:99px;font-size:12.5px;font-weight:600;white-space:nowrap;background:var(--wit);box-shadow:inset 0 0 0 1px var(--rand)}
.sv .k3-fn .k3-ic{width:14px;height:14px}
.sv .k3-fn.hos{background:var(--rose);box-shadow:none}.sv .k3-fn.log{background:var(--pistachio);box-shadow:none}.sv .k3-fn.evt{background:var(--sky);box-shadow:none}
.sv .k3-st{display:inline-flex;align-items:center;gap:7px;min-height:26px;padding:2px 10px;border-radius:7px;font-size:12.5px;font-weight:600;border:1px solid var(--rand);background:var(--wit);color:var(--tekst-2)}
.sv .k3-st::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;flex:none}
.sv .k3-st.letop{background:var(--letop-vlak);border-color:var(--letop-rand);color:var(--letop)}
.sv .k3-st.stop{background:var(--stop-vlak);border-color:var(--stop-rand);color:var(--stop)}
.sv .k3-st.goed{background:var(--goed-vlak);border-color:var(--goed-rand);color:var(--goed)}
.sv .k3-st.neutraal::before{background:var(--label)}
.sv .k3-verantw{display:inline-flex;align-items:center;gap:7px;flex-wrap:wrap}
.sv .k3-verantw.leeg{color:var(--label)}
.sv .k3-ava{width:22px;height:22px;border-radius:50%;background:var(--wit);box-shadow:inset 0 0 0 1px var(--rand);display:grid;place-items:center;font-size:9.5px;font-weight:700;color:var(--espresso)}
.sv .k3-verantw.leeg .k3-ava{background:transparent;border:1px dashed #CFC9BE;box-shadow:none}
.sv .k3-acties{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex:none;margin-left:auto}
.sv .k3-rij{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sv .k3-uitleg{font-size:12px;color:var(--label);text-align:right;max-width:420px}
.sv .k3-knop{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 16px;border-radius:12px;border:1px solid var(--rand);background:var(--wit);color:var(--espresso);font:inherit;font-weight:600;cursor:pointer;white-space:nowrap;text-decoration:none}
.sv .k3-knop:hover:not(:disabled){border-color:var(--espresso)}
.sv .k3-knop:disabled{opacity:.5;cursor:not-allowed}
.sv .k3-knop.vol{background:var(--espresso);border-color:var(--espresso);color:var(--offwhite)}
.sv .k3-knop.vol:hover:not(:disabled){background:var(--espresso-2)}
.sv .k3-knop.weg{color:var(--stop)}
.sv .k3-knop.weg:hover:not(:disabled){border-color:var(--stop)}
.sv .k3-knop.klein{height:32px;padding:0 11px;border-radius:10px;font-size:12.5px}
.sv .k3-knop.icoon{width:40px;padding:0}.sv .k3-knop.klein.icoon{width:32px}
.sv .k3-knop.breed{flex:1}
.sv .k3-knop kbd{font:600 11px/1 inherit;border:1px solid rgba(248,247,244,.4);border-radius:5px;padding:2px 5px;opacity:.85}
.sv .k3-link{all:unset;cursor:pointer;font-weight:600;color:var(--tekst-2);text-decoration:underline;text-underline-offset:3px;text-decoration-color:#CFC9BE}
.sv .k3-link:hover{text-decoration-color:var(--espresso)}
.sv .k3-link.klein{font-size:12px;font-weight:500}
.sv .k3-link:disabled{opacity:.5;cursor:default}
.sv .k3-meer{position:relative}
.sv .k3-menu{position:absolute;right:0;top:46px;background:var(--wit);border:1px solid var(--rand);border-radius:12px;box-shadow:0 12px 30px -8px rgba(55,53,44,.25);padding:6px;min-width:250px;z-index:40}
.sv .k3-menu button{display:block;width:100%;text-align:left;border:0;background:none;padding:9px 10px;border-radius:8px;cursor:pointer;font:inherit;font-weight:500;color:var(--espresso)}
.sv .k3-menu button:hover{background:var(--rij)}
.sv .k3-romp{container:k3 / inline-size}
.sv .k3-werk{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:20px;padding:20px 24px 28px;align-items:start}
.sv .k3-raster{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,1fr);gap:16px;align-items:start;min-width:0}
.sv .k3-paneel{background:var(--wit);border:1px solid var(--rand);border-radius:14px;min-width:0}
.sv .k3-breed{grid-column:1 / -1}
.sv .k3-paneel-kop{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px 0}
.sv .k3-paneel-kop h2{margin:0;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--label);font-weight:700}
.sv .k3-paneel-in{padding:12px 18px 16px}
.sv .k3-match{display:flex;gap:16px;align-items:center}
.sv .k3-ring{width:92px;height:92px;flex:none;position:relative;display:grid;place-items:center;text-align:center}
.sv .k3-ring svg{position:absolute;inset:0;width:92px;height:92px}
.sv .k3-ring b{font-size:12px;line-height:1.2;color:var(--tekst-2);padding:0 16px}
.sv .k3-voor{font-size:12px;color:var(--label);font-weight:600}
.sv .k3-match-tekst h3{margin:2px 0 4px;font-size:16px;line-height:1.25;font-weight:600}
.sv .k3-match-tekst p{margin:0;color:var(--tekst-2);font-size:13.5px}
.sv .k3-aandacht ul{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.sv .k3-aandacht li{display:grid;grid-template-columns:8px minmax(0,1fr);gap:10px;font-size:13px;line-height:1.4}
.sv .k3-aandacht li::before{content:"";width:8px;height:8px;border-radius:50%;margin-top:6px;background:#C9962E}
.sv .k3-aandacht li.rood::before{background:#C0584A}
.sv .k3-aandacht li b{display:block;font-size:13.5px}
.sv .k3-aandacht li span{display:block;color:var(--tekst-2)}
.sv .k3-aandacht li .k3-actie{margin-top:4px;font-size:12.5px;color:var(--label)}
.sv .k3-groep+.k3-groep{border-top:1px solid var(--lijn);margin-top:6px}
.sv .k3-groep h3{margin:10px 0 2px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--label);font-weight:700}
.sv .k3-groep dl{margin:0}
.sv .k3-vk{display:grid;grid-template-columns:118px minmax(0,1fr);gap:10px;align-items:baseline;padding:6px 0}
.sv .k3-vk dt{color:var(--label);font-size:13px}
.sv .k3-vk dd{margin:0;font-weight:600;font-size:13.5px;overflow-wrap:break-word;min-width:0}
.sv .k3-vk dd.onbekend{color:var(--label);font-weight:500}
.sv .k3-vk .k3-bron{margin-left:6px;vertical-align:1px}
.sv .k3-bron{display:inline-block;font-size:11px;font-weight:600;color:var(--label);border:1px solid var(--rand);border-radius:6px;padding:0 6px;line-height:18px;white-space:nowrap}
.sv .k3-cv .k3-paneel-in{display:grid;gap:12px}
.sv .k3-cvnaam{display:flex;gap:10px;align-items:flex-start;min-width:0;color:var(--tekst-2)}
.sv .k3-cvnaam>div{min-width:0}
.sv .k3-cvnaam b{display:block;font-size:13.5px;color:var(--espresso);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sv .k3-cvnaam span{font-size:12px;color:var(--label)}
.sv .k3-cvvoorbeeld{all:unset;box-sizing:border-box;cursor:zoom-in;display:grid;place-items:center;border:1px solid var(--rand);border-radius:10px;overflow:hidden;background:var(--vlak);height:420px;position:relative}
.sv .k3-cvvoorbeeld:hover{border-color:#CFC9BE}
.sv .k3-cvvoorbeeld:focus-visible{outline:2px solid var(--espresso);outline-offset:2px}
.sv .k3-cvvoorbeeld iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff;pointer-events:none}
.sv .k3-cvvoorbeeld img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top}
.sv .k3-hint{position:absolute;right:10px;bottom:10px;display:grid;place-items:center;width:32px;height:32px;background:var(--espresso);color:var(--offwhite);border-radius:9px}
.sv .k3-geencv{padding:28px 18px;border:1px dashed #CFC9BE;border-radius:10px;color:var(--label);font-size:13px;text-align:center;background:var(--rij)}
.sv .k3-uitklap{display:flex;align-items:center;gap:10px;width:100%;min-height:48px;padding:0 18px;border:0;background:none;font:inherit;cursor:pointer;color:var(--espresso);text-align:left}
.sv .k3-uitklap .k3-zacht{margin-left:auto;font-size:12.5px}
.sv .k3-pijl{width:7px;height:7px;border-right:2px solid var(--label);border-bottom:2px solid var(--label);transform:rotate(-45deg);transition:transform .15s;flex:none}
.sv .k3-pijl.open{transform:rotate(45deg)}
.sv .k3-tijdlijn{display:grid;gap:6px;font-size:13px;margin-bottom:14px}
.sv .k3-tijdlijn div{display:grid;grid-template-columns:90px 1fr;gap:10px}
.sv .k3-tijdlijn b{font-weight:600;color:var(--label)}
.sv .k3-veld{display:grid;gap:4px;margin-bottom:10px}
.sv .k3-veld span{font-size:12px;color:var(--label);font-weight:600}
.sv .k3-veld textarea{min-height:70px;border:1px solid var(--rand);border-radius:10px;padding:8px 10px;font:inherit;resize:vertical}
.sv .k3-chat{position:sticky;top:calc(var(--k3-boven,0px) + var(--k3-kop,140px) + 16px);height:calc(100vh - var(--k3-boven,0px) - var(--k3-kop,140px) - 32px);min-height:440px;display:flex;flex-direction:column;background:var(--wit);border:1px solid var(--rand);border-radius:14px;overflow:hidden}
.sv .k3-chat-kop{padding:12px 14px 12px 16px;border-bottom:1px solid var(--rand);display:flex;align-items:center;justify-content:space-between;gap:8px}
.sv .k3-chat-kop b{font-size:14px;display:block}
.sv .k3-chat-kop span{font-size:12px;color:var(--label)}
.sv .k3-chat-leeg{padding:18px;display:grid;gap:10px;justify-items:start}
.sv .k3-legenda{display:flex;gap:12px;padding:8px 16px;border-bottom:1px solid var(--lijn);font-size:11.5px;color:var(--label);background:var(--rij)}
.sv .k3-legenda i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.sv .k3-legenda i.j{background:var(--wit);box-shadow:inset 0 0 0 1px var(--rand)}
.sv .k3-legenda i.k{background:var(--vlak)}
.sv .k3-berichten{flex:1;overflow-y:auto;padding:14px 14px 18px;background:var(--offwhite);display:flex;flex-direction:column;gap:8px;overscroll-behavior:contain}
.sv .k3-dag{align-self:center;font-size:11.5px;color:var(--label);background:var(--wit);border:1px solid var(--rand);border-radius:99px;padding:2px 10px;margin:4px 0}
.sv .k3-bericht{display:flex;gap:8px;align-items:flex-end;max-width:88%}
.sv .k3-bericht.job{align-self:flex-start}
.sv .k3-bericht.kandidaat{align-self:flex-end;flex-direction:row-reverse}
.sv .k3-av{width:24px;height:24px;border-radius:50%;flex:none;display:grid;place-items:center;font-size:10px;font-weight:700;background:var(--wit);box-shadow:inset 0 0 0 1px var(--rand)}
.sv .k3-bericht.job .k3-av{background:var(--espresso);color:var(--offwhite);box-shadow:none}
.sv .k3-av.hos{background:var(--rose);box-shadow:none}.sv .k3-av.log{background:var(--pistachio);box-shadow:none}.sv .k3-av.evt{background:var(--sky);box-shadow:none}
.sv .k3-bel{padding:8px 11px;border-radius:12px;font-size:13.5px;line-height:1.42;white-space:pre-wrap;overflow-wrap:anywhere;min-width:0;display:grid}
.sv .k3-naam{font-size:11px;font-weight:700;color:var(--label);margin-bottom:2px}
.sv .k3-meta{font-size:11px;margin-top:4px;color:var(--label)}
.sv .k3-bericht.job .k3-bel{background:var(--wit);border:1px solid var(--rand);border-bottom-left-radius:4px}
.sv .k3-bericht.kandidaat .k3-bel{background:var(--vlak);border-bottom-right-radius:4px}
.sv .k3-bericht.kandidaat .k3-meta{text-align:right}
.sv .k3-bijlage{display:inline-flex;align-items:center;gap:6px;font-weight:600}
.sv .k3-chat-voet{padding:10px 14px;border-top:1px solid var(--rand);font-size:12.5px;color:var(--tekst-2);display:flex;align-items:center;gap:8px;background:var(--rij)}
.sv .k3-chat-voet .k3-ic{color:var(--label)}
.k3-laag{position:fixed;inset:0;z-index:60;background:rgba(44,42,35,.5);display:grid;place-items:center;padding:24px}
.k3-cvvenster{width:min(980px,100%);height:min(92vh,1100px);background:#F8F7F4;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.3)}
.k3-cvbalk{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid #E4E0D8;background:#fff}
.k3-cvbalk>div:first-child{min-width:0}
.k3-cvbalk b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.k3-cvbalk span{font-size:12px;color:#7A7468}
.k3-cvinhoud{flex:1;overflow:auto;display:flex;justify-content:center}
.k3-cvinhoud iframe{width:100%;height:100%;border:0;background:#fff}
.k3-cvinhoud img{max-width:100%;height:auto;align-self:flex-start;margin:24px}
@container k3 (max-width:1180px){.sv .k3-werk{grid-template-columns:minmax(0,1fr) 330px;gap:16px}.sv .k3-raster{grid-template-columns:minmax(0,1.1fr) minmax(260px,1fr)}}
@container k3 (max-width:980px){.sv .k3-werk{grid-template-columns:minmax(0,1fr)}.sv .k3-chat{position:relative;top:0;height:70vh}}
@container k3 (max-width:700px){.sv .k3-raster{grid-template-columns:minmax(0,1fr)}.sv .k3-werk{padding:16px}.sv .k3-vk{grid-template-columns:minmax(0,1fr)}}
@media (prefers-reduced-motion:reduce){.sv .k3 *{transition:none!important}}
`;
