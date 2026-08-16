import type { Express, Request, Response, NextFunction } from "express";

/**
 * 301 REDIRECT MAP — Wix-migratie naar doehetextra.nl
 *
 * Sleutels zijn genormaliseerde paden (lowercase, zonder trailing slash).
 * Express decodeert URL-encoding automatisch in req.path.
 */
const REDIRECT_MAP: Record<string, string> = {

  // ── HOOFDPAGINA'S ──────────────────────────────────────
  "/over-extra-uitzendbureau":          "/over-extra",
  "/contact-extra-uitzendbureau":       "/contact",
  "/contact-bedrijven":                 "/contact",
  "/veelgestelde-vragen-extra":         "/over-extra",
  "/extraatjes":                        "/extraatje",
  "/kopie-van-amsterdam":               "/",
  "/hoe-werkt-het":                     "/onze-werkwijze",

  // ── WERKGEVER PAGINA'S ──────────────────────────────────
  "/hotelpersoneel-gezocht":            "/hotelpersoneel-inhuren",
  "/evenementen-uitzendbureau":         "/eventpersoneel-inhuren",

  // ── KANDIDAAT / VACATURE PAGINA'S ───────────────────────
  "/vacature-aanmelden":                "/aanmelden",
  "/werk-zoeken":                       "/horeca-vacatures-amsterdam",
  "/werk-zoeken-2":                     "/horeca-vacatures-amsterdam",

  // ── SPECIFIEKE VACATURES (oud Wix) ──────────────────────
  "/vacatures/hotelpersoneel-amstelhotel":
    "/hotelpersoneel-inhuren",

  // %2C = komma, ö = mövenpick (Express decodeert automatisch)
  "/vacatures/chef-gezocht-voor-marriot,-nh,-mövenpick,-mercure-hotels":
    "/chef-vacatures-amsterdam",

  "/vacatures/horeca-werken-bij-studio-21-in-hilversum":
    "/horeca-werk",

  "/vacatures/horeca-bijaan-hilton-apollolaan":
    "/horeca-werk",

  "/vacatures/hotelpersoneel-mövenpick-amsterdam":
    "/hotelpersoneel-inhuren",

  "/vacatures/horeca-bijaan-johan-cruijf-arena":
    "/horeca-werk",

  "/vacatures/ontbijtmedewerker":
    "/horeca-werk",

  "/vacatures/horeca-bijaan-hilton-schiphol":
    "/hotelpersoneel-inhuren",

  "/vacatures/horeca-medewerker-westergasterras":
    "/horeca-werk",

  "/vacatures/werken-bij-fc-utrecht":
    "/horeca-werk",

  "/vacatures/werken-bij-het-hart-museum":
    "/horeca-werk",

  // ── BLOG / NIEUWS ────────────────────────────────────────
  "/post/de-uurtonen-voor-2025":
    "/blog",
  "/post/bereken-je-uitzendtarief":
    "/blog",
  "/post/tegemoetkomming-studenten-financiele-ondersteuning":
    "/blog",
  "/post/handhaving-wet-dba-2025-opdrachtgevers-risicos-alternatieven":
    "/blog",
  "/post/studiebeurs-als-student":
    "/blog",

  // ── REGIO PAGINA'S ───────────────────────────────────────
  "/uitzendbureau-amsterdam":           "/horeca-uitzendbureau-amsterdam",
  "/uitzendbureau-hilversum":           "/",
  "/uitzendbureau-utrecht":             "/",
  "/uitzendbureau-bussum":              "/",
  "/logistiek-uitzendbureau":           "/",

  // ── PDF-BESTANDEN → HOMEPAGE ─────────────────────────────
  "/files/ugd/b0f6ba_187c60847d1f43b0a91d37620bbb413a.pdf": "/",
  "/files/ugd/b0f6ba_0f1721a0a66c46d6b2189339eb90142b.pdf": "/",

  // ── VOORHEEN CLIENT-SIDE REDIRECTS (App.tsx-stubs) ───────
  // Deze bestonden alleen als window.location.replace() in de SPA; crawlers
  // zonder JavaScript zagen daardoor een soft-404. Nu echte HTTP 301's.
  // De App.tsx-stubs blijven staan als fallback voor client-side navigatie.
  "/horecapersoneel-gezocht":           "/horecapersoneel-restaurants",
  "/personeel-gezocht":                 "/horeca-personeel-gezocht",
  // "/horeca-personeel-inhuren" is sinds SEO-blok 3 (P10) een eigen pagina — geen redirect meer.
  "/hoe-werkt-dagbetaling":             "/dagbetaling", // P10: nieuwe kortere URL wint
  "/landing":                           "/",            // homepage rendert landingscontent nu direct (keuze Max)
  "/hotel-personeel-gezocht":           "/hotelpersoneel-inhuren",
  "/hotel-personeel-amsterdam":         "/hotelpersoneel-inhuren",
  "/event-personeel-gezocht":           "/eventpersoneel-inhuren",
  "/evenementen-personeel-amsterdam":   "/eventpersoneel-inhuren",
  "/cateringpersoneel-gezocht":         "/cateringpersoneel-inhuren",
  "/catering-personeel-amsterdam":      "/cateringpersoneel-inhuren",
  "/restaurant-personeel-gezocht":      "/horecapersoneel-restaurants",
  "/restaurant-personeel-amsterdam":    "/horecapersoneel-restaurants",
  "/ik-zoek-extra-werk":                "/horeca-vacatures-amsterdam",
  "/ik-zoek-extra-werk/horeca":         "/horeca-werk",
  "/ik-zoek-extra-werk/chef":           "/chef-vacatures-amsterdam",
  "/ik-zoek-extra-werk/front-office":   "/front-office-vacatures-amsterdam",

  // ── OUDE (WIX-)URL'S DIE GOOGLE NOG KENT, ZONDER ROUTE ───
  // Stonden geïndexeerd maar gaven een soft-404 (200 + lege shell).
  "/werken-bij-extra":                  "/horeca-werk",
  // Let op ketens: /hoe-werkt-dagbetaling verwijst zélf door naar /dagbetaling,
  // dus dit kostte twee sprongen. Nu rechtstreeks — zie ook de ketencheck in
  // scripts/check-internal-links.ts.
  "/krijg-direct-uitbetaald":           "/dagbetaling",
  "/bijbaan-utrecht":                   "/horeca-werk",
  "/en/werk-zoeken":                    "/en/hospitality-jobs",
  "/en/uitzendbureau-hilversum":        "/",
  "/en/uitzendbureau-utrecht":          "/",

  // ── AHREFS 16 AUGUSTUS: LINK NAAR EEN 404 ────────────────
  // /werkgevers is nooit gebouwd. P15 loste dat op door de links in de code weg
  // te halen, maar één AI-gegenereerd blogartikel van vóór die fix draagt de
  // link nog in zijn HTML — en die HTML staat in de database, niet in de
  // repository, dus geen enkele build-check kan hem zien.
  // De 301 is het vangnet: hij vangt ook de externe links en de Google-index die
  // het pad nog kennen. De link in het artikel zelf wordt rechtgezet met
  // `npm run content:links:fix` (scripts/content-links.ts) — een redirect is een
  // pleister, geen reparatie.
  "/werkgevers":                        "/personeelsaanvraag",

  // ── P14-RESTPUNT: TYPEFOUT IN EEN SLUG ───────────────────
  // "minimumuurtaief" mist de r van "tarief". Het artikel heeft geen organisch
  // verkeer en één inkomende link, dus hernoemen kan zonder risico. De rij in de
  // database wordt omgezet door `npm run content:links:fix`; deze regel houdt de
  // oude URL bereikbaar voor wie hem al had.
  "/blog/minimumuurtaief-van-36--voor-zzp-ers":
    "/blog/minimumuurtarief-van-36-voor-zzp-ers",

  // ── P14: DUPLICATE CONTENT (identieke pagina, twee URL's) ───
  // Elk paar rendert vandaag dezelfde component (zie client/src/App.tsx) op
  // twee URL's — geen echte inhoudelijke duplicatie in de database, maar wel
  // twee indexeerbare paden voor precies dezelfde tekst. shared/routeMeta.ts
  // zet de canonical al langer goed (dat loste het dubbele-content-signaal al
  // op voor Google), dit voegt de daadwerkelijke 301 toe zodat bezoekers en
  // linkwaarde ook echt op de canonieke URL landen.
  "/beloningssysteem":                  "/extraatje",
  "/hoe-extra-werkt":                   "/onze-werkwijze",
  "/over-extra/ons-team":               "/ons-team",
};

/**
 * Patroon-gebaseerde 301's: voor wanneer de bestemming van elk pad hetzelfde
 * vaste voorvoegsel volgt in plaats van één-op-één in REDIRECT_MAP te passen.
 *
 * P14: /nieuws en /blog zijn twee indexpagina's voor dezelfde artikelen
 * (zelfde NieuwsPage/NieuwsArtikel-component, zie client/src/App.tsx) — /blog
 * is al de canonical in shared/routeMeta.ts. Eén vaste REDIRECT_MAP-regel per
 * artikel zou bij elk nieuw artikel weer vergeten worden; dit patroon werkt
 * voor de index én voor elke huidige én toekomstige /nieuws/:slug zonder dat
 * daar iets voor bijgehouden hoeft te worden.
 */
const REDIRECT_PATTERNS: { pattern: RegExp; to: (match: RegExpMatchArray) => string }[] = [
  { pattern: /^\/nieuws(\/.*)?$/, to: (m) => `/blog${m[1] ?? ""}` },
];

/**
 * Normaliseert een inkomend pad:
 *  - lowercase
 *  - verwijdert trailing slash (behalve root "/")
 */
export function normalizePath(p: string): string {
  const lower = p.toLowerCase();
  return lower !== "/" && lower.endsWith("/") ? lower.slice(0, -1) : lower;
}

/** Eén sprong: exacte match gaat vóór patroon. */
function eenStap(normalized: string): string | null {
  const destination = REDIRECT_MAP[normalized];
  if (destination) return destination;

  for (const { pattern, to } of REDIRECT_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) return to(match);
  }

  return null;
}

/** Hoe vaak een redirect maximaal mag doorverwijzen voordat we stoppen. */
const MAX_SPRONGEN = 5;

/**
 * Pure resolutiefunctie, los van Express — zodat REDIRECT_MAP en
 * REDIRECT_PATTERNS getest kunnen worden zonder een server op te tuigen (zie
 * server/redirects.test.ts). Geeft het bestemmingspad terug (zonder
 * query-string) of `null` als er geen match is.
 *
 * Volgt de keten door tot het pad dat niet verder doorverwijst, zodat de
 * bezoeker altijd één 301 krijgt in plaats van twee. Dat is niet alleen
 * sneller: Google geeft bij elke extra sprong minder linkwaarde door en Ahrefs
 * meldt ketens als apart probleem.
 *
 * Ketens ontstaan hier vanzelf zodra een patroon en een exacte regel elkaar
 * raken. /nieuws/:slug → /blog/:slug is een patroon; komt daar één artikel bij
 * waarvan de slug is hernoemd, dan zou /nieuws/<oude-slug> zonder deze lus in
 * twee sprongen aankomen. Dat is niet te voorkomen door regels netjes te
 * schrijven — alleen door ze door te rekenen.
 *
 * `gezien` bewaakt de cirkel (A → B → A): zodra een pad terugkomt stopt de lus
 * en geldt de laatste geldige bestemming.
 */
export function resolveRedirect(path: string): string | null {
  let huidig = normalizePath(path);
  const gezien = new Set<string>([huidig]);
  let bestemming: string | null = null;

  for (let sprong = 0; sprong < MAX_SPRONGEN; sprong++) {
    const volgende = eenStap(huidig);
    if (!volgende) break;

    const genormaliseerd = normalizePath(volgende);
    if (gezien.has(genormaliseerd)) break;

    gezien.add(genormaliseerd);
    bestemming = volgende;
    huidig = genormaliseerd;
  }

  return bestemming;
}

/**
 * Registreert een middleware die alle paden in REDIRECT_MAP en
 * REDIRECT_PATTERNS afhandelt met een HTTP 301 (permanent redirect).
 *
 * Werkt met én zonder trailing slash, en op elk domein/subdomein.
 */
export function registerRedirects(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const destination = resolveRedirect(req.path);
    if (destination) {
      // Behoud eventuele query-string (bijv. ?ref=google)
      const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
      return res.redirect(301, destination + qs);
    }

    next();
  });
}
