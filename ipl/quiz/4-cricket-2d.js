/* Original silent cinematic 2D cricket. RGB LED effects: stumps flash on bowled, rope chase on 4/6. Independent of quiz state, audio and saved history.
   Every ball is generated from a fresh random seed: delivery, stroke, hands, speed, pitch
   spot, swing, shot direction, player cosmetics and field placing all vary, and exact play
   signatures plus kit pairings are tracked so they do not repeat within the session. */
(function(){
'use strict';
const canvas=document.getElementById('cricket-action'); if(!canvas)return;
const ctx=canvas.getContext('2d',{alpha:false});
const W=960,H=400,DURATION=7,CONTACT=3.75,RELEASE=2.25;
/* Review build: ?crisp=K renders the whole scene at K times the 960x400 coordinate space, so vector art, text and effects stay sharp on high-resolution video. Player sprites top out at their painted cell resolution (about 280x210) at any K. K=1 keeps the live behaviour. */
const CRISP=Math.max(1,Math.min(4,parseFloat(new URLSearchParams(location.search).get('crisp')||'1')||1));
canvas.width=W*CRISP;canvas.height=H*CRISP;
function baseX(){ctx.setTransform(CRISP,0,0,CRISP,0,0);}
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const ease=(a,b,t)=>{let u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
const pt=(x,y)=>({x,y}); const lerp=(a,b,u)=>pt(mix(a.x,b.x,u),mix(a.y,b.y,u));
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
// Procedural team kits: 12 hues x 6 patterns x 3 trims x 4 depths, so pairings do not repeat.
const HUES=[['CRIMSON',348],['EMBER',16],['AMBER',36],['GOLD',48],['LIME',86],['JADE',152],['TEAL',178],['AZURE',200],['ROYAL',222],['VIOLET',266],['MAGENTA',310],['ROSE',328],['ORANGE',26],['SKY',192],['INDIGO',244],['MINT',140],['WINE',338],['COBALT',210]];
const PATTERNS=['solid','stripes','hoops','sash','gradient','panel'];
const TRIMS=['#f7f3df','#ffd54d','#13222a'];
const hsl=(h,s,l)=>`hsl(${h} ${s}% ${l}%)`;
function makeKit(r){let hueIdx=Math.floor(r()*HUES.length),pattern=Math.floor(r()*PATTERNS.length),trim=Math.floor(r()*TRIMS.length),depth=Math.floor(r()*4);
 let h=HUES[hueIdx][1],l=50+depth*4;
 return {name:HUES[hueIdx][0],c1:hsl(h,66,l),c2:hsl(h,60,Math.max(18,l-26)),trim:TRIMS[trim],pattern,sig:hueIdx+'-'+pattern+'-'+trim+'-'+depth};}
const deliveries=[{name:'Fast yorker',kind:'yorker',speed:146},{name:'Rising bouncer',kind:'bouncer',speed:143},{name:'Outswing',kind:'out',speed:137},{name:'Inswing',kind:'in',speed:139},{name:'Off spin',kind:'off',speed:86},{name:'Leg spin',kind:'leg',speed:81},{name:'Slower cutter',kind:'slow',speed:112},{name:'Seam up',kind:'seam',speed:141},{name:'Leg cutter',kind:'cut',speed:128},{name:'Full toss',kind:'toss',speed:104}];
const strokes=['Cover drive','Straight drive','Square cut','Pull shot','Sweep','Lofted drive','Flick','Late cut'];
// Ground-shot destinations (right-handed view) with per-play jitter applied.
const dest4=[pt(930,322),pt(936,258),pt(37,338),pt(912,96),pt(70,326),pt(560,120),pt(170,196),pt(64,262)];
const dest6={3:[pt(898,36),pt(940,64)],5:[pt(430,108),pt(560,132)]};
let bag=[],shotBag=[],ballNo=0,over=0,batKit,bowlKit,play,elapsed=0,last=0,raf=0,manual=false,log=[];
let sigHist=new Set(),kitHist=new Set(),fieldSpots=[],crowdSeed=1,lightMode=0;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
function shuffle(a){for(let i=a.length-1;i;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function take(type){let a=type==='ball'?bag:shotBag;if(!a.length)a.push(...shuffle(type==='ball'?deliveries.map((_,i)=>i):strokes.map((_,i)=>i)));return a.pop();}
function changeKits(){let oldBat=batKit?batKit.sig.split('-')[0]:'-',oldBowl=bowlKit?bowlKit.sig.split('-')[0]:'-';let tries=0;while(tries++<60){let r=Math.random,a=makeKit(r),b=makeKit(r);let ah=a.sig.split('-')[0],bh=b.sig.split('-')[0];if(ah===bh||ah===oldBat||bh===oldBowl)continue;let sig=a.sig+'>'+b.sig;if(kitHist.has(sig))continue;kitHist.add(sig);batKit=a;bowlKit=b;saveHist();return;}kitHist.clear();batKit=makeKit(Math.random);bowlKit=makeKit(Math.random);saveHist();}
function saveHist(){try{localStorage.setItem('iplquiz.cricket.v1',JSON.stringify({s:[...sigHist].slice(-6000),k:[...kitHist].slice(-1000)}));}catch(e){}}
function loadHist(){try{let d=JSON.parse(localStorage.getItem('iplquiz.cricket.v1'));if(d){(d.s||[]).forEach(x=>sigHist.add(x));(d.k||[]).forEach(x=>kitHist.add(x));}}catch(e){}}
function newField(){let r=mulberry32(Math.floor(Math.random()*1e9));let pool=[[848,208],[126,218],[700,178],[310,186],[560,252],[205,252],[820,252],[425,168],[640,150],[260,150]];fieldSpots=shuffle(pool.slice()).slice(0,3).map(s=>pt(s[0]+(r()*36-18),s[1]+(r()*22-11)));crowdSeed=Math.floor(r()*1e9);lightMode=Math.floor(r()*3);}
function makePlay(di,si,bh,boh,seed,forceOutcome){let rng=mulberry32(seed);let d=deliveries[di];let outcome;
 if(forceOutcome)outcome=forceOutcome;
 else if(d.kind==='yorker')outcome=rng()<.55?{type:'bowled'}:{type:'runs',runs:0,style:'dig'};
 else if(d.kind==='bouncer')outcome=rng()<.6?{type:'edge'}:{type:'runs',runs:0,style:'sway'};
 else if(si===5)outcome=rng()<.45?{type:'catch'}:{type:'runs',runs:6};
 else if(si===3)outcome=rng()<.5?{type:'runs',runs:6}:{type:'runs',runs:4};
 else{let r=rng();outcome=r<.48?{type:'runs',runs:4}:r<.68?{type:'runs',runs:2}:r<.83?{type:'runs',runs:1}:{type:'runs',runs:0,style:'defend'};}
 let speed=d.speed+Math.round(rng()*10-5);
 let px=d.kind==='yorker'?296+rng()*22:d.kind==='bouncer'?452+rng()*46:388+rng()*72;
 let py=299+rng()*4;
 let swing=(d.kind==='out'?24:d.kind==='in'?-22:d.kind==='cut'?-30:d.kind==='off'?14:d.kind==='leg'?-12:0)*(.6+rng()*.8);
 let rise=(d.kind==='bouncer'?26:8)*(.7+rng()*.6);
 let base=dest4[si],dirJ=pt(base.x+(rng()*46-23),base.y+(rng()*30-15));
 let six=null;if(outcome.type==='runs'&&outcome.runs===6&&dest6[si]){let g=dest6[si];six=lerp(g[0],g[1],rng());}
 let landing=pt(430+rng()*130,128+rng()*36); // lofted-catch target
 let mf=fieldSpots.length?fieldSpots[1+Math.floor(rng()*2)]:pt(560,252);
 let skin=['#be825c','#a06a44','#8a5533','#dba174'][Math.floor(rng()*4)];
 let number=1+Math.floor(rng()*98);
 let sig=[di,si,bh,boh,outcome.type+','+(outcome.runs||'')+(outcome.style||''),Math.round(px/14),Math.round(dirJ.x/40),Math.round(speed/6)].join('.');
 return {delivery:di,shot:si,batHand:bh,bowlHand:boh,outcome,speed,px,py,swing,rise,dirJ,six,landing,mf,skin,number,seed,sig};}
// Prefer a shot compatible with the delivery while cycling through the shot bank.
function takeShotFor(di){let pools=[[0,1,6],[2,3,7],[0,1,2,7],[1,6,7],[0,4,5,6],[0,2,4,7],[0,1,3,6],[0,1,2,5,7],[0,2,3,7],[0,1,3,5,6]],allowed=pools[di];if(!shotBag.length)shotBag.push(...shuffle(strokes.map((_,i)=>i)));let at=shotBag.findIndex(i=>allowed.includes(i)&&i!==log.at(-1)?.shot);if(at<0)at=shotBag.findIndex(i=>allowed.includes(i));return at<0?allowed[Math.floor(Math.random()*allowed.length)]:shotBag.splice(at,1)[0];}
function next(){if(ballNo===6){over++;ballNo=0;changeKits();newField();}
 let p,tries=0;do{let di=take('ball');p=makePlay(di,takeShotFor(di),Math.random()<.5?'L':'R',Math.random()<.5?'L':'R',Math.floor(Math.random()*1e9));tries++;}while(sigHist.has(p.sig)&&tries<14);
 sigHist.add(p.sig);if(ballNo===0)saveHist();play=p;ballNo++;log.push({...play,over:over+1,ball:ballNo,batKit:batKit.name,bowlKit:bowlKit.name});if(log.length>60)log.shift();}
function line(points,color,width){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
function poly(points,color){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
/* Review build: soft radial ground shadow, reads as light from above instead of a flat sticker. */
function softShadow(x,y,rx,ry){let g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(5,18,14,.52)');g.addColorStop(.65,'rgba(5,18,14,.28)');g.addColorStop(1,'rgba(5,18,14,0)');ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();}
function rect(x,y,w,h,c,r=0){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function text(s,x,y,size=15,color='#eff8ed',align='left',weight=600){ctx.font=`${weight} ${size}px Arial,sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(s,x,y);}
const bg=document.createElement('canvas');bg.width=W*CRISP;bg.height=H*CRISP;
// Lighting modes: 0 day, 1 golden hour, 2 night under floodlights. Rebuilt once per over.
function stadium(mode){baseX();let sky=mode===2?['#040d1c','#12303c']:mode===1?['#2b2a4a','#7a4a52']:['#10273a','#244d55'];
 let g=ctx.createLinearGradient(0,0,0,400);g.addColorStop(0,sky[0]);g.addColorStop(.42,sky[1]);g.addColorStop(.49,mode===2?'#2c5c40':'#427a53');g.addColorStop(1,mode===2?'#0e2c22':'#173e33');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 if(mode===1){let sg=ctx.createRadialGradient(760,120,10,760,120,220);sg.addColorStop(0,'#ffb45e88');sg.addColorStop(1,'#ffb45e00');ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);ellipse(760,120,26,26,'#ffd9a0');}
 for(let row=0;row<4;row++){rect(0,72+row*15,960,12,mode===2?'#0c1c28':row%2?'#1d3845':'#172e3a');
  let cr=mulberry32(crowdSeed+row);for(let x=4;x<960;x+=10){let n=Math.floor(cr()*7);ellipse(x,77+row*15,1.7,2,['#a6c8cc','#c8ad8d','#50748b','#779e99','#d9b8c4','#8fae6f','#c4c9a1'][n]);}}
 for(let x of [63,892]){line([pt(x,126),pt(x,25)],mode===2?'#4e6a78':'#77949e',3);rect(x-25,37,50,13,'#b6d8d9',2);
  for(let k=0;k<5;k++)rect(x-22+k*10,40,6,5,mode===2?'#ffffff':'#fff8cf',1);
  if(mode===2){for(let k=0;k<5;k++){let lg=ctx.createLinearGradient(x-22+k*10,46,x-22+k*10,300);lg.addColorStop(0,'#fffce122');lg.addColorStop(1,'#fffce100');ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(x-20+k*10,46);ctx.lineTo(x-16+k*10,46);ctx.lineTo(x-16+k*10+26,300);ctx.lineTo(x-46+k*10,300);ctx.closePath();ctx.fill();}}}
 rect(0,138,960,22,mode===2?'#0a1a20':'#122c32');for(let x=0;x<960;x+=160){text('CRICKET  •  2D',x+80,153,11,mode===2?'#4f8a7a':'#79bba6','center');}
 for(let r=0;r<6;r++){poly([pt(0,166+r*39),pt(960,161+r*39),pt(960,182+r*39),pt(0,189+r*39)],r%2?'#ffffff05':'#00000006');}
 ctx.strokeStyle=mode===2?'#9fc48a55':'#c6e3ac66';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(475,235,570,126,0,0,Math.PI*2);ctx.stroke();
 poly([pt(203,276),pt(780,276),pt(806,320),pt(178,320)],mode===2?'#a8916a':'#bea879');poly([pt(205,282),pt(780,282),pt(794,311),pt(190,311)],mode===2?'#b8a176':'#ccb98d');
 for(let x=210;x<790;x+=13){line([pt(x,285+(x%5)),pt(x+7,286+(x%5))],'#9e865a44',1);}
 for(let x of [253,718]){line([pt(x-8,278),pt(x-10,318)],'#f6f3dc',2);line([pt(x-37,318),pt(x+26,318)],'#f6f3dc',2);}
 /* Review build: atmosphere - soft haze over the far outfield, bloom around the light towers, and a gentle vignette in every lighting mode. */
 let hz=ctx.createLinearGradient(0,140,0,272);hz.addColorStop(0,mode===2?'rgba(150,190,210,.10)':'rgba(200,225,220,.11)');hz.addColorStop(1,'rgba(200,225,220,0)');ctx.fillStyle=hz;ctx.fillRect(0,140,960,132);
 if(mode!==0){ctx.save();ctx.globalCompositeOperation='lighter';for(let x of [63,892]){let bl=ctx.createRadialGradient(x,43,4,x,43,64);bl.addColorStop(0,mode===2?'rgba(255,252,225,.34)':'rgba(255,200,140,.20)');bl.addColorStop(1,'rgba(255,252,225,0)');ctx.fillStyle=bl;ctx.fillRect(x-64,0,128,140);}ctx.restore();}
 let vg=ctx.createRadialGradient(480,220,140,480,220,560);vg.addColorStop(0,'#00000000');vg.addColorStop(1,mode===2?'#00081a55':mode===1?'#1a0a2050':'#02140f42');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);}
function rebuildBG(){stadium(lightMode);bg.getContext('2d').drawImage(canvas,0,0);}
// Whole-body player drawing. The quiz, audio, history and timing stay independent.
const playerBase=new URL('cricket-players/',document.currentScript?.src||document.baseURI).href;
let playerManifest=null,playerFailure=null,assetPlay=null,assetPromise=null,humanReady=false,kitPair='',tintMs=0,playerRetryAt=0;
let sceneTime=0,scenePlay=null,fieldCall=0,nearFielders=[];
const sourcePlayers=new Map(),paintedPlayers=new Map();
const manifestPromise=fetch(playerBase+'manifest.json').then(r=>{if(!r.ok)throw Error('player manifest '+r.status);return r.json();}).then(m=>playerManifest=m);
function assetSpec(id){return id.startsWith('bat:')?playerManifest.bats[id.slice(4)]:playerManifest.roles[id];}
function shotAsset(p){if(p.outcome.type==='bowled')return 'dig';if(p.outcome.style)return p.outcome.style;if(p.outcome.type==='edge')return 'pull';return ['cover','straight','cut','pull','sweep','loft','flick','late'][p.shot];}
async function sourcePlayer(id){if(sourcePlayers.has(id))return sourcePlayers.get(id);let d=assetSpec(id),promise=new Promise((ok,no)=>{let im=new Image();im.onload=()=>ok(im);im.onerror=()=>no(Error('player image '+d.file));im.src=playerBase+d.file;});sourcePlayers.set(id,promise);try{return await promise;}catch(e){sourcePlayers.delete(id);throw e;}}
function hsvRGB(h,s,v){h=((h%360)+360)%360/60;let c=v*s,x=c*(1-Math.abs(h%2-1)),m=v-c;let a=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];return a.map(z=>(z+m)*255);}
async function paintPlayer(id,kit){let key=id+':'+kit.sig;if(paintedPlayers.has(key))return paintedPlayers.get(key);let im=await sourcePlayer(id),d=assetSpec(id),c=document.createElement('canvas');c.width=im.width;c.height=im.height;let cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(im,0,0);let data=cx.getImageData(0,0,c.width,c.height),p=data.data,h=Number((kit.c1.match(/hsl\((\d+)/)||[])[1]||220),l=Number((kit.c1.match(/ ([\d.]+)%\)/)||[])[1]||50),trim=kit.trim.match(/.{2}/g).slice(1).map(v=>parseInt(v,16));
 // Parse trim without changing skin, white pads or gloves.
 trim=[parseInt(kit.trim.slice(1,3),16),parseInt(kit.trim.slice(3,5),16),parseInt(kit.trim.slice(5,7),16)];let foot=id.startsWith('bat:')?200:165,start=performance.now();
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){let z=(y*c.width+x)*4,r=p[z],g=p[z+1],b=p[z+2];if(p[z+3]<12||b<25||b<r*1.23||b<g*1.035)continue;let mx=Math.max(r,g,b)/255,mn=Math.min(r,g,b)/255,s=(mx-mn)/Math.max(.01,mx),lx=x%d.w,ly=y%d.h,v=Math.min(1,mx*(.86+(l-50)*.01));let mark=false;if(ly>foot-100&&ly<foot-40){if(kit.pattern==='stripes')mark=lx%12<3;else if(kit.pattern==='hoops')mark=ly%14<4;else if(kit.pattern==='sash')mark=(lx+ly)%65<11;else if(kit.pattern==='panel')mark=lx%45<10;else if(kit.pattern==='gradient')v*=.7+.3*(1-(ly-(foot-100))/60);}if(mark)v*=.64;let col=hsvRGB(h,Math.min(.92,Math.max(.55,s)),v);if(ly>=foot-95&&ly<foot-93)col=trim; p[z]=col[0];p[z+1]=col[1];p[z+2]=col[2];}
 cx.putImageData(data,0,0);tintMs+=performance.now()-start;paintedPlayers.set(key,c);return c;}
async function preparePlayers(p){if(assetPlay===p&&assetPromise)return assetPromise;assetPlay=p;humanReady=false;playerFailure=null;assetPromise=(async()=>{await manifestPromise;let contact=playerManifest.bats[shotAsset(p)].contact;p.px=Math.max(p.px,contact[0]+(p.outcome.type==='bowled'?20:55));let pair=batKit.sig+'>'+bowlKit.sig;if(pair!==kitPair){kitPair=pair;paintedPlayers.clear();}let bat='bat:'+shotAsset(p),needed=['bowlerR','bowlerL','run','fielder','keeperSide','return',bat];let old=[...sourcePlayers.keys()].filter(k=>k.startsWith('bat:')&&k!==bat);while(old.length>1){let gone=old.shift();sourcePlayers.delete(gone);for(let k of [...paintedPlayers.keys()])if(k.startsWith(gone+':'))paintedPlayers.delete(k);}await Promise.all(needed.map(sourcePlayer));for(let id of needed){await paintPlayer(id,id.startsWith('bat:')?batKit:bowlKit);await new Promise(r=>setTimeout(r,0));}
 if(assetPlay===p)humanReady=true;return true;})().catch(e=>{playerFailure=String(e.message||e);playerRetryAt=performance.now()+5000;console.error(e);return false;});return assetPromise;}
function drawPlayer(id,pose,x,y,s=1,flip=false,kit=bowlKit){if(!playerManifest)return;let d=assetSpec(id),im=paintedPlayers.get(id+':'+kit.sig);if(!im)return;let j=Math.max(0,Math.min(d.n-1,Math.round(pose*d.step))),sx=(j%d.cols)*d.w,sy=Math.floor(j/d.cols)*d.h;ctx.save();ctx.translate(x,y);ctx.scale(flip?-s:s,s);ctx.drawImage(im,sx,sy,d.w,d.h,d.x,d.y,d.w,d.h);ctx.restore();}
function poseAt(t,keys){let j=0;while(j<keys.length-2&&t>keys[j+1])j++;return t>=keys.at(-1)?keys.length-1:j+ease(keys[j],keys[j+1],t);}
function batsman(t,p){if(!playerManifest)return;let id=shotAsset(p),d=playerManifest.bats[id],at=p.outcome.type==='bowled'?t-.30:t,pose=poseAt(at,d.keys);softShadow(337,311,62,9);drawPlayer('bat:'+id,pose,0,0,1,false,batKit);}
function batGeometry(t,p){let id=shotAsset(p),d=playerManifest?.bats[id],c=d?.contact||[369.5,282.5];return {hand:pt(c[0]-4,c[1]-22),tip:pt(c[0]+1,c[1]+6),contact:pt(c[0],c[1]),step:ease(3.18,3.73,t),handed:p.batHand==='L'?-1:1};}
// The front shoe reaches 70px ahead of the body in the delivery atlas.
// Stop the body behind the crease until RELEASE; follow-through starts afterward.
function bowlerState(t,p){let spin=['off','leg'].includes(deliveries[p.delivery].kind),run=clamp(t/2.1),after=ease(RELEASE,3.65,t),x=mix(spin?814:873,778,run)-after*70,y=305-(t<1.65?Math.abs(Math.sin(t*(spin?10:13)))*(spin?2:4):Math.sin(clamp((t-1.65)/.6)*Math.PI)*7),id=p.bowlHand==='L'?'bowlerL':'bowlerR',off=playerManifest?.roles[id]?.release||[-32.7163,-145.9065],scale=.90;return {x,y,hand:pt(x+off[0]*scale,y+off[1]*scale),spin,id,scale};}
function bowler(t,p){let b=bowlerState(t,p),pose=t<1.65?0:t<RELEASE?1+3*ease(1.65,RELEASE,t):4+3*ease(RELEASE,3.65,t);softShadow(b.x,311,36,7);if(t<1.65)drawPlayer('run',(t*(b.spin?5:7))%4,b.x,b.y,b.scale);else drawPlayer(b.id,pose,b.x,b.y,b.scale);}
// Fielder height follows ground depth; a player at the batter plane is full size.
function fieldScale(y){return Math.max(.38,Math.min(1.06,(y-70)/240));}
function catchTarget(p){let scale=Math.max(.38,Math.min(1.06,(p.landing.y-70)/(240-135)));return {x:p.landing.x-29*scale,y:p.landing.y+135*scale};}
function fieldTarget(p){if(p.outcome.type!=='runs'||p.outcome.runs>=4||p.outcome.style==='sway')return null;let f=p.outcome.style==='defend'?{x:408,y:319,who:0}:p.outcome.style==='dig'?{x:372,y:319,who:0}:{x:p.mf.x,y:p.mf.y,who:Math.abs(fieldSpots[1].x-p.mf.x)<1?1:2};f.scale=fieldScale(f.y);return f;}
function returnPose(t){return poseAt(t,[4.9,5.12,5.35,5.7,6.05,6.3,6.55,6.9]);}
function collectedPoint(p){let f=fieldTarget(p);if(!f)return null;let off=playerManifest?.roles.return.balls?.[0]||[7,-3],flip=f.x>670;return pt(f.x+off[0]*f.scale*(flip?-1:1),f.y+off[1]*f.scale);}
function fieldReturnBall(t,p){let f=fieldTarget(p);if(!f||t<6.05||t>6.85||!playerManifest)return null;let flip=f.x>670,off=playerManifest.roles.return.release||[35,-100],a=pt(f.x+off[0]*f.scale*(flip?-1:1),f.y+off[1]*f.scale),v=clamp((t-6.05)/.8),b=pt(165+23*.95,305-33*.95),q=lerp(a,b,v);q.y-=Math.sin(v*Math.PI)*35;return q;}
function fielder(x,y,s,k,catchU=0,keeper=false,skin='',jump=0){let t=sceneTime,p=scenePlay,call=fieldCall++;
 if(keeper){let take=p.outcome.type==='edge'||p.outcome.style==='sway',pose=take?(t<4.15?0:t<4.5?1:t<4.9?2:3):0;softShadow(165,311,34,7);drawPlayer('keeperSide',pose,165,305,.95);return;}

 let focus=ballPosition(t,p);if(!focus&&t>=RELEASE){for(let q=t-.1;q>=RELEASE&&!focus;q-=.1)focus=ballPosition(q,p);}focus=focus||bowlerState(Math.min(t,RELEASE),p).hand;let pose=0,flip=focus.x<x,target=fieldTarget(p),useReturn=false;
 if(call===0&&p.outcome.type==='catch'){let move=ease(3.8,5.1,t),f0=fieldSpots[0],dest=catchTarget(p);x=mix(f0.x,dest.x,move);y=mix(f0.y,dest.y,move);if(t<3.8)pose=0;else if(t<4.9){pose=2.5+.5*Math.sin((t-3.8)*16);flip=false;y-=Math.abs(Math.sin((t-3.8)*16))*2;}else if(t<5.05)pose=3+ease(4.9,5.05,t);else if(t<5.4)pose=4+ease(5.05,5.4,t);else pose=5+ease(5.4,5.85,t);
 }else if(target&&call===target.who){if(target.who===0){let f0=fieldSpots[0],move=ease(3.8,4.9,t);x=mix(f0.x,target.x,move);y=mix(f0.y,target.y,move);if(t>3.8&&t<4.9){pose=2.5+.5*Math.sin((t-3.8)*16);flip=target.x<f0.x;}}if(t>=4.9){useReturn=true;pose=returnPose(t);flip=target.x>670;}else if(target.who!==0){pose=ease(4.3,4.9,t);}}
 else if(p.outcome.type==='runs'&&t>CONTACT){pose=.25*ease(CONTACT,4.4,t);flip=focus.x<x;}
 s=fieldScale(y);let paint=()=>{softShadow(x,y+3,30*s,5*s);drawPlayer(useReturn?'return':'fielder',pose,x,y,s,flip);if(useReturn&&t>5.0&&t<6.05){let balls=playerManifest.roles.return.balls,j=Math.min(3,Math.floor(pose)),a=balls[j],b=balls[j+1];if(a&&b){let off=lerp(pt(...a),pt(...b),pose-j);ellipse(x+off.x*s*(flip?-1:1),y+off.y*s,3.5,3.5,'#f6f6ec');}}};if(y>305)nearFielders.push(paint);else paint();
}

// The pitch end projects from (203,276) to (178,320).
// Stump bases and seated bails follow that cross-pitch vector (-25,44).
const WICKET={x:241,base:304,height:47,radius:1.7,impact:3.98,dx:-25/44*6,dy:6};
function stumpPose(t,p,i){let u=Math.max(0,t-WICKET.impact),hit=p.outcome.type==='bowled',w=hit?Math.sin(u*22)*Math.exp(-u*5)*.045:0;return {x:WICKET.x+(i-1)*WICKET.dx,y:WICKET.base+(i-1)*WICKET.dy,angle:hit?(i===1?-1.48*ease(WICKET.impact,4.85,t):w*(i===0?1:-.7)):0};}
function bailPose(t,p,i){let u=p.outcome.type==='bowled'?Math.max(0,t-WICKET.impact):0,air=Math.min(u,.83),land=u>.83,base=WICKET.base+(i-.5)*WICKET.dy,initial=base-WICKET.height-.6;return {x:WICKET.x+(i-.5)*WICKET.dx+(i?38:-30)*air+(land?(i?1:-1)*Math.min(7,(u-.83)*8):0),y:Math.min(base-.6,initial-90*air+180*air*air),angle:Math.atan2(WICKET.dy,WICKET.dx)*(1-ease(0,.5,u))+(u===0?0:land?(i?.12:-.08):Math.sin(u*18+i*.8)*.35)};}
function woodStump(i){let h=WICKET.height,r=WICKET.radius+.35;ctx.save();ctx.beginPath();ctx.roundRect(-r,-h,r*2,h,r);ctx.clip();let g=ctx.createLinearGradient(-r,0,r,0);g.addColorStop(0,'#0b2a8a');g.addColorStop(.25,'#2456d8');g.addColorStop(.5,'#5aa2ff');g.addColorStop(.75,'#2456d8');g.addColorStop(1,'#0a2272');ctx.fillStyle=g;ctx.fillRect(-r,-h,r*2,h);
 for(let y of [-h*.62,-h*.5]){ctx.fillStyle='#f4f8ff';ctx.fillRect(-r,y-.9,r*2,1.8);ctx.fillStyle='#9db6e8';ctx.fillRect(-r,y+.7,r*2,.35);}
 ctx.fillStyle='#f4f8ff';ctx.fillRect(-r,-h+1.2,r*2,2.2);ctx.fillStyle='#0a1d66';ctx.fillRect(-r,-2.2,r*2,2.2);
 ctx.restore();ellipse(0,-h+.3,r,.7,'#dbe8ff');}
function woodBail(){let g=ctx.createLinearGradient(0,-.9,0,.9);g.addColorStop(0,'#6a8cff');g.addColorStop(.5,'#2f56d6');g.addColorStop(1,'#14308f');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(-3.3,-.75,6.6,1.5,.7);ctx.fill();ctx.fillStyle='#f4f8ff';for(let x of [-2.6,2.2])ctx.fillRect(x,-.78,.5,1.56);}
function wicket(t,p){for(let i=0;i<3;i++){let s=stumpPose(t,p,i);ellipse(s.x,s.y+2,3.3,1,'#132d2555');ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle);woodStump(i);ctx.restore();}for(let i=0;i<2;i++){let b=bailPose(t,p,i);ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);woodBail();ctx.restore();}}

// Shot energy changes travel, lift and bounce without moving a receiving player's hands.
function shotMotion(p){let o=p.outcome,power=[.82,.9,.72,.96,.66,1,.77,.56][p.shot];power*=.94+((p.seed>>>0)%101)/100*.12;
 if(o.style==='defend')power=.14;if(o.style==='dig')power=.25;if(o.runs===1)power*=.48;if(o.runs===2)power*=.66;
 if(o.type==='edge')power=.3;if(o.type==='catch')power=.84;
 power=clamp(power);let aerial=o.runs===6||o.type==='catch';
 return {power,aerial,duration:o.runs===6?2.15-power*.55:o.runs===4?2.35-power*.95:1.15,lift:aerial?75+power*60:4+power*15,bounces:2+Math.round(power*2)};}
function groundProgress(v,power){let a=.35+.6*power;return (v-a*v*v/2)/(1-a/2);}
function ballPosition(t,p){let d=deliveries[p.delivery],rel=bowlerState(RELEASE,p).hand,end=batGeometry(CONTACT,p).contact,bounce=pt(p.px,p.py);
 if(p.outcome.type==='bowled')end=pt(278,294);if(p.outcome.style==='sway')end=pt(322,178);
 if(t<RELEASE)return null;
 if(d.kind==='toss'){if(t<CONTACT){let u=clamp((t-RELEASE)/(CONTACT-RELEASE));let v=lerp(rel,end,u);v.y-=Math.sin(u*Math.PI)*13;return v;}}
 else{if(t<3.17){let u=clamp((t-RELEASE)/.92);let v=lerp(rel,bounce,u);v.y-=Math.sin(u*Math.PI)*(d.kind==='off'||d.kind==='leg'?35:7);v.x+=Math.sin(u*Math.PI)*p.swing;return v;}
  if(t<CONTACT){let u=clamp((t-3.17)/.58),v=lerp(bounce,end,u);v.y-=Math.sin(u*Math.PI)*p.rise;return v;}}
 let u=t-CONTACT,m=shotMotion(p);let returning=fieldReturnBall(t,p);if(returning)return returning;
 if(p.outcome.type==='bowled'){if(u>.23)return null;return lerp(end,pt(241,278),clamp(u/.23));}
 if(p.outcome.type==='edge'||p.outcome.style==='sway'){if(t>4.73)return null;let v=clamp(u/.92),q=lerp(end,pt(165+36*.95,305-145*.95),v);q.y-=Math.sin(v*Math.PI)*45;return q;}
 if(p.outcome.type==='catch'){if(t>5.46)return null;let v=clamp(u/1.65),q=lerp(end,p.landing,v);q.y-=4*v*(1-v)*m.lift;return q;}
 if(p.outcome.type==='runs'){
  let r=p.outcome.runs;
  if(p.outcome.style==='sway'||p.outcome.style==='dig'||p.outcome.style==='defend'){
   let dest=collectedPoint(p)||pt(408,312);
   if(t>5.0)return null;let v=clamp(u/1.15),q=lerp(end,dest,groundProgress(v,m.power));if(p.outcome.style!=='sway')q.y-=Math.abs(Math.sin(v*Math.PI*m.bounces))*(3+m.power*13)*(1-v)**1.6;return q;}
  if(r===6){let dest=p.six||p.dirJ;if(u>m.duration+.12)return null;let v=clamp(u/m.duration),q=lerp(end,dest,v);q.y-=4*v*(1-v)*m.lift;return q;}
  if(r===4){if(u>m.duration+.12)return null;let v=clamp(u/m.duration),q=lerp(end,p.dirJ,groundProgress(v,m.power));q.y-=Math.abs(Math.sin(v*Math.PI*m.bounces))*m.lift*(1-v)**1.5;return q;}
  let dest=collectedPoint(p)||pt(p.mf.x+4,p.mf.y-7);if(t>5.0)return null;let v=clamp(u/1.15),q=lerp(end,dest,groundProgress(v,m.power));q.y-=Math.abs(Math.sin(v*Math.PI*m.bounces))*m.lift*(1-v)**1.5;return q;}
 return null;}
function camAt(t,p){ // fixed broadcast frame: no cuts, pans, zooms or shake. The pitch and
 // stadium stay still; only the players and the ball move. Identity transform, so the
 // action layer lines up exactly with the painted pitch and creases.
 return {cx:480,cy:200,z:1};}
function trail(t,p){let pts=[];for(let k=8;k>0;k--){let q=ballPosition(t-k*.035,p);if(q)pts.push(q);}return pts;}
function crowdJump(t,p,on){if(!on)return;let r=mulberry32(crowdSeed+7);let j=Math.sin((t-4.6)*9)*3;
 for(let i=0;i<16;i++){let x=30+r()*900,y=74+Math.floor(r()*4)*15;ellipse(x,y-Math.abs(j)*(1+r()),2.4,2.6,['#ffd54d','#f4e4bd','#ff9e7d'][Math.floor(r()*3)]);}}
function dust(t,p){let d=deliveries[p.delivery];if(d.kind==='toss')return;let u=ease(3.08,3.55,t);if(u<=0||u>=1)return;for(let i=0;i<3;i++){ellipse(p.px+8+i*6,p.py+2,4+u*10,2.4+u*4,`rgba(196,175,130,${(1-u)*.4})`);}}
// Announce outcomes only once the visible ball reaches the corresponding event.
function outcomeTime(p){let o=p.outcome;if(o.type==='bowled')return WICKET.impact;if(o.type==='edge'||o.style==='sway')return 4.73;if(o.type==='catch')return CONTACT+1.65;if(o.runs>=4)return CONTACT+shotMotion(p).duration;return o.runs===0?4.95:6.85;}
function caption(t,p){let d=deliveries[p.delivery],shot=p.outcome.type==='bowled'?'Yorker beats the bat':p.outcome.type==='edge'?'Hook / top edge':p.outcome.style==='sway'?'Sways away':p.outcome.style==='dig'?'Dug out':p.outcome.style==='defend'?'Solid defence':strokes[p.shot];
 // Withhold all delivery information until the ball reaches the batting end.
 if(t<=CONTACT)return `${p.batHand==='L'?'LEFT':'RIGHT'}-HAND BAT  /  ${p.bowlHand==='L'?'LEFT':'RIGHT'}-ARM BOWLER`;
 let detail=`  /  ${d.name.toUpperCase()}  /  ${p.speed} KM/H`;
 if(t<outcomeTime(p))return shot.toUpperCase()+detail;
 let o=p.outcome,result=o.type==='bowled'?'BOWLED!':o.type==='edge'?'CAUGHT BEHIND!':o.type==='catch'?'CAUGHT IN THE DEEP!':o.runs===6?'SIX!':o.runs===4?'FOUR!':o.runs===2?'TWO RUNS':o.runs===1?'SINGLE':'DOT BALL';return result+detail;}
function rgbFx(t,p){ // Zing-style LED wickets that ignite on the real stump/bail geometry; RGB rope chase on boundaries.
 let hue=x=>`hsl(${x%360} 100% 62%)`;
 if(p.outcome.type==='bowled'&&t>WICKET.impact&&t<5.6){let u=t-WICKET.impact,fade=Math.min(1,(5.6-t)/.3),pulse=.65+.35*Math.sin(t*28)**2;
  for(let i=0;i<3;i++){let q=stumpPose(t,p,i),h=t*420+i*70;ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.angle);ctx.save();ctx.globalAlpha=fade*pulse*.64;ctx.shadowColor=hue(h);ctx.shadowBlur=3;line([pt(0,-1),pt(0,-WICKET.height+1.7)],hue(h),.65);ctx.restore();for(let k=0;k<6;k++)ellipse(0,-4-k*7.1,.42,.48,`hsla(${(h+k*38)%360} 100% 72% / ${.7*fade})`);ctx.restore();}
  for(let i=0;i<2;i++){let q=bailPose(t,p,i),h=t*420+140+i*120;ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.angle);ctx.globalAlpha=fade*pulse*.7;ctx.shadowColor=hue(h);ctx.shadowBlur=2;line([pt(-2.6,0),pt(2.6,0)],hue(h),.45);ctx.restore();}}
 if(p.outcome.type==='runs'&&p.outcome.runs>=4&&t>outcomeTime(p)&&t<6.95){let u=(t-outcomeTime(p))/(6.95-outcomeTime(p)),fade=u<0.08?u/0.08:u>0.86?1-(u-0.86)/0.14:1;
  for(let i=0;i<72;i++){let a=i/72*Math.PI*2,x=475+Math.cos(a)*570,y=235+Math.sin(a)*126;
   let chase=(i*5-t*260),h=((chase%360)+360)%360,tw=Math.sin(t*16-i*0.55);
   if(tw>-0.2){ellipse(x,y,2.3,2.3,`hsla(${h} 100% 60% / ${0.95*fade})`);ellipse(x,y,4.4,4.4,`hsla(${h} 100% 62% / ${0.22*fade})`);}}}}
function motionTrail(t,p){let q=ballPosition(t,p);if(!q)return;let post=t>CONTACT&&t<6.05,m=shotMotion(p),span=post?.045+m.power*.09:.075,previous=null;
 for(let k=10;k>=0;k--){let tt=t-k*span/10;if(post&&tt<=CONTACT){previous=null;continue;}let at=ballPosition(tt,p);if(!at){previous=null;continue;}if(previous){let a=(1-k/11)*.42;line([previous,at],`rgba(245,248,225,${a})`,1.2+(1-k/11)*2.4);}previous=at;}}
// A short ember for a soft touch, a longer hot tail for a powerful stroke.
function shotFire(t,p){let o=p.outcome;if(t<=CONTACT||o.type==='bowled'||o.style==='sway'||t>=4.9&&o.type==='runs'&&o.runs<4)return;
 let ball=ballPosition(t,p);if(!ball)return;let power=shotMotion(p).power,span=.035+power*.19,n=16;
 for(let k=n;k>0;k--){let tt=t-k*span/n;if(tt<=CONTACT)continue;let q=ballPosition(tt,p);if(!q)continue;let age=k/n,fade=(1-age)**.7,flicker=1+Math.sin(t*58+k*2.1)*.12,r=(1.8+power*4.5)*fade*flicker;
  ctx.save();ctx.globalCompositeOperation='lighter';ellipse(q.x,q.y,r*1.8,r*1.8,`rgba(255,63,4,${fade*(.09+power*.1)})`);ellipse(q.x,q.y,r,r,`rgba(255,${Math.round(75+130*fade)},12,${fade*.72})`);if(age<.55)ellipse(q.x,q.y,r*.45,r*.45,`rgba(255,246,158,${fade*.75})`);ctx.restore();
 }
 let hot=2.5+power*5;ellipse(ball.x,ball.y,hot*1.7,hot*1.7,`rgba(255,116,12,${.12+power*.13})`);
}
function render(t,p=play){sceneTime=t;scenePlay=p;fieldCall=0;nearFielders=[];ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(bg,0,0);baseX();ctx.save();if(p.batHand==='L'){ctx.translate(W,0);ctx.scale(-1,1);}
 let c=camAt(t,p);ctx.translate(W/2,H/2);ctx.scale(c.z,c.z);ctx.translate(-c.cx,-c.cy);
 let catchU=p.outcome.type==='catch'?ease(4.3,5.4,t):0,jumpU=p.outcome.type==='catch'?Math.sin(clamp((t-4.5)/.9)*Math.PI)*10:0;
 let f0=fieldSpots[0]||pt(480,222),fx=mix(f0.x,p.landing.x,ease(3.8,5.4,t)),fy=mix(f0.y,p.landing.y+60,ease(3.8,5.4,t));
 fielder(fx,fy,.68,bowlKit,catchU,false,'#a06a44',jumpU);
 fielder((fieldSpots[1]||pt(848,210)).x,(fieldSpots[1]||pt(848,210)).y,.55,bowlKit);
 fielder((fieldSpots[2]||pt(126,218)).x,(fieldSpots[2]||pt(126,218)).y,.56,bowlKit);
 wicket(t,p);
 let edgeU=p.outcome.type==='edge'?ease(3.9,4.67,t):0;
 fielder(165+edgeU*8,305,.95,bowlKit,edgeU,true,'#8a5533',edgeU*6);
 dust(t,p);batsman(t,p);bowler(t,p);nearFielders.forEach(paint=>paint());
 motionTrail(t,p);shotFire(t,p);
 let ball=ballPosition(t,p);if(ball){ellipse(ball.x+1,Math.max(308,ball.y+7),5,1.8,'#153b3433');
  ctx.save();ctx.globalCompositeOperation='lighter';ellipse(ball.x,ball.y,7.5,7.5,'rgba(255,255,235,.16)');ctx.restore();
  ellipse(ball.x,ball.y,4.5,4.5,'#ffffff');let spin=t*(t>CONTACT?15+shotMotion(p).power*40:30),dx=Math.cos(spin)*2.7,dy=Math.sin(spin)*2.7;line([pt(ball.x-dx,ball.y-dy),pt(ball.x+dx,ball.y+dy)],'#d57565',1);}
 crowdJump(t,p,t>outcomeTime(p)&&(p.outcome.type!=='runs'||p.outcome.runs>=4));
 rgbFx(t,p);
 ctx.restore();
 rect(15,12,930,42,'#071e2de8',9);rect(26,21,7,24,batKit.c1,2);text(`${batKit.name} BAT`,43,39,17);text('v',193,38,14,'#85a29e');rect(214,21,7,24,bowlKit.c1,2);text(`${bowlKit.name} BOWL`,231,39,17);text(`OVER ${over+1}  •  ${ballNo}/6`,590,39,17,'#ffe3a1');text('2D ACTION',922,39,13,'#9cbab5','right');
 rect(15,350,930,37,'#071e2de8',8);text(caption(t,p),31,374,17,t>4.8?'#ffe0a1':'#eef5e5');for(let i=0;i<6;i++){ellipse(815+i*21,368,5,5,i<ballNo?batKit.c1:'#4a6468');}
 if(t>6.25&&ballNo===6){rect(240,118,480,60,'#092332ed',12);text(`OVER ${over+1} COMPLETE • NEW KITS NEXT OVER`,480,153,18,'#ffe3a1','center');}}
function playable(){return !document.hidden&&!reduce.matches&&document.getElementById('start').style.display==='none'&&document.getElementById('end').style.display!=='flex';}
function frame(now){raf=0;if(manual||!playable()){last=0;return;}if(playerFailure&&performance.now()>playerRetryAt)assetPlay=null;if(assetPlay!==play)preparePlayers(play);if(!humanReady){last=0;raf=requestAnimationFrame(frame);return;}if(last)elapsed+=Math.min((now-last)/1000,.1);last=now;if(elapsed>=DURATION){elapsed-=DURATION;next();}render(elapsed);raf=requestAnimationFrame(frame);}
function update(){if(playable()&&!manual){if(!raf){last=0;raf=requestAnimationFrame(frame);}}else{if(raf)cancelAnimationFrame(raf);raf=0;last=0;}}
loadHist();changeKits();newField();next();rebuildBG();render(0);preparePlayers(play).then(ok=>{if(ok)render(0);});
// Rebuild the stadium backdrop whenever a new over brings fresh lighting.
document.getElementById('go').addEventListener('click',update);document.addEventListener('visibilitychange',update);reduce.addEventListener('change',update);let watch=new MutationObserver(update);['start','end'].forEach(id=>watch.observe(document.getElementById(id),{attributes:true,attributeFilter:['style']}));
if(new URLSearchParams(location.search).get('debug')==='1')window.cricket2D={wicketDetail:(t)=>{manual=true;update();ctx.fillStyle='#304837';ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(-940,-1317);ctx.scale(5.5,5.5);wicket(t,play);rgbFx(t,play);ctx.restore();},ready:()=>preparePlayers(play),human:()=>({ready:humanReady,failure:playerFailure,shot:shotAsset(play),sources:[...sourcePlayers.keys()],painted:paintedPlayers.size,tintMs,manifest:playerManifest}),setKits:(a,b)=>{batKit=a;bowlKit=b;assetPlay=null;return preparePlayers(play);},inspect:()=>({elapsed,over:over+1,ball:ballNo,batKit:batKit.name,bowlKit:bowlKit.name,lightMode,play:{...play},log:log.slice(),running:!!raf,reduced:reduce.matches,sigCount:sigHist.size,kitCount:kitHist.size}),
 sample:(di,si,bh,boh,t,o=0,n=0,force=null,seed=1234)=>{manual=true;update();over=o;ballNo=n||di%6+1;if(!batKit)changeKits();if(!fieldSpots.length)newField();play=makePlay(di,si,bh,boh,seed,force);preparePlayers(play);rebuildBG();render(t);return {play,ball:ballPosition(t,play),bat:batGeometry(t,play),cam:camAt(t,play)};},
 advance:()=>{manual=true;update();let before=over;next();if(over!==before)rebuildBG();render(0);return window.cricket2D.inspect();},
 resume:()=>{manual=false;elapsed=0;update();},light:(m)=>{lightMode=m;rebuildBG();render(0);return m;},
 step:(t)=>{manual=true;update();render(t);return {ball:ballPosition(t,play),motion:shotMotion(play),outcomeAt:outcomeTime(play)};}};
// Live loop must rebuild the stadium when the over turns over.
(function(){let innerNext=next;next=function(){let before=over;innerNext();preparePlayers(play);if(over!==before)rebuildBG();};})();
})();
