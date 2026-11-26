/* Riverstead Play tab: board UI, vs-AI games, and online rooms over Supabase Realtime.
   Online play is host-authoritative: the host's browser runs the rules engine and sends each player
   a redacted copy of the state (no peeking at the other hand or library). */
"use strict";
(function(){
const E=window.CQE,AI=window.CQAI;
const AS=()=>typeof S!=="undefined"?S:null;
const SCR=()=>window.CQ_SCRIPTS||{};
const U={mode:"lobby",s:null,me:0,vsAI:false,net:null,tgt:null,man:null,manT:null,aiT:null,logOpen:false,lobby:{bo:(()=>{try{return localStorage.getItem("cq.play.bo")==="3"?3:1}catch(e){return 1}})(),deck:"",ai:"starter:1",tab:"ai",code:"",t:{party:"",helpers:1,h:["ai","ai","ai"],watch:false}},busy:false,lastErr:""};
window.CQPlay=U;
const store2={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const cid=(()=>{let v=store2.get("cq.play.cid",null);if(!v){v="c"+Math.random().toString(36).slice(2,10);store2.set("cq.play.cid",v)}return v})();
const ROOT=()=>document.getElementById("play-root");
const isMine=pid=>pid===U.me;

/* ---------- styles ---------- */
const CSS=`
.pl-over{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:16px;background:rgba(6,8,14,.62);backdrop-filter:blur(2px);animation:plOverIn .25s ease}
@keyframes plOverIn{from{opacity:0}to{opacity:1}}
.pl-over-box{width:min(720px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--surface,#fff);color:var(--ink,inherit);border:1px solid var(--line,#ccc);border-radius:14px;padding:20px 22px;box-shadow:0 18px 50px rgba(0,0,0,.5)}
.pl-over-box h2{margin:0 0 4px;font-size:1.6rem}
.pl-over-why{margin:0 0 8px;color:var(--muted,#666)}
.pl-over-box .pl-stats{margin-top:10px}
.pl-over-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;justify-content:flex-end}
/* Nov 24: Best-of-3 sideboarding and replays */
.pl-match{font-size:.95rem}.pl-chbo{margin:0}
#pl-sb{z-index:2050}.pl-sbox{max-width:min(860px,96vw)!important}
.sb-heroes{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.sb-h{display:inline-flex;gap:6px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:4px 8px}
.sb-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}.sb-cols h3{margin:0 0 6px;display:flex;justify-content:space-between;font-size:1rem}
.sb-cols ul{list-style:none;margin:0;padding:0;max-height:46vh;overflow:auto}.sb-cols li{display:grid;grid-template-columns:2em 1fr auto auto;gap:6px;align-items:center;padding:2px 0;border-bottom:1px solid var(--line)}
.sb-cols li .c{font-size:.75rem;color:var(--muted)}.sb-sh{margin:0 0 6px}
@media (max-width:640px){.sb-cols{grid-template-columns:1fr}}
.rp-acts{flex-wrap:wrap}
html[data-skin="art"] .pl-over-box{background:linear-gradient(#2b1f15,#1b130c);color:#f3e6cf;border:2px solid #b8743a}
html[data-skin="art"] .pl-over-box h2{font-family:"Pirata One",var(--display);color:#ffc100;font-weight:400}
html[data-skin="art"] .pl-over-why{color:#d8c3a0}
@media (prefers-reduced-motion:reduce){.pl-over{animation:none}}
#play-root{--hero-w:minmax(0,1fr)}
.pl-lobby{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-top:18px}
.pl-plist{list-style:none;margin:8px 0;padding:0;max-height:260px;overflow-y:auto;border:1px solid var(--line,#3334);border-radius:8px}.pl-plist li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-bottom:1px solid var(--line,#3332)}.pl-plist li:last-child{border-bottom:0}.pl-pn{display:flex;flex-direction:column;min-width:0}.pl-pn b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pl-pn small{opacity:.7}
.pl-lobby .panel{margin-top:0}
.pl-lobby label{display:flex;flex-direction:column;gap:4px;font-size:.9rem;color:var(--muted)}
.pl-lobby select,.pl-lobby input{width:100%}
.pl-code{font-family:var(--display);font-size:2.2rem;font-weight:800;letter-spacing:.18em}
.pl-game{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;align-items:start;margin-top:12px}
.pl-board{display:flex;flex-direction:column;gap:10px;min-width:0}
.pl-game{position:relative}
.pl-game .pl-logshow{display:none}
.pl-game.nolog{grid-template-columns:minmax(0,1fr)}
.pl-game.nolog .pl-side{display:none}
.pl-game.nolog .pl-logshow{display:inline-flex;position:absolute;right:0;top:-38px;z-index:2}
.posm span.last{border-left:1px dashed var(--line)}
.band-list{display:flex;flex-direction:column;gap:6px;margin:8px 0}
.band-list .band-pick{text-align:left;justify-content:flex-start}
.band-total{font-size:1.05rem;margin:8px 0}
.tg.band,.ps .band{color:var(--ok)}
.pl-side{position:sticky;top:calc(env(safe-area-inset-top,0px) + 70px);display:flex;flex-direction:column;gap:10px;max-height:calc(100vh - 90px)}
.pl-log{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 12px;overflow:auto;font-size:.82rem;line-height:1.35;flex:1;min-height:200px}
.pl-log p{margin:0 0 3px}
.pl-log .lgc{text-decoration:underline dotted;text-underline-offset:2px;cursor:help}
.pl-log p.me{color:var(--ink)} .pl-log p.op{color:var(--muted)} .pl-log p.sys{color:var(--accent);font-weight:700;margin-top:6px}
.pl-side-h{display:flex;justify-content:space-between;align-items:center;gap:8px}
.pl-zone{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.pl-zside,.pl-zsin{display:contents}
.zs-acts{display:flex;flex-wrap:wrap;gap:5px;align-items:center}.zs-acts .zs-who{width:100%;font-weight:700}
.pl-zone .pl-bar{order:-1}
.pl-zone.op{background:color-mix(in srgb,var(--surface) 85%,var(--bg))}
.pl-bar{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;font-size:.88rem;color:var(--muted)}
.pl-bar b{color:var(--ink);font-variant-numeric:tabular-nums}
.pl-bar .nm{font-family:var(--display);font-size:1.1rem;font-weight:700;color:var(--ink);margin-right:4px}
.pl-bar .res{display:inline-flex;align-items:center;gap:5px;padding:2px 10px;border-radius:999px;background:var(--sunk);border:1px solid var(--line)}
.pl-bar .res.au{border-color:var(--accent);color:var(--ink)}
.pl-bar .init{background:var(--legend);color:#fff;border-color:var(--legend);font-weight:700}
.pl-bar button.res{cursor:pointer}
.pl-heroes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.ph{position:relative;cursor:pointer;border:1.5px solid var(--line);border-left:5px solid var(--cc);border-radius:12px;padding:8px 10px;background:var(--card-paper);color:var(--card-ink);display:flex;flex-direction:column;gap:4px;text-align:left;min-width:0;transition:transform .15s,opacity .15s}
.ph.ex{opacity:.72;transform:rotate(-1.5deg)}
.ph.dead{filter:grayscale(.35);opacity:.8}
.ph.actor{box-shadow:0 0 0 3px var(--ok)}
.ph.cand,.ps.cand,.pi.cand,.pp.cand{outline:3px solid var(--warn);outline-offset:2px;cursor:crosshair}
.ph.mansel,.ps.mansel,.pi.mansel{outline:3px dashed var(--accent);outline-offset:2px}
.ph-top{display:flex;justify-content:space-between;gap:6px;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.ph-top .mark{color:var(--ok);font-weight:800}
.ph-name{font-family:var(--display);font-weight:700;font-size:1.02rem;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ph-cls{font-size:.75rem;color:var(--muted);display:flex;gap:6px;align-items:center}
.ph-cls .dot{width:8px;height:8px;border-radius:50%;background:var(--cc)}
.hpbar{position:relative;height:16px;border-radius:5px;background:var(--sunk);border:1px solid var(--card-line);overflow:hidden}
.hpbar i{position:absolute;inset:0 auto 0 0;background:var(--ok);opacity:.8}
.hpbar.low i{background:var(--warn)}
.hpbar span{position:relative;display:block;text-align:center;font-size:.72rem;font-weight:700;line-height:15px;font-variant-numeric:tabular-nums}
.ph-stats{display:flex;gap:3px}
.ph-stats span{flex:1;text-align:center;border:1px solid var(--card-line);border-radius:5px;font-size:.66rem;letter-spacing:.06em;color:var(--muted);padding:1px 0;line-height:1.1}
.ph-stats b{display:block;font-size:.92rem;color:var(--card-ink);letter-spacing:0}
.ph-stats b.up{color:var(--ok)} .ph-stats b.dn{color:var(--warn)}
.tags{display:flex;flex-wrap:wrap;gap:3px}
.tg{font-size:.68rem;padding:0 6px;border-radius:999px;background:var(--sunk);border:1px solid var(--card-line);white-space:nowrap}
.tg.bad{border-color:var(--warn);color:var(--warn)}
.tg.cnt{border-color:var(--accent);color:var(--accent);font-variant-numeric:tabular-nums}
.pl-counts{display:flex;flex-wrap:wrap;gap:6px;font-size:.78rem}
.pl-counts .res{font-variant-numeric:tabular-nums}
.pl-concede{margin-left:auto}
.btn.pl-concede,.btn[data-pa=concede-yes]{background:#C0392B;border-color:#C0392B;color:#fff;font-weight:700}
.btn.pl-concede:hover,.btn[data-pa=concede-yes]:hover{filter:brightness(1.1)}
.pl-hand .hc .cb{position:absolute;left:8px;right:8px;bottom:36px;display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end}
.pl-hand .hc .cb span{font-size:.65rem;font-weight:700;padding:1px 6px;border-radius:999px;background:var(--surface);color:var(--accent);border:1px solid var(--accent);font-variant-numeric:tabular-nums}
.pl-hand .hc .cb span.cost{color:var(--ok);border-color:var(--ok)} .tg.good{border-color:var(--ok);color:var(--ok)}
.tg.eq{border-color:var(--cc,var(--card-line));cursor:pointer;background:none}
.pl-row{display:flex;gap:8px;flex-wrap:wrap;align-items:stretch}
.pl-row .lbl{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);align-self:center;width:92px;flex:none}
.ps{border:1.5px solid var(--cc,var(--line));border-radius:10px;padding:5px 8px;background:var(--card-paper);font-size:.8rem;min-width:96px;text-align:left;display:flex;flex-direction:column;gap:2px}
.ps b{font-family:var(--display);font-size:.9rem}
.ps-hp{display:block;margin-top:3px;height:5px;border-radius:3px;background:rgba(0,0,0,.45);box-shadow:inset 0 0 0 1px rgba(0,0,0,.35);overflow:hidden}
.ps-hp i{display:block;height:100%;border-radius:3px;transition:width .35s ease,background-color .35s}
/* arrival pop-in for new summons, Pillars and inventory items */
.arrive{animation:plArrive .7s cubic-bezier(.2,1.4,.4,1) both;position:relative}
.arrive::after{content:"";position:absolute;inset:-2px;border-radius:inherit;pointer-events:none;box-shadow:0 0 0 2px #ffe27a,0 0 16px 4px rgba(255,214,90,.75);animation:plArriveGlow .7s ease-out both;animation-delay:inherit}
@keyframes plArrive{0%{opacity:0;transform:translateY(-14px) scale(.6)}60%{opacity:1;transform:translateY(2px) scale(1.06)}100%{opacity:1;transform:none}}
@keyframes plArriveGlow{0%{opacity:0}30%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.arrive,.arrive::after{animation:none}}
.ps.ex{opacity:.6}
.pi{border:1.5px dashed var(--line);border-radius:10px;padding:5px 8px;min-width:96px;min-height:46px;font-size:.78rem;background:var(--surface);text-align:left;display:flex;flex-direction:column;justify-content:center}
.pi.full{border-style:solid;border-color:var(--cc,var(--line));background:var(--card-paper)}
.pi.fd{background:repeating-linear-gradient(45deg,var(--sunk),var(--sunk) 6px,var(--surface) 6px,var(--surface) 12px);border-color:var(--muted);font-style:italic}
.pp{border:1px solid var(--line);border-radius:999px;padding:3px 10px;font-size:.78rem;background:var(--sunk)}
.pl-mid{display:flex;flex-direction:column;gap:8px;border-radius:14px;padding:10px 14px;background:color-mix(in srgb,var(--accent) 9%,var(--surface));border:1.5px solid color-mix(in srgb,var(--accent) 45%,var(--line))}
.pl-mid.wait{background:var(--surface);border-color:var(--line)}
.pl-mid.opp{background:color-mix(in srgb,#C0392B 9%,var(--surface));border-color:color-mix(in srgb,#C0392B 55%,var(--line))}
.pl-oppinfo{display:flex;flex-wrap:wrap;gap:6px;font-size:.84rem}
.pl-oppinfo span{border:1px solid var(--line);border-radius:999px;padding:2px 9px;background:var(--surface)}
.pl-oppinfo b{font-variant-numeric:tabular-nums}
.pl-banner{display:flex;gap:10px;align-items:flex-end;border:1.5px solid var(--accent);border-radius:12px;padding:8px 10px;background:color-mix(in srgb,var(--accent) 12%,var(--surface))}
.pl-banner .bl{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;font-size:.88rem}
.pl-banner .bl b{font-size:.92rem}
.pl-banner .bl .hit{color:#C0392B;font-weight:600}
.pl-banner .btn{order:-1;align-self:flex-end;margin:0;flex:none}/* Dismiss sits at the bottom left, away from Concede */
.pl-stats{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--surface);display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;font-size:.86rem}
.pl-stats h3{margin:0 0 4px;font-size:.92rem}
.pl-stats ol{margin:0;padding-left:20px}
.pl-stats .dead{text-decoration:line-through;opacity:.7}
.tg.must{color:#C0392B;font-weight:700}
.pl-up{display:inline-flex;gap:4px;align-items:center;font-size:.86rem}
.pl-up select{font-size:.85rem}
.pl-phase{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;font-size:.88rem}
.pl-phase .ph-n{font-family:var(--display);font-weight:800;font-size:1.15rem}
.posm{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.posm span{padding:2px 10px;font-size:.78rem;color:var(--muted);background:var(--surface)}
.posm span.on{background:var(--ok);color:#fff;font-weight:700}
.pl-prompt{font-size:.98rem;font-weight:500}
.pl-acts{display:flex;flex-wrap:wrap;gap:6px}
.pl-acts .btn{font-size:.88rem;padding:5px 11px}
.pl-acts .btn.go{background:var(--ok);border-color:var(--ok);color:#fff}
.pl-acts .btn.atk{background:#C0392B;border-color:#C0392B;color:#fff;font-weight:700}
.pl-acts .btn.lv{background:#6B6F78;border-color:#6B6F78;color:#fff;font-weight:700}
.pl-acts .btn.lv-str{background:#C0392B;border-color:#C0392B}
.pl-acts .btn.lv-def{background:#2E7D4F;border-color:#2E7D4F}
.pl-acts .btn.lv-aura{background:#2C66C4;border-color:#2C66C4}
.pl-acts .btn .plus{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#F2C230;color:#3A2A00;font-weight:900;font-size:.95rem;line-height:1;margin-right:2px}
.pl-acts .btn.atk:hover,.pl-acts .btn.lv:hover{filter:brightness(1.1)}
.pl-acts .sep{width:1px;background:var(--line);margin:0 2px}
.pl-hand{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 10px;scroll-snap-type:x proximity}
.pl-hand .hc{flex:0 0 190px;scroll-snap-align:start;border:0;background:none;padding:0;text-align:left;position:relative}
.pl-hand .hc .card{height:100%;box-shadow:var(--shadow)}
.pl-hand .hc.ok .card{outline:3px solid var(--ok);outline-offset:-1px}
.pl-hand .hc .c-rules{font-size:.82rem}
.pl-hand .hc .auto{position:absolute;right:8px;bottom:8px;font-size:.65rem;font-weight:700;letter-spacing:.06em;padding:1px 6px;border-radius:999px;background:var(--sunk);color:var(--muted);border:1px solid var(--line)}
.pl-hand .hc .auto.m{color:var(--legend);border-color:var(--legend)}
.pl-hand .hc:has(.c-foot .zoom) .auto{right:40px}
.pl-hand-h{display:flex;justify-content:space-between;align-items:center;font-size:.8rem;color:var(--muted)}
.pl-man{border:1.5px solid var(--legend);border-radius:12px;padding:10px 12px;background:color-mix(in srgb,var(--legend) 8%,var(--surface));display:flex;flex-direction:column;gap:8px}
.pl-man .row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.pl-man select,.pl-man input{padding:4px 8px}
.pl-man input[type=number]{width:70px}
.pl-man .txt{font-size:.9rem;background:var(--surface);border-radius:8px;padding:6px 10px;border:1px solid var(--line)}
.ask-card{display:flex;flex-direction:column;gap:6px}.ask-card .btn{white-space:normal}
.pick-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
.pick-list .pk{border:0;background:none;padding:0;text-align:left;position:relative}
.pick-list .pk.on .card{outline:3px solid var(--ok);outline-offset:-1px}
.pick-list .pl-exh{position:relative;cursor:pointer;border-radius:12px;animation:plExh 1.6s ease-in-out infinite;box-shadow:0 0 0 3px #7fe0c8,0 0 18px 4px rgba(127,224,200,.75)}
.pick-list .pl-exh:focus-visible{outline:3px solid #ffc100;outline-offset:3px}
.pick-list .pl-exh .card{margin:0}
.pl-exh-tag{position:absolute;left:50%;bottom:-10px;transform:translateX(-50%);white-space:nowrap;font:700 .78rem/1 var(--body);padding:5px 10px;border-radius:999px;background:#466E6B;color:#eafff8;border:2px solid #7fe0c8;box-shadow:0 4px 10px rgba(0,0,0,.5)}
@keyframes plExh{0%,100%{box-shadow:0 0 0 3px #7fe0c8,0 0 12px 2px rgba(127,224,200,.55)}50%{box-shadow:0 0 0 3px #b5fff0,0 0 26px 8px rgba(127,224,200,.9)}}
@media (prefers-reduced-motion:reduce){.pick-list .pl-exh{animation:none}}
.pick-list .pk .badge{position:absolute;top:50px;right:8px;background:var(--ink);color:var(--surface);font-size:.7rem;font-weight:700;border-radius:999px;padding:1px 8px}
.pl-note{font-size:.8rem;color:var(--muted)}
.pl-legend{font-size:.78rem;color:var(--muted);display:flex;flex-wrap:wrap;gap:4px 12px}
@media (max-width:1000px){.pl-game{grid-template-columns:minmax(0,1fr)}.pl-side{position:static;max-height:none}.pl-log{max-height:260px}}
@media (max-width:620px){.pl-heroes{gap:5px}.ph{padding:6px 6px}.ph-name{font-size:.9rem}.ph-stats span{font-size:.58rem}.ph-stats b{font-size:.82rem}.pl-hand .hc{flex-basis:160px}.pl-row .lbl{width:100%}}

/* resources: Aura bar + Gold chip; deck piles on the right */
.pl-bar .pl-piles{margin-left:auto;display:inline-flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}
.pl-bar .res.aubar{position:relative;overflow:hidden;min-width:150px;padding:2px 12px;border:2px solid #3E7BFA;background:#0b1640;color:#fff;justify-content:center}
.pl-bar .res.aubar>i.fill{position:absolute;inset:0 auto 0 0;width:var(--ap,0%);background:linear-gradient(180deg,#8fd0ff,#2f6fe0 55%,#1d4fb8);transition:width .35s}
.pl-bar .res.aubar>*:not(.fill){position:relative}
.pl-bar .res.aubar b{color:#fff;text-shadow:0 1px 2px #000}
.pl-bar .res.aubar small{opacity:.9;text-shadow:0 1px 2px #000}
.pl-bar .res.gold{border:2px solid #8a5a00;background:linear-gradient(180deg,#ffe58a,#f5b82e 55%,#c98a12);color:#3a2206;font-weight:700}
.pl-bar .res.gold b{color:#3a2206}
.pl-bar .coin{display:inline-block;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff6c4,#ffcc3c 45%,#b97808 80%);box-shadow:inset 0 0 0 1.5px #6b4300;position:relative;flex:none}
.pl-bar .coin::after{content:"";position:absolute;inset:4px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(107,67,0,.55)}
/* Hero slots as card images */
.ph.hasart{align-items:stretch}
.ph.hasart .ph-card{width:100%;max-width:230px;margin:0 auto;perspective:1100px;container-type:inline-size}
.ph-inner{position:relative;transform-style:preserve-3d;transition:transform .6s}
.ph-face,.ph-back{backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:5%/3.6%;overflow:hidden;box-shadow:0 0 0 1px #000,0 4px 10px rgba(0,0,0,.45)}
.ph-face{position:relative;container-type:inline-size;background:#121218}
.ph-face>.zoom{position:absolute;top:17%;left:7%;width:26px;height:26px;border:1px solid rgba(255,255,255,.7);background:rgba(15,18,26,.72);color:#fff;z-index:3}
.ph-face .c-art{display:block;width:100%;height:auto;aspect-ratio:5/7}
.ph-back{position:absolute;inset:0;transform:rotateY(180deg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8%;
  background:radial-gradient(circle at 50% 45%,rgba(120,170,255,.28),transparent 55%),repeating-linear-gradient(45deg,rgba(255,255,255,.05) 0 6px,transparent 6px 12px),repeating-linear-gradient(-45deg,rgba(255,255,255,.05) 0 6px,transparent 6px 12px),linear-gradient(160deg,#1b2a6b,#0b1236 70%);
  border:4cqw solid #0a0e26;outline:1.2cqw solid #c9b27a;outline-offset:-5.5cqw}
.ph-back .gemb{width:22cqw;height:31cqw;margin-top:-14cqw;background:linear-gradient(135deg,#d6f1ff,#5fb0ff 45%,#2a4fc9 75%,#1a2a80);clip-path:polygon(50% 0,100% 38%,50% 100%,0 38%);filter:drop-shadow(0 0 3cqw rgba(140,200,255,.7));opacity:.85}
.ph-back .cqt{font-family:"Pirata One",var(--display);font-size:9cqw;letter-spacing:.06em;color:#e9d9a6;text-shadow:0 .6cqw .4cqw #000;text-align:center;line-height:1}
.ph-back .rib{position:absolute;left:0;right:0;bottom:9%;padding:2.5cqw 4cqw;background:rgba(120,18,18,.88);color:#fff;text-align:center;font-size:6.5cqw;font-weight:700;line-height:1.15;border-block:1px solid rgba(255,255,255,.35)}
.ph-back .rib small{display:block;font-size:.75em;font-weight:400;opacity:.9}
.ph-card.down .ph-inner{transform:rotateY(180deg)}
.ph-card.down.anim .ph-inner{animation:phflip .8s ease both}
.ph-card.anim:not(.down) .ph-inner{animation:phflip .8s ease reverse both}
@keyframes phflip{from{transform:rotateY(0)}to{transform:rotateY(180deg)}}
.ph.dead.hasart{filter:none;opacity:1}
.ph.ex.hasart .ph-face{filter:brightness(.72)}
/* live stat numbers on the card */
.ph-num{position:absolute;transform:translate(-50%,-50%);font-family:"Pirata One",var(--display);font-size:8.2cqw;line-height:1;color:#ffc100;-webkit-text-stroke:1.4cqw #000;paint-order:stroke fill;text-shadow:0 .4cqw .25cqw rgba(0,0,0,.85);background:none;border:0;padding:1cqw 2cqw;cursor:help;border-radius:3cqw;font-variant-numeric:tabular-nums;z-index:2}
.ph-num:hover,.ph-num:focus-visible,.ph-num.on{outline:.8cqw solid #fff;outline-offset:0;background:rgba(0,0,0,.35)}
.ph-num.up{color:#7be04f} .ph-num.dn{color:#ff5a5a}
.ph-num.bump{animation:phbump .7s ease}
@keyframes phbump{0%{transform:translate(-50%,-50%) scale(1)}35%{transform:translate(-50%,-50%) scale(1.6)}100%{transform:translate(-50%,-50%) scale(1)}}
.ph-pop{position:absolute;left:6%;right:6%;bottom:5%;z-index:3;background:rgba(10,12,28,.94);border:.8cqw solid #c9b27a;border-radius:3cqw;padding:3cqw 4cqw;color:#fff;font-family:Arial,sans-serif;font-size:5.4cqw;line-height:1.3;text-align:left;cursor:default}
.ph-pop h4{margin:0 0 1.5cqw;font-size:6.4cqw;font-family:var(--display)}
.ph-pop div{display:flex;justify-content:space-between;gap:3cqw}
.ph-pop div b{font-variant-numeric:tabular-nums}
.ph-pop .tot{border-top:1px solid rgba(255,255,255,.3);margin-top:1.5cqw;padding-top:1.5cqw;font-weight:700}
.ph.hasart .tags{justify-content:center}
.ph.hasart .hpbar{margin-top:auto}
/* Surrender soul: dark, gloomy button under a dead Hero */
html .ph .btn.soul-btn{margin-top:4px;width:100%;justify-content:center;font-family:inherit;font-size:.85rem;padding:5px 8px;color:#cfc6e6!important;letter-spacing:.04em;border:1px solid #3b3150!important;border-radius:6px!important;
  background:radial-gradient(120% 140% at 50% 0%,#3a2f52 0%,#1b1626 55%,#0c0a12 100%)!important;box-shadow:inset 0 0 10px rgba(0,0,0,.85),0 0 8px rgba(90,60,140,.35)!important;text-shadow:0 0 6px rgba(160,120,255,.5)!important}
html .ph .btn.soul-btn::before,html .ph .btn.soul-btn::after{display:none!important}
/* Update 42: Surrender a soul pop-up (starfield background, image buttons) */
html .modal .box.soul-box{width:min(380px,88vw);aspect-ratio:825/1125;max-height:92vh;background:#0b0710 url("assets/art/ui/soul-bg.webp") center/cover no-repeat!important;border:2px solid #3b3150!important;border-radius:8px;box-shadow:0 0 28px rgba(110,70,190,.45);color:#e9e2ff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:22px 18px;image-rendering:pixelated;overflow:auto}
html .modal .box.soul-box>h2:first-child{background:none!important;border:0!important;box-shadow:none!important;margin:0;color:#efe8ff;text-shadow:0 2px 0 #000,0 0 12px rgba(150,110,230,.7);text-align:center}
.soul-box .soul-note{font-size:.82rem;color:#cfc6e6;text-align:center;margin:0 4px 6px;text-shadow:0 1px 0 #000}
.soul-box .soul-who,.soul-box h3{margin:4px 0 0;color:#cfc6e6;font-size:.9rem;text-align:center;text-shadow:0 1px 0 #000}
.soul-box .soul-opts{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}
.soul-box .soul-opt{background:none;border:0;padding:0;cursor:pointer;width:min(240px,70%);line-height:0;transition:transform .12s,filter .12s}
.soul-box .soul-opt img{width:100%;height:auto;image-rendering:pixelated;display:block}
.soul-box .soul-opt:hover,.soul-box .soul-opt:focus-visible{transform:scale(1.05);filter:drop-shadow(0 0 8px rgba(160,120,240,.85));outline:none}
.soul-box .actions{margin-top:6px}
html .ph .btn.soul-btn:hover,html .ph .btn.soul-btn:focus-visible{color:#efe8ff!important;border-color:#6d55a3!important;box-shadow:inset 0 0 10px rgba(0,0,0,.85),0 0 14px rgba(130,90,210,.65)!important;filter:none}
/* a surrendered soul is greyed out for good */
.ph.surr{filter:grayscale(1);opacity:.45}
.ph.surr.hasart{filter:grayscale(1) brightness(.8);opacity:.6}
.ph.surr .ph-back .rib{background:rgba(60,60,64,.9)}
/* acting Hero's buttons under its card */
.ph .ph-acts{margin-top:6px;justify-content:center;gap:4px;cursor:default}
.ph .ph-acts .btn{font-size:.78rem;padding:4px 8px;flex:1 1 auto;justify-content:center}

/* ===== Card Art theme: compact Hero Cards ===== */
html[data-skin="art"] .ph.hk{padding:3px 4px 4px;gap:2px;background:transparent;border:0;box-shadow:none}
html[data-skin="art"] .ph.hk:hover,html[data-skin="art"] .ph.hk:focus-within{z-index:30}
html[data-skin="art"] .ph.hk .ph-top{font-size:.66rem;padding:0 2px;line-height:1.1}
html[data-skin="art"] .ph.hk.actor{box-shadow:none}
html[data-skin="art"] .ph.hk.actor .ph-face{animation:hkglow 1.6s ease-in-out infinite alternate;border-color:#ffb347}
@keyframes hkglow{0%{box-shadow:0 0 0 2px #000,0 0 0 4px #e8481c,0 0 10px 2px rgba(255,90,20,.55),0 0 22px 4px rgba(255,60,0,.25)}
  50%{box-shadow:0 0 0 2px #000,0 0 0 4px #ff8c1a,0 0 16px 5px rgba(255,140,30,.7),0 0 30px 8px rgba(255,80,0,.35)}
  100%{box-shadow:0 0 0 2px #000,0 0 0 4px #ffb347,0 0 20px 6px rgba(255,170,60,.75),0 0 38px 12px rgba(230,50,0,.4)}}
@media (prefers-reduced-motion:reduce){html[data-skin="art"] .ph.hk.actor .ph-face{animation:none;box-shadow:0 0 0 2px #000,0 0 0 4px #ff8c1a,0 0 16px 5px rgba(255,140,30,.7)}}
html[data-skin="art"] .zs-acts{margin-top:auto;position:sticky;bottom:0;display:flex;flex-wrap:wrap;align-items:center;gap:5px;padding:6px 0 2px;background:linear-gradient(transparent,var(--win,#2b1f15) 30%)}
html[data-skin="art"] .zs-acts .zs-who{font:400 .95rem "Pirata One",var(--display);color:#ffb347;margin-right:4px;width:100%}
html[data-skin="art"] .zs-acts .btn{padding:3px 10px;font-size:.88rem}
html[data-skin="art"] .ph.hk.actor::before{top:30px;left:-22px}
html[data-skin="art"] .ph.hk.cand{outline-offset:-1px}
.ph.hk .ph-card.hk-card{width:100%;max-width:none;margin:0;perspective:1100px;container-type:inline-size}
.ph.hk .ph-face{overflow:visible;border-radius:7px;background:#120c08;border:2px solid #b8743a;display:flex;flex-direction:column}
.ph.hk .ph-back{border-radius:7px}
.ph.hk .ph-back.sb{background:#0b0710 url("assets/art/ui/soul-bg.webp") center/cover no-repeat;border:2px solid #b8743a;outline:none;justify-content:flex-start;gap:4cqw;padding:0 0 4cqw;image-rendering:pixelated}
.ph.hk .ph-back.sb .sb-nb{width:100%;flex:none;box-sizing:border-box}
.ph.hk .ph-back.sb .sb-opts{display:flex;flex-direction:column;align-items:center;gap:2.5cqw;width:100%;margin-top:1cqw}
.ph.hk .ph-back.sb .sb-opt{background:none;border:0;padding:0;line-height:0;width:60%;cursor:default;filter:grayscale(1) brightness(.55);opacity:.7;transition:filter .2s,opacity .2s,transform .12s}
.ph.hk .ph-back.sb .sb-opt img{width:100%;height:auto;image-rendering:pixelated;pointer-events:none}
.ph.hk .ph-back.sb .sb-opt.on{filter:none;opacity:1;cursor:pointer;animation:sbglow 1.6s ease-in-out infinite alternate}
.ph.hk .ph-back.sb .sb-opt.on:hover,.ph.hk .ph-back.sb .sb-opt.on:focus-visible{transform:scale(1.05);outline:none}
@keyframes sbglow{from{filter:drop-shadow(0 0 1.5cqw rgba(160,120,240,.45))}to{filter:drop-shadow(0 0 4cqw rgba(170,130,255,.95))}}
@media (prefers-reduced-motion:reduce){.ph.hk .ph-back.sb .sb-opt.on{animation:none;filter:drop-shadow(0 0 3cqw rgba(170,130,255,.8))}}
.ph.hk .ph-back.sb .sb-who{margin-top:auto;font:400 6cqw/1.1 "Pirata One",var(--display);color:#cfc6e6;text-shadow:0 .5cqw 0 #000;text-align:center;padding:0 4cqw}
.ph.hk .ph-back.sb.sb-done .sb-nb{filter:grayscale(.85) brightness(.8)}
.ph.hk .ph-back .btn.soul-btn{position:absolute;left:6%;right:6%;bottom:30%;width:auto;margin:0;font-size:max(11px,5.5cqw);padding:3px 6px}
.hk-nb{display:flex;align-items:center;gap:2.5cqw;height:13.5cqw;padding:0 2.5cqw;background:linear-gradient(#0000,#0006),var(--cc);border-bottom:2px solid #b8743a;border-radius:5px 5px 0 0}
.hk-ci{height:76%;width:auto;flex:none;filter:drop-shadow(0 1px 0 #000);image-rendering:pixelated}
.hk-nm{flex:1;min-width:0;font:400 9.4cqw/1 "Pirata One",var(--display);color:#fff;text-shadow:0 .8cqw 0 #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.01em}
.hk-nm.l{font-size:8.2cqw}.hk-nm.xl{font-size:7.2cqw}
.hk-au{flex:none;min-width:9.5cqw;height:9.5cqw;padding:0 1cqw;border-radius:50%;border:1px solid #cfe9ff;background:radial-gradient(circle at 35% 30%,#bfe6ff,#2f86e0 55%,#123e8c);color:#fff;font:400 6.6cqw/1 "Pirata One",var(--display);text-shadow:0 1px 0 #000;cursor:help;display:grid;place-items:center}
.hk-au.up{color:#c9ff9a}.hk-au.dn{color:#ffb0b0}
.hk-au:hover,.hk-au:focus-visible{outline:2px solid #fff}
.hk-art{position:relative;line-height:0;overflow:hidden;background:#000}
.hk-art>img{display:block;width:100%;height:auto;aspect-ratio:207/167;image-rendering:pixelated}
.hk-art>.zoom{position:absolute;top:4%;left:3%;width:22px;height:22px;border:1px solid rgba(255,255,255,.7);background:rgba(15,18,26,.72);color:#fff;z-index:3;line-height:1}
.hk-tags{position:absolute;left:2%;right:2%;bottom:3%;display:flex;flex-direction:column;gap:2px;line-height:1.2;z-index:2;pointer-events:none}
.hk-tags .tags{justify-content:flex-start;pointer-events:auto}
html[data-skin="art"] .hk-tags .tg{font-size:max(10px,4.8cqw);background:rgba(16,10,6,.84);border-color:rgba(255,255,255,.35);color:#fff;padding:0 4px}
html[data-skin="art"] .hk-tags .tg.bad{border-color:#ff7a6a;color:#ffc4bb}
html[data-skin="art"] .hk-tags .tg.good{border-color:#7be04f;color:#c9ffb0}
.hk-art .ph-acts{position:absolute;left:2%;right:2%;top:3%;margin:0;line-height:1.1;z-index:4;flex-wrap:wrap;justify-content:flex-end}
.hk-art .ph-acts .btn{font-size:max(10px,5cqw);padding:2px 5px;flex:0 1 auto;box-shadow:0 2px 6px #000a}
.hk-st{display:grid;grid-template-columns:1fr 1fr 1fr 1.45fr;border-top:2px solid #b8743a;height:19cqw}
.hk-sq{border:0;border-right:1px solid #0009;padding:0;margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:help;color:#fff;font:inherit;min-width:0}
.hk-sq:first-child{border-radius:0 0 0 5px}
.hk-str{background:linear-gradient(#ffffff22,#0000 50%,#0003),#b3121a}
.hk-hp{background:linear-gradient(#ffffff22,#0000 50%,#0003),#7f7fd8}
.hk-def{background:linear-gradient(#ffffff22,#0000 50%,#0003),#3f9b3f}
.hk-sq b{font:400 12.5cqw/.9 "Pirata One",var(--display);color:#ffc100;-webkit-text-stroke:.9cqw #000;paint-order:stroke fill;text-shadow:0 .7cqw 0 #000}
.hk-sq i{font:700 max(8px,4.3cqw)/1.1 "EB Garamond",Georgia,serif;font-style:normal;letter-spacing:.06em;color:#fff;text-shadow:0 1px 0 #000;white-space:nowrap}
.hk-sq i small{font-size:.9em;letter-spacing:0;margin-left:1px}
.hk-sq.up b{color:#7be04f}.hk-sq.dn b{color:#ff5a5a}
.hk-sq:hover,.hk-sq:focus-visible,.hk-sq.on{outline:2px solid #fff;outline-offset:-2px;filter:brightness(1.12)}
.hk-sq.bump b{animation:hkbump .7s ease;display:inline-block}
@keyframes hkbump{0%{transform:scale(1)}35%{transform:scale(1.5)}100%{transform:scale(1)}}
.hk-ab{position:relative;display:flex;align-items:center;justify-content:center;background:linear-gradient(#3a2a1c,#22180f);font:700 max(8px,6.6cqw) "EB Garamond",Georgia,serif;color:#e2a865;cursor:help;border-radius:0 0 5px 0;letter-spacing:.03em}
.ph.dead .hk-ab{grid-column:1/-1}
.hk-ab:hover,.hk-ab:focus{background:linear-gradient(#5a3f22,#33231a);color:#ffd98a;outline:none}
.hk-tip{display:none;position:absolute;bottom:calc(100% + 6px);right:-2px;width:calc(100cqw + 0px);min-width:220px;padding:8px 10px;background:rgba(36,24,15,.97);border:2px solid #b8743a;border-radius:8px;box-shadow:0 6px 18px #000c;font:500 14px/1.35 "EB Garamond",Georgia,serif;color:#f3e6cf;letter-spacing:0;text-align:left;z-index:40;cursor:default;white-space:normal}
.hk-ab:hover .hk-tip,.hk-ab:focus .hk-tip{display:block}
.pl-zone.op .hk-tip{bottom:auto;top:calc(100% + 6px)}
.hk-tip p{margin:4px 0 0}.hk-tip img{height:1.1em;width:auto;vertical-align:-2px}
.hk-tt{display:block;font:400 18px/1.1 "Pirata One",var(--display);color:#ffc100}.hk-tt small{font:500 12px "EB Garamond",serif;color:#bfa888;margin-left:4px}
.ph.hk .ph-pop{bottom:21cqw}
.ph.ex.hk .hk-art>img{filter:brightness(.62) saturate(.8)}
.ph.ex.hk .ph-face{filter:none}
/* ===== Card Art theme: the whole game fits the window (no page scroll) ===== */
#pl-menutab{display:none}
@media (min-width:900px) and (min-height:560px){
html[data-skin="art"]:has(#play-root .pl-game) #pl-menutab{display:flex;align-items:center;gap:6px;position:fixed;top:0;right:max(12px,env(safe-area-inset-right,0px));z-index:60;padding:2px 14px 4px;border:2px solid var(--accent,#c79028);border-top:0;border-radius:0 0 10px 10px;background:linear-gradient(180deg,rgba(80,46,34,.98),rgba(52,28,22,.98));color:#f3e6cf;font:400 15px/1.2 "Pirata One",var(--display);letter-spacing:.04em;cursor:pointer;box-shadow:0 3px 8px #0009;transition:top .25s}
/* Nov 16: on computers, Menu and Full screen live in the game log tray (bottom right); the top tabs are hidden during a game */
#play-root .pl-ctl[data-pa="menu"]{display:none}
@media (min-width:900px) and (min-height:560px){html[data-skin="art"] #play-root .pl-ctl[data-pa="menu"]{display:inline-flex}}
html.pl-tablet #play-root .pl-ctl{display:none!important}
html.pl-has-game:not(.pl-tablet) #pl-menutab,html.pl-has-game:not(.pl-tablet) #pl-fstab{display:none!important}
html[data-skin="art"]:has(#play-root .pl-game) #pl-menutab:hover{color:#ffd98a}
html[data-skin="art"]:has(#play-root .pl-game) header.top{position:fixed;left:0;right:0;top:0;transform:translateY(-105%);transition:transform .25s;z-index:59}
html[data-skin="art"].pl-menu:has(#play-root .pl-game) header.top{transform:none}
html[data-skin="art"]:has(#play-root .pl-game) main .wrap{padding-block:6px 0;max-width:none}
html[data-skin="art"]:has(#play-root .pl-game) body{overflow:hidden}
html[data-skin="art"] #play-root .pl-game{grid-template-columns:minmax(0,1fr) 270px;gap:10px;margin-top:0;height:calc(100vh - 12px);height:calc(100dvh - 12px);align-items:stretch}
html[data-skin="art"] #play-root .pl-game.nolog{grid-template-columns:minmax(0,1fr)}
html[data-skin="art"] #play-root .pl-game.nolog .pl-logshow{top:4px;right:110px}
html[data-skin="art"] #play-root .pl-board{gap:6px;min-height:0}
html[data-skin="art"] #play-root .pl-side{position:static;max-height:none;height:100%;min-height:0;gap:6px}
html[data-skin="art"] #play-root .pl-side-h h2{font-size:1.1rem;margin:0}
html[data-skin="art"] #play-root .pl-side-h{flex-wrap:wrap;gap:4px}
html[data-skin="art"] #play-root .pl-side-h .actions{gap:4px;flex-wrap:wrap}
html[data-skin="art"] #play-root .pl-side-h .btn{padding:2px 8px;font-size:.85rem}
html[data-skin="art"] #play-root .pl-log{min-height:0}
html[data-skin="art"] #play-root .pl-legend{font-size:.72rem}
html[data-skin="art"] #play-root .pl-zone{display:grid;grid-template-columns:max-content minmax(0,1fr);column-gap:12px;padding:6px 10px}
html[data-skin="art"] #play-root .pl-zone>.pl-heroes{grid-column:1;grid-row:1;grid-template-columns:repeat(3,var(--hw,207px));gap:6px}
html[data-skin="art"] #play-root .pl-zone>.pl-zside{display:block;grid-column:2;grid-row:1;position:relative;min-width:0}
html[data-skin="art"] #play-root .pl-zsin{display:flex;flex-direction:column;gap:6px;position:absolute;inset:0;overflow:auto;scrollbar-width:thin;padding-right:2px}
html[data-skin="art"] #play-root .pl-zsin>.pl-bar{gap:4px 8px;font-size:.82rem;padding-top:2px}
html[data-skin="art"] #play-root .pl-zsin>.pl-bar .nm{font-size:1rem}
html[data-skin="art"] #play-root .pl-zsin>.pl-bar .res{padding:0 8px}
html[data-skin="art"] #play-root .pl-zsin>.pl-bar .pl-piles{margin-left:0}
html[data-skin="art"] #play-root .pl-zsin>.pl-row{font-size:.82rem;gap:4px;min-width:0}
html[data-skin="art"] #play-root .pl-zsin>.pl-row .lbl{width:100%}
html[data-skin="art"] #play-root .pl-zsin>.pl-row .pi{padding:2px 6px;font-size:.78rem}
html[data-skin="art"] #play-root .pl-mid{padding:5px 10px;gap:4px 14px;flex-direction:row;flex-wrap:wrap;align-items:center}
html[data-skin="art"] #play-root .pl-mid>*{flex:1 1 100%;min-width:0}
html[data-skin="art"] #play-root .pl-mid>.pl-phase{flex:0 1 auto;gap:6px 10px}
html[data-skin="art"] #play-root .pl-mid>.pl-prompt{flex:1 1 280px;font-size:.95rem;line-height:1.25}
html[data-skin="art"] #play-root .pl-mid .ph-n{font-size:1.05rem}
html[data-skin="art"] #play-root .pl-mid .posm span{padding:1px 8px;font-size:.74rem}
html[data-skin="art"] #play-root .pl-mid .btn{padding:3px 10px;font-size:.9rem}
html[data-skin="art"] #play-root .pl-mid .pl-endcol{flex-direction:row;align-items:center;gap:6px}
html[data-skin="art"] #play-root .pl-mid .pl-help>summary{padding:2px 6px}
html[data-skin="art"] #play-root .pl-mid .pl-help[open]>.pl-help-b{position:absolute;right:0;top:100%;z-index:40;min-width:240px;padding:8px;background:var(--win,#2b1f15);border:2px solid var(--accent,#c79028);border-radius:6px;box-shadow:0 8px 20px #000c}
html[data-skin="art"] #play-root .pl-mid .pl-banner{padding:4px 10px;font-size:.88rem;line-height:1.25}
html[data-skin="art"] #play-root .pl-mid .pl-banner .bl{max-height:5.2em;overflow:auto}
html[data-skin="art"] #play-root .pl-mid .pl-banner .btn{padding:2px 10px}
html[data-skin="art"] #play-root .pl-mid .pl-stats{max-height:46vh;overflow:auto}
html[data-skin="art"] #play-root .pl-mid{align-content:flex-start}
html[data-skin="art"] #play-root .pl-mid .pl-snd{padding:1px 8px;font-size:.8rem}
html[data-skin="art"] #play-root .pl-mid .pl-acts{gap:5px}
html[data-skin="art"] #play-root .pl-hand-h{font-size:.74rem;line-height:1.2}
html[data-skin="art"] #play-root .pl-hand{padding:2px 2px 4px;gap:8px}
html[data-skin="art"] #play-root .pl-hand .hc{flex-basis:var(--hcw,150px)}
}
/* Game Help expandable */
.pl-help{position:relative}
#play-root .btn.ab-off{opacity:.55;filter:grayscale(.6);border-style:dashed}
.pl-help>summary{cursor:pointer;list-style:none;font-size:.85rem;font-weight:700;color:var(--accent);padding:4px 8px;border-radius:8px;user-select:none;text-align:right}
.pl-help>summary::-webkit-details-marker{display:none}
.pl-help>summary::after{content:" ▾"}.pl-help[open]>summary::after{content:" ▴"}
.pl-help>summary:hover{text-decoration:underline}
.pl-help-b{display:flex;flex-direction:column;align-items:stretch;gap:4px;margin-top:4px}
/* hand scroller: visible bar + arrows only when cards are out of view */
.pl-handwrap{position:relative}
.pl-hand{scrollbar-width:thin}
.pl-hand::-webkit-scrollbar{height:10px}.pl-hand::-webkit-scrollbar-track{background:transparent}
.pl-hand.ovf::-webkit-scrollbar-thumb{background:var(--accent);border-radius:10px;border:2px solid transparent;background-clip:padding-box}
.pl-hand:not(.ovf)::-webkit-scrollbar{height:0}
.pl-hscr{position:absolute;top:50%;transform:translateY(-60%);z-index:3;width:38px;height:56px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font-size:1.6rem;line-height:1;cursor:pointer;box-shadow:var(--shadow);display:none;opacity:.92}
.pl-hscr:hover{opacity:1;filter:brightness(1.1)}
.pl-hscr.l{left:-6px}.pl-hscr.r{right:-6px}
.pl-handwrap.ovf-l .pl-hscr.l,.pl-handwrap.ovf-r .pl-hscr.r{display:block}
/* destroyed pop-up */
#pl-fx{position:fixed;inset:0;pointer-events:none;z-index:1500;display:grid;place-items:center}
#pl-fx .fxc{grid-area:1/1;width:min(260px,60vw);position:relative;animation:fxIn .28s ease-out both, fxShake .32s .3s ease-in-out 2, fxOut .6s 1.05s ease-in forwards}
#pl-fx .fxc>.card,#pl-fx .fxc>article,#pl-fx .fxc>*:first-child{width:100%;margin:0}
#pl-fx .fxc::after{content:"";position:absolute;inset:0;border-radius:12px;background:radial-gradient(circle at 50% 50%,rgba(255,80,40,.0) 0,rgba(255,60,30,.55) 70%);opacity:0;animation:fxFlash .5s .3s ease-out both}
#pl-fx .fxl{position:absolute;left:0;right:0;bottom:-38px;text-align:center;font-weight:900;letter-spacing:.12em;color:#fff;text-shadow:0 2px 6px #000,0 0 12px #c0392b;font-size:1.05rem}
#pl-fx .fxbox{background:var(--card-paper);color:var(--card-ink);border:2px solid var(--line);border-radius:12px;padding:22px 14px;text-align:center;font-weight:800;font-size:1.1rem}
@keyframes fxIn{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes fxShake{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(-8px) rotate(-3deg)}75%{transform:translateX(8px) rotate(3deg)}}
@keyframes fxFlash{0%{opacity:0}40%{opacity:1}100%{opacity:.35}}
@keyframes fxOut{0%{transform:scale(1) rotate(0);opacity:1;filter:none}100%{transform:scale(.6) translateY(120px) rotate(18deg);opacity:0;filter:grayscale(1) blur(2px)}}
@media (prefers-reduced-motion:reduce){#pl-fx .fxc{animation:fxIn .2s both, fxOut .4s 1s forwards}#pl-fx .fxc::after{animation:none}}
.pl-snd{display:inline-flex;align-items:center;gap:5px;margin-left:auto}
.pl-side-h .pl-snd{margin-left:0}
/* Rules fix stacked above Concede at the right */
/* Nov 19: view-board tab, Echo glow and order, spectating */
.pl-viewboard{float:right;margin:-4px -4px 6px 8px}
#pl-modtab,.pl-towntab{position:fixed;left:50%;bottom:0;transform:translateX(-50%);z-index:75;display:flex;align-items:center;gap:10px;max-width:min(620px,94vw);padding:8px 16px 10px;border-radius:12px 12px 0 0;border:2px solid #f2c14e;border-bottom:0;background:#1d1209;color:#f6e7c8;font:inherit;cursor:pointer;box-shadow:0 -4px 18px #000a;animation:mtPulse 1.6s ease-in-out infinite}
#pl-modtab .mt-k,.pl-towntab .mt-k{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#f2c14e}
#pl-modtab b,.pl-towntab b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:380px}
#pl-modtab .mt-o,.pl-towntab .mt-o{margin-left:auto;font-weight:800;color:#f2c14e}
@keyframes mtPulse{0%,100%{box-shadow:0 -4px 18px #000a}50%{box-shadow:0 -4px 22px #f2c14e88}}
.res.echo-z{opacity:.55}
.res.echo-z.on{opacity:1;border-color:#9fd3ff!important;background:#123a5c!important;color:#dff1ff!important;box-shadow:0 0 0 2px #4aa8ff66,0 0 14px #4aa8ffaa;animation:echoGlow 1.8s ease-in-out infinite}
@keyframes echoGlow{0%,100%{box-shadow:0 0 0 2px #4aa8ff55,0 0 8px #4aa8ff77}50%{box-shadow:0 0 0 2px #4aa8ffaa,0 0 18px #4aa8ffdd}}
.echo-list{list-style:none;margin:8px 0;padding:0;display:flex;flex-direction:column;gap:8px}
.echo-list li{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:6px 8px}
.echo-list .eo-n{font-size:1.4rem;font-weight:900;text-align:center;color:#4aa8ff}
.echo-list .eo-c .card{transform:scale(.5);transform-origin:top left;width:240px;height:160px}
.echo-list .eo-c{width:120px;height:168px;overflow:hidden}
.echo-list .eo-b{display:flex;flex-direction:column;gap:4px}
.pl-specbar .pl-prompt{font-weight:700}
/* Nov 19: target pop-up and picked targets */
.pl-tpop{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:70;min-width:260px;max-width:min(560px,92vw);background:#1d1209;color:#f6e7c8;border:2px solid #f2c14e;border-radius:12px;padding:8px 14px;box-shadow:0 6px 24px #000a;text-align:center;animation:tpIn .18s ease-out}
.pl-tpop .tp-h{font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:#f2c14e}
.pl-tpop .tp-w{font-size:1.02rem;font-weight:700;margin:2px 0}
.pl-tpop .tp-n{display:inline-block;min-width:2.4em;margin-left:6px;padding:0 6px;border-radius:8px;background:#f2c14e;color:#1d1209}
.pl-tpop .tp-s{font-size:.8rem;color:#c9b38a}
.pl-tpop .tp-a{display:flex;gap:6px;justify-content:center;margin-top:4px}
@keyframes tpIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
.tpicked{outline:3px solid #f2c14e!important;outline-offset:2px;box-shadow:0 0 0 6px #f2c14e55,0 0 18px #f2c14e!important}
.tpicked::after{content:"✓ " attr(data-pn);position:absolute;top:38px;right:10px;z-index:5;background:#f2c14e;color:#1d1209;font:800 .8rem/1 system-ui,sans-serif;padding:3px 6px;border-radius:9px;pointer-events:none}
/* Nov 19: repeated trigger prompts */
.ask-box{position:relative;padding-bottom:18px;animation:askIn .25s ease-out}
.ask-n{position:absolute;right:0;bottom:0;font-size:.75rem;font-weight:700;opacity:.85}
.ask-amt{display:flex;align-items:center;justify-content:center;gap:8px;margin:6px 0 2px}
.ask-amt .btn{min-width:40px;padding:6px 10px}
.ask-amt b{font-size:1.6rem;min-width:2ch;text-align:center}
.ask-amt-of{opacity:.75}
.ask-amt-hint{text-align:center;margin:2px 0 8px;opacity:.8;font-size:.85rem}
@keyframes askIn{from{opacity:.15;transform:translateY(4px)}to{opacity:1;transform:none}}

.pl-acts{align-items:center}
.pl-endcol{margin-left:auto;display:inline-flex;flex-direction:column;align-items:stretch;gap:4px}
.pl-endcol .pl-concede{margin-left:0}
.pl-acts .btn.pass{display:inline-flex;align-items:center;gap:6px}
.pass-ico{flex:none}
`;
/* Hero highlight: point at (or focus) one of your Heroes to light up the hand cards it can play (its class or Generic) */
function heroHL(ph){const hand=document.querySelector(".pl-hand");if(!hand)return;const note=document.querySelector(".pl-hand-h .hl-note");
  const s=U.s&&view&&view();const pl=s&&s.p&&s.p[U.me];const h=ph&&pl&&(pl.heroes||[]).find(x=>x.uid===ph.dataset.u);
  if(!h||h.dead){hand.classList.remove("for-hero");hand.querySelectorAll(".hc.fits").forEach(e=>e.classList.remove("fits"));if(note)note.textContent="outline = playable now · point at one of your Heroes to see the cards it can play";return}
  /* only the acting Hero can play cards, and only ones you have the Aura for (the legal "ok" cards) */
  const act=s&&s.phase==="battle"&&s.prio===U.me&&!s.pend.length?E.actorFor(s,U.me):null;
  let n=0;hand.classList.add("for-hero");hand.querySelectorAll(".hc").forEach(e=>{const ok=!!act&&act.uid===h.uid&&e.classList.contains("ok");e.classList.toggle("fits",ok);if(ok)n++});
  if(note)note.textContent=act&&act.uid===h.uid?`${h.name} can play ${n} of these now`:act?`${h.name} isn't acting now · only ${act.name} can play cards`:`${h.name} can't play cards right now`}
["mouseover","focusin"].forEach(ev=>document.addEventListener(ev,e=>{const ph=e.target.closest&&e.target.closest(".ph[data-u]");if(ph)heroHL(ph)}));
["mouseout","focusout"].forEach(ev=>document.addEventListener(ev,e=>{const ph=e.target.closest&&e.target.closest(".ph[data-u]");if(ph&&!(e.relatedTarget&&ph.contains(e.relatedTarget)))heroHL(null)}));
const TCSS=`/* Trials board (Plan B+C): boss bar, Golems, compact helper parties */
.tr-boss{border:2px solid #8a3b2a;border-radius:12px;padding:8px 12px;background:linear-gradient(#3a1d16,#22120d);display:grid;gap:6px;margin-bottom:8px}
.tr-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;font-size:.9rem;border-radius:10px;padding:2px 4px;border:2px solid transparent}
.tr-bar.cand{cursor:pointer;border-color:rgba(255,138,112,.55);background:rgba(255,138,112,.07)}
.tr-bname{all:unset;cursor:pointer;font:700 1.05rem/1.2 var(--display,var(--body));color:#f7d9a8;padding:2px 8px;border-radius:8px;border:2px solid transparent}
.tr-bname.cand{border-color:var(--warn,#FF8A70);box-shadow:0 0 0 3px rgba(255,138,112,.35)}
.tr-hp{display:inline-flex;align-items:center;gap:6px}.tr-hpb{display:inline-block;width:180px;max-width:38vw;height:12px;border-radius:6px;background:rgba(0,0,0,.45);overflow:hidden;border:1px solid #6d3a2a}
.tr-hpb i{display:block;height:100%;background:linear-gradient(90deg,#d4402c,#e58b3a)}
.tr-pips{display:inline-flex;gap:3px;vertical-align:middle}.tr-pips i{width:11px;height:11px;border-radius:50%;border:1px solid #c99566;background:rgba(0,0,0,.4)}
.tr-pips i.plate.on{background:#9aa6b2;border-color:#dfe7ee}.tr-pips i.rage.on{background:#e0442c;border-color:#ffb199}
.tr-tag{font-size:.75rem;padding:1px 7px;border-radius:6px;border:1px solid currentColor}.tr-tag.wind{color:#8fd3ff}.tr-tag.skin{color:#d9c38a}.tr-tag.st{color:var(--warn,#FF8A70)}
.tr-flip{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:.82rem;color:var(--muted,#D3BC9F)}
.tr-golems{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:flex-start}.tr-golems>.lbl,.tr-gcol>.lbl{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#c99566}
.tr-gcol{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.tr-golem.dim{opacity:.45;filter:saturate(.5)}.tr-golem.dim .ps{cursor:not-allowed}
.tr-helpers{display:grid;gap:8px;margin-bottom:8px}.tr-helpers.n2{grid-template-columns:repeat(2,minmax(0,1fr))}.tr-helpers.n3{grid-template-columns:repeat(3,minmax(0,1fr))}
.tr-helper{min-width:0;overflow:hidden}.tr-helper .pl-zone{zoom:.62}
.tr-lobby .tr-check{display:flex;gap:8px;align-items:center;margin-top:8px}.pl-ltabs{margin:6px 0 10px}
.tr-loot-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin-bottom:8px}.tr-loot-pick label{display:grid;gap:4px;font-size:.85rem}
.tr-loot{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:10px 0}.tr-loot .lc{display:grid;gap:6px}.tr-loot select{width:100%}
@media (max-width:760px){.tr-helpers.n2,.tr-helpers.n3{grid-template-columns:minmax(0,1fr)}.tr-helper .pl-zone{zoom:.8}.tr-hpb{width:110px}.tr-bar{gap:6px 10px;font-size:.84rem}}
`;
function injectCSS(){if(document.getElementById("pl-css"))return;const st=document.createElement("style");st.id="pl-css";st.textContent=CSS+TCSS;document.head.appendChild(st)}

/* ---------- decks ---------- */
const STARTERS=[
  {name:"Ember & Steel (starter)",heroes:["Ember Mage","Divine Knight","Arnett Lifebinder"]},
  {name:"Wild Hunt (starter)",heroes:["Warden of the Woods","Hawkeye","Bar-Bear Ian"]},
  {name:"Shadow Pact (starter)",heroes:["Dark Fang","Dark Channeler","Venom Dancer"]},
  {name:"Grand Stage (starter)",heroes:["Echo Performer","Storm Caller","Sun Paladin"]},
  {name:"Iron Vanguard (starter)",heroes:["Rage Brute","Radiant Sentinel","Dawn Priest"]}];
const STARTER_LISTS=[
 {"Flame Jab":3,"Lightning Bolt":3,"Volt Jab":3,"Flame Lance":3,"Ice Jab":3,"Arcane Study":3,"Power Thrust":3,"Conscript":3,"Shield Wall":3,"Knight's Sword":2,"Bronze Chest Plate":2,"Shield Bash":3,"Healing Touch":3,"Light Helix":3,"Inspiration":3,"Potion":3,"Healing Beam":2,"Ice Lance":2},
 {"Rootfolk":3,"Wolves":3,"Elk":3,"Jess' Choice":3,"Serrated Arrow":3,"Flame Bolt":3,"Deeg-Arrow":2,"Dual Shot":3,"Full Draw":2,"Longbow":2,"Spike Pit":3,"Pump":3,"Great Axe":2,"Bloodthirst":3,"Battered":3,"Potion":3,"Sword of Riverstead":3,"Heavy Beast":2,"Blunt Force":1},
 {"Armed":3,"Toxic Cloud":3,"Surprise Attack":3,"Long Dagger":2,"Thief's Dagger":2,"Envenom":2,"Dark Jab":3,"Dark Lance":3,"Ritual of Pain":3,"Draw Life":3,"Weaken":3,"Shadow Strike":3,"Ritual of Fang":3,"Blademaster's Choice":3,"Inspiration":2,"Potion":3,"Mark of Doom":2,"Frailty":2,"Flick Dagger":2},
 {"\"Ballad of Blades\"":3,"Embolden":3,"\"Sing Along\"":3,"\"Song of Healing\"":3,"\"Call and Response\"":3,"War Lute":2,"Flame Jab":3,"Ice Lance":3,"Lightning Bolt":3,"Boost Ritual":3,"Power Thrust":3,"Tower Shield":2,"Conscript":3,"Radiant Strike":3,"Potion":3,"Sword of Riverstead":3,"Shield Bash":2,"Volt Jab":2},
 {"Pump":3,"Blunt Force":3,"Great Axe":2,"Bloodthirst":3,"Battered":3,"Unstoppable":3,"Blockade":3,"Bronze Chest Plate":2,"Tower Shield":2,"Power Thrust":3,"Rally the Troops":2,"Healing Beam":3,"Mace of Dawn":2,"Light Blast":3,"Healing Touch":3,"Long Sword":2,"Potion":3,"Inspiration":3,"Pummel":2}];
function starterDeck(i){const st=STARTERS[i];return{id:"starter:"+i,name:st.name,heroes:st.heroes.map(n=>"h:"+n),cards:Object.assign({},STARTER_LISTS[i])}}
U.starterDeck=starterDeck;
/* Trials: five built-in 2-Hero helper parties, each a split of a starter deck (play-trials.js builds them) */
U.TRIALS_STARTERS=window.CQT&&CQT.trialsStarters?CQT.trialsStarters(STARTERS,STARTER_LISTS):[];
window.CQTrialsStarters=()=>U.TRIALS_STARTERS; /* Nov 23: Admin → Trials shows these */
/* ---------- Trials: the co-op boss module (Plan B+C). Only for accounts with Trials access (admins always). ----------
   One player (party 0) plus 1 to 3 AI helper parties against the boss; or "watch mode", where the AI plays every party.
   Trials games are saved under cq.play.trials (not cq.play.local) and are never recorded to deck_results. */
const TKEY="cq.play.trials";
const nHeroes=d=>((d&&d.heroes)||[]).filter(Boolean).length;
const isParty=d=>typeof isTrialsDeck==="function"?isTrialsDeck(d):nHeroes(d)===2;
function partyChoices(){const out=[];const mine=((AS()&&S.decks)||[]).filter(d=>isParty(d)&&nHeroes(d)===2);
  mine.forEach(d=>{const bad=E.validateDeck(d,{trials:true});out.push({id:d.id,name:d.name+(bad.length?" (not legal: "+bad[0]+")":""),ok:!bad.length,deck:d})});
  if(AS()&&S.deck&&isParty(S.deck)&&nHeroes(S.deck)===2&&!mine.some(d=>d.id===S.deck.id)){const bad=E.validateDeck(S.deck,{trials:true});out.push({id:"draft",name:"Current draft: "+(S.deck.name||"Untitled")+(bad.length?" (not legal)":""),ok:!bad.length,deck:S.deck})}
  return out}
function trialRun(){const r=store2.get("cq.trials.run",null);return r&&r.trial&&r.loot?r:null}
function startTrial(again){const L=U.lobby.t;const pc=partyChoices();let you=(pc.find(c=>c.id===L.party&&c.ok)||{}).deck;
  if(again&&U.lastTrial)return startTrialWith(U.lastTrial,true);
  if(!you&&!L.watch){toast("Choose a legal Trials party (2 Heroes, at least 50 cards).");return}
  const used=new Set();const ST=U.TRIALS_STARTERS;
  const pickAI=()=>{const pool=ST.filter(p=>!used.has(p.id));const p=pool.length?pool[(Math.random()*pool.length)|0]:ST[0];used.add(p.id);return p};
  if(!you)you=pickAI();
  const helpers=[];for(let i=0;i<Math.max(1,Math.min(3,L.helpers|0));i++){const v=L.h[i]||"ai";const d=v==="ai"?pickAI():((pc.find(c=>c.id===v&&c.ok)||{}).deck||pickAI());helpers.push({name:`Helper ${i+1} · ${String(d.name||"Party").replace(/ party \(Trials\)$/,"")}`,ai:true,deck:d})}
  startTrialWith({you,helpers,watch:!!L.watch},false)}
function startTrialWith(cfg,again){U.lastTrial=cfg;const run=trialRun(); /* a run's loot goes to the same seats (you = party 0, then Helper 1, 2, 3) */const loot=run?run.loot:null;
  clearTimeout(U.aiT);
  U.s=E.newGame({seed:(Math.random()*2**31)|0,trials:{trial:1,parties:[{name:myName(),ai:cfg.watch,deck:cfg.you},...cfg.helpers],loot:loot||undefined}});
  U.meta=null;U.gameKey="g"+Date.now();U.me=0;U.vsAI=true;U.trialsWatch=cfg.watch;U.net=null;U.mode="game";U.tgt=null;U.man=null;U.overHide=false;U.lootPick=null;U.evFor=null;
  saveLocal();render();pumpAI()}
U.startTrial=startTrial;
/* the AI plays the helpers (and party 0 in watch mode); in a 1-on-1 game it plays side 1 only, exactly as before */
function aiPids(s){if(!s.trials)return[1];return s.p.map((_,i)=>i).filter(i=>!E.isBoss(s,i)&&(s.p[i].ai||(i===0&&U.trialsWatch)))}
function nextAI(s){for(const pid of aiPids(s)){const a=AI.choose(s,pid);if(a)return{pid,a}}return null}
U.stepAI=function(){const s=U.s;if(!s||s.over)return false;const n=nextAI(s);if(!n)return false;const r=E.act(s,n.pid,n.a);
  if(!r.ok){const f=E.options(s,n.pid).find(o=>["pass","decline","dawnDone","leave","keep","manDone"].includes(o.type));if(f)E.act(s,n.pid,f)}return true};
function bossPips(n,max,cls,title){let o="";for(let i=0;i<max;i++)o+=`<i class="${cls}${i<n?" on":""}"></i>`;return`<span class="tr-pips" title="${esc(title)}">${o}</span>`}
function bossHTML(s){const T=window.CQT;const b=T.bossState(s);const st=s.trials;const h=T.bossHero(s);
  const cands=U.tgt?new Set(U.tgt.slots[U.tgt.i].cands):new Set();
  const pct=Math.max(0,Math.min(100,b.hp/Math.max(1,b.max)*100));
  const tags=[b.winded?'<span class="tr-tag wind" title="0 Defense until its next turn">Winded</span>':"",b.skin?`<span class="tr-tag skin" title="+${b.skin} Defense until its next turn">Stone Skin</span>`:"",
    ...E.STATUS.filter(k=>h.st[k]).map(k=>`<span class="tr-tag st">${E.STATUS_NAME[k]} ${h.st[k]}</span>`)].join("");
  const left=Math.max(0,b.rageAt-b.rage);
  const one=f=>f.kind==="stampede"?`<b>Raging Stampede</b> → every player Hero`:f.kind==="skip"?"skipped (Stunned or exhausted)":`<b>${esc(f.card)}</b>${f.targets.length?" → "+f.targets.map(esc).join(", "):""}`;
  const lf=b.lastTurn&&b.lastTurn.length?b.lastTurn.map(one).join(" · "):"none yet";
  const golems=b.spawns.slice().sort((x,y)=>(y.pid===U.me)-(x.pid===U.me)||x.pid-y.pid).map(g=>{const nm=g.pid===U.me?"You":esc(s.p[g.pid].name.replace(/ · .*$/,""));
    const list=s.p[st.boss].bf.filter(o=>o.spawn&&o.fl.vs===g.pid).map(o=>{const okT=E.trialsTargetOk(s,U.me,o);const html=summonHTML(s,o,okT?cands:new Set());
      return okT?`<span class="tr-golem">${html}</span>`:`<span class="tr-golem dim" title="Deal with your own Golem first.">${html}</span>`}).join("");
    return`<div class="tr-gcol"><span class="lbl">vs ${nm}</span>${list||'<span class="pl-note">—</span>'}</div>`}).join("");
  return`<section class="tr-boss" aria-label="${esc(b.name)}">
    <div class="tr-bar${cands.has(h.uid)?" cand":""}"${cands.has(h.uid)?` data-pa="obj" data-u="${h.uid}" title="Tap anywhere on the boss bar to target ${esc(b.name)}"`:""}><button type="button" class="tr-bname${cands.has(h.uid)?" cand":""}" data-pa="obj" data-u="${h.uid}" title="${esc(b.name)} (an enemy, not a Hero)">${esc(b.name)}</button>
      <span class="tr-hp" role="img" aria-label="${b.hp} of ${b.max} Health Points"><span class="tr-hpb"><i style="width:${pct.toFixed(1)}%"></i></span><b>${b.hp}/${b.max}</b> HP</span>
      <span class="tr-def" title="Defense: 1 per Stone Plate${b.skin?", plus Stone Skin":""}${b.winded?" (Winded: 0)":""}">Defense <b>${b.def}</b> ${bossPips(b.plates,b.platesMax,"plate","Stone Plates: "+b.plates+" of "+b.platesMax)}</span>
      <span class="tr-rage" title="Raging Stampede at ${b.rageAt} Rage">Rage ${bossPips(b.rage,b.rageAt,"rage","Rage "+b.rage+" of "+b.rageAt)} <small>(${left?left+" to Stampede":"Stampede on its turn"})</small></span>${tags}</div>
    <div class="tr-flip"><span>Boss deck <b>${b.deck}</b></span><span title="The boss takes its turn after every party passes: spawns attack, then it reveals one card per party.">Last turn: ${lf}</span></div>
    <div class="tr-golems"><span class="lbl">Golems</span>${golems}</div></section>`}
function trialsGameHTML(s,opts){const me=U.me;const helpers=E.parties(s).filter(p=>p!==me).sort((a,b)=>a-b);
  return`<div class="pl-game trials${U.logHidden?" nolog":""}"><button class="btn sm pl-logshow" data-pa="log-toggle" title="Show the game log">Show log</button><div class="pl-board">
    ${bossHTML(s)}
    <div class="tr-helpers n${helpers.length}">${helpers.map(p=>`<div class="tr-helper">${zoneHTML(s,p,opts)}</div>`).join("")}</div>
    ${U.spec?(U.spec.replay?replayMidHTML(s):specMidHTML(s)):midHTML(s,opts)}
    ${zoneHTML(s,me,opts)}
    ${U.spec&&!U.spec.replay?"":handHTML(s,opts)}
  </div><aside class="pl-side">
    <div class="pl-side-h"><button type="button" class="pl-logtab" data-pa="log-toggle" aria-expanded="${!U.logHidden}" title="${U.logHidden?"Show":"Hide"} the game log"><h2>Game log</h2><span aria-hidden="true">${U.logHidden?"▴":"▾"}</span></button><span class="actions">${ctlBtns()}${sndBtnsHTML()}<button class="btn sm" data-pa="export-log" title="Download the full game log as a text file">Export log</button><button class="btn sm" data-pa="trules">Trials rules</button>${s.over||U.spec?"":`<button class="btn sm danger pl-concede" data-pa="concede-ask" title="Concede this game">Concede</button>`}${U.spec?`<button class="btn sm danger" data-pa="spec-leave">Stop watching</button>`:`<button class="btn sm danger" data-pa="leave-ask">${s.over?"Exit":"Leave"}</button>`}</span></div>
    <div class="pl-log" aria-live="polite">${logHTML(s)}</div>
    <div class="pl-legend"><span>Green ring = Hero acting now</span><span>Red ring = can be targeted</span><span>Dimmed Golem = deal with your own first</span></div>
  </aside></div>`}
/* boss reveals and Raging Stampede pop up like opponent actions, with the boss card shown large */
function trialsPops(s){if(!s.trials||!window.CQPop)return;const ev=s.trials.events||[];if(U.evFor!==U.gameKey){U.evFor=U.gameKey;U.evSeen=ev.length?ev[ev.length-1].n:0;return}
  const fresh=ev.filter(e=>e.n>U.evSeen);if(!fresh.length)return;U.evSeen=fresh[fresh.length-1].n;
  const bn=s.p[s.trials.boss].name;const T=window.CQT;const h=T.bossHero(s);
  fresh.slice(-5).forEach(e=>{const objs=[];s.p.forEach(pl=>pl.heroes.forEach(x=>objs.push(x)));const tu=(e.targets||[]).map(n=>(objs.find(o=>o.name===n)||{}).uid).filter(Boolean);
    if(e.kind==="skip"){CQPop.push({who:bn,boss:true,cardId:null,verb:"",name:"skips a reveal",dest:"",sub:"It was Stunned or exhausted.",actorU:h&&h.uid,targetU:[]});return}
    if(e.kind==="stampede"){const c=byName(bn);CQPop.push({who:bn+" · boss ability",boss:true,cardId:c?c.id:null,verb:"does",name:"Raging Stampede",dest:"every player Hero",sub:`${s.trials.stampede} damage to each Hero; it's Winded (0 Defense) until its next turn.`,actorU:h&&h.uid,targetU:tu});return}
    const c=byName(e.card);const row=(typeof TRIALS_BOSS_CARDS!=="undefined"?TRIALS_BOSS_CARDS:[]).find(r=>r[0]===e.card);
    CQPop.push({who:bn+" · boss turn",boss:true,cardId:c?c.id:null,verb:"reveals",name:e.card,dest:(e.targets||[]).join(", "),sub:row?row[4]:"",actorU:h&&h.uid,targetU:tu})})}
function trialsLobbyHTML(){const L=U.lobby.t;const pc=partyChoices();if(!L.party||!pc.some(c=>c.id===L.party&&c.ok))L.party=(pc.find(c=>c.ok)||{}).id||"";
  const res=store2.get(TKEY,null);const run=trialRun();
  const popt=sel=>pc.map(c=>`<option value="${esc(c.id)}" ${c.id===sel?"selected":""} ${c.ok?"":"disabled"}>${esc(c.name)}</option>`).join("");
  const hopt=(i)=>`<option value="ai" ${(L.h[i]||"ai")==="ai"?"selected":""}>AI picks a party</option>`+pc.filter(c=>c.ok).map(c=>`<option value="${esc(c.id)}" ${L.h[i]===c.id?"selected":""}>${esc(c.name)}</option>`).join("");
  return`${res&&res.s&&!res.s.over?`<div class="panel"><b>Trial in progress</b> · Round ${res.s.round} · ${esc(res.s.p[res.s.trials.boss].name)}<div class="actions"><button class="btn primary" data-pa="resume-trial">Resume</button><button class="btn" data-pa="drop-trial">Discard it</button></div></div>`:""}
  <div class="pl-lobby tr-lobby">
    <section class="panel"><h2>Your Trials party</h2>
      ${pc.length?`<label>Party<select data-pa="t-party">${popt(L.party)}</select></label>`:`<p class="pl-note">You don't have a Trials party yet. A Trials party is a deck with 2 Heroes (Lead and Closer) and at least 50 cards.</p><div class="actions"><button type="button" class="btn primary" data-act="new-party">New Trials party</button></div>`}
      <p class="pl-note">Trials parties you save in My Decks appear here.</p>
      ${run?`<p class="pl-note tr-run">Your run: Trial ${run.trial} cleared. Loot in your next opening hands: ${Object.entries(run.loot).map(([p,n])=>(+p?"Helper "+p:"You")+": "+esc(n)).join(", ")}.</p>`:""}
    </section>
    <section class="panel"><h2>Helpers</h2>
      <label>Helper parties<select data-pa="t-helpers">${[1,2,3].map(n=>`<option value="${n}" ${L.helpers===n?"selected":""}>${n} helper${n>1?"s":""} (${n+1} parties)</option>`).join("")}</select></label>
      ${Array.from({length:L.helpers},(_,i)=>`<label>Helper ${i+1}<select data-pa="t-h" data-i="${i}">${hopt(i)}</select></label>`).join("")}
      <label class="tr-check"><input type="checkbox" data-pa="t-watch" ${L.watch?"checked":""}> AI plays every party (watch mode)</label>
    </section>
    <section class="panel"><h2>Trial</h2>
      <label>Trial<select data-pa="t-trial"><option value="1" selected>Trial 1 · Rock Mammoth</option></select></label>
      <p class="pl-note">The Rock Mammoth: 25 Health Points per party, 1 Stone Plate per party, and a Golem against each party. Break its Golems to break its plates, but every Golem adds Rage.</p>
      <div class="actions"><button class="btn primary go" data-pa="start-trial">Start Trial</button></div>
      <p class="pl-note">Trials games aren't recorded to Best Decks or the Leaderboard.</p>
    </section>
  </div>`}

function deckChoices(){const out=[];
  const mine=((AS()&&S.decks)||[]).filter(d=>(d.heroes||[]).filter(Boolean).length===3);mine.forEach(d=>{const bad=E.validateDeck(d);out.push({id:d.id,name:d.name+(bad.length?" (not legal: "+bad[0]+")":""),ok:!bad.length,deck:d})});
  if(AS()&&S.deck&&S.deck.heroes.length===3&&!mine.some(d=>d.id===S.deck.id)){const bad=E.validateDeck(S.deck);out.push({id:"draft",name:"Current draft: "+(S.deck.name||"Untitled")+(bad.length?" (not legal)":""),ok:!bad.length,deck:S.deck})}
  STARTERS.forEach((st,i)=>out.push({id:"starter:"+i,name:st.name,ok:true,deck:starterDeck(i)}));
  return out}
function deckById(id){const c=deckChoices().find(d=>d.id===id);return c&&c.ok?c.deck:null}

/* ---------- persistence ---------- */
function saveLocal(){if(U.tut)return;if(U.vsAI&&U.s){if(U.s.trials)store2.set(TKEY,{s:U.s,me:U.me,watch:!!U.trialsWatch,last:U.lastTrial||null});else store2.set("cq.play.local",{s:U.s,me:U.me,meta:U.meta||null,match:U.match||null})}if(U.net&&U.net.role==="host"&&U.s)store2.set("cq.play.host",{code:U.net.code,s:U.s,guest:U.net.guest||null,gname:U.net.gname||null,bo:U.net.bo||1,meta:U.meta||null,match:U.match||null});}
/* ---------- Nov 24: game logs (table game_logs) ----------
   Every top-level action on the live game is recorded with the seed and decks, so a finished game can be saved for
   bug hunting and AI training, and replayed step by step (Admin → Game logs). Only the host's / vs-AI browser records. */
function logSetup(seed,players){return{seed,players:players.map(x=>({name:x.name,ai:!!x.ai,deck:{name:x.deck.name||"",heroes:(x.deck.heroes||[]).slice(),cards:Object.assign({},x.deck.cards)}}))}}
const ENGINE_ACT=E.act;let actDepth=0;
E.act=function(s,pid,a){actDepth++;let r;try{r=ENGINE_ACT.call(E,s,pid,a)}finally{actDepth--}
  if(r&&r.ok&&actDepth===0&&s===U.s&&!U.spec&&U.meta&&Array.isArray(U.meta.acts)){try{U.meta.acts.push([pid,JSON.parse(JSON.stringify(a))])}catch(e){}}return r};
const siteVer=()=>{const e=document.querySelector('script[src*="play-engine.js"]');const m=e&&/[?&]v=([^&]+)/.exec(e.getAttribute("src")||"");return m?m[1]:""};
async function maybeSaveLog(){const s=U.s,m=U.meta;if(!s||!s.over||!m||!m.setup||!Array.isArray(m.acts)||m.logged)return;const c=sb();if(!c)return;m.logged=true;saveLocal();
  const row={game_id:m.gid,mode:m.mode,players:s.p.map(x=>x.name),winner:s.winner,rounds:s.round,ver:siteVer(),setup:m.setup,actions:m.acts,
    log:s.log.map(l=>[l.r,l.p,l.m]),...(U.match?{match_id:U.match.id,game_no:U.match.n}:{}),ended:s.conceded!=null?"concede":(s.deckedOut!=null?"deckout":"party")};
  const {error}=await c.from("game_logs").insert(row);
  if(error&&!/duplicate/i.test(error.message)){console.warn("Couldn't save the game log:",error.message);if(!/game_logs|relation|schema cache/i.test(error.message)){m.logged=false;saveLocal()}}}
/* replay: rebuild the state after the first i actions with the engine itself */
function replayState(R,i){const st=E.newGame({seed:R.setup.seed,players:R.setup.players.map(x=>({name:x.name,ai:x.ai,deck:x.deck}))});let bad=0;
  for(let k=0;k<i&&k<R.acts.length;k++){const[pid,a]=R.acts[k];const r=ENGINE_ACT.call(E,st,pid,JSON.parse(JSON.stringify(a)));if(!r.ok)bad++}R.bad=bad;return st}
window.CQReplayState=replayState;
window.CQReplay=function(row){if(!row||!row.setup||!Array.isArray(row.actions)){toast("This log can't be replayed.");return}
  leaveSpec();clearTimeout(U.aiT);const R={setup:row.setup,acts:row.actions,i:0,ver:row.ver||"",title:(row.players||[]).join(" vs ")};
  U.gameKey="g"+Date.now();U.spec={replay:R};U.me=0;U.vsAI=false;U.net=null;U.meta=null;U.s=replayState(R,0);U.mode="game";U.overHide=true;
  if(location.hash!=="#play")location.hash="play";setTimeout(render,50)};
function replayGo(i){const R=U.spec&&U.spec.replay;if(!R)return;R.i=Math.max(0,Math.min(R.acts.length,i));U.s=replayState(R,R.i);render()}
/* jump to the first action of the next round, or back to the start of the previous one */
function replayRound(dir){const R=U.spec&&U.spec.replay;if(!R)return;
  if(!R.rounds){const st=E.newGame({seed:R.setup.seed,players:R.setup.players.map(x=>({name:x.name,ai:x.ai,deck:x.deck}))});R.rounds=[st.round];
    for(const[pid,a]of R.acts){ENGINE_ACT.call(E,st,pid,JSON.parse(JSON.stringify(a)));R.rounds.push(st.round)}}
  const rs=R.rounds,cur=rs[R.i],start=r=>{const k=rs.indexOf(r);return k<0?0:k};let j;
  if(dir>0){j=R.i;while(j<R.acts.length&&rs[j]===cur)j++}
  else{const s0=start(cur);j=R.i>s0?s0:start(cur-1)}
  replayGo(j)}
function replayMidHTML(s){const R=U.spec.replay;const pn=p=>esc(s.p[p]?s.p[p].name:"");const cv=siteVer();
  return`<section class="pl-mid pl-specbar"><div class="pl-round"><b>Round ${s.round||"–"}</b> · ${esc(({mull:"Mulligan",dawn:"Dawn",battle:"Battle",dusk:"Dusk",town:"Town"})[s.phase]||s.phase||"")}</div>
    <div class="pl-prompt">⏯ Replay: ${pn(0)} vs ${pn(1)} · action ${R.i} of ${R.acts.length}${s.over?` · ${s.winner<0?"draw":"🏆 "+pn(s.winner)+" wins"}`:""}${R.ver&&cv&&R.ver!==cv?` · <span title="The site changed since this game (${esc(R.ver)} → ${esc(cv)}); later steps may not match the saved log">⚠ played on ${esc(R.ver)}</span>`:""}${R.bad?` · ⚠ ${R.bad} step${R.bad>1?"s":""} didn't replay`:""}</div>
    <div class="pl-acts rp-acts"><button class="btn sm" data-pa="rp" data-d="first" title="Start">⏮</button><button class="btn sm" data-pa="rp" data-d="rprev" title="Back a round">⏪ Round</button><button class="btn sm" data-pa="rp" data-d="prev" title="Back one action">◀</button><button class="btn sm" data-pa="rp" data-d="next" title="Next action">▶</button><button class="btn sm" data-pa="rp" data-d="rnext" title="Next round">Round ⏩</button><button class="btn sm" data-pa="rp" data-d="last" title="End">⏭</button><button class="btn sm danger" data-pa="spec-leave">Close replay</button></div></section>`}
/* ---------- Nov 24: Best-of-3 matches with sideboards (admins only while it's tested; Best of 1 stays the default) ----------
   U.match on the host / vs-AI browser: {id,bo:3,mode,n,wins,tal,base,cur,ready}. The guest gets a public copy with each state.
   Between games each player sideboards (swaps cards, and a Hero, between deck and sideboard), then presses Ready. First to 2 wins. */
const isAdm=()=>{const s=AS();return!!(s&&s.access&&s.access.admin)};
const boPick=()=>isAdm()&&U.lobby.bo===3?3:1;
const deckCl=d=>({id:d.id,name:d.name,heroes:(d.heroes||[]).slice(),cards:Object.assign({},d.cards),side:{heroes:((d.side&&d.side.heroes)||[]).filter(Boolean).slice(0,1),cards:Object.assign({},(d.side&&d.side.cards)||{})}});
function newMatch(mode,d0,d1){return{id:newGid(),bo:3,mode,n:1,wins:[0,0],tal:[],base:[deckCl(d0),deckCl(d1)],cur:[deckCl(d0),deckCl(d1)],ready:[false,false]}}
const matchDone=m=>!!m&&(m.wins[0]>=2||m.wins[1]>=2);
function matchTally(){const m=U.match,s=U.s;if(!m||!m.tal||!s||!s.over||s.trials||!U.meta||m.tal.includes(U.meta.gid))return;m.tal.push(U.meta.gid);
  if(s.winner===0||s.winner===1)m.wins[s.winner]++;m.ready=[false,false];m.done=matchDone(m);saveLocal()}
const matchPub=()=>U.match?{id:U.match.id,bo:3,n:U.match.n,wins:U.match.wins.slice(),done:!!U.match.done,ready:U.match.ready.slice()}:null;
function matchLine(s){const M=U.match;if(!M||!s)return"";const nm=i=>esc(s.p[i]?s.p[i].name:"");
  return`<p class="pl-over-why pl-match">Best of 3 · Game ${M.n} · ${nm(0)} <b>${M.wins[0]}–${M.wins[1]}</b> ${nm(1)}${M.done?` · <b>${M.wins[U.me]>=2?"You win the match!":nm(M.wins[0]>=2?0:1)+" wins the match."}</b>`:""}</p>`}
function matchActs(){const M=U.match;if(!M||M.done)return"";const mine=M.ready&&M.ready[U.me],theirs=M.ready&&M.ready[1-U.me];
  if(mine)return`<button class="btn go" disabled>Waiting for your opponent…</button>`;
  return`<button class="btn go" data-pa="m-side" title="Swap cards between your deck and sideboard, then start the next game">Next game: sideboard${theirs&&U.net?" (opponent is ready)":""}</button>`}
/* my current list for the next game */
function myCur(){const M=U.match;if(!M)return null;if(M.cur)return M.cur[U.me];return U.net&&U.net.deck?deckCl(U.net.deck):null}
function myBase(){const M=U.match;if(M&&M.base)return M.base[U.me];return U.net&&U.net.base?U.net.base:myCur()}
function sbOpen(){const d=myCur();if(!d){toast("Your deck for this match isn't available. Leave and rejoin the room.");return}U.sb={d:deckCl(d)};sbRender()}
function sbIssues(d){const out=E.validateDeck(d).concat(E.validateSide(d));const DB=E.DB||{};
  const cls=new Set(d.heroes.map(h=>DB[h]&&DB[h].cls).filter(Boolean));
  if(!d.cards["Ring of Vocation"]){const off=Object.keys(d.cards).filter(id=>d.cards[id]>0&&DB[id]&&DB[id].cls&&DB[id].cls!=="Generic"&&!cls.has(DB[id].cls));if(off.length)out.push(`No Hero in your party can play ${off.slice(0,3).join(", ")}${off.length>3?` and ${off.length-3} more`:""}.`)}
  return out}
function sbRender(){const st=U.sb;if(!st)return;const d=st.d,DB=E.DB||{},M=U.match;const sd=d.side;const iss=sbIssues(d);
  const tot=Object.values(d.cards).reduce((a,q)=>a+q,0),stot=sd.heroes.length+Object.values(sd.cards).reduce((a,q)=>a+q,0);
  const row=(id,q,dir)=>`<li><span class="q">${q}</span><span class="n">${esc(id)}</span><span class="c">${esc(DB[id]&&DB[id].cls&&DB[id].cls!=="Generic"?DB[id].cls:"")}</span><button type="button" class="btn sm" data-sb="${dir}" data-id="${esc(id)}" title="${dir==="out"?"Move one to the sideboard":"Move one into the deck"}">${dir==="out"?"→":"←"}</button></li>`;
  const hn=h=>esc(String(h).replace(/^h:/,""));const sh=sd.heroes[0];
  document.getElementById("pl-sb")?.remove();const m=document.createElement("div");m.className="modal";m.id="pl-sb";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");
  m.innerHTML=`<div class="box wide pl-sbox"><h2>Sideboard for game ${(M?M.n:1)+1}</h2>
    <p class="pl-note">Move cards between your deck and sideboard. The sideboard holds up to 10 cards, and 1 of them may be a Hero. Your deck needs at least 50 cards. Changes last for the rest of the match.</p>
    <div class="sb-heroes"><b>Party</b>${d.heroes.map((h,i)=>`<span class="sb-h">${hn(h)}${sh?`<button type="button" class="btn sm" data-sb="hswap" data-i="${i}" title="Swap with ${hn(sh)}">⇄ ${hn(sh)}</button>`:""}</span>`).join("")}${sh?"":`<span class="pl-note">No Hero in your sideboard.</span>`}</div>
    <div class="sb-cols"><section><h3>Deck <span>${tot}</span></h3><ul>${Object.keys(d.cards).filter(id=>d.cards[id]>0).sort().map(id=>row(id,d.cards[id],"out")).join("")}</ul></section>
      <section><h3>Sideboard <span>${stot}/10</span></h3>${sh?`<p class="sb-sh">Hero: <b>${hn(sh)}</b></p>`:""}<ul>${Object.keys(sd.cards).filter(id=>sd.cards[id]>0).sort().map(id=>row(id,sd.cards[id],"in")).join("")||`<li class="pl-note">Empty</li>`}</ul></section></div>
    ${iss.length?`<ul class="issues bad">${iss.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}
    <div class="actions"><button type="button" class="btn primary go" data-sb="ready"${E.validateDeck(d).length||E.validateSide(d).length?" disabled":""}>Ready</button><button type="button" class="btn" data-sb="reset">Reset to registered list</button><button type="button" class="btn" data-sb="close">Back</button></div></div>`;
  m.addEventListener("click",e=>{const b=e.target.closest("[data-sb]");if(!b)return;const k=b.dataset.sb,id=b.dataset.id;
    if(k==="close"){m.remove();U.sb=null;return}
    if(k==="reset"){const bse=myBase();if(bse)st.d=deckCl(bse);sbRender();return}
    if(k==="out"){if(!d.cards[id])return;d.cards[id]--;if(!d.cards[id])delete d.cards[id];sd.cards[id]=(sd.cards[id]||0)+1;sbRender();return}
    if(k==="in"){if(!sd.cards[id])return;sd.cards[id]--;if(!sd.cards[id])delete sd.cards[id];d.cards[id]=(d.cards[id]||0)+1;sbRender();return}
    if(k==="hswap"){const i=+b.dataset.i,h=d.heroes[i];if(!sh||h==null)return;d.heroes[i]=sh;sd.heroes=[h];sbRender();return}
    if(k==="ready"){if(E.validateDeck(d).length||E.validateSide(d).length)return;m.remove();U.sb=null;matchReady(d)}});
  (document.getElementById("layer")||document.body).appendChild(m)}
function matchReady(d){const M=U.match;if(!M)return;
  if(U.net&&U.net.role==="guest"){U.net.deck=deckCl(d);store2.set("cq.play.guest",{code:U.net.code,deck:U.net.deck,base:U.net.base||null});M.ready=M.ready||[false,false];M.ready[1]=true;
    try{U.net.ch.send({type:"broadcast",event:"next",payload:{cid,deck:U.net.deck}})}catch(e){}render();return}
  M.cur[U.me]=deckCl(d);M.ready[U.me]=true;saveLocal();
  if(M.mode==="ai"||M.ready[1-U.me])matchNext();else{broadcast();render()}}
function onGuestNext(p){const M=U.match;if(!M||!M.cur||!U.s||!U.s.over||p.cid!==U.net.guest||!p.deck)return;
  const bad=E.validateDeck(p.deck).concat(E.validateSide(p.deck));if(bad.length){U.net.ch.send({type:"broadcast",event:"state",payload:{to:p.cid,s:E.redact(U.s,1),me:1,err:"That list isn't legal: "+bad[0],match:matchPub()}});return}
  M.cur[1]=deckCl(p.deck);M.ready[1]=true;saveLocal();if(M.ready[0])matchNext();else{broadcast();render()}}
function matchNext(){const M=U.match;if(!M||M.done)return;M.n++;M.ready=[false,false];document.getElementById("pl-sb")?.remove();U.sb=null;U.overHide=false;
  if(M.mode==="ai"){startAIGame(M.cur[0],M.cur[1]);return}
  if(U.net&&U.net.role==="host"){U.net.deck=M.cur[0];newOnlineGame(M.cur[1],U.net.gname||"Guest")}}
U.matchState=()=>U.match;
/* ---------- Nov 25: game dock. A gear tab at the bottom right slides out a bar from the right:
   Menu, Full screen, Sound, Game log, Help, Leave and Concede. Sound, Game log and Help slide up a panel above the bar.
   Same on computers and tablets (it replaces the old game-log tray and the tablet Controls tray). ---------- */
const DOCK={open:false,panel:null};
const DOCK_CSS=`#pl-dock{position:fixed;right:0;bottom:max(12px,env(safe-area-inset-bottom,0px));z-index:76;pointer-events:none;font:600 .95rem/1 var(--body)}
html.pl-has-game #pl-dock{display:block}#pl-dock{display:none}
#pl-dock button{pointer-events:auto}
#dk-tab{all:unset;box-sizing:border-box;position:absolute;right:0;bottom:0;width:54px;height:52px;display:grid;place-items:center;cursor:pointer;pointer-events:auto;
  border-radius:14px 0 0 14px;border:2px solid #b8743a;border-right:0;background:linear-gradient(#3a2a1c,#1b130c);box-shadow:0 8px 22px rgba(0,0,0,.6);color:#f3e6cf;font-size:1.65rem;-webkit-tap-highlight-color:transparent}
#dk-tab .g{display:inline-block;transition:transform .45s cubic-bezier(.34,1.56,.64,1)}
#pl-dock.open #dk-tab{border-color:#ffc100;color:#ffd98a}#pl-dock.open #dk-tab .g{transform:rotate(120deg)}
#dk-tab:hover{color:#ffd98a}#dk-tab:focus-visible{outline:2px solid #ffc100;outline-offset:2px}
.dk-bar{position:absolute;right:54px;bottom:0;height:52px;display:flex;align-items:center;gap:6px;padding:0 8px 0 10px;white-space:nowrap;pointer-events:auto;
  border-radius:14px 0 0 14px;border:2px solid #b8743a;border-right:0;background:linear-gradient(#2e2216,#1b130c);box-shadow:0 8px 22px rgba(0,0,0,.6);
  transform:translateX(calc(100% + 60px));opacity:0;visibility:hidden;transition:transform .34s cubic-bezier(.34,1.3,.64,1),opacity .2s ease,visibility 0s linear .34s}
#pl-dock.open .dk-bar{transform:none;opacity:1;visibility:visible;transition:transform .34s cubic-bezier(.34,1.3,.64,1),opacity .15s ease,visibility 0s}
.dk-bar button{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 12px;border-radius:10px;cursor:pointer;color:#f3e6cf;
  background:linear-gradient(#3a2a1c,#22170f);border:2px solid #8A5E40;transition:transform .12s ease,border-color .12s,color .12s}
.dk-bar button:hover,.dk-bar button:focus-visible{border-color:#ffc100;color:#ffd98a;transform:translateY(-2px);outline:none}
.dk-bar button[aria-expanded="true"],.dk-bar button[aria-pressed="true"]{border-color:#ffc100;color:#ffd98a;background:linear-gradient(#4a3420,#2a1c10)}
.dk-bar button.red{background:linear-gradient(#a3261b,#6e130c);border-color:#d9483a;color:#fff}.dk-bar button.red:hover{border-color:#ff8a7a;color:#fff}
.dk-bar button[hidden]{display:none}
.dk-bar .ic{font-size:1.05rem;line-height:1}
.dk-panel{position:absolute;right:12px;bottom:64px;width:min(420px,calc(100vw - 24px));max-height:min(62vh,560px);display:flex;flex-direction:column;gap:8px;padding:12px 14px 14px;pointer-events:auto;
  border-radius:14px;border:2px solid #b8743a;background:linear-gradient(#2e2216,#1b130c);box-shadow:0 18px 44px rgba(0,0,0,.7);color:#f3e6cf;
  transform:translateY(24px) scale(.97);transform-origin:80% 100%;opacity:0;visibility:hidden;transition:transform .3s cubic-bezier(.34,1.45,.64,1),opacity .16s ease,visibility 0s linear .3s}
.dk-panel.on{transform:none;opacity:1;visibility:visible;transition:transform .3s cubic-bezier(.34,1.45,.64,1),opacity .14s ease,visibility 0s}
.dk-panel h3{margin:0;font:400 1.45rem/1 "Pirata One",var(--display);color:#ffc100;display:flex;justify-content:space-between;align-items:center;gap:8px}
.dk-panel h3 button{all:unset;cursor:pointer;width:32px;height:32px;display:grid;place-items:center;border-radius:8px;border:2px solid #8A5E40;font-size:.95rem;color:#f3e6cf}
.dk-panel .dk-acts{display:flex;flex-wrap:wrap;gap:8px}
.dk-panel .dk-acts .btn{flex:1 1 auto;justify-content:center}
.dk-panel .dk-log{color:#f3e6cf;flex:1;min-height:120px;overflow:auto;font-size:.88rem;line-height:1.35;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.25);border:1px solid rgba(184,116,58,.5)}
.dk-panel .dk-legend{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:.72rem;color:#c9b190}
.dk-panel .dk-note{margin:0;font-size:.85rem;color:#d8c3a0}
.dk-panel .cqv-row{flex-wrap:nowrap;gap:10px}.dk-panel .cqv-tog{min-width:160px}
.dk-panel[data-p="log"]{height:min(62vh,560px)}
html.pl-tablet .dk-bar button{height:44px;padding:0 14px;font-size:1rem}html.pl-tablet .dk-bar,html.pl-tablet #dk-tab{height:58px}html.pl-tablet .dk-panel{bottom:70px}
html.pl-tablet .dk-panel .btn{min-height:46px!important}
@media (max-width:820px){.dk-bar{gap:4px;padding:0 4px 0 6px}.dk-bar button{padding:0 8px}.dk-bar .lb{display:none}.dk-bar button.red .lb,.dk-bar button[data-dk="leave"] .lb{display:inline}}
@media (prefers-reduced-motion:reduce){.dk-bar,.dk-panel,#dk-tab .g{transition:none!important}}
/* the old log tray and the tablet Controls tray are replaced by the dock */
html #play-root .pl-game .pl-side,html[data-skin="art"] #play-root .pl-game .pl-side,html[data-skin="art"] #play-root .pl-game.nolog .pl-side,html.pl-tablet #play-root .pl-game .pl-side,#play-root .pl-logshow,html #pl-traytab,html #pl-tbar,html #pl-fstab,html #pl-helpbox{display:none!important}
html[data-skin="art"] #play-root .pl-game,html[data-skin="art"] #play-root .pl-game.nolog{grid-template-columns:minmax(0,1fr)!important}
#play-root .pl-hand{padding-right:64px}`;
function dockEl(){let d=document.getElementById("pl-dock");if(d)return d;
  const st=document.createElement("style");st.textContent=DOCK_CSS;document.head.appendChild(st);
  d=document.createElement("div");d.id="pl-dock";
  d.innerHTML=`<div class="dk-panel" data-p="snd" role="dialog" aria-label="Sound"></div><div class="dk-panel" data-p="log" role="dialog" aria-label="Game log"></div><div class="dk-panel" data-p="help" role="dialog" aria-label="Help"></div>
  <div class="dk-bar" role="toolbar" aria-label="Game controls" id="dk-bar">
    <button type="button" data-dk="menu"><span class="ic" aria-hidden="true">☰</span><span class="lb">Menu</span></button>
    <button type="button" data-dk="fs"><span class="ic" aria-hidden="true">⛶</span><span class="lb">Full screen</span></button>
    <button type="button" data-dk="snd" aria-expanded="false"><span class="ic" aria-hidden="true">🔊</span><span class="lb">Sound</span></button>
    <button type="button" data-dk="log" aria-expanded="false"><span class="ic" aria-hidden="true">📜</span><span class="lb">Game log</span></button>
    <button type="button" data-dk="help" aria-expanded="false"><span class="ic" aria-hidden="true">❔</span><span class="lb">Help</span></button>
    <button type="button" data-dk="leave"><span class="lb">Leave</span></button>
    <button type="button" data-dk="concede" class="red"><span class="lb">Concede</span></button>
  </div><button type="button" id="dk-tab" aria-label="Game controls" aria-controls="dk-bar" aria-expanded="false" title="Game controls"><span class="g" aria-hidden="true">⚙</span></button>`;
  d.querySelector("#dk-tab").addEventListener("click",e=>{e.stopPropagation();DOCK.open=!DOCK.open;if(!DOCK.open)DOCK.panel=null;SND.play("tick");dockSync()});
  d.querySelector(".dk-bar").addEventListener("click",e=>{const b=e.target.closest("[data-dk]");if(!b)return;e.stopPropagation();const k=b.dataset.dk;
    if(k==="snd"||k==="log"||k==="help"){DOCK.panel=DOCK.panel===k?null:k;dockSync();if(DOCK.panel==="log"){const lg=d.querySelector(".dk-log");if(lg)lg.scrollTop=lg.scrollHeight}return}
    DOCK.panel=null;
    if(k==="menu"){dockMenu()}
    else if(k==="fs"){if(window.CQTablet)CQTablet.fullscreen()}
    else if(k==="leave"){DOCK.open=false;clickPa(U.spec?"spec-leave":"leave-ask")}
    else if(k==="concede"){DOCK.open=false;clickPa("concede-ask")}
    dockSync()});
  d.addEventListener("click",e=>{if(e.target.closest(".dk-x")){DOCK.panel=null;dockSync()}});
  document.addEventListener("pointerdown",e=>{if(!DOCK.open||!e.target.closest)return;if(e.target.closest("#pl-dock,#pl-modal,.cqv-pop,header.top"))return;DOCK.open=false;DOCK.panel=null;dockSync()},true);
  document.addEventListener("keydown",e=>{if(e.key!=="Escape"||!DOCK.open)return;if(DOCK.panel)DOCK.panel=null;else DOCK.open=false;dockSync()});
  ["fullscreenchange","webkitfullscreenchange"].forEach(ev=>document.addEventListener(ev,()=>dockSync()));
  document.addEventListener("cq-vol",()=>{if(DOCK.panel==="snd"&&window.CQVol)CQVol.refresh()});
  document.body.appendChild(d);return d}
/* the dock's buttons reuse the Play tab's own actions (data-pa), so every rule about leaving and conceding stays in one place */
function clickPa(k,extra){const b=document.createElement("button");b.type="button";b.dataset.pa=k;if(extra)Object.assign(b.dataset,extra);b.hidden=true;(ROOT()||document.body).appendChild(b);b.click();b.remove()}
function dockMenu(){const R=document.documentElement,m=document.getElementById("pl-menutab");
  if(R.classList.contains("pl-portrait")){R.classList.toggle("pl-pmenu");const h=document.querySelector("header.top");if(h)R.style.setProperty("--pl-hdrh",h.offsetHeight+"px")}else if(m)m.click()}
function dockSync(){const d=dockEl(),s=U.s;const inGame=location.hash==="#play"&&U.mode==="game"&&!!s&&!!document.querySelector("#play-root .pl-game");
  if(!inGame){DOCK.open=false;DOCK.panel=null}
  d.classList.toggle("open",DOCK.open);d.querySelector("#dk-tab").setAttribute("aria-expanded",String(DOCK.open));
  const bar=d.querySelector(".dk-bar");bar.setAttribute("aria-hidden",String(!DOCK.open));bar.inert=!DOCK.open;
  const T=window.CQTablet,fsOn=!!(document.fullscreenElement||document.webkitFullscreenElement),fsOk=!!(T&&T.fsAvail&&T.fsAvail());
  const fb=d.querySelector('[data-dk="fs"]');fb.hidden=!fsOk;fb.setAttribute("aria-pressed",String(fsOn));fb.querySelector(".lb").textContent=fsOn?"Full screen off":"Full screen";
  d.querySelector('[data-dk="menu"]').setAttribute("aria-pressed",String(document.documentElement.classList.contains("pl-menu")||document.documentElement.classList.contains("pl-pmenu")));
  const lv=d.querySelector('[data-dk="leave"]');lv.querySelector(".lb").textContent=U.spec?(U.spec.replay?"Close replay":"Stop watching"):(s&&s.over?"Exit":"Leave");
  d.querySelector('[data-dk="concede"]').hidden=!s||!!s.over||!!U.spec;
  ["snd","log","help"].forEach(k=>d.querySelector(`[data-dk="${k}"]`).setAttribute("aria-expanded",String(DOCK.open&&DOCK.panel===k)));
  d.querySelectorAll(".dk-panel").forEach(p=>{const k=p.dataset.p,on=DOCK.open&&DOCK.panel===k;p.classList.toggle("on",on);p.inert=!on;if(on||k==="log")dockPanel(p,k)})}
const dkHead=t=>`<h3>${t}<button type="button" class="dk-x" aria-label="Close">✕</button></h3>`;
function dockPanel(p,k){const s=U.s;if(!s)return;
  if(k==="snd"){if(!p.dataset.built){p.innerHTML=dkHead("Sound")+(window.CQVol?CQVol.row("music")+CQVol.row("sfx"):"")+`<p class="dk-note">Turn music and sound effects on or off, and set how loud each one is.</p>`;p.dataset.built="1"}else if(window.CQVol)CQVol.refresh();return}
  if(k==="log"){if(!p.dataset.built){p.innerHTML=dkHead("Game log")+`<div class="dk-log pl-log" aria-live="polite"></div><div class="dk-legend"><span>Green ring = Hero acting now</span><span>Red ring = can be targeted</span><span>Tilted = exhausted</span></div><div class="dk-acts"><button type="button" class="btn sm" data-pa="export-log" title="Download the full game log as a text file">Export log</button></div>`;p.dataset.built="1"}
    const lg=p.querySelector(".dk-log");const n=s.log.length;if(lg.dataset.n===String(n)&&lg.dataset.g===String(U.gameKey))return;const atB=lg.scrollTop+lg.clientHeight>=lg.scrollHeight-20;lg.innerHTML=logHTML(s);lg.dataset.n=n;lg.dataset.g=U.gameKey;if(atB||!p.classList.contains("on"))lg.scrollTop=lg.scrollHeight;return}
  if(k==="help"){const fix=U.dockFix||"";const give=U.net&&!U.spec?'<button class="btn" data-pa="do" data-a=\'{"type":"giveAction"}\' title="Let your opponent resolve something by hand (a card they control, a choice). Control comes back to you without using your action.">Grant opponent an action</button>':"";
    const key=(fix?1:0)+"|"+(give?1:0)+"|"+(s.trials?1:0);if(p.dataset.key===key)return;p.dataset.key=key;
    p.innerHTML=dkHead("Help")+`<p class="dk-note">${fix?"Fix something the game got wrong.":"Rules fix is available when it's your action in the Battle Phase."}${give?" You can also hand control to your opponent for a moment.":""}</p>
      <div class="dk-acts">${fix?fix.replace('class="btn sm pl-fix"','class="btn pl-fix"'):'<button class="btn" disabled>Rules fix</button>'}${give}<button class="btn" data-pa="${s.trials?"trules":"rules"}">${s.trials?"Trials rules":"Rules"}</button></div>`}}
/* ---------- win tracking for Best Decks ---------- */
const newGid=()=>"g"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
function deckMeta(d){return{name:(d.name||"Untitled deck").replace(/ \(starter\)$/,"").slice(0,80),heroes:d.heroes.slice(0,3),cards:Object.assign({},d.cards)}}
async function deckKey(d){const txt=d.heroes.slice().sort().join("|")+"#"+Object.entries(d.cards).filter(([,q])=>q>0).sort((a,b)=>a[0]<b[0]?-1:1).map(([k,q])=>k+":"+q).join("|");
  const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(txt));return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,32)}
async function maybeRecord(){const s=U.s,m=U.meta;if(!s||s.trials)return; /* Trials results aren't recorded (Plan D adds them) */if(!s.over||!m||!m.gid||m.recorded)return;
  const done=store2.get("cq.play.recorded",[]);if(done.includes(m.gid)){m.recorded=true;return}
  const c=sb();if(!c)return;m.recorded=true;saveLocal();
  const sides=m.mode==="ai"?[0]:[0,1];const rows=[];
  /* Nov 23: a deck that was legal when the game started is recorded even if a later update made it illegal (deprecated or renamed cards) */
  for(const side of sides){const d=m.decks[side];if(!d||!Array.isArray(d.heroes)||d.heroes.length!==3)continue;
    /* online: the guest's row is saved without an account; the guest's own browser claims it (claim_result) so it counts on their profile */
    rows.push({...(m.mode==="online"&&side===1?{user_id:null}:{}),game_id:m.gid,side,deck_key:await deckKey(d),deck_name:d.name,heroes:d.heroes,cards:d.cards,player_name:(s.p[side].name||"Guest").slice(0,40),mode:m.mode,result:s.winner<0?"draw":(s.winner===side?"win":"loss"),rounds:s.round,stats:recStats(s,side),
      started_at:m.t0?new Date(m.t0).toISOString():null,ended_at:new Date().toISOString(),active_secs:m.t0?Math.min(172800,Math.round((m.act||0)/1000)):null})}
  if(!rows.length){toast("This game wasn't recorded: the deck is missing its three heroes.");return}
  let{error}=await c.from("deck_results").insert(rows);
  /* the stats column may not exist yet: save the result without it */
  /* the time columns (Admin update) may not exist yet: save without them */
  if(error&&/started_at|ended_at|active_secs/i.test(error.message)){({error}=await c.from("deck_results").insert(rows.map(r=>{const x=Object.assign({},r);delete x.started_at;delete x.ended_at;delete x.active_secs;return x})))}
  if(error&&/stats/i.test(error.message)){({error}=await c.from("deck_results").insert(rows.map(r=>{const x=Object.assign({},r);delete x.stats;delete x.started_at;delete x.ended_at;delete x.active_secs;return x})))}
  if(error&&!/duplicate/i.test(error.message)){m.recorded=false;saveLocal();console.warn("Couldn't save the result:",error.message);toast("Couldn't record this game's result: "+error.message);return}
  store2.set("cq.play.recorded",done.concat([m.gid]).slice(-300));toast(AS()&&S.me?"Result recorded for Best Decks.":"Result recorded for Best Decks. Sign in so your games count on your profile and the Leaderboard.")}
function recStats(s,side){try{const g=E.gameStats(s);const sd=g.sides[side],od=g.sides[E.opp(side)];
  const o={v:1,rounds:g.rounds,lineup:{start:sd.start,final:sd.final},opp:{start:od.start,final:od.final},dmg:sd.dmg,prev:sd.prev,healer:sd.healer,tot:{dmg:sd.totDmg,prev:sd.totPrev,heal:sd.totHeal},end:s.conceded!=null?"concede":(s.deckedOut!=null?"deckout":(s.winner<0?"draw":"party"))};
  return JSON.stringify(o).length<5500?o:null}catch(e){return null}}
function myName(){return(AS()&&S.me&&S.me.name)||store2.get("cq.play.name","")||"Player"}
window.CQMyName=myName;
/* ---------- Update 40: players online + challenges (presence channel in online.js) ---------- */
function onlineListHTML(){const O=window.CQOnline;if(!O)return"";const L=O.list();const ok=deckChoices().some(d=>d.id===U.lobby.deck&&d.ok);
  const st={idle:"Online",ai:"In a game vs AI",online:"In an online game"};
  return`<section class="panel pl-players"><h2>Players online <span class="pl-note">(${L.length})</span></h2>
    ${L.length?`<ul class="pl-plist">${L.map(p=>`<li><span class="pl-pn"><b>${esc(p.name)}</b><small>${st[p.status]}</small></span>${p.status==="online"?`<button class="btn" disabled title="They're already in an online game">Busy</button>`:`<button class="btn" data-pa="challenge" data-k="${esc(p.key)}" data-n="${esc(p.name)}"${ok?"":" disabled title=\"Choose a legal deck first\""}>Challenge</button>`}</li>`).join("")}</ul>`:`<p class="pl-note">Nobody else is online right now.</p>`}
    <p class="pl-note">Challenging someone opens a room with the deck chosen above${isAdm()?`, as <b>${boPick()===3?"Best of 3":"Best of 1"}</b>`:""}. They pick their deck when they accept.</p></section>`}
function hookOnline(){const O=window.CQOnline;if(U.onlineHooked||!O)return;U.onlineHooked=true;
  O.onChange(()=>{if(U.mode==="lobby"&&!U.s)render()});
  O.on("challenge",p=>{
    if(U.net){O.send("challenge-reply",{to:p.from,ok:false,busy:true});return}
    const inAI=!!(U.vsAI&&U.s&&!U.s.over);U.challenge=p;
    const ch=deckChoices();if(!ch.some(d=>d.id===U.lobby.deck&&d.ok))U.lobby.deck=(ch.find(d=>d.ok)||{}).id||"";
    const opts=ch.map(d=>`<option value="${esc(d.id)}" ${d.id===U.lobby.deck?"selected":""} ${!d.ok?"disabled":""}>${esc(d.name)}</option>`).join("");
    /* its own pop-up (not the game's modal), so it shows on any page of the site and a game prompt can't replace it */
    document.getElementById("pl-chal")?.remove();const m=document.createElement("div");m.className="modal";m.id="pl-chal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");
    m.innerHTML=`<div class="box"><h2>${esc(p.fromName||"A player")} challenges you!</h2><p class="pl-chbo">${p.bo===3?"<b>Best of 3</b> match. Your deck's sideboard comes along, and you can swap cards between games.":"<b>Best of 1</b>: one game."}</p>${inAI?`<p class="note warn">Your current game will be saved if you accept. You can resume it from the Play tab later.</p>`:""}
      <label>Your deck<select class="ch-deck">${opts}</select></label>
      <div class="actions"><button class="btn primary go ch-acc">Accept</button><button class="btn ch-dec">Decline</button></div></div>`;
    m.querySelector(".ch-deck").addEventListener("change",e=>{U.lobby.deck=e.target.value});
    m.querySelector(".ch-acc").addEventListener("click",()=>acceptChallenge());m.querySelector(".ch-dec").addEventListener("click",()=>declineChallenge());
    (document.getElementById("layer")||document.body).appendChild(m)});
  O.on("reply",p=>{const n=U.net;if(!n||n.role!=="host"||!n.challenge||n.challenge.to!==p.from)return;
    if(p.ok){toast(`${n.challenge.name} accepted. Joining…`);return}
    toast(p.busy?`${n.challenge.name} is busy in another game.`:`${n.challenge.name} declined your challenge.`);if(!U.s)leaveGame()})}
function sendChallenge(to,name){const O=window.CQOnline;if(!O)return;if(O.isMe&&O.isMe(to)){toast("You can't challenge yourself.");return}if(U.s&&!U.s.over&&U.vsAI)saveLocal();hostRoom();if(!U.net)return;
  U.net.challenge={to,name};O.send("challenge",{to,code:U.net.code,bo:U.net.bo===3?3:1});toast(`${U.net.bo===3?"Best-of-3":"Best-of-1"} challenge sent to ${name}. Waiting for an answer…`)}
function acceptChallenge(){const p=U.challenge,O=window.CQOnline;document.getElementById("pl-chal")?.remove();if(!p||!O)return;U.challenge=null;
  if(!deckChoices().some(d=>d.id===U.lobby.deck&&d.ok)){toast("Choose a legal deck first.");return}
  /* an AI game in progress stays saved (cq.play.local) and can be resumed from the lobby */
  if(U.vsAI&&U.s&&!U.s.over){saveLocal();clearTimeout(U.aiT)}U.s=null;U.vsAI=false;
  O.send("challenge-reply",{to:p.from,ok:true});if(location.hash!=="#play")location.hash="play";joinRoom(p.code)}
function declineChallenge(){const p=U.challenge,O=window.CQOnline;document.getElementById("pl-chal")?.remove();U.challenge=null;if(p&&O)O.send("challenge-reply",{to:p.from,ok:false})}
setTimeout(function hk(){hookOnline();if(!U.onlineHooked)setTimeout(hk,1000)},500);

/* ---------- game control ---------- */
function startAI(){U.lastTrial=null;U.trialsWatch=false;const dm=deckById(U.lobby.deck),da=deckById(U.lobby.ai);if(!dm){toast("Choose a legal deck (3 Heroes, at least 50 cards) for yourself.");return}
  if(!da){toast("Choose a deck for the AI.");return}
  U.match=null;if(boPick()===3){const bad=E.validateSide(dm);if(bad.length){toast("Your sideboard isn't legal: "+bad[0]);return}U.match=newMatch("ai",dm,da)}
  startAIGame(dm,da)}
function startAIGame(dm,da){U.lastTrial=null;U.trialsWatch=false;U.overHide=false;
  {const seed=(Math.random()*2**31)|0;const players=[{name:myName(),deck:dm},{name:"AI · "+da.name.replace(/ \(starter\)/,""),deck:da,ai:true}];
  U.s=E.newGame({seed,players});
  U.meta={gid:newGid(),mode:"ai",t0:Date.now(),lt:Date.now(),act:0,decks:[deckMeta(dm),deckMeta(da)],setup:logSetup(seed,players),acts:[]}}
  U.gameKey="g"+Date.now();U.me=0;U.vsAI=true;U.net=null;U.mode="game";U.tgt=null;U.man=null;saveLocal();render();pumpAI()}
/* Learn to Play (tutorial.js): a coached game vs the AI. No result is recorded and no resume slot is kept. fix(s) may stack the opening hand and first draws. */
U.startTutorial=function(dm,da,fix){clearTimeout(U.aiT);
  U.s=E.newGame({seed:(Math.random()*2**31)|0,players:[{name:myName(),deck:dm},{name:"AI · "+da.name.replace(/ \(starter\)/,""),deck:da,ai:true}]});
  if(typeof fix==="function")fix(U.s);
  U.meta=null;U.gameKey="g"+Date.now();U.me=0;U.vsAI=true;U.net=null;U.mode="game";U.tgt=null;U.man=null;U.overHide=false};
U.pumpAI=()=>pumpAI();U.render=()=>render();U.leave=()=>leaveGame();U.save=()=>saveLocal();
function view(){return U.s}
function send(a){if(U.spec)return;
  if(U.net&&U.net.role==="guest"){U.net.ch.send({type:"broadcast",event:"act",payload:{a,cid}});U.busy=true;U.tgt=null;render();return}
  const r=E.act(U.s,U.me,a);if(!r.ok){toast(r.err||"Not legal.");render();return}
  U.tgt=null;afterChange()}
/* active play time (Admin page): each gap between actions counts up to 3 minutes, so time away or paused is left out */
const IDLE_CAP=180000;
function tickTime(){const m=U.meta;if(!m||m.recorded)return;const now=Date.now();if(m.lt)m.act=(m.act||0)+Math.min(Math.max(0,now-m.lt),IDLE_CAP);m.lt=now}
function afterChange(){tickTime();saveLocal();if(U.net&&U.net.role==="host")broadcast();render();pumpAI();if(U.s&&U.s.over&&(U.vsAI||(U.net&&U.net.role==="host"))){maybeRecord();maybeSaveLog()}}
function pumpAI(){clearTimeout(U.aiT);if(!U.vsAI||!U.s||U.s.over)return;
  if(!nextAI(U.s))return;
  U.aiT=setTimeout(()=>{if(!U.s||!U.stepAI())return;afterChange()},U.fast?0:(U.s.phase==="battle"&&!U.s.pend.length?650:350))}

/* ---------- online (Supabase Realtime) ---------- */
function sb(){return typeof SB!=="undefined"?SB:null}
function newCode(){const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<5;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
function openChannel(code,role,onReady){const c=sb();if(!c){toast("Online play needs the site's account service.");return null}
  const ch=c.channel("cq-play-"+code,{config:{broadcast:{self:false},presence:{key:cid}}});
  ch.on("broadcast",{event:"act"},({payload})=>{if(U.net&&U.net.role==="host")onGuestAct(payload)});
  ch.on("broadcast",{event:"next"},({payload})=>{if(U.net&&U.net.role==="host")onGuestNext(payload)});
  ch.on("broadcast",{event:"hello"},({payload})=>{if(U.net&&U.net.role==="host")onHello(payload)});
  ch.on("broadcast",{event:"state"},({payload})=>{if(U.net&&U.net.role==="guest"&&payload.to===cid){const was=U.s;U.s=payload.s;U.me=payload.me;U.busy=false;U.mode="game";U.match=payload.match||null;if(U.s&&!U.s.over&&(!was||was.over)){document.getElementById("pl-sb")?.remove();U.sb=null;U.overHide=false}if(payload.err)toast(payload.err);if(payload.gid&&U.s&&U.s.over)claimResult(payload.gid);render()}});
  ch.on("broadcast",{event:"full"},({payload})=>{if(U.net&&U.net.role==="guest"&&payload.to===cid){toast("That room already has two players.");leaveGame()}});
  ch.on("presence",{event:"sync"},()=>{if(!U.net)return;const st=ch.presenceState();U.net.peers=Object.keys(st).filter(k=>k!==cid).length;render()});
  ch.subscribe(async status=>{if(status==="SUBSCRIBED"){await ch.track({name:myName(),role});onReady&&onReady()}else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){toast("Couldn't reach the game server. Check your connection.")}});
  return ch}
function hostRoom(resume){U.gameKey="g"+Date.now();const dm=deckById(U.lobby.deck);if(!resume&&!dm){toast("Choose a legal deck first.");return}
  const code=resume?resume.code:newCode();U.vsAI=false;U.s=resume?resume.s:null;U.me=0;U.meta=resume?resume.meta||null:null;if(U.meta)U.meta.lt=0;
  U.match=resume?resume.match||null:null;
  U.net={role:"host",code,deck:dm||(U.match&&U.match.cur[0])||null,guest:resume?resume.guest:null,gname:resume?resume.gname||null:null,bo:resume?(resume.bo||1):boPick(),peers:0};U.mode=U.s?"game":"room";
  if(!resume&&U.net.bo===3){const bad=E.validateSide(dm);if(bad.length){toast("Your sideboard isn't legal: "+bad[0]);U.net=null;U.mode="lobby";return}}
  U.net.ch=openChannel(code,"host",()=>{if(U.s)broadcast()});render()}
function joinRoom(code,resume){U.gameKey="g"+Date.now();code=(code||"").trim().toUpperCase();if(!/^[A-Z0-9]{5}$/.test(code)){toast("Room codes are 5 letters/numbers.");return}
  const rg=resume?store2.get("cq.play.guest",null):null;const dm=resume?(rg&&rg.deck)||null:deckById(U.lobby.deck);if(!resume&&!dm){toast("Choose a legal deck first.");return}
  U.vsAI=false;U.s=null;U.me=1;U.match=null;U.net={role:"guest",code,deck:dm,base:resume?(rg&&rg.base)||null:(dm?deckCl(dm):null),peers:0};U.mode="room";store2.set("cq.play.guest",{code,deck:dm,base:U.net.base});
  U.net.ch=openChannel(code,"guest",()=>{U.net.ch.send({type:"broadcast",event:"hello",payload:{cid,name:myName(),deck:dm}})});render()}
function onHello(p){
  if(!U.s){if(!p.deck){return}const bad=E.validateDeck(p.deck);if(bad.length){U.net.ch.send({type:"broadcast",event:"state",payload:{to:p.cid,s:null,me:1,err:"Your deck isn't legal: "+bad[0]}});return}
    if(U.net.bo===3){const bs=E.validateSide(p.deck);if(bs.length){U.net.ch.send({type:"broadcast",event:"state",payload:{to:p.cid,s:null,me:1,err:"Your sideboard isn't legal: "+bs[0]}});return}}
    U.net.guest=p.cid;let gn=(p.name||"Guest").slice(0,24);if(gn===myName())gn+=" 2";U.net.gname=gn;U.match=U.net.bo===3?newMatch("online",U.net.deck,p.deck):null;newOnlineGame(p.deck,gn);toast(`${p.name||"A player"} joined. Good luck!${U.match?" Best of 3.":""}`);return}
  if(U.net.guest&&p.cid!==U.net.guest){U.net.ch.send({type:"broadcast",event:"full",payload:{to:p.cid}});return}
  U.net.guest=p.cid;broadcast()}
function newOnlineGame(gdeck,gn){const seed=(Math.random()*2**31)|0;const players=[{name:myName(),deck:U.net.deck},{name:gn,deck:gdeck}];U.s=E.newGame({seed,players});U.overHide=false;
  U.meta={gid:newGid(),mode:"online",t0:Date.now(),lt:Date.now(),act:0,decks:[deckMeta(U.net.deck),deckMeta(gdeck)],setup:logSetup(seed,players),acts:[]};U.mode="game";afterChange()}
function onGuestAct(p){if(!U.s||p.cid!==U.net.guest)return;const r=E.act(U.s,1,p.a);saveLocal();broadcast(r.ok?null:r.err);render();if(U.s.over){maybeRecord();maybeSaveLog()}}
function broadcast(err){if(!U.net||!U.net.ch||!U.s||!U.net.guest)return;if(U.s.over)matchTally();U.net.ch.send({type:"broadcast",event:"state",payload:{to:U.net.guest,s:E.redact(U.s,1),me:1,err:err||null,gid:U.s.over&&U.meta?U.meta.gid:null,match:matchPub()}})}
/* guest: once the game is over, claim our side of the result the host saved (retries while the host's save lands) */
const claimed=new Set();
async function claimResult(gid){const c=sb(),st=AS();if(!c||!st||!st.uid||!gid||claimed.has(gid))return;claimed.add(gid);
  for(let i=0;i<6;i++){await new Promise(r=>setTimeout(r,i?4000:2500));try{const{data,error}=await c.rpc("claim_result",{gid});if(error)return;if(data>0){toast("Result saved to your profile.");return}}catch(e){return}}}
function leaveGame(){specHostStop();leaveSpec();U.gameKey=null;clearTimeout(U.aiT);if(U.net&&U.net.ch){try{sb().removeChannel(U.net.ch)}catch(e){}}
  if(U.net&&U.net.role==="guest")store2.del("cq.play.guest");if(U.net&&U.net.role==="host")store2.del("cq.play.host");
  if(U.vsAI)store2.del(U.s&&U.s.trials?TKEY:"cq.play.local");U.net=null;U.s=null;U.match=null;document.getElementById("pl-sb")?.remove();U.sb=null;U.vsAI=false;U.trialsWatch=false;U.tut=null;U.mode="lobby";U.tgt=null;U.man=null;render()}

/* ---------- Nov 19: spectate mode ----------
   The player who runs a game (the room host, or the player in a vs-AI game) opens a watch channel "cq-spec-<game id>".
   Watchers join it; while any watcher is there, the runner sends the state with both hands and libraries hidden. */
function specGameId(){const s=U.s;if(!s||U.spec||U.tut)return null;if(s.trials)return null;
  if(U.net&&U.net.role==="host"&&U.net.code)return"room:"+U.net.code;if(U.vsAI&&window.CQOnline)return"ai:"+window.CQOnline.me();return null}
function specHost(){const c=sb();const id=specGameId();
  if(!c||!id||(U.s&&U.s.over&&!U.specTx)){if(U.specTx&&U.specTx.id!==id)specHostStop();return}
  if(U.specTx&&U.specTx.id===id)return;specHostStop();
  const ch=c.channel("cq-spec-"+String(id).replace(/[^A-Za-z0-9_-]/g,"-"),{config:{broadcast:{self:false},presence:{key:"run-"+cid}}});const tx={id,ch,n:0,t:null};U.specTx=tx;
  ch.on("presence",{event:"sync"},()=>{const st=ch.presenceState();const n=Object.keys(st).filter(k=>k.startsWith("w-")).length;const more=n>tx.n;tx.n=n;if(more)specSend(true);render()});
  ch.on("broadcast",{event:"want"},()=>specSend(true));
  ch.subscribe(st=>{if(st==="SUBSCRIBED")ch.track({role:"run"})})}
function specHostStop(){const tx=U.specTx;if(!tx)return;clearTimeout(tx.t);try{sb().removeChannel(tx.ch)}catch(e){}U.specTx=null}
function specSend(now){const tx=U.specTx;if(!tx||!tx.n||!U.s)return;clearTimeout(tx.t);
  const go=()=>{if(!U.s||!U.specTx)return;tx.ch.send({type:"broadcast",event:"spec",payload:{s:E.redact(U.s,-1)}})};if(now)go();else tx.t=setTimeout(go,250)}
function spectate(g){const c=sb();if(!c){toast("Watching games needs the site's account service.");return}if(!g)return;
  leaveSpec();U.gameKey="g"+Date.now();U.spec={g,ch:null,names:null};U.s=null;U.me=0;U.vsAI=false;U.net=null;U.mode="spec-wait";
  const ch=c.channel("cq-spec-"+String(g).replace(/[^A-Za-z0-9_-]/g,"-"),{config:{broadcast:{self:false},presence:{key:"w-"+cid}}});U.spec.ch=ch;
  ch.on("broadcast",{event:"spec"},({payload})=>{if(!U.spec||!payload||!payload.s)return;U.s=payload.s;U.mode="game";render()});
  ch.subscribe(st=>{if(st==="SUBSCRIBED"){ch.track({role:"watch",name:myName()});setTimeout(()=>{if(U.spec&&U.spec.ch===ch)ch.send({type:"broadcast",event:"want",payload:{}})},600);
      setTimeout(()=>{if(U.spec&&U.spec.ch===ch&&!U.s){toast("That game isn't sending yet. It may have just ended.")}},6000)}
    else if(st==="CHANNEL_ERROR"||st==="TIMED_OUT")toast("Couldn't reach the game server.")});render()}
function leaveSpec(){if(!U.spec)return;if(U.spec.ch){try{sb().removeChannel(U.spec.ch)}catch(e){}}U.spec=null}
function specGamesHTML(){const O=window.CQOnline;if(!O||!O.games)return"";const G=O.games();
  return`<section class="panel pl-players pl-watch"><h2>Watch a game <span class="pl-note">(${G.length})</span></h2>
    ${G.length?`<ul class="pl-plist">${G.map(g=>`<li><span class="pl-pn"><b>${esc(g.ai?`${g.names[0]||"Player"} vs AI`:g.names.join(" vs ")||"Online game")}</b><small>${g.ai?"Game vs AI":"Online game"}</small></span><button class="btn" data-pa="spec" data-g="${esc(g.g)}">Watch</button></li>`).join("")}</ul>`:`<p class="pl-note">No games are being played right now.</p>`}
    <p class="pl-note">Spectators see the board, the log and both players' hand sizes, never the cards in hand.</p></section>`}
function specMidHTML(s){const pr=s.pend[0];const pn=p=>esc(s.p[p]?s.p[p].name:"");
  let st=s.over?(s.winner<0?"The game is a draw.":`🏆 ${pn(s.winner)} wins.`):s.phase==="mull"?"Players are choosing their opening hands.":s.phase==="town"?"Town: the players are shopping.":pr&&pr.pid!=null&&pr.pid>=0?`${pn(pr.pid)} is choosing…`:s.phase==="battle"?`${pn(s.prio)} to act.`:`${esc(s.phase||"")}`;
  return`<section class="pl-mid pl-specbar"><div class="pl-round"><b>Round ${s.round||"–"}</b> · ${esc(({mull:"Mulligan",dawn:"Dawn",battle:"Battle",dusk:"Dusk",town:"Town"})[s.phase]||s.phase||"")}</div>
    <div class="pl-prompt">👁 Watching ${pn(0)} vs ${pn(1)} · ${st}</div><div class="pl-acts"><button class="btn" data-pa="spec-leave">Stop watching</button></div></section>`}
/* Nov 19: any choice pop-up can be tucked into a tab at the bottom center so you can check the board, then reopened */
function modalMinTab(s,pr,key){let tab=document.getElementById("pl-modtab");
  if(U.modalMin!==key||!pr){if(tab)tab.remove();return false}
  if(document.getElementById("pl-modal")&&document.getElementById("pl-modal").dataset.k)closeModal();
  if(!tab){tab=document.createElement("button");tab.id="pl-modtab";tab.type="button";tab.dataset.pa="modal-max";(document.getElementById("layer")||document.body).appendChild(tab)}
  tab.innerHTML=`<span class="mt-k">Choice waiting</span><b>${esc(pr.title||({scry:"Scry",choose:"Choose cards",combo:"Combo"})[pr.type]||"Make your choice")}</b><span class="mt-o">Open ▴</span>`;return true}
function addViewBoard(){const m=document.getElementById("pl-modal");if(!m||!m.dataset.k||m.querySelector(".pl-viewboard"))return;const box=m.querySelector(".box");if(!box)return;
  box.insertAdjacentHTML("afterbegin",`<button type="button" class="btn sm pl-viewboard" data-pa="modal-min" title="Hide this choice to look at the board and your hand. Reopen it from the tab at the bottom.">👁 View board</button>`)}
/* Nov 19: the Echo zone lists its cards in the order they replay at Dawn; you can reorder your own */
function showEcho(pid){const s=view();if(!s)return;const pl=s.p[pid];const mine=!!E.ECHO_REORDER&&pid===U.me&&!U.spec&&!s.over&&U.mode==="game";
  const rows=pl.echo.map((e,i)=>{const d=cardOf((e.card||{}).id)||{};const tg=(e.targets||[]).filter(Boolean).map(nameOf).map(esc).join(", ");
    return`<li><span class="eo-n">${i+1}</span><span><b>${esc(d.name||"Card")}</b> <span class="pl-note">${esc(d.cls||"")}${i===0?" · plays first":""}</span>${tg?`<br><span class="pl-note">Targets when it was played: ${tg}</span>`:""}</span>${mine?`<span class="eo-b"><button class="btn sm" data-pa="echo-mv" data-i="${i}" data-d="-1" ${i?"":"disabled"} aria-label="Move up">▲</button><button class="btn sm" data-pa="echo-mv" data-i="${i}" data-d="1" ${i<pl.echo.length-1?"":"disabled"} aria-label="Move down">▼</button></span>`:""}</li>`}).join("");
  const m=modal(`<h2>${esc(pl.name)} · Echo (${pl.echo.length})</h2><p class="pl-note">These cards are played again at the next Dawn, for free, from top to bottom: first played, first replayed.${mine&&pl.echo.length>1?" Use the arrows to change the order.":""}</p>${rows?`<ol class="echo-list">${rows}</ol>`:'<p class="pl-note">No Echo cards right now.</p>'}<div class="actions"><button class="btn" data-pa="close">Close</button></div>`);m.dataset.echo=String(pid)}

/* ---------- helpers ---------- */
const nameOf=u=>{const s=view();if(!s||!u)return"?";if(u[0]==="P")return s.p[+u.slice(1)].name;const f=E.find(s,u);return f?f.o.name:"?"};
const cardOf=id=>BYID.get(id)||BYID.get("h:"+id)||BYID.get("t:"+id);
function scriptOfCard(id){const d=E.DB[id];return d?SCR()[d.name]:null}
function autoTag(id){const d=E.DB[id];if(!d)return"";if(d.kind==="equip")return MANUAL_EQ.has(d.name)?'<span class="auto m">PART BY HAND</span>':'<span class="auto">AUTO</span>';
  return E.isScripted(d.name)?'<span class="auto">AUTO</span>':'<span class="auto m">BY HAND</span>'}
const MANUAL_EQ=new Set(["Ritual Athame","Shillelagh","Helm of Aura","Ring of Vocation","Gauntlets of Growth"]);
function legal(){const s=view();if(!s||U.spec)return[];if(s.trials&&U.trialsWatch)return[];if(U.net&&U.net.role==="guest"&&U.busy)return[];try{return E.options(s,U.me)}catch(e){return[]}}

/* ---------- rendering ---------- */
function mergeLog(s){if(!s)return;if(U.logFor!==U.gameKey){U.logFor=U.gameKey;U.logAll=new Map()}
  s.log.forEach((l,i)=>{const k=l.n!=null?l.n:("i"+i);if(!U.logAll.has(k))U.logAll.set(k,l)})}
function exportLog(){const s=view();if(!s)return;mergeLog(s);
  const lines=[...U.logAll.values()].sort((a,b)=>(a.n||0)-(b.n||0));
  const pdesc=pl=>`${pl.name}${pl.deckName?` — deck "${pl.deckName}"`:""} — party: ${pl.heroes.map(h=>h.name+" ("+h.cls+")").join(", ")}`;
  const res=s.over?(s.winner<0?"Draw":`${s.p[s.winner].name} won`):`In progress (round ${s.round}, ${phaseLabel(s)})`;
  let out=`Riverstead — game log\nExported: ${new Date().toLocaleString()}\nMode: ${U.vsAI?"vs AI":U.net?"online room "+U.net.code:"local"}\nPlayer 1: ${pdesc(s.p[0])}\nPlayer 2: ${pdesc(s.p[1])}\nResult: ${res}\n\n`;
  let lastR=null;lines.forEach(l=>{if(l.r!==lastR&&!/^—/.test(l.m)){lastR=l.r}out+=(/^—/.test(l.m)?"\n":"")+`[R${l.r}] ${l.m}\n`});
  if(s.over)out+=statsText(s);
  if(lines.length&&lines[0].n>1)out+=`\n(Note: the first ${lines[0].n-1} log lines happened before this browser joined and aren't included.)\n`;
  const blob=new Blob([out],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");const d=new Date();
  a.href=url;a.download=`crystal-quest-game-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}-${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}.txt`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast("Game log downloaded.")}
/* hand scroller: arrows and the bar show only when some cards are out of view */
function handOvf(he){const w=he.closest(".pl-handwrap");if(!w)return;const ovf=he.scrollWidth>he.clientWidth+2;he.classList.toggle("ovf",ovf);
  w.classList.toggle("ovf-l",ovf&&he.scrollLeft>2);w.classList.toggle("ovf-r",ovf&&he.scrollLeft+he.clientWidth<he.scrollWidth-2)}
addEventListener("resize",()=>{const he=document.querySelector("#play-root .pl-hand");if(he)handOvf(he)});

/* ---------- sound effects (synthesized with Web Audio; no files) ---------- */
const SND=(()=>{let ac=null;const on=()=>store2.get("cq.sound",true)!==false;
  const ctx=()=>{if(!ac){try{ac=window.CQVol?CQVol.ctx():new (window.AudioContext||window.webkitAudioContext)()}catch(e){ac=null}}if(ac&&ac.state==="suspended")ac.resume().catch(()=>{});return ac};
  /* Nov 13: every effect goes through one gain node set by the Sound effects volume */
  let mg=null;const out=()=>{const a=ctx();if(!a)return null;if(!mg){mg=a.createGain();mg.connect(a.destination)}mg.gain.value=window.CQVol?CQVol.vol("sfx")/100:1;return mg};
  const env=(a,g,t0,att,dec,peak)=>{g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(peak,t0+att);g.gain.exponentialRampToValueAtTime(0.0001,t0+att+dec)};
  function tone(f,t,dur,type,peak,f2){const a=ctx();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type||"sine";const t0=a.currentTime+t;o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+dur);env(a,g,t0,0.01,dur,peak||0.18);o.connect(g).connect(out());o.start(t0);o.stop(t0+dur+0.05)}
  function noise(t,dur,peak,lo,hi){const a=ctx();if(!a)return;const n=Math.floor(a.sampleRate*dur);const b=a.createBuffer(1,n,a.sampleRate);const d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    const src=a.createBufferSource();src.buffer=b;const f=a.createBiquadFilter();f.type="bandpass";const t0=a.currentTime+t;f.frequency.setValueAtTime(lo||800,t0);if(hi)f.frequency.exponentialRampToValueAtTime(hi,t0+dur);f.Q.value=0.8;const g=a.createGain();env(a,g,t0,0.005,dur,peak||0.25);src.connect(f).connect(g).connect(out());src.start(t0);src.stop(t0+dur+0.05)}
  const FX={
    chime:t=>{tone(1318.5,t,0.5,"sine",0.12);tone(1975.5,t+0.09,0.6,"sine",0.09)},
    attack:t=>{noise(t,0.18,0.3,3000,500);tone(160,t+0.12,0.16,"square",0.12,60)},
    hit:t=>{noise(t,0.09,0.28,1200,300);tone(110,t,0.12,"triangle",0.2,55)},
    arrow:t=>{tone(900,t,0.12,"triangle",0.12,300);noise(t+0.02,0.22,0.16,5000,1500);tone(140,t+0.22,0.08,"square",0.1,80)},
    spell:t=>{[523,659,784,1046].forEach((f,i)=>tone(f,t+i*0.05,0.35,"sine",0.08))},
    card:t=>{noise(t,0.12,0.14,2500,6000)},
    heal:t=>{[392,523,659,784].forEach((f,i)=>tone(f,t+i*0.07,0.4,"sine",0.08))},
    level:t=>{tone(150,t,0.34,"sawtooth",0.07,880);tone(300,t+0.02,0.34,"square",0.035,1760);noise(t,0.34,0.12,500,6000);
      tone(1046,t+0.32,0.3,"sine",0.1);tone(1568,t+0.36,0.32,"sine",0.07);tone(2093,t+0.40,0.3,"triangle",0.05)},
    equip:t=>{[0,0.075].forEach((d,k)=>{noise(t+d,0.07,0.32-k*0.08,3200,1800);[1250,1873,2671,3390].forEach((f,i)=>tone(f*(k?1.06:1),t+d,0.16+i*0.03,i%2?"triangle":"square",0.035));tone(130,t+d,0.1,"triangle",0.16,70)})},
    shatter:t=>{noise(t,0.07,0.36,4500,2500);noise(t+0.02,0.42,0.2,7000,2000);for(let i=0;i<9;i++)tone(2200+Math.random()*4200,t+0.02+i*0.032,0.09,"sine",0.05)},
    gold:t=>{tone(1567,t,0.12,"square",0.06);tone(2093,t+0.07,0.25,"square",0.06)},
    aura:t=>{tone(440,t,0.45,"sine",0.1,880)},
    status:t=>{tone(300,t,0.3,"sawtooth",0.06,180);tone(310,t+0.05,0.3,"sawtooth",0.05,170)},
    destroy:t=>{noise(t,0.35,0.35,1800,200);tone(90,t,0.3,"square",0.14,40)},
    death:t=>{[392,330,262,196].forEach((f,i)=>tone(f,t+i*0.14,0.32,"triangle",0.12))},
    summon:t=>{tone(220,t,0.3,"triangle",0.12,440);noise(t+0.1,0.2,0.1,600,2000)},
    pass:t=>{tone(660,t,0.1,"sine",0.08);tone(494,t+0.1,0.16,"sine",0.08)},
    tick:t=>{noise(t,0.035,0.42,5200,2200);tone(1900,t,0.04,"triangle",0.09,1200)},
    draw:t=>{noise(t,0.1,0.12,4000,1500)},
    win:t=>{[523,659,784,1046,784,1046].forEach((f,i)=>tone(f,t+i*0.11,0.3,"square",0.06))},
    lose:t=>{[392,370,349,262].forEach((f,i)=>tone(f,t+i*0.2,0.4,"triangle",0.1))}};
  /* Update 30: recorded sound effects (assets/sfx, .ogg with .mp3 for Safari). Anything without a file stays synthesized. */
  const FILES={store:"sfx_item_2_bag_and_chime",level:"sfx_level_up_chime_5_mini_ta_da",shatter:"sfx_shatter_1_glass",crumble:"sfx_shatter_3_stone_crumble",
    heal:"sfx_spell_2_ice_cure_sparkle",birdsong:"sfx_animal_1_songbird",arrow:"sfx_hit_1_sword_slash",
    smith:"sfx_smith_2_strikes_and_quench",death:"sfx_spell_calm_3_reverse_gong",status:"sfx_status_2_poison_bubbles",curse:"sfx_status_3_curse_tritone",revive:"sfx_legendary_3_crystal_motif"};
  const ext=(()=>{try{return new Audio().canPlayType('audio/ogg; codecs="vorbis"')?"ogg":"mp3"}catch(e){return"mp3"}})();
  const BUF={},last={};let loading=false;
  function load(){const a=ctx();if(!a||loading)return;loading=true;
    for(const[k,f]of Object.entries(FILES))fetch(`${ICON_BASE}sfx/${f}.${ext}?v=1`).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,no)=>a.decodeAudioData(b,ok,no))).then(d=>{BUF[k]=d}).catch(()=>{})}
  function file(k,t){const a=ctx(),b=BUF[k];if(!a||!b)return false;const now=a.currentTime;if(last[k]&&now-last[k]<0.25)return true;last[k]=now;
    const src=a.createBufferSource(),g=a.createGain();g.gain.value=0.6;src.buffer=b;src.connect(g).connect(out());src.start(now+(t||0));return true}
  function play(k,t){if(!on())return;if(FILES[k]&&file(k,t))return;if(k==="crumble")k="hit";if(k==="birdsong")k="summon";if(k==="store")k="gold";if(k==="smith")k="equip";if(k==="revive")k="heal";if(k==="curse")k="status";if(!FX[k])return;try{FX[k](t||0)}catch(e){}}
  /* one sound per log line, picked from what happened */
  const RULES=[[/🏆/,"win"],[/ is resurrected| revives |is revived/,"revive"],[/ at the Blacksmith /,"smith"],[/ stays at the Inn| visits the Shop/,"store"],[/ dies\b|has died/,"death"],[/\(summon\) is destroyed/,"destroy"],[/ is destroyed| destroys /,"shatter"],[/ equips /,"equip"],[/ reaches Level \d|levels? up|gains a level/,"level"],[/ heals? |healed|resurrected|revives /,"heal"],
    [/activates (?:[A-Z][\w'-]*\s)*(?:Arrow|Shot|Bolt|Dart|Force)\b|Arrow/,"arrow"],[/ attacks\b|band attack/i,"attack"],[/summons |Summon a|conjures |creates a/,"summon"],
    [/ deals? \d+ (?:\w+ )?damage| loses \d+ HP/,"hit"],[/ (Burn|Poison|Stun|Wound|Confuse)/,"status"],[/ Gold\b/,"gold"],[/ Aura\b/,"aura"],
    [/ plays /,"card"],[/ passes\./,"pass"],[/ draws? /,"draw"]];
  function pick(m){for(const[r,k]of RULES)if(r.test(m))return k;return null}
  return{on,play,pick,toggle(){if(window.CQVol)CQVol.setOn("sfx",!on());else store2.set("cq.sound",!on());if(on())play("chime")},unlock(){ctx();load()}}})();
window.CQSnd=SND; /* lets the Sound settings play a test chime */
/* Update 30: Play tab background music, with its own on/off (cq.music). Plays while a game is open on the Play tab. */
const MUS=(()=>{let el=null;const on=()=>store2.get("cq.music",true)!==false;
  function get(){if(!el){el=new Audio();const ogg=el.canPlayType('audio/ogg; codecs="vorbis"');el.src=`${ICON_BASE}sfx/theme_3_boss_fight_it_all_rides_on_this.${ogg?"ogg":"mp3"}?v=1`;el.loop=true;el.preload="auto";if(window.CQVol)CQVol.attach(el,0.32);else el.volume=0.32}return el}
  function sync(want){if(want&&on()&&location.hash==="#play"){const a=get();if(a.paused)a.play().catch(()=>{})}else if(el&&!el.paused)el.pause()}
  addEventListener("hashchange",()=>sync(false));document.addEventListener("visibilitychange",()=>{if(document.hidden)sync(false);else if(U.s&&U.mode!=="lobby")sync(true)});
  return{on,sync,toggle(){if(window.CQVol)CQVol.setOn("music",!on());else store2.set("cq.music",!on());sync(on())}}})();
/* Nov 13: a change on the account page, the tray or a volume pop-up updates the music and the Effects/Music buttons */
document.addEventListener("cq-vol",e=>{if(e.detail&&e.detail.kind==="music")MUS.sync(!!(U.s&&U.mode!=="lobby"));if(location.hash==="#play"&&U.s){clearTimeout(MUS._rt);MUS._rt=setTimeout(()=>{try{render()}catch(err){}},120)}});
/* Update 30: pointing at a card in your hand clicks and pops a 1.4x copy up over the Heroes (the copy ignores the mouse, so clicks still reach the card) */
let hcPop=null,hcOn=null;
function hcPopHide(){if(hcPop){const d=hcPop;hcPop=null;if(matchMedia("(prefers-reduced-motion:reduce)").matches)d.remove();else{d.classList.add("out");setTimeout(()=>d.remove(),150)}}if(hcOn)hcOn.classList.remove("lifted");hcOn=null}
/* touch screens send a fake mouseover on every tap: no hover pop-up or tick sound for those (Nov 12, 2026, iPad proposal 3) */
let lastTouch=0;document.addEventListener("pointerdown",e=>{if(e.pointerType==="touch"||e.pointerType==="pen")lastTouch=Date.now()},true);document.addEventListener("touchstart",()=>{lastTouch=Date.now()},{capture:true,passive:true});
document.addEventListener("mouseover",e=>{if(Date.now()-lastTouch<1000)return;if(typeof drag!=="undefined"&&drag&&drag.on)return;const hc=e.target.closest&&e.target.closest(".pl-hand .hc");if(hc===hcOn)return;hcPopHide();if(!hc||!matchMedia("(hover:hover)").matches)return;hcOn=hc;
  SND.play("tick");const card=hc.querySelector(".card");if(!card)return;const r=card.getBoundingClientRect(),S=1.4,w=r.width*S,h=r.height*S;
  const d=document.createElement("div");d.className="hc-pop";d.innerHTML=`<div class="hc-3d">${card.outerHTML}</div>`;d.style.width=w+"px";
  const left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2)),top=Math.max(8,r.bottom-h+4);d.style.left=left+"px";d.style.top=top+"px";d.style.setProperty("--s0",(1/S).toFixed(3));d.style.setProperty("--dy",Math.max(0,r.bottom-(top+h))+"px");
  /* drawn at the bigger size (not scaled up), so the art and text stay sharp */
  const inner=d.querySelector(".card");if(inner){inner.style.width=w+"px";inner.style.height="auto"}
  document.body.appendChild(d);hcPop=d;hc.classList.add("lifted");try{if(typeof fitArt==="function")fitArt(d)}catch(err){}},true);
document.addEventListener("mousemove",e=>{if(!hcPop||!hcOn)return;const r=hcOn.getBoundingClientRect();const x=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y=Math.min(1,Math.max(0,(e.clientY-r.top)/r.height));
  const t3=hcPop.querySelector(".hc-3d");if(t3){t3.style.setProperty("--rx",((0.5-y)*12).toFixed(2)+"deg");t3.style.setProperty("--ry",((x-0.5)*16).toFixed(2)+"deg");t3.style.setProperty("--gx",(x*100).toFixed(0)+"%");t3.style.setProperty("--gy",(y*100).toFixed(0)+"%")}},{passive:true});
document.addEventListener("scroll",hcPopHide,true);addEventListener("blur",hcPopHide);
/* Drag to play: pull a card from your hand up onto the board and let go to play it (the same as pressing Play in the card's window).
   A short drag back into the hand cancels; a plain click still opens the card's window; sideways drags still scroll the hand. */
const DRAG_CSS=`.pl-hand .hc{touch-action:pan-x;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}.pl-hand .hc img{-webkit-user-drag:none;user-drag:none;-webkit-touch-callout:none}
.pl-hand .hc.dragsrc .card{opacity:.25}
/* the card follows the finger or mouse with a GPU transform (no layout or repaint while it moves); it stays held at the spot you grabbed */
.hc-drag{position:fixed;left:0;top:0;z-index:130;pointer-events:none;will-change:transform;contain:layout style}
.hc-drag-in{rotate:var(--tilt,0deg);scale:var(--sc,1.08);transition:scale .12s ease-out;will-change:transform;border-radius:12px;box-shadow:0 18px 30px rgba(0,0,0,.6)}
.hc-drag .card{margin:0}.hc-drag .zoom,.hc-drag .c-ctrl,.hc-drag .flip{display:none!important}
.hc-drag.over{--sc:1.16}.hc-drag.over.ok .hc-drag-in{box-shadow:0 0 0 3px #ffc100,0 0 22px rgba(255,193,0,.8),0 18px 30px rgba(0,0,0,.6)}
.hc-drag-tag{position:absolute;left:50%;top:100%;transform:translate(-50%,10px);white-space:nowrap;font:700 .9rem/1 var(--body);padding:7px 12px;border-radius:999px;background:#1b130c;color:#f3e6cf;border:2px solid #8A5E40;box-shadow:0 6px 16px rgba(0,0,0,.6)}
.hc-drag.over.ok .hc-drag-tag{background:#ffc100;color:#2A1606;border-color:#ffc100}
.hc-drag.over.no .hc-drag-tag{background:#5a1a12;color:#ffd2c8;border-color:#C0392B}
.dcand{outline:2px dashed #f2c14e!important;outline-offset:2px}
.dhit{outline:3px solid #f2c14e!important;outline-offset:3px;box-shadow:0 0 0 6px #f2c14e55,0 0 22px #f2c14e!important;filter:brightness(1.12)}
@media (prefers-reduced-motion:reduce){.hc-drag-in{transition:none}}`;
{const st=document.createElement("style");st.textContent=DRAG_CSS;document.head.appendChild(st)}
let drag=null,dragEat=0;
/* card art is an image: stop the browser's own image drag so the card drag can run */
document.addEventListener("dragstart",e=>{if(e.target.closest&&e.target.closest("#play-root .pl-hand"))e.preventDefault()},true);
/* Nov 20: drop on a target: cards whose first choice is a target light up the legal targets while dragging; releasing on one plays the card at it */
function dragTargets(uid){const s=view();if(!s||U.tgt)return null;const pl=s.p[U.me];const c=pl.hand.find(x=>x.uid===uid);if(!c)return null;const d=E.DB[c.id]||{};
  const sc=SCR()[d.name];if(sc&&sc.modes)return null;if(d.cost==="X"||(sc&&sc.x))return null;
  const o=legal().find(x=>x.type==="play"&&(x.uid===uid||(pl.hand.find(h=>h.uid===x.uid)||{}).id===c.id));if(!o)return null;
  let sl=[];try{sl=E.need(s,U.me,Object.assign({},o,{uid}))}catch(e){return null}if(!sl.length||!sl[0].cands.length)return null;
  const set=new Set(sl[0].cands);const els=[];document.querySelectorAll('#play-root [data-pa="obj"][data-u]').forEach(el=>{if(set.has(el.dataset.u)&&!(el.parentElement&&el.parentElement.closest(`[data-u="${el.dataset.u}"]`))){el.classList.add("dcand");els.push(el)}});
  return{set,els,label:sl[0].label}}
function dragMark(d){if(!d||!d.tg)return;if(d.tg.els.length&&d.tg.els.every(el=>el.isConnected))return;d.tg.els=[];document.querySelectorAll('#play-root [data-pa="obj"][data-u]').forEach(el=>{if(d.tg.set.has(el.dataset.u)&&!(el.parentElement&&el.parentElement.closest(`[data-u="${el.dataset.u}"]`))){el.classList.add("dcand");d.tg.els.push(el)}})}
function dragHit(x,y,d){d=d||drag;if(!d||!d.tg)return null;dragMark(d);let hit=null;for(const el of document.elementsFromPoint(x,y)){const o=el.closest&&el.closest('#play-root [data-pa="obj"][data-u]');if(o&&d.tg.set.has(o.dataset.u)){hit=o;break}}
  if(d.hit!==hit||(hit&&!hit.classList.contains("dhit"))){if(d.hit)d.hit.classList.remove("dhit");if(hit)hit.classList.add("dhit");d.hit=hit}return hit}
function dragClear(d){if(d&&d.tg)d.tg.els.forEach(el=>el.classList.remove("dcand","dhit"));document.querySelectorAll("#play-root .dhit,#play-root .dcand").forEach(el=>el.classList.remove("dcand","dhit"))}
function dragLine(){const hw=document.querySelector("#play-root .pl-handwrap");return hw?hw.getBoundingClientRect().top-8:innerHeight*0.7}
function dragInfo(uid){const s=view();if(!s)return{ok:false,why:""};const c=s.p[U.me].hand.find(x=>x.uid===uid);if(!c)return{ok:false,why:""};
  if(U.tgt)return{ok:false,why:"Finish choosing targets first"};
  const ok=legal().some(o=>o.type==="play"&&s.p[U.me].hand.find(x=>x.uid===o.uid&&x.id===c.id));const d=E.DB[c.id];
  let cost="";try{cost=E.cardCost(s,U.me,E.actorFor(s,U.me),d,0)+(d.cost==="X"?"+X":"")}catch(e){}
  return{ok,c,d,why:ok?"":(whyNot(s,c)||"Can't play this now"),label:ok?`Release to play${cost!==""?` (${cost} Aura)`:""}`:""}}
/* the moving card is built (art already decoded) as soon as you press, and only shown once you pull up */
function dragGhost(hc){const card=hc.querySelector(".card");if(!card)return null;const r=card.getBoundingClientRect();
  const g=document.createElement("div");g.className="hc-drag";g.style.width=r.width+"px";g.style.visibility="hidden";g.innerHTML='<div class="hc-drag-in">'+card.outerHTML+'</div><span class="hc-drag-tag"></span>';
  const inner=g.querySelector(".card");if(inner){inner.style.width="100%";inner.style.height="auto"}
  g.querySelectorAll("img").forEach(i=>{i.loading="eager";i.decoding="sync"});
  document.body.appendChild(g);try{if(typeof fitArt==="function")fitArt(g)}catch(err){}return{g,r}}
document.addEventListener("pointerdown",e=>{if(e.button!==0)return;const hc=e.target.closest&&e.target.closest("#play-root .pl-hand .hc");if(!hc||e.target.closest(".zoom,.flip,[data-zoom]"))return;
  if(drag&&drag.g&&!drag.on)drag.g.remove();
  const gh=dragGhost(hc);drag={uid:hc.dataset.u,el:hc,x:e.clientX,y:e.clientY,id:e.pointerId,on:false,g:gh&&gh.g,r:gh&&gh.r}},true);
document.addEventListener("pointermove",e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=drag.y-e.clientY;
  if(!drag.on){if(dy<8||dy<Math.abs(dx)*0.7)return;/* start dragging upward (a short, mostly upward pull) */
    if(!drag.g){drag=null;return}const g=drag.g,r=drag.r;hcPopHide();
    /* keep the spot you grabbed under your finger */
    drag.ox=Math.max(0,Math.min(r.width,drag.x-r.left));drag.oy=Math.max(0,Math.min(r.height,drag.y-r.top));
    g.querySelector(".hc-drag-in").style.transformOrigin=drag.ox+"px "+drag.oy+"px";
    g.style.transform=`translate3d(${(e.clientX-drag.ox).toFixed(1)}px,${(e.clientY-drag.oy).toFixed(1)}px,0)`;g.style.visibility="";
    drag.on=true;drag.tilt=0;drag.info=dragInfo(drag.uid);drag.tg=drag.info.ok?dragTargets(drag.uid):null;drag.el.classList.add("dragsrc");document.documentElement.classList.add("pl-dragging");
    try{drag.el.setPointerCapture(e.pointerId)}catch(err){}}
  e.preventDefault();drag.cx=e.clientX;drag.cy=e.clientY;
  if(!drag.raf)drag.raf=requestAnimationFrame(dragFrame)},{passive:false});
/* one screen update per frame, however many move events arrive */
function dragFrame(){const d=drag;if(!d||!d.on)return;d.raf=0;const g=d.g,inf=d.info,x=d.cx,y=d.cy;
  g.style.transform=`translate3d(${(x-d.ox).toFixed(1)}px,${(y-d.oy).toFixed(1)}px,0)`;
  const want=Math.max(-12,Math.min(12,(x-(d.lx==null?x:d.lx))*0.9));d.lx=x;d.tilt+=(want-d.tilt)*0.35;if(Math.abs(d.tilt)<0.05)d.tilt=0;
  g.style.setProperty("--tilt",d.tilt.toFixed(2)+"deg");
  const over=y<dragLine();const hit=dragHit(x,y);const hk=hit?hit.dataset.u:"";if(over!==d.over||hk!==d.hk){d.over=over;d.hk=hk;g.classList.toggle("over",over);g.classList.toggle("ok",over&&inf.ok);g.classList.toggle("no",over&&!inf.ok);
    const nm=hit?((hit.getAttribute("aria-label")||"").split(",")[0]||"this target"):"";
    const tag=g.querySelector(".hc-drag-tag");if(tag)tag.textContent=over?(inf.ok?(hit?`Release to play on ${nm}`:d.tg?`${inf.label} · or drop on a target`:inf.label):inf.why):"Drag onto the board to play"}
  if(d.tilt)d.raf=requestAnimationFrame(dragFrame)}/* keep easing the tilt back to level after the hand stops */
function dragEnd(e,cancel){if(!drag||(e&&e.pointerId!==drag.id))return;const d=drag;drag=null;if(!d.on){if(d.g)d.g.remove();return}if(d.raf)cancelAnimationFrame(d.raf);
  dragEat=Date.now();d.g.remove();d.el.classList.remove("dragsrc");document.documentElement.classList.remove("pl-dragging");
  const hit=!cancel&&e&&d.tg?dragHit(e.clientX,e.clientY,d):null;const tu=hit&&hit.dataset.u;dragClear(d);
  if(cancel||!e||(e.clientY>=dragLine()&&!tu))return;
  const inf=dragInfo(d.uid);if(!inf.ok){toast(inf.why||"You can't play that card right now.");return}
  closeModal();begin({type:"play",uid:d.uid});
  /* dropped on a legal target: use it as the first choice */
  if(tu&&U.tgt&&U.tgt.i===0&&U.tgt.slots[0]&&U.tgt.slots[0].cands.includes(tu))pickTarget(tu)}
document.addEventListener("pointerup",e=>dragEnd(e,false),true);
document.addEventListener("pointercancel",e=>dragEnd(e,true),true);
/* the click that ends a drag must not also open the card's window */
document.addEventListener("click",e=>{if(Date.now()-dragEat<350&&e.target.closest&&e.target.closest("#play-root .pl-hand")){e.stopPropagation();e.preventDefault()}},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&drag&&drag.on)dragEnd(null,true)});
document.addEventListener("pointerdown",()=>{SND.unlock();if(U.s&&U.mode!=="lobby"&&location.hash==="#play")MUS.sync(true)},{capture:true});

/* new game events since the last render: destroyed pop-ups, sounds, and a chime when the action shifts */
function gameFx(s){if(U.fxFor!==U.gameKey){U.fxFor=U.gameKey;U.fxSeen=(s.fx&&s.fx.length?s.fx[s.fx.length-1].n:0);U.sndSeen=Math.max(0,...s.log.map(l=>l.n||0));U.lastTurn=turnKey(s);return}
  /* destroyed objects */
  const fresh=(s.fx||[]).filter(f=>f.n>U.fxSeen);if(fresh.length){U.fxSeen=fresh[fresh.length-1].n;fresh.slice(-4).forEach((f,i)=>setTimeout(()=>destroyPop(f),i*420))}
  /* sounds from new log lines */
  const lines=s.log.filter(l=>(l.n||0)>U.sndSeen);if(lines.length){U.sndSeen=Math.max(...lines.map(l=>l.n||0));
    const ks=soundKeys(lines);
    let ov=s.over&&s.winner!=null&&s.winner!==U.me;ks.slice(0,5).forEach((k,i)=>SND.play(k==="win"&&ov?"lose":k,i*0.16));
    try{opPops(s,lines)}catch(e){console.warn(e)}}
    try{exhumePops(s)}catch(e){console.warn(e)}
  try{trialsPops(s)}catch(e){console.warn(e)}
  /* chime when the action shifts to the other player (or a new phase starts) */
  const tk=turnKey(s);if(tk!==U.lastTurn){U.lastTurn=tk;SND.play("chime",lines.length?0.5:0)}}
/* Update 30: opponent action pop-ups. Each opponent "starter" line (plays, activates, attacks, summons, equips, Town) opens a pop-up;
   the lines after it, up to the next starter, give its target(s) and a one-line result. Your own actions never pop up. */
const POP_START=/^(?:⚔ )?(.+?) (plays|activates|attacks|uses its ability|summons|conjures|creates|equips|visits the Shop|stays at the Inn|pays the Church|upgrades) ?(.*?)(?: \(|\.| for |: |$)/;
/* Exhume (Nov 13, 2026): an Exhume card of yours moved from your library to your discard pile pops up, since you can play it from there this turn */
const isExhume=d=>!!d&&/(^|\n)Exhume\./.test(d.rules||"");
function exhumeOk(s,pid,c){const pl=s.p[pid];return !!c&&((pl.t.milled||[]).includes(c.uid)&&isExhume(E.DB[c.id])||(pl.t.exhGrant||[]).includes(c.uid))&&pl.disc.some(x=>x.uid===c.uid)}
function exhumePops(s){if(!window.CQPop||U.me==null||!s)return;const key=U.gameKey||"g";if(exhumePops.key!==key){exhumePops.key=key;exhumePops.seen=new Set()}
  const pl=s.p[U.me];(pl.t.milled||[]).forEach(u=>{if(exhumePops.seen.has(u))return;exhumePops.seen.add(u);const c=pl.disc.find(x=>x.uid===u);if(!c||!isExhume(E.DB[c.id]))return;
    CQPop.push({who:"You · Exhume",cardId:c.id,verb:"",name:E.DB[c.id].name,dest:"your discard pile",sub:"Exhume: you can play it from your discard pile this turn, paying its costs. Open your discard pile and tap it, or use its Play button.",actorU:null,targetU:[]})})}
function trigOwner(s,name){for(let p=0;p<s.p.length;p++){const pl=s.p[p];if((pl.inv||[]).some(o=>o.name===name)||(pl.bf||[]).some(o=>o.name===name)||pl.heroes.some(h=>Object.values(h.eq||{}).some(e=>e&&e.name===name)||(h.ench||[]).some(e=>e.name===name)))return p}return null}
function trigPops(s,lines,objs,uidOf){const heroish=new Set(objs.map(o=>o.name));const seen=new Set();
  lines.forEach(l=>{const m0=String(l.m);let src=null,what="",dest="",tg=[];
    const d=/^(.+?) deals (\d+) (?:([A-Z][a-z]+) )?damage to (.+?)(?: \(|\.|$)/.exec(m0);
    if(d&&!heroish.has(d[1])&&byName(d[1])){src=d[1];what=`deals ${d[2]}${d[3]?" "+d[3]:""} damage`;dest=d[4];const u=uidOf(d[4]);if(u)tg.push(u)}
    else{const c=/^([^:]{3,40}): (.+)$/.exec(m0);if(c&&!/^(Echo|Opening Act|Engine error|Initiative roll)/.test(c[1])&&byName(c[1])&&!heroish.has(c[1])){src=c[1];what=c[2].replace(/\.$/,"")}}
    if(!src)return;const own=trigOwner(s,src);const owner=own!=null?own:l.p;if(owner==null||owner===U.me||owner<0)return;
    const key=src+"|"+what+"|"+dest;if(seen.has(key))return;seen.add(key);const card=byName(src);
    CQPop.push({who:((s.p[owner]||{}).name||"Opponent")+" · Triggered ability",cardId:card?card.id:null,verb:"",name:src,dest:"",sub:what+(dest?` → ${dest}`:""),actorU:null,targetU:tg})})}
function opPops(s,lines){if(!window.CQPop||U.me==null)return;
  /* Nov 12, 2026: the Song Opening Act puts into a hand pops up for both players */
  lines.forEach(l=>{const m=/^Opening Act: (.+) puts (.+) into their hand\.$/.exec(String(l.m));if(!m)return;const c=byName(m[2]);
    CQPop.push({who:(l.p===U.me?"You":(s.p[l.p]||{}).name||"Opponent")+" · Opening Act",cardId:c?c.id:null,verb:"puts",name:m[2],dest:"Hand",sub:"This Song goes into their hand.",actorU:null,targetU:[]})});
  const objs=[];s.p.forEach(pl=>{pl.heroes.forEach(h=>objs.push(h));(pl.bf||[]).forEach(o=>objs.push(o))});
  const uidOf=n=>{const o=objs.find(x=>x.name===n);return o?o.uid:null};
  const groups=[];lines.forEach(l=>{const echo=/^Echo: /.test(l.m);const m=POP_START.exec(String(l.m).replace(/^✋ /,"").replace(/^Echo: /,"").replace(/ again\.$/,"."));if(m)m.echo=echo;const sub=m&&/^(summons|conjures|creates)$/.test(m[2])&&groups.length&&groups[groups.length-1].l.p===l.p;
    if(m&&!sub&&l.p!=null&&l.p>=0){groups.push({l,m,after:[]})}else if(groups.length)groups[groups.length-1].after.push(l)});
  /* Nov 20: triggered abilities pop up too: a card in play that deals damage on its own ("The Forbidden Tuner deals 1 damage to X")
     or a card trigger line ("Tip Jar: …"). Shown when the card belongs to your opponent. */
  try{trigPops(s,lines,objs,uidOf)}catch(e){console.warn(e)}
  /* Echo replays happen on their own at Dawn, so they pop up for both players */
  groups.filter(g=>g.l.p!==U.me||g.m.echo).slice(-6).forEach(g=>{const[,actor,verb,rest]=g.m;const card=byName(rest)||null;
    const tgts=[];const add=n=>{const u=uidOf(n);if(u&&!tgts.includes(u))tgts.push(u)};
    if(verb==="attacks")add(rest);
    const names=objs.map(o=>o.name).filter((n,i,a)=>n&&n!==actor&&a.indexOf(n)===i).sort((x,y)=>y.length-x.length);
    let self=false;g.after.forEach(a=>{let m=String(a.m);if(/ (summons|conjures|creates) /.test(m))return;for(const n of names)if(m.includes(n)){add(n);m=m.split(n).join("")}if(actor&&m.includes(actor))self=true});
    const to=/→ ([^.]+?)\.?$/.exec(String(g.l.m));if(to){to[1].split(/, | and /).forEach(n=>{n=n.trim();if(n===actor)self=true;else add(n)})}
    const tn=tgts.map(u=>objs.find(o=>o.uid===u)).filter(Boolean).map(o=>o.name);
    const summoned=g.after.some(a=>/ (summons|conjures|creates) /.test(a.m));
    const dest=tn.length?tn.join(", "):self&&uidOf(actor)&&verb!=="attacks"?actor:verb==="summons"||verb==="conjures"||summoned?"Battlefield":verb==="equips"?rest.split(" to ")[1]||"":card&&/Item/.test(card.type||"")?"Inventory":card&&/Equipment/.test(card.type||"")?actor:card?"Discard":"";
    const label={"uses its ability":"uses its ability",plays:"plays",activates:"activates",attacks:"attacks",summons:"summons",conjures:"conjures",creates:"creates",equips:"equips",upgrades:"upgrades"}[verb];
    const att=verb==="attacks"?byName(actor):null;
    CQPop.push({who:(g.m.echo?"Echo · ":"")+(s.p[g.l.p]?(g.l.p===U.me?"You":s.p[g.l.p].name):"Opponent")+(uidOf(actor)&&!att?" · "+actor:""),cardId:att?att.id:card?card.id:null,verb:att?"":g.m.echo?"replays":label||"",name:att?actor+" attacks":label?rest:g.l.m.replace(/\.$/,""),
      dest:g.m.echo?"":verb==="attacks"?rest:dest,sub:g.after.length?g.after[0].m.replace(/\s*\(\d+\/\d+ HP\)/,""):"",actorU:uidOf(actor),
      /* an Echo replay happens on its own at Dawn and pays no costs, so it draws no arrow (the Heroes named in its lines were exhausted when it was first played) */
      targetU:g.m.echo?[]:verb==="attacks"&&uidOf(rest)?[uidOf(rest)]:tgts})})}
function classOf(name){const n=String(name||"").trim();if(!n)return null;const c=(typeof CARDS!=="undefined"&&CARDS.find(x=>x.name===n))||(typeof HEROES!=="undefined"&&HEROES.find(x=>x.name===n));return c?c.cls:null}
/* one sound key per log line; damage right after an attack is the attack's damage (stone crumble); a summon from a Druid card or Druid Hero is birdsong */
function soundKeys(lines){const ks=[];let atk=false,cls=null;lines.forEach(l=>{let k=SND.pick(l.m);const m=/^(?:⚔ )?(.+?) (plays|activates) (.+?)(?: \(| for |\.|$)/.exec(l.m);
    if(m){atk=false;cls=classOf(m[3])||classOf(m[1]);const cd=typeof CARDS!=="undefined"&&CARDS.find(x=>x.name===m[3].trim());if(cd&&cd.sub==="Curse")k="curse"}if(/ attacks /.test(l.m)&&!m)atk=true;
    if(k==="hit"&&atk)k="crumble";if(k==="summon"&&cls==="Druid")k="birdsong";if(k&&ks[ks.length-1]!==k)ks.push(k)});return ks}
U.snd={SND,MUS,classOf,soundKeys,starterDeck,opPops}; /* for tests */
function turnKey(s){if(s.over)return"over";if(s.pend[0])return"p"+s.pend[0].pid+":"+s.phase;if(s.phase==="battle")return"b"+s.prio;if(s.phase==="town")return"t"+(s.town&&s.town.order[s.town.i]);return s.phase+s.round}
function destroyPop(f){let L=document.getElementById("pl-fx");if(!L){L=document.createElement("div");L.id="pl-fx";L.setAttribute("aria-hidden","true");document.body.appendChild(L)}
  const c=(f.id&&cardOf(f.id))||byName(f.name);const el=document.createElement("div");el.className="fxc";
  el.innerHTML=(c?cardHTML(c,{nozoom:1}):`<div class="fxbox">${esc(f.name||"Object")}</div>`)+`<div class="fxl">${f.k==="exile"?"EXILED":"DESTROYED"}</div>`;
  L.appendChild(el);setTimeout(()=>el.remove(),1800)}
function byName(n){if(!n)return null;try{for(const c of BYID.values())if(c.name===n)return c}catch(e){}return null}


/* ---------- Card Art theme: pull-tab menu and fit-to-window sizing ---------- */
function menuTab(){if(document.getElementById("pl-menutab"))return;const t=document.createElement("button");t.type="button";t.id="pl-menutab";t.setAttribute("aria-expanded","false");t.title="Show the site menu";t.innerHTML='<span aria-hidden="true">☰</span> Menu <span class="ar" aria-hidden="true">▾</span>';
  const set=open=>{const r=document.documentElement;r.classList.toggle("pl-menu",open);t.setAttribute("aria-expanded",String(open));const hd=document.querySelector("header.top");t.style.top=open&&hd?hd.offsetHeight+"px":"0";t.querySelector(".ar").textContent=open?"▴":"▾"};
  t.addEventListener("click",e=>{e.stopPropagation();set(!document.documentElement.classList.contains("pl-menu"))});
  document.addEventListener("click",e=>{if(document.documentElement.classList.contains("pl-menu")&&!e.target.closest('header.top,#pl-menutab,[data-pa="menu"]'))set(false)});
  addEventListener("hashchange",()=>set(false));
  document.body.appendChild(t)}
const FIT_MQ=matchMedia("(min-width:900px) and (min-height:560px)");
function fitPlay(root){const g=root&&root.querySelector(".pl-game");if(!g||typeof SKIN==="undefined"||SKIN!=="art")return;
  if(!FIT_MQ.matches){root.style.removeProperty("--hw");root.style.removeProperty("--hcw");document.documentElement.classList.remove("pl-menu");return}
  menuTab();const de=document.scrollingElement||document.documentElement;
  const board=g.querySelector(".pl-board");const hand=g.querySelector(".pl-hand");
  const set=w=>{root.style.setProperty("--hw",w+"px");root.style.setProperty("--hcw",Math.round(Math.max(84,Math.min(200,w*.66)))+"px")};
  const fits=()=>{const zs=board.querySelectorAll(".pl-zone");for(const z of zs)if(z.scrollWidth>z.clientWidth+1)return false;
    return board.scrollHeight<=board.clientHeight+1};
  /* the action bar keeps the tallest height it has needed this game, so the cards don't resize every time a banner comes and goes */
  const mid=board.querySelector(".pl-mid");if(mid){if(U.midKey!==U.gameKey){U.midKey=U.gameKey;U.midMax=0}mid.style.minHeight="";const mh=Math.min(Math.max(90,Math.round(innerHeight*.16)),Math.ceil(mid.getBoundingClientRect().height));if(mh>U.midMax){U.midMax=mh;U.fitW=0}mid.style.minHeight=U.midMax+"px"}
  /* largest Hero Card (width in px) that lets the whole board fit; min 110, max 300 */
  let lo=110,hi=300,best=lo;const prev=U.fitW||0;
  if(prev){set(prev);if(fits()){lo=prev;best=prev}else hi=prev-1}
  while(lo<=hi){const m=(lo+hi)>>1;set(m);if(fits()){best=m;lo=m+1}else hi=m-1}
  /* small changes (a longer prompt, a new tag) don't make the cards jump around */
  if(prev&&best>prev&&best-prev<6)best=prev;
  set(best);U.fitW=best;
  try{if(typeof fitArt==="function")fitArt(hand||root)}catch(e){}}
let fitT=null;addEventListener("resize",()=>{clearTimeout(fitT);fitT=setTimeout(()=>{U.fitW=0;const r=ROOT();if(r)fitPlay(r)},120)});
/* Trials loot (Rockbreaker Maul and friends) joins the engine's card database only for accounts with Trials access (admins always) */
const trialsAccess=()=>{try{return typeof trialsOn==="function"&&trialsOn()}catch(e){return false}};
function regLoot(){if(trialsAccess()&&typeof TRIALS_LOOT!=="undefined"&&E.addEquipRows)E.addEquipRows(TRIALS_LOOT,typeof TRIALS_LOOT_UPGRADES!=="undefined"?TRIALS_LOOT_UPGRADES:{})}
function render(){const root=ROOT();if(!root)return;injectCSS();regLoot();
  if(U.mode==="lobby"){MUS.sync(false);if(window.CQPop)CQPop.clear();root.innerHTML=lobbyHTML();try{window.CQTablet&&CQTablet.after()}catch(e){}try{dockSync()}catch(e){}return}
  if(U.mode==="room"){root.innerHTML=roomHTML();return}
  if(U.mode==="spec-wait"){root.innerHTML=`<section class="panel"><h2>Joining the game…</h2><p class="pl-note">Waiting for the player's browser to send the board.</p><div class="actions"><button class="btn" data-pa="spec-leave">Cancel</button></div></section>`;return}
  const s=view();if(!s){root.innerHTML=roomHTML();return}
  if(!U.gameKey)U.gameKey="g"+Date.now();mergeLog(s);try{trackBanner(s)}catch(e){console.warn(e)}
  const keepScroll=root.querySelector(".pl-log");const atBottom=!keepScroll||keepScroll.scrollTop+keepScroll.clientHeight>=keepScroll.scrollHeight-20;
  const handEl=root.querySelector(".pl-hand");const hs=handEl?handEl.scrollLeft:0;
  if(U.overFor!==U.gameKey){U.overFor=U.gameKey;U.overHide=false}
  if(s.phase!=="town"||!s.town||s.town.order[s.town.i]!==U.me)U.townHide=false;
  root.innerHTML=gameHTML(s)+overHTML(s)+townHTML(s)+tgtPopHTML();
  try{markPicks(root)}catch(e){console.warn(e)}
  try{waitPop(s)}catch(e){console.warn(e)}
  const lg=root.querySelector(".pl-log");if(lg&&atBottom)lg.scrollTop=lg.scrollHeight;
  const he=root.querySelector(".pl-hand");if(he){he.scrollLeft=hs;handOvf(he);he.addEventListener("scroll",()=>handOvf(he),{passive:true})}
  try{gameFx(s)}catch(e){console.warn(e)}
  try{MUS.sync(true)}catch(e){}
  try{if(window.CQPop)CQPop.redraw()}catch(e){}
  hcPopHide();
  try{if(typeof fitArt==="function")fitArt(root)}catch(e){}
  try{fitPlay(root)}catch(e){console.warn(e)}
  modals(s);
  try{const em=document.getElementById("pl-modal");if(em&&em.dataset.echo!=null&&!em.dataset.k)showEcho(+em.dataset.echo)}catch(e){}
  if(!U.spec){try{specHost();if(U.specTx)specSend()}catch(e){console.warn(e)}}
  try{if(window.CQTut&&U.tut)CQTut.after(s,root)}catch(e){console.warn(e)}
  preloadArt();try{window.CQTablet&&CQTablet.after()}catch(e){}try{dockSync()}catch(e){console.warn(e)}}
/* when a game starts, load and decode the art of every card in both decks, so nothing pops in while you play or drag */
const ART_DONE=new Set();
function preloadArt(){const s=U.s;if(!s||typeof BYID==="undefined"||typeof artSrc!=="function")return;const key=U.gameKey||"g";if(preloadArt.key===key)return;preloadArt.key=key;
  const ids=new Set();const walk=(v,d)=>{if(!v||d>4)return;if(Array.isArray(v)){v.forEach(x=>walk(x,d+1));return}if(typeof v==="object"){if(typeof v.id==="string")ids.add(v.id);for(const k in v)if(v[k]&&typeof v[k]==="object")walk(v[k],d+1)}};
  (s.p||[]).forEach(p=>walk(p,0));const srcs=[];
  ids.forEach(id=>{const c=BYID.get(id);if(!c)return;try{const a=artSrc(c);if(a&&!ART_DONE.has(a)){ART_DONE.add(a);srcs.push(a)}}catch(e){}});
  let i=0;const next=()=>{const batch=srcs.slice(i,i+6);i+=6;if(!batch.length)return;Promise.all(batch.map(src=>{const im=new Image();im.decoding="async";im.src=src;return(im.decode?im.decode():Promise.resolve()).catch(()=>{})})).then(()=>setTimeout(next,30))};next()}
/* Waiting pop-up (Nov 12, 2026): when the game is waiting for the opponent to respond (a Hidden-card window, a choice, a card resolved by hand),
   a small notice shows in the middle of the screen. It appears after a short delay so instant AI answers don't flash it. */
function waitPop(s){if(U.spec){const e0=document.getElementById("pl-waitpop");if(e0)e0.remove();return}let el=document.getElementById("pl-waitpop");const pr=s&&s.pend&&s.pend[0];
  const on=U.mode==="game"&&location.hash==="#play"&&s&&!s.over&&pr&&pr.pid!==U.me&&pr.pid!=null&&pr.pid>=0;
  if(!on){if(el)el.remove();return}
  const who=esc(s.p[pr.pid].name),what=pr.type==="window"?"They may respond with a Hidden card.":pr.type==="manual"?"They're resolving a card by hand.":"They're making a choice.";
  const key=pr.type+"|"+pr.pid+"|"+(s.logN||s.log.length);
  if(el&&el.dataset.k===key)return;if(!el){el=document.createElement("div");el.id="pl-waitpop";el.setAttribute("role","status");el.setAttribute("aria-live","polite");document.body.appendChild(el)}
  el.dataset.k=key;el.innerHTML=`<span class="wp-spin" aria-hidden="true"></span><div><b>Waiting for ${who} to respond…</b><span>${what}</span></div>`}
addEventListener("hashchange",()=>{if(location.hash!=="#play"){document.getElementById("pl-waitpop")?.remove()}});
/* Town window (Nov 12, 2026): Inn, Shop, Church and Blacksmith in one window in the middle of the screen, with Leave Town.
   Places you can't use right now stay listed with the reason. */
/* Nov 20: the Blacksmith shows what each upgrade does (now → upgraded) */
function upInfoHTML(o){const d=E.DB[o.id]||{};if(!o.id)return"";const up=!!d.up;
  /* Nov 22: a small one-color eye button; it opens the whole card (its upgraded side when it has one) in the zoom view */
  return`<button type="button" class="tw-eye" data-zoom="${esc(o.id)}"${up?' data-zup="1"':""} title="${up?"See the upgraded card":"See the card"}" aria-label="${up?"See the upgraded side of":"See"} ${esc(d.name||"this card")}"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg></button>`}
function townHTML(s){const me=U.me;if(!s||s.over||s.phase!=="town"||!s.town||s.town.order[s.town.i]!==me||s.pend.length)return"";
  if(U.townHide)return`<button type="button" class="pl-towntab" data-pa="town-show"><span class="mt-k">Town</span><b>${s.p[me].gold} Gold to spend</b><span class="mt-o">Open ▴</span></button>`; /* Nov 20: same tab as other choices */
  /* Nov 12, 2026: every option is listed; ones you can't use right now are greyed out with the reason */
  const opts=legal(),pl=s.p[me],g=pl.gold,used=s.town.used||{};
  const on=(o,label,cls)=>`<button class="btn${cls?" "+cls:""}" data-pa="do" data-a='${esc(JSON.stringify(o))}'>${label}</button>`;
  const off=(label,why)=>`<button class="btn tw-off" disabled title="${esc(why)}">${label}<small>${esc(why)}</small></button>`;
  const has=(type,k,v)=>opts.find(o=>o.type===type&&(k==null||o[k]===v));
  const hp=h=>` <span class="tw-hp">${E.hp(s,h)}/${E.maxHp(s,h)} HP</span>`;
  const place=(icon,name,desc,body)=>`<section class="tw-place"><div class="tw-h"><span class="tw-ic" aria-hidden="true">${icon}</span><div><b>${name}</b><span>${desc}</span></div></div><div class="tw-acts">${body}</div></section>`;
  const innBody=pl.heroes.filter(h=>!h.dead).map(h=>{const o=has("inn","hero",h.uid);const lab=`Heal ${esc(h.name)}${hp(h)}`;
    return o?on(o,lab):off(lab,used.inn?"Used this visit":g<E.INN_COST?`Needs ${E.INN_COST} Gold`:h.dmg<=0?"Full HP":"Not available")}).join("");
  const sh=has("shop");const shopBody=sh?on(sh,"Draw a card"):off("Draw a card",used.shop?"Used this visit":g<E.SHOP_COST?`Needs ${E.SHOP_COST} Gold`:"Not available");
  const dead=pl.heroes.filter(h=>h.dead);const churchBody=dead.length?dead.map(h=>{const o=has("church","hero",h.uid);const lab=`Resurrect ${esc(h.name)}`;
    return o?on(o,lab):off(lab,h.surr?"Its soul was surrendered":used.church?"Used this visit":g<E.CHURCH_COST?`Needs ${E.CHURCH_COST} Gold`:"Not available")}).join(""):off("Resurrect a Hero","No Hero has died");
  const ups=(E.upgradables?E.upgradables(s,me):[]);const upBody=ups.length?ups.map(o=>{const uc=E.upgradeCost(o)||{};const nm=esc(o.name||(E.DB[o.id]||{}).name||"");const tip=esc(((E.DB[o.id]||{}).up||{}).rules||"");
    if(uc.x){const xs=opts.filter(u=>u.type==="upgrade"&&u.uid===o.uid).map(u=>u.x);return xs.length?`<div class="tw-up"><span class="pl-up">Upgrade ${nm} for <select data-pa="up-x" data-u="${o.uid}">${xs.map(x=>`<option value="${x}">${x} Gold (+${x})</option>`).join("")}</select><button class="btn" data-pa="up-go" data-u="${o.uid}">Upgrade</button></span>${upInfoHTML(o)}</div>`:`<div class="tw-up">${off(`Upgrade ${nm}`,"Needs at least 1 Gold")}${upInfoHTML(o)}</div>`}
    const op=has("upgrade","uid",o.uid);const lab=`Upgrade ${nm}${uc.cost?` (${uc.cost} Gold)`:""}`;return`<div class="tw-up">${op?`<button class="btn" data-pa="do" data-a='${esc(JSON.stringify(op))}' title="${tip}">${lab}</button>`:off(lab,`Needs ${uc.cost} Gold`)}${upInfoHTML(o)}</div>`}).join(""):off("Upgrade","Nothing in play can be upgraded");
  return`<div class="pl-town" role="dialog" aria-modal="false" aria-label="Town"><div class="pl-town-box">
    <div class="tw-top"><h2>Town</h2><span class="tw-gold"><b>${g}</b> Gold</span><button class="btn sm" data-pa="town-hide" title="Hide the Town to look at the board and your hand. Reopen it from the tab at the bottom.">👁 View board</button></div>
    <p class="tw-note">Each place can be used once per visit. Gold you don't spend carries over. Greyed-out choices can't be used right now.</p>
    <div class="tw-grid">
    ${place("🛏","Inn",`Heal a Hero ${E.INN_HEAL} HP · ${E.INN_COST} Gold`,innBody)}
    ${place("🛒","Shop",`Draw a card · ${E.SHOP_COST} Gold`,shopBody)}
    ${place("⛪","Church",`Resurrect a dead Hero with ${E.CHURCH_HP} HP · ${E.CHURCH_COST} Gold`,churchBody)}
    ${place("⚒","Blacksmith","Upgrade items and equipment in play that have an Upgrade cost",upBody)}
    </div>
    <div class="tw-foot">${on({type:"leave"},"Leave Town","go")}</div></div></div>`}
{const st=document.createElement("style");st.textContent=`
.pl-town{position:fixed;inset:0;z-index:62;display:grid;place-items:center;padding:16px;background:rgba(6,4,2,.45);pointer-events:auto}
.pl-town-box{width:min(760px,100%);max-height:calc(100vh - 40px);overflow:auto;background:linear-gradient(#2b1f15,#1b130c);color:#f3e6cf;border:2px solid #b8743a;border-radius:16px;padding:16px 20px 18px;box-shadow:0 24px 60px rgba(0,0,0,.7);animation:twIn .2s ease-out both}
.tw-top{display:flex;align-items:center;gap:12px}.tw-top h2{margin:0;font:400 2rem/1 "Pirata One",var(--display);color:#ffc100}.tw-top .btn{margin-left:auto}
.tw-gold{display:inline-flex;align-items:baseline;gap:5px;padding:4px 12px;border-radius:999px;background:#2a1d05;border:2px solid #d4a017;color:#ffd98a}.tw-gold b{font:400 1.4rem/1 "Pirata One",var(--display);color:#ffc100}
.tw-note{margin:8px 0 12px;color:#d8c3a0;font-size:.9rem}
.tw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.tw-place{border:1.5px solid #8A5E40;border-radius:12px;padding:10px 12px;background:rgba(0,0,0,.22);display:flex;flex-direction:column;gap:8px}
.tw-h{display:flex;gap:10px;align-items:flex-start}.tw-ic{font-size:1.5rem;line-height:1}.tw-h b{display:block;font:400 1.3rem/1.1 "Pirata One",var(--display);color:#ffd98a}.tw-h span{font-size:.85rem;color:#d8c3a0}
.tw-acts{display:flex;flex-wrap:wrap;gap:6px}
.tw-up{display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;gap:6px;width:100%;padding:6px 0;border-bottom:1px dashed var(--line)}.tw-up:last-child{border-bottom:0}.tw-up .btn{align-self:center}
.tw-eye{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border-radius:50%;border:1px solid currentColor;background:transparent;color:#ffd98a;cursor:pointer;opacity:.85;flex:none}.tw-eye:hover,.tw-eye:focus-visible{opacity:1;background:rgba(255,217,138,.12)}
.tw-upi{font-size:.8rem;line-height:1.35;display:grid;gap:3px}.tw-upi p{margin:0;display:inline}.tw-upk{display:inline-block;min-width:68px;font-weight:800;font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;opacity:.75;margin-right:6px}.tw-upn{color:#ffe08a}.tw-acts .btn{font-size:.9rem}.tw-hp{opacity:.75;font-size:.8em}
.tw-no{font-size:.85rem;color:#a8906f;font-style:italic}
.tw-acts .btn.tw-off{opacity:.45;filter:grayscale(.7);cursor:not-allowed;display:inline-flex;flex-direction:column;align-items:flex-start;gap:2px}.tw-acts .btn.tw-off small{font-size:.72rem;font-weight:400;opacity:.9}
#play-root .pl-man{position:fixed;right:16px;top:64px;z-index:112;width:min(560px,calc(100vw - 32px));max-height:calc(100vh - 84px);overflow:auto;background:linear-gradient(#2b1f15,#1b130c);color:#f3e6cf;border:2px solid #ffc100;box-shadow:0 20px 50px rgba(0,0,0,.7)}
.tw-foot{display:flex;justify-content:flex-end;margin-top:14px}.tw-foot .btn{min-width:150px;font-size:1rem}
@keyframes twIn{from{opacity:0;transform:translateY(10px) scale(.98)}}
#pl-waitpop{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);z-index:64;display:flex;gap:12px;align-items:center;padding:14px 18px;border-radius:14px;background:rgba(27,19,12,.96);color:#f3e6cf;border:2px solid #ffc100;box-shadow:0 18px 44px rgba(0,0,0,.7);pointer-events:none;opacity:0;animation:wpIn .25s ease-out .6s forwards}
#pl-waitpop b{display:block;font-size:1.02rem}#pl-waitpop span{font-size:.85rem;color:#d8c3a0}
.wp-spin{width:22px;height:22px;border-radius:50%;border:3px solid rgba(255,193,0,.25);border-top-color:#ffc100;animation:wpSpin .9s linear infinite;flex:none}
@keyframes wpIn{to{opacity:1}}@keyframes wpSpin{to{transform:rotate(360deg)}}
@media (max-width:640px){.tw-grid{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.pl-town-box,.wp-spin{animation:none}#pl-waitpop{animation:none;opacity:1}}`;document.head.appendChild(st)}
function lobbyHTML(){const tOn=trialsAccess();if(!tOn&&U.lobby.tab==="trials")U.lobby.tab="ai";
  const tabs=tOn?`<nav class="subtabs pl-ltabs" aria-label="Play modes"><a href="#play" data-pa="ltab" data-t="ai"${U.lobby.tab!=="trials"?' aria-current="page"':""}>Play</a><a href="#play" data-pa="ltab" data-t="trials"${U.lobby.tab==="trials"?' aria-current="page"':""}>Trials</a></nav>`:"";
  if(tOn&&U.lobby.tab==="trials")return`<h1>Play Riverstead</h1>${tabs}<p class="lede">Trials: team up with AI helper parties against a boss that runs itself from its own deck. Each party has 2 Heroes. See the Trials rules for how bosses, spawns and loot work.</p>${trialsLobbyHTML()}`;
  return lobbyHTML1(tabs)}
function lobbyHTML1(tabs){const ch=deckChoices();const resL=store2.get("cq.play.local",null),resH=store2.get("cq.play.host",null),resG=store2.get("cq.play.guest",null);
  if(!U.lobby.deck||!ch.some(d=>d.id===U.lobby.deck&&d.ok))U.lobby.deck=(ch.find(d=>d.ok)||{}).id||"";
  if(U.lobby.ai===U.lobby.deck&&!U.lobby.aiPicked)U.lobby.ai=U.lobby.deck==="starter:1"?"starter:0":"starter:1";
  const opts=(sel,onlyOk)=>ch.map(d=>`<option value="${esc(d.id)}" ${d.id===sel?"selected":""} ${!d.ok?"disabled":""}>${esc(d.name)}</option>`).join("");
  const online=!!sb();
  return`<h1>Play Riverstead</h1>${tabs||""}<p class="lede">Play a full game with the rules enforced: phases, priority by position, Aura, attacks, Hidden cards, Town and Gold. Cards marked <b>AUTO</b> resolve themselves; the few marked <b>BY HAND</b> open a panel where you apply the effect.</p>
  ${resL&&resL.s&&!resL.s.over?`<div class="panel"><b>Game in progress vs AI</b> · Round ${resL.s.round}<div class="actions"><button class="btn primary" data-pa="resume-local">Resume</button><button class="btn" data-pa="drop-local">Discard it</button></div></div>`:""}
  ${resH&&resH.s&&!resH.s.over?`<div class="panel"><b>Online room ${esc(resH.code)}</b> (you're the host) · Round ${resH.s.round}<div class="actions"><button class="btn primary" data-pa="resume-host">Reopen room</button><button class="btn" data-pa="drop-host">Close it</button></div></div>`:""}
  ${resG&&resG.code?`<div class="panel"><b>Online room ${esc(resG.code)}</b> (joined)<div class="actions"><button class="btn primary" data-pa="resume-guest">Rejoin</button><button class="btn" data-pa="drop-guest">Forget it</button></div></div>`:""}
  <div class="pl-lobby">
    <section class="panel"><h2>Your deck</h2>
      <label>Deck<select data-pa="deck">${opts(U.lobby.deck)}</select></label>
      ${isAdm()?`<label>Match<select data-pa="bo"><option value="1"${boPick()===1?" selected":""}>Best of 1</option><option value="3"${boPick()===3?" selected":""}>Best of 3 with sideboards (admins)</option></select></label>${boPick()===3?(()=>{const d=deckById(U.lobby.deck);const n=d&&d.side?((d.side.heroes||[]).filter(Boolean).length+Object.values(d.side.cards||{}).reduce((a,q)=>a+q,0)):0;return`<p class="pl-note">Sideboard: ${n} card${n===1?"":"s"}${n?"":" (add one in the Deck Builder)"}. First to win 2 games wins the match; you can sideboard between games.</p>`})():""}`:""}
      <p class="pl-note">Your saved decks from My Decks appear here${AS()&&S.mode==="account"?" (from your account)":""}. Starter decks are ready to go.</p>
      ${!(AS()&&S.me)?`<label>Your name<input type="text" data-pa="name" maxlength="24" value="${esc(store2.get("cq.play.name",""))}" placeholder="Shown to your opponent"></label>`:""}
    </section>
    <section class="panel"><h2>Play vs AI</h2>
      <label>AI deck<select data-pa="ai">${opts(U.lobby.ai)}</select></label>
      <div class="actions"><button class="btn primary go" data-pa="start-ai">Start game vs AI</button></div>
      <p class="pl-note">The AI thinks one move ahead and uses AUTO cards. It runs in your browser; nothing is sent anywhere.</p>
    </section>
    <section class="panel"><h2>Play online</h2>
      ${online?`<div class="actions"><button class="btn primary" data-pa="host">Create a room</button></div>
      <label>Join with a code<input type="text" data-pa="code" maxlength="5" value="${esc(U.lobby.code)}" placeholder="ABCDE" style="text-transform:uppercase;letter-spacing:.15em"></label>
      <div class="actions"><button class="btn" data-pa="join">Join room</button></div>
      <p class="pl-note">The host's browser runs the rules and keeps the game. Each player only receives what they're allowed to see. Keep this tab open while you play.</p>`
      :`<p class="pl-note">Online rooms need the site's account service, which isn't reachable right now.</p>`}
    </section>
    ${online?onlineListHTML()+specGamesHTML():""}
  </div>`}
function roomHTML(){const n=U.net;if(!n)return"";
  return`<h1>${n.role==="host"?"Your room":"Joining room"}</h1>
  <div class="panel" style="max-width:520px">${n.role==="host"?`<p>Share this code with your opponent:</p><div class="pl-code">${esc(n.code)}</div><p class="pl-note">They go to playriverstead.com → Play → Join with a code. The game starts as soon as they join.</p>`
    :`<div class="pl-code">${esc(n.code)}</div><p>${U.busy?"Waiting for the host…":"Connecting to the host…"} If nothing happens, check the code and make sure the host has the room open.</p>`}
  <p class="pl-note">${n.role==="host"?(n.bo===3?"<b>Best of 3</b> match with sideboards. ":"<b>Best of 1</b>. "):""}${n.peers?"Opponent connected.":"Waiting for opponent…"}</p>
  <div class="actions"><button class="btn" data-pa="leave">Cancel</button></div></div>`}
function gameHTML(s){const me=U.me,op=E.opp(me);const opts=legal();
  if(U.logHidden==null){try{U.logHidden=localStorage.getItem("cq.play.log")==="hide"}catch(e){U.logHidden=false}}
  if(s.trials)return trialsGameHTML(s,opts);
  return`<div class="pl-game${U.logHidden?" nolog":""}"><button class="btn sm pl-logshow" data-pa="log-toggle" title="Show the game log">Show log</button><div class="pl-board">
    ${zoneHTML(s,op,opts)}
    ${U.spec?(U.spec.replay?replayMidHTML(s):specMidHTML(s)):midHTML(s,opts)}
    ${zoneHTML(s,me,opts)}
    ${U.spec&&!U.spec.replay?"":handHTML(s,opts)}
  </div><aside class="pl-side">
    <div class="pl-side-h"><button type="button" class="pl-logtab" data-pa="log-toggle" aria-expanded="${!U.logHidden}" title="${U.logHidden?"Show":"Hide"} the game log"><h2>Game log</h2><span aria-hidden="true">${U.logHidden?"▴":"▾"}</span></button><span class="actions">${ctlBtns()}${sndBtnsHTML()}<button class="btn sm" data-pa="export-log" title="Download the full game log as a text file">Export log</button><button class="btn sm" data-pa="rules">Rules</button>${s.over||U.spec?"":`<button class="btn sm danger pl-concede" data-pa="concede-ask" title="Concede this game">Concede</button>`}${U.spec?`<button class="btn sm danger" data-pa="spec-leave">Stop watching</button>`:`<button class="btn sm danger" data-pa="leave-ask">${s.over?"Exit":"Leave"}</button>`}</span></div>
    <div class="pl-log" aria-live="polite">${logHTML(s)}</div>
    <div class="pl-legend"><span>Green ring = Hero acting now</span><span>Red ring = can be targeted</span><span>Tilted = exhausted</span></div>
  </aside></div>`}
/* card names in log lines become hover targets (app.js shows the zoomed card) */
let LOGRE=null,LOGMAP=null;const LOGC=new Map();
function logRe(){if(LOGRE!==null)return LOGRE;LOGMAP=new Map();try{BYID.forEach((c,k)=>{if(c&&c.name&&k===c.id&&c.face!=="up"&&c.name.length>2&&!LOGMAP.has(c.name))LOGMAP.set(c.name,c.id)})}catch(e){}
  const names=[...LOGMAP.keys()].sort((a,b)=>b.length-a.length).map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
  LOGRE=names.length?new RegExp(`(?<![\\w'’])(?:${names.join("|")})(?![\\w’])`,"g"):false;return LOGRE}
function logLine(m){if(LOGC.has(m))return LOGC.get(m);const R=logRe();let out;
  if(!R)out=esc(m);else{out="";let i=0;m.replace(R,(x,off)=>{out+=esc(m.slice(i,off))+`<span class="lgc" data-hc="${esc(LOGMAP.get(x))}">${esc(x)}</span>`;i=off+x.length;return x});out+=esc(m.slice(i))}
  if(LOGC.size>2000)LOGC.clear();LOGC.set(m,out);return out}
function logHTML(s){return s.log.slice(-300).map(l=>{const sys=/^—/.test(l.m)||/🏆/.test(l.m);return`<p class="${sys?"sys":l.p===U.me?"me":l.p<0?"":"op"}">${logLine(l.m)}</p>`}).join("")}
/* arrival animation: summons, Pillars and inventory items that just showed up pop in (first render of a game marks everything as already there).
   Re-renders during the animation keep it going with a negative animation-delay. */
const ARR_MS=700;
function arrSync(s){const now=Date.now();const ids=[];s.p.forEach(pl=>{pl.bf.forEach(o=>ids.push(o.uid));pl.inv.forEach(o=>o&&ids.push(o.uid))});
  if(!U.arr||U.arr.key!==U.gameKey){U.arr={key:U.gameKey,t:new Map(ids.map(u=>[u,0]))};return}
  ids.forEach(u=>{if(!U.arr.t.has(u))U.arr.t.set(u,now)})}
function arrA(uid){const t=U.arr&&U.arr.t.get(uid);const el=t?Date.now()-t:ARR_MS;return el<ARR_MS?{c:" arrive",st:`animation-delay:-${el}ms;`}:{c:"",st:""}}
function zoneHTML(s,pid,opts){const pl=s.p[pid];const mine=pid===U.me;arrSync(s);
  const actor=s.phase==="battle"&&s.prio===pid&&!s.pend.length?E.actorFor(s,pid):null;
  const cands=U.tgt?new Set(U.tgt.slots[U.tgt.i].cands):new Set();
  const slots=E.slots(s,pid);
  const heroes=pl.heroes.map((h,i)=>heroHTML(s,h,i,actor,cands,mine?opts:[])).join("");
  const bf=pl.bf.map(o=>o.kind==="summon"?summonHTML(s,o,cands):(a=>`<span class="pp${cands.has(o.uid)?" cand":""}${a.c}"${a.st?` style="${a.st}"`:""} data-pa="obj" data-u="${o.uid}">${esc(o.name)}</span>`)(arrA(o.uid))).join("")||'<span class="pl-note">No summons or Pillars</span>';
  const inv=[];for(let i=0;i<slots;i++){const o=pl.inv[i];if(!o){inv.push('<span class="pi">Empty slot</span>');continue}
    const c=o.kind==="equip"?(o.cls||"Generic"):o.kind==="doll"?"Generic":((E.DB[o.id]||{}).cls||"Generic");
    const ar=arrA(o.uid);
    if(o.fd)inv.push(`<button class="pi full fd${U.man&&U.manT===o.uid?" mansel":""}${ar.c}"${ar.st?` style="${ar.st}"`:""} data-pa="obj" data-u="${o.uid}">${mine&&o.id?esc(E.DB[o.id].name)+" (set)":"Face-down card"}</button>`);
    else inv.push(`<button class="pi full${cands.has(o.uid)?" cand":""}${U.man&&U.manT===o.uid?" mansel":""}${ar.c}" style="${ar.st}--cc:${cc(c)};--ci:${ci(c)}" data-pa="obj" data-u="${o.uid}"><b>${esc(o.name)}</b>${o.kind==="doll"?` <span>${E.hp(s,o)}/5 HP</span>`:""}${o.ctr&&o.ctr.camp!=null?` <span>${o.ctr.camp} counters</span>`:""}${o.ctr&&o.ctr.petal?` <span>${o.ctr.petal} Petal</span>`:""}${o.under&&o.under.length?` <span>${o.under.length} under it</span>`:""}${o.x&&o.x.name&&o.name==="Null Stone"?` <span>Names ${esc(o.x.name)}</span>`:""}${o.ctr&&o.ctr.trophy?` <span>${o.ctr.trophy} Trophy</span>`:""}${s.upg&&s.upg[o.uid]!=null?` <span title="Upgraded at the Blacksmith">Upgraded${E.upgradeCost(o)&&E.upgradeCost(o).x?` +${s.upg[o.uid]}`:""}</span>`:""}${o.exh?` <span title="Exhausted: it readies at Dawn">Exhausted</span>`:""}${invCounts(s,o,pid)}</button>`)}
  /* Card Art: the acting Hero's buttons sit at the bottom of the right-hand column */
  let zacts="";if(mine&&actor&&heroArt(E.DB[actor.id])&&s.phase==="battle"&&s.prio===U.me&&!s.pend.length&&!s.over&&!U.tgt&&(opts||[]).length){const hb=heroActs(s,opts,actor);
    if(hb.length)zacts=`<div class="pl-acts zs-acts" aria-label="${esc(actor.name)}'s actions"><span class="zs-who">${esc(actor.name)}</span>${hb.join("")}</div>`}
  const isInit=s.init===pid;
  const turnTag=s.phase==="battle"&&s.prio===pid&&!s.pend.length?'<span class="res init">Acting</span>':"";
  const pc=[0,1].map(p=>`P${p}`).filter(u=>cands.has(u)&&u==="P"+pid).length;
  return`<section class="pl-zone${mine?"":" op"}" aria-label="${esc(pl.name)}'s side">
    <div class="pl-heroes">${heroes}</div>
    <div class="pl-zside"><div class="pl-zsin"><div class="pl-bar"><span class="nm">${esc(pl.name)}${mine&&!U.spec?" (you)":""}</span>${isInit?'<span class="res init" title="Has initiative">Initiative</span>':""}${turnTag}
      ${auraBarHTML(s,pl)}<span class="res gold" title="Gold: earned at Dusk, spent in Town"><i class="coin" aria-hidden="true"></i> <b>${pl.gold}</b> Gold</span>
      ${mine?"":turnCounts(s,pid).join("")}${s.passed[pid]&&s.phase==="battle"?'<span class="res">Passed</span>':""}
      ${pc?`<button class="btn sm" data-pa="pick" data-u="P${pid}" style="outline:3px solid var(--warn)">Target ${esc(pl.name)}'s party</button>`:""}
      <span class="pl-piles">${(pl.stall||[]).length?`<span class="res" title="Set aside with stall counters: ${esc(pl.stall.map(c=>E.stName(c)+(c.n>0?` (${c.n} stall counter${c.n>1?"s":""})`:" (ready to play free)")).join(", "))}">Stalled <b>${pl.stall.length}</b></span>`:""}<button class="res echo-z${pl.echo.length?" on":""}" data-pa="echo" data-p="${pid}" title="${pl.echo.length?"Echo cards replay at the next Dawn. Click to see the order.":"No Echo cards"}">Echo <b>${pl.echo.length}</b></button><span class="res">Hand <b>${pl.hand.length}</b></span><span class="res">Library <b>${pl.lib.length}</b></span>
      <button class="res" data-pa="disc" data-p="${pid}">Discard <b>${pl.disc.length}</b></button>${pl.exile.length?`<button class="res" data-pa="exile" data-p="${pid}">Exile <b>${pl.exile.length}</b></button>`:""}</span></div>
    <div class="pl-row"><span class="lbl">Battlefield</span>${bf}</div>
    <div class="pl-row"><span class="lbl">Inventory ${pl.inv.length}/${slots}</span>${inv.join("")}</div>${zacts}</div></div>
  </section>`}
/* ---------- running counts (display only) ---------- */
function deckNames(pl){const n=new Set();const add=c=>{const d=c&&E.DB[c.id];if(d)n.add(d.name)};
  ["hand","lib","disc","exile"].forEach(z=>(pl[z]||[]).forEach(add));(pl.inv||[]).forEach(o=>{if(o.id)add(o);else if(o.name)n.add(o.name)});
  pl.heroes.forEach(h=>{n.add(h.name);E.eqList(h).forEach(e=>n.add(e.name))});return n}
function deckSub(pl,sub){const has=c=>{const d=c&&E.DB[c.id];return d&&(d.sub===sub||d.type===sub)};return["hand","lib","disc"].some(z=>(pl[z]||[]).some(has))||(pl.inv||[]).some(o=>o.id&&has(o))}
function turnCounts(s,pid){const pl=s.p[pid];const t=pl.t||{};const mine=pid===U.me;const names=deckNames(pl);const out=[];
  const show=(rel,v)=>v>0||(mine&&rel);
  const monk=pl.heroes.some(h=>h.cls==="Monk");
  if(pl.fl&&pl.fl.multi)out.push(`<span class="res" title="Multi Bow: added to the next Arrow you activate">Next Arrow <b>+${pl.fl.multi}</b></span>`);
  if(show(monk||deckSub(pl,"Combo"),t.combos||0))out.push(`<span class="res" title="Cards with the Combo subtype played this turn">Combo cards <b>${t.combos||0}</b></span>`);
  if(show(deckSub(pl,"Song"),t.songs||0))out.push(`<span class="res" title="Songs played this turn">Songs <b>${t.songs||0}</b></span>`);
  if(show(deckSub(pl,"Arrow"),t.arrows||0))out.push(`<span class="res" title="Arrows activated this turn">Arrows <b>${t.arrows||0}</b></span>`);
  if((names.has("Opening Act")||names.has('"Opening Act"'))&&(mine||t.cards))out.push(`<span class="res" title="Cards played this turn">Cards played <b>${t.cards||0}</b></span>`);
  if(show(names.has("Timely Heals"),t.took||0))out.push(`<span class="res" title="Damage your party has taken this turn">Party damage <b>${t.took||0}</b>${names.has("Timely Heals")?"/10":""}</span>`);
  if(pl.fl&&pl.fl.petalDisc)out.push('<span class="res" title="Petal Shrine">Next Combo card <b>−1</b></span>');
  return out}
function heroCounts(s,h){if(h.dead)return[];const out=[];const r=s.round;const pl=s.p[h.owner];
  const combos=h.fl&&h.fl.combosRound===r?h.fl.combos||0:0;
  if(h.name==="Grandmaster Reece"){if(h.lvl>=3){const m=combos%3;out.push(`<span class="tg cnt" title="Every third Combo card he plays this turn: +2 STR">Combo ${m}/3${combos>=3?` · ${combos} total`:""}</span>`)}else out.push(`<span class="tg cnt" title="His third Combo card this turn: +2 STR">Combo ${Math.min(combos,3)}/3${combos>=3?" ✓":""}</span>`)}
  if(h.fl&&h.fl.stepped===r)out.push('<span class="tg cnt" title="Abiding: acts after the Closer this round">Abiding</span>');
  if(h.fat)out.push('<span class="tg cnt must" title="Fatigue counter: this Hero doesn\'t ready at the next Dawn">Fatigued</span>');
  {const fz=E.forcedTarget&&E.forcedTarget(s,h);if(fz)out.push(`<span class="tg cnt must" title="Arrow of Persuasion: its next action must be an attack on ${esc(nameOf(fz))}">Must attack ${esc(nameOf(fz))}</span>`)}
  if(E.hasBanding(s,h))out.push('<span class="tg cnt band" title="Can join a Band attack: add its STR, then it is exhausted">Banding</span>');
  if(E.usesDef(s,h))out.push('<span class="tg cnt" title="Deals damage equal to its DEF instead of its STR this turn">DEF damage</span>');
  if(h.name==="Sage Monk")out.push(`<span class="tg cnt" title="Scry 1 on its first Combo card each turn">First Combo: ${h.fl&&h.fl.sageRound===r?"used":"ready"}</span>`);
  const atks=h.atkRound===r?h.attacks||0:0;
  if(h.name==="Skullcrusher")out.push(`<span class="tg cnt" title="+3 STR on its second attack each turn">Attacks ${atks}${atks>=2?" ✓":"/2"}</span>`);
  else if(h.fl&&h.fl.twiceRound===r)out.push(`<span class="tg cnt" title="May attack twice this turn">Attacks ${atks}/2</span>`);
  if(h.name==="Wild Archer"&&h.lvl<3)out.push(`<span class="tg cnt" title="Readies after your first Arrow each turn">First Arrow: ${(pl.t&&pl.t.arrows)?"used":"ready"}</span>`);
  if(h.fl&&h.fl.chargedRound===r)out.push(`<span class="tg cnt" title="Charged Barrage strikes at Dusk if no damage is dealt to this Hero">Charged: ${h.fl.chargedHit===r?"hit, fizzles":"ready"}</span>`);
  if(h.fl&&h.fl.runBackRound===r)out.push(`<span class="tg cnt">Run It Back: ${h.fl.runBackUsed?"used":"ready"}</span>`);
  E.eqList(h).forEach(e=>{if(e.name==="Antler Crown")out.push(`<span class="tg cnt" title="First Summon card each turn costs 1 less">Antler Crown: ${h.fl&&h.fl.antler===r?"used":"ready"}</span>`);
    if(e.name==="Celestial Harp")out.push(`<span class="tg cnt" title="Second Song each turn heals your party 1">Songs ${Math.min((pl.t&&pl.t.songs)||0,2)}/2</span>`)});
  return out}
function cardCounts(s,c){const d=E.DB[c.id];if(!d)return[];const pl=s.p[U.me];const t=pl.t||{};const out=[];const a=E.actorFor(s,U.me);
  const op=s.p[1-U.me];const liv=p=>p.heroes.filter(h=>!h.dead);
  try{const cost=E.cardCost(s,U.me,a,d,0);const base=d.cost==="X"?0:(+d.cost||0);if(d.cost!=="X"&&cost!==base)out.push(`<span class="cost" title="Current Aura cost">Costs ${cost}</span>`)}catch(e){}
  const n=d.name.replace(/"/g,"");const cb=t.combos||0;
  if(n==="Well Trained")out.push(`<span title="Combo cards played this turn">Combo ${Math.min(cb,3)}/3${cb>=3?" ✓":""}</span>`);
  if(n==="Finisher")out.push(`<span>X = ${cb}</span>`);
  if(n==="Rising Dragon")out.push(`<span title="2 + Combo cards played before it">Deals ${2+cb}</span>`);
  if(n==="Ballad of Blades")out.push(`<span>${(t.songs||0)>0?"Deals 3":"Deals 2"}</span>`);
  if(n==="Opening Act")out.push(`<span>${(t.cards||0)>0?"Not first card":"First card: +1 Aura"}</span>`);
  if(n==="Timely Heals")out.push(`<span>Party damage ${t.took||0}/10</span>`);
  if(n==="Death by a Thousand Cuts"){let x=0;liv(op).forEach(h=>x+=h.st.poison||0);op.bf.forEach(o=>{if(o.st)x+=o.st.poison||0});liv(pl).filter(h=>h.cls==="Rogue").forEach(h=>x+=E.eqList(h).filter(e=>E.isDagger(s,e)).length);out.push(`<span>X = ${x}</span>`)}
  if(n==="Withdrawal Ailments"){let x=0;liv(pl).forEach(h=>E.STATUS.forEach(k=>x+=h.st[k]||0));out.push(`<span>X = ${x}</span>`)}
  if(n==="Pummel"&&a){const b=liv(pl).filter(h=>h.cls==="Barbarian").length;out.push(`<span title="${esc(a.name)}'s STR × Barbarians">${E.str(s,a)} × ${b}</span>`)}
  return out}
function invCounts(s,o,pid){const out=[];if(o.fd||!o.name)return out;const pl=s.p[pid];const t=pl.t||{};
  if(o.name==="Petal Shrine"&&pl.fl&&pl.fl.petalDisc)out.push("next Combo −1");
  if(o.name==="Level Shot")out.push(`Arrow #${(t.arrows||0)+1} this turn${(t.arrows||0)===2?" ✓ levels":""}`);
  if(o.name==="Trophy Rack"&&o.ctr&&o.ctr.trophy)out.push(`${o.ctr.trophy} Trophy`);
  return out.map(x=>` <span>${esc(x)}</span>`).join("")}
function statB(v,base){return`<b class="${v>base?"up":v<base?"dn":""}">${v}</b>`}
function heroHTML(s,h,i,actor,cands,opts){const st=E.heroStats(s,h);const d=E.DB[h.id];const tags=[];
  if(h.dead)tags.push(`<span class="tg bad">${h.surr?"Surrendered":"Dead"}</span>`);
  if(h.ex&&!h.dead)tags.push('<span class="tg">Exhausted</span>');
  {const w=Object.values(h.eq||{}).find(e=>e&&e.name==="Warded Cloak");if(w&&!h.dead)tags.push(`<span class="tg good" title="Warded Cloak: damage to a Hero in your party is prevented and a protection counter is removed instead">Warded ${w.prot||0}</span>`)}
  if(h.med)tags.push(`<span class="tg good">Meditating${h.keepMed?"":" (wakes)"}</span>`);
  if(h.plus)tags.push(`<span class="tg good">${h.plus} meditation</span>`);
  if(h.guard+h.eqGuard)tags.push(`<span class="tg good">Guard ${h.guard+h.eqGuard}</span>`);
  E.STATUS.forEach(k=>{if(h.st[k])tags.push(`<span class="tg bad">${E.STATUS_NAME[k]}${h.st[k]>1?" ×"+h.st[k]:""}</span>`)});
  if(E.stealth(s,h))tags.push('<span class="tg good">Stealth</span>');
  if(E.noAttack(s,h))tags.push('<span class="tg good">Can\'t be attacked</span>');
  if(E.enraged(s,h)&&!h.dead&&h.cls==="Barbarian")tags.push('<span class="tg">Enraged</span>');
  if(E.lifelink(s,h))tags.push('<span class="tg good">Lifelink</span>');
  const pz=E.poisonous(s,h);if(pz)tags.push(`<span class="tg">Poisonous ${pz}</span>`);
  heroCounts(s,h).forEach(x=>tags.push(x));
  (h.mods||[]).forEach(m=>{if(m.str)tags.push(`<span class="tg ${m.str>0?"good":"bad"}">${m.str>0?"+":""}${m.str} STR</span>`);if(m.def)tags.push(`<span class="tg ${m.def>0?"good":"bad"}">${m.def>0?"+":""}${m.def} DEF</span>`);if(m.zeroDef)tags.push('<span class="tg bad">DEF 0</span>');if(m.zeroStr)tags.push('<span class="tg bad">STR 0</span>');if(m.mulStr)tags.push('<span class="tg good">STR ×2</span>')});
  const gear=E.eqList(h).map(e=>`<button class="tg eq${U.man&&U.manT===e.uid?" mansel":""}${cands.has(e.uid)?" cand":""}" style="--cc:${cc(e.cls||"Generic")};--ci:${ci(e.cls||"Generic")}" data-pa="obj" data-u="${e.uid}">⚔ ${esc(e.name)}${E.isUp(s,e)?" ★":""}</button>`).concat(h.ench.map(e=>`<button class="tg eq${cands.has(e.uid)?" cand":""}" style="--cc:${cc((E.DB[e.id]||{}).cls||"Warlock")}" data-pa="obj" data-u="${e.uid}">✦ ${esc(e.name)}</button>`)).join("");
  const low=st.hp*3<=st.max;
  const isActor=actor&&actor.uid===h.uid;
  const pct=Math.max(0,Math.min(100,h.dead?0:st.hp/st.max*100));
  const hpBar=`<span class="hpbar${low?" low":""}" style="--p:${pct}%"><i style="width:${pct}%"></i><span>${h.dead?"0":st.hp} / ${st.max} HP</span></span>`;
  const soul=h.dead&&!h.surr&&(opts||[]).some(o=>o.type==="soul"&&o.hero===h.uid)?`<button type="button" class="btn soul-btn" data-pa="soul" data-h="${h.uid}" title="Sacrifice this dead Hero for one small effect. It can never be revived.">Surrender soul…</button>`:"";
  const cls=`ph${h.ex&&!h.dead?" ex":""}${h.dead?" dead":""}${h.surr?" surr":""}${isActor?" actor":""}${cands.has(h.uid)?" cand":""}${U.man&&U.manT===h.uid?" mansel":""}`;
  const hb=isActor&&s.phase==="battle"&&s.prio===U.me&&h.owner===U.me&&!s.pend.length&&!s.over&&!U.tgt&&(opts||[]).length?heroActs(s,opts,h):[];
  const hacts=hb.length?`<div class="pl-acts ph-acts" aria-label="${esc(h.name)}'s actions">${hb.join("")}</div>`:"";
  const top=`<span class="ph-top"><span>${h.hc?"Last · Hero Construct":(s.trials?["Lead","Closer"]:E.POS)[i]||""}${isActor?' <span class="mark">· acting</span>':""}</span><span>Lv ${h.lvl}</span></span>`;
  const extra=`${tags.length?`<span class="tags">${tags.join("")}</span>`:""}${gear?`<span class="tags">${gear}</span>`:""}`;
  if(heroArt(d))return`<div role="button" tabindex="0" class="${cls} hasart hk" style="--cc:${cc(h.cls)};--ci:${ci(h.cls)}" data-pa="obj" data-u="${h.uid}" aria-label="${esc(d.name)}, ${esc(h.cls)} Hero${h.dead?", dead":""}">
    ${top}${heroCardHTML(s,h,d,st,extra,soul,"",h.dead?soulBackHTML(h,h.owner===U.me?(opts||[]).filter(o=>o.type==="soul"&&o.hero===h.uid):[],h.owner!==U.me):"" /* Nov 19: opponents' dead heroes show the starfield back too (buttons stay unlit) */)}
  </div>`;
  return`<div role="button" tabindex="0" class="${cls}" style="--cc:${cc(h.cls)};--ci:${ci(h.cls)}" data-pa="obj" data-u="${h.uid}">
    ${top}
    <span class="ph-name">${esc(h.name)}</span><span class="ph-cls"><span class="dot"></span>${esc(h.cls)}</span>
    <span class="ph-stats"><span class="s-str">${statB(st.str,d.str)}STR</span><span class="s-def">${statB(st.def,d.def)}DEF</span><span class="s-aura">${statB(st.aura,d.aura)}AURA</span></span>
    ${extra}${hpBar}${soul}${hacts}
  </div>`}
/* ---------- Hero card images (Card Art export) with live stats ---------- */
function heroArt(d){try{return!!(d&&typeof SKIN!=="undefined"&&SKIN==="art"&&typeof CARD_ART!=="undefined"&&hasArt({kind:"hero",name:d.name,cls:d.cls}))}catch(e){return false}}
const STAT_NAME={str:"Strength",def:"Defense",aura:"Aura",hp:"Health Points"};
/* Compact Hero Card (Card Art theme): pixel art in the action area, name bar with class icon,
   STR / Life / DEF squares and an Ability tab that shows the rules on hover */
const HK_COL={str:"#b3121a",hp:"#7f7fd8",def:"#3f9b3f"};
/* Nov 19: a dead Hero's card back (your own Heroes): the starfield, a "Surrender Soul" name band with the class icon,
   and the three soul buttons, which light up only when you can surrender (your priority in the Battle Phase) */
const SOUL_BTNS=[[1,"soul-aura","+2 Aura: your party gains 2 Aura"],[2,"soul-str","+2 STR: target ally gains +2 Strength this turn"],[5,"soul-def","+2 DEF: target ally gains +2 Defense this turn"]];
function soulBackHTML(h,sopts,theirs){const base=typeof ICON_BASE!=="undefined"?ICON_BASE:"assets/";
  const ico=`${base}ico-${String(h.cls||"generic").toLowerCase()}.png`;
  const btns=h.surr?"":SOUL_BTNS.map(([ch,img,lbl])=>{const o=sopts.find(x=>x.ch===ch);
    return`<button type="button" class="sb-opt${o?" on":""}"${o?` data-pa="do" data-a='${esc(JSON.stringify(o))}'`:" disabled"} title="${esc(lbl)}${o?"":theirs?" (opponent's soul)":" (when you have priority)"}" aria-label="${esc(lbl)}"><img src="${base}art/ui/${img}.webp" alt="" draggable="false"></button>`}).join("");
  return`<div class="hk-nb sb-nb"><img class="hk-ci" src="${ico}" alt="${esc(h.cls)}"><span class="hk-nm">${h.surr?"Soul Surrendered":"Surrender Soul"}</span></div>
    <div class="sb-opts">${btns}</div><span class="sb-who">${esc(h.name)}${h.surr?" · can't be revived":""}</span>`}
function heroCardHTML(s,h,d,st,extra,soul,hacts,sback){
  const src=`${typeof ICON_BASE!=="undefined"?ICON_BASE:"assets/"}art/hero-pix/${artKey(d.name)}-pix.png?v=${typeof ART_VER!=="undefined"?ART_VER:1}`;
  const ico=`${typeof ICON_BASE!=="undefined"?ICON_BASE:"assets/"}ico-${String(h.cls||d.cls||"generic").toLowerCase()}.png`;
  /* remember what was on screen last render: newly changed numbers pulse, a Hero that just died flips over */
  if(U.heroSeenKey!==U.gameKey){U.heroSeen={};U.heroFx={};U.heroSeenKey=U.gameKey}
  const seen=U.heroSeen,fx=U.heroFx[h.uid]||(U.heroFx[h.uid]={});const prev=seen[h.uid];const now=Date.now();
  const cur={str:st.str,def:st.def,aura:st.aura,hp:h.dead?0:st.hp,dead:!!h.dead};
  if(prev&&prev.dead!==cur.dead)fx.flip=now;
  ["str","def","aura","hp"].forEach(f=>{if(prev&&prev[f]!==cur[f])fx[f]=now});
  const live=(t,ms)=>t&&now-t<ms?`animation-delay:-${now-t}ms;`:"";
  const flipNow=live(fx.flip,800);
  const base={str:h.base?h.base.str:d.str,def:h.base?h.base.def:d.def,aura:h.base?h.base.aura:d.aura,hp:st.max};
  const num=(f,lbl)=>{const v=cur[f];const b=f==="hp"?st.max:base[f];
    const dir=v>b?" up":v<b?" dn":"";const bd=flipNow?"":live(fx[f],700);const bump=bd?" bump":"";const on=U.statPop&&U.statPop.u===h.uid&&U.statPop.f===f?" on":"";
    const tip=f==="hp"?`Health Points ${v} of ${st.max}`:`${STAT_NAME[f]} ${v} (printed ${b})`;
    return`<button type="button" class="hk-sq hk-${f}${dir}${bump}${on}" style="${bd}" data-pa="stat" data-u="${h.uid}" data-f="${f}" title="${esc(tip)} · click for details" aria-label="${esc(tip)}"><b>${v}</b><i>${lbl}${f==="hp"&&v!==st.max?`<small>/${st.max}</small>`:""}</i></button>`};
  const au=cur.aura,ab=base.aura;
  const aura=`<button type="button" class="hk-au${au>ab?" up":au<ab?" dn":""}" data-pa="stat" data-u="${h.uid}" data-f="aura" title="${esc(`Aura ${au} (printed ${ab}) · click for details`)}">${au}</button>`;
  seen[h.uid]=cur;
  const pop=U.statPop&&U.statPop.u===h.uid?statPopHTML(s,h,st,U.statPop.f):"";
  const rules=d.rules?artRulesHTML(d.rules):"<p>No ability.</p>";
  return`<div class="ph-card hk-card${h.dead?" down":""}${flipNow?" anim":""}"><div class="ph-inner"${flipNow?` style="${flipNow}"`:""}>
    <div class="ph-face">
      <div class="hk-nb"><img class="hk-ci" src="${ico}" alt="${esc(h.cls)}"><span class="hk-nm${d.name.length>17?" xl":d.name.length>13?" l":""}">${esc(d.name)}</span>${h.dead?"":aura}</div>
      <div class="hk-art"><img src="${src}" onerror="this.onerror=null;this.src='${ico}';this.classList.add('noart')" alt="${esc(d.name)}" width="207" height="167" decoding="async">${cardOf(h.id)?zoomHTML(cardOf(h.id)):""}${extra?`<div class="hk-tags">${extra}</div>`:""}${hacts||""}</div>
      <div class="hk-st">${h.dead?"":num("str","STR")+num("hp","HP")+num("def","DEF")}<span class="hk-ab" tabindex="0" aria-label="Ability: ${esc(rulesPlainSafe(d.rules))}">Ability<span class="hk-tip" role="tooltip"><span class="hk-tt">${esc(d.name)} <small>${esc(h.cls)} Hero</small></span>${rules}</span></span></div>
      ${pop}
    </div>
    ${sback?`<div class="ph-back sb${h.surr?" sb-done":""}" aria-hidden="${h.dead?"false":"true"}">${sback}</div>`:`<div class="ph-back" aria-hidden="${h.dead?"false":"true"}"><span class="gemb"></span><span class="cqt">River<br>stead</span><span class="rib">${h.surr?"Surrendered":"Dead"}<small>${esc(d.name)}</small></span>${soul||""}</div>`}
  </div></div>`}
function rulesPlainSafe(t){try{return typeof rulesPlain==="function"?rulesPlain(t||""):String(t||"")}catch(e){return String(t||"")}}
function statPopHTML(s,h,st,f){const pl=s.p[h.owner];const rows=[];const r=(l,v,sign)=>rows.push(`<div><span>${esc(l)}</span><b>${sign&&v>0?"+":""}${v}</b></div>`);
  const eq=k=>E.eqList(h).reduce((n,e)=>n+((k==="str"?e.pstr:e.pdef)||0),0);
  const mods=k=>(h.mods||[]).reduce((n,m)=>n+(m[k]||0),0);
  if(f==="hp"){r("Printed",st.max-(h.ench||[]).filter(e=>e.name==="Life Boost").length*2);const lb=(h.ench||[]).filter(e=>e.name==="Life Boost").length*2;if(lb)r("Life Boost",lb,true);r("Damage taken",-(h.dmg||0));
    return`<div class="ph-pop" role="dialog" aria-label="Health Points" data-pa="stat" data-u="${h.uid}" data-f="hp"><h4>Health Points</h4>${rows.join("")}<div class="tot"><span>Now</span><b>${st.hp} / ${st.max}</b></div></div>`}
  const b=h.base?h.base[f]:0,lv=(h.bon&&h.bon[f])||0;r("Printed",b);if(lv)r("Level points",lv,true);
  if(f!=="aura"){const e=eq(f);if(e)r("Equipment",e,true);const m=mods(f);if(m)r("This turn",m,true);
    const rest=st[f]-b-lv-e-m;if(rest)r("Abilities and other cards",rest,true)}
  else{const rest=st.aura-b-lv;if(rest)r("Other",rest,true)}
  const note=f==="aura"?`<div style="opacity:.8;font-size:.85em;margin-top:1.5cqw"><span>Party Aura pool: ${pl.aura}</span></div>`:"";
  return`<div class="ph-pop" role="dialog" aria-label="${STAT_NAME[f]}" data-pa="stat" data-u="${h.uid}" data-f="${f}"><h4>${STAT_NAME[f]}</h4>${rows.join("")}<div class="tot"><span>Now</span><b>${st[f]}</b></div>${note}</div>`}
function auraBarHTML(s,pl){const max=pl.heroes.reduce((n,h)=>n+(h.dead?0:E.heroStats(s,h).aura),0);const p=max?Math.min(100,pl.aura/max*100):0;
  return`<span class="res aubar" title="Aura pool: ${pl.aura} left of ${max} (your living Heroes' Aura). Refreshes at Dawn; unspent Aura is lost at Dusk." style="--ap:${p.toFixed(1)}%"><i class="fill"></i><i class="aura"></i> <b>${pl.aura}</b><small>/ ${max} Aura</small></span>${pl.t&&pl.t.sAura?`<span class="res" title="From Remains: this Aura can only be spent on Summon cards. Lost at Dusk.">+<b>${pl.t.sAura}</b> Summon Aura</span>`:""}`}
function summonHTML(s,o,cands){const tags=[];E.STATUS.forEach(k=>{if(o.st[k])tags.push(E.STATUS_NAME[k])});(o.ench||[]).forEach(e=>tags.push(e.name)); /* Update 51: enchanted summons (Mark of Doom) */const ar=arrA(o.uid);
  const hpN=E.hp(s,o),hpM=Math.max(1,E.maxHp(s,o)),hpP=Math.max(0,Math.min(100,hpN/hpM*100));
  const hpBar=`<span class="ps-hp" role="img" aria-label="${hpN} of ${hpM} Health Points" title="${hpN}/${hpM} HP"><i style="width:${hpP.toFixed(1)}%;background:${hpP>60?"#3fae4f":hpP>30?"#e0b13a":"#d4402c"}"></i></span>`;
  return`<button class="ps${o.ex?" ex":""}${cands.has(o.uid)?" cand":""}${U.man&&U.manT===o.uid?" mansel":""}${ar.c}" style="${ar.st}--cc:${cc((E.TOK[o.name]||{}).cls||"Druid")}" data-pa="obj" data-u="${o.uid}"><b>${esc(o.name)}</b><span>${E.str(s,o)} STR · ${E.hp(s,o)}/${E.maxHp(s,o)} HP${E.defn(s,o)?` · ${E.defn(s,o)} DEF`:""}</span>${o.ex?"<span>Exhausted</span>":""}${o.imp?"<span title=\"Can't be dealt damage or destroyed; dies at 0 Health Points\">Impervious</span>":""}${o.stealth?"<span>Stealth</span>":""}${E.hasBanding(s,o)?"<span class=\"band\">Banding</span>":""}${E.forcedTarget&&E.forcedTarget(s,o)?`<span class="must" style="color:#C0392B;font-weight:700">Must attack ${esc(nameOf(E.forcedTarget(s,o)))}</span>`:""}${tags.length?`<span style="color:var(--warn)">${tags.join(", ")}</span>`:""}${hpBar}</button>`}
function phaseLabel(s){return({mull:"Mulligan",dawn:"Dawn",battle:"Battle",dusk:"Dusk",town:"Town"})[s.phase]||s.phase}
function midHTML(s,opts){const me=U.me;const pr=s.pend[0];let prompt="",acts="",wait=false,fixBtn="";
  const mineTurn=opts.length>0;
  if(s.over){prompt=(s.winner===me?"🏆 You win!":s.winner<0?"The game is a draw.":`${esc(s.p[s.winner].name)} wins.`)+(s.conceded!=null?(s.conceded===me?" You conceded.":` ${esc(s.p[s.conceded].name)} conceded.`):"")+(s.deckedOut!=null?(s.deckedOut===me?" You had to draw from an empty library.":` ${esc(s.p[s.deckedOut].name)} had to draw from an empty library.`):"");acts=`<button class="btn primary" data-pa="leave">Return to Lobby</button>${U.vsAI?'<button class="btn go" data-pa="rematch">Rematch</button>':""}<button class="btn" data-pa="over-show">Game summary</button><button class="btn" data-pa="export-log" title="Download the full game log as a text file">Export log</button>`}
  else if(U.tgt){const sl=U.tgt.slots[U.tgt.i];prompt=`Choose ${esc(sl.label)} for ${esc(U.tgt.label)}${U.tgt.slots.length>1?` (${U.tgt.i+1}/${U.tgt.slots.length})`:""}. Click a highlighted ${sl.k==="player"||sl.k==="enemyPlayer"?"party button":"target"}.`;
    acts=`${sl.opt?'<button class="btn" data-pa="skip">Skip</button>':""}<button class="btn" data-pa="cancel">Cancel</button>`}
  else if(pr&&pr.pid===me){
    if(pr.type==="window"){const tr=pr.trig;const w=tr.kind==="party10"?"Your party has now taken 10 or more damage this turn":tr.kind==="attack"?`${esc(nameOf(tr.attacker))} attacks ${esc(nameOf(tr.target))}`:`${esc(s.p[tr.pid].name)} plays ${esc(tr.name||"a card")}${(tr.targets||[]).length?" targeting "+tr.targets.map(nameOf).map(esc).join(", "):""}`;
      const stl=opts.filter(o=>["stall","pearl","deflect"].includes(o.type));
      prompt=`⚡ ${w}. ${opts.some(o=>o.type==="reveal")?"Reveal a Hidden card?":"Respond?"}`;acts=stl.map(o=>o.type==="pearl"?`<button class="btn go" data-pa="do" data-a='${esc(JSON.stringify(o))}' title="Sacrifice the Time Pearl: the card is set aside with 2 stall counters (no action needed)">Delay it with a Time Pearl</button>`:o.type==="deflect"?`<button class="btn go" data-pa="do" data-a='${esc(JSON.stringify(o))}' title="Redirect it to another legal target (no action needed), then the Shield is exiled with 4 stall counters">Redirect it with the Deflecting Shield (${esc(nameOf(o.hero))})</button>`:`<button class="btn go" data-pa="do" data-a='${esc(JSON.stringify(o))}' title="Exhaust the Pocket Watch: set the card aside with 2 stall counters">Stall it with the Pocket Watch (exhaust the Watch)</button>`).join("")+opts.filter(o=>o.type==="reveal").map((o,i,all)=>{const f=E.find(s,o.uid);const many=all.filter(x=>x.uid===o.uid).length>1;return`<button class="btn go" data-pa="do" data-a='${esc(JSON.stringify(o))}' title="Exhaust ${esc(nameOf(o.hero))} to reveal it">Reveal ${esc(E.DB[f.o.id].name)}${many?` (exhaust ${esc(nameOf(o.hero))})`:""}</button>`}).join("")+`<button class="btn" data-pa="do" data-a='{"type":"decline"}'>${stl.length?"Don't respond":"Don't reveal"}</button>`}
    else if(pr.type==="manual")prompt=`✋ Resolve by hand: ${esc(pr.title)}`;
    else if(pr.type==="combo")prompt=pr.title?esc(pr.title):"Combo! Play a Combo card without using an action?";
    else if(pr.type==="ask")prompt=esc(pr.title||"Choose");
    else if(pr.type==="scry")prompt="Scry: arrange the top of your library.";
    else if(pr.type==="choose")prompt=esc(pr.title||"Choose");
  }
  else if(pr){wait=true;prompt=`Waiting for ${esc(s.p[pr.pid].name)}…`}
  else if(s.phase==="mull"){if(s.p[me].mullDone){wait=true;prompt="Waiting for your opponent to keep or mulligan…"}else prompt="Keep this hand or mulligan once?";
    if(!s.p[me].mullDone)acts='<button class="btn go" data-pa="do" data-a=\'{"type":"keep"}\'>Keep</button><button class="btn" data-pa="do" data-a=\'{"type":"mull"}\'>Mulligan</button>'}
  else if(s.phase==="dawn"){if(s.dawnDone[me]){wait=true;prompt="Waiting for your opponent to finish Dawn…"}else{prompt="Dawn: you may use your Dawn items, like Topaz (exhausting a Hero), before battle.";
    acts=opts.filter(o=>o.type==="gem").map(o=>`<button class="btn" data-pa="do" data-a='${esc(JSON.stringify(o))}'>${esc(nameOf(o.uid))} (exhaust ${esc(nameOf(o.hero))})</button>`).join("")+opts.filter(o=>o.type==="wake").map(o=>`<button class="btn" data-pa="do" data-a='${esc(JSON.stringify(o))}'>${o.v?`Wake ${esc(nameOf(o.hero))} at next Dawn`:`Keep ${esc(nameOf(o.hero))} Meditating`}</button>`).join("")+'<button class="btn go" data-pa="do" data-a=\'{"type":"dawnDone"}\'>Start battle</button>'}}
  else if(s.phase==="town"){const t=s.town&&s.town.order[s.town.i];if(t!==me){wait=true;prompt=`${esc(s.p[t].name)} is in Town…`}else{
    /* Nov 12, 2026: every Town action is in the Town window in the middle of the screen (townHTML) */
    prompt=`Town: you have ${s.p[me].gold} Gold. Choose in the Town window.`;acts=U.townHide?'<button class="btn go" data-pa="town-show">Open Town</button>':""}}
  else if(s.phase==="battle"){if(s.prio!==me){wait=true;prompt=`${esc(s.p[s.prio].name)} is acting…`}else{const a=E.actorFor(s,me);const refire=s.bonus&&s.bonus.pid===me&&s.bonus.only==="arrow";const fz=a&&E.forcedTarget(s,a);
      const bb=s.bonus&&s.bonus.pid===me?s.bonus:null;
      prompt=bb&&bb.only==="bard"?`Songweaver: <b>${esc(a?a.name:"")}</b> plays a Bard Tactic or Song (pay its Aura cost); it will be duplicated.`:bb&&bb.rapid?`Rapid Shot: <b>${esc(a?a.name:"")}</b> activates Arrows (Piercing 1), then it's exhausted.`:bb&&bb.free?`Line It Up: <b>${esc(a?a.name:"")}</b> may fire an Arrow for free.`:refire?`Refire: <b>${esc(a?a.name:"")}</b> activates an Arrow (pay its Aura). If it resolves, it returns to your inventory.`:a?`Your action with <b>${esc(a.name)}</b>${s.bonus&&s.bonus.pid===me?" (bonus action)":""}${fz?` — it <b>must attack ${esc(nameOf(fz))}</b> (Arrow of Persuasion)`:""}. ${fz?"It must attack now.":"Play a highlighted card, or choose an action:"}`:"None of your Heroes are ready. You can attack with a summon, surrender a soul, or pass.";
      acts=battleActs(s,opts);fixBtn=FIX_BTN}}
  if(U.busy){wait=true;prompt="Sending…"}
  const oppActing=!s.over&&wait&&!U.busy&&(pr?pr.pid!==me:(s.phase==="battle"&&s.prio!==me)||(s.phase==="town"&&s.town&&s.town.order[s.town.i]!==me));
  const oppInfo=oppActing?oppInfoHTML(s):"";
  const ban=""; /* Update 31: the blue "just did" banner is gone; the action pop-ups and the log cover it */
  const posL=s.trials?[[0,"Lead"],[1,"Closer"],[3,"Last"]]:[...E.POS,"Last"].map((p,i)=>[i,p]); /* Trials parties have 2 Heroes: Lead, Closer, Last */
  const posm=`<span class="posm" title="Position marker">${posL.map(([i,p])=>`<span class="${s.phase==="battle"&&s.pos===i?"on":""}${i===3?" last":""}" ${i===3?'title="An Abiding Hero acts here, after the Closer"':""}>${p}</span>`).join("")}</span>`;
  const man=pr&&pr.pid===me&&pr.type==="manual"&&!s.over?manualHTML(s,pr):"";
  return`<section class="pl-mid${wait?" wait":""}${oppActing?" opp":""}"><div class="pl-phase"><span class="ph-n">Round ${s.round||"–"} · ${phaseLabel(s)}</span>${posm}${U.net?`<span class="pl-note">Room ${esc(U.net.code)} · ${U.net.peers?"opponent online":"opponent offline"}</span>`:""}</div>
    <div class="pl-prompt">${prompt}</div>${oppInfo}${ban}${(()=>{const tc=s.over||s.phase==="mull"?[]:turnCounts(s,me);return tc.length?`<div class="pl-counts"><span class="pl-note">This turn:</span>${tc.join("")}</div>`:""})()}${(U.dockFix=s.over?"":fixBtn,"")}${(acts||!s.over)&&!ban?`<div class="pl-acts">${acts}</div>`:""}${ban?"":man}</section>`}
/* Nov 16: Menu and Full screen buttons for the game log tray (computers; tablets use the Controls tray) */
/* Nov 20: sound and music toggles live in the bottom-right button tray */
function sndBtnsHTML(){return`<button type="button" class="btn sm pl-snd" data-pa="snd" data-volpop="sfx" aria-label="Sound effects on or off (point at it for volume)" aria-pressed="${SND.on()}">${SND.on()?"🔊 Effects on":"🔇 Effects off"}</button><button type="button" class="btn sm pl-snd" data-pa="mus" data-volpop="music" aria-label="Music on or off (point at it for volume)" aria-pressed="${MUS.on()}">${MUS.on()?"🎵 Music on":"🎵 Music off"}</button>`}
function ctlBtns(){const T=window.CQTablet;const fsOn=!!(document.fullscreenElement||document.webkitFullscreenElement);const fsOk=!!(T&&T.fsAvail&&T.fsAvail());
  return`<button type="button" class="btn sm pl-ctl" data-pa="menu" aria-expanded="${document.documentElement.classList.contains("pl-menu")}" title="Show the site menu">☰ Menu</button>${fsOk?`<button type="button" class="btn sm pl-ctl" data-pa="fs" aria-pressed="${fsOn}" title="${fsOn?"Exit full screen (Esc)":"Full screen (Esc to exit)"}">⛶ ${fsOn?"Exit full screen":"Full screen"}</button>`:""}`}
/* opponent's turn: what they have to work with */
function oppInfoHTML(s){const op=s.trials?(s.pend[0]?s.pend[0].pid:s.phase==="town"&&s.town?s.town.order[s.town.i]:s.prio):E.opp(U.me);if(op==null||!s.p[op])return"";const pl=s.p[op];const a=s.phase==="battle"&&s.prio===op?E.actorFor(s,op):null;
  return`<div class="pl-oppinfo">${a?`<span>Acting: <b>${esc(a.name)}</b></span>`:""}<span>Hand <b>${pl.hand.length}</b></span><span>Aura <b>${pl.aura}</b></span><span>Gold <b>${pl.gold}</b></span><span>Library <b>${pl.lib.length}</b></span></div>`}
/* "What just happened": after the opponent acts, list their log lines (and what hit you), then hand control back */
function trackBanner(s){const op=E.opp(U.me);if(U.banFor!==U.gameKey){U.banFor=U.gameKey;U.seenN=Math.max(0,...s.log.map(l=>l.n||0));U.banBuf=[];U.banner=null;return}
  const fresh=s.log.filter(l=>(l.n||0)>U.seenN);if(fresh.length){U.seenN=Math.max(...fresh.map(l=>l.n||0));
    if(fresh.some(l=>l.p===op)||U.banBuf.length&&!fresh.some(l=>l.p===U.me))U.banBuf.push(...fresh.filter(l=>l.p!==U.me&&!/^—/.test(l.m)&&!/keeps their hand|mulligans/.test(l.m)))}
  if(!U.banBuf.some(l=>l.p===op&&!/keeps their hand|mulligans|draws \d+ cards?\.$/.test(l.m)))U.banBuf=[];
  const myMove=!s.over&&legal().length>0&&!(s.pend[0]&&s.pend[0].pid!==U.me);
  if(myMove&&U.banBuf.length&&!U.tgt){const lines=U.banBuf.splice(0);U.banBuf=[];showBanner(s,lines)}
  else if(s.over){U.banBuf=[]}}
function showBanner(s,lines){const mine=new Set([...s.p[U.me].heroes.map(h=>h.name),...s.p[U.me].bf.map(o=>o.name),s.p[U.me].name]);
  const hit=l=>[...mine].some(n=>n&&l.m.includes(n));const sel=lines.filter(l=>l.p===E.opp(U.me)||hit(l));const show=(sel.length?sel:lines).slice(-8);
  if(!show.length)return;clearTimeout(U.banT);U.banner={opp:s.p[E.opp(U.me)].name,lines:show.map(l=>({m:l.m,hit:l.p!==E.opp(U.me)&&hit(l)}))};
  U.banT=setTimeout(()=>{U.banner=null;render()},Math.min(6000,3000+Math.max(0,show.length-2)*500))}
function bannerHTML(){const b=U.banner;return`<div class="pl-banner" role="status"><div class="bl"><b>${esc(b.opp)} just:</b>${b.lines.map(l=>`<span class="${l.hit?"hit":""}">${esc(l.m)}</span>`).join("")}</div><button class="btn sm" data-pa="banner-x">Dismiss</button></div>`}
/* end-of-game pop-up: sits over the game layer so Return to Lobby is always on screen (no-scroll layout hides the action bar's overflow) */
/* Trials end screen: a win reveals loot (parties + 1); a loss ends the run */
function trialsOverHTML(s){const T=window.CQT;const P=s.trials.parties;const win=s.winner===0;
  if(!win){store2.del("cq.trials.run");return`<div class="pl-over" role="dialog" aria-modal="true" aria-label="Trial lost"><div class="pl-over-box"><h2>Your run ended at Trial ${s.trials.trial}</h2>
    <p class="pl-over-why">${s.conceded!=null?"You conceded.":"Every party was wiped out."} Loot from this run is gone.</p>
    <div class="pl-over-acts"><button class="btn primary" data-pa="leave">Return to Lobby</button><button class="btn go" data-pa="rematch">Try again</button><button class="btn" data-pa="export-log">Export log</button><button class="btn" data-pa="over-hide">View the board</button></div></div></div>`}
  const rev=T.lootReveal(s);if(!U.lootPick||U.lootPick.g!==U.gameKey)U.lootPick={g:U.gameKey,p:{},kept:false};const pk=U.lootPick.p;
  const cards=rev.map(n=>{const c=byName(n);return`<div class="lc">${c?cardHTML(c,{nozoom:false}):`<b>${esc(n)}</b>`}</div>`}).join("");
  const rows=E.parties(s).slice().sort((a,b)=>a-b).map(p=>`<label>${esc(p===U.me?"You":s.p[p].name)}<select data-pa="t-loot" data-p="${p}"><option value="">Choose loot…</option>${rev.map(n=>`<option value="${esc(n)}" ${pk[p]===n?"selected":""}>${esc(n)}</option>`).join("")}</select></label>`).join("");
  const err=T.checkLoot(rev,pk,P);
  return`<div class="pl-over" role="dialog" aria-modal="true" aria-label="Trial cleared"><div class="pl-over-box"><h2>🏆 Trial ${s.trials.trial} cleared!</h2>
    <p class="pl-over-why">Loot: give one card to each party. The extra goes back. Loot starts in that party's opening hand next Trial.</p>
    <div class="tr-loot">${cards}</div><div class="tr-loot-pick">${rows}</div>
    ${U.lootPick.kept?`<p class="pl-note">Loot kept for your run.</p>`:err?`<p class="pl-note">${esc(err)}</p>`:""}
    <div class="pl-over-acts">${U.lootPick.kept?`<button class="btn go" data-pa="trial-again">Play Trial ${s.trials.trial} again with your loot</button>`:`<button class="btn go" data-pa="keep-loot" ${err?"disabled":""}>Keep this loot</button>`}<button class="btn primary" data-pa="leave">Return to Lobby</button><button class="btn" data-pa="over-hide">View the board</button></div></div></div>`}
function overHTML(s){if(!s.over||U.overHide||U.tut)return"";if(U.spec)return`<div class="pl-over" role="dialog" aria-modal="true" aria-label="Game over"><div class="pl-over-box"><h2>${s.winner<0?"The game is a draw.":`🏆 ${esc(s.p[s.winner].name)} wins.`}</h2>${statsHTML(s)}<div class="pl-over-acts"><button class="btn primary" data-pa="spec-leave">Back to the lobby</button><button class="btn" data-pa="export-log">Export log</button><button class="btn" data-pa="over-hide">View the board</button></div></div></div>`;if(s.trials)return trialsOverHTML(s);const me=U.me;
  const head=s.winner===me?"🏆 You win!":s.winner<0?"The game is a draw.":`${esc(s.p[s.winner].name)} wins.`;
  const why=(s.conceded!=null?(s.conceded===me?"You conceded.":`${esc(s.p[s.conceded].name)} conceded.`):"")+(s.deckedOut!=null?(s.deckedOut===me?" You had to draw from an empty library.":` ${esc(s.p[s.deckedOut].name)} had to draw from an empty library.`):"");
  if(U.match&&U.match.tal)matchTally();
  return`<div class="pl-over" role="dialog" aria-modal="true" aria-label="Game over"><div class="pl-over-box"><h2>${head}</h2>${why?`<p class="pl-over-why">${why.trim()}</p>`:""}${matchLine(s)}${statsHTML(s)}
  <div class="pl-over-acts"><button class="btn primary" data-pa="leave">Return to Lobby</button>${U.match?matchActs():U.vsAI?'<button class="btn go" data-pa="rematch">Rematch</button>':""}<button class="btn" data-pa="export-log" title="Download the full game log as a text file">Export log</button><button class="btn" data-pa="over-hide">View the board</button></div></div></div>`}
/* end-of-game summary */
function statsHTML(s){if(!E.gameStats)return"";const g=E.gameStats(s);const me=U.me;
  const li=a=>a.length?`<ol>${a.map(x=>`<li>${esc(x.name)} — <b>${x.v}</b>${x.side!=null?` <span class="pl-note">(${esc(s.p[x.side].name)})</span>`:""}</li>`).join("")}</ol>`:'<p class="pl-note">None.</p>';
  const line=sd=>`<p><b>${esc(sd.name)}</b><br>Start: ${sd.start.map(esc).join(" → ")||"–"}<br>End: ${sd.final.map(h=>`<span class="${h.dead?"dead":""}">${esc(h.name)} L${h.lvl}</span>`).join(" → ")}<br><span class="pl-note">Damage ${sd.totDmg} · Prevented ${sd.totPrev} · Healed ${sd.totHeal}${sd.healer?` · Top healer: ${esc(sd.healer.name)} (${sd.healer.v})`:""}</span></p>`;
  return`<div class="pl-stats"><div><h3>Game summary · ${g.rounds} round${g.rounds===1?"":"s"}</h3>${line(g.sides[me])}${line(g.sides[E.opp(me)])}</div><div><h3>Most damage</h3>${li(g.topDmg)}</div><div><h3>Most damage prevented</h3>${li(g.topPrev)}<p class="pl-note">Base DEF isn't credited to any card.</p></div></div>`}
function statsText(s){if(!E.gameStats)return"";const g=E.gameStats(s);let t=`\n=== Game summary ===\nRounds: ${g.rounds}\n`;
  g.sides.forEach(sd=>{t+=`${sd.name}: start ${sd.start.join(" > ")} | end ${sd.final.map(h=>`${h.name} L${h.lvl}${h.dead?" (died)":""}`).join(" > ")}\n  Damage ${sd.totDmg}, prevented ${sd.totPrev}, healed ${sd.totHeal}${sd.healer?`; top healer ${sd.healer.name} (${sd.healer.v})`:""}\n`});
  t+="Most damage:\n"+g.topDmg.map((x,i)=>`  ${i+1}. ${x.name} (${g.sides[x.side].name}): ${x.v}`).join("\n")+"\nMost damage prevented:\n"+g.topPrev.map((x,i)=>`  ${i+1}. ${x.name} (${g.sides[x.side].name}): ${x.v}`).join("\n")+"\n";return t}
function lvBtn(o,label,cls){return`<button class="btn ${cls}" data-pa="do" data-a='${esc(JSON.stringify(o))}'><span class="plus" aria-hidden="true">+</span>${esc(label)}</button>`}
/* an ability that isn't offered right now shows greyed, and tapping it says why (abilities with a why(), Nov 13, 2026) */
function abWhy(s,opts,a){if(!a||a.owner!==U.me||U.tgt)return[];return(window.CQ_HERO_SCRIPTS[a.name]||[]).map((ab,i)=>{if(!ab||!ab.why||opts.some(o=>o.type==="ability"&&o.idx===i))return"";
  let w="";try{w=ab.why(s,U.me,a,c=>whyNot(s,c))}catch(e){}return w?`<button class="btn ab-off" data-pa="abwhy" data-w="${esc(w)}" title="${esc(w)}" aria-disabled="true">${esc(ab.label)}</button>`:""}).filter(Boolean)}
function btn(o,label,cls){return`<button class="btn${cls?" "+cls:""}" data-pa="do" data-a='${esc(JSON.stringify(o))}'>${esc(label)}</button>`}
/* the acting Hero's own buttons (attack, level up, Abide, abilities, items, equip): also shown under that Hero on the board */
function heroActs(s,opts,a){const out=[];const me=U.me;if(!a)return out;
  opts.filter(o=>o.type==="attack"&&o.att===a.uid).forEach(o=>out.push(btn(o,"Attack","atk")));
  const lv=opts.filter(o=>o.type==="level");const LV={str:"STR",def:"DEF",aura:"AURA"};
  if(lv.length===1&&!lv[0].stat)out.push(lvBtn(lv[0],"Level up","lv"));else lv.forEach(o=>out.push(lvBtn(o,`Level up ${LV[o.stat]}`,"lv lv-"+o.stat)));
  opts.filter(o=>o.type==="step").forEach(o=>out.push(btn(o,"Abide")));
  opts.filter(o=>o.type==="ability").forEach(o=>{const ab=window.CQ_HERO_SCRIPTS[a.name][o.idx];const c=E.abilityCost(s,me,a,ab);out.push(btn(o,`${ab.label}${c?` (${c} Aura)`:""}`))});
  abWhy(s,opts,a).forEach(x=>out.push(x));
  opts.filter(o=>o.type==="eqAct").forEach(o=>{const f=E.find(s,o.uid);const x=(window.CQ_EQACT||{})[f.o.name];out.push(`<button class="btn" data-pa="eqact" data-u="${o.uid}">${esc(f.o.name)}: ${esc(x?x.label:"use")}</button>`)});
  opts.filter(o=>o.type==="use").forEach(o=>{const f=E.find(s,o.uid);if(o.fromHand){const nm=E.DB[f.o.id].name;out.push(btn(o,`Activate ${nm} from hand (${E.handArrowCost(s,me,a,f.o)})`));return}const c=E.itemCost(s,me,a,f.o);out.push(btn(o,`Use ${f.o.name}${c?` (${c})`:""}`))});
  opts.filter(o=>o.type==="equipInv").forEach(o=>{const f=E.find(s,o.uid);out.push(btn(o,`Equip ${f.o.name} (${E.eqCost(s,a,f.o)})`))});
  opts.filter(o=>o.type==="take").forEach(o=>{const f=E.find(s,o.uid);out.push(btn(o,`Take ${f.o.name} from ${f.hero.name} (${E.eqCost(s,a,f.o)})`))});
  if(opts.some(o=>o.type==="manualAbility")&&/Exhaust|\{A\}:/.test(E.DB[a.id].rules)&&!window.CQ_HERO_SCRIPTS[a.name])out.push(btn({type:"manualAbility"},`Use ${a.name}'s ability (by hand)`));
  return out}
function battleActs(s,opts){const out=[];const me=U.me;const a=E.actorFor(s,me);
  const atk=opts.filter(o=>o.type==="attack");atk.forEach(o=>out.push(btn(o,o.att===(a&&a.uid)?"Attack":`${nameOf(o.att)} attacks`,"atk")));
  const bands=opts.filter(o=>o.type==="band");if(bands.length){const lead=bands.find(o=>a&&o.att===a.uid)||bands[0];out.push(btn(lead,`Band attack (${E.bandMembers(s,me).length} ready)`,"atk band"))}
  opts.filter(o=>o.type==="useFree").forEach(o=>{const f=E.find(s,o.uid);out.push(btn(o,`Use ${f.o.name} (no action)`))});
  if(opts.some(o=>o.type==="multiBow"))out.push('<button class="btn" data-pa="multi">Multi Bow: destroy Arrows</button>');
  opts.filter(o=>o.type==="eqAct").forEach(o=>{const f=E.find(s,o.uid);const x=(window.CQ_EQACT||{})[f.o.name];out.push(`<button class="btn" data-pa="eqact" data-u="${o.uid}">${esc(f.o.name)}: ${esc(x?x.label:"use")}</button>`)});
  opts.filter(o=>o.type==="playStalled").forEach(o=>{const c=(s.p[me].stall||[]).find(x=>x.uid===o.uid);if(c)out.push(`<button class="btn go" data-pa="do" data-a='${esc(JSON.stringify(o))}' title="Its stall counters are gone: play it without paying its Aura cost">Play ${esc(E.DB[c.id].name)} (Stalled, free)</button>`)});
  opts.filter(o=>o.type==="play"&&s.p[me].disc.some(x=>x.uid===o.uid)).forEach(o=>{const c=s.p[me].disc.find(x=>x.uid===o.uid);out.push(`<button class="btn go" data-pa="play" data-u="${o.uid}" title="Exhume: it was milled this turn, so you may play it from your discard pile (paying its costs)">Play ${esc(E.DB[c.id].name)} (Exhume, ${E.cardCost(s,me,a,E.DB[c.id],0)} Aura)</button>`)});
  opts.filter(o=>o.type==="play"&&s.p[me].exile.some(x=>x.uid===o.uid)).forEach(o=>{const c=s.p[me].exile.find(x=>x.uid===o.uid);out.push(`<button class="btn go" data-pa="play" data-u="${o.uid}">Play ${esc(E.DB[c.id].name)} (Call of Nature)</button>`)});
  const lv=opts.filter(o=>o.type==="level");const LV={str:"STR",def:"DEF",aura:"AURA"};
  if(lv.length===1&&!lv[0].stat)out.push(lvBtn(lv[0],"Level up","lv"));else lv.forEach(o=>out.push(lvBtn(o,`Level up ${LV[o.stat]}`,"lv lv-"+o.stat)));
  opts.filter(o=>o.type==="step").forEach(o=>out.push(btn(o,"Abide")));
  opts.filter(o=>o.type==="ability").forEach(o=>{const ab=window.CQ_HERO_SCRIPTS[a.name][o.idx];const c=E.abilityCost(s,me,a,ab);out.push(btn(o,`${ab.label}${c?` (${c} Aura)`:""}`))});
  abWhy(s,opts,a).forEach(x=>out.push(x));
  opts.filter(o=>o.type==="use").forEach(o=>{const f=E.find(s,o.uid);if(o.fromHand){const nm=E.DB[f.o.id].name;out.push(btn(o,`Activate ${nm} from hand (${E.handArrowCost(s,me,a,f.o)})`));return}const c=E.itemCost(s,me,a,f.o);out.push(btn(o,`Use ${f.o.name}${c?` (${c})`:""}`))});
  opts.filter(o=>o.type==="equipInv").forEach(o=>{const f=E.find(s,o.uid);out.push(btn(o,`Equip ${f.o.name} (${E.eqCost(s,a,f.o)})`))});
  opts.filter(o=>o.type==="take").forEach(o=>{const f=E.find(s,o.uid);out.push(btn(o,`Take ${f.o.name} from ${f.hero.name} (${E.eqCost(s,a,f.o)})`))});
  out.push('<span class="sep"></span>');
  if(opts.some(o=>o.type==="manualAbility")&&a&&/Exhaust|\{A\}:/.test(E.DB[a.id].rules)&&!window.CQ_HERO_SCRIPTS[a.name])out.push(btn({type:"manualAbility"},`Use ${a.name}'s ability (by hand)`));
  if(opts.some(o=>o.type==="skipBonus"))out.push(btn({type:"skipBonus"},s.bonus&&s.bonus.only==="bard"?"Skip (don't play a card)":s.bonus&&s.bonus.queue&&s.bonus.queue.length?"Skip this Ranger":"Skip (don't activate an Arrow)"));
  else if(opts.some(o=>o.type==="pass"))out.push(`<button class="btn pass" data-pa="do" data-a='${esc(JSON.stringify({type:"pass"}))}'><svg class="pass-ico" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M2 10h11M9 4.5 15 10l-6 5.5" fill="none" stroke="#1f9d48" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Pass for the round</button>`);
  return out.join("")}
/* Game Help: an expandable holding Rules fix and (online) Give opponent an action */
function helpHTML(fixBtn){const give=U.net?'<button class="btn sm" data-pa="do" data-a=\'{"type":"giveAction"}\' title="Let your opponent resolve something by hand (a card they control, a choice). Control comes back to you without using your action.">Give opponent an action</button>':"";
  return`<details class="pl-help"${U.helpOpen?" open":""}><summary>Game Help</summary><div class="pl-help-b">${fixBtn}${give}</div></details>`}
const FIX_BTN='<button class="btn sm pl-fix" data-pa="do" data-a=\'{"type":"fix"}\' title="Open the manual panel to correct something the engine missed">Rules fix</button>';
function handHTML(s,opts){const pl=s.p[U.me];const playable=new Set(opts.filter(o=>o.type==="play").map(o=>{const c=pl.hand.find(x=>x.uid===o.uid);return c&&c.id}));
  const cards=pl.hand.map(c=>{const card=cardOf(c.id);if(!card)return"";return`<button class="hc${playable.has(c.id)?" ok":""}" data-pa="hand" data-u="${c.uid}" data-cls="${esc(card.cls||"Generic")}">${cardHTML(card)}${(()=>{const b=cardCounts(s,c);return b.length?`<span class="cb">${b.join("")}</span>`:""})()}</button>`}).join("");
  return`<section><div class="pl-hand-h"><span>Your hand (${pl.hand.length}) · <span class="hl-note">outline = playable now · point at one of your Heroes to see the cards it can play</span></span></div><div class="pl-handwrap"><button type="button" class="pl-hscr l" data-pa="hscr" data-d="-1" aria-label="Scroll hand left">‹</button><div class="pl-hand">${cards||'<span class="pl-note">No cards in hand.</span>'}</div><button type="button" class="pl-hscr r" data-pa="hscr" data-d="1" aria-label="Scroll hand right">›</button></div></section>`}
function manualHTML(s,pr){const pl=s.p[U.me];const m=U.man||(U.man={op:"dmg",n:1,k:"burn",name:"Soldier"});
  const ops=[["dmg","Deal damage (DEF applies)"],["lose","Lose HP"],["heal","Heal"],["status","Add status"],["unstatus","Remove status"],["str","STR up (this turn)"],["nstr","STR down (this turn)"],["def","DEF up (this turn)"],["ndef","DEF down (this turn)"],["guard","Give Guard"],["draw","Draw cards"],["aura","Gain Aura"],["naura","Lose Aura"],["gold","Gain Gold"],["exhaust","Exhaust"],["ready","Ready"],["level","Level up"],["delevel","Lose a level"],["summon","Create summon token"],["pillar","Conjure Pillar"],["dagger","Create Dagger token"],["doll","Create Doll"],["destroy","Destroy object"],["exileobj","Exile object"],["unequip","Unequip"],["discard","Discard from hand"],["fromDisc","Return from discard to hand"],["discToInv","Return from discard to inventory"],["playfree","Play a card from hand (free)"],["revive","Revive Hero (HP)"],["move","Move Hero to position (0-2)"],["reveal","Reveal / play a Hidden card"],["mill","Mill (top cards → discard)"],["equipfree","Equip for free"],["revealtop","Reveal top cards of a library"],["revmove","Move a revealed card"],["endAction","End the action"]].sort((x,y)=>x[1].localeCompare(y[1]));
  const az=(arr,nm)=>arr.slice().sort((x,y)=>nm(x).localeCompare(nm(y)));const cn=c=>(E.DB[c.id]||{name:c.name||""}).name;
  const needT=!["draw","aura","naura","gold","summon","pillar","dagger","doll","discard","fromDisc","discToInv","playfree","reveal","mill","revealtop","revmove","endAction"].includes(m.op);
  const needN=["dmg","lose","heal","str","nstr","def","ndef","guard","draw","aura","naura","gold","revive","move","mill","revealtop"].includes(m.op);
  let extra="";
  if(m.op==="status"||m.op==="unstatus")extra=`<select data-pa="man-k">${E.STATUS.map(k=>`<option value="${k}" ${m.k===k?"selected":""}>${E.STATUS_NAME[k]}</option>`).join("")}</select>`;
  if(m.op==="summon")extra=`<select data-pa="man-name">${az(Object.values(E.TOK).filter(t=>t.tkind==="Summon"),t=>t.name).map(t=>`<option ${m.name===t.name?"selected":""}>${esc(t.name)}</option>`).join("")}</select>`;
  if(m.op==="pillar")extra=`<select data-pa="man-name"><option ${m.name==="Spell Damage Pillar"?"selected":""}>Spell Damage Pillar</option><option ${m.name==="Pain Pillar"?"selected":""}>Pain Pillar</option></select>`;
  if(m.op==="dagger")extra=`<select data-pa="man-name"><option>Dagger</option><option ${m.name==="Viper Fang Dagger"?"selected":""}>Viper Fang Dagger</option></select>`;
  if(m.op==="discard")extra=`<select data-pa="man-card">${az(pl.hand,cn).map(c=>`<option value="${c.uid}">${esc(E.DB[c.id].name)}</option>`).join("")}</select>`;
  if(m.op==="fromDisc")extra=`<select data-pa="man-card">${az(pl.disc,cn).map(c=>`<option value="${c.uid}">${esc(E.DB[c.id].name)}</option>`).join("")}</select>`;
  if(m.op==="discToInv"){const dc=az(pl.disc.filter(c=>c.id&&E.DB[c.id]),cn);extra=dc.length?`<select data-pa="man-card">${dc.map(c=>`<option value="${c.uid}">${esc(E.DB[c.id].name)}</option>`).join("")}</select>`:'<span class="pl-note">Your discard pile is empty.</span>'}
  if(m.op==="playfree"){const hc=az(pl.hand.filter(c=>c.id&&E.DB[c.id]),cn);const fh=E.fixHero(s,U.me,{hero:U.manT});
    extra=hc.length?`<select data-pa="man-card">${hc.map(c=>`<option value="${c.uid}">${esc(E.DB[c.id].name)}</option>`).join("")}</select><span class="pl-note">Played by: <b>${fh?esc(fh.name):"—"}</b> (click one of your Heroes to change). No Aura is paid and class or ready limits don't apply; you'll pick its targets next.</span>`:'<span class="pl-note">No cards in your hand.</span>'}
  if(m.op==="reveal"){const hc=az([...pl.inv.filter(o=>o.fd&&o.id),...pl.hand.filter(c=>E.DB[c.id]&&E.DB[c.id].sup==="Hidden")],cn);extra=hc.length?`<select data-pa="man-card">${hc.map(c=>`<option value="${c.uid}">${esc(E.DB[c.id].name)} (${pl.inv.includes(c)?"set":"in hand"}, ${E.hiddenCost(s,U.me,c)} Aura)</option>`).join("")}</select>`:'<span class="pl-note">You have no Hidden cards set or in hand.</span>'}
  const whoSel=`<select data-pa="man-name"><option ${m.name!=="Opponent"?"selected":""}>You</option><option ${m.name==="Opponent"?"selected":""}>Opponent</option></select>`;
  if(m.op==="mill"||m.op==="revealtop")extra=whoSel;
  if(m.op==="equipfree"){const eq=az([...pl.hand.filter(c=>E.DB[c.id]&&E.DB[c.id].kind==="equip"),...pl.inv.filter(o=>o.kind==="equip")],cn);
    extra=eq.length?`<select data-pa="man-card">${eq.map(c=>`<option value="${c.uid}">${esc(cn(c))} (${pl.hand.includes(c)?"hand":"inventory"})</option>`).join("")}</select>`:'<span class="pl-note">No Equipment in your hand or inventory.</span>'}
  if(m.op==="revmove"){const rt=pr.revTop;const lp=rt&&s.p[rt.pid];const cs=rt?az(lp.lib.filter(c=>rt.uids.includes(c.uid)&&c.id),cn):[];
    extra=cs.length?`<select data-pa="man-card">${cs.map(c=>`<option value="${c.uid}">${esc(cn(c))}</option>`).join("")}</select><select data-pa="man-k">${[["top","to the top"],["bottom","to the bottom"],["hand","to hand"],["discard","to the discard pile"]].map(([k,l])=>`<option value="${k}" ${m.k===k?"selected":""}>${l}</option>`).join("")}</select>`:'<span class="pl-note">Reveal top cards first.</span>'}
  if(m.op==="level")extra=`<select data-pa="man-k">${["str","def","aura"].map(k=>`<option value="${k}" ${m.k===k?"selected":""}>if even: +1 ${k.toUpperCase()}</option>`).join("")}</select>`;
  return`<div class="pl-man"><div class="txt"><b>${esc(pr.title)}</b>${pr.text?`<br>${rulesHTML(pr.text)}`:""}</div>${(pr.revealed||[]).map(r=>`<div class="txt"><b>Revealed: ${esc(r.name)}</b><br>${rulesHTML(r.text)}</div>`).join("")}
    <div class="row"><select data-pa="man-op">${ops.map(([k,l])=>`<option value="${k}" ${m.op===k?"selected":""}>${l}</option>`).join("")}</select>
    ${needN?`<input type="number" min="0" max="99" value="${m.n}" data-pa="man-n" aria-label="Amount">`:""}${extra}
    ${needT?`<span class="pl-note">Target: <b>${U.manT?esc(nameOf(U.manT)):"click a Hero, summon or item on the board"}</b></span>${U.manT?"":""}`:""}
    <button class="btn" data-pa="man-apply">Apply</button><button class="btn go" data-pa="do" data-a='{"type":"manDone"}'>Done</button>${U.net&&!pr.given?'<button class="btn sm" data-pa="do" data-a=\'{"type":"giveAction"}\' title="Let your opponent resolve something by hand; this panel stays open for you afterwards">Give opponent an action</button>':""}${s.undo&&pr.undoId===s.undo.id?'<button class="btn danger" data-pa="man-cancel" title="Undo the card or action that opened this panel">Cancel</button>':""}</div>
    <p class="pl-note">Each change is written to the game log for both players.</p></div>`}

/* ---------- modals ---------- */
function modal(html,o){o=o||{};closeModal();const m=document.createElement("div");m.className="modal";m.id="pl-modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");
  m.innerHTML=`<div class="box${o.wide?" wide":""}${o.cls?" "+o.cls:""}">${html}</div>`;if(o.dismiss!==false)m.addEventListener("click",e=>{if(e.target===m)m.remove()});document.getElementById("layer").appendChild(m);return m}
function closeModal(){const m=document.getElementById("pl-modal");if(m)m.remove()}
/* Nov 19: "Jorkev, the Pillager trigger 3 of 5" so back-to-back prompts of the same trigger read as new ones */
function askN(s,pr,key){const title=pr.title||"";const r=U.askRun;let n=1;
  if(r&&r.key===key)n=r.n;else if(r&&r.title===title)n=r.n+1;U.askRun={title,n,key};
  const left=s.pend.filter(p=>p.type==="ask"&&p.pid===U.me&&p.title===title).length;const tot=n-1+left;
  if(tot<2)return"";const src=(pr.data&&pr.data.name)||title.split(":")[0];return`<span class="ask-n">${esc(src)} trigger ${n} of ${tot}</span>`}
function modals(s){const pr=s.pend[0];
  if(!pr||pr.pid!==U.me||s.over||U.tgt||U.spec){modalMinTab(s,null,null);if(document.getElementById("pl-modal")&&document.getElementById("pl-modal").dataset.k)closeModal();return}
  const key=pr.type+":"+s.seq;if(modalMinTab(s,pr,key))return;const cur=document.getElementById("pl-modal");if(cur&&cur.dataset.k===key)return;
  if(pr.type==="scry"){const pl=s.p[U.me];U.scry=U.scry&&U.scry.key===key?U.scry:{key,order:pr.cards.slice(),bottom:[]};
    const m=modal(scryHTML(s,pr),{wide:true,dismiss:false});m.dataset.k=key}
  else if(pr.type==="choose"){U.pick=U.pick&&U.pick.key===key?U.pick:{key,on:[]};const m=modal(chooseHTML(s,pr),{wide:true,dismiss:false});m.dataset.k=key}
  else if(pr.type==="combo"){const m=modal(comboHTML(s,pr),{wide:true,dismiss:false});m.dataset.k=key}
  else if(pr.type==="ask"&&pr.opts.some(o=>o.card)){const da=i=>`data-pa="do" data-a='${esc(JSON.stringify({type:"ask",i}))}'`;
    const m=modal(`<div class="ask-box"><h2>${esc(pr.title||"Choose")}</h2><div class="pick-list">${pr.opts.map((o,i)=>o.card?`<div class="ask-card"><button class="pk" ${da(i)} title="${esc(o.label)}">${cardHTML(cardOf(o.card))}</button><button class="btn" ${da(i)}>${esc(o.label)}</button></div>`:"").join("")}</div><div class="actions" style="flex-direction:column;align-items:stretch;margin-top:10px">${pr.opts.map((o,i)=>o.card?"":`<button class="btn" ${da(i)}>${esc(o.label)}</button>`).join("")}</div>${askN(s,pr,key)}</div>`,{wide:true,dismiss:false});m.dataset.k=key}
  else if(pr.type==="ask"){const am=pr.amount;if(am){if(!U.askAmt||U.askAmt.key!==key)U.askAmt={key,val:am.val,min:am.min,max:am.max}}else U.askAmt=null;
    const amtHTML=am?`<div class="ask-amt"><span>Triggers</span><button class="btn" data-pa="amt" data-d="-1" aria-label="Fewer">−</button><b id="ask-amt-v">${U.askAmt.val}</b><span class="ask-amt-of">of ${am.max}</span><button class="btn" data-pa="amt" data-d="1" aria-label="More">+</button><button class="btn" data-pa="amt" data-d="all">All</button></div><p class="ask-amt-hint">Then click a target.</p>`:"";
    const m=modal(`<div class="ask-box"><h2>${esc(pr.title||"Choose")}</h2>${amtHTML}<div class="actions" style="flex-direction:column;align-items:stretch">${pr.opts.map((o,i)=>`<button class="btn" data-pa="do" data-a='${esc(JSON.stringify({type:"ask",i}))}'>${esc(o.label)}</button>`).join("")}</div>${askN(s,pr,key)}</div>`,{dismiss:false});m.dataset.k=key;try{document.activeElement&&document.activeElement.blur()}catch(e){}}
  else if(cur&&cur.dataset.k)closeModal();addViewBoard()}
function cardById(s,u,pr){if(pr&&pr.show&&pr.show[u])return pr.show[u];for(const pl of s.p)for(const z of["hand","lib","disc"]){const c=pl[z].find(x=>x.uid===u);if(c&&c.id)return c.id}return null}
function scryHTML(s,pr){const sc=U.scry;
  return`<h2>Scry ${pr.cards.length}</h2><p class="pl-note">The first card listed is the top of your library. Send cards to the bottom or reorder them.</p>
  <div class="pick-list">${sc.order.map((u,i)=>{const id=cardById(s,u,pr);const bot=sc.bottom.includes(u);return`<div class="pk${bot?"":" on"}">${cardHTML(cardOf(id))}<span class="badge">${bot?"Bottom":"Top #"+(sc.order.filter(x=>!sc.bottom.includes(x)).indexOf(u)+1)}</span>
    <div class="actions" style="margin-top:6px"><button class="btn sm" data-pa="scry-bot" data-u="${u}">${bot?"Keep on top":"Send to bottom"}</button>${i>0?`<button class="btn sm" data-pa="scry-up" data-u="${u}">↑ Earlier</button>`:""}</div></div>`}).join("")}</div>
  <div class="actions"><button class="btn primary go" data-pa="scry-done">Done</button></div>`}
function chooseHTML(s,pr){const pk=U.pick;
  return`<h2>${esc(pr.title||"Choose")}</h2><p class="pl-note">Choose ${pr.min===pr.max?pr.max:`${pr.min||0} to ${pr.max}`} card${pr.max===1?"":"s"}.</p>
  <div class="pick-list">${pr.cards.map(u=>{const id=cardById(s,u,pr);return`<button class="pk${pk.on.includes(u)?" on":""}" data-pa="pick-card" data-u="${u}">${cardHTML(cardOf(id))}</button>`}).join("")}</div>
  <div class="actions"><button class="btn primary go" data-pa="choose-done" ${pk.on.length<(pr.min||0)?"disabled":""}>${pr.pickLabel?(pk.on.length?pr.pickLabel:"Leave it on top"):`Confirm (${pk.on.length})`}</button></div>`}
function comboHTML(s,pr){const opts=legal().filter(o=>o.type==="comboPlay");
  return`<h2>${pr.fromDisc?"From your discard pile":pr.free?"Revealed cards":"Combo"}</h2><p class="pl-note">${pr.fromDisc&&pr.title?esc(pr.title):pr.free?esc(pr.title||"You may play a revealed card for free."):"You revealed a Combo card. You may play it, or a Combo card from your hand, by paying its Aura cost (no action used)."}</p>
  <div class="pick-list">${pr.cands.map(u=>{const id=cardById(s,u,pr);const ok=opts.some(o=>o.uid===u);const inLib=s.p[U.me].lib.some(c=>c.uid===u);const inDisc=s.p[U.me].disc.some(c=>c.uid===u);return`<div class="pk">${cardHTML(cardOf(id))}<span class="badge">${inDisc?"Discard pile":inLib?"Revealed":"In hand"}</span><div class="actions" style="margin-top:6px"><button class="btn sm${ok?" primary":""}" data-pa="combo-play" data-u="${u}" ${ok?"":"disabled"}>${ok?"Play":"Can't afford"}</button></div></div>`}).join("")}</div>
  <div class="actions"><button class="btn" data-pa="do" data-a='{"type":"decline"}'>Don't play</button></div>`}
function inspectObj(u){const s=view();const f=E.find(s,u);if(!f)return;const o=f.o;
  let card=null;if(o.kind==="hero")card=cardOf(o.id);else if(o.kind==="summon"||o.kind==="pillar"||o.kind==="doll"||(o.kind==="equip"&&o.tok))card=BYID.get("t:"+o.name);else if(o.id)card=cardOf(o.id);
  const mine=f.pid===U.me;const opts=legal();const acts=[];
  if(mine&&o.kind==="card"){opts.filter(x=>(x.type==="use"||x.type==="clear")&&x.uid===u).forEach(x=>acts.push(btn(x,x.type==="use"?"Activate":"Clear from inventory (discard)")))}
  if(mine&&o.kind==="equip"){opts.filter(x=>(x.type==="equipInv"||x.type==="take"||x.type==="clear")&&x.uid===u).forEach(x=>acts.push(btn(x,x.type==="clear"?"Clear from inventory (discard)":x.type==="take"?"Take it":"Equip it")))}
  if(mine&&o.kind==="summon")opts.filter(x=>x.type==="attack"&&x.att===u).forEach(x=>acts.push(btn(x,"Attack with it","atk")));
  if(mine)opts.filter(x=>x.type==="band"&&x.att===u).forEach(x=>acts.push(btn(x,"Lead a Band attack","go")));
  if(mine&&o.kind==="card")opts.filter(x=>x.type==="useFree"&&x.uid===u).forEach(x=>acts.push(btn(x,"Activate (no action)","go")));
  if(mine&&o.kind==="hero"&&o.med)acts.push(`<button class="btn" data-pa="do" data-a='${esc(JSON.stringify({type:"wake",hero:u,v:o.keepMed}))}'>${o.keepMed?"Wake at next Dawn":"Keep Meditating"}</button>`);
  const hidden=o.fd&&!mine;
  modal(`${hidden?"<p>A face-down Hidden card.</p>":card?cardHTML(card,{flipped:E.isUp(s,o),nozoom:1}):`<h2>${esc(o.name)}</h2>`}
    ${o.kind==="hero"?`<p class="pl-note">Level ${o.lvl}${o.bon.str||o.bon.def||o.bon.aura?` · level bonuses: ${["str","def","aura"].filter(k=>o.bon[k]).map(k=>`+${o.bon[k]} ${k.toUpperCase()}`).join(", ")}`:""}${o.dmg?` · ${o.dmg} damage taken`:""}</p>`:""}
    ${(o.kind==="hero"||o.kind==="summon")&&(o.ench||[]).length?`<p class="pl-note">Enchantments: ${o.ench.map(e=>esc(e.name)).join(", ")}</p>`:""}
    <div class="actions">${acts.join("")}<button class="btn" data-pa="close">Close</button></div>`)}
function showPile(pid,z){if(z==="echo")return showEcho(pid);const s=view();const pl=s.p[pid];const list=z==="echo"?pl.echo.map(e=>e.card||{}):pl[z];
  const mine=z==="disc"&&pid===U.me&&U.mode==="game";const ex=mine?list.filter(c=>exhumeOk(s,pid,c)):[];
  const one=c=>{if(!c.id)return"";if(!ex.includes(c))return cardHTML(cardOf(c.id));
    return`<div class="pl-exh" role="button" tabindex="0" data-pa="exhcard" data-u="${c.uid}" title="Exhume: tap to play it from your discard pile">${cardHTML(cardOf(c.id),{nozoom:1})}<span class="pl-exh-tag">Exhume · tap to play</span></div>`};
  modal(`<h2>${esc(pl.name)} · ${z==="disc"?"Discard pile":z==="echo"?"Echo":"Exile"} (${list.length})</h2>${z==="echo"?'<p class="pl-note">These cards are played again at the next Dawn, for free.</p>':""}${ex.length?`<p class="pl-note">Glowing cards have Exhume: they were milled this turn, so you can play them from here, paying their costs.</p>`:""}<div class="pick-list">${list.slice().reverse().filter(c=>ex.includes(c)).concat(list.slice().reverse().filter(c=>!ex.includes(c))).map(one).join("")||'<p class="pl-note">Empty.</p>'}</div><div class="actions"><button class="btn" data-pa="close">Close</button></div>`,{wide:true})}

/* ---------- starting an action (modes, X, targets) ---------- */
function begin(a){const s=view();
  if(a.type==="band"&&!a.members){return pickBand(a)}
  if(a.type==="band"||a.type==="useFree"||a.type==="eqAct"){const slots=E.need(s,U.me,a);if(!slots.length){send(a);return}
    if(a.type==="band"&&!slots[0].cands.length){toast("There's nothing that can be attacked.");return}
    U.tgt={a,slots,i:0,picks:[],label:a.type==="band"?"the band attack":E.labelAction(s,U.me,a)};skipEmpty();render();return}
  if(a.type==="soul"||a.type==="attack"||a.type==="ability"||a.type==="use"||a.type==="play"||a.type==="comboPlay"||a.type==="fixPlay"){
    if((a.type==="play"||a.type==="comboPlay"||a.type==="fixPlay")&&!a._ready){const pl=s.p[U.me];const c=pl.hand.find(x=>x.uid===a.uid)||pl.lib.find(x=>x.uid===a.uid)||pl.exile.find(x=>x.uid===a.uid)||pl.disc.find(x=>x.uid===a.uid);const d=E.DB[c.id];const sc=SCR()[d.name];
      if(sc&&sc.modes&&!a.modes){return pickModes(a,d,sc)}
      if((d.cost==="X"||(sc&&sc.x))&&a.x==null){return pickX(a,d,sc)}}
    if(a.type==="use"&&!a.modes){const f=E.find(s,a.uid);const isc=f&&SCR()[f.o.name];if(isc&&isc.act&&isc.act.modes)return pickModes(a,E.DB[f.o.id]||{name:f.o.name},isc.act)}
    const slots=E.need(s,U.me,a);
    if(!slots.length){send(a);return}
    const req=slots.find(sl=>!sl.opt&&!sl.cands.length);if(req&&a.type!=="attack"){/* engine allows required slots with no candidates (fizzle) */}
    if(a.type==="attack"&&!slots[0].cands.length){toast("There's nothing that can be attacked.");return}
    U.tgt={a,slots,i:0,picks:[],label:a.type==="attack"?"the attack":a.type==="soul"?"the soul":a.type==="fixPlay"?(E.DB[(s.p[U.me].hand.find(x=>x.uid===a.uid)||{}).id]||{name:"the card"}).name+" (free)":E.labelAction(s,U.me,a).replace(/^Play /,"")};
    skipEmpty();render();return}
  send(a)}
/* Nov 19: target pop-up (bottom center) says what to select; slots with the same label count up ("Revenant to sacrifice 1/3") */
function tgtBase(l){return String(l||"").replace(/\s*\(\d+ of \d+\)\s*$/,"")}
function tgtPopHTML(){const t=U.tgt;if(!t||t.i>=t.slots.length)return"";const sl=t.slots[t.i];const base=tgtBase(sl.label);
  let a=t.i,b=t.i;while(a>0&&tgtBase(t.slots[a-1].label)===base)a--;while(b<t.slots.length-1&&tgtBase(t.slots[b+1].label)===base)b++;
  const tot=b-a+1,done=t.i-a;const party=sl.k==="player"||sl.k==="enemyPlayer";
  const what=tot>1?`Select ${esc(base)} <b class="tp-n">${done}/${tot}</b>`:`Select ${party?"a party":"a target"}: ${esc(base)}`;
  const picked=t.picks.filter(Boolean).length;
  return`<div class="pl-tpop" role="status" aria-live="polite"><div class="tp-h">${esc(t.label)}</div><div class="tp-w">${what}</div>${picked?`<div class="tp-s">${picked} selected</div>`:""}<div class="tp-a">${sl.opt?'<button class="btn sm" data-pa="skip">Skip</button>':""}<button class="btn sm" data-pa="cancel">Cancel</button></div></div>`}
function markPicks(root){const t=U.tgt;if(!t)return;t.picks.forEach((u,i)=>{if(!u)return;root.querySelectorAll(`[data-u="${String(u).replace(/["\\]/g,"")}"]`).forEach(el=>{if(el.parentElement&&el.parentElement.closest(`[data-u="${el.dataset.u}"]`))return;el.classList.add("tpicked");el.classList.remove("cand");el.dataset.pn=String(t.picks.slice(0,i+1).filter(Boolean).length)})})}
function skipEmpty(){const t=U.tgt;while(t&&t.i<t.slots.length&&!t.slots[t.i].cands.filter(u=>!(t.slots[t.i].distinct&&t.picks.includes(u))).length){t.picks.push(null);t.i++}
  if(t&&t.i>=t.slots.length){const a=Object.assign({},t.a,{targets:t.picks});U.tgt=null;send(a)}}
function pickTarget(u){const t=U.tgt;if(!t)return;const sl=t.slots[t.i];if(!sl.cands.includes(u)){
    /* say what was tapped, so a report pins down the miss (Trials fix queue item 1, Nov 22) */
    const s0=view();const f=s0&&u&&E.find(s0,u);const o=f&&f.o;const nm=o&&o.name;
    toast(o&&o.spawn&&s0.trials&&!E.trialsTargetOk(s0,U.me,o)?`Deal with your own ${nm} first.`:nm?`${nm} isn't a legal target for this.`:"That isn't a legal target.");return}
  if(sl.distinct&&t.picks.includes(u)){toast("Choose a different target.");return}
  t.picks.push(u);t.i++;if(t.i<t.slots.length){skipEmpty();render();return}
  const a=Object.assign({},t.a,{targets:t.picks});U.tgt=null;send(a)}
/* Band attack: choose who joins (all ready units with Banding are listed; "Select all summons" shortcut), then the target */
function pickBand(a){const s=view();const all=E.bandMembers(s,U.me);U.bandSel=all.map(o=>o.uid);
  const draw=()=>{const s2=view();const sel=all.filter(o=>U.bandSel.includes(o.uid));const lead=E.find(s2,a.att);
    const mem=sel.filter(o=>o.uid!==a.att);const tot=lead?E.bandTotal(s2,lead.o,mem):0;
    modal(`<h2>Band attack</h2><p>Choose who joins. Their STR is added together for one attack (the target's DEF still applies), then every attacker is exhausted.</p>
    <div class="band-list">${all.map(o=>{const on=U.bandSel.includes(o.uid);const isLead=o.uid===a.att;return`<button class="btn band-pick${on?" primary":""}" data-pa="band-t" data-u="${o.uid}" ${isLead?"disabled":""}><b>${esc(o.name)}</b> · ${E.dmgStr(s2,o)} STR${o.kind==="summon"?" (summon)":""}${isLead?" · leads":""}</button>`}).join("")}</div>
    <div class="actions"><button class="btn sm" data-pa="band-sums">Select all summons</button><button class="btn sm" data-pa="band-all">Select all</button><button class="btn sm" data-pa="band-none">Only the leader</button></div>
    <p class="band-total">Total: <b>${tot}</b> STR${mem.length?` (${sel.length} attackers)`:" (no one else joins — a normal attack)"}</p>
    <div class="actions"><button class="btn primary go" data-pa="band-ok">Choose target</button><button class="btn" data-pa="close">Cancel</button></div>`)};
  U.bandCtx={a,all,draw};draw()}
function pickModes(a,d,sc){const n=sc.modes.n;U.modeSel=[];
  const draw=()=>modal(`<h2>${esc(d.name)}</h2><p>${n>1?`Choose ${n}:`:"Choose one:"}</p><div class="actions" style="flex-direction:column;align-items:stretch">${sc.modes.opts.map((m,i)=>`<button class="btn${U.modeSel.includes(i)?" primary":""}" data-pa="mode" data-i="${i}">${esc(m.label)}</button>`).join("")}</div>
    <div class="actions"><button class="btn primary go" data-pa="mode-ok" ${U.modeSel.length!==Math.min(n,sc.modes.opts.length)?"disabled":""}>Continue</button><button class="btn" data-pa="close">Cancel</button></div>`);
  U.modeCtx={a,d,sc,draw};draw()}
function pickX(a,d,sc){const s=view();const pl=s.p[U.me];const actor=E.actorFor(s,U.me);
  const max=d.cost==="X"?(a.type==="fixPlay"?10:Math.max(0,pl.aura-E.cardCost(s,U.me,actor,d,0))):(sc.x.max?Math.max(0,sc.x.max(s,U.me,actor)):6);
  modal(`<h2>${esc(d.name)}</h2><label class="field col">${d.cost==="X"?"Choose X (Aura to spend)":esc(sc.x.label)}<input type="number" id="pl-x" min="0" max="${max}" value="${max}"></label><p class="pl-note">Maximum ${max}.</p>
  <div class="actions"><button class="btn primary go" data-pa="x-ok">Continue</button><button class="btn" data-pa="close">Cancel</button></div>`);
  U.xCtx={a,max}}

/* ---------- events ---------- */
document.addEventListener("click",e=>{const b=e.target.closest("[data-pa]");if(!b)return;if(!b.closest("#play-root")&&!b.closest("#pl-modal")&&!b.closest("#pl-modtab")&&!b.closest("#pl-dock"))return;
  let k=b.dataset.pa;const s=view();
  if(k==="town-hide"){U.townHide=true;render();return}if(k==="town-show"){U.townHide=false;render();return}
  if(k==="stat"&&(U.tgt||(s&&s.pend[0]&&s.pend[0].type==="manual"&&s.pend[0].pid===U.me))){k="obj"}
  else if(k==="stat"){e.stopPropagation();const u=b.dataset.u,f=b.dataset.f;U.statPop=U.statPop&&U.statPop.u===u&&U.statPop.f===f?null:{u,f};render();return}
  if(U.statPop&&k!=="stat"){U.statPop=null;document.querySelectorAll("#play-root .ph-pop").forEach(x=>x.remove());document.querySelectorAll("#play-root .ph-num.on").forEach(x=>x.classList.remove("on"))}
  if(k==="t-party"||k==="t-helpers"||k==="t-h"||k==="t-watch"||k==="t-trial"||k==="t-loot")return;
  if(k==="keep-loot"){const s2=U.s;if(!s2||!s2.trials||!U.lootPick)return;const rev=CQT.lootReveal(s2);const err=CQT.checkLoot(rev,U.lootPick.p,s2.trials.parties);if(err){toast(err);return}
    const loot={};Object.keys(U.lootPick.p).forEach(p=>{loot[p]=U.lootPick.p[p]});store2.set("cq.trials.run",{trial:s2.trials.trial,loot});U.lootPick.kept=true;toast("Loot kept. It starts in each party's opening hand next Trial.");render();return}
  if(k==="ltab"){e.preventDefault();U.lobby.tab=b.dataset.t;render();return}
  if(k==="start-trial"){startTrial();return}
  if(k==="trial-again"){U.s=null;startTrial(true);return}
  if(k==="trules"){location.hash="trials-rules";return}
  if(k==="resume-trial"){const r=store2.get(TKEY,null);if(r&&r.s){U.gameKey="g"+Date.now();U.s=r.s;U.me=r.me||0;U.meta=null;U.trialsWatch=!!r.watch;U.lastTrial=r.last||null;U.vsAI=true;U.net=null;U.mode="game";U.evFor=null;render();pumpAI()}return}
  if(k==="drop-trial"){store2.del(TKEY);render();return}
  if(k==="bo"||k==="deck"||k==="ai"||k==="code"||k==="name"||k==="man-op"||k==="man-n"||k==="man-k"||k==="man-name"||k==="man-card")return;
  if(k==="close"){closeModal();return}
  if(k==="hscr"){const he=b.parentElement&&b.parentElement.querySelector(".pl-hand");if(he)he.scrollBy({left:(+b.dataset.d)*Math.max(200,he.clientWidth*0.8),behavior:"smooth"});return}
  if(k==="snd"){SND.toggle();render();return}
  if(k==="mus"){MUS.toggle();render();return}
  if(k==="start-ai"){startAI();return}
  if(k==="m-side"){sbOpen();return}
  if(k==="rematch"){U.s=null;U.tut=null;if(U.lastTrial){startTrialWith(U.lastTrial,false);return}startAI();return}
  if(k==="over-hide"){U.overHide=true;render();return}
  if(k==="over-show"){U.overHide=false;render();return}
  if(k==="host"){hostRoom();return}
  if(k==="challenge"){sendChallenge(b.dataset.k,b.dataset.n);return}
  if(k==="ch-accept"){acceptChallenge();return}
  if(k==="ch-decline"){declineChallenge();return}
  if(k==="join"){joinRoom(U.lobby.code);return}
  if(k==="leave"){leaveGame();return}
  if(k==="abwhy"){toast(b.dataset.w);return}
  if(k==="concede-ask"){if(!U.s||U.s.over)return;modal(`<h2>Concede?</h2><p>Are you sure you want to concede? The game ends and your opponent wins.</p><div class="actions"><button class="btn primary danger" data-pa="concede-yes">Concede</button><button class="btn" data-pa="close">Cancel</button></div>`);return}
  if(k==="concede-yes"){closeModal();if(U.s&&!U.s.over)send({type:"concede"});return}
  if(k==="man-cancel"){modal(`<h2>Cancel?</h2><p>Undo ${esc((U.s&&U.s.undo&&U.s.undo.what)||"this")}? Everything goes back to how it was before it was played.</p><div class="actions"><button class="btn primary danger" data-pa="man-cancel-yes">Undo it</button><button class="btn" data-pa="close">Keep resolving</button></div>`);return}
  if(k==="man-cancel-yes"){closeModal();U.man=null;U.manT=null;send({type:"manCancel"});return}
  if(k==="log-toggle"){U.logHidden=!U.logHidden;try{localStorage.setItem("cq.play.log",U.logHidden?"hide":"show")}catch(e){}render();return}
  if(k==="leave-ask"){if(s&&s.over){leaveGame();return}modal(`<h2>Leave this game?</h2><p>${U.vsAI?"Your game is saved in this browser; you can resume it from the Play tab.":U.net&&U.net.role==="host"?"The room closes for your opponent. You can reopen it from the Play tab.":"You can rejoin with the same code while the host keeps the room open."}</p><div class="actions"><button class="btn primary" data-pa="leave-soft">Leave</button><button class="btn" data-pa="close">Stay</button></div>`);return}
  if(k==="leave-soft"){U.gameKey=null;closeModal();clearTimeout(U.aiT);if(U.net&&U.net.ch){try{sb().removeChannel(U.net.ch)}catch(err){}}U.net=null;U.s=null;U.vsAI=false;U.mode="lobby";render();return}
  if(k==="resume-local"){const r=store2.get("cq.play.local",null);if(r){U.gameKey="g"+Date.now();U.s=r.s;U.me=r.me||0;U.meta=r.meta||null;U.match=r.match||null;if(U.meta)U.meta.lt=0;U.vsAI=true;U.net=null;U.mode="game";render();pumpAI()}return}
  if(k==="drop-local"){store2.del("cq.play.local");render();return}
  if(k==="resume-host"){const r=store2.get("cq.play.host",null);if(r)hostRoom(r);return}
  if(k==="drop-host"){store2.del("cq.play.host");render();return}
  if(k==="resume-guest"){const r=store2.get("cq.play.guest",null);if(r)joinRoom(r.code,true);return}
  if(k==="drop-guest"){store2.del("cq.play.guest");render();return}
  if(k==="rules"){location.hash="rules";return}
  if(k==="export-log"){exportLog();return}
  /* Nov 16: computers keep Menu and Full screen in the game log tray at the bottom right */
  if(k==="menu"){const m=document.getElementById("pl-menutab");if(m){m.click();b.setAttribute("aria-expanded",String(document.documentElement.classList.contains("pl-menu")))}return}
  if(k==="fs"){if(window.CQTablet)CQTablet.fullscreen();return}
  if(k==="banner-x"){clearTimeout(U.banT);U.banner=null;render();return}
  if(k==="eqact"){begin({type:"eqAct",uid:b.dataset.u});return}
  if(k==="up-go"){const sel=document.querySelector(`select[data-pa=up-x][data-u="${b.dataset.u}"]`);send({type:"upgrade",uid:b.dataset.u,x:+(sel?sel.value:1)});return}
  if(k==="multi"){const s2=view();const ar=s2.p[U.me].inv.filter(o=>o.kind==="card"&&!o.fd&&(E.DB[o.id]||{}).sub==="Arrow");U.multiSel=[];
    const draw=()=>modal(`<h2>Multi Bow</h2><p>Destroy any number of Arrows in your inventory. The next Arrow you activate deals +3 damage for each one. This doesn't use an action.</p><div class="band-list">${ar.map(o=>`<button class="btn band-pick${U.multiSel.includes(o.uid)?" primary":""}" data-pa="multi-t" data-u="${o.uid}"><b>${esc(o.name)}</b></button>`).join("")}</div><p class="band-total">Next Arrow: <b>+${3*U.multiSel.length}</b> damage</p><div class="actions"><button class="btn primary go" data-pa="multi-ok" ${U.multiSel.length?"":"disabled"}>Destroy ${U.multiSel.length}</button><button class="btn" data-pa="close">Cancel</button></div>`);
    U.multiDraw=draw;draw();return}
  if(k==="multi-t"){const u=b.dataset.u;U.multiSel=U.multiSel.includes(u)?U.multiSel.filter(x=>x!==u):U.multiSel.concat([u]);U.multiDraw();return}
  if(k==="multi-ok"){closeModal();send({type:"multiBow",n:U.multiSel.length,uids:U.multiSel});return}
  /* Nov 23: Watch / Stop watching work from the lobby, where there is no game state yet */
  if(k==="spec"){spectate(b.dataset.g);return}
  if(k==="rp"){const d=b.dataset.d,R=U.spec&&U.spec.replay;if(!R)return;if(d==="first")replayGo(0);else if(d==="last")replayGo(R.acts.length);else if(d==="prev")replayGo(R.i-1);else if(d==="next")replayGo(R.i+1);else if(d==="rnext")replayRound(1);else if(d==="rprev")replayRound(-1);return}
  if(k==="spec-leave"){leaveSpec();U.s=null;U.mode="lobby";U.overHide=false;closeModal();render();return}
  if(!s)return;
  if(k==="amt"){const A=U.askAmt;if(!A)return;const d=b.dataset.d;A.val=d==="all"?A.max:Math.max(A.min,Math.min(A.max,A.val+(+d)));const el=document.getElementById("ask-amt-v");if(el)el.textContent=A.val;return}
  if(k==="do"){let a;try{a=JSON.parse(b.dataset.a)}catch(err){return}{const mk=document.getElementById("pl-modal");if(a.type==="ask"&&U.askAmt&&mk&&mk.dataset.k===U.askAmt.key){a.amt=U.askAmt.val;U.askAmt=null}}closeModal();
    if(a.type==="fix"||a.type==="manDone"||a.type==="decline"){U.man=null;U.manT=null}
    begin(a);return}
  if(k==="modal-min"){const s2=view();const pr2=s2&&s2.pend[0];if(pr2)U.modalMin=pr2.type+":"+s2.seq;closeModal();render();return}
  if(k==="modal-max"){U.modalMin=null;render();return}
  if(k==="echo-mv"){send({type:"echoOrder",i:+b.dataset.i,d:+b.dataset.d});return}
  if(k==="cancel"){U.tgt=null;render();return}
  if(k==="skip"){const t=U.tgt;if(!t)return;t.picks.push(null);t.i++;if(t.i>=t.slots.length){const a=Object.assign({},t.a,{targets:t.picks});U.tgt=null;send(a)}else{skipEmpty();render()}return}
  if(k==="pick"){pickTarget(b.dataset.u);return}
  if(k==="obj"){const u=b.dataset.u;if(U.tgt){pickTarget(u);return}
    if(s.pend[0]&&s.pend[0].type==="manual"&&s.pend[0].pid===U.me){U.manT=U.manT===u?null:u;render();return}
    inspectObj(u);return}
  if(k==="hand"){const c=s.p[U.me].hand.find(x=>x.uid===b.dataset.u);if(!c)return;if(U.tgt){toast("Finish choosing targets first, or press Cancel.");return}
    const ok=legal().some(o=>o.type==="play"&&s.p[U.me].hand.find(x=>x.uid===o.uid&&x.id===c.id));const d=E.DB[c.id];
    const why=ok?"":whyNot(s,c);
    modal(`${cardHTML(cardOf(c.id),{nozoom:1})}<p class="pl-note">${E.isScripted(d.name)||d.kind==="equip"?"Resolves automatically.":"Resolves by hand: after you pay, a panel opens to apply the effect."}</p>${why?`<p class="note warn">${esc(why)}</p>`:""}
      <div class="actions">${(()=>{const ho=legal().find(o=>o.type==="use"&&o.fromHand&&o.uid===c.uid);return ho?btn(ho,`Activate from hand (${E.handArrowCost(s,U.me,E.actorFor(s,U.me),c)} Aura)`):""})()}${ok?`<button class="btn primary go" data-pa="play" data-u="${c.uid}">Play${d.sup==="Hidden"?" face down":d.type==="Item"?" to inventory":""} (${E.cardCost(s,U.me,E.actorFor(s,U.me),d,0)}${d.cost==="X"?"+X":""} Aura)</button>`:""}<button class="btn" data-pa="close">Close</button></div>`);return}
  if(k==="exhcard"){const c=s.p[U.me].disc.find(x=>x.uid===b.dataset.u);if(!c)return;if(U.tgt){toast("Finish choosing targets first, or press Cancel.");return}
    const o=legal().find(x=>x.type==="play"&&s.p[U.me].disc.some(y=>y.uid===x.uid&&y.id===c.id));const d=E.DB[c.id];const why=o?"":(exhumeOk(s,U.me,c)?(whyNot(s,c)||"You can't play it right now."):"Its Exhume window has closed.");
    modal(`${cardHTML(cardOf(c.id),{nozoom:1})}<p class="pl-note">Exhume: this card was milled this turn, so you can play it from your discard pile, paying its costs.</p>${why?`<p class="note warn">${esc(why)}</p>`:""}
      <div class="actions">${o?`<button class="btn primary go" data-pa="play" data-u="${o.uid}">Play from discard pile (${E.cardCost(s,U.me,E.actorFor(s,U.me),d,0)}${d.cost==="X"?"+X":""} Aura)</button>`:""}<button class="btn" data-pa="disc" data-p="${U.me}">Back to discard pile</button><button class="btn" data-pa="close">Close</button></div>`);return}
  if(k==="play"){closeModal();begin({type:"play",uid:b.dataset.u});return}
  if(k==="disc"||k==="exile"||k==="echo"){showPile(+b.dataset.p,k);return}
  if(k==="soul"){const opts=legal().filter(o=>o.type==="soul"&&(!b.dataset.h||o.hero===b.dataset.h));const heroes=[...new Set(opts.map(o=>o.hero))];
    /* Update 42: three choices, drawn as image buttons on the starfield background */
    const SIMG={1:["soul-aura","+2 Aura: your party gains 2 Aura"],2:["soul-str","+2 STR: target ally gains +2 Strength this turn"],5:["soul-def","+2 DEF: target ally gains +2 Defense this turn"]};
    const ib=o=>{const im=SIMG[o.ch];return im?`<button type="button" class="soul-opt" data-pa="do" data-a='${esc(JSON.stringify(o))}' title="${esc(im[1])}" aria-label="${esc(im[1])}"><img src="assets/art/ui/${im[0]}.webp" alt="${esc(im[1])}" draggable="false"></button>`:btn(o,E.SOULS[o.ch])};
    modal(`<h2>Surrender a soul</h2><p class="soul-note">A surrendered Hero can never be revived. Uses your priority; no Hero is exhausted.</p>${heroes.map(h=>`${heroes.length>1?`<h3>${esc(nameOf(h))}</h3>`:`<p class="soul-who">${esc(nameOf(h))}</p>`}<div class="soul-opts">${opts.filter(o=>o.hero===h).map(ib).join("")}</div>`).join("")}<div class="actions"><button class="btn" data-pa="close">Cancel</button></div>`,{cls:"soul-box"});return}
  if(k==="mode"){const i=+b.dataset.i;const c=U.modeCtx;const n=Math.min(c.sc.modes.n,c.sc.modes.opts.length);if(U.modeSel.includes(i))U.modeSel=U.modeSel.filter(x=>x!==i);else{if(n===1)U.modeSel=[i];else if(U.modeSel.length<n)U.modeSel.push(i)}c.draw();return}
  if(k==="band-t"){const u=b.dataset.u;U.bandSel=U.bandSel.includes(u)?U.bandSel.filter(x=>x!==u):U.bandSel.concat([u]);U.bandCtx.draw();return}
  if(k==="band-sums"){const c=U.bandCtx;U.bandSel=c.all.filter(o=>o.kind==="summon"||o.uid===c.a.att).map(o=>o.uid);c.draw();return}
  if(k==="band-all"){const c=U.bandCtx;U.bandSel=c.all.map(o=>o.uid);c.draw();return}
  if(k==="band-none"){const c=U.bandCtx;U.bandSel=[c.a.att];c.draw();return}
  if(k==="band-ok"){const c=U.bandCtx;closeModal();const mem=U.bandSel.filter(u=>u!==c.a.att);begin(Object.assign({},c.a,{members:mem}));return}
  if(k==="mode-ok"){const c=U.modeCtx;closeModal();begin(Object.assign({},c.a,{modes:U.modeSel.slice().sort()}));return}
  if(k==="x-ok"){const c=U.xCtx;const v=Math.max(0,Math.min(c.max,parseInt(document.getElementById("pl-x").value,10)||0));closeModal();begin(Object.assign({},c.a,{x:v}));return}
  if(k==="scry-bot"){const u=b.dataset.u;const sc=U.scry;sc.bottom=sc.bottom.includes(u)?sc.bottom.filter(x=>x!==u):sc.bottom.concat([u]);redrawPrompt();return}
  if(k==="scry-up"){const u=b.dataset.u;const o=U.scry.order;const i=o.indexOf(u);if(i>0){o.splice(i,1);o.splice(i-1,0,u)}redrawPrompt();return}
  if(k==="scry-done"){const sc=U.scry;closeModal();U.scry=null;send({type:"scry",order:sc.order.filter(u=>!sc.bottom.includes(u)),bottom:sc.bottom});return}
  if(k==="pick-card"){const pr=s.pend[0];const u=b.dataset.u;const pk=U.pick;if(pk.on.includes(u))pk.on=pk.on.filter(x=>x!==u);else{if(pk.on.length>=pr.max)pk.on.shift();pk.on.push(u)}redrawPrompt();return}
  if(k==="choose-done"){const pk=U.pick;closeModal();U.pick=null;send({type:"choose",picks:pk.on});return}
  if(k==="combo-play"){closeModal();begin({type:"comboPlay",uid:b.dataset.u});return}
  if(k==="man-apply"){const m=U.man;const map={unstatus:["status",1],nstr:["str",1],ndef:["def",1],naura:["aura",1],ready:["exhaust",1],delevel:["level",1],exileobj:["destroy",1]};
    const [op,neg]=map[m.op]||[m.op,0];const sel=document.querySelector("[data-pa=man-card]");
    const a={type:"man",op,neg:!!neg,n:m.n,k:m.k,name:m.name,target:U.manT||null,card:sel?sel.value:null};
    if(op==="reveal"&&!a.card){toast("No Hidden card to reveal.");return}
    if(op==="discToInv"&&!a.card){toast("Your discard pile is empty.");return}
    if(op==="playfree"){if(!a.card){toast("No card in hand to play.");return}const fh=E.fixHero(s,U.me,{hero:U.manT});begin({type:"fixPlay",uid:a.card,hero:fh?fh.uid:null});return}
    if((op==="equipfree"||op==="revmove")&&!a.card){toast(op==="equipfree"?"No Equipment to equip.":"Nothing revealed to move.");return}
    if(op==="revmove"&&!["top","bottom","hand","discard"].includes(a.k))a.k="top";
    if(!["draw","aura","gold","summon","pillar","dagger","doll","discard","fromDisc","discToInv","reveal","mill","revealtop","revmove","endAction"].includes(op)&&!a.target){toast("Click a Hero on the board first.");return}
    send(a);return}
});
document.addEventListener("toggle",e=>{const t=e.target;if(t&&t.classList&&t.classList.contains("pl-help"))U.helpOpen=t.open},true);
function redrawPrompt(){const m=document.getElementById("pl-modal");if(m)delete m.dataset.k;const s=view();if(m)m.remove();modals(s)}
document.addEventListener("change",e=>{const t=e.target;const k=t.dataset&&t.dataset.pa;if(!k)return;
  if(k==="bo"){U.lobby.bo=+t.value===3?3:1;try{localStorage.setItem("cq.play.bo",String(U.lobby.bo))}catch(e){}render()}
  else if(k==="deck"){U.lobby.deck=t.value}else if(k==="ai"){U.lobby.ai=t.value;U.lobby.aiPicked=true}
  else if(k==="t-loot"){if(U.lootPick){U.lootPick.p[t.dataset.p]=t.value||undefined;if(!t.value)delete U.lootPick.p[t.dataset.p];render()}}
  else if(k==="t-party"){U.lobby.t.party=t.value}else if(k==="t-helpers"){U.lobby.t.helpers=+t.value||1;render()}else if(k==="t-h"){U.lobby.t.h[+t.dataset.i]=t.value}else if(k==="t-watch"){U.lobby.t.watch=t.checked}
  else if(k==="man-op"){U.man.op=t.value;if(t.value==="move")U.man.n=0;render()}else if(k==="man-k"){U.man.k=t.value}else if(k==="man-name"){U.man.name=t.value}});
document.addEventListener("input",e=>{const t=e.target;const k=t.dataset&&t.dataset.pa;if(!k)return;
  if(k==="code")U.lobby.code=t.value.toUpperCase();else if(k==="name")store2.set("cq.play.name",t.value.slice(0,24));else if(k==="man-n"&&U.man)U.man.n=parseInt(t.value,10)||0});
function whyNot(s,c){const d=E.DB[c.id];const a=E.actorFor(s,U.me);
  if(s.phase!=="battle")return"Cards are played during the Battle Phase.";if(s.prio!==U.me||s.pend.length)return"Wait for your priority.";
  if(!a)return"None of your Heroes are ready.";if(a.st.stun)return`${a.name} is Stunned and can't play cards.`;if(a.name==="Dum Dum")return"Dum Dum can't play cards.";
  if(d.cls!=="Generic"&&!E.heroIs(a,d.cls))return`${a.name} is acting now and isn't a ${d.cls}. Only the Hero in the marked position (or its stand-in) acts.`;
  const cost=E.cardCost(s,U.me,a,d,0);if(cost>s.p[U.me].aura)return`Costs ${cost} Aura; you have ${s.p[U.me].aura}.`;
  if((d.type==="Item"||d.sup==="Hidden")&&s.p[U.me].inv.length>=E.slots(s,U.me))return"Your inventory is full. Clear a slot first.";
  if(d.kind==="equip")return`${a.name} can't equip this right now (class or requirement).`;
  {const m=/As an additional cost to play this card, ([^.\n]+)/i.exec(d.rules||"");if(m)return`You can't pay its additional cost right now (${m[1]}).`}
  return"Its condition isn't met right now."}

document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches('#play-root [role=button][data-pa],#pl-modal [role=button][data-pa]')){e.preventDefault();e.target.click()}});
/* ---------- mount ---------- */
U._send=a=>send(a);U._begin=a=>begin(a);
U.mount=function(el){el.innerHTML='<div id="play-root"></div>';render();if(U.vsAI)pumpAI()};
})();
