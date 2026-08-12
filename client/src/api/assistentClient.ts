/**
 * Client voor de dashboard-AI-assistent (zwevende chatknop, zie
 * client/src/components/AiAssistent.tsx). Server-side tegenhanger:
 * de sectie "AI-ASSISTENT" in server/routes.ts.
 */

export interface AssistentBericht {
  rol: 'gebruiker' | 'assistent';
  tekst: string;
}

/** Een door de assistent klaargezette actie — wacht op menselijke bevestiging. */
export interface ActieVoorstel {
  id: string;
  omschrijving: string;
  groepNaam: string;
  templateNaam: string;
  reden: string;
  aantalOntvangers: number;
  ontvangersPreview: string[];
}

export interface AssistentAntwoord {
  antwoord: string;
  actie?: ActieVoorstel;
}

/** Resultaat van een bevestigde verzending — zelfde vorm als handmatige bulk-verzending. */
export interface ActieUitvoerResultaat {
  bulkSendId: number;
  total: number;
  sent: number;
  failed: number;
}

const BASE = '/api/admin/assistent';
const headers = { 'Content-Type': 'application/json' };

async function verwerk<T>(r: Response, pad: string): Promise<T> {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as any)?.error || `${pad}: ${r.status}`);
  return data as T;
}

export async function stelVraag(berichten: AssistentBericht[]): Promise<AssistentAntwoord> {
  const r = await fetch(`${BASE}/vraag`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ berichten }),
  });
  return verwerk<AssistentAntwoord>(r, '/vraag');
}

export async function bevestigActie(id: string): Promise<ActieUitvoerResultaat> {
  const r = await fetch(`${BASE}/acties/${encodeURIComponent(id)}/bevestig`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });
  return verwerk<ActieUitvoerResultaat>(r, '/acties/bevestig');
}

export async function annuleerActie(id: string): Promise<void> {
  await fetch(`${BASE}/acties/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
}
