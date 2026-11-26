/* Riverstead: Blog (#blog, #blog/<slug>) and the "What happened to my cards?!" pop-up for returning playtesters.
   Posts live in POSTS below; card pictures are drawn with the site's own card renderer (cardHTML), so they always show current text. */
(function(){
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const A=p=>(typeof ICON_BASE!=="undefined"?ICON_BASE:"assets/")+p;
const V=()=>typeof ART_VER!=="undefined"?ART_VER:"1";
/* a card by name, including deprecated cards; drawn as a card image */
function card(name){try{const all=[...(typeof BYID!=="undefined"?BYID.values():[]),...(typeof DEP_BYID!=="undefined"?DEP_BYID.values():[])];
  const c=all.find(x=>x.name===name);return c&&typeof cardHTML==="function"?`<div class="bl-card">${cardHTML(c,{})}</div>`:""}catch(e){return""}}

/* Blog 2: a before/after card picture (fixed snapshots in art/blog, so the post keeps showing what changed) and a class heading with its icon */
const DIM={"b2-bo3-lobby":[1304,932],"b2-bo3-over":[1400,373],"b2-bo3-sideboard":[1400,1133],"b2-cloak-of-hate":[1400,949],"b2-dark-arts":[1400,949],"b2-doubling-ritual":[1400,949],"b2-ember-mage":[1400,949],"b2-flame-wave":[1400,949],"b2-jess-naturecaller":[1400,949],"b2-long-sword":[1400,949],"b2-mass-populate":[1400,949],"b2-poison-tipped-dagger":[1400,949],"b2-rage-brute":[1400,949],"b2-sb-builder":[1400,1151],"b2-sb-list":[648,608],"b2-shadow-strike":[1400,949],"b2-storm-caller":[1400,949],"b2-storm-of-insight":[1400,949],"b2-venom-dancer":[1400,949]};
function pic(file,alt,cap,cls){const d=DIM[file]||[1400,949];return`<figure class="bl-chg${cls?" "+cls:""}"><img src="${A("art/blog/"+file+".webp")}?v=${V()}" alt="${E(alt)}" width="${d[0]}" height="${d[1]}" loading="lazy" decoding="async">${cap?`<figcaption>${cap}</figcaption>`:""}</figure>`}
const clsH=(c,id)=>`<h3 class="bl-cls" id="${id||c.toLowerCase()}"><img src="${A("ico-"+c.toLowerCase()+".png")}" alt="" width="34" height="34">${c}</h3>`;

const POSTS=[
{slug:"new-nerfs-and-best-of-3",date:"2026-11-26",title:"New Nerfs and Best of 3 Have Arrived!",
 cover:"art/banner/draven-1920.webp",
 excerpt:"We're refining the cards we under-developed: fewer early Hero kills and snowballs you have to earn. Plus, Best of 3 matches with sideboards are open to everyone.",
 body:()=>`
<p class="bl-hi">Hello, Defenders of Riverstead!</p>
<p>As more of you play decks and try out different strategies, we're finding cards that we under-developed. We're taking some time to refine those cards to make a healthier and more interesting environment.</p>
<p>This process is iterative, so not all of these nerfs are final. We'll keep watching how the cards play and adjust as we learn more. We're also looking at adding some new cards next week to help even out some of the power deltas.</p>

<h2 id="focus">What we're focusing on this week</h2>
<div class="bl-goals">
<div><b>Limiting turn one and turn two Hero kills</b><p>We know that losing a Hero early is a large obstacle to overcome. We want players to have time to set up their game plan, so as a rule we've tried to limit these early Hero kills.</p></div>
<div><b>Slowing snowballs</b><p>We don't mind snowballs. They can create some of the most fun moments in a game. Making 50 summons, or doubling a ton of poison counters, can be so satisfying. We want those big moments to be well earned.</p></div>
</div>
<p>With these things in mind, we made these changes to the card pool. In every picture, <span class="bl-k bef">red</span> marks how the card used to read and <span class="bl-k aft">green</span> marks how it reads now.</p>

<h2 id="changes">The changes</h2>

${clsH("Barbarian")}
<p><b>Rage Brute.</b> We moved his ability to Level 3, and it can now be used only once per turn. There was an unintentional turn 1 kill with The Reaper Cleaver. Since the ability only adds a Fatigue counter and doesn't exhaust him, it was too easy to drop the Cleaver and then double his Strength. Shout-out to <a href="#player/theSug1"><b>Sug</b></a> for spotting this!</p>
${pic("b2-rage-brute","Rage Brute before and after: the ability now has a Level 3 frame and the line You can only activate this ability once per turn.")}

${clsH("Rogue")}
<p><b>Venom Dancer.</b> This was just too much damage with a Dark Fang lead. We pulled the buff back to +1 Strength, and she gets the full +3 at Level 3.</p>
${pic("b2-venom-dancer","Venom Dancer before and after: +3 Strength becomes +1 Strength, with +3 Strength at Level 3.")}
<p><b>Shadow Strike.</b> From 1 to 2 Aura. This card can push more damage than we're comfortable with. We didn't want to be too hard on it, since one of its best targets just got a nerf.</p>
${pic("b2-shadow-strike","Shadow Strike before and after: the Aura cost goes from 1 to 2.")}
<p><b>Poison-Tipped Dagger.</b> From 2 to 3 Aura. Poisonous 2 on a 2 Aura weapon stacked poison counters faster than we wanted in the first rounds.</p>
${pic("b2-poison-tipped-dagger","Poison-Tipped Dagger before and after: the Aura cost goes from 2 to 3.")}

${clsH("Druid")}
<p><b>Mass Populate.</b> From 6 to 8 Aura. The number of summons we were getting for 6 Aura was just too much. Pushing it to 8 makes it a bigger commitment.</p>
${pic("b2-mass-populate","Mass Populate before and after: the Aura cost goes from 6 to 8.")}
<p><b>Jess Naturecaller.</b> From three Wolves to two Wolves, at Level 3 and again at Level 6. Curving Jess' ability into Thorncaller was too much threat density for some decks to handle.</p>
${pic("b2-jess-naturecaller","Jess Naturecaller before and after: she summons two 2/2 Wolves at Level 3 and Level 6 instead of three.")}
<p class="bl-call">Last time we said Jess might be broken. You tested her. She was!</p>

${clsH("Warlock")}
<p><b>Dark Arts.</b> Deprecated. This card was responsible for too many turn one kills. It's no longer legal, so if it was in one of your decks, you'll need to fill those slots.</p>
${pic("b2-dark-arts","Dark Arts is deprecated.")}
<p><b>Doubling Ritual.</b> From 4 to 5 Aura. Doubling your Pillars is exactly the kind of big moment we love, and one more Aura helps make sure it's earned.</p>
${pic("b2-doubling-ritual","Doubling Ritual before and after: the Aura cost goes from 4 to 5.")}
<p><b>Cloak of Hate.</b> Instead of dealing 2 Dark damage to any target, it now makes target enemy lose 1 Health Point each time its Hero becomes exhausted.</p>
${pic("b2-cloak-of-hate","Cloak of Hate before and after: deal 2 Dark damage to any target becomes target enemy loses 1 Health Point.")}

${clsH("Mage")}
<p>Mage's area damage was hitting whole parties too hard, too early. We pulled back the early numbers and left the Level 3 and Level 6 payoffs alone.</p>
<p><b>Ember Mage.</b> The +1 Spell Damage now starts at Level 3.</p>
${pic("b2-ember-mage","Ember Mage before and after: the +1 Spell Damage ability now has a Level 3 frame.")}
<p><b>Storm Caller.</b> From 2 damage to 1 damage to each enemy Hero. She still deals 3 at Level 3.</p>
${pic("b2-storm-caller","Storm Caller before and after: Deal 2 damage becomes Deal 1 damage; Level 3 still deals 3.")}
<p><b>Flame Wave.</b> From 3 to 2 Fire damage to each enemy. It still deals 5 at Level 6.</p>
${pic("b2-flame-wave","Flame Wave before and after: Deal 3 Fire damage becomes Deal 2 Fire damage; Level 6 still deals 5.")}
<p><b>Storm of Insight.</b> From 3 to 2 Lightning damage to each enemy.</p>
${pic("b2-storm-of-insight","Storm of Insight before and after: Deal 3 Lightning damage becomes Deal 2 Lightning damage.")}

${clsH("Generic")}
<p><b>Long Sword.</b> From +4 to +3 Strength, and its upgrade now costs 8 Gold instead of 7.</p>
${pic("b2-long-sword","Long Sword before and after: +4 Strength becomes +3 Strength, and the upgrade cost goes from 7 to 8.")}
<p class="bl-cta"><a class="btn" href="#changelog">See every change in the Changelog</a></p>

<h2 id="bo3">Best of 3 and Sideboards</h2>
<p>One game doesn't always tell the whole story, so every player can now play matches as a <b>Best of 3</b>. The first player to win 2 games wins the match, and a drawn game doesn't count for either player. Between games, you can swap cards in and out of a <b>sideboard</b> to answer what your opponent showed you.</p>

<h3 class="bl-sub">How to play a Best of 3</h3>
<div class="bl-split"><div>
<ol class="bl-steps">
<li>Open the <b>Play</b> tab and choose your <b>deck</b>.</li>
<li>Set <b>Match</b> to <b>Best of 3 with sideboards</b>. Your deck's sideboard comes along.</li>
<li>Start a game against the AI, host a room, or challenge another player. A challenge tells your opponent it's a Best of 3 before they accept.</li>
</ol>
</div>${pic("b2-bo3-lobby","The Play tab with a deck chosen, Match set to Best of 3 with sideboards, and the Start game button.","The Play tab","bl-shot")}</div>
<p>When a game ends, the pop-up shows the <b>match score</b> (1). Press <b>Next game: sideboard</b> (2) to get ready for the next one.</p>
${pic("b2-bo3-over","The end of game pop-up showing the match score and the Next game: sideboard button.","After game 1","bl-shot wide")}
<p>On the sideboard screen:</p>
<ol class="bl-steps">
<li>Press <b>→</b> next to a card in your deck to move one copy to your sideboard.</li>
<li>Press <b>←</b> next to a sideboard card to bring one copy into your deck.</li>
<li>Press the <b>⇄</b> button next to a Hero in your party to swap in your sideboard Hero.</li>
<li>Press <b>Ready</b>. The next game starts when both players are ready.</li>
</ol>
${pic("b2-bo3-sideboard","The Sideboard for game 2 screen: deck on the left, sideboard on the right, Hero swap buttons on top and Ready at the bottom.","Sideboarding between games. Hover over (or tap) any name to see the full card.","bl-shot wide")}
<p>Your deck still needs at least 50 cards, and your changes last for the rest of the match. <b>Reset to registered list</b> takes you back to the list you started the match with.</p>

<h3 class="bl-sub">How to make your sideboard</h3>
<p>You build your sideboard in the <b>Deck Builder</b>, right next to your deck.</p>
<ol class="bl-steps">
<li>Flip the big <b>Main Deck / Sideboard</b> switch to <b>Sideboard</b>. Now every card you click goes to your sideboard.</li>
<li>Press <b>Choose Sideboard Hero</b> if you want a Hero waiting on the bench. It can be any Hero from any class.</li>
<li>Each card also has its own small <b>MD / SB</b> switch, if you'd rather send just that card to the other side.</li>
</ol>
${pic("b2-sb-builder","The Deck Builder with the big switch set to Sideboard, the Sideboard Hero button and a card's own SB switch.","The Deck Builder with the switch on Sideboard","bl-shot wide")}
<div class="bl-split"><div>
<p>Your sideboard shows up under your deck list, with its own count. The rules are short:</p>
<ul class="bl-steps">
<li>Up to <b>10 cards</b>.</li>
<li>Up to <b>1 Hero</b>, and it counts toward the 10.</li>
<li>Copy limits count your deck and sideboard <b>together</b>: 3 copies of a card, 1 copy of a Legendary.</li>
</ul>
<p>The yellow arrows move one copy at a time between your Main Deck and your Sideboard.</p>
</div>${pic("b2-sb-list","A sideboard list in the Deck Builder: Night Stalker as the Sideboard Hero plus Antidote, Snuff Out, Naturalize and Shatter, 10 of 10.","A finished sideboard: 9 cards and 1 Hero","bl-shot")}</div>
<p class="bl-cta"><a class="btn primary" href="#decks">Build your sideboard</a> <a class="btn" href="#play">Play a Best of 3</a></p>

<p>Keep the feedback coming. Every one of these changes started with someone playing a deck and telling us what they found.</p>
<p class="bl-sign">The Riverstead Team</p>`},
{slug:"curating-set-one",date:"2026-11-19",title:"Curating Set One, and a Tournament!",
 cover:"art/banner/riverstead-1920.webp",
 excerpt:"Monk moves to Set 2, every class is trimmed to 28 cards and 5 Heroes, Surrender Your Soul gets simpler, two new Heroes join the party, and our first tournament is coming.",
 body:()=>`
<p class="bl-hi">Hello, Defenders of Riverstead!</p>
<p>We're so happy you're here! We've made a few choices to tighten things up, and we're getting ready to host our first tournament, with a crazy prize. Before we get there, let's jump into the changes.</p>

<h2 id="curating">Curating the Cards</h2>
<div class="bl-stats"><div><b>9</b><span>classes in Set 1</span></div><div><b>28</b><span>cards per class</span></div><div><b>5</b><span>Heroes per class</span></div></div>
<p>We've moved the <b>Monk</b> class to <b>Set 2</b> so we can perfect the class and refine its mechanics. Playtesters with Set 2 access can still play the entire class.</p>
<p>We also curated every class, cutting cards that didn't fit the class's identity or our vision for it. Here are a few of the cards that didn't make the cut:</p>
<div class="bl-row">${["Return to the Earth","Entangling Roots","Night Terror","Vigil","Levitate","Ice Bath"].map(card).join("")}</div>
<p class="bl-cta"><a class="btn" href="#changelog">See every cut card in the Changelog</a></p>

<h2 id="souls">Rules Change: Surrendering a Soul</h2>
<div class="bl-split"><div>
<p>We've cut the choices for surrendering a soul down to three:</p>
<div class="bl-souls"><img src="${A("art/ui/soul-aura.webp")}" alt="+2 Aura"><img src="${A("art/ui/soul-str.webp")}" alt="+2 STR"><img src="${A("art/ui/soul-def.webp")}" alt="+2 DEF"></div>
<p>These are the closest to what a living Hero gives your party, and in playtesting, players picked Aura or Defense most of the time anyway.</p>
<p>When one of your Heroes dies, its card now flips over, and you choose right on the card once you have priority.</p>
</div><figure class="bl-fig"><img src="${A("art/blog/soul-card.webp")}?v=${V()}" alt="A fallen Hero's card: Surrender Soul, with +2 Aura, +2 STR and +2 DEF buttons" width="250" height="295"><figcaption>A fallen Hero's card in the Play tab</figcaption></figure></div>

<h2 id="heroes">Adding New Heroes</h2>
<p>Just for fun, we've added a couple of new Heroes based on people in our office. Introducing <b>Deeg</b> and <b>Jess</b>!</p>
<div class="bl-row bl-heroes">
  <figure>${card("Deeg Farsight")}<figcaption><b>Deeg Farsight</b>, Ranger. With a Bow equipped, he can fire Arrows straight from your hand.</figcaption></figure>
  <figure>${card("Jess Naturecaller")}<figcaption><b>Jess Naturecaller</b>, Druid. At Level 3 and again at Level 6, she summons three 2/2 Wolves.</figcaption></figure>
</div>
<p class="bl-call">I think Jess might be broken. Please test this card!</p>
<p>Speaking of new Heroes, your chance to be added to the game is coming...</p>

<h2 id="tournament">Tournament!</h2>
<div class="bl-tour"><div class="bl-tour-in">
<p class="bl-tour-k">Coming soon</p>
<p class="bl-tour-t">The first Riverstead Online Tournament</p>
<p class="bl-tour-p">Grand prize: become a Hero in the game</p>
</div></div>
<p>Now that things are tuned up, we want to stress-test Set 1! We're planning an online tournament, and the winner gets a chance to be immortalized as a Hero in the game.</p>
<p>To help you get ready, we've added <b>challenges</b> to the Play tab. See who's online, challenge another player, refine your deck and prepare for the tournament.</p>
<p class="bl-cta"><a class="btn primary" href="#play">Challenge a player</a> <a class="btn" href="#build">Tune your deck</a></p>

<p>We can't wait to hear your feedback!</p>
<p class="bl-sign">The Riverstead Team</p>`}
];

const CSS=`.bl-wrap{max-width:860px;margin:0 auto}
.bl-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-top:16px}
.bl-item{display:flex;flex-direction:column;border-radius:10px;overflow:hidden;background:var(--surface);border:1px solid var(--line);color:inherit;text-decoration:none}
.bl-item:hover{box-shadow:0 0 0 2px #e8b04a}
.bl-item img{width:100%;aspect-ratio:16/8;object-fit:cover;display:block}
.bl-item div{padding:12px 14px}.bl-item h2{font-size:1.25rem;margin:2px 0 6px}.bl-item p{margin:0;color:var(--muted);font-size:.95rem}
.bl-date{font-size:.85rem;color:var(--muted)}
.bl-hero{position:relative;border-radius:12px;overflow:hidden;margin:6px 0 18px;min-height:260px;display:flex;align-items:flex-end;background:#120c08 center/cover no-repeat}
.bl-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(8,5,3,.88))}
.bl-hero div{position:relative;z-index:1;padding:22px 24px}
.bl-hero h1{margin:4px 0 0;color:#fff5de;font-family:"Pirata One",var(--display);font-size:clamp(2rem,5vw,3.2rem);line-height:1;text-shadow:0 3px 0 #000}
.bl-hero .bl-date{color:#f1dcae}
.bl-body{font-size:1.05rem;line-height:1.6}
.bl-body h2{font-family:"Pirata One",var(--display);font-size:2rem;margin:34px 0 8px;color:#ffc35a;text-shadow:0 2px 0 #000}
.bl-hi{font-family:"Pirata One",var(--display);font-size:1.7rem;margin:0 0 6px}
.bl-row{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin:14px 0}
.bl-card{width:170px}.bl-card>*{width:100%;margin:0}
.bl-heroes figure{margin:0;width:230px;display:flex;flex-direction:column;gap:8px}.bl-heroes .bl-card{width:100%}
.bl-heroes figcaption,.bl-fig figcaption{font-size:.9rem;color:var(--muted);line-height:1.4;text-align:center}
.bl-stats{display:flex;gap:12px;margin:10px 0 14px;flex-wrap:wrap}
.bl-stats div{flex:1;min-width:130px;text-align:center;padding:12px;border-radius:10px;background:linear-gradient(#2c1d12,#1b120b);border:2px solid #b8743a}
.bl-stats b{display:block;font:400 2.6rem/1 "Pirata One",var(--display);color:#ffc35a;text-shadow:0 2px 0 #000}.bl-stats span{font-size:.9rem;color:#e9d9b8}
.bl-split{display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap}.bl-split>div{flex:1;min-width:260px}
.bl-fig{margin:0 auto;width:250px;display:flex;flex-direction:column;gap:6px}.bl-fig img{width:100%;height:auto;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.5)}
.bl-souls{display:flex;flex-direction:column;gap:8px;align-items:flex-start;margin:8px 0 10px}.bl-souls img{width:190px;height:auto;image-rendering:pixelated}
.bl-call{margin:14px 0;padding:12px 16px;border-left:5px solid #7fb85a;background:rgba(127,184,90,.12);border-radius:6px;font-family:"Pirata One",var(--display);font-size:1.45rem}
.bl-tour{border-radius:12px;overflow:hidden;margin:10px 0 14px;background:url("${A("art/banner/draven-1920.webp")}") center/cover no-repeat}
.bl-tour-in{padding:34px 22px;text-align:center;background:radial-gradient(circle at 50% 50%,rgba(20,8,4,.55),rgba(10,5,3,.85))}
.bl-tour-k{margin:0;color:#f1dcae;letter-spacing:.2em;text-transform:uppercase;font-size:.85rem}
.bl-tour-t{margin:6px 0;font:400 clamp(1.7rem,4.5vw,2.7rem)/1.05 "Pirata One",var(--display);color:#fff5de;text-shadow:0 3px 0 #000}
.bl-tour-p{margin:0;display:inline-block;padding:6px 14px;border-radius:999px;background:#e8b04a;color:#2a1608;font-weight:700}
.bl-cta{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}
.bl-sign{font-family:"Pirata One",var(--display);font-size:1.5rem;margin-top:4px}
.bl-back{display:inline-block;margin:4px 0 0}
.bl-pop .box{max-width:460px;text-align:left}.bl-pop .bl-pop-art{display:flex;justify-content:center;margin:2px 0 8px}
.bl-pop .bl-pop-art img{width:100%;max-height:150px;object-fit:cover;border-radius:8px}
.bl-goals{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin:10px 0 14px}
.bl-goals>div{padding:14px 16px;border-radius:10px;background:linear-gradient(#2c1d12,#1b120b);border:2px solid #b8743a}
.bl-goals b{display:block;font:400 1.45rem/1.15 "Pirata One",var(--display);color:#ffc35a;text-shadow:0 2px 0 #000;margin-bottom:6px}.bl-goals p{margin:0;color:#e9d9b8;font-size:.98rem}
.bl-k{font-weight:700}.bl-k.bef{color:#ff8a7a}.bl-k.aft{color:#9be36f}
.bl-cls{display:flex;align-items:center;gap:10px;margin:30px 0 6px;padding-bottom:6px;border-bottom:2px solid #b8743a;font:400 1.7rem/1 "Pirata One",var(--display);color:#fff5de;text-shadow:0 2px 0 #000}
.bl-cls img{width:34px;height:34px;image-rendering:pixelated}
.bl-sub{font:400 1.5rem/1.1 "Pirata One",var(--display);color:#fff5de;margin:24px 0 6px;text-shadow:0 2px 0 #000}
.bl-chg{margin:10px auto 20px;max-width:760px}.bl-chg img{display:block;width:100%;height:auto;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.5)}
.bl-chg figcaption{font-size:.9rem;color:var(--muted);line-height:1.4;text-align:center;margin-top:6px}
.bl-chg.bl-shot{max-width:380px;margin:6px auto 14px}.bl-chg.bl-shot.wide{max-width:700px}
.bl-chg.bl-shot img{border:2px solid #b8743a}
.bl-steps{margin:6px 0 12px;padding-left:1.3em}.bl-steps li{margin:5px 0}`;
function injectCSS(){if(document.getElementById("bl-css"))return;const st=document.createElement("style");st.id="bl-css";st.textContent=CSS;document.head.appendChild(st)}
const fmtDate=d=>{try{return new Date(d+"T12:00:00").toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"})}catch(e){return d}};

function viewList(){return`<div class="bl-wrap"><h1>Blog</h1><p class="lede">News from the Riverstead team: card changes, rules updates and events.</p>
  <div class="bl-list">${POSTS.map(p=>`<a class="bl-item" href="#blog/${p.slug}"><img src="${A(p.cover)}" alt="" loading="lazy"><div><span class="bl-date">${fmtDate(p.date)}</span><h2>${E(p.title)}</h2><p>${E(p.excerpt)}</p></div></a>`).join("")}</div></div>`}
function viewPost(p){return`<div class="bl-wrap"><a class="bl-back" href="#blog">← All posts</a>
  <header class="bl-hero" style="background-image:url('${A(p.cover)}')"><div><span class="bl-date">${fmtDate(p.date)}</span><h1>${E(p.title)}</h1></div></header>
  <article class="bl-body">${p.body()}</article></div>`}
function mount(v,slug){injectCSS();const p=slug&&POSTS.find(x=>x.slug===slug);
  v.innerHTML=slug&&!p?`<h1>Post not found</h1><p class="lede"><a href="#blog">Back to the blog</a></p>`:p?viewPost(p):viewList();
  if(p)document.title=p.title+" · Riverstead";else document.title="Blog · Riverstead"}

/* ---------- "What happened to my cards?!" for returning playtesters ----------
   Shown once per browser to anyone who had used the site before this visit (a saved guest id or decks) or who signs in. */
const SEEN="cq.seen.blog1";
let returning=false;try{returning=!!(localStorage.getItem("cq.gid")||localStorage.getItem("cq.decks")||localStorage.getItem("cq.draft"))}catch(e){}
const seen=()=>{try{return!!localStorage.getItem(SEEN)}catch(e){return true}};
let tries=0;
function popup(){if(seen())return;if(!(returning||(typeof S!=="undefined"&&S.uid))){if(++tries<4)setTimeout(popup,3000);return} /* sign-in finishes a moment after load */
  if(document.querySelector(".modal")||/^#(blog|learn)/.test(location.hash)){setTimeout(popup,4000);return}
  try{localStorage.setItem(SEEN,"1")}catch(e){}
  injectCSS();const m=document.createElement("div");m.className="modal bl-pop";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label","What happened to my cards?");
  m.innerHTML=`<div class="box"><h2>What happened to my cards?!</h2><div class="bl-pop-art"><img src="${A("art/banner/riverstead-1920.webp")}" alt=""></div>
    <p>We've moved the <b>Monk</b> class to <b>Set 2</b>, which gives us more time to cook. We've also trimmed every class down to <b>28 cards</b> and <b>5 Heroes</b> to curate the full Set 1 of Riverstead.</p>
    <div class="actions"><a class="btn primary go" href="#blog/curating-set-one" data-bl="read">Read the blog</a><button type="button" class="btn" data-bl="close">Close</button></div></div>`;
  m.addEventListener("click",e=>{if(e.target===m||e.target.closest("[data-bl]"))m.remove()});
  (document.getElementById("layer")||document.body).appendChild(m)}
setTimeout(popup,2500); /* after the tutorial offer (1.5s), which goes first; this one waits for any open pop-up */

window.CQBlog={mount,posts:POSTS,popup};
})();
