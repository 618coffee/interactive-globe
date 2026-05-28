// Headless probe: load the dev server, capture every console event +
// page error + failed request, then dump a screenshot. Used to diagnose
// the "blank page" report.
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://localhost:5174/';
const SHOT = 'inspect-page.png';

const browser = await chromium.launch();
const ctx     = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page    = await ctx.newPage();

page.on('console',   m => console.log(`[console.${m.type()}] ${m.text()}`));
page.on('pageerror', e => console.log(`[pageerror] ${e.message}\n${e.stack || ''}`));
page.on('requestfailed', r => {
  console.log(`[requestfailed] ${r.url()} -- ${r.failure()?.errorText || 'unknown'}`);
});
page.on('response', async r => {
  const s = r.status();
  if (s >= 400) console.log(`[response ${s}] ${r.url()}`);
});

try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
} catch (e) {
  console.log(`[goto-error] ${e.message}`);
}

// Give React a moment after networkidle to throw runtime errors.
await page.waitForTimeout(1500);

const root = await page.locator('#root').first();
const childCount = await root.evaluate(el => el.childElementCount);
const innerText  = (await root.innerText().catch(() => '')).slice(0, 200);
console.log(`[root] childElementCount=${childCount} innerText=${JSON.stringify(innerText)}`);

await page.screenshot({ path: SHOT, fullPage: false });
console.log(`[screenshot] ${SHOT}`);

await browser.close();
