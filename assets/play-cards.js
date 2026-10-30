/* Crystal Quest card scripts for the Play tab. Each entry automates one card; anything missing here
   resolves by hand through the manual panel. ctx (c): {s,pid,me,op,actor,def,t:[targets],x,modes,comboed,mods,trig,E} */
"use strict";
(function(root){
const E=root.CQE;const S={},H={},OPS={};root.CQ_SCRIPTS=S;root.CQ_HERO_SCRIPTS=H;root.CQ_CHOOSE_OPS=OPS;
const t=(k,label,f,extra)=>Object.assign({k,label,f},extra||{});
const ANY=t("any"),EN=t("enemy"),AL=t("ally"),HERO=t("hero","target Hero"),EHERO=t("enemyHero"),AHERO=t("allyHero","target ally Hero"),SUM=t("summon"),ITEM=t("item"),EQ=t("equip","equipment"),PIL=t("pillar");
const cls=c=>t("allyHero","target "+c,(s,o)=>E.heroIs(o,c));
const log=(c,m)=>E.log(c.s,m,c.pid);
const living=pl=>pl.heroes.filter(h=>!h.dead);
const summons=pl=>pl.bf.filter(o=>o.kind==="summon");
const enemies=c=>[...living(c.op),...summons(c.op)];
const allies=c=>[...living(c.me),...summons(c.me)];
function D(c,tg,n,o){o=o||{};if(!tg||tg.kind==="player")return 0;
  if(c.mods&&c.mods.preventAll){log(c,`Damage to ${tg.name} is prevented.`);return 0}
  if(c.mods&&c.mods.prevent&&c.mods.prevent.includes(tg.uid)){log(c,`Damage to ${tg.name} is prevented.`);return 0}
  let a=n;if(c.def&&c.def.type==="Spell"&&!o.noSpell)a+=E.spellDmg(c.s,c.pid,c.actor);
  if(c.def&&c.def.sub==="Combo"&&c.actor&&E.hasEq(c.actor,"Iron Hand Wraps"))a+=1;
  if(c.arrowBonus){a+=c.arrowBonus.dmg;if(c.arrowBonus.ignoreDef)o.ignoreDef=true;o.pierce=(o.pierce||0)+c.arrowBonus.pierce}
  if(c.def&&c.def.sub==="Combo"&&c.me.fl.stunner){c.me.fl.stunner=false;E.addStatus(c.s,tg,"stun",1)}
  return E.damage(c.s,c.actor||{name:c.def.name},tg,a,Object.assign({card:true},o))}
const heal=(c,tg,n)=>tg?E.heal(c.s,c.actor,tg,n,c.pid):0;
const st=(c,tg,k,n)=>{if(tg&&tg.st)E.addStatus(c.s,tg,k,n||1)};
const buff=(tg,m)=>{if(tg&&tg.mods)E.addMod(tg,m)};
const draw=(c,n)=>E.draw(c.s,c.pid,n);
const scry=(c,n,then)=>E.pushScry(c.s,c.pid,n,then);
const exMe=c=>{if(c.actor)c.actor.ex=true};
const summon=(c,name,ready)=>E.makeSummon(c.s,c.pid,name,ready);
const pillar=(c,name,n)=>{for(let i=0;i<(n||1);i++)E.makePillar(c.s,c.pid,name)};
const str=(c,o,vs)=>E.str(c.s,o,vs),dfn=(c,o)=>E.defn(c.s,o);
const hp=(c,o)=>E.hp(c.s,o);
const attack=(c,att,tg,o)=>{if(att&&tg)c.s.qatk={pid:c.pid,att:att.uid,tgt:tg.uid,o:o||{}}};
const rand=(c,arr)=>arr.length?arr[E.ri(c.s,arr.length)]:null;
const daggers=h=>E.eqList(h).filter(e=>/Dagger/.test(e.name));
const combosPlayed=c=>c.me.t.combos||0;
const destroy=(c,o,ex)=>{if(o)E.destroyObj(c.s,o,ex)};
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
def("Chain Lightning",allDmg(4,{type:"Lightning",pil:"Spell Damage Pillar",ex:1}));
def("Flame Wave",allDmg(3,{type:"Fire",l6:5,ex:1}));
def("Pop Rocks",allDmg(1,{times:3,ex:1}));
def("Hail",{t:[t("enemyPlayer","target party")],run(c){const p=c.t[0];if(!p)return;living(c.s.p[p.pid]).forEach(h=>D(c,h,2,{type:"Ice"}))}});
def("Storm of Insight",{run(c){let tot=0;enemies(c).forEach(e=>tot+=D(c,e,3,{type:"Lightning"}));exMe(c);if(tot)scry(c,tot)}});
def("Heat Wave",{t:[ANY],run(c){const was=c.t[0]&&c.t[0].st&&c.t[0].st.burn>0;st(c,c.t[0],"burn");if(was)st(c,c.t[0],"burn")}});
def("Ice Ray",{t:[ANY],run(c){const was=c.t[0]&&c.t[0].st&&c.t[0].st.stun>0;st(c,c.t[0],"stun");if(was)st(c,c.t[0],"stun")}});
def("Sleep",{t:[HERO],run(c){if(c.t[0]){c.t[0].ex=true;log(c,`${c.t[0].name} is exhausted.`)}}});
def("Arcane Study",{run(c){draw(c,1);scry(c,2)}});
def("Boost Ritual",{run(c){pillar(c,"Spell Damage Pillar");exMe(c)}});
def("Ritual of Power",{run(c){pillar(c,"Spell Damage Pillar",3);exMe(c)}});
def("Levitate",{t:[HERO],x:{label:"New position (0 Lead, 1 Center, 2 Closer)",max:()=>2,free:true},run(c){const h=c.t[0];if(!h)return;const pl=c.s.p[h.owner];pl.heroes.splice(pl.heroes.indexOf(h),1);pl.heroes.splice(Math.min(2,c.x||0),0,h);log(c,`${h.name} moves to ${E.POS[pl.heroes.indexOf(h)]}.`)}});
/* ===== Warlock ===== */
def("Dark Jab",dmgCard(3,{type:"Dark",st:"confuse"}));def("Dark Lance",dmgCard(5,{type:"Dark",st:"confuse"}));
def("Night Terror",allDmg(4,{type:"Dark",st:"confuse",ex:1}));
def("Siphon Life",{t:[t("any","damage target")],run(c){const d=D(c,c.t[0],2,{type:"Dark"});heal(c,c.actor,d)}});
def("Dark Arts",{t:[EN],x:{label:"HP to lose (up to 6)",max:(s,pid,a)=>Math.min(6,a?E.hp(s,a)-1:6),free:true},run(c){const n=Math.min(6,c.x||0);if(n<=0)return;E.loseHp(c.s,c.actor,n,"Dark Arts");if(c.t[0])E.loseHp(c.s,c.t[0],n,"Dark Arts")}});
def("Blood Offering",{run(c){E.loseHp(c.s,c.actor,3,"Blood Offering");c.me.aura+=2;log(c,`${c.me.name} gains 2 Aura.`)}});
def("Disorient",{t:[ANY],run(c){st(c,c.t[0],"confuse")}});
def("Frailty",{t:[HERO],run(c){buff(c.t[0],{zeroDef:1});log(c,`${c.t[0].name}'s DEF is 0 until Dusk.`)}});
def("Arrested Development",{t:[HERO],run(c){if(c.t[0])c.t[0].fl.noLevel=c.s.round}});
def("Ritual of Pain",{run(c){pillar(c,"Pain Pillar");exMe(c)}});
def("Dark Insight",{run(c){draw(c,1);pillar(c,"Pain Pillar");exMe(c)}});
def("Splitting Ritual",{t:[t("allyPillar","your Pillar")],run(c){const p=c.t[0];if(!p)return;destroy(c,p);pillar(c,p.name,2);exMe(c)}});
def("Doubling Ritual",{run(c){const ps=c.me.bf.filter(o=>o.kind==="pillar");ps.forEach(p=>destroy(c,p));ps.forEach(p=>pillar(c,p.name,2));exMe(c)}});
def("Curse of Exhaustion",{t:[t("player","target party")],run(c){const p=c.t[0];if(p)living(c.s.p[p.pid]).forEach(h=>h.ex=true);log(c,`${p?p.name:"?"}'s party is exhausted.`);exMe(c)}});
def("Power Vacuum",{t:[t("enemyPlayer","target party")],run(c){const pl=c.op;const r=Math.min(pl.aura,c.x||0);pl.aura-=r;log(c,`${pl.name} loses ${r} Aura.`);exMe(c)}});
def("Bewilder",{t:[t("enemyPlayer","target player")],run(c){log(c,`${c.op.name} reveals their hand.`);E.pushChoose(c.s,c.pid,{title:"Bewilder: you may discard one card from their hand",cards:c.op.hand.map(x=>x.uid),min:0,max:1,op:"opDiscard",target:1-c.pid})}});
def("Brain Rot",{t:[t("enemyPlayer","target player")],run(c){log(c,`${c.op.name} reveals their hand.`);E.pushChoose(c.s,c.pid,{title:"Brain Rot: discard a Tactic or Spell",cards:c.op.hand.filter(x=>/Tactic|Spell/.test(E.DB[x.id].type)).map(x=>x.uid),min:1,max:1,op:"opDiscard",target:1-c.pid})}});
const curse=(name)=>def(name,{t:[HERO],run(c){const h=c.t[0];if(!h)return"stay";h.ench.push({uid:c.inst.uid,id:c.def.id,name:c.def.name,kind:"card",owner:c.pid,ctrl:c.pid,cardUid:c.inst.uid});log(c,`${c.def.name} is attached to ${h.name}.`);return"stay"}});
["Aura Leech","Blood Aura","Burden","Distract","Mark of Doom","Memory Loss","Weaken","Life Boost","Sanctuary"].forEach(curse);
/* ===== Cleric ===== */
def("Healing Beam",{t:[t("any","heal target")],run(c){heal(c,c.t[0],5)}});
def("Healing Touch",{t:[t("hero","Hero to heal")],run(c){heal(c,c.t[0],2)}});
def("Full Heal",{run(c){living(c.me).forEach(h=>heal(c,h,3))}});
def("All Play",{run(c){c.s.p.forEach(pl=>living(pl).forEach(h=>heal(c,h,2)));const f=c.actor&&c.actor.lvl>=3?5:2;living(c.me).forEach(h=>heal(c,h,f))}});
def("Light Blast",dmgCard(2,{type:"Light",pierce:2}));
def("Light Helix",{t:[t("hero","Hero to heal"),t("any","damage target")],run(c){heal(c,c.t[0],2);D(c,c.t[1],2,{type:"Light"})}});
def("Healing Blast",{t:[t("any","heal target"),t("any","damage target")],run(c){const x=c.x||0;heal(c,c.t[0],x);D(c,c.t[1],Math.ceil(x/2),{type:"Light"});exMe(c)}});
def("Carry Radiance",{t:[cls("Cleric")],run(c){buff(c.t[0],{lifelink:1})}});
def("Medical Visit",{t:[ANY],run(c){if(c.t[0])E.removeStatus(c.s,c.t[0],2)}});
def("Purify",{t:[AL],run(c){if(c.t[0]){E.removeStatus(c.s,c.t[0],1);heal(c,c.t[0],1)}}});
def("Resurrection",{t:[t("deadAlly","dead Hero")],can:(s,pid)=>s.p[pid].heroes.some(h=>h.dead&&!h.surr),run(c){const h=c.t[0];if(h){h.dead=false;h.dmg=Math.max(0,E.maxHp(c.s,h)-8);h.ex=true;log(c,`${h.name} is revived with ${E.hp(c.s,h)} HP.`)}exMe(c)}});
def("Wave of Life",{t:[t("any","heal target")],run(c){heal(c,c.t[0],3)}});
def("Righteous Rage",{run(c){buff(c.actor,{str:2,lifelink:1});const tg=enemies(c).filter(e=>!E.stealth(c.s,e)).sort((a,b)=>hp(c,b)-hp(c,a))[0];c.actor.ex=false;attack(c,c.actor,tg)}});
def("Withdrawal Ailments",{t:[ANY],run(c){let n=0;living(c.me).forEach(h=>E.STATUS.forEach(k=>{n+=h.st[k];h.st[k]=0}));log(c,`${n} status counters removed.`);D(c,c.t[0],n,{type:"Light"})}});
def("Healer's Choice",M(2,[{label:"Heal 2 HP",t:[ANY],run:c=>heal(c,c.t[0],2)},{label:"Remove 1 status counter",t:[ANY],run:c=>c.t[0]&&E.removeStatus(c.s,c.t[0],1)},{label:"Deal 2 Light damage",t:[ANY],run:c=>D(c,c.t[0],2,{type:"Light"})}]));
/* ===== Paladin ===== */
def("Power Thrust",dmgCard(5));
def("Shield Bash",{t:[ANY],run(c){D(c,c.t[0],dfn(c,c.actor))}});
def("Radiant Strike",{t:[ANY],run(c){const sw=E.eqList(c.actor).some(e=>/Sword/.test(e.name+" "+(E.DB[e.id]||{}).rules));D(c,c.t[0],5+(sw?3:0));exMe(c)}});
def("Divine Judgment",{run(c){const d=dfn(c,c.actor);enemies(c).forEach(e=>D(c,e,d));exMe(c)}});
def("Blockade",{t:[HERO],run(c){buff(c.t[0],{def:5})}});
def("Protect",{t:[HERO],run(c){if(c.t[0]){c.t[0].guard+=2;log(c,`${c.t[0].name} gains Guard 2.`)}}});
def("Extra Protection",{run(c){c.actor.guard+=1;log(c,`${c.actor.name} gains Guard 1.`)}});
def("Vigil",{run(c){exMe(c);c.actor.guard+=3;log(c,`${c.actor.name} gains Guard 3.`)}});
def("Pull Together",{run(c){living(c.me).forEach(h=>h.guard+=(c.x||0));log(c,`${c.me.name}'s party gains Guard ${c.x||0}.`);exMe(c)}});
def("Conscript",summonCard("Soldier"));
def("Rally the Troops",{run(c){summon(c,"Soldier");summon(c,"Soldier");exMe(c)}});
def("Coordinated Attack",{run(c){c.me.pm.soldier=(c.me.pm.soldier||0)+2;log(c,"Soldiers gain +2 STR this turn.");exMe(c)}});
def("Wild Defense",{run(c){summons(c.me).forEach(o=>buff(o,{def:1}))}});
def("Divine Smite",{t:[t("summon","non-Legendary summon")],run(c){destroy(c,c.t[0])}});
def("Unburden",{run(c){const d=dfn(c,c.actor);buff(c.actor,{str:d,zeroDef:1});log(c,`${c.actor.name} trades ${d} DEF for STR.`)}});
def("Charged Barrage",{run(c){exMe(c);buff(c.actor,{def:4});c.actor.fl.chargedRound=c.s.round;c.actor.fl.chargedHit=null}});
def("Noble Promotion",{run(c){c.me.fl.promoRound=c.s.round;log(c,`${c.me.name} will gain initiative at Dusk.`)}});
def("To the Armory",{run(c){E.pushChoose(c.s,c.pid,{title:"To the Armory: choose an Equipment",cards:c.me.lib.filter(x=>E.DB[x.id].kind==="equip").map(x=>x.uid),min:1,max:1,op:"tutor"})}});
def("Take a Stand",{run(c){draw(c,dfn(c,c.actor));c.actor.fl.standRound=c.s.round}});
def("Noble Choice",M(2,[{label:"Summon a 2/2 Soldier",run:c=>{summon(c,"Soldier");exMe(c)}},{label:"Target Hero gains Guard 2",t:[HERO],run:c=>{if(c.t[0]){c.t[0].guard+=2;log(c,`${c.t[0].name} gains Guard 2.`)}}},{label:"Draw a card",run:c=>draw(c,1)}]));
/* ===== Barbarian ===== */
def("Pump",{t:[cls("Barbarian")],run(c){buff(c.t[0],{str:3})}});
def("Blunt Force",{t:[cls("Barbarian")],run(c){buff(c.t[0],{str:5})}});
def("Blood Frenzy",{t:[cls("Barbarian")],run(c){if(!c.t[0])return;E.loseHp(c.s,c.t[0],4,"Blood Frenzy");buff(c.t[0],{str:2})}});
def("Bind",{t:[t("hero","Hero to exhaust (Level 3)",null,{opt:true})],run(c){buff(c.actor,{str:1});const h=c.t[0];if(c.actor.lvl>=3&&h&&dfn(c,h)<str(c,c.actor)){h.ex=true;log(c,`${h.name} is exhausted.`)}}});
def("Battered",{t:[HERO],run(c){D(c,c.t[0],str(c,c.actor,c.t[0]));if(c.me.disc.some(x=>x.id==="Bruised"))st(c,c.t[0],"wound")}});
def("Pummel",{t:[HERO],run(c){const n=living(c.me).filter(h=>h.cls==="Barbarian").length;D(c,c.t[0],str(c,c.actor,c.t[0])*n)}});
def("Awestruck",{t:[t("any","Hero or summon with less STR",(s,o,x)=>x.actor&&E.str(s,o)<E.str(s,x.actor))],run(c){const was=c.t[0]&&c.t[0].st&&c.t[0].st.stun>0;st(c,c.t[0],"stun");if(was)st(c,c.t[0],"stun")}});
def("Bloodthirst",{t:[EN],run(c){c.actor.ex=false;attack(c,c.actor,c.t[0],{after:"readyIfKill"})}});
def("Unstoppable",{t:[EN],run(c){attack(c,c.actor,c.t[0],{ignoreDef:true,noHidden:true})}});
def("Beat Down",{run(c){buff(c.actor,{str:2});const tg=rand(c,enemies(c).filter(e=>!E.stealth(c.s,e)));attack(c,c.actor,tg,{after:"exhaustTarget"})}});
def("On the Job Training",{run(c){const tg=rand(c,living(c.op).filter(e=>!E.stealth(c.s,e)));attack(c,c.actor,tg,{after:"levelIfDmg"})}});
def("Bruised",{run(c){c.actor.fl.bruisedRound=c.s.round}});
def("Run It Back",{run(c){c.actor.fl.runBackRound=c.s.round;c.actor.fl.runBackUsed=false}});
def("Second Wind",{t:[t("allyHero","Enraged Barbarian",(s,o)=>o.cls==="Barbarian"&&E.enraged(s,o))],run(c){heal(c,c.t[0],3);if(c.t[0]){c.t[0].ex=false;log(c,`${c.t[0].name} readies.`)}}});
def("War Chant",{run(c){const bs=living(c.me).filter(h=>h.cls==="Barbarian"&&h.lvl>=1);c.me.aura+=bs.length;bs.forEach(h=>h.fl.noAuraRound=c.s.round+1);log(c,`${c.me.name} gains ${bs.length} Aura.`)}});
def("Campfire",{enter(c){c.inst.ctr={camp:3}}});
def("Lose Control",{t:[cls("Barbarian")],run(c){if(c.t[0])c.t[0].fl.loseCtrlRound=c.s.round}});
/* ===== Rogue ===== */
def("Surprise Attack",{t:[ANY],run(c){D(c,c.t[0],str(c,c.actor,c.t[0]),{ignoreDef:true})}});
def("Toxic Cloud",{run(c){enemies(c).forEach(e=>st(c,e,"poison",e.st.poison>0?2:1))}});
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
def("Broken Blade",{can:(s,pid,a)=>a&&E.eqList(a).some(e=>/Dagger/.test(e.name)),run(c){const d=daggers(c.actor)[0];if(d){destroy(c,d);c.actor.fl.twiceRound=c.s.round;c.actor.fl.twiceUsed=false}}});
def("Flick Dagger",{can:(s,pid,a)=>a&&E.eqList(a).some(e=>/Dagger/.test(e.name)),run(c){const d=daggers(c.actor)[0];if(!d)return;destroy(c,d);const n=str(c,c.actor);enemies(c).forEach(e=>D(c,e,n))}});
def("Death by a Thousand Cuts",{t:[ANY],run(c){let n=0;enemies(c).forEach(e=>n+=e.st.poison);living(c.me).filter(h=>h.cls==="Rogue").forEach(h=>n+=daggers(h).length);D(c,c.t[0],n);exMe(c)}});
def("Cut Off",{t:[EHERO],run(c){const h=c.t[0];if(!h)return;const pl=c.s.p[h.owner];pl.heroes.splice(pl.heroes.indexOf(h),1);pl.heroes.push(h);log(c,`${h.name} is moved to the Closer position.`);attack(c,c.actor,h)}});
def("Synchronous Strike",{t:[ANY],run(c){const rs=living(c.me).filter(h=>h.cls==="Rogue");let n=0;rs.forEach(h=>{n+=str(c,h);h.ex=true});D(c,c.t[0],n)}});
def("Larceny",{t:[t("item","enemy item",(s,o,x)=>E.ctrl(s,o)!==x.actor.owner)],run(c){steal(c,c.t[0])}});
def("Petty Theft",{t:[t("item","enemy Consumable",(s,o,x)=>E.ctrl(s,o)!==x.actor.owner&&(E.DB[o.id]||{}).sub==="Consumable")],run(c){steal(c,c.t[0])}});
function steal(c,o){if(!o)return;const f=E.find(c.s,o.uid);if(!f||f.zone!=="inv")return;const from=c.s.p[f.pid];from.inv.splice(from.inv.indexOf(o),1);o.ctrl=c.pid;E.toInv(c.s,c.pid,o);log(c,`${c.me.name} gains control of ${o.name}.`)}
/* ===== Monk ===== */
def("Jab",dmgCard(2,{pierce:1}));def("Lunge",dmgCard(1));def("Roundhouse",dmgCard(3,{pierce:1}));
def("Ascend",{t:[HERO],run(c){buff(c.t[0],{str:2})}});
def("Breath",{run(c){scry(c,1)}});
def("Flurry of Blows",{t:[ANY],run(c){D(c,c.t[0],2,{pierce:1});D(c,c.t[0],2,{pierce:1})}});
def("Lotus Jab",{t:[ANY],run(c){D(c,c.t[0],2);if(c.comboed){c.me.aura+=1;log(c,`${c.me.name} gains 1 Aura.`)}}});
def("Palm Strike",{t:[ANY],run(c){D(c,c.t[0],1);if(c.comboed)st(c,c.t[0],"stun")}});
def("Rising Dragon",{t:[ANY],run(c){D(c,c.t[0],2+Math.max(0,combosPlayed(c)-1))}});
def("Finisher",{t:[ANY],run(c){D(c,c.t[0],combosPlayed(c))}});
def("Focus",{run(c){c.me.pm.pierce=1;log(c,"Attacks gain Piercing 1 this turn.")}});
def("Glimpse the Future",{run(c){scry(c,3)}});
def("Meditate",{run(c){c.actor.ex=true;c.actor.med=true;c.actor.keepMed=true;log(c,`${c.actor.name} is Meditating.`)}});
def("Deep Contemplation",{t:[t("meditating","Meditating Hero",null,{opt:true})],run(c){draw(c,1);if(c.t[0])c.t[0].plus++}});
def("Defend Prayer",{t:[t("any","damage target"),t("meditating","Meditating Hero for the counter",null,{opt:true})],run(c){D(c,c.t[0],2);if(c.t[1])c.t[1].plus++}});
def("Look Ahead",{t:[t("meditating","Meditating Hero",null,{opt:true})],run(c){if(c.t[0])c.t[0].plus++;scry(c,2)}});
def("Awakened Fist",{t:[t("meditating","Meditating Hero"),t("enemy","attack target")],can:(s,pid)=>s.p[pid].heroes.some(h=>h.med&&!h.dead),run(c){const h=c.t[0];if(!h)return;h.med=false;h.fl.medEnd=true;h.ex=false;attack(c,h,c.t[1],{pierce:1})}});
def("Balanced Choice",M(2,[{label:"Scry 2",run:c=>scry(c,2)},{label:"Target Hero gains +2 STR",t:[HERO],run:c=>buff(c.t[0],{str:2})},{label:"This Hero Meditates",run:c=>{c.actor.ex=true;c.actor.med=true;c.actor.keepMed=true}}]));
def("Well Trained",{t:[HERO],modes:{n:1,opts:[{label:"If it reaches an even Level, gain +1 STR"},{label:"If it reaches an even Level, gain +1 DEF"},{label:"If it reaches an even Level, gain +1 AURA"}]},run(c){if(combosPlayed(c)>=3&&c.t[0])E.levelUp(c.s,c.t[0],["str","def","aura"][(c.modes||[])[0]||0])}});
def("Stunner",{run(c){c.me.fl.stunner=true}});
/* ===== Bard ===== */
def("Ballad of Blades",{t:[ANY],run(c){D(c,c.t[0],(c.me.t.songs||0)>1?3:2)}});S['"Ballad of Blades"']=S["Ballad of Blades"];
const song=(n,o)=>{S['"'+n+'"']=o};
song("Ballad of Blades",S["Ballad of Blades"]);
song("Crescendo",Object.assign({t:[ANY]},{modes:{n:1,opts:[{label:"Deal 3 damage"},{label:"Harmonize 2: 3 damage to each enemy"}]},can:()=>true,run(c){
  const harm=(c.modes||[])[0]===1&&living(c.me).filter(h=>!h.ex).length>=2;
  if(harm){living(c.me).filter(h=>!h.ex).slice(0,2).forEach(h=>h.ex=true);enemies(c).forEach(e=>D(c,e,3))}else D(c,c.t[0],3)}}));
song("Dazzling Melody",{run(c){c.actor.fl.tauntRound=c.s.round;log(c,`Enemies must target ${c.actor.name} this turn.`)}});
song("Lullaby",{t:[t("any","target with 2 or less STR",(s,o)=>E.str(s,o)<=2)],run(c){if(c.t[0]){c.t[0].ex=true;log(c,`${c.t[0].name} is exhausted.`)}}});
song("Peace",{t:[HERO],run(c){st(c,c.t[0],"stun");if(c.me.disc.some(x=>x.id==='"Understanding"'))draw(c,1)}});
song("Rousing Chorus",{t:[AL],run(c){buff(c.t[0],{str:1})}});
song("Song of Healing",{run(c){allies(c).forEach(o=>heal(c,o,2))}});
song("Solo Act",{can:(s,pid,a)=>s.p[pid].heroes.filter(h=>!h.dead&&!h.ex&&h!==a).length>=2,run(c){living(c.me).filter(h=>!h.ex&&h!==c.actor).slice(0,2).forEach(h=>h.ex=true);c.me.fl.songDisc=true;log(c,"Songs cost 2 less this turn.")}});
song("Understanding",{modes:{n:1,opts:[{label:"Scry 3"},{label:"Scry 3, Harmonize 1: draw a card"}]},run(c){scry(c,3);if((c.modes||[])[0]===1){const h=living(c.me).find(h=>!h.ex&&h!==c.actor)||c.actor;h.ex=true;draw(c,1)}}});
song("Opening Act",{run(c){const first=(c.me.t.cards||0)===1;const top=c.me.lib.splice(-3);log(c,`Revealed: ${top.map(x=>E.DB[x.id].name).join(", ")}.`);const si=top.findIndex(x=>E.DB[x.id].type==="Song");if(si>=0){c.me.hand.push(top.splice(si,1)[0]);log(c,"A Song goes to hand.")}c.me.disc.push(...top);if(first){c.me.aura+=1;log(c,`${c.me.name} gains 1 Aura.`)}}});
def("Embolden",{t:[HERO],run(c){buff(c.t[0],{str:2})}});
def("Strong Stance",{t:[HERO],run(c){buff(c.t[0],{def:2})}});
def("Weakening Dirge",{run(c){c.me.pm.enemyStr=(c.me.pm.enemyStr||0)+1;log(c,"Enemies get -1 STR this turn.")}});
def("Mead Offering",{run(c){c.op.aura+=2;log(c,`${c.op.name} gains 2 Aura.`);draw(c,2)}});
def("Standing Ovation",{run(c){living(c.me).forEach(h=>h.ex=false);log(c,`${c.me.name}'s Heroes ready.`)}});
def("Tempo Change",{run(c){c.s.bonus={pid:c.pid,uid:c.actor.uid,n:3};log(c,`${c.actor.name} takes two additional actions.`)}});
/* ===== Ranger ===== */
const arrowNext=(c,o)=>{c.me.fl.arrowNext=Object.assign(c.me.fl.arrowNext||{},o)};
def("Bullseye",{run(c){arrowNext(c,{ign:true});log(c,"The next Arrow ignores DEF.")}});
def("Full Draw",{run(c){const n=c.me.fl.arrowNext;arrowNext(c,{dmg:((n&&n.dmg)||0)+4});log(c,"The next Arrow gains +4 damage.")}});
def("Spotters",{run(c){const r=living(c.me).filter(h=>h.cls==="Ranger").length;const n=c.me.fl.arrowNext;arrowNext(c,{dmg:((n&&n.dmg)||0)+r});log(c,`The next Arrow gains +${r} damage.`)}});
def("Reload",{run(c){const top=c.me.lib[c.me.lib.length-1];if(!top)return;const d=E.DB[top.id];
  if(d.sub==="Arrow"&&c.me.inv.length<E.slots(c.s,c.pid)){c.me.lib.pop();c.me.inv.push(Object.assign({kind:"card",fd:false,name:d.name,ctr:{}},top));log(c,`${d.name} goes into inventory.`)}
  else{log(c,d.sub==="Arrow"?"The top card is an Arrow, but the inventory is full.":"The top card isn't an Arrow.");E.pushChoose(c.s,c.pid,{title:"Reload: put this card on the bottom of your library?",cards:[top.uid],min:0,max:1,op:"bottom",pickLabel:"Bottom"})}}});
def("Quickdraw",{run(c){const top=c.me.lib.splice(-3);top.slice().forEach(x=>{if(E.DB[x.id].sub==="Arrow"&&c.me.inv.length<E.slots(c.s,c.pid)){top.splice(top.indexOf(x),1);c.me.inv.push(Object.assign({kind:"card",fd:false,name:E.DB[x.id].name,ctr:{}},x));log(c,`${E.DB[x.id].name} goes into inventory.`)}});c.me.lib.push(...top);exMe(c)}});
const arrow=(cost,t2,run,o)=>({act:Object.assign({cost,t:t2,run},o||{})});
def("Arrow of Hope",arrow(3,[ANY],c=>{D(c,c.t[0],2);draw(c,2)}));
def("Arrow of Persuasion",arrow(1,[ANY],c=>{D(c,c.t[0],3)}));
def("Blunt-Point Force",arrow(1,[ANY],c=>{const d=D(c,c.t[0],3);if(d>0&&c.t[0]){const pl=c.s.p[E.ctrl(c.s,c.t[0])];if(pl.hand.length){const x=pl.hand.splice(E.ri(c.s,pl.hand.length),1)[0];pl.disc.push(x);log(c,`${pl.name} discards ${E.DB[x.id].name}.`)}}}));
def("Dual Shot",arrow(1,[t("any","first damage target"),t("any","second damage target",null,{distinct:true})],c=>{D(c,c.t[0],2);D(c,c.t[1],2)}));
def("Flame Bolt",arrow(1,[HERO],c=>{D(c,c.t[0],3,{type:"Fire"});st(c,c.t[0],"burn")}));
def("Level Shot",arrow(1,[ANY],c=>{D(c,c.t[0],3);if((c.me.t.arrows||0)===2)E.levelUp(c.s,c.actor,"str")}));
def("Poison Dart",arrow(1,[t("any","damage target")],c=>{D(c,c.t[0],1,{poisonous:"dmg"})}));
def("Serrated Arrow",arrow(1,[ANY],c=>{D(c,c.t[0],3);st(c,c.t[0],"wound")}));
def("Smoke Trail Arrow",arrow(1,[ANY],c=>{D(c,c.t[0],3);c.me.fl.preventNext=true}));
def("Tri-Shot",arrow(4,[t("enemyPlayer","target party")],c=>{const p=c.t[0];if(!p)return;const hs=c.s.p[p.pid].heroes;[5,3,1].forEach((n,i)=>{if(hs[i]&&!hs[i].dead)D(c,hs[i],n,{ignoreDef:true})})}));
/* ===== Druid ===== */
def("Beast",summonCard("Beast"));def("Elk",summonCard("Elk"));def("Wolf",summonCard("Wolf"));def("Heavy Beast",summonCard("Heavy Beast"));
def("Aurawing",summonCard("Aurawing Familiar"));def("Drawwing",summonCard("Drawwing Familiar"));
def("Elk of the Woods",{run(c){summon(c,"Woods Beast",true);exMe(c)}});
def("Spore Calling",{run(c){summon(c,"Spore");draw(c,1);exMe(c)}});
def("Tooth",{run(c){c.me.pm.sstr=(c.me.pm.sstr||0)+1;log(c,"Summons gain +1 STR this turn.")}});
def("Horn",{run(c){c.me.pm.sdef=(c.me.pm.sdef||0)+1;log(c,"Summons gain +1 DEF this turn.")}});
def("Tooth or Horn",M(1,[{label:"+3 STR",t:[t("allySummon","your summon")],run:c=>buff(c.t[0],{str:3})},{label:"+3 DEF",t:[t("allySummon","your summon")],run:c=>buff(c.t[0],{def:3})}]));
def("Entangling Roots",{t:[EN],run(c){const o=c.t[0];if(!o)return;o.ex=true;log(c,`${o.name} is exhausted.`);if(summons(c.me).length>=3)st(c,o,"stun")}});
def("Populate",{t:[t("allySummon","summon with 3 or less STR",(s,o)=>E.str(s,o)<=3)],run(c){if(c.t[0])E.copySummon(c.s,c.pid,c.t[0]);exMe(c)}});
def("Mass Populate",{run(c){summons(c.me).slice().forEach(o=>E.copySummon(c.s,c.pid,o));exMe(c)}});
def("Evolve",{run(c){summons(c.me).slice(0,2).forEach(o=>{destroy(c,o,true);E.copySummon(c.s,c.pid,o,1)});exMe(c)}});
def("Return to the Earth",{t:[t("allySummon","summon to sacrifice")],run(c){destroy(c,c.t[0]);draw(c,1)}});
def("Primal Energy",{t:[HERO],can:(s,pid)=>s.p[pid].bf.filter(o=>o.kind==="summon"&&!o.ex).length>=2,run(c){summons(c.me).filter(o=>!o.ex).slice(0,2).forEach(o=>o.ex=true);if(c.t[0]){c.t[0].ex=false;log(c,`${c.t[0].name} readies.`)}}});
def("Nature's Choice",M(2,[{label:"Summon a 2/2 Elk",run:c=>{summon(c,"Elk");exMe(c)}},{label:"A summon gains +2 STR",t:[t("summon")],run:c=>buff(c.t[0],{str:2})},{label:"Ready a summon",t:[t("allySummon","your summon")],run:c=>{if(c.t[0])c.t[0].ex=false}}]));
def("Stampede",{run(c){summons(c.me).forEach(o=>{o.ex=false;const tg=rand(c,enemies(c).filter(e=>!E.stealth(c.s,e)));if(tg)E.damage(c.s,o,tg,str(c,o,tg),{combat:true})});summons(c.me).forEach(o=>o.ex=false)}});
/* ===== Generic ===== */
def("Inspiration",{run(c){draw(c,2)}});
def("Precognition",{run(c){scry(c,2,{draw:1})}});
def("Search for Knowledge",{run(c){draw(c,2);E.pushChoose(c.s,c.pid,{title:"Discard 2 cards",cards:c.me.hand.map(x=>x.uid),min:2,max:2,op:"discard"})}});
def("Level Up",{t:[HERO],run(c){if(c.t[0])E.levelUp(c.s,c.t[0],"str")}});
def("Delevel",{t:[HERO],run(c){const h=c.t[0];if(h&&h.lvl>0){if(h.lvl%2===0){const k=["str","def","aura"].find(k=>h.bon[k]>0);if(k)h.bon[k]--}h.lvl--;log(c,`${h.name} drops to Level ${h.lvl}.`)}}});
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
def("Potion",item(2,[t("hero","Hero to heal")],c=>heal(c,c.t[0],4),{exile:true}));
def("Revitalize",item(2,[],c=>{c.me.aura+=4;log(c,`${c.me.name} gains 4 Aura.`)},{exile:true}));
def("Smoke Bomb",item(1,[AHERO],c=>buff(c.t[0],{stealth:1}),{exile:true}));
def("Vial of Venom",item(1,[ANY],c=>st(c,c.t[0],"poison",2),{exile:true}));
def("Energizing Ale",item(2,[t("allyHero","target Bard",(s,o)=>E.heroIs(o,"Bard"))],c=>{if(c.t[0]){c.t[0].ex=false;log(c,`${c.t[0].name} readies.`)}},{exile:true}));
def("Harmonic Flask",item(1,[t("hero","Hero to clear (2 status)",null,{opt:true})],c=>{if(c.t[0])E.removeStatus(c.s,c.t[0],2);else heal(c,c.actor,3)},{exile:true}));
def("Phoenix Down",item(3,[t("deadAny","dead Hero")],c=>{const h=c.t[0];if(!h)return;h.dead=false;h.dmg=Math.max(0,E.maxHp(c.s,h)-3);h.ex=true;E.addMod(h,{stealth:1});log(c,`${h.name} is revived with 3 HP.`)},{exile:true,can:(s)=>s.p.some(p=>p.heroes.some(h=>h.dead&&!h.surr))}));
def("Platinum Bar",item(2,[],c=>draw(c,1)));
def("Gold Bar",item(3,[],c=>{c.me.pm.def=(c.me.pm.def||0)+1;log(c,"Your party gains +1 DEF this turn.")}));
def("Silver Bar",item(3,[],c=>{c.me.pm.str=(c.me.pm.str||0)+1;log(c,"Your party gains +1 STR this turn.")}));
def("Dynamite",item(3,[t("any","first damage target"),t("any","second damage target",null,{distinct:true})],c=>{D(c,c.t[0],2);D(c,c.t[1],2)}));
def("Sleeping Potion",item(2,[HERO],c=>{if(c.t[0]){c.t[0].ex=true;log(c,`${c.t[0].name} is exhausted.`)}},{exile:true,ex:true}));
def("Amnesia Puzzle Box",item(0,[t("player","target player")],c=>{const p=c.s.p[c.t[0].pid];p.lib.push(...p.disc.splice(0));E.shuffle(c.s,p.lib);log(c,`${p.name} shuffles their discard pile into their library.`)},{exile:true}));
def("Energy Stone",item(0,[],c=>{summons(c.me).filter(o=>!o.ex).slice(0,3).forEach(o=>o.ex=true);c.me.aura+=1;log(c,`${c.me.name} gains 1 Aura.`)},{can:(s,pid)=>s.p[pid].bf.filter(o=>o.kind==="summon"&&!o.ex).length>=3}));
def("Song Book",item(1,[],c=>{c.inst.exh=true;E.pushChoose(c.s,c.pid,{title:"Song Book: choose a Song",cards:c.me.lib.filter(x=>E.DB[x.id].type==="Song").map(x=>x.uid),min:1,max:1,op:"tutor"})},{can:(s,pid,a,o)=>!o.exh}));
def("Instrument Bag",item(2,[],c=>{E.pushChoose(c.s,c.pid,{title:"Instrument Bag: choose an Instrument",cards:c.me.lib.filter(x=>E.DB[x.id].sub==="Instrument").map(x=>x.uid),min:1,max:1,op:"tutor"})}));
/* passive items: handled in the engine by name (no script needed beyond entering play) */
["Aura Crystal","Brute's Banner","Captain's Banner","Healing Relic","Inversion Stone","Horn Crystal","Tooth Crystal","Petal Shrine","Resistance Shield","Sphere of Resistance","The Monolith","The Forbidden Tuner","Almandine","Rose Quartz","Topaz"].forEach(n=>{if(!S[n])S[n]={}});
S["Almandine"].gem=c=>{c.actor=null;enemies(c).forEach(e=>E.damage(c.s,{name:"Almandine"},e,2,{card:true}))};
S["Rose Quartz"].gem=c=>{living(c.me).forEach(h=>E.heal(c.s,null,h,3))};
S["Topaz"].gem=c=>{c.me.aura+=2;log(c,`${c.me.name} gains 2 Aura.`)};
/* ===== Hidden cards ===== */
const hid=(name,when,ok,run)=>{S[name]=Object.assign(S[name]||{},{hidden:{when,ok,run}})};
const atkr=(s,trig)=>E.find(s,trig.attacker);
const isHeroAtk=(s,pid,trig)=>{const f=atkr(s,trig);return f&&f.o.kind==="hero"};
hid("Bear Trap","attack",null,c=>{c.mods.cancel=true;const a=atkr(c.s,c.trig);if(a)st(c,a.o,"stun")});
hid("Pitfall","attack",isHeroAtk,c=>{c.mods.cancel=true;const a=atkr(c.s,c.trig).o;const pl=c.s.p[a.owner];pl.heroes.splice(pl.heroes.indexOf(a),1);pl.heroes.push(a);if(a.lvl>0){if(a.lvl%2===0){const k=["str","def","aura"].find(k=>a.bon[k]>0);if(k)a.bon[k]--}a.lvl--}log(c,`${a.name} falls to the Closer position and drops to Level ${a.lvl}.`)});
hid("Snare","attack",isHeroAtk,c=>{c.mods.str=(c.mods.str||0)-3;log(c,"The attacker gets -3 STR for this attack.")});
hid("Spike Pit","attack",isHeroAtk,c=>{const a=atkr(c.s,c.trig).o;E.damage(c.s,{name:"Spike Pit"},a,3,{card:true});st(c,a,"wound")});
hid("Grapple","attack",null,c=>{c.mods.noDamage=true});
hid("Fortify","attack",null,c=>{c.mods.noDamage=true});
hid("Attack Reversal","attack",null,c=>{c.mods.cancel=true});
hid("Refrain","attack",null,c=>{c.mods.noDamage=true});
hid("Out of the Woods","attack",(s,pid,trig)=>{const t2=E.find(s,trig.target);return t2&&t2.o.kind==="hero"&&t2.pid===pid},c=>{summon(c,"Beast")});
hid("Fade the Fury","attack",(s,pid,trig)=>{const t2=E.find(s,trig.target);const a=atkr(s,trig);return t2&&t2.o.kind==="hero"&&E.heroIs(t2.o,"Rogue")&&a&&a.o.kind==="hero"&&E.str(s,a.o)>=3},c=>{c.mods.cancel=true});
hid("Cancel","card",null,c=>{c.mods.cancel=true});
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
hab("Divine Knight",[{label:"Ally +2 DEF this turn",t:[AL],run:c=>buff(c.t[0],{def:2})},{label:"Ally +5 DEF this turn",lvl:3,cost:2,t:[AL],run:c=>buff(c.t[0],{def:5})}]);
hab("Essence Reaper",[{label:"Stun target enemy",lvl:3,t:[EN],run:c=>st(c,c.t[0],"stun")}]);
hab("Inspiration Herald",[{label:"Ready another ally",t:[t("ally","another ally",(s,o,x)=>o.uid!==x.actor.uid&&o.ex)],run:c=>{if(c.t[0]){c.t[0].ex=false;log(c,`${c.t[0].name} readies.`)}}}]);
hab("Rage Brute",[{label:"Double STR until end of next round",run:c=>{E.addMod(c.actor,{mulStr:2,until:c.s.round+1});log(c,`${c.actor.name}'s STR is doubled.`)}}]);
hab("Rootbinder",[{label:"Summons +1 STR this turn",run:c=>{c.me.pm.sstr=(c.me.pm.sstr||0)+1;log(c,"Summons gain +1 STR this turn.")}}]);
hab("Songweaver",[{label:"Ally +2 STR this turn",t:[AL],run:c=>buff(c.t[0],{str:2})}]);
hab("Storm Caller",[{label:"Deal 2 damage to all enemies",cost:2,can:(s,pid,a)=>a.lvl<3,run:c=>enemies(c).forEach(e=>E.damage(c.s,c.actor,e,2,{card:true}))},{label:"Deal 3 damage to all enemies",lvl:3,cost:2,run:c=>enemies(c).forEach(e=>E.damage(c.s,c.actor,e,3,{card:true}))}]);
hab("Warden of the Woods",[{label:"Summon a 2/2 Spirit",cost:1,run:c=>summon(c,"Spirit")},{label:"Exhaust a summon: +2 STR",ex:false,can:(s,pid)=>s.p[pid].bf.some(o=>o.kind==="summon"&&!o.ex),t:[t("allySummon","ready summon",(s,o)=>!o.ex)],run:c=>{if(c.t[0])c.t[0].ex=true;buff(c.actor,{str:2})}}]);

/* ===== choose ops ===== */
OPS.bottom=(s,pid,pr,picks)=>{const pl=s.p[pid];picks.forEach(u=>{const i=pl.lib.findIndex(c=>c.uid===u);if(i>=0){const c=pl.lib.splice(i,1)[0];pl.lib.unshift(c);E.log(s,`${pl.name} puts the card on the bottom of their library.`,pid)}})};
OPS.discard=(s,pid,pr,picks)=>{const pl=s.p[pid];picks.forEach(u=>{const i=pl.hand.findIndex(c=>c.uid===u);if(i>=0){const c=pl.hand.splice(i,1)[0];pl.disc.push(c);E.log(s,`${pl.name} discards ${E.DB[c.id].name}.`,pid)}})};
OPS.opDiscard=(s,pid,pr,picks)=>{const pl=s.p[pr.target];picks.forEach(u=>{const i=pl.hand.findIndex(c=>c.uid===u);if(i>=0){const c=pl.hand.splice(i,1)[0];pl.disc.push(c);E.log(s,`${pl.name} discards ${E.DB[c.id].name}.`,pid)}})};
OPS.tutor=(s,pid,pr,picks)=>{const pl=s.p[pid];picks.forEach(u=>{const i=pl.lib.findIndex(c=>c.uid===u);if(i>=0){const c=pl.lib.splice(i,1)[0];pl.hand.push(c);E.log(s,`${pl.name} searches for ${E.DB[c.id].name}.`,pid)}});E.shuffle(s,pl.lib)};
OPS.fromDisc=(s,pid,pr,picks)=>{const pl=s.p[pid];picks.forEach(u=>{const i=pl.disc.findIndex(c=>c.uid===u);if(i>=0){const c=pl.disc.splice(i,1)[0];pl.hand.push(c);E.log(s,`${pl.name} returns ${E.DB[c.id].name} to hand.`,pid)}})};
})(typeof window!=="undefined"?window:globalThis);
