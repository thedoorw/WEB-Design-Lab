import {bundleToFiles,BundleValidationError} from './bundle.js';
import {randomBase64Url,sha256Base64Url,sealJson,openJson} from './crypto.js';
import {atomicCommit,getRepoHead,getGitHubUser,GitHubAdapterError} from './github.js';

const FLOW_COOKIE='web_admin_oauth';

function json(body,status=200,headers={}){
  return new Response(JSON.stringify(body),{
    status,
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store',
      ...headers
    }
  });
}

function parseRepo(text){
  const [owner,repo]=String(text||'').split('/');
  if(!owner || !repo) throw new Error('GITHUB_REPOSITORY must be owner/repo');
  return {owner,repo};
}

function apiCors(request,env){
  const origin=request.headers.get('Origin');
  if(!origin || origin!==env.ADMIN_ORIGIN) return {};
  return {
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Allow-Headers':'Authorization, Content-Type',
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Max-Age':'600',
    'Vary':'Origin'
  };
}

function cookieValue(request,name){
  const raw=request.headers.get('Cookie') || '';
  for(const piece of raw.split(';')){
    const [key,...rest]=piece.trim().split('=');
    if(key===name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function oauthCookie(value,maxAge=600){
  return [
    `${FLOW_COOKIE}=${encodeURIComponent(value)}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/api/admin',
    `Max-Age=${maxAge}`
  ].join('; ');
}

function safeReturnTo(value,env){
  const fallback=new URL('/admin/',env.ADMIN_ORIGIN).toString();
  if(!value) return fallback;
  const url=new URL(value);
  if(url.origin!==env.ADMIN_ORIGIN) throw new Error('Invalid return_to origin');
  return url.toString();
}

function callbackUrl(env){
  if(env.GITHUB_CALLBACK_URL) return env.GITHUB_CALLBACK_URL;
  if(!env.PUBLIC_BASE_URL) throw new Error('PUBLIC_BASE_URL or GITHUB_CALLBACK_URL is required');
  return new URL('/api/admin/callback',env.PUBLIC_BASE_URL).toString();
}

async function createSession(payload,env){
  const maxSeconds=Math.min(Number(payload.expiresIn||3600),3600);
  return sealJson({
    githubToken:payload.githubToken,
    user:payload.user,
    repository:env.GITHUB_REPOSITORY,
    branch:env.GITHUB_BRANCH || 'main',
    exp:Date.now()+maxSeconds*1000
  },env.SESSION_SECRET);
}

async function readSession(request,env){
  const auth=request.headers.get('Authorization') || '';
  if(!auth.startsWith('Bearer ')) return null;
  try{
    const session=await openJson(auth.slice(7),env.SESSION_SECRET);
    if(!session?.githubToken || !session?.exp || session.exp<Date.now()) return null;
    if(session.repository!==env.GITHUB_REPOSITORY) return null;
    return session;
  }catch{
    return null;
  }
}

async function login(request,env){
  const url=new URL(request.url);
  const returnTo=safeReturnTo(url.searchParams.get('return_to'),env);
  const state=randomBase64Url(24);
  const verifier=randomBase64Url(48);
  const challenge=await sha256Base64Url(verifier);
  const redirectUri=callbackUrl(env);

  const flow=await sealJson({
    state,
    verifier,
    returnTo,
    exp:Date.now()+10*60*1000
  },env.SESSION_SECRET);

  const authUrl=new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id',env.GITHUB_APP_CLIENT_ID);
  authUrl.searchParams.set('state',state);
  authUrl.searchParams.set('redirect_uri',redirectUri);
  authUrl.searchParams.set('code_challenge',challenge);
  authUrl.searchParams.set('code_challenge_method','S256');

  return new Response(null,{
    status:302,
    headers:{
      'Location':authUrl.toString(),
      'Set-Cookie':oauthCookie(flow)
    }
  });
}

async function callback(request,env){
  const url=new URL(request.url);
  const code=url.searchParams.get('code');
  const state=url.searchParams.get('state');
  const flowToken=cookieValue(request,FLOW_COOKIE);
  if(!code || !state || !flowToken) return json({ok:false,error:'OAUTH_FLOW_INVALID'},400);

  let flow;
  try{ flow=await openJson(flowToken,env.SESSION_SECRET); }
  catch{ return json({ok:false,error:'OAUTH_FLOW_INVALID'},400); }

  if(flow.exp<Date.now() || flow.state!==state){
    return json({ok:false,error:'OAUTH_STATE_MISMATCH'},400);
  }

  const params=new URLSearchParams({
    client_id:env.GITHUB_APP_CLIENT_ID,
    client_secret:env.GITHUB_APP_CLIENT_SECRET,
    code,
    redirect_uri:callbackUrl(env),
    code_verifier:flow.verifier
  });
  if(env.GITHUB_REPOSITORY_ID){
    params.set('repository_id',env.GITHUB_REPOSITORY_ID);
  }

  const tokenResponse=await fetch('https://github.com/login/oauth/access_token',{
    method:'POST',
    headers:{
      'Accept':'application/json',
      'Content-Type':'application/x-www-form-urlencoded'
    },
    body:params
  });
  const tokenBody=await tokenResponse.json();
  if(!tokenResponse.ok || !tokenBody.access_token){
    return json({ok:false,error:'TOKEN_EXCHANGE_FAILED'},502);
  }

  const user=await getGitHubUser(tokenBody.access_token);
  if(env.ADMIN_GITHUB_LOGIN &&
    String(user.login).toLowerCase()!==String(env.ADMIN_GITHUB_LOGIN).toLowerCase()){
    return json({ok:false,error:'ADMIN_NOT_AUTHORIZED'},403);
  }

  const {owner,repo}=parseRepo(env.GITHUB_REPOSITORY);
  await getRepoHead({
    token:tokenBody.access_token,
    owner,
    repo,
    branch:env.GITHUB_BRANCH || 'main'
  });

  const session=await createSession({
    githubToken:tokenBody.access_token,
    user:{login:user.login,id:user.id},
    expiresIn:tokenBody.expires_in
  },env);

  const returnUrl=new URL(flow.returnTo);
  returnUrl.hash=new URLSearchParams({admin_session:session}).toString();

  return new Response(null,{
    status:302,
    headers:{
      'Location':returnUrl.toString(),
      'Set-Cookie':oauthCookie('',0)
    }
  });
}

async function status(request,env){
  const session=await readSession(request,env);
  if(!session){
    return json({ok:true,authenticated:false},200,apiCors(request,env));
  }

  const {owner,repo}=parseRepo(env.GITHUB_REPOSITORY);
  const head=await getRepoHead({
    token:session.githubToken,
    owner,
    repo,
    branch:env.GITHUB_BRANCH || 'main'
  });

  return json({
    ok:true,
    authenticated:true,
    user:session.user,
    repository:env.GITHUB_REPOSITORY,
    branch:env.GITHUB_BRANCH || 'main',
    head
  },200,apiCors(request,env));
}

async function commit(request,env){
  const cors=apiCors(request,env);
  const session=await readSession(request,env);
  if(!session) return json({ok:false,error:'UNAUTHENTICATED'},401,cors);

  const body=await request.json();
  const siteId=env.SITE_ID || 'modular-editorial-v0.1';
  if(body.siteId!==siteId){
    return json({ok:false,error:'SITE_NOT_AUTHORIZED'},403,cors);
  }

  let files;
  try{ files=bundleToFiles(body.bundle); }
  catch(error){
    if(error instanceof BundleValidationError){
      return json({ok:false,error:error.code,details:error.details},error.status,cors);
    }
    throw error;
  }

  const {owner,repo}=parseRepo(env.GITHUB_REPOSITORY);
  const result=await atomicCommit({
    token:session.githubToken,
    owner,
    repo,
    branch:env.GITHUB_BRANCH || 'main',
    message:body.message || 'Update site content',
    files,
    baseRevision:body.baseRevision || null
  });

  return json({ok:true,...result},200,cors);
}

async function route(request,env){
  const url=new URL(request.url);

  if(request.method==='OPTIONS'){
    return new Response(null,{status:204,headers:apiCors(request,env)});
  }

  if(url.pathname==='/api/admin/login' && request.method==='GET') return login(request,env);
  if(url.pathname==='/api/admin/callback' && request.method==='GET') return callback(request,env);
  if(url.pathname==='/api/admin/status' && request.method==='GET') return status(request,env);
  if(url.pathname==='/api/admin/commit' && request.method==='POST') return commit(request,env);

  return json({ok:false,error:'NOT_FOUND'},404,apiCors(request,env));
}

export default {
  async fetch(request,env){
    try{
      const origin=request.headers.get('Origin');
      const url=new URL(request.url);
      const isApiFetch=['/api/admin/status','/api/admin/commit'].includes(url.pathname);
      if(isApiFetch && origin && origin!==env.ADMIN_ORIGIN){
        return json({ok:false,error:'ORIGIN_NOT_ALLOWED'},403);
      }
      return await route(request,env);
    }catch(error){
      if(error instanceof GitHubAdapterError){
        return json({
          ok:false,
          error:error.code,
          details:error.details
        },error.status,apiCors(request,env));
      }
      console.error(error);
      return json({ok:false,error:'INTERNAL_ERROR'},500,apiCors(request,env));
    }
  }
};
