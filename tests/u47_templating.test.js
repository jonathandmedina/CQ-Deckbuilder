/* Update 47 (Nov 20, 2026): Farewell is renamed Catastrophe; "Exhaust this hero." always ends its line (only reminder text may follow). Run: node tests/u47_templating.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");const A=path.join(__dirname,"..","assets");
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(A,"cards-data.js"),"utf8")+";this.x={C:RAW_CARDS,E:RAW_EQUIP,H:RAW_HEROES,U:EQUIP_UPGRADES,R:CARD_RENAMES,T:typeof RAW_TOKENS!=='undefined'?RAW_TOKENS:[]}",ctx);
const x=ctx.x;let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log("FAIL:",m)}};
const bad=[];const chk=(n,t)=>String(t||"").split("\n").forEach(l=>{if(/Exhaust this hero\./i.test(l)&&!/Exhaust this hero\.\s*(\([^()]*\))?\s*$/i.test(l))bad.push(n+": "+l)});
x.C.forEach(r=>chk(r[1],r[7]));x.E.forEach(r=>chk(r[0],r[4]));x.H.forEach(r=>chk(r[0],r[6]));Object.entries(x.U).forEach(([k,v])=>chk(k+" (upgraded)",v[1]));x.T.forEach(r=>chk(r[0],r[9]));
ok(!bad.length,"\"Exhaust this hero.\" ends its line everywhere"+(bad.length?"\n  "+bad.join("\n  "):""));
ok(x.C.some(r=>r[1]==="Catastrophe"&&r[8]===2)&&!x.C.some(r=>r[1]==="Farewell")&&x.R.Farewell==="Catastrophe","Farewell renamed Catastrophe (v2) with a rename entry");
ok(fs.existsSync(path.join(A,"art","card","Catastrophe-face.webp")),"Catastrophe art file");
ok(fs.readFileSync(path.join(A,"play-cards.js"),"utf8").includes('def("Catastrophe",'),"Catastrophe card script");
const ui=fs.readFileSync(path.join(A,"play-ui.js"),"utf8");ok(ui.includes("function dragTargets")&&ui.includes("pickTarget(tu)"),"drag-to-target in the Play UI");
ok(fs.readFileSync(path.join(A,"admin.js"),"utf8").includes("Never playtested"),"Admin: Never playtested tab");
console.log(`Update 47: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
