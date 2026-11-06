/**
 * Testomgeving (fase 1 van het bouwplan Job en testomgeving).
 *
 * Een tweede Replit-app met een eigen database draait met TESTOMGEVING=1.
 * Dan toont het dashboard een gele balk en een mailvenster met alle mails
 * die de app in testmodus 'verstuurd' heeft. Zonder TESTOMGEVING=1 doen
 * deze routes niets bijzonders: de status zegt dan alleen dat het geen
 * testomgeving is, en het mailvenster geeft 404.
 *
 * Er wordt hier niets opgeslagen of verwijderd. Het mailvenster leest
 * alleen het geheugen van server/mail.ts.
 */
import type { Express, Request, Response, NextFunction } from "express";
import { getMockMailLog, isMailMock } from "./mail";

/** Alleen 'TESTOMGEVING=1' telt; elke andere waarde is productie. */
export function isTestomgeving(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.TESTOMGEVING === "1";
}

type Middleware = (req: Request, res: Response, next: NextFunction) => unknown;

export function registerTestomgevingRoutes(app: Express, adminMiddleware: Middleware) {
  /** Voor de gele balk. Geen geheimen, dus zonder login op te vragen. */
  app.get("/api/testomgeving/status", (_req: Request, res: Response) => {
    res.json({
      testomgeving: isTestomgeving(),
      mailMock: isMailMock(),
    });
  });

  /** Het mailvenster: alle mails uit de testmodus, nieuwste eerst. */
  app.get("/api/testomgeving/mails", adminMiddleware, (_req: Request, res: Response) => {
    if (!isTestomgeving()) {
      return res.status(404).json({ message: "Alleen in de testomgeving" });
    }
    const mails = getMockMailLog().map((m, i) => ({
      id: m.messageId || `${m.timestamp}-${i}`,
      to: m.to,
      from: m.from,
      subject: m.subject,
      text: m.text || "",
      html: m.html || "",
      attachments: m.attachments || [],
      timestamp: m.timestamp,
    }));
    res.json({ mailMock: isMailMock(), aantal: mails.length, mails });
  });
}
