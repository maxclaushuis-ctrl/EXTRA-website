/**
 * Sollicitanten: Gesprekken (bord I, D2), Beoordelen en Ref. en doc. check met
 * de knop EXTRA check (bord I5, D7).
 */
import { useMemo, useState } from "react";
import { BRANCHE, BRANCHES, dagKleur, dagenTekst, type Branche } from "@shared/sollicitantRegels";
import { BrancheChip, Leeg, kortDatum, maandNaam, useData } from "./gedeeld";

export type Lijst = "gesprekken" | "beoordelen" | "refdoc" | "extra";
interface Tellers { gesprekken: number; beoordelen: number; ref_doc_check: number; extra_check: number }

export function Subtabs({ lijst, tellers, kies }: { lijst: Lijst; tellers?: Tellers; kies: (l: Lijst) => void }) {
  const t = tellers;
  const items: [Lijst, string, number | undefined][] = [
    ["gesprekken", "Gesprekken", t?.gesprekken], ["beoordelen", "Beoordelen", t?.beoordelen], ["refdoc", "Ref. en doc. check", t?.ref_doc_check],
  ];
  return (
    <div className="sv-segment" role="tablist">
      {items.map(([k, l, n]) => (
        <button key={k} role="tab" aria-selected={lijst === k || (k === "refdoc" && lijst === "extra")} className={lijst === k || (k === "refdoc" && lijst === "extra") ? "aan" : ""} onClick={() => kies(k)}>
          {l}{n !== undefined && <small>{n}</small>}
        </button>
      ))}
    </div>
  );
}

// ─── Gesprekken: weekoverzicht ──────────────────────────────────────────────

interface Gesprek { id: number; naam: string; datum: string; tijd: string; functie: string; branche: Branche; interviewer: string; bevestigd: boolean; stap: string }
interface Week { van: string; tot: string; gesprekken: Gesprek[]; tellers: Tellers }

function plus(isoDatum: string, n: number) {
  const d = new Date(`${isoDatum}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
const DAGKORT = ["Ma", "Di", "Wo", "Do", "Vr"];
const BLOK_PX = 52;

/** Gesprekken die elkaar overlappen (twee interviewers tegelijk) komen naast elkaar. */
export function banen<T>(lijst: T[], top: (g: T) => number): { g: T; baan: number; aantal: number }[] {
  const gesorteerd = [...lijst].sort((a, b) => top(a) - top(b));
  const uit: { g: T; baan: number; aantal: number }[] = [];
  let groep: { g: T; baan: number; aantal: number }[] = [];
  let einde = -Infinity;
  const sluit = () => { const n = Math.max(1, ...groep.map((x) => x.baan + 1)); groep.forEach((x) => (x.aantal = n)); uit.push(...groep); groep = []; };
  for (const g of gesorteerd) {
    const t = top(g);
    if (t >= einde && groep.length) sluit();
    const bezet = new Set(groep.filter((x) => top(x.g) + BLOK_PX > t).map((x) => x.baan));
    let baan = 0; while (bezet.has(baan)) baan++;
    groep.push({ g, baan, aantal: 1 });
    einde = Math.max(einde, t + BLOK_PX);
  }
  if (groep.length) sluit();
  return uit;
}
const UUR_PX = 84;
const EERSTE_UUR = 9;

export function weekLabel(van: string) {
  const a = new Date(`${van}T12:00:00Z`), b = new Date(`${plus(van, 4)}T12:00:00Z`);
  return a.getUTCMonth() === b.getUTCMonth()
    ? `${a.getUTCDate()} tot ${b.getUTCDate()} ${maandNaam(b.getUTCMonth())}`
    : `${a.getUTCDate()} ${maandNaam(a.getUTCMonth())} tot ${b.getUTCDate()} ${maandNaam(b.getUTCMonth())}`;
}

export function Gesprekken({ open, kies, van, zetVan }: { open: (id: number) => void; kies: (l: Lijst) => void; van: string; zetVan: (v: string) => void }) {
  const { data, fout } = useData<Week>(`/api/sollicitanten/week${van ? `?van=${van}` : ""}`);
  const [weergave, setWeergave] = useState<"week" | "dag">("week");
  const [dag, setDag] = useState(0);
  const w = data;
  const dagen = w ? (weergave === "week" ? [0, 1, 2, 3, 4] : [dag]) : [];
  const laatste = Math.max(16, ...(w?.gesprekken || []).map((g) => parseInt(g.tijd, 10) + 1 || 0));
  const uren = Array.from({ length: Math.min(laatste, 20) - EERSTE_UUR + 1 }, (_, i) => EERSTE_UUR + i);
  const vanaf = (g: Gesprek) => {
    const [u, m] = g.tijd.split(":").map(Number);
    return Math.max(0, ((u - EERSTE_UUR) * 60 + (m || 0)) * UUR_PX / 60 + 2);
  };
  const kolommen = `60px repeat(${dagen.length}, minmax(${weergave === "week" ? 120 : 300}px, 1fr))`;
  return (
    <div className="sv-lijst">
      <Subtabs lijst="gesprekken" tellers={w?.tellers} kies={kies} />
      <div className="sv-tussen" style={{ marginTop: 22 }}>
        <div>
          <h1>Gesprekken</h1>
          <p className="sv-sub">{w ? `${w.gesprekken.length} gesprekken op kantoor deze week · Herengracht 372` : "Laden..."}</p>
        </div>
        <div className="sv-rij">
          <div className="sv-segment">
            <button className={weergave === "dag" ? "aan" : ""} onClick={() => setWeergave("dag")}>Dag</button>
            <button className={weergave === "week" ? "aan" : ""} onClick={() => setWeergave("week")}>Week</button>
          </div>
          {weergave === "dag" && w && (
            <div className="sv-segment">{DAGKORT.map((d, i) => <button key={d} className={dag === i ? "aan" : ""} onClick={() => setDag(i)}>{d} {new Date(`${plus(w.van, i)}T12:00:00Z`).getUTCDate()}</button>)}</div>
          )}
          <button className="sv-knop" onClick={() => w && zetVan(plus(w.van, -7))}>‹ Vorige</button>
          <b style={{ minWidth: 150, textAlign: "center" }}>{w ? weekLabel(w.van) : ""}</b>
          <button className="sv-knop" onClick={() => w && zetVan(plus(w.van, 7))}>Volgende ›</button>
        </div>
      </div>
      <div className="sv-legenda">
        {BRANCHES.map((b) => <span key={b}><i style={{ background: BRANCHE[b].vlak, border: `1px solid ${BRANCHE[b].rand}` }} />{BRANCHE[b].label}</span>)}
        <span><b style={{ color: "#3E8E5A" }}>✓</b> Kandidaat heeft bevestigd</span>
      </div>
      {fout && <div className="sv-fout">{fout}</div>}
      {w && (
        <div className="sv-week">
          <div className="sv-week-kop" style={{ gridTemplateColumns: kolommen }}>
            <div />
            {dagen.map((i) => {
              const d = plus(w.van, i);
              const n = w.gesprekken.filter((g) => g.datum === d).length;
              return <div key={i}>{DAGKORT[i]} {new Date(`${d}T12:00:00Z`).getUTCDate()} <small>· {n}</small></div>;
            })}
          </div>
          <div className="sv-week-lijf" style={{ gridTemplateColumns: kolommen }}>
            <div>{uren.map((u) => <div key={u} className="sv-week-uur sv-week-tijd">{u}:00</div>)}</div>
            {dagen.map((i) => {
              const d = plus(w.van, i);
              return (
                <div key={i} className="sv-week-dag">
                  {uren.map((u) => <div key={u} className="sv-week-uur" />)}
                  {banen(w.gesprekken.filter((g) => g.datum === d), vanaf).map(({ g, baan, aantal }) => (
                    <button key={g.id} className="sv-blok" style={{ top: vanaf(g), background: BRANCHE[g.branche].vlak, left: `calc(6px + (100% - 12px) * ${baan} / ${aantal})`, width: `calc((100% - 12px) / ${aantal} - ${aantal > 1 ? 4 : 0}px)`, right: "auto" }} onClick={() => open(g.id)} title={`${g.naam}, ${g.tijd}`}>
                      <b>{g.naam}</b>
                      <span>{g.tijd} · {g.functie}{g.interviewer ? ` · ${g.interviewer}` : ""}</span>
                      {g.bevestigd && <i aria-label="bevestigd">✓</i>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
          {!w.gesprekken.length && <Leeg>Geen gesprekken deze week.</Leeg>}
        </div>
      )}
    </div>
  );
}

// ─── Beoordelen, Ref. en doc. check, EXTRA check ───────────────────────────

interface Rij { id: number; naam: string; functie: string; branche: Branche; dagen: number; interviewer: string; intakeAfgerond: string | null; referentie: string; idOk: boolean; twijfelDoor: string | null; twijfelAt: string | null }
interface LijstData { rijen: Rij[]; kpi: { referentieOpen: number; idOpen: number; langerDanWeek: number }; tellers: Tellers }

const PER_PAGINA = 10;

export function Stappenlijst({ lijst, open, kies }: { lijst: "beoordelen" | "refdoc" | "extra"; open: (id: number) => void; kies: (l: Lijst) => void }) {
  const stap = lijst === "beoordelen" ? "beoordelen" : lijst === "refdoc" ? "ref_doc_check" : "extra_check";
  const { data, fout } = useData<LijstData>(`/api/sollicitanten/lijst?stap=${stap}`);
  const { data: extra } = useData<LijstData>(lijst === "refdoc" ? "/api/sollicitanten/lijst?stap=extra_check" : null);
  const [branche, setBranche] = useState<Branche | "alle">("alle");
  const [zoek, setZoek] = useState("");
  const [nieuwst, setNieuwst] = useState(false);
  const [pagina, setPagina] = useState(0);
  const rijen = useMemo(() => {
    let r = (data?.rijen || []).filter((x) => branche === "alle" || x.branche === branche);
    if (zoek.trim()) r = r.filter((x) => x.naam.toLowerCase().includes(zoek.trim().toLowerCase()));
    return nieuwst ? [...r].sort((a, b) => a.dagen - b.dagen) : r;
  }, [data, branche, zoek, nieuwst]);
  const zichtbaar = rijen.slice(pagina * PER_PAGINA, (pagina + 1) * PER_PAGINA);
  const aantal = (b: Branche | "alle") => (data?.rijen || []).filter((x) => b === "alle" || x.branche === b).length;
  const tellers = data?.tellers;
  const extraN = lijst === "extra" ? data?.rijen.length : tellers?.extra_check ?? extra?.rijen.length;
  const titel = lijst === "beoordelen" ? "Beoordelen" : lijst === "refdoc" ? "Ref. en doc. check" : "EXTRA check";
  const uitleg = lijst === "beoordelen"
    ? "Iedereen bij wie de intake is afgerond en de beoordeling nog moet gebeuren."
    : lijst === "refdoc"
      ? "Iedereen die nog een referentie of ID-check nodig heeft, en hoe lang al. Is beides in orde, dan verdwijnt de sollicitant uit deze lijst."
      : "De twijfelgevallen. Open de kaart en kies Afwijzen of Onboarden.";
  return (
    <div className="sv-lijst">
      <div className="sv-tussen">
        <Subtabs lijst={lijst} tellers={tellers} kies={kies} />
        <div className="sv-rij">
          <input type="search" placeholder="⌕ Zoek op naam" value={zoek} onChange={(e) => { setZoek(e.target.value); setPagina(0); }} style={{ width: 200, height: 40 }} aria-label="Zoek op naam" />
          <button className="sv-knop" onClick={() => setNieuwst((n) => !n)}>{nieuwst ? "Kortst open eerst ▾" : "Langst open eerst ▾"}</button>
        </div>
      </div>
      <h1 style={{ marginTop: 22 }}>{titel}</h1>
      <p className="sv-sub">{uitleg}</p>
      {lijst !== "beoordelen" && data && (
        <div className="sv-kpis">
          <div className="sv-kpi"><b>{data.kpi.referentieOpen}</b><span>Referentie nog open</span></div>
          <div className="sv-kpi"><b>{data.kpi.idOpen}</b><span>ID-check nog open</span></div>
          <div className="sv-kpi"><b>{data.kpi.langerDanWeek}</b><span>Langer dan een week</span></div>
        </div>
      )}
      <div className="sv-tabs" style={{ marginTop: lijst === "beoordelen" ? 18 : 0 }}>
        {(["alle", ...BRANCHES] as const).map((b) => (
          <button key={b} className={`tab ${branche === b ? "aan" : ""}`} onClick={() => { setBranche(b); setPagina(0); }}>
            {b === "alle" ? "Alle" : BRANCHE[b].label} {aantal(b)}
          </button>
        ))}
        {lijst !== "beoordelen" && (
          <button className={`sv-extra ${lijst === "extra" ? "aan" : ""}`} onClick={() => kies(lijst === "extra" ? "refdoc" : "extra")} aria-pressed={lijst === "extra"}>
            EXTRA check<small>{extraN ?? ""}</small>
          </button>
        )}
      </div>
      {fout && <div className="sv-fout">{fout}</div>}
      <table className="sv-tabel">
        <thead><tr>
          <th>Sollicitant</th><th>Branche</th>
          <th>{lijst === "beoordelen" ? "Intake afgerond" : lijst === "extra" ? "Twijfel van" : "In deze stap"}</th>
          {lijst !== "beoordelen" && lijst !== "extra" ? null : <th>In deze stap</th>}
          <th>Interviewer</th><th aria-label="Openen" />
        </tr></thead>
        <tbody>
          {zichtbaar.map((r) => (
            <tr key={r.id} className="klik" onClick={() => open(r.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") open(r.id); }}>
              <td>
                <div className="sv-rij" style={{ flexWrap: "nowrap" }}>
                  {lijst !== "beoordelen" && <span className="sv-stip" style={{ background: dagKleur(r.dagen) }} aria-hidden="true" />}
                  <div><b style={{ fontSize: 15 }}>{r.naam}</b><div className="sv-klein">{r.functie}</div></div>
                </div>
              </td>
              <td><BrancheChip b={r.branche} /></td>
              <td><b>{lijst === "beoordelen" ? kortDatum(r.intakeAfgerond) : lijst === "extra" ? `${(r.twijfelDoor || "").split(" ")[0]} · ${kortDatum(r.twijfelAt)}` : dagenTekst(r.dagen)}</b></td>
              {lijst === "beoordelen" || lijst === "extra" ? <td><b>{dagenTekst(r.dagen)}</b></td> : null}
              <td className="sv-grijs">{r.interviewer}</td>
              <td className="sv-grijs" style={{ textAlign: "right" }}>›</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data && !rijen.length && <Leeg>{lijst === "extra" ? "Geen twijfelgevallen." : lijst === "beoordelen" ? "Niemand wacht op een beoordeling." : "Niemand wacht op een referentie- of ID-check."}</Leeg>}
      {rijen.length > 0 && (
        <div className="sv-voet">
          <span>{pagina * PER_PAGINA + 1} tot {Math.min(rijen.length, (pagina + 1) * PER_PAGINA)} van {rijen.length}</span>
          <span className="sv-rij">
            {pagina > 0 && <button className="sv-knop-link sv-knop" onClick={() => setPagina((p) => p - 1)}>‹ Vorige</button>}
            {(pagina + 1) * PER_PAGINA < rijen.length && <button className="sv-knop-link sv-knop" onClick={() => setPagina((p) => p + 1)}>Volgende ›</button>}
          </span>
        </div>
      )}
    </div>
  );
}
