/* Update 30 (proposal): opponent action pop-ups. Each opponent action floats over the play area as a stack, newest on top.
   Each one stays 3 seconds or until dismissed; "Dismiss all" clears the stack. Hovering the stack pauses every timer.
   Only the newest pop-up draws its targeting arrow (actor -> target) and pulses its target(s); older ones show the target as text.
   API: CQPop.push({who, cardId, verb, name, dest, sub, actorU, targetU:[uids]}), CQPop.clear(), CQPop.redraw() after the board re-renders. */
(function(){
  const LIFE=3000,MAX=5;
  const css=`
.ap-wrap{position:fixed;z-index:60;display:grid;gap:8px;width:min(370px,92vw);pointer-events:none}
.ap-top{display:flex;justify-content:flex-end;pointer-events:auto}
.ap-pop{pointer-events:auto;display:grid;grid-template-columns:112px minmax(0,1fr);gap:10px;align-items:start;background:rgba(42,23,17,.96);border:2px solid var(--line,#8A5E40);border-radius:12px;padding:9px 11px;box-shadow:0 12px 34px rgba(0,0,0,.6);animation:apIn .22s ease-out both;transition:opacity .25s}
.ap-pop.new{border-color:var(--accent,#F2C14E)}
.ap-pop.old{grid-template-columns:34px minmax(0,1fr);padding:6px 10px;opacity:.88}
.ap-pop.old .ap-sub,.ap-pop.old .ap-bar{display:none}
.ap-pop img{width:100%;border-radius:5px;display:block;box-shadow:0 2px 8px rgba(0,0,0,.5)}
.ap-card{width:112px;position:relative;z-index:2;transform-origin:top right;transition:transform .15s ease;cursor:zoom-in}
.ap-pop.new:hover{z-index:3;position:relative}
.ap-card:hover{transform:scale(1.5);filter:drop-shadow(0 12px 26px rgba(0,0,0,.7))}.ap-card .card{width:112px;margin:0;box-shadow:0 2px 8px rgba(0,0,0,.5)}.ap-card .zoom,.ap-card .flip,.ap-card .c-ctrl{display:none!important}
.ap-who{font:600 .68rem/1.2 var(--body);letter-spacing:.1em;text-transform:uppercase;color:#c99566}
.ap-what{font:600 .98rem/1.25 var(--body);color:var(--ink,#F7EEDD)}
.ap-what em{font-style:normal;color:var(--accent,#F2C14E)}
.ap-pop.old .ap-what{font-size:.86rem}
.ap-sub{font-size:.78rem;color:var(--muted,#D3BC9F)}
.ap-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:6px}
.ap-bar{flex:1;height:4px;background:rgba(0,0,0,.35);border-radius:2px;overflow:hidden}
.ap-bar i{display:block;height:100%;background:var(--accent,#F2C14E);transform-origin:left;animation:apDrain 3s linear forwards}
.ap-wrap.paused .ap-bar i{animation-play-state:paused}
.ap-x{font:600 .75rem/1 var(--body);border-radius:7px;padding:5px 8px;border:1px solid var(--line,#8A5E40);background:#4a2a20;color:var(--ink,#F7EEDD);cursor:pointer}
.ap-x:hover{border-color:var(--accent,#F2C14E)}
.ap-all{font:700 .78rem/1 var(--body);border-radius:7px;padding:6px 10px;border:1px solid var(--accent,#F2C14E);background:var(--accent,#F2C14E);color:#2A1606;cursor:pointer}
.ap-svg{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:59}
.ap-tgt{outline:3px solid var(--warn,#FF8A70)!important;outline-offset:3px;animation:apPulse 1s ease-in-out infinite}
@keyframes apIn{from{opacity:0;transform:translateY(-8px)}}
@keyframes apDrain{to{transform:scaleX(0)}}
@keyframes apPulse{50%{outline-color:rgba(255,138,112,.25)}}
.ap-pop.boss{grid-template-columns:150px minmax(0,1fr);border-color:#d4402c;background:rgba(58,22,15,.97)}.ap-pop.boss.new .ap-card,.ap-pop.boss.new .ap-card .card{width:150px}.ap-pop.boss .ap-who{color:#ff9a7a}
@media (prefers-reduced-motion:reduce){.ap-pop,.ap-bar i,.ap-tgt{animation:none}}`;
  const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
  let wrap=null,svg=null,items=[],paused=false;
  const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  function anchor(){const mid=document.querySelector(".pl-mid"),g=document.querySelector(".pl-game")||document.body,r=(mid||g).getBoundingClientRect();
    /* on the right of the middle (round / prompt) bar, between the two parties, so it covers neither side's Heroes or summons */
    wrap.style.top=Math.max(12,r.top+(mid?6:70))+"px";wrap.style.left=Math.max(8,Math.min(innerWidth-wrap.offsetWidth-8,r.right-wrap.offsetWidth-10))+"px"}
  function ensure(){if(wrap&&document.body.contains(wrap))return;
    wrap=document.createElement("div");wrap.className="ap-wrap";wrap.setAttribute("role","log");wrap.setAttribute("aria-live","polite");wrap.setAttribute("aria-label","Opponent actions");
    wrap.addEventListener("mouseenter",()=>{paused=true;wrap.classList.add("paused");items.forEach(i=>{clearTimeout(i.t);i.left-=Date.now()-i.at})});
    wrap.addEventListener("mouseleave",()=>{paused=false;wrap.classList.remove("paused");items.forEach(i=>arm(i,Math.max(i.left,400)))});
    wrap.addEventListener("click",e=>{const x=e.target.closest("[data-ap]");if(!x)return;if(x.dataset.ap==="all")clear();else drop(+x.dataset.ap)});
    document.body.appendChild(wrap);
    svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("class","ap-svg");svg.setAttribute("aria-hidden","true");
    svg.innerHTML='<defs><marker id="apHead" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#F2C14E"/></marker></defs>';
    document.body.appendChild(svg);addEventListener("resize",()=>{anchor();arrows()});addEventListener("scroll",arrows,true)}
  function arm(i,ms){clearTimeout(i.t);i.at=Date.now();i.left=ms;if(!paused)i.t=setTimeout(()=>drop(i.id),ms)}
  let seq=0;
  function push(a){ensure();const i={id:++seq,a};items.unshift(i);while(items.length>MAX){const o=items.pop();clearTimeout(o.t)}arm(i,a.boss?LIFE+1500:LIFE);draw()} /* Trials boss flips stay 1.5 s longer */
  function drop(id){const i=items.find(x=>x.id===id);if(!i)return;clearTimeout(i.t);items=items.filter(x=>x!==i);draw()}
  function clear(){items.forEach(i=>clearTimeout(i.t));items=[];draw()}
  function draw(){if(!wrap)return;
    wrap.innerHTML=(items.length>1?`<div class="ap-top"><button type="button" class="ap-all" data-ap="all">Dismiss all (${items.length})</button></div>`:"")+
      items.map((i,k)=>{const a=i.a,dest=a.dest?` → ${esc(a.dest)}`:"",c=a.cardId&&typeof BYID!=="undefined"?BYID.get(a.cardId):null;
        const thumb=!c?"<span></span>":k?`<img src="${esc(artSrc(c))}" alt="">`:`<div class="ap-card">${cardHTML(c,{nozoom:true})}</div>`;return`<div class="ap-pop ${k?"old":"new"}${a.boss?" boss":""}">${thumb}
        <div style="min-width:0"><div class="ap-who">${esc(a.who||"Opponent")}</div><div class="ap-what">${a.verb?esc(a.verb)+" ":""}<em>${esc(a.name!=null&&a.name!==""?a.name:(c?c.name:""))}</em>${dest}</div>
        ${a.sub?`<div class="ap-sub">${esc(a.sub)}</div>`:""}<div class="ap-row"><span class="ap-bar"><i style="animation-duration:${LIFE}ms"></i></span><button type="button" class="ap-x" data-ap="${i.id}">Dismiss</button></div></div></div>`}).join("");
    wrap.hidden=!items.length;try{if(typeof fitArt==="function")fitArt(wrap)}catch(e){}anchor();arrows()}
  function q(u){return u?document.querySelector(`[data-pa="obj"][data-u="${u}"]`):null}
  function center(el){const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,r}}
  function arrows(){if(!svg)return;svg.querySelectorAll("path.ap-a").forEach(p=>p.remove());document.querySelectorAll(".ap-tgt").forEach(e=>e.classList.remove("ap-tgt"));
    const top=items[0];const ae=top&&q(top.a.actorU);if(!ae)return;
    const s=center(ae);(top.a.targetU||[]).map(q).filter(t=>t&&t!==ae).forEach(t=>{t.classList.add("ap-tgt");const e=center(t);
      /* same row (a target in the actor's own party): arc over the top of the cards instead of cutting across them */
      const row=Math.abs(e.y-s.y)<40,up=e.y<s.y,y1=row?s.r.top+4:up?s.r.top+6:s.r.bottom-6,y2=row?e.r.top-10:up?e.r.bottom+12:e.r.top-12,mx=(s.x+e.x)/2+(!row&&Math.abs(s.x-e.x)<40?120:0),my=row?Math.max(8,Math.min(s.r.top,e.r.top)-70):(y1+y2)/2;
      const p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("class","ap-a");p.setAttribute("d",`M${s.x} ${y1} Q${mx} ${my} ${e.x} ${y2}`);
      p.setAttribute("fill","none");p.setAttribute("stroke","#F2C14E");p.setAttribute("stroke-width","4");p.setAttribute("stroke-linecap","round");p.setAttribute("stroke-dasharray","10 7");p.setAttribute("marker-end","url(#apHead)");svg.appendChild(p)})}
  window.CQPop={push,clear,drop,redraw(){if(wrap&&items.length){anchor();arrows()}}};
})();
