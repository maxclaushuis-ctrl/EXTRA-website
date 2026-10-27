/**
 * Bouwstenen voor het dashboard in design 3.0 (oktober 2026).
 *
 * Gelijk aan de mock-up "EXTRA Dashboard 3.0": tegels die ook tabbladen zijn,
 * functielabels in de kleur van het vakgebied, talen als korte codes en het
 * kanaal op twee regels. De opmaak staat in client/src/styles/dashboard3.css
 * onder de klassen d3-*; hier staat alleen de structuur.
 */
import type { ReactNode } from "react";
import { BedDouble, ChefHat, ConciergeBell, Package, UtensilsCrossed, type LucideIcon } from "lucide-react";

/** Koptekst van een scherm: titel, uitleg en knoppen rechts. */
export function D3Kop({ titel, uitleg, children }: { titel: string; uitleg?: ReactNode; children?: ReactNode }) {
  return (
    <div className="d3-kop">
      <div>
        <h1>{titel}</h1>
        {uitleg && <p>{uitleg}</p>}
      </div>
      {children && <div className="d3-knoppen">{children}</div>}
    </div>
  );
}

export type TegelSoort = "standaard" | "letop" | "goed" | "stop" | "aandacht";

export interface Tegel<K extends string> {
  sleutel: K;
  titel: string;
  getal: number;
  sub?: ReactNode;
  soort?: TegelSoort;
}

/** Vier tegels met cijfers die tegelijk de tabbladen van het scherm zijn. */
export function D3Tegels<K extends string>({ tegels, actief, kies, label }: { tegels: Tegel<K>[]; actief?: K | null; kies?: (k: K) => void; label: string }) {
  return (
    <div className="d3-tegels" role={kies ? "tablist" : undefined} aria-label={label}>
      {tegels.map((t) => (
        <button
          key={t.sleutel}
          type="button"
          role={kies ? "tab" : undefined}
          aria-selected={kies ? actief === t.sleutel : undefined}
          className={`d3-tegel ${t.soort && t.soort !== "standaard" ? t.soort : ""}`}
          onClick={kies ? () => kies(t.sleutel) : undefined}
          tabIndex={kies ? 0 : -1}
        >
          <span className="t"><i />{t.titel}</span>
          <span className="g">{t.getal}</span>
          {t.sub && <span className="s">{t.sub}</span>}
        </button>
      ))}
    </div>
  );
}

const FUNCTIES: Record<string, { label: string; vak: "hos" | "log" | "alg"; icoon: LucideIcon }> = {
  housekeeping: { label: "Housekeeping", vak: "hos", icoon: BedDouble },
  chef: { label: "Chef", vak: "hos", icoon: ChefHat },
  frontoffice: { label: "Front office", vak: "hos", icoon: ConciergeBell },
  "front-office": { label: "Front office", vak: "hos", icoon: ConciergeBell },
  receptie: { label: "Front office", vak: "hos", icoon: ConciergeBell },
  logistiek: { label: "Logistiek", vak: "log", icoon: Package },
  horecamedewerker: { label: "Horecamedewerker", vak: "alg", icoon: UtensilsCrossed },
};

/** Vakgebied van een functie: bepaalt de kleur van label en initialen. */
export function vakVan(functie?: string | null): "hos" | "log" | "alg" | "geen" {
  if (!functie) return "geen";
  return FUNCTIES[functie.toLowerCase()]?.vak ?? "alg";
}

/** Functielabel: kleur van het vakgebied, icoon van de functie. */
export function FunctieLabel({ functie }: { functie?: string | null }) {
  if (!functie) return <span className="d3-fn f-geen">Onbekend</span>;
  const f = FUNCTIES[functie.toLowerCase()];
  const Icoon = f?.icoon ?? UtensilsCrossed;
  return (
    <span className={`d3-fn f-${f?.vak ?? "alg"}`}>
      <Icoon className="ic" aria-hidden="true" />
      {f?.label ?? functie}
    </span>
  );
}

/** Initialen in een rondje plus naam, met een tweede regel eronder. */
export function Persoon({ voornaam, achternaam, sub, functie }: { voornaam?: string | null; achternaam?: string | null; sub?: ReactNode; functie?: string | null }) {
  const ini = `${(voornaam || "").charAt(0)}${(achternaam || "").charAt(0)}`.toUpperCase() || "?";
  return (
    <span className="d3-persoon">
      <span className={`d3-ini f-${vakVan(functie)}`} aria-hidden="true">{ini}</span>
      <span>
        <b>{[voornaam, achternaam].filter(Boolean).join(" ") || "Onbekend"}</b>
        {sub && <span className="sub">{sub}</span>}
      </span>
    </span>
  );
}

/** Talen als korte codes (NL, EN, ...). Uit vrije tekst zoals "Goed Nederlands, Redelijk Engels". */
export function Talen({ taal }: { taal?: string | null }) {
  if (!taal) return <span className="d3-zacht">Onbekend</span>;
  const t = taal.toLowerCase();
  const codes: string[] = [];
  if (/nederland|dutch|\bnl\b/.test(t)) codes.push("NL");
  if (/engels|english|\ben\b/.test(t)) codes.push("EN");
  if (/duits|german|\bde\b/.test(t)) codes.push("DE");
  if (/frans|french|\bfr\b/.test(t)) codes.push("FR");
  if (/spaans|spanish|\bes\b/.test(t)) codes.push("ES");
  if (/pools|polish|\bpl\b/.test(t)) codes.push("PL");
  if (/roemeens|romanian|\bro\b/.test(t)) codes.push("RO");
  if (codes.length === 0) return <span className="d3-zacht" title={taal}>{taal}</span>;
  return <span className="d3-talen" title={taal}>{codes.map((c) => <abbr key={c}>{c}</abbr>)}</span>;
}

/** Kanaal op twee regels: de bron vet, daaronder "via website" als het via de site kwam. */
export function Kanaal({ bron }: { bron?: string | null }) {
  if (!bron) return <span className="d3-zacht">Onbekend</span>;
  const m = bron.match(/^website\s*[-–:]?\s*(.*)$/i);
  if (m) {
    const rest = (m[1] || "").trim();
    const naam = !rest || /^aanmeld/i.test(rest) ? "Aanmeldflow" : rest.charAt(0).toUpperCase() + rest.slice(1);
    return <span className="d3-kanaal" title={bron}><b>{naam}</b><span>via website</span></span>;
  }
  return <span className="d3-kanaal" title={bron}><b>{bron}</b></span>;
}

export type StatusSoort = "nieuw" | "letop" | "goed" | "stop" | "neutraal";

/** Status: stip en tekst, bewust een andere vorm dan een functielabel. */
export function StatusLabel({ soort = "neutraal", children }: { soort?: StatusSoort; children: ReactNode }) {
  return <span className={`d3-st ${soort}`}>{children}</span>;
}
