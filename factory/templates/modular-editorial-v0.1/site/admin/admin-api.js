export class AdminApiClient{
  constructor(baseUrl){
    this.baseUrl=(baseUrl||'').replace(/\/$/,'');
  }

  get configured(){
    return Boolean(this.baseUrl);
  }

  url(path){
    if(!this.configured) throw new Error('Admin API is not configured');
    return this.baseUrl + path;
  }

  async request(path,options={}){
    const response=await fetch(this.url(path),{
      credentials:'include',
      headers:{
        'Accept':'application/json',
        ...(options.body ? {'Content-Type':'application/json'} : {}),
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
