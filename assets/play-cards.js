/* Crystal Quest card scripts for the Play tab. Each entry automates one card; anything missing here
   resolves by hand through the manual panel. ctx (c): {s,pid,me,op,actor,def,t:[targets],x,modes,comboed,mods,trig,E} */
"use strict";
(function(root){
const E=root.CQE;const S={},H={},OPS={},HARM={};root.CQ_SCRIPTS=S;root.CQ_HERO_SCRIPTS=H;root.CQ_CHOOSE_OPS=OPS;
const t=(k,label,f,extra)=>Object.assign({k,label,f},extra||{});
const ANY=t("any"),EN=t("enemy"),AL=t("ally"),HERO=t("hero","target Hero"),EHERO=t("enemyHero"),AHERO=t("allyHero","target ally Hero"),SUM=t("summon"),ITEM=t("item"),EQ=t("equip","equipment"),PIL=t("pillar");
const cls=c=>t("allyHero","target "+c,(s,o)=>E.heroIs(o,c));
const log=(c,m)=>E.log(c.s,m,c.pid);
const living=pl=>pl.heroes.filter(h=>!h.dead);
const summons=pl=>pl.bf.filter(o=>o.kind==="summon");
const enemies=c=>[...living(c.op),...summons(c.op)];
const allies=c=>[...living(c.me),...summons(c.me)];
function D(c,tg,n,o){o=o||{};if(!tg||tg.kind==="player")return 0;
  if(c.mods&&c.mods.stepIn&&tg.uid===c.mods.stepIn.from){const p=E.find(c.s,c.mods.stepIn.to);if(p&&!p.o.dead){log(c,`${p.o.name} steps in and takes the damage.`);tg=p.o}}
  if(c.mods&&(c.mods.preventAll||c.mods.prevent&&c.mods.prevent.includes(tg.uid))){log(c,`Damage to ${tg.name} is prevented.`);E.stat(c.s,"prev",E.ctrl(c.s,tg),c.mods.by||"Prevent",n);return 0}
  let a=n;if(c.def&&c.def.type==="Spell"&&!o.noSpell){a+=E.spellDmg(c.s,c.pid,c.actor);
    /* upgraded Apprentice's Wand: once per turn, a spell this Hero casts deals +1 more damage to one target */
    if(c.actor&&c.actor.fl&&E.hasUp(c.s,c.actor,"Apprentice's Wand")&&c.actor.fl.wandRound!==c.s.round){c.actor.fl.wandRound=c.s.round;a+=1}}
  if(c.def&&c.def.sub==="Combo"&&c.actor&&E.hasEq(c.actor,"Iron Hand Wraps"))a+=1;
  if(c.arrowBonus){a+=c.arrowBonus.dmg;if(c.arrowBonus.ignoreDef)o.ignoreDef=true;o.pierce=(o.pierce||0)+c.arrowBonus.pierce;if(c.arrowBonus.mult>1)a*=c.arrowBonus.mult}
  if(c.def&&c.def.sub==="Combo"&&c.me.fl.stunner){c.me.fl.stunner=false;E.addStatus(c.s,tg,"stun",1)}
  const dealt=E.damage(c.s,c.actor||{name:c.def.name},tg,a,Object.assign({card:true},o));
  if(dealt>0&&c.mods&&c.mods.retaliate&&c.actor&&!c.actor.dead&&E.ctrl(c.s,tg)!==c.pid){log(c,`Retribution: ${c.actor.name} takes ${dealt} damage back.`);E.damage(c.s,{name:"Retribution"},c.actor,dealt,{card:true,noTrig:true,srcName:"Retribution"})}
  return dealt}
const heal=(c,tg,n)=>tg?E.heal(c.s,c.actor,tg,n,c.pid):0;
const st=(c,tg,k,n)=>{if(tg&&tg.st)E.addStatus(c.s,tg,k,n||1)};
const buff=(tg,m)=>{if(tg&&tg.mods)E.addMod(tg,m)};
const draw=(c,n)=>E.draw(c.s,c.pid,n);
const scry=(c,n,then)=>E.pushScry(c.s,c.pid,n,then);
const exMe=c=>{if(c.actor)c.actor.ex=true};
const summon=(c,name,ready)=>E.makeSummon(c.s,c.pid,name,ready);
const pillar=(c,name,n)=>{for(let i=0;i<(n||1);i++)E.makePillar(c.s,c.pid,name)};
const str=(c,o,vs)=>E.str(c.s,o,vs),dfn=(c,o)=>E.defn(c.s,o);
/* damage "equal to this Hero's STR": uses DEF instead after Rebuke / Bulwark Prayer */
const dstr=(c,o,vs)=>E.dmgStr(c.s,o,vs);
const hp=(c,o)=>E.hp(c.s,o);
const attack=(c,att,tg,o)=>{if(att&&tg)c.s.qatk={pid:c.pid,att:att.uid,tgt:tg.uid,o:o||{}}};
const rand=(c,arr)=>arr.length?arr[E.ri(c.s,arr.length)]:null;
const daggers=(h,s)=>E.eqList(h).filter(e=>s?E.isDagger(s,e):/Dagger/.test(e.name));
const combosPlayed=c=>c.me.t.combos||0;
const destroy=(c,o,ex)=>{if(!o)return;if(o.kind==="summon"&&!ex&&o.ctrl!==c.pid&&c.s.p[o.ctrl].t.shelter){log(c,`${o.name} can't be destroyed this turn (Shelter from the Storm).`);return}E.destroyObj(c.s,o,ex)};
function M(n,opts){return{modes:{n,opts},run(c){const base=(this.t||[]).length;let i=base;(c.modes||[]).forEach(mi=>{const m=opts[mi];if(!m)return;const k=(m.t||[]).length;m.run(Object.assign({},c,{t:c.t.slice(i,i+k)}));i+=k})}}}
const def=(name,o)=>{S[name]=o};
const DMG=t("any","damage target");
const dmgCard=(n,o)=>({t:[(o&&o.tg)||DMG],run(c){const d=D(c,c.t[0],n,o);if(o&&o.st)st(c,c.t[0],o.st);if(o&&o.ex)exMe(c);if(o&&o.pil)pillar(c,o.pil);return d}});
const allDmg=(n,o)=>({run(c){const L=c.actor&&o&&o.l6&&c.actor.lvl>=6?o.l6:n;const times=(o&&o.times)||1;for(let k=0;k<times;k++)enemies(c).forEach(e=>{D(c,e,L,o);if(o&&o.st)st(c,e,o.st)});if(o&&o.pil)pillar(c,o.pil);if(o&&o.ex)exMe(c)}});
const summonCard=(name,ready)=>({run(c){summon(c,name,ready);exMe(c)}});

/* ===== Mage ===== */
def("Flame Jab",dmgCard(3,{type:"Fire",st:"burn"}));def("Flame Lance",dmgCard(4,{type:"Fire",st:"burn"}));
def("Ice Jab",dmgCard(3,{type:"Ice",st:"stun"}));def("Ice Lance",dmgCard(4,{type:"Ice",st:"stun"}));
def("Lightning Bolt",dmgCard(3,{tg:HERO,type:"Lightning"}));def("Spark",dmgCard(1,{type:"Lightning"}));
def("Frost Spike",dmgCard(10,{tg:EN,type:"Ice"}));
def("Frostbite",{t:[ANY],run(c){const was=c.t[0]&&c.t[0].st&&c.t[0].st.stun>0;D(c,c.t[0],2,{type:"Ice"});if(was)st(c,c.t[0],"stun")}});
def("Magic Sink",{t:[EN],run(c){D(c,c.t[0],c.x||0)}});
def("Volt Jab",dmgCard(2,{type:"Lightning",pil:"Spell Damage Pillar",ex:1}));
def("Lightning Lance",dmgCard(4,{type:"Lightning",pil:"Spell Damage Pillar",ex:1}));
def("Chain Lightning",{run(c){living(c.op).forEach(h=>{if(D(c,h,4,{type:"Lightning"})>0&&!h.dead)st(c,h,"stun")});exMe(c)}});
/* Nov 12, 2026: Flame Wave hits each enemy (Heroes and summons); Hail hits everything (every Hero and summon, both parties) */
def("Flame Wave",{run(c){const L=c.actor&&c.actor.lvl>=6?5:3;enemies(c).forEach(h=>D(c,h,L,{type:"Fire"}));exMe(c)}});
def("Pop Rocks",allDmg(1,{times:3,ex:1}));
def("Hail",{run(c){c.s.p.flatMap(pl=>[...living(pl),...summons(pl)]).forEach(o=>D(c,o,1,{type:"Ice"}))}});
/* new card (Nov 12, 2026): Twin Bolt, 3 Aura Mage Spell: 2 Lightning damage to each of two different targets */
def("Twin Bolt",{t:[t("any","first target"),t("any","second target",null,{distinct:true})],run(c){D(c,c.t[0],2,{type:"Lightning"});D(c,c.t[1],2,{type:"Lightning"})}});
def("Storm of Insight",{run(c){let tot=0;living(c.op).forEach(e=>tot+=D(c,e,3,{type:"Lightning"}));exMe(c);if(tot)scry(c,tot)}});
def("Heat Wave",{t:[ANY],run(c){st(c,c.t[0],"burn")}});
def("Ice Ray",{t:[ANY],run(c){st(c,c.t[0],"stun")}});
def("Sleep",{t:[HERO],run(c){if(c.t[0]){c.t[0].ex=true;log(c,`${c.t[0].name} is exhausted.`)}}});
def("Arcane Study",{run(c){draw(c,1);scry(c,2)}});
def("Boost Ritual",{run(c){pillar(c,"Spell Damage Pillar");exMe(c)}});
def("Ritual of Power",{run(c){pillar(c,"Spell Damage Pillar",3);exMe(c)}});
def("Levitate",{run(c){if(!c.actor)return;E.addMod(c.actor,{noAttack:1});log(c,`${c.actor.name} can't be attacked this turn.`)}});
/* ===== Warlock ===== */
const lifeCard=(pay,n)=>({t:[t("enemy","target enemy")],run(c){if(c.actor)E.loseHp(c.s,c.actor,pay,c.def.name+" cost");const o=c.t[0];if(o&&!o.dead){E.loseHp(c.s,o,n,c.def.name);st(c,o,"confuse")}}});
def("Dark Jab",lifeCard(2,4));def("Dark Lance",lifeCard(3,5)); /* update 21: 4 and 5 */
def("Night Terror",{run(c){if(c.actor)E.loseHp(c.s,c.actor,4,"Night Terror cost");enemies(c).forEach(e=>{if(!e.dead){E.loseHp(c.s,e,3,"Night Terror");st(c,e,"confuse")}});exMe(c)}});
/* update 27: Target Hero loses 2 Health Points. Heal this Hero for 2 Health Points. */
def("Siphon Life",{t:[t("hero","Hero to lose 2 HP")],run(c){const o=c.t[0];if(o&&!o.dead)E.loseHp(c.s,o,2,"Siphon Life");heal(c,c.actor,2)}});
def("Dark Arts",{t:[EN],x:{label:"HP to lose (X)",max:(s,pid,a)=>a?Math.max(0,E.hp(s,a)-1):6,free:true},run(c){const n=Math.max(0,c.x||0); /* update 21: no cap */if(n<=0)return;E.loseHp(c.s,c.actor,n,"Dark Arts");if(c.t[0])E.loseHp(c.s,c.t[0],n,"Dark Arts")}});
def("Blood Offering",{run(c){E.loseHp(c.s,c.actor,3,"Blood Offering");c.me.aura+=2;log(c,`${c.me.name} gains 2 Aura.`)}});
def("Disorient",{t:[ANY],run(c){st(c,c.t[0],"confuse")}});
def("Fog of Darkness",{t:[ANY],run(c){if(c.x>0)st(c,c.t[0],"confuse",c.x)}}); /* update 21 */
def("Mind Rend",{t:[HERO],run(c){const h=c.t[0];if(!h||h.dead)return;h.fl.rendRound=c.s.round;log(c,`${h.name}: when it deals damage this turn, the damaged party discards a card.`)}}); /* update 21 */
def("Frailty",{t:[HERO],run(c){buff(c.t[0],{zeroDef:1});log(c,`${c.t[0].name}'s DEF is 0 until Dusk.`)}});
def("Ritual of Pain",{run(c){pillar(c,"Pain Pillar");exMe(c)}});
def("Dark Insight",{run(c){draw(c,1);pillar(c,"Pain Pillar");exMe(c)}});
def("Splitting Ritual",{t:[t("allyPillar","your Pillar")],run(c){const p=c.t[0];if(!p)return;destroy(c,p);pillar(c,p.name,2);exMe(c)}});
def("Doubling Ritual",{run(c){const ps=c.me.bf.filter(o=>o.kind==="pillar");ps.forEach(p=>destroy(c,p));ps.forEach(p=>pillar(c,p.name,2));exMe(c)}});
def("Curse of Exhaustion",{t:[t("player","target party")],run(c){const p=c.t[0];if(p)living(c.s.p[p.pid]).forEach(h=>h.ex=true);log(c,`${p?p.name:"?"}'s party is exhausted.`);exMe(c)}});
def("Power Vacuum",{t:[t("enemyPlayer","target party")],run(c){const pl=c.op;const r=Math.min(pl.aura,c.x||0);pl.aura-=r;log(c,`${pl.name} loses ${r} Aura.`);exMe(c)}});
def("Bewilder",{t:[t("enemyPlayer","target player")],run(c){log(c,`${c.op.name} reveals their hand.`);E.pushChoose(c.s,c.pid,{title:"Bewilder: you may discard one card from their hand",cards:c.op.hand.map(x=>x.uid),min:0,max:1,op:"opDiscard",target:1-c.pid})}});
def("Brain Rot",{t:[t("enemyPlayer","target player")],run(c){log(c,`${c.op.name} reveals their hand.`);E.pushChoose(c.s,c.pid,{title:"Brain Rot: discard a Tactic, Spell or Song",cards:c.op.hand.filter(x=>/Tactic|Spell|Song/.test(E.DB[x.id].type)).map(x=>x.uid),min:1,max:1,op:"opDiscard",target:1-c.pid})}});
const curse=(name,tg)=>def(name,{t:[tg||HERO],run(c){const h=c.t[0];if(!h)return"stay";h.ench.push({uid:c.inst.uid,id:c.def.id,name:c.def.name,kind:"card",owner:c.pid,ctrl:c.pid,cardUid:c.inst.uid});log(c,`${c.def.name} is attached to ${h.name}.`);return"stay"}});
["Aura Leech","Blood Aura","Burden","Slow Down","Chains of Darkness","Distract","Memory Loss","Weaken","Life Boost","Sanctuary","Arrested Development"].forEach(n=>curse(n));
/* Nov 12, 2026: Mark of Doom attaches to an enemy Hero only */
curse("Mark of Doom",t("enemyHero","target enemy Hero"));
/* ===== Cleric ===== */
def("Healing Beam",{t:[t("any","heal target")],run(c){heal(c,c.t[0],5)}});
def("Healing Touch",{t:[t("hero","Hero to heal")],run(c){heal(c,c.t[0],2)}});
def("Full Heal",{run(c){living(c.me).forEach(h=>heal(c,h,3))}});
def("All Play",{run(c){c.s.p.forEach(pl=>living(pl).forEach(h=>heal(c,h,2)));const f=c.actor&&c.actor.lvl>=3?5:2;living(c.me).forEach(h=>heal(c,h,f))}});
def("Light Blast",dmgCard(2,{type:"Light",pierce:2}));
def("Light Helix",{t:[t("hero","Hero to heal"),t("any","damage target")],run(c){heal(c,c.t[0],2);D(c,c.t[1],2,{type:"Light"})}});
def("Healing Blast",{t:[t("any","heal target"),t("any","damage target")],run(c){const x=c.x||0;heal(c,c.t[0],x);D(c,c.t[1],Math.ceil(x/2),{type:"Light"});exMe(c)}});
def("Bulwark Prayer",{t:[t("ally","ally to protect")],run(c){const a=c.t[0];buff(a,{def:2});c.me.fl.clericDefRound=c.s.round;log(c,"This turn, Clerics you control deal damage equal to their DEF instead of their STR.")}});
def("Rebuke",{run(c){if(!c.actor)return;c.actor.fl.defDmgRound=c.s.round;log(c,`This turn, ${c.actor.name} deals damage equal to its DEF (${dfn(c,c.actor)}) instead of its STR.`)}});
def("Carry Radiance",{t:[cls("Cleric")],run(c){buff(c.t[0],{lifelink:1})}});
def("Medical Visit",{t:[ANY],run(c){if(c.t[0])E.removeStatus(c.s,c.t[0],2)}});
def("Purify",{t:[AL],run(c){if(c.t[0]){E.removeStatus(c.s,c.t[0],1);heal(c,c.t[0],1)}}});
def("Resurrection",{t:[t("deadAlly","dead Hero")],can:(s,pid)=>s.p[pid].heroes.some(h=>h.dead&&!h.surr),run(c){const h=c.t[0];if(h){h.dead=false;h.dmg=Math.max(0,E.maxHp(c.s,h)-8);h.ex=true;log(c,`${h.name} is revived with ${E.hp(c.s,h)} HP.`)}exMe(c)}});
def("Wave of Life",{t:[t("any","heal target")],run(c){heal(c,c.t[0],3)}});
def("Righteous Rage",{run(c){buff(c.actor,{str:2,lifelink:1});const tg=enemies(c).filter(e=>!E.stealth(c.s,e)&&!E.noAttack(c.s,e)).sort((a,b)=>hp(c,b)-hp(c,a))[0];c.actor.ex=false;attack(c,c.actor,tg)}});
def("Withdrawal Ailments",{t:[ANY],run(c){let n=0;living(c.me).forEach(h=>E.STATUS.forEach(k=>{n+=h.st[k];h.st[k]=0}));log(c,`${n} status counters removed.`);D(c,c.t[0],n,{type:"Light"})}});
def("Healer's Choice",M(2,[{label:"Heal 2 HP",t:[ANY],run:c=>heal(c,c.t[0],2)},{label:"Remove 1 status counter",t:[ANY],run:c=>c.t[0]&&E.removeStatus(c.s,c.t[0],1)},{label:"Deal 2 Light damage",t:[ANY],run:c=>D(c,c.t[0],2,{type:"Light"})}]));
/* ===== Paladin ===== */
def("Power Thrust",{t:[DMG],run(c){D(c,c.t[0],(c.actor?dstr(c,c.actor):0)+2);exMe(c)}});
def("Shield Bash",{t:[ANY],run(c){D(c,c.t[0],dfn(c,c.actor))}});
def("Radiant Strike",{t:[ANY],run(c){const sw=E.eqList(c.actor).some(e=>/Sword/.test(e.name+" "+(E.DB[e.id]||{}).rules));D(c,c.t[0],sw?5:3,{type:"Light"});exMe(c)}});
def("Divine Judgment",{run(c){const d=dfn(c,c.actor);enemies(c).forEach(e=>D(c,e,d));exMe(c)}});
def("Blockade",{t:[HERO],run(c){buff(c.t[0],{def:4})}});
def("Protect",{t:[HERO],run(c){if(c.t[0]){buff(c.t[0],{def:2});log(c,`${c.t[0].name} gains +2 DEF this turn.`)}}});
def("Extra Protection",{run(c){buff(c.actor,{def:1});log(c,`${c.actor.name} gains +1 DEF this turn.`)}});
def("Vigil",{run(c){exMe(c);buff(c.actor,{def:2});log(c,`${c.actor.name} gains +2 DEF this turn.`)}});
def("Pull Together",{run(c){living(c.me).forEach(h=>buff(h,{def:(c.x||0)}));log(c,`${c.me.name}'s party gains +${c.x||0} DEF this turn.`);exMe(c)}});
def("Conscript",summonCard("Soldier"));
def("Rally the Troops",{run(c){summon(c,"Soldier");summon(c,"Soldier");exMe(c)}});
def("Coordinated Attack",{run(c){c.me.pm.soldier=(c.me.pm.soldier||0)+2;log(c,"Soldiers gain +2 STR this turn.");exMe(c)}});
def("Shield Wall",{run(c){summons(c.me).filter(o=>/Soldier/.test(o.sub||o.name)).forEach(o=>buff(o,{def:1}));log(c,"Soldiers gain +1 DEF this turn.")}});
def("Divine Smite",{t:[t("summon","non-Legendary summon")],run(c){destroy(c,c.t[0])}});
def("Unburden",{run(c){const d=dfn(c,c.actor);buff(c.actor,{str:d,zeroDef:1});log(c,`${c.actor.name} trades ${d} DEF for STR.`)}});
def("Charged Barrage",{t:[t("enemy","target enemy")],run(c){exMe(c);buff(c.actor,{def:3});const n=E.defn(c.s,c.actor);if(c.t[0]){log(c,`Charged Barrage: ${c.actor.name} strikes for ${n}.`);E.damage(c.s,c.actor,c.t[0],n,{card:true,srcName:"Charged Barrage"})}}});
def("Noble Promotion",{run(c){c.me.fl.promoRound=c.s.round;log(c,`${c.me.name} will gain initiative at Dusk.`)}});
def("To the Armory",{run(c){E.pushChoose(c.s,c.pid,{title:"To the Armory: choose an Equipment",cards:c.me.lib.filter(x=>E.DB[x.id].kind==="equip").map(x=>x.uid),min:1,max:1,op:"tutor"})}});
def("Take a Stand",{run(c){draw(c,dfn(c,c.actor));c.actor.fl.standRound=c.s.round}});
def("Noble Choice",M(2,[{label:"Summon a 2/3 Soldier",run:c=>{summon(c,"Soldier");exMe(c)}},{label:"Target Hero gains +1 DEF this turn",t:[HERO],run:c=>{if(c.t[0]){buff(c.t[0],{def:1});log(c,`${c.t[0].name} gains +1 DEF this turn.`)}}},{label:"Draw a card",run:c=>draw(c,1)}]));
/* ===== Barbarian ===== */
def("Pump",{t:[cls("Barbarian")],run(c){buff(c.t[0],{str:2})}});
def("Blunt Force",{t:[cls("Barbarian")],run(c){buff(c.t[0],{str:4})}});
/* Blood Frenzy v2: losing 3 HP is an additional cost (Ritual Athame sees it); +3 STR until Dusk */
def("Blood Frenzy",{t:[cls("Barbarian")],run(c){const b=c.t[0];if(!b)return;E.costHp(c.s,c.pid,b,3,"Blood Frenzy cost");if(!b.dead){buff(b,{str:3});log(c,`${b.name} gains +3 STR until Dusk.`)}}});
def("Bind",{t:[t("hero","Hero to exhaust (Level 3)",null,{opt:true})],run(c){buff(c.actor,{str:1});const h=c.t[0];if(c.actor.lvl>=3&&h&&dfn(c,h)<str(c,c.actor)){h.ex=true;log(c,`${h.name} is exhausted.`)}}});
def("Battered",{t:[HERO],run(c){D(c,c.t[0],dstr(c,c.actor,c.t[0]));if(c.me.disc.some(x=>x.id==="Bruised"))st(c,c.t[0],"wound")}});
/* Nov 12, 2026: double this Hero's Strength (was Strength times the number of Barbarians) */
def("Pummel",{t:[HERO],run(c){D(c,c.t[0],dstr(c,c.actor,c.t[0])*2);exMe(c)}});
def("Awestruck",{t:[t("any","Hero or summon with less STR",(s,o,x)=>x.actor&&E.str(s,o)<E.str(s,x.actor))],run(c){st(c,c.t[0],"stun")}});
def("Bloodthirst",{t:[EN],run(c){c.actor.ex=false;attack(c,c.actor,c.t[0],{after:"readyIfKill"})}});
def("Unstoppable",{t:[EN],run(c){attack(c,c.actor,c.t[0],{noHidden:true})}});
def("Beat Down",{run(c){buff(c.actor,{str:2});const tg=rand(c,enemies(c).filter(e=>!E.stealth(c.s,e)&&!E.noAttack(c.s,e)));attack(c,c.actor,tg,{after:"exhaustTarget"})}});
def("On the Job Training",{run(c){const tg=rand(c,living(c.op).filter(e=>!E.stealth(c.s,e)&&!E.noAttack(c.s,e)));attack(c,c.actor,tg,{after:"levelIfDmg"})}});
def("Bruised",{run(c){c.actor.fl.bruisedRound=c.s.round}});
def("Run It Back",{run(c){c.actor.fl.runBackRound=c.s.round;c.actor.fl.runBackUsed=false}});
def("Second Wind",{t:[t("allyHero","Enraged Barbarian",(s,o)=>o.cls==="Barbarian"&&E.enraged(s,o))],run(c){heal(c,c.t[0],3);if(c.t[0]){c.t[0].ex=false;log(c,`${c.t[0].name} readies.`)}}});
def("War Chant",{run(c){const bs=living(c.me).filter(h=>h.cls==="Barbarian"&&h.lvl>=1);c.me.aura+=bs.length;bs.forEach(h=>h.fl.noAuraRound=c.s.round+1);log(c,`${c.me.name} gains ${bs.length} Aura.`)}});
def("Campfire",{enter(c){c.inst.ctr={camp:3}}});
def("Lose Control",{t:[cls("Barbarian")],run(c){if(c.t[0])c.t[0].fl.loseCtrlRound=c.s.round}});
/* ===== Rogue ===== */
def("Surprise Attack",{t:[ANY],run(c){D(c,c.t[0],dstr(c,c.actor,c.t[0]),{ignoreDef:true})}});
def("Toxic Cloud",{run(c){enemies(c).forEach(e=>st(c,e,"poison",1))}}); /* update 18 */
def("Acceleration Agent",{t:[ANY],run(c){const o=c.t[0];if(o&&o.st){o.st.poison*=3;log(c,`${o.name} now has ${o.st.poison} Poison counters.`)}}});
def("Spread the Sickness",{t:[ANY],run(c){const o=c.t[0];if(o&&o.st){o.st.poison*=2;log(c,`${o.name} now has ${o.st.poison} Poison counters.`)}}});
def("Overdose",{t:[t("any","Poisoned target",(s,o)=>o.st&&o.st.poison>0)],run(c){if(c.t[0]){c.t[0].ex=true;log(c,`${c.t[0].name} is exhausted.`)}}});
def("Envenom",{run(c){c.me.pm.poisonous=1;log(c,"Rogues gain Poisonous 1 this turn.")}});
def("Vanish",{t:[cls("Rogue")],run(c){buff(c.t[0],{stealth:1})}});
def("Armed",{t:[cls("Rogue")],run(c){const h=c.t[0];if(!h)return;E.equipTo(c.s,h,E.makeEqToken(c.s,c.pid,"Dagger"))}});
def("Quick Inventory",{run(c){E.toInv(c.s,c.pid,E.makeEqToken(c.s,c.pid,"Dagger"));log(c,"A Dagger token goes to inventory.")}});
def("Ritual of Fang",{run(c){E.toInv(c.s,c.pid,E.makeEqToken(c.s,c.pid,"Viper Fang Dagger"));log(c,"A Viper Fang Dagger token goes to inventory.")}});
def("Blademaster's Choice",Object.assign(M(2,[{label:"+1 additional STR",run:c=>{c._x.str=1}},{label:"Poisonous 1",run:c=>{c._x.poison=1}},{label:"Stun on combat damage",run:c=>{c._x.stun=1}}]),{run(c){const x={};c._x=x;(c.modes||[]).forEach(i=>this.modes.opts[i]&&this.modes.opts[i].run(c));const e=E.makeEqToken(c.s,c.pid,"Dagger",x);if(x.str)e.pstr+=1;E.toInv(c.s,c.pid,e);log(c,"A custom Dagger token goes to inventory.")}}));
def("Resourceful Maneuver",{t:[cls("Rogue")],can:(s,pid)=>s.p[pid].disc.some(x=>/Dagger/.test(x.id||"")&&E.DB[x.id].kind==="equip"),run(c){const pl=c.me;const i=pl.disc.findIndex(x=>/Dagger/.test(x.id||"")&&E.DB[x.id].kind==="equip");if(i<0||!c.t[0])return;const card=pl.disc.splice(i,1)[0];E.equipTo(c.s,c.t[0],E.eqObjFromCard(c.s,c.pid,card))}});
def("Broken Blade",{t:[t("allyHero","your Hero with a Dagger",(s,o)=>E.eqList(o).some(e=>E.isDagger(s,e)))],can:(s,pid)=>E.living(s.p[pid]).some(h=>E.eqList(h).some(e=>E.isDagger(s,e))),run(c){const h=c.t[0];if(!h)return;const d=daggers(h,c.s)[0];if(d){destroy(c,d);h.ex=false;log(c,`${h.name} readies.`)}}}); /* update 18 */
def("Flick Dagger",{can:(s,pid,a)=>a&&E.eqList(a).some(e=>E.isDagger(s,e)),run(c){const d=daggers(c.actor,c.s)[0];if(!d)return;destroy(c,d);const n=dstr(c,c.actor);enemies(c).forEach(e=>D(c,e,n))}});
def("Death by a Thousand Cuts",{t:[ANY],run(c){let n=0;enemies(c).forEach(e=>n+=e.st.poison);living(c.me).filter(h=>h.cls==="Rogue").forEach(h=>n+=daggers(h,c.s).length);D(c,c.t[0],n);exMe(c)}});
def("Cut Off",{t:[EHERO],run(c){const h=c.t[0];if(!h)return;const pl=c.s.p[h.owner];pl.heroes.splice(pl.heroes.indexOf(h),1);pl.heroes.push(h);log(c,`${h.name} is moved to the Closer position.`);attack(c,c.actor,h)}});
def("Synchronous Strike",{t:[ANY],run(c){const rs=living(c.me).filter(h=>h.cls==="Rogue");let n=0;rs.forEach(h=>{n+=dstr(c,h);h.ex=true});D(c,c.t[0],n)}});
def("Larceny",{t:[t("item","enemy item",(s,o,x)=>E.ctrl(s,o)!==x.actor.owner)],run(c){steal(c,c.t[0])}});
def("Petty Theft",{t:[t("item","enemy Consumable",(s,o,x)=>E.ctrl(s,o)!==x.actor.owner&&(E.DB[o.id]||{}).sub==="Consumable")],run(c){steal(c,c.t[0])}});
function steal(c,o){if(!o)return;const f=E.find(c.s,o.uid);if(!f||f.zone!=="inv")return;const from=c.s.p[f.pid];from.inv.splice(from.inv.indexOf(o),1);o.ctrl=c.pid;E.toInv(c.s,c.pid,o);log(c,`${c.me.name} gains control of ${o.name}.`)}
/* ===== Monk ===== */
def("Jab",dmgCard(2));def("Lunge",dmgCard(1));def("Roundhouse",dmgCard(3,{pierce:1}));
def("Ascend",{t:[HERO],run(c){buff(c.t[0],{str:2})}});
def("Breath",{run(c){scry(c,1)}});
def("Flurry of Blows",{t:[ANY],run(c){D(c,c.t[0],2,{pierce:1});D(c,c.t[0],2,{pierce:1})}});
def("Lotus Jab",{t:[ANY],run(c){D(c,c.t[0],2);if(c.comboed){c.me.aura+=1;log(c,`${c.me.name} gains 1 Aura.`)}}});
def("Palm Strike",{t:[ANY],run(c){D(c,c.t[0],1);if(c.comboed)st(c,c.t[0],"stun")}});
def("Rising Dragon",{t:[ANY],run(c){D(c,c.t[0],2+Math.max(0,combosPlayed(c)-1))}});
def("Finisher",{t:[ANY],run(c){D(c,c.t[0],combosPlayed(c))}});
def("Focus",{run(c){c.me.pm.pierce=1;log(c,"Attacks gain Piercing 1 this turn.")}});
def("Glimpse the Future",{run(c){scry(c,3)}});
/* update 24 meditation rework: meditation counters (no stats); waking turns them into Aura and +1 STR each until Dusk (engine medWake) */
const medCtr=(c,h)=>{if(h&&h.med&&!h.dead){h.plus=(h.plus||0)+1;log(c,`${h.name} gets a meditation counter (${h.plus}).`)}};
/* "If no Hero you control is Meditating, this Hero may Meditate." */
const medMay=c=>{const a=c.actor;if(!a||a.dead||c.me.heroes.some(h=>h.med&&!h.dead))return;E.ask(c.s,c.pid,`${a.name} may Meditate`,[{label:`${a.name} Meditates`,v:a.uid},{label:"Don't Meditate",v:null}],"medMay",{name:c.def&&c.def.name})};
E.ASK.medMay=(s,pid,pr,v)=>{if(v==null)return;const h=E.heroByUid(s,v);if(h&&!h.med)E.meditate(s,h)};
def("Meditate",{run(c){E.meditate(c.s,c.actor);buff(c.actor,{def:3});log(c,`${c.actor.name} gets +3 DEF until Dusk.`)}});
def("Deep Contemplation",{t:[t("meditating","Meditating Hero",null,{opt:true})],run(c){draw(c,1);medCtr(c,c.t[0]);medMay(c)}});
def("Defend Prayer",{t:[t("any","damage target"),t("meditating","Meditating Hero for the counter",null,{opt:true})],run(c){D(c,c.t[0],2);medCtr(c,c.t[1]);medMay(c)}});
def("Look Ahead",{t:[t("meditating","Meditating Hero",null,{opt:true})],run(c){medCtr(c,c.t[0]);scry(c,2);medMay(c)}});
def("Awakened Fist",{t:[t("meditating","Meditating Hero"),t("enemy","attack target")],can:(s,pid)=>s.p[pid].heroes.some(h=>h.med&&!h.dead),run(c){const h=c.t[0];if(!h)return;h.ex=false;E.medWake(c.s,h);attack(c,h,c.t[1],{pierce:99})}});
def("Balanced Choice",M(2,[{label:"Scry 2",run:c=>scry(c,2)},{label:"Target Hero gains +2 STR",t:[HERO],run:c=>buff(c.t[0],{str:2})},{label:"This Hero Meditates",run:c=>E.meditate(c.s,c.actor)}]));
def("Well Trained",{t:[HERO],modes:{n:1,opts:[{label:"If it reaches an even Level, gain +1 STR"},{label:"If it reaches an even Level, gain +1 DEF"},{label:"If it reaches an even Level, gain +1 AURA"}]},run(c){if(combosPlayed(c)>=3&&c.t[0])E.levelUp(c.s,c.t[0],["str","def","aura"][(c.modes||[])[0]||0])}});
def("Stunner",{run(c){c.me.fl.stunner=true}});
/* ===== Bard ===== */
def("Ballad of Blades",{t:[t("ally","another ally to boost",(s,o,x)=>!x||!x.actor||o!==x.actor)],run(c){const n=(c.me.t.songs||0)>1?3:2;if(c.t[0]){buff(c.t[0],{str:n});log(c,`${c.t[0].name} gains +${n} STR this turn.`)}}});S['"Ballad of Blades"']=S["Ballad of Blades"];
const song=(n,o)=>{S['"'+n+'"']=o};
song("Ballad of Blades",S["Ballad of Blades"]);
song("Crescendo",Object.assign({t:[ANY]},{modes:{n:1,opts:[{label:"Deal 3 damage"},{label:"Harmonize 2: 3 damage to each enemy"}]},can:()=>true,run(c){
  const harm=(c.modes||[])[0]===1&&(c.echo||living(c.me).filter(h=>!h.ex&&h!==c.actor).length>=2);
  if(harm)harmonize(c,2,"crescendo");else D(c,c.t[0],3)}}));
/* update 23: the opponent tips you 1 Gold out of their Gold (counts as your Tip for the round) */
song("Dazzling Melody",{t:[t("enemyPlayer","target opponent")],run(c){const pl=c.me;if(pl.fl.tipRound===c.s.round){log(c,"Dazzling Melody: you already got a Tip this round.");return}pl.fl.tipRound=c.s.round;
  const g=E.stealGold(c.s,c.pid,1-c.pid,1,"Dazzling Melody (Tip)");if(!g)log(c,"Dazzling Melody: the opponent has no Gold to tip.")}});
song("Lullaby",{t:[t("any","target with 0 or less STR",(s,o)=>E.str(s,o)<=0)],run(c){if(c.t[0]){c.t[0].ex=true;log(c,`${c.t[0].name} is exhausted.`)}}});
song("Peace",{t:[HERO],run(c){if(c.t[0]){buff(c.t[0],{zeroStr:1});log(c,`${c.t[0].name}'s Strength becomes 0 until Dusk.`)}if(c.me.disc.some(x=>x.id==='"Understanding"'))draw(c,1)}});
/* update 23: Harmonize X (other ready Heroes): draw X+1 cards and gain X+1 Aura */
song("Rousing Chorus",{x:{label:"Harmonize X: how many other ready Heroes to exhaust",max:(s,pid,a)=>s.p[pid].heroes.filter(h=>!h.dead&&!h.ex&&h!==a).length,free:true},run(c){
  const n=c.echo?(c.x||0):Math.min(c.x||0,living(c.me).filter(h=>!h.ex&&h!==c.actor).length);if(!n){HARM.rousing(c,0);return}harmonize(c,n,"rousing")}});
song("Song of Healing",{run(c){c.s.p.forEach(pl=>living(pl).forEach(o=>heal(c,o,2)))}});
song("Call and Response",{modes:{n:1,opts:[{label:"Draw a card"},{label:"Draw a card, Harmonize 1: draw an additional card"}]},run(c){draw(c,1);if((c.modes||[])[0]===1&&(c.echo||living(c.me).some(h=>!h.ex&&h!==c.actor)))harmonize(c,1,"draw1")}});
song("Solo Act",{can:(s,pid,a)=>s.p[pid].heroes.filter(h=>!h.dead&&!h.ex&&h!==a).length>=2,run(c){harmonize(c,2,"soloAct",{notActor:true,verb:"Solo Act"})}});
song("Understanding",{modes:{n:1,opts:[{label:"Scry 3"},{label:"Scry 3, Harmonize 1: draw a card"}]},run(c){if((c.modes||[])[0]===1&&(c.echo||living(c.me).some(h=>!h.ex&&h!==c.actor)))harmonize(c,1,"understanding");else scry(c,3)}});
/* Nov 12, 2026: you choose which revealed Song goes to your hand, and both players see it */
song("Opening Act",{run(c){const first=(c.me.t.acts||0)<=1;const top=c.me.lib.splice(-3);log(c,`Revealed: ${top.map(x=>E.DB[x.id].name).join(", ")}.`);
  if(first){c.me.aura+=1;log(c,`${c.me.name} gains 1 Aura.`)}
  const songs=top.filter(x=>E.DB[x.id].type==="Song");if(!songs.length){c.me.disc.push(...top);log(c,"Opening Act: no Song among them; all go to the discard pile.");return}
  const show={};top.forEach(x=>{show[x.uid]=x.id});
  E.pushChoose(c.s,c.pid,{title:"Opening Act: you may put a Song from among them into your hand (the rest go to your discard pile)",cards:songs.map(x=>x.uid),show,min:0,max:1,op:"openingAct",hold:top})}});
OPS.openingAct=(s,pid,pr,picks)=>{const pl=s.p[pid];const top=pr.hold||[];const pick=top.find(x=>x.uid===picks[0]);
  if(pick){pl.hand.push(pick);E.log(s,`Opening Act: ${pl.name} puts ${E.DB[pick.id].name} into their hand.`,pid)}else E.log(s,`Opening Act: ${pl.name} takes no Song.`,pid);
  top.filter(x=>x!==pick).forEach(x=>pl.disc.push(x))};
def("Embolden",{run(c){c.me.fl.emb={round:c.s.round,n:1};log(c,"The next time an ally would gain Strength this turn, it gains double that instead.")}});
def("Strong Stance",{t:[HERO],run(c){buff(c.t[0],{def:2})}});
def("Weakening Dirge",{run(c){c.me.pm.enemyStr=(c.me.pm.enemyStr||0)+1;log(c,"Enemies get -1 STR this turn.")}});
def("Mead Offering",{run(c){c.s.p.forEach(pl=>{pl.aura+=2});log(c,"All parties gain 2 Aura.")}});
def("Standing Ovation",{run(c){living(c.me).forEach(h=>h.ex=false);log(c,`${c.me.name}'s Heroes ready.`)}});
def("Tempo Change",{run(c){c.s.bonus={pid:c.pid,uid:c.actor.uid,n:3};log(c,`${c.actor.name} takes two additional actions.`)}});
/* ===== Ranger ===== */
const arrowNext=(c,o)=>{c.me.fl.arrowNext=Object.assign(c.me.fl.arrowNext||{},o)};
def("Bullseye",{run(c){arrowNext(c,{ign:true});log(c,"The next Arrow ignores DEF.")}});
def("Full Draw",{run(c){const n=c.me.fl.arrowNext;arrowNext(c,{dmg:((n&&n.dmg)||0)+4});log(c,"The next Arrow gains +4 damage.")}});
def("Spotters",{run(c){const r=living(c.me).filter(h=>h.cls==="Ranger").length;const n=c.me.fl.arrowNext;arrowNext(c,{dmg:((n&&n.dmg)||0)+r});log(c,`The next Arrow gains +${r} damage.`)}});
def("Reload",{run(c){const top=c.me.lib.slice(-2);if(!top.length){log(c,"Reload: the library is empty.");return}
  const room=c.me.inv.length<E.slots(c.s,c.pid);const arrows=top.filter(x=>E.DB[x.id].sub==="Arrow");
  log(c,`Reload: ${c.me.name} looks at the top ${top.length} card${top.length===1?"":"s"} of their library.`,c.pid);
  if(arrows.length&&room)E.pushChoose(c.s,c.pid,{title:"Reload: put an Arrow from among them into your inventory? The rest go on the bottom of your library.",cards:arrows.map(x=>x.uid),min:0,max:1,op:"reload",look:top.map(x=>x.uid)});
  else{if(arrows.length)log(c,"Reload: there's an Arrow, but the inventory is full.");else log(c,"Reload: no Arrow among them.");OPS.reload(c.s,c.pid,{look:top.map(x=>x.uid)},[])}}});
/* Reload v3: the picked Arrow goes into inventory; the rest of the looked-at cards go on the bottom of the library */
OPS.reload=(s,pid,pr,picks)=>{const pl=s.p[pid];const look=pr.look||[];
  picks.slice(0,1).forEach(u=>{const i=pl.lib.findIndex(x=>x.uid===u);if(i>=0&&pl.inv.length<E.slots(s,pid)){const x=pl.lib.splice(i,1)[0];const d=E.DB[x.id];pl.inv.push(Object.assign({kind:"card",fd:false,name:d.name,ctr:{}},x));E.log(s,`${d.name} goes into inventory.`,pid)}});
  let n=0;look.forEach(u=>{const i=pl.lib.findIndex(x=>x.uid===u);if(i>=0){pl.lib.unshift(pl.lib.splice(i,1)[0]);n++}});
  if(n)E.log(s,`${pl.name} puts ${n} card${n===1?"":"s"} on the bottom of their library.`,pid)};
def("Quickdraw",{run(c){const top=c.me.lib.splice(-3);top.slice().forEach(x=>{if(E.DB[x.id].sub==="Arrow"&&c.me.inv.length<E.slots(c.s,c.pid)){top.splice(top.indexOf(x),1);c.me.inv.push(Object.assign({kind:"card",fd:false,name:E.DB[x.id].name,ctr:{}},x));log(c,`${E.DB[x.id].name} goes into inventory.`)}});c.me.lib.push(...top);exMe(c)}});
const arrow=(cost,t2,run,o)=>({act:Object.assign({cost,t:t2,run},o||{})});
def("Arrow of Hope",arrow(3,[EN],c=>{D(c,c.t[0],2);draw(c,2)}));
def("Arrow of Persuasion",arrow(1,[EN,t("ally","which of your units it must attack")],c=>{const tg=c.t[0],to=c.t[1];D(c,tg,3);
  if(tg&&!tg.dead&&(tg.kind==="hero"||tg.kind==="summon")&&E.ctrl(c.s,tg)!==c.pid&&to&&!to.dead){tg.fl=tg.fl||{};tg.fl.forceAtk={uid:to.uid,round:c.s.round,by:c.pid};log(c,`Until Dusk, ${tg.name}'s next action must be an attack on ${to.name}.`)}}));
/* Refire: the same Hero immediately activates an Arrow (paying its Aura); if it resolves, the Arrow returns to inventory */
const refireArrows=(s,pid,a)=>{const pl=s.p[pid];return pl.inv.filter(o=>o.kind==="card"&&!o.fd&&E.DB[o.id].sub==="Arrow"&&(S[o.name]||{}).act)};
def("Refire",{can:(s,pid,a)=>!!a&&refireArrows(s,pid,a).some(o=>E.itemCost(s,pid,a,o)+1<=s.p[pid].aura),
  run(c){c.s.bonus={pid:c.pid,uid:c.actor.uid,n:2,only:"arrow",refire:true};log(c,`Refire: ${c.actor.name} activates an Arrow now; it returns to inventory if it resolves.`)}});
/* update 25: the defending player chooses which card to discard */
def("Blunt-Point Force",arrow(2,[EN],c=>{const d=D(c,c.t[0],3);if(d>0&&c.t[0]){const vp=E.ctrl(c.s,c.t[0]);const pl=c.s.p[vp];if(pl.hand.length){log(c,`${pl.name} chooses a card to discard.`);E.pushChoose(c.s,vp,{title:"Blunt-Point Force: choose a card to discard",cards:pl.hand.map(x=>x.uid),from:"hand",min:1,max:1,op:"discard"})}}}));
def("Dual Shot",arrow(1,[t("enemy","first target enemy"),t("enemy","second target enemy",null,{distinct:true})],c=>{D(c,c.t[0],2);D(c,c.t[1],2)}));
def("Flame Bolt",arrow(1,[HERO],c=>{D(c,c.t[0],3,{type:"Fire"});st(c,c.t[0],"burn")}));
def("Level Shot",arrow(1,[EN],c=>{D(c,c.t[0],3);if((c.me.t.arrows||0)===2)E.levelUp(c.s,c.actor,"str")}));
/* update 27: Arrow damage boosts (Full Draw, Spotters, Multi Bow, Longbow, Hawkeye, Mystic Quiver) make Poison Dart deal that much damage; Heavy Bow doubles it (0 stays 0) */
def("Poison Dart",arrow(1,[t("any","target to Poison twice")],c=>{if(c.arrowBonus&&c.arrowBonus.dmg>0)D(c,c.t[0],0);st(c,c.t[0],"poison",2)}));
def("Serrated Arrow",arrow(1,[EN],c=>{D(c,c.t[0],3,{pierce:3})}));
def("Arrow of Devastation",arrow(4,[EN],c=>{D(c,c.t[0],5,{pierce:3})}));
/* Arrow of Craftsmanship: can't be targeted (engine); Upgrade X Gold (Town): +X damage for the rest of the game */
def("Arrow of Craftsmanship",arrow(1,[EN],c=>{D(c,c.t[0],2+(c.upg||0))}));
def("Smoke Trail Arrow",arrow(1,[EN],c=>{D(c,c.t[0],3);c.me.fl.preventNext=true}));
def("Tri-Shot",arrow(4,[t("enemyPlayer","target party")],c=>{const p=c.t[0];if(!p)return;const hs=c.s.p[p.pid].heroes;[5,3,1].forEach((n,i)=>{if(hs[i]&&!hs[i].dead)D(c,hs[i],n,{ignoreDef:true})})}));
/* ===== Druid ===== */
def("Beast",summonCard("Beast"));def("Elk",summonCard("Elk"));def("Wolves",{run(c){summon(c,"Wolf");summon(c,"Wolf");exMe(c)}});def("Heavy Beast",summonCard("Heavy Beast"));
def("Aurawing",summonCard("Aurawing Familiar"));def("Drawwing",summonCard("Drawwing Familiar"));
def("Elk of the Woods",{run(c){summon(c,"Woods Beast",true);exMe(c)}});
def("Spore Calling",{run(c){summon(c,"Spore");draw(c,1)}}); /* update 29: doesn't say "Exhaust this Hero", so it doesn't */
def("Heartwood Seed",{run(c){summon(c,"Sapling")}});
/* Bloom v2 (update 29): you pick which ready summons to exhaust (one yes/no per summon); the Hero isn't exhausted */
def("Bloom",{run(c){const r=summons(c.me).filter(o=>!o.ex);if(!r.length){log(c,"Bloom: no ready summons.");return}
  r.slice().reverse().forEach(o=>E.ask(c.s,c.pid,`Bloom: exhaust ${o.name} (${o.str}/${Math.max(0,o.hp-(o.dmg||0))}) to gain 1 Aura?`,[{label:"Exhaust it (+1 Aura)",v:o.uid},{label:"Leave it ready",v:null}],"bloom",{name:"Bloom"}))}});
E.ASK.bloom=(s,pid,pr,v)=>{if(!v)return;const f=E.find(s,v);if(!f||f.o.kind!=="summon"||f.o.ex||f.pid!==pid)return;f.o.ex=true;s.p[pid].aura+=1;E.log(s,`Bloom: ${f.o.name} is exhausted; ${s.p[pid].name} gains 1 Aura.`,pid)};
def("Tooth",{run(c){c.me.pm.sstr=(c.me.pm.sstr||0)+1;log(c,"Summons gain +1 STR this turn.")}});
def("Horn",{run(c){c.me.pm.sdef=(c.me.pm.sdef||0)+1;log(c,"Summons gain +1 DEF this turn.")}});
def("Tooth or Horn",M(1,[{label:"+3 STR",t:[t("allySummon","your summon")],run:c=>buff(c.t[0],{str:3})},{label:"+3 DEF",t:[t("allySummon","your summon")],run:c=>buff(c.t[0],{def:3})}]));
const adjHero=(s,o)=>{if(!o||o.kind!=="hero")return false;const hs=s.p[o.owner].heroes;const i=hs.indexOf(o);return[hs[i-1],hs[i+1]].some(h=>h&&!h.dead)};
def("Entangling Roots",{t:[t("enemyHero","enemy Hero to Stun (must be next to another enemy Hero)",(s,o)=>adjHero(s,o))],run(c){const o=c.t[0];if(o)st(c,o,"stun")}});
def("Bark Blessing",{run(c){c.me.t.nextBark=(c.me.t.nextBark||0)+1;log(c,"The next summon that enters this turn has Barkborn.")}});
def("Rootfolk",summonCard("Rootfolk"));def("Great Rootfolk",summonCard("Great Rootfolk",true)); /* update 29: enters with Stealth, ready */
def("Call to Companions",{run(c){const n=living(c.me).filter(h=>E.heroIs(h,"Druid")).length;for(let i=0;i<n;i++)summon(c,"Wolf");exMe(c)}});
def("Lesser Elemental",{t:[t("enemy","attack target")],run(c){const o=summon(c,"Elemental",true);exMe(c);attack(c,o,c.t[0])}});
def("Greater Elemental",{t:[t("enemy","attack target")],run(c){const o=summon(c,"Greater Elemental",true);exMe(c);attack(c,o,c.t[0])}});
def("Populate",{t:[t("allySummon","summon with 2 or less STR",(s,o)=>E.str(s,o)<=2)],run(c){if(c.t[0])E.copySummon(c.s,c.pid,c.t[0]);exMe(c)}});
def("Mass Populate",{run(c){summons(c.me).slice().forEach(o=>E.copySummon(c.s,c.pid,o));exMe(c)}});
def("Evolve",{run(c){summons(c.me).slice(0,2).forEach(o=>{destroy(c,o,true);E.copySummon(c.s,c.pid,o,1)});exMe(c)}});
def("Return to the Earth",{t:[t("allySummon","summon to sacrifice")],run(c){destroy(c,c.t[0]);draw(c,1)}});
def("Primal Energy",{t:[HERO],can:(s,pid)=>s.p[pid].bf.filter(o=>o.kind==="summon"&&!o.ex).length>=2,run(c){summons(c.me).filter(o=>!o.ex).slice(0,2).forEach(o=>o.ex=true);if(c.t[0]){c.t[0].ex=false;log(c,`${c.t[0].name} readies.`)}}});
def("Nature's Choice",M(2,[{label:"Summon a 2/3 Elk",run:c=>{summon(c,"Elk");exMe(c)}},{label:"A summon gains +2 STR",t:[t("summon")],run:c=>buff(c.t[0],{str:2})},{label:"Ready a summon",t:[t("allySummon","your summon")],run:c=>{if(c.t[0])c.t[0].ex=false}}]));
def("Stampede",{run(c){summons(c.me).forEach(o=>{o.ex=false;const tg=rand(c,enemies(c).filter(e=>!E.stealth(c.s,e)&&!E.noAttack(c.s,e)));if(tg)E.damage(c.s,o,tg,str(c,o,tg),{combat:true})});summons(c.me).forEach(o=>o.ex=false)}});
/* ===== Generic ===== */
def("Inspiration",{run(c){draw(c,2)}});
def("Precognition",{run(c){scry(c,2,{draw:1})}});
def("Search for Knowledge",{run(c){draw(c,2);E.pushChoose(c.s,c.pid,{title:"Discard 2 cards",cards:c.me.hand.map(x=>x.uid),min:2,max:2,op:"discard"})}});
def("Level Up",{t:[HERO],modes:{n:1,opts:[{label:"If it reaches an even Level, gain +1 STR"},{label:"If it reaches an even Level, gain +1 DEF"},{label:"If it reaches an even Level, gain +1 AURA"}]},run(c){if(c.t[0])E.levelUp(c.s,c.t[0],["str","def","aura"][(c.modes||[])[0]||0])}});
/* update 27: dropping to an odd level also costs a stat point; the Hero's owner chooses which */
def("Delevel",{t:[HERO],run(c){const h=c.t[0];if(!h||h.lvl<=0)return;const odd=h.lvl%2===0;h.lvl--;log(c,`${h.name} drops to Level ${h.lvl}.`);
  if(!odd)return;const ks=["str","def","aura"].filter(k=>h.bon[k]>0);if(!ks.length)return;
  if(ks.length===1){h.bon[ks[0]]--;log(c,`${h.name} loses its +1 ${ks[0].toUpperCase()}.`);return}
  E.ask(c.s,h.owner,`Delevel: ${h.name} loses a stat point. Choose which.`,ks.map(k=>({label:`Lose +1 ${({str:"Strength",def:"Defense",aura:"Aura"})[k]}`,v:k})),"delevelStat",{h:h.uid})}});
E.ASK.delevelStat=(s,pid,pr,v)=>{const h=E.heroByUid(s,pr.data.h);if(!h||!v||!(h.bon[v]>0))return;h.bon[v]--;E.log(s,`${h.name} loses its +1 ${v.toUpperCase()}.`,pid)};
def("Block Progress",{t:[HERO],run(c){if(c.t[0])c.t[0].fl.noLevel=c.s.round}});
def("Humble",{t:[t("any","Hero or summon")],run(c){buff(c.t[0],{zeroStr:1})}});
def("Enfeeble",{t:[t("any","Hero or summon")],run(c){buff(c.t[0],{zeroDef:1})}});
def("Disarm",{t:[EQ],run(c){if(c.t[0])E.unequip(c.s,c.t[0])}});
def("Shatter",{t:[EQ],run(c){destroy(c,c.t[0])}});
def("Disenchant",{t:[t("ench","enchantment")],run(c){destroy(c,c.t[0])}});
def("Naturalize",{t:[ITEM],run(c){destroy(c,c.t[0])}});
def("Vandalize",{t:[PIL],run(c){destroy(c,c.t[0])}});
def("Exile",{t:[t("nonHero")],run(c){destroy(c,c.t[0],true)}});
def("Dissipate",{t:[t("nonHero","non-Hero object (cost 3 or less)",(s,o)=>o.tok||(parseInt((E.DB[o.id]||{}).cost,10)||0)<=3)],run(c){destroy(c,c.t[0])}});
def("Snuff Out",{t:[t("summon","summon with 3 or less HP",(s,o)=>E.hp(s,o)<=3)],run(c){destroy(c,c.t[0])}});
def("Smash to Smithereens",{run(c){c.s.p.forEach(pl=>pl.bf.filter(o=>o.kind==="pillar").forEach(o=>destroy(c,o)));exMe(c)}});
def("Farewell",{run(c){E.allObjs(c.s).filter(o=>o.kind!=="hero"&&!o.fd).forEach(o=>destroy(c,o));living(c.me).forEach(h=>h.ex=true)}});
def("Ice Bath",{run(c){c.s.p.forEach(pl=>[...pl.heroes,...summons(pl)].forEach(o=>{if(o.st)o.st.burn=0}));log(c,"All Burn counters are removed.")}});
def("Mocking Doll",{run(c){E.makeDoll(c.s,c.pid)}});
def("Quick Change",{t:[t("allyEquip","your equipment"),t("allyHero","Hero to receive it")],run(c){const e=c.t[0],h=c.t[1];if(!e||!h||!E.canUseEq(c.s,h,e))return log(c,"That Hero can't use it.");const f=E.find(c.s,e.uid);if(f.hero===h)return;f.hero.eq[f.slot]=null;if(f.slot==="H1"&&f.hero.eq.H2==="2H")f.hero.eq.H2=null;E.equipTo(c.s,h,e)}});
def("Hero's Choice",M(2,[{label:"Scry 2",run:c=>scry(c,2)},{label:"Destroy target item",t:[ITEM],run:c=>destroy(c,c.t[0])},{label:"Draw a card",run:c=>draw(c,1)}]));
/* items with activations */
const item=(cost,t2,run,o)=>({act:Object.assign({cost,t:t2,run},o||{})});
def("Antidote",item(2,[ANY],c=>{if(c.t[0])E.removeStatus(c.s,c.t[0],3)},{exile:true}));
def("Potion",item(2,[t("hero","Hero to heal")],c=>heal(c,c.t[0],3),{exile:true}));
def("Revitalize",item(2,[],c=>{c.me.aura+=4;log(c,`${c.me.name} gains 4 Aura.`)},{exile:true}));
def("Smoke Bomb",item(1,[AHERO],c=>buff(c.t[0],{stealth:1}),{exile:true}));
def("Vial of Venom",item(1,[ANY],c=>st(c,c.t[0],"poison",2),{exile:true}));
def("Energizing Ale",item(2,[t("ally","another ally",(s,o,x)=>!x||!x.actor||o!==x.actor)],c=>{if(c.t[0]){c.t[0].ex=false;log(c,`${c.t[0].name} readies.`)}},{exile:true}));
def("Meditation Shrine",item(0,[],c=>E.meditate(c.s,c.actor),{ex:true,anyClass:true}));
def("Fireball Flask",item(2,[AL],c=>{if(c.t[0]){buff(c.t[0],{str:3});log(c,`${c.t[0].name} gets +3 STR this turn.`)}},{exile:true}));
def("Undeniable Performance",{run(c){c.me.fl.tipFromRound=c.s.round;log(c,"Tips you get this turn come out of an opposing party's Gold.")}});
song("Toast to the House",{run(c){c.s.p.forEach((pl,i)=>E.draw(c.s,i,1));log(c,"All parties draw a card.");E.tip(c.s,c.pid,"Toast to the House")}});
song("Sing Along",{t:[AHERO],run(c){if(c.t[0]){c.t[0].fl.singRound=c.s.round;log(c,`${c.t[0].name}'s next Tactic or Song this turn gains Echo.`)}}});
def("Harmonic Flask",item(2,[],c=>{if((c.modes||[])[0]===1){if(c.t[0])E.removeStatus(c.s,c.t[0],2)}else heal(c,c.actor,2)},{exile:true,modes:{n:1,opts:[{label:"Heal this Hero for 2 HP"},{label:"Remove up to 2 status counters from target Hero",t:[t("hero","Hero to clear (2 status)")]}]}}));
/* "Choices": choose two of Mill 2 / equip an Equipment from hand or inventory to this Hero for free / return a Song from discard to hand */
song("Choices",{modes:{n:2,opts:[{label:"Mill 2"},{label:"Equip a Bard Equipment from your hand or inventory to this Hero (free)"},{label:"Return a Song from your discard pile to your hand"}]},run(c){const m=c.modes||[];const pl=c.me;
  if(m.includes(0))E.mill(c.s,c.pid,2);
  if(m.includes(1)&&c.actor){const hand=pl.hand.filter(x=>E.DB[x.id]&&E.DB[x.id].kind==="equip"&&E.DB[x.id].cls==="Bard"&&E.canUseEq(c.s,c.actor,E.eqObjFromCard(c.s,c.pid,x)));const inv=pl.inv.filter(o=>o.kind==="equip"&&(E.DB[o.id]||{}).cls==="Bard"&&E.canUseEq(c.s,c.actor,o));
    const show={};hand.forEach(x=>show[x.uid]=x.id);inv.forEach(o=>show[o.uid]=o.id);
    if(hand.length+inv.length)E.pushChoose(c.s,c.pid,{title:"Choices: equip a Bard Equipment to "+c.actor.name+" for free",cards:hand.concat(inv).map(x=>x.uid),show,min:1,max:1,op:"equipFree",hero:c.actor.uid});else log(c,"No Bard Equipment in hand or inventory that this Hero can use.")}
  if(m.includes(2)){const songs=pl.disc.filter(x=>E.DB[x.id]&&E.DB[x.id].type==="Song");if(songs.length)E.pushChoose(c.s,c.pid,{title:"Choices: return a Song to your hand",cards:songs.map(x=>x.uid),min:1,max:1,op:"fromDisc"});else log(c,"No Song in your discard pile.")}}});
def("Phoenix Down",item(3,[t("deadAny","dead Hero")],c=>{const h=c.t[0];if(!h)return;h.dead=false;h.dmg=Math.max(0,E.maxHp(c.s,h)-3);h.ex=true;E.addMod(h,{stealth:1});log(c,`${h.name} is revived with 3 HP.`)},{exile:true,can:(s)=>s.p.some(p=>p.heroes.some(h=>h.dead&&!h.surr))}));
def("Platinum Bar",item(2,[],c=>draw(c,1)));
def("Gold Bar",item(3,[],c=>{c.me.pm.def=(c.me.pm.def||0)+1;log(c,"Your party gains +1 DEF this turn.")}));
def("Silver Bar",item(3,[],c=>{c.me.pm.str=(c.me.pm.str||0)+1;log(c,"Your party gains +1 STR this turn.")}));
def("Dynamite",item(3,[t("any","first damage target"),t("any","second damage target",null,{distinct:true})],c=>{D(c,c.t[0],2);D(c,c.t[1],2)}));
def("Sleeping Potion",item(2,[HERO],c=>{if(c.t[0]){c.t[0].ex=true;log(c,`${c.t[0].name} is exhausted.`)}},{exile:true,ex:true}));
def("Amnesia Puzzle Box",item(0,[t("player","target player")],c=>{const p=c.s.p[c.t[0].pid];p.lib.push(...p.disc.splice(0));E.shuffle(c.s,p.lib);log(c,`${p.name} shuffles their discard pile into their library.`)},{exile:true}));
def("Energy Stone",item(0,[t("allySummon","first ready summon to exhaust",(s,o)=>!o.ex),t("allySummon","second ready summon to exhaust",(s,o)=>!o.ex,{distinct:true})],c=>{const ss=c.t.filter(o=>o&&!o.ex);if(ss.length<2){log(c,"Energy Stone needs two ready summons.");return}ss.slice(0,2).forEach(o=>{o.ex=true;log(c,`${o.name} is exhausted.`)});c.me.aura+=1;log(c,`${c.me.name} gains 1 Aura.`)},{anyClass:true,can:(s,pid)=>s.p[pid].bf.filter(o=>o.kind==="summon"&&!o.ex).length>=2}));
def("Song Book",item(1,[],c=>{c.inst.exh=true;E.pushChoose(c.s,c.pid,{title:"Song Book: choose a Song",cards:c.me.lib.filter(x=>E.DB[x.id].type==="Song").map(x=>x.uid),min:1,max:1,op:"tutor"})},{can:(s,pid,a,o)=>!o.exh}));
def("Instrument Bag",item(2,[],c=>{E.pushChoose(c.s,c.pid,{title:"Instrument Bag: choose an Instrument",cards:c.me.lib.filter(x=>E.DB[x.id].sub==="Instrument").map(x=>x.uid),min:1,max:1,op:"tutor"})}));
/* ===== update 9 ===== */
def("Reclaim",{t:[],can:(s,pid)=>s.p[pid].disc.length>0,run(c){const pl=c.me;if(!pl.disc.length){log(c,"Your discard pile is empty.");return}
  E.pushChoose(c.s,c.pid,{title:"Reclaim: return a card from your discard pile to your hand",cards:pl.disc.map(x=>x.uid),min:1,max:1,op:"fromDisc"})}});
/* Banding cards: the engine reads these flags (E.hasBanding) and offers "Band attack" */
def("Unity of the Herd",{run(c){c.me.fl.summonBandRound=c.s.round;log(c,"Friendly summons gain Banding this turn.")}});
song("Marching Cadence",{run(c){living(c.me).forEach(h=>h.fl.bandRound=c.s.round);log(c,"Heroes in your party gain Banding this turn.")}});
song("Duet",{t:[t("allyHero","another ally to band with",(s,o,x)=>!x||o!==x.actor)],run(c){const a=c.actor,b=c.t[0];[a,b].forEach(h=>{if(h){h.fl.bandRound=c.s.round;buff(h,{str:1})}});
  log(c,`${a?a.name:"This Hero"}${b?" and "+b.name:""} gain +1 STR and Banding this turn.`)}});
/* passive items: handled in the engine by name (no script needed beyond entering play) */
["Tip Jar","Aura Crystal","Gathering Tree","Ley Grove","Warrior's Pyre","Brute's Banner","Captain's Banner","Healing Relic","Inversion Stone","Horn Crystal","Barkskin Totem","Tangle Rod","Caltrops","Xakro's War Horn","Trophy Rack","Lightning Rod","Tooth Crystal","Petal Shrine","Sphere of Hindrance","The Monolith","The Forbidden Tuner","Almandine","Rose Quartz","Topaz"].forEach(n=>{if(!S[n])S[n]={}});
S["Almandine"].gem=c=>{c.actor=null;enemies(c).forEach(e=>E.damage(c.s,{name:"Almandine"},e,2,{card:true}))};
S["Rose Quartz"].gem=c=>{living(c.me).forEach(h=>E.heal(c.s,null,h,3))};
S["Topaz"].gem=c=>{c.me.aura+=2;log(c,`${c.me.name} gains 2 Aura.`)};
/* ===== Hidden cards ===== */
const hid=(name,when,ok,run)=>{S[name]=Object.assign(S[name]||{},{hidden:{when,ok,run}})};
const atkr=(s,trig)=>E.find(s,trig.attacker);
const isHeroAtk=(s,pid,trig)=>{const f=atkr(s,trig);return f&&f.o.kind==="hero"};
hid("Bear Trap","attack",null,c=>{const a=atkr(c.s,c.trig);if(a)E.damage(c.s,{name:"Bear Trap"},a.o,3,{card:true})});
hid("Pitfall","attack",isHeroAtk,c=>{c.mods.cancel=true;const a=atkr(c.s,c.trig).o;const eq=E.eqList(a);eq.forEach(e=>E.unequip(c.s,e));log(c,eq.length?`Pitfall: ${a.name} loses all its equipment (to inventory).`:`Pitfall: ${a.name} has no equipment.`)});
hid("Snare","attack",isHeroAtk,c=>{c.mods.str=(c.mods.str||0)-3;log(c,"The attacker gets -3 STR for this attack.")});
hid("Spike Pit","attack",isHeroAtk,c=>{const a=atkr(c.s,c.trig).o;E.loseHp(c.s,a,2,"Spike Pit");E.stat(c.s,"dmg",c.pid,"Spike Pit",2);st(c,a,"wound",3)});
hid("Grapple","attack",null,c=>{c.mods.noDamage=true;const d=E.find(c.s,c.trig.target);if(d&&d.o.kind==="hero"&&!d.o.dead&&d.o.ex){d.o.ex=false;log(c,`Grapple: ${d.o.name} readies.`)}});
/* Into the Trees: cancel an enemy attack on, or an enemy card/ability targeting, a friendly Hero */
hid("Into the Trees",["attack","card"],(s,pid,trig)=>{if(trig.kind==="attack"){const f=E.find(s,trig.target);return f&&f.pid===pid&&f.o.kind==="hero"}
  return(trig.targets||[]).some(u=>{const f=E.find(s,u);return f&&f.pid===pid&&f.o.kind==="hero"})},c=>{c.mods.cancel=true});
hid("Fortify","attack",null,c=>{c.mods.noDamage=true});
hid("Attack Reversal","attack",null,c=>{c.mods.cancel=true});
hid("Refrain","attack",null,c=>{c.mods.noDamage=true});
hid("Out of the Woods","attack",(s,pid,trig)=>{const t2=E.find(s,trig.target);return t2&&t2.o.kind==="hero"&&t2.pid===pid},c=>{summon(c,"Beast")});
hid("Fade the Fury","attack",(s,pid,trig)=>{const t2=E.find(s,trig.target);const a=atkr(s,trig);return t2&&t2.o.kind==="hero"&&E.heroIs(t2.o,"Rogue")&&a&&a.o.kind==="hero"&&E.str(s,a.o)>=3},c=>{c.mods.cancel=true});
hid("Shelter from the Storm",["attack","card"],(s,pid,trig)=>s.p[pid].bf.some(o=>o.kind==="summon"),c=>{c.me.t.shelter=true;summons(c.me).forEach(o=>{o.ex=true});log(c,"Summons can't be destroyed this turn and are exhausted.")});
hid("Cancel","card",null,c=>{c.mods.cancel=true});
/* Hand of the Protector (update 29): revealed in any response window, by a ready Druid or a ready summon; target ally gains DEF equal to its HP until Dusk */
hid("Hand of the Protector",["attack","card","afterDmg","party10","dusk"],null,c=>{const al=living(c.me).concat(summons(c.me)).filter(o=>!o.dead);if(!al.length)return;
  const tu=c.trig&&(c.trig.target||(c.trig.targets||[])[0]);const first=al.find(o=>o.uid===tu);const l=first?[first].concat(al.filter(o=>o!==first)):al.slice().sort((a,b)=>E.hp(c.s,b)-E.hp(c.s,a));
  E.ask(c.s,c.pid,"Hand of the Protector: target ally gains Defense equal to its Health Points until Dusk",l.map(o=>({label:`${o.name}${o.kind==="summon"?" (summon)":""}: +${E.hp(c.s,o)} DEF`,v:o.uid})),"handProtector",{name:"Hand of the Protector"})});
S["Hand of the Protector"].hidden.summonPay=true;
E.ASK.handProtector=(s,pid,pr,v)=>{const f=E.find(s,v);if(!f||f.o.dead)return;const n=E.hp(s,f.o);E.addMod(f.o,{def:n});E.log(s,`Hand of the Protector: ${f.o.name} gains +${n} DEF until Dusk.`,pid)};
/* Burgle (update 18): only while every opposing Hero that isn't dead is exhausted */
hid("Burgle",["attack","card","afterDmg","party10","dusk"],(s,pid)=>{const op=E.living(s.p[1-pid]);return op.length>0&&op.every(h=>h.ex)&&(s.p[1-pid].gold||0)>0},c=>{E.stealGold(c.s,c.pid,1-c.pid,5,"Burgle")});
hid("Narrow Escape","card",(s,pid,trig)=>trig.card&&trig.cost>=3&&(trig.targets||[]).some(u=>{const f=E.find(s,u);return f&&f.pid===pid&&f.o.kind==="hero"&&E.heroIs(f.o,"Rogue")}),c=>{c.mods.cancel=true});
hid("Camouflage","card",(s,pid,trig)=>/Spell|Tactic/.test(trig.type||"")&&(trig.targets||[]).some(u=>{const f=E.find(s,u);return f&&f.pid===pid&&f.o.kind==="hero"}),c=>{const hs=(c.trig.targets||[]).map(u=>E.find(c.s,u)).filter(f=>f&&f.pid===c.pid&&f.o.kind==="hero");c.mods.prevent=(c.mods.prevent||[]).concat(hs.map(f=>f.o.uid));hs.forEach(f=>E.addMod(f.o,{untarget:1}))});
hid("Timely Heals",["party10","attack","card"],(s,pid)=>(s.p[pid].t.took||0)>=10,c=>{living(c.me).forEach(h=>E.heal(c.s,c.actor,h,4,c.pid))});
/* Hidden cards still go to inventory via Hidden play; scripts above make them automatic. */

/* ===== Hero abilities ===== */
const hab=(name,arr)=>{H[name]=arr};
const enemyItem=max=>t("item",max==null?"enemy item":"enemy item (cost 2 or less)",(s,o,x)=>E.ctrl(s,o)!==x.actor.owner&&(max==null||(o.tok?0:(parseInt((E.DB[o.id]||{}).cost,10)||0))<=max));
hab("Valdo Sticky Fingers",[{label:"Take an enemy item (cost 2 or less)",can:(s,pid,a)=>a.lvl<3&&s.p[1-pid].inv.some(o=>!o.fd&&(o.kind==="doll"||(o.kind==="card"&&(parseInt((E.DB[o.id]||{}).cost,10)||0)<=2))),t:[enemyItem(2)],run:c=>steal(c,c.t[0])},{label:"Take an enemy item",lvl:3,can:(s,pid)=>s.p[1-pid].inv.some(o=>!o.fd&&(o.kind==="doll"||o.kind==="card")),t:[enemyItem(null)],run:c=>steal(c,c.t[0])}]);
hab("Arcane Scholar",[{label:"Next Mage card costs 2 less",run:c=>{c.me.fl.mageNext=true}},{label:"Mage cards cost 1 less this turn",lvl:3,run:c=>{c.me.fl.mageAll=true}}]);
hab("Arnett Lifebinder",[{label:"Heal another target 2",cost:1,t:[t("anyOther","another target")],run:c=>heal(c,c.t[0],2)},{label:"Heal another target 5",lvl:3,cost:2,t:[t("anyOther","another target")],run:c=>heal(c,c.t[0],5)}]);
hab("Battle Minstrel",[{label:"Return a Song from discard to hand",can:(s,pid)=>s.p[pid].disc.some(x=>E.DB[x.id].type==="Song"),run:c=>E.pushChoose(c.s,c.pid,{title:"Return a Song to hand",cards:c.me.disc.filter(x=>E.DB[x.id].type==="Song").map(x=>x.uid),min:1,max:1,op:"fromDisc"})}]);
hab("Dark Channeler",[{label:"Lose 4 HP: gain 3 Aura",can:(s,pid,a)=>a.lvl<3,run:c=>{E.loseHp(c.s,c.actor,4,"Dark Channeler");c.me.aura+=3;log(c,`${c.me.name} gains 3 Aura.`)}},{label:"Lose 2 HP: gain 3 Aura",lvl:3,run:c=>{E.loseHp(c.s,c.actor,2,"Dark Channeler");c.me.aura+=3;log(c,`${c.me.name} gains 3 Aura.`)}}]);
hab("Divine Knight",[{label:"Ally +2 DEF this turn",cost:1,t:[AL],run:c=>buff(c.t[0],{def:2})},{label:"Ally +5 DEF this turn",lvl:3,cost:3,t:[AL],run:c=>buff(c.t[0],{def:5})}]);
hab("Essence Reaper",[{label:"Stun target enemy",lvl:3,t:[EN],run:c=>st(c,c.t[0],"stun")}]);
hab("Trainee Vincent",[{label:"Meditate",run:c=>E.meditate(c.s,c.actor)}]);
hab("Inspiration Herald",[{label:"Ready another ally",t:[t("ally","another ally",(s,o,x)=>o.uid!==x.actor.uid&&o.ex)],run:c=>{if(c.t[0]){c.t[0].ex=false;log(c,`${c.t[0].name} readies.`)}}}]);
hab("Rage Brute",[{label:"Fatigue: +STR equal to its STR this turn",ex:false,can:(s,pid,a)=>!a.fat,run:c=>{const n=E.str(c.s,c.actor);c.actor.fat=1;buff(c.actor,{str:n});log(c,`${c.actor.name} gets a Fatigue counter and gains +${n} STR this turn (it won't ready at the next Dawn).`)}}]);
hab("Rootbinder",[{label:"Summons +1 STR this turn",run:c=>{c.me.pm.sstr=(c.me.pm.sstr||0)+1;log(c,"Summons gain +1 STR this turn.")}}]);
/* Songweaver (Nov 12, 2026): passive, the first Song it plays from your hand each turn has Echo; Level 3: every Song it plays from your hand (engine) */
hab("Storm Caller",[{label:"Deal 2 damage to each enemy Hero",cost:2,can:(s,pid,a)=>a.lvl<3,run:c=>living(c.op).forEach(e=>E.damage(c.s,c.actor,e,2,{card:true}))},{label:"Deal 3 damage to each enemy Hero",lvl:3,cost:2,run:c=>living(c.op).forEach(e=>E.damage(c.s,c.actor,e,3,{card:true}))}]);
hab("Wild Shifter",[{label:"Ready a summon you control",can:(s,pid,a)=>a.lvl<3&&s.p[pid].bf.some(o=>o.kind==="summon"&&o.ex),t:[t("allySummon","exhausted summon to ready",(s,o)=>o.ex)],run:c=>{if(c.t[0]){c.t[0].ex=false;log(c,`${c.t[0].name} readies.`)}}},{label:"Ready up to two summons you control",lvl:3,can:(s,pid)=>s.p[pid].bf.some(o=>o.kind==="summon"&&o.ex),t:[t("allySummon","exhausted summon to ready",(s,o)=>o.ex),t("allySummon","second exhausted summon (optional)",(s,o)=>o.ex,{opt:true,distinct:true})],run:c=>{c.t.filter(Boolean).forEach(o=>{if(o.ex){o.ex=false;log(c,`${o.name} readies.`)}})}}]);
hab("Rootfolk Elder",[{label:"Next summon this turn has Barkborn",can:(s,pid,a)=>a.lvl<3,run:c=>{c.me.t.nextBark=(c.me.t.nextBark||0)+1;log(c,"The next summon that enters this turn has Barkborn.")}},{label:"All summons that enter this turn have Barkborn",lvl:3,run:c=>{c.me.t.allBark=(c.me.t.allBark||0)+1;log(c,"All summons that enter this turn have Barkborn.")}}]);
hab("Warden of the Woods",[{label:"Summon a 1/3 Squirrel",cost:1,run:c=>summon(c,"Squirrel")},{label:"Exhaust a summon: +2 STR",ex:false,can:(s,pid)=>s.p[pid].bf.some(o=>o.kind==="summon"&&!o.ex),t:[t("allySummon","ready summon",(s,o)=>!o.ex)],run:c=>{if(c.t[0])c.t[0].ex=true;buff(c.actor,{str:2})}}]);

/* ===== choose ops ===== */

/* ===== Update 15: the last by-hand cards ===== */
const A=E.ASK;
/* Harmonize X: the player chooses which ready Heroes to exhaust, one at a time (no choice when every ready Hero must go).
   The card's effect runs from HARM[k] after the last pick, so it always follows the exhausting. */
function harmonize(c,n,k,o){o=o||{};
  const d={k,left:n,total:n,picked:[],actor:c.actor&&c.actor.uid,notActor:!!o.notActor,card:c.def&&c.def.id,name:c.def&&c.def.name,verb:o.verb||"Harmonize",tu:c.tu||[],modes:c.modes||null,x:c.x==null?null:c.x};
  /* Update 31c: an Echo replay copies the card as it was played; its Harmonize was paid the first time, so nobody is exhausted again */
  if(c.echo){d.free=true;d.left=0;if(n)E.log(c.s,`Echo: ${d.verb} ${n} was already paid; no Heroes are exhausted.`,c.pid);harmDone(c.s,c.pid,d);return}
  harmAsk(c.s,c.pid,d)}
function harmCands(s,pid,d){return s.p[pid].heroes.filter(h=>!h.dead&&!h.ex&&h.uid!==d.actor)} /* update 23: Harmonize exhausts OTHER ready Heroes */
function harmAsk(s,pid,d){const cs=harmCands(s,pid,d);
  if(cs.length<=d.left){cs.forEach(h=>{h.ex=true;d.picked.push(h.uid)});d.left=0;harmDone(s,pid,d);return}
  E.ask(s,pid,`${d.name||"Harmonize"} · ${d.verb} ${d.total}: choose a ready Hero to exhaust${d.total>1?` (${d.picked.length+1} of ${d.total})`:""}`,
    cs.map(h=>({label:h.name+(h.uid===d.actor?" (playing this card)":""),v:h.uid})),"harmPick",d)}
A.harmPick=(s,pid,pr,v)=>{const d=pr.data;const h=E.heroByUid(s,v);if(h&&!h.dead&&!h.ex){h.ex=true;d.picked.push(h.uid);d.left--}if(d.left>0)harmAsk(s,pid,d);else harmDone(s,pid,d)};
function harmDone(s,pid,d){const nm=d.picked.map(u=>(E.heroByUid(s,u)||{}).name).filter(Boolean);
  if(nm.length)E.log(s,`${d.verb} ${nm.length}: ${nm.join(", ")} ${nm.length>1?"are":"is"} exhausted.`,pid);
  const f=HARM[d.k];if(!f)return;const c=E.mkCtx(s,pid,E.heroByUid(s,d.actor),E.DB[d.card],null,d.tu,{modes:d.modes,x:d.x,echo:!!d.free});f(c,d.free?d.total:nm.length)}
HARM.crescendo=c=>{enemies(c).forEach(e=>D(c,e,3))};
HARM.draw2=c=>{draw(c,2)};
HARM.draw1=c=>{draw(c,1)};
HARM.rousing=(c,n)=>{draw(c,n+1);c.me.aura+=n+1;log(c,`${c.me.name} draws ${n+1} and gains ${n+1} Aura.`)};
HARM.understanding=c=>{scry(c,3,{draw:1})};
HARM.soloAct=c=>{c.me.fl.songDisc=true;log(c,"Songs cost 2 less this turn.")};
const rogueEx=t("allyHero","exhausted Rogue",(s,o)=>o.ex&&E.heroIs(o,"Rogue"));
/* Barbarian */
def("Blood Price",{t:[t("allyHero","Barbarian",(s,o)=>E.heroIs(o,"Barbarian"))],x:{label:"X (HP the Barbarian loses)",max:(s,pid)=>Math.max(0,...s.p[pid].heroes.filter(h=>!h.dead&&E.heroIs(h,"Barbarian")).map(h=>E.hp(s,h)-1)),free:true},
  run(c){const b=c.t[0];if(!b)return;const n=Math.max(0,Math.min(c.x||0,E.hp(c.s,b)-1));if(!n){log(c,"Blood Price: X is 0.");return}const was=E.enraged(c.s,b);
    E.costHp(c.s,c.pid,b,n,"Blood Price");buff(b,{str:n});log(c,`${b.name} gains +${n} STR this turn.`);if(!was&&E.enraged(c.s,b)&&b.ex){b.ex=false;log(c,`${b.name} is now Enraged and readies.`)}}});
def("Scrap Metal",{run(c){c.actor.fl.scrapRound=c.s.round;log(c,`This turn, whenever ${c.actor.name} damages an enemy Hero, destroy one of its equipment.`)}});
def("Smash and Grab",{t:[t("item","item to destroy",(s,o,x)=>o.kind!=="card"||o.fd||x.actor.lvl>=3||(parseInt((E.DB[o.id]||{}).cost,10)||0)<=2,{opt:true}),t("item","second item to destroy",(s,o,x)=>o.kind!=="card"||o.fd||x.actor.lvl>=3||(parseInt((E.DB[o.id]||{}).cost,10)||0)<=2,{opt:true,distinct:true})],
  run(c){c.t.filter(Boolean).forEach(o=>{destroy(c,o);E.trophy(c.s,c.actor.uid)});exMe(c)}});
hid("Die Swinging","dying",(s,pid,tr)=>{const f=E.find(s,tr.hero);return f&&f.pid===pid&&E.heroIs(f.o,"Barbarian")},c=>{const h=E.find(c.s,c.trig.hero).o;
  const cs=E.candidates(c.s,c.pid,{k:"enemy"},{attack:true,actor:h}).map(u=>E.resolveTarget(c.s,u)).filter(Boolean);
  const t2=rand(c,cs);if(t2){E.log(c.s,`⚔ ${h.name} attacks ${t2.name} (random enemy) as it falls.`,c.pid);E.damage(c.s,h,t2,E.dmgStr(c.s,h,t2),{combat:true,ignoreDef:true,srcName:"Die Swinging"})}});
A.dieSwing=(s,pid,pr,v)=>{const a=E.find(s,pr.data.att);const t2=E.resolveTarget(s,v);if(!a||!t2)return;E.log(s,`⚔ ${a.o.name} attacks ${t2.name} as it falls.`,pid);E.damage(s,a.o,t2,E.dmgStr(s,a.o,t2),{combat:true,ignoreDef:true,srcName:"Die Swinging"})};
/* Bard */
song("Come Together",{x:{label:"Harmonize X: how many other ready Heroes to exhaust",max:(s,pid,a)=>s.p[pid].heroes.filter(h=>!h.dead&&!h.ex&&h!==a).length,free:true},run(c){
  const n=c.echo?(c.x||0):Math.min(c.x||0,living(c.me).filter(h=>!h.ex&&h!==c.actor).length);if(!n){HARM.comeTogether(c,0);return}
  harmonize(c,n,"comeTogether")}});
HARM.comeTogether=(c,n)=>{
  const k=Math.min(n+2,c.me.lib.length);if(!k){log(c,"Your library is empty.");return}
  const top=c.me.lib.slice(-k).reverse();log(c,`${c.me.name} reveals ${top.map(x=>E.DB[x.id].name).join(", ")}.`);
  c.s.pend.unshift({type:"bottomRest",pid:c.pid,uids:top.map(x=>x.uid)});
  /* update 23: any revealed card a Hero you control can play (its class or Generic); that Hero plays it for free */
  const actors={};const heroes=living(c.me).filter(h=>E.canPlayCards?E.canPlayCards(h):true);
  top.forEach(x=>{const d=E.DB[x.id];if(!d||d.sup==="Hidden")return;const pick=(c.actor&&(d.cls==="Generic"||E.heroIs(c.actor,d.cls)))?c.actor:heroes.find(h=>d.cls==="Generic"||E.heroIs(h,d.cls));if(pick)actors[x.uid]=pick.uid});
  const ok=Object.keys(actors);
  if(ok.length)c.s.pend.unshift({type:"combo",pid:c.pid,actor:c.actor.uid,actors,cands:ok,free:true,title:"\"Come Together\": you may play a revealed card without paying its Aura cost"});else log(c,"No revealed card can be played by your Heroes.")};
def("Frog in the Throat",{t:[HERO],run(c){E.silence(c.s,c.t[0])}});
def("Mirrored Chant",{can:(s,pid)=>{const L=s.lastCard;return!!(L&&L.round===s.round&&/Spell|Tactic|Song/.test(L.type||"")&&E.DB[L.id].name!=="Mirrored Chant")},
  run(c){const L=c.s.prevCard;if(!L||L.round!==c.s.round||!/Spell|Tactic|Song/.test(L.type||"")||E.DB[L.id].name==="Mirrored Chant"){log(c,"Mirrored Chant: there's no Spell, Tactic or Song to copy.");return}
    log(c,`Mirrored Chant copies ${E.DB[L.id].name}${L.x?` (X = ${L.x})`:""}.`);E.copyTargets(c.s,c.pid,{id:L.id,actor:c.actor&&c.actor.uid,modes:L.modes||[],x:L.x||0,picked:[],orig:L.targets||[]})}});
/* update 23: Rapacious Encore is a 1-Aura Tactic: play a Song from your discard pile (pay its Aura cost), then deal damage equal to that cost, Piercing (ignores all DEF) */
def("Rapacious Encore",{can:(s,pid,a)=>s.p[pid].disc.some(x=>{const d=E.DB[x.id];return d&&d.type==="Song"&&E.cardCost(s,pid,a,d,0)+E.cardCost(s,pid,a,E.DB["Rapacious Encore"],0)<=s.p[pid].aura}),
  run(c){const songs=c.me.disc.filter(x=>{const d=E.DB[x.id];return d&&d.type==="Song"&&E.cardCost(c.s,c.pid,c.actor,d,0)<=c.me.aura});
    if(!songs.length||!c.actor){log(c,"Rapacious Encore: no Song in your discard pile you can pay for.");return}
    c.s.pend.unshift({type:"combo",pid:c.pid,actor:c.actor.uid,cands:songs.map(x=>x.uid),pay:true,fromDisc:true,encore:true,title:"Rapacious Encore: play a Song from your discard pile (pay its Aura cost)"})}});
/* Nov 12, 2026: X is chosen as Sonic Recall is played (before the opponent can respond), and Step In can redirect its damage */
def("Sonic Recall",{t:[HERO],x:{label:"X: Songs to shuffle from your discard pile into your library (X damage)",max:(s,pid)=>s.p[pid].disc.filter(x=>E.DB[x.id]&&E.DB[x.id].type==="Song").length,free:true},run(c){exMe(c);
  const pl=c.me,songs=pl.disc.filter(x=>E.DB[x.id].type==="Song"),n=Math.min(c.x||0,songs.length);
  songs.slice(-n||songs.length).slice(0,n).forEach(x=>{const i=pl.disc.indexOf(x);if(i>=0)pl.lib.push(pl.disc.splice(i,1)[0])});if(n)E.shuffle(c.s,pl.lib);
  log(c,`${pl.name} shuffles ${n} Song${n===1?"":"s"} into their library.`);if(n)D(c,c.t[0],n)}});
OPS.sonicRecall=(s,pid,pr,picks)=>{const pl=s.p[pid];let n=0;picks.forEach(u=>{const i=pl.disc.findIndex(x=>x.uid===u);if(i>=0){pl.lib.push(pl.disc.splice(i,1)[0]);n++}});if(n)E.shuffle(s,pl.lib);E.log(s,`${pl.name} shuffles ${n} Song${n===1?"":"s"} into their library.`,pid);
  const t2=pr.tgt&&E.resolveTarget(s,pr.tgt);const a=E.find(s,pr.actor);if(t2&&n)E.damage(s,a?a.o:{name:"Sonic Recall"},t2,n,{card:true,srcName:"Sonic Recall"})};
/* Cleric */
def("False Cure",item(1,[HERO],c=>{const h=c.t[0];if(!h)return;h.fl.falseCure=c.s.round;log(c,`The next heal on ${h.name} this turn becomes HP loss.`)},{exile:true}));
hid("Second Chances","dusk",(s,pid)=>(s.p[pid].t.died||[]).some(u=>{const h=E.heroByUid(s,u);return h&&h.dead&&!h.surr&&h.owner===pid&&!E.heroIs(h,"Cleric")}),c=>{
  const hs=(c.me.t.died||[]).map(u=>E.heroByUid(c.s,u)).filter(h=>h&&h.dead&&!h.surr&&h.owner===c.pid&&!E.heroIs(h,"Cleric")).filter((h,i,a)=>a.indexOf(h)===i);
  if(hs.length===1)A.secondChance(c.s,c.pid,{},hs[0].uid);else E.ask(c.s,c.pid,"Second Chances: revive which Hero?",hs.map(h=>({label:h.name,v:h.uid})),"secondChance",{name:"Second Chances"})});
A.secondChance=(s,pid,pr,v)=>{const h=E.heroByUid(s,v);if(!h||!h.dead||h.surr)return;const mx=E.maxHp(s,h);h.dead=false;h.dmg=mx-Math.ceil(mx/2);h.ex=true;E.log(s,`Second Chances: ${h.name} is revived with ${Math.ceil(mx/2)} HP.`,pid)};
/* Druid */
def("Call of Nature",{can:(s,pid)=>s.p[pid].disc.some(x=>E.DB[x.id].type==="Summon"),run(c){const sm=c.me.disc.filter(x=>E.DB[x.id].type==="Summon");if(!sm.length){log(c,"No Summon card in your discard pile.");return}
  E.pushChoose(c.s,c.pid,{title:"Call of Nature: exile a Summon card from your discard pile (you may play it this turn)",cards:sm.map(x=>x.uid),min:1,max:1,op:"callNature"})}});
OPS.callNature=(s,pid,pr,picks)=>{const pl=s.p[pid];picks.forEach(u=>{const i=pl.disc.findIndex(x=>x.uid===u);if(i>=0){const c=pl.disc.splice(i,1)[0];pl.exile.push(c);pl.t.nature=(pl.t.nature||[]).concat([c.uid]);E.log(s,`${pl.name} exiles ${E.DB[c.id].name}; it can be played this turn.`,pid)}})};
/* Generic */
def("Null Stone",{enter(c){const names=[];const add=n=>{n=String(n||"").replace(/ \(silenced\)$/,"");if(n&&!names.includes(n))names.push(n)};
  c.op.heroes.filter(h=>!h.dead&&(H[h.name]||/:/.test((E.DB[h.id]||{}).rules||""))).forEach(h=>add(h.name));
  c.s.p.forEach(pl=>{pl.inv.forEach(o=>{if(!o.fd&&o.kind==="card"&&(S[o.name]||{}).act&&o.name!=="Null Stone")add(o.name)});pl.heroes.forEach(h=>E.eqList(h).forEach(e=>{if((root.CQ_EQACT||{})[e.name])add(e.name)}))});
  c.me.heroes.filter(h=>!h.dead&&H[h.name]).forEach(h=>add(h.name));
  if(!names.length){log(c,"Null Stone: there's nothing with an activated ability to name.");return}
  E.ask(c.s,c.pid,"Null Stone: name a card. Its activated abilities can't be activated.",names.map(n=>({label:n,v:n})),"nullStone",{uid:c.inst.uid,name:"Null Stone"})}});
A.nullStone=(s,pid,pr,v)=>{const f=E.find(s,pr.data.uid);if(f){f.o.x={name:v};E.log(s,`Null Stone names ${v}.`,pid)}};
/* Mage */
hid("Redirect","card",(s,pid,tr)=>(tr.targets||[]).some(u=>u&&typeof u==="string"&&u[0]!=="P"),c=>{const tr=c.trig,cont=c.cont||{};const i=(tr.targets||[]).findIndex(u=>u&&u[0]!=="P");if(i<0)return;
  let spec=null,card=null;const caster=tr.src&&tr.src.kind==="hero"?E.find(c.s,tr.src.uid):null;
  if(cont.k==="card"){card=E.DB[cont.card.id];const sc=S[card.name];spec=sc&&E.specsFor(sc,cont.modes)[i]}
  else if(cont.k==="ability"&&caster){const ab=(H[caster.o.name]||[])[cont.idx];spec=ab&&(ab.t||[])[i]}
  else if(cont.k==="item"){const sc=S[cont.itemName];spec=sc&&sc.act&&E.specsFor(sc.act,cont.modes)[i]}
  if(!spec){log(c,"Redirect: that target can't be changed.");return}
  const cs=E.candidates(c.s,tr.pid,spec,{actor:caster&&caster.o,card}).filter(u=>u!==tr.targets[i]).map(u=>E.resolveTarget(c.s,u)).filter(Boolean);
  cs.sort((a,b)=>((E.ctrl(c.s,b)===tr.pid)-(E.ctrl(c.s,a)===tr.pid)));
  if(!cs.length){log(c,"Redirect: there's no other legal target.");return}
  E.ask(c.s,c.pid,"Redirect: choose the new target",cs.map(o=>({label:o.name+(o.kind==="summon"?" (summon)":"")+(E.ctrl(c.s,o)===c.pid?" (yours)":""),v:o.uid})),"redirect",{i,name:"Redirect"})});
def("Tome of Gim",item(1,[],c=>{const o=c.inst;if(!o||!(o.under||[]).length){log(c,"There's nothing under Tome of Gim.");return}const show={};o.under.forEach(x=>{show[x.uid]=x.id});
  E.pushChoose(c.s,c.pid,{title:"Tome of Gim: put a card from under it into your hand",cards:o.under.map(x=>x.uid),show,min:1,max:1,op:"tomeTake",tome:o.uid})},{can:(s,pid,a,o)=>!!(o&&o.under&&o.under.length)}));
OPS.tomePut=(s,pid,pr,picks)=>{const pl=s.p[pid];const f=E.find(s,pr.tome);if(!f)return;picks.forEach(u=>{const i=pl.hand.findIndex(x=>x.uid===u);if(i>=0){f.o.under=(f.o.under||[]).concat([pl.hand.splice(i,1)[0]]);E.log(s,`${pl.name} puts a card under Tome of Gim (${f.o.under.length} there).`,pid)}})};
OPS.tomeTake=(s,pid,pr,picks)=>{const pl=s.p[pid];const f=E.find(s,pr.tome);if(!f)return;picks.forEach(u=>{const i=(f.o.under||[]).findIndex(x=>x.uid===u);if(i>=0){pl.hand.push(f.o.under.splice(i,1)[0]);E.log(s,`${pl.name} takes a card from under Tome of Gim.`,pid)}})};
/* Monk */
def("Hand to Hand Combat",{t:[t("allyHero","friendly Hero"),t("enemyHero","enemy Hero")],run(c){const a=c.t[0],b=c.t[1];if(!a||!b)return;
  [a,b].forEach(h=>{const eq=E.eqList(h);h.fl.h2h=eq.map(e=>e.uid);eq.forEach(e=>E.unequip(c.s,e))});
  const sa=E.dmgStr(c.s,a,b),sb=E.dmgStr(c.s,b,a);log(c,`${a.name} and ${b.name} fight hand to hand.`);E.damage(c.s,a,b,sa,{card:true,srcName:"Hand to Hand Combat"});E.damage(c.s,b,a,sb,{card:true,srcName:"Hand to Hand Combat"})}});
def("Split Kick",{run(c){c.me.fl.splitKick=true;log(c,"Your next Combo card may target two Heroes.")}});
/* Paladin */
hid("Retribution","attack",(s,pid,tr)=>{const f=E.find(s,tr.target);return f&&f.pid===pid&&f.o.kind==="hero"},c=>{const a=atkr(c.s,c.trig),f=E.find(c.s,c.trig.target);if(!a||!f)return;const n=E.defn(c.s,f.o);log(c,`Retribution: ${a.o.name} takes ${n}.`);E.damage(c.s,{name:"Retribution"},a.o,n,{card:true,noTrig:true,srcName:"Retribution"})}); /* update 26 */
hid("Step In",["attack","card"],(s,pid,tr)=>{const fs=tr.kind==="attack"?[tr.target]:(tr.targets||[]);return fs.some(u=>{const f=E.find(s,u);return f&&f.pid===pid&&f.o.kind==="hero"})},c=>{const tr=c.trig;
  const fs=tr.kind==="attack"?[tr.target]:(tr.targets||[]);const from=fs.find(u=>{const f=E.find(c.s,u);return f&&f.pid===c.pid&&f.o.kind==="hero"&&f.o.uid!==c.actor.uid});if(!from)return;
  /* Nov 12, 2026: you choose which of your Paladins takes the damage */
  const pals=c.me.heroes.filter(h=>!h.dead&&h.uid!==from&&E.heroIs(h,"Paladin"));if(!pals.length){log(c,"Step In: no other Paladin can take it.");return}
  if(pals.length===1){c.mods.stepIn={from,to:pals[0].uid};log(c,`${pals[0].name} will take that damage instead.`);return}
  E.ask(c.s,c.pid,"Step In: which Paladin takes the damage instead?",pals.map(h=>({label:`${h.name} (${E.hp(c.s,h)}/${E.maxHp(c.s,h)} HP)`,v:h.uid})),"stepIn",{from,name:"Step In"})});
A.stepIn=(s,pid,pr,v)=>{const w=s.pend.find(p=>p.type==="window");if(!w||v==null)return;w.mods.stepIn={from:pr.data.from,to:v};const h=E.find(s,v);E.log(s,`${h?h.o.name:"That Paladin"} will take that damage instead.`,pid)};
S["Step In"].hidden.excl=true;
hid("Self Sacrifice","dying",(s,pid,tr)=>{const f=E.find(s,tr.hero);return f&&f.pid===pid},c=>{const h=E.find(c.s,c.trig.hero).o;const p=c.actor;
  h.dmg=E.maxHp(c.s,h)-1;log(c,`${p.name} dies in ${h.name}'s place; ${h.name} stays at 1 HP.`);p.fl.dyingDone=true;E.loseHp(c.s,p,E.hp(c.s,p),"Self Sacrifice")});
S["Self Sacrifice"].hidden.excl=true;
/* Ranger */
def("Line It Up",{can:(s,pid)=>s.p[pid].inv.some(o=>!o.fd&&(E.DB[o.id]||{}).sub==="Arrow"),run(c){const rs=living(c.me).filter(h=>!h.ex&&E.heroIs(h,"Ranger")).sort((a,b)=>(b===c.actor)-(a===c.actor));
  if(!rs.length){log(c,"No ready Ranger.");return}c.s.bonus={pid:c.pid,uid:rs[0].uid,n:2,only:"arrow",free:true,queue:rs.slice(1).map(h=>h.uid)};
  log(c,`Line It Up: ${rs.map(h=>h.name).join(", ")} may each fire an Arrow for free (skip any to keep it ready).`)}});
def("Rapid Shot",{can:(s,pid,a)=>!!a&&s.p[pid].inv.some(o=>!o.fd&&(E.DB[o.id]||{}).sub==="Arrow"&&E.itemCost(s,pid,a,o)<=s.p[pid].aura),run(c){c.s.bonus={pid:c.pid,uid:c.actor.uid,n:3,only:"arrow",rapid:true};c.me.fl.rapidPierce=true;
  log(c,`Rapid Shot: ${c.actor.name} may activate two Arrows now (Piercing 1), then it's exhausted.`)}});
def("Sure Fire Choice",M(2,[{label:"Return a non-Legendary Arrow from your discard pile to your hand",run:c=>{const ar=c.me.disc.filter(x=>{const d=E.DB[x.id];return d.sub==="Arrow"&&d.sup!=="Legendary"});if(ar.length)E.pushChoose(c.s,c.pid,{title:"Sure Fire Choice: return an Arrow to your hand",cards:ar.map(x=>x.uid),min:1,max:1,op:"fromDisc"});else log(c,"No non-Legendary Arrow in your discard pile.")}},
  {label:"Set a Trap from your hand",run:c=>{const tr=c.me.hand.filter(x=>(E.DB[x.id]||{}).sub==="Trap");if(tr.length&&c.me.inv.length<E.slots(c.s,c.pid))E.pushChoose(c.s,c.pid,{title:"Sure Fire Choice: set a Trap",cards:tr.map(x=>x.uid),min:1,max:1,op:"setTrap"});else log(c,"No Trap in hand (or no empty inventory slot).")}},
  {label:"Ready a Ranger",t:[t("allyHero","Ranger to ready",(s,o)=>E.heroIs(o,"Ranger"))],run:c=>{const h=c.t[0];if(h&&h.ex){h.ex=false;log(c,`${h.name} readies.`)}}}]));
OPS.setTrap=(s,pid,pr,picks)=>{const pl=s.p[pid];picks.forEach(u=>{const i=pl.hand.findIndex(x=>x.uid===u);if(i>=0){const c=pl.hand.splice(i,1)[0];pl.inv.push(Object.assign({kind:"card",fd:true,name:E.DB[c.id].name},c));E.log(s,`${pl.name} sets a Trap face down.`,pid)}})};
/* Rogue */
def("Hack and Slash",{run(c){if(daggers(c.actor,c.s).length>=2){c.actor.fl.hackRound=c.s.round;log(c,`${c.actor.name}'s next attack this turn hits two targets.`)}else log(c,`${c.actor.name} doesn't have two Daggers equipped.`)}});
hid("Miscalculation","card",(s,pid,tr)=>(tr.targets||[]).some(u=>s.p[pid].inv.some(o=>o.uid===u&&o.fd&&o.name==="Miscalculation")),c=>{c.mods.cancel=true;draw(c,2)});
hid("Pillage the Dead","dying",(s,pid,tr)=>{const f=E.find(s,tr.hero);return f&&f.pid!==pid&&E.eqList(f.o).length>0},c=>{c.s.pillage={pid:c.pid};log(c,"Pillage the Dead: you'll take that Hero's equipment.")});
def("Shadow Strike",{t:[rogueEx,t("enemy","attack target")],can:(s,pid)=>s.p[pid].heroes.some(h=>!h.dead&&h.ex&&E.heroIs(h,"Rogue")),run(c){const r=c.t[0],tg=c.t[1];if(r&&tg)attack(c,r,tg,{ignoreDef:true,noExhaust:true})}});
/* Hero abilities */
hab("Dr. Vonugutt",[{label:"Add another counter of a type on a Hero",t:[HERO],run:c=>{const h=c.t[0];if(!h)return;const o=[];E.STATUS.forEach(k=>{if(h.st[k]>0)o.push({label:E.STATUS_NAME[k],v:k})});
    if(h.plus>0)o.push({label:"Meditation",v:"plus"});if(h.fat)o.push({label:"Fatigue",v:"fat"});if(h.lvl>0&&h.lvl<6)o.push({label:"Level",v:"lvl"});
    if(!o.length){log(c,`${h.name} has no counters.`);return}E.ask(c.s,c.pid,`Dr. Vonugutt: add another counter to ${h.name}`,o,"vonu",{h:h.uid,name:"Dr. Vonugutt"})}},
  {label:"Double the status counters on a Hero",lvl:3,t:[HERO],run:c=>{const h=c.t[0];if(!h)return;E.STATUS.forEach(k=>{if(h.st[k]>0)E.addStatus(c.s,h,k,h.st[k])})}}]);
A.vonu=(s,pid,pr,v)=>{const h=E.heroByUid(s,pr.data.h);if(!h||h.dead)return;if(v==="plus"){h.plus++;E.log(s,`${h.name} gets another meditation counter.`,pid)}else if(v==="fat"){h.fat=(h.fat||0)+1;E.log(s,`${h.name} gets another Fatigue counter.`,pid)}else if(v==="lvl")E.levelUp(s,h,"str");else E.addStatus(s,h,v,1)};
/* Echo Performer: restored to its activated ability (Nov 12, 2026; the brief passive version was meant for Songweaver) */
hab("Echo Performer",[{label:"Play a Bard Tactic or Song, then duplicate it",cost:2,can:(s,pid,a)=>s.p[pid].hand.some(x=>{const d=E.DB[x.id];return d&&d.cls==="Bard"&&/Tactic|Song/.test(d.type)&&E.cardCost(s,pid,a,d,0)+2<=s.p[pid].aura}),
  run:c=>{c.s.bonus={pid:c.pid,uid:c.actor.uid,n:2,only:"bard",dup:true,allowEx:true};log(c,`${c.actor.name} may now play a Bard Tactic or Song (paying its Aura cost); it will be duplicated.`)}}]);
hab("Hexcaster",[{label:"Lose 2 HP: opponents can't use Consumable items this turn",can:(s,pid,a)=>E.hp(s,a)>2,run:c=>{E.costHp(c.s,c.pid,c.actor,2,"Hexcaster");c.op.fl.noConsum=c.s.round;log(c,`${c.op.name} can't use Consumable items this turn.`)}}]);
/* Equipment with a colon ability (uses the Hero's action) */
const EQ2=root.CQ_EQACT=root.CQ_EQACT||{};
EQ2["Shillelagh"]={label:"Exhaust a summon: +1 STR this turn",t:[t("allySummon","ready summon to exhaust",(s,o)=>!o.ex)],can:(s,pid)=>s.p[pid].bf.some(o=>o.kind==="summon"&&!o.ex),run:c=>{const sm=c.t[0];if(!sm||sm.ex)return;sm.ex=true;buff(c.actor,{str:1});log(c,`${sm.name} is exhausted; ${c.actor.name} gains +1 STR this turn.`)}};
EQ2["Helm of Aura"]={label:"Sacrifice: gain Aura (2 if upgraded)",run:c=>{const n=E.isUp(c.s,c.inst)?2:1;destroy(c,c.inst);c.me.aura+=n;log(c,`${c.me.name} gains ${n} Aura.`)}};
OPS.bottom=(s,pid,pr,picks)=>{const pl=s.p[pid];picks.forEach(u=>{const i=pl.lib.findIndex(c=>c.uid===u);if(i>=0){const c=pl.lib.splice(i,1)[0];pl.lib.unshift(c);E.log(s,`${pl.name} puts the card on the bottom of their library.`,pid)}})};
OPS.discard=(s,pid,pr,picks)=>{const pl=s.p[pid];picks.forEach(u=>{const i=pl.hand.findIndex(c=>c.uid===u);if(i>=0){const c=pl.hand.splice(i,1)[0];pl.disc.push(c);E.log(s,`${pl.name} discards ${E.DB[c.id].name}.`,pid)}})};
OPS.opDiscard=(s,pid,pr,picks)=>{const pl=s.p[pr.target];picks.forEach(u=>{const i=pl.hand.findIndex(c=>c.uid===u);if(i>=0){const c=pl.hand.splice(i,1)[0];pl.disc.push(c);E.log(s,`${pl.name} discards ${E.DB[c.id].name}.`,pid)}})};
OPS.tutor=(s,pid,pr,picks)=>{const pl=s.p[pid];picks.forEach(u=>{const i=pl.lib.findIndex(c=>c.uid===u);if(i>=0){const c=pl.lib.splice(i,1)[0];pl.hand.push(c);E.log(s,`${pl.name} searches for ${E.DB[c.id].name}.`,pid)}});E.shuffle(s,pl.lib)};
OPS.equipFree=(s,pid,pr,picks)=>{const pl=s.p[pid];const h=E.heroByUid(s,pr.hero);if(!h||h.dead)return;picks.forEach(u=>{let i=pl.hand.findIndex(c=>c.uid===u);let o=null;
  if(i>=0){o=E.eqObjFromCard(s,pid,pl.hand.splice(i,1)[0])}else{i=pl.inv.findIndex(x=>x.uid===u);if(i>=0)o=pl.inv.splice(i,1)[0]}
  if(o){E.log(s,`${h.name} equips ${o.name} for free.`,pid);E.equipTo(s,h,o)}})};
OPS.fromDisc=(s,pid,pr,picks)=>{const pl=s.p[pid];picks.forEach(u=>{const i=pl.disc.findIndex(c=>c.uid===u);if(i>=0){const c=pl.disc.splice(i,1)[0];pl.hand.push(c);E.log(s,`${pl.name} returns ${E.DB[c.id].name} to hand.`,pid)}})};

/* ===== Set 2: Artificer (Set Two Rules Supplement) ===== */
/* Metals: generic items; each has its own use (Exile). Artificers also use them as ingredients. */
def("Copper Ingot",item(0,[],c=>{c.me.aura+=1;log(c,`${c.me.name} gains 1 Aura.`)},{exile:true}));
def("Iron Ingot",item(0,[AL],c=>{if(c.t[0]){buff(c.t[0],{def:2});log(c,`${c.t[0].name} gains +2 Defense until Dusk.`)}},{exile:true}));
def("Silver Ingot",item(0,[SUM],c=>D(c,c.t[0],3),{exile:true}));
def("Platinum Ingot",item(0,[],c=>{c.me.gold+=3;log(c,`${c.me.name} gains 3 Gold.`)},{exile:true}));
def("Mithril Ingot",item(0,[],c=>draw(c,2),{exile:true}));
/* Quicksilver: no effect of its own; Craft can use it as any ingredient (E.craftPlan) */
S["Quicksilver"]={};
/* Recipes: the ingredients were paid when the card was played (E.payCraft). Resolving flips it: Constructs enter play (the Recipe goes to the discard pile);
   a made item or weapon goes into your inventory. "Exhaust this Hero" unless an upgraded Toolbelt is equipped. */
const recipe=n=>def(n,{run(c){const keep=E.flipRecipe(c.s,c.pid,c.inst);
  if(c.actor&&!c.actor.dead){if(E.hasUp(c.s,c.actor,"Toolbelt"))log(c,`Upgraded Toolbelt: ${c.actor.name} isn't exhausted.`);else exMe(c)}
  return keep?"stay":undefined}});
Object.keys(E.RECIPES||{}).forEach(recipe);
/* made items */
def("Blast Charge",item(0,[EN],c=>D(c,c.t[0],3),{sac:true,ex:true}));
def("Reclamation Kit",item(0,[],c=>{const ms=c.me.disc.filter(x=>(E.DB[x.id]||{}).sub==="Metal");if(!ms.length){log(c,"Reclamation Kit: no Metal in your discard pile.");return}
  E.pushChoose(c.s,c.pid,{title:"Reclamation Kit: return a Metal to an empty inventory slot",cards:ms.map(x=>x.uid),min:1,max:1,op:"discToInv"})},{sac:true,can:(s,pid)=>s.p[pid].disc.some(x=>(E.DB[x.id]||{}).sub==="Metal")}));
OPS.discToInv=OPS.discToInv||((s,pid,pr,picks)=>{const pl=s.p[pid];picks.forEach(u=>{const i=pl.disc.findIndex(x=>x.uid===u);if(i<0)return;if(pl.inv.length>=E.slots(s,pid)){E.log(s,"There's no empty inventory slot.",pid);return}
  const x=pl.disc.splice(i,1)[0];pl.inv.push(E.invObj(s,pid,x));E.log(s,`${E.DB[x.id].name} returns to ${pl.name}'s inventory.`,pid)})});
S["Pocket Watch"]={}; /* answered from the response window (E.canStall) */
/* Heroes */
hab("Artificer A",[{label:"Look at the top 3 (a Metal to inventory)",can:(s,pid)=>s.p[pid].lib.length>0,run(c){const top=c.me.lib.slice(-3);
  const room=c.me.inv.length<E.slots(c.s,c.pid);const ms=top.filter(x=>(E.DB[x.id]||{}).sub==="Metal");
  log(c,`Artificer A: ${c.me.name} looks at the top ${top.length} card${top.length===1?"":"s"} of their library.`);
  if(ms.length&&room)E.pushChoose(c.s,c.pid,{title:"Artificer A: put a Metal from among them into an empty inventory slot? The rest go on the bottom of your library.",cards:ms.map(x=>x.uid),min:0,max:1,op:"reload",look:top.map(x=>x.uid)});
  else{log(c,ms.length?"Artificer A: there's a Metal, but the inventory is full.":"Artificer A: no Metal among them.");OPS.reload(c.s,c.pid,{look:top.map(x=>x.uid)},[])}}}]);

/* ===== Set 2: Necromancer (Set Two Rules Supplement) =====
   Revenant: 1/1 summon token with Impervious (engine: damage and destroy do nothing; HP loss, sacrifice and exile work). Cards that summon one say "Exhaust this Hero".
   Mourn (engine cardCost), Exhume (engine battle options: play from your discard pile a card milled this turn), Mill (E.mill marks the cards for Exhume).
   "If you played this card from your discard pile" = c.fromDisc (any play from the discard pile: Exhume, Necromancer A, Funeral Procession, Gravedigger's Medallion). */
const REV=t("allySummon","your Revenant",(s,o)=>o.name==="Revenant");
const revs=c=>E.revenants(c.s,c.pid);
const raise=(c,n)=>{for(let i=0;i<n;i++)summon(c,"Revenant")};
/* sacrifice n Revenants as a cost (exhausted ones first) */
const sacRevs=(c,n)=>{const l=revs(c).slice().sort((a,b)=>(b.ex?1:0)-(a.ex?1:0)).slice(0,n);if(l.length)log(c,`${c.me.name} sacrifices ${l.length} Revenant${l.length>1?"s":""} (additional cost).`);l.forEach(o=>E.sacrifice(c.s,o));return l.length};
const needRevs=n=>(s,pid)=>E.revenants(s,pid).length>=n;
const millMark=(c,pid,cards)=>{const pl=c.s.p[pid];cards.forEach(x=>{const i=pl.lib.indexOf(x);if(i>=0){pl.lib.splice(i,1);pl.disc.push(x);E.markMilled(c.s,pid,x)}})};
def("Raise Revenant",{run(c){raise(c,1);exMe(c)}});
def("Restless Dead",{run(c){raise(c,2);exMe(c)}});
def("Grave Whispers",{run(c){draw(c,1);raise(c,1);exMe(c)}});
def("Rise from the Grave",{run(c){raise(c,c.fromDisc?3:2);if(c.fromDisc)log(c,"Played from the discard pile: three Revenants.");exMe(c)}});
def("Grave Tide",{can:needRevs(3),payCost:c=>sacRevs(c,3),run(c){raise(c,5);exMe(c)}});
def("From Darkness",{can:needRevs(4),payCost:c=>sacRevs(c,4),run(c){const o=summon(c,"Abomination",true);o.stealth=true;log(c,"The Abomination enters with Stealth and ready.")}});
def("Devastating Ritual",{x:{max:(s,pid)=>E.revenants(s,pid).length,step:1},payCost:c=>{c.me.t.ritualSac=sacRevs(c,c.x||0)},run(c){const n=Math.min(c.x||0,c.me.t.ritualSac||0);c.me.t.ritualSac=0;c.me.aura+=n;log(c,`${c.me.name} gains ${n} Aura.`)}});
def("Corpse Harvest",{can:needRevs(1),payCost:c=>sacRevs(c,1),run(c){draw(c,2)}});
def("Bone Wall",{run(c){const n=revs(c).length;if(c.actor&&n){buff(c.actor,{def:n});log(c,`${c.actor.name} gains +${n} Defense this turn.`)}else log(c,"Bone Wall: you control no Revenants.")}});
def("Army of Darkness",{t:[t("enemy","target enemy")],run(c){const tg=c.t[0];const rd=revs(c).filter(o=>!o.ex&&!(o.st&&o.st.stun));
  if(!tg||!rd.length){log(c,"Army of Darkness: no ready Revenants.");return}
  attack(c,rd[0],tg,rd.length>1?{band:rd.slice(1).map(o=>o.uid)}:{})}});
def("Dead March",{t:[t("enemyPlayer","target opponent")],run(c){const p=c.t[0];const n=revs(c).length;if(!p)return;if(!n){log(c,"Dead March: you control no Revenants.");return}E.mill(c.s,p.pid,n)}});
def("Dig the Grave",{run(c){const top=c.me.lib.slice(-3);E.mill(c.s,c.pid,3);const sm=top.filter(x=>(E.DB[x.id]||{}).type==="Summon"&&c.me.disc.includes(x));
  if(sm.length)E.pushChoose(c.s,c.pid,{title:"Dig the Grave: you may put a milled Summon card into your hand",cards:sm.map(x=>x.uid),min:0,max:1,op:"fromDisc"})}});
def("Restless Echo",{run(c){E.mill(c.s,c.pid,2);if(c.fromDisc){c.me.aura+=1;log(c,`Played from the discard pile: ${c.me.name} gains 1 Aura.`)}}});
def("Robbed Grave",{run(c){draw(c,c.fromDisc?2:1)}});
def("Bone Spur",{t:[Object.assign({},REV,{opt:true})],run(c){if(c.fromDisc){revs(c).forEach(o=>buff(o,{str:1}));log(c,"Played from the discard pile: your Revenants gain +1 Strength this turn.");return}
  const o=c.t[0];if(o){buff(o,{str:1});log(c,`${o.name} gains +1 Strength this turn.`)}}});
def("Reawaken",{t:[t("allyHero","target Necromancer",(s,o)=>E.heroIs(o,"Necromancer"))],run(c){const h=c.t[0];if(h&&!h.dead){h.ex=false;E.medWake(c.s,h);log(c,`${h.name} readies.`)}}});
def("Grim Divination",{run(c){const top=c.me.lib.slice(-2).reverse();if(!top.length){log(c,"Grim Divination: the library is empty.");return}
  log(c,`Grim Divination reveals ${top.map(x=>E.DB[x.id].name).join(" and ")}.`);const op=E.opp(c.pid);
  E.ask(c.s,op,`Grim Divination (${c.me.name}): choose one`,[{label:`One revealed card of your choice goes to ${c.me.name}'s hand, the other to their discard pile`,v:1},{label:`Both go to ${c.me.name}'s discard pile, then ${c.me.name} draws a card`,v:2}],"grimMode",{owner:c.pid,cards:top.map(x=>x.uid),name:"Grim Divination"})}});
A.grimMode=(s,pid,pr,v)=>{const o=pr.data.owner;const pl=s.p[o];const cards=pr.data.cards.map(u=>pl.lib.find(x=>x.uid===u)).filter(Boolean);const c={s,pid:o};
  if(v===2||cards.length<2){if(v===1&&cards.length===1){const x=cards[0];pl.lib.splice(pl.lib.indexOf(x),1);pl.hand.push(x);E.log(s,`Grim Divination: ${E.DB[x.id].name} goes to ${pl.name}'s hand.`,o);return}
    millMark(c,o,cards);E.log(s,`Grim Divination: ${cards.map(x=>E.DB[x.id].name).join(" and ")} go to ${pl.name}'s discard pile.`,o);E.draw(s,o,1);return}
  const by=cards.slice().sort((a,b)=>(parseInt(E.DB[a.id].cost,10)||0)-(parseInt(E.DB[b.id].cost,10)||0));
  E.ask(s,pid,`Grim Divination: which card goes to ${pl.name}'s hand? (the other goes to their discard pile)`,by.map(x=>({label:E.DB[x.id].name,v:x.uid})),"grimPick",{owner:o,cards:pr.data.cards,name:"Grim Divination"})};
A.grimPick=(s,pid,pr,v)=>{const o=pr.data.owner;const pl=s.p[o];pr.data.cards.forEach(u=>{const x=pl.lib.find(y=>y.uid===u);if(!x)return;
  if(u===v){pl.lib.splice(pl.lib.indexOf(x),1);pl.hand.push(x);E.log(s,`Grim Divination: ${E.DB[x.id].name} goes to ${pl.name}'s hand.`,o)}
  else{millMark({s},o,[x]);E.log(s,`Grim Divination: ${E.DB[x.id].name} goes to ${pl.name}'s discard pile.`,o)}})};
/* Mourn cards (the engine waives the Aura cost once a soul has been surrendered) */
def("Funeral Procession",{run(c){const sm=c.me.disc.filter(x=>(E.DB[x.id]||{}).type==="Summon"&&c.actor&&E.canPlayCard(c.s,c.pid,c.actor,x,true));
  if(!sm.length){log(c,"Funeral Procession: no Summon card in your discard pile that this Hero can play.");return}
  c.s.pend.unshift({type:"combo",pid:c.pid,actor:c.actor.uid,cands:sm.map(x=>x.uid),free:true,fromDisc:true,exileAfter:true,title:"Funeral Procession: play a Summon card from your discard pile without paying its Aura cost (it's exiled after it resolves)"})}});
def("Grieving Thoughts",{run(c){draw(c,1);if(c.me.hand.length)E.pushChoose(c.s,c.pid,{title:"Grieving Thoughts: discard a card",cards:c.me.hand.map(x=>x.uid),from:"hand",min:1,max:1,op:"discard"})}});
def("Mourner's Offering",{run(c){c.me.aura+=2;log(c,`${c.me.name} gains 2 Aura.`)}});
/* items */
S["Ossuary"]={}; /* engine strOf */
S["Cursed Urn"]={}; /* engine destroyObj */
S["Soul Lantern"]={}; /* engine doDawn */
def("Skeleton Key",item(0,[],c=>{c.me.fl.freeTown=true;log(c,`Skeleton Key: ${c.me.name}'s next Town action costs no Gold.`)},{exile:true}));
S["Remains"]={act:{free:true,anyClass:true,cost:0,run(c){const pl=c.me;const o=c.inst;const i=pl.inv.indexOf(o);if(i>=0)pl.inv.splice(i,1);
  pl.t.sAura=(pl.t.sAura||0)+1;log(c,`${pl.name} sacrifices Remains: +1 Aura, only for Summon cards (${pl.t.sAura} this turn).`)}}};
/* Generic Set 2 cards */
def("Consecrate",{run(c){const all=[...c.me.bf,...c.op.bf].filter(o=>o.kind==="summon");if(!all.length){log(c,"Consecrate: there are no summons.");return}all.forEach(o=>E.loseHp(c.s,o,1,"Consecrate"))}});
def("Retrace the Past",{t:[t("player","target player")],run(c){const p=c.t[0];if(!p)return;const pl=c.s.p[p.pid];
  if(!pl.disc.length){log(c,`${pl.name}'s discard pile is empty.`);E.draw(c.s,p.pid,1);return}
  E.pushChoose(c.s,c.pid,{title:`Retrace the Past: shuffle up to 3 cards from ${pl.name}'s discard pile into their library`,cards:pl.disc.map(x=>x.uid),min:0,max:3,op:"retrace",target:p.pid})}});
OPS.retrace=(s,pid,pr,picks)=>{const pl=s.p[pr.target];const nm=[];picks.forEach(u=>{const i=pl.disc.findIndex(x=>x.uid===u);if(i>=0){const x=pl.disc.splice(i,1)[0];pl.lib.push(x);nm.push(E.DB[x.id].name)}});
  if(nm.length){E.shuffle(s,pl.lib);E.log(s,`Retrace the Past: ${nm.join(", ")} shuffled into ${pl.name}'s library.`,pid)}E.draw(s,pr.target,1)};
/* equipment (enter = played; onUpgrade = upgraded at the Blacksmith) */
const discPlay=(c,h,title)=>{if(!h||h.dead)return;const l=c.me.disc.filter(x=>E.canPlayCard(c.s,c.pid,h,x,true));if(!l.length){log(c,`${title}: no card in your discard pile that ${h.name} can play.`);return}
  c.s.pend.unshift({type:"combo",pid:c.pid,actor:h.uid,cands:l.map(x=>x.uid),pay:true,fromDisc:true,title:`${title}: you may play a card from your discard pile, paying its Aura cost`})};
def("Grave Caller's Wand",{enter(c){raise(c,1);if(c.actor&&!c.actor.dead){c.actor.ex=true;log(c,`${c.actor.name} is exhausted (Grave Caller's Wand).`)}},onUpgrade(c){raise(c,1)}});
def("Gravedigger's Medallion",{enter(c){discPlay(c,c.actor,"Gravedigger's Medallion")},onUpgrade(c){discPlay(c,c.actor,"Upgraded Gravedigger's Medallion")}});
S["Dagger of the Dead"]={}; /* engine strOf */
/* Heroes */
hab("Necromancer A",[{label:"Play a Summon from your discard pile",can:(s,pid,a)=>s.p[pid].disc.some(x=>(E.DB[x.id]||{}).type==="Summon"&&E.canPlayCard(s,pid,a,x)),
  run(c){const l=c.me.disc.filter(x=>(E.DB[x.id]||{}).type==="Summon"&&E.canPlayCard(c.s,c.pid,c.actor,x));if(!l.length){log(c,"No Summon card to play.");return}
  c.s.pend.unshift({type:"combo",pid:c.pid,actor:c.actor.uid,cands:l.map(x=>x.uid),pay:true,fromDisc:true,title:"Necromancer A: you may play a Summon card from your discard pile, paying its Aura cost"})}}]);
hab("Necromancer C",[{label:"Exhaust a Revenant: +1 STR, exile a card from a discard pile",ex:false,t:[t("allySummon","ready Revenant to exhaust",(s,o)=>o.name==="Revenant"&&!o.ex)],
  can:(s,pid,a)=>E.revenants(s,pid).some(o=>!o.ex)&&(a.lvl>=3||a.fl.necroC!==s.round),
  run(c){const r=c.t[0];if(!r||r.ex)return;r.ex=true;c.actor.fl.necroC=c.s.round;buff(c.actor,{str:1});log(c,`${r.name} is exhausted; ${c.actor.name} gains +1 Strength this turn.`);
    const all=[...c.op.disc,...c.me.disc];if(all.length)E.pushChoose(c.s,c.pid,{title:"Necromancer C: you may exile a card from a discard pile",cards:all.map(x=>x.uid),min:0,max:1,op:"exileDisc"})}}]);
OPS.exileDisc=(s,pid,pr,picks)=>{picks.forEach(u=>{for(const pl of s.p){const i=pl.disc.findIndex(x=>x.uid===u);if(i>=0){const x=pl.disc.splice(i,1)[0];pl.exile.push(x);E.log(s,`Necromancer C exiles ${E.DB[x.id].name} from ${pl.name}'s discard pile.`,pid);return}}})};
})(typeof window!=="undefined"?window:globalThis);
