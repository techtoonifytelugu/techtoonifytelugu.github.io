/* Original silent cinematic 2D cricket. Independent of quiz state, audio and saved history.
   Every ball is generated from a fresh random seed: delivery, stroke, hands, speed, pitch
   spot, swing, shot direction, player cosmetics and field placing all vary, and exact play
   signatures plus kit pairings are tracked so they do not repeat within the session. */
(function(){
'use strict';
const canvas=document.getElementById('cricket-action'); if(!canvas)return;
const ctx=canvas.getContext('2d',{alpha:false});
const W=960,H=400,DURATION=7,CONTACT=3.75,RELEASE=2.25;
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
function next(){if(ballNo===6){over++;ballNo=0;changeKits();newField();}
 let p,tries=0;do{p=makePlay(take('ball'),take('shot'),Math.random()<.5?'L':'R',Math.random()<.5?'L':'R',Math.floor(Math.random()*1e9));tries++;}while(sigHist.has(p.sig)&&tries<14);
 sigHist.add(p.sig);if(ballNo===0)saveHist();play=p;ballNo++;log.push({...play,over:over+1,ball:ballNo,batKit:batKit.name,bowlKit:bowlKit.name});if(log.length>60)log.shift();}
function line(points,color,width){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
function poly(points,color){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function rect(x,y,w,h,c,r=0){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function text(s,x,y,size=15,color='#eff8ed',align='left',weight=600){ctx.font=`${weight} ${size}px Arial,sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(s,x,y);}
const bg=document.createElement('canvas');bg.width=W;bg.height=H;
// Lighting modes: 0 day, 1 golden hour, 2 night under floodlights. Rebuilt once per over.
function stadium(mode){let sky=mode===2?['#040d1c','#12303c']:mode===1?['#2b2a4a','#7a4a52']:['#10273a','#244d55'];
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
 if(mode!==0){let vg=ctx.createRadialGradient(480,220,140,480,220,560);vg.addColorStop(0,'#00000000');vg.addColorStop(1,mode===2?'#00081a55':'#1a0a2050');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);}}
function rebuildBG(){stadium(lightMode);bg.getContext('2d').drawImage(canvas,0,0);}
function limb(a,b,c,col,w){line([a,b,c],'#10292e',w+3);line([a,b,c],col,w);}
function head(x,y,helmet,kit,face=1,skin='#be825c'){ellipse(x,y,10,12,skin);ellipse(x-3,y+2,3,5,'#dba174');poly([pt(x+face*7,y-3),pt(x+face*14,y+1),pt(x+face*8,y+4)],skin);
 if(helmet){ellipse(x,y-5,12,10,kit.c2);rect(x-12,y-7,24,8,kit.c2,2);line([pt(x+face*8,y-4),pt(x+face*17,y-4)],'#cad8dc',2);line([pt(x+face*14,y-3),pt(x+face*13,y+9),pt(x+face*5,y+11)],'#dbe5df',1.3);line([pt(x+face*6,y+4),pt(x+face*14,y+4)],'#dbe5df',1);}else{ellipse(x,y-8,10,5,'#1d242a');}ellipse(x+face*7,y-2,1.2,1.2,'#172528');}
function torso(x,y,lean,kit,back=false,number=17){let shoulder=pt(x+lean,y-87),hip=pt(x,y-49);
 let body=[pt(shoulder.x-16,shoulder.y),pt(shoulder.x+14,shoulder.y+1),pt(hip.x+13,hip.y),pt(hip.x-12,hip.y)];
 poly(body,kit.c1);ctx.save();ctx.beginPath();ctx.moveTo(body[0].x,body[0].y);body.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.clip();
 if(kit.pattern==='stripes'){for(let i=-14;i<16;i+=8)rect(shoulder.x+i,shoulder.y,4,40,kit.c2);}
 else if(kit.pattern==='hoops'){for(let i=0;i<4;i++)rect(shoulder.x-18,shoulder.y+4+i*11,34,5,kit.c2);}
 else if(kit.pattern==='sash'){poly([pt(shoulder.x-16,shoulder.y),pt(shoulder.x-5,shoulder.y),pt(hip.x+13,hip.y),pt(hip.x+2,hip.y)],kit.c2);}
 else if(kit.pattern==='gradient'){let g=ctx.createLinearGradient(0,shoulder.y,0,hip.y);g.addColorStop(0,kit.c1);g.addColorStop(1,kit.c2);ctx.fillStyle=g;ctx.fillRect(shoulder.x-18,shoulder.y,36,hip.y-shoulder.y+2);}
 else if(kit.pattern==='panel'){rect(shoulder.x-18,shoulder.y,11,42,kit.c2);rect(shoulder.x+9,shoulder.y,11,42,kit.c2);}
 rect(shoulder.x-18,shoulder.y,36,3,kit.trim);ctx.restore();
 line([pt(shoulder.x+10,shoulder.y+8),pt(hip.x+8,hip.y-6)],'#ffffff50',2);poly([pt(shoulder.x-6,shoulder.y),pt(shoulder.x,shoulder.y+7),pt(shoulder.x+6,shoulder.y)],'#e8e2c7');
 text(back?String(number):'•',shoulder.x,shoulder.y+23,back?12:10,'#fff2ce','center');return {s:shoulder,h:hip};}
function shoe(x,y){rect(x-8,y-4,20,7,'#e8ece0',3);rect(x-8,y+2,20,2,'#153335',1);}
function pad(a,b){line([a,b],'#d8e1d3',13);line([pt(a.x-3,a.y),pt(b.x-3,b.y-3)],'#f7f8e9',3);line([pt(a.x+3,a.y),pt(b.x+3,b.y-3)],'#a2b5ad',1);}
function batGeometry(t,p){let sh=p.shot,st=p.outcome.style||'';
 if(st==='sway'){let a=-2.35+Math.sin(t*3)*.05,step=ease(3.1,3.7,t),hand=pt(268,208);let tip=pt(hand.x+Math.cos(a)*59,hand.y+Math.sin(a)*59);return {hand,tip,a,step,sweep:0,handed:p.batHand==='L'?-1:1,duck:step};}
 if(st==='dig'||st==='defend'){let a=t<CONTACT?mix(-1.9,1.75,ease(3.35,CONTACT,t)):mix(1.75,1.95,ease(CONTACT,4.3,t)),step=ease(3.18,3.73,t),hand=pt(278+step*9,243);let tip=pt(hand.x+Math.cos(a)*59,hand.y+Math.sin(a)*59);return {hand,tip,a,step,sweep:0,handed:p.batHand==='L'?-1:1,duck:0};}
 let angles=[1.35,1.55,.1,-.55,1.7,.7,1.2,.35];
 let contactAngle=p.outcome.type==='edge'?-.65:angles[sh];
 let idle=-1.9+Math.sin(t*3.1)*.05;
 let a=t<CONTACT?mix(idle,contactAngle,ease(3.35,CONTACT,t)):mix(contactAngle,contactAngle+1.65,ease(CONTACT,4.45,t));
 if(p.outcome.type==='bowled')a=mix(idle,-.6,ease(3.65,4.4,t));
 let handed=p.batHand==='L'?-1:1,step=ease(3.18,3.73,t),sweep=sh===4?step:0;
 let hand=pt(278+step*9,239+sweep*15+(handed<0?5:0));
 let length=59,tip=pt(hand.x+Math.cos(a)*length,hand.y+Math.sin(a)*length);
 return {hand,tip,a,step,sweep,handed,duck:0};}
function batsman(t,p){let b=batGeometry(t,p),k=batKit,x=270+b.step*3,y=305+b.duck*22;
 ellipse(x,305+4,39,6,'#102d2855');let hip=pt(x,y-49+b.sweep*11),front=pt(x+22+b.step*13,y-2),back=pt(x-14,y-2),knee=pt(x+12+b.step*10,y-25+b.sweep*10);
 limb(pt(hip.x-7,hip.y),pt(x-17,y-28),back,k.c2,13);limb(pt(hip.x+5,hip.y),knee,front,k.c1,14);pad(pt(x-17,y-27),pt(back.x,back.y-6));pad(knee,pt(front.x,front.y-6));shoe(back.x,back.y);shoe(front.x,front.y);
 let lean=6+b.step*9+(b.handed<0?-7:0),body=torso(x,y+b.sweep*11,lean,k,b.handed<0,p.number);head(body.s.x+3,y-105+b.sweep*10,true,k,1,p.skin);
 let s1=pt(body.s.x-9,body.s.y+8),s2=pt(body.s.x+11,body.s.y+8);let e1=pt(mix(s1.x,b.hand.x,.5)-b.handed*14,mix(s1.y,b.hand.y,.5)+12),e2=pt(mix(s2.x,b.hand.x,.5)+b.handed*11,mix(s2.y,b.hand.y,.5)-6);
 limb(s1,e1,b.hand,k.c1,9);limb(s2,e2,pt(b.hand.x+4,b.hand.y+1),k.c1,9);ellipse(b.hand.x,b.hand.y,6,5,'#edf4e7');
 let handle=lerp(b.hand,b.tip,.2);line([b.hand,handle],'#263e41',5);line([handle,b.tip],'#5b422b',12);line([handle,b.tip],'#ebd6a7',9);line([lerp(handle,b.tip,.25),lerp(handle,b.tip,.65)],'#ac5748',4);}
function bowlerState(t,p){let spin=['off','leg'].includes(deliveries[p.delivery].kind),run=clamp(t/2.1),x=mix(873,708,run);
 let hop=t>1.7&&t<2.2?Math.sin((t-1.7)/.5*Math.PI)*11:0,y=305-hop;
 let after=t>RELEASE?ease(RELEASE,3.4,t):0;x-=after*38;
 let phase=t*15,amp=spin?10:19;
 let arm= t<1.8?Math.sin(phase)*.75:mix(.8,-3.8,ease(1.8,2.65,t));
 if(t>2.65)arm=mix(-3.8,-5.6,ease(2.65,3.5,t)); // follow-through sweep past the hip
 let sgn=p.bowlHand==='L'?-1:1,hand=pt(x+sgn*Math.sin(arm)*(spin?43:52),y-84-Math.cos(arm)*(spin?47:52));
 return {x,y,arm,hand,phase,amp,spin};}
function bowler(t,p){let b=bowlerState(t,p),x=b.x,y=b.y,k=bowlKit,run=t<2.2?1:1-ease(2.2,3.4,t),sgn=p.bowlHand==='L'?-1:1;
 ellipse(x,305+5,29,5,'#102d2855');let stride=Math.sin(b.phase)*b.amp*run;let foot1=pt(x+stride,y),foot2=pt(x-stride,y-3);
 limb(pt(x-5,y-49),pt(x-8-stride*.3,y-26),foot1,k.c2,12);limb(pt(x+5,y-49),pt(x+8+stride*.3,y-28),foot2,k.c1,12);shoe(foot1.x,foot1.y);shoe(foot2.x,foot2.y);
 let lean=-6-(t>RELEASE?ease(RELEASE,3.2,t)*14:0),body=torso(x,y,lean,k,true,p.number+7>99?p.number-9:p.number+7);head(body.s.x-2,y-106,false,k,-1,p.skin);
 let a=pt(x+sgn*9,y-83),el=pt((a.x+b.hand.x)/2+sgn*8,(a.y+b.hand.y)/2);limb(a,el,b.hand,k.c1,9);ellipse(b.hand.x,b.hand.y,4,4,p.skin);let other=pt(x-sgn*12,y-82);limb(other,pt(x-19,y-59),pt(x-32,y-79),k.c1,9);
 if(t<RELEASE)ellipse(b.hand.x,b.hand.y,4,4,'#f7fbeb');}
function fielder(x,y,s,k,catchU=0,keeper=false,skin='#be825c',jump=0){ctx.save();ctx.translate(x,y-jump);ctx.scale(s,s);let crouch=keeper?12*(1-catchU):0;
 ellipse(0,5,25,5,'#102d2855');limb(pt(-6,-45+crouch),pt(-17,-24),pt(-21,0),k.c2,11);limb(pt(6,-45+crouch),pt(17,-24),pt(22,0),k.c1,11);shoe(-21,0);shoe(22,0);let body=torso(0,crouch,0,k);head(0,-105+crouch,keeper,k,1,skin);
 let handY=mix(-54,-116,catchU),hx=mix(24,5,catchU);limb(pt(-12,-79+crouch),pt(-28,-61),pt(hx-10,handY),k.c1,8);limb(pt(12,-79+crouch),pt(29,-67),pt(hx,handY),k.c1,8);ellipse(hx-8,handY,7,6,'#e6edda');ellipse(hx+2,handY,7,6,'#e6edda');ctx.restore();}
function wicket(t,p){let broken=p.outcome.type==='bowled'?ease(3.94,4.55,t):0;for(let i=0;i<3;i++){ctx.save();ctx.translate(236+i*5,304);ctx.rotate(broken*(i-1.2)*1.4);line([pt(0,0),pt(0,-40)],'#e4d8a4',3);ctx.restore();}for(let i=0;i<2;i++){let x=236+i*6+broken*(i?35:-25),y=263-broken*30+broken*broken*44;line([pt(x,y),pt(x+6,y-broken*10)],'#f5e9c5',3);}}
function ballPosition(t,p){let d=deliveries[p.delivery],rel=bowlerState(RELEASE,p).hand,end=lerp(batGeometry(CONTACT,p).hand,batGeometry(CONTACT,p).tip,.78),bounce=pt(p.px,p.py);
 if(p.outcome.type==='bowled')end=pt(278,294);
 if(t<RELEASE)return null;
 if(d.kind==='toss'){if(t<CONTACT){let u=clamp((t-RELEASE)/(CONTACT-RELEASE));let v=lerp(rel,end,u);v.y-=Math.sin(u*Math.PI)*13;return v;}}
 else{if(t<3.17){let u=clamp((t-RELEASE)/.92);let v=lerp(rel,bounce,u);v.y-=Math.sin(u*Math.PI)*(d.kind==='off'||d.kind==='leg'?35:7);v.x+=Math.sin(u*Math.PI)*p.swing;return v;}
  if(t<CONTACT){let u=clamp((t-3.17)/.58),v=lerp(bounce,end,u);v.y-=Math.sin(u*Math.PI)*p.rise;return v;}}
 let u=t-CONTACT;
 if(p.outcome.type==='bowled'){if(u>.23)return null;return lerp(end,pt(241,278),clamp(u/.23));}
 if(p.outcome.type==='edge'){let v=clamp(u/.92),q=lerp(end,pt(165,195),v);q.y-=Math.sin(v*Math.PI)*45;return q;}
 if(p.outcome.type==='catch'){let v=clamp(u/1.65),q=lerp(end,p.landing,v);q.y-=Math.sin(v*Math.PI)*112;return q;}
 if(p.outcome.type==='runs'){
  let r=p.outcome.runs;
  if(p.outcome.style==='sway'||p.outcome.style==='dig'||p.outcome.style==='defend'){
   let dest=p.outcome.style==='sway'?pt(165,296):p.outcome.style==='dig'?pt(372,318):pt(408,312);
   if(u>1.1)return null;let v=clamp(u/1.0),q=lerp(end,dest,v);if(p.outcome.style!=='sway')q.y-=Math.abs(Math.sin(v*Math.PI*2))*6*(1-v);return q;}
  if(r===6){let dest=p.six||p.dirJ;if(u>2.15)return null;let v=clamp(u/1.9),q=lerp(end,dest,v);q.y-=Math.sin(v*Math.PI)*100;return q;}
  if(r===4){if(u>2.05)return null;let v=clamp(u/1.8),q=lerp(end,p.dirJ,v);q.y-=Math.abs(Math.sin(v*Math.PI*3))*13*(1-v);return q;}
  let dest=pt(p.mf.x,p.mf.y+8);if(u>1.35)return null;let v=clamp(u/1.2),q=lerp(end,dest,v);q.y-=Math.abs(Math.sin(v*Math.PI*2))*9*(1-v);return q;}
 return null;}
function camAt(t,p){let c; // cut-based coverage: bowler closeup, batsman closeup, contact punch, wide for the flight
 if(t<RELEASE){let u=ease(0,RELEASE,t);c={cx:mix(760,600,u),cy:mix(248,262,u),z:mix(1.22,1.1,u)};}
 else if(t<CONTACT){let u=ease(RELEASE,CONTACT,t);c={cx:mix(600,330,u),cy:mix(262,258,u),z:mix(1.1,1.18,u)};}
 else{let u=t-CONTACT,punch=1.18+ease(0,.3,u)*.12,out=ease(.5,1.5,u);
  c={cx:mix(315,480,out),cy:mix(258,235,out),z:mix(punch,1,out)};}
 if(t>5.55){let u=ease(5.55,6.7,t);c.cx=mix(c.cx,480,u);c.cy=mix(c.cy,235,u);c.z=mix(c.z,1,u);}
 let big=p.outcome.type==='bowled'||p.outcome.type==='edge'||p.outcome.type==='catch'||(p.outcome.type==='runs'&&p.outcome.runs===6);
 let imp=big&&t>CONTACT?Math.max(0,1-(t-CONTACT)*1.7):0;
 if(imp>0){c.cx+=Math.sin(t*63)*4*imp;c.cy+=Math.cos(t*71)*3*imp;}
 return c;}
function trail(t,p){let pts=[];for(let k=8;k>0;k--){let q=ballPosition(t-k*.035,p);if(q)pts.push(q);}return pts;}
function crowdJump(t,p,on){if(!on)return;let r=mulberry32(crowdSeed+7);let j=Math.sin((t-4.6)*9)*3;
 for(let i=0;i<16;i++){let x=30+r()*900,y=74+Math.floor(r()*4)*15;ellipse(x,y-Math.abs(j)*(1+r()),2.4,2.6,['#ffd54d','#f4e4bd','#ff9e7d'][Math.floor(r()*3)]);}}
function dust(t,p){let d=deliveries[p.delivery];if(d.kind==='toss')return;let u=ease(3.08,3.55,t);if(u<=0||u>=1)return;for(let i=0;i<3;i++){ellipse(p.px+8+i*6,p.py+2,4+u*10,2.4+u*4,`rgba(196,175,130,${(1-u)*.4})`);}}
function caption(t,p){let d=deliveries[p.delivery],shot=p.outcome.type==='bowled'?'Yorker beats the bat':p.outcome.type==='edge'?'Hook • top edge':p.outcome.style==='sway'?'Sways away':p.outcome.style==='dig'?'Dug out':p.outcome.style==='defend'?'Solid defence':strokes[p.shot];
 if(t<3.75)return `${p.batHand==='L'?'LEFT':'RIGHT'}-HAND BAT  /  ${p.bowlHand==='L'?'LEFT':'RIGHT'}-ARM ${d.name.toUpperCase()}  •  ${p.speed} KM/H`;
 if(t<4.8)return shot.toUpperCase();
 let o=p.outcome;if(o.type==='bowled')return 'BOWLED!';if(o.type==='edge')return 'CAUGHT BEHIND!';if(o.type==='catch')return 'CAUGHT IN THE DEEP!';
 return o.runs===6?'SIX!':o.runs===4?'FOUR!':o.runs===2?'TWO RUNS':o.runs===1?'SINGLE':'DOT BALL';}
function render(t,p=play){ctx.drawImage(bg,0,0);ctx.save();if(p.batHand==='L'){ctx.translate(W,0);ctx.scale(-1,1);}
 let c=camAt(t,p);ctx.translate(W/2,H/2);ctx.scale(c.z,c.z);ctx.translate(-c.cx,-c.cy);
 let catchU=p.outcome.type==='catch'?ease(4.3,5.4,t):0,jumpU=p.outcome.type==='catch'?Math.sin(clamp((t-4.5)/.9)*Math.PI)*10:0;
 let f0=fieldSpots[0]||pt(480,222),fx=mix(f0.x,p.landing.x,ease(3.8,5.4,t)),fy=mix(f0.y,p.landing.y+60,ease(3.8,5.4,t));
 fielder(fx,fy,.68,bowlKit,catchU,false,'#a06a44',jumpU);
 fielder((fieldSpots[1]||pt(848,210)).x,(fieldSpots[1]||pt(848,210)).y,.55,bowlKit);
 fielder((fieldSpots[2]||pt(126,218)).x,(fieldSpots[2]||pt(126,218)).y,.56,bowlKit);
 wicket(t,p);
 let edgeU=p.outcome.type==='edge'?ease(3.9,4.67,t):0;
 fielder(165+edgeU*8,305,.95,bowlKit,edgeU,true,'#8a5533',edgeU*6);
 dust(t,p);batsman(t,p);bowler(t,p);
 let tr=trail(t,p);tr.forEach((q,i)=>ellipse(q.x,q.y,2.2+i*.28,2.2+i*.28,`rgba(255,255,255,${.05+i*.05})`));
 let ball=ballPosition(t,p);if(ball){ellipse(ball.x+1,Math.max(308,ball.y+7),5,1.8,'#153b3433');ellipse(ball.x,ball.y,4.5,4.5,'#ffffff');line([pt(ball.x-2,ball.y-2),pt(ball.x+2,ball.y+2)],'#d57565',1);}
 crowdJump(t,p,t>4.55&&(p.outcome.type!=='runs'||p.outcome.runs>=4));
 ctx.restore();
 rect(15,12,930,42,'#071e2de8',9);rect(26,21,7,24,batKit.c1,2);text(`${batKit.name} BAT`,43,39,17);text('v',193,38,14,'#85a29e');rect(214,21,7,24,bowlKit.c1,2);text(`${bowlKit.name} BOWL`,231,39,17);text(`OVER ${over+1}  •  ${ballNo}/6`,590,39,17,'#ffe3a1');text('2D ACTION',922,39,13,'#9cbab5','right');
 rect(15,350,930,37,'#071e2de8',8);text(caption(t,p),31,374,17,t>4.8?'#ffe0a1':'#eef5e5');for(let i=0;i<6;i++){ellipse(815+i*21,368,5,5,i<ballNo?batKit.c1:'#4a6468');}
 if(t>6.25&&ballNo===6){rect(240,118,480,60,'#092332ed',12);text(`OVER ${over+1} COMPLETE • NEW KITS NEXT OVER`,480,153,18,'#ffe3a1','center');}}
function playable(){return !document.hidden&&!reduce.matches&&document.getElementById('start').style.display==='none'&&document.getElementById('end').style.display!=='flex';}
function frame(now){raf=0;if(manual||!playable()){last=0;return;}if(last)elapsed+=Math.min((now-last)/1000,.1);last=now;if(elapsed>=DURATION){elapsed-=DURATION;next();}render(elapsed);raf=requestAnimationFrame(frame);}
function update(){if(playable()&&!manual){if(!raf){last=0;raf=requestAnimationFrame(frame);}}else{if(raf)cancelAnimationFrame(raf);raf=0;last=0;}}
loadHist();changeKits();newField();next();rebuildBG();render(0);
// Rebuild the stadium backdrop whenever a new over brings fresh lighting.
document.getElementById('go').addEventListener('click',update);document.addEventListener('visibilitychange',update);reduce.addEventListener('change',update);let watch=new MutationObserver(update);['start','end'].forEach(id=>watch.observe(document.getElementById(id),{attributes:true,attributeFilter:['style']}));
if(new URLSearchParams(location.search).get('debug')==='1')window.cricket2D={inspect:()=>({elapsed,over:over+1,ball:ballNo,batKit:batKit.name,bowlKit:bowlKit.name,lightMode,play:{...play},log:log.slice(),running:!!raf,reduced:reduce.matches,sigCount:sigHist.size,kitCount:kitHist.size}),
 sample:(di,si,bh,boh,t,o=0,n=0,force=null,seed=1234)=>{manual=true;update();over=o;ballNo=n||di%6+1;if(!batKit)changeKits();if(!fieldSpots.length)newField();play=makePlay(di,si,bh,boh,seed,force);rebuildBG();render(t);return {play,ball:ballPosition(t,play),bat:batGeometry(t,play),cam:camAt(t,play)};},
 advance:()=>{manual=true;update();let before=over;next();if(over!==before)rebuildBG();render(0);return window.cricket2D.inspect();},
 resume:()=>{manual=false;elapsed=0;update();},light:(m)=>{lightMode=m;rebuildBG();render(0);return m;},
 step:(t)=>{manual=true;update();render(t);return true;}};
// Live loop must rebuild the stadium when the over turns over.
(function(){let innerNext=next;next=function(){let before=over;innerNext();if(over!==before)rebuildBG();};})();
})();
