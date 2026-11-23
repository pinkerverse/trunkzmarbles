'use strict';
const vm=require('node:vm'),assert=require('node:assert/strict'),fs=require('node:fs');
const handlers={},entries=new Map(),deleted=[];let precached;
const root='https://pinkerverse.github.io/trunkzmarbles/';
const cache={async addAll(requests){precached=requests;requests.forEach(req=>entries.set(req.url,{body:req.url}));},async match(req,options){const url=new URL(typeof req==='string'?req:req.url);if(options?.ignoreSearch)url.search='';return entries.get(url.href);},async put(req,res){entries.set(typeof req==='string'?req:req.url,res);}};
const caches={async open(){return cache;},async keys(){return ['another-app-v1',...Array.from({length:9},(_,i)=>`trunkz-marbles-v${10+i}`)];},async delete(key){deleted.push(key);}};
const self={location:{href:root+'sw.js'},addEventListener(name,handler){handlers[name]=handler;},async skipWaiting(){},clients:{async claim(){}}};
vm.runInNewContext(fs.readFileSync(require.resolve('../sw.js'),'utf8'),{self,caches,URL,Request,fetch:async()=>{throw Error('offline');}});
async function event(name,request){let task,response;handlers[name]({request,waitUntil(p){task=p;},respondWith(p){response=p;}});if(task)await task;return response&&await response;}
(async()=>{
 await event('install');assert(precached.every(req=>req.cache==='reload'));
 await event('activate');assert.deepEqual(deleted,Array.from({length:8},(_,i)=>`trunkz-marbles-v${10+i}`));
 const manifest=JSON.parse(fs.readFileSync(require.resolve('../manifest.webmanifest'),'utf8'));
 const icons=[...manifest.icons.map(icon=>icon.src),'assets/pink-marble-icon-180.png'];
 for(const path of ['physics.js?v=18','game.js?v=18','manifest.webmanifest?v=18',...icons,...['sunny','pink','blue','lilac','red','orange','mint'].map(k=>`assets/marble-${k}.svg`)]){
  const result=await event('fetch',{method:'GET',mode:'cors',url:root+path});assert(result,`Offline asset ${path}`);
 }
 entries.set(root+'physics.js',{body:'stale unversioned script'});
 await assert.rejects(event('fetch',{method:'GET',mode:'cors',url:root+'physics.js?v=19'}),/offline/);
 const nav=await event('fetch',{method:'GET',mode:'navigate',url:root+'?v=18'});assert.equal(nav.body,root+'index.html?v=18');
 assert.equal(await event('fetch',{method:'GET',mode:'cors',url:'https://pinkerverse.github.io/another-app/game.js'}),undefined);
 console.log('PASS: first offline launch, versioned scripts, seven sprites, navigation fallback, and cache isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
