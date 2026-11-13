"""Browser checks for the Trials Play tab (Plan B+C Tasks 8 and 9). Run: python3 tests/trials_play_test.py
Serves the repo locally and stubs Supabase (no network); the stub records every from() table so we can prove no deck_results insert happens."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from trials_gate_test import serve
from playwright.sync_api import sync_playwright
FAKE_SB = """window.supabase={createClient(){const res=d=>({data:d,error:null});window.__FROM=[];
 const chain=()=>{const p=new Proxy(function(){},{get(t,k){if(k==='then')return(ok,bad)=>Promise.resolve(res([])).then(ok,bad);return()=>p},apply(){return p}});return p};
 const user={id:'u1',email:'tester@x',user_metadata:{display_name:'Tester'}};
 return{auth:{getSession:async()=>res({session:{user}}),getUser:async()=>res({user}),
   onAuthStateChange:cb=>{setTimeout(()=>cb('SIGNED_IN',{user}),0);return{data:{subscription:{unsubscribe(){}}}}},signOut:async()=>res(null)},
  rpc:async(n,a)=>{if(n==='my_access')return res(window.__ACCESS__);return res(null)},
  from:(t)=>{window.__FROM.push(t);return chain()},channel:()=>({on(){return this},subscribe(){return this},send(){},track(){},untrack(){},presenceState(){return{}}}),removeChannel(){}}}};"""
PARTY = """(()=>{const hs=['h:Ember Mage','h:Divine Knight'];const d={id:'party1',name:'Test Party',heroes:hs,cards:{},trials:true};
  const pool=CARDS.filter(c=>canSee(c)&&c.set!=='trials'&&c.set!==2&&(c.cls==='Generic'||c.cls==='Mage'||c.cls==='Paladin')&&c.sup!=='Legendary'&&c.sup!=='Hidden');let n=0;
  for(const c of pool){if(n>=50)break;const q=Math.min(3,50-n);d.cards[c.id]=q;n+=q}return d})()"""
DRIVE = """window.__drive=(until,max)=>{const U=CQPlay,s=U.s,E=CQE,AI=CQAI;let n=0;
  while(s&&!s.over&&!until(s)&&n++<(max||60000)){if(U.stepAI())continue;const pr=s.pend[0];
    if(pr&&pr.pid===0){const a=AI.choose(s,0);if(a){E.act(s,0,a);continue}s.pend.shift();continue}
    if(s.phase==='mull'&&!s.p[0].mullDone){E.act(s,0,{type:'keep'});continue}
    if(s.phase==='dawn'&&!s.dawnDone[0]){E.act(s,0,{type:'dawnDone'});continue}
    if(s.phase==='town'&&s.town&&s.town.order[s.town.i]===0){E.act(s,0,{type:'leave'});continue}
    if(s.phase==='battle'&&s.prio===0&&!s.pend.length){const a=AI.choose(s,0)||{type:'pass'};const r=E.act(s,0,a);if(!r.ok)E.act(s,0,{type:'pass'});continue}
    break}
  try{U.save();U.render()}catch(e){console.error(e)}return n}"""

def page_for(b, port, access, w=1280, h=900, tablet=False):
    ctx = b.new_context(viewport={"width": w, "height": h}, has_touch=tablet)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and errs.append(m.text))
    def route(r):
        u = r.request.url
        if "supabase-js" in u: return r.fulfill(status=200, content_type="application/javascript", body=FAKE_SB)
        if not u.startswith(f"http://127.0.0.1:{port}"): return r.abort()
        return r.continue_()
    pg.route("**/*", route)
    pg.add_init_script(f"window.__ACCESS__={json.dumps(access)};try{{localStorage.setItem('cq.seenDiscord','1');localStorage.setItem('cq.play.tablet','{'on' if tablet else 'off'}');localStorage.setItem('cq.play.snd','off')}}catch(e){{}}")
    pg.goto(f"http://127.0.0.1:{port}/index.html#play"); pg.wait_for_timeout(1200)
    pg.evaluate("document.querySelectorAll('#layer .modal').forEach(m=>m.remove())")
    pg.evaluate(DRIVE)
    return ctx, pg, errs

def text(pg): return pg.evaluate("document.body.innerText")
def overflow(pg): return pg.evaluate("document.documentElement.scrollWidth>innerWidth+1")

def main():
    srv, port = serve(); fails = []; n = 0
    def check(cond, msg):
        nonlocal n; n += 1
        if not cond: fails.append(msg)
    ACC = {"admin": False, "set2": False, "trials": True}
    NO = {"admin": False, "set2": False, "trials": False}
    with sync_playwright() as p:
        b = p.chromium.launch()
        # no access: no Trials tab
        ctx, pg, errs = page_for(b, port, NO)
        check(not pg.evaluate("!!document.querySelector('[data-pa=ltab][data-t=trials]')"), "no access: Trials tab shown")
        check("Rock Mammoth" not in text(pg), "no access: Trials text in the lobby")
        check(not errs, f"no access: console errors {errs[:3]}"); ctx.close()
        for (w, h, tab) in ((1280, 900, False), (1024, 768, True), (390, 844, False)):
            tag = f"[{w}{' tablet' if tab else ''}]"
            ctx, pg, errs = page_for(b, port, ACC, w, h, tab)
            check(pg.evaluate("!!document.querySelector('[data-pa=ltab][data-t=trials]')"), f"{tag} no Trials tab with access")
            pg.evaluate(f"S.decks=[{PARTY}];CQPlay.lobby.tab='trials';CQPlay.render()"); pg.wait_for_timeout(300)
            check("Test Party" in text(pg) and pg.evaluate("!!document.querySelector('[data-pa=start-trial]')"), f"{tag} Trials setup doesn't list your party")
            for helpers in (1, 3):
                pg.evaluate(f"CQPlay.lobby.t.helpers={helpers};CQPlay.lobby.t.watch=false;CQPlay.mode='lobby';CQPlay.render()")
                pg.evaluate("document.querySelector('[data-pa=start-trial]').click()"); pg.wait_for_timeout(500)
                P = helpers + 1
                check(pg.evaluate("!!(CQPlay.s&&CQPlay.s.trials)") and pg.evaluate("CQPlay.s.trials.parties") == P, f"{tag} Trial with {helpers} helper(s) didn't start")
                pg.evaluate("__drive(s=>s.phase==='battle')"); pg.wait_for_timeout(300)
                bar = pg.evaluate("(document.querySelector('.tr-bar')||{}).innerText||''")
                check("Rock Mammoth" in bar and f"/{25*P}" in bar and "Defense" in bar and "Rage" in bar and "to Stampede" in bar, f"{tag} P={P}: boss bar incomplete: {bar[:120]!r}")
                check(pg.evaluate("document.querySelectorAll('.tr-pips i.plate').length") == P, f"{tag} P={P}: plate pips != parties")
                check(pg.evaluate("document.querySelectorAll('.tr-pips i.rage').length") == P + 1, f"{tag} P={P}: Rage pips != parties + 1")
                check(pg.evaluate("document.querySelectorAll('.tr-golem').length") == P, f"{tag} P={P}: expected one Golem per party")
                check(pg.evaluate("document.querySelectorAll('.tr-helper').length") == helpers, f"{tag} P={P}: helper panels")
                check(not overflow(pg), f"{tag} P={P}: horizontal overflow")
                if helpers == 1:
                    # attack your own Golem: a plate breaks and Rage ticks up
                    pg.evaluate("__drive(s=>s.phase==='battle'&&s.prio===0&&!s.pend.length&&CQE.actorFor(s,0))")
                    pl0 = pg.evaluate("document.querySelectorAll('.tr-pips i.plate.on').length"); rg0 = pg.evaluate("document.querySelectorAll('.tr-pips i.rage.on').length")
                    r = pg.evaluate("""(()=>{const s=CQPlay.s,E=CQE;const g=s.p[s.trials.boss].bf.find(o=>o.spawn&&o.fl.vs===0);const a=E.actorFor(s,0);if(!g||!a)return'no golem/actor';
                      g.dmg=E.maxHp(s,g)-1;a.base.str=Math.max(a.base.str,2);const r=E.act(s,0,{type:'attack',att:a.uid,targets:[g.uid]});CQPlay.render();return r.ok?'ok':r.err})()""")
                    pg.wait_for_timeout(300)
                    check(r == "ok", f"{tag} attack on your Golem failed: {r}")
                    check(pg.evaluate("document.querySelectorAll('.tr-pips i.plate.on').length") == pl0 - 1, f"{tag} no plate broke")
                    check(pg.evaluate("document.querySelectorAll('.tr-pips i.rage.on').length") == rg0 + 1, f"{tag} Rage didn't tick up")
                    # reload mid-Trial
                    pg.evaluate("__drive(s=>s.round>=2&&s.phase==='battle'&&s.prio===0&&!s.pend.length)")
                    before = pg.evaluate("JSON.stringify([CQT.bossState(CQPlay.s),CQPlay.s.trials.deck,CQPlay.s.prio,CQPlay.s.round,CQPlay.s.pos,CQPlay.s.phase])")
                    pg.reload(); pg.wait_for_timeout(1200); pg.evaluate("document.querySelectorAll('#layer .modal').forEach(m=>m.remove())"); pg.evaluate(DRIVE)
                    pg.evaluate(f"S.decks=[{PARTY}];CQPlay.lobby.tab='trials';CQPlay.render()"); pg.wait_for_timeout(200)
                    check(pg.evaluate("!!document.querySelector('[data-pa=resume-trial]')"), f"{tag} no Resume for the saved Trial")
                    pg.evaluate("document.querySelector('[data-pa=resume-trial]').click()"); pg.wait_for_timeout(500)
                    after = pg.evaluate("JSON.stringify([CQT.bossState(CQPlay.s),CQPlay.s.trials.deck,CQPlay.s.prio,CQPlay.s.round,CQPlay.s.pos,CQPlay.s.phase])")
                    check(before == after, f"{tag} reload didn't restore the Trial: {before[:300]} || {after[:300]}")
                    check(pg.evaluate("!!document.querySelector('.tr-boss')"), f"{tag} board not shown after resume")
                pg.evaluate("CQPlay.leave()"); pg.wait_for_timeout(200)
            # watch mode runs to the end
            pg.evaluate("CQPlay.lobby.t.helpers=2;CQPlay.lobby.t.watch=true;CQPlay.lobby.tab='trials';CQPlay.render()")
            pg.evaluate("CQPlay.fast=true;document.querySelector('[data-pa=start-trial]').click()"); pg.wait_for_timeout(2500)
            check(pg.evaluate("CQPlay.s.log.length>40"), f"{tag} watch mode isn't moving on its own")
            pg.evaluate("CQPlay.fast=false;clearTimeout(CQPlay.aiT)")
            steps = pg.evaluate("(()=>{let n=0;const U=CQPlay;while(U.s&&!U.s.over&&n<200000&&U.stepAI())n++;U.render();return n})()")
            check(pg.evaluate("CQPlay.s.over"), f"{tag} watch mode stalled after {steps} steps (round {pg.evaluate('CQPlay.s.round')})")
            check(pg.evaluate("!!document.querySelector('.pl-over')"), f"{tag} no end screen after the Trial")
            check("deck_results" not in pg.evaluate("window.__FROM||[]"), f"{tag} a deck_results insert was attempted")
            check(not overflow(pg), f"{tag} horizontal overflow at the end screen")
            check(not errs, f"{tag} console errors {errs[:3]}")
            pg.screenshot(path=f"/tmp/trials_{w}.png")
            ctx.close()
        # Task 9: loot step and runs (desktop)
        ctx, pg, errs = page_for(b, port, ACC)
        pg.evaluate(f"localStorage.removeItem('cq.trials.run');S.decks=[{PARTY}];CQPlay.lobby.tab='trials';CQPlay.lobby.t.helpers=1;CQPlay.lobby.t.watch=false;CQPlay.render()")
        pg.evaluate("document.querySelector('[data-pa=start-trial]').click()"); pg.wait_for_timeout(300)
        pg.evaluate("__drive(s=>s.phase==='battle')")
        pg.evaluate("(()=>{const s=CQPlay.s;const h=CQT.bossHero(s);CQE.damage(s,null,h,999,{ignoreDef:true});CQPlay.render()})()"); pg.wait_for_timeout(300)
        check(pg.evaluate("CQPlay.s.over&&CQPlay.s.winner===0"), "loot: the Trial didn't end as a win")
        check("Trial 1 cleared" in text(pg), "loot: no win screen")
        check(pg.evaluate("document.querySelectorAll('.tr-loot .lc').length") == 3, "loot: expected parties + 1 = 3 loot cards")
        check(pg.evaluate("document.querySelectorAll('select[data-pa=t-loot]').length") == 2, "loot: expected one loot choice per party")
        check(pg.evaluate("document.querySelector('[data-pa=keep-loot]').disabled"), "loot: Keep allowed before every party has loot")
        rev = pg.evaluate("CQT.lootReveal(CQPlay.s)")
        pg.select_option("select[data-pa=t-loot][data-p='0']", rev[0]); pg.wait_for_timeout(150)
        pg.select_option("select[data-pa=t-loot][data-p='1']", rev[0]); pg.wait_for_timeout(150)
        check(pg.evaluate("document.querySelector('[data-pa=keep-loot]').disabled"), "loot: the same card for two parties allowed")
        pg.select_option("select[data-pa=t-loot][data-p='1']", rev[1]); pg.wait_for_timeout(150)
        pg.evaluate("document.querySelector('[data-pa=keep-loot]').click()"); pg.wait_for_timeout(200)
        run = pg.evaluate("JSON.parse(localStorage.getItem('cq.trials.run')||'null')")
        check(run == {"trial": 1, "loot": {"0": rev[0], "1": rev[1]}}, f"loot: run not saved: {run}")
        check("Play Trial 1 again with your loot" in text(pg), "loot: no play-again button")
        pg.evaluate("document.querySelector('[data-pa=trial-again]').click()"); pg.wait_for_timeout(400)
        hands = pg.evaluate("CQPlay.s.p.slice(0,2).map(p=>p.hand.map(c=>c.id))")
        check(rev[0] in hands[0] and rev[1] in hands[1] and rev[1] not in hands[0], f"loot: not in the right opening hands: {hands}")
        check(pg.evaluate("CQPlay.s.p[0].hand.length===5&&CQPlay.s.p[0].lib.length===46"), "loot: deck size changed")
        pg.evaluate("(()=>{const s=CQPlay.s;s.p.slice(0,2).forEach(pl=>pl.heroes.forEach(h=>{h.surr=true;CQE.damage(s,null,h,999,{ignoreDef:true})}));CQPlay.render()})()"); pg.wait_for_timeout(300)
        check("Your run ended at Trial 1" in text(pg), "loot: no run-ended screen on a loss")
        check(pg.evaluate("localStorage.getItem('cq.trials.run')") is None, "loot: a loss didn't clear the run")
        check("deck_results" not in pg.evaluate("window.__FROM||[]"), "loot: a deck_results insert was attempted")
        check(not errs, f"loot: console errors {errs[:3]}")
        ctx.close()
        b.close()
    srv.shutdown()
    if fails:
        print(f"FAIL {len(fails)}/{n}"); [print(" -", f) for f in fails]; sys.exit(1)
    print(f"PASS trials play ({n} checks)")

if __name__ == "__main__": main()
