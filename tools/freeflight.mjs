/**
 * Verify that entering free flight preserves the view instead of teleporting.
 *
 * Before the enterFree/exitFree wiring, pressing F snapped the camera to the
 * scene origin looking down -Z, because `freePosition` was still its initial
 * zero. The check: the rendered frame either side of the mode switch should be
 * broadly similar, and holding W should then actually move the camera.
 */

import { chromium } from '@playwright/test';

const OUT = process.env.OUT || 'shots';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle'],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto('http://127.0.0.1:4173/?tier=high', { waitUntil: 'networkidle', timeout: 120000 });
await page
  .waitForSelector('.loading', { state: 'detached', timeout: 240000 })
  .catch(() => console.log('loading never cleared'));
await page.waitForTimeout(4000);

await page.click('.body-chip:has-text("Jupiter")');
await page.waitForTimeout(9000);

/** Mean luminance of the left half, away from the HUD. */
async function brightness(name) {
  const buf = await page.screenshot({ clip: { x: 0, y: 70, width: 520, height: 560 } });
  await page.screenshot({ path: `${OUT}/${name}.png` });
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    }
    return sum / (data.length / 4);
  }, buf.toString('base64'));
}

const beforeSwitch = await brightness('ff-1-orbit');

await page.keyboard.press('f');
await page.waitForTimeout(3500);
const afterSwitch = await brightness('ff-2-entered');

// Hold W: the camera should move forward, so Jupiter grows and the frame
// brightens noticeably.
await page.keyboard.down('w');
await page.waitForTimeout(4000);
await page.keyboard.up('w');
await page.waitForTimeout(2500);
const afterThrust = await brightness('ff-3-thrust');

console.log(
  JSON.stringify(
    {
      beforeSwitch: +beforeSwitch.toFixed(2),
      afterSwitch: +afterSwitch.toFixed(2),
      afterThrust: +afterThrust.toFixed(2),
      viewPreserved: Math.abs(afterSwitch - beforeSwitch) < beforeSwitch * 0.6 + 3,
      thrustMoved: Math.abs(afterThrust - afterSwitch) > 0.5,
      errors,
    },
    null,
    2
  )
);

await browser.close();
