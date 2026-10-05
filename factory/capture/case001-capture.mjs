import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const localBase = process.env.LOCAL_BASE || 'http://127.0.0.1:4173/cases/001-theminimalists/site/';
const outDir = process.env.OUT_DIR || 'artifacts/case001';
fs.mkdirSync(outDir, { recursive: true });

const pages = [
  ['home', 'https://www.theminimalists.com/', localBase],
  ['start', 'https://www.theminimalists.com/start/', localBase + 'start/'],
  ['resources', 'https://www.theminimalists.com/resources/', localBase + 'resources/'],
  ['archives', 'https://www.theminimalists.com/archives/', localBase + 'archives/'],
];

const viewports = [
  ['desktop', 1440, 900],
  ['compact', 1024, 768],
  ['mobile', 390, 844],
];

const browser = await chromium.launch({headless:true});
const report = [];

async function inspect(page) {
  return await page.evaluate(() => {
    const rect = sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        x: Math.round(r.x), y: Math.round(r.y),
        width: Math.round(r.width), height: Math.round(r.height),
        fontSize: s.fontSize, lineHeight: s.lineHeight,
        display: s.display, position: s.position
      };
    };
    const bodyText = (document.body?.innerText || '').slice(0,1200);
    const title = document.title;
    const challenge =
      /just a moment/i.test(title) ||
      /security verification|verify you are human|checking your browser|cloudflare/i.test(bodyText);
    return {
      title,
      challenge,
      body: {scrollWidth: document.body.scrollWidth, scrollHeight: document.body.scrollHeight},
      header: rect('header'),
      nav: rect('nav'),
      main: rect('main'),
      footer: rect('footer'),
      firstH1: rect('h1'),
      firstH2: rect('h2'),
      firstArticle: rect('article'),
      linkCount: document.querySelectorAll('a').length
    };
  });
}

for (const [vpName,width,height] of viewports) {
  for (const [name,refUrl,localUrl] of pages) {
    for (const [kind,url] of [['reference',refUrl],['local',localUrl]]) {
      const page = await browser.newPage({ viewport: {width,height} });
      try {
        await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
        await page.waitForTimeout(1800);
        const metrics = await inspect(page);
        const blocked = kind === 'reference' && metrics.challenge;
        const shot = path.join(outDir, `${kind}-${name}-${vpName}-${width}x${height}.png`);
        await page.screenshot({path:shot,fullPage:true});
        report.push({
          kind,name,viewport:vpName,width,height,url,
          status: blocked ? 'BLOCKED_REFERENCE_CAPTURE' : 'CAPTURED',
          metrics
        });
      } catch (e) {
        report.push({kind,name,viewport:vpName,width,height,url,status:'ERROR',error:String(e)});
      } finally {
        await page.close();
      }
    }
  }
}

await browser.close();
const reportPath = path.join(outDir,'metrics.json');
fs.writeFileSync(reportPath, JSON.stringify(report,null,2));

const summary = {
  localCaptured: report.filter(x => x.kind==='local' && x.status==='CAPTURED').length,
  referenceCaptured: report.filter(x => x.kind==='reference' && x.status==='CAPTURED').length,
  referenceBlocked: report.filter(x => x.kind==='reference' && x.status==='BLOCKED_REFERENCE_CAPTURE').length,
  errors: report.filter(x => x.status==='ERROR').length
};
fs.writeFileSync(path.join(outDir,'summary.json'), JSON.stringify(summary,null,2));
console.log('CASE001_CAPTURE_SUMMARY', JSON.stringify(summary));
console.log('CASE001_METRICS_START');
console.log(JSON.stringify(report));
console.log('CASE001_METRICS_END');
