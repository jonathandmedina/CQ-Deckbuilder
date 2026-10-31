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
(_RE||[]).forEach(r=>{DB[r[0]]={id:r[0],name:r[0],sup:r[1],type:"Equipment",sub:r[2],cls:r[3],rules:r[4],cost:r[5],region:r[6],pstr:num(r[7]),pdef:num(r[8]),kind:"equip"}});
(_RH||[]).forEach(r=>{DB["h:"+r[0]]={id:"h:"+r[0],name:r[0],cls:r[1],str:num(r[2]),def:num(r[3]),aura:num(r[4]),hp:num(r[5]),rules:r[6],type:"Hero",kind:"hero"}});
{const RN=typeof CARD_RENAMES!=="undefined"?CARD_RENAMES:(root.CARD_RENAMES||{});for(const o in RN){if(DB[RN[o]]&&!DB[o])DB[o]=DB[RN[o]];if(DB["h:"+RN[o]]&&!DB["h:"+o])DB["h:"+o]=DB["h:"+RN[o]]}}
(_RT||[]).forEach(r=>{TOK[r[0]]={name:r[0],tkind:r[1],sub:r[2],cls:r[3],str:num(r[4]),def:num(r[5]),hp:num(r[6]),cost:num(r[7]),region:r[8],rules:r[9]}});
const CLASSES=["Barbarian","Bard","Cleric","Druid","Mage","Monk","Paladin","Ranger","Rogue","Warlock"];E.CLASSES=CLASSES;
const STATUS=["burn","poison","wound","confuse","stun"];E.STATUS=STATUS;
E.STATUS_NAME={burn:"Burned",poison:"Poisoned",wound:"Wounded",confuse:"Confused",stun:"Stunned"};
const POS=["Lead","Center","Closer"];E.POS=POS;
E.INN_HEAL=3;E.INN_COST=5;E.SHOP_COST=4;
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
    p:[],pend:[],cur:null,qatk:null,bonus:null,town:null,over:false,winner:null,log:[],seq:0,dawnDone:[false,false],lastCard:null};
  cfg.players.forEach((pc,pid)=>{
    const pl={name:pc.name||("Player "+(pid+1)),ai:!!pc.ai,heroes:pc.deck.heroes.map(h=>mkHero(s,pid,h)),hand:[],lib:[],disc:[],exile:[],inv:[],bf:[],aura:0,gold:0,echo:[],pm:{},fl:{},t:{},mullDone:false,mulled:false,deckName:pc.deck.name||""};
    for(const[id,q]of Object.entries(pc.deck.cards))if(DB[id])for(let i=0;i<q;i++)pl.lib.push(mkCard(s,pid,id));
    s.p.push(pl);
  });
  s.p.forEach(pl=>{shuffle(s,pl.lib);for(let i=0;i<4;i++)draw(s,s.p.indexOf(pl),1,true)});
  let a,b;do{a=1+ri(s,6);b=1+ri(s,6)}while(a===b);
  s.init=a>b?0:1;
  log(s,`Initiative roll: ${s.p[0].name} ${a}, ${s.p[1].name} ${b}. ${s.p[s.init].name} starts with initiative.`);
  log(s,"Each player drew 4 cards. Keep your hand or mulligan once.");
  return s;
};
E.validateDeck=function(d){
  const out=[];if(!d||!d.heroes||d.heroes.length!==3)out.push("Needs 3 Heroes.");
  let t=0;for(const[id,q]of Object.entries(d.cards||{})){if(!DB[id])out.push(`Unknown card ${id}`);t+=q}
  if(t!==30)out.push(`Deck has ${t} cards (needs 30).`);return out};

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
  if(o.kind==="hero"){const pl=P(s,o.owner);let d=o.base.def+o.bon.def+o.plus+modSum(o,"def")+(pl.pm.def||0);
    eqList(o).forEach(e=>d+=e.pdef||0);
    if(o.name==="Sun Paladin"&&o.ex)d+=2;
    const i=pl.heroes.indexOf(o);if(i>0&&pl.heroes[i-1].name==="Holy Guardian"&&!pl.heroes[i-1].dead)d+=1;
    if(hasEqN(o,"Great Axe")&&enraged(s,o))d+=1;
    o.ench.forEach(e=>{if(e.name==="Distract")d-=1});
    if(modHas(o,"zeroDef"))d=0;return Math.max(0,d)}
  if(o.kind==="summon"){const pl=P(s,o.ctrl);let d=modSum(o,"def")+invCount(pl,"Horn Crystal")+(pl.pm.sdef||0);return Math.max(0,d)}
  return 0}
function strOf(s,o,vs){
  if(o.kind==="hero"){const pl=P(s,o.owner);let b=o.name==="King of Curses"?curses(s):o.base.str;
    let v=b+o.bon.str+o.plus+modSum(o,"str")+(pl.pm.str||0);
    eqList(o).forEach(e=>v+=e.pstr||0);
    pl.heroes.forEach(h=>{if(h!==o&&!h.dead&&!h.ex&&hasEqN(h,"Drums of War"))v+=1});
    if(o.name==="Bloodhowl"&&enraged(s,o))v+=o.lvl>=3?5:3;
    if(o.name==="Radiant Sentinel"&&defOf(s,o)>=5)v+=2;
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
function spellDmg(s,pid,actor){const pl=P(s,pid);let n=pl.bf.filter(o=>o.name==="Spell Damage Pillar").length;
  if(actor){if(actor.name==="Ember Mage")n+=1;if(hasEqN(actor,"Apprentice's Wand"))n+=1;if(hasEqN(actor,"Ring of Power"))n+=2}return n}
E.spellDmg=spellDmg;
function stealth(s,o){if(o.kind!=="hero")return false;if(modHas(o,"stealth"))return true;if(o.name==="Night Stalker"&&o.ex)return true;return false}
function cardProof(s,o){return o.kind==="hero"&&(hasEqN(o,"Cloak of Shadow")||modHas(o,"untarget"))}
function poisonous(s,h){if(h.kind!=="hero")return 0;let n=0;if(h.name==="Dark Fang")n=Math.max(n,h.lvl>=3?3:1);
  eqList(h).forEach(e=>{if(e.name==="Viper Fang Dagger"||(e.x&&e.x.poison))n=Math.max(n,1)});
  if(h.cls==="Rogue"&&P(s,h.owner).pm.poisonous)n=Math.max(n,1);return n}
function lifelink(s,h){return h.kind==="hero"&&((h.name==="Radiant Oracle"&&h.lvl>=3)||hasEqN(h,"Ring of Radiance")||modHas(h,"lifelink"))}
function guardEq(h){let g=0;eqList(h).forEach(e=>{if(/(^|\. |\n)Guard 1/.test(def(e).rules||"")||/Guard 1\./.test(def(e).rules||""))g+=1});return g}
E.guardEq=guardEq;E.hasEq=hasEqN;E.living=living;E.invHas=invHas;E.invCount=invCount;E.P=P;E.cardProof=cardProof;E.heroByUid=(s,u)=>heroByUid(s,u);E.poisonous=poisonous;E.lifelink=lifelink;E.stealth=stealth;

/* ---------- basic operations ---------- */
/* Mill X: move the top X cards of a library to its owner's discard pile (no reshuffle) */
function mill(s,pid,n){const pl=P(s,pid);const out=[];for(let i=0;i<n&&pl.lib.length;i++){const c=pl.lib.pop();pl.disc.push(c);out.push(DB[c.id]?DB[c.id].name:"a card")}
  log(s,out.length?`${pl.name} mills ${out.length}: ${out.join(", ")}.`:`${pl.name} has no cards to mill.`,pid);return out.length}
E.mill=mill;
function draw(s,pid,n,quiet){const pl=P(s,pid);let got=0;
  for(let i=0;i<n;i++){if(!pl.lib.length){if(!pl.disc.length)break;pl.lib=shuffle(s,pl.disc.splice(0));log(s,`${pl.name} shuffles the discard pile into a new library.`,pid)}
    pl.hand.push(pl.lib.pop());got++;
    if(s.phase==="battle"&&invHas(pl,"Healing Relic")){const t=autoTarget(s,pid,"healAlly");if(t)heal(s,{name:"Healing Relic",ctrl:pid},t,1,pid)}}
  if(!quiet&&got)log(s,`${pl.name} draws ${got} card${got===1?"":"s"}.`,pid);return got}
E.draw=draw;
function addStatus(s,o,k,n){if(!o||o.dead||!o.st)return;o.st[k]=(o.st[k]||0)+(n||1);log(s,`${o.name} is ${E.STATUS_NAME[k]}${n>1?` (+${n})`:""}.`)}
E.addStatus=addStatus;
function addMod(o,m){o.mods=o.mods||[];o.mods.push(Object.assign({until:"dusk"},m))}
E.addMod=addMod;
function pay(s,pid,actor,amt){const pl=P(s,pid);pl.aura-=amt;if(amt<=0||!actor||actor.kind!=="hero")return;
  if(actor.ench.some(e=>e.name==="Blood Aura"))loseHp(s,actor,2,"Blood Aura");
  const op=P(s,opp(pid));if(invHas(op,"The Monolith"))loseHp(s,actor,amt,"The Monolith")}
E.pay=pay;
function loseHp(s,o,n,why){if(!o||o.dead||n<=0)return;o.dmg=(o.dmg||0)+n;log(s,`${o.name} loses ${n} HP${why?` (${why})`:""}.`);checkDeaths(s)}
E.loseHp=loseHp;
/* heal: pid = player whose source makes the heal (null for the Inn). An inverted heal is not a heal. */
function heal(s,healer,o,n,pid){
  if(!o||o.dead||n<=0)return 0;if(o.kind!=="hero"&&o.kind!=="summon")return 0;
  if(healer&&healer.kind==="hero"&&hasEqN(healer,"Sacred Vestments"))n+=1;
  const src=pid!=null?pid:(healer&&healer.kind==="hero"?healer.owner:(healer&&healer.ctrl!=null?healer.ctrl:null));
  const oc=ctrl(s,o);
  if(src!=null&&oc!==src&&invHas(P(s,src),"Inversion Stone")){log(s,`Inversion Stone turns the heal on ${o.name} into ${n} Light damage.`);damage(s,{name:"Inversion Stone"},o,n,{card:true,type:"Light",noTrig:true});return 0}
  const h=Math.min(n,o.dmg||0);o.dmg-=h;if(h>0)log(s,`${o.name} heals ${h} HP.`);
  if(h>0&&src!=null){const sp=P(s,src);sp.t.healed=(sp.t.healed||0)+h}
  if(h>0&&healer&&healer.kind==="hero"&&!healer.dead&&healer.name==="Radiant Oracle"&&h>=3)draw(s,healer.owner,1);
  /* Lightbringer L6: whenever you heal (any heal your side makes, not the Inn), deal that much Light damage */
  if(h>0&&src!=null&&!s._lb){const lb=living(P(s,src)).find(x=>x.name==="Lightbringer"&&x.lvl>=6);
    if(lb){const t=bestDamageTarget(s,src,h,{type:"Light"});if(t){s._lb=true;try{damage(s,lb,t,h,{type:"Light",card:true,noTrig:true})}finally{s._lb=false}}else log(s,"Lightbringer: no enemy it can hurt.",src)}}
  return h}
/* picks the enemy the damage hurts most (skips targets Guard/DEF would block, Stealth, Cloak); prefers kills */
function bestDamageTarget(s,pid,n,o){o=o||{};const op=P(s,opp(pid));let best=null,bv=0;
  [...living(op),...op.bf.filter(x=>x.kind==="summon")].forEach(t=>{if(stealth(s,t)||cardProof(s,t))return;
    const g=t.kind==="hero"?t.guard+t.eqGuard:0;const eff=Math.max(0,n-g-(o.ignoreDef?0:Math.max(0,defOf(s,t)-(o.pierce||0))));const hp=hpOf(s,t);
    const v=eff<=0?0:Math.min(eff,hp)+(eff>=hp?50:0)+(t.kind==="hero"?5:0)-hp*0.01;if(v>bv){bv=v;best=t}});
  return best}
E.bestDamageTarget=bestDamageTarget;
E.heal=heal;
/* damage: o={combat,spell,pierce,ignoreDef,card,actor,type,noTrig} returns damage dealt */
function damage(s,src,tgt,amt,o){o=o||{};if(!tgt||tgt.dead)return 0;
  if(tgt.kind==="hero"&&tgt.fl.noDmgRound===s.round&&!o.status){log(s,`${tgt.name} takes no damage (prevented).`);return 0}
  let a=Math.max(0,amt);
  if(tgt.kind==="hero"){const tp=P(s,tgt.owner);if(tp.fl.preventNext&&(o.card||o.combat)&&ctrl(s,src||tgt)!==tgt.owner){tp.fl.preventNext=false;log(s,`Smoke Trail Arrow prevents the damage to ${tgt.name}.`);return 0}
    let g=tgt.guard;const ga=Math.min(g,a);tgt.guard-=ga;a-=ga;const ge=Math.min(tgt.eqGuard,a);tgt.eqGuard-=ge;a-=ge;}
  let d=defOf(s,tgt);let pierce=o.pierce||0;
  if(tgt.kind==="hero"&&hasEqN(tgt,"Unpiercing Chestplate"))pierce=0;
  if(o.ignoreDef)d=0;else d=Math.max(0,d-pierce);
  const dealt=Math.max(0,a-d);
  tgt.dmg=(tgt.dmg||0)+dealt;
  const tn=tgt.name+(tgt.kind==="summon"?" (summon)":"");
  log(s,`${src?src.name:"Effect"} deals ${dealt}${o.type?" "+o.type:""} damage to ${tn}${amt!==dealt?` (${amt} before Guard/DEF)`:""}.`);
  if(dealt>0&&tgt.kind==="hero"){const tp=P(s,tgt.owner);const before=tp.t.took||0;tp.t.took=before+dealt;if(before<10&&tp.t.took>=10&&s.phase==="battle"){s.trig10=(s.trig10||[]).concat([tgt.owner])}if(tgt.fl.loseCtrlRound===s.round){if(hpOf(s,tgt)<1)tgt.dmg=maxHp(s,tgt)-1;tgt.ex=false}}
  if(src&&!o.noTrig){
    if(dealt>0&&lifelink(s,src))heal(s,src,src,dealt);
    const pz=o.poisonous==="dmg"?dealt:poisonous(s,src);if(pz&&(tgt.st&&!tgt.st.poison))addStatus(s,tgt,"poison",pz);
    if(src.kind==="hero"){
      if(dealt>0&&src.name==="Void Binder"){const dp=P(s,ctrl(s,tgt));const r=Math.min(1,dp.aura);dp.aura-=r;if(r)log(s,`Void Binder removes ${r} Aura from ${dp.name}.`)}
      if(dealt>0&&src.name==="Sanctifier"){const t=autoTarget(s,src.owner,"statusAlly");if(t)removeStatus(s,t,1)}
      if(src.fl.bruisedRound===s.round&&dealt>0&&tgt.st)addStatus(s,tgt,"wound",1);
      if(o.combat&&hasEqN(src,"Poison-Tipped Dagger")&&dealt>0&&tgt.st)addStatus(s,tgt,"poison",2);
      if(o.combat&&dealt>0)eqList(src).forEach(e=>{if(e.x&&e.x.stun&&tgt.st)addStatus(s,tgt,"stun",1)});
      if(o.combat&&dealt>0&&(hasEqN(src,"Hammer of Ruin")||hasEqN(src,"Hammer"))){const it=P(s,ctrl(s,tgt)).inv.find(x=>!x.fd&&x.kind!=="equip");if(it){destroyObj(s,it);}}
    }
    if(src.kind==="summon"&&src.name==="Woods Beast"&&dealt>0)draw(s,src.ctrl,1);
  }
  checkDeaths(s);return dealt}
E.damage=damage;
function removeStatus(s,o,n){let r=0;for(let i=0;i<n;i++){const k=STATUS.find(k=>o.st[k]>0);if(!k)break;o.st[k]--;r++}if(r)log(s,`${o.name}: ${r} status counter${r>1?"s":""} removed.`);return r}
E.removeStatus=removeStatus;

/* ---------- death / destroy ---------- */
function checkDeaths(s){let again=true;while(again){again=false;
  for(let pid=0;pid<s.p.length;pid++){const pl=s.p[pid];
    for(const h of pl.heroes)if(!h.dead&&hpOf(s,h)<=0){die(s,h);again=true}
    for(const o of pl.bf.slice())if(o.kind==="summon"&&hpOf(s,o)<=0){destroyObj(s,o);again=true}
    for(const o of pl.inv.slice())if(o.kind==="doll"&&hpOf(s,o)<=0){destroyObj(s,o);again=true}}}
  checkWin(s)}
E.checkDeaths=checkDeaths;
function die(s,h){const pl=P(s,h.owner);
  if(h.fl.selfSacTarget){}
  h.dead=true;h.dmg=maxHp(s,h);h.ex=false;h.med=false;h.plus=0;h.mods=[];h.guard=0;h.eqGuard=0;STATUS.forEach(k=>h.st[k]=0);
  log(s,`☠ ${h.name} dies.`,h.owner);
  const gear=eqList(h);for(const k in h.eq)h.eq[k]=null;
  h.ench.forEach(e=>toDisc(s,e));h.ench=[];
  const pil=s.pillage&&s.pillage.pid!==h.owner?s.pillage:null;
  if(pil){s.pillage=null;gear.forEach(e=>{e.ctrl=pil.pid;toInv(s,pil.pid,e)});log(s,`Pillage the Dead: ${P(s,pil.pid).name} takes ${h.name}'s equipment.`)}
  else gear.forEach(e=>toInv(s,h.owner,e));
  if(h.name==="Verdant Sage")makeSummon(s,h.owner,"Spectral Elk");
  if(heroIs(h,"Barbarian"))pl.inv.forEach(x=>{if(!x.fd&&x.name==="Warrior's Pyre"){x.ctr=x.ctr||{};if((x.ctr.fury||0)<3){x.ctr.fury=(x.ctr.fury||0)+1;log(s,`Warrior's Pyre gets a Fury counter (${x.ctr.fury}).`,h.owner)}}});
  s.p.forEach((_,i)=>overflow(s,i));
}
function toDisc(s,o){const owner=o.owner;if(o.tok)return;const pl=P(s,owner);pl.disc.push({uid:o.uid,id:o.id,owner})}
function toInv(s,pid,o){const pl=P(s,pid);pl.inv.push(o);overflow(s,pid)}
E.toInv=toInv;
function overflow(s,pid){const pl=P(s,pid);const cap=E.slots(s,pid);
  while(pl.inv.length>cap){let worst=0,wv=1e9;pl.inv.forEach((o,i)=>{const v=o.tok?-1:(num(def(o).cost)+(o.kind==="equip"?2:0));if(v<wv){wv=v;worst=i}});
    const o=pl.inv.splice(worst,1)[0];log(s,`Inventory full: ${pl.name} discards ${o.fd?"a face-down card":o.name}.`,pid);toDisc(s,o)}}
function destroyObj(s,o,exile){const f=find(s,o.uid);if(!f)return;const pl=P(s,f.pid);
  if(f.zone==="bf"){pl.bf.splice(pl.bf.indexOf(o),1)}
  else if(f.zone==="inv"){pl.inv.splice(pl.inv.indexOf(o),1)}
  else if(f.zone==="eq"){f.hero.eq[f.slot]=null;if(f.slot==="H1"&&f.hero.eq.H2==="2H")f.hero.eq.H2=null;
    if(o.name==="Sword of Eliazar"&&!exile)makeSummon(s,f.pid,"Eliazar")}
  else if(f.zone==="ench"){f.hero.ench.splice(f.hero.ench.indexOf(o),1)}
  log(s,`${o.name}${o.kind==="summon"?" (summon)":""} is ${exile?"exiled":"destroyed"}.`);
  if(o.kind==="summon"){const c=o.ctrl;
    if(o.name==="Aurawing Familiar"){P(s,c).aura+=1;log(s,`${P(s,c).name} gains 1 Aura.`)}
    if(o.name==="Drawwing Familiar")draw(s,c,1);
    if(o.name==="Spore"){const h=P(s,c).hand;if(h.length){const i=ri(s,h.length);const x=h.splice(i,1)[0];P(s,c).disc.push(x);log(s,`Spore: ${P(s,c).name} discards ${DB[x.id].name}.`)}}
    return}
  if(o.tok||o.kind==="pillar"||o.kind==="doll")return;
  const ow=P(s,o.owner);if(exile)ow.exile.push({uid:o.uid,id:o.id,owner:o.owner});else toDisc(s,o)}
E.destroyObj=destroyObj;
function checkWin(s){if(s.over)return;const dead=s.p.map(pl=>pl.heroes.every(h=>h.dead));
  if(dead[0]||dead[1]){s.over=true;s.winner=dead[0]&&dead[1]?-1:(dead[0]?1:0);s.pend=[];s.cur=null;s.qatk=null;
    log(s,s.winner<0?"Both parties fall. The game is a draw.":`🏆 ${s.p[s.winner].name} wins!`);}}

/* ---------- tokens / summons ---------- */
function makeSummon(s,pid,name,ready){const t=TOK[name]||{str:2,hp:2,sub:""};const o={uid:nid(s),kind:"summon",name,str:t.str,hp:t.hp,sub:t.sub||"",dmg:0,ex:!ready,ctrl:pid,owner:pid,tok:true,st:{burn:0,poison:0,wound:0,confuse:0,stun:0},mods:[],fl:{}};
  P(s,pid).bf.push(o);log(s,`${P(s,pid).name} summons ${/^[AEIOU]/.test(name)?"an":"a"} ${name} (${t.str}/${t.hp}).`,pid);return o}
function makePillar(s,pid,name){const o={uid:nid(s),kind:"pillar",name,ctrl:pid,owner:pid,tok:true};P(s,pid).bf.push(o);log(s,`${P(s,pid).name} conjures a ${name}.`,pid);return o}
function makeEqToken(s,pid,name,x){const t=TOK[name];return{uid:nid(s),kind:"equip",id:null,name,cls:t.cls,region:t.region,pstr:t.str,pdef:0,cost:t.cost,owner:pid,tok:true,x:x||null}}
E.makeSummon=makeSummon;E.makePillar=makePillar;E.makeEqToken=makeEqToken;
E.makeDoll=(s,pid)=>{const o={uid:nid(s),kind:"doll",name:"Doll",dmg:0,owner:pid,tok:true,st:{burn:0,poison:0,wound:0,confuse:0,stun:0},mods:[]};toInv(s,pid,o);log(s,`${P(s,pid).name} creates a Doll.`,pid);return o};
E.copySummon=(s,pid,o,bonus)=>{const c=makeSummon(s,pid,o.name);c.str=o.str+(bonus||0);c.hp=o.hp+(bonus||0);return c};

/* ---------- equipment ---------- */
function eqObjFromCard(s,pid,card){const d=DB[card.id];return{uid:card.uid,kind:"equip",id:card.id,name:d.name,cls:d.cls,region:d.region,pstr:d.pstr,pdef:d.pdef,cost:num(d.cost),owner:card.owner,tok:false,x:null}}
E.eqObjFromCard=eqObjFromCard;
function canUseEq(s,h,e){if(!h||h.kind!=="hero"||h.dead)return false;
  const cls=e.cls;if(cls!=="Generic"&&!heroIs(h,cls))return false;
  const r=def(e).rules||"";if(/Must be Level 1/.test(r)&&h.lvl<1)return false;if(/1 or more STR/.test(r)&&strOf(s,h)<1)return false;return true}
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
  if(/Guard 1/.test(def(e).rules||""))h.eqGuard+=1;
  log(s,`${h.name} equips ${e.name}.`,pid);
  if(e.name==="Shimmering Cloak"){const x=P(s,pid).t.healed||0;if(x>0){addMod(h,{def:x});log(s,`Shimmering Cloak: ${h.name} gains +${x} DEF this turn (${x} HP healed this turn).`,pid)}else log(s,"Shimmering Cloak: no healing yet this turn, so no DEF bonus.",pid)}
  displaced.forEach(d=>{if(d&&d!=="2H"){log(s,`${d.name} goes to inventory.`,pid);toInv(s,pid,d)}})}
E.equipTo=equipTo;
function unequip(s,e){const f=find(s,e.uid);if(!f||f.zone!=="eq")return;f.hero.eq[f.slot]=null;if(f.slot==="H1"&&f.hero.eq.H2==="2H")f.hero.eq.H2=null;toInv(s,f.hero.owner,e);log(s,`${e.name} is unequipped from ${f.hero.name}.`)}
E.unequip=unequip;
function eqCost(s,h,e){let c=e.tok?(e.cost||0):num(def(e).cost);
  if(h.name==="Blessed Champion")c-=h.lvl>=3?2:1;c+=burden(h);return Math.max(0,c)}
E.eqCost=eqCost;
const burden=h=>h.ench.filter(e=>e.name==="Burden").length;

/* ---------- costs ---------- */
function cardCost(s,pid,actor,d,x){let c=d.cost==="X"?(x||0):num(d.cost);const pl=P(s,pid);
  if(d.kind==="equip"&&actor&&actor.name==="Blessed Champion")c-=actor.lvl>=3?2:1;
  if(d.cls==="Mage"){if(pl.fl.mageNext)c-=2;if(pl.fl.mageAll)c-=1}
  if(d.sub==="Trap"){if(pl.fl.trapNext)c-=2;if(pl.fl.trapAll)c-=1}
  if(d.type==="Song"){if(actor&&hasEqN(actor,"Silver Fiddle"))c-=1;if(pl.fl.songDisc)c-=2}
  if(d.type==="Summon"&&actor&&hasEqN(actor,"Antler Crown")&&actor.fl.antler!==s.round)c-=1;
  if(d.sub==="Combo"&&pl.fl.petalDisc)c-=1;
  if(actor&&actor.kind==="hero")c+=burden(actor);
  if(d.cls!=="Warlock"){s.p.forEach(p2=>{c+=invCount(p2,"Sphere of Resistance")})}
  return Math.max(0,c)}
E.cardCost=cardCost;
function consumeCostFlags(s,pid,actor,d){const pl=P(s,pid);
  if(d.cls==="Mage"&&pl.fl.mageNext)pl.fl.mageNext=false;
  if(d.sub==="Trap"&&pl.fl.trapNext)pl.fl.trapNext=false;
  if(d.type==="Summon"&&actor&&hasEqN(actor,"Antler Crown"))actor.fl.antler=s.round;
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
    if(k==="item")list=objs.filter(o=>(o.kind==="card"&&!o.fd&&def(o).type==="Item")||o.kind==="doll");
    else if(k==="equip"||k==="enemyEquip"||k==="allyEquip"||k==="equipped")list=objs.filter(o=>o.kind==="equip"&&find(s,o.uid).zone==="eq"&&(k!=="enemyEquip"||isEnemy(o))&&(k!=="allyEquip"||!isEnemy(o)));
    else if(k==="anyEquip")list=objs.filter(o=>o.kind==="equip");
    else if(k==="ench")list=objs.filter(o=>find(s,o.uid).zone==="ench");
    else if(k==="pillar"||k==="allyPillar")list=objs.filter(o=>o.kind==="pillar"&&(k==="pillar"||!isEnemy(o)));
    else if(k==="nonHero")list=objs.filter(o=>o.kind!=="hero"&&!o.fd);
  }
  list=list.filter(o=>{
    if(o.kind==="hero"&&isEnemy(o)&&stealth(s,o)&&!o.dead&&viaCard)return false; /* Stealth: can't be targeted by enemy cards or abilities, but can be attacked */
    if(viaCard&&cardProof(s,o))return false;
    if(spec.f&&!spec.f(s,o,ctx))return false;return true});
  /* Dazzling Melody: enemies must target the taunting Hero with attacks, cards and abilities (when it is a legal choice) */
  const op=P(s,opp(pid));const taunt=op.heroes.find(h=>!h.dead&&h.fl.tauntRound===s.round);
  if(taunt&&list.some(o=>o.uid===taunt.uid)&&list.some(o=>isEnemy(o)))list=list.filter(o=>!isEnemy(o)||o.uid===taunt.uid);
  return list.map(o=>o.uid)}
E.candidates=candidates;
function resolveTarget(s,t){if(typeof t==="string"&&t[0]==="P")return{kind:"player",pid:+t.slice(1),name:s.p[+t.slice(1)].name};const f=find(s,t);return f?f.o:null}
E.resolveTarget=resolveTarget;

/* ---------- actor / priority ---------- */
function actorFor(s,pid){const pl=P(s,pid);
  if(s.bonus&&s.bonus.pid===pid){const h=pl.heroes.find(h=>h.uid===s.bonus.uid);if(h&&!h.dead&&!h.ex)return h}
  /* Step Back: a stepped-back Hero keeps its place but acts last (the "Last" step after the Closer).
     It is skipped at Lead/Center/Closer unless no other Hero of that party is ready. */
  const n=pl.heroes.length,ok=h=>!h.dead&&!h.ex,back=h=>h.fl.stepped===s.round;
  if(s.pos===3){const b=pl.heroes.find(h=>ok(h)&&back(h));if(b)return b;for(const h of pl.heroes)if(ok(h))return h;return null}
  for(let i=0;i<n;i++){const h=pl.heroes[(s.pos+i)%n];if(ok(h)&&!back(h))return h}
  return pl.heroes.find(h=>ok(h)&&back(h))||null}
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
    pl.heroes.forEach(h=>{if(h.med&&!h.dead)out.push({type:"wake",hero:h.uid,v:!h.keepMed})});
    out.push({type:"dawnDone"});return out}
  if(s.phase==="town"){if(!s.town||s.town.order[s.town.i]!==pid)return[];const pl=P(s,pid);const out=[];
    const used=s.town.used||{};
    if(pl.gold>=5&&!used.inn)living(pl).forEach(h=>{if(h.dmg>0)out.push({type:"inn",hero:h.uid})});
    if(pl.gold>=4&&!used.shop)out.push({type:"shop"});out.push({type:"leave"});return out}
  if(s.phase!=="battle"||s.prio!==pid)return[];
  return battleOptions(s,pid)};
function battleOptions(s,pid){const pl=P(s,pid);const out=[];const a=actorFor(s,pid);
  if(a){
    const seen=new Set();
    pl.hand.forEach(c=>{const d=DB[c.id];if(seen.has(c.id))return;
      if(canPlayCard(s,pid,a,c)){seen.add(c.id);out.push({type:"play",uid:c.uid})}});
    if(!a.fl.noAttack)out.push({type:"attack",att:a.uid});
    if(a.lvl<6&&a.fl.leveled!==s.round&&a.fl.noLevel!==s.round&&!arrested(a)){const st=(a.lvl+1)%2===0;
      if(st)["str","def","aura"].forEach(k=>out.push({type:"level",stat:k}));else out.push({type:"level"})}
    if(a.fl.stepped!==s.round)out.push({type:"step"});
    const hs=HS()[a.name];
    if(hs&&!a.st.stun)hs.forEach((ab,i)=>{if((!ab.lvl||a.lvl>=ab.lvl)&&(!ab.can||ab.can(s,pid,a))&&abilityCost(s,pid,a,ab)<=pl.aura)out.push({type:"ability",idx:i})});
    pl.inv.forEach(o=>{const d=def(o);
      if(o.kind==="card"&&!o.fd){const isc=SC()[d.name];
        if(isc&&isc.act&&!a.st.stun&&(d.cls==="Generic"||heroIs(a,d.cls))&&(!isc.act.can||isc.act.can(s,pid,a,o))&&itemCost(s,pid,a,o)<=pl.aura)out.push({type:"use",uid:o.uid})}
      if(o.kind==="equip"&&canUseEq(s,a,o)&&eqCost(s,a,o)<=pl.aura)out.push({type:"equipInv",uid:o.uid});
      out.push({type:"clear",uid:o.uid})});
    pl.heroes.forEach(h=>{if(h===a||h.dead)return;eqList(h).forEach(e=>{if(canUseEq(s,a,e)&&eqCost(s,a,e)<=pl.aura)out.push({type:"take",uid:e.uid})})});
    out.push({type:"manualAbility"});
  }
  pl.bf.forEach(o=>{if(o.kind==="summon"&&!o.ex&&!o.st.stun)out.push({type:"attack",att:o.uid})});
  {const bm=bandMembers(s,pid);if(bm.length>=2){if(a&&bm.includes(a))out.push({type:"band",att:a.uid});bm.forEach(o=>{if(o.kind==="summon")out.push({type:"band",att:o.uid})})}}
  /* item abilities with no Hero cost (Energy Stone): any time you have priority, no action used */
  pl.inv.forEach(o=>{if(o.kind!=="card"||o.fd)return;const isc=SC()[def(o).name];if(isc&&isc.act&&isc.act.free&&(!isc.act.can||isc.act.can(s,pid,null,o))&&(isc.act.cost||0)<=pl.aura)out.push({type:"useFree",uid:o.uid})});
  pl.heroes.forEach(h=>{if(h.dead&&!h.surr)SOULS.forEach((_,i)=>out.push({type:"soul",hero:h.uid,ch:i}))});
  out.push({type:"pass"});
  return out}
function abilityCost(s,pid,a,ab){return(ab.cost||0)+burden(a)+(s.p.reduce((n,p2)=>n+invCount(p2,"Sphere of Resistance"),0)&&a.cls!=="Warlock"?s.p.reduce((n,p2)=>n+invCount(p2,"Sphere of Resistance"),0):0)}
function itemCost(s,pid,a,o){const isc=SC()[o.name];let c=(isc&&isc.act&&isc.act.cost)||0;if(a&&def(o).sub==="Arrow"&&hasEqN(a,"Mystic Quiver"))c=Math.max(0,c-1);return c+(a?burden(a):0)}
E.abilityCost=abilityCost;E.itemCost=itemCost;
function promptOptions(s,pid,pr){
  if(pr.type==="window"){const out=[{type:"decline"}];
    P(s,pid).inv.forEach(o=>{if(o.fd&&canReveal(s,pid,o,pr))out.push({type:"reveal",uid:o.uid})});return out}
  if(pr.type==="combo"){const out=[{type:"decline"}];pr.cands.forEach(u=>{const c=findCardAnywhere(s,pid,u);if(c){const a=heroByUid(s,pr.actor);if(a&&!a.dead&&canPlayCards(a)&&cardCost(s,pid,a,DB[c.id])<=P(s,pid).aura)out.push({type:"comboPlay",uid:u})}});return out}
  if(pr.type==="scry")return[{type:"scry"}];
  if(pr.type==="choose")return[{type:"choose"}];
  if(pr.type==="manual")return[{type:"man"},{type:"manDone"}];
  if(pr.type==="mode")return pr.opts.map((_,i)=>({type:"pick",i}));
  return[]}
function heroByUid(s,uid){const f=find(s,uid);return f&&f.o.kind==="hero"?f.o:null}
function findCardAnywhere(s,pid,uid){const pl=P(s,pid);return pl.hand.find(c=>c.uid===uid)||pl.lib.find(c=>c.uid===uid)}

/* ---------- hidden cards ---------- */
function hiddenScript(o){const sc=SC()[def(o).name];return sc&&sc.hidden}
function hiddenCost(s,pid,o){const m=/^(\d+)\{A\}/.exec(def(o).rules||"");let c=m?+m[1]:0;if(def(o).sub==="Trap"&&living(P(s,pid)).some(h=>h.name==="Beast Tracker"&&h.lvl>=3))c-=1;if(def(o).sub==="Trap"&&living(P(s,pid)).some(h=>h.name==="Shadow Ranger"&&h.ex))c-=1;return Math.max(0,c)}
E.hiddenCost=hiddenCost;
function revealHero(s,pid,o){const d=def(o);return living(P(s,pid)).find(h=>!h.ex&&(d.cls==="Generic"||heroIs(h,d.cls)))}
function canReveal(s,pid,o,pr){if(pr.noHidden)return false;const d=def(o);if(d.sup!=="Hidden")return false;
  if(!revealHero(s,pid,o))return false;if(hiddenCost(s,pid,o)>P(s,pid).aura)return false;
  const h=hiddenScript(o);if(!h)return true;return[].concat(h.when).includes(pr.trig.kind)&&(!h.ok||h.ok(s,pid,pr.trig))}
E.canReveal=canReveal;
function windowFor(s,pid,trig){if(trig.noHidden)return false;const pl=P(s,pid);return pl.inv.some(o=>o.fd&&canReveal(s,pid,o,{trig}))}

/* ---------- need(): target slots for an action ---------- */
E.need=function(s,pid,a){const pl=P(s,pid);const actor=actorFor(s,pid);
  const mk=(spec,ctx)=>({label:spec.label||labelFor(spec.k),opt:!!spec.opt,cands:candidates(s,pid,spec,ctx),distinct:spec.distinct,k:spec.k});
  if(a.type==="attack"||a.type==="band"){const att=find(s,a.att);if(!att)return[];
    return[mk({k:"enemy",label:a.type==="band"?"band attack target":"attack target"},{attack:true,actor:att.o})]}
  if(a.type==="useFree"){const f=find(s,a.uid);if(!f)return[];const isc=SC()[f.o.name];return specsFor(isc.act,a.modes).map(sp=>mk(sp,{actor:null,item:f.o}))}
  if(a.type==="play"||a.type==="comboPlay"){const c=findCardAnywhere(s,pid,a.uid);if(!c)return[];const d=DB[c.id];const sc=SC()[d.name];
    const act=a.type==="comboPlay"?heroByUid(s,s.pend[0]&&s.pend[0].actor):actor;
    if(!sc||d.sup==="Hidden"||d.type==="Item"&&!sc.t)return[];return specsFor(sc,a.modes).map(sp=>mk(sp,{actor:act,card:d}))}
  if(a.type==="ability"){const ab=HS()[actor.name][a.idx];return(ab.t||[]).map(sp=>mk(sp,{actor}))}
  if(a.type==="use"){const o=find(s,a.uid).o;const isc=SC()[o.name];return(isc.act?specsFor(isc.act,a.modes):[]).map(sp=>mk(sp,{actor,item:o}))}
  if(a.type==="soul"){if(a.ch===2||a.ch===5)return[mk({k:"ally",label:"ally"})];if(a.ch===3)return[mk({k:"any",label:"damage target"})];return[]}
  if(a.type==="inn")return[];
  return[]};
function specsFor(sc,modes){let t=(sc.t||[]).slice();if(sc.modes&&modes)modes.forEach(i=>{const m=sc.modes.opts[i];if(m&&m.t)t=t.concat(m.t)});return t}
E.specsFor=specsFor;
function labelFor(k){return({any:"any target",enemy:"enemy",ally:"ally",hero:"Hero",enemyHero:"enemy Hero",allyHero:"your Hero",summon:"summon",enemySummon:"enemy summon",allySummon:"your summon",item:"item",equip:"equipment",anyEquip:"equipment",enemyEquip:"enemy equipment",allyEquip:"your equipment",ench:"enchantment",pillar:"Pillar",allyPillar:"your Pillar",nonHero:"non-Hero object",player:"player",enemyPlayer:"opponent",deadAlly:"dead Hero",deadAny:"dead Hero",meditating:"Meditating Hero",allyHeroOther:"another of your Heroes",anyOther:"another target"})[k]||k}

/* ---------- act() ---------- */
function same(a,b){if(a.type!==b.type)return false;for(const k of["uid","att","stat","idx","hero","ch","i"])if(a[k]!==undefined&&a[k]!==b[k])return false;return true}
E.act=function(s,pid,a){
  if(s.over)return{ok:false,err:"The game is over."};
  if(a.type==="concede"){if(pid!==0&&pid!==1)return{ok:false,err:"Not a player."};s.seq++;s.over=true;s.winner=opp(pid);s.conceded=pid;s.pend=[];s.cur=null;s.qatk=null;
    log(s,`${P(s,pid).name} concedes.`,pid);log(s,`🏆 ${P(s,opp(pid)).name} wins!`);return{ok:true}}
  const opts=E.options(s,pid);
  if(a.type==="play"){const ok=opts.some(o=>o.type==="play"&&findCardAnywhere(s,pid,o.uid)&&findCardAnywhere(s,pid,o.uid).id===(findCardAnywhere(s,pid,a.uid)||{}).id);if(!ok)return{ok:false,err:"You can't play that card now."}}
  else if(!["fix","man","manDone","manCancel","scry","choose","wake"].includes(a.type)&&!opts.some(o=>same(o,a)))return{ok:false,err:"That action isn't legal right now."};
  if(a.type==="fix"&&!(s.phase==="battle"&&s.prio===pid&&!s.pend.length))return{ok:false,err:"Rules fixes are made on your priority."};
  if(["man","manDone"].includes(a.type)&&!(s.pend[0]&&s.pend[0].type==="manual"&&s.pend[0].pid===pid))return{ok:false,err:"No manual resolution open."};
  if(a.type==="scry"&&!(s.pend[0]&&s.pend[0].type==="scry"&&s.pend[0].pid===pid))return{ok:false,err:"No scry open."};
  if(a.type==="choose"&&!(s.pend[0]&&s.pend[0].type==="choose"&&s.pend[0].pid===pid))return{ok:false,err:"Nothing to choose."};
  if(a.type==="wake"&&!(s.phase==="dawn"&&!s.dawnDone[pid]))return{ok:false,err:"Only at Dawn."};
  /* targets */
  const slots=E.need(s,pid,a);const tg=a.targets||[];
  if(["play","comboPlay","attack","ability","use","soul"].includes(a.type)){
    for(let i=0;i<slots.length;i++){const t=tg[i];if(t==null){if(slots[i].opt||!slots[i].cands.length)continue;return{ok:false,err:`Choose ${slots[i].label}.`}}
      if(!slots[i].cands.includes(t))return{ok:false,err:`Invalid target for ${slots[i].label}.`};
      if(slots[i].distinct&&tg.slice(0,i).includes(t))return{ok:false,err:"Choose different targets."}}
    if(a.type==="attack"&&!slots[0].cands.length)return{ok:false,err:"There's nothing to attack."}}
  if(a.type==="manCancel"){const pr=s.pend[0];if(!(pr&&pr.type==="manual"&&pr.pid===pid&&s.undo))return{ok:false,err:"Nothing to cancel."};
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
  else if(!(top&&top.type==="manual"&&s.undo&&top.undoId===s.undo.id))s.undo=null;
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
  case"shop":pl.gold-=4;s.town.used=Object.assign({},s.town.used,{shop:true});log(s,`${pl.name} visits the Shop (4 Gold).`,pid);draw(s,pid,1);return;
  case"leave":log(s,`${pl.name} leaves Town.`,pid);s.town.i++;s.town.used={};if(s.town.i>=s.town.order.length){s.town=null;startRound(s)}return;
  case"pass":log(s,`${pl.name} passes.`,pid);s.passed[pid]=true;s.bonus=null;advance(s,pid);return;
  case"decline":{const pr=s.pend.shift();if(pr.type==="window")closeWindow(s,pr);else if(pr.type==="combo")log(s,"Combo: no card played.",pid);return}
  case"reveal":{const pr=s.pend[0];const o=find(s,a.uid).o;doReveal(s,pid,o,pr);return}
  case"comboPlay":{const pr=s.pend.shift();const actor=heroByUid(s,pr.actor);playCard(s,pid,actor,a.uid,a,{combo:true});return}
  case"scry":{const pr=s.pend.shift();finishScry(s,pid,pr,a);return}
  case"choose":{const pr=s.pend.shift();finishChoose(s,pid,pr,a.picks||[]);return}
  case"man":manualOp(s,pid,a);return;
  case"manDone":{s.pend.shift();log(s,`${pl.name} finishes resolving by hand.`,pid);return}
  case"fix":s.pend.unshift({type:"manual",pid,title:"Rules fix",text:"Adjust the game to match the rules. Every change is logged for both players."});log(s,`✋ ${pl.name} opens a rules fix.`,pid);return;
  }
  if(a.type==="useFree"){const o=find(s,a.uid).o;const isc=SC()[o.name];const c=isc.act.cost||0;if(c)pl.aura-=c;
    log(s,`${pl.name} activates ${o.name}${c?` (${c} Aura)`:""} (no action used).`,pid);
    isc.act.run(mkCtx(s,pid,null,DB[o.id],o,a.targets||[],{modes:a.modes||[]}));checkDeaths(s);return}
  /* battle actions */
  s.cur={pid,type:a.type};const actor=actorFor(s,pid);
  if(a.type==="play"){playCard(s,pid,actor,a.uid,a,{});return}
  if(a.type==="attack"){startAttack(s,pid,a.att,a.targets[0],{});return}
  if(a.type==="band"){const all=bandMembers(s,pid);let mem=(a.members||all.map(o=>o.uid)).filter(u=>u!==a.att&&all.some(o=>o.uid===u));
    if(!mem.length){startAttack(s,pid,a.att,a.targets[0],{});return}
    startAttack(s,pid,a.att,a.targets[0],{band:mem});return}
  if(a.type==="level"){actor.ex=true;levelUp(s,actor,a.stat,true);draw(s,pid,1);actor.fl.leveled=s.round;return}
  if(a.type==="step"){actor.fl.stepped=s.round;log(s,`${actor.name} steps back and will act last this round, after the Closer.`,pid);return}
  if(a.type==="ability"){const ab=HS()[actor.name][a.idx];const c=abilityCost(s,pid,actor,ab);if(ab.ex!==false)actor.ex=true;pay(s,pid,actor,c);
    log(s,`${actor.name} uses its ability${ab.label?`: ${ab.label}`:""}.`,pid);
    const trig={kind:"card",ability:true,src:actor,pid,targets:a.targets||[],cost:c,cls:actor.cls,type:"Ability"};
    queueResolve(s,pid,{k:"ability",actor:actor.uid,idx:a.idx,targets:a.targets||[]},trig);return}
  if(a.type==="manualAbility"){log(s,`${actor.name} uses an ability (resolved by hand). Pay its costs in the panel.`,pid);s.pend.unshift({type:"manual",pid,title:`${actor.name}: ability`,text:DB[actor.id].rules,actor:actor.uid});return}
  if(a.type==="use"){const o=find(s,a.uid).o;const isc=SC()[o.name];const c=itemCost(s,pid,actor,o);pay(s,pid,actor,c);
    if(def(o).sub==="Arrow"||isc.act.ex)actor.ex=true;
    log(s,`${actor.name} activates ${o.name}.`,pid);
    if(isc.act.exile||def(o).sub==="Arrow"){pl.inv.splice(pl.inv.indexOf(o),1);if(isc.act.exile)pl.exile.push({uid:o.uid,id:o.id,owner:o.owner});else pl.disc.push({uid:o.uid,id:o.id,owner:o.owner})}
    const trig={kind:"card",item:true,src:actor,pid,targets:a.targets||[],cost:c,cls:def(o).cls,type:"Item",name:o.name};
    queueResolve(s,pid,{k:"item",actor:actor.uid,item:o.uid,itemName:o.name,targets:a.targets||[],modes:a.modes||[],arrow:def(o).sub==="Arrow"},trig);return}
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

/* ---------- card play ---------- */
function mkCtx(s,pid,actor,d,inst,targets,extra){const c=Object.assign({s,pid,me:P(s,pid),op:P(s,opp(pid)),actor,def:d,inst,t:(targets||[]).map(t=>t==null?null:resolveTarget(s,t)),tu:targets||[],E},extra||{});return c}
E.mkCtx=mkCtx;
function playCard(s,pid,actor,uid,a,o){const pl=P(s,pid);
  let c=pl.hand.find(x=>x.uid===uid);let fromLib=false;
  if(!c&&o.combo){c=pl.lib.find(x=>x.uid===uid);fromLib=true}
  if(!c)return;const d=DB[c.id];const sc=SC()[d.name];
  const x=d.cost==="X"?Math.max(0,Math.min(a.x|0,99)):0;
  const cost=o.free?0:cardCost(s,pid,actor,d,x);
  if(cost>pl.aura){log(s,`Not enough Aura for ${d.name}.`,pid);return}
  pay(s,pid,actor,cost);consumeCostFlags(s,pid,actor,d);
  (fromLib?pl.lib:pl.hand).splice((fromLib?pl.lib:pl.hand).indexOf(c),1);
  pl.t.cards=(pl.t.cards||0)+1;
  let targets=a.targets||[];
  /* Confused: targets are random among all legal */
  if(actor&&actor.st.confuse&&sc){const specs=specsFor(sc,a.modes);targets=specs.map((sp,i)=>{if(targets[i]==null)return null;const cs=candidates(s,pid,Object.assign({},sp,{k:sp.k.replace(/^(enemy|ally)/,"").replace(/^$/,"any").replace(/^Hero$/,"hero").replace(/^Summon$/,"summon")}),{actor,card:d});return cs.length?cs[ri(s,cs.length)]:targets[i]});log(s,`${actor.name} is Confused: targets are chosen at random.`)}
  log(s,`${actor?actor.name:pl.name} plays ${d.name}${o.combo?" (Combo)":""}${cost?` for ${cost} Aura`:""}${targets.filter(Boolean).length?" → "+targets.filter(Boolean).map(t=>{const r=resolveTarget(s,t);return r?r.name:"?"}).join(", "):""}.`,pid);
  s.lastCard={id:c.id,pid,targets,modes:a.modes,x};
  if(d.type==="Song")pl.t.songs=(pl.t.songs||0)+1;
  if(d.sup!=="Hidden")countCombo(s,pid,actor,d);
  /* permanents */
  if(d.kind==="equip"){equipTo(s,actor,eqObjFromCard(s,pid,c));return}
  if(d.sup==="Hidden"){pl.inv.push(Object.assign({kind:"card",fd:true,name:d.name},c));log(s,`${pl.name} sets a Hidden card face down.`,pid);overflow(s,pid);
    if(sc&&sc.onSet)sc.onSet(mkCtx(s,pid,actor,d,c,[]));return}
  if(d.type==="Item"){const it=Object.assign({kind:"card",fd:false,name:d.name,ctr:{}},c);pl.inv.push(it);overflow(s,pid);
    if(sc&&sc.enter)sc.enter(mkCtx(s,pid,actor,d,it,targets));return}
  if(d.type==="Summon"&&actor)actor.ex=true;
  const trig={kind:"card",src:actor,pid,card:d,cardUid:c.uid,targets,cost,cls:d.cls,type:d.type,name:d.name};
  queueResolve(s,pid,{k:"card",actor:actor&&actor.uid,card:{uid:c.uid,id:c.id,owner:c.owner},targets,modes:a.modes||[],x,combo:!!o.combo,echo:!!o.echo},trig);
}
E.playCard=playCard;
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
function closeWindow(s,pr){resolveCont(s,pr.trig.pid,pr.cont,pr.mods||{})}
function doReveal(s,pid,o,pr){const pl=P(s,pid);const d=def(o);const h=revealHero(s,pid,o);const cost=hiddenCost(s,pid,o);
  h.ex=true;pay(s,pid,h,cost);o.fd=false;pl.inv.splice(pl.inv.indexOf(o),1);
  log(s,`${pl.name} reveals ${d.name}${cost?` (${cost} Aura)`:""}, exhausting ${h.name}.`,pid);
  trapGold(s,pid,d);
  const hs=hiddenScript(o);
  if(hs){const ctx=mkCtx(s,pid,h,d,o,[],{trig:pr.trig,mods:pr.mods});hs.run(ctx);
    const keep=hs.keep?hs.keep(ctx):false;if(keep)pl.inv.push(o);else if(d.type==="Item"||d.sup==="Hidden")toDisc(s,o);
    countCombo(s,pid,h,d);
    if(pr.mods.cancel){s.pend.shift();log(s,"The action is canceled.");afterCancel(s,pr)}
    if(E.hasCombo(d))comboTrigger(s,pid,h);
    return
  }else{countCombo(s,pid,h,d);toDisc(s,o);s.pend.splice(1,0,{type:"manual",pid,title:d.name,text:d.rules,hidden:true})}
}
function trapGold(s,pid,d){if(d.sub!=="Trap")return;const n=living(P(s,pid)).filter(h=>h.name==="Beast Tracker").length;if(n){P(s,pid).gold+=n;log(s,`Beast Tracker: ${P(s,pid).name} gains ${n} Gold.`,pid)}}
function afterCancel(s,pr){const c=pr.cont;if(c.k==="card"){const pl=P(s,pr.trig.pid);pl.disc.push(c.card)}}
function resolveCont(s,pid,cont,mods){
  if(cont.k==="none")return;
  if(cont.k==="attack"){resolveAttack(s,pid,cont,mods);return}
  const actor=cont.actor?heroByUid(s,cont.actor):null;
  if(cont.k==="ability"){const ab=HS()[actor.name][cont.idx];ab.run(mkCtx(s,pid,actor,DB[actor.id],null,cont.targets,{mods}));checkDeaths(s);return}
  if(cont.k==="item"){const isc=SC()[cont.itemName];const o=find(s,cont.item);const ctx=mkCtx(s,pid,actor,DB[cont.itemName],o?o.o:null,cont.targets,{mods,arrow:cont.arrow,modes:cont.modes||[]});
    if(cont.arrow)ctx.arrowBonus=arrowBonus(s,pid,actor);
    isc.act.run(ctx);
    if(cont.arrow){const pl=P(s,pid);pl.t.arrows=(pl.t.arrows||0)+1;pl.fl.arrowNext=null;
      if(actor&&actor.name==="Wild Archer"&&(actor.lvl>=3||pl.t.arrows===1)){actor.ex=false;log(s,"Wild Archer readies.",pid)}}
    checkDeaths(s);return}
  const d=DB[cont.card.id];const sc=SC()[d.name];const pl=P(s,pid);
  const ctx=mkCtx(s,pid,actor,d,cont.card,cont.targets,{mods,modes:cont.modes,x:cont.x,comboed:cont.combo});
  let stays=false;const pend0=s.pend.length;
  if(sc){const r=sc.run(ctx);stays=r==="stay"}
  else{s.pend.unshift({type:"manual",pid,title:d.name,text:d.rules,card:cont.card.id});}
  if(d.type==="Enchantment"&&sc){stays=true}
  if(!stays){if(/Echo\./.test(d.rules||"")&&!cont.echo){pl.echo.push({card:cont.card,targets:cont.targets,modes:cont.modes,x:cont.x});log(s,`${d.name} is set aside (Echo).`,pid)}
    else pl.disc.push(cont.card)}
  /* triggers on card played */
  if(d.type==="Spell"){living(pl).forEach(h=>{if(h.name==="Diviner Mage")pushScry(s,pid,1)})}
  if(d.type==="Song"&&actor&&!actor.dead&&heroIs(actor,"Bard")){living(pl).filter(h=>h.name==="Harmony Sage").forEach(hs=>heal(s,hs,actor,1,pid))}
  if(d.type==="Song"){if(invHas(pl,"The Forbidden Tuner")){const t=bestDamageTarget(s,pid,1,{pierce:1});if(t)damage(s,{name:"The Forbidden Tuner"},t,1,{pierce:1,card:true})}
    if(actor&&hasEqN(actor,"War Lute")){const t=autoTarget(s,pid,"strAlly");if(t)addMod(t,{str:1})}
    if(actor&&hasEqN(actor,"Celestial Harp")&&pl.t.songs===2)living(pl).forEach(h=>heal(s,actor,h,1))}
  if(d.sub==="Combo"&&actor&&actor.name==="Sage Monk"&&!actor.dead&&actor.fl.sageRound!==s.round&&pl.lib.length){actor.fl.sageRound=s.round;log(s,"Sage Monk: first Combo card this turn, Scry 1.",pid);pushScry(s,pid,1)}
  if(E.hasCombo(d)){const added=s.pend.length-pend0;
    /* Combo waits until the card's own Scry/choice prompts are answered */
    if(added>0)s.pend.splice(added,0,{type:"comboGo",pid,actor:actor&&actor.uid});else comboTrigger(s,pid,actor)}
  checkDeaths(s)}
function arrowBonus(s,pid,actor){const pl=P(s,pid);let b=0,ign=false,pierce=0;
  if(actor){if(actor.name==="Hawkeye")b+=actor.lvl>=6?2:actor.lvl>=3?1:0;if(hasEqN(actor,"Longbow"))b+=1}
  const n=pl.fl.arrowNext;if(n){b+=n.dmg||0;if(n.ign)ign=true}
  if(pl.fl.rapidPierce)pierce=1;return{dmg:b,ignoreDef:ign,pierce}}
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
  /* Resistance Shield: pay 1 Aura to attack its owner's Heroes */
  const tp=ctrl(s,tgt);if(tgt.kind==="hero"&&invHas(P(s,tp),"Resistance Shield")&&tp!==pid){P(s,pid).aura=Math.max(0,P(s,pid).aura-1);log(s,"Resistance Shield: attacker pays 1 Aura.",pid)}
  att.attacks=(att.atkRound===s.round?att.attacks:0)+1;att.atkRound=s.round;
  if(o.band){const mem=o.band.map(u=>find(s,u)).filter(Boolean).map(x=>x.o);mem.forEach(m=>{m.ex=true;m.attacks=(m.atkRound===s.round?m.attacks:0)+1;m.atkRound=s.round});
    const parts=[att,...mem].map(m=>`${m.name} ${dmgStr(s,m,tgt)}`);log(s,`⚔ Band attack on ${tgt.name}: ${parts.join(" + ")}${bandBonus(s,att,mem)?` + ${bandBonus(s,att,mem)} bonus`:""} = ${bandTotal(s,att,mem,tgt)} STR.`,pid)}
  else log(s,`⚔ ${att.name} attacks ${tgt.name}.`,pid);
  if(att.kind==="hero"){if(att.name==="Dawn Priest"||hasEqN(att,"Mace of Dawn")){const t=autoTarget(s,pid,"healAlly");if(t)heal(s,att,t,1)}}
  const trig={kind:"attack",attacker:attUid,target:tgtUid,pid,noHidden:!!o.noHidden,str:o.band?bandTotal(s,att,o.band.map(u=>find(s,u)).filter(Boolean).map(x=>x.o),tgt):dmgStr(s,att,tgt),band:o.band||null};
  queueResolve(s,pid,{k:"attack",att:attUid,tgt:tgtUid,o},trig)}
E.startAttack=startAttack;
function resolveAttack(s,pid,cont,mods){const f=find(s,cont.att);const tgt=resolveTarget(s,cont.tgt);const o=cont.o||{};
  if(mods.cancel||!f||!tgt||tgt.dead){if(mods.cancel)log(s,"The attack is canceled.");postAttack(s,pid,cont,0);return}
  const att=f.o;
  let str=(o.band?bandTotal(s,att,o.band.map(u=>find(s,u)).filter(Boolean).map(x=>x.o).filter(m=>!m.dead),tgt):dmgStr(s,att,tgt))+(mods.str||0)+(o.str||0);
  if(att.kind==="hero"&&att.name==="Skullcrusher"&&att.attacks===2)str+=3;
  let pierce=(o.pierce||0)+(att.kind==="hero"&&att.name==="Precision Fighter"&&strOf(s,att)>=3?1:0)+(P(s,pid).pm.pierce||0);
  const ign=o.ignoreDef||(att.kind==="hero"&&att.name==="Savage Raider"&&enraged(s,att));
  let dealt=0;
  if(mods.noDamage){log(s,`The attack deals no damage.`)}
  else dealt=damage(s,att,tgt,Math.max(0,str),{combat:true,pierce,ignoreDef:ign});
  if(mods.retaliate&&dealt>0){}
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
    if(dealt>0&&tgt&&tgt.kind==="hero"&&hasEqN(att,"Gauntlets of Growth")&&att.fl.gauntRound!==s.round&&att.lvl<6){att.fl.gauntRound=s.round;levelUp(s,att,"str");att.ex=true}}
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
  case"revive":if(t&&t.kind==="hero"&&t.dead&&!t.surr&&t.owner===pid){t.dead=false;t.dmg=Math.max(0,maxHp(s,t)-Math.max(1,n));t.ex=true;log(s,`${who} revives ${t.name} with ${maxHp(s,t)-t.dmg} HP.`,pid)}break;
  case"unequip":if(t&&t.kind==="equip")unequip(s,t);break;
  case"move":if(t&&t.kind==="hero"){const op=P(s,t.owner);const i=op.heroes.indexOf(t);const j=Math.max(0,Math.min(2,a.n|0));op.heroes.splice(i,1);op.heroes.splice(j,0,t);log(s,`${who}: ${t.name} moves to ${POS[j]}.`,pid)}break;
  case"reveal":{let o=pl.inv.find(x=>x.uid===a.card&&x.fd),from="inv";if(!o){o=pl.hand.find(x=>x.uid===a.card&&DB[x.id]&&DB[x.id].sup==="Hidden");from="hand"}
    if(!o)break;const d=DB[o.id];const cost=hiddenCost(s,pid,o);const hh=revealHero(s,pid,o);
    if(cost>pl.aura){log(s,`${who}: not enough Aura to reveal ${d.name} (costs ${cost}).`,pid);break}
    pay(s,pid,hh,cost);if(hh)hh.ex=true;(from==="inv"?pl.inv:pl.hand).splice((from==="inv"?pl.inv:pl.hand).indexOf(o),1);pl.disc.push({uid:o.uid,id:o.id,owner:o.owner});
    log(s,`${who} reveals ${d.name} from ${from==="inv"?"inventory":"hand"}${cost?` (${cost} Aura)`:""}${hh?`, exhausting ${hh.name}`:""}: ${d.rules.replace(/\{A\}/g," Aura").replace(/\{L(\d)\}/g,"[Level $1]")}`,pid);
    trapGold(s,pid,d);countCombo(s,pid,hh,d);const pr=s.pend[0];if(pr&&pr.type==="manual")pr.revealed=(pr.revealed||[]).concat([{name:d.name,text:d.rules}]);break}
  case"cancelAction":log(s,`${who} cancels the action.`,pid);break;
  }
  checkDeaths(s)}

/* ---------- auto targets for passive triggers ---------- */
function autoTarget(s,pid,kind){const me=P(s,pid),op=P(s,opp(pid));
  if(kind==="enemy"){const c=living(op).filter(h=>!stealth(s,h));if(!c.length)return op.bf.find(o=>o.kind==="summon")||null;return c.sort((a,b)=>hpOf(s,a)-hpOf(s,b))[0]}
  if(kind==="healAlly"){const c=living(me).filter(h=>h.dmg>0);return c.sort((a,b)=>b.dmg-a.dmg)[0]||null}
  if(kind==="statusAlly"){return living(me).find(h=>STATUS.some(k=>h.st[k]>0))||null}
  if(kind==="strAlly"){return living(me).filter(h=>!h.ex).sort((a,b)=>strOf(s,b)-strOf(s,a))[0]||living(me)[0]||null}
  return null}
E.autoTarget=autoTarget;

/* ---------- flow ---------- */
function settle(s){let guard=0;
  while(!s.over&&guard++<200){
    if(s.pend.length){if(s.pend[0].type==="comboGo"){const pr=s.pend.shift();comboTrigger(s,pr.pid,pr.actor?heroByUid(s,pr.actor):null);continue}
      /* AI-free auto answers handled by controller */return}
    if(s.trig10&&s.trig10.length){const v=s.trig10.shift();const trig={kind:"party10",pid:opp(v)};if(windowFor(s,v,trig)){s.pend.unshift({type:"window",pid:v,trig,cont:{k:"none"},mods:{}});log(s,`${P(s,v).name}'s party has taken 10 damage this turn and may respond with a Hidden card…`)}continue}
    if(s.qatk){const q=s.qatk;s.qatk=null;const f=find(s,q.att);const t=resolveTarget(s,q.tgt);if(f&&t&&!t.dead&&!f.o.dead){startAttack(s,q.pid,q.att,q.tgt,q.o||{});continue}}
    if(s.cur){const pid=s.cur.pid;s.cur=null;if(s.phase==="battle"){
        if(s.bonus&&s.bonus.pid===pid){s.bonus.n--;if(s.bonus.n<=0||!actorFor(s,pid))s.bonus=null;if(s.bonus){s.prio=pid;continue}}
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
      if(h.med&&h.keepMed){h.plus++;log(s,`${h.name} keeps Meditating (+1/+1 counter).`,pid)}else{if(h.med){h.med=false;h.fl.medEnd=true}h.ex=false}
      h.eqGuard=guardEq(h)});
    pl.bf.forEach(o=>{if(o.kind==="summon")o.ex=false});
    pl.inv.forEach(o=>{if(o.exh)o.exh=false});
    let aura=0;living(pl).forEach(h=>{if(h.fl.noAuraRound===s.round)return;aura+=auraStat(h);h.ench.forEach(e=>{if(e.name==="Aura Leech")aura-=1})});
    if(pl.fl.auraPenalty){aura-=pl.fl.auraPenalty;pl.fl.auraPenalty=0}
    pl.aura=Math.max(0,aura);
  });
  s.p.forEach((pl,pid)=>{const all=[...living(pl),...pl.bf.filter(o=>o.kind==="summon")];
    all.forEach(o=>{const n=o.st.burn+o.st.poison+o.st.wound;if(n>0){o.dmg+=n;log(s,`${o.name} takes ${n} status damage.`,pid)}
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
      if(hasEqN(h,"Chalice of Life"))living(pl).forEach(o=>heal(s,h,o,1));
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
function doDusk(s){s.phase="dusk";log(s,`— Dusk —`);
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
    pl.heroes.forEach(h=>{clean(h);h.guard=0;if(!h.med&&h.plus&&h.fl.medEnd){h.plus=0;h.fl.medEnd=false}});
    pl.bf.forEach(clean);
    pl.pm={};pl.t={};pl.fl.mageNext=pl.fl.mageAll=pl.fl.trapNext=pl.fl.trapAll=pl.fl.songDisc=false;pl.fl.arrowNext=null;pl.fl.rapidPierce=false;pl.fl.preventNext=false;
    if(pl.aura>0)log(s,`${pl.name} loses ${pl.aura} unspent Aura.`,pid);pl.aura=0;
    const g=living(pl).length;pl.gold+=g;log(s,`${pl.name} collects ${g} Gold (now ${pl.gold}).`,pid);
    pl.heroes.forEach(h=>{if(h.fl.h2h&&!h.dead){(h.fl.h2h||[]).forEach(e=>{const idx=pl.inv.findIndex(o=>o.uid===e);if(idx>=0){const o=pl.inv.splice(idx,1)[0];equipTo(s,h,o)}})}h.fl.h2h=null});
  });
  s.pillage=null;s.trig10=null;
  s.init=nextInit;log(s,`Initiative passes to ${s.p[s.init].name}.`);
  s.phase="town";s.town={order:[s.init,opp(s.init)],i:0};log(s,`— Town —`)}

/* ---------- views ---------- */
E.publicCard=c=>DB[c.id];
E.heroStats=(s,h)=>({str:strOf(s,h),def:defOf(s,h),aura:h.kind==="hero"?auraStat(h):0,hp:hpOf(s,h),max:maxHp(s,h)});
E.labelAction=function(s,pid,a){const pl=P(s,pid);const nm=u=>{const r=resolveTarget(s,u);return r?r.name:"?"};
  switch(a.type){case"play":{const c=findCardAnywhere(s,pid,a.uid);return"Play "+(c?DB[c.id].name:"card")}
  case"attack":return`${nm(a.att)} attacks`;case"band":return`Band attack led by ${nm(a.att)}`;case"useFree":return"Activate "+nm(a.uid);case"level":return"Level up"+(a.stat?` (+1 ${a.stat.toUpperCase()})`:"");case"step":return"Step Back";
  case"ability":{const a2=actorFor(s,pid);return`${a2.name}: ${HS()[a2.name][a.idx].label}`}
  case"use":return"Activate "+nm(a.uid);case"equipInv":return"Equip "+nm(a.uid);case"take":return"Take "+nm(a.uid);case"clear":return"Clear "+nm(a.uid);
  case"soul":return`Surrender ${nm(a.hero)}'s soul: ${SOULS[a.ch]}`;case"pass":return"Pass";default:return a.type}};
E.clone=s=>JSON.parse(JSON.stringify(s));
E.redact=function(s,viewer){/* hide opponent's hand and libraries for network play */
  const c=E.clone(s);const keep=new Set();s.pend.forEach(pr=>{if(pr.pid===viewer)(pr.cards||pr.cands||[]).forEach(u=>keep.add(u))});
  c.p.forEach((pl,pid)=>{pl.lib=pl.lib.map(x=>keep.has(x.uid)?x:({uid:x.uid,id:null,owner:x.owner}));
    if(pid!==viewer){pl.hand=pl.hand.map(x=>({uid:x.uid,id:null,owner:x.owner}));pl.inv=pl.inv.map(o=>o.fd?{uid:o.uid,kind:"card",fd:true,name:"Hidden card",id:null,owner:o.owner}:o)}});
  c.pend=c.pend.map(pr=>{if(pr.pid===viewer)return pr;return{type:pr.type,pid:pr.pid,title:pr.title,hiddenPrompt:true}});
  c.log=c.log.slice(-300);c.redacted=viewer;if(c.undo)c.undo={id:c.undo.id,what:c.undo.what};return c};
})(typeof window!=="undefined"?window:globalThis);
