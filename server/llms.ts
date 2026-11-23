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
import { engelsePaden, fragmentNaarTekst } from "@shared/llmsTekst";
import { storage } from "./storage";

const GROUPS: { heading: string; paths: string[] }[] = [
  {
    heading: "Branches: hotels, events en logistiek",
    paths: ["/hotels", "/evenementen", "/logistiek"],
  },
  {
    heading: "Personeel aanvragen (voor werkgevers)",
    paths: [
      "/personeelsaanvraag",
      "/horeca-personeel-gezocht",
      "/hotelpersoneel-inhuren",
      "/eventpersoneel-inhuren",
      "/logistiek-personeel-inhuren",
      "/cateringpersoneel-inhuren",
      "/horecapersoneel-restaurants",
      "/horeca-personeel-inhuren",
      "/horeca-personeel-amsterdam",
      "/tijdelijk-horeca-personeel",
      "/last-minute-horecapersoneel",
      "/flexibel-horeca-personeel",
      "/horeca-personeel",
      "/uitzenden-of-zzp",
    ],
  },
  {
    heading: "Functies in hotels (voor werkgevers)",
    paths: [
      "/housekeeping-personeel-inhuren",
      "/front-office-personeel-inhuren",
      "/fb-personeel-inhuren",
      "/banqueting-personeel-inhuren",
      "/keukenpersoneel-inhuren",
      "/afwassers-inhuren",
      "/bediening-inhuren",
    ],
  },
  {
    heading: "Werken bij EXTRA (voor uitzendkrachten)",
    paths: [
      "/aanmelden",
      "/horeca-werk",
      "/horeca-vacatures-amsterdam",
      "/events-werk",
      "/logistiek-werk",
      "/housekeeping-werk",
      "/chef-vacatures-amsterdam",
      "/front-office-vacatures-amsterdam",
      "/dagbetaling",
      "/vacatures",
      "/horeca-werk-amsterdam",
      "/housekeeping-vacatures-amsterdam",
      "/werken-in-de-horeca",
      "/bijbaan-amsterdam",
    ],
  },
  {
    heading: "Werkwijze en achtergrond",
    paths: ["/horeca-uitzendbureau-amsterdam", "/horeca-uitzendbureau-amsterdam-werkwijze", "/onze-werkwijze", "/selectieproces", "/over-extra", "/ons-team", "/nen-4400-1-certificering", "/extraatje", "/klantcases-horeca", "/blog"],
  },
  {
    heading: "English",
    // Vaste volgorde vooraan; alles wat er onder /en bijkomt, volgt vanzelf.
    paths: engelsePaden(
      ["/en", "/en/hospitality-staff-amsterdam", "/en/hotel-staffing-amsterdam", "/en/event-staff-amsterdam", "/en/catering-staff-amsterdam", "/en/restaurant-staff-amsterdam", "/en/how-we-work", "/en/about", "/en/hospitality-jobs", "/en/contact"],
      ROUTE_META.filter((m) => !m.noindex && !m.canonical).map((m) => m.path),
    ),
  },
  {
    heading: "Contact",
    paths: ["/contact"],
  },
];

const HEADER = `# EXTRA, uitzendbureau Amsterdam voor hotels, events en logistiek

> EXTRA levert flexibel personeel voor hotels, restaurants, events, cateraars en logistiek in Amsterdam. Iedereen werkt in loondienst (geen zzp-constructies) en dagbetaling is mogelijk: salaris staat de ochtend na een shift klaar. Kantoor: Herengracht 372, 1016 CH Amsterdam · +31 85 401 2373 · info@doehetextra.nl
`;

function metaFor(p: string) {
  return ROUTE_META.find((m) => normalizeMetaPath(m.path) === normalizeMetaPath(p));
}

/** Gepubliceerde blogartikelen; bij een databasefout gewoon geen bloglijst. */
async function blogArtikelen(): Promise<any[]> {
  try {
    const { posts } = await storage.getBlogPosts({ status: "published", limit: 200 });
    return posts;
  } catch {
    return [];
  }
}

const BLOG_KOP = "Blog: uitleg voor werkgevers";

async function buildIndex(): Promise<string> {
  let out = HEADER;
  for (const group of GROUPS) {
    out += `\n## ${group.heading}\n\n`;
    for (const p of group.paths) {
      const m = metaFor(p);
      if (!m || m.noindex) continue;
      out += `- [${m.title.split("|")[0].trim()}](${SITE_ORIGIN}${m.path}): ${m.description}\n`;
    }
  }
  const posts = await blogArtikelen();
  if (posts.length) {
    out += `\n## ${BLOG_KOP}\n\n`;
    for (const post of posts) {
      const tekst = String(post.metaDescription || post.excerpt || "").replace(/\s+/g, " ").trim();
      out += `- [${post.title}](${SITE_ORIGIN}/blog/${post.slug})${tekst ? `: ${tekst}` : ""}\n`;
    }
  }
  return out;
}

function fragmentText(distPublicDir: string, routePath: string): string | undefined {
  const n = normalizeMetaPath(routePath);
  const file = path.join(distPublicDir, "prerender", (n === "/" ? "index" : n.slice(1).replace(/\//g, "__")) + ".html");
  try {
    return fragmentNaarTekst(fs.readFileSync(file, "utf-8"));
  } catch {
    return undefined;
  }
}

export function registerLlmsTxt(app: Express, getDistPublicDir: () => string): void {
  app.get("/llms.txt", async (_req: Request, res: Response) => {
    res.status(200).type("text/plain; charset=utf-8").send(await buildIndex());
  });

  app.get("/llms-full.txt", async (_req: Request, res: Response) => {
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
    const posts = await blogArtikelen();
    if (posts.length) {
      out += `\n## ${BLOG_KOP}\n`;
      for (const post of posts) {
        const kort = String(post.metaDescription || post.excerpt || "").replace(/\s+/g, " ").trim();
        out += `\n### ${post.title}\nURL: ${SITE_ORIGIN}/blog/${post.slug}\n${kort}\n`;
        const tekst = fragmentNaarTekst(String(post.content || ""));
        if (tekst) out += `\n${tekst}\n`;
      }
    }
    res.status(200).type("text/plain; charset=utf-8").send(out);
  });
}
