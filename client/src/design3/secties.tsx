/**
 * De sjablonen van design 3.0: één component per sectietype. Een pagina is een
 * lijst secties (zie content/*.ts); <Secties> rendert ze in volgorde.
 *
 * De markup is gelijk aan die van de mock-up, zodat de gedeelde CSS (d3.css)
 * en het gedrag (gedrag.ts) overal hetzelfde werken.
 */
import { Fragment, useId, useRef, type CSSProperties } from "react";
import { Ic, Pijl, T, Woorden, initialen, type IcoonNaam } from "./basis";
import { useCarrousel, useReus, useSpoor, useStapelTop } from "./gedrag";
import SnelAanvraag, { type Branche } from "./SnelAanvraag";
import type { Sector } from "./Shell";
import { useLiveReviews } from "@/hooks/useLiveReviews";

// ───────────── types ─────────────
export interface Knop { tekst: string; href: string | null }
export interface HeroKnop { tekst: string; href: string; vol: boolean; tel: boolean }

export type Sectie =
  | { type: "hero"; werk: boolean; foto: string; pos: string | null; chip: string; h1: string[]; reageer: string; knoppen: HeroKnop[]; lockup: [string, string] | null; lead: string; vink: [string, string][]; vink4: boolean }
  | { type: "kruimel"; pad: [string, string | null][] }
  | { type: "aanvraag"; functies: string[] }
  | { type: "hierwerk"; eyebrow: string; h2: string; p: string; logos: { src: string; alt: string; h: number; vol: boolean }[] }
  | { type: "functies"; eyebrow: string; h2: string; lead: string; label: string; slides: { img: string; h3: string; href: string | null; p: string; tags: string[]; knop: Knop | null }[] }
  | { type: "waarom"; eyebrow: string; h2: string; lead: string; punten: { ic: string; h3: string; p: string }[]; check: string | null; paddingTop: string | null }
  | { type: "reviews"; eyebrow: string; h2: string; items: { quote: string; naam: string; rol: string }[] }
  | { type: "poule"; eyebrow: string; h2: string; lead: string; items: { h3: string; sub: string; meta: string[]; b: string; small: string }[]; knop: Knop | null }
  | { type: "scores"; eyebrow: string; h2: string; lead: string; lijst: string[]; kaarten: ScoreKaart[]; noot: string }
  | { type: "screening"; eyebrow: string; h2: string; lead: string; kaart: { avatar: string; b: string; span: string; tags: string[] } }
  | { type: "hoe"; werk: boolean; id: string | null; eyebrow: string; h2: string; lead: string; stappen: { h3: string; p: string }[]; knop: Knop | null; standaard: string | null }
  | { type: "data"; eyebrow: string; h2: string; lead: string; lijst: string[]; schermen: { src: string; alt: string }[] }
  | { type: "loon"; eyebrow: string; h2: string[]; lead: string; voordelen: string[]; knop: Knop | null }
  | { type: "vorm" }
  | { type: "faq"; eyebrow: string; h2: string; items: [string, string][] }
  | { type: "slot"; foto: string; pos: string | null; tag: string; regels: string[]; kop: string; sub: string; functies: string[]; gekozen: string | null; laag: boolean; id: string | null }
  | { type: "stapel2" | "stapel"; secties: Sectie[] };

export interface ScoreKaart { nr: string; h3: string; sub: string; status: string; p: string | null; score: string; bars: [string, string][]; cijfers: [string, string][]; fav: string[] }

export interface PaginaContent { sector: Sector; secties: Sectie[] }

interface Ctx { sector: Sector; branche: Branche }

const BRANCHE: Record<string, Branche> = { horeca: "hotel", events: "event", logistiek: "logistiek", algemeen: "anders" };

export function Secties({ content }: { content: PaginaContent }) {
  const sector = content.sector as Sector;
  const ctx: Ctx = { sector, branche: BRANCHE[sector] ?? "anders" };
  return <>{content.secties.map((s, i) => <SectieView key={i} s={s} ctx={ctx} />)}</>;
}

function SectieView({ s, ctx }: { s: Sectie; ctx: Ctx }) {
  switch (s.type) {
    case "hero": return <Hero s={s} />;
    case "kruimel": return <Kruimel s={s} />;
    case "aanvraag": return <Aanvraag s={s} ctx={ctx} />;
    case "hierwerk": return <Hierwerk s={s} />;
    case "functies": return <Functies s={s} />;
    case "waarom": return <Waarom s={s} />;
    case "reviews": return <Reviews s={s} />;
    case "poule": return <Poule s={s} />;
    case "scores": return <Scores s={s} />;
    case "screening": return <Screening s={s} />;
    case "hoe": return <Hoe s={s} />;
    case "data": return <Data s={s} />;
    case "loon": return <Loon s={s} />;
    case "vorm": return <Vorm />;
    case "faq": return <Faq s={s} />;
    case "slot": return <Slot s={s} ctx={ctx} />;
    case "stapel2":
    case "stapel": return <Stapel s={s} ctx={ctx} />;
  }
}

type S<K extends Sectie["type"]> = Extract<Sectie, { type: K }>;
const st = (o: Record<string, string | null | undefined>): CSSProperties => {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) if (v) r[k] = v;
  return r as CSSProperties;
};

// ───────────── secties ─────────────
function Hero({ s }: { s: S<"hero"> }) {
  const id = useId().replace(/:/g, "");
  const r = useLiveReviews();
  // {reviews} in de content wordt de actuele Google-score, nooit een ingetypt aantal.
  const chip = s.chip.replace("{reviews}", `${r.scoreTekst} uit ${r.aantalTekst}`);
  return (
    <section className={`hero hhot${s.werk ? " hwerk" : ""}`}>
      <div className="boven">
        <div className="foto"><img src={s.foto} alt="" style={st({ objectPosition: s.pos })} {...({ fetchpriority: "high" } as any)} /></div>
        <div className="titel"><div className="w">
          {chip && <span className="chip"><i></i>{chip}</span>}
          <h1 className="mega hh1">{s.h1.map((r, i) => <Fragment key={i}>{i > 0 && " "}<span className="hr"><T t={r} /></span></Fragment>)}</h1>
          {s.reageer && <p className="reageer">{s.reageer}</p>}
          <div className="knoppen op-foto hhot-knoppen">
            {s.knoppen.map((k, i) => k.tel
              ? <a key={i} className="knop lijn" href={k.href}><Ic n="tel" />{k.tekst}</a>
              : <a key={i} className={`knop ${k.vol ? "vol" : "lijn"}`} href={k.href}>{k.tekst} <Pijl /></a>)}
          </div>
        </div></div>
        {s.lockup && (
          <div className="cirkel">
            <svg className="ring" viewBox="0 0 200 200" aria-hidden="true">
              <defs><path id={`ring${id}`} d="M100,100 m-84,0 a84,84 0 1,1 168,0 a84,84 0 1,1 -168,0" /></defs>
              <text><textPath href={`#ring${id}`} textLength="520">HET UITZENDBUREAU DAT WERKT · HET UITZENDBUREAU DAT WERKT · </textPath></text>
            </svg>
            <div className="lockup"><b>{s.lockup[0]}</b><small>{s.lockup[1]}</small></div>
          </div>
        )}
      </div>
      <div className="onder"><div className="w">
        <div><p className="lead"><T t={s.lead} /></p></div>
        {s.vink.length > 0 && (
          <ul className={`hhot-vink${s.vink4 ? " vink4" : ""}`}>
            {s.vink.map(([b, sp], i) => <li key={i}><b>{b}</b><span>{sp}</span></li>)}
          </ul>
        )}
      </div></div>
    </section>
  );
}

function Kruimel({ s }: { s: S<"kruimel"> }) {
  return (
    <nav className="kruimel hk-kruimel" aria-label="Kruimelpad"><div className="w">
      {s.pad.map(([t, h], i) => h
        ? <Fragment key={i}><a href={h}>{t}</a><span>/</span></Fragment>
        : <span key={i} aria-current="page">{t}</span>)}
    </div></nav>
  );
}

function Aanvraag({ s, ctx }: { s: S<"aanvraag">; ctx: Ctx }) {
  return (
    <section className="aanvraag" id="aanvragen"><div className="w">
      <div className="av-kop"><span className="eyebrow">Snel aanvragen</span><h2>Vraag in één minuut <span className="serif">aan</span></h2><p>Vul je gegevens in, dan bellen we je terug om je aanvraag door te nemen.</p></div>
      <SnelAanvraag vorm="rij" functies={s.functies} branche={ctx.branche} />
    </div></section>
  );
}

function Hierwerk({ s }: { s: S<"hierwerk"> }) {
  const rij = (alt: boolean) => s.logos.map((l, i) => (
    <li key={i} className={l.vol ? "hw-vol" : undefined}><img src={l.src} alt={alt ? l.alt : ""} style={{ height: `${l.h}px` }} loading="lazy" /></li>
  ));
  return (
    <section className="hierwerk"><div className="w">
      <div className="hw-kop"><div><span className="eyebrow">{s.eyebrow}</span><h2 className="groot hw-h2"><T t={s.h2} /></h2></div><p><T t={s.p} /></p></div>
      <div className="hw-rand"><div className="hw-band" aria-label="Opdrachtgevers van EXTRA"><ul className="hw-rij">{rij(true)}</ul><ul className="hw-rij" aria-hidden="true">{rij(false)}</ul></div></div>
    </div></section>
  );
}

function Functies({ s }: { s: S<"functies"> }) {
  const ref = useRef<HTMLElement>(null);
  useSpoor(ref, ".fspoor", ".fbedien", true);
  const n = s.slides.length;
  return (
    <section className="functies2" ref={ref}><div className="w">
      <div className="dkop"><div><span className="eyebrow">{s.eyebrow}</span>
        <h2 className="groot" style={{ marginTop: "22px", fontSize: "clamp(46px,5.6vw,92px)" }}><T t={s.h2} /></h2></div>
        <div><p className="lead zacht"><T t={s.lead} /></p>
          <div className="fbedien"><button className="pijl vorige" type="button" aria-label="Vorige functie"><Ic n="pijl" /></button><span className="teller"><b>1</b> / {n}</span><button className="pijl volgende" type="button" aria-label="Volgende functie"><Ic n="pijl" /></button></div></div></div>
    </div>
      <div className="fspoor" tabIndex={0} aria-roledescription="carrousel" aria-label={s.label}>
        {s.slides.map((sl, i) => (
          <article className="fslide" aria-label={`${i + 1} van ${n}`} key={i}>
            <div className="fbeeld"><img src={sl.img} alt="" loading="lazy" /><span className="fletters" aria-hidden="true"></span></div>
            <div className="fonder"><div>
              <h3>{sl.href ? <a href={sl.href}>{sl.h3}</a> : sl.h3} <Ic n="pijl" /></h3>
              <p><T t={sl.p} /></p>
              <div className="tags">{sl.tags.map((t) => <span key={t}>{t}</span>)}</div>
            </div>
              {sl.knop && <div className="frechts"><a className="knop vol" href={sl.knop.href ?? "#aanvragen"}>{sl.knop.tekst} <Pijl /></a></div>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Waarom({ s }: { s: S<"waarom"> }) {
  return (
    <section className="waarom" style={st({ paddingTop: s.paddingTop })}><div className="w">
      <div className="kop"><div><span className="eyebrow">{s.eyebrow}</span><h2 className="groot" style={{ marginTop: "22px" }}><T t={s.h2} /></h2></div><p className="lead zacht"><T t={s.lead} /></p></div>
      <div className="rijen">
        {s.punten.map((p, i) => <div className="rijpunt" key={i}><Ic n={p.ic as IcoonNaam} /><h3>{p.h3}</h3><p className="zacht"><T t={p.p} /></p></div>)}
      </div>
      {s.check && <span className="check"><Ic n="schild" />{s.check}</span>}
    </div></section>
  );
}

/** Score met sterren en het actuele aantal Google-reviews. */
export function ReviewScore() {
  const r = useLiveReviews();
  return (
    <div className="score" style={{ marginTop: "56px" }}><b>{r.scoreTekst}</b><div className="sterren">{[0, 1, 2, 3, 4].map((i) => <svg key={i} aria-hidden="true"><use href="#ster" /></svg>)}</div><span className="zacht">gemiddeld uit {r.aantalTekst}</span></div>
  );
}

export function Reviews({ s }: { s: S<"reviews"> }) {
  const ref = useRef<HTMLDivElement>(null);
  useCarrousel(ref, [s.items.length]);
  const n = s.items.length;
  return (
    <section className="donker reviews"><div className="w">
      <div><span className="eyebrow">{s.eyebrow}</span><h2 className="groot" style={{ marginTop: "22px" }}><T t={s.h2} /></h2>
        <ReviewScore />
      </div>
      <div className="carrousel" aria-roledescription="carrousel" ref={ref}>
        <div className="spoor" tabIndex={0}>
          {s.items.map((r, i) => (
            <figure className="slide" aria-label={`Review ${i + 1} van ${n}`} key={i}>
              <blockquote className="quote"><Woorden tekst={r.quote} /></blockquote>
              <figcaption className="wie"><span className="avatar">{initialen(r.naam)}</span><div><b>{r.naam}</b><span>{r.rol}</span></div></figcaption>
            </figure>
          ))}
        </div>
        <div className="bedien"><button className="pijl vorige" type="button" aria-label="Vorige review"><Ic n="pijl" /></button><span className="teller"><b>1</b> / {n}</span><button className="pijl volgende" type="button" aria-label="Volgende review"><Ic n="pijl" /></button><span className="stippen"></span></div>
      </div>
    </div></section>
  );
}

function Poule({ s }: { s: S<"poule"> }) {
  const ref = useRef<HTMLElement>(null);
  useStapelTop(ref);
  return (
    <section className="donker vacs poule" ref={ref}><div className="w">
      <div className="dkop"><div><span className="eyebrow">{s.eyebrow}</span>
        <h2 className="groot" style={{ marginTop: "22px", fontSize: "clamp(46px,5.6vw,92px)" }}><T t={s.h2} /></h2></div>
        <p className="lead"><T t={s.lead} /></p></div>
      <div className="vac-lijst">
        {s.items.map((v, i) => (
          <div className="vac" key={i}>
            <span className="vac-nr">{String(i + 1).padStart(2, "0")}</span>
            <span className="vac-kop"><h3>{v.h3}</h3><span>{v.sub}</span></span>
            <span className="vac-meta">{v.meta.map((m) => <span key={m}>{m}</span>)}</span>
            <span className="vac-loon"><b>{v.b}</b><small>{v.small}</small></span>
            <i aria-hidden="true"><Ic n="vink" /></i>
          </div>
        ))}
      </div>
      {s.knop && <div style={{ marginTop: "40px" }}><a className="knop vol" href={s.knop.href ?? "#aanvragen"}>{s.knop.tekst} <Pijl /></a></div>}
    </div></section>
  );
}

function Scores({ s }: { s: S<"scores"> }) {
  const ref = useRef<HTMLElement>(null);
  useSpoor(ref, ".scspoor", ".scbedien");
  const id = useId().replace(/:/g, "");
  return (
    <section className="scores" aria-labelledby={`sc${id}`} ref={ref}><div className="w">
      <div className="dkop"><div><span className="eyebrow">{s.eyebrow}</span>
        <h2 className="groot" id={`sc${id}`} style={{ marginTop: "22px", fontSize: "clamp(46px,5.6vw,92px)" }}><T t={s.h2} /></h2></div>
        <div><p className="lead zacht"><T t={s.lead} /></p>
          {s.lijst.length > 0 && <ul className="sc-lijst">{s.lijst.map((l) => <li key={l}><Ic n="vink" />{l}</li>)}</ul>}
          <div className="fbedien scbedien"><button className="pijl vorige" type="button" aria-label="Vorig profiel"><Ic n="pijl" /></button><span className="teller"><b>1</b> / {s.kaarten.length}</span><button className="pijl volgende" type="button" aria-label="Volgend profiel"><Ic n="pijl" /></button></div></div></div>
    </div>
      <div className="scspoor" tabIndex={0} aria-label="Voorbeeldprofielen van medewerkers">
        {s.kaarten.map((k, i) => (
          <article className="sc" key={i}>
            <header className="sc-kop"><div><small>{k.nr}</small><h3>{k.h3}</h3><span>{k.sub}</span></div><span className="sc-status">{k.status}</span></header>
            <div className="sc-midden">
              <div className="sc-ring" style={{ ["--p" as any]: k.p ?? "90" }}><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" /><circle className="v" cx="60" cy="60" r="52" /></svg><div><b>{k.score}</b><small>EXTRA-score</small></div></div>
              <ul className="sc-bars">{k.bars.map(([l, v]) => <li key={l}><span>{l}</span><b>{v}</b><i style={{ ["--v" as any]: v }}></i></li>)}</ul>
            </div>
            <dl className="sc-cijfers">{k.cijfers.map(([dt, dd]) => <div key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>)}</dl>
            <footer className="sc-fav"><small>Favoriet bij:</small><div>{k.fav.map((f) => <span key={f}>{f}</span>)}</div></footer>
          </article>
        ))}
      </div>
      <div className="w"><p className="sc-noot">{s.noot}</p></div>
    </section>
  );
}

function Screening({ s }: { s: S<"screening"> }) {
  return (
    <section className="screening"><div className="w">
      <div className="scr-tekst">
        <span className="eyebrow">{s.eyebrow}</span>
        <h2 className="groot" style={{ marginTop: "22px", fontSize: "clamp(44px,5vw,84px)" }}><T t={s.h2} /></h2>
        <p className="lead zacht" style={{ marginTop: "24px" }}><T t={s.lead} /></p>
      </div>
      <div className="scr-kaart" aria-label="Voorbeeld van een beoordeling">
        <div className="scr-kop"><span className="avatar">{s.kaart.avatar}</span><div><b>{s.kaart.b}</b><span>{s.kaart.span}</span></div></div>
        <div className="scr-tags">{s.kaart.tags.map((t) => <span key={t}>{t}</span>)}</div>
      </div>
    </div></section>
  );
}

function Hoe({ s }: { s: S<"hoe"> }) {
  return (
    <section className={`hoe${s.werk ? " hoe-werk" : ""}`} id={s.id ?? undefined}><div className="w">
      <div className="kop"><div><span className="eyebrow">{s.eyebrow}</span><h2 className="groot" style={{ marginTop: "22px" }}><T t={s.h2} /></h2></div><p className="lead zacht"><T t={s.lead} /></p></div>
      <div className="stappen">
        {s.stappen.map((p, i) => (
          <div className="stap" key={i}>
            <span className="nr" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><small>Stap {i + 1}</small><h3>{p.h3}</h3><p className="zacht"><T t={p.p} /></p>
            {i === s.stappen.length - 1 && s.knop && <a className="knop vol" href={s.knop.href ?? "#aanvragen"} style={{ marginTop: "28px" }}>{s.knop.tekst} <Pijl /></a>}
          </div>
        ))}
      </div>
      {s.standaard && <p className="standaard"><T t={s.standaard} /></p>}
    </div></section>
  );
}

function Data({ s }: { s: S<"data"> }) {
  return (
    <section className="donker data"><div className="w">
      <div className="data-twee data-een"><div>
        <span className="eyebrow">{s.eyebrow}</span>
        <h2 className="groot" style={{ marginTop: "22px", fontSize: "clamp(40px,4.4vw,72px)" }}><T t={s.h2} /></h2>
        <p className="lead" style={{ marginTop: "22px" }}><T t={s.lead} /></p>
        <ul className="lijst groot-lijst" style={{ marginTop: "26px" }}>{s.lijst.map((l) => <li key={l}><Ic n="vink" />{l}</li>)}</ul>
      </div></div>
      <div className="schermen breed">
        {s.schermen.map((sc, i) => <figure className={`scherm s${i + 1}`} key={i}><img src={sc.src} alt={sc.alt} loading="lazy" /></figure>)}
      </div>
    </div></section>
  );
}

const BELONINGEN: [string, string][] = [["JBL Speaker", "7.500"], ["Pathé Bon", "2.500"], ["EXTRA Padelset", "15.000"], ["Dinerbon", "5.000"], ["Apple AirTags", "3.000"], ["Museumkaart", "10.000"], ["AirPods Pro", "12.500"], ["GiG Hard Seltzer", "1.500"]];

export function BeloningenBand() {
  const set = (verborgen: boolean) => (
    <div className="loon-set" aria-hidden={verborgen || undefined}>
      {BELONINGEN.map(([b, p]) => <span className="beloning" key={b}><b>{b}</b><em>{p} punten</em></span>)}
    </div>
  );
  return <div className="loon-band" aria-label="Beloningen"><div className="loon-rij">{set(false)}{set(true)}</div></div>;
}

export function TelefoonExtraatje() {
  return (
    <div className="loon-podium">
      <span className="lp-badge lb1" aria-hidden="true"><i>&#9733;</i><span><small>Beloning</small>Pathé Bon · 2.500 ptn</span></span>
      <span className="lp-badge lb2" aria-hidden="true"><i>3</i><span><small>Op tijd-reeks</small>diensten op rij</span></span>
      <div className="tel"><div className="tel-scherm"><img src="/d3/app-extraatje.webp" alt="EXTRAATJE in de EXTRA-app: puntensaldo, status en op tijd-reeks" loading="lazy" /><span className="eiland"></span></div></div>
    </div>
  );
}

function Loon({ s }: { s: S<"loon"> }) {
  const [a, b, c] = s.h2;
  return (
    <section className="vlak loon hloon">
      <div className="w loon-grid">
        <div className="loon-tekst">
          <span className="eyebrow">{s.eyebrow}</span>
          <h2 className="mega loon-h2">{a} <span className="b2">{b}</span> <span className="b3 serif">{(c ?? "").replace(/\[\[|\]\]/g, "")}</span></h2>
          <p className="lead"><T t={s.lead} /></p>
          <ul className="hl-voordelen">{s.voordelen.map((v) => <li key={v}>{v}</li>)}</ul>
          <a className="knop vol" href={s.knop?.href ?? "/extraatje"} style={{ marginTop: "34px" }}>{s.knop?.tekst ?? "Lees meer over EXTRAATje"} <Pijl /></a>
        </div>
        <TelefoonExtraatje />
      </div>
      <BeloningenBand />
    </section>
  );
}

function Vorm() {
  return (
    <section className="vorm"><div className="w">
      <div className="dkop"><div><h2 className="groot" style={{ fontSize: "clamp(44px,5.4vw,90px)" }}>Uitzenden, payroll of <span className="serif">eigen personeel?</span></h2></div>
        <p className="lead zacht">Voor een piek van twee weken kies je iets anders dan voor een functie die je het hele jaar wilt invullen. Het verschil zit niet in het uurtarief, maar in wie werft, wie werkgever is en bij wie het risico ligt.</p><a className="vorm-link" href="/blog/zzp-inhuren-horeca">Lees het verschil tussen uitzenden en zzp <Ic n="pijl" /></a></div>
      <div className="vorm-grid">
        <div className="vk uit"><span className="vk-label">Wat EXTRA doet</span><h3>Uitzenden</h3><p>Wij werven én zijn werkgever. Jij stuurt aan op de vloer en betaalt per gewerkt uur.</p></div>
        <div className="vk"><h3>Payroll</h3><p>Je werft zelf; een payrollorganisatie neemt het werkgeverschap over. EXTRA biedt dit niet aan.</p></div>
        <div className="vk"><h3>Eigen personeel</h3><p>Je werft zelf en bent zelf werkgever. Logisch bij een structurele functie.</p></div>
      </div>
    </div></section>
  );
}

export function Faq({ s }: { s: S<"faq"> }) {
  const schone = (t: string) => t.replace(/\[\[|\]\]|\{\{|\}\}/g, "");
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.items.map(([q, a]) => ({ "@type": "Question", name: schone(q), acceptedAnswer: { "@type": "Answer", text: schone(a) } })),
  };
  return (
    <section className="faq"><div className="w">
      <div><span className="eyebrow">{s.eyebrow}</span><h2 className="groot" style={{ marginTop: "22px" }}><T t={s.h2} /></h2></div>
      <div className="faqlijst">
        {s.items.map(([q, a], i) => (
          <details name="faq" open={i === 0} key={i}><summary className="vraag">{q}<i></i></summary><p className="antwoord"><T t={a} /></p></details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </div></section>
  );
}

function Slot({ s, ctx }: { s: S<"slot">; ctx: Ctx }) {
  const reus = useRef<HTMLHeadingElement>(null);
  useReus(reus, 0.55);
  return (
    <section className={`slot2 slot-werk${s.laag ? " slot-laag" : ""}`} id={s.id ?? undefined}>
      <div className="foto"><img src={s.foto} alt="" style={st({ objectPosition: s.pos })} loading="lazy" /></div>
      <img className="tag" src={s.tag} alt="EXTRA, het uitzendbureau dat werkt" />
      <h2 className="reus" ref={reus}><span className="l1">{s.regels[0]}</span> <span className="l2">{s.regels[1]}</span> <span className="l3">{s.regels[2]}</span></h2>
      <div className="acties">
        <SnelAanvraag vorm="kaart" functies={s.functies} branche={ctx.branche} gekozen={s.gekozen ?? undefined} kop={s.kop} sub={s.sub} />
      </div>
    </section>
  );
}

function Stapel({ s, ctx }: { s: S<"stapel" | "stapel2">; ctx: Ctx }) {
  return (
    <div className={s.type}>
      {s.secties.map((x, i) => (
        <Fragment key={i}>
          {i > 0 && <div className="stapel-pauze" aria-hidden="true"></div>}
          <SectieView s={x} ctx={ctx} />
        </Fragment>
      ))}
    </div>
  );
}
