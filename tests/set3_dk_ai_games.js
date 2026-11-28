/* AI-vs-AI games: Death Knight parties (Set 3) against the 5 starter decks. 0 errors, 0 stuck, 0 engine errors; counts Blight kills, soulless deaths and Soul Harvester level-ups.
   Run: node tests/set3_dk_ai_games.js [games] */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE,AI=ctx.CQAI;
const ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");
const ST=vm.runInNewContext("("+ui.match(/const STARTERS=(\[[\s\S]*?\]);/)[1]+")"),SL=vm.runInNewContext("("+ui.match(/const STARTER_LISTS=(\[[\s\S]*?\]);\nfunction starterDeck/)[1]+")");
const starter=i=>({name:ST[i].name,heroes:ST[i].heroes.map(n=>"h:"+n),cards:Object.assign({},SL[i])});
/* no Death Knight cards yet: Generic cards only (Long Sword and Sword of Riverstead for Hollow Blade) */
const gen=Object.keys(E.DB).filter(k=>{const d=E.DB[k];return d.kind!=="hero"&&d.cls==="Generic"&&!d.dep&&!d.made&&d.sup!=="Legendary"&&E.isScripted&&E.isScripted(d.name)}).slice(0,25);
const cards=Object.fromEntries(gen.map(n=>[n,2]));cards["Long Sword"]=3;cards["Sword of Riverstead"]=3;
/* Set 3 cards (Nov 27, 2026) */Object.assign(cards,{"Grave Drain":3,"Into the Gloamreach":2,"Curse of Nothingness":3,"The Blackblade":1,"Blood Rune":2,"Protect Rune":2,"Sky Rune":2});
const PARTIES=[["Grave Lancer","Hollow Blade","Soul Harvester"],["Morwen Duskbane","Eliazar the Fallen","Grave Lancer"]];
let err=0,stuck=0,wins=0,n=0,engErr=0;const tally={blight:0,noSoul:0,harvest:0,eliazar:0,rune:0,drain:0,gloam:0};
const G=+process.argv[2]||20;
for(let i=0;i<G;i++){const seed=9100+i*17,opp=i%5,me=i%2;const DK={name:"Death Knights",heroes:PARTIES[i%2].map(n=>"h:"+n),cards};
  const decks=me?[starter(opp),DK]:[DK,starter(opp)];const s=E.newGame({seed,players:decks.map((d,k)=>({name:"P"+k,ai:true,deck:d}))});
  try{let g=0;while(!s.over&&g++<40000&&s.round<=40){let moved=false;for(const pid of[0,1]){const x=AI.choose(s,pid);if(!x)continue;const r=E.act(s,pid,x);
        if(!r.ok&&s.phase==="battle"&&s.prio===pid)E.act(s,pid,{type:"pass"});moved=true;break}
      if(!moved){const pr=s.pend[0];if(pr){const x=AI.choose(s,pr.pid);if(x)E.act(s,pr.pid,x);else s.pend.shift()}else break}}
    if(!s.over&&s.round<=40)stuck++;n++;if(s.over&&s.winner===me)wins++;
    s.log.forEach(l=>{if(/^Engine error/.test(l.m)){engErr++;if(engErr<4)console.log("engine error game",i,l.m)}if(/soul is lost to Blight/.test(l.m))tally.blight++;if(/It has no soul \(Blight\)/.test(l.m))tally.noSoul++;if(/Soul Harvester: .* levels up/.test(l.m))tally.harvest++;if(/Eliazar the Fallen: the attack also hits/.test(l.m))tally.eliazar++;if(/ evokes .* Rune/.test(l.m))tally.rune++;if(/Grave Drain/.test(l.m))tally.drain++;if(/Into the Gloamreach:/.test(l.m))tally.gloam++})}
  catch(e){err++;console.log("error game",i,e.stack.split("\n").slice(0,3).join(" | "))}}
console.log(`Death Knight AI games ${n} · errors ${err} · engine errors ${engErr} · stuck ${stuck} · Death Knight wins ${wins}/${n} · ${JSON.stringify(tally)}`);process.exit(err||stuck||engErr?1:0);
