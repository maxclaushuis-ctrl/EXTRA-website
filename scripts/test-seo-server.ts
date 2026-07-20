/**
 * Integratietest voor de SEO-serverlaag (server/seo.ts + server/redirects.ts).
 * Draait een minimale Express-app met alleen static + redirects + SEO-catch-all
 * (geen database nodig) en controleert statuscodes, titles, canonicals en 404's.
 *
 * Draaien met: npx tsx scripts/test-seo-server.ts
 */
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";

import path from "path";
import express from "express";
import { registerRedirects } from "../server/redirects";
import { registerSeoCatchAll } from "../server/seo";

const DIST = path.resolve(import.meta.dirname, "..", "dist", "public");

async function main() {
  const app = express();
  registerRedirects(app);
  app.use(express.static(DIST, { index: false }));
  registerSeoCatchAll(app, DIST);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;

  let failed = 0;
  const check = async (
    name: string,
    url: string,
    expect: { status: number; contains?: string[]; notContains?: string[]; redirectsTo?: string }
  ) => {
    const res = await fetch(base + url, { redirect: "manual" });
    const body = expect.redirectsTo ? "" : await res.text();
    const problems: string[] = [];
    if (res.status !== expect.status) problems.push(`status ${res.status} (verwacht ${expect.status})`);
    if (expect.redirectsTo && res.headers.get("location") !== expect.redirectsTo)
      problems.push(`location ${res.headers.get("location")} (verwacht ${expect.redirectsTo})`);
    for (const s of expect.contains || []) if (!body.includes(s)) problems.push(`mist: ${s}`);
    for (const s of expect.notContains || []) if (body.includes(s)) problems.push(`bevat onterecht: ${s}`);
    if (problems.length) { failed++; console.error(`✗ ${name}: ${problems.join("; ")}`); }
    else console.log(`✓ ${name}`);
  };

  await check("homepage: eigen meta + prerendered content", "/", {
    status: 200,
    contains: [
      "<title>Horeca uitzendbureau Amsterdam | EXTRA</title>",
      '<link rel="canonical" href="https://www.doehetextra.nl/"',
      "<h1",
    ],
  });
  await check("pillarpagina: unieke title + self-canonical + h1 in raw HTML", "/horeca-uitzendbureau-amsterdam", {
    status: 200,
    contains: [
      "<title>Horeca uitzendbureau Amsterdam | Persoonlijk | EXTRA</title>",
      'canonical" href="https://www.doehetextra.nl/horeca-uitzendbureau-amsterdam"',
      "<h1",
    ],
    notContains: ['<div id="root"></div>'],
  });
  await check("duplicaat /nieuws → canonical /blog", "/nieuws", {
    status: 200,
    contains: ['canonical" href="https://www.doehetextra.nl/blog"'],
  });
  await check("hoofdletters: /PRIVACYBELEID matcht met juiste canonical", "/PRIVACYBELEID", {
    status: 200,
    contains: ['canonical" href="https://www.doehetextra.nl/privacybeleid"'],
  });
  await check("onbekend pad → echte 404 + noindex", "/deze-pagina-bestaat-niet", {
    status: 404,
    contains: ['name="robots" content="noindex, nofollow"', "Pagina niet gevonden"],
  });
  await check("voorheen client-side redirect → server 301", "/personeel-gezocht", {
    status: 301,
    redirectsTo: "/horeca-personeel-gezocht",
  });
  await check("oude Wix-URL die Google nog kent → 301", "/werken-bij-extra", {
    status: 301,
    redirectsTo: "/horeca-werk",
  });
  await check("interne route → noindex", "/dashboard", {
    status: 200,
    contains: ['name="robots" content="noindex, nofollow"'],
  });
  await check("Engelse pagina → lang=en", "/en/hospitality-staff-amsterdam", {
    status: 200,
    contains: ['<html lang="en">', "<h1"],
  });
  await check("bestandspad zonder match → geen HTML-shell", "/bestaat-niet.js", { status: 404 });

  server.close();
  if (failed) { console.error(`\n✗ ${failed} test(s) gefaald`); process.exit(1); }
  console.log("\n✓ Alle SEO-servertests geslaagd");
}

main().catch((e) => { console.error(e); process.exit(1); });
