/**
 * Gedeelde bouwstenen voor Sollicitanten, Onboarding en Archief (borden I tot J2).
 * Alle stijl staat hier, onder de klasse .sv, zodat niets buiten deze schermen verandert.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BRANCHE, VOORTGANG, type Branche } from "@shared/sollicitantRegels";

export async function api<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const r = await fetch(url, {
    method: init?.method || "GET",
    credentials: "include",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as any)?.message || `HTTP ${r.status}`);
  return d as T;
}

export function useData<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [fout, setFout] = useState("");
  const [teller, setTeller] = useState(0);
  useEffect(() => {
    if (!url) return;
    let weg = false;
    setFout("");
    api<T>(url).then((d) => { if (!weg) setData(d); }).catch((e) => { if (!weg) setFout(e.message); });
    return () => { weg = true; };
  }, [url, teller]);
  const opnieuw = useCallback(() => setTeller((t) => t + 1), []);
  return { data, fout, opnieuw, setData };
}

// ─── Melding onderin (toast) ────────────────────────────────────────────────
let zetMelding: ((t: string) => void) | null = null;
export function melding(t: string) { zetMelding?.(t); }
export function Meldingen() {
  const [tekst, setTekst] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    zetMelding = (t) => { setTekst(t); clearTimeout(timer.current); timer.current = setTimeout(() => setTekst(""), 4200); };
    return () => { zetMelding = null; };
  }, []);
  if (!tekst) return null;
  return <div className="sv-toast" role="status">{tekst}</div>;
}

// ─── Opmaak ─────────────────────────────────────────────────────────────────
const MAAND = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const MAAND_LANG = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const WEEKDAG = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
function datum(x: string | Date | null | undefined): Date | null {
  if (!x) return null;
  const s = typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) ? `${x}T12:00:00Z` : x;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function amsterdam(d: Date) {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", year: "numeric", month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value || "";
  return { j: +g("year"), m: +g("month") - 1, d: +g("day"), u: g("hour"), min: g("minute"), w: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday")) };
}
export function kortDatum(x: string | Date | null | undefined) { const d = datum(x); if (!d) return ""; const a = amsterdam(d); return `${a.d} ${MAAND[a.m]}`; }
export function langDatum(x: string | Date | null | undefined) { const d = datum(x); if (!d) return ""; const a = amsterdam(d); return `${a.d} ${MAAND_LANG[a.m]} ${a.j}`; }
export function dagDatum(x: string | Date | null | undefined) { const d = datum(x); if (!d) return ""; const a = amsterdam(d); return `${WEEKDAG[a.w]} ${a.d} ${MAAND_LANG[a.m]}`; }
export function tijdstip(x: string | Date | null | undefined) { const d = datum(x); if (!d) return ""; const a = amsterdam(d); return `${a.u}:${a.min}`; }
export function maandNaam(m: number) { return MAAND_LANG[m]; }

// ─── Kleine onderdelen ──────────────────────────────────────────────────────
export function BrancheChip({ b }: { b: Branche }) {
  const k = BRANCHE[b];
  return <span className="sv-chip" style={{ background: k.vlak, color: k.tekst }}>{k.label}</span>;
}

export type ChipSoort = "ok" | "open" | "let" | "fout" | "waarschuw" | "twijfel";
export function Chip({ soort, children }: { soort: ChipSoort; children: ReactNode }) {
  return <span className={`sv-chip sv-chip-${soort}`}>{children}</span>;
}

export function Knop({ soort = "wit", children, ...p }: { soort?: "wit" | "donker" | "groen" | "geel" | "link"; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...p} className={`sv-knop sv-knop-${soort} ${p.className || ""}`}>{children}</button>;
}

export function Kaartje({ titel, rechts, children, className }: { titel?: ReactNode; rechts?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`sv-kaart ${className || ""}`}>
      {(titel || rechts) && <div className="sv-kaart-kop"><h3>{titel}</h3>{rechts && <div className="sv-kaart-rechts">{rechts}</div>}</div>}
      {children}
    </section>
  );
}

export function Voortgang({ huidig, alles = false }: { huidig: number; alles?: boolean }) {
  return (
    <div className="sv-voortgang">
      {VOORTGANG.map((s, i) => (
        <div key={s} className={`sv-vg ${i < huidig || alles ? "klaar" : i === huidig ? "nu" : ""}`}>
          <span /><b>{s}</b>
        </div>
      ))}
    </div>
  );
}

export function Foto({ src, branche, maat = 84 }: { src?: string | null; branche: Branche; maat?: number }) {
  return (
    <div className="sv-foto" style={{ width: maat, height: maat, background: BRANCHE[branche].foto }}>
      {src ? <img src={src} alt="" /> : (
        <svg viewBox="0 0 84 84" width={maat} height={maat} aria-hidden="true"><circle cx="42" cy="33" r="15" fill="#fff" opacity=".85" /><path d="M14 84c2-17 14-27 28-27s26 10 28 27z" fill="#fff" opacity=".85" /></svg>
      )}
    </div>
  );
}

export function Leeg({ children }: { children: ReactNode }) {
  return <div className="sv-leeg">{children}</div>;
}

export function Dialoog({ titel, children, sluit, breed }: { titel: ReactNode; children: ReactNode; sluit: () => void; breed?: number }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") sluit(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [sluit]);
  return (
    <div className="sv-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) sluit(); }}>
      <div className="sv-dialoog" role="dialog" aria-modal="true" style={{ maxWidth: breed || 640 }}>
        <h2>{titel}</h2>
        {children}
      </div>
    </div>
  );
}

export const CSS = `
.sv{color:#37352C;font-size:14px;line-height:1.45}
.sv *{box-sizing:border-box}
.sv h1{font-size:28px;font-weight:800;letter-spacing:-.01em;margin:0}
.sv h2{font-size:20px;font-weight:800;margin:0 0 10px}
.sv h3{font-size:15px;font-weight:800;margin:0}
.sv p{margin:0}
.sv .sv-sub{color:#6B665C;margin-top:4px}
.sv .sv-grijs{color:#8A8478}
.sv .sv-klein{font-size:12.5px;color:#8A8478}
.sv-rij{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.sv-tussen{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
.sv-knop{height:40px;padding:0 16px;border-radius:10px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;border:1px solid #E1DCD3;background:#fff;color:#37352C;display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.sv-knop:focus-visible,.sv button:focus-visible,.sv input:focus-visible,.sv textarea:focus-visible{outline:2px solid #37352C;outline-offset:2px}
.sv-knop:disabled{background:#F2EFEA;color:#A9A49A;border-color:#E4E0D8;cursor:not-allowed}
.sv-knop-donker{background:#37352C;border-color:#37352C;color:#F8F7F4}
.sv-knop-groen{background:#3E8E5A;border-color:#3E8E5A;color:#fff}
.sv-knop-geel{background:#FFF6D6;border-color:#EAD58A;color:#37352C}
.sv-knop-link{border:0;background:none;padding:0;height:auto;text-decoration:underline;font-weight:600;color:#5C594F}
.sv-chip{display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap}
.sv-chip-ok{background:#E6F0E2;color:#2F6B3E}.sv-chip-open{background:#F4F1EC;color:#5C594F}.sv-chip-let{background:#FCEBD7;color:#9A5414}
.sv-chip-fout{background:#FBE3DE;color:#A2321F}.sv-chip-waarschuw{background:#FFF1E8;color:#9A4A1F}.sv-chip-twijfel{background:#FFF6D6;color:#7A6200}
.sv-kaart{background:#fff;border-radius:18px;padding:20px 22px;box-shadow:0 1px 2px rgba(55,53,44,.06),0 8px 24px -16px rgba(55,53,44,.25)}
.sv-kaart-kop{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:14px}
.sv-kaart-rechts{font-size:12.5px;color:#8A8478}
.sv-voortgang{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:18px}
.sv-vg span{display:block;height:4px;border-radius:2px;background:#E7E2DA}
.sv-vg b{display:block;font-size:12px;font-weight:500;color:#A39E94;margin-top:6px}
.sv-vg.klaar span{background:#4F7A3A}.sv-vg.klaar b{color:#5C594F}
.sv-vg.nu span{background:#37352C}.sv-vg.nu b{color:#37352C;font-weight:800}
.sv-foto{border-radius:50%;overflow:hidden;flex:none;display:flex;align-items:flex-end;justify-content:center}
.sv-foto img{width:100%;height:100%;object-fit:cover}
.sv-leeg{padding:40px 20px;text-align:center;color:#8A8478}
.sv-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#37352C;color:#F8F7F4;padding:12px 18px;border-radius:12px;font-weight:600;z-index:200;box-shadow:0 10px 30px rgba(0,0,0,.2);max-width:calc(100vw - 32px)}
.sv-scrim{position:fixed;inset:0;background:rgba(30,29,25,.45);display:flex;align-items:center;justify-content:center;padding:16px;z-index:150}
.sv-dialoog{background:#fff;border-radius:20px;padding:24px;width:100%;max-height:calc(100vh - 32px);overflow:auto;color:#37352C}
.sv-veld{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
.sv-veld>span{font-size:12px;font-weight:700;color:#6B665C;text-transform:uppercase;letter-spacing:.04em}
.sv input[type=text],.sv input[type=tel],.sv input[type=email],.sv input[type=number],.sv input[type=date],.sv input[type=month],.sv input[type=time],.sv input[type=search],.sv textarea,.sv select{font:inherit;color:#37352C;border:1px solid #DDD8CE;border-radius:10px;padding:9px 12px;background:#fff;width:100%}
.sv textarea{min-height:90px;resize:vertical}
.sv ::placeholder{color:#A9A49A}
.sv-fout{background:#FBE3DE;color:#A2321F;border-radius:10px;padding:10px 12px;margin:10px 0;font-weight:600}
/* lijsten */
.sv-lijst{background:#F8F7F4;padding:28px 40px;min-height:100%}
.sv-segment{display:inline-flex;background:#EDEAE4;border-radius:12px;padding:3px;gap:2px}
.sv-segment button{border:0;background:none;font:inherit;font-weight:700;padding:8px 14px;border-radius:9px;cursor:pointer;color:#5C594F}
.sv-segment button.aan{background:#fff;color:#37352C;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.sv-segment small{color:#8A8478;font-weight:600;margin-left:6px}
.sv-tabel{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E9E5DD}
.sv-tabel th{text-align:left;font-size:12px;color:#8A8478;font-weight:700;padding:12px 14px;border-bottom:1px solid #EEEAE3;white-space:nowrap}
.sv-tabel td{padding:0 14px;height:54px;border-bottom:1px solid #F1EEE8;white-space:nowrap}
.sv-tabel tr.klik{cursor:pointer}.sv-tabel tr.klik:hover td{background:#FAF8F4}
.sv-tabel tr:last-child td{border-bottom:0}
.sv-kpis{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0}
.sv-kpi{background:#fff;border:1px solid #E9E5DD;border-radius:14px;padding:14px 18px;min-width:180px}
.sv-kpi b{display:block;font-size:24px;font-weight:800}.sv-kpi span{color:#6B665C;font-size:13px}
.sv-tabs{display:flex;align-items:center;gap:22px;border-bottom:1px solid #E4E0D8;margin-bottom:14px;flex-wrap:wrap}
.sv-tabs>button.tab{border:0;background:none;font:inherit;font-weight:700;color:#8A8478;padding:10px 0;border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer}
.sv-tabs>button.tab.aan{color:#37352C;border-bottom-color:#37352C}
.sv-extra{height:34px;padding:0 14px;border-radius:10px;border:0;background:#37352C;color:#fff;font:inherit;font-weight:700;cursor:pointer}
.sv-extra small{color:rgba(255,255,255,.7);margin-left:6px;font-weight:700}
.sv-extra.aan{outline:2px solid #37352C;outline-offset:2px}
.sv-stip{display:inline-block;width:20px;height:20px;border-radius:50%;flex:none}
.sv-voet{display:flex;justify-content:space-between;color:#8A8478;margin-top:12px;font-size:13px}
/* week */
.sv-week{background:#fff;border:1px solid #E4E0D8;border-radius:14px;overflow:auto}
.sv-week-kop,.sv-week-lijf{display:grid;min-width:720px}
.sv-week-kop div{padding:12px 10px;font-weight:700;border-bottom:1px solid #EEEAE3}
.sv-week-kop small{color:#8A8478;font-weight:600}
.sv-week-tijd{font-size:12px;color:#8A8478;padding-right:8px;text-align:right}
.sv-week-dag{position:relative;border-left:1px solid #F1EEE8}
.sv-week-uur{height:84px;border-bottom:1px solid #F4F1EC}
.sv-blok{position:absolute;left:6px;right:6px;height:52px;border-radius:10px;padding:7px 10px;cursor:pointer;border:0;text-align:left;font:inherit;color:#37352C;overflow:hidden}
.sv-blok:hover,.sv-blok:focus-visible{outline:2px solid #37352C}
.sv-blok b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:14px}
.sv-blok span{display:block;font-size:11.5px;color:#5C594F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sv-blok i{position:absolute;top:6px;right:8px;color:#3E8E5A;font-style:normal;font-weight:800}
.sv-legenda{display:flex;gap:16px;align-items:center;margin:14px 0;color:#5C594F;font-size:13px;flex-wrap:wrap}
.sv-legenda span{display:inline-flex;align-items:center;gap:6px}
.sv-legenda i{width:14px;height:14px;border-radius:4px;display:inline-block}
/* kaart */
.sv-dossier{background:#F4F2EE;padding:24px 40px;min-height:100%}
.sv-terug{border:0;background:none;font:inherit;font-weight:600;font-size:13px;color:#5C594F;cursor:pointer;padding:0;margin-bottom:14px}
.sv-kop{display:flex;gap:18px;align-items:center}
.sv-kpirij{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
.sv-kpirij .sv-kaart{padding:16px 18px}
.sv-kpirij label{display:block;font-size:11px;font-weight:800;letter-spacing:.06em;color:#8A8478}
.sv-kpirij strong{display:flex;align-items:center;gap:6px;font-size:19px;font-weight:800;margin:6px 0 2px}
.sv-kpirij small{color:#6B665C;font-size:12.5px}
.sv-twee{display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:16px;align-items:start}
.sv-kolom{display:flex;flex-direction:column;gap:16px;min-width:0}
.sv-gegevens{display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:13.5px}
.sv-gegevens dt{color:#8A8478}.sv-gegevens dd{margin:0;font-weight:600}
.sv-lbl{font-size:11px;font-weight:800;letter-spacing:.06em;color:#8A8478;margin:0 0 8px}
.sv-matrix{display:grid;grid-template-columns:34px repeat(4,1fr);gap:6px;align-items:center;font-size:12px;color:#6B665C}
.sv-matrix i{display:block;height:20px;border-radius:5px;background:#F1EEE8}
.sv-matrix i.ja{background:#4F7A3A}.sv-matrix i.nee{background:#C8553D}
.sv-tijdlijn{display:flex;flex-direction:column;gap:10px;font-size:13px}
.sv-tijdlijn div{display:grid;grid-template-columns:56px 1fr;gap:10px}
.sv-besluit{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.sv-schuif{display:grid;grid-template-columns:180px minmax(160px,1fr) 44px;gap:16px;align-items:center;margin-bottom:16px}
.sv-schuif input[type=range]{width:100%;accent-color:#37352C}
.sv-schuif .twee{accent-color:#8A8478;background:linear-gradient(90deg,#D9E6F2,#EEEAE3,#F2E2D3);border-radius:99px;height:8px;-webkit-appearance:none;appearance:none}
.sv-schuif .twee::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid #8A8478}
.sv-schuif .leeg{opacity:.45}
.sv-schuif strong{font-size:18px;font-weight:800;text-align:right}
.sv-schuif .einden{display:flex;justify-content:space-between;font-size:11.5px;color:#8A8478;margin-top:2px}
.sv-wissel{display:inline-flex;gap:8px;flex-wrap:wrap}
.sv-wissel button{height:40px;padding:0 14px;border-radius:10px;border:1px solid #DDD8CE;background:#fff;font:inherit;font-weight:700;cursor:pointer;color:#37352C}
.sv-wissel button.aan{background:#37352C;color:#F8F7F4;border-color:#37352C}
.sv-cijfers{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.sv-cijfers b{display:block;font-size:22px;font-weight:800}
.sv-cijfers span{font-size:11px;font-weight:800;letter-spacing:.05em;color:#8A8478}
.sv-onder{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;align-items:start}
.sv-besluitkaart{margin:16px 0}
.sv-verslag{background:#FAF8F4;border-radius:10px;padding:12px;white-space:pre-wrap}
@media (max-width:1100px){.sv-twee,.sv-onder{grid-template-columns:1fr}.sv-kpirij{grid-template-columns:repeat(2,1fr)}}
@media (max-width:700px){.sv-lijst,.sv-dossier{padding:16px}.sv-schuif{grid-template-columns:1fr}.sv-cijfers{grid-template-columns:repeat(2,1fr)}.sv-tabel{display:block;overflow-x:auto}}
`;
