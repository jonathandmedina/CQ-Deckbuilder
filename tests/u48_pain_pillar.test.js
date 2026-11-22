/* Nov 22, 2026 (update 48): each Pain Pillar triggers separately at Dusk: target enemy loses 1 Health Point; the controller picks each target. Run: node tests/u48_pain_pillar.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Dynamite","Precognition","Inspiration","Level Up","Naturalize","Shatter","Vandalize","Smoke Bomb","Revitalize","Humble","Snuff Out"].map(n=>[n,3]));
const s=E.newGame({seed:11,players:[{name:"A",deck:{name:"A",heroes:["h:King of Curses","h:Essence Reaper","h:Arnett Lifebinder"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:Dark Fang","h:Dark Channeler","h:Venom Dancer"],cards:filler}}]});
E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});
/* 3 Pain Pillars for A: three asks, one at a time; A picks Venom Dancer twice and Dark Channeler once */
for(let i=0;i<3;i++)E.makePillar(s,0,"Pain Pillar");
const fang=s.p[1].heroes[0],chan=s.p[1].heroes[1],dancer=s.p[1].heroes[2];fang.dmg=8;
let g=0;while(s.phase==="battle"&&!s.pend.length&&g++<20){E.act(s,s.prio,{type:"pass"})}
const b0=dancer.dmg||0,c0=chan.dmg||0;const picks=[dancer,dancer,chan];const titles=[];
for(let k=0;k<3;k++){const pr=s.pend[0];ok(pr&&pr.type==="ask"&&pr.pid===0&&pr.op==="painPillar","ask "+(k+1));if(!pr)break;titles.push(pr.title);
  ok(!pr.opts.some(o=>/\(yours\)/.test(o.label)),"enemies only");E.act(s,0,{type:"ask",i:pr.opts.findIndex(o=>o.v===picks[k].uid)})}
ok(/\(1 of 3\): target enemy loses 1 Health Point/.test(titles[0])&&/\(3 of 3\)/.test(titles[2]),"titles count the triggers: "+titles.join(" | "));
ok((dancer.dmg||0)-b0===2,"Venom Dancer lost 2");ok((chan.dmg||0)-c0===1,"Dark Channeler lost 1");ok(fang.dmg===8,"Dark Fang untouched");
const L=s.log.map(l=>l.m).join("\n");ok((L.match(/— Dusk —/g)||[]).length===1,"one Dusk header");ok((L.match(/Pain Pillar: A targets/g)||[]).length===3,"three target lines");
console.log(`u48 pain pillar: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
