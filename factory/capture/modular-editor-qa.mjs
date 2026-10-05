import { chromium } from 'playwright';
import fs from 'node:fs';

const base=process.env.MODULAR_BASE || 'http://127.0.0.1:4173/factory/templates/modular-editorial-v0.1/site/';
const out=process.env.OUT_DIR || 'artifacts/modular-editor';
fs.mkdirSync(out,{recursive:true});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

await page.goto(base+'admin/',{waitUntil:'networkidle',timeout:30000});
await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('not written to GitHub'));

function previewFrame(){
  return page.frames().find(f=>f!==page.mainFrame() && f.url().includes('preview=admin'));
}

async function waitPreview(pageId,expectedWidth){
  await page.waitForFunction(
    ({pageId,expectedWidth})=>{
      const iframe=document.querySelector('#preview');
      try{
        const doc=iframe?.contentDocument;
        return doc?.documentElement?.dataset?.renderedPage===pageId &&
          Number(doc?.documentElement?.dataset?.contentWidth)===expectedWidth &&
          !doc?.documentElement?.dataset?.bootError;
      }catch{return false;}
    },
    {pageId,expectedWidth}
  );
}

await waitPreview('home',500);

const initial={
  page:await page.locator('#page-select').inputValue(),
  siteWidth:await page.locator('#site-width').inputValue(),
  pageWidth:await page.locator('#page-width').inputValue(),
  moduleCount:await page.locator('.module-item').count(),
  projectCount:await page.locator('.project-card').count()
};

const checks=[];

function record(name,pass,detail={}){
  checks.push({name,pass,...detail});
}

// 1. Existing recipe override remains 500 while site default is 540.
record(
  'initial-home-override',
  initial.page==='home' && initial.siteWidth==='540' && initial.pageWidth==='500',
  initial
);

// 2. Change site default. Home should remain overridden at 500.
await page.locator('#site-width').fill('600');
await waitPreview('home',500);
record('site-default-does-not-break-page-override',true,{siteWidth:600,previewWidth:500});

// 3. Inherit site width. Preview should become 600.
await page.locator('#page-width-inherit').check();
await waitPreview('home',600);
record('page-inherit-site-width',true,{previewWidth:600});

// 4. Create a page override at 510.
await page.locator('#page-width-inherit').uncheck();
await page.locator('#page-width').fill('510');
await waitPreview('home',510);
record('page-width-override-live',true,{previewWidth:510});

// 5. Site identity live update.
await page.locator('#site-name').fill('EDITOR TEST');
await page.waitForFunction(()=>{
  const iframe=document.querySelector('#preview');
  return iframe?.contentDocument?.querySelector('.brand')?.textContent==='EDITOR TEST';
});
record('identity-live-preview',true);

// 6. Content edit updates the rendered featured title.
const firstProjectTitle=page.locator('.project-card').first().locator('input').first();
await firstProjectTitle.fill('Edited Project Title');
await page.waitForFunction(()=>{
  const iframe=document.querySelector('#preview');
  return iframe?.contentDocument?.querySelector('.featured h1')?.textContent?.includes('Edited Project Title');
});
record('content-live-preview',true);

// 7. Add a module.
await page.locator('#add-module-type').selectOption('spacer');
await page.locator('#add-module').click();
const afterAdd=await page.locator('.module-item').count();
record('add-module',afterAdd===initial.moduleCount+1,{before:initial.moduleCount,after:afterAdd});

// 8. Reorder by UI button (the same array powers drag/drop).
const beforeOrder=await page.locator('.module-type').allTextContents();
const lastItem=page.locator('.module-item').last();
await lastItem.locator('.module-actions button').first().click();
const afterOrder=await page.locator('.module-type').allTextContents();
record(
  'reorder-module',
  JSON.stringify(beforeOrder)!==JSON.stringify(afterOrder),
  {before:beforeOrder,after:afterOrder}
);

// 9. Module JSON editor changes the selected module.
await page.locator('.module-main').last().click();
const jsonText=await page.locator('#module-json').inputValue();
let json=JSON.parse(jsonText);
json.size='large';
await page.locator('#module-json').fill(JSON.stringify(json,null,2));
await page.locator('#apply-module-json').click();
const applied=JSON.parse(await page.locator('#module-json').inputValue());
record('module-json-edit',applied.size==='large',{applied});

// 10. Switch to Start page. It should retain its own 540 page setting.
await page.locator('#page-select').selectOption('start');
await waitPreview('start',540);
record('page-switch-recipe',true,{page:'start',previewWidth:540});

// 11. Export bundle.
const downloadPromise=page.waitForEvent('download');
await page.locator('#export-bundle').click();
const download=await downloadPromise;
record('export-bundle',download.suggestedFilename()==='modular-site-draft.json',{filename:download.suggestedFilename()});

// 12. Reset to source and ensure source state returns.
page.once('dialog',dialog=>dialog.accept());
await page.locator('#reset-source').click();
await waitPreview('home',500);
const resetName=await page.locator('#site-name').inputValue();
const resetModuleCount=await page.locator('.module-item').count();
record(
  'reset-source',
  resetName==='FIELD NOTES' && resetModuleCount===initial.moduleCount,
  {resetName,resetModuleCount}
);

await page.screenshot({path:`${out}/editor-desktop.png`,fullPage:true});

const preview=previewFrame();
const finalPreviewMetrics=preview ? await preview.evaluate(()=>({
  renderedPage:document.documentElement.dataset.renderedPage,
  contentWidth:document.documentElement.dataset.contentWidth,
  bodyScrollWidth:document.body.scrollWidth,
  moduleErrors:document.querySelectorAll('.module-error').length,
  bootError:document.documentElement.dataset.bootError||null
})) : null;

const pass=checks.every(x=>x.pass) &&
  pageErrors.length===0 &&
  finalPreviewMetrics?.moduleErrors===0 &&
  !finalPreviewMetrics?.bootError;

const report={pass,checks,pageErrors,finalPreviewMetrics};
fs.writeFileSync(`${out}/qa.json`,JSON.stringify(report,null,2));
console.log('MODULAR_EDITOR_QA',JSON.stringify(report));

await browser.close();
if(!pass) process.exitCode=2;
