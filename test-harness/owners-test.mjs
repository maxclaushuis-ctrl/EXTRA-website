// Test: Eigenaar-dropdowns volgen automatisch de admin-accounts.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5098', { waitUntil: 'networkidle' });
await page.waitForSelector('text=Eigenaar');
// Open het Eigenaar-filter (tweede combobox op de pagina)
await page.locator('button[role="combobox"]').nth(1).click();
await page.waitForTimeout(400);
console.log('[test] Eigenaar-filteropties:', JSON.stringify(await page.locator('[role="option"]').allTextContents()));
await page.keyboard.press('Escape');
// Persoon toevoegen → standaard-eigenaar + opties
await page.click('button:has-text("Persoon toevoegen")');
await page.waitForTimeout(600);
const eigenaarSelect = page.locator('div[role="dialog"] button[role="combobox"]').nth(1);
console.log('[test] standaard eigenaar in dialoog:', JSON.stringify(await eigenaarSelect.textContent()));
await eigenaarSelect.click();
await page.waitForTimeout(300);
console.log('[test] eigenaar-opties in dialoog:', JSON.stringify(await page.locator('[role="option"]').allTextContents()));
await page.screenshot({ path: '/tmp/owners-result.png' });
await browser.close();
