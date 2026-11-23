/* Update 49 (Nov 23, 2026): Wave of Life revives dead heroes (asks to pay 3), Doubling Ritual 5, Confused attacks hit a random enemy, Poison-Tipped Dagger 3,
   Cloak of Hate and Ritual Athame make a target enemy lose Health Points, curses say "Enchant target hero / enchanted hero", Siphon Life renamed Draw Life,
   Rage Brute {L3} once per turn, Sanctifier {L3} removes 3. Run: node tests/u49_cards.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.RAW_CARDS=RAW_CARDS;this.RAW_HEROES=RAW_HEROES;this.RAW_EQUIP=RAW_EQUIP;this.REN=CARD_RENAMES;",ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const C=n=>ctx.RAW_CARDS.find(r=>r[1]===n),H=n=>ctx.RAW_HEROES.find(r=>r[0]===n),Q=n=>ctx.RAW_EQUIP.find(r=>r[0]===n);
ok(C("Doubling Ritual")[2]==="5"&&C("Doubling Ritual")[8]===2,"Doubling Ritual 5 Aura v2");
ok(Q("Poison-Tipped Dagger")[5]==="3"&&Q("Poison-Tipped Dagger")[9]===6,"Poison-Tipped Dagger 3 Aura v6");
ok(!C("Siphon Life")&&C("Draw Life")&&ctx.REN["Siphon Life"]==="Draw Life","Siphon Life renamed Draw Life");
ok(!ctx.RAW_CARDS.some(r=>r[5]==="Curse"&&/Attach to|that hero/i.test(r[7])),"curses use Enchant / enchanted hero");
ok(/^\{L3\} Fatigue:.*once per turn\.$/.test(H("Rage Brute")[6]),"Rage Brute text");ok(/\{L3\} Remove 3 status counters instead\./.test(H("Sanctifier")[6]),"Sanctifier text");
const filler=Object.fromEntries(["Potion","Antidote","Dynamite","Precognition","Inspiration","Level Up","Naturalize","Shatter","Vandalize","Smoke Bomb","Revitalize","Humble","Snuff Out"].map(n=>[n,3]));
const mk=(a,b)=>{const s=E.newGame({seed:3,players:[{name:"A",deck:{name:"A",heroes:a,cards:filler}},{name:"B",deck:{name:"B",heroes:b,cards:filler}}]});E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});s.prio=0;s.init=0;return s};
const give=(s,pid,name)=>{const id=Object.keys(E.DB).find(k=>E.DB[k].name===name);const c={uid:"x"+Math.random().toString(36).slice(2,7),id,owner:pid};s.p[pid].hand.push(c);return c};
/* Wave of Life: Level 3 Cleric targets a dead ally, is asked, pays 3, ally revives exhausted at 3 HP */
{const s=mk(["h:Arnett Lifebinder","h:King of Curses","h:Essence Reaper"],["h:Dark Fang","h:Dark Channeler","h:Venom Dancer"]);
 const cl=s.p[0].heroes[0],dead=s.p[0].heroes[1];cl.lvl=3;dead.dead=true;dead.dmg=E.maxHp(s,dead);s.p[0].aura=10;const w=give(s,0,"Wave of Life");
 let r=E.act(s,0,{type:"play",uid:w.uid,targets:[dead.uid]});ok(r.ok,"Wave of Life can target a dead ally at Level 3 "+(r.err||""));
 const pr=s.pend[0];ok(pr&&pr.op==="waveRevive","asks whether to pay 3");
 if(pr){E.act(s,0,{type:"ask",i:0});ok(!dead.dead&&dead.ex&&E.hp(s,dead)===3,"revived exhausted with 3 HP ("+E.hp(s,dead)+")");ok(s.p[0].aura===10-2-3,"paid 2 + 3 Aura ("+s.p[0].aura+")")}
 cl.lvl=0;const s2=mk(["h:Arnett Lifebinder","h:King of Curses","h:Essence Reaper"],["h:Dark Fang","h:Dark Channeler","h:Venom Dancer"]);const d2=s2.p[0].heroes[1];d2.dead=true;s2.p[0].aura=10;const w2=give(s2,0,"Wave of Life");
 r=E.act(s2,0,{type:"play",uid:w2.uid,targets:[d2.uid]});ok(!r.ok,"below Level 3 a dead hero can't be targeted");}
/* Confused attack goes to a random enemy, never an ally */
{const s=mk(["h:Dark Fang","h:Dark Channeler","h:Venom Dancer"],["h:King of Curses","h:Essence Reaper","h:Hexcaster"]);const f=s.p[0].heroes[0];f.st.confuse=1;
 const t=s.p[1].heroes[2];const r=E.act(s,0,{type:"attack",att:f.uid,targets:[t.uid]});ok(r.ok,"confused attack ok "+(r.err||""));
 const L=s.log.map(l=>l.m).join("\n");ok(/is Confused and attacks a random enemy/.test(L),"logs the random enemy");ok(!s.p[0].heroes.some(h=>h!==f&&h.dmg>0),"no ally was hit")}
/* Cloak of Hate: becoming exhausted asks for an enemy who loses 1 */
{const s=mk(["h:King of Curses","h:Essence Reaper","h:Hexcaster"],["h:Dark Fang","h:Dark Channeler","h:Venom Dancer"]);const h=s.p[0].heroes[0];const cid=Object.keys(E.DB).find(k=>E.DB[k].name==="Cloak of Hate");
 s.p[0].aura=10;const cc={uid:"ch1",id:cid,owner:0};s.p[0].hand.push(cc);let r=E.act(s,0,{type:"play",uid:"ch1"});ok(r.ok,"equip Cloak of Hate "+(r.err||""));
 let g=0;while(s.pend.length&&g++<10){const q=s.pend[0];E.act(s,q.pid,ctx.CQAI.respond(s,q.pid,q))}
 E.exhaust(s,0,h);E.settle(s);const pr=s.pend.find(p=>p.data&&p.data.name==="Cloak of Hate");ok(pr&&/target enemy loses 1 Health Point/.test(pr.title)&&!pr.opts.some(o=>/yours|No damage/.test(o.label)),"Cloak of Hate asks for an enemy only: "+(pr&&pr.title))}
/* Rage Brute: Level 3 and once per turn */
{const s=mk(["h:Rage Brute","h:Dark Channeler","h:Venom Dancer"],["h:King of Curses","h:Essence Reaper","h:Hexcaster"]);const rb=s.p[0].heroes[0];
 const has=()=>E.options(s,0).some(o=>o.type==="ability");ok(!has(),"no Rage Brute ability below Level 3");rb.lvl=3;ok(has(),"ability at Level 3");
 E.act(s,0,E.options(s,0).find(o=>o.type==="ability"));rb.fat=0;s.prio=0;s.p[0].t.lastActor=null;ok(!has(),"only once per turn")}
/* Sanctifier Level 3 removes 3 */
{const s=mk(["h:Sanctifier","h:Dark Channeler","h:Venom Dancer"],["h:King of Curses","h:Essence Reaper","h:Hexcaster"]);const sa=s.p[0].heroes[0],al=s.p[0].heroes[1];sa.lvl=3;al.st.poison=2;al.st.burn=2;
 E.damage(s,sa,s.p[1].heroes[0],3,{combat:true});const left=al.st.poison+al.st.burn;ok(left===1,"Level 3 Sanctifier removed 3 counters (left "+left+")")}
console.log(`u49 cards: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
