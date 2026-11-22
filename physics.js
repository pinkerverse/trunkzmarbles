/* Shared by the Canvas app and regression tests. Pixels, seconds, equal masses. */
(function(root){
  'use strict';
  const W=540,H=960,R=21,LEFT=43,RIGHT=467,FINISH=1840,DT=1/240;
  const names=['SUNNY','PINK','BLUE','LILAC','RED','ORANGE','MINT'];
  const families=['Switchback','Split Decision','Funnel Club'];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function rng(seed){return ()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
  function create(seed,family){
    const random=rng(seed),range=(a,b)=>a+(b-a)*random();
    family=family===undefined?Math.floor(random()*3):family;
    const rails=[],rotors=[],bumpers=[];
    const line=(x1,y1,x2,y2,kind='ramp')=>rails.push({x1,y1,x2,y2,thickness:12,kind});
    const rotor=(x,y,l,s)=>rotors.push({x,y,l,s:s*.67*range(.9,1.1),a:range(-Math.PI,Math.PI),thickness:12});
    const funnel=(x,y,spread=200,gap=108,drop=106)=>{
      line(Math.max(LEFT,x-spread),y,x-gap/2,y+drop,'funnel');
      line(Math.min(RIGHT,x+spread),y,x+gap/2,y+drop,'funnel');
    };
    const peg=(x,y,r=16)=>bumpers.push({x,y,r});
    // No geometry is clamped after construction. Exit gaps exceed a marble's diameter.
    if(family===0){
      line(LEFT,422,310,515);line(205,710,RIGHT,608);
      funnel(255,806,212,116,100);rotor(266,1015,132,2.0);
      line(LEFT,1115,310,1210);line(205,1415,RIGHT,1320);
      funnel(255,1535,212,120,95);
      peg(105,716);peg(402,1226);
    }else if(family===1){
      // The central roof divides the field; two sloped collectors rejoin it below.
      line(255,430,140,540);line(255,430,370,540);
      line(LEFT,660,192,710);line(RIGHT,660,318,710);
      rotor(255,831,126,-2.1);
      funnel(255,962,212,122,90);
      line(255,1192,140,1295);line(255,1192,370,1295);
      line(LEFT,1410,192,1462);line(RIGHT,1410,318,1462);
      rotor(255,1582,128,2.0);funnel(255,1705,212,122,70);
      peg(100,1020);peg(409,1020);
    }else{
      funnel(255,422,212,120,110);
      rotor(255,659,124,1.8);
      line(LEFT,805,203,855);line(326,855,RIGHT,805);
      funnel(290,978,247,112,106);
      rotor(275,1201,128,-1.9);
      line(LEFT,1340,196,1398);line(320,1398,RIGHT,1340);
      funnel(237,1530,230,100,80);
    }
    for(const s of rails){const dy=range(-8,8);s.y1+=dy;s.y2+=dy;}
    for(const s of rotors)s.x+=range(-10,10);
    const places=[87,143,199,255,311,367,423];
    for(let i=6;i>0;i--){const j=Math.floor(random()*(i+1));[places[i],places[j]]=[places[j],places[i]];}
    const marbles=places.map((x,id)=>({id,name:names[id],x,y:292,vx:0,vy:0,r:R,angle:0,omega:0,finished:false,finishedAt:null,contacts:0,wallHits:0,previousY:292}));
    return {seed,family,rails,rotors,bumpers,marbles,time:0,finishers:[],crossings:[],leadChanges:0,leader:null,done:false,contacts:0,pairContacts:0};
  }
  function contact(p,s,omega=0){
    const dx=s.x2-s.x1,dy=s.y2-s.y1,l2=dx*dx+dy*dy;
    const t=clamp(((p.x-s.x1)*dx+(p.y-s.y1)*dy)/l2,0,1);
    const qx=s.x1+t*dx,qy=s.y1+t*dy,ax=p.x-qx,ay=p.y-qy;
    const d=Math.hypot(ax,ay),depth=p.r+s.thickness/2-d;
    if(depth<=0||d<.0001)return false;
    const nx=ax/d,ny=ay/d;p.x+=nx*(depth+.001);p.y+=ny*(depth+.001);
    const svx=s.cx===undefined?0:-omega*(qy-s.cy),svy=s.cx===undefined?0:omega*(qx-s.cx);
    const vn=(p.vx-svx)*nx+(p.vy-svy)*ny;
    if(vn<0){
      const restitution=s.cx===undefined?.10:.25;
      p.vx-=(1+restitution)*vn*nx;p.vy-=(1+restitution)*vn*ny;
      const tx=-ny,ty=nx,vt=(p.vx-svx)*tx+(p.vy-svy)*ty;
      // Rolling contact transfers tangential momentum into spin (solid disc inertia).
      const slip=vt-p.omega*p.r,impulse=clamp(slip/3,-Math.abs(vn)*.22,Math.abs(vn)*.22);
      p.vx-=impulse*tx;p.vy-=impulse*ty;p.omega+=2*impulse/p.r;
    }
    p.contacts++;return true;
  }
  function pair(a,b){
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),depth=a.r+b.r-d;
    if(depth<=0||d<.0001)return false;
    const nx=dx/d,ny=dy/d;a.x-=nx*(depth+.002)/2;a.y-=ny*(depth+.002)/2;b.x+=nx*(depth+.002)/2;b.y+=ny*(depth+.002)/2;
    const vn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(vn<0){const j=-vn*.64;a.vx-=j*nx;a.vy-=j*ny;b.vx+=j*nx;b.vy+=j*ny;}
    return true;
  }
  function step(world,dt=DT){
    if(world.done)return;
    const start=world.time;world.time+=dt;
    const segments=world.rails.slice();
    for(const s of world.rotors){
      s.a+=s.s*dt;const c=Math.cos(s.a)*s.l/2,v=Math.sin(s.a)*s.l/2;
      segments.push({x1:s.x-c,y1:s.y-v,x2:s.x+c,y2:s.y+v,thickness:s.thickness,cx:s.x,cy:s.y,omega:s.s});
    }
    const active=world.marbles.filter(p=>!p.finished);
    for(const p of active){
      p.previousY=p.y;p.vy+=590*dt;p.vx*=Math.exp(-.035*dt);
      p.vx=clamp(p.vx,-750,750);p.vy=clamp(p.vy,-650,920);
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.omega*dt;
    }
    // Iterative constraints prevent a marble pair pushing one another through a ramp.
    for(let iteration=0;iteration<3;iteration++){
      for(const p of active){
        for(const s of segments)if(p.y>Math.min(s.y1,s.y2)-p.r-8&&p.y<Math.max(s.y1,s.y2)+p.r+8){if(contact(p,s,s.omega||0))world.contacts++;}
        for(const b of world.bumpers){
          const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy),depth=p.r+b.r-d;
          if(depth>0&&d>.001){const nx=dx/d,ny=dy/d;p.x+=nx*(depth+.001);p.y+=ny*(depth+.001);const vn=p.vx*nx+p.vy*ny;if(vn<0){p.vx-=1.35*vn*nx;p.vy-=1.35*vn*ny;}p.contacts++;}
        }
        if(p.x<LEFT+p.r){p.x=LEFT+p.r;if(p.vx<0){p.vx*=-.12;p.wallHits++;}}
        if(p.x>RIGHT-p.r){p.x=RIGHT-p.r;if(p.vx>0){p.vx*=-.12;p.wallHits++;}}
      }
      for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++)if(pair(active[i],active[j]))world.pairContacts++;
    }
    for(const p of active)p.x=clamp(p.x,LEFT+p.r,RIGHT-p.r);
    const crossed=[];
    for(const p of active)if(p.previousY<FINISH&&p.y>=FINISH){
      // Crossing time is interpolated before sorting, avoiding iteration/id tie bias.
      p.finished=true;p.finishedAt=start+dt*(FINISH-p.previousY)/(p.y-p.previousY);
      crossed.push(p);world.crossings.push({id:p.id,from:p.previousY,to:p.y,x:p.x,time:p.finishedAt});
    }
    crossed.sort((a,b)=>a.finishedAt-b.finishedAt);
    world.finishers.push(...crossed);
    const lead=world.finishers[0]||active.reduce((a,b)=>a.y>b.y?a:b);
    if(world.leader!==null&&world.leader!==lead.id)world.leadChanges++;
    world.leader=lead.id;
    if(world.finishers.length>=3)world.done=true;
  }
  const api={W,H,R,LEFT,RIGHT,FINISH,DT,names,families,clamp,rng,create,step};
  if(typeof module!=='undefined')module.exports=api;else root.TRUNKZPhysics=api;
})(typeof window==='undefined'?globalThis:window);
