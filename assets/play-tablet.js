/* iPad / tablet support for the Play tab (Nov 12, 2026; iPad proposal parts 1 and 2).
   - Tablet mode: on touch-first screens (iPad), or forced On/Off from the Play lobby. Bigger buttons, a bigger fanned hand,
     one opponent pop-up at a time, and the game log tucked away. Mouse-and-keyboard computers keep today's layout.
   - Tablet toolbar, bottom right: Log, Menu and Full screen in one row.
   - Full screen: a button (the toolbar on tablets, a small tab next to Menu on computers). On tablets, starting a game
     goes full screen by itself. Leaving the Play tab exits full screen.
   - The screen is kept awake while a game is in progress, where the browser allows it.
   - Add to Home Screen: index.html links a web app manifest, so the icon opens Deck Forge without Safari's bars. */
(function(){
"use strict";
const KEY="cq.play.tablet";
const ls={get(){try{return localStorage.getItem(KEY)||"auto"}catch(e){return"auto"}},set(v){try{localStorage.setItem(KEY,v)}catch(e){}}};
const coarse=matchMedia("(pointer: coarse)"),wideEnough=matchMedia("(min-width: 700px)");
const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
function tabletOn(){const m=ls.get();return m==="on"||(m==="auto"&&coarse.matches&&wideEnough.matches)}
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
const fsAvail=()=>!standalone()&&!!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen);
function fsEnter(){const d=document.documentElement;try{const p=d.requestFullscreen?d.requestFullscreen({navigationUI:"hide"}):d.webkitRequestFullscreen&&d.webkitRequestFullscreen();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function fsExit(){try{const p=document.exitFullscreen?document.exitFullscreen():document.webkitExitFullscreen&&document.webkitExitFullscreen();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function fsToggle(){fsEl()?fsExit():fsEnter()}

const css=`
#pl-tbar{position:fixed;right:max(12px,env(safe-area-inset-right,0px));bottom:max(12px,env(safe-area-inset-bottom,0px));z-index:76;display:flex;gap:8px}
#pl-tbar button{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:7px;min-height:46px;padding:0 16px;border-radius:12px;font:600 1rem/1 var(--body);color:#f3e6cf;background:linear-gradient(#3a2a1c,#1b130c);border:2px solid #b8743a;box-shadow:0 6px 18px rgba(0,0,0,.55);cursor:pointer;-webkit-tap-highlight-color:transparent}
#pl-tbar button[aria-pressed="true"]{border-color:#ffc100;color:#ffd98a}
#pl-tbar button:active{transform:translateY(1px);filter:brightness(1.15)}
#pl-tbar .ic{font-size:1.15rem;line-height:1}
#pl-fstab{all:unset;position:fixed;top:0;z-index:60;display:none;align-items:center;gap:6px;padding:2px 12px 4px;border:2px solid var(--accent,#c79028);border-top:0;border-radius:0 0 10px 10px;background:linear-gradient(180deg,#3a2a1c,#1b130c);color:#f3e6cf;font:600 .9rem/1.6 var(--body);cursor:pointer}
#pl-fstab:hover{color:#ffd98a}
html.pl-has-game:not(.pl-tablet) #pl-fstab.ok{display:flex}
/* ---- Tablet mode ---- */
html.pl-tablet body{overscroll-behavior:none}
html.pl-tablet #play-root{touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
html.pl-tablet #pl-menutab{display:none!important}
html.pl-tablet #play-root .btn,html.pl-tablet #play-root .pl-mid .btn,html.pl-tablet #play-root .pl-acts .btn,html.pl-tablet #pl-modal .btn,html.pl-tablet .pl-town .btn{min-height:44px!important;padding:0 16px!important;font-size:1.02rem!important;border-radius:10px!important}
html.pl-tablet #play-root .pl-mid .posm span{padding:9px 11px!important;font-size:.85rem!important}
html.pl-tablet #play-root .pl-mid .pl-snd{min-height:40px!important;padding:0 12px!important;font-size:.9rem!important}
html.pl-tablet #play-root .pl-mid .pl-help>summary{padding:10px 10px}
html.pl-tablet #play-root .pl-hand{gap:0!important;padding-left:10px!important;padding-right:min(360px,34vw)!important}
html.pl-tablet #play-root .pl-hand .hc{flex-basis:clamp(140px,min(15vw,21vh),190px)!important;margin-left:-44px}
html.pl-tablet #play-root .pl-hand .hc:first-child{margin-left:0}
html.pl-tablet #play-root .pl-hand .hc.lifted,html.pl-tablet #play-root .pl-hand .hc:focus-visible{z-index:5}
/* the acting Hero's buttons already sit in the middle bar at full size, so the small copy beside your party is hidden */
html.pl-tablet #play-root .zs-acts{display:none!important}
html.pl-tablet .ap-wrap{width:min(320px,40vw)!important}
html.pl-tablet .ap-pop.old{display:none!important}
/* the log: closed = only the toolbar's Log button; open = a panel above the toolbar */
html.pl-tablet #play-root .pl-game.nolog .pl-side{display:none!important}
html.pl-tablet #play-root .pl-side{bottom:72px!important;height:min(62vh,560px)!important;width:min(400px,calc(100vw - 24px))!important;z-index:74!important;box-shadow:0 18px 44px rgba(0,0,0,.7)}
html.pl-tablet #play-root .pl-side-h .btn{min-height:40px!important}
html.pl-tablet #tut-coach{bottom:76px!important}
html.pl-tablet #tut-coach.min{bottom:76px!important}
@media (prefers-reduced-motion:reduce){#pl-tbar button:active{transform:none}}`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

let wake=null;
async function wakeSync(on){try{if(on&&!wake&&navigator.wakeLock&&document.visibilityState==="visible"){wake=await navigator.wakeLock.request("screen");wake.addEventListener&&wake.addEventListener("release",()=>{wake=null})}
  else if(!on&&wake){const w=wake;wake=null;await w.release()}}catch(e){wake=null}}

function bar(){let b=document.getElementById("pl-tbar");if(b)return b;b=document.createElement("div");b.id="pl-tbar";b.setAttribute("role","toolbar");b.setAttribute("aria-label","Game controls");
  b.innerHTML=`<button type="button" data-tb="log"><span class="ic" aria-hidden="true">📜</span>Log</button><button type="button" data-tb="menu"><span class="ic" aria-hidden="true">☰</span>Menu</button><button type="button" data-tb="fs"><span class="ic" aria-hidden="true">⛶</span><span class="lb">Full screen</span></button>`;
  b.addEventListener("click",e=>{const t=e.target.closest("[data-tb]");if(!t)return;e.stopPropagation();const U=window.CQPlay;const v=t.dataset.tb;
    if(v==="log"&&U){U.logHidden=!U.logHidden;U.render()}
    else if(v==="menu"){const m=document.getElementById("pl-menutab");if(m)m.click()}
    else if(v==="fs")fsToggle();
    sync()});
  document.body.appendChild(b);return b}
function fsTab(){let t=document.getElementById("pl-fstab");if(t)return t;t=document.createElement("button");t.type="button";t.id="pl-fstab";t.title="Full screen (Esc to exit)";
  t.innerHTML='<span aria-hidden="true">⛶</span> <span class="lb">Full screen</span>';t.addEventListener("click",e=>{e.stopPropagation();fsToggle()});document.body.appendChild(t);return t}

function sync(){const U=window.CQPlay,root=document.documentElement;
  const inGame=location.hash==="#play"&&!!document.querySelector("#play-root .pl-game")&&!!(U&&U.mode==="game"&&U.s);
  const tab=inGame&&tabletOn();root.classList.toggle("pl-has-game",inGame);root.classList.toggle("pl-tablet",tab);
  /* a new game on a tablet starts with the log tucked away */
  if(tab&&U.gameKey&&U.gameKey!==sync.key){sync.key=U.gameKey;if(!U.logHidden){U.logHidden=true;setTimeout(()=>U.render(),0)}}
  const b=document.getElementById("pl-tbar");
  if(tab){const bb=bar();const fsb=bb.querySelector('[data-tb="fs"]');fsb.hidden=!fsAvail();fsb.setAttribute("aria-pressed",String(!!fsEl()));fsb.querySelector(".lb").textContent=fsEl()?"Exit full screen":"Full screen";
    bb.querySelector('[data-tb="log"]').setAttribute("aria-pressed",String(!!(U&&!U.logHidden)));bb.querySelector('[data-tb="menu"]').setAttribute("aria-pressed",String(root.classList.contains("pl-menu")))}
  else if(b)b.remove();
  /* computers: a small Full screen tab to the left of the Menu tab */
  const ft=fsTab();ft.classList.toggle("ok",inGame&&!tab&&fsAvail());ft.querySelector(".lb").textContent=fsEl()?"Exit full screen":"Full screen";
  const mt=document.getElementById("pl-menutab");if(mt&&inGame&&!tab){const r=mt.getBoundingClientRect();if(r.width)ft.style.right=(innerWidth-r.left+8)+"px"}
  wakeSync(inGame&&U&&U.s&&!U.s.over)}

/* tablets: starting or resuming a game goes full screen (browsers only allow it right after a tap) */
const START='[data-pa="start-ai"],[data-pa="rematch"],[data-pa="resume-local"],[data-pa="resume-host"],[data-pa="resume-guest"],[data-pa="host"],[data-pa="join"],[data-tut="pick"],[data-tutend="again"]';
document.addEventListener("click",e=>{if(!e.target.closest||!e.target.closest(START))return;const m=ls.get();
  if((m==="on"||(m==="auto"&&coarse.matches&&wideEnough.matches))&&fsAvail()&&!fsEl())fsEnter()},true);
/* leaving the Play tab (or Learn to Play) exits full screen */
addEventListener("hashchange",()=>{if(location.hash!=="#play"&&location.hash!=="#learn"&&fsEl())fsExit();setTimeout(sync,60)});
["fullscreenchange","webkitfullscreenchange"].forEach(ev=>document.addEventListener(ev,()=>{sync();try{window.CQPlay&&CQPlay.render()}catch(e){}}));
document.addEventListener("visibilitychange",()=>{wake=null;sync()});
addEventListener("resize",()=>sync());
try{coarse.addEventListener("change",sync)}catch(e){}

/* Play lobby setting: Tablet mode Auto / On / Off */
function lobbySetting(){const host=document.querySelector("#play-root .pl-lobby");if(!host||host.querySelector(".pl-tabset"))return;const m=ls.get();
  const sec=document.createElement("section");sec.className="panel pl-tabset";
  sec.innerHTML=`<h2>Tablet mode</h2><label>Layout<select data-tabmode>${[["auto","Auto (on for iPad and other touch screens)"],["on","On"],["off","Off"]].map(([v,l])=>`<option value="${v}" ${v===m?"selected":""}>${l}</option>`).join("")}</select></label>
    <p class="pl-note">Bigger buttons, a bigger hand, and Log, Menu and Full screen together at the bottom right. Games on a tablet open in full screen.${fsAvail()?"":" Full screen isn't available in this browser."} On an iPad, use Share, then Add to Home Screen, to play without Safari's bars.</p>`;
  host.appendChild(sec)}
document.addEventListener("change",e=>{if(!e.target.matches||!e.target.matches("[data-tabmode]"))return;ls.set(e.target.value);sync()});

window.CQTablet={after(){lobbySetting();sync()},sync,on:tabletOn,fullscreen:fsToggle};
setTimeout(sync,300);
})();
