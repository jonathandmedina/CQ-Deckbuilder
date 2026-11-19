/* Update 38 (Nov 18, 2026): Deeg Farsight + Deeg-Arrow, Jess Naturecaller; Set 2 JD Tinkersmith. Run: node tests/u38_new_heroes.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.SET2_CARDS=SET2_CARDS;",ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Smoke Bomb","Revitalize","Dynamite","Precognition","Humble","Vandalize","Disarm","Naturalize","Shatter","Gold Ingot","Silver Ingot"].map(n=>[n,3]));
let U=1;const uid=()=>"t"+(U++);
function game(h0,h1){const s=E.newGame({seed:7,players:[{name:"A",deck:{name:"A",heroes:h0.map(h=>"h:"+h),cards:filler}},{name:"B",deck:{name:"B",heroes:(h1||["Divine Knight","Arcane Scholar","Bar-Bear Ian"]).map(h=>"h:"+h),cards:filler}}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});s.p.forEach(p=>{p.aura=10;p.inv=[];p.hand=[]});s.prio=0;s.passed=[false,false];return s}
function resolve(s){let g=0;while(s.pend.length&&g++<20){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(!a)break;E.act(s,pr.pid,a)}}
const hand=(s,pid,id)=>{const c={uid:uid(),id,owner:pid};s.p[pid].hand.push(c);return c};
const equip=(s,h,id)=>E.equipTo(s,h,E.eqObjFromCard(s,0,{uid:uid(),id,owner:0}));
/* data */
const D=E.DB;ok(D["h:Deeg Farsight"]&&D["h:Deeg Farsight"].cls==="Ranger"&&D["h:Deeg Farsight"].aura===2,"Deeg in DB");
ok(D["h:Jess Naturecaller"]&&D["h:Jess Naturecaller"].cls==="Druid","Jess in DB");
ok(D["h:JD Tinkersmith"]&&D["h:JD Tinkersmith"].cls==="Artificer"&&ctx.SET2_CARDS.includes("JD Tinkersmith"),"JD in DB and gated to Set 2");
ok(D["Deeg-Arrow"]&&D["Deeg-Arrow"].sub==="Arrow"&&D["Deeg-Arrow"].cls==="Ranger","Deeg-Arrow in DB");
/* Deeg: needs a Bow; from hand costs activation + 1; Deeg-Arrow from hand ignores DEF */
{const s=game(["Deeg Farsight","Hawkeye","Sage Monk"]);const deeg=s.p[0].heroes[0];const c=hand(s,0,"Deeg-Arrow");
 ok(!E.options(s,0).some(o=>o.fromHand),"no hand Arrow without a Bow");
 equip(s,deeg,"Multi Bow");const o=E.options(s,0).find(o=>o.type==="use"&&o.fromHand&&o.uid===c.uid);ok(o,"hand Arrow offered with a Bow");
 ok(E.handArrowCost(s,0,deeg,c)===2,"Deeg-Arrow from hand costs 2");
 const tg=s.p[1].heroes[0];const d0=tg.dmg;const a0=s.p[0].aura;E.act(s,0,Object.assign({},o,{targets:[tg.uid]}));resolve(s);
 const dealt=tg.dmg-d0;ok(dealt===3,"ignores Divine Knight's 2 DEF: 3 damage (got "+dealt+")");ok(s.p[0].aura===a0-2,"paid 2 Aura");
 ok(!s.p[0].hand.some(x=>x.uid===c.uid)&&s.p[0].disc.some(x=>x.uid===c.uid),"Arrow goes hand to discard");ok(deeg.ex,"Deeg exhausted");}
{const s=game(["Deeg Farsight","Hawkeye","Sage Monk"]);const hk=s.p[0].heroes[1];const c={uid:uid(),id:"Deeg-Arrow",owner:0};s.p[0].inv.push(E.invObj(s,0,c));
 s.p[0].heroes[0].ex=true;const o=E.options(s,0).find(o=>o.type==="use"&&o.uid===c.uid);ok(o&&!o.fromHand,"Deeg-Arrow usable from inventory by any Ranger");
 const tg=s.p[1].heroes[0];const d0=tg.dmg;E.act(s,0,Object.assign({},o,{targets:[tg.uid]}));resolve(s);ok(tg.dmg-d0===1,"from inventory: 3 - 2 DEF = 1");}
{const s=game(["Hawkeye","Deeg Farsight","Sage Monk"]);equip(s,s.p[0].heroes[0],"Multi Bow");hand(s,0,"Deeg-Arrow");ok(!E.options(s,0).some(o=>o.fromHand),"other Rangers can't use hand Arrows");}
/* Jess: three Wolves at Level 3 and at Level 6 */
{const s=game(["Jess Naturecaller","Hawkeye","Sage Monk"]);const j=s.p[0].heroes[0];const w=()=>s.p[0].bf.filter(o=>o.kind==="summon"&&o.name==="Wolf").length;
 E.levelUp(s,j);E.levelUp(s,j);ok(w()===0,"no Wolves at Level 2");E.levelUp(s,j);ok(w()===3,"three Wolves at Level 3");
 const wf=s.p[0].bf.find(o=>o.name==="Wolf");ok(wf&&wf.str===2&&wf.hp===2,"Wolves are 2/2");E.levelUp(s,j);E.levelUp(s,j);ok(w()===3,"none at 4-5");E.levelUp(s,j);ok(w()===6,"three more at Level 6");}
/* JD: first Craft each turn returns an Item from the discard pile to inventory; Level 3: two */
{const s=game(["JD Tinkersmith","Wren Partsfinder","Val Craftsmith"]);const jd=s.p[0].heroes[0];const pl=s.p[0];
 ["Potion","Antidote","Smoke Bomb"].forEach(n=>pl.disc.push({uid:uid(),id:n,owner:0}));
 const R=E.DB["Iron Guardians"];const ing=()=>["Iron Ingot","Silver Ingot"].forEach(n=>pl.inv.push(E.invObj(s,0,{uid:uid(),id:n,owner:0})));
 ing();E.payCraft(s,0,jd,R);resolve(s);ok(pl.inv.length===1&&E.DB[pl.inv[0].id].sub==="Material"&&pl.disc.length===4,"JD returns 1 Material on the first Craft (inv "+pl.inv.length+", disc "+pl.disc.length+")");
 ing();E.payCraft(s,0,jd,R);resolve(s);ok(pl.inv.length===1,"only the first Craft each turn (inv "+pl.inv.length+")");
 s.round++;jd.lvl=3;ing();E.payCraft(s,0,jd,R);resolve(s);ok(pl.inv.length===3,"Level 3 returns two (inv "+pl.inv.length+")");
 {const s3=game(["JD Tinkersmith","Wren Partsfinder","Val Craftsmith"]);const p3=s3.p[0];p3.disc.push({uid:uid(),id:"Potion",owner:0});["Iron Ingot","Silver Ingot"].forEach(n=>p3.inv.push(E.invObj(s3,0,{uid:uid(),id:n,owner:0})));
  const pc=E.DB["Iron Guardians"];p3.disc=p3.disc.filter(c=>c.id==="Potion");E.payCraft(s3,0,p3.heroes[0],pc);resolve(s3);ok(!p3.inv.some(o=>o.name==="Potion"),"a non-Material Item (Potion) is never returned");}
 const s2=game(["Wren Partsfinder","JD Tinkersmith","Val Craftsmith"]);s2.p[0].disc.push({uid:uid(),id:"Potion",owner:0});s2.p[0].inv=[];["Iron Ingot","Silver Ingot"].forEach(n=>s2.p[0].inv.push(E.invObj(s2,0,{uid:uid(),id:n,owner:0})));E.payCraft(s2,0,s2.p[0].heroes[0],R);resolve(s2);ok(s2.p[0].inv.length===0,"another Artificer crafting doesn't trigger JD");}
console.log(`Update 38 new Heroes: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
