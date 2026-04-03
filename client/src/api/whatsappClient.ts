const BASE_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'http://91.98.115.87:3001';
const API_KEY = import.meta.env.VITE_WHATSAPP_API_KEY || 'REMOVED_WHATSAPP_API_KEY';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

export async function haalAccountsOp() {
  const res = await fetch(`${BASE_URL}/accounts`, { headers });
  if (!res.ok) throw new Error('Ophalen mislukt');
  return res.json();
}

export async function verbindAccount(accountId: string) {
  const res = await fetch(`${BASE_URL}/accounts/${accountId}/connect`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Verbinden mislukt');
  return res.json();
}

export async function haalBerichtenOp(accountId: string) {
  const res = await fetch(`${BASE_URL}/accounts/${accountId}/berichten`, { headers });
  if (!res.ok) throw new Error('Berichten ophalen mislukt');
  return res.json();
}

export async function stuurBericht(accountId: string, nummer: string, tekst: string) {
  const res = await fetch(`${BASE_URL}/accounts/${accountId}/stuur`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ nummer, tekst }),
  });
  if (!res.ok) throw new Error('Versturen mislukt');
  return res.json();
}

export async function markeerGelezen(accountId: string) {
  await fetch(`${BASE_URL}/accounts/${accountId}/gelezen`, {
    method: 'POST',
    headers,
  }).catch(() => {});
}

export function maakStream(onStatus: (id: string, state: any) => void, onBericht: (id: string, bericht: any) => void) {
  const es = new EventSource(`${BASE_URL}/stream`, {
    // withCredentials niet nodig voor API-key auth
  } as any);

  es.addEventListener('status', (e: MessageEvent) => {
    try {
      const { id, state } = JSON.parse(e.data);
      onStatus(id, state);
    } catch {}
  });

  es.addEventListener('bericht', (e: MessageEvent) => {
    try {
      const { id, bericht } = JSON.parse(e.data);
      onBericht(id, bericht);
    } catch {}
  });

  return () => es.close();
}
