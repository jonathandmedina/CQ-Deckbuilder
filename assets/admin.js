/* Crystal Quest Deck Forge: Admin page (#admin). Only admins see the menu link and the page.
   Playtesting dashboard (Games, Heroes, Cards) is built from deck_results (one row per deck per finished Play-tab game).
   Users: make admins and give Set 2 access (Supabase RPCs admin_list_users / admin_set_admin / admin_set_set2).
   Database setup: "Admin Panel SQL" in the project. Uses app.js globals (SB, S, HEROES, CARDS, BYID, esc, toast, cc, artKey, ICON_BASE, ART_VER, RENAMES, canSee). */
(function(){
"use strict";
const CSS=`.ad-tabs{margin:6px 0 14px}.ad-sub{margin:0 0 14px}
.ad-bar{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:flex-end;margin:0 0 14px}
.ad-bar .field{min-width:130px}.ad-chk{display:flex;gap:6px;align-items:center;padding-bottom:8px;white-space:nowrap}
.ad-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:0 0 18px}
.ad-kpi{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.ad-kpi b{display:block;font-size:1.55rem;line-height:1.15;font-variant-numeric:tabular-nums}
.ad-kpi span{display:block;color:var(--muted);font-size:.82rem}.ad-kpi small{display:block;color:var(--muted);font-size:.75rem;margin-top:2px}
.ad-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:16px;margin:0 0 18px}
.ad-card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;min-width:0}
.ad-card h2{font-size:1.1rem;margin:0 0 2px}.ad-card .ad-note{margin:0 0 10px}
.ad-note{color:var(--muted);font-size:.85rem}
.ad-t{border-collapse:collapse;width:100%;font-size:.88rem}
.ad-t th,.ad-t td{padding:6px 6px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}
.ad-t th{font-weight:700;color:var(--muted);font-size:.78rem;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap}
.ad-t td.n,.ad-t th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.ad-t tr:last-child td{border-bottom:0}
.ad-t th[data-ad-sort]{cursor:pointer}.ad-t th[data-ad-sort]:hover{color:inherit}
.ad-scroll{overflow-x:auto}
.ad-nm{display:inline-flex;align-items:center;gap:8px;background:none;border:0;padding:0;color:inherit;font:inherit;cursor:pointer;text-align:left}
.ad-nm:hover span{text-decoration:underline}
.ad-av{width:30px;height:30px;border-radius:7px;overflow:hidden;flex:none;border:2px solid var(--cc);background:var(--sunk)}
.ad-av img{width:100%;height:100%;object-fit:cover;object-position:50% 18%;image-rendering:pixelated}
.ad-dot{width:10px;height:10px;border-radius:50%;background:var(--cc);flex:none}
.ad-barc{position:relative;height:8px;background:var(--sunk);border-radius:99px;min-width:60px;overflow:hidden}
.ad-barc i{position:absolute;inset:0 auto 0 0;background:var(--accent);border-radius:99px}
.ad-hist{display:flex;align-items:flex-end;gap:4px;height:120px;padding-top:6px}
.ad-hist div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:0}
.ad-hist i{display:block;width:100%;background:var(--accent);border-radius:4px 4px 0 0;min-height:1px}
.ad-hist em{font-style:normal;font-size:.7rem;color:var(--muted);margin-top:3px;white-space:nowrap}
.ad-hist b{font-size:.7rem;font-weight:600;margin-bottom:2px;font-variant-numeric:tabular-nums}
.ad-up{color:#1f8a4c;font-weight:700}.ad-dn{color:#c0392b;font-weight:700}
.ad-tag{display:inline-block;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:1px 7px;border-radius:999px;border:1px solid currentColor;color:var(--muted);white-space:nowrap}
.ad-tag.hot{color:#c46a12}.ad-tag.cold{color:#5b6fd6}
.ad-chips{display:flex;flex-wrap:wrap;gap:6px}.ad-chips .ad-nm{font-size:.82rem;border:1px solid var(--line);border-radius:999px;padding:2px 9px}
.ad-form{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-top:10px}
.ad-form input[type=text]{min-width:180px}
.ad-users td{white-space:nowrap}.ad-users td.em{white-space:normal;word-break:break-all;color:var(--muted);font-size:.82rem}
.ad-sw{display:inline-flex;align-items:center;gap:6px;cursor:pointer}.ad-sw input{width:18px;height:18px}
.ad-empty{color:var(--muted);padding:6px 0}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:640px){.ad-kpi b{font-size:1.3rem}.ad-hide-sm{display:none}}`;

const st={tab:"play",sec:"games",days:"30",mode:"all",complete:true,minG:5,sort:{hero:["games",-1]},uq:""};
try{Object.assign(st,JSON.parse(localStorage.getItem("cq.admin")||"{}"))}catch(e){}
const save=()=>{try{localStorage.setItem("cq.admin",JSON.stringify({tab:st.tab,sec:st.sec,days:st.days,mode:st.mode,complete:st.complete,minG:st.minG}))}catch(e){}};
const D={rows:null,err:null,loading:false,at:0,noTime:false,watch:null,watchErr:null,users:null,usersErr:null};
let root=null;

function injectCSS(){if(document.getElementById("ad-css"))return;const s=document.createElement("style");s.id="ad-css";s.textContent=CSS;document.head.appendChild(s)}

/* ---------- loading ---------- */
const COLS="game_id,side,created_at,heroes,cards,player_name,user_id,mode,result,rounds,stats";
async function loadRows(){if(D.loading)return;D.loading=true;D.err=null;
  try{let cols=COLS+",started_at,ended_at,active_secs",out=[],from=0;
    for(;;){let{data,error}=await SB.from("deck_results").select(cols).order("id",{ascending:true}).range(from,from+999);
      if(error&&/started_at|ended_at|active_secs/.test(error.message)&&cols!==COLS){cols=COLS;D.noTime=true;out=[];from=0;continue}
      if(error)throw error;out=out.concat(data||[]);if(!data||data.length<1000)break;from+=1000;if(from>200000)break}
    D.rows=out;D.at=Date.now()}catch(e){D.err=e.message||String(e)}
  D.loading=false;rerender()}
async function loadWatch(){const{data,error}=await SB.from("watch_list").select("name,kind,note,added_at").order("added_at",{ascending:true});
  D.watch=error?[]:data;D.watchErr=error?error.message:null;rerender()}
async function loadUsers(){D.usersErr=null;const{data,error}=await SB.rpc("admin_list_users");
  D.users=error?[]:data||[];D.usersErr=error?error.message:null;rerender()}

/* ---------- helpers ---------- */
const E=s=>esc(s==null?"":s);
const fmt=n=>n==null||isNaN(n)?"–":Number(n).toLocaleString();
const pct=(a,b)=>b?Math.round(1000*a/b)/10:null;
const pctS=v=>v==null?"–":v.toFixed(1)+"%";
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const median=a=>{if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const mins=sec=>sec==null?"–":(sec<3600?Math.round(sec/60)+" min":(Math.floor(sec/3600)+" h "+String(Math.round(sec%3600/60)).padStart(2,"0")+" min"));
const ago=d=>{if(!d)return"–";const t=(Date.now()-Date.parse(d))/1000;if(t<3600)return Math.max(1,Math.round(t/60))+" min ago";if(t<86400)return Math.round(t/3600)+" h ago";if(t<86400*14)return Math.round(t/86400)+" d ago";return new Date(d).toLocaleDateString()};
const day=d=>{const x=new Date(d);return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")};
const fixName=n=>{n=String(n||"").replace(/^h:/,"");return(typeof RENAMES!=="undefined"&&RENAMES[n])||n};
const heroOf=n=>BYID.get("h:"+fixName(n));
const cardOf=n=>BYID.get(fixName(n));
/* Bayesian shrink toward the baseline so a 2-0 card doesn't top the list: (wins + K*base)/(games + K) */
const K=10;
const shrunk=(w,g,base)=>(w+K*base)/(g+K);
function nameBtn(c,name,opt){opt=opt||{};const nm=c?c.name:name;const cls=c?c.cls:"Generic";
  const av=opt.av&&c&&c.kind==="hero"?`<span class="ad-av" style="--cc:${cc(cls)}"><img src="${ICON_BASE}art/hero-pix/${artKey(c.name)}-pix.png?v=${ART_VER}" alt="" loading="lazy" decoding="async" onerror="this.remove()"></span>`:`<span class="ad-dot" style="--cc:${cc(cls)}"></span>`;
  const tag=c&&c.set===2?' <span class="ad-tag">Set 2</span>':"";
  return c?`<button type="button" class="ad-nm" data-act="inspect" data-id="${E(c.id)}" title="${E(nm)} · ${E(cls)}">${av}<span>${E(nm)}</span>${tag}</button>`:`<span class="ad-nm">${av}<span>${E(nm)}</span> <span class="ad-tag">not in the card list</span></span>`}
const bar=(v,max)=>`<div class="ad-barc" aria-hidden="true"><i style="width:${max?Math.max(2,100*v/max):0}%"></i></div>`;
const kpi=(v,l,s)=>`<div class="ad-kpi"><b>${v}</b><span>${l}</span>${s?`<small>${s}</small>`:""}</div>`;
function hist(items){const max=Math.max(1,...items.map(x=>x[1]));
  return`<div class="ad-hist" role="img" aria-label="${E(items.map(x=>x[0]+": "+x[1]).join(", "))}">${items.map(([l,v])=>`<div><b>${v||""}</b><i style="height:${v?Math.max(2,100*v/max):0}%"></i><em>${E(l)}</em></div>`).join("")}</div>`}

/* ---------- filtered data ---------- */
function filtered(){const rows=D.rows||[];const cut=st.days==="all"?0:Date.now()-(+st.days)*86400000;
  const games=new Map();
  for(const r of rows){if(cut&&Date.parse(r.created_at)<cut)continue;if(st.mode!=="all"&&r.mode!==st.mode)continue;if(st.complete&&!((r.rounds||0)>=3))continue;
    let g=games.get(r.game_id);if(!g){g={id:r.game_id,mode:r.mode,rounds:r.rounds||0,at:r.created_at,secs:r.active_secs,wall:r.started_at&&r.ended_at?(Date.parse(r.ended_at)-Date.parse(r.started_at))/1000:null,end:r.stats&&r.stats.end||null,rows:[]};games.set(r.game_id,g)}
    g.rows.push(r);if(g.secs==null&&r.active_secs!=null)g.secs=r.active_secs}
  const list=[...games.values()];const sides=list.flatMap(g=>g.rows);
  return{games:list,sides}}
function excludedShort(){const rows=D.rows||[];const cut=st.days==="all"?0:Date.now()-(+st.days)*86400000;
  return new Set(rows.filter(r=>(!cut||Date.parse(r.created_at)>=cut)&&(st.mode==="all"||r.mode===st.mode)&&!((r.rounds||0)>=3)).map(r=>r.game_id)).size}

/* ---------- Games ---------- */
function gamesSec(f){const g=f.games;if(!g.length)return emptyMsg();
  const ai=g.filter(x=>x.mode==="ai").length,on=g.length-ai;
  const rounds=g.map(x=>x.rounds).filter(x=>x>0);
  const secs=g.map(x=>x.secs).filter(x=>x!=null&&x>0);
  const players=new Set(f.sides.map(r=>r.user_id||("n:"+r.player_name))).size;
  const total=secs.reduce((a,b)=>a+b,0);
  const ends={party:0,concede:0,deckout:0,draw:0,unknown:0};g.forEach(x=>{const e=x.end||(x.rows.some(r=>r.result==="draw")?"draw":"unknown");ends[e]=(ends[e]||0)+1});
  const short=st.complete?excludedShort():0;
  let h=`<div class="ad-kpis">
    ${kpi(fmt(g.length),"Games played",`${fmt(ai)} vs AI · ${fmt(on)} online`)}
    ${kpi(rounds.length?avg(rounds).toFixed(1):"–","Average rounds",rounds.length?`median ${median(rounds)} · ${Math.min(...rounds)} to ${Math.max(...rounds)}`:"")}
    ${kpi(secs.length?mins(avg(secs)):"–","Average game time",secs.length?`median ${mins(median(secs))} · ${secs.length} timed game${secs.length===1?"":"s"}`:"timing starts with this update")}
    ${kpi(secs.length?(total/3600).toFixed(1):"–","Hours playtested","active play time")}
    ${kpi(fmt(players),"Playtesters","accounts and guest names")}
    ${kpi(rounds.length&&secs.length?mins(total/g.filter(x=>x.secs>0).reduce((a,x)=>a+x.rounds,0)):"–","Time per round","timed games")}
  </div>`;
  if(short)h+=`<p class="ad-note">${fmt(short)} game${short===1?"":"s"} under 3 rounds left out (complete games only).</p>`;
  if(D.noTime)h+=`<p class="ad-note"><b>Game time isn't being saved yet:</b> run the Admin Panel SQL in Supabase to add the time columns.</p>`;
  /* rounds histogram */
  const rb=[];const rmax=Math.max(12,...rounds);for(let i=st.complete?3:1;i<=Math.min(rmax,20);i++)rb.push([i===20?"20+":String(i),rounds.filter(x=>i===20?x>=20:x===i).length]);
  const tb=[["<10",0,600],["10–20",600,1200],["20–30",1200,1800],["30–45",1800,2700],["45–60",2700,3600],["60–90",3600,5400],["90+",5400,1e9]].map(([l,a,b])=>[l,secs.filter(x=>x>=a&&x<b).length]);
  /* games per day */
  const nd=st.days==="all"?Math.min(60,Math.max(14,Math.ceil((Date.now()-Math.min(...g.map(x=>Date.parse(x.at))))/86400000)+1)):Math.min(60,+st.days);
  const per=new Map();g.forEach(x=>{const k=day(x.at);per.set(k,(per.get(k)||0)+1)});
  const db=[];for(let i=nd-1;i>=0;i--){const d=new Date(Date.now()-i*86400000);const k=day(d);db.push([i%Math.ceil(nd/8)===0?(d.getMonth()+1)+"/"+d.getDate():"",per.get(k)||0])}
  h+=`<div class="ad-grid">
    <section class="ad-card"><h2>How many rounds games take</h2><p class="ad-note">Games by number of rounds.</p>${hist(rb)}</section>
    <section class="ad-card"><h2>How long games take</h2><p class="ad-note">Active play time in minutes (time away or paused isn't counted).</p>${secs.length?hist(tb):'<p class="ad-empty">No timed games yet. Games finished after this update record their time.</p>'}</section>
    <section class="ad-card"><h2>Games per day</h2><p class="ad-note">Last ${nd} days.</p>${hist(db)}</section>
    <section class="ad-card"><h2>How games ended</h2><p class="ad-note">From games with end details (newer games).</p>
      <table class="ad-t"><tbody>${[["party","A party was wiped out"],["concede","Concede"],["deckout","Drew from an empty library"],["draw","Draw"],["unknown","Not recorded (older games)"]].filter(([k])=>ends[k]).map(([k,l])=>`<tr><td>${l}</td><td class="n">${fmt(ends[k])}</td><td class="n">${pctS(pct(ends[k],g.length))}</td><td style="width:35%">${bar(ends[k],g.length)}</td></tr>`).join("")}</tbody></table></section>
  </div>`;
  /* by mode */
  const md=m=>{const x=g.filter(y=>y.mode===m),r=x.map(y=>y.rounds),s=x.map(y=>y.secs).filter(v=>v>0);return`<tr><td>${m==="ai"?"vs AI":"Online"}</td><td class="n">${fmt(x.length)}</td><td class="n">${r.length?avg(r).toFixed(1):"–"}</td><td class="n">${s.length?mins(avg(s)):"–"}</td></tr>`};
  h+=`<div class="ad-grid"><section class="ad-card"><h2>By game type</h2><table class="ad-t"><thead><tr><th>Type</th><th class="n">Games</th><th class="n">Avg rounds</th><th class="n">Avg time</th></tr></thead><tbody>${md("ai")}${md("online")}</tbody></table></section>`;
  /* top playtesters */
  const pm=new Map();f.sides.forEach(r=>{const k=r.user_id||("n:"+r.player_name);let p=pm.get(k);if(!p){p={name:r.player_name,games:new Set(),w:0};pm.set(k,p)}if(!p.games.has(r.game_id)){p.games.add(r.game_id);if(r.result==="win")p.w++}});
  const tp=[...pm.values()].sort((a,b)=>b.games.size-a.games.size).slice(0,8);
  h+=`<section class="ad-card"><h2>Most active playtesters</h2><table class="ad-t"><thead><tr><th>Player</th><th class="n">Games</th><th class="n">Win %</th></tr></thead><tbody>${tp.map(p=>`<tr><td>${E(p.name)}</td><td class="n">${fmt(p.games.size)}</td><td class="n">${pctS(pct(p.w,p.games.size))}</td></tr>`).join("")}</tbody></table></section></div>`;
  /* recent */
  const rec=g.slice().sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,15);
  const party=r=>(r.heroes||[]).map(n=>{const c=heroOf(n);return`<span title="${E(fixName(n))}">${E(fixName(n))}</span>`}).join(", ");
  h+=`<section class="ad-card"><h2>Recent games</h2><div class="ad-scroll"><table class="ad-t"><thead><tr><th>When</th><th>Type</th><th>Player and party</th><th class="ad-hide-sm">Opponent</th><th>Result</th><th class="n">Rounds</th><th class="n">Time</th></tr></thead><tbody>
    ${rec.map(x=>{const a=x.rows.find(r=>r.side===0)||x.rows[0],b=x.rows.find(r=>r!==a);const opp=b?`${E(b.player_name)}: ${party(b)}`:(a.stats&&a.stats.opp&&a.stats.opp.start?"AI: "+a.stats.opp.start.map(E).join(", "):"AI");
      return`<tr><td>${ago(x.at)}</td><td>${x.mode==="ai"?"vs AI":"Online"}</td><td><b>${E(a.player_name)}</b>: ${party(a)}</td><td class="ad-hide-sm">${opp}</td><td>${a.result==="win"?'<span class="ad-up">Win</span>':a.result==="loss"?'<span class="ad-dn">Loss</span>':"Draw"}${x.end==="concede"?" (concede)":x.end==="deckout"?" (empty library)":""}</td><td class="n">${x.rounds}</td><td class="n">${x.secs?mins(x.secs):"–"}</td></tr>`}).join("")}
  </tbody></table></div></section>`;
  return h}

/* ---------- Heroes ---------- */
function heroStats(f){const m=new Map();const base={w:0,g:0};
  const get=n=>{const k=fixName(n);let x=m.get(k);if(!x){x={name:k,c:heroOf(k),games:0,w:0,l:0,d:0,dead:0,deadKnown:0,lvl:[],pos:[0,0,0]};m.set(k,x)}return x};
  for(const r of f.sides){base.g++;if(r.result==="win")base.w++;
    const fin=r.stats&&r.stats.lineup&&r.stats.lineup.final||null;
    (r.heroes||[]).forEach((n,i)=>{const x=get(n);x.games++;if(r.result==="win")x.w++;else if(r.result==="loss")x.l++;else x.d++;if(i<3)x.pos[i]++;
      if(fin){const fh=fin.find(z=>fixName(z.name)===x.name);if(fh){x.deadKnown++;if(fh.dead)x.dead++;if(fh.lvl!=null)x.lvl.push(+fh.lvl)}}})}
  /* every visible Hero shows up, even with 0 games */
  HEROES.filter(canSee).forEach(h=>get(h.name));
  const b=base.g?base.w/base.g:.5;
  for(const x of m.values()){x.wp=x.games?x.w/x.games:null;x.score=shrunk(x.w,x.games,b)}
  return{list:[...m.values()],base:b,parties:base.g}}
function heroRow(x,cols,max){const c={
  name:()=>`<td>${nameBtn(x.c,x.name,{av:1})}</td>`,
  games:()=>`<td class="n">${fmt(x.games)}</td>`,
  gbar:()=>`<td style="width:22%">${bar(x.games,max)}</td>`,
  wp:()=>`<td class="n">${x.games?pctS(100*x.wp):"–"}</td>`,
  wl:()=>`<td class="n ad-hide-sm">${x.w}–${x.l}${x.d?"–"+x.d:""}</td>`,
  dead:()=>`<td class="n ad-hide-sm">${x.deadKnown?pctS(pct(x.dead,x.deadKnown)):"–"}</td>`,
  lvl:()=>`<td class="n ad-hide-sm">${x.lvl.length?avg(x.lvl).toFixed(1):"–"}</td>`};
  return`<tr>${cols.map(k=>c[k]()).join("")}</tr>`}
const HCOLS={name:"Hero",games:"Games",gbar:"",wp:"Win %",wl:"W–L",dead:"Died",lvl:"Avg level"};
function heroTable(list,cols,max,sortable){return`<div class="ad-scroll"><table class="ad-t"><thead><tr>${cols.map(k=>`<th class="${["name","gbar"].includes(k)?"":"n"}${["wl","dead","lvl"].includes(k)?" ad-hide-sm":""}"${sortable&&k!=="gbar"?` data-ad-sort="${k}"`:""}>${HCOLS[k]}${sortable&&st.sort.hero[0]===k?(st.sort.hero[1]<0?" ▼":" ▲"):""}</th>`).join("")}</tr></thead><tbody>${list.map(x=>heroRow(x,cols,max)).join("")}</tbody></table></div>`}
function heroesSec(f){const H=heroStats(f);if(!f.games.length)return emptyMsg();
  const L=H.list.filter(x=>x.c?canSee(x.c):x.games>0);const max=Math.max(1,...L.map(x=>x.games));
  const most=L.slice().sort((a,b)=>b.games-a.games||a.name.localeCompare(b.name)).slice(0,10);
  const least=L.filter(x=>x.c).sort((a,b)=>a.games-b.games||a.name.localeCompare(b.name)).slice(0,10);
  const elig=L.filter(x=>x.games>=st.minG);
  const best=elig.slice().sort((a,b)=>b.score-a.score).slice(0,10),worst=elig.slice().sort((a,b)=>a.score-b.score).slice(0,10);
  const watched=new Map((D.watch||[]).filter(w=>w.kind==="hero").map(w=>[w.name,w]));
  const sugg=L.filter(x=>x.games>=Math.max(10,st.minG)&&!watched.has(x.name)&&(x.wp>=.6||x.wp<=.4)).sort((a,b)=>Math.abs(b.wp-H.base)-Math.abs(a.wp-H.base)).slice(0,6);
  const minSel=`<label class="field" style="min-width:0">Min. games<select data-ad="minG">${[1,3,5,10,20,50].map(n=>`<option value="${n}"${+st.minG===n?" selected":""}>${n}</option>`).join("")}</select></label>`;
  let h=`<div class="ad-kpis">${kpi(fmt(H.parties),"Parties played","one per deck per game")}${kpi(pctS(100*H.base),"Overall win %","for recorded decks")}${kpi(fmt(L.filter(x=>x.c&&x.games>0).length)+" / "+fmt(L.filter(x=>x.c).length),"Heroes tested","")}${kpi(fmt(watched.size),"On the watch list","")}</div>
  <div class="ad-grid">
    <section class="ad-card"><h2>Most played Heroes</h2><p class="ad-note">Games with the Hero in the party.</p>${heroTable(most,["name","games","gbar","wp"],max)}</section>
    <section class="ad-card"><h2>Least played Heroes</h2><p class="ad-note">Includes Heroes nobody has played yet.</p>${heroTable(least,["name","games","gbar","wp"],max)}</section>
    <section class="ad-card"><h2>Best at converting to wins</h2><p class="ad-note">Win % with the Hero in the party, ranked with small samples pulled toward the average (${pctS(100*H.base)}) so a 2–0 Hero doesn't top the list. Heroes with at least ${st.minG} games.</p>${best.length?heroTable(best,["name","games","wp","wl"],max):'<p class="ad-empty">No Hero has enough games yet.</p>'}</section>
    <section class="ad-card"><h2>Worst at converting to wins</h2><p class="ad-note">Same ranking from the bottom.</p>${worst.length?heroTable(worst,["name","games","wp","wl"],max):'<p class="ad-empty">No Hero has enough games yet.</p>'}</section>
  </div>
  ${watchSec("hero",L,H.base)}
  ${sugg.length?`<section class="ad-card" style="margin-bottom:18px"><h2>Suggested for the watch list</h2><p class="ad-note">Heroes with at least ${Math.max(10,st.minG)} games and a win % of 60% or more, or 40% or less.</p><div class="ad-scroll"><table class="ad-t"><tbody>${sugg.map(x=>`<tr><td>${nameBtn(x.c,x.name,{av:1})}</td><td class="n">${fmt(x.games)} games</td><td class="n"><span class="${x.wp>=.6?"ad-up":"ad-dn"}">${pctS(100*x.wp)}</span></td><td class="n"><button type="button" class="btn sm" data-ad-watch="hero" data-name="${E(x.name)}">Watch</button></td></tr>`).join("")}</tbody></table></div></section>`:""}
  ${classSec(f,H)}
  <section class="ad-card"><div class="ad-bar" style="margin:0 0 6px;justify-content:space-between"><div><h2>Every Hero</h2><p class="ad-note" style="margin:0">Click a column to sort. Died = how often the Hero was dead at the end of the game (games with details).</p></div>${minSel}</div>
    ${heroTable(sortHeroes(L),["name","games","gbar","wp","wl","dead","lvl"],max,true)}</section>`;
  return h}
function sortHeroes(L){const[k,d]=st.sort.hero;const v=x=>k==="name"?x.name:k==="wp"?(x.games?x.wp:-1):k==="dead"?(x.deadKnown?x.dead/x.deadKnown:-1):k==="lvl"?(x.lvl.length?avg(x.lvl):-1):k==="wl"?x.w:x.games;
  return L.slice().sort((a,b)=>{const p=v(a),q=v(b);return(typeof p==="string"?p.localeCompare(q):p-q)*d||a.name.localeCompare(b.name)})}
function classSec(f,H){const m=new Map();for(const r of f.sides){const cl=new Set((r.heroes||[]).map(n=>{const c=heroOf(n);return c?c.cls:null}).filter(Boolean));
    cl.forEach(c=>{let x=m.get(c);if(!x){x={c,g:0,w:0};m.set(c,x)}x.g++;if(r.result==="win")x.w++})}
  const L=[...m.values()].sort((a,b)=>b.g-a.g);const max=Math.max(1,...L.map(x=>x.g));
  return`<section class="ad-card" style="margin-bottom:18px"><h2>Classes</h2><p class="ad-note">Games with at least one Hero of the class in the party (a game counts once per class).</p><div class="ad-scroll"><table class="ad-t"><thead><tr><th>Class</th><th class="n">Games</th><th></th><th class="n">Win %</th></tr></thead><tbody>
    ${L.map(x=>`<tr><td><span class="ad-nm"><span class="ad-dot" style="--cc:${cc(x.c)}"></span><span>${E(x.c)}</span></span></td><td class="n">${fmt(x.g)}</td><td style="width:35%">${bar(x.g,max)}</td><td class="n">${pctS(pct(x.w,x.g))}</td></tr>`).join("")}</tbody></table></div></section>`}

/* ---------- watch list (Heroes and cards) ---------- */
function watchSec(kind,L,base){const label=kind==="hero"?"Heroes":"cards";
  if(D.watchErr)return`<section class="ad-card" style="margin-bottom:18px"><h2>Watch list</h2><p class="ad-empty">The watch list isn't set up yet (run the Admin Panel SQL in Supabase).</p></section>`;
  if(!D.watch)return`<section class="ad-card" style="margin-bottom:18px"><h2>Watch list</h2><p class="ad-empty">Loading…</p></section>`;
  const W=D.watch.filter(w=>w.kind===kind);const by=new Map(L.map(x=>[x.name,x]));
  const opts=(kind==="hero"?HEROES:CARDS).filter(c=>canSee(c)&&!W.some(w=>w.name===c.name)).map(c=>c.name).sort((a,b)=>a.localeCompare(b));
  return`<section class="ad-card" style="margin-bottom:18px"><h2>${kind==="hero"?"Heroes":"Cards"} on the watch list</h2><p class="ad-note">${label[0].toUpperCase()+label.slice(1)} you're keeping an eye on, with how they're doing in the games above.</p>
    ${W.length?`<div class="ad-scroll"><table class="ad-t"><thead><tr><th>${kind==="hero"?"Hero":"Card"}</th><th class="n">Games</th><th class="n">Win %</th><th class="n">vs avg</th><th class="ad-hide-sm">Note</th><th></th></tr></thead><tbody>
      ${W.map(w=>{const x=by.get(w.name);const c=kind==="hero"?heroOf(w.name):cardOf(w.name);const wp=x&&x.games?x.w/x.games:null;const dlt=wp==null?null:100*(wp-base);
        return`<tr><td>${nameBtn(c,w.name,{av:1})}</td><td class="n">${fmt(x?x.games:0)}</td><td class="n">${wp==null?"–":pctS(100*wp)}</td><td class="n">${dlt==null?"–":`<span class="${dlt>=0?"ad-up":"ad-dn"}">${dlt>=0?"+":""}${dlt.toFixed(1)}</span>`}</td><td class="ad-hide-sm">${E(w.note)}</td><td class="n"><button type="button" class="btn sm" data-ad-unwatch="${E(w.name)}">Remove</button></td></tr>`}).join("")}
    </tbody></table></div>`:`<p class="ad-empty">Nothing on the watch list yet.</p>`}
    <form class="ad-form" data-ad-form="watch" data-kind="${kind}"><label class="field">Add ${kind==="hero"?"a Hero":"a card"}<input type="text" name="name" list="ad-wl-${kind}" required autocomplete="off" placeholder="Name"></label><datalist id="ad-wl-${kind}">${opts.map(n=>`<option value="${E(n)}">`).join("")}</datalist>
      <label class="field">Note<input type="text" name="note" maxlength="300" placeholder="Why it's on the list"></label><button class="btn sm primary" type="submit">Add</button></form></section>`}

/* ---------- Cards ---------- */
function cardStats(f){const m=new Map();let bw=0,bg=0;
  const get=n=>{const k=fixName(n);let x=m.get(k);if(!x){x={name:k,c:cardOf(k),games:0,w:0,l:0,copies:0,dmg:0,dmgG:0,prev:0,prevG:0};m.set(k,x)}return x};
  for(const r of f.sides){bg++;if(r.result==="win")bw++;
    for(const[n,q]of Object.entries(r.cards||{})){if(!(q>0))continue;const x=get(n);x.games++;x.copies+=q;if(r.result==="win")x.w++;else if(r.result==="loss")x.l++}
    const s=r.stats;if(s){(s.dmg||[]).forEach(z=>{if(!z||!z.name)return;const c=cardOf(z.name);if(!c||c.kind==="hero")return;const x=get(z.name);x.dmg+=+z.v||0;x.dmgG++});
      (s.prev||[]).forEach(z=>{if(!z||!z.name)return;const c=cardOf(z.name);if(!c||c.kind==="hero")return;const x=get(z.name);x.prev+=+z.v||0;x.prevG++})}}
  CARDS.filter(canSee).forEach(c=>get(c.name));
  const b=bg?bw/bg:.5;for(const x of m.values()){x.wp=x.games?x.w/x.games:null;x.lift=100*(shrunk(x.w,x.games,b)-b)}
  return{list:[...m.values()],base:b,decks:bg}}
function cardRow(x,cols,ctx){const c={
  name:()=>`<td>${nameBtn(x.c,x.name)}</td>`,
  type:()=>`<td class="ad-hide-sm">${x.c?E(x.c.type)+(x.c.cost!==""&&x.c.cost!=null?` · ${E(x.c.cost)} Aura`:""):""}</td>`,
  games:()=>`<td class="n">${fmt(x.games)}</td>`,
  wp:()=>`<td class="n">${x.games?pctS(100*x.wp):"–"}</td>`,
  lift:()=>`<td class="n"><span class="${x.lift>=0?"ad-up":"ad-dn"}">${x.lift>=0?"+":""}${x.lift.toFixed(1)}</span></td>`,
  incl:()=>`<td class="n">${pctS(pct(x.games,ctx.decks))}</td>`,
  ibar:()=>`<td style="width:22%">${bar(x.games,ctx.max)}</td>`,
  avgc:()=>`<td class="n ad-hide-sm">${x.games?(x.copies/x.games).toFixed(1):"–"}</td>`,
  dmg:()=>`<td class="n">${fmt(x.dmg)}</td>`,dmgg:()=>`<td class="n">${x.dmgG?(x.dmg/x.dmgG).toFixed(1):"–"}</td>`,
  prev:()=>`<td class="n">${fmt(x.prev)}</td>`,prevg:()=>`<td class="n">${x.prevG?(x.prev/x.prevG).toFixed(1):"–"}</td>`};
  return`<tr>${cols.map(k=>c[k]()).join("")}</tr>`}
const CCOLS={name:"Card",type:"Type",games:"Decks",wp:"Win %",lift:"Power",incl:"In decks",ibar:"",avgc:"Avg copies",dmg:"Damage",dmgg:"Per game",prev:"Prevented",prevg:"Per game"};
const cardTable=(L,cols,ctx)=>`<div class="ad-scroll"><table class="ad-t"><thead><tr>${cols.map(k=>`<th class="${["name","type","ibar"].includes(k)?"":"n"}${["type","avgc"].includes(k)?" ad-hide-sm":""}">${CCOLS[k]}</th>`).join("")}</tr></thead><tbody>${L.map(x=>cardRow(x,cols,ctx)).join("")}</tbody></table></div>`;
function cardsSec(f){if(!f.games.length)return emptyMsg();const C=cardStats(f);
  const L=C.list.filter(x=>x.c?canSee(x.c):x.games>0);const ctx={decks:C.decks,max:Math.max(1,...L.map(x=>x.games))};
  const elig=L.filter(x=>x.games>=st.minG);
  const top=elig.slice().sort((a,b)=>b.lift-a.lift).slice(0,12),bot=elig.slice().sort((a,b)=>a.lift-b.lift).slice(0,12);
  const dmg=L.filter(x=>x.dmg>0).sort((a,b)=>b.dmg-a.dmg).slice(0,10),prev=L.filter(x=>x.prev>0).sort((a,b)=>b.prev-a.prev).slice(0,10);
  const most=L.filter(x=>x.games>0).sort((a,b)=>b.games-a.games).slice(0,10);
  const real=L.filter(x=>x.c);const never=real.filter(x=>!x.games).sort((a,b)=>a.name.localeCompare(b.name));
  const minSel=`<label class="field" style="min-width:0">Min. decks<select data-ad="minG">${[1,3,5,10,20,50].map(n=>`<option value="${n}"${+st.minG===n?" selected":""}>${n}</option>`).join("")}</select></label>`;
  return`<div class="ad-kpis">${kpi(fmt(real.length-never.length)+" / "+fmt(real.length),"Cards tested","played in at least one deck")}${kpi(pctS(100*C.base),"Average win %","the baseline for Power")}${kpi(fmt(C.decks),"Decks played","")}${kpi(fmt((D.watch||[]).filter(w=>w.kind==="card").length),"Cards on the watch list","")}</div>
  <div class="ad-bar">${minSel}<p class="ad-note" style="margin:0 0 8px;flex:1;min-width:240px"><b>Power</b> = how many points the win % of decks with the card sits above (+) or below (−) the average, with small samples pulled toward the average. Only cards in at least ${st.minG} decks.</p></div>
  <div class="ad-grid">
    <section class="ad-card"><h2>Most powerful cards</h2><p class="ad-note">Decks with these cards win the most.</p>${top.length?cardTable(top,["name","type","games","wp","lift"],ctx):'<p class="ad-empty">No card has enough games yet.</p>'}</section>
    <section class="ad-card"><h2>Least powerful cards</h2><p class="ad-note">Decks with these cards win the least.</p>${bot.length?cardTable(bot,["name","type","games","wp","lift"],ctx):'<p class="ad-empty">No card has enough games yet.</p>'}</section>
    <section class="ad-card"><h2>Top damage dealers</h2><p class="ad-note">Damage from each game's top 5 damage cards (games with details).</p>${dmg.length?cardTable(dmg,["name","dmg","dmgg"],ctx):'<p class="ad-empty">No damage details yet.</p>'}</section>
    <section class="ad-card"><h2>Top damage preventers</h2><p class="ad-note">Damage prevented by each game's top 5 Defense cards.</p>${prev.length?cardTable(prev,["name","prev","prevg"],ctx):'<p class="ad-empty">No prevention details yet.</p>'}</section>
    <section class="ad-card"><h2>Most included cards</h2><p class="ad-note">Share of played decks that run the card.</p>${cardTable(most,["name","incl","ibar","avgc"],ctx)}</section>
  </div>
  ${watchSec("card",L,C.base)}
  <section class="ad-card"><h2>Not tested yet (${fmt(never.length)})</h2><p class="ad-note">Cards that haven't been in any deck in these games.</p>${never.length?`<div class="ad-chips">${never.map(x=>nameBtn(x.c,x.name)).join("")}</div>`:'<p class="ad-empty">Every card has been played.</p>'}</section>`}

/* ---------- Users ---------- */
function usersTab(){
  if(!D.users&&!D.usersErr)return`<p class="ad-empty">Loading players…</p>`;
  if(D.usersErr)return`<div class="empty">${/admin_list_users|function/i.test(D.usersErr)?"The Users list needs the Admin Panel SQL run in Supabase first.":"Couldn't load players: "+E(D.usersErr)}</div>`;
  const q=st.uq.trim().toLowerCase();const U=D.users.filter(u=>!q||(u.name+" "+u.email).toLowerCase().includes(q));
  const na=D.users.filter(u=>u.is_admin).length,ns=D.users.filter(u=>u.set2||u.is_admin).length;
  return`<div class="ad-kpis">${kpi(fmt(D.users.length),"Players with accounts","")}${kpi(fmt(na),"Admins","")}${kpi(fmt(ns),"Can see Set 2","admins always can")}${kpi(fmt(SET2.size),"Cards in Set 2",SET2.size?"":"none added yet")}</div>
  <p class="ad-note"><b>Admin</b>: sees this page and Set 2. <b>Set 2</b>: sees the hidden Set 2 cards in Cards and the Deck Builder.${SET2.size?"":" Set 2 cards go in the SET2_CARDS list in cards-data.js."}</p>
  <div class="ad-bar"><label class="field">Search<input type="search" data-ad="uq" value="${E(st.uq)}" placeholder="Name or email"></label><button type="button" class="btn sm" data-ad-act="users-refresh">Refresh</button></div>
  <section class="ad-card"><div class="ad-scroll"><table class="ad-t ad-users"><thead><tr><th>Player</th><th class="ad-hide-sm">Email</th><th class="ad-hide-sm">Joined</th><th>Last sign-in</th><th class="n">Games</th><th>Admin</th><th>Set 2</th></tr></thead><tbody>
    ${U.map(u=>`<tr><td><b>${E(u.name)}</b>${u.id===S.uid?' <span class="ad-tag">you</span>':""}</td><td class="em ad-hide-sm">${E(u.email)}</td><td class="ad-hide-sm">${u.created_at?new Date(u.created_at).toLocaleDateString():"–"}</td><td>${ago(u.last_sign_in_at)}</td><td class="n">${fmt(u.games)}</td>
      <td><label class="ad-sw"><input type="checkbox" data-ad-role="admin" data-uid="${E(u.id)}" data-nm="${E(u.name)}"${u.is_admin?" checked":""}><span class="sr-only">Admin</span></label></td>
      <td><label class="ad-sw"><input type="checkbox" data-ad-role="set2" data-uid="${E(u.id)}" data-nm="${E(u.name)}"${u.set2||u.is_admin?" checked":""}${u.is_admin?' disabled title="Admins always see Set 2"':""}><span class="sr-only">Set 2</span></label></td></tr>`).join("")||`<tr><td colspan="7" class="ad-empty">No players match.</td></tr>`}
  </tbody></table></div></section>`}

/* ---------- page ---------- */
function emptyMsg(){return`<div class="empty">No finished games match these filters yet.${st.complete?" Try turning off <b>Complete games only</b> or picking a longer period.":""}</div>`}
function playTab(){
  if(D.err)return`<div class="empty">Couldn't load game results: ${E(D.err)}</div>`;
  if(!D.rows)return`<p class="ad-empty">Loading game results…</p>`;
  const f=filtered();
  const sel=(k,opts)=>`<select data-ad="${k}">${opts.map(([v,l])=>`<option value="${v}"${String(st[k])===v?" selected":""}>${l}</option>`).join("")}</select>`;
  return`<div class="chips ad-sub" role="tablist">${[["games","Games"],["heroes","Heroes"],["cards","Cards"]].map(([v,l])=>`<button type="button" class="chip" role="tab" data-ad-sec="${v}" aria-selected="${st.sec===v}" aria-pressed="${st.sec===v}">${l}</button>`).join("")}</div>
  <div class="ad-bar"><label class="field">Period${sel("days",[["7","Last 7 days"],["30","Last 30 days"],["90","Last 90 days"],["all","All time"]])}</label>
    <label class="field">Games${sel("mode",[["all","All games"],["ai","vs AI"],["online","Online"]])}</label>
    <label class="ad-chk"><input type="checkbox" data-ad="complete"${st.complete?" checked":""}> Complete games only (3+ rounds)</label>
    <button type="button" class="btn sm" data-ad-act="refresh">Refresh</button><span class="ad-note" style="padding-bottom:8px">Updated ${ago(new Date(D.at).toISOString())}</span></div>
  <div id="ad-body">${st.sec==="heroes"?heroesSec(f):st.sec==="cards"?cardsSec(f):gamesSec(f)}</div>
  <p class="ad-note" style="margin-top:14px">Results come from finished Play-tab games. vs AI games record only the player's deck; online games record both decks.</p>`}
function view(){
  if(typeof SB==="undefined"||!SB)return`<h1>Admin</h1><div class="empty">The admin page needs the site's account service.</div>`;
  if(!S.uid)return`<h1>Admin</h1><div class="empty">This page is for admins. <a href="#account">Sign in</a> first.</div>`;
  if(!S.access)return`<h1>Admin</h1><p class="ad-empty">Checking access…</p>`;
  if(!S.access.admin)return`<h1>Admin</h1><div class="empty">This page is only for admins.</div>`;
  return`<h1>Admin</h1><p class="lede">Only you and other admins can see this page.</p>
  <div class="chips ad-tabs" role="tablist">${[["play","Playtesting"],["users","Users"]].map(([v,l])=>`<button type="button" class="chip" role="tab" data-ad-tab="${v}" aria-selected="${st.tab===v}" aria-pressed="${st.tab===v}">${l}</button>`).join("")}</div>
  ${st.tab==="users"?usersTab():playTab()}`}
function mount(el){injectCSS();root=el;
  if(SB&&S.uid&&S.access&&S.access.admin){
    if(st.tab==="play"){if(!D.rows&&!D.loading||Date.now()-D.at>120000&&!D.loading)loadRows();if(!D.watch)loadWatch()}
    if(st.tab==="users"&&!D.users)loadUsers()}
  el.innerHTML=view()}
function rerender(){if(root&&root.isConnected&&S.view==="admin"){const y=scrollY;const a=document.activeElement,k=a&&a.dataset&&a.dataset.ad,pos=a&&a.selectionStart;mount(root);
  if(k){const n=root.querySelector(`[data-ad="${k}"]`);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}}scrollTo(0,y)}}

/* ---------- events ---------- */
document.addEventListener("click",async e=>{const t=e.target;if(!root||S.view!=="admin")return;
  const tab=t.closest("[data-ad-tab]");if(tab){st.tab=tab.dataset.adTab;save();rerender();return}
  const sec=t.closest("[data-ad-sec]");if(sec){st.sec=sec.dataset.adSec;save();rerender();return}
  const so=t.closest("[data-ad-sort]");if(so){const k=so.dataset.adSort;st.sort.hero=st.sort.hero[0]===k?[k,-st.sort.hero[1]]:[k,k==="name"?1:-1];rerender();return}
  const act=t.closest("[data-ad-act]");if(act){if(act.dataset.adAct==="refresh"){D.at=0;loadRows();loadWatch()}else{D.users=null;loadUsers()}rerender();return}
  const w=t.closest("[data-ad-watch]");if(w){await addWatch(w.dataset.name,w.dataset.adWatch,"");return}
  const u=t.closest("[data-ad-unwatch]");if(u){const{error}=await SB.from("watch_list").delete().eq("name",u.dataset.adUnwatch);if(error)toast("Couldn't remove it: "+error.message);else{toast(`${u.dataset.adUnwatch} removed from the watch list.`);loadWatch()}}});
async function addWatch(name,kind,note){name=String(name||"").trim();if(!name)return;
  const c=kind==="hero"?heroOf(name):cardOf(name);if(!c||(kind==="hero")!==(c.kind==="hero")){toast(`There's no ${kind==="hero"?"Hero":"card"} called "${name}".`);return}
  const{error}=await SB.from("watch_list").upsert({name:c.name,kind,note:String(note||"").slice(0,300)});
  if(error){toast("Couldn't add it: "+error.message);return}toast(`${c.name} is on the watch list.`);loadWatch()}
document.addEventListener("submit",e=>{const f=e.target.closest&&e.target.closest('[data-ad-form="watch"]');if(!f)return;e.preventDefault();const fd=new FormData(f);addWatch(fd.get("name"),f.dataset.kind,fd.get("note"))});
document.addEventListener("change",async e=>{const t=e.target;if(!root||S.view!=="admin"||!t.dataset)return;
  if(t.dataset.ad&&t.dataset.ad!=="uq"){st[t.dataset.ad]=t.type==="checkbox"?t.checked:t.value;if(t.dataset.ad==="minG")st.minG=+t.value;save();rerender();return}
  const role=t.dataset.adRole;if(!role)return;const uid=t.dataset.uid,on=t.checked,nm=t.dataset.nm;
  if(role==="admin"){const msg=on?`Make ${nm} an admin? Admins see this page, can change other players' access and see Set 2.`:(uid===S.uid?"Remove your own admin access? You'll lose this page.":`Remove admin from ${nm}?`);
    if(!confirm(msg)){t.checked=!on;return}}
  t.disabled=true;const{error}=await SB.rpc(role==="admin"?"admin_set_admin":"admin_set_set2",role==="admin"?{target:uid,make:on}:{target:uid,allow:on});
  if(error){toast("Couldn't change that: "+error.message);t.checked=!on;t.disabled=false;return}
  toast(role==="admin"?(on?`${nm} is now an admin.`:`${nm} is no longer an admin.`):(on?`${nm} can now see Set 2.`:`${nm} can no longer see Set 2.`));
  if(uid===S.uid&&typeof loadAccess==="function")loadAccess();loadUsers()});
document.addEventListener("input",e=>{const t=e.target;if(!t.dataset||t.dataset.ad!=="uq")return;st.uq=t.value;rerender()});
window.CQAdmin={mount};
})();
