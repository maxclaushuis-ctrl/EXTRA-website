/**
 * CV VOOR HET PLANBORD — pure logica
 *
 * Het Planbord wil het CV van een sollicitant na contractondertekening onder
 * Documenten zetten. Afgesproken opzet (Max, 16-10-2026): het Dashboard stuurt
 * het bestand niet mee in de applicant-sync-webhook, maar meldt alleen dát er
 * een CV is. Het Planbord haalt het bestand daarna zelf op via een beveiligd
 * endpoint. Zo gaat een CV alleen over de lijn voor mensen die echt in dienst
 * komen.
 *
 * Deze module bevat alleen rekenwerk: geen database, geen Object Storage, geen
 * Express. Daardoor is hij onder kale tsx te testen. De I/O staat in
 * server/routes.ts en in server/objectStorageFiles.ts.
 *
 * Wat hier uit het onderzoek van stap 1 in verwerkt zit:
 *
 *  - Een CV staat als pad in candidates.cv_filename en het bestand in Replit
 *    Object Storage. Er is één CV per kandidaat; een nieuwe upload overschrijft
 *    de kolom.
 *  - Toegestane types zijn pdf, doc en docx — gelijk aan wat de upload
 *    accepteert. jpg en png bestaan niet als CV en worden hier dus geweigerd.
 *  - Er is geen kolom met de uploaddatum. Die zit wél in het objectpad, dat met
 *    `${Date.now()}-bestandsnaam` wordt opgebouwd. Daar lezen we hem uit.
 *  - Kandidaten van vóór de migratie hebben nog een Supabase-URL in dezelfde
 *    kolom. Die bestanden zijn niet op te halen en tellen als "geen CV".
 */

/** Grens uit de upload (server/routes.ts). Hier als vangnet herhaald. */
export const MAX_CV_BYTES = 10 * 1024 * 1024;

/**
 * Toegestane extensies met hun mimetype. Exact de lijst die de upload
 * accepteert; loopt die lijst ooit uiteen, dan hoort dat een bewuste wijziging
 * op beide plekken te zijn.
 */
export const CV_MIMETYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * Staat dit pad in Replit Object Storage?
 *
 * Bewust een eigen kopie van de controle uit server/objectStorageFiles.ts, en
 * niet een import: die module trekt de Object Storage-client mee en dan is deze
 * logica niet meer zonder bucket te testen. De test bewaakt dat beide dezelfde
 * vormen accepteren.
 */
export function isObjectStoragePad(pad?: string | null): boolean {
  return !!pad && pad.startsWith("/replit-objstore-");
}

/** De extensie in kleine letters, zonder punt. Leeg als er geen is. */
export function extensieUitPad(pad: string): string {
  const naam = pad.split("/").pop() ?? "";
  if (!naam.includes(".")) return "";
  return (naam.split(".").pop() ?? "").toLowerCase();
}

/** Het mimetype bij een pad, of null als het type niet is toegestaan. */
export function mimeVoorPad(pad: string): string | null {
  return CV_MIMETYPES[extensieUitPad(pad)] ?? null;
}

/**
 * De oorspronkelijke bestandsnaam, dus zonder het tijdstempel dat de upload
 * ervoor zet. "/bucket/cvs/1760601600000-cv_jan.pdf" → "cv_jan.pdf".
 * Staat er geen tijdstempel voor, dan de naam zoals hij is.
 */
export function bestandsnaamUitPad(pad: string): string {
  const naam = pad.split("/").pop() ?? "";
  const m = /^\d{10,}-(.+)$/.exec(naam);
  return m ? m[1] : naam;
}

/**
 * Het uploadmoment, afgeleid uit het tijdstempel in het pad. Null als dat er
 * niet in staat (bijvoorbeeld bij een handmatig geplaatst bestand).
 */
export function uploadtijdUitPad(pad: string): string | null {
  const naam = pad.split("/").pop() ?? "";
  const m = /^(\d{10,})-/.exec(naam);
  if (!m) return null;
  const ms = Number(m[1]);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const datum = new Date(ms);
  if (Number.isNaN(datum.getTime())) return null;
  return datum.toISOString();
}

/**
 * Is dit CV op te halen? Alleen een Object Storage-pad met een toegestaan
 * type telt. Een lege kolom, een oude Supabase-URL of een onbekend type
 * levert false op — en dan ontbreekt het cv-blok in de payload.
 */
export function cvOphaalbaar(cvFilename?: string | null): boolean {
  if (!isObjectStoragePad(cvFilename)) return false;
  return mimeVoorPad(cvFilename as string) !== null;
}

export interface CvBlok {
  aanwezig: true;
  bestandsnaam: string;
  mimeType: string;
  grootte: number;
  sha256: string;
  bijgewerkt: string | null;
}

/**
 * Bouwt het cv-blok voor de applicant-sync-payload. Geeft null zodra er iets
 * niet klopt: geen bestand, verkeerd type, leeg of te groot. Null betekent dat
 * het hele cv-veld uit de payload blijft — niet `aanwezig: false`.
 */
export function bouwCvBlok(
  cvFilename: string | null | undefined,
  grootte: number,
  sha256: string,
): CvBlok | null {
  if (!cvOphaalbaar(cvFilename)) return null;
  const pad = cvFilename as string;
  const mimeType = mimeVoorPad(pad);
  if (!mimeType) return null;
  if (!Number.isFinite(grootte) || grootte <= 0 || grootte > MAX_CV_BYTES) return null;
  if (!/^[0-9a-f]{64}$/.test(sha256)) return null;
  return {
    aanwezig: true,
    bestandsnaam: bestandsnaamUitPad(pad),
    mimeType,
    grootte,
    sha256,
    bijgewerkt: uploadtijdUitPad(pad),
  };
}

/** Uitkomsten van het ophaal-endpoint. Ook wat er in het log terechtkomt. */
export type CvUitkomst = "ok" | "geen_cv" | "onbekend" | "geweigerd";

/**
 * Mag het Planbord dit CV ophalen?
 *
 * Alleen voor sollicitaties die zijn aangenomen. De aannemen-flow zet de status
 * op 'aangenomen' en verstuurt in dezelfde stap de webhook, dus die ene
 * voorwaarde dekt allebei de gevallen uit de opdracht. Alles daarbuiten —
 * lopend, beoordeeld, afgewezen — krijgt 'onbekend', ook met een geldige
 * sleutel. Zo kan het Planbord nooit bij een CV van iemand die niet in dienst
 * komt.
 */
export function magOphalen(status?: string | null): boolean {
  return status === "aangenomen";
}
