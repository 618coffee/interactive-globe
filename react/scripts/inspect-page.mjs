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

// Default screenshot (equatorial view).
await page.screenshot({ path: SHOT, fullPage: false });
console.log(`[screenshot] ${SHOT}`);

// Drag the canvas downward to tilt the view toward the north pole.
// Need a generous drag — OrbitControls rotateSpeed is 0.55, so 1px
// is well under 1° of orbit. Use ~700px to get most of the way to a
// top-down view of the Arctic.
const cx = 800, cy = 400;
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.mouse.move(cx, cy + 700, { steps: 40 });
await page.mouse.up();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'inspect-page-north.png', fullPage: false });
console.log('[screenshot] inspect-page-north.png');

// Drag the other way past the equator to get the south pole top-down.
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.mouse.move(cx, cy - 1400, { steps: 60 });
await page.mouse.up();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'inspect-page-south.png', fullPage: false });
console.log('[screenshot] inspect-page-south.png');

await browser.close();
