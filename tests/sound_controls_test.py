"""Browser checks for the Sound settings (Nov 13, 2026): account/profile panel, Play tab volume pop-ups, tablet Controls tray.
Run: python3 tests/sound_controls_test.py  (serves the repo locally, stubs Supabase)"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from trials_gate_test import serve, FAKE_SB
from playwright.sync_api import sync_playwright

def page(b, port, url, w=1280, h=900, tablet="off", touch=False):
    ctx = b.new_context(viewport={"width": w, "height": h}, has_touch=touch)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: "ch.track" not in str(e) and errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text and "ch.track" not in m.text and errs.append(m.text))
    def route(r):
        u = r.request.url
        if "supabase-js" in u: return r.fulfill(status=200, content_type="application/javascript", body=FAKE_SB)
        if not u.startswith(f"http://127.0.0.1:{port}"): return r.abort()
        return r.continue_()
    pg.route("**/*", route)
    pg.add_init_script("window.__ACCESS__={admin:false,set2:false,trials:false};try{localStorage.setItem('cq.seenDiscord','1');localStorage.setItem('cq.play.tablet','%s')}catch(e){}" % tablet)
    pg.goto(f"http://127.0.0.1:{port}/index.html{url}"); pg.wait_for_timeout(1300)
    pg.evaluate("document.querySelectorAll('#layer .modal').forEach(m=>m.remove())")
    return ctx, pg, errs

def main():
    srv, port = serve(); fails = []; n = 0
    def check(c, m):
        nonlocal n; n += 1
        if not c: fails.append(m)
    with sync_playwright() as p:
        b = p.chromium.launch()
        # 1) account page: Sound panel, slider saves and updates everywhere
        ctx, pg, errs = page(b, port, "#account")
        check(pg.evaluate("!!document.querySelector('.cqv-panel [data-cqv-vol=music]')") and pg.evaluate("!!document.querySelector('.cqv-panel [data-cqv-vol=sfx]')"), "account: no Sound panel")
        pg.evaluate("const g=document.querySelector('.cqv-panel [data-cqv-vol=music]');g.value=40;g.dispatchEvent(new Event('input',{bubbles:true}))")
        check(pg.evaluate("localStorage.getItem('cq.vol.music')") == "40", "account: music volume not saved")
        check(pg.evaluate("document.querySelector('.cqv-panel [data-cqv=music] .cqv-val').textContent") == "40%", "account: % label not updated")
        pg.evaluate("const c=document.querySelector('.cqv-panel [data-cqv-on=sfx]');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}))")
        check(pg.evaluate("localStorage.getItem('cq.sound')") == "false", "account: effects off not saved")
        check(pg.evaluate("document.querySelector('.cqv-panel [data-cqv=sfx] .cqv-val').textContent") == "Off", "account: Off label")
        pg.evaluate("const g=document.querySelector('.cqv-panel [data-cqv-vol=sfx]');g.value=70;g.dispatchEvent(new Event('input',{bubbles:true}))")
        check(pg.evaluate("localStorage.getItem('cq.sound')") == "true" and pg.evaluate("localStorage.getItem('cq.vol.sfx')") == "70", "account: moving a slider of a muted sound should turn it back on")
        check(not errs, f"account: errors {errs[:3]}"); ctx.close()
        # 2) Play tab (computer): hover pop-ups, button toggle, music element volume
        ctx, pg, errs = page(b, port, "#play")
        pg.evaluate("localStorage.setItem('cq.vol.music','50');localStorage.setItem('cq.vol.sfx','80')")
        pg.evaluate("document.querySelector('[data-pa=start-ai]').click()"); pg.wait_for_timeout(1500)
        pg.evaluate("document.querySelectorAll('#layer .modal').forEach(m=>m.remove())")
        check(pg.evaluate("!!(CQPlay.s)"), "play: game didn't start")
        for k, pa in (("sfx", "snd"), ("music", "mus")):
            pg.hover(f"#play-root [data-pa={pa}]"); pg.wait_for_timeout(200)
            check(pg.evaluate(f"!!document.querySelector('.cqv-pop [data-cqv-vol={k}]')"), f"play: no {k} pop-up on hover")
            box = pg.evaluate("(()=>{const r=document.querySelector('.cqv-pop').getBoundingClientRect();return[r.left,r.top,r.right,r.bottom,innerWidth,innerHeight]})()")
            check(box[0] >= 0 and box[2] <= box[4] and box[1] >= 0 and box[3] <= box[5], f"play: {k} pop-up off screen {box}")
            pg.hover(f".cqv-pop [data-cqv-vol={k}]"); pg.wait_for_timeout(500)
            check(pg.evaluate("!!document.querySelector('.cqv-pop')"), f"play: {k} pop-up closes while pointing at it")
            pg.evaluate(f"const g=document.querySelector('.cqv-pop [data-cqv-vol={k}]');g.value=25;g.dispatchEvent(new Event('input',{{bubbles:true}}))")
            check(pg.evaluate(f"CQVol.vol('{k}')") == 25, f"play: {k} pop-up slider didn't set volume")
            pg.mouse.move(5, 880); pg.wait_for_timeout(600)
            check(not pg.evaluate("!!document.querySelector('.cqv-pop')"), f"play: {k} pop-up stays after moving away")
        pg.click("#play-root [data-pa=mus]"); pg.wait_for_timeout(400)
        check(pg.evaluate("CQVol.on('music')") is False and "Music off" in pg.evaluate("document.querySelector('#play-root [data-pa=mus]').textContent"), "play: Music button didn't toggle")
        pg.click("#play-root [data-pa=mus]"); pg.wait_for_timeout(400)
        check(pg.evaluate("CQVol.on('music')") is True, "play: Music button didn't toggle back")
        check(not pg.evaluate("!!document.getElementById('pl-traytab')"), "play: tray tab shown on a computer")
        check(not errs, f"play: errors {errs[:3]}"); ctx.close()
        # 3) tablet mode: Controls tab bottom right, tray holds the sound controls, middle-bar buttons hidden
        for (w, h) in ((1024, 768), (1366, 1024)):
            tag = f"[tablet {w}]"
            ctx, pg, errs = page(b, port, "#play", w, h, tablet="on", touch=True)
            pg.evaluate("document.querySelector('[data-pa=start-ai]').click()"); pg.wait_for_timeout(1500)
            pg.evaluate("document.querySelectorAll('#layer .modal').forEach(m=>m.remove());CQTablet.sync()"); pg.wait_for_timeout(200)
            check(pg.evaluate("document.documentElement.classList.contains('pl-tablet')"), f"{tag} not in tablet mode")
            r = pg.evaluate("(()=>{const t=document.getElementById('pl-traytab');if(!t)return null;const r=t.getBoundingClientRect();return[r.right,r.bottom,innerWidth,innerHeight]})()")
            check(r and r[2] - r[0] < 30 and r[3] - r[1] < 30, f"{tag} Controls tab not at bottom right {r}")
            check(pg.evaluate("document.getElementById('pl-tbar').hidden"), f"{tag} tray open before tapping the tab")
            check(pg.evaluate("[...document.querySelectorAll('#play-root .pl-mid .pl-snd')].every(b=>getComputedStyle(b).display==='none')"), f"{tag} middle-bar sound buttons still shown")
            pg.tap("#pl-traytab"); pg.wait_for_timeout(250)
            check(not pg.evaluate("document.getElementById('pl-tbar').hidden"), f"{tag} tray didn't open")
            check(pg.evaluate("!!document.querySelector('#pl-tbar [data-cqv-vol=music]')") and pg.evaluate("!!document.querySelector('#pl-tbar [data-cqv-vol=sfx]')"), f"{tag} tray has no volume controls")
            check(pg.evaluate("['help','log','menu'].every(k=>!!document.querySelector('#pl-tbar [data-tb='+k+']'))"), f"{tag} tray lost Help/Log/Menu")
            tb = pg.evaluate("(()=>{const r=document.getElementById('pl-tbar').getBoundingClientRect();return[r.left,r.top,r.right,r.bottom,innerWidth,innerHeight]})()")
            check(tb[0] >= 0 and tb[1] >= 0 and tb[2] <= tb[4] and tb[3] <= tb[5], f"{tag} tray off screen {tb}")
            pg.evaluate("const g=document.querySelector('#pl-tbar [data-cqv-vol=music]');g.value=35;g.dispatchEvent(new Event('input',{bubbles:true}))")
            check(pg.evaluate("CQVol.vol('music')") == 35, f"{tag} tray music slider")
            pg.evaluate("const c=document.querySelector('#pl-tbar [data-cqv-on=sfx]');c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}))"); pg.wait_for_timeout(300)
            check(pg.evaluate("CQSnd.on()") is False, f"{tag} tray effects toggle")
            check(not pg.evaluate("document.getElementById('pl-tbar').hidden"), f"{tag} tray closed after a sound change")
            lh = pg.evaluate("!!CQPlay.logHidden")
            pg.tap("#pl-tbar [data-tb=log]"); pg.wait_for_timeout(300)
            check(pg.evaluate("document.getElementById('pl-tbar').hidden") and pg.evaluate("!!CQPlay.logHidden") != lh, f"{tag} Log didn't toggle the log and close the tray")
            pg.tap("#pl-traytab"); pg.wait_for_timeout(200); pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
            check(pg.evaluate("document.getElementById('pl-tbar').hidden"), f"{tag} Escape didn't close the tray")
            check(not errs, f"{tag} errors {errs[:3]}"); ctx.close()
        # 4) home page music still toggles from the bottom bar
        ctx, pg, errs = page(b, port, "#home")
        check(not errs, f"home: errors {errs[:3]}"); ctx.close()
        b.close()
    srv.shutdown()
    print(f"Sound controls checks: {n - len(fails)} pass, {len(fails)} fail")
    for f in fails: print(" -", f)
    sys.exit(1 if fails else 0)

if __name__ == "__main__": main()
