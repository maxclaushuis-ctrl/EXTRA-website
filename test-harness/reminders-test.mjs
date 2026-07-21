// Test van de vernieuwde Reminders-pagina: groepen, tegels, snooze, tweestaps-verwijderen, doorklik.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
page.on('console', m => { if (m.text().includes('[harness]')) console.log('[browser]', m.text()); });
await page.goto('http://localhost:5098/reminders.html', { waitUntil: 'networkidle' });
await page.waitForSelector('text=Reminders');
await page.waitForTimeout(800);

const koppen = await page.locator('p.uppercase').allTextContents();
console.log('[test] tijdsgroepen:', JSON.stringify(koppen));
console.log('[test] teller-tekst:', JSON.stringify(await page.locator('h1 + p').textContent()));
const salesflowLabels = await page.locator('text=Salesflow').count();
console.log('[test] Salesflow-herkomstlabels:', salesflowLabels);

// Doorklik op bedrijfsnaam
await page.locator('button:has-text("Grand Hotel Test")').first().click();
await page.waitForTimeout(300);

// Snooze +1w op de verlopen reminder (staat in groep Verlopen)
const verlopenKaart = page.locator('div.rounded-xl.bg-white', { hasText: 'Piet Jansen' }).first();
await verlopenKaart.locator('button:has-text("+1w")').click();
await page.waitForTimeout(1000);
const koppenNa = await page.locator('p.uppercase').allTextContents();
console.log('[test] groepen na snooze +1w:', JSON.stringify(koppenNa));

// Tweestaps-verwijderen: eerste klik → "Zeker?", tweede klik → weg
const kaart = page.locator('div.rounded-xl.bg-white', { hasText: 'Sophie de Wit' }).first();
await kaart.locator('button[title="Verwijderen"]').click();
const zeker = await kaart.locator('button:has-text("Zeker?")').count();
console.log('[test] tweestaps-bevestiging zichtbaar:', zeker === 1);
await kaart.locator('button:has-text("Zeker?")').click();
await page.waitForTimeout(1000);
console.log('[test] Sophie nog aanwezig:', (await page.locator('text=Sophie de Wit').count()) > 0);
await page.screenshot({ path: '/tmp/reminders-v8.png' });
await browser.close();
