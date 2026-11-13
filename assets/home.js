/* Crystal Quest Deck Forge: Home page (#home, the site's landing page) and Learn to Play (#learn).
   Banner: Riverstead (Dawn) or Draven Temple (Dusk), with its own music.
   Music on/off lives in the bottom bar (#sbMusic) and shares the cq.music setting with the Play tab.
   Uses app.js globals: ICON_BASE, HEROES, CARDS, cardHTML, esc, cc, S. */
(function(){
"use strict";
const SCENES={
  day:{img:"riverstead",song:"theme_2_solace_on_an_evening_hill",alt:"Three heroes on a sunny hill above Riverstead castle and its river valley"},
  night:{img:"draven",song:"theme_5_lost_in_the_woods",alt:"Three heroes on a rocky ridge facing Draven Temple under a purple storm"}};
const get=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
/* Nov 12, 2026: Dawn or Dusk follows the visitor's own clock (Dawn 6:00 am to 5:59 pm, Dusk otherwise).
   The switch still flips it, but only for this visit; the next visit follows the clock again. */
const clockMode=()=>{const h=new Date().getHours();return h>=6&&h<18?"day":"night"};
let mode=clockMode(),picked=false;
setInterval(()=>{if(picked)return;const m=clockMode();if(m===mode)return;mode=m;if(typeof S!=="undefined"&&S.view==="home"){const old=document.querySelector(".hm-hero");if(old){old.outerHTML=banner();fit();syncMusic()}}},60000);
const musicOn=()=>get("cq.music",true)!==false;

/* ---------- music ---------- */
const A={el:null,song:null,unlocked:false};
function ext(){const a=document.createElement("audio");return a.canPlayType('audio/ogg; codecs="vorbis"')?"ogg":"mp3"}
function want(){return S.view==="home"&&musicOn()&&!document.hidden}
function syncMusic(){const song=SCENES[mode].song;
  if(!want()){if(A.el)A.el.pause();return}
  if(!A.el){A.el=new Audio();A.el.loop=true;A.el.preload="auto";if(window.CQVol)CQVol.attach(A.el,.35);else A.el.volume=.35}
  if(A.song!==song){A.song=song;A.el.src=`${ICON_BASE}sfx/${song}.${ext()}?v=1`}
  const p=A.el.play();if(p&&p.catch)p.catch(()=>{/* waits for the first click or key press (browser autoplay rules) */})}
function musicBtn(){const b=document.getElementById("sbMusic");if(!b)return;const on=musicOn();
  b.setAttribute("aria-pressed",String(on));b.innerHTML=`<span aria-hidden="true">${on?"🎵":"🔇"}</span> Music ${on?"on":"off"}`}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#sbMusic");if(!b)return;
  if(window.CQVol)CQVol.setOn("music",!musicOn());else set("cq.music",!musicOn());musicBtn();syncMusic();
  /* the Play tab reads the same setting; let it re-render its own button */
  if(S.view==="play"&&window.CQPlay&&document.getElementById("view"))window.CQPlay.mount(document.getElementById("view"))});
["pointerdown","keydown"].forEach(t=>document.addEventListener(t,()=>{if(want()&&A.el&&A.el.paused)syncMusic();else if(want()&&!A.el)syncMusic()},{capture:true}));
document.addEventListener("visibilitychange",syncMusic);
document.addEventListener("cq-vol",e=>{if(e.detail&&e.detail.kind==="music"){musicBtn();syncMusic()}});
window.addEventListener("hashchange",()=>setTimeout(syncMusic,0));

/* ---------- banner size: from under the menu bar to the bottom bar (the fold) ---------- */
function fit(){const h=document.querySelector("header.top"),f=document.getElementById("sitebar"),r=document.documentElement.style;
  r.setProperty("--hm-top",(h?h.offsetHeight:60)+"px");r.setProperty("--hm-bot",(f&&getComputedStyle(f).display!=="none"?f.offsetHeight:0)+"px")}
window.addEventListener("resize",()=>{if(S.view==="home")fit()});

/* ---------- page ---------- */
const byName=n=>[...HEROES,...CARDS].find(c=>c.name===n);
const card=n=>{const c=byName(n);return c?cardHTML(c,{button:"inspect"}):""};
const img=(f,alt,w,h)=>`<img src="${ICON_BASE}${f}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async">`;
const CLS=[
  ["Barbarian","Hits hardest when wounded. Rage, big weapons and a willingness to bleed."],
  ["Bard","Songs that lift the whole party: copy, double and ready your allies."],
  ["Cleric","Heals, revives and turns the light on anyone who threatens the party."],
  ["Druid","Calls beasts and Rootfolk to the field and grows huge pools of Aura."],
  ["Mage","Raw spell damage, boosted by one-shot Pillars of power."],
  ["Monk","Combos that chain card into card, and Meditation that stores up power."],
  ["Paladin","Heavy armor and Defense that turns into crushing blows."],
  ["Ranger","Arrows, bows and Traps that strike from a distance."],
  ["Rogue","Stealth, poison and a quick hand for other people's Gold."],
  ["Warlock","Curses, life loss and dark pacts that pay off over time."]];
const PHASES=[
  ["Dawn","Aura_Crystal","Ready your Heroes, refill your Aura and draw a card."],
  ["Battle","Divine_Smite","Heroes act one at a time, Lead to Closer: cast, attack, equip or level up."],
  ["Dusk","Gold_Bar","Unspent Aura fades. Every Hero still standing earns a Gold."],
  ["Town","Potion","Spend Gold at the Inn, Shop, Blacksmith or Church."]];
function banner(){const s=SCENES[mode];
  return`<section class="hm-hero hm-${mode}" aria-label="Crystal Quest">
  <div class="hm-bg" role="img" aria-label="${esc(s.alt)}"></div>
  <div class="hm-toggle" role="group" aria-label="Time of day">
    <button type="button" class="hm-tg hm-day" data-hm="day" aria-pressed="${mode==="day"}"><span aria-hidden="true">☀</span> Dawn</button><button type="button" class="hm-tg hm-night" data-hm="night" aria-pressed="${mode==="night"}"><span aria-hidden="true">☾</span> Dusk</button>
  </div>
  <div class="hm-copy">
    <h1 class="hm-title">Crystal Quest</h1>
    <p class="hm-lede">Riverstead is calling for heroes! Gather your party of three heroes, build your deck, and take on rival parties in tactical, turn-based battles for the fate of Riverstead. Combine spells, gear and tactics, earn Gold to upgrade and level your heroes into something unstoppable. Ready to start your quest?</p>
  </div>
  <a class="btn primary hm-cta" href="#learn">Learn to Play</a>
</section>`}
function view(){
  return`${banner()}
<div class="hm-body">
  <section class="hm-sec hm-split">
    <div class="hm-txt"><h2>Gather your party</h2>
      <p>Every deck starts with three Heroes standing in a row: your <b>Lead</b>, <b>Center</b> and <b>Closer</b>. That order decides who acts first each round, so a fast Lead and a heavy hitter at the end can swing a fight.</p>
      <p>Each Hero brings four stats: <span class="kw-str">Strength</span> for attacks, <span class="kw-def">Defense</span> to blunt hits, <span class="kw-aura">Aura</span> to fuel your cards, and <span class="kw-hp">Health Points</span> to stay standing. Their classes decide which cards your deck can hold.</p>
      <a class="btn" href="#catalog">Browse the Heroes</a></div>
    <div class="hm-cards hm-three">${card("Divine Knight")}${card("Arcane Scholar")}${card("Shadow Ranger")}</div>
  </section>

  <section class="hm-sec">
    <h2>Ten classes, ten ways to fight</h2>
    <p class="hm-sub">Mix any three Heroes. Every class has its own tools and its own weak spots.</p>
    <div class="hm-classes">${CLS.map(([c,t])=>`<a class="hm-cls" href="#catalog" data-hm-cls="${c}" style="--cc:${cc(c)}">${img("ico-"+c.toLowerCase()+".png",c+" icon",40,40)}<b>${c}</b><span>${t}</span></a>`).join("")}</div>
  </section>

  <section class="hm-sec">
    <h2>A round in four phases</h2>
    <p class="hm-sub">Both parties move through every round together.</p>
    <div class="hm-phases">${PHASES.map(([p,f,t],i)=>`<div class="hm-ph"><div class="hm-ph-art">${img("art/card/"+f+"-face.webp",p,500,700)}</div><b><span class="hm-n">${i+1}</span>${p}</b><span>${t}</span></div>`).join("")}</div>
  </section>

  <section class="hm-sec hm-split hm-rev">
    <div class="hm-txt"><h2>Gold, gear and glory</h2>
      <p>Heroes that survive the night earn Gold. Take it to Town: rest at the Inn, buy a card at the Shop, bring a fallen Hero back at the Church, or pay the Blacksmith to flip a weapon to its upgraded side for the rest of the game.</p>
      <p>Level Heroes from 0 to 6 as you go. Every second level adds a point of <span class="kw-str">Strength</span>, <span class="kw-def">Defense</span> or <span class="kw-aura">Aura</span>, and many Heroes unlock new powers at Levels 3 and 6.</p></div>
    <div class="hm-cards hm-two">${card("Hammer of Ruin")}${card("Level Up")}</div>
  </section>

  <section class="hm-sec">
    <h2>Play your way</h2>
    <div class="hm-ways">
      <a class="hm-way" href="#build"><b>Build a deck</b><span>Pick three Heroes and at least 50 cards. Save decks to your account or this browser.</span></a>
      <a class="hm-way" href="#play"><b>Play online or vs the AI</b><span>Rules are handled for you. Practice against the AI or share a room code with a friend.</span></a>
      <a class="hm-way" href="#build"><b>Print &amp; Play</b><span>Export any deck as a printable PDF, or as a Tabletop Simulator deck.</span></a>
      <a class="hm-way" href="#leaderboard"><b>Climb the Leaderboard</b><span>Every finished game counts toward your playtester crest and class badges.</span></a>
    </div>
  </section>

  <section class="hm-sec hm-end">
    <h2>Join the adventure</h2>
    <p class="hm-sub">Crystal Quest is in open playtesting. Tell us what you find, share decks and meet other players.</p>
    <div class="hm-btns"><a class="btn primary" href="#learn">Learn to Play</a><a class="btn" href="#play">Start a Game</a><a class="btn discord-btn" href="https://discord.gg/wErfNbug5e" target="_blank" rel="noopener">Join the Discord</a></div>
  </section>
</div>`}
function learnView(){
  return`<h1>Learn to Play</h1>
  <p class="lede">The New Player Tutorial is on its way: a guided first game that walks you through every step.</p>
  <div class="hm-learn">
    <a class="hm-way" href="#quickstart"><b>Read the Quick Start</b><span>Everything you need for your first game, in about five minutes.</span></a>
    <a class="hm-way" href="#play"><b>Practice vs the AI</b><span>Pick a starter deck and play. The game enforces the rules for you.</span></a>
    <a class="hm-way" href="#rules"><b>Full Rules</b><span>Every rule and keyword, with a glossary.</span></a>
  </div>`}
function mount(el){el.innerHTML=view();document.documentElement.classList.add("hm-page");fit();requestAnimationFrame(fit);musicBtn();syncMusic()}
/* Learn to Play: the New Player Tutorial (tutorial.js); this page of links stays as the fallback if it fails to load */
function mountLearn(el){if(window.CQTut){window.CQTut.mount(el);musicBtn();return}el.innerHTML=learnView();musicBtn()}
function leave(){document.documentElement.classList.remove("hm-page")}
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-hm]");if(!t||S.view!=="home")return;
  const m=t.dataset.hm;if(m===mode)return;mode=m;picked=true;
  const old=document.querySelector(".hm-hero");if(old)old.outerHTML=banner();fit();syncMusic()});
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-hm-cls]");if(!t)return;
  try{if(S.cat)S.cat.cls=t.dataset.hmCls}catch(err){}});
window.CQHome={mount,mountLearn,leave,musicBtn,syncMusic};
})();
/* app.js routes before this file loads: draw the page now if it's Home or Learn */
(function(){try{const v=document.getElementById("view");if(!v||typeof S==="undefined")return;if(S.view==="home")CQHome.mount(v);else if(S.view==="learn")CQHome.mountLearn(v);else CQHome.musicBtn()}catch(e){}})();

/* phone menu: hamburger opens and closes the menu panel; picking a page closes it */
(function(){const b=document.getElementById("navBurger"),top=document.querySelector("header.top");if(!b||!top)return;
  const set=o=>{top.classList.toggle("nav-open",o);b.setAttribute("aria-expanded",String(o));b.setAttribute("aria-label",o?"Close menu":"Menu")};
  b.addEventListener("click",e=>{e.stopPropagation();set(!top.classList.contains("nav-open"))});
  document.addEventListener("click",e=>{if(!top.classList.contains("nav-open"))return;const a=e.target.closest&&e.target.closest("#navPanel a[href]");if(a||!top.contains(e.target))set(false)});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&top.classList.contains("nav-open")){set(false);b.focus()}});
  window.addEventListener("hashchange",()=>set(false));
  matchMedia("(min-width:721px)").addEventListener("change",m=>{if(m.matches)set(false)})})();
