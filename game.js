'use strict';
(function(){
  const canvas=document.getElementById('scene');
  const ctx=canvas.getContext('2d',{alpha:false});
  const $=id=>document.getElementById(id);
  const W=540,H=960,COURSE_HEIGHT=2850,GROUND=2645,R=26;
  const namesDefault=['PINK','BLUE','MINT','SUNNY','LILAC','CORAL'];
  const palette=['#ff8bfa','#78b7fb','#7ed6a3','#ffc966','#b9a2f4','#ff9789'];
  const trackColors=['#b3a2fb','#6bd9b7','#ffb9aa','#f4c961','#83c5fb','#edb7ef','#76dbca','#cdb5ff'];
  const spriteKeys=['pink','blue','mint','gold','lavender','coral'];
  const sprites={};
  Object.keys(SPRITE_URLS).forEach(k=>{let img=new Image();img.src=SPRITE_URLS[k];sprites[k]=img});
  const racerList=$('racerList');
  let favorite=-1, introTime=0, lastBeat=null, audioCtx=null, soundOn=true, lastMode='', lastResultJingle=false;
  namesDefault.forEach((name,i)=>{
    const div=document.createElement('div');div.className='racer';
    const image=document.createElement('img');image.src=SPRITE_URLS[spriteKeys[i]];image.alt='';
    const input=document.createElement('input');input.value=name;input.maxLength=11;input.setAttribute('aria-label',`Racer ${i+1} name`);
    div.appendChild(image);div.appendChild(input);racerList.appendChild(div);
  });
  const random=seed=>()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296};
  let seed=Math.floor(Math.random()*1e9),rng=random(seed),course='zigzag',ramp=[],spinners=[],bumper=[],runners=[],sparks=[],camera=0,mode='ready',raceTime=0,countdown=0,resultsTime=0,finishers=[],acc=0,last=0,recording=null,recordParts=[],recordStart=false,autoStop=false,reelName='TRUNKZ-Race';
  const rando=(a,b)=>a+(b-a)*rng();
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const setStatus=(s)=>{$('status').textContent=s};
  function initCourse(){
    rng=random(seed);course=$('course').value;
    ramp=[];spinners=[];bumper=[];sparks=[];runners=[];finishers=[];
    let level=[
      [[48,382],[448,454]],[[100,700],[500,620]],[[47,847],[425,932]],
      [[102,1218],[498,1114]],[[42,1403],[415,1507]],[[100,1770],[496,1652]],
      [[45,1950],[427,2064]],[[110,2350],[495,2234]],
    ];
    if(course==='drop'){
       level=[[[35,352],[325,410]],[[220,660],[509,590]],[[35,850],[320,900]],[[210,1180],[506,1090]],[[35,1370],[320,1450]],[[212,1720],[500,1630]],[[35,1940],[322,2010]],[[200,2300],[502,2240]]];
    }
    for(let i=0;i<level.length;i++){
       let [[x1,y1],[x2,y2]]=level[i];
       let j=course==='chaos'?14:9;
       y1+=rando(-j,j);y2+=rando(-j,j);
       ramp.push({x1,y1,x2,y2,thickness:12,id:i});
    }
    let spinnerConfig=course==='chaos'?
       [[267,535,130,1.9],[260,980,150,-2.2],[260,1280,118,2.5],[270,1595,145,-2.0],[255,2130,150,2.1],[274,2450,130,-2.3]]:
       [[270,548,112,1.55],[275,985,132,-1.7],[260,1305,120,1.2],[265,1608,122,-1.55],[255,2114,110,1.7],[268,2420,110,-1.2]];
    if(course==='drop')spinnerConfig=[[256,540,106,1.6],[268,1030,122,-2.0],[265,1525,122,1.7],[260,2080,118,-1.8]];
    spinners=spinnerConfig.map(([x,y,l,s],i)=>({x:x+rando(-24,24),y:y+rando(-10,10),l,s:s*(.85+rando(0,.3)),a:rando(-.3,.3),phase:rando(-3,3),thickness:13,id:i}));
    const bumpCoords=[[128,595],[425,785],[110,1015],[418,1260],[138,1570],[425,1900],[100,2150],[438,2440]];
    bumper=bumpCoords.map(([x,y],i)=>({x:x+rando(-18,18),y:y+rando(-13,13),r:15+(i%3)*3,color:['#fbd679','#c3b6ff','#88ded0'][i%3]}));
    let xs=[90,160,230,300,370,440];
    for(let k=xs.length-1;k>0;k--){const j=Math.floor(rng()*(k+1));[xs[k],xs[j]]=[xs[j],xs[k]];}
    runners=xs.map((x,i)=>({id:i,x:x+rando(-7,7),y:225+rando(-8,8),vx:rando(-35,35),vy:0,r:R,angle:rando(-.10,.10),spin:0,finished:false,finishedAt:null,lastMoved:0,lastY:225,color:palette[i],name:getName(i),sprite:spriteKeys[i],impacts:0}));
    camera=0;raceTime=0;countdown=0;resultsTime=0;mode='ready';autoStop=false;acc=0;
    setStatus('Ready. Pick your TRUNKZ marble, then start the race.');
  }
  function getName(i){const e=racerList.querySelectorAll('input')[i];return (e&&e.value.trim().slice(0,11))||namesDefault[i]};
  function randNewRace(){seed=Math.floor(Math.random()*1e9);favorite=-1;initCourse()}
  function startRace(shouldRecord){
     if(recording){recording.stop();recording=null}
     // AudioContext must be unlocked by the user pressing the start button.
     if(soundOn){ensureAudio();tone(525,.09,0,'triangle',.045);}
     if(mode==='results')seed=Math.floor(Math.random()*1e9);initCourse(); mode='intro'; introTime=3.2; countdown=4.0;lastBeat=null;lastResultJingle=false;
     setStatus('Pick your TRUNKZ marble — countdown coming up!');
  }
  function ensureAudio(){
    try{if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});}catch(e){}
  }
  function tone(frequency,duration=.12,delay=0,type='sine',volume=.09){
    if(!soundOn||!audioCtx)return;
    try{
      const t=audioCtx.currentTime+delay;
      const oscillator=audioCtx.createOscillator(),gain=audioCtx.createGain();
      oscillator.type=type; oscillator.frequency.setValueAtTime(frequency,t);
      gain.gain.setValueAtTime(.0001,t); gain.gain.exponentialRampToValueAtTime(volume,t+.014);
      gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
      oscillator.connect(gain);gain.connect(audioCtx.destination);
      oscillator.start(t);oscillator.stop(t+duration+.015);
    }catch(e){}
  }
  function countdownSound(n){
    if(n==='GO!'){
      tone(640,.17,0,'triangle',.11);tone(820,.19,.09,'triangle',.09);tone(1050,.32,.20,'triangle',.09);
    }else tone(350+(3-n)*115,.17,0,'sine',.13);
  }
  function victorySound(){
    for(const [f,d,t] of [[523,.17,0],[659,.17,.15],[784,.22,.30],[1047,.48,.49]])tone(f,d,t,'triangle',.085);
  }
  function updateCountdownBeat(){
    const n=countdown>3?'3':countdown>2?'2':countdown>1?'1':'GO!';
    if(n!==lastBeat){lastBeat=n;countdownSound(n==='GO!'?n:Number(n));}
  }
  function startRecording(){
    if(!canvas.captureStream||typeof MediaRecorder==='undefined'){
      setStatus('This browser cannot record the canvas. Use Screen Recording + Focus mode instead.');return;
    }
    const types=['video/mp4;codecs=avc1.42E01E','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'];
    const mime=types.find(t=>MediaRecorder.isTypeSupported(t))||'';
    try{
      const stream=canvas.captureStream(30);
      recording=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:4500000}:undefined);
      recordParts=[];
      recording.ondataavailable=e=>{if(e.data.size>0)recordParts.push(e.data)};
      recording.onstop=()=>{
         if(!recordParts.length){setStatus('Nothing was recorded. Please use Screen Recording.');return}
         const type=mime||'video/webm';
         const ext=type.includes('mp4')?'mp4':'webm';
         const blob=new Blob(recordParts,{type});
         const url=URL.createObjectURL(blob);
         const a=document.createElement('a');a.href=url;a.download=`TRUNKZ-race-${seed}.${ext}`;
         document.body.appendChild(a);a.click();a.remove();
         setTimeout(()=>URL.revokeObjectURL(url),30000);
         setStatus(`Recording saved as ${ext.toUpperCase()}. Ready for your next race!`);
         recording=null;
      };
      recording.onerror=()=>setStatus('Recording error; use your device’s Screen Recording instead.');
      recording.start(1000);recordStart=true;
    }catch(e){recording=null;setStatus('Video recording is unavailable here. Use Screen Recording with Focus mode.');}
  }
  function stopRecording(){if(recording&&recording.state==='recording'){recording.stop()}}
  function lineBall(p,s,omega=0){
    let {x1,y1,x2,y2}=s;
    let dx=x2-x1,dy=y2-y1,len2=dx*dx+dy*dy;
    let t=clamp(((p.x-x1)*dx+(p.y-y1)*dy)/len2,0,1);
    let qx=x1+dx*t,qy=y1+dy*t;
    let sx=p.x-qx,sy=p.y-qy;
    let dist=Math.hypot(sx,sy);let depth=p.r+s.thickness*.5-dist;
    if(depth<=0)return false;
    let nx,ny;
    if(dist>.0001){nx=sx/dist;ny=sy/dist;}else{nx=0;ny=-1;}
    p.x+=nx*(depth+.08);p.y+=ny*(depth+.08);
    let svx=0,svy=0;
    if(s.cx!==undefined){svx=-omega*(qy-s.cy);svy=omega*(qx-s.cx)}
    const rvx=p.vx-svx,rvy=p.vy-svy;
    let approach=rvx*nx+rvy*ny;
    if(approach<0){
      const bounce=s.cx!==undefined?.78:.38;
      p.vx-=(1+bounce)*approach*nx;p.vy-=(1+bounce)*approach*ny;
      // Slight per-racer friction difference and tiny tangential drift to break ties
      const tangent=rvx*(-ny)+rvy*nx;
      const friction=s.cx!==undefined?.005:.012;
      p.vx-=(-ny)*tangent*friction;p.vy-=nx*tangent*friction;
      if(s.cx!==undefined&&Math.abs(approach)>105&&sparks.length<35){
        sparks.push({x:qx,y:qy,vx:45*nx+rando(-24,24),vy:45*ny+rando(-24,24),life:.32,color:p.color});
      }
    }
    return true;
  }
  function ballsCollide(a,b){
    if(a.finished||b.finished)return;
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,depth=a.r+b.r-d;
    if(depth<=0)return;
    const nx=dx/d,ny=dy/d;
    a.x-=nx*depth*.51;a.y-=ny*depth*.51;b.x+=nx*depth*.51;b.y+=ny*depth*.51;
    const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(rv<0){const j=-(1+.68)*rv/2;
      a.vx-=j*nx;a.vy-=j*ny;b.vx+=j*nx;b.vy+=j*ny;
    }
  }
  function bumperBall(p,b){
    let dx=p.x-b.x,dy=p.y-b.y,dist=Math.hypot(dx,dy)||.01,depth=p.r+b.r-dist;
    if(depth<=0)return;
    let nx=dx/dist,ny=dy/dist;
    p.x+=nx*(depth+.1);p.y+=ny*(depth+.1);
    const v=p.vx*nx+p.vy*ny;
    if(v<0){p.vx-=(1+1.05)*v*nx;p.vy-=(1+1.05)*v*ny;}
  }
  function update(dt){
    if(mode==='intro'){
       introTime-=dt;
       if(introTime<=0){mode='countdown';countdown=4;lastBeat=null;updateCountdownBeat();}
    }
    else if(mode==='countdown'){
       countdown-=dt;updateCountdownBeat();
       if(countdown<=0){mode='racing';raceTime=0;setStatus('Race in progress…')}
    }
    else if(mode==='racing'){
      raceTime+=dt;
      const grav=980;
      for(const s of spinners)s.a+=s.s*dt;
      for(const p of runners){
        if(p.finished)continue;
        p.vy+=grav*dt;
        p.vx*=.9998;p.vy*=.9998;
        p.x+=p.vx*dt;p.y+=p.vy*dt;
        if(p.x<p.r+22){p.x=p.r+22;p.vx=Math.abs(p.vx)*.65}
        if(p.x>W-22-p.r){p.x=W-22-p.r;p.vx=-Math.abs(p.vx)*.65}
        if(p.y<140){p.y=140;p.vy=Math.abs(p.vy)*.5}
        for(const s of ramp)if(Math.abs(p.y-(s.y1+s.y2)/2)<125)lineBall(p,s);
        for(const s of spinners){if(Math.abs(p.y-s.y)<s.l/2+p.r+28){
          let co=Math.cos(s.a),si=Math.sin(s.a);
          lineBall(p,{x1:s.x-co*s.l/2,y1:s.y-si*s.l/2,x2:s.x+co*s.l/2,y2:s.y+si*s.l/2,thickness:s.thickness,cx:s.x,cy:s.y},s.s);
        }}
        for(const b of bumper)if(Math.abs(p.y-b.y)<75)bumperBall(p,b);
        p.vx=clamp(p.vx,-780,780);p.vy=clamp(p.vy,-820,1150);
        p.angle+=(p.vx*dt/Math.max(p.r,1))*.27; // Each TRUNKZ head gently rolls with its marble
        if(p.y>GROUND && !p.finished){
          p.finished=true;p.finishedAt=raceTime;finishers.push(p);
          if(finishers.length===1)setStatus(`${p.name} has taken the lead!`);
        }
      }
      for(let i=0;i<runners.length;i++)for(let j=i+1;j<runners.length;j++)ballsCollide(runners[i],runners[j]);
      for(let i=sparks.length-1;i>=0;i--){let q=sparks[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;if(q.life<=0)sparks.splice(i,1)}
      let alive=runners.filter(p=>!p.finished);
      let front=finishers.length>=3 || finishers.length===6 || raceTime>=32;
      if(front){
        if(finishers.length<3){alive.sort((a,b)=>b.y-a.y);finishers.push(...alive.slice(0,3-finishers.length));}
        finishers=[...new Set(finishers)].slice(0,6);
        mode='results';resultsTime=0; if(!lastResultJingle){victorySound();lastResultJingle=true;}
        const champ=finishers[0];
        setStatus(`🏆 ${champ.name} wins! ${raceTime.toFixed(1)}s race. ${recording?'Finishing video…':'Click New race to run again.'}`);
      }
      const positions=runners.filter(p=>!p.finished).map(p=>p.y).sort((a,b)=>b-a);
      const target=finishers.length>=3?GROUND-620:(positions.length?positions[Math.min(2,positions.length-1)]-455:GROUND-610);
      camera+= (clamp(target,0,COURSE_HEIGHT-H)-camera)*Math.min(1,dt*2.2);
    }else if(mode==='results'){
      resultsTime+=dt;
      camera+=(COURSE_HEIGHT-H-camera)*Math.min(1,dt*1.8);
      if(resultsTime>5 && recording && !autoStop){autoStop=true;stopRecording()}
    }
  }
  function rndRect(x,y,w,h,r,fill,stroke=null,lw=1){
    if(w<0||h<0)return;
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);
    ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}
  }
  // Heavy, friendly display lettering with a subtle inky keyline to survive mobile compression.
  function text(s,x,y,size,color,weight='950',align='center',outline=0){
    ctx.save();ctx.font=`${weight} ${size}px ui-rounded,'Arial Rounded MT Bold','Trebuchet MS',system-ui,sans-serif`;
    ctx.textAlign=align;ctx.textBaseline='middle';ctx.lineJoin='round';
    if(outline){ctx.strokeStyle='#302640';ctx.lineWidth=outline;ctx.strokeText(s,x,y)}
    ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.restore();
  }
  function star(x,y,r,fill,angle=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();
    for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,k=(i%2)?0.39:1;const px=Math.cos(a)*r*k,py=Math.sin(a)*r*k;if(!i)ctx.moveTo(px,py);else ctx.lineTo(px,py)}
    ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.restore();
  }
  function loopRing(x,y,r,color,width=3){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
  function drawLetterSticker(label,x,y,w,h,fill='#fffdf7',rotation=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);rndRect(-w/2+3,-h/2+4,w,h,14,'#302640');rndRect(-w/2,-h/2,w,h,14,fill,'#302640',3);text(label,0,1,Math.min(19,w/label.length*1.65),'#302640','1000');ctx.restore();
  }

  // Original six TRUNKZ colors remain unchanged. The upper portion of each
  // original SVG is cropped to the HEAD only and printed inside a soft 2.5-D marble.
  // No bitmaps, embedded base64 payloads, external dependencies, or tracking.
  const marblePaint={pink:palette[0],blue:palette[1],mint:palette[2],gold:palette[3],lavender:palette[4],coral:palette[5]};
  function marble(k,x,y,diameter=52,angle=0){
    const r=diameter/2;
    const base=marblePaint[k]||palette[0];
    ctx.save();
    // A faint offset shadow grounds the marble, even when it is airborne.
    ctx.beginPath();ctx.arc(x+1.2,y+2.4,r,0,Math.PI*2);
    ctx.fillStyle='rgba(42,29,65,.17)';ctx.fill();
    // The sphere's underlying color uses precisely the same six pastel shades.
    ctx.beginPath();ctx.arc(x,y,r-1.1,0,Math.PI*2);
    ctx.fillStyle=base;ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(x,y,r-1.1,0,Math.PI*2);ctx.clip();
    const glaze=ctx.createLinearGradient(x-r*.78,y-r,x+r*.73,y+r);
    glaze.addColorStop(0,'rgba(255,255,255,.66)');
    glaze.addColorStop(.30,'rgba(255,255,255,.14)');
    glaze.addColorStop(.60,'rgba(255,255,255,0)');
    glaze.addColorStop(1,'rgba(50,35,75,.25)');
    ctx.fillStyle=glaze;ctx.fillRect(x-r,y-r,diameter,diameter);
    const im=sprites[k];
    if(im&&im.complete&&im.naturalWidth){
      // Source SVG: 447 × 488, but the illustrated elephant head lives in
      // the first ~267 pixels. Its body is intentionally not drawn.
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);
      const headW=diameter*.87,headH=headW*(267/447);
      ctx.drawImage(im,0,0,447,267,-headW/2,-headH/2+.02*diameter,headW,headH);
      ctx.restore();
    }
    // Fine highlight: gentle gloss, never a full plastic-looking 3-D ball.
    const shine=ctx.createRadialGradient(x-r*.49,y-r*.54,0,x-r*.49,y-r*.54,r*.55);
    shine.addColorStop(0,'rgba(255,255,255,.51)');
    shine.addColorStop(.50,'rgba(255,255,255,.16)');
    shine.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath();ctx.arc(x-r*.30,y-r*.35,r*.49,0,Math.PI*2);ctx.fillStyle=shine;ctx.fill();
    ctx.restore();
    ctx.beginPath();ctx.arc(x,y,r-1,0,Math.PI*2);
    ctx.strokeStyle='#302640';ctx.lineWidth=Math.max(1.8,diameter*.047);ctx.stroke();
    ctx.beginPath();ctx.arc(x,y,r-3.6,-2.55,-.73);
    ctx.strokeStyle='rgba(255,255,255,.70)';ctx.lineWidth=Math.max(1,diameter*.034);ctx.stroke();
    ctx.restore();
  }
  function drawBackground(){
    ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,W,H);
    // Warm lilac lane and painted dashed rails—more toy board than marble-run copy.
    ctx.fillStyle='#faf4ff';ctx.fillRect(26,0,W-52,H);
    ctx.fillStyle='#fefaf6';ctx.fillRect(42,0,W-84,H);
    ctx.strokeStyle='#e6d7f1';ctx.lineWidth=3;ctx.setLineDash([4,13]);
    ctx.beginPath();ctx.moveTo(30,0);ctx.lineTo(30,H);ctx.moveTo(W-30,0);ctx.lineTo(W-30,H);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<34;i++){
      let x=54+(i*137%430),y=((i*227)%2800-camera)%1100;if(y<0)y+=1100;
      if(i%3===0)star(x,y,5,['#ddc6f8','#ffdbb2','#c5f0dd'][i%3],i*.5);
      else{ctx.beginPath();ctx.arc(x,y,2+(i%2),0,7);ctx.fillStyle=i%2?'#efdee9':'#cfe7de';ctx.fill()}
    }
    ctx.fillStyle='#bdb0cb';ctx.font='900 13px ui-rounded,system-ui,sans-serif';ctx.textAlign='left';
    for(let y=380;y<GROUND;y+=360){let sy=y-camera;if(sy>-20&&sy<H+20){ctx.fillText(`${Math.floor(y/360)*10} M`,53,sy)}}
  }

  function drawCourse(){
    ctx.save();ctx.translate(0,-camera);
    for(const s of ramp){
      // Rounded candy-colored rails with a charcoal edge and little bright pinstripes.
      ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(s.x1,s.y1+2);ctx.lineTo(s.x2,s.y2+2);ctx.strokeStyle='#342942';ctx.lineWidth=20;ctx.stroke();
      ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.strokeStyle=trackColors[s.id%trackColors.length];ctx.lineWidth=14;ctx.stroke();
      ctx.beginPath();ctx.moveTo(s.x1,s.y1-3);ctx.lineTo(s.x2,s.y2-3);ctx.strokeStyle='#ffffff9c';ctx.lineWidth=3;ctx.stroke();
      for(const pt of [[s.x1,s.y1],[s.x2,s.y2]]){ctx.beginPath();ctx.arc(pt[0],pt[1],6,0,7);ctx.fillStyle='#fffdf8';ctx.fill();ctx.strokeStyle='#342942';ctx.lineWidth=2;ctx.stroke()}
    }
    for(const s of spinners){
      let co=Math.cos(s.a),si=Math.sin(s.a),c=trackColors[(s.id+3)%trackColors.length],x1=s.x-co*s.l/2,y1=s.y-si*s.l/2,x2=s.x+co*s.l/2,y2=s.y+si*s.l/2;
      ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle='#342942';ctx.lineWidth=22;ctx.stroke();
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=c;ctx.lineWidth=16;ctx.stroke();
      for(const [px,py] of [[x1,y1],[x2,y2]]){ctx.beginPath();ctx.arc(px,py,11,0,7);ctx.fillStyle='#fff5db';ctx.fill();ctx.strokeStyle='#342942';ctx.lineWidth=3;ctx.stroke()}
      ctx.beginPath();ctx.arc(s.x,s.y,12,0,7);ctx.fillStyle='#342942';ctx.fill();
      ctx.beginPath();ctx.arc(s.x,s.y,6,0,7);ctx.fillStyle='#ffffff';ctx.fill();
      ctx.beginPath();ctx.arc(s.x-2,s.y-2,2,0,7);ctx.fillStyle='#ffb5df';ctx.fill();
    }
    for(const b of bumper){
      ctx.beginPath();ctx.arc(b.x,b.y,b.r+6,0,7);ctx.fillStyle='#fffdf7';ctx.fill();
      ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fillStyle=b.color;ctx.fill();ctx.strokeStyle='#342942';ctx.lineWidth=3;ctx.stroke();
      star(b.x,b.y,b.r*.55,'#fff8ed',.18);
    }
    const sy=GROUND;
    ctx.fillStyle='#f5e4ff';ctx.fillRect(28,sy-25,W-56,59);
    const check=16;
    for(let i=0;i<Math.ceil((W-56)/check);i++)for(let j=0;j<2;j++){
      ctx.fillStyle=((i+j)%2===0)?'#342942':'#ffffff';ctx.fillRect(28+i*check,sy-6+j*check,check,check);
    }
    drawLetterSticker('FINISH LINE',W/2,sy-75,210,46,'#e9ffd9',-.025);
    for(const q of sparks){ctx.globalAlpha=clamp(q.life/.32,0,1);star(q.x,q.y,5,q.color,.1)}ctx.globalAlpha=1;
    for(const p of runners){if(p.finished)continue;
      ctx.beginPath();ctx.ellipse(p.x,p.y+26,24,5,0,0,7);ctx.fillStyle='#34294218';ctx.fill();
      marble(p.sprite,p.x,p.y,2*p.r,p.angle);
      rndRect(p.x-34,p.y+35,68,21,9,'#fffdf8','#342942',2);
      text(p.name.slice(0,9),p.x,p.y+45,11,'#302640','950');
    }
    ctx.restore();
  }

  function drawHeader(){
    // Header starts below Instagram's top overlays; no text in the upper 110 px.
    rndRect(57,125,426,127,25,'#302640');
    rndRect(52,120,426,127,25,'#fff5d9','#302640',4);
    rndRect(65,132,400,100,18,'#fffdf8','#e7dac3',2);
    text('TRUNKZ MARBLE RACE',265,155,18,'#8a65bc','1000');
    if(mode==='ready'||mode==='intro'){
      text('PICK YOUR',265,186,39,'#302640','1000');
      text('TRUNKZ!',265,223,40,'#e979ab','1000');
    }else{
      text('WHICH MARBLE',265,189,31,'#302640','1000');
      text('WINS?',265,226,43,'#ee86af','1000');
    }
    if(mode==='racing'){
      rndRect(139,257,252,33,16,'#dffff0','#302640',2);
      text(`RACE ${raceTime.toFixed(1)}s     ${finishers.length}/6`,W/2,273,16,'#302640','1000');
    }
  }
  function drawReady(){
    text('PICK YOUR MARBLE!', W/2,290,23,'#554066','1000');
    // Selectable color cards, fully away from the right-side Reel action icons.
    for(let i=0;i<6;i++){
      const c=i%3,r=Math.floor(i/3),x=144+c*127,y=389+r*174,active=i===favorite;
      rndRect(x-57,y-72,114,148,19,active?'#fff0ba':'#f9f2ff',active?'#db9b3d':'#dbcae7',active?5:3);
      rndRect(x-50,y-65,100,136,15,'#fffefa',null);
      if(active){star(x+42,y-58,13,'#f7bc64',.4);text('★',x+42,y-58,14,'#302640','1000');}
      marble(spriteKeys[i],x,y-22,88);
      text(namesDefault[i],x,y+47,17,'#34273f','1000');
    }
    rndRect(93,766,354,44,19,'#d9fae9','#302640',2);
    text(mode==='intro'?'MAKE YOUR PICK!':mode==='countdown'?'THE RACE BEGINS!':'TAP A TRUNKZ TO CHOOSE',W/2,789,18,'#34273f','1000');
  }
  function drawCountdown(){
    let n=countdown>3?'3':countdown>2?'2':countdown>1?'1':'GO!';
    ctx.save();ctx.globalAlpha=.98;
    rndRect(153,348,245,249,35,'#302640');
    rndRect(147,340,245,249,35,n==='GO!'?'#c9f8e1':'#ffe5f1','#302640',5);
    star(164,365,17,'#efaa67',.3);star(379,560,18,'#aaa2ff',.35);
    text(n,W/2,448,n==='GO!'?86:139,n==='GO!'?'#e46c95':'#7854d9','1000','center',3);
    text(n==='GO!'?"LET'S RACE!":'GET READY!',W/2,538,25,'#302640','1000');
    ctx.restore();
  }
  function drawResults(){
    const alpha=clamp(resultsTime*2,0,1);ctx.save();ctx.globalAlpha=alpha;
    ctx.fillStyle='#fffaf1';ctx.fillRect(0,0,W,H);
    for(let i=0;i<42;i++){
      const x=37+(i*137+seed%77)%(W-74),y=115+(i*187)%727;
      if(i%4===0)star(x,y,6,['#ffafd8','#b4eed5','#d4c1ff'][i%3],i*.7);
      else{ctx.beginPath();ctx.arc(x,y,2.5,0,7);ctx.fillStyle=['#ffd77b','#d7bdff','#94ddc3'][i%3];ctx.fill()}
    }
    rndRect(57,132,426,133,25,'#302640');
    rndRect(52,126,426,133,25,'#fff0d0','#302640',4);
    text('TRUNKZ MARBLE RACE',265,157,18,'#7e5cb8','1000');
    text('WE HAVE A',265,187,39,'#302640','1000');
    text('WINNER!',265,231,44,'#e67ba8','1000');
    const champ=finishers[0]||runners[0];
    marble(champ.sprite,260,350,145);
    star(168,334,16,'#ffcb70',.1);star(375,353,14,'#a3d9ef',.4);
    rndRect(113,436,298,65,22,'#302640');rndRect(109,431,298,65,22,'#d8f7e4','#302640',3);
    text(`${champ.name} IS THE CHAMP!`,258,464,25,'#302640','1000');
    const order=[finishers[1]||runners[1],finishers[0]||runners[0],finishers[2]||runners[2]];
    const items=[
      {x:58,y:650,w:112,h:143,rank:2,bg:'#dce4f5',label:'2ND',s:85},
      {x:196,y:605,w:128,h:188,rank:1,bg:'#ffe18f',label:'1ST',s:100},
      {x:332,y:650,w:108,h:143,rank:3,bg:'#ffd2b4',label:'3RD',s:80}
    ];
    // Third place nudges left to protect labels from Instagram's right-side UI.
    items[2].x=332;
    for(let k=0;k<3;k++){
      const c=items[k],p=order[k],cent=c.x+c.w/2;
      rndRect(c.x+3,c.y+5,c.w,c.h,16,'#302640');rndRect(c.x,c.y,c.w,c.h,16,c.bg,'#302640',3);
      marble(p.sprite,cent,c.y-51,c.s);
      text(c.label,cent,c.y+30,20,'#302640','1000');
      rndRect(c.x+8,c.y+59,c.w-16,44,10,'#fffdf8','#302640',2);
      text(p.name,cent,c.y+81,p.name.length>7?13:16,'#302640','1000');
      text(`${c.rank}`,cent,c.y+c.h-19,34,'#302640','1000');
    }
    text('DID YOUR MARBLE WIN?',W/2,825,19,'#6d5078','1000');
    ctx.restore();
  }
  function resizeCanvas(){
    const dpr=Math.min(2,window.devicePixelRatio||1),box=canvas.getBoundingClientRect();
    const w=Math.max(1,Math.round(box.width*dpr)),h=Math.max(1,Math.round(box.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  }
  function draw(){
    resizeCanvas();
    const scale=canvas.width/W, visualHeight=canvas.height/scale, offset=(visualHeight-H)/2;
    ctx.setTransform(scale,0,0,scale,0,offset*scale);
    ctx.fillStyle='#fffaf1';ctx.fillRect(0,-offset,W,visualHeight);
    // Pastel background continues behind the Reel's 9:16 center frame on taller phones.
    drawBackground();
    if(mode==='racing')drawCourse();
    if(mode!=='results')drawHeader();
    if(mode==='ready'||mode==='intro'||mode==='countdown')drawReady();
    if(mode==='countdown')drawCountdown();
    if(mode==='results')drawResults();
    ctx.setTransform(1,0,0,1,0,0);
  }
  function frame(now){
    if(!last)last=now;
    let frameDt=Math.min((now-last)/1000,.05);last=now;
    const speed=Number($('speed').value)||1;
    acc+=frameDt*speed;
    let frames=0;
    while(acc>=1/120 && frames<12){update(1/120);acc-=1/120;frames++}
    if(frames===12)acc=0;
    updateUI();draw();requestAnimationFrame(frame);
  }
  $('start').onclick=()=>{if(mode==='ready'||mode==='results')startRace(false)};
  $('newRace').onclick=()=>randNewRace();
  $('soundToggle').onclick=()=>{soundOn=!soundOn;$('soundToggle').textContent=soundOn?'🔊':'🔇';$('soundToggle').setAttribute('aria-label',soundOn?'Mute countdown sounds':'Turn on countdown sounds');if(soundOn){ensureAudio();tone(525,.09,0,'triangle',.045);}};
  $('courseBtn').onclick=()=>{
    if(mode!=='ready'&&mode!=='results')return;
    const sel=$('course'), values=['zigzag','chaos','drop'];
    sel.value=values[(values.indexOf(sel.value)+1)%values.length];
    $('courseBtn').textContent={'zigzag':'ZIGZAG','chaos':'SPINNER CHAOS','drop':'QUICK DROP'}[sel.value];randNewRace();
  };
  canvas.addEventListener('pointerup',(ev)=>{
    if(mode!=='ready')return;
    const rect=canvas.getBoundingClientRect(),worldX=(ev.clientX-rect.left)/rect.width*W;
    const worldY=(ev.clientY-rect.top)/rect.width*W-(rect.height/rect.width*W-H)/2;
    for(let i=0;i<6;i++){
      const x=144+(i%3)*127,y=389+Math.floor(i/3)*174;
      if(Math.abs(worldX-x)<57&&worldY>y-72&&worldY<y+76){favorite=i;setStatus(`${namesDefault[i]} selected. Ready to race!`);return;}
    }
  });
  function updateUI(){
    if(lastMode!==mode){lastMode=mode;document.body.dataset.mode=mode;
      if(mode==='ready'||mode==='results')$('start').textContent=mode==='results'?'↻ RACE AGAIN':'▶ START RACE';
    }
  }
  window.addEventListener('resize',resizeCanvas,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){last=0;}});
  initCourse(); resizeCanvas(); requestAnimationFrame(frame);
  window.TRUNKZ_DEBUG={
    getState:()=>({mode,raceTime,introTime,countdown,resultsTime,finishers:finishers.map(p=>p.name),favorite,canvasW:canvas.width,canvasH:canvas.height}),
    step:seconds=>{for(let i=0;i<Math.round(seconds*120);i++)update(1/120);updateUI();draw()},
    start:()=>startRace(false),newRace:()=>randNewRace(),setFavorite:i=>{favorite=i},
  };
})();