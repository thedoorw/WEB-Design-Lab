import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve(process.env.STATIC_ROOT || '.');
const port=Number(process.env.PORT || 4173);
const allowedModules=new Set([
  'promo','introSplit','featuredEntry','entryStream',
  'richText','archiveList','spacer','pagination'
]);
const allowedPages=['home','start','archive'];

let head='mock-head-001';
let lastCommit=null;

function json(res,status,body){
  const text=JSON.stringify(body);
  res.writeHead(status,{
    'Content-Type':'application/json; charset=utf-8',
    'Content-Length':Buffer.byteLength(text),
    'Cache-Control':'no-store'
  });
  res.end(text);
}

function validateBundle(bundle){
  const errors=[];
  if(!bundle || typeof bundle!=='object') errors.push('bundle must be an object');
  if(!bundle?.site?.settings) errors.push('bundle.site.settings is required');
  if(!bundle?.pages || typeof bundle.pages!=='object') errors.push('bundle.pages is required');
  if(!Array.isArray(bundle?.content?.projects?.items)) errors.push('bundle.content.projects.items must be an array');

  const topKeys=bundle && typeof bundle==='object' ? Object.keys(bundle) : [];
  for(const key of topKeys){
    if(!['site','pages','content'].includes(key)) errors.push(`unknown top-level key: ${key}`);
  }

  for(const [pageId,page] of Object.entries(bundle?.pages || {})){
    if(!allowedPages.includes(pageId)) errors.push(`unknown page id: ${pageId}`);
    if(!Array.isArray(page?.modules)) errors.push(`page ${pageId} modules must be an array`);
    for(const mod of page?.modules || []){
      if(!allowedModules.has(mod?.type)) errors.push(`unknown module type: ${mod?.type}`);
    }
  }
  return errors;
}

function fileMap(bundle){
  const files=['site/config/site.json','site/config/content/projects.json'];
  for(const pageId of allowedPages){
    if(bundle.pages?.[pageId]) files.push(`site/config/pages/${pageId}.json`);
  }
  return files;
}

async function readBody(req){
  const chunks=[];
  for await (const chunk of req) chunks.push(chunk);
  const text=Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

function mime(file){
  const ext=path.extname(file).toLowerCase();
  return {
    '.html':'text/html; charset=utf-8',
    '.js':'text/javascript; charset=utf-8',
    '.mjs':'text/javascript; charset=utf-8',
    '.css':'text/css; charset=utf-8',
    '.json':'application/json; charset=utf-8',
    '.png':'image/png',
    '.svg':'image/svg+xml'
  }[ext] || 'application/octet-stream';
}

function safeFile(urlPath){
  let decoded='/';
  try{ decoded=decodeURIComponent(urlPath); }catch{}
  const normalized=path.normalize(decoded).replace(/^([/\\])+/, '');
  const resolved=path.resolve(root,normalized);
  if(!resolved.startsWith(root)) return null;
  let target=resolved;
  try{
    if(fs.statSync(target).isDirectory()) target=path.join(target,'index.html');
  }catch{}
  return target;
}

const server=http.createServer(async (req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');

  if(url.pathname==='/api/admin/status' && req.method==='GET'){
    return json(res,200,{
      ok:true,
      authenticated:true,
      user:{login:'mock-user'},
      repository:'mock/site-repo',
      branch:'main',
      head
    });
  }

  if(url.pathname==='/api/admin/commit' && req.method==='POST'){
    let body;
    try{ body=await readBody(req); }
    catch{ return json(res,400,{ok:false,error:'INVALID_JSON'}); }

    if(body.siteId!=='modular-editorial-v0.1'){
      return json(res,403,{ok:false,error:'SITE_NOT_AUTHORIZED'});
    }

    if(body.baseRevision && body.baseRevision!==head){
      return json(res,409,{ok:false,error:'BASE_REVISION_CONFLICT',currentHead:head});
    }

    const errors=validateBundle(body.bundle);
    if(errors.length){
      return json(res,422,{ok:false,error:'INVALID_BUNDLE',details:errors});
    }

    const changedFiles=fileMap(body.bundle);
    const commitSha='mock-'+crypto
      .createHash('sha1')
      .update(JSON.stringify({head,message:body.message,bundle:body.bundle}))
      .digest('hex')
      .slice(0,12);

    lastCommit={
      commitSha,
      previousHead:head,
      message:body.message || '',
      changedFiles,
      at:new Date().toISOString()
    };
    head=commitSha;

    return json(res,200,{
      ok:true,
      commitSha,
      branch:'main',
      changedFiles
    });
  }

  if(url.pathname==='/api/admin/debug' && req.method==='GET'){
    return json(res,200,{ok:true,head,lastCommit});
  }

  const file=safeFile(url.pathname);
  if(!file || !fs.existsSync(file) || !fs.statSync(file).isFile()){
    res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
    return res.end('Not found');
  }

  const data=fs.readFileSync(file);
  res.writeHead(200,{
    'Content-Type':mime(file),
    'Content-Length':data.length,
    'Cache-Control':'no-store'
  });
  res.end(data);
});

server.listen(port,'127.0.0.1',()=>{
  console.log(`MOCK_ADMIN_SERVER http://127.0.0.1:${port}`);
});
