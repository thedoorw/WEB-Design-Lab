const DB_NAME='web-design-lab-admin';
const DB_VERSION=1;
const DRAFT_STORE='drafts';
const REVISION_STORE='revisions';

function requestToPromise(request){
  return new Promise((resolve,reject)=>{
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

function txDone(tx){
  return new Promise((resolve,reject)=>{
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

async function openDb(){
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{
    const db=req.result;
    if(!db.objectStoreNames.contains(DRAFT_STORE)){
      db.createObjectStore(DRAFT_STORE,{keyPath:'siteId'});
    }
    if(!db.objectStoreNames.contains(REVISION_STORE)){
      const store=db.createObjectStore(REVISION_STORE,{keyPath:'id',autoIncrement:true});
      store.createIndex('siteId','siteId',{unique:false});
      store.createIndex('createdAt','createdAt',{unique:false});
    }
  };
  return requestToPromise(req);
}

async function digest(value){
  const bytes=new TextEncoder().encode(JSON.stringify(value));
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

export async function loadDraft(siteId){
  const db=await openDb();
  const tx=db.transaction(DRAFT_STORE,'readonly');
  const value=await requestToPromise(tx.objectStore(DRAFT_STORE).get(siteId));
  await txDone(tx);
  db.close();
  return value || null;
}

export async function saveDraft(siteId,bundle,meta={}){
  const db=await openDb();
  const now=new Date().toISOString();
  const value={
    siteId,
    schemaVersion:1,
    updatedAt:now,
    fingerprint:await digest(bundle),
    bundle,
    ...meta
  };
  const tx=db.transaction(DRAFT_STORE,'readwrite');
  tx.objectStore(DRAFT_STORE).put(value);
  await txDone(tx);
  db.close();
  return value;
}

export async function clearDraft(siteId){
  const db=await openDb();
  const tx=db.transaction(DRAFT_STORE,'readwrite');
  tx.objectStore(DRAFT_STORE).delete(siteId);
  await txDone(tx);
  db.close();
}

export async function createRevision(siteId,bundle,meta={}){
  const db=await openDb();
  const now=new Date().toISOString();
  const value={
    siteId,
    schemaVersion:1,
    createdAt:now,
    fingerprint:await digest(bundle),
    bundle,
    ...meta
  };
  const tx=db.transaction(REVISION_STORE,'readwrite');
  const id=await requestToPromise(tx.objectStore(REVISION_STORE).add(value));
  await txDone(tx);
  db.close();
  return {...value,id};
}

export async function listRevisions(siteId,limit=20){
  const db=await openDb();
  const tx=db.transaction(REVISION_STORE,'readonly');
  const index=tx.objectStore(REVISION_STORE).index('siteId');
  const all=await requestToPromise(index.getAll(IDBKeyRange.only(siteId)));
  await txDone(tx);
  db.close();
  return all
    .sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0,limit);
}

export async function getRevision(id){
  const db=await openDb();
  const tx=db.transaction(REVISION_STORE,'readonly');
  const value=await requestToPromise(tx.objectStore(REVISION_STORE).get(Number(id)));
  await txDone(tx);
  db.close();
  return value || null;
}

export async function pruneRevisions(siteId,keep=20){
  const all=await listRevisions(siteId,1000);
  if(all.length<=keep) return 0;
  const doomed=all.slice(keep);
  const db=await openDb();
  const tx=db.transaction(REVISION_STORE,'readwrite');
  const store=tx.objectStore(REVISION_STORE);
  for(const item of doomed) store.delete(item.id);
  await txDone(tx);
  db.close();
  return doomed.length;
}
