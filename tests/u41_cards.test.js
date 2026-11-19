/* Update 41 (Nov 19, 2026): Snuff Out hits Constructs, Feather of Zaawa, Xakro's War Horn Legendary, three deprecations,
   the Songweaver/Echo Performer saved-deck swap and the "can't challenge yourself" presence check. Run: node tests/u41_cards.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={console,Math,Date,JSON};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(["cards-data.js","play-engine.js","play-cards.js","play-ai.js"].map(f=>fs.readFileSync(path.join(A,f),"utf8")).join("\n;\n")+"\n;this.DEP=DEPRECATED_CARDS;this.RAW_CARDS=RAW_CARDS;this.REN=CARD_RENAMES;",ctx);
const E=ctx.CQE,D=E.DB;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const filler=Object.fromEntries(["Potion","Antidote","Smoke Bomb","Revitalize","Dynamite","Precognition","Humble","Vandalize","Naturalize","Shatter","Inspiration","Snuff Out","Level Up"].map(n=>[n,3]));
let U=1;const uid=()=>"x"+(U++);
function game(h0,h1){const s=E.newGame({seed:11,players:[{name:"A",deck:{name:"A",heroes:h0.map(h=>"h:"+h),cards:filler}},{name:"B",deck:{name:"B",heroes:(h1||["Divine Knight","Arcane Scholar","Savage Raider"]).map(h=>"h:"+h),cards:filler}}]});
  E.act(s,0,{type:"keep"});E.act(s,1,{type:"keep"});E.act(s,0,{type:"dawnDone"});E.act(s,1,{type:"dawnDone"});s.p.forEach(p=>{p.aura=12;p.inv=[];p.hand=[]});s.prio=0;s.passed=[false,false];return s}
const hand=(s,pid,id)=>{const c={uid:uid(),id,owner:pid};s.p[pid].hand.push(c);return c};
/* data */
const row=n=>ctx.RAW_CARDS.find(r=>r[1]===n);
ok(/summon or Construct with 3 or less HP/.test(row("Snuff Out")[7])&&row("Snuff Out")[8]===2,"Snuff Out text and v2");
ok(row("Feather of Zaawa")&&!row("Phoenix Down")&&ctx.REN["Phoenix Down"]==="Feather of Zaawa"&&row("Feather of Zaawa")[3]==="Legendary"&&row("Feather of Zaawa")[5]==="Consumable","Phoenix Down is now Feather of Zaawa");
ok(row("Xakro's War Horn")[3]==="Legendary"&&row("Xakro's War Horn")[0]===1&&row("Xakro's War Horn")[8]===3,"Xakro's War Horn is Legendary (1 copy, v3)");
["Disarm","Ice Bath","Pitfall"].forEach(n=>ok(!row(n)&&ctx.DEP.some(r=>r[1]===n)&&D[n]&&D[n].dep,n+" is deprecated (kept in the engine DB)"));
/* every Legendary card has art (the legendary gem is baked into each image) */
const ak=n=>n.replace(/[^A-Za-z0-9]/g,"_");
ctx.RAW_CARDS.filter(r=>r[3]==="Legendary").forEach(r=>ok(fs.existsSync(path.join(A,"art","card",ak(r[1])+"-face.webp")),r[1]+" has card art"));
/* Snuff Out: summons and Constructs (including a Hero Construct) with 3 or less HP; never a normal Hero */
{const s=game(["Rage Brute","Savage Raider","Fury Titan"]);const c=hand(s,0,"Snuff Out");
 const w=E.makeSummon(s,1,"Wolf",true);const k=E.makeConstruct(s,1,2);const big=E.makeConstruct(s,1,5);
 const hc=E.makeHeroConstruct(s,1,{uid:uid(),id:"Remey Recipe",owner:1},{name:"Remey the Incredible"});hc.dmg=E.maxHp(s,hc)-3;
 const h=s.p[1].heroes[0];h.dmg=E.maxHp(s,h)-1;
 const sp=E.need(s,0,{type:"play",uid:c.uid});const cands=(sp&&sp[0]&&sp[0].cands)||[];
 ok(cands.includes(w.uid),"Snuff Out can target a 3 HP summon");ok(cands.includes(k.uid),"Snuff Out can target a 2 HP Construct");
 ok(!cands.includes(big.uid),"not a 5 HP Construct");ok(cands.includes(hc.uid),"Snuff Out can target a Hero Construct at 3 HP");ok(!cands.includes(h.uid),"Snuff Out can't target a normal Hero");
 E.act(s,0,{type:"play",uid:c.uid,targets:[hc.uid]});let g=0;while(s.pend.length&&g++<30){const pr=s.pend[0];const a=ctx.CQAI.choose(s,pr.pid);if(!a)break;E.act(s,pr.pid,a)}
 ok(hc.dead||!s.p[1].heroes.includes(hc),"Snuff Out destroys the Hero Construct")}
/* Feather of Zaawa still revives */
{const s=game(["Rage Brute","Savage Raider","Fury Titan"]);const h=s.p[0].heroes[1];h.dead=true;h.dmg=E.maxHp(s,h);
 const c=hand(s,0,"Feather of Zaawa");ok(D["Feather of Zaawa"].sub==="Consumable","Feather of Zaawa is Consumable")}
/* saved-deck Bard swap (assets/app.js fixBardSwap) */
{const src=fs.readFileSync(path.join(A,"app.js"),"utf8");const m=/const BARD_SWAP_CUTOFF=[^\n]*\n(function fixBardSwap[\s\S]*?return true\})/.exec(src);ok(m,"fixBardSwap found");
 const f=new Function(src.match(/const BARD_SWAP_CUTOFF=[^;]*;/)[0]+m[1]+";return fixBardSwap")();const cut=Date.parse("2026-11-19T05:48:00Z");
 const old={heroes:["h:Songweaver","h:Sun Paladin","h:Echo Performer"],updated:cut-1000};ok(f(old)&&old.heroes.join()==="h:Echo Performer,h:Sun Paladin,h:Songweaver"&&old.updated>cut,"an old deck swaps both Bards");
 ok(!f(old)&&old.heroes[0]==="h:Echo Performer","and only once");
 const nw={heroes:["h:Songweaver"],updated:cut+5000};ok(!f(nw)&&nw.heroes[0]==="h:Songweaver","a deck saved after the swap is left alone");
 const none={heroes:["h:Sun Paladin"],updated:0};ok(!f(none)&&none.updated===0,"a deck without either Bard is untouched")}
/* presence: you never see or challenge yourself, even after signing in */
{let st={},bc={},tracked=null;const ch={track:x=>{tracked=x},presenceState:()=>st,on:(t,o,f)=>{if(t==="broadcast")bc[o.event]=f;return ch},subscribe:f=>{f("SUBSCRIBED");return ch},send:()=>{}};
 const store={};const w={localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}},SB:{channel:()=>ch},S:{uid:""},document:{getElementById:()=>({hidden:true,textContent:""})},setInterval:()=>0,console};
 w.window=w;vm.createContext(w);vm.runInContext("var SB=window.SB,S=window.S;"+fs.readFileSync(path.join(A,"online.js"),"utf8"),w);
 const O=w.CQOnline,gid=store["cq.gid"];ok(O&&gid,"online.js loads");w.S.uid="user-1";
 st={[gid]:[{n:"Me",u:"user-1"}],"user-1":[{n:"Me (phone)",u:"user-1"}],"user-2":[{n:"Rival",u:"user-2"}],"g-x":[{n:"Guest",u:""}]};
 const L=O.list().map(p=>p.key);ok(L.join()==="g-x,user-2","the list hides this tab and the same account elsewhere ("+L.join()+")");
 ok(O.isMe(gid)&&O.isMe("user-1")&&!O.isMe("user-2"),"isMe covers the guest id and the account id");
 let got=null;O.on("challenge",p=>{got=p});bc.challenge({payload:{to:"user-1",from:"user-2",code:"AB12"}});ok(got&&got.code==="AB12","a challenge to the account id reaches a tab that opened as a guest");
 got=null;bc.challenge({payload:{to:gid,from:"user-1",code:"ZZ"}});ok(!got,"a challenge from yourself is ignored")}
console.log(`Update 41 cards: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
