import { chromium } from 'playwright';
import fs from 'node:fs';

const base=process.env.MODULAR_BASE || 'http://127.0.0.1:4173/factory/templates/modular-editorial-v0.1/site/';
const outDir=process.env.OUT_DIR || 'artifacts/modular-editorial';
fs.mkdirSync(outDir,{recursive:true});

const browser=await chromium.launch({headless:true});
const results=[];

const cases=[
  {name:'home-desktop',url:base,width:1440,height:900,expectedWidth:500,minEntries:4},
  {name:'start-desktop',url:base+'start/',width:1440,height:900,expectedWidth:540,minEntries:2},
  {name:'archive-desktop',url:base+'archive/',width:1440,height:900,expectedWidth:540,minEntries:0},
  {name:'home-mobile',url:base,width:390,height:844,expectedWidth:330,minEntries:4},
  {name:'start-mobile',url:base+'start/',width:390,height:844,expectedWidth:330,minEntries:2}
];

for(const tc of cases){
  const page=await browser.newPage({viewport:{width:tc.width,height:tc.height}});
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));

  await page.goto(tc.url,{waitUntil:'networkidle',timeout:30000});

  const metrics=await page.evaluate(()=>{
    const reading=document.querySelector('.reading');
    const root=getComputedStyle(document.documentElement);
    return {
      bootError:document.documentElement.dataset.bootError || null,
      dataContentWidth:document.documentElement.dataset.contentWidth || null,
      bodyScrollWidth:document.body.scrollWidth,
      readingWidth:reading ? Math.round(reading.getBoundingClientRect().width) : null,
      moduleErrors:document.querySelectorAll('.module-error').length,
      entries:document.querySelectorAll('.entry').length,
      promos:document.querySelectorAll('.promo').length,
      intros:document.querySelectorAll('.intro').length,
      richText:document.querySelectorAll('.rich-text').length,
      archiveLists:document.querySelectorAll('.archive-list').length,
      cssContentWidth:root.getPropertyValue('--content-width').trim(),
      cssMobileWidth:root.getPropertyValue('--mobile-width').trim()
    };
  });

  const overflow=Math.max(0,metrics.bodyScrollWidth-tc.width);
  const pass=
    !metrics.bootError &&
    pageErrors.length===0 &&
    metrics.moduleErrors===0 &&
    overflow===0 &&
    metrics.readingWidth===tc.expectedWidth &&
    metrics.entries>=tc.minEntries;

  await page.screenshot({path:`${outDir}/${tc.name}.png`,fullPage:true});
  results.push({...tc,pass,overflow,pageErrors,metrics});
  await page.close();
}

const settingsPage=await browser.newPage({viewport:{width:1440,height:900}});
await settingsPage.goto(base+'settings-preview/',{waitUntil:'networkidle',timeout:30000});

async function previewWidth(){
  return settingsPage.evaluate(()=>Math.round(document.querySelector('.preview-stage').getBoundingClientRect().width));
}

await settingsPage.selectOption('#content-width','500');
await settingsPage.waitForTimeout(50);
const width500=await previewWidth();

await settingsPage.selectOption('#content-width','540');
await settingsPage.waitForTimeout(50);
const width540=await previewWidth();

const settingsPass=width500===500 && width540===540;
await settingsPage.screenshot({path:`${outDir}/settings-preview.png`,fullPage:true});
await settingsPage.close();

results.push({
  name:'settings-preview',
  pass:settingsPass,
  width500,
  width540
});

await browser.close();

const pass=results.every(x=>x.pass);
const report={pass,results};
fs.writeFileSync(`${outDir}/qa.json`,JSON.stringify(report,null,2));
console.log('MODULAR_EDITORIAL_QA',JSON.stringify(report));
if(!pass) process.exitCode=2;
