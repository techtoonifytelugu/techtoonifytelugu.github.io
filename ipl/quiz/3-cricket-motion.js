/* Original silent replay. Keep quiz playback and local question history independent. */
(function(){
'use strict';
var video=document.getElementById('cricket-action');
if(!video)return;
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
function update(){
 var playing=!document.hidden&&!reduce.matches&&document.getElementById('start').style.display==='none'&&document.getElementById('end').style.display!=='flex';
 if(playing){var p=video.play();if(p&&p.catch)p.catch(function(){/* Poster stays visible if the device blocks playback. */});}
 else video.pause();
}
document.getElementById('go').addEventListener('click',update);
document.addEventListener('visibilitychange',update);
if(reduce.addEventListener)reduce.addEventListener('change',update);
var watch=new MutationObserver(update);
['start','end'].forEach(function(id){watch.observe(document.getElementById(id),{attributes:true,attributeFilter:['style']});});
update();
})();
