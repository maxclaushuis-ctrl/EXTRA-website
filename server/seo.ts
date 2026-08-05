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
  SITE_ORIGIN,
  normalizeMetaPath,
  type RouteMeta,
} from "@shared/routeMeta";
import { storage } from "./storage";
import type { VacancyPost } from "@shared/schema";

interface PageMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  noindex?: boolean;
  lang?: "nl" | "en";
  /** Extra JSON-LD-blokken die aan de <head> worden toegevoegd (al ge-stringificeerd, één <script> per entry). */
  jsonLd?: string[];
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
    `$1${meta.noindex ? "noindex, nofollow" : "index, follow"}$2`
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

function metaFromRoute(m: RouteMeta): PageMeta {
  const breadcrumb = m.noindex ? undefined : breadcrumbJsonLd(m.canonical ?? m.path, m.title, m.lang);
  return {
    title: m.title,
    description: m.description,
    canonicalUrl: `${SITE_ORIGIN}${m.canonical ?? m.path}`,
    noindex: m.noindex,
    lang: m.lang,
    jsonLd: breadcrumb ? [breadcrumb] : undefined,
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
    if (known) return send(200, metaFromRoute(known), fragmentFor(normalizeMetaPath(known.path)));

    // 2. Dynamische routes (blog/nieuws/vacatures met slug)
    for (const dyn of DYNAMIC_ROUTE_PATTERNS) {
      const match = normalized.match(dyn.pattern);
      if (!match) continue;
      const slug = decodeURIComponent(match[1]);
      try {
        if (dyn.type === "blog") {
          const post = await storage.getBlogPostBySlug(slug);
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
              fragmentFor(normalized)
            );
          }
        } else if (dyn.type === "vacature") {
          const vacancy = await storage.getVacancyPostBySlug(slug);
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
              fragmentFor(normalized)
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
