/**
 * Het korte "Bel mij terug"-formulier van design 3.0: bedrijfsnaam, naam,
 * telefoon en functie. Gaat naar dezelfde endpoint als het volledige
 * formulier (POST /api/staffing-request) met bron "terugbel", en daarna naar
 * de bedankpagina, zodat de aanvraag in Analytics meetbaar blijft.
 */
import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { herkomstVoorFormulier } from "@/lib/herkomst";
import { Ic, Pijl } from "./basis";
import { TELEFOON, TELEFOON_HREF, WHATSAPP_HREF } from "./links";

export type Branche = "hotel" | "event" | "logistiek" | "anders";

interface Props {
  functies: string[];
  branche: Branche;
  gekozen?: string;
  /** "rij": de brede balk bovenaan; "kaart": de kaart in het slotblok. */
  vorm: "rij" | "kaart";
  kop?: string;
  sub?: string;
}

const LOCATIETYPE: Record<Branche, string> = { hotel: "hotel", event: "eventlocatie", logistiek: "logistiek", anders: "anders" };

export default function SnelAanvraag({ functies, branche, gekozen, vorm, kop = "Bel mij terug", sub }: Props) {
  const [, naar] = useLocation();
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const verstuur = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const waarde = (k: string) => String(f.get(k) ?? "").trim();
    const bedrijf = waarde("companyName");
    const naam = waarde("contactName");
    const telefoon = waarde("phone");
    const functie = waarde("functie");
    if (!bedrijf || !naam || telefoon.replace(/\D/g, "").length < 8) {
      setFout("Vul je bedrijfsnaam, naam en een geldig telefoonnummer in.");
      return;
    }
    setFout(null);
    setBezig(true);
    try {
      const res = await fetch("/api/staffing-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bron: "terugbel",
          companyName: bedrijf,
          contactName: naam,
          phone: telefoon,
          locationType: LOCATIETYPE[branche],
          functions: functie && functie !== "Kies een functie" ? [functie] : [],
          wantsCallback: true,
          notes: `Terugbelverzoek via ${window.location.pathname}`,
          herkomst: herkomstVoorFormulier(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || "Versturen lukte niet.");
      }
      naar(`/aanvraag-ontvangen?naam=${encodeURIComponent(naam.split(" ")[0])}`);
      window.scrollTo(0, 0);
    } catch (err: any) {
      setFout(`${err?.message || "Versturen lukte niet."} Bel ons gerust op ${TELEFOON}.`);
      setBezig(false);
    }
  };

  const keuze = (
    <select name="functie" defaultValue={gekozen ?? "Kies een functie"}>
      <option>Kies een functie</option>
      {functies.map((f) => <option key={f}>{f}</option>)}
    </select>
  );

  if (vorm === "rij") {
    return (
      <form className="av-form" onSubmit={verstuur} noValidate aria-label="Personeel aanvragen">
        <label><span>Bedrijfsnaam</span><input name="companyName" type="text" autoComplete="organization" placeholder="Naam van je bedrijf" required /></label>
        <label><span>Naam</span><input name="contactName" type="text" autoComplete="name" placeholder="Voor en achternaam" required /></label>
        <label><span>Telefoon</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="06 12 34 56 78" required /></label>
        <label><span>Functie</span>{keuze}</label>
        {fout && <p className="form-fout" role="alert">{fout}</p>}
        <button className="knop vol" type="submit" disabled={bezig}>{bezig ? "Even geduld" : "Bel mij terug"} <Pijl /></button>
      </form>
    );
  }
  return (
    <form className="inschrijf" onSubmit={verstuur} noValidate aria-label="Personeel aanvragen">
      <p className="if-kop"><b>{kop}</b>{sub && <span>{sub}</span>}</p>
      <label><span>Bedrijfsnaam</span><input name="companyName" type="text" autoComplete="organization" placeholder="Naam van je bedrijf" required /></label>
      <label><span>Naam</span><input name="contactName" type="text" autoComplete="name" placeholder="Voor en achternaam" required /></label>
      <label><span>Telefoon</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="06 12 34 56 78" required /></label>
      <label><span>Functie</span>{keuze}</label>
      {fout && <p className="form-fout" role="alert">{fout}</p>}
      <button className="knop vol" type="submit" disabled={bezig}>{bezig ? "Even geduld" : "Bel mij terug"} <Pijl /></button>
      <p className="if-of"><a href={TELEFOON_HREF}><Ic n="tel" />{TELEFOON}</a><a className="if-wa" href={WHATSAPP_HREF}>WhatsApp ons <Ic n="pijl" /></a></p>
    </form>
  );
}
