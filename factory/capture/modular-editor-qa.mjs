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

async function previewInnerWidth(){
  return page.locator('#preview').evaluate(iframe=>iframe.contentWindow.innerWidth);
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

record(
  'initial-home-override',
  initial.page==='home' && initial.siteWidth==='540' && initial.pageWidth==='500',
  initial
);

// Preview buttons must set real iframe viewport widths, not scaled approximations.
for(const [label,width] of [['Desktop',1440],['Compact',1024],['Mobile',390]]){
  await page.getByRole('button',{name:label,exact:true}).click();
  await page.waitForFunction(
    width=>document.querySelector('#preview')?.contentWindow?.innerWidth===width,
    width
  );
  const actual=await previewInnerWidth();
  record(`preview-viewport-${label.toLowerCase()}`,actual===width,{target:width,actual});
}
await page.getByRole('button',{name:'Desktop',exact:true}).click();
await page.waitForFunction(()=>document.querySelector('#preview')?.contentWindow?.innerWidth===1440);

// Site default changes while page override remains authoritative.
await page.locator('#site-width').fill('600');
await waitPreview('home',500);
record('site-default-does-not-break-page-override',true,{siteWidth:600,previewWidth:500});

// Inherit site width.
await page.locator('#page-width-inherit').check();
await waitPreview('home',600);
record('page-inherit-site-width',true,{previewWidth:600});

// Restore a page override.
await page.locator('#page-width-inherit').uncheck();
await page.locator('#page-width').fill('510');
await waitPreview('home',510);
record('page-width-override-live',true,{previewWidth:510});

// Identity live preview.
await page.locator('#site-name').fill('EDITOR TEST');
await page.waitForFunction(()=>{
  const iframe=document.querySelector('#preview');
  return iframe?.contentDocument?.querySelector('.brand')?.textContent==='EDITOR TEST';
});
record('identity-live-preview',true);

// Content live preview.
const firstProjectTitle=page.locator('.project-card').first().locator('input').first();
await firstProjectTitle.fill('Edited Project Title');
await page.waitForFunction(()=>{
  const iframe=document.querySelector('#preview');
  return iframe?.contentDocument?.querySelector('.featured h1')?.textContent?.includes('Edited Project Title');
});
record('content-live-preview',true);

// Add module.
await page.locator('#add-module-type').selectOption('spacer');
await page.locator('#add-module').click();
const afterAdd=await page.locator('.module-item').count();
record('add-module',afterAdd===initial.moduleCount+1,{before:initial.moduleCount,after:afterAdd});

// True drag/drop reorder: move first module onto second.
const beforeDrag=await page.locator('.module-type').allTextContents();
await page.locator('.module-item').nth(0).dragTo(page.locator('.module-item').nth(1));
await page.waitForTimeout(80);
const afterDrag=await page.locator('.module-type').allTextContents();
record(
  'drag-reorder-module',
  beforeDrag[0]!==afterDrag[0],
  {before:beforeDrag.slice(0,3),after:afterDrag.slice(0,3)}
);

// Button reorder remains available as keyboard/accessibility fallback.
const beforeButton=await page.locator('.module-type').allTextContents();
const lastItem=page.locator('.module-item').last();
await lastItem.locator('.module-actions button').first().click();
const afterButton=await page.locator('.module-type').allTextContents();
record(
  'button-reorder-module',
  JSON.stringify(beforeButton)!==JSON.stringify(afterButton),
  {before:beforeButton,after:afterButton}
);

// Module JSON editor.
await page.locator('.module-main').last().click();
const jsonText=await page.locator('#module-json').inputValue();
let json=JSON.parse(jsonText);
json.__qaMarker='edited';
await page.locator('#module-json').fill(JSON.stringify(json,null,2));
await page.locator('#apply-module-json').click();
const applied=JSON.parse(await page.locator('#module-json').inputValue());
record('module-json-edit',applied.__qaMarker==='edited',{type:applied.type});

// Switch page recipe.
await page.locator('#page-select').selectOption('start');
await waitPreview('start',540);
record('page-switch-recipe',true,{page:'start',previewWidth:540});

// Export bundle.
const downloadPromise=page.waitForEvent('download');
await page.locator('#export-bundle').click();
const download=await downloadPromise;
record('export-bundle',download.suggestedFilename()==='modular-site-draft.json',{filename:download.suggestedFilename()});

// Reset source.
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

// Return to compact viewport for a useful evidence screenshot.
await page.getByRole('button',{name:'Compact',exact:true}).click();
await page.waitForFunction(()=>document.querySelector('#preview')?.contentWindow?.innerWidth===1024);
await page.locator('.editor-sidebar').evaluate(el=>el.scrollTop=0);
await page.screenshot({path:`${out}/editor-desktop.png`,fullPage:true});

const finalPreviewMetrics=await page.locator('#preview').evaluate(iframe=>{
  const doc=iframe.contentDocument;
  return {
    innerWidth:iframe.contentWindow.innerWidth,
    renderedPage:doc.documentElement.dataset.renderedPage,
    contentWidth:doc.documentElement.dataset.contentWidth,
    bodyScrollWidth:doc.body.scrollWidth,
    moduleErrors:doc.querySelectorAll('.module-error').length,
    bootError:doc.documentElement.dataset.bootError||null
  };
});

const pass=checks.every(x=>x.pass) &&
  pageErrors.length===0 &&
  finalPreviewMetrics.moduleErrors===0 &&
  !finalPreviewMetrics.bootError;

const report={pass,checks,pageErrors,finalPreviewMetrics};
fs.writeFileSync(`${out}/qa.json`,JSON.stringify(report,null,2));
console.log('MODULAR_EDITOR_QA',JSON.stringify(report));

await browser.close();
if(!pass) process.exitCode=2;
