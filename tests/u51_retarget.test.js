/* Update 51 (Nov 24, 2026): harmful "target hero" / "each enemy hero" cards reworded to "target enemy" / "each enemy" (16 cards), so they reach summons and Trials bosses.
   1-on-1 checks. Run: node tests/u51_retarget.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","trials-data.js","play-engine.js","play-trials.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+";globalThis.__RC=RAW_CARDS;globalThis.__RE=RAW_EQUIP;globalThis.__RH=RAW_HEROES;globalThis.__EU=EQUIP_UPGRADES;",ctx);
const E=ctx.CQE,S=ctx.CQ_SCRIPTS,H=ctx.CQ_HERO_SCRIPTS;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Dynamite","Precognition","Inspiration","Level Up","Naturalize","Shatter","Vandalize","Smoke Bomb","Revitalize","Humble","Snuff Out"].map(n=>[n,3]));
function game(seed){const s=E.newGame({seed,players:[{name:"A",deck:{name:"A",heroes:["h:Storm Caller","h:Dr. Vonugutt","h:Ember Mage"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:Dark Fang","h:Dark Channeler","h:Venom Dancer"],cards:filler}}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});return s}
const sc=n=>S[n]||S['"'+n+'"'];
const run=(s,me,name,targets)=>{const a=s.p[me].heroes.find(h=>!h.dead);return sc(name).run(E.mkCtx(s,me,a,E.DB[name],{uid:"x"+name+Math.random(),id:name,owner:me},targets||[]))};
const slot=(name,i)=>{const x=sc(name);return (x.t||(x.act&&x.act.t))[i||0]};
/* data: text and versions */
const row=n=>ctx.__RC.find(r=>r[1]===n);
const want={"Lightning Bolt":["target enemy.",2],"Flame Bolt":["target enemy and burn it.",3],"Battered":["to target enemy.",4],"Pummel":["to target enemy equal",5],"Sonic Recall":["damage to target enemy.",2],"Draw Life":["Target enemy loses 2",4],
  "Mark of Doom":["Enchant target enemy. At dusk, enchanted enemy",3],"Storm of Insight":["damage to each enemy.",4],"False Cure":["target enemy would be healed",3],"On the Job Training":["a random enemy.",2],
  "Snare":["When an enemy attacks",2],"Spike Pit":["When an enemy attacks",4],"Bear Trap":["When an enemy attacks",3],"Hail":["Deal 1 Ice damage to each enemy.",4]};
for(const n in want){const r=row(n);ok(r&&r[7].includes(want[n][0])&&r[8]===want[n][1],n+" text/version: "+(r&&r[7])+" v"+(r&&r[8]));ok(r&&!/target hero|enemy hero/i.test(r[7]),n+": no Hero-only wording left")}
const sd=ctx.__RE.find(r=>r[0]==="Staff of Doom");ok(sd[4].includes("target enemy loses")&&sd[9]===3,"Staff of Doom v3");ok(ctx.__EU["Staff of Doom"][1].includes("target enemy loses"),"Staff of Doom upgrade text");
const vr=ctx.__RH.find(r=>r[0]==="Dr. Vonugutt");ok(/a hero or an enemy/.test(vr[6])&&/target enemy/.test(vr[6])&&vr[7]===3,"Dr. Vonugutt v3");
/* targeting: enemies only, summons included */
{const s=game(3);const sum=E.makeSummon(s,1,"Wolf",true),mineS=E.makeSummon(s,0,"Wolf",true);
 for(const n of ["Lightning Bolt","Battered","Pummel","Sonic Recall","Draw Life","Mark of Doom","False Cure"]){const c=E.candidates(s,0,slot(n),{actor:s.p[0].heroes[0],card:E.DB[n]});
   ok(c.includes(sum.uid),n+": can pick an enemy summon");ok(!c.includes(mineS.uid)&&!s.p[0].heroes.some(h=>c.includes(h.uid)),n+": can't pick your own side");ok(s.p[1].heroes.some(h=>c.includes(h.uid)),n+": can pick an enemy Hero")}
 const fb=E.candidates(s,0,S["Flame Bolt"].act.t[0],{actor:s.p[0].heroes[0]});ok(fb.includes(sum.uid)&&!fb.includes(mineS.uid),"Flame Bolt: target enemy")}
/* Hail and Storm of Insight: each enemy */
{const s=game(5);const sum=E.makeSummon(s,1,"Wolf",true),mineS=E.makeSummon(s,0,"Wolf",true);s.p.forEach(pl=>pl.heroes.forEach(h=>{h.base.def=0}));
 run(s,0,"Hail");ok(s.p[1].heroes.every(h=>h.dmg===1)&&sum.dmg===1,"Hail hits each enemy");ok(s.p[0].heroes.every(h=>!h.dmg)&&!mineS.dmg,"Hail spares your own side");
 const s2=game(6);const w=E.makeSummon(s2,1,"Wolf",true);s2.p.forEach(pl=>pl.heroes.forEach(h=>{h.base.def=0}));run(s2,0,"Storm of Insight");ok(w.dead||w.dmg>0||!s2.p[1].bf.includes(w),"Storm of Insight hits enemy summons")}
/* Mark of Doom on a summon ticks at Dusk */
{const s=game(7);const sum=E.makeSummon(s,1,"Bear",true);sum.hp=5;run(s,0,"Mark of Doom",[sum.uid]);ok(sum.ench.length===1,"Mark of Doom on a summon");
 for(let g=0;g<20&&s.phase==="battle";g++){if(s.pend.length){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(a)E.act(s,pr.pid,a);else s.pend.shift();continue}E.act(s,s.prio,{type:"pass"})}
 ok(sum.dmg>=1||!s.p[1].bf.includes(sum),"the summon lost 1 at Dusk")}
/* Snare and Spike Pit trigger on a summon's attack */
{const ok2=sc("Snare").hidden;ok(ok2&&ok2.ok===null,"Snare triggers on any enemy attacker");ok(sc("Spike Pit").hidden.ok===null,"Spike Pit triggers on any enemy attacker")}
/* Staff of Doom asks for an enemy only */
{const s=game(9);const a=s.p[0].heroes[0];const sum=E.makeSummon(s,1,"Wolf",true);const id="Staff of Doom";
 const eq={uid:"sd1",id,name:id,kind:"equip",owner:0,ctrl:0,cls:"Warlock"};a.eq.H1=eq;a.eq.H2="2H";s.p[0].hand.push({uid:"lb1",id:"Lightning Bolt",owner:0});s.p[0].aura=9;
 const r=E.act(s,0,{type:"play",uid:"lb1",targets:[s.p[1].heroes[0].uid]});const pr=s.pend.find(p=>p.op==="loseTo");
 ok(r.ok&&pr,"Staff of Doom asks after a spell "+(r.err||""));if(pr){const vs=pr.opts.map(o=>o.v).filter(Boolean);ok(vs.includes(sum.uid)&&!s.p[0].heroes.some(h=>vs.includes(h.uid)),"Staff of Doom: enemies only, summons included")}}
/* Dr. Vonugutt Level 3: an enemy summon's status counters double */
{const s=game(11);const sum=E.makeSummon(s,1,"Wolf",true);E.addStatus(s,sum,"poison",2);const v=s.p[0].heroes.find(h=>h.name==="Dr. Vonugutt");v.lvl=3;
 const ab=ctx.CQ_HERO_SCRIPTS["Dr. Vonugutt"][1];ab.run(E.mkCtx(s,0,v,E.DB["h:Dr. Vonugutt"],null,[sum.uid]));ok(sum.st.poison===4,"Vonugutt L3 doubles a summon's counters");
 const c=E.candidates(s,0,ab.t[0],{actor:v});ok(!s.p[0].heroes.some(h=>c.includes(h.uid)),"Vonugutt L3: enemies only");
 const c0=E.candidates(s,0,ctx.CQ_HERO_SCRIPTS["Dr. Vonugutt"][0].t[0],{actor:v});ok(s.p[0].heroes.some(h=>c0.includes(h.uid))&&c0.includes(sum.uid),"Vonugutt base: your Heroes or an enemy")}
console.log(`u51 retarget: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
