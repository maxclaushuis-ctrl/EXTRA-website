/**
 * Schrijft shared/paginaDatums.ts: per vaste pagina de dag waarop de inhoud
 * voor het laatst is gewijzigd. sitemap.xml gebruikt dit als <lastmod>.
 *
 *   npm run datums
 *
 * Bron: de laatste commit die het geprerenderde fragment van de pagina raakte
 * (client/public/prerender/<pagina>.html). Dat fragment verandert alleen als
 * de zichtbare inhoud verandert. Draai dit script daarom na elke prerender,
 * vóór de commit; een fragment met nog niet vastgelegde wijzigingen krijgt de
 * datum van vandaag.
 *
 * Draait alleen waar de git-geschiedenis beschikbaar is (niet in de build).
 */
import { execFileSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import path from "path";
import { ROUTE_META, normalizeMetaPath } from "../shared/routeMeta";

const MAP = "client/public/prerender";
const git = (args: string[]) => execFileSync("git", args, { encoding: "utf-8" }).trim();
const vandaag = new Date().toISOString().slice(0, 10);

const datums: Record<string, string> = {};
for (const m of ROUTE_META) {
  if (m.noindex || m.canonical) continue;
  const n = normalizeMetaPath(m.path);
  const bestand = path.join(MAP, (n === "/" ? "index" : n.slice(1).replace(/\//g, "__")) + ".html");
  if (!existsSync(bestand)) continue;
  const gewijzigd = git(["status", "--porcelain", "--", bestand]) !== "";
  const datum = gewijzigd ? vandaag : git(["log", "-1", "--format=%as", "--", bestand]);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datum)) datums[m.path] = datum;
}

const regels = Object.keys(datums).sort().map((p) => `  ${JSON.stringify(p)}: ${JSON.stringify(datums[p])},`);
writeFileSync(
  "shared/paginaDatums.ts",
  `// GEGENEREERD door scripts/pagina-datums.ts (npm run datums). Niet met de hand aanpassen.\n` +
  `// Per vaste pagina de dag waarop de inhoud voor het laatst is gewijzigd; bron voor <lastmod> in sitemap.xml.\n` +
  `export const PAGINA_DATUMS: Record<string, string> = {\n${regels.join("\n")}\n};\n`,
);
const telling: Record<string, number> = {};
for (const d of Object.values(datums)) telling[d] = (telling[d] || 0) + 1;
console.log(`${regels.length} pagina's met een datum.`);
for (const d of Object.keys(telling).sort()) console.log(`  ${d}  ${telling[d]}`);
