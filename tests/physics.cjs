'use strict';
const assert=require('node:assert/strict'),P=require('../physics.js');
// Isolated free fall checks the new speed limit independently of track geometry.
const falling=P.create(101,0);falling.rails=[];falling.rotors=[];falling.bumpers=[];
for(let i=0;i<360;i++)P.step(falling);
assert(falling.marbles.every(p=>p.vy<=480&&p.vy>450));
// Every dot is a bumper; one controlled collision must restore the stronger pinball rebound.
const bounce=P.create(102,0);assert(bounce.bumpers.every(b=>b.spring));bounce.rails=[];bounce.rotors=[];
bounce.bumpers=[{id:0,x:255,y:500,r:10,spring:true,flash:-10}];
bounce.marbles.forEach((p,i)=>{p.x=255;p.y=-1000-i*100;p.vx=0;p.vy=0;});
Object.assign(bounce.marbles[0],{x:255,y:469.5,vy:200});P.step(bounce);
assert(bounce.marbles[0].vy<=-180&&bounce.marbles[0].vy>=-250);assert.equal(bounce.springHits,1);
const report=[];
for(let family=0;family<3;family++){
 const races=[],winners=new Set();
 for(let seed=1;seed<=250;seed++){
  const w=P.create(seed,family);assert(w.bumpers.every(b=>b.spring));
  for(let i=0;i<w.rails.length;i++)if(w.rails[i].kind==='funnel'){
   const a=w.rails[i],b=w.rails[++i],gap=Math.abs(a.x2-b.x2);assert.equal(b.kind,'funnel');assert.equal(a.y1,b.y1);assert.equal(a.y2,b.y2);
   assert(gap<=100&&gap>=4*P.R+a.thickness+4,'Outlet must be tight but wide enough for two marbles');
  }
  while(!w.done&&w.time<40){P.step(w);for(const p of w.marbles){assert(Number.isFinite(p.x+p.y+p.vx+p.vy+p.angle));assert(p.x>=P.LEFT+p.r+P.WALL/2-.01&&p.x<=P.RIGHT-p.r-P.WALL/2+.01);assert(p.vy<=P.MAX_FALL+.001);}if(w.finishers.length<3)assert(!w.done);}
  assert(w.done,`Stall: family ${family}, seed ${seed}`);assert(w.finishers.length>=3);assert(w.time-w.podiumTime<=P.DT+.000001);
  const time=w.time,order=w.finishers.map(p=>p.id);P.step(w);assert.equal(w.time,time);assert.deepEqual(w.finishers.map(p=>p.id),order);
  assert.equal(new Set(order).size,order.length);for(let i=1;i<w.finishers.length;i++)assert(w.finishers[i].finishedAt>=w.finishers[i-1].finishedAt);
  for(const c of w.crossings){assert(c.from<P.FINISH&&c.to>=P.FINISH);assert(c.x>=P.LEFT&&c.x<=P.RIGHT);}
  assert(w.finishers.slice(0,3).every(p=>p.pegHits>0),`Pegboard bypass: family ${family}, seed ${seed}`);assert(w.marbles.every(p=>p.contacts>0));assert(w.pairContacts>0);winners.add(w.finishers[0].name);
  races.push({time:+w.podiumTime.toFixed(3),leadChanges:w.leadChanges});
 }
 assert.equal(winners.size,7);const times=races.map(r=>r.time).sort((a,b)=>a-b);
 report.push({family:P.families[family],races:races.length,min:times[0],median:times[125],max:times.at(-1),winners:[...winners],meanLeadChanges:+(races.reduce((n,r)=>n+r.leadChanges,0)/250).toFixed(2)});
}
console.log(JSON.stringify(report,null,2));
