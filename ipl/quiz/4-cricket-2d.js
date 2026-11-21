/* Original silent 2D cricket. Independent of quiz state, audio and saved history. */
(function(){
'use strict';
const canvas=document.getElementById('cricket-action'); if(!canvas)return;
const ctx=canvas.getContext('2d',{alpha:false});
const W=960,H=400,DURATION=7,CONTACT=3.75,RELEASE=2.25;
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const ease=(a,b,t)=>{let u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
const pt=(x,y)=>({x,y}); const lerp=(a,b,u)=>pt(mix(a.x,b.x,u),mix(a.y,b.y,u));
const kits=[['ROYAL','#3985eb','#143568'],['EMBER','#fa7753','#8e3032'],['JADE','#22bd9a','#116658'],['GOLD','#ffd054','#876118'],['VIOLET','#ad80ed','#513586'],['ROSE','#f477b7','#822c59']];
const deliveries=[{name:'Fast yorker',kind:'yorker',speed:146},{name:'Rising bouncer',kind:'bouncer',speed:143},{name:'Outswing',kind:'out',speed:137},{name:'Inswing',kind:'in',speed:139},{name:'Off spin',kind:'off',speed:86},{name:'Leg spin',kind:'leg',speed:81},{name:'Slower cutter',kind:'slow',speed:112},{name:'Seam up',kind:'seam',speed:141}];
const strokes=['Cover drive','Straight drive','Square cut','Pull shot','Sweep','Lofted drive'];
let bag=[],shotBag=[],ballNo=0,over=0,batKit=0,bowlKit=1,play,elapsed=0,last=0,raf=0,manual=false,log=[];
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
function shuffle(a){for(let i=a.length-1;i;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function take(type){let a=type==='ball'?bag:shotBag;if(!a.length)a.push(...shuffle(type==='ball'?deliveries.map((_,i)=>i):strokes.map((_,i)=>i)));return a.pop();}
function changeKits(){let a=shuffle(kits.map((_,i)=>i).filter(i=>i!==batKit&&i!==bowlKit));batKit=a[0];bowlKit=a[1];}
function makePlay(di,si,bh,boh){let d=deliveries[di];let out=d.kind==='yorker'?'bowled':d.kind==='bouncer'?'edge':(si===5?'catch':'runs');return {delivery:di,shot:si,batHand:bh,bowlHand:boh,outcome:out};}
function next(){if(ballNo===6){over++;ballNo=0;changeKits();}play=makePlay(take('ball'),take('shot'),Math.random()<.5?'L':'R',Math.random()<.5?'L':'R');ballNo++;log.push({...play,over:over+1,ball:ballNo,batKit,bowlKit});if(log.length>36)log.shift();}
function line(points,color,width){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
function poly(points,color){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function rect(x,y,w,h,c,r=0){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function text(s,x,y,size=15,color='#eff8ed',align='left',weight=600){ctx.font=`${weight} ${size}px Arial,sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(s,x,y);}
const bg=document.createElement('canvas');bg.width=W;bg.height=H;
function stadium(){let g=ctx.createLinearGradient(0,0,0,400);g.addColorStop(0,'#10273a');g.addColorStop(.48,'#244d55');g.addColorStop(.49,'#427a53');g.addColorStop(1,'#173e33');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(let row=0;row<4;row++){rect(0,72+row*15,960,12,row%2?'#1d3845':'#172e3a');for(let x=4;x<960;x+=10){let n=(x*13+row*31)%7;ellipse(x,77+row*15,1.7,2,['#a6c8cc','#c8ad8d','#50748b','#779e99'][n%4]);}}
 for(let x of [63,892]){line([pt(x,126),pt(x,25)],'#77949e',3);rect(x-25,37,50,13,'#b6d8d9',2);for(let k=0;k<5;k++)rect(x-22+k*10,40,6,5,'#fff8cf',1);}
 rect(0,138,960,22,'#122c32');for(let x=0;x<960;x+=160){text('CRICKET  •  2D',x+80,153,11,'#79bba6','center');}
 for(let r=0;r<6;r++){poly([pt(0,166+r*39),pt(960,161+r*39),pt(960,182+r*39),pt(0,189+r*39)],r%2?'#ffffff04':'#00000005');}
 ctx.strokeStyle='#c6e3ac66';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(475,235,570,126,0,0,Math.PI*2);ctx.stroke();
 poly([pt(203,276),pt(780,276),pt(806,320),pt(178,320)],'#bea879');poly([pt(205,282),pt(780,282),pt(794,311),pt(190,311)],'#ccb98d');
 for(let x=210;x<790;x+=13){line([pt(x,285+(x%5)),pt(x+7,286+(x%5))],'#9e865a44',1);}
 for(let x of [253,718]){line([pt(x-8,278),pt(x-10,318)],'#f6f3dc',2);line([pt(x-37,318),pt(x+26,318)],'#f6f3dc',2);}
}
// Cache the static stadium once. No filters, external assets or runtime 3D.
(function(){let c=canvas.getContext('2d');stadium();bg.getContext('2d').drawImage(canvas,0,0);})();
function limb(a,b,c,col,w){line([a,b,c],'#10292e',w+3);line([a,b,c],col,w);}
function head(x,y,helmet,kit,face=1){ellipse(x,y,10,12,'#be825c');ellipse(x-3,y+2,3,5,'#dba174');poly([pt(x+face*7,y-3),pt(x+face*14,y+1),pt(x+face*8,y+4)],'#be825c');if(helmet){ellipse(x,y-5,12,10,kit);rect(x-12,y-7,24,8,kit,2);line([pt(x+face*8,y-4),pt(x+face*17,y-4)],'#cad8dc',2);line([pt(x+face*14,y-3),pt(x+face*13,y+9),pt(x+face*5,y+11)],'#dbe5df',1.3);line([pt(x+face*6,y+4),pt(x+face*14,y+4)],'#dbe5df',1);}else{ellipse(x,y-8,10,5,'#1d242a');}ellipse(x+face*7,y-2,1.2,1.2,'#172528');}
function torso(x,y,lean,kit,back=false){let shoulder=pt(x+lean,y-87),hip=pt(x,y-49);poly([pt(shoulder.x-16,shoulder.y),pt(shoulder.x+14,shoulder.y+1),pt(hip.x+13,hip.y),pt(hip.x-12,hip.y)],kit[1]);poly([pt(shoulder.x-16,shoulder.y),pt(shoulder.x-7,shoulder.y+6),pt(hip.x-5,hip.y),pt(hip.x-12,hip.y)],kit[2]);line([pt(shoulder.x+10,shoulder.y+8),pt(hip.x+8,hip.y-6)],'#ffffff50',2);poly([pt(shoulder.x-6,shoulder.y),pt(shoulder.x,shoulder.y+7),pt(shoulder.x+6,shoulder.y)],'#e8e2c7');text(back?'17':'•',shoulder.x,shoulder.y+23,back?13:10,'#fff2ce','center');return {s:shoulder,h:hip};}
function shoe(x,y){rect(x-8,y-4,20,7,'#e8ece0',3);rect(x-8,y+2,20,2,'#153335',1);}
function pad(a,b){line([a,b],'#d8e1d3',13);line([pt(a.x-3,a.y),pt(b.x-3,b.y-3)],'#f7f8e9',3);line([pt(a.x+3,a.y),pt(b.x+3,b.y-3)],'#a2b5ad',1);}
function batGeometry(t,p){let u=ease(3.37,4.35,t),sh=p.shot;
 let angles=[1.35,1.55,.1,-.55,1.7,.7]; // angle at contact is set explicitly with a two-stage swing
 let contactAngle=p.outcome==='edge'?-.65:angles[sh];
 let a=t<CONTACT?mix(-1.9,contactAngle,ease(3.35,CONTACT,t)):mix(contactAngle,contactAngle+1.65,ease(CONTACT,4.45,t));
 if(p.outcome==='bowled')a=mix(-1.9,-.6,ease(3.65,4.4,t));
 let handed=p.batHand==='L'?-1:1,step=ease(3.18,3.73,t),sweep=sh===4?step:0;
 let hand=pt(278+step*9,239+sweep*15+(handed<0?5:0));
 // Mirrored grip and upper-body twist, with bat kept on the incoming-ball side.
 let length=59,tip=pt(hand.x+Math.cos(a)*length,hand.y+Math.sin(a)*length);
 return {hand,tip,a,step,sweep,handed};}
function batsman(t,p){let b=batGeometry(t,p),k=kits[batKit],x=270+b.step*3,y=305;
 ellipse(x,y+4,39,6,'#102d2855');let hip=pt(x,y-49+b.sweep*11),front=pt(x+22+b.step*13,y-2),back=pt(x-14,y-2),knee=pt(x+12+b.step*10,y-25+b.sweep*10);
 limb(pt(hip.x-7,hip.y),pt(x-17,y-28),back,k[2],13);limb(pt(hip.x+5,hip.y),knee,front,k[1],14);pad(pt(x-17,y-27),pt(back.x,back.y-6));pad(knee,pt(front.x,front.y-6));shoe(back.x,back.y);shoe(front.x,front.y);
 let lean=6+b.step*9+(b.handed<0?-7:0),body=torso(x,y+b.sweep*11,lean,k,b.handed<0);head(body.s.x+3,y-105+b.sweep*10,true,k[2],1);
 let s1=pt(body.s.x-9,body.s.y+8),s2=pt(body.s.x+11,body.s.y+8);let e1=pt(mix(s1.x,b.hand.x,.5)-b.handed*14,mix(s1.y,b.hand.y,.5)+12),e2=pt(mix(s2.x,b.hand.x,.5)+b.handed*11,mix(s2.y,b.hand.y,.5)-6);
 limb(s1,e1,b.hand,k[1],9);limb(s2,e2,pt(b.hand.x+4,b.hand.y+1),k[1],9);ellipse(b.hand.x,b.hand.y,6,5,'#edf4e7');
 let handle=lerp(b.hand,b.tip,.2);line([b.hand,handle],'#263e41',5);line([handle,b.tip],'#5b422b',12);line([handle,b.tip],'#ebd6a7',9);line([lerp(handle,b.tip,.25),lerp(handle,b.tip,.65)],'#ac5748',4);
}
function bowlerState(t,p){let spin=['off','leg'].includes(deliveries[p.delivery].kind),run=clamp(t/2.1),x=mix(873,708,run),y=305;let phase=t*15,amp=spin?10:19;
 let arm= t<1.8?Math.sin(phase)*.75:mix(.8,-3.8,ease(1.8,2.65,t));let hand=pt(x+(p.bowlHand==='L'?-1:1)*Math.sin(arm)*(spin?43:52),y-84-Math.cos(arm)*(spin?47:52));
 return {x,y,arm,hand,phase,amp,spin};}
function bowler(t,p){let b=bowlerState(t,p),x=b.x,y=b.y,k=kits[bowlKit],run=t<2.2?1:1-ease(2.2,3.4,t),sgn=p.bowlHand==='L'?-1:1;
 ellipse(x,y+5,29,5,'#102d2855');let stride=Math.sin(b.phase)*b.amp*run;let foot1=pt(x+stride,y),foot2=pt(x-stride,y-3);limb(pt(x-5,y-49),pt(x-8-stride*.3,y-26),foot1,k[2],12);limb(pt(x+5,y-49),pt(x+8+stride*.3,y-28),foot2,k[1],12);shoe(foot1.x,foot1.y);shoe(foot2.x,foot2.y);
 let body=torso(x,y,-6,k,true);head(body.s.x-2,y-106,false,k[2],-1);
 let a=pt(x+sgn*9,y-83),el=pt((a.x+b.hand.x)/2+sgn*8,(a.y+b.hand.y)/2);limb(a,el,b.hand,k[1],9);ellipse(b.hand.x,b.hand.y,4,4,'#cf926b');let other=pt(x-sgn*12,y-82);limb(other,pt(x-19,y-59),pt(x-32,y-79),k[1],9);
 if(t<RELEASE)ellipse(b.hand.x,b.hand.y,4,4,'#f7fbeb');
}
function fielder(x,y,s,k,catchU=0,keeper=false){ctx.save();ctx.translate(x,y);ctx.scale(s,s);let crouch=keeper?12*(1-catchU):0;
 ellipse(0,5,25,5,'#102d2855');limb(pt(-6,-45+crouch),pt(-17,-24),pt(-21,0),k[2],11);limb(pt(6,-45+crouch),pt(17,-24),pt(22,0),k[1],11);shoe(-21,0);shoe(22,0);let body=torso(0,crouch,0,k);head(0,-105+crouch,keeper,k[2],1);
 let handY=mix(-54,-116,catchU),hx=mix(24,5,catchU);limb(pt(-12,-79+crouch),pt(-28,-61),pt(hx-10,handY),k[1],8);limb(pt(12,-79+crouch),pt(29,-67),pt(hx,handY),k[1],8);ellipse(hx-8,handY,7,6,'#e6edda');ellipse(hx+2,handY,7,6,'#e6edda');ctx.restore();}
function wicket(t,p){let broken=p.outcome==='bowled'?ease(3.94,4.55,t):0;for(let i=0;i<3;i++){ctx.save();ctx.translate(236+i*5,304);ctx.rotate(broken*(i-1.2)*1.4);line([pt(0,0),pt(0,-40)],'#e4d8a4',3);ctx.restore();}for(let i=0;i<2;i++){let x=236+i*6+broken*(i?35:-25),y=263-broken*30+broken*broken*44;line([pt(x,y),pt(x+6,y-broken*10)],'#f5e9c5',3);}}
function ballPosition(t,p){let d=deliveries[p.delivery],rel=bowlerState(RELEASE,p).hand,end=lerp(batGeometry(CONTACT,p).hand,batGeometry(CONTACT,p).tip,.78),bounce=pt(d.kind==='yorker'?302:d.kind==='bouncer'?472:425,301);
 if(p.outcome==='bowled')end=pt(278,294);
 if(t<RELEASE)return null;
 if(t<3.17){let u=clamp((t-RELEASE)/.92);let v=lerp(rel,bounce,u);v.y-=Math.sin(u*Math.PI)*(d.kind==='off'||d.kind==='leg'?35:7);v.x+=Math.sin(u*Math.PI)*(d.kind==='out'?24:d.kind==='in'?-22:0);return v;}
 if(t<CONTACT){let u=clamp((t-3.17)/.58),v=lerp(bounce,end,u);v.y-=Math.sin(u*Math.PI)*(d.kind==='bouncer'?28:8);return v;}
 let u=t-CONTACT;
 if(p.outcome==='bowled'){if(u>.23)return null;return lerp(end,pt(241,278),clamp(u/.23));}
 if(p.outcome==='edge'){let v=clamp(u/.92),q=lerp(end,pt(165,195),v);q.y-=Math.sin(v*Math.PI)*45;return q;}
 if(p.outcome==='catch'){let v=clamp(u/1.65),q=lerp(end,pt(480,143),v);q.y-=Math.sin(v*Math.PI)*112;return q;}
 if(p.shot===3){if(u>2.15)return null;let v=clamp(u/1.9),q=lerp(end,pt(920,47),v);q.y-=Math.sin(v*Math.PI)*100;return q;}
 if(u>2.05)return null;let dest=p.shot===2?pt(37,338):p.shot===4?pt(70,325):pt(932,325),v=clamp(u/1.8),q=lerp(end,dest,v);q.y-=Math.abs(Math.sin(v*Math.PI*3))*13*(1-v);return q;
}
function caption(t,p){let d=deliveries[p.delivery],shot=p.outcome==='bowled'?'Yorker beats the bat':p.outcome==='edge'?'Hook • top edge':strokes[p.shot];if(t<3.75)return `${p.batHand==='L'?'LEFT':'RIGHT'}-HAND BAT  /  ${p.bowlHand==='L'?'LEFT':'RIGHT'}-ARM ${d.name.toUpperCase()}`;return t<4.8?shot.toUpperCase():p.outcome==='bowled'?'BOWLED!':p.outcome==='edge'?'CAUGHT BEHIND!':p.outcome==='catch'?'CAUGHT IN THE DEEP!':p.shot===3?'SIX!':'FOUR!';}
function render(t,p=play){ctx.drawImage(bg,0,0);ctx.save();if(p.batHand==='L'){ctx.translate(W,0);ctx.scale(-1,1);}let catchU=p.outcome==='catch'?ease(4.3,5.4,t):0;fielder(480+mix(65,0,ease(3.8,5.4,t)),222,.68,kits[bowlKit],catchU);fielder(848,210,.55,kits[bowlKit]);fielder(126,218,.56,kits[bowlKit]);
 wicket(t,p);fielder(165,305,.95,kits[bowlKit],p.outcome==='edge'?ease(3.9,4.67,t):0,true);batsman(t,p);bowler(t,p);
 let ball=ballPosition(t,p);if(ball){ellipse(ball.x+1,Math.max(308,ball.y+7),5,1.8,'#153b3433');ellipse(ball.x,ball.y,4.5,4.5,'#ffffff');line([pt(ball.x-2,ball.y-2),pt(ball.x+2,ball.y+2)],'#d57565',1);}
 ctx.restore();rect(15,12,930,42,'#071e2de8',9);rect(26,21,7,24,kits[batKit][1],2);text(`${kits[batKit][0]} BAT`,43,39,17);text('v',193,38,14,'#85a29e');rect(214,21,7,24,kits[bowlKit][1],2);text(`${kits[bowlKit][0]} BOWL`,231,39,17);text(`OVER ${over+1}  •  ${ballNo}/6`,590,39,17,'#ffe3a1');text('2D ACTION',922,39,13,'#9cbab5','right');
 rect(15,350,930,37,'#071e2de8',8);text(caption(t,p),31,374,17,t>4.8?'#ffe0a1':'#eef5e5');for(let i=0;i<6;i++){ellipse(815+i*21,368,5,5,i<ballNo?kits[batKit][1]:'#4a6468');}
 if(t>6.25&&ballNo===6){rect(280,118,400,60,'#092332ed',12);text('OVER COMPLETE • NEW TEAM KITS',480,153,18,'#ffe3a1','center');}
}
function playable(){return !document.hidden&&!reduce.matches&&document.getElementById('start').style.display==='none'&&document.getElementById('end').style.display!=='flex';}
function frame(now){raf=0;if(manual||!playable()){last=0;return;}if(last)elapsed+=Math.min((now-last)/1000,.1);last=now;if(elapsed>=DURATION){elapsed-=DURATION;next();}render(elapsed);raf=requestAnimationFrame(frame);}
function update(){if(playable()&&!manual){if(!raf){last=0;raf=requestAnimationFrame(frame);}}else{if(raf)cancelAnimationFrame(raf);raf=0;last=0;}}
next();render(0);document.getElementById('go').addEventListener('click',update);document.addEventListener('visibilitychange',update);reduce.addEventListener('change',update);let watch=new MutationObserver(update);['start','end'].forEach(id=>watch.observe(document.getElementById(id),{attributes:true,attributeFilter:['style']}));
if(new URLSearchParams(location.search).get('debug')==='1')window.cricket2D={inspect:()=>({elapsed,over:over+1,ball:ballNo,batKit,bowlKit,play:{...play},log:log.slice(),running:!!raf,reduced:reduce.matches}),sample:(di,si,bh,boh,t,o=0,n=0)=>{manual=true;update();over=o;batKit=(o*2)%kits.length;bowlKit=(o*2+1)%kits.length;ballNo=n||di%6+1;play=makePlay(di,si,bh,boh);render(t);return {play,ball:ballPosition(t,play),bat:batGeometry(t,play)};},advance:()=>{manual=true;update();next();render(0);return window.cricket2D.inspect();},resume:()=>{manual=false;elapsed=0;update();}};
})();
