// Reproduceert: kaart aanklikken → detailvenster → van bord verwijderen.
// Controleert ook dat een SLEEP het detailvenster NIET opent.
import { chromium } from 'playwright-core';
const run = async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('response', async r => {
    if (r.url().includes('/api/sales/flow/cards') && r.request().method() === 'DELETE')
      console.log('[netwerk]', r.request().method(), r.url().replace('http://localhost:5098',''), '→', r.status());
  });
  await page.goto('http://localhost:5098', { waitUntil: 'networkidle' });
  await page.waitForSelector('div.cursor-grab');

  // 1. Sleep een stukje en laat los binnen dezelfde kolom → geen dialoog verwacht.
  const kaart = page.locator('div.cursor-grab').first();
  const kb = await kaart.boundingBox();
  await page.mouse.move(kb.x + 60, kb.y + 20);
  await page.mouse.down();
  await page.mouse.move(kb.x + 60, kb.y + 120, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  const dialoogNaSleep = await page.locator('div[role="dialog"]').count();
  console.log('[test] dialoog na sleep (hoort 0 te zijn):', dialoogNaSleep);

  // 2. Klik op de kaart → detailvenster opent.
  await kaart.click();
  await page.waitForSelector('div[role="dialog"]');
  const titel = await page.locator('div[role="dialog"] h2').textContent();
  console.log('[test] detailvenster geopend voor:', JSON.stringify(titel));

  // 3. Verwijderen met tweestaps-bevestiging.
  await page.click('button:has-text("Van bord verwijderen")');
  await page.click('button:has-text("Definitief van bord halen")');
  await page.waitForTimeout(1200);
  const kaartenOver = await page.locator('div.cursor-grab').count();
  console.log('[test] RESULTAAT: kaarten op het bord na verwijderen:', kaartenOver);
  await page.screenshot({ path: '/tmp/delete-result.png' });
  await browser.close();
};
run().catch(e => { console.error('[test] FOUT:', e.message); process.exit(1); });
