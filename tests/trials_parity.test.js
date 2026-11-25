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

/* Sweep (Update 51: a Trials boss is an enemy, not a Hero). For every live (not deprecated) scripted slot that can pick an enemy Hero in 1-on-1:
   "enemy" / "any" slots must also be able to pick the boss in a Trial; "hero" / "enemyHero" slots must not. */
const ENEMY_KINDS=new Set(["any","enemy","anyOther","anyOrDeadAlly"]),HERO_KINDS=new Set(["hero","enemyHero"]);
/* legit exceptions: the card needs something the boss can't have */
const EXEMPT={"Entangling Roots":"needs a second enemy Hero next to the target; the boss stands alone"};
const live=n=>{const d=E.DB[n]||E.DB["h:"+n];return d&&!d.dep};
const slots=[];
for(const n in S){const x=S[n];(x.t||[]).forEach((sp,i)=>slots.push({n,src:"play",i,sp}));if(x.act&&x.act.t)x.act.t.forEach((sp,i)=>slots.push({n,src:"act",i,sp}))}
for(const n in H)(H[n]||[]).forEach((ab,j)=>(ab.t||[]).forEach((sp,i)=>slots.push({n,src:"ability "+j,i,sp})));
const d=duel(9),s=trial(9);const dA=d.p[0].heroes[0],tA=s.p[E.parties(s)[0]].heroes[0];const tme=E.parties(s)[0];
let checked=0,misses=[],leaks=[];
for(const sl of slots){const k=sl.sp.k;if((!ENEMY_KINDS.has(k)&&!HERO_KINDS.has(k))||EXEMPT[sl.n]||!live(sl.n))continue;const card=E.DB[sl.n]||E.DB["h:"+sl.n]||{};
  let dc=[],tc=[];try{dc=E.candidates(d,0,sl.sp,{actor:dA,card})}catch(e){}try{tc=E.candidates(s,tme,sl.sp,{actor:tA,card})}catch(e){}
  if(!d.p[1].heroes.some(h=>dc.includes(h.uid)))continue;checked++;const hasBoss=tc.includes(boss(s).uid);
  if(ENEMY_KINDS.has(k)&&!hasBoss)misses.push(`${sl.n} (${sl.src} slot ${sl.i}, ${k})`);
  if(HERO_KINDS.has(k)&&hasBoss)leaks.push(`${sl.n} (${sl.src} slot ${sl.i}, ${k})`)}
ok(checked>50,"sweep checked "+checked+" slots");
ok(!misses.length,"enemy/any slots that can't pick the boss: "+misses.join("; "));
ok(!leaks.length,"Hero-only slots that still pick the boss: "+leaks.join("; "));

/* Update 51 cards in a Trial */
const run=(s,me,name,targets)=>{const a=s.p[me].heroes.find(h=>!h.dead);const sc=S[name]||S['"'+name+'"'];const dd=E.DB[name]||E.DB['"'+name+'"'];return sc.run(E.mkCtx(s,me,a,dd,{uid:"x"+name+Math.random(),id:name,owner:me},targets||[]))};
{const s=trial(21);const me=E.parties(s)[0],b=boss(s);s.trials.plates=0;ctx.CQT.syncDef(s);const g=golems(s).find(o=>o.fl.vs===me);
 const mine=s.p[me].heroes.map(h=>h.dmg||0),hp0=E.hp(s,b),g0=E.hp(s,g);run(s,me,"Hail");
 ok(E.hp(s,b)===hp0-1&&E.hp(s,g)===g0-1,"Hail hits the boss and Golems");ok(s.p[me].heroes.every((h,i)=>(h.dmg||0)===mine[i]),"Hail skips your own Heroes");
 const hpB=E.hp(s,b);run(s,me,"Chain Lightning");ok(E.hp(s,b)===hpB,"Chain Lightning (each enemy Hero) no longer hits the boss");
 b.dmg=10;const h1=E.hp(s,b);run(s,me,"Song of Healing");ok(E.hp(s,b)===h1,"Song of Healing no longer heals the boss");
 const hpS=E.hp(s,b);run(s,me,"Storm of Insight");ok(E.hp(s,b)<hpS,"Storm of Insight (each enemy) hits the boss")}
{const s=trial(23);const me=E.parties(s)[0],b=boss(s);const g=golems(s).find(o=>o.fl.vs===me);
 run(s,me,"Mark of Doom",[b.uid]);ok(b.ench.some(e=>e.name==="Mark of Doom"),"Mark of Doom enchants the boss");
 run(s,me,"Mark of Doom",[g.uid]);ok((g.ench||[]).some(e=>e.name==="Mark of Doom"),"Mark of Doom enchants a Golem");
 ok(E.find(s,g.ench[0].uid)&&E.find(s,g.ench[0].uid).zone==="ench","the Golem's enchantment can be found");
 const hb=E.hp(s,b),hg=E.hp(s,g);for(let k=0;k<20&&s.phase==="battle";k++){if(s.pend.length){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(a)E.act(s,pr.pid,a);else s.pend.shift();continue}E.act(s,s.prio,{type:"pass"})}
 ok(E.hp(s,b)<=hb-1,"Mark of Doom ticks on the boss at Dusk");ok(!s.p[s.trials.boss].bf.includes(g)||E.hp(s,g)<=hg-1,"Mark of Doom ticks on the Golem at Dusk")}
{const s=trial(25);const me=E.parties(s)[0];const g=golems(s).find(o=>o.fl.vs===me);run(s,me,"Mark of Doom",[g.uid]);const mark=g.ench[0];E.destroyObj(s,g);
 ok(s.p[me].disc.some(x=>x.uid===mark.uid||x.id==="Mark of Doom"),"a destroyed Golem's Mark of Doom goes to its owner's discard pile")}
console.log(`trials parity: ${pass} passed, ${fail} failed (${checked} enemy slots swept)`);process.exit(fail?1:0);
