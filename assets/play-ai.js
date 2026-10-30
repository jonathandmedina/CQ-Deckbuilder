/* Crystal Quest AI opponent: one-ply search over legal actions with a board evaluation. */
"use strict";
(function(root){
const E=root.CQE;const AI={};root.CQAI=AI;
const W={alive:22,hp:1,str:1.6,def:1.2,aura:2.4,lvl:1.4,guard:.6,sum:4,sumStr:1.2,sumHp:.5,pillar:3,inv:1.2,hand:.4,gold:.12,aura0:0,tmpStr:.8,status:1.1,stun:2};
AI.evaluate=function(s,pid){if(s.over)return s.winner===pid?1e4:s.winner<0?0:-1e4;
  let sc=0;s.p.forEach((pl,p)=>{let v=0;
    pl.heroes.forEach(h=>{if(h.dead){v+=h.surr?0:1;return}const st=E.heroStats(s,h);
      /* temporary STR only matters while the Hero can still attack this turn */
      const tmp=(h.mods||[]).reduce((n,m)=>n+(m.until==="dusk"&&m.str>0?m.str:0),0)+(pl.pm.str||0);
      const tv=s.phase==="battle"&&!h.ex?W.tmpStr*tmp:0;
      v+=W.alive+W.hp*st.hp+W.str*Math.min(Math.max(0,st.str-tmp),12)+tv+W.def*Math.min(st.def,8)+W.aura*st.aura+W.lvl*h.lvl+W.guard*(h.guard+h.eqGuard)+h.plus*.5;
      v-=W.status*(h.st.burn+h.st.poison+h.st.wound+h.st.confuse)+W.stun*h.st.stun;
      v+=E.eqList(h).length*.6+h.ench.reduce((n,e)=>n+(e.owner===p?1:-1.5),0)});
    pl.bf.forEach(o=>{if(o.kind==="summon")v+=W.sum+W.sumStr*E.str(s,o)+W.sumHp*E.hp(s,o);else v+=W.pillar});
    v+=pl.inv.reduce((n,o)=>n+(o.kind==="card"&&!o.fd&&(E.DB[o.id]||{}).sub==="Arrow"?(pl.heroes.some(h=>!h.dead&&h.cls==="Ranger")?1.1:.2):o.fd?1.4:W.inv),0)+W.hand*Math.min(pl.hand.length,8)+W.gold*Math.min(pl.gold,12)+W.aura0*pl.aura;
    sc+=p===pid?v:-1.15*v});
  return sc};
/* answer prompts in simulations without search */
function quick(s,pid,pr){
  if(pr.type==="window")return{type:"decline"};
  if(pr.type==="combo")return{type:"decline"};
  if(pr.type==="scry")return scryChoice(s,pid,pr);
  if(pr.type==="choose")return chooseChoice(s,pid,pr);
  if(pr.type==="manual")return{type:"manDone"};
  return null}
function scryChoice(s,pid,pr){const pl=s.p[pid];const cls=new Set(pl.heroes.filter(h=>!h.dead).map(h=>h.cls));
  const bottom=pr.cards.filter(u=>{const c=pl.lib.find(x=>x.uid===u);if(!c||!c.id)return false;const d=E.DB[c.id];return d.cls!=="Generic"&&!cls.has(d.cls)});
  return{type:"scry",bottom}}
function cardVal(s,pid,c){const d=E.DB[c.id];if(!d)return 0;const pl=s.p[pid];const cls=new Set(pl.heroes.filter(h=>!h.dead).map(h=>h.cls));
  let v=(parseInt(d.cost,10)||2);if(d.cls!=="Generic"&&!cls.has(d.cls))v-=10;if(!E.isScripted(d.name))v-=2;return v}
function chooseChoice(s,pid,pr){const n=Math.max(pr.min||0,pr.op==="discard"?pr.min:Math.min(1,pr.max));
  const look=u=>{for(const pl of s.p)for(const z of["hand","lib","disc"]){const c=pl[z].find(x=>x.uid===u);if(c)return c}return{id:pr.show&&pr.show[u]}};
  let order=pr.cards.slice().sort((a,b)=>cardVal(s,pid,look(b))-cardVal(s,pid,look(a)));
  if(pr.op==="discard")order.reverse();
  return{type:"choose",picks:order.slice(0,Math.max(n,pr.op==="opDiscard"?1:n))}}
function settleSim(s,pid,limit){for(let i=0;i<(limit||12)&&s.pend.length&&!s.over;i++){const pr=s.pend[0];const a=quick(s,pr.pid,pr);if(!a)break;E.act(s,pr.pid,a)}}
/* expand an option into concrete actions with targets */
function combos(arr,k){if(k===0)return[[]];const out=[];arr.forEach((x,i)=>combos(arr.slice(i+1),k-1).forEach(r=>out.push([x,...r])));return out}
AI.expand=function(s,pid,o,cap){cap=cap||24;let bases=[o];
  if(o.type==="play"||o.type==="comboPlay"){const pl=s.p[pid];const c=pl.hand.find(x=>x.uid===o.uid)||pl.lib.find(x=>x.uid===o.uid);if(!c)return[];
    const d=E.DB[c.id];const sc=(root.CQ_SCRIPTS||{})[d.name];
    if(sc&&sc.modes){const ms=combos(sc.modes.opts.map((_,i)=>i),Math.min(sc.modes.n,sc.modes.opts.length));bases=ms.map(m=>Object.assign({},o,{modes:m}))}
    if(d.cost==="X"||(sc&&sc.x)){const xs=[];const max=d.cost==="X"?Math.min(8,pl.aura):(sc.x.max?sc.x.max(s,pid,E.actorFor(s,pid)):6);for(let v=0;v<=max;v+=d.cost==="X"?1:2)xs.push(v);if(d.cost==="X"&&!xs.includes(max))xs.push(max);
      bases=[].concat(...bases.map(b=>xs.map(x=>Object.assign({},b,{x}))))}}
  const out=[];
  for(const b of bases){const slots=E.need(s,pid,b);
    let tl=[[]];for(const sl of slots){const c=sl.cands.slice(0,8);const next=[];
      for(const pre of tl){const opts=c.filter(u=>!(sl.distinct&&pre.includes(u)));if(!opts.length&&(sl.opt||!sl.cands.length))next.push(pre.concat([null]));opts.forEach(u=>next.push(pre.concat([u])));if(sl.opt&&opts.length)next.push(pre.concat([null]))}
      tl=next.slice(0,cap)}
    tl.forEach(tg=>out.push(Object.assign({},b,{targets:tg})))}
  return out.slice(0,cap*2)};
function castable(s,pid,h){const pl=s.p[pid];let aura=pl.aura,sum=0;
  pl.hand.map(c=>E.DB[c.id]).filter(d=>d&&(d.cls==="Generic"||E.heroIs(h,d.cls))&&E.isScripted(d.name)&&d.sup!=="Hidden").map(d=>parseInt(d.cost,10)||0).sort((a,b)=>a-b).forEach(c=>{if(c<=aura&&c>0){aura-=c;sum+=c}});return sum}
function laterUse(s,pid){const pl=s.p[pid];const a=E.actorFor(s,pid);
  const others=pl.heroes.filter(h=>!h.dead&&!h.ex&&h!==a);if(!others.length)return false;
  return pl.hand.some(c=>{const d=E.DB[c.id];if(!d)return false;const cost=parseInt(d.cost,10)||0;return cost<=pl.aura&&others.some(h=>d.cls==="Generic"||E.heroIs(h,d.cls))})||pl.inv.some(o=>!o.fd&&(E.DB[o.id]||{}).sub==="Arrow"&&others.some(h=>h.cls==="Ranger"))}
AI.choose=function(s,pid){if(s.over)return null;
  if(s.pend.length){const pr=s.pend[0];if(pr.pid!==pid)return null;
    if(pr.type==="window"||pr.type==="combo"){const opts=E.options(s,pid);let best={type:"decline"},bv=-1e9;
      for(const o of opts){const acts=o.type==="comboPlay"?AI.expand(s,pid,o):[o];
        for(const a of acts){const c=E.clone(s);const r=E.act(c,pid,a);if(!r.ok)continue;settleSim(c,pid);const v=AI.evaluate(c,pid)+(a.type==="decline"?0.2:0);if(v>bv){bv=v;best=a}}}
      if(pr.type==="window"&&best.type==="reveal"){const o=E.find(s,best.uid);if(o&&!(root.CQ_SCRIPTS[E.DB[o.o.id].name]||{}).hidden)return{type:"decline"}}
      return best}
    return quick(s,pid,pr)}
  const pl=s.p[pid];
  if(s.phase==="mull"){if(pl.mullDone)return null;const aura=pl.heroes.reduce((n,h)=>n+h.base.aura,0);const cls=new Set(pl.heroes.map(h=>h.cls));
    const good=pl.hand.filter(c=>{const d=E.DB[c.id];return(d.cls==="Generic"||cls.has(d.cls))&&(parseInt(d.cost,10)||0)<=aura+1}).length;
    return good>=2||pl.mulled?{type:"keep"}:{type:"mull"}}
  if(s.phase==="dawn"){if(s.dawnDone[pid])return null;const base=AI.evaluate(s,pid);let best={type:"dawnDone"},bv=base+1.5;
    E.options(s,pid).filter(o=>o.type==="gem").forEach(o=>{const c=E.clone(s);E.act(c,pid,o);const v=AI.evaluate(c,pid);if(v>bv){bv=v;best=o}});return best}
  if(s.phase==="town"){const opts=E.options(s,pid);if(!opts.length)return null;
    /* simulate each Town choice and keep the best real improvement */
    const base=AI.evaluate(s,pid);let best={type:"leave"},bv=base+0.3;
    for(const o of opts){if(o.type==="leave")continue;const c=E.clone(s);const r=E.act(c,pid,o);if(!r.ok)continue;settleSim(c,pid);
      let v=AI.evaluate(c,pid);if(o.type==="inn"){const h0=E.find(s,o.hero).o,h1=E.find(c,o.hero).o;const gain=(h0.dmg||0)-(h1.dmg||0);if(gain<=0||h1.dead)continue}
      if(v>bv){bv=v;best=o}}
    return best}
  if(s.phase!=="battle"||s.prio!==pid)return null;
  const opts=E.options(s,pid).filter(o=>!["clear","manualAbility","fix"].includes(o.type));
  const actor0=E.actorFor(s,pid);
  const base=AI.evaluate(s,pid);let best={type:"pass"},bv=base+0.4;let alt=null,av=-1e9;
  pl.t.aiActs=(pl.t.aiActs||0);
  if(pl.t.aiActs>30)return{type:"pass"};
  for(const o of opts){if(o.type==="pass")continue;
    if(o.type==="play"){const c=pl.hand.find(x=>x.uid===o.uid);if(c&&!E.isScripted(E.DB[c.id].name)&&E.DB[c.id].kind!=="equip"&&E.DB[c.id].type!=="Item"&&E.DB[c.id].sup!=="Hidden")continue}
    if(o.type==="soul"&&o.ch===4&&s.round<2)continue;
    const acts=AI.expand(s,pid,o);
    for(const a of acts){const c=E.clone(s);const r=E.act(c,pid,a);if(!r.ok)continue;settleSim(c,pid);
      let v=AI.evaluate(c,pid);
      if(a.type==="soul")v-=6;
      /* exhausting the acting Hero while it could still spend Aura on cards wastes that Aura */
      if(actor0&&!actor0.ex){const a1=E.find(c,actor0.uid);if(a1&&a1.o.ex&&!a1.o.dead)v-=0.7*castable(c,pid,a1.o)}
      if(a.type==="step")v-=1;
      if(a.type==="play"){const d=E.DB[(pl.hand.find(x=>x.uid===a.uid)||{}).id]||{};if(d.sup==="Hidden")v+=.6;if(d.type==="Item"&&d.sub!=="Arrow")v+=.6}
      v+=E.rnd({rng:(s.seq*7919+v*1000)|0})*0.3;
      if(v>bv){bv=v;best=a}
      if(a.type!=="soul"&&a.type!=="step"&&v>av){av=v;alt=a}}}
  /* passing ends your round: if another ready Hero could still use Aura later, take the least-bad action instead */
  if(best.type==="pass"&&alt&&av>=base-1.5&&laterUse(s,pid))best=alt;
  if(best.type!=="pass")pl.t.aiActs++;
  return best};
})(typeof window!=="undefined"?window:globalThis);
