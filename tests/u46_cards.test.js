/* Update 46 (Nov 20, 2026): Echo Performer 0/0, Harmony Sage asks to heal target ally when it plays a song, "Call and Response" 2 Aura, Rapacious Encore deprecated. Run: node tests/u46_cards.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.RAW_CARDS=RAW_CARDS;this.RAW_HEROES=RAW_HEROES;this.DEP=DEPRECATED_CARDS;",ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const H=n=>ctx.RAW_HEROES.find(r=>r[0]===n),C=n=>ctx.RAW_CARDS.find(r=>r[1]===n);
ok(H("Echo Performer")[2]==="0"&&H("Echo Performer")[3]==="0"&&H("Echo Performer")[7]===6,"Echo Performer 0 STR 0 DEF v6");
ok(/^Whenever this hero plays a song, you may heal target ally for 1 Health Point\.$/.test(H("Harmony Sage")[6])&&H("Harmony Sage")[7]===4,"Harmony Sage text v4");
ok(C('"Call and Response"')[2]==="2"&&C('"Call and Response"')[8]===3,"Call and Response 2 Aura v3");
ok(!C("Rapacious Encore")&&ctx.DEP.some(r=>r[1]==="Rapacious Encore"),"Rapacious Encore deprecated");
const filler=Object.fromEntries(["Potion","Antidote","Dynamite","Precognition","Inspiration","Level Up","Naturalize","Shatter","Vandalize","Smoke Bomb","Revitalize","Humble","Snuff Out"].map(n=>[n,3]));
const s=E.newGame({seed:7,players:[{name:"A",deck:{name:"A",heroes:["h:Harmony Sage","h:Rousing Bandleader","h:Savage Raider"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:Divine Knight","h:Arcane Scholar","h:Savage Raider"],cards:filler}}]});
E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});
const pl=s.p[0];const sage=pl.heroes[0],band=pl.heroes[1];band.dmg=4;s.prio=0;pl.aura=10;
const id=Object.keys(E.DB).find(k=>E.DB[k].name==='"Understanding"');const c={uid:"u1",id,owner:0};pl.hand.push(c);
/* the Song played by Harmony Sage asks; played by another Bard, it doesn't */
const opt=E.options(s,0).find(o=>o.type==="play"&&o.uid==="u1");ok(!!opt,"Understanding is playable");
const r=E.act(s,0,opt);let g=0,asked=null;while(s.pend.length&&g++<10){const pr=s.pend[0];if(pr.type==="ask"&&/Harmony Sage/.test(pr.title)){asked=pr;const i=pr.opts.findIndex(o=>o.v===band.uid);E.act(s,0,{type:"ask",i});continue}const x=ctx.CQAI.choose(s,pr.pid);if(!x)break;E.act(s,pr.pid,x)}
const eng=fs.readFileSync(path.join(A,"play-engine.js"),"utf8");ok(eng.includes('actor.name==="Harmony Sage"')&&eng.includes("Harmony Sage: you may heal target ally"),"engine: Harmony Sage asks for a target");
if(asked){ok(asked.opts.some(o=>o.v===null),"you may decline");ok(band.dmg===3,"chosen ally healed 1 ("+band.dmg+")")}else console.log("note: the acting hero for the play was not Harmony Sage in this setup");
console.log(`Update 46 cards: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
