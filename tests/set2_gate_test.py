"""Browser checks for Set 2 (Artificer): nothing shows without Set 2 access; with access the class, Recipe flip, Changelog Set 2 tab
and the Play tab pieces (made items, Constructs, Stall, Warded Cloak) render. Serves the repo locally and stubs Supabase. Run: python3 tests/set2_gate_test.py"""
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
            t = text(pg)
            check("Artificer" not in t, f"[{w}] no access: Artificer shows in Cards")
            check(not pg.evaluate("[...document.querySelectorAll('#cat-type option')].some(o=>o.value==='Recipe')"), f"[{w}] no access: Recipe type offered")
            for nm in NAMES:
                pg.fill("#cat-q", nm); pg.wait_for_timeout(200)
                check(nm not in text(pg).replace("Search", "").replace(f"“{nm}”", ""), f"[{w}] no access: search shows {nm}")
            pg.fill("#cat-q", "")
            go(pg, port, "#build")
            check("Artificer" not in text(pg), f"[{w}] no access: Artificer Heroes in the Deck Builder")
            go(pg, port, "#changelog")
            check(not pg.evaluate("!!document.querySelector('[data-v=set2]')"), f"[{w}] no access: Set 2 changelog tab")
            for v in ("cards", "site"):
                pg.click(f"[data-cl=tab][data-v={v}]"); pg.wait_for_timeout(300)
                tt = text(pg); check(not any(nm in tt for nm in ["Iron Guardians","Wren Partsfinder","Quicksilver","Copper Ingot"]), f"[{w}] no access: Set 2 entry in changelog tab {v}")
            # a shared deck link with a Set 2 card: the card isn't added
            check(pg.evaluate("trialsHidden('Iron Guardians')&&trialsHidden('h:Artificer A')&&!trialsHidden('Potion')"), f"[{w}] no access: Set 2 names not masked")
            check(not errs, f"[{w}] no access errors: {errs[:3]}"); ctx.close()

            ctx, pg, errs = page_for(b, port, YES, w)
            t = text(pg)
            check("Artificer" in t, f"[{w}] access: Artificer chip/cards missing")
            check(pg.evaluate("[...document.querySelectorAll('#cat-type option')].some(o=>o.value==='Recipe')"), f"[{w}] access: Recipe type missing")
            pg.fill("#cat-q", "Dragonscale Scale Recipe"); pg.wait_for_timeout(300)
            check("Dragonscale Scale Recipe" in text(pg), f"[{w}] access: search finds Dragonscale Scale Recipe")
            tile = pg.locator(".card[data-cid='Dragonscale Scale Recipe']").first
            check(tile.count() == 1, f"[{w}] access: Recipe tile has a flip id")
            pg.locator(".card[data-cid='Dragonscale Scale Recipe'] [data-flip]").first.click(); pg.wait_for_timeout(250)
            ft = tile.inner_text(); check("Impervious" in ft, f"[{w}] flip shows the made side: {ft[:120]}")
            if SHOTS and w == 1280: pg.screenshot(path=f"{SHOTS}/recipe_flip.png", clip={"x":0,"y":0,"width":1280,"height":900})
            pg.locator(".card[data-cid='Dragonscale Scale Recipe'] [data-flip]").first.click(); pg.wait_for_timeout(200)
            check("Craft: Dragon Scale, Mithril Ingot and any Chest armor" in tile.inner_text(), f"[{w}] flip back to the Recipe")
            # zoom view flips too
            pg.locator(".card[data-cid='Dragonscale Scale Recipe']").first.click(); pg.wait_for_timeout(400)
            mz = pg.locator("#layer .modal .card[data-cid='Dragonscale Scale Recipe'] [data-flip]")
            check(mz.count() >= 1, f"[{w}] zoom view has the flip button")
            if mz.count(): mz.first.click(); pg.wait_for_timeout(250); check("Impervious" in pg.locator("#layer .modal").inner_text(), f"[{w}] zoom flip shows the made side")
            if SHOTS and w == 1280: pg.screenshot(path=f"{SHOTS}/recipe_zoom.png")
            pg.keyboard.press("Escape")
            # Print & Play: both faces draw, and the made side goes on the upgrades page
            r = pg.evaluate("""(()=>{const c=BYID.get('The Archfrost Recipe');const a=cardCanvas(c,750,1050),b=cardCanvas(upFace(c),750,1050);
              const deck=[BYID.get('Dragonscale Scale Recipe'),BYID.get('Potion')];return[a.width,b.width,deck.filter(x=>x.up).map(upFace).map(x=>x.name).join()]})()""")
            check(r[0] == 750 and r[1] == 750 and r[2] == "Dragonscale Scale", f"[{w}] Print & Play faces: {r}")
            # accent colors on the new cards (Strength, Defense, Health Points, Aura)
            plain = pg.evaluate("""(()=>{let n=0;['Pocket Watch Recipe','The Archfrost Recipe','The Archflame Recipe','Dragonscale Scale Recipe','Iron Ingot'].forEach(nm=>{const c=BYID.get(nm);[c,c.up?upFace(c):null].filter(Boolean).forEach(f=>{const d=document.createElement('div');d.innerHTML=cardHTML(f);
              d.querySelectorAll('.c-rules').forEach(r=>{const txt=r.innerHTML.replace(/<b class="kw kw-[a-z]+">[^<]*<\\/b>/g,'');if(/Strength|Defense|Health Points/.test(txt.replace(/<[^>]+>/g,'')))n++})})});return n})()""")
            check(plain == 0, f"[{w}] stat words left plain on Set 2 cards: {plain}")
            # Nov 15 queue build: new cards, Remey's Hero Construct back, the Crafted subtype, accent colors
            for nm in ["Remey Recipe","Back in the Lab","Wellness Rod Recipe","Deflecting Shield Recipe","Crafter's Choice","Time Pearl","Aura Pearl","Undead's Choice","Recycler","Shield of Riverstead"]:
                pg.fill("#cat-q", nm); pg.wait_for_timeout(200); check(nm in text(pg).replace(f"“{nm}”", ""), f"[{w}] access: catalog shows {nm}")
            pg.fill("#cat-q", "")
            r = pg.evaluate("""(()=>{const f=n=>upFace(BYID.get(n));return[f('Remey Recipe').name,f('Remey Recipe').sub,f('Wellness Rod Recipe').sub,f('Pocket Watch Recipe').sub,f('Deflecting Shield Recipe').sub,BYID.get('Iron Guardians')?f('Iron Guardians').sub:'']})()""")
            # Nov 17: made equipment backs use the Generic frame; Kat / Z backs
            fr = pg.evaluate("""(()=>[upFace(BYID.get('The Archfrost Recipe')).cls,upFace(BYID.get('Wellness Rod Recipe')).cls,upFace(BYID.get('Pocket Watch Recipe')).cls,upFace(BYID.get('Frost Kat Recipe')).name,upFace(BYID.get('Z Recipe')).sub,!!BYID.get('Time Kat Recipe')&&!!BYID.get('Flame Kat Recipe')])()""")
            check(fr[0] == "Generic" and fr[1] == "Generic" and fr[2] == "Artificer" and fr[3] == "Frost Kat" and fr[4] == "Dragon Construct" and fr[5], f"[{w}] Generic frame on made equipment; Kat/Z backs: {fr}")
            check(r[0] == "Remey the Incredible" and r[1].startswith("Hero Construct"), f"[{w}] Remey back: {r}")
            check("Crafted" in r[2] and "Crafted" in r[3] and "Crafted" in r[4] and "Crafted" not in r[5], f"[{w}] Crafted subtype on made items only: {r}")
            plain = pg.evaluate("""(()=>{let n=0;['Remey Recipe','Back in the Lab','Wellness Rod Recipe','Deflecting Shield Recipe',"Crafter's Choice",'Time Pearl','Aura Pearl',"Undead's Choice",'Recycler','Shield of Riverstead','Toolbelt','Pocket Watch Recipe','The Archfrost Recipe'].forEach(nm=>{const c=BYID.get(nm);[c,c.up?upFace(c):null].filter(Boolean).forEach(f=>{const d=document.createElement('div');d.innerHTML=cardHTML(f);
              d.querySelectorAll('.c-rules').forEach(r=>{const txt=r.innerHTML.replace(/<b class="kw kw-[a-z]+">[^<]*<\\/b>/g,'');if(/Strength|Defense|Health Points|\\bAura\\b/.test(txt.replace(/<[^>]+>/g,'')))n++})})});return n})()""")
            check(plain == 0, f"[{w}] stat words left plain on the Nov 15 cards: {plain}")
            go(pg, port, "#build")
            check("Wren Partsfinder" in text(pg), f"[{w}] access: Artificer Heroes in the Deck Builder")
            tb = text(pg); check(all(n in tb for n in ["Material Bender","Val Craftsmith","Gadget Commander","Cy the Builder"]), f"[{w}] renamed Artificer Heroes in the Deck Builder")
            go(pg, port, "#changelog")
            check(pg.evaluate("!!document.querySelector('[data-v=set2]')"), f"[{w}] access: Set 2 tab")
            pg.click("[data-cl=tab][data-v=set2]"); pg.wait_for_timeout(300)
            tt = text(pg); check("Iron Guardians" in tt and "Set 2: Artificer" in tt, f"[{w}] Set 2 tab lists the Artificer entries")
            pg.click("[data-cl=tab][data-v=cards]"); pg.wait_for_timeout(300)
            check("Quicksilver" not in text(pg), f"[{w}] Set 2 entries stay out of the main Cards Change Log")
            if SHOTS and w == 1280:
                pg.click("[data-cl=tab][data-v=set2]"); pg.wait_for_timeout(300); pg.screenshot(path=f"{SHOTS}/changelog_set2.png")
            # Play tab: a game with made items, Constructs, a Stalled card and Warded Cloak (Constructs and Warded Cloak come from Recipes deprecated Nov 14; still rendered for old games)
            go(pg, port, "#play")
            pg.evaluate("""(()=>{const E=CQE;const deck=(h,c)=>({name:'T',heroes:h.map(x=>'h:'+x),cards:c});const fill={Potion:3,'Copper Ingot':3,'Iron Ingot':3,'Silver Ingot':3,'Platinum Ingot':3,'Mithril Ingot':3,'Iron Guardians':2,'Clockwork Pair':2,'Gearwork Hammer Recipe':2,'Pocket Watch Recipe':2,'Quicksilver':2,'Toolbelt':2,'Bellows':2,"Tinker's Goggles":2,"Scavenger's Tongs":2,'Gold Bar':2,'Rose Quartz':2,'Reclamation Kit Recipe':2,'Blast Charge Recipe':2,'Silver Edge Recipe':2,'Cloak of Protection':2};
              const s=E.newGame({seed:7,players:[{name:'You',deck:deck(['Wren Partsfinder','Material Bender','Val Craftsmith'],fill)},{name:'AI',ai:true,deck:deck(['Divine Knight','Arcane Scholar','Shadow Ranger'],{Potion:3,Precognition:3,Humble:3,Vandalize:3,Disarm:3,Naturalize:3,Shatter:3,'Gold Bar':3,'Platinum Bar':3,'Silver Bar':3,'Rose Quartz':3,Topaz:3,Almandine:3,Dynamite:3,Antidote:3,'Smoke Bomb':3,Revitalize:2})}]});
              E.act(s,0,{type:'keep'});E.act(s,1,{type:'keep'});E.act(s,0,{type:'dawnDone'});E.act(s,1,{type:'dawnDone'});s.prio=0;s.p[0].aura=8;
              E.flipRecipe(s,0,{uid:'w1',id:'Pocket Watch Recipe',owner:0});E.flipRecipe(s,0,{uid:'w2',id:'The Archfrost Recipe',owner:0});E.flipRecipe(s,0,{uid:'w3',id:'Warded Cloak Recipe',owner:0});
              const cl=s.p[0].inv.find(o=>o.name==='Warded Cloak');s.p[0].inv.splice(s.p[0].inv.indexOf(cl),1);E.equipTo(s,s.p[0].heroes[1],cl);
              E.flipRecipe(s,0,{uid:'w4',id:'Iron Guardians',owner:0});s.p[1].stall=[{uid:'z1',id:'Precognition',owner:1,n:2}];
              localStorage.setItem('cq.play.local',JSON.stringify({s,me:0,meta:null}));CQPlay.mode='lobby';CQPlay.mount(document.getElementById('view'))})()""")
            pg.wait_for_timeout(400); pg.click("[data-pa=resume-local]"); pg.wait_for_timeout(900)
            pt = text(pg)
            for frag in ["Pocket Watch", "The Archfrost", "Construct", "Warded 3", "Stalled"]:
                check(frag in pt, f"[{w}] Play tab shows {frag}")
            if SHOTS and w == 1280: pg.screenshot(path=f"{SHOTS}/play_set2.png")
            pg.locator(".pi.full", has_text="The Archfrost").first.click(); pg.wait_for_timeout(400)
            mt = pg.locator("#layer").inner_text(); check("+6 Strength" in mt or "Equipped Hero gains +6" in mt, f"[{w}] made weapon opens its card in the zoom: {mt[:80]}")
            if SHOTS and w == 1280: pg.screenshot(path=f"{SHOTS}/play_made_weapon.png")
            ow = pg.evaluate("document.documentElement.scrollWidth-innerWidth"); check(ow <= 1, f"[{w}] horizontal overflow {ow}")
            # Nov 15: Remey the Incredible (fourth Hero, acts Last), and the Time Pearl / Deflecting Shield response buttons
            pg.keyboard.press("Escape"); clear(pg)
            pg.evaluate("""(()=>{const E=CQE;const deck=(h,c)=>({name:'T',heroes:h.map(x=>'h:'+x),cards:c});const fill={Potion:3,Antidote:3,Revitalize:3,Dynamite:3,'Platinum Bar':3,'Gold Bar':3,'Time Pearl':2,'Aura Pearl':2,'Remey Recipe':2,'Back in the Lab':2,'Wellness Rod Recipe':2,'Deflecting Shield Recipe':2,"Crafter's Choice":2,'Silver Bar':3,'Copper Ingot':3,'Iron Ingot':3,'Rose Quartz':3};
              const s=E.newGame({seed:9,players:[{name:'You',deck:deck(['Wren Partsfinder','Material Bender','Val Craftsmith'],fill)},{name:'AI',ai:true,deck:deck(['Divine Knight','Arcane Scholar','Shadow Ranger'],{Potion:3,Precognition:3,Humble:3,Vandalize:3,Disarm:3,Naturalize:3,Shatter:3,'Gold Bar':3,'Platinum Bar':3,'Silver Bar':3,'Rose Quartz':3,Antidote:3,Topaz:3,Almandine:3,'Smoke Bomb':3,Dynamite:3,Revitalize:3})}]});
              E.act(s,0,{type:'keep'});E.act(s,1,{type:'keep'});E.act(s,0,{type:'dawnDone'});E.act(s,1,{type:'dawnDone'});s.p[0].aura=8;
              E.flipRecipe(s,0,{uid:'r1',id:'Remey Recipe',owner:0});E.flipRecipe(s,0,{uid:'r2',id:'Deflecting Shield Recipe',owner:0});const sh=s.p[0].inv.find(o=>o.name==='Deflecting Shield');s.p[0].inv.splice(s.p[0].inv.indexOf(sh),1);E.equipTo(s,s.p[0].heroes[1],sh);
              s.p[0].inv.push(E.invObj(s,0,{uid:'tp1',id:'Time Pearl',owner:0}));s.p[1].heroes.forEach(h=>h.ex=false);s.prio=1;const c={uid:'pc1',id:'Precognition',owner:1};s.p[1].hand.push(c);s.p[1].aura=5;E.act(s,1,{type:'play',uid:'pc1'});
              localStorage.setItem('cq.play.local',JSON.stringify({s,me:0,meta:null}));CQPlay.mode='lobby';CQPlay.mount(document.getElementById('view'))})()""")
            pg.wait_for_timeout(400); pg.click("[data-pa=resume-local]"); pg.wait_for_timeout(900)
            pt = text(pg)
            check("Remey the Incredible" in pt and "Hero Construct" in pt, f"[{w}] Play tab shows Remey as a Hero Construct")
            check("Delay it with a Time Pearl" in pt, f"[{w}] Time Pearl response button")
            # Nov 16: the Time Pearl window also opens when the opponent plays equipment
            r2 = pg.evaluate("""(()=>{const E=CQE;const s=JSON.parse(localStorage.getItem('cq.play.local')).s;s.pend=[];s.p[0].inv.push(E.invObj(s,0,{uid:'tp9',id:'Time Pearl',owner:0}));s.prio=1;s.passed=[false,false];s.p[1].heroes.forEach(h=>h.ex=false);s.p[1].t.lastActor=null;
              s.p[1].hand.push({uid:'sw9',id:'Sword of Riverstead',owner:1});s.p[1].aura=5;const r=E.act(s,1,{type:'play',uid:'sw9'});return[r.ok,s.pend[0]&&s.pend[0].type,E.options(s,0).some(o=>o.type==='pearl')]})()""")
            check(r2 == [True, "window", True], f"[{w}] Time Pearl window on equipment: {r2}")
            if SHOTS and w == 1280: pg.screenshot(path=f"{SHOTS}/play_remey.png")
            pg.locator("button", has_text="Delay it with a Time Pearl").first.click(); pg.wait_for_timeout(600)
            check("Set aside with stall counters" in pg.content() or "Stalled" in text(pg), f"[{w}] the card is set aside after the Time Pearl")
            ow = pg.evaluate("document.documentElement.scrollWidth-innerWidth"); check(ow <= 1, f"[{w}] horizontal overflow with four Heroes {ow}")
            check(not errs, f"[{w}] access errors: {errs[:3]}"); ctx.close()
        b.close()
    srv.shutdown()
    print(f"{'PASS' if not fails else 'FAIL'} set2 gate ({n} checks)"); [print(" -", f) for f in fails]; sys.exit(1 if fails else 0)
main()
