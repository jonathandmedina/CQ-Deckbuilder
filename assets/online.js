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
  let last=null;const track=()=>{const g=gameId();if(g===last)return;last=g;ch.track({g,at:Date.now()})};
  function count(){const st=ch.presenceState(),people=Object.keys(st).length,games=new Set();
    for(const k in st)for(const m of st[k])if(m.g)games.add(m.g);
    document.getElementById("onN").textContent=people.toLocaleString();document.getElementById("onG").textContent=games.size.toLocaleString();pill.hidden=false}
  ch.on("presence",{event:"sync"},count).subscribe(s=>{if(s==="SUBSCRIBED"){last=null;track()}});
  setInterval(track,5000);
})();
