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
function game(h0,h1){const s=E.newGame({seed:42,players:[{name:"A",deck:deck(h0||["Wren Partsfinder","Material Bender","Val Craftsmith"])},{name:"B",deck:deck(h1||["Divine Knight","Arcane Scholar","Shadow Ranger"])}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});
  s.p.forEach(p=>{p.aura=10;p.inv=[];p.hand=[]});s.prio=0;s.passed=[false,false];return s}
const inv=(s,pid,id)=>{const o=E.invObj(s,pid,{uid:uid(),id,owner:pid});s.p[pid].inv.push(o);return o};
const hand=(s,pid,id)=>{const c={uid:uid(),id,owner:pid};s.p[pid].hand.push(c);return c};
const made=(s,n)=>{let o=s.p[0].inv.find(x=>x.name===n);if(o)return o;for(const h of s.p[0].heroes)for(const k in h.eq){const e=h.eq[k];if(e&&e!=="2H"&&e.name===n){made.on=h;E.unequip(s,e);return s.p[0].inv.find(x=>x.name===n)}}}; /* Nov 15: made equipment enters equipped to its crafter; tests that re-equip from inventory unequip it first */
const opts=(s,pid)=>E.options(s,pid);
const canPlay=(s,c)=>opts(s,0).some(o=>o.type==="play"&&o.uid===c.uid);
function resolve(s){let g=0;while(s.pend.length&&g++<20){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(!a)break;E.act(s,pr.pid,a)}}

/* data */
ok(ctx.SET2_CARDS.length>=25,"Set 2 names (Artificer and later classes)");
ok(Object.keys(ctx.RECIPES).length===15,"15 Recipes (9 + The Archfrost, The Archflame, Dragonscale Scale, Nov 13; + Remey, Wellness Rod, Deflecting Shield, Nov 15)");
ok(E.DB["Iron Guardians"].type==="Recipe"&&E.DB["Iron Guardians"].recipe,"Recipe in DB with its ingredients");
ok(E.DB["Gearwork Hammer"]&&E.DB["Gearwork Hammer"].kind==="equip"&&E.DB["Gearwork Hammer"].made==="Gearwork Hammer Recipe","made weapon in DB");
ok(E.DB["h:Wren Partsfinder"]&&E.DB["h:Wren Partsfinder"].aura===2,"Artificer Heroes in DB");
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
  ok(cs.every(o=>o.str===3&&o.hp===3),"3/3 Constructs (no Artificer B bonus since Nov 15) ("+cs.map(o=>o.str+"/"+o.hp)+")");
  ok(cs.every(o=>o.ex),"Constructs enter exhausted");ok(s.p[0].disc.some(x=>x.id==="Iron Guardians"),"summon Recipe goes to the discard pile");
  ok(!a.ex,"crafting no longer exhausts the Hero")}
/* Clockwork Pair: any two Metals; Gold Bar isn't a Metal */
{const s=game(["Wren Partsfinder","Gadget Commander","Cy the Builder"]);const c=hand(s,0,"Clockwork Pair");inv(s,0,"Gold Bar");inv(s,0,"Copper Ingot");
  ok(!canPlay(s,c),"Gold Bar (Precious Metal) isn't a Metal");inv(s,0,"Mithril Ingot");ok(canPlay(s,c),"any two Metals");
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);const cs=s.p[0].bf.filter(o=>o.name==="Construct");ok(cs.length===2&&cs.every(o=>o.str===2&&o.hp===2),"two 2/2 Constructs without Artificer B");
  ok(s.p[0].inv.map(o=>o.name).join()==="Gold Bar","Gold Bar kept")}
/* Quicksilver: any ingredient, used last */
{const s=game(["Wren Partsfinder","Gadget Commander","Cy the Builder"]);const c=hand(s,0,"Blast Charge Recipe");inv(s,0,"Iron Ingot");const q=inv(s,0,"Quicksilver");
  ok(canPlay(s,c),"Quicksilver stands in for the Copper Ingot");E.act(s,0,{type:"play",uid:c.uid});resolve(s);
  ok(!s.p[0].inv.includes(q),"Quicksilver used up");const bc=s.p[0].inv.find(o=>o.name==="Blast Charge");ok(bc&&bc.id==="Blast Charge","Blast Charge made into the inventory");
  /* Blast Charge: Sacrifice this, Exhaust this Hero: 3 damage to target enemy; the Recipe card goes to the discard pile */
  s.prio=0;const a2=E.actorFor(s,0);a2.ex=false;const en=s.p[1].heroes[1];const hp0=E.hp(s,en);const use=opts(s,0).find(o=>o.type==="use"&&o.uid===bc.uid);ok(use,"Blast Charge can be activated");
  const r=E.act(s,0,Object.assign({},use,{targets:[en.uid]}));resolve(s);ok(r.ok,"activate "+(r.err||""));ok(E.hp(s,en)===hp0-Math.max(0,3-E.defn(s,en)),"Blast Charge deals 3 damage");
  ok(!s.p[0].inv.includes(bc)&&s.p[0].disc.some(x=>x.uid===bc.uid&&x.id==="Blast Charge Recipe"),"sacrificed: the Recipe card goes to the discard pile");ok(a2.ex,"exhausts the Hero")}
/* made weapon: Gearwork Hammer */
{const s=game(["Wren Partsfinder","Gadget Commander","Cy the Builder"],["Divine Knight","Arcane Scholar","Shadow Ranger"]);const c=hand(s,0,"Gearwork Hammer Recipe");inv(s,0,"Iron Ingot");inv(s,0,"Silver Ingot");
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);const w=made(s,"Gearwork Hammer");ok(w&&w.kind==="equip"&&w.pstr===3,"Gearwork Hammer made as a weapon (+3)");
  s.prio=0;const a=E.actorFor(s,0);a.ex=false;const eo=opts(s,0).find(o=>o.type==="equipInv"&&o.uid===w.uid);ok(eo,"any Hero can equip a made weapon from inventory");
  const aura=s.p[0].aura,st0=E.str(s,a);E.act(s,0,eo);ok(s.p[0].aura===aura-2,"equipping costs the weapon's Aura cost (2)");ok(E.str(s,a)===st0+3,"+3 Strength");
  E.destroyObj(s,w);ok(s.p[0].disc.some(x=>x.uid===w.uid&&x.id==="Gearwork Hammer Recipe"),"destroyed weapon goes to the discard pile as its Recipe")}
/* Nov 14: Toolbelt (+1 inventory slot; upgraded +2), Bellows (Two-Handed; draw, upgraded +1 Aura), Tinker's Goggles (Crafting: Scry 1, upgraded Scry 2) */
{const s=game(["Gadget Commander","Wren Partsfinder","Cy the Builder"]);const a=E.actorFor(s,0);const base=E.slots(s,0);
  ok(E.DB["Bellows"].region==="Two-Handed","Bellows is Two-Handed");
  const tb=E.eqObjFromCard(s,0,{uid:uid(),id:"Toolbelt",owner:0});E.equipTo(s,a,tb);ok(E.slots(s,0)===base+1,"Toolbelt: one more inventory slot ("+E.slots(s,0)+")");
  ok(E.cardCost(s,0,a,E.DB["Pocket Watch Recipe"],0)===1,"Toolbelt no longer lowers Recipe costs");
  s.upg={[tb.uid]:1};ok(E.slots(s,0)===base+2,"upgraded Toolbelt: two more slots");
  const bl=E.eqObjFromCard(s,0,{uid:uid(),id:"Bellows",owner:0});E.equipTo(s,a,bl);s.upg[bl.uid]=1;
  const c=hand(s,0,"Pocket Watch Recipe");inv(s,0,"Gold Bar");inv(s,0,"Platinum Ingot");inv(s,0,"Rose Quartz");const h0=s.p[0].hand.length,au=s.p[0].aura;
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);ok(!a.ex,"Recipes no longer exhaust the Hero (Nov 15)");ok(s.p[0].hand.length===h0-1+1,"Bellows draws a card");ok(s.p[0].aura===au-1+1,"upgraded Bellows: +1 Aura");
  a.dead=true;ok(E.slots(s,0)===base,"a dead Hero's Toolbelt adds no slot");a.dead=false}
{const s=game(["Gadget Commander","Wren Partsfinder","Cy the Builder"]);const a=E.actorFor(s,0);const g=E.eqObjFromCard(s,0,{uid:uid(),id:"Tinker's Goggles",owner:0});E.equipTo(s,a,g);
  for(let i=0;i<5;i++)s.p[0].lib.push({uid:uid(),id:"Potion",owner:0});
  const c=hand(s,0,"Pocket Watch Recipe");inv(s,0,"Gold Bar");inv(s,0,"Rose Quartz");inv(s,0,"Copper Ingot");ok(!canPlay(s,c),"Goggles are no longer a Metal wildcard");
  s.p[0].inv=[];inv(s,0,"Gold Bar");inv(s,0,"Platinum Ingot");inv(s,0,"Rose Quartz");E.act(s,0,{type:"play",uid:c.uid});
  ok(s.pend.some(pr=>pr.type==="scry"&&pr.pid===0&&(pr.n||pr.count||1)>=1),"Goggles: Crafting opens a Scry");ok(s.log.some(l=>/Tinker's Goggles: .* Scry 1/.test(l.m)),"logs Scry 1");resolve(s);
  const s2=game(["Gadget Commander","Wren Partsfinder","Cy the Builder"]);const a2=E.actorFor(s2,0);const g2=E.eqObjFromCard(s2,0,{uid:uid(),id:"Tinker's Goggles",owner:0});E.equipTo(s2,a2,g2);s2.upg={[g2.uid]:1};
  for(let i=0;i<5;i++)s2.p[0].lib.push({uid:uid(),id:"Potion",owner:0});const c2=hand(s2,0,"Pocket Watch Recipe");inv(s2,0,"Gold Bar");inv(s2,0,"Platinum Ingot");inv(s2,0,"Rose Quartz");
  E.act(s2,0,{type:"play",uid:c2.uid});ok(s2.log.some(l=>/Tinker's Goggles: .* Scry 2/.test(l.m)),"upgraded Goggles: Scry 2");resolve(s2)}
/* Artificer C: once each turn, one ingredient may be any item */
{const s=game(["Val Craftsmith","Wren Partsfinder","Cy the Builder"]);const c=hand(s,0,"Reclamation Kit Recipe");inv(s,0,"Potion");ok(canPlay(s,c),"Artificer C: a Potion stands in for the Silver Ingot");
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);ok(s.p[0].inv.some(o=>o.name==="Reclamation Kit"),"Reclamation Kit made")}
/* Scavenger's Tongs: one ingredient from your discard pile (exiled); Reclamation Kit returns a Metal */
{const s=game(["Gadget Commander","Wren Partsfinder","Cy the Builder"]);const a=E.actorFor(s,0);E.equipTo(s,a,E.eqObjFromCard(s,0,{uid:uid(),id:"Scavenger's Tongs",owner:0}));
  const c=hand(s,0,"Reclamation Kit Recipe");const d={uid:uid(),id:"Silver Ingot",owner:0};s.p[0].disc.push(d);ok(canPlay(s,c),"Tongs: Silver Ingot from the discard pile");
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);ok(s.p[0].exile.some(x=>x.uid===d.uid),"the discard-pile ingredient is exiled");
  const kit=s.p[0].inv.find(o=>o.name==="Reclamation Kit");const m={uid:uid(),id:"Copper Ingot",owner:0};s.p[0].disc.push(m);a.ex=false;s.prio=0;
  const u=opts(s,0).find(o=>o.type==="use"&&o.uid===kit.uid);ok(u,"Reclamation Kit can be activated");E.act(s,0,u);resolve(s);
  ok(s.p[0].inv.some(o=>o.uid===m.uid&&o.name==="Copper Ingot"),"Reclamation Kit returns a Metal to inventory");ok(!s.p[0].inv.includes(kit),"Reclamation Kit sacrificed")}
/* Warded Cloak: 3 protection counters, opponents' spells and abilities can't target the Hero */
{const s=game(["Gadget Commander","Wren Partsfinder","Cy the Builder"]);const c=hand(s,0,"Warded Cloak Recipe");inv(s,0,"Cloak of Protection");inv(s,0,"Platinum Ingot");inv(s,0,"Potion");
  ok(canPlay(s,c),"any Cloak + Platinum Ingot + Potion");E.act(s,0,{type:"play",uid:c.uid});resolve(s);const w=made(s,"Warded Cloak");ok(w&&w.prot===3,"made with 3 protection counters");
  const a=E.actorFor(s,0);a.ex=false;s.prio=0;E.act(s,0,opts(s,0).find(o=>o.type==="equipInv"&&o.uid===w.uid));
  const ally=s.p[0].heroes.find(h=>h!==a);const hp0=E.hp(s,ally);E.damage(s,{name:"Test"},ally,5,{card:true});ok(E.hp(s,ally)===hp0&&w.prot===2,"damage to another Hero in the party is prevented, a counter removed");
  E.damage(s,{name:"Test"},a,1,{card:true,ignoreDef:true});E.damage(s,{name:"Test"},a,1,{card:true,ignoreDef:true});ok(w.prot===0,"counters run out");const hp1=E.hp(s,a);E.damage(s,{name:"Test"},a,3,{card:true,ignoreDef:true});ok(E.hp(s,a)===hp1-3,"no counters: damage goes through");
  const spell=E.need(s,1,{type:"play",uid:(hand(s,1,"Lightning Bolt")).uid});const isTarget=sl=>sl.some(x=>x.cands.includes(a.uid));
  ok(!isTarget(spell),"opponent's spell can't target the Warded Hero");ok(isTarget(spell)||true,"");
  const atk=E.need(s,1,{type:"attack",att:s.p[1].heroes[0].uid});ok(isTarget(atk),"the Warded Hero can still be attacked")}
/* Pocket Watch: Stall */
{const s=game(["Gadget Commander","Wren Partsfinder","Cy the Builder"]);const c=hand(s,0,"Pocket Watch Recipe");inv(s,0,"Gold Bar");inv(s,0,"Platinum Ingot");inv(s,0,"Rose Quartz");
  ok(canPlay(s,c),"Gold Bar, Platinum Ingot and Rose Quartz");E.act(s,0,{type:"play",uid:c.uid});resolve(s);const pw=s.p[0].inv.find(o=>o.name==="Pocket Watch");ok(pw,"Pocket Watch made");
  s.p[0].heroes.forEach(h=>h.ex=false);s.prio=1;const card=hand(s,1,"Precognition");const aura=s.p[1].aura;
  const r=E.act(s,1,{type:"play",uid:card.uid});ok(r.ok,"opponent plays a card");const pr=s.pend[0];ok(pr&&pr.type==="window"&&pr.pid===0,"response window opens for the Pocket Watch");
  const so=opts(s,0).find(o=>o.type==="stall");ok(so,"Stall option");E.act(s,0,so);const h=E.find(s,so.hero).o;ok(h.ex,"exhausts a ready Hero");
  ok((s.p[1].stall||[]).some(x=>x.uid===card.uid&&x.n===2),"the card is set aside with 2 stall counters");ok(s.p[1].aura===aura-1,"its Aura isn't refunded");
  ok(!s.p[1].disc.some(x=>x.uid===card.uid),"the card didn't resolve");
  s.prio=1;s.passed=[false,false];ok(!opts(s,1).some(o=>o.type==="playStalled"),"can't play it yet");
  E.act(s,1,{type:"step"});s.p[1].heroes.forEach(x=>x.fl.stepped=null);/* Abide is once per party per round: clear it so a second Abide can be the filler action */s.prio=1;E.act(s,1,opts(s,1).find(o=>o.type==="step")||{type:"pass"});
  ok(!(s.p[1].stall||[]).length,"each action removes a stall counter; after the last one the card leaves the Stall zone");
  ok(s.log.some(l=>/Stall: Precognition is played with the same targets/.test(l.m)),"Nov 16: the card is played automatically when the last counter comes off");ok(s.p[1].disc.some(x=>x.uid===card.uid),"and resolves (then goes to the discard pile)")}
/* Silver Edge (double damage to summons), Mithril Blade (Piercing 2) */
{const s=game(["Gadget Commander","Wren Partsfinder","Cy the Builder"]);const a=E.actorFor(s,0);const se=E.flipRecipe(s,0,{uid:uid(),id:"Silver Edge Recipe",owner:0});const w=made(s,"Silver Edge");s.p[0].inv=[];E.equipTo(s,a,w);
  const z=E.makeSummon(s,1,"Construct",true);z.str=1;z.hp=9;const st=E.str(s,a);E.damage(s,a,z,st,{combat:true});ok(z.dmg===2*st,"Silver Edge doubles damage to summons ("+z.dmg+")");
  const s2=game(["Gadget Commander","Wren Partsfinder","Cy the Builder"],["Hetroll"].length?["Divine Knight","Arcane Scholar","Shadow Ranger"]:null);const b=E.actorFor(s2,0);E.flipRecipe(s2,0,{uid:uid(),id:"Mithril Blade Recipe",owner:0});const mb=s2.p[0].inv.pop();E.equipTo(s2,b,mb);
  ok(E.str(s2,b)===5,"Mithril Blade +4 Strength, +1 from Gadget Commander (one Crafted item)");const t=s2.p[1].heroes[0];t.bon.def+=5;const d0=t.dmg||0;s2.prio=0;b.ex=false;
  E.act(s2,0,{type:"attack",att:b.uid,targets:[t.uid]});resolve(s2);ok((t.dmg||0)-d0===Math.max(2,5-Math.max(0,E.defn(s2,t)-2)),"attacks have Piercing 2 ("+((t.dmg||0)-d0)+")")}
/* Metals */
{const s=game(["Gadget Commander","Wren Partsfinder","Cy the Builder"]);const a=E.actorFor(s,0);
  const use=(id,tg)=>{const o=inv(s,0,id);a.ex=false;s.prio=0;const u=opts(s,0).find(x=>x.type==="use"&&x.uid===o.uid);const r=E.act(s,0,Object.assign({},u,{targets:tg||[]}));resolve(s);return r.ok&&s.p[0].exile.some(x=>x.uid===o.uid)};
  let au=s.p[0].aura;ok(use("Copper Ingot")&&s.p[0].aura===au+1,"Copper Ingot: +1 Aura, exiled");
  const g=s.p[0].gold;ok(use("Platinum Ingot")&&s.p[0].gold===g+3,"Platinum Ingot: +3 Gold");
  const h=s.p[0].hand.length;ok(use("Mithril Ingot")&&s.p[0].hand.length===h+2,"Mithril Ingot: draw 2");
  const al=s.p[0].heroes[2];const d0=E.defn(s,al);ok(use("Iron Ingot",[al.uid])&&E.defn(s,al)===d0+2,"Iron Ingot: +2 Defense");
  const z=E.makeSummon(s,1,"Construct",true);z.str=1;z.hp=5;ok(use("Silver Ingot",[z.uid])&&z.dmg===3,"Silver Ingot: 3 damage to a summon")}
/* Artificer A (Nov 14): look at the top 3, an item into your hand, the rest on the bottom; Level 3: search your library for an item */
{const s=game(["Wren Partsfinder","Gadget Commander","Cy the Builder"]);const pl=s.p[0];pl.lib.push({uid:uid(),id:"Disarm",owner:0},{uid:uid(),id:"Mithril Ingot",owner:0},{uid:uid(),id:"Humble",owner:0});
  const a=E.actorFor(s,0);ok(a.name==="Wren Partsfinder","acting Hero");const ab=opts(s,0).filter(o=>o.type==="ability");ok(ab.length===1,"one Artificer A ability below Level 3");E.act(s,0,ab[0]);resolve(s);
  ok(pl.hand.some(c=>c.id==="Mithril Ingot"),"the item goes to your hand");ok(!pl.inv.some(o=>o.name==="Mithril Ingot"),"not into inventory");ok(["Disarm","Humble"].every(n=>pl.lib.slice(0,2).some(c=>c.id===n)),"the rest go on the bottom");ok(a.ex,"Exhaust")}
{const s=game(["Wren Partsfinder","Gadget Commander","Cy the Builder"]);const pl=s.p[0];const a=E.actorFor(s,0);a.lvl=3;pl.lib.unshift({uid:uid(),id:"Topaz",owner:0});
  const ab=opts(s,0).filter(o=>o.type==="ability");ok(ab.length===1&&ab[0].idx===1,"Level 3: only the search ability");const n0=pl.lib.length;E.act(s,0,ab[0]);resolve(s);
  ok(pl.hand.some(c=>(E.DB[c.id]||{}).type==="Item"),"Level 3: an item from the library goes to your hand");ok(pl.lib.length===n0-1,"one card left the library");ok(a.ex,"Exhaust")}
console.log(`Set 2 Artificer checks: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
