/* Game logs (Nov 24): a game rebuilt from its seed, decks and the list of successful top-level actions must end in the
   same state and the same log. Mirrors play-ui's recorder (only ok results are kept). Run: node tests/replay_determinism.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE,AI=ctx.CQAI,ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");
const ST=vm.runInNewContext("("+ui.match(/const STARTERS=(\[[\s\S]*?\]);/)[1]+")"),SL=vm.runInNewContext("("+ui.match(/const STARTER_LISTS=(\[[\s\S]*?\]);\nfunction starterDeck/)[1]+")");
const deck=i=>({name:ST[i].name,heroes:ST[i].heroes.map(n=>"h:"+n),cards:Object.assign({},SL[i])});
const clone=x=>JSON.parse(JSON.stringify(x));
function play(seed,a,b){const setup={seed,players:[{name:"A",ai:true,deck:deck(a)},{name:"B",ai:true,deck:deck(b)}]};
  const s=E.newGame(clone(setup)),acts=[];const act=(pid,x)=>{const r=E.act(s,pid,clone(x));if(r.ok)acts.push([pid,clone(x)]);return r};
  let g=0,skipped=false;while(!s.over&&g++<40000&&s.round<=40){let moved=false;for(const pid of[0,1]){const x=AI.choose(s,pid);if(!x)continue;const r=act(pid,x);if(!r.ok&&s.phase==="battle"&&s.prio===pid)act(pid,{type:"pass"});moved=true;break}
    if(!moved){const pr=s.pend[0];if(pr){const x=AI.choose(s,pr.pid);if(x)act(pr.pid,x);else{s.pend.shift();skipped=true}}else break}}
  return{setup,acts,s,skipped}}
let bad=0,n=0,skip=0;
for(let i=0;i<20;i++){const g=play(9000+i*17,i%5,(i*3+1)%5);if(g.skipped){skip++;continue}n++;
  const t=E.newGame(clone(g.setup));let fails=0;for(const[pid,a]of g.acts)if(!E.act(t,pid,clone(a)).ok)fails++;
  const L=x=>JSON.stringify(x.log.map(l=>[l.r,l.p,l.m]));
  if(fails||L(t)!==L(g.s)||t.winner!==g.s.winner||t.round!==g.s.round){bad++;console.log("game",i,"differs: fails",fails,"rounds",g.s.round,t.round)}}
console.log(`replayed ${n} games (${skip} skipped) · mismatches ${bad}`);process.exit(bad||!n?1:0);
