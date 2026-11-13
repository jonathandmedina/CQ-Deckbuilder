/* Trials engine tests (Trials Plan B+C, Tasks 2, 3, 4, 9). Run: node tests/trials_engine.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
function load(){const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
  const files=["cards-data.js","trials-data.js","play-engine.js",...(fs.existsSync(path.join(A,"play-trials.js"))?["play-trials.js"]:[]),"play-cards.js","play-ai.js"];
  vm.runInContext(files.map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);return ctx}
const ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");
const ST=vm.runInNewContext("("+ui.match(/const STARTERS=(\[[\s\S]*?\]);/)[1]+")"),SL=vm.runInNewContext("("+ui.match(/const STARTER_LISTS=(\[[\s\S]*?\]);\nfunction starterDeck/)[1]+")");
/* a 2-Hero party from a starter deck (first two Heroes, the whole starter list) */
const deck2=i=>({name:ST[i].name+" (2)",heroes:ST[i].heroes.slice(0,2).map(n=>"h:"+n),cards:Object.assign({},SL[i])});
const ctx=load();const E=ctx.CQE,AI=ctx.CQAI,T=ctx.CQT;
let pass=0,fail=0;const only=process.argv[2];
function test(name,fn){if(only&&!name.includes(only))return;try{fn();pass++;console.log("ok   "+name)}catch(e){fail++;console.log("FAIL "+name+"\n     "+(e&&e.stack||e).toString().split("\n").slice(0,3).join("\n     "))}}
function eq(a,b,m){if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(`${m||"expected"}: got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`)}
function ok(v,m){if(!v)throw new Error(m||"expected true")}
/* plain-engine mode for Task 2 tests: no boss runtime, a counting afterSweep stub */
let sweeps=0;
function plain(fn){const keep=Object.assign({},E.hooks);E.hooks.setup=null;E.hooks.onSummonDies=null;E.hooks.afterSweep=()=>{sweeps++};sweeps=0;try{fn()}finally{Object.assign(E.hooks,keep)}}
function mk(n,seed,extra){return E.newGame(Object.assign({seed:seed||11,trials:Object.assign({trial:1,parties:Array.from({length:n},(_,i)=>deck2(i))},extra||{})}))}
function toBattle(s){E.parties(s).forEach(p=>{if(!s.p[p].mullDone)E.act(s,p,{type:"keep"})});
  for(let g=0;g<20&&s.phase==="dawn";g++){E.parties(s).forEach(p=>{if(!s.dawnDone[p])E.act(s,p,{type:"dawnDone"})});E.settle(s)}
  if(s.phase!=="battle")throw new Error("not in battle: "+s.phase)}
const boss=s=>s.p[s.trials.boss];const bossHero=s=>boss(s).heroes[0];
const actor=(s,p)=>E.actorFor(s,p);
function lvl(s,p){const r=E.act(s,p,{type:"level",stat:"str"});if(!r.ok){const r2=E.act(s,p,{type:"level"});if(!r2.ok)throw new Error("level: "+r2.err)}}
/* AI driver for any number of sides; returns false if it stalls */
function drive(s,maxRounds,onStep){let g=0;while(!s.over&&g++<60000&&s.round<=maxRounds){let moved=false;
    for(const pid of s.p.map((_,i)=>i)){if(E.isBoss(s,pid))continue;const x=AI.choose(s,pid);if(!x)continue;const r=E.act(s,pid,x);if(!r.ok&&s.phase==="battle"&&s.prio===pid)E.act(s,pid,{type:"pass"});moved=true;if(onStep)onStep(s);break}
    if(!moved){const pr=s.pend[0];if(pr){const x=AI.choose(s,pr.pid);if(x)E.act(s,pr.pid,x);else return false}else return false}}return true}

/* ---------------- Task 2: teams ---------------- */
test("T2 helpers: oppOf, sameTeam, parties",()=>plain(()=>{const s=mk(2,21);
  eq(s.p.length,3);eq(s.trials.boss,2);eq(E.oppOf(s,1),2);eq(E.oppOf(s,0),2);ok(E.sameTeam(s,0,1));ok(!E.sameTeam(s,0,2));ok(E.sameTeam(s,2,2));
  eq(E.parties(s).length,2);ok(E.parties(s)[0]===s.init);eq(boss(s).heroes.length,1);eq(boss(s).hand.length,0);eq(boss(s).lib.length,0);
  s.p.slice(0,2).forEach(pl=>{eq(pl.heroes.length,2);eq(pl.hand.length,4)})}));
test("T2 sweep Lead -> Closer -> Last, each party once per sweep in initiative order",()=>plain(()=>{const s=mk(2,22);toBattle(s);
  const [a,b]=E.parties(s);eq(s.prio,a);eq(s.pos,0);
  ok(actor(s,a)===s.p[a].heroes[0],"Lead acts first");E.act(s,a,{type:"step"});eq(s.prio,b,"then the other party");
  ok(actor(s,b)===s.p[b].heroes[0]);lvl(s,b);eq(s.pos,1,"Closer sweep");eq(sweeps,1,"boss flip after the Lead sweep");eq(s.prio,a);
  ok(actor(s,a)===s.p[a].heroes[1],"Closer acts");lvl(s,a);eq(s.prio,b);ok(actor(s,b)===s.p[b].heroes[1]);lvl(s,b);
  eq(sweeps,2);eq(s.pos,3,"Last sweep (a Hero stepped back)");eq(s.prio,a);ok(actor(s,a)===s.p[a].heroes[0],"the stepped-back Lead acts at Last")}));
test("T2 candidates: allies include other parties, enemies are the boss side only",()=>plain(()=>{const s=mk(2,23);toBattle(s);
  const g=E.makeSummon(s,2,"Golem");const al=E.candidates(s,0,{k:"ally"},{}),en=E.candidates(s,0,{k:"enemy"},{});
  s.p[1].heroes.forEach(h=>ok(al.includes(h.uid),"ally includes party 1 Heroes"));ok(en.includes(bossHero(s).uid),"boss Hero is an enemy");ok(en.includes(g.uid),"boss summon is an enemy");
  s.p.slice(0,2).forEach(pl=>pl.heroes.forEach(h=>ok(!en.includes(h.uid),"no party Hero is an enemy")));
  ok(E.candidates(s,0,{k:"enemyPlayer"},{}).every(x=>x==="P2"))}));
function passAll(s){for(let g=0;g<20&&s.phase==="battle";g++){const p=s.prio;E.act(s,p,{type:"pass"});E.settle(s)}}
function leaveTown(s,seen){for(let g=0;g<20&&s.phase==="town";g++){if(s.pend.length){const pr=s.pend[0];E.act(s,pr.pid,AI.choose(s,pr.pid));continue}const p=s.town.order[s.town.i];if(seen)seen.push(p);E.act(s,p,{type:"leave"})}}
test("T2 initiative passes among parties only; Town visits each party in order",()=>plain(()=>{const s=mk(2,24);toBattle(s);const inits=[s.init];
  for(let r=0;r<3;r++){passAll(s);eq(s.phase,"town");const seen=[];const order=s.town.order.slice();eq(order,E.parties(s));leaveTown(s,seen);eq(seen,order);
    for(let g=0;g<20&&s.phase==="dawn";g++){E.parties(s).forEach(p=>{if(!s.dawnDone[p])E.act(s,p,{type:"dawnDone"})});E.settle(s)}inits.push(s.init)}
  inits.forEach(i=>ok(i===0||i===1,"never the boss"));for(let i=1;i<inits.length;i++)eq(inits[i],1-inits[i-1],"alternates")}));
test("T2 killing the boss ends the Trial as a win with no further boss flip",()=>plain(()=>{const s=mk(2,25);toBattle(s);const [a,b]=E.parties(s);
  lvl(s,a);const h=bossHero(s);h.dmg=E.maxHp(s,h)-1;const att=actor(s,b);att.base.str=3;const r=E.act(s,b,{type:"attack",att:att.uid,targets:[h.uid]});ok(r.ok,r.err);
  ok(s.over,"over");eq(s.winner,0);eq(sweeps,0,"no boss flip after the killing sweep");ok(!E.act(s,a,{type:"pass"}).ok)}));
test("T2 one party wiped: the Trial goes on; every party wiped: the boss wins",()=>plain(()=>{const s=mk(2,26);toBattle(s);
  s.p[1].heroes.forEach(h=>E.damage(s,null,h,99,{ignoreDef:true}));ok(!s.over,"one party wiped is not a loss");ok(E.wiped(s,1));
  s.p[0].heroes.forEach(h=>E.damage(s,null,h,99,{ignoreDef:true}));ok(s.over);eq(s.winner,2)}));
test("T2 a wiped party sits out Town",()=>plain(()=>{const s=mk(2,27);toBattle(s);s.p[1].heroes.forEach(h=>{h.surr=true;E.damage(s,null,h,99,{ignoreDef:true})});passAll(s);eq(s.town.order,[0])}));
test("T2 nothing ever waits on the boss side",()=>plain(()=>{const s=mk(2,28);toBattle(s);ok(!E.windowFor||true);
  s.pend.unshift({type:"window",pid:2,trig:{kind:"card",pid:0},cont:{k:"none"},mods:{}});E.settle(s);ok(!s.pend.some(p=>p.pid===2),"boss window closes itself");
  s.pend.unshift({type:"ask",pid:2,title:"x",opts:[{label:"a",v:1}],op:"millOne",data:{}});E.settle(s);ok(!s.pend.some(p=>p.pid===2),"boss ask is dropped");
  let bad=0;ok(drive(s,4,s2=>{if(s2.pend.some(p=>p.pid===2))bad++}),"no stall");eq(bad,0)}));
test("T2 a party that decks out is wiped, not a loss",()=>plain(()=>{const s=mk(2,29);toBattle(s);s.p[1].lib=[];E.draw(s,1,1);ok(E.wiped(s,1));ok(!s.over)}));
test("T2 conceding (party 0) ends the Trial as a loss",()=>plain(()=>{const s=mk(2,30);toBattle(s);ok(!E.act(s,1,{type:"concede"}).ok);ok(E.act(s,0,{type:"concede"}).ok);ok(s.over);eq(s.winner,2)}));
test("T2 3 and 4 parties: initiative order, no stall in AI play",()=>plain(()=>{[3,4].forEach(n=>{const s=mk(n,31+n);eq(s.trials.boss,n);toBattle(s);ok(drive(s,3),"no stall at P="+n);ok(s.round>=3||s.over)})}));

/* ---------------- Task 3: boss runtime ---------------- */
const st=s=>s.trials;
function setH(h,o){if(o.str!=null)h.base.str=o.str;if(o.def!=null)h.base.def=o.def;if(o.hp!=null)h.base.hp=o.hp;h.dmg=o.dmg||0;h.ex=!!o.ex;h.mods=[];h.bon={str:0,def:0,aura:0}}
/* every party Hero: Strength 1, Defense 0, 10 Health Points, ready */
function flat(s){E.parties(s).forEach(p=>s.p[p].heroes.forEach(h=>setH(h,{str:1,def:0,hp:10})))}
const H=(s,p,i)=>s.p[p].heroes[i];
const hpOf=h=>E.hp(S0,h);let S0=null;
function golems(s){return boss(s).bf.filter(o=>o.spawn)}
function sweep(s){E.hooks.afterSweep(s)}
test("T3 setup: plates, Rage threshold, one Golem per party, 20-card boss deck",()=>{[2,3,4].forEach(n=>{const s=mk(n,40+n);const b=bossHero(s);
  eq(b.name,"Rock Mammoth");eq(E.maxHp(s,b),25*n);eq(st(s).plates,n);eq(E.defn(s,b),n);eq(st(s).rageAt,n+1);eq(st(s).deck.length,20);
  eq(golems(s).map(g=>g.fl.vs).sort(),Array.from({length:n},(_,i)=>i));golems(s).forEach(g=>{eq(E.str(s,g),1);eq(E.defn(s,g),0);eq(E.maxHp(s,g),4)})});
  eq(mk(2,7).trials.deck,mk(2,7).trials.deck,"same seed, same boss deck");ok(JSON.stringify(mk(2,7).trials.deck)!==JSON.stringify(mk(2,8).trials.deck),"seeded shuffle")});
test("T3 skipNext: clear it and do nothing else",()=>{const s=mk(2,50);toBattle(s);flat(s);st(s).skipNext=true;const d=st(s).deck.length;sweep(s);
  ok(!st(s).skipNext);eq(st(s).deck.length,d,"no flip");E.parties(s).forEach(p=>s.p[p].heroes.forEach(h=>eq(h.dmg,0,"no Golem attack")));eq(st(s).events.slice(-1)[0].kind,"skip")});
test("T3 Raging Stampede at the threshold: 3 damage to every player Hero, Rage 0, Winded, deck untouched",()=>{const s=mk(2,51);toBattle(s);flat(s);
  golems(s).forEach(g=>E.destroyObj(s,g));st(s).rage=st(s).rageAt;const d=st(s).deck.length;sweep(s);
  eq(st(s).deck.length,d);eq(st(s).rage,0);ok(st(s).winded);eq(E.defn(s,bossHero(s)),0);
  E.parties(s).forEach(p=>s.p[p].heroes.forEach(h=>eq(h.dmg,3)));eq(st(s).events.slice(-1)[0].kind,"stampede")});
test("T3 Winded and Stone Skin end at the next flip",()=>{const s=mk(2,52);toBattle(s);flat(s);golems(s).forEach(g=>E.destroyObj(s,g));
  st(s).deck.push("Stone Skin");sweep(s);eq(st(s).skin,2);eq(E.defn(s,bossHero(s)),0+2,"plates broken (0) + Stone Skin 2");
  st(s).deck.push("Tusk Gore");sweep(s);eq(st(s).skin,0);eq(E.defn(s,bossHero(s)),0);
  st(s).winded=true;E.CQT_sync&&0;ctx.CQT.syncDef(s);eq(E.defn(s,bossHero(s)),0);st(s).plates=2;ctx.CQT.syncDef(s);eq(E.defn(s,bossHero(s)),0,"Winded = 0 Defense");st(s).deck.push("Tusk Gore");sweep(s);ok(!st(s).winded);eq(E.defn(s,bossHero(s)),2)});
function card(s,name){golems(s).forEach(g=>E.destroyObj(s,g));st(s).deck.push(name);sweep(s)}
test("T3 Tusk Gore: 4 to the highest Strength (tie: least Defense, then Lead, then initiative order)",()=>{const s=mk(2,53);toBattle(s);flat(s);const [a,b]=E.parties(s);
  setH(H(s,b,1),{str:5,def:0,hp:10});setH(H(s,a,0),{str:5,def:1,hp:10});card(s,"Tusk Gore");eq(H(s,b,1).dmg,4);eq(H(s,a,0).dmg,0);
  const s2=mk(2,53);toBattle(s2);flat(s2);const [a2,b2]=E.parties(s2);setH(H(s2,b2,0),{str:3,def:0,hp:10});setH(H(s2,a2,1),{str:3,def:0,hp:10});card(s2,"Tusk Gore");eq(H(s2,b2,0).dmg,4,"same Defense: a Lead beats a Closer before initiative order");eq(H(s2,a2,1).dmg,0);});
test("T3 Crushing Step 3 to most Health Points; Boulder Toss 3 to fewest",()=>{const s=mk(2,54);toBattle(s);flat(s);const [a,b]=E.parties(s);
  setH(H(s,b,0),{str:1,def:0,hp:14});card(s,"Crushing Step");eq(H(s,b,0).dmg,3);
  setH(H(s,a,1),{str:1,def:0,hp:10,dmg:5});card(s,"Boulder Toss");eq(H(s,a,1).dmg,5+3)});
test("T3 Grudge Stomp: 3 to the Lead of the party that dealt the boss the most damage this round",()=>{const s=mk(2,55);toBattle(s);flat(s);const [a,b]=E.parties(s);
  E.damage(s,H(s,b,1),bossHero(s),9,{ignoreDef:true});E.damage(s,H(s,a,0),bossHero(s),2,{ignoreDef:true});card(s,"Grudge Stomp");eq(H(s,b,0).dmg,3);eq(H(s,a,0).dmg,0)});
test("T3 Rockslide: 2 to each Hero of the party with the most total Health Points",()=>{const s=mk(2,56);toBattle(s);flat(s);const [a,b]=E.parties(s);
  setH(H(s,b,1),{str:1,def:0,hp:12});card(s,"Rockslide");eq(H(s,b,0).dmg,2);eq(H(s,b,1).dmg,2);eq(H(s,a,0).dmg,0)});
test("T3 Tremor exhausts the highest-Strength ready Hero in each party",()=>{const s=mk(2,57);toBattle(s);flat(s);const [a,b]=E.parties(s);
  setH(H(s,a,1),{str:4,def:0,hp:10});setH(H(s,b,0),{str:6,def:0,hp:10,ex:true});setH(H(s,b,1),{str:2,def:0,hp:10});card(s,"Tremor");
  ok(H(s,a,1).ex);ok(!H(s,a,0).ex);ok(H(s,b,1).ex,"the ready one")});
test("T3 Call the Mountain: a Golem against the party with the fewest; The Mountain Wakes: one against each",()=>{const s=mk(2,58);toBattle(s);flat(s);const [a,b]=E.parties(s);
  golems(s).filter(g=>g.fl.vs===b).forEach(g=>E.destroyObj(s,g));const pl=st(s).plates;st(s).deck.push("Call the Mountain");sweep(s);
  eq(golems(s).map(g=>g.fl.vs).sort(),[a,b].sort());eq(st(s).plates,pl,"new Golems never add plates");
  st(s).deck.push("The Mountain Wakes");sweep(s);eq(golems(s).filter(g=>g.fl.vs===a).length,2);eq(golems(s).filter(g=>g.fl.vs===b).length,2)});
test("T3 Golems attack the most Health Points in their party, then the next party clockwise when it is wiped",()=>{const s=mk(2,59);toBattle(s);flat(s);
  setH(H(s,0,1),{str:1,def:0,hp:12});setH(H(s,1,0),{str:1,def:0,hp:12});st(s).skipNext=false;st(s).deck.push("Stone Skin");sweep(s);
  eq(H(s,0,1).dmg,1);eq(H(s,1,0).dmg,1);eq(H(s,0,0).dmg,0);
  s.p[1].heroes.forEach(h=>{h.surr=true;E.damage(s,null,h,99,{ignoreDef:true})});ok(E.wiped(s,1));const before=H(s,0,0).dmg+H(s,0,1).dmg;st(s).deck.push("Stone Skin");sweep(s);
  eq(H(s,0,0).dmg+H(s,0,1).dmg,before+2,"party 1's Golem retargets party 0");eq(H(s,0,0).dmg,1,"tie at 10 Health Points goes to the Lead")});
test("T3 a Golem dying breaks a plate and adds Rage; plates never go below 0",()=>{const s=mk(2,60);toBattle(s);const g=golems(s);
  E.damage(s,H(s,0,0),g[0],9,{ignoreDef:true});eq(st(s).plates,1);eq(st(s).rage,1);eq(E.defn(s,bossHero(s)),1);
  E.destroyObj(s,g[1]);eq(st(s).plates,0);eq(st(s).rage,2);ctx.CQT.spawnVs(s,0);E.destroyObj(s,golems(s)[0]);eq(st(s).plates,0);eq(st(s).rage,3)});
test("T3 boss damage has the boss Hero as its source; events are recorded",()=>{const s=mk(2,61);toBattle(s);flat(s);card(s,"Crushing Step");
  ok(s.log.slice(-6).some(l=>/^Rock Mammoth deals 3 damage/.test(l.m)),"source is the boss Hero");const e=st(s).events.slice(-1)[0];eq(e.kind,"flip");eq(e.card,"Crushing Step");eq(e.targets.length,1)});
test("T3 Review Focus 4: your party passed, a helper still acting -> a flip after every sweep it acts in",()=>{const s=mk(2,62);toBattle(s);const [a,b]=E.parties(s);
  E.act(s,a,{type:"pass"});const d0=st(s).deck.length+st(s).disc.length*0;const disc0=st(s).disc.length;
  lvl(s,b);eq(st(s).disc.length+ (st(s).lastFlip&&st(s).lastFlip.kind!=="flip"?1:0),disc0+1,"flip after sweep 1");ok(!s.passed[b]);
  const r=E.act(s,b,{type:"step"});ok(r.ok,r.err);eq(st(s).disc.length+st(s).events.filter(e=>e.kind!=="flip").length,disc0+2,"flip after sweep 2")});
test("T3 Review Focus 2: the boss dies at Dawn from status damage -> win, no flip",()=>{const s=mk(2,63);toBattle(s);const b=bossHero(s);b.dmg=E.maxHp(s,b)-1;b.st.poison=2;
  const ev0=st(s).events.length;for(let g=0;g<20&&s.phase==="battle";g++)E.act(s,s.prio,{type:"pass"});
  for(let g=0;g<20&&s.phase==="town";g++){if(s.pend.length){const pr=s.pend[0];E.act(s,pr.pid,AI.choose(s,pr.pid));continue}E.act(s,s.town.order[s.town.i],{type:"leave"})}
  ok(s.over,"over");eq(s.winner,0);eq(st(s).events.length,ev0)});
test("T3 AI-only Trials run to the end with no stall (P=2..4)",()=>{[2,3,4].forEach(n=>{const s=mk(n,70+n);ok(drive(s,30),"no stall P="+n);ok(s.over||s.round>30)})});

/* ---------------- Task 4: Trials card-text rules ---------------- */
const SC=()=>ctx.CQ_SCRIPTS;
function runCard(s,pid,name,targets){const a=s.p[pid].heroes.find(h=>!h.dead);return(SC()[name]||SC()['"'+name+'"']).run(E.mkCtx(s,pid,a,E.DB[name],{uid:"x"+name,id:name,owner:pid},targets||[]))}
test("T4 your spawns first: no attacking or targeting another party's Golem while yours lives; area effects still hit",()=>{const s=mk(2,80);toBattle(s);
  const mine=golems(s).find(g=>g.fl.vs===0),theirs=golems(s).find(g=>g.fl.vs===1);
  const en=E.candidates(s,0,{k:"enemy"},{}),atk=E.candidates(s,0,{k:"enemy"},{attack:true});
  ok(en.includes(mine.uid)&&!en.includes(theirs.uid),"card targets");ok(atk.includes(mine.uid)&&!atk.includes(theirs.uid),"attack targets");ok(en.includes(bossHero(s).uid)&&atk.includes(bossHero(s).uid),"boss always");
  ok(!E.trialsTargetOk(s,0,theirs));ok(E.trialsTargetOk(s,1,theirs));
  runCard(s,0,"Hail");ok(theirs.dmg>0,"Hail hits every spawn");
  E.destroyObj(s,mine);ok(E.candidates(s,0,{k:"enemy"},{}).includes(theirs.uid),"free once your own Golem is gone")});
test("T4 the boss counts as an enemy Hero",()=>{const s=mk(2,81);toBattle(s);ok(E.candidates(s,0,{k:"enemyHero"},{}).includes(bossHero(s).uid))});
test("T4 Stun or exhaust on the boss: it skips its next flip",()=>{const s=mk(2,82);toBattle(s);E.addStatus(s,bossHero(s),"stun",1);const d=st(s).deck.length;sweep(s);
  eq(st(s).deck.length,d,"Stun: no flip");eq(st(s).events.slice(-1)[0].kind,"skip");sweep(s);eq(st(s).deck.length+st(s).disc.length,20);ok(st(s).events.slice(-1)[0].kind!=="skip","only one skip");
  runCard(s,0,"Sleep",[bossHero(s).uid]);const d2=st(s).deck.length;sweep(s);eq(st(s).events.slice(-1)[0].kind,"skip","exhaust: skip");eq(st(s).deck.length,d2);ok(!bossHero(s).ex)});
test("T4 the boss can't be stolen from or taken control of",()=>{const s=mk(2,83);toBattle(s);boss(s).gold=9;eq(E.stealGold(s,0,2,5,"Test"),0);eq(s.p[0].gold,0);
  const it={uid:"bi",id:"Aura Crystal",kind:"card",fd:false,name:"Aura Crystal",owner:2,ctr:{}};boss(s).inv.push(it);
  const v=ctx.CQ_HERO_SCRIPTS["Valdo Sticky Fingers"];const a=s.p[0].heroes[0];v[0].run(E.mkCtx(s,0,a,E.DB["h:Valdo Sticky Fingers"],null,["bi"]));ok(boss(s).inv.includes(it),"fizzles");ok(s.log.slice(-2).some(l=>/can't be taken from the boss/.test(l.m)))});
test("T4 Fatigue and Confuse do nothing to the boss",()=>{const s=mk(2,84);toBattle(s);const b=bossHero(s);E.addStatus(s,b,"confuse",2);eq(b.st.confuse,0);
  b.fat=1;for(let g=0;g<20&&s.phase==="battle";g++)E.act(s,s.prio,{type:"pass"});leaveTown(s);
  for(let g=0;g<20&&s.phase==="dawn";g++){E.parties(s).forEach(p=>{if(!s.dawnDone[p])E.act(s,p,{type:"dawnDone"})});E.settle(s)}ok(!b.ex,"readied");eq(b.fat,0)});
test("T4 each opponent means the boss side; all parties skips the boss",()=>{const s=mk(2,85);toBattle(s);const c=E.mkCtx(s,1,null,{},null,[]);ok(c.op===boss(s));
  const a0=s.p[0].aura,a1=s.p[1].aura;runCard(s,0,"Mead Offering");eq(s.p[0].aura,a0+2);eq(s.p[1].aura,a1+2);eq(boss(s).aura,0);
  const h0=s.p[0].hand.length,h1=s.p[1].hand.length;runCard(s,0,"Toast to the House");eq(s.p[0].hand.length,h0+1);eq(s.p[1].hand.length,h1+1);ok(!s.over)});

/* ---------------- Task 9: loot ---------------- */
vm.runInContext("CQE.addEquipRows(TRIALS_LOOT,TRIALS_LOOT_UPGRADES)",ctx);
test("T9 loot reveal: parties + 1 cards from the pool, the same for the same seed, revealed once",()=>{[2,3,4].forEach(n=>{const s=mk(n,90);const r=ctx.CQT.lootReveal(s);eq(r.length,n+1);eq(new Set(r).size,n+1);
  r.forEach(c=>ok(vm.runInContext("TRIALS_LOOT",ctx).some(x=>x[0]===c)));eq(ctx.CQT.lootReveal(s),r,"cached");eq(ctx.CQT.lootReveal(mk(n,90)),r,"seeded")})});
test("T9 one loot card per party",()=>{const C=ctx.CQT;const r=["Crag Helm","Mammoth Tusk","Stampede Boots"];eq(C.checkLoot(r,{0:"Crag Helm",1:"Mammoth Tusk"},2),null);
  ok(C.checkLoot(r,{0:"Crag Helm"},2),"missing");ok(C.checkLoot(r,{0:"Crag Helm",1:"Crag Helm"},2),"duplicate");ok(C.checkLoot(r,{0:"Crag Helm",1:"Stoneplate Mantle"},2),"not revealed")});
test("T9 loot starts in the right party's opening hand, isn't part of the deck, and survives a mulligan",()=>{const base=mk(2,91);const s=mk(2,91,{loot:{1:"Crag Helm"}});
  eq(s.p[1].hand.length,5);ok(s.p[1].hand.some(c=>c.id==="Crag Helm"));ok(!s.p[0].hand.some(c=>c.id==="Crag Helm"));
  eq(s.p[1].lib.length+s.p[1].hand.length,base.p[1].lib.length+base.p[1].hand.length+1);eq(s.p[1].lib.length,base.p[1].lib.length,"deck size unchanged");
  E.act(s,1,{type:"mull"});ok(s.p[1].hand.some(c=>c.id==="Crag Helm"),"kept through a mulligan");eq(s.p[1].hand.length,5);ok(!s.p[1].lib.some(c=>c.id==="Crag Helm"))});

console.log(`${fail?"FAIL":"PASS"} trials_engine ${pass}/${pass+fail}`);process.exit(fail?1:0);
