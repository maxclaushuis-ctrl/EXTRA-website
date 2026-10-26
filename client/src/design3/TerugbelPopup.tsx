/**
 * Pop-up "Bel mij terug" (mock-up terugbel.js): een klein formulier op de
 * pagina zelf. Gaat naar dezelfde endpoint als het korte terugbelformulier
 * (POST /api/staffing-request, bron "terugbel") en daarna naar de bedankpagina,
 * zodat de aanvraag in Analytics meetbaar blijft.
 *
 * De keuzelijst is een eigen lijst in de stijl van de site (geen systeemlijst),
 * met de functies van de pagina en altijd "Anders".
 */
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useLocation } from "wouter";
import { herkomstVoorFormulier } from "@/lib/herkomst";
import { Pijl } from "./basis";
import { TELEFOON, TELEFOON_HREF } from "./links";

/** Type locatie zoals het dashboard het kent; per pagina waar dat preciezer kan. */
const LOCATIE_PAD: Record<string, string> = {
  "/horecapersoneel-restaurants": "restaurant",
  "/cateringpersoneel-inhuren": "cateraar",
};
const LOCATIE_SECTOR: Record<string, string> = { horeca: "hotel", events: "eventlocatie", logistiek: "logistiek", algemeen: "anders" };

type Veld = "companyName" | "contactName" | "phone";

export default function TerugbelPopup({ open, sluit, functies, sector }: { open: boolean; sluit: () => void; functies: string[]; sector: string }) {
  const [location, naar] = useLocation();
  const dialoog = useRef<HTMLDialogElement>(null);
  const eerste = useRef<HTMLInputElement>(null);
  const keuzeKnop = useRef<HTMLButtonElement>(null);
  const lijst = useRef<HTMLUListElement>(null);
  const id = useId().replace(/:/g, "");
  const [waarden, setWaarden] = useState<Record<Veld, string>>({ companyName: "", contactName: "", phone: "" });
  const [fouten, setFouten] = useState<Partial<Record<Veld, boolean>>>({});
  const [functie, setFunctie] = useState("");
  const [lijstOpen, setLijstOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);
  const opties = functies.length ? (functies.includes("Anders") ? functies : [...functies, "Anders"]) : [];

  useEffect(() => {
    const d = dialoog.current;
    if (!d) return;
    if (open && !d.open) {
      setMelding(null);
      d.showModal();
      document.documentElement.style.overflow = "hidden";
      window.setTimeout(() => eerste.current?.focus(), 0);
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    if (!lijstOpen) return;
    const items = Array.from(lijst.current?.querySelectorAll<HTMLLIElement>("li") ?? []);
    (items.find((li) => li.dataset.w === functie) ?? items[0])?.focus({ preventScroll: true });
    lijst.current?.scrollIntoView({ block: "nearest" });
  }, [lijstOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const ok = (v: Veld, w: string) => (v === "phone" ? w.replace(/\D/g, "").length >= 8 : w.trim().length > 0);
  const zet = (v: Veld, w: string) => {
    setWaarden((o) => ({ ...o, [v]: w }));
    if (fouten[v]) setFouten((f) => ({ ...f, [v]: !ok(v, w) }));
  };

  const kies = (w: string) => { setFunctie(w); setLijstOpen(false); keuzeKnop.current?.focus(); };
  const lijstToets = (e: KeyboardEvent<HTMLLIElement>, i: number) => {
    const items = Array.from(lijst.current?.querySelectorAll<HTMLLIElement>("li") ?? []);
    const ga = (j: number) => { e.preventDefault(); items[Math.max(0, Math.min(items.length - 1, j))]?.focus(); };
    if (e.key === "ArrowDown") ga(i + 1);
    else if (e.key === "ArrowUp") ga(i - 1);
    else if (e.key === "Home") ga(0);
    else if (e.key === "End") ga(items.length - 1);
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); kies(opties[i]); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setLijstOpen(false); keuzeKnop.current?.focus(); }
    else if (e.key === "Tab") setLijstOpen(false);
  };

  const verstuur = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nieuw: Partial<Record<Veld, boolean>> = {};
    (["companyName", "contactName", "phone"] as Veld[]).forEach((v) => { nieuw[v] = !ok(v, waarden[v]); });
    setFouten(nieuw);
    const fout = (["companyName", "contactName", "phone"] as Veld[]).find((v) => nieuw[v]);
    if (fout) {
      setMelding("Vul je bedrijfsnaam, naam en een geldig telefoonnummer in.");
      dialoog.current?.querySelector<HTMLInputElement>(`input[name="${fout}"]`)?.focus();
      return;
    }
    setMelding(null);
    setBezig(true);
    try {
      const res = await fetch("/api/staffing-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bron: "terugbel",
          companyName: waarden.companyName.trim(),
          contactName: waarden.contactName.trim(),
          phone: waarden.phone.trim(),
          locationType: LOCATIE_PAD[location] ?? LOCATIE_SECTOR[sector] ?? "anders",
          functions: functie ? [functie] : [],
          wantsCallback: true,
          notes: `Terugbelverzoek via ${location}`,
          herkomst: herkomstVoorFormulier(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || "Versturen lukte niet.");
      }
      sluit();
      naar(`/aanvraag-ontvangen?naam=${encodeURIComponent(waarden.contactName.trim().split(" ")[0])}`);
      window.scrollTo(0, 0);
    } catch (err: any) {
      setMelding(`${err?.message || "Versturen lukte niet."} Bel ons gerust op ${TELEFOON}.`);
    } finally {
      setBezig(false);
    }
  };

  return (
    <dialog
      ref={dialoog}
      className="tb-pop"
      aria-labelledby={`tb-titel-${id}`}
      onClose={() => { document.documentElement.style.overflow = ""; setLijstOpen(false); sluit(); }}
      onCancel={(e) => { if (lijstOpen) { e.preventDefault(); setLijstOpen(false); keuzeKnop.current?.focus(); } }}
      onClick={(e) => {
        if (e.target === dialoog.current) sluit();
        else if (lijstOpen && !(e.target as HTMLElement).closest(".tb-keuze")) setLijstOpen(false);
      }}
    >
      <form className="tb-form" noValidate onSubmit={verstuur}>
        <button type="button" className="tb-x" aria-label="Sluiten" onClick={sluit}>&#x2715;</button>
        <p className="tb-kop"><b id={`tb-titel-${id}`}>Bel mij terug</b><span>Laat je gegevens achter. Op werkdagen bellen we je meestal binnen een uur terug.</span></p>
        {([
          ["companyName", "Bedrijfsnaam", { autoComplete: "organization", placeholder: "Naam van je bedrijf" }],
          ["contactName", "Naam", { autoComplete: "name", placeholder: "Voor en achternaam" }],
          ["phone", "Telefoon", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "06 12 34 56 78" }],
        ] as [Veld, string, Record<string, string>][]).map(([v, label, props]) => (
          <label key={v} className={fouten[v] ? "tb-fout" : undefined}>
            <span>{label}</span>
            <input ref={v === "companyName" ? eerste : undefined} name={v} required {...props} value={waarden[v]} onChange={(e) => zet(v, e.target.value)} aria-invalid={fouten[v] || undefined} />
          </label>
        ))}
        {opties.length > 0 && (
          <div className="tb-veld">
            <span id={`tb-fl-${id}`}>Functie</span>
            <div className="tb-keuze">
              <button
                ref={keuzeKnop}
                type="button"
                className="tb-keuze-knop"
                aria-haspopup="listbox"
                aria-expanded={lijstOpen}
                aria-labelledby={`tb-fl-${id} tb-fw-${id}`}
                onClick={() => setLijstOpen(!lijstOpen)}
                onKeyDown={(e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setLijstOpen(true); } }}
              >
                <span id={`tb-fw-${id}`} className={functie ? undefined : "leeg"}>{functie || "Kies een functie"}</span>
              </button>
              {lijstOpen && (
                <ul ref={lijst} className="tb-lijst" role="listbox" aria-labelledby={`tb-fl-${id}`}>
                  {opties.map((o, i) => (
                    <li key={o} role="option" tabIndex={-1} data-w={o} aria-selected={functie === o} onClick={() => kies(o)} onKeyDown={(e) => lijstToets(e, i)}>{o}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        {melding && <p className="tb-melding" role="alert">{melding}</p>}
        <button className="knop vol" type="submit" disabled={bezig}>{bezig ? "Even geduld" : "Bel mij terug"} <Pijl /></button>
        <p className="tb-of">Liever zelf bellen? <a href={TELEFOON_HREF}>{TELEFOON}</a></p>
      </form>
    </dialog>
  );
}
