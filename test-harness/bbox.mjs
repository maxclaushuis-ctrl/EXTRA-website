import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.goto('file:///tmp/extra-logo.svg');
const box = await p.evaluate(() => {
  const svg = document.querySelector('svg');
  // bbox van alleen de donkere paden (het woordmerk), groene elementen uitsluiten
  const donker = [...svg.querySelectorAll('path')].filter(el => (el.getAttribute('fill') || '').startsWith('rgb(11'));
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const el of donker) {
    const bb = el.getBBox();
    minX = Math.min(minX, bb.x); minY = Math.min(minY, bb.y);
    maxX = Math.max(maxX, bb.x + bb.width); maxY = Math.max(maxY, bb.y + bb.height);
  }
  return { minX, minY, w: maxX - minX, h: maxY - minY, paths: svg.querySelectorAll('path').length, donker: donker.length };
});
console.log(JSON.stringify(box));
await b.close();
