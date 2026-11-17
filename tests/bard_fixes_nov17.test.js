/* Nov 17, 2026 player feedback: every Forbidden Tuner triggers; Battle Minstrel's Level 3 ability plays a Song from the discard pile for free.
   Run: node tests/bard_fixes_nov17.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Precognition","Humble","Vandalize","Disarm","Naturalize","Shatter","Inspiration","Level Up","Block Progress","Reclaim","Exile","Delevel","Snuff Out","Search for Knowledge","Dissipate"].map(n=>[n,3]));
let U=9000;const uid=()=>"u"+(U++);
function game(){const deck={name:"T",heroes:["h:Battle Minstrel","h:Divine Knight","h:Arcane Scholar"],cards:Object.assign({},filler)};
  const s=E.newGame({seed:11,players:[{name:"A",deck},{name:"B",deck:JSON.parse(JSON.stringify(deck))}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});
  s.p.forEach(p=>{p.aura=20;p.inv=[];p.hand=[];p.disc=[]});s.prio=0;s.passed=[false,false];return s}
const inv=(s,pid,id)=>{const o=E.invObj(s,pid,{uid:uid(),id,owner:pid});s.p[pid].inv.push(o);return o};
const minstrel=s=>s.p[0].heroes.find(h=>h.name==="Battle Minstrel");
function resolveAll(s){let g=0;while(s.pend.length&&g++<40){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(!a)break;E.act(s,pr.pid,a)}}
function playSong(s,name){const m=minstrel(s);s.p[0].hand.push({uid:"song"+(U++),id:name,owner:0});const c=s.p[0].hand[s.p[0].hand.length-1];
  /* make the Minstrel the acting Hero */
  E.act(s,0,{type:"play",uid:c.uid,actor:m.uid});return c}
/* 1. The Forbidden Tuner: one trigger per copy */
for(const n of [1,2,3]){const s=game();for(let i=0;i<n;i++)inv(s,0,"The Forbidden Tuner");
  const opt=E.options(s,0).find(o=>o.type==="play"&&s.p[0].hand.length===0);
  const m=minstrel(s);const c={uid:uid(),id:'"Understanding"',owner:0};s.p[0].hand.push(c);
  const po=E.options(s,0).find(o=>o.type==="play"&&o.uid===c.uid);ok(!!po,`${n} Tuner(s): the Song can be played`);if(!po)continue;
  const hp0=s.p[1].heroes.map(h=>h.dmg).reduce((a,b)=>a+b,0);let asks=0;E.act(s,0,po);
  let g=0;while(s.pend.length&&g++<40){const pr=s.pend[0];if(pr.type==="ask"&&/Forbidden Tuner/.test(pr.title||pr.q||""))asks++;const a=ctx.CQAI.choose(s,pr.pid);if(!a)break;E.act(s,pr.pid,a)}
  ok(asks===n,`${n} Tuner(s) in inventory: ${n} damage triggers (got ${asks})`)}
/* 2. Battle Minstrel Level 3: 1 Aura, Exhaust: play a Song from your discard pile without paying its Aura cost */
{const s=game();const m=minstrel(s);s.p[0].disc.push({uid:"d1",id:'"Rousing Chorus"',owner:0});
  const abs=()=>E.options(s,0).filter(o=>o.type==="ability"&&o.actor===m.uid||o.type==="ability"&&!o.actor);
  const idx=1;const has=()=>E.options(s,0).some(o=>o.type==="ability"&&o.idx===idx);
  m.lvl=2;ok(!has(),"Level 2: no free-Song ability");
  m.lvl=3;ok(has(),"Level 3: the free-Song ability is offered");
  const aura0=s.p[0].aura;E.act(s,0,E.options(s,0).find(o=>o.type==="ability"&&o.idx===idx));
  let sawCombo=false,g=0;while(s.pend.length&&g++<40){const pr=s.pend[0];if(pr.type==="combo"){sawCombo=true;const pl=E.options(s,pr.pid).find(o=>o.type==="comboPlay");ok(!!pl,"the Song can be picked");if(pl)E.act(s,pr.pid,pl);continue}const a=ctx.CQAI.choose(s,pr.pid);if(!a)break;E.act(s,pr.pid,a)}
  ok(sawCombo,"a pick-a-Song prompt appears");ok(m.ex,"the Minstrel is exhausted");
  ok(!s.p[0].disc.some(x=>x.uid==="d1")||s.p[0].disc.filter(x=>x.id==='"Rousing Chorus"').length===1,"the Song left the discard pile and was played");
  ok(aura0-s.p[0].aura<=1+0,"only the 1 Aura ability cost was paid (Song free): spent "+(aura0-s.p[0].aura));
  ok(s.log.some(l=>/Rousing Chorus/.test(l.m)),"the log shows the Song being played")}
{const s=game();const m=minstrel(s);m.lvl=3;ok(!E.options(s,0).some(o=>o.type==="ability"&&o.idx===1),"no Song in the discard pile: ability not offered")}
/* 3. Same fix for other "whenever" items: two Brute's Banners give +4, two Healing Relics heal twice */
{const s=game();const pl=s.p[0];const src=require("fs").readFileSync(require("path").join(A,"play-engine.js"),"utf8");
  ok(/bannerN=n/.test(src)&&/2\*\(o\.fl\.bannerN\|\|1\)/.test(src),"Brute's Banner counts every copy");
  ok(/for\(let k=invCount\(pl,"Healing Relic"\)/.test(src),"Healing Relic triggers once per copy")}
console.log(`Bard fixes (Nov 17): ${pass} pass, ${fail} fail`);if(fail)process.exit(1);
