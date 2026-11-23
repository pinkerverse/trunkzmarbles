'use strict';
const VERSION=17;
const CACHE=`trunkz-marbles-v${VERSION}`;
const ROOT=new URL('./',self.location.href);
const SHELL=new URL(`./index.html?v=${VERSION}`,ROOT).href;
const ASSETS=[SHELL,`./physics.js?v=${VERSION}`,`./game.js?v=${VERSION}`,'./manifest.webmanifest','./assets/icon.svg',...['sunny','pink','blue','lilac','red','orange','mint'].map(k=>`./assets/marble-${k}.svg`)];
self.addEventListener('install',event=>{
 const requests=ASSETS.map(path=>new Request(new URL(path,ROOT),{cache:'reload'}));
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(requests)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('trunkz-marbles-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req,{cache:'no-cache'}).catch(()=>caches.open(CACHE).then(cache=>cache.match(SHELL))));return;
 }
 // Versioned scripts match only their exact release.
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(req);if(cached)return cached;
  const response=await fetch(req);if(response.ok){const copy=response.clone();event.waitUntil(cache.put(req,copy));}return response;
 }));
});
