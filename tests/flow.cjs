'use strict';
// Browser-independent lifecycle checks; real browser QA is recorded separately.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const P=require('../physics.js'),elements={},drawn=[];
function element(){return {style:{},children:[],attrs:{},textContent:'',disabled:false,listeners:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,f){this.listeners[k]=f;},replaceChildren(...children){this.children=children;}};}
for(const id of ['scene','status','start','picks'])elements[id]=element();
let nextFrame,now=0;const seeded=P.rng(21);
const context2d=new Proxy({fillText(s){drawn.push(s);}},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
elements.scene.getContext=()=>context2d;elements.scene.getBoundingClientRect=()=>({width:390,height:390*16/9});
const document={body:{dataset:{}},getElementById:id=>elements[id],createElement:element,addEventListener(){}};
class Image{decode(){return Promise.resolve();}}
const context={URLSearchParams,location:{search:''},window:{TRUNKZPhysics:P},document,Image,crypto:{getRandomValues(array){array[0]=Math.floor(seeded()*4294967296);return array;}},devicePixelRatio:3,requestAnimationFrame(f){nextFrame=f;},console};
vm.runInNewContext(fs.readFileSync(require.resolve('../game.js'),'utf8'),context);
function advance(sec){for(let i=0;i<Math.ceil(sec*60);i++){now+=1000/60;assert(nextFrame);nextFrame(now);}}
(async()=>{
 await new Promise(r=>setImmediate(r));advance(.1);const read=()=>context.window.TRUNKZ_DEBUG.state(),families=new Set(),winners=new Set();
 for(let n=0;n<30;n++){
  assert.equal(read().mode,'ready');assert(read().gatePresent);const family=read().family;families.add(family);
  drawn.length=0;advance(.02);assert(drawn.includes('PICK A MARBLE'));assert(drawn.includes('Which one will win?'));assert(!drawn.some(s=>/TRUNKZ MARBLES|7 MARBLES|Tap a marble|IS YOUR PICK/.test(s)));
  const pick=n%7;elements.picks.children[pick].listeners.click();assert.equal(read().chosen,pick);assert.equal(elements.picks.children[pick].attrs['aria-pressed'],'true');
  const lineup=read().positions,queued=JSON.stringify(lineup);
  assert(lineup.every(p=>p.y===lineup[0].y),'All seven must start at the same height');
  elements.start.listeners.click();assert.equal(read().mode,'countdown');assert(read().gatePresent);assert.equal(read().time,0);assert(elements.start.disabled);
  assert(read().numberBottom<=read().marbleTop-6,'Countdown must stay above every marble');
  drawn.length=0;advance(.6);assert(drawn.includes('3'));assert.equal(read().time,0);
  drawn.length=0;advance(.6);assert(drawn.includes('2'));assert.equal(read().mode,'countdown');
  drawn.length=0;advance(.9);assert(drawn.includes('1'));assert.equal(JSON.stringify(read().positions),queued);assert(read().gatePresent);
  advance(.8);assert.equal(read().mode,'countdown');assert.equal(read().time,0);
  drawn.length=0;advance(.2);assert.equal(read().mode,'racing');assert(!read().gatePresent);assert(drawn.includes('GO!'));
  const dropping=read().positions;
  assert(dropping.every((p,i)=>p.x===lineup[i].x&&p.y>lineup[i].y&&p.y===dropping[0].y),'All seven must fall together before hitting obstacles');
  drawn.length=0;advance(.02);assert(!drawn.includes('PICK A MARBLE'),'The pick banner must clear at GO');
  let waited=0;while(read().mode!=='results'&&waited<40){advance(.1);waited+=.1;assert(['racing','results'].includes(read().mode));}
  assert(!drawn.some(s=>/LEADS|FINISHED FIRST/.test(s)),'The running race must be free of ranking banners');
  const result=read();assert.equal(result.mode,'results');assert(result.results.length>=3);assert(result.crossings.length>=3);
  assert(result.time-result.podiumTime<=P.DT+.000001,'App must stop at the third crossing, not after collection');
  const frozen=JSON.stringify(result.positions),stoppedTime=result.time;winners.add(result.results[0]);assert.equal(elements.start.textContent,'RACE AGAIN');assert(!elements.start.disabled);
  advance(2);assert.equal(read().time,stoppedTime);assert.equal(JSON.stringify(read().positions),frozen);assert.equal(read().mode,'results');
  elements.start.listeners.click();assert.equal(read().mode,'ready');assert.notEqual(read().family,family);assert.equal(read().chosen,-1);assert.equal(read().time,0);assert.equal(elements.start.textContent,'START RACE');
 }
 assert.equal(families.size,3);assert(winners.size>=5);console.log(`PASS: 30 full lifecycles; ${families.size} families; ${winners.size} winning colors; clear 3–2–1 above the fixed queue, GO release, third-crossing stop, frozen results and replay.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
