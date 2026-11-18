/* Update 35 (Nov 15, 2026): type cleanup (Material, equipment subtypes, Dagger by subtype, Dawn items), Frailty, Dynamite, Gauntlets of Growth.
   Run: node tests/typelines_u35.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","trials-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.RAW_CARDS=RAW_CARDS;this.RAW_EQUIP=RAW_EQUIP;this.RAW_TOKENS=RAW_TOKENS;this.RECIPES=RECIPES;this.EQUIP_UPGRADES=EQUIP_UPGRADES;this.TRIALS_LOOT=TRIALS_LOOT;",ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const card=n=>ctx.RAW_CARDS.find(r=>r[1]===n),eq=n=>ctx.RAW_EQUIP.find(r=>r[0]===n);
/* data: subtypes */
["Almandine","Rose Quartz","Topaz","Gold Ingot","Silver Ingot","Platinum Ingot","Copper Ingot","Iron Ingot","Silver Ingot","Platinum Ingot","Mithril Ingot","Quicksilver","Flame Pearl","Frost Pearl","Time Pearl","Aura Pearl","Dragon Scale"].forEach(n=>ok(card(n)[5]==="Material",n+" is Material"));
ok(!ctx.RAW_CARDS.some(r=>/^(Gemstone|Precious Metal|Metal)$/.test(r[5])),"no Gemstone / Precious Metal / Metal left");
ok(card("False Cure")[5]==="Consumable","Consumable kept for now (False Cure)");
const OLD=/^(Weapon|Armor|Accessory)$/;ok(!ctx.RAW_EQUIP.some(r=>OLD.test(r[2])),"no Weapon/Armor/Accessory equipment subtypes");
ok(!ctx.TRIALS_LOOT.some(r=>OLD.test(r[2])),"Trials loot uses item subtypes");
ok(!Object.values(ctx.RECIPES).some(r=>r.back.type==="Equipment"&&OLD.test(r.back.sub)),"Recipe backs use item subtypes");
ok(ctx.RAW_EQUIP.filter(r=>r[2]==="Instrument").length===4,"4 Bard Instruments keep Instrument");
ok(ctx.RAW_EQUIP.filter(r=>r[5]==="Artificer"||r[3]==="Artificer").every(r=>r[2]==="Tool"),"Artificer gear is Tool");
[["Knight's Sword","Sword"],["Tower Shield","Shield"],["Longbow","Bow"],["Ritual Athame","Dagger"],["Feather Blade","Dagger"],["Sacred Vestments","Robe"],["Gravedigger's Medallion","Amulet"]].forEach(([n,s])=>ok(eq(n)[2]===s,n+" is "+s));
ok(ctx.RAW_TOKENS.filter(r=>/Dagger/.test(r[0])).every(r=>r[2]==="Dagger"),"Dagger tokens are Dagger");
/* card fixes */
ok(card("Frailty")[7]==="Set a Hero's DEF to 0 until Dusk."&&card("Frailty")[8]===2,"Frailty until Dusk, v2");
ok(/^3\{A\}, Exile: /.test(card("Dynamite")[7])&&card("Dynamite")[8]===3,"Dynamite exiles, v3");
ok(/Equipped Hero gains \+1 STR\./.test(eq("Gauntlets of Growth")[4])&&eq("Gauntlets of Growth")[7]==="1"&&eq("Gauntlets of Growth")[9]===5,"Gauntlets of Growth +1 STR in text, v5");
ok(!/counts as a Dagger/.test(ctx.EQUIP_UPGRADES["Feather Blade"][1]),"Feather Blade upgrade no longer says it counts as a Dagger");
/* engine */
ok(E.isDagger(null,{id:"Ritual Athame",name:"Ritual Athame"})&&E.isDagger(null,{id:"Feather Blade",name:"Feather Blade"})&&E.isDagger(null,{name:"Dagger",tok:true})&&!E.isDagger(null,{id:"Long Sword",name:"Long Sword"}),"Dagger by subtype");
["Almandine","Rose Quartz","Topaz"].forEach(n=>ok(E.isDawnItem(E.DB[n]),n+" usable at Dawn"));["Gold Ingot","Flame Pearl","Copper Ingot"].forEach(n=>ok(!E.isDawnItem(E.DB[n]),n+" not a Dawn item"));
/* Dynamite goes to exile when used */
const filler=Object.fromEntries(["Potion","Antidote","Smoke Bomb","Revitalize","Precognition","Humble","Vandalize","Disarm","Naturalize","Shatter","Inspiration","Level Up","Block Progress","Reclaim","Exile","Delevel","Snuff Out"].map(n=>[n,3]));
const deck=h=>({name:"T",heroes:h.map(x=>"h:"+x),cards:Object.assign({},filler)});
const s=E.newGame({seed:9,players:[{name:"A",deck:deck(["Divine Knight","Arcane Scholar","Shadow Ranger"])},{name:"B",deck:deck(["Divine Knight","Arcane Scholar","Shadow Ranger"])}]});
E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});s.p.forEach(p=>{p.aura=20;p.inv=[]});s.prio=0;s.passed=[false,false];
const o=E.invObj(s,0,{uid:"dyn1",id:"Dynamite",owner:0});s.p[0].inv.push(o);
const use=E.options(s,0).find(x=>x.type==="use"&&x.uid==="dyn1");ok(!!use,"Dynamite can be used");
if(use){const tg=E.options(s,0);E.act(s,0,Object.assign({},use,{targets:s.p[1].heroes.slice(0,2).map(h=>h.uid)}));let g=0;while(s.pend&&s.pend.length&&g++<20){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(!a)break;E.act(s,pr.pid,a)}E.settle&&E.settle(s);
  ok(s.p[0].exile.some(x=>x.id==="Dynamite")&&!s.p[0].inv.some(x=>x.uid==="dyn1")&&!s.p[0].disc.some(x=>x.id==="Dynamite"),"Dynamite is exiled after use")}
console.log(`Update 35 type cleanup: ${pass} pass, ${fail} fail`);if(fail)process.exit(1);
