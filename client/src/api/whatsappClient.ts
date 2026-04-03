const BASE_URL = '/api/whatsapp';
const headers = { 'Content-Type': 'application/json' };

export async function haalAccountsOp() {
  const res = await fetch(`${BASE_URL}/accounts`, { headers });
  if (!res.ok) throw new Error('Ophalen mislukt');
  return res.json();
}

export async function haalBerichtenOp() {
  const res = await fetch(`${BASE_URL}/berichten`, { headers });
  if (!res.ok) throw new Error('Berichten ophalen mislukt');
  return res.json();
}

export async function stuurBericht(nummer: string, tekst: string) {
  const res = await fetch(`${BASE_URL}/stuur`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ nummer, tekst }),
  });
  if (!res.ok) throw new Error('Versturen mislukt');
  return res.json();
}
