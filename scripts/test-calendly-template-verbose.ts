const WA_BASE_URL = process.env.WHATSAPP_360_BASE_URL || 'https://waba-v2.360dialog.io';
const WA_360_KEY = process.env.WHATSAPP_360_API_KEY || '';

async function main() {
  const phone = process.argv[2] || '31653813448';
  const voornaam = process.argv[3] || 'Test';
  const templateName = process.argv[4] || 'gesprek_inplannen_reminder';
  const lang = process.argv[5] || 'nl';

  const url = `${WA_BASE_URL}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: lang },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: voornaam }] },
      ],
    },
  };

  const startedAt = new Date().toISOString();
  console.log('────────────────────────────────────────────');
  console.log(`Timestamp (UTC): ${startedAt}`);
  console.log(`Endpoint URL:    POST ${url}`);
  console.log(`Headers:`);
  console.log(`  Content-Type: application/json`);
  console.log(`  D360-API-KEY: <REDACTED — ends with ...${WA_360_KEY.slice(-4)}>`);
  console.log(`Request body:`);
  console.log(JSON.stringify(payload, null, 2));
  console.log('────────────────────────────────────────────');

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'D360-API-KEY': WA_360_KEY },
    body: JSON.stringify(payload),
  });

  const text = await r.text();
  console.log(`Response status: ${r.status} ${r.statusText}`);
  console.log(`Response headers:`);
  r.headers.forEach((v, k) => console.log(`  ${k}: ${v}`));
  console.log(`Response body:`);
  try { console.log(JSON.stringify(JSON.parse(text), null, 2)); }
  catch { console.log(text); }
  console.log('────────────────────────────────────────────');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(2); });
