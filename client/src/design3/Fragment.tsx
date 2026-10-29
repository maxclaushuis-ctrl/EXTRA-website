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
import { useCarrousel, useConfetti, useReus, useSpoor, useStapelTop, useDekking, useLevendeLinks } from "./gedrag";
import { useLiveReviews } from "@/hooks/useLiveReviews";
import { useAnalytics } from "@/hooks/use-analytics";
import { herkomstVoorFormulier } from "@/lib/herkomst";
import { TELEFOON } from "./links";
import { onthoudVoornaam } from "./basis";
import { veiligeJsonLd } from "@shared/jsonLd";

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
  /** Bestemming van de knop rechtsboven als die afwijkt (aanvraagformulier met branche of functie ingevuld). */
  knop?: string | null;
  /** Functies voor de pop-up "Bel mij terug". */
  functies?: string[];
  /** Elementen die bij scrollen in beeld schuiven (selector uit de mock-up). */
  onthul?: string;
  /** WhatsApp-gesprek met Job dat zich vanzelf afspeelt (selectieproces). */
  chat?: { stappen: [string, string][]; kaart: string };
  /** "en" voor de Engelse pagina's (mock-up en/*.html). */
  taal?: "nl" | "en";
  html: string;
}

/** Teksten en bestemmingen van de formulieren per taal. */
const FT = {
  nl: {
    kandidaatFout: "Vul je naam en een geldig telefoonnummer in.", aanmelden: "/aanmelden",
    contactFout: "Vul je naam, een geldig e-mailadres en je bericht in.",
    contactKlaar: `<div class="form-klaar" role="status"><b>Bedankt, je bericht is verstuurd.</b><span>We reageren zo snel mogelijk, meestal dezelfde werkdag.</span></div>`,
    mislukt: "Versturen lukte niet.", bel: "Bel ons gerust op", tel: TELEFOON,
    terugbelFout: "Vul je bedrijfsnaam, naam en een geldig telefoonnummer in.", dank: "/aanvraag-ontvangen", notitie: "Terugbelverzoek via",
  },
  en: {
    kandidaatFout: "Please enter your name and a valid phone number.", aanmelden: "/en/apply",
    contactFout: "Please enter your name, a valid email address and your message.",
    contactKlaar: `<div class="form-klaar" role="status"><b>Thank you, your message has been sent.</b><span>We reply as soon as we can, usually the same working day.</span></div>`,
    mislukt: "Sending failed.", bel: "Feel free to call us on", tel: "+31 85 130 59 15",
    terugbelFout: "Please enter your company, name and a valid phone number.", dank: "/en/request-received", notitie: "Callback request (English site) via",
  },
};

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
  useDekking(root, [d]);
  useLevendeLinks(root, [d]);
  useConfetti(confetti);

  // In beeld schuiven bij scrollen.
  useEffect(() => {
    const r = root.current;
    if (!r || !d.onthul) return;
    const els = Array.from(r.querySelectorAll<HTMLElement>(d.onthul));
    els.forEach((e) => {
      e.classList.add("anim");
      const p = e.parentElement;
      if (p) e.style.setProperty("--i", String(Array.prototype.indexOf.call(p.children, e)));
    });
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((e) => e.classList.add("zien"));
      return;
    }
    const io = new IntersectionObserver((en) => en.forEach((x) => {
      if (x.isIntersecting) { x.target.classList.add("zien"); io.unobserve(x.target); }
    }), { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [d]);

  // WhatsApp-gesprek met Job.
  useEffect(() => {
    const chat = root.current?.querySelector<HTMLElement>("#wa-chat");
    if (!chat || !d.chat) return;
    const { stappen, kaart } = d.chat;
    const stil = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    let timer: number | undefined;
    const tijd = () => { const n = new Date(); return ("0" + n.getHours()).slice(-2) + ":" + ("0" + n.getMinutes()).slice(-2); };
    const bel = (soort: string, tekst: string) => {
      const b = document.createElement("div");
      b.className = "b " + soort;
      b.textContent = tekst;
      const k = document.createElement("small");
      k.textContent = tijd();
      b.appendChild(k);
      return b;
    };
    const maakKaart = () => { const k = document.createElement("div"); k.className = "kaart"; k.innerHTML = kaart; return k; };
    const snoei = () => { while (chat.children.length > 7) chat.removeChild(chat.firstChild!); };
    const volgende = () => {
      if (i >= stappen.length) { timer = window.setTimeout(() => { chat.innerHTML = ""; i = 0; volgende(); }, 5000); return; }
      const [soort, tekst] = stappen[i++];
      if (soort === "kaart") { chat.appendChild(maakKaart()); snoei(); timer = window.setTimeout(volgende, 2600); return; }
      if (soort === "job") {
        const typ = document.createElement("div");
        typ.className = "typ";
        typ.innerHTML = "<i></i><i></i><i></i>";
        chat.appendChild(typ); snoei();
        timer = window.setTimeout(() => { typ.remove(); chat.appendChild(bel("job", tekst)); snoei(); timer = window.setTimeout(volgende, 1500 + tekst.length * 12); }, 900 + tekst.length * 8);
        return;
      }
      chat.appendChild(bel(soort, tekst)); snoei(); timer = window.setTimeout(volgende, 1300);
    };
    chat.innerHTML = "";
    if (stil) { stappen.forEach(([s, t]) => chat.appendChild(s === "kaart" ? maakKaart() : bel(s, t))); snoei(); return; }
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { io.disconnect(); volgende(); } }, { threshold: 0.3 });
    io.observe(chat);
    return () => { io.disconnect(); window.clearTimeout(timer); };
  }, [d]);

  // Actuele Google-score en aantal reviews in de plekhouders (Engels met een punt: 4.8).
  useEffect(() => {
    root.current?.querySelectorAll<HTMLElement>("[data-rv]").forEach((el) => {
      el.textContent = el.dataset.rv === "score" ? (d.taal === "en" ? rv.scoreTekst.replace(",", ".") : rv.scoreTekst) : String(rv.aantal);
    });
  }, [rv.scoreTekst, rv.aantal, d]);

  // Tabbladen uit de mock-up (portaal, "hoe het werkt"): role=tab met aria-controls.
  useEffect(() => {
    const r = root.current;
    if (!r) return;
    const groepen = new Map<Element, HTMLElement[]>();
    r.querySelectorAll<HTMLElement>("[role=tab][aria-controls]").forEach((t) => {
      const g = t.closest("[role=tablist]") ?? t.parentElement!;
      groepen.set(g, [...(groepen.get(g) ?? []), t]);
    });
    const opruimen: (() => void)[] = [];
    groepen.forEach((tabs) => {
      const kies = (t: HTMLElement) => tabs.forEach((x) => {
        const aan = x === t;
        x.setAttribute("aria-selected", String(aan));
        x.classList.toggle("aan", aan);
        x.tabIndex = aan ? 0 : -1;
        const p = r.querySelector<HTMLElement>("#" + CSS.escape(x.getAttribute("aria-controls") || ""));
        if (p) { p.hidden = !aan; if (aan) { p.classList.remove("wissel"); void p.offsetWidth; p.classList.add("wissel"); } }
      });
      tabs.forEach((t, i) => {
        const klik = () => kies(t);
        const toets = (e: KeyboardEvent) => {
          const n = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
          if (!n) return;
          e.preventDefault();
          const v = tabs[(i + n + tabs.length) % tabs.length];
          v.focus(); kies(v);
        };
        t.addEventListener("click", klik);
        t.addEventListener("keydown", toets);
        opruimen.push(() => { t.removeEventListener("click", klik); t.removeEventListener("keydown", toets); });
      });
    });
    return () => opruimen.forEach((f) => f());
  }, [d]);

  // Reviews: wisselen tussen klanten en medewerkers (template #rv-medewerkers).
  useEffect(() => {
    const r = root.current;
    const c = r?.querySelector<HTMLElement>(".carrousel");
    const sp = c?.querySelector<HTMLElement>(".spoor");
    const tpl = r?.querySelector<HTMLTemplateElement>("#rv-medewerkers");
    const tabs = Array.from(r?.querySelectorAll<HTMLElement>(".rv-toggle [data-groep]") ?? []);
    if (!c || !sp || !tpl || !tabs.length) return;
    const groepen: Record<string, string> = { klanten: sp.innerHTML, medewerkers: tpl.innerHTML };
    const uit: (() => void)[] = [];
    tabs.forEach((b) => {
      const klik = () => {
        const g = b.dataset.groep || "";
        if (b.classList.contains("aan") || !groepen[g]) return;
        tabs.forEach((x) => { const aan = x === b; x.classList.toggle("aan", aan); x.setAttribute("aria-selected", String(aan)); });
        c.classList.add("wissel");
        window.setTimeout(() => {
          sp.innerHTML = groepen[g];
          sp.scrollLeft = 0;
          sp.dispatchEvent(new Event("scroll"));
          c.classList.remove("wissel");
        }, 220);
      };
      b.addEventListener("click", klik);
      uit.push(() => b.removeEventListener("click", klik));
    });
    return () => uit.forEach((f) => f());
  }, [d]);

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
    const ft = FT[d.taal ?? "nl"];
    const verstuur = async (e: Event) => {
      e.preventDefault();
      const f = e.currentTarget as HTMLFormElement;
      const soort = f.dataset.form;
      const w = (k: string) => String(new FormData(f).get(k) ?? "").trim();
      const functie = w("functie");
      const echteFunctie = functie && !/^kies/i.test(functie) ? functie : "";
      const telefoonOk = w("phone").replace(/\D/g, "").length >= 8;

      if (soort === "kandidaat") {
        if (!w("naam") || !telefoonOk) return fout(f, ft.kandidaatFout);
        try {
          sessionStorage.setItem("extra-aanmelden", JSON.stringify({ naam: w("naam"), telefoon: w("phone"), functie: echteFunctie, via: location }));
        } catch { /* privémodus: dan vul je het op de volgende pagina in */ }
        naar(ft.aanmelden);
        window.scrollTo(0, 0);
        return;
      }

      if (soort === "contact") {
        if (!w("naam") || !/^\S+@\S+\.\S+$/.test(w("email")) || !w("bericht")) return fout(f, ft.contactFout);
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
          f.innerHTML = ft.contactKlaar;
        } catch {
          bezig(f, false);
          fout(f, `${ft.mislukt} ${ft.bel} ${ft.tel}.`);
        }
        return;
      }

      // terugbelverzoek van een opdrachtgever
      if (!w("companyName") || !w("contactName") || !telefoonOk) return fout(f, ft.terugbelFout);
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
            notes: `${ft.notitie} ${location}`,
            herkomst: herkomstVoorFormulier(),
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.message || "");
        }
        onthoudVoornaam(w("contactName"));
        naar(ft.dank);
        window.scrollTo(0, 0);
      } catch (err: any) {
        bezig(f, false);
        fout(f, `${err?.message || ft.mislukt} ${ft.bel} ${ft.tel}.`);
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
    <Shell sector={d.sector as Sector} css={d.css as CssSet[]} werkzoekende={d.werkzoekende} knopHref={d.knop ?? undefined} functies={d.functies} taal={d.taal ?? "nl"}>
      <div ref={root} className="d3-inhoud" dangerouslySetInnerHTML={{ __html: d.html }} />
      {ld.map((x, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: veiligeJsonLd(x) }} />
      ))}
    </Shell>
  );
}
