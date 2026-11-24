/* Update 50 (Nov 23, 2026): Radiant Sentinel v5. With 5+ Defense from any source it gets +2 Strength; {L3} +5 instead (no more "from equipment"). Run: node tests/u50_sentinel.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.RAW_HEROES=RAW_HEROES;",ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const H=ctx.RAW_HEROES.find(r=>r[0]==="Radiant Sentinel");ok(H[7]===5&&!/from equipment/.test(H[6])&&/\{L3\} While this hero has 5 or more Defense, it gets \+5 Strength instead\./.test(H[6]),"text v5");
const filler={Potion:3,Antidote:3,Humble:3};
const s=E.newGame({seed:2,players:[{name:"A",deck:{name:"A",heroes:["h:Radiant Sentinel","h:Dark Channeler","h:Venom Dancer"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:King of Curses","h:Essence Reaper","h:Hexcaster"],cards:filler}}]});
const r=s.p[0].heroes[0];const st=()=>E.heroStats(s,r).str;const base=st();
r.mods=[{def:4,until:"dusk"}];ok(E.heroStats(s,r).def>=5&&st()===base+2,"5 Defense from a buff, Level 0: +2 ("+(st()-base)+")");
r.lvl=3;ok(st()===base+5,"Level 3: +5 without any equipment ("+(st()-base)+")");
r.mods=[];ok(st()===base,"below 5 Defense: no bonus");
console.log(`u50 sentinel: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
