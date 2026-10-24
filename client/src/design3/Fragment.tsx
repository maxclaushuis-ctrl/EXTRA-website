/**
 * Sjabloon voor de inhoudspagina's van design 3.0 (levering 2).
 *
 * De inhoud van deze pagina's komt rechtstreeks uit de goedgekeurde mock-up
 * (client/src/design3/paginas/*.ts, gegenereerd). Dat houdt de opmaak
 * pixelgelijk aan de mock-up en de tekst op één plek. Het gedrag uit de
 * mock-up (carrousels, sporen, slotkop, stapels, confetti) en de formulieren
 * worden hier aan de gerenderde inhoud gekoppeld.
 *
 * Formulieren (data-form):
 *  - "terugbel": bedrijfsnaam, naam, telefoon, functie → /api/staffing-request
 *    (bron "terugbel"), daarna /aanvraag-ontvangen.
 *  - "kandidaat": naam, telefoon, functie → bewaard in sessionStorage en door
 *    naar /aanmelden, waar het volledige formulier staat. Geen persoonsgegevens
 *    in de URL.
 *  - "contact": naam, e-mail, telefoon, bericht → /api/contact-bericht.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useLocation } from "wouter";
import Shell, { type CssSet, type Sector } from "./Shell";
import { useCarrousel, useConfetti, useReus, useSpoor, useStapelTop } from "./gedrag";
import { useLiveReviews } from "@/hooks/useLiveReviews";
import { useAnalytics } from "@/hooks/use-analytics";
import { herkomstVoorFormulier } from "@/lib/herkomst";
import { TELEFOON } from "./links";

export interface FragmentData {
  sector: Sector | string;
  css: (CssSet | string)[];
  werkzoekende: boolean;
  /** Factor waarmee de slotkop de breedte vult (uit de mock-up). */
  reus: number;
  /** Vragen en antwoorden uit de FAQ-sectie, voor FAQPage-gegevens. */
  faq: [string, string][];
  /** Overige gestructureerde gegevens die van de vorige versie behouden zijn. */
  ld: Record<string, unknown>[];
  html: string;
}

/** Een RefObject dat in een layout-effect naar een element binnen de inhoud wijst. */
function useDeelRef(): RefObject<HTMLElement> & { current: HTMLElement | null } {
  return useMemo(() => ({ current: null as HTMLElement | null }), []);
}

const BRANCHE: Record<string, { type: string }> = {
  horeca: { type: "hotel" },
  events: { type: "eventlocatie" },
  logistiek: { type: "logistiek" },
  algemeen: { type: "anders" },
};

export default function FragmentPagina({ d }: { d: FragmentData }) {
  const [location, naar] = useLocation();
  const { trackPageView } = useAnalytics();
  const root = useRef<HTMLDivElement>(null);
  const carrousel = useDeelRef();
  const functies = useDeelRef();
  const scores = useDeelRef();
  const reus = useDeelRef();
  const loon = useDeelRef();
  const vacs = useDeelRef();
  const confetti = useDeelRef();
  const rv = useLiveReviews();

  useEffect(() => { trackPageView({ path: location, variant: "d3" }); }, [location, trackPageView]);

  // Verwijzingen naar de onderdelen van de inhoud, vóór de gedragseffecten draaien.
  useLayoutEffect(() => {
    const r = root.current;
    if (!r) return;
    const zoek = (s: string) => r.querySelector<HTMLElement>(s);
    carrousel.current = zoek(".carrousel");
    functies.current = zoek(".fspoor")?.closest("section") ?? null;
    scores.current = zoek(".scspoor")?.closest("section") ?? null;
    reus.current = zoek(".slot2 .reus");
    loon.current = zoek(".stapel .loon");
    vacs.current = zoek(".stapel2 > .vacs");
    confetti.current = zoek(".confetti");
  }, [d]);

  useCarrousel(carrousel, [d]);
  useSpoor(functies, ".fspoor", ".fbedien", true);
  useSpoor(scores, ".scspoor", ".scbedien");
  useReus(reus, d.reus);
  useStapelTop(loon);
  useStapelTop(vacs);
  useConfetti(confetti);

  // Actuele Google-score en aantal reviews in de plekhouders.
  useEffect(() => {
    root.current?.querySelectorAll<HTMLElement>("[data-rv]").forEach((el) => {
      el.textContent = el.dataset.rv === "score" ? rv.scoreTekst : String(rv.aantal);
    });
  }, [rv.scoreTekst, rv.aantal, d]);

  // Formulieren.
  useEffect(() => {
    const r = root.current;
    if (!r) return;
    const formulieren = Array.from(r.querySelectorAll<HTMLFormElement>("form[data-form]"));
    const fout = (f: HTMLFormElement, tekst: string | null) => {
      let p = f.querySelector<HTMLElement>(".form-fout");
      if (!tekst) { p?.remove(); return; }
      if (!p) {
        p = document.createElement("p");
        p.className = "form-fout";
        p.setAttribute("role", "alert");
        const knop = f.querySelector("button[type=submit], button:not([type])");
        f.insertBefore(p, knop);
      }
      p.textContent = tekst;
    };
    const bezig = (f: HTMLFormElement, aan: boolean) => {
      f.querySelectorAll("button").forEach((b) => { (b as HTMLButtonElement).disabled = aan; });
    };
    const verstuur = async (e: Event) => {
      e.preventDefault();
      const f = e.currentTarget as HTMLFormElement;
      const soort = f.dataset.form;
      const w = (k: string) => String(new FormData(f).get(k) ?? "").trim();
      const functie = w("functie");
      const echteFunctie = functie && !/^kies/i.test(functie) ? functie : "";
      const telefoonOk = w("phone").replace(/\D/g, "").length >= 8;

      if (soort === "kandidaat") {
        if (!w("naam") || !telefoonOk) return fout(f, "Vul je naam en een geldig telefoonnummer in.");
        try {
          sessionStorage.setItem("extra-aanmelden", JSON.stringify({ naam: w("naam"), telefoon: w("phone"), functie: echteFunctie, via: location }));
        } catch { /* privémodus: dan vul je het op de volgende pagina in */ }
        naar("/aanmelden");
        window.scrollTo(0, 0);
        return;
      }

      if (soort === "contact") {
        if (!w("naam") || !/^\S+@\S+\.\S+$/.test(w("email")) || !w("bericht")) return fout(f, "Vul je naam, een geldig e-mailadres en je bericht in.");
        fout(f, null);
        bezig(f, true);
        try {
          const tel = w("phone");
          const res = await fetch("/api/contact-bericht", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ naam: w("naam"), email: w("email"), bericht: tel ? `${w("bericht")}\n\nTelefoon: ${tel}` : w("bericht"), pagina: location }),
          });
          if (!res.ok) throw new Error();
          f.innerHTML = `<div class="form-klaar" role="status"><b>Bedankt, je bericht is verstuurd.</b><span>We reageren zo snel mogelijk, meestal dezelfde werkdag.</span></div>`;
        } catch {
          bezig(f, false);
          fout(f, `Versturen lukte niet. Bel ons gerust op ${TELEFOON}.`);
        }
        return;
      }

      // terugbelverzoek van een opdrachtgever
      if (!w("companyName") || !w("contactName") || !telefoonOk) return fout(f, "Vul je bedrijfsnaam, naam en een geldig telefoonnummer in.");
      fout(f, null);
      bezig(f, true);
      try {
        const res = await fetch("/api/staffing-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bron: "terugbel",
            companyName: w("companyName"),
            contactName: w("contactName"),
            phone: w("phone"),
            locationType: (BRANCHE[String(d.sector)] ?? BRANCHE.algemeen).type,
            functions: echteFunctie ? [echteFunctie] : [],
            wantsCallback: true,
            notes: `Terugbelverzoek via ${location}`,
            herkomst: herkomstVoorFormulier(),
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.message || "");
        }
        naar(`/aanvraag-ontvangen?naam=${encodeURIComponent(w("contactName").split(" ")[0])}`);
        window.scrollTo(0, 0);
      } catch (err: any) {
        bezig(f, false);
        fout(f, `${err?.message || "Versturen lukte niet."} Bel ons gerust op ${TELEFOON}.`);
      }
    };
    formulieren.forEach((f) => f.addEventListener("submit", verstuur));
    return () => formulieren.forEach((f) => f.removeEventListener("submit", verstuur));
  }, [d, location, naar]);

  const ld = useMemo(() => {
    const lijst: Record<string, unknown>[] = [...d.ld];
    if (d.faq.length) {
      lijst.unshift({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: d.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      });
    }
    return lijst;
  }, [d]);

  return (
    <Shell sector={d.sector as Sector} css={d.css as CssSet[]} werkzoekende={d.werkzoekende}>
      <div ref={root} className="d3-inhoud" dangerouslySetInnerHTML={{ __html: d.html }} />
      {ld.map((x, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(x).replace(/</g, "\\u003c") }} />
      ))}
    </Shell>
  );
}
