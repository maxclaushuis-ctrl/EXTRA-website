/**
 * Cv uploaden (/cv-upload) in design 3.0. Bron: mock-up cv-upload.html.
 *
 * Werkt alleen met een persoonlijke link (?token=...) uit de mail of het
 * WhatsApp-bericht. De endpoints en regels zijn ongewijzigd:
 *  - GET  /api/cv-upload-token?token=  controleert de link
 *  - POST /api/cv-upload-token         stuurt het cv (FormData: cv, token)
 *  - PDF, DOC of DOCX, maximaal 10 MB
 *
 * 'geenlink' staat los van 'verlopen'. Wie hier zónder token binnenkomt heeft
 * geen kapotte link, die heeft er nooit een gehad (bijvoorbeeld via een
 * zoekresultaat). Die krijgt uitleg en de weg naar aanmelden.
 *
 * 'storing' staat los van 'verlopen'. fetchJson gooit bij een foutstatus; een
 * serverfout betekent niet dat de link ongeldig is, dus dan vragen we om het
 * opnieuw te proberen in plaats van de kandidaat weg te sturen.
 *
 * De link naar het sollicitatieformulier is weg: dat is een intern formulier
 * voor het intakegesprek, geen route voor kandidaten.
 */
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Shell from "@/design3/Shell";
import { Ic, Pijl } from "@/design3/basis";
import { fetchJson } from "@/lib/queryClient";
import { Direct } from "./d3/Aanvraag";

type Staat = "laden" | "klaar" | "bezig" | "gelukt" | "al" | "verlopen" | "geenlink" | "storing";

const WHATSAPP = "https://wa.me/31851305915";
const TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX = 10 * 1024 * 1024;

const grootte = (b: number) =>
  b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} kB` : `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;

const extensie = (naam: string) => (naam.split(".").pop() || "").toUpperCase().slice(0, 4);

export default function CvUpload() {
  const [staat, setStaat] = useState<Staat>("laden");
  const [voornaam, setVoornaam] = useState("");
  const [bestand, setBestand] = useState<File | null>(null);
  const [fout, setFout] = useState("");
  const invoer = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") : null;

  useEffect(() => {
    if (!token) { setStaat("geenlink"); return; }
    fetchJson<{ valid?: boolean; firstName?: string }>(`/api/cv-upload-token?token=${encodeURIComponent(token)}`)
      .then((data) => {
        if (data.valid === false) setStaat("al");
        else if (data.valid) { setVoornaam(data.firstName || ""); setStaat("klaar"); }
        else setStaat("verlopen");
      })
      .catch(() => setStaat("storing"));
  }, [token]);

  function kies(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!TYPES.includes(f.type)) {
      setFout("Dit bestand werkt niet. Alleen PDF, DOC of DOCX tot 10 MB. Heb je alleen een foto? App ons, dan helpen we je verder.");
      setBestand(null);
      return;
    }
    if (f.size > MAX) {
      setFout("Je bestand is groter dan 10 MB. Kies een kleiner bestand of app ons, dan helpen we je verder.");
      setBestand(null);
      return;
    }
    setFout("");
    setBestand(f);
  }

  async function upload() {
    if (!bestand || !token) return;
    setStaat("bezig");
    try {
      const fd = new FormData();
      fd.append("cv", bestand);
      fd.append("token", token);
      const res = await fetch("/api/cv-upload-token", { method: "POST", body: fd });
      if (res.ok) { setStaat("gelukt"); return; }
      const data = await res.json().catch(() => ({}));
      setFout(data.message || "Er ging iets mis. Probeer het opnieuw.");
      setStaat("klaar");
    } catch {
      setFout("Geen verbinding. Controleer je internet en probeer het opnieuw.");
      setStaat("klaar");
    }
  }

  const kop = voornaam ? `Hi ${voornaam}, upload hier je cv` : "Upload hier je cv";

  return (
    <Shell css={["events", "hotels", "werk", "bedrijf", "aanvraag", "pagina"]} bodyKlasse="aanvraagpag" werkzoekende telKnop>
      <section className="av-pag am-pag">
        <div className="w av-grid">
          <div className="av-links">
            <span className="eyebrow">Je aanmelding</span>
            <h1 className="av-h1">Nog één stap: <span className="serif">je cv</span></h1>
            <p className="av-lead">Zodra we je cv hebben, bekijken we je aanmelding en hoor je snel van ons.</p>
            <ol className="av-stappen">
              <li><b>Upload je cv</b><span>PDF, DOC of DOCX. Een foto van je cv werkt niet.</span></li>
              <li><b>Wij kijken mee</b><span>Ons team bekijkt je aanmelding en je cv.</span></li>
              <li><b>Plan je gesprek</b><span>Past je profiel, dan krijg je een mail om zelf een moment te kiezen.</span></li>
            </ol>
            <Direct label="Vraag?" />
          </div>

          <div className="av-kaart cv-kaart" id="cv" aria-live="polite">
            {staat === "laden" && (
              <div className="cv-midden" role="status">
                <div className="cv-balk" aria-hidden="true"><i /></div>
                <p className="cv-tekst">Je link wordt gecontroleerd.</p>
              </div>
            )}

            {staat === "klaar" && (
              <div className="cv-kaart">
                <h2 className="cv-kop">{kop}</h2>
                <p className="cv-tekst">
                  {bestand ? "Klopt het bestand? Dan kun je het nu versturen." : "Kies het bestand op je telefoon of computer. Daarna is je aanmelding compleet."}
                </p>
                <input ref={invoer} type="file" accept=".pdf,.doc,.docx" onChange={kies} className="cv-verborgen" tabIndex={-1} aria-hidden="true" />
                {bestand ? (
                  <div className="cv-bestand">
                    <span className="doc">{extensie(bestand.name)}</span>
                    <div><b>{bestand.name}</b><span>{grootte(bestand.size)}</span></div>
                    <button type="button" onClick={() => invoer.current?.click()}>Ander bestand</button>
                  </div>
                ) : (
                  <label className="am-upload">
                    <input type="file" accept=".pdf,.doc,.docx" onChange={kies} />
                    <b>Kies bestand</b><span>PDF, DOC of DOCX (max. 10 MB)</span>
                  </label>
                )}
                {fout && <p className="cv-fout" role="alert">{fout}</p>}
                <button className="knop vol cv-knop" type="button" disabled={!bestand} onClick={upload}>Upload je cv <Pijl /></button>
                <p className="cv-privacy">We gebruiken je cv alleen voor je aanmelding. Lees ons <a href="/privacybeleid">privacybeleid</a>.</p>
              </div>
            )}

            {staat === "bezig" && bestand && (
              <div className="cv-kaart" role="status">
                <h2 className="cv-kop">Je cv wordt verstuurd</h2>
                <div className="cv-bestand">
                  <span className="doc">{extensie(bestand.name)}</span>
                  <div><b>{bestand.name}</b><span>{grootte(bestand.size)}</span></div>
                </div>
                <div className="cv-balk" aria-hidden="true"><i /></div>
                <p className="cv-privacy">Sluit deze pagina niet, het duurt een paar seconden.</p>
              </div>
            )}

            {staat === "gelukt" && (
              <div className="am-klaar" role="status">
                <span className="am-vink cv-vink"><Ic n="vink" /></span>
                <h2>{voornaam ? `Top ${voornaam}, je cv ` : "Top, je cv "}<span className="serif">is binnen!</span></h2>
                <p>We bekijken je aanmelding. Past je profiel, dan krijg je een mail om zelf een moment voor het gesprek te kiezen.</p>
                <a className="knop vol" href="/vacatures">Bekijk de vacatures <Pijl /></a>
              </div>
            )}

            {staat === "al" && (
              <div className="cv-midden">
                <span className="cv-icoon"><Ic n="vink" /></span>
                <h2 className="cv-kop">Je cv hebben we al</h2>
                <p className="cv-tekst">We hebben je cv al goed ontvangen. Je hoort van ons zodra we je aanmelding hebben bekeken.</p>
                <a className="knop lijn" href="/vacatures">Bekijk de vacatures <Pijl /></a>
              </div>
            )}

            {staat === "geenlink" && (
              <div className="cv-midden">
                <span className="cv-icoon"><Ic n="doc" /></span>
                <h2 className="cv-kop">Upload je cv</h2>
                <p className="cv-tekst">Je cv uploaden gaat via een persoonlijke link die je van ons krijgt. Heb je die nog niet? Meld je dan eerst aan, daarna sturen we hem toe.</p>
                <div className="cv-rij">
                  <a className="knop vol" href="/aanmelden">Solliciteer direct <Pijl /></a>
                  <a className="knop lijn" href={WHATSAPP}>App ons je vraag</a>
                </div>
              </div>
            )}

            {staat === "verlopen" && (
              <div className="cv-midden">
                <span className="cv-icoon"><Ic n="snel" /></span>
                <h2 className="cv-kop">Deze link werkt niet meer</h2>
                <p className="cv-tekst">De link is al gebruikt of niet meer geldig. Heb je nog geen cv gestuurd? App ons even, dan sturen we een nieuwe.</p>
                <div className="cv-rij"><a className="knop vol" href={WHATSAPP}>App ons op WhatsApp <Pijl /></a></div>
              </div>
            )}

            {staat === "storing" && (
              <div className="cv-midden">
                <span className="cv-icoon"><Ic n="snel" /></span>
                <h2 className="cv-kop">Even niet bereikbaar</h2>
                <p className="cv-tekst">We konden je link nu niet controleren. Probeer het zo nog een keer, je link blijft gewoon geldig.</p>
                <div className="cv-rij"><button className="knop vol" type="button" onClick={() => window.location.reload()}>Opnieuw proberen <Pijl /></button></div>
              </div>
            )}
          </div>
        </div>
      </section>
    </Shell>
  );
}
