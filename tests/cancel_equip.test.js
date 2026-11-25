/* Nov 24, 2026: Cancel (Hidden) can answer equipment and items played from hand. Run: node tests/cancel_equip.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler={Potion:3,Antidote:3,Humble:3,Inspiration:3};
const mk=()=>{const s=E.newGame({seed:4,players:[{name:"A",deck:{name:"A",heroes:["h:Divine Knight","h:Dark Channeler","h:Venom Dancer"],cards:filler}},{name:"B",deck:{name:"B",heroes:["h:King of Curses","h:Essence Reaper","h:Hexcaster"],cards:filler}}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});s.prio=0;s.init=0;s.p[0].aura=10;s.p[1].aura=10;
  const cid=Object.keys(E.DB).find(k=>E.DB[k].name==="Cancel");s.p[1].inv.push({uid:"cx",id:cid,kind:"card",fd:true,name:"Cancel",owner:1});return s};
for(const [name,kind] of [["Knight's Sword","equip"],["Aura Crystal","item"]]){
  const s=mk();const id=Object.keys(E.DB).find(k=>E.DB[k].name===name);s.p[0].hand.push({uid:"e1",id,owner:0});
  let r=E.act(s,0,{type:"play",uid:"e1"});ok(r.ok,name+" played "+(r.err||""));
  const w=s.pend[0];ok(w&&w.type==="window"&&w.pid===1,name+": B gets a response window");
  if(w){const rv=E.options(s,1).find(o=>o.type==="reveal"||o.type==="hidden"||(o.uid==="cx"));r=rv?E.act(s,1,rv):{ok:false,err:"no reveal option: "+JSON.stringify(E.options(s,1).slice(0,4))};ok(r.ok,name+": Cancel revealed "+(r.err||""));
    let g=0;while(s.pend.length&&g++<10){const q=s.pend[0];const x=ctx.CQAI.respond?ctx.CQAI.respond(s,q.pid,q):null;if(!x)break;E.act(s,q.pid,x)}
    const L=s.log.map(l=>l.m).join("\n");ok(/canceled/.test(L),name+": canceled");
    const onBoard=kind==="equip"?s.p[0].heroes.some(h=>Object.values(h.eq).some(e=>e&&e.name===name)):s.p[0].inv.some(o=>o.name===name);
    ok(!onBoard&&s.p[0].disc.some(c=>c.uid==="e1"),name+": goes to the discard pile, not into play")}}
/* without a Hidden response nothing waits */
{const s=mk();s.p[1].inv=[];const id=Object.keys(E.DB).find(k=>E.DB[k].name==="Knight's Sword");s.p[0].hand.push({uid:"e2",id,owner:0});E.act(s,0,{type:"play",uid:"e2"});
 ok(!s.pend.some(p=>p.type==="window"),"no window without a response");ok(s.p[0].heroes.some(h=>Object.values(h.eq).some(e=>e&&e.name==="Knight's Sword")),"sword equipped")}
console.log(`cancel equip: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
