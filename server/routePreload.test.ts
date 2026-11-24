/**
 * Unit-tests voor server/routePreload.ts
 * Run met:  npx tsx server/routePreload.test.ts
 *
 * Geen test-framework: print ✓/✗ en exit non-zero bij fouten.
 */
import fs from "fs";
import path from "path";
import { paginaSleutels, preloadTags, voegPreloadToe, type ViteManifest } from "./routePreload";

let passed = 0;
let failed = 0;
function ok(label: string, voorwaarde: boolean, extra?: string) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${extra ? `\n      ${extra}` : ""}`); }
}
function eq(label: string, actual: unknown, expected: unknown) {
  const gelijk = JSON.stringify(actual) === JSON.stringify(expected);
  ok(label, gelijk, gelijk ? undefined : `actual: ${JSON.stringify(actual)}  expected: ${JSON.stringify(expected)}`);
}

// Zoals Vite 5 hem schrijft (sleutels relatief aan client/).
const M: ViteManifest = {
  "index.html": { file: "assets/index-abc.js", isEntry: true, imports: ["_vendor-react-1.js"], css: ["assets/index-x.css"], dynamicImports: ["src/pages/d3/Home.tsx"] },
  "_vendor-react-1.js": { file: "assets/vendor-react-1.js" },
  "src/pages/d3/Home.tsx": { file: "assets/Home-2.js", imports: ["_basis-3.js", "_vendor-react-1.js", "index.html"], css: ["assets/Home-2.css"] },
  "_basis-3.js": { file: "assets/basis-3.js", imports: ["_gedrag-4.js"], css: ["assets/basis-3.css"] },
  "_gedrag-4.js": { file: "assets/gedrag-4.js", imports: ["_basis-3.js"] },
  "src/design3/Fragment.tsx": { file: "assets/Fragment-5.js", imports: ["_basis-3.js"] },
  "src/design3/paginas/hotels.ts": { file: "assets/hotels-6.js" },
  "src/design3/paginas/en-about.ts": { file: "assets/en-about-7.js" },
  "src/pages/d3/Blog.tsx": { file: "assets/Blog-8.js", imports: ["_basis-3.js"] },
  "src/pages/VacatureDetail.tsx": { file: "assets/VacatureDetail-9.js" },
};

console.log("\npaginaSleutels");
eq("homepage", paginaSleutels("/", M), ["src/pages/d3/Home.tsx"]);
eq("fragmentpagina krijgt sjabloon en inhoud", paginaSleutels("/hotels", M), ["src/design3/Fragment.tsx", "src/design3/paginas/hotels.ts"]);
eq("Engelse pagina: slash wordt streepje", paginaSleutels("/en/about", M), ["src/design3/Fragment.tsx", "src/design3/paginas/en-about.ts"]);
eq("afsluitende slash en hoofdletters", paginaSleutels("/Hotels/", M), ["src/design3/Fragment.tsx", "src/design3/paginas/hotels.ts"]);
eq("blogoverzicht", paginaSleutels("/blog", M), ["src/pages/d3/Blog.tsx"]);
eq("blogartikel", paginaSleutels("/blog/kok-inhuren", M), ["src/pages/d3/Blog.tsx"]);
eq("vacature", paginaSleutels("/vacatures/afwasser-x", M), ["src/pages/VacatureDetail.tsx"]);
eq("vaste pagina die niet in het manifest staat", paginaSleutels("/vacatures", M), []);
eq("onbekend pad", paginaSleutels("/bestaat-niet", M), []);
eq("leeg manifest", paginaSleutels("/", {}), []);

console.log("\npreloadTags");
const home = preloadTags("/", M);
ok("Home-chunk erin", home.includes('<link rel="modulepreload" crossorigin href="/assets/Home-2.js">'));
ok("statische imports erin (basis, gedrag)", home.includes("/assets/basis-3.js") && home.includes("/assets/gedrag-4.js"));
ok("CSS van de pagina en van basis als preload", home.includes('<link rel="preload" as="style" href="/assets/Home-2.css">') && home.includes('href="/assets/basis-3.css"'));
ok("wat index.html al laadt niet nog eens (entry, vendor-react, index.css)", !home.includes("index-abc.js") && !home.includes("vendor-react") && !home.includes("index-x.css"));
eq("kringverwijzing basis en gedrag geeft geen dubbele tags", home.split("basis-3.js").length - 1, 1);
ok("CSS staat voor de scripts", home.indexOf("as=\"style\"") < home.indexOf("modulepreload"));
eq("onbekend pad: geen tags", preloadTags("/bestaat-niet", M), "");
eq("geen manifest: geen tags", preloadTags("/", {}), "");
ok("fragmentpagina laadt sjabloon, inhoud en basis", ["Fragment-5.js", "hotels-6.js", "basis-3.js"].every((f) => preloadTags("/hotels", M).includes(f)));

console.log("\nvoegPreloadToe");
eq("zonder tags blijft de HTML gelijk", voegPreloadToe("<head><title>x</title></head>", ""), "<head><title>x</title></head>");
eq("tags vlak voor </head>", voegPreloadToe("<head><title>x</title></head>", "<link>"), "<head><title>x</title><link>\n</head>");

console.log("\nApp.tsx: elke fragmentroute volgt de naamregel");
const app = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/App.tsx"), "utf-8");
const sleutelVan = new Map(Array.from(app.matchAll(/const (\w+) = maakFragmentRoute\("([^"]+)"\)/g), (m) => [m[1], m[2]] as const));
const routes = Array.from(app.matchAll(/<Route path="([^"]+)" component=\{(\w+)\}/g)).filter((m) => sleutelVan.has(m[2]));
ok(`fragmentroutes gevonden (${routes.length})`, routes.length > 50);
const afwijkend = routes.filter(([, pad, c]) => pad.replace(/^\//, "").replace(/\//g, "-") !== sleutelVan.get(c)).map(([, pad]) => pad);
eq("geen afwijkende routes", afwijkend, []);
const vast = ["@/pages/d3/Home", "@/pages/d3/Blog", "@/pages/Vacatures", "@/pages/VacatureDetail", "@/pages/d3/Aanvraag", "@/pages/d3/Aanmelden"];
eq("de vaste pagina's bestaan als lazy import in App.tsx", vast.filter((v) => !app.includes(`import("${v}")`)), []);

console.log(`\n${passed} geslaagd, ${failed} mislukt`);
process.exit(failed > 0 ? 1 : 0);
