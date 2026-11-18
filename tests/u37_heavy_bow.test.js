/* Update 37 (Nov 18, 2026): Heavy Bow is now Jereth's Heavy Bow, Legendary, 5 Aura. Run: node tests/u37_heavy_bow.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+";this.RE=RAW_EQUIP;this.UP=EQUIP_UPGRADES;this.RN=CARD_RENAMES",ctx);
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:(fail++,console.log("FAIL",m))};
const N="Jereth's Heavy Bow",r=ctx.RE.find(x=>x[0]===N);
ok(r,"row exists");ok(r&&r[1]==="Legendary","Legendary");ok(r&&r[5]==="5","5 Aura");ok(r&&r[9]===4,"v4");ok(r&&r[2]==="Bow"&&r[6]==="Two-Handed","Bow, Two-Handed");
ok(!ctx.RE.find(x=>x[0]==="Heavy Bow"),"old row gone");ok(ctx.UP[N]&&!ctx.UP["Heavy Bow"],"upgrade renamed");ok(ctx.RN["Heavy Bow"]===N,"rename map");
for(const f of["play-engine.js","play-cards.js","play-ai.js","rules.md"]){const t=fs.readFileSync(path.join(A,f),"utf8").replace(/Jereth's Heavy Bow/g,"");ok(!/Heavy Bow/.test(t),f+" has no old name")}
const app=fs.readFileSync(path.join(A,"app.js"),"utf8");ok(app.includes('"Jereth_s_Heavy_Bow"'),"art listed");
ok(fs.existsSync(path.join(A,"art/equip/Jereth_s_Heavy_Bow-face.webp"))&&fs.existsSync(path.join(A,"art/equip/Jereth_s_Heavy_Bow-up.webp")),"art files");
console.log(`Update 37 Jereth's Heavy Bow: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
