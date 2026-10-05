const DEFAULT_SESSION_KEY='webDesignLab.adminSession.v0.1';

export class AdminApiClient{
  constructor(baseUrl,{sessionKey=DEFAULT_SESSION_KEY}={}){
    this.baseUrl=(baseUrl||'').replace(/\/$/,'');
    this.sessionKey=sessionKey;
    this.captureSessionFromHash();
  }

  get configured(){
    return Boolean(this.baseUrl);
  }

  get storage(){
    return typeof sessionStorage!=='undefined' ? sessionStorage : null;
  }

  get sessionToken(){
    return this.storage?.getItem(this.sessionKey) || null;
  }

  set sessionToken(value){
    if(!this.storage) return;
    if(value) this.storage.setItem(this.sessionKey,value);
    else this.storage.removeItem(this.sessionKey);
  }

  captureSessionFromHash(){
    if(typeof location==='undefined') return null;
    const raw=location.hash?.replace(/^#/,'') || '';
    if(!raw) return null;

    const params=new URLSearchParams(raw);
    const token=params.get('admin_session');
    if(!token) return null;

    this.sessionToken=token;
    params.delete('admin_session');

    if(typeof history!=='undefined' && history.replaceState){
      const nextHash=params.toString() ? '#'+params.toString() : '';
      history.replaceState(null,'',location.pathname+location.search+nextHash);
    }
    return token;
  }

  clearSession(){
    this.sessionToken=null;
  }

  url(path){
    if(!this.configured) throw new Error('Admin API is not configured');
    if(typeof location!=='undefined'){
      return new URL(this.baseUrl+path,location.href).toString();
    }
    return this.baseUrl+path;
  }

  loginUrl(returnTo){
    const url=new URL(this.url('/login'));
    if(returnTo) url.searchParams.set('return_to',returnTo);
    return url.toString();
  }

  beginLogin(returnTo){
    if(typeof location==='undefined') throw new Error('Login requires a browser');
    location.assign(this.loginUrl(returnTo || location.href));
  }

  async request(path,options={}){
    const token=this.sessionToken;
    const response=await fetch(this.url(path),{
      credentials:'include',
      headers:{
        'Accept':'application/json',
        ...(options.body ? {'Content-Type':'application/json'} : {}),
        ...(token ? {'Authorization':`Bearer ${token}`} : {}),
        ...(options.headers||{})
      },
      ...options
    });

    let body=null;
    try{ body=await response.json(); }
    catch{ body={ok:false,error:`HTTP ${response.status}`}; }

    if(!response.ok){
      const error=new Error(body?.error || `HTTP ${response.status}`);
      error.status=response.status;
      error.details=body;
      throw error;
    }
    return body;
  }

  status(){
    return this.request('/status');
  }

  commit({siteId,bundle,message,baseRevision}){
    return this.request('/commit',{
      method:'POST',
      body:JSON.stringify({
        siteId,
        bundle,
        message,
        baseRevision:baseRevision || null
      })
    });
  }
}
