/**
 * Het profiel uit het sollicitatiegesprek, in het medewerkersdossier.
 * Leest via de koppeling medewerker naar kandidaat (employees.candidate_id) het dossier van de
 * kandidaat: er wordt niets gekopieerd, dus het zijn altijd dezelfde gegevens als in Sollicitanten.
 * Alleen voor intakes van formulier versie 2; bij versie 1 staat er waar de antwoorden te vinden zijn.
 */
import { useEffect, useState } from "react";
import { DISC, type RefStatus } from "@shared/sollicitantRegels";
import { CONTACT, EXTRAATJE, KANAAL_ZIN, KLEUR_WERK, SCHUIVEN_V2, TAAKNIVEAUS, TAALNIVEAUS, UITBETALING, type BeoordelingV2, type medewerkerProfiel } from "@shared/intakeV2";

type Profiel = ReturnType<typeof medewerkerProfiel>;
interface Antwoord {
  versie: 1 | 2 | null; profiel: Profiel | null; gekoppeld?: boolean; naam?: string; voornaam?: string;
  intakeDoor?: string | null; intakeAfgerondAt?: string | null; beoordeeldDoor?: string | null; beoordeeldAt?: string | null;
  beoordeling?: BeoordelingV2; controle?: { idGezien: boolean; idDoor: string | null; idAt: string | null; referentie: RefStatus };
}
const lbl = (l: readonly { code: string; label: string }[], code: unknown) => l.find((x) => x.code === code)?.label || "";
const dag = (x?: string | null) => (x ? new Date(x).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : "");

function Deel({ titel, children }: { titel: string; children: React.ReactNode }) {
  return <div><h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 border-b pb-1">{titel}</h4><div className="space-y-1 text-sm">{children}</div></div>;
}
function Rij({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-[150px_1fr] gap-3 py-0.5"><span className="text-gray-500">{label}</span><span className="text-gray-900">{children}</span></div>;
}

export function MedewerkerProfiel({ medewerkerId }: { medewerkerId: number }) {
  const [d, setD] = useState<Antwoord | null>(null);
  const [fout, setFout] = useState("");
  useEffect(() => {
    let weg = false;
    setD(null); setFout("");
    fetch(`/api/sollicitanten/medewerkerprofiel/${medewerkerId}`, { credentials: "include" })
      .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j?.message || "Niet beschikbaar"); return j; })
      .then((j) => { if (!weg) setD(j); }).catch((e) => { if (!weg) setFout(e.message); });
    return () => { weg = true; };
  }, [medewerkerId]);

  if (fout) return <p className="text-sm text-gray-400 text-center py-8">{fout}</p>;
  if (!d) return <p className="text-sm text-gray-400 text-center py-8">Laden...</p>;
  if (d.gekoppeld === false) return <p className="text-sm text-gray-400 text-center py-8">Deze medewerker is niet gekoppeld aan een sollicitatie.</p>;
  if (d.versie === null) return <p className="text-sm text-gray-400 text-center py-8">Er is geen afgeronde intake bij deze medewerker.</p>;
  if (d.versie === 1 || !d.profiel) return <p className="text-sm text-gray-500 text-center py-8">De intake is afgenomen met het oude formulier{d.intakeAfgerondAt ? ` op ${dag(d.intakeAfgerondAt)}` : ""}. De antwoorden staan ongewijzigd in het dossier bij Onboarding.</p>;

  const p = d.profiel;
  const b = d.beoordeling || {};
  return (
    <div className="py-4 space-y-4" data-testid="medewerker-profiel">
      <p className="text-xs text-gray-500">Uit het sollicitatiegesprek{d.intakeAfgerondAt ? ` van ${dag(d.intakeAfgerondAt)}` : ""}{d.intakeDoor ? ` met ${d.intakeDoor}` : ""}. Wat de kandidaat vertelde, wat de interviewer vaststelde en wat gecontroleerd is, staan apart.</p>
      <Deel titel="Gewenste inzet">
        <Rij label="Gewenste uren">{p.inzet.tekst || "Nog niet bekend"}</Rij>
        <Rij label="Weekpatroon">{p.weekpatroon.filter((x) => x.status === "beschikbaar").map((x) => `${x.dag} ${x.tekst}`).join(" · ") || "Nog niet bekend"}</Rij>
        {p.weekpatroon.some((x) => x.status === "niet") && <Rij label="Niet beschikbaar">{p.weekpatroon.filter((x) => x.status === "niet").map((x) => x.dag).join(", ")}</Rij>}
        <Rij label="Besproken op">{p.inzet.bevestigdOp ? dag(p.inzet.bevestigdOp) : "Niet vastgelegd"}</Rij>
        <p className="text-xs text-gray-400">Een gewone week, geen toezegging per datum. Actuele datums via de app.</p>
      </Deel>
      <Deel titel="Zo zet je deze medewerker goed in">
        {p.planner.rijen.map((r) => <Rij key={r.label} label={r.label}>{r.waarde}</Rij>)}
        {p.planner.doen.length > 0 && <Rij label="Doen">{p.planner.doen.join(" · ")}</Rij>}
        {p.planner.lieverNiet.length > 0 && <Rij label="Liever niet">{p.planner.lieverNiet.join(" · ")}</Rij>}
        {p.planner.grenzen.length > 0 && <Rij label="Harde grens"><b>{p.planner.grenzen.join(" · ")}</b></Rij>}
        {p.planner.aandacht.map((a) => <p key={a} className="rounded-md bg-amber-50 text-amber-900 px-3 py-1.5">{a}</p>)}
        {!p.planner.rijen.length && !p.planner.doen.length && <p className="text-gray-400">Niets vastgelegd.</p>}
      </Deel>
      {p.laterInspelen.length > 0 && (
        <Deel titel="Later op inspelen">
          {p.laterInspelen.map((l) => <Rij key={l.behoefte} label={l.behoefte}>{l.opvolging}</Rij>)}
          <p className="text-xs text-gray-400">Geheugensteun. Er wordt niets automatisch verstuurd.</p>
        </Deel>
      )}
      <Deel titel="Werkprofiel">
        <Rij label="Profiel">
          <span className="inline-flex items-center gap-2">{p.werkprofiel.kleuren.map((l) => <i key={l} title={KLEUR_WERK[l].label} style={{ width: 10, height: 10, borderRadius: 5, background: DISC[l].kleur, display: "inline-block" }} />)}{p.werkprofiel.titel}{p.werkprofiel.statusLabel ? ` · ${p.werkprofiel.statusLabel.toLowerCase()}` : ""}</span>
        </Rij>
        {p.werkprofiel.onderbouwing && <Rij label="Onderbouwing">{p.werkprofiel.onderbouwing}</Rij>}
        <p className="text-xs text-gray-400">Samenvatting van uitgesproken voorkeuren, door de interviewer gekozen. Geen test en geen selectiecriterium.</p>
      </Deel>
      <Deel titel="Kan (volgens de kandidaat)">
        <Rij label="Ervaring">{p.ervaringDuur || "Nog niet bekend"}</Rij>
        {p.taken.map((t) => <Rij key={t.naam} label={t.naam}>{lbl(TAAKNIVEAUS, t.niveau)}{t.voorbeeld ? ` · ${t.voorbeeld}` : ""}</Rij>)}
        {p.talen.map((t) => <Rij key={t.taal} label={t.taal}>{t.niveau ? lbl(TAALNIVEAUS, t.niveau) : "Niveau niet vastgesteld"} · {t.bron === "gesprek" ? "gehoord in het gesprek" : "zegt de kandidaat zelf"}</Rij>)}
      </Deel>
      <Deel titel="Contact, Jixbee en EXTRAATJE">
        <Rij label="Contact">{[lbl(CONTACT, p.contact.frequentie), p.contact.kanaal ? KANAAL_ZIN[p.contact.kanaal] : ""].filter(Boolean).join(", ") || "Nog niet bekend"}</Rij>
        <Rij label="Uitbetaling">{lbl(UITBETALING, p.uitbetaling) || "Nog niet besproken"}</Rij>
        <Rij label="EXTRAATJE">{lbl(EXTRAATJE, p.extraatje) || "Nog niet besproken"}</Rij>
      </Deel>
      <Deel titel="Beoordeling interviewer en controles">
        {SCHUIVEN_V2.map((s) => <Rij key={s.code} label={s.naam}>{typeof b[s.code] === "number" ? `${b[s.code]} van 100` : "Niet beoordeeld"}</Rij>)}
        {b.onderbouwing && <Rij label="Onderbouwing">{b.onderbouwing}</Rij>}
        <Rij label="Beoordeeld door">{[d.beoordeeldDoor, dag(d.beoordeeldAt)].filter(Boolean).join(" · ") || "Onbekend"}</Rij>
        <Rij label="ID">{d.controle?.idGezien ? `Gezien${d.controle.idDoor ? ` door ${d.controle.idDoor}` : ""}` : "Niet gezien"}</Rij>
        <Rij label="Referentie">{d.controle?.referentie === "positief" ? "Positief" : d.controle?.referentie === "overgeslagen" ? "Overgeslagen" : d.controle?.referentie === "negatief" ? "Negatief" : "Open"}</Rij>
      </Deel>
    </div>
  );
}
