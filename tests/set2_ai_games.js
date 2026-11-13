/* 40 AI-vs-AI games: an Artificer deck (Set 2) against the 5 starter decks. 0 errors, 0 stuck; counts Crafts, Stalls and Warded Cloak saves. Run: node tests/set2_ai_games.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE,AI=ctx.CQAI;
const ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");
const ST=vm.runInNewContext("("+ui.match(/const STARTERS=(\[[\s\S]*?\]);/)[1]+")"),SL=vm.runInNewContext("("+ui.match(/const STARTER_LISTS=(\[[\s\S]*?\]);\nfunction starterDeck/)[1]+")");
const starter=i=>({name:ST[i].name,heroes:ST[i].heroes.map(n=>"h:"+n),cards:Object.assign({},SL[i])});
const ART={name:"Workshop",heroes:["h:Artificer A","h:Artificer B","h:Artificer C"],cards:{"Clockwork Pair":2,"Iron Guardians":2,"Pocket Watch Recipe":2,"Reclamation Kit Recipe":2,"Blast Charge Recipe":2,"Gearwork Hammer Recipe":2,"Silver Edge Recipe":2,"Mithril Blade Recipe":1,"Warded Cloak Recipe":1,
  "Quicksilver":2,"Tinker's Goggles":2,"Toolbelt":2,"Bellows":2,"Scavenger's Tongs":2,"Copper Ingot":3,"Iron Ingot":3,"Silver Ingot":3,"Platinum Ingot":3,"Mithril Ingot":3,"Potion":3,"Gold Bar":2,"Rose Quartz":2,"Cloak of Protection":2}};
const bad=E.validateDeck(ART);if(bad.length){console.log("deck:",bad);process.exit(1)}
let err=0,stuck=0,wins=0,n=0;const tally={craft:0,stall:0,ward:0,construct:0,made:0};
for(let i=0;i<40;i++){const seed=9100+i*17,opp=i%5;const me=i%2;const decks=me?[starter(opp),ART]:[ART,starter(opp)];
  const s=E.newGame({seed,players:decks.map((d,k)=>({name:"P"+k,ai:true,deck:d}))});
  try{let g=0;while(!s.over&&g++<40000&&s.round<=40){let moved=false;for(const pid of[0,1]){const x=AI.choose(s,pid);if(!x)continue;const r=E.act(s,pid,x);if(!r.ok&&s.phase==="battle"&&s.prio===pid)E.act(s,pid,{type:"pass"});moved=true;break}
      if(!moved){const pr=s.pend[0];if(pr){const x=AI.choose(s,pr.pid);if(x)E.act(s,pr.pid,x);else s.pend.shift()}else break}}
    if(!s.over&&s.round<=40)stuck++;n++;if(s.over&&s.winner===me)wins++;
    s.log.forEach(l=>{if(/^Craft: /.test(l.m))tally.craft++;if(/is Stalled/.test(l.m))tally.stall++;if(/Warded Cloak prevents/.test(l.m))tally.ward++;if(/summons a Construct/.test(l.m))tally.construct++;if(/ flips .*: (Pocket Watch|Reclamation Kit|Blast Charge|Gearwork Hammer|Silver Edge|Mithril Blade|Warded Cloak)\./.test(l.m))tally.made++})}
  catch(e){err++;console.log("error game",i,e.stack.split("\n").slice(0,3).join(" | "))}}
console.log(`Artificer AI games ${n} · errors ${err} · stuck ${stuck} · Artificer wins ${wins}/${n} · ${JSON.stringify(tally)}`);process.exit(err||stuck?1:0);
