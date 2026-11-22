/* TRUNKZ: fixed-step circle/segment physics, shared by app and regression tests. */
(function(root){
'use strict';
const W=540,H=960,R=21,LEFT=43,RIGHT=467,FINISH=3260,CATCH=FINISH+136,DT=1/240;
const names=['SUNNY','PINK','BLUE','LILAC','RED','ORANGE','MINT'];
const families=['Switchback Springs','Pinball Parade','Rolling Rivals'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rng(seed){return ()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function create(seed,family){
 const random=rng(seed),range=(a,b)=>a+(b-a)*random();family=family===undefined?Math.floor(random()*3):family;
 const rails=[],rotors=[],bumpers=[];
 const line=(x1,y1,x2,y2,kind='ramp')=>rails.push({x1,y1,x2,y2,thickness:10,kind});
 const rotor=(x,y,l,s,type='spinner')=>rotors.push({x,y,l,s:s*range(.92,1.08),a:range(-Math.PI,Math.PI),phase:range(0,Math.PI*2),thickness:10,type});
 const funnel=(x,y,gap=114,drop=92)=>{line(LEFT,y,x-gap/2,y+drop,'funnel');line(RIGHT,y,x+gap/2,y+drop,'funnel');};
 const peg=(x,y,r=11,spring=false)=>bumpers.push({id:bumpers.length,x,y,r,spring,flash:-10});
 const pins=(y,rows=3)=>{for(let row=0;row<rows;row++){const xs=row%2?[140,220,300,380]:[108,182,256,330,404];xs.forEach((x,i)=>peg(x,y+row*90,10,(row+i)%4===1));}};
 // All seven wait on this real shelf; the vertical stopper exists until GO only.
 const startRail={x1:LEFT,y1:320,x2:410,y2:370,thickness:10,kind:'start'};rails.push(startRail);
 const gate={x1:399,y1:299,x2:399,y2:374,thickness:8,kind:'gate'};
 // Shared landing ramp receives the release, gathers the field and reverses direction.
 line(143,583,RIGHT,482);
 if(family===0){
  funnel(255,735,116,96);rotor(255,882,150,.85,'shutter');rotor(255,970,148,1.45);
  line(LEFT,1100,340,1187);pins(1300);
  funnel(255,1610,116,96);rotor(255,1840,135,1.3,'pendulum');
  line(165,2190,RIGHT,2080);funnel(255,2350,114,92);
  peg(145,2600,17,true);peg(270,2560,15,true);peg(395,2600,17,true);
  line(LEFT,2700,200,2752);line(RIGHT,2700,320,2752);
 }else if(family===1){
  line(255,735,125,850);line(255,735,385,850);
  line(LEFT,990,192,1048);line(RIGHT,990,318,1048);
  rotor(255,1190,190,1.3,'seesaw');pins(1325);
  funnel(255,1635,118,90);rotor(255,1770,150,.85,'shutter');rotor(255,1870,132,1.4,'pendulum');
  line(LEFT,2105,195,2162);line(RIGHT,2105,315,2162);
  rotor(255,2310,155,-1.45);funnel(255,2480,118,90);
  peg(145,2720,16,true);peg(365,2720,16,true);
 }else{
  funnel(255,735,118,92);rotor(255,880,150,.85,'shutter');pins(985);
  rotor(255,1320,185,1.15,'seesaw');
  line(LEFT,1485,205,1540);line(RIGHT,1485,320,1540);
  funnel(280,1690,116,92);rotor(255,1910,132,1.4,'pendulum');
  line(LEFT,2135,330,2220);line(180,2445,RIGHT,2345);
  funnel(255,2590,118,90);peg(145,2740,15,true);peg(365,2740,15,true);
 }
 line(143,2990,RIGHT,2880);funnel(255,3100,118,78);
 for(const s of rails)if(s.kind!=='start'){const j=range(-7,7);s.y1+=j;s.y2+=j;}
 const catchRail={x1:LEFT,y1:CATCH,x2:RIGHT,y2:CATCH,thickness:12,kind:'catch'};rails.push(catchRail);
 const places=[86,134,182,230,278,326,374];
 for(let i=6;i>0;i--){const j=Math.floor(random()*(i+1));[places[i],places[j]]=[places[j],places[i]];}
 const slope=(startRail.y2-startRail.y1)/(startRail.x2-startRail.x1);
 const marbles=places.map((x,id)=>({id,name:names[id],x,y:startRail.y1+(x-LEFT)*slope-(R+startRail.thickness/2)*Math.sqrt(1+slope*slope),vx:0,vy:0,r:R,angle:0,omega:0,finished:false,finishedAt:null,contacts:0,wallHits:0,lastSpring:-10,previousY:0}));
 return {seed,family,rails,rotors,bumpers,startRail,gate,catchRail,marbles,time:0,podiumTime:null,allFinishedAt:null,finishers:[],crossings:[],leadChanges:0,leader:null,done:false,contacts:0,pairContacts:0,springHits:0};
}
function contact(p,s,omega=0){
 const dx=s.x2-s.x1,dy=s.y2-s.y1,l2=dx*dx+dy*dy;if(l2<.001)return false;
 const t=clamp(((p.x-s.x1)*dx+(p.y-s.y1)*dy)/l2,0,1),qx=s.x1+t*dx,qy=s.y1+t*dy;
 const ax=p.x-qx,ay=p.y-qy,d=Math.hypot(ax,ay),depth=p.r+s.thickness/2-d;if(depth<=0||d<.0001)return false;
 const nx=ax/d,ny=ay/d;p.x+=nx*(depth+.001);p.y+=ny*(depth+.001);
 const svx=(s.vx||0)+(s.cx===undefined?0:-omega*(qy-s.cy)),svy=(s.vy||0)+(s.cx===undefined?0:omega*(qx-s.cx));
 const vn=(p.vx-svx)*nx+(p.vy-svy)*ny;
 if(vn<0){const restitution=s.kind==='catch'?.08:s.cx===undefined?.10:.28;p.vx-=(1+restitution)*vn*nx;p.vy-=(1+restitution)*vn*ny;
  const tx=-ny,ty=nx,vt=(p.vx-svx)*tx+(p.vy-svy)*ty,slip=vt-p.omega*p.r;
  const impulse=clamp(slip/3,-Math.abs(vn)*.22,Math.abs(vn)*.22);p.vx-=impulse*tx;p.vy-=impulse*ty;p.omega+=2*impulse/p.r;
 }
 if(s.kind==='catch'){p.vx*=.985;p.omega*=.985;}p.contacts++;return true;
}
function pair(a,b){
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),depth=a.r+b.r-d;if(depth<=0||d<.0001)return false;
 const nx=dx/d,ny=dy/d;a.x-=nx*(depth+.002)/2;a.y-=ny*(depth+.002)/2;b.x+=nx*(depth+.002)/2;b.y+=ny*(depth+.002)/2;
 const vn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(vn<0){const j=-vn*.64;a.vx-=j*nx;a.vy-=j*ny;b.vx+=j*nx;b.vy+=j*ny;}return true;
}
function movingSegments(world){
 return world.rotors.map(s=>{
  if(s.type==='shutter'){const x=s.x+125*Math.sin(world.time*s.s+s.phase);return {x1:x-s.l/2,y1:s.y,x2:x+s.l/2,y2:s.y,thickness:s.thickness,cx:x,cy:s.y,omega:0,vx:125*s.s*Math.cos(world.time*s.s+s.phase),type:s.type};}
  let a=s.a,omega=s.s;
  if(s.type==='seesaw'){a=.47*Math.sin(world.time*s.s+s.phase);omega=.47*s.s*Math.cos(world.time*s.s+s.phase);}
  else if(s.type==='pendulum'){a=Math.PI/2+.73*Math.sin(world.time*s.s+s.phase);omega=.73*s.s*Math.cos(world.time*s.s+s.phase);}
  else a=s.a+s.s*world.time;
  const c=Math.cos(a),v=Math.sin(a),half=s.type==='pendulum'?0:s.l/2;
  return {x1:s.x-c*half,y1:s.y-v*half,x2:s.x+c*(s.type==='pendulum'?s.l:s.l/2),y2:s.y+v*(s.type==='pendulum'?s.l:s.l/2),thickness:s.thickness,cx:s.x,cy:s.y,omega,type:s.type};
 });
}
function step(world,dt=DT,continueFinish=false){
 if(world.done&&!continueFinish)return;
 const start=world.time;world.time+=dt;const segments=[...world.rails,...movingSegments(world)];
 // Finished marbles remain real bodies and settle on the catching rail.
 for(const p of world.marbles){p.previousY=p.y;p.vy+=650*dt;p.vx*=Math.exp(-.035*dt);p.vx=clamp(p.vx,-750,750);p.vy=clamp(p.vy,-650,920);p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.omega*dt;}
 for(let iteration=0;iteration<3;iteration++){
  for(const p of world.marbles){
   for(const s of segments)if(p.y>Math.min(s.y1,s.y2)-p.r-8&&p.y<Math.max(s.y1,s.y2)+p.r+8){if(contact(p,s,s.omega||0))world.contacts++;}
   for(const b of world.bumpers){const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy),depth=p.r+b.r-d;
    if(depth>0&&d>.001){const nx=dx/d,ny=dy/d;p.x+=nx*(depth+.001);p.y+=ny*(depth+.001);const vn=p.vx*nx+p.vy*ny;
     if(vn<0){let out=-vn*.35;if(b.spring&&vn<-35&&world.time-p.lastSpring>.16){out=clamp(-vn*.92,130,250);p.lastSpring=world.time;b.flash=world.time;world.springHits++;}p.vx+=(out-vn)*nx;p.vy+=(out-vn)*ny;}p.contacts++;}
   }
   if(p.x<LEFT+p.r){p.x=LEFT+p.r;if(p.vx<0){p.vx*=-.12;p.wallHits++;}}
   if(p.x>RIGHT-p.r){p.x=RIGHT-p.r;if(p.vx>0){p.vx*=-.12;p.wallHits++;}}
  }
  for(let i=0;i<7;i++)for(let j=i+1;j<7;j++)if(pair(world.marbles[i],world.marbles[j]))world.pairContacts++;
 }
 for(const p of world.marbles)p.x=clamp(p.x,LEFT+p.r,RIGHT-p.r);
 const crossed=[];
 for(const p of world.marbles)if(!p.finished&&p.previousY<FINISH&&p.y>=FINISH){p.finished=true;p.finishedAt=start+dt*(FINISH-p.previousY)/(p.y-p.previousY);crossed.push(p);world.crossings.push({id:p.id,from:p.previousY,to:p.y,x:p.x,time:p.finishedAt});}
 crossed.sort((a,b)=>a.finishedAt-b.finishedAt);world.finishers.push(...crossed);
 const lead=world.finishers[0]||world.marbles.reduce((a,b)=>a.y>b.y?a:b);if(world.leader!==null&&world.leader!==lead.id)world.leadChanges++;world.leader=lead.id;
 if(world.finishers.length>=3&&!world.done){world.done=true;world.podiumTime=world.finishers[2].finishedAt;}
 if(world.finishers.length===7&&world.allFinishedAt===null)world.allFinishedAt=world.time;
}
const api={W,H,R,LEFT,RIGHT,FINISH,CATCH,DT,names,families,clamp,rng,create,step,movingSegments};
if(typeof module!=='undefined')module.exports=api;else root.TRUNKZPhysics=api;
})(typeof window==='undefined'?globalThis:window);
