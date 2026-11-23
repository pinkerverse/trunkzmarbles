'use strict';
(()=>{
const P=window.TRUNKZPhysics,{W,H,LEFT,RIGHT,FINISH,CATCH,WALL,clamp}=P;
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d',{alpha:false});
const keys=['sunny','pink','blue','lilac','red','orange','mint'];
const sprites=keys.map(key=>{const im=new Image();im.src=`../assets/marble-${key}.svg`;return im;});
let world,mode='loading',chosen=-1,camera=0,cameraTarget=0,goTime=0,countdown=0,lastBeat=0;
let lastFrame=0,accumulator=0,audio=null,previousFamily=-1,raceNumber=0;
const status=s=>$('status').textContent=s;
function setMode(next){mode=next;document.body.dataset.mode=next;$('start').disabled=!['ready','results'].includes(next);}
function newRace(){
const seed=crypto.getRandomValues(new Uint32Array(1))[0];
const family=previousFamily<0?seed%3:(previousFamily+1+seed%2)%3;previousFamily=family;
world=P.create(seed,family);camera=0;cameraTarget=0;goTime=0;countdown=0;lastBeat=0;accumulator=0;raceNumber++;
chosen=-1;$('start').textContent='START RACE';setMode('ready');status('Pick a marble. Which one will win?');
$('picks').replaceChildren(...world.marbles.map(p=>{const b=document.createElement('button');b.style.left=`${(p.x-27)/W*100}%`;b.style.top=`${(p.y-28)/H*100}%`;b.setAttribute('aria-label',`Pick ${p.name}`);b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>select(p.id));return b;}));
}
function select(id){if(mode!=='ready')return;chosen=id;[...$('picks').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===id)));status(`${P.names[id]} selected. Press Start Race.`);}
function unlockAudio(){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch(_){}}
function tone(f,d=.12,offset=0,volume=.055){if(!audio)return;try{const t=audio.currentTime+offset,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+d+.01);}catch(_){}}
function start(){
if(mode==='results'){newRace();return;}if(mode!=='ready')return;
unlockAudio();countdown=3;lastBeat=3;setMode('countdown');tone(360,.12);status('3 — get ready!');
}
function results(){setMode('results');$('start').textContent='RACE AGAIN';[523,659,784,1047].forEach((f,i)=>tone(f,.18,i*.1));status(`${world.finishers.slice(0,3).map((p,i)=>`${i+1}: ${p.name}`).join('. ')}. Race time ${(world.podiumTime||world.time).toFixed(1)} seconds. Race Again returns to a new starting platform.`);}
function update(dt){
 if(mode==='countdown'){
  countdown=Math.max(0,countdown-dt);const beat=Math.ceil(countdown);
  if(beat>0&&beat!==lastBeat){lastBeat=beat;tone(360+(3-beat)*100,.12);status(`${beat} — get ready!`);}
  if(countdown===0){goTime=0;setMode('racing');tone(720,.18);tone(960,.2,.10);status('GO! The marbles are racing.');}
  return;
 }
 if(mode!=='racing')return;
 goTime+=dt;P.step(world,dt);
 const leader=world.finishers.length?FINISH:Math.max(...world.marbles.map(p=>p.y));
 cameraTarget=Math.max(cameraTarget,clamp(leader-380,0,FINISH-500));camera+=(cameraTarget-camera)*(1-Math.exp(-dt*7.5));
 // End at the third real crossing. No wait for stragglers or collection animation.
 if(world.done)results();
}
function line(x1,y1,x2,y2,w=12,color='#111'){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function box(x,y,w,h,r=16,fill='#fff',stroke=null){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=3;ctx.strokeStyle=stroke;ctx.stroke();}}
function text(s,x,y,size=20,color='#111',weight=900){ctx.font=`${weight} ${size}px ui-rounded,'Arial Rounded MT Bold','Trebuchet MS',system-ui,sans-serif`;ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y);}
function marble(id,x,y,r,angle=0,selected=false){
ctx.save();ctx.translate(x,y);ctx.rotate(angle);
// Crop only the original SVG's transparent inset; preserve every illustrated pixel.
ctx.drawImage(sprites[id],10,10,236,236,-r,-r,r*2,r*2);ctx.restore();
if(selected){ctx.beginPath();ctx.arc(x,y,r+7,0,Math.PI*2);ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.stroke();}}
function background(){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);line(LEFT,0,LEFT,H,WALL);line(RIGHT,0,RIGHT,H,WALL);}
function course(){
 ctx.save();ctx.translate(0,-camera);
 for(const s of world.rails)line(s.x1,s.y1,s.x2,s.y2,s.thickness);
 if(mode==='ready'||mode==='countdown'){const g=world.gate;line(g.x1,g.y1,g.x2,g.y2,g.thickness);}
 for(const s of P.movingSegments(world)){line(s.x1,s.y1,s.x2,s.y2,s.thickness);ctx.beginPath();ctx.arc(s.cx,s.cy,5,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.stroke();}
 for(const b of world.bumpers){ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();}
 const tile=(RIGHT-LEFT)/24;for(let i=0;i<24;i++)for(let j=0;j<2;j++){ctx.fillStyle=(i+j)%2?'#fff':'#111';ctx.fillRect(LEFT+i*tile,FINISH+j*tile,tile+.2,tile+.2);}
 text('FINISH',255,FINISH-40,21);line(LEFT,CATCH-30,LEFT,CATCH,10);line(RIGHT,CATCH-30,RIGHT,CATCH,10);
 for(const p of world.marbles){marble(p.id,p.x,p.y,p.r,p.angle,chosen===p.id);if(p.finished){box(p.x-11,p.y-45,22,20,7,'#111');text(String(world.finishers.indexOf(p)+1),p.x,p.y-35,13,'#fff');}}
 ctx.restore();
}
function ready(){
 box(59,103,392,94,0);text('PICK A MARBLE',255,130,35);text('Which one will win?',255,169,20,'#555',600);
 if(mode==='ready')for(const p of world.marbles)text(p.name,p.x,p.y-39,11,'#333',800);
}
function countdownArt(){
 const digit=Math.max(1,Math.ceil(countdown)),elapsed=digit-countdown;
 const scale=1+.08*Math.exp(-elapsed*8);
 ctx.save();ctx.translate(255,228);ctx.scale(scale,scale);text(String(digit),0,0,78);ctx.restore();
}
function raceHeader(){
 if(goTime<.65){ready();const scale=1+.08*Math.exp(-goTime*8);ctx.save();ctx.translate(255,228);ctx.scale(scale,scale);text('GO!',0,0,78);ctx.restore();return;}

 box(83,105,344,74,18);text(P.families[world.family].toUpperCase(),255,121,14,'#555',800);
 const lead=world.finishers[0]||world.marbles.reduce((a,b)=>a.y>b.y?a:b);
 text(`${lead.name} ${world.finishers.length?'FINISHED FIRST':'LEADS'}`,255,154,24);

}
function podium(){
background();text('WINNER!',255,163,53);const winners=world.finishers.slice(0,3),winner=winners[0];
marble(winner.id,255,297,83);text(`${winner.name} WINS!`,255,416,37);text(chosen<0?'Did you pick the winner?':chosen===winner.id?'YOU PICKED THE WINNER!':winners.some(p=>p.id===chosen)?'YOUR PICK MADE THE PODIUM!':'A REMATCH?',255,462,16,'#555',700);
const cols=[{p:winners[1],x:95,y:628,rank:2},{p:winner,x:207,y:581,rank:1},{p:winners[2],x:319,y:654,rank:3}];
for(const c of cols){const x=c.x+48;box(c.x,c.y,96,721-c.y,14,c.rank===1?'#111':'#f2f2f2',c.rank===1?null:'#111');marble(c.p.id,x,c.y-45,c.rank===1?37:32);text(String(c.rank),x,c.y+(c.rank===3?22:30),26,c.rank===1?'#fff':'#111');text(c.p.name,x,699,14,c.rank===1?'#fff':'#111');}text('NEW COURSE. NEW CHANCE.',255,828,14,'#555',700);
}
function resize(){const rect=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,3);const w=Math.round(rect.width*d),h=Math.round(rect.height*d);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}}
function draw(){resize();ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);if(!world){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);text('LOADING MARBLES',255,440,25);return;}if(mode==='results')podium();else{background();course();if(mode==='ready'||mode==='countdown')ready();if(mode==='countdown')countdownArt();if(mode==='racing')raceHeader();}}
function frame(now){const delta=lastFrame?Math.min((now-lastFrame)/1000,.05):0;lastFrame=now;accumulator+=delta;while(accumulator>=P.DT){update(P.DT);accumulator-=P.DT;}draw();if(new URLSearchParams(location.search).has('qa'))canvas.dataset.race=JSON.stringify(window.TRUNKZ_DEBUG.state());requestAnimationFrame(frame);}
$('start').addEventListener('click',start);document.addEventListener('visibilitychange',()=>{lastFrame=0;accumulator=0;});
window.TRUNKZ_DEBUG={state:()=>({version:12,mode,seed:world?.seed,family:world?.family,raceNumber,chosen,time:world?.time,podiumTime:world?.podiumTime,allFinishedAt:world?.allFinishedAt,springHits:world?.springHits,gatePresent:mode==='ready'||mode==='countdown',countdown,numberBottom:228+78*1.08/2,marbleTop:world?Math.min(...world.marbles.map(p=>p.y-p.r)):null,catchY:CATCH,camera,leadChanges:world?.leadChanges,contacts:world?.contacts,pairContacts:world?.pairContacts,results:world?.finishers.map(p=>p.name),crossings:world?.crossings,positions:world?.marbles.map(p=>({name:p.name,x:p.x,y:p.y,angle:p.angle,contacts:p.contacts,pegHits:p.pegHits,finished:p.finished}))})};
draw();Promise.all(sprites.map(im=>im.decode())).then(()=>{newRace();requestAnimationFrame(frame);}).catch(()=>{status('Could not load the marble artwork. Please reopen the app online.');$('start').disabled=true;$('start').textContent='REOPEN TO LOAD';});
})();
