(function(){
'use strict';
var $=function(i){return document.getElementById(i)};
var TIMER_MS=12000, GAP_MS=1400, TEASE_EVERY=5000;
var P=new URLSearchParams(location.search);
var SIM=P.get('sim')==='1',AUTO=P.get('auto')==='1', FAST=parseFloat(P.get('speed')||'1');
var DBG=P.get('debug')==='1',EV=[],T0=Date.now();
function ev(k){if(DBG){var fs=$('face').src;EV.push({t:Date.now()-T0,ev:k,face:fs.indexOf('sad')>=0?'sad':fs.indexOf('tease')>=0?'tease':'smile'});}}
var KEY='iplquiz.seen.v5';
var seen={};try{seen=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
if(P.get('reset')==='1'){seen={};try{localStorage.removeItem(KEY)}catch(e){}}
function saveSeen(){try{localStorage.setItem(KEY,JSON.stringify(seen))}catch(e){}}
function fit(){var st=$('stage');
 if(innerWidth<700&&innerHeight>innerWidth&&P.get('desk')!=='1'){ /* phone layout: same 3 sections, text sized for a handheld screen */
  document.body.classList.add('phone');var w=540,h0=innerHeight*540/innerWidth;if(h0<900)w=Math.round(540*900/h0);var h=Math.round(innerHeight*w/innerWidth);st.style.width=w+'px';st.style.height=h+'px';st.style.transform='scale('+(innerWidth/w)+')';}
 else{document.body.classList.remove('phone');st.style.width='1080px';st.style.height='1920px';var s=Math.min(innerWidth/1080,innerHeight/1920);st.style.transform='scale('+s+')';}}
addEventListener('resize',fit);fit();
/* ---- synthesized sounds (original, no samples) ---- */
var AC=null,master=null;
function ac(){if(!AC){var C=window.AudioContext||window.webkitAudioContext;AC=new C();master=AC.createGain();master.gain.value=0.5;master.connect(AC.destination);}if(AC.state==='suspended')AC.resume();return AC;}
function tone(f,t0,d,type,g){var a=ac(),o=a.createOscillator(),v=a.createGain();o.type=type||'sine';o.frequency.value=f;v.gain.setValueAtTime(0.0001,t0);v.gain.exponentialRampToValueAtTime(g||0.25,t0+0.01);v.gain.exponentialRampToValueAtTime(0.0001,t0+d);o.connect(v);v.connect(master);o.start(t0);o.stop(t0+d+0.05);}
function sfx(k){try{var a=ac(),t=a.currentTime;
 if(k==='tick')tone(900,t,0.06,'square',0.08);
 if(k==='ding'){tone(880,t,0.5,'sine',0.3);tone(1320,t+0.08,0.7,'sine',0.25);tone(1760,t+0.16,0.9,'sine',0.18);}
 if(k==='sad'){tone(330,t,0.35,'triangle',0.25);tone(247,t+0.3,0.5,'triangle',0.25);}
 if(k==='whoosh'){var o=a.createOscillator(),v=a.createGain();o.type='sawtooth';o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(1200,t+0.25);v.gain.setValueAtTime(0.0001,t);v.gain.exponentialRampToValueAtTime(0.06,t+0.1);v.gain.exponentialRampToValueAtTime(0.0001,t+0.3);o.connect(v);v.connect(master);o.start(t);o.stop(t+0.35);}
 if(k==='pop'){tone(520,t,0.12,'sine',0.2);tone(780,t+0.06,0.14,'sine',0.18);}
}catch(e){}}
/* ---- voice clips ---- */
var voice=new Audio();voice.preload='auto';
function loadClip(name){var a=new Audio();a.preload='auto';a.src='clips/'+name+'.mp3';return a;}
var blockedWait=null;
function waitUnblocked(){if(blockedWait)return blockedWait;$('start').style.display='flex';blockedWait=new Promise(function(r){window.__resume=function(){blockedWait=null;$('start').style.display='none';r();};});return blockedWait;}
function playClip(a,maxMs,durMs,onstart){return new Promise(function(res){
 if(SIM){if(onstart)onstart();setTimeout(function(){res(true)},(durMs||3000)/FAST);return;}
 var tries=0;function attempt(){var done=false,tm,started=false;
  function start(){if(started)return;started=true;if(onstart)onstart();}
  function fin(ok){if(done)return;done=true;clearTimeout(tm);a.onended=a.onerror=a.onplaying=null;res(ok);}
  a.onended=function(){fin(true)};a.onerror=function(){fin(false)};a.onplaying=start;
  tm=setTimeout(function(){fin(false)},maxMs||40000);
  a.currentTime=0;var p=a.play();
  if(p&&p.then)p.then(start);
  if(p&&p.catch)p.catch(function(err){if(done)return;clearTimeout(tm);done=true;if(err&&err.name==='NotAllowedError'&&tries++<3){waitUnblocked().then(function(){attempt()});}else res(false);});}
 attempt();});}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms/FAST)})}
/* ---- Mini content (text only; no voice for teases) ---- */
var TEASE=[
 'ఏమిటి అందరూ ఇంకా ఆలోచిస్తున్నారా? ఇది మీకు తెలిసే ఉంటుంది!',
 'కామెంట్స్‌లో మీ సమాధానం రాయండి, నేను చూస్తున్నాను!',
 'మిని సమాధానం చెప్పేస్తే మజా ఉండదు, మీరు చెప్పండి!',
 'టైమ్ అయిపోతోంది, త్వరగా త్వరగా!',
 'హ్మ్... ఈ ఆప్షన్ మీద నాకు డౌట్ వస్తోంది!',
 'క్రికెట్ ఫ్యాన్స్ అంటే ఇలాంటివి ఈజీగా చెప్పేయాలి కదా!',
 'ఎవరు ముందు కరెక్ట్ చెబుతారో చూద్దాం!'];
var HAPPY=['మిని నవ్వుతోంది! నా అంచనా కరెక్ట్!','యెస్! మిని కరెక్ట్ గా పట్టేసింది!','సూపర్! ఈ సారి నాదే గెలుపు!'];
var SAD=['అయ్యో! ఈ సారి మిని తప్పు చెప్పింది...','ఆహ్, నా అంచనా తప్పింది!','అరెరే, ఇది నాకు కష్టమైంది!'];
var TAGS={E:'EASY',M:'MEDIUM',H:'HARD'};
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function setFace(ok){var f=$('face');f.src=ok?'img/smile.png':'img/sad.png';var av=f.parentNode;av.classList.remove('teasing');av.classList.remove('pop');void av.offsetWidth;av.classList.add('pop');}
/* playful mocking waggle every tease (~5s during the timer); never swaps the face, so it can't hint the result */
var teaseT=null;(new Image()).src='img/tease.png';
function teaseFace(){var f=$('face'),av=f.parentNode;av.classList.remove('teasing');void av.offsetWidth;av.classList.add('teasing');
 if(f.src.indexOf('sad.png')<0)f.src='img/tease.png';
 clearTimeout(teaseT);teaseT=setTimeout(function(){if(f.src.indexOf('tease.png')>=0)f.src='img/smile.png';},1400/FAST);
 ev('tease-face');}
$('face').parentNode.addEventListener('animationend',function(e){if(e.animationName==='tease')this.classList.remove('teasing');});
var D=null,order=[],score=0,asked=0,running=false;
function buildOrder(){var rank={E:0,M:1,H:2};var g={E:[],M:[],H:[]};
 D.questions.forEach(function(q){if(P.get('only')&&q.id!==P.get('only'))return;if(!seen[q.id])g[q.tier].push(q)});
 /* easy -> medium -> hard, shuffled within a band; bands blend so it never feels like a wall */
 var all=[].concat(shuffle(g.E),shuffle(g.M),shuffle(g.H));
 var keyed=all.map(function(q,i){return {q:q,k:i+Math.random()*all.length*0.25}});
 keyed.sort(function(a,b){return a.k-b.k});return keyed.map(function(x){return x.q});}
function renderQ(q,n){
 $('qnum').textContent='ప్రశ్న '+n;$('qnumen').textContent=n;
 $('tag').textContent=TAGS[q.tier]||'';$('qte').textContent=q.qte;$('qen').textContent=q.qen||'';
 var o=$('opts');o.innerHTML='';
 q.ote.forEach(function(t,i){var d=document.createElement('div');d.className='opt';d.id='o'+i;
  d.innerHTML='<div class="badge">'+'ABCD'[i]+'</div><div><span class="te"></span><span class="en2 en"></span></div>';
  d.querySelector('.te').textContent=t;d.querySelector('.en2').textContent=q.oen[i]!==t?q.oen[i]:'';o.appendChild(d);});
 $('timer').textContent='⏱ --';$('tbar').style.width='0';$('tbar').style.transition='none';
 setFace(true);$('cstate').textContent='';$('cstate').className='chitti-state';$('ctease').textContent='';$('cans').textContent='';
 var ds=$('dots');ds.innerHTML='';for(var i=0;i<5;i++){var e=document.createElement('div');e.className='dot'+(i<(n-1)%5+1?'':' off');ds.appendChild(e);}
}
function miniGuess(q){var h=hash('m'+q.id)%100;if(h<72)return q.c;var w=[0,1,2,3].filter(function(i){return i!==q.c});return w[h%w.length];}
async function timerPhase(q,guess){
 var start=Date.now(),total=TIMER_MS/FAST,lastTick=-1,nextTease=1800/FAST,ti=0;
 var guessAt=8000/FAST,guessed=false;
 $('tbar').style.transition='width '+(total/1000)+'s linear';$('tbar').style.width='100%';
 var teases=shuffle(TEASE.slice());
 while(true){
  var el=Date.now()-start;if(el>=total)break;
  if(P.get('hold')==='timer'&&el>5000){$('ctease').textContent=TEASE[0];await new Promise(function(){});}
  var left=Math.ceil((total-el)*FAST/1000);$('timer').textContent='⏱ 00:'+(left<10?'0':'')+left;
  if(left<=5&&left!==lastTick){lastTick=left;sfx('tick');}
  if(el>=nextTease&&total-el>1500/FAST){nextTease+=TEASE_EVERY/FAST;$('ctease').textContent=teases[ti++%teases.length];sfx('pop');teaseFace();ev('tease');
    $('cstate').textContent='';}
  /* Mini announces her guess mid-timer; it is her pick (can be wrong), not the answer, and the result reveal still waits for the answer voice */
  if(!guessed&&el>=guessAt){guessed=true;
    $('cans').innerHTML='';var gb=document.createElement('b');gb.textContent='మిని అంచనా: '+'ABCD'[guess]+'!';$('cans').appendChild(gb);
    sfx('pop');teaseFace();ev('guess');}
  await new Promise(function(r){setTimeout(r,100)});
 }
 $('timer').textContent='⏱ 00:00';
}
async function runQuestion(q,n){
 var qa=loadClip(q.id+'-q'),aa=loadClip(q.id+'-a');
 renderQ(q,n);sfx('whoosh');ev('question');
 await sleep(500);
 await playClip(qa,q.qd+8000,q.qd);
 var guess=miniGuess(q);
 await timerPhase(q,guess);
 /* reveal: every result-revealing change (score, highlight, expression, guess) fires only when the answer audio actually starts playing; the fallback runs only if the clip itself failed, so the expression can never precede the voice */
 var ok=guess===q.c;
 await sleep(350);
 ev('answer-play-invoked');
 var revealed=false;
 function reveal(src){if(revealed)return;revealed=true;ev(src);
  score+=ok?1:0;
  for(var i=0;i<4;i++){$('o'+i).classList.add(i===q.c?'correct':'dim');}
  $('score').textContent='మిని స్కోరు '+score+' / '+n;
  setFace(ok);sfx(ok?'ding':'sad');
  $('cstate').textContent=pick(ok?HAPPY:SAD);$('cstate').className='chitti-state'+(ok?'':' sad');
  $('ctease').textContent=q.why;
  $('cans').innerHTML='';var b=document.createElement('b');b.textContent='మిని అంచనా: '+'ABCD'[guess]+'. '+q.ote[guess];$('cans').appendChild(b);
  ev('reveal-ui');}
 var played=playClip(aa,q.ad+8000,q.ad,function(){reveal('answer-playing');});
 if(P.get('hold')==='reveal'){await new Promise(function(){});}
 await played;reveal('reveal-fallback');ev('answer-voice-end');
 seen[q.id]=1;saveSeen();
 await sleep(GAP_MS);
}
async function main(){
 running=true;
 try{D=await (await fetch('data.json?'+Date.now())).json();}catch(e){setTimeout(main,5000);return;}
 order=buildOrder();
 if(D.intro&&!seen.__intro){var ia=loadClip('intro');$('qte').textContent='ఐపీఎల్ క్విజ్ షోకి స్వాగతం!';$('qen').textContent='Welcome to the IPL Quiz Show!';$('opts').innerHTML='';await playClip(ia,D.intro.d+6000,D.intro.d);seen.__intro=1;saveSeen();}
 var n=Object.keys(seen).filter(function(k){return k!=='__intro'}).length;
 for(var i=0;i<order.length;i++){
  try{await runQuestion(order[i],++n);}catch(e){console.error(e);await sleep(1500);}
 }
 $('end').style.display='flex';document.title='END seen='+Object.keys(seen).filter(function(k){return k!=='__intro'}).length+' asked='+n;
}
function begin(){$('start').style.display='none';try{ac()}catch(e){}try{var pr=new Audio('clips/0001-q.mp3');pr.volume=0;var pp=pr.play();if(pp&&pp.then)pp.then(function(){pr.pause()});if(pp&&pp.catch)pp.catch(function(){})}catch(e){}if(window.__resume)window.__resume();if(!running)main();}
$('go').onclick=begin;
if(AUTO){ // OBS / kiosk: try to start right away; fall back to the start button if audio is blocked
 try{ac();if(AC.state==='running'){begin();}}catch(e){}
 var probe=new Audio('clips/0001-q.mp3');probe.volume=0;probe.play().then(function(){probe.pause();begin();}).catch(function(){});
}

async function sweep(){
 D=await (await fetch('data.json')).json();var res=[];
 var wh=HAPPY.concat(SAD).sort(function(a,b){return b.length-a.length})[0];
 D.questions.forEach(function(q,k){
  renderQ(q,k+1);
  for(var i=0;i<4;i++){$('o'+i).classList.add(i===q.c?'correct':'dim');}
  $('cstate').textContent=wh;$('ctease').textContent=q.why;$('cans').innerHTML='<b>మిని అంచనా: D. '+q.ote[3]+'</b>';
  var st=$('stage').getBoundingClientRect(),H=$('stage').offsetHeight,sc=st.height/H,c=$('chitti').getBoundingClientRect();
  var oo=$('opts').getBoundingClientRect(),w=0;document.querySelectorAll('.opt').forEach(function(e){w=Math.max(w,e.scrollWidth-e.clientWidth)});
  res.push({id:q.id,H:H,chittiBottom:Math.round((c.bottom-st.top)/sc),ratio:+(((c.bottom-st.top)/sc)/H).toFixed(3),optsBottom:Math.round((oo.bottom-st.top)/sc),overflowX:w});
 });
 var pre=document.createElement('pre');pre.id='sweep';pre.textContent=JSON.stringify(res);document.body.appendChild(pre);
}
if(P.get('sweep')==='1'){document.fonts.ready.then(function(){setTimeout(sweep,1500)});}
window.__ipl={status:function(){return {running:running,score:score,seen:Object.keys(seen).length,left:order.length}},log:function(){return EV}};
})();
