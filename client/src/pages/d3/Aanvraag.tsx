/**
 * Personeel aanvragen (/personeelsaanvraag) en de bedankpagina
 * (/aanvraag-ontvangen) in design 3.0. Bron: mock-ups personeel-aanvragen.html
 * en aanvraag-ontvangen.html.
 *
 * Het formulier gaat naar dezelfde endpoint als de vorige versie
 * (POST /api/staffing-request), met de waarden die het dashboard kent:
 *  - branche  → locationType: hotel, eventlocatie, logistiek of anders
 *  - functies → functions[]
 *  - wanneer  → urgency: zo_snel_mogelijk, deze_week, volgende_week of nog_niet_bekend
 *  - toelichting → notes
 * E-mail is hier verplicht (geen bron "terugbel"), dus de afzender krijgt een
 * bevestigingsmail. Daarna door naar /aanvraag-ontvangen, waar het GA4-doel
 * generate_lead afgaat.
 *
 * Taal: dezelfde componenten staan ook op /en/request-staff en
 * /en/request-received (bron: mock-ups en/request-staff.html en
 * en/request-received.html). De taal volgt uit het pad (taalVanPad). Alleen de
 * zichtbare teksten verschillen: de waarden die naar /api/staffing-request gaan
 * (locationType, functions, urgency) zijn in beide talen gelijk.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import Shell from "@/design3/Shell";
import { Ic, Pijl, haalVoornaam, onthoudVoornaam } from "@/design3/basis";
import { TELEFOON, TELEFOON_EN, TELEFOON_HREF, WHATSAPP_HREF } from "@/design3/links";
import { useLiveReviews } from "@/hooks/useLiveReviews";
import { herkomstVoorFormulier } from "@/lib/herkomst";
import { taalVanPad, type Taal } from "@shared/taal";

type Branche = "hotel" | "event" | "logistiek" | "anders";

const BRANCHES: { waarde: Branche; label: string; en: string; sector: string; locatie: string }[] = [
  { waarde: "hotel", label: "Hotel", en: "Hotel", sector: "horeca", locatie: "hotel" },
  { waarde: "event", label: "Event", en: "Event", sector: "events", locatie: "eventlocatie" },
  { waarde: "logistiek", label: "Logistiek", en: "Logistics", sector: "logistiek", locatie: "logistiek" },
  { waarde: "anders", label: "Anders", en: "Other", sector: "algemeen", locatie: "anders" },
];

const FUNCTIES: Record<Branche, string[]> = {
  hotel: ["Housekeeping", "Front office", "F&B", "Banqueting", "Keuken", "Afwas"],
  event: ["Bediening", "Bar", "Dinerlopers", "Runners", "Hosts", "Supervisor"],
  logistiek: ["Orderpicker", "Heftruck", "Inpak", "Expeditie", "Magazijn", "Voorraad"],
  anders: ["Bediening", "Bar", "Keuken", "Housekeeping", "Front office", "Logistiek"],
};

/** Engelse labels bij de functiewaarden hierboven. De waarde blijft Nederlands (dashboard). */
const FUNCTIE_EN: Record<string, string> = {
  Housekeeping: "Housekeeping", "Front office": "Front office", "F&B": "F&B", Banqueting: "Banqueting",
  Keuken: "Kitchen", Afwas: "Dishwashing", Bediening: "Waiting staff", Bar: "Bar", Dinerlopers: "Food runners",
  Runners: "Runners", Hosts: "Hosts", Supervisor: "Supervisor", Orderpicker: "Order picker", Heftruck: "Forklift",
  Inpak: "Packing", Expeditie: "Dispatch", Magazijn: "Warehouse", Voorraad: "Stock", Logistiek: "Logistics",
};

/** Dezelfde waarden als de keuzelijst Urgentie in het dashboard. */
const WANNEER: { waarde: string; label: string; en: string }[] = [
  { waarde: "zo_snel_mogelijk", label: "Zo snel mogelijk", en: "As soon as possible" },
  { waarde: "deze_week", label: "Deze week", en: "This week" },
  { waarde: "volgende_week", label: "Volgende week", en: "Next week" },
  { waarde: "nog_niet_bekend", label: "Weet ik nog niet", en: "Not sure yet" },
];

type Veld = "companyName" | "contactName" | "phone" | "email";

const VELDEN: { naam: Veld; label: string; fout: string; props: Record<string, string> }[] = [
  { naam: "companyName", label: "Bedrijfsnaam", fout: "Vul je bedrijfsnaam in", props: { autoComplete: "organization", placeholder: "Bijv. Hotel Amsterdam" } },
  { naam: "contactName", label: "Naam", fout: "Vul je naam in", props: { autoComplete: "name", placeholder: "Voor en achternaam" } },
  { naam: "phone", label: "Telefoon", fout: "Vul een geldig telefoonnummer in", props: { type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "06 12 34 56 78" } },
  { naam: "email", label: "E-mail", fout: "Vul een geldig e-mailadres in", props: { type: "email", autoComplete: "email", placeholder: "naam@bedrijf.nl" } },
];

/** Engelse label, foutmelding en placeholder per veld (en/request-staff.html). */
const VELDEN_EN: Record<Veld, { label: string; fout: string; placeholder: string }> = {
  companyName: { label: "Company name", fout: "Enter your company name", placeholder: "E.g. Hotel Amsterdam" },
  contactName: { label: "Name", fout: "Enter your name", placeholder: "First and last name" },
  phone: { label: "Phone", fout: "Enter a valid phone number", placeholder: "06 12 34 56 78" },
  email: { label: "Email", fout: "Enter a valid email address", placeholder: "name@company.com" },
};

/** Vaste teksten van het formulier en de bedankpagina in beide talen. */
const TEKST = {
  nl: {
    tel: TELEFOON, uit: "uit", gecertificeerd: "gecertificeerd", loondienst: ["Loondienst", "iedereen, geen zzp"] as [string, string],
    eyebrow: "Personeel aanvragen", h1: "Personeel nodig? ", h1Serif: "Wij bellen je terug.",
    lead: "Laat je gegevens achter, dan nemen we persoonlijk contact op om je aanvraag door te spreken.",
    stappen: [
      ["Je verstuurt je aanvraag", "Je krijgt direct een bevestiging per mail."],
      ["We bellen je terug", "Op werkdagen tussen 9:00 en 18:00."],
      ["Je hoort wie we sturen", "Met namen, en wat die mensen eerder hebben gedaan."],
    ] as [string, string][],
    haast: "Haast?", formLabel: "Personeel aanvragen",
    branche: "Voor welke branche?", functies: "Welke functies?", gegevens: "Je gegevens", wanneer: "Wanneer heb je iemand nodig?", optioneel: "optioneel",
    toelichting: "Toelichting toevoegen", toelichtingPlaceholder: "Bijv. aantal personen, datum of specifieke wensen",
    bezig: "Even geduld", knop: "Bel mij terug",
    privacy: "We gebruiken je gegevens alleen om contact met je op te nemen over deze aanvraag. Lees ons ", privacyLink: "privacybeleid", privacyHref: "/privacybeleid",
    mislukt: "Versturen lukte niet.", belOns: (tel: string) => `Bel ons gerust op ${tel}.`,
    ontvangen: "/aanvraag-ontvangen",
  },
  en: {
    tel: TELEFOON_EN, uit: "from", gecertificeerd: "certified", loondienst: ["Payroll", "everyone, no freelancers"] as [string, string],
    eyebrow: "Request staff", h1: "Need staff? ", h1Serif: "We'll call you back.",
    lead: "Leave your details and we'll call you personally to talk through your request.",
    stappen: [
      ["You send your request", "You get a confirmation by email straight away."],
      ["We call you back", "On working days between 9:00 and 18:00."],
      ["You hear who we're sending", "With names, and what those people have done before."],
    ] as [string, string][],
    haast: "In a hurry?", formLabel: "Request staff",
    branche: "Which sector?", functies: "Which roles?", gegevens: "Your details", wanneer: "When do you need someone?", optioneel: "optional",
    toelichting: "Add a note", toelichtingPlaceholder: "E.g. number of people, date or specific requirements",
    bezig: "Please wait", knop: "Call me back",
    privacy: "We only use your details to contact you about this request. Read our ", privacyLink: "privacy policy", privacyHref: "/en/privacy-policy",
    mislukt: "Your request could not be sent.", belOns: (tel: string) => `Feel free to call us on ${tel}.`,
    ontvangen: "/en/request-received",
  },
};

function veldOk(naam: Veld, waarde: string): boolean {
  const w = waarde.trim();
  if (!w) return false;
  if (naam === "phone") return w.replace(/\D/g, "").length >= 8;
  if (naam === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w);
  return true;
}

function Bewijs({ derde, taal = "nl" }: { derde: [string, string]; taal?: Taal }) {
  const rv = useLiveReviews(taal);
  const t = TEKST[taal];
  return (
    <ul className="av-bewijs">
      <li><b>{rv.scoreTekst}</b><span>{t.uit} {rv.aantal} Google reviews</span></li>
      <li><b>NEN 4400-1</b><span>{t.gecertificeerd}</span></li>
      <li><b>{derde[0]}</b><span>{derde[1]}</span></li>
    </ul>
  );
}

/** Telefoon en WhatsApp. De taal volgt het pad, tenzij die is meegegeven (Aanmelden met ?lang=en). */
export function Direct({ label, taal }: { label: string; taal?: Taal }) {
  const [pad] = useLocation();
  const tel = TEKST[taal ?? taalVanPad(pad)].tel;
  return (
    <div className="av-direct">
      <span>{label}</span>
      <a href={TELEFOON_HREF}><Ic n="tel" />{tel}</a>
      <a className="av-wa" href={WHATSAPP_HREF}>WhatsApp</a>
    </div>
  );
}

export function PersoneelAanvragen() {
  const [pad, naar] = useLocation();
  const taal = taalVanPad(pad);
  const en = taal === "en";
  const t = TEKST[taal];
  const begin = useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const b = p.get("branche") as Branche | null;
      let functie = p.get("functie");
      // Op de Engelse pagina mag ?functie= ook het Engelse label zijn ("Kitchen").
      if (en && functie && !(functie in FUNCTIE_EN)) {
        functie = Object.keys(FUNCTIE_EN).find((k) => FUNCTIE_EN[k].toLowerCase() === functie!.toLowerCase()) ?? functie;
      }
      return { branche: b && b in FUNCTIES ? b : null, functie };
    } catch {
      return { branche: null, functie: null };
    }
  }, []);
  const [branche, setBranche] = useState<Branche | null>(begin.branche);
  const [functies, setFuncties] = useState<string[]>(() =>
    begin.functie && FUNCTIES[begin.branche ?? "anders"].includes(begin.functie) ? [begin.functie] : [],
  );
  const [wanneer, setWanneer] = useState("");
  const [waarden, setWaarden] = useState<Record<Veld, string>>({ companyName: "", contactName: "", phone: "", email: "" });
  const [fouten, setFouten] = useState<Partial<Record<Veld, boolean>>>({});
  const [toelichting, setToelichting] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const zichtbaar = branche ?? "anders";
  const sector = BRANCHES.find((b) => b.waarde === branche)?.sector ?? "algemeen";

  const kiesBranche = (b: Branche) => {
    setBranche(b);
    // Functies van een andere branche vervallen, net als in de mock-up.
    setFuncties((oud) => oud.filter((f) => FUNCTIES[b].includes(f)));
  };

  const zet = (naam: Veld, waarde: string) => {
    setWaarden((w) => ({ ...w, [naam]: waarde }));
    if (fouten[naam]) setFouten((f) => ({ ...f, [naam]: !veldOk(naam, waarde) }));
  };

  const verstuur = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nieuw: Partial<Record<Veld, boolean>> = {};
    VELDEN.forEach((v) => { nieuw[v.naam] = !veldOk(v.naam, waarden[v.naam]); });
    setFouten(nieuw);
    const eerste = VELDEN.find((v) => nieuw[v.naam]);
    if (eerste) {
      e.currentTarget.querySelector<HTMLInputElement>(`input[name="${eerste.naam}"]`)?.focus();
      return;
    }
    setFout(null);
    setBezig(true);
    try {
      const res = await fetch("/api/staffing-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: waarden.companyName.trim(),
          contactName: waarden.contactName.trim(),
          phone: waarden.phone.trim(),
          email: waarden.email.trim(),
          locationType: BRANCHES.find((b) => b.waarde === branche)?.locatie ?? "anders",
          functions: functies,
          urgency: wanneer || undefined,
          notes: toelichting.trim() || undefined,
          wantsCallback: true,
          herkomst: herkomstVoorFormulier(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || "");
      }
      onthoudVoornaam(waarden.contactName);
      naar(t.ontvangen);
      window.scrollTo(0, 0);
    } catch (err: any) {
      setBezig(false);
      // De melding van de server is Nederlands: op de Engelse pagina alleen de eigen tekst.
      setFout(`${(!en && err?.message) || t.mislukt} ${t.belOns(t.tel)}`);
    }
  };

  return (
    <Shell css={["events", "hotels", "werk", "bedrijf", "aanvraag"]} bodyKlasse="aanvraagpag" telKnop>
      <section className="av-pag">
        <div className="w av-grid">
          <div className="av-links">
            <span className="eyebrow">{t.eyebrow}</span>
            <h1 className="av-h1">{t.h1}<span className="serif">{t.h1Serif}</span></h1>
            <p className="av-lead">{t.lead}</p>
            <ol className="av-stappen">
              {t.stappen.map(([b, u]) => <li key={b}><b>{b}</b><span>{u}</span></li>)}
            </ol>
            <Bewijs derde={t.loondienst} taal={taal} />
            <Direct label={t.haast} taal={taal} />
          </div>

          <form className="av-kaart" id="aanvraag" data-sector={sector} onSubmit={verstuur} noValidate aria-label={t.formLabel}>
            <fieldset className="av-blok">
              <legend><span className="av-nr">1</span>{t.branche}</legend>
              <div className="chips" id="branche">
                {BRANCHES.map((b) => (
                  <label className="chip-k" key={b.waarde}>
                    <input type="radio" name="branche" value={b.waarde} checked={branche === b.waarde} onChange={() => kiesBranche(b.waarde)} />
                    <span>{en ? b.en : b.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="av-blok">
              <legend><span className="av-nr">2</span>{t.functies} <small>{t.optioneel}</small></legend>
              <div className="chips">
                <div className="fset" data-voor={zichtbaar}>
                  {FUNCTIES[zichtbaar].map((f) => (
                    <label className="chip-k" key={f}>
                      <input
                        type="checkbox"
                        name="functies"
                        value={f}
                        checked={functies.includes(f)}
                        onChange={(e) => setFuncties((oud) => (e.target.checked ? [...oud, f] : oud.filter((x) => x !== f)))}
                      />
                      <span>{en ? FUNCTIE_EN[f] ?? f : f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </fieldset>

            <fieldset className="av-blok">
              <legend><span className="av-nr">3</span>{t.gegevens}</legend>
              <div className="av-velden">
                {VELDEN.map((v) => (
                  <label className={`veld${fouten[v.naam] ? " fout" : ""}`} key={v.naam}>
                    <span>{en ? VELDEN_EN[v.naam].label : v.label}</span>
                    <input
                      name={v.naam}
                      required
                      {...v.props}
                      {...(en ? { placeholder: VELDEN_EN[v.naam].placeholder } : {})}
                      value={waarden[v.naam]}
                      onChange={(e) => zet(v.naam, e.target.value)}
                      onBlur={(e) => { if (e.target.value) setFouten((f) => ({ ...f, [v.naam]: !veldOk(v.naam, e.target.value) })); }}
                      aria-invalid={fouten[v.naam] || undefined}
                    />
                    <em>{en ? VELDEN_EN[v.naam].fout : v.fout}</em>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="av-blok">
              <legend><span className="av-nr">4</span>{t.wanneer} <small>{t.optioneel}</small></legend>
              <div className="chips">
                {WANNEER.map((w) => (
                  <label className="chip-k" key={w.waarde}>
                    <input type="radio" name="urgency" value={w.waarde} checked={wanneer === w.waarde} onChange={() => setWanneer(w.waarde)} />
                    <span>{en ? w.en : w.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <details className="av-extra">
              <summary>{t.toelichting} <small>{t.optioneel}</small></summary>
              <textarea name="notes" rows={3} placeholder={t.toelichtingPlaceholder} value={toelichting} onChange={(e) => setToelichting(e.target.value)} />
            </details>

            {fout && <p className="form-fout" role="alert">{fout}</p>}
            <button className="knop vol av-knop" type="submit" disabled={bezig}>{bezig ? t.bezig : t.knop} <Pijl /></button>
            <p className="av-privacy">{t.privacy}<a href={t.privacyHref}>{t.privacyLink}</a>.</p>
          </form>
        </div>
      </section>
    </Shell>
  );
}

/** Teksten van de bedankpagina (aanvraag-ontvangen.html en en/request-received.html). */
const DANK = {
  nl: {
    h1: "Je aanvraag is ", h1Serif: "ontvangen",
    lead: "Je krijgt binnen een paar minuten een bevestiging per mail. Op werkdagen tussen 9:00 en 18:00 bellen we je meestal binnen een uur terug. Komt je aanvraag 's avonds of in het weekend binnen, dan bellen we je de eerstvolgende werkdag in de ochtend.",
    spoedKop: "Is het voor morgenochtend?", spoed: "Wacht dan niet op ons belletje. Bel zelf even, dan kijken we meteen wie er beschikbaar is.",
    ondertussen: "Ondertussen",
    links: [
      ["/hotelpersoneel-inhuren#selectie", "Zo selecteren we onze mensen", "Persoonlijk gesprek, beoordeling na elke dienst"],
      ["/blog", "Lees de blog", "Wetgeving, keuzes en praktijk voor jouw branche"],
      ["/", "Terug naar de homepage", "Alles over EXTRA"],
    ] as [string, string, string][],
  },
  en: {
    h1: "We've received your ", h1Serif: "request",
    lead: "You'll get a confirmation by email within a few minutes. On working days between 9:00 and 18:00 we usually call you back within the hour. If your request comes in during the evening or at the weekend, we'll call you the next working day in the morning.",
    spoedKop: "Is it for tomorrow morning?", spoed: "Then don't wait for our call. Give us a ring and we'll check straight away who's available.",
    ondertussen: "In the meantime",
    links: [
      ["/en/hotel-staffing-amsterdam#selectie", "How we select our people", "Personal interview, rating after every shift"],
      ["/blog", "Read the blog", "Legislation, choices and practice for your sector"],
      ["/en", "Back to the homepage", "Everything about EXTRA"],
    ] as [string, string, string][],
  },
};

export function AanvraagOntvangen() {
  const [pad] = useLocation();
  const taal = taalVanPad(pad);
  const t = DANK[taal];
  // Voornaam uit sessionStorage (gezet door het formulier), niet uit de URL.
  const naam = useMemo(() => haalVoornaam(), []);

  useEffect(() => {
    // Conversiedoel in GA4 (gtag staat in client/index.html). Alleen hier, niet
    // ook bij het versturen: dan telt elke aanvraag dubbel.
    const gtag = (window as any).gtag;
    if (typeof gtag === "function") {
      gtag("event", "generate_lead", { event_category: "personeelsaanvraag", event_label: "formulier", value: 1 });
    }
  }, []);

  return (
    <Shell css={["events", "hotels", "werk", "bedrijf", "aanvraag"]} bodyKlasse="aanvraagpag" telKnop>
      <section className="av-pag av-dank">
        <div className="w">
          <div className="dk-kaart">
            <span className="dk-vink" aria-hidden="true"><Ic n="vink" /></span>
            <h1 className="av-h1">{t.h1}<span className="serif">{t.h1Serif}{naam && <span id="dk-naam">, {naam}</span>}</span></h1>
            <p className="av-lead">{t.lead}</p>
            <div className="dk-spoed">
              <div><b>{t.spoedKop}</b><span>{t.spoed}</span></div>
              <div className="dk-knoppen">
                <a className="knop vol" href={TELEFOON_HREF}><Ic n="tel" />{TEKST[taal].tel}</a>
                <a className="knop lijn" href={WHATSAPP_HREF}>WhatsApp</a>
              </div>
            </div>
          </div>
          <div className="dk-ondertussen">
            <span className="eyebrow">{t.ondertussen}</span>
            <div className="dk-links">
              {t.links.map(([href, b, u]) => <a href={href} key={href}><b>{b}</b><span>{u}</span><Ic n="pijl" /></a>)}
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
