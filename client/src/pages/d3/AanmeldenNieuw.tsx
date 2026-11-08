/**
 * Aanmeldformulier per label (mock-up aanmelden v2, akkoord Max 8 nov 2026).
 *
 * Kom je via een werkpagina van Hotels, Events of Logistiek, dan zie je alleen
 * de functies van dat label, in de kleur van dat label. Zonder label kies je
 * eerst een branche. Het label gaat mee naar de kandidaat en bepaalt verderop
 * Sollicitanten, de vragen van Job en de intake. Eén kaart, ongeveer één
 * minuut; daarna stelt Job de vragen (WhatsApp of het webgesprek).
 *
 * Label: ?label=hotels|events|logistiek, anders de laatst bezochte werkpagina
 * (sessionStorage "extra-label", gezet door Shell), anders de keuze.
 * Server: POST /api/aanmelding (server/aanmelding.ts).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import Shell from "@/design3/Shell";
import { meldAanmelding } from "@/lib/meting";
import { herkomstVoorFormulier } from "@/lib/herkomst";
import { useLiveReviews } from "@/hooks/useLiveReviews";
import { ALLE_LANDNAMEN, LANDEN_SCHEIDING } from "@shared/landen";
import { taalVanPad } from "@shared/taal";
import { LABELS, OPEN_CODE, isLabel, type AanmeldLabel, type Paspoort } from "@shared/aanmeldLabels";
import { LANDCODES, functieUitKort } from "./Aanmelden";

type Taal = "nl" | "en";

const T = {
  nl: {
    h1: { hotels: ["Meld je aan voor werk in ", "hotels"], events: ["Meld je aan voor werk bij ", "events"], logistiek: ["Meld je aan voor werk in de ", "logistiek"] },
    h1Keuze: ["Waar wil je ", "werken?"],
    lead: {
      hotels: "Housekeeping, front office, F&B of keuken in de mooiste hotels van Amsterdam. Met of zonder ervaring.",
      events: "Bediening, bar en hosting bij events in en rond Amsterdam. Met of zonder ervaring.",
      logistiek: "Orderpicken, heftruck, inpakken en magazijnwerk in en rond Amsterdam. Met of zonder ervaring.",
      keuze: "Kies eerst waar je wilt werken. Daarna zie je de functies die erbij horen.",
    },
    belofte: ["Kies zelf je diensten", "Volgende dag betaald", "Cv mag later"],
    voordelen: [
      ["Kies zelf je diensten", "In de EXTRA-app pak je de diensten die jou uitkomen."],
      ["De volgende dag betaald", "Na je dienst staat je voorschot klaar."],
      ["Iedereen in loondienst", "Geen zzp, gewoon verzekerd en betaald."],
    ],
    stappen: [["Aanmelden", "1 minuut"], ["Vragen van Job", "via WhatsApp"], ["Kennismaking", "op kantoor"]],
    duur: "1 minuut", duurNa: "daarna verder via WhatsApp", andere: "Andere branche", kiesBranche: "Kies eerst een branche",
    functieVraag: "Wat wil je doen?", open: "Weet ik nog niet, ik sta open voor alles",
    naamVraag: "Hoe heet je?", voornaam: "Voornaam", achternaam: "Achternaam",
    bereikVraag: "Hoe bereiken we je?", mobiel: "Mobiel nummer", waAnders: "Mijn WhatsApp-nummer is anders", waNummer: "WhatsApp-nummer",
    waUitleg: "Job stuurt zijn berichten naar dit nummer. We bellen je op je mobiele nummer.", email: "E-mail",
    drieVraag: "Nog drie korte dingen", geboren: "Geboortedatum", dag: "Dag", maand: "Maand", jaar: "Jaar",
    postcode: "Postcode", buitenland: "Woon je nog niet in Nederland?", kiesLand: "Kies je land", woonland: "In welk land woon je nu?",
    woonlandHulp: "Geen postcode nodig. Job vraagt straks wanneer je naar Nederland komt.", tochPostcode: "Toch een Nederlandse postcode invullen",
    paspoort: "Paspoort of ID-kaart", paspoortOpties: { nl: "Nederlands", eu: "Ander EU-land", buiten: "Buiten de EU" } as Record<Paspoort, string>,
    reviews: "uit", reviewsNa: "Google reviews · iedereen in loondienst",
    verderWa: "Verder via WhatsApp", onderWa: "Job, onze AI-recruiter, stuurt je meteen een bericht", geenWa: "Ik heb geen WhatsApp", geduld: "Even geduld",
    toestemming: "Met deze knop mag EXTRA je via WhatsApp en e-mail benaderen over je aanmelding. Stoppen kan altijd met STOP. ",
    privacy: "Privacy", privacyLink: "/privacybeleid",
    fout: "Er ging iets mis. Probeer het opnieuw.",
    f: {
      functie: "Kies wat je wilt doen", voornaam: "Vul je voornaam in", achternaam: "Vul je achternaam in", geboren: "Vul je geboortedatum in",
      geborenOngeldig: "Vul een geldige geboortedatum in", paspoort: "Kies wat voor paspoort of ID-kaart je hebt", postcode: "Vul je postcode in",
      postcodeOngeldig: "Vul een geldige postcode in, bijvoorbeeld 1055 AB", woonland: "Kies het land waar je nu woont",
      mobiel: "Vul je telefoonnummer in", mobielOngeldig: "Dit nummer lijkt niet te kloppen. Controleer het even.",
      waNummer: "Vul je WhatsApp-nummer in", waGelijk: "Dit is hetzelfde nummer als je mobiele nummer",
      email: "Vul je e-mailadres in", emailOngeldig: "Vul een geldig e-mailadres in",
    },
    landcode: "Landcode", kiesEenLand: "Kies een land", aanmelden: "Aanmelden",
  },
  en: {
    h1: { hotels: ["Apply for work in ", "hotels"], events: ["Apply for work at ", "events"], logistiek: ["Apply for work in ", "logistics"] },
    h1Keuze: ["Where do you want to ", "work?"],
    lead: {
      hotels: "Housekeeping, front office, F&B or kitchen in the finest hotels in Amsterdam. With or without experience.",
      events: "Waiting staff, bar and hosting at events in and around Amsterdam. With or without experience.",
      logistiek: "Order picking, forklift, packing and warehouse work in and around Amsterdam. With or without experience.",
      keuze: "First choose where you want to work. Then you'll see the jobs that go with it.",
    },
    belofte: ["Choose your own shifts", "Paid the next day", "CV can come later"],
    voordelen: [
      ["Choose your own shifts", "Pick the shifts that suit you in the EXTRA app."],
      ["Paid the next day", "Your advance is ready after your shift."],
      ["Everyone on the payroll", "No freelancing, simply insured and paid."],
    ],
    stappen: [["Apply", "1 minute"], ["Questions from Job", "on WhatsApp"], ["Meeting", "at our office"]],
    duur: "1 minute", duurNa: "then continue on WhatsApp", andere: "Other sector", kiesBranche: "First choose a sector",
    functieVraag: "What would you like to do?", open: "Not sure yet, I'm open to anything",
    naamVraag: "What's your name?", voornaam: "First name", achternaam: "Last name",
    bereikVraag: "How can we reach you?", mobiel: "Mobile number", waAnders: "My WhatsApp number is different", waNummer: "WhatsApp number",
    waUitleg: "Job sends his messages to this number. We call you on your mobile number.", email: "Email",
    drieVraag: "Three more quick things", geboren: "Date of birth", dag: "Day", maand: "Month", jaar: "Year",
    postcode: "Postcode", buitenland: "Not living in the Netherlands yet?", kiesLand: "Choose your country", woonland: "Which country do you live in now?",
    woonlandHulp: "No postcode needed. Job will ask when you're coming to the Netherlands.", tochPostcode: "Enter a Dutch postcode after all",
    paspoort: "Passport or ID card", paspoortOpties: { nl: "Dutch", eu: "Other EU country", buiten: "Outside the EU" } as Record<Paspoort, string>,
    reviews: "from", reviewsNa: "Google reviews · everyone on the payroll",
    verderWa: "Continue on WhatsApp", onderWa: "Job, our AI recruiter, will message you right away", geenWa: "I don't have WhatsApp", geduld: "Please wait",
    toestemming: "With this button you allow EXTRA to contact you about your application on WhatsApp and by email. You can always stop with STOP. ",
    privacy: "Privacy", privacyLink: "/en/privacy-policy",
    fout: "Something went wrong. Please try again.",
    f: {
      functie: "Choose what you'd like to do", voornaam: "Enter your first name", achternaam: "Enter your last name", geboren: "Enter your date of birth",
      geborenOngeldig: "Enter a valid date of birth", paspoort: "Choose which passport or ID card you have", postcode: "Enter your postcode",
      postcodeOngeldig: "Enter a valid postcode, for example 1055 AB", woonland: "Choose the country you live in",
      mobiel: "Enter your phone number", mobielOngeldig: "This number doesn't look right. Please check it.",
      waNummer: "Enter your WhatsApp number", waGelijk: "This is the same number as your mobile number",
      email: "Enter your email address", emailOngeldig: "Enter a valid email address",
    },
    landcode: "Country code", kiesEenLand: "Choose a country", aanmelden: "Apply",
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
  functie: string; voornaam: string; achternaam: string; dag: string; maand: string; jaar: string; paspoort: Paspoort | "";
  postcode: string; buitenland: boolean; woonland: string; landcode: string; mobiel: string; waAnders: boolean; waLandcode: string;
  waNummer: string; email: string; website: string;
}

/** Functie uit het korte formulier op een werkpagina (vrije tekst) naar een code van het label. */
function codeUitKort(tekst: string, label: AanmeldLabel): string {
  const s = tekst.toLowerCase().trim();
  if (!s) return "";
  const lijst = LABELS[label].functies;
  const heeft = (c: string) => lijst.some((f) => f.code === c);
  const direct = lijst.find((f) => f.nl.toLowerCase() === s || f.en.toLowerCase() === s);
  if (direct) return direct.code;
  if (/afwas|dish/.test(s)) return heeft("afwas") ? "afwas" : "";
  if (/bar/.test(s)) return heeft("bar") ? "bar" : "";
  if (/f&b|f&amp;b/.test(s)) return heeft("fb") ? "fb" : "";
  if (/orderpick/.test(s)) return heeft("orderpicker") ? "orderpicker" : "";
  if (/heftruck|reachtruck/.test(s)) return heeft("heftruck") ? "heftruck" : "";
  if (/inpak/.test(s)) return heeft("inpak") ? "inpak" : "";
  const oud = functieUitKort(tekst);
  const per: Record<string, string> = { chef: "keuken", housekeeping: "housekeeping", frontoffice: "frontoffice", horecamedewerker: label === "hotels" ? "fb" : "bediening" };
  const code = per[oud as string] || "";
  return heeft(code) ? code : "";
}

export default function AanmeldenNieuw({ test = false }: { test?: boolean }) {
  const [pad, naar] = useLocation();
  const taal: Taal = taalVanPad(pad) === "en" ? "en" : "nl";
  const t = T[taal];
  const rv = useLiveReviews(taal);
  const sleutel = useRef(uuid());
  const begin = useMemo(() => {
    let p: URLSearchParams;
    try { p = new URLSearchParams(window.location.search); } catch { p = new URLSearchParams(); }
    let ref = (p.get("ref") || "").trim();
    try { if (ref) sessionStorage.setItem("extra_ref", ref); else ref = sessionStorage.getItem("extra_ref") || ""; } catch { /* geen opslag */ }
    const link: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "jid", "vacature", "branche"]) { const v = p.get(k); if (v) link[k] = v.slice(0, 200); }
    let label: AanmeldLabel | null = null;
    const uitUrl = p.get("label") || link.branche;
    if (isLabel(uitUrl)) label = uitUrl;
    else { try { const s = sessionStorage.getItem("extra-label"); if (isLabel(s)) label = s; } catch { /* geen opslag */ } }
    return { ref, link, label, functie: p.get("functie") || "" };
  }, []);
  const [label, setLabel] = useState<AanmeldLabel | null>(begin.label);
  const [v, setV] = useState<Velden>(() => {
    const leeg: Velden = {
      functie: begin.label && LABELS[begin.label].functies.some((f) => f.code === begin.functie) ? begin.functie : "", voornaam: "", achternaam: "", dag: "", maand: "", jaar: "",
      paspoort: "", postcode: "", buitenland: false, woonland: "", landcode: "+31", mobiel: "", waAnders: false, waLandcode: "+31", waNummer: "", email: "", website: "",
    };
    try {
      const kort = JSON.parse(sessionStorage.getItem("extra-aanmelden") || "null");
      sessionStorage.removeItem("extra-aanmelden");
      if (kort && typeof kort === "object") {
        const delen = String(kort.naam || "").trim().split(/\s+/);
        leeg.voornaam = delen[0] || "";
        leeg.achternaam = delen.slice(1).join(" ");
        if (kort.telefoon) leeg.mobiel = String(kort.telefoon);
        if (begin.label && kort.functie) leeg.functie = codeUitKort(String(kort.functie), begin.label) || leeg.functie;
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
    // Een melding hoort soms bij een groep velden (geboortedatum, telefoon met landcode).
    const bij: Record<string, string[]> = { dag: ["geboren"], maand: ["geboren"], jaar: ["geboren"], landcode: ["mobiel"], waLandcode: ["waNummer"], waAnders: ["waNummer"], buitenland: ["postcode", "woonland"] };
    const weg = [k as string, ...(bij[k as string] || [])];
    setFouten((f) => { if (!weg.some((x) => f[x])) return f; const n = { ...f }; for (const x of weg) delete n[x]; return n; });
  };
  function kiesLabel(l: AanmeldLabel | null) {
    setLabel(l);
    zet("functie", "");
    try { if (l) sessionStorage.setItem("extra-label", l); else sessionStorage.removeItem("extra-label"); } catch { /* geen opslag */ }
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* geen venster */ }
  }

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
    if (!v.mobiel.trim()) f.mobiel = t.f.mobiel; else if (!geldigTel(e164(v.landcode, v.mobiel))) f.mobiel = t.f.mobielOngeldig;
    if (v.waAnders) {
      const wa = e164(v.waLandcode, v.waNummer);
      if (!v.waNummer.trim() || !geldigTel(wa)) f.waNummer = t.f.waNummer;
      else if (wa === e164(v.landcode, v.mobiel)) f.waNummer = t.f.waGelijk;
    }
    if (!v.email.trim()) f.email = t.f.email; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) f.email = t.f.emailOngeldig;
    if (!v.dag && !v.maand && !v.jaar) f.geboren = t.f.geboren; else if (!geboortedatum()) f.geboren = t.f.geborenOngeldig;
    if (v.buitenland) { if (!v.woonland || v.woonland === LANDEN_SCHEIDING) f.woonland = t.f.woonland; }
    else if (!v.postcode.trim()) f.postcode = t.f.postcode; else if (!postcodeGoed(v.postcode)) f.postcode = t.f.postcodeOngeldig;
    if (!v.paspoort) f.paspoort = t.f.paspoort;
    return f;
  }

  async function verstuur(kanaal: "whatsapp" | "web") {
    if (bezig || !label) return;
    setAlgemeen("");
    const f = controleer();
    setFouten(f);
    if (Object.keys(f).length) {
      const sel = `[data-veld="${Object.keys(f)[0]}"]`;
      const eerste = formulier.current?.querySelector<HTMLElement>(`${sel} input, ${sel} select, ${sel} button`);
      eerste?.focus();
      eerste?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setBezig(kanaal);
    try {
      const r = await fetch("/api/aanmelding", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sleutel: sleutel.current, label, functie: v.functie, voornaam: v.voornaam.trim(), achternaam: v.achternaam.trim(), geboortedatum: geboortedatum(),
          paspoort: v.paspoort, postcode: v.buitenland ? null : v.postcode.trim(), woonland: v.buitenland ? v.woonland : null,
          landcode: v.landcode, mobiel: v.mobiel.trim(), whatsappAnders: v.waAnders, whatsappLandcode: v.waAnders ? v.waLandcode : null,
          whatsappNummer: v.waAnders ? v.waNummer.trim() : null, email: v.email.trim(), kanaal, taal, referralCode: begin.ref || null,
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
      const gekozen = v.functie === OPEN_CODE ? LABELS[label][taal === "en" ? "werkEn" : "werkNl"] : LABELS[label].functies.find((x) => x.code === v.functie)?.[taal] || "";
      try {
        sessionStorage.removeItem("extra_ref");
        sessionStorage.setItem("extra-aanmelding-ontvangen", JSON.stringify({ voornaam: v.voornaam.trim(), functie: gekozen, kanaal: d.kanaal, jobLink: d.jobLink, waNummer: d.waNummer }));
      } catch { /* geen opslag: de bedankpagina toont de korte versie */ }
      if (d.jobLink && d.kanaal === "web") { window.location.href = d.jobLink; return; }
      naar(taal === "en" ? "/en/apply/received" : "/aanmelden/ontvangen");
    } catch {
      setAlgemeen(t.fout);
      setBezig("");
    }
  }

  const sector = label || undefined;
  const kop = label ? t.h1[label] : t.h1Keuze;
  const landOpties = ALLE_LANDNAMEN.filter((l) => l !== "Nederland").map((l, i) => (l === LANDEN_SCHEIDING ? <option key={`s${i}`} disabled>──────────</option> : <option key={l} value={l}>{l}</option>));
  const codes = LANDCODES.map((l) => <option key={l.code} value={l.code}>{l.code === "+other" ? (taal === "en" ? l.en : l.naam) : l.code}</option>);

  return (
    <Shell css={["events", "hotels", "werk", "bedrijf", "aanvraag", "pagina"]} bodyKlasse="aanvraagpag" telKnop>
      <style>{CSS}</style>
      <section className={`af4${label ? "" : " af4-keuze"}`} data-sector={sector}>
        <div className="w af4-grid">
          <div className="af4-links">
            <span className="af4-chip"><i />{label ? LABELS[label][taal === "en" ? "werkEn" : "werkNl"] : t.aanmelden}</span>
            <h1 className="af4-h1">{kop[0]}<span className="serif">{kop[1]}</span></h1>
            <div className="af4-belofte">{t.belofte.map((b) => <span key={b}>{b}</span>)}</div>
            <div className="af4-lead">{label ? t.lead[label] : t.lead.keuze}</div>
            <ul className="af4-voordelen">{t.voordelen.map(([b, s]) => <li key={b}><i aria-hidden>✓</i><div><b>{b}</b><span>{s}</span></div></li>)}</ul>
            <div className="af4-stappen">{t.stappen.map(([b, s], i) => <div key={b}><small>0{i + 1}</small><b>{b}</b>{s}</div>)}</div>
          </div>

          {!label ? (
            <div className="af4-kaart">
              <div className="af4-vraag">{t.kiesBranche}</div>
              <div className="af4-labels">
                {(Object.keys(LABELS) as AanmeldLabel[]).map((l) => (
                  <button key={l} type="button" className={`af4-label af4-${l}`} onClick={() => kiesLabel(l)}>
                    <span><b>{LABELS[l][taal]}</b><small>{LABELS[l].kort[taal]}</small></span><em aria-hidden>→</em>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form ref={formulier} className="af4-kaart" id="aanmelden" noValidate aria-label={kop.join("")} onSubmit={(e) => { e.preventDefault(); verstuur("whatsapp"); }}>
              {test && <div className="af4-test">Testversie</div>}
              <div className="af4-duur"><span><b>{t.duur}</b> · {t.duurNa}</span><button type="button" onClick={() => kiesLabel(null)}>{t.andere}</button></div>

              <fieldset className="af4-blok" data-veld="functie">
                <legend className="af4-vraag">{t.functieVraag}</legend>
                <div className="af4-tegels" role="radiogroup" aria-invalid={!!fouten.functie}>
                  {LABELS[label].functies.map((f) => (
                    <button key={f.code} type="button" role="radio" aria-checked={v.functie === f.code} className={v.functie === f.code ? "aan" : ""} onClick={() => zet("functie", f.code)}>{f[taal]}</button>
                  ))}
                  <button type="button" role="radio" aria-checked={v.functie === OPEN_CODE} className={`open${v.functie === OPEN_CODE ? " aan" : ""}`} onClick={() => zet("functie", OPEN_CODE)}>{t.open}</button>
                </div>
                <Fout tekst={fouten.functie} />
              </fieldset>

              <div className="af4-blok">
                <div className="af4-vraag">{t.naamVraag}</div>
                <div className="af4-twee">
                  <Veld naam="voornaam" label={t.voornaam} fout={fouten.voornaam}><input type="text" autoComplete="given-name" maxLength={60} value={v.voornaam} onChange={(e) => zet("voornaam", e.target.value)} aria-invalid={!!fouten.voornaam} /></Veld>
                  <Veld naam="achternaam" label={t.achternaam} fout={fouten.achternaam}><input type="text" autoComplete="family-name" maxLength={80} value={v.achternaam} onChange={(e) => zet("achternaam", e.target.value)} aria-invalid={!!fouten.achternaam} /></Veld>
                </div>
              </div>

              <div className="af4-blok">
                <div className="af4-vraag">{t.bereikVraag}</div>
                <Veld naam="mobiel" label={t.mobiel} fout={fouten.mobiel} groep>
                  <div className="af4-tel">
                    <select aria-label={t.landcode} value={v.landcode} onChange={(e) => zet("landcode", e.target.value)}>{codes}</select>
                    <input type="tel" inputMode="tel" autoComplete="tel-national" placeholder="6 12 34 56 78" value={v.mobiel} onChange={(e) => zet("mobiel", e.target.value)} aria-invalid={!!fouten.mobiel} aria-label={t.mobiel} />
                  </div>
                </Veld>
                <label className="af4-vink"><input type="checkbox" checked={v.waAnders} onChange={(e) => zet("waAnders", e.target.checked)} /> {t.waAnders}</label>
                {v.waAnders && (
                  <div className="af4-anders">
                    <Veld naam="waNummer" label={t.waNummer} fout={fouten.waNummer} groep>
                      <div className="af4-tel">
                        <select aria-label={t.landcode} value={v.waLandcode} onChange={(e) => zet("waLandcode", e.target.value)}>{codes}</select>
                        <input type="tel" inputMode="tel" placeholder="6 12 34 56 78" value={v.waNummer} onChange={(e) => zet("waNummer", e.target.value)} aria-invalid={!!fouten.waNummer} aria-label={t.waNummer} />
                      </div>
                    </Veld>
                    <div className="af4-hulp">{t.waUitleg}</div>
                  </div>
                )}
                <Veld naam="email" label={t.email} fout={fouten.email}><input type="email" autoComplete="email" inputMode="email" value={v.email} onChange={(e) => zet("email", e.target.value)} aria-invalid={!!fouten.email} /></Veld>
              </div>

              <div className="af4-blok">
                <div className="af4-vraag">{t.drieVraag}</div>
                <div className="af4-twee af4-twee-breed">
                  <Veld naam="geboren" label={t.geboren} fout={fouten.geboren} groep>
                    <div className="af4-datum">
                      <input type="text" inputMode="numeric" autoComplete="bday-day" maxLength={2} placeholder="DD" aria-label={t.dag} value={v.dag} onChange={(e) => zet("dag", e.target.value.replace(/\D/g, ""))} aria-invalid={!!fouten.geboren} />
                      <input type="text" inputMode="numeric" autoComplete="bday-month" maxLength={2} placeholder="MM" aria-label={t.maand} value={v.maand} onChange={(e) => zet("maand", e.target.value.replace(/\D/g, ""))} aria-invalid={!!fouten.geboren} />
                      <input type="text" inputMode="numeric" autoComplete="bday-year" maxLength={4} placeholder={taal === "en" ? "YYYY" : "JJJJ"} aria-label={t.jaar} value={v.jaar} onChange={(e) => zet("jaar", e.target.value.replace(/\D/g, ""))} aria-invalid={!!fouten.geboren} />
                    </div>
                  </Veld>
                  {!v.buitenland ? (
                    <Veld naam="postcode" label={t.postcode} fout={fouten.postcode}>
                      <div className="af4-pc">
                        <input type="text" autoComplete="postal-code" maxLength={7} placeholder="1055 AB" value={v.postcode} onChange={(e) => zet("postcode", e.target.value.toUpperCase())} aria-invalid={!!fouten.postcode} />
                        {plaats && <span className="af4-plaats">✓ {plaats}</span>}
                      </div>
                    </Veld>
                  ) : (
                    <Veld naam="woonland" label={t.woonland} fout={fouten.woonland}>
                      <select value={v.woonland} onChange={(e) => zet("woonland", e.target.value)} aria-invalid={!!fouten.woonland}>
                        <option value="">{t.kiesEenLand}</option>{landOpties}
                      </select>
                    </Veld>
                  )}
                </div>
                {!v.buitenland
                  ? <div className="af4-hulp">{t.buitenland} <button type="button" className="af4-link" onClick={() => zet("buitenland", true)}>{t.kiesLand}</button></div>
                  : <div className="af4-hulp">{t.woonlandHulp} <button type="button" className="af4-link" onClick={() => { zet("buitenland", false); zet("woonland", ""); }}>{t.tochPostcode}</button></div>}
                <Veld naam="paspoort" label={t.paspoort} fout={fouten.paspoort} groep>
                  <div className="af4-pillen" role="radiogroup" aria-label={t.paspoort}>
                    {(["nl", "eu", "buiten"] as Paspoort[]).map((p) => (
                      <button key={p} type="button" role="radio" aria-checked={v.paspoort === p} className={v.paspoort === p ? "aan" : ""} onClick={() => zet("paspoort", p)}>{t.paspoortOpties[p]}</button>
                    ))}
                  </div>
                </Veld>
              </div>

              <div className="af4-honing" aria-hidden="true"><label>Website<input type="text" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => zet("website", e.target.value)} /></label></div>

              <div className="af4-knoppen">
                <div className="af4-bewijs"><span className="af4-ster" aria-hidden>★★★★★</span><span><b>{rv.scoreTekst}</b> {t.reviews} {rv.aantal} {t.reviewsNa}</span></div>
                {algemeen && <div className="af4-fout" role="alert">{algemeen}</div>}
                <button type="submit" className="af4-wa" disabled={!!bezig}>
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z" /></svg>
                  {bezig === "whatsapp" ? t.geduld : t.verderWa}
                </button>
                <div className="af4-onder">{t.onderWa}</div>
                <button type="button" className="af4-geenwa" disabled={!!bezig} onClick={() => verstuur("web")}>{bezig === "web" ? t.geduld : t.geenWa}</button>
                <div className="af4-toestemming">{t.toestemming}<a href={t.privacyLink}>{t.privacy}</a></div>
              </div>
            </form>
          )}
        </div>
      </section>
    </Shell>
  );
}

function Veld({ naam, label, fout, children, groep }: { naam: string; label: string; fout?: string; children: ReactNode; groep?: boolean }) {
  if (groep) {
    return (
      <div className="af4-veld" data-veld={naam} role="group" aria-label={label}>
        <span>{label}</span>
        {children}
        <Fout tekst={fout} />
      </div>
    );
  }
  return (
    <label className="af4-veld" data-veld={naam}>
      <span>{label}</span>
      {children}
      <Fout tekst={fout} />
    </label>
  );
}

function Fout({ tekst }: { tekst?: string }) {
  return tekst ? <span className="af4-veldfout" role="alert">{tekst}</span> : null;
}

const CSS = `
.d3.d3.d3 .af4{background:var(--espresso);color:#fff;padding:140px 0 80px}
.d3.d3.d3 .af4[data-sector="hotels"]{--accent:var(--rose)}
.d3.d3.d3 .af4[data-sector="events"]{--accent:var(--sky)}
.d3.d3.d3 .af4[data-sector="logistiek"]{--accent:var(--pistachio)}
.d3.d3.d3 .af4.af4-keuze{--accent:#fff}
.d3.d3.d3 .af4 *{box-sizing:border-box}
.d3.d3.d3 .af4 .af4-grid{display:grid;grid-template-columns:minmax(0,1fr) 470px;gap:56px;align-items:start}
.d3.d3.d3 .af4 .af4-chip{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600}
.d3.d3.d3 .af4 .af4-chip i{width:8px;height:8px;border-radius:50%;background:var(--accent)}
.d3.d3.d3 .af4 .af4-h1{font-weight:800;font-size:clamp(36px,4.6vw,62px);line-height:.98;letter-spacing:-.045em;margin:16px 0 0;color:#fff}
.d3.d3.d3 .af4 .af4-h1 .serif{color:var(--accent)}
.d3.d3.d3 .af4 .af4-belofte{display:none;gap:6px;flex-wrap:wrap;margin-top:12px}
.d3.d3.d3 .af4 .af4-belofte span{font-size:12.5px;font-weight:600;border:1px solid rgba(255,255,255,.28);border-radius:99px;padding:5px 10px}
.d3.d3.d3 .af4 .af4-lead{color:#D8D4CA;font-size:16.5px;line-height:1.5;margin:18px 0 24px;max-width:480px}
.d3.d3.d3 .af4 .af4-voordelen{list-style:none;margin:0;padding:0;display:grid;gap:14px}
.d3.d3.d3 .af4 .af4-voordelen li{display:grid;grid-template-columns:36px 1fr;align-items:start}
.d3.d3.d3 .af4 .af4-voordelen i{width:24px;height:24px;border-radius:50%;background:var(--accent);color:var(--espresso);display:grid;place-items:center;font-style:normal;font-size:13px;font-weight:800}
.d3.d3.d3 .af4 .af4-voordelen b{display:block;font-size:16px}
.d3.d3.d3 .af4 .af4-voordelen span{color:#CFCBC1;font-size:14px}
.d3.d3.d3 .af4 .af4-stappen{display:flex;gap:14px;margin-top:28px;padding-top:20px;border-top:1px solid rgba(255,255,255,.14);font-size:13.5px;color:#CFCBC1}
.d3.d3.d3 .af4 .af4-stappen div{flex:1}
.d3.d3.d3 .af4 .af4-stappen small{display:block;color:var(--accent);font-weight:800;font-size:12px}
.d3.d3.d3 .af4 .af4-stappen b{display:block;color:#fff;font-size:14px}
.d3.d3.d3 .af4 .af4-kaart{background:var(--offwhite);color:var(--espresso);border-radius:24px;padding:24px 26px 22px;width:100%}
.d3.d3.d3 .af4 .af4-test{display:inline-block;font-size:12px;font-weight:700;background:#FFF3C4;color:#5C4A00;border-radius:99px;padding:3px 10px;margin:0 0 10px}
.d3.d3.d3 .af4 .af4-duur{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;color:#6B675E;margin-bottom:16px}
.d3.d3.d3 .af4 .af4-duur b{color:var(--espresso)}
.d3.d3.d3 .af4 .af4-duur button,.d3.d3.d3 .af4 .af4-link{border:0;background:none;padding:0;font:inherit;font-size:13px;font-weight:600;text-decoration:underline;color:var(--espresso);cursor:pointer;white-space:nowrap}
.d3.d3.d3 .af4 .af4-blok{border:0;margin:0 0 6px;padding:0;min-width:0}
.d3.d3.d3 .af4 .af4-vraag{font-weight:800;font-size:18px;letter-spacing:-.01em;margin:14px 0 10px;padding:0;color:var(--espresso)}
.d3.d3.d3 .af4 fieldset.af4-blok .af4-vraag{margin-top:0}
.d3.d3.d3 .af4 .af4-tegels{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.d3.d3.d3 .af4 .af4-tegels button{min-height:52px;border-radius:12px;border:1px solid #DAD5CC;background:#fff;font:inherit;font-weight:700;font-size:14.5px;color:var(--espresso);cursor:pointer;padding:8px 12px;text-align:left;line-height:1.2}
.d3.d3.d3 .af4 .af4-tegels button.aan{background:var(--accent);border-color:var(--espresso);box-shadow:inset 0 0 0 1px var(--espresso)}
.d3.d3.d3 .af4 .af4-tegels button.open{grid-column:1/-1;font-weight:600;color:#5F5B52;border-style:dashed}
.d3.d3.d3 .af4 .af4-tegels button.open.aan{color:var(--espresso);border-style:solid}
.d3.d3.d3 .af4 .af4-twee{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.d3.d3.d3 .af4 .af4-veld{display:flex;flex-direction:column;gap:5px;margin-bottom:10px;min-width:0}
.d3.d3.d3 .af4 .af4-veld>span{font-size:13px!important;font-weight:600!important;color:var(--espresso);line-height:1.3!important;letter-spacing:0!important}
.d3.d3.d3 .af4 input[type=text],.d3.d3.d3 .af4 input[type=tel],.d3.d3.d3 .af4 input[type=email],.d3.d3.d3 .af4 select{height:50px;font:inherit;font-size:16px;color:var(--espresso);border:1px solid #DAD5CC;border-radius:12px;padding:0 14px;background:#fff;width:100%;min-width:0}
.d3.d3.d3 .af4 input[aria-invalid=true],.d3.d3.d3 .af4 select[aria-invalid=true]{border-color:#C2412D;box-shadow:0 0 0 3px rgba(194,65,45,.12)}
.d3.d3.d3 .af4 input:focus-visible,.d3.d3.d3 .af4 select:focus-visible,.d3.d3.d3 .af4 button:focus-visible{outline:2px solid var(--espresso);outline-offset:2px}
.d3.d3.d3 .af4 .af4-tel{display:grid;grid-template-columns:92px 1fr;gap:8px}
.d3.d3.d3 .af4 .af4-vink{line-height:1.3;display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;margin:0 0 10px;cursor:pointer;color:var(--espresso)}
.d3.d3.d3 .af4 .af4-vink input{width:20px;height:20px;accent-color:var(--espresso);margin:0}
.d3.d3.d3 .af4 .af4-anders{background:#EFECE6;border-radius:12px;padding:12px 12px 2px;margin:0 0 12px}
.d3.d3.d3 .af4 .af4-hulp{font-size:12.5px;color:#6B675E;margin:-4px 0 10px}
.d3.d3.d3 .af4 .af4-datum{display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:6px}
.d3.d3.d3 .af4 .af4-datum input{padding:0 8px;text-align:center}
.d3.d3.d3 .af4 .af4-pc{position:relative}
.d3.d3.d3 .af4 .af4-plaats{font-size:13px!important;font-weight:700!important;line-height:1!important;position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#3E7A4C;pointer-events:none;background:#fff;padding-left:4px}
.d3.d3.d3 .af4 .af4-pillen{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.d3.d3.d3 .af4 .af4-pillen button{min-height:46px;border-radius:12px;border:1px solid #DAD5CC;background:#fff;font:inherit;font-weight:700;font-size:13.5px;color:var(--espresso);cursor:pointer;padding:6px}
.d3.d3.d3 .af4 .af4-pillen button.aan{background:var(--espresso);color:#fff;border-color:var(--espresso)}
.d3.d3.d3 .af4 .af4-veldfout{color:#A2321F;font-size:12.5px;font-weight:600}
.d3.d3.d3 .af4 .af4-honing{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.d3.d3.d3 .af4 .af4-knoppen{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.d3.d3.d3 .af4 .af4-bewijs{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#4F4B43;margin:6px 0 4px}
.d3.d3.d3 .af4 .af4-bewijs b{color:var(--espresso)}
.d3.d3.d3 .af4 .af4-ster{color:#D9A31E;letter-spacing:1px}
.d3.d3.d3 .af4 .af4-wa{height:56px;border:0;border-radius:14px;background:#3E8E5A;color:#fff;font:inherit;font-weight:800;font-size:16.5px;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;box-shadow:0 6px 16px rgba(62,142,90,.28)}
.d3.d3.d3 .af4 .af4-wa:disabled,.d3.d3.d3 .af4 .af4-geenwa:disabled{opacity:.6;cursor:default}
.d3.d3.d3 .af4 .af4-onder{font-size:12.5px;color:#4F4B43;text-align:center;margin:0}
.d3.d3.d3 .af4 .af4-geenwa{border:0;background:none;font:inherit;font-size:13.5px;font-weight:600;text-decoration:underline;color:var(--espresso);cursor:pointer;margin-top:4px;padding:6px}
.d3.d3.d3 .af4 .af4-toestemming{font-size:11px;color:#7A766D;margin:2px 0 0;line-height:1.45;text-align:center}
.d3.d3.d3 .af4 .af4-toestemming a{color:var(--espresso);text-decoration:underline}
.d3.d3.d3 .af4 .af4-fout{background:#FBE3DE;color:#A2321F;border-radius:10px;padding:10px 12px;font-weight:600;margin:0;font-size:14px}
.d3.d3.d3 .af4 .af4-labels{display:grid;gap:10px}
.d3.d3.d3 .af4 .af4-label{display:flex;align-items:center;justify-content:space-between;gap:12px;border:0;border-radius:16px;padding:16px 18px;font:inherit;text-align:left;cursor:pointer;color:var(--espresso)}
.d3.d3.d3 .af4 .af4-label b{display:block;font-size:17px;font-weight:800}
.d3.d3.d3 .af4 .af4-label small{display:block;font-size:13px;color:#4F4B43;margin-top:3px}
.d3.d3.d3 .af4 .af4-label em{font-style:normal;font-size:20px}
.d3.d3.d3 .af4 .af4-hotels{background:var(--rose)}.d3.d3.d3 .af4 .af4-events{background:var(--sky)}.d3.d3.d3 .af4 .af4-logistiek{background:var(--pistachio)}
.d3.d3.d3 .af4 .af4-label:hover{filter:brightness(.97)}
@media (max-width:1023px){
  .d3.d3.d3 .af4{padding:96px 0 0}
  .d3.d3.d3 .af4 .af4-grid{grid-template-columns:1fr;gap:14px}
  .d3.d3.d3 .af4 .af4-lead,.d3.d3.d3 .af4 .af4-voordelen,.d3.d3.d3 .af4 .af4-stappen{display:none}
  .d3.d3.d3 .af4 .af4-belofte{display:flex}
  .d3.d3.d3 .af4 .af4-h1{font-size:34px;margin-top:10px}
  .d3.d3.d3 .af4 .af4-kaart{border-radius:24px 24px 0 0;padding:20px 16px 26px;margin:0 -16px;width:auto}
  .d3.d3.d3 .af4 .af4-tegels{grid-template-columns:1fr 1fr}
}
@media (max-width:420px){.d3.d3.d3 .af4 .af4-twee-breed{grid-template-columns:1fr;gap:0}}
`;
