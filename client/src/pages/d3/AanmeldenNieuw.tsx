/**
 * Aanmeldformulier 3 (bord A, A2; ontwerp fase 1 secties 14 tot en met 19).
 * Eén scherm, ongeveer één minuut. Daarna stelt Job de vragen (WhatsApp of
 * het webgesprek). Geen cv, geen taalniveau, geen automatische afwijzing:
 * dat doet Job, en twijfel gaat naar een collega.
 *
 * Server: POST /api/aanmelding (server/aanmelding.ts). Na het versturen naar
 * de bedankpagina /aanmelden/ontvangen (bord B), of direct naar het webgesprek.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import Shell from "@/design3/Shell";
import { meldAanmelding } from "@/lib/meting";
import { herkomstVoorFormulier } from "@/lib/herkomst";
import { ALLE_LANDNAMEN, LANDEN_SCHEIDING } from "@shared/landen";
import { taalVanPad } from "@shared/taal";
import { Direct } from "./Aanvraag";
import { Bewijs, LANDCODES, functieUitKort } from "./Aanmelden";

type Taal = "nl" | "en";
type Functie = "bediening" | "keuken" | "afwas" | "housekeeping" | "frontoffice" | "logistiek";

const FUNCTIES: { code: Functie; nl: string; en: string }[] = [
  { code: "bediening", nl: "Bediening en bar", en: "Waiting staff and bar" },
  { code: "keuken", nl: "Keuken", en: "Kitchen" },
  { code: "afwas", nl: "Afwas", en: "Dishwashing" },
  { code: "housekeeping", nl: "Housekeeping", en: "Housekeeping" },
  { code: "frontoffice", nl: "Front office", en: "Front office" },
  { code: "logistiek", nl: "Logistiek", en: "Logistics" },
];
const BRON_CHIPS = ["Instagram", "TikTok", "Google", "Via kennis", "Gemini", "ChatGPT", "Claude", "Anders, namelijk:"];

const T = {
  nl: {
    h1a: "Werken bij EXTRA", h1b: "aanmelden in ", h1c: "één minuut",
    stap1: ["Jij vult dit formulier in", "Ongeveer één minuut"], stap2: ["Via WhatsApp krijg je meteen reactie", "Job stelt je een paar vragen, ongeveer 5 minuten"],
    functieVraag: "Waar word je blij van?", functieSub: "Kies je ideale (bij)baan", overJou: "Over jou",
    voornaam: "Voornaam", achternaam: "Achternaam", geboren: "Geboortedatum", dag: "Dag", maand: "Maand", jaar: "Jaar",
    nationaliteit: "Nationaliteit", postcode: "Postcode", buitenland: "Ik woon nog niet in Nederland", woonland: "In welk land woon je nu?",
    woonlandHulp: "Geen postcode nodig. Job vraagt straks wanneer je naar Nederland komt.", tochPostcode: "Toch een Nederlandse postcode invullen",
    bereiken: "Zo bereiken we je", mobiel: "Mobiel nummer", waAnders: "Mijn WhatsApp-nummer is anders", waNummer: "WhatsApp-nummer", email: "E-mail",
    gevonden: "Hoe heb je ons gevonden?", anders: "Anders, namelijk",
    verderWa: "Verder via WhatsApp", verderWeb: "Liever door zonder WhatsApp", geduld: "Even geduld",
    toestemming: "Met de groene knop geef je EXTRA toestemming om je via WhatsApp te benaderen over werk. Stoppen kan altijd met STOP. ",
    privacy: "Privacy", privacyLink: "/privacybeleid", ai: "Job is onze AI-recruiter. Een collega van EXTRA neemt altijd de beslissing.",
    fout: "Er ging iets mis. Probeer het opnieuw.",
    f: {
      functie: "Kies een functie", voornaam: "Vul je voornaam in", achternaam: "Vul je achternaam in", geboren: "Vul je geboortedatum in",
      geborenOngeldig: "Vul een geldige geboortedatum in", nationaliteit: "Kies je nationaliteit", postcode: "Vul je postcode in",
      postcodeOngeldig: "Vul een geldige postcode in, bijvoorbeeld 1055 AB", woonland: "Kies het land waar je nu woont",
      mobiel: "Vul je telefoonnummer in", mobielOngeldig: "Vul een geldig telefoonnummer in (minimaal 7 cijfers)",
      waNummer: "Vul je WhatsApp-nummer in", waGelijk: "Dit is hetzelfde nummer als je mobiele nummer",
      email: "Vul je e-mailadres in", emailOngeldig: "Vul een geldig e-mailadres in",
    },
    links: { eyebrow: "Aanmelden als medewerker", lead: "Hotels, horeca, evenementen en logistiek in en rond Amsterdam. Eén of twee diensten per week kan ook.", bewijs: ["Loondienst", "iedereen, geen zzp"], dag: ["NEN 4400-1", "gecertificeerd"], direct: "Vraag?", uit: "uit" },
  },
  en: {
    h1a: "Work at EXTRA", h1b: "apply in ", h1c: "one minute",
    stap1: ["You fill in this form", "About one minute"], stap2: ["You'll hear back right away on WhatsApp", "Job asks you a few questions, about 5 minutes"],
    functieVraag: "What makes you happy?", functieSub: "Choose your ideal (side) job", overJou: "About you",
    voornaam: "First name", achternaam: "Last name", geboren: "Date of birth", dag: "Day", maand: "Month", jaar: "Year",
    nationaliteit: "Nationality", postcode: "Postcode", buitenland: "I don't live in the Netherlands yet", woonland: "Which country do you live in now?",
    woonlandHulp: "No postcode needed. Job will ask when you're coming to the Netherlands.", tochPostcode: "Enter a Dutch postcode after all",
    bereiken: "How we reach you", mobiel: "Mobile number", waAnders: "My WhatsApp number is different", waNummer: "WhatsApp number", email: "Email",
    gevonden: "How did you find us?", anders: "Other, namely",
    verderWa: "Continue on WhatsApp", verderWeb: "Continue without WhatsApp", geduld: "Please wait",
    toestemming: "With the green button you allow EXTRA to contact you about work on WhatsApp. You can always stop with STOP. ",
    privacy: "Privacy", privacyLink: "/en/privacy-policy", ai: "Job is our AI recruiter. A colleague from EXTRA always makes the decision.",
    fout: "Something went wrong. Please try again.",
    f: {
      functie: "Choose a job", voornaam: "Enter your first name", achternaam: "Enter your last name", geboren: "Enter your date of birth",
      geborenOngeldig: "Enter a valid date of birth", nationaliteit: "Choose your nationality", postcode: "Enter your postcode",
      postcodeOngeldig: "Enter a valid postcode, for example 1055 AB", woonland: "Choose the country you live in",
      mobiel: "Enter your phone number", mobielOngeldig: "Enter a valid phone number (at least 7 digits)",
      waNummer: "Enter your WhatsApp number", waGelijk: "This is the same number as your mobile number",
      email: "Enter your email address", emailOngeldig: "Enter a valid email address",
    },
    links: { eyebrow: "Apply as an employee", lead: "Hotels, hospitality, events and logistics in and around Amsterdam. One or two shifts a week is fine too.", bewijs: ["Employed", "everyone, no freelancers"], dag: ["NEN 4400-1", "certified"], direct: "Questions?", uit: "from" },
  },
};

function e164(code: string, nummer: string): string {
  let c = nummer.replace(/[\s\-().]/g, "");
  if (c.startsWith("+")) return c;
  if (c.startsWith("00")) c = c.slice(2); else if (c.startsWith("0")) c = c.slice(1);
  return `${code === "+other" ? "+" : code}${c}`;
}
const geldigTel = (s: string) => /^\+\d{7,15}$/.test(s);
const postcodeGoed = (s: string) => /^[1-9][0-9]{3} ?[A-Za-z]{2}$/.test(s.trim());
function uuid(): string {
  try { return crypto.randomUUID(); } catch { /* oudere browser */ }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));
}

interface Velden {
  functie: Functie | ""; voornaam: string; achternaam: string; dag: string; maand: string; jaar: string; nationaliteit: string;
  postcode: string; buitenland: boolean; woonland: string; landcode: string; mobiel: string; waAnders: boolean; waLandcode: string;
  waNummer: string; email: string; bron: string; bronAnders: string; website: string;
}

export default function AanmeldenNieuw({ test = false }: { test?: boolean }) {
  const [pad, naar] = useLocation();
  const taal: Taal = taalVanPad(pad) === "en" ? "en" : "nl";
  const t = T[taal];
  const sleutel = useRef(uuid());
  const begin = useMemo(() => {
    let p: URLSearchParams;
    try { p = new URLSearchParams(window.location.search); } catch { p = new URLSearchParams(); }
    let ref = (p.get("ref") || "").trim();
    try { if (ref) sessionStorage.setItem("extra_ref", ref); else ref = sessionStorage.getItem("extra_ref") || ""; } catch { /* geen opslag */ }
    const link: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "jid", "vacature", "branche"]) { const v = p.get(k); if (v) link[k] = v.slice(0, 200); }
    const f = p.get("functie") || "";
    return { ref, link, bronVast: !!(link.utm_source || link.jid || link.vacature), functie: (FUNCTIES.some((x) => x.code === f) ? f : "") as Functie | "" };
  }, []);
  const [v, setV] = useState<Velden>(() => {
    const leeg: Velden = {
      functie: begin.functie, voornaam: "", achternaam: "", dag: "", maand: "", jaar: "", nationaliteit: "Nederland", postcode: "",
      buitenland: false, woonland: "", landcode: "+31", mobiel: "", waAnders: false, waLandcode: "+31", waNummer: "", email: "", bron: "", bronAnders: "", website: "",
    };
    try {
      const kort = JSON.parse(sessionStorage.getItem("extra-aanmelden") || "null");
      sessionStorage.removeItem("extra-aanmelden");
      if (kort && typeof kort === "object") {
        const delen = String(kort.naam || "").trim().split(/\s+/);
        leeg.voornaam = delen[0] || "";
        leeg.achternaam = delen.slice(1).join(" ");
        if (kort.telefoon) leeg.mobiel = String(kort.telefoon);
        const oud = functieUitKort(String(kort.functie || ""));
        const s = String(kort.functie || "").toLowerCase();
        leeg.functie = /afwas|dish/.test(s) ? "afwas" : oud === "chef" ? "keuken" : oud === "horecamedewerker" ? "bediening" : (oud as Functie) || leeg.functie;
      }
    } catch { /* niets voor te vullen */ }
    return leeg;
  });
  const [fouten, setFouten] = useState<Record<string, string>>({});
  const [plaats, setPlaats] = useState<string | null>(null);
  const [bezig, setBezig] = useState<"" | "whatsapp" | "web">("");
  const [algemeen, setAlgemeen] = useState("");
  const formulier = useRef<HTMLFormElement>(null);
  useEffect(() => { setFouten({}); setAlgemeen(""); }, [taal]);

  const zet = <K extends keyof Velden>(k: K, w: Velden[K]) => {
    setV((o) => ({ ...o, [k]: w }));
    setFouten((f) => { if (!f[k as string]) return f; const n = { ...f }; delete n[k as string]; return n; });
  };

  useEffect(() => {
    if (v.buitenland || !postcodeGoed(v.postcode)) { setPlaats(null); return; }
    let weg = false;
    const pc = v.postcode.replace(/\s+/g, "").toUpperCase();
    fetch(`/api/postcode?pc=${encodeURIComponent(pc)}`).then((r) => r.json()).then((d) => { if (!weg) setPlaats(d?.plaats || null); }).catch(() => {});
    return () => { weg = true; };
  }, [v.postcode, v.buitenland]);

  function geboortedatum(): string | null {
    const d = Number(v.dag), m = Number(v.maand), j = Number(v.jaar);
    if (!d || !m || !j || j < 1940 || m > 12 || d > 31) return null;
    const iso = `${j}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dt = new Date(`${iso}T12:00:00Z`);
    if (isNaN(dt.getTime()) || dt.getUTCDate() !== d || dt.getTime() > Date.now()) return null;
    return iso;
  }

  function controleer(): Record<string, string> {
    const f: Record<string, string> = {};
    if (!v.functie) f.functie = t.f.functie;
    if (!v.voornaam.trim()) f.voornaam = t.f.voornaam;
    if (!v.achternaam.trim()) f.achternaam = t.f.achternaam;
    if (!v.dag && !v.maand && !v.jaar) f.geboren = t.f.geboren; else if (!geboortedatum()) f.geboren = t.f.geborenOngeldig;
    if (!v.nationaliteit || v.nationaliteit === LANDEN_SCHEIDING) f.nationaliteit = t.f.nationaliteit;
    if (v.buitenland) { if (!v.woonland || v.woonland === LANDEN_SCHEIDING) f.woonland = t.f.woonland; }
    else if (!v.postcode.trim()) f.postcode = t.f.postcode; else if (!postcodeGoed(v.postcode)) f.postcode = t.f.postcodeOngeldig;
    if (!v.mobiel.trim()) f.mobiel = t.f.mobiel; else if (!geldigTel(e164(v.landcode, v.mobiel))) f.mobiel = t.f.mobielOngeldig;
    if (v.waAnders) {
      const wa = e164(v.waLandcode, v.waNummer);
      if (!v.waNummer.trim() || !geldigTel(wa)) f.waNummer = t.f.waNummer;
      else if (wa === e164(v.landcode, v.mobiel)) f.waNummer = t.f.waGelijk;
    }
    if (!v.email.trim()) f.email = t.f.email; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) f.email = t.f.emailOngeldig;
    return f;
  }

  async function verstuur(kanaal: "whatsapp" | "web") {
    if (bezig) return;
    setAlgemeen("");
    const f = controleer();
    setFouten(f);
    if (Object.keys(f).length) {
      const eerste = formulier.current?.querySelector<HTMLElement>(`[data-veld="${Object.keys(f)[0]}"] input, [data-veld="${Object.keys(f)[0]}"] select, [data-veld="${Object.keys(f)[0]}"] button`);
      eerste?.focus();
      return;
    }
    setBezig(kanaal);
    try {
      const r = await fetch("/api/aanmelding", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sleutel: sleutel.current, functie: v.functie, voornaam: v.voornaam.trim(), achternaam: v.achternaam.trim(), geboortedatum: geboortedatum(),
          nationaliteit: v.nationaliteit, postcode: v.buitenland ? null : v.postcode.trim(), woonland: v.buitenland ? v.woonland : null,
          landcode: v.landcode, mobiel: v.mobiel.trim(), whatsappAnders: v.waAnders, whatsappLandcode: v.waAnders ? v.waLandcode : null,
          whatsappNummer: v.waAnders ? v.waNummer.trim() : null, email: v.email.trim(), bronChip: begin.bronVast ? null : v.bron || null,
          bronAnders: v.bron.startsWith("Anders") ? v.bronAnders.trim() || null : null, kanaal, taal, referralCode: begin.ref || null,
          bronUitLink: Object.keys(begin.link).length ? begin.link : null, herkomst: herkomstVoorFormulier(), website: v.website,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (d?.velden && typeof d.velden === "object") {
          const vertaal: Record<string, string> = { whatsappNummer: "waNummer", geboortedatum: "geboren" };
          const nieuw: Record<string, string> = {};
          for (const [k, w] of Object.entries(d.velden)) nieuw[vertaal[k] || k] = Array.isArray(w) ? String(w[0]) : String(w);
          setFouten(nieuw);
        }
        setAlgemeen((d?.message && r.status !== 500 ? d.message : t.fout) + (d?.oorzaak ? ` (testomgeving: ${d.oorzaak})` : ""));
        setBezig("");
        return;
      }
      meldAanmelding(taal);
      try {
        sessionStorage.removeItem("extra_ref");
        sessionStorage.setItem("extra-aanmelding-ontvangen", JSON.stringify({
          voornaam: v.voornaam.trim(), functie: FUNCTIES.find((x) => x.code === v.functie)?.[taal] || "", kanaal: d.kanaal, jobLink: d.jobLink, waNummer: d.waNummer,
        }));
      } catch { /* geen opslag: de bedankpagina toont de korte versie */ }
      if (d.jobLink && d.kanaal === "web") { window.location.href = d.jobLink; return; }
      naar(taal === "en" ? "/en/apply/received" : "/aanmelden/ontvangen");
    } catch {
      setAlgemeen(t.fout);
      setBezig("");
    }
  }


  return (
    <Shell css={["events", "hotels", "werk", "bedrijf", "aanvraag", "pagina"]} bodyKlasse="aanvraagpag" telKnop>
      <style>{CSS}</style>
      <section className="av-pag am-pag af3">
        <div className="w av-grid">
          <div className="av-links af3-links">
            <span className="eyebrow">{t.links.eyebrow}</span>
            <h1 className="af3-h1">{t.h1a}<br />{t.h1b}<em>{t.h1c}</em></h1>
            <TweeStappen t={t} />
            <p className="av-lead af3-lead">{t.links.lead}</p>
            <Bewijs taal={taal === "en" ? "EN" : "NL"} uit={t.links.uit} derde={t.links.bewijs as [string, string]} vierde={t.links.dag as [string, string]} />
            <Direct label={t.links.direct} taal={taal} />
          </div>

          <form ref={formulier} className="af3-kaart" id="aanmelden" noValidate aria-label={t.links.eyebrow} onSubmit={(e) => { e.preventDefault(); verstuur("whatsapp"); }}>
            {test && <div className="af3-kop"><span className="af3-test">Testversie</span></div>}

            <fieldset className="af3-blok" data-veld="functie">
              <legend><b>{t.functieVraag}</b><span>{t.functieSub}</span></legend>
              <div className="af3-tegels" role="radiogroup" aria-invalid={!!fouten.functie}>
                {FUNCTIES.map((f) => (
                  <button key={f.code} type="button" role="radio" aria-checked={v.functie === f.code} className={v.functie === f.code ? "aan" : ""} onClick={() => zet("functie", f.code)}>{f[taal]}</button>
                ))}
              </div>
              <Fout tekst={fouten.functie} />
            </fieldset>
            <hr className="af3-lijn" />

            <div className="af3-blok">
              <h2>{t.overJou}</h2>
              <div className="af3-twee">
                <Veld naam="voornaam" label={t.voornaam} fout={fouten.voornaam}><input type="text" autoComplete="given-name" maxLength={60} value={v.voornaam} onChange={(e) => zet("voornaam", e.target.value)} aria-invalid={!!fouten.voornaam} /></Veld>
                <Veld naam="achternaam" label={t.achternaam} fout={fouten.achternaam}><input type="text" autoComplete="family-name" maxLength={80} value={v.achternaam} onChange={(e) => zet("achternaam", e.target.value)} aria-invalid={!!fouten.achternaam} /></Veld>
              </div>
              <Veld naam="geboren" label={t.geboren} fout={fouten.geboren} groep>
                <div className="af3-datum">
                  <input type="text" inputMode="numeric" maxLength={2} placeholder="DD" aria-label={t.dag} value={v.dag} onChange={(e) => zet("dag", e.target.value.replace(/\D/g, ""))} aria-invalid={!!fouten.geboren} />
                  <input type="text" inputMode="numeric" maxLength={2} placeholder="MM" aria-label={t.maand} value={v.maand} onChange={(e) => zet("maand", e.target.value.replace(/\D/g, ""))} aria-invalid={!!fouten.geboren} />
                  <input type="text" inputMode="numeric" maxLength={4} placeholder="JJJJ" aria-label={t.jaar} value={v.jaar} onChange={(e) => zet("jaar", e.target.value.replace(/\D/g, ""))} aria-invalid={!!fouten.geboren} />
                </div>
              </Veld>
              <Veld naam="nationaliteit" label={t.nationaliteit} fout={fouten.nationaliteit}>
                <select value={v.nationaliteit} onChange={(e) => zet("nationaliteit", e.target.value)} aria-invalid={!!fouten.nationaliteit}>
                  {ALLE_LANDNAMEN.map((l, i) => (l === LANDEN_SCHEIDING ? <option key={`s${i}`} disabled>──────────</option> : <option key={l} value={l}>{l}</option>))}
                </select>
              </Veld>
              {!v.buitenland ? (
                <>
                  <Veld naam="postcode" label={t.postcode} fout={fouten.postcode}>
                    <div className="af3-pc">
                      <input type="text" autoComplete="postal-code" maxLength={7} placeholder="1055 AB" value={v.postcode} onChange={(e) => zet("postcode", e.target.value.toUpperCase())} aria-invalid={!!fouten.postcode} />
                      {plaats && <span className="af3-plaats">✓ {plaats}</span>}
                    </div>
                  </Veld>
                  <button type="button" className="af3-link" onClick={() => { zet("buitenland", true); zet("woonland", v.nationaliteit !== "Nederland" ? v.nationaliteit : ""); }}>{t.buitenland}</button>
                </>
              ) : (
                <div className="af3-buitenland" data-veld="woonland">
                  <label className="af3-veld">
                    <span>{t.woonland}</span>
                    <select value={v.woonland} onChange={(e) => zet("woonland", e.target.value)} aria-invalid={!!fouten.woonland}>
                      <option value="">{taal === "en" ? "Choose a country" : "Kies een land"}</option>
                      {ALLE_LANDNAMEN.filter((l) => l !== "Nederland").map((l, i) => (l === LANDEN_SCHEIDING ? <option key={`s${i}`} disabled>──────────</option> : <option key={l} value={l}>{l}</option>))}
                    </select>
                  </label>
                  <Fout tekst={fouten.woonland} />
                  <p className="af3-hulp">{t.woonlandHulp}</p>
                  <button type="button" className="af3-link" onClick={() => { zet("buitenland", false); zet("woonland", ""); }}>{t.tochPostcode}</button>
                </div>
              )}
            </div>

            <div className="af3-blok">
              <h2>{t.bereiken}</h2>
              <Veld naam="mobiel" label={t.mobiel} fout={fouten.mobiel} groep>
                <div className="af3-tel">
                  <select aria-label={taal === "en" ? "Country code" : "Landcode"} value={v.landcode} onChange={(e) => zet("landcode", e.target.value)}>
                    {LANDCODES.map((l) => <option key={l.code} value={l.code}>{l.code === "+other" ? (taal === "en" ? l.en : l.naam) : l.code}</option>)}
                  </select>
                  <input type="tel" inputMode="tel" autoComplete="tel-national" placeholder="6 12 34 56 78" value={v.mobiel} onChange={(e) => zet("mobiel", e.target.value)} aria-invalid={!!fouten.mobiel} aria-label={t.mobiel} />
                </div>
              </Veld>
              <label className="af3-vink"><input type="checkbox" checked={v.waAnders} onChange={(e) => zet("waAnders", e.target.checked)} /> {t.waAnders}</label>
              {v.waAnders && (
                <Veld naam="waNummer" label={t.waNummer} fout={fouten.waNummer} groep>
                  <div className="af3-tel">
                    <select aria-label={taal === "en" ? "Country code" : "Landcode"} value={v.waLandcode} onChange={(e) => zet("waLandcode", e.target.value)}>
                      {LANDCODES.map((l) => <option key={l.code} value={l.code}>{l.code === "+other" ? (taal === "en" ? l.en : l.naam) : l.code}</option>)}
                    </select>
                    <input type="tel" inputMode="tel" placeholder="6 12 34 56 78" value={v.waNummer} onChange={(e) => zet("waNummer", e.target.value)} aria-invalid={!!fouten.waNummer} aria-label={t.waNummer} />
                  </div>
                </Veld>
              )}
              <Veld naam="email" label={t.email} fout={fouten.email}><input type="email" autoComplete="email" value={v.email} onChange={(e) => zet("email", e.target.value)} aria-invalid={!!fouten.email} /></Veld>
            </div>

            {!begin.bronVast && (
              <div className="af3-blok">
                <h3>{t.gevonden}</h3>
                <div className="af3-chips">
                  {BRON_CHIPS.map((c) => {
                    const label = taal === "en" && c === "Via kennis" ? "Through someone I know" : taal === "en" && c.startsWith("Anders") ? "Other, namely:" : c;
                    return <button key={c} type="button" aria-pressed={v.bron === c} className={v.bron === c ? "aan" : ""} onClick={() => zet("bron", v.bron === c ? "" : c)}>{label}</button>;
                  })}
                </div>
                {v.bron.startsWith("Anders") && <input className="af3-anders" type="text" maxLength={100} aria-label={t.anders} value={v.bronAnders} onChange={(e) => zet("bronAnders", e.target.value)} />}
              </div>
            )}

            <div className="af3-honing" aria-hidden="true"><label>Website<input type="text" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => zet("website", e.target.value)} /></label></div>

            <div className="af3-knoppen">
              {algemeen && <p className="af3-fout" role="alert">{algemeen}</p>}
              <button type="submit" className="af3-wa" disabled={!!bezig}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z" /></svg>
                {bezig === "whatsapp" ? t.geduld : t.verderWa}
              </button>
              <button type="button" className="af3-web" disabled={!!bezig} onClick={() => verstuur("web")}>{bezig === "web" ? t.geduld : t.verderWeb}</button>
              <p className="af3-toestemming">{t.toestemming}<a href={t.privacyLink}>{t.privacy}</a></p>
              <p className="af3-toestemming">{t.ai}</p>
            </div>
          </form>
        </div>
      </section>
    </Shell>
  );
}

function TweeStappen({ t }: { t: (typeof T)["nl"] }) {
  return (
    <ol className="af3-stappen">
      <li><b className="vol">1</b><span><strong>{t.stap1[0]}</strong>{t.stap1[1]}</span></li>
      <li><b>2</b><span><strong>{t.stap2[0]}</strong>{t.stap2[1]}</span></li>
    </ol>
  );
}

function Veld({ naam, label, fout, children, groep }: { naam: string; label: string; fout?: string; children: ReactNode; groep?: boolean }) {
  if (groep) {
    return (
      <div className="af3-veld" data-veld={naam} role="group" aria-label={label}>
        <span>{label}</span>
        {children}
        <Fout tekst={fout} />
      </div>
    );
  }
  return (
    <label className="af3-veld" data-veld={naam}>
      <span>{label}</span>
      {children}
      <Fout tekst={fout} />
    </label>
  );
}

function Fout({ tekst }: { tekst?: string }) {
  return tekst ? <span className="af3-veldfout" role="alert">{tekst}</span> : null;
}

const CSS = `
.d3.d3 .af3 .af3-kaart{background:#fff;border:1px solid #E4E0D8;border-radius:20px;padding:22px 20px 24px;color:#37352C;max-width:520px;width:100%;justify-self:center;display:flex;flex-direction:column;box-sizing:border-box}
.d3.d3 .af3 .af3-kaart *{box-sizing:border-box}
.d3.d3 .af3 .af3-kop{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-bottom:6px}
.d3.d3 .af3 .af3-test{font-size:12px;font-weight:700;background:#FFF3C4;color:#5C4A00;border-radius:99px;padding:3px 10px;margin-right:auto}
.d3.d3 .af3 .af3-taal{display:inline-flex;background:#EDEAE4;border-radius:10px;padding:3px}
.d3.d3 .af3 .af3-taal button{border:0;background:none;font:inherit;font-weight:700;font-size:13px;padding:6px 12px;border-radius:8px;cursor:pointer;color:#5C594F}
.d3.d3 .af3 .af3-taal button[aria-pressed=true]{background:#fff;color:#37352C;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.d3.d3 .af3 .af3-h1{font-weight:800;font-size:clamp(30px,4vw,44px);line-height:1.1;letter-spacing:-.01em;margin:8px 0 18px;color:inherit}
.d3.d3 .af3 .af3-h1 em{font-family:Fraunces,Georgia,serif;font-style:italic;font-weight:400}
.d3.d3 .af3 .af3-stappen{list-style:none;margin:0 0 18px;padding:14px 16px;border:1px solid #E4E0D8;border-radius:16px;background:#fff;display:grid;gap:12px}
.d3.d3 .af3 .af3-stappen li{display:flex;gap:12px;align-items:flex-start}
.d3.d3 .af3 .af3-stappen b{color:#37352C;background:#fff;flex:none;width:26px;height:26px;border-radius:50%;border:1.5px solid #37352C;display:inline-flex;align-items:center;justify-content:center;font-size:13px}
.d3.d3 .af3 .af3-stappen b.vol{background:#37352C;color:#F8F7F4}
.d3.d3 .af3 .af3-stappen span{display:flex;flex-direction:column;font-size:13.5px;color:#6B665C}
.d3.d3 .af3 .af3-stappen strong{color:#37352C;font-size:15px}
.d3.d3 .af3 .af3-blok{border:0;margin:0 0 18px;padding:0;min-width:0}
.d3.d3 .af3 .af3-blok legend{display:flex;flex-direction:column;margin-bottom:12px;padding:0}
.d3.d3 .af3 .af3-blok legend b{font-size:20px;font-weight:800}
.d3.d3 .af3 .af3-blok legend span{color:#6B665C;font-size:14px}
.d3.d3 .af3 .af3-blok h2{font-size:18px;font-weight:800;margin:0 0 12px}
.d3.d3 .af3 .af3-blok h3{font-size:16px;font-weight:800;margin:0 0 10px}
.d3.d3 .af3 .af3-tegels{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.d3.d3 .af3 .af3-tegels button{height:56px;border-radius:14px;border:1.5px solid #DDD8CE;background:#fff;font:inherit;font-weight:700;font-size:15px;color:#37352C;cursor:pointer;padding:0 16px;text-align:left}
.d3.d3 .af3 .af3-tegels button.aan{background:#37352C;border-color:#37352C;color:#F8F7F4}
.d3.d3 .af3 .af3-lijn{border:0;border-top:1px solid #E4E0D8;margin:6px 0 20px}
.d3.d3 .af3 .af3-twee{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.d3.d3 .af3 .af3-veld{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;min-width:0}
.d3.d3 .af3 .af3-veld{font-size:15px;font-weight:400}
.d3.d3 .af3 .af3-veld>span{font-size:13.5px;font-weight:600;color:#37352C;line-height:1.3;margin:0}
.d3.d3 .af3 input[type=text],.d3.d3 .af3 input[type=tel],.d3.d3 .af3 input[type=email],.d3.d3 .af3 select{height:50px;font:inherit;font-size:16px;color:#37352C;border:1.5px solid #DDD8CE;border-radius:12px;padding:0 14px;background:#fff;width:100%;min-width:0}
.d3.d3 .af3 input[aria-invalid=true],.d3.d3 .af3 select[aria-invalid=true]{border-color:#C2412D}
.d3.d3 .af3 input:focus-visible,.d3.d3 .af3 select:focus-visible,.d3.d3 .af3 button:focus-visible{outline:2px solid #37352C;outline-offset:2px}
.d3.d3 .af3 .af3-datum{display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:8px}
.d3.d3 .af3 .af3-pc{position:relative}
.d3.d3 .af3 .af3-plaats{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:13.5px;font-weight:700;color:#3F6A2A;pointer-events:none}
.d3.d3 .af3 .af3-link{border:0;background:none;padding:0;font:inherit;font-size:13px;font-weight:600;text-decoration:underline;color:#37352C;cursor:pointer;margin:-4px 0 6px}
.d3.d3 .af3 .af3-buitenland{border:1.5px solid #37352C;border-radius:14px;padding:14px;margin-bottom:12px}
.d3.d3 .af3 .af3-hulp{font-size:13px;color:#5C594F;margin:4px 0 10px}
.d3.d3 .af3 .af3-tel{display:grid;grid-template-columns:96px 1fr;gap:8px}
.d3.d3 .af3 .af3-vink{font-weight:400;display:flex;align-items:center;gap:10px;font-size:14px;margin:-2px 0 12px;cursor:pointer}
.d3.d3 .af3 .af3-vink input{width:20px;height:20px;accent-color:#37352C}
.d3.d3 .af3 .af3-chips{display:flex;flex-wrap:wrap;gap:8px}
.d3.d3 .af3 .af3-chips button{height:40px;padding:0 14px;border-radius:99px;border:1.5px solid #DDD8CE;background:#fff;font:inherit;font-size:14px;font-weight:600;color:#37352C;cursor:pointer}
.d3.d3 .af3 .af3-chips button.aan{background:#37352C;border-color:#37352C;color:#F8F7F4}
.d3.d3 .af3 .af3-anders{margin-top:10px;height:44px!important}
.d3.d3 .af3 .af3-veldfout{color:#C2412D;font-size:13px;font-weight:600}
.d3.d3 .af3 .af3-honing{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.d3.d3 .af3 .af3-knoppen{margin-top:auto;display:flex;flex-direction:column;gap:10px;padding-top:6px}
.d3.d3 .af3 .af3-wa{height:58px;border:0;border-radius:14px;background:#25A25A;color:#fff;font:inherit;font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;box-shadow:0 6px 16px rgba(37,162,90,.35)}
.d3.d3 .af3 .af3-web{height:46px;border-radius:14px;border:1.5px solid #37352C;background:transparent;font:inherit;font-weight:700;font-size:15px;color:#37352C;cursor:pointer}
.d3.d3 .af3 .af3-wa:disabled,.d3.d3 .af3 .af3-web:disabled{opacity:.6;cursor:default}
.d3.d3 .af3 .af3-toestemming{font-size:11px;color:#5C594F;margin:0;line-height:1.5;font-weight:400}
.d3.d3 .af3 .af3-toestemming a{color:#37352C;text-decoration:underline}
.d3.d3 .af3 .af3-fout{background:#FBE3DE;color:#A2321F;border-radius:10px;padding:10px 12px;font-weight:600;margin:0}
.d3.d3 .af3 .af3-lead{margin-top:6px}
@media (min-width:1024px){.d3.d3 .af3 .af3-tegels{grid-template-columns:repeat(3,1fr)}}
@media (max-width:1023px){.d3.d3 .af3 .af3-links{max-width:560px;margin:0 auto;width:100%}.af3 .af3-links>*:not(.af3-h1):not(.af3-stappen){display:none}.af3 .af3-kaart{max-width:560px;margin:0 auto;padding:18px 16px 22px}.af3 .af3-h1{font-size:30px}}
`;
