/* Crystal Quest rules engine (Play tab).
   Pure state machine: CQE.newGame() -> state; CQE.options(s,pid) -> legal actions; CQE.need(s,pid,a) -> target slots;
   CQE.act(s,pid,a) applies an action. State is plain JSON so it can be cloned (AI) and sent over the network (online play).
   Card effects live in play-cards.js (SCRIPTS). Cards without a script resolve through the manual panel. */
"use strict";
(function(root){
const E={};root.CQE=E;
/* ---------- card database ---------- */
const DB={},TOK={};
E.DB=DB;E.TOK=TOK;
function num(v){const n=parseInt(v,10);return isNaN(n)?0:n}
const _RC=typeof RAW_CARDS!=="undefined"?RAW_CARDS:root.RAW_CARDS,_RE=typeof RAW_EQUIP!=="undefined"?RAW_EQUIP:root.RAW_EQUIP,_RH=typeof RAW_HEROES!=="undefined"?RAW_HEROES:root.RAW_HEROES,_RT=typeof RAW_TOKENS!=="undefined"?RAW_TOKENS:root.RAW_TOKENS;
(_RC||[]).forEach(r=>{DB[r[1]]={id:r[1],name:r[1],cost:r[2],sup:r[3],type:r[4],sub:r[5],cls:r[6],rules:r[7],kind:"card"}});
{const _DC=typeof DEPRECATED_CARDS!=="undefined"?DEPRECATED_CARDS:(root.DEPRECATED_CARDS||[]);_DC.forEach(r=>{if(!DB[r[1]])DB[r[1]]={id:r[1],name:r[1],cost:r[2],sup:r[3],type:r[4],sub:r[5],cls:r[6],rules:r[7],kind:"card",dep:true}})}
(_RE||[]).forEach(r=>{DB[r[0]]={id:r[0],name:r[0],sup:r[1],type:"Equipment",sub:r[2],cls:r[3],rules:r[4],cost:r[5],region:r[6],pstr:num(r[7]),pdef:num(r[8]),kind:"equip"}});
(_RH||[]).forEach(r=>{DB["h:"+r[0]]={id:"h:"+r[0],name:r[0],cls:r[1],str:num(r[2]),def:num(r[3]),aura:num(r[4]),hp:num(r[5]),rules:r[6],type:"Hero",kind:"hero"}});
{const RN=typeof CARD_RENAMES!=="undefined"?CARD_RENAMES:(root.CARD_RENAMES||{});for(const o in RN){if(DB[RN[o]]&&!DB[o])DB[o]=DB[RN[o]];if(DB["h:"+RN[o]]&&!DB["h:"+o])DB["h:"+o]=DB["h:"+RN[o]]}}
(_RT||[]).forEach(r=>{TOK[r[0]]={name:r[0],tkind:r[1],sub:r[2],cls:r[3],str:num(r[4]),def:num(r[5]),hp:num(r[6]),cost:num(r[7]),region:r[8],rules:r[9]}});
/* Set 2 Artificer (Set Two Rules Supplement): two-sided Recipe cards. DB[recipe].recipe = {ing, back}. What a Recipe makes gets its own DB entry
   (id = the made card's name, made = the Recipe's id). Made items and weapons are for the whole party (Generic class); when one leaves play, the Recipe card goes to the discard pile. */
const RCP=typeof RECIPES!=="undefined"?RECIPES:(root.RECIPES||{});E.RECIPES=RCP;
for(const n in RCP){const r=RCP[n],b=r.back;if(DB[n])DB[n].recipe=r;
  if(b.type!=="Summon"&&!DB[b.name])DB[b.name]={id:b.name,name:b.name,cost:b.cost,sup:"",type:b.type,sub:b.type==="Equipment"?b.sub:"",cls:"Generic",rules:b.rules,kind:b.type==="Equipment"?"equip":"card",region:b.region,pstr:num(b.pstr),pdef:num(b.pdef),made:n}}
const CLASSES=["Barbarian","Bard","Cleric","Druid","Mage","Monk","Paladin","Ranger","Rogue","Warlock"];E.CLASSES=CLASSES;
const STATUS=["burn","poison","wound","confuse","stun"];E.STATUS=STATUS;
E.STATUS_NAME={burn:"Burned",poison:"Poisoned",wound:"Wounded",confuse:"Confused",stun:"Stunned"};
const POS=["Lead","Center","Closer"];E.POS=POS;
E.INN_HEAL=3;E.INN_COST=5;E.SHOP_COST=4;E.CHURCH_COST=10;E.CHURCH_HP=5;E.HAND_MAX=5;
/* Upgrades (Town, Blacksmith): items/equipment whose text has "Upgrade N Gold:" or "Upgrade X Gold:". Must be in play; stays upgraded for the whole game (tracked by card id in s.upg). */
/* Weapon upgrades (update 19): one fixed upgrade per weapon from EQUIP_UPGRADES (cards-data.js): [cost, rules, +STR, +DEF]. Upgrading flips the weapon: its upgraded text and stats replace the normal side. */
const UPGD=typeof EQUIP_UPGRADES!=="undefined"?EQUIP_UPGRADES:(root.EQUIP_UPGRADES||{});
for(const n in UPGD){if(DB[n]){const u=UPGD[n];DB[n].up={cost:+u[0],rules:u[1],pstr:num(u[2]),pdef:num(u[3])}}}
const isUp=(s,e)=>!!(e&&e.uid&&s.upg&&s.upg[e.uid]!=null);
const hasUpN=(s,h,n)=>eqList(h).some(e=>e.name===n&&isUp(s,e));
E.isUp=isUp;E.hasUp=hasUpN;
/* Dagger check: name has "Dagger", or an upgraded Feather Blade ("This counts as a Dagger") */
E.isDagger=(s,e)=>!!e&&(/Dagger/.test(e.name)||(e.name==="Feather Blade"&&isUp(s,e)));
function upgradeCost(o){const d=DB[o.id]||{};if(d.up)return{cost:d.up.cost,weapon:true};const m=/Upgrade[^:]*?(\d+|X) Gold/i.exec((DB[o.id]||{}).rules||"");if(!m)return null;return m[1]==="X"?{x:true}:{cost:+m[1]}}
E.upgradeCost=upgradeCost;
function upgradables(s,pid){const pl=s.p[pid];const objs=[...pl.inv.filter(o=>!o.fd&&o.id),...pl.heroes.flatMap(h=>Object.values(h.eq).filter(e=>e&&e!=="2H"))];
  return objs.filter(o=>upgradeCost(o)&&!(s.upg&&s.upg[o.uid]!=null))}
E.upgradables=upgradables;
const SOULS=["Draw a card","Gain 2 Aura","Ally +2 STR this turn","Deal 2 damage","Gain 3 Gold","Ally +2 DEF this turn"];E.SOULS=SOULS;
const SC=()=>root.CQ_SCRIPTS||{};
const HS=()=>root.CQ_HERO_SCRIPTS||{};
E.isScripted=name=>!!SC()[name];
E.hasCombo=d=>/(^|\s)Combo\./.test(d.rules||"");

/* ---------- rng + utils ---------- */
function rnd(s){let t=(s.rng=(s.rng+0x6D2B79F5)|0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}
function ri(s,n){return Math.floor(rnd(s)*n)}
function shuffle(s,a){for(let i=a.length-1;i>0;i--){const j=ri(s,i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
E.rnd=rnd;E.ri=ri;E.shuffle=shuffle;
const nid=s=>"o"+(++s.nx);
const P=(s,pid)=>s.p[pid];
const opp=pid=>1-pid;E.opp=opp;
function log(s,m,pid){s.logN=(s.logN||0)+1;s.log.push({n:s.logN,r:s.round,m,p:pid==null?-1:pid});if(s.log.length>4000)s.log.splice(0,s.log.length-4000)}
E.log=log;
const def=o=>DB[o.id]||TOK[o.name]||{};E.def=def;

/* ---------- new game ---------- */
function mkHero(s,pid,id){const d=DB[id];return{uid:nid(s),kind:"hero",id,name:d.name,cls:d.cls,owner:pid,base:{str:d.str,def:d.def,aura:d.aura,hp:d.hp},dmg:0,lvl:0,bon:{str:0,def:0,aura:0},ex:false,dead:false,surr:false,med:false,keepMed:true,plus:0,st:{burn:0,poison:0,wound:0,confuse:0,stun:0},eq:{Head:null,Chest:null,Arms:null,Legs:null,Feet:null,Accessory:null,H1:null,H2:null},ench:[],mods:[],guard:0,eqGuard:0,stepped:false,leveled:false,attacks:0,fl:{}}}
function mkCard(s,pid,id){return{uid:nid(s),id,owner:pid}}
E.newGame=function(cfg){
  const s={v:1,nx:0,rng:(cfg.seed>>>0)||((Math.random()*2**31)|0),round:0,phase:"mull",init:0,pos:0,prio:0,acted:[false,false],passed:[false,false],
    p:[],pend:[],cur:null,qatk:null,bonus:null,town:null,over:false,winner:null,log:[],seq:0,dawnDone:[false,false],lastCard:null,
    stats:{dmg:[{},{}],prev:[{},{}],heal:[{},{}],start:[[],[]]}};
  cfg.players.forEach((pc,pid)=>{
    const pl={name:pc.name||("Player "+(pid+1)),ai:!!pc.ai,heroes:pc.deck.heroes.map(h=>mkHero(s,pid,h)),hand:[],lib:[],disc:[],exile:[],inv:[],bf:[],aura:0,gold:0,echo:[],pm:{},fl:{},t:{},mullDone:false,mulled:false,deckName:pc.deck.name||""};
    for(const[id,q]of Object.entries(pc.deck.cards))if(DB[id])for(let i=0;i<q;i++)pl.lib.push(mkCard(s,pid,id));
    s.p.push(pl);
  });
  s.p.forEach((pl,i)=>{s.stats.start[i]=pl.heroes.map(h=>h.name)});
  s.p.forEach(pl=>{shuffle(s,pl.lib);for(let i=0;i<4;i++)draw(s,s.p.indexOf(pl),1,true)});
  let a,b;do{a=1+ri(s,6);b=1+ri(s,6)}while(a===b);
  s.init=a>b?0:1;
  log(s,`Initiative roll: ${s.p[0].name} ${a}, ${s.p[1].name} ${b}. ${s.p[s.init].name} starts with initiative.`);
  log(s,"Each player drew 4 cards. Keep your hand or mulligan once.");
  return s;
};
E.validateDeck=function(d){
  const out=[];if(!d||!d.heroes||d.heroes.length!==3)out.push("Needs 3 Heroes.");
  let t=0;for(const[id,q]of Object.entries(d.cards||{})){if(!DB[id])out.push(`Unknown card ${id}`);else if(DB[id].dep)out.push(`${id} is deprecated (removed from play).`);t+=q}
  for(const[id,q]of Object.entries(d.cards||{})){const c=DB[id];if(c&&q>(c.sup==="Legendary"?1:3))out.push(`${id}: ${c.sup==="Legendary"?"Legendary, only 1 allowed":"max 3 copies"}.`)}
  if(t<50)out.push(`Deck has ${t} cards (needs at least 50).`);return out};

/* ---------- lookups ---------- */
function allObjs(s){const out=[];s.p.forEach((pl,pid)=>{pl.heroes.forEach(h=>{out.push(h);eqList(h).forEach(e=>out.push(e));h.ench.forEach(e=>out.push(e))});pl.bf.forEach(o=>out.push(o));pl.inv.forEach(o=>out.push(o))});return out}
function find(s,uid){
  for(let pid=0;pid<s.p.length;pid++){const pl=s.p[pid];
    for(const h of pl.heroes){if(h.uid===uid)return{o:h,pid,zone:"hero"};
      for(const k in h.eq){const e=h.eq[k];if(e&&e!=="2H"&&e.uid===uid)return{o:e,pid,zone:"eq",hero:h,slot:k}}
      for(const e of h.ench)if(e.uid===uid)return{o:e,pid:e.ctrl!=null?e.ctrl:e.owner,zone:"ench",hero:h}}
    for(const o of pl.bf)if(o.uid===uid)return{o,pid,zone:"bf"};
    for(const o of pl.inv)if(o.uid===uid)return{o,pid,zone:"inv"};
    for(const o of pl.hand)if(o.uid===uid)return{o,pid,zone:"hand"};
  }return null}
E.find=find;E.allObjs=allObjs;
const ctrl=(s,o)=>{const f=find(s,o.uid);return f?f.pid:o.owner};E.ctrl=ctrl;
function eqList(h){const o=[];for(const k in h.eq){const e=h.eq[k];if(e&&e!=="2H")o.push(e)}return o}
E.eqList=eqList;
const hasEqN=(h,n)=>eqList(h).some(e=>e.name===n);
const living=pl=>pl.heroes.filter(h=>!h.dead);
const curses=s=>{let n=0;s.p.forEach(pl=>pl.heroes.forEach(h=>h.ench.forEach(e=>{if(def(e).sub==="Curse")n++})));return n};
const invHas=(pl,n)=>pl.inv.some(o=>!o.fd&&o.name===n);
const invCount=(pl,n)=>pl.inv.filter(o=>!o.fd&&o.name===n).length;
E.slots=(s,pid)=>4+(living(P(s,pid)).some(h=>h.name==="Veteran Bowman")?1:0);

/* ---------- stats ---------- */
function maxHp(s,o){
  if(o.kind==="hero"){let m=o.base.hp;o.ench.forEach(e=>{if(e.name==="Life Boost")m+=2});
    return m}
  if(o.kind==="summon"){let m=o.hp;const pl=P(s,o.ctrl);
    if(/Soldier/.test(o.sub||o.name))m+=invCount(pl,"Captain's Banner");return m}
  if(o.kind==="doll")return 5;return 0}
const hpOf=(s,o)=>maxHp(s,o)-(o.dmg||0);
E.maxHp=maxHp;E.hp=hpOf;
const enraged=(s,h)=>h.kind==="hero"&&!h.dead&&hpOf(s,h)*2<=maxHp(s,h);E.enraged=enraged;
function modSum(o,k){let n=0;(o.mods||[]).forEach(m=>{if(m[k])n+=m[k]});return n}
const modHas=(o,k)=>(o.mods||[]).some(m=>m[k]);
function defOf(s,o){
  if(o.kind==="hero"){const pl=P(s,o.owner);let d=o.base.def+o.bon.def+modSum(o,"def")+(pl.pm.def||0);
    eqList(o).forEach(e=>d+=e.pdef||0);
    if(o.name==="Sun Paladin"&&o.ex)d+=2;
    /* update 26: Holy Guardian, while exhausted, gives each adjacent Hero +1 DEF */const i=pl.heroes.indexOf(o);[pl.heroes[i-1],pl.heroes[i+1]].forEach(g=>{if(g&&g.name==="Holy Guardian"&&!g.dead&&g.ex)d+=1});
    if(hasEqN(o,"Great Axe")&&enraged(s,o))d+=1;
    /* update 29: Bark of the Protector, +1 DEF for each summon you control */if(hasEqN(o,"Bark of the Protector"))d+=pl.bf.filter(x=>x.kind==="summon").length;
    o.ench.forEach(e=>{if(e.name==="Distract")d-=1});
    if(modHas(o,"zeroDef"))d=0;return Math.max(0,d)}
  if(o.kind==="summon"){const pl=P(s,o.ctrl);let d=modSum(o,"def")+invCount(pl,"Horn Crystal")+invCount(pl,"Barkskin Totem")+(pl.pm.sdef||0);return Math.max(0,d)}
  return 0}
function strOf(s,o,vs){
  if(o.kind==="hero"){const pl=P(s,o.owner);let b=o.name==="King of Curses"?curses(s):o.base.str;
    let v=b+o.bon.str+modSum(o,"str")+(pl.pm.str||0);
    eqList(o).forEach(e=>v+=e.pstr||0);
    if(heroIs(o,"Barbarian"))v+=trophies(pl);
    pl.heroes.forEach(h=>{if((h!==o||hasUpN(s,h,"Drums of War"))&&!h.dead&&!h.ex&&hasEqN(h,"Drums of War"))v+=1});
    if(o.name==="Bloodhowl"&&enraged(s,o))v+=o.lvl>=3?4:2;
    /* update 26: Level 3 Radiant Sentinel gets +5 instead when 5+ of its DEF comes from equipment */if(o.name==="Radiant Sentinel"){const eqd=eqList(o).reduce((n,e)=>n+(e.pdef||0),0);if(o.lvl>=3&&eqd>=5)v+=5;else if(defOf(s,o)>=5)v+=2}
    if(o.cls==="Barbarian"&&o.fl.bannerRound===s.round)v+=2;
    if(heroIs(o,"Barbarian"))pl.inv.forEach(x=>{if(!x.fd&&x.name==="Warrior's Pyre")v+=(x.ctr&&x.ctr.fury)||0});
    o.ench.forEach(e=>{if(e.name==="Weaken")v-=1});
    const op=P(s,opp(o.owner));if(op&&living(op).some(h=>h.name==="Whisper Knife"))v-=o.st.poison;
    if(op)v-=(op.pm.enemyStr||0);
    if(vs){if(o.name==="Venom Dancer"&&vs.st&&vs.st.poison>0)v+=3;
}
    (o.mods||[]).forEach(m=>{if(m.mulStr&&(m.until==null||m.until>=s.round))v*=m.mulStr});
    if(modHas(o,"zeroStr"))v=0;return Math.max(0,v)}
  if(o.kind==="summon"){const pl=P(s,o.ctrl);let v=o.str+modSum(o,"str")+invCount(pl,"Tooth Crystal")+(pl.pm.sstr||0);
    if(/Soldier/.test(o.sub||o.name))v+=invCount(pl,"Captain's Banner")+(pl.pm.soldier||0);
    const op=P(s,opp(o.ctrl));if(op)v-=(op.pm.enemyStr||0);if(op&&living(op).some(h=>h.name==="Whisper Knife"))v-=o.st.poison;
    return Math.max(0,v)}
  return 0}
E.str=strOf;E.defn=defOf;
/* Rebuke / Bulwark Prayer: this turn the Hero deals damage equal to its DEF instead of its STR */
function usesDef(s,o){if(!o||o.kind!=="hero")return false;if(o.fl.defDmgRound===s.round)return true;const pl=P(s,o.owner);return heroIs(o,"Cleric")&&pl.fl.clericDefRound===s.round}
function dmgStr(s,o,vs){return usesDef(s,o)?defOf(s,o):strOf(s,o,vs)}
E.dmgStr=dmgStr;E.usesDef=usesDef;
/* Banding: Rousing Bandleader (Heroes), Marching Cadence / Duet (Heroes this turn), Gathering Tree (summons), Unity of the Herd (summons this turn) */
function hasBanding(s,o){if(!o||o.dead)return false;
  if(o.kind==="hero"){const pl=P(s,o.owner);return o.fl.bandRound===s.round||living(pl).some(h=>h.name==="Rousing Bandleader")}
  if(o.kind==="summon"){const pl=P(s,o.ctrl);return invHas(pl,"Gathering Tree")||pl.fl.summonBandRound===s.round}
  return false}
function bandReady(s,o){return hasBanding(s,o)&&!o.ex&&!(o.st&&o.st.stun)&&!(o.fl&&o.fl.noAttack)}
function bandMembers(s,pid){const pl=P(s,pid);return[...living(pl),...pl.bf.filter(o=>o.kind==="summon")].filter(o=>bandReady(s,o))}
E.hasBanding=hasBanding;E.bandMembers=bandMembers;
const auraStat=h=>h.base.aura+h.bon.aura;
function spellDmg(s,pid,actor){const pl=P(s,pid);let n=2*pl.bf.filter(o=>o.name==="Spell Damage Pillar").length;
  if(actor){if(actor.name==="Ember Mage")n+=1;if(hasEqN(actor,"Apprentice's Wand"))n+=1;if(hasEqN(actor,"Ring of Power"))n+=2}return n}
E.spellDmg=spellDmg;
function noAttack(s,o){return o&&o.kind==="hero"&&modHas(o,"noAttack")}
E.noAttack=noAttack;
function stealth(s,o){if(o.kind==="summon")return!!o.stealth||modHas(o,"stealth");if(o.kind!=="hero")return false;if(modHas(o,"stealth")||hasEqN(o,"Shadow Cloak"))return true;if(o.name==="Night Stalker"&&o.ex)return true;return false}
function cardProof(s,o,enemy){return o.kind==="hero"&&(eqList(o).some(e=>(e.name==="Cloak of Protection"||e.name==="Cloak of Shadow")&&(!isUp(s,e)||enemy!==false))||modHas(o,"untarget"))}
function poisonous(s,h,dealt){if(!h||h.kind!=="hero")return 0;let n=0; /* update 23: every instance of Poisonous triggers separately (they add up) */
  if(h.name==="Dark Fang")n+=h.lvl>=3?(dealt||0):1;
  eqList(h).forEach(e=>{if(e.name==="Viper Fang Dagger")n+=1;if(e.x&&e.x.poison)n+=1;if(e.name==="Poison-Tipped Dagger")n+=isUp(s,e)?3:2});
  if(h.cls==="Rogue"&&P(s,h.owner).pm.poisonous)n+=1;return n}
function lifelink(s,h){return h.kind==="hero"&&((h.name==="Radiant Oracle"&&h.lvl>=3)||hasEqN(h,"Ring of Radiance")||modHas(h,"lifelink"))}
/* Guard from one piece of equipment (upgraded Knight's Sword: Guard 2). before=true: the value before its upgrade */
function eqGuardOf(s,e,before){const d=def(e);const r=(!before&&d.up&&isUp(s,e)?d.up.rules:d.rules)||"";const m=/(?:^|\. |\n|and )Guard (\d+)/.exec(r);return m?+m[1]:0}
function guardEq(h,s){let g=0;eqList(h).forEach(e=>{g+=s?eqGuardOf(s,e):eqGuardOf({},e,true)});return g}
E.guardEq=guardEq;E.hasEq=hasEqN;E.living=living;E.invHas=invHas;E.invCount=invCount;E.P=P;E.cardProof=cardProof;E.heroByUid=(s,u)=>heroByUid(s,u);E.poisonous=poisonous;E.lifelink=lifelink;E.stealth=stealth;

/* ---------- basic operations ---------- */
/* Mill X: move the top X cards of a library to its owner's discard pile (no reshuffle) */
function mill(s,pid,n){const pl=P(s,pid);const out=[];for(let i=0;i<n&&pl.lib.length;i++){const c=pl.lib.pop();pl.disc.push(c);out.push(DB[c.id]?DB[c.id].name:"a card")}
  log(s,out.length?`${pl.name} mills ${out.length}: ${out.join(", ")}.`:`${pl.name} has no cards to mill.`,pid);return out.length}
E.mill=mill;
/* Drawing from an empty library loses the game (rule change, Nov 2026) */
function deckOut(s,pid){if(s.over)return;const pl=P(s,pid);s.over=true;s.winner=opp(pid);s.deckedOut=pid;s.pend=[];s.cur=null;s.qatk=null;
  log(s,`${pl.name} must draw from an empty library and loses the game.`,pid);log(s,`🏆 ${P(s,opp(pid)).name} wins!`)}
function draw(s,pid,n,quiet){const pl=P(s,pid);let got=0;
  for(let i=0;i<n;i++){if(!pl.lib.length){deckOut(s,pid);break}
    pl.hand.push(pl.lib.pop());got++;
    if(s.phase==="battle"&&invHas(pl,"Healing Relic")){const t=autoTarget(s,pid,"healAlly");if(t)heal(s,{name:"Healing Relic",ctrl:pid},t,1,pid)}}
  if(!quiet&&got)log(s,`${pl.name} draws ${got} card${got===1?"":"s"}.`,pid);return got}
E.draw=draw;
function addStatus(s,o,k,n){if(!o||o.dead||!o.st)return;o.st[k]=(o.st[k]||0)+(n||1);log(s,`${o.name} is ${E.STATUS_NAME[k]}${n>1?` (+${n})`:""}.`)}
E.addStatus=addStatus;
/* ---------- game stats: damage dealt, damage prevented and healing done, credited to the card / ability / attack ---------- */
let CUR_SRC=null;let CUR_S=null;/* update 23: state of the action being resolved (Embolden needs it inside addMod) *//* name of the card, item, ability or Hidden card currently resolving */
function stat(s,k,side,name,n){if(!(n>0)||side==null||side<0||!name)return;if(!s.stats)s.stats={dmg:[{},{}],prev:[{},{}],heal:[{},{}],start:[[],[]]};const t=s.stats[k][side];t[name]=(t[name]||0)+n}
function sideOf(s,o){if(!o)return null;if(o.kind==="hero")return o.owner;if(o.ctrl!=null)return o.ctrl;if(o.owner!=null)return o.owner;return null}
E.stat=stat;
/* runs a card / ability script with its name as the stats source; Guard it grants is remembered so later absorbs credit it */
function withSrc(s,name,fn){const prev=CUR_SRC;CUR_SRC=name;CUR_S=s;const g=[];s.p.forEach(pl=>pl.heroes.forEach(h=>g.push([h,h.guard])));
  try{return fn()}finally{g.forEach(([h,b])=>{if(h.guard>b){h.gsrc=h.gsrc||[];h.gsrc.push({n:h.guard-b,src:name})}});CUR_SRC=prev}}
E.withSrc=withSrc;
/* ---------- update 15 helpers ---------- */
/* generic one-choice prompt: {type:"ask",pid,title,opts:[{label,v}],op,data}; answered with {type:"ask",i}. Ops live in E.ASK (engine + play-cards.js). */
const ASK={};E.ASK=ASK;
function ask(s,pid,title,opts,op,data){if(!opts||!opts.length)return false;s.pend.unshift({type:"ask",pid,title,opts,op,data:data||{}});return true}
E.ask=ask;
/* targets for an ask, best damage target first */
function targetOpts(s,pid,list,n){const best=bestDamageTarget(s,pid,n||1,{});const l=list.slice().sort((a,b)=>(b===best)-(a===best)||((ctrl(s,a)!==pid)-(ctrl(s,b)!==pid))*-1);return l.map(o=>({label:o.name+(o.kind==="summon"?" (summon)":"")+(ctrl(s,o)===pid?" (yours)":""),v:o.uid}))}
E.targetOpts=targetOpts;
/* lose HP as part of paying a cost (Ritual Athame watches for this) */
function costHp(s,pid,h,n,why){if(!h||n<=0)return;loseHp(s,h,n,why);const pl=P(s,pid);
  const at=living(pl).find(x=>hasEqN(x,"Ritual Athame")&&x.fl.athameRound!==s.round);
  if(at&&!s.over){at.fl.athameRound=s.round;const ts=inPlayTargets(s).filter(o=>!stealth(s,o)||ctrl(s,o)===pid);{const an=eqList(at).some(e=>e.name==="Ritual Athame"&&isUp(s,e))?2:1;ask(s,pid,`Ritual Athame: deal ${an} Dark damage to any target`,targetOpts(s,pid,ts,an).concat([{label:"No damage",v:null}]),"dmgTo",{n:an,name:"Ritual Athame",type:"Dark",src:at.uid})}}}
E.costHp=costHp;
ASK.dmgTo=(s,pid,pr,v)=>{if(v==null)return;const t=resolveTarget(s,v);if(!t)return;const src=pr.data.src?find(s,pr.data.src):null;damage(s,src?src.o:{name:pr.data.name,ctrl:pid},t,pr.data.n,{card:true,type:pr.data.type,pierce:pr.data.pierce,srcName:pr.data.name,noTrig:!src})};
/* Trophy Rack: a Barbarian you control destroyed an item or Equipment */
function trophy(s,byUid){const h=heroByUid(s,byUid);if(!h||!heroIs(h,"Barbarian"))return;const pl=P(s,h.owner);
  pl.inv.forEach(x=>{if(!x.fd&&x.name==="Trophy Rack"){x.ctr=x.ctr||{};if((x.ctr.trophy||0)<3){x.ctr.trophy=(x.ctr.trophy||0)+1;log(s,`Trophy Rack gets a Trophy counter (${x.ctr.trophy}).`,h.owner)}}})}
E.trophy=trophy;
ASK.destroyEq=(s,pid,pr,v)=>{const f=find(s,v);if(!f)return;destroyObj(s,f.o);trophy(s,pr.data.by)};
const trophies=pl=>pl.inv.reduce((n,x)=>n+(!x.fd&&x.name==="Trophy Rack"?((x.ctr&&x.ctr.trophy)||0):0),0);
/* Frog in the Throat: the Hero loses its own text until Dusk (its name no longer matches any Hero ability) */
E.silence=(s,h)=>{if(!h||h.kind!=="hero"||h.dead)return;if(!h.fl.frogName){h.fl.frogName=h.name;h.name=h.name+" (silenced)"}log(s,`${h.fl.frogName} loses all abilities for the rest of the turn.`)};
/* Null Stone: named card's activated abilities can't be activated */
function nulled(s,name){const n=String(name||"").replace(/ \(silenced\)$/,"");return s.p.some(pl=>pl.inv.some(o=>o.name==="Null Stone"&&!o.fd&&o.x&&o.x.name===n))}
E.nulled=nulled;
/* a copy of a Spell/Tactic/Song (Mirrored Chant, Echo Performer, Split Kick): resolves without being played or discarded */
function copyCard(s,pid,actorUid,id,targets,modes,x){log(s,`A copy of ${DB[id].name} resolves.`,pid);
  resolveCont(s,pid,{k:"card",actor:actorUid,card:{uid:nid(s),id,owner:pid},targets:targets||[],modes:modes||[],x:x||0,copy:true},{})}
E.copyCard=copyCard;
/* choose targets for a copy one slot at a time (the original target is offered first) */
function copyTargets(s,pid,data){const d=DB[data.id];const sc=SC()[d.name];const specs=sc?specsFor(sc,data.modes):[];const i=data.picked.length;
  if(i>=specs.length){copyCard(s,pid,data.actor,data.id,data.picked,data.modes,data.x);return}
  const actor=heroByUid(s,data.actor);const cs=candidates(s,pid,specs[i],{actor,card:d}).map(u=>resolveTarget(s,u)).filter(Boolean);
  const orig=data.orig&&data.orig[i];const harm=/damage|loses|Stun|Confus|Burn|Poison|Wound|destroy/i.test(d.rules||"");
  cs.sort((a,b)=>(b.uid===orig)-(a.uid===orig)||(harm?((ctrl(s,b)!==pid)-(ctrl(s,a)!==pid)):((ctrl(s,b)===pid)-(ctrl(s,a)===pid))));
  const opts=cs.map(o=>({label:(o.uid===orig?"Same target: ":"")+o.name+(o.kind==="summon"?" (summon)":"")+(o.kind==="player"?"":ctrl(s,o)===pid?" (yours)":""),v:o.uid}));
  if(!opts.length||specs[i].opt)opts.push({label:"No target",v:null});
  ask(s,pid,`${d.name} (copy): choose ${specs[i].label||labelFor(specs[i].k)}`,opts,"copyT",data)}
ASK.copyT=(s,pid,pr,v)=>{const data=JSON.parse(JSON.stringify(pr.data));data.picked.push(v);copyTargets(s,pid,data)};
E.copyTargets=copyTargets;
/* Pillage the Dead: equipment waiting to be placed */
ASK.pillage=(s,pid,pr,v)=>{const e=s.limbo&&s.limbo[pr.data.uid];if(!e)return;delete s.limbo[pr.data.uid];e.ctrl=pid;
  if(v==="inv"){toInv(s,pid,e);log(s,`${e.name} goes to ${P(s,pid).name}'s inventory.`,pid)}
  else if(v==="disc"){log(s,`${e.name} is discarded (to its owner's discard pile).`,pid);toDisc(s,e)}
  else{const h=heroByUid(s,v);if(h&&!h.dead){log(s,`Pillage the Dead: ${h.name} equips ${e.name} for free.`,pid);equipTo(s,h,e)}else toInv(s,pid,e)}};
/* Rapid Shot / Line It Up / Echo Performer bonus bookkeeping */
function endBonus(s){const b=s.bonus;s.bonus=null;if(b&&b.rapid){const h=heroByUid(s,b.uid);if(h&&!h.dead){h.ex=true;log(s,`${h.name} is exhausted (Rapid Shot).`,b.pid)}P(s,b.pid).fl.rapidPierce=false}}
E.endBonus=endBonus;
/* end-of-game summary: rounds, lineups (start / final order, level, died), top 5 damage, top 5 prevention, top healer per side */
E.gameStats=function(s){const st=s.stats||{dmg:[{},{}],prev:[{},{}],heal:[{},{}],start:[[],[]]};
  const top=(o,n)=>Object.entries(o||{}).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([name,v])=>({name,v}));
  const both=k=>[0,1].map(i=>top(st[k][i],99).map(x=>Object.assign({side:i},x))).flat().sort((a,b)=>b.v-a.v).slice(0,5);
  return{rounds:s.round,winner:s.winner,conceded:s.conceded,
    sides:s.p.map((pl,i)=>({name:pl.name,start:st.start[i]||[],final:pl.heroes.map(h=>({name:h.name,lvl:h.lvl,dead:!!h.dead})),
      dmg:top(st.dmg[i],5),prev:top(st.prev[i],5),healer:top(st.heal[i],1)[0]||null,
      totDmg:Object.values(st.dmg[i]||{}).reduce((a,b)=>a+b,0),totPrev:Object.values(st.prev[i]||{}).reduce((a,b)=>a+b,0),totHeal:Object.values(st.heal[i]||{}).reduce((a,b)=>a+b,0)})),
    topDmg:both("dmg"),topPrev:both("prev")}};
/* credit prevented damage: Guard (FIFO by source), equipment Guard, then DEF layers (card buffs, equipment, Hero/item effects); base DEF is not credited */
function creditGuard(s,h,n){const side=h.owner;h.gsrc=h.gsrc||[];while(n>0&&h.gsrc.length){const g=h.gsrc[0];const k=Math.min(g.n,n);stat(s,"prev",side,g.src,k);g.n-=k;n-=k;if(g.n<=0)h.gsrc.shift()}
  if(n>0)stat(s,"prev",side,"Guard",n)}
function defLayers(s,o){const L=[];
  (o.mods||[]).forEach(m=>{if(m.def>0)L.push([m.src||null,m.def])});
  if(o.kind==="hero"){eqList(o).forEach(e=>{if(e.pdef>0)L.push([e.name,e.pdef])});const pl=P(s,o.owner);
    if(o.name==="Sun Paladin"&&o.ex)L.push(["Sun Paladin",2]);const i=pl.heroes.indexOf(o);[pl.heroes[i-1],pl.heroes[i+1]].forEach(g=>{if(g&&g.name==="Holy Guardian"&&!g.dead&&g.ex)L.push(["Holy Guardian",1])});
    if(hasEqN(o,"Great Axe")&&enraged(s,o))L.push(["Great Axe",1])}
  if(o.kind==="summon"){const pl=P(s,o.ctrl);const hc=invCount(pl,"Horn Crystal"),bt=invCount(pl,"Barkskin Totem");if(hc)L.push(["Horn Crystal",hc]);if(bt)L.push(["Barkskin Totem",bt])}
  return L}
function creditDef(s,o,n){if(n<=0)return;const side=sideOf(s,o);for(const[src,k]of defLayers(s,o)){if(n<=0)break;const c=Math.min(k,n);n-=c;if(src)stat(s,"prev",side,src,c)}}
function addMod(o,m){o.mods=o.mods||[];
  /* update 23 Embolden: the next time an ally would gain Strength this turn, it gains double that instead */
  if(CUR_S&&m&&m.str>0&&o&&(o.kind==="hero"||o.kind==="summon")){const s=CUR_S;const pid=o.kind==="hero"?o.owner:o.ctrl;const pl=s.p[pid];const em=pl&&pl.fl.emb;if(em&&em.round===s.round&&em.n>0){em.n--;m=Object.assign({},m,{str:m.str*2});log(s,`Embolden: ${o.name} gains double (+${m.str} STR).`,pid)}}
if(CUR_SRC&&!m.src)m=Object.assign({src:CUR_SRC},m);o.mods.push(Object.assign({until:"dusk"},m))}
E.addMod=addMod;
function pay(s,pid,actor,amt){const pl=P(s,pid);pl.aura-=amt;if(amt<=0||!actor||actor.kind!=="hero")return;
  if(actor.ench.some(e=>e.name==="Blood Aura"))loseHp(s,actor,2,"Blood Aura");
  const op=P(s,opp(pid));if(invHas(op,"The Monolith"))loseHp(s,actor,amt,"The Monolith")}
E.pay=pay;
/* " (13/16 HP)" after a life total changes */
function hpTag(s,o){if(!o||(o.kind!=="hero"&&o.kind!=="summon"))return"";const m=maxHp(s,o);return` (${Math.max(0,m-(o.dmg||0))}/${m} HP)`}
function loseHp(s,o,n,why){if(!o||o.dead||n<=0)return;o.dmg=(o.dmg||0)+n;log(s,`${o.name} loses ${n} HP${why?` (${why})`:""}.${hpTag(s,o)}`);checkDeaths(s)}
E.loseHp=loseHp;
/* heal: pid = player whose source makes the heal (null for the Inn). An inverted heal is not a heal. */
function heal(s,healer,o,n,pid){
  if(!o||o.dead||n<=0)return 0;if(o.kind!=="hero"&&o.kind!=="summon")return 0;
  if(healer&&healer.kind==="hero"&&hasEqN(healer,"Sacred Vestments"))n+=1;
  const src=pid!=null?pid:(healer&&healer.kind==="hero"?healer.owner:(healer&&healer.ctrl!=null?healer.ctrl:null));
  const oc=ctrl(s,o);
  if(src!=null&&oc!==src&&invHas(P(s,src),"Inversion Stone")){log(s,`Inversion Stone turns the heal on ${o.name} into ${n} Light damage.`);damage(s,{name:"Inversion Stone"},o,n,{card:true,type:"Light",noTrig:true});return 0}
  if(o.fl&&o.fl.falseCure===s.round){o.fl.falseCure=null;log(s,`False Cure: the heal on ${o.name} becomes HP loss.`);loseHp(s,o,n,"False Cure");return 0}
  const h=Math.min(n,o.dmg||0);o.dmg-=h;if(h>0)log(s,`${o.name} heals ${h} HP.${hpTag(s,o)}`);
  if(h>0&&src!=null){const sp=P(s,src);sp.t.healed=(sp.t.healed||0)+h;stat(s,"heal",src,CUR_SRC||(healer&&healer.name)||"Heal",h)}
  if(h>0&&healer&&healer.kind==="hero"&&!healer.dead&&healer.name==="Radiant Oracle"&&h>=3)draw(s,healer.owner,1);
  /* Lightbringer L6: whenever you heal (any heal your side makes, not the Inn), deal that much Light damage */
  if(h>0&&src!=null&&!s._lb){const lb=living(P(s,src)).find(x=>x.name==="Lightbringer"&&x.lvl>=6);
    if(lb){const t=bestDamageTarget(s,src,h,{type:"Light"});if(t){s._lb=true;try{damage(s,lb,t,h,{type:"Light",card:true,noTrig:true,srcName:"Lightbringer"})}finally{s._lb=false}}else log(s,"Lightbringer: no enemy it can hurt.",src)}}
  return h}
/* picks the enemy the damage hurts most (skips targets Guard/DEF would block, Stealth, Cloak); prefers kills */
function bestDamageTarget(s,pid,n,o){o=o||{};const op=P(s,opp(pid));let best=null,bv=0;
  [...living(op),...op.bf.filter(x=>x.kind==="summon")].forEach(t=>{if(stealth(s,t)||cardProof(s,t))return;
    const g=t.kind==="hero"?t.guard+t.eqGuard:0;const a0=Math.max(0,n-g),pc=o.pierce||0;let eff=Math.max(0,a0-(o.ignoreDef?0:Math.max(0,defOf(s,t)-pc)));if(pc>0)eff=Math.max(eff,Math.min(pc,a0));const hp=hpOf(s,t);
    const v=eff<=0?0:Math.min(eff,hp)+(eff>=hp?50:0)+(t.kind==="hero"?5:0)-hp*0.01;if(v>bv){bv=v;best=t}});
  return best}
E.bestDamageTarget=bestDamageTarget;
E.heal=heal;
/* damage: o={combat,spell,pierce,ignoreDef,card,actor,type,noTrig} returns damage dealt */
function damage(s,src,tgt,amt,o){o=o||{};if(!tgt||tgt.dead)return 0;
  if(tgt.kind==="hero"&&tgt.fl.noDmgRound===s.round&&!o.status){log(s,`${tgt.name} takes no damage (prevented).`);stat(s,"prev",tgt.owner,tgt.fl.noDmgBy||"Damage prevention",amt);return 0}
  let a=Math.max(0,amt);
  if(tgt.kind==="hero"){const tp=P(s,tgt.owner);if(tp.fl.preventNext&&(o.card||o.combat)&&ctrl(s,src||tgt)!==tgt.owner){tp.fl.preventNext=false;log(s,`Smoke Trail Arrow prevents the damage to ${tgt.name}.`);stat(s,"prev",tgt.owner,"Smoke Trail Arrow",amt);return 0}
    let g=tgt.guard;const ga=Math.min(g,a);tgt.guard-=ga;a-=ga;const ge=Math.min(tgt.eqGuard,a);tgt.eqGuard-=ge;a-=ge;
    if(ga>0)creditGuard(s,tgt,ga);if(ge>0){const ge1=eqList(tgt).find(e=>/Guard 1/.test(def(e).rules||""));stat(s,"prev",tgt.owner,ge1?ge1.name:"Equipment Guard",ge)}}
  if(src&&src.kind==="hero"&&tgt.kind==="summon"&&hasEqN(src,"Silver Edge"))a*=2; /* Set 2 Silver Edge: double damage to summons */
  let d=defOf(s,tgt);let pierce=o.pierce||0;
  if(tgt.kind==="hero"&&hasEqN(tgt,"Unpiercing Chestplate"))pierce=0;
  if(o.ignoreDef)d=0;else d=Math.max(0,d-pierce);
  let dealt=Math.max(0,a-d);
  /* Piercing punches through: at least X of the damage always gets through, however much DEF the target has (Nov 12, 2026) */
  if(pierce>0&&!o.ignoreDef)dealt=Math.max(dealt,Math.min(pierce,a));
  if(dealt>0){const w=wardFor(s,tgt);if(w){w.prot--;log(s,`Warded Cloak prevents ${dealt} damage to ${tgt.name} (${w.prot} protection counter${w.prot===1?"":"s"} left).`);stat(s,"prev",tgt.owner,"Warded Cloak",dealt);dealt=0;a=0}}
  tgt.dmg=(tgt.dmg||0)+dealt;
  if(!o.ignoreDef&&a>dealt)creditDef(s,tgt,a-dealt);
  if(dealt>0){s.dmgTo=s.dmgTo||null;if(s.dmgTo){const sd=ctrl(s,tgt);s.dmgTo[sd]=(s.dmgTo[sd]||0)+dealt}}
  /* Scrap Metal: this Hero's damage to an enemy Hero destroys a piece of its equipment */
  if(dealt>0&&src&&src.kind==="hero"&&src.fl&&src.fl.scrapRound===s.round&&tgt.kind==="hero"&&ctrl(s,tgt)!==src.owner){const eq=eqList(tgt);if(eq.length)ask(s,src.owner,`Scrap Metal: destroy one of ${tgt.name}'s equipment`,eq.map(e=>({label:e.name,v:e.uid})),"destroyEq",{by:src.uid,name:"Scrap Metal"})}
  if(dealt>0){let side=sideOf(s,src);if(side==null)side=opp(ctrl(s,tgt));
    const nm=o.srcName||(o.combat&&src?(o.band?"Band attack":src.name+" (attack)"):(CUR_SRC||(src&&src.name)));if(!o.status)stat(s,"dmg",side,nm,dealt)}
  const tn=tgt.name+(tgt.kind==="summon"?" (summon)":"");
  log(s,`${src?src.name:"Effect"} deals ${dealt}${o.type?" "+o.type:""} damage to ${tn}${amt!==dealt?` (${amt} before DEF)`:""}.${dealt>0?hpTag(s,tgt):""}`);
  if(dealt>0&&tgt.kind==="hero"){const tp=P(s,tgt.owner);const before=tp.t.took||0;tp.t.took=before+dealt;if(before<10&&tp.t.took>=10&&s.phase==="battle"){s.trig10=(s.trig10||[]).concat([tgt.owner])}if(tgt.fl.loseCtrlRound===s.round){if(hpOf(s,tgt)<1)tgt.dmg=maxHp(s,tgt)-1;tgt.ex=false}}
  if(src&&!o.noTrig){
    if(dealt>0&&lifelink(s,src)){const room=src.kind==="hero"?Math.min(dealt,src.dmg||0):dealt;heal(s,src,src,dealt);
      if(src.kind==="hero"&&hasUpN(s,src,"Ring of Radiance")&&dealt>room){const t=living(P(s,src.owner)).filter(h=>h!==src&&h.dmg>0).sort((a,b)=>b.dmg-a.dmg)[0];if(t)heal(s,src,t,dealt-room)}}
    const pz=(o.poisonous==="dmg"?dealt:0)+poisonous(s,src,dealt);if(pz&&tgt.st)addStatus(s,tgt,"poison",pz); /* update 16: Poisonous stacks (Poison the target X times) */
    if(src.kind==="hero"){
      if(dealt>0&&src.name==="Void Binder"){const dp=P(s,ctrl(s,tgt));const r=Math.min(1,dp.aura);dp.aura-=r;if(r)log(s,`Void Binder removes ${r} Aura from ${dp.name}.`)}
      if(dealt>0&&src.name==="Sanctifier"){const t=autoTarget(s,src.owner,"statusAlly");if(t)removeStatus(s,t,1)}
      if(src.fl.bruisedRound===s.round&&dealt>0&&tgt.st)addStatus(s,tgt,"wound",1);
      /* Mind Rend (update 21): the damaged party discards a card (its owner chooses) */
      if(src.fl.rendRound===s.round&&dealt>0){const dp=ctrl(s,tgt);const dpl=P(s,dp);if(dpl.hand.length){log(s,`Mind Rend: ${dpl.name} discards a card.`);pushChoose(s,dp,{title:"Mind Rend: discard a card",cards:dpl.hand.map(c=>c.uid),min:1,max:1,op:"discard"})}}
      if(o.combat&&dealt>0){const th=eqList(src).filter(e=>e.name==="Thief's Dagger").reduce((n,e)=>n+(isUp(s,e)?2:1),0);if(th)stealGold(s,src.owner,ctrl(s,tgt),th,"Thief's Dagger")} /* update 18 */
      if(o.combat&&dealt>0)eqList(src).forEach(e=>{if(e.x&&e.x.stun&&tgt.st)addStatus(s,tgt,"stun",1)});
      if(o.combat&&dealt>0&&(hasEqN(src,"Hammer of Ruin")||hasEqN(src,"Hammer"))){const dp=P(s,ctrl(s,tgt));let it=dp.inv.find(x=>!x.fd&&x.kind!=="equip");
        /* upgraded Hammer of Ruin: an item or a piece of equipment (picks the most expensive) */
        if(hasUpN(s,src,"Hammer of Ruin")){const c=[...dp.inv.filter(x=>!x.fd&&x.kind!=="doll"),...living(dp).flatMap(h=>eqList(h))];c.sort((a,b)=>num(def(b).cost||b.cost)-num(def(a).cost||a.cost));it=c[0]||null}
        if(it){if(it.kind==="equip")log(s,`Hammer of Ruin destroys ${it.name}.`);destroyObj(s,it);trophy(s,src.uid)}}
    }
      /* update 29: The Reaper Cleaver, if this Hero deals 7 or more damage to a Hero, ready it */
    if(src.kind==="hero"&&dealt>=7&&tgt.kind==="hero"&&src.ex&&!src.dead&&hasEqN(src,"The Reaper Cleaver")){src.ex=false;log(s,`The Reaper Cleaver: ${src.name} dealt ${dealt} damage to ${tgt.name} and readies.`)}
    if(src.kind==="summon"&&src.name==="Woods Beast"&&dealt>0)draw(s,src.ctrl,1);
  }
  checkDeaths(s);return dealt}
E.damage=damage;
/* Steal X Gold (update 18): the target party loses up to X Gold and you gain that much */
function stealGold(s,pid,from,n,why){if(from==null||from===pid)return 0;const fp=P(s,from),tp=P(s,pid);const g=Math.max(0,Math.min(n,fp.gold||0));fp.gold-=g;tp.gold+=g;log(s,`${why?why+": ":""}${tp.name} steals ${g} Gold from ${fp.name}.`,pid);return g}
E.stealGold=stealGold;
/* update 23 Tip: gain 1 Gold, only once per round (Undeniable Performance: it comes out of an opposing party's Gold) */
function tip(s,pid,why){const pl=P(s,pid);if(pl.fl.tipRound===s.round){log(s,`${why||"Tip"}: ${pl.name} already got a Tip this round.`,pid);return 0}pl.fl.tipRound=s.round;
  if(pl.fl.tipFromRound===s.round){const g=stealGold(s,pid,opp(pid),1,(why||"Tip")+" (Undeniable Performance)");if(!g)log(s,`${why||"Tip"}: the opposing party has no Gold to tip.`,pid);return g}
  pl.gold+=1;log(s,`${why||"Tip"}: ${pl.name} gains 1 Gold (now ${pl.gold}).`,pid);return 1}
E.tip=tip;
function removeStatus(s,o,n){let r=0;for(let i=0;i<n;i++){const k=STATUS.find(k=>o.st[k]>0);if(!k)break;o.st[k]--;r++}if(r)log(s,`${o.name}: ${r} status counter${r>1?"s":""} removed.`);return r}
E.removeStatus=removeStatus;

/* ---------- death / destroy ---------- */
/* update 24 meditation: when a Meditating Hero readies (any way), remove its meditation counters; its party gains that much Aura and it gets +1 STR per counter until Dusk */
function medWake(s,h){if(!h||h.kind!=="hero"||!h.med)return;h.med=false;h.keepMed=true;const n=h.plus||0;h.plus=0;
  if(n>0){P(s,h.owner).aura+=n;addMod(h,{str:n,src:"Meditation"});log(s,`${h.name} stops Meditating: ${P(s,h.owner).name} gains ${n} Aura and ${h.name} gets +${n} STR until Dusk.`,h.owner)}
  else log(s,`${h.name} stops Meditating.`,h.owner)}
E.medWake=medWake;
/* puts a Hero into Meditation (exhausts it) */
E.meditate=(s,h)=>{if(!h||h.dead)return;h.ex=true;h.med=true;h.keepMed=true;log(s,`${h.name} is Meditating.`,h.owner)};
function checkDeaths(s){s.p.forEach(pl=>pl.heroes.forEach(h=>{if(h.med&&!h.ex&&!h.dead)medWake(s,h)}));let again=true;while(again){again=false;
  for(let pid=0;pid<s.p.length;pid++){const pl=s.p[pid];
    for(const h of pl.heroes)if(!h.dead&&hpOf(s,h)<=0){if(dyingWindow(s,h))continue;die(s,h);again=true}
    for(const o of pl.bf.slice())if(o.kind==="summon"&&hpOf(s,o)<=0){if(pl.t.shelter){o.dmg=maxHp(s,o)-1;log(s,`${o.name} can't be destroyed this turn (Shelter from the Storm); it stays at 1 HP.`,pid);continue}destroyObj(s,o);again=true}
    for(const o of pl.inv.slice())if(o.kind==="doll"&&hpOf(s,o)<=0){destroyObj(s,o);again=true}}}
  checkWin(s)}
E.checkDeaths=checkDeaths;
/* "would die" Hidden cards (Die Swinging, Self Sacrifice for the owner; then Pillage the Dead for the opponent) */
function dyingWindow(s,h){if(h.fl.dyingDone||s.over)return false;h.fl.dyingDone=true;
  const tr={kind:"dying",hero:h.uid,pid:h.owner};
  if(windowFor(s,h.owner,tr)){s.pend.unshift({type:"window",pid:h.owner,trig:tr,cont:{k:"dying",hero:h.uid,stage:1},mods:{}});log(s,`${h.name} is about to die. ${P(s,h.owner).name} may respond with a Hidden card…`);return true}
  if(windowFor(s,opp(h.owner),tr)){s.pend.unshift({type:"window",pid:opp(h.owner),trig:tr,cont:{k:"dying",hero:h.uid,stage:2},mods:{}});log(s,`${h.name} is about to die. ${P(s,opp(h.owner)).name} may respond with a Hidden card…`);return true}
  return false}
function die(s,h){const pl=P(s,h.owner);h.fl.dyingDone=false;pl.t.died=(pl.t.died||[]).concat([h.uid]);
  h.dead=true;h.dmg=maxHp(s,h);h.ex=false;h.med=false;h.plus=0;h.mods=[];h.guard=0;h.gsrc=[];h.eqGuard=0;STATUS.forEach(k=>h.st[k]=0);
  log(s,`☠ ${h.name} dies.`,h.owner);
  const gear=eqList(h);for(const k in h.eq)h.eq[k]=null;
  h.ench.forEach(e=>toDisc(s,e));h.ench=[];
  const pil=s.pillage&&s.pillage.pid!==h.owner?s.pillage:null;
  if(pil){s.pillage=null;log(s,`Pillage the Dead: ${P(s,pil.pid).name} takes ${h.name}'s equipment.`);s.limbo=s.limbo||{};
    gear.slice().reverse().forEach(e=>{e.ctrl=pil.pid;s.limbo[e.uid]=e;const hs=living(P(s,pil.pid)).filter(x=>canUseEq(s,x,e));
      ask(s,pil.pid,`Pillage the Dead: ${e.name}`,hs.map(x=>({label:`Equip to ${x.name} (free)`,v:x.uid})).concat([{label:"Put it in your inventory",v:"inv"},{label:"Discard it",v:"disc"}]),"pillage",{uid:e.uid,name:"Pillage the Dead"})})}
  else gear.forEach(e=>toInv(s,h.owner,e));
  if(h.name==="Verdant Sage")makeSummon(s,h.owner,"Spectral Elk");
  if(heroIs(h,"Barbarian"))pl.inv.forEach(x=>{if(!x.fd&&x.name==="Warrior's Pyre"){x.ctr=x.ctr||{};if(true){x.ctr.fury=(x.ctr.fury||0)+1;log(s,`Warrior's Pyre gets a Fury counter (${x.ctr.fury}).`,h.owner)}}});
  s.p.forEach((_,i)=>overflow(s,i));
}
function toDisc(s,o){const owner=o.owner;if(o.tok)return;const pl=P(s,owner);pl.disc.push({uid:o.uid,id:(DB[o.id]&&DB[o.id].made)||o.id,owner})}
function toInv(s,pid,o){const pl=P(s,pid);pl.inv.push(o);overflow(s,pid)}
E.toInv=toInv;
/* a discard-pile entry is only {uid,id,owner}; rebuild a full inventory object before it goes back to inventory (fixes Refire showing "undefined") */
function invObj(s,pid,c){const d=DB[c.id];if(!d)return c;if(d.kind==="equip")return eqObjFromCard(s,pid,c);return Object.assign({kind:"card",fd:false,name:d.name,ctr:{}},c)}
E.invObj=invObj;
function overflow(s,pid){const pl=P(s,pid);const cap=E.slots(s,pid);
  while(pl.inv.length>cap){let worst=0,wv=1e9;pl.inv.forEach((o,i)=>{const v=o.tok?-1:(num(def(o).cost)+(o.kind==="equip"?2:0));if(v<wv){wv=v;worst=i}});
    const o=pl.inv.splice(worst,1)[0];log(s,`Inventory full: ${pl.name} discards ${o.fd?"a face-down card":o.name}.`,pid);toDisc(s,o)}}
function destroyObj(s,o,exile){const f=find(s,o.uid);if(!f)return;const pl=P(s,f.pid);
  if(f.zone==="bf"){pl.bf.splice(pl.bf.indexOf(o),1)}
  else if(f.zone==="inv"){pl.inv.splice(pl.inv.indexOf(o),1)}
  else if(f.zone==="eq"){f.hero.eq[f.slot]=null;if(f.slot==="H1"&&f.hero.eq.H2==="2H")f.hero.eq.H2=null;
    if(o.name==="Sword of Eliazar"&&!exile){const m=makeSummon(s,f.pid,"Eliazar");if(isUp(s,o)){m.str+=1;m.hp+=1;log(s,`Upgraded Sword of Eliazar: Eliazar is ${m.str}/${m.hp}.`,f.pid)}}}
  else if(f.zone==="ench"){f.hero.ench.splice(f.hero.ench.indexOf(o),1)}
  log(s,`${o.name}${o.kind==="summon"?" (summon)":""} is ${exile?"exiled":"destroyed"}.`);
  /* UI event: the Play tab shows a "destroyed" pop-up for each of these */
  if(!exile){s.fxN=(s.fxN||0)+1;s.fx=(s.fx||[]).concat([{n:s.fxN,k:"destroy",id:o.id||null,name:o.name,kind:o.kind,pid:f.pid}]).slice(-12)}
  if(o.kind==="summon"){const c=o.ctrl;
    if(o.name==="Aurawing Familiar"){P(s,c).aura+=1;log(s,`${P(s,c).name} gains 1 Aura.`)}
    if(o.name==="Drawwing Familiar")draw(s,c,1);
    if(o.name==="Spore"){const h=P(s,c).hand;if(h.length){const i=ri(s,h.length);const x=h.splice(i,1)[0];P(s,c).disc.push(x);log(s,`Spore: ${P(s,c).name} discards ${DB[x.id].name}.`)}}
    return}
  if(o.tok||o.kind==="pillar"||o.kind==="doll")return;
  if(o.under&&o.under.length){o.under.forEach(c=>P(s,c.owner).disc.push(c));o.under=[]}
  const ow=P(s,o.owner);if(exile)ow.exile.push({uid:o.uid,id:(DB[o.id]&&DB[o.id].made)||o.id,owner:o.owner});else toDisc(s,o)}
E.destroyObj=destroyObj;
function checkWin(s){if(s.over)return;const dead=s.p.map(pl=>pl.heroes.every(h=>h.dead));
  if(dead[0]||dead[1]){s.over=true;s.winner=dead[0]&&dead[1]?-1:(dead[0]?1:0);s.pend=[];s.cur=null;s.qatk=null;
    log(s,s.winner<0?"Both parties fall. The game is a draw.":`🏆 ${s.p[s.winner].name} wins!`);}}

/* ---------- tokens / summons ---------- */
function makeSummon(s,pid,name,ready){const t=TOK[name]||{str:2,hp:2,sub:""};const o={uid:nid(s),kind:"summon",name,str:t.str,hp:t.hp,sub:t.sub||"",dmg:0,ex:!ready,ctrl:pid,owner:pid,tok:true,st:{burn:0,poison:0,wound:0,confuse:0,stun:0},mods:[],fl:{}};
  if(/\bStealth\b/.test(t.rules||""))o.stealth=true; /* update 29: summons that enter with Stealth (Woods Beast, Great Rootfolk) */
  P(s,pid).bf.push(o);log(s,`${P(s,pid).name} summons ${/^[AEIOU]/.test(name)?"an":"a"} ${name} (${t.str}/${t.hp}).`,pid);
  /* Barkborn: gains DEF equal to its HP until Dusk; stacks */
  {const pl=P(s,pid);const n=(/Barkborn/.test(t.rules||"")?1:0)+(pl.t.nextBark||0)+(pl.t.allBark||0);pl.t.nextBark=0;
   if(n>0){addMod(o,{def:n*o.hp});log(s,`${name} has Barkborn${n>1?" ×"+n:""}: +${n*o.hp} DEF this turn.`,pid)}}
  return o}
function makePillar(s,pid,name){const o={uid:nid(s),kind:"pillar",name,ctrl:pid,owner:pid,tok:true};P(s,pid).bf.push(o);log(s,`${P(s,pid).name} conjures a ${name}.`,pid);return o}
function makeEqToken(s,pid,name,x){const t=TOK[name];return{uid:nid(s),kind:"equip",id:null,name,cls:t.cls,region:t.region,pstr:t.str,pdef:0,cost:t.cost,owner:pid,tok:true,x:x||null}}
E.makeSummon=makeSummon;E.makePillar=makePillar;E.makeEqToken=makeEqToken;
E.makeDoll=(s,pid)=>{const o={uid:nid(s),kind:"doll",name:"Doll",dmg:0,owner:pid,tok:true,st:{burn:0,poison:0,wound:0,confuse:0,stun:0},mods:[]};toInv(s,pid,o);log(s,`${P(s,pid).name} creates a Doll.`,pid);return o};
E.copySummon=(s,pid,o,bonus)=>{const c=makeSummon(s,pid,o.name);c.str=o.str+(bonus||0);c.hp=o.hp+(bonus||0);return c};

/* ---------- equipment ---------- */
function eqObjFromCard(s,pid,card){const d=DB[card.id];const up=d.up&&s.upg&&s.upg[card.uid]!=null?d.up:null;return{uid:card.uid,kind:"equip",id:card.id,name:d.name,cls:d.cls,region:d.region,pstr:up?up.pstr:d.pstr,pdef:up?up.pdef:d.pdef,cost:num(d.cost),owner:card.owner,tok:false,x:null}}
E.eqObjFromCard=eqObjFromCard;
function canUseEq(s,h,e){if(!h||h.kind!=="hero"||h.dead)return false;
  const cls=e.cls;if(cls!=="Generic"&&!heroIs(h,cls))return false;
  const r=def(e).rules||"";{const lm=/Must be Level (\d)/.exec(r);if(lm&&h.lvl<+lm[1])return false}if(/1 or more STR/.test(r)&&strOf(s,h)<1)return false;return true}
E.canUseEq=canUseEq;
function heroIs(h,cls){if(h.cls===cls)return true;return eqList(h).some(e=>e.name==="Ring of Vocation"&&e.x&&e.x.cls===cls)}
E.heroIs=heroIs;
function equipTo(s,h,e){const pid=h.owner;const r=e.region;let slot;
  const displaced=[];
  if(r==="Two-Handed"){if(h.eq.H1)displaced.push(h.eq.H1);if(h.eq.H2&&h.eq.H2!=="2H")displaced.push(h.eq.H2);h.eq.H1=e;h.eq.H2="2H";slot="H1"}
  else if(r==="One-Handed"){if(h.eq.H2==="2H"){displaced.push(h.eq.H1);h.eq.H1=e;h.eq.H2=null}
    else if(!h.eq.H1)h.eq.H1=e;else if(!h.eq.H2)h.eq.H2=e;else{displaced.push(h.eq.H1);h.eq.H1=e}}
  else{const k=r in h.eq?r:"Accessory";if(h.eq[k])displaced.push(h.eq[k]);h.eq[k]=e}
  e.ctrl=pid;
  h.eqGuard+=eqGuardOf(s,e);
  log(s,`${h.name} equips ${e.name}${isUp(s,e)?" (upgraded)":""}.`,pid);
  if(e.name==="Shimmering Cloak"){const x=P(s,pid).t.healed||0;if(x>0){addMod(h,{def:x});log(s,`Shimmering Cloak: ${h.name} gains +${x} DEF this turn (${x} HP healed this turn).`,pid)}else log(s,"Shimmering Cloak: no healing yet this turn, so no DEF bonus.",pid)}
  displaced.forEach(d=>{if(d&&d!=="2H"){log(s,`${d.name} goes to inventory.`,pid);toInv(s,pid,d)}})}
E.equipTo=equipTo;
function unequip(s,e){const f=find(s,e.uid);if(!f||f.zone!=="eq")return;f.hero.eq[f.slot]=null;if(f.slot==="H1"&&f.hero.eq.H2==="2H")f.hero.eq.H2=null;toInv(s,f.hero.owner,e);log(s,`${e.name} is unequipped from ${f.hero.name}.`)}
E.unequip=unequip;
function eqCost(s,h,e){let c=e.tok?(e.cost||0):num(def(e).cost);
  if(h.name==="Blessed Champion")c-=h.lvl>=3?2:1;c+=burden(h);return Math.max(0,c)}
E.eqCost=eqCost;
const burden=h=>h.ench.filter(e=>e.name==="Slow Down").length; /* update 21: Slow Down (old Burden text) = +1 Aura per copy */
/* update 21: Burden = whenever that Hero plays a card, activates an ability or attacks, Fatigue it */
function burdenFat(s,h){if(!h||h.kind!=="hero"||h.dead||!(h.ench||[]).some(e=>e.name==="Burden"))return;h.fat=(h.fat||0)+1;h.fl.fatRested=false;log(s,`Burden: ${h.name} is Fatigued (it won't ready at the next Dawn).`,h.owner)}
E.burdenFat=burdenFat;
/* update 21: Chains of Darkness = that Hero is Confused while it's attached, and must pay 1 Aura to attack */
const chained=h=>!!(h&&h.kind==="hero"&&(h.ench||[]).some(e=>e.name==="Chains of Darkness"));E.chained=chained;
const confused=h=>!!(h&&((h.st&&h.st.confuse>0)||chained(h)));E.confused=confused;

/* ---------- costs ---------- */
function cardCost(s,pid,actor,d,x){let c=d.cost==="X"?(x||0):num(d.cost);const pl=P(s,pid);
  if(d.kind==="equip"&&actor&&actor.name==="Blessed Champion")c-=actor.lvl>=3?2:1;
  if(d.cls==="Mage"){if(pl.fl.mageNext)c-=2;if(pl.fl.mageAll)c-=1}
  if(d.sub==="Trap"){if(pl.fl.trapNext)c-=2;if(pl.fl.trapAll)c-=1}
  if(d.type==="Song"){if(actor&&hasEqN(actor,"Silver Fiddle"))c-=1;if(pl.fl.songDisc)c-=2}
  if(actor&&actor.kind==="hero"&&eqList(actor).some(e=>e.name==="Ring of Vocation"&&e.x&&e.x.cls===d.cls&&isUp(s,e)))c-=1;
  if(d.type==="Summon"&&actor&&hasEqN(actor,"Antler Crown")&&actor.fl.antler!==s.round)c-=1;
  if(d.sub==="Combo"&&pl.fl.petalDisc)c-=1;
  if(d.type==="Recipe"&&actor&&hasEqN(actor,"Toolbelt"))c-=1; /* Set 2 Toolbelt */
  if(actor&&actor.kind==="hero")c+=burden(actor);
  if(d.cls!=="Warlock"){s.p.forEach(p2=>{c+=invCount(p2,"Sphere of Hindrance")})}
  return Math.max(0,c)}
E.cardCost=cardCost;
function consumeCostFlags(s,pid,actor,d){const pl=P(s,pid);
  if(d.cls==="Mage"&&pl.fl.mageNext)pl.fl.mageNext=false;
  if(d.sub==="Trap"&&pl.fl.trapNext)pl.fl.trapNext=false;
  if(d.type==="Summon"&&actor&&hasEqN(actor,"Antler Crown")){if(actor.fl.antler!==s.round&&hasUpN(s,actor,"Antler Crown"))pl.t.nextBark=(pl.t.nextBark||0)+1;actor.fl.antler=s.round}
  /* Petal Shrine waits for a Combo card it can actually make cheaper */
  if(d.sub==="Combo"&&pl.fl.petalDisc&&(d.cost==="X"||num(d.cost)>0))pl.fl.petalDisc=false}

/* ---------- targeting ---------- */
/* spec: {k:kind,f:filter(s,o,ctx),opt,label,self} kinds: any enemy ally hero enemyHero allyHero summon enemySummon allySummon
   item equip enemyEquip allyEquip ench pillar allyPillar nonHero player enemyPlayer deadAlly meditating allyHeroOther anyOther */
function inPlayTargets(s){const out=[];s.p.forEach((pl,pid)=>{pl.heroes.forEach(h=>{if(!h.dead)out.push(h)});pl.bf.forEach(o=>{if(o.kind==="summon")out.push(o)});pl.inv.forEach(o=>{if(o.kind==="doll")out.push(o)})});return out}
function candidates(s,pid,spec,ctx){ctx=ctx||{};const viaCard=!ctx.attack;let list=[];const k=spec.k;
  const isEnemy=o=>ctrl(s,o)!==pid;
  if(k==="player"||k==="enemyPlayer"||k==="allyPlayer"){return[0,1].filter(p=>k==="player"||(k==="enemyPlayer"?p!==pid:p===pid)).map(p=>"P"+p)}
  if(["any","enemy","ally","hero","enemyHero","allyHero","summon","enemySummon","allySummon","allyHeroOther","anyOther","meditating"].includes(k)){
    list=inPlayTargets(s).filter(o=>{
      if(k.includes("Hero")||k==="hero"||k==="meditating"){if(o.kind!=="hero")return false}
      if(/[sS]ummon/.test(k)&&o.kind!=="summon")return false;
      if(k.startsWith("enemy")&&!isEnemy(o))return false;
      if(k.startsWith("ally")&&isEnemy(o))return false;
      if((k==="allyHeroOther"||k==="anyOther")&&ctx.actor&&o.uid===ctx.actor.uid)return false;
      if(k==="meditating"&&(isEnemy(o)||!o.med))return false;
      return true})}
  else if(k==="deadAlly"){list=P(s,pid).heroes.filter(h=>h.dead&&!h.surr)}
  else if(k==="deadAny"){list=[];s.p.forEach(pl=>pl.heroes.forEach(h=>{if(h.dead&&!h.surr)list.push(h)}))}
  else{const objs=allObjs(s);
    if(k==="item")list=objs.filter(o=>(o.kind==="card"&&!o.fd&&def(o).type==="Item")||o.kind==="doll"||(o.kind==="card"&&o.fd&&isEnemy(o)));
    else if(k==="equip"||k==="enemyEquip"||k==="allyEquip"||k==="equipped")list=objs.filter(o=>o.kind==="equip"&&find(s,o.uid).zone==="eq"&&(k!=="enemyEquip"||isEnemy(o))&&(k!=="allyEquip"||!isEnemy(o)));
    else if(k==="anyEquip")list=objs.filter(o=>o.kind==="equip");
    else if(k==="ench")list=objs.filter(o=>find(s,o.uid).zone==="ench");
    else if(k==="pillar"||k==="allyPillar")list=objs.filter(o=>o.kind==="pillar"&&(k==="pillar"||!isEnemy(o)));
    else if(k==="nonHero")list=objs.filter(o=>o.kind!=="hero"&&(!o.fd||isEnemy(o)));
  }
  list=list.filter(o=>{
    if((o.kind==="hero"||o.kind==="summon")&&isEnemy(o)&&stealth(s,o)&&!o.dead&&viaCard)return false; /* update 29: Stealth summons too */
    if(!viaCard&&o.kind==="hero"&&isEnemy(o)&&modHas(o,"noAttack"))return false; /* Levitate: can't be attacked this turn */ /* Stealth: can't be targeted by enemy cards or abilities, but can be attacked */
    if(viaCard&&cardProof(s,o,isEnemy(o)))return false;
    if(viaCard&&o.kind==="hero"&&isEnemy(o)&&(!ctx.card||ctx.card.type==="Spell")&&hasEqN(o,"Warded Cloak"))return false; /* Set 2 Warded Cloak: not by your opponents' spells or abilities */
    if(viaCard&&o.kind==="hero"&&isEnemy(o)&&ctx.card&&ctx.card.type==="Spell"&&hasUpN(s,o,"Helm of Protection"))return false; /* update 26: upgraded Helm of Protection */
    if(viaCard&&o.kind==="card"&&/can't be targeted/i.test(def(o).rules||"")&&def(o).type==="Item")return false; /* Arrow of Craftsmanship */
    if(spec.f&&!spec.f(s,o,ctx))return false;return true});
  /* Dazzling Melody: enemies must target the taunting Hero with attacks, cards and abilities (when it is a legal choice) */
  const op=P(s,opp(pid));const taunt=op.heroes.find(h=>!h.dead&&h.fl.tauntRound===s.round);
  if(taunt&&list.some(o=>o.uid===taunt.uid)&&list.some(o=>isEnemy(o)))list=list.filter(o=>!isEnemy(o)||o.uid===taunt.uid);
  /* Breastplate of Bravery (update 26: base and upgrade): opposing attacks must target the equipped Hero (attacks only) */
  if(!viaCard){const bb=op.heroes.find(h=>!h.dead&&hasEqN(h,"Breastplate of Bravery"));if(bb&&list.some(o=>o.uid===bb.uid))list=list.filter(o=>!isEnemy(o)||o.uid===bb.uid)}
  return list.map(o=>o.uid)}
E.candidates=candidates;
function resolveTarget(s,t){if(typeof t==="string"&&t[0]==="P")return{kind:"player",pid:+t.slice(1),name:s.p[+t.slice(1)].name};const f=find(s,t);return f?f.o:null}
E.resolveTarget=resolveTarget;

/* ---------- actor / priority ---------- */
function actorFor(s,pid){const pl=P(s,pid);
  if(s.bonus&&s.bonus.pid===pid){const h=pl.heroes.find(h=>h.uid===s.bonus.uid);if(h&&!h.dead&&(!h.ex||s.bonus.allowEx))return h}
  /* a Hero can't take two actions in a row while another of your Heroes is ready: skip the one that took your last action */
  const order=actorOrder(s,pid);const last=pl.t&&pl.t.lastActor;
  return order.find(h=>h.uid!==last)||order[0]||null}
function actorOrder(s,pid){const pl=P(s,pid);const out=[];const add=h=>{if(h&&!out.includes(h))out.push(h)};
  /* Step Back: a stepped-back Hero keeps its place but acts last (the "Last" step after the Closer).
     It is skipped at Lead/Center/Closer unless no other Hero of that party is ready. */
  const n=pl.heroes.length,ok=h=>!h.dead&&!h.ex,back=h=>h.fl.stepped===s.round;
  if(s.pos===3){pl.heroes.filter(h=>ok(h)&&back(h)).forEach(add);pl.heroes.filter(ok).forEach(add);return out}
  for(let i=0;i<n;i++){const h=pl.heroes[(s.pos+i)%n];if(ok(h)&&!back(h))add(h)}
  pl.heroes.filter(h=>ok(h)&&back(h)).forEach(add);return out}
E.actorFor=actorFor;
const canPlayCards=h=>h&&!h.st.stun&&h.name!=="Dum Dum";
function canPlayCard(s,pid,actor,c,free){const d=DB[c.id];if(!d||!actor)return false;
  if(!canPlayCards(actor))return false;
  if(d.cls!=="Generic"&&!heroIs(actor,d.cls))return false;
  if(d.type==="Item"&&P(s,pid).inv.length>=E.slots(s,pid)&&d.sup!=="Hidden")return false;
  if(d.sup==="Hidden"&&P(s,pid).inv.length>=E.slots(s,pid))return false;
  if(d.kind==="equip"){const e={cls:d.cls,id:d.id};if(!canUseEq(s,actor,Object.assign({},d,{id:d.id})))return false}
  const sc=SC()[d.name];
  if(sc&&sc.can&&d.sup!=="Hidden"&&!sc.can(s,pid,actor))return false;
  if(d.type==="Recipe"&&!craftPlan(s,pid,actor,d))return false; /* Set 2 Craft: the ingredients must be there */
  if(free)return true;
  const minX=0;return cardCost(s,pid,actor,d,minX)<=P(s,pid).aura}
E.canPlayCard=canPlayCard;

/* ---------- options ---------- */
E.options=function(s,pid){
  if(s.over)return[];
  if(s.pend.length){const pr=s.pend[0];if(pr.pid!==pid)return[];return promptOptions(s,pid,pr)}
  if(s.phase==="mull"){const pl=P(s,pid);if(pl.mullDone)return[];return[{type:"keep"},{type:"mull"}]}
  if(s.phase==="dawn"){if(s.dawnDone[pid])return[];const pl=P(s,pid);const out=[];
    pl.inv.forEach(o=>{if(!o.fd&&def(o).sub==="Gemstone")living(pl).filter(h=>!h.ex).forEach(h=>out.push({type:"gem",uid:o.uid,hero:h.uid}))});
    pl.heroes.forEach(h=>{if(h.med&&!h.dead)out.push({type:"wake",hero:h.uid,v:h.keepMed})});
    out.push({type:"dawnDone"});return out}
  if(s.phase==="town"){if(!s.town||s.town.order[s.town.i]!==pid)return[];const pl=P(s,pid);const out=[];
    const used=s.town.used||{};
    if(pl.gold>=5&&!used.inn)living(pl).forEach(h=>{if(h.dmg>0)out.push({type:"inn",hero:h.uid})});
    if(pl.gold>=4&&!used.shop)out.push({type:"shop"});
    if(pl.gold>=E.CHURCH_COST&&!used.church)pl.heroes.forEach(h=>{if(h.dead&&!h.surr)out.push({type:"church",hero:h.uid})});
    upgradables(s,pid).forEach(o=>{const u=upgradeCost(o);if(u.x){for(let x=1;x<=pl.gold;x++)out.push({type:"upgrade",uid:o.uid,x})}else if(pl.gold>=u.cost)out.push({type:"upgrade",uid:o.uid})});
    out.push({type:"leave"});return out}
  if(s.phase!=="battle"||s.prio!==pid)return[];
  return battleOptions(s,pid)};
/* Arrow of Persuasion (update 27): until Dusk, the unit's next action must be an attack on the chosen target (ends after that attack, at Dusk, or if the target is gone / untargetable) */
function forcedTarget(s,o){const f=o&&o.fl&&o.fl.forceAtk;if(!f||f.round!==s.round||o.dead||s.phase!=="battle")return null;const t=find(s,f.uid);if(!t||t.o.dead)return null;
  const pid=o.kind==="hero"?o.owner:o.ctrl;const cs=candidates(s,pid,{k:"enemy"},{attack:true,actor:o});return cs.includes(f.uid)?f.uid:null}
E.forcedTarget=forcedTarget;
function battleOptions(s,pid){const out0=battleOptions0(s,pid);
  /* update 27 Arrow of Persuasion: the forced Hero must attack; no other action, no passing (abilities that use no action, like Energy Stone, are still allowed) */
  {const a=actorFor(s,pid);if(a&&!(s.bonus&&s.bonus.pid===pid)&&!a.fl.noAttack&&!a.st.stun&&!(chained(a)&&P(s,pid).aura<1)&&forcedTarget(s,a)){const r=out0.filter(o=>o.type==="attack"&&o.att===a.uid||o.type==="useFree");if(r.some(o=>o.type==="attack"))return r}}
  /* Refire: the bonus action may only activate an Arrow (or be skipped) */
  if(s.bonus&&s.bonus.pid===pid&&s.bonus.only==="arrow"){const r=out0.filter(o=>o.type==="use"&&def(find(s,o.uid).o).sub==="Arrow");r.push({type:"skipBonus"});return r}
  /* Echo Performer: the extra action may only play a Bard Tactic or Song */
  if(s.bonus&&s.bonus.pid===pid&&s.bonus.only==="bard"){const r=out0.filter(o=>{if(o.type!=="play")return false;const c=findCardAnywhere(s,pid,o.uid);const d=c&&DB[c.id];return d&&d.cls==="Bard"&&/Tactic|Song/.test(d.type)});r.push({type:"skipBonus"});return r}
  return out0}
function battleOptions0(s,pid){const pl=P(s,pid);const out=[];const a=actorFor(s,pid);
  if(a){
    const forced=!a.fl.noAttack&&!a.st.stun&&forcedTarget(s,a);
    if(forced){out.push({type:"attack",att:a.uid})}else{
    const seen=new Set();
    pl.hand.forEach(c=>{const d=DB[c.id];if(seen.has(c.id))return;
      if(canPlayCard(s,pid,a,c)){seen.add(c.id);out.push({type:"play",uid:c.uid})}});
    /* Set 2 Stall: a Stalled card with no stall counters left can be played without paying its Aura cost */
    (pl.stall||[]).forEach(c=>{if(!(c.n>0)&&canPlayCard(s,pid,a,c,true))out.push({type:"playStalled",uid:c.uid})});
    /* Call of Nature: a Summon card exiled this turn can be played */
    (pl.t.nature||[]).forEach(u=>{const c=pl.exile.find(x=>x.uid===u);if(c&&canPlayCard(s,pid,a,c))out.push({type:"play",uid:u})});
    if(!a.fl.noAttack&&!(chained(a)&&pl.aura<1))out.push({type:"attack",att:a.uid});
    if(a.lvl<6&&a.fl.leveled!==s.round&&a.fl.noLevel!==s.round&&!arrested(a)){const st=(a.lvl+1)%2===0;
      if(st)["str","def","aura"].forEach(k=>out.push({type:"level",stat:k}));else out.push({type:"level"})}
    if(a.fl.stepped!==s.round)out.push({type:"step"});
    const hs=HS()[a.name];
    if(hs&&!a.st.stun&&!nulled(s,a.name))hs.forEach((ab,i)=>{if((!ab.lvl||a.lvl>=ab.lvl)&&(!ab.can||ab.can(s,pid,a))&&abilityCost(s,pid,a,ab)<=pl.aura)out.push({type:"ability",idx:i})});
    /* equipment with a colon ability (Shillelagh, Helm of Aura): uses the Hero's action */
    eqList(a).forEach(e=>{const x=(root.CQ_EQACT||{})[e.name];if(x&&!nulled(s,e.name)&&(!x.can||x.can(s,pid,a,e))&&(x.cost||0)<=pl.aura)out.push({type:"eqAct",uid:e.uid})});
    /* Multi Bow: destroy Arrows in inventory, next Arrow +3 damage each (uses this Hero's action) */
    if(hasEqN(a,"Multi Bow")&&!nulled(s,"Multi Bow")){const ar=pl.inv.filter(o=>o.kind==="card"&&!o.fd&&def(o).sub==="Arrow");for(let n=1;n<=ar.length;n++)out.push({type:"multiBow",n})}
    pl.inv.forEach(o=>{const d=def(o);
      if(o.kind==="card"&&!o.fd){const isc=SC()[d.name];
        if(isc&&isc.act&&!isc.act.free&&!a.st.stun&&(d.cls==="Generic"||heroIs(a,d.cls)||isc.act.anyClass)&&!nulled(s,d.name)&&!((d.sub==="Consumable"||isc.act.exile||/Exile:/.test(d.rules||""))&&pl.fl.noConsum===s.round)&&(!isc.act.can||isc.act.can(s,pid,a,o))&&itemCost(s,pid,a,o)<=pl.aura)out.push({type:"use",uid:o.uid})}
      if(o.kind==="equip"&&canUseEq(s,a,o)&&eqCost(s,a,o)<=pl.aura)out.push({type:"equipInv",uid:o.uid});
      out.push({type:"clear",uid:o.uid})});
    pl.heroes.forEach(h=>{if(h===a||h.dead)return;eqList(h).forEach(e=>{if(canUseEq(s,a,e)&&eqCost(s,a,e)<=pl.aura)out.push({type:"take",uid:e.uid})})});
    out.push({type:"manualAbility"});}
  }
  pl.bf.forEach(o=>{if(o.kind==="summon"&&!o.ex&&!o.st.stun)out.push({type:"attack",att:o.uid})});
  {const bm=bandMembers(s,pid);if(bm.length>=2){if(a&&bm.includes(a)&&!(chained(a)&&pl.aura<1))out.push({type:"band",att:a.uid});bm.forEach(o=>{if(o.kind==="summon")out.push({type:"band",att:o.uid})})}}
  /* item abilities with no Hero cost (Energy Stone): any time you have priority, no action used */
  pl.inv.forEach(o=>{if(o.kind!=="card"||o.fd)return;const isc=SC()[def(o).name];if(isc&&isc.act&&isc.act.free&&!nulled(s,o.name)&&(!isc.act.can||isc.act.can(s,pid,null,o))&&(isc.act.cost||0)<=pl.aura)out.push({type:"useFree",uid:o.uid})});
  pl.heroes.forEach(h=>{if(h.dead&&!h.surr)SOULS.forEach((_,i)=>out.push({type:"soul",hero:h.uid,ch:i}))});
  out.push({type:"pass"});
  return out}
function abilityCost(s,pid,a,ab){return(ab.cost||0)+2*invCount(P(s,opp(pid)),"Tangle Rod")+burden(a)+(s.p.reduce((n,p2)=>n+invCount(p2,"Sphere of Hindrance"),0)&&a.cls!=="Warlock"?s.p.reduce((n,p2)=>n+invCount(p2,"Sphere of Hindrance"),0):0)}
function itemCost(s,pid,a,o){if(s.bonus&&s.bonus.free&&s.bonus.pid===pid&&a&&s.bonus.uid===a.uid&&def(o).sub==="Arrow")return 0;const isc=SC()[o.name];let c=(isc&&isc.act&&isc.act.cost)||0;if(a&&def(o).sub==="Arrow"&&hasEqN(a,"Mystic Quiver"))c=Math.max(0,c-1);return c+(a?burden(a):0)}
E.abilityCost=abilityCost;E.itemCost=itemCost;
function promptOptions(s,pid,pr){
  if(pr.type==="window"){const out=[{type:"decline"}];
    P(s,pid).inv.forEach(o=>{if(o.fd&&canReveal(s,pid,o,pr))revealHeroes(s,pid,o,pr).forEach(h=>out.push({type:"reveal",uid:o.uid,hero:h.uid}))});
    if(canStall(s,pid,pr.trig)){const w=watchFor(s,pid);living(P(s,pid)).filter(h=>!h.ex).forEach(h=>out.push({type:"stall",uid:w.uid,hero:h.uid}))}return out}
  if(pr.type==="combo"){const out=[{type:"decline"}];pr.cands.forEach(u=>{const c=findCardAnywhere(s,pid,u);if(c){const a=comboActor(s,pr,u);if(a&&!a.dead&&canPlayCards(a)&&(pr.free||cardCost(s,pid,a,DB[c.id])<=P(s,pid).aura))out.push({type:"comboPlay",uid:u})}});return out}
  if(pr.type==="ask")return pr.opts.map((_,i)=>({type:"ask",i}));
  if(pr.type==="scry")return[{type:"scry"}];
  if(pr.type==="choose")return[{type:"choose"}];
  if(pr.type==="manual")return[{type:"man"},{type:"manDone"}];
  if(pr.type==="mode")return pr.opts.map((_,i)=>({type:"pick",i}));
  return[]}
function heroByUid(s,uid){const f=find(s,uid);return f&&f.o.kind==="hero"?f.o:null}
function findCardAnywhere(s,pid,uid){const pl=P(s,pid);return pl.hand.find(c=>c.uid===uid)||(pl.stall||[]).find(c=>c.uid===uid)||pl.lib.find(c=>c.uid===uid)||((pl.t.nature||[]).includes(uid)?pl.exile.find(c=>c.uid===uid):null)||pl.disc.find(c=>c.uid===uid)}
/* combo-style prompts: Come Together picks a Hero per revealed card (update 23) */
function comboActor(s,pr,uid){return heroByUid(s,(pr.actors&&pr.actors[uid])||pr.actor)}
E.comboActor=comboActor;

/* ---------- hidden cards ---------- */
function hiddenScript(o){const sc=SC()[def(o).name];return sc&&sc.hidden}
function hiddenCost(s,pid,o){const m=/^(\d+)\{A\}/.exec(def(o).rules||"");let c=m?+m[1]:0;if(def(o).sub==="Trap"&&living(P(s,pid)).some(h=>h.name==="Beast Tracker"&&h.lvl>=3))c-=1;if(def(o).sub==="Trap"&&living(P(s,pid)).some(h=>h.name==="Shadow Ranger"&&h.ex))c-=1;return Math.max(0,c)}
E.hiddenCost=hiddenCost;
/* Heroes that can be exhausted to reveal this Hidden card (the player chooses one; update 27) */
function revealHeroes(s,pid,o,pr){const d=def(o);const hs=hiddenScript(o);const tr=pr&&pr.trig;
  const ex=hs&&hs.excl&&tr?[tr.hero,tr.target].concat(tr.targets||[]).filter(Boolean):[];
  const hs2=living(P(s,pid)).filter(h=>!h.ex&&!ex.includes(h.uid)&&(d.cls==="Generic"||heroIs(h,d.cls)));
  /* update 29: Hand of the Protector can be revealed by exhausting a ready summon instead of a Hero */
  return hs&&hs.summonPay?hs2.concat(P(s,pid).bf.filter(o=>o.kind==="summon"&&!o.ex&&!ex.includes(o.uid))):hs2}
function revealHero(s,pid,o,pr,uid){const l=revealHeroes(s,pid,o,pr);return(uid&&l.find(h=>h.uid===uid))||l[0]}
E.revealHeroes=revealHeroes;
function canReveal(s,pid,o,pr){if(pr.noHidden)return false;const d=def(o);if(d.sup!=="Hidden")return false;
  if(!revealHero(s,pid,o,pr))return false;if(hiddenCost(s,pid,o)>P(s,pid).aura)return false;
  const h=hiddenScript(o);if(!h)return!["dying","afterDmg","dusk"].includes(pr.trig.kind);return[].concat(h.when).includes(pr.trig.kind)&&(!h.ok||h.ok(s,pid,pr.trig))}
E.canReveal=canReveal;
function windowFor(s,pid,trig){if(trig.noHidden)return false;const pl=P(s,pid);return pl.inv.some(o=>o.fd&&canReveal(s,pid,o,{trig}))||canStall(s,pid,trig)}

/* ---------- need(): target slots for an action ---------- */
E.need=function(s,pid,a){const pl=P(s,pid);const actor=actorFor(s,pid);
  const mk=(spec,ctx)=>({label:spec.label||labelFor(spec.k),opt:!!spec.opt,cands:candidates(s,pid,spec,ctx),distinct:spec.distinct,k:spec.k});
  if(a.type==="attack"||a.type==="band"){const att=find(s,a.att);if(!att)return[];
    const sl=mk({k:"enemy",label:a.type==="band"?"band attack target":"attack target"},{attack:true,actor:att.o});const fz=forcedTarget(s,att.o);if(fz){sl.cands=[fz];sl.label="attack target (must attack)"}
    return[sl]}
  if(a.type==="useFree"){const f=find(s,a.uid);if(!f)return[];const isc=SC()[f.o.name];return specsFor(isc.act,a.modes).map(sp=>mk(sp,{actor:null,item:f.o}))}
  if(a.type==="fixPlay"){const c=pl.hand.find(x=>x.uid===a.uid);if(!c)return[];const d=DB[c.id];const sc=SC()[d.name];const act=fixHero(s,pid,a);
    if(!sc||d.sup==="Hidden"||d.type==="Item"&&!sc.t)return[];return specsFor(sc,a.modes).map(sp=>mk(sp,{actor:act,card:d}))}
  if(a.type==="play"||a.type==="comboPlay"||a.type==="playStalled"){const c=findCardAnywhere(s,pid,a.uid);if(!c)return[];const d=DB[c.id];const sc=SC()[d.name];
    const act=a.type==="comboPlay"?(s.pend[0]?comboActor(s,s.pend[0],a.uid):null):actor;
    if(!sc||d.sup==="Hidden"||d.type==="Item"&&!sc.t)return[];return specsFor(sc,a.modes).map(sp=>mk(sp,{actor:act,card:d}))}
  if(a.type==="ability"){const ab=HS()[actor.name][a.idx];return(ab.t||[]).map(sp=>mk(sp,{actor}))}
  if(a.type==="use"){const o=find(s,a.uid).o;const isc=SC()[o.name];return(isc.act?specsFor(isc.act,a.modes):[]).map(sp=>mk(sp,{actor,item:o}))}
  if(a.type==="eqAct"){const f=find(s,a.uid);const x=f&&(root.CQ_EQACT||{})[f.o.name];return x?(x.t||[]).map(sp=>mk(sp,{actor,item:f.o})):[]}
  if(a.type==="soul"){if(a.ch===2||a.ch===5)return[mk({k:"ally",label:"ally"})];if(a.ch===3)return[mk({k:"any",label:"damage target"})];return[]}
  if(a.type==="inn")return[];
  return[]};
function specsFor(sc,modes){let t=(sc.t||[]).slice();if(sc.modes&&modes)modes.forEach(i=>{const m=sc.modes.opts[i];if(m&&m.t)t=t.concat(m.t)});return t}
E.specsFor=specsFor;
function labelFor(k){return({any:"any target",enemy:"enemy",ally:"ally",hero:"Hero",enemyHero:"enemy Hero",allyHero:"your Hero",summon:"summon",enemySummon:"enemy summon",allySummon:"your summon",item:"item",equip:"equipment",anyEquip:"equipment",enemyEquip:"enemy equipment",allyEquip:"your equipment",ench:"enchantment",pillar:"Pillar",allyPillar:"your Pillar",nonHero:"non-Hero object",player:"player",enemyPlayer:"opponent",deadAlly:"dead Hero",deadAny:"dead Hero",meditating:"Meditating Hero",allyHeroOther:"another of your Heroes",anyOther:"another target"})[k]||k}

/* ---------- act() ---------- */
function same(a,b){if(a.type!==b.type)return false;for(const k of["uid","att","stat","idx","hero","ch","i","n","x"])if(a[k]!==undefined&&a[k]!==b[k])return false;return true}
E.act=function(s,pid,a){CUR_S=s;
  if(s.over)return{ok:false,err:"The game is over."};
  if(a.type==="concede"){if(pid!==0&&pid!==1)return{ok:false,err:"Not a player."};s.seq++;s.over=true;s.winner=opp(pid);s.conceded=pid;s.pend=[];s.cur=null;s.qatk=null;
    log(s,`${P(s,pid).name} concedes.`,pid);log(s,`🏆 ${P(s,opp(pid)).name} wins!`);return{ok:true}}
  const opts=E.options(s,pid);
  if(a.type==="play"){const ok=opts.some(o=>o.type==="play"&&findCardAnywhere(s,pid,o.uid)&&findCardAnywhere(s,pid,o.uid).id===(findCardAnywhere(s,pid,a.uid)||{}).id);if(!ok)return{ok:false,err:"You can't play that card now."}}
  else if(!["fix","man","fixPlay","manDone","manCancel","scry","choose","wake","giveAction"].includes(a.type)&&!opts.some(o=>same(o,a)))return{ok:false,err:"That action isn't legal right now."};
  if(a.type==="fix"&&!(s.phase==="battle"&&s.prio===pid&&!s.pend.length))return{ok:false,err:"Rules fixes are made on your priority."};
  if(["man","fixPlay","manDone"].includes(a.type)&&!(s.pend[0]&&s.pend[0].type==="manual"&&s.pend[0].pid===pid))return{ok:false,err:"No manual resolution open."};
  if(a.type==="scry"&&!(s.pend[0]&&s.pend[0].type==="scry"&&s.pend[0].pid===pid))return{ok:false,err:"No scry open."};
  if(a.type==="choose"&&!(s.pend[0]&&s.pend[0].type==="choose"&&s.pend[0].pid===pid))return{ok:false,err:"Nothing to choose."};
  if(a.type==="wake"){const wh=heroByUid(s,a.hero);if(!wh||wh.owner!==pid||!wh.med)return{ok:false,err:"That Hero isn't Meditating."}}
  if(a.type==="giveAction"&&!(s.phase==="battle"&&(pid===0||pid===1)&&(s.pend.length?(s.pend[0].type==="manual"&&s.pend[0].pid===pid):s.prio===pid)))return{ok:false,err:"You can give an action on your priority or from your resolve-by-hand panel."};
  /* targets */
  const slots=E.need(s,pid,a);const tg=a.targets||[];
  if(["play","comboPlay","playStalled","attack","ability","use","soul"].includes(a.type)){
    for(let i=0;i<slots.length;i++){const t=tg[i];if(t==null){if(slots[i].opt||!slots[i].cands.length)continue;return{ok:false,err:`Choose ${slots[i].label}.`}}
      if(!slots[i].cands.includes(t))return{ok:false,err:`Invalid target for ${slots[i].label}.`};
      if(slots[i].distinct&&tg.slice(0,i).includes(t))return{ok:false,err:"Choose different targets."}}
    if(a.type==="attack"&&!slots[0].cands.length)return{ok:false,err:"There's nothing to attack."}}
  if(a.type==="fixPlay"){const c=P(s,pid).hand.find(x=>x.uid===a.uid);if(!c)return{ok:false,err:"That card isn't in your hand."};const fh=fixHero(s,pid,a);if(!fh&&DB[c.id].kind==="equip")return{ok:false,err:"Choose one of your living Heroes to equip it."}}
  if(a.type==="manCancel"){const pr=s.pend[0];if(!(pr&&pr.type==="manual"&&pr.pid===pid&&s.undo&&pr.undoId===s.undo.id))return{ok:false,err:"Nothing to cancel."};
    const what=s.undo.what,keepLog=s.log;const snap=JSON.parse(s.undo.snap);Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,snap);s.log=keepLog;s.seq=(s.seq||0)+2;
    log(s,`✋ ${P(s,pid).name} cancels ${what} (undone).`,pid);settle(s);return{ok:true}}
  /* remember the state before anything that may open a resolve-by-hand panel, so it can be canceled */
  const undoable=["play","comboPlay","use","ability","manualAbility","reveal","fix"].includes(a.type);
  const snap=undoable?JSON.stringify(Object.assign({},s,{undo:null,log:[]})):null;const what=undoable?undoLabel(s,pid,a):null;
  s.seq++;
  try{doAct(s,pid,a)}catch(err){log(s,"Engine error: "+(err&&err.message));if(root.console)console.error(err)}
  settle(s);
  const top=s.pend[0];
  if(undoable&&top&&top.type==="manual"&&top.pid===pid&&!top.undoId){top.undoId=s.seq;s.undo={id:s.seq,snap,what}}
  else if(!(s.undo&&s.pend.some(p=>p.type==="manual"&&p.undoId===s.undo.id)))s.undo=null;
  return{ok:true}};
function undoLabel(s,pid,a){try{if(a.type==="play"||a.type==="comboPlay"){const c=findCardAnywhere(s,pid,a.uid);return c?DB[c.id].name:"the card"}
  if(a.type==="use"){const f=find(s,a.uid);return f?f.o.name:"the item"}if(a.type==="fix")return"the rules fix";if(a.type==="reveal")return"the Hidden card";return"the ability"}catch(e){return"the action"}}

function doAct(s,pid,a){const pl=P(s,pid);
  switch(a.type){
  case"keep":pl.mullDone=true;log(s,`${pl.name} keeps their hand.`,pid);if(s.p.every(p=>p.mullDone))startRound(s);return;
  case"mull":pl.lib.push(...pl.hand.splice(0));shuffle(s,pl.lib);draw(s,pid,4,true);pl.mullDone=true;pl.mulled=true;log(s,`${pl.name} mulligans and draws a new hand of 4.`,pid);if(s.p.every(p=>p.mullDone))startRound(s);return;
  case"gem":{const o=find(s,a.uid).o;const h=heroByUid(s,a.hero);h.ex=true;pl.inv.splice(pl.inv.indexOf(o),1);pl.exile.push({uid:o.uid,id:o.id,owner:o.owner});log(s,`${pl.name} exiles ${o.name}, exhausting ${h.name}.`,pid);SC()[o.name].gem(mkCtx(s,pid,h,DB[o.id],o,[]));return}
  case"wake":{const h=heroByUid(s,a.hero);if(h)h.keepMed=!a.v;return}
  case"dawnDone":s.dawnDone[pid]=true;if(s.dawnDone.every(Boolean))startBattle(s);return;
  case"inn":{const h=heroByUid(s,a.hero);pl.gold-=5;s.town.used=Object.assign({},s.town.used,{inn:true});log(s,`${pl.name} stays at the Inn (5 Gold).`,pid);heal(s,null,h,E.INN_HEAL);return}
  case"church":{const h=heroByUid(s,a.hero);pl.gold-=E.CHURCH_COST;s.town.used=Object.assign({},s.town.used,{church:true});h.dead=false;h.dmg=Math.max(0,maxHp(s,h)-E.CHURCH_HP);h.ex=false;log(s,`${pl.name} pays the Church ${E.CHURCH_COST} Gold: ${h.name} is resurrected with ${E.CHURCH_HP} HP.`,pid);return}
  case"upgrade":{const o=find(s,a.uid).o;const u=upgradeCost(o);const x=u.x?Math.max(1,Math.min(a.x|0,pl.gold)):u.cost;pl.gold-=x;s.upg=s.upg||{};s.upg[o.uid]=u.x?x:1;
    if(u.weapon){const up=DB[o.id].up;const had=eqGuardOf(s,o,true);o.pstr=up.pstr;o.pdef=up.pdef;const f2=find(s,o.uid);if(f2&&f2.zone==="eq"&&f2.hero){f2.hero.eqGuard+=Math.max(0,eqGuardOf(s,o)-had)}
      log(s,`${pl.name} upgrades ${o.name} at the Blacksmith (${x} Gold) and flips it: ${up.rules}`,pid);return}
    log(s,`${pl.name} upgrades ${o.name} at the Blacksmith (${x} Gold)${u.x?`: +${x} damage`:""}.`,pid);return}
  case"shop":pl.gold-=4;s.town.used=Object.assign({},s.town.used,{shop:true});log(s,`${pl.name} visits the Shop (4 Gold).`,pid);draw(s,pid,1);return;
  case"leave":log(s,`${pl.name} leaves Town.`,pid);s.town.i++;s.town.used={};if(s.town.i>=s.town.order.length){s.town=null;startRound(s)}return;
  case"pass":log(s,`${pl.name} passes.`,pid);s.passed[pid]=true;endBonus(s);advance(s,pid);return;
  case"decline":{const pr=s.pend.shift();if(pr.type==="window")closeWindow(s,pr);else if(pr.type==="combo")log(s,"Combo: no card played.",pid);return}
  case"reveal":{const pr=s.pend[0];const o=find(s,a.uid).o;doReveal(s,pid,o,pr,a.hero);return}
  case"stall":{const pr=s.pend[0];const h=heroByUid(s,a.hero);if(!pr||pr.type!=="window"||!h)return;h.ex=true;s.pend.shift();const c=pr.cont.card;const op=P(s,pr.trig.pid);
    op.stall=(op.stall||[]).concat([{uid:c.uid,id:c.id,owner:c.owner,n:2}]);log(s,`${pl.name} uses the Pocket Watch, exhausting ${h.name}: ${DB[c.id].name} is Stalled with 2 stall counters (its Aura isn't refunded).`,pid);return}
  case"comboPlay":{const pr=s.pend.shift();const actor=comboActor(s,pr,a.uid);const c0=findCardAnywhere(s,pid,a.uid);const d0=c0&&DB[c0.id];
    playCard(s,pid,actor,a.uid,a,{combo:!pr.free&&!pr.pay,free:!!pr.free,fromLib:!pr.fromDisc,fromDisc:!!pr.fromDisc});
    /* Rapacious Encore: deal damage equal to the replayed Song's Aura cost, Piercing (ignores all DEF) */
    if(pr.encore&&d0){const n=num(d0.cost);const ts=inPlayTargets(s).filter(o=>!stealth(s,o)||ctrl(s,o)===pid);if(n>0&&ts.length)ask(s,pid,`Rapacious Encore: deal ${n} damage to any target (Piercing)`,targetOpts(s,pid,ts,n),"dmgTo",{n,name:"Rapacious Encore",pierce:99,src:pr.actor})}
    return}
  case"ask":{const pr=s.pend.shift();const o=pr.opts[a.i];const fn=ASK[pr.op];if(fn&&o)withSrc(s,pr.data&&pr.data.name||CUR_SRC,()=>fn(s,pid,pr,o.v));return}
  case"scry":{const pr=s.pend.shift();finishScry(s,pid,pr,a);return}
  case"choose":{const pr=s.pend.shift();finishChoose(s,pid,pr,a.picks||[]);return}
  case"man":manualOp(s,pid,a);return;
  /* Rules fix: play a card from hand for free (no Aura, no class or ready limits); the chosen Hero plays it. Doesn't use an action. */
  case"fixPlay":{const h=fixHero(s,pid,a);const c=pl.hand.find(x=>x.uid===a.uid);if(!c)return;log(s,`✋ ${pl.name} plays ${DB[c.id].name} for free by rules fix${h?` (${h.name})`:""}.`,pid);
    playCard(s,pid,h,a.uid,a,{free:true});checkDeaths(s);return}
  case"manDone":{const pr=s.pend.shift();log(s,pr&&pr.given?`${pl.name} is done; control returns to ${P(s,opp(pid)).name}.`:`${pl.name} finishes resolving by hand.`,pid);return}
  case"giveAction":{const op=opp(pid);s.pend.unshift({type:"manual",pid:op,title:`${pl.name} gave you an action`,text:"Resolve anything that needs your hands (a card you control, a choice, a by-hand effect). This does not use an action. Press Done to hand control back.",given:true});
    log(s,`✋ ${pl.name} gives ${P(s,op).name} an action to resolve by hand.`,pid);return}
  case"skipBonus":{const b=s.bonus;if(b&&b.queue&&b.queue.length){const nx=b.queue.shift();b.uid=nx;b.n=1;log(s,`${pl.name} skips that Ranger.`,pid);return}
    log(s,`${pl.name} doesn't use the extra action.`,pid);endBonus(s);s.cur={pid,type:"skip"};return}
  case"fix":s.pend.unshift({type:"manual",pid,title:"Rules fix",text:"Adjust the game to match the rules. Every change is logged for both players."});log(s,`✋ ${pl.name} opens a rules fix.`,pid);return;
  }
  if(a.type==="multiBow"){s.cur={pid,type:"multiBow"};const a0=actorFor(s,pid);if(a0)pl.t.lastActor=a0.uid;s.dmgTo=[0,0];const ar=pl.inv.filter(o=>o.kind==="card"&&!o.fd&&def(o).sub==="Arrow");
    let pick=(a.uids||[]).map(u=>ar.find(o=>o.uid===u)).filter(Boolean);if(!pick.length)pick=ar.slice().sort((x,y)=>(itemCost(s,pid,null,x))-(itemCost(s,pid,null,y))).slice(0,a.n||1);
    pick.forEach(o=>destroyObj(s,o));const mbUp=a0&&hasUpN(s,a0,"Multi Bow");pl.fl.multi=(pl.fl.multi||0)+(mbUp?4:3)*pick.length;if(mbUp)pl.fl.multiPierce=2;
    log(s,`Multi Bow: ${pl.name} destroys ${pick.length} Arrow${pick.length>1?"s":""}; the next Arrow deals +${pl.fl.multi} damage.`,pid);return}
  if(a.type==="useFree"){const o=find(s,a.uid).o;const isc=SC()[o.name];const c=isc.act.cost||0;if(c)pl.aura-=c;
    log(s,`${pl.name} activates ${o.name}${c?` (${c} Aura)`:""} (no action used).`,pid);
    withSrc(s,o.name,()=>isc.act.run(mkCtx(s,pid,null,DB[o.id],o,a.targets||[],{modes:a.modes||[]})));checkDeaths(s);return}
  /* battle actions */
  s.cur={pid,type:a.type};const actor=actorFor(s,pid);s.dmgTo=[0,0];pl.t.acts=(pl.t.acts||0)+1;
  if(actor&&a.type!=="soul"&&!((a.type==="attack"||a.type==="band")&&a.att!==actor.uid))pl.t.lastActor=actor.uid;
  stallTick(s,pid);
  if(a.type==="play"){playCard(s,pid,actor,a.uid,a,{});return}
  if(a.type==="playStalled"){log(s,`${pl.name} plays a Stalled card.`,pid);playCard(s,pid,actor,a.uid,a,{free:true,fromStall:true});return}
  if(a.type==="attack"){startAttack(s,pid,a.att,a.targets[0],{});return}
  if(a.type==="band"){const all=bandMembers(s,pid);let mem=(a.members||all.map(o=>o.uid)).filter(u=>u!==a.att&&all.some(o=>o.uid===u));
    if(!mem.length){startAttack(s,pid,a.att,a.targets[0],{});return}
    startAttack(s,pid,a.att,a.targets[0],{band:mem});return}
  if(a.type==="eqAct"){const f=find(s,a.uid);const x=(root.CQ_EQACT||{})[f.o.name];if(x.cost)pay(s,pid,actor,x.cost);burdenFat(s,actor);log(s,`${actor.name} uses ${f.o.name}.`,pid);
    withSrc(s,f.o.name,()=>x.run(mkCtx(s,pid,actor,DB[f.o.id]||{name:f.o.name},f.o,a.targets||[])));checkDeaths(s);return}
  if(a.type==="level"){actor.ex=true;levelUp(s,actor,a.stat,true);draw(s,pid,1);actor.fl.leveled=s.round;return}
  if(a.type==="step"){actor.fl.stepped=s.round;log(s,`${actor.name} steps back and will act last this round, after the Closer.`,pid);return}
  if(a.type==="ability"){const ab=HS()[actor.name][a.idx];const c=abilityCost(s,pid,actor,ab);if(ab.ex!==false)actor.ex=true;pay(s,pid,actor,c);burdenFat(s,actor);
    log(s,`${actor.name} uses its ability${ab.label?`: ${ab.label}`:""}.`,pid);
    const trig={kind:"card",ability:true,src:actor,pid,targets:a.targets||[],cost:c,cls:actor.cls,type:"Ability",idx:a.idx};
    queueResolve(s,pid,{k:"ability",actor:actor.uid,idx:a.idx,targets:a.targets||[]},trig);return}
  if(a.type==="manualAbility"){log(s,`${actor.name} uses an ability (resolved by hand). Pay its costs in the panel.`,pid);s.pend.unshift({type:"manual",pid,title:`${actor.name}: ability`,text:DB[actor.id].rules,actor:actor.uid});return}
  if(a.type==="use"){const o=find(s,a.uid).o;const isc=SC()[o.name];const c=itemCost(s,pid,actor,o);pay(s,pid,actor,c);burdenFat(s,actor);
    if((def(o).sub==="Arrow"&&!(s.bonus&&s.bonus.rapid&&s.bonus.uid===actor.uid))||isc.act.ex)actor.ex=true;
    log(s,`${actor.name} activates ${o.name}.`,pid);
    if(isc.act.exile||def(o).sub==="Arrow"){pl.inv.splice(pl.inv.indexOf(o),1);if(isc.act.exile)pl.exile.push({uid:o.uid,id:o.id,owner:o.owner});else pl.disc.push({uid:o.uid,id:o.id,owner:o.owner})}
    else if(isc.act.sac){pl.inv.splice(pl.inv.indexOf(o),1);log(s,`${pl.name} sacrifices ${o.name}.`,pid);toDisc(s,o)}
    const trig={kind:"card",item:true,src:actor,pid,targets:a.targets||[],cost:c,cls:def(o).cls,type:"Item",name:o.name};
    queueResolve(s,pid,{k:"item",actor:actor.uid,item:o.uid,itemName:o.name,targets:a.targets||[],modes:a.modes||[],arrow:def(o).sub==="Arrow",refire:!!(s.bonus&&s.bonus.pid===pid&&s.bonus.refire&&def(o).sub==="Arrow")},trig);return}
  if(a.type==="equipInv"){const o=find(s,a.uid).o;pay(s,pid,actor,eqCost(s,actor,o));pl.inv.splice(pl.inv.indexOf(o),1);equipTo(s,actor,o);return}
  if(a.type==="take"){const f=find(s,a.uid);pay(s,pid,actor,eqCost(s,actor,f.o));f.hero.eq[f.slot]=null;if(f.slot==="H1"&&f.hero.eq.H2==="2H")f.hero.eq.H2=null;log(s,`${actor.name} takes ${f.o.name} from ${f.hero.name}.`,pid);equipTo(s,actor,f.o);return}
  if(a.type==="clear"){const o=find(s,a.uid).o;pl.inv.splice(pl.inv.indexOf(o),1);log(s,`${pl.name} clears ${o.fd?"a face-down card":o.name} from inventory.`,pid);toDisc(s,o);return}
  if(a.type==="soul"){const h=heroByUid(s,a.hero);h.surr=true;log(s,`${pl.name} surrenders ${h.name}'s soul: ${SOULS[a.ch]}.`,pid);
    const t=a.targets&&a.targets[0]?resolveTarget(s,a.targets[0]):null;
    if(a.ch===0)draw(s,pid,1);else if(a.ch===1)pl.aura+=2;else if(a.ch===2&&t)addMod(t,{str:2});else if(a.ch===3&&t)damage(s,{name:h.name+"'s soul",kind:"soul"},t,2,{card:true});
    else if(a.ch===4)pl.gold+=3;else if(a.ch===5&&t)addMod(t,{def:2});return}
}
function arrested(h){return(h.ench||[]).some(e=>e.name==="Arrested Development")}
function levelUp(s,h,stat,announce){if(h.lvl>=6)return;if(arrested(h)){log(s,`${h.name} can't level up (Arrested Development).`,h.owner);return}h.lvl++;log(s,`${h.name} reaches Level ${h.lvl}.`,h.owner);
  if(h.name==="Thorncaller"&&h.lvl===6){const pl=P(s,h.owner);const sm=pl.bf.filter(o=>o.kind==="summon");if(sm.length)log(s,"Thorncaller: each friendly summon is duplicated.",h.owner);sm.forEach(o=>E.copySummon(s,h.owner,o))}
  if(h.lvl%2===0){const k=stat||"str";h.bon[k]++;log(s,`${h.name} gains +1 ${k.toUpperCase()}.`,h.owner)}
  if(h.ench.some(e=>e.name==="Memory Loss")){const pl=P(s,h.owner);if(pl.hand.length){const x=pl.hand.splice(ri(s,pl.hand.length),1)[0];pl.disc.push(x);log(s,`Memory Loss: ${pl.name} discards ${DB[x.id].name}.`)}}}
E.levelUp=levelUp;

/* ---------- Set 2: Artificer (Craft, Stall, protection counters, Constructs) ----------
   Craft (Set Two Rules Supplement): play a Recipe only if its ingredients are in your inventory. Pay its Aura cost, sacrifice the ingredients, then flip it.
   Ingredient spec: {name} = that card, {any:"Metal"} = any card with the Metal subtype, {any:"Cloak"} = any equipment with Cloak in its name.
   Wildcards (each covers one ingredient): Quicksilver (any ingredient; it's used up), Artificer C (once each turn: any item in your inventory),
   Tinker's Goggles (once each turn: any Metal; upgraded: any item), Scavenger's Tongs (once each turn: one ingredient from your discard pile; upgraded: any discard pile).
   The engine picks the cheapest way to pay (cards from a discard pile first, then exact matches, then wildcards, Quicksilver last) and logs what it used. */
function ingMatch(spec,d){if(!d)return false;if(spec.name)return d.name===spec.name;if(spec.any==="Metal")return d.sub==="Metal";if(spec.any==="Cloak")return d.kind==="equip"&&/Cloak/.test(d.name);return false}
function craftPlan(s,pid,actor,d){const r=d&&d.recipe;if(!r)return null;const pl=P(s,pid);
  const inv=pl.inv.filter(o=>!o.fd&&!o.tok&&o.id&&DB[o.id]&&(o.kind==="card"||o.kind==="equip"));
  const val=o=>num(def(o).cost)+(o.kind==="equip"?1:0);
  const subs=[];/* one-shot wildcards available to this Hero */
  if(actor&&actor.name==="Artificer C"&&actor.fl.craftC!==s.round)subs.push({k:"anyItem",src:"Artificer C",flag:"craftC"});
  if(actor&&hasEqN(actor,"Tinker's Goggles")&&actor.fl.craftG!==s.round)subs.push({k:hasUpN(s,actor,"Tinker's Goggles")?"anyItem":"anyMetal",src:"Tinker's Goggles",flag:"craftG"});
  if(actor&&hasEqN(actor,"Scavenger's Tongs")&&actor.fl.craftT!==s.round)subs.push({k:"disc",any:hasUpN(s,actor,"Scavenger's Tongs"),src:"Scavenger's Tongs",flag:"craftT"});
  const ings=r.ing;let best=null;
  function go(i,used,subUsed,cost,plan){if(best&&cost>=best.cost)return;if(i===ings.length){best={cost,plan:plan.slice(),subs:subUsed.slice()};return}
    const sp=ings[i];
    /* exact match from inventory */
    inv.forEach(o=>{if(used.includes(o.uid))return;if(ingMatch(sp,def(o))&&o.name!=="Quicksilver"){plan.push({o,zone:"inv",how:"exact"});go(i+1,used.concat([o.uid]),subUsed,cost+val(o),plan);plan.pop()}});
    /* Quicksilver: any ingredient */
    inv.forEach(o=>{if(used.includes(o.uid)||o.name!=="Quicksilver")return;plan.push({o,zone:"inv",how:"Quicksilver"});go(i+1,used.concat([o.uid]),subUsed,cost+val(o)+0.5,plan);plan.pop()});
    subs.forEach((w,wi)=>{if(subUsed.includes(wi))return;
      if(w.k==="disc"){const piles=w.any?s.p.map((p2,i2)=>i2):[pid];piles.forEach(pp=>{P(s,pp).disc.forEach(c=>{if(used.includes(c.uid)||!ingMatch(sp,DB[c.id]))return;plan.push({c,pile:pp,zone:"disc",how:w.src});go(i+1,used.concat([c.uid]),subUsed.concat([wi]),cost-0.25,plan);plan.pop()})});return}
      inv.forEach(o=>{if(used.includes(o.uid))return;const dd=def(o);const ok=w.k==="anyItem"?true:dd.sub==="Metal";if(!ok||ingMatch(sp,dd))return;plan.push({o,zone:"inv",how:w.src});go(i+1,used.concat([o.uid]),subUsed.concat([wi]),cost+val(o)+0.25,plan);plan.pop()})})}
  go(0,[],[],0,[]);if(!best)return null;best.subs=best.subs.map(i=>subs[i]);return best}
E.craftPlan=craftPlan;
/* pay a Recipe's ingredients (called when the Recipe is played, after its Aura cost) */
function payCraft(s,pid,actor,d){const plan=craftPlan(s,pid,actor,d);if(!plan)return false;const pl=P(s,pid);const names=[];
  plan.subs.forEach(w=>{if(actor)actor.fl[w.flag]=s.round});
  plan.plan.forEach(p=>{if(p.zone==="inv"){const i=pl.inv.indexOf(p.o);if(i>=0)pl.inv.splice(i,1);toDisc(s,p.o);names.push(p.o.name+(p.how==="exact"?"":` (${p.how})`))}
    else{const dp=P(s,p.pile);const i=dp.disc.indexOf(p.c);if(i>=0)dp.disc.splice(i,1);dp.exile.push(p.c);names.push(`${DB[p.c.id].name} from ${p.pile===pid?"your":dp.name+"'s"} discard pile (${p.how})`)}});
  log(s,`Craft: ${pl.name} sacrifices ${names.join(", ")}.`,pid);
  /* Bellows: whenever the equipped Hero Crafts, draw a card (upgraded: and gain 1 Aura) */
  if(actor&&hasEqN(actor,"Bellows")){eqList(actor).filter(e=>e.name==="Bellows").forEach(e=>{log(s,`Bellows: ${actor.name} Crafts, draw a card${isUp(s,e)?" and gain 1 Aura":""}.`,pid);draw(s,pid,1);if(isUp(s,e))pl.aura+=1})}
  return true}
E.payCraft=payCraft;
/* the Recipe flips: a summon Recipe summons its Constructs (then goes to the discard pile); an item or weapon goes into your inventory as the made card */
function makeConstruct(s,pid,n){const o=makeSummon(s,pid,"Construct",false);o.str=n;o.hp=n;
  if(living(P(s,pid)).some(h=>h.name==="Artificer B")){o.str+=1;o.hp+=1;log(s,`Artificer B: the Construct enters with +1 Strength and +1 Health Points (${o.str}/${o.hp}).`,pid)}return o}
E.makeConstruct=makeConstruct;
function flipRecipe(s,pid,card){const d=DB[card.id];const b=d.recipe.back;const pl=P(s,pid);
  log(s,`${pl.name} flips ${d.name}: ${b.name}.`,pid);
  if(b.type==="Summon"){const m=/Summon (two|three|a|one) (\d+)\/(\d+)/.exec(b.rules)||[];const k={a:1,one:1,two:2,three:3}[m[1]]||2;const n=+m[2]||2;for(let i=0;i<k;i++)makeConstruct(s,pid,n);return false}
  const md=DB[b.name];let o;
  if(md.kind==="equip")o={uid:card.uid,kind:"equip",id:b.name,name:b.name,cls:"Generic",region:md.region,pstr:md.pstr,pdef:md.pdef,cost:num(md.cost),owner:card.owner,tok:false,x:null};
  else o={uid:card.uid,id:b.name,owner:card.owner,kind:"card",fd:false,name:b.name,ctr:{}};
  if(b.name==="Warded Cloak"){o.prot=3;log(s,"Warded Cloak is made with 3 protection counters.",pid)}
  toInv(s,pid,o);return true}
E.flipRecipe=flipRecipe;
/* Warded Cloak (protection counters): whenever a Hero in your party would be dealt damage, prevent it and remove a counter instead */
function wardFor(s,tgt){if(!tgt||tgt.kind!=="hero")return null;const pl=P(s,tgt.owner);for(const h of pl.heroes){if(h.dead)continue;const w=eqList(h).find(e=>e.name==="Warded Cloak"&&(e.prot||0)>0);if(w)return w}return null}
/* Pocket Watch (Stall): set the played card aside with 2 stall counters; each action its owner takes removes one; then they may play it without paying its Aura cost */
function watchFor(s,pid){const pl=P(s,pid);return pl.inv.find(o=>!o.fd&&o.name==="Pocket Watch")}
function canStall(s,pid,trig){return!!(trig&&trig.kind==="card"&&trig.card&&!trig.ability&&!trig.item&&trig.pid!==pid&&watchFor(s,pid)&&living(P(s,pid)).some(h=>!h.ex))}
E.canStall=canStall;
function stallTick(s,pid){const pl=P(s,pid);(pl.stall||[]).forEach(c=>{if(c.n>0){c.n--;log(s,c.n?`Stall: ${DB[c.id].name} has ${c.n} stall counter${c.n>1?"s":""} left.`:`Stall: the last counter comes off ${DB[c.id].name}. ${pl.name} may play it without paying its Aura cost.`,pid)}})}

/* ---------- card play ---------- */
function mkCtx(s,pid,actor,d,inst,targets,extra){const c=Object.assign({s,pid,me:P(s,pid),op:P(s,opp(pid)),actor,def:d,inst,t:(targets||[]).map(t=>t==null?null:resolveTarget(s,t)),tu:targets||[],E},extra||{});return c}
E.mkCtx=mkCtx;
function playCard(s,pid,actor,uid,a,o){const pl=P(s,pid);
  let c=pl.hand.find(x=>x.uid===uid);let fromLib=false,zone=pl.hand;
  if(!c&&(o.combo||o.fromLib)){c=pl.lib.find(x=>x.uid===uid);fromLib=true;zone=pl.lib}
  if(!c&&(pl.t.nature||[]).includes(uid)){c=pl.exile.find(x=>x.uid===uid);zone=pl.exile;if(c)pl.t.nature=pl.t.nature.filter(u=>u!==uid)}
  if(!c&&o.fromDisc){c=pl.disc.find(x=>x.uid===uid);zone=pl.disc}
  if(!c&&o.fromStall){c=(pl.stall||[]).find(x=>x.uid===uid&&!(x.n>0));zone=pl.stall}
  if(!c)return;const fromHand=zone===pl.hand;const d=DB[c.id];const sc=SC()[d.name];
  const x=(d.cost==="X"||(sc&&sc.x))?Math.max(0,Math.min(a.x|0,99)):0;
  const cost=o.free?0:cardCost(s,pid,actor,d,x);
  if(cost>pl.aura){log(s,`Not enough Aura for ${d.name}.`,pid);return}
  if(d.type==="Recipe"&&!payCraft(s,pid,actor,d)){log(s,`${d.name}: the ingredients aren't there.`,pid);return}
  pay(s,pid,actor,cost);consumeCostFlags(s,pid,actor,d);if(actor)burdenFat(s,actor);
  zone.splice(zone.indexOf(c),1);if(o.fromStall)c={uid:c.uid,id:c.id,owner:c.owner};
  pl.t.cards=(pl.t.cards||0)+1;
  let targets=a.targets||[];
  /* Confused: targets are random among all legal */
  if(actor&&confused(actor)&&sc){const specs=specsFor(sc,a.modes);targets=specs.map((sp,i)=>{if(targets[i]==null)return null;const cs=candidates(s,pid,Object.assign({},sp,{k:sp.k.replace(/^(enemy|ally)/,"").replace(/^$/,"any").replace(/^Hero$/,"hero").replace(/^Summon$/,"summon")}),{actor,card:d});return cs.length?cs[ri(s,cs.length)]:targets[i]});log(s,`${actor.name} is Confused: targets are chosen at random.`)}
  if(d.sup!=="Hidden")log(s,`${actor?actor.name:pl.name} plays ${d.name}${o.combo?" (Combo)":o.free?" (free)":""}${cost?` for ${cost} Aura`:""}${targets.filter(Boolean).length?" → "+targets.filter(Boolean).map(t=>{const r=resolveTarget(s,t);return r?r.name:"?"}).join(", "):""}.`,pid);
  if(d.sup!=="Hidden"){s.prevCard=s.lastCard;s.lastCard={id:c.id,pid,targets,modes:a.modes,x,round:s.round,type:d.type}}
  if(d.type==="Song")pl.t.songs=(pl.t.songs||0)+1;
  if(d.sup!=="Hidden")countCombo(s,pid,actor,d);
  /* permanents */
  if(d.kind==="equip"){equipTo(s,actor,eqObjFromCard(s,pid,c));return}
  if(d.sup==="Hidden"){pl.inv.push(Object.assign({kind:"card",fd:true,name:d.name},c));log(s,`${actor?actor.name:pl.name} sets a Hidden card face down.`,pid);overflow(s,pid);
    if(sc&&sc.onSet)sc.onSet(mkCtx(s,pid,actor,d,c,[]));return}
  if(d.type==="Item"){const it=Object.assign({kind:"card",fd:false,name:d.name,ctr:{}},c);pl.inv.push(it);overflow(s,pid);
    if(sc&&sc.enter)sc.enter(mkCtx(s,pid,actor,d,it,targets));return}
  /* update 29: playing a Summon card no longer exhausts the Hero by rule; the card text says so when it does ("Exhaust this Hero") */
  const trig={kind:"card",src:actor,pid,card:d,cardUid:c.uid,targets,cost,cls:d.cls,type:d.type,name:d.name};
  /* update 23 Echo: only a card played from your hand can Echo; Songweaver gives its Songs Echo; Sing Along gives the ally's next Tactic or Song Echo */
  let grant=false;if(actor&&actor.kind==="hero"&&/Tactic|Song/.test(d.type)){if(d.type==="Song"&&actor.name==="Songweaver"&&!actor.dead&&fromHand){/* Nov 12, 2026: first Song from your hand each turn; every one at Level 3 */actor.fl=actor.fl||{};if(actor.lvl>=3||actor.fl.swRound!==s.round){actor.fl.swRound=s.round;grant=true}}if(actor.fl.singRound===s.round){actor.fl.singRound=null;grant=true;log(s,`Sing Along: ${d.name} gains Echo.`,pid)}}
  queueResolve(s,pid,{k:"card",actor:actor&&actor.uid,card:{uid:c.uid,id:c.id,owner:c.owner},targets,modes:a.modes||[],x,combo:!!o.combo,echo:!!o.echo,hand:fromHand,grant},trig);
}
E.playCard=playCard;
/* the Hero that plays a rules-fix card: the one chosen on the board, else the acting Hero, else the first living one */
function fixHero(s,pid,a){const pl=P(s,pid);const h=a&&a.hero?heroByUid(s,a.hero):null;if(h&&h.owner===pid&&!h.dead)return h;return actorFor(s,pid)||living(pl)[0]||null}
E.fixHero=fixHero;
function hasEcho(d){return/(^|[.)] )Echo\.(\s|$)/.test(d.rules||"")}
E.hasEcho=hasEcho;
/* Combo cards played = cards with the Combo subtype (Hidden ones count when revealed, not when set) */
function countCombo(s,pid,actor,d){if(!d||d.sub!=="Combo")return;const pl=P(s,pid);pl.t.combos=(pl.t.combos||0)+1;
  if(!actor||actor.kind!=="hero")return;actor.fl.combos=(actor.fl.combosRound===s.round?actor.fl.combos:0)+1;actor.fl.combosRound=s.round;
  if(actor.name==="Grandmaster Reece"&&!actor.dead&&(actor.lvl>=3?actor.fl.combos%3===0:actor.fl.combos===3)){const t=autoTarget(s,pid,"strAlly")||actor;addMod(t,{str:2});log(s,`Grandmaster Reece: ${t.name} gains +2 STR this turn.`,pid)}}
E.countCombo=countCombo;
E.combosThisTurn=(s,pid)=>P(s,pid).t.combos||0;
/* opens a Hidden-card window for the opponent if one can respond, else resolves now */
function queueResolve(s,pid,cont,trig){const op=opp(pid);trig.pid=pid;
  if(!trig.noHidden&&windowFor(s,op,trig)){s.pend.unshift({type:"window",pid:op,trig,cont,mods:{}});log(s,`${P(s,op).name} may respond with a Hidden card…`);return}
  resolveCont(s,pid,cont,{})}
function closeWindow(s,pr){const m=pr.mods||{};if(m.retarget&&pr.cont&&pr.cont.targets){pr.cont.targets[m.retarget.i]=m.retarget.uid}resolveCont(s,pr.trig.pid,pr.cont,m)}
ASK.redirect=(s,pid,pr,v)=>{const w=s.pend.find(p=>p.type==="window");if(!w||v==null)return;w.mods.retarget={i:pr.data.i,uid:v};const t=resolveTarget(s,v);log(s,`Redirect: the new target is ${t?t.name:"?"}.`,pid)};
function doReveal(s,pid,o,pr,heroUid){const pl=P(s,pid);const d=def(o);const h=revealHero(s,pid,o,pr,heroUid);const cost=hiddenCost(s,pid,o);
  h.ex=true;pay(s,pid,h,cost);o.fd=false;pl.inv.splice(pl.inv.indexOf(o),1);if(pr&&pr.type==="window")pr.revealed=true;
  log(s,`${pl.name} reveals ${d.name}${cost?` (${cost} Aura)`:""}, exhausting ${h.name}.`,pid);
  trapGold(s,pid,d);
  const hs=hiddenScript(o);
  if(hs){const ctx=mkCtx(s,pid,h,d,o,[],{trig:pr.trig,mods:pr.mods,cont:pr.cont});withSrc(s,d.name,()=>hs.run(ctx));
    if(pr.mods.prevent||pr.mods.preventAll)pr.mods.by=pr.mods.by||d.name;
    if(pr.trig&&pr.trig.kind==="attack"&&(pr.mods.cancel||pr.mods.noDamage)&&!pr.mods.by){pr.mods.by=d.name;const t2=resolveTarget(s,pr.trig.target);const n=Math.max(0,(pr.trig.str||0)-(t2&&!t2.dead?defOf(s,t2):0));stat(s,"prev",pid,d.name,n)}
    const keep=hs.keep?hs.keep(ctx):false;if(keep)pl.inv.push(o);else if(d.type==="Item"||d.sup==="Hidden")toDisc(s,o);
    countCombo(s,pid,h,d);
    if(pr.mods.cancel){const wi=s.pend.indexOf(pr);if(wi>=0)s.pend.splice(wi,1);log(s,"The action is canceled.");afterCancel(s,pr)}
    if(E.hasCombo(d))comboTrigger(s,pid,h);
    return
  }else{countCombo(s,pid,h,d);toDisc(s,o);s.pend.splice(1,0,{type:"manual",pid,title:d.name,text:d.rules,hidden:true})}
}
function trapGold(s,pid,d){if(d.sub!=="Trap")return;const n=living(P(s,pid)).filter(h=>h.name==="Beast Tracker").length;if(n){P(s,pid).gold+=n;log(s,`Beast Tracker: ${P(s,pid).name} gains ${n} Gold.`,pid)}}
function afterCancel(s,pr){const c=pr.cont;if(c.k==="card"){const pl=P(s,pr.trig.pid);pl.disc.push(c.card)}}
function resolveCont(s,pid,cont,mods){
  if(cont.k==="none")return;
  if(cont.k==="attack"){resolveAttack(s,pid,cont,mods);return}
  if(cont.k==="dying"){const f=find(s,cont.hero);const h=f&&f.o;if(!h||h.dead)return;
    if(hpOf(s,h)>0){h.fl.dyingDone=false;return}
    if(cont.stage===1){const tr={kind:"dying",hero:h.uid,pid:h.owner};if(windowFor(s,opp(h.owner),tr)){s.pend.unshift({type:"window",pid:opp(h.owner),trig:tr,cont:{k:"dying",hero:h.uid,stage:2},mods:{}});log(s,`${P(s,opp(h.owner)).name} may respond with a Hidden card…`);return}}
    die(s,h);checkDeaths(s);return}
  const actor=cont.actor?heroByUid(s,cont.actor):null;
  if(cont.k==="ability"){const ab=HS()[actor.name][cont.idx];withSrc(s,`${actor.name}: ${ab.label||"ability"}`,()=>ab.run(mkCtx(s,pid,actor,DB[actor.id],null,cont.targets,{mods})));checkDeaths(s);return}
  if(cont.k==="item"){const isc=SC()[cont.itemName];const o=find(s,cont.item);const ctx=mkCtx(s,pid,actor,DB[cont.itemName],o?o.o:null,cont.targets,{mods,arrow:cont.arrow,modes:cont.modes||[],itemUid:cont.item,upg:(s.upg&&s.upg[cont.item])||0});
    if(cont.arrow)ctx.arrowBonus=arrowBonus(s,pid,actor);
    withSrc(s,cont.itemName,()=>isc.act.run(ctx));
    if(cont.refire){const pl=P(s,pid);const i=pl.disc.findIndex(c=>c.uid===cont.item);if(i>=0){const c=pl.disc.splice(i,1)[0];toInv(s,pid,invObj(s,pid,c));log(s,`Refire: ${cont.itemName} returns to ${pl.name}'s inventory.`,pid)}}
    if(cont.arrow){const pl=P(s,pid);pl.t.arrows=(pl.t.arrows||0)+1;pl.fl.arrowNext=null;pl.fl.multi=0;pl.fl.multiPierce=0;
      /* Wild Archer: after YOUR first Arrow each turn (any Hero firing it), ready it; L3: also after every Arrow it fires itself */
      living(pl).filter(h=>h.name==="Wild Archer"&&h.ex&&(pl.t.arrows===1||(h===actor&&h.lvl>=3))).forEach(h=>{h.ex=false;log(s,`${h.name} readies.`,pid)})}
    checkDeaths(s);return}
  const d=DB[cont.card.id];const sc=SC()[d.name];const pl=P(s,pid);
  const ctx=mkCtx(s,pid,actor,d,cont.card,cont.targets,{mods,modes:cont.modes,x:cont.x,comboed:cont.combo,echo:!!cont.echo});
  let stays=false;const pend0=s.pend.length;
  /* Spell Damage Pillar (update 16): each gives +2 Spell Damage to your next spell, then is sacrificed after that spell resolves (Pillars the spell conjures itself stay) */
  const pilBefore=d.type==="Spell"?pl.bf.filter(o=>o.name==="Spell Damage Pillar").map(o=>o.uid):[];
  if(sc&&sc.run){const r=withSrc(s,d.name,()=>sc.run(ctx));stays=r==="stay"}else if(sc&&cont.copy){log(s,`${d.name} has no effect to copy.`,pid)}
  else{s.pend.unshift({type:"manual",pid,title:d.name,text:d.rules,card:cont.card.id});}
  if(pilBefore.length){const n0=pl.bf.length;pl.bf=pl.bf.filter(o=>!pilBefore.includes(o.uid));const k=n0-pl.bf.length;if(k)log(s,`${pl.name} sacrifices ${k} Spell Damage Pillar${k>1?"s":""} (used by ${d.name}).`,pid)}
  if(d.type==="Enchantment"&&sc){stays=true}
  if(cont.copy){}
  else if(!stays){if((hasEcho(d)||cont.grant)&&cont.hand&&!cont.echo){pl.echo.push({card:cont.card,targets:cont.targets,modes:cont.modes,x:cont.x});log(s,`${d.name} is exiled (Echo): it will be played again at the next Dawn.`,pid)}
    else pl.disc.push(cont.card)}
  if(!cont.copy){
  /* Lightning Rod: after you play a Mage Spell, you may exhaust a Hero to conjure a Spell Damage Pillar */
  if(d.type==="Spell"&&d.cls==="Mage")pl.inv.filter(x=>!x.fd&&x.name==="Lightning Rod").forEach(()=>{const rd=living(pl).filter(h=>!h.ex);if(rd.length)ask(s,pid,"Lightning Rod: exhaust a Hero to conjure a Spell Damage Pillar?",rd.map(h=>({label:`Exhaust ${h.name}`,v:h.uid})).concat([{label:"No",v:null}]),"lightningRod",{name:"Lightning Rod"})});
  /* Split Kick: the next Combo card may also hit a second Hero */
  if(d.sub==="Combo"&&pl.fl.splitKick&&sc&&(cont.targets||[]).length){const t0=resolveTarget(s,cont.targets[0]);const sp=specsFor(sc,cont.modes)[0];
    if(t0&&t0.kind==="hero"&&sp){pl.fl.splitKick=false;const cs=candidates(s,pid,sp,{actor,card:d}).map(u=>resolveTarget(s,u)).filter(o=>o&&o.kind==="hero"&&o.uid!==t0.uid);
      if(cs.length)ask(s,pid,`Split Kick: second Hero for ${d.name}`,targetOpts(s,pid,cs,1).concat([{label:"No second target",v:null}]),"splitKick",{id:d.id,actor:actor&&actor.uid,modes:cont.modes||[],x:cont.x||0,rest:cont.targets.slice(1),name:"Split Kick"})}}
  /* Echo Performer: duplicate the Bard Tactic or Song it played */
  if(s.bonus&&s.bonus.pid===pid&&s.bonus.dup&&d.cls==="Bard"&&/Tactic|Song/.test(d.type)){s.bonus.dup=false;log(s,`Echo Performer duplicates ${d.name}.`,pid);copyTargets(s,pid,{id:d.id,actor:actor&&actor.uid,modes:cont.modes||[],x:cont.x||0,picked:[],orig:cont.targets||[]})}
  /* triggers on card played */
  if(d.type==="Spell"){living(pl).forEach(h=>{if(h.name==="Diviner Mage")pushScry(s,pid,1)})}
  /* Staff of Doom (update 21): the first Spell the equipped Hero plays each turn (every Spell when upgraded): target Hero loses HP equal to its Aura cost */
  if(d.type==="Spell"&&actor&&!actor.dead&&hasEqN(actor,"Staff of Doom")&&(hasUpN(s,actor,"Staff of Doom")||actor.fl.staffRound!==s.round)){actor.fl.staffRound=s.round;
    const n=d.cost==="X"?(cont.x||0):num(d.cost);const hs=inPlayTargets(s).filter(o=>o.kind==="hero"&&(!stealth(s,o)||ctrl(s,o)===pid));
    if(n>0&&hs.length)ask(s,pid,`Staff of Doom: target Hero loses ${n} HP`,targetOpts(s,pid,hs.filter(o=>ctrl(s,o)!==pid),n).concat(targetOpts(s,pid,hs.filter(o=>ctrl(s,o)===pid),n)).concat([{label:"No one",v:null}]),"loseTo",{n,name:"Staff of Doom"})}
  if(d.type==="Song"&&actor&&!actor.dead&&heroIs(actor,"Bard")){living(pl).filter(h=>h.name==="Harmony Sage").forEach(hs=>heal(s,hs,actor,1,pid))}
  if(d.type==="Song"&&pl.inv.some(o=>!o.fd&&o.name==="Tip Jar"))tip(s,pid,"Tip Jar");
  if(d.type==="Song"){const tun=pl.inv.find(o=>!o.fd&&o.name==="The Forbidden Tuner");if(tun){const ts=inPlayTargets(s).filter(o=>!stealth(s,o)||ctrl(s,o)===pid);
      /* the player picks the target (best damage target listed first; the AI takes option 0) */
      if(ts.length)ask(s,pid,"The Forbidden Tuner: deal 1 damage to any target (Piercing 1)",targetOpts(s,pid,ts,1),"dmgTo",{n:1,name:"The Forbidden Tuner",pierce:1,src:tun.uid})}
    if(actor&&hasEqN(actor,"War Lute")){const t=autoTarget(s,pid,"strAlly");if(t)addMod(t,{str:hasUpN(s,actor,"War Lute")?2:1})}
    if(actor&&hasEqN(actor,"Celestial Harp")&&pl.t.songs===2)living(pl).forEach(h=>heal(s,actor,h,1));
    if(actor&&hasUpN(s,actor,"Celestial Harp")&&pl.t.songs===1){const t=autoTarget(s,pid,"healAlly");if(t)heal(s,actor,t,1)}
    if(actor&&hasUpN(s,actor,"Silver Fiddle")&&actor.fl.fiddleRound!==s.round){actor.fl.fiddleRound=s.round;log(s,"Upgraded Silver Fiddle: draw a card.",pid);draw(s,pid,1)}}
  /* upgraded Jun Lao's Headband: whenever you play a Combo card, the equipped Hero gains +1 STR this turn */
  if(d.sub==="Combo"||E.hasCombo(d))living(pl).forEach(h=>{if(hasUpN(s,h,"Jun Lao's Headband")){addMod(h,{str:1});log(s,`Jun Lao's Headband: ${h.name} +1 STR this turn.`,pid)}});
  if(d.sub==="Combo"&&actor&&actor.name==="Sage Monk"&&!actor.dead&&actor.fl.sageRound!==s.round&&pl.lib.length){actor.fl.sageRound=s.round;log(s,"Sage Monk: first Combo card this turn, Scry 1.",pid);pushScry(s,pid,1)}
  if(E.hasCombo(d)){const added=s.pend.length-pend0;
    /* Combo waits until the card's own Scry/choice prompts are answered */
    if(added>0)s.pend.splice(added,0,{type:"comboGo",pid,actor:actor&&actor.uid});else comboTrigger(s,pid,actor)}
  }
  checkDeaths(s)}
ASK.loseTo=(s,pid,pr,v)=>{if(v==null)return;const t=resolveTarget(s,v);if(!t||t.dead)return;loseHp(s,t,pr.data.n,pr.data.name);stat(s,"dmg",pid,pr.data.name,pr.data.n)};
ASK.lightningRod=(s,pid,pr,v)=>{if(v==null)return;const h=heroByUid(s,v);if(!h||h.ex)return;h.ex=true;log(s,`Lightning Rod: ${h.name} is exhausted.`,pid);makePillar(s,pid,"Spell Damage Pillar")};
ASK.splitKick=(s,pid,pr,v)=>{if(v==null)return;copyCard(s,pid,pr.data.actor,pr.data.id,[v].concat(pr.data.rest||[]),pr.data.modes,pr.data.x)};
function arrowBonus(s,pid,actor){const pl=P(s,pid);let b=0,ign=false,pierce=0;
  if(actor){if(actor.name==="Hawkeye")b+=actor.lvl>=6?2:actor.lvl>=3?1:0;if(hasEqN(actor,"Longbow"))b+=hasUpN(s,actor,"Longbow")?2:1;if(hasUpN(s,actor,"Mystic Quiver")&&actor.fl.quiverRound!==s.round){actor.fl.quiverRound=s.round;b+=1}if(hasUpN(s,actor,"Heavy Bow"))pierce+=1}
  const n=pl.fl.arrowNext;if(n){b+=n.dmg||0;if(n.ign)ign=true}
  if(pl.fl.rapidPierce)pierce+=1;pierce+=pl.fl.multiPierce||0;b+=pl.fl.multi||0;
  return{dmg:b,ignoreDef:ign,pierce,mult:actor&&hasEqN(actor,"Heavy Bow")?2:1}}
function comboTrigger(s,pid,actor){const pl=P(s,pid);if(!actor||actor.dead)return;
  living(pl).forEach(h=>{if(h.name==="Monastery Stalwart")addMod(h,{def:1})});
  const shrine=pl.inv.find(o=>o.name==="Petal Shrine"&&!o.fd);if(shrine){shrine.ctr=shrine.ctr||{};shrine.ctr.petal=(shrine.ctr.petal||0)+1;if(shrine.ctr.petal>=3){shrine.ctr.petal=0;pl.fl.petalDisc=true;log(s,"Petal Shrine: next Combo card costs 1 less.",pid)}}
  const look=hasEqN(actor,"Jun Lao's Headband")?2:1;
  if(!pl.lib.length)return;
  const top=pl.lib.slice(-look).reverse();
  log(s,`Combo: ${pl.name} reveals ${top.map(c=>DB[c.id].name).join(", ")}.`,pid);
  const comboTop=top.filter(c=>DB[c.id].sub==="Combo");
  if(!comboTop.length)return;
  const cands=comboTop.map(c=>c.uid).concat(pl.hand.filter(c=>DB[c.id].sub==="Combo").map(c=>c.uid));
  s.pend.unshift({type:"combo",pid,actor:actor.uid,cands})}

/* ---------- attacks ---------- */
/* Banding bonuses: Rousing Bandleader L3 = +1 STR per banded Hero; Duet = +2 once if its Song condition was met */
function bandBonus(s,att,mem){const all=[att,...mem];const pl=P(s,att.kind==="hero"?att.owner:att.ctrl);let b=0;
  if(living(pl).some(h=>h.name==="Rousing Bandleader"&&h.lvl>=3))b+=all.filter(m=>m.kind==="hero").length;
  if(all.some(m=>m.kind==="hero"&&m.fl.duetRound===s.round))b+=2;return b}
function bandTotal(s,att,mem,tgt){return[att,...mem].reduce((n,m)=>n+dmgStr(s,m,tgt),0)+bandBonus(s,att,mem)}
E.bandTotal=bandTotal;
function startAttack(s,pid,attUid,tgtUid,o){const f=find(s,attUid);if(!f)return;const att=f.o;const tgt=resolveTarget(s,tgtUid);if(!tgt)return;
  if(!o.noExhaust)att.ex=true;
  const tp=ctrl(s,tgt);
  /* Chains of Darkness (update 21, was Resistance Shield): the chained Hero pays 1 Aura to attack */
  if(!o.free&&chained(att)){P(s,pid).aura=Math.max(0,P(s,pid).aura-1);log(s,`Chains of Darkness: ${att.name} pays 1 Aura to attack.`,pid)}
  if(o.band)o.band.forEach(u=>{const m=find(s,u);if(m&&chained(m.o)){P(s,pid).aura=Math.max(0,P(s,pid).aura-1);log(s,`Chains of Darkness: ${m.o.name} pays 1 Aura to attack.`,pid)}});
  burdenFat(s,att);if(o.band)o.band.forEach(u=>{const m=find(s,u);if(m)burdenFat(s,m.o)});
  att.attacks=(att.atkRound===s.round?att.attacks:0)+1;att.atkRound=s.round;if(att.fl&&att.fl.forceAtk){delete att.fl.forceAtk}
  if(o.band){const mem=o.band.map(u=>find(s,u)).filter(Boolean).map(x=>x.o);mem.forEach(m=>{m.ex=true;m.attacks=(m.atkRound===s.round?m.attacks:0)+1;m.atkRound=s.round});
    const parts=[att,...mem].map(m=>`${m.name} ${dmgStr(s,m,tgt)}`);log(s,`⚔ Band attack on ${tgt.name}: ${parts.join(" + ")}${bandBonus(s,att,mem)?` + ${bandBonus(s,att,mem)} bonus`:""} = ${bandTotal(s,att,mem,tgt)} STR.`,pid)}
  else log(s,`⚔ ${att.name} attacks ${tgt.name}.`,pid);
  if(att.kind==="hero"){if(att.name==="Dawn Priest"||hasEqN(att,"Mace of Dawn")){const t=autoTarget(s,pid,"healAlly");if(t)heal(s,att,t,hasUpN(s,att,"Mace of Dawn")?2:1)}}
  /* Caltrops: whenever an enemy attacks a Hero you control, the attacker loses 2 HP (per copy) */
  if(tgt.kind==="hero"&&tp!==pid){const n=invCount(P(s,tp),"Caltrops");if(n){loseHp(s,att,2*n,"Caltrops");stat(s,"dmg",tp,"Caltrops",2*n)}}
  const trig={kind:"attack",attacker:attUid,target:tgtUid,pid,noHidden:!!o.noHidden,str:o.band?bandTotal(s,att,o.band.map(u=>find(s,u)).filter(Boolean).map(x=>x.o),tgt):dmgStr(s,att,tgt),band:o.band||null};
  const cont={k:"attack",att:attUid,tgt:tgtUid,o};const pre=[];
  if(att.kind==="hero"&&heroIs(att,"Barbarian")){const pl=P(s,pid);pl.inv.filter(x=>!x.fd&&(x.name==="Xakro's War Horn"||x.name==="Battle Horn")).forEach(()=>{if(pl.hand.length)pre.push({title:"Xakro's War Horn: discard a card at random? Your Barbarians get +X STR this turn, where X is its Aura cost.",opts:pl.hand.length>=3?[{label:"Yes, discard at random",v:1},{label:"No",v:0}]:[{label:"No",v:0},{label:"Yes, discard at random",v:1}],op:"battleHorn",data:{name:"Xakro's War Horn"}})})}
  if(att.kind==="hero"&&att.fl.hackRound===s.round){att.fl.hackRound=null;const cs=candidates(s,pid,{k:"enemy"},{attack:true,actor:att}).filter(u=>u!==tgtUid).map(u=>resolveTarget(s,u)).filter(Boolean);
    if(cs.length)pre.push({title:"Hack and Slash: choose a second target for this attack",opts:targetOpts(s,pid,cs,strOf(s,att)).concat([{label:"No second target",v:null}]),op:"hack",data:{name:"Hack and Slash"}})}
  if(pre.length){s.pend.unshift({type:"attackGo",pid,cont,trig});pre.reverse().forEach(q=>ask(s,pid,q.title,q.opts,q.op,q.data));return}
  queueResolve(s,pid,cont,trig)}
E.startAttack=startAttack;
/* Xakro's War Horn (was Battle Horn): +X STR to Barbarians, X = the discarded card's Aura cost (X costs count as 0) */
ASK.battleHorn=(s,pid,pr,v)=>{if(!v)return;const pl=P(s,pid);if(!pl.hand.length)return;const x=pl.hand.splice(ri(s,pl.hand.length),1)[0];pl.disc.push(x);const n=Math.max(0,parseInt(DB[x.id].cost,10)||0);log(s,`Xakro's War Horn: ${pl.name} discards ${DB[x.id].name} at random; Barbarians get +${n} STR this turn.`,pid);if(n)living(pl).filter(h=>heroIs(h,"Barbarian")).forEach(h=>addMod(h,{str:n}))};
ASK.hack=(s,pid,pr,v)=>{if(v==null)return;const g=s.pend.find(p=>p.type==="attackGo");if(g){g.cont.o=Object.assign({},g.cont.o,{second:v})}};
function resolveAttack(s,pid,cont,mods){const f=find(s,cont.att);let tgt=resolveTarget(s,cont.tgt);const o=cont.o||{};
  if(f&&f.o.dead&&!mods.cancel){log(s,`${f.o.name} died before its attack landed.`);postAttack(s,pid,cont,0);return}
  if(mods.cancel||!f||!tgt||tgt.dead){if(mods.cancel)log(s,"The attack is canceled.");postAttack(s,pid,cont,0);return}
  const att=f.o;
  if(mods.stepIn&&mods.stepIn.from===cont.tgt){const p=find(s,mods.stepIn.to);if(p&&!p.o.dead){log(s,`${p.o.name} steps in and takes the attack.`);tgt=p.o}}
  let str=(o.band?bandTotal(s,att,o.band.map(u=>find(s,u)).filter(Boolean).map(x=>x.o).filter(m=>!m.dead),tgt):dmgStr(s,att,tgt))+(mods.str||0)+(o.str||0);
  if(att.kind==="hero"&&att.name==="Skullcrusher"&&att.attacks===2)str+=3;
  let pierce=(o.pierce||0)+(att.kind==="hero"&&att.name==="Precision Fighter"&&strOf(s,att)>=3?1:0)+(P(s,pid).pm.pierce||0)+(att.kind==="hero"&&hasEqN(att,"Mithril Blade")?2:0)+(att.kind==="hero"?eqList(att).filter(e=>isUp(s,e)&&(e.name==="Sword of Riverstead"||e.name==="Long Dagger"||e.name==="Shadow Cloak")).length:0);
  const ign=o.ignoreDef||(att.kind==="hero"&&att.name==="Savage Raider"&&enraged(s,att));
  let dealt=0;
  if(mods.noDamage){log(s,`The attack deals no damage.`)}
  else dealt=damage(s,att,tgt,Math.max(0,str),{combat:true,pierce,ignoreDef:ign,band:!!o.band});
  if(o.second){const t2=resolveTarget(s,o.second);if(t2&&!t2.dead&&!att.dead){log(s,`${att.name} also hits ${t2.name} (Hack and Slash).`);damage(s,att,t2,Math.max(0,str),{combat:true,pierce,ignoreDef:ign})}}
  if(mods.retaliate&&dealt>0&&!att.dead){log(s,`Retribution: ${att.name} takes ${dealt} damage back.`);damage(s,{name:"Retribution"},att,dealt,{card:true,noTrig:true,srcName:"Retribution"})}
  postAttack(s,pid,cont,dealt)}
function postAttack(s,pid,cont,dealt){const f=find(s,cont.att);const o=cont.o||{};const att=f&&f.o;const tgt=resolveTarget(s,cont.tgt);
  if(!att)return;
  if(o.after==="readyIfKill"&&tgt&&tgt.dead){att.ex=false;log(s,`${att.name} readies.`,pid)}
  if(o.after==="levelIfDmg"&&dealt>0&&att.kind==="hero"){levelUp(s,att,"str")}
  if(o.after==="exhaustTarget"&&tgt&&!tgt.dead){tgt.ex=true;log(s,`${tgt.name} is exhausted.`)}
  if(att.kind==="hero"){
    if(att.fl.runBackRound===s.round&&!att.fl.runBackUsed){att.fl.runBackUsed=true;att.ex=false;log(s,`Run It Back: ${att.name} readies.`,pid)}
    if(att.fl.twiceRound===s.round&&!att.fl.twiceUsed){att.fl.twiceUsed=true;att.ex=false;log(s,`${att.name} may attack again.`,pid)}
    if(att.fl.loseCtrlRound===s.round){}
    if(dealt>0&&att.kind==="hero"&&hasEqN(att,"Gauntlets of Growth")&&att.fl.leveled!==s.round&&att.fl.noLevel!==s.round&&att.lvl<6&&!arrested(att)){att.fl.leveled=s.round;log(s,`Gauntlets of Growth: ${att.name} gains a level.`,pid);levelUp(s,att,"str")}}
  checkDeaths(s)}

/* ---------- scry / choose prompts ---------- */
function pushScry(s,pid,n,then){const pl=P(s,pid);n=Math.min(n,pl.lib.length);if(n<=0){if(then)runThen(s,pid,then);return}
  s.pend.unshift({type:"scry",pid,cards:pl.lib.slice(-n).reverse().map(c=>c.uid),then:then||null})}
E.pushScry=pushScry;
function finishScry(s,pid,pr,a){const pl=P(s,pid);const ids=pr.cards.filter(u=>pl.lib.some(c=>c.uid===u));/* skip cards that left the library meanwhile */const bottom=(a.bottom||[]).filter(u=>ids.includes(u));
  let top=(a.order||ids).filter(u=>ids.includes(u)&&!bottom.includes(u));ids.forEach(u=>{if(!top.includes(u)&&!bottom.includes(u))top.push(u)});
  const pick=u=>{const i=pl.lib.findIndex(c=>c.uid===u);return pl.lib.splice(i,1)[0]};
  const topCards=top.map(pick),botCards=bottom.map(pick);
  pl.lib.unshift(...botCards);pl.lib.push(...topCards.reverse());
  log(s,`${pl.name} scries ${ids.length}${bottom.length?` (${bottom.length} to the bottom)`:""}.`,pid);
  living(pl).filter(h=>h.name==="Sage Monk"&&h.lvl>=3).forEach(h=>{addMod(h,{str:ids.length});log(s,`Sage Monk gains +${ids.length} STR this turn.`,pid)});
  if(pr.then)runThen(s,pid,pr.then)}
function runThen(s,pid,t){if(t.draw)draw(s,pid,t.draw)}
/* choose: {pid,title,cards:[uid],from:'hand'|'lib'|'opHand'|'disc',min,max,op} */
function pushChoose(s,pid,pr){if(!pr.cards.length)return;const show={};s.p.forEach(pl=>["hand","lib","disc"].forEach(z=>pl[z].forEach(c=>{if(pr.cards.includes(c.uid))show[c.uid]=c.id})));s.pend.unshift(Object.assign({type:"choose",pid,show},pr))}
E.pushChoose=pushChoose;
function finishChoose(s,pid,pr,picks){picks=picks.filter(u=>pr.cards.includes(u)).slice(0,pr.max);
  if(picks.length<(pr.min||0))picks=pr.cards.slice(0,pr.min);
  const ops=root.CQ_CHOOSE_OPS||{};const fn=ops[pr.op];if(fn)fn(s,pid,pr,picks)}

/* ---------- manual panel ---------- */
function manualOp(s,pid,a){const pl=P(s,pid);const t=a.target?resolveTarget(s,a.target):null;const n=Math.max(0,Math.min(99,a.n|0));const who=`✋ ${pl.name}`;
  switch(a.op){
  case"endAction":{const i=s.pend.findIndex(p=>p.type==="manual"&&p.pid===pid);if(i>=0)s.pend.splice(i,1);log(s,`${who} ends the action by rules fix.`,pid);
    if(s.phase==="battle"&&!s.cur&&!s.pend.length&&s.prio===pid){if(s.bonus&&s.bonus.pid===pid)endBonus(s);advance(s,pid)}break}
  case"dmg":if(t){log(s,`${who} (by hand):`,pid);damage(s,{name:"Manual effect"},t,n,{card:true,noTrig:true})}break;
  case"lose":if(t)loseHp(s,t,n,"by hand");break;
  case"heal":if(t){log(s,`${who} heals ${t.name} by hand.`,pid);heal(s,null,t,n,pid)}break;
  case"status":if(t&&a.k&&STATUS.includes(a.k)){if(a.neg){t.st[a.k]=Math.max(0,t.st[a.k]-1);log(s,`${who} removes a ${E.STATUS_NAME[a.k]} counter from ${t.name}.`,pid)}else{log(s,`${who}:`,pid);addStatus(s,t,a.k,1)}}break;
  case"str":case"def":if(t&&t.mods){addMod(t,{[a.op]:a.neg?-n:n});log(s,`${who}: ${t.name} ${a.neg?"-":"+"}${n} ${a.op.toUpperCase()} this turn.`,pid)}break;
  case"guard":if(t&&t.kind==="hero"){t.guard+=n;log(s,`${who}: ${t.name} gains Guard ${n}.`,pid)}break;
  case"draw":log(s,`${who}:`,pid);draw(s,pid,n);break;
  case"aura":pl.aura=Math.max(0,pl.aura+(a.neg?-n:n));log(s,`${who} ${a.neg?"loses":"gains"} ${n} Aura.`,pid);break;
  case"gold":pl.gold=Math.max(0,pl.gold+(a.neg?-n:n));log(s,`${who} ${a.neg?"loses":"gains"} ${n} Gold.`,pid);break;
  case"exhaust":if(t&&"ex"in t){t.ex=!a.neg;log(s,`${who}: ${t.name} ${a.neg?"readies":"is exhausted"}.`,pid)}break;
  case"level":if(t&&t.kind==="hero"){if(a.neg){if(t.lvl>0){if(t.lvl%2===0){const k=["str","def","aura"].find(k=>t.bon[k]>0);if(k)t.bon[k]--}t.lvl--;log(s,`${who}: ${t.name} loses a level (Level ${t.lvl}).`,pid)}}else levelUp(s,t,a.k||"str")}break;
  case"summon":if(TOK[a.name]&&TOK[a.name].tkind==="Summon")makeSummon(s,pid,a.name);break;
  case"pillar":if(a.name==="Spell Damage Pillar"||a.name==="Pain Pillar")makePillar(s,pid,a.name);break;
  case"dagger":{const e=makeEqToken(s,pid,a.name==="Viper Fang Dagger"?"Viper Fang Dagger":"Dagger");toInv(s,pid,e);log(s,`${who} creates a ${e.name} token in inventory.`,pid);break}
  case"doll":E.makeDoll(s,pid);break;
  case"destroy":if(t&&t.kind!=="hero"&&t.kind!=="player"){log(s,`${who}:`,pid);destroyObj(s,t,!!a.neg)}break;
  case"discard":{const c=pl.hand.find(c=>c.uid===a.card);if(c){pl.hand.splice(pl.hand.indexOf(c),1);pl.disc.push(c);log(s,`${who} discards ${DB[c.id].name}.`,pid)}break}
  case"mill":{const who=a.name==="Opponent"?opp(pid):pid;log(s,`✋ ${pl.name} (by hand):`,pid);mill(s,who,n);break}
  case"equipfree":{if(!t||t.kind!=="hero"||t.dead||t.owner!==pid)break;let i=pl.hand.findIndex(c=>c.uid===a.card),o=null;
    if(i>=0&&DB[pl.hand[i].id]&&DB[pl.hand[i].id].kind==="equip")o=eqObjFromCard(s,pid,pl.hand.splice(i,1)[0]);else{i=pl.inv.findIndex(x=>x.uid===a.card&&x.kind==="equip");if(i>=0)o=pl.inv.splice(i,1)[0]}
    if(o){log(s,`✋ ${pl.name} equips ${o.name} to ${t.name} for free${canUseEq(s,t,o)?"":" (normally not allowed for this Hero)"}.`,pid);equipTo(s,t,o)}break}
  case"revealtop":{const who=a.name==="Opponent"?opp(pid):pid;const lp=P(s,who);const top=lp.lib.slice(-Math.max(1,n)).reverse();const pr=s.pend[0];
    log(s,`✋ ${pl.name} reveals the top ${top.length} of ${lp.name}'s library: ${top.map(c=>DB[c.id].name).join(", ")||"(empty)"}.`,pid);
    if(pr&&pr.type==="manual"){pr.revTop={pid:who,uids:top.map(c=>c.uid)};pr.revealed=(pr.revealed||[]).concat(top.map(c=>({name:DB[c.id].name,text:DB[c.id].rules||""})))}break}
  case"revmove":{const pr=s.pend[0];if(!pr||!pr.revTop)break;const lp=P(s,pr.revTop.pid);const i=lp.lib.findIndex(c=>c.uid===a.card);if(i<0)break;const c=lp.lib.splice(i,1)[0];const nm=DB[c.id].name;
    if(a.k==="bottom"){lp.lib.unshift(c);log(s,`✋ ${pl.name} puts ${nm} on the bottom of ${lp.name}'s library.`,pid)}
    else if(a.k==="hand"){lp.hand.push(c);log(s,`✋ ${nm} goes to ${lp.name}'s hand.`,pid)}
    else if(a.k==="discard"){lp.disc.push(c);log(s,`✋ ${nm} goes to ${lp.name}'s discard pile.`,pid)}
    else{lp.lib.push(c);log(s,`✋ ${pl.name} puts ${nm} on top of ${lp.name}'s library.`,pid)}
    if(a.k!=="top")pr.revTop.uids=pr.revTop.uids.filter(u=>u!==c.uid);break}
  case"fromDisc":{const c=pl.disc.find(c=>c.uid===a.card);if(c){pl.disc.splice(pl.disc.indexOf(c),1);pl.hand.push(c);log(s,`${who} returns ${DB[c.id].name} from discard to hand.`,pid)}break}
  case"discToInv":{const c=pl.disc.find(c=>c.uid===a.card);if(c){pl.disc.splice(pl.disc.indexOf(c),1);log(s,`${who} returns ${DB[c.id].name} from discard to inventory.`,pid);toInv(s,pid,invObj(s,pid,c))}break}
  case"revive":if(t&&t.kind==="hero"&&t.dead&&!t.surr&&t.owner===pid){t.dead=false;t.dmg=Math.max(0,maxHp(s,t)-Math.max(1,n));t.ex=true;log(s,`${who} revives ${t.name} with ${maxHp(s,t)-t.dmg} HP.`,pid)}break;
  case"unequip":if(t&&t.kind==="equip")unequip(s,t);break;
  case"move":if(t&&t.kind==="hero"){const op=P(s,t.owner);const i=op.heroes.indexOf(t);const j=Math.max(0,Math.min(2,a.n|0));op.heroes.splice(i,1);op.heroes.splice(j,0,t);log(s,`${who}: ${t.name} moves to ${POS[j]}.`,pid)}break;
  case"reveal":{let o=pl.inv.find(x=>x.uid===a.card&&x.fd),from="inv";if(!o){o=pl.hand.find(x=>x.uid===a.card&&DB[x.id]&&DB[x.id].sup==="Hidden");from="hand"}
    if(!o)break;const d=DB[o.id];const cost=hiddenCost(s,pid,o);const hh=revealHero(s,pid,o,null,t&&t.kind==="hero"&&t.owner===pid?t.uid:null);
    if(cost>pl.aura){log(s,`${who}: not enough Aura to reveal ${d.name} (costs ${cost}).`,pid);break}
    pay(s,pid,hh,cost);if(hh)hh.ex=true;(from==="inv"?pl.inv:pl.hand).splice((from==="inv"?pl.inv:pl.hand).indexOf(o),1);pl.disc.push({uid:o.uid,id:o.id,owner:o.owner});
    log(s,`${who} reveals ${d.name} from ${from==="inv"?"inventory":"hand"}${cost?` (${cost} Aura)`:""}${hh?`, exhausting ${hh.name}`:""}: ${d.rules.replace(/\{A\}/g," Aura").replace(/\{L(\d)\}/g,"[Level $1]")}`,pid);
    trapGold(s,pid,d);countCombo(s,pid,hh,d);const pr=s.pend[0];if(pr&&pr.type==="manual")pr.revealed=(pr.revealed||[]).concat([{name:d.name,text:d.rules}]);break}
  case"cancelAction":log(s,`${who} cancels the action.`,pid);break;
  }
  checkDeaths(s)}

/* ---------- auto targets for passive triggers ---------- */
function autoTarget(s,pid,kind){const me=P(s,pid),op=P(s,opp(pid));
  if(kind==="enemy"){const c=living(op).filter(h=>!stealth(s,h));if(!c.length)return op.bf.find(o=>o.kind==="summon"&&!stealth(s,o))||null;return c.sort((a,b)=>hpOf(s,a)-hpOf(s,b))[0]}
  if(kind==="healAlly"){const c=living(me).filter(h=>h.dmg>0);return c.sort((a,b)=>b.dmg-a.dmg)[0]||null}
  if(kind==="statusAlly"){return living(me).find(h=>STATUS.some(k=>h.st[k]>0))||null}
  if(kind==="strAlly"){return living(me).filter(h=>!h.ex).sort((a,b)=>strOf(s,b)-strOf(s,a))[0]||living(me)[0]||null}
  return null}
E.autoTarget=autoTarget;

/* ---------- flow ---------- */
/* Cloak of Hate (update 21): whenever its Hero becomes exhausted (ready -> exhausted), deal 2 Dark damage to any target */
function cloakCheck(s){s.p.forEach((pl,pid)=>pl.heroes.forEach(h=>{const was=!!h.fl.exSeen;h.fl.exSeen=!!(h.ex&&!h.dead);
  if(h.ex&&!was&&!h.dead&&hasEqN(h,"Cloak of Hate")){const ts=inPlayTargets(s).filter(o=>!stealth(s,o)||ctrl(s,o)===pid);
    eqList(h).filter(e=>e.name==="Cloak of Hate").forEach(()=>ask(s,pid,`Cloak of Hate: ${h.name} is exhausted, deal 2 Dark damage to any target`,targetOpts(s,pid,ts,2).concat([{label:"No damage",v:null}]),"dmgTo",{n:2,name:"Cloak of Hate",type:"Dark",src:h.uid}))}}))}
function settle(s){let guard=0;
  while(!s.over&&guard++<200){
    if(s.phase==="battle")cloakCheck(s);
    if(s.pend.length){
      /* Nov 12, 2026: once a Hidden card (such as Redirect) has been revealed in a response window and has finished resolving,
         the window closes on its own unless that player can still reveal another Hidden card; it no longer asks "Don't reveal" afterwards */
      if(s.pend[0].type==="window"&&s.pend[0].revealed&&!promptOptions(s,s.pend[0].pid,s.pend[0]).some(o=>o.type==="reveal")){const pr=s.pend.shift();closeWindow(s,pr);continue}
      if(s.pend[0].type==="comboGo"){const pr=s.pend.shift();comboTrigger(s,pr.pid,pr.actor?heroByUid(s,pr.actor):null);continue}
      if(s.pend[0].type==="attackGo"){const pr=s.pend.shift();const f=find(s,pr.cont.att);if(f&&!f.o.dead)queueResolve(s,pr.pid,pr.cont,pr.trig);continue}
      if(s.pend[0].type==="bottomRest"){const pr=s.pend.shift();const pl=P(s,pr.pid);let n=0;pr.uids.forEach(u=>{const i=pl.lib.findIndex(c=>c.uid===u);if(i>=0){pl.lib.unshift(pl.lib.splice(i,1)[0]);n++}});if(n)log(s,`${pl.name} puts ${n} revealed card${n>1?"s":""} on the bottom of their library.`,pr.pid);continue}
      /* AI-free auto answers handled by controller */return}
    if(s.trig10&&s.trig10.length){const v=s.trig10.shift();const trig={kind:"party10",pid:opp(v)};if(windowFor(s,v,trig)){s.pend.unshift({type:"window",pid:v,trig,cont:{k:"none"},mods:{}});log(s,`${P(s,v).name}'s party has taken 10 damage this turn and may respond with a Hidden card…`)}continue}
    if(s.qatk){const q=s.qatk;s.qatk=null;const f=find(s,q.att);const t=resolveTarget(s,q.tgt);if(f&&t&&!t.dead&&!f.o.dead){startAttack(s,q.pid,q.att,q.tgt,q.o||{});continue}}
    if(s.cur){const pid=s.cur.pid;
      /* Rapacious Encore: after an enemy action deals damage to your side */
      if(s.dmgTo&&!s.cur.encore&&s.phase==="battle"){const d=opp(pid);const n=s.dmgTo[d]||0;s.dmgTo=null;
        if(n>0){const tr={kind:"afterDmg",pid,amount:n,noHidden:false};if(windowFor(s,d,tr)){s.cur.encore=true;s.pend.unshift({type:"window",pid:d,trig:tr,cont:{k:"none"},mods:{}});log(s,`${P(s,d).name} may respond with a Hidden card…`);continue}}}
      s.cur=null;if(s.phase==="battle"){
        if(s.bonus&&s.bonus.pid===pid){s.bonus.n--;
          /* Line It Up: the next Ranger in line fires its Arrow */
          while(s.bonus&&s.bonus.queue&&s.bonus.queue.length&&s.bonus.n<=0){s.bonus.uid=s.bonus.queue.shift();s.bonus.n=1;const h=heroByUid(s,s.bonus.uid);if(!h||h.dead||h.ex)s.bonus.n=0}
          if(s.bonus.n<=0||!actorFor(s,pid))endBonus(s);if(s.bonus){s.prio=pid;continue}}
        advance(s,pid)}continue}
    if(s.phase==="dawn"&&s.dawnDone.every(Boolean)){startBattle(s);continue}
    if(s.phase==="battle"){const pid=s.prio;
      if(!s.passed[pid]&&!hasRealOption(s,pid)){log(s,`${P(s,pid).name} has no actions left and passes.`,pid);s.passed[pid]=true;advance(s,pid);continue}
      if(s.passed[0]&&s.passed[1]){doDusk(s);continue}
      return}
    return}
  checkWin(s)}
E.settle=settle;
function hasRealOption(s,pid){return battleOptions(s,pid).some(o=>!["pass","manualAbility","clear","soul"].includes(o.type))||battleOptions(s,pid).some(o=>o.type==="soul")}
function advance(s,pid){s.acted[pid]=true;if(s.passed[0]&&s.passed[1])return;
  const o=opp(pid);
  if(!s.passed[o]&&!s.acted[o]){s.prio=o;return}
  /* both acted (or other passed): next position */
  /* Lead → Center → Closer → Last (only when a ready Hero has stepped back) → Lead */
  const anyBack=s.p.some(pl=>pl.heroes.some(h=>!h.dead&&!h.ex&&h.fl.stepped===s.round));
  s.pos=s.pos===2?(anyBack?3:0):s.pos===3?0:s.pos+1;s.acted=[false,false];
  s.prio=!s.passed[s.init]?s.init:opp(s.init)}
function startRound(s){s.round++;s.phase="dawn";log(s,`— Round ${s.round}: Dawn —`);doDawn(s)}
function doDawn(s){
  s.p.forEach((pl,pid)=>{
    pl.heroes.forEach(h=>{if(h.dead)return;
      if(h.fat){h.fat=0;h.fl.fatRested=true;h.ex=true;log(s,`${h.name} is Fatigued and doesn't ready this Dawn (Fatigue counter removed).`,pid)}
      else if(h.med&&h.keepMed){h.plus++;h.fl.fatRested=false;log(s,`${h.name} keeps Meditating (meditation counter: ${h.plus}).`,pid)}
      else if(h.med){h.plus=(h.plus||0)+1;log(s,`${h.name} gets a meditation counter (${h.plus}) and wakes.`,pid);h.ex=false;h.fl.fatRested=false}/* update 27: counter first, then wake */
      else{h.ex=false;h.fl.fatRested=false}
      h.eqGuard=guardEq(h,s)});
    pl.bf.forEach(o=>{if(o.kind==="summon")o.ex=false});
    pl.inv.forEach(o=>{if(o.exh)o.exh=false});
    let aura=0;living(pl).forEach(h=>{if(h.fl.noAuraRound===s.round)return;aura+=auraStat(h);h.ench.forEach(e=>{if(e.name==="Aura Leech")aura-=1})});
    if(pl.fl.auraPenalty){aura-=pl.fl.auraPenalty;pl.fl.auraPenalty=0}
    pl.aura=Math.max(0,aura);
  });
  s.p.forEach((pl,pid)=>{const all=[...living(pl),...pl.bf.filter(o=>o.kind==="summon")];
    /* Burned, Poisoned and Wounded counters make the target lose 1 HP each (HP loss, not damage) (Nov 12, 2026) */
    all.forEach(o=>{const n=o.st.burn+o.st.poison+o.st.wound;if(n>0){o.dmg+=n;const why=[["burn","Burned"],["poison","Poisoned"],["wound","Wounded"]].filter(([k])=>o.st[k]>0).map(([,w])=>w).join(", ");log(s,`${o.name} loses ${n} Health Point${n===1?"":"s"} (${why}).${hpTag(s,o)}`,pid)}
      STATUS.forEach(k=>{if(o.st[k]>0)o.st[k]--})})});
  checkDeaths(s);if(s.over)return;
  /* At Dawn effects (active player first) */
  [s.init,opp(s.init)].forEach(pid=>{const pl=P(s,pid);
    if(invHas(pl,"Aura Crystal")){pl.aura+=invCount(pl,"Aura Crystal");log(s,`Aura Crystal: ${pl.name} gains 1 Aura.`,pid)}
    if(invHas(pl,"Ley Grove")){const g=Math.floor(pl.bf.filter(o=>o.kind==="summon").length/2)*invCount(pl,"Ley Grove");if(g){pl.aura+=g;log(s,`Ley Grove: ${pl.name} gains ${g} Aura.`,pid)}}
    {const sp=pl.bf.filter(o=>o.kind==="summon"&&o.name==="Sapling").length;if(sp){pl.aura+=sp;log(s,`Sapling: ${pl.name} gains ${sp} Aura.`,pid)}}
    pl.inv.filter(o=>o.name==="Campfire"&&!o.fd).forEach(o=>{o.ctr=o.ctr||{};if(o.ctr.camp==null)o.ctr.camp=3;o.ctr.camp--;log(s,"Campfire burns down (heals the party 1 HP).",pid);living(pl).forEach(h=>heal(s,null,h,1,pid));if(o.ctr.camp<=0){pl.inv.splice(pl.inv.indexOf(o),1);pl.exile.push({uid:o.uid,id:o.id,owner:o.owner});log(s,"Campfire is exiled.",pid)}});
    if(invHas(pl,"Brute's Banner")){const b=living(pl).filter(h=>h.cls==="Barbarian").sort((a,b)=>strOf(s,b)-strOf(s,a))[0];if(b){b.fl.bannerRound=s.round;log(s,`Brute's Banner: ${b.name} +2 STR this turn.`,pid)}}
    living(pl).forEach(h=>{if(h.name==="Lightbringer"){const lt=living(pl).filter(o=>o!==h&&o.dmg>0).sort((a,b)=>b.dmg-a.dmg)[0];if(lt)heal(s,h,lt,1)}
      if(hasEqN(h,"Chalice of Life")){living(pl).forEach(o=>heal(s,h,o,1));if(hasUpN(s,h,"Chalice of Life")){const t=autoTarget(s,pid,"healAlly");if(t)heal(s,h,t,2)}}
      h.ench.forEach(e=>{if(e.name==="Sanctuary")heal(s,null,h,1,e.owner)})});
    /* Echo */
    const ech=pl.echo.splice(0);ech.forEach(e=>{const d=DB[e.card.id];const actor=living(pl).find(h=>heroIs(h,d.cls)||d.cls==="Generic");
      if(!actor){pl.disc.push(e.card);return}
      log(s,`Echo: ${actor.name} plays ${d.name} again.`,pid);
      const sc=SC()[d.name];let targets=e.targets;
      if(sc){const specs=specsFor(sc,e.modes);targets=specs.map((sp,i)=>{const cs=candidates(s,pid,sp,{actor,card:d});if(e.targets[i]&&cs.includes(e.targets[i]))return e.targets[i];return cs.length?cs[0]:null})}
      resolveCont(s,pid,{k:"card",actor:actor.uid,card:e.card,targets,modes:e.modes,x:e.x,echo:true},{})});
  });
  checkDeaths(s);if(s.over)return;
  s.p.forEach((pl,pid)=>draw(s,pid,1));
  s.dawnDone=s.p.map((pl,pid)=>!(pl.inv.some(o=>!o.fd&&def(o).sub==="Gemstone")));
  if(s.dawnDone.every(Boolean)&&!s.pend.length)startBattle(s)}
function startBattle(s){s.phase="battle";s.pos=0;s.acted=[false,false];s.passed=[false,false];s.bonus=null;s.prio=s.init;
  log(s,`— Battle Phase (${s.p[s.init].name} has initiative) —`)}
E.startBattle=startBattle;
function doDusk(s){
  /* "At Dusk" choices first, while Aura is still in the pool: Second Chances (Hidden), Tome of Gim */
  if(!s.duskAsked){s.duskAsked=true;let any=false;
    [opp(s.init),s.init].forEach(pid=>{const pl=P(s,pid);
      pl.inv.filter(o=>!o.fd&&o.name==="Tome of Gim").forEach(o=>{if(pl.hand.length){pushChoose(s,pid,{title:"Tome of Gim: you may put a card from your hand under it",cards:pl.hand.map(c=>c.uid),min:0,max:1,op:"tomePut",tome:o.uid});any=true}});
      const tr={kind:"dusk",pid};if(windowFor(s,pid,tr)){s.pend.unshift({type:"window",pid,trig:tr,cont:{k:"none"},mods:{}});log(s,`${pl.name} may respond with a Hidden card at Dusk…`);any=true}});
    if(any)return}
  s.duskAsked=false;
  s.phase="dusk";log(s,`— Dusk —`);
  /* Heavy Bow: a Hero that became exhausted this round gets a Fatigue counter */
  s.p.forEach((pl,pid)=>living(pl).forEach(h=>{if(h.ex&&!h.fat&&!h.fl.fatRested&&hasEqN(h,"Heavy Bow")){if(hasUpN(s,h,"Heavy Bow")&&pl.aura>=1){pl.aura-=1;log(s,`Upgraded Heavy Bow: ${pl.name} pays 1 Aura so ${h.name} doesn't get a Fatigue counter.`,pid);return}h.fat=1;log(s,`Heavy Bow: ${h.name} gets a Fatigue counter (it won't ready at the next Dawn).`,pid)}}));
  [s.init,opp(s.init)].forEach(pid=>{const pl=P(s,pid);
    const pp=pl.bf.filter(o=>o.name==="Pain Pillar").length;
    if(pp){const t=autoTarget(s,pid,"enemy");if(t&&t.kind==="hero")loseHp(s,t,pp,"Pain Pillar")}
    pl.heroes.forEach(h=>{if(h.dead)return;
      h.ench.forEach(e=>{if(e.name==="Mark of Doom")loseHp(s,h,1,"Mark of Doom")});
      if(h.fl.chargedRound===s.round&&!h.dead){if(!(h.fl.chargedHit===s.round)){log(s,`Charged Barrage: ${h.name} strikes every enemy.`,pid);const st=strOf(s,h);P(s,opp(pid)).heroes.filter(x=>!x.dead).concat(P(s,opp(pid)).bf.filter(o=>o.kind==="summon")).forEach(t=>damage(s,h,t,st,{card:true}))}}
      if(h.fl.standRound===s.round&&!h.dead){log(s,`Take a Stand: ${h.name} dies at Dusk.`,pid);h.dmg=maxHp(s,h);}});
  });
  checkDeaths(s);if(s.over)return;
  let nextInit=opp(s.init);
  s.p.forEach((pl,pid)=>{if(pl.fl.promoRound===s.round)nextInit=pid});
  s.p.forEach((pl,pid)=>{
    const clean=o=>{o.mods=(o.mods||[]).filter(m=>!(m.until==="dusk"||(typeof m.until==="number"&&m.until<=s.round)))};
    pl.heroes.forEach(h=>{if(h.fl.frogName){h.name=h.fl.frogName;h.fl.frogName=null}h.fl.dyingDone=false;clean(h);h.guard=0;h.gsrc=[];});
    pl.bf.forEach(clean);
    pl.pm={};pl.t={};pl.fl.mageNext=pl.fl.mageAll=pl.fl.trapNext=pl.fl.trapAll=pl.fl.songDisc=false;pl.fl.arrowNext=null;pl.fl.rapidPierce=false;pl.fl.preventNext=false;
    if(pl.aura>0)log(s,`${pl.name} loses ${pl.aura} unspent Aura.`,pid);pl.aura=0;
    const g=living(pl).length;pl.gold+=g;log(s,`${pl.name} collects ${g} Gold (now ${pl.gold}).`,pid);
    pl.heroes.forEach(h=>{if(h.fl.h2h&&!h.dead){(h.fl.h2h||[]).forEach(e=>{const idx=pl.inv.findIndex(o=>o.uid===e);if(idx>=0){const o=pl.inv.splice(idx,1)[0];equipTo(s,h,o)}})}h.fl.h2h=null});
  });
  s.pillage=null;s.trig10=null;
  s.init=nextInit;log(s,`Initiative passes to ${s.p[s.init].name}.`);
  s.phase="town";s.town={order:[s.init,opp(s.init)],i:0};log(s,`— Town —`);
  /* maximum hand size: discard down to 5 */
  [opp(s.init),s.init].forEach(pid=>{const pl=P(s,pid);const k=pl.hand.length-E.HAND_MAX;if(k>0){log(s,`${pl.name} has ${pl.hand.length} cards in hand and discards down to ${E.HAND_MAX}.`,pid);pushChoose(s,pid,{title:`Maximum hand size is ${E.HAND_MAX}: discard ${k} card${k>1?"s":""}`,cards:pl.hand.map(c=>c.uid),from:"hand",min:k,max:k,op:"discard"})}})}

/* ---------- views ---------- */
E.publicCard=c=>DB[c.id];
E.heroStats=(s,h)=>({str:strOf(s,h),def:defOf(s,h),aura:h.kind==="hero"?auraStat(h):0,hp:hpOf(s,h),max:maxHp(s,h)});
E.labelAction=function(s,pid,a){const pl=P(s,pid);const nm=u=>{const r=resolveTarget(s,u);return r?r.name:"?"};
  switch(a.type){case"play":{const c=findCardAnywhere(s,pid,a.uid);return"Play "+(c?DB[c.id].name:"card")}
  case"attack":return`${nm(a.att)} attacks`;case"band":return`Band attack led by ${nm(a.att)}`;case"useFree":return"Activate "+nm(a.uid);case"level":return"Level up"+(a.stat?` (+1 ${a.stat.toUpperCase()})`:"");case"step":return"Step Back";
  case"ability":{const a2=actorFor(s,pid);return`${a2.name}: ${HS()[a2.name][a.idx].label}`}
  case"use":return"Activate "+nm(a.uid);case"equipInv":return"Equip "+nm(a.uid);case"take":return"Take "+nm(a.uid);case"clear":return"Clear "+nm(a.uid);
  case"eqAct":return"Use "+nm(a.uid);case"multiBow":return"Multi Bow: destroy Arrows";
  case"soul":return`Surrender ${nm(a.hero)}'s soul: ${SOULS[a.ch]}`;case"pass":return"Pass";default:return a.type}};
E.clone=s=>JSON.parse(JSON.stringify(s));
E.redact=function(s,viewer){/* hide opponent's hand and libraries for network play */
  const c=E.clone(s);const keep=new Set();s.pend.forEach(pr=>{if(pr.pid===viewer)(pr.cards||pr.cands||[]).forEach(u=>keep.add(u))});
  c.p.forEach((pl,pid)=>{pl.lib=pl.lib.map(x=>keep.has(x.uid)?x:({uid:x.uid,id:null,owner:x.owner}));
    pl.inv.forEach(o=>{if(o.under&&pid!==viewer)o.under=o.under.map(x=>({uid:x.uid,id:null,owner:x.owner}))});
    if(pid!==viewer){pl.hand=pl.hand.map(x=>({uid:x.uid,id:null,owner:x.owner}));pl.inv=pl.inv.map(o=>o.fd?{uid:o.uid,kind:"card",fd:true,name:"Hidden card",id:null,owner:o.owner}:o)}});
  c.pend=c.pend.map(pr=>{if(pr.pid===viewer)return pr;return{type:pr.type,pid:pr.pid,title:pr.title,hiddenPrompt:true}});
  c.log=c.log.slice(-300);c.redacted=viewer;if(c.undo)c.undo={id:c.undo.id,what:c.undo.what};return c};
})(typeof window!=="undefined"?window:globalThis);
