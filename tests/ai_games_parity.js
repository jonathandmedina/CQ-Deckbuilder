/* 30 AI-vs-AI games with and without trials-data.js loaded, same seeds: winners and rounds must match, 0 errors, 0 stuck. Run: node tests/ai_games_parity.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
function load(withTrials){const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
  const files=["cards-data.js",...(withTrials?["trials-data.js"]:[]),"play-engine.js","play-cards.js","play-ai.js"];
  vm.runInContext(files.map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);return ctx}
const ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");
const ST=vm.runInNewContext("("+ui.match(/const STARTERS=(\[[\s\S]*?\]);/)[1]+")"),SL=vm.runInNewContext("("+ui.match(/const STARTER_LISTS=(\[[\s\S]*?\]);\nfunction starterDeck/)[1]+")");
const deck=i=>({name:ST[i].name,heroes:ST[i].heroes.map(n=>"h:"+n),cards:Object.assign({},SL[i])});
function play(ctx,seed,a,b){const E=ctx.CQE,AI=ctx.CQAI;const s=E.newGame({seed,players:[{name:"A",ai:true,deck:deck(a)},{name:"B",ai:true,deck:deck(b)}]});
  let g=0;while(!s.over&&g++<40000&&s.round<=40){let moved=false;for(const pid of[0,1]){const x=AI.choose(s,pid);if(!x)continue;const r=E.act(s,pid,x);if(!r.ok&&s.phase==="battle"&&s.prio===pid)E.act(s,pid,{type:"pass"});moved=true;break}
    if(!moved){const pr=s.pend[0];if(pr){const x=AI.choose(s,pr.pid);if(x)E.act(s,pr.pid,x);else s.pend.shift()}else break}}
  return{over:s.over,winner:s.winner,round:s.round}}
const a=load(false),b=load(true);let diff=0,stuck=0,err=0;
for(let i=0;i<30;i++){const seed=5000+i*31,x=i%5,y=(i*2+1)%5;let r1,r2;
  try{r1=play(a,seed,x,y);r2=play(b,seed,x,y)}catch(e){err++;console.log("error game",i,e.message);continue}
  if(!r1.over||!r2.over)stuck++;if(JSON.stringify(r1)!==JSON.stringify(r2))diff++}
console.log(`games 30 · errors ${err} · stuck ${stuck} · differ ${diff}`);process.exit(err||stuck||diff?1:0);
