/* Learn to Play (New Player Tutorial, proposal mock-up Nov 11, 2026; not pushed).
   #learn: five explainer screens -> "What do you like to do?" (Barbarian / Druid / Mage) -> a coached game vs the AI in the Play tab
   -> "Keep the deck you just played?" -> sign up (or sign in) -> the deck lands in My Decks and opens in the Deck Builder.
   The coach reads the live game state on every render (play-ui.js calls CQTut.after), so it never blocks a move: if the player
   does something else, the next prompt simply follows the new state. Text follows the Quick Start guide; it adds no rules. */
(function(){
"use strict";
const PENDING="cq.tut.pending",SEEN="cq.tut.seen";
const ls={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- the three tutorial decks (legal 50-card decks, one class each) ---------- */
const DECKS={
  barbarian:{name:"My First Barbarian Deck",heroes:["h:Skullcrusher","h:Savage Raider","h:Fury Titan"],
    cards:{"Pump":3,"Blunt Force":3,"Bloodthirst":3,"Bind":3,"Unstoppable":3,"Battered":3,"Bruised":3,"Beat Down":3,"Run It Back":2,"Great Axe":3,"Sword of Riverstead":3,"Dagger of Riverstead":2,"Chest Plate of Riverstead":3,"Potion":3,"Level Up":2,"Silver Bar":2,"Inspiration":2,"Awestruck":2,"Pummel":2},
    hand:["Pump","Great Axe","Potion","Blunt Force"],top:["Bloodthirst","Bind","Unstoppable"]},
  druid:{name:"My First Druid Deck",heroes:["h:Warden of the Woods","h:Rootbinder","h:Wild Shifter"],
    cards:{"Elk":3,"Wolves":3,"Beast":3,"Tooth":3,"Spore Calling":3,"Heartwood Seed":3,"Rootfolk":3,"Nature's Choice":3,"Shillelagh":3,"Horn":2,"Tooth or Horn":2,"Heavy Beast":2,"Lesser Elemental":2,"Barkskin Totem":2,"Antler Crown":2,"Potion":3,"Chest Plate of Riverstead":2,"Inspiration":2,"Return to the Earth":2,"Bloom":2},
    hand:["Elk","Spore Calling","Shillelagh","Tooth"],top:["Wolves","Elk","Beast"]},
  mage:{name:"My First Mage Deck",heroes:["h:Ember Mage","h:Storm Caller","h:Arcane Scholar"],
    cards:{"Lightning Bolt":3,"Flame Jab":3,"Ice Jab":3,"Flame Lance":3,"Ice Lance":3,"Arcane Study":3,"Frostbite":3,"Spark":3,"Heat Wave":2,"Ice Ray":2,"Levitate":2,"Volt Jab":3,"Boost Ritual":2,"Apprentice's Wand":3,"Ring of Power":2,"Potion":3,"Inspiration":3,"Chest Plate of Riverstead":2,"Precognition":2},
    hand:["Lightning Bolt","Apprentice's Wand","Ice Jab","Arcane Study"],top:["Flame Jab","Frostbite","Spark"]}};
const STYLES=[
  {k:"barbarian",btn:"ATTACK!",cls:"Barbarian",hero:"Skullcrusher",line:"Pump your Strength and hit hard. Simple, fast and loud."},
  {k:"druid",btn:"Lead a Herd",cls:"Druid",hero:"Warden of the Woods",line:"Summon beasts and let them fight for you."},
  {k:"mage",btn:"Cast Spells",cls:"Mage",hero:"Ember Mage",line:"Blast enemies from a distance with fire, ice and lightning."}];
const OPP=3; /* AI plays the Grand Stage starter (the friendliest matchup for all three tutorial decks in AI-vs-AI sims) */

/* Coached card tips: shown when the card is playable for the acting Hero, in this order. */
const TIPS={
  barbarian:[
    {id:"Pump",t:a=>`Play <b>Pump</b>: drag it from your hand up onto the board (or click it), then pick ${esc(a.name)}. It gets +2 Strength this turn, so its next attack hits harder.`,once:true},
    {id:"Great Axe",t:a=>`Equip the <b>Great Axe</b> on ${esc(a.name)}: +3 Strength. Equipment stays on the Hero for the whole game.`},
    {id:"Bloodthirst",t:()=>`<b>Bloodthirst</b> attacks with this Hero. If the enemy dies, your Hero readies and can act again.`,when:"low"},
    {id:"Blunt Force",t:()=>`<b>Blunt Force</b> gives a Barbarian +4 Strength this turn. Play it, then attack.`,once:true}],
  druid:[
    {id:"Spore Calling",t:()=>`<b>Spore Calling</b> costs 0 Aura: it summons a 0/2 Spore and draws you a card. Free cards are always worth playing.`},
    {id:"Elk",t:()=>`Play <b>Elk</b> (1 Aura). It summons a 2/3 Elk: 2 Strength and 3 Health Points. Summons fight for you. The card says “Exhaust this Hero,” so this Hero is done for the round.`},
    {id:"Shillelagh",t:a=>`Equip the <b>Shillelagh</b> on ${esc(a.name)} (1 Aura). Equipment stays on the Hero for the whole game.`},
    {id:"Tooth",t:()=>`<b>Tooth</b> gives all your summons +1 Strength this turn. Play it before your summons attack.`,when:"summonReady"},
    {id:"Wolves",t:()=>`<b>Wolves</b> summons two 2/2 Wolves. More summons, more attacks.`}],
  mage:[
    {id:"Lightning Bolt",t:()=>`Play <b>Lightning Bolt</b> (1 Aura): 3 Lightning damage to an enemy Hero. Spells don't use your Strength, which is why Mages have 0.`},
    {id:"Apprentice's Wand",t:a=>`Equip the <b>Apprentice's Wand</b> on ${esc(a.name)}: +1 Spell Damage, so every damage Spell this Hero casts hits 1 harder.`},
    {id:"Ice Jab",t:()=>`<b>Ice Jab</b> deals 3 Ice damage and Stuns the target. A Stunned Hero can't play cards or use abilities.`},
    {id:"Flame Jab",t:()=>`<b>Flame Jab</b> deals 3 Fire damage and Burns the target: it takes 1 more damage at each Dawn.`},
    {id:"Arcane Study",t:()=>`<b>Arcane Study</b> draws a card and lets you Scry 2 (look at your top 2 cards and choose which go to the bottom).`}]};

/* ---------- styles ---------- */
const css=`
.tut{max-width:980px;margin:0 auto;padding:8px 0 40px}
.tut-dots{display:flex;gap:6px;justify-content:center;margin:6px 0 14px}
.tut-dots i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.18)}.tut-dots i.on{background:#ffc100}
.tut-screen{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:28px;align-items:center;background:linear-gradient(#2b1f15,#1b130c);border:2px solid #b8743a;border-radius:16px;padding:26px 28px;color:#f3e6cf;min-height:360px}
.tut-screen>div>h1{font-family:"Pirata One",var(--display);font-weight:400;color:#ffc100;font-size:2.3rem;margin:0 0 10px;line-height:1.05}
.tut-screen>div>p{font-size:1.08rem;line-height:1.5;margin:0 0 10px;color:#ead9bb}
.tut-pic{display:flex;gap:10px;justify-content:center;align-items:flex-end;flex-wrap:wrap}
.tut-pic .card{width:150px;margin:0}.tut-pic .card .zoom,.tut-pic .card .c-ctrl,.tut-pic .card .flip{display:none!important}
.tut-pic.two .card{width:175px}.tut-pic.one .card{width:220px}
.tut-vs{font:400 2rem/1 "Pirata One",var(--display);color:#ffc100;align-self:center;padding:0 4px}
.tut-stats{display:grid;gap:8px;margin:6px 0 14px}
.tut-stats div{display:flex;gap:10px;align-items:baseline}.tut-stats b{min-width:118px}
.k-str{color:#ff6b57}.k-def{color:#7fb2ff}.k-aura{color:#5cc8ff}.k-hp{color:#7be07b}.k-gold{color:#ffc100}
.tut-res{display:flex;gap:14px;justify-content:center}
.tut-res div{width:150px;border-radius:14px;padding:16px 12px;text-align:center;border:2px solid #3E7BFA;background:#0b1640}
.tut-res div.g{border-color:#d4a017;background:#2a1d05}.tut-res b{display:block;font:400 2.4rem/1 "Pirata One",var(--display)}
.tut-res span{font-size:.9rem;color:#d8c3a0}
.tut-phases{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.tut-phases div{border:1.5px solid #8A5E40;border-radius:10px;padding:10px 8px;text-align:center;background:rgba(0,0,0,.25)}
.tut-phases b{display:block;font:400 1.3rem/1.1 "Pirata One",var(--display);color:#ffc100;margin-bottom:4px}.tut-phases span{font-size:.82rem;color:#d8c3a0}
.tut-nav{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:14px}
.tut-nav .btn{min-width:120px}
.tut-pick{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:6px}
.tut-style{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;border-radius:16px;padding:20px 16px 18px;background:linear-gradient(#2b1f15,#1b130c);border:2px solid #8A5E40;color:#f3e6cf;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}
.tut-style:hover,.tut-style:focus-visible{transform:translateY(-4px);border-color:#ffc100;box-shadow:0 10px 30px rgba(0,0,0,.5),0 0 0 2px rgba(255,193,0,.35)}
.tut-style img{width:132px;height:132px;image-rendering:pixelated;border-radius:50%;background:radial-gradient(#4a3324,#1b130c);border:2px solid #b8743a}
.tut-style b{font:400 2rem/1 "Pirata One",var(--display);color:#ffc100}
.tut-style em{font-style:normal;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:#c99566}
.tut-style span{font-size:.98rem;line-height:1.4;color:#ead9bb}
.tut-h1{font-family:"Pirata One",var(--display);font-weight:400;color:#ffc100;text-align:center;font-size:2.6rem;margin:4px 0 4px}
.tut-sub{text-align:center;color:#d8c3a0;margin:0 0 14px}
.tut-other{text-align:center;margin-top:14px}.tut-other a{color:#d8c3a0}
#tut-coach{position:fixed;right:16px;bottom:16px;z-index:70;width:min(480px,calc(100vw - 32px));max-height:calc(100vh - 120px);overflow:auto;background:linear-gradient(#2e2216,#1b130c);border:3px solid #ffc100;border-radius:16px;padding:14px 18px 16px;color:#f3e6cf;box-shadow:0 18px 50px rgba(0,0,0,.7);font-size:1.08rem;line-height:1.5}
#tut-coach.min{width:auto;padding:8px 10px}
#tut-coach .tc-who{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font:600 .7rem/1 var(--body);letter-spacing:.12em;text-transform:uppercase;color:#c99566;margin-bottom:6px}
#tut-coach .tc-who img{width:40px;height:40px;image-rendering:pixelated;border-radius:50%;border:1.5px solid #b8743a;background:#1b130c}
#tut-coach .tc-who .tc-r{color:#8f7354}#tut-coach .tc-who .tc-acts{margin:0 0 0 auto}
#tut-coach .tc-msg b{color:#ffd98a}
#tut-coach .tc-opp{font-size:.9rem;line-height:1.35;color:#e9c9a8;background:rgba(192,57,43,.16);border-left:3px solid #C0392B;border-radius:6px;padding:6px 10px;margin:0 0 10px}#tut-coach .tc-opp b{color:#ffb4a6}
#tut-coach .tc-acts button.leave{background:#ffc100;border-color:#ffc100;color:#2A1606}
#tut-coach .tc-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
#tut-coach .tc-acts button{font:600 .78rem/1 var(--body);border-radius:8px;padding:7px 10px;border:1px solid #8A5E40;background:#4a2a20;color:#f3e6cf;cursor:pointer}
#tut-coach .tc-acts button.go{background:#ffc100;border-color:#ffc100;color:#2A1606}
#tut-coach .tc-acts button:hover{filter:brightness(1.12)}
.tut-ring{position:fixed;z-index:66;pointer-events:none;border:8px solid #ffc100;border-radius:16px;box-shadow:0 0 0 4px rgba(20,10,4,.85),inset 0 0 0 4px rgba(20,10,4,.85),0 0 30px 8px rgba(255,193,0,.5);animation:tutPulse 1.1s ease-in-out infinite}
@keyframes tutPulse{50%{border-color:#ffe37a;box-shadow:0 0 0 4px rgba(20,10,4,.85),inset 0 0 0 4px rgba(20,10,4,.85),0 0 40px 14px rgba(255,193,0,.65)}}
.tut-mag{position:relative;width:100%;max-width:440px;height:330px;margin:0 auto}
.tut-mag .tm-card{position:absolute;left:0;top:0;width:220px}.tut-mag .tm-card .card,.tut-mag .tm-in .card{width:220px;margin:0}
.tut-mag .card .zoom,.tut-mag .card .c-ctrl,.tut-mag .card .flip{display:none!important}
.tut-mag .tm-lens{position:absolute;right:0;top:60px;width:180px;height:180px;border-radius:50%;overflow:hidden;border:6px solid #ffc100;box-shadow:0 0 0 4px #1b130c,0 12px 30px rgba(0,0,0,.6);background:#120a07}
.tut-mag .tm-in{position:absolute;left:0;top:0;width:220px;transform-origin:0 0;transition:transform .3s ease}
.tut-mag svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.tut-mag .tm-dot{transition:all .3s ease}
.tut-stats div{cursor:default;border-radius:6px;padding:2px 6px;margin:0 -6px}.tut-stats div.on{background:rgba(255,193,0,.12)}
.tut-end .box{max-width:560px;text-align:center}
.tut-end h2{font-family:"Pirata One",var(--display);font-weight:400;color:#ffc100;font-size:2.2rem;margin:0 0 6px}
.tut-end .tut-deckrow{display:flex;gap:8px;justify-content:center;margin:12px 0}
.tut-end .tut-deckrow img{width:64px;height:64px;image-rendering:pixelated;border-radius:50%;border:2px solid #b8743a;background:#1b130c}
.tut-end .actions{justify-content:center;flex-wrap:wrap}
.tut-note{border:1.5px solid #ffc100;background:rgba(255,193,0,.08);border-radius:12px;padding:10px 14px;margin:0 0 14px}
@media (max-width:760px){.tut-screen{grid-template-columns:1fr;padding:18px}.tut-pick{grid-template-columns:1fr}.tut-pic .card{width:96px}.tut-pic.one .card{width:170px}.tut-phases{grid-template-columns:repeat(2,1fr)}}
@media (prefers-reduced-motion:reduce){.tut-ring{animation:none}.tut-style{transition:none}}`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

/* ---------- helpers from the site (global scope in app.js / play-ui.js) ---------- */
const E=()=>window.CQE,P=()=>window.CQPlay;
const card=id=>(typeof BYID!=="undefined"&&BYID.get(id))||null;
const cardH=id=>{const c=card(id);return c&&typeof cardHTML==="function"?cardHTML(c,{nozoom:1}):""};
const head=name=>typeof ICON_BASE!=="undefined"&&typeof artKey==="function"?`${ICON_BASE}art/hero-head/${artKey(name)}.png?v=${typeof ART_VER!=="undefined"?ART_VER:""}`:"";

/* ---------- #learn: explainer screens + style pick ---------- */
const T={step:0,cls:null,seen:{},hint:null,hidden:false,ended:false};
const SCREENS=[
  ()=>({h:"Welcome to Crystal Quest",p:[`You lead a party of <b>three Heroes</b>. Defeat all of your opponent's Heroes to win.`,`This takes about 15 minutes: a few quick screens, then a real game with a coach at your side.`],
    pic:`<div class="tut-pic">${cardH("h:Skullcrusher")}<span class="tut-vs">vs</span>${cardH("h:Ember Mage")}</div>`}),
  ()=>({h:"Your Heroes",p:[`Every Hero has four stats:`,`<div class="tut-stats"><div data-stat="str"><b class="k-str">Strength</b>attack damage</div><div data-stat="def"><b class="k-def">Defense</b>damage it ignores when hit</div><div data-stat="aura"><b class="k-aura">Aura</b>adds to your Aura each round</div><div data-stat="hp"><b class="k-hp">Health Points</b>at 0 it dies</div></div><p class="tm-tip" style="font-size:.9rem;color:#c99566;margin:-6px 0 10px">Point at a stat to see it on the card.</p>`,`Left to right your Heroes are your <b>Lead</b>, <b>Center</b> and <b>Closer</b>. That order decides who acts first.`],
    pic:`<div class="tut-mag" data-stat="str"><div class="tm-card">${cardH("h:Savage Raider")}</div><svg aria-hidden="true"><defs><marker id="tmArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ffc100"/></marker></defs><circle class="tm-dot" r="20" fill="none" stroke="#ffc100" stroke-width="5"/><path class="tm-arr" fill="none" stroke="#ffc100" stroke-width="5" stroke-linecap="round" marker-end="url(#tmArrow)"/></svg><div class="tm-lens"><div class="tm-in">${cardH("h:Savage Raider")}</div></div></div>`}),
  ()=>({h:"Aura and Gold",p:[`<b class="k-aura">Aura</b> pays for cards. It refills every Dawn, and whatever you don't spend is lost at Dusk, so spend it.`,`<b class="k-gold">Gold</b> is earned at Dusk, 1 for each living Hero. Gold carries over from turn to turn, and you can spend it in Town.`],
    pic:`<div class="tut-res"><div><b class="k-aura">5</b><span>Aura: spend it every round</span></div><div class="g"><b class="k-gold">3</b><span>Gold: carries over, spend it in Town</span></div></div>`}),
  ()=>({h:"A round",p:[`Every round has four phases, and both players go through them together.`,`In <b>Battle</b>, your Heroes take turns in party order. Each turn one Hero takes one action: <b>play a card</b>, <b>attack</b>, <b>level up</b> or <b>use an ability</b>. Attacking or leveling up exhausts the Hero until the next Dawn.`],
    pic:`<div class="tut-phases"><div><b>Dawn</b><span>Ready up, refill Aura, draw</span></div><div><b>Battle</b><span>Take turns acting</span></div><div><b>Dusk</b><span>Lose Aura, earn Gold</span></div><div><b>Town</b><span>Heal, shop, upgrade</span></div></div>`}),
  ()=>({h:"Your cards",p:[`A Hero can play cards of <b>its own class</b> and <b>Generic</b> cards. Your deck for this game uses one class, so every Hero can play every card.`,`Cards explain their keywords in <i>(italics)</i>. If a card ever disagrees with the rules, the card wins.`],
    pic:`<div class="tut-pic two">${cardH("Lightning Bolt")}${cardH("Potion")}</div>`})];
function learnHTML(){
  if(T.step<SCREENS.length){const sc=SCREENS[T.step]();
    return`<div class="tut"><div class="tut-dots" aria-hidden="true">${SCREENS.map((_,i)=>`<i class="${i===T.step?"on":""}"></i>`).join("")}<i></i></div>
    <section class="tut-screen" aria-live="polite"><div><h1>${sc.h}</h1>${sc.p.map(x=>x.startsWith("<div")?x:`<p>${x}</p>`).join("")}</div>${sc.pic}</section>
    <div class="tut-nav"><button class="btn" type="button" data-tut="back" ${T.step?"":"disabled"}>Back</button><button class="btn" type="button" data-tut="skip">Skip to the game</button><button class="btn primary" type="button" data-tut="next">${T.step===SCREENS.length-1?"Choose your deck":"Next"}</button></div></div>`}
  return`<div class="tut"><div class="tut-dots" aria-hidden="true">${SCREENS.map(()=>"<i></i>").join("")}<i class="on"></i></div>
    <h1 class="tut-h1">What do you like to do?</h1><p class="tut-sub">Pick one. You'll play a coached game with that deck, and you can keep it afterwards.</p>
    <div class="tut-pick">${STYLES.map(x=>`<button type="button" class="tut-style" data-tut="pick" data-v="${x.k}"><img src="${esc(head(x.hero))}" alt=""><b>${esc(x.btn)}</b><em>${esc(x.cls)}</em><span>${esc(x.line)}</span></button>`).join("")}</div>
    <p class="tut-other"><a href="#play">Show me the other classes</a> (opens the Play tab with the starter decks)</p>
    <div class="tut-nav"><button class="btn" type="button" data-tut="back">Back</button><span></span><span></span></div></div>`}
const fit=el=>{try{if(typeof fitArt==="function")fitArt(el)}catch(e){}};
function mount(el){ls.set(SEEN,1);el.innerHTML=learnHTML();fit(el);mag()}
function rerender(){const v=document.getElementById("view");if(v&&location.hash==="#learn"){v.innerHTML=learnHTML();fit(v);mag()}}
/* Your Heroes: a magnifying lens shows the stat, with an arrow to where it sits on the card (point at a stat in the list to move it) */
const STAT_AT={str:[.245,.55],hp:[.49,.505],def:[.74,.545],aura:[.885,.085]};
function mag(k){const box=document.querySelector(".tut-mag");if(!box)return;k=k||box.dataset.stat||"str";box.dataset.stat=k;
  const at=STAT_AT[k],W=220,H=W*1125/825,z=2.6,L=180,bw=box.clientWidth,lx=bw-L,ly=60;
  const inner=box.querySelector(".tm-in");if(inner)inner.style.transform=`translate(${L/2-6-at[0]*W*z}px,${L/2-6-at[1]*H*z}px) scale(${z})`;
  const px=at[0]*W,py=at[1]*H,dot=box.querySelector(".tm-dot"),arr=box.querySelector(".tm-arr");
  if(dot){dot.setAttribute("cx",px);dot.setAttribute("cy",py)}
  const sx=lx-4,sy=ly+L/2,dx=px-sx,dy=py-sy,dl=Math.hypot(dx,dy)||1,ex=px-dx/dl*30,ey=py-dy/dl*30,cx=(sx+ex)/2,cy=Math.min(sy,ey)-40;
  if(arr)arr.setAttribute("d",`M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}`);
  document.querySelectorAll(".tut-stats [data-stat]").forEach(d=>d.classList.toggle("on",d.dataset.stat===k))}
document.addEventListener("mouseover",e=>{const d=e.target.closest&&e.target.closest(".tut-stats [data-stat]");if(d)mag(d.dataset.stat)});
document.addEventListener("focusin",e=>{const d=e.target.closest&&e.target.closest(".tut-stats [data-stat]");if(d)mag(d.dataset.stat)});

/* ---------- starting the coached game ---------- */
function deckOf(k){const d=DECKS[k];return{id:"tutorial:"+k,name:d.name,heroes:d.heroes.slice(),cards:Object.assign({},d.cards)}}
function stack(s,k){const d=DECKS[k],p=s.p[0];const pool=p.hand.concat(p.lib);
  const take=id=>{const i=pool.findIndex(c=>c.id===id);return i<0?null:pool.splice(i,1)[0]};
  const hand=d.hand.map(take).filter(Boolean),top=d.top.map(take).filter(Boolean);
  while(hand.length<p.hand.length&&pool.length)hand.push(pool.shift());
  p.hand=hand;p.lib=top.concat(pool)}
function start(k){const U=P();if(!U||!U.startTutorial){location.hash="play";return}
  T.cls=k;T.seen={};T.hint=null;T.hidden=false;T.ended=false;
  const da=U.snd&&U.snd.starterDeck?U.snd.starterDeck(OPP):null;
  U.startTutorial(deckOf(k),da,s=>stack(s,k));U.tut={cls:k};U.logHidden=true;document.documentElement.classList.add("cq-tut");
  if(location.hash==="#play")U.render();else location.hash="play";
  setTimeout(()=>U.pumpAI(),400)}

/* ---------- the coach (called after every Play tab render) ---------- */
function optsMe(s){try{return E().options(s,0)||[]}catch(e){return[]}}
function q(sel,root){return Array.from((root||document).querySelectorAll(sel))}
function btnsFor(root,match){return q("[data-a]",root).filter(b=>{try{const a=JSON.parse(b.dataset.a);return match(a)}catch(e){return false}})}
function handEl(root,uid){return q(`.pl-hand .hc[data-u="${uid}"]`,root)}
function objEl(root,uid){return q(`[data-pa="obj"][data-u="${uid}"]`,root)}
function nm(s,uid){const f=E().find(s,uid);return f&&f.o?(f.o.name||(E().DB[f.o.id]||{}).name||""):""}
function bestTarget(s,att,fixed){const en=s.p[1].heroes.filter(h=>!h.dead);let best=null;
  for(const h of en){const d=fixed!=null?fixed:Math.max(0,E().str(s,att)-E().defn(s,h)),left=E().hp(s,h)-d;if(!best||left<best.left||(left===best.left&&d>best.d))best={h,d,left}}return best}
/* what the opponent did since your last move, from the game log */
function oppNews(s){const out=[],me=0;for(let i=s.log.length-1;i>=0&&out.length<3;i--){const l=s.log[i];if(l.p===me&&!/ draws? |discards|collects|loses \d+ unspent|keeps/.test(l.m))break;if(l.p!==1)continue;if(/ draws? \d* ?cards?\.$| draws 1 card\.$|collects|loses \d+ unspent|keeps their hand|leaves Town|discards|cards in hand/.test(l.m))continue;out.unshift(l.m)}
  if(!out.length)return"";const who=s.p[1].name;const tidy=m=>esc(String(m).replace(/<[^>]+>/g,"").split(who).join("Your opponent").replace(/\s*\(\d+\/\d+ HP\)/g,""));
  const echo=out.some(m=>/^Echo: |\(Echo\)|Echo/.test(m));
  return`<div class="tc-opp"><b>Opponent:</b> ${out.map(tidy).join(" ")}${echo&&(T.seen.echoAt=T.seen.echoAt||Date.now(),Date.now()-T.seen.echoAt<20000)?` <i>(Echo: an Echo card is played again for free at the next Dawn. Its costs were already paid.)</i>`:""}</div>`}
function coach(s,root){
  const U=P(),k=T.cls||(U.tut&&U.tut.cls)||"barbarian",me=0,r=s.round,opts=optsMe(s);
  const R=(msg,hl,extra)=>({msg,hl:hl||[],extra});
  if(s.over)return null;
  const pend=s.pend&&s.pend[0];
  if(s.phase==="mull"&&!s.p[0].mullDone)return R(`Here's your opening hand of 4 cards. It's a good one, so press <b>Keep</b>. (A mulligan shuffles them back and draws 4 new cards, once.)`,btnsFor(root,a=>a.type==="keep"));
  if(U.tgt){const lab=U.tgt.label||"that",sg=T.suggest&&E().find(s,T.suggest)?T.suggest:null;
    return R(`Now choose a target for ${esc(lab)}.${sg?` Click <b>${esc(nm(s,sg))}</b> (outlined in gold).`:" Legal targets are outlined; click one."} <b>Cancel</b> backs out.`,sg?objEl(root,sg):[])}
  T.suggest=null;
  if(pend&&pend.pid===me)return R(`Make the choice shown in the middle bar to finish resolving that card.`,[]);
  if(pend&&pend.pid!==me)return R(`Your opponent is choosing something. Their moves pop up on the right.`,[]);
  if(s.phase==="dawn"){const b=btnsFor(root,a=>a.type==="dawnDone");if(!b.length)return R(`Dawn: your opponent is getting ready.`,[]);
    return R(r<=2?`<b>Dawn, round ${r}.</b> Your Heroes ready, your Aura refills to <b>${s.p[0].aura}</b> and you drew a card. Press <b>Start battle</b>.`:`Dawn. Press <b>Start battle</b> when you're ready.`,b)}
  if(s.phase==="town"){const my=s.town&&s.town.order[s.town.i]===me;if(!my)return R(`Town: your opponent is shopping.`,[]);
    const g=s.p[0].gold,inn=btnsFor(root,a=>a.type==="inn"),shop=btnsFor(root,a=>a.type==="shop");
    if(r===1)return R(`<b>Town.</b> You earned 1 Gold for each living Hero at Dusk and have <b>${g} Gold</b>. The Inn heals 3 HP for ${E().INN_COST} Gold and the Shop draws a card for ${E().SHOP_COST} Gold. Not enough yet, so save it and press <b>Leave Town</b>.`,btnsFor(root,a=>a.type==="leave"));
    const hurt=inn.length?s.p[0].heroes.filter(h=>!h.dead&&E().maxHp(s,h)-E().hp(s,h)>=1&&inn.some(b=>{try{return JSON.parse(b.dataset.a).hero===h.uid}catch(e){return false}})).sort((x,y)=>E().hp(s,x)-E().hp(s,y))[0]:null;
    if(hurt)return R(`You have <b>${g} Gold</b>. Heal <b>${esc(hurt.name)}</b> at the <b>Inn</b>: it has the fewest Health Points (${E().hp(s,hurt)}/${E().maxHp(s,hurt)}). The Inn heals 3 HP for ${E().INN_COST} Gold. Keeping every Hero alive keeps your Aura and Gold coming.`,btnsFor(root,a=>a.type==="inn"&&a.hero===hurt.uid));
    return R(shop.length?`You have <b>${g} Gold</b>. The <b>Shop</b> draws a card for ${E().SHOP_COST} Gold. Or press Leave Town to save it.`:`You have <b>${g} Gold</b>. Nothing to buy yet, so press <b>Leave Town</b>.`,shop.length?shop:btnsFor(root,a=>a.type==="leave"))}
  if(s.phase!=="battle")return R(`Dusk: unspent Aura is lost and you earn 1 Gold for each living Hero.`,[]);
  if(s.prio!==me)return R(r<=2?`Your opponent is taking their turn. Each move also pops up on the right, with an arrow to the target.`:`Your opponent is taking their turn…`,[]);
  const a=E().actorFor(s,me);
  if(r>=3&&!T.coachOn)return R(r===3&&!T.seen.free?`<b>You're on your own from here.</b> Press <b>Hint</b> any time you're stuck.`:`Your move${a?` with <b>${esc(a.name)}</b>`:""}.`+(T.hint?`<br>Hint: <b>${esc(T.hint)}</b>`:""),T.hintHl||[],"free");
  if(!a)return R(`None of your Heroes can act. Attack with a ready summon if you have one, or press <b>Pass</b>.`,btnsFor(root,o=>o.type==="attack").concat(btnsFor(root,o=>o.type==="pass")));
  const hand=s.p[0].hand,plays=opts.filter(o=>o.type==="play");
  const mySummonsReady=(s.p[0].bf||[]).some(o=>o.kind==="summon"&&!o.ex);
  for(const tip of TIPS[k]){if(tip.once&&T.seen["tip:"+tip.id])continue;
    const c=hand.find(x=>x.id===tip.id&&plays.some(o=>o.uid===x.uid));if(!c)continue;
    if(tip.when==="summonReady"&&!mySummonsReady)continue;
    if(tip.when==="low"&&!s.p[1].heroes.some(h=>!h.dead&&E().hp(s,h)<=E().str(s,a)))continue;
    T.lastTip=tip.id;const how=!T.seen.drag&&tip.id!=="Pump"?(T.seen.dragAt=T.seen.dragAt||Date.now(),Date.now()-T.seen.dragAt<60000?`<br><span style="color:#d8c3a0">To play a card, drag it from your hand up onto the board, or click it.</span>`:""):"";T.suggest=tip.id==="Pump"||tip.id==="Blunt Force"?a.uid:(tip.id==="Lightning Bolt"||tip.id==="Ice Jab"||tip.id==="Flame Jab"?(bestTarget(s,a,3)||{h:{}}).h.uid:null);return R(tip.t(a)+how,handEl(root,c.uid))}
  /* summons attack */
  const sAtk=opts.filter(o=>{if(o.type!=="attack"||o.att===a.uid)return false;const f=E().find(s,o.att);return f&&f.o&&E().str(s,f.o)>0}).sort((x,y)=>E().str(s,E().find(s,y.att).o)-E().str(s,E().find(s,x.att).o));
  if(sAtk.length&&k==="druid"){const sm=E().find(s,sAtk[0].att).o,b=bestTarget(s,sm);if(b)T.suggest=b.h.uid;return R(`Your <b>${esc(nm(s,sAtk[0].att))}</b> is ready. Summons can't attack the round they arrive, but after that they attack like Heroes. Attack ${b?`<b>${esc(b.h.name)}</b>`:"an enemy"} with it.`,btnsFor(root,o=>o.type==="attack"&&o.att===sAtk[0].att).concat(objEl(root,sAtk[0].att)))}
  const atk=opts.find(o=>o.type==="attack"&&o.att===a.uid);
  if(atk&&E().str(s,a)>0){const b=bestTarget(s,a);if(b&&b.d>0){T.suggest=b.h.uid;return R(`Attack <b>${esc(b.h.name)}</b> with <b>${esc(a.name)}</b>: its <b class="k-str">Strength</b> (${E().str(s,a)}) minus ${esc(b.h.name)}'s <b class="k-def">Defense</b> (${E().defn(s,b.h)}) is <b>${b.d} damage</b>. Press <b>Attack</b>, then click ${esc(b.h.name)}.${(T.seen.atk=(T.seen.atk||0)+(T.lastAtk!==a.uid?1:0),T.lastAtk=a.uid,T.seen.atk<=2)?`<br><span style="color:#d8c3a0">Attack with each of your Heroes whenever you get the chance. Attacking exhausts the Hero until the next Dawn.</span>`:""}`,btnsFor(root,o=>o.type==="attack"&&o.att===a.uid))}}
  const ab=opts.find(o=>/ability/i.test(o.type)&&o.type!=="manualAbility"&&(a.name==="Storm Caller"||a.name==="Warden of the Woods"));
  if(ab&&s.p[0].aura>=2)return R(a.name==="Storm Caller"?`<b>Storm Caller</b> has an ability: pay 2 Aura and exhaust it to deal 2 damage to <b>each</b> enemy Hero. Use it.`:`<b>Warden of the Woods</b> can pay 1 Aura and exhaust to summon a 1/3 Squirrel. Use its ability.`,btnsFor(root,o=>o.type===ab.type&&(o.uid===ab.uid||o.hero===ab.hero)));
  const lv=opts.filter(o=>o.type==="level");
  if(lv.length)return R(`Nothing great left for <b>${esc(a.name)}</b>? <b>Level up</b>: it exhausts, gains a level and you draw a card. At Levels 2, 4 and 6 it gets +1 Strength, Defense or Aura.`,btnsFor(root,o=>o.type==="level"));
  return R(`Nothing left to do with <b>${esc(a.name)}</b>. Press <b>Pass</b>.`,btnsFor(root,o=>o.type==="pass"))}
function hint(){const U=P(),s=U&&U.s;if(!s)return;let a=null;try{a=window.CQAI.choose(s,0)}catch(e){}
  if(!a){T.hint="Press Pass, or wait for your opponent.";T.hintHl=[];U.render();return}
  let lab="";try{lab=E().labelAction(s,0,a)}catch(e){}
  if(a.type==="play"){const c=s.p[0].hand.find(x=>x.uid===a.uid);lab=lab||("Play "+(c?(E().DB[c.id]||{}).name:""))}
  T.hint=(lab||a.type).replace(/<[^>]+>/g,"");T.hintSel=a;U.render()}
function hintEls(root){const a=T.hintSel;if(!a)return[];
  if(a.type==="play")return handEl(root,a.uid);
  return btnsFor(root,o=>o.type===a.type&&(o.att||null)===(a.att||null)&&(o.uid||null)===(a.uid||null)&&(o.hero||null)===(a.hero||null))}
function after(s,root){
  const U=P();q(".tut-hl").forEach(e=>e.classList.remove("tut-hl"));q(".tut-ring").forEach(r=>r.remove());
  let box=document.getElementById("tut-coach");
  if(!U.tut||U.mode!=="game"){if(box)box.remove();document.documentElement.classList.remove("cq-tut");return}
  if(s.over){if(box)box.remove();if(!T.ended){T.ended=true;try{window.CQPop&&CQPop.clear()}catch(e){}endModal(s)}return}
  const turn=s.round+"|"+s.phase+"|"+s.prio+"|"+(s.seq||0);if(T.turn!==turn){T.turn=turn;if(!T.keepHint){T.hint=null;T.hintSel=null}T.keepHint=false}
  if(s.round>=3&&s.phase==="battle"&&s.prio===0&&!T.seen.free){/* shown once */}
  let c=null;try{c=coach(s,root)}catch(e){console.warn(e)}
  if(c&&c.extra==="free"){c.hl=hintEls(root);if(s.round===3)setTimeout(()=>{T.seen.free=true},0)}
  if(T.lastTip==="Pump")T.seen["tip:Pump"]=s.p[0].hand.every(x=>x.id!=="Pump")||T.seen["tip:Pump"];
  if(!box){box=document.createElement("div");box.id="tut-coach";box.setAttribute("role","status");box.setAttribute("aria-live","polite");document.body.appendChild(box);
    box.addEventListener("click",e=>{const b=e.target.closest("[data-tc]");if(!b)return;const v=b.dataset.tc;
      if(v==="hint"){T.keepHint=true;hint()}else if(v==="min"){T.hidden=!T.hidden;U.render()}else if(v==="coach"){T.coachOn=!T.coachOn;U.render()}
      else if(v==="leave"){endModal(U.s,{left:true})}})}
  const cls=STYLES.find(x=>x.k===(T.cls||U.tut.cls))||STYLES[0];
  if(T.hidden){box.className="min";box.style.cssText="";box.innerHTML=`<div class="tc-acts" style="margin:0"><button data-tc="min" class="go">Show coach</button><button data-tc="hint">Hint</button></div>`;return}
  box.className="";
  box.innerHTML=`<div class="tc-who"><img src="${esc(head(cls.hero))}" alt="">Coach<span class="tc-r">${s.round?`Round ${s.round}${s.round<=2?" · guided":""}`:"Setup"}</span>
    <span class="tc-acts">${s.round>=3||T.coachOn?`<button data-tc="hint" class="go">Hint</button>`:""}${s.round>=3?`<button data-tc="coach">${T.coachOn?"Let me play":"Coach me"}</button>`:""}<button data-tc="min">Hide</button>${s.round>=3?"":`<button data-tc="leave">Leave</button>`}</span></div>
    ${oppNews(s)}<div class="tc-msg">${c?c.msg:"…"}</div>${s.round>=3?`<div class="tc-acts"><button data-tc="leave" class="leave">Leave the tutorial</button></div>`:""}`;
  (c&&c.hl||[]).forEach(e=>e.classList.add("tut-hl"));rings();placeBox(box)}
/* yellow rings around whatever the coach points at, drawn on top of the page with a gap around the element */
function rings(){q(".tut-ring").forEach(r=>r.remove());q(".tut-hl").forEach(el=>{const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
  const g=el.closest(".pl-hand")?6:10,d=document.createElement("div");d.className="tut-ring";
  d.style.left=(r.left-g-8)+"px";d.style.top=(r.top-g-8)+"px";d.style.width=(r.width+2*g+16)+"px";d.style.height=(r.height+2*g+16)+"px";
  if(el.closest(".modal"))d.style.zIndex="1000";document.body.appendChild(d)})}
addEventListener("scroll",()=>{if(q(".tut-ring").length)rings()},true);
addEventListener("resize",()=>{if(q(".tut-ring").length)rings();const b=document.getElementById("tut-coach");if(b)placeBox(b)});
/* the coach floats at the bottom right, beside your hand, and stays below your party's action buttons */
function placeBox(box){if(box.classList.contains("min")){box.style.cssText="";return}
  const hw=document.querySelector("#play-root .pl-handwrap"),cards=q("#play-root .pl-hand .hc");if(!hw||innerWidth<900){box.style.cssText="";return}
  const top=hw.getBoundingClientRect().top+4,right=cards.reduce((m,c)=>Math.max(m,c.getBoundingClientRect().right),0);
  const w=Math.max(380,Math.min(600,innerWidth-16-Math.max(right+18,innerWidth-616)));
  box.style.width=w+"px";box.style.maxHeight=Math.max(160,innerHeight-16-top+40)+"px"}
/* the coach sits in the free space beside the opponent's Heroes (above the middle bar), so it never covers your hand or your party */
function placeOld(box){const z=document.querySelector("#play-root .pl-zone.op .pl-zsin"),mid=document.querySelector("#play-root .pl-mid");
  box.style.cssText="";if(!z||!mid||innerWidth<900)return;
  const zr=z.getBoundingClientRect(),mr=mid.getBoundingClientRect();let bottom=zr.top;
  q(":scope > *",z).forEach(c=>{const r=c.getBoundingClientRect();if(r.height)bottom=Math.max(bottom,r.bottom)});
  const w=Math.min(zr.width,600);box.style.left=zr.left+"px";box.style.width=w+"px";box.style.bottom="auto";
  const h=box.offsetHeight,room=mr.top-6-(bottom+8);
  box.style.top=(room>=h?bottom+8:Math.max(zr.top,mr.top-6-h))+"px";box.style.maxHeight=(mr.top-6-zr.top)+"px"}


/* ---------- after the match ---------- */
function layer(){return document.getElementById("layer")||document.body}
function modal(html,cls){document.getElementById("tutm")?.remove();const m=document.createElement("div");m.className="modal "+(cls||"");m.id="tutm";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.innerHTML=`<div class="box">${html}</div>`;layer().appendChild(m);return m}
function endModal(s,o){o=o||{};const U=P(),k=T.cls||(U.tut&&U.tut.cls),d=DECKS[k],won=s.over&&s.winner===0,left=!!o.left;
  const signed=typeof S!=="undefined"&&S.mode==="account";
  const title=left?(s.round>=3?"You've Got It!":"Leave the tutorial?"):won?"You've Got It!":"Good game!";
  const line=left?(s.round>=3?"You know the basics now. Keep the deck and build on it, or press Keep playing to finish this game.":"You can come back to Learn to Play any time."):won?"You beat the AI on your first try.":"The AI won this one, but you've got the basics now.";
  const m=modal(`<h2>${title}</h2><p>${line} You played <b>${esc(d.name.replace(/^My First /,"the "))}</b>:</p>
    <div class="tut-deckrow">${d.heroes.map(h=>`<img src="${esc(head(h.slice(2)))}" alt="${esc(h.slice(2))}" title="${esc(h.slice(2))}">`).join("")}</div>
    <p><b>Want to keep the deck you just played?</b>${signed?" It goes straight into My Decks.":" Make a free account and it's saved to My Decks."}</p>
    <div class="actions"><button class="btn primary" data-tutend="keep">Yes, save my deck</button><button class="btn" data-tutend="no">Not now</button></div>
    <div class="actions" style="margin-top:8px">${left?`<button class="btn" data-tutend="stay">Keep playing</button>`:`<button class="btn" data-tutend="again">Play again</button>`}${typeof DISCORD_INVITE!=="undefined"?`<a class="btn dc-btn" href="${DISCORD_INVITE}" target="_blank" rel="noopener">Join the Discord</a>`:""}</div>`,"tut-end");
  m.addEventListener("click",async e=>{const b=e.target.closest("[data-tutend]");if(!b)return;const v=b.dataset.tutend;
    const deck={id:(crypto.randomUUID?crypto.randomUUID():"d"+Date.now()),name:d.name,heroes:d.heroes.slice(),cards:Object.assign({},d.cards)};
    if(v!=="stay"&&v!=="again")document.documentElement.classList.remove("cq-tut");
    if(v==="keep"){m.remove();U.tut=null;U.leave();
      if(typeof S!=="undefined"&&S.mode==="account"){await saveAndOpen(deck)}
      else{ls.set(PENDING,{deck,auto:true,at:Date.now()});if(typeof S!=="undefined")S.authMode="signup";location.hash="account";setTimeout(signupNote,60)}}
    else if(v==="no"){m.remove();ls.set(PENDING,{deck,auto:false,at:Date.now()});U.tut=null;U.leave();location.hash="catalog";if(typeof toast==="function")toast("No problem. Your tutorial deck will be offered again when you sign in.")}
    else if(v==="again"){m.remove();start(k)}
    else if(v==="stay"){m.remove()}})}
function signupNote(){const v=document.getElementById("view");if(!v||location.hash!=="#account"||v.querySelector(".tut-note"))return;
  const n=document.createElement("div");n.className="tut-note";n.innerHTML=`<b>Your deck is waiting.</b> Create a free account (or sign in) and it's saved to My Decks automatically. Signing up by email? Open the confirmation link in this browser.`;
  v.prepend(n)}
async function saveAndOpen(deck){try{await persistDeck(deck)}catch(e){return}
  ls.del(PENDING);S.deck={id:deck.id,name:deck.name,heroes:deck.heroes.slice(),cards:Object.assign({},deck.cards)};S.dirty=false;try{saveDraft()}catch(e){}
  if(S.b)S.b.step="cards";location.hash="build";
  setTimeout(()=>modal(`<h2>This is your deck now</h2><p><b>${esc(deck.name)}</b> is saved in My Decks. Swap cards in and out here, then take it to the Play tab.</p><div class="actions"><button class="btn primary" data-act="close">Got it</button></div>`),120)}
/* app.js calls this after an account's decks load (sign-in, sign-up confirmation, Discord return) */
function onAccount(){const p=ls.get(PENDING,null);if(!p||!p.deck)return;
  if(p.auto){saveAndOpen(p.deck);return}
  const m=modal(`<h2>You have a deck from the tutorial</h2><p>Save <b>${esc(p.deck.name)}</b> to My Decks?</p><div class="actions"><button class="btn primary" data-tp="y">Save it</button><button class="btn" data-tp="n">No thanks</button></div>`);
  m.addEventListener("click",e=>{const b=e.target.closest("[data-tp]");if(!b)return;m.remove();if(b.dataset.tp==="y")saveAndOpen(p.deck);else ls.del(PENDING)})}

/* ---------- first visit: offer the tutorial ---------- */
/* the Home page already leads with Learn to Play, so the pop-up only greets first-time visitors who land on another page */
function firstVisit(){const h=location.hash.replace("#","");if(ls.get(SEEN,0)||h===""||h==="home"||h==="learn"||h==="play")return;
  if(typeof S!=="undefined"&&S.mode==="account")return;
  ls.set(SEEN,1);
  const m=modal(`<h2>New to Crystal Quest?</h2><p>Learn to play in about 15 minutes: a few quick screens, then a coached game. Keep the deck when you're done.</p><div class="actions"><button class="btn primary" data-fv="y">Learn to Play</button><button class="btn" data-fv="n">I know how to play</button></div>`);
  m.addEventListener("click",e=>{const b=e.target.closest("[data-fv]");if(!b)return;m.remove();if(b.dataset.fv==="y")location.hash="learn"})}
setTimeout(firstVisit,1500);

/* any click may close a window or move things: redraw the rings from what is still on the page */
document.addEventListener("click",()=>{const U=P();if(U&&U.tut)setTimeout(rings,80)});
/* a window closed with Escape (or anything else that moves without a click): drop stale rings and refresh the coach */
document.addEventListener("keydown",e=>{const U=P();if(U&&U.tut&&e.key==="Escape")setTimeout(()=>{if(!document.querySelector(".modal"))U.render()},60)});
setInterval(()=>{const U=P();if(U&&U.tut&&q(".tut-ring").length)rings()},500);
/* clicking a hand card opens the card's Play window: point at its Play button */
document.addEventListener("click",e=>{const U=P();if(!U||!U.tut||!e.target.closest||!e.target.closest(".pl-hand .hc"))return;
  setTimeout(()=>{const b=document.querySelector('.modal [data-pa="play"]'),m=document.querySelector("#tut-coach .tc-msg");
    if(b){b.classList.add("tut-hl");rings();if(m)m.innerHTML=`Press <b>${esc(b.textContent)}</b>. The Aura cost comes out of your Aura bar.`}
    else if(m)m.innerHTML=`This card can't be played right now; the window says why. Press <b>Close</b>.`},40)});
document.addEventListener("click",e=>{const b=e.target.closest("[data-tut]");if(!b)return;const v=b.dataset.tut;
  if(v==="next"){T.step=Math.min(SCREENS.length,T.step+1);rerender();scrollTo(0,0)}
  else if(v==="back"){T.step=Math.max(0,T.step-1);rerender()}
  else if(v==="skip"){T.step=SCREENS.length;rerender()}
  else if(v==="pick")start(b.dataset.v)});
window.CQTut={mount,after,onAccount,start,DECKS};
/* app.js routes before this file loads: draw Learn to Play now if that is the page */
try{const v=document.getElementById("view");if(v&&typeof S!=="undefined"&&S.view==="learn")mount(v)}catch(e){}
})();
