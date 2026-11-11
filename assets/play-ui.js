/* Crystal Quest Play tab: board UI, vs-AI games, and online rooms over Supabase Realtime.
   Online play is host-authoritative: the host's browser runs the rules engine and sends each player
   a redacted copy of the state (no peeking at the other hand or library). */
"use strict";
(function(){
const E=window.CQE,AI=window.CQAI;
const AS=()=>typeof S!=="undefined"?S:null;
const SCR=()=>window.CQ_SCRIPTS||{};
const U={mode:"lobby",s:null,me:0,vsAI:false,net:null,tgt:null,man:null,manT:null,aiT:null,logOpen:false,lobby:{deck:"",ai:"starter:1",tab:"ai",code:""},busy:false,lastErr:""};
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
html[data-skin="art"] .pl-over-box{background:linear-gradient(#2b1f15,#1b130c);color:#f3e6cf;border:2px solid #b8743a}
html[data-skin="art"] .pl-over-box h2{font-family:"Pirata One",var(--display);color:#ffc100;font-weight:400}
html[data-skin="art"] .pl-over-why{color:#d8c3a0}
@media (prefers-reduced-motion:reduce){.pl-over{animation:none}}
#play-root{--hero-w:minmax(0,1fr)}
.pl-lobby{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-top:18px}
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
.pl-acts .btn.pl-concede,.btn[data-pa=concede-yes]{background:#C0392B;border-color:#C0392B;color:#fff;font-weight:700}
.pl-acts .btn.pl-concede:hover,.btn[data-pa=concede-yes]:hover{filter:brightness(1.1)}
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
.pick-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
.pick-list .pk{border:0;background:none;padding:0;text-align:left;position:relative}
.pick-list .pk.on .card{outline:3px solid var(--ok);outline-offset:-1px}
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
/* Rules fix stacked above Concede at the right */
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
function injectCSS(){if(document.getElementById("pl-css"))return;const st=document.createElement("style");st.id="pl-css";st.textContent=CSS;document.head.appendChild(st)}

/* ---------- decks ---------- */
const STARTERS=[
  {name:"Ember & Steel (starter)",heroes:["Ember Mage","Divine Knight","Arnett Lifebinder"]},
  {name:"Wild Hunt (starter)",heroes:["Warden of the Woods","Hawkeye","Bloodhowl"]},
  {name:"Shadow Pact (starter)",heroes:["Dark Fang","Dark Channeler","Sage Monk"]},
  {name:"Grand Stage (starter)",heroes:["Songweaver","Storm Caller","Sun Paladin"]},
  {name:"Iron Vanguard (starter)",heroes:["Rage Brute","Radiant Sentinel","Dawn Priest"]}];
const STARTER_LISTS=[
 {"Flame Jab":3,"Lightning Bolt":3,"Volt Jab":3,"Flame Lance":3,"Ice Jab":3,"Arcane Study":3,"Power Thrust":3,"Conscript":3,"Protect":3,"Knight's Sword":2,"Bronze Chest Plate":2,"Shield Bash":3,"Healing Touch":3,"Light Helix":3,"Inspiration":3,"Potion":3,"Healing Beam":2,"Ice Lance":2},
 {"Beast":3,"Wolves":3,"Elk":3,"Tooth":3,"Serrated Arrow":3,"Flame Bolt":3,"Poison Dart":2,"Dual Shot":3,"Full Draw":2,"Longbow":2,"Spike Pit":3,"Pump":3,"Great Axe":2,"Bloodthirst":3,"Battered":3,"Potion":3,"Sword of Riverstead":3,"Heavy Beast":2,"Blunt Force":1},
 {"Armed":3,"Toxic Cloud":3,"Surprise Attack":3,"Long Dagger":2,"Thief's Dagger":2,"Envenom":2,"Dark Jab":3,"Dark Lance":3,"Ritual of Pain":3,"Siphon Life":3,"Weaken":3,"Jab":3,"Roundhouse":3,"Lunge":3,"Flurry of Blows":3,"Inspiration":2,"Potion":3,"Mark of Doom":2,"Finisher":1},
 {"\"Ballad of Blades\"":3,"Embolden":3,"\"Rousing Chorus\"":3,"\"Song of Healing\"":3,"Strong Stance":3,"War Lute":2,"Flame Jab":3,"Ice Lance":3,"Lightning Bolt":3,"Boost Ritual":3,"Power Thrust":3,"Tower Shield":2,"Conscript":3,"Radiant Strike":3,"Potion":3,"Sword of Riverstead":3,"Shield Bash":2,"Volt Jab":2},
 {"Pump":3,"Blunt Force":3,"Great Axe":2,"Bloodthirst":3,"Battered":3,"Unstoppable":3,"Blockade":3,"Bronze Chest Plate":2,"Tower Shield":2,"Power Thrust":3,"Rally the Troops":2,"Healing Beam":3,"Mace of Dawn":2,"Light Blast":3,"Healing Touch":3,"Long Sword":2,"Potion":3,"Inspiration":3,"Pummel":2}];
function starterDeck(i){const st=STARTERS[i];return{id:"starter:"+i,name:st.name,heroes:st.heroes.map(n=>"h:"+n),cards:Object.assign({},STARTER_LISTS[i])}}
U.starterDeck=starterDeck;
function deckChoices(){const out=[];
  const mine=(AS()&&S.decks)||[];mine.forEach(d=>{const bad=E.validateDeck(d);out.push({id:d.id,name:d.name+(bad.length?" (not legal: "+bad[0]+")":""),ok:!bad.length,deck:d})});
  if(AS()&&S.deck&&S.deck.heroes.length===3&&!mine.some(d=>d.id===S.deck.id)){const bad=E.validateDeck(S.deck);out.push({id:"draft",name:"Current draft: "+(S.deck.name||"Untitled")+(bad.length?" (not legal)":""),ok:!bad.length,deck:S.deck})}
  STARTERS.forEach((st,i)=>out.push({id:"starter:"+i,name:st.name,ok:true,deck:starterDeck(i)}));
  return out}
function deckById(id){const c=deckChoices().find(d=>d.id===id);return c&&c.ok?c.deck:null}

/* ---------- persistence ---------- */
function saveLocal(){if(U.vsAI&&U.s)store2.set("cq.play.local",{s:U.s,me:U.me,meta:U.meta||null});if(U.net&&U.net.role==="host"&&U.s)store2.set("cq.play.host",{code:U.net.code,s:U.s,guest:U.net.guest||null,meta:U.meta||null});}
/* ---------- win tracking for Best Decks ---------- */
const newGid=()=>"g"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
function deckMeta(d){return{name:(d.name||"Untitled deck").replace(/ \(starter\)$/,"").slice(0,80),heroes:d.heroes.slice(0,3),cards:Object.assign({},d.cards)}}
async function deckKey(d){const txt=d.heroes.slice().sort().join("|")+"#"+Object.entries(d.cards).filter(([,q])=>q>0).sort((a,b)=>a[0]<b[0]?-1:1).map(([k,q])=>k+":"+q).join("|");
  const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(txt));return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,32)}
async function maybeRecord(){const s=U.s,m=U.meta;if(!s||!s.over||!m||!m.gid||m.recorded)return;
  const done=store2.get("cq.play.recorded",[]);if(done.includes(m.gid)){m.recorded=true;return}
  const c=sb();if(!c)return;m.recorded=true;saveLocal();
  const sides=m.mode==="ai"?[0]:[0,1];const rows=[];
  for(const side of sides){const d=m.decks[side];if(!d||E.validateDeck(d).length)continue;
    /* online: the guest's row is saved without an account; the guest's own browser claims it (claim_result) so it counts on their profile */
    rows.push({...(m.mode==="online"&&side===1?{user_id:null}:{}),game_id:m.gid,side,deck_key:await deckKey(d),deck_name:d.name,heroes:d.heroes,cards:d.cards,player_name:(s.p[side].name||"Guest").slice(0,40),mode:m.mode,result:s.winner<0?"draw":(s.winner===side?"win":"loss"),rounds:s.round,stats:recStats(s,side),
      started_at:m.t0?new Date(m.t0).toISOString():null,ended_at:new Date().toISOString(),active_secs:m.t0?Math.min(172800,Math.round((m.act||0)/1000)):null})}
  if(!rows.length)return;
  let{error}=await c.from("deck_results").insert(rows);
  /* the stats column may not exist yet: save the result without it */
  /* the time columns (Admin update) may not exist yet: save without them */
  if(error&&/started_at|ended_at|active_secs/i.test(error.message)){({error}=await c.from("deck_results").insert(rows.map(r=>{const x=Object.assign({},r);delete x.started_at;delete x.ended_at;delete x.active_secs;return x})))}
  if(error&&/stats/i.test(error.message)){({error}=await c.from("deck_results").insert(rows.map(r=>{const x=Object.assign({},r);delete x.stats;delete x.started_at;delete x.ended_at;delete x.active_secs;return x})))}
  if(error&&!/duplicate/i.test(error.message)){m.recorded=false;saveLocal();console.warn("Couldn't save the result:",error.message);return}
  store2.set("cq.play.recorded",done.concat([m.gid]).slice(-300));toast("Result recorded for Best Decks.")}
function recStats(s,side){try{const g=E.gameStats(s);const sd=g.sides[side],od=g.sides[E.opp(side)];
  const o={v:1,rounds:g.rounds,lineup:{start:sd.start,final:sd.final},opp:{start:od.start,final:od.final},dmg:sd.dmg,prev:sd.prev,healer:sd.healer,tot:{dmg:sd.totDmg,prev:sd.totPrev,heal:sd.totHeal},end:s.conceded!=null?"concede":(s.deckedOut!=null?"deckout":(s.winner<0?"draw":"party"))};
  return JSON.stringify(o).length<5500?o:null}catch(e){return null}}
function myName(){return(AS()&&S.me&&S.me.name)||store2.get("cq.play.name","")||"Player"}

/* ---------- game control ---------- */
function startAI(){const dm=deckById(U.lobby.deck),da=deckById(U.lobby.ai);if(!dm){toast("Choose a legal deck (3 Heroes, at least 50 cards) for yourself.");return}
  if(!da){toast("Choose a deck for the AI.");return}
  U.s=E.newGame({seed:(Math.random()*2**31)|0,players:[{name:myName(),deck:dm},{name:"AI · "+da.name.replace(/ \(starter\)/,""),deck:da,ai:true}]});
  U.meta={gid:newGid(),mode:"ai",t0:Date.now(),lt:Date.now(),act:0,decks:[deckMeta(dm),deckMeta(da)]};
  U.gameKey="g"+Date.now();U.me=0;U.vsAI=true;U.net=null;U.mode="game";U.tgt=null;U.man=null;saveLocal();render();pumpAI()}
function view(){return U.s}
function send(a){
  if(U.net&&U.net.role==="guest"){U.net.ch.send({type:"broadcast",event:"act",payload:{a,cid}});U.busy=true;U.tgt=null;render();return}
  const r=E.act(U.s,U.me,a);if(!r.ok){toast(r.err||"Not legal.");render();return}
  U.tgt=null;afterChange()}
/* active play time (Admin page): each gap between actions counts up to 3 minutes, so time away or paused is left out */
const IDLE_CAP=180000;
function tickTime(){const m=U.meta;if(!m||m.recorded)return;const now=Date.now();if(m.lt)m.act=(m.act||0)+Math.min(Math.max(0,now-m.lt),IDLE_CAP);m.lt=now}
function afterChange(){tickTime();saveLocal();if(U.net&&U.net.role==="host")broadcast();render();pumpAI();if(U.s&&U.s.over&&(U.vsAI||(U.net&&U.net.role==="host")))maybeRecord()}
function pumpAI(){clearTimeout(U.aiT);if(!U.vsAI||!U.s||U.s.over)return;
  const a=AI.choose(U.s,1);if(!a)return;
  U.aiT=setTimeout(()=>{const a2=AI.choose(U.s,1);if(!a2)return;const r=E.act(U.s,1,a2);if(!r.ok){const f=E.options(U.s,1).find(o=>["pass","decline","dawnDone","leave","keep","manDone"].includes(o.type));if(f)E.act(U.s,1,f)}afterChange()},U.fast?0:(U.s.phase==="battle"&&!U.s.pend.length?650:350))}

/* ---------- online (Supabase Realtime) ---------- */
function sb(){return typeof SB!=="undefined"?SB:null}
function newCode(){const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<5;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
function openChannel(code,role,onReady){const c=sb();if(!c){toast("Online play needs the site's account service.");return null}
  const ch=c.channel("cq-play-"+code,{config:{broadcast:{self:false},presence:{key:cid}}});
  ch.on("broadcast",{event:"act"},({payload})=>{if(U.net&&U.net.role==="host")onGuestAct(payload)});
  ch.on("broadcast",{event:"hello"},({payload})=>{if(U.net&&U.net.role==="host")onHello(payload)});
  ch.on("broadcast",{event:"state"},({payload})=>{if(U.net&&U.net.role==="guest"&&payload.to===cid){U.s=payload.s;U.me=payload.me;U.busy=false;U.mode="game";if(payload.err)toast(payload.err);if(payload.gid&&U.s&&U.s.over)claimResult(payload.gid);render()}});
  ch.on("broadcast",{event:"full"},({payload})=>{if(U.net&&U.net.role==="guest"&&payload.to===cid){toast("That room already has two players.");leaveGame()}});
  ch.on("presence",{event:"sync"},()=>{if(!U.net)return;const st=ch.presenceState();U.net.peers=Object.keys(st).filter(k=>k!==cid).length;render()});
  ch.subscribe(async status=>{if(status==="SUBSCRIBED"){await ch.track({name:myName(),role});onReady&&onReady()}else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){toast("Couldn't reach the game server. Check your connection.")}});
  return ch}
function hostRoom(resume){U.gameKey="g"+Date.now();const dm=deckById(U.lobby.deck);if(!resume&&!dm){toast("Choose a legal deck first.");return}
  const code=resume?resume.code:newCode();U.vsAI=false;U.s=resume?resume.s:null;U.me=0;U.meta=resume?resume.meta||null:null;if(U.meta)U.meta.lt=0;
  U.net={role:"host",code,deck:dm,guest:resume?resume.guest:null,peers:0};U.mode=U.s?"game":"room";
  U.net.ch=openChannel(code,"host",()=>{if(U.s)broadcast()});render()}
function joinRoom(code,resume){U.gameKey="g"+Date.now();code=(code||"").trim().toUpperCase();if(!/^[A-Z0-9]{5}$/.test(code)){toast("Room codes are 5 letters/numbers.");return}
  const dm=resume?null:deckById(U.lobby.deck);if(!resume&&!dm){toast("Choose a legal deck first.");return}
  U.vsAI=false;U.s=null;U.me=1;U.net={role:"guest",code,deck:dm,peers:0};U.mode="room";store2.set("cq.play.guest",{code});
  U.net.ch=openChannel(code,"guest",()=>{U.net.ch.send({type:"broadcast",event:"hello",payload:{cid,name:myName(),deck:dm}})});render()}
function onHello(p){
  if(!U.s){if(!p.deck){return}const bad=E.validateDeck(p.deck);if(bad.length){U.net.ch.send({type:"broadcast",event:"state",payload:{to:p.cid,s:null,me:1,err:"Your deck isn't legal: "+bad[0]}});return}
    U.net.guest=p.cid;let gn=(p.name||"Guest").slice(0,24);if(gn===myName())gn+=" 2";U.s=E.newGame({seed:(Math.random()*2**31)|0,players:[{name:myName(),deck:U.net.deck},{name:gn,deck:p.deck}]});U.meta={gid:newGid(),mode:"online",t0:Date.now(),lt:Date.now(),act:0,decks:[deckMeta(U.net.deck),deckMeta(p.deck)]};U.mode="game";toast(`${p.name||"A player"} joined. Good luck!`);afterChange();return}
  if(U.net.guest&&p.cid!==U.net.guest){U.net.ch.send({type:"broadcast",event:"full",payload:{to:p.cid}});return}
  U.net.guest=p.cid;broadcast()}
function onGuestAct(p){if(!U.s||p.cid!==U.net.guest)return;const r=E.act(U.s,1,p.a);saveLocal();broadcast(r.ok?null:r.err);render();if(U.s.over)maybeRecord()}
function broadcast(err){if(!U.net||!U.net.ch||!U.s||!U.net.guest)return;U.net.ch.send({type:"broadcast",event:"state",payload:{to:U.net.guest,s:E.redact(U.s,1),me:1,err:err||null,gid:U.s.over&&U.meta?U.meta.gid:null}})}
/* guest: once the game is over, claim our side of the result the host saved (retries while the host's save lands) */
const claimed=new Set();
async function claimResult(gid){const c=sb(),st=AS();if(!c||!st||!st.uid||!gid||claimed.has(gid))return;claimed.add(gid);
  for(let i=0;i<6;i++){await new Promise(r=>setTimeout(r,i?4000:2500));try{const{data,error}=await c.rpc("claim_result",{gid});if(error)return;if(data>0){toast("Result saved to your profile.");return}}catch(e){return}}}
function leaveGame(){U.gameKey=null;clearTimeout(U.aiT);if(U.net&&U.net.ch){try{sb().removeChannel(U.net.ch)}catch(e){}}
  if(U.net&&U.net.role==="guest")store2.del("cq.play.guest");if(U.net&&U.net.role==="host")store2.del("cq.play.host");
  if(U.vsAI)store2.del("cq.play.local");U.net=null;U.s=null;U.vsAI=false;U.mode="lobby";U.tgt=null;U.man=null;render()}

/* ---------- helpers ---------- */
const nameOf=u=>{const s=view();if(!s||!u)return"?";if(u[0]==="P")return s.p[+u.slice(1)].name;const f=E.find(s,u);return f?f.o.name:"?"};
const cardOf=id=>BYID.get(id)||BYID.get("h:"+id)||BYID.get("t:"+id);
function scriptOfCard(id){const d=E.DB[id];return d?SCR()[d.name]:null}
function autoTag(id){const d=E.DB[id];if(!d)return"";if(d.kind==="equip")return MANUAL_EQ.has(d.name)?'<span class="auto m">PART BY HAND</span>':'<span class="auto">AUTO</span>';
  return E.isScripted(d.name)?'<span class="auto">AUTO</span>':'<span class="auto m">BY HAND</span>'}
const MANUAL_EQ=new Set(["Ritual Athame","Shillelagh","Helm of Aura","Ring of Vocation","Gauntlets of Growth"]);
function legal(){const s=view();if(!s)return[];if(U.net&&U.net.role==="guest"&&U.busy)return[];try{return E.options(s,U.me)}catch(e){return[]}}

/* ---------- rendering ---------- */
function mergeLog(s){if(!s)return;if(U.logFor!==U.gameKey){U.logFor=U.gameKey;U.logAll=new Map()}
  s.log.forEach((l,i)=>{const k=l.n!=null?l.n:("i"+i);if(!U.logAll.has(k))U.logAll.set(k,l)})}
function exportLog(){const s=view();if(!s)return;mergeLog(s);
  const lines=[...U.logAll.values()].sort((a,b)=>(a.n||0)-(b.n||0));
  const pdesc=pl=>`${pl.name}${pl.deckName?` — deck "${pl.deckName}"`:""} — party: ${pl.heroes.map(h=>h.name+" ("+h.cls+")").join(", ")}`;
  const res=s.over?(s.winner<0?"Draw":`${s.p[s.winner].name} won`):`In progress (round ${s.round}, ${phaseLabel(s)})`;
  let out=`Crystal Quest — game log\nExported: ${new Date().toLocaleString()}\nMode: ${U.vsAI?"vs AI":U.net?"online room "+U.net.code:"local"}\nPlayer 1: ${pdesc(s.p[0])}\nPlayer 2: ${pdesc(s.p[1])}\nResult: ${res}\n\n`;
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
  const ctx=()=>{if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){ac=null}}if(ac&&ac.state==="suspended")ac.resume().catch(()=>{});return ac};
  const env=(a,g,t0,att,dec,peak)=>{g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(peak,t0+att);g.gain.exponentialRampToValueAtTime(0.0001,t0+att+dec)};
  function tone(f,t,dur,type,peak,f2){const a=ctx();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type||"sine";const t0=a.currentTime+t;o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+dur);env(a,g,t0,0.01,dur,peak||0.18);o.connect(g).connect(a.destination);o.start(t0);o.stop(t0+dur+0.05)}
  function noise(t,dur,peak,lo,hi){const a=ctx();if(!a)return;const n=Math.floor(a.sampleRate*dur);const b=a.createBuffer(1,n,a.sampleRate);const d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    const src=a.createBufferSource();src.buffer=b;const f=a.createBiquadFilter();f.type="bandpass";const t0=a.currentTime+t;f.frequency.setValueAtTime(lo||800,t0);if(hi)f.frequency.exponentialRampToValueAtTime(hi,t0+dur);f.Q.value=0.8;const g=a.createGain();env(a,g,t0,0.005,dur,peak||0.25);src.connect(f).connect(g).connect(a.destination);src.start(t0);src.stop(t0+dur+0.05)}
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
    tick:t=>{noise(t,0.025,0.22,6000,2500);tone(2400,t,0.03,"square",0.035,1600)},
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
    const src=a.createBufferSource(),g=a.createGain();g.gain.value=0.6;src.buffer=b;src.connect(g).connect(a.destination);src.start(now+(t||0));return true}
  function play(k,t){if(!on())return;if(FILES[k]&&file(k,t))return;if(k==="crumble")k="hit";if(k==="birdsong")k="summon";if(k==="store")k="gold";if(k==="smith")k="equip";if(k==="revive")k="heal";if(k==="curse")k="status";if(!FX[k])return;try{FX[k](t||0)}catch(e){}}
  /* one sound per log line, picked from what happened */
  const RULES=[[/🏆/,"win"],[/ is resurrected| revives |is revived/,"revive"],[/ at the Blacksmith /,"smith"],[/ stays at the Inn| visits the Shop/,"store"],[/ dies\b|has died/,"death"],[/\(summon\) is destroyed/,"destroy"],[/ is destroyed| destroys /,"shatter"],[/ equips /,"equip"],[/ reaches Level \d|levels? up|gains a level/,"level"],[/ heals? |healed|resurrected|revives /,"heal"],
    [/activates (?:[A-Z][\w'-]*\s)*(?:Arrow|Shot|Bolt|Dart|Force)\b|Arrow/,"arrow"],[/ attacks\b|band attack/i,"attack"],[/summons |Summon a|conjures |creates a/,"summon"],
    [/ deals? \d+ (?:\w+ )?damage| loses \d+ HP/,"hit"],[/ (Burn|Poison|Stun|Wound|Confuse)/,"status"],[/ Gold\b/,"gold"],[/ Aura\b/,"aura"],
    [/ plays /,"card"],[/ passes\./,"pass"],[/ draws? /,"draw"]];
  function pick(m){for(const[r,k]of RULES)if(r.test(m))return k;return null}
  return{on,play,pick,toggle(){store2.set("cq.sound",!on());if(on())play("chime")},unlock(){ctx();load()}}})();
/* Update 30: Play tab background music, with its own on/off (cq.music). Plays while a game is open on the Play tab. */
const MUS=(()=>{let el=null;const on=()=>store2.get("cq.music",true)!==false;
  function get(){if(!el){el=new Audio();const ogg=el.canPlayType('audio/ogg; codecs="vorbis"');el.src=`${ICON_BASE}sfx/theme_3_boss_fight_it_all_rides_on_this.${ogg?"ogg":"mp3"}?v=1`;el.loop=true;el.volume=0.32;el.preload="auto"}return el}
  function sync(want){if(want&&on()&&location.hash==="#play"){const a=get();if(a.paused)a.play().catch(()=>{})}else if(el&&!el.paused)el.pause()}
  addEventListener("hashchange",()=>sync(false));document.addEventListener("visibilitychange",()=>{if(document.hidden)sync(false);else if(U.s&&U.mode!=="lobby")sync(true)});
  return{on,sync,toggle(){store2.set("cq.music",!on());sync(on())}}})();
/* Update 30: pointing at a card in your hand clicks and pops a 1.4x copy up over the Heroes (the copy ignores the mouse, so clicks still reach the card) */
let hcPop=null,hcOn=null;
function hcPopHide(){if(hcPop){hcPop.remove();hcPop=null}hcOn=null}
document.addEventListener("mouseover",e=>{const hc=e.target.closest&&e.target.closest(".pl-hand .hc");if(hc===hcOn)return;hcPopHide();if(!hc||!matchMedia("(hover:hover)").matches)return;hcOn=hc;
  SND.play("tick");const card=hc.querySelector(".card");if(!card)return;const r=card.getBoundingClientRect(),S=1.4,w=r.width*S,h=r.height*S;
  const d=document.createElement("div");d.className="hc-pop";d.innerHTML=card.outerHTML;d.style.width=r.width+"px";d.style.transform=`scale(${S})`;
  const left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2)),top=Math.max(8,r.bottom-h-18);d.style.left=left+"px";d.style.top=top+"px";
  document.body.appendChild(d);hcPop=d;try{if(typeof fitArt==="function")fitArt(d)}catch(err){}},true);
document.addEventListener("scroll",hcPopHide,true);addEventListener("blur",hcPopHide);
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
  /* chime when the action shifts to the other player (or a new phase starts) */
  const tk=turnKey(s);if(tk!==U.lastTurn){U.lastTurn=tk;SND.play("chime",lines.length?0.5:0)}}
/* Update 30: opponent action pop-ups. Each opponent "starter" line (plays, activates, attacks, summons, equips, Town) opens a pop-up;
   the lines after it, up to the next starter, give its target(s) and a one-line result. Your own actions never pop up. */
const POP_START=/^(?:⚔ )?(.+?) (plays|activates|attacks|uses its ability|summons|conjures|creates|equips|visits the Shop|stays at the Inn|pays the Church|upgrades) ?(.*?)(?: \(|\.| for |: |$)/;
function opPops(s,lines){if(!window.CQPop||U.me==null)return;const objs=[];s.p.forEach(pl=>{pl.heroes.forEach(h=>objs.push(h));(pl.bf||[]).forEach(o=>objs.push(o))});
  const uidOf=n=>{const o=objs.find(x=>x.name===n);return o?o.uid:null};
  const groups=[];lines.forEach(l=>{const m=POP_START.exec(String(l.m).replace(/^✋ /,""));const sub=m&&/^(summons|conjures|creates)$/.test(m[2])&&groups.length&&groups[groups.length-1].l.p===l.p;
    if(m&&!sub&&l.p!=null&&l.p>=0){groups.push({l,m,after:[]})}else if(groups.length)groups[groups.length-1].after.push(l)});
  groups.filter(g=>g.l.p!==U.me).slice(-5).forEach(g=>{const[,actor,verb,rest]=g.m;const card=byName(rest)||null;
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
    CQPop.push({who:(s.p[g.l.p]?s.p[g.l.p].name:"Opponent")+(uidOf(actor)&&!att?" · "+actor:""),cardId:att?att.id:card?card.id:null,verb:att?"":label||"",name:att?actor+" attacks":label?rest:g.l.m.replace(/\.$/,""),
      dest:verb==="attacks"?rest:dest,sub:g.after.length?g.after[0].m.replace(/\s*\(\d+\/\d+ HP\)/,""):"",actorU:uidOf(actor),targetU:verb==="attacks"&&uidOf(rest)?[uidOf(rest)]:tgts})})}
function classOf(name){const n=String(name||"").trim();if(!n)return null;const c=(typeof CARDS!=="undefined"&&CARDS.find(x=>x.name===n))||(typeof HEROES!=="undefined"&&HEROES.find(x=>x.name===n));return c?c.cls:null}
/* one sound key per log line; damage right after an attack is the attack's damage (stone crumble); a summon from a Druid card or Druid Hero is birdsong */
function soundKeys(lines){const ks=[];let atk=false,cls=null;lines.forEach(l=>{let k=SND.pick(l.m);const m=/^(?:⚔ )?(.+?) (plays|activates) (.+?)(?: \(| for |\.|$)/.exec(l.m);
    if(m){atk=false;cls=classOf(m[3])||classOf(m[1]);const cd=typeof CARDS!=="undefined"&&CARDS.find(x=>x.name===m[3].trim());if(cd&&cd.sub==="Curse")k="curse"}if(/ attacks /.test(l.m)&&!m)atk=true;
    if(k==="hit"&&atk)k="crumble";if(k==="summon"&&cls==="Druid")k="birdsong";if(k&&ks[ks.length-1]!==k)ks.push(k)});return ks}
U.snd={SND,MUS,classOf,soundKeys,starterDeck}; /* for tests */
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
  document.addEventListener("click",e=>{if(document.documentElement.classList.contains("pl-menu")&&!e.target.closest("header.top,#pl-menutab"))set(false)});
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
function render(){const root=ROOT();if(!root)return;injectCSS();
  if(U.mode==="lobby"){MUS.sync(false);if(window.CQPop)CQPop.clear();root.innerHTML=lobbyHTML();return}
  if(U.mode==="room"){root.innerHTML=roomHTML();return}
  const s=view();if(!s){root.innerHTML=roomHTML();return}
  if(!U.gameKey)U.gameKey="g"+Date.now();mergeLog(s);try{trackBanner(s)}catch(e){console.warn(e)}
  const keepScroll=root.querySelector(".pl-log");const atBottom=!keepScroll||keepScroll.scrollTop+keepScroll.clientHeight>=keepScroll.scrollHeight-20;
  const handEl=root.querySelector(".pl-hand");const hs=handEl?handEl.scrollLeft:0;
  if(U.overFor!==U.gameKey){U.overFor=U.gameKey;U.overHide=false}
  root.innerHTML=gameHTML(s)+overHTML(s);
  const lg=root.querySelector(".pl-log");if(lg&&atBottom)lg.scrollTop=lg.scrollHeight;
  const he=root.querySelector(".pl-hand");if(he){he.scrollLeft=hs;handOvf(he);he.addEventListener("scroll",()=>handOvf(he),{passive:true})}
  try{gameFx(s)}catch(e){console.warn(e)}
  try{MUS.sync(true)}catch(e){}
  try{if(window.CQPop)CQPop.redraw()}catch(e){}
  hcPopHide();
  try{if(typeof fitArt==="function")fitArt(root)}catch(e){}
  try{fitPlay(root)}catch(e){console.warn(e)}
  modals(s)}
function lobbyHTML(){const ch=deckChoices();const resL=store2.get("cq.play.local",null),resH=store2.get("cq.play.host",null),resG=store2.get("cq.play.guest",null);
  if(!U.lobby.deck||!ch.some(d=>d.id===U.lobby.deck&&d.ok))U.lobby.deck=(ch.find(d=>d.ok)||{}).id||"";
  if(U.lobby.ai===U.lobby.deck&&!U.lobby.aiPicked)U.lobby.ai=U.lobby.deck==="starter:1"?"starter:0":"starter:1";
  const opts=(sel,onlyOk)=>ch.map(d=>`<option value="${esc(d.id)}" ${d.id===sel?"selected":""} ${!d.ok?"disabled":""}>${esc(d.name)}</option>`).join("");
  const online=!!sb();
  return`<h1>Play Crystal Quest</h1><p class="lede">Play a full game with the rules enforced: phases, priority by position, Aura, attacks, Hidden cards, Town and Gold. Cards marked <b>AUTO</b> resolve themselves; the few marked <b>BY HAND</b> open a panel where you apply the effect.</p>
  ${resL&&resL.s&&!resL.s.over?`<div class="panel"><b>Game in progress vs AI</b> · Round ${resL.s.round}<div class="actions"><button class="btn primary" data-pa="resume-local">Resume</button><button class="btn" data-pa="drop-local">Discard it</button></div></div>`:""}
  ${resH&&resH.s&&!resH.s.over?`<div class="panel"><b>Online room ${esc(resH.code)}</b> (you're the host) · Round ${resH.s.round}<div class="actions"><button class="btn primary" data-pa="resume-host">Reopen room</button><button class="btn" data-pa="drop-host">Close it</button></div></div>`:""}
  ${resG&&resG.code?`<div class="panel"><b>Online room ${esc(resG.code)}</b> (joined)<div class="actions"><button class="btn primary" data-pa="resume-guest">Rejoin</button><button class="btn" data-pa="drop-guest">Forget it</button></div></div>`:""}
  <div class="pl-lobby">
    <section class="panel"><h2>Your deck</h2>
      <label>Deck<select data-pa="deck">${opts(U.lobby.deck)}</select></label>
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
  </div>`}
function roomHTML(){const n=U.net;if(!n)return"";
  return`<h1>${n.role==="host"?"Your room":"Joining room"}</h1>
  <div class="panel" style="max-width:520px">${n.role==="host"?`<p>Share this code with your opponent:</p><div class="pl-code">${esc(n.code)}</div><p class="pl-note">They open Deck Forge → Play → Join with a code. The game starts as soon as they join.</p>`
    :`<div class="pl-code">${esc(n.code)}</div><p>${U.busy?"Waiting for the host…":"Connecting to the host…"} If nothing happens, check the code and make sure the host has the room open.</p>`}
  <p class="pl-note">${n.peers?"Opponent connected.":"Waiting for opponent…"}</p>
  <div class="actions"><button class="btn" data-pa="leave">Cancel</button></div></div>`}
function gameHTML(s){const me=U.me,op=E.opp(me);const opts=legal();
  if(U.logHidden==null){try{U.logHidden=localStorage.getItem("cq.play.log")==="hide"}catch(e){U.logHidden=false}}
  return`<div class="pl-game${U.logHidden?" nolog":""}"><button class="btn sm pl-logshow" data-pa="log-toggle" title="Show the game log">Show log</button><div class="pl-board">
    ${zoneHTML(s,op,opts)}
    ${midHTML(s,opts)}
    ${zoneHTML(s,me,opts)}
    ${handHTML(s,opts)}
  </div><aside class="pl-side">
    <div class="pl-side-h"><h2>Game log</h2><span class="actions"><button class="btn sm" data-pa="log-toggle" title="Hide the game log">Hide log</button><button class="btn sm" data-pa="export-log" title="Download the full game log as a text file">Export log</button><button class="btn sm" data-pa="rules">Rules</button><button class="btn sm danger" data-pa="leave-ask">${s.over?"Exit":"Leave"}</button></span></div>
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
    else inv.push(`<button class="pi full${cands.has(o.uid)?" cand":""}${U.man&&U.manT===o.uid?" mansel":""}${ar.c}" style="${ar.st}--cc:${cc(c)};--ci:${ci(c)}" data-pa="obj" data-u="${o.uid}"><b>${esc(o.name)}</b>${o.kind==="doll"?` <span>${E.hp(s,o)}/5 HP</span>`:""}${o.ctr&&o.ctr.camp!=null?` <span>${o.ctr.camp} counters</span>`:""}${o.ctr&&o.ctr.petal?` <span>${o.ctr.petal} Petal</span>`:""}${o.under&&o.under.length?` <span>${o.under.length} under it</span>`:""}${o.x&&o.x.name&&o.name==="Null Stone"?` <span>Names ${esc(o.x.name)}</span>`:""}${o.ctr&&o.ctr.trophy?` <span>${o.ctr.trophy} Trophy</span>`:""}${s.upg&&s.upg[o.uid]!=null?` <span title="Upgraded at the Blacksmith">Upgraded${E.upgradeCost(o)&&E.upgradeCost(o).x?` +${s.upg[o.uid]}`:""}</span>`:""}${invCounts(s,o,pid)}</button>`)}
  /* Card Art: the acting Hero's buttons sit at the bottom of the right-hand column */
  let zacts="";if(mine&&actor&&heroArt(E.DB[actor.id])&&s.phase==="battle"&&s.prio===U.me&&!s.pend.length&&!s.over&&!U.tgt&&(opts||[]).length){const hb=heroActs(s,opts,actor);
    if(hb.length)zacts=`<div class="pl-acts zs-acts" aria-label="${esc(actor.name)}'s actions"><span class="zs-who">${esc(actor.name)}</span>${hb.join("")}</div>`}
  const isInit=s.init===pid;
  const turnTag=s.phase==="battle"&&s.prio===pid&&!s.pend.length?'<span class="res init">Acting</span>':"";
  const pc=[0,1].map(p=>`P${p}`).filter(u=>cands.has(u)&&u==="P"+pid).length;
  return`<section class="pl-zone${mine?"":" op"}" aria-label="${esc(pl.name)}'s side">
    <div class="pl-heroes">${heroes}</div>
    <div class="pl-zside"><div class="pl-zsin"><div class="pl-bar"><span class="nm">${esc(pl.name)}${mine?" (you)":""}</span>${isInit?'<span class="res init" title="Has initiative">Initiative</span>':""}${turnTag}
      ${auraBarHTML(s,pl)}<span class="res gold" title="Gold: earned at Dusk, spent in Town"><i class="coin" aria-hidden="true"></i> <b>${pl.gold}</b> Gold</span>
      ${mine?"":turnCounts(s,pid).join("")}${s.passed[pid]&&s.phase==="battle"?'<span class="res">Passed</span>':""}
      ${pc?`<button class="btn sm" data-pa="pick" data-u="P${pid}" style="outline:3px solid var(--warn)">Target ${esc(pl.name)}'s party</button>`:""}
      <span class="pl-piles">${pl.echo.length?`<span class="res">Echo <b>${pl.echo.length}</b></span>`:""}<span class="res">Hand <b>${pl.hand.length}</b></span><span class="res">Library <b>${pl.lib.length}</b></span>
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
  if(h.fl&&h.fl.stepped===r)out.push('<span class="tg cnt" title="Stepped back: acts after the Closer this round">Acts last</span>');
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
  const top=`<span class="ph-top"><span>${E.POS[i]||""}${isActor?' <span class="mark">· acting</span>':""}</span><span>Lv ${h.lvl}</span></span>`;
  const extra=`${tags.length?`<span class="tags">${tags.join("")}</span>`:""}${gear?`<span class="tags">${gear}</span>`:""}`;
  if(heroArt(d))return`<div role="button" tabindex="0" class="${cls} hasart hk" style="--cc:${cc(h.cls)};--ci:${ci(h.cls)}" data-pa="obj" data-u="${h.uid}" aria-label="${esc(d.name)}, ${esc(h.cls)} Hero${h.dead?", dead":""}">
    ${top}${heroCardHTML(s,h,d,st,extra,soul,"")}
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
function heroCardHTML(s,h,d,st,extra,soul,hacts){
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
      <div class="hk-art"><img src="${src}" alt="${esc(d.name)}" width="207" height="167" decoding="async">${cardOf(h.id)?zoomHTML(cardOf(h.id)):""}${extra?`<div class="hk-tags">${extra}</div>`:""}${hacts||""}</div>
      <div class="hk-st">${h.dead?"":num("str","STR")+num("hp","HP")+num("def","DEF")}<span class="hk-ab" tabindex="0" aria-label="Ability: ${esc(rulesPlainSafe(d.rules))}">Ability<span class="hk-tip" role="tooltip"><span class="hk-tt">${esc(d.name)} <small>${esc(h.cls)} Hero</small></span>${rules}</span></span></div>
      ${pop}
    </div>
    <div class="ph-back" aria-hidden="${h.dead?"false":"true"}"><span class="gemb"></span><span class="cqt">Crystal<br>Quest</span><span class="rib">${h.surr?"Surrendered":"Dead"}<small>${esc(d.name)}</small></span>${soul||""}</div>
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
  return`<span class="res aubar" title="Aura pool: ${pl.aura} left of ${max} (your living Heroes' Aura). Refreshes at Dawn; unspent Aura is lost at Dusk." style="--ap:${p.toFixed(1)}%"><i class="fill"></i><i class="aura"></i> <b>${pl.aura}</b><small>/ ${max} Aura</small></span>`}
function summonHTML(s,o,cands){const tags=[];E.STATUS.forEach(k=>{if(o.st[k])tags.push(E.STATUS_NAME[k])});const ar=arrA(o.uid);
  const hpN=E.hp(s,o),hpM=Math.max(1,E.maxHp(s,o)),hpP=Math.max(0,Math.min(100,hpN/hpM*100));
  const hpBar=`<span class="ps-hp" role="img" aria-label="${hpN} of ${hpM} Health Points" title="${hpN}/${hpM} HP"><i style="width:${hpP.toFixed(1)}%;background:${hpP>60?"#3fae4f":hpP>30?"#e0b13a":"#d4402c"}"></i></span>`;
  return`<button class="ps${o.ex?" ex":""}${cands.has(o.uid)?" cand":""}${U.man&&U.manT===o.uid?" mansel":""}${ar.c}" style="${ar.st}--cc:${cc((E.TOK[o.name]||{}).cls||"Druid")}" data-pa="obj" data-u="${o.uid}"><b>${esc(o.name)}</b><span>${E.str(s,o)} STR · ${E.hp(s,o)}/${E.maxHp(s,o)} HP${E.defn(s,o)?` · ${E.defn(s,o)} DEF`:""}</span>${o.ex?"<span>Exhausted</span>":""}${E.hasBanding(s,o)?"<span class=\"band\">Banding</span>":""}${E.forcedTarget&&E.forcedTarget(s,o)?`<span class="must" style="color:#C0392B;font-weight:700">Must attack ${esc(nameOf(E.forcedTarget(s,o)))}</span>`:""}${tags.length?`<span style="color:var(--warn)">${tags.join(", ")}</span>`:""}${hpBar}</button>`}
function phaseLabel(s){return({mull:"Mulligan",dawn:"Dawn",battle:"Battle",dusk:"Dusk",town:"Town"})[s.phase]||s.phase}
function midHTML(s,opts){const me=U.me;const pr=s.pend[0];let prompt="",acts="",wait=false,fixBtn="";
  const mineTurn=opts.length>0;
  if(s.over){prompt=(s.winner===me?"🏆 You win!":s.winner<0?"The game is a draw.":`${esc(s.p[s.winner].name)} wins.`)+(s.conceded!=null?(s.conceded===me?" You conceded.":` ${esc(s.p[s.conceded].name)} conceded.`):"")+(s.deckedOut!=null?(s.deckedOut===me?" You had to draw from an empty library.":` ${esc(s.p[s.deckedOut].name)} had to draw from an empty library.`):"");acts=`<button class="btn primary" data-pa="leave">Return to Lobby</button>${U.vsAI?'<button class="btn go" data-pa="rematch">Rematch</button>':""}<button class="btn" data-pa="over-show">Game summary</button>`}
  else if(U.tgt){const sl=U.tgt.slots[U.tgt.i];prompt=`Choose ${esc(sl.label)} for ${esc(U.tgt.label)}${U.tgt.slots.length>1?` (${U.tgt.i+1}/${U.tgt.slots.length})`:""}. Click a highlighted ${sl.k==="player"||sl.k==="enemyPlayer"?"party button":"target"}.`;
    acts=`${sl.opt?'<button class="btn" data-pa="skip">Skip</button>':""}<button class="btn" data-pa="cancel">Cancel</button>`}
  else if(pr&&pr.pid===me){
    if(pr.type==="window"){const tr=pr.trig;const w=tr.kind==="party10"?"Your party has now taken 10 or more damage this turn":tr.kind==="attack"?`${esc(nameOf(tr.attacker))} attacks ${esc(nameOf(tr.target))}`:`${esc(s.p[tr.pid].name)} plays ${esc(tr.name||"a card")}${(tr.targets||[]).length?" targeting "+tr.targets.map(nameOf).map(esc).join(", "):""}`;
      prompt=`⚡ ${w}. Reveal a Hidden card?`;acts=opts.filter(o=>o.type==="reveal").map((o,i,all)=>{const f=E.find(s,o.uid);const many=all.filter(x=>x.uid===o.uid).length>1;return`<button class="btn go" data-pa="do" data-a='${esc(JSON.stringify(o))}' title="Exhaust ${esc(nameOf(o.hero))} to reveal it">Reveal ${esc(E.DB[f.o.id].name)}${many?` (exhaust ${esc(nameOf(o.hero))})`:""}</button>`}).join("")+'<button class="btn" data-pa="do" data-a=\'{"type":"decline"}\'>Don\'t reveal</button>'}
    else if(pr.type==="manual")prompt=`✋ Resolve by hand: ${esc(pr.title)}`;
    else if(pr.type==="combo")prompt=pr.title?esc(pr.title):"Combo! Play a Combo card without using an action?";
    else if(pr.type==="ask")prompt=esc(pr.title||"Choose");
    else if(pr.type==="scry")prompt="Scry: arrange the top of your library.";
    else if(pr.type==="choose")prompt=esc(pr.title||"Choose");
  }
  else if(pr){wait=true;prompt=`Waiting for ${esc(s.p[pr.pid].name)}…`}
  else if(s.phase==="mull"){if(s.p[me].mullDone){wait=true;prompt="Waiting for your opponent to keep or mulligan…"}else prompt="Keep this hand or mulligan once?";
    if(!s.p[me].mullDone)acts='<button class="btn go" data-pa="do" data-a=\'{"type":"keep"}\'>Keep</button><button class="btn" data-pa="do" data-a=\'{"type":"mull"}\'>Mulligan</button>'}
  else if(s.phase==="dawn"){if(s.dawnDone[me]){wait=true;prompt="Waiting for your opponent to finish Dawn…"}else{prompt="Dawn: you may use Gemstones (exhausting a Hero) before battle.";
    acts=opts.filter(o=>o.type==="gem").map(o=>`<button class="btn" data-pa="do" data-a='${esc(JSON.stringify(o))}'>${esc(nameOf(o.uid))} (exhaust ${esc(nameOf(o.hero))})</button>`).join("")+opts.filter(o=>o.type==="wake").map(o=>`<button class="btn" data-pa="do" data-a='${esc(JSON.stringify(o))}'>${o.v?`Wake ${esc(nameOf(o.hero))} at next Dawn`:`Keep ${esc(nameOf(o.hero))} Meditating`}</button>`).join("")+'<button class="btn go" data-pa="do" data-a=\'{"type":"dawnDone"}\'>Start battle</button>'}}
  else if(s.phase==="town"){const t=s.town&&s.town.order[s.town.i];if(t!==me){wait=true;prompt=`${esc(s.p[t].name)} is in Town…`}else{const used=(s.town&&s.town.used)||{};prompt=`Town: you have ${s.p[me].gold} Gold. Inn ${E.INN_COST} Gold (a Hero heals ${E.INN_HEAL})${used.inn?" ✓ used":""} · Shop ${E.SHOP_COST} Gold (draw a card)${used.shop?" ✓ used":""} · Church ${E.CHURCH_COST} Gold (resurrect a dead Hero with ${E.CHURCH_HP} HP)${used.church?" ✓ used":""}. Each once per visit. Blacksmith: upgrade items and equipment that have an Upgrade cost.`;
    acts=opts.filter(o=>o.type==="inn").map(o=>`<button class="btn" data-pa="do" data-a='${esc(JSON.stringify(o))}'>Inn: heal ${esc(nameOf(o.hero))}</button>`).join("")+(opts.some(o=>o.type==="shop")?'<button class="btn" data-pa="do" data-a=\'{"type":"shop"}\'>Shop: draw a card</button>':"")
      +opts.filter(o=>o.type==="church").map(o=>`<button class="btn" data-pa="do" data-a='${esc(JSON.stringify(o))}'>Church: resurrect ${esc(nameOf(o.hero))}</button>`).join("")
      +(()=>{const ups=opts.filter(o=>o.type==="upgrade");const seen=new Set();return ups.map(o=>{if(seen.has(o.uid))return"";seen.add(o.uid);const f=E.find(s,o.uid);
        if(o.x==null){const uc=E.upgradeCost(f.o);return`<button class="btn" data-pa="do" data-a='${esc(JSON.stringify(o))}' title="${esc(((E.DB[f.o.id]||{}).up||{}).rules||"")}">Blacksmith: upgrade ${esc(f.o.name)}${uc&&uc.cost?` (${uc.cost} Gold)`:""}</button>`}
        const xs=ups.filter(u=>u.uid===o.uid).map(u=>u.x);return`<span class="pl-up">Blacksmith: upgrade ${esc(f.o.name)} for <select data-pa="up-x" data-u="${o.uid}">${xs.map(x=>`<option value="${x}">${x} Gold (+${x})</option>`).join("")}</select><button class="btn" data-pa="up-go" data-u="${o.uid}">Upgrade</button></span>`}).join("")})()
      +'<button class="btn go" data-pa="do" data-a=\'{"type":"leave"}\'>Leave Town</button>'}}
  else if(s.phase==="battle"){if(s.prio!==me){wait=true;prompt=`${esc(s.p[s.prio].name)} is acting…`}else{const a=E.actorFor(s,me);const refire=s.bonus&&s.bonus.pid===me&&s.bonus.only==="arrow";const fz=a&&E.forcedTarget(s,a);
      const bb=s.bonus&&s.bonus.pid===me?s.bonus:null;
      prompt=bb&&bb.only==="bard"?`Echo Performer: <b>${esc(a?a.name:"")}</b> plays a Bard Tactic or Song (pay its Aura cost); it will be duplicated.`:bb&&bb.rapid?`Rapid Shot: <b>${esc(a?a.name:"")}</b> activates Arrows (Piercing 1), then it's exhausted.`:bb&&bb.free?`Line It Up: <b>${esc(a?a.name:"")}</b> may fire an Arrow for free.`:refire?`Refire: <b>${esc(a?a.name:"")}</b> activates an Arrow (pay its Aura). If it resolves, it returns to your inventory.`:a?`Your action with <b>${esc(a.name)}</b>${s.bonus&&s.bonus.pid===me?" (bonus action)":""}${fz?` — it <b>must attack ${esc(nameOf(fz))}</b> (Arrow of Persuasion)`:""}. ${fz?"It must attack now.":"Play a highlighted card, or choose an action:"}`:"None of your Heroes are ready. You can attack with a summon, surrender a soul, or pass.";
      acts=battleActs(s,opts);fixBtn=FIX_BTN}}
  if(U.busy){wait=true;prompt="Sending…"}
  const oppActing=!s.over&&wait&&!U.busy&&(pr?pr.pid!==me:(s.phase==="battle"&&s.prio!==me)||(s.phase==="town"&&s.town&&s.town.order[s.town.i]!==me));
  const oppInfo=oppActing?oppInfoHTML(s):"";
  const ban=U.banner&&!s.over&&!U.tgt?bannerHTML():"";if(ban)acts="";
  const posm=`<span class="posm" title="Position marker">${[...E.POS,"Last"].map((p,i)=>`<span class="${s.phase==="battle"&&s.pos===i?"on":""}${i===3?" last":""}" ${i===3?'title="Heroes that stepped back act here, after the Closer"':""}>${p}</span>`).join("")}</span>`;
  const man=pr&&pr.pid===me&&pr.type==="manual"&&!s.over?manualHTML(s,pr):"";
  return`<section class="pl-mid${wait?" wait":""}${oppActing?" opp":""}"><div class="pl-phase"><span class="ph-n">Round ${s.round||"–"} · ${phaseLabel(s)}</span>${posm}<button type="button" class="btn sm pl-snd" data-pa="snd" title="Turn sound effects on or off" aria-pressed="${SND.on()}">${SND.on()?"🔊 Effects on":"🔇 Effects off"}</button><button type="button" class="btn sm pl-snd" data-pa="mus" title="Turn the music on or off" aria-pressed="${MUS.on()}">${MUS.on()?"🎵 Music on":"🎵 Music off"}</button>${U.net?`<span class="pl-note">Room ${esc(U.net.code)} · ${U.net.peers?"opponent online":"opponent offline"}</span>`:""}</div>
    <div class="pl-prompt">${prompt}</div>${oppInfo}${ban}${(()=>{const tc=s.over||s.phase==="mull"?[]:turnCounts(s,me);return tc.length?`<div class="pl-counts"><span class="pl-note">This turn:</span>${tc.join("")}</div>`:""})()}${(acts||!s.over)&&!ban?`<div class="pl-acts">${acts}${s.over?"":`<span class="pl-endcol">${fixBtn?helpHTML(fixBtn):""}<button class="btn sm danger pl-concede" data-pa="concede-ask" title="Concede this game">Concede</button></span>`}</div>`:""}${ban?"":man}</section>`}
/* opponent's turn: what they have to work with */
function oppInfoHTML(s){const op=E.opp(U.me);const pl=s.p[op];const a=s.phase==="battle"&&s.prio===op?E.actorFor(s,op):null;
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
function overHTML(s){if(!s.over||U.overHide)return"";const me=U.me;
  const head=s.winner===me?"🏆 You win!":s.winner<0?"The game is a draw.":`${esc(s.p[s.winner].name)} wins.`;
  const why=(s.conceded!=null?(s.conceded===me?"You conceded.":`${esc(s.p[s.conceded].name)} conceded.`):"")+(s.deckedOut!=null?(s.deckedOut===me?" You had to draw from an empty library.":` ${esc(s.p[s.deckedOut].name)} had to draw from an empty library.`):"");
  return`<div class="pl-over" role="dialog" aria-modal="true" aria-label="Game over"><div class="pl-over-box"><h2>${head}</h2>${why?`<p class="pl-over-why">${why.trim()}</p>`:""}${statsHTML(s)}
  <div class="pl-over-acts"><button class="btn primary" data-pa="leave">Return to Lobby</button>${U.vsAI?'<button class="btn go" data-pa="rematch">Rematch</button>':""}<button class="btn" data-pa="over-hide">View the board</button></div></div></div>`}
/* end-of-game summary */
function statsHTML(s){if(!E.gameStats)return"";const g=E.gameStats(s);const me=U.me;
  const li=a=>a.length?`<ol>${a.map(x=>`<li>${esc(x.name)} — <b>${x.v}</b>${x.side!=null?` <span class="pl-note">(${esc(s.p[x.side].name)})</span>`:""}</li>`).join("")}</ol>`:'<p class="pl-note">None.</p>';
  const line=sd=>`<p><b>${esc(sd.name)}</b><br>Start: ${sd.start.map(esc).join(" → ")||"–"}<br>End: ${sd.final.map(h=>`<span class="${h.dead?"dead":""}">${esc(h.name)} L${h.lvl}</span>`).join(" → ")}<br><span class="pl-note">Damage ${sd.totDmg} · Prevented ${sd.totPrev} · Healed ${sd.totHeal}${sd.healer?` · Top healer: ${esc(sd.healer.name)} (${sd.healer.v})`:""}</span></p>`;
  return`<div class="pl-stats"><div><h3>Game summary · ${g.rounds} round${g.rounds===1?"":"s"}</h3>${line(g.sides[me])}${line(g.sides[E.opp(me)])}</div><div><h3>Most damage</h3>${li(g.topDmg)}</div><div><h3>Most damage prevented</h3>${li(g.topPrev)}<p class="pl-note">Base DEF isn't credited to any card.</p></div></div>`}
function statsText(s){if(!E.gameStats)return"";const g=E.gameStats(s);let t=`\n=== Game summary ===\nRounds: ${g.rounds}\n`;
  g.sides.forEach(sd=>{t+=`${sd.name}: start ${sd.start.join(" > ")} | end ${sd.final.map(h=>`${h.name} L${h.lvl}${h.dead?" (died)":""}`).join(" > ")}\n  Damage ${sd.totDmg}, prevented ${sd.totPrev}, healed ${sd.totHeal}${sd.healer?`; top healer ${sd.healer.name} (${sd.healer.v})`:""}\n`});
  t+="Most damage:\n"+g.topDmg.map((x,i)=>`  ${i+1}. ${x.name} (${g.sides[x.side].name}): ${x.v}`).join("\n")+"\nMost damage prevented:\n"+g.topPrev.map((x,i)=>`  ${i+1}. ${x.name} (${g.sides[x.side].name}): ${x.v}`).join("\n")+"\n";return t}
function lvBtn(o,label,cls){return`<button class="btn ${cls}" data-pa="do" data-a='${esc(JSON.stringify(o))}'><span class="plus" aria-hidden="true">+</span>${esc(label)}</button>`}
function btn(o,label,cls){return`<button class="btn${cls?" "+cls:""}" data-pa="do" data-a='${esc(JSON.stringify(o))}'>${esc(label)}</button>`}
/* the acting Hero's own buttons (attack, level up, Step Back, abilities, items, equip): also shown under that Hero on the board */
function heroActs(s,opts,a){const out=[];const me=U.me;if(!a)return out;
  opts.filter(o=>o.type==="attack"&&o.att===a.uid).forEach(o=>out.push(btn(o,"Attack","atk")));
  const lv=opts.filter(o=>o.type==="level");const LV={str:"STR",def:"DEF",aura:"AURA"};
  if(lv.length===1&&!lv[0].stat)out.push(lvBtn(lv[0],"Level up","lv"));else lv.forEach(o=>out.push(lvBtn(o,`Level up ${LV[o.stat]}`,"lv lv-"+o.stat)));
  opts.filter(o=>o.type==="step").forEach(o=>out.push(btn(o,"Step Back")));
  opts.filter(o=>o.type==="ability").forEach(o=>{const ab=window.CQ_HERO_SCRIPTS[a.name][o.idx];const c=E.abilityCost(s,me,a,ab);out.push(btn(o,`${ab.label}${c?` (${c} Aura)`:""}`))});
  opts.filter(o=>o.type==="eqAct").forEach(o=>{const f=E.find(s,o.uid);const x=(window.CQ_EQACT||{})[f.o.name];out.push(`<button class="btn" data-pa="eqact" data-u="${o.uid}">${esc(f.o.name)}: ${esc(x?x.label:"use")}</button>`)});
  opts.filter(o=>o.type==="use").forEach(o=>{const f=E.find(s,o.uid);const c=E.itemCost(s,me,a,f.o);out.push(btn(o,`Use ${f.o.name}${c?` (${c})`:""}`))});
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
  opts.filter(o=>o.type==="play"&&s.p[me].exile.some(x=>x.uid===o.uid)).forEach(o=>{const c=s.p[me].exile.find(x=>x.uid===o.uid);out.push(`<button class="btn go" data-pa="play" data-u="${o.uid}">Play ${esc(E.DB[c.id].name)} (Call of Nature)</button>`)});
  const lv=opts.filter(o=>o.type==="level");const LV={str:"STR",def:"DEF",aura:"AURA"};
  if(lv.length===1&&!lv[0].stat)out.push(lvBtn(lv[0],"Level up","lv"));else lv.forEach(o=>out.push(lvBtn(o,`Level up ${LV[o.stat]}`,"lv lv-"+o.stat)));
  opts.filter(o=>o.type==="step").forEach(o=>out.push(btn(o,"Step Back")));
  opts.filter(o=>o.type==="ability").forEach(o=>{const ab=window.CQ_HERO_SCRIPTS[a.name][o.idx];const c=E.abilityCost(s,me,a,ab);out.push(btn(o,`${ab.label}${c?` (${c} Aura)`:""}`))});
  opts.filter(o=>o.type==="use").forEach(o=>{const f=E.find(s,o.uid);const c=E.itemCost(s,me,a,f.o);out.push(btn(o,`Use ${f.o.name}${c?` (${c})`:""}`))});
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
  m.innerHTML=`<div class="box${o.wide?" wide":""}">${html}</div>`;if(o.dismiss!==false)m.addEventListener("click",e=>{if(e.target===m)m.remove()});document.getElementById("layer").appendChild(m);return m}
function closeModal(){const m=document.getElementById("pl-modal");if(m)m.remove()}
function modals(s){const pr=s.pend[0];
  if(!pr||pr.pid!==U.me||s.over||U.tgt){if(document.getElementById("pl-modal")&&document.getElementById("pl-modal").dataset.k)closeModal();return}
  const key=pr.type+":"+s.seq;const cur=document.getElementById("pl-modal");if(cur&&cur.dataset.k===key)return;
  if(pr.type==="scry"){const pl=s.p[U.me];U.scry=U.scry&&U.scry.key===key?U.scry:{key,order:pr.cards.slice(),bottom:[]};
    const m=modal(scryHTML(s,pr),{wide:true,dismiss:false});m.dataset.k=key}
  else if(pr.type==="choose"){U.pick=U.pick&&U.pick.key===key?U.pick:{key,on:[]};const m=modal(chooseHTML(s,pr),{wide:true,dismiss:false});m.dataset.k=key}
  else if(pr.type==="combo"){const m=modal(comboHTML(s,pr),{wide:true,dismiss:false});m.dataset.k=key}
  else if(pr.type==="ask"){const m=modal(`<h2>${esc(pr.title||"Choose")}</h2><div class="actions" style="flex-direction:column;align-items:stretch">${pr.opts.map((o,i)=>`<button class="btn${i===0?" primary":""}" data-pa="do" data-a='${esc(JSON.stringify({type:"ask",i}))}'>${esc(o.label)}</button>`).join("")}</div>`,{dismiss:false});m.dataset.k=key}
  else if(cur&&cur.dataset.k)closeModal()}
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
  return`<h2>${pr.free?"Revealed cards":"Combo"}</h2><p class="pl-note">${pr.free?esc(pr.title||"You may play a revealed card for free."):"You revealed a Combo card. You may play it, or a Combo card from your hand, by paying its Aura cost (no action used)."}</p>
  <div class="pick-list">${pr.cands.map(u=>{const id=cardById(s,u,pr);const ok=opts.some(o=>o.uid===u);const inLib=s.p[U.me].lib.some(c=>c.uid===u);return`<div class="pk">${cardHTML(cardOf(id))}<span class="badge">${inLib?"Revealed":"In hand"}</span><div class="actions" style="margin-top:6px"><button class="btn sm${ok?" primary":""}" data-pa="combo-play" data-u="${u}" ${ok?"":"disabled"}>${ok?"Play":"Can't afford"}</button></div></div>`}).join("")}</div>
  <div class="actions"><button class="btn" data-pa="do" data-a='{"type":"decline"}'>Don't play</button></div>`}
function inspectObj(u){const s=view();const f=E.find(s,u);if(!f)return;const o=f.o;
  let card=null;if(o.kind==="hero")card=cardOf(o.id);else if(o.kind==="summon"||o.kind==="pillar"||o.kind==="doll"||(o.kind==="equip"&&o.tok))card=BYID.get("t:"+o.name);else if(o.id)card=cardOf(o.id);
  const mine=f.pid===U.me;const opts=legal();const acts=[];
  if(mine&&o.kind==="card"){opts.filter(x=>(x.type==="use"||x.type==="clear")&&x.uid===u).forEach(x=>acts.push(btn(x,x.type==="use"?"Activate":"Clear from inventory (discard)")))}
  if(mine&&o.kind==="equip"){opts.filter(x=>(x.type==="equipInv"||x.type==="take"||x.type==="clear")&&x.uid===u).forEach(x=>acts.push(btn(x,x.type==="clear"?"Clear from inventory (discard)":x.type==="take"?"Take it":"Equip it")))}
  if(mine&&o.kind==="summon")opts.filter(x=>x.type==="attack"&&x.att===u).forEach(x=>acts.push(btn(x,"Attack with it","go")));
  if(mine)opts.filter(x=>x.type==="band"&&x.att===u).forEach(x=>acts.push(btn(x,"Lead a Band attack","go")));
  if(mine&&o.kind==="card")opts.filter(x=>x.type==="useFree"&&x.uid===u).forEach(x=>acts.push(btn(x,"Activate (no action)","go")));
  if(mine&&o.kind==="hero"&&o.med)acts.push(`<button class="btn" data-pa="do" data-a='${esc(JSON.stringify({type:"wake",hero:u,v:o.keepMed}))}'>${o.keepMed?"Wake at next Dawn":"Keep Meditating"}</button>`);
  const hidden=o.fd&&!mine;
  modal(`${hidden?"<p>A face-down Hidden card.</p>":card?cardHTML(card,{flipped:E.isUp(s,o),nozoom:1}):`<h2>${esc(o.name)}</h2>`}
    ${o.kind==="hero"?`<p class="pl-note">Level ${o.lvl}${o.bon.str||o.bon.def||o.bon.aura?` · level bonuses: ${["str","def","aura"].filter(k=>o.bon[k]).map(k=>`+${o.bon[k]} ${k.toUpperCase()}`).join(", ")}`:""}${o.dmg?` · ${o.dmg} damage taken`:""}</p>`:""}
    ${o.kind==="hero"&&o.ench.length?`<p class="pl-note">Enchantments: ${o.ench.map(e=>esc(e.name)).join(", ")}</p>`:""}
    <div class="actions">${acts.join("")}<button class="btn" data-pa="close">Close</button></div>`)}
function showPile(pid,z){const s=view();const pl=s.p[pid];const list=pl[z];
  modal(`<h2>${esc(pl.name)} · ${z==="disc"?"Discard pile":"Exile"} (${list.length})</h2><div class="pick-list">${list.slice().reverse().map(c=>c.id?cardHTML(cardOf(c.id)):"").join("")||'<p class="pl-note">Empty.</p>'}</div><div class="actions"><button class="btn" data-pa="close">Close</button></div>`,{wide:true})}

/* ---------- starting an action (modes, X, targets) ---------- */
function begin(a){const s=view();
  if(a.type==="band"&&!a.members){return pickBand(a)}
  if(a.type==="band"||a.type==="useFree"||a.type==="eqAct"){const slots=E.need(s,U.me,a);if(!slots.length){send(a);return}
    if(a.type==="band"&&!slots[0].cands.length){toast("There's nothing that can be attacked.");return}
    U.tgt={a,slots,i:0,picks:[],label:a.type==="band"?"the band attack":E.labelAction(s,U.me,a)};skipEmpty();render();return}
  if(a.type==="soul"||a.type==="attack"||a.type==="ability"||a.type==="use"||a.type==="play"||a.type==="comboPlay"||a.type==="fixPlay"){
    if((a.type==="play"||a.type==="comboPlay"||a.type==="fixPlay")&&!a._ready){const pl=s.p[U.me];const c=pl.hand.find(x=>x.uid===a.uid)||pl.lib.find(x=>x.uid===a.uid)||pl.exile.find(x=>x.uid===a.uid);const d=E.DB[c.id];const sc=SCR()[d.name];
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
function skipEmpty(){const t=U.tgt;while(t&&t.i<t.slots.length&&!t.slots[t.i].cands.filter(u=>!(t.slots[t.i].distinct&&t.picks.includes(u))).length){t.picks.push(null);t.i++}
  if(t&&t.i>=t.slots.length){const a=Object.assign({},t.a,{targets:t.picks});U.tgt=null;send(a)}}
function pickTarget(u){const t=U.tgt;if(!t)return;const sl=t.slots[t.i];if(!sl.cands.includes(u)){toast("That isn't a legal target.");return}
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
document.addEventListener("click",e=>{const b=e.target.closest("[data-pa]");if(!b)return;if(!b.closest("#play-root")&&!b.closest("#pl-modal"))return;
  let k=b.dataset.pa;const s=view();
  if(k==="stat"&&(U.tgt||(s&&s.pend[0]&&s.pend[0].type==="manual"&&s.pend[0].pid===U.me))){k="obj"}
  else if(k==="stat"){e.stopPropagation();const u=b.dataset.u,f=b.dataset.f;U.statPop=U.statPop&&U.statPop.u===u&&U.statPop.f===f?null:{u,f};render();return}
  if(U.statPop&&k!=="stat"){U.statPop=null;document.querySelectorAll("#play-root .ph-pop").forEach(x=>x.remove());document.querySelectorAll("#play-root .ph-num.on").forEach(x=>x.classList.remove("on"))}
  if(k==="deck"||k==="ai"||k==="code"||k==="name"||k==="man-op"||k==="man-n"||k==="man-k"||k==="man-name"||k==="man-card")return;
  if(k==="close"){closeModal();return}
  if(k==="hscr"){const he=b.parentElement&&b.parentElement.querySelector(".pl-hand");if(he)he.scrollBy({left:(+b.dataset.d)*Math.max(200,he.clientWidth*0.8),behavior:"smooth"});return}
  if(k==="snd"){SND.toggle();render();return}
  if(k==="mus"){MUS.toggle();render();return}
  if(k==="start-ai"){startAI();return}
  if(k==="rematch"){U.s=null;startAI();return}
  if(k==="over-hide"){U.overHide=true;render();return}
  if(k==="over-show"){U.overHide=false;render();return}
  if(k==="host"){hostRoom();return}
  if(k==="join"){joinRoom(U.lobby.code);return}
  if(k==="leave"){leaveGame();return}
  if(k==="concede-ask"){if(!U.s||U.s.over)return;modal(`<h2>Concede?</h2><p>Are you sure you want to concede? The game ends and your opponent wins.</p><div class="actions"><button class="btn primary danger" data-pa="concede-yes">Concede</button><button class="btn" data-pa="close">Cancel</button></div>`);return}
  if(k==="concede-yes"){closeModal();if(U.s&&!U.s.over)send({type:"concede"});return}
  if(k==="man-cancel"){modal(`<h2>Cancel?</h2><p>Undo ${esc((U.s&&U.s.undo&&U.s.undo.what)||"this")}? Everything goes back to how it was before it was played.</p><div class="actions"><button class="btn primary danger" data-pa="man-cancel-yes">Undo it</button><button class="btn" data-pa="close">Keep resolving</button></div>`);return}
  if(k==="man-cancel-yes"){closeModal();U.man=null;U.manT=null;send({type:"manCancel"});return}
  if(k==="log-toggle"){U.logHidden=!U.logHidden;try{localStorage.setItem("cq.play.log",U.logHidden?"hide":"show")}catch(e){}render();return}
  if(k==="leave-ask"){if(s&&s.over){leaveGame();return}modal(`<h2>Leave this game?</h2><p>${U.vsAI?"Your game is saved in this browser; you can resume it from the Play tab.":U.net&&U.net.role==="host"?"The room closes for your opponent. You can reopen it from the Play tab.":"You can rejoin with the same code while the host keeps the room open."}</p><div class="actions"><button class="btn primary" data-pa="leave-soft">Leave</button><button class="btn" data-pa="close">Stay</button></div>`);return}
  if(k==="leave-soft"){U.gameKey=null;closeModal();clearTimeout(U.aiT);if(U.net&&U.net.ch){try{sb().removeChannel(U.net.ch)}catch(err){}}U.net=null;U.s=null;U.vsAI=false;U.mode="lobby";render();return}
  if(k==="resume-local"){const r=store2.get("cq.play.local",null);if(r){U.gameKey="g"+Date.now();U.s=r.s;U.me=r.me||0;U.meta=r.meta||null;if(U.meta)U.meta.lt=0;U.vsAI=true;U.net=null;U.mode="game";render();pumpAI()}return}
  if(k==="drop-local"){store2.del("cq.play.local");render();return}
  if(k==="resume-host"){const r=store2.get("cq.play.host",null);if(r)hostRoom(r);return}
  if(k==="drop-host"){store2.del("cq.play.host");render();return}
  if(k==="resume-guest"){const r=store2.get("cq.play.guest",null);if(r)joinRoom(r.code,true);return}
  if(k==="drop-guest"){store2.del("cq.play.guest");render();return}
  if(k==="rules"){location.hash="rules";return}
  if(k==="export-log"){exportLog();return}
  if(k==="banner-x"){clearTimeout(U.banT);U.banner=null;render();return}
  if(k==="eqact"){begin({type:"eqAct",uid:b.dataset.u});return}
  if(k==="up-go"){const sel=document.querySelector(`select[data-pa=up-x][data-u="${b.dataset.u}"]`);send({type:"upgrade",uid:b.dataset.u,x:+(sel?sel.value:1)});return}
  if(k==="multi"){const s2=view();const ar=s2.p[U.me].inv.filter(o=>o.kind==="card"&&!o.fd&&(E.DB[o.id]||{}).sub==="Arrow");U.multiSel=[];
    const draw=()=>modal(`<h2>Multi Bow</h2><p>Destroy any number of Arrows in your inventory. The next Arrow you activate deals +3 damage for each one. This doesn't use an action.</p><div class="band-list">${ar.map(o=>`<button class="btn band-pick${U.multiSel.includes(o.uid)?" primary":""}" data-pa="multi-t" data-u="${o.uid}"><b>${esc(o.name)}</b></button>`).join("")}</div><p class="band-total">Next Arrow: <b>+${3*U.multiSel.length}</b> damage</p><div class="actions"><button class="btn primary go" data-pa="multi-ok" ${U.multiSel.length?"":"disabled"}>Destroy ${U.multiSel.length}</button><button class="btn" data-pa="close">Cancel</button></div>`);
    U.multiDraw=draw;draw();return}
  if(k==="multi-t"){const u=b.dataset.u;U.multiSel=U.multiSel.includes(u)?U.multiSel.filter(x=>x!==u):U.multiSel.concat([u]);U.multiDraw();return}
  if(k==="multi-ok"){closeModal();send({type:"multiBow",n:U.multiSel.length,uids:U.multiSel});return}
  if(!s)return;
  if(k==="do"){let a;try{a=JSON.parse(b.dataset.a)}catch(err){return}closeModal();
    if(a.type==="fix"||a.type==="manDone"||a.type==="decline"){U.man=null;U.manT=null}
    begin(a);return}
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
      <div class="actions">${ok?`<button class="btn primary go" data-pa="play" data-u="${c.uid}">Play${d.sup==="Hidden"?" face down":d.type==="Item"?" to inventory":""} (${E.cardCost(s,U.me,E.actorFor(s,U.me),d,0)}${d.cost==="X"?"+X":""} Aura)</button>`:""}<button class="btn" data-pa="close">Close</button></div>`);return}
  if(k==="play"){closeModal();begin({type:"play",uid:b.dataset.u});return}
  if(k==="disc"||k==="exile"){showPile(+b.dataset.p,k==="disc"?"disc":"exile");return}
  if(k==="soul"){const opts=legal().filter(o=>o.type==="soul"&&(!b.dataset.h||o.hero===b.dataset.h));const heroes=[...new Set(opts.map(o=>o.hero))];
    modal(`<h2>Surrender a soul</h2><p class="pl-note">A surrendered Hero can never be revived. Uses your priority; no Hero is exhausted.</p>${heroes.map(h=>`<h3>${esc(nameOf(h))}</h3><div class="actions" style="flex-direction:column;align-items:stretch">${opts.filter(o=>o.hero===h).map(o=>btn(o,E.SOULS[o.ch])).join("")}</div>`).join("")}<div class="actions"><button class="btn" data-pa="close">Cancel</button></div>`);return}
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
  if(k==="deck"){U.lobby.deck=t.value}else if(k==="ai"){U.lobby.ai=t.value;U.lobby.aiPicked=true}
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
  return"Its condition isn't met right now."}

document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches('#play-root [role=button][data-pa]')){e.preventDefault();e.target.click()}});
/* ---------- mount ---------- */
U._send=a=>send(a);U._begin=a=>begin(a);
U.mount=function(el){el.innerHTML='<div id="play-root"></div>';render();if(U.vsAI)pumpAI()};
})();
