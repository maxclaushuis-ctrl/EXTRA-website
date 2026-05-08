import { stuurCalendlyReminderTemplate, bepaalTaal } from '../server/whatsapp/sendTemplate';

async function main() {
  const phone = process.argv[2] || '0653813448';
  const voornaam = process.argv[3] || 'Test';
  const taalArg = process.argv[4] || 'nl';
  const taal = bepaalTaal(taalArg);

  console.log(`[test] Versturen naar ${phone} (taal=${taal}, voornaam=${voornaam})`);
  const res = await stuurCalendlyReminderTemplate({
    phone,
    voornaam,
    taal,
    candidateId: 0,
    triggeredByUserId: null,
  });
  console.log('[test] Resultaat:', JSON.stringify(res, null, 2));
  process.exit(res.success ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
