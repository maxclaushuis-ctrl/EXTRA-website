const BASE_URL = '/api/whatsapp';

const headers = {
  'Content-Type': 'application/json',
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
  });
}
