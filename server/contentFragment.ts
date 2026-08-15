/**
 * SERVER-SIDE FRAGMENT voor blogartikelen en vacatures.
 *
 * Aanleiding: P11 loste de lege body op voor de statische routes met
 * scripts/prerender.ts, dat elke pagina in een headless Chromium rendert en het
 * resultaat als fragment wegschrijft. Voor /blog/:slug en /vacatures/:slug is
 * die aanpak in de praktijk onwerkbaar gebleken:
 *
 *   - het script vraagt een browser, en die draait niet in Replit: Chromium
 *     start daar niet op (libglib-2.0.so.0 ontbreekt) en de systeembibliotheken
 *     bijplaatsen vraagt rechten die er niet zijn;
 *   - zelfs mét browser is het een handmatige stap ná elke publicatie, precies
 *     bij de pagina's die het vaakst wijzigen. Bij twee blogs per week valt er
 *     structureel eentje buiten de boot.
 *
 * Gevolg was dat élk blogartikel en élke vacature aan een crawler zonder
 * JavaScript een lege <div id="root"></div> serveerde. De <head> was compleet,
 * de inhoud niet. Voor ChatGPT, Claude en Perplexity bestonden die pagina's
 * daarmee niet — terwijl LLM-zichtbaarheid juist de reden was om ze te maken.
 *
 * Deze module bouwt het fragment rechtstreeks uit de databasevelden. Geen
 * browser, geen buildstap, geen commit: een artikel dat vandaag gepubliceerd
 * wordt, is vanaf het eerste verzoek zichtbaar. De geprerenderde fragmenten
 * blijven leidend waar ze bestaan — dit is de terugval, niet de vervanging.
 */

/** Tekst die veilig tussen tags mag staan. */
function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Conservatieve opschoning van door de redactie aangeleverde HTML.
 *
 * Bewust geen DOMPurify: dat is een browserbibliotheek en vraagt server-side
 * een jsdom-afhankelijkheid erbij. De client sanitizet deze inhoud al vóór het
 * tonen (client/src/lib/sanitize.ts); dit is de tweede lijn voor het pad waar
 * de HTML rechtstreeks in de shell belandt.
 *
 * Weg: script/style/iframe/object/embed/link/meta inclusief inhoud, alle
 * on…-handlers, en javascript:-URL's. De rest van de opmaak (koppen, lijsten,
 * tabellen, afbeeldingen, links) blijft staan — dat is juist wat een crawler
 * moet zien.
 */
export function schoonHtml(html: string): string {
  return String(html ?? "")
    .replace(/<(script|style|iframe|object|embed)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}

/**
 * Vaste navigatie onderaan elk fragment.
 *
 * Waarom dit erbij hoort: de HTML-shell bevat zelf geen navigatie — die zit in
 * de React-app. Een fragment zonder links zou van elk artikel een doodlopende
 * pagina maken in de crawl, waardoor de interne linkwaarde daar blijft hangen.
 * Bewust kort: de zes bestemmingen waar een lezer van een artikel of vacature
 * daadwerkelijk naartoe wil.
 */
const NAVIGATIE = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog & nieuws" },
  { href: "/vacatures", label: "Horeca vacatures" },
  { href: "/aanmelden", label: "Aanmelden" },
  { href: "/personeelsaanvraag", label: "Personeel aanvragen" },
  { href: "/contact", label: "Contact" },
];

function navigatieHtml(): string {
  return (
    '<nav aria-label="Snel naar"><ul>' +
    NAVIGATIE.map(l => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join("") +
    "</ul></nav>"
  );
}

/** Kruimelpad — dezelfde route-hiërarchie als de BreadcrumbList in de head. */
function kruimels(basis: string, basisLabel: string, titel: string): string {
  return (
    `<nav aria-label="Kruimelpad"><a href="/">Home</a> › ` +
    `<a href="${basis}">${esc(basisLabel)}</a> › <span>${esc(titel)}</span></nav>`
  );
}

export interface BlogFragmentInput {
  title: string;
  slug: string;
  content?: string | null;
  excerpt?: string | null;
  metaDescription?: string | null;
  author?: string | null;
  category?: string | null;
  readTime?: string | null;
  publishedAt?: Date | string | null;
}

/**
 * Fragment voor /blog/:slug en /nieuws/:slug.
 *
 * Volgt bewust de opbouw van NieuwsArtikel.tsx: H1, daaronder de
 * meta-omschrijving als intro (die staat daar óók zichtbaar op de pagina), dan
 * de artikelinhoud. Zo ziet een crawler dezelfde tekst als een bezoeker.
 */
// De pad-parameter bestaat voor het geval /nieuws ooit weer een eigen route
// wordt; vandaag verwijst /nieuws/:slug via een 301 naar /blog/:slug (P14),
// dus in de praktijk is dit altijd "/blog".
export function blogFragment(post: BlogFragmentInput, pad: "/blog" | "/nieuws" = "/blog"): string {
  const intro = post.metaDescription || post.excerpt || "";
  const datum =
    post.publishedAt instanceof Date
      ? post.publishedAt.toISOString().slice(0, 10)
      : typeof post.publishedAt === "string"
        ? post.publishedAt.slice(0, 10)
        : "";

  const meta = [
    post.category ? esc(post.category) : "",
    post.author ? `door ${esc(post.author)}` : "",
    post.readTime ? esc(post.readTime) : "",
    datum ? `<time datetime="${datum}">${datum}</time>` : "",
  ].filter(Boolean);

  return (
    "<article>" +
    kruimels(pad, pad === "/nieuws" ? "Nieuws" : "Blog", post.title) +
    `<h1>${esc(post.title)}</h1>` +
    (meta.length ? `<p>${meta.join(" · ")}</p>` : "") +
    (intro ? `<p><em>${esc(intro)}</em></p>` : "") +
    schoonHtml(post.content || "") +
    "</article>" +
    navigatieHtml()
  );
}

export interface VacatureFragmentInput {
  title: string;
  slug: string;
  location?: string | null;
  serviceType?: string | null;
  shortDescription?: string | null;
  introductionText?: string | null;
  aboutRole?: string | null;
  responsibilities?: string[] | null;
  requirements?: string[] | null;
  offer?: string[] | null;
  workEnvironment?: string | null;
  ctaText?: string | null;
}

/** Fragment voor /vacatures/:slug — dezelfde secties als VacatureDetail.tsx. */
export function vacatureFragment(v: VacatureFragmentInput): string {
  const lijst = (titel: string, items?: string[] | null) =>
    items && items.length
      ? `<h2>${esc(titel)}</h2><ul>${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`
      : "";

  const alinea = (titel: string, tekst?: string | null) =>
    tekst ? `<h2>${esc(titel)}</h2>${schoonHtml(tekst)}` : "";

  const kop = [v.location ? esc(v.location) : "", v.serviceType ? esc(v.serviceType) : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    "<article>" +
    kruimels("/vacatures", "Vacatures", v.title) +
    `<h1>${esc(v.title)}</h1>` +
    (kop ? `<p>${kop}</p>` : "") +
    (v.shortDescription ? `<p>${esc(v.shortDescription)}</p>` : "") +
    alinea("Over deze rol", v.introductionText || v.aboutRole) +
    lijst("Wat ga je doen?", v.responsibilities) +
    lijst("Wat vragen we?", v.requirements) +
    lijst("Wat bieden we?", v.offer) +
    alinea("Werkomgeving", v.workEnvironment) +
    `<p><a href="/aanmelden">${esc(v.ctaText || "Solliciteer op deze vacature")}</a></p>` +
    "</article>" +
    navigatieHtml()
  );
}
