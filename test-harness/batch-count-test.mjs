// Reproduceert: batch aanmaken → persoon toevoegen → klopt de teller in de dropdown?
import { chromium } from 'playwright-core';

const run = async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('response', async r => {
    if (r.url().includes('/api/sales/flow') && ['POST'].includes(r.request().method()))
      console.log('[netwerk]', r.request().method(), r.url().replace('http://localhost:5098',''), '→', r.status());
  });

  await page.goto('http://localhost:5098', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Selectie');

  // 1. Nieuwe batch aanmaken
  await page.click('button:has-text("Nieuwe batch")');
  await page.fill('input[placeholder*="Mailing Hotels"]', 'Mailing hotels');
  await page.click('button:has-text("Aanmaken")');
  await page.waitForTimeout(1200);
  const naAanmaak = await page.locator('button:has(span)').filter({ hasText: 'Mailing hotels' }).first().textContent().catch(() => 'NIET GEVONDEN');
  console.log('[test] dropdown na batch aanmaken:', JSON.stringify(naAanmaak));

  // 2. Persoon toevoegen (batch hoort voorgeselecteerd te zijn)
  await page.click('button:has-text("Persoon toevoegen")');
  await page.waitForSelector('text=Jan de Vries');
  const batchInDialoog = await page.locator('div[role="dialog"] button[role="combobox"]').first().textContent();
  console.log('[test] batch voorgeselecteerd in dialoog:', JSON.stringify(batchInDialoog));
  await page.locator('div[role="dialog"] button:has-text("Toevoegen")').first().click();
  await page.waitForTimeout(1500);
  await page.click('button:has-text("Klaar")');
  await page.waitForTimeout(800);

  // 3. Wat toont de batch-dropdown nu?
  const dropdownNa = await page.locator('button[role="combobox"]').filter({ hasText: 'Mailing hotels' }).first().textContent().catch(() => 'NIET GEVONDEN');
  const apiNa = await (await fetch('http://localhost:5099/api/sales/flow/batches')).json();
  console.log('[test] RESULTAAT dropdown:', JSON.stringify(dropdownNa), '| API zegt:', JSON.stringify(apiNa.map(b => ({ name: b.name, cardCount: b.cardCount }))));
  const janZichtbaar = await page.locator('text=Jan de Vries').count();
  console.log('[test] Jan op het bord (gefilterd op batch):', janZichtbaar > 0);
  await page.screenshot({ path: '/tmp/batch-count.png' });
  await browser.close();
};
run().catch(e => { console.error('[test] FOUT:', e.message); process.exit(1); });
