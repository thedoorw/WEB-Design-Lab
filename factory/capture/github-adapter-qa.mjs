import fs from 'node:fs';
import {
  bundleToFiles,
  validateBundle,
  BundleValidationError
} from '../persistence/github-app-worker/bundle.js';
import {
  sealJson,
  openJson,
  sha256Base64Url
} from '../persistence/github-app-worker/crypto.js';
import {
  atomicCommit,
  GitHubAdapterError
} from '../persistence/github-app-worker/github.js';
import worker from '../persistence/github-app-worker/worker.js';

const checks=[];
const record=(name,pass,detail={})=>checks.push({name,pass,...detail});

function loadJson(path){
  return JSON.parse(fs.readFileSync(path,'utf8'));
}

const base='factory/templates/modular-editorial-v0.1/site/config/';
const validBundle={
  site:loadJson(base+'site.json'),
  pages:{
    home:loadJson(base+'pages/home.json'),
    start:loadJson(base+'pages/start.json'),
    archive:loadJson(base+'pages/archive.json')
  },
  content:{
    projects:loadJson(base+'content/projects.json')
  }
};

// Bundle mapping.
const files=bundleToFiles(validBundle);
record(
  'bundle-file-map',
  files.length===5 &&
    files.map(x=>x.path).join('|')===
      [
        'site/config/site.json',
        'site/config/content/projects.json',
        'site/config/pages/home.json',
        'site/config/pages/start.json',
        'site/config/pages/archive.json'
      ].join('|'),
  {paths:files.map(x=>x.path)}
);

// Invalid module/path-like input must fail validation.
const invalid=structuredClone(validBundle);
invalid.pages.home.modules.push({type:'../../secret'});
const errors=validateBundle(invalid);
record(
  'invalid-module-rejected',
  errors.some(x=>x.includes('unknown module type')),
  {errors}
);

// Session encryption.
const secret='qa-session-secret-long-enough';
const sealed=await sealJson({
  githubToken:'ghu_SUPER_SECRET',
  user:{login:'qa-user'},
  exp:Date.now()+60000
},secret);
const opened=await openJson(sealed,secret);
record(
  'sealed-session',
  opened.githubToken==='ghu_SUPER_SECRET' &&
    !sealed.includes('ghu_SUPER_SECRET'),
  {tokenPrefix:sealed.slice(0,10)}
);

// PKCE challenge should be deterministic and URL safe.
const challenge1=await sha256Base64Url('fixed-verifier');
const challenge2=await sha256Base64Url('fixed-verifier');
record(
  'pkce-challenge',
  challenge1===challenge2 &&
    /^[A-Za-z0-9_-]+$/.test(challenge1),
  {challenge:challenge1}
);

// Atomic Git Data commit.
const calls=[];
const mockFetch=async (url,options={})=>{
  const method=options.method || 'GET';
  const body=options.body ? JSON.parse(options.body) : null;
  calls.push({url:String(url),method,body});

  if(String(url).includes('/git/ref/heads/main') && method==='GET'){
    return new Response(JSON.stringify({object:{sha:'head-001'}}),{status:200});
  }
  if(String(url).includes('/git/commits/head-001') && method==='GET'){
    return new Response(JSON.stringify({tree:{sha:'tree-001'}}),{status:200});
  }
  if(String(url).endsWith('/git/trees') && method==='POST'){
    return new Response(JSON.stringify({sha:'tree-002'}),{status:201});
  }
  if(String(url).endsWith('/git/commits') && method==='POST'){
    return new Response(JSON.stringify({sha:'commit-002'}),{status:201});
  }
  if(String(url).includes('/git/refs/heads/main') && method==='PATCH'){
    return new Response(JSON.stringify({object:{sha:'commit-002'}}),{status:200});
  }
  return new Response(JSON.stringify({message:'unexpected mock URL'}),{status:500});
};

const commitResult=await atomicCommit({
  token:'ghu_test',
  owner:'owner',
  repo:'site',
  branch:'main',
  message:'QA atomic commit',
  files,
  baseRevision:'head-001',
  fetchImpl:mockFetch
});

const treeCall=calls.find(x=>x.url.endsWith('/git/trees') && x.method==='POST');
const commitCall=calls.find(x=>x.url.endsWith('/git/commits') && x.method==='POST');
const refCall=calls.find(x=>x.url.includes('/git/refs/heads/main') && x.method==='PATCH');

record(
  'atomic-git-commit',
  commitResult.commitSha==='commit-002' &&
    treeCall?.body?.base_tree==='tree-001' &&
    treeCall?.body?.tree?.length===5 &&
    commitCall?.body?.parents?.[0]==='head-001' &&
    commitCall?.body?.tree==='tree-002' &&
    refCall?.body?.sha==='commit-002' &&
    refCall?.body?.force===false,
  {callCount:calls.length,result:commitResult}
);

// Stale base must stop before tree creation.
let staleCode=null;
try{
  await atomicCommit({
    token:'ghu_test',
    owner:'owner',
    repo:'site',
    branch:'main',
    message:'stale',
    files,
    baseRevision:'old-head',
    fetchImpl:mockFetch
  });
}catch(error){
  staleCode=error instanceof GitHubAdapterError ? error.code : String(error);
}
record('stale-head-conflict',staleCode==='BASE_REVISION_CONFLICT',{staleCode});

// Worker login: GitHub authorization URL must have state + PKCE.
const env={
  ADMIN_ORIGIN:'https://owner.github.io',
  PUBLIC_BASE_URL:'https://admin-worker.example',
  GITHUB_CALLBACK_URL:'https://admin-worker.example/api/admin/callback',
  GITHUB_REPOSITORY:'owner/site',
  GITHUB_REPOSITORY_ID:'123456789',
  GITHUB_BRANCH:'main',
  GITHUB_APP_CLIENT_ID:'Iv1.QA',
  GITHUB_APP_CLIENT_SECRET:'client-secret',
  ADMIN_GITHUB_LOGIN:'qa-user',
  SITE_ID:'modular-editorial-v0.1',
  SESSION_SECRET:secret
};

const loginResponse=await worker.fetch(
  new Request(
    'https://admin-worker.example/api/admin/login?return_to='+
      encodeURIComponent('https://owner.github.io/site/admin/')
  ),
  env
);
const loginLocation=new URL(loginResponse.headers.get('Location'));
record(
  'github-app-login-pkce',
  loginResponse.status===302 &&
    loginLocation.origin==='https://github.com' &&
    loginLocation.pathname==='/login/oauth/authorize' &&
    loginLocation.searchParams.get('client_id')==='Iv1.QA' &&
    Boolean(loginLocation.searchParams.get('state')) &&
    Boolean(loginLocation.searchParams.get('code_challenge')) &&
    loginLocation.searchParams.get('code_challenge_method')==='S256' &&
    Boolean(loginResponse.headers.get('Set-Cookie')),
  {location:loginLocation.toString()}
);

// Anonymous status.
const anonymousStatusResponse=await worker.fetch(
  new Request('https://admin-worker.example/api/admin/status',{
    headers:{Origin:env.ADMIN_ORIGIN}
  }),
  env
);
const anonymousStatus=await anonymousStatusResponse.json();
record(
  'anonymous-status',
  anonymousStatusResponse.status===200 &&
    anonymousStatus.authenticated===false,
  anonymousStatus
);

// Cross-origin API access must be rejected.
const badOriginResponse=await worker.fetch(
  new Request('https://admin-worker.example/api/admin/status',{
    headers:{Origin:'https://evil.example'}
  }),
  env
);
record('origin-guard',badOriginResponse.status===403,{status:badOriginResponse.status});

// Authenticated worker commit with mocked GitHub network.
const adminSession=await sealJson({
  githubToken:'ghu_test',
  user:{login:'qa-user',id:1},
  repository:'owner/site',
  branch:'main',
  exp:Date.now()+60000
},secret);

const originalFetch=globalThis.fetch;
const workerCalls=[];
globalThis.fetch=async (url,options={})=>{
  const method=options.method || 'GET';
  const body=options.body ? JSON.parse(options.body) : null;
  workerCalls.push({url:String(url),method,body});
  if(String(url).includes('/git/ref/heads/main') && method==='GET'){
    return new Response(JSON.stringify({object:{sha:'head-worker'}}),{status:200});
  }
  if(String(url).includes('/git/commits/head-worker') && method==='GET'){
    return new Response(JSON.stringify({tree:{sha:'tree-worker'}}),{status:200});
  }
  if(String(url).endsWith('/git/trees') && method==='POST'){
    return new Response(JSON.stringify({sha:'tree-worker-2'}),{status:201});
  }
  if(String(url).endsWith('/git/commits') && method==='POST'){
    return new Response(JSON.stringify({sha:'commit-worker'}),{status:201});
  }
  if(String(url).includes('/git/refs/heads/main') && method==='PATCH'){
    return new Response(JSON.stringify({object:{sha:'commit-worker'}}),{status:200});
  }
  return new Response(JSON.stringify({message:'unexpected worker mock URL'}),{status:500});
};

try{
  const response=await worker.fetch(
    new Request('https://admin-worker.example/api/admin/commit',{
      method:'POST',
      headers:{
        Origin:env.ADMIN_ORIGIN,
        Authorization:`Bearer ${adminSession}`,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        siteId:'modular-editorial-v0.1',
        message:'Worker QA commit',
        baseRevision:'head-worker',
        bundle:validBundle
      })
    }),
    env
  );
  const body=await response.json();
  record(
    'worker-authenticated-commit',
    response.status===200 &&
      body.commitSha==='commit-worker' &&
      body.changedFiles?.length===5,
    {status:response.status,body}
  );
}finally{
  globalThis.fetch=originalFetch;
}

const pass=checks.every(x=>x.pass);
const report={pass,checks};
fs.mkdirSync('artifacts/github-adapter',{recursive:true});
fs.writeFileSync('artifacts/github-adapter/qa.json',JSON.stringify(report,null,2));
console.log('GITHUB_ADAPTER_QA',JSON.stringify(report));
if(!pass) process.exitCode=2;
