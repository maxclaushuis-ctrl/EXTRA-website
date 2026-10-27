/**
 * De schil van elke pagina in design 3.0: header met menu, footer en de
 * iconen. Alle styling zit onder de klasse .d3, zodat het dashboard en de
 * medewerkersapp er niets van merken.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type MouseEvent } from "react";
import { useLocation } from "wouter";
import { HREFLANG_PARTNER, normalizeMetaPath } from "@shared/routeMeta";
import "./d3.css";
import "./d3-extra.css";
import { Iconen, Ic, Pijl } from "./basis";
import { MENU, FOOTER, TELEFOON, TELEFOON_HREF, EMAIL, type MenuGroep } from "./links";
import TerugbelPopup from "./TerugbelPopup";

export type Sector = "horeca" | "events" | "logistiek" | "algemeen";

/** Welke CSS-bestanden uit de mock-up op deze pagina gelden (zie d3.css). */
export type CssSet = "events" | "hotels" | "logistiek" | "eventsland" | "werk" | "bedrijf" | "aanvraag" | "blog" | "vacature" | "functie" | "pagina" | "evland" | "selectie";

export const CSS_BEDRIJF: CssSet[] = ["events", "hotels", "logistiek", "eventsland", "werk", "bedrijf", "functie", "pagina"];

interface ShellProps {
  sector?: Sector;
  css?: CssSet[];
  /** true op pagina's voor werkzoekenden: de knop rechtsboven wordt "Solliciteer direct". */
  werkzoekende?: boolean;
  /** Bestemming van de knop rechtsboven (standaard het aanvraagformulier). */
  knopHref?: string;
  /** true op formulierpagina's: de knop rechtsboven wordt het telefoonnummer. */
  telKnop?: boolean;
  bodyKlasse?: string;
  /** Kopregel transparant over de hero (homepage), of vast donker. */
  kopVast?: boolean;
  /** Functies voor de keuzelijst in de pop-up "Bel mij terug". */
  functies?: string[];
  children: ReactNode;
}

export default function Shell({ sector = "algemeen", css = [], werkzoekende = false, knopHref, telKnop = false, bodyKlasse, kopVast = true, functies = [], children }: ShellProps) {
  const [, navigeer] = useLocation();
  const root = useRef<HTMLDivElement>(null);
  const [terugbel, setTerugbel] = useState(false);
  // De achtergrond achter de pagina in espresso: die kleurt in Safari op iPhone de
  // balk boven de pagina en is zichtbaar bij doorscrollen voorbij de rand. Zonder
  // dit is dat de lichte standaardachtergrond van de app.
  useEffect(() => {
    const html = document.documentElement.style.backgroundColor;
    const body = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = "#37352C";
    document.body.style.backgroundColor = "#37352C";
    return () => {
      document.documentElement.style.backgroundColor = html;
      document.body.style.backgroundColor = body;
    };
  }, []);

  // Interne links via de router, en altijd bovenaan beginnen op een nieuwe pagina.
  const klik = (e: MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const href = a.getAttribute("href") || "";
    // "Bel mij terug" opent de pop-up; op pagina's zonder aanvraagblok doet elke link naar #aanvragen dat.
    if (href === "#aanvragen" && !a.closest(".hdr")) {
      const blok = document.getElementById("aanvragen");
      if (!blok || /^\s*Bel mij terug/.test(a.textContent || "")) {
        e.preventDefault();
        setTerugbel(true);
        return;
      }
    }
    if (!href.startsWith("/") || href.startsWith("//")) return;
    if (href.startsWith("/api/")) return;
    e.preventDefault();
    const [pad, hash] = href.split("#");
    if (pad === window.location.pathname + window.location.search && hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigeer(pad);
    if (hash) {
      // De nieuwe pagina laadt mogelijk nog: even blijven proberen tot het anker er is.
      let pogingen = 0;
      const zoek = () => {
        const doel = document.getElementById(hash);
        if (doel) doel.scrollIntoView({ block: "start" });
        else if (pogingen++ < 30) window.setTimeout(zoek, 100);
      };
      window.setTimeout(zoek, 80);
    } else {
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);

  // normal-cursor: geen X-cursor van de oude site in design 3.0.
  const klassen = ["d3", "normal-cursor", ...css.map((c) => `css-${c}`), bodyKlasse].filter(Boolean).join(" ");
  return (
    <div ref={root} className={klassen} data-sector={sector} onClick={klik}>
      <Iconen />
      <Kop werkzoekende={werkzoekende} knopHref={knopHref} telKnop={telKnop} vast={kopVast} />
      <main id="inhoud">{children}</main>
      <Voet />
      <TerugbelPopup open={terugbel} sluit={() => setTerugbel(false)} functies={functies} sector={sector} />
    </div>
  );
}

function Kop({ werkzoekende, knopHref, telKnop, vast }: { werkzoekende: boolean; knopHref?: string; telKnop: boolean; vast: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const [mobiel, setMobiel] = useState(false);
  const [links, setLinks] = useState(24);
  const [location] = useLocation();
  const kop = useRef<HTMLElement>(null);
  const drop = useRef<HTMLDivElement>(null);
  const knoppen = useRef<(HTMLButtonElement | null)[]>([]);
  const aanvraagHref = knopHref && knopHref.startsWith("/personeelsaanvraag") ? knopHref : "/personeelsaanvraag";
  // De Engelse tegenhanger van deze pagina, anders de Engelse homepage.
  const engels = HREFLANG_PARTNER[normalizeMetaPath(location)]?.path ?? "/en";

  useEffect(() => { setOpen(null); setMobiel(false); }, [location]);
  useEffect(() => {
    document.documentElement.style.overflow = mobiel ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [mobiel]);
  useEffect(() => {
    if (open === null && !mobiel) return;
    const weg = (e: Event) => { if (open !== null && kop.current && !kop.current.contains(e.target as Node)) setOpen(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(null); setMobiel(false); } };
    document.addEventListener("pointerdown", weg);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", weg); document.removeEventListener("keydown", esc); };
  }, [open, mobiel]);
  // Het uitklapmenu onder de knop, maar binnen de breedte van de kopregel (zoals in de mock-up).
  useLayoutEffect(() => {
    if (open === null) return;
    const k = knoppen.current[open], h = kop.current, d = drop.current;
    if (!k || !h || !d) return;
    const r = k.getBoundingClientRect(), hr = h.getBoundingClientRect();
    setLinks(Math.max(24, Math.min(r.left - hr.left - 24, hr.width - d.offsetWidth - 24)));
  }, [open]);

  const actief = (g: MenuGroep) => g.links.some((l) => l.href === location) || g.cta?.knop.href === location;
  const paneel = (g: MenuGroep, mob = false) => (
    <>
      <div className="mn-kol" style={{ ["--k" as any]: `var(--${g.stip ?? "offwhite"})` } as CSSProperties}>
        <small><i></i>{g.kop}</small>
        <ul>
          {g.links.map((l) => (
            <li key={l.href + l.label}>
              <a href={l.href} style={l.kleur ? ({ ["--bk" as any]: `var(--${l.kleur})` } as CSSProperties) : undefined}>
                <b>{l.label}</b>{l.sub && !mob && <span>{l.sub}</span>}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {g.cta && !mob && (
        <div className="mn-cta">
          <b>{g.cta.kop}</b>
          <a className="knop vol" href={g.cta.knop.href === "/personeelsaanvraag" ? aanvraagHref : g.cta.knop.href}>{g.cta.knop.label} <Pijl /></a>
          <a className="mn-tel" href={g.cta.onder.href}>{g.cta.onder.tel && <Ic n="tel" />}{g.cta.onder.label}</a>
        </div>
      )}
    </>
  );

  return (
    <>
    <header ref={kop} className={`hdr${vast ? " vast" : ""}${open !== null ? " menu-open" : ""}`}>
      <div className="w">
        <a className="logo" href="/" aria-label="EXTRA, naar de homepage"><img src="/d3/logo-w.svg" alt="EXTRA" /></a>
        <nav className="nav" aria-label="Hoofdmenu">
          {MENU.map((g, i) => (
            <button
              key={g.label}
              ref={(el) => { knoppen.current[i] = el; }}
              type="button"
              className="nv-knop"
              aria-expanded={open === i}
              aria-controls="nv-drop"
              style={actief(g) && open !== i ? { borderColor: "rgba(248,247,244,.5)" } : undefined}
              onClick={() => setOpen(open === i ? null : i)}
            >
              {g.label}
            </button>
          ))}
        </nav>
        <a className="taal" href={engels} lang="en" aria-label="English version">EN</a>
        {telKnop ? (
          <a className="knop" href="tel:0851305915"><Ic n="tel" /><span>085 130 59 15</span></a>
        ) : werkzoekende ? (
          <a className="knop" href="/aanmelden" aria-label="Solliciteer direct"><Ic n="koffer" /><span>Solliciteer direct</span></a>
        ) : (
          <a className="knop" href={knopHref ?? "/personeelsaanvraag"}><Ic n="tel" /><span>Personeel aanvragen</span></a>
        )}
        <button type="button" className="burger" aria-label="Menu openen" aria-expanded={mobiel} onClick={() => setMobiel(true)}>
          <Ic n="menu" />
        </button>
      </div>
      <div ref={drop} id="nv-drop" className="nv-drop" hidden={open === null} style={{ left: links }}>
        {open !== null && <div className="mn-paneel">{paneel(MENU[open])}</div>}
      </div>
    </header>
      {/* Buiten de header: die heeft een animatie met backdrop-filter, waardoor
          een position:fixed-kind anders binnen de kopregel blijft. */}
      {mobiel && (
        <div className="nv-mob" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="nv-mob-kop">
            <img src="/d3/logo-w.svg" alt="EXTRA" />
            <button type="button" className="nv-mob-x" aria-label="Menu sluiten" onClick={() => setMobiel(false)}>&#x2715;</button>
          </div>
          <div className="nv-mob-in">
            {MENU.map((g, i) => (
              <details key={g.label} open={i === 0}>
                <summary>{g.label}<i aria-hidden="true" /></summary>
                <div className="mm-in">{paneel(g, true)}</div>
              </details>
            ))}
            <a className="nv-mob-taal" href={engels} lang="en">English</a>
          </div>
          <div className="nv-mob-voet">
            <a className="knop vol" href={aanvraagHref}>Personeel aanvragen</a>
            <a className="knop lijn" href="/aanmelden">Solliciteer direct</a>
            <a className="mn-tel" href={TELEFOON_HREF}>{TELEFOON}</a>
          </div>
        </div>
      )}
    </>
  );
}

function Voet() {
  return (
    <footer className="ftr f3">
      <div className="f3-kop">
        <div>
          <p className="f3-zin">
            Het uitzendbureau voor <a href="/hotels" style={{ ["--k" as any]: "var(--rose)" }}>hotels</a>,{" "}
            <a href="/logistiek" style={{ ["--k" as any]: "var(--pistachio)" }}>logistiek</a> en{" "}
            <a href="/evenementen" style={{ ["--k" as any]: "var(--sky)" }}>events</a>.
          </p>
          <p className="f3-sub">Flexibel personeel in loondienst, met het unieke beloningssysteem EXTRAATje.</p>
        </div>
        <nav className="ftr-bollen" aria-label="Kies je branche">
          <a href="/hotels" className="fb" style={{ ["--k" as any]: "var(--rose)" }}><b>Hospitality</b><small>experts</small></a>
          <a href="/logistiek" className="fb" style={{ ["--k" as any]: "var(--pistachio)" }}><b>Logistic</b><small>professionals</small></a>
          <a href="/evenementen" className="fb" style={{ ["--k" as any]: "var(--sky)" }}><b>Event</b><small>manpower</small></a>
        </nav>
      </div>
      <div className="f3-rij">
        <div className="f3-contact">
          <h4>Contact</h4>
          <a className="f3-tel" href={TELEFOON_HREF}><Ic n="tel" />{TELEFOON}</a>
          <a className="f3-mail" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <p>Herengracht 372<br />1016 CH Amsterdam</p>
          <a className="nen" href="/nen-4400-1-certificering"><Ic n="schild" />NEN 4400-1 gecertificeerd</a>
        </div>
        {FOOTER.map((k) => (
          <div key={k.kop}>
            <h4>{k.kop}</h4>
            <ul>{k.links.map((l) => <li key={l.href + l.label}><a href={l.href}>{l.label}</a></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="onder">
        <span>© {new Date().getFullYear()} EXTRA Uitzendbureau B.V. · KvK 91860903 · Amsterdam</span>
        <span>
          <a href="/privacybeleid">Privacybeleid</a>
          <a href="/voorwaarden">Algemene voorwaarden</a>
          <a href="/cookiebeleid">Cookiebeleid</a>
          <a href="/contact">Contact</a>
        </span>
      </div>
      <div className="reuzenlogo" aria-hidden="true" />
    </footer>
  );
}
