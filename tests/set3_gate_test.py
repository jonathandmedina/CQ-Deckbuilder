"""Browser checks for Set 3 (Death Knight, Nov 27, 2026): nothing Set 3 shows for a non-admin; for an admin the Death Knight Heroes show in Cards and
the Deck Builder with accent colors, the Set 3 Supplement and Changelog tab load, and a Death Knight party plays on the Play tab. Run: python3 tests/set3_gate_test.py"""
import json, os, sys, threading, functools, http.server, socketserver
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAMES = ["Iron Guardians","Clockwork Pair","Quicksilver","Copper Ingot","Mithril Ingot","Toolbelt","Tinker's Goggles","Wren Partsfinder","Construct","Warded Cloak","Pocket Watch",
         "Remey Recipe","Back in the Lab","Wellness Rod Recipe","Deflecting Shield Recipe","Crafter's Choice","Time Pearl","Aura Pearl","Undead's Choice",
         "Recycler","Shield of Riverstead","Wren Partsfinder","Material Bender","Val Craftsmith","Gadget Commander","Cy the Builder",
         "Frost Kat Recipe","Time Kat Recipe","Flame Kat Recipe","Z Recipe","Life Seed"]  # Nov 15-17 builds
SHOTS = os.environ.get("SHOTS")
FAKE_SB = """window.supabase={createClient(){const res=d=>({data:d,error:null});
 const chain=()=>{const p=new Proxy(function(){},{get(t,k){if(k==='then')return(ok,bad)=>Promise.resolve(res([])).then(ok,bad);return()=>p},apply(){return p}});return p};
 const user={id:'u1',email:'tester@x',user_metadata:{display_name:'Tester'}};
 window.__RPC=[];
 return{auth:{getSession:async()=>res({session:{user}}),getUser:async()=>res({user}),
   onAuthStateChange:cb=>{setTimeout(()=>cb('SIGNED_IN',{user}),0);return{data:{subscription:{unsubscribe(){}}}}},signOut:async()=>res(null)},
  rpc:async(n,a)=>{window.__RPC.push([n,a]);if(n==='my_access')return res(window.__ACCESS__);if(n==='admin_list_users')return res(window.__USERS__||[]);return res(null)},
  from:()=>chain(),channel:()=>({on(){return this},subscribe(){return this},send(){},track(){},untrack(){},presenceState(){return{}}}),removeChannel(){}}}};"""
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


DK = ["Eliazar the Fallen","Grave Lancer","Hollow Blade","Soul Harvester","Morwen Duskbane"]
def main():
    srv, port = serve(); fails = []; n = 0
    def check(cond, msg):
        nonlocal n; n += 1
        if not cond: fails.append(msg)
    NO = {"admin": False, "set2": True, "trials": True}; ADM = {"admin": True, "set2": True, "trials": True}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w in (1280, 390):
            ctx, pg, errs = page_for(b, port, NO, w)
            for nm in DK:
                pg.fill("#cat-q", nm); pg.wait_for_timeout(150)
                check(nm not in text(pg).replace(f"\u201c{nm}\u201d", ""), f"[{w}] no access: search shows {nm}")
            pg.fill("#cat-q", "")
            check("Death Knight" not in text(pg), f"[{w}] no access: Death Knight class shows")
            check(pg.evaluate("trialsHidden('h:Grave Lancer')&&!trialsHidden('Potion')"), f"[{w}] no access: Set 3 names not masked")
            go(pg, port, "#build"); check("Grave Lancer" not in text(pg), f"[{w}] no access: Death Knights in the Deck Builder")
            go(pg, port, "#rules"); check(not pg.evaluate("!!document.querySelector('a[href=\"#set3-rules\"]')"), f"[{w}] no access: Set 3 Supplement tab")
            go(pg, port, "#changelog"); check(not pg.evaluate("!!document.querySelector('[data-v=set3]')"), f"[{w}] no access: Set 3 changelog tab")
            check(not errs, f"[{w}] no access errors: {errs[:3]}"); ctx.close()

            ctx, pg, errs = page_for(b, port, ADM, w)
            for nm in DK:
                pg.fill("#cat-q", nm); pg.wait_for_timeout(150)
                check(nm in text(pg).replace(f"\u201c{nm}\u201d", ""), f"[{w}] admin: catalog shows {nm}")
            pg.fill("#cat-q", "")
            check(pg.evaluate("[...document.querySelectorAll('option')].some(o=>o.value==='3')"), f"[{w}] admin: Set 3 in the Set filter")
            plain = pg.evaluate("""(()=>{let n=0;%s.forEach(nm=>{const c=BYID.get('h:'+nm);const d=document.createElement('div');d.innerHTML=cardHTML(c);
              d.querySelectorAll('.c-rules').forEach(r=>{const txt=r.innerHTML.replace(/<b class="kw kw-[a-z]+">[^<]*<\\/b>/g,'');if(/Strength|Defense|Health Points|\\bAura\\b/.test(txt.replace(/<[^>]+>/g,'')))n++})});return n})()""" % json.dumps(DK))
            check(plain == 0, f"[{w}] stat words left plain on Death Knight Heroes: {plain}")
            ico = pg.evaluate("ci('Death Knight')"); check("ico-death-knight.png" in ico, f"[{w}] class icon url: {ico}")
            go(pg, port, "#build"); check("Grave Lancer" in text(pg), f"[{w}] admin: Death Knights in the Deck Builder")
            ok_el = pg.evaluate("allowed(BYID.get(\"Knight's Sword\"),{heroes:['h:Eliazar the Fallen','h:Grave Lancer','h:Hollow Blade'],cards:{}})&&!allowed(BYID.get(\"Knight's Sword\"),{heroes:['h:Grave Lancer','h:Hollow Blade','h:Soul Harvester'],cards:{}})")
            check(ok_el, f"[{w}] Eliazar lets the party use Paladin equipment")
            go(pg, port, "#set3-rules"); pg.wait_for_timeout(600); t = text(pg)
            check("Set Three Rules Supplement" in t and "killing blow" in t, f"[{w}] Set 3 Supplement loads")
            check(pg.evaluate("!!document.querySelector('a[href=\"#set3-rules\"]')"), f"[{w}] Set 3 Supplement tab")
            go(pg, port, "#changelog"); check(pg.evaluate("!!document.querySelector('[data-v=set3]')"), f"[{w}] admin: Set 3 changelog tab")
            pg.click("[data-cl=tab][data-v=set3]"); pg.wait_for_timeout(300); t = text(pg)
            check("Soul Harvester" in t and "Set 3 is in closed playtesting" in t, f"[{w}] Set 3 changelog content")
            pg.click("[data-cl=tab][data-v=set2]"); pg.wait_for_timeout(300); check("Set 2 is in closed playtesting" in text(pg), f"[{w}] Set 2 tab still works")
            # Play tab: a Death Knight party, Grave Lancer at Level 3 kills Dark Fang with Blight
            go(pg, port, "#play")
            pg.evaluate("""(()=>{const E=CQE;const deck=(h)=>({name:'T',heroes:h.map(x=>'h:'+x),cards:{Potion:3,Antidote:3,Humble:3,Inspiration:3,'Long Sword':3}});
              const s=E.newGame({seed:9,players:[{name:'You',deck:deck(['Grave Lancer','Morwen Duskbane','Eliazar the Fallen'])},{name:'AI',ai:true,deck:deck(['Arcane Scholar','Divine Knight','Dark Fang'])}]});
              E.act(s,0,{type:'keep'});E.act(s,1,{type:'keep'});E.act(s,0,{type:'dawnDone'});E.act(s,1,{type:'dawnDone'});s.prio=0;s.init=0;s.p[0].aura=6;
              const gl=s.p[0].heroes[0],v=s.p[1].heroes[2];gl.lvl=3;v.dmg=E.maxHp(s,v)-1;E.act(s,0,{type:'attack',att:gl.uid,targets:[v.uid]});
              let g=0;while(s.pend.length&&g++<20){const q=s.pend[0];const x=CQAI.choose(s,q.pid);if(!x)break;E.act(s,q.pid,x)}
              localStorage.setItem('cq.play.local',JSON.stringify({s,me:0,meta:null}));CQPlay.mode='lobby';CQPlay.mount(document.getElementById('view'))})()""")
            pg.wait_for_timeout(400); pg.click("[data-pa=resume-local]"); pg.wait_for_timeout(900); pt = text(pg)
            for frag in ["Grave Lancer", "Morwen Duskbane", "Eliazar the Fallen", "No Soul (Blight)"]:
                check(frag in pt, f"[{w}] Play tab shows {frag}")
            check(pg.evaluate("(()=>{const s=CQPlay.s;return s.p[1].heroes[2].noSoul&&!CQE.options(s,1).some(a=>a.type==='soul')})()"), f"[{w}] Play tab: Blight victim has no soul")
            if SHOTS and w == 1280: pg.screenshot(path=f"{SHOTS}/dk_play.png")
            ow = pg.evaluate("document.documentElement.scrollWidth-innerWidth"); check(ow <= 1, f"[{w}] Play tab horizontal overflow {ow}")
            if SHOTS and w == 1280:
                go(pg, port, "#catalog"); pg.fill("#cat-q", "Grave Lancer"); pg.wait_for_timeout(300); pg.screenshot(path=f"{SHOTS}/dk_catalog.png")
            check(not errs, f"[{w}] admin errors: {errs[:3]}"); ctx.close()
        b.close()
    srv.shutdown()
    print(f"Set 3 gate: {n-len(fails)}/{n} pass"); [print("FAIL:", f) for f in fails]; sys.exit(1 if fails else 0)
if __name__ == "__main__": main()
