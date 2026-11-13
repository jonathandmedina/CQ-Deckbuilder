/* Trial 1 loot in the engine (Trials Plan B+C, Task 5): each card in a 1-on-1 game and in a Trial, plus upgraded sides. Run: node tests/trials_loot.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","trials-data.js","play-engine.js","play-trials.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;vm.runInContext("CQE.addEquipRows(TRIALS_LOOT,TRIALS_LOOT_UPGRADES)",ctx);
const ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");
const ST=vm.runInNewContext("("+ui.match(/const STARTERS=(\[[\s\S]*?\]);/)[1]+")"),SL=vm.runInNewContext("("+ui.match(/const STARTER_LISTS=(\[[\s\S]*?\]);\nfunction starterDeck/)[1]+")");
const deck=(i,n)=>({name:ST[i].name,heroes:ST[i].heroes.slice(0,n||3).map(x=>"h:"+x),cards:Object.assign({},SL[i])});
let pass=0,fail=0;function test(n,fn){try{fn();pass++;console.log("ok   "+n)}catch(e){fail++;console.log("FAIL "+n+"\n     "+String(e&&e.stack||e).split("\n").slice(0,3).join("\n     "))}}
const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(`${m||"expected"}: got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`)};const ok=(v,m)=>{if(!v)throw new Error(m||"expected true")};
function duel(seed){const s=E.newGame({seed:seed||5,players:[{name:"A",deck:deck(0)},{name:"B",deck:deck(1)}]});s.phase="battle";s.round=1;return s}
function trial(seed){const s=E.newGame({seed:seed||6,trials:{trial:1,parties:[deck(0,2),deck(1,2)]}});s.phase="battle";s.round=1;return s}
function setH(h,o){h.base.str=o.str??h.base.str;h.base.def=o.def??h.base.def;h.base.hp=o.hp??h.base.hp;h.dmg=0;h.ex=false;h.mods=[];h.bon={str:0,def:0,aura:0}}
let U=0;function gear(s,h,name,up){const c={uid:"loot"+(++U),id:name,owner:h.owner};if(up){s.upg=s.upg||{};s.upg[c.uid]=1}const e=E.eqObjFromCard(s,h.owner,c);E.equipTo(s,h,e);return e}
function attack(s,att,tgt){E.startAttack(s,att.owner!=null&&att.kind==="hero"?att.owner:att.ctrl,att.uid,tgt.uid,{});E.settle(s)}
const both=fn=>{fn(duel(),0,1);fn(trial(),0,2)};
const foe=(s,b)=>s.p[b].heroes[0];
test("all six loot cards are registered with their upgrades",()=>{["Rockbreaker Maul","Mammoth Tusk","Crag Helm","Stampede Boots","Stoneplate Mantle","Heart of the Mountain"].forEach(n=>{ok(E.DB[n]&&E.DB[n].kind==="equip",n);ok(E.DB[n].up,n+" upgrade")});eq(E.DB["Rockbreaker Maul"].sup,"Legendary")});
test("Rockbreaker Maul: +3 Strength (upgraded +4); Piercing 2 against 3+ Defense",()=>both((s,a,b)=>{const h=s.p[a].heroes[0];setH(h,{str:0});gear(s,h,"Rockbreaker Maul");eq(E.str(s,h),3);
  const t=foe(s,b);setH(t,{def:3,hp:30});attack(s,h,t);eq(t.dmg,2,"3 Strength vs 3 Defense with Piercing 2");
  const h2=s.p[a].heroes[1];setH(h2,{str:0});gear(s,h2,"Rockbreaker Maul",true);eq(E.str(s,h2),4,"upgraded");const t2=s.p[b].heroes[0];setH(t2,{def:2,hp:30});attack(s,h2,t2);eq(t2.dmg,2,"no Piercing under 3 Defense")}));
test("Mammoth Tusk: +1 Strength (upgraded +2); +2 damage to summons",()=>both((s,a,b)=>{const h=s.p[a].heroes[0];setH(h,{str:0});gear(s,h,"Mammoth Tusk");eq(E.str(s,h),1);
  const sm=E.makeSummon(s,b,"Wolf");sm.hp=10;sm.mods=[];attack(s,h,sm);eq(sm.dmg,3);const t=foe(s,b);setH(t,{def:0,hp:30});h.ex=false;attack(s,h,t);eq(t.dmg,1,"no bonus on Heroes");
  const h2=s.p[a].heroes[1];setH(h2,{str:0});gear(s,h2,"Mammoth Tusk",true);eq(E.str(s,h2),2)}));
test("Crag Helm: +1 Defense (upgraded +2); can't be Stunned",()=>both((s,a)=>{const h=s.p[a].heroes[0];setH(h,{def:0});gear(s,h,"Crag Helm");eq(E.defn(s,h),1);E.addStatus(s,h,"stun",1);eq(h.st.stun,0);
  const h2=s.p[a].heroes[1];setH(h2,{def:0});gear(s,h2,"Crag Helm",true);eq(E.defn(s,h2),2)}));
test("Stampede Boots: +1 Defense; enemy cards and abilities can't exhaust it (allies still can)",()=>both((s,a,b)=>{const h=s.p[a].heroes[0];setH(h,{def:0});gear(s,h,"Stampede Boots");eq(E.defn(s,h),1);
  ctx.CQ_SCRIPTS["Sleep"].run(E.mkCtx(s,b===2?2:b,null,E.DB["Sleep"],null,[h.uid]));ok(!h.ex,"enemy Sleep");ctx.CQ_SCRIPTS["Sleep"].run(E.mkCtx(s,a,null,E.DB["Sleep"],null,[h.uid]));ok(h.ex,"your own card can");
  const h2=s.p[a].heroes[1];setH(h2,{def:0});gear(s,h2,"Stampede Boots",true);eq(E.defn(s,h2),2)}));
test("Stampede Boots in a Trial: Tremor can't exhaust it",()=>{const s=trial(9);s.p.slice(0,2).forEach(pl=>pl.heroes.forEach(h=>setH(h,{str:1,def:0,hp:10})));const h=s.p[0].heroes[0];setH(h,{str:5});gear(s,h,"Stampede Boots");
  ctx.CQT.resolveCard(s,"Tremor");ok(!h.ex)});
test("Stoneplate Mantle: +1 Defense; the first time each game it would die, it stays at 1 Health Point",()=>both((s,a)=>{const h=s.p[a].heroes[0];setH(h,{def:0,hp:10});gear(s,h,"Stoneplate Mantle");eq(E.defn(s,h),1);
  E.damage(s,null,h,50,{ignoreDef:true});ok(!h.dead);eq(E.hp(s,h),1);E.damage(s,null,h,50,{ignoreDef:true});ok(h.dead,"only once");
  const h2=s.p[a].heroes[1];setH(h2,{def:0});gear(s,h2,"Stoneplate Mantle",true);eq(E.defn(s,h2),2)}));
test("Heart of the Mountain: once per turn when an enemy summon dies, gain 1 Aura (upgraded: and heal 1)",()=>both((s,a,b)=>{const pl=s.p[a];pl.aura=0;const h=pl.heroes[0];gear(s,h,"Heart of the Mountain");
  const w1=E.makeSummon(s,b,"Wolf"),w2=E.makeSummon(s,b,"Wolf");E.destroyObj(s,w1);eq(pl.aura,1);E.destroyObj(s,w2);eq(pl.aura,1,"once per turn");
  const own=E.makeSummon(s,a,"Wolf");s.round++;E.destroyObj(s,own);eq(pl.aura,1,"not your own summon");
  const h2=pl.heroes[1];h2.base.hp=20;h2.dmg=5;gear(s,h2,"Heart of the Mountain",true);const w3=E.makeSummon(s,b,"Wolf");E.destroyObj(s,w3);eq(pl.aura,3,"both Hearts trigger");eq(h2.dmg,4,"upgraded heals 1")}));
test("Heart of the Mountain in a Trial: a Golem dying",()=>{const s=trial(12);const pl=s.p[1];pl.aura=0;gear(s,pl.heroes[0],"Heart of the Mountain");const g=s.p[2].bf.find(o=>o.spawn);E.damage(s,s.p[0].heroes[0],g,9,{ignoreDef:true});eq(pl.aura,1)});
console.log(`${fail?"FAIL":"PASS"} trials_loot ${pass}/${pass+fail}`);process.exit(fail?1:0);
