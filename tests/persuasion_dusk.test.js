/* Nov 17, 2026: Arrow of Persuasion ends at Dusk (nothing carries into the next round). Run: node tests/persuasion_dusk.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;
const filler=Object.fromEntries(["Precognition","Humble","Vandalize","Disarm","Naturalize","Shatter","Inspiration","Level Up","Block Progress","Reclaim","Exile","Delevel","Snuff Out","Search for Knowledge","Dissipate","Potion","Antidote"].map(n=>[n,3]));
const d0={name:"A",heroes:["h:Shadow Ranger","h:Beast Tracker","h:Divine Knight"],cards:filler},d1={name:"B",heroes:["h:Divine Knight","h:Arcane Scholar","h:Bloodhowl"],cards:filler};
const s=E.newGame({seed:3,players:[{name:"A",deck:d0},{name:"B",deck:d1}]});
E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});
s.p.forEach(p=>{p.aura=20});s.prio=0;s.passed=[false,false];
const o=E.invObj(s,0,{uid:"aop",id:"Arrow of Persuasion",owner:0});s.p[0].inv.push(o);
const u=E.options(s,0).find(x=>x.type==="use"&&x.uid==="aop");if(!u){console.log('FAIL: Arrow not usable');process.exit(1)}
const tgt=s.p[1].heroes[1], mine=s.p[0].heroes[2];
E.act(s,0,Object.assign({},u,{targets:[tgt.uid,mine.uid]}));let g=0;while(s.pend.length&&g++<20){const pr=s.pend[0];E.act(s,pr.pid,ctx.CQAI.choose(s,pr.pid))}
if(E.forcedTarget(s,tgt)!==mine.uid){console.log('FAIL: not forced this round');process.exit(1)}
// both pass to end round
for(let i=0;i<200&&s.round===1&&!s.over;i++){const pr=s.pend[0];if(pr){E.act(s,pr.pid,ctx.CQAI.choose(s,pr.pid));continue}
  if(s.phase==="battle"){E.act(s,s.prio,{type:"pass"})}else if(s.phase==="town"){const p=s.town?s.town.order[s.town.i]:0;const op=E.options(s,p);const lv=op.find(x=>/leave|done|town/i.test(x.type))||op[0];E.act(s,p,lv)}else if(s.phase==="dawn"){[0,1].forEach(p=>{if(!s.dawnDone[p])E.act(s,p,{type:"dawnDone"})})}else break}
if(s.round!==2||tgt.fl.forceAtk||E.forcedTarget(s,tgt)){console.log('FAIL: carried into round 2');process.exit(1)}
[0,1].forEach(p=>{if(s.phase==="dawn"&&!s.dawnDone[p])E.act(s,p,{type:"dawnDone"})});
const att=E.options(s,1).some(o=>o.type!=='attack');console.log('PASS persuasion_dusk (forced in round 1, cleared at Dusk, free in round 2)');
