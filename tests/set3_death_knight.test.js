/* Set 3 Death Knight (Nov 27, 2026): Blight, and the five Death Knight Heroes. Run: node tests/set3_death_knight.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler={Potion:3,Antidote:3,Humble:3,Inspiration:3};
const mk=(a,b)=>{const s=E.newGame({seed:7,players:[{name:"A",deck:{name:"A",heroes:a.map(n=>"h:"+n),cards:filler}},{name:"B",deck:{name:"B",heroes:b.map(n=>"h:"+n),cards:filler}}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});s.prio=0;s.init=0;s.p[0].aura=10;s.p[1].aura=10;return s};
const drain=s=>{let g=0;while(s.pend.length&&g++<30){const q=s.pend[0];const x=ctx.CQAI.respond?ctx.CQAI.respond(s,q.pid,q):(ctx.CQAI.choose?ctx.CQAI.choose(s,q.pid):null);if(!x)break;E.act(s,q.pid,x)}};
const H=(s,p,n)=>s.p[p].heroes.find(h=>h.name===n);
const DK=["Grave Lancer","Hollow Blade","Soul Harvester"],FOES=["Arcane Scholar","Divine Knight","Dark Fang"];
/* data */
ok(["Eliazar the Fallen","Grave Lancer","Hollow Blade","Soul Harvester","Morwen Duskbane"].every(n=>E.DB["h:"+n]&&E.DB["h:"+n].cls==="Death Knight"),"five Death Knight Heroes in the data");
ok(!E.hasBlight({kind:"hero",name:"Eliazar the Fallen"})&&E.hasBlight({kind:"hero",name:"Morwen Duskbane"}),"Eliazar has no Blight; the other four do");
ok(E.DB["h:Grave Lancer"].hp===17&&E.DB["h:Eliazar the Fallen"].hp===15,"Health Points 17 / Eliazar 15");
/* 1. a Blight attack kills: the victim's soul is gone (no surrender, no revive) */
{const s=mk(DK,FOES);const gl=H(s,0,"Grave Lancer"),v=H(s,1,"Dark Fang");v.dmg=E.maxHp(s,v)-1;
 const r=E.act(s,0,{type:"attack",att:gl.uid,targets:[v.uid]});ok(r.ok,"attack "+(r.err||""));drain(s);
 ok(v.dead&&v.surr&&v.noSoul,"Blight kill: soul lost");ok(!E.options(s,1).some(a=>a.type==="soul"&&a.hero===v.uid),"no surrender for a Blight victim");
 s.phase="town";s.p[1].gold=20;ok(!E.options(s,1).some(a=>a.type==="church"&&a.hero===v.uid),"no Church revive for a Blight victim");}
/* 2. killing blow only: Blight damage earlier, a non-Blight hit finishes it */
{const s=mk(DK,FOES);const v=H(s,1,"Dark Fang"),gl=H(s,0,"Grave Lancer"),other=H(s,1,"Divine Knight");
 E.damage(s,gl,v,3,{combat:true});ok(v.lastHit&&v.lastHit.blight,"Blight hit recorded");
 E.damage(s,{name:"Fireball"},v,99,{card:true});ok(v.dead&&!v.noSoul&&!v.surr,"non-Blight killing blow keeps the soul");}
/* 3. a Death Knight's spell without Blight isn't a Blight kill */
{const s=mk(DK,FOES);const v=H(s,1,"Dark Fang"),hb=H(s,0,"Hollow Blade");E.damage(s,hb,v,99,{card:true});ok(v.dead&&!v.noSoul,"Death Knight spell damage (no Blight on the card) isn't Blight");}
/* 4. HP loss isn't Blight */
{const s=mk(DK,FOES);const v=H(s,1,"Dark Fang"),gl=H(s,0,"Grave Lancer");E.damage(s,gl,v,3,{combat:true});E.loseHp(s,v,99,"Poison");ok(v.dead&&!v.noSoul,"HP loss finishing blow isn't Blight");}
/* 5. a dead Death Knight has no soul; Eliazar keeps his */
{const s=mk(["Eliazar the Fallen","Grave Lancer","Morwen Duskbane"],FOES);const gl=H(s,0,"Grave Lancer"),el=H(s,0,"Eliazar the Fallen");
 E.damage(s,{name:"Fireball"},gl,99,{card:true});ok(gl.dead&&gl.surr&&gl.noSoul,"dead Death Knight: no soul");
 E.damage(s,{name:"Fireball"},el,99,{card:true});ok(el.dead&&!el.surr,"Eliazar dies with his soul");
 const so=E.options(s,0).filter(a=>a.type==="soul");ok(so.some(a=>a.hero===el.uid)&&!so.some(a=>a.hero===gl.uid),"only Eliazar's soul can be surrendered");
 ok(!E.mourning(s,0),"a Death Knight's missing soul doesn't count as surrendered (Mourn)");}
/* 6. Morwen can't get status counters */
{const s=mk(["Morwen Duskbane","Grave Lancer","Hollow Blade"],FOES);const m=H(s,0,"Morwen Duskbane");["poison","stun","burn","wound","confuse"].forEach(k=>E.addStatus(s,m,k,2));ok(E.STATUS.every(k=>!m.st[k]),"Morwen: no status counters");}
/* 7. Grave Lancer {L3}: attacks have piercing */
{const s=mk(DK,FOES);const gl=H(s,0,"Grave Lancer"),v=H(s,1,"Divine Knight");gl.lvl=3;const hp0=E.hp(s,v);
 E.act(s,0,{type:"attack",att:gl.uid,targets:[v.uid]});drain(s);ok(hp0-E.hp(s,v)===E.str(s,gl),"Level 3 piercing ignores Defense ("+(hp0-E.hp(s,v))+")");}
{const s=mk(DK,FOES);const gl=H(s,0,"Grave Lancer"),v=H(s,1,"Divine Knight");const hp0=E.hp(s,v);
 E.act(s,0,{type:"attack",att:gl.uid,targets:[v.uid]});drain(s);ok(hp0-E.hp(s,v)<E.str(s,gl),"below Level 3, Defense still applies");}
/* 8. Hollow Blade: Swords cost 1 less; {L3} +2 Strength with a Sword */
{const s=mk(DK,FOES);const hb=H(s,0,"Hollow Blade");const e=E.eqObjFromCard(s,0,{uid:"sw1",id:"Long Sword",owner:0});
 ok(E.eqCost(s,hb,e)===2,"Long Sword costs 2 for Hollow Blade");const s0=E.str(s,hb);E.equipTo(s,hb,e);ok(E.str(s,hb)===s0+3,"no bonus below Level 3");hb.lvl=3;ok(E.str(s,hb)===s0+5,"Level 3: +2 Strength with a Sword");
 const gl=H(s,0,"Grave Lancer");ok(E.eqCost(s,gl,E.eqObjFromCard(s,0,{uid:"sw2",id:"Long Sword",owner:0}))===3,"other Heroes pay full price");}
/* 9. Soul Harvester: levels up when any Hero dies; {L6} readies on a kill */
{const s=mk(DK,FOES);const sh=H(s,0,"Soul Harvester");E.damage(s,{name:"Fireball"},H(s,1,"Dark Fang"),99,{card:true});ok(sh.lvl===1,"levels up when an enemy dies");
 E.damage(s,{name:"Fireball"},H(s,0,"Grave Lancer"),99,{card:true});ok(sh.lvl===2,"levels up when an ally dies");}
{const s=mk(["Soul Harvester","Grave Lancer","Hollow Blade"],FOES);const sh=H(s,0,"Soul Harvester"),v=H(s,1,"Dark Fang");sh.lvl=6;v.dmg=E.maxHp(s,v)-1;
 E.act(s,0,{type:"attack",att:sh.uid,targets:[v.uid]});drain(s);ok(v.dead&&!sh.ex,"Level 6: readies after a kill");ok(v.noSoul,"its kill is a Blight kill");}
/* 10. Eliazar {L3} Paladin equipment; {L6} attacks hit each enemy Hero */
{const s=mk(["Eliazar the Fallen","Grave Lancer","Hollow Blade"],FOES);const el=H(s,0,"Eliazar the Fallen");const ks=E.eqObjFromCard(s,0,{uid:"ks",id:"Knight's Sword",owner:0});
 ok(!E.canUseEq(s,el,ks),"Level 1: no Paladin equipment");el.lvl=3;ok(E.canUseEq(s,el,ks),"Level 3: can equip Paladin equipment");
 el.lvl=6;E.addMod(el,{str:4});const hps=s.p[1].heroes.map(h=>E.hp(s,h));const t=H(s,1,"Arcane Scholar");
 E.act(s,0,{type:"attack",att:el.uid,targets:[t.uid]});drain(s);const lost=s.p[1].heroes.map((h,i)=>hps[i]-E.hp(s,h));ok(lost.every(x=>x>0),"Level 6: every enemy Hero takes damage ("+lost.join(",")+")");
 ok(s.p[1].heroes.every(h=>!h.noSoul),"Eliazar's kills aren't Blight");}
console.log(`Set 3 Death Knight: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
