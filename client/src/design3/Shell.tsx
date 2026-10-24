/**
 * De schil van elke pagina in design 3.0: header met menu, footer en de
 * iconen. Alle styling zit onder de klasse .d3, zodat het dashboard en de
 * medewerkersapp er niets van merken.
 */
import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import { useLocation } from "wouter";
import { HREFLANG_PARTNER, normalizeMetaPath } from "@shared/routeMeta";
import "./d3.css";
import "./d3-extra.css";
import { Iconen, Ic } from "./basis";
import { MENU, FOOTER, TELEFOON, TELEFOON_HREF, EMAIL, type MenuGroep } from "./links";

export type Sector = "horeca" | "events" | "logistiek" | "algemeen";

/** Welke CSS-bestanden uit de mock-up op deze pagina gelden (zie d3.css). */
export type CssSet = "events" | "hotels" | "logistiek" | "eventsland" | "werk" | "bedrijf" | "aanvraag" | "blog" | "vacature" | "functie" | "pagina" | "evland";

export const CSS_BEDRIJF: CssSet[] = ["events", "hotels", "logistiek", "eventsland", "werk", "bedrijf", "functie", "pagina"];

interface ShellProps {
  sector?: Sector;
  css?: CssSet[];
  /** true op pagina's voor werkzoekenden: de knop rechtsboven wordt "Solliciteer direct". */
  werkzoekende?: boolean;
  /** Bestemming van de knop rechtsboven (standaard het aanvraagformulier). */
  knopHref?: string;
  bodyKlasse?: string;
  /** Kopregel transparant over de hero (homepage), of vast donker. */
  kopVast?: boolean;
  children: ReactNode;
}

export default function Shell({ sector = "algemeen", css = [], werkzoekende = false, knopHref, bodyKlasse, kopVast = true, children }: ShellProps) {
  const [, navigeer] = useLocation();
  const root = useRef<HTMLDivElement>(null);

  // Interne links via de router, en altijd bovenaan beginnen op een nieuwe pagina.
  const klik = (e: MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const href = a.getAttribute("href") || "";
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
      <Kop werkzoekende={werkzoekende} knopHref={knopHref} vast={kopVast} />
      <main id="inhoud">{children}</main>
      <Voet />
    </div>
  );
}

function Kop({ werkzoekende, knopHref, vast }: { werkzoekende: boolean; knopHref?: string; vast: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const [mobiel, setMobiel] = useState(false);
  const [location] = useLocation();
  const kop = useRef<HTMLElement>(null);
  // De Engelse tegenhanger van deze pagina, anders de Engelse homepage.
  const engels = HREFLANG_PARTNER[normalizeMetaPath(location)]?.path ?? "/en";

  useEffect(() => { setOpen(null); setMobiel(false); }, [location]);
  useEffect(() => {
    document.documentElement.style.overflow = mobiel ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [mobiel]);
  useEffect(() => {
    if (open === null) return;
    const weg = (e: Event) => { if (kop.current && !kop.current.contains(e.target as Node)) setOpen(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("pointerdown", weg);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", weg); document.removeEventListener("keydown", esc); };
  }, [open]);

  const actief = (g: MenuGroep) => g.kolommen.some((k) => k.links.some((l) => l.href === location));

  return (
    <>
    <header ref={kop} className={`hdr${vast ? " vast" : ""}${open !== null ? " menu-open" : ""}${mobiel ? " mm-open" : ""}`}>
      <div className="w">
        <a className="logo" href="/" aria-label="EXTRA, naar de homepage"><img src="/d3/logo-w.svg" alt="EXTRA" /></a>
        <nav className="nav" aria-label="Hoofdmenu">
          {MENU.map((g, i) => (
            <div className={`nav-groep${open === i ? " open" : ""}`} key={g.label}>
              <button
                type="button"
                className="nav-knop"
                aria-expanded={open === i}
                aria-current={actief(g) ? "page" : undefined}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{g.label}</span>
              </button>
              {open === i && (
                <div className="nav-paneel" role="menu">
                  {g.kolommen.map((k) => (
                    <div className="np-kolom" key={k.kop}>
                      <small>{k.kop}</small>
                      <ul>
                        {k.links.map((l) => (
                          <li key={l.href + l.label}>
                            <a href={l.href} role="menuitem">
                              <b>{l.label}</b>
                              {l.sub && <span>{l.sub}</span>}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <a className="taal" href={engels} lang="en" aria-label="English version">EN</a>
        {werkzoekende ? (
          <a className="knop" href="/aanmelden" aria-label="Solliciteer direct"><Ic n="koffer" /><span>Solliciteer direct</span></a>
        ) : (
          <a className="knop" href={knopHref ?? "/personeelsaanvraag"}><Ic n="tel" /><span>Personeel aanvragen</span></a>
        )}
        <button type="button" className="burger" aria-label={mobiel ? "Menu sluiten" : "Menu openen"} aria-expanded={mobiel} onClick={() => setMobiel(!mobiel)}>
          <Ic n={mobiel ? "kruis" : "menu"} />
        </button>
      </div>
    </header>
      {/* Buiten de header: die heeft een animatie met backdrop-filter, waardoor
          een position:fixed-kind anders binnen de kopregel blijft. */}
      {mobiel && (
        <div className="mob-menu" role="dialog" aria-label="Menu">
          <div className="mm-binnen">
            {MENU.map((g) => (
              <details className="mm-groep" key={g.label}>
                <summary>{g.label}<i aria-hidden="true" /></summary>
                <ul>
                  {g.kolommen.flatMap((k) => k.links).map((l) => (
                    <li key={l.href + l.label}><a href={l.href}>{l.label}</a></li>
                  ))}
                </ul>
              </details>
            ))}
            <div className="mm-acties">
              <a className="knop vol" href="/personeelsaanvraag">Personeel aanvragen <Ic n="pijl" className="" /></a>
              <a className="knop lijn" href="/aanmelden">Solliciteer direct <Ic n="pijl" className="" /></a>
              <a className="mm-tel" href={TELEFOON_HREF}><Ic n="tel" />{TELEFOON}</a>
              <a className="mm-taal" href={engels} lang="en">English</a>
            </div>
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
            Het uitzendbureau voor <a href="/hotelpersoneel-inhuren" style={{ ["--k" as any]: "var(--rose)" }}>hotels</a>,{" "}
            <a href="/logistiek-personeel-inhuren" style={{ ["--k" as any]: "var(--pistachio)" }}>logistiek</a> en{" "}
            <a href="/eventpersoneel-inhuren" style={{ ["--k" as any]: "var(--sky)" }}>events</a>.
          </p>
          <p className="f3-sub">Flexibel personeel in loondienst, met het unieke beloningssysteem EXTRAATje.</p>
        </div>
        <nav className="ftr-bollen" aria-label="Kies je branche">
          <a href="/hotelpersoneel-inhuren" className="fb" style={{ ["--k" as any]: "var(--rose)" }}><b>Hospitality</b><small>experts</small></a>
          <a href="/logistiek-personeel-inhuren" className="fb" style={{ ["--k" as any]: "var(--pistachio)" }}><b>Logistic</b><small>professionals</small></a>
          <a href="/eventpersoneel-inhuren" className="fb" style={{ ["--k" as any]: "var(--sky)" }}><b>Event</b><small>manpower</small></a>
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
