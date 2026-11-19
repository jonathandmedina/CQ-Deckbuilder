/* Update 36 (Nov 17, 2026): Gold/Silver/Platinum Bars became Ingots; Set 2 Silver and Platinum Ingots deprecated; six items gain Consumable.
   Run: node tests/u36_ingots.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.RAW_CARDS=RAW_CARDS;this.SET2_CARDS=SET2_CARDS;this.CARD_RENAMES=CARD_RENAMES;this.RECIPES=RECIPES;",ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const row=n=>ctx.RAW_CARDS.find(r=>r[1]===n);
[["Gold Ingot","2","Exile: Gain 3 Gold."],["Platinum Ingot","2","Exile: Draw a card."],["Silver Ingot","1","Exile: Your party gains +1 Strength this turn."]].forEach(([n,c,t])=>{const r=row(n);
  ok(r&&r[2]===c&&r[4]==="Item"&&r[5]==="Material"&&r[6]==="Generic"&&r[7]===t&&r[8]===3,n+": "+c+" Aura, Material, v3");ok(ctx.SET2_CARDS.includes(n),n+" is a Set 2 card (moved in Update 40)")});
ok(ctx.RAW_CARDS.filter(r=>/ Ingot$/.test(r[1])&&/^(Silver|Platinum)/.test(r[1])).length===2,"one Silver Ingot and one Platinum Ingot");
["Gold Bar","Silver Bar","Platinum Bar"].forEach(n=>ok(!row(n)&&ctx.CARD_RENAMES[n]===n.replace("Bar","Ingot"),n+" renamed"));
["Antidote","Smoke Bomb","Revitalize","Sleeping Potion","Potion","Phoenix Down","False Cure"].forEach(n=>ok(row(n)[5]==="Consumable",n+" is Consumable"));
ok(row("Phoenix Down")[3]==="Legendary","Phoenix Down stays Legendary");
ok(!JSON.stringify(ctx.RECIPES).match(/(Gold|Silver|Platinum) Bar/)&&!ctx.RAW_CARDS.some(r=>/(Gold|Silver|Platinum) Bar/.test(r[7])),"no card or Recipe mentions a Bar");
/* play */
const filler=Object.fromEntries(["Precognition","Humble","Vandalize","Disarm","Naturalize","Shatter","Inspiration","Level Up","Block Progress","Reclaim","Exile","Delevel","Snuff Out","Search for Knowledge","Dissipate","Potion","Antidote"].map(n=>[n,3]));
const deck={name:"T",heroes:["h:Divine Knight","h:Arcane Scholar","h:Shadow Ranger"],cards:filler};
const s=E.newGame({seed:5,players:[{name:"A",deck},{name:"B",deck:JSON.parse(JSON.stringify(deck))}]});
E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});s.p.forEach(p=>{p.aura=20;p.inv=[]});s.prio=0;s.passed=[false,false];
let U=1;const a=E.actorFor(s,0);
const use=id=>{const o=E.invObj(s,0,{uid:"x"+(U++),id,owner:0});s.p[0].inv.push(o);a.ex=false;s.prio=0;const u=E.options(s,0).find(x=>x.type==="use"&&x.uid===o.uid);if(!u)return false;const au=s.p[0].aura;E.act(s,0,u);let g=0;while(s.pend.length&&g++<20){const pr=s.pend[0];const ac=ctx.CQAI.choose(s,pr.pid);if(!ac)break;E.act(s,pr.pid,ac)}return s.p[0].exile.some(x=>x.uid===o.uid)&&s.p[0].aura===au};
const g=s.p[0].gold;ok(use("Gold Ingot")&&s.p[0].gold===g+3,"Gold Ingot: Exile, +3 Gold, no Aura");
const h=s.p[0].hand.length;ok(use("Platinum Ingot")&&s.p[0].hand.length===h+1,"Platinum Ingot: Exile, draw a card");
const ps=s.p[0].pm.str||0;ok(use("Silver Ingot")&&(s.p[0].pm.str||0)===ps+1,"Silver Ingot: Exile, party +1 Strength this turn");
console.log(`Update 36 Ingots/Consumables: ${pass} pass, ${fail} fail`);if(fail)process.exit(1);
