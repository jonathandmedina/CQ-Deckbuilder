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
  rpc:async(n,a)=>{window.__RPC.push([n,a]);if(n==='my_access')return res(window.__ACCESS__);if(n==='admin_list_users')return res(window.__USERS__||[]);return res(null)},
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
                check(nm not in text(pg).replace("Search", "").replace(f"“{nm}”", ""), f"[{w}] no-access search shows {nm}")
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
        pg.evaluate("""window.__USERS__=[{id:'u1',email:'tester@x',name:'Tester',created_at:null,last_sign_in_at:null,is_admin:true,set2:true,trials:true,games:0,last_game:null},
          {id:'u2',email:'p@x',name:'Pat',created_at:null,last_sign_in_at:null,is_admin:false,set2:false,trials:false,games:3,last_game:null}]""")
        pg.evaluate("document.querySelectorAll('#layer .modal').forEach(m=>m.remove())"); pg.click('[data-ad-tab="users"]'); pg.wait_for_timeout(600)
        check(pg.evaluate("[...document.querySelectorAll('.ad-users th')].map(t=>t.textContent).join('|').includes('Set 2|Trials')"), "admin: no Trials column after Set 2")
        check(pg.evaluate("(()=>{const i=document.querySelector('input[data-ad-role=trials][data-uid=u1]');return !!i&&i.checked&&i.disabled&&i.title==='Admins always see Trials'})()"), "admin: admin row Trials box not checked+disabled")
        check("Can see Trials" in text(pg), "admin: no Can see Trials KPI")
        pg.click('input[data-ad-role=trials][data-uid=u2]'); pg.wait_for_timeout(500)
        check(pg.evaluate("JSON.stringify(window.__RPC.find(x=>x[0]==='admin_set_trials'))") == '["admin_set_trials",{"target":"u2","allow":true}]', "admin: toggle did not call admin_set_trials")
        check("Pat can now see Trials." in text(pg), "admin: no grant toast")
        check(not errs, f"admin: console errors {errs[:3]}")
        ctx.close()
        party_checks(b, port, check)
        b.close()
    srv.shutdown()
    if fails:
        print(f"FAIL {len(fails)}/{n}"); [print(" -", f) for f in fails]; sys.exit(1)
    print(f"PASS trials gate ({n} checks)")

# Plan B+C Task 6: Trials party decks (2 Heroes)
PARTY_JS = """(()=>{const hs=HEROES.filter(h=>canSee(h)).slice(0,2).map(h=>h.id);const d={id:'party1',name:'My Party Deck',heroes:hs,cards:{},trials:true};
  const pool=CARDS.filter(c=>canSee(c)&&c.set!=='trials'&&(c.cls==='Generic'||hs.some(h=>BYID.get(h).cls===c.cls))&&c.sup!=='Legendary');let n=0;
  for(const c of pool){if(n>=50)break;const q=Math.min(3,50-n);d.cards[c.id]=q;n+=q}return d})()"""
def party_checks(b, port, check):
    for w in (1280, 390):
        ACC = {"admin": False, "set2": False, "trials": True}
        ctx, pg, errs = page_for(b, port, ACC, w, url="#build")
        check(pg.evaluate("!!document.querySelector('[data-act=new-party]')"), f"[{w}] party: no New Trials party button with access")
        pg.evaluate("document.querySelectorAll('#layer .modal').forEach(m=>m.remove());document.querySelector('[data-act=new-party]').click()"); pg.wait_for_timeout(300)
        check(pg.evaluate("isTrialsDeck(S.deck)&&S.deck.heroes.length===2"), f"[{w}] party: new party isn't a 2-slot Trials party")
        slots = pg.evaluate("[...document.querySelectorAll('.party .slot')].map(s=>s.innerText).join('|')")
        check(pg.evaluate("document.querySelectorAll('.party .slot').length") == 2 and "lead" in slots.lower() and "closer" in slots.lower() and "center" not in slots.lower(), f"[{w}] party: slots not Lead and Closer: {slots[:80]}")
        for _ in range(3):
            pg.evaluate("(()=>{const b=[...document.querySelectorAll('[data-act=pick-hero]')].find(x=>!x.closest('.picked')&&!x.closest('.card.picked'));if(b)b.click()})()"); pg.wait_for_timeout(250)
        check(pg.evaluate("HN(S.deck)") == 2, f"[{w}] party: Hero picker didn't stop at 2 (HN={pg.evaluate('HN(S.deck)')})")
        pg.evaluate(f"(()=>{{const d={PARTY_JS};S.deck.heroes=d.heroes;S.deck.cards=d.cards;S.deck.name=d.name;S.b.step='cards';saveDraft();render()}})()"); pg.wait_for_timeout(300)
        check(pg.evaluate("issues(S.deck).length===0&&CQE.validateDeck(S.deck,{trials:true}).length===0"), f"[{w}] party: legal party has issues {pg.evaluate('issues(S.deck)')}")
        check(pg.evaluate("CQE.validateDeck(S.deck).length>0&&CQE.validateDeck(S.deck).join(' ').includes('3 Heroes')"), f"[{w}] party: a party passes the 3-Hero check")
        pg.evaluate("document.querySelectorAll('#layer .modal').forEach(m=>m.remove());document.querySelector('[data-act=save]').click()"); pg.wait_for_timeout(500)
        pg.reload(); pg.wait_for_timeout(1200)
        check(pg.evaluate("isTrialsDeck(S.deck)&&issues(S.deck).length===0&&HN(S.deck)===2"), f"[{w}] party: not a legal Trials party after reload")
        check(pg.evaluate("issues({name:'x',heroes:['h:'+HEROES[0].name],cards:{},trials:true}).includes('Trials parties need 2 Heroes.')"), f"[{w}] party: wrong issue for a 1-Hero party")
        check(pg.evaluate("!needsRebuild({heroes:[HEROES[0].id,HEROES[1].id],cards:{'Potion':1}})"), f"[{w}] party: needsRebuild flags a party")
        check(pg.evaluate("showRow({heroes:['h:A','h:B'],cards:{}})===false&&showRow({heroes:['h:A','h:B','h:C'],cards:{}})===true"), f"[{w}] party: Best Decks / Community would list a party")
        pg.evaluate(f"(async()=>{{S.decks=[{PARTY_JS}];await commShare(S.decks[0])}})()"); pg.wait_for_timeout(300)
        check("Trials parties can't be shared yet." in text(pg), f"[{w}] party: sharing not blocked")
        pg.evaluate(f"S.decks=[{PARTY_JS}];go('decks');render()"); pg.wait_for_timeout(400)
        t = text(pg)
        check("Trials party" in t and "My Party Deck" in t, f"[{w}] party: My Decks has no Trials party tag")
        check(not pg.evaluate("!!document.querySelector('.deck [data-act=comm-share]')"), f"[{w}] party: Share to community shown on a party")
        pg.goto(f"http://127.0.0.1:{port}/index.html#play"); pg.wait_for_timeout(900)
        pg.evaluate(f"S.decks=[{PARTY_JS}];CQPlay.mount(document.getElementById('view'))"); pg.wait_for_timeout(400)
        check(pg.evaluate("![...document.querySelectorAll('#play-root select option')].some(o=>/My Party Deck/.test(o.textContent))"), f"[{w}] party: regular Play lobby lists a Trials party")
        check(not errs, f"[{w}] party (access): console errors {errs[:3]}")
        ctx.close()
        NO = {"admin": False, "set2": False, "trials": False}
        ctx, pg, errs = page_for(b, port, NO, w, url="#build")
        check(not pg.evaluate("!!document.querySelector('[data-act=new-party]')"), f"[{w}] party: New Trials party shown without access")
        check(pg.evaluate("showRow({heroes:['h:A','h:B'],cards:{}})===false"), f"[{w}] party: showRow shows a 2-Hero row without access")
        hs = pg.evaluate("HEROES.slice(0,2).map(h=>h.name)")
        pg.evaluate("S.decks=[{id:'party9',name:'Secret Party',heroes:[HEROES[0].id,HEROES[1].id],cards:{'Potion':3}}];go('decks');render()"); pg.wait_for_timeout(400)
        t = text(pg)
        check("A deck you don't have access to" in t, f"[{w}] party: My Decks doesn't mask a party without access")
        check("Secret Party" not in t and not any(h in t for h in hs) and "Potion" not in t, f"[{w}] party: My Decks leaks a party's names without access")
        check(not errs, f"[{w}] party (no access): console errors {errs[:3]}")
        ctx.close()

if __name__ == "__main__": main()
