import { chromium } from 'playwright';
import fs from 'node:fs';

const base=process.env.MODULAR_BASE || 'http://127.0.0.1:4173/factory/templates/modular-editorial-v0.1/site/';
const apiBase='http://127.0.0.1:4173/api/admin';
const out='artifacts/github-adapter-browser';
fs.mkdirSync(out,{recursive:true});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];
const checks=[];
const record=(name,pass,detail={})=>checks.push({name,pass,...detail});
page.on('pageerror',error=>errors.push(String(error)));

await page.goto(base+'admin/?apiBase='+encodeURIComponent(apiBase),{
  waitUntil:'networkidle',
  timeout:30000
});

await page.waitForFunction(()=>document.querySelector('#api-status')?.textContent?.includes('Authenticated: no'));

record(
  'initial-unauthenticated',
  !(await page.locator('#login-github').isDisabled()) &&
    (await page.locator('#logout-github').isDisabled()) &&
    (await page.locator('#save-github').isDisabled())
);

// The mock login endpoint models the real adapter callback by returning #admin_session.
await page.locator('#login-github').click();
await page.waitForFunction(()=>document.querySelector('#api-status')?.textContent?.includes('Authenticated: yes'));

const session=await page.evaluate(()=>sessionStorage.getItem('webDesignLab.adminSession.v0.1'));
record(
  'callback-session-captured',
  session==='qa-session' &&
    !location.hash.includes('admin_session') &&
    (await page.locator('#login-github').isDisabled()) &&
    !(await page.locator('#logout-github').isDisabled()) &&
    !(await page.locator('#save-github').isDisabled()),
  {session,hash:await page.evaluate(()=>location.hash)}
);

// Commit must succeed only because the API client supplied Bearer qa-session.
await page.locator('#site-name').fill('GITHUB SESSION QA');
await page.waitForTimeout(260);
await page.locator('#commit-message').fill('Adapter browser QA');
await page.locator('#save-github').click();
await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Repository commit created:'));

const debug=await fetch(apiBase+'/debug').then(r=>r.json());
record(
  'authenticated-bearer-commit',
  debug.head?.startsWith('mock-') &&
    debug.lastCommit?.message==='Adapter browser QA',
  {head:debug.head,message:debug.lastCommit?.message}
);

// Logout is client-side session destruction for the stateless adapter.
await page.locator('#logout-github').click();
await page.waitForFunction(()=>document.querySelector('#api-status')?.textContent?.includes('Authenticated: no'));

const sessionAfterLogout=await page.evaluate(()=>sessionStorage.getItem('webDesignLab.adminSession.v0.1'));
record(
  'logout-clears-session',
  sessionAfterLogout===null &&
    !(await page.locator('#login-github').isDisabled()) &&
    (await page.locator('#logout-github').isDisabled()) &&
    (await page.locator('#save-github').isDisabled()),
  {sessionAfterLogout}
);

await page.screenshot({path:`${out}/github-session-editor.png`,fullPage:true});

const pass=checks.every(x=>x.pass) && errors.length===0;
const report={pass,checks,pageErrors:errors};
fs.writeFileSync(`${out}/qa.json`,JSON.stringify(report,null,2));
console.log('GITHUB_ADAPTER_BROWSER_QA',JSON.stringify(report));

await browser.close();
if(!pass) process.exitCode=2;
