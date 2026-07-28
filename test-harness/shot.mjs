import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1340, height: 1750 } });
await p.goto('file:///tmp/mockup-stats-planbord.html');
await p.waitForTimeout(300);
await p.screenshot({ path: '/tmp/mockup-stats-planbord.png', fullPage: true });
await b.close();
