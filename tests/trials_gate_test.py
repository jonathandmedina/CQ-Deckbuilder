"""Browser checks for the Trials access gate (Plan A Tasks 3-5). Run: python3 tests/trials_gate_test.py
Serves the repo locally and stubs Supabase (no network). Needs Python Playwright + Chromium."""
import base64, json, threading, functools, http.server, socketserver, os, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAKE_SB = """window.supabase={createClient(){const res=d=>({data:d,error:null});
 const chain=()=>{const p=new Proxy(function(){},{get(t,k){if(k==='then')return(ok,bad)=>Promise.resolve(res([])).then(ok,bad);return()=>p},apply(){return p}});return p};
 const user={id:'u1',email:'tester@x',user_metadata:{display_name:'Tester'}};
 window.__RPC=[];
 return{auth:{getSession:async()=>res({session:{user}}),getUser:async()=>res({user}),
   onAuthStateChange:cb=>{setTimeout(()=>cb('SIGNED_IN',{user}),0);return{data:{subscription:{unsubscribe(){}}}}},signOut:async()=>res(null)},
  rpc:async(n,a)=>{window.__RPC.push([n,a]);if(n==='my_access')return res(window.__ACCESS__);return res(null)},
  from:()=>chain(),channel:()=>({on(){return this},subscribe(){return this}}),removeChannel(){}}}};"""
NAMES = ["Rock Mammoth","Golem","Crag Helm","Tusk Gore","Raging Stampede","Stoneplate Mantle"]

def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Q, directory=ROOT)
    s = socketserver.TCPServer(("127.0.0.1", 0), h); threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, s.server_address[1]

def page_for(b, port, access, width=1280, block_trials=False, url="#catalog"):
    ctx = b.new_context(viewport={"width": width, "height": 900})
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
    def route(r):
        u = r.request.url
        if "supabase-js" in u: return r.fulfill(status=200, content_type="application/javascript", body=FAKE_SB)
        if block_trials and "trials-data.js" in u: return r.fulfill(status=200, content_type="application/javascript", body="")
        if not u.startswith(f"http://127.0.0.1:{port}"): return r.abort()
        return r.continue_()
    pg.route("**/*", route)
    pg.add_init_script(f"window.__ACCESS__={json.dumps(access)};try{{localStorage.setItem('cq.seenDiscord','1')}}catch(e){{}}")
    pg.goto(f"http://127.0.0.1:{port}/index.html{url}"); pg.wait_for_timeout(1200)
    return ctx, pg, errs

def text(pg): return pg.evaluate("document.body.innerText")
def share(cards):
    o = {"n": "Shared", "h": ["Rage Brute", "Dawn Priest", "Ember Mage"], "c": cards}
    return base64.b64encode(json.dumps(o).encode()).decode().replace("+", "-").replace("/", "_").rstrip("=")

def main():
    srv, port = serve(); fails = []; n = 0
    def check(cond, msg):
        nonlocal n; n += 1
        if not cond: fails.append(msg)
    NO = {"admin": False, "set2": False, "trials": False}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w in (1280, 390):
            # baseline counts with no Trials file at all
            ctx, pg, _ = page_for(b, port, NO, w, block_trials=True); base = pg.evaluate("document.querySelector('.lede').innerText"); ctx.close()
            # no access
            ctx, pg, errs = page_for(b, port, NO, w)
            check(pg.evaluate("document.querySelector('.lede').innerText") == base, f"[{w}] lede counts change without access")
            for nm in NAMES:
                pg.fill("#cat-q", nm); pg.wait_for_timeout(250)
                check(nm not in text(pg).replace("Search", ""), f"[{w}] no-access search shows {nm}")
            check(pg.evaluate("[...document.querySelectorAll('#cat-type option')].every(o=>o.value!=='Trials')"), f"[{w}] Trials type option shown without access")
            check(pg.evaluate("!CARDS.some(c=>c.set==='trials')&&!TOKENS.some(c=>c.set==='trials')&&!BYID.has('Crag Helm')"), f"[{w}] Trials objects loaded without access")
            check(pg.evaluate("showRow({cards:{'Crag Helm':1,'Potion':3}})===false&&showRow({cards:{'Potion':3}})===true"), f"[{w}] showRow wrong without access")
            check(pg.evaluate("deckText({name:'x',heroes:[],cards:{'Crag Helm':1}},false).indexOf('Crag Helm')<0"), f"[{w}] deckText leaks a hidden card name")
            check(pg.evaluate("issues({name:'x',heroes:[],cards:{'Crag Helm':1}}).join(' ').indexOf('Crag Helm')<0"), f"[{w}] issues() leaks a hidden card name")
            pg.goto(f"http://127.0.0.1:{port}/index.html#rules"); pg.wait_for_timeout(800)
            check("Trials Supplement" not in text(pg), f"[{w}] Trials rules tab shown without access")
            pg.goto(f"http://127.0.0.1:{port}/index.html#trials-rules"); pg.wait_for_timeout(800)
            check("Rock Mammoth" not in text(pg) and "Raging Stampede" not in text(pg), f"[{w}] #trials-rules shows Trials text without access")
            check(not errs, f"[{w}] console errors without access: {errs[:3]}")
            ctx.close()
            ctx, pg, errs = page_for(b, port, NO, w, url=f"?deck={share([['Crag Helm',1],['Potion',3]])}#build")
            check("Crag Helm" not in text(pg), f"[{w}] share link shows a hidden card"); ctx.close()
            # with access, and with old SQL (admin, no trials key)
            for acc in ({"admin": False, "set2": False, "trials": True}, {"admin": True, "set2": True}):
                ctx, pg, errs = page_for(b, port, acc, w)
                check(pg.evaluate("[...document.querySelectorAll('#cat-type option')].some(o=>o.value==='Trials')"), f"[{w}] {acc}: no Trials type option")
                pg.select_option("#cat-type", "Trials"); pg.wait_for_timeout(300)
                t = text(pg)
                for nm in ["Rock Mammoth", "Golem", "Crag Helm", "Tusk Gore", "The Mountain Wakes", "Heart of the Mountain"]:
                    check(nm in t, f"[{w}] {acc}: {nm} missing under Trials filter")
                check(pg.evaluate("document.querySelectorAll('#view .card').length") == 17, f"[{w}] {acc}: expected 17 Trials tiles, got {pg.evaluate('document.querySelectorAll(\"#view .card\").length')}")
                check(pg.evaluate("CARDS.some(c=>c.name==='Crag Helm'&&c.sup==='Legendary'&&c.up&&c.up.cost===5)&&!CARDS.some(c=>c.name==='Golem'||c.name==='Tusk Gore')"), f"[{w}] {acc}: loot not deck-buildable or bosses buildable")
                pg.goto(f"http://127.0.0.1:{port}/index.html#rules"); pg.wait_for_timeout(800)
                check("Trials Supplement" in text(pg), f"[{w}] {acc}: no Trials rules tab")
                pg.goto(f"http://127.0.0.1:{port}/index.html#trials-rules"); pg.wait_for_timeout(1000)
                t = text(pg)
                for term in ["Trial", "Boss flip", "Spawn", "Stone Plate", "Rage", "Raging Stampede", "Winded", "Loot", "Intelligence Level"]:
                    check(term in t, f"[{w}] {acc}: supplement glossary missing {term}")
                check(not errs, f"[{w}] {acc}: console errors {errs[:3]}")
                ctx.close()
        # Admin page Trials column (admin access)
        ctx, pg, errs = page_for(b, port, {"admin": True, "set2": True, "trials": True}, 1280, url="#admin")
        pg.evaluate("window.__USERS__=1")
        ctx.close()
        b.close()
    srv.shutdown()
    if fails:
        print(f"FAIL {len(fails)}/{n}"); [print(" -", f) for f in fails]; sys.exit(1)
    print(f"PASS trials gate ({n} checks)")

if __name__ == "__main__": main()
