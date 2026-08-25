/**
 * BUILD-CHECK — staat elke indexeerbare route in het pagina-register?
 *
 * Waarom dit een check is en geen afspraak: een register dat je met de hand
 * bijhoudt, is binnen twee maanden verouderd en daarmee erger dan geen
 * register. Deze check dwingt af dat een nieuwe indexeerbare pagina niet
 * gebouwd kan worden zonder dat iemand heeft opgeschreven welk zoekwoordcluster
 * hij claimt — precies het moment waarop cannibalisatie ontstaat.
 *
 * Wat hij níét doet: beoordelen of de ingevulde intentie klopt. Dat kan geen
 * script. Hij bewaakt alleen dat de vraag gesteld is.
 *
 * Draait mee in `npm run build` en los via `npm run register:check`.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ROUTE_META } from "../shared/routeMeta";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REGISTER = path.join(HIER, "..", "docs", "PAGINA-REGISTER.md");

/**
 * Routes die bewust geen zoekdoel hebben en dus geen cluster kunnen bezitten.
 * Ze zijn indexeerbaar noch relevant voor cannibalisatie, of ze staan al op
 * noindex — die laatste filtert de check zelf al weg.
 */
const BUITEN_REGISTER = new Set<string>([]);

/** Haalt alle paden uit de eerste kolom van de markdown-tabellen. */
export function padenUitRegister(markdown: string): Set<string> {
  const paden = new Set<string>();
  for (const regel of markdown.split("\n")) {
    // | `/pad` | ... — alleen de eerste cel, en alleen als hij een pad is
    const m = regel.match(/^\|\s*`(\/[^`]*)`\s*\|/);
    if (m) paden.add(m[1]);
  }
  return paden;
}

function main() {
  if (!fs.existsSync(REGISTER)) {
    console.error(`✗ Register ontbreekt: ${path.relative(process.cwd(), REGISTER)}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(REGISTER, "utf8");
  const inRegister = padenUitRegister(markdown);

  const indexeerbaar = ROUTE_META.filter((m) => !m.noindex).map((m) => m.path);
  const ontbreekt = indexeerbaar.filter(
    (p) => !inRegister.has(p) && !BUITEN_REGISTER.has(p),
  );

  // Andersom ook: een register-entry voor een route die niet meer bestaat is
  // dode documentatie en verbergt dat een pagina is verdwenen.
  const bestaandePaden = new Set(ROUTE_META.map((m) => m.path));
  const verweesd = [...inRegister].filter((p) => !bestaandePaden.has(p));

  if (ontbreekt.length === 0 && verweesd.length === 0) {
    console.log(
      `✓ Register compleet: ${indexeerbaar.length} indexeerbare routes, allemaal vastgelegd.`,
    );
    return;
  }

  if (ontbreekt.length > 0) {
    console.error(`✗ ${ontbreekt.length} indexeerbare route(s) staan niet in het register:`);
    for (const p of ontbreekt) console.error(`    ${p}`);
    console.error(
      `\n  Voeg ze toe aan docs/PAGINA-REGISTER.md met paginatype, zoekintentie,\n` +
      `  keywordcluster, doelgroep, conversiedoel en CTA. Claimt de pagina een\n` +
      `  cluster dat al eigendom is, dan hoort het een wijziging aan de bestaande\n` +
      `  pagina te zijn — geen nieuwe pagina.`,
    );
  }

  if (verweesd.length > 0) {
    console.error(`\n✗ ${verweesd.length} register-entry('s) verwijzen naar een route die niet bestaat:`);
    for (const p of verweesd) console.error(`    ${p}`);
    console.error(`\n  Is de pagina verwijderd, haal de rij dan weg. Is de URL gewijzigd,\n` +
      `  werk de rij bij — en controleer of de 301 er staat.`);
  }

  process.exit(1);
}

main();
