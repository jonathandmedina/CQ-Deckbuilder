/* Set 2 Artificer: data, Craft, Recipes, Constructs, tools, Pocket Watch (Stall), Warded Cloak (protection counters), made weapons, Metals.
   Run: node tests/set2_artificer.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
function load(){const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
  vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.SET2_CARDS=SET2_CARDS;this.RECIPES=RECIPES;",ctx);return ctx}
const ctx=load(),E=ctx.CQE;let pass=0,fail=0;
const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Smoke Bomb","Revitalize","Dynamite","Gold Bar","Platinum Bar","Silver Bar","Rose Quartz","Topaz","Almandine","Precognition","Humble","Vandalize","Disarm","Naturalize","Shatter"].map(n=>[n,3]));
const deck=(heroes)=>({name:"T",heroes:heroes.map(h=>"h:"+h),cards:Object.assign({},filler)});
let U=1000;const uid=()=>"u"+(U++);
function game(h0,h1){const s=E.newGame({seed:42,players:[{name:"A",deck:deck(h0||["Artificer A","Artificer B","Artificer C"])},{name:"B",deck:deck(h1||["Divine Knight","Arcane Scholar","Shadow Ranger"])}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});
  s.p.forEach(p=>{p.aura=10;p.inv=[];p.hand=[]});s.prio=0;s.passed=[false,false];return s}
const inv=(s,pid,id)=>{const o=E.invObj(s,pid,{uid:uid(),id,owner:pid});s.p[pid].inv.push(o);return o};
const hand=(s,pid,id)=>{const c={uid:uid(),id,owner:pid};s.p[pid].hand.push(c);return c};
const opts=(s,pid)=>E.options(s,pid);
const canPlay=(s,c)=>opts(s,0).some(o=>o.type==="play"&&o.uid===c.uid);
function resolve(s){let g=0;while(s.pend.length&&g++<20){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(!a)break;E.act(s,pr.pid,a)}}

/* data */
ok(ctx.SET2_CARDS.length===25,"25 Set 2 names");
ok(Object.keys(ctx.RECIPES).length===9,"9 Recipes");
ok(E.DB["Iron Guardians"].type==="Recipe"&&E.DB["Iron Guardians"].recipe,"Recipe in DB with its ingredients");
ok(E.DB["Gearwork Hammer"]&&E.DB["Gearwork Hammer"].kind==="equip"&&E.DB["Gearwork Hammer"].made==="Gearwork Hammer Recipe","made weapon in DB");
ok(E.DB["h:Artificer A"]&&E.DB["h:Artificer A"].aura===2,"Artificer Heroes in DB");
ok(!JSON.stringify(ctx.RECIPES).includes("Assemble"),"held Assemble/Salvage cards left out");
ok(!E.DB["Makeshift Automaton"]&&!E.DB["Spare Parts"],"HELD cards not in the pool");

/* Craft: Iron Guardians */
{const s=game();const c=hand(s,0,"Iron Guardians");ok(!canPlay(s,c),"Recipe not playable without its ingredients");
  inv(s,0,"Iron Ingot");ok(!canPlay(s,c),"not playable with only one of two ingredients");
  inv(s,0,"Silver Ingot");inv(s,0,"Copper Ingot");ok(canPlay(s,c),"playable with Iron + Silver Ingots");
  const a=E.actorFor(s,0),aura=s.p[0].aura;const r=E.act(s,0,{type:"play",uid:c.uid});resolve(s);
  ok(r.ok,"play ok "+(r.err||""));ok(s.p[0].aura===aura-2,"pays 2 Aura");
  ok(s.p[0].inv.map(o=>o.name).join()==="Copper Ingot","ingredients sacrificed, the other Metal stays");
  ok(s.p[0].disc.filter(x=>x.id==="Iron Ingot"||x.id==="Silver Ingot").length===2,"ingredients go to the discard pile");
  const cs=s.p[0].bf.filter(o=>o.name==="Construct");ok(cs.length===2,"two Constructs");
  ok(cs.every(o=>o.str===4&&o.hp===4),"Artificer B: 3/3 Constructs enter as 4/4 ("+cs.map(o=>o.str+"/"+o.hp)+")");
  ok(cs.every(o=>o.ex),"Constructs enter exhausted");ok(s.p[0].disc.some(x=>x.id==="Iron Guardians"),"summon Recipe goes to the discard pile");
  ok(a.ex,"Exhaust this Hero")}
/* Clockwork Pair: any two Metals; Gold Bar isn't a Metal */
{const s=game(["Artificer A","Artificer D","Artificer E"]);const c=hand(s,0,"Clockwork Pair");inv(s,0,"Gold Bar");inv(s,0,"Copper Ingot");
  ok(!canPlay(s,c),"Gold Bar (Precious Metal) isn't a Metal");inv(s,0,"Mithril Ingot");ok(canPlay(s,c),"any two Metals");
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);const cs=s.p[0].bf.filter(o=>o.name==="Construct");ok(cs.length===2&&cs.every(o=>o.str===2&&o.hp===2),"two 2/2 Constructs without Artificer B");
  ok(s.p[0].inv.map(o=>o.name).join()==="Gold Bar","Gold Bar kept")}
/* Quicksilver: any ingredient, used last */
{const s=game(["Artificer A","Artificer D","Artificer E"]);const c=hand(s,0,"Blast Charge Recipe");inv(s,0,"Iron Ingot");const q=inv(s,0,"Quicksilver");
  ok(canPlay(s,c),"Quicksilver stands in for the Copper Ingot");E.act(s,0,{type:"play",uid:c.uid});resolve(s);
  ok(!s.p[0].inv.includes(q),"Quicksilver used up");const bc=s.p[0].inv.find(o=>o.name==="Blast Charge");ok(bc&&bc.id==="Blast Charge","Blast Charge made into the inventory");
  /* Blast Charge: Sacrifice this, Exhaust this Hero: 3 damage to target enemy; the Recipe card goes to the discard pile */
  s.prio=0;const a2=E.actorFor(s,0);a2.ex=false;const en=s.p[1].heroes[1];const hp0=E.hp(s,en);const use=opts(s,0).find(o=>o.type==="use"&&o.uid===bc.uid);ok(use,"Blast Charge can be activated");
  const r=E.act(s,0,Object.assign({},use,{targets:[en.uid]}));resolve(s);ok(r.ok,"activate "+(r.err||""));ok(E.hp(s,en)===hp0-Math.max(0,3-E.defn(s,en)),"Blast Charge deals 3 damage");
  ok(!s.p[0].inv.includes(bc)&&s.p[0].disc.some(x=>x.uid===bc.uid&&x.id==="Blast Charge Recipe"),"sacrificed: the Recipe card goes to the discard pile");ok(a2.ex,"exhausts the Hero")}
/* made weapon: Gearwork Hammer */
{const s=game(["Artificer A","Artificer D","Artificer E"],["Divine Knight","Arcane Scholar","Shadow Ranger"]);const c=hand(s,0,"Gearwork Hammer Recipe");inv(s,0,"Iron Ingot");inv(s,0,"Silver Ingot");
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);const w=s.p[0].inv.find(o=>o.name==="Gearwork Hammer");ok(w&&w.kind==="equip"&&w.pstr===3,"Gearwork Hammer made as a weapon (+3)");
  s.prio=0;const a=E.actorFor(s,0);a.ex=false;const eo=opts(s,0).find(o=>o.type==="equipInv"&&o.uid===w.uid);ok(eo,"any Hero can equip a made weapon from inventory");
  const aura=s.p[0].aura,st0=E.str(s,a);E.act(s,0,eo);ok(s.p[0].aura===aura-2,"equipping costs the weapon's Aura cost (2)");ok(E.str(s,a)===st0+3,"+3 Strength");
  E.destroyObj(s,w);ok(s.p[0].disc.some(x=>x.uid===w.uid&&x.id==="Gearwork Hammer Recipe"),"destroyed weapon goes to the discard pile as its Recipe")}
/* Toolbelt (-1 Aura; upgraded: no exhaust) and Bellows (draw; upgraded: +1 Aura) */
{const s=game(["Artificer D","Artificer A","Artificer E"]);const a=E.actorFor(s,0);
  const tb=E.eqObjFromCard(s,0,{uid:uid(),id:"Toolbelt",owner:0});E.equipTo(s,a,tb);const bl=E.eqObjFromCard(s,0,{uid:uid(),id:"Bellows",owner:0});E.equipTo(s,a,bl);
  ok(E.cardCost(s,0,a,E.DB["Iron Guardians"],0)===1,"Toolbelt: Recipe costs 1 less");
  s.upg={[tb.uid]:1,[bl.uid]:1};const c=hand(s,0,"Iron Guardians");inv(s,0,"Iron Ingot");inv(s,0,"Silver Ingot");const h0=s.p[0].hand.length,au=s.p[0].aura;
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);ok(!a.ex,"upgraded Toolbelt: the Hero isn't exhausted");ok(s.p[0].hand.length===h0-1+1,"Bellows draws a card");ok(s.p[0].aura===au-1+1,"upgraded Bellows: +1 Aura")}
/* Tinker's Goggles: one ingredient may be any Metal, once each turn */
{const s=game(["Artificer D","Artificer A","Artificer E"]);const a=E.actorFor(s,0);E.equipTo(s,a,E.eqObjFromCard(s,0,{uid:uid(),id:"Tinker's Goggles",owner:0}));
  const c=hand(s,0,"Silver Edge Recipe");inv(s,0,"Iron Ingot");inv(s,0,"Copper Ingot");ok(canPlay(s,c),"Goggles: Copper stands in for Silver");
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);ok(s.p[0].inv.some(o=>o.name==="Silver Edge"),"Silver Edge made");
  const c2=hand(s,0,"Silver Edge Recipe");inv(s,0,"Iron Ingot");inv(s,0,"Copper Ingot");a.ex=false;s.prio=0;ok(!canPlay(s,c2),"Goggles only once each turn")}
/* Artificer C: once each turn, one ingredient may be any item */
{const s=game(["Artificer C","Artificer A","Artificer E"]);const c=hand(s,0,"Reclamation Kit Recipe");inv(s,0,"Potion");ok(canPlay(s,c),"Artificer C: a Potion stands in for the Silver Ingot");
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);ok(s.p[0].inv.some(o=>o.name==="Reclamation Kit"),"Reclamation Kit made")}
/* Scavenger's Tongs: one ingredient from your discard pile (exiled); Reclamation Kit returns a Metal */
{const s=game(["Artificer D","Artificer A","Artificer E"]);const a=E.actorFor(s,0);E.equipTo(s,a,E.eqObjFromCard(s,0,{uid:uid(),id:"Scavenger's Tongs",owner:0}));
  const c=hand(s,0,"Reclamation Kit Recipe");const d={uid:uid(),id:"Silver Ingot",owner:0};s.p[0].disc.push(d);ok(canPlay(s,c),"Tongs: Silver Ingot from the discard pile");
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);ok(s.p[0].exile.some(x=>x.uid===d.uid),"the discard-pile ingredient is exiled");
  const kit=s.p[0].inv.find(o=>o.name==="Reclamation Kit");const m={uid:uid(),id:"Copper Ingot",owner:0};s.p[0].disc.push(m);a.ex=false;s.prio=0;
  const u=opts(s,0).find(o=>o.type==="use"&&o.uid===kit.uid);ok(u,"Reclamation Kit can be activated");E.act(s,0,u);resolve(s);
  ok(s.p[0].inv.some(o=>o.uid===m.uid&&o.name==="Copper Ingot"),"Reclamation Kit returns a Metal to inventory");ok(!s.p[0].inv.includes(kit),"Reclamation Kit sacrificed")}
/* Warded Cloak: 3 protection counters, opponents' spells and abilities can't target the Hero */
{const s=game(["Artificer D","Artificer A","Artificer E"]);const c=hand(s,0,"Warded Cloak Recipe");inv(s,0,"Cloak of Protection");inv(s,0,"Platinum Ingot");inv(s,0,"Potion");
  ok(canPlay(s,c),"any Cloak + Platinum Ingot + Potion");E.act(s,0,{type:"play",uid:c.uid});resolve(s);const w=s.p[0].inv.find(o=>o.name==="Warded Cloak");ok(w&&w.prot===3,"made with 3 protection counters");
  const a=E.actorFor(s,0);a.ex=false;s.prio=0;E.act(s,0,opts(s,0).find(o=>o.type==="equipInv"&&o.uid===w.uid));
  const ally=s.p[0].heroes.find(h=>h!==a);const hp0=E.hp(s,ally);E.damage(s,{name:"Test"},ally,5,{card:true});ok(E.hp(s,ally)===hp0&&w.prot===2,"damage to another Hero in the party is prevented, a counter removed");
  E.damage(s,{name:"Test"},a,1,{card:true});E.damage(s,{name:"Test"},a,1,{card:true});ok(w.prot===0,"counters run out");const hp1=E.hp(s,a);E.damage(s,{name:"Test"},a,3,{card:true,ignoreDef:true});ok(E.hp(s,a)===hp1-3,"no counters: damage goes through");
  const spell=E.need(s,1,{type:"play",uid:(hand(s,1,"Lightning Bolt")).uid});const isTarget=sl=>sl.some(x=>x.cands.includes(a.uid));
  ok(!isTarget(spell),"opponent's spell can't target the Warded Hero");ok(isTarget(spell)||true,"");
  const atk=E.need(s,1,{type:"attack",att:s.p[1].heroes[0].uid});ok(isTarget(atk),"the Warded Hero can still be attacked")}
/* Pocket Watch: Stall */
{const s=game(["Artificer D","Artificer A","Artificer E"]);const c=hand(s,0,"Pocket Watch Recipe");inv(s,0,"Gold Bar");inv(s,0,"Platinum Ingot");inv(s,0,"Rose Quartz");
  ok(canPlay(s,c),"Gold Bar, Platinum Ingot and Rose Quartz");E.act(s,0,{type:"play",uid:c.uid});resolve(s);const pw=s.p[0].inv.find(o=>o.name==="Pocket Watch");ok(pw,"Pocket Watch made");
  s.p[0].heroes.forEach(h=>h.ex=false);s.prio=1;const card=hand(s,1,"Precognition");const aura=s.p[1].aura;
  const r=E.act(s,1,{type:"play",uid:card.uid});ok(r.ok,"opponent plays a card");const pr=s.pend[0];ok(pr&&pr.type==="window"&&pr.pid===0,"response window opens for the Pocket Watch");
  const so=opts(s,0).find(o=>o.type==="stall");ok(so,"Stall option");E.act(s,0,so);const h=E.find(s,so.hero).o;ok(h.ex,"exhausts a ready Hero");
  ok((s.p[1].stall||[]).some(x=>x.uid===card.uid&&x.n===2),"the card is set aside with 2 stall counters");ok(s.p[1].aura===aura-1,"its Aura isn't refunded");
  ok(!s.p[1].disc.some(x=>x.uid===card.uid),"the card didn't resolve");
  s.prio=1;s.passed=[false,false];ok(!opts(s,1).some(o=>o.type==="playStalled"),"can't play it yet");
  E.act(s,1,{type:"step"});s.prio=1;E.act(s,1,opts(s,1).find(o=>o.type==="step")||{type:"pass"});
  const st=s.p[1].stall[0];ok(st.n===0,"each action removes a stall counter ("+st.n+")");s.prio=1;s.passed=[false,false];
  s.p[1].heroes.forEach(x=>{x.ex=false;x.fl.stepped=null});const pso=opts(s,1).find(o=>o.type==="playStalled");ok(pso,"then it can be played");
  s.p[0].heroes.forEach(x=>x.ex=true);const au=s.p[1].aura;const rr=E.act(s,1,Object.assign({},pso));if(!rr.ok)console.log("playStalled:",rr.err,JSON.stringify(pso),JSON.stringify(s.p[1].stall));resolve(s);ok(s.p[1].aura===au,"without paying its Aura cost");ok(!(s.p[1].stall||[]).length,"leaves the Stall zone")}
/* Silver Edge (double damage to summons), Mithril Blade (Piercing 2) */
{const s=game(["Artificer D","Artificer A","Artificer E"]);const a=E.actorFor(s,0);const se=E.flipRecipe(s,0,{uid:uid(),id:"Silver Edge Recipe",owner:0});const w=s.p[0].inv.find(o=>o.name==="Silver Edge");s.p[0].inv=[];E.equipTo(s,a,w);
  const z=E.makeSummon(s,1,"Construct",true);z.str=1;z.hp=9;const st=E.str(s,a);E.damage(s,a,z,st,{combat:true});ok(z.dmg===2*st,"Silver Edge doubles damage to summons ("+z.dmg+")");
  const s2=game(["Artificer D","Artificer A","Artificer E"],["Hetroll"].length?["Divine Knight","Arcane Scholar","Shadow Ranger"]:null);const b=E.actorFor(s2,0);E.flipRecipe(s2,0,{uid:uid(),id:"Mithril Blade Recipe",owner:0});const mb=s2.p[0].inv.pop();E.equipTo(s2,b,mb);
  ok(E.str(s2,b)===4,"Mithril Blade +4 Strength");const t=s2.p[1].heroes[0];t.bon.def+=5;const d0=t.dmg||0;s2.prio=0;b.ex=false;
  E.act(s2,0,{type:"attack",att:b.uid,targets:[t.uid]});resolve(s2);ok((t.dmg||0)-d0===Math.max(2,4-Math.max(0,E.defn(s2,t)-2)),"attacks have Piercing 2 ("+((t.dmg||0)-d0)+")")}
/* Metals */
{const s=game(["Artificer D","Artificer A","Artificer E"]);const a=E.actorFor(s,0);
  const use=(id,tg)=>{const o=inv(s,0,id);a.ex=false;s.prio=0;const u=opts(s,0).find(x=>x.type==="use"&&x.uid===o.uid);const r=E.act(s,0,Object.assign({},u,{targets:tg||[]}));resolve(s);return r.ok&&s.p[0].exile.some(x=>x.uid===o.uid)};
  let au=s.p[0].aura;ok(use("Copper Ingot")&&s.p[0].aura===au+1,"Copper Ingot: +1 Aura, exiled");
  const g=s.p[0].gold;ok(use("Platinum Ingot")&&s.p[0].gold===g+3,"Platinum Ingot: +3 Gold");
  const h=s.p[0].hand.length;ok(use("Mithril Ingot")&&s.p[0].hand.length===h+2,"Mithril Ingot: draw 2");
  const al=s.p[0].heroes[2];const d0=E.defn(s,al);ok(use("Iron Ingot",[al.uid])&&E.defn(s,al)===d0+2,"Iron Ingot: +2 Defense");
  const z=E.makeSummon(s,1,"Construct",true);z.str=1;z.hp=5;ok(use("Silver Ingot",[z.uid])&&z.dmg===3,"Silver Ingot: 3 damage to a summon")}
/* Artificer A: look at the top 3, a Metal into inventory */
{const s=game(["Artificer A","Artificer D","Artificer E"]);const pl=s.p[0];pl.lib.push({uid:uid(),id:"Potion",owner:0},{uid:uid(),id:"Mithril Ingot",owner:0},{uid:uid(),id:"Topaz",owner:0});
  const a=E.actorFor(s,0);ok(a.name==="Artificer A","acting Hero");const ab=opts(s,0).find(o=>o.type==="ability");ok(ab,"Artificer A ability offered");E.act(s,0,ab);resolve(s);
  ok(pl.inv.some(o=>o.name==="Mithril Ingot"),"the Metal goes into inventory");ok(pl.lib[0].id==="Topaz"||pl.lib[1].id==="Topaz","the rest go on the bottom")}
console.log(`Set 2 Artificer checks: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
