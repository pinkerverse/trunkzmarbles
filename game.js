'use strict';
(() => {
  // TRUNKZ Marbles: native Canvas, SVG character heads, and optional WebAudio.
  // Race outcomes are produced by movement along continuous, visible ramps;
  // no teleporting, arbitrary 8-second cutoff, or edge-to-edge gravity drops.
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d', {alpha:false});
  const W=540, H=960, FINISH_Y=2020, WORLD_HEIGHT=2250, R=25;
  const keys=['pink','blue','mint','gold','lavender','coral'];
  const names=['PINK','BLUE','MINT','SUNNY','LILAC','CORAL'];
  const colors=['#ff8bfa','#78b7fb','#7ed6a3','#ffc966','#b9a2f4','#ff9789'];
  const sprites=keys.map(key=>{const img=new Image();img.src=`./assets/${key}.svg`;return img;});
  const $=id=>document.getElementById(id);
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const mix=(a,b,t)=>a+(b-a)*t;
  const randomSeed=()=>Math.floor(Math.random()*2147483647);
  const rng=(seed)=>()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
  let seed=randomSeed(),random=rng(seed),layout=0,chosen=-1,mode='ready';
  let path=[],length=0,rotors=[],funnels=[],bumps=[],forks=[],runners=[],finishers=[];
  let holdTime=3,countdown=3.1,raceTime=0,camera=0,resultsTime=0;
  let baseSpeed=300,lastFrame=0,accumulator=0,lastBeat='',audioCtx=null,playedVictory=false;
  const randomRange=(lo,hi)=>lo+(hi-lo)*random();
  function status(text){$('status').textContent=text;}
  const layouts=[
    [[86,310],[450,388],[108,608],[432,824],[119,1055],[434,1281],[108,1515],[433,1736],[270,FINISH_Y]],
    [[86,310],[449,387],[135,606],[396,829],[92,1046],[446,1278],[148,1505],[418,1740],[270,FINISH_Y]],
    [[86,310],[452,390],[122,626],[419,851],[134,1065],[447,1291],[91,1502],[413,1732],[270,FINISH_Y]]
  ];
  function point(s){
    const d=clamp(s,0,length);
    for(let i=0;i<path.length-1;i++){
      const a=path[i],b=path[i+1];
      if(d<=b.s||i===path.length-2){
        const t=clamp((d-a.s)/(b.s-a.s),0,1);
        const dx=(b.x-a.x)/(b.s-a.s),dy=(b.y-a.y)/(b.s-a.s);
        return {x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),nx:-dy,ny:dx,angle:Math.atan2(b.y-a.y,b.x-a.x)};
      }
    }
    return {x:270,y:FINISH_Y,nx:0,ny:1,angle:0};
  }
  function forkOffset(p,s){
    let shift=0;
    for(let j=0;j<forks.length;j++){
      const f=forks[j];
      if(s<f.from||s>f.to)continue;
      const t=(s-f.from)/(f.to-f.from);
      shift+=p.lanes[j]*f.spread*Math.sin(Math.PI*t)**2;
    }
    return shift;
  }
  function runnerPosition(p){
    const loc=point(p.s);
    const offset=forkOffset(p,p.s)+Math.sin(raceTime*4+p.id*2)*1.5;
    return {x:loc.x+loc.nx*offset,y:loc.y+loc.ny*offset,angle:loc.angle};
  }
  function buildCourse(){
    random=rng(seed);layout=Math.floor(random()*3);
    const pts=layouts[layout].map(([x,y],i)=>({x:i===0||i===1||i===8?x:clamp(x+randomRange(-24,24),85,453),y:i===0||i===8?y:y+randomRange(-15,15),s:0}));
    for(let i=1;i<pts.length;i++)pts[i].s=pts[i-1].s+Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);
    path=pts;length=pts[pts.length-1].s;
    // Forks and funnels are distributed across the actual course, not drawn as a backdrop.
    forks=[{from:pts[2].s+50,to:pts[3].s-60,spread:28+randomRange(0,10)},
           {from:pts[5].s+48,to:pts[6].s-60,spread:25+randomRange(0,11)}];
    const f1=pts[3],f2=pts[6];
    funnels=[{s:f1.s,x:f1.x,y:f1.y-30,spread:86}, {s:f2.s,x:f2.x,y:f2.y-30,spread:79}];
    rotors=[{s:pts[2].s-40,x:0,y:0,len:115,a:randomRange(0,6.28),speed:randomRange(2.1,2.9)},
            {s:pts[4].s+45,x:0,y:0,len:132,a:randomRange(0,6.28),speed:-randomRange(2.2,3.0)},
            {s:pts[6].s-85,x:0,y:0,len:112,a:randomRange(0,6.28),speed:randomRange(2.1,3.0)}];
    for(const r of rotors){const p=point(r.s);r.x=p.x;r.y=p.y;}
    bumps=[pts[2],pts[5]].map((p,i)=>({x:clamp(p.x+(i===0?40:-40),70,480),y:p.y-60,r:13}));
    let shuffled=[0,1,2,3,4,5];
    for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
    runners=shuffled.map((id,slot)=>{
      const s=30+slot*59;
      const p={id,name:names[id],s,speed:0,finished:false,finishedAt:null,spin:0,
        lanes:[random()<.5?-1:1,random()<.5?-1:1],
        gateFactors:rotors.map(()=>randomRange(.34,.89)),
        funnelFactors:funnels.map(()=>randomRange(.47,.92)),
        character:randomRange(-.12,.12),phase:randomRange(0,6.28)};
      const loc=runnerPosition(p);p.x=loc.x;p.y=loc.y;return p;
    });
    // Median racer reaches the actual finish around 8–10 seconds after GO.
    baseSpeed=(length-170)/8.45;
    finishers=[];raceTime=0;countdown=3.1;holdTime=3;lastBeat='';playedVictory=false;
    resultsTime=0;camera=0;mode='ready';chosen=-1;accumulator=0;
    $('start').textContent='START RACE';status('Pick your favorite TRUNKZ marble.');
  }
  function beep(f=440,seconds=.14,offset=0,volume=.065){
    if(!audioCtx)return;
    try{const t=audioCtx.currentTime+offset,o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);
      g.gain.exponentialRampToValueAtTime(volume,t+.012);
      g.gain.exponentialRampToValueAtTime(.0001,t+seconds);
      o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+seconds+.02);
    }catch(_){/* sound is optional */}
  }
  function audioStart(){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume().catch(()=>{});}catch(_){}}
  function victory(){if(playedVictory)return;playedVictory=true;[[523,0],[659,.10],[784,.20],[1047,.34]].forEach(([f,t])=>beep(f,.2,t));}
  function begin(){
    if(mode==='results'){seed=randomSeed();buildCourse();}
    if(mode!=='ready')return;
    audioStart();mode='hold';holdTime=3;countdown=3.1;lastBeat='';
    document.body.dataset.mode='hold'; // Immediately acknowledge Start.
    status('Race queued! Starting in three seconds.');
  }
  function updateRace(dt){
    raceTime+=dt;
    for(const rotor of rotors)rotor.a+=rotor.speed*dt;
    for(const p of runners){
      if(p.finished)continue;
      let multiplier=1+p.character+.075*Math.sin(raceTime*2.2+p.phase)+.035*Math.sin(p.s*.008+p.id*2.1);
      for(let j=0;j<rotors.length;j++){
        const distance=Math.abs(p.s-rotors[j].s);
        if(distance<80){const t=1-distance/80;multiplier*=1-t*(1-p.gateFactors[j]);}
      }
      for(let j=0;j<funnels.length;j++){
        const distance=Math.abs(p.s-funnels[j].s);
        if(distance<65){const t=1-distance/65;multiplier*=1-t*(1-p.funnelFactors[j]);}
      }
      // A small catch-up effect gives trailing marbles more opportunities to overtake.
      const lead=Math.max(...runners.filter(b=>!b.finished).map(b=>b.s));
      if(lead-p.s>115)multiplier*=1.09;
      const target=clamp(baseSpeed*multiplier,110,baseSpeed*1.24);
      p.speed+= (target-p.speed)*Math.min(1,dt*8.5);
      p.s=Math.min(length,p.s+p.speed*dt);
      const pos=runnerPosition(p);p.x=pos.x;p.y=pos.y;
      p.spin+=p.speed*dt/100;
      if(p.s>=length){
        p.finished=true;p.finishedAt=raceTime;finishers.push(p);
        if(finishers.length===1)status(`${p.name} crosses the finish line first!`);
      }
    }
    const leader=Math.max(...runners.map(p=>p.y));
    camera+= (clamp(leader-415,0,WORLD_HEIGHT-H)-camera)*Math.min(1,dt*6.5);
    if(finishers.length>=3){
      mode='results';resultsTime=0;victory();
      status(`${finishers[0].name} wins! Three marbles crossed the finish line in ${raceTime.toFixed(1)} seconds.`);
    }
  }
  function update(dt){
    if(mode==='hold'){
      holdTime-=dt;if(holdTime<=0){mode='countdown';countdown=3.1;lastBeat='';}
    }else if(mode==='countdown'){
      countdown-=dt;const k=countdown>3?'3':countdown>2?'2':countdown>1?'1':'GO';
      if(lastBeat!==k){lastBeat=k;if(k==='GO'){beep(670,.16);beep(880,.23,.13);}else beep(325+(3-Number(k))*128,.16);}
      if(countdown<=0){mode='racing';raceTime=0;status('The race is on!');}
    }else if(mode==='racing')updateRace(dt);
    else if(mode==='results')resultsTime+=dt;
  }
  function rounded(x,y,w,h,r,fill,stroke=null,lw=1){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function text(s,x,y,size=20,color='#111',weight=900){
    ctx.save();ctx.font=`${weight} ${size}px ui-rounded,'Arial Rounded MT Bold','Trebuchet MS',system-ui,sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.restore();
  }
  function marble(id,x,y,d=50,angle=0,selected=false){
    const r=d/2;ctx.save();
    ctx.beginPath();ctx.arc(x+.9,y+1.3,r+.5,0,Math.PI*2);ctx.fillStyle='#0002';ctx.fill();
    ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fillStyle=colors[id];ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(x,y,r-.5,0,7);ctx.clip();
    const grad=ctx.createLinearGradient(x-r,y-r,x+r,y+r);
    grad.addColorStop(0,'#ffffff6e');grad.addColorStop(.5,'#ffffff08');grad.addColorStop(1,'#00000012');
    ctx.fillStyle=grad;ctx.fillRect(x-r,y-r,d,d);
    const im=sprites[id];if(im.complete&&im.naturalWidth){
      ctx.translate(x,y+1);ctx.rotate(angle*.035);
      // Original supplied head artwork, with its now-restored bold black outline.
      ctx.drawImage(im,-r*.98,-r*.61,r*1.96,r*1.22);
    }
    ctx.restore();
    ctx.beginPath();ctx.arc(x,y,r-1,0,7);ctx.strokeStyle='#111';ctx.lineWidth=Math.max(2.4,d*.045);ctx.stroke();
    if(selected){ctx.beginPath();ctx.arc(x,y,r+6,0,7);ctx.strokeStyle='#111';ctx.lineWidth=3.5;ctx.stroke();}
    ctx.restore();
  }
  function background(){
    ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
    // Solid black walls: no dashed lines, highlights, or distracting edge decorations.
    ctx.strokeStyle='#111';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(31,0);ctx.lineTo(31,H);ctx.moveTo(W-31,0);ctx.lineTo(W-31,H);ctx.stroke();
  }
  function blackLine(x1,y1,x2,y2,width=12){
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.lineWidth=width;ctx.lineCap='round';ctx.strokeStyle='#080808';ctx.stroke();
  }
  function drawCourse(){
    ctx.save();ctx.translate(0,-camera);
    for(let i=0;i<path.length-1;i++)blackLine(path[i].x,path[i].y,path[i+1].x,path[i+1].y,13);
    // Split/merge lanes create genuine left/right alternatives visually and in motion.
    for(const f of forks){
      for(const sign of [-1,1]){
        ctx.beginPath();
        for(let i=0;i<=16;i++){
          const s=mix(f.from,f.to,i/16),pt=point(s),t=(s-f.from)/(f.to-f.from);
          const off=sign*f.spread*Math.sin(Math.PI*t)**2;
          const x=pt.x+pt.nx*off,y=pt.y+pt.ny*off;
          if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.strokeStyle='#080808';ctx.lineWidth=8;ctx.lineCap='round';ctx.stroke();
      }
    }
    for(const f of funnels){
      blackLine(f.x-f.spread,f.y-82,f.x-23,f.y+48,9);
      blackLine(f.x+f.spread,f.y-82,f.x+23,f.y+48,9);
    }
    for(const b of bumps){
      ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.lineWidth=5;ctx.strokeStyle='#090909';ctx.stroke();
    }
    for(const rotor of rotors){
      const co=Math.cos(rotor.a),si=Math.sin(rotor.a),half=rotor.len/2;
      blackLine(rotor.x-co*half,rotor.y-si*half,rotor.x+co*half,rotor.y+si*half,15);
      ctx.beginPath();ctx.arc(rotor.x,rotor.y,6,0,7);ctx.fillStyle='#050505';ctx.fill();
    }
    // A physical finish line, not a timer or a progress approximation.
    ctx.fillStyle='#fff';ctx.fillRect(39,FINISH_Y-6,W-78,45);
    for(let i=0;i<22;i++)for(let j=0;j<2;j++){
      ctx.fillStyle=(i+j)%2?'#fff':'#111';ctx.fillRect(42+i*21,FINISH_Y+j*18,21,18);
    }
    rounded(193,FINISH_Y-66,154,38,15,'#fff','#111',2.5);text('FINISH',270,FINISH_Y-47,22);
    for(const p of runners){if(p.finished&&mode==='racing')continue;marble(p.id,p.x,p.y,2*R,p.spin,(mode==='ready'||mode==='hold'||mode==='countdown')&&p.id===chosen);}
    ctx.restore();
  }
  function drawReady(){
    rounded(111,117,318,65,24,'#fff','#111',4);
    text('PICK A MARBLE',270,150,34);
    text('TAP YOUR FAVORITE TO BACK IT',270,210,16,'#555');
    for(const p of runners)text(p.name,p.x,p.y-41,11,'#111');
    rounded(159,693,222,42,22,'#fff','#111',2);
    text('6 MARBLES  ·  1 WINNER',270,714,16);
  }
  function drawStarting(){
    // Keep PICK A MARBLE visible, while showing that Start was accepted.
    rounded(152,770,236,75,21,'#fff','#111',4);
    text('STARTING IN ' + Math.max(1,Math.ceil(holdTime)),270,806,27);
    text('GET READY!',270,857,15,'#111');
  }
  function drawCountdown(){
    rounded(172,390,196,186,29,'#fff','#111',4);
    const t=countdown>3?'3':countdown>2?'2':countdown>1?'1':'GO!';
    text(t,270,475,t==='GO!'?76:122,'#111');text(t==='GO!'?'LET’S RACE':'GET READY',270,548,19);
  }
  function drawRaceHeader(){
    rounded(165,107,210,49,19,'#fff','#111',3);
    text('MARBLE RACE',270,132,22);
  }
  function drawResults(){
    background();
    rounded(124,123,292,66,22,'#fff','#111',4);text('WINNER!',270,156,45);
    const winner=finishers[0];if(!winner)return;
    marble(winner.id,270,302,156,0,true);
    rounded(105,418,330,66,19,'#111');text(`${winner.name} WINS!`,270,452,30,'#fff');
    const order=[finishers[1],finishers[0],finishers[2]];
    const bars=[{x:97,y:660,w:105,h:125},{x:217,y:610,w:107,h:175},{x:341,y:689,w:103,h:96}];
    for(let i=0;i<3;i++){
      const b=bars[i],p=order[i],cx=b.x+b.w/2;
      rounded(b.x,b.y,b.w,b.h,12,i===1?'#e6e6e6':'#f6f6f6','#111',3.5);
      marble(p.id,cx,b.y-48,i===1?100:84);
      text(String([2,1,3][i]),cx,b.y+44,35);
      text(p.name,cx,b.y+86,14);
    }
    text('FIRST THREE ACROSS THE LINE',270,830,17);
    text(`${raceTime.toFixed(1)}s OF RACING`,270,868,15,'#555');
    if(chosen>=0){rounded(125,520,290,39,15,'#fff','#111',2);
      text(chosen===winner.id?'YOUR PICK WON!':'RACE AGAIN TO TRY YOUR LUCK',270,540,15);}
  }
  function resize(){
    const b=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);
    const w=Math.max(1,Math.round(b.width*d)),h=Math.max(1,Math.round(b.height*d));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  }
  function draw(){
    resize();const scale=canvas.width/W,viewH=canvas.height/scale,offset=(viewH-H)/2;
    ctx.setTransform(scale,0,0,scale,0,offset*scale);ctx.fillStyle='#fff';ctx.fillRect(0,-offset,W,viewH);
    background();if(mode==='results'){drawResults();}else{
      drawCourse();if(mode==='ready'||mode==='hold')drawReady();
      if(mode==='hold')drawStarting();
      if(mode==='countdown')drawCountdown();if(mode==='racing')drawRaceHeader();
    }
    ctx.setTransform(1,0,0,1,0,0);
  }
  function loop(now){
    if(!lastFrame)lastFrame=now;
    const delta=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;
    accumulator+=delta;let n=0;
    while(accumulator>=1/120&&n<12){update(1/120);accumulator-=1/120;n++;}
    if(n===12)accumulator=0;
    if(mode!==document.body.dataset.mode){document.body.dataset.mode=mode;
      if(mode==='results')$('start').textContent='RACE AGAIN';}
    draw();requestAnimationFrame(loop);
  }
  canvas.addEventListener('pointerup',event=>{
    if(mode!=='ready'&&mode!=='hold')return;
    const b=canvas.getBoundingClientRect();
    const x=(event.clientX-b.left)/b.width*W;
    const y=(event.clientY-b.top)/b.width*W-((b.height/b.width*W-H)/2);
    for(const p of runners)if(Math.hypot(x-p.x,y-p.y)<34){chosen=p.id;status(`${p.name} selected.`);return;}
  });
  $('start').addEventListener('click',begin);
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)lastFrame=0;});
  window.TRUNKZ_DEBUG={
    state:()=>({mode,layout,chosen,raceTime,holdTime,countdown,camera,length,baseSpeed,
      results:finishers.map(p=>({name:p.name,t:p.finishedAt})),
      positions:runners.map(p=>({name:p.name,x:Math.round(p.x),y:Math.round(p.y),s:Math.round(p.s)}))}),
    start:begin,step:sec=>{for(let i=0;i<Math.round(sec*120);i++)update(1/120);draw();},
    newRace:()=>{seed=randomSeed();buildCourse();},finishers:()=>finishers.length
  };
  buildCourse();resize();requestAnimationFrame(loop);
})();