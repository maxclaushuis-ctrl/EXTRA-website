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

// ─── Kennisbank ──────────────────────────────────────────────────────────────
// Begrippen/werkafspraken die het team één keer vastlegt en die de assistent
// daarna bij elke vraag meekrijgt. Beheer via het boek-icoon in het widget.

export interface KennisRegel {
  id: number;
  titel: string;
  tekst: string;
  enabled: boolean;
  sortOrder: number;
}

export async function haalKennis(): Promise<KennisRegel[]> {
  const r = await fetch(`${BASE}/kennis`, { headers, credentials: 'include' });
  return verwerk<KennisRegel[]>(r, '/kennis');
}

export async function maakKennis(titel: string, tekst: string): Promise<KennisRegel> {
  const r = await fetch(`${BASE}/kennis`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ titel, tekst }),
  });
  return verwerk<KennisRegel>(r, '/kennis');
}

export async function updateKennis(
  id: number,
  patch: Partial<Pick<KennisRegel, 'titel' | 'tekst' | 'enabled'>>,
): Promise<KennisRegel> {
  const r = await fetch(`${BASE}/kennis/${id}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(patch),
  });
  return verwerk<KennisRegel>(r, '/kennis');
}

export async function verwijderKennis(id: number): Promise<void> {
  const r = await fetch(`${BASE}/kennis/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  await verwerk<{ success: boolean }>(r, '/kennis');
}
