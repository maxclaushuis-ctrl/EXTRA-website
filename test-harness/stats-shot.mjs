// Screenshots van de herstylede Website Statistieken (Overzicht + Aanmeldingen).
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
await p.goto('http://localhost:5098/stats.html', { waitUntil: 'networkidle' });
await p.waitForSelector('text=Aanmeldingen deze week', { timeout: 15000 });
await p.waitForTimeout(600);
await p.screenshot({ path: '/tmp/stats-overzicht.png', fullPage: true });
await p.click('button:has-text("Aanmeldingen")');
await p.waitForTimeout(600);
await p.screenshot({ path: '/tmp/stats-aanmeldingen.png', fullPage: true });
await b.close();
console.log('[test] screenshots klaar');
