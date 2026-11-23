/* Nov 22, 2026: Poisonous needs damage dealt. Dark Fang hitting for 0 (Humble, or DEF) doesn't Poison. Run: node tests/poison_zero.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Dynamite","Precognition","Inspiration","Level Up","Naturalize","Shatter","Vandalize","Smoke Bomb","Revitalize","Humble","Snuff Out"].map(n=>[n,3]));
const mk=()=>{const s=E.newGame({seed:5,players:[{name:"A",deck:{name:"A",heroes:["h:Dark Fang","h:Dark Channeler","h:Venom Dancer"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:King of Curses","h:Essence Reaper","h:Hexcaster"],cards:filler}}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});return s};
/* Dark Fang hits for 2 with no DEF: Poisons; hits for 0 (Humble sets Strength to 0): no Poison; 2 into 3 DEF: no Poison */
let s=mk();let f=s.p[0].heroes[0],t=s.p[1].heroes[0];
E.damage(s,f,t,2,{combat:true});ok((t.st.poison||0)===1,"2 damage Poisons once ("+t.st.poison+")");
s=mk();f=s.p[0].heroes[0];t=s.p[1].heroes[0];E.damage(s,f,t,0,{combat:true});ok(!(t.st.poison>0),"0 damage (Humble): no Poison ("+t.st.poison+")");
s=mk();f=s.p[0].heroes[0];t=s.p[1].heroes[0];t.bon=t.bon||{};t.mods=(t.mods||[]).concat([{def:5,until:"dusk"}]);E.damage(s,f,t,2,{combat:true});const L=s.log.map(l=>l.m).join("\n");
ok(/0 damage/.test(L)&&!(t.st.poison>0),"blocked by DEF: no Poison ("+t.st.poison+")");
console.log(`poison zero: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
