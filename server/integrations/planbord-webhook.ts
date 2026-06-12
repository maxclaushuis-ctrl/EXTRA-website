/**
 * EXTRA Planbord webhook
 *
 * Stuurt één fire-and-forget POST naar het Planbord-project zodra een
 * sollicitant via "Aannemen als medewerker" wordt gepromoveerd tot
 * medewerker. Mag NOOIT throwen — de aannemen-flow moet ook doorgaan
 * als de webhook faalt.
 *
 * Configuratie (env):
 *   PLANBORD_WEBHOOK_URL  — endpoint van het ontvangende Planbord-project
 *   WEBHOOK_SECRET        — gedeelde secret, gaat mee als x-webhook-secret header
 */

export interface PlanbordPayloadData {
  id: string;
  applicationId?: number;
  candidateId?: number;
  employeeId?: number;
  firstName: string;
  lastName: string;
  function: string;
  email?: string | null;
  phone?: string | null;
  region?: string | null;
  birthDate?: string | null;
  city?: string | null;
  nationality?: string | null;
  tags?: {
    profiel?: string[];
    talen?: string[];
    vaardigheden?: string[];
  };
  sterren?: {
    ervaringsniveau?: number;
    verschijning?: number;
    attitude?: number;
    communicatie?: number;
    algemeneIndruk?: number;
  };
  scores?: {
    softskills?: number;
    bar?: number;
    bediening?: number;
    diner?: number;
  };
  opmerking?: string | null;
  referentie?: { naam?: string; relatie?: string; telefoon?: string };
  branche?: string | null;
  opdrachtgever?: string | null;
  contractType?: string | null;
  startDate?: string | null;
  language?: string | null;
  referralCode?: string | null; // Aanbreng-code van de kandidaat — optioneel & additief
}

export async function sendPlanbordWebhook(data: PlanbordPayloadData): Promise<void> {
  const url = process.env.PLANBORD_WEBHOOK_URL;
  const secret = process.env.WEBHOOK_SECRET;

  console.error(
    '[planbord-webhook] called, url=', !!url, 'secret=', !!secret, 'employeeId=', data.id
  );

  if (!url || !secret) {
    console.warn(
      '[planbord-webhook] PLANBORD_WEBHOOK_URL of WEBHOOK_SECRET ontbreekt — call overgeslagen'
    );
    return;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
      },
      body: JSON.stringify({
        event: 'applicant.ready',
        timestamp: new Date().toISOString(),
        source: 'EXTRA Horecapersoneel',
        data,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const txt = await res.text().catch(() => '');
    console.error(
      '[planbord-webhook] result status=', res.status, 'body=', txt.slice(0, 300)
    );

    if (!res.ok) return;

    console.log(
      `[planbord-webhook] verstuurd voor employee #${data.id} (${data.firstName} ${data.lastName})`
    );
  } catch (err: any) {
    console.error('[planbord-webhook] result status= NONE err=', err?.message ?? err);
  }
}
