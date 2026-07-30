/**
 * Capture a set of close-approach screenshots in one browser session.
 *
 * The procedural bakes take a long time under SwiftShader, so paying that cost
 * once and taking every shot from the same page is far faster than launching
 * per shot.
 */

import { chromium } from '@playwright/test';

const OUT = process.env.OUT || 'shots';
const URL = process.env.URL || 'http://127.0.0.1:4173/?tier=high';
const PREFIX = process.env.PREFIX || '';
const VIEWPORT = (process.env.VIEWPORT || '1440x900').split('x').map(Number);

const TARGETS = (process.env.TARGETS || 'Earth,Jupiter,Saturn,Mars,Neptune').split(',');

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({
  viewport: { width: VIEWPORT[0], height: VIEWPORT[1] },
  deviceScaleFactor: 1,
});

const logs = [];
page.on('console', (m) => {
  const t = m.text();
  if (t.includes('GPU stall')) return;
  logs.push(`[${m.type()}] ${t.slice(0, 300)}`);
});
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 120000 });
await page
  .waitForSelector('.loading', { state: 'detached', timeout: 240000 })
  .catch(() => logs.push('[warn] loading never cleared'));
await page.waitForTimeout(4000);

for (const target of TARGETS) {
  await page.click(`.body-chip:has-text("${target}")`).catch((e) =>
    logs.push(`[click ${target}] ${e.message}`)
  );
  // The fly-to is a spring; give it time to arrive.
  await page.waitForTimeout(7000);

  // Swing round toward the lit side so the shot shows a terminator rather
  // than a flat disc or a dark one.
  await page.mouse.move(VIEWPORT[0] / 2, VIEWPORT[1] / 2);
  await page.mouse.down();
  for (let i = 1; i <= 14; i++) {
    await page.mouse.move(VIEWPORT[0] / 2 - i * 16, VIEWPORT[1] / 2 - i * 2);
    await page.waitForTimeout(40);
  }
  await page.mouse.up();
  await page.waitForTimeout(5000);

  const name = `${PREFIX}${target.toLowerCase()}`;
  await page.screenshot({ path: `${OUT}/${name}.png` });

  const stats = await page.evaluate(() => {
    const dd = document.querySelectorAll('.inspector__live dd');
    return {
      title: document.querySelector('.inspector__title')?.textContent,
      cam: dd[0]?.textContent,
      sun: dd[1]?.textContent,
      light: dd[2]?.textContent,
    };
  });
  console.log(name, JSON.stringify(stats));
}

if (logs.length) {
  console.log('--- console ---');
  console.log(logs.slice(0, 30).join('\n'));
}

await browser.close();
