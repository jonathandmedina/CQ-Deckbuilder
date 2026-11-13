/* Crystal Quest Trials boss runtime (co-op boss module, Trials Plan B+C).
   Loaded after play-engine.js and before play-cards.js. Registers itself on CQE.hooks; the engine calls it only in Trials games (s.trials),
   so 1-on-1 games never touch this file. Every number comes from trials-data.js (TRIALS_BOSSES, TRIALS_BOSS_CARDS, TRIALS_SPAWNS, TRIALS_LOOT).
   Boss state lives in s.trials: {deck, disc, plates, rage, rageAt, winded, skin, skipNext, lastFlip, events, dealt}.
   Every random choice (boss deck shuffle, loot reveal) uses the engine's seeded rng, so a Trial replays exactly from its seed. */
"use strict";
(function(root){
const E=root.CQE;if(!E)return;
const BOSSES=typeof TRIALS_BOSSES!=="undefined"?TRIALS_BOSSES:(root.TRIALS_BOSSES||[]);
const BCARDS=typeof TRIALS_BOSS_CARDS!=="undefined"?TRIALS_BOSS_CARDS:(root.TRIALS_BOSS_CARDS||[]);
const SPAWNS=typeof TRIALS_SPAWNS!=="undefined"?TRIALS_SPAWNS:(root.TRIALS_SPAWNS||[]);
const LOOT=typeof TRIALS_LOOT!=="undefined"?TRIALS_LOOT:(root.TRIALS_LOOT||[]);
const T={};root.CQT=T;
const num=(re,txt,d)=>{const m=re.exec(txt||"");return m?+m[1]:d};
/* boss rules read from the data file's text */
function bossRow(trial){return BOSSES.find(r=>r[1]===trial)||BOSSES[0]}
function bossRules(row){const ab=row[6]||"";return{rageExtra:num(/number of parties plus (\d+)/i,ab,1),stampede:num(/deal (\d+) damage to every player Hero/i,ab,3)}}
function cardRow(name){return BCARDS.find(r=>r[0]===name)}
function spawnRow(boss){return SPAWNS.find(r=>r[1]===boss)}
const ev=(s,e)=>{const st=s.trials;st.evN=(st.evN||0)+1;st.events=(st.events||[]).concat([Object.assign({n:st.evN,round:s.round},e)]).slice(-20)};
const bossSide=s=>s.p[s.trials.boss];
const bossHero=s=>bossSide(s).heroes[0];
T.bossHero=bossHero;
/* Defense = base + Stone Plates + Stone Skin, or 0 while Winded */
function syncDef(s){const st=s.trials,h=bossHero(s);if(!h)return;h.base.def=st.winded?0:(st.baseDef||0)+st.plates+(st.skin||0)}
T.syncDef=syncDef;

/* ---------- setup ---------- */
T.setup=function(s){const st=s.trials;const P=st.parties;const row=bossRow(st.trial);const R=bossRules(row);const sp=spawnRow(row[0]);
  Object.assign(st,{bossName:row[0],baseDef:+row[3]||0,plates:(+row[4]||0)*P,rage:0,rageAt:P+R.rageExtra,stampede:R.stampede,winded:false,skin:0,skipNext:false,lastFlip:null,events:[],disc:[],dealt:{round:0,by:{}},spawn:sp?sp[0]:null,exSeen:false,stunSeen:0});
  const h=E.mkBossHero(s,row[0],(+row[2]||0)*P,0);bossSide(s).heroes.push(h);bossSide(s).name=row[0];
  if(sp&&!E.TOK[sp[0]])E.TOK[sp[0]]={name:sp[0],tkind:"Spawn",sub:"Spawn",cls:"Trials",str:+sp[2]||0,def:+sp[3]||0,hp:+sp[4]||1,cost:0,region:"",rules:sp[5]||""};
  st.deck=[];BCARDS.filter(r=>r[1]===row[0]).forEach(r=>{for(let i=0;i<(+r[2]||0);i++)st.deck.push(r[0])});E.shuffle(s,st.deck);
  syncDef(s);
  E.log(s,`${row[0]}: ${h.base.hp} Health Points, ${st.plates} Stone Plate${st.plates===1?"":"s"} (Defense ${h.base.def}). Raging Stampede at ${st.rageAt} Rage.`);
  for(let pid=0;pid<P;pid++)for(let k=0;k<(+row[5]||0);k++)spawnVs(s,pid,true)};

/* a spawn (Golem) placed against party vs: Strength, Defense and Health Points from TRIALS_SPAWNS */
function spawnVs(s,vs,quiet){const st=s.trials;const sp=spawnRow(st.bossName);if(!sp)return null;
  const o=E.makeSummon(s,st.boss,sp[0],true);o.str=+sp[2]||0;o.hp=+sp[4]||1;o.mods=[{def:+sp[3]||0,until:null,src:"Spawn"}];o.fl.vs=vs;o.spawn=true;
  E.log(s,`${sp[0]} is placed against ${s.p[vs].name}.`);return o}
T.spawnVs=spawnVs;
const spawnsVs=(s,pid)=>bossSide(s).bf.filter(o=>o.kind==="summon"&&o.spawn&&o.fl.vs===pid);
T.spawnsVs=spawnsVs;

/* ---------- targeting (ties: least Defense, then Lead before Closer, then initiative order) ---------- */
function heroList(s){const out=[];E.parties(s).forEach((pid,oi)=>{s.p[pid].heroes.forEach((h,i)=>{if(!h.dead)out.push({h,pid,i,oi})})});return out}
const tie=s=>(a,b)=>E.defn(s,a.h)-E.defn(s,b.h)||a.i-b.i||a.oi-b.oi;
function pick(s,list,key){if(!list.length)return null;return list.slice().sort((a,b)=>key(b)-key(a)||tie(s)(a,b))[0]}
const liveParties=s=>E.parties(s).filter(p=>!E.wiped(s,p));
/* who a boss card hits: returns [{hero}] targets, or for summons {summonVs:[pid]} */
T.targetOf=function(s,name){const L=heroList(s);const hp=x=>E.hp(s,x.h);
  switch(name){
  case"Tusk Gore":{const x=pick(s,L,x=>E.str(s,x.h));return x?[x.h]:[]}
  case"Crushing Step":{const x=pick(s,L,hp);return x?[x.h]:[]}
  case"Boulder Toss":{const x=pick(s,L,x=>-hp(x));return x?[x.h]:[]}
  case"Grudge Stomp":{const d=s.trials.dealt&&s.trials.dealt.round===s.round?s.trials.dealt.by:{};
    const leads=liveParties(s).map(pid=>{const pl=s.p[pid];const i=pl.heroes.findIndex(h=>!h.dead);return{h:pl.heroes[i],pid,i:0,oi:E.parties(s).indexOf(pid),d:d[pid]||0}});
    const x=pick(s,leads,x=>x.d);return x?[x.h]:[]}
  case"Rockslide":{const ps=liveParties(s).map(pid=>{const hs=s.p[pid].heroes.filter(h=>!h.dead);return{pid,hs,t:hs.reduce((n,h)=>n+E.hp(s,h),0),d:hs.reduce((n,h)=>n+E.defn(s,h),0),oi:E.parties(s).indexOf(pid)}});
    const x=ps.sort((a,b)=>b.t-a.t||a.d-b.d||a.oi-b.oi)[0];return x?x.hs:[]}
  case"Tremor":return liveParties(s).map(pid=>pick(s,L.filter(x=>x.pid===pid&&!x.h.ex),x=>E.str(s,x.h))).filter(Boolean).map(x=>x.h);
  case"Call the Mountain":{const ps=liveParties(s).map((pid,oi)=>({pid,n:spawnsVs(s,pid).length,oi}));const x=ps.sort((a,b)=>a.n-b.n||a.oi-b.oi)[0];return x?{summonVs:[x.pid]}:{summonVs:[]}}
  case"The Mountain Wakes":return{summonVs:liveParties(s)};
  case"Stone Skin":return[bossHero(s)];
  }return[]};
/* a spawn's target (Intelligence Level 1): most Health Points in its party, then the tie-break; if that party is wiped, the next party clockwise */
T.spawnTarget=function(s,o){const n=s.trials.parties;for(let k=0;k<n;k++){const pid=(o.fl.vs+k)%n;if(E.wiped(s,pid))continue;
    const L=heroList(s).filter(x=>x.pid===pid);const x=pick(s,L,x=>E.hp(s,x.h));if(x)return x.h}return null};

/* ---------- after each sweep: the boss flips (or skips, or Stampedes), then every spawn attacks ---------- */
T.afterSweep=function(s){const st=s.trials;if(s.over)return;const h=bossHero(s);if(!h||h.dead)return;
  T.checkSkip(s);
  if(st.skipNext){st.skipNext=false;E.log(s,`${h.name} is Stunned or exhausted and skips its flip.`);ev(s,{kind:"skip",card:null,targets:[]});st.lastFlip={kind:"skip",card:null,targets:[]};T.seen(s);return}
  if(st.rage>=st.rageAt){st.skin=0;const ts=heroList(s).map(x=>x.h);E.log(s,`💢 ${h.name} does Raging Stampede: ${st.stampede} damage to every player Hero.`);
    st.lastFlip={kind:"stampede",card:"Raging Stampede",targets:ts.map(t=>t.name)};ev(s,st.lastFlip);
    ts.forEach(t=>{if(!s.over&&!t.dead)E.withSrc(s,"Raging Stampede",()=>E.damage(s,h,t,st.stampede,{card:true,srcName:"Raging Stampede"}))});
    st.rage=0;st.winded=true;st.stampedes=(st.stampedes||0)+1;syncDef(s);E.log(s,`${h.name} is Winded (0 Defense until its next flip).`)}
  else{st.skin=0;st.winded=false;
    if(!st.deck.length){st.deck=st.disc.splice(0);E.shuffle(s,st.deck);E.log(s,`${h.name} shuffles its boss deck.`)}
    const card=st.deck.pop();st.disc.push(card);syncDef(s);resolveCard(s,card)}
  if(s.over)return;
  bossSide(s).bf.filter(o=>o.kind==="summon"&&o.spawn).forEach(o=>{if(s.over||E.hp(s,o)<=0||!bossSide(s).bf.includes(o))return;
    if(o.st&&o.st.stun>0){E.log(s,`${o.name} is Stunned and doesn't attack.`);return}
    const t=T.spawnTarget(s,o);if(!t)return;E.log(s,`⚔ ${o.name} attacks ${t.name}.`);E.damage(s,o,t,E.str(s,o),{combat:true})});
  T.seen(s)};
function resolveCard(s,card){const st=s.trials;const h=bossHero(s);const row=cardRow(card)||[card,"",0,"",""];const eff=row[4]||"";const n=num(/Deal (\d+) damage/i,eff,0);
  const tg=T.targetOf(s,card);const names=Array.isArray(tg)?tg.map(t=>t.name):(tg.summonVs||[]).map(p=>s.p[p].name);
  st.lastFlip={kind:"flip",card,targets:names};ev(s,st.lastFlip);
  E.log(s,`🂠 ${h.name} flips ${card}${names.length?" → "+names.join(", "):""}.`);
  E.withSrc(s,card,()=>{
    if(card==="Stone Skin"){st.skin=num(/\+(\d+) Defense/i,eff,2);syncDef(s);E.log(s,`${h.name} gets +${st.skin} Defense until its next flip (Defense ${E.defn(s,h)}).`);return}
    if(card==="Tremor"){tg.forEach(t=>{E.exhaust(s,s.trials.boss,t,"Tremor")});return}
    if(!Array.isArray(tg)){(tg.summonVs||[]).forEach(p=>spawnVs(s,p));return}
    tg.forEach(t=>{if(!s.over&&!t.dead&&n>0)E.damage(s,h,t,n,{card:true,srcName:card})})})}
T.resolveCard=resolveCard;

/* Stun or exhaust on the boss (any card or ability) makes it skip its next flip; it readies right away (it has no actions to lose) */
T.checkSkip=function(s){const st=s.trials,h=bossHero(s);if(!h||h.dead)return;
  if(h.ex){h.ex=false;st.skipNext=true;E.log(s,`${h.name} was exhausted: it will skip its next flip.`)}
  if((h.st.stun||0)>(st.stunSeen||0)){st.skipNext=true;E.log(s,`${h.name} was Stunned: it will skip its next flip.`)}};
T.seen=s=>{const h=bossHero(s);if(h)s.trials.stunSeen=h.st.stun||0};

/* a spawn dies: break a Stone Plate and add a Rage counter (new spawns never repair plates) */
T.onSummonDies=function(s,o){if(!o.spawn)return;const st=s.trials;const was=st.plates;st.plates=Math.max(0,st.plates-1);st.rage+=1;syncDef(s);
  E.log(s,`${o.name} is destroyed: ${was>st.plates?"a Stone Plate breaks":"no Stone Plates left to break"} and ${bossHero(s).name} gets a Rage counter (${st.rage}/${st.rageAt}).`);
  if(T.onSpawnDies)T.onSpawnDies(s,o)};

/* damage dealt to the boss this round, per party (Grudge Stomp) */
T.noteDamage=function(s,side,n){const st=s.trials;if(!st||side==null||E.isBoss(s,side)||n<=0)return;if(!st.dealt||st.dealt.round!==s.round)st.dealt={round:s.round,by:{}};st.dealt.by[side]=(st.dealt.by[side]||0)+n};

T.bossState=function(s){const st=s.trials;if(!st)return null;const h=bossHero(s);
  return{name:h&&h.name,hp:h?E.hp(s,h):0,max:h?E.maxHp(s,h):0,def:h?E.defn(s,h):0,plates:st.plates,platesMax:st.parties*(+bossRow(st.trial)[4]||0),rage:st.rage,rageAt:st.rageAt,winded:st.winded,skin:st.skin,
    deck:st.deck.length,disc:st.disc.length,lastFlip:st.lastFlip,spawns:E.parties(s).map(p=>({pid:p,list:spawnsVs(s,p).map(o=>({uid:o.uid,name:o.name,hp:E.hp(s,o),max:E.maxHp(s,o)}))}))}};
T.lootPool=trial=>LOOT.map(r=>r[0]);
/* built-in helper parties: each splits a starter deck to 2 of its Heroes, keeps that starter's cards for those classes plus Generic,
   raises them to 3 copies (Legendaries stay at 1), then tops up to 50 from the two classes' card pools (cheapest first) */
const PICKS=[[0,1],[0,1],[0,2],[0,2],[0,2]];
T.partyFromStarter=function(st,list,pick){const DB=E.DB;const hs=pick.map(i=>"h:"+st.heroes[i]).filter(h=>DB[h]);const cls=hs.map(h=>DB[h].cls);
  const okc=d=>d&&!d.dep&&(d.kind==="card"||d.kind==="equip")&&(d.cls==="Generic"||cls.includes(d.cls))&&!LOOT.some(r=>r[0]===d.name);
  const cards={};let n=0;const add=(id,q)=>{cards[id]=(cards[id]||0)+q;n+=q};
  for(const id in list){if(okc(DB[id]))add(id,list[id])}
  const max=id=>DB[id].sup==="Legendary"?1:3;const cost=id=>parseInt(DB[id].cost,10)||0;
  Object.keys(cards).sort((a,b)=>cost(a)-cost(b)||a.localeCompare(b)).forEach(id=>{while(n<50&&cards[id]<max(id))add(id,1)});
  if(n<50){Object.keys(DB).filter(id=>okc(DB[id])&&DB[id].cls!=="Generic"&&DB[id].sup!=="Legendary"&&DB[id].sup!=="Hidden"&&!cards[id]&&E.isScripted(DB[id].name)).sort((a,b)=>cost(a)-cost(b)||a.localeCompare(b)).forEach(id=>{while(n<50&&(cards[id]||0)<max(id))add(id,1)})}
  return{id:"tstarter:"+st.name,name:st.name.replace(/ \(starter\)$/,"")+" party (Trials)",heroes:hs,cards,trials:true}};
T.trialsStarters=(ST,SL)=>ST.map((st,i)=>T.partyFromStarter(st,SL[i],PICKS[i]||[0,1]));

E.hooks.onDamage=(s,src,tgt,n,side)=>{if(tgt&&tgt.boss)T.noteDamage(s,side,n)};
E.hooks.setup=T.setup;E.hooks.afterSweep=T.afterSweep;E.hooks.onSummonDies=T.onSummonDies;
})(typeof window!=="undefined"?window:globalThis);
