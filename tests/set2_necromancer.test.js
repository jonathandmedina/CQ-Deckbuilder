/* Set 2 Necromancer: data, Impervious, Revenants, Mourn, Exhume, Mill, additional costs, Cursed Urn / Remains, equipment, Heroes, Skeleton Key.
   Run: node tests/set2_necromancer.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
function load(){const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
  vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.SET2_CARDS=SET2_CARDS;this.TOKEN_SOURCES=TOKEN_SOURCES;",ctx);return ctx}
const ctx=load(),E=ctx.CQE;let pass=0,fail=0;
const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Smoke Bomb","Revitalize","Dynamite","Gold Bar","Platinum Bar","Silver Bar","Rose Quartz","Topaz","Almandine","Precognition","Humble","Vandalize","Disarm","Naturalize","Shatter"].map(n=>[n,3]));
const deck=h=>({name:"T",heroes:h.map(x=>"h:"+x),cards:Object.assign({},filler)});
let U=1000;const uid=()=>"u"+(U++);
const NEC=["Necromancer A","Necromancer D","Necromancer E"];
function game(h0,h1){const s=E.newGame({seed:42,players:[{name:"A",deck:deck(h0||NEC)},{name:"B",deck:deck(h1||["Divine Knight","Arcane Scholar","Shadow Ranger"])}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});
  s.p.forEach(p=>{p.aura=10;p.inv=[];p.hand=[]});s.prio=0;s.passed=[false,false];return s}
const inv=(s,pid,id)=>{const o=E.invObj(s,pid,{uid:uid(),id,owner:pid});s.p[pid].inv.push(o);return o};
const hand=(s,pid,id)=>{const c={uid:uid(),id,owner:pid};s.p[pid].hand.push(c);return c};
const disc=(s,pid,id)=>{const c={uid:uid(),id,owner:pid};s.p[pid].disc.push(c);return c};
const top=(s,pid,id)=>{const c={uid:uid(),id,owner:pid};s.p[pid].lib.push(c);return c};
const opts=(s,pid)=>E.options(s,pid);
const canPlay=(s,c,pid)=>opts(s,pid||0).some(o=>o.type==="play"&&o.uid===c.uid);
function resolve(s){let g=0;while(s.pend.length&&g++<40){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(!a)break;E.act(s,pr.pid,a)}}
const revs=(s,pid)=>s.p[pid||0].bf.filter(o=>o.name==="Revenant");
const back=s=>{s.prio=0;s.acted=[false,false];s.passed=[false,false]};
const play=(s,c,extra)=>{const r=E.act(s,0,Object.assign({type:"play",uid:c.uid},extra||{}));resolve(s);back(s);return r};
const rev=(s,n,pid)=>{for(let i=0;i<(n||1);i++)E.makeSummon(s,pid||0,"Revenant");s.pend=s.pend.filter(p=>p.op!=="millOne")};

/* data */
const N=["Raise Revenant","Bone Wall","Army of Darkness","Devastating Ritual","From Darkness","Cursed Urn","Restless Dead","Grave Tide","Grave Whispers","Corpse Harvest","Dig the Grave","Dead March","Ossuary","Funeral Procession","Grieving Thoughts","Mourner's Offering","Reawaken","Grim Divination","Rise from the Grave","Consecrate","Retrace the Past","Bone Spur","Robbed Grave","Restless Echo","Soul Lantern","Skeleton Key"];
ok(N.every(n=>E.DB[n]),"all 26 Set2_Cards rows in the engine");ok(N.every(n=>ctx.SET2_CARDS.includes(n)),"all 26 in SET2_CARDS");
ok(["Necromancer A","Necromancer B","Necromancer C","Necromancer D","Necromancer E"].every(n=>E.DB["h:"+n]&&ctx.SET2_CARDS.includes(n)),"Necromancer Heroes A–E");
ok(E.DB["h:Necromancer A"].str===0&&E.DB["h:Necromancer A"].def===1&&E.DB["h:Necromancer A"].aura===1&&E.DB["h:Necromancer A"].hp===16,"0/1/1/16");
ok(/\{L3\} Activate any number/.test(E.DB["h:Necromancer C"].rules),"Necromancer C Level 3 line");
ok(["Grave Caller's Wand","Gravedigger's Medallion","Dagger of the Dead"].every(n=>E.DB[n]&&E.DB[n].up),"3 equipment with upgrades");
ok(E.TOK.Revenant&&E.TOK.Abomination&&E.TOK.Remains,"3 tokens");ok(ctx.SET2_CARDS.length===62,"62 Set 2 names ("+ctx.SET2_CARDS.length+")");
ok(!E.DB["h:Golduron"]&&!E.DB["h:Hetroll"],"Dragonborn left out");ok(E.DB["Cursed Urn"].sup==="Legendary"&&E.DB["Skeleton Key"].sup==="Legendary","Legendaries");
ok(ctx.TOKEN_SOURCES["Grave Tide"][0][1]===5,"token list: Grave Tide makes 5 Revenants");

/* Impervious */
{const s=game();rev(s,1);const r=revs(s)[0];ok(r.imp,"Revenant has Impervious");
  E.damage(s,{name:"X"},r,5,{card:true});ok(!r.dead&&revs(s).length===1&&!(r.dmg>0),"damage does nothing");
  E.destroyObj(s,r);ok(revs(s).length===1,"destroy does nothing");
  E.loseHp(s,r,1,"test");ok(revs(s).length===0,"dies from Health Point loss");
  rev(s,2);E.sacrifice(s,revs(s)[0]);ok(revs(s).length===1,"sacrifice works");E.destroyObj(s,revs(s)[0],true);ok(revs(s).length===0,"exile works");
  rev(s,1);revs(s)[0].st.poison=1;E.act(s,0,{type:"pass"});E.act(s,1,{type:"pass"});resolve(s);
  while(s.phase==="town"){const p=s.town.order[s.town.i];E.act(s,p,{type:"leave"});resolve(s)}
  ok(revs(s).length===0,"Poison (Health Point loss at Dawn) kills a Revenant")}
/* Raise Revenant + Necromancer B (one Mill per Revenant) */
{const s=game(["Necromancer B","Necromancer D","Necromancer E"]);const c=hand(s,0,"Raise Revenant");const a=E.actorFor(s,0);const ol=s.p[1].lib.length;
  ok(play(s,c).ok,"play Raise Revenant");ok(revs(s).length===1&&revs(s)[0].str===1&&E.hp(s,revs(s)[0])===1,"a 1/1 Revenant");ok(a.ex,"Exhaust this Hero");
  ok(s.p[1].lib.length===ol-1,"Necromancer B: opponent Mills 1")}
{const s=game(["Necromancer B","Necromancer D","Necromancer E"]);const c=hand(s,0,"Restless Dead");const ol=s.p[1].lib.length;play(s,c);
  ok(revs(s).length===2&&s.p[1].lib.length===ol-2,"Necromancer B triggers once per Revenant (2)")}
/* Grave Tide: sacrifice 3 as a cost, summon 5; Cursed Urn on sacrifice */
{const s=game();const c=hand(s,0,"Grave Tide");rev(s,2);ok(!canPlay(s,c),"Grave Tide needs 3 Revenants");rev(s,1);ok(canPlay(s,c),"playable with 3");
  inv(s,0,"Cursed Urn");play(s,c);ok(revs(s).length===5,"5 Revenants after sacrificing 3 ("+revs(s).length+")");
  ok(s.p[0].inv.filter(o=>o.name==="Remains").length===3,"Cursed Urn: a Remains token per sacrificed Revenant (inventory has room for 3)")}
/* Cursed Urn: death by Health Point loss; no slot, no token */
{const s=game();inv(s,0,"Cursed Urn");inv(s,0,"Potion");inv(s,0,"Potion");rev(s,3);const c=hand(s,0,"Consecrate");play(s,c);
  ok(revs(s).length===0,"Consecrate: each summon loses 1 HP (Revenants die)");ok(s.p[0].inv.filter(o=>o.name==="Remains").length===1,"only one empty slot: one Remains")}
/* Remains: Aura for Summon cards only */
{const s=game();s.p[0].aura=0;s.p[0].inv.push({uid:uid(),id:"Remains",kind:"card",fd:false,name:"Remains",owner:0,tok:true,ctr:{}});
  const o=opts(s,0).find(x=>x.type==="useFree");ok(o,"Remains can be sacrificed without an action");E.act(s,0,o);ok(s.p[0].t.sAura===1&&!s.p[0].inv.length,"Remains: +1 Summon Aura, token gone");
  const t=hand(s,0,"Bone Wall"),r=hand(s,0,"Raise Revenant");ok(!canPlay(s,t),"Summon Aura can't pay for a Tactic");ok(canPlay(s,r),"Summon Aura pays for a Summon card");
  play(s,r);ok(revs(s).length===1&&!s.p[0].t.sAura,"spent on Raise Revenant")}
/* Mourn */
{const s=game();const c=hand(s,0,"Mourner's Offering");s.p[0].aura=1;ok(!canPlay(s,c),"Mourn: costs 2 before a soul is surrendered");
  const h=s.p[0].heroes[2];h.dead=true;h.dmg=99;const so=opts(s,0).find(o=>o.type==="soul"&&o.ch===0);E.act(s,0,so);resolve(s);back(s);
  ok(canPlay(s,c),"Mourn: free after surrendering a soul");const au=s.p[0].aura;play(s,c);ok(s.p[0].aura===au+2,"Gain 2 Aura, no Aura paid")}
{const s=game();const r=revs(s);rev(s,1);E.sacrifice(s,revs(s)[0]);const c=hand(s,0,"Mourner's Offering");s.p[0].aura=1;ok(!canPlay(s,c),"a summon dying is not a surrendered soul")}
/* Exhume, Dig the Grave, Restless Echo, Rise from the Grave from the discard pile */
{const s=game();const rw=top(s,0,"Reawaken"),x1=top(s,0,"Potion"),sm=top(s,0,"Raise Revenant");const c=hand(s,0,"Dig the Grave");play(s,c);
  ok(s.p[0].disc.includes(rw)||s.p[0].hand.includes(rw),"Dig the Grave mills 3");ok(s.p[0].hand.includes(sm),"may put the milled Summon into your hand");
  const o=opts(s,0).find(x=>x.type==="play"&&x.uid===rw.uid);ok(o,"Exhume: Reawaken can be played from the discard pile this turn");
  const old=disc(s,0,"Reawaken");ok(!opts(s,0).some(x=>x.type==="play"&&x.uid===old.uid),"a Reawaken that wasn't milled this turn can't");
  ok(!E.act(s,0,{type:"play",uid:old.uid}).ok,"engine refuses the non-milled copy");
  s.p[1].disc.push(Object.assign({},rw,{uid:"op1"}));ok(!opts(s,0).some(x=>x.uid==="op1"),"own discard pile only")}
{const s=game();const rf=top(s,0,"Rise from the Grave");const c=hand(s,0,"Restless Echo");play(s,c);
  const o=opts(s,0).find(x=>x.type==="play"&&x.uid===rf.uid);ok(o,"Restless Echo mills; Rise from the Grave can be Exhumed");
  const au=s.p[0].aura;E.act(s,0,o);resolve(s);back(s);ok(revs(s).length===3,"played from the discard pile: three Revenants");ok(s.p[0].aura===au-4,"Exhume pays its costs")}
{const s=game();const c=hand(s,0,"Rise from the Grave");play(s,c);ok(revs(s).length===2,"from hand: two Revenants")}
{const s=game();const re=hand(s,0,"Restless Echo");const re2=top(s,0,"Restless Echo");top(s,0,"Potion");play(s,re);const au=s.p[0].aura;
  const o=opts(s,0).find(x=>x.type==="play"&&x.uid===re2.uid);ok(o,"Restless Echo itself can be Exhumed");E.act(s,0,o);resolve(s);ok(s.p[0].aura===au-1+1,"from the discard pile: also gain 1 Aura")}
{const s=game();const rg=top(s,0,"Robbed Grave");const re=hand(s,0,"Restless Echo");top(s,0,"Potion");play(s,re);const h0=s.p[0].hand.length;
  const o=opts(s,0).find(x=>x.uid===rg.uid);E.act(s,0,o);resolve(s);ok(s.p[0].hand.length===h0+2,"Robbed Grave from the discard pile draws 2")}
{const s=game();const rw=top(s,0,"Reawaken");const re=hand(s,0,"Restless Echo");top(s,0,"Potion");play(s,re);
  E.act(s,0,{type:"pass"});E.act(s,1,{type:"pass"});resolve(s);while(s.phase==="town"){const p=s.town.order[s.town.i];E.act(s,p,{type:"leave"});resolve(s)}
  if(s.phase==="dawn"){E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"})}s.prio=0;
  ok(!opts(s,0).some(x=>x.uid===rw.uid),"Exhume window closes at the end of the turn")}
/* Bone Spur */
{const s=game();rev(s,2);const c=hand(s,0,"Bone Spur");play(s,c,{targets:[revs(s)[0].uid]});ok(E.str(s,revs(s)[0])===2&&E.str(s,revs(s)[1])===1,"Bone Spur: target Revenant +1")}
{const s=game();rev(s,2);const b=top(s,0,"Bone Spur");const re=hand(s,0,"Restless Echo");top(s,0,"Potion");play(s,re);const o=opts(s,0).find(x=>x.uid===b.uid);E.act(s,0,o);resolve(s);
  ok(revs(s).every(r=>E.str(s,r)===2),"Bone Spur from the discard pile: all Revenants +1")}
/* Reawaken */
{const s=game();const h=s.p[0].heroes[1];h.ex=true;const c=hand(s,0,"Reawaken");ok(play(s,c,{targets:[h.uid]}).ok&&!h.ex,"Reawaken readies a Necromancer")}
/* Funeral Procession: free from the discard pile, then exiled */
{const s=game();const rr=disc(s,0,"Restless Dead");const c=hand(s,0,"Funeral Procession");const au=s.p[0].aura;E.act(s,0,{type:"play",uid:c.uid});
  ok(s.pend[0]&&s.pend[0].type==="combo"&&s.pend[0].cands.includes(rr.uid),"Funeral Procession offers the Summon in the discard pile");
  E.act(s,0,{type:"comboPlay",uid:rr.uid});resolve(s);ok(revs(s).length===2,"Restless Dead resolves");ok(s.p[0].aura===au-3,"the Summon's Aura cost isn't paid");
  ok(s.p[0].exile.some(x=>x.uid===rr.uid)&&!s.p[0].disc.some(x=>x.uid===rr.uid),"then exiled")}
{const s=game();const rg=disc(s,0,"Rise from the Grave");const c=hand(s,0,"Funeral Procession");E.act(s,0,{type:"play",uid:c.uid});E.act(s,0,{type:"comboPlay",uid:rg.uid});resolve(s);
  ok(revs(s).length===3,"Rise from the Grave via Funeral Procession counts as played from the discard pile (3)")}
/* Necromancer A */
{const s=game();disc(s,0,"Raise Revenant");const a=E.actorFor(s,0);ok(a.name==="Necromancer A","actor");const o=opts(s,0).find(x=>x.type==="ability");ok(o,"Necromancer A ability offered");
  const au=s.p[0].aura;E.act(s,0,o);ok(s.pend[0]&&s.pend[0].type==="combo","prompt");E.act(s,0,{type:"comboPlay",uid:s.pend[0].cands[0]});resolve(s);
  ok(revs(s).length===1&&s.p[0].aura===au-1,"plays the Summon from the discard pile, paying 1 Aura");ok(a.ex,"Necromancer A exhausted")}
/* Necromancer C */
{const s=game(["Necromancer C","Necromancer D","Necromancer E"]);rev(s,2);revs(s).forEach(r=>r.ex=false);disc(s,1,"Potion");const a=E.actorFor(s,0);
  const o=opts(s,0).find(x=>x.type==="ability");ok(o,"Necromancer C ability");E.act(s,0,Object.assign({},o,{targets:[revs(s)[0].uid]}));
  ok(revs(s)[0].ex&&E.str(s,a)===1&&!a.ex,"exhaust a Revenant: +1 STR, the Hero doesn't exhaust");
  ok(s.pend[0]&&s.pend[0].type==="choose","may exile a card from a discard pile");E.act(s,0,{type:"choose",picks:[s.pend[0].cards[0]]});ok(s.p[1].exile.length+s.p[0].exile.length===1,"exiled");
  s.prio=0;s.p[0].t.lastActor=null;ok(!opts(s,0).some(x=>x.type==="ability"&&E.actorFor(s,0)===a),"once each turn");a.lvl=3;ok(opts(s,0).some(x=>x.type==="ability"),"Level 3: any number of times")}
/* Bone Wall, Army of Darkness, Dead March, Devastating Ritual, Corpse Harvest, From Darkness, Ossuary */
{const s=game();rev(s,3);revs(s)[0].ex=true;const a=E.actorFor(s,0);const d0=E.defn(s,a);play(s,hand(s,0,"Bone Wall"));ok(E.defn(s,a)===d0+3,"Bone Wall counts ready and exhausted Revenants")}
{const s=game();rev(s,3);revs(s).forEach(r=>r.ex=false);revs(s)[2].ex=true;const tg=s.p[1].heroes[0];const hp0=E.hp(s,tg),def0=E.defn(s,tg);const a=E.actorFor(s,0);
  play(s,hand(s,0,"Army of Darkness"),{targets:[tg.uid]});ok(E.hp(s,tg)===hp0-Math.max(0,2-def0),"band attack with the 2 ready Revenants ("+(hp0-E.hp(s,tg))+")");ok(revs(s).every(r=>r.ex),"all exhausted");ok(!a.ex,"casting Hero not exhausted")}
{const s=game();rev(s,2);const ol=s.p[1].lib.length;play(s,hand(s,0,"Dead March"),{targets:["P1"]});ok(s.p[1].lib.length===ol-2,"Dead March: opponent Mills X")}
{const s=game();rev(s,3);const au=s.p[0].aura;play(s,hand(s,0,"Devastating Ritual"),{x:2});ok(revs(s).length===1&&s.p[0].aura===au+2,"Devastating Ritual: sacrifice 2, gain 2")}
{const s=game();rev(s,1);const au=s.p[0].aura;play(s,hand(s,0,"Devastating Ritual"),{x:5});ok(revs(s).length===0&&s.p[0].aura===au+1,"X is capped at the Revenants sacrificed")}
{const s=game();rev(s,1);const h0=s.p[0].hand.length;const c=hand(s,0,"Corpse Harvest");play(s,c);ok(revs(s).length===0&&s.p[0].hand.length===h0+2,"Corpse Harvest")}
{const s=game();rev(s,3);const c=hand(s,0,"From Darkness");ok(!canPlay(s,c),"From Darkness needs 4");rev(s,1);const a=E.actorFor(s,0);play(s,c);const ab=s.p[0].bf.find(o=>o.name==="Abomination");
  ok(ab&&ab.str===5&&E.hp(s,ab)===5&&!ab.ex&&ab.stealth&&!ab.imp,"Abomination 5/5, ready, Stealth, not Impervious");ok(revs(s).length===0,"4 sacrificed");ok(!a.ex,"Hero not exhausted");
  ok(!E.candidates(s,1,{k:"enemy"},{}).includes(ab.uid)&&E.candidates(s,1,{k:"enemy"},{attack:true}).includes(ab.uid),"Stealth: can't be targeted by cards, can be attacked")}
{const s=game();rev(s,1);inv(s,0,"Ossuary");ok(E.str(s,revs(s)[0])===1,"Ossuary off below 25");for(let i=0;i<25;i++)disc(s,0,"Potion");ok(E.str(s,revs(s)[0])===2,"Ossuary: +1 STR at 25")}
/* Grim Divination: the opponent chooses */
{const s=game();const a1=top(s,0,"Potion"),a2=top(s,0,"Raise Revenant");play(s,hand(s,0,"Grim Divination"));
  ok(s.p[0].hand.length+s.p[0].disc.filter(x=>x.uid===a1.uid||x.uid===a2.uid).length>=2,"Grim Divination resolves");ok(s.log.some(l=>/Grim Divination/.test(l.m)),"logged")}
{const s=game();top(s,0,"Potion");top(s,0,"Potion");E.act(s,0,{type:"play",uid:hand(s,0,"Grim Divination").uid});ok(s.pend[0]&&s.pend[0].pid===1&&s.pend[0].type==="ask","the opponent chooses the mode");
  E.act(s,1,{type:"ask",i:1});ok(s.p[0].hand.length===1&&s.p[0].t.milled.length===2,"mode 2: both to the discard pile (they can be Exhumed), draw a card")}
/* Retrace the Past */
{const s=game();disc(s,1,"Potion");disc(s,1,"Potion");const l1=s.p[1].lib.length,h1=s.p[1].hand.length;E.act(s,0,{type:"play",uid:hand(s,0,"Retrace the Past").uid,targets:["P1"]});
  E.act(s,0,{type:"choose",picks:s.pend[0].cards});ok(s.p[1].disc.length===0&&s.p[1].lib.length===l1+1&&s.p[1].hand.length===h1+1,"Retrace the Past: shuffle in, that player draws")}
/* Grieving Thoughts */
{const s=game();const c=hand(s,0,"Grieving Thoughts");hand(s,0,"Potion");const h0=s.p[0].hand.length;play(s,c);ok(s.p[0].hand.length===h0-1,"draw a card, then discard a card")}
/* Grave Caller's Wand, Dagger of the Dead, Gravedigger's Medallion */
{const s=game();const a=E.actorFor(s,0);const ol=s.p[1].lib.length;play(s,hand(s,0,"Grave Caller's Wand"));
  ok(E.hasEq(a,"Grave Caller's Wand")&&revs(s).length===1&&a.ex,"Wand: equip, summon a Revenant, exhaust the Hero");ok(s.p[1].lib.length===ol-1,"Wand: the exhaust makes a player Mill 1")}
{const s=game();const a=E.actorFor(s,0);play(s,hand(s,0,"Dagger of the Dead"));ok(E.str(s,a)===0,"Dagger: +0 without a Revenant");rev(s,1);ok(E.str(s,a)===2,"Dagger: +2 with a Revenant")}
{const s=game();const rr=disc(s,0,"Raise Revenant");const a=E.actorFor(s,0);const d0=E.defn(s,a);E.act(s,0,{type:"play",uid:hand(s,0,"Gravedigger's Medallion").uid});
  ok(E.defn(s,a)===d0+1,"Medallion +1 DEF");ok(s.pend[0]&&s.pend[0].type==="combo"&&s.pend[0].cands.includes(rr.uid),"Medallion: may play a card from the discard pile");}
/* Skeleton Key, Soul Lantern, Town */
{const s=game();inv(s,0,"Skeleton Key");const o=opts(s,0).find(x=>x.type==="use");ok(o,"Skeleton Key use");E.act(s,0,o);resolve(s);back(s);ok(s.p[0].fl.freeTown&&s.p[0].exile.some(x=>x.id==="Skeleton Key"),"exiled; next Town action free");
  inv(s,0,"Soul Lantern");s.p[0].gold=0;E.act(s,0,{type:"pass"});E.act(s,1,{type:"pass"});resolve(s);ok(s.phase==="town","Town");
  const me=s.town.order[s.town.i]===0;if(!me){E.act(s,1,{type:"leave"});resolve(s)}const g=s.p[0].gold;ok(opts(s,0).some(x=>x.type==="shop"),"Shop offered with too little Gold");E.act(s,0,{type:"shop"});ok(s.p[0].gold===g&&!s.p[0].fl.freeTown,"Shop cost no Gold, once");
  E.act(s,0,{type:"leave"});resolve(s);while(s.phase==="town"){E.act(s,s.town.order[s.town.i],{type:"leave"});resolve(s)}
  ok(s.log.some(l=>/Soul Lantern: A gains 1 Aura/.test(l.m)),"Soul Lantern: +1 Aura at Dawn")}
/* AI can play a Necromancer deck */
console.log(`Set 2 Necromancer checks: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
