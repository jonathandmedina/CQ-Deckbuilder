/* Update 42 (Nov 19, 2026): Surrender a soul offers only Gain 2 Aura, +2 STR or +2 DEF. Run: node tests/u42_souls.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Smoke Bomb","Revitalize","Dynamite","Precognition","Humble","Vandalize","Naturalize","Shatter","Inspiration","Snuff Out","Level Up"].map(n=>[n,3]));
function game(){const s=E.newGame({seed:5,players:[{name:"A",deck:{name:"A",heroes:["h:Rage Brute","h:Savage Raider","h:Fury Titan"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:Divine Knight","h:Arcane Scholar","h:Savage Raider"],cards:filler}}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});s.prio=0;s.passed=[false,false];return s}
const s=game();const pl=s.p[0];const dead=pl.heroes[2];dead.dead=true;dead.dmg=E.maxHp(s,dead);
const souls=E.options(s,0).filter(a=>a.type==="soul");
ok(souls.length===3&&souls.map(a=>a.ch).sort().join()==="1,2,5","three soul choices: Aura, STR, DEF ("+souls.map(a=>a.ch).join()+")");
ok(E.SOULS[1]==="Gain 2 Aura"&&/STR/.test(E.SOULS[2])&&/DEF/.test(E.SOULS[5]),"labels");
const a0=pl.aura;E.act(s,0,{type:"soul",hero:dead.uid,ch:1});let g=0;while(s.pend.length&&g++<20){const pr=s.pend[0];const x=ctx.CQAI.choose(s,pr.pid);if(!x)break;E.act(s,pr.pid,x)}
ok(dead.surr&&pl.aura===a0+2,"Gain 2 Aura works and the soul is surrendered");
ok(!E.options(s,0).some(a=>a.type==="soul"),"a soul is surrendered only once");
const ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");["soul-aura","soul-str","soul-def","soul-bg"].forEach(n=>ok(ui.includes("assets/art/ui/"+n+".webp")||ui.includes(n+'"')&&fs.existsSync(path.join(A,"art","ui",n+".webp")),n+" image is wired up"));
const rules=fs.readFileSync(path.join(A,"rules.md"),"utf8");ok(!/Gain 3 Gold\./.test(rules)&&!/Deal 2 damage to any target\.\n/.test(rules),"rules list only the three choices");
console.log(`Update 42 souls: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
