'use strict';
const vm=require('node:vm'),assert=require('node:assert/strict'),fs=require('node:fs');
const handlers={},entries=new Map(),deleted=[];let precached;
const root='https://pinkerverse.github.io/trunkzmarbles/';
const cache={async addAll(paths){precached=paths;paths.forEach(p=>entries.set(new URL(p,root).href,{body:p}));},async match(req,options){const url=new URL(typeof req==='string'?req:req.url);if(options?.ignoreSearch)url.search='';return entries.get(url.href);},async put(req,res){entries.set(typeof req==='string'?req:req.url,res);}};
const caches={async open(){return cache;},async keys(){return ['another-app-v1','trunkz-marbles-uploaded-v8','trunkz-marbles-v10','trunkz-marbles-v11','trunkz-marbles-v12','trunkz-marbles-v13'];},async delete(key){deleted.push(key);}};
const self={location:{href:root+'sw.js'},addEventListener(name,handler){handlers[name]=handler;},async skipWaiting(){},clients:{async claim(){}}};
vm.runInNewContext(fs.readFileSync(require.resolve('../sw.js'),'utf8'),{self,caches,URL,fetch:async()=>{throw Error('offline');}});
async function event(name,request){let task,response;handlers[name]({request,waitUntil(p){task=p;},respondWith(p){response=p;}});if(task)await task;return response&&await response;}
(async()=>{
 await event('install');assert(precached.includes('./physics.js'));
 await event('activate');assert.deepEqual(deleted,['trunkz-marbles-uploaded-v8','trunkz-marbles-v10','trunkz-marbles-v11','trunkz-marbles-v12']);
 for(const path of ['physics.js?v=13','game.js?v=13',...['sunny','pink','blue','lilac','red','orange','mint'].map(k=>`assets/marble-${k}.svg`)]){
  const result=await event('fetch',{method:'GET',mode:'cors',url:root+path});assert(result,`Offline asset ${path}`);
 }
 const nav=await event('fetch',{method:'GET',mode:'navigate',url:root+'?v=13'});assert.equal(nav.body,'./index.html');
 assert.equal(await event('fetch',{method:'GET',mode:'cors',url:'https://pinkerverse.github.io/another-app/game.js'}),undefined);
 console.log('PASS: first offline launch, versioned scripts, seven sprites, navigation fallback, and cache isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
