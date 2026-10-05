import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const base=process.env.MODULAR_BASE || 'http://127.0.0.1:4173/factory/templates/modular-editorial-v0.1/site/';
const apiBase='http://127.0.0.1:4173/api/admin';
const out=process.env.OUT_DIR || 'artifacts/persistent-admin';
fs.mkdirSync(out,{recursive:true});

const userDir=fs.mkdtempSync(path.join(os.tmpdir(),'web-admin-profile-'));
const checks=[];
const record=(name,pass,detail={})=>checks.push({name,pass,...detail});

async function openEditor(){
  const context=await chromium.launchPersistentContext(userDir,{
    headless:true,
    viewport:{width:1600,height:1000}
  });
  const page=context.pages()[0] || await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+'admin/?apiBase='+encodeURIComponent(apiBase),{
    waitUntil:'networkidle',
    timeout:30000
  });
  await page.waitForFunction(()=>document.querySelector('#api-status')?.textContent?.includes('Admin API: connected'));
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.length>0);
  return {context,page,errors};
}

let {context,page,errors}=await openEditor();

record(
  'api-authenticated',
  !(await page.locator('#save-github').isDisabled()) &&
    (await page.locator('#api-status').textContent()).includes('Authenticated: yes')
);

// Edit a value and wait for IndexedDB autosave.
await page.locator('#site-name').fill('PERSISTENT TEST');
await page.waitForFunction(()=>!document.querySelector('#local-status')?.textContent?.includes('Last local save: not yet'));
const localStatus1=await page.locator('#local-status').textContent();
record('indexeddb-autosave',localStatus1.includes('IndexedDB'),{localStatus:localStatus1});

// Create a snapshot before further edits.
page.once('dialog',dialog=>dialog.accept('QA snapshot'));
await page.locator('#snapshot-draft').click();
await page.waitForFunction(()=>document.querySelectorAll('#revision-select option').length>=1 && document.querySelector('#revision-select')?.value);
record('snapshot-created',Boolean(await page.locator('#revision-select').inputValue()));

// Make another edit, then restore snapshot.
await page.locator('#site-name').fill('AFTER SNAPSHOT');
await page.waitForTimeout(300);
await page.locator('#restore-revision').click();
await page.waitForFunction(()=>document.querySelector('#site-name')?.value==='PERSISTENT TEST');
record('snapshot-restore',true,{siteName:await page.locator('#site-name').inputValue()});

// Close entire browser context to prove browser-profile persistence, not sessionStorage.
await context.close();

({context,page,errors}=await openEditor());
await page.waitForFunction(()=>document.querySelector('#site-name')?.value==='PERSISTENT TEST');
const reopenStatus=await page.locator('#status').textContent();
const reopenedLocalStatus=await page.locator('#local-status').textContent();
record(
  'persists-across-browser-restart',
  (await page.locator('#site-name').inputValue())==='PERSISTENT TEST' &&
    reopenedLocalStatus.includes('local changes pending'),
  {status:reopenStatus,localStatus:reopenedLocalStatus}
);

// Commit through the mock authenticated backend.
await page.locator('#commit-message').fill('QA repository save');
const beforeStatus=await fetch(apiBase+'/status').then(r=>r.json());
await page.locator('#save-github').click();
await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Repository commit created:'));
const afterStatus=await fetch(apiBase+'/status').then(r=>r.json());
const apiText=await page.locator('#api-status').textContent();

const postCommitLocalStatus=await page.locator('#local-status').textContent();
record(
  'backend-commit',
  beforeStatus.head!==afterStatus.head &&
    afterStatus.head.startsWith('mock-') &&
    apiText.includes(afterStatus.head) &&
    postCommitLocalStatus.includes('no local changes pending'),
  {beforeHead:beforeStatus.head,afterHead:afterStatus.head,localStatus:postCommitLocalStatus}
);

const debug=await fetch('http://127.0.0.1:4173/api/admin/debug').then(r=>r.json());
record(
  'server-allowlisted-file-map',
  Array.isArray(debug.lastCommit?.changedFiles) &&
    debug.lastCommit.changedFiles.every(file=>file.startsWith('site/config/')) &&
    debug.lastCommit.changedFiles.length===5,
  {changedFiles:debug.lastCommit?.changedFiles}
);

// Stale base revision must conflict.
const staleResponse=await fetch(apiBase+'/commit',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({
    siteId:'modular-editorial-v0.1',
    message:'stale',
    baseRevision:beforeStatus.head,
    bundle:{site:{settings:{}},pages:{},content:{projects:{items:[]}}}
  })
});
const staleBody=await staleResponse.json();
record(
  'base-revision-conflict',
  staleResponse.status===409 && staleBody.error==='BASE_REVISION_CONFLICT',
  {status:staleResponse.status,error:staleBody.error}
);

// Invalid module types must be rejected and cannot influence file paths.
const sourceBundle=await page.evaluate(async ()=>{
  const [site,home,start,archive,projects]=await Promise.all([
    fetch('../config/site.json').then(r=>r.json()),
    fetch('../config/pages/home.json').then(r=>r.json()),
    fetch('../config/pages/start.json').then(r=>r.json()),
    fetch('../config/pages/archive.json').then(r=>r.json()),
    fetch('../config/content/projects.json').then(r=>r.json())
  ]);
  return {site,pages:{home,start,archive},content:{projects}};
});
sourceBundle.pages.home.modules.push({type:'../../arbitrary-path'});

const invalidResponse=await fetch(apiBase+'/commit',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({
    siteId:'modular-editorial-v0.1',
    message:'invalid module',
    baseRevision:afterStatus.head,
    bundle:sourceBundle
  })
});
const invalidBody=await invalidResponse.json();
record(
  'invalid-module-rejected',
  invalidResponse.status===422 && invalidBody.error==='INVALID_BUNDLE',
  {status:invalidResponse.status,details:invalidBody.details}
);

await page.screenshot({path:`${out}/persistent-admin.png`,fullPage:true});

const pass=checks.every(x=>x.pass) && errors.length===0;
const report={pass,checks,pageErrors:errors};
fs.writeFileSync(`${out}/qa.json`,JSON.stringify(report,null,2));
console.log('PERSISTENT_ADMIN_QA',JSON.stringify(report));

await context.close();
if(!pass) process.exitCode=2;
