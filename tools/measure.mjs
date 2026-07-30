/**
 * Report the on-screen height of each HUD block across a set of viewports.
 *
 * Used to keep the phone layout honest: the bottom stack (rail + inspector +
 * timeline) has to leave the majority of the screen to the thing being
 * described, and "looks about right in a screenshot" is not a measurement.
 *
 * One page load, resized between measurements. That matters for cost -- the
 * procedural bake takes minutes under software rasterisation -- and it has to
 * happen *after* the bake, because until telemetry is running the date and
 * speed readouts are placeholder dashes, which are narrower than real values
 * and change where the timeline wraps.
 *
 *   node tools/measure.mjs                       # default viewport set
 *   VIEWPORT=840x713 node tools/measure.mjs      # one viewport
 *   OUT=shots node tools/measure.mjs             # also write screenshots
 */

import { chromium } from '@playwright/test';

const VIEWPORTS = (process.env.VIEWPORT || '840x713,390x844,430x932')
  .split(',')
  .map((s) => {
    const [width, height] = s.trim().split('x').map(Number);
    return { width, height };
  });

const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_PATH ||
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle'],
});
const page = await browser.newPage({ viewport: VIEWPORTS[0] });

await page.goto('http://127.0.0.1:4173/', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await page
  .waitForSelector('.loading', { state: 'detached', timeout: 300000 })
  .catch(() => console.error('loading never cleared'));
await page.waitForTimeout(4000);

const results = [];

for (const viewport of VIEWPORTS) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(1200);

  const report = await page.evaluate((viewportHeight) => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), height: Math.round(r.height) };
    };
    const parts = ['.body-rail', '.inspector', '.timeline']
      .map(box)
      .filter(Boolean);
    const top = Math.min(...parts.map((b) => b.top));
    const bottom = Math.max(...parts.map((b) => b.top + b.height));
    const stack = Math.round(bottom - top);
    return {
      rail: box('.body-rail'),
      inspector: box('.inspector'),
      timeline: box('.timeline'),
      stack,
      stackPercent: +((stack / viewportHeight) * 100).toFixed(1),
    };
  }, viewport.height);

  results.push({ viewport: `${viewport.width}x${viewport.height}`, ...report });

  if (process.env.OUT) {
    await page.screenshot({
      path: `${process.env.OUT}/${process.env.NAME || 'measure'}-${viewport.width}.png`,
    });
  }
}

console.log(JSON.stringify(results, null, 2));

await browser.close();
