/* Riverstead Deck Forge: Blog (#blog, #blog/<slug>) and the "What happened to my cards?!" pop-up for returning playtesters.
   Posts live in POSTS below; card pictures are drawn with the site's own card renderer (cardHTML), so they always show current text. */
(function(){
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const A=p=>(typeof ICON_BASE!=="undefined"?ICON_BASE:"assets/")+p;
const V=()=>typeof ART_VER!=="undefined"?ART_VER:"1";
/* a card by name, including deprecated cards; drawn as a card image */
function card(name){try{const all=[...(typeof BYID!=="undefined"?BYID.values():[]),...(typeof DEP_BYID!=="undefined"?DEP_BYID.values():[])];
  const c=all.find(x=>x.name===name);return c&&typeof cardHTML==="function"?`<div class="bl-card">${cardHTML(c,{})}</div>`:""}catch(e){return""}}

const POSTS=[
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
.bl-pop .bl-pop-art img{width:100%;max-height:150px;object-fit:cover;border-radius:8px}`;
function injectCSS(){if(document.getElementById("bl-css"))return;const st=document.createElement("style");st.id="bl-css";st.textContent=CSS;document.head.appendChild(st)}
const fmtDate=d=>{try{return new Date(d+"T12:00:00").toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"})}catch(e){return d}};

function viewList(){return`<div class="bl-wrap"><h1>Blog</h1><p class="lede">News from the Riverstead team: card changes, rules updates and events.</p>
  <div class="bl-list">${POSTS.map(p=>`<a class="bl-item" href="#blog/${p.slug}"><img src="${A(p.cover)}" alt="" loading="lazy"><div><span class="bl-date">${fmtDate(p.date)}</span><h2>${E(p.title)}</h2><p>${E(p.excerpt)}</p></div></a>`).join("")}</div></div>`}
function viewPost(p){return`<div class="bl-wrap"><a class="bl-back" href="#blog">← All posts</a>
  <header class="bl-hero" style="background-image:url('${A(p.cover)}')"><div><span class="bl-date">${fmtDate(p.date)}</span><h1>${E(p.title)}</h1></div></header>
  <article class="bl-body">${p.body()}</article></div>`}
function mount(v,slug){injectCSS();const p=slug&&POSTS.find(x=>x.slug===slug);
  v.innerHTML=slug&&!p?`<h1>Post not found</h1><p class="lede"><a href="#blog">Back to the blog</a></p>`:p?viewPost(p):viewList();
  if(p)document.title=p.title+" · Riverstead";else document.title="Blog · Riverstead Deck Forge"}

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
