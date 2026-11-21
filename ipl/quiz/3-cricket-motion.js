/* Original silent replay. Randomized playlist of pre-rendered plays: varied batting shots, tough balls and wickets. Quiz playback and local question history stay independent. */
(function(){
'use strict';
var video=document.getElementById('cricket-action');
if(!video)return;
var CLIPS=['cricket-drive.mp4','cricket-straight.mp4','cricket-cut.mp4','cricket-pull.mp4','cricket-yorker.mp4','cricket-bouncer.mp4','cricket-loft.mp4'];
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
var order=[],pos=0,started=false,preloaded={};
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function next(){if(pos>=order.length){order=shuffle(CLIPS.slice());pos=0;}return order[pos++];}
function peek(){return pos<order.length?order[pos]:null;}
function playable(){return !document.hidden&&!reduce.matches&&document.getElementById('start').style.display==='none'&&document.getElementById('end').style.display!=='flex';}
function tryPlay(){var p=video.play();if(p&&p.catch)p.catch(function(){/* Poster stays visible if the device blocks playback. */});}
function preloadNext(){var n=peek();if(n&&!preloaded[n]){preloaded[n]=true;var v=document.createElement('video');v.preload='auto';v.muted=true;v.src=n;}}
function update(){
 if(playable()){if(!started){started=true;video.src=next();preloadNext();}tryPlay();}
 else video.pause();
}
video.addEventListener('ended',function(){
 video.src=next();preloadNext();
 if(playable())tryPlay();
});
document.getElementById('go').addEventListener('click',update);
document.addEventListener('visibilitychange',update);
if(reduce.addEventListener)reduce.addEventListener('change',update);
var watch=new MutationObserver(update);
['start','end'].forEach(function(id){watch.observe(document.getElementById(id),{attributes:true,attributeFilter:['style']});});
update();
})();
