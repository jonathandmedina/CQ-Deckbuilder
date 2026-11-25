/* Update 44 (Nov 19, 2026): False Cure lasts until end of turn, Lightbringer lets you choose, All Play heals 2, Full Heal heals to full, Dissipate can't hit face-down cards. Run: node tests/u44_cards.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.RAW_CARDS=RAW_CARDS;this.RAW_HEROES=RAW_HEROES;",ctx);
const E=ctx.CQE,S=ctx.CQ_SCRIPTS;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Smoke Bomb","Revitalize","Dynamite","Precognition","Humble","Vandalize","Naturalize","Shatter","Inspiration","Snuff Out","Level Up"].map(n=>[n,3]));
function game(h0){const s=E.newGame({seed:5,players:[{name:"A",deck:{name:"A",heroes:h0||["h:Lightbringer","h:Arnett Lifebinder","h:Sanctifier"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:Divine Knight","h:Arcane Scholar","h:Savage Raider"],cards:filler}}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});s.prio=0;s.passed=[false,false];return s}
const row=n=>ctx.RAW_CARDS.find(r=>r[1]===n),hero=n=>ctx.RAW_HEROES.find(r=>r[0]===n);
/* data */
ok(/Heal each hero for 2 Health Points\./.test(row("All Play")[7])&&row("All Play")[8]===4,"All Play heals 2, v4");
ok(row("Full Heal")[2]==="6"&&/maximum Health Points/.test(row("Full Heal")[7])&&row("Full Heal")[8]===2,"Full Heal costs 6, heals to full, v2");
ok(/^1\{A\}, Exile: Until end of turn, whenever target enemy would be healed/.test(row("False Cure")[7])&&row("False Cure")[8]===3,"False Cure text v3 (Update 51: target enemy)");
ok(/another target friendly hero/.test(hero("Lightbringer")[6])&&/a card or ability you control heals/.test(hero("Lightbringer")[6])&&hero("Lightbringer")[7]===6,"Lightbringer text v6");
/* False Cure: every heal on that hero this turn becomes HP loss */
{const s=game();const h=s.p[1].heroes[0];h.dmg=5;h.fl.falseCure=s.round;E.heal(s,null,h,2,1);E.heal(s,null,h,3,1);ok(h.dmg===10,"two heals both become HP loss ("+h.dmg+")");
 s.round++;E.heal(s,null,h,2,1);ok(h.dmg===8,"next round heals work again")}
/* All Play: 2 each, 5 at Level 3 */
{const s=game();s.p.forEach(p=>p.heroes.forEach(h=>h.dmg=6));const a=s.p[0].heroes[1];S["All Play"].run({s,pid:0,me:s.p[0],op:s.p[1],actor:a,t:[],E});ok(s.p.every(p=>p.heroes.every(h=>h.dmg===4)),"All Play heals every hero 2");
 s.p.forEach(p=>p.heroes.forEach(h=>h.dmg=6));a.lvl=3;S["All Play"].run({s,pid:0,me:s.p[0],op:s.p[1],actor:a,t:[],E});ok(s.p.every(p=>p.heroes.every(h=>h.dmg===1)),"Level 3: heals 5")}
/* Full Heal */
{const s=game();const h=s.p[0].heroes[1];h.dmg=12;S["Full Heal"].run({s,pid:0,me:s.p[0],op:s.p[1],actor:s.p[0].heroes[1],t:[h],E});ok(h.dmg===0,"Full Heal heals to full");ok(S["Full Heal"].t&&S["Full Heal"].t[0].k==="any","Full Heal targets any target")}
/* Lightbringer L6 asks for a target */
{const s=game();const lb=s.p[0].heroes[0];lb.lvl=6;const ally=s.p[0].heroes[1];ally.dmg=4;s.pend=[];E.heal(s,ally,ally,3,0);const pr=s.pend.find(p=>p.type==="ask"&&/Lightbringer: deal 3 Light/.test(p.title));
 ok(pr&&pr.opts.length>3,"Lightbringer asks which target to hit");const tgt=s.p[1].heroes[1];const before=tgt.dmg||0;const i=pr.opts.findIndex(o=>o.v===tgt.uid);E.act(s,0,{type:"ask",i});ok((tgt.dmg||0)>before,"chosen target took Light damage")}
/* Lightbringer dawn heal asks */
{const s=game();ok(fs.readFileSync(path.join(A,"play-engine.js"),"utf8").includes('"Lightbringer: heal another friendly hero for 1 Health Point"'),"dawn heal is a choice");}
/* Dissipate can't target a face-down card */
{const s=game();const pl=s.p[1];const c=pl.hand.find(x=>x)||null;const fd={uid:"fdx",id:E.DB?Object.keys(E.DB).find(k=>E.DB[k].name==="Camouflage"):null,kind:"card",fd:true,name:"Camouflage",owner:1,ctrl:1};pl.inv.push(fd);
 const up={uid:"upx",id:Object.keys(E.DB).find(k=>E.DB[k].name==="Topaz"),kind:"card",name:"Topaz",owner:1,ctrl:1};pl.inv.push(up);
 const f=S["Dissipate"].t[0].f;ok(!f(s,fd),"Dissipate can't choose a face-down card");ok(f(s,up),"Dissipate can still choose a face-up 1-cost item")}
const rules=fs.readFileSync(path.join(A,"rules.md"),"utf8");ok(/cost is hidden/.test(rules),"rules: cost checks skip face-down cards");
console.log(`Update 44 cards: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
