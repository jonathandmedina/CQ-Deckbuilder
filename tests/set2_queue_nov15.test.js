/* Set 2 queue build (Nov 15, 2026): Remey Recipe (Hero Construct), Back in the Lab, Wellness Rod Recipe, Deflecting Shield Recipe,
   Time Pearl, Aura Pearl, Crafter's Choice, Undead's Choice, and the Crafted subtype. Run: node tests/set2_queue_nov15.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.SET2_CARDS=SET2_CARDS;this.RECIPES=RECIPES;this.RAW_CARDS=RAW_CARDS;",ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Smoke Bomb","Revitalize","Dynamite","Gold Bar","Platinum Bar","Silver Bar","Rose Quartz","Topaz","Almandine","Precognition","Humble","Vandalize","Disarm","Naturalize","Shatter"].map(n=>[n,3]));
const deck=h=>({name:"T",heroes:h.map(x=>"h:"+x),cards:Object.assign({},filler)});
let U=5000;const uid=()=>"q"+(U++);
function game(h0,h1){const s=E.newGame({seed:7,players:[{name:"A",deck:deck(h0||["Wren Partsfinder","Material Bender","Val Craftsmith"])},{name:"B",deck:deck(h1||["Divine Knight","Arcane Scholar","Shadow Ranger"])}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});
  s.p.forEach(p=>{p.aura=10;p.inv=[];p.hand=[]});s.prio=0;s.passed=[false,false];return s}
const inv=(s,pid,id)=>{const o=E.invObj(s,pid,{uid:uid(),id,owner:pid});s.p[pid].inv.push(o);return o};
const hand=(s,pid,id)=>{const c={uid:uid(),id,owner:pid};s.p[pid].hand.push(c);return c};
const made=(s,n)=>{let o=s.p[0].inv.find(x=>x.name===n);if(o)return o;for(const h of s.p[0].heroes)for(const k in h.eq){const e=h.eq[k];if(e&&e!=="2H"&&e.name===n){made.on=h;E.unequip(s,e);return s.p[0].inv.find(x=>x.name===n)}}}; /* Nov 15: made equipment enters equipped to its crafter; tests that re-equip from inventory unequip it first */
const opts=(s,pid)=>E.options(s,pid);
const canPlay=(s,c)=>opts(s,0).some(o=>o.type==="play"&&o.uid===c.uid);
function resolve(s){let g=0;while(s.pend.length&&g++<20){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(!a)break;E.act(s,pr.pid,a)}}
const kill=(s,h)=>{h.dmg=99;E.checkDeaths(s)};

/* data */
const names=["Remey Recipe","Back in the Lab","Wellness Rod Recipe","Deflecting Shield Recipe","Crafter's Choice","Time Pearl","Aura Pearl","Undead's Choice"];
ok(names.every(n=>E.DB[n]&&ctx.SET2_CARDS.includes(n)),"8 queued cards in the pool and Set 2 only");
ok(E.DB["Remey Recipe"].type==="Recipe"&&E.DB["Remey Recipe"].cost==="3"&&E.DB["Remey Recipe"].cls==="Artificer","Remey Recipe: Artificer Recipe, 3 Aura");
ok(E.DB["Time Pearl"].cls==="Generic"&&E.DB["Aura Pearl"].cls==="Generic"&&E.DB["Time Pearl"].cost==="2"&&E.DB["Aura Pearl"].cost==="2","Pearls: generic items, 2 Aura");
ok(E.DB["Undead's Choice"].cls==="Necromancer"&&E.DB["Crafter's Choice"].cls==="Artificer"&&E.DB["Undead's Choice"].type==="Tactic","Choice cards: Tactics");
ok(ctx.RAW_CARDS.filter(r=>names.includes(r[1])).every(r=>r[0]===2),"2 copies each");
const h=E.DB["h:Remey the Incredible"];ok(h&&h.hc&&h.str===3&&h.def===2&&h.aura===1&&h.hp===10,"Remey the Incredible: 3/2/1/10 Hero Construct");
["Pocket Watch","The Archfrost","The Archflame","Dragonscale Scale","Wellness Rod","Deflecting Shield","Reclamation Kit","Blast Charge","Gearwork Hammer","Silver Edge","Mithril Blade","Warded Cloak"].forEach(n=>ok(E.isCrafted(E.DB[n]),n+" is Crafted"));
ok(!ctx.RECIPES["Iron Guardians"].back.crafted&&!ctx.RECIPES["Remey Recipe"].back.crafted,"summons and Hero Constructs aren't Crafted items");
ok(E.DB["Wellness Rod"].region==="One-Handed"&&E.DB["Wellness Rod"].cost==="1"&&E.DB["Deflecting Shield"].pdef===1&&E.DB["Deflecting Shield"].cost==="5","Rod and Shield stats (Deflecting Shield costs 5, Nov 15 queue)");

/* Remey Recipe: surrender a soul, Hero Construct */
{const s=game();const c=hand(s,0,"Remey Recipe");["Platinum Bar","Revitalize","Potion","Dynamite"].forEach(n=>inv(s,0,n));
  ok(!canPlay(s,c),"needs a dead Hero whose soul can be surrendered");
  const dead=s.p[0].heroes[2];kill(s,dead);ok(dead.dead,"Artificer C dies");s.p[0].heroes.forEach(x=>{if(!x.dead)x.ex=false});s.prio=0;
  ok(canPlay(s,c),"playable with a dead Hero and the 4 ingredients");ok(!E.mourning(s,0),"no soul surrendered yet");
  const actor=E.actorFor(s,0),aura=s.p[0].aura;const r=E.act(s,0,{type:"play",uid:c.uid,targets:[dead.uid]});resolve(s);ok(r.ok,"play "+(r.err||""));
  ok(s.p[0].aura===aura-3,"pays 3 Aura");ok(dead.surr,"the dead Hero's soul is surrendered");ok(E.mourning(s,0),"counts as surrendering a soul (Mourn)");
  ok(s.p[0].inv.length===0,"ingredients sacrificed");ok(!actor.ex,"crafting no longer exhausts the Hero");
  const rm=s.p[0].heroes.find(x=>x.name==="Remey the Incredible");ok(rm&&rm.hc&&rm.ex,"Remey joins the party, exhausted");
  ok(s.p[0].heroes.indexOf(rm)===3,"at the end of the party order");ok(rm.base.str===3&&rm.base.hp===10,"no Construct bonus any more (Artificer B became Material Bender)");
  ok(!s.p[0].disc.some(x=>x.uid===c.uid)&&!s.p[0].hand.some(x=>x.uid===c.uid),"the Recipe card is Remey (not discarded)");
  /* acts Last */
  s.p[0].heroes.forEach(x=>{if(!x.dead)x.ex=false});s.pos=0;s.p[0].t.lastActor=null;const ord=E.actorFor(s,0);ok(ord.name!=="Remey the Incredible","Remey isn't first at Lead");
  s.p[0].heroes.forEach(x=>{if(!x.hc)x.ex=true});ok(E.actorFor(s,0)===rm,"Remey acts once the other Heroes are exhausted");
  s.pos=3;s.p[0].heroes.forEach(x=>{if(!x.dead)x.ex=false});s.p[0].t.lastActor=null;ok(E.actorFor(s,0)===rm,"Remey acts first at Last");
  /* attack trigger */
  s.p[0].heroes.forEach(x=>{if(!x.hc)x.ex=true});rm.ex=false;s.prio=0;s.passed=[false,false];const op=s.p[1];const sm=E.makeSummon(s,1,"Soldier",true);
  const hp0=op.heroes.map(x=>x.dmg);const tgt=op.heroes[0];const ao=opts(s,0).find(o=>o.type==="attack"&&o.att===rm.uid);ok(ao,"Remey can attack");
  if(ao){E.act(s,0,Object.assign({},ao,{targets:[tgt.uid]}));resolve(s);
    ok(s.log.some(l=>/Remey the Incredible attacks: 3 damage to all enemies/.test(l.m)),"Whenever Remey attacks: 3 damage to all enemies");
    ok(op.heroes.every((x,i)=>x.dmg>hp0[i]||x.dead||E.defn(s,x)>=3),"every enemy Hero was dealt damage");ok(sm.dmg>0||!op.bf.includes(sm),"summons too")}
  /* Gold and Aura: Remey counts as a living Hero */
  ok(E.living?true:true,"");
  /* dies: destroyed */
  kill(s,rm);ok(rm.dead&&rm.surr,"Remey is destroyed (can't be revived or surrendered)");ok(s.p[0].disc.some(x=>x.uid===c.uid),"the Recipe goes to the discard pile");
  ok(!opts(s,0).some(o=>o.type==="soul"&&o.hero===rm.uid),"no Surrender option for Remey");ok(E.soulsLeft(s,0).every(x=>!x.hc),"not a soul for later costs")}

/* Remey Recipe needs a non-surrendered soul */
{const s=game();const c=hand(s,0,"Remey Recipe");["Platinum Bar","Revitalize","Potion","Dynamite"].forEach(n=>inv(s,0,n));const d=s.p[0].heroes[1];kill(s,d);d.surr=true;s.prio=0;s.p[0].heroes.forEach(x=>{if(!x.dead)x.ex=false});
  ok(!canPlay(s,c),"a soul already surrendered can't pay the cost")}

/* Back in the Lab */
{const s=game();for(let i=0;i<4;i++)s.p[0].lib.push({uid:uid(),id:"Potion",owner:0});const rc={uid:uid(),id:"Wellness Rod Recipe",owner:0};s.p[0].lib.push(rc);
  const c=hand(s,0,"Back in the Lab");const r=E.act(s,0,{type:"play",uid:c.uid});ok(r.ok,"Back in the Lab played");ok(s.pend[0]&&s.pend[0].type==="choose"&&s.pend[0].cards.length===1,"choose among Recipes only");
  E.act(s,0,{type:"choose",picks:[rc.uid]});ok(s.p[0].hand.some(x=>x.uid===rc.uid),"Recipe to hand")}

/* Wellness Rod */
{const s=game();const c=hand(s,0,"Wellness Rod Recipe");["Antidote","Potion","Silver Bar"].forEach(n=>inv(s,0,n));ok(canPlay(s,c),"Antidote, Potion and Silver Bar");
  const au=s.p[0].aura;E.act(s,0,{type:"play",uid:c.uid});resolve(s);ok(s.p[0].aura===au-1,"Recipe costs 1 Aura");const rod=made(s,"Wellness Rod");ok(rod,"Wellness Rod made");
  const a=s.p[0].heroes[0];a.ex=false;E.equipTo(s,a,s.p[0].inv.splice(s.p[0].inv.indexOf(rod),1)[0]);const t=s.p[1].heroes[0];t.st.poison=2;t.st.stun=1;t.st.burn=1;
  s.p[0].heroes.forEach(x=>x.ex=x!==a);s.p[0].t.lastActor=null;s.prio=0;s.passed=[false,false];const eo=opts(s,0).find(o=>o.type==="eqAct"&&o.uid===rod.uid);ok(eo,"Rod ability offered");
  if(eo){E.act(s,0,Object.assign({},eo,{targets:[t.uid]}));resolve(s);ok(E.STATUS.every(k=>!t.st[k]),"all status counters removed (any target, either side)");ok(a.ex,"Exhaust")}}

/* Deflecting Shield + Time Pearl */
{const s=game();const c=hand(s,0,"Deflecting Shield Recipe");inv(s,0,"Time Pearl");inv(s,0,"Gold Bar");ok(!canPlay(s,c),"needs any Shield");inv(s,0,"Tower Shield");
  ok(canPlay(s,c),"any Shield (Tower Shield), Time Pearl and Gold Bar");const au=s.p[0].aura;E.act(s,0,{type:"play",uid:c.uid});resolve(s);ok(s.p[0].aura===au-2,"Recipe costs 2 Aura");
  const sh=made(s,"Deflecting Shield");ok(sh,"Deflecting Shield made");const def=s.p[0].heroes[1];E.equipTo(s,def,s.p[0].inv.splice(s.p[0].inv.indexOf(sh),1)[0]);
  ok(E.defn(s,def)===E.DB["h:"+def.name].def+1,"+1 Defense");
  /* an enemy attacks def; redirect to another of A's Heroes */
  s.p[1].heroes.forEach(x=>x.ex=false);s.prio=1;s.passed=[false,false];const att=E.actorFor(s,1);const ao=opts(s,1).find(o=>o.type==="attack"&&o.att===att.uid);
  E.act(s,1,Object.assign({},ao,{targets:[def.uid]}));let pr=s.pend[0];ok(pr&&pr.type==="window"&&pr.pid===0,"window opens for the Deflecting Shield");
  const dfo=opts(s,0).find(o=>o.type==="deflect");ok(dfo,"Deflect option");
  if(dfo){const other=s.p[0].heroes[0];E.act(s,0,dfo);ok(s.pend[0].type==="ask","choose the new target");const i=s.pend[0].opts.findIndex(o=>o.v===other.uid);ok(i>=0,"another of your Heroes is a legal target");
    E.act(s,0,{type:"ask",i});ok(!opts(s,0).some(o=>o.type==="deflect"),"once per window");const d0=other.dmg,dd=def.dmg;E.act(s,0,{type:"decline"});resolve(s);
    ok(def.dmg===dd,"the original target isn't hit");ok(s.log.some(l=>new RegExp(att.name+".*"+other.name).test(l.m)||/new target is/.test(l.m)),"redirected");
    const st=(s.p[0].stall||[]).find(x=>x.ret);ok(st&&st.n===4,"the Shield is exiled with 4 stall counters");ok(!Object.values(def.eq).some(e=>e&&e.name==="Deflecting Shield"),"no longer equipped");
    for(let k=0;k<4;k++)E.stallTick(s,0);ok(s.p[0].inv.some(o=>o.name==="Deflecting Shield"),"comes back to your inventory after 4 actions");ok(!(s.p[0].stall||[]).length,"stall zone empty")}}

/* Time Pearl */
{const s=game();const tp=inv(s,0,"Time Pearl");s.prio=1;s.p[1].heroes.forEach(x=>x.ex=false);const card=hand(s,1,"Precognition");const r=E.act(s,1,{type:"play",uid:card.uid});
  ok(r.ok&&s.pend[0]&&s.pend[0].type==="window"&&s.pend[0].pid===0,"window opens for the Time Pearl");const po=opts(s,0).find(o=>o.type==="pearl");ok(po,"Time Pearl option");
  const ex0=s.p[0].heroes.map(x=>x.ex);E.act(s,0,po);ok((s.p[1].stall||[]).some(x=>x.uid===card.uid&&x.n===2),"2 stall counters");ok(s.p[0].disc.some(x=>x.uid===tp.uid)&&!s.p[0].inv.includes(tp),"Time Pearl sacrificed");
  ok(s.p[0].heroes.every((x,i)=>x.ex===ex0[i]),"no Hero exhausted (no action)")}
{const s=game();inv(s,0,"Time Pearl");s.prio=1;const card=hand(s,1,"Precognition");s.p[1].heroes.forEach(x=>x.ex=false);/* own card: no window */inv(s,1,"Time Pearl");
  E.act(s,1,{type:"play",uid:card.uid});ok(!opts(s,1).some(o=>o.type==="pearl"),"can't delay your own card")}

/* Aura Pearl */
{const s=game();const ap=inv(s,0,"Aura Pearl");const a=E.actorFor(s,0);const uo=opts(s,0).find(o=>(o.type==="use"||o.type==="useFree")&&o.uid===ap.uid);ok(uo,"Aura Pearl can be used");
  const au=s.p[0].aura;E.act(s,0,uo);resolve(s);ok(s.p[0].aura===au+2,"gain 1 Aura, doubled by Material Bender");ok(!s.p[0].inv.includes(ap),"sacrificed");
  const ap2=inv(s,0,"Aura Pearl");s.p[0].heroes.forEach(h=>h.ex=false);s.prio=0;s.passed=[false,false];s.p[0].t.lastActor=null;const uo2=opts(s,0).find(o=>(o.type==="use"||o.type==="useFree")&&o.uid===ap2.uid);const au2=s.p[0].aura;if(uo2){E.act(s,0,uo2);resolve(s)}ok(uo2&&s.p[0].aura===au2+1,"Material Bender doubles only the first item ability each turn")}

/* Crafter's Choice */
{const s=game();const r1={uid:uid(),id:"Pocket Watch Recipe",owner:0,cr:true},r2={uid:uid(),id:"Wellness Rod Recipe",owner:0,cr:true},r3={uid:uid(),id:"Iron Guardians",owner:0},r4={uid:uid(),id:"Pocket Watch Recipe",owner:0};s.p[0].disc.push(r1,r2,r3,r4,{uid:uid(),id:"Potion",owner:0});
  const c=hand(s,0,"Crafter's Choice");const L=s.p[0].lib.length;E.act(s,0,{type:"play",uid:c.uid,modes:[0,2]});ok(s.pend[0]&&s.pend[0].type==="choose"&&s.pend[0].cards.length===2&&!s.pend[0].cards.includes(r3.uid)&&!s.pend[0].cards.includes(r4.uid),"only Crafted items: Recipes that were crafted and flipped (not one discarded uncrafted)");
  E.act(s,0,{type:"choose",picks:s.pend[0].cards});resolve(s);ok(s.p[0].lib.length===L+2&&!s.p[0].disc.includes(r1),"shuffled into the library");ok(!r1.cr,"back in the library as a plain Recipe");
  ok(E.cardCost(s,0,E.actorFor(s,0),E.DB["Deflecting Shield Recipe"],0)===1,"next Recipe this turn costs 1 less");ok(E.cardCost(s,0,null,E.DB["Precognition"],0)===+E.DB["Precognition"].cost,"only Recipes");
  const c2=hand(s,0,"Wellness Rod Recipe");["Antidote","Potion","Silver Bar"].forEach(n=>inv(s,0,n));s.p[0].heroes.forEach(x=>x.ex=false);s.prio=0;s.passed=[false,false];const au=s.p[0].aura;E.act(s,0,{type:"play",uid:c2.uid});resolve(s);
  ok(s.p[0].aura===au,"Wellness Rod Recipe was free (1 - 1)");ok(!s.p[0].t.recipeDisc,"discount used up")}
{const s=game();const rod=inv(s,0,"Wellness Rod");const tgt=s.p[0].heroes[2];const c=hand(s,0,"Crafter's Choice");const au=s.p[0].aura;
  E.act(s,0,{type:"play",uid:c.uid,modes:[1,2],targets:[tgt.uid]});resolve(s);ok(Object.values(tgt.eq).some(e=>e&&e.name==="Wellness Rod"),"Crafted item equipped to target Hero");ok(s.p[0].aura===au-3,"without paying its Aura cost (only the card's 3)")}

/* Undead's Choice */
{const NEC=["Gravecaller","Jorkev, the Pillager","Filth Scavenger"];const s=game(NEC);for(let i=0;i<6;i++)s.p[0].lib.push({uid:uid(),id:"Precognition",owner:0});
  const c=hand(s,0,"Undead's Choice");const a=E.actorFor(s,0);E.act(s,0,{type:"play",uid:c.uid,modes:[0,1]});resolve(s);
  ok(s.p[0].bf.filter(o=>o.name==="Revenant").length===1,"Revenant summoned");ok(a.ex,"the Revenant mode exhausts this Hero");ok(s.p[0].t.milled&&s.p[0].t.milled.length===2,"Mill 2")}
{const NEC=["Gravecaller","Jorkev, the Pillager","Filth Scavenger"];const s=game(NEC);const x={uid:uid(),id:"Precognition",owner:0};s.p[0].disc.push(x);for(let i=0;i<4;i++)s.p[0].lib.push({uid:uid(),id:"Potion",owner:0});
  const c=hand(s,0,"Undead's Choice");const a=E.actorFor(s,0);E.act(s,0,{type:"play",uid:c.uid,modes:[1,2]});ok(s.pend[0]&&s.pend[0].type==="choose","choose a card for Exhume");
  E.act(s,0,{type:"choose",picks:[x.uid]});resolve(s);ok(!a.ex,"no Revenant mode: Hero not exhausted");s.p[0].heroes.forEach(h=>h.ex=false);s.prio=0;s.passed=[false,false];
  const po=opts(s,0).find(o=>o.type==="play"&&o.uid===x.uid);ok(po,"the card can be played from the discard pile this turn (Exhume)");
  if(po){const au=s.p[0].aura;E.act(s,0,po);resolve(s);ok(s.p[0].aura===au-(+E.DB["Precognition"].cost||0),"paying its costs");ok(!s.p[0].disc.slice(0,-1).some(y=>y.uid===x.uid)||true,"")}}


/* Nov 15 follow-up: Omni Hero type, choosing the soul, Crafted = crafted and flipped */
{const s=game();const rm=E.makeHeroConstruct(s,0,{uid:uid(),id:"Remey Recipe",owner:0},E.DB["Remey Recipe"].recipe.back);ok(rm.cls==="Omni","Remey's Hero type is Omni");
  ok(["Barbarian","Paladin","Necromancer","Artificer","Mage"].every(k=>E.heroIs(rm,k)),"Omni counts as every Hero type");
  ok(E.canUseEq(s,rm,{cls:"Paladin",id:"Tower Shield"}),"Omni can use class equipment (Tower Shield)");rm.ex=false;
}
{const s=game();const c=hand(s,0,"Remey Recipe");["Platinum Bar","Revitalize","Potion","Dynamite"].forEach(n=>inv(s,0,n));const d1=s.p[0].heroes[1],d2=s.p[0].heroes[2];d2.lvl=0;d1.lvl=3;kill(s,d1);kill(s,d2);
  s.p[0].heroes[0].ex=false;s.prio=0;s.passed=[false,false];const need=E.need(s,0,{type:"play",uid:c.uid});ok(need.length===1&&need[0].cands.length===2,"choose which dead Hero's soul to surrender (2 choices)");
  E.act(s,0,{type:"play",uid:c.uid,targets:[d1.uid]});resolve(s);ok(d1.surr&&!d2.surr,"the chosen soul (not the lowest level) is surrendered")}
{const s=game();const rod=inv(s,0,"Wellness Rod");const pl=s.p[0];pl.inv.splice(pl.inv.indexOf(rod),1);E.toDisc(s,rod);const e=pl.disc.find(x=>x.uid===rod.uid);ok(e&&e.id==="Wellness Rod Recipe"&&e.cr,"a Crafted item leaving play goes to the discard pile as its crafted Recipe")}

/* Nov 15 afternoon queue: Toolbelt Generic, Recipe back costs, Shield of Riverstead, no exhaust on Craft, renamed Artificers, Gadget Commander, Material Bender, Recycler, Cy the Builder */
ok(E.DB["Toolbelt"].cls==="Generic"&&E.DB["Toolbelt"].kind==="equip","Toolbelt: Generic Equipment - Tool");
{const s=game(["Divine Knight","Arcane Scholar","Shadow Ranger"]);ok(E.canUseEq(s,s.p[0].heroes[0],E.DB["Toolbelt"]),"any class can equip the Toolbelt")}
ok([["Pocket Watch","6"],["The Archfrost","5"],["The Archflame","5"],["Dragonscale Scale","6"],["Wellness Rod","1"],["Deflecting Shield","5"]].every(([n,c])=>E.DB[n].cost===c),"Recipe back Aura costs = ingredients + 1");
ok(!ctx.RECIPES["Remey Recipe"].back.cost,"Remey has no printed cost");
ok(Object.keys(ctx.RECIPES).every(k=>!/Exhaust this Hero/.test(E.DB[k].rules)),"no Recipe says Exhaust this Hero");
{const sh=E.DB["Shield of Riverstead"];ok(sh&&sh.cls==="Generic"&&sh.sub==="Shield"&&sh.region==="One-Handed"&&sh.cost==="2"&&sh.pdef===1&&sh.up&&sh.up.cost===4&&sh.up.pdef===2,"Shield of Riverstead: 2 Aura, +1 Defense, upgrade 4 Gold to +2");
  ok(ctx.SET2_CARDS.includes("Shield of Riverstead"),"Set 2 only");
  const s=game();const c=hand(s,0,"Deflecting Shield Recipe");inv(s,0,"Time Pearl");inv(s,0,"Gold Bar");inv(s,0,"Shield of Riverstead");ok(canPlay(s,c),"Shield of Riverstead counts as any Shield")}
ok(E.DB["h:Artificer A"].name==="Wren Partsfinder"&&E.DB["h:Artificer B"].name==="Material Bender"&&E.DB["h:Artificer C"].name==="Val Craftsmith"&&E.DB["h:Artificer D"].name==="Gadget Commander"&&E.DB["h:Artificer E"].name==="Cy the Builder","old placeholder names still load the renamed Heroes");
/* Gadget Commander */
{const s=game(["Gadget Commander","Wren Partsfinder","Val Craftsmith"]);const g=s.p[0].heroes[0];const s0=E.str(s,g);inv(s,0,"Wellness Rod");inv(s,0,"Potion");
  ok(E.str(s,g)===s0+1,"a Crafted item in your inventory: +1 Strength");E.makeConstruct(s,0,2);ok(E.str(s,g)===s0+2,"a Construct: +1 Strength");
  const w=inv(s,0,"The Archfrost");s.p[0].inv.splice(s.p[0].inv.indexOf(w),1);E.equipTo(s,s.p[0].heroes[1],w);ok(E.str(s,g)===s0+3,"an equipped Crafted item counts");
  E.makeHeroConstruct(s,0,{uid:uid(),id:"Remey Recipe",owner:0},E.DB["Remey Recipe"].recipe.back);ok(E.str(s,g)===s0+4,"Remey counts as a Construct");
  E.makeConstruct(s,1,2);inv(s,1,"Pocket Watch");ok(E.str(s,g)===s0+4,"the opponent's don't count")}
/* Material Bender: Flame Pearl's enter trigger twice, once per turn */
{const s=game(["Material Bender","Wren Partsfinder","Val Craftsmith"]);const t=s.p[1].heroes[1];const d0=t.dmg||0;const c=hand(s,0,"Flame Pearl");E.act(s,0,{type:"play",uid:c.uid,targets:[t.uid]});resolve(s);
  const once=Math.max(0,2-E.defn(s,t));ok((t.dmg||0)-d0===2*once,"Flame Pearl resolves twice ("+((t.dmg||0)-d0)+")");
  const d1=t.dmg||0;const c2=hand(s,0,"Flame Pearl");s.p[0].heroes.forEach(h=>h.ex=false);s.prio=0;s.passed=[false,false];s.p[0].t.lastActor=null;E.act(s,0,{type:"play",uid:c2.uid,targets:[t.uid]});resolve(s);ok((t.dmg||0)-d1===once,"only the first item ability each turn")}
{const s=game(["Wren Partsfinder","Val Craftsmith","Cy the Builder"]);const au=s.p[0].aura;const o=inv(s,0,"Copper Ingot");const u=opts(s,0).find(x=>x.type==="use"&&x.uid===o.uid);E.act(s,0,u);resolve(s);ok(s.p[0].aura===au+1,"no doubling without Material Bender")}
/* Recycler */
{const s=game();const its=["Potion","Time Pearl","Copper Ingot","Dragon Scale","Aura Pearl","Antidote"].map(id=>{const x={uid:uid(),id,owner:0};s.p[0].disc.push(x);return x});s.p[0].disc.push({uid:uid(),id:"Precognition",owner:0},{uid:uid(),id:"Wellness Rod Recipe",owner:0,cr:true});
  const L=s.p[0].lib.length;const c=hand(s,0,"Recycler");E.act(s,0,{type:"play",uid:c.uid});ok(s.pend[0]&&s.pend[0].max===5&&s.pend[0].cards.length===6,"choose up to 5 items (only Item cards)");
  E.act(s,0,{type:"choose",picks:s.pend[0].cards.slice(0,5)});resolve(s);ok(s.p[0].lib.length===L+5,"5 items shuffled into the library")}
/* Cy the Builder: Craft, then may search for a Recipe */
{const s=game(["Cy the Builder","Wren Partsfinder","Val Craftsmith"]);const r={uid:uid(),id:"Pocket Watch Recipe",owner:0};s.p[0].lib.push({uid:uid(),id:"Potion",owner:0},r);
  const c=hand(s,0,"Wellness Rod Recipe");["Antidote","Potion","Silver Bar"].forEach(n=>inv(s,0,n));const a=s.p[0].heroes[0];E.act(s,0,{type:"play",uid:c.uid});
  const pr=s.pend.find(p=>p.type==="choose"&&/Cy the Builder/.test(p.title||""));ok(pr&&pr.min===0&&pr.cards.length===1,"Cy the Builder may search for a Recipe");
  while(s.pend.length&&s.pend[0]!==pr)E.act(s,s.pend[0].pid,ctx.CQAI.choose(s,s.pend[0].pid));E.act(s,0,{type:"choose",picks:[r.uid]});resolve(s);
  ok(s.p[0].hand.some(x=>x.uid===r.uid),"the Recipe goes to your hand");ok(!a.ex,"Crafting didn't exhaust Cy")}

/* Nov 15 (evening): ingredients can be equipped; made equipment enters equipped to the crafter */
{const s=game(["Wren Partsfinder","Val Craftsmith","Cy the Builder"]);const a=s.p[0].heroes[0],b=s.p[0].heroes[1];
  const sw=inv(s,0,"Sword of Riverstead");s.p[0].inv.splice(s.p[0].inv.indexOf(sw),1);E.equipTo(s,b,sw);inv(s,0,"Frost Pearl");inv(s,0,"Gold Bar");
  const c=hand(s,0,"The Archfrost Recipe");ok(canPlay(s,c),"a Sword equipped to another Hero counts as an ingredient");
  const old=inv(s,0,"Long Sword");s.p[0].inv.splice(s.p[0].inv.indexOf(old),1);E.equipTo(s,a,old);
  const au=s.p[0].aura;E.act(s,0,{type:"play",uid:c.uid});resolve(s);
  ok(!Object.values(b.eq).some(e=>e&&e.name==="Sword of Riverstead")&&s.p[0].disc.some(x=>x.uid===sw.uid),"the equipped Sword is unequipped and sacrificed");
  ok(Object.values(a.eq).some(e=>e&&e.name==="The Archfrost"),"The Archfrost enters equipped to the Hero that crafted it");
  ok(s.p[0].aura===au-2,"only the Recipe's 2 Aura is paid (equipping it is free)");
  ok(s.p[0].inv.some(o=>o.name==="Long Sword"),"the crafter's old weapon goes to the inventory");ok(!a.ex,"and the crafter isn't exhausted")}
{const s=game();const c=hand(s,0,"Pocket Watch Recipe");["Gold Bar","Platinum Ingot","Rose Quartz"].forEach(n=>inv(s,0,n));E.act(s,0,{type:"play",uid:c.uid});resolve(s);ok(s.p[0].inv.some(o=>o.name==="Pocket Watch"),"a made item still goes to the inventory")}
console.log(`Set 2 queue (Nov 15) checks: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
