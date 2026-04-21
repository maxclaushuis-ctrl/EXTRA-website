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
};

/**
 * Normaliseert een inkomend pad:
 *  - lowercase
 *  - verwijdert trailing slash (behalve root "/")
 */
function normalizePath(p: string): string {
  const lower = p.toLowerCase();
  return lower !== "/" && lower.endsWith("/") ? lower.slice(0, -1) : lower;
}

/**
 * Registreert een middleware die alle paden in REDIRECT_MAP
 * afhandelt met een HTTP 301 (permanent redirect).
 *
 * Werkt met én zonder trailing slash, en op elk domein/subdomein.
 */
export function registerRedirects(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const normalized = normalizePath(req.path);
    const destination = REDIRECT_MAP[normalized];

    if (destination) {
      // Behoud eventuele query-string (bijv. ?ref=google)
      const qs = req.url.includes("?")
        ? req.url.slice(req.url.indexOf("?"))
        : "";
      return res.redirect(301, destination + qs);
    }

    next();
  });
}
