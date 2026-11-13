/* Crystal Quest Deck Forge: player profiles + Playtester Leaderboard (#leaderboard, #player/<name>).
   Profile = screen name + avatar (pixel head of a Hero) + public decks (decks are public unless marked Private).
   Playtest level (metal crest) comes only from complete games (3+ rounds, ended in a win, loss or draw); class badges count
   complete games with a Hero of that class. Score = 10 x games + 8 x classes tested + cards tested / 4.
   Database: "Profiles SQL" in the project (profiles table, decks.is_private, deck_results.claimed, claim_result()).
   Uses app.js globals (SB, S, HEROES, BYID, CLASSES, esc, toast, cc, artKey, ICON_BASE, ART_VER, canSee, go, render,
   deckFacesHTML, newId, saveDraft, confirmReplace, fixRenames). */
(function(){
"use strict";
const METALS=[["Copper",1],["Bronze",25],["Silver",75],["Gold",200],["Platinum",500],["Rhodium",1000]];
const BADGES=[["Apprentice",10],["Adept",50],["Master",250]];
const KEY_HERO={Barbarian:"Savage Raider",Bard:"Songweaver",Cleric:"Arnett Lifebinder",Druid:"Rootfolk Elder",Mage:"Arcane Scholar",Monk:"Sage Monk",Paladin:"Divine Knight",Ranger:"Shadow Ranger",Rogue:"Whisper Knife",Warlock:"Essence Reaper"};
const MIN_ROUNDS=3, W_GAMES=10, W_CLASS=8, CARD_DIV=4;
const RANK=ICON_BASE+"art/rank/", HEAD=ICON_BASE+"art/hero-head/";
const NAME_RE=/^[A-Za-z0-9][A-Za-z0-9 _.\-]{1,18}[A-Za-z0-9]$/;
const D={rows:null,profiles:null,loading:false,err:null,at:0,me:undefined,pub:{}};
const E=s=>esc(s==null?"":s);
const fmt=n=>Number(n||0).toLocaleString();

const CSS=`.pf-note{color:var(--muted);font-size:.88rem}
.pf-t{border-collapse:collapse;width:100%;font-size:.92rem}
.pf-t th,.pf-t td{padding:7px 6px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}
.pf-t th{font-size:.76rem;text-transform:uppercase;letter-spacing:.03em;color:var(--muted);white-space:nowrap}
.pf-t td.n,.pf-t th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.pf-t tr.me td{background:rgba(255,200,60,.08)}
.pf-scroll{overflow-x:auto}
.pf-who{display:inline-flex;align-items:center;gap:10px;color:inherit;text-decoration:none;font-weight:700;min-width:0}
.pf-who:hover span{text-decoration:underline}
.pf-av{width:40px;height:40px;border-radius:10px;overflow:hidden;flex:none;border:2px solid var(--cc,#777);background:var(--sunk);display:block}
.pf-av img{display:block;width:100%;height:100%;image-rendering:pixelated}
.pf-av.lg{width:112px;height:112px;border-radius:18px;border-width:4px}
.pf-crest{position:relative;display:inline-block;flex:none;line-height:0}
.pf-crest img{width:100%;height:100%;image-rendering:pixelated}
.pf-crest.opal::after{content:"";position:absolute;inset:0;-webkit-mask:var(--m) center/100% 100% no-repeat;mask:var(--m) center/100% 100% no-repeat;
  background:linear-gradient(115deg,transparent 25%,rgba(255,170,220,.55) 38%,rgba(170,255,225,.55) 46%,rgba(180,190,255,.6) 54%,rgba(255,240,170,.5) 62%,transparent 75%) 0 0/300% 100%;
  mix-blend-mode:screen;animation:pfOpal 3.6s linear infinite;pointer-events:none}
@keyframes pfOpal{from{background-position:100% 0}to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.pf-crest.opal::after{animation:none;background-position:50% 0}}
.pf-metal{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.pf-bdg{display:inline-flex;gap:2px;flex-wrap:wrap}
.pf-bdg img{width:30px;height:30px;image-rendering:pixelated}
.pf-head{display:flex;flex-wrap:wrap;align-items:center;gap:18px;margin:4px 0 18px}
.pf-head h1{margin:0}
.pf-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin:0 0 18px}
.pf-kpi{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.pf-kpi b{display:block;font-size:1.5rem;line-height:1.15;font-variant-numeric:tabular-nums}
.pf-kpi span{display:block;color:var(--muted);font-size:.82rem}
.pf-bar{height:8px;background:var(--sunk);border-radius:99px;overflow:hidden;margin-top:6px}
.pf-bar i{display:block;height:100%;background:var(--accent,#d6a400)}
.pf-cls{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:0 0 18px}
.pf-cl{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center}
.pf-cl img{width:72px;height:72px;image-rendering:pixelated;display:block;margin:0 auto 4px}
.pf-cl.off img{filter:grayscale(1) brightness(.6);opacity:.55}
.pf-cl b{display:block}.pf-cl span{display:block;color:var(--muted);font-size:.8rem}
.pf-decks{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,290px),1fr));gap:12px}
.pf-deck{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px}
.pf-deck h3{margin:0;font-size:1.05rem}
.pf-steps{display:flex;gap:6px;margin:0 0 10px}.pf-steps span{flex:1;height:5px;border-radius:9px;background:var(--sunk)}.pf-steps span.on{background:var(--accent,#d6a400)}
.pf-avgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px;max-height:46vh;overflow:auto;padding:6px}
.pf-avbtn{all:unset;box-sizing:border-box;cursor:pointer;border-radius:10px;border:3px solid transparent;line-height:0;background:var(--sunk)}
.pf-avbtn img{width:100%;aspect-ratio:1;image-rendering:pixelated;border-radius:7px}
.pf-avbtn[aria-pressed="true"]{border-color:var(--accent,#ffc100);box-shadow:0 0 0 2px rgba(0,0,0,.4)}
.pf-avbtn:focus-visible{outline:2px solid var(--accent,#ffc100);outline-offset:2px}
.pf-dl{display:flex;flex-direction:column;gap:6px;max-height:46vh;overflow:auto}
.pf-dl label{display:flex;gap:10px;align-items:center;padding:6px 8px;border:1px solid var(--line);border-radius:8px}
.pf-err{color:#e2504a;font-size:.86rem;min-height:1.2em;margin:4px 0 0}
.pf-modal .box{max-width:640px}
.pf-priv{white-space:nowrap}`;
function injectCSS(){if(document.getElementById("pf-css"))return;const s=document.createElement("style");s.id="pf-css";s.textContent=CSS;document.head.appendChild(s)}

/* ---------- helpers ---------- */
const heroByName=new Map(HEROES.map(h=>[h.name,h]));
function avatarHero(key){const h=heroByName.get(String(key||"").replace(/_/g," "))||HEROES.find(x=>artKey(x.name)===key);return h&&canSee(h)?h:null}
function avatarHTML(key,cls=""){const h=avatarHero(key)||heroByName.get("Savage Raider")||HEROES[0];
  return`<span class="pf-av ${cls}" style="--cc:${cc(h.cls)}"><img src="${HEAD}${artKey(h.name)}.png?v=${ART_VER}" alt="" width="88" height="88" loading="lazy" decoding="async"></span>`}
function metalFor(g){let m=null;for(const x of METALS)if(g>=x[1])m=x;return m}
function nextMetal(g){return METALS.find(x=>g<x[1])||null}
function crestHTML(name,px){const src=`${RANK}crest-${name.toLowerCase()}.png?v=${ART_VER}`;
  return`<span class="pf-crest${name==="Rhodium"?" opal":""}" style="width:${px}px;height:${px}px;--m:url('${src}')" title="${name} playtester"><img src="${src}" alt="${name} crest" width="64" height="64"></span>`}
function badgeLevel(n){let b=null;for(const x of BADGES)if(n>=x[1])b=x;return b}
function badgeSrc(cls,lvl){return`${RANK}badge-${cls.toLowerCase()}-${lvl.toLowerCase()}.png?v=${ART_VER}`}
const score=p=>W_GAMES*p.games+W_CLASS*p.classes.size+p.cards.size/CARD_DIV;
const profileUrl=name=>"#player/"+encodeURIComponent(name);

/* ---------- data ---------- */
async function load(force){if(D.loading||(!force&&D.rows&&Date.now()-D.at<60000))return;D.loading=true;D.err=null;rerender();
  try{let cols="game_id,side,created_at,heroes,cards,player_name,user_id,mode,result,rounds,claimed",out=[],from=0;
    for(;;){let{data,error}=await SB.from("deck_results").select(cols).not("user_id","is",null).gte("rounds",MIN_ROUNDS).order("id",{ascending:true}).range(from,from+999);
      if(error&&/claimed/.test(error.message)&&/claimed/.test(cols)){cols=cols.replace(",claimed","");out=[];from=0;continue}
      if(error)throw error;out=out.concat(data||[]);if(!data||data.length<1000)break;from+=1000;if(from>500000)break}
    D.rows=out;
    let{data:pr,error:pe}=await SB.from("profiles").select("user_id,screen_name,avatar,discord_name,discord_public");
    if(pe&&/discord/.test(pe.message||"")){({data:pr,error:pe}=await SB.from("profiles").select("user_id,screen_name,avatar"))}
    D.profiles=new Map((pe?[]:pr||[]).map(p=>[p.user_id,p]));D.noProfiles=!!pe;D.at=Date.now()}
  catch(e){D.err=e.message||String(e)}
  D.loading=false;rerender()}
/* one entry per player: complete games only; online guest rows count once claimed (old rows written by the host for the guest don't) */
function players(){const P=new Map();if(!D.rows)return[];
  for(const r of D.rows){if(!["win","loss","draw"].includes(r.result)||(r.rounds||0)<MIN_ROUNDS)continue;
    if(r.mode==="online"&&r.side!==0&&!r.claimed)continue;
    let p=P.get(r.user_id);if(!p){p={uid:r.user_id,name:r.player_name||"Player",games:0,gids:new Set(),classes:new Set(),cards:new Set(),byCls:{},wins:0,last:null};P.set(r.user_id,p)}
    if(p.gids.has(r.game_id))continue;p.gids.add(r.game_id);p.games++;if(r.result==="win")p.wins++;
    if(!p.last||r.created_at>p.last){p.last=r.created_at;p.name=r.player_name||p.name}
    const seen=new Set();(r.heroes||[]).forEach(id=>{const h=BYID.get(id)||BYID.get("h:"+id);if(!h||!CLASSES.includes(h.cls))return;p.classes.add(h.cls);seen.add(h.cls)});
    seen.forEach(c=>p.byCls[c]=(p.byCls[c]||0)+1);
    Object.entries(r.cards||{}).forEach(([k,q])=>{if(q>0&&BYID.has(k)&&BYID.get(k).kind!=="hero")p.cards.add(k)})}
  const out=[...P.values()];out.forEach(p=>{const pr=D.profiles&&D.profiles.get(p.uid);if(pr){p.name=pr.screen_name;p.avatar=pr.avatar;p.hasProfile=true;p.discord=pr.discord_public!==false?pr.discord_name||null:null}p.score=score(p)});
  out.sort((a,b)=>b.score-a.score||(b.last||"").localeCompare(a.last||""));out.forEach((p,i)=>p.rank=i+1);return out}

/* ---------- views ---------- */
function rerender(){if(["leaderboard","player"].includes(S.view))mount(document.getElementById("view"))}
function mount(v){injectCSS();if(!v)return;
  if(!SB){v.innerHTML='<h1>Leaderboard</h1><p class="lede">Player accounts aren\'t switched on for this site yet.</p>';return}
  if(!D.rows&&!D.loading&&!D.err)load();
  v.innerHTML=S.view==="player"?viewPlayer():viewBoard()}
function topBadges(p,n){return Object.entries(p.byCls).map(([c,g])=>[c,g,badgeLevel(g)]).filter(x=>x[2]).sort((a,b)=>b[1]-a[1]).slice(0,n)
  .map(([c,g,b])=>`<img src="${badgeSrc(c,b[0])}" alt="${c} ${b[0]}" title="${c} ${b[0]} · ${g} games" width="72" height="72" loading="lazy">`).join("")}
function viewBoard(){
  const head=`<h1>Playtester Leaderboard</h1>
  <p class="lede">Every complete game you play (3+ rounds, vs the AI or online) moves you up. Score = 10 × games + 8 × classes tested + cards tested ÷ 4, so games count the most.</p>
  <div class="bar">${S.uid?`<a class="btn sm primary" href="${myProfileHref()}">Your profile</a>`:`<a class="btn sm primary" href="#account">Sign in to join</a>`}<a class="btn sm" href="#play">Play a game</a><button type="button" class="btn sm" data-pf="refresh">Refresh</button></div>`;
  if(D.err)return head+`<p class="lede">Couldn't load the leaderboard: ${E(D.err)}</p>`;
  if(!D.rows)return head+`<p class="lede">Loading…</p>`;
  const ps=players();
  if(!ps.length)return head+`<div class="empty">No complete games from signed-in players yet. Play one to take the top spot.</div>`;
  return head+`<div class="pf-scroll"><table class="pf-t"><thead><tr><th class="n">#</th><th>Player</th><th>Level</th><th class="n">Score</th><th class="n">Games</th><th class="n">Classes</th><th class="n">Cards</th><th>Badges</th></tr></thead><tbody>
  ${ps.map(p=>{const m=metalFor(p.games);return`<tr${p.uid===S.uid?' class="me"':""}><td class="n">${p.rank}</td>
    <td><a class="pf-who" href="${profileUrl(p.name)}">${avatarHTML(p.avatar)}<span>${E(p.name)}${p.discord?`<small class="pf-dc">@${E(p.discord)}</small>`:""}</span></a></td>
    <td>${m?`<span class="pf-metal">${crestHTML(m[0],36)}<span>${m[0]}</span></span>`:"–"}</td>
    <td class="n"><b>${fmt(Math.round(p.score*100)/100)}</b></td><td class="n">${fmt(p.games)}</td><td class="n">${p.classes.size}/${CLASSES.length}</td><td class="n">${fmt(p.cards.size)}</td>
    <td><span class="pf-bdg">${topBadges(p,4)||'<span class="pf-note">–</span>'}</span></td></tr>`}).join("")}
  </tbody></table></div>
  <h2>Levels</h2><div class="pf-kpis">${METALS.map(([n,g])=>`<div class="pf-kpi" style="display:flex;gap:10px;align-items:center">${crestHTML(n,48)}<div><b style="font-size:1.05rem">${n}</b><span>${fmt(g)} game${g>1?"s":""}</span></div></div>`).join("")}</div>
  <p class="pf-note">Class badges: Apprentice at ${BADGES[0][1]}, Adept at ${BADGES[1][1]} and Master at ${BADGES[2][1]} complete games with a Hero of that class in your party.</p>`}
function myProfileHref(){const me=D.me||(D.profiles&&D.profiles.get(S.uid));return me?profileUrl(me.screen_name):"#player/me"}
function viewPlayer(){
  let key=S.playerName||"";
  if(key==="me"){const me=D.me||(D.profiles&&D.profiles.get(S.uid));if(me)key=me.screen_name;else if(S.uid&&D.me===null){setTimeout(()=>openSetup(false),0);return`<h1>Your profile</h1><p class="lede">Set up your profile to get started.</p>`}}
  if(D.err)return`<h1>Player</h1><p class="lede">Couldn't load: ${E(D.err)}</p>`;
  if(!D.rows)return`<h1>Player</h1><p class="lede">Loading…</p>`;
  const ps=players();const lk=key.toLowerCase();
  let p=ps.find(x=>x.name.toLowerCase()===lk);let pr=D.profiles&&[...D.profiles.values()].find(x=>x.screen_name.toLowerCase()===lk);
  if(!p&&pr)p={uid:pr.user_id,name:pr.screen_name,avatar:pr.avatar,discord:pr.discord_public!==false?pr.discord_name||null:null,games:0,classes:new Set(),cards:new Set(),byCls:{},wins:0,score:0,rank:null,hasProfile:true};
  if(!p)return`<h1>Player not found</h1><p class="lede">No player called ${E(key)}. <a href="#leaderboard">Back to the leaderboard</a></p>`;
  if(!pr&&D.profiles)pr=D.profiles.get(p.uid);
  const m=metalFor(p.games),nx=nextMetal(p.games),prev=m?m[1]:0;
  const prog=nx?Math.min(100,Math.round(100*(p.games-prev)/(nx[1]-prev))):100;
  const mine=p.uid===S.uid;
  if(!D.pub[p.uid])loadPublicDecks(p.uid);
  const decks=Array.isArray(D.pub[p.uid])&&typeof showRow==="function"?D.pub[p.uid].filter(showRow):D.pub[p.uid]; /* Trials: hide decks with cards this viewer can't see */
  return`<div class="pf-head">${avatarHTML(p.avatar,"lg")}<div><h1>${E(p.name)}</h1>${p.discord?`<div class="pf-dc-chip">Discord @${E(p.discord)}</div>`:""}
    <div class="pf-metal" style="margin-top:6px">${m?crestHTML(m[0],56):""}<span><b>${m?m[0]+" playtester":"No complete games yet"}</b>${p.rank?` · Rank #${p.rank}`:""}</span></div>
    ${nx?`<div class="pf-note" style="margin-top:6px">${fmt(nx[1]-p.games)} more complete game${nx[1]-p.games>1?"s":""} to ${nx[0]}</div><div class="pf-bar" style="max-width:280px"><i style="width:${prog}%"></i></div>`:""}
    ${mine?`<div class="bar" style="margin-top:10px"><button type="button" class="btn sm" data-pf="edit">Edit profile</button><a class="btn sm" href="#decks">Manage decks</a></div>`:""}</div></div>
  <div class="pf-kpis"><div class="pf-kpi"><b>${fmt(Math.round(p.score*100)/100)}</b><span>Playtester score</span></div><div class="pf-kpi"><b>${fmt(p.games)}</b><span>Complete games</span></div>
    <div class="pf-kpi"><b>${p.classes.size}/${CLASSES.length}</b><span>Classes tested</span></div><div class="pf-kpi"><b>${fmt(p.cards.size)}</b><span>Cards tested</span></div>
    <div class="pf-kpi"><b>${p.games?Math.round(100*p.wins/p.games)+"%":"–"}</b><span>Wins</span></div></div>
  ${mine&&window.CQVol?CQVol.panel("Sound"):""}<h2>Class badges</h2><div class="pf-cls">${CLASSES.map(c=>{const g=p.byCls[c]||0,b=badgeLevel(g),nb=BADGES.find(x=>g<x[1]);
    return`<div class="pf-cl${b?"":" off"}"><img src="${badgeSrc(c,(b||BADGES[0])[0])}" alt="${c} ${b?b[0]:"badge (locked)"}" width="72" height="72" loading="lazy"><b>${c}${b?" "+b[0]:""}</b><span>${fmt(g)} game${g===1?"":"s"}${nb?` · ${nb[1]-g} to ${nb[0]}`:""}</span></div>`}).join("")}</div>
  <h2>Public decks</h2>${decks===undefined||decks==="loading"?'<p class="pf-note">Loading decks…</p>':decks.err?`<p class="pf-note">Couldn't load decks: ${E(decks.err)}</p>`:!decks.length?'<p class="pf-note">No public decks.</p>':
  `<div class="pf-decks">${decks.map(d=>`<div class="pf-deck"><h3>${E(d.name)}</h3>${deckFacesHTML(d.heroes.map(h=>BYID.get(h)).filter(Boolean))}
    <div class="actions"><button type="button" class="btn sm primary" data-pf="open" data-uid="${E(p.uid)}" data-id="${E(d.id)}">Open in Deck Builder</button></div></div>`).join("")}</div>`}`}
async function loadPublicDecks(uid){D.pub[uid]="loading";
  const{data,error}=await SB.from("decks").select("id,name,heroes,cards,updated_at,is_private").eq("user_id",uid).eq("is_private",false).order("updated_at",{ascending:false}).limit(60);
  D.pub[uid]=error?{err:error.message}:(data||[]).map(r=>{const d={id:r.id,name:r.name||"Untitled deck",heroes:r.heroes||[],cards:r.cards||{}};fixRenames(d);return d});rerender()}

/* ---------- my profile + first-visit setup ---------- */
async function loadMe(){if(!SB||!S.uid)return;const uid=S.uid;
  const{data,error}=await SB.from("profiles").select("user_id,screen_name,avatar,decks_reviewed,discord_name,discord_public").eq("user_id",uid).maybeSingle();
  if(uid!==S.uid)return;if(error){D.me=undefined;return}/* table missing (SQL not run yet): stay quiet */
  D.me=data||null;try{renderAcct();if(S.view==="account")render()}catch(e){}
  /* Update 30: copy the Discord name onto the profile so the Leaderboard and profile page can show it */
  const dn=S.me&&S.me.discord||null;if(D.me&&(D.me.discord_name||null)!==dn)SB.from("profiles").update({discord_name:dn}).eq("user_id",uid).then(({error})=>{if(!error)D.at=0});
  if(!D.me||!D.me.decks_reviewed)setTimeout(()=>{if(S.uid===uid&&!document.getElementById("pf-setup")&&S.view!=="play")openSetup(true)},400)}
window.CQProfDiscordPublic=async v=>{if(!SB||!S.uid)return false;const{error}=await SB.from("profiles").update({discord_public:!!v}).eq("user_id",S.uid);if(!error&&D.me){D.me.discord_public=!!v;D.at=0}return!error};
function onSession(){D.me=undefined;D.pub={};if(S.uid)loadMe()}
let F=null;
function openSetup(first){if(!S.uid||document.getElementById("pf-setup"))return;injectCSS();
  const me=D.me||{};F={first,step:me.screen_name&&first?(me.decks_reviewed?1:2):0,name:me.screen_name||String((S.me&&S.me.name)||"").replace(/[^A-Za-z0-9 _.\-]/g,"").slice(0,20),avatar:me.avatar||"",priv:new Set((S.decks||[]).filter(d=>d.priv).map(d=>String(d.id))),err:""};
  const l=document.getElementById("layer");const m=document.createElement("div");m.className="modal pf-modal";m.id="pf-setup";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label","Your player profile");
  l.appendChild(m);drawSetup()}
const VIS_HEROES=()=>HEROES.filter(h=>canSee(h)).slice().sort((a,b)=>a.cls.localeCompare(b.cls)||a.name.localeCompare(b.name));
function drawSetup(){const m=document.getElementById("pf-setup");if(!m)return;const st=F.step;
  const steps=`<div class="pf-steps">${[0,1,2].map(i=>`<span class="${i<=st?"on":""}"></span>`).join("")}</div>`;
  let body="";
  if(st===0)body=`<h2>Pick your screen name</h2><p class="pf-note">This is how you show up on the Leaderboard and your profile. 3–20 letters, numbers, spaces, dots, dashes or underscores.</p>
    <label class="field col" for="pf-name">Screen name<input id="pf-name" type="text" maxlength="20" autocomplete="nickname" value="${E(F.name)}"></label>`;
  if(st===1)body=`<h2>Choose your avatar</h2><p class="pf-note">Pick a Hero portrait.</p><div class="pf-avgrid" role="group" aria-label="Avatars">${VIS_HEROES().map(h=>{const k=artKey(h.name);
    return`<button type="button" class="pf-avbtn" data-pf="av" data-k="${k}" aria-pressed="${F.avatar===k}" title="${E(h.name)} · ${E(h.cls)}" style="--cc:${cc(h.cls)}"><img src="${HEAD}${k}.png?v=${ART_VER}" alt="${E(h.name)}" width="88" height="88" loading="lazy"></button>`}).join("")}</div>`;
  if(st===2){const ds=S.decks||[];body=`<h2>Your decks are public</h2><p class="pf-note">Decks show on your profile so other players can copy them. Tick any you want to keep private. You can change this any time on My Decks.</p>
    ${ds.length?`<div class="pf-dl">${ds.map(d=>`<label><input type="checkbox" data-pf="priv" data-id="${E(d.id)}"${F.priv.has(String(d.id))?" checked":""}><span><b>${E(d.name)}</b> <span class="pf-note">· ${F.priv.has(String(d.id))?"Private":"Public"}</span></span></label>`).join("")}</div>`:'<p class="pf-note">You have no saved decks yet. New decks will be public unless you mark them private.</p>'}`}
  m.innerHTML=`<div class="box">${steps}${body}<p class="pf-err" role="alert">${E(F.err)}</p>
    <div class="actions">${st>0?'<button type="button" class="btn" data-pf="back">Back</button>':""}<button type="button" class="btn primary" data-pf="next">${st<2?"Next":"Finish"}</button>${F.first?'<button type="button" class="btn" data-pf="later">Later</button>':'<button type="button" class="btn" data-pf="close">Cancel</button>'}</div></div>`;
  const inp=m.querySelector("#pf-name");if(inp){inp.focus();inp.addEventListener("input",()=>{F.name=inp.value})}}
async function setupNext(){F.err="";
  if(F.step===0){const n=F.name.trim().replace(/\s+/g," ");if(!NAME_RE.test(n)){F.err="Use 3–20 letters, numbers, spaces, dots, dashes or underscores (start and end with a letter or number).";return drawSetup()}
    const{data}=await SB.from("profiles").select("user_id").ilike("screen_name",n.replace(/[%_\\]/g,"\\$&")).limit(1);
    if(data&&data.length&&data[0].user_id!==S.uid){F.err="That name is taken. Try another.";return drawSetup()}F.name=n;F.step=1;return drawSetup()}
  if(F.step===1){if(!F.avatar){F.err="Pick an avatar.";return drawSetup()}F.step=2;return drawSetup()}
  const btn=document.querySelector('#pf-setup [data-pf="next"]');if(btn)btn.disabled=true;
  const row={user_id:S.uid,screen_name:F.name,avatar:F.avatar,decks_reviewed:true,updated_at:new Date().toISOString(),...(S.me&&S.me.discord?{discord_name:S.me.discord}:{})};
  const{error}=await SB.from("profiles").upsert(row);
  if(error){F.err=/duplicate|unique/i.test(error.message)?"That name is taken. Try another.":"Couldn't save: "+error.message;if(/duplicate|unique/i.test(error.message))F.step=0;return drawSetup()}
  const ds=S.decks||[];const want=d=>F.priv.has(String(d.id));const ch=ds.filter(d=>!!d.priv!==want(d));
  for(const d of ch){const{error:e}=await SB.from("decks").update({is_private:want(d)}).eq("id",d.id);if(!e)d.priv=want(d)}
  D.me={...row};if(D.profiles)D.profiles.set(S.uid,{user_id:S.uid,screen_name:F.name,avatar:F.avatar});try{renderAcct();if(S.view==="account")render()}catch(e){}
  document.getElementById("pf-setup")?.remove();toast("Profile saved.");
  if(S.view==="player"){S.playerName=F.name;location.hash=profileUrl(F.name).slice(1)}else if(S.view==="leaderboard"||S.view==="decks")render()}
async function setPrivate(id,on){const d=(S.decks||[]).find(x=>String(x.id)===String(id));if(!d)return;
  const{error}=await SB.from("decks").update({is_private:on}).eq("id",d.id);
  if(error){toast(/is_private/.test(error.message)?"Private decks aren't switched on yet.":"Couldn't change that deck: "+error.message);return}
  d.priv=on;delete D.pub[S.uid];toast(on?"Deck is now private.":"Deck is now public on your profile.");render()}

document.addEventListener("click",e=>{const b=e.target.closest("[data-pf]");if(!b)return;const a=b.dataset.pf;
  if(a==="refresh"){load(true)}
  else if(a==="edit"){openSetup(false)}
  else if(a==="av"){F.avatar=b.dataset.k;document.querySelectorAll('#pf-setup .pf-avbtn').forEach(x=>x.setAttribute("aria-pressed",String(x===b)));F.err="";const er=document.querySelector("#pf-setup .pf-err");if(er)er.textContent=""}
  else if(a==="priv"){const id=b.dataset.id;if(b.checked)F.priv.add(id);else F.priv.delete(id);const s=b.parentElement.querySelector(".pf-note");if(s)s.textContent="· "+(b.checked?"Private":"Public")}
  else if(a==="next"){setupNext()}
  else if(a==="back"){F.step=Math.max(0,F.step-1);F.err="";drawSetup()}
  else if(a==="later"||a==="close"){document.getElementById("pf-setup")?.remove()}
  else if(a==="private"){setPrivate(b.dataset.id,b.dataset.on==="1")}
  else if(a==="open"){const list=D.pub[b.dataset.uid];const d=Array.isArray(list)&&list.find(x=>String(x.id)===b.dataset.id);if(!d)return;
    if(S.dirty&&!confirmReplace())return;S.deck={id:newId(),name:d.name+" (copy)",heroes:d.heroes.slice(),cards:{...d.cards}};S.dirty=true;S.b.step="cards";saveDraft();go("build");toast("Deck copied into the Deck Builder. Press Save deck to keep it.")}
});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target&&e.target.id==="pf-name"){e.preventDefault();setupNext()}});
/* My Decks: Public / Private button on each deck (account decks only) */
function privButton(d){if(S.mode!=="account"||!SB||typeof d.priv!=="boolean")return"";
  return`<button type="button" class="btn sm pf-priv" data-pf="private" data-id="${E(d.id)}" data-on="${d.priv?"0":"1"}" title="${d.priv?"Only you can see this deck. Click to make it public.":"Shown on your public profile. Click to make it private."}">${d.priv?"Private":"Public"}</button>`}

window.CQProf={mount,onSession,openSetup,privButton,load,_D:D,_players:players};
if(typeof S!=="undefined"&&S.uid)onSession();
/* app.js may have drawn this page before this file loaded */
if(typeof S!=="undefined"&&["leaderboard","player"].includes(S.view))mount(document.getElementById("view"));
})();
