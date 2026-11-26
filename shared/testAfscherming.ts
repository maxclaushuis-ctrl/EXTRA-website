/**
 * Afgeschermde verzending voor fictieve testkandidaten (e-mail op voorbeeld.nl).
 *
 * Staat zo'n adres tussen de ontvangers, dan gaat de hele mail niet naar buiten, ook niet als de mail live staat
 * (SendGrid): de mail komt alleen in het mailvenster van de testomgeving, met de markering "afgeschermd". WhatsApp naar fictieve kandidaten blokkeert
 * server/job/jobService.ts (isTestkandidaat). Puur, getest in shared/testAfscherming.test.ts.
 */
export const TESTDOMEIN = "voorbeeld.nl";

export function isFictiefAdres(adres: string | null | undefined): boolean {
  const a = (adres || "").trim().toLowerCase().replace(/^.*<([^>]+)>.*$/, "$1");
  return a.endsWith(`@${TESTDOMEIN}`);
}

/**
 * Staat er een fictief adres tussen de ontvangers? Dan gaat de hele mail niet naar buiten, ook niet naar de
 * echte ontvangers erbij: een testmail blijft in zijn geheel in het mailvenster.
 */
export function bevatFictief(aan: string | string[] | null | undefined): boolean {
  const lijst = (Array.isArray(aan) ? aan : [aan || ""]).flatMap((x) => String(x).split(",")).map((x) => x.trim()).filter(Boolean);
  return lijst.some(isFictiefAdres);
}

/**
 * De verzendpoort voor alle mail (server/mail.ts): bij een fictieve ontvanger wordt de mail alleen bewaard voor het
 * mailvenster (afgeschermd: true) en wordt de echte verzending (SendGrid) niet aangeroepen.
 */
export async function metAfscherming<T, P extends { to: string | string[]; subject?: string }>(
  params: P,
  bewaar: (mail: P & { afgeschermd: true; timestamp: string }) => void,
  verstuurEcht: () => Promise<T>,
  afgeschermdResultaat: T,
): Promise<T> {
  if (!bevatFictief(params.to)) return verstuurEcht();
  bewaar({ ...params, afgeschermd: true, timestamp: new Date().toISOString() });
  console.log(`Afgeschermd: geen mail naar buiten, er staat een fictief adres tussen de ontvangers (${Array.isArray(params.to) ? params.to.join(", ") : params.to}): ${params.subject ?? ""}`);
  return afgeschermdResultaat;
}
