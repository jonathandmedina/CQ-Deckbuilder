/* Update 30 (proposal): online counter. Every open Deck Forge tab joins one Supabase Realtime presence channel.
   People online = unique presence keys (account id, or a per-browser guest id), so several tabs count once.
   Games = unique games in progress (an AI game counts once; both players in an online room report the same room code). */
(function(){
  if(typeof SB==="undefined"||!SB)return;
  const pill=document.getElementById("onlinePill");if(!pill)return;
  let gid="";try{gid=localStorage.getItem("cq.gid")||"";if(!gid){gid="g-"+Math.random().toString(36).slice(2,10);localStorage.setItem("cq.gid",gid)}}catch(e){gid="g-"+Math.random().toString(36).slice(2,10)}
  const key=()=>(typeof S!=="undefined"&&S.uid)||gid;
  const ch=SB.channel("online-now",{config:{presence:{key:key()}}});
  const gameId=()=>{const U=window.CQPlay;if(!U||!U.s||U.s.over)return"";if(U.net&&U.net.code)return"room:"+U.net.code;return U.vsAI?"ai:"+key():""};
  /* Update 40: each tab also reports its player name, so the Play tab can list who's online and send challenges */
  const myName=()=>{try{return(window.CQMyName&&window.CQMyName())||"Player"}catch(e){return"Player"}};
  let last=null;const track=()=>{const g=gameId(),n=myName(),sig=g+"|"+n;if(sig===last)return;last=sig;ch.track({g,n,at:Date.now()})};
  const subs=[];
  function list(){const st=ch.presenceState(),me=key(),out=[];for(const k in st){if(k===me)continue;const ms=st[k]||[];if(!ms.length)continue;
      const g=ms.map(m=>m.g||"").find(x=>x.startsWith("room:"))||ms.map(m=>m.g||"").find(x=>x)||"";const n=(ms.find(m=>m.n)||{}).n||"Player";
      out.push({key:k,name:String(n).slice(0,24),status:g.startsWith("room:")?"online":g?"ai":"idle"})}
    return out.sort((a,b)=>a.name.localeCompare(b.name))}
  function count(){const st=ch.presenceState(),people=Object.keys(st).length,games=new Set();
    for(const k in st)for(const m of st[k])if(m.g)games.add(m.g);
    document.getElementById("onN").textContent=people.toLocaleString();document.getElementById("onG").textContent=games.size.toLocaleString();pill.hidden=false;
    subs.forEach(f=>{try{f()}catch(e){}})}
  /* challenges ride on the same channel as broadcasts addressed to one presence key */
  const handlers={};
  ch.on("broadcast",{event:"challenge"},({payload})=>{if(payload&&payload.to===key()&&handlers.challenge)handlers.challenge(payload)});
  ch.on("broadcast",{event:"challenge-reply"},({payload})=>{if(payload&&payload.to===key()&&handlers.reply)handlers.reply(payload)});
  window.CQOnline={list,me:key,onChange:f=>subs.push(f),on:(ev,f)=>{handlers[ev]=f},
    send:(ev,payload)=>ch.send({type:"broadcast",event:ev,payload:Object.assign({from:key(),fromName:myName()},payload)}),refresh:()=>{last=null;track()}};
  ch.on("presence",{event:"sync"},count).subscribe(s=>{if(s==="SUBSCRIBED"){last=null;track()}});
  setInterval(track,5000);
})();
