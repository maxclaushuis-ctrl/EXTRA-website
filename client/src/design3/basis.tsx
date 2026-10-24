/**
 * Kleine bouwstenen die overal in design 3.0 terugkomen.
 */
import { Fragment, type CSSProperties, type ReactNode } from "react";

export type IcoonNaam = "pijl" | "vink" | "ster" | "schild" | "oog" | "snel" | "hand" | "tel" | "koffer" | "menu" | "kruis";

/** De iconen staan één keer per pagina als sprite (zie <Iconen/>). */
export function Ic({ n, className = "ic", style }: { n: IcoonNaam; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className || undefined} style={style} aria-hidden="true">
      <use href={`#${n}`} />
    </svg>
  );
}

/** Pijl zonder ic-klasse, zoals in de knoppen van de mock-up. */
export function Pijl() {
  return (
    <svg aria-hidden="true">
      <use href="#pijl" />
    </svg>
  );
}

export function Iconen() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="pijl" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="vink" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="ster" viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" /></symbol>
      <symbol id="schild" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></symbol>
      <symbol id="oog" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></symbol>
      <symbol id="snel" viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9.5 2.5h5" /></symbol>
      <symbol id="hand" viewBox="0 0 24 24"><path d="M4 7h16v11H4z" /><path d="M4 11h16M9 15h3" /></symbol>
      <symbol id="tel" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></symbol>
      <symbol id="koffer" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></symbol>
      <symbol id="menu" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16" /></symbol>
      <symbol id="kruis" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></symbol>
    </svg>
  );
}

/**
 * Tekst met opmaak uit de content-bestanden:
 *   [[woorden]]  in de schreefletter (Ogg-vervanger)
 *   {{woorden}}  in roze (alleen op de homepage)
 */
export function T({ t }: { t: string }) {
  const delen = t.split(/(\[\[.*?\]\]|\{\{.*?\}\})/g).filter(Boolean);
  return (
    <>
      {delen.map((d, i) => {
        if (d.startsWith("[[")) return <span key={i} className="serif">{d.slice(2, -2)}</span>;
        if (d.startsWith("{{")) return <span key={i} className="rose">{d.slice(2, -2)}</span>;
        return <Fragment key={i}>{d}</Fragment>;
      })}
    </>
  );
}

/** Interne of externe link; interne links navigeren via de SPA (zie Shell). */
export function A({ href, className, style, children, label }: { href?: string; className?: string; style?: CSSProperties; children: ReactNode; label?: string }) {
  return (
    <a href={href} className={className} style={style} aria-label={label}>
      {children}
    </a>
  );
}

/** Verdeelt een citaat in woorden voor de woord-voor-woord-animatie. */
export function Woorden({ tekst }: { tekst: string }) {
  const w = tekst.split(/\s+/);
  return (
    <>
      {w.map((x, i) => (
        <Fragment key={i}>
          <span style={{ ["--i" as any]: String(i) }}>{x}</span>
          {i < w.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

export function initialen(naam: string): string {
  const w = naam.split(/[\s.]+/).filter((x) => x && x[0] === x[0].toUpperCase() && /[A-Za-zÀ-ÿ]/.test(x[0]));
  if (w.length > 1) return w[0][0] + w[w.length - 1][0];
  return naam.slice(0, 2).toUpperCase();
}
