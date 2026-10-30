/* Crystal Quest Deck Forge: Changelog tab (Cards Change Log + Website Log). Data in changelog-data.js. */
(function(){

const CSS=`.cl-tabs{margin:6px 0 16px}
.cl-bar{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:flex-end;margin:4px 0 6px}
.cl-bar .field{min-width:150px}.cl-bar input[type=search]{width:240px;max-width:100%}
.cl-chk{display:flex;gap:6px;align-items:center;padding-bottom:8px;white-space:nowrap}
.cl-count{margin:4px 0 10px}
.cl-upd{margin:22px 0}
.cl-upd h2{font-size:1.3rem;margin:0 0 8px;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.cl-upd h2 small{font-size:.85rem;color:var(--muted);font-weight:400;font-family:inherit}
.cl-note{color:var(--muted);font-size:.9rem;margin:0 0 8px}
.cl-t{border-collapse:collapse;width:100%;font-size:.9rem;background:var(--surface)}
.cl-t th,.cl-t td{border:1px solid var(--line);padding:7px 9px;text-align:left;vertical-align:top}
.cl-t th{background:var(--sunk);font-weight:700;white-space:nowrap}
.cl-t td.cl-n{width:17%;min-width:150px}.cl-t td.cl-v{width:70px;white-space:nowrap}
.cl-t td.cl-o,.cl-t td.cl-nw{width:29%}.cl-t td.cl-r{width:18%}
.cl-n b{display:inline;margin-right:4px}.cl-meta{display:block;color:var(--muted);font-size:.8rem}
.cl-cls{display:inline-block;vertical-align:-2px;margin-right:5px}
.cl-cls .dot{display:inline-block;width:12px;height:12px;border-radius:50%;background:var(--cc)}
.cl-tag{display:inline-block;margin-top:4px;font-size:.72rem;font-weight:700;letter-spacing:.03em;text-transform:uppercase;padding:1px 7px;border-radius:999px;border:1px solid currentColor}
.t-changed{color:#c46a12}.t-added{color:#1f8a4c}.t-removed{color:#c0392b}.t-renamed{color:#5b6fd6}.t-w{color:var(--muted)}
.cl-f+.cl-f{margin-top:5px}.cl-f b{font-weight:700}
.cl-t del{background:rgba(214,69,65,.18);color:inherit;text-decoration:line-through;text-decoration-color:rgba(214,69,65,.8);border-radius:2px}
.cl-t ins{background:rgba(46,160,90,.22);color:inherit;text-decoration:none;border-radius:2px}
.cl-none{color:var(--muted)}
tr.cl-w td{opacity:.86}
.cl-site ul{list-style:none;padding:0;margin:0;background:var(--surface);border:1px solid var(--line);border-radius:12px}
.cl-site li{padding:9px 12px;line-height:1.5}.cl-site li+li{border-top:1px solid var(--line)}
.cl-area{display:inline-block;min-width:84px;margin-right:6px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:1px 7px;border-radius:999px;text-align:center;border:1px solid currentColor}
.a-site{color:#5b6fd6}.a-rules{color:#c46a12}.a-playclient{color:#1f8a4c}
html[data-skin="retro"] .t-changed,html[data-skin="retro"] .a-rules{color:#ffcf6b}html[data-skin="retro"] .t-added,html[data-skin="retro"] .a-playclient{color:#7fe3a2}
html[data-skin="retro"] .t-removed{color:#ff8a80}html[data-skin="retro"] .t-renamed,html[data-skin="retro"] .a-site{color:#a9b8ff}
html[data-skin="retro"] .cl-upd h2 small{font-family:Arial,sans-serif}
@media (max-width:760px){
 .cl-t thead{display:none}.cl-t,.cl-t tbody,.cl-t tr,.cl-t td{display:block;width:auto!important}
 .cl-t tr{border:1px solid var(--line);border-radius:10px;margin:0 0 10px;overflow:hidden}
 .cl-t td{border:0;border-top:1px solid var(--line)}.cl-t td:first-child{border-top:0}
 .cl-t td[data-h]::before{content:attr(data-h);display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:2px}
 .cl-t td.cl-v{display:inline-block;border:0;padding-top:0}
 .cl-bar input[type=search]{width:100%}.cl-bar .field{flex:1 1 100%}
}`;
(()=>{const el=document.createElement("style");el.textContent=CSS;document.head.appendChild(el)})();
const L=()=>window.CQ_CHANGELOG||{updates:[],cards:[],site:[],cols:[]};
const st={tab:"cards",q:"",u:"all",k:"all",c:"all",wording:true};
try{const s=JSON.parse(localStorage.getItem("cq.log")||"{}");if(s.tab)st.tab=s.tab;if(typeof s.wording==="boolean")st.wording=s.wording}catch(e){}
const save=()=>{try{localStorage.setItem("cq.log",JSON.stringify({tab:st.tab,wording:st.wording}))}catch(e){}};
const E=s=>String(s==null?"":s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const sym=h=>h.replace(/\{A\}/g,'<i class="aura" aria-label="Aura"></i>').replace(/\{L(\d)\}/g,'<span class="lv">LV $1</span>').replace(/\n/g,"<br>");
const rows=()=>{const d=L();return d.cards.map(r=>{const o={};d.cols.forEach((c,i)=>o[c]=r[i]);return o})};
const uById=id=>L().updates.find(u=>u.id===id)||{title:id,date:""};

/* word diff: marks removed words in the old text and added words in the new text */
function wdiff(a,b){const A=a.split(/(\s+)/),B=b.split(/(\s+)/);const n=A.length,m=B.length;
  if(n*m>90000)return[sym(E(a)),sym(E(b))];
  const T=Array.from({length:n+1},()=>new Uint16Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)T[i][j]=A[i]===B[j]?T[i+1][j+1]+1:Math.max(T[i+1][j],T[i][j+1]);
  let i=0,j=0,o="",nw="";
  while(i<n&&j<m){if(A[i]===B[j]){o+=E(A[i]);nw+=E(B[j]);i++;j++}else if(T[i+1][j]>=T[i][j+1]){o+=/^\s+$/.test(A[i])?E(A[i]):`<del>${E(A[i])}</del>`;i++}else{nw+=/^\s+$/.test(B[j])?E(B[j]):`<ins>${E(B[j])}</ins>`;j++}}
  for(;i<n;i++)o+=/^\s+$/.test(A[i])?E(A[i]):`<del>${E(A[i])}</del>`;for(;j<m;j++)nw+=/^\s+$/.test(B[j])?E(B[j]):`<ins>${E(B[j])}</ins>`;
  return[sym(o),sym(nw)]}

function cell(ch,side){return ch.map(([f,a,b])=>{
  if(!f)return`<div class="cl-f">${side==="o"?(a?sym(E(a)):'<span class="cl-none">—</span>'):(b?sym(E(b)):'<span class="cl-none">—</span>')}</div>`;
  const [x,y]=f==="Text"?wdiff(a,b):[E(a)||"—",E(b)||"—"];
  return`<div class="cl-f"><b>${E(f)}:</b> ${side==="o"?x:y}</div>`}).join("")}

function filtered(){const q=st.q.trim().toLowerCase();return rows().filter(r=>
  (st.u==="all"||r.u===st.u)&&(st.k==="all"||r.k===st.k)&&
  (st.c==="all"||(st.c==="rules"?(r.tag==="Changed"&&!r.w):r.tag===st.c))&&(st.wording||!r.w)&&
  (!q||(r.n+" "+r.was+" "+r.cls+" "+r.r+" "+r.ch.map(c=>c.join(" ")).join(" ")).toLowerCase().includes(q)))}

const TAGS={Changed:"Changed",Added:"New",Removed:"Removed",Renamed:"Renamed"};
function cardsTab(){const d=L();const list=filtered();const by={};list.forEach(r=>(by[r.u]=by[r.u]||[]).push(r));
  const opt=(v,l,cur)=>`<option value="${v}"${v===cur?" selected":""}>${E(l)}</option>`;
  const total=rows().length;
  const bar=`<div class="cl-bar">
    <label class="field col">Search<input type="search" data-cl="q" value="${E(st.q)}" placeholder="Card name, word, reason…"></label>
    <label class="field col">Update<select data-cl="u">${opt("all","All updates",st.u)}${d.updates.map(u=>opt(u.id,u.title,st.u)).join("")}</select></label>
    <label class="field col">Kind<select data-cl="k">${["all","Card","Hero","Equipment","Token"].map(k=>opt(k,k==="all"?"Cards, Heroes, equipment, tokens":k==="Equipment"?"Equipment":k+"s",st.k)).join("")}</select></label>
    <label class="field col">Change<select data-cl="c">${[["all","All changes"],["rules","Rules / stat changes"],["Added","New"],["Renamed","Renamed"],["Removed","Removed"]].map(([v,l])=>opt(v,l,st.c)).join("")}</select></label>
    <label class="cl-chk"><input type="checkbox" data-cl="wording"${st.wording?" checked":""}> Show wording-only fixes</label>
  </div><p class="count cl-count">${list.length} of ${total} entries</p>`;
  if(!list.length)return bar+`<p class="lede">No changes match these filters.</p>`;
  return bar+d.updates.filter(u=>by[u.id]).map(u=>`<section class="cl-upd"><h2>${E(u.title)} <small>${E(u.date)}</small></h2>
    ${u.id==="u0"?'<p class="cl-note">Compared against the card lists exported on July 13, 2026 (the oldest copy on record). Cards already marked v2 in that export changed before then; their earlier text isn’t on record.</p>':""}
    <div class="tblwrap"><table class="cl-t"><thead><tr><th>Card</th><th>Version</th><th>Old</th><th>New</th><th>Reason</th></tr></thead><tbody>
    ${by[u.id].map(r=>`<tr${r.w?' class="cl-w"':""}>
      <td class="cl-n"><span class="cl-cls" style="--cc:${typeof cc==="function"?cc(r.cls):"#777"};--ci:${typeof ci==="function"?ci(r.cls):"none"}"><i class="dot"></i></span><b>${E(r.n.replace(/^"(.*)"$/,"“$1”"))}</b><span class="cl-meta">${E(r.k)}${r.cls?" · "+E(r.cls):""}</span><span class="cl-tag t-${r.w?"w":r.tag.toLowerCase()}">${r.w?"Wording":TAGS[r.tag]}</span></td>
      <td class="cl-v">${E(r.v)||"—"}</td>
      <td class="cl-o" data-h="Old">${cell(r.ch,"o")}</td>
      <td class="cl-nw" data-h="New">${cell(r.ch,"n")}</td>
      <td class="cl-r" data-h="Reason">${r.r?E(r.r):'<span class="cl-none">—</span>'}</td></tr>`).join("")}
    </tbody></table></div></section>`).join("")}

function siteTab(){return`<p class="lede cl-lede">Changes to the Deck Forge site, the rules and the Play client. Newest first.</p>`+L().site.map(e=>`<section class="cl-upd cl-site"><h2>${E(e.title)} <small>${E(e.date)}${e.ver?` · v=${E(e.ver)}`:""}</small></h2>
  <ul>${e.items.map(([a,t])=>`<li><span class="cl-area a-${a.replace(/\s+/g,"").toLowerCase()}">${E(a)}</span> ${E(t)}</li>`).join("")}</ul></section>`).join("")}

function view(){return`<h1>Changelog</h1><p class="lede">Every card change since the first version of the cards, and every update to this site.</p>
  <div class="chips cl-tabs" role="tablist">
    <button type="button" class="chip" role="tab" data-cl="tab" data-v="cards" aria-selected="${st.tab==="cards"}" aria-pressed="${st.tab==="cards"}">Cards Change Log</button>
    <button type="button" class="chip" role="tab" data-cl="tab" data-v="site" aria-selected="${st.tab==="site"}" aria-pressed="${st.tab==="site"}">Website Log</button>
  </div><div id="cl-body">${st.tab==="cards"?cardsTab():siteTab()}</div>`}

let root=null;
function mount(el){root=el;el.innerHTML=view()}
function rerenderBody(keepFocus){const b=document.getElementById("cl-body");if(!b)return;
  const a=document.activeElement,k=a&&a.dataset&&a.dataset.cl,pos=a&&a.selectionStart;
  b.innerHTML=st.tab==="cards"?cardsTab():siteTab();
  if(keepFocus&&k){const n=b.querySelector(`[data-cl="${k}"]`);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}}}
document.addEventListener("click",e=>{const t=e.target.closest('[data-cl="tab"]');if(!t)return;st.tab=t.dataset.v;save();if(root)mount(root)});
document.addEventListener("input",e=>{const t=e.target;if(!t.dataset||t.dataset.cl!=="q")return;st.q=t.value;rerenderBody(true)});
document.addEventListener("change",e=>{const t=e.target,k=t.dataset&&t.dataset.cl;if(!k||k==="q"||k==="tab")return;
  if(k==="wording"){st.wording=t.checked;save()}else st[k]=t.value;rerenderBody(true)});
window.CQLog={mount};
})();
