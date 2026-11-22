'use strict';
(() => {
  // Native canvas, local SVGs, and WebAudio only. No external libraries.
  const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d',{alpha:false});
  const W=540,H=960,GROUND=2035,HEIGHT=2230,R=24.5;
  const colorNames=['SUNNY','PINK','BLUE','LILAC','RED','ORANGE','MINT'];
  const keys=['sunny','pink','blue','lilac','red','orange','mint'];
  const colors=['#fad356','#ff83ff','#6fc9ff','#ac8dfe','#ff4d4d','#ff993c','#5fbf63'];
  const sprites=keys.map(key=>{const im=new Image();im.src=`./assets/marble-${key}.svg?v=8`;return im;});
  const $=id=>document.getElementById(id);
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const rand=seed=>()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
  const modes=['ZIGZAG','SPLIT PATHS','FUNNEL FRENZY'];
  const startXs=[100,156,212,268,324,380,436];
  let seed=Math.floor(Math.random()*1e9),random=rand(seed),level=0,chosen=-1,mode='ready';
  let rails=[],rotors=[],bumpers=[],funnels=[],runners=[],finishers=[],camera=0;
  let raceTime=0,countdown=3.1,holdTime=3,lastBeat='',resultsTime=0,lastFrame=0,accumulator=0;
  let audioCtx=null,playedVictory=false;
  const rando=(a,b)=>a+(b-a)*random();
  function status(s){$('status').textContent=s;}
  function rail(x1,y1,x2,y2,w=12,kind='rail'){
    // Each free end stops well inside the wall so marbles cannot lodge against it.
    if(kind!=='funnel'){x1=clamp(x1,92,421);x2=clamp(x2,92,421);}
    rails.push({x1,y1,x2,y2,thickness:w,kind});
  }
  function spinner(x,y,length=140,speed=2.5,phase=0){rotors.push({x,y,l:length,s:speed,a:phase,thickness:15});}
  function bump(x,y,r=18){bumpers.push({x,y,r});}
  function funnel(x,y,spread=190,gap=90,drop=96){
    const j=gap/2;
    const obj={x,y,spread,gap,drop}; funnels.push(obj);
    rail(x-spread,y,x-j,y+drop,12,'funnel');
    rail(x+spread,y,x+j,y+drop,12,'funnel');
    bump(x-j,y+drop-3,8); bump(x+j,y+drop-3,8);
  }
  function buildCourse(){
    rails=[];rotors=[];bumpers=[];funnels=[];finishers=[];
    random=rand(seed);level=Math.floor(random()*3);random=rand(seed+level*7011);
    // Shared departure shelf: the start screen IS the first stretch of track.
    rail(92,315,418,389,14,'start');
    if(level===0){
      rail(166,518,508,470); rail(31,710,366,787);
      funnel(270,840,183,86,100);
      rail(166,1115,506,1038); rail(34,1280,365,1360);
      funnel(265,1445,189,80,105);
      rail(178,1742,505,1655); rail(33,1868,369,1932);
      [[282,570,142,3.1],[256,1016,166,-2.6],[284,1260,148,3.5],[255,1605,168,-2.9],[270,1902,124,3.2]].forEach(v=>spinner(...v));
      [[84,622],[432,690],[103,1190],[435,1505],[100,1820]].forEach(v=>bump(...v,19));
    }else if(level===1){
      // Multiple actual forks, with barriers that reunite the two sides.
      rail(33,508,244,583);rail(296,583,508,508);
      rail(270,600,110,760);rail(270,600,431,760);
      rail(31,833,239,895);rail(303,895,508,833);
      funnel(270,990,199,98,105);
      rail(40,1240,244,1320);rail(300,1320,500,1240);
      rail(270,1320,92,1498);rail(270,1320,451,1498);
      rail(37,1590,247,1660);rail(293,1660,507,1590);
      funnel(270,1740,195,78,99);
      [[269,470,156,-3.4],[270,775,146,3.1],[260,1164,160,-3.2],[288,1435,175,3.5],[267,1840,130,-3.5]].forEach(v=>spinner(...v));
      [[70,900],[462,908],[130,1150],[407,1150],[82,1572],[465,1570]].forEach(v=>bump(...v,18));
    }else{
      // Alternating side-exit funnels and staggered spinning gates.
      funnel(250,500,214,92,114);
      rail(37,757,210,802);rail(331,802,499,744);
      funnel(322,865,163,86,105);
      rail(38,1170,210,1220);rail(330,1220,506,1150);
      funnel(220,1310,171,82,118);
      rail(37,1590,210,1643);rail(330,1643,506,1565);
      funnel(294,1765,190,86,95);
      [[272,698,172,3.8],[250,1020,166,-3.7],[300,1239,174,4],[248,1508,164,-3.7],[280,1950,152,4.1]].forEach(v=>spinner(...v));
      [[80,728],[460,735],[105,1085],[435,1085],[84,1535],[455,1730]].forEach(v=>bump(...v,18));
    }
    // Subtle deterministic microvariations create race reshuffles without altering the three layouts.
    for(let i=1;i<rails.length;i++) if(rails[i].kind==='rail') {const j=rando(-9,9);rails[i].y1+=j;rails[i].y2+=j;}
    for(const s of rotors){s.a=rando(-1,1);s.x+=rando(-13,13);s.s*=rando(.92,1.08);}
    for(const b of bumpers){b.x+=rando(-9,9);}
    let places=[...startXs];for(let i=places.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[places[i],places[j]]=[places[j],places[i]];}
    runners=places.map((x,i)=>({id:i,x:x+rando(-3,3),y:275+rando(-2,2),vx:rando(-13,13),vy:0,r:R,angle:0,spin:0,finished:false,finishedAt:null,progress:275,stuck:0,lastY:275,name:colorNames[i]}));
    camera=0;raceTime=0;countdown=3.1;holdTime=3;lastBeat='';resultsTime=0;mode='ready';playedVictory=false;accumulator=0;
    $('start').textContent='START RACE';
    status('Pick your favorite marble. The course changes automatically each race.');
  }
  function beep(freq=440,length=.16,offset=0,type='triangle',volume=.075){
    try{if(!audioCtx)return;const t=audioCtx.currentTime+offset;
      const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+length);
      o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+length+.02);
    }catch(_){/* audio optional */}
  }
  function unlockAudio(){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume().catch(()=>{});}catch(_){}}
  function countBeep(k){if(k==='GO'){beep(650,.15);beep(900,.28,.12)}else beep(335+(3-Number(k))*125,.16)}
  function victory(){if(playedVictory)return;playedVictory=true;[[523,0],[659,.1],[784,.21],[1047,.34]].forEach(([n,t])=>beep(n,.2,t));}
  function begin(){if(mode!=='ready'&&mode!=='results')return; if(mode==='results'){seed=Math.floor(Math.random()*1e9);buildCourse();}
    unlockAudio();mode='hold';holdTime=3;countdown=3.1;lastBeat='';camera=0;
    document.body.dataset.mode='hold';status('Race queued! Starting in 3 seconds.');}
  function lineCollision(p,s,omega=0){
    const dx=s.x2-s.x1,dy=s.y2-s.y1;const length=dx*dx+dy*dy;if(length<1)return false;
    const t=clamp(((p.x-s.x1)*dx+(p.y-s.y1)*dy)/length,0,1),qx=s.x1+dx*t,qy=s.y1+dy*t;
    const a=p.x-qx,b=p.y-qy,dist=Math.hypot(a,b)||.001,depth=p.r+s.thickness*.5-dist;
    if(depth<=0)return false;
    const nx=a/dist,ny=b/dist;p.x+=nx*(depth+.1);p.y+=ny*(depth+.1);
    const svx=s.cx===undefined?0:-omega*(qy-s.cy),svy=s.cx===undefined?0:omega*(qx-s.cx);
    const avx=p.vx-svx,avy=p.vy-svy,app=avx*nx+avy*ny;
    if(app<0){const e=s.cx===undefined?.19:.68;p.vx-=(1+e)*app*nx;p.vy-=(1+e)*app*ny;
      const tv=avx*(-ny)+avy*nx,f=s.kind==='funnel'?.035:.018;
      p.vx+=ny*tv*f;p.vy-=nx*tv*f;
      if(s.cx!==undefined){p.vx+=svx*.009;p.vy+=svy*.009;}
    }
    return true;
  }
  function bumpCollision(p,b){
    const x=p.x-b.x,y=p.y-b.y,d=Math.hypot(x,y)||.01,dep=p.r+b.r-d;if(dep<=0)return;
    const nx=x/d,ny=y/d;p.x+=nx*(dep+.1);p.y+=ny*(dep+.1);
    const v=p.vx*nx+p.vy*ny;if(v<0){p.vx-=1.75*v*nx;p.vy-=1.75*v*ny;}
  }
  function pairCollision(a,b){
    if(a.finished||b.finished)return;
    const x=b.x-a.x,y=b.y-a.y,d=Math.hypot(x,y)||.01,depth=a.r+b.r-d;if(depth<=0)return;
    const nx=x/d,ny=y/d;a.x-=nx*depth*.5;a.y-=ny*depth*.5;b.x+=nx*depth*.5;b.y+=ny*depth*.5;
    const v=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(v<0){const j=-(1+.58)*v*.5;a.vx-=j*nx;a.vy-=j*ny;b.vx+=j*nx;b.vy+=j*ny;}
  }
  function raceStep(dt){
    raceTime+=dt;
    const simDt=dt*(level===0?1.18:level===1?1.48:level===2?1.72:1);
    for(const s of rotors)s.a+=s.s*simDt;
    // The last third of the short race has a slightly stronger pull toward the finish.
    const gravity=690+Math.max(0,raceTime-4.7)*145;
    for(const p of runners){
      if(p.finished)continue;
      p.vy+=gravity*simDt;
      p.x+=p.vx*simDt;p.y+=p.vy*simDt;
      if(p.x<p.r+26){p.x=p.r+26;p.vx=Math.abs(p.vx)*.66;}
      if(p.x>W-p.r-26){p.x=W-p.r-26;p.vx=-Math.abs(p.vx)*.66;}
      if(p.y<205){p.y=205;p.vy=Math.abs(p.vy)*.4;}
      for(const s of rails)if(p.y>=Math.min(s.y1,s.y2)-85&&p.y<=Math.max(s.y1,s.y2)+85)lineCollision(p,s);
      for(const s of rotors)if(Math.abs(p.y-s.y)<s.l*.65+p.r){
        const c=Math.cos(s.a),v=Math.sin(s.a);lineCollision(p,{x1:s.x-c*s.l/2,y1:s.y-v*s.l/2,x2:s.x+c*s.l/2,y2:s.y+v*s.l/2,thickness:s.thickness,cx:s.x,cy:s.y,kind:'spinner'},s.s);
      }
      for(const b of bumpers)if(Math.abs(p.y-b.y)<p.r+b.r+5)bumpCollision(p,b);
      p.vx=clamp(p.vx,-900,900);p.vy=clamp(p.vy,-860,1250);
      p.angle+=p.vx*simDt/p.r*.35;
      // Keep motion alive around tiny collision deadlocks at a funnel mouth.
      if(Math.abs(p.y-p.lastY)<1.1)p.stuck+=simDt;else {p.stuck=0;p.lastY=p.y;}
      if(p.stuck>.7){p.vx+=((p.id%2)?-1:1)*165;p.vy+=155;p.stuck=0;}
      if(p.y>=GROUND){p.finished=true;p.y=GROUND;p.finishedAt=raceTime;finishers.push(p);if(finishers.length===1)status(`${p.name} reaches the finish first!`);}
    }
    for(let i=0;i<runners.length;i++)for(let j=i+1;j<runners.length;j++)pairCollision(runners[i],runners[j]);
    // Follow the FIRST marble, not the middle of the pack.
    const leader=Math.max(...runners.map(p=>p.finished?GROUND:p.y));
    const target=clamp(leader-375,0,HEIGHT-H);
    camera+=(target-camera)*Math.min(1,dt*7.5);
    if(finishers.length===6||raceTime>=8.0){
      // Finish order is physics-based. At the time limit, order remaining racers by progress.
      const remaining=runners.filter(p=>!p.finished).sort((a,b)=>b.y-a.y||a.id-b.id);
      finishers.push(...remaining);mode='results';resultsTime=0;victory();
      status(`${finishers[0].name} wins! ${raceTime.toFixed(1)} seconds.`);
    }
  }
  function update(dt){
    if(mode==='hold'){
      holdTime-=dt;if(holdTime<=0){mode='countdown';countdown=3.1;lastBeat='';}
    }else if(mode==='countdown'){
      countdown-=dt;
      const k=countdown>3?'3':countdown>2?'2':countdown>1?'1':'GO';
      if(lastBeat!==k){lastBeat=k;countBeep(k);}
      if(countdown<=0){mode='racing';raceTime=0;status('The marbles are racing.');}
    }else if(mode==='racing')raceStep(dt);
    else if(mode==='results')resultsTime+=dt;
  }
  function rounded(x,y,w,h,r,fill,stroke=null,lw=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
  function label(s,x,y,size=20,color='#111',weight=1000,align='center'){
    ctx.save();ctx.font=`${weight} ${size}px ui-rounded,'Arial Rounded MT Bold','Trebuchet MS',system-ui,sans-serif`;
    ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.restore();
  }
  function marble(i,x,y,d=51,angle=0,selected=false){
    const im=sprites[i],r=d/2;
    ctx.save();ctx.translate(x,y);
    // Render the supplied marble illustration directly, including its gloss and head.
    if(im.complete&&im.naturalWidth){
      ctx.rotate(angle*.04);
      ctx.drawImage(im,-r,-r,d,d);
    }else{
      ctx.beginPath();ctx.arc(0,0,r*.9,0,Math.PI*2);ctx.fillStyle=colors[i];ctx.fill();
    }
    if(selected){ctx.beginPath();ctx.arc(0,0,r+5,0,Math.PI*2);ctx.lineWidth=3.5;ctx.strokeStyle='#111';ctx.stroke();}
    ctx.restore();
  }
  function background(){
    ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
    // Drawing paper aesthetic: no color outside the racers.
    ctx.strokeStyle='#111';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(31,0);ctx.lineTo(31,H);ctx.moveTo(W-31,0);ctx.lineTo(W-31,H);ctx.stroke();
    for(let i=0;i<12;i++){
      const x=60+(i*113)%417,y=(((i*267-camera)%1300)+1300)%1300;
      ctx.beginPath();ctx.arc(x,y,1.5+(i%3===0?1:0),0,7);ctx.fillStyle='#ddd';ctx.fill();
    }
  }
  function drawRail(s){
    ctx.lineCap='round';ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);
    ctx.lineWidth=s.kind==='funnel'?14:16;ctx.strokeStyle='#090909';ctx.stroke();
  }
  function drawRotor(s){
    const c=Math.cos(s.a),v=Math.sin(s.a);
    ctx.lineCap='round';ctx.beginPath();
    ctx.moveTo(s.x-c*s.l/2,s.y-v*s.l/2);ctx.lineTo(s.x+c*s.l/2,s.y+v*s.l/2);
    ctx.lineWidth=18;ctx.strokeStyle='#090909';ctx.stroke();
    ctx.beginPath();ctx.arc(s.x,s.y,7,0,7);ctx.fillStyle='#090909';ctx.fill();
  }
  function drawBumper(b){ctx.beginPath();ctx.arc(b.x,b.y,b.r+3,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=4;ctx.stroke();ctx.beginPath();ctx.arc(b.x,b.y,b.r*.5,0,7);ctx.fillStyle='#d0d0d0';ctx.fill();}
  function courseArt(){
    ctx.save();ctx.translate(0,-camera);
    for(const s of rails)drawRail(s);
    for(const b of bumpers)drawBumper(b);
    for(const s of rotors)drawRotor(s);
    // Small direction arrows at forks give the visual idea of two routes.
    if(level===1){for(const yy of [640,1368]){
      ctx.strokeStyle='#999';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(246,yy);ctx.lineTo(208,yy+27);ctx.moveTo(294,yy);ctx.lineTo(332,yy+27);ctx.stroke();
    }}
    ctx.fillStyle='#ededed';ctx.fillRect(42,GROUND-12,W-84,56);
    for(let i=0;i<27;i++)for(let j=0;j<2;j++){
      ctx.fillStyle=(i+j)%2?'#fff':'#111';ctx.fillRect(42+i*17,GROUND+j*17,17,17);
    }
    rounded(179,GROUND-90,182,41,16,'#fff','#111',3);label('FINISH',270,GROUND-69,24);
    for(const p of runners){if(p.finished&&mode==='racing')continue;
      marble(p.id,p.x,p.y,p.r*2.0,p.angle,(mode==='ready'||mode==='hold'||mode==='countdown')&&chosen===p.id);
    }
    ctx.restore();
  }
  function drawReady(){
    // There is NO cover: this text sits over the real marble run's starting section.
    rounded(116,126,308,62,24,'#fff','#111',4);
    label('PICK A MARBLE',W/2,157,31,'#111');
    label('TAP YOUR FAVORITE TO BACK IT',W/2,211,15,'#4b4b4b');
    // Pointers to individual racers make the selection self-explanatory.
    for(let i=0;i<colorNames.length;i++){
      if(chosen===i){ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(runners[i].x,220);ctx.lineTo(runners[i].x,238);ctx.stroke();}
      label(colorNames[i],runners[i].x,246,11,'#111');
    }
    rounded(148,683,244,38,19,'#fff','#111',2);
    label('7 MARBLES · 1 WINNER',W/2,702,15);
    label('A DIFFERENT RUN EVERY RACE',W/2,740,12,'#666');
  }
  function drawHold(){
    rounded(175,764,190,52,20,'#fff','#111',3);
    label(`STARTING IN ${Math.max(1,Math.ceil(holdTime))}`,W/2,790,21);
  }
  function drawCountdown(){
    const k=countdown>3?'3':countdown>2?'2':countdown>1?'1':'GO!';
    rounded(177,395,186,186,29,'#111');
    rounded(171,390,186,186,29,'#fff','#111',4);
    label(k,W/2,478,k==='GO!'?83:125,'#111');
    label(k==='GO!'?'LET’S RACE':'GET READY',W/2,550,18);
  }
  function drawRaceHeader(){
    rounded(153,113,234,47,20,'#fff','#111',3);
    label(`MARBLE RACE · ${raceTime.toFixed(1)}s`,W/2,137,20);
  }
  function drawResults(){
    background();
    rounded(124,123,292,66,22,'#fff','#111',4);label('WINNER!',W/2,156,45);
    const winner=finishers[0]||runners[0];marble(winner.id,270,302,159,0,true);
    rounded(105,418,330,66,19,'#111');label(`${winner.name} WINS!`,W/2,452,30,'#fff');
    const order=[finishers[1]||runners[1],winner,finishers[2]||runners[2]];
    const bars=[{x:97,y:661,w:105,h:125},{x:217,y:611,w:107,h:175},{x:341,y:690,w:103,h:96}];
    for(let i=0;i<3;i++){
      const c=bars[i],p=order[i],x=c.x+c.w/2;
      rounded(c.x,c.y,c.w,c.h,12,i===1?'#e6e6e6':'#f6f6f6','#111',3.5);
      marble(p.id,x,c.y-48,i===1?100:84);
      label([2,1,3][i].toString(),x,c.y+45,35);
      label(p.name,x,c.y+86,14);
    }
    label('DID YOUR MARBLE WIN?',W/2,814,17);
    label(`${raceTime.toFixed(1)}s OF RACING`,W/2,844,14,'#555');
    if(chosen>=0){rounded(125,522,290,41,16,'#fff','#111',2);label(chosen===winner.id?'YOUR PICK WON!':'TRY ANOTHER MARBLE',W/2,543,16);}
  }
  function resize(){const b=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1),cw=Math.max(1,Math.round(b.width*d)),ch=Math.max(1,Math.round(b.height*d));if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}}
  function draw(){resize();const scale=canvas.width/W,viewH=canvas.height/scale,offset=(viewH-H)/2;
    ctx.setTransform(scale,0,0,scale,0,offset*scale);ctx.fillStyle='#fff';ctx.fillRect(0,-offset,W,viewH);
    if(mode==='results')drawResults();else{
      background();courseArt();
      if(mode==='ready'||mode==='hold')drawReady();
      if(mode==='hold')drawHold();
      if(mode==='countdown')drawCountdown();
      if(mode==='racing')drawRaceHeader();
    }
    ctx.setTransform(1,0,0,1,0,0);
  }
  function loop(now){if(!lastFrame)lastFrame=now;const delta=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;
    accumulator+=delta;let steps=0;while(accumulator>=1/120&&steps<12){update(1/120);accumulator-=1/120;steps++;}
    if(steps===12)accumulator=0;
    if(mode!==document.body.dataset.mode){document.body.dataset.mode=mode;if(mode==='results')$('start').textContent='RACE AGAIN';}
    draw();requestAnimationFrame(loop);
  }
  canvas.addEventListener('pointerup',ev=>{if(mode!=='ready'&&mode!=='hold')return;
    const b=canvas.getBoundingClientRect(),xx=(ev.clientX-b.left)/b.width*W,yy=(ev.clientY-b.top)/b.width*W-((b.height/b.width*W-H)/2);
    for(let i=0;i<colorNames.length;i++)if(Math.abs(xx-runners[i].x)<34 && yy>229 && yy<314){chosen=i;status(`${colorNames[i]} selected.`);return;}
  });
  $('start').addEventListener('click',begin);
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)lastFrame=0;});
  window.TRUNKZ_DEBUG={
    state:()=>({mode,level,chosen,raceTime,holdTime,camera,leader:Math.max(...runners.map(p=>p.y)),results:finishers.map(p=>p.name),positions:runners.map(p=>[p.name,Math.round(p.x),Math.round(p.y)]),countdown}),
    start:begin,step:sec=>{for(let i=0;i<Math.round(sec*120);i++)update(1/120);draw();},
    level:i=>{level=clamp(i,0,2);buildCourse();},newRace:()=>{seed=Math.floor(Math.random()*1e9);buildCourse();}
  };
  buildCourse();resize();requestAnimationFrame(loop);
})();