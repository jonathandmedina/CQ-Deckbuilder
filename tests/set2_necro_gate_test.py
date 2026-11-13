"""Browser checks for Set 2 Necromancer (and a page sweep). Based on set2_gate_test.py. Run: python3 tests/set2_necro_gate_test.py
Original header: Browser checks for Set 2 (Artificer): nothing shows without Set 2 access; with access the class, Recipe flip, Changelog Set 2 tab
and the Play tab pieces (made items, Constructs, Stall, Warded Cloak) render. Serves the repo locally and stubs Supabase. Run: python3 tests/set2_gate_test.py"""
import json, os, sys, threading, functools, http.server, socketserver
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAMES = ["Iron Guardians","Clockwork Pair","Quicksilver","Copper Ingot","Mithril Ingot","Toolbelt","Tinker's Goggles","Artificer A","Construct","Warded Cloak","Pocket Watch"]
SHOTS = os.environ.get("SHOTS")
FAKE_SB = """window.supabase={createClient(){const res=d=>({data:d,error:null});
 const chain=()=>{const p=new Proxy(function(){},{get(t,k){if(k==='then')return(ok,bad)=>Promise.resolve(res([])).then(ok,bad);return()=>p},apply(){return p}});return p};
 const user={id:'u1',email:'tester@x',user_metadata:{display_name:'Tester'}};
 window.__RPC=[];
 return{auth:{getSession:async()=>res({session:{user}}),getUser:async()=>res({user}),
   onAuthStateChange:cb=>{setTimeout(()=>cb('SIGNED_IN',{user}),0);return{data:{subscription:{unsubscribe(){}}}}},signOut:async()=>res(null)},
  rpc:async(n,a)=>{window.__RPC.push([n,a]);if(n==='my_access')return res(window.__ACCESS__);if(n==='admin_list_users')return res(window.__USERS__||[]);return res(null)},
  from:()=>chain(),channel:()=>({on(){return this},subscribe(){return this},track(){return Promise.resolve()},untrack(){return Promise.resolve()},send(){return Promise.resolve()}}),removeChannel(){}}}};"""
def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Q, directory=ROOT)
    s = socketserver.TCPServer(("127.0.0.1", 0), h); threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, s.server_address[1]



def page_for(b, port, access, width=1280, url="#catalog"):
    ctx = b.new_context(viewport={"width": width, "height": 900})
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
    def route(r):
        u = r.request.url
        if "supabase-js" in u: return r.fulfill(status=200, content_type="application/javascript", body=FAKE_SB)
        if not u.startswith(f"http://127.0.0.1:{port}"): return r.abort()
        return r.continue_()
    pg.route("**/*", route)
    pg.add_init_script(f"window.__ACCESS__={json.dumps(access)};try{{localStorage.setItem('cq.seenDiscord','1');localStorage.setItem('cq.joinAsked','1')}}catch(e){{}}")
    pg.goto(f"http://127.0.0.1:{port}/index.html{url}"); pg.wait_for_timeout(1300); clear(pg)
    return ctx, pg, errs
def clear(pg): pg.evaluate("document.querySelectorAll('#layer .modal').forEach(m=>m.remove())")
def go(pg, port, h): pg.goto(f"http://127.0.0.1:{port}/index.html{h}"); pg.wait_for_timeout(800); clear(pg)

def text(pg): return pg.evaluate("document.body.innerText")


NEC = ["Raise Revenant","Cursed Urn","Grave Tide","Consecrate","Retrace the Past","Gravecaller","Grave Caller's Wand","Dagger of the Dead","Revenant","Abomination","Remains","Skeleton Key"]
def main():
    srv, port = serve(); fails = []; n = 0
    def check(cond, msg):
        nonlocal n; n += 1
        if not cond: fails.append(msg)
    NO = {"admin": False, "set2": False, "trials": False}; YES = {"admin": False, "set2": True, "trials": False}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w in (1280, 390):
            ctx, pg, errs = page_for(b, port, NO, w)
            check("Necromancer" not in text(pg), f"[{w}] no access: Necromancer in Cards")
            for nm in NEC:
                pg.fill("#cat-q", nm); pg.wait_for_timeout(150)
                check(nm not in text(pg).replace("Search", "").replace(f"“{nm}”", ""), f"[{w}] no access: search shows {nm}")
            check(pg.evaluate("trialsHidden('Raise Revenant')&&trialsHidden('h:Filth Scavenger')&&trialsHidden('Consecrate')"), f"[{w}] no access: Necromancer names not masked")
            go(pg, port, "#build"); check("Necromancer" not in text(pg), f"[{w}] no access: Necromancer in the Deck Builder")
            go(pg, port, "#rules"); pg.wait_for_timeout(500); check("Set 2 Supplement" not in text(pg), f"[{w}] no access: Set 2 Supplement tab")
            go(pg, port, "#set2-rules"); pg.wait_for_timeout(600); tt = text(pg); check("Set Two Rules Supplement" not in tt and "Impervious" not in tt, f"[{w}] no access: #set2-rules shows the Set 2 rules")
            go(pg, port, "#changelog")
            for v in ("cards", "site"):
                pg.click(f"[data-cl=tab][data-v={v}]"); pg.wait_for_timeout(250)
                tt = text(pg); check(not any(x in tt for x in ["Raise Revenant","Gravecaller","Set 2: Necromancer"]), f"[{w}] no access: Necromancer entry in changelog {v}")
            check(not errs, f"[{w}] no access errors: {errs[:3]}"); ctx.close()

            ctx, pg, errs = page_for(b, port, YES, w)
            check("Necromancer" in text(pg), f"[{w}] access: Necromancer chip/cards")
            for nm in ["Raise Revenant","Cursed Urn","Grave Caller's Wand","Consecrate"]:
                pg.fill("#cat-q", nm); pg.wait_for_timeout(200); check(nm in text(pg), f"[{w}] access: search finds {nm}")
            pg.fill("#cat-q", "")
            imgs = pg.evaluate("""(()=>{const r={};for(const n of ['Raise Revenant','Cursed Urn','Grave Caller\\'s Wand','Skeleton Key','Consecrate']){const c=BYID.get(n);r[n]=c?artSrc(c).split('/').pop().split('?')[0]:null}r.hero=artSrc(BYID.get('h:Gravecaller')).split('/').pop().split('?')[0];return r})()""")
            check(imgs["Raise Revenant"] == "card-Necromancer-face.webp" and imgs["Cursed Urn"] == "card-Necromancer-Legendary-face.webp" and imgs["Skeleton Key"] == "card-Necromancer-Legendary-face.webp"
                  and imgs["Grave Caller's Wand"] == "equip-Necromancer-face.webp" and imgs["Consecrate"] == "card-Generic-face.webp" and imgs["hero"] == "Gravecaller-face.webp", f"[{w}] blank frames: {imgs}")
            broken = pg.evaluate("""(async()=>{const urls=['card-Necromancer-face','card-Necromancer-Legendary-face','equip-Necromancer-face','equip-Necromancer-up','hero-Necromancer-face'].map(x=>'assets/art/blank/'+x+'.webp');let bad=0;for(const u of urls){const r=await fetch(u);if(!r.ok)bad++}return bad})()""")
            check(broken == 0, f"[{w}] Necromancer frame files missing: {broken}")
            plain = pg.evaluate("""(()=>{let n=0;['Bone Wall','Dagger of the Dead','Consecrate','Ossuary','Gravedigger\\'s Medallion','Filth Scavenger','Mourner\\'s Offering'].forEach(nm=>{const c=BYID.get(nm)||BYID.get('h:'+nm);if(!c)return;const d=document.createElement('div');d.innerHTML=cardHTML(c);
              d.querySelectorAll('.c-rules').forEach(r=>{const txt=r.innerHTML.replace(/<b class="kw kw-[a-z]+">[^<]*<\\/b>/g,'');if(/Strength|Defense|Health Point|\\bAura\\b/.test(txt.replace(/<[^>]+>/g,'')))n++})});return n})()""")
            check(plain == 0, f"[{w}] stat words left plain on Necromancer cards: {plain}")
            go(pg, port, "#build"); check("Gravecaller" in text(pg), f"[{w}] access: Necromancer Heroes in the Deck Builder")
            go(pg, port, "#rules"); pg.wait_for_timeout(500); check("Set 2 Supplement" in text(pg), f"[{w}] access: Set 2 Supplement tab")
            go(pg, port, "#set2-rules"); pg.wait_for_timeout(800); tt = text(pg)
            check(all(x in tt for x in ["Set Two Rules Supplement","Impervious","Exhume","Mourn","Craft","Revenant","Remains"]), f"[{w}] Set 2 Supplement page content")
            if SHOTS and w == 1280: pg.screenshot(path=f"{SHOTS}/set2_rules.png")
            go(pg, port, "#changelog"); pg.click("[data-cl=tab][data-v=set2]"); pg.wait_for_timeout(300); tt = text(pg)
            check("Set 2: Necromancer" in tt and "Raise Revenant" in tt and "Iron Guardians" in tt, f"[{w}] Set 2 tab lists Necromancer and Artificer entries")
            pg.click("[data-cl=tab][data-v=cards]"); pg.wait_for_timeout(250); check("Raise Revenant" not in text(pg), f"[{w}] Necromancer stays out of the main Cards Change Log")
            go(pg, port, "#play")
            pg.evaluate("""(()=>{const E=CQE;const deck=(h,c)=>({name:'T',heroes:h.map(x=>'h:'+x),cards:c});const fill={Potion:3,'Raise Revenant':3,'Reawaken':3,'Restless Dead':3,'Bone Wall':3,'Grave Tide':3,'Corpse Harvest':3,'Dig the Grave':3,'Dead March':3,Consecrate:3,'Grim Divination':3,'Robbed Grave':3,'Bone Spur':3,'Restless Echo':3,'Grave Whispers':3,'Ossuary':3,'Rise from the Grave':3};
              const s=E.newGame({seed:9,players:[{name:'You',deck:deck(['Gravecaller','Jorkev, the Pillager','Filth Scavenger'],fill)},{name:'AI',ai:true,deck:deck(['Divine Knight','Arcane Scholar','Shadow Ranger'],{Potion:3,Precognition:3,Humble:3,Vandalize:3,Disarm:3,Naturalize:3,Shatter:3,Antidote:3,'Smoke Bomb':3,Revitalize:3,Dynamite:3,'Gold Bar':3,'Platinum Bar':3,'Silver Bar':3,'Rose Quartz':3,Topaz:3,Almandine:3})}]});
              E.act(s,0,{type:'keep'});E.act(s,1,{type:'keep'});E.act(s,0,{type:'dawnDone'});E.act(s,1,{type:'dawnDone'});s.prio=0;s.p[0].aura=6;
              E.makeSummon(s,0,'Revenant');E.makeSummon(s,0,'Revenant');s.pend=[];s.p[0].inv.push({uid:'rm1',id:'Remains',kind:'card',fd:false,name:'Remains',owner:0,tok:true,ctr:{}});s.p[0].t.sAura=1;
              const rw={uid:'rw1',id:'Reawaken',owner:0};s.p[0].disc.push(rw);s.p[0].t.milled=['rw1'];
              localStorage.setItem('cq.play.local',JSON.stringify({s,me:0,meta:null}));CQPlay.mode='lobby';CQPlay.mount(document.getElementById('view'))})()""")
            pg.wait_for_timeout(400); pg.click("[data-pa=resume-local]"); pg.wait_for_timeout(900); pt = text(pg)
            for frag in ["Revenant", "Impervious", "Remains", "Summon Aura", "Play Reawaken (Exhume"]:
                check(frag in pt, f"[{w}] Play tab shows {frag}")
            check("Use Remains (no action)" not in pt and "Use Remains" in pt, f"[{w}] Remains uses an action")
            # Grave Tide: pick the 3 Revenants to sacrifice on the board
            pg.evaluate("""(()=>{const st=JSON.parse(localStorage.getItem('cq.play.local'));const s=st.s;s.p[0].hand.push({uid:'gt1',id:'Grave Tide',owner:0});s.p[0].aura=6;
              const r=JSON.parse(JSON.stringify(s.p[0].bf.find(o=>o.name==='Revenant')));r.uid='rv3';s.p[0].bf.push(r);
              localStorage.setItem('cq.play.local',JSON.stringify(st));CQPlay.mode='lobby';CQPlay.mount(document.getElementById('view'))})()""")
            pg.wait_for_timeout(300); pg.click("[data-pa=resume-local]"); pg.wait_for_timeout(700)
            pg.locator("[data-pa=hand][data-u=gt1]").dispatch_event("click"); pg.wait_for_timeout(300); pg.locator("#layer [data-pa=play]").first.dispatch_event("click"); pg.wait_for_timeout(400)
            pt2 = text(pg); check("Revenant to sacrifice (1 of 3)" in pt2, f"[{w}] Grave Tide asks which Revenants to sacrifice")
            if SHOTS and w == 1280: pg.screenshot(path=f"{SHOTS}/grave_tide_pick.png")
            for k in range(3):
                pg.locator("#play-root .ps.cand").nth(k).dispatch_event("click"); pg.wait_for_timeout(300)
            pt3 = text(pg); check(pt3.count("Revenant") >= 5 and "sacrifices 3 Revenants" in pt3, f"[{w}] Grave Tide resolves after picking 3")
            if SHOTS and w == 1280: pg.screenshot(path=f"{SHOTS}/play_necro.png")
            ow = pg.evaluate("document.documentElement.scrollWidth-innerWidth"); check(ow <= 1, f"[{w}] horizontal overflow {ow}")
            check(not errs, f"[{w}] access errors: {errs[:3]}"); ctx.close()
            # page sweep
            for acc in (NO, YES):
                ctx, pg, errs = page_for(b, port, acc, w)
                for h in ["#home","#catalog","#build","#decks","#best","#community","#rules","#quickstart","#set2-rules","#play","#changelog","#leaderboard"]:
                    go(pg, port, h); pg.wait_for_timeout(300)
                    ow = pg.evaluate("document.documentElement.scrollWidth-innerWidth"); check(ow <= 1, f"[{w}] {h} overflow {ow} (set2={acc['set2']})")
                check(not errs, f"[{w}] sweep errors (set2={acc['set2']}): {errs[:3]}"); ctx.close()
        b.close()
    srv.shutdown()
    print(f"{'PASS' if not fails else 'FAIL'} set2 necromancer gate ({n} checks)"); [print(" -", f) for f in fails]; sys.exit(1 if fails else 0)
main()
