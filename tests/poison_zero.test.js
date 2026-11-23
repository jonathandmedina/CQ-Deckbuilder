/* Nov 22, 2026: Poisonous needs damage dealt (Dark Fang hitting for 0 after Humble or DEF doesn't Poison). A status verb ("...and stun it") still applies when the damage is blocked. Run: node tests/poison_zero.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Dynamite","Precognition","Inspiration","Level Up","Naturalize","Shatter","Vandalize","Smoke Bomb","Revitalize","Humble","Snuff Out"].map(n=>[n,3]));
const mk=()=>{const s=E.newGame({seed:5,players:[{name:"A",deck:{name:"A",heroes:["h:Dark Fang","h:Dark Channeler","h:Venom Dancer"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:King of Curses","h:Essence Reaper","h:Hexcaster"],cards:filler}}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});return s};
/* Dark Fang hits for 2 with no DEF: Poisons; hits for 0 (Humble sets Strength to 0): no Poison; 2 into 3 DEF: no Poison */
let s=mk();let f=s.p[0].heroes[0],t=s.p[1].heroes[0];
E.damage(s,f,t,2,{combat:true});ok((t.st.poison||0)===1,"2 damage Poisons once ("+t.st.poison+")");
s=mk();f=s.p[0].heroes[0];t=s.p[1].heroes[0];E.damage(s,f,t,0,{combat:true});ok(!(t.st.poison>0),"0 damage (Humble): no Poison ("+t.st.poison+")");
s=mk();f=s.p[0].heroes[0];t=s.p[1].heroes[0];t.bon=t.bon||{};t.mods=(t.mods||[]).concat([{def:5,until:"dusk"}]);E.damage(s,f,t,2,{combat:true});const L=s.log.map(l=>l.m).join("\n");
ok(/0 damage/.test(L)&&!(t.st.poison>0),"blocked by DEF: no Poison ("+t.st.poison+")");
/* Ice Jab: "Deal 3 Ice damage to any target and stun it." into 9 DEF: 0 damage, still Stunned */
{const s2=E.newGame({seed:9,players:[{name:"A",deck:{name:"A",heroes:["h:Arcane Scholar","h:Dark Channeler","h:Venom Dancer"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:King of Curses","h:Essence Reaper","h:Hexcaster"],cards:filler}}]});
 E.act(s2,0,{type:"keep"});E.act(s2,1,{type:"keep"});E.act(s2,0,{type:"dawnDone"});E.act(s2,1,{type:"dawnDone"});
 const pl=s2.p[0],tg=s2.p[1].heroes[0];tg.mods=(tg.mods||[]).concat([{def:9,until:"dusk"}]);s2.prio=0;pl.aura=10;s2.init=0;
 const id=Object.keys(E.DB).find(k=>E.DB[k].name==="Ice Jab");pl.hand.push({uid:"ij1",id,owner:0});
 const op=E.options(s2,0).find(o=>o.type==="play"&&o.uid==="ij1");ok(!!op,"Ice Jab playable");
 if(op){const a=Object.assign({},op,{t:[tg.uid],targets:[tg.uid]});let r=E.act(s2,0,Object.assign({},op,{targets:[tg.uid]}));ok(r.ok,"Ice Jab played "+(r.err||""));let g=0;
  while(s2.pend.length&&g++<20){const q=s2.pend[0];if(q.type==="target"||q.type==="tgt"||q.opts){const i=(q.opts||[]).findIndex(o=>o.v===tg.uid);if(i>=0){E.act(s2,q.pid,{type:q.type==="ask"?"ask":q.type,i,uid:tg.uid});continue}}
   const x=ctx.CQAI.respond?ctx.CQAI.respond(s2,q.pid,q):null;if(!x)break;E.act(s2,q.pid,x)}
  const L=s2.log.map(l=>l.m).join("\n");const hitT=/Ice Jab|Ice damage/.test(L);
  const st=s2.p.flatMap(p=>p.heroes).filter(h=>h.st.stun>0).map(h=>h.name);
  ok(/deals 0 Ice damage/.test(L),"blocked to 0: "+(L.split("\n").filter(x=>/Ice/.test(x)).join(" | ")));ok(st.length>=1,"still Stunned: "+st.join(","))}}
console.log(`poison zero: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
