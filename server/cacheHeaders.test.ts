/**
 * Huistest voor cacheVoor (server/cacheHeaders.ts).
 * Draaien: npx tsx server/cacheHeaders.test.ts
 */
import { cacheVoor } from "./cacheHeaders";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`  ✓ ${naam}`); } else { gefaald++; console.log(`  ✗ ${naam}`); }
}

test("Vite-bundel: een jaar, onveranderlijk", cacheVoor("/assets/index-abc123.js") === "public, max-age=31536000, immutable");
test("lettertype design 3.0: een jaar", cacheVoor("/d3/fraunces-italic.woff2") === "public, max-age=31536000");
test("foto design 3.0: dertig dagen", cacheVoor("/d3/bellboy.webp")!.startsWith("public, max-age=2592000"));
test("logo svg: dertig dagen", cacheVoor("/d3/logo-w.svg")!.startsWith("public, max-age=2592000"));
test("querystring telt niet", cacheVoor("/d3/bellboy.webp?v=2")!.startsWith("public, max-age=2592000"));
test("hoofdletters in de extensie", cacheVoor("/images/Team.JPG")!.startsWith("public, max-age=2592000"));
test("html-pagina: niets", cacheVoor("/hotelpersoneel-inhuren") === null);
test("api: niets", cacheVoor("/api/vacatures") === null);
test("pitchdeck-foto: niets", cacheVoor("/pitchdeck/app-extraatje-horeca.webp") === null);
test("sitemap: niets", cacheVoor("/sitemap.xml") === null);

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
