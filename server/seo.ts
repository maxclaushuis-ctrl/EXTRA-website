/**
 * SERVER-SIDE SEO: meta-injectie, prerendered fragmenten en echte 404's.
 *
 * Vervangt in productie de generieke SPA-catch-all. Voor elke HTML-navigatie:
 *  1. Bekende statische route  → 200, shell met route-specifieke title/description/
 *     canonical/OG-tags uit shared/routeMeta.ts, plus (indien aanwezig) het
 *     prerendered HTML-fragment in <div id="root"> zodat crawlers zonder
 *     JavaScript de volledige content zien.
 *  2. Dynamische route (blog/vacature-slug) → DB-lookup voor titel/description;
 *     onbekende slug → 404.
 *  3. Onbekend pad → 404 + noindex (einde soft-404's).
 *
 * De React-app hydrateert er gewoon overheen (createRoot vervangt de inhoud);
 * de SEO-winst zit in de initiële HTML-respons.
 */
import fs from "fs";
import path from "path";
import type { Express, Request, Response, NextFunction } from "express";
import {
  ROUTE_META_BY_PATH,
  DYNAMIC_ROUTE_PATTERNS,
  HREFLANG_PARTNER,
  SITE_ORIGIN,
  normalizeMetaPath,
  type RouteMeta,
} from "@shared/routeMeta";
import { storage } from "./storage";
import { blogFragment, vacatureFragment, lijstFragment } from "./contentFragment";
import { TtlCache, metCache } from "./paginaCache";
import type { BlogPost, VacancyPost } from "@shared/schema";

interface PageMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  noindex?: boolean;
  /** P18: alleen relevant met noindex: true — true → "noindex, follow" i.p.v. "noindex, nofollow". */
  follow?: boolean;
  lang?: "nl" | "en";
  /** Extra JSON-LD-blokken die aan de <head> worden toegevoegd (al ge-stringificeerd, één <script> per entry). */
  jsonLd?: string[];
  /** P13: kant-en-klare <link rel="alternate" hreflang="..."> tags, al ge-stringificeerd. */
  hreflang?: string[];
}

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Injecteert route-metadata (en optioneel een prerendered fragment) in de HTML-shell. */
export function injectMeta(shell: string, meta: PageMeta, fragment?: string): string {
  let html = shell;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(meta.title)}</title>`);
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${escapeAttr(meta.description)}$2`
  );
  html = html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    `$1${escapeAttr(meta.canonicalUrl)}$2`
  );
  html = html.replace(
    /(<meta\s+name="robots"\s+content=")[^"]*(")/,
    `$1${meta.noindex ? (meta.follow ? "noindex, follow" : "noindex, nofollow") : "index, follow"}$2`
  );
  html = html.replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/, `$1${escapeAttr(meta.canonicalUrl)}$2`);
  html = html.replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${escapeAttr(meta.title)}$2`);
  html = html.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${escapeAttr(meta.description)}$2`
  );
  html = html.replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, `$1${escapeAttr(meta.title)}$2`);
  html = html.replace(
    /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
    `$1${escapeAttr(meta.description)}$2`
  );
  if (meta.lang === "en") {
    html = html.replace(/<html lang="nl">/, `<html lang="en">`);
    html = html.replace(/(<meta\s+property="og:locale"\s+content=")[^"]*(")/, `$1en_US$2`);
  }
  if (meta.jsonLd && meta.jsonLd.length > 0) {
    const scripts = meta.jsonLd.map((json) => `<script type="application/ld+json">${json}</script>`).join("\n");
    html = html.replace("</head>", `${scripts}\n</head>`);
  }
  if (meta.hreflang && meta.hreflang.length > 0) {
    html = html.replace("</head>", `${meta.hreflang.join("\n")}\n</head>`);
  }
  if (fragment) {
    html = html.replace('<div id="root"></div>', `<div id="root">${fragment}</div>`);
  }
  return html;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

/** BreadcrumbList JSON-LD (P3.4): op elke pagina behalve de homepage. */
function breadcrumbJsonLd(routePath: string, pageTitle: string, lang?: "nl" | "en"): string | undefined {
  if (routePath === "/") return undefined;
  const items: { name: string; url: string }[] = [{ name: lang === "en" ? "Home" : "Home", url: lang === "en" ? `${SITE_ORIGIN}/en` : `${SITE_ORIGIN}/` }];
  // Tussenniveau alleen als het zelf een bekende route is (bijv. /over-extra of /blog)
  const segments = routePath.split("/").filter(Boolean);
  if (segments.length > 1) {
    const parentPath = "/" + segments.slice(0, -1).join("/");
    const parent = ROUTE_META_BY_PATH[normalizeMetaPath(parentPath)];
    if (parent && !parent.noindex && normalizeMetaPath(parentPath) !== "/en") {
      items.push({ name: parent.title.split("|")[0].trim(), url: `${SITE_ORIGIN}${parent.canonical ?? parent.path}` });
    }
  }
  items.push({ name: pageTitle.split("|")[0].trim(), url: `${SITE_ORIGIN}${routePath}` });
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

/**
 * P13: hreflang-alternates + x-default, afgeleid uit HREFLANG_GROUPS in
 * shared/routeMeta.ts — dat is de enige plek waar NL/EN-paren onderhouden
 * worden, hier wordt nooit iets hardcoded. x-default wijst altijd naar de
 * Nederlandse versie (de standaardtaal van doehetextra.nl).
 *
 * Alleen aangeroepen voor self-canonical routes (metaFromRoute laat het weg
 * zodra m.canonical gezet is): een duplicaat-pagina die zelf al naar een
 * andere canonical wijst, hoort geen eigen hreflang-set te dragen — dat zou
 * canonical en hreflang tegenstrijdige signalen laten geven.
 */
function hreflangTags(ownCanonicalPath: string): string[] | undefined {
  const partner = HREFLANG_PARTNER[normalizeMetaPath(ownCanonicalPath)];
  if (!partner) return undefined;
  const nlPath = partner.lang === "en" ? ownCanonicalPath : partner.path;
  const enPath = partner.lang === "en" ? partner.path : ownCanonicalPath;
  return [
    `<link rel="alternate" hreflang="nl" href="${SITE_ORIGIN}${nlPath}" />`,
    `<link rel="alternate" hreflang="en" href="${SITE_ORIGIN}${enPath}" />`,
    `<link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}${nlPath}" />`,
  ];
}

function metaFromRoute(m: RouteMeta): PageMeta {
  const canonicalPath = m.canonical ?? m.path;
  const breadcrumb = m.noindex ? undefined : breadcrumbJsonLd(canonicalPath, m.title, m.lang);
  return {
    title: m.title,
    description: m.description,
    canonicalUrl: `${SITE_ORIGIN}${canonicalPath}`,
    noindex: m.noindex,
    follow: m.follow,
    lang: m.lang,
    jsonLd: breadcrumb ? [breadcrumb] : undefined,
    hreflang: m.canonical || m.noindex ? undefined : hreflangTags(canonicalPath),
  };
}

/** Rollende validThrough (P12/Google-advies voor doorlopende werving): 90 dagen vanaf datePosted. */
const VALID_THROUGH_DAYS = 90;

function vacancyValidThrough(vacancy: VacancyPost): Date {
  const posted = new Date(vacancy.publishedAt || vacancy.createdAt || Date.now());
  const validThrough = new Date(posted);
  validThrough.setDate(validThrough.getDate() + VALID_THROUGH_DAYS);
  return validThrough;
}

const EMPLOYMENT_TYPE_BY_SERVICE_TYPE: Record<string, string> = {
  Fulltime: "FULL_TIME",
  Parttime: "PART_TIME",
  Bijbaan: "PART_TIME",
  Oproep: "TEMPORARY",
};

/**
 * JobPosting JSON-LD (P12). Verplicht voor Google Jobs-indexering; ontbrak
 * volledig in de server-response — alleen client-side geïnjecteerd (dus
 * onzichtbaar voor crawlers zonder JavaScript, en pas zichtbaar ná hydratie
 * voor de rest). Wordt hier bij elke request live uit de database opgebouwd,
 * dus altijd actueel — ook voor vacatures waarvoor nog geen prerender-fragment
 * bestaat.
 *
 * jobLocation gebruikt bewust vacancy.location/region (nooit hardcoded
 * Amsterdam) — dus ook correct voor bijv. de Kurhaus-vacatures in Scheveningen.
 * Straatniveau (streetAddress/postalCode) staat niet in vacancy_posts en wordt
 * daarom weggelaten in plaats van verzonnen; Google vereist alleen
 * addressCountry en raadt addressLocality sterk aan.
 */
function jobPostingJsonLd(vacancy: VacancyPost, canonicalUrl: string): string {
  const posted = new Date(vacancy.publishedAt || vacancy.createdAt || Date.now());
  const description = stripHtml(
    [vacancy.introductionText, vacancy.aboutRole, vacancy.workEnvironment].filter(Boolean).join("\n\n")
  ) || stripHtml(vacancy.shortDescription || vacancy.title);

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: vacancy.title,
    description,
    datePosted: posted.toISOString(),
    validThrough: vacancyValidThrough(vacancy).toISOString(),
    employmentType: EMPLOYMENT_TYPE_BY_SERVICE_TYPE[vacancy.serviceType] || "OTHER",
    directApply: true,
    identifier: {
      "@type": "PropertyValue",
      name: "EXTRA",
      value: String(vacancy.id),
    },
    hiringOrganization: { "@id": "https://www.doehetextra.nl/#organization" },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: vacancy.location,
        addressRegion: vacancy.region,
        addressCountry: "NL",
      },
    },
  };

  if (vacancy.salaryMin) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: {
        "@type": "QuantitativeValue",
        value: Number(vacancy.salaryMin),
        unitText: "HOUR",
      },
    };
  }

  return JSON.stringify(schema);
}

/**
 * Registreert de SEO-catch-all. Aanroepen ná express.static, als laatste
 * middleware vóór de error handler (vervangt de oude sendFile-catch-all).
 */
/**
 * Korte cache op de DB-lookup van stap 2.
 *
 * Alleen deze middleware gebruikt hem: het gaat om de <head> en het fragment
 * die de server meestuurt, niet om wat de React-app zelf via de API ophaalt.
 * Een artikel dat je zojuist hebt gepubliceerd of aangepast staat dus meteen
 * goed in het scherm; alleen de meegeleverde meta kan hooguit een minuut
 * achterlopen. Dat is de prijs voor het weghalen van een databaseronde per
 * pagina bij een crawler die zeventien URL's achter elkaar afgaat.
 *
 * Zestig seconden is gekozen als "een crawlsessie lang, een redactieronde
 * niet". De grens van 200 sleutels ligt ruim boven het huidige aantal
 * artikelen en vacatures samen, en houdt verzonnen slugs in toom.
 */
const TTL_MS = 60_000;
const MAX_SLEUTELS = 200;
const blogCache = new TtlCache<{ waarde: BlogPost | undefined }>({ ttlMs: TTL_MS, max: MAX_SLEUTELS });
const vacatureCache = new TtlCache<{ waarde: VacancyPost | undefined }>({ ttlMs: TTL_MS, max: MAX_SLEUTELS });

/**
 * Bouwt de lijst met links voor /blog en /vacatures.
 *
 * Faalt zacht: kan de database niet worden bereikt, dan valt alleen de lijst
 * weg en wordt de pagina gewoon geserveerd. Een overzichtspagina die niet laadt
 * is erger dan eentje zonder lijst eronder.
 */
async function overzichtLijst(pad: string): Promise<string | null> {
  try {
    if (pad === "/blog" || pad === "/nieuws") {
      const { posts } = await storage.getBlogPosts({ status: "published", limit: 200 });
      return lijstFragment("/blog", "Alle artikelen", posts.map(p => ({
        slug: p.slug,
        title: p.title,
        bij: (p as any).category ?? null,
      })));
    }
    if (pad === "/vacatures") {
      const { posts } = await storage.getVacancyPosts({ status: "published", limit: 200 });
      return lijstFragment("/vacatures", "Alle vacatures", posts.map(v => ({
        slug: v.slug,
        title: v.title,
        bij: (v as any).location ?? null,
      })));
    }
  } catch (err) {
    console.error(`[seo] overzichtslijst voor ${pad} mislukt:`, err);
  }
  return null;
}

export function registerSeoCatchAll(app: Express, distPublicDir: string): void {
  const shellPath = path.resolve(distPublicDir, "index.html");
  let shellCache: string | null = null;
  const loadShell = () => {
    if (shellCache === null) shellCache = fs.readFileSync(shellPath, "utf-8");
    return shellCache;
  };

  const fragmentDir = path.resolve(distPublicDir, "prerender");
  const fragmentFor = (normalizedPath: string): string | undefined => {
    const name = normalizedPath === "/" ? "index" : normalizedPath.slice(1).replace(/\//g, "__");
    const file = path.resolve(fragmentDir, `${name}.html`);
    try {
      return fs.readFileSync(file, "utf-8");
    } catch {
      return undefined;
    }
  };

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    // Bestandsverzoeken (assets, .txt, .xml, .js, …) horen bij express.static;
    // als die er niet waren, is het een echte 404 — geen HTML-shell voor teruggeven.
    if (/\.[a-zA-Z0-9]+$/.test(req.path)) return res.status(404).type("text/plain").send("Not found");

    const normalized = normalizeMetaPath(req.path);
    const send = (status: number, meta: PageMeta, fragment?: string) => {
      res
        .status(status)
        .set({ "Content-Type": "text/html; charset=utf-8" })
        .send(injectMeta(loadShell(), meta, fragment));
    };

    // 1. Statische route uit het manifest
    const known = ROUTE_META_BY_PATH[normalized];
    if (known) {
      const basis = fragmentFor(normalizeMetaPath(known.path));
      // De overzichtspagina's krijgen hun lijst erbij. Het geprerenderde
      // fragment bevat die niet: React bouwt de lijst pas op ná het laden,
      // waardoor elke vacature en elk artikel voor een crawler zonder
      // JavaScript een "orphan page" was — nul inkomende links, terwijl de
      // pagina er in de browser gewoon naar linkt.
      const lijst = await overzichtLijst(normalized);
      const fragment = lijst ? `${basis ?? ""}${lijst}` : basis;
      return send(200, metaFromRoute(known), fragment);
    }

    // 2. Dynamische routes (blog/nieuws/vacatures met slug)
    for (const dyn of DYNAMIC_ROUTE_PATTERNS) {
      const match = normalized.match(dyn.pattern);
      if (!match) continue;
      const slug = decodeURIComponent(match[1]);
      try {
        if (dyn.type === "blog") {
          const post = await metCache(blogCache, slug, () => storage.getBlogPostBySlug(slug));
          if (post && post.status === "published") {
            return send(
              200,
              {
                title: truncate(`${post.title} | EXTRA`, 70),
                description: truncate(
                  stripHtml((post as any).metaDescription || (post as any).excerpt || (post as any).content || post.title),
                  155
                ),
                canonicalUrl: `${SITE_ORIGIN}${dyn.canonicalBase}/${post.slug}`,
                jsonLd: [breadcrumbJsonLd(`${dyn.canonicalBase}/${post.slug}`, post.title)].filter(
                  (v): v is string => !!v
                ),
              },
              // Fragment op basis van het opgevraagde pad (niet de canonical):
              // /blog/:slug en /nieuws/:slug serveren vandaag dezelfde content
              // via twee losse routes en krijgen dus allebei hun eigen
              // geprerenderde fragment (scripts/prerender.ts genereert beide).
              // Dit was de kern van P11: hier ontbrak de fragment-injectie
              // volledig, waardoor deze routes altijd een lege shell kregen.
              // Is er geen geprerenderd fragment (bij blogartikelen vrijwel
              // altijd — zie server/contentFragment.ts), bouw hem dan uit de
              // databasevelden. Zonder deze terugval serveert elk artikel een
              // lege body aan crawlers die geen JavaScript uitvoeren.
              fragmentFor(normalized) ?? blogFragment(post as any)
            );
          }
        } else if (dyn.type === "vacature") {
          const vacancy = await metCache(vacatureCache, slug, () => storage.getVacancyPostBySlug(slug));
          // P12: een vacature waarvan de (rollende) validThrough al verstreken is,
          // mag geen 200 met verouderd JobPosting-schema meer krijgen — ook niet
          // als de status in het CMS nog op "published" staat.
          const expired = vacancy ? vacancyValidThrough(vacancy) < new Date() : false;
          if (vacancy && vacancy.status === "published" && !expired) {
            const canonicalUrl = vacancy.canonicalUrl || `${SITE_ORIGIN}${dyn.canonicalBase}/${vacancy.slug}`;
            return send(
              200,
              {
                title: truncate(
                  vacancy.metaTitle || `${vacancy.title} | Horeca vacature ${vacancy.location} | EXTRA`,
                  70
                ),
                description: truncate(
                  stripHtml(vacancy.metaDescription || vacancy.shortDescription || vacancy.title),
                  155
                ),
                canonicalUrl,
                jsonLd: [
                  breadcrumbJsonLd(`${dyn.canonicalBase}/${vacancy.slug}`, vacancy.title),
                  jobPostingJsonLd(vacancy, canonicalUrl),
                ].filter((v): v is string => !!v),
              },
              fragmentFor(normalized) ?? vacatureFragment(vacancy as any)
            );
          }
        }
      } catch (err) {
        console.error(`[seo] DB-lookup mislukt voor ${normalized}:`, err);
        // Bij DB-storing: serveer de shell met 200 en generieke meta zodat de
        // client-side app het alsnog kan tonen — beter dan een harde fout.
        return send(200, {
          title: "EXTRA – Horeca uitzendbureau Amsterdam",
          description: "Flexibel horecapersoneel voor hotels, restaurants, events en cateraars in Amsterdam.",
          canonicalUrl: `${SITE_ORIGIN}${normalized}`,
        });
      }
      // Slug bestaat niet (meer) → echte 404
      return send(404, {
        title: "Pagina niet gevonden | EXTRA",
        description: "Deze pagina bestaat niet (meer). Bekijk onze vacatures of vraag personeel aan via doehetextra.nl.",
        canonicalUrl: `${SITE_ORIGIN}/`,
        noindex: true,
      });
    }

    // 3. Onbekend pad → echte 404 (einde soft-404's)
    return send(404, {
      title: "Pagina niet gevonden | EXTRA",
      description: "Deze pagina bestaat niet (meer). Bekijk onze vacatures of vraag personeel aan via doehetextra.nl.",
      canonicalUrl: `${SITE_ORIGIN}/`,
      noindex: true,
    });
  });
}
