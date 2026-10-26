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
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import Shell from "@/design3/Shell";
import { Ic, Pijl, haalVoornaam, onthoudVoornaam } from "@/design3/basis";
import { TELEFOON, TELEFOON_HREF, WHATSAPP_HREF } from "@/design3/links";
import { useLiveReviews } from "@/hooks/useLiveReviews";
import { herkomstVoorFormulier } from "@/lib/herkomst";

type Branche = "hotel" | "event" | "logistiek" | "anders";

const BRANCHES: { waarde: Branche; label: string; sector: string; locatie: string }[] = [
  { waarde: "hotel", label: "Hotel", sector: "horeca", locatie: "hotel" },
  { waarde: "event", label: "Event", sector: "events", locatie: "eventlocatie" },
  { waarde: "logistiek", label: "Logistiek", sector: "logistiek", locatie: "logistiek" },
  { waarde: "anders", label: "Anders", sector: "algemeen", locatie: "anders" },
];

const FUNCTIES: Record<Branche, string[]> = {
  hotel: ["Housekeeping", "Front office", "F&B", "Banqueting", "Keuken", "Afwas"],
  event: ["Bediening", "Bar", "Dinerlopers", "Runners", "Hosts", "Supervisor"],
  logistiek: ["Orderpicker", "Heftruck", "Inpak", "Expeditie", "Magazijn", "Voorraad"],
  anders: ["Bediening", "Bar", "Keuken", "Housekeeping", "Front office", "Logistiek"],
};

/** Dezelfde waarden als de keuzelijst Urgentie in het dashboard. */
const WANNEER: { waarde: string; label: string }[] = [
  { waarde: "zo_snel_mogelijk", label: "Zo snel mogelijk" },
  { waarde: "deze_week", label: "Deze week" },
  { waarde: "volgende_week", label: "Volgende week" },
  { waarde: "nog_niet_bekend", label: "Weet ik nog niet" },
];

type Veld = "companyName" | "contactName" | "phone" | "email";

const VELDEN: { naam: Veld; label: string; fout: string; props: Record<string, string> }[] = [
  { naam: "companyName", label: "Bedrijfsnaam", fout: "Vul je bedrijfsnaam in", props: { autoComplete: "organization", placeholder: "Bijv. Hotel Amsterdam" } },
  { naam: "contactName", label: "Naam", fout: "Vul je naam in", props: { autoComplete: "name", placeholder: "Voor en achternaam" } },
  { naam: "phone", label: "Telefoon", fout: "Vul een geldig telefoonnummer in", props: { type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "06 12 34 56 78" } },
  { naam: "email", label: "E-mail", fout: "Vul een geldig e-mailadres in", props: { type: "email", autoComplete: "email", placeholder: "naam@bedrijf.nl" } },
];

function veldOk(naam: Veld, waarde: string): boolean {
  const w = waarde.trim();
  if (!w) return false;
  if (naam === "phone") return w.replace(/\D/g, "").length >= 8;
  if (naam === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w);
  return true;
}

function Bewijs({ derde }: { derde: [string, string] }) {
  const rv = useLiveReviews();
  return (
    <ul className="av-bewijs">
      <li><b>{rv.scoreTekst}</b><span>uit {rv.aantal} Google reviews</span></li>
      <li><b>NEN 4400-1</b><span>gecertificeerd</span></li>
      <li><b>{derde[0]}</b><span>{derde[1]}</span></li>
    </ul>
  );
}

export function Direct({ label }: { label: string }) {
  return (
    <div className="av-direct">
      <span>{label}</span>
      <a href={TELEFOON_HREF}><Ic n="tel" />{TELEFOON}</a>
      <a className="av-wa" href={WHATSAPP_HREF}>WhatsApp</a>
    </div>
  );
}

export function PersoneelAanvragen() {
  const [, naar] = useLocation();
  const begin = useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const b = p.get("branche") as Branche | null;
      return { branche: b && b in FUNCTIES ? b : null, functie: p.get("functie") };
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
      naar("/aanvraag-ontvangen");
      window.scrollTo(0, 0);
    } catch (err: any) {
      setBezig(false);
      setFout(`${err?.message || "Versturen lukte niet."} Bel ons gerust op ${TELEFOON}.`);
    }
  };

  return (
    <Shell css={["events", "hotels", "werk", "bedrijf", "aanvraag"]} bodyKlasse="aanvraagpag">
      <section className="av-pag">
        <div className="w av-grid">
          <div className="av-links">
            <span className="eyebrow">Personeel aanvragen</span>
            <h1 className="av-h1">Personeel nodig? <span className="serif">Wij bellen je terug.</span></h1>
            <p className="av-lead">Laat je gegevens achter, dan nemen we persoonlijk contact op om je aanvraag door te spreken.</p>
            <ol className="av-stappen">
              <li><b>Je verstuurt je aanvraag</b><span>Je krijgt direct een bevestiging per mail.</span></li>
              <li><b>We bellen je terug</b><span>Op werkdagen tussen 9:00 en 18:00.</span></li>
              <li><b>Je hoort wie we sturen</b><span>Met namen, en wat die mensen eerder hebben gedaan.</span></li>
            </ol>
            <Bewijs derde={["Loondienst", "iedereen, geen zzp"]} />
            <Direct label="Haast?" />
          </div>

          <form className="av-kaart" id="aanvraag" data-sector={sector} onSubmit={verstuur} noValidate aria-label="Personeel aanvragen">
            <fieldset className="av-blok">
              <legend><span className="av-nr">1</span>Voor welke branche?</legend>
              <div className="chips" id="branche">
                {BRANCHES.map((b) => (
                  <label className="chip-k" key={b.waarde}>
                    <input type="radio" name="branche" value={b.waarde} checked={branche === b.waarde} onChange={() => kiesBranche(b.waarde)} />
                    <span>{b.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="av-blok">
              <legend><span className="av-nr">2</span>Welke functies? <small>optioneel</small></legend>
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
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </fieldset>

            <fieldset className="av-blok">
              <legend><span className="av-nr">3</span>Je gegevens</legend>
              <div className="av-velden">
                {VELDEN.map((v) => (
                  <label className={`veld${fouten[v.naam] ? " fout" : ""}`} key={v.naam}>
                    <span>{v.label}</span>
                    <input
                      name={v.naam}
                      required
                      {...v.props}
                      value={waarden[v.naam]}
                      onChange={(e) => zet(v.naam, e.target.value)}
                      onBlur={(e) => { if (e.target.value) setFouten((f) => ({ ...f, [v.naam]: !veldOk(v.naam, e.target.value) })); }}
                      aria-invalid={fouten[v.naam] || undefined}
                    />
                    <em>{v.fout}</em>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="av-blok">
              <legend><span className="av-nr">4</span>Wanneer heb je iemand nodig? <small>optioneel</small></legend>
              <div className="chips">
                {WANNEER.map((w) => (
                  <label className="chip-k" key={w.waarde}>
                    <input type="radio" name="urgency" value={w.waarde} checked={wanneer === w.waarde} onChange={() => setWanneer(w.waarde)} />
                    <span>{w.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <details className="av-extra">
              <summary>Toelichting toevoegen <small>optioneel</small></summary>
              <textarea name="notes" rows={3} placeholder="Bijv. aantal personen, datum of specifieke wensen" value={toelichting} onChange={(e) => setToelichting(e.target.value)} />
            </details>

            {fout && <p className="form-fout" role="alert">{fout}</p>}
            <button className="knop vol av-knop" type="submit" disabled={bezig}>{bezig ? "Even geduld" : "Bel mij terug"} <Pijl /></button>
            <p className="av-privacy">We gebruiken je gegevens alleen om contact met je op te nemen over deze aanvraag. Lees ons <a href="/privacybeleid">privacybeleid</a>.</p>
          </form>
        </div>
      </section>
    </Shell>
  );
}

export function AanvraagOntvangen() {
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
    <Shell css={["events", "hotels", "werk", "bedrijf", "aanvraag"]} bodyKlasse="aanvraagpag">
      <section className="av-pag av-dank">
        <div className="w">
          <div className="dk-kaart">
            <span className="dk-vink" aria-hidden="true"><Ic n="vink" /></span>
            <h1 className="av-h1">Je aanvraag is <span className="serif">ontvangen{naam && <span id="dk-naam">, {naam}</span>}</span></h1>
            <p className="av-lead">Je krijgt binnen een paar minuten een bevestiging per mail. Op werkdagen tussen 9:00 en 18:00 bellen we je meestal binnen een uur terug. Komt je aanvraag 's avonds of in het weekend binnen, dan bellen we je de eerstvolgende werkdag in de ochtend.</p>
            <div className="dk-spoed">
              <div><b>Is het voor morgenochtend?</b><span>Wacht dan niet op ons belletje. Bel zelf even, dan kijken we meteen wie er beschikbaar is.</span></div>
              <div className="dk-knoppen">
                <a className="knop vol" href={TELEFOON_HREF}><Ic n="tel" />{TELEFOON}</a>
                <a className="knop lijn" href={WHATSAPP_HREF}>WhatsApp</a>
              </div>
            </div>
          </div>
          <div className="dk-ondertussen">
            <span className="eyebrow">Ondertussen</span>
            <div className="dk-links">
              <a href="/hotelpersoneel-inhuren#selectie"><b>Zo selecteren we onze mensen</b><span>Persoonlijk gesprek, beoordeling na elke dienst</span><Ic n="pijl" /></a>
              <a href="/blog"><b>Lees de blog</b><span>Wetgeving, keuzes en praktijk voor jouw branche</span><Ic n="pijl" /></a>
              <a href="/"><b>Terug naar de homepage</b><span>Alles over EXTRA</span><Ic n="pijl" /></a>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
