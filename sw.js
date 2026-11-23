'use strict';
const CACHE='trunkz-marbles-v11';
const ROOT=new URL('./',self.location.href);
const ASSETS=['./','./index.html','./physics.js','./game.js','./manifest.webmanifest','./assets/icon.svg',...['sunny','pink','blue','lilac','red','orange','mint'].map(k=>`./assets/marble-${k}.svg`)];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('trunkz-marbles-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(response=>{
   if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(new URL('./index.html',ROOT).href,copy)));}return response;
  }).catch(()=>caches.open(CACHE).then(cache=>cache.match(new URL('./index.html',ROOT).href))));return;
 }
 // Query versions resolve to the same precached asset, including the first offline launch.
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(req,{ignoreSearch:true});if(cached)return cached;
  const response=await fetch(req);if(response.ok){const copy=response.clone();event.waitUntil(cache.put(req,copy));}return response;
 }));
});
