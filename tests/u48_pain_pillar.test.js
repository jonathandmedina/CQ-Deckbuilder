/* Nov 22, 2026 (update 48): each Pain Pillar triggers separately at Dusk (target enemy loses 1 Health Point). One prompt starts at all triggers; you lower the count and click a target until none are left. Run: node tests/u48_pain_pillar.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Dynamite","Precognition","Inspiration","Level Up","Naturalize","Shatter","Vandalize","Smoke Bomb","Revitalize","Humble","Snuff Out"].map(n=>[n,3]));
const s=E.newGame({seed:11,players:[{name:"A",deck:{name:"A",heroes:["h:King of Curses","h:Essence Reaper","h:Arnett Lifebinder"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:Dark Fang","h:Dark Channeler","h:Venom Dancer"],cards:filler}}]});
E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});
/* 6 Pain Pillars for A: first prompt starts at 6; A sends 4 at Venom Dancer, then the rest (2) at Dark Channeler */
for(let i=0;i<6;i++)E.makePillar(s,0,"Pain Pillar");
const fang=s.p[1].heroes[0],chan=s.p[1].heroes[1],dancer=s.p[1].heroes[2];fang.dmg=8;
let g=0;while(s.phase==="battle"&&!s.pend.length&&g++<20){E.act(s,s.prio,{type:"pass"})}
const b0=dancer.dmg||0,c0=chan.dmg||0;
let pr=s.pend[0];ok(pr&&pr.op==="painPillar"&&pr.pid===0&&pr.amount&&pr.amount.val===6&&pr.amount.max===6,"one prompt, starts at all 6 triggers");
ok(pr&&/6 triggers left/.test(pr.title),"title: "+(pr&&pr.title));ok(pr&&!pr.opts.some(o=>/\(yours\)/.test(o.label)),"enemies only");
let r=E.act(s,0,{type:"ask",i:pr.opts.findIndex(o=>o.v===dancer.uid),amt:4});ok(r.ok,"ask with amt accepted "+(r.err||""));
ok((dancer.dmg||0)-b0===4,"Venom Dancer lost 4");
pr=s.pend[0];ok(pr&&pr.op==="painPillar"&&pr.amount&&pr.amount.val===2&&pr.amount.max===2,"second prompt starts at the 2 left");
E.act(s,0,{type:"ask",i:pr.opts.findIndex(o=>o.v===chan.uid)});
ok((chan.dmg||0)-c0===2,"Dark Channeler lost 2 (no amount = all left)");ok(fang.dmg===8,"Dark Fang untouched");
ok(!s.pend.some(p=>p.op==="painPillar"),"no more Pain Pillar prompts");
/* amounts are clamped to what's left */
const L=s.log.map(l=>l.m).join("\n");ok((L.match(/— Dusk —/g)||[]).length===1,"one Dusk header");
ok(/aims 4 triggers at Venom Dancer/.test(L)&&/aims 2 triggers at Dark Channeler/.test(L),"log shows each split");
console.log(`u48 pain pillar: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
