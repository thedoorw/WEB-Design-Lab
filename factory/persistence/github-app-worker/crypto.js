const encoder=new TextEncoder();
const decoder=new TextDecoder();

function bytesToBase64Url(bytes){
  let binary='';
  for(const byte of bytes) binary+=String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g,'-')
    .replace(/\//g,'_')
    .replace(/=+$/,'');
}

function base64UrlToBytes(text){
  const base64=text.replace(/-/g,'+').replace(/_/g,'/');
  const padded=base64+'='.repeat((4-base64.length%4)%4);
  const binary=atob(padded);
  return Uint8Array.from(binary,ch=>ch.charCodeAt(0));
}

async function aesKey(secret){
  if(!secret) throw new Error('SESSION_SECRET is required');
  const digest=await crypto.subtle.digest('SHA-256',encoder.encode(secret));
  return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt']);
}

export function randomBase64Url(size=32){
  const bytes=new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function sha256Base64Url(text){
  const hash=await crypto.subtle.digest('SHA-256',encoder.encode(text));
  return bytesToBase64Url(new Uint8Array(hash));
}

export async function sealJson(value,secret){
  const iv=new Uint8Array(12);
  crypto.getRandomValues(iv);
  const key=await aesKey(secret);
  const plaintext=encoder.encode(JSON.stringify(value));
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plaintext);
  return [
    'v1',
    bytesToBase64Url(iv),
    bytesToBase64Url(new Uint8Array(cipher))
  ].join('.');
}

export async function openJson(token,secret){
  if(!token || typeof token!=='string') throw new Error('Missing sealed token');
  const [version,ivText,cipherText]=token.split('.');
  if(version!=='v1' || !ivText || !cipherText) throw new Error('Invalid sealed token');
  const key=await aesKey(secret);
  const iv=base64UrlToBytes(ivText);
  const cipher=base64UrlToBytes(cipherText);
  const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,cipher);
  return JSON.parse(decoder.decode(plaintext));
}
