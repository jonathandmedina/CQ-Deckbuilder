/* Set 2 (Nov 13, 2026): Flame Pearl, Frost Pearl, Dragon Scale, The Archfrost / The Archflame / Dragonscale Scale Recipes, The Right Mix.
   Run: node tests/set2_pearls.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
function load(){const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
  vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.SET2_CARDS=SET2_CARDS;this.RECIPES=RECIPES;this.RAW_CARDS=RAW_CARDS;",ctx);return ctx}
const ctx=load(),E=ctx.CQE;let pass=0,fail=0;
const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Smoke Bomb","Revitalize","Dynamite","Gold Bar","Platinum Bar","Silver Bar","Rose Quartz","Topaz","Almandine","Precognition","Humble","Vandalize","Disarm","Naturalize","Shatter"].map(n=>[n,3]));
const deck=h=>({name:"T",heroes:h.map(x=>"h:"+x),cards:Object.assign({},filler)});
let U=5000;const uid=()=>"u"+(U++);
function game(h0,h1){const s=E.newGame({seed:7,players:[{name:"A",deck:deck(h0||["Artificer D","Artificer A","Artificer E"])},{name:"B",deck:deck(h1||["Divine Knight","Arcane Scholar","Shadow Ranger"])}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});
  s.p.forEach(p=>{p.aura=20;p.inv=[];p.hand=[]});s.prio=0;s.passed=[false,false];return s}
const inv=(s,pid,id)=>{const o=E.invObj(s,pid,{uid:uid(),id,owner:pid});s.p[pid].inv.push(o);return o};
const hand=(s,pid,id)=>{const c={uid:uid(),id,owner:pid};s.p[pid].hand.push(c);return c};
const opts=(s,pid)=>E.options(s,pid);
const canPlay=(s,c)=>opts(s,0).some(o=>o.type==="play"&&o.uid===c.uid);
function resolve(s){let g=0;while(s.pend.length&&g++<20){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(!a)break;E.act(s,pr.pid,a)}}
const row=n=>ctx.RAW_CARDS.find(r=>r[1]===n);

/* data */
["Flame Pearl","Frost Pearl","Dragon Scale","The Archfrost Recipe","The Archflame Recipe","Dragonscale Scale Recipe","The Right Mix"].forEach(n=>ok(ctx.SET2_CARDS.includes(n)&&row(n),n+" in Set 2"));
ok(row("Flame Pearl")[6]==="Generic"&&row("Flame Pearl")[4]==="Item"&&row("Flame Pearl")[2]==="2","Flame Pearl: Generic Item, 2 Aura");
ok(row("Dragon Scale")[2]==="3","Dragon Scale 3 Aura");
ok(row("The Archfrost Recipe")[3]==="Legendary"&&row("The Archfrost Recipe")[0]===1&&row("The Archfrost Recipe")[6]==="Artificer"&&row("The Archfrost Recipe")[2]==="2","The Archfrost Recipe: Legendary Artificer, 2 Aura, 1 copy");
ok(row("Dragonscale Scale Recipe")[3]===""&&row("Dragonscale Scale Recipe")[0]===2,"Dragonscale Scale Recipe isn't Legendary");
ok(row("The Right Mix")[4]==="Spell"&&row("The Right Mix")[6]==="Artificer","The Right Mix: Artificer Spell");
{const af=E.DB["The Archfrost"],fl=E.DB["The Archflame"],ds=E.DB["Dragonscale Scale"];
  ok(af&&af.kind==="equip"&&af.pstr===6&&af.region==="Two-Handed"&&af.cost==="6","The Archfrost: Two-Handed, +6, 6 Aura");
  ok(fl&&fl.kind==="equip"&&fl.pstr===6&&fl.region==="Two-Handed","The Archflame: Two-Handed, +6");
  ok(ds&&ds.kind==="equip"&&ds.region==="Chest"&&ds.sub==="Armor"&&ds.cost==="6","Dragonscale Scale: Chest armor, 6 Aura")}

/* Flame Pearl: 2 damage to any target when it enters; stays in the inventory */
{const s=game();const c=hand(s,0,"Flame Pearl");const t=s.p[1].heroes[2];const hp0=E.hp(s,t);ok(canPlay(s,c),"Flame Pearl playable");
  const r=E.act(s,0,{type:"play",uid:c.uid,targets:[t.uid]});resolve(s);ok(r.ok,"play "+(r.err||""));
  ok(E.hp(s,t)===hp0-Math.max(0,2-E.defn(s,t)),"2 damage ("+(hp0-E.hp(s,t))+")");ok(s.p[0].inv.some(o=>o.name==="Flame Pearl"),"stays in the inventory")}
/* Frost Pearl: Stun any target */
{const s=game();const c=hand(s,0,"Frost Pearl");const t=s.p[1].heroes[0];E.act(s,0,{type:"play",uid:c.uid,targets:[t.uid]});resolve(s);ok(t.st.stun===1,"Frost Pearl Stuns");ok(s.p[0].inv.some(o=>o.name==="Frost Pearl"),"Frost Pearl in inventory")}
/* Dragon Scale: target ally +3 Defense this turn */
{const s=game();const c=hand(s,0,"Dragon Scale");const a=s.p[0].heroes[1];const d0=E.defn(s,a);E.act(s,0,{type:"play",uid:c.uid,targets:[a.uid]});resolve(s);ok(E.defn(s,a)===d0+3,"+3 Defense ("+d0+"→"+E.defn(s,a)+")")}

/* The Archfrost: Frost Pearl + any Sword + Gold Bar */
{const s=game();const c=hand(s,0,"The Archfrost Recipe");inv(s,0,"Frost Pearl");inv(s,0,"Gold Bar");inv(s,0,"Long Dagger");
  ok(!canPlay(s,c),"Long Dagger isn't a Sword");inv(s,0,"Sword of Riverstead");ok(canPlay(s,c),"Frost Pearl + Sword of Riverstead + Gold Bar");
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);const w=s.p[0].inv.find(o=>o.name==="The Archfrost");ok(w&&w.kind==="equip","The Archfrost made");
  ok(s.p[0].inv.map(o=>o.name).sort().join()==="Long Dagger,The Archfrost","ingredients used, Long Dagger kept");
  s.prio=0;const a=E.actorFor(s,0);a.ex=false;const eo=opts(s,0).find(o=>o.type==="equipInv"&&o.uid===w.uid);ok(eo,"equip from inventory");const au=s.p[0].aura,s0=E.str(s,a);E.act(s,0,eo);
  ok(s.p[0].aura===au-6,"costs 6 Aura to equip");ok(E.str(s,a)===s0+6,"+6 Strength");
  const t=s.p[1].heroes[0];t.bon.def+=6;const d0=t.dmg||0;s.prio=0;a.ex=false;s.p[0].t.lastActor=null;/* equipping was this Hero's action */E.act(s,0,{type:"attack",att:a.uid,targets:[t.uid]});resolve(s);
  ok((t.dmg||0)-d0===E.str(s,a),"Piercing: the attack ignores all Defense ("+((t.dmg||0)-d0)+" of "+E.str(s,a)+")");ok(t.st.stun>=1,"the enemy is Stunned");}
/* The Archflame: Flame Pearl + Sword + Gold Bar; attacks Burn three times */
{const s=game();const c=hand(s,0,"The Archflame Recipe");inv(s,0,"Flame Pearl");inv(s,0,"Gold Bar");inv(s,0,"Knight's Sword");ok(canPlay(s,c),"Flame Pearl + Knight's Sword + Gold Bar");
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);const w=s.p[0].inv.find(o=>o.name==="The Archflame");ok(w,"The Archflame made");
  const a=E.actorFor(s,0)||s.p[0].heroes[0];E.equipTo(s,a,s.p[0].inv.splice(s.p[0].inv.indexOf(w),1)[0]);const t=s.p[1].heroes[2];const b0=t.st.burn;s.prio=0;a.ex=false;
  E.act(s,0,{type:"attack",att:a.uid,targets:[t.uid]});resolve(s);ok(t.st.burn===b0+3,"Burned three times ("+b0+"→"+t.st.burn+")");ok(!(t.st.stun>0),"no Stun from The Archflame")}
/* Dragonscale Scale: Dragon Scale + any Chest armor; Impervious; 2 Aura: +1 Strength this turn */
{const s=game();const c=hand(s,0,"Dragonscale Scale Recipe");inv(s,0,"Dragon Scale");inv(s,0,"Helm of Protection");ok(!canPlay(s,c),"a Head piece isn't Chest armor");
  inv(s,0,"Bronze Chest Plate");ok(canPlay(s,c),"Dragon Scale + Bronze Chest Plate");E.act(s,0,{type:"play",uid:c.uid});resolve(s);
  const w=s.p[0].inv.find(o=>o.name==="Dragonscale Scale");ok(w,"Dragonscale Scale made");const h=E.actorFor(s,0);E.equipTo(s,h,s.p[0].inv.splice(s.p[0].inv.indexOf(w),1)[0]);
  const d0=h.dmg||0;s.prio=1;const en=s.p[1].heroes[0];en.ex=false;s.p[1].t.lastActor=null;s.bonus={pid:1,uid:en.uid};const ra=E.act(s,1,{type:"attack",att:en.uid,targets:[h.uid]});s.bonus=null;ok(ra&&ra.ok,"enemy attack resolves "+(ra&&ra.err||""));resolve(s);ok((h.dmg||0)===d0,"Impervious: no damage from an attack");
  s.prio=0;h.ex=false;s.p[0].t.lastActor=null;const op=opts(s,0).find(o=>o.type==="eqAct");ok(op,"2 Aura ability offered");const au=s.p[0].aura,s0=E.str(s,h);if(op){E.act(s,0,op);resolve(s)}
  ok(s.p[0].aura===au-2&&E.str(s,h)===s0+1,"2 Aura: +1 Strength ("+s0+"→"+E.str(s,h)+")")}
/* The Right Mix: top 4, items to hand, rest to the bottom */
{const s=game();const c=hand(s,0,"The Right Mix");const L=s.p[0].lib;const mk=id=>({uid:uid(),id,owner:0});
  const top=[mk("Potion"),mk("Precognition"),mk("Copper Ingot"),mk("Humble")];L.push(...top);const below=L[L.length-5];
  E.act(s,0,{type:"play",uid:c.uid});resolve(s);const hn=s.p[0].hand.map(x=>x.id).sort().join();ok(hn==="Copper Ingot,Potion","items to hand ("+hn+")");
  ok(L[0].id==="Precognition"||L[1].id==="Precognition","non-items on the bottom");ok(L[L.length-1]===below,"the next card is now on top");
  ok(!L.some(x=>x.id==="Potion"&&top.includes(x)),"revealed items left the library")}
console.log(`Set 2 Pearls / Arch weapons / Dragonscale / The Right Mix: ${pass} pass, ${fail} fail`);process.exitCode=fail?1:0;
