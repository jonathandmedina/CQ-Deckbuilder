"use strict";
/* ---------- data ---------- */
const CLASSES=["Barbarian","Bard","Cleric","Druid","Mage","Monk","Paladin","Ranger","Rogue","Warlock"];
/* Two themes: "retro" (default, SNES-style menus, class icons) and "clean". Printed cards always use the clean palette. */
const SKIN=document.documentElement.dataset.skin==="clean"?"clean":"retro";
const CLASS_COLOR_CLEAN={Barbarian:"#B0412B",Bard:"#B8467C",Cleric:"#D4AE3A",Druid:"#447F34",Mage:"#2C66C4",Monk:"#DE8A2E",Paladin:"#5E7FA6",Ranger:"#6E8130",Rogue:"#3B4658",Warlock:"#6A3C9E",Generic:"#7C766B"};
const CLASS_TEXT_CLEAN={Cleric:"#231A00",Monk:"#2A1500"};
/* retro colors are sampled from the class icons */
const CLASS_COLOR_RETRO={Barbarian:"#BE1029",Bard:"#A9327C",Cleric:"#CAAF65",Druid:"#A8622F",Mage:"#0271B9",Monk:"#51A5C5",Paladin:"#DE8600",Ranger:"#567428",Rogue:"#4B6170",Warlock:"#4D1791",Generic:"#6D6F80",Artificer:"#507B7F",Blacksmith:"#673839",Necromancer:"#466E6B"};
const CLASS_TEXT_RETRO={Cleric:"#1A1206",Monk:"#06222E",Paladin:"#1E1000"};
const CLASS_COLOR=SKIN==="retro"?CLASS_COLOR_RETRO:CLASS_COLOR_CLEAN, CLASS_TEXT=SKIN==="retro"?CLASS_TEXT_RETRO:CLASS_TEXT_CLEAN;
const cc=c=>CLASS_COLOR[c]||"#777", ct=c=>CLASS_TEXT[c]||"#FFFFFF";
const ICON_CLS=new Set(["Barbarian","Bard","Cleric","Druid","Mage","Monk","Paladin","Ranger","Rogue","Warlock","Artificer","Blacksmith","Necromancer"]);
const ICON_BASE=new URL("assets/",document.baseURI).href;
const ci=c=>ICON_CLS.has(c)?`url(${ICON_BASE}ico-${c.toLowerCase()}.png)`:"none";
const TYPES=["Spell","Tactic","Song","Item","Equipment","Enchantment","Summon"];

const HEROES=RAW_HEROES.map(r=>({id:"h:"+r[0],kind:"hero",name:r[0],cls:r[1],str:r[2],def:r[3],aura:r[4],hp:r[5],rules:r[6],ver:r[7]||1,type:"Hero",sup:"",sub:"",cost:""}));
const CARDS=[
  ...RAW_CARDS.map(r=>({id:r[1],kind:"card",name:r[1],cost:r[2],sup:r[3],type:r[4],sub:r[5],cls:r[6],rules:r[7],ver:r[8]||1})),
  ...RAW_EQUIP.map(r=>({id:r[0],kind:"equip",name:r[0],sup:r[1],type:"Equipment",sub:r[2],cls:r[3],rules:r[4],cost:r[5],region:r[6],pstr:+r[7]||0,pdef:+r[8]||0,ver:r[9]||1}))
];
const TOKENS=(typeof RAW_TOKENS!=="undefined"?RAW_TOKENS:[]).map(r=>({id:"t:"+r[0],kind:"token",name:r[0],tkind:r[1],type:"Token",sub:r[1]+(r[2]&&r[2]!==r[1]?" · "+r[2]:""),cls:r[3],str:r[4],def:r[5],hp:r[6],cost:r[7],region:r[8],rules:r[9],madeBy:r[10],ver:r[11]||1,sup:""}));
const TOKEN_BY_NAME=new Map(TOKENS.map(t=>[t.name,t]));
const TOKEN_SRC=(typeof TOKEN_SOURCES!=="undefined")?TOKEN_SOURCES:{};
const BYID=new Map([...HEROES,...CARDS,...TOKENS].map(c=>[c.id,c]));
const hasGem=c=>c.kind!=="hero"&&!(c.kind==="token"&&c.tkind!=="Equipment");
function tokenStats(c){if(c.tkind==="Summon")return[["STR",c.str],["HP",c.hp]];if(c.tkind==="Item")return[["STR",c.str],["DEF",c.def],["HP",c.hp]];return null}
function tokenStatLine(c){if(c.tkind==="Summon")return c.str+"/"+c.hp;if(c.tkind==="Item")return c.str+" STR, "+c.def+" DEF, "+c.hp+" HP";if(c.tkind==="Equipment")return"+"+c.str+" STR";return"Pillar"}
const sortName=n=>n.replace(/^"|"$/g,"").toLowerCase();
const costNum=c=>c.cost==="X"?99:(c.cost===""?-1:+c.cost);
const maxCopies=c=>c.sup==="Legendary"?1:2;
const clsOrder=c=>c==="Generic"?99:CLASSES.indexOf(c);
const DECK_SIZE=30;
/* tokens a deck can make: one entry per token, count = what every copy of every source makes */
function tokensFor(d){
  const m=new Map();const add=(name,q)=>{for(const[t,n]of(TOKEN_SRC[name]||[]))m.set(t,(m.get(t)||0)+n*q)};
  d.heroes.forEach(h=>{const c=BYID.get(h);if(c)add(c.name,1)});
  for(const[id,q]of Object.entries(d.cards)){const c=BYID.get(id);if(c&&q>0)add(c.name,q)}
  return[...m].map(([n,q])=>({c:TOKEN_BY_NAME.get(n),q})).filter(x=>x.c).sort((a,b)=>clsOrder(a.c.cls)-clsOrder(b.c.cls)||a.c.name.localeCompare(b.c.name));
}

/* ---------- utils ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function rulesHTML(t){
  return t.split("\n").filter(p=>p.trim()).map(p=>"<p>"+esc(p).replace(/\{A\}/g,'<i class="aura" aria-label="Aura"></i>').replace(/\{L(\d)\}/g,'<span class="lv">LV $1</span>')+"</p>").join("");
}
function rulesPlain(t){return t.replace(/\{A\}/g," Aura").replace(/\{L(\d)\}/g,"[Level $1]")}
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let toastT;
function toast(msg){const l=$("#layer");let t=l.querySelector(".toast");if(!t){t=document.createElement("div");t.className="toast";t.setAttribute("role","status");l.appendChild(t)}t.textContent=msg;clearTimeout(toastT);toastT=setTimeout(()=>t.remove(),3800)}
function busy(on,msg){const l=$("#layer");let b=l.querySelector(".busy");if(on){if(!b){b=document.createElement("div");b.className="busy";l.appendChild(b)}b.textContent=msg||"Working…"}else if(b)b.remove()}
const newId=()=>"d"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);

/* ---------- state ---------- */
const S={
  view:"catalog",
  cat:store.get("cq.cat",{cls:"all",type:"all",sort:"class",q:""}),
  b:{step:"heroes",heroCls:"all",cls:"all",type:"all",sort:"class",q:""},
  deck:store.get("cq.draft",null)||blankDeck(),
  dirty:false,
  decks:[],
  mode:"local", // local | account
  me:null, uid:null, db:null, downloads:null
};
function blankDeck(){return{id:newId(),name:"Untitled deck",heroes:[],cards:{}}}
function saveDraft(){store.set("cq.draft",S.deck)}
const deckTotal=d=>Object.values(d.cards).reduce((a,b)=>a+b,0);
const partyClasses=d=>[...new Set(d.heroes.map(h=>BYID.get(h)?.cls).filter(Boolean))];
function allowed(c,d){return c.cls==="Generic"||partyClasses(d).includes(c.cls)}
function issues(d){
  const out=[];
  if(d.heroes.length!==3)out.push(`Pick ${3-d.heroes.length} more Hero${3-d.heroes.length===1?"":"es"}.`);
  const t=deckTotal(d);
  if(t<DECK_SIZE)out.push(`Add ${DECK_SIZE-t} more card${DECK_SIZE-t===1?"":"s"} (decks are exactly 30).`);
  if(t>DECK_SIZE)out.push(`Remove ${t-DECK_SIZE} card${t-DECK_SIZE===1?"":"s"} (decks are exactly 30).`);
  for(const[id,q]of Object.entries(d.cards)){const c=BYID.get(id);if(!c){out.push(`"${id}" isn't in the card list anymore.`);continue}
    if(q>maxCopies(c))out.push(`${c.name}: ${c.sup==="Legendary"?"Legendary, only 1 allowed":"max 2 copies"}.`);
    if(d.heroes.length&&!allowed(c,d))out.push(`${c.name} is ${c.cls}; no Hero in your party can play it.`);}
  return out;
}

/* ---------- account / storage (Supabase) ---------- */
const CFG=window.CQ_CONFIG||{};
const SB=(CFG.supabaseUrl&&CFG.supabaseAnonKey&&!/YOUR_/.test(CFG.supabaseUrl+CFG.supabaseAnonKey)&&window.supabase)
  ?window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
S.authMode="signin"; // signin | signup | reset | newpass
async function initAccount(){
  if(!SB){S.decks=store.get("cq.decks",[]);renderAcct();render();return}
  SB.auth.onAuthStateChange((ev,session)=>{
    if(ev==="PASSWORD_RECOVERY"){S.authMode="newpass";go("account")}
    setSession(session);
  });
  const{data}=await SB.auth.getSession();setSession(data.session);
}
let lastUid=undefined;
function setSession(session){
  const u=session&&session.user;
  S.uid=u?u.id:null;
  S.me=u?{email:u.email,name:(u.user_metadata&&u.user_metadata.display_name)||u.email.split("@")[0]}:null;
  S.mode=u?"account":"local";
  if(S.uid===lastUid){renderAcct();return}
  lastUid=S.uid;
  if(u)loadDecks();else{S.decks=store.get("cq.decks",[]);}
  renderAcct();render();
}
async function loadDecks(){
  const{data,error}=await SB.from("decks").select("id,name,heroes,cards,updated_at").order("updated_at",{ascending:false});
  if(error){toast("Couldn't load your decks. Check your connection and reload.");return}
  S.decks=data.map(r=>({id:r.id,name:r.name,heroes:r.heroes||[],cards:r.cards||{},updated:Date.parse(r.updated_at)||0}));
  if(S.view==="decks")render();
}
const toRow=d=>({id:d.id,user_id:S.uid,name:(d.name||"Untitled deck").slice(0,80),heroes:d.heroes.slice(0,3),cards:d.cards,updated_at:new Date().toISOString()});
async function persistDeck(d){
  if(S.mode==="account"){
    const{error}=await SB.from("decks").upsert(toRow(d));
    if(error){toast("Couldn't save to your account: "+error.message);throw error}
    const i=S.decks.findIndex(x=>x.id===d.id);const rec={...d,cards:{...d.cards},heroes:d.heroes.slice(),updated:Date.now()};
    if(i>=0)S.decks.splice(i,1);S.decks.unshift(rec);return "account";
  }
  const list=store.get("cq.decks",[]).filter(x=>x.id!==d.id);
  list.unshift({...d,cards:{...d.cards},heroes:d.heroes.slice(),updated:Date.now()});
  store.set("cq.decks",list);S.decks=list;return "local";
}
async function removeDeck(id){
  if(S.mode==="account"){const{error}=await SB.from("decks").delete().eq("id",id);if(error){toast("Couldn't delete that deck. Try again.");return}S.decks=S.decks.filter(d=>d.id!==id)}
  else{const l=store.get("cq.decks",[]).filter(x=>x.id!==id);store.set("cq.decks",l);S.decks=l}
  toast("Deck deleted.");render();
}
async function migrateLocal(){
  const l=store.get("cq.decks",[]);if(!l.length)return;
  const rows=l.map(d=>({...toRow(d),updated_at:new Date(d.updated||Date.now()).toISOString()}));
  const{error}=await SB.from("decks").upsert(rows);
  if(error){toast("Couldn't move those decks: "+error.message);return}
  store.set("cq.decks",[]);toast(`Moved ${l.length} deck${l.length===1?"":"s"} into your account.`);await loadDecks();render();
}
function renderAcct(){
  const el=$("#acct");el.innerHTML="";
  if(!SB){el.innerHTML='<span>Guest · decks save in this browser</span>';return}
  const a=document.createElement("a");a.href="#account";a.className="btn sm";
  if(S.mode==="account"){const b=document.createElement("b");b.textContent=S.me.name;el.append(b);a.textContent="Account"}
  else{const s=document.createElement("span");s.textContent="Guest";el.append(s);a.textContent="Sign in";a.classList.add("primary")}
  el.append(a);
}
function viewAccount(){
  if(!SB)return`<h1>Accounts</h1><p class="lede">Player accounts aren't switched on for this site yet. You can still build decks; they save in this browser.</p>`;
  if(S.authMode==="newpass")return`<h1>Choose a new password</h1>
    <form class="panel authf" data-form="newpass"><label class="field col" for="np">New password<input id="np" type="password" name="password" minlength="8" required autocomplete="new-password"></label>
    <button class="btn primary" type="submit">Save password</button></form>`;
  if(S.mode==="account")return`<h1>Your account</h1>
    <div class="panel"><p>Signed in as <b>${esc(S.me.name)}</b> (${esc(S.me.email)}). Decks you save sync to this account on any device.</p>
    <form class="authf" data-form="profile"><label class="field col" for="dn">Display name<input id="dn" type="text" name="display_name" maxlength="40" value="${esc(S.me.name)}"></label>
    <div class="actions"><button class="btn" type="submit">Update name</button><button class="btn danger" type="button" data-act="signout">Sign out</button></div></form></div>`;
  const m=S.authMode;
  const tabs=`<div class="chips" role="group" aria-label="Account action">${[["signin","Sign in"],["signup","Create account"],["reset","Forgot password"]].map(([k,l])=>`<button type="button" class="chip" data-act="auth-mode" data-v="${k}" aria-pressed="${m===k}">${l}</button>`).join("")}</div>`;
  const email=`<label class="field col" for="em">Email<input id="em" type="email" name="email" required autocomplete="email"></label>`;
  const pw=(ac)=>`<label class="field col" for="pw">Password<input id="pw" type="password" name="password" minlength="8" required autocomplete="${ac}"></label>`;
  let form="";
  if(m==="signin")form=`<form class="panel authf" data-form="signin">${email}${pw("current-password")}<button class="btn primary" type="submit">Sign in</button></form>`;
  if(m==="signup")form=`<form class="panel authf" data-form="signup"><label class="field col" for="dn">Display name<input id="dn" type="text" name="display_name" maxlength="40" required></label>${email}${pw("new-password")}<p class="note">At least 8 characters. We'll email you a link to confirm your address.</p><button class="btn primary" type="submit">Create account</button></form>`;
  if(m==="reset")form=`<form class="panel authf" data-form="reset">${email}<p class="note">We'll email you a link to set a new password.</p><button class="btn primary" type="submit">Send reset link</button></form>`;
  return`<h1>Player account</h1><p class="lede">Make a free account to save your decks and open them on any device. Without one, decks save in this browser only.</p><div class="bar">${tabs}</div>${form}`;
}
document.addEventListener("submit",async e=>{
  const f=e.target.closest("form[data-form]");if(!f||!SB)return;e.preventDefault();
  const fd=Object.fromEntries(new FormData(f));const btn=f.querySelector("[type=submit]");btn.disabled=true;
  const redirect=location.origin+location.pathname;
  try{
    if(f.dataset.form==="signin"){const{error}=await SB.auth.signInWithPassword({email:fd.email,password:fd.password});if(error)throw error;toast("Signed in.");if(store.get("cq.decks",[]).length)toast("Signed in. You can move your browser decks into your account from My Decks.");go("decks")}
    if(f.dataset.form==="signup"){const{data,error}=await SB.auth.signUp({email:fd.email,password:fd.password,options:{data:{display_name:fd.display_name},emailRedirectTo:redirect}});if(error)throw error;
      if(data.session){toast("Account created.");go("decks")}else{f.outerHTML=`<div class="panel"><p>Check <b>${esc(fd.email)}</b> for a confirmation link, then come back and sign in.</p></div>`}}
    if(f.dataset.form==="reset"){const{error}=await SB.auth.resetPasswordForEmail(fd.email,{redirectTo:redirect});if(error)throw error;f.outerHTML=`<div class="panel"><p>If an account exists for <b>${esc(fd.email)}</b>, a reset link is on its way.</p></div>`}
    if(f.dataset.form==="newpass"){const{error}=await SB.auth.updateUser({password:fd.password});if(error)throw error;S.authMode="signin";toast("Password updated.");go("decks")}
    if(f.dataset.form==="profile"){const{data,error}=await SB.auth.updateUser({data:{display_name:fd.display_name}});if(error)throw error;S.me.name=fd.display_name;renderAcct();toast("Name updated.")}
  }catch(err){toast(err.message||"Something went wrong. Try again.")}
  if(btn.isConnected)btn.disabled=false;
});
async function signOut(){await SB.auth.signOut();toast("Signed out.");go("catalog")}

/* ---------- share links ---------- */
function shareCode(d){
  const o={n:d.name,h:d.heroes.map(h=>BYID.get(h)?.name||h),c:Object.entries(d.cards).filter(([,q])=>q>0)};
  return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function readShare(code){
  try{const o=JSON.parse(decodeURIComponent(escape(atob(code.replace(/-/g,"+").replace(/_/g,"/")))));
    const d=blankDeck();d.name=String(o.n||"Shared deck").slice(0,80);
    d.heroes=(o.h||[]).map(n=>"h:"+n).filter(id=>BYID.has(id)).slice(0,3);
    for(const[id,q]of o.c||[])if(BYID.has(id)&&q>0)d.cards[id]=Math.min(+q,2);
    return d}catch(e){return null}
}
function shareURL(d){return location.origin+location.pathname+"?deck="+shareCode(d)+"#build"}

/* ---------- rendering: card tile ---------- */
function typeLine(c){const v=`<i class="cver" title="Card version">v${c.ver||1}</i>`;
  if(c.kind==="hero")return`<span>Hero</span><span>${esc(c.cls)} ${v}</span>`;
  if(c.kind==="token")return`<span>Token — ${esc(c.sub)}</span><span>${esc(c.cls)} ${v}</span>`;
  const left=(c.sup?`<span class="leg${c.sup==="Legendary"?" legendary":""}">${esc(c.sup)}</span> `:"")+esc(c.type)+(c.sub?" — "+esc(c.sub):"");
  return`<span>${left}</span><span>${esc(c.cls)} ${v}</span>`;
}
function footHTML(c){
  if(c.kind==="hero")return`<div class="stats">${[["STR",c.str],["DEF",c.def],["AURA",c.aura],["HP",c.hp]].map(([k,v])=>`<div class="stat s-${k.toLowerCase()}"><b>${esc(v)}</b><i>${k}</i></div>`).join("")}</div>`;
  if(c.kind==="token"){const st=tokenStats(c);if(st)return`<div class="stats">${st.map(([k,v])=>`<div class="stat"><b>${esc(v)}</b><i>${k}</i></div>`).join("")}</div>`;
    return c.tkind==="Equipment"?[esc(c.region),"+"+esc(c.str)+" STR","Token"].join(" · "):"Pillar token"}
  if(c.kind==="equip"){const b=[esc(c.region)];if(c.pstr)b.push("+"+c.pstr+" STR");if(c.pdef)b.push("+"+c.pdef+" DEF");return b.join(" · ")}
  return c.sup==="Legendary"?"1 copy per deck":"Up to 2 copies";
}
function cardHTML(c,o={}){
  const tag=o.button?"button":"article";
  const attrs=o.button?` type="button" data-act="${o.button}" data-id="${esc(c.id)}"`:"";
  return`<${tag} class="card${o.picked?" picked":""}" style="--cc:${cc(c.cls)};--ci:${ci(c.cls)};--ct:${ct(c.cls)}"${attrs}>
  <div class="c-head"><span class="c-name">${esc(c.name)}</span>${hasGem(c)?`<span class="gem" title="Aura cost">${esc(c.cost)}</span>`:""}</div>
  <div class="c-type">${typeLine(c)}</div>
  <div class="c-rules">${rulesHTML(c.rules||"")}</div>
  <div class="c-foot">${footHTML(c)}</div>
  ${o.slot?`<span class="slotbadge">${o.slot}</span>`:""}
  ${o.ctrl||""}
</${tag}>`;
}
const kindRank=c=>c.kind==="hero"?0:c.kind==="token"?2:1;
function filterSort(list,f){
  const q=f.q.trim().toLowerCase();
  let l=list.filter(c=>(f.cls==="all"||c.cls===f.cls)&&(f.type==="all"||(f.type==="Hero"?c.kind==="hero":c.type===f.type))&&(!q||(c.name+" "+c.rules+" "+c.type+" "+c.sub).toLowerCase().includes(q)));
  const byName=(a,b)=>sortName(a.name).localeCompare(sortName(b.name));
  const s={class:(a,b)=>kindRank(a)-kindRank(b)||clsOrder(a.cls)-clsOrder(b.cls)||byName(a,b),
    name:byName,cost:(a,b)=>costNum(a)-costNum(b)||byName(a,b),type:(a,b)=>a.type.localeCompare(b.type)||byName(a,b)}[f.sort]||byName;
  return l.sort(s);
}
function gridWithGroups(list,f,tile){
  if(!list.length)return`<div class="empty">No cards match these filters.</div>`;
  if(f.sort!=="class")return list.map(tile).join("");
  let out="",last=null;
  const gk=c=>(c.kind==="hero"?"Heroes · ":c.kind==="token"?"Tokens · ":"")+c.cls;
  const counts={};list.forEach(c=>{const k=gk(c);counts[k]=(counts[k]||0)+1});
  for(const c of list){const k=gk(c);
    if(k!==last){out+=`<div class="group-h" style="--cc:${cc(c.cls)};--ci:${ci(c.cls)}"><i class="dot"></i>${esc(k)} <span>${counts[k]}</span></div>`;last=k}
    out+=tile(c)}
  return out;
}
function classChips(cur,act,classes,withAll=true){
  return`<div class="chips" role="group" aria-label="Filter by class">${withAll?`<button type="button" class="chip" data-act="${act}" data-v="all" aria-pressed="${cur==="all"}">All classes</button>`:""}${classes.map(k=>`<button type="button" class="chip" style="--cc:${cc(k)};--ci:${ci(k)}" data-act="${act}" data-v="${k}" aria-pressed="${cur===k}"><i class="dot"></i>${k}</button>`).join("")}</div>`;
}
function selectHTML(id,act,cur,opts){return`<select id="${id}" data-act="${act}">${opts.map(([v,l])=>`<option value="${v}"${v===cur?" selected":""}>${l}</option>`).join("")}</select>`}
const SORTS=[["class","Class"],["name","Name"],["cost","Aura cost"],["type","Card type"]];

/* ---------- views ---------- */
function render(){
  document.querySelectorAll("#tabs a").forEach(a=>{if(a.dataset.view===S.view)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
  const v=$("#view");
  if(S.view==="catalog")v.innerHTML=viewCatalog();
  else if(S.view==="build")v.innerHTML=viewBuild();
  else if(S.view==="account")v.innerHTML=viewAccount();
  else if(S.view==="rules"){v.innerHTML=viewRules();if(!S.rules)loadRules()}
  else if(S.view==="play"){if(window.CQPlay)window.CQPlay.mount(v);else v.innerHTML='<p class="lede">Loading the game…</p>'}
  else if(S.view==="best"){v.innerHTML=viewBest();if(!S.best||Date.now()-S.best.at>60000)loadBest()}
  else v.innerHTML=viewDecks();
}
function viewCatalog(){
  const f=S.cat;
  const all=[...HEROES,...CARDS,...TOKENS];
  const list=filterSort(all,f);
  return`<h1>Cards</h1>
  <p class="lede">Every Hero, card, piece of equipment and token in Crystal Quest. ${HEROES.length} Heroes, ${CARDS.length} deck cards, ${TOKENS.length} tokens.</p>
  <div class="bar">${classChips(f.cls,"cat-cls",[...CLASSES,"Generic"])}</div>
  <div class="bar">
    <label class="field" for="cat-q">Search <input type="search" id="cat-q" data-act="cat-q" value="${esc(f.q)}" placeholder="Name or rules text"></label>
    <label class="field" for="cat-type">Type ${selectHTML("cat-type","cat-type",f.type,[["all","All"],["Hero","Heroes"],...TYPES.map(t=>[t,t]),["Token","Tokens"]])}</label>
    <label class="field" for="cat-sort">Sort by ${selectHTML("cat-sort","cat-sort",f.sort,SORTS)}</label>
    <span class="count">${list.length} shown</span>
  </div>
  <div class="grid">${gridWithGroups(list,f,c=>cardHTML(c,{button:"inspect"}))}</div>`;
}
const HSTATS=[["STR","str"],["DEF","def"],["AURA","aura"],["HP","hp"]];
function heroStatsHTML(h,cls="hstats"){return`<span class="${cls}">${HSTATS.map(([k,f])=>`<span><b>${esc(h[f])}</b><i>${k}</i></span>`).join("")}</span>`}
function partySlots(d){
  const names=["Lead","Center","Closer"];
  return`<div class="party">${names.map((n,i)=>{const h=BYID.get(d.heroes[i]);
    return h?`<div class="slot full hero-full" style="--cc:${cc(h.cls)};--ci:${ci(h.cls)}">${cardHTML(h,{slot:(i+1)+" · "+n.toUpperCase(),ctrl:`<div class="c-ctrl"><button type="button" class="btn sm" data-act="inspect" data-id="${esc(h.id)}">View</button><span class="sp"></span><button type="button" class="btn sm" data-act="unhero" data-id="${esc(h.id)}">Remove</button></div>`})}</div>`
      :`<div class="slot"><small>${i+1} · ${n}</small><span class="cl">Empty</span></div>`}).join("")}</div>`;
}
function stepsHTML(){
  const st=S.b.step,h=S.deck.heroes.length===3;
  return`<div class="steps"><div class="step ${st==="heroes"?"on":"done"}"><b>1</b>Choose 3 Heroes</div><i class="sep"></i><div class="step ${st==="cards"?"on":""}"><b>2</b>Build a 30-card deck</div></div>`;
}
function viewBuild(){
  const d=S.deck;
  if(d.heroes.length<3)S.b.step="heroes";
  if(S.b.step==="heroes"){
    const f={cls:S.b.heroCls,type:"Hero",sort:"class",q:""};
    const list=filterSort(HEROES,f);
    return`<h1>Deck Builder</h1>${stepsHTML()}
    <p class="lede">Pick three Heroes for your party, in order. Their classes decide which cards you can add next: cards of those classes plus Generic cards.</p>
    ${partySlots(d)}
    <div class="bar">${classChips(S.b.heroCls,"hero-cls",CLASSES)}</div>
    <div class="bar"><button type="button" class="btn primary go" data-act="to-cards" ${d.heroes.length===3?"":"disabled"}>Continue to cards →</button>
      <span class="count">${d.heroes.length}/3 Heroes chosen</span>
      ${d.heroes.length||deckTotal(d)?`<button type="button" class="btn" data-act="new-deck">Start over</button>`:""}</div>
    <div class="grid">${gridWithGroups(list,f,c=>{const i=d.heroes.indexOf(c.id);return cardHTML(c,{button:"pick-hero",picked:i>=0,slot:i>=0?["LEAD","CENTER","CLOSER"][i]:""})})}</div>`;
  }
  const pcls=partyClasses(d);
  const f=S.b;
  if(f.cls!=="all"&&f.cls!=="Generic"&&!pcls.includes(f.cls))f.cls="all";
  const pool=filterSort(CARDS.filter(c=>allowed(c,d)),f);
  const total=deckTotal(d);
  return`<h1>Deck Builder</h1>${stepsHTML()}
  ${partySlots(d)}
  <div class="split">
    <section aria-label="Card pool">
      <div class="bar">${classChips(f.cls,"b-cls",[...pcls.sort((a,b)=>clsOrder(a)-clsOrder(b)),"Generic"])}</div>
      <div class="bar">
        <label class="field" for="b-q">Search <input type="search" id="b-q" data-act="b-q" value="${esc(f.q)}" placeholder="Name or rules text"></label>
        <label class="field" for="b-type">Type ${selectHTML("b-type","b-type",f.type,[["all","All"],...TYPES.map(t=>[t,t])])}</label>
        <label class="field" for="b-sort">Sort by ${selectHTML("b-sort","b-sort",f.sort,SORTS)}</label>
        <button type="button" class="btn sm" data-act="to-heroes">Change Heroes</button>
      </div>
      <div class="grid">${gridWithGroups(pool,f,c=>{const q=d.cards[c.id]||0,m=maxCopies(c);
        return cardHTML(c,{ctrl:`<div class="c-ctrl"><button type="button" class="btn" data-act="dec" data-id="${esc(c.id)}" ${q?"":"disabled"} aria-label="Remove one ${esc(c.name)}">−</button><span class="q">${q}/${m}</span><button type="button" class="btn" data-act="inc" data-id="${esc(c.id)}" ${q>=m||total>=DECK_SIZE?"disabled":""} aria-label="Add one ${esc(c.name)}">+</button><span class="sp"></span></div>`})})}</div>
    </section>
    ${deckPanel(d)}
  </div>`;
}
function deckPanel(d){
  const total=deckTotal(d),iss=issues(d);
  const entries=Object.entries(d.cards).map(([id,q])=>({c:BYID.get(id),id,q})).filter(x=>x.q>0);
  const groups={};
  for(const e of entries){const g=e.c?(e.c.kind==="equip"?"Equipment":e.c.type):"Unknown";(groups[g]=groups[g]||[]).push(e)}
  const order=["Spell","Tactic","Song","Summon","Enchantment","Item","Equipment","Unknown"];
  const curve=[0,0,0,0,0,0,0,0];// 0..6, 7+ incl X
  for(const e of entries){if(!e.c)continue;const n=e.c.cost==="X"?7:Math.min(+e.c.cost||0,7);curve[n]+=e.q}
  const cmax=Math.max(1,...curve);
  return`<aside class="deckpanel" aria-label="Your deck">
    <label class="note" for="deck-name">Deck name</label>
    <input type="text" id="deck-name" data-act="deck-name" value="${esc(d.name)}" maxlength="60">
    <div class="meter"><span class="big">${total}</span><span class="of">/ ${DECK_SIZE} cards</span></div>
    <div class="prog${total>DECK_SIZE?" over":""}"><i style="width:${Math.min(100,total/DECK_SIZE*100)}%"></i></div>
    <div><div class="curve-l">Aura curve</div><div class="curve">${curve.map((n,i)=>`<div><span>${n||""}</span><span class="b" style="height:${n/cmax*48}px"></span><span>${i===7?"7+":i}</span></div>`).join("")}</div></div>
    <ul class="issues ${iss.length?"bad":"good"}">${iss.length?iss.map(x=>`<li>${esc(x)}</li>`).join(""):"<li>Deck is legal and ready to play.</li>"}</ul>
    <button type="button" class="btn primary handbtn" data-act="hand" data-src="current" ${total>=HAND_SIZE?"":"disabled"} title="Shuffle and draw 4. Then mulligan or draw a card.">Draw starting hand</button>
    ${entries.length?"":`<p class="note">Use + on a card to add it. You can include up to 2 copies of a card, and 1 of each Legendary.</p>`}
    ${d.heroes.length?`<div class="dl heroes"><h4><span>Heroes</span><span>${d.heroes.length}/3</span></h4><ul>${d.heroes.map((id,i)=>{const h=BYID.get(id);if(!h)return"";return`<li style="--cc:${cc(h.cls)};--ci:${ci(h.cls)}"><span class="q">${i+1}</span><i class="dot"></i><button type="button" class="n nlink" data-act="inspect" data-id="${esc(h.id)}" title="${["Lead","Center","Closer"][i]} · ${esc(h.cls)} · click to view">${esc(h.name)}</button>${heroStatsHTML(h,"hstats sm")}</li>`}).join("")}</ul></div>`:""}
    <div class="dl">${order.filter(g=>groups[g]).map(g=>`<h4><span>${g}</span><span>${groups[g].reduce((a,e)=>a+e.q,0)}</span></h4><ul>${groups[g].sort((a,b)=>costNum(a.c||{cost:0})-costNum(b.c||{cost:0})||a.id.localeCompare(b.id)).map(e=>`<li style="--cc:${cc(e.c?e.c.cls:"")};--ci:${ci(e.c?e.c.cls:"")}"><span class="q">${e.q}</span><i class="dot"></i>${e.c?`<button type="button" class="n nlink${allowed(e.c,d)?"":" bad"}" data-act="inspect" data-id="${esc(e.id)}" title="Click to view">${esc(e.c.name)}</button>`:`<span class="n bad">${esc(e.id)}</span>`}<span class="cst">${e.c?esc(e.c.cost):""}</span><button type="button" class="mini" data-act="dec" data-id="${esc(e.id)}" aria-label="Remove one">−</button><button type="button" class="mini" data-act="inc" data-id="${esc(e.id)}" aria-label="Add one" ${!e.c||e.q>=maxCopies(e.c)||total>=DECK_SIZE?"disabled":""}>+</button></li>`).join("")}</ul>`).join("")}</div>
    ${(()=>{const tk=tokensFor(d);return tk.length?`<div class="dl tokens"><h4><span>Tokens needed</span><span>${tk.reduce((a,t)=>a+t.q,0)}</span></h4><ul>${tk.map(t=>`<li style="--cc:${cc(t.c.cls)};--ci:${ci(t.c.cls)}"><span class="q">${t.q}</span><i class="dot"></i><button type="button" class="n nlink" data-act="inspect" data-id="${esc(t.c.id)}" title="Click to view">${esc(t.c.name)}</button><span class="cst">${esc(tokenStatLine(t.c))}</span></li>`).join("")}</ul><p class="note">Enough for every copy of the cards that make them. Tokens don't count toward the 30. Print &amp; Play includes them.</p></div>`:""})()}
    ${entries.some(e=>e.c&&!allowed(e.c,d))?`<button type="button" class="btn sm danger" data-act="prune">Remove cards your party can't play</button>`:""}
    <div class="actions">
      <button type="button" class="btn primary" data-act="save">Save deck</button>
      <button type="button" class="btn" data-act="new-deck">New deck</button>
    </div>
    <div class="actions">
      <button type="button" class="btn" data-act="pnp" data-src="current">Print &amp; Play PDF</button>
      <button type="button" class="btn" data-act="tts" data-src="current">Tabletop Simulator</button>
      <button type="button" class="btn" data-act="copylist" data-src="current">Copy list</button>
      <button type="button" class="btn" data-act="share" data-src="current">Share link</button>
    </div>
    <p class="note">${S.mode==="account"?"Saved decks sync to your account.":"You're not signed in, so saved decks stay in this browser."+(SB?' <a href="#account">Sign in</a>':"")}${S.dirty?" Unsaved changes.":""}</p>
  </aside>`;
}
/* ---------- best decks (win rates from finished Play-tab games) ---------- */
const BEST_MIN_GAMES=5,BEST_MIN_PCT=60;
async function loadBest(){if(!SB){S.best={at:Date.now(),rows:[],err:"off"};render();return}
  S.best=Object.assign({},S.best||{},{loading:true,at:Date.now()});
  const{data,error}=await SB.from("deck_leaderboard").select("*").gt("win_pct",BEST_MIN_PCT).order("win_pct",{ascending:false}).order("games",{ascending:false}).limit(200);
  S.best={at:Date.now(),rows:error?[]:(data||[]),err:error?error.message:null,loading:false};if(S.view==="best")render()}
function bestDeck(r){return{id:"best:"+r.deck_key,name:r.deck_name||"Untitled deck",heroes:(r.heroes||[]).slice(0,3),cards:r.cards||{}}}
function bestCard(r,rank){const d=bestDeck(r);const hs=d.heroes.map(h=>BYID.get(h)).filter(Boolean);
  const players=(r.players||[]).filter(Boolean);const pl=players.slice(0,3).map(esc).join(", ")+(players.length>3?` +${players.length-3} more`:"");
  return`<article class="deck best">
    <div class="best-h">${rank?`<span class="rank">#${rank}</span>`:""}<h3>${esc(d.name)}</h3><span class="pct" title="Win percentage">${Number(r.win_pct).toFixed(0)}%</span></div>
    <div class="pips">${hs.map(h=>`<button type="button" class="pill" style="--cc:${cc(h.cls)};--ci:${ci(h.cls)}" data-act="inspect" data-id="${esc(h.id)}"><i class="dot"></i>${esc(h.name)}</button>`).join("")}</div>
    <div class="best-rec"><b>${r.wins}–${r.losses}${r.draws?`–${r.draws}`:""}</b> in ${r.games} game${r.games===1?"":"s"} · vs AI ${r.ai_wins}/${r.ai_games} · online ${r.online_wins}/${r.online_games}</div>
    <div class="note">Played by ${pl||"Guest"} · last game ${esc(new Date(r.last_played).toLocaleDateString())}</div>
    <div class="actions"><button type="button" class="btn sm" data-act="best-view" data-id="${esc(r.deck_key)}">View list</button><button type="button" class="btn sm primary" data-act="best-open" data-id="${esc(r.deck_key)}">Open in Deck Builder</button></div>
  </article>`}
function viewBest(){const b=S.best;
  const head=`<h1>Best Decks</h1><p class="lede">Decks with the highest win rate in finished Play-tab games (vs AI and online). A deck needs at least ${BEST_MIN_GAMES} games and over ${BEST_MIN_PCT}% wins to be listed. The same Heroes and 30 cards count as one deck, whoever plays it.</p>
    <div class="bar"><button type="button" class="btn sm" data-act="best-refresh">Refresh</button><a class="btn sm" href="#play">Play a game</a></div>`;
  if(!SB)return head+`<div class="empty">Win tracking needs the site's account service, which isn't reachable right now.</div>`;
  if(!b||b.loading&&!b.rows)return head+`<div class="empty">Loading results…</div>`;
  if(b.err)return head+`<div class="empty">Couldn't load results: ${esc(b.err)}</div>`;
  const top=b.rows.filter(r=>r.games>=BEST_MIN_GAMES),soon=b.rows.filter(r=>r.games<BEST_MIN_GAMES);
  return head+(top.length?`<div class="decks">${top.map((r,i)=>bestCard(r,i+1)).join("")}</div>`:`<div class="empty">No deck has ${BEST_MIN_GAMES}+ games above ${BEST_MIN_PCT}% yet. Finish games in the Play tab to fill this list.</div>`)
    +(soon.length?`<h2 style="margin-top:28px">On the rise</h2><p class="lede">Over ${BEST_MIN_PCT}% wins but fewer than ${BEST_MIN_GAMES} games so far.</p><div class="decks">${soon.slice(0,24).map(r=>bestCard(r,0)).join("")}</div>`:"")}
function bestListModal(r){const d=bestDeck(r);const l=$("#layer");const m=document.createElement("div");m.className="modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label",d.name);
  const rows=Object.entries(d.cards).map(([id,q])=>({c:BYID.get(id),id,q})).sort((a,b)=>(a.c?costNum(a.c):99)-(b.c?costNum(b.c):99)||a.id.localeCompare(b.id));
  m.innerHTML=`<div class="box"><h2>${esc(d.name)}</h2><p class="note">${r.wins}–${r.losses}${r.draws?`–${r.draws}`:""} · ${Number(r.win_pct).toFixed(1)}% wins in ${r.games} games</p>
    <div class="dl"><h4><span>Heroes</span><span>3</span></h4><ul>${d.heroes.map(h=>{const c=BYID.get(h);return c?`<li style="--cc:${cc(c.cls)};--ci:${ci(c.cls)}"><i class="dot"></i><button type="button" class="n nlink" data-act="inspect" data-id="${esc(c.id)}">${esc(c.name)}</button></li>`:""}).join("")}</ul>
    <h4><span>Cards</span><span>${rows.reduce((a,e)=>a+e.q,0)}</span></h4><ul>${rows.map(e=>`<li style="--cc:${cc(e.c?e.c.cls:"")};--ci:${ci(e.c?e.c.cls:"")}"><span class="q">${e.q}</span><i class="dot"></i>${e.c?`<button type="button" class="n nlink" data-act="inspect" data-id="${esc(e.id)}">${esc(e.c.name)}</button><span class="cst">${esc(e.c.cost)}</span>`:`<span class="n bad">${esc(e.id)}</span>`}</li>`).join("")}</ul></div>
    <div class="actions"><button type="button" class="btn primary" data-act="best-open" data-id="${esc(r.deck_key)}">Open in Deck Builder</button><button type="button" class="btn" data-act="close">Close</button></div></div>`;
  m.addEventListener("click",e=>{if(e.target===m)m.remove()});l.appendChild(m)}
function confirmReplace(){return window.confirm("Replace your unsaved draft in the Deck Builder with this deck?")}
function viewDecks(){
  const ds=S.decks;
  return`<h1>My Decks</h1>
  <p class="lede">${S.mode==="account"?`Signed in${S.me&&S.me.name?" as "+esc(S.me.name):""}. Decks you save are stored in your account and follow you to any device.`:"You're browsing as a guest, so decks are saved in this browser only."+(SB?' <a href="#account">Create a free account</a> to keep decks on any device.':"")}</p>
  <div class="bar"><button type="button" class="btn primary" data-act="new-deck-go">New deck</button>
  ${S.mode==="account"&&store.get("cq.decks",[]).length?`<button type="button" class="btn" data-act="migrate">Move ${store.get("cq.decks",[]).length} browser deck(s) into my account</button>`:""}</div>
  <div class="decks">${ds.length?ds.map(d=>{const iss=issues(d);const t=deckTotal(d);
    return`<div class="deck"><h3>${esc(d.name)}</h3>
    <div class="pips">${d.heroes.map(h=>BYID.get(h)).filter(Boolean).map(h=>`<span class="pill" style="--cc:${cc(h.cls)};--ci:${ci(h.cls)}"><i class="dot"></i>${esc(h.name)}</span>`).join("")||'<span class="note">No Heroes yet</span>'}</div>
    <div class="note">${t}/${DECK_SIZE} cards${d.updated?" · saved "+new Date(d.updated).toLocaleDateString():""}</div>
    <span class="status ${iss.length?"no":"ok"}">${iss.length?iss.length+" issue"+(iss.length>1?"s":""):"Legal deck"}</span>
    <div class="actions"><button type="button" class="btn sm primary" data-act="open" data-id="${d.id}">Edit</button>
      <button type="button" class="btn sm" data-act="hand" data-src="${d.id}">Test hand</button>
      <button type="button" class="btn sm" data-act="pnp" data-src="${d.id}">Print &amp; Play</button>
      <button type="button" class="btn sm" data-act="tts" data-src="${d.id}">TTS</button>
      <button type="button" class="btn sm" data-act="share" data-src="${d.id}">Share</button>
      <button type="button" class="btn sm" data-act="dup" data-id="${d.id}">Duplicate</button>
      <button type="button" class="btn sm danger" data-act="del" data-id="${d.id}">Delete</button></div>
    <div class="actions" data-confirm="${d.id}" hidden><span class="note">Delete this deck for good?</span><button type="button" class="btn sm danger" data-act="del-yes" data-id="${d.id}">Delete</button><button type="button" class="btn sm" data-act="del-no" data-id="${d.id}">Keep</button></div>
    </div>`}).join(""):`<div class="empty">No saved decks yet. Build one in the Deck Builder and press Save deck.</div>`}</div>
  <div class="panel"><h2>Import a deck list</h2>
  <p class="note">Paste a list made with Copy list. Format: a "Heroes:" line with three names, then one card per line like "2 Jab".</p>
  <textarea id="import-text" placeholder="# My deck&#10;Heroes: Ember Mage, Dawn Priest, Night Stalker&#10;2 Flame Jab&#10;1 Aura Crystal"></textarea>
  <div class="actions"><button type="button" class="btn" data-act="import">Import into builder</button></div></div>`;
}
function inspect(c){
  const d=S.deck,can=c.kind!=="hero"&&c.kind!=="token"&&d.heroes.length===3&&allowed(c,d);
  const q=d.cards[c.id]||0;
  const l=$("#layer");const m=document.createElement("div");m.className="modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label",c.name);
  m.innerHTML=`<div class="box">${cardHTML(c)}<div class="actions">${can?`<button type="button" class="btn primary" data-act="inc-close" data-id="${esc(c.id)}" ${q>=maxCopies(c)||deckTotal(d)>=DECK_SIZE?"disabled":""}>Add to ${esc(d.name)} (${q}/${maxCopies(c)})</button>`:""}<button type="button" class="btn" data-act="close">Close</button></div>${c.kind==="token"?`<p class="note">Token. Made by ${esc(c.madeBy)}. Tokens are created during play and don't count toward your deck.</p>`:""}${c.kind!=="hero"&&c.kind!=="token"&&!can?`<p class="note">${d.heroes.length<3?"Choose three Heroes in the Deck Builder to start adding cards.":"Your current party can't play this card."}</p>`:""}</div>`;
  m.addEventListener("click",e=>{if(e.target===m)m.remove()});
  l.appendChild(m);m.querySelector("[data-act=close]").focus();
}

/* ---------- test draw: starting hand + draw a card ---------- */
function rint(n){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}catch(e){return Math.floor(Math.random()*n)}}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rint(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
const HAND_SIZE=4;
function libraryOf(d){const l=[];for(const[id,q]of Object.entries(d.cards)){if(BYID.get(id))for(let i=0;i<q;i++)l.push(id)}return l}
function dealHand(d){const lib=shuffle(libraryOf(d));const hand=lib.splice(0,HAND_SIZE);
  S.hand={d,lib,hand,mull:false,extra:0,fresh:new Set()}}
function handAura(d){return d.heroes.map(h=>BYID.get(h)).filter(Boolean).reduce((a,h)=>a+(+h.aura||0),0)}
function handBody(){
  const H=S.hand,d=H.d,total=deckTotal(d);
  const heroes=d.heroes.map(h=>BYID.get(h)).filter(Boolean);
  const canMull=!H.mull&&H.extra===0;
  return`<div class="hand-h"><div class="hand-t"><h2>${H.extra?"Hand":"Starting hand"}</h2><p class="note">${esc(d.name)}${heroes.length?" · "+heroes.map(h=>esc(h.name)).join(", "):""}</p></div>
    <div class="hand-r">${heroes.length?`<div class="aura-box" title="${esc(heroes.map(h=>h.name+" "+(+h.aura||0)).join(", "))}"><span class="aura-gem" aria-hidden="true"></span><div><b>${handAura(d)}</b><small>Starting Aura</small><span class="aura-src">${heroes.map(h=>esc(String(+h.aura||0))).join(" + ")}</span></div></div>`:""}
    <button type="button" class="btn sm" data-act="close">Close</button></div></div>
  ${total!==DECK_SIZE?`<p class="note warn">This deck has ${total} cards, not ${DECK_SIZE}, so the odds won't match a legal deck.</p>`:""}
  <div class="hand-stats"><span class="pill">In hand <b>${H.hand.length}</b></span><span class="pill">Library <b>${H.lib.length}</b></span>${H.extra?`<span class="pill">Drawn <b>${H.extra}</b></span>`:""}${H.mull?`<span class="pill">Mulliganed</span>`:""}
    <span class="pill">Aura costs <b>${H.hand.map(id=>BYID.get(id).cost).sort((a,b)=>costNum({cost:a})-costNum({cost:b})).map(esc).join(", ")||"—"}</b></span></div>
  <div class="actions">
    <button type="button" class="btn primary" data-act="hand-draw" ${H.lib.length?"":"disabled"}>Draw a card</button>
    <button type="button" class="btn" data-act="hand-mull" ${canMull?"":"disabled"} title="Once, before you draw any extra cards">Mulligan</button>
    <button type="button" class="btn" data-act="hand-new">New hand</button>
  </div>
  <p class="note">${H.lib.length?(canMull?"Setup: draw 4, then you may mulligan once (shuffle your hand back and draw 4 new cards). Draw a card works like the Dawn draw.":"Draw a card works like the Dawn draw. Press D to draw, N for a new hand."):"Your library is empty."}</p>
  <div class="grid hand-grid">${H.hand.map((id,i)=>cardHTML(BYID.get(id),{button:"inspect-hand",slot:H.fresh.has(i)?"NEW":""})).join("")}</div>`;
}
function renderHand(){const m=document.getElementById("handm");if(!m||!S.hand)return;m.querySelector(".box").innerHTML=handBody()}
function openHand(d){
  if(!d)return;const n=deckTotal(d);
  if(n<HAND_SIZE){toast(`Add at least ${HAND_SIZE} cards to draw a hand.`);return}
  dealHand(d);
  document.getElementById("handm")?.remove();
  const m=document.createElement("div");m.className="modal";m.id="handm";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label","Test hand");
  m.innerHTML=`<div class="box wide"></div>`;m.addEventListener("click",e=>{if(e.target===m)m.remove()});
  $("#layer").appendChild(m);renderHand();m.querySelector("[data-act=hand-draw]")?.focus();
}
function handDraw(){const H=S.hand;if(!H||!H.lib.length){toast("Your library is empty.");return}
  H.hand.push(H.lib.shift());H.extra++;H.fresh=new Set([H.hand.length-1]);renderHand()}
function handMull(){const H=S.hand;if(!H||H.mull||H.extra)return;
  const lib=shuffle(H.lib.concat(H.hand));H.hand=lib.splice(0,HAND_SIZE);H.lib=lib;H.mull=true;H.fresh=new Set();renderHand();toast("Mulligan taken. This is your hand.")}

/* ---------- deck list text ---------- */
function deckText(d,withTokens=true){
  const lines=[`# ${d.name}`,`Heroes: ${d.heroes.map(h=>BYID.get(h)?.name||h).join(", ")}`];
  const e=Object.entries(d.cards).filter(([,q])=>q>0).sort((a,b)=>{const A=BYID.get(a[0]),B=BYID.get(b[0]);return(A&&B?clsOrder(A.cls)-clsOrder(B.cls)||costNum(A)-costNum(B):0)||a[0].localeCompare(b[0])});
  for(const[id,q]of e)lines.push(`${q} ${BYID.get(id)?.name||id}`);
  const tk=tokensFor(d);if(withTokens&&tk.length)lines.push(`Tokens: ${tk.map(t=>t.q+" "+t.c.name).join(", ")}`);
  return lines.join("\n");
}
function parseDeck(txt){
  const d=blankDeck();const miss=[];
  const norm=s=>s.trim().toLowerCase().replace(/[“”]/g,'"');
  const find=(n,pool)=>pool.find(c=>norm(c.name)===norm(n))||pool.find(c=>sortName(c.name)===norm(n).replace(/^"|"$/g,""));
  for(let line of txt.split(/\r?\n/)){line=line.trim();if(!line)continue;
    if(line.startsWith("#")){d.name=line.replace(/^#+\s*/,"")||d.name;continue}
    if(/^tokens?\s*:/i.test(line))continue;
    const hm=line.match(/^heroes?\s*:\s*(.*)$/i);
    if(hm){for(const n of hm[1].split(",")){if(!n.trim())continue;const h=find(n,HEROES);if(h&&d.heroes.length<3&&!d.heroes.includes(h.id))d.heroes.push(h.id);else if(!h)miss.push(n.trim())}continue}
    const m=line.match(/^(\d+)\s*x?\s+(.+)$/i);const q=m?+m[1]:1,n=m?m[2]:line;
    const c=find(n,CARDS);if(c)d.cards[c.id]=(d.cards[c.id]||0)+q;else miss.push(n)}
  return{d,miss};
}

/* ---------- canvas card renderer (exports) ---------- */
let fontsReady=null;
function loadFonts(){return fontsReady||(fontsReady=Promise.all(['700 40px "Alegreya SC"','800 40px "Alegreya SC"','400 30px "Alegreya Sans"','700 30px "Alegreya Sans"','italic 400 30px "Alegreya Sans"'].map(f=>document.fonts.load(f).catch(()=>null))))}
const F_DISP='"Alegreya SC", Georgia, serif',F_BODY='"Alegreya Sans", "Segoe UI", sans-serif';
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function hex(ctx,cx,cy,r){ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2;ctx.lineTo(cx+r*Math.cos(a)*0.88,cy+r*Math.sin(a))}ctx.closePath()}
function fitText(ctx,text,font,size,maxW,weight){let s=size;do{ctx.font=`${weight} ${s}px ${font}`;if(ctx.measureText(text).width<=maxW)break;s-=1}while(s>10);return s}
function layoutRules(ctx,text,w,size){
  ctx.font=`400 ${size}px ${F_BODY}`;
  const lh=size*1.28,paraGap=size*0.45,lines=[];
  for(const para of text.split("\n").filter(p=>p.trim())){
    const words=para.replace(/\{A\}/g,"◆").split(/\s+/).filter(Boolean);
    let line=[],lw=0;
    for(const wd of words){
      const pill=/^\{L(\d)\}$/.exec(wd);
      const ww=pill?(ctx.measureText("LV "+pill[1]).width+size*0.6):ctx.measureText(wd).width;
      const sp=line.length?ctx.measureText(" ").width:0;
      if(line.length&&lw+sp+ww>w){lines.push({items:line});line=[];lw=0}
      line.push({t:pill?"LV "+pill[1]:wd,pill:!!pill,w:ww});lw+=(line.length>1?ctx.measureText(" ").width:0)+ww;
    }
    if(line.length)lines.push({items:line});
    lines.push({gap:true});
  }
  if(lines.length&&lines[lines.length-1].gap)lines.pop();
  const h=lines.reduce((a,l)=>a+(l.gap?paraGap:lh),0);
  return{lines,h,lh,paraGap};
}
function drawCard(ctx,c,W,H){
  const s=W/750;ctx.save();ctx.textBaseline="alphabetic";
  const col=CLASS_COLOR_CLEAN[c.cls]||"#777",tcol=CLASS_TEXT_CLEAN[c.cls]||"#FFFFFF";
  ctx.fillStyle=col;rr(ctx,0,0,W,H,34*s);ctx.fill();
  const ix=24*s,iy=24*s,iw=W-48*s,ih=H-48*s;
  ctx.fillStyle="#FBFBF8";rr(ctx,ix,iy,iw,ih,18*s);ctx.fill();
  // header band
  const hb=120*s;ctx.save();rr(ctx,ix,iy,iw,ih,18*s);ctx.clip();ctx.fillStyle=col;ctx.fillRect(ix,iy,iw,hb);ctx.restore();
  const gemR=52*s,gem=hasGem(c);
  const nameMax=iw-40*s-(gem?gemR*2+10*s:0);
  ctx.fillStyle=tcol;const ns=fitText(ctx,c.name,F_DISP,58*s,nameMax,700);ctx.font=`700 ${ns}px ${F_DISP}`;ctx.fillText(c.name,ix+22*s,iy+hb/2+ns*0.34);
  if(gem){const gx=ix+iw-gemR-16*s,gy=iy+hb/2;ctx.fillStyle="#FBFBF8";hex(ctx,gx,gy,gemR);ctx.fill();ctx.strokeStyle="rgba(0,0,0,.25)";ctx.lineWidth=3*s;hex(ctx,gx,gy,gemR-6*s);ctx.stroke();
    ctx.fillStyle="#1C232E";ctx.font=`800 ${52*s}px ${F_DISP}`;ctx.textAlign="center";ctx.fillText(String(c.cost),gx,gy+18*s);ctx.textAlign="left"}
  // type line
  let ty=iy+hb+50*s;ctx.font=`italic 400 ${32*s}px ${F_BODY}`;ctx.fillStyle="#4C5563";
  const tl=c.kind==="hero"?"Hero":c.kind==="token"?"Token — "+c.sub:(c.sup?c.sup+" ":"")+c.type+(c.sub?" — "+c.sub:"");
  ctx.fillText(tl,ix+22*s,ty);ctx.textAlign="right";ctx.font=`700 ${30*s}px ${F_BODY}`;ctx.fillStyle=col==="#D4AE3A"?"#8A6D10":col;ctx.fillText(c.cls.toUpperCase(),ix+iw-22*s,ty);ctx.textAlign="left";
  ctx.strokeStyle="#D9DCD6";ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(ix+22*s,ty+20*s);ctx.lineTo(ix+iw-22*s,ty+20*s);ctx.stroke();
  // footer
  const stats=c.kind==="hero"?[["STR",c.str],["DEF",c.def],["AURA",c.aura],["HP",c.hp]]:c.kind==="token"?tokenStats(c):null;
  const hasFoot=c.kind!=="card"||c.sup==="Legendary";const footH=stats?150*s:(hasFoot?80*s:30*s),footY=iy+ih-footH;
  // rules
  const rx=ix+30*s,rw=iw-60*s,ry=ty+50*s,rh=footY-ry-16*s;
  let size=40*s,L;do{L=layoutRules(ctx,c.rules||"",rw,size);if(L.h<=rh)break;size-=1*s}while(size>16*s);
  let y=ry+L.lh*0.8;ctx.fillStyle="#1C232E";
  for(const ln of L.lines){if(ln.gap){y+=L.paraGap;continue}let x=rx;
    for(const it of ln.items){
      if(it.pill){ctx.fillStyle="#1C232E";rr(ctx,x,y-size*0.85,it.w,size*1.05,6*s);ctx.fill();ctx.fillStyle="#FBFBF8";ctx.font=`700 ${size*0.78}px ${F_BODY}`;ctx.fillText(it.t,x+size*0.3,y-size*0.08);ctx.font=`400 ${size}px ${F_BODY}`;ctx.fillStyle="#1C232E"}
      else{ctx.font=`400 ${size}px ${F_BODY}`;if(it.t.includes("◆")){let xx=x;for(const part of it.t.split(/(◆)/)){if(part==="◆"){ctx.fillStyle="#0E747B";ctx.fillText("◆",xx,y);ctx.fillStyle="#1C232E"}else ctx.fillText(part,xx,y);xx+=ctx.measureText(part).width}}else ctx.fillText(it.t,x,y)}
      x+=it.w+ctx.measureText(" ").width}
    y+=L.lh}
  if(hasFoot){ctx.strokeStyle="#D9DCD6";ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(ix+22*s,footY);ctx.lineTo(ix+iw-22*s,footY);ctx.stroke()}
  if(stats){
    const st=stats,nb=st.length;const bw=(iw-44*s-(nb-1)*14*s)/nb;
    st.forEach(([k,v],i)=>{const bx=ix+22*s+i*(bw+14*s),by=footY+18*s,bh=footH-40*s;ctx.strokeStyle=col;ctx.lineWidth=4*s;rr(ctx,bx,by,bw,bh,12*s);ctx.stroke();
      ctx.textAlign="center";ctx.fillStyle="#1C232E";ctx.font=`800 ${50*s}px ${F_DISP}`;ctx.fillText(String(v),bx+bw/2,by+bh*0.55);ctx.font=`700 ${22*s}px ${F_BODY}`;ctx.fillStyle="#5A6474";ctx.fillText(k,bx+bw/2,by+bh-14*s);ctx.textAlign="left"});
  }else{
    let ft=c.kind==="token"?(c.tkind==="Equipment"?[c.region,"+"+c.str+" STR","Token"].join("  ·  "):"Pillar token"):c.kind==="equip"?[c.region,c.pstr?"+"+c.pstr+" STR":"",c.pdef?"+"+c.pdef+" DEF":""].filter(Boolean).join("  ·  "):(c.sup==="Legendary"?"Legendary · 1 per deck":"");
    ctx.font=`700 ${30*s}px ${F_BODY}`;ctx.fillStyle="#4C5563";ctx.fillText(ft,ix+22*s,footY+50*s);
  }
  ctx.font=`700 ${20*s}px ${F_DISP}`;ctx.fillStyle=tcol;ctx.globalAlpha=.85;ctx.textAlign="center";ctx.fillText("CRYSTAL QUEST",W/2,H-6*s);
  ctx.font=`700 ${19*s}px ${F_BODY}`;ctx.textAlign="right";ctx.fillText("v"+(c.ver||1),W-44*s,H-6*s);ctx.globalAlpha=1;ctx.textAlign="left";
  ctx.restore();
}
function drawBack(ctx,W,H){
  const s=W/750;ctx.save();
  ctx.fillStyle="#14202A";rr(ctx,0,0,W,H,34*s);ctx.fill();
  ctx.strokeStyle="#3BBFC6";ctx.lineWidth=6*s;rr(ctx,30*s,30*s,W-60*s,H-60*s,22*s);ctx.stroke();
  ctx.globalAlpha=.18;ctx.lineWidth=2*s;for(let i=-H;i<W+H;i+=60*s){ctx.beginPath();ctx.moveTo(i,40*s);ctx.lineTo(i+H,H);ctx.stroke();ctx.beginPath();ctx.moveTo(i+H,40*s);ctx.lineTo(i,H);ctx.stroke()}ctx.globalAlpha=1;
  const cx=W/2,cy=H/2;ctx.fillStyle="#14202A";ctx.beginPath();ctx.arc(cx,cy,190*s,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#3BBFC6";ctx.beginPath();ctx.moveTo(cx,cy-150*s);ctx.lineTo(cx+80*s,cy-30*s);ctx.lineTo(cx,cy+150*s);ctx.lineTo(cx-80*s,cy-30*s);ctx.closePath();ctx.fill();
  ctx.fillStyle="#9EE6EA";ctx.beginPath();ctx.moveTo(cx,cy-150*s);ctx.lineTo(cx+80*s,cy-30*s);ctx.lineTo(cx,cy-10*s);ctx.closePath();ctx.fill();
  ctx.fillStyle="#E8F6F7";ctx.textAlign="center";ctx.font=`800 ${64*s}px ${F_DISP}`;ctx.fillText("CRYSTAL",cx,cy-230*s);ctx.fillText("QUEST",cx,cy+270*s);
  ctx.restore();
}
function cardCanvas(c,W,H){const cv=document.createElement("canvas");cv.width=W;cv.height=H;const ctx=cv.getContext("2d");c?drawCard(ctx,c,W,H):drawBack(ctx,W,H);return cv}

/* ---------- exports ---------- */
function deckBySrc(src){return src==="current"?S.deck:S.decks.find(d=>d.id===src)}
const safeName=n=>(n||"deck").replace(/[^\w\- ]+/g,"").trim().replace(/\s+/g,"_")||"deck";
async function offer(filename,data){
  const blob=data instanceof Blob?data:new Blob([data]);const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);toast("Downloaded "+filename);
}
function exportList(d){const l=[];d.heroes.forEach(h=>{const c=BYID.get(h);if(c)l.push(c)});
  Object.entries(d.cards).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([id,q])=>{const c=BYID.get(id);if(c)for(let i=0;i<q;i++)l.push(c)});return l}
/* print tracking: per deck, the version of each card last printed in this browser */
const printKey=d=>"cq.printed."+d.id;
function printRecord(d){return store.get(printKey(d),null)}
function printPlan(d){const rec=printRecord(d);const all=exportList(d);const toks=[];tokensFor(d).forEach(t=>{for(let i=0;i<t.q;i++)toks.push(t.c)});
  if(!rec)return{rec:null,all,toks,upd:null,updToks:null};
  const changed=c=>!(c.id in rec.v)||rec.v[c.id]<(c.ver||1);
  return{rec,all,toks,upd:all.filter(changed),updToks:toks.filter(changed)}}
function choosePrint(d){const p=printPlan(d);const l=$("#layer");const m=document.createElement("div");m.className="modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label","Print and play");
  const names=p.upd?[...new Set([...p.upd,...p.updToks].map(c=>c.name+" v"+(c.ver||1)))]:[];
  m.innerHTML=`<div class="box"><h2>Print &amp; Play</h2><p class="note">Every printed card shows its version (v1, v2…) in the bottom corner.</p>
    <div class="actions" style="flex-direction:column;align-items:stretch">
      <button type="button" class="btn primary" data-act="pnp-go" data-src="${esc(d.id)}" data-v="all">Print the whole deck (${p.all.length+p.toks.length} cards)</button>
      <button type="button" class="btn" data-act="pnp-go" data-src="${esc(d.id)}" data-v="upd" ${p.upd&&p.upd.length+p.updToks.length?"":"disabled"}>Print only updated cards${p.upd?` (${p.upd.length+p.updToks.length})`:""}</button>
    </div>
    <p class="note">${p.rec?`Last printed ${esc(new Date(p.rec.at).toLocaleString())} in this browser. Updated means a newer card version or a card added to the deck since then.${names.length?`<br><b>To print:</b> ${esc(names.join(", "))}`:"<br>Nothing has changed since then."}`:"This deck hasn't been printed from this browser yet, so print the whole deck first."}</p>
    <div class="actions"><button type="button" class="btn" data-act="close">Cancel</button></div></div>`;
  m.addEventListener("click",e=>{if(e.target===m)m.remove()});l.appendChild(m)}
async function exportPnP(d,mode){mode=mode||"all";const plan=printPlan(d);
  if(!window.jspdf){toast("The PDF tool didn't load. Reload the page and try again.");return}
  const iss=issues(d);
  busy(true,"Building print & play PDF…");await loadFonts();
  try{
    const{jsPDF}=window.jspdf;const pdf=new jsPDF({unit:"in",format:"letter",orientation:"portrait"});
    // cover page
    pdf.setFont("helvetica","bold");pdf.setFontSize(22);pdf.text(d.name,0.75,1);
    pdf.setFont("helvetica","normal");pdf.setFontSize(11);
    pdf.text(`Crystal Quest deck · ${deckTotal(d)} cards + 3 Heroes · printed ${new Date().toLocaleDateString()}${mode==="upd"?" · UPDATED CARDS ONLY":""}`,0.75,1.3);
    if(iss.length){pdf.setTextColor(170,60,30);pdf.text("Note: "+iss.join(" "),0.75,1.6,{maxWidth:7});pdf.setTextColor(0)}
    let y=2.1;pdf.setFont("helvetica","bold");pdf.text("Heroes",0.75,y);pdf.setFont("helvetica","normal");y+=0.25;
    d.heroes.forEach((h,i)=>{const c=BYID.get(h);pdf.text(`${["Lead","Center","Closer"][i]}: ${c?c.name+" ("+c.cls+")":h}`,0.9,y);y+=0.22});
    y+=0.15;pdf.setFont("helvetica","bold");pdf.text("Deck",0.75,y);pdf.setFont("helvetica","normal");y+=0.25;
    const rows=deckText(d,false).split("\n").slice(2);const half=Math.ceil(rows.length/2);
    rows.forEach((r,i)=>pdf.text(r.replace(/[“”]/g,'"'),i<half?0.9:4.5,y+(i%half)*0.22));
    const toks=tokensFor(d);
    if(toks.length){y+=half*0.22+0.2;pdf.setFont("helvetica","bold");pdf.text("Tokens to print",0.75,y);pdf.setFont("helvetica","normal");y+=0.25;
      const th=Math.ceil(toks.length/2);toks.forEach((t,i)=>pdf.text(`${t.q} ${t.c.name} (${tokenStatLine(t.c)})`,i<th?0.9:4.5,y+(i%th)*0.22));}
    pdf.setFontSize(9);pdf.setTextColor(90);pdf.text("Print at 100% (no scaling). Cut on the gray lines. Cards are 2.5 x 3.5 in, standard sleeve size. The last page has optional card backs.",0.75,10.4,{maxWidth:7});pdf.setTextColor(0);
    const cards=mode==="upd"?plan.upd:plan.all,cache=new Map();
    if(mode==="upd"){pdf.setFontSize(10);pdf.text("This printing only has cards updated since "+(plan.rec?new Date(plan.rec.at).toLocaleDateString():"the last print")+": "+[...new Set([...plan.upd,...plan.updToks].map(c=>c.name+" (v"+(c.ver||1)+")"))].join(", "),0.75,9.6,{maxWidth:7});pdf.setFontSize(11)}
    const W=750,H=1050,mx=0.5,my=0.25,cw=2.5,ch=3.5;
    const img=c=>{if(!cache.has(c.id))cache.set(c.id,cardCanvas(c,W,H).toDataURL("image/jpeg",0.9));return cache.get(c.id)};
    const page=(items,getImg)=>{pdf.addPage();items.forEach((c,i)=>{const x=mx+(i%3)*cw,yy=my+Math.floor(i/3)*ch;pdf.addImage(getImg(c),"JPEG",x,yy,cw,ch,undefined,"FAST")});
      pdf.setDrawColor(170);pdf.setLineWidth(0.005);for(let i=0;i<=3;i++){pdf.line(mx+i*cw,0,mx+i*cw,11);pdf.line(0,my+i*ch,8.5,my+i*ch)}};
    for(let i=0;i<cards.length;i+=9){page(cards.slice(i,i+9),img);await new Promise(r=>setTimeout(r,0))}
    const tokCards=mode==="upd"?plan.updToks:plan.toks;
    for(let i=0;i<tokCards.length;i+=9){page(tokCards.slice(i,i+9),img);await new Promise(r=>setTimeout(r,0))}
    const back=cardCanvas(null,W,H).toDataURL("image/jpeg",0.9);page(Array(9).fill({}),()=>back);
    const blob=pdf.output("blob");busy(false);
    const rec=mode==="upd"&&plan.rec?{v:{...plan.rec.v}}:{v:{}};[...plan.all,...plan.toks].forEach(c=>{if(mode==="all"||cards.includes(c)||tokCards.includes(c))rec.v[c.id]=c.ver||1});rec.at=Date.now();store.set(printKey(d),rec);
    await offer(safeName(d.name)+(mode==="upd"?"_updated_cards.pdf":"_print_and_play.pdf"),blob);
  }catch(e){busy(false);console.error(e);toast("Couldn't build the PDF. Try again.")}
}
async function exportTTS(d){
  if(!window.JSZip){toast("The zip tool didn't load. Reload the page and try again.");return}
  if(d.heroes.length+Object.keys(d.cards).length===0){toast("This deck is empty.");return}
  busy(true,"Building Tabletop Simulator files…");await loadFonts();
  try{
    const heroes=d.heroes.map(h=>BYID.get(h)).filter(Boolean);
    const uniq=Object.entries(d.cards).filter(([,q])=>q>0).map(([id,q])=>({c:BYID.get(id),q})).filter(x=>x.c).sort((a,b)=>sortName(a.c.name).localeCompare(sortName(b.c.name)));
    const toks=tokensFor(d);
    const faces=[...heroes,...uniq.map(u=>u.c),...toks.map(t=>t.c)];
    const CW=500,CH=700,cols=10,rows=Math.max(2,Math.ceil(faces.length/cols));
    const sheet=document.createElement("canvas");sheet.width=CW*cols;sheet.height=CH*rows;const sx=sheet.getContext("2d");
    sx.fillStyle="#14202A";sx.fillRect(0,0,sheet.width,sheet.height);
    faces.forEach((c,i)=>{sx.save();sx.translate((i%cols)*CW,Math.floor(i/cols)*CH);drawCard(sx,c,CW,CH);sx.restore()});
    const toBlob=cv=>new Promise(r=>cv.toBlob(r,"image/png"));
    const faceBlob=await toBlob(sheet),backBlob=await toBlob(cardCanvas(null,CW,CH));
    const T=(x,z)=>({posX:x,posY:1,posZ:z,rotX:0,rotY:180,rotZ:180,scaleX:1,scaleY:1,scaleZ:1});
    const custom={"1":{FaceURL:"PASTE_FACE_SHEET_URL_HERE",BackURL:"PASTE_CARD_BACK_URL_HERE",NumWidth:cols,NumHeight:rows,BackIsHidden:true,UniqueBack:false,Type:0}};
    const cardObj=(c,idx,x,z)=>({Name:"Card",Transform:T(x,z),Nickname:c.name,Description:rulesPlain(c.rules||""),GMNotes:c.cls+(c.kind==="hero"?" Hero":" "+c.type),CardID:100+idx,SidewaysCard:false,CustomDeck:custom,ColorDiffuse:{r:0.71,g:0.71,b:0.71}});
    const deckObj=(nick,list,x)=>list.length===1?{...cardObj(list[0].c,list[0].i,x,0),Nickname:list[0].c.name}:({Name:"Deck",Transform:T(x,0),Nickname:nick,Description:"",DeckIDs:list.map(o=>100+o.i),CustomDeck:custom,ContainedObjects:list.map(o=>cardObj(o.c,o.i,x,0)),ColorDiffuse:{r:0.71,g:0.71,b:0.71},Locked:false,Grid:true,Snap:true,Autoraise:true,Sticky:true,Tooltip:true,HideWhenFaceDown:true,SidewaysCard:false});
    const heroList=heroes.map((c,i)=>({c,i}));
    const deckList=[];uniq.forEach((u,k)=>{for(let j=0;j<u.q;j++)deckList.push({c:u.c,i:heroes.length+k})});
    const tokList=[];toks.forEach((t,k)=>{for(let j=0;j<t.q;j++)tokList.push({c:t.c,i:heroes.length+uniq.length+k})});
    const objs=[];if(tokList.length)objs.push(deckObj(d.name+" — Tokens",tokList,4));if(heroList.length)objs.push(deckObj(d.name+" — Heroes",heroList,-4));if(deckList.length)objs.push(deckObj(d.name,deckList,0));
    const save={SaveName:d.name,GameMode:"",Gravity:0.5,PlayArea:0.5,Date:new Date().toLocaleString(),Table:"",Sky:"",Note:"",Rules:"",XmlUI:"",LuaScript:"",LuaScriptState:"",ObjectStates:objs,TabStates:{},VersionNumber:""};
    const base=safeName(d.name);
    const readme=`Crystal Quest - ${d.name}
Tabletop Simulator files

face_sheet.png  : all ${faces.length} card faces in a ${cols} x ${rows} grid (Heroes first, then one of each deck card, then tokens)
card_back.png   : the shared card back
${base}_saved_object.json : a saved object with your Heroes, your ${deckTotal(d)}-card deck${toks.length?" and your tokens":""} as named decks
deck_list.txt   : the plain deck list

QUICK WAY (no hosting needed)
1. In Tabletop Simulator: Objects > Components > Custom > Deck. Click on the table.
2. Face: choose face_sheet.png.  Back: choose card_back.png.
3. Width ${cols}, Height ${rows}, Number ${faces.length}. Check "Back is hidden". Import.
   TTS uploads the images to your Steam Cloud. This gives you one of each card;
   copy cards (Ctrl+C / Ctrl+V) for 2-ofs, or use the saved object below.

FULL DECK WITH CARD NAMES (saved object)
1. Upload face_sheet.png and card_back.png somewhere TTS can load them
   (TTS: Modding > Cloud Manager > Upload works well).
2. Open ${base}_saved_object.json in a text editor. Replace PASTE_FACE_SHEET_URL_HERE
   and PASTE_CARD_BACK_URL_HERE with those two links (every occurrence).
3. Put the .json file in your TTS Saved Objects folder:
   Windows: Documents\\My Games\\Tabletop Simulator\\Saves\\Saved Objects
   Mac: ~/Library/Tabletop Simulator/Saves/Saved Objects
4. In TTS: Objects > Saved Objects > ${base}_saved_object.
   You get a Heroes deck and a ${deckTotal(d)}-card deck with names and rules text on hover.
`;
    const zip=new JSZip();zip.file("face_sheet.png",faceBlob);zip.file("card_back.png",backBlob);
    zip.file(base+"_saved_object.json",JSON.stringify(save,null,2));zip.file("deck_list.txt",deckText(d));zip.file("README.txt",readme);
    const blob=await zip.generateAsync({type:"blob"});busy(false);
    await offer(base+"_tabletop_simulator.zip",blob);
  }catch(e){busy(false);console.error(e);toast("Couldn't build the Tabletop Simulator files. Try again.")}
}
async function copyText(t,msg){try{await navigator.clipboard.writeText(t);toast(msg||"Deck list copied.")}catch(e){
  const l=$("#layer");const m=document.createElement("div");m.className="modal";m.innerHTML=`<div class="box"><h2>Deck list</h2><textarea id="copy-box" style="width:100%;min-height:220px"></textarea><button type="button" class="btn" data-act="close">Close</button></div>`;l.appendChild(m);const ta=m.querySelector("textarea");ta.value=t;ta.select()}}


/* ---------- rules ---------- */
S.rules=null;S.rulesErr=false;
function mdInline(t){return esc(t).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>")}
function mdToHtml(md){
  const lines=md.split(/\r?\n/),toc=[];let html="",i=0,open=false,title="",sub=[];
  const slug=t=>"r-"+t.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  while(i<lines.length){const l=lines[i];let m;
    if(!l.trim()){i++;continue}
    if((m=l.match(/^(#{1,3})\s+(.*)$/))){const lv=m[1].length,t=m[2];i++;
      if(lv===1){title=t;continue}
      if(lv===2){if(open)html+="</section>";const id=slug(t);toc.push({id,t});html+=`<section class="rsec" id="${id}">`;open=true}
      html+=`<h${lv}>${mdInline(t)}</h${lv}>`;continue}
    if(/^\|/.test(l)){const rows=[];while(i<lines.length&&/^\|/.test(lines[i]))rows.push(lines[i++]);
      const cells=r=>r.replace(/^\||\|$/g,"").split("|").map(c=>c.trim());
      const head=cells(rows[0]),body=rows.slice(2).map(cells);
      html+=`<div class="tblwrap"><table><thead><tr>${head.map(c=>`<th>${mdInline(c)}</th>`).join("")}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${mdInline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;continue}
    if(/^- /.test(l)){let li="";while(i<lines.length&&/^- /.test(lines[i]))li+=`<li>${mdInline(lines[i++].slice(2))}</li>`;html+=`<ul>${li}</ul>`;continue}
    if(/^\d+\. /.test(l)){let li="";while(i<lines.length&&/^\d+\. /.test(lines[i]))li+=`<li>${mdInline(lines[i++].replace(/^\d+\.\s/,""))}</li>`;html+=`<ol>${li}</ol>`;continue}
    if(!open&&title){sub.push(mdInline(l));i++;continue}
    html+=`<p>${mdInline(l)}</p>`;i++}
  if(open)html+="</section>";
  return{html,toc,title,sub};
}
async function loadRules(){
  try{const r=await fetch("assets/rules.md",{cache:"no-cache"});if(!r.ok)throw new Error(r.status);S.rules=mdToHtml(await r.text());S.rulesErr=false}
  catch(e){S.rulesErr=true}
  if(S.view==="rules")render();
}
function viewRules(){
  if(!S.rules)return`<h1>Rules</h1><p class="lede">${S.rulesErr?"The rules didn't load. Check your connection and reload the page.":"Loading the rules…"}</p>`;
  const R=S.rules;
  return`<h1>${R.title||"Rules"}</h1>${R.sub.map(x=>`<p class="lede">${x}</p>`).join("")}
  <div class="rules-wrap">
    <nav class="rtoc" aria-label="Rules sections">
      <label class="field col" for="rules-q">Search the rules<input type="search" id="rules-q" data-act="rules-q" placeholder="e.g. Hidden, Guard, Town"></label>
      <span class="count" id="rules-count"></span>
      <select class="rtoc-sel" data-act="rules-sel" aria-label="Jump to section"><option value="">Jump to section…</option>${R.toc.map(t=>`<option value="${t.id}">${esc(t.t)}</option>`).join("")}</select>
      <div class="rtoc-list">${R.toc.map(t=>`<button type="button" data-act="rules-jump" data-id="${t.id}">${esc(t.t)}</button>`).join("")}</div>
    </nav>
    <article class="rules">${R.html}</article>
  </div>`;
}
function rulesFilter(q){
  q=q.trim().toLowerCase();let n=0;
  document.querySelectorAll(".rules .rsec").forEach(sec=>{const hit=!q||sec.textContent.toLowerCase().includes(q);sec.hidden=!hit;if(hit)n++;
    const b=document.querySelector(`.rtoc-list [data-id="${sec.id}"]`);if(b)b.hidden=!hit});
  const c=document.getElementById("rules-count");if(c)c.textContent=q?`${n} section${n===1?"":"s"} mention “${q}”`:"";
}
function rulesJump(id){const el=document.getElementById(id);if(el){el.hidden=false;el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"})}}

/* ---------- events ---------- */
function go(v){if(location.hash==="#"+v){S.view=v;render();scrollTo(0,0)}else location.hash=v}
function setDeck(fn){fn(S.deck);S.dirty=true;saveDraft();render()}
document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-act]");if(!b||b.tagName==="SELECT"||b.tagName==="INPUT")return;
  const a=b.dataset.act,id=b.dataset.id,v=b.dataset.v;
  if(a==="close"){b.closest(".modal")?.remove();return}
  if(a==="cat-cls"){S.cat.cls=v;store.set("cq.cat",S.cat);render()}
  else if(a==="hero-cls"){S.b.heroCls=v;render()}
  else if(a==="b-cls"){S.b.cls=v;render()}
  else if(a==="inspect"){inspect(BYID.get(id))}
  else if(a==="pick-hero"){setDeck(d=>{const i=d.heroes.indexOf(id);if(i>=0)d.heroes.splice(i,1);else if(d.heroes.length<3)d.heroes.push(id);else toast("Your party is full. Remove a Hero first.")})}
  else if(a==="unhero"){setDeck(d=>{d.heroes=d.heroes.filter(h=>h!==id)});if(S.deck.heroes.length<3){S.b.step="heroes";render()}}
  else if(a==="to-cards"){if(S.deck.heroes.length===3){S.b.step="cards";S.b.cls="all";render();scrollTo(0,0)}}
  else if(a==="to-heroes"){S.b.step="heroes";render()}
  else if(a==="inc"||a==="inc-close"){const c=BYID.get(id);if(!c)return;if(deckTotal(S.deck)>=DECK_SIZE){toast("Your deck already has 30 cards.");return}
    if((S.deck.cards[id]||0)>=maxCopies(c)){toast(c.sup==="Legendary"?"Legendary cards are limited to 1 copy.":"You can include up to 2 copies.");return}
    setDeck(d=>{d.cards[id]=(d.cards[id]||0)+1});if(a==="inc-close"){b.closest(".modal")?.remove();toast(`Added ${c.name}.`)}}
  else if(a==="dec"){setDeck(d=>{if(d.cards[id]>1)d.cards[id]--;else delete d.cards[id]})}
  else if(a==="prune"){setDeck(d=>{for(const k of Object.keys(d.cards)){const c=BYID.get(k);if(!c||!allowed(c,d))delete d.cards[k]}})}
  else if(a==="new-deck"||a==="new-deck-go"){if(S.dirty&&a==="new-deck"&&!b.dataset.sure){b.dataset.sure="1";b.textContent="Discard unsaved changes?";setTimeout(()=>{if(b.isConnected){delete b.dataset.sure;b.textContent=b.closest(".deckpanel")?"New deck":"Start over"}},3500);return}
    S.deck=blankDeck();S.dirty=false;S.b.step="heroes";saveDraft();go("build");render()}
  else if(a==="save"){const d=S.deck;d.name=(d.name||"").trim()||"Untitled deck";b.disabled=true;
    try{const where=await persistDeck(d);S.dirty=false;saveDraft();toast(where==="account"?"Deck saved to your account.":"Deck saved in this browser.")}catch(err){}
    render()}
  else if(a==="open"){const d=S.decks.find(x=>x.id===id);if(!d)return;S.deck={id:d.id,name:d.name,heroes:d.heroes.slice(),cards:{...d.cards}};S.dirty=false;S.b.step=d.heroes.length===3?"cards":"heroes";saveDraft();go("build")}
  else if(a==="dup"){const d=S.decks.find(x=>x.id===id);if(!d)return;const c={id:newId(),name:d.name+" (copy)",heroes:d.heroes.slice(),cards:{...d.cards}};try{await persistDeck(c);toast("Deck duplicated.")}catch(err){}render()}
  else if(a==="del"){const box=document.querySelector(`[data-confirm="${id}"]`);if(box)box.hidden=false}
  else if(a==="del-no"){const box=document.querySelector(`[data-confirm="${id}"]`);if(box)box.hidden=true}
  else if(a==="del-yes"){await removeDeck(id)}
  else if(a==="hand"){openHand(deckBySrc(b.dataset.src))}
  else if(a==="hand-draw"){handDraw()}
  else if(a==="hand-mull"){handMull()}
  else if(a==="hand-new"){if(S.hand){dealHand(S.hand.d);renderHand()}}
  else if(a==="inspect-hand"){const c=BYID.get(id);if(c){const l=$("#layer");const m=document.createElement("div");m.className="modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label",c.name);m.innerHTML=`<div class="box">${cardHTML(c)}<div class="actions"><button type="button" class="btn" data-act="close">Close</button></div></div>`;m.addEventListener("click",e=>{if(e.target===m)m.remove()});l.appendChild(m);m.querySelector("[data-act=close]").focus()}}
  else if(a==="pnp"){const d=deckBySrc(b.dataset.src);if(d)choosePrint(d)}
  else if(a==="pnp-go"){const d=deckBySrc(b.dataset.src);b.closest(".modal")?.remove();if(d)exportPnP(d,v)}
  else if(a==="tts"){const d=deckBySrc(b.dataset.src);if(d)exportTTS(d)}
  else if(a==="copylist"){const d=deckBySrc(b.dataset.src);if(d)copyText(deckText(d))}
  else if(a==="import"){const t=$("#import-text").value;if(!t.trim()){toast("Paste a deck list first.");return}
    const{d,miss}=parseDeck(t);S.deck=d;S.dirty=true;S.b.step=d.heroes.length===3?"cards":"heroes";saveDraft();go("build");
    toast(miss.length?`Imported. Not found: ${miss.slice(0,4).join(", ")}${miss.length>4?"…":""}`:"Deck imported. Press Save deck to keep it.")}
  else if(a==="migrate"){b.disabled=true;await migrateLocal()}
  else if(a==="auth-mode"){S.authMode=v;render()}
  else if(a==="signout"){await signOut()}
  else if(a==="rules-jump"){rulesJump(id)}
  else if(a==="best-refresh"){S.best=null;loadBest();render()}
  else if(a==="best-view"){const r=(S.best&&S.best.rows||[]).find(x=>x.deck_key===id);if(r)bestListModal(r)}
  else if(a==="best-open"){const r=(S.best&&S.best.rows||[]).find(x=>x.deck_key===id);if(!r)return;b.closest(".modal")?.remove();const d=bestDeck(r);
    if(S.dirty&&!confirmReplace())return;S.deck={id:newId(),name:d.name+" (copy)",heroes:d.heroes.slice(),cards:{...d.cards}};S.dirty=true;S.b.step="cards";saveDraft();go("build");toast("Deck copied into the Deck Builder. Press Save deck to keep it.")}
  else if(a==="share"){const d=deckBySrc(b.dataset.src);if(d)copyText(shareURL(d),"Share link copied. Anyone with it can open this deck.")}
});
let qT;
document.addEventListener("input",e=>{const t=e.target,a=t.dataset&&t.dataset.act;if(!a)return;
  if(a==="deck-name"){S.deck.name=t.value;S.dirty=true;saveDraft();return}
  if(a==="rules-q"){rulesFilter(t.value);return}
  if(a==="cat-q"||a==="b-q"){clearTimeout(qT);qT=setTimeout(()=>{(a==="cat-q"?S.cat:S.b).q=t.value;if(a==="cat-q")store.set("cq.cat",S.cat);const pos=t.selectionStart;render();const n=document.getElementById(a);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}},180)}
});
document.addEventListener("change",e=>{const t=e.target,a=t.dataset&&t.dataset.act;if(!a)return;
  if(a==="cat-type"){S.cat.type=t.value;store.set("cq.cat",S.cat);render()}
  else if(a==="cat-sort"){S.cat.sort=t.value;store.set("cq.cat",S.cat);render()}
  else if(a==="b-type"){S.b.type=t.value;render()}
  else if(a==="b-sort"){S.b.sort=t.value;render()}
  else if(a==="rules-sel"&&t.value){rulesJump(t.value);t.value=""}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){const ms=document.querySelectorAll(".modal");if(ms.length)ms[ms.length-1].remove();return}
  const hm=document.getElementById("handm");if(!hm||document.querySelectorAll(".modal").length>1||e.metaKey||e.ctrlKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(e.key==="d"||e.key==="D"){e.preventDefault();handDraw()}else if(e.key==="n"||e.key==="N"){e.preventDefault();if(S.hand){dealHand(S.hand.d);renderHand()}}});
function route(){const h=location.hash.replace("#","");S.view=["catalog","build","decks","account","rules","play","best"].includes(h)?h:"catalog";if(S.view==="build"&&S.deck.heroes.length===3&&S.b.step!=="heroes")S.b.step="cards";render();}
window.addEventListener("hashchange",()=>{route();scrollTo(0,0)});
(function(){const p=new URLSearchParams(location.search).get("deck");if(!p)return;const d=readShare(p);history.replaceState(null,"",location.pathname+"#build");
  if(d){S.deck=d;S.dirty=true;saveDraft();setTimeout(()=>toast("Shared deck loaded. Press Save deck to keep a copy."),300)}})();
if(S.deck.heroes.length===3&&deckTotal(S.deck)>0)S.b.step="cards";
route();
initAccount();
