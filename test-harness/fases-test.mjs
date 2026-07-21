// Nieuw model: velden wijzigen → knop "Opslaan" → sluiten → heropenen → controleren.
import { chromium } from 'playwright-core';
const run = async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('response', async r => {
    if (r.url().includes('/api/sales/flow/rules'))
      console.log('[netwerk]', r.request().method(), r.url().replace('http://localhost:5098',''), '→', r.status());
  });
  await page.goto('http://localhost:5098', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Fases instellen');
  await page.click('button:has-text("Fases instellen")');
  await page.waitForSelector('text=Kolomnaam');
  await page.locator('div[role="dialog"] input').first().fill('Eerste contact gehad');
  await page.locator('div[role="dialog"] input[type="number"]').first().fill('6');
  await page.click('div[role="dialog"] button:has-text("Opslaan")');
  await page.waitForTimeout(1500);
  // Dialoog hoort nu gesloten te zijn; heropen en controleer.
  await page.click('button:has-text("Fases instellen")');
  await page.waitForSelector('text=Kolomnaam');
  const naam = await page.locator('div[role="dialog"] input').first().inputValue();
  const dagen = await page.locator('div[role="dialog"] input[type="number"]').first().inputValue();
  console.log('[test] RESULTAAT na heropenen — naam:', JSON.stringify(naam), '| werkdagen:', JSON.stringify(dagen));
  await page.click('div[role="dialog"] button:has-text("Annuleren")');
  await page.waitForTimeout(400);
  console.log('[test] kolomnaam op het bord:', (await page.locator('text=Eerste contact gehad').count()) > 0);
  await page.screenshot({ path: '/tmp/fases-v5.png' });
  await browser.close();
};
run().catch(e => { console.error('[test] FOUT:', e.message); process.exit(1); });
