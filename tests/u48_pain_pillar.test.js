/* Nov 22, 2026: Pain Pillars ask the controller for a target at Dusk (any target; all your Pain Pillars trigger once together for X). Run: node tests/u48_pain_pillar.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Dynamite","Precognition","Inspiration","Level Up","Naturalize","Shatter","Vandalize","Smoke Bomb","Revitalize","Humble","Snuff Out"].map(n=>[n,3]));
const mk=()=>{const s=E.newGame({seed:11,players:[{name:"A",deck:{name:"A",heroes:["h:King of Curses","h:Essence Reaper","h:Arnett Lifebinder"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:Dark Fang","h:Dark Channeler","h:Venom Dancer"],cards:filler}}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});return s};
/* 3 Pain Pillars for A; both pass; A is asked; picks Venom Dancer (not the lowest-HP enemy) */
let s=mk();for(let i=0;i<3;i++)E.makePillar?E.makePillar(s,0,"Pain Pillar"):s.p[0].bf.push({uid:"pp"+i,name:"Pain Pillar",kind:"pillar",owner:0,ctrl:0});
const fang=s.p[1].heroes[0],dancer=s.p[1].heroes[2];fang.dmg=8;
let g=0;while(s.phase==="battle"&&!s.pend.length&&g++<20){const p=s.prio;E.act(s,p,{type:"pass"})}
const pr=s.pend[0];ok(pr&&pr.type==="ask"&&pr.pid===0&&/Pain Pillars \(3\): target loses 3 Health Points/.test(pr.title),"A is asked to target: "+(pr&&pr.title));
ok(pr&&pr.opts.some(o=>o.v===dancer.uid)&&pr.opts.some(o=>/\(yours\)/.test(o.label)),"any target offered (enemies and your own)");
const before=dancer.dmg||0;E.act(s,0,{type:"ask",i:pr.opts.findIndex(o=>o.v===dancer.uid)});
g=0;while(s.pend.length&&g++<20){const q=s.pend[0];const x=ctx.CQAI?ctx.CQAI.respond(s,q.pid,q):null;if(!x)break;E.act(s,q.pid,x)}
ok((dancer.dmg||0)-before===3,"Venom Dancer loses 3 (once, not per pillar): "+((dancer.dmg||0)-before));
ok((fang.dmg)===8,"Dark Fang untouched");
const L=s.log.map(l=>l.m).join("\n");ok((L.match(/— Dusk —/g)||[]).length===1,"one Dusk header");
ok(/Pain Pillars: A targets Venom Dancer/.test(L),"log names the chosen target");
console.log(`u48 pain pillar: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
