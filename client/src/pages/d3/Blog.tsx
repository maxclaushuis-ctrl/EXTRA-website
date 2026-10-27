/**
 * Blogoverzicht en blogartikel in design 3.0 (bron: mock-ups blog.html en
 * blog-*.html). De artikelen komen uit de database via /api/blog; voor
 * crawlers zonder JavaScript bouwt de server een eigen fragment
 * (server/contentFragment.ts) en de BlogPosting-gegevens (server/seo.ts).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import Shell from "@/design3/Shell";
import SnelAanvraag from "@/design3/SnelAanvraag";
import { Pijl } from "@/design3/basis";
import { useReus } from "@/design3/gedrag";
import { TELEFOON, TELEFOON_HREF } from "@/design3/links";
import { verwanteItems } from "@shared/verwanteLinks";

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  category: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  author?: string | null;
  readTime?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Typografische omslagen (in huisstijl) voor artikelen zonder foto. */
const OMSLAG: Record<string, { klasse: string; woord: string; sub: string; label: string }> = {
  "betrouwbaar-horeca-uitzendbureau-kiezen": { klasse: "bc-wtta", woord: "Wtta", sub: "1 januari 2027", label: "Keurmerkschild met vinkje, symbool voor een uitzendbureau dat onafhankelijk is gecontroleerd" },
  "zzp-inhuren-horeca": { klasse: "bc-zzp", woord: "€38", sub: "per uur", label: "Kalenderblad van 31 december 2026, de datum waarop het rechtsvermoeden op basis van uurtarief ingaat" },
  "personeelstekort-horeca": { klasse: "bc-tekort", woord: "26.400", sub: "vacatures in de horeca", label: "Het getal 26.400, het aantal openstaande vacatures in de horeca in het tweede kwartaal van 2026" },
  "housekeeping-standaard-verhogen": { klasse: "bc-hk", woord: "Schoon.", sub: "fris en opgeruimd", label: "De woorden schoon, fris en opgeruimd, de drie dingen waaraan gasten netheid afmeten" },
};

const KLEUR: Record<string, string> = { Branche: "sky", Housekeeping: "rose", Hospitality: "pistachio", "Events & Catering": "pistachio", Horeca: "pistachio", "EXTRA Nieuws": "rose" };
const kleur = (cat: string) => KLEUR[cat] ?? "sky";

const datum = (p: Post) => {
  const d = p.publishedAt || p.createdAt;
  return d ? new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : "";
};
const lees = (p: Post) => (p.readTime ? String(p.readTime).replace(/\s*(leestijd|lezen)$/i, "") : "");

function Omslag({ p, extra = "" }: { p: Post; extra?: string }) {
  const o = OMSLAG[p.slug];
  const cat = <span className={`cat c-${kleur(p.category)}`}>{p.category}</span>;
  if (o) {
    return (
      <div className={`img bcover ${o.klasse}${extra}`} role="img" aria-label={o.label}>
        <span className="bc-letters" aria-hidden="true" />
        <span className="bc-woord" aria-hidden="true"><b>{o.woord}</b><span className="serif">{o.sub}</span></span>
        {cat}
      </div>
    );
  }
  return (
    <div className={`img bcover bc-foto${extra}`}>
      {p.imageUrl && <img src={p.imageUrl} alt={p.imageAlt || ""} loading="lazy" />}
      {cat}
    </div>
  );
}

function Kaart({ p }: { p: Post }) {
  return (
    <a className="artikel" href={`/blog/${p.slug}`} data-cat={p.category}>
      <Omslag p={p} />
      <div className="ak-tekst">
        <h3>{p.title}</h3>
        <p className="zacht">{p.excerpt}</p>
        <span className="b-meta"><time>{datum(p)}</time>{lees(p) && <span>{lees(p)} leestijd</span>}</span>
        <span className="ak-lees" aria-hidden="true">Lees artikel <Pijl /></span>
      </div>
    </a>
  );
}

function Slot() {
  const reus = useRef<HTMLHeadingElement>(null);
  useReus(reus, 0.55);
  return (
    <section className="slot2">
      <div className="foto"><img src="/d3/closeup.webp" alt="" loading="lazy" /></div>
      <img className="tag" src="/d3/logo-tag-w.svg" alt="EXTRA, het uitzendbureau dat werkt" />
      <h2 className="reus" ref={reus}><span className="l1">Klaar</span> <span className="l2">om samen te</span> <span className="l3">werken?</span></h2>
      <p className="intro">Of je nu extra personeel zoekt of extra werk: we regelen het snel en duidelijk.</p>
      <div className="acties"><div className="knoppen op-foto"><a className="knop vol" href="/personeelsaanvraag">Vraag extra personeel aan <Pijl /></a><a className="knop lijn" href="/vacatures">Ik zoek extra werk <Pijl /></a></div></div>
    </section>
  );
}

const FUNCTIES = ["Housekeeping", "Front office", "F&B", "Banqueting", "Keuken", "Afwas en keukenhulp", "Bediening (events)", "Bar (events)", "Orderpicker", "Heftruckchauffeur", "Anders"];

function usePosts() {
  const { data, isLoading } = useQuery<{ posts: Post[] }>({ queryKey: ["/api/blog"], staleTime: 60000 });
  const posts = useMemo(() => {
    const lijst = Array.isArray(data?.posts) ? data!.posts : [];
    return [...lijst].sort((a, b) => String(b.publishedAt || b.createdAt || "").localeCompare(String(a.publishedAt || a.createdAt || "")));
  }, [data]);
  return { posts, isLoading };
}

// ───────────── overzicht ─────────────
export function BlogOverzicht() {
  const { posts } = usePosts();
  const [filter, setFilter] = useState("alle");
  const tellingen = useMemo(() => {
    const t: Record<string, number> = {};
    posts.forEach((p) => { t[p.category] = (t[p.category] ?? 0) + 1; });
    return t;
  }, [posts]);
  const [hoofd, ...rest] = posts;
  const zij = rest.slice(0, 2);
  const zichtbaar = filter === "alle" ? posts : posts.filter((p) => p.category === filter);

  return (
    <Shell sector="algemeen" css={["blog"]} bodyKlasse="blogpag">
      <section className="bhero bh2"><div className="w">
        <nav className="kruimel" aria-label="Kruimelpad"><a href="/">Home</a><span>/</span><span aria-current="page">Blog</span></nav>
        <div className="bh2-kop">
          <div><span className="eyebrow">Nieuws &amp; blogs</span><h1 className="bh-h1">Laatste nieuws uit de <span className="serif">branche</span></h1></div>
          <p className="bh-lead">Wetgeving, keuzes en praktijk voor hotels, eventlocaties en horeca. Geschreven door de redactie van EXTRA.</p>
        </div>
        {hoofd && (
          <div className="bh2-grid">
            <a className="bh2-hoofd" href={`/blog/${hoofd.slug}`} data-cat={hoofd.category}>
              <Omslag p={hoofd} extra=" bh2-omslag" />
              <div className="bh2-tekst">
                <span className="bh2-label"><i />Nieuwste artikel</span>
                <h2>{hoofd.title}</h2>
                <p>{hoofd.excerpt}</p>
                <span className="b-meta"><time>{datum(hoofd)}</time>{lees(hoofd) && <span>{lees(hoofd)} leestijd</span>}</span>
                <span className="knop vol">Lees artikel <Pijl /></span>
              </div>
            </a>
            <div className="bh2-zij">
              <b className="bh2-zijkop">Ook net verschenen</b>
              {zij.map((p) => (
                <a className="bh2-mini" href={`/blog/${p.slug}`} key={p.slug}>
                  <Omslag p={p} />
                  <div><span className={`cat c-${kleur(p.category)}`}>{p.category}</span><h3>{p.title}</h3><span className="b-meta"><time>{datum(p)}</time>{lees(p) && <span>{lees(p)}</span>}</span></div>
                </a>
              ))}
              <a className="bh2-alle" href="#alle-artikelen">Bekijk alle artikelen <Pijl /></a>
            </div>
          </div>
        )}
      </div></section>

      <section className="blijst bl2" id="alle-artikelen"><div className="w">
        <div className="bl-kop">
          <h2>Alle <span className="serif">artikelen</span></h2>
          <div className="vo-filter licht bl-pillen" role="group" aria-label="Filter op onderwerp">
            <button type="button" className={filter === "alle" ? "aan" : undefined} aria-pressed={filter === "alle"} onClick={() => setFilter("alle")}>Alles <b>{posts.length}</b></button>
            {Object.entries(tellingen).map(([c, n]) => (
              <button type="button" key={c} className={filter === c ? "aan" : undefined} aria-pressed={filter === c} onClick={() => setFilter(c)} style={{ ["--pil" as any]: `var(--${kleur(c)})` }}><i />{c} <b>{n}</b></button>
            ))}
          </div>
        </div>
        <div className="bento">{zichtbaar.map((p) => <Kaart p={p} key={p.slug} />)}</div>
        <div className="bl-terug">
          <div className="blt-tekst"><span className="eyebrow">Even sparren?</span><h2>Lees je dit omdat je rooster van morgen nog <span className="serif">niet rond</span> is?</h2>
            <p>Laat je nummer achter, dan bellen we je terug. Of bel ons direct op <a href={TELEFOON_HREF}>{TELEFOON}</a>.</p></div>
          <SnelAanvraag functies={FUNCTIES} branche="anders" vorm="blok" />
        </div>
      </div></section>
      <Slot />
    </Shell>
  );
}

// ───────────── artikel ─────────────

/** Koppen nummeren voor de inhoudsopgave en het "Kort antwoord" als kaart tonen. */
function bewerk(html: string): { html: string; koppen: string[] } {
  const koppen: string[] = [];
  let uit = html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, (_m, _a, inhoud) => {
    koppen.push(inhoud.replace(/<[^>]+>/g, "").trim());
    return `<h2 id="d${koppen.length}">${inhoud}</h2>`;
  });
  uit = uit.replace(/<p>\s*(<strong>)?Kort antwoord([^:<]*):\s*(<\/strong>)?\s*(<strong>)?(\w)/, (_m, s1, sub, s2, s3, letter) =>
    `<p class="kort-antwoord"><b>Kort antwoord</b>${sub && sub.trim() ? `<span class="ka-sub">${sub.trim()}</span>` : ""}${s3 ?? ""}${letter.toUpperCase()}`,
  );
  return { html: uit, koppen };
}

const DIENST: Record<string, { kop: [string, string]; sub: string; href: string; link: string }> = {
  Housekeeping: { kop: ["Housekeeping personeel", "nodig?"], sub: "Room attendants, housemen en supervisors die jouw standaard kennen. Laat je nummer achter, dan bellen we je terug.", href: "/hotelpersoneel-inhuren", link: "Bekijk hotelpersoneel" },
  Hospitality: { kop: ["Front office of F&B versterken op drukke", "dagen?"], sub: "Vaste gezichten in je flexibele schil, die je hotel en je gasten kennen. Laat je nummer achter, dan bellen we je terug.", href: "/hotelpersoneel-inhuren", link: "Bekijk hotelpersoneel" },
  "Events & Catering": { kop: ["Personeel voor je event", "nodig?"], sub: "Bediening, bar, hosts en supervisors. Laat je nummer achter, dan bellen we je terug.", href: "/eventpersoneel-inhuren", link: "Bekijk eventpersoneel" },
};
const DIENST_STANDAARD = { kop: ["Personeel inlenen zonder", "zorgen?"] as [string, string], sub: "Iedereen in loondienst, NEN 4400-1 gecertificeerd. Laat je nummer achter, dan bellen we je terug.", href: "/onze-werkwijze", link: "Zo werken wij" };

export function BlogArtikel() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useQuery<Post>({ queryKey: [`/api/blog/${slug}`], staleTime: 60000, retry: false });
  const { posts } = usePosts();
  const balk = useRef<HTMLElement>(null);
  const tekst = useRef<HTMLElement>(null);
  const [gekopieerd, setGekopieerd] = useState(false);

  useEffect(() => { if (post?.metaTitle) document.title = post.metaTitle; }, [post]);

  // Leesvoortgang.
  useEffect(() => {
    const zet = () => {
      const a = tekst.current, b = balk.current;
      if (!a || !b) return;
      const r = a.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight * 0.6)));
      b.style.transform = `scaleX(${p})`;
    };
    window.addEventListener("scroll", zet, { passive: true });
    zet();
    return () => window.removeEventListener("scroll", zet);
  }, [post]);

  const { html, koppen } = useMemo(() => bewerk(post?.content ?? ""), [post]);
  const verwant = useMemo(() => {
    const ring = verwanteItems(posts.map((p) => ({ slug: p.slug, title: p.title, groep: p.category ?? null })), slug);
    return ring.map((r) => posts.find((p) => p.slug === r.slug)).filter(Boolean) as Post[];
  }, [posts, slug]);

  if (isLoading) return <Shell sector="algemeen" css={["blog"]} bodyKlasse="blogpag"><section className="bhero"><div className="w" style={{ minHeight: "40vh" }} /></section></Shell>;

  if (!post) {
    return (
      <Shell sector="algemeen" css={["blog"]} bodyKlasse="blogpag">
        <section className="bhero"><div className="w">
          <nav className="kruimel" aria-label="Kruimelpad"><a href="/">Home</a><span>/</span><a href="/blog">Blog</a></nav>
          <h1 className="bh-h1">Dit artikel bestaat <span className="serif">niet (meer)</span></h1>
          <p className="bh-lead">Misschien is het verplaatst. Bekijk alle artikelen op de blog.</p>
          <a className="knop vol" href="/blog" style={{ marginTop: "28px" }}>Naar de blog <Pijl /></a>
        </div></section>
      </Shell>
    );
  }

  const url = `https://www.doehetextra.nl/blog/${post.slug}`;
  const d = DIENST[post.category] ?? DIENST_STANDAARD;
  const kopieer = async () => {
    try { await navigator.clipboard.writeText(url); setGekopieerd(true); } catch { /* geen klembord */ }
  };

  return (
    <Shell sector="algemeen" css={["blog"]} bodyKlasse="blogpag">
      <div className="leesbalk" aria-hidden="true"><i ref={balk} /></div>
      <section className="bhero bha2"><div className="w">
        <nav className="kruimel" aria-label="Kruimelpad"><a href="/">Home</a><span>/</span><a href="/blog">Blog</a><span>/</span><span aria-current="page">{post.category}</span></nav>
        <span className={`cat c-${kleur(post.category)}`}>{post.category}</span>
        <h1 className="bh-h1">{post.title}</h1>
        {post.metaDescription && <p className="bh-lead">{post.metaDescription}</p>}
        <ul className="bh-meta">
          <li><span className="avatar">{(post.author || "EXTRA").trim().charAt(0).toUpperCase()}</span>{post.author || "EXTRA Redactie"}</li>
          {datum(post) && <li><time dateTime={post.publishedAt || undefined}>{datum(post)}</time></li>}
          {lees(post) && <li>{lees(post)} leestijd</li>}
        </ul>
        <div className="b-delen" aria-label="Deel dit artikel">
          <span>Delen</span>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <button type="button" onClick={kopieer}>{gekopieerd ? "Link gekopieerd" : "Kopieer link"}</button>
        </div>
      </div></section>
      <div className="bh-cover"><div className="w"><Omslag p={post} /></div></div>

      <section className="bbody"><div className="w bb-grid">
        <aside className="bb-zij">
          {koppen.length > 1 && (
            <nav className="toc" aria-label="In dit artikel"><b>In dit artikel</b><ol>{koppen.map((k, i) => <li key={i}><a href={`#d${i + 1}`}>{k}</a></li>)}</ol></nav>
          )}
          <div className="bb-cta"><b>Personeel nodig?</b><span>Laat je nummer achter, dan bellen we je terug.</span><a className="knop vol" href="/personeelsaanvraag">Bel mij terug <Pijl /></a></div>
        </aside>
        <article className="prose" ref={tekst}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
          <aside className="b-auteur"><span className="avatar">{(post.author || "EXTRA").trim().charAt(0).toUpperCase()}</span><div><b>{post.author || "EXTRA Redactie"}</b><span>Geschreven door het team dat dagelijks hotels, eventlocaties en magazijnen van personeel voorziet.</span>{datum(post) && <small>Gepubliceerd {datum(post)}</small>}</div></aside>
        </article>
      </div></section>

      <section className="b-dienst"><div className="w"><div className="bd-kaart">
        <div className="bd-tekst"><span className="eyebrow">Direct geregeld</span><h2>{d.kop[0]} <span className="serif">{d.kop[1]}</span></h2><p>{d.sub}</p><a className="bd-link" href={d.href}>{d.link} <Pijl /></a></div>
        <SnelAanvraag functies={FUNCTIES} branche={post.category === "Events & Catering" ? "event" : "hotel"} vorm="blok" />
      </div></div></section>

      {verwant.length > 0 && (
        <section className="leesook"><div className="w">
          <div className="nieuws-kop"><div><span className="eyebrow">Lees ook</span><h2 className="groot" style={{ marginTop: "22px" }}>Meer uit de <span className="serif">branche</span></h2></div><a className="knop lijn" href="/blog">Alle blogs <Pijl /></a></div>
          <div className="nieuws twee">{verwant.map((p) => <Kaart p={p} key={p.slug} />)}</div>
        </div></section>
      )}
      <Slot />
    </Shell>
  );
}
