/**
 * Het webgesprek met Job, de AI-recruiter (/job-gesprek?token=...).
 *
 * Voor kandidaten die niet via WhatsApp met Job praten, en voor de links in
 * de mails en WhatsApp-berichten van Job (cv uploaden, een moment kiezen,
 * verzetten, afmelden). In de testomgeving is dit ook de simulator: een
 * planner opent het gesprek van een testkandidaat en speelt de kandidaat.
 *
 * Bron: de borden C (gesprek), C3 (Engels) en D (inplannen) op het canvas.
 * Werkt alleen met een persoonlijke link; zonder geldige sleutel volgt uitleg.
 *
 * Parameters in de link:
 *   cv=1       de uploadknop direct in beeld
 *   plannen=1  de momentenkiezer direct open
 *   stop=1     afmelden: geen herinneringen meer
 */
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Shell from "@/design3/Shell";

interface Bericht { id?: number; richting: "in" | "uit"; tekst: string; keuzes?: string[] | null; extra?: string | null }
interface Afspraak { datum: string; tijd: string; interviewer: string; dagTekst: string }
interface Gesprek { voornaam: string; taal: "nl" | "en"; status: string; kanaal: string; heeftCv: boolean; berichten: Bericht[]; afspraak: Afspraak | null }
interface Moment { datum: string; tijd: string; dagTekst: string }

type Staat = "laden" | "klaar" | "geenlink" | "storing";

const T = {
  nl: {
    ai: "AI-recruiter",
    uitleg: "Je praat met Job, een AI. Typ MENS voor een collega of ENGLISH om te wisselen.",
    typ: "Typ je antwoord",
    stuur: "Stuur",
    cvKies: "Upload je cv",
    cvAnder: "pdf, Word of foto, max. 10 MB",
    cvBezig: "Je cv wordt verstuurd",
    planKop: "Kies een moment",
    planUitleg: "Herengracht 372, Amsterdam. Je ziet alleen momenten waarop een collega vrij is.",
    bevestig: (d: string, t: string) => `Bevestig ${d.toLowerCase()}, ${t}`,
    geenMomenten: "Er zijn op dit moment geen vrije momenten. Stuur Job een bericht, dan kijkt een collega mee.",
    afspraakKop: "Afspraak bevestigd",
    wanneer: "Wanneer", waar: "Waar", meenemen: "Meenemen", metWie: "Met wie",
    paspoort: "Paspoort of ID-kaart",
    agenda: "Zet in agenda", verzetten: "Verzetten",
    geenlink: "Deze link werkt niet (meer)",
    geenlinkUitleg: "Je bereikt Job via de persoonlijke link uit je mail of WhatsApp-bericht. Nog niet aangemeld?",
    aanmelden: "Meld je aan",
    storing: "Er ging iets mis bij het laden. Probeer het over een minuut opnieuw.",
    opnieuw: "Opnieuw proberen",
    bel: "Liever bellen? 085 130 59 15",
    gestopt: "Je bent afgemeld. Je krijgt geen herinneringen meer van Job.",
    planner: "Een collega van EXTRA bekijkt je aanmelding.",
    fout: "Dat lukte niet. Probeer het opnieuw.",
  },
  en: {
    ai: "AI recruiter",
    uitleg: "You're chatting with Job, an AI. Type HUMAN for a colleague or NEDERLANDS to switch.",
    typ: "Type your answer",
    stuur: "Send",
    cvKies: "Upload your CV",
    cvAnder: "PDF, Word or photo, max. 10 MB",
    cvBezig: "Your CV is being sent",
    planKop: "Choose a moment",
    planUitleg: "Herengracht 372, Amsterdam. You only see moments when a colleague is free.",
    bevestig: (d: string, t: string) => `Confirm ${d}, ${t}`,
    geenMomenten: "There are no free moments right now. Send Job a message and a colleague will help.",
    afspraakKop: "Appointment confirmed",
    wanneer: "When", waar: "Where", meenemen: "Bring", metWie: "With",
    paspoort: "Passport or ID card",
    agenda: "Add to calendar", verzetten: "Reschedule",
    geenlink: "This link no longer works",
    geenlinkUitleg: "You can reach Job via the personal link in your email or WhatsApp message. Not signed up yet?",
    aanmelden: "Sign up",
    storing: "Something went wrong while loading. Please try again in a minute.",
    opnieuw: "Try again",
    bel: "Rather call? +31 85 130 59 15",
    gestopt: "You've unsubscribed. You won't get any more reminders from Job.",
    planner: "A colleague from EXTRA is looking at your application.",
    fout: "That didn't work. Please try again.",
  },
};

/* De site zet met .d3.d3 * alle marges en padding op nul; daarom staat .d3.d3 voor elke regel. */
const CSS = `
.d3.d3 .jg{max-width:760px;margin:0 auto;padding:132px 16px 64px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#37352C}
.d3.d3 .jg{box-shadow:0 0 0 100vmax #37352C;clip-path:inset(0 -100vmax);background:#37352C}
.d3.d3 .jg-zacht{color:rgba(248,247,244,.78)}
.d3.d3 .jg-zacht a{color:#F8F7F4}
.d3.d3 .jg-kaart{background:#fff;border-radius:22px;box-shadow:0 1px 2px rgba(55,53,44,.06),0 18px 40px -28px rgba(55,53,44,.45);overflow:hidden;display:flex;flex-direction:column;min-height:560px}
.d3.d3 .jg-kop{display:flex;align-items:center;gap:12px;padding:14px 18px;background:#37352C;color:#F8F7F4}
.d3.d3 .jg-av{width:40px;height:40px;border-radius:50%;background:#EBD0E4;color:#37352C;display:grid;place-items:center;font-weight:800;font-size:17px;flex:none}
.d3.d3 .jg-kop b{display:block;font-size:15px}
.d3.d3 .jg-kop span{font-size:12.5px;color:rgba(248,247,244,.7)}
.d3.d3 .jg-uitleg{align-self:flex-start;margin:12px 18px 0;padding:4px 12px;background:#FFF3C4;font-size:12px;font-weight:600;color:#5C4A00;border-radius:99px}
.d3.d3 .jg-lijst{flex:1;padding:18px;display:flex;flex-direction:column;gap:8px;background:#FBFAF8;overflow-y:auto;max-height:62vh}
.d3.d3 .jg-b{max-width:84%;padding:10px 13px;font-size:14.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
.d3.d3 .jg-b.uit{align-self:flex-start;background:#fff;border:1px solid #ECE7DF;border-radius:4px 16px 16px 16px}
.d3.d3 .jg-b.in{align-self:flex-end;background:#E3F0E5;color:#1F3B26;border-radius:16px 4px 16px 16px}
.d3.d3 .jg-keuzes{display:flex;flex-wrap:wrap;gap:8px;align-self:flex-start;max-width:90%}
.d3.d3 .jg-chip{height:36px;padding:0 14px;border-radius:99px;border:1px solid #37352C;background:#fff;color:#37352C;font:600 13.5px inherit;cursor:pointer}
.d3.d3 .jg-chip:hover{background:#37352C;color:#F8F7F4}
.d3.d3 .jg-chip:focus-visible,.d3.d3 .jg-knop:focus-visible,.d3.d3 .jg-tijd:focus-visible,.d3.d3 .jg-dag:focus-visible,.d3.d3 .jg-invoer input:focus-visible{outline:2px solid #3E8E5A;outline-offset:2px}
.d3.d3 .jg-blok{align-self:stretch;background:#fff;border:1px solid #ECE7DF;border-radius:16px;padding:16px}
.d3.d3 .jg-blok h3{margin:0 0 4px;font-size:16px;font-weight:800}
.d3.d3 .jg-blok p{margin:0 0 12px;font-size:13px;color:#6B665C}
.d3.d3 .jg-knop{height:44px;padding:0 18px;border-radius:12px;border:1px solid #37352C;background:#37352C;color:#F8F7F4;font:700 14px inherit;cursor:pointer;display:inline-flex;align-items:center;gap:8px;text-decoration:none}
.d3.d3 .jg-knop.rand{background:#fff;color:#37352C;border-color:#DDD8CE}
.d3.d3 .jg-knop:disabled{opacity:.5;cursor:default}
.d3.d3 .jg-dagen{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:12px}
.d3.d3 .jg-dag{flex:none;min-width:74px;padding:8px 10px;border-radius:12px;border:1px solid #DDD8CE;background:#fff;font:600 13px inherit;color:#37352C;cursor:pointer;text-align:center}
.d3.d3 .jg-dag[aria-pressed=true]{background:#37352C;color:#F8F7F4;border-color:#37352C}
.d3.d3 .jg-tijden{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px;margin-bottom:14px}
.d3.d3 .jg-tijd{height:40px;border-radius:10px;border:1px solid #DDD8CE;background:#fff;font:600 14px inherit;color:#37352C;cursor:pointer}
.d3.d3 .jg-tijd[aria-pressed=true]{background:#3E8E5A;color:#fff;border-color:#3E8E5A}
.d3.d3 .jg-rij{display:grid;grid-template-columns:110px 1fr;gap:10px;padding:7px 0;font-size:14px;border-top:1px solid #F3F0EB}
.d3.d3 .jg-rij:first-of-type{border-top:0}
.d3.d3 .jg-rij span:first-child{color:#8A8478}
.d3.d3 .jg-acties{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.d3.d3 .jg-invoer{display:flex;gap:8px;padding:12px;border-top:1px solid #ECE7DF;background:#fff}
.d3.d3 .jg-invoer input{flex:1;min-width:0;height:46px;border:1px solid #DDD8CE;border-radius:12px;padding:0 14px;font:15px inherit;color:#37352C}
.d3.d3 .jg-fout{margin:0;padding:8px 18px;background:#FBE3DE;color:#A2321F;font-size:13px}
.d3.d3 .jg-zacht{font-size:13px;color:#8A8478;text-align:center;margin:14px 0 0}
.d3.d3 .jg-typt{align-self:flex-start;color:#8A8478;font-size:13px;padding:4px 2px}
.d3.d3 .jg-melding{padding:40px 24px;text-align:center}
.d3.d3 .jg-melding h1{font-size:24px;margin:0 0 8px}
@media (max-width:640px){.d3.d3 .jg{padding-top:96px}}
@media (prefers-reduced-motion:no-preference){.d3.d3 .jg-b{animation:jgIn .18s ease-out}@keyframes jgIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}}
`;

async function json<R>(url: string, init?: RequestInit): Promise<R> {
  const r = await fetch(url, init);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e: any = new Error(data?.message || `HTTP ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return data as R;
}

/** Downloadlink van het agenda-bestand (een API-adres, geen paginaroute). */
const agendaLink = (token: string) => "/api/job/" + encodeURIComponent(token) + "/agenda.ics";

export default function JobGesprek() {
  const params = useMemo(() => new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""), []);
  const token = params.get("token") || "";
  const [staat, setStaat] = useState<Staat>("laden");
  const [g, setG] = useState<Gesprek | null>(null);
  const [tekst, setTekst] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [momenten, setMomenten] = useState<Moment[] | null>(null);
  const [dag, setDag] = useState<string>("");
  const [tijd, setTijd] = useState<string>("");
  const [planOpen, setPlanOpen] = useState(params.get("plannen") === "1");
  const [melding, setMelding] = useState("");
  const lijst = useRef<HTMLDivElement>(null);
  const bestand = useRef<HTMLInputElement>(null);
  const t = T[g?.taal || "nl"];

  async function laad() {
    if (!token) { setStaat("geenlink"); return; }
    try {
      const data = await json<Gesprek>(`/api/job/${encodeURIComponent(token)}`);
      setG(data);
      setStaat("klaar");
    } catch (e: any) {
      setStaat(e?.status === 404 ? "geenlink" : "storing");
    }
  }

  useEffect(() => {
    void laad();
    if (token && params.get("stop") === "1") {
      json<{ message: string }>(`/api/job/${encodeURIComponent(token)}/stop`, { method: "POST" })
        .then(() => setMelding("stop")).catch(() => {});
    }
  }, []);

  useEffect(() => {
    lijst.current?.scrollTo({ top: lijst.current.scrollHeight, behavior: "smooth" });
  }, [g?.berichten.length, momenten, planOpen, bezig]);

  const toonPlanning = !!g && (g.status === "plannen" || (g.status === "gepland" && planOpen));
  useEffect(() => {
    if (!toonPlanning || momenten) return;
    json<{ momenten: Moment[] }>(`/api/job/${encodeURIComponent(token)}/momenten`).then((d) => {
      setMomenten(d.momenten);
      if (d.momenten[0]) setDag(d.momenten[0].datum);
    }).catch(() => setMomenten([]));
  }, [toonPlanning]);

  function voegToe(nieuw: Bericht[], status?: string) {
    setG((oud) => (oud ? { ...oud, status: status || oud.status, berichten: [...oud.berichten, ...nieuw] } : oud));
  }

  async function stuur(inhoud: string) {
    const s = inhoud.trim();
    if (!s || bezig) return;
    setFout("");
    setTekst("");
    voegToe([{ richting: "in", tekst: s }]);
    setBezig(true);
    try {
      const r = await json<{ status: string; berichten: Bericht[] }>(`/api/job/${encodeURIComponent(token)}/bericht`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tekst: s }),
      });
      voegToe(r.berichten.map((b) => ({ ...b, richting: "uit" as const })), r.status);
      if (r.berichten.some((b) => b.extra === "planning")) { setPlanOpen(true); setMomenten(null); }
      await laad();
    } catch (e: any) {
      setFout(e?.message || t.fout);
    } finally {
      setBezig(false);
    }
  }

  async function uploadCv(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setFout(g?.taal === "en" ? "This file is larger than 10 MB." : "Dit bestand is groter dan 10 MB."); return; }
    setFout("");
    voegToe([{ richting: "in", tekst: `${g?.taal === "en" ? "File" : "Bestand"}: ${f.name}` }]);
    setBezig(true);
    try {
      const fd = new FormData();
      fd.append("cv", f);
      const r = await json<{ status: string; berichten: Bericht[] }>(`/api/job/${encodeURIComponent(token)}/cv`, { method: "POST", body: fd });
      voegToe((r.berichten || []).map((b) => ({ ...b, richting: "uit" as const })), r.status);
      await laad();
    } catch (err: any) {
      setFout(err?.message || t.fout);
    } finally {
      setBezig(false);
    }
  }

  async function boek() {
    if (!dag || !tijd) return;
    setBezig(true);
    setFout("");
    try {
      await json(`/api/job/${encodeURIComponent(token)}/boek`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ datum: dag, tijd }),
      });
      setPlanOpen(false);
      setMomenten(null);
      setTijd("");
      await laad();
    } catch (e: any) {
      setFout(e?.message || t.fout);
      setMomenten(null);
      setTijd("");
    } finally {
      setBezig(false);
    }
  }

  const dagen = useMemo(() => {
    const m = new Map<string, string>();
    for (const x of momenten || []) if (!m.has(x.datum)) m.set(x.datum, x.dagTekst);
    return Array.from(m.entries());
  }, [momenten]);

  if (staat !== "klaar" || !g) {
    return (
      <Shell css={["werk", "pagina"]} werkzoekende telKnop>
        <style>{CSS}</style>
        <section className="jg">
          <div className="jg-kaart">
            <div className="jg-melding" role="status">
              {staat === "laden" && <p>Laden…</p>}
              {staat === "geenlink" && (<>
                <h1>{T.nl.geenlink}</h1>
                <p>{T.nl.geenlinkUitleg}</p>
                <p><a className="jg-knop" href="/aanmelden">{T.nl.aanmelden}</a></p>
              </>)}
              {staat === "storing" && (<>
                <h1>{T.nl.storing}</h1>
                <p><button className="jg-knop" type="button" onClick={() => { setStaat("laden"); void laad(); }}>{T.nl.opnieuw}</button></p>
              </>)}
            </div>
          </div>
        </section>
      </Shell>
    );
  }

  const laatsteUit = [...g.berichten].reverse().find((b) => b.richting === "uit");
  const laatste = g.berichten[g.berichten.length - 1];
  const keuzes = laatste && laatste.richting === "uit" && laatste.keuzes?.length ? laatste.keuzes : null;
  const cvGevraagd = !g.heeftCv && (g.status === "wacht_cv" || params.get("cv") === "1" || laatsteUit?.extra === "cv_upload");
  const tijdenVanDag = (momenten || []).filter((m) => m.datum === dag);
  const gekozen = (momenten || []).find((m) => m.datum === dag && m.tijd === tijd);

  return (
    <Shell css={["werk", "pagina"]} werkzoekende telKnop>
      <style>{CSS}</style>
      <section className="jg">
        <div className="jg-kaart">
          <div className="jg-kop">
            <span className="jg-av" aria-hidden="true">J</span>
            <div><b>Job · EXTRA</b><span>{t.ai}</span></div>
          </div>
          <p className="jg-uitleg">{t.uitleg}</p>
          {melding === "stop" && <p className="jg-uitleg" role="status">{t.gestopt}</p>}

          <div className="jg-lijst" ref={lijst} aria-live="polite">
            {g.berichten.map((b, i) => (
              <div key={b.id ?? `n${i}`} className={`jg-b ${b.richting}`}>{b.tekst}</div>
            ))}
            {bezig && <div className="jg-typt">Job…</div>}

            {keuzes && !bezig && g.status !== "gepland" && (
              <div className="jg-keuzes">
                {keuzes.map((k) => <button key={k} type="button" className="jg-chip" onClick={() => void stuur(k)}>{k}</button>)}
              </div>
            )}

            {cvGevraagd && !bezig && (
              <div className="jg-blok">
                <input ref={bestand} type="file" accept=".pdf,.doc,.docx,image/jpeg,image/png" onChange={uploadCv} hidden />
                <button type="button" className="jg-knop" onClick={() => bestand.current?.click()}>{t.cvKies}</button>
                <p style={{ margin: "8px 0 0" }}>{t.cvAnder}</p>
              </div>
            )}

            {g.afspraak && !planOpen && (
              <div className="jg-blok">
                <h3>{t.afspraakKop}</h3>
                <div className="jg-rij"><span>{t.wanneer}</span><span>{g.afspraak.dagTekst}, {g.afspraak.tijd}</span></div>
                <div className="jg-rij"><span>{t.waar}</span><span>Herengracht 372, Amsterdam</span></div>
                <div className="jg-rij"><span>{t.meenemen}</span><span>{t.paspoort}</span></div>
                <div className="jg-rij"><span>{t.metWie}</span><span>{g.afspraak.interviewer}</span></div>
                <div className="jg-acties">
                  <a className="jg-knop" href={agendaLink(token)}>{t.agenda}</a>
                  <button type="button" className="jg-knop rand" onClick={() => void stuur(g.taal === "en" ? "reschedule" : "verzetten")}>{t.verzetten}</button>
                </div>
              </div>
            )}

            {toonPlanning && (
              <div className="jg-blok">
                <h3>{t.planKop}</h3>
                <p>{t.planUitleg}</p>
                {momenten === null && <p>…</p>}
                {momenten && momenten.length === 0 && <p>{t.geenMomenten}</p>}
                {momenten && momenten.length > 0 && (<>
                  <div className="jg-dagen" role="group" aria-label={t.planKop}>
                    {dagen.map(([d, label]) => (
                      <button key={d} type="button" className="jg-dag" aria-pressed={d === dag} onClick={() => { setDag(d); setTijd(""); }}>
                        {label.split(" ").slice(0, 2).join(" ")}
                      </button>
                    ))}
                  </div>
                  <div className="jg-tijden">
                    {tijdenVanDag.map((m) => (
                      <button key={m.tijd} type="button" className="jg-tijd" aria-pressed={m.tijd === tijd} onClick={() => setTijd(m.tijd)}>{m.tijd}</button>
                    ))}
                  </div>
                  <button type="button" className="jg-knop" disabled={!gekozen || bezig} onClick={() => void boek()}>
                    {gekozen ? t.bevestig(gekozen.dagTekst, gekozen.tijd) : t.planKop}
                  </button>
                </>)}
              </div>
            )}
          </div>

          {fout && <p className="jg-fout" role="alert">{fout}</p>}
          <form className="jg-invoer" onSubmit={(e: FormEvent) => { e.preventDefault(); void stuur(tekst); }}>
            <label htmlFor="jg-tekst" style={{ position: "absolute", left: -9999 }}>{t.typ}</label>
            <input id="jg-tekst" value={tekst} onChange={(e) => setTekst(e.target.value)} placeholder={t.typ} autoComplete="off" maxLength={2000} />
            <button type="submit" className="jg-knop" disabled={!tekst.trim() || bezig}>{t.stuur}</button>
          </form>
        </div>
        <p className="jg-zacht">{t.bel}</p>
      </section>
    </Shell>
  );
}
