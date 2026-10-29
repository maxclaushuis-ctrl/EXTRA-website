/**
 * Presentaties voor prospects, als losse pagina buiten de React-app.
 *
 * /pitchdeck/<naam> (zie PITCHDECKS in shared/pitchdecks.ts) serveert client/public/pitchdeck/<naam>/index.html. Bewust
 * niet vindbaar: geen route in shared/routeMeta.ts (dus niet in de sitemap of
 * llms.txt), een robots-meta in de pagina en X-Robots-Tag in de header. De
 * stijl en de beelden komen uit /d3 en uit de map van de presentatie zelf.
 *
 * Bij het serveren komt de tracker erin (/pitchdeck/volg.js, zie
 * server/pitchdeckTracker.ts), zodat de losse HTML-bestanden zelf niet
 * aangepast hoeven te worden.
 *
 * Nodig omdat express.static met index: false draait (zie server/vite.ts): een
 * map met index.html wordt daar niet vanzelf geserveerd.
 */
import fs from "fs";
import path from "path";
import type { Express, Request, Response } from "express";
import { DECK_NAMEN } from "@shared/pitchdecks";

const DECKS = DECK_NAMEN;
const TRACKER = '<script src="/pitchdeck/volg.js" defer></script>';

function vindPagina(naam: string): string | null {
  const kandidaten = [
    path.resolve(import.meta.dirname, "public", "pitchdeck", naam, "index.html"),
    path.resolve(process.cwd(), "client", "public", "pitchdeck", naam, "index.html"),
  ];
  return kandidaten.find((p) => fs.existsSync(p)) ?? null;
}

export function registerPitchdecks(app: Express): void {
  for (const naam of DECKS) {
    app.get([`/pitchdeck/${naam}`, `/pitchdeck/${naam}/`], (_req: Request, res: Response) => {
      const pagina = vindPagina(naam);
      if (!pagina) return res.status(404).send("Niet gevonden");
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
      res.setHeader("Cache-Control", "no-cache");
      try {
        const html = fs.readFileSync(pagina, "utf-8");
        res.type("html").send(html.includes("</body>") ? html.replace("</body>", `${TRACKER}\n</body>`) : html + TRACKER);
      } catch {
        res.status(500).send("Niet gelukt");
      }
    });
  }
}
