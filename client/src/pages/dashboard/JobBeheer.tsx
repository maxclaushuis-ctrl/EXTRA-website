/**
 * Job, de AI-recruiter, in het dashboard.
 *
 *  - JobBeheer: het tabblad "Job". Wat er aanstaat, alle gesprekken met hun
 *    status, de geplande kennismakingen, de werktijden van de interviewers en
 *    (in de testomgeving) de simulator en de klok vooruit.
 *  - JobGesprekPaneel: het gesprek met Job op de kandidaatkaart, met wat Job
 *    vastlegde en waarom een collega moet kijken.
 *
 * Alleen lezen en de werktijden bewaren; er wordt hier niets verwijderd.
 */
import { useEffect, useState } from "react";
import { D3Kop } from "./d3";

type Status = "bezig" | "wacht_cv" | "plannen" | "gepland" | "planner" | "geen_reactie" | "gestopt";

const STATUS: Record<string, { label: string; kleur: string; tekst: string }> = {
  bezig: { label: "Bezig met vragen", kleur: "#EAF3FB", tekst: "#1D4566" },
  wacht_cv: { label: "Wacht op cv", kleur: "#FCEBD7", tekst: "#9A5414" },
  plannen: { label: "Mag plannen", kleur: "#E6F0E2", tekst: "#2F6B3E" },
  gepland: { label: "Gepland", kleur: "#E6F0E2", tekst: "#2F6B3E" },
  planner: { label: "Collega moet kijken", kleur: "#FFF6D6", tekst: "#7A6200" },
  geen_reactie: { label: "Geen reactie", kleur: "#FBE3DE", tekst: "#A2321F" },
  gestopt: { label: "Gestopt", kleur: "#F4F1EC", tekst: "#5C594F" },
};

const DAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];

function StatusChip({ status }: { status: string }) {
  const s = STATUS[status] || { label: status, kleur: "#F4F1EC", tekst: "#5C594F" };
  return <span style={{ display: "inline-flex", alignItems: "center", height: 24, padding: "0 10px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: s.kleur, color: s.tekst, whiteSpace: "nowrap" }}>{s.label}</span>;
}

async function haal<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { credentials: "include", ...init });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`);
  return d as T;
}

function tijdGeleden(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 60) return `${Math.max(min, 0)} min`;
  const uur = Math.round(min / 60);
  if (uur < 48) return `${uur} uur`;
  return `${Math.round(uur / 24)} dagen`;
}

const kaart: React.CSSProperties = { background: "#fff", border: "1px solid #E9E5DD", borderRadius: 16, padding: "18px 20px" };
const knop = (donker = false): React.CSSProperties => ({
  height: 34, padding: "0 12px", borderRadius: 9, border: `1px solid ${donker ? "#37352C" : "#DDD8CE"}`, background: donker ? "#37352C" : "#fff",
  color: donker ? "#F8F7F4" : "#37352C", font: "600 13px inherit", cursor: "pointer", whiteSpace: "nowrap",
});
const th: React.CSSProperties = { textAlign: "left", fontSize: 12, color: "#8A8478", fontWeight: 600, padding: "0 10px 8px", borderBottom: "1px solid #E4E0D8" };
const td: React.CSSProperties = { padding: "10px", borderBottom: "1px solid #F0ECE5", fontSize: 13.5, verticalAlign: "top" };

interface JobStatusInfo { aan: boolean; testomgeving: boolean; handmatigStarten: boolean; ai: boolean; whatsapp: boolean; sjablonen: { start: boolean; herinnering: boolean; afspraak: boolean } }
interface Rij { id: number; candidateId: number; voornaam: string; achternaam: string; functie: string; status: Status; kanaal: string; taal: string; twijfels: string[]; laatsteActiviteitAt: string; link: string }
interface Interviewer { naam: string; dagen: number[]; van: string; tot: string; pauzeVan?: string | null; pauzeTot?: string | null; actief?: boolean }
interface Afspraak { id: number; candidateId: number; voornaam: string; achternaam: string; functie: string; interviewer: string; datum: string; tijd: string }
interface Kandidaat { id: number; firstName: string; lastName: string; functionType: string; email: string | null }

export function JobBeheer() {
  const [status, setStatus] = useState<JobStatusInfo | null>(null);
  const [rijen, setRijen] = useState<Rij[]>([]);
  const [tellers, setTellers] = useState<Record<string, number>>({});
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [afspraken, setAfspraken] = useState<Afspraak[]>([]);
  const [zonder, setZonder] = useState<Kandidaat[]>([]);
  const [filter, setFilter] = useState<string>("alle");
  const [melding, setMelding] = useState("");
  const [fout, setFout] = useState("");
  const [bewaren, setBewaren] = useState(false);

  async function laad() {
    try {
      const [s, o, i, a] = await Promise.all([
        haal<JobStatusInfo>("/api/admin/job/status"),
        haal<{ tellers: Record<string, number>; gesprekken: Rij[] }>("/api/admin/job/overzicht"),
        haal<{ interviewers: Interviewer[] }>("/api/admin/job/interviewers"),
        haal<{ afspraken: Afspraak[] }>("/api/admin/job/afspraken"),
      ]);
      setStatus(s); setRijen(o.gesprekken); setTellers(o.tellers); setInterviewers(i.interviewers); setAfspraken(a.afspraken);
      if (s.handmatigStarten) {
        const z = await haal<{ kandidaten: Kandidaat[] }>("/api/admin/job/zonder-gesprek").catch(() => ({ kandidaten: [] }));
        setZonder(z.kandidaten);
      }
    } catch (e: any) {
      setFout(e?.message || "Laden mislukt");
    }
  }
  useEffect(() => { void laad(); }, []);

  async function startJob(id: number) {
    setFout(""); setMelding("");
    try {
      const r = await haal<{ link: string; kanaal: string }>(`/api/admin/job/start/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kanaal: "web" }) });
      window.open(r.link, "_blank", "noopener");
      setMelding("Job is gestart. Het gesprek staat open in een nieuw tabblad: speel daar de kandidaat.");
      void laad();
    } catch (e: any) { setFout(e?.message || "Starten mislukt"); }
  }

  async function klokVooruit(uren: number) {
    setFout(""); setMelding("");
    try {
      const r = await haal<{ herinneringen: number; rood: number; afspraken: number }>("/api/admin/job/herinneringen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ klokVooruitUren: uren }) });
      setMelding(`Klok ${uren} uur vooruit: ${r.herinneringen} herinneringen, ${r.rood} keer rood, ${r.afspraken} afspraakherinneringen. Kijk in het mailvenster en in de gesprekken.`);
      void laad();
    } catch (e: any) { setFout(e?.message || "Mislukt"); }
  }

  async function bewaarWerktijden() {
    setBewaren(true); setFout(""); setMelding("");
    try {
      const r = await haal<{ interviewers: Interviewer[] }>("/api/admin/job/interviewers", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interviewers }) });
      setInterviewers(r.interviewers);
      setMelding("Werktijden bewaard. Nieuwe momenten gelden meteen.");
    } catch (e: any) { setFout(e?.message || "Bewaren mislukt"); }
    finally { setBewaren(false); }
  }

  function wijzig(i: number, deel: Partial<Interviewer>) {
    setInterviewers((oud) => oud.map((x, j) => (j === i ? { ...x, ...deel } : x)));
  }

  const zichtbaar = filter === "alle" ? rijen : rijen.filter((r) => r.status === filter);
  const vlag = (ok: boolean, ja: string, nee: string) => (
    <span style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 13.5 }}>
      <b style={{ color: ok ? "#3E8E5A" : "#C2412D" }}>{ok ? "✓" : "✕"}</b>{ok ? ja : nee}
    </span>
  );

  return (
    <div>
      <D3Kop titel="Job" uitleg="De AI-recruiter: gesprekken, kennismakingen en werktijden van de interviewers.">
        <button type="button" style={knop()} onClick={() => void laad()}>Vernieuwen</button>
      </D3Kop>
      {fout && <p role="alert" style={{ background: "#FBE3DE", color: "#A2321F", padding: "10px 14px", borderRadius: 10, fontSize: 13.5 }}>{fout}</p>}
      {melding && <p role="status" style={{ background: "#E6F0E2", color: "#2F6B3E", padding: "10px 14px", borderRadius: 10, fontSize: 13.5 }}>{melding}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginTop: 12 }}>
        <section style={kaart}>
          <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>Wat er klaarstaat</h2>
          {status ? (
            <div style={{ display: "grid", gap: 6 }}>
              {vlag(status.aan, "Job start na elke aanmelding (JOB_ENABLED)", "Job start niet vanzelf (JOB_ENABLED staat uit)")}
              {vlag(status.ai, "AI bereikbaar", "Geen AI: Job leest antwoorden met vaste regels")}
              {vlag(status.whatsapp, "WhatsApp gekoppeld", "WhatsApp niet gekoppeld: Job praat via het webgesprek")}
              {vlag(status.sjablonen.start, "Startsjabloon ingesteld", "Geen startsjabloon: link per mail")}
              {vlag(status.sjablonen.herinnering, "Herinneringssjabloon ingesteld", "Geen herinneringssjabloon: herinnering per mail")}
              {vlag(status.sjablonen.afspraak, "Afspraaksjabloon ingesteld", "Geen afspraaksjabloon")}
              {status.testomgeving && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#7A6200" }}>Testomgeving: Job mag hier met de hand gestart worden.</p>}
            </div>
          ) : <p>Laden…</p>}
        </section>

        <section style={kaart}>
          <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>Stand</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(["planner", "geen_reactie", "bezig", "wacht_cv", "plannen", "gepland", "gestopt"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setFilter(filter === s ? "alle" : s)}
                style={{ ...knop(filter === s), display: "inline-flex", gap: 8, alignItems: "center" }}>
                {STATUS[s].label} <b>{tellers[s] || 0}</b>
              </button>
            ))}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#8A8478" }}>Klik op een stand om te filteren. Geel en rood vragen om een collega.</p>
        </section>

        {status?.handmatigStarten && (
          <section style={kaart}>
            <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>{status.testomgeving ? "Simulator" : "Job met de hand starten"}</h2>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "#5C594F" }}>Start Job voor een kandidaat zonder gesprek. Het webgesprek opent in een nieuw tabblad{status.testomgeving ? ": jij speelt de kandidaat" : ""}.</p>
            <div style={{ display: "grid", gap: 6, maxHeight: 180, overflowY: "auto" }}>
              {zonder.length === 0 && <p style={{ fontSize: 13, color: "#8A8478" }}>Geen kandidaten zonder gesprek.</p>}
              {zonder.map((k) => (
                <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13.5 }}><b>{k.firstName} {k.lastName}</b> <span style={{ color: "#8A8478" }}>{k.functionType}</span></span>
                  <button type="button" style={knop(true)} onClick={() => void startJob(k.id)}>Start Job</button>
                </div>
              ))}
            </div>
            {status.testomgeving && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F0ECE5" }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#5C594F" }}>Klok vooruit, om de herinneringen te testen:</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[22, 48, 70, 120].map((u) => <button key={u} type="button" style={knop()} onClick={() => void klokVooruit(u)}>+{u} uur</button>)}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <section style={{ ...kaart, marginTop: 16 }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>Gesprekken</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>Kandidaat</th><th style={th}>Stand</th><th style={th}>Kanaal</th><th style={th}>Laatst actief</th><th style={th}>Waarom een collega</th><th style={th}></th></tr></thead>
            <tbody>
              {zichtbaar.length === 0 && <tr><td style={td} colSpan={6}>Nog geen gesprekken.</td></tr>}
              {zichtbaar.map((r) => (
                <tr key={r.id}>
                  <td style={td}><b>{r.voornaam} {r.achternaam}</b><br /><span style={{ color: "#8A8478", fontSize: 12.5 }}>{r.functie}</span></td>
                  <td style={td}><StatusChip status={r.status} /></td>
                  <td style={td}>{r.kanaal === "whatsapp" ? "WhatsApp" : "Web"}{r.taal === "en" ? " · EN" : ""}</td>
                  <td style={td}>{tijdGeleden(r.laatsteActiviteitAt)} geleden</td>
                  <td style={{ ...td, maxWidth: 360, color: "#5C594F" }}>{(r.twijfels || []).join(" ")}</td>
                  <td style={td}><a href={r.link} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>Open gesprek</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 16, marginTop: 16 }}>
        <section style={kaart}>
          <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>Kennismakingen gepland door Job</h2>
          {afspraken.length === 0 && <p style={{ fontSize: 13.5, color: "#8A8478" }}>Nog geen kennismakingen gepland.</p>}
          {afspraken.map((a) => (
            <div key={a.id} style={{ display: "grid", gridTemplateColumns: "110px 60px 1fr auto", gap: 10, padding: "8px 0", borderTop: "1px solid #F0ECE5", fontSize: 13.5 }}>
              <span>{new Date(`${a.datum}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}</span>
              <b>{a.tijd}</b>
              <span>{a.voornaam} {a.achternaam} <span style={{ color: "#8A8478" }}>{a.functie}</span></span>
              <span style={{ color: "#5C594F" }}>{a.interviewer}</span>
            </div>
          ))}
        </section>

        <section style={kaart}>
          <h2 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800 }}>Werktijden voor gesprekken</h2>
          <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#8A8478" }}>Gesprekken duren een half uur. Job biedt alleen tijden aan waarop iemand vrij is, vanaf morgen.</p>
          {interviewers.map((i, n) => (
            <div key={i.naam} style={{ padding: "10px 0", borderTop: "1px solid #F0ECE5", display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b>{i.naam}</b>
                <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="checkbox" checked={i.actief !== false} onChange={(e) => wijzig(n, { actief: e.target.checked })} /> Doet gesprekken
                </label>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }} role="group" aria-label={`Werkdagen ${i.naam}`}>
                {DAGEN.map((d, k) => {
                  const aan = i.dagen.includes(k + 1);
                  return (
                    <button key={d} type="button" aria-pressed={aan} onClick={() => wijzig(n, { dagen: aan ? i.dagen.filter((x) => x !== k + 1) : [...i.dagen, k + 1].sort() })}
                      style={{ ...knop(aan), height: 30, padding: "0 10px" }}>{d}</button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 13 }}>
                <label>Van <input type="time" step={1800} value={i.van} onChange={(e) => wijzig(n, { van: e.target.value })} /></label>
                <label>tot <input type="time" step={1800} value={i.tot} onChange={(e) => wijzig(n, { tot: e.target.value })} /></label>
                <label>Pauze <input type="time" step={1800} value={i.pauzeVan || ""} onChange={(e) => wijzig(n, { pauzeVan: e.target.value || null })} /></label>
                <label>tot <input type="time" step={1800} value={i.pauzeTot || ""} onChange={(e) => wijzig(n, { pauzeTot: e.target.value || null })} /></label>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" style={knop(true)} disabled={bewaren} onClick={() => void bewaarWerktijden()}>{bewaren ? "Bewaren…" : "Werktijden bewaren"}</button>
          </div>
        </section>
      </div>
    </div>
  );
}

interface PaneelData {
  gesprek: null | { id: number; status: string; kanaal: string; taal: string; velden: Record<string, any>; twijfels: string[]; gestartAt: string; link: string };
  berichten?: { id: number; richting: string; tekst: string; aangemaaktAt: string }[];
  afspraak?: { datum: string; tijd: string; interviewer: string } | null;
  magStarten: boolean;
}

const VELD_LABEL: Record<string, string> = {
  ervaring: "Ervaring", functievraag: "Vervolgvraag", specialisatie: "Evenementen en banqueting", werkautorisatie: "Werkautorisatie",
  geldigTot: "Document geldig tot", diensten: "Diensten per week", werkgebied: "Werkgebied", vervoer: "Vervoer", talen: "Talen", cvParaat: "Cv paraat", zoekt: "Zoekt",
};

/** Het gesprek met Job op de kandidaatkaart. */
export function JobGesprekPaneel({ candidateId }: { candidateId: number }) {
  const [data, setData] = useState<PaneelData | null>(null);
  const [open, setOpen] = useState(false);
  const [fout, setFout] = useState("");

  async function laad() {
    try { setData(await haal<PaneelData>(`/api/admin/job/kandidaat/${candidateId}`)); } catch (e: any) { setFout(e?.message || "Laden mislukt"); }
  }
  useEffect(() => { setData(null); setOpen(false); void laad(); }, [candidateId]);

  async function start() {
    try {
      const r = await haal<{ link: string }>(`/api/admin/job/start/${candidateId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kanaal: "web" }) });
      window.open(r.link, "_blank", "noopener");
      void laad();
    } catch (e: any) { setFout(e?.message || "Starten mislukt"); }
  }

  if (!data) return null;
  const g = data.gesprek;
  return (
    <section style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #E4E0D8" }} aria-label="Gesprek met Job">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <b style={{ fontSize: 14.5 }}>Gesprek met Job</b>
        {g ? <StatusChip status={g.status} /> : null}
      </div>
      {fout && <p style={{ color: "#A2321F", fontSize: 13 }}>{fout}</p>}
      {!g && (
        <div style={{ marginTop: 8, fontSize: 13.5, color: "#5C594F" }}>
          <p style={{ margin: "0 0 8px" }}>Nog geen gesprek met Job.</p>
          {data.magStarten && <button type="button" style={knop(true)} onClick={() => void start()}>Start Job</button>}
        </div>
      )}
      {g && (
        <div style={{ marginTop: 8, fontSize: 13.5 }}>
          {g.twijfels?.length > 0 && (
            <p style={{ margin: "0 0 8px", background: "#FFF6D6", color: "#7A6200", padding: "8px 10px", borderRadius: 10 }}><b>Waarom een collega moet kijken:</b> {g.twijfels.join(" ")}</p>
          )}
          {data.afspraak && <p style={{ margin: "0 0 8px" }}><b>Kennismaking:</b> {new Date(`${data.afspraak.datum}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })} om {data.afspraak.tijd} met {data.afspraak.interviewer}</p>}
          {Object.keys(VELD_LABEL).filter((k) => g.velden?.[k] !== undefined && g.velden?.[k] !== "").map((k) => [k, g.velden[k]] as const).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0", borderBottom: "1px solid #F7F4EF" }}>
              <span style={{ color: "#8A8478" }}>{VELD_LABEL[k]}</span>
              <span style={{ textAlign: "right", fontWeight: 500 }}>{String(v)}</span>
            </div>
          ))}
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#8A8478" }}>Zelf opgegeven aan Job; een collega bevestigt het bij de kennismaking.</p>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" style={knop()} onClick={() => setOpen(!open)}>{open ? "Verberg gesprek" : `Toon gesprek (${data.berichten?.length || 0})`}</button>
            <a href={g.link} target="_blank" rel="noopener noreferrer" style={{ ...knop(), display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Open webgesprek</a>
          </div>
          {open && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto", background: "#F2EEE7", borderRadius: 12, padding: 10 }}>
              {(data.berichten || []).map((b) => (
                <div key={b.id} style={{ alignSelf: b.richting === "in" ? "flex-end" : "flex-start", maxWidth: "88%", background: b.richting === "in" ? "#E3F0E5" : "#fff", borderRadius: 12, padding: "7px 10px", fontSize: 12.5, whiteSpace: "pre-wrap" }}>{b.tekst}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
