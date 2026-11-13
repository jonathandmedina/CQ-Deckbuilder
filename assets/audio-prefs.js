/* Sound settings (Nov 13, 2026): Music and Sound Effects on/off + volume, shared by the Home page and the Play tab.
   - Saved in this browser: cq.music / cq.sound (on/off, unchanged keys) and cq.vol.music / cq.vol.sfx (0-100, default 100).
   - Controls: the Sound panel on Your account and on your own profile; a volume pop-up when you point at the
     Play tab's Effects or Music button; the tablet tray (play-tablet.js) uses the same controls.
   - Music plays through Web Audio when it can, because iPad Safari ignores <audio>.volume. */
(function(){
"use strict";
const KEYS={music:["cq.music","cq.vol.music"],sfx:["cq.sound","cq.vol.sfx"]};
const rd=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let ac=null;
function ctx(){if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){ac=null}}if(ac&&ac.state==="suspended")ac.resume().catch(()=>{});return ac}
["pointerdown","keydown"].forEach(t=>document.addEventListener(t,()=>{if(ac&&ac.state==="suspended")ac.resume().catch(()=>{})},{capture:true}));
const on=k=>rd(KEYS[k][0],true)!==false;
const vol=k=>{const v=+rd(KEYS[k][1],100);return isFinite(v)?Math.max(0,Math.min(100,Math.round(v))):100};
const level=k=>on(k)?vol(k)/100:0;
function emit(k){document.dispatchEvent(new CustomEvent("cq-vol",{detail:{kind:k}}));apply();refresh()}
function setOn(k,b){wr(KEYS[k][0],!!b);emit(k)}
function setVol(k,v){v=Math.max(0,Math.min(100,Math.round(+v||0)));wr(KEYS[k][1],v);if(v>0&&!on(k))wr(KEYS[k][0],true);emit(k)}
/* music elements: base loudness x the music volume */
const els=[];
function attach(el,base){if(!el||el._cqv)return el;el._cqv={base};els.push(el);
  try{const a=ctx();if(a&&a.createMediaElementSource){const src=a.createMediaElementSource(el),g=a.createGain();src.connect(g).connect(a.destination);el._cqv.g=g}}catch(e){}
  apply();return el}
function apply(){const v=vol("music")/100;els.forEach(el=>{const b=el._cqv.base*v;if(el._cqv.g){el._cqv.g.gain.value=b;try{el.volume=1}catch(e){}}else{try{el.volume=Math.max(0,Math.min(1,b))}catch(e){}}})}
/* the controls (same markup everywhere) */
const LBL={music:["🎵","Music"],sfx:["🔊","Sound effects"]};
function row(k){const o=on(k),v=vol(k);
  return`<div class="cqv-row" data-cqv="${k}"><label class="cqv-tog"><input type="checkbox" data-cqv-on="${k}" ${o?"checked":""}><span aria-hidden="true">${o?LBL[k][0]:"🔇"}</span> ${LBL[k][1]}</label>
    <input type="range" class="cqv-rng" min="0" max="100" step="5" value="${v}" data-cqv-vol="${k}" aria-label="${LBL[k][1]} volume" ${o?"":"aria-disabled=\"true\""}><output class="cqv-val">${o?v+"%":"Off"}</output></div>`}
function panel(title){return`<section class="panel cqv-panel"><h2>${title||"Sound"}</h2>${row("music")}${row("sfx")}<p class="note">Saved in this browser. Music plays on the Home page and during games; sound effects play during games.</p></section>`}
function refresh(){document.querySelectorAll(".cqv-row").forEach(r=>{const k=r.dataset.cqv,o=on(k),v=vol(k);const c=r.querySelector("[data-cqv-on]"),g=r.querySelector("[data-cqv-vol]"),out=r.querySelector(".cqv-val"),ic=r.querySelector(".cqv-tog span");
  if(c)c.checked=o;if(g&&document.activeElement!==g)g.value=v;if(g)g.toggleAttribute("aria-disabled",!o);if(out)out.textContent=o?v+"%":"Off";if(ic)ic.textContent=o?LBL[k][0]:"🔇"})}
document.addEventListener("input",e=>{const g=e.target.closest&&e.target.closest("[data-cqv-vol]");if(!g)return;setVol(g.dataset.cqvVol,g.value)});
document.addEventListener("change",e=>{const c=e.target.closest&&e.target.closest("[data-cqv-on]");if(!c)return;setOn(c.dataset.cqvOn,c.checked)});
/* a short test sound when you let go of the effects slider */
document.addEventListener("change",e=>{const g=e.target.closest&&e.target.closest('[data-cqv-vol="sfx"]');if(g&&window.CQSnd)try{CQSnd.play("chime")}catch(err){}});
/* hover pop-up: point at anything marked data-volpop="music|sfx" (the Play tab's Effects and Music buttons) */
let pop=null,popK=null,hideT=null;
function show(a){const k=a.dataset.volpop;clearTimeout(hideT);if(!pop||popK!==k){hide();pop=document.createElement("div");pop.className="cqv-pop";pop.setAttribute("role","group");pop.setAttribute("aria-label",LBL[k][1]+" volume");popK=k;pop.innerHTML=row(k);document.body.appendChild(pop)}
  const r=a.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;let top=r.bottom+6;if(top+h>innerHeight-8)top=Math.max(8,r.top-h-6);
  pop.style.top=top+"px";pop.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+"px"}
function hide(){clearTimeout(hideT);if(pop){pop.remove();pop=null;popK=null}}
const later=()=>{clearTimeout(hideT);hideT=setTimeout(hide,350)};
document.addEventListener("pointerover",e=>{if(e.pointerType==="touch")return;const a=e.target.closest&&e.target.closest("[data-volpop]");if(a){show(a);return}
  if(e.target.closest&&e.target.closest(".cqv-pop")){clearTimeout(hideT);return}if(pop)later()});
document.documentElement.addEventListener("pointerleave",()=>{if(pop)later()});
document.addEventListener("focusin",e=>{const a=e.target.closest&&e.target.closest("[data-volpop]");if(a){show(a);return}if(pop&&!(e.target.closest&&e.target.closest(".cqv-pop")))hide()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&pop)hide()});
addEventListener("hashchange",hide);addEventListener("scroll",()=>{if(pop)hide()},{passive:true,capture:true});
const css=`.cqv-panel{max-width:560px}.cqv-panel h2{margin-top:0}
.cqv-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:6px 0}
.cqv-tog{display:inline-flex;align-items:center;gap:6px;min-width:170px;cursor:pointer;font-weight:600}
.cqv-tog input{width:18px;height:18px;accent-color:#ffc100}
.cqv-rng{flex:1 1 160px;min-width:120px;accent-color:#ffc100}.cqv-rng[aria-disabled="true"]{opacity:.45}
.cqv-val{min-width:44px;text-align:right;font-variant-numeric:tabular-nums;color:#ffd98a}
.cqv-pop{position:fixed;z-index:160;width:300px;max-width:calc(100vw - 16px);padding:8px 12px;border-radius:12px;background:linear-gradient(#2e2216,#1b130c);border:2px solid #ffc100;box-shadow:0 12px 30px rgba(0,0,0,.6);color:#f3e6cf;font-size:.92rem}
.cqv-pop .cqv-tog{min-width:0}.cqv-pop .cqv-row{padding:2px 0;flex-wrap:nowrap}`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
window.CQVol={on,vol,level,setOn,setVol,attach,ctx,row,panel,refresh};
})();
