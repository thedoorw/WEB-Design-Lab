import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.env.STARTER_BASE || 'http://127.0.0.1:4173/factory/templates/editorial-shell-v0.1/site/';
const out = process.env.OUT_DIR || 'artifacts/editorial-starter';
fs.mkdirSync(out,{recursive:true});

const viewports = [
  ['desktop',1440,900],
  ['compact',1024,768],
  ['mobile',390,844],
];

const browser = await chromium.launch({headless:true});
const results=[];

for(const [name,width,height] of viewports){
  const page = await browser.newPage({viewport:{width,height}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(100);

  const metrics = await page.evaluate(() => {
    const r = sel => {
      const el=document.querySelector(sel);
      if(!el) return null;
      const box=el.getBoundingClientRect();
      const s=getComputedStyle(el);
      return {
        x:Math.round(box.x), y:Math.round(box.y),
        width:Math.round(box.width), height:Math.round(box.height),
        display:s.display, fontSize:s.fontSize
      };
    };
    return {
      body:{scrollWidth:document.body.scrollWidth,scrollHeight:document.body.scrollHeight},
      shell:r('.shell'),
      reading:r('.reading'),
      nav:r('#site-nav'),
      toggle:r('.nav-toggle'),
      h1:r('h1'),
      entryCount:document.querySelectorAll('.entry').length
    };
  });

  await page.screenshot({path:`${out}/${name}-${width}x${height}.png`,fullPage:true});

  const overflow=Math.max(0,metrics.body.scrollWidth-width);
  const expectedReading=name==='mobile'?330:540;
  const widthDelta=Math.abs((metrics.reading?.width ?? 0)-expectedReading);
  const navStatePass=name==='mobile'
    ? metrics.nav?.display==='none' && metrics.toggle?.display!=='none'
    : metrics.nav?.display!=='none' && metrics.toggle?.display==='none';

  const pass=overflow===0 && widthDelta<=1 && navStatePass && errors.length===0 && metrics.entryCount>=3;
  results.push({name,width,height,pass,overflow,expectedReading,widthDelta,navStatePass,errors,metrics});
  await page.close();
}

await browser.close();
const pass=results.every(x=>x.pass);
fs.writeFileSync(`${out}/smoke.json`,JSON.stringify({pass,results},null,2));
console.log('EDITORIAL_STARTER_SMOKE',JSON.stringify({pass,results}));
if(!pass) process.exitCode=2;
