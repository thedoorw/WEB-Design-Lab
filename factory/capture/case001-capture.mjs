import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const localBase = process.env.LOCAL_BASE || 'http://127.0.0.1:4173/cases/001-theminimalists/site/';
const outDir = process.env.OUT_DIR || 'artifacts/case001';
const baselinePath = process.env.BASELINE_JSON || 'cases/001-theminimalists/TRU_BASELINE_v0.1.json';
fs.mkdirSync(outDir, { recursive: true });

const includeLiveReference = process.env.INCLUDE_LIVE_REFERENCE === '1';
const includeTheme = process.env.INCLUDE_THEME === '1';

const liveReferenceTargets = [
  ['reference','home','https://www.theminimalists.com/'],
  ['reference','start','https://www.theminimalists.com/start/'],
  ['reference','resources','https://www.theminimalists.com/resources/'],
  ['reference','archives','https://www.theminimalists.com/archives/'],
];

const targets = [
  ...(includeLiveReference ? liveReferenceTargets : []),
  ...(includeTheme ? [['theme','home','https://tru.spyr.me/']] : []),
  ['local','home',localBase],
  ['local','start',localBase + 'start/'],
  ['local','resources',localBase + 'resources/'],
  ['local','archives',localBase + 'archives/'],
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
        display: s.display, position: s.position,
        marginTop: s.marginTop, marginBottom: s.marginBottom,
        paddingLeft: s.paddingLeft, paddingRight: s.paddingRight
      };
    };
    const bodyText = (document.body?.innerText || '').slice(0,1600);
    const title = document.title;
    const challenge =
      /just a moment/i.test(title) ||
      /security verification|verify you are human|checking your browser|cloudflare/i.test(bodyText);
    return {
      title,
      challenge,
      body: {scrollWidth: document.body.scrollWidth, scrollHeight: document.body.scrollHeight},
      header: rect('header'),
      siteHeader: rect('.site-header'),
      nav: rect('nav'),
      firstNavList: rect('nav ul'),
      main: rect('main'),
      content: rect('.content'),
      siteInner: rect('.site-inner'),
      footer: rect('footer'),
      firstH1: rect('h1'),
      firstH2: rect('h2'),
      firstArticle: rect('article'),
      firstEntry: rect('.entry'),
      firstImage: rect('img'),
      firstForm: rect('form'),
      linkCount: document.querySelectorAll('a').length,
      articleCount: document.querySelectorAll('article').length,
      headings: [...document.querySelectorAll('h2')].slice(0,8).map((el,index) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return {
          index,
          text: (el.textContent || '').trim().slice(0,80),
          x: Math.round(r.x),
          y: Math.round(r.y),
          width: Math.round(r.width),
          height: Math.round(r.height),
          fontSize: s.fontSize,
          lineHeight: s.lineHeight
        };
      })
    };
  });
}

for (const [vpName,width,height] of viewports) {
  for (const [kind,name,url] of targets) {
    const page = await browser.newPage({ viewport: {width,height} });
    try {
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForTimeout(kind === 'local' ? 150 : 1800);
      const metrics = await inspect(page);
      const blocked = kind === 'reference' && metrics.challenge;
      const unstableTheme =
        kind === 'theme' &&
        (metrics.body.scrollWidth > width * 1.1 || metrics.body.scrollHeight > 6000);
      const status = blocked
        ? 'BLOCKED_REFERENCE_CAPTURE'
        : unstableTheme
          ? 'UNSTABLE_THEME_CAPTURE'
          : 'CAPTURED';
      const shot = path.join(outDir, `${kind}-${name}-${vpName}-${width}x${height}.png`);
      await page.screenshot({path:shot,fullPage:true});
      report.push({kind,name,viewport:vpName,width,height,url,status,metrics});
    } catch (e) {
      report.push({kind,name,viewport:vpName,width,height,url,status:'ERROR',error:String(e)});
    } finally {
      await page.close();
    }
  }
}

await browser.close();
fs.writeFileSync(path.join(outDir,'metrics.json'), JSON.stringify(report,null,2));

const baseline = JSON.parse(fs.readFileSync(baselinePath,'utf8'));
const comparisons = [];

for (const [vpName,width] of viewports.map(([name,w]) => [name,w])) {
  const local = report.find(x => x.kind === 'local' && x.name === 'home' && x.viewport === vpName);
  const expected = baseline.viewports[vpName];
  if (!local || local.status !== 'CAPTURED') {
    comparisons.push({viewport:vpName,status:'NO_LOCAL_CAPTURE'});
    continue;
  }

  const actualHeadings = (local.metrics.headings || []).slice(0, expected.heading_y.length);
  const headingDeltas = expected.heading_y.map((targetY,index) => {
    const actual = actualHeadings[index];
    return {
      index,
      targetY,
      actualY: actual?.y ?? null,
      deltaY: actual ? actual.y - targetY : null,
      targetFontPx: expected.heading_font_px[index],
      actualFontPx: actual ? Number.parseFloat(actual.fontSize) : null,
      deltaFontPx: actual ? Number.parseFloat(actual.fontSize) - expected.heading_font_px[index] : null
    };
  });

  const maxHeadingYDelta = Math.max(...headingDeltas.map(x => x.deltaY === null ? 9999 : Math.abs(x.deltaY)));
  const maxFontDelta = Math.max(...headingDeltas.map(x => x.deltaFontPx === null ? 9999 : Math.abs(x.deltaFontPx)));
  const horizontalOverflow = Math.max(0, local.metrics.body.scrollWidth - width);
  const contentWidthDelta = actualHeadings[0]
    ? Math.abs(actualHeadings[0].width - expected.content_width)
    : 9999;

  const pass =
    maxHeadingYDelta <= baseline.tolerances.heading_y_px &&
    maxFontDelta <= baseline.tolerances.heading_font_px &&
    contentWidthDelta <= baseline.tolerances.content_width_px &&
    horizontalOverflow <= baseline.tolerances.horizontal_overflow_px;

  comparisons.push({
    viewport:vpName,
    status:pass ? 'PASS' : 'REVISE',
    contentWidthTarget:expected.content_width,
    contentWidthActual:actualHeadings[0]?.width ?? null,
    contentWidthDelta,
    horizontalOverflow,
    maxHeadingYDelta,
    maxFontDelta,
    headingDeltas,
    pageScrollHeightTarget:expected.page_scroll_height,
    pageScrollHeightActual:local.metrics.body.scrollHeight,
    pageScrollHeightDelta:local.metrics.body.scrollHeight - expected.page_scroll_height
  });
}

const baselinePass = comparisons.every(x => x.status === 'PASS');
fs.writeFileSync(path.join(outDir,'comparison.json'), JSON.stringify({baselinePass,comparisons},null,2));

const summary = {
  localCaptured: report.filter(x => x.kind==='local' && x.status==='CAPTURED').length,
  themeCaptured: report.filter(x => x.kind==='theme' && x.status==='CAPTURED').length,
  themeUnstable: report.filter(x => x.kind==='theme' && x.status==='UNSTABLE_THEME_CAPTURE').length,
  referenceCaptured: report.filter(x => x.kind==='reference' && x.status==='CAPTURED').length,
  referenceBlocked: report.filter(x => x.kind==='reference' && x.status==='BLOCKED_REFERENCE_CAPTURE').length,
  errors: report.filter(x => x.status==='ERROR').length,
  baselinePass
};
fs.writeFileSync(path.join(outDir,'summary.json'), JSON.stringify(summary,null,2));
console.log('CASE001_CAPTURE_SUMMARY', JSON.stringify(summary));
console.log('CASE001_BASELINE_COMPARISON', JSON.stringify(comparisons));
console.log('CASE001_METRICS_START');
console.log(JSON.stringify(report));
console.log('CASE001_METRICS_END');

if (!baselinePass) {
  process.exitCode = 2;
}
