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
  b.innerHTML=`<button type="button" data-tb="help" aria-haspopup="dialog"><span class="ic" aria-hidden="true">❔</span>Help</button><button type="button" data-tb="log"><span class="ic" aria-hidden="true">📜</span>Log</button><button type="button" data-tb="menu"><span class="ic" aria-hidden="true">☰</span>Menu</button><button type="button" data-tb="fs"><span class="ic" aria-hidden="true">⛶</span><span class="lb">Full screen</span></button>`;
  b.addEventListener("click",e=>{const t=e.target.closest("[data-tb]");if(!t)return;e.stopPropagation();const U=window.CQPlay;const v=t.dataset.tb;
    if(v==="log"&&U){U.logHidden=!U.logHidden;U.render()}
    else if(v==="menu"){const m=document.getElementById("pl-menutab");if(m&&getComputedStyle(m).display!=="none"&&!document.documentElement.classList.contains("pl-portrait"))m.click();else if(document.documentElement.classList.contains("pl-portrait")){const R=document.documentElement;R.classList.toggle("pl-pmenu");const h=document.querySelector("header.top");if(h)R.style.setProperty("--pl-hdrh",h.offsetHeight+"px")}else if(m)m.click()}
    else if(v==="fs")fsToggle();
    else if(v==="help")helpBox();
    sync()});
  document.body.appendChild(b);return b}
function fsTab(){let t=document.getElementById("pl-fstab");if(t)return t;t=document.createElement("button");t.type="button";t.id="pl-fstab";t.title="Full screen (Esc to exit)";
  t.innerHTML='<span aria-hidden="true">⛶</span> <span class="lb">Full screen</span>';t.addEventListener("click",e=>{e.stopPropagation();fsToggle()});document.body.appendChild(t);return t}

function sync(){const U=window.CQPlay,root=document.documentElement;
  const inGame=location.hash==="#play"&&!!document.querySelector("#play-root .pl-game")&&!!(U&&U.mode==="game"&&U.s);
  const tab=inGame&&tabletOn();root.classList.toggle("pl-has-game",inGame);root.classList.toggle("pl-tablet",tab);
  /* a new game on a tablet starts with the log tucked away */
  if(tab&&U.gameKey&&U.gameKey!==sync.key){sync.key=U.gameKey;const big=innerWidth>=1300;if(U.logHidden===big){U.logHidden=!big;setTimeout(()=>U.render(),0)}}
  portrait(tab);if(!tab)hidePop();
  const b=document.getElementById("pl-tbar");
  if(tab){const bb=bar();const fsb=bb.querySelector('[data-tb="fs"]');fsb.hidden=!fsAvail();fsb.setAttribute("aria-pressed",String(!!fsEl()));fsb.querySelector(".lb").textContent=fsEl()?"Exit full screen":"Full screen";
    const hb=bb.querySelector('[data-tb="help"]');hb.hidden=!document.querySelector("#play-root .pl-help-b");hb.setAttribute("aria-expanded",String(!!document.getElementById("pl-helpbox")));
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

/* Game Help on tablets (Nov 13, 2026): the middle bar's Game Help menu moves to a Help button in the toolbar, which opens its own box */
function helpBox(){const old=document.getElementById("pl-helpbox");if(old){old.remove();sync();return}
  const src=document.querySelector("#play-root .pl-help-b"),root=document.getElementById("play-root");if(!src||!root)return;
  const box=document.createElement("div");box.id="pl-helpbox";box.setAttribute("role","dialog");box.setAttribute("aria-label","Game Help");
  box.innerHTML=`<div class="hb-h"><b>Game Help</b><button type="button" class="hb-x" aria-label="Close">✕</button></div><p class="hb-p">${/giveAction/.test(src.innerHTML)?"Fix something the game got wrong, or hand control to your opponent for a moment.":"Fix something the game got wrong."}</p><div class="hb-b">${src.innerHTML}</div>`;
  box.addEventListener("click",e=>{if(e.target.closest(".hb-x")){e.stopPropagation();box.remove();sync();return}if(e.target.closest("button"))setTimeout(()=>{box.remove();sync()},0)});
  root.appendChild(box);sync();const f=box.querySelector(".hb-b button");if(f)f.focus()}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){const b=document.getElementById("pl-helpbox");if(b){b.remove();sync()}}});
/* ===== Proposal 3: touch controls ===== */
const css3=`
html.pl-tablet #play-root .pl-mid .pl-help{display:none!important}
#pl-helpbox{position:fixed;right:max(12px,env(safe-area-inset-right,0px));bottom:calc(max(12px,env(safe-area-inset-bottom,0px)) + 62px);z-index:78;width:min(360px,calc(100vw - 24px));padding:14px 16px 16px;border-radius:14px;background:linear-gradient(#2e2216,#1b130c);border:2px solid #ffc100;box-shadow:0 16px 40px rgba(0,0,0,.7);color:#f3e6cf}
#pl-helpbox .hb-h{display:flex;align-items:center;justify-content:space-between;gap:10px;font:400 1.5rem/1 "Pirata One",var(--display);color:#ffc100}
#pl-helpbox .hb-x{all:unset;cursor:pointer;width:40px;height:40px;display:grid;place-items:center;border-radius:10px;font-size:1.2rem;color:#f3e6cf;border:2px solid #8A5E40}
#pl-helpbox .hb-p{margin:6px 0 12px;color:#d8c3a0;font-size:.95rem}
#pl-helpbox .hb-b{display:flex;flex-direction:column;gap:10px}
#pl-helpbox .hb-b .btn{min-height:46px!important;font-size:1.02rem!important;width:100%;justify-content:center}
html.pl-tablet.pl-portrait #pl-helpbox{top:calc(max(10px,env(safe-area-inset-top,0px)) + 60px);bottom:auto}
.tz-wrap{position:fixed;inset:0;z-index:140;display:grid;place-items:center;background:rgba(6,4,2,.6);animation:tzIn .15s ease-out both}
.tz-wrap .tz-card{width:min(420px,calc(68vh*.733),88vw)}.tz-wrap .tz-card .card{width:100%;margin:0}.tz-wrap .card .zoom,.tz-wrap .card .c-ctrl{display:none!important}
.tz-wrap .tz-hint{position:absolute;bottom:22px;left:0;right:0;text-align:center;color:#f3e6cf;font:600 .95rem/1 var(--body);text-shadow:0 2px 6px #000}
@keyframes tzIn{from{opacity:0}}
.tb-pop{position:fixed;z-index:72;display:flex;flex-wrap:wrap;gap:8px;padding:10px;border-radius:14px;background:linear-gradient(#2e2216,#1b130c);border:2px solid #ffc100;box-shadow:0 14px 34px rgba(0,0,0,.7);max-width:min(520px,94vw)}
.tb-pop .btn{min-height:44px!important;padding:0 14px!important;font-size:1rem!important}
.tb-pop .tb-who{flex:1 1 100%;font:600 .75rem/1 var(--body);letter-spacing:.1em;text-transform:uppercase;color:#c99566}
/* ===== Proposal 4: portrait ===== */
#pl-rotate{position:fixed;inset:0;z-index:150;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#3a2a1c,#120c08);color:#f3e6cf;text-align:center;padding:24px}
#pl-rotate .rt-ic{font-size:5rem;display:inline-block;animation:rtSpin 2.4s ease-in-out infinite}
#pl-rotate h2{font:400 2.2rem/1.1 "Pirata One",var(--display);color:#ffc100;margin:14px 0 8px}
#pl-rotate p{margin:0 0 18px;color:#d8c3a0;font-size:1.05rem}
#pl-rotate button{all:unset;cursor:pointer;color:#ffd98a;text-decoration:underline;font:600 1rem/1 var(--body);padding:12px}
@keyframes rtSpin{0%,20%{transform:rotate(0)}50%,70%{transform:rotate(-90deg)}100%{transform:rotate(0)}}
html.pl-tablet.pl-portrait header.top{display:none}
html.pl-tablet.pl-portrait.pl-pmenu header.top{display:block;position:fixed;top:0;left:0;right:0;z-index:80}
html.pl-tablet.pl-portrait #play-root .pl-handwrap{position:fixed;left:0;right:0;bottom:0;z-index:50;padding:8px 0 10px;background:linear-gradient(rgba(18,12,8,.0),#120c08 18%)}
html.pl-tablet.pl-portrait #play-root .pl-hand{padding-right:12px!important}
html.pl-tablet.pl-portrait #play-root .pl-hand .hc{flex-basis:clamp(130px,19vw,170px)!important}
html.pl-tablet.pl-portrait #play-root .pl-board{padding-bottom:calc(19vw * 1.36 + 40px)}
html.pl-tablet.pl-portrait #pl-tbar{top:max(10px,env(safe-area-inset-top,0px));bottom:auto}
html.pl-tablet.pl-portrait.pl-pmenu #pl-tbar{top:calc(var(--pl-hdrh,64px) + 10px)}
html.pl-tablet.pl-portrait #play-root .pl-side{bottom:auto!important;top:68px!important}
@media (prefers-reduced-motion:reduce){.tz-wrap{animation:none}#pl-rotate .rt-ic{animation:none}}`;
{const s3=document.createElement("style");s3.textContent=css3;document.head.appendChild(s3)}
const isTab=()=>document.documentElement.classList.contains("pl-tablet");
/* the card behind something on the board: a card in hand, a Hero, a summon, an item or a name in the log */
function cardFor(el){const U=window.CQPlay,s=U&&U.s,E=window.CQE;if(!s||typeof BYID==="undefined")return null;
  const lg=el.closest(".lgc[data-hc]");if(lg){const id=lg.dataset.hc;return BYID.get(id)||BYID.get("h:"+id)||BYID.get("t:"+id)}
  const hc=el.closest(".pl-hand .hc");if(hc){const c=s.p[U.me].hand.find(x=>x.uid===hc.dataset.u);return c?BYID.get(c.id):null}
  const ob=el.closest('[data-pa="obj"][data-u]');if(ob){const f=E.find(s,ob.dataset.u);if(!f||!f.o)return null;const o=f.o;
    if(o.fd&&o.owner!==U.me)return null; /* face-down Hidden cards stay hidden */
    return(o.id&&BYID.get(o.id))||(o.kind==="hero"&&BYID.get("h:"+o.name))||BYID.get("t:"+o.name)||BYID.get(o.name)||null}
  return null}
let zoomEl=null,holdT=null,hold=null,eatClick=0;
function zoomShow(c,tapToClose){zoomHide();if(!c||typeof cardHTML!=="function")return;const w=document.createElement("div");w.className="tz-wrap";w.setAttribute("role","dialog");w.setAttribute("aria-label",c.name||"Card");
  w.innerHTML=`<div class="tz-card">${cardHTML(c,{nozoom:1})}</div><div class="tz-hint">${tapToClose?"Tap anywhere to close":"Let go to close"}</div>`;
  if(tapToClose)w.addEventListener("click",e=>{e.stopPropagation();zoomHide()});document.body.appendChild(w);zoomEl=w;try{typeof fitArt==="function"&&fitArt(w)}catch(e){}}
function zoomHide(){if(zoomEl){zoomEl.remove();zoomEl=null}}
const HOLD_SEL='#play-root .pl-hand .hc,#play-root [data-pa="obj"][data-u],#play-root .pl-log .lgc[data-hc]';
/* press and hold: zoom the card full size; let go to close */
document.addEventListener("pointerdown",e=>{if(!isTab()||e.button>0)return;const el=e.target.closest&&e.target.closest(HOLD_SEL);if(!el)return;
  hold={x:e.clientX,y:e.clientY,el,id:e.pointerId};clearTimeout(holdT);
  holdT=setTimeout(()=>{if(!hold||document.querySelector(".hc-drag"))return;const c=cardFor(hold.el);if(!c)return;hold.shown=true;zoomShow(c,false);try{navigator.vibrate&&navigator.vibrate(12)}catch(err){}},430)},true);
/* moving cancels the hold; once a zoomed hand card starts moving, the zoom closes so the drag to play carries on */
document.addEventListener("pointermove",e=>{if(!hold||e.pointerId!==hold.id)return;if(Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>10){clearTimeout(holdT);if(hold.shown)zoomHide();hold=null}},true);
const holdEnd=e=>{clearTimeout(holdT);if(hold&&hold.shown){zoomHide();eatClick=Date.now()}hold=null};
document.addEventListener("pointerup",holdEnd,true);document.addEventListener("pointercancel",holdEnd,true);
document.addEventListener("contextmenu",e=>{if(isTab()&&e.target.closest&&e.target.closest(HOLD_SEL))e.preventDefault()},true);
document.addEventListener("click",e=>{
  /* the tap that ends a press-and-hold doesn't also act */
  if(Date.now()-eatClick<450&&e.target.closest&&e.target.closest(HOLD_SEL)){e.stopPropagation();e.preventDefault();return}
  if(!isTab()||!e.target.closest)return;
  /* tap a card name in the log: show that card */
  const lg=e.target.closest("#play-root .pl-log .lgc[data-hc]");if(lg){e.stopPropagation();e.preventDefault();zoomShow(cardFor(lg),true);return}
  /* tap your acting Hero: its actions in a bar right under it */
  const ob=e.target.closest('#play-root [data-pa="obj"][data-u]');if(ob&&!skipOnce){const U=window.CQPlay,s=U&&U.s;if(!s||U.tgt||(s.pend[0]&&s.pend[0].type==="manual"))return;
    const src=document.querySelector("#play-root .zs-acts");const a=window.CQE.actorFor(s,U.me);
    if(src&&a&&a.uid===ob.dataset.u){e.stopPropagation();e.preventDefault();showPop(ob,a,src);return}}
  if(!e.target.closest(".tb-pop"))hidePop()},true);
let skipOnce=false;
function showPop(ob,a,src){hidePop();const p=document.createElement("div");p.className="tb-pop";p.dataset.u=a.uid;
  /* the bar sits outside the board (which redraws), and each button presses the matching real button */
  const real=[...src.querySelectorAll("button")];
  p.innerHTML=`<span class="tb-who">${a.name}'s actions</span>`+real.map((b,i)=>{const c=b.cloneNode(true);c.removeAttribute("data-pa");c.removeAttribute("id");c.dataset.tbi=i;return c.outerHTML}).join("")+'<button type="button" class="btn" data-tbx="info">Details</button>';
  p.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;e.stopPropagation();const uid=p.dataset.u;hidePop();
    if(b.dataset.tbx==="info"){const o=document.querySelector(`#play-root [data-pa="obj"][data-u="${uid}"]`);if(o){skipOnce=true;o.click();skipOnce=false}return}
    const s2=document.querySelector("#play-root .zs-acts");const r=s2&&s2.querySelectorAll("button")[+b.dataset.tbi];if(r&&!r.disabled)r.click()});
  document.body.appendChild(p);place(p,ob)}
function place(p,ob){const r=ob.getBoundingClientRect(),w=p.offsetWidth,h=p.offsetHeight;
  let top=r.bottom+8;if(top+h>innerHeight-8)top=Math.max(8,r.top-h-8);p.style.top=top+"px";p.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+"px"}
function hidePop(){document.querySelectorAll(".tb-pop").forEach(p=>p.remove())}
/* ===== Proposal 4: portrait ===== */
function portrait(tab){const root=document.documentElement;const tall=tab&&innerHeight>innerWidth;let ok=false;try{ok=sessionStorage.getItem("cq.play.portrait")==="1"}catch(e){}
  root.classList.toggle("pl-portrait",tall&&ok);if(!tall)root.classList.remove("pl-pmenu");
  let r=document.getElementById("pl-rotate");
  if(tall&&!ok){if(!r){r=document.createElement("div");r.id="pl-rotate";r.setAttribute("role","dialog");r.setAttribute("aria-label","Turn your iPad sideways");
      r.innerHTML='<div><span class="rt-ic" aria-hidden="true">📱</span><h2>Turn your iPad sideways to play</h2><p>The board has two rows of three Heroes and your hand, so it fits best in landscape.</p><button type="button" data-rt="ok">Play in portrait anyway</button></div>';
      r.addEventListener("click",e=>{if(!e.target.closest('[data-rt="ok"]'))return;try{sessionStorage.setItem("cq.play.portrait","1")}catch(err){}r.remove();sync()});document.body.appendChild(r)}}
  else if(r)r.remove()}
/* after each redraw: keep the action bar on the same Hero if it can still act, otherwise close it */
function refreshPop(){const p=document.querySelector(".tb-pop");if(!p)return;const U=window.CQPlay,uid=p.dataset.u;const a=U&&U.s&&window.CQE.actorFor(U.s,U.me);
  const ob=uid&&document.querySelector(`#play-root [data-pa="obj"][data-u="${uid}"]`),src=document.querySelector("#play-root .zs-acts");
  if(!isTab()||!a||a.uid!==uid||!ob||!src||U.tgt){hidePop();return}showPop(ob,a,src)}
window.CQTablet={after(){lobbySetting();sync();refreshPop()},sync,on:tabletOn,fullscreen:fsToggle};
setTimeout(sync,300);
})();
