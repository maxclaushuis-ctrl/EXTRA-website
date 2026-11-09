/**
 * KPI & Rapportage: periode- en labelkeuze en het blok met de cijfers van Job
 * (mock-up Job en KPI, akkoord Max 9 nov 2026). De cijfers komen uit
 * /api/admin/kpi (veld job, berekend in shared/kpiJob.ts).
 */
import type { KpiJobUit } from "@shared/kpiJob";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function maandag(d = new Date()): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

/** De vaste periodes als van/tot (tot leeg = tot nu). */
export function vastePeriodes(): { code: string; label: string; van: string; tot: string }[] {
  const ma = maandag();
  const vorigeMa = new Date(ma); vorigeMa.setDate(ma.getDate() - 7);
  const vorigeZo = new Date(ma); vorigeZo.setDate(ma.getDate() - 1);
  const vier = new Date(); vier.setDate(vier.getDate() - 27);
  return [
    { code: "deze", label: "Deze week", van: iso(ma), tot: "" },
    { code: "vorige", label: "Vorige week", van: iso(vorigeMa), tot: iso(vorigeZo) },
    { code: "vier", label: "Laatste 4 weken", van: iso(vier), tot: "" },
    { code: "alles", label: "Alles", van: "", tot: "" },
  ];
}

const LABELS: { code: string; label: string }[] = [
  { code: "", label: "Alle labels" }, { code: "hotels", label: "Hotels" }, { code: "events", label: "Events" }, { code: "logistiek", label: "Logistiek" },
];

function Pil({ aan, onClick, children }: { aan: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${aan ? "bg-[#37352C] text-white border-[#37352C]" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"}`}
    >
      {children}
    </button>
  );
}

export function KpiPeriode({ van, tot, zet, label, zetLabel }: {
  van: string; tot: string; zet: (van: string, tot: string) => void; label: string; zetLabel: (l: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
      <div className="flex gap-1.5 flex-wrap">
        {vastePeriodes().map((p) => <Pil key={p.code} aan={p.van === van && p.tot === tot} onClick={() => zet(p.van, p.tot)}>{p.label}</Pil>)}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {LABELS.map((l) => <Pil key={l.code || "alle"} aan={label === l.code} onClick={() => zetLabel(l.code)}>{l.label}</Pil>)}
      </div>
    </div>
  );
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

function minuten(m: number | null): string {
  if (m === null) return "Nog onbekend";
  if (m < 60) return `${Math.round(m)} min`;
  return `${(m / 60).toFixed(1).replace(".", ",")} uur`;
}
function uren(u: number | null): string {
  if (u === null) return "Nog onbekend";
  if (u >= 48) return `${(u / 24).toFixed(1).replace(".", ",")} dagen`;
  return `${u.toFixed(1).replace(".", ",")} uur`;
}
function dagen(d: number | null): string {
  if (d === null) return "Nog onbekend";
  return `${d.toFixed(1).replace(".", ",")} ${d === 1 ? "dag" : "dagen"}`;
}

function Tegel({ titel, waarde, sub, toon }: { titel: string; waarde: string | number; sub?: string; toon?: "op" | "neer" | "zacht" }) {
  const kleur = toon === "op" ? "text-[#2F6B3E]" : toon === "neer" ? "text-[#A33B2B]" : "text-gray-500";
  return (
    <div className="bg-white border border-[#ECE8E1] rounded-xl px-4 py-3.5">
      <p className="text-xs text-gray-500">{titel}</p>
      <p className="text-[28px] leading-tight font-bold tracking-tight text-[#2F2D27] my-0.5">{waarde}</p>
      {sub && <p className={`text-xs font-semibold ${kleur}`}>{sub}</p>}
    </div>
  );
}

export function KpiJobBlok({ job }: { job: KpiJobUit | undefined | null }) {
  if (!job) return null;
  const t = job.trechter;

  let vergelijk: { tekst: string; toon: "op" | "neer" | "zacht" } | undefined;
  if (job.vorigePeriode !== null) {
    const wanneer = job.vorigeWekenTerug === 1 ? "vorige week" : `${job.vorigeWekenTerug} weken eerder`;
    if (job.vorigePeriode === 0) vergelijk = { tekst: job.aanmeldingen ? `${wanneer}: 0` : `ook 0 ${wanneer}`, toon: "zacht" };
    else {
      const verschil = Math.round(((job.aanmeldingen - job.vorigePeriode) / job.vorigePeriode) * 100);
      vergelijk = { tekst: `${verschil > 0 ? "+" : ""}${verschil}% t.o.v. ${wanneer}`, toon: verschil > 0 ? "op" : verschil < 0 ? "neer" : "zacht" };
    }
  }

  const stappen: { label: string; n: number; job?: boolean }[] = [
    { label: "Aangemeld", n: t.aangemeld },
    { label: "Gesprek met Job", n: t.jobGestart, job: true },
    { label: "Vragen beantwoord", n: t.vragenAf, job: true },
    { label: "Cv binnen", n: t.cvBinnen, job: true },
    { label: "Cv goedgekeurd", n: t.cvGoedgekeurd, job: true },
    { label: "Kennismaking gepland", n: t.gepland },
    { label: "Verschenen", n: t.verschenen },
    { label: "Aangenomen", n: t.aangenomen },
  ];
  const max = Math.max(t.aangemeld, 1);
  const maxAfhaak = Math.max(...job.afhaak.map((a) => a.aantal), 1);
  const maxWeek = Math.max(...job.weken.map((w) => w.aanmeldingen), 1);

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3.5">
        <Tegel titel="Aanmeldingen" waarde={job.aanmeldingen} sub={vergelijk?.tekst} toon={vergelijk?.toon} />
        <Tegel titel="Kennismaking gepland" waarde={t.gepland} sub={`${pct(t.gepland, t.aangemeld)}% van de aanmeldingen`} toon="zacht" />
        <Tegel titel="Opkomst" waarde={job.opkomst === null ? "Nog onbekend" : `${job.opkomst}%`} sub={`${t.nietVerschenen} niet verschenen`} toon={t.nietVerschenen ? "neer" : "zacht"} />
        <Tegel titel="Aangenomen" waarde={t.aangenomen} sub={`${pct(t.aangenomen, t.aangemeld)}% van de aanmeldingen`} toon="zacht" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3.5 mb-3.5">
        <div className="bg-white border border-[#ECE8E1] rounded-2xl px-5 py-4">
          <h3 className="text-[15px] font-semibold text-[#2F2D27]">Trechter met Job</h3>
          <p className="text-xs text-gray-500 mb-3">Hoeveel mensen elke stap halen. Rechts: hoeveel er bij die stap afvielen.</p>
          <div className="grid gap-1.5">
            {stappen.map((s, i) => {
              const weg = i > 0 ? stappen[i - 1].n - s.n : 0;
              return (
                <div key={s.label} className="grid grid-cols-[150px_1fr_44px_60px] items-center gap-2.5 text-[13.5px]">
                  <span className="text-[#2F2D27]">{s.label}</span>
                  <div className="h-[22px] bg-[#F1EEE8] rounded-md overflow-hidden">
                    <div className="h-full rounded-md" style={{ width: `${pct(s.n, max)}%`, background: s.job ? "#6E5BA8" : "#37352C" }} />
                  </div>
                  <b className="text-right">{s.n}</b>
                  <span className="text-right text-xs text-[#A33B2B]">{weg > 0 ? `${weg} weg` : ""}</span>
                </div>
              );
            })}
          </div>
          <details className="mt-3 text-xs text-gray-500">
            <summary className="cursor-pointer font-semibold">Hoe tellen we?</summary>
            <ul className="mt-2 space-y-1 list-disc pl-4">
              <li>Wie een latere stap haalde, telt ook bij de stappen ervoor. Zo loopt de trechter altijd af.</li>
              <li>Vragen beantwoord: Job heeft alles gevraagd (wacht op cv, cv-controle, plannen of gepland).</li>
              <li>Cv goedgekeurd: het gesprek staat op plannen of gepland, of er staat al een kennismaking.</li>
              <li>Verschenen: de intake is gestart of de sollicitant is verder in het proces.</li>
              <li>Niet verschenen: op de kaart gemarkeerd als Niet verschenen. Opkomst klopt dus alleen als dat wordt bijgehouden.</li>
              <li>De periode gaat over de aanmelddatum: wie zich deze week aanmeldde en later komt, telt mee bij deze week.</li>
            </ul>
          </details>
        </div>

        <div className="grid gap-3.5 content-start">
          <div className="bg-white border border-[#ECE8E1] rounded-2xl px-5 py-4">
            <h3 className="text-[15px] font-semibold text-[#2F2D27]">Waar haken ze af in het gesprek?</h3>
            <p className="text-xs text-gray-500 mb-3">Laatste vraag waarop geen antwoord meer kwam.</p>
            {job.afhaak.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Niemand afgehaakt in deze periode.</p>
            ) : (
              <div className="grid gap-2">
                {job.afhaak.map((a) => (
                  <div key={a.onderwerp} className="grid grid-cols-[130px_1fr_30px] items-center gap-2.5 text-[13.5px]">
                    <span>{a.label}</span>
                    <div className="h-3.5 bg-[#F1EEE8] rounded overflow-hidden"><div className="h-full bg-[#D98C5F] rounded" style={{ width: `${pct(a.aantal, maxAfhaak)}%` }} /></div>
                    <b className="text-right">{a.aantal}</b>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white border border-[#ECE8E1] rounded-2xl px-5 py-4">
            <h3 className="text-[15px] font-semibold text-[#2F2D27]">Hoe snel gaat het?</h3>
            <p className="text-xs text-gray-500 mb-3">Mediaan, vanaf de aanmelding.</p>
            <div className="grid grid-cols-3 gap-2.5">
              {[["Eerste antwoord", minuten(job.snelheid.eersteAntwoordMinuten)], ["Cv binnen", uren(job.snelheid.cvUren)], ["Kennismaking", dagen(job.snelheid.kennismakingDagen)]].map(([l, w]) => (
                <div key={l} className="bg-[#F7F5F0] rounded-xl p-3"><span className="block text-xs text-gray-500">{l}</span>{w === "Nog onbekend" ? <span className="block text-sm font-semibold text-gray-400 mt-1">Nog geen gegevens</span> : <b className="text-lg">{w}</b>}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#ECE8E1] rounded-2xl px-5 py-4">
        <h3 className="text-[15px] font-semibold text-[#2F2D27]">Per week</h3>
        <p className="text-xs text-gray-500 mb-3">Laatste {job.weken.length} weken, op aanmelddatum. Het label telt mee, de gekozen periode niet.</p>
        <div className="flex items-end gap-3.5 h-[150px] px-1 border-b border-[#ECE8E1]">
          {job.weken.map((w) => (
            <div key={w.van} className="flex-1 flex items-end gap-[3px] h-full" title={`${w.label}: ${w.aanmeldingen} aanmeldingen, ${w.gepland} gepland, ${w.verschenen} verschenen`}>
              <i className="flex-1 block rounded-t bg-[#C9C3B8]" style={{ height: `${pct(w.aanmeldingen, maxWeek)}%` }} />
              <i className="flex-1 block rounded-t bg-[#6E5BA8]" style={{ height: `${pct(w.gepland, maxWeek)}%` }} />
              <i className="flex-1 block rounded-t bg-[#2F6B3E]" style={{ height: `${pct(w.verschenen, maxWeek)}%` }} />
            </div>
          ))}
        </div>
        <div className="flex gap-3.5 px-1 pt-1.5">{job.weken.map((w) => <span key={w.van} className="flex-1 text-center text-[11.5px] text-gray-500">{w.label}</span>)}</div>
        <div className="flex gap-3.5 text-xs text-gray-500 mt-2.5">
          <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-[-1px] bg-[#C9C3B8]" />Aanmeldingen</span>
          <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-[-1px] bg-[#6E5BA8]" />Gepland</span>
          <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-[-1px] bg-[#2F6B3E]" />Verschenen</span>
        </div>
      </div>
    </div>
  );
}

/** Extra regels voor de CSV-export. */
export function csvRegelsJob(job: KpiJobUit | undefined | null): (string | number)[][] {
  if (!job) return [];
  const t = job.trechter;
  return [
    [],
    ["Job", "Aantal"],
    ["Aangemeld", t.aangemeld], ["Gesprek met Job", t.jobGestart], ["Vragen beantwoord", t.vragenAf], ["Cv binnen", t.cvBinnen],
    ["Cv goedgekeurd", t.cvGoedgekeurd], ["Kennismaking gepland", t.gepland], ["Verschenen", t.verschenen], ["Niet verschenen", t.nietVerschenen],
    ["Aangenomen", t.aangenomen], ["Opkomst (%)", job.opkomst ?? "onbekend"],
    ["Mediaan eerste antwoord (min)", job.snelheid.eersteAntwoordMinuten ?? "onbekend"],
    ["Mediaan cv binnen (uur)", job.snelheid.cvUren ?? "onbekend"],
    ["Mediaan kennismaking (dagen)", job.snelheid.kennismakingDagen ?? "onbekend"],
    [],
    ["Afgehaakt bij", "Aantal"],
    ...job.afhaak.map((a) => [a.label, a.aantal]),
    [],
    ["Week", "Aanmeldingen", "Gepland", "Verschenen"],
    ...job.weken.map((w) => [w.label, w.aanmeldingen, w.gepland, w.verschenen]),
  ];
}
