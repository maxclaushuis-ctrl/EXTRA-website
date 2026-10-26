/**
 * Slotblok "Schrijf je in" voor werkzoekenden, als React-component voor de
 * pagina's die niet uit een fragment komen (vacatures). Werkt precies als het
 * formulier data-form="kandidaat" in Fragment.tsx: naam, telefoon en functie
 * gaan via sessionStorage naar /aanmelden, waar het volledige formulier staat.
 * Geen persoonsgegevens in de URL.
 */
import { useRef, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useReus } from "./gedrag";
import { Ic, Pijl } from "./basis";

export interface KandidaatSlotProps {
  id?: string;
  foto: string;
  tag: string;
  regels: [string, string, string];
  kop: string;
  sub: string;
  functies: string[];
  gekozen?: string;
  beschikbaarheid: string[];
  knop?: string;
  laag?: boolean;
}

const WHATSAPP = "https://wa.me/31851305915";

export default function KandidaatSlot({ id = "inschrijven", foto, tag, regels, kop, sub, functies, gekozen, beschikbaarheid, knop = "Schrijf je in", laag }: KandidaatSlotProps) {
  const reus = useRef<HTMLHeadingElement>(null);
  useReus(reus, 0.55);
  const [location, naar] = useLocation();
  const [fout, setFout] = useState<string | null>(null);

  function verstuur(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const w = (k: string) => String(fd.get(k) ?? "").trim();
    const functie = w("functie");
    if (!w("naam") || w("phone").replace(/\D/g, "").length < 8) {
      setFout("Vul je naam en een geldig telefoonnummer in.");
      return;
    }
    setFout(null);
    try {
      sessionStorage.setItem("extra-aanmelden", JSON.stringify({
        naam: w("naam"),
        telefoon: w("phone"),
        functie: functie && !/^kies/i.test(functie) ? functie : "",
        via: location,
      }));
    } catch { /* privémodus: dan vul je het op de volgende pagina in */ }
    naar("/aanmelden");
    window.scrollTo(0, 0);
  }

  return (
    <section className={`slot2 slot-werk${laag ? " slot-laag" : ""}`} id={id}>
      <div className="foto"><img src={foto} alt="" loading="lazy" /></div>
      <img className="tag" src={tag} alt="EXTRA, het uitzendbureau dat werkt" loading="lazy" />
      <h2 className="reus" ref={reus}><span className="l1">{regels[0]}</span> <span className="l2">{regels[1]}</span> <span className="l3">{regels[2]}</span></h2>
      <div className="acties">
        <form className="inschrijf" noValidate onSubmit={verstuur} aria-label="Inschrijven bij EXTRA">
          <p className="if-kop"><b>{kop}</b><span>{sub}</span></p>
          <label><span>Naam</span><input name="naam" type="text" autoComplete="name" placeholder="Voor en achternaam" /></label>
          <label><span>Telefoon</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" /></label>
          <label><span>Functie</span>
            <select name="functie" defaultValue={gekozen && functies.includes(gekozen) ? gekozen : "Kies een functie"}>
              <option>Kies een functie</option>
              {functies.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
          <fieldset><legend>Beschikbaarheid</legend><div className="if-chips">
            {beschikbaarheid.map((b) => <label key={b}><input type="checkbox" name="beschikbaarheid" value={b} /><span>{b}</span></label>)}
          </div></fieldset>
          {fout && <p className="form-fout" role="alert">{fout}</p>}
          <button className="knop vol" type="submit">{knop} <Pijl /></button>
          <a className="if-wa" href={WHATSAPP}>Liever eerst een vraag? App ons via WhatsApp <Ic n="pijl" /></a>
        </form>
      </div>
    </section>
  );
}
