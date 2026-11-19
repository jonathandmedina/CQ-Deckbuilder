/* Update 40 (Nov 19, 2026): card fixes, renames, new Choice cards, deprecations and Set 2 moves. Run: node tests/u40_cards.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.SET2_CARDS=SET2_CARDS;this.DEP=DEPRECATED_CARDS;this.DEPH=DEPRECATED_HEROES;this.DEPE=DEPRECATED_EQUIP;this.RAW_CARDS=RAW_CARDS;this.RAW_HEROES=RAW_HEROES;this.REN=CARD_RENAMES;",ctx);
const E=ctx.CQE,D=E.DB;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Smoke Bomb","Revitalize","Dynamite","Precognition","Humble","Vandalize","Disarm","Naturalize","Shatter","Inspiration","Snuff Out"].map(n=>[n,3]));
let U=1;const uid=()=>"x"+(U++);
function game(h0,h1){const s=E.newGame({seed:11,players:[{name:"A",deck:{name:"A",heroes:h0.map(h=>"h:"+h),cards:filler}},{name:"B",deck:{name:"B",heroes:(h1||["Divine Knight","Arcane Scholar","Savage Raider"]).map(h=>"h:"+h),cards:filler}}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});s.p.forEach(p=>{p.aura=12;p.inv=[];p.hand=[]});s.prio=0;s.passed=[false,false];return s}
function resolve(s){let g=0;while(s.pend.length&&g++<30){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(!a)break;E.act(s,pr.pid,a)}}
const hand=(s,pid,id)=>{const c={uid:uid(),id,owner:pid};s.p[pid].hand.push(c);return c};
const play=(s,c,extra)=>{const r=E.act(s,0,Object.assign({type:"play",uid:c.uid},extra||{}));resolve(s);return r};
/* data */
ok(D["Exhausting Wave"]&&!ctx.RAW_CARDS.some(r=>r[1]==="Curse of Exhaustion")&&ctx.REN["Curse of Exhaustion"]==="Exhausting Wave","Curse of Exhaustion is now Exhausting Wave");
ok(D["h:Bar-Bear Ian"]&&ctx.REN["Bloodhowl"]==="Bar-Bear Ian","Bloodhowl is now Bar-Bear Ian");
ok(/Duplicate it/.test(D["h:Songweaver"].rules)&&/has echo/i.test(D["h:Echo Performer"].rules),"Songweaver and Echo Performer swapped names");
ok(D["Pummel"].cost==="4","Pummel 4 Aura");
ok(["Energizing Ale","Fireball Flask","Harmonic Flask"].every(n=>D[n].sub==="Consumable"),"three Bard flasks are Consumable");
ok(D["Deeg's Choice"]&&D["Jess' Choice"]&&ctx.REN["Sure Fire Choice"]==="Deeg's Choice"&&ctx.REN["Nature's Choice"]==="Jess' Choice","Deeg's Choice / Jess' Choice renames");
ok(D["Brutality's Choice"]&&D["Brutality's Choice"].cls==="Barbarian"&&D["Brutality's Choice"].cost==="3","Brutality's Choice");
ok(D["Vonugutt's Choice"]&&D["Vonugutt's Choice"].cls==="Mage"&&D["Vonugutt's Choice"].cost==="3","Vonugutt's Choice");
const depNames=JSON.parse(fs.readFileSync(path.join(__dirname,"fixtures","u40-deprecated.json"),"utf8"));
ok(depNames.length===51,"51 deprecated names");
depNames.forEach(n0=>{const q='"'+n0+'"';const n=ctx.RAW_CARDS.concat(ctx.DEP).some(r=>r[1]===q)?q:n0;const live=ctx.RAW_CARDS.some(r=>r[1]===n)||ctx.RAW_HEROES.some(r=>r[0]===n);const inDep=ctx.DEP.some(r=>r[1]===n)||ctx.DEPH.some(r=>r[0]===n)||ctx.DEPE.some(r=>r[0]===n);ok(!live&&inDep,n+" deprecated")});
ok(D["h:Shadow Ranger"]&&D["h:Shadow Ranger"].dep&&D["Drums of War"]&&D["Drums of War"].dep,"deprecated Heroes and equipment stay in the engine DB");
["Almandine","Gold Ingot","Silver Ingot","Platinum Ingot","Jab","Flurry of Blows","Iron Hand Wraps","Sage Monk","Trainee Vincent"].forEach(n=>ok(ctx.SET2_CARDS.includes(n),n+" is Set 2"));
["Deeg Farsight","Jess Naturecaller","Deeg-Arrow"].forEach(n=>ok(!ctx.SET2_CARDS.includes(n),n+" is Set 1"));
/* Awestruck: Heroes only */
{const s=game(["Rage Brute","Savage Raider","Fury Titan"]);const c=hand(s,0,"Awestruck");E.makeSummon(s,1,"Wolf",true);
 const sp=E.need(s,0,{type:"play",uid:c.uid});const cands=sp&&sp[0]&&sp[0].cands||[];ok(cands.length&&cands.every(u=>{const f=E.find(s,u);return f&&f.o.kind==="hero"}),"Awestruck targets Heroes only");}
/* Blood Price: this Barbarian, no ready */
{const s=game(["Rage Brute","Savage Raider","Fury Titan"]);const a=E.actorFor(s,0);const c=hand(s,0,"Blood Price");const r=play(s,c,{x:8});
 ok(r.ok,"Blood Price plays "+(r.err||""));ok(a.dmg>=8,"the playing Barbarian loses X HP ("+a.dmg+")");ok(E.str(s,a)>=10,"and gains +X STR");}
/* Bruised: wounds enemies only */
{const s=game(["Rage Brute","Savage Raider","Fury Titan"]);const a=E.actorFor(s,0);a.fl.bruisedRound=s.round;const ally=s.p[0].heroes[1],en=s.p[1].heroes[2];
 E.damage(s,a,ally,2,{card:true});E.damage(s,a,en,3,{card:true});ok(!(ally.st.wound>0)&&en.st.wound===1,"Bruised: enemy Wounded, ally not");}
/* Brute's Banner tie: you choose */
{const s=game(["Rage Brute","Savage Raider","Fury Titan"]);s.p[0].heroes[0].bon.str=0;s.p[0].inv.push(E.invObj(s,0,{uid:uid(),id:"Brute's Banner",owner:0}));
 const st=s.p[0].heroes.map(h=>E.str(s,h));const top=Math.max(...st);const tied=st.filter(v=>v===top).length;
 /* end the round to reach the next Dawn */
 for(let i=0;i<300&&s.round===1;i++){const pr=s.pend[0];if(pr){E.act(s,pr.pid,ctx.CQAI.choose(s,pr.pid));continue}if(s.phase==="battle")E.act(s,s.prio,{type:"pass"});else if(s.phase==="town"){const p=s.town?s.town.order[s.town.i]:0;const op=E.options(s,p);E.act(s,p,op.find(x=>/leave|done|town/i.test(x.type))||op[0])}else break}
 const askP=s.pend.find(p=>p.type==="ask"&&/Brute's Banner/.test(p.title||""));
 ok(tied>1?!!askP:true,"Brute's Banner asks when tied ("+tied+" tied at "+top+")");if(askP){E.act(s,askP.pid,{type:"ask",i:1});const b=s.p[0].heroes.find(h=>h.fl.bannerRound===s.round);ok(b&&b.uid===askP.opts[1].v,"chosen Barbarian gets the Banner")}}
/* Brutality's Choice: +2 STR and wound twice */
{const s=game(["Rage Brute","Savage Raider","Fury Titan"]);const a=E.actorFor(s,0);const s0=E.str(s,a);const c=hand(s,0,"Brutality's Choice");const r=play(s,c,{modes:[0,2]});
 ok(r.ok,"Brutality's Choice plays "+(r.err||""));ok(E.str(s,a)===s0+2,"+2 STR");const en=s.p[1].heroes[2];E.damage(s,a,en,3,{card:true});ok(en.st.wound===2,"next damage Wounds twice");E.damage(s,a,en,3,{card:true});ok(en.st.wound===2,"only once");}
/* Vonugutt's Choice: pillar + burn twice */
{const s=game(["Ember Mage","Storm Caller","Diviner Mage"]);const c=hand(s,0,"Vonugutt's Choice");const tg=s.p[1].heroes[0];const r=play(s,c,{modes:[0,1],targets:[tg.uid]});
 ok(r.ok,"Vonugutt's Choice plays "+(r.err||""));ok(s.p[0].bf.some(o=>o.name==="Spell Damage Pillar"),"Conjures a Spell Damage Pillar");ok(tg.st.burn===2,"Burns twice");}
/* Deeg's Choice: hand Arrow at normal cost for any Ranger, then next Arrow -1 */
{const s=game(["Hawkeye","Deeg Farsight","Wild Archer"]);const c=hand(s,0,"Deeg's Choice");const r=play(s,c,{modes:[1,2]});ok(r.ok,"Deeg's Choice plays "+(r.err||""));
 s.prio=0;s.passed=[false,false];const ar=hand(s,0,"Serrated Arrow");const a=E.actorFor(s,0);const o=E.options(s,0).find(x=>x.fromHand&&x.uid===ar.uid);ok(o,"a Ranger may activate a hand Arrow (no Bow needed) after Deeg's Choice");
 ok(E.handArrowCost(s,0,a,ar)===0,"normal cost 1, minus 1 for the next Arrow = 0");const au=s.p[0].aura;E.act(s,0,Object.assign({},o,{targets:[s.p[1].heroes[0].uid]}));resolve(s);ok(s.p[0].aura===au,"paid 0");
 const ar2=hand(s,0,"Serrated Arrow");s.prio=0;ok(!E.options(s,0).some(x=>x.fromHand&&x.uid===ar2.uid),"only once per Deeg's Choice");}
/* Jess' Choice */
{const s=game(["Jess Naturecaller","Rootbinder","Wild Shifter"]);E.makeSummon(s,0,"Elk",true);const c=hand(s,0,"Jess' Choice");const r=play(s,c,{modes:[0,1]});ok(r.ok,"Jess' Choice plays "+(r.err||""));
 const w=s.p[0].bf.filter(o=>o.name==="Wolf");ok(w.length===1,"summons a 2/2 Wolf");const elk=s.p[0].bf.find(o=>o.name==="Elk");ok(E.str(s,elk)===3,"summons +1 STR (Elk 2→3)");}
console.log(`Update 40 cards: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
