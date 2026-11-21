/* Update 30 (proposal): online counter. Every open site tab joins one Supabase Realtime presence channel.
   People online = unique presence keys (account id, or a per-browser guest id), so several tabs count once.
   Games = unique games in progress (an AI game counts once; both players in an online room report the same room code). */
(function(){
  if(typeof SB==="undefined"||!SB)return;
  const pill=document.getElementById("onlinePill");if(!pill)return;
  let gid="";try{gid=localStorage.getItem("cq.gid")||"";if(!gid){gid="g-"+Math.random().toString(36).slice(2,10);localStorage.setItem("cq.gid",gid)}}catch(e){gid="g-"+Math.random().toString(36).slice(2,10)}
  const uid=()=>(typeof S!=="undefined"&&S.uid)||"";
  /* Update 41: the presence key is fixed when the channel opens. Signing in later changes S.uid but not that key,
     so "me" is every id this tab has had: the channel key, the account id and the guest id. */
  const chKey=uid()||gid;const key=()=>chKey;
  const isMe=k=>!!k&&(k===chKey||k===gid||k===uid());
  const ch=SB.channel("online-now",{config:{presence:{key:chKey}}});
  const gameId=()=>{const U=window.CQPlay;if(!U||!U.s||U.s.over)return"";if(U.net&&U.net.code)return"room:"+U.net.code;return U.spec?"":U.vsAI?(U.s.trials?"trial:"+key():"ai:"+key()):""};
  /* Update 40: each tab also reports its player name, so the Play tab can list who's online and send challenges */
  const myName=()=>{try{return(window.CQMyName&&window.CQMyName())||"Player"}catch(e){return"Player"}};
  let last=null;const track=()=>{const g=gameId(),n=myName(),sig=g+"|"+n+"|"+uid();if(sig===last)return;last=sig;ch.track({g,n,u:uid(),at:Date.now()})};
  const subs=[];
  function list(){const st=ch.presenceState(),me=uid(),out=[];for(const k in st){if(isMe(k))continue;const ms=st[k]||[];if(!ms.length)continue;
      if(me&&ms.some(m=>m.u===me))continue; /* the same account in another tab or device is still you */
      const g=ms.map(m=>m.g||"").find(x=>x.startsWith("room:"))||ms.map(m=>m.g||"").find(x=>x)||"";const n=(ms.find(m=>m.n)||{}).n||"Player";
      out.push({key:k,name:String(n).slice(0,24),status:g.startsWith("room:")?"online":g?"ai":"idle"})}
    return out.sort((a,b)=>a.name.localeCompare(b.name))}
  function count(){const st=ch.presenceState(),people=Object.keys(st).length,games=new Set();
    for(const k in st)for(const m of st[k])if(m.g)games.add(m.g);
    document.getElementById("onN").textContent=people.toLocaleString();document.getElementById("onG").textContent=games.size.toLocaleString();pill.hidden=false;
    subs.forEach(f=>{try{f()}catch(e){}})}
  /* challenges ride on the same channel as broadcasts addressed to one presence key */
  const handlers={};
  ch.on("broadcast",{event:"challenge"},({payload})=>{if(payload&&isMe(payload.to)&&!isMe(payload.from)&&handlers.challenge)handlers.challenge(payload)});
  ch.on("broadcast",{event:"challenge-reply"},({payload})=>{if(payload&&isMe(payload.to)&&handlers.reply)handlers.reply(payload)});
  /* Nov 19: games anyone can watch (spectate): online rooms and vs-AI games, with the players' names */
  function games(){const st=ch.presenceState(),by={};for(const k in st)for(const m of st[k]){const g=m.g||"";if(!g||g.startsWith("trial:"))continue;
      const e=by[g]||(by[g]={g,names:[],mine:false});if(isMe(k)||(uid()&&m.u===uid()))e.mine=true;const n=String(m.n||"Player").slice(0,24);if(!e.names.includes(n))e.names.push(n)}
    return Object.values(by).filter(e=>!e.mine).map(e=>({g:e.g,ai:e.g.startsWith("ai:"),names:e.names})).sort((x,y)=>x.g.localeCompare(y.g))}
  window.CQOnline={list,games,me:key,isMe,onChange:f=>subs.push(f),on:(ev,f)=>{handlers[ev]=f},
    send:(ev,payload)=>ch.send({type:"broadcast",event:ev,payload:Object.assign({from:key(),fromName:myName()},payload)}),refresh:()=>{last=null;track()}};
  ch.on("presence",{event:"sync"},count).subscribe(s=>{if(s==="SUBSCRIBED"){last=null;track()}});
  setInterval(track,5000);
})();
