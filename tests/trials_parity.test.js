/* Trials parity (Nov 23, 2026): the shared engine must reach the boss side the same way it reaches a 1-on-1 opponent.
   1) Pain Pillar and Spell Damage Pillar work in a Trial. 2) Sweep: every scripted card/ability slot that can pick an enemy Hero
   in a 1-on-1 game can pick the boss in a Trial. Run on every engine change: node tests/trials_parity.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","trials-data.js","play-engine.js","play-trials.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE,S=ctx.CQ_SCRIPTS,H=ctx.CQ_HERO_SCRIPTS;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");
const ST=vm.runInNewContext("("+ui.match(/const STARTERS=(\[[\s\S]*?\]);/)[1]+")"),SL=vm.runInNewContext("("+ui.match(/const STARTER_LISTS=(\[[\s\S]*?\]);\nfunction starterDeck/)[1]+")");
const deck2=i=>({name:ST[i].name+" (2)",heroes:ST[i].heroes.slice(0,2).map(n=>"h:"+n),cards:Object.assign({},SL[i])});
const deck3=i=>({name:ST[i].name,heroes:ST[i].heroes.map(n=>"h:"+n),cards:Object.assign({},SL[i])});
function trial(seed){const s=E.newGame({seed,trials:{trial:1,parties:[deck2(0),deck2(1)]}});E.parties(s).forEach(p=>E.act(s,p,{type:"keep"}));
  for(let g=0;g<20&&s.phase==="dawn";g++){E.parties(s).forEach(p=>{if(!s.dawnDone[p])E.act(s,p,{type:"dawnDone"})});E.settle(s)}return s}
function duel(seed){const s=E.newGame({seed,players:[{name:"A",deck:deck3(0)},{name:"B",deck:deck3(1)}]});E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});return s}
const boss=s=>s.p[s.trials.boss].heroes[0];
const golems=s=>s.p[s.trials.boss].bf.filter(o=>o.spawn);

/* enemySides */
{const s=trial(3);ok(JSON.stringify(E.enemySides(s,0))==="[2]"&&JSON.stringify(E.enemySides(s,1))==="[2]","Trials: enemy side is the boss");
 ok(JSON.stringify(E.enemySides(s,2))==="[0,1]","boss's enemies are both parties");const d=duel(3);ok(JSON.stringify(E.enemySides(d,0))==="[1]"&&JSON.stringify(E.enemySides(d,1))==="[0]","1-on-1 unchanged")}

/* Pain Pillar at Dusk in a Trial: the prompt shows, lists the boss and your own Golem (not another party's while yours lives) */
{const s=trial(5);const me=E.parties(s)[0];for(let i=0;i<3;i++)E.makePillar(s,me,"Pain Pillar");
 let g=0;while(s.phase==="battle"&&!s.pend.some(p=>p.op==="painPillar")&&g++<20){if(s.pend.length){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(a)E.act(s,pr.pid,a);else s.pend.shift();continue}E.act(s,s.prio,{type:"pass"})}
 const pr=s.pend.find(p=>p.op==="painPillar");ok(pr&&pr.pid===me,"Pain Pillar prompt shows in a Trial");
 if(pr){const vs=pr.opts.map(o=>o.v);const b=boss(s);ok(vs.includes(b.uid),"prompt lists the boss");
  const mine=golems(s).find(o=>o.fl.vs===me),theirs=golems(s).find(o=>o.fl.vs!==me);ok(mine&&vs.includes(mine.uid),"prompt lists your own Golem");ok(!theirs||!vs.includes(theirs.uid),"not another party's Golem while yours lives");
  ok(!s.p.slice(0,2).some(pl=>pl.heroes.some(h=>vs.includes(h.uid))),"no player Heroes");
  const hp0=E.hp(s,b);while(s.pend[0]&&s.pend[0].op==="painPillar"){const q=s.pend[0];E.act(s,q.pid,{type:"ask",i:q.opts.findIndex(o=>o.v===b.uid)})}
  ok(hp0-E.hp(s,b)===3,"3 triggers at the boss: it loses 3 Health Points")}}

/* Spell Damage Pillar: a spell at the boss deals 2 more with one in play */
function bolt(pil){const s=trial(7);const me=E.parties(s)[0];if(pil)E.makePillar(s,me,"Spell Damage Pillar");const b=boss(s);s.trials.plates=0;ctx.CQT.syncDef(s);
  const a=s.p[me].heroes.find(h=>!h.dead);const hp0=E.hp(s,b);S["Lightning Bolt"].run(E.mkCtx(s,me,a,E.DB["Lightning Bolt"],{uid:"xLB",id:"Lightning Bolt",owner:me},[b.uid]));return hp0-E.hp(s,b)}
{const w=bolt(false),p=bolt(true);ok(w>0,"Lightning Bolt hits the boss ("+w+")");ok(p-w===2,"Spell Damage Pillar adds 2 against the boss ("+w+" -> "+p+")")}

/* Sweep: any slot that can pick an enemy Hero in 1-on-1 must be able to pick the boss in a Trial */
const KINDS=new Set(["any","enemy","hero","enemyHero","anyOther","anyOrDeadAlly"]);
/* legit exceptions: the card needs something the boss can't have */
const EXEMPT={"Entangling Roots":"needs a second enemy Hero next to the target; the boss stands alone"};
const slots=[];
for(const n in S){const x=S[n];(x.t||[]).forEach((sp,i)=>slots.push({n,src:"play",i,sp}));if(x.act&&x.act.t)x.act.t.forEach((sp,i)=>slots.push({n,src:"act",i,sp}))}
for(const n in H)(H[n]||[]).forEach((ab,j)=>(ab.t||[]).forEach((sp,i)=>slots.push({n,src:"ability "+j,i,sp})));
const d=duel(9),s=trial(9);const dA=d.p[0].heroes[0],tA=s.p[E.parties(s)[0]].heroes[0];const tme=E.parties(s)[0];
let checked=0,misses=[];
for(const sl of slots){if(!KINDS.has(sl.sp.k)||EXEMPT[sl.n])continue;const card=E.DB[sl.n]||E.DB["h:"+sl.n]||{};
  let dc=[],tc=[];try{dc=E.candidates(d,0,sl.sp,{actor:dA,card})}catch(e){}try{tc=E.candidates(s,tme,sl.sp,{actor:tA,card})}catch(e){}
  const dEnemyHero=d.p[1].heroes.some(h=>dc.includes(h.uid));if(!dEnemyHero)continue;checked++;
  if(!tc.includes(boss(s).uid))misses.push(`${sl.n} (${sl.src} slot ${sl.i}, ${sl.sp.k})`)}
ok(checked>50,"sweep checked "+checked+" slots");
ok(!misses.length,"slots that reach an enemy Hero in 1-on-1 but not the boss: "+misses.join("; "));
console.log(`trials parity: ${pass} passed, ${fail} failed (${checked} enemy slots swept)`);process.exit(fail?1:0);
