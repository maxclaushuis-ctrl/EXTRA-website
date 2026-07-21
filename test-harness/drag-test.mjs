// Reproduceert de sleep van een kaart (Selectie → Mailing verstuurd) in een echte browser.
import { chromium } from 'playwright-core';

const run = async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  page.on('console', m => console.log('[browser]', m.type(), m.text()));
  page.on('response', async r => {
    if (r.url().includes('/api/sales/flow/cards')) {
      console.log('[netwerk]', r.request().method(), r.url().replace('http://localhost:5098',''), '→', r.status(), await r.text().catch(() => ''));
    }
  });

  await page.goto('http://localhost:5098', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Mailing verstuurd', { timeout: 15000 });
  await page.waitForSelector('text=Thomas Test', { timeout: 15000 });
  await page.waitForTimeout(500);

  const kaart = page.locator('div.cursor-grab', { hasText: 'Thomas Test' }).first();
  const kb = await kaart.boundingBox();
  const kolomHeader = page.locator('span:has-text("Mailing verstuurd")').first();
  const hb = await kolomHeader.boundingBox();
  console.log('[test] kaart:', JSON.stringify(kb), 'doelkolom-header:', JSON.stringify(hb));

  // Slepen: muis neer op de kaart, in stapjes naar het midden van de doelkolom, loslaten.
  const doelX = hb.x + hb.width / 2;
  const doelY = hb.y + 250; // midden in de kolom-body
  await page.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(kb.x + kb.width / 2 + (doelX - kb.x - kb.width / 2) * (i / 12), kb.y + kb.height / 2 + (doelY - kb.y - kb.height / 2) * (i / 12));
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(200);
  await page.mouse.up();
  console.log('[test] drop uitgevoerd, wachten op resultaat…');
  await page.waitForTimeout(2000);

  // Waar staat de kaart nu? Zoek de kolom die 'Thomas Test' bevat.
  const resultaat = await page.evaluate(() => {
    const kolommen = [...document.querySelectorAll('div.flex-1.min-w-\\[200px\\]')];
    for (const k of kolommen) {
      if (k.textContent.includes('Thomas Test')) {
        return { kolom: k.querySelector('span.font-semibold')?.textContent, banner: document.body.textContent.includes('Verplaatsen mislukt') };
      }
    }
    return { kolom: 'NERGENS', banner: document.body.textContent.includes('Verplaatsen mislukt') };
  });
  console.log('[test] RESULTAAT: kaart staat in kolom:', resultaat.kolom, '| foutbanner zichtbaar:', resultaat.banner);
  await page.screenshot({ path: '/tmp/drag-result.png' });
  await browser.close();
};
run().catch(e => { console.error('[test] FOUT:', e.message); process.exit(1); });
