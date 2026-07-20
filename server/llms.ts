/**
 * /llms.txt en /llms-full.txt (llmstxt.org-conventie) — P6 uit de SEO-audit.
 *
 * Beide worden dynamisch gegenereerd uit shared/routeMeta.ts (dus ze groeien
 * automatisch mee met nieuwe routes) en geserveerd als text/plain met HTTP 200
 * op exact deze paden. /llms-full.txt bevat daarnaast de volledige tekstinhoud
 * van de belangrijkste pagina's, geëxtraheerd uit de prerendered fragmenten.
 */
import fs from "fs";
import path from "path";
import type { Express, Request, Response } from "express";
import { ROUTE_META, SITE_ORIGIN, normalizeMetaPath } from "@shared/routeMeta";

const GROUPS: { heading: string; paths: string[] }[] = [
  {
    heading: "Personeel aanvragen (voor werkgevers)",
    paths: [
      "/personeelsaanvraag",
      "/horeca-personeel-gezocht",
      "/hotelpersoneel-inhuren",
      "/eventpersoneel-inhuren",
      "/cateringpersoneel-inhuren",
      "/horecapersoneel-restaurants",
      "/flexibel-horeca-personeel",
    ],
  },
  {
    heading: "Werken bij EXTRA (voor uitzendkrachten)",
    paths: [
      "/aanmelden",
      "/horeca-werk",
      "/horeca-vacatures-amsterdam",
      "/housekeeping-werk",
      "/chef-vacatures-amsterdam",
      "/front-office-vacatures-amsterdam",
      "/dagbetaling",
      "/vacatures",
    ],
  },
  {
    heading: "Werkwijze en achtergrond",
    paths: ["/horeca-uitzendbureau-amsterdam", "/onze-werkwijze", "/over-extra", "/extraatje", "/klantcases-horeca"],
  },
  {
    heading: "Contact",
    paths: ["/contact"],
  },
];

const HEADER = `# EXTRA — Horeca uitzendbureau Amsterdam

> EXTRA levert flexibel horecapersoneel voor hotels, restaurants, events en cateraars in Amsterdam. Iedereen werkt in loondienst (geen zzp-constructies) en dagbetaling is mogelijk: salaris staat de ochtend na een shift klaar. Kantoor: Herengracht 372, 1016 CH Amsterdam · +31 85 130 5915 · info@doehetextra.nl
`;

function metaFor(p: string) {
  return ROUTE_META.find((m) => normalizeMetaPath(m.path) === normalizeMetaPath(p));
}

function buildIndex(): string {
  let out = HEADER;
  for (const group of GROUPS) {
    out += `\n## ${group.heading}\n\n`;
    for (const p of group.paths) {
      const m = metaFor(p);
      if (!m || m.noindex) continue;
      out += `- [${m.title.split("|")[0].trim()}](${SITE_ORIGIN}${m.path}): ${m.description}\n`;
    }
  }
  return out;
}

function fragmentText(distPublicDir: string, routePath: string): string | undefined {
  const n = normalizeMetaPath(routePath);
  const file = path.join(distPublicDir, "prerender", (n === "/" ? "index" : n.slice(1).replace(/\//g, "__")) + ".html");
  try {
    const html = fs.readFileSync(file, "utf-8");
    return html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return undefined;
  }
}

export function registerLlmsTxt(app: Express, getDistPublicDir: () => string): void {
  app.get("/llms.txt", (_req: Request, res: Response) => {
    res.status(200).type("text/plain; charset=utf-8").send(buildIndex());
  });

  app.get("/llms-full.txt", (_req: Request, res: Response) => {
    let out = HEADER;
    const dist = getDistPublicDir();
    for (const group of GROUPS) {
      out += `\n## ${group.heading}\n`;
      for (const p of group.paths) {
        const m = metaFor(p);
        if (!m || m.noindex) continue;
        out += `\n### ${m.title.split("|")[0].trim()}\nURL: ${SITE_ORIGIN}${m.path}\n${m.description}\n`;
        const text = fragmentText(dist, m.path);
        if (text) out += `\n${text}\n`;
      }
    }
    res.status(200).type("text/plain; charset=utf-8").send(out);
  });
}
