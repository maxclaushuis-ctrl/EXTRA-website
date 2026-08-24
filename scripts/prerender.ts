/**
 * PRERENDER — genereert statische HTML-fragmenten voor publieke marketingroutes.
 *
 * Draaien met: npm run prerender   (vereist een verse `vite build` in dist/public
 * en een Chromium-installatie; draait NIET automatisch mee in de deploy-build,
 * omdat de Replit-buildomgeving geen browser heeft. De fragmenten worden in
 * client/public/prerender/ gecommit en komen zo bij elke build mee in dist.)
 *
 * Werking: serveert dist/public lokaal en rendert elke route met prerender:true
 * uit shared/routeMeta.ts in headless Chromium, plus (sinds P11) elke
 * gepubliceerde vacature (/vacatures/:slug) en elk gepubliceerd blogartikel
 * (/blog/:slug en /nieuws/:slug — beide routes serveren dezelfde content, zie
 * de opmerking bij DYNAMIC_ROUTE_PATTERNS), opgehaald uit de database. Zonder
 * databasetoegang zouden deze pagina's alleen hun laad-spinner tonen: ze
 * fetchen hun content client-side bij /api/vacatures/:slug en /api/blog/:slug.
 * Daarom praat de lokale server hieronder voor die twee endpoints (en hun
 * lijst-varianten /api/vacatures en /api/blog) echt met de database, verder
 * blijft alles onder /api/* een 404 (routes die data fetchen tonen dan hun
 * statische deel).
 *
 * Vereist DATABASE_URL om de dynamische routes te genereren. Zonder
 * DATABASE_URL slaat het script die routes over (met een duidelijke
 * waarschuwing) en genereert het alleen de statische fragmenten — handig om
 * lokaal te draaien zonder databasetoegang, maar run het daarna alsnog in een
 * omgeving mét DATABASE_URL voordat je deployt, anders blijven de
 * vacature-/blogpagina's een lege shell serveren.
 *
 * Schrijft de innerHTML van #root weg als fragment; server/seo.ts injecteert
 * dat fragment in de shell zodat crawlers zonder JavaScript de volledige
 * content zien. Fragmenten bevatten geen <script>-tags (behalve JSON-LD), dus
 * verwijzen nooit naar verouderde build-assets.
 *
 * Faalt hard (exit 1) zodra een route die daadwerkelijk geprobeerd is geen
 * bruikbaar fragment opleverde — dat is de plek waar we willen weten dat een
 * publieke pagina leeg blijft, niet pas bij de volgende crawl.
 *
 * OPNIEUW DRAAIEN wanneer de content van publieke pagina's wijzigt.
 */
import fs from "fs";
import path from "path";
import http from "http";
import { chromium } from "playwright-core";
import { ROUTE_META, normalizeMetaPath } from "../shared/routeMeta";

interface PrerenderRoute {
  path: string;
  /** true = uit de database opgehaald; ontbrekend fragment faalt de build altijd. */
  dynamic?: boolean;
}

/** Minimale vorm van server/storage die dit script nodig heeft. */
interface DynamicContentSource {
  getBlogPosts(filters?: { status?: string; category?: string; limit?: number; offset?: number }): Promise<{ posts: any[]; total: number }>;
  getBlogPostBySlug(slug: string): Promise<any | undefined>;
  getVacancyPosts(filters?: { status?: string; functionType?: string; location?: string; limit?: number; offset?: number }): Promise<{ posts: any[]; total: number }>;
  getVacancyPostBySlug(slug: string): Promise<any | undefined>;
}

/**
 * Bouwt een DynamicContentSource op basis van een lokaal JSON-bestand
 * ({ posts: BlogPost[], vacancies: VacancyPost[] }), voor omgevingen zonder
 * databasetoegang (bijv. deze cloud-sandbox) maar met wél een export van een
 * omgeving die die toegang wel heeft — zie scripts/export-dynamic-content.ts.
 * Puur read-only, spiegelt exact wat /api/vacatures en /api/blog al publiek
 * teruggeven.
 */
function jsonContentSource(jsonPath: string): DynamicContentSource {
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const posts: any[] = raw.posts || [];
  const vacancies: any[] = raw.vacancies || [];
  return {
    async getBlogPosts(filters) {
      const filtered = posts.filter((p) => !filters?.status || p.status === filters.status);
      return { posts: filtered, total: filtered.length };
    },
    async getBlogPostBySlug(slug) {
      return posts.find((p) => p.slug === slug);
    },
    async getVacancyPosts(filters) {
      const filtered = vacancies.filter((v) => !filters?.status || v.status === filters.status);
      return { posts: filtered, total: filtered.length };
    },
    async getVacancyPostBySlug(slug) {
      return vacancies.find((v) => v.slug === slug);
    },
  };
}

/**
 * Dynamische import van server/storage, één keer geprobeerd en gecachet.
 * server/db.ts gooit bij import direct een fout als DATABASE_URL ontbreekt —
 * vandaar de dynamische import in plaats van een top-level import, zodat het
 * hele script niet crasht wanneer er (bewust) geen databasetoegang is.
 *
 * PRERENDER_DYNAMIC_JSON gaat vóór DATABASE_URL: handig in een omgeving die
 * geen databasetoegang heeft maar wel een export daarvan gekregen heeft.
 */
let storagePromise: Promise<DynamicContentSource | null> | null = null;
function getStorage(): Promise<DynamicContentSource | null> {
  if (!storagePromise) {
    if (process.env.PRERENDER_DYNAMIC_JSON) {
      try {
        storagePromise = Promise.resolve(jsonContentSource(process.env.PRERENDER_DYNAMIC_JSON));
      } catch (err: any) {
        console.error(`✗ Kon PRERENDER_DYNAMIC_JSON niet lezen: ${err.message}`);
        storagePromise = Promise.resolve(null);
      }
    } else {
      storagePromise = !process.env.DATABASE_URL
        ? Promise.resolve(null)
        : import("../server/storage").then((m) => m.storage).catch((err) => {
            console.error(`✗ Kon server/storage niet laden: ${err.message}`);
            return null;
          });
    }
  }
  return storagePromise;
}

/**
 * Haalt alle gepubliceerde vacatures en blogartikelen op zodat elke slug een
 * eigen fragment krijgt. Retourneert een lege lijst (met waarschuwing) als er
 * geen databasetoegang is — dat is bewust geen fatale fout, zie de uitleg
 * hierboven.
 */
async function fetchDynamicRoutes(): Promise<PrerenderRoute[]> {
  const storage = await getStorage();
  if (!storage) {
    console.warn(
      "⚠ Geen databasetoegang (DATABASE_URL niet gezet en geen geldige PRERENDER_DYNAMIC_JSON) " +
        "— vacature- en blogpagina's worden overgeslagen. Draai `npm run prerender` in een " +
        "omgeving met databasetoegang, of geef PRERENDER_DYNAMIC_JSON mee met een export uit " +
        "scripts/export-dynamic-content.ts, om die fragmenten te genereren."
    );
    return [];
  }
  try {
    const [{ posts }, { posts: vacancies }] = await Promise.all([
      storage.getBlogPosts({ status: "published", limit: 500 }),
      storage.getVacancyPosts({ status: "published", limit: 500 }),
    ]);
    const routes: PrerenderRoute[] = [];
    for (const p of posts) {
      // Vóór P14 kreeg /nieuws/:slug hier ook een eigen fragment: /blog/:slug
      // en /nieuws/:slug serveerden identieke content via twee los crawlbare
      // routes. P14 maakte /nieuws/:slug een echte server-side 301 naar
      // /blog/:slug (server/redirects.ts) — dat pad wordt dus nooit meer met
      // een 200 geserveerd, dus een fragment ervoor genereren is verspilde
      // moeite bij elke toekomstige nieuwe blogpost.
      routes.push({ path: `/blog/${p.slug}`, dynamic: true });
    }
    for (const v of vacancies) routes.push({ path: `/vacatures/${v.slug}`, dynamic: true });
    return routes;
  } catch (err: any) {
    console.error(`✗ Kon vacatures/blogartikelen niet ophalen uit de database: ${err.message}`);
    console.error("  Vacature- en blogpagina's worden overgeslagen voor deze run.");
    return [];
  }
}

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist", "public");
const OUT_COMMITTED = path.join(ROOT, "client", "public", "prerender");
const OUT_DIST = path.join(DIST, "prerender");

const MIME: Record<string, string> = {
  ".html": "text/html", ".js": "application/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".json": "application/json", ".woff2": "font/woff2", ".txt": "text/plain",
};

function fragmentFileName(routePath: string): string {
  const n = normalizeMetaPath(routePath);
  return (n === "/" ? "index" : n.slice(1).replace(/\//g, "__")) + ".html";
}

async function main() {
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    console.error(`✗ ${DIST}/index.html ontbreekt — draai eerst \`vite build\`.`);
    process.exit(1);
  }

  // Mini statische server met SPA-fallback. De vacature-/blogpagina's fetchen
  // hun content client-side (react-query) bij /api/vacatures[/:slug] en
  // /api/blog[/:slug] — zonder een echt antwoord zien ze alleen hun
  // laad-spinner. Die vier read-only endpoints praten daarom, als er
  // databasetoegang is, écht met de database (zelfde logica als de bijbehorende
  // routes in server/routes.ts). Al het andere onder /api/* blijft een 404,
  // zodat overige react-query-fetches netjes falen en pagina's hun statische
  // deel tonen.
  const server = http.createServer(async (req, res) => {
    const [urlPath, qs] = (req.url || "/").split("?");
    const decodedPath = decodeURIComponent(urlPath);
    if (decodedPath.startsWith("/api")) {
      const storage = await getStorage();
      const query = new URLSearchParams(qs || "");
      try {
        let vacSlugMatch, blogSlugMatch;
        if (storage && decodedPath === "/api/vacatures") {
          const result = await storage.getVacancyPosts({
            status: query.get("status") || "published",
            functionType: query.get("functionType") || undefined,
            location: query.get("location") || undefined,
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify(result));
        }
        if (storage && decodedPath === "/api/blog") {
          const result = await storage.getBlogPosts({
            status: "published",
            category: query.get("category") || undefined,
            limit: query.get("limit") ? parseInt(query.get("limit")!) : undefined,
            offset: query.get("offset") ? parseInt(query.get("offset")!) : undefined,
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify(result));
        }
        if (storage && (vacSlugMatch = decodedPath.match(/^\/api\/vacatures\/([^/]+)$/))) {
          const vacancy = await storage.getVacancyPostBySlug(decodeURIComponent(vacSlugMatch[1]));
          if (!vacancy || vacancy.status !== "published") {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ message: "Niet gevonden" }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify(vacancy));
        }
        if (storage && (blogSlugMatch = decodedPath.match(/^\/api\/blog\/([^/]+)$/))) {
          const post = await storage.getBlogPostBySlug(decodeURIComponent(blogSlugMatch[1]));
          if (!post || post.status !== "published") {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Niet gevonden" }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify(post));
        }
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.message }));
      }
      res.writeHead(404);
      return res.end("{}");
    }
    let file = path.join(DIST, decodedPath);
    if (!path.relative(DIST, file).startsWith("..") && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
      return fs.createReadStream(file).pipe(res);
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream(path.join(DIST, "index.html")).pipe(res);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const port = (server.address() as any).port;

  // /opt/pw-browsers is specifiek voor de cloud-sandbox waarin dit script
  // ontwikkeld is en bestaat niet overal (bijv. niet in Replit) — als die map
  // ontbreekt, valt dit terug op Playwright's eigen browserresolutie (werkt
  // zodra `npx playwright install chromium` is gedraaid), in plaats van hier
  // hard te crashen.
  const executablePath = process.env.PRERENDER_CHROMIUM || (() => {
    try {
      return fs.readdirSync("/opt/pw-browsers").filter(d => /^chromium-\d+$/.test(d))
        .map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`).find(p => fs.existsSync(p));
    } catch {
      return undefined;
    }
  })();
  const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  // Analytics/fonts extern niet nodig tijdens prerender
  await page.route(/googletagmanager|google-analytics|ahrefs|promptwatch|fonts\.googleapis|fonts\.gstatic/, (r) => r.abort());

  fs.mkdirSync(OUT_COMMITTED, { recursive: true });
  fs.mkdirSync(OUT_DIST, { recursive: true });

  // P18: prerenderen is een crawlbaarheids-keuze (ook voor JS-loze AI-crawlers
  // die geen JavaScript uitvoeren), los van of een route in de zoekresultaten
  // hoort te staan — dat laatste regelt noindex al in server/seo.ts. Vóór P18
  // vielen die twee samen (elke noindex-route had ook prerender: false), maar
  // /BHG-group en /xebia zijn nu noindex: true mét prerender: true: bewust
  // niet in Google, maar nog altijd een volwaardige, direct deelbare
  // klantpagina die niet als lege shell moet laden.
  const staticRoutes: PrerenderRoute[] = ROUTE_META
    .filter((m) => m.prerender)
    .map((m) => ({ path: m.path }));
  const dynamicRoutes = await fetchDynamicRoutes();
  const routes: PrerenderRoute[] = [...staticRoutes, ...dynamicRoutes];
  let ok = 0, skipped: string[] = [];

  for (const route of routes) {
    try {
      await page.goto(`http://127.0.0.1:${port}${route.path}`, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(500);
      let fragment: string = await page.evaluate(() => {
        const root = document.getElementById("root");
        if (!root) return "";
        // Scripts strippen behalve JSON-LD: fragmenten mogen nooit naar
        // (verouderde) gehashte build-assets verwijzen.
        const clone = root.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("script:not([type='application/ld+json'])").forEach((s) => s.remove());
        clone.querySelectorAll("iframe").forEach((s) => s.remove());
        // Pagina-specifieke JSON-LD die componenten in de <head> injecteren
        // (FAQPage/LocalBusiness/JobPosting via addSchema, herkenbaar aan een id)
        // hoort ook bij de prerendered content — anders zien crawlers zonder JS hem niet.
        const headSchemas = Array.from(
          document.head.querySelectorAll("script[type='application/ld+json'][id]")
        )
          .map((s) => `<script type="application/ld+json">${s.textContent}</script>`)
          .join("\n");
        return clone.innerHTML + (headSchemas ? `\n${headSchemas}` : "");
      });
      const h1Count = (fragment.match(/<h1[\s>]/g) || []).length;
      if (!fragment || fragment.length < 500 || h1Count === 0) {
        skipped.push(`${route.path} (fragment ${fragment.length}b, ${h1Count} h1)`);
        continue;
      }
      const file = fragmentFileName(route.path);
      fs.writeFileSync(path.join(OUT_COMMITTED, file), fragment);
      fs.writeFileSync(path.join(OUT_DIST, file), fragment);
      ok++;
      console.log(`✓ ${route.path} → prerender/${file} (${Math.round(fragment.length / 1024)}kB, ${h1Count} h1)`);
    } catch (err: any) {
      skipped.push(`${route.path} (${err.message?.slice(0, 80)})`);
    }
  }

  await browser.close();
  server.close();
  console.log(`\nKlaar: ${ok}/${routes.length} routes geprerenderd.`);
  if (dynamicRoutes.length === 0) {
    console.log(
      "Let op: 0 vacature-/blogroutes geprobeerd (zie waarschuwing hierboven over " +
        "DATABASE_URL) — die pagina's blijven een lege shell serveren tot dit script " +
        "in een omgeving met databasetoegang draait."
    );
  }
  if (skipped.length) {
    // Elke route hier IS daadwerkelijk geprobeerd (statisch, of dynamisch met
    // werkende databasetoegang) en leverde geen bruikbaar fragment op — dat is
    // altijd een echt probleem, dus laat de build hier hard op stuklopen in
    // plaats van straks pas bij de volgende crawl te ontdekken dat een
    // publieke pagina leeg is.
    console.error(`✗ ${skipped.length} route(s) zonder bruikbaar fragment:\n  - ${skipped.join("\n  - ")}`);
    process.exit(1);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
