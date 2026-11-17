/* Set 2 Artificer Tactics (Nov 17, 2026): Activate, Sands of Time, Time Ripple, Displace, Refactor; Pocket Watch exhausts itself.
   Run: node tests/set2_time_tactics.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.SET2_CARDS=SET2_CARDS;",ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Smoke Bomb","Revitalize","Dynamite","Gold Bar","Platinum Bar","Silver Bar","Rose Quartz","Topaz","Almandine","Precognition","Humble","Vandalize","Disarm","Naturalize","Shatter"].map(n=>[n,3]));
const deck=h=>({name:"T",heroes:h.map(x=>"h:"+x),cards:Object.assign({},filler)});
let U=9000;const uid=()=>"z"+(U++);
function game(){const s=E.newGame({seed:7,players:[{name:"A",deck:deck(["Wren Partsfinder","Gadget Commander","Cy the Builder"])},{name:"B",deck:deck(["Divine Knight","Arcane Scholar","Shadow Ranger"])}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});
  s.p.forEach(p=>{p.aura=10;p.inv=[];p.hand=[]});s.prio=0;s.passed=[false,false];return s}
const inv=(s,pid,id)=>{const o=E.invObj(s,pid,{uid:uid(),id,owner:pid});s.p[pid].inv.push(o);return o};
const hand=(s,pid,id)=>{const c={uid:uid(),id,owner:pid};s.p[pid].hand.push(c);return c};
const opts=(s,pid)=>E.options(s,pid);
const playOpt=(s,c)=>opts(s,0).find(o=>o.type==="play"&&o.uid===c.uid);
const stall=(s,pid,id,n)=>{const c={uid:uid(),id,owner:pid,n,cont:{k:"card"}};s.p[pid].stall=(s.p[pid].stall||[]).concat([c]);return c};
const names=["Activate","Sands of Time","Time Ripple","Displace","Refactor"];
names.forEach(n=>{const d=E.DB[n];ok(d&&d.type==="Tactic"&&d.cls==="Artificer"&&ctx.SET2_CARDS.includes(n),n+": Artificer Tactic, Set 2")});
ok(E.DB["Activate"].cost==="2"&&E.DB["Sands of Time"].cost==="3"&&E.DB["Time Ripple"].cost==="1"&&E.DB["Displace"].cost==="3"&&E.DB["Refactor"].cost==="2","Aura costs 2/3/1/3/2");
/* Activate: a Potion (2 Aura, Exile: Heal 3) with no cost; it stays */
{const s=game();const h=s.p[0].heroes[0];h.dmg=5;const p=inv(s,0,"Potion");const c=hand(s,0,"Activate");const o=playOpt(s,c);ok(o,"Activate playable");
  const au=s.p[0].aura;E.act(s,0,o);const pr=s.pend[0];ok(pr&&pr.type==="ask"&&pr.opts.some(x=>/Activate Potion/.test(x.label)),"asks which item");
  E.act(s,0,{type:"ask",i:pr.opts.findIndex(x=>/Activate Potion/.test(x.label))});const actor=s.bonus&&s.p[0].heroes.find(x=>x.uid===s.bonus.uid);ok(s.bonus&&s.bonus.only==="activate","the Hero activates it now");
  const l=opts(s,0);const u=l.find(x=>x.type==="use"&&x.uid===p.uid);ok(u&&l.every(x=>x.type==="use"||x.type==="skipBonus"),"only that item (or skip)");
  const au2=s.p[0].aura;E.act(s,0,Object.assign({},u,{targets:[h.uid]}));let g=0;while(s.pend.length&&g++<10){const a=ctx.CQAI.choose(s,s.pend[0].pid);if(!a)break;E.act(s,s.pend[0].pid,a)}
  ok(s.p[0].aura===au2,"no Aura paid for the Potion");ok(s.p[0].inv.includes(p),"the Potion stays in the inventory");ok(h.dmg===2,"healed 3");ok(!s.bonus,"bonus over")}
/* Activate: trigger a Dawn item (Topaz: gain 2 Aura) without exiling it */
{const s=game();const tz=inv(s,0,"Topaz");const c=hand(s,0,"Activate");E.act(s,0,playOpt(s,c));const pr=s.pend[0];const i=pr.opts.findIndex(x=>/Trigger Topaz/.test(x.label));ok(i>=0,"Topaz can be triggered");
  const au=s.p[0].aura;E.act(s,0,{type:"ask",i});ok(s.p[0].aura===au+2&&s.p[0].inv.includes(tz),"Topaz: +2 Aura, it stays")}
/* Sands of Time / Time Ripple */
{const s=game();const a=stall(s,1,"Potion",2),b=stall(s,0,"Dynamite",3);const c=hand(s,0,"Sands of Time");E.act(s,0,playOpt(s,c));ok(a.n===4&&b.n===4,"Sands of Time: +2 on every stalled card, both parties (playing it removed one of your own first)")}
{const s=game();const a=stall(s,1,"Potion",1);const c=hand(s,0,"Time Ripple");E.act(s,0,playOpt(s,c));const pr=s.pend[0];ok(pr&&pr.type==="ask","Time Ripple asks which card");E.act(s,0,{type:"ask",i:0});ok(a.n===4,"Time Ripple: +3")}
{const s=game();const c=hand(s,0,"Time Ripple");const r=E.act(s,0,playOpt(s,c)||{type:"play",uid:c.uid});ok(!s.pend.length,"Time Ripple with nothing stalled does nothing")}
/* Displace: an enemy summon leaves, then returns after 3 of its party's actions */
{const s=game();const m=E.makeSummon(s,1,"Revenant");s.pend=[];const c=hand(s,0,"Displace");const o=playOpt(s,c);E.act(s,0,Object.assign({},o,{targets:[m.uid]}));let g=0;while(s.pend.length&&g++<10){const a=ctx.CQAI.choose(s,s.pend[0].pid);if(!a)break;E.act(s,s.pend[0].pid,a)}
  ok(!s.p[1].bf.includes(m)&&(s.p[1].stall||[]).some(x=>x.uid===m.uid&&x.n===3),"the summon is exiled with 3 stall counters");
  E.stallTick(s,1);E.stallTick(s,1);ok(!s.p[1].bf.includes(m),"still gone after 2 actions");E.stallTick(s,1);ok(s.p[1].bf.includes(m)&&m.ex,"returns exhausted after the 3rd");ok(!(s.p[1].stall||[]).length,"stall zone empty")}
{const s=game();const it=inv(s,1,"Gold Bar");const c=hand(s,0,"Displace");E.act(s,0,Object.assign({},playOpt(s,c),{targets:[it.uid]}));for(let k=0;k<3;k++)E.stallTick(s,1);ok(s.p[1].inv.includes(it),"an item returns to its owner's inventory")}
{const s=game();const c=hand(s,0,"Displace");const o=playOpt(s,c);const n=o?E.need(s,0,o):null;ok(!n||!n[0]||!n[0].cands.some(u=>s.p.some(p=>p.heroes.some(h=>h.uid===u))),"Heroes can't be Displaced")}
/* Displace + Time Ripple combo */
{const s=game();const it=inv(s,1,"Gold Bar");E.displace(s,it,3);const x=s.p[1].stall[0];const c=hand(s,0,"Time Ripple");E.act(s,0,playOpt(s,c));E.act(s,0,{type:"ask",i:0});ok(x.n===6,"Time Ripple works on a Displaced card")}
/* Refactor: sacrifice a 2-Aura item, fetch an Item costing 2 or less into play */
{const s=game();const g=inv(s,0,"Tip Jar");s.p[0].lib=[{uid:"rl1",id:"Topaz",owner:0},{uid:"rl2",id:"Aura Crystal",owner:0},{uid:"rl3",id:"Humble",owner:0},{uid:"rl4",id:"Gold Bar",owner:0}];
  const c=hand(s,0,"Refactor");const o=playOpt(s,c);ok(o,"Refactor playable");E.act(s,0,Object.assign({},o,{targets:[g.uid]}));const pr=s.pend[0];
  const cap=parseInt(E.DB["Tip Jar"].cost,10);ok(pr&&pr.type==="choose"&&pr.cards.length===2&&!pr.cards.includes("rl2")&&pr.cards.every(u=>{const d=E.DB[s.p[0].lib.find(x=>x.uid===u).id];return d.type==="Item"&&(parseInt(d.cost,10)||0)<=cap}),"only Items with an equal or lower cost");
  ok(!s.p[0].inv.includes(g)&&s.p[0].disc.some(x=>x.uid===g.uid),"the item was sacrificed");E.act(s,0,{type:"choose",picks:[pr.cards[0]]});ok(s.p[0].inv.some(x=>x.uid===pr.cards[0]),"the found Item enters play (inventory)")}
/* Pocket Watch exhausts itself */
{const s=game();const pw=inv(s,0,"Pocket Watch");s.p[0].heroes.forEach(h=>h.ex=true);s.prio=1;const card=hand(s,1,"Humble");s.p[1].aura=5;
  const r=E.act(s,1,{type:"play",uid:card.uid,targets:[s.p[0].heroes[0].uid]});ok(s.pend[0]&&s.pend[0].type==="window"&&s.pend[0].pid===0,"the Watch works even with every Hero exhausted");
  const so=opts(s,0).find(o=>o.type==="stall");E.act(s,0,so);ok(pw.exh&&(s.p[1].stall||[]).some(x=>x.uid===card.uid),"the Watch exhausts and the card is Stalled");
  s.prio=1;const c2=hand(s,1,"Humble");E.act(s,1,{type:"play",uid:c2.uid,targets:[s.p[0].heroes[1].uid]});ok(!(s.pend[0]&&s.pend[0].type==="window"&&opts(s,0).some(o=>o.type==="stall")),"an exhausted Watch can't Stall again");
  ok(E.DB["Pocket Watch"]&&/^Exhaust this:/.test(E.DB["Pocket Watch"].rules),"Pocket Watch text: Exhaust this")}
console.log(`Set 2 Artificer Tactics (Nov 17) checks: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
