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

console.log(`${fail?"FAIL":"PASS"} trials_engine ${pass}/${pass+fail}`);process.exit(fail?1:0);
