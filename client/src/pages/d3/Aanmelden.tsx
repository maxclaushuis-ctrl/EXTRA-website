/**
 * Aanmelden als medewerker (/aanmelden) in design 3.0. Bron: mock-up
 * aanmelden.html.
 *
 * De opmaak komt uit de mock-up; de regels en endpoints zijn ongewijzigd
 * overgenomen uit de vorige versie, zodat het dashboard precies dezelfde
 * kandidaten binnenkrijgt:
 *  - POST  /api/aanmelden            na stap 1 (partial), of als afwijzing
 *  - PATCH /api/aanmelden/:id        bij een afwijzing later in de flow en bij het afronden
 *  - POST  /api/aanmelden/cv         als er een cv is gekozen
 *  - POST  /api/aanmelden/:id/cv-reminder  als er geen cv is
 *  - meldAanmelding()                GA4 sign_up, alleen bij een afgeronde aanmelding
 * Afwijsregels: jonger dan 17, horecamedewerker buiten de EU, onvoldoende
 * Nederlands of Engels, te weinig ervaring (drempels per zone) en een
 * werkvergunning die samenwerking blokkeert.
 *
 * Verschil met de mock-up: daar kon je in stap 3 zelf een datum en tijd voor
 * het gesprek kiezen. In het dashboard betekent een gespreksdatum dat het
 * gesprek geboekt is (via Calendly), dus dat zou de cijfers en herinneringen
 * verstoren. Stap 3 legt daarom uit hoe het gesprek gepland wordt, zoals nu.
 *
 * Taal: ?lang=en (knoppen op de Engelse site) begint in het Engels; kandidaten
 * met een nationaliteit buiten Nederland krijgen na stap 1 de Engelse teksten.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Shell from "@/design3/Shell";
import { Ic, Pijl } from "@/design3/basis";
import { useLiveReviews } from "@/hooks/useLiveReviews";
import { apiRequest } from "@/lib/queryClient";
import { meldAanmelding } from "@/lib/meting";
import { herkomstVoorFormulier } from "@/lib/herkomst";
import { ALLE_LANDNAMEN, LANDEN_SCHEIDING, bepaalZone, type LandZone } from "@shared/landen";
import { Direct } from "./Aanvraag";

type Flow = LandZone;
type Stap = "basics" | "distance_check" | "skills" | "twv" | "cv" | "klaar" | "rejected";
type Taal = "NL" | "EN";

const FUNCTIES = [
  { waarde: "horecamedewerker", NL: "Bediening of bar", EN: "Service or bar" },
  { waarde: "housekeeping", NL: "Housekeeping", EN: "Housekeeping" },
  { waarde: "chef", NL: "Keuken", EN: "Kitchen" },
  { waarde: "logistiek", NL: "Logistiek", EN: "Logistics" },
];

const ERVARING = [
  { waarde: "none", NL: "Geen ervaring", EN: "No experience" },
  { waarde: "lt6", NL: "Minder dan 6 maanden", EN: "Less than 6 months" },
  { waarde: "6to12", NL: "6 tot 12 maanden", EN: "6 to 12 months" },
  { waarde: "1to3", NL: "1 tot 3 jaar", EN: "1 to 3 years" },
  { waarde: "3plus", NL: "3 jaar of meer", EN: "3 years or more" },
];

/** Zo komt de ervaring in het dashboard te staan (ongewijzigd). */
const ERVARING_DASHBOARD: Record<string, string> = {
  none: "Geen ervaring",
  lt6: "< 6 maanden",
  "6to12": "6 - 12 maanden",
  "1to3": "1 - 3 jaar",
  "3plus": "3+ jaar",
};

const NIVEAUS = ["niet", "basis", "redelijk", "goed"] as const;

interface Drempels { housekeeping: string[]; horecamedewerker: string[]; frontoffice: string[]; chef: string[]; logistiek: string[] }
const NL_DREMPELS: Drempels = {
  housekeeping: ["1to3", "3plus"],
  horecamedewerker: ["6to12", "1to3", "3plus"],
  frontoffice: ["6to12", "1to3", "3plus"],
  chef: ["1to3", "3plus"],
  logistiek: ["6to12", "1to3", "3plus"],
};
const EU_DREMPELS: Drempels = {
  housekeeping: ["1to3", "3plus"],
  horecamedewerker: ["1to3", "3plus"],
  frontoffice: ["6to12", "1to3", "3plus"],
  chef: ["1to3", "3plus"],
  logistiek: ["6to12", "1to3", "3plus"],
};
const NON_EU_DREMPELS: Drempels = { ...EU_DREMPELS };

function leeftijd(geboortedatum: string): number {
  const nu = new Date();
  const geb = new Date(geboortedatum);
  let jaren = nu.getFullYear() - geb.getFullYear();
  const m = nu.getMonth() - geb.getMonth();
  if (m < 0 || (m === 0 && nu.getDate() < geb.getDate())) jaren--;
  return jaren;
}

const DICHTBIJ = [
  "amsterdam", "den haag", "utrecht", "haarlem", "leiden", "delft",
  "rotterdam", "amstelveen", "diemen", "zaandam", "hilversum",
  "hoofddorp", "schiphol", "almere", "amersfoort", "gouda",
  "zoetermeer", "rijswijk", "voorburg", "leidschendam", "wassenaar",
  "noordwijk", "katwijk", "alphen aan den rijn", "woerden", "nieuwegein",
  "ijmuiden", "beverwijk", "heemstede", "purmerend", "hoorn",
  "naarden", "bussum", "baarn", "soest", "zeist", "bilthoven",
  "maarssen", "breukelen", "abcoude", "weesp", "muiden",
  "scheveningen", "the hague", "lisse", "sassenheim",
  "voorhout", "oegstgeest", "rijnsburg", "dordrecht", "vlaardingen",
  "schiedam", "capelle aan den ijssel", "waddinxveen", "bodegraven",
  "huizen", "laren", "blaricum", "eemnes", "bunschoten",
  "'s-gravenhage", "diemen-noord", "diemen-zuid", "ouder-amstel", "landsmeer", "oostzaan", "duivendrecht",
];
function binnen50km(stad: string): boolean {
  const c = stad.toLowerCase().trim();
  if (DICHTBIJ.includes(c)) return true;
  return ["amsterdam", "utrecht", "den haag", "rotterdam", "haarlem", "leiden"].some((p) => c.includes(p));
}

const LANDCODES = [
  { code: "+31", naam: "Nederland" }, { code: "+32", naam: "België" }, { code: "+49", naam: "Duitsland" },
  { code: "+44", naam: "Verenigd Koninkrijk" }, { code: "+33", naam: "Frankrijk" }, { code: "+48", naam: "Polen" },
  { code: "+40", naam: "Roemenië" }, { code: "+90", naam: "Turkije" }, { code: "+212", naam: "Marokko" },
  { code: "+234", naam: "Nigeria" }, { code: "+91", naam: "India" }, { code: "+597", naam: "Suriname" },
  { code: "+359", naam: "Bulgarije" }, { code: "+36", naam: "Hongarije" }, { code: "+39", naam: "Italië" },
  { code: "+34", naam: "Spanje" }, { code: "+351", naam: "Portugal" }, { code: "+1", naam: "VS / Canada" },
  { code: "+other", naam: "Anders" },
];

export function normalizeToE164(landcode: string, nummer: string): string {
  let cijfers = nummer.replace(/[\s\-().]/g, "");
  if (cijfers.startsWith("00")) cijfers = cijfers.slice(2);
  else if (cijfers.startsWith("0")) cijfers = cijfers.slice(1);
  return `${landcode}${cijfers}`;
}

export function isValidE164(e164: string): boolean {
  return /^\+\d{7,15}$/.test(e164);
}

/** Functie uit het korte formulier op de werkpagina's naar een keuze hier. */
function functieUitKort(f: string): string {
  const s = f.toLowerCase();
  if (s.includes("housekeeping")) return "housekeeping";
  if (s.includes("keuken") || s.includes("afwas")) return "chef";
  if (s.includes("logistiek")) return "logistiek";
  if (/bediening|bar|banqueting|f&(amp;)?b/.test(s)) return "horecamedewerker";
  return "";
}

const T = {
  NL: {
    stappen: ["Persoonlijk", "Skills", "CV en gesprek"],
    basics: "Eerst wat basics",
    firstName: "Voornaam", lastName: "Achternaam", birthDate: "Geboortedatum", phone: "Telefoonnummer",
    email: "E-mailadres", city: "Woonplaats", postcode: "Postcode", nationality: "Nationaliteit",
    kiesLand: "Kies je nationaliteit", landcode: "Landcode", optioneel: "optioneel",
    functie: "Voorkeursfunctie",
    kanaal: "Via welk kanaal ben je bij EXTRA terechtgekomen?",
    kanaalPlaceholder: "Bijv. Instagram, Indeed, via een vriend",
    kanaalVast: "Automatisch ingevuld op basis van de link waarmee je binnenkwam.",
    verder: "Ga verder", terug: "Terug", verstuur: "Verstuur aanmelding", bezig: "Even geduld",
    nl: "Hoe goed spreek je Nederlands?", en: "Hoe goed spreek je Engels?",
    niveau: { niet: "Niet", basis: "Basis", redelijk: "Redelijk", goed: "Goed" },
    ervaring: "Hoeveel relevante werkervaring heb je in deze functie?",
    waarom: "Waarom vragen we dit?",
    waaromTekst: "Bij bijna al onze opdrachten heb je contact met gasten en collega's. Goed kunnen communiceren in Nederlands of Engels is daardoor essentieel. En onze klanten verwachten een bepaald ervaringsniveau, zo kunnen we de juiste match maken.",
    cvKop: "Upload je cv",
    cvUitleg: "Met je cv kunnen we gericht kijken welke opdrachten bij je passen. Zonder cv plannen we nog geen gesprek in.",
    cvKies: "Kies bestand", cvAnder: "Ander bestand kiezen", cvFormaten: "PDF, DOC of DOCX (max. 10 MB)",
    cvLater: "Nog geen cv bij de hand? Verstuur je aanmelding gewoon. Je krijgt dan een mail om je cv later te uploaden.",
    cvType: "Dit bestandstype kunnen we niet openen. Kies een PDF, DOC of DOCX.",
    cvGroot: "Dit bestand is groter dan 10 MB.",
    gesprekKop: "Je gesprek",
    gesprek: [
      "Ons team bekijkt je aanmelding, meestal binnen 1 tot 2 werkdagen.",
      "Past je profiel, dan krijg je een mail met een link om zelf een moment voor het gesprek te kiezen.",
      "Na het gesprek hoor je snel of je bij EXTRA aan de slag kunt.",
    ],
    privacy: <>We gebruiken je gegevens alleen voor je aanmelding en om contact met je op te nemen. Lees ons <a href="/privacybeleid">privacybeleid</a>.</>,
    klaarKop: <>Top, je aanmelding <span className="serif">is ontvangen!</span></>,
    klaarTekst: "Je ontvangt zo een bevestiging per mail met alle details. App ons gerust als je nog vragen hebt.",
    cvOntvangen: "CV ontvangen", cvVolgt: "CV volgt later", aanmeldingOntvangen: "Aanmelding ontvangen",
    home: "Terug naar de homepage",
    afstandKop: "Even checken",
    afstand: "Onze opdrachten zijn vooral in Amsterdam, Den Haag en Utrecht. Woon je verder weg? Dan kost reizen naar je diensten wat meer tijd. Wil je toch doorgaan?",
    jaDoor: "Ja, ik wil doorgaan", neeStop: "Nee, ik stop mijn aanmelding",
    gestoptKop: "Bedankt voor je interesse!",
    gestopt: "Fijn dat je het overwoog. Je bent altijd welkom om je later opnieuw aan te melden bij EXTRA.",
    helaas: "Helaas",
    teJong: "Je moet minimaal 17 jaar zijn om mee te draaien bij EXTRA. Kom gerust terug als je zover bent!",
    geenTaal: "Jammer! Bij bijna al onze opdrachten heb je Nederlands of Engels nodig om goed met gasten en collega's te kunnen communiceren. Verbeter je je taalskills? Dan staan de deuren weer open.",
    teWeinigErvaring: "Op dit moment zoeken onze opdrachtgevers kandidaten met wat meer werkervaring in deze functie. Dat zegt niks over jouw potentieel, het matcht nu gewoon nog niet. Kom gerust terug als je meer uren hebt staan!",
    functieNiet: "Voor deze functie zijn we helaas gebonden aan Nederlandse wetgeving rondom werkvergunningen. Dat heeft niks met jou persoonlijk te maken, het is puur een juridische beperking.",
    twvBlokkeert: "We kunnen alleen verder als je werkvergunning het toelaat om via EXTRA te werken.",
    fout: {
      firstName: "Vul je voornaam in", lastName: "Vul je achternaam in", birthDate: "Vul je geboortedatum in",
      phone: "Vul je telefoonnummer in", phoneOngeldig: "Vul een geldig telefoonnummer in (minimaal 7 cijfers)",
      email: "Vul je e-mailadres in", emailOngeldig: "Vul een geldig e-mailadres in", city: "Vul je woonplaats in",
      nationality: "Kies je nationaliteit", functie: "Kies een functie",
      dutchLevel: "Kies hoe goed je Nederlands spreekt", englishLevel: "Kies hoe goed je Engels spreekt",
      experience: "Kies je ervaring", algemeen: "Er ging iets mis. Probeer het opnieuw.",
    },
  },
  EN: {
    stappen: ["Personal", "Skills", "CV and interview"],
    basics: "Let's start with the basics",
    firstName: "First name", lastName: "Last name", birthDate: "Date of birth", phone: "Phone number",
    email: "Email address", city: "City", postcode: "Postal code", nationality: "Nationality",
    kiesLand: "Choose your nationality", landcode: "Country code", optioneel: "optional",
    functie: "Preferred role",
    kanaal: "How did you find EXTRA?",
    kanaalPlaceholder: "E.g. Instagram, Indeed, via a friend",
    kanaalVast: "Filled in automatically from the link you used.",
    verder: "Continue", terug: "Back", verstuur: "Submit application", bezig: "Please wait",
    nl: "How well do you speak Dutch?", en: "How well do you speak English?",
    niveau: { niet: "Not at all", basis: "Basic", redelijk: "Conversational", goed: "Fluent" },
    ervaring: "How much relevant experience do you have in this role?",
    waarom: "Why do we ask this?",
    waaromTekst: "Most of our assignments involve direct contact with guests and colleagues, so communicating well in Dutch or English is essential. Our clients also expect a certain level of experience. This helps us make the right match.",
    cvKop: "Upload your CV",
    cvUitleg: "Your CV helps us see which assignments suit you. Without a CV we can't schedule an interview yet.",
    cvKies: "Choose file", cvAnder: "Choose a different file", cvFormaten: "PDF, DOC or DOCX (max. 10 MB)",
    cvLater: "No CV at hand? Just submit your application. We'll email you a link to upload it later.",
    cvType: "We can't open this file type. Choose a PDF, DOC or DOCX.",
    cvGroot: "This file is larger than 10 MB.",
    gesprekKop: "Your interview",
    gesprek: [
      "Our team reviews your application, usually within 1 to 2 working days.",
      "If your profile is a match, we'll email you a link to pick a time for the interview.",
      "After the interview you'll quickly hear whether you can start working with EXTRA.",
    ],
    privacy: <>We only use your details for your application and to contact you. Read our <a href="/privacybeleid">privacy policy</a>.</>,
    klaarKop: <>Great, your application <span className="serif">has been received!</span></>,
    klaarTekst: "You'll receive a confirmation email shortly with all the details. Feel free to message us if you have any questions.",
    cvOntvangen: "CV received", cvVolgt: "CV to follow", aanmeldingOntvangen: "Application received",
    home: "Back to the homepage",
    afstandKop: "Just checking",
    afstand: "Most of our shifts are in Amsterdam, The Hague and Utrecht. If you live further away, travelling to shifts takes more time. Do you want to continue your application?",
    jaDoor: "Yes, I want to continue", neeStop: "No, I'll stop my application",
    gestoptKop: "Thank you for your interest!",
    gestopt: "We appreciate you considering us. You're always welcome to apply with EXTRA again later.",
    helaas: "Unfortunately",
    teJong: "You need to be at least 17 to join EXTRA. Come back when you're ready, we'd love to have you!",
    geenTaal: "Most of our assignments require Dutch or English. Since you indicated you don't speak either language well enough, we unfortunately cannot proceed.",
    teWeinigErvaring: "Right now our clients are looking for candidates with a bit more experience in this role. That's no reflection on you, it just isn't the right match yet. Come back when you've got more hours under your belt!",
    functieNiet: "Due to Dutch labour law and work permit regulations, we can't accept your application for this role at this time. This is not a judgment of you as a person, but purely a legal requirement.",
    twvBlokkeert: "We can only continue if your work permit allows you to work via EXTRA.",
    fout: {
      firstName: "First name is required", lastName: "Last name is required", birthDate: "Date of birth is required",
      phone: "Phone number is required", phoneOngeldig: "Enter a valid phone number (at least 7 digits)",
      email: "Email is required", emailOngeldig: "Invalid email address", city: "City is required",
      nationality: "Nationality is required", functie: "Please select a role",
      dutchLevel: "Please select your Dutch level", englishLevel: "Please select your English level",
      experience: "Please select your experience", algemeen: "Something went wrong. Please try again.",
    },
  },
};

const NON_EU_UITLEG = "Because of Dutch labour law and work permit regulations, we need a few extra questions. We treat every application equally, but we must check if working in the Netherlands is legally possible.";

/** Afwijzing om een functie die buiten de EU niet kan: in het Nederlands voor Nederlandstalige landen. */
const NL_TALIG = ["Nederland", "België", "Duitsland", "Oostenrijk", "Zwitserland", "Luxemburg", "Suriname", "Curaçao", "Aruba", "Sint Maarten", "Bonaire"];

interface Gegevens {
  firstName: string; lastName: string; birthDate: string; city: string; postcode: string;
  phone: string; phoneCountryCode: string; email: string; nationality: string; preferredFunction: string;
  dutchLevel: string; englishLevel: string; experience: string;
  twvNeeded: string; hasExistingTwv: string; willingToStopTwv: string;
  channel: string; referralCode: string;
}

function Chips({ naam, opties, waarde, kies, fout }: { naam: string; opties: { waarde: string; label: string }[]; waarde: string; kies: (w: string) => void; fout?: string }) {
  return (
    <>
      <div className="chips" role="radiogroup">
        {opties.map((o) => (
          <label className="chip-k" key={o.waarde}>
            <input type="radio" name={naam} value={o.waarde} checked={waarde === o.waarde} onChange={() => kies(o.waarde)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {fout && <p className="am-fout" role="alert">{fout}</p>}
    </>
  );
}

function Blok({ nr, kop, children }: { nr: number; kop: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="av-blok">
      <legend><span className="av-nr">{nr}</span>{kop}</legend>
      {children}
    </fieldset>
  );
}

export default function Aanmelden() {
  const [stap, setStap] = useState<Stap>("basics");
  const [flow, setFlow] = useState<Flow>("NL");
  const [afwijzing, setAfwijzing] = useState<{ kop: string; tekst: string } | null>(null);
  const [bezig, setBezig] = useState(false);
  const [algemeneFout, setAlgemeneFout] = useState<string | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [cvFout, setCvFout] = useState<string | null>(null);
  const [kandidaatId, setKandidaatId] = useState<number | null>(null);
  const [fouten, setFouten] = useState<Record<string, string>>({});
  const kaart = useRef<HTMLFormElement>(null);

  // Eenmalig uit de URL: taal, kanaal (utm_source of Jobster) en referral-code.
  const begin = useMemo(() => {
    let p: URLSearchParams;
    try { p = new URLSearchParams(window.location.search); } catch { p = new URLSearchParams(); }
    const utm = p.get("utm_source");
    const kanaal = utm ? utm.charAt(0).toUpperCase() + utm.slice(1).toLowerCase() : p.get("jid") ? "Jobster" : "";
    // Referral-code: ondoorzichtige string, alleen opslaan. Vastgehouden in
    // sessionStorage zodat hij blijft staan als de kandidaat wegnavigeert.
    let ref = (p.get("ref") || "").trim();
    try {
      if (ref) sessionStorage.setItem("extra_ref", ref);
      else ref = sessionStorage.getItem("extra_ref") || "";
    } catch { /* niet beschikbaar: de code blijft in de formulierstatus */ }
    return { taal: p.get("lang"), kanaal, kanaalVast: !!kanaal, ref };
  }, []);

  const [g, setG] = useState<Gegevens>(() => {
    const leeg: Gegevens = {
      firstName: "", lastName: "", birthDate: "", city: "", postcode: "",
      phone: "", phoneCountryCode: "+31", email: "", nationality: "", preferredFunction: "",
      dutchLevel: "", englishLevel: "", experience: "",
      twvNeeded: "", hasExistingTwv: "", willingToStopTwv: "",
      channel: begin.kanaal, referralCode: begin.ref,
    };
    // Voorinvullen vanuit het korte formulier op de werkpagina's (sessionStorage, niet de URL).
    try {
      const kort = JSON.parse(sessionStorage.getItem("extra-aanmelden") || "null");
      sessionStorage.removeItem("extra-aanmelden");
      if (kort && typeof kort === "object") {
        const delen = String(kort.naam || "").trim().split(/\s+/);
        leeg.firstName = delen[0] || "";
        leeg.lastName = delen.slice(1).join(" ");
        leeg.phone = String(kort.telefoon || "");
        leeg.preferredFunction = functieUitKort(String(kort.functie || ""));
      }
    } catch { /* geen voorinvulling */ }
    return leeg;
  });

  const paginaTaal: Taal = begin.taal === "en" ? "EN" : "NL";
  const taal: Taal = begin.taal === "en" ? "EN" : flow === "NL" ? "NL" : "EN";
  const t = T[taal];
  const nummer = stap === "basics" || stap === "distance_check" ? 1 : stap === "skills" || stap === "twv" ? 2 : 3;

  const zet = useCallback((veld: keyof Gegevens, waarde: string) => {
    setG((o) => ({ ...o, [veld]: waarde }));
    setFouten((o) => { const n = { ...o }; delete n[veld]; return n; });
  }, []);

  const naar = (s: Stap) => {
    setStap(s);
    setAlgemeneFout(null);
  };

  // Bij een nieuwe stap het begin van de kaart in beeld.
  const eersteRender = useRef(true);
  useEffect(() => {
    if (eersteRender.current) { eersteRender.current = false; return; }
    const k = kaart.current;
    // Onder de vaste kopregel blijven.
    const boven = k ? k.getBoundingClientRect().top - 96 : 0;
    if (k && boven < 0) {
      window.scrollTo({ top: window.scrollY + boven, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }, [stap]);

  function referralOpruimen() {
    try { sessionStorage.removeItem("extra_ref"); } catch { /* niet beschikbaar */ }
  }

  const telefoonE164 = () => (g.phoneCountryCode !== "+other" ? normalizeToE164(g.phoneCountryCode, g.phone) : g.phone);

  function controleerStap1(): boolean {
    const f: Record<string, string> = {};
    if (!g.firstName.trim()) f.firstName = t.fout.firstName;
    if (!g.lastName.trim()) f.lastName = t.fout.lastName;
    if (!g.birthDate) f.birthDate = t.fout.birthDate;
    if (!g.city.trim()) f.city = t.fout.city;
    if (!g.email.trim()) f.email = t.fout.email;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email)) f.email = t.fout.emailOngeldig;
    if (!g.nationality || g.nationality === LANDEN_SCHEIDING) f.nationality = t.fout.nationality;
    if (!g.preferredFunction) f.preferredFunction = t.fout.functie;
    const code = g.phoneCountryCode === "+other" ? "" : g.phoneCountryCode;
    if (!g.phone.trim()) f.phone = t.fout.phone;
    else if (code && !isValidE164(normalizeToE164(code, g.phone))) f.phone = t.fout.phoneOngeldig;
    if (g.birthDate && leeftijd(g.birthDate) < 17) f.birthDate = t.teJong;
    setFouten(f);
    const eerste = Object.keys(f)[0];
    if (eerste) kaart.current?.querySelector<HTMLElement>(`[name="${eerste}"]`)?.focus();
    return !eerste;
  }

  function controleerStap2(): boolean {
    const f: Record<string, string> = {};
    if (!g.dutchLevel) f.dutchLevel = t.fout.dutchLevel;
    if (!g.englishLevel) f.englishLevel = t.fout.englishLevel;
    if (!g.experience) f.experience = t.fout.experience;
    setFouten(f);
    return Object.keys(f).length === 0;
  }

  const taalVoldoende = () =>
    g.dutchLevel === "redelijk" || g.dutchLevel === "goed" ||
    ((g.dutchLevel === "niet" || g.dutchLevel === "basis") && (g.englishLevel === "redelijk" || g.englishLevel === "goed"));

  // De vaardigheidslabels voor horecamedewerkers hebben (nog) geen vragen in
  // het formulier; ze gaan zoals voorheen als "nee" mee.
  const horecaLabels = () => (g.preferredFunction === "horecamedewerker"
    ? { canIndependentShift: false, canCarryThreePlates: false, isBarista: false, canMakeCocktails: false, isAssistantChef: false, canDoWashing: false, isPromoter: false, serviceSkills: null, barSkills: null, dinerSkills: null }
    : {});

  async function bewaar(status: "in_behandeling" | "afgewezen", partial: boolean, reden?: string): Promise<number | null> {
    if (status === "afgewezen") referralOpruimen();
    try {
      if (kandidaatId) {
        await apiRequest(`/api/aanmelden/${kandidaatId}`, {
          method: "PATCH",
          body: JSON.stringify({ email: g.email, status, partial, rejectionReason: reden, referralCode: g.referralCode || null }),
        });
        return kandidaatId;
      }
      const res: any = await apiRequest("/api/aanmelden", {
        method: "POST",
        body: JSON.stringify({
          firstName: g.firstName, lastName: g.lastName, email: g.email, phone: telefoonE164(),
          birthDate: g.birthDate, nationality: g.nationality, city: g.city,
          functionType: g.preferredFunction,
          referralCode: g.referralCode || null,
          sourceChannel: g.channel ? `Website - ${g.channel}` : "Website aanmeldflow",
          herkomst: herkomstVoorFormulier(),
          status, partial,
          notes: reden ? `Afgewezen reden: ${reden}` : undefined,
          rejectionReason: status === "afgewezen" ? reden : undefined,
        }),
      });
      if (res?.id) { setKandidaatId(res.id); return res.id; }
    } catch (err: any) {
      if (err?.status === 409) console.log("Kandidaat al aangemeld met dit e-mailadres");
      else console.error("Fout bij opslaan kandidaat:", err);
    }
    return null;
  }

  const wijsAf = (tekst: string, kop = t.helaas) => { setAfwijzing({ kop, tekst }); naar("rejected"); };

  async function naStap1() {
    if (bezig || !controleerStap1()) return;
    setBezig(true);
    try {
      const zone = bepaalZone(g.nationality);
      setFlow(zone);
      if (zone === "NON_EU" && g.preferredFunction === "horecamedewerker") {
        await bewaar("afgewezen", false, "Functie niet beschikbaar voor non-EU");
        const nlTalig = NL_TALIG.includes(g.nationality);
        setAfwijzing({ kop: (nlTalig ? T.NL : T.EN).helaas, tekst: (nlTalig ? T.NL : T.EN).functieNiet });
        naar("rejected");
        return;
      }
      await bewaar("in_behandeling", true);
      naar(g.city.trim() && !binnen50km(g.city) ? "distance_check" : "skills");
    } finally {
      setBezig(false);
    }
  }

  async function naStap2() {
    if (bezig || !controleerStap2()) return;
    setBezig(true);
    try {
      if (!taalVoldoende()) {
        await bewaar("afgewezen", false, "Geen taalvaardigheid Nederlands/Engels");
        wijsAf(t.geenTaal);
        return;
      }
      const fn = g.preferredFunction as keyof Drempels;
      const drempels = flow === "NL" ? NL_DREMPELS : flow === "EU" ? EU_DREMPELS : NON_EU_DREMPELS;
      let toegestaan = drempels[fn] || [];
      if (fn === "horecamedewerker") {
        const nederlandstalig = g.dutchLevel === "redelijk" || g.dutchLevel === "goed";
        toegestaan = nederlandstalig ? ["6to12", "1to3", "3plus"] : ["1to3", "3plus"];
      }
      if (toegestaan.length === 0) {
        await bewaar("afgewezen", false, "Functie niet beschikbaar");
        wijsAf(t.functieNiet);
        return;
      }
      if (!toegestaan.includes(g.experience)) {
        await bewaar("afgewezen", false, "Onvoldoende ervaring");
        wijsAf(t.teWeinigErvaring);
        return;
      }
      if (flow === "NON_EU") {
        await bewaar("in_behandeling", true);
        naar("twv");
        return;
      }
      naar("cv");
    } catch {
      setAlgemeneFout(t.fout.algemeen);
    } finally {
      setBezig(false);
    }
  }

  async function naTwv() {
    if (g.twvNeeded === "yes" && g.hasExistingTwv === "yes" && g.willingToStopTwv === "no") {
      await bewaar("afgewezen", false, "TWV blokkeert samenwerking");
      wijsAf(taal === "EN" ? T.EN.twvBlokkeert : T.NL.twvBlokkeert);
      return;
    }
    naar("cv");
  }

  async function rondAf() {
    if (bezig) return;
    setBezig(true);
    setAlgemeneFout(null);
    try {
      const telefoon = telefoonE164();
      const delen: string[] = [];
      const m: Record<string, string> = { basis: "Basis", redelijk: "Redelijk", goed: "Goed" };
      if (g.dutchLevel && g.dutchLevel !== "niet") delen.push(`${m[g.dutchLevel] || g.dutchLevel} Nederlands`);
      if (g.englishLevel && g.englishLevel !== "niet") delen.push(`${m[g.englishLevel] || g.englishLevel} Engels`);
      const language = delen.join(", ") || "Geen";
      const horecaExperience = ERVARING_DASHBOARD[g.experience] || g.experience;
      const needsTwv = flow === "NON_EU" && g.twvNeeded === "yes";
      const notes = [cv ? `CV: ${cv.name}` : null, g.channel ? `Gevonden via: ${g.channel}` : null].filter(Boolean).join(" | ");
      const labels = horecaLabels();

      let id = kandidaatId;
      if (!id) {
        const res: any = await apiRequest("/api/aanmelden", {
          method: "POST",
          body: JSON.stringify({
            firstName: g.firstName, lastName: g.lastName, email: g.email,
            phone: telefoon, birthDate: g.birthDate, nationality: g.nationality, city: g.city,
            language, functionType: g.preferredFunction, horecaExperience, needsTwv,
            referralCode: g.referralCode || null,
            interviewDate: null, interviewTime: null,
            sourceChannel: g.channel ? `Website - ${g.channel}` : "Website aanmeldflow",
            herkomst: herkomstVoorFormulier(),
            notes, partial: true,
            ...labels,
          }),
        });
        id = res?.id ?? null;
        if (id) setKandidaatId(id);
      }

      // CV meesturen als die er is (een mislukte upload blokkeert de aanmelding niet),
      // anders een herinneringsmail om hem later te uploaden.
      if (cv && id) {
        try {
          const fd = new FormData();
          fd.append("cv", cv);
          fd.append("email", g.email);
          fd.append("candidateId", String(id));
          await fetch("/api/aanmelden/cv", { method: "POST", body: fd });
        } catch { /* aanmelding gaat door */ }
      } else if (!cv && id) {
        fetch(`/api/aanmelden/${id}/cv-reminder`, { method: "POST" }).catch(() => {});
      }

      // Afronden: dit stuurt de mail naar kantoor.
      if (id) {
        await apiRequest(`/api/aanmelden/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ email: g.email, language, horecaExperience, needsTwv, notes, partial: false, referralCode: g.referralCode || null, ...labels }),
        });
      }
      referralOpruimen();
      // Alleen hier is een aanmelding echt af; niet bij de eerste opslag en niet bij een afwijzing.
      meldAanmelding(taal === "NL" ? "nl" : "en");
      naar("klaar");
    } catch {
      setAlgemeneFout(t.fout.algemeen);
    } finally {
      setBezig(false);
    }
  }

  function kiesCv(e: ChangeEvent<HTMLInputElement>) {
    const bestand = e.target.files?.[0];
    if (!bestand) return;
    const types = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!types.includes(bestand.type)) { setCvFout(t.cvType); e.target.value = ""; return; }
    if (bestand.size > 10 * 1024 * 1024) { setCvFout(t.cvGroot); e.target.value = ""; return; }
    setCvFout(null);
    setCv(bestand);
  }

  const veld = (naam: keyof Gegevens, label: string, props: Record<string, string> = {}, opt = false) => (
    <label className={`veld${opt ? " opt" : ""}${fouten[naam] ? " fout" : ""}`}>
      <span>{label}{opt && <> <small>{t.optioneel}</small></>}</span>
      <input name={naam} {...props} required={!opt} value={g[naam]} onChange={(e) => zet(naam, e.target.value)} aria-invalid={!!fouten[naam] || undefined} />
      {fouten[naam] && <em>{fouten[naam]}</em>}
    </label>
  );

  const knop = (tekst: string, actie: () => void, type: "button" | "submit" = "button") => (
    <button className="knop vol av-knop" type={type} onClick={type === "button" ? actie : undefined} disabled={bezig}>
      {bezig ? t.bezig : tekst} <Pijl />
    </button>
  );

  const land = LANDCODES.find((l) => l.code === g.phoneCountryCode) ?? LANDCODES[0];
  const links = paginaTaal === "EN"
    ? {
      eyebrow: "Apply", h1: <>Sign up as hospitality staff <span className="serif">at EXTRA</span></>,
      lead: "Signed up in three steps. After that we'll plan an introduction at our office.",
      stappen: [["Personal", "First the basics: your details and preferred role."], ["Skills", "Language and experience, so we can make the right match."], ["CV and interview", "Upload your CV and we'll invite you for an interview."]],
      bewijs: ["Employed", "everyone, no freelancers"], dag: ["Next day", "paid"], direct: "Question?", uit: "from",
    }
    : {
      eyebrow: "Aanmelden", h1: <>Aanmelden als horeca{"\u00AD"}medewerker <span className="serif">bij EXTRA</span></>,
      lead: "In drie stappen aangemeld. Daarna plannen we een kennismaking op ons kantoor.",
      stappen: [["Persoonlijk", "Eerst wat basics: je gegevens en voorkeursfunctie."], ["Skills", "Taal en ervaring, zodat we de juiste match maken."], ["CV en gesprek", "Upload je cv en we nodigen je uit voor een gesprek."]],
      bewijs: ["Loondienst", "iedereen, geen zzp"], dag: ["Volgende dag", "betaald"], direct: "Vraag?", uit: "uit",
    };

  return (
    <Shell css={["events", "hotels", "werk", "bedrijf", "aanvraag", "pagina"]} bodyKlasse="aanvraagpag" telKnop>
      <section className="av-pag am-pag">
        <div className="w av-grid">
          <div className="av-links">
            <span className="eyebrow">{links.eyebrow}</span>
            <h1 className="av-h1">{links.h1}</h1>
            <p className="av-lead">{links.lead}</p>
            <ol className="av-stappen">
              {links.stappen.map(([b, s]) => <li key={b}><b>{b}</b><span>{s}</span></li>)}
            </ol>
            <Bewijs taal={paginaTaal} uit={links.uit} derde={links.bewijs as [string, string]} vierde={links.dag as [string, string]} />
            <Direct label={links.direct} />
          </div>

          <form ref={kaart} className="av-kaart am-kaart" id="aanmelden" noValidate aria-label={paginaTaal === "EN" ? "Sign up as staff" : "Aanmelden als medewerker"}
            onSubmit={(e) => { e.preventDefault(); if (stap === "cv") rondAf(); }}>
            {stap !== "klaar" && stap !== "rejected" && (
              <ol className="am-voortgang" aria-label={taal === "EN" ? "Progress" : "Voortgang"}>
                {t.stappen.map((s, i) => <li key={s} className={i < nummer ? "aan" : undefined} aria-current={i + 1 === nummer ? "step" : undefined}><b>{i + 1}</b>{s}</li>)}
              </ol>
            )}

            {stap === "basics" && (
              <div className="am-stap">
                <Blok nr={1} kop={t.basics}>
                  <div className="av-velden">
                    {veld("firstName", t.firstName, { autoComplete: "given-name" })}
                    {veld("lastName", t.lastName, { autoComplete: "family-name" })}
                    {veld("birthDate", t.birthDate, { type: "date" })}
                    <label className={`veld${fouten.phone ? " fout" : ""}`}>
                      <span>{t.phone}</span>
                      <div className="am-tel">
                        <span className="am-land">
                          <b aria-hidden="true">{land.code === "+other" ? "+" : land.code}</b>
                          <select aria-label={t.landcode} value={g.phoneCountryCode} onChange={(e) => zet("phoneCountryCode", e.target.value)}>
                            {LANDCODES.map((l) => <option key={l.code} value={l.code}>{l.naam}{l.code !== "+other" ? ` ${l.code}` : ""}</option>)}
                          </select>
                        </span>
                        <input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="06 12 34 56 78" required value={g.phone}
                          onChange={(e) => zet("phone", e.target.value.replace(/[^\d\s\-().+]/g, ""))} aria-invalid={!!fouten.phone || undefined} />
                      </div>
                      {fouten.phone && <em>{fouten.phone}</em>}
                    </label>
                    {veld("email", t.email, { type: "email", autoComplete: "email", placeholder: "jouw@email.nl" })}
                    {veld("city", t.city, { autoComplete: "address-level2", placeholder: "Amsterdam" })}
                    {veld("postcode", t.postcode, { autoComplete: "postal-code", placeholder: "1012 AB" }, true)}
                    <label className={`veld${fouten.nationality ? " fout" : ""}`}>
                      <span>{t.nationality}</span>
                      <select name="nationality" required value={g.nationality} onChange={(e) => zet("nationality", e.target.value)} aria-invalid={!!fouten.nationality || undefined}>
                        <option value="" disabled>{t.kiesLand}</option>
                        {ALLE_LANDNAMEN.map((l, i) => (l === LANDEN_SCHEIDING
                          ? <option key={`sep${i}`} value={LANDEN_SCHEIDING} disabled>──────────</option>
                          : <option key={l} value={l}>{l}</option>))}
                      </select>
                      {fouten.nationality && <em>{fouten.nationality}</em>}
                    </label>
                  </div>
                </Blok>
                <Blok nr={2} kop={t.functie}>
                  <Chips naam="preferredFunction" waarde={g.preferredFunction} kies={(w) => zet("preferredFunction", w)} fout={fouten.preferredFunction}
                    opties={FUNCTIES.map((f) => ({ waarde: f.waarde, label: f[taal] }))} />
                </Blok>
                <details className="av-extra" open={begin.kanaalVast || undefined}>
                  <summary>{t.kanaal} <small>{t.optioneel}</small></summary>
                  <textarea name="channel" rows={2} placeholder={t.kanaalPlaceholder} value={g.channel} readOnly={begin.kanaalVast}
                    onChange={(e) => { if (!begin.kanaalVast) zet("channel", e.target.value); }} />
                  {begin.kanaalVast && <p className="am-noot">{t.kanaalVast}</p>}
                </details>
                {knop(t.verder, naStap1)}
              </div>
            )}

            {stap === "distance_check" && (
              <div className="am-stap am-melding">
                <h2>{t.afstandKop}</h2>
                <p>{t.afstand}</p>
                <div className="am-knoppen">
                  <button className="knop lijn" type="button" onClick={() => wijsAf(t.gestopt, t.gestoptKop)}>{t.neeStop}</button>
                  <button className="knop vol av-knop" type="button" onClick={() => naar("skills")}>{t.jaDoor} <Pijl /></button>
                </div>
              </div>
            )}

            {stap === "skills" && (
              <div className="am-stap">
                {flow === "NON_EU" && <p className="am-waarom">{NON_EU_UITLEG}</p>}
                <Blok nr={1} kop={t.nl}>
                  <Chips naam="dutchLevel" waarde={g.dutchLevel} kies={(w) => zet("dutchLevel", w)} fout={fouten.dutchLevel}
                    opties={NIVEAUS.map((n) => ({ waarde: n, label: t.niveau[n] }))} />
                </Blok>
                <Blok nr={2} kop={t.en}>
                  <Chips naam="englishLevel" waarde={g.englishLevel} kies={(w) => zet("englishLevel", w)} fout={fouten.englishLevel}
                    opties={NIVEAUS.map((n) => ({ waarde: n, label: t.niveau[n] }))} />
                </Blok>
                <Blok nr={3} kop={t.ervaring}>
                  <Chips naam="experience" waarde={g.experience} kies={(w) => zet("experience", w)} fout={fouten.experience}
                    opties={ERVARING.map((e) => ({ waarde: e.waarde, label: e[taal] }))} />
                </Blok>
                <p className="am-waarom"><b>{t.waarom}</b> {t.waaromTekst}</p>
                {algemeneFout && <p className="form-fout" role="alert">{algemeneFout}</p>}
                <div className="am-knoppen">
                  <button className="knop lijn am-terug" type="button" onClick={() => naar("basics")}>{t.terug}</button>
                  {knop(t.verder, naStap2)}
                </div>
              </div>
            )}

            {stap === "twv" && (
              <div className="am-stap">
                <Blok nr={1} kop="Do you need a work permit (TWV) to work in the Netherlands?">
                  <Chips naam="twvNeeded" waarde={g.twvNeeded} kies={(w) => zet("twvNeeded", w)}
                    opties={[{ waarde: "yes", label: "Yes" }, { waarde: "no", label: "No" }, { waarde: "unknown", label: "I don't know" }]} />
                  {g.twvNeeded === "unknown" && <p className="am-waarom">If you are not an EU/EEA or Swiss citizen, you usually need a TWV. Our team will check this with you in the interview.</p>}
                </Blok>
                {g.twvNeeded === "yes" && (
                  <Blok nr={2} kop="Do you already have a valid TWV for another employer in the Netherlands?">
                    <Chips naam="hasExistingTwv" waarde={g.hasExistingTwv} kies={(w) => zet("hasExistingTwv", w)}
                      opties={[{ waarde: "yes", label: "Yes" }, { waarde: "no", label: "No" }]} />
                  </Blok>
                )}
                {g.twvNeeded === "yes" && g.hasExistingTwv === "yes" && (
                  <Blok nr={3} kop="Are you willing to stop that TWV if you start working via EXTRA?">
                    <Chips naam="willingToStopTwv" waarde={g.willingToStopTwv} kies={(w) => zet("willingToStopTwv", w)}
                      opties={[{ waarde: "yes", label: "Yes" }, { waarde: "no", label: "No" }]} />
                  </Blok>
                )}
                <div className="am-knoppen">
                  <button className="knop lijn am-terug" type="button" onClick={() => naar("skills")}>{t.terug}</button>
                  {knop(t.verder, naTwv)}
                </div>
              </div>
            )}

            {stap === "cv" && (
              <div className="am-stap">
                <Blok nr={1} kop={t.cvKop}>
                  <p className="am-uitleg">{t.cvUitleg}</p>
                  <label className={`am-upload${cv ? " gekozen" : ""}`}>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={kiesCv} />
                    {cv
                      ? <><Ic n="vink" /><b>{cv.name}</b><span>{cv.size < 1024 * 1024 ? `${Math.max(1, Math.round(cv.size / 1024))} kB` : `${(cv.size / 1024 / 1024).toFixed(1).replace(".", taal === "NL" ? "," : ".")} MB`} · {t.cvAnder}</span></>
                      : <><b>{t.cvKies}</b><span>{t.cvFormaten}</span></>}
                  </label>
                  {cvFout && <p className="am-fout" role="alert">{cvFout}</p>}
                  {!cv && <p className="am-noot">{t.cvLater}</p>}
                </Blok>
                <Blok nr={2} kop={t.gesprekKop}>
                  <ol className="am-volgende">{t.gesprek.map((s) => <li key={s}>{s}</li>)}</ol>
                </Blok>
                {algemeneFout && <p className="form-fout" role="alert">{algemeneFout}</p>}
                <div className="am-knoppen">
                  <button className="knop lijn am-terug" type="button" onClick={() => naar(flow === "NON_EU" ? "twv" : "skills")}>{t.terug}</button>
                  {knop(t.verstuur, rondAf, "submit")}
                </div>
                <p className="av-privacy">{t.privacy}</p>
              </div>
            )}

            {stap === "klaar" && (
              <div className="am-klaar" role="status">
                <span className="am-vink"><Ic n="vink" /></span>
                <h2>{t.klaarKop}</h2>
                <p>{t.klaarTekst}</p>
                <ul className="am-check">
                  <li className="ja"><Ic n="vink" />{t.aanmeldingOntvangen}</li>
                  <li className={cv ? "ja" : undefined}><Ic n="vink" />{cv ? t.cvOntvangen : t.cvVolgt}</li>
                </ul>
                <ol className="am-volgende">{t.gesprek.map((s) => <li key={s}>{s}</li>)}</ol>
                <a className="knop vol" href="/">{t.home} <Pijl /></a>
              </div>
            )}

            {stap === "rejected" && afwijzing && (
              <div className="am-klaar am-af" role="status">
                <h2>{afwijzing.kop}</h2>
                <p>{afwijzing.tekst}</p>
                <a className="knop vol" href="/">{t.home} <Pijl /></a>
              </div>
            )}
          </form>
        </div>
      </section>
    </Shell>
  );
}

function Bewijs({ taal, uit, derde, vierde }: { taal: Taal; uit: string; derde: [string, string]; vierde: [string, string] }) {
  const rv = useLiveReviews(taal === "EN" ? "en" : "nl");
  return (
    <ul className="av-bewijs">
      <li><b>{rv.scoreTekst}</b><span>{uit} {rv.aantal} Google reviews</span></li>
      <li><b>{derde[0]}</b><span>{derde[1]}</span></li>
      <li><b>{vierde[0]}</b><span>{vierde[1]}</span></li>
    </ul>
  );
}
