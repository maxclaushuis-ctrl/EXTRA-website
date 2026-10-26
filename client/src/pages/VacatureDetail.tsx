/**
 * Vacature (/vacatures/:slug) in design 3.0. Bron: mock-ups vacature-*.html.
 *
 * Alle inhoud komt uit het CMS (/api/vacatures/:slug), ongewijzigd:
 *  - "Over deze functie": introductie, over de rol en werkomgeving
 *  - "Wat ga je doen?": verantwoordelijkheden
 *  - "Wat wij zoeken": eisen
 *  - "Wat wij bieden": aanbod (vet deel en toelichting, gesplitst op het streepje)
 *  - veelgestelde vragen, als die in het CMS staan
 *
 * Wat bewust hetzelfde blijft als de vorige versie:
 *  - JobPosting en BreadcrumbList komen server-side (server/seo.ts); hier niet
 *    nog een keer, anders staan ze dubbel. FAQPage wel hier (via <Faq/>).
 *  - Title, description, canonical en Open Graph uit het CMS.
 *  - "Andere vacatures" is dezelfde ring als de server toont voor crawlers
 *    zonder JavaScript (shared/verwanteLinks.ts, 4 links).
 *  - Bestaat de vacature niet (meer), dan door naar /vacatures.
 */
import { useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Shell from "@/design3/Shell";
import { Ic, Pijl } from "@/design3/basis";
import { Faq } from "@/design3/secties";
import { TELEFOON, TELEFOON_HREF } from "@/design3/links";
import KandidaatSlot from "@/design3/KandidaatSlot";
import { verwanteItems } from "@shared/verwanteLinks";
import { alineas, splitsAanbod } from "@shared/vacatureWeergave";
import { naarRij, VacRegel } from "./Vacatures";

const WHATSAPP = "https://wa.me/31851305915";

/** Beeld per afdeling (zelfde foto's als de functiekaarten op de site). */
const BEELD: Record<string, string> = {
  Housekeeping: "/d3/f-housekeeping.webp",
  Keuken: "/d3/f-keuken.webp",
  "F&B": "/d3/f-fb.webp",
  Banqueting: "/d3/f-banqueting.webp",
  "Front office": "/d3/f-frontoffice.webp",
  Afwas: "/d3/f-afwas.webp",
};

/** Functie in het inschrijfformulier die bij de afdeling hoort. */
const FORMULIER_FUNCTIE: Record<string, string> = { Afwas: "Afwas en keukenhulp" };

function setMeta(attr: "name" | "property", key: string, content: string) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

const datumNl = (d: string | null | undefined) => {
  if (!d) return null;
  const t = new Date(d);
  return isNaN(t.getTime()) ? null : t.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
};

export default function VacatureDetail() {
  const [match, params] = useRoute("/vacatures/:slug");
  const [, naar] = useLocation();
  const slug = params?.slug ?? "";

  const { data: post, isLoading } = useQuery<any>({
    queryKey: [`/api/vacatures/${slug}`],
    enabled: !!slug,
    staleTime: 60_000,
    retry: false,
  });
  const { data: alleData } = useQuery<any>({ queryKey: ["/api/vacatures"], enabled: !!slug, staleTime: 60_000, retry: false });

  const alle = useMemo(() => (Array.isArray(alleData?.posts) ? alleData.posts : []), [alleData]);
  const verwant = useMemo(() => {
    const ring = verwanteItems(alle.map((v: any) => ({ slug: v.slug, title: v.title, groep: v.location ?? null })), slug);
    return ring.map((r) => alle.find((v: any) => v.slug === r.slug)).filter(Boolean).map(naarRij);
  }, [alle, slug]);

  const faqs: [string, string][] = useMemo(() => {
    if (!post?.faqItems) return [];
    try {
      const p = JSON.parse(post.faqItems);
      return Array.isArray(p) ? p.filter((f: any) => f?.q && f?.a).map((f: any) => [String(f.q), String(f.a)] as [string, string]) : [];
    } catch { return []; }
  }, [post]);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  useEffect(() => {
    if (!isLoading && !post && match) naar("/vacatures");
  }, [post, match, naar, isLoading]);

  // Title, description, canonical en Open Graph uit het CMS (zoals voorheen).
  useEffect(() => {
    if (!post) return;
    const titel = post.metaTitle || `${post.title} | Horeca vacature ${post.location} | EXTRA`;
    const url = post.canonicalUrl || `https://www.doehetextra.nl/vacatures/${post.slug}`;
    const omschrijving = post.metaDescription || post.shortDescription || "";
    document.title = titel;
    setMeta("name", "description", omschrijving);
    setCanonical(url);
    setMeta("property", "og:title", post.ogTitle || titel);
    setMeta("property", "og:description", post.ogDescription || omschrijving);
    setMeta("property", "og:type", "article");
    setMeta("property", "og:url", url);
  }, [post]);

  if (isLoading || !post) return null;

  const v = naarRij(post);
  const sector = v.branche === "events" ? "events" : v.branche === "logistiek" ? "logistiek" : "horeca";
  const over = alineas(post.introductionText, post.aboutRole, post.workEnvironment);
  const doen: string[] = post.responsibilities || [];
  const zoek: string[] = post.requirements || [];
  const bied: string[] = post.offer || [];
  const gepubliceerd = datumNl(post.publishedAt || post.createdAt);
  const tag = v.branche === "events" ? "/d3/logo-tag-b.svg" : v.branche === "logistiek" ? "/d3/logo-tag-g.svg" : "/d3/logo-tag-r.svg";
  const slotFoto = v.branche === "events" ? "/d3/e-slot.webp" : v.branche === "logistiek" ? "/d3/l-slot.webp" : "/d3/w-slot.webp";
  const functies = ["Housekeeping", "Front office", "F&B", "Banqueting", "Keuken", "Afwas en keukenhulp"];

  return (
    <Shell sector={sector} css={["events", "hotels", "werk", "vacature"]} werkzoekende>
      <section className="vhero"><div className="w">
        <nav className="kruimel" aria-label="Kruimelpad">
          <a href="/">Home</a><span>/</span><a href="/vacatures">Vacatures</a><span>/</span><span aria-current="page">{v.kort}</span>
        </nav>
        <div className="vh-grid">
          <div className="vh-tekst">
            <span className="chip"><i></i>Vacature · {v.afdeling}</span>
            <h1 className="vh-h1">{v.kort}{v.client && <> <span className="serif">bij {v.client}</span></>}</h1>
            <ul className="vh-meta">
              {v.location && <li>{v.location}</li>}
              {post.serviceType && <li>{post.serviceType}</li>}
              {post.workplace && <li>{post.workplace}</li>}
            </ul>
            <p className="vh-loon">{v.loon ? <><b>{v.loon}</b><span>all-in per uur</span></> : <><b>In overleg</b><span>uurloon</span></>}</p>
            <div className="knoppen op-foto">
              <a className="knop vol" href="#inschrijven">Solliciteer direct <Pijl /></a>
              <a className="knop lijn" href={v.branche === "hotels" ? "/vacatures" : `/vacatures?branche=${v.branche}`}>Alle vacatures <Pijl /></a>
            </div>
          </div>
          <div className="vh-beeld"><div className="fbeeld"><img src={BEELD[v.afdeling] ?? "/d3/f-fb.webp"} alt="" fetchPriority="high" /><span className="fletters" aria-hidden="true"></span></div></div>
        </div>
      </div></section>

      <section className="vbody"><div className="w vb-grid">
        <article className="vb-tekst">
          {over.length > 0 && <>
            <h2 className="vb-h2">Over deze <span className="serif">functie</span></h2>
            <div className="vb-over">{over.map((p, i) => <p key={i}>{p}</p>)}</div>
          </>}
          {doen.length > 0 && <>
            <h2 className="vb-h2">Wat ga je <span className="serif">doen?</span></h2>
            <ul className="vb-doen">{doen.map((d, i) => <li key={i}><Ic n="vink" /><span>{d}</span></li>)}</ul>
          </>}
          {zoek.length > 0 && <>
            <h2 className="vb-h2">Wat wij <span className="serif">zoeken</span></h2>
            <ol className="vb-zoek">{zoek.map((z, i) => <li key={i}><span className="vz-nr">{String(i + 1).padStart(2, "0")}</span><span>{z}</span></li>)}</ol>
          </>}
          {bied.length > 0 && <>
            <h2 className="vb-h2">Wat wij <span className="serif">bieden</span></h2>
            <ul className="vb-bied">{bied.map((b, i) => { const [vet, rest] = splitsAanbod(b); return <li key={i}><b>{vet}</b>{rest && <span>{rest}</span>}</li>; })}</ul>
          </>}
        </article>
        <aside className="vb-kaart"><div className="vk-in">
          <h3>Vacaturedetails</h3>
          <dl>
            {v.client && <div><dt>Opdrachtgever</dt><dd>{v.client}</dd></div>}
            {v.location && <div><dt>Locatie</dt><dd>{v.location}</dd></div>}
            <div><dt>All-in uurloon</dt><dd>{v.loon ? `${v.loon} per uur` : "In overleg"}</dd></div>
            {post.serviceType && <div><dt>Dienstverband</dt><dd>{post.serviceType}</dd></div>}
            {gepubliceerd && <div><dt>Gepubliceerd op</dt><dd>{gepubliceerd}</dd></div>}
          </dl>
          <a className="knop vol" href="#inschrijven">Solliciteer direct <Pijl /></a>
          <div className="vk-vraag">
            <b>Vragen over deze vacature?</b><span>Onze recruiters vertellen je alles over werken via EXTRA.</span>
            <p><a href={TELEFOON_HREF}><Ic n="tel" />{TELEFOON}</a><a className="if-wa" href={WHATSAPP}>WhatsApp ons <Ic n="pijl" /></a></p>
          </div>
        </div></aside>
      </div></section>

      {faqs.length > 0 && <Faq s={{ type: "faq", eyebrow: "Veelgestelde vragen", h2: "Vragen over deze [[vacature]]", items: faqs }} />}

      {verwant.length > 0 && (
        <section className="donker vacs vandere"><div className="w">
          <div className="dkop"><div><span className="eyebrow">Meer vacatures</span>
            <h2 className="groot" style={{ marginTop: "22px", fontSize: "clamp(46px,5.6vw,92px)" }}>Andere <span className="serif">vacatures</span></h2></div>
            <p className="lead">Dagbetaling, EXTRAATJE-punten en vaste opdrachtgevers.</p></div>
          <div className="vac-lijst">{verwant.map((r, i) => <VacRegel key={r.slug} v={r} nr={i + 1} />)}</div>
          <div className="vac-voet"><a className="knop vol" href="/vacatures">Bekijk alle vacatures <Pijl /></a><span>{alle.length} openstaande {alle.length === 1 ? "vacature" : "vacatures"}</span></div>
        </div></section>
      )}

      <KandidaatSlot
        foto={slotFoto}
        tag={tag}
        regels={["Solliciteer", "direct op deze", "vacature"]}
        kop={`Solliciteer als ${v.kort.toLowerCase()}`}
        sub="Daarna nemen we contact met je op voor een kennismaking."
        functies={functies}
        gekozen={FORMULIER_FUNCTIE[v.afdeling] ?? v.afdeling}
        beschikbaarheid={["Doordeweeks", "Weekend", "Avond"]}
        knop="Solliciteer direct"
      />

      <a className="v-sticky" href="#inschrijven"><span>{v.loon ? <><b>{v.loon}</b>all-in per uur</> : <b>Solliciteer</b>}</span><span className="knop vol">Solliciteer direct <Pijl /></span></a>
    </Shell>
  );
}
