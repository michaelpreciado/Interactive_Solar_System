import { chromium } from '@playwright/test';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle'] });
const p = await b.newPage({ viewport:{width:1280,height:800} });
await p.goto('http://127.0.0.1:4173/?tier=high', { waitUntil:'networkidle' });
await p.waitForSelector('.loading', { state:'detached', timeout: 240000 }).catch(()=>console.log('loading never cleared'));
await p.waitForTimeout(3000);
const r = await p.evaluate(() => {
  const at = (x,y) => { const e = document.elementFromPoint(x,y); return e ? `${e.tagName}.${e.className}` : 'none'; };
  const canvas = document.querySelector('canvas');
  const cs = canvas ? getComputedStyle(canvas) : null;
  const parent = canvas?.parentElement;
  return {
    at640_400: at(640,400), at300_200: at(300,200), at640_650: at(640,650),
    canvasRect: canvas?.getBoundingClientRect().toJSON(),
    canvasPE: cs?.pointerEvents, canvasUS: cs?.userSelect,
    parent: parent ? `${parent.tagName}.${parent.className}` : null,
    parentStyle: parent ? getComputedStyle(parent).cssText.slice(0,120) : null,
  };
});
console.log(JSON.stringify(r,null,2));
// now try a real drag and report whether pointerdown fired on canvas
await p.evaluate(() => { window.__pd = 0; document.querySelector('canvas').addEventListener('pointerdown', ()=>window.__pd++, true); });
await p.mouse.move(500,300); await p.mouse.down(); await p.mouse.move(700,380,{steps:8}); await p.mouse.up();
console.log('pointerdown count:', await p.evaluate(()=>window.__pd));
await b.close();
