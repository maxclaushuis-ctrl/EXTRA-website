/**
 * Gele balk bovenin het dashboard van de testomgeving, met het mailvenster.
 *
 * Toont niets in productie: de balk verschijnt alleen als de server zegt
 * dat TESTOMGEVING=1 aanstaat. Het mailvenster laat elke mail zien die de
 * app in testmodus 'verstuurd' heeft, met ontvanger, onderwerp en de
 * volledige inhoud, zodat testers bevestigingen en afwijzingsmails kunnen
 * nalezen zonder dat er iets naar buiten gaat.
 */
import { useEffect, useState } from "react";

interface Status {
  testomgeving: boolean;
  mailMock: boolean;
}

interface TestMail {
  id: string;
  to: string | string[];
  from?: string;
  subject: string;
  text: string;
  html: string;
  attachments: string[];
  timestamp: string;
}

const GEEL = "#F2B866";
const ESPRESSO = "#37352C";

function tijd(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ontvanger(to: string | string[]): string {
  return Array.isArray(to) ? to.join(", ") : to;
}

export function TestomgevingBalk() {
  const [status, setStatus] = useState<Status | null>(null);
  const [open, setOpen] = useState(false);
  const [mails, setMails] = useState<TestMail[]>([]);
  const [gekozen, setGekozen] = useState<TestMail | null>(null);
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState("");

  useEffect(() => {
    let actief = true;
    fetch("/api/testomgeving/status", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (actief && s) setStatus(s); })
      .catch(() => { /* geen balk */ });
    return () => { actief = false; };
  }, []);

  async function haalMails() {
    setLaden(true);
    setFout("");
    try {
      const r = await fetch("/api/testomgeving/mails", { credentials: "include" });
      if (!r.ok) throw new Error(`Mailvenster niet beschikbaar (${r.status})`);
      const data = await r.json();
      setMails(data.mails || []);
      if (!data.mailMock) setFout("Let op: de mail staat niet in testmodus. Haal SENDGRID_API_KEY uit de Secrets van deze testomgeving.");
    } catch (e: any) {
      setFout(e?.message || "Ophalen mislukt");
    } finally {
      setLaden(false);
    }
  }

  useEffect(() => {
    if (open) void haalMails();
  }, [open]);

  if (!status?.testomgeving) return null;

  return (
    <>
      <div
        role="status"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
          background: GEEL, color: ESPRESSO,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
          height: 36, padding: "0 12px",
        }}
      >
        <span>Testomgeving · fictieve gegevens · mails gaan niet naar buiten</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            height: 26, padding: "0 10px", borderRadius: 8, border: `1px solid ${ESPRESSO}`,
            background: ESPRESSO, color: "#F8F7F4", font: "inherit", cursor: "pointer",
          }}
        >
          Mailvenster
        </button>
      </div>
      <div aria-hidden="true" style={{ height: 36 }} />

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mailvenster van de testomgeving"
          style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(55,53,44,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => { setOpen(false); setGekozen(null); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1100px, 100%)", height: "min(760px, 100%)", background: "#fff", borderRadius: 16,
              display: "grid", gridTemplateColumns: gekozen ? "340px minmax(0, 1fr)" : "1fr", gridTemplateRows: "auto minmax(0, 1fr)",
              overflow: "hidden", color: ESPRESSO, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}
          >
            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid #E4E0D8" }}>
              <strong style={{ fontSize: 16 }}>Mailvenster</strong>
              <span style={{ fontSize: 13, color: "#6B665C" }}>{mails.length} mails in testmodus, nieuwste eerst. Verdwijnen bij een herstart van de app.</span>
              <span style={{ flex: 1 }} />
              <button type="button" onClick={() => void haalMails()} disabled={laden} style={knop(false)}>{laden ? "Laden…" : "Vernieuwen"}</button>
              <button type="button" onClick={() => { setOpen(false); setGekozen(null); }} style={knop(true)}>Sluiten</button>
            </div>

            <div style={{ overflowY: "auto", borderRight: gekozen ? "1px solid #E4E0D8" : undefined }}>
              {fout && <p style={{ margin: 0, padding: "12px 18px", background: "#FBE3DE", color: "#A2321F", fontSize: 13 }}>{fout}</p>}
              {mails.length === 0 && !laden && !fout && (
                <p style={{ margin: 0, padding: "24px 18px", fontSize: 14, color: "#6B665C" }}>Nog geen mails. Doe iets in het dashboard dat een mail verstuurt, bijvoorbeeld een sollicitant afwijzen, en klik op Vernieuwen.</p>
              )}
              {mails.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setGekozen(m)}
                  style={{
                    display: "block", width: "100%", textAlign: "left", padding: "12px 18px", border: 0,
                    borderBottom: "1px solid #F0ECE5", background: gekozen?.id === m.id ? "#F4F2EE" : "#fff", cursor: "pointer", font: "inherit", color: "inherit",
                  }}
                >
                  <span style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, color: "#8A8478" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Aan {ontvanger(m.to)}</span>
                    <span style={{ flex: "none" }}>{tijd(m.timestamp)}</span>
                  </span>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 700, marginTop: 2 }}>{m.subject || "(geen onderwerp)"}</span>
                  {m.attachments.length > 0 && <span style={{ display: "block", fontSize: 12, color: "#6B665C", marginTop: 2 }}>Bijlage: {m.attachments.join(", ")}</span>}
                </button>
              ))}
            </div>

            {gekozen && (
              <div style={{ display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", minWidth: 0 }}>
                <div style={{ padding: "12px 18px", borderBottom: "1px solid #E4E0D8", fontSize: 13 }}>
                  <div><b>Aan:</b> {ontvanger(gekozen.to)}</div>
                  {gekozen.from && <div><b>Van:</b> {gekozen.from}</div>}
                  <div><b>Onderwerp:</b> {gekozen.subject}</div>
                </div>
                {gekozen.html ? (
                  <iframe title="Inhoud van de mail" sandbox="" srcDoc={gekozen.html} style={{ width: "100%", height: "100%", border: 0, background: "#fff" }} />
                ) : (
                  <pre style={{ margin: 0, padding: 18, overflow: "auto", whiteSpace: "pre-wrap", font: "13px/1.5 inherit" }}>{gekozen.text || "(lege mail)"}</pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function knop(donker: boolean): React.CSSProperties {
  return {
    height: 32, padding: "0 12px", borderRadius: 9, cursor: "pointer", font: "inherit", fontSize: 13, fontWeight: 600,
    border: `1px solid ${donker ? ESPRESSO : "#DDD8CE"}`, background: donker ? ESPRESSO : "#fff", color: donker ? "#F8F7F4" : ESPRESSO,
  };
}
