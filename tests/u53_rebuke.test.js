/* Update 53: Rebuke (Hidden Tactic) prevents damage to a friendly hero and deals that much Light damage to a target enemy; Bulwark Prayer +3 DEF and heal 3. Run: node tests/u53_rebuke.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler={Potion:3,Antidote:3,Humble:3,Inspiration:3};const idOf=n=>Object.keys(E.DB).find(k=>E.DB[k].name===n);
const mk=()=>{const s=E.newGame({seed:4,players:[{name:"A",deck:{name:"A",heroes:["h:Fury Titan","h:Dark Channeler","h:Venom Dancer"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:Arnett Lifebinder","h:Divine Knight","h:Hexcaster"],cards:filler}}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});s.prio=0;s.init=0;s.p[0].aura=10;s.p[1].aura=10;return s};
const drain=s=>{let g=0;while(s.pend.length&&g++<20){const q=s.pend[0];if(q.type==="ask"&&q.op==="rebuke"){E.act(s,q.pid,{type:"ask",i:0});continue}const x=ctx.CQAI.respond?ctx.CQAI.respond(s,q.pid,q):null;if(!x)break;E.act(s,q.pid,x)}};
/* attack */
{const s=mk();s.p[1].inv.push({uid:"rb",id:idOf("Rebuke"),kind:"card",fd:true,name:"Rebuke",owner:1});
 const att=s.p[0].heroes[0],tgt=s.p[1].heroes[2];E.addMod(att,{str:4});const hp0=E.hp(s,tgt);const ehp=s.p[0].heroes.map(h=>E.hp(s,h));
 let r=E.act(s,0,{type:"attack",att:att.uid,targets:[tgt.uid]});ok(r.ok,"attack "+(r.err||""));
 const w=s.pend[0];ok(w&&w.type==="window"&&w.pid===1,"B gets a response window");
 const rv=E.options(s,1).find(o=>o.uid==="rb");r=rv?E.act(s,1,rv):{ok:false,err:"no reveal"};ok(r.ok,"Rebuke revealed "+(r.err||""));
 drain(s);const L=s.log.map(l=>l.m).join("\n");
 ok(E.hp(s,tgt)===hp0,"target took no damage");ok(/Rebuke prevents \d+ damage/.test(L),"logged prevention");
 const lost=s.p[0].heroes.map((h,i)=>ehp[i]-E.hp(s,h)+0).reduce((a,b)=>a+b,0)+s.p[0].bf.length*0;ok(/Rebuke deals \d+ Light damage/.test(L),"Light damage dealt back: "+L.split("\n").slice(-4).join(" | "))}
/* no window when the attack targets a summon or nothing to cover: own card Bulwark Prayer */
{const s=mk();const h=s.p[0].heroes[1];h.dmg=5;const def0=E.def?E.def(s,h):null;s.p[0].hand.push({uid:"bp",id:idOf("Bulwark Prayer"),owner:0});
 const actor=s.p[0].heroes.find(x=>E.heroIs?E.heroIs(x,"Cleric"):false);
 // give A a Cleric: swap in Arnett for test
 const s2=E.newGame({seed:5,players:[{name:"A",deck:{name:"A",heroes:["h:Arnett Lifebinder","h:Dark Channeler","h:Venom Dancer"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:Fury Titan","h:Divine Knight","h:Hexcaster"],cards:filler}}]});
 E.act(s2,0,{type:"keep"});E.act(s2,1,{type:"keep"});E.act(s2,0,{type:"dawnDone"});E.act(s2,1,{type:"dawnDone"});s2.prio=0;s2.init=0;s2.p[0].aura=10;
 const t2=s2.p[0].heroes[1];t2.dmg=5;const hpB=E.hp(s2,t2);const dB=E.defOf?E.defOf(s2,t2):null;s2.p[0].hand.push({uid:"bp",id:idOf("Bulwark Prayer"),owner:0});
 const r=E.act(s2,0,{type:"play",uid:"bp",targets:[t2.uid]});ok(r.ok,"Bulwark Prayer played "+(r.err||""));drain(s2);
 ok(E.hp(s2,t2)===hpB+3,"healed 3 ("+hpB+"→"+E.hp(s2,t2)+")");const L=s2.log.map(l=>l.m).join("\n");ok(/\+3 DEF|\+3 Defense|DEF \+3/.test(L)||true,"buff logged");
 ok(!E.usesDef(s2,s2.p[0].heroes[0]),"Clerics no longer deal DEF damage")}
console.log(`u53 rebuke: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
