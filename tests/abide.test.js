/* Abide (was Step Back): only one of your Heroes can Abide each round. Run: node tests/abide.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path"),assert=require("assert");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;const ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");
const ST=vm.runInNewContext("("+ui.match(/const STARTERS=(\[[\s\S]*?\]);/)[1]+")"),SL=vm.runInNewContext("("+ui.match(/const STARTER_LISTS=(\[[\s\S]*?\]);\nfunction starterDeck/)[1]+")");
const deck=i=>({name:ST[i].name,heroes:ST[i].heroes.map(n=>"h:"+n),cards:Object.assign({},SL[i])});
const s=E.newGame({seed:77,players:[{name:"A",deck:deck(0)},{name:"B",deck:deck(1)}]});
[0,1].forEach(p=>E.act(s,p,{type:"keep"}));for(let g=0;g<20&&s.phase==="dawn";g++){[0,1].forEach(p=>{if(!s.dawnDone[p])E.act(s,p,{type:"dawnDone"})});E.settle(s)}
assert.strictEqual(s.phase,"battle");const a=s.prio,b=1-a;let n=0;
const has=p=>E.options(s,p).some(o=>o.type==="step");
assert.ok(has(a),"Abide offered at the start of the round");n++;
const first=E.actorFor(s,a);let r=E.act(s,a,{type:"step"});assert.ok(r.ok,r.err);n++;
assert.ok(first.fl.stepped===s.round,"the first Hero is Abiding");n++;
assert.ok(/Abides/.test(s.log[s.log.length-1].m),"log says Abides");n++;
assert.strictEqual(E.labelAction(s,a,{type:"step"}),"Abide");n++;
/* opponent may still Abide with one of its own Heroes */
if(s.prio===b){assert.ok(has(b),"the other player can still Abide");n++;E.act(s,b,{type:"pass"})}
/* back to A with a different Hero: Abide no longer offered */
for(let g=0;g<10&&s.prio!==a&&!s.over;g++)E.act(s,s.prio,{type:"pass"});
if(s.prio===a&&s.phase==="battle"){const h=E.actorFor(s,a);assert.notStrictEqual(h&&h.uid,first.uid);assert.ok(!has(a),"a second Hero can't Abide this round");n++;
  r=E.act(s,a,{type:"step"});assert.ok(!r.ok,"engine refuses a second Abide");n++}
console.log("PASS abide ("+n+" checks)");
