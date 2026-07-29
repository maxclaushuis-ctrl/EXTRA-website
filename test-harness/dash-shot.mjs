import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1400, height: 1550 } });
await p.goto('http://localhost:5098/dash.html', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3500);
await p.screenshot({ path: '/tmp/dash-sidebar.png', clip: { x: 0, y: 0, width: 260, height: 1150 } });
await b.close();
console.log('klaar');
