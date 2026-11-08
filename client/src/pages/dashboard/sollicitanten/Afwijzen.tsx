/**
 * Afwijzen met reden en mail (borden H2 en H3, D10). Elke knop Afwijzen in de
 * flow gebruikt deze dialoog, ook Niet verschenen, een negatieve referentie en
 * Afwijzen vanuit Kandidaten.
 */
import { useEffect, useState } from "react";
import { redenenVoor, standaardReden, type ArchiefHerkomst } from "@shared/sollicitantRegels";
import { Dialoog, Knop, api } from "./gedeeld";

interface Voorbeeld { onderwerp: string; html: string; tekst: string; kern: string; naar: string | null; aan: boolean; standaardGeenMail: boolean }

export function AfwijzenDialoog({ id, naam, voornaam, stap, aanleiding, sluit, klaar }: {
  id: number; naam: string; voornaam: string; stap: ArchiefHerkomst;
  aanleiding?: "niet_verschenen" | "negatief";
  sluit: () => void; klaar: (r: { verstuurd: boolean }) => void;
}) {
  const redenen = redenenVoor(stap);
  const [reden, setReden] = useState(standaardReden(stap, aanleiding));
  const [eigen, setEigen] = useState("");
  const [voorbeeld, setVoorbeeld] = useState<Voorbeeld | null>(null);
  const [aanpassen, setAanpassen] = useState(false);
  const [mailTekst, setMailTekst] = useState("");
  const [mailSturen, setMailSturen] = useState(true);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  useEffect(() => {
    if (!reden) { setVoorbeeld(null); return; }
    let weg = false;
    api<Voorbeeld>(`/api/sollicitanten/afwijsmail/${id}`, { method: "POST", body: { reden, mailTekst: aanpassen ? mailTekst : undefined } })
      .then((v) => {
        if (weg) return;
        setVoorbeeld(v);
        if (!aanpassen) setMailTekst(v.kern);
        setMailSturen(v.aan && !v.standaardGeenMail);
      })
      .catch((e) => !weg && setFout(e.message));
    return () => { weg = true; };
    // mailTekst zit er bewust niet in: bij typen hoeft het voorbeeld niet elke letter opnieuw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reden, aanpassen]);

  async function bevestig() {
    if (!reden) return setFout("Kies een reden.");
    if (reden === "anders" && !eigen.trim()) return setFout("Vul de reden in bij Anders.");
    setBezig(true); setFout("");
    try {
      const r = await api<{ verstuurd: boolean }>(`/api/sollicitanten/actie/${id}`, {
        method: "POST",
        body: { actie: "afwijzen", reden, redenTekst: eigen, mail: mailSturen, mailTekst: aanpassen ? mailTekst : undefined },
      });
      klaar(r);
    } catch (e: any) { setFout(e.message); setBezig(false); }
  }

  return (
    <Dialoog titel={`${naam} afwijzen`} sluit={sluit}>
      <p className="sv-sub" style={{ marginBottom: 14 }}>Kies een reden. {voornaam} krijgt daarna automatisch een vriendelijke mail die bij die reden past.</p>
      <div role="radiogroup" aria-label="Reden" style={{ display: "grid", gap: 6 }}>
        {redenen.map((r) => (
          <label key={r.code} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, padding: "0 12px", borderRadius: 10, cursor: "pointer", border: reden === r.code ? "2px solid #37352C" : "1px solid #E4E0D8", background: reden === r.code ? "#F6F3EE" : "#fff" }}>
            <input type="radio" name="reden" style={{ accentColor: "#37352C", width: 18, height: 18 }} checked={reden === r.code} onChange={() => { setReden(r.code); setAanpassen(false); }} />
            <span style={{ fontWeight: 600 }}>{r.label}</span>
          </label>
        ))}
      </div>
      {reden === "anders" && (
        <label className="sv-veld" style={{ marginTop: 10 }}><span>Reden</span><input type="text" value={eigen} onChange={(e) => setEigen(e.target.value)} placeholder="Korte reden voor het archief" maxLength={200} /></label>
      )}
      {voorbeeld && (
        <div style={{ background: "#F6F3EE", borderRadius: 14, padding: 16, marginTop: 14 }}>
          <div className="sv-tussen" style={{ marginBottom: 8 }}>
            <span className="sv-lbl" style={{ margin: 0 }}>VOORBEELD VAN DE MAIL</span>
            {voorbeeld.aan && <button type="button" className="sv-knop sv-knop-link" onClick={() => setAanpassen((a) => !a)}>{aanpassen ? "Standaardtekst" : "Mail aanpassen"}</button>}
          </div>
          {voorbeeld.aan ? (
            <>
              <p className="sv-klein" style={{ marginBottom: 8 }}>Aan {voorbeeld.naar} · {voorbeeld.onderwerp}</p>
              {aanpassen ? (
                <textarea value={mailTekst} onChange={(e) => setMailTekst(e.target.value)} aria-label="Tekst van de mail" style={{ minHeight: 120 }} />
              ) : (
                <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5 }}>{voorbeeld.tekst}</div>
              )}
              <label className="sv-rij" style={{ marginTop: 10, fontWeight: 600 }}>
                <input type="checkbox" style={{ accentColor: "#37352C", width: 18, height: 18 }} checked={mailSturen} onChange={(e) => setMailSturen(e.target.checked)} /> Mail versturen
              </label>
            </>
          ) : (
            <p className="sv-klein">{voorbeeld.naar ? "De afwijsmail staat uit. Afwijzen werkt, er gaat geen mail." : `Er is geen e-mailadres bekend van ${voornaam}. Afwijzen werkt, er gaat geen mail.`}</p>
          )}
        </div>
      )}
      {fout && <div className="sv-fout">{fout}</div>}
      <div className="sv-rij" style={{ justifyContent: "flex-end", marginTop: 18, position: "sticky", bottom: -24, background: "#fff", padding: "12px 0 4px", borderTop: "1px solid #EEEAE3" }}>
        <Knop onClick={sluit}>Annuleren</Knop>
        <Knop soort="donker" onClick={bevestig} disabled={bezig || !reden}>{mailSturen && voorbeeld?.aan ? "Afwijzen en mail versturen" : "Afwijzen"}</Knop>
      </div>
    </Dialoog>
  );
}
