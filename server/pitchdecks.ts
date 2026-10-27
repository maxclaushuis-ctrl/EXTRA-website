/**
 * Presentaties voor prospects, als losse pagina buiten de React-app.
 *
 * /pitchdeck/gofo serveert client/public/pitchdeck/gofo/index.html. Bewust
 * niet vindbaar: geen route in shared/routeMeta.ts (dus niet in de sitemap of
 * llms.txt), een robots-meta in de pagina en X-Robots-Tag in de header. De
 * stijl en de beelden komen uit /d3 en uit de map van de presentatie zelf.
 *
 * Nodig omdat express.static met index: false draait (zie server/vite.ts): een
 * map met index.html wordt daar niet vanzelf geserveerd.
 */
import fs from "fs";
import path from "path";
import type { Express, Request, Response } from "express";

const DECKS = ["gofo"];

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
      res.sendFile(pagina);
    });
  }
}
