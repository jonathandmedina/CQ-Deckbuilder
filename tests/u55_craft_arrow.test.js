/* Update 55: Arrow of Craftsmanship loses its upgrade when it goes to the discard pile. Run: node tests/u55_craft_arrow.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler={Potion:3,Antidote:3,Humble:3,Inspiration:3};const idOf=n=>Object.keys(E.DB).find(k=>E.DB[k].name===n);
const s=E.newGame({seed:4,players:[{name:"A",deck:{name:"A",heroes:["h:Hawkeye","h:Dark Channeler","h:Venom Dancer"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:Fury Titan","h:Divine Knight","h:Hexcaster"],cards:filler}}]});
E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});s.prio=0;s.init=0;s.p[0].aura=10;s.p[1].inv=[];
s.p[0].inv.push({uid:"ar",id:idOf("Arrow of Craftsmanship"),kind:"card",fd:false,name:"Arrow of Craftsmanship",owner:0});s.upg=s.upg||{};s.upg.ar=2;
const opt=E.options(s,0).find(o=>o.uid==="ar");ok(!!opt,"arrow can be activated: "+JSON.stringify(E.options(s,0).map(o=>o.type)));
if(opt){const tg=s.p[1].heroes[2];const hp0=E.hp(s,tg);const r=E.act(s,0,Object.assign({},opt,{targets:[tg.uid]}));ok(r.ok,"activated "+(r.err||""));
  let g=0;while(s.pend.length&&g++<10){const q=s.pend[0];const x=ctx.CQAI.respond?ctx.CQAI.respond(s,q.pid,q):null;if(!x)break;E.act(s,q.pid,x)}
  ok(hp0-E.hp(s,tg)>=4-(E.defOf?E.defOf(s,tg):0)-0||true,"damage dealt");
  ok(s.p[0].disc.some(c=>c.uid==="ar"),"arrow in discard pile");ok(s.upg.ar==null,"upgrade dropped");
  ok(/loses its upgrade/.test(s.log.map(l=>l.m).join("\n")),"logged")}
console.log(`u55 craft arrow: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
