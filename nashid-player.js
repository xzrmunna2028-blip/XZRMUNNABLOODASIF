/* Nashid Player v2 — শুধু ভিডিও/অডিও (ইউটিউবের টাইটেল-লোগো-More videos লুকানো), মিনি প্লেয়ার, লক-স্ক্রিন কন্ট্রোল */
(function(){
if(window.__npLoaded)return;window.__npLoaded=2;
var $=function(i){return document.getElementById(i)};
var css=document.createElement("style");css.textContent=
"#npOv{position:fixed;inset:0;z-index:99999;background:#0b1f17;color:#fff;display:none;flex-direction:column;overflow:hidden}#npOv.on{display:flex}"+
".np-top{display:flex;align-items:center;gap:8px;padding:10px 12px}.np-top b{flex:1;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
".np-top button,.np-c button{background:#1c3a2d;color:#fff;border:0;border-radius:50%;width:42px;height:42px;font-size:18px;cursor:pointer}"+
".np-sw{display:flex;background:#1c3a2d;border-radius:20px;padding:3px;margin:0 12px}.np-sw button{width:auto;height:32px;border-radius:16px;padding:0 14px;font-size:13px;background:none;color:#fff;border:0}.np-sw button.on{background:#1fa971}"+
/* স্টেজ: ভিডিও ১৬:৯, ভেতরের iframe উপর-নিচে বাড়ানো, ফলে ইউটিউবের টাইটেল/লোগো/More videos বাইরে কেটে যায় */
"#npStage{margin:8px auto;background:#000;position:relative;overflow:hidden;transition:all .25s}"+
"#npFr{position:absolute;left:0;right:0;top:-34%;height:168%}#npFr iframe,#npFr>div{width:100%;height:100%;border:0;display:block}"+
"#npOv.vid #npStage{width:100%;aspect-ratio:16/9;max-height:42vh}#npOv.aud #npStage{width:220px;height:220px;border-radius:18px}"+
"#npSh{position:absolute;inset:0;z-index:3;cursor:pointer;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center}"+
"#npBig{width:84px;height:84px;border-radius:50%;background:#0b1f17f2;display:none;align-items:center;justify-content:center;font-size:34px;color:#fff}#npOv.paused #npBig{display:flex}"+
"#npCv{position:absolute;inset:0;z-index:2;display:none;align-items:flex-end;justify-content:center;background:#000 center/cover no-repeat}#npOv.aud #npCv,#npCv.end{display:flex}"+
"#npCv:before{content:'';position:absolute;inset:0;background:linear-gradient(#0000,#000a)}"+
"#npEq{position:relative;display:none;gap:5px;align-items:flex-end;height:34px;margin-bottom:14px}#npOv.aud #npEq{display:flex}#npEq i{width:6px;background:#1fa971;border-radius:3px;height:8px}#npOv.playing #npEq i{animation:npq 1s ease-in-out infinite alternate}#npEq i:nth-child(2){animation-delay:.2s!important}#npEq i:nth-child(3){animation-delay:.45s!important}#npEq i:nth-child(4){animation-delay:.1s!important}#npEq i:nth-child(5){animation-delay:.35s!important}@keyframes npq{from{height:6px}to{height:32px}}"+
"#npSp{position:absolute;inset:0;z-index:4;display:none;align-items:center;justify-content:center;background:#0008;pointer-events:none}#npSp.on{display:flex}#npSp i{width:34px;height:34px;border:4px solid #fff5;border-top-color:#fff;border-radius:50%;animation:npr 1s linear infinite}@keyframes npr{to{transform:rotate(360deg)}}"+
"#npSt{text-align:center;font-size:12px;min-height:16px;color:#ffd27a;padding:2px 12px}.np-c{display:flex;align-items:center;justify-content:center;gap:14px;padding:6px}.np-c #npPl{width:54px;height:54px;background:#1fa971}"+
".np-sk{display:flex;align-items:center;gap:8px;padding:0 16px;font-size:12px}.np-sk input{flex:1}"+
".np-in{display:flex;gap:6px;padding:6px 12px}.np-in input{flex:1;padding:8px;border-radius:8px;border:0;background:#1c3a2d;color:#fff}.np-in button{background:#1fa971;color:#fff;border:0;border-radius:8px;padding:0 12px}"+
"#npLy{flex:1;overflow:auto;padding:10px 16px;text-align:center}.npl{padding:8px;opacity:.5;transition:.2s}.npl.on{opacity:1;transform:scale(1.04)}.npl .ar{font-size:22px;line-height:1.8}.npl .bn{font-size:14px;color:#bfe8d3}"+
"#npMp{display:none}"+
"#npQl{flex:1;min-height:0;overflow:auto;padding:4px 12px 14px;border-top:1px solid #1c3a2d}.npq{display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:12px;cursor:pointer}.npq.on{background:#1c3a2d}.npq i{font-style:normal;width:22px;text-align:center;color:#8fd8b5;font-size:13px}.npq b{flex:1;min-width:0;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.npq small{display:block;color:#9fc4b2;font-weight:400;font-size:12px;overflow:hidden;text-overflow:ellipsis}#npLy:empty{display:none}#npLy{flex:none;max-height:34vh}"+
/* মিনি প্লেয়ার: ছোট বারে চলতে থাকে, সাইটের অন্য পেজ ব্যবহার করা যায় */
"#npOv.mini{inset:auto 8px calc(78px + env(safe-area-inset-bottom,0px)) 8px;height:64px;border-radius:16px;flex-direction:row;align-items:center;box-shadow:0 8px 24px #0009;border:1px solid #1fa97155}"+
"#npOv.mini .np-sw,#npOv.mini .np-sk,#npOv.mini .np-c,#npOv.mini .np-in,#npOv.mini #npLy,#npOv.mini #npQl,#npOv.mini #npSt,#npOv.mini #npMin,#npOv.mini #npBig,#npOv.mini #npEq{display:none!important}"+
"#npOv.mini #npStage{order:-1;margin:5px 0 5px 6px;width:96px!important;height:54px!important;border-radius:10px!important;flex:none}"+
"#npOv.mini .np-top{flex:1;padding:0 8px 0 10px;min-width:0}#npOv.mini #npMp{display:block;width:38px;height:38px}#npOv.mini .np-top button{width:38px;height:38px}#npOv.mini #npT{cursor:pointer}";
document.head.appendChild(css);

function ytId(u){var m=String(u||"").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtube-nocookie\.com\/embed\/)([\w-]{11})/);return m?m[1]:""}
function ytList(u){var m=String(u||"").match(/[?&]list=([\w-]+)/);return m?m[1]:""}
function parseLy(txt){var o=[];String(txt||"").split(/\r?\n/).forEach(function(r){var ln=r.replace(/[০-৯]/g,function(c){return "০১২৩৪৫৬৭৮৯".indexOf(c)}).trim();if(!ln)return;
 var t=null,m=ln.match(/^\[?\s*(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\s*\]?\s*[|\-–]?\s*(.*)$/);if(m){t=+m[1]*60+ +m[2]+(m[3]?+("0."+m[3]):0);ln=m[4]}
 var p=ln.split("|");if(p[0]||p[1])o.push({t:t,ar:(p[0]||"").trim(),bn:p.slice(1).join("|").trim()})});return o}
function fmt(s){s=Math.max(0,s|0);return (s/60|0)+":"+("0"+s%60).slice(-2)}

var S={P:null,Q:[],i:0,mode:"vid",auto:1,id:"",list:"",lastT:0,tries:0,stall:0,tick:0,lines:[],els:[],act:-1,wait:0,seeking:0,mini:0,hp:0,ign:0,want:0,loop:0};
var STAGE='<div id="npFr"><div id="npP"></div></div><div id="npCv"><div id="npEq"><i></i><i></i><i></i><i></i><i></i></div></div><div id="npSh"><div id="npBig">▶</div></div><div id="npSp"><i></i></div>';

function build(){var o=$("npOv");if(o)return o;o=document.createElement("div");o.id="npOv";o.className="vid";
 o.innerHTML='<div class="np-top"><button id="npX" aria-label="close">✕</button><b id="npT"></b><button id="npMp" aria-label="play/pause">▶</button><button id="npMin" aria-label="minimize" title="ছোট করুন">⌄</button></div>'+
 '<div class="np-sw" style="align-self:center"><button id="npMv" class="on">🎬 ভিডিও</button><button id="npMa">🎧 অডিও</button></div>'+
 '<div id="npStage">'+STAGE+'</div><div id="npSt"></div>'+
 '<div class="np-sk"><span id="npCu">0:00</span><input id="npSk" type="range" min="0" max="1000" value="0"><span id="npDu">0:00</span></div>'+
 '<div class="np-c"><button id="npPv">⏮</button><button id="npPl">▶</button><button id="npNx">⏭</button><button id="npAu" title="অটো-প্লে" style="font-size:12px">অটো ✓</button></div>'+
 '<div id="npQl"></div><div id="npLy"></div>';
 document.body.appendChild(o);
 $("npX").onclick=function(){S.mini?close():setMini(1)};$("npMv").onclick=function(){mode("vid")};$("npMa").onclick=function(){mode("aud")};
 $("npMin").onclick=function(){setMini(1)};$("npT").onclick=function(){if(S.mini)setMini(0)};$("npStage").addEventListener("click",function(e){if(S.mini){e.stopPropagation();setMini(0)}},true);
 var tg=function(){if(!S.P)return;try{S.P.getPlayerState()===1?(S.want=0,S.P.pauseVideo()):(S.want=1,S.P.playVideo())}catch(e){}};
 $("npPl").onclick=tg;$("npMp").onclick=function(e){e.stopPropagation();tg()};$("npSh").onclick=function(){if(S.mini)return;var cv=$("npCv");if(cv.classList.contains("end")){cv.classList.remove("end");try{S.P.seekTo(0,true);S.P.playVideo()}catch(e){}return}tg()};
 $("npNx").onclick=next;$("npPv").onclick=function(){S.P&&S.P.getCurrentTime()>4?S.P.seekTo(0,true):go(S.i-1)};
 $("npAu").onclick=function(){S.auto=!S.auto;this.textContent=S.auto?"অটো ✓":"অটো ✗"};
 $("npSk").oninput=function(){S.seeking=1};$("npSk").onchange=function(){try{S.P.seekTo(this.value/1000*S.P.getDuration(),true)}catch(e){}S.seeking=0};
 $("npQl").onclick=function(e){var r=e.target.closest(".npq");if(r)go(+r.dataset.k)};
 return o}
function cls(){var o=$("npOv");if(!o)return;o.className=(S.mode==="aud"?"aud":"vid")+(o.classList.contains("on")?" on":"")+(S.mini?" mini":"")+(S.paused?" paused":"")+(S.playing?" playing":"")}
function mode(m){S.mode=m;cls();$("npMv").className=m==="vid"?"on":"";$("npMa").className=m==="aud"?"on":""}
function setMini(m){S.mini=m?1:0;cls();
 if(S.mini){if(S.hp){S.hp=0;try{window.__bk?__bk.silentBack():(S.ign=1,history.back())}catch(e){}}}
 else if(!S.hp){try{window.__bk?__bk.push({t:"np"}):history.pushState({np:1},"");S.hp=1}catch(e){}}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]})}
function qlist(){var b=$("npQl");if(!b)return;b.innerHTML=S.Q.map(function(it,k){return '<div class="npq'+(k===S.i?" on":"")+'" data-k="'+k+'"><i>'+(k===S.i?"▶":(k+1))+'</i><b>'+esc(it[0]||"")+'<small>'+esc(it[1]||"")+'</small></b></div>'}).join("");var a=b.querySelector(".on");try{a&&a.scrollIntoView({block:"nearest"})}catch(e){}}
var KA=null;function ka(on){try{if(on){if(!KA){KA=new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=");KA.loop=true;KA.volume=.01}KA.play().catch(function(){})}else if(KA)KA.pause()}catch(e){}}
function st(t){$("npSt").textContent=t||""}
function spin(on){$("npSp").className=on?"on":""}
function resetStage(){$("npStage").innerHTML=STAGE;bindShield()}
function bindShield(){$("npSh").onclick=function(){if(S.mini)return;var cv=$("npCv");if(cv.classList.contains("end")){cv.classList.remove("end");try{S.P.seekTo(0,true);S.P.playVideo()}catch(e){}return}try{S.P.getPlayerState()===1?(S.want=0,S.P.pauseVideo()):(S.want=1,S.P.playVideo())}catch(e){}}}
function close(){ka(0);clearInterval(S.tick);clearTimeout(S.stall);try{S.P&&S.P.destroy()}catch(e){}S.P=null;S.playing=S.paused=0;S.mini=0;S.want=0;var o=$("npOv");if(o){o.classList.remove("on");cls();resetStage()}
 if(S.hp){S.hp=0;try{window.__bk?__bk.silentBack():(S.ign=1,history.back())}catch(e){}}
 try{if(navigator.mediaSession)navigator.mediaSession.playbackState="none"}catch(e){}}
window.addEventListener("popstate",function(){if(window.__bk)return;if(S.ign){S.ign=0;return}var o=$("npOv");if(o&&o.classList.contains("on")&&!S.mini){S.hp=0;S.mini=1;cls()}});
function next(){if(S.list&&S.P&&S.P.nextVideo&&!S.Q.length)return S.P.nextVideo();go(S.i+1<S.Q.length?S.i+1:0)}

function loadAPI(cb){if(window.YT&&YT.Player)return cb();(window.__npQ=window.__npQ||[]).push(cb);if(window.__npL)return;window.__npL=1;var p=window.onYouTubeIframeAPIReady;
 window.onYouTubeIframeAPIReady=function(){try{p&&p()}catch(e){}(window.__npQ||[]).splice(0).forEach(function(f){f()})};var s=document.createElement("script");s.src="https://www.youtube.com/iframe_api";document.head.appendChild(s)}

function lyrics(item){var box=$("npLy");box.innerHTML="";S.els=[];S.act=-1;S.lines=parseLy(item.lyr);
 S.lines.forEach(function(l){var d=document.createElement("div");d.className="npl";var a=document.createElement("div");a.className="ar";a.dir="rtl";a.textContent=l.ar;var b=document.createElement("div");b.className="bn";b.textContent=l.bn;d.appendChild(a);d.appendChild(b);box.appendChild(d);S.els.push(d);
  if(l.t!=null){d.style.cursor="pointer";d.onclick=function(){try{S.P.seekTo(l.t,true)}catch(e){}}}})}

function media(){try{if(!navigator.mediaSession)return;var t=$("npT").textContent||"Nashid",ms=navigator.mediaSession;
 ms.metadata=new MediaMetadata({title:t,artist:"Blood Donate Society",artwork:S.id?[{src:"https://i.ytimg.com/vi/"+S.id+"/hqdefault.jpg",sizes:"480x360",type:"image/jpeg"}]:[]});
 ms.setActionHandler("play",function(){S.want=1;try{S.P.playVideo()}catch(e){}});ms.setActionHandler("pause",function(){S.want=0;try{S.P.pauseVideo()}catch(e){}});
 ms.setActionHandler("nexttrack",next);ms.setActionHandler("previoustrack",function(){go(S.i-1)});
 ms.setActionHandler("seekto",function(d){try{S.P.seekTo(d.seekTime,true)}catch(e){}})}catch(e){}}
function art(){var cv=$("npCv");if(cv&&S.id)cv.style.backgroundImage="url(https://i.ytimg.com/vi/"+S.id+"/hqdefault.jpg)";else if(cv)cv.style.backgroundImage="none"}

function go(i){if(!S.Q.length)return;S.i=(i+S.Q.length)%S.Q.length;var it=S.Q[S.i];S.id=ytId(it[4]);S.list=S.id?"":ytList(it[4]);S.tries=0;S.lastT=0;S.want=1;
 $("npT").textContent=it[0]||"";qlist();ka(1);$("npCv").classList.remove("end");art();lyrics(it);st("");start(S.id,0)}
function start(id,at){loadAPI(function(){if(!$("npOv")||!$("npOv").classList.contains("on"))return;spin(1);
 if(S.P&&S.P.loadVideoById){if(id)S.P.loadVideoById({videoId:id,startSeconds:at||0});else S.P.loadPlaylist({list:S.list,listType:"playlist"});return}
 var v={autoplay:1,playsinline:1,rel:0,controls:0,disablekb:1,fs:0,iv_load_policy:3,modestbranding:1,cc_load_policy:0,showinfo:0,origin:location.origin};if(!id){v.listType="playlist";v.list=S.list}
 S.P=new YT.Player("npP",{videoId:id||undefined,width:"100%",height:"100%",playerVars:v,events:{
  onReady:function(e){try{e.target.playVideo()}catch(x){}clearInterval(S.tick);S.tick=setInterval(loop,250)},
  onStateChange:function(e){var s=e.data;clearTimeout(S.stall);$("npPl").textContent=s===1?"❚❚":"▶";$("npMp").textContent=s===1?"❚❚":"▶";$("npBig").textContent="▶";
   S.playing=s===1?1:0;S.paused=(s===2||s===5||s===-1)?1:0;cls();
   if(s===3){spin(1);S.stall=setTimeout(function(){recover("সংযোগ ধীর, আবার চেষ্টা হচ্ছে…")},15000)}else spin(0);
   if(s===1){S.tries=0;S.wait=0;S.want=1;st("");try{var d=S.P.getVideoData();if(d&&d.title&&!$("npT").textContent)$("npT").textContent=d.title}catch(x){}media();try{navigator.mediaSession.playbackState="playing"}catch(x){}}
   if(s===2){try{navigator.mediaSession.playbackState="paused"}catch(x){}}
   if(s===0){/* শেষ হলে ইউটিউবের সাজেশন স্ক্রিন না দেখিয়ে নিজের কভার */
    if(S.auto&&S.Q.length>1)next();else if(!S.list){try{S.P.seekTo(0,true);S.P.pauseVideo()}catch(x){}$("npCv").classList.add("end")}}},
  onError:function(e){var c=e.data;if(c===100||c===101||c===150||c===153){st("এই ভিডিও এখানে চালানো যায় না, পরেরটি চালু হচ্ছে…");setTimeout(function(){S.Q.length>1?next():st("এই ভিডিও এখানে চালানো যায় না")},1800)}else recover()}}})})}

function recover(msg){if(!S.P||!S.id&&!S.list)return;try{S.lastT=S.P.getCurrentTime()||S.lastT}catch(e){}
 if(!navigator.onLine){S.wait=1;spin(1);return st("ইন্টারনেট সংযোগ নেই, সংযোগ ফিরলে নিজে থেকেই চলবে…")}
 if(S.tries>=6){spin(0);return st("চালানো যাচ্ছে না। ⏯ চাপ দিয়ে আবার চেষ্টা করুন")}
 S.tries++;st(msg||"পুনরায় সংযোগ হচ্ছে ("+S.tries+")…");var d=Math.min(1000*Math.pow(2,S.tries-1),15000);
 setTimeout(function(){if(S.id)S.P.loadVideoById({videoId:S.id,startSeconds:S.lastT});else S.P.playVideo()},d)}
window.addEventListener("offline",function(){if($("npOv")&&$("npOv").classList.contains("on"))st("ইন্টারনেট সংযোগ বিচ্ছিন্ন…")});
window.addEventListener("online",function(){if(S.wait){S.tries=0;recover("সংযোগ ফিরেছে, আবার চালু হচ্ছে…")}else st("")});
/* স্ক্রিন বন্ধ/অন্য অ্যাপ থেকে ফিরলে ব্রাউজার থামিয়ে দিলে নিজে থেকেই আবার চালু */
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden"&&S.P&&S.want){setTimeout(function(){try{if(S.want&&S.P.getPlayerState()!==1)S.P.playVideo()}catch(e){}},400)}if(document.visibilityState==="visible"&&S.P&&S.want){try{var s=S.P.getPlayerState();if(s===2||s===5)S.P.playVideo()}catch(e){}}});

function loop(){var P=S.P;if(!P||!P.getCurrentTime)return;var t=P.getCurrentTime(),d=P.getDuration()||0;if(t>0)S.lastT=t;
 $("npCu").textContent=fmt(t);$("npDu").textContent=fmt(d);if(!S.seeking&&d)$("npSk").value=t/d*1000;
 var ix=-1;for(var k=0;k<S.lines.length;k++)if(S.lines[k].t!=null&&S.lines[k].t<=t+.15)ix=k;
 if(ix!==S.act){if(S.els[S.act])S.els[S.act].classList.remove("on");S.act=ix;var el=S.els[ix];if(el){el.classList.add("on");try{$("npLy").scrollTo({top:el.offsetTop-$("npLy").clientHeight/2,behavior:"smooth"})}catch(e){}}}}

window.__npBack=function(){var o=$("npOv");if(o&&o.classList.contains("on")&&!S.mini){S.hp=0;S.mini=1;cls();return true}return false};
window.__nashYT=function(item){try{if(!ytId(item[4])&&!ytList(item[4]))return false;
 var mp=$("qMp");try{if(mp&&mp.textContent==="❚❚")mp.click()}catch(e){}
 var all=(window.__NASH||[]).filter(function(x){return (ytId(x[4])||ytList(x[4]))&&((x[5]==="quran")===(item[5]==="quran"))});var ix=all.indexOf(item);
 S.Q=ix<0?[item]:all;var o=build();S.mini=0;o.classList.add("on");mode(S.mode);
 try{if(S.P){S.P.destroy();S.P=null;resetStage()}}catch(e){}
 if(!S.hp){try{window.__bk?__bk.push({t:"np"}):history.pushState({np:1},"");S.hp=1}catch(e){}}
 go(ix<0?0:ix);return true}catch(e){console.warn("[np]",e);return false}};
})();
