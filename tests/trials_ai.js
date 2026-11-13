/* AI-only Trials harness (Trials Plan B+C, Task 7). Runs Trial 1 with every party played by the AI at P = 2, 3, 4.
   Asserts: the AI's evaluation is team-aware, 0 errors, 0 stuck games (no legal move, or 80,000 steps without an end). Games are capped at 30 rounds;
   a game still going at the cap is reported as unfinished (a slow game, not a stuck one) and every other game must end with s.over.
   Prints win %, average rounds and Raging Stampedes per game for each party count. Run: node tests/trials_ai.js [--n 30] */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","trials-data.js","play-engine.js","play-trials.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);
const E=ctx.CQE,AI=ctx.CQAI,T=ctx.CQT;
const ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");
const ST=vm.runInNewContext("("+ui.match(/const STARTERS=(\[[\s\S]*?\]);/)[1]+")"),SL=vm.runInNewContext("("+ui.match(/const STARTER_LISTS=(\[[\s\S]*?\]);\nfunction starterDeck/)[1]+")");
const PARTIES=T.trialsStarters(ST,SL);
const N=+(process.argv[process.argv.indexOf("--n")+1]||0)||(process.argv.includes("--n")?30:10);
let fails=[];const ok=(v,m)=>{if(!v)fails.push(m)};
/* starter parties: 2 Heroes, 50+ legal cards */
ok(PARTIES.length===5,"five Trials starter parties");PARTIES.forEach(p=>{ok(p.heroes.length===2,p.name+": 2 Heroes");const bad=E.validateDeck(p,{trials:true});ok(!bad.length,p.name+": "+bad.join("; "))});
/* team-aware evaluation: hurting an ally lowers your score, hurting the boss raises it */
{const s=E.newGame({seed:3,trials:{trial:1,parties:[PARTIES[0],PARTIES[1]]}});s.phase="battle";s.round=1;const v0=AI.evaluate(s,0);
  const c=E.clone(s);E.damage(c,null,c.p[1].heroes[0],3,{ignoreDef:true});ok(AI.evaluate(c,0)<v0,"damaging an allied party lowers the evaluation");
  const c2=E.clone(s);E.damage(c2,null,c2.p[2].heroes[0],3,{ignoreDef:true});ok(AI.evaluate(c2,0)>v0,"damaging the boss raises the evaluation");
  const c3=E.clone(s);E.destroyObj(c3,c3.p[2].bf.find(o=>o.spawn));ok(AI.evaluate(c3,0)>v0,"killing a Golem raises the evaluation")}
function play(seed,P,g){const parties=Array.from({length:P},(_,i)=>Object.assign({},PARTIES[(g+i)%PARTIES.length]));
  const s=E.newGame({seed,trials:{trial:1,parties:parties.map((d,i)=>({name:i?`Helper ${i}`:"Party",ai:true,deck:d}))}});
  let n=0,stuck=false;while(!s.over&&n++<80000&&s.round<=30){let moved=false;
    for(let pid=0;pid<P;pid++){const x=AI.choose(s,pid);if(!x)continue;const r=E.act(s,pid,x);if(!r.ok&&s.phase==="battle"&&s.prio===pid)E.act(s,pid,{type:"pass"});moved=true;break}
    if(!moved){const pr=s.pend[0];if(pr){const x=AI.choose(s,pr.pid);if(x)E.act(s,pr.pid,x);else{stuck=true;break}}else{stuck=true;break}}}
  if(n>=80000)stuck=true;
  return{over:s.over,win:s.over&&s.winner===0,round:s.round,stamp:s.trials.stampedes||0,stuck,err:s.log.some(l=>/Engine error/.test(l.m))}}
const t0=Date.now();const rows=[];let err=0,stuck=0,notOver=0;
for(const P of[2,3,4]){let w=0,r=0,st=0;for(let g=0;g<N;g++){let x;try{x=play(9000+P*1000+g*13,P,g)}catch(e){err++;console.log("error",P,g,e.message);continue}
    if(x.err)err++;if(x.stuck)stuck++;if(!x.over)notOver++;if(x.win)w++;r+=x.round;st+=x.stamp}
  rows.push({P,games:N,win:(100*w/N).toFixed(0)+"%",rounds:(r/N).toFixed(1),stampedes:(st/N).toFixed(2)})}
rows.forEach(x=>console.log(`P=${x.P}: ${x.games} games · win ${x.win} · avg rounds ${x.rounds} · Stampedes/game ${x.stampedes}`));
ok(!err,`${err} errors`);ok(!stuck,`${stuck} stuck games`);if(notOver)console.log(`${notOver} game(s) still going at the 30-round cap (slow, not stuck)`);
console.log(`${fails.length?"FAIL":"PASS"} trials_ai (${((Date.now()-t0)/1000).toFixed(0)}s)`);fails.forEach(f=>console.log(" - "+f));process.exit(fails.length?1:0);
