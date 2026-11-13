/* 40 AI-vs-AI games: a Necromancer deck (Set 2) against the 5 starter decks. 0 errors, 0 stuck, 0 engine errors; counts Revenants, Exhumes, Mills and Remains,
   and the longest single action (Grave Tide + Necromancer B + Grave Caller's Wand make many triggers). Run: node tests/set2_necro_ai_games.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE,AI=ctx.CQAI;
const ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");
const ST=vm.runInNewContext("("+ui.match(/const STARTERS=(\[[\s\S]*?\]);/)[1]+")"),SL=vm.runInNewContext("("+ui.match(/const STARTER_LISTS=(\[[\s\S]*?\]);\nfunction starterDeck/)[1]+")");
const starter=i=>({name:ST[i].name,heroes:ST[i].heroes.map(n=>"h:"+n),cards:Object.assign({},SL[i])});
const names=["Raise Revenant","Bone Wall","Army of Darkness","Devastating Ritual","From Darkness","Restless Dead","Grave Tide","Grave Whispers","Corpse Harvest","Dig the Grave","Dead March","Ossuary","Funeral Procession","Grieving Thoughts","Mourner's Offering","Reawaken","Grim Divination","Rise from the Grave","Consecrate","Retrace the Past","Bone Spur","Robbed Grave","Restless Echo","Soul Lantern","Grave Caller's Wand","Gravedigger's Medallion","Dagger of the Dead"];
const NEC={name:"Graveyard",heroes:["h:Necromancer A","h:Necromancer B","h:Necromancer C"],cards:Object.assign(Object.fromEntries(names.map(n=>[n,2])),{"Cursed Urn":1,"Skeleton Key":1})};
const bad=E.validateDeck(NEC);if(bad.length){console.log("deck:",bad);process.exit(1)}
let err=0,stuck=0,wins=0,n=0,engErr=0,maxMs=0,maxLog=0;const tally={revenant:0,exhume:0,mill:0,remains:0,mourn:0,sac:0,abom:0,funeral:0,necroA:0};
const G=+process.argv[2]||40;
for(let i=0;i<G;i++){const seed=7300+i*13,opp=i%5;const me=i%2;const decks=me?[starter(opp),NEC]:[NEC,starter(opp)];
  const s=E.newGame({seed,players:decks.map((d,k)=>({name:"P"+k,ai:true,deck:d}))});
  try{let g=0;while(!s.over&&g++<40000&&s.round<=40){let moved=false;for(const pid of[0,1]){const x=AI.choose(s,pid);if(!x)continue;const l0=s.log.length,t0=Date.now();const r=E.act(s,pid,x);const dt=Date.now()-t0;if(dt>maxMs)maxMs=dt;if(s.log.length-l0>maxLog)maxLog=s.log.length-l0;
        if(!r.ok&&s.phase==="battle"&&s.prio===pid)E.act(s,pid,{type:"pass"});moved=true;break}
      if(!moved){const pr=s.pend[0];if(pr){const x=AI.choose(s,pr.pid);if(x)E.act(s,pr.pid,x);else s.pend.shift()}else break}}
    if(!s.over&&s.round<=40)stuck++;n++;if(s.over&&s.winner===me)wins++;
    s.log.forEach(l=>{if(/^Engine error/.test(l.m)){engErr++;if(engErr<4)console.log("engine error game",i,l.m)}if(/summons a Revenant/.test(l.m))tally.revenant++;if(/\(Exhume\)/.test(l.m))tally.exhume++;if(/ mills \d/.test(l.m))tally.mill++;if(/creates a Remains/.test(l.m))tally.remains++;if(/^Mourn:/.test(l.m))tally.mourn++;if(/additional cost/.test(l.m))tally.sac++;if(/summons an Abomination/.test(l.m))tally.abom++;if(/plays Funeral Procession/.test(l.m))tally.funeral++;if(/Play a Summon from your discard pile/.test(l.m))tally.necroA++})}
  catch(e){err++;console.log("error game",i,e.stack.split("\n").slice(0,3).join(" | "))}}
console.log(`Necromancer AI games ${n} · errors ${err} · engine errors ${engErr} · stuck ${stuck} · Necromancer wins ${wins}/${n} · longest action ${maxMs} ms / ${maxLog} log lines · ${JSON.stringify(tally)}`);process.exit(err||stuck||engErr?1:0);
