'use strict';
(()=>{
const P=window.TRUNKZPhysics,{W,H,LEFT,RIGHT,FINISH,clamp}=P;
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d',{alpha:false});
const keys=['sunny','pink','blue','lilac','red','orange','mint'];
const sprites=keys.map(key=>{const im=new Image();im.src=`../assets/marble-${key}.svg`;return im;});
let world,mode='loading',chosen=-1,camera=0,cameraTarget=0,hold=0,count=0,goTime=0,resultDelay=0;
let lastFrame=0,accumulator=0,audio=null,lastBeat=-1,previousFamily=-1,raceNumber=0;
const status=s=>$('status').textContent=s;
function setMode(next){mode=next;document.body.dataset.mode=next;$('start').disabled=!['ready','results'].includes(next);}
function newRace(){
const seed=crypto.getRandomValues(new Uint32Array(1))[0];
const family=previousFamily<0?seed%3:(previousFamily+1+seed%2)%3;previousFamily=family;
world=P.create(seed,family);camera=0;cameraTarget=0;hold=0;count=0;resultDelay=0;goTime=0;accumulator=0;raceNumber++;
chosen=-1;$('start').textContent='START RACE';setMode('ready');status('Pick a marble. Which one will win?');
$('picks').replaceChildren(...world.marbles.map(p=>{const b=document.createElement('button');b.style.left=`${(p.x-28)/W*100}%`;b.setAttribute('aria-label',`Pick ${p.name}`);b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>select(p.id));return b;}));
}
function select(id){if(mode!=='ready')return;chosen=id;[...$('picks').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===id)));status(`${P.names[id]} selected. Press Start Race.`);}
function unlockAudio(){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch(_){}}
function tone(f,d=.12,offset=0,volume=.055){if(!audio)return;try{const t=audio.currentTime+offset,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+d+.01);}catch(_){}}
function start(){
if(mode==='results'){newRace();return;}if(mode!=='ready')return;
unlockAudio();hold=3;lastBeat=-1;$('start').textContent='PICK LOCKED IN';setMode('hold');tone(420,.08);status('Race queued. Get ready!');
}
function results(){setMode('results');$('start').textContent='RACE AGAIN';[523,659,784,1047].forEach((f,i)=>tone(f,.18,i*.1));status(`${world.finishers.slice(0,3).map((p,i)=>`${i+1}: ${p.name}`).join('. ')}. Race time ${world.time.toFixed(1)} seconds. Race Again returns to a new starting platform.`);}
function update(dt){
if(mode==='hold'){hold-=dt;if(hold<=0){count=3;lastBeat=3;tone(360);setMode('countdown');status('3, 2, 1, go!');}}
else if(mode==='countdown'){count-=dt;const beat=Math.ceil(count);if(beat!==lastBeat&&beat>0){tone(360+(3-beat)*100);lastBeat=beat;}if(count<=0){setMode('racing');tone(720,.18);tone(960,.2,.10);status('Go! The marbles are racing.');}}
else if(mode==='racing'){
goTime+=dt;for(const p of world.finishers){p.vy=Math.min(p.vy+590*dt,420);p.y+=p.vy*dt;p.angle+=p.omega*dt;}if(!world.done)P.step(world,dt);else{resultDelay+=dt;if(resultDelay>=.85){results();return;}}
const leader=world.finishers.length?FINISH:Math.max(...world.marbles.map(p=>p.y));cameraTarget=Math.max(cameraTarget,clamp(leader-380,0,FINISH-615));camera+=(cameraTarget-camera)*(1-Math.exp(-dt*9));
}}
function line(x1,y1,x2,y2,w=12,color='#111'){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function box(x,y,w,h,r=16,fill='#fff',stroke=null){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=3;ctx.strokeStyle=stroke;ctx.stroke();}}
function text(s,x,y,size=20,color='#111',weight=900){ctx.font=`${weight} ${size}px ui-rounded,'Arial Rounded MT Bold','Trebuchet MS',system-ui,sans-serif`;ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y);}
function marble(id,x,y,r,angle=0,selected=false){
ctx.save();ctx.translate(x,y);ctx.rotate(angle);
// Crop only the original SVG's transparent inset; preserve every illustrated pixel.
ctx.drawImage(sprites[id],10,10,236,236,-r,-r,r*2,r*2);ctx.restore();
if(selected){ctx.beginPath();ctx.arc(x,y,r+7,0,Math.PI*2);ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.stroke();}}
function background(){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);line(LEFT,0,LEFT,H,3);line(RIGHT,0,RIGHT,H,3);}
function course(){
ctx.save();ctx.translate(0,-camera);
if(mode==='ready'||mode==='hold'||mode==='countdown'){line(65,320,445,320,12);line(65,320,65,337,7);line(445,320,445,337,7);}
else if(world.time<.4){const a=clamp(world.time/.35,0,1)*1.5;line(65,320,65+190*Math.cos(a),320+190*Math.sin(a),12);line(445,320,445-190*Math.cos(a),320+190*Math.sin(a),12);}
for(const s of world.rails)line(s.x1,s.y1,s.x2,s.y2,s.thickness);
for(const s of world.rotors){const c=Math.cos(s.a)*s.l/2,v=Math.sin(s.a)*s.l/2;line(s.x-c,s.y-v,s.x+c,s.y+v,12);ctx.beginPath();ctx.arc(s.x,s.y,5,0,7);ctx.fillStyle='#fff';ctx.fill();}
for(const b of world.bumpers){ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#111';ctx.stroke();}
// The first edge of the checkerboard is the exact physical crossing plane.
const tile=(RIGHT-LEFT)/24;for(let i=0;i<24;i++)for(let j=0;j<2;j++){ctx.fillStyle=(i+j)%2?'#fff':'#111';ctx.fillRect(LEFT+i*tile,FINISH+j*tile,tile+.2,tile+.2);}text('FINISH',255,FINISH+69,21);
for(const p of world.marbles){const y=p.y;marble(p.id,p.x,y,p.r,p.angle,chosen===p.id);if(p.finished){box(p.x-12,y-45,24,22,8,'#111');text(String(world.finishers.indexOf(p)+1),p.x,y-34,14,'#fff');}}
ctx.restore();
}
function ready(){
box(59,103,392,124,0);text('TRUNKZ MARBLES',255,116,14,'#555',800);text('PICK A MARBLE',255,162,38);text('Which one will win?',255,205,21,'#555',600);
for(const p of world.marbles)text(p.name,p.x,250,12,'#333',800);
box(102,650,306,75,18);text(chosen<0?'7 MARBLES. 1 WINNER.':`${P.names[chosen]} IS YOUR PICK`,255,674,20);text(mode==='hold'?`Starting in ${Math.max(1,Math.ceil(hold))}…`:'Tap a marble to back it.',255,705,17,'#555',600);if(mode==='hold')text('GET READY',255,823,15,'#555');
}
function countdown(){box(158,375,194,194,36,'#fff','#111');text(String(Math.max(1,Math.ceil(count))),255,462,120);text('HERE WE GO',255,540,16);}
function raceHeader(){
box(89,106,332,73,18);text(world.done?'THE TOP THREE ARE IN':P.families[world.family].toUpperCase(),255,122,14,'#555',800);
const lead=world.finishers[0]||world.marbles.reduce((a,b)=>a.y>b.y?a:b);text(`${lead.name} ${world.finishers.length?'FINISHED FIRST':'LEADS'}`,255,155,24);if(goTime<.6){box(171,394,168,114,24,'#fff','#111');text('GO!',255,452,70);}
}
function podium(){
background();text('TRUNKZ MARBLES',255,116,14,'#555',800);text('WINNER!',255,163,53);const winners=world.finishers.slice(0,3),winner=winners[0];
marble(winner.id,255,297,83);text(`${winner.name} WINS!`,255,416,37);text(chosen<0?'Did you pick the winner?':chosen===winner.id?'YOU PICKED THE WINNER!':winners.some(p=>p.id===chosen)?'YOUR PICK MADE THE PODIUM!':'A REMATCH?',255,462,16,'#555',700);
const cols=[{p:winners[1],x:95,y:628,rank:2},{p:winner,x:207,y:581,rank:1},{p:winners[2],x:319,y:654,rank:3}];
for(const c of cols){const x=c.x+48;box(c.x,c.y,96,721-c.y,14,c.rank===1?'#111':'#f2f2f2',c.rank===1?null:'#111');marble(c.p.id,x,c.y-45,c.rank===1?37:32);text(String(c.rank),x,c.y+(c.rank===3?22:30),26,c.rank===1?'#fff':'#111');text(c.p.name,x,699,14,c.rank===1?'#fff':'#111');}text('NEW COURSE. NEW CHANCE.',255,828,14,'#555',700);
}
function resize(){const rect=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,3);const w=Math.round(rect.width*d),h=Math.round(rect.height*d);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}}
function draw(){resize();ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);if(!world){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);text('LOADING MARBLES',255,440,25);return;}if(mode==='results')podium();else{background();course();if(mode==='ready'||mode==='hold')ready();if(mode==='countdown')countdown();if(mode==='racing')raceHeader();}}
function frame(now){const delta=lastFrame?Math.min((now-lastFrame)/1000,.05):0;lastFrame=now;accumulator+=delta;while(accumulator>=P.DT){update(P.DT);accumulator-=P.DT;}draw();canvas.dataset.race=JSON.stringify(window.TRUNKZ_DEBUG.state());requestAnimationFrame(frame);}
$('start').addEventListener('click',start);document.addEventListener('visibilitychange',()=>{lastFrame=0;accumulator=0;});
window.TRUNKZ_DEBUG={state:()=>({version:9,mode,seed:world?.seed,family:world?.family,raceNumber,chosen,time:world?.time,camera,leadChanges:world?.leadChanges,contacts:world?.contacts,pairContacts:world?.pairContacts,results:world?.finishers.map(p=>p.name),crossings:world?.crossings,positions:world?.marbles.map(p=>({name:p.name,x:p.x,y:p.y,angle:p.angle,contacts:p.contacts}))})};
draw();Promise.all(sprites.map(im=>im.decode())).then(()=>{newRace();requestAnimationFrame(frame);}).catch(()=>{status('Could not load the marble artwork. Please reopen the app online.');$('start').disabled=true;$('start').textContent='REOPEN TO LOAD';});
})();
