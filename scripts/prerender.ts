/**
 * PRERENDER — genereert statische HTML-fragmenten voor publieke marketingroutes.
 *
 * Draaien met: npm run prerender   (vereist een verse `vite build` in dist/public
 * en een Chromium-installatie; draait NIET automatisch mee in de deploy-build,
 * omdat de Replit-buildomgeving geen browser heeft. De fragmenten worden in
 * client/public/prerender/ gecommit en komen zo bij elke build mee in dist.)
 *
 * Werking: serveert dist/public lokaal (zonder API — routes die data fetchen
 * renderen hun statische deel), rendert elke route met prerender:true in
 * headless Chromium en schrijft de innerHTML van #root weg als fragment.
 * server/seo.ts injecteert dat fragment in de shell zodat crawlers zonder
 * JavaScript de volledige content zien. Fragmenten bevatten geen <script>-tags
 * (behalve JSON-LD), dus verwijzen nooit naar verouderde build-assets.
 *
 * OPNIEUW DRAAIEN wanneer de content van publieke pagina's wijzigt.
 */
import fs from "fs";
import path from "path";
import http from "http";
import { chromium } from "playwright-core";
import { ROUTE_META, normalizeMetaPath } from "../shared/routeMeta";

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

  // Mini statische server met SPA-fallback; /api/* geeft 404 zodat
  // react-query-fetches netjes falen en pagina's hun statische deel tonen.
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath.startsWith("/api")) { res.writeHead(404); return res.end("{}"); }
    let file = path.join(DIST, urlPath);
    if (!path.relative(DIST, file).startsWith("..") && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
      return fs.createReadStream(file).pipe(res);
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream(path.join(DIST, "index.html")).pipe(res);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const port = (server.address() as any).port;

  const executablePath = process.env.PRERENDER_CHROMIUM ||
    fs.readdirSync("/opt/pw-browsers").filter(d => /^chromium-\d+$/.test(d))
      .map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`).find(p => fs.existsSync(p));
  const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  // Analytics/fonts extern niet nodig tijdens prerender
  await page.route(/googletagmanager|google-analytics|ahrefs|fonts\.googleapis|fonts\.gstatic/, (r) => r.abort());

  fs.mkdirSync(OUT_COMMITTED, { recursive: true });
  fs.mkdirSync(OUT_DIST, { recursive: true });

  const routes = ROUTE_META.filter((m) => m.prerender && !m.noindex);
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
  if (skipped.length) {
    console.log(`Overgeslagen (vallen terug op alleen meta-injectie):\n  - ${skipped.join("\n  - ")}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
