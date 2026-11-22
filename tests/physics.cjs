'use strict';
const assert=require('node:assert/strict');
const P=require('../physics.js');
const report=[];
for(let family=0;family<3;family++){
 const races=[],winners=new Set();
 for(let seed=1;seed<=250;seed++){
  const w=P.create(seed,family);
  // A meaningful timeout fails testing; the game itself has NO timer cutoff.
  while(w.finishers.length<7&&w.time<40){
   P.step(w,P.DT,true);
   for(const p of w.marbles){assert(Number.isFinite(p.x+p.y+p.vx+p.vy+p.angle));assert(p.x>=P.LEFT+p.r-.15&&p.x<=P.RIGHT-p.r+.15);}
   if(w.finishers.length<3)assert(!w.done);
  }
  assert(w.done,`Stall: family ${family}, seed ${seed}`);
  assert.equal(w.finishers.length,7,`All seven must cross: family ${family}, seed ${seed}`);
  const frozenPodium=w.finishers.slice(0,3).map(p=>p.id);
  for(let i=0;i<480;i++)P.step(w,P.DT,true);
  assert.deepEqual(w.finishers.slice(0,3).map(p=>p.id),frozenPodium);
  assert(w.marbles.every(p=>p.y<=P.CATCH-P.R),'Catcher must retain every marble');
  assert.equal(new Set(w.finishers.map(p=>p.id)).size,w.finishers.length);
  assert(w.finishers.every(p=>p.finished&&p.finishedAt<=w.time));
  for(let i=1;i<w.finishers.length;i++)assert(w.finishers[i].finishedAt>=w.finishers[i-1].finishedAt);
  for(const c of w.crossings){assert(c.from<P.FINISH&&c.to>=P.FINISH);assert(c.x>=P.LEFT&&c.x<=P.RIGHT);}
  assert(w.marbles.every(p=>p.contacts>0),'Every marble must meet the track');
  assert(w.pairContacts>0,'Field must interact');
  winners.add(w.finishers[0].name);
  races.push({seed,time:+w.podiumTime.toFixed(3),winner:w.finishers[0].name,leadChanges:w.leadChanges,contacts:w.contacts,pairContacts:w.pairContacts});
 }
 assert.equal(winners.size,7,`All colors should be capable of winning family ${family}`);
 const times=races.map(r=>r.time).sort((a,b)=>a-b);
 report.push({family:P.families[family],races:races.length,min:times[0],median:times[Math.floor(times.length/2)],max:times.at(-1),inTarget:times.filter(t=>t>=14&&t<=20).length,winners:[...winners],meanLeadChanges:+(races.reduce((a,r)=>a+r.leadChanges,0)/races.length).toFixed(2)});
}
console.log(JSON.stringify(report,null,2));
