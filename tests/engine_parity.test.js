/* 1-on-1 engine parity gate (Trials Plan B+C, Task 1).
   40 seeded AI-vs-AI games with the starter decks (seeds 7000 + 37*i, decks i%5 vs (i*3+1)%5) must match tests/fixtures/parity-baseline.json:
   {seed, winner, round, logHash} where logHash = SHA-256 of the joined log lines.
   Run: node tests/engine_parity.test.js            (check, exits 0 on 40/40)
        node tests/engine_parity.test.js --record   (rewrite the baseline) */
const fs=require("fs"),vm=require("vm"),path=require("path"),crypto=require("crypto");
const A=path.join(__dirname,"..","assets"),FX=path.join(__dirname,"fixtures","parity-baseline.json");
function load(){const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
  const files=["cards-data.js","trials-data.js","play-engine.js",...(fs.existsSync(path.join(A,"play-trials.js"))?["play-trials.js"]:[]),"play-cards.js","play-ai.js"];
  vm.runInContext(files.map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n"),ctx);return ctx}
const ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");
const ST=vm.runInNewContext("("+ui.match(/const STARTERS=(\[[\s\S]*?\]);/)[1]+")"),SL=vm.runInNewContext("("+ui.match(/const STARTER_LISTS=(\[[\s\S]*?\]);\nfunction starterDeck/)[1]+")");
const deck=i=>({name:ST[i].name,heroes:ST[i].heroes.map(n=>"h:"+n),cards:Object.assign({},SL[i])});
function play(ctx,seed,a,b){const E=ctx.CQE,AI=ctx.CQAI;const s=E.newGame({seed,players:[{name:"A",ai:true,deck:deck(a)},{name:"B",ai:true,deck:deck(b)}]});
  let g=0;while(!s.over&&g++<40000&&s.round<=40){let moved=false;for(const pid of[0,1]){const x=AI.choose(s,pid);if(!x)continue;const r=E.act(s,pid,x);if(!r.ok&&s.phase==="battle"&&s.prio===pid)E.act(s,pid,{type:"pass"});moved=true;break}
    if(!moved){const pr=s.pend[0];if(pr){const x=AI.choose(s,pr.pid);if(x)E.act(s,pr.pid,x);else s.pend.shift()}else break}}
  const logHash=crypto.createHash("sha256").update(s.log.map(l=>l.m).join("\n")).digest("hex");
  return{seed,winner:s.winner,round:s.round,logHash}}
const ctx=load();const out=[];
for(let i=0;i<40;i++){const seed=7000+37*i;try{out.push(play(ctx,seed,i%5,(i*3+1)%5))}catch(e){out.push({seed,error:e.message})}}
if(process.argv.includes("--record")){fs.mkdirSync(path.dirname(FX),{recursive:true});fs.writeFileSync(FX,JSON.stringify(out,null,1)+"\n");console.log(`recorded ${out.length} games to ${path.relative(process.cwd(),FX)}`);process.exit(out.some(r=>r.error)?1:0)}
const base=JSON.parse(fs.readFileSync(FX,"utf8"));let ok=0;const bad=[];
out.forEach((r,i)=>{const b=base[i];if(b&&!r.error&&b.seed===r.seed&&b.winner===r.winner&&b.round===r.round&&b.logHash===r.logHash)ok++;else bad.push({i,got:r,want:b})});
bad.slice(0,5).forEach(x=>console.log("DIFF game",x.i,JSON.stringify(x.got),"want",JSON.stringify(x.want)));
console.log(`${bad.length?"FAIL":"PASS"} engine parity ${ok}/${out.length}`);process.exit(bad.length?1:0);
