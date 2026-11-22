'use strict';
// Browser-independent lifecycle regression. This does not replace real browser QA.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const P=require('../physics.js');
const elements={};
function element(){return {style:{},children:[],attrs:{},textContent:'',disabled:false,listeners:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,f){this.listeners[k]=f;},replaceChildren(...children){this.children=children;}};}
for(const id of ['scene','status','start','picks'])elements[id]=element();
let nextFrame,now=0;const seeded=P.rng(21);
const context2d=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
elements.scene.getContext=()=>context2d;
elements.scene.getBoundingClientRect=()=>({width:390,height:390*16/9});
const document={body:{dataset:{}},getElementById:id=>elements[id],createElement:element,addEventListener(){}};
class Image{decode(){return Promise.resolve();}}
const context={URLSearchParams,location:{search:''},window:{TRUNKZPhysics:P},document,Image,crypto:{getRandomValues(array){array[0]=Math.floor(seeded()*4294967296);return array;}},devicePixelRatio:3,requestAnimationFrame(f){nextFrame=f;},console};
vm.runInNewContext(fs.readFileSync(require.resolve('../game.js'),'utf8'),context);
function advance(sec){const count=Math.ceil(sec*60);for(let i=0;i<count;i++){now+=1000/60;const f=nextFrame;assert(f);f(now);}}
(async()=>{
 await new Promise(r=>setImmediate(r));advance(.1);
 const read=()=>context.window.TRUNKZ_DEBUG.state();
 const families=new Set(),winners=new Set();
 for(let n=0;n<30;n++){
  assert.equal(read().mode,'ready');const family=read().family;families.add(family);
  const pick=n%7;elements.picks.children[pick].listeners.click();assert.equal(read().chosen,pick);assert.equal(elements.picks.children[pick].attrs['aria-pressed'],'true');
  elements.start.listeners.click();assert.equal(read().mode,'hold');assert(elements.start.disabled);assert.equal(elements.start.textContent,'PICK LOCKED IN');
  advance(2.8);assert.equal(read().mode,'hold');advance(.4);assert.equal(read().mode,'countdown');assert(read().gatePresent);advance(2.7);assert.equal(read().mode,'countdown');advance(.3);assert.equal(read().mode,'racing');assert(!read().gatePresent);
  let waited=0,sawCatcher=false;while(read().mode!=='results'&&waited<40){advance(.1);waited+=.1;if(read().mode==='catching')sawCatcher=true;}
  const result=read();assert.equal(result.mode,'results');assert(sawCatcher);assert.equal(result.results.length,7);assert(result.positions.every(p=>p.finished&&p.y<=P.CATCH-P.R));assert(result.crossings.length>=3);assert.equal(new Set(result.results).size,result.results.length);
  winners.add(result.results[0]);assert.equal(elements.start.textContent,'RACE AGAIN');assert(!elements.start.disabled);advance(2);assert.equal(read().mode,'results');
  elements.start.listeners.click();assert.equal(read().mode,'ready');assert.notEqual(read().family,family);assert.equal(read().chosen,-1);assert.equal(read().time,0);assert.equal(elements.start.textContent,'START RACE');
 }
 assert.equal(families.size,3);assert(winners.size>=5);console.log(`PASS: 30 complete app lifecycles; ${families.size} families; ${winners.size} winning colors; selection, hold, countdown, real finishers, persistent podium, replay.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
