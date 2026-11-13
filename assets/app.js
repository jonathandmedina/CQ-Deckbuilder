"use strict";
/* ---------- data ---------- */
const CLASSES=["Barbarian","Bard","Cleric","Druid","Mage","Monk","Paladin","Ranger","Rogue","Warlock"];
/* Three themes: "art" (Card Art, default: storybook RPG menus in assets/art.css; cards show the card images), "retro" (SNES-style menus, class icons) and "clean". Printed cards always use the clean palette. */
const SKIN=["clean","retro"].includes(document.documentElement.dataset.skin)?document.documentElement.dataset.skin:"art";
/* Card Art theme: card images in assets/art/<kind>/<Name>-face.webp (upgraded side: -up.webp). Name = card name with each run of non-letters/digits as one "_", trimmed (Component.Studio export naming).
   All images are blank templates from the "CQ - Tactics Frame (Digital Client)" export: the site draws the name, type line, region, upgrade cost, numbers and rules. */
const artKey=n=>String(n).replace(/[^A-Za-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
const CARD_ART={hero:new Set(["Arcane_Scholar", "Arnett_Lifebinder", "Battle_Minstrel", "Beast_Tracker", "Blessed_Champion", "Bloodhowl", "Dark_Channeler", "Dark_Fang", "Dawn_Priest", "Demon_Pactist", "Divine_Knight", "Diviner_Mage", "Dr_Vonugutt", "Dum_Dum", "Echo_Performer", "Ember_Mage", "Essence_Reaper", "Forest_Scout", "Fury_Titan", "Grandmaster_Reece", "Harmony_Sage", "Hawkeye", "Hexcaster", "Holy_Guardian", "Inspiration_Herald", "King_of_Curses", "Lightbringer", "Monastery_Stalwart", "Night_Stalker", "Precision_Fighter", "Radiant_Oracle", "Radiant_Sentinel", "Rage_Brute", "Rootbinder", "Rootfolk_Elder", "Rousing_Bandleader", "Sage_Monk", "Sanctifier", "Savage_Raider", "Shadow_Ranger", "Skullcrusher", "Songweaver", "Storm_Caller", "Sun_Paladin", "Thorncaller", "Trainee_Vincent", "Valdo_Sticky_Fingers", "Venom_Dancer", "Verdant_Sage", "Veteran_Bowman", "Void_Binder", "Warden_of_the_Woods", "Whisper_Knife", "Wild_Archer", "Wild_Shifter", "Gravecaller", "Jorkev_the_Pillager", "Filth_Scavenger", "Necromancer_D", "Necromancer_E"]),card:new Set(["Acceleration_Agent", "All_Play", "Almandine", "Amnesia_Puzzle_Box", "Antidote", "Arcane_Study", "Armed", "Arrested_Development", "Arrow_of_Hope", "Arrow_of_Persuasion", "Ascend", "Attack_Reversal", "Aura_Crystal", "Aura_Leech", "Aurawing", "Awakened_Fist", "Awestruck", "Balanced_Choice", "Ballad_of_Blades", "Battered", "Battle_Horn", "Xakro_s_War_Horn", "Bear_Trap", "Beast", "Beat_Down", "Bewilder", "Bind", "Blademaster_s_Choice", "Block_Progress", "Blockade", "Blood_Aura", "Blood_Frenzy", "Blood_Offering", "Bloodthirst", "Blunt_Force", "Blunt_Point_Force", "Boost_Ritual", "Brain_Rot", "Breath", "Broken_Blade", "Bruised", "Brute_s_Banner", "Bullseye", "Burden", "Call_of_Nature", "Camouflage", "Campfire", "Cancel", "Captain_s_Banner", "Carry_Radiance", "Chain_Lightning", "Chains_of_Darkness", "Charged_Barrage", "Choices", "Come_Together", "Conscript", "Coordinated_Attack", "Crescendo", "Curse_of_Exhaustion", "Cut_Off", "Dark_Arts", "Dark_Insight", "Dark_Jab", "Dark_Lance", "Dazzling_Melody", "Death_by_a_Thousand_Cuts", "Deep_Contemplation", "Defend_Prayer", "Delevel", "Disarm", "Disenchant", "Disorient", "Dissipate", "Distract", "Divine_Judgment", "Divine_Smite", "Doubling_Ritual", "Drawwing", "Dual_Shot", "Dynamite", "Elk", "Elk_of_the_Woods", "Embolden", "Energizing_Ale", "Energy_Stone", "Enfeeble", "Entangling_Roots", "Envenom", "Evolve", "Exile", "Extra_Protection", "Burgle", "Fade_the_Fury", "False_Cure", "Farewell", "Finisher", "Flame_Bolt", "Flame_Jab", "Flame_Lance", "Flame_Wave", "Flick_Dagger", "Flurry_of_Blows", "Focus", "Fog_of_Darkness", "Fortify", "Frailty", "Frog_in_the_Throat", "Frost_Spike", "Frostbite", "Full_Draw", "Full_Heal", "Gathering_Tree", "Glimpse_the_Future", "Gold_Bar", "Grapple", "Hack_and_Slash", "Hail", "Hand_to_Hand_Combat", "Harmonic_Flask", "Healer_s_Choice", "Healing_Beam", "Healing_Blast", "Healing_Relic", "Healing_Touch", "Heat_Wave", "Heavy_Beast", "Hero_s_Choice", "Horn", "Horn_Crystal", "Humble", "Ice_Bath", "Ice_Jab", "Ice_Lance", "Ice_Ray", "Inspiration", "Instrument_Bag", "Inversion_Stone", "Jab", "Larceny", "Level_Shot", "Level_Up", "Levitate", "Life_Boost", "Light_Blast", "Light_Helix", "Lightning_Bolt", "Lightning_Lance", "Lightning_Rod", "Line_It_Up", "Look_Ahead", "Lose_Control", "Lotus_Jab", "Lullaby", "Lunge", "Magic_Sink", "Mark_of_Doom", "Mass_Populate", "Mead_Offering", "Medical_Visit", "Meditate", "Memory_Loss", "Mind_Rend", "Mirrored_Chant", "Miscalculation", "Mocking_Doll", "Narrow_Escape", "Naturalize", "Nature_s_Choice", "Night_Terror", "Noble_Choice", "Noble_Promotion", "Null_Stone", "On_the_Job_Training", "Opening_Act", "Out_of_the_Woods", "Overdose", "Palm_Strike", "Peace", "Petal_Shrine", "Petty_Theft", "Phoenix_Down", "Pillage_the_Dead", "Pitfall", "Platinum_Bar", "Poison_Dart", "Populate", "Potion", "Power_Thrust", "Power_Vacuum", "Precognition", "Primal_Energy", "Protect", "Pull_Together", "Pummel", "Pump", "Purify", "Quick_Change", "Quickdraw", "Radiant_Strike", "Rally_the_Troops", "Rapacious_Encore", "Rapid_Shot", "Redirect", "Refire", "Refrain", "Reload", "Resourceful_Maneuver", "Resurrection", "Retribution", "Return_to_the_Earth", "Revitalize", "Righteous_Rage", "Rising_Dragon", "Ritual_of_Fang", "Ritual_of_Pain", "Ritual_of_Power", "Rose_Quartz", "Roundhouse", "Rousing_Chorus", "Run_It_Back", "Sanctuary", "Scrap_Metal", "Search_for_Knowledge", "Second_Chances", "Second_Wind", "Self_Sacrifice", "Serrated_Arrow", "Shadow_Strike", "Shatter", "Shield_Bash", "Silver_Bar", "Siphon_Life", "Sleep", "Sleeping_Potion", "Slow_Down", "Smash_and_Grab", "Smash_to_Smithereens", "Smoke_Bomb", "Smoke_Trail_Arrow", "Snare", "Snuff_Out", "Solo_Act", "Song_Book", "Song_of_Healing", "Sonic_Recall", "Spark", "Sphere_of_Hindrance", "Spike_Pit", "Split_Kick", "Splitting_Ritual", "Spore_Calling", "Spotters", "Spread_the_Sickness", "Stampede", "Standing_Ovation", "Step_In", "Storm_of_Insight", "Strong_Stance", "Stunner", "Sure_Fire_Choice", "Surprise_Attack", "Synchronous_Strike", "Take_a_Stand", "Tempo_Change", "The_Forbidden_Tuner", "The_Monolith", "Timely_Heals", "To_the_Armory", "Tome_of_Gim", "Tooth", "Tooth_Crystal", "Tooth_or_Horn", "Topaz", "Toxic_Cloud", "Tri_Shot", "Trophy_Rack", "Unburden", "Understanding", "Unity_of_the_Herd", "Unstoppable", "Vandalize", "Vanish", "Vial_of_Venom", "Vigil", "Volt_Jab", "War_Chant", "Wave_of_Life", "Weaken", "Weakening_Dirge", "Well_Trained", "Shield_Wall", "Withdrawal_Ailments", "Wolves", "Die_Swinging", "Blood_Price", "Warrior_s_Pyre", "Marching_Cadence", "Duet", "Call_and_Response", "Rebuke", "Bulwark_Prayer", "Ley_Grove", "Bloom", "Heartwood_Seed", "Reclaim", "Barkskin_Totem", "Shelter_from_the_Storm", "Bark_Blessing", "Rootfolk", "Great_Rootfolk", "Call_to_Companions", "Lesser_Elemental", "Greater_Elemental", "Tangle_Rod", "Caltrops", "Into_the_Trees", "Arrow_of_Devastation", "Arrow_of_Craftsmanship"]),equip:new Set(["Antler_Crown", "Apprentice_s_Wand", "Arm_Guard_of_Riverstead", "Boots_of_Riverstead", "Breastplate_of_Bravery", "Bronze_Chest_Plate", "Celestial_Harp", "Chalice_of_Life", "Chest_Plate_of_Riverstead", "Cloak_of_Protection", "Dagger_of_Riverstead", "Drums_of_War", "Feather_Blade", "Gauntlets_of_Growth", "Great_Axe", "Greaves_of_Light", "Hammer_of_Ruin", "Helm_of_Aura", "Helm_of_Protection", "Iron_Hand_Wraps", "Jun_Lao_s_Headband", "Knight_s_Sword", "Leg_Armor_of_Riverstead", "Long_Dagger", "Long_Sword", "Longbow", "Mace_of_Dawn", "Mystic_Quiver", "Poison_Tipped_Dagger", "Ring_of_Power", "Ring_of_Radiance", "Ring_of_Riverstead", "Ring_of_Vocation", "Ritual_Athame", "Sacred_Vestments", "Shadow_Cloak", "Staff_of_Doom", "Cloak_of_Hate", "Shillelagh", "Silver_Fiddle", "Sword_of_Eliazar", "Sword_of_Riverstead", "Thief_s_Dagger", "Tower_Shield", "Unpiercing_Chestplate", "Vambrace_of_Light", "War_Lute", "Shimmering_Cloak", "Multi_Bow", "Heavy_Bow"])};
const ART_VER="7";
/* Blank frames (Component.Studio "CQ - Blank ... Frame (Digital Client)" exports): one per frame type per class, art window left empty.
   A card with no finished art yet still renders as a card image in the Card Art theme, using its class's blank frame. */
const BLANK_ART={hero:new Set(["Artificer","Barbarian","Bard","Blacksmith","Cleric","Druid","Mage","Monk","Necromancer","Paladin","Ranger","Rogue","Warlock"]),card:new Set(["Artificer","Barbarian","Bard","Cleric","Druid","Generic","Mage","Monk","Necromancer","Paladin","Ranger","Rogue","Warlock"]),equip:new Set(["Artificer","Barbarian","Bard","Cleric","Druid","Generic","Mage","Monk","Necromancer","Paladin","Ranger","Rogue","Warlock"])};
/* classes with a Legendary blank frame (gem above the title bar): <kind>-<Class>-Legendary-<side>.webp */
const BLANK_LEG=new Set(["Artificer","Necromancer"]);
const ownArt=c=>!!CARD_ART[c.kind]&&CARD_ART[c.kind].has(artKey(c.name));
const blankArt=c=>!ownArt(c)&&!!BLANK_ART[c.kind]&&BLANK_ART[c.kind].has(c.cls);
/* Update 30: the party is 3 fixed slots (Lead, Center, Closer). In the builder d.heroes may hold null for an empty slot so the others keep their place. */
const HN=d=>d&&d.heroes?d.heroes.filter(Boolean).length:0;
const hcompact=a=>(a||[]).filter(Boolean);
/* Trials party deck (Plan B+C): a deck with exactly 2 Heroes (Lead and Closer). No new database column: decks.heroes already holds the list.
   d.trials marks a party while it's being built (fewer than 2 Heroes picked yet). */
const isTrialsDeck=d=>!!d&&(d.trials===true||(d.trials!==false&&Array.isArray(d.heroes)&&d.heroes.length===2&&d.heroes.every(Boolean)));
const HSLOTS=d=>isTrialsDeck(d)?2:3;
const SLOT_NAMES=d=>isTrialsDeck(d)?["Lead","Closer"]:["Lead","Center","Closer"];
const hasArt=c=>SKIN==="art"&&(ownArt(c)||blankArt(c));
const CLASS_COLOR_CLEAN={Artificer:"#507B7F",Necromancer:"#466E6B",Barbarian:"#B0412B",Bard:"#B8467C",Cleric:"#D4AE3A",Druid:"#447F34",Mage:"#2C66C4",Monk:"#DE8A2E",Paladin:"#5E7FA6",Ranger:"#6E8130",Rogue:"#3B4658",Warlock:"#6A3C9E",Generic:"#7C766B"};
const CLASS_TEXT_CLEAN={Cleric:"#231A00",Monk:"#2A1500"};
/* retro colors are sampled from the class icons */
const CLASS_COLOR_RETRO={Barbarian:"#BE1029",Bard:"#A9327C",Cleric:"#CAAF65",Druid:"#A8622F",Mage:"#0271B9",Monk:"#51A5C5",Paladin:"#DE8600",Ranger:"#567428",Rogue:"#4B6170",Warlock:"#4D1791",Generic:"#6D6F80",Artificer:"#507B7F",Blacksmith:"#673839",Necromancer:"#466E6B"};
const CLASS_TEXT_RETRO={Cleric:"#1A1206",Monk:"#06222E",Paladin:"#1E1000"};
const CLASS_COLOR=SKIN!=="clean"?CLASS_COLOR_RETRO:CLASS_COLOR_CLEAN, CLASS_TEXT=SKIN!=="clean"?CLASS_TEXT_RETRO:CLASS_TEXT_CLEAN;
const cc=c=>CLASS_COLOR[c]||"#777", ct=c=>CLASS_TEXT[c]||"#FFFFFF";
const ICON_CLS=new Set(["Generic","Barbarian","Bard","Cleric","Druid","Mage","Monk","Paladin","Ranger","Rogue","Warlock","Artificer","Blacksmith","Necromancer"]);
const ICON_BASE=new URL("assets/",document.baseURI).href;
const ci=c=>ICON_CLS.has(c)?`url(${ICON_BASE}ico-${c.toLowerCase()}.png)`:"none";
const TYPES=["Spell","Tactic","Song","Item","Equipment","Enchantment","Summon"];

const HEROES=RAW_HEROES.map(r=>({id:"h:"+r[0],kind:"hero",name:r[0],cls:r[1],str:r[2],def:r[3],aura:r[4],hp:r[5],rules:r[6],ver:r[7]||1,type:"Hero",sup:"",sub:"",cost:""}));
const CARDS=[
  ...RAW_CARDS.map(r=>({id:r[1],kind:"card",name:r[1],cost:r[2],sup:r[3],type:r[4],sub:r[5],cls:r[6],rules:r[7],ver:r[8]||1})),
  ...RAW_EQUIP.map(r=>({id:r[0],kind:"equip",name:r[0],sup:r[1],type:"Equipment",sub:r[2],cls:r[3],rules:r[4],cost:r[5],region:r[6],pstr:+r[7]||0,pdef:+r[8]||0,ver:r[9]||1}))
];
/* Weapon upgrades (update 19): one fixed upgrade per weapon, flipped to its upgraded side at the Blacksmith. c.up = {cost, rules, pstr, pdef} */
{const UPG=(typeof EQUIP_UPGRADES!=="undefined")?EQUIP_UPGRADES:{};CARDS.forEach(c=>{const u=c.kind==="equip"&&UPG[c.name];if(u)c.up={cost:+u[0],rules:u[1],pstr:+u[2]||0,pdef:+u[3]||0}})}
/* the upgraded side of a weapon, shaped like a normal card (used by the flip view and Print & Play) */
/* Set 2 Recipes (RECIPES in cards-data.js): two-sided cards. c.up.recipe holds the back: what Crafting the Recipe makes. The flip view and Print & Play show it like an upgraded side. */
{const RC=(typeof RECIPES!=="undefined")?RECIPES:{};CARDS.forEach(c=>{const r=c.type==="Recipe"&&RC[c.name];if(r)c.up=Object.assign({recipe:true,ing:r.ing},r.back,{cost:r.back.cost,pstr:+r.back.pstr||0,pdef:+r.back.pdef||0})})}
const isRecipe=c=>!!(c&&c.up&&c.up.recipe);
function upFace(c){if(isRecipe(c)){const b=c.up;return Object.assign({},c,{id:c.id+"#up",face:"up",name:b.name,type:b.type,sub:b.type==="Equipment"?[b.sub,b.region].filter(Boolean).join(" · "):b.sub,region:b.region,cost:b.type==="Summon"?"":b.cost,rules:b.rules,pstr:b.pstr,pdef:b.pdef,sup:c.sup,backOf:c.name})}
  return Object.assign({},c,{id:c.id+"#up",face:"up",rules:c.up.rules,pstr:c.up.pstr,pdef:c.up.pdef})}
const TOKENS=(typeof RAW_TOKENS!=="undefined"?RAW_TOKENS:[]).map(r=>({id:"t:"+r[0],kind:"token",name:r[0],tkind:r[1],type:"Token",sub:r[1]+(r[2]&&r[2]!==r[1]?" · "+r[2]:""),cls:r[3],str:r[4],def:r[5],hp:r[6],cost:r[7],region:r[8],rules:r[9],madeBy:r[10],ver:r[11]||1,sup:""}));
const TOKEN_BY_NAME=new Map(TOKENS.map(t=>[t.name,t]));
const TOKEN_SRC=(typeof TOKEN_SOURCES!=="undefined")?TOKEN_SOURCES:{};
/* Set 2 (hidden playtest set): cards named in SET2_CARDS (cards-data.js) only show for admins and players an admin gave Set 2 access (Admin page). */
const SET2=new Set(typeof SET2_CARDS!=="undefined"?SET2_CARDS:[]);
[...HEROES,...CARDS,...TOKENS].forEach(c=>{if(SET2.has(c.name))c.set=2});
const SET2_CLASSES=["Artificer","Necromancer"];
const set2On=()=>!!(S.access&&S.access.set2);
const visClasses=()=>set2On()?[...CLASSES,...SET2_CLASSES]:CLASSES;
const visTypes=()=>set2On()?[...TYPES,"Recipe"]:TYPES;
const canSee=c=>!c||(c.set!==2||!!(S.access&&S.access.set2))&&(c.set!=="trials"||!!(S.access&&S.access.trials));
const BYID=new Map([...HEROES,...CARDS,...TOKENS].map(c=>[c.id,c]));
/* Set 2 Recipes: what each Recipe makes is looked up by its own name (the Play tab shows made items and weapons by it); never listed as a deck card */
CARDS.filter(isRecipe).forEach(c=>{const f=upFace(c);const m=Object.assign({},f,{id:c.up.name,face:"",up:null,kind:c.up.type==="Equipment"?"equip":"card",set:c.set,backOf:c.name});if(!BYID.has(m.id))BYID.set(m.id,m)});
/* Trials module (co-op boss Trials, trials-data.js). Stricter than Set 2: these objects only exist in CARDS, TOKENS and BYID while the
   signed-in player has Trials access (admins, or the Trials box in Admin > Users). Without access, Trials names are masked everywhere. */
const TRIALS_SET=new Set(typeof TRIALS_NAMES!=="undefined"?TRIALS_NAMES:[]);
const TRIALS_OBJS=typeof TRIALS_LOOT==="undefined"?[]:[
  ...TRIALS_LOOT.map(r=>{const c={id:r[0],kind:"equip",name:r[0],sup:r[1],type:"Equipment",sub:r[2],cls:r[3],rules:r[4],cost:r[5],region:r[6],pstr:+r[7]||0,pdef:+r[8]||0,ver:r[9]||1,set:"trials"};
    const u=TRIALS_LOOT_UPGRADES[r[0]];if(u)c.up={cost:+u[0],rules:u[1],pstr:+u[2]||0,pdef:+u[3]||0};return c}),
  ...TRIALS_BOSSES.map(r=>({id:"t:"+r[0],kind:"token",tkind:"Boss",name:r[0],type:"Token",sub:"Trial "+r[1]+" boss",cls:"Trials",sup:"",cost:"",rules:`Health Points: ${r[2]} per party. Defense: ${r[3]}, plus its Stone Plates.\n${r[6]}`,ver:r[7]||1,set:"trials"})),
  ...TRIALS_BOSS_CARDS.map(r=>({id:"t:"+r[0],kind:"token",tkind:"Boss Card",name:r[0],type:"Token",sub:`${r[1]} boss card · ${r[2]} in its deck`,cls:"Trials",sup:"",cost:"",rules:`Target: ${r[3]}\n${r[4]}`,ver:r[5]||1,set:"trials"})),
  ...TRIALS_SPAWNS.map(r=>({id:"t:"+r[0],kind:"token",tkind:"Summon",name:r[0],type:"Token",sub:`Spawn · ${r[1]}`,cls:"Trials",sup:"",cost:"",str:r[2],def:r[3],hp:r[4],rules:r[5],ver:r[6]||1,set:"trials"}))];
const trialsOn=()=>!!(S.access&&S.access.trials);
/* a card name or id the viewer may not see (a Trials card without Trials access) */
const trialsHidden=id=>{const k=String(id||"").replace(/^[th]:/,"");return(TRIALS_SET.has(k)&&!trialsOn())||(SET2.has(k)&&!set2On())};
const hiddenLabel=id=>trialsHidden(id)?"A card you don't have access to":id;
/* a deck row from someone else (Best Decks, Community, profiles): hidden when it uses a card the viewer can't see */
/* Best Decks and Community Decks never list Trials parties (2 Heroes), with or without access */
const showRow=r=>!Object.keys((r&&r.cards)||{}).some(trialsHidden)&&hcompact(r&&r.heroes).length!==2;
function warnHidden(d){if(d&&Object.keys(d.cards||{}).some(trialsHidden))toast("Some cards in this deck aren't available to you.")}
function syncTrials(){const on=trialsOn();
  for(const c of TRIALS_OBJS){const L=c.kind==="equip"?CARDS:TOKENS,i=L.indexOf(c);
    if(on&&i<0){L.push(c);BYID.set(c.id,c);if(c.kind==="token")TOKEN_BY_NAME.set(c.name,c)}
    else if(!on&&i>=0){L.splice(i,1);BYID.delete(c.id);if(TOKEN_BY_NAME.get(c.name)===c)TOKEN_BY_NAME.delete(c.name)}}}
/* Renamed cards (cards-data.js CARD_RENAMES): old saved decks, share links, imports and Best Decks lists still find the card. */
const RENAMES=(typeof CARD_RENAMES!=="undefined")?CARD_RENAMES:{};
function fixRenames(d){if(!d)return false;let ch=false;const c=d.cards||{};
  for(const o in RENAMES){if(c[o]!=null){const n=RENAMES[o];c[n]=Math.min(3,(c[n]||0)+c[o]);delete c[o];ch=true}}
  if(Array.isArray(d.heroes))d.heroes=d.heroes.map(h=>{if(!h)return null;const nm=String(h).replace(/^h:/,"");if(RENAMES[nm]){ch=true;return"h:"+RENAMES[nm]}return h});
  return ch}
function localDecks(){const l=store.get("cq.decks",[]);let ch=false;l.forEach(d=>{if(fixRenames(d))ch=true});if(ch)store.set("cq.decks",l);return l}
const hasGem=c=>c.kind!=="hero"&&!(c.kind==="token"&&c.tkind!=="Equipment");
function tokenStats(c){if(c.tkind==="Summon")return[["STR",c.str],["HP",c.hp]];if(c.tkind==="Item")return[["STR",c.str],["DEF",c.def],["HP",c.hp]];return null}
function tokenStatLine(c){if(c.tkind==="Summon")return c.str+"/"+c.hp;if(c.tkind==="Item")return c.str+" STR, "+c.def+" DEF, "+c.hp+" HP";if(c.tkind==="Equipment")return"+"+c.str+" STR";return"Pillar"}
const sortName=n=>n.replace(/^"|"$/g,"").toLowerCase();
const costNum=c=>c.cost==="X"?99:(c.cost===""?-1:+c.cost);
const maxCopies=c=>c.sup==="Legendary"?1:3;
const clsOrder=c=>c==="Generic"?99:CLASSES.includes(c)?CLASSES.indexOf(c):CLASSES.length+Math.max(0,SET2_CLASSES.indexOf(c));
const DECK_SIZE=50;
/* tokens a deck can make: one entry per token, count = what every copy of every source makes */
function tokensFor(d){
  const m=new Map();const add=(name,q)=>{for(const[t,n]of(TOKEN_SRC[name]||[]))m.set(t,(m.get(t)||0)+n*q)};
  d.heroes.forEach(h=>{const c=BYID.get(h);if(c)add(c.name,1)});
  for(const[id,q]of Object.entries(d.cards)){const c=BYID.get(id);if(c&&q>0)add(c.name,q)}
  return[...m].map(([n,q])=>({c:TOKEN_BY_NAME.get(n),q})).filter(x=>x.c).sort((a,b)=>clsOrder(a.c.cls)-clsOrder(b.c.cls)||a.c.name.localeCompare(b.c.name));
}

/* ---------- utils ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
/* Keyword reminder text: a short, italic "(…)" after the sentence that uses a keyword. Added when cards are shown
   (tiles, the Card Art template, the Play tab), once per keyword per card, and skipped when the card already explains it. */
const REMINDERS=[
  [/\bBanding\b/,()=>"When one attacks, other ready allies with Banding may join it, adding their STR. Every attacker is exhausted."],
  [/\bBarkborn\b/,()=>"It gains DEF equal to its HP this turn."],
  [/\bCombo\b(?!\s+(?:cards?|counters?)\b)/,()=>"Reveal the top card of your library. If it's a Combo card, you may play it or a Combo card from your hand."],
  [/\bSpell Damage Pillars?\b/,()=>"Your next spell deals 2 extra damage, then sacrifice the Pillar."],
  [/\bPain Pillars?\b/,()=>"At Dusk, target loses 1 HP for each Pain Pillar you control."],
  [/\bConjure\b(?![^.]*\bPillar\b)/,()=>"Create a Pillar token on the battlefield."],
  [/\bEcho\b(?!\s+cop)/,()=>"If you played it from your hand, exile it and play it again for free at your next Dawn."],
  [/\bEnraged\b/,()=>"At or below half its maximum HP."],
  [/\bGuard (\d+|X)\b/,m=>`Prevents the next ${m[1]} damage to it, before DEF, until Dusk.`],
  [/\bHarmonize (\d+|X)\b/,m=>`Exhaust ${m[1]} other ready Heroes you control.`],
  [/\bLifelink\b/,()=>"When it deals damage, it heals that much."],
  [/\bMeditates?\b/,()=>"Exhaust it. Each Dawn it gets a meditation counter and may stay exhausted. When it readies, remove them: gain that much Aura and +1 Strength each until Dusk."],
  [/\bMills? (\d+|X)\b/,m=>`Move the top ${m[1]==="1"?"card":m[1]+" cards"} of the library to the discard pile.`],
  [/\bPiercing(?: (\d+|X))?\b/,m=>m[1]?`Its damage ignores ${m[1]} of the target's DEF, and at least ${m[1]} always gets through.`:"Its damage ignores all of the target's DEF."],
  [/\bTip\b/,()=>"Gain 1 Gold. You gain Gold from Tip only once per round."],
  [/\bPoisonous(?: (\d+|X))?\b/,m=>m[1]?`When it deals damage, Poison the target ${m[1]==="1"?"once":m[1]+" times"}.`:"When it deals damage, Poison the target once for each damage dealt."],
  [/\bScry (\d+|X)\b/,m=>m[1]==="1"?"Look at the top card of your library. You may put it on the bottom.":`Look at the top ${m[1]} cards of your library. Put any on the bottom and the rest back in any order.`],
  [/\bSpell Damage \+(\d+|X)\b/,m=>`Your spells deal ${m[1]} extra damage.`],
  [/\bStealth\b/,()=>"It can't be targeted by enemy cards or abilities, but it can be attacked."],
  [/\bStun\b/,()=>"It can't play cards or activate abilities."],
  [/\bConfuse\b/,()=>"Its attacks and targets are chosen at random."],
  [/\bBurn\b(?! counters?)/,()=>"It loses 1 Health Point at Dawn."],
  [/\bPoison\b(?! counters?)/,()=>"It loses 1 Health Point at Dawn."],
  [/\bWound\b(?! counters?)/,()=>"It loses 1 Health Point at Dawn."],
  [/\bFatigue\b(?! counters?)/,()=>"It doesn't ready at the next Dawn."]
];
function withReminders(text){
  return String(text||"").split("\n").map(line=>{
    const adds=[];const seen=new Set();
    for(const [re,fn] of REMINDERS){const m=line.match(re);if(!m)continue;
      const at=m.index;
      const before=line.slice(0,at);if((before.match(/\(/g)||[]).length>(before.match(/\)/g)||[]).length)continue; /* already inside a ( … ) */
      const rest=line.slice(at);const em=rest.match(/[.!?](?=\s|$)/);const end=em?at+em.index+1:line.length;
      if(/^\s*\(/.test(line.slice(end))||line.slice(at,end).includes("("))continue; /* the card already explains it */
      const txt=fn(m);if(seen.has(txt))continue;seen.add(txt);adds.push([end,txt])}
    adds.sort((a,b)=>b[0]-a[0]||0);
    const byEnd={};adds.forEach(([e,t])=>{(byEnd[e]=byEnd[e]||[]).unshift(t)});
    Object.keys(byEnd).map(Number).sort((a,b)=>b-a).forEach(e=>{line=line.slice(0,e)+` {R:${byEnd[e].join(" ")}}`+line.slice(e)});
    return line}).join("\n")}
const remHTML=h=>h.replace(/\{R:(.*?)\}/g,'<i class="rem">($1)</i>');
/* stat words on cards: STR, DEF and HP (or the spelled-out words, as newer cards are written) are spelled out (Strength, Defense, Health Points) and they and Aura take the colour of their icons; a number right before the word is coloured with it */
const STAT_WORDS=[[/((?:[+\u2212-]?\d+|X) )?\b(?:STR|Strength)\b/g,"str","Strength"],[/((?:[+\u2212-]?\d+|X) )?\b(?:DEF|Defense)\b/g,"def","Defense"],[/((?:[+\u2212-]?\d+|X) )?\b(?:HP|Health Points)\b/g,"hp","Health Points"],[/((?:[+\u2212-]?\d+|X) )?\bHealth Point\b(?!s)/g,"hp","Health Point"],[/((?:[+\u2212-]?\d+|X) )?\bAura\b/g,"aura","Aura"]];
const statWords=h=>STAT_WORDS.reduce((t,[re,k,w])=>t.replace(re,(m,n)=>`<b class="kw kw-${k}">${n||""}${w}</b>`),h);
function rulesHTML(t){
  return withReminders(t).split("\n").filter(p=>p.trim()).map(p=>"<p>"+remHTML(statWords(esc(p))).replace(/\{A\}/g,'<i class="aura" aria-label="Aura"></i>').replace(/\{L(\d)\}/g,'<span class="lv">LV $1</span>')+"</p>").join("");
}
function rulesPlain(t){return t.replace(/\{A\}/g," Aura").replace(/\{L(\d)\}/g,"[Level $1]")}
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let toastT;
function toast(msg){const l=$("#layer");let t=l.querySelector(".toast");if(!t){t=document.createElement("div");t.className="toast";t.setAttribute("role","status");l.appendChild(t)}t.textContent=msg;clearTimeout(toastT);toastT=setTimeout(()=>t.remove(),3800)}
function busy(on,msg){const l=$("#layer");let b=l.querySelector(".busy");if(on){if(!b){b=document.createElement("div");b.className="busy";l.appendChild(b)}b.textContent=msg||"Working…"}else if(b)b.remove()}
const newId=()=>"d"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);

/* ---------- state ---------- */
const S={
  view:"catalog",
  cat:store.get("cq.cat",{cls:"all",type:"all",sort:"class",q:""}),
  b:{step:"heroes",heroCls:"all",cls:"all",type:"all",sort:"class",q:""},
  deck:store.get("cq.draft",null)||blankDeck(),
  dirty:false,
  decks:[],
  mode:"local", // local | account
  me:null, uid:null, db:null, downloads:null
};
function blankDeck(){return{id:newId(),name:"Untitled deck",heroes:[],cards:{}}}
function saveDraft(){store.set("cq.draft",S.deck)}
if(fixRenames(S.deck))saveDraft();
const deckTotal=d=>Object.values(d.cards).reduce((a,b)=>a+b,0);
const partyClasses=d=>[...new Set(d.heroes.map(h=>BYID.get(h)?.cls).filter(Boolean))];
function allowed(c,d){return c.cls==="Generic"||partyClasses(d).includes(c.cls)}
function issues(d){
  const out=[];
  if(isTrialsDeck(d)){if(HN(d)!==2)out.push("Trials parties need 2 Heroes.")}
  else if(HN(d)!==3)out.push(`Pick ${3-HN(d)} more Hero${3-HN(d)===1?"":"es"}.`);
  const t=deckTotal(d);
  if(t<DECK_SIZE)out.push(`Add ${DECK_SIZE-t} more card${DECK_SIZE-t===1?"":"s"} (decks need at least 50).`);
  for(const[id,q]of Object.entries(d.cards)){const c=BYID.get(id);if(!c&&trialsHidden(id)){out.push("This deck has a card you don't have access to.");continue}if(!c){out.push(typeof DEPRECATED_CARDS!=="undefined"&&DEPRECATED_CARDS.some(r=>r[1]===id)?`${id} is deprecated (removed from play). Take it out of this deck.`:`"${id}" isn't in the card list anymore.`);continue}
    if(q>maxCopies(c))out.push(`${c.name}: ${c.sup==="Legendary"?"Legendary, only 1 allowed":"max 3 copies"}.`);
    if(HN(d)&&!allowed(c,d))out.push(`${c.name} is ${c.cls}; no Hero in your party can play it.`);}
  return out;
}

/* ---------- 50-card rebuild (update 22) ----------
   Decks moved from 30 cards / 2 copies to 50 cards / 3 copies (1 of each Legendary).
   A deck "needs a rebuild" when it has 3 Heroes and 1–30 cards with no card above 2 copies (an old-format deck).
   Auto Rebuild: 2-ofs become 3-ofs, 1-ofs become 2-ofs (Legendaries stay at 1), then the deck is rounded off to 50:
   first by topping up its own cards (cheapest first), then with new cards from the party's classes (class with the
   fewest cards first, cheapest first). If doubling goes over 50, former 1-ofs drop back (most expensive first). */
function needsRebuild(d){if(!d||!d.heroes||isTrialsDeck(d)||HN(d)!==3)return false;const t=deckTotal(d);return t>0&&t<=30&&Object.values(d.cards).every(q=>q<=2)}
function autoRebuild(d){
  const old=d.cards||{},n={};const ok=c=>c&&(c.kind==="card"||c.kind==="equip")&&allowed(c,d);
  const keys=Object.keys(old).filter(id=>ok(BYID.get(id)));
  keys.forEach(id=>{const c=BYID.get(id);n[id]=Math.min(maxCopies(c),old[id]>=2?3:old[id]+1)});
  let t=Object.values(n).reduce((a,b)=>a+b,0);const cost=id=>costNum(BYID.get(id));
  if(t>DECK_SIZE){for(const id of keys.filter(id=>old[id]===1&&n[id]>1).sort((a,b)=>cost(b)-cost(a))){if(t<=DECK_SIZE)break;n[id]--;t--}}
  if(t>DECK_SIZE){for(const id of keys.slice().sort((a,b)=>cost(b)-cost(a))){while(t>DECK_SIZE&&n[id]>1){n[id]--;t--}}}
  if(t<DECK_SIZE){for(const id of keys.slice().sort((a,b)=>(old[b]-old[a])||(cost(a)-cost(b))||a.localeCompare(b))){while(t<DECK_SIZE&&n[id]<maxCopies(BYID.get(id))){n[id]++;t++}}}
  if(t<DECK_SIZE){const cls=partyClasses(d);const pool=CARDS.filter(c=>canSee(c)&&ok(c)&&!n[c.id]&&c.cls!=="Generic"&&!(typeof DEPRECATED_CARDS!=="undefined"&&DEPRECATED_CARDS.some(r=>r[1]===c.id)))
      .sort((a,b)=>costNum(a)-costNum(b)||a.name.localeCompare(b.name));
    const inCls=k=>Object.entries(n).reduce((a,[id,q])=>a+(BYID.get(id)?.cls===k?q:0),0);
    while(t<DECK_SIZE){const order=cls.slice().sort((a,b)=>inCls(a)-inCls(b));let added=false;
      for(const k of order){const c=pool.find(x=>x.cls===k&&!n[x.id]);if(!c)continue;const q=Math.min(maxCopies(c),DECK_SIZE-t);n[c.id]=q;t+=q;added=true;break}
      if(!added){const c=CARDS.find(x=>canSee(x)&&ok(x)&&x.cls==="Generic"&&!n[x.id]);if(!c)break;const q=Math.min(maxCopies(c),DECK_SIZE-t);n[c.id]=q;t+=q}}}
  return n}
function rebuildList(){const out=S.decks.filter(needsRebuild);if(needsRebuild(S.deck)&&!out.some(d=>d.id===S.deck.id))out.push(S.deck);return out}
async function rebuildDecks(list){let k=0;
  for(const d of list){const nd={...d,heroes:d.heroes.slice(),cards:autoRebuild(d)};
    if(d===S.deck||d.id===S.deck.id){S.deck.cards={...nd.cards};saveDraft();if(!S.decks.some(x=>x.id===d.id)){k++;continue}}
    try{await persistDeck(nd);k++}catch(e){}}
  return k}
function rebuildPrompt(){const list=rebuildList();if(!list.length||document.getElementById("rbm"))return;
  const key="cq.rb.shown."+(S.uid||"local");try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,"1")}catch(e){}
  const l=$("#layer");const m=document.createElement("div");m.className="modal";m.id="rbm";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label","Rebuild your decks");
  m.innerHTML=`<div class="box"><h2>Decks are now 50 cards</h2><p>Welcome back! The deck size has moved up to <b>50 cards</b>, and you can now include up to <b>3 copies</b> of a card (still 1 of each Legendary). Please rebuild your deck${list.length>1?"s":""}:</p>
  <ul class="rb-list">${list.map(d=>`<li><b>${esc(d.name||"Untitled deck")}</b> — ${deckTotal(d)} cards${d===S.deck&&!S.decks.some(x=>x.id===d.id)?" (current draft)":""}</li>`).join("")}</ul>
  <p class="note"><b>Auto Rebuild</b> turns each 2-of into a 3-of and each 1-of into a 2-of, then picks cards to round the deck off to 50. <b>Manual Rebuild</b> opens the Deck Builder so you can choose the new cards yourself.</p>
  <div class="actions newdeck-acts"><button type="button" class="btn primary go" data-act="rb-auto">Auto Rebuild</button><button type="button" class="btn" data-act="rb-manual">Manual Rebuild</button></div></div>`;
  l.appendChild(m)}

/* ---------- account / storage (Supabase) ---------- */
const CFG=window.CQ_CONFIG||{};
const SB=(CFG.supabaseUrl&&CFG.supabaseAnonKey&&!/YOUR_/.test(CFG.supabaseUrl+CFG.supabaseAnonKey)&&window.supabase)
  ?window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
S.authMode="signin"; // signin | signup | reset | newpass
async function initAccount(){
  if(!SB){S.decks=localDecks();renderAcct();render();rebuildPrompt();return}
  SB.auth.onAuthStateChange((ev,session)=>{
    if(ev==="PASSWORD_RECOVERY"){S.authMode="newpass";go("account")}
    setSession(session);
    if(ev==="SIGNED_IN"||ev==="USER_UPDATED")discordJoin(session);
  });
  const{data}=await SB.auth.getSession();setSession(data.session);
}
let lastUid=undefined;
/* Update 30: Discord. After a Discord sign-in or link, Supabase hands back Discord's access token once (provider_token);
   the discord-join Edge Function uses it with the bot token to add the player to the Crystal Quest server. */
/* DISCORD_AUTH stays false until the Discord provider, bot secrets and the discord-join function are set up in Supabase. */
const DISCORD_AUTH=true,DISCORD_INVITE="https://discord.gg/wErfNbug5e",DC_SCOPES="identify email guilds.join";
function discordOf(u){const i=(u&&u.identities||[]).find(x=>x.provider==="discord");if(!i)return null;const d=i.identity_data||{};return d.custom_claims&&d.custom_claims.global_name||d.full_name||d.name||d.user_name||null}
/* Asked once per account (per browser): after the first Discord sign-in either adds you to the server or shows the invite once.
   Supabase re-sends SIGNED_IN on page loads and tab refocus, so without this the invite kept popping up. */
const DC_DONE="cq.dc.done";
function dcDone(uid){try{return!!(JSON.parse(localStorage.getItem(DC_DONE)||"{}")[uid])}catch(e){return false}}
function dcMark(uid){try{const m=JSON.parse(localStorage.getItem(DC_DONE)||"{}");m[uid]=Date.now();localStorage.setItem(DC_DONE,JSON.stringify(m))}catch(e){}}
async function discordJoin(session){if(!DISCORD_AUTH||!session||!session.provider_token||!discordOf(session.user))return;
  const uid=session.user.id;if(dcDone(uid))return;dcMark(uid);
  try{const{data,error}=await SB.functions.invoke("discord-join",{body:{token:session.provider_token}});
    if(error||!data||!data.ok)throw error||new Error(data&&data.error);if(!data.already)toast("Signed in with Discord. You've been added to the Crystal Quest server.")}
  catch(e){console.warn(e);dcInviteModal()}}
document.addEventListener("change",async e=>{if(e.target.id!=="dcPub")return;const v=e.target.checked;const ok=window.CQProfDiscordPublic&&await window.CQProfDiscordPublic(v);toast(ok?(v?"Your Discord name shows on your profile.":"Your Discord name is hidden."):"Couldn't save that. Try again.")});
function dcInviteModal(){document.getElementById("dcm")?.remove();const m=document.createElement("div");m.className="modal";m.id="dcm";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");
  m.innerHTML=`<div class="box"><h2>Join the Crystal Quest Discord</h2><p>Playtest nights, card previews and rules questions all happen there.</p><div class="actions"><a class="btn dc-btn" href="${DISCORD_INVITE}" target="_blank" rel="noopener">Join the server</a><button type="button" class="btn" data-act="close">Not now</button></div></div>`;
  m.addEventListener("click",e=>{if(e.target===m)m.remove()});$("#layer").appendChild(m)}
function setSession(session){
  const u=session&&session.user;
  S.uid=u?u.id:null;
  S.me=u?{email:u.email||"",name:(u.user_metadata&&u.user_metadata.display_name)||discordOf(u)||String(u.email||"player").split("@")[0],discord:discordOf(u),hasEmail:(u.identities||[]).some(x=>x.provider==="email")}:null;
  S.mode=u?"account":"local";
  if(S.uid===lastUid){renderAcct();return}
  lastUid=S.uid;S.commMine=undefined;S.access={admin:false,set2:false,trials:false};syncTrials();showAdminLink();if(u)loadAccess();if(window.CQProf)window.CQProf.onSession();
  if(u)loadDecks().then(()=>{try{if(window.CQTut)window.CQTut.onAccount()}catch(e){console.warn(e)}});else{S.decks=localDecks();setTimeout(rebuildPrompt,50)}
  renderAcct();render();
}
/* Admin and Set 2 access (Supabase RPC my_access; see "Admin Panel SQL" in the project). Signed out or no SQL yet = no access. */
async function loadAccess(){const uid=S.uid;let a={admin:false,set2:false,trials:false};
  try{const{data,error}=await SB.rpc("my_access");if(!error&&data)a={admin:!!data.admin,set2:!!(data.set2||data.admin),trials:!!(data.trials||data.admin)}}catch(e){}
  if(uid!==S.uid)return;S.access=a;syncTrials();showAdminLink();if(["catalog","build","admin","rules","quickstart","trials-rules","set2-rules","best","community","decks","changelog","leaderboard","player"].includes(S.view))render()}
function showAdminLink(){const l=document.getElementById("adminTab");if(l)l.hidden=!(S.access&&S.access.admin)}
async function loadDecks(){
  /* own decks only (the profiles update adds a public-read policy, so filter by user); is_private may not exist before the Profiles SQL runs */
  /* update 30: the decks.log column (Deck log) may not exist until "Deck Log SQL" runs; is_private may not exist before the Profiles SQL */
  const sel=c=>SB.from("decks").select(c).eq("user_id",S.uid).order("updated_at",{ascending:false});
  let{data,error}=await sel("id,name,heroes,cards,updated_at,is_private,log");S.logCol=!error;
  if(error&&/\blog\b/.test(error.message))({data,error}=await sel("id,name,heroes,cards,updated_at,is_private"));
  if(error&&/is_private/.test(error.message))({data,error}=await sel("id,name,heroes,cards,updated_at"));
  if(error){toast("Couldn't load your decks. Check your connection and reload.");return}
  S.decks=data.map(r=>({id:r.id,name:r.name,heroes:r.heroes||[],cards:r.cards||{},updated:Date.parse(r.updated_at)||0,log:Array.isArray(r.log)&&r.log.length?r.log:logLocal(r.id),...(typeof r.is_private==="boolean"?{priv:r.is_private}:{})}));
  const fixed=S.decks.filter(fixRenames);
  if(fixed.length)SB.from("decks").upsert(fixed.map(d=>({...toRow(d),updated_at:new Date(d.updated||Date.now()).toISOString()}))).then(({error})=>{if(!error)toast(`Updated ${fixed.length} saved deck${fixed.length===1?"":"s"} for renamed cards.`)});
  if(S.view==="decks")render();
  rebuildPrompt();
}
const toRow=d=>({id:d.id,user_id:S.uid,name:(d.name||"Untitled deck").slice(0,80),heroes:hcompact(d.heroes).slice(0,3),cards:d.cards,updated_at:new Date().toISOString(),...(S.logCol&&d.log?{log:d.log}:{})});
/* ---------- Deck log (update 30): each save records what changed (name, Heroes, cards +/-). Kept on the deck (decks.log in your account, or in this browser).
   Until the account's log column exists ("Deck Log SQL"), account deck logs are kept in this browser under cq.decklog. ---------- */
const LOG_MAX=100;
function logLocal(id){const m=store.get("cq.decklog",{})||{};return Array.isArray(m[id])?m[id]:[]}
function logLocalSet(id,log){const m=store.get("cq.decklog",{})||{};m[id]=log;store.set("cq.decklog",m)}
function deckDiff(prev,d){const e={t:Date.now()};
  if(!prev){e.created=1;e.n=deckTotal(d);return e}
  if((prev.name||"")!==(d.name||""))e.name=[prev.name||"",d.name||""];
  const ha=hcompact(d.heroes).filter(h=>!prev.heroes.includes(h)),hr=hcompact(prev.heroes).filter(h=>!d.heroes.includes(h));if(ha.length||hr.length)e.h={add:ha,rem:hr};
  const c={};new Set([...Object.keys(prev.cards||{}),...Object.keys(d.cards||{})]).forEach(id=>{const n=(d.cards[id]||0)-((prev.cards||{})[id]||0);if(n)c[id]=n});if(Object.keys(c).length)e.c=c;
  return e.name||e.h||e.c?e:null}
function withLog(d){const prev=S.decks.find(x=>x.id===d.id);const old=(prev&&prev.log)||d.log||logLocal(d.id)||[];const e=deckDiff(prev,d);
  d.log=e?[e,...old].slice(0,LOG_MAX):old.slice(0,LOG_MAX);return d}
async function persistDeck(d){
  withLog(d);
  if(S.mode==="account"){if(!S.logCol)logLocalSet(d.id,d.log);
    const{error}=await SB.from("decks").upsert(toRow(d));
    if(error){toast("Couldn't save to your account: "+error.message);throw error}
    const i=S.decks.findIndex(x=>x.id===d.id);const rec={...d,cards:{...d.cards},heroes:d.heroes.slice(),log:(d.log||[]).slice(),updated:Date.now()};if(i>=0&&typeof S.decks[i].priv==="boolean")rec.priv=S.decks[i].priv;else if(S.decks.some(x=>typeof x.priv==="boolean"))rec.priv=false;
    if(i>=0)S.decks.splice(i,1);S.decks.unshift(rec);return "account";
  }
  const list=localDecks().filter(x=>x.id!==d.id);
  list.unshift({...d,cards:{...d.cards},heroes:d.heroes.slice(),log:(d.log||[]).slice(),updated:Date.now()});
  store.set("cq.decks",list);S.decks=list;return "local";
}
async function removeDeck(id){
  if(S.mode==="account"){const{error}=await SB.from("decks").delete().eq("id",id);if(error){toast("Couldn't delete that deck. Try again.");return}S.decks=S.decks.filter(d=>d.id!==id)}
  else{const l=localDecks().filter(x=>x.id!==id);store.set("cq.decks",l);S.decks=l}
  toast("Deck deleted.");render();
}
async function migrateLocal(){
  const l=localDecks();if(!l.length)return;
  const rows=l.map(d=>({...toRow(d),updated_at:new Date(d.updated||Date.now()).toISOString()}));
  const{error}=await SB.from("decks").upsert(rows);
  if(error){toast("Couldn't move those decks: "+error.message);return}
  store.set("cq.decks",[]);toast(`Moved ${l.length} deck${l.length===1?"":"s"} into your account.`);await loadDecks();render();
}
/* Update 31: the account button shows the player's screen name (from their profile) with a person icon */
function myProfile(){const P=window.CQProf&&CQProf._D;return P&&P.me||null}
function myScreenName(){const p=myProfile();return p&&p.screen_name||(S.me&&S.me.name)||"Account"}
function renderAcct(){
  const el=$("#acct");el.innerHTML="";
  if(!SB){el.innerHTML='<span>Guest · decks save in this browser</span>';return}
  const a=document.createElement("a");a.href="#account";a.className="btn sm";
  if(S.mode==="account"){a.classList.add("acct-btn");a.title="Your account";a.innerHTML=`<svg class="acct-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4.2" fill="currentColor"/><path d="M3.5 21c.8-4.6 4.3-7 8.5-7s7.7 2.4 8.5 7" fill="currentColor"/></svg><span></span>`;a.querySelector("span").textContent=myScreenName()}
  else{const s=document.createElement("span");s.textContent="Guest";el.append(s);a.textContent="Sign in";a.classList.add("primary")}
  el.append(a);
}
function viewAccount(){
  if(!SB)return`<h1>Accounts</h1><p class="lede">Player accounts aren't switched on for this site yet. You can still build decks; they save in this browser.</p>`;
  if(S.authMode==="newpass")return`<h1>Choose a new password</h1>
    <form class="panel authf" data-form="newpass"><label class="field col" for="np">New password<input id="np" type="password" name="password" minlength="8" required autocomplete="new-password"></label>
    <button class="btn primary" type="submit">Save password</button></form>`;
  if(S.mode==="account"){const pr=myProfile();const av=pr&&pr.avatar?`${ICON_BASE}art/hero-head/${artKey(pr.avatar)}.png?v=${ART_VER}`:"";
    return`<h1>Your account</h1>
    <div class="panel acct-panel">
    <div class="acct-me">${av?`<img class="acct-av" src="${esc(av)}" alt="" width="72" height="72">`:`<span class="acct-av none" aria-hidden="true"></span>`}<div><b class="acct-nm">${esc(myScreenName())}</b><span class="note">Your screen name and avatar show on the Leaderboard, your profile and decks you share.</span>
      <div class="actions"><button class="btn" type="button" data-act="edit-profile">${pr?"Change name or avatar":"Set up your profile"}</button>${pr?`<a class="btn" href="#player/me">View profile</a>`:""}</div></div></div>
    <form class="authf acct-row" data-form="email"><label class="field col" for="acEm">Email<input id="acEm" type="email" name="email" required autocomplete="email" value="${esc(S.me.email||"")}"></label><button class="btn" type="submit">Change email</button></form>
    ${S.me.hasEmail?`<form class="authf acct-row" data-form="newpw"><label class="field col" for="acPw">New password<input id="acPw" type="password" name="password" minlength="8" required autocomplete="new-password" placeholder="At least 8 characters"></label><button class="btn" type="submit">Change password</button></form>`:""}
    ${DISCORD_AUTH?`<div class="dc-row">${S.me.discord?`<span class="dc-chip"><svg class="dc-logo" viewBox="0 0 24 18" aria-hidden="true"><path fill="currentColor" d="M20.3 1.5A19.6 19.6 0 0 0 15.4 0l-.6 1.3a18 18 0 0 0-5.6 0L8.6 0a19.6 19.6 0 0 0-4.9 1.5C.6 6.1-.3 10.6.1 15a19.8 19.8 0 0 0 6 3l1.3-2a12.8 12.8 0 0 1-2-1l.5-.4a14 14 0 0 0 12.2 0l.5.4-2 1 1.3 2a19.7 19.7 0 0 0 6-3c.5-5.1-.8-9.6-3.6-13.5ZM8 12.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 7.5 8 7.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>@${esc(S.me.discord)}</span><span class="note">Discord connected</span><label class="dc-pub"><input type="checkbox" id="dcPub" ${window.CQProf&&CQProf._D&&CQProf._D.me&&CQProf._D.me.discord_public===false?"":"checked"}> Show on my profile</label>${S.me.hasEmail?`<button class="btn sm" type="button" data-act="dc-unlink">Disconnect</button>`:""}`:`<button class="btn sm dc-btn" type="button" data-act="dc-link"><svg class="dc-logo" viewBox="0 0 24 18" aria-hidden="true"><path fill="currentColor" d="M20.3 1.5A19.6 19.6 0 0 0 15.4 0l-.6 1.3a18 18 0 0 0-5.6 0L8.6 0a19.6 19.6 0 0 0-4.9 1.5C.6 6.1-.3 10.6.1 15a19.8 19.8 0 0 0 6 3l1.3-2a12.8 12.8 0 0 1-2-1l.5-.4a14 14 0 0 0 12.2 0l.5.4-2 1 1.3 2a19.7 19.7 0 0 0 6-3c.5-5.1-.8-9.6-3.6-13.5ZM8 12.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 7.5 8 7.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>Connect Discord</button><span class="note">Sign in with Discord too, and join the Crystal Quest server.</span>`}</div>`:""}
    <div class="actions acct-out"><button class="btn danger" type="button" data-act="signout">Sign out</button></div></div>`}
  const m=S.authMode;
  const tabs=`<div class="chips" role="group" aria-label="Account action">${[["signin","Sign in"],["signup","Create account"],["reset","Forgot password"]].map(([k,l])=>`<button type="button" class="chip" data-act="auth-mode" data-v="${k}" aria-pressed="${m===k}">${l}</button>`).join("")}</div>`;
  const email=`<label class="field col" for="em">Email<input id="em" type="email" name="email" required autocomplete="email"></label>`;
  const pw=(ac)=>`<label class="field col" for="pw">Password<input id="pw" type="password" name="password" minlength="8" required autocomplete="${ac}"></label>`;
  let form="";
  const dcBtn=!DISCORD_AUTH?"":`<button class="btn dc-btn wide" type="button" data-act="dc-signin"><svg class="dc-logo" viewBox="0 0 24 18" aria-hidden="true"><path fill="currentColor" d="M20.3 1.5A19.6 19.6 0 0 0 15.4 0l-.6 1.3a18 18 0 0 0-5.6 0L8.6 0a19.6 19.6 0 0 0-4.9 1.5C.6 6.1-.3 10.6.1 15a19.8 19.8 0 0 0 6 3l1.3-2a12.8 12.8 0 0 1-2-1l.5-.4a14 14 0 0 0 12.2 0l.5.4-2 1 1.3 2a19.7 19.7 0 0 0 6-3c.5-5.1-.8-9.6-3.6-13.5ZM8 12.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 7.5 8 7.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>Sign in with Discord</button><div class="or-line">or</div>`;
  if(m==="signin")form=`<form class="panel authf" data-form="signin">${dcBtn}${email}${pw("current-password")}<button class="btn primary" type="submit">Sign in</button></form>`;
  if(m==="signup")form=`<form class="panel authf" data-form="signup">${dcBtn}<label class="field col" for="dn">Display name<input id="dn" type="text" name="display_name" maxlength="40" required></label>${email}${pw("new-password")}<p class="note">At least 8 characters. We'll email you a link to confirm your address.</p><button class="btn primary" type="submit">Create account</button></form>`;
  if(m==="reset")form=`<form class="panel authf" data-form="reset">${email}<p class="note">We'll email you a link to set a new password.</p><button class="btn primary" type="submit">Send reset link</button></form>`;
  return`<h1>Player account</h1><p class="lede">Make a free account to save your decks and open them on any device. Without one, decks save in this browser only.</p><div class="bar">${tabs}</div>${form}`;
}
document.addEventListener("submit",async e=>{
  const f=e.target.closest("form[data-form]");if(!f||!SB)return;e.preventDefault();
  const fd=Object.fromEntries(new FormData(f));const btn=f.querySelector("[type=submit]");btn.disabled=true;
  const redirect=location.origin+location.pathname;
  try{
    if(f.dataset.form==="signin"){const{error}=await SB.auth.signInWithPassword({email:fd.email,password:fd.password});if(error)throw error;toast("Signed in.");if(localDecks().length)toast("Signed in. You can move your browser decks into your account from My Decks.");go("decks")}
    if(f.dataset.form==="signup"){const{data,error}=await SB.auth.signUp({email:fd.email,password:fd.password,options:{data:{display_name:fd.display_name},emailRedirectTo:redirect}});if(error)throw error;
      if(data.session){toast("Account created.");go("decks")}else{f.outerHTML=`<div class="panel"><p>Check <b>${esc(fd.email)}</b> for a confirmation link, then come back and sign in.</p></div>`}}
    if(f.dataset.form==="reset"){const{error}=await SB.auth.resetPasswordForEmail(fd.email,{redirectTo:redirect});if(error)throw error;f.outerHTML=`<div class="panel"><p>If an account exists for <b>${esc(fd.email)}</b>, a reset link is on its way.</p></div>`}
    if(f.dataset.form==="newpass"){const{error}=await SB.auth.updateUser({password:fd.password});if(error)throw error;S.authMode="signin";toast("Password updated.");go("decks")}
    if(f.dataset.form==="email"){const em=String(fd.email||"").trim();if(!em||em===S.me.email){toast("That's already your email.");btn.disabled=false;return}const{error}=await SB.auth.updateUser({email:em},{emailRedirectTo:redirect});if(error)throw error;toast(`Check ${em} (and your current inbox) for a link to confirm the change.`)}
    if(f.dataset.form==="newpw"){const{error}=await SB.auth.updateUser({password:fd.password});if(error)throw error;f.reset();toast("Password changed.")}
    if(f.dataset.form==="profile"){const{data,error}=await SB.auth.updateUser({data:{display_name:fd.display_name}});if(error)throw error;S.me.name=fd.display_name;renderAcct();toast("Name updated.")}
  }catch(err){toast(err.message||"Something went wrong. Try again.")}
  if(btn.isConnected)btn.disabled=false;
});
async function signOut(){await SB.auth.signOut();toast("Signed out.");go("catalog")}

/* ---------- share links ---------- */
function shareCode(d){
  const o={n:d.name,h:d.heroes.map(h=>BYID.get(h)?.name||h),c:Object.entries(d.cards).filter(([,q])=>q>0)};
  return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function readShare(code){
  try{const o=JSON.parse(decodeURIComponent(escape(atob(code.replace(/-/g,"+").replace(/_/g,"/")))));
    const d=blankDeck();d.name=String(o.n||"Shared deck").slice(0,80);
    d.heroes=(o.h||[]).map(n=>"h:"+(RENAMES[n]||n)).filter(id=>BYID.has(id)).slice(0,3);
    for(let[id,q]of o.c||[]){id=RENAMES[id]||id;if(BYID.has(id)&&q>0)d.cards[id]=Math.min(+q,2)}
    return d}catch(e){return null}
}
function shareURL(d){return location.origin+location.pathname+"?deck="+shareCode(d)+"#build"}

/* ---------- rendering: card tile ---------- */
function typeLine(c){const v=`<i class="cver" title="Card version">v${c.ver||1}</i>`;
  if(c.kind==="hero")return`<span>Hero</span><span>${esc(c.cls)} ${v}</span>`;
  if(c.kind==="token")return`<span>${c.set==="trials"?"":"Token — "}${esc(c.sub)}</span><span>${esc(c.cls)} ${v}</span>`;
  const left=(c.sup?`<span class="leg${c.sup==="Legendary"?" legendary":""}">${esc(c.sup)}</span> `:"")+esc(c.type)+(c.sub?" — "+esc(c.sub):"");
  return`<span>${left}</span><span>${esc(c.cls)} ${v}</span>`;
}
function footHTML(c){
  if(c.kind==="hero")return`<div class="stats">${[["STR",c.str],["DEF",c.def],["AURA",c.aura],["HP",c.hp]].map(([k,v])=>`<div class="stat s-${k.toLowerCase()}"><b>${esc(v)}</b><i>${k}</i></div>`).join("")}</div>`;
  if(c.kind==="token"){const st=tokenStats(c);if(st)return`<div class="stats">${st.map(([k,v])=>`<div class="stat"><b>${esc(v)}</b><i>${k}</i></div>`).join("")}</div>`;
    if(c.set==="trials")return c.tkind==="Boss"?"Trials boss":"Boss card";
    return c.tkind==="Equipment"?[esc(c.region),"+"+esc(c.str)+" STR","Token"].join(" · "):"Pillar token"}
  if(c.kind==="equip"){const b=[esc(c.region)];if(c.pstr)b.push("+"+c.pstr+" STR");if(c.pdef)b.push("+"+c.pdef+" DEF");if(c.face==="up")b.push(`<b class="upcost">Upgraded · ${c.up.cost} Gold</b>`);
    return b.join(" · ")+(c.up?`<span class="flip" role="button" tabindex="0" data-flip title="${c.face==="up"?"Flip back to the normal side":`Flip to see the upgrade (${c.up.cost} Gold at the Blacksmith)`}" aria-label="${c.face==="up"?"Show normal side":"Show upgraded side"}">⟳</span>`:"")}
  if(c.backOf&&!c.up&&c.kind!=="equip")return`<b class="upcost">Made by ${esc(c.backOf)}</b>`;
  if(isRecipe(c)){const b=c.up;const made=c.face==="up"?[b.type==="Equipment"?esc(b.region):"",b.pstr?"+"+b.pstr+" STR":"",b.pdef?"+"+b.pdef+" DEF":"",`<b class="upcost">Made by ${esc(c.backOf||"")}</b>`].filter(Boolean).join(" · "):(c.sup==="Legendary"?"1 copy per deck":"Up to 3 copies")+" · Recipe";
    return made+flipHTML(c)}
  return c.sup==="Legendary"?"1 copy per deck":"Up to 3 copies";
}
function cardHTML(c,o={}){
  if(o.flipped&&c.up&&c.face!=="up")c=upFace(c);
  const tag=o.button?"button":"article";
  const attrs=o.button?` type="button" data-act="${o.button}" data-id="${esc(c.id)}"`:o.pool?` data-act="inc" data-pool="${esc(c.id)}" data-id="${esc(c.id)}"`:"";
  /* art cards are never a <button>: Safari (iPad, and Chrome on iPad) sizes the art frame inside a button to 0 wide, so the cards vanished (Nov 12, 2026) */
  if(hasArt(c))return artCardHTML(c,o,o.button?"div":tag,o.button?` role="button" tabindex="0" data-act="${o.button}" data-id="${esc(c.id)}"`:attrs);
  return`<${tag} class="card${o.picked?" picked":""}${c.kind==="token"?" token":""}${o.maxed?" maxed":""}${c.face==="up"?" upside":""}"${c.up?` data-cid="${esc(c.face==="up"?c.id.slice(0,-3):c.id)}"`:""} style="--cc:${cc(c.cls)};--ci:${ci(c.cls)};--ct:${ct(c.cls)}"${attrs}>
  <div class="c-head"><span class="c-name">${esc(c.name)}${c.face==="up"?` <span class="upstar" title="${c.backOf?"Made by the Recipe":"Upgraded side"}">★</span>`:""}</span>${hasGem(c)&&!(c.backOf&&c.cost==="")?`<span class="gem" title="Aura cost">${esc(c.cost)}</span>`:""}</div>
  <div class="c-type">${typeLine(c)}</div>
  <div class="c-rules">${rulesHTML(c.rules||"")}</div>
  <div class="c-foot">${footHTML(c)}${o.nozoom?"":zoomHTML(c)}</div>
  ${o.slot?`<span class="slotbadge">${o.slot}</span>`:""}
  ${o.ctrl||""}
</${tag}>`;
}
/* Card Art theme tile: the card image itself; upgraded equipment shows its back (upgraded) side */
function flipHTML(c){if(isRecipe(c))return`<span class="flip" role="button" tabindex="0" data-flip title="${c.face==="up"?"Flip back to the Recipe":`Flip to see what it makes: ${esc(c.up.name)}`}" aria-label="${c.face==="up"?"Show the Recipe side":"Show what it makes"}">⟳</span>`;return c.up?`<span class="flip" role="button" tabindex="0" data-flip title="${c.face==="up"?"Flip back to the normal side":`Flip to see the upgrade (${c.up.cost} Gold at the Blacksmith)`}" aria-label="${c.face==="up"?"Show normal side":"Show upgraded side"}">⟳</span>`:""}
function artSrc(c){const side=c.face==="up"?"up":"face";if(blankArt(c)){/* a Recipe's made side uses the frame of what it makes; tactic blanks have no upgraded side */const bk=c.backOf&&c.type==="Equipment"?"equip":c.kind,bs=c.backOf||bk!=="equip"?"face":side;return `${ICON_BASE}art/blank/${bk}-${c.cls}${c.sup==="Legendary"&&bk!=="hero"&&BLANK_LEG.has(c.cls)?"-Legendary":""}-${bs}.webp?v=${ART_VER}`}return `${ICON_BASE}art/${c.kind}/${artKey(c.name)}-${side}.webp?v=${ART_VER}`}
function artAlt(c){return`${c.name}${c.face==="up"?" (upgraded)":""}: ${String(c.rules||"").replace(/\{A\}/g," Aura")}`}
/* Card Image Template (Card Art theme): the image is a blank Component.Studio export; rules text and numbers are laid over it.
   Positions are in px of the 825x1125 export (bleed included); the image is cropped 37px each side, so the overlay box is 751x1051.
   rules: [left, top, width, height]; nums: [field, centerX, centerY]. Kinds with baked-in numbers list no nums. */
const ART_TPL={
  hero:{rules:[110,752,612,282],nums:[["aura",705,132],["str",223,610],["hp",406,577],["def",593,610]],text:[["title",190,129,450],["sub",185,678,460]]},
  card:{rules:[110,760,612,280],nums:[["cost",705,132]],text:[["title",190,129,450],["sub",185,678,460]]},
  equip:{rules:[110,760,612,180],nums:[["cost",705,132],["str",119,996],["def",702,996]],text:[["title",190,129,450],["sub",185,678,460],["upgrade",220,965,380],["region",305,1024,215]]}
};
/* text slots: [field, left, centerY, width] in export px; one line, shrunk to fit by fitArt() */
const artPos=(x,y)=>`left:${((x-37)/751*100).toFixed(3)}%;top:${((y-37)/1051*100).toFixed(3)}%`;
function artNum(c,f){if(f==="aura"&&c.kind!=="hero")f="cost";
  if(f==="str"&&c.kind==="equip")return"+"+(c.pstr||0);if(f==="def"&&c.kind==="equip")return"+"+(c.pdef||0);
  const v=c[f];return v==null||v===""?"":String(v)}
function artText(c,f){
  if(f==="title")return esc(c.name);
  if(f==="sub")return esc(c.kind==="hero"?c.cls+" Hero":[c.sup,c.type,c.sub].filter(Boolean).join(" "));
  if(f==="region")return esc(c.region||"");
  if(f==="upgrade")return c.face==="up"?"Upgraded!":c.up?`Upgrade: ${esc(c.up.cost)}<i class="coin" aria-label="Gold"></i>`:"";
  return""}
function artRulesHTML(t){return withReminders(t).split("\n").filter(p=>p.trim()).map(p=>"<p>"+remHTML(statWords(esc(p))).replace(/\{A\}/g,'<i class="aura" aria-label="Aura"></i>').replace(/\{L(\d)\}/g,`<img class="lvl" src="${ICON_BASE}lvl$1.png" alt="Level $1" width="145" height="65">`)+"</p>").join("")}
function artOverlayHTML(c){const t=ART_TPL[c.kind];if(!t)return"";const[l,tp,w,h]=t.rules;
  return`<div class="art-ov" aria-hidden="true">${t.text.map(([f,x,y,wd])=>{const v=artText(c,f);return v?`<div class="ov-line ov-${f}" style="${artPos(x,y)};width:${(wd/751*100).toFixed(3)}%"><span class="ov-fit">${v}</span></div>`:""}).join("")}<div class="ov-rules" style="${artPos(l,tp)};width:${(w/751*100).toFixed(3)}%;height:${(h/1051*100).toFixed(3)}%">${artRulesHTML(c.rules)}</div>${t.nums.map(([f,x,y])=>{const v=artNum(c,f);return v?`<b class="ov-num" style="${artPos(x,y)}">${esc(v)}</b>`:""}).join("")}</div>`}
/* shrink one-line card text (names, type lines, regions) that is wider than its bar */
function fitArt(root){root=root||document;root.querySelectorAll(".ov-fit").forEach(e=>{const box=e.parentElement;if(!box.clientWidth)return;e.style.fontSize="";const r=box.clientWidth/e.scrollWidth;if(r<1)e.style.fontSize=(r*0.98*100).toFixed(1)+"%"});
  /* rules: keep the standard size; only cards whose rules + reminder text overflow the box step down until they fit */
  root.querySelectorAll(".ov-rules").forEach(e=>{if(!e.clientHeight)return;e.style.fontSize="";let k=1;while(e.scrollHeight>e.clientHeight+1&&k>0.6){k-=0.04;e.style.fontSize=(4.128*k).toFixed(3)+"cqw"}})}
if(SKIN==="art"){let q=0;const run=()=>{q=0;fitArt()};const later=()=>{if(!q)q=requestAnimationFrame(run)};
  new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length))later()}).observe(document.documentElement,{childList:true,subtree:true});
  document.fonts&&document.fonts.ready.then(later);addEventListener("load",later)}
/* magnifier on every card tile (except inside a zoomed view): opens the zoomed card view.
   Deck Builder / Cards tab: inspect() (with Add to deck). Play tab: a plain zoom (card + art rating + Close) stacked over any open panel. */
const ZOOM_SVG='<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function zoomHTML(c){const id=c.face==="up"?c.id.slice(0,-3):c.id;return`<span class="zoom" role="button" tabindex="0" data-zoom="${esc(id)}"${c.face==="up"?' data-zup="1"':""} title="Zoom in" aria-label="Zoom in on ${esc(c.name)}">${ZOOM_SVG}</span>`}
function zoomOnly(c){const l=$("#layer");const m=document.createElement("div");m.className="modal zoom-only";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label",c.name);
  m.innerHTML=`<div class="box">${cardHTML(c,{nozoom:1})}${artRateHTML(c)}<div class="actions"><button type="button" class="btn" data-act="close">Close</button></div></div>`;
  m.addEventListener("click",e=>{if(e.target===m)m.remove()});l.appendChild(m);m.querySelector("[data-act=close]").focus();loadArtRate(m)}
function zoomFrom(z){let c=BYID.get(z.dataset.zoom);if(!c)return;
  const mode=z.closest("#play-root,#pl-modal")?"zoom":"inspect";if(mode==="zoom"&&z.dataset.zup&&c.up)c=upFace(c);openZoom(c,mode);zoomNav(z,mode)}
/* zoom arrows: the zoomed view gets ‹ › buttons (plus ←/→ keys and swipe) that step through the list the card was opened from
   (card grid, hero picker, card pool, deck list, test hand, Play hand, piles, pick lists, board Heroes). Off at the ends; hidden for a one-card list. */
const ZLIST_SEL=".grid,.dl,.pips,.pl-hand,.pick-list,.pl-heroes,.pl-row";
const ZITEM_SEL="[data-zoom],[data-act=inspect][data-id],[data-act=inspect-hand][data-id]";
function openZoom(c,mode){if(mode==="inspect")inspect(c);else zoomOnly(c)}
function zoomList(t){const box=t&&t.closest&&t.closest(ZLIST_SEL);if(!box||box.closest("#layer > .modal:not(#pl-modal)"))return null;
  const tileOf=el=>el.closest(".card,li,.pill,.hc,.pk,.ph,.slot")||el;const me=tileOf(t);const seen=new Set(),items=[];let at=-1;
  box.querySelectorAll(ZITEM_SEL).forEach(el=>{const tile=tileOf(el);if(seen.has(tile))return;const id=el.dataset.zoom||el.dataset.id;if(!id||!BYID.get(id))return;
    seen.add(tile);if(tile===me||tile.contains(t))at=items.length;items.push({id,zup:!!el.dataset.zup})});
  return at<0||items.length<2?null:{items,at}}
function zoomNav(t,mode){const L=zoomList(t);const m=$("#layer").lastElementChild;if(L&&m)addZnav(m,L,mode)}
function addZnav(m,L,mode,focusDir){const n=L.items.length,i=L.at;m.classList.add("has-znav");
  const go=d=>{const j=i+d;if(j<0||j>=n)return;const it=L.items[j];let c=BYID.get(it.id);if(!c)return;if(it.zup&&c.up)c=upFace(c);
    m.remove();openZoom(c,mode);const m2=$("#layer").lastElementChild;if(m2)addZnav(m2,{items:L.items,at:j},mode,d)};
  m._znav=go;
  m.insertAdjacentHTML("beforeend",`<button type="button" class="btn znav prev" aria-label="Previous card" title="Previous card (←)"${i<=0?" disabled":""}><svg class="zchev" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M9 4.5 16.5 12 9 19.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button type="button" class="btn znav next" aria-label="Next card" title="Next card (→)"${i>=n-1?" disabled":""}><svg class="zchev" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M9 4.5 16.5 12 9 19.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`);
  const acts=m.querySelector(".box .actions");if(acts)acts.insertAdjacentHTML("afterbegin",`<span class="zcount" aria-live="polite">${i+1} / ${n}</span>`);
  const pb=m.querySelector(".znav.prev"),nb=m.querySelector(".znav.next");
  pb.addEventListener("click",e=>{e.stopPropagation();go(-1)});nb.addEventListener("click",e=>{e.stopPropagation();go(1)});
  let x0=null;m.addEventListener("touchstart",e=>{x0=e.touches.length===1?e.touches[0].clientX:null},{passive:true});
  m.addEventListener("touchend",e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>50)go(dx<0?1:-1)},{passive:true});
  if(focusDir){const f=focusDir<0?pb:nb;if(!f.disabled)f.focus()}}
document.addEventListener("keydown",e=>{if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight"||e.metaKey||e.ctrlKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  const m=$("#layer").lastElementChild;if(!m||!m._znav)return;e.preventDefault();m._znav(e.key==="ArrowLeft"?-1:1)});
document.addEventListener("click",e=>{const z=e.target.closest&&e.target.closest("[data-zoom]");if(!z)return;e.preventDefault();e.stopPropagation();zoomFrom(z)},true);
document.addEventListener("keydown",e=>{const z=e.target.closest&&e.target.closest("[data-zoom]");if(!z||(e.key!=="Enter"&&e.key!==" "))return;e.preventDefault();e.stopPropagation();zoomFrom(z)},true);
/* Deck Builder pool: left click a card adds a copy (data-act="inc"), right click removes one */
document.addEventListener("contextmenu",e=>{const t=e.target.closest&&e.target.closest("[data-pool]");if(!t||e.target.closest(".c-ctrl,[data-zoom],[data-flip]"))return;e.preventDefault();
  const id=t.dataset.pool;if(!S.deck.cards[id])return;setDeck(d=>{if(d.cards[id]>1)d.cards[id]--;else delete d.cards[id]})});
function artCardHTML(c,o,tag,attrs){
  return`<${tag} class="card art${o.picked?" picked":""}${o.maxed?" maxed":""}${c.face==="up"?" upside":""}"${c.up?` data-cid="${esc(c.face==="up"?c.id.slice(0,-3):c.id)}"`:""} style="--cc:${cc(c.cls)};--ci:${ci(c.cls)};--ct:${ct(c.cls)}" title="${esc(c.name)}${c.face==="up"?" (upgraded)":""} · ${esc(c.cls)} · v${c.ver||1}"${attrs}>
  <div class="art-frame"><img class="c-art" src="${artSrc(c)}" alt="${esc(artAlt(c))}" width="500" height="700" loading="lazy" decoding="async">${artOverlayHTML(c)}</div>
  ${flipHTML(c)}
  ${o.nozoom?"":zoomHTML(c)}
  ${o.slot?`<span class="slotbadge">${o.slot}</span>`:""}
  ${o.ctrl||""}
</${tag}>`;
}
const kindRank=c=>c.kind==="hero"?0:c.kind==="token"?2:1;
function filterSort(list,f){
  const q=f.q.trim().toLowerCase();
  let l=list.filter(c=>canSee(c)&&(f.cls==="all"||c.cls===f.cls)&&(f.type==="all"||(f.type==="Trials"?c.set==="trials":f.type==="Hero"?c.kind==="hero":c.type===f.type))&&(!q||(c.name+" "+c.rules+" "+c.type+" "+c.sub).toLowerCase().includes(q)));
  const byName=(a,b)=>sortName(a.name).localeCompare(sortName(b.name));
  const s={class:(a,b)=>kindRank(a)-kindRank(b)||clsOrder(a.cls)-clsOrder(b.cls)||(a.set==="trials"&&b.set==="trials"?(a.tkind||"").localeCompare(b.tkind||""):0)||byName(a,b),
    name:byName,cost:(a,b)=>costNum(a)-costNum(b)||byName(a,b),type:(a,b)=>a.type.localeCompare(b.type)||byName(a,b)}[f.sort]||byName;
  return l.sort(s);
}
function gridWithGroups(list,f,tile){
  if(!list.length){/* say which filters are on, and offer to clear them (a saved Type or search could hide every card) */
    const on=[f.q&&f.q.trim()?`search “${esc(f.q.trim())}”`:"",f.type&&f.type!=="all"&&f.type!=="Hero"?`type ${esc(f.type)}`:"",f.cls&&f.cls!=="all"&&f.type!=="Hero"?`class ${esc(f.cls)}`:""].filter(Boolean);
    const sc=f===S.cat?"cat":f===S.b?"b":"";
    return`<div class="empty">No cards match these filters${on.length?` (${on.join(", ")})`:""}.${sc&&on.length?` <button type="button" class="btn sm" data-act="clear-filters" data-scope="${sc}">Clear filters</button>`:""}</div>`}
  if(f.sort!=="class")return list.map(tile).join("");
  let out="",last=null;
  const gk=c=>c.set==="trials"&&c.kind==="token"?"Trials module · "+(c.tkind==="Boss Card"?"Boss cards":c.tkind==="Boss"?"Bosses":"Spawns"):(c.kind==="hero"?"Heroes · ":c.kind==="token"?"Tokens · ":"")+c.cls;
  const counts={};list.forEach(c=>{const k=gk(c);counts[k]=(counts[k]||0)+1});
  for(const c of list){const k=gk(c);
    if(k!==last){out+=`<div class="group-h" style="--cc:${cc(c.cls)};--ci:${ci(c.cls)}"><i class="dot"></i>${esc(k)} <span>${counts[k]}</span></div>`;last=k}
    out+=tile(c)}
  return out;
}
function classChips(cur,act,classes,withAll=true){
  return`<div class="chips" role="group" aria-label="Filter by class">${withAll?`<button type="button" class="chip" data-act="${act}" data-v="all" aria-pressed="${cur==="all"}">All classes</button>`:""}${classes.map(k=>`<button type="button" class="chip" style="--cc:${cc(k)};--ci:${ci(k)}" data-act="${act}" data-v="${k}" aria-pressed="${cur===k}"><i class="dot"></i>${k}</button>`).join("")}</div>`;
}
function selectHTML(id,act,cur,opts){return`<select id="${id}" data-act="${act}">${opts.map(([v,l])=>`<option value="${v}"${v===cur?" selected":""}>${l}</option>`).join("")}</select>`}
const SORTS=[["class","Class"],["name","Name"],["cost","Aura cost"],["type","Card type"]];

/* ---------- views ---------- */
function render(){
  /* menu highlight: the page's own link, plus the dropdown parent (Decklists, Rules) of any page inside it; bottom bar Changelog too */
  document.querySelectorAll("#tabs a[data-view],#sitebar a[data-view]").forEach(a=>{const sub=a.closest(".tab-dd")&&!a.closest(".tab-sub")?[...a.closest(".tab-dd").querySelectorAll(".tab-sub a")]:null;
    const on=sub?sub.some(x=>x.getAttribute("href")==="#"+S.view):a.dataset.view===S.view;if(on)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
  const v=$("#view");
  if(S.view!=="home"&&window.CQHome)window.CQHome.leave();
  if(S.view==="home"){if(window.CQHome)window.CQHome.mount(v)}
  else if(S.view==="learn"){if(window.CQHome)window.CQHome.mountLearn(v)}
  else if(S.view==="catalog")v.innerHTML=viewCatalog();
  else if(S.view==="build"){/* update 30: keep the deck list's scroll position (and the page's) when a card is added or removed */
    const dp=v.querySelector(".deckpanel"),st=dp?dp.scrollTop:0,wy=window.scrollY;v.innerHTML=viewBuild();
    const dp2=v.querySelector(".deckpanel");if(dp2&&st)dp2.scrollTop=st;if(window.scrollY!==wy)window.scrollTo(0,wy)}
  else if(S.view==="account")v.innerHTML=viewAccount();
  else if(S.view==="rules"){v.innerHTML=viewRules();if(!S.rules)loadRules()}
  else if(S.view==="quickstart"){v.innerHTML=viewQuick();if(!S.quick)loadQuick()}
  else if(S.view==="trials-rules"){if(trialsOn()){v.innerHTML=viewTrialsRules();if(!S.trules)loadTrialsRules()}else{v.innerHTML=viewRules();if(!S.rules)loadRules()}}
  else if(S.view==="set2-rules"){if(set2On()){v.innerHTML=viewSet2Rules();if(!S.s2rules)loadSet2Rules()}else{v.innerHTML=viewRules();if(!S.rules)loadRules()}}
  else if(S.view==="play"){if(window.CQPlay)window.CQPlay.mount(v);else v.innerHTML='<p class="lede">Loading the game…</p>'}
  else if(S.view==="changelog"){if(window.CQLog)window.CQLog.mount(v);else v.innerHTML='<p class="lede">Loading the changelog…</p>'}
  else if(S.view==="best"){v.innerHTML=viewBest();if(!S.best||Date.now()-S.best.at>60000)loadBest()}
  else if(S.view==="community"){v.innerHTML=viewCommunity();if(!S.comm||Date.now()-S.comm.at>60000)loadCommunity()}
  else if(S.view==="leaderboard"||S.view==="player"){if(window.CQProf)window.CQProf.mount(v);else v.innerHTML='<p class="lede">Loading…</p>'}
  else if(S.view==="admin"){if(window.CQAdmin)window.CQAdmin.mount(v);else v.innerHTML='<p class="lede">Loading…</p>'}
  else v.innerHTML=viewDecks();
}
function viewCatalog(){
  const f=S.cat;{const ty=["all","Hero","Token",...visTypes(),...(trialsOn()?["Trials"]:[])];if(!ty.includes(f.type))f.type="all";if(f.cls!=="all"&&![...visClasses(),"Generic"].includes(f.cls))f.cls="all";if(typeof f.q!=="string")f.q=""}
  const all=[...HEROES,...CARDS,...TOKENS];
  const list=filterSort(all,f);
  return`<div class="bhead"><h1>Cards</h1><a href="#build" class="btn primary go newdeck build-go">Build a Deck</a></div>
  <p class="lede">Every Hero, card, piece of equipment and token in Crystal Quest. ${HEROES.filter(canSee).length} Heroes, ${CARDS.filter(canSee).length} deck cards, ${TOKENS.filter(canSee).length} tokens.${SET2.size&&S.access&&S.access.set2?` Includes ${[...HEROES,...CARDS,...TOKENS].filter(c=>c.set===2).length} Set 2 cards (hidden playtest set).`:""}${trialsOn()&&TRIALS_OBJS.length?` Includes ${TRIALS_OBJS.length} Trials module cards (hidden; pick Trials module under Type).`:""}</p>
  <div class="bar">${classChips(f.cls,"cat-cls",[...visClasses(),"Generic"])}</div>
  <div class="bar">
    <label class="field" for="cat-q">Search <input type="search" id="cat-q" data-act="cat-q" value="${esc(f.q)}" placeholder="Name or rules text"></label>
    <label class="field" for="cat-type">Type ${selectHTML("cat-type","cat-type",f.type,[["all","All"],["Hero","Heroes"],...visTypes().map(t=>[t,t]),["Token","Tokens"],...(trialsOn()?[["Trials","Trials module"]]:[])])}</label>
    <label class="field" for="cat-sort">Sort by ${selectHTML("cat-sort","cat-sort",f.sort,SORTS)}</label>
    <span class="count">${list.length} shown</span>
  </div>
  <div class="grid">${gridWithGroups(list,f,c=>cardHTML(c,{button:"inspect"}))}</div>`;
}
const HSTATS=[["STR","str"],["DEF","def"],["AURA","aura"],["HP","hp"]];
function heroStatsHTML(h,cls="hstats"){return`<span class="${cls}">${HSTATS.map(([k,f])=>`<span><b>${esc(h[f])}</b><i>${k}</i></span>`).join("")}</span>`}
/* Digital Hero Card (same look as the Play tab's compact Hero Cards): name bar + Aura gem, pixel art, STR/HP/DEF squares, Ability on hover */
function heroDigitalHTML(h,slot){
  const src=`${ICON_BASE}art/hero-pix/${artKey(h.name)}-pix.png?v=${ART_VER}`,ico=`${ICON_BASE}ico-${String(h.cls||"generic").toLowerCase()}.png`;
  const sq=(f,l,t)=>`<span class="dh-sq dh-${f}" title="${t} ${esc(h[f])}"><b>${esc(h[f])}</b><i>${l}</i></span>`;
  return`<div class="dh-card">${slot?`<span class="dh-slot">${esc(slot)}</span>`:""}
    <div class="dh-nb"><img class="dh-ci" src="${ico}" alt="${esc(h.cls)}"><span class="dh-nm${h.name.length>17?" xl":h.name.length>13?" l":""}">${esc(h.name)}</span><span class="dh-au" title="Aura ${esc(h.aura)}">${esc(h.aura)}</span></div>
    <div class="dh-art"><img src="${src}" onerror="this.onerror=null;this.src='${ico}';this.classList.add('noart')" alt="${esc(h.name)}" width="207" height="167" loading="lazy" decoding="async">${zoomHTML(h)}</div>
    <div class="dh-st">${sq("str","STR","Strength")}${sq("hp","HP","Health Points")}${sq("def","DEF","Defense")}<span class="dh-ab" tabindex="0">Ability<span class="dh-tip" role="tooltip"><span class="dh-tt">${esc(h.name)} <small>${esc(h.cls)} Hero</small></span>${h.rules?artRulesHTML(h.rules):"<p>No ability.</p>"}</span></span></div>
  </div>`}
function partySlots(d){
  const names=SLOT_NAMES(d);
  return`<div class="party${names.length===2?" p2":""}">${names.map((n,i)=>{const h=BYID.get(d.heroes[i]);
    return h?`<div class="slot full hero-full hero-dig${S.b.swap===i?" swapping":""}" style="--cc:${cc(h.cls)};--ci:${ci(h.cls)}">${heroDigitalHTML(h,(i+1)+" · "+n.toUpperCase())}<div class="c-ctrl"><button type="button" class="btn sm" data-act="inspect" data-id="${esc(h.id)}">View</button><span class="sp"></span><button type="button" class="btn sm${S.b.swap===i?" primary":""}" data-act="hero-swap" data-slot="${i}">${S.b.swap===i?"Cancel":"Swap"}</button><button type="button" class="btn sm" data-act="unhero" data-id="${esc(h.id)}">Remove</button></div></div>`
      :`<div class="slot empty-slot${S.b.target===i?" target":""}"><small>${i+1} · ${n}</small>${HN(d)===names.length-1?`<span class="cl">Pick a Hero below</span>`:`<button type="button" class="btn sm${S.b.target===i?" primary":""}" data-act="hero-target" data-slot="${i}">${S.b.target===i?"Pick a Hero below ↓":"Choose Hero"}</button>`}</div>`}).join("")}</div>`;
}
function stepsHTML(){
  const st=S.b.step,h=HN(S.deck)===HSLOTS(S.deck);
  return`<div class="steps"><div class="step ${st==="heroes"?"on":"done"}"><b>1</b>Choose ${HSLOTS(S.deck)} Heroes</div><i class="sep"></i><div class="step ${st==="cards"?"on":""}"><b>2</b>Build a deck (50+ cards)</div></div>`;
}
function viewBuild(){
  const d=S.deck;const NS=HSLOTS(d),party=isTrialsDeck(d);
  if(HN(d)<NS)S.b.step="heroes";
  if(S.b.step==="heroes"){
    const f={cls:S.b.heroCls,type:"Hero",sort:"class",q:""};
    const list=filterSort(HEROES,f);
    return`<div class="bhead"><h1>Deck Builder</h1><button type="button" class="btn primary go newdeck" data-act="new-deck-ask" title="Start a new, empty deck">New Deck</button>${trialsOn()?`<button type="button" class="btn newparty" data-act="new-party" title="A 2-Hero party for the co-op Trials">New Trials party</button>`:""}</div>${stepsHTML()}
    <h2 class="party-h">${party?"Choose your Trials party.":"Choose your party."}</h2><p class="lede">${party?"A Trials party has two Heroes: a Lead and a Closer. Then build a deck of at least 50 cards from their class cards and generic cards. Trials parties are for the co-op Trials in the Play tab.":"Pick three Heroes for your party, in order. Then pick from their specific class cards or generic cards to build your strategy."}</p>
    ${partySlots(d)}
    <div class="bar">${classChips(S.b.heroCls,"hero-cls",visClasses())}</div>
    <div class="bar"><button type="button" class="btn primary go" data-act="to-cards" ${HN(d)===NS?"":"disabled"}>Continue to cards →</button>
      <span class="count">${HN(d)}/${NS} Heroes chosen</span>
      ${HN(d)||deckTotal(d)?`<button type="button" class="btn" data-act="new-deck">Start over</button>`:""}</div>
    <div class="grid">${gridWithGroups(list,f,c=>{const i=d.heroes.indexOf(c.id);return cardHTML(c,{button:"pick-hero",picked:i>=0,slot:i>=0?SLOT_NAMES(d)[i].toUpperCase():""})})}</div>`;
  }
  const pcls=partyClasses(d);
  const f=S.b;
  if(f.cls!=="all"&&f.cls!=="Generic"&&!pcls.includes(f.cls))f.cls="all";
  if(f.type!=="all"&&!visTypes().includes(f.type))f.type="all";
  const pool=filterSort(CARDS.filter(c=>allowed(c,d)),f);
  const total=deckTotal(d);
  return`<div class="bhead"><h1>Deck Builder</h1><button type="button" class="btn primary go newdeck" data-act="new-deck-ask" title="Start a new, empty deck">New Deck</button>${trialsOn()?`<button type="button" class="btn newparty" data-act="new-party" title="A 2-Hero party for the co-op Trials">New Trials party</button>`:""}</div>${stepsHTML()}
  ${partySlots(d)}
  <div class="split">
    <section aria-label="Card pool">
      <div class="bar">${classChips(f.cls,"b-cls",[...pcls.sort((a,b)=>clsOrder(a)-clsOrder(b)),"Generic"])}</div>
      <div class="bar">
        <label class="field" for="b-q">Search <input type="search" id="b-q" data-act="b-q" value="${esc(f.q)}" placeholder="Name or rules text"></label>
        <label class="field" for="b-type">Type ${selectHTML("b-type","b-type",f.type,[["all","All"],...visTypes().map(t=>[t,t])])}</label>
        <label class="field" for="b-sort">Sort by ${selectHTML("b-sort","b-sort",f.sort,SORTS)}</label>
        <button type="button" class="btn sm" data-act="to-heroes">Change Heroes</button>
      </div>
      <p class="note pool-tip">Click a card to add a copy, right-click to remove one. Use the magnifier to zoom in.</p>
      <div class="grid">${gridWithGroups(pool,f,c=>{const q=d.cards[c.id]||0,m=maxCopies(c);
        return cardHTML(c,{pool:1,maxed:q>=m,ctrl:`<div class="c-ctrl"><button type="button" class="btn" data-act="dec" data-id="${esc(c.id)}" ${q?"":"disabled"} aria-label="Remove one ${esc(c.name)}">−</button><span class="q">${q}/${m}${q>=m?' <b class="maxtag">Max</b>':""}</span><button type="button" class="btn" data-act="inc" data-id="${esc(c.id)}" ${q>=m?"disabled":""} aria-label="Add one ${esc(c.name)}">+</button><button type="button" class="btn add3" data-act="inc-max" data-id="${esc(c.id)}" ${q>=m?"disabled":""} title="Add copies up to the limit (${m})">Add ${m}</button><span class="sp"></span></div>`})})}</div>
    </section>
    ${deckPanel(d)}
  </div>`;
}
function deckPanel(d){
  const total=deckTotal(d),iss=issues(d);
  const entries=Object.entries(d.cards).map(([id,q])=>({c:BYID.get(id),id,q})).filter(x=>x.q>0);
  const groups={};
  for(const e of entries){const g=e.c?(e.c.kind==="equip"?"Equipment":e.c.type):"Unknown";(groups[g]=groups[g]||[]).push(e)}
  const order=["Spell","Tactic","Song","Summon","Enchantment","Item","Equipment","Unknown"];
  const curve=[0,0,0,0,0,0,0,0];// 0..6, 7+ incl X
  for(const e of entries){if(!e.c)continue;const n=e.c.cost==="X"?7:Math.min(+e.c.cost||0,7);curve[n]+=e.q}
  const cmax=Math.max(1,...curve);
  return`<aside class="deckpanel" aria-label="Your deck">
    <label class="note" for="deck-name">Deck name</label>
    <input type="text" id="deck-name" data-act="deck-name" value="${esc(d.name)}" maxlength="60">
    <div class="dp-top"><div class="meter"><span class="big">${total}</span><span class="of">/ ${DECK_SIZE}+ cards</span></div><button type="button" class="btn primary dp-save" data-act="save">Save deck</button></div>
    <div class="prog${total>=DECK_SIZE?" full":""}"><i style="width:${Math.min(100,total/DECK_SIZE*100)}%"></i></div>
    <div><div class="curve-l">Aura curve</div><div class="curve">${curve.map((n,i)=>`<div><span>${n||""}</span><span class="b" style="height:${n/cmax*48}px"></span><span>${i===7?"7+":i}</span></div>`).join("")}</div></div>
    <ul class="issues ${iss.length?"bad":"good"}">${iss.length?iss.map(x=>`<li>${esc(x)}</li>`).join(""):"<li>Deck is legal and ready to play.</li>"}</ul>
    <button type="button" class="btn handbtn" data-act="visual" data-src="current" ${total?"":"disabled"} title="See the deck laid out in stacks, one stack per card">Visual View</button>
    <button type="button" class="btn primary handbtn" data-act="hand" data-src="current" ${total>=HAND_SIZE?"":"disabled"} title="Shuffle and draw 4. Then mulligan or draw a card.">Draw starting hand</button>
    ${entries.length?"":`<p class="note">Use + on a card to add it. You can include up to 3 copies of a card, and 1 of each Legendary.</p>`}
    ${HN(d)?`<div class="dl heroes"><h4><span>Heroes</span><span>${HN(d)}/${HSLOTS(d)}</span></h4><ul>${d.heroes.map((id,i)=>{const h=BYID.get(id);if(!h)return"";return`<li style="--cc:${cc(h.cls)};--ci:${ci(h.cls)}"><span class="q">${i+1}</span><i class="dot"></i><button type="button" class="n nlink" data-act="inspect" data-id="${esc(h.id)}" title="${SLOT_NAMES(d)[i]} · ${esc(h.cls)} · click to view">${esc(h.name)}</button>${heroStatsHTML(h,"hstats sm")}</li>`}).join("")}</ul></div>`:""}
    <div class="dl">${order.filter(g=>groups[g]).map(g=>`<h4><span>${g}</span><span>${groups[g].reduce((a,e)=>a+e.q,0)}</span></h4><ul>${groups[g].sort((a,b)=>costNum(a.c||{cost:0})-costNum(b.c||{cost:0})||a.id.localeCompare(b.id)).map(e=>`<li style="--cc:${cc(e.c?e.c.cls:"")};--ci:${ci(e.c?e.c.cls:"")}"><span class="q">${e.q}</span><i class="dot"></i>${e.c?`<button type="button" class="n nlink${allowed(e.c,d)?"":" bad"}" data-act="inspect" data-id="${esc(e.id)}" title="Click to view">${esc(e.c.name)}</button>${e.c.sup==="Legendary"?'<span class="leg-ico" title="Legendary: 1 copy per deck" aria-label="Legendary">L</span>':""}`:`<span class="n bad">${esc(hiddenLabel(e.id))}</span>`}<span class="cst">${e.c?esc(e.c.cost):""}</span><button type="button" class="mini" data-act="dec" data-id="${esc(e.id)}" aria-label="Remove one">−</button><button type="button" class="mini" data-act="inc" data-id="${esc(e.id)}" aria-label="Add one" ${!e.c||e.q>=maxCopies(e.c)?"disabled":""}>+</button><button type="button" class="mini add3" data-act="inc-max" data-id="${esc(e.id)}" title="Fill to ${e.c?maxCopies(e.c):3} copies" ${!e.c||e.q>=maxCopies(e.c)?"disabled":""}>×${e.c?maxCopies(e.c):3}</button><button type="button" class="mini rmall" data-act="rmall" data-id="${esc(e.id)}" aria-label="Remove all copies of ${esc(e.c?e.c.name:hiddenLabel(e.id))}" title="Remove all copies">×</button></li>`).join("")}</ul>`).join("")}</div>
    ${(()=>{const tk=tokensFor(d);return tk.length?`<div class="dl tokens"><h4><span>Tokens needed</span><span>${tk.reduce((a,t)=>a+t.q,0)}</span></h4><ul>${tk.map(t=>`<li style="--cc:${cc(t.c.cls)};--ci:${ci(t.c.cls)}"><span class="q">${t.q}</span><i class="dot"></i><button type="button" class="n nlink" data-act="inspect" data-id="${esc(t.c.id)}" title="Click to view">${esc(t.c.name)}</button><span class="cst">${esc(tokenStatLine(t.c))}</span></li>`).join("")}</ul><p class="note">Enough for every copy of the cards that make them. Tokens don't count toward your deck. Print &amp; Play includes them.</p></div>`:""})()}
    ${entries.some(e=>e.c&&!allowed(e.c,d))?`<button type="button" class="btn sm danger" data-act="prune">Remove cards your party can't play</button>`:""}
    <div class="actions">
      <button type="button" class="btn" data-act="pnp" data-src="current">Print &amp; Play PDF</button>
      <button type="button" class="btn" data-act="tts" data-src="current">Tabletop Simulator</button>
      <button type="button" class="btn" data-act="copylist" data-src="current">Copy list</button>
      <button type="button" class="btn" data-act="share" data-src="current">Share link</button>
      <button type="button" class="btn" data-act="deckpng" data-src="current" title="A picture of the deck to post online">Deck image (PNG)</button>
      <button type="button" class="btn" data-act="decklog" data-src="current">Deck log${(n=>n?` (${n})`:"")(deckLog(d).length)}</button>
    </div>
    <p class="note">${S.mode==="account"?"Saved decks sync to your account.":"You're not signed in, so saved decks stay in this browser."+(SB?' <a href="#account">Sign in</a>':"")}${S.dirty?" Unsaved changes.":""}</p>
  </aside>`;
}
/* ---------- update 30: own decks from Decklists, Visual View, Deck log, deck image (PNG) ---------- */
/* a deck in Decklists that is one of your saved decks opens that deck (no "(copy)"), so saving updates it */
function ownMatch(d){const key=x=>JSON.stringify([x.heroes.slice().sort(),Object.entries(x.cards).filter(([,q])=>q>0).sort()]);const k=key(d);return S.decks.find(x=>key(x)===k)||null}
function openOwn(o){if(!o)return false;if(S.dirty&&S.deck.id!==o.id&&!confirmReplace())return true;
  S.deck={id:o.id,name:o.name,heroes:o.heroes.slice(),cards:{...o.cards}};S.dirty=false;S.b.step=HN(o)===3?"cards":"heroes";saveDraft();go("build");toast("This is one of your saved decks. Opened it, so Save deck updates it.");return true}
function deckLog(d){const o=S.decks.find(x=>x.id===d.id);return(o&&o.log)||d.log||[]}
const deckSorted=d=>Object.entries(d.cards).filter(([,q])=>q>0).map(([id,q])=>({c:BYID.get(id),id,q})).filter(x=>x.c)
  .sort((a,b)=>costNum(a.c)-costNum(b.c)||sortName(a.c.name).localeCompare(sortName(b.c.name)));
const VIS_GROUPS=[["Spell","Spells"],["Tactic","Tactics"],["Song","Songs"],["Summon","Summons"],["Enchantment","Enchantments"],["Item","Items"],["Equipment","Equipment"]];
const visGroup=c=>c.kind==="equip"?"Equipment":c.type;
function visualModal(d){
  const es=deckSorted(d),hs=d.heroes.map(h=>BYID.get(h)).filter(Boolean);
  const stack=e=>`<div class="vs-stack" style="--n:${e.q}" title="${e.q} × ${esc(e.c.name)}">${Array.from({length:e.q},(_,i)=>`<div class="vs-card" style="--i:${i}">${cardHTML(e.c,{nozoom:i<e.q-1})}</div>`).join("")}<span class="vs-q">×${e.q}</span></div>`;
  const groups=VIS_GROUPS.map(([g,label])=>{const l=es.filter(e=>visGroup(e.c)===g);return l.length?`<section class="vs-g"><h3>${label} <span>${l.reduce((a,e)=>a+e.q,0)}</span></h3><div class="vs-row">${l.map(stack).join("")}</div></section>`:""}).join("");
  document.getElementById("vism")?.remove();
  const m=document.createElement("div");m.className="modal";m.id="vism";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label","Visual View");
  m.innerHTML=`<div class="box wide vis-box"><div class="vis-top"><h2>${esc(d.name||"Untitled deck")} <span class="note">${deckTotal(d)} cards</span></h2>
    <div class="actions"><button type="button" class="btn" data-act="deckpng" data-src="${d===S.deck?"current":esc(d.id)}">Deck image (PNG)</button><button type="button" class="btn" data-act="close">Close</button></div></div>
    ${hs.length?`<div class="vs-heroes">${hs.map((h,i)=>`<div class="vs-hero"><span class="vs-pos">${["Lead","Center","Closer"][i]}</span>${cardHTML(h)}</div>`).join("")}</div>`:""}
    ${groups||'<div class="empty">No cards in this deck yet.</div>'}</div>`;
  m.addEventListener("click",e=>{if(e.target===m)m.remove()});$("#layer").appendChild(m);if(SKIN==="art")requestAnimationFrame(()=>fitArt(m));m.querySelector("[data-act=close]")?.focus()}
function logLine(e){const nm=id=>{const c=BYID.get(id);return esc(c?c.name:id)};const parts=[];
  if(e.created)parts.push(`Deck saved for the first time (${e.n} cards).`);
  if(e.name)parts.push(`Renamed “${esc(e.name[0])}” → “${esc(e.name[1])}”.`);
  if(e.h){if(e.h.add.length)parts.push(`Heroes in: ${e.h.add.map(nm).join(", ")}.`);if(e.h.rem.length)parts.push(`Heroes out: ${e.h.rem.map(nm).join(", ")}.`)}
  if(e.c){const add=Object.entries(e.c).filter(([,n])=>n>0),rem=Object.entries(e.c).filter(([,n])=>n<0);
    if(add.length)parts.push(`<span class="lg-add">+ ${add.map(([id,n])=>`${n} ${nm(id)}`).join(", ")}</span>`);
    if(rem.length)parts.push(`<span class="lg-rem">− ${rem.map(([id,n])=>`${-n} ${nm(id)}`).join(", ")}</span>`)}
  return parts.join(" ")}
function deckLogModal(d){const log=deckLog(d);document.getElementById("logm")?.remove();
  const m=document.createElement("div");m.className="modal";m.id="logm";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label","Deck log");
  m.innerHTML=`<div class="box"><h2>Deck log</h2><p class="note">${esc(d.name||"Untitled deck")}: every save adds a line with what changed.${S.mode==="account"&&!S.logCol?" (Kept in this browser for now.)":""}</p>
    ${log.length?`<ol class="deck-log">${log.map(e=>`<li><time>${esc(new Date(e.t).toLocaleString([], {dateStyle:"medium",timeStyle:"short"}))}</time><div>${logLine(e)}</div></li>`).join("")}</ol>`:`<div class="empty">No saves logged yet. Changes are logged from the next time you press Save deck.</div>`}
    ${d===S.deck&&S.dirty?'<p class="note">You have unsaved changes. They show up here after you press Save deck.</p>':""}
    <div class="actions"><button type="button" class="btn" data-act="close">Close</button></div></div>`;
  m.addEventListener("click",e=>{if(e.target===m)m.remove()});$("#layer").appendChild(m);m.querySelector("[data-act=close]")?.focus()}
/* deck image: deck name + Heroes, the player's avatar and name, then the deck in stacks (cards drawn like Print & Play) */
function loadImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src})}
function myIdentity(){const P=window.CQProf&&window.CQProf._D;const me=P&&P.me;const heroes=HEROES;
  const key=me&&me.avatar?artKey(me.avatar):"Savage_Raider";const h=heroes.find(x=>artKey(x.name)===key)||heroes.find(x=>x.name==="Savage Raider")||heroes[0];
  const dn=S.me&&S.me.name&&S.me.name!==String(S.me.email||"").split("@")[0]?S.me.name:null; /* never put an email address on a public image */
  const name=me&&me.screen_name||dn||"Crystal Quest player";return{name,hero:h}}
/* Update 30: the deck image is a picture of the real cards. Build an off-screen sheet with the site's own card markup
   (Card Art images + rules text, hero cards as in the Deck Builder), then turn it into a PNG with html-to-image. */
async function exportDeckPNG(d){warnHidden(d);
  const es=deckSorted(d),hs=d.heroes.map(h=>BYID.get(h)).filter(Boolean);if(!es.length&&!hs.length){toast("This deck is empty.");return}
  busy(true,"Drawing the deck image…");await loadFonts();
  const host=document.createElement("div");host.className="png-sheet";
  try{
    if(!window.htmlToImage)await new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js";s.onload=ok;s.onerror=no;document.head.appendChild(s)});
    const me=myIdentity();
    const stack=e=>`<div class="vs-stack" style="--n:${e.q}">${Array.from({length:e.q},(_,i)=>`<div class="vs-card" style="--i:${i}">${cardHTML(e.c,{nozoom:true})}</div>`).join("")}${e.q>1?`<span class="vs-q">×${e.q}</span>`:""}</div>`;
    const groups=VIS_GROUPS.map(([g,label])=>{const l=es.filter(e=>visGroup(e.c)===g);return l.length?`<section class="vs-g"><h3>${label} <span>${l.reduce((a,e)=>a+e.q,0)}</span></h3><div class="vs-row">${l.map(stack).join("")}</div></section>`:""}).join("");
    host.innerHTML=`<div class="ps-top"><div><h2>${esc(d.name||"Untitled deck")}</h2><p>Crystal Quest · ${deckTotal(d)} cards · Deck Forge</p></div>
      <div class="ps-me"><img src="${ICON_BASE}art/hero-head/${artKey(me.hero.name)}.png?v=${ART_VER}" alt=""><div><b>${esc(me.name)}</b><small>Deck by</small></div></div></div>
      <div class="party ps-party">${hs.map((h,i)=>`<div class="slot full hero-full hero-dig" style="--cc:${cc(h.cls)};--ci:${ci(h.cls)}">${heroDigitalHTML(h,(i+1)+" · "+["LEAD","CENTER","CLOSER"][i])}</div>`).join("")}</div>
      ${groups}<p class="ps-foot">jonathandmedina.github.io/CQ-Deckbuilder</p>`;
    document.body.appendChild(host);
    await Promise.all([...host.querySelectorAll("img")].map(im=>im.complete?0:new Promise(r=>{im.onload=im.onerror=r})));
    if(SKIN==="art")fitArt(host);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const blob=await window.htmlToImage.toBlob(host,{pixelRatio:1,cacheBust:false,backgroundColor:"#120a07",style:{position:"static",left:"0",top:"0"}});
    host.remove();busy(false);await offer(safeName(d.name||"deck")+"_deck.png",blob);
  }catch(e){host.remove();busy(false);console.error(e);toast("Couldn't draw the deck image. Try again.")}}
function fitLine(x,t,X,Y,w){let f=x.font;let px=parseInt(/(\d+)px/.exec(f)[1],10);while(px>12&&x.measureText(t).width>w){px--;x.font=f.replace(/\d+px/,px+"px")}x.fillText(t,X,Y)}
/* ---------- best decks (win rates from finished Play-tab games) ---------- */
const BEST_MIN_GAMES=5,BEST_MIN_PCT=60;
async function loadBest(){if(!SB){S.best={at:Date.now(),rows:[],err:"off"};render();return}
  S.best=Object.assign({},S.best||{},{loading:true,at:Date.now()});
  const{data,error}=await SB.from("deck_leaderboard").select("*").gt("win_pct",BEST_MIN_PCT).order("win_pct",{ascending:false}).order("games",{ascending:false}).limit(200);
  S.best={at:Date.now(),rows:error?[]:(data||[]),err:error?error.message:null,loading:false};if(S.view==="best")render()}
function bestDeck(r){const d={id:"best:"+r.deck_key,name:r.deck_name||"Untitled deck",heroes:(r.heroes||[]).slice(0,3),cards:{...(r.cards||{})}};fixRenames(d);return d}
/* update 27: Decklists show the deck's three Heroes as pixel face avatars, with the class icon and Hero name under each (click to inspect) */
function deckFacesHTML(hs){return`<div class="dl-faces">${hs.map(h=>`<button type="button" class="dl-face" style="--cc:${cc(h.cls)}" data-act="inspect" data-id="${esc(h.id)}" title="${esc(h.name)} · ${esc(h.cls)} Hero">
  <span class="dl-av"><img src="${ICON_BASE}art/hero-pix/${artKey(h.name)}-pix.png?v=${ART_VER}" alt="" width="207" height="167" loading="lazy" decoding="async"></span>
  <span class="dl-fn"><img class="dl-ci" src="${ICON_BASE}ico-${String(h.cls||"generic").toLowerCase()}.png" alt="${esc(h.cls)}" width="16" height="16"><span>${esc(h.name)}</span></span></button>`).join("")}</div>`}
function bestCard(r,rank){const d=bestDeck(r);const hs=d.heroes.map(h=>BYID.get(h)).filter(Boolean);
  const players=(r.players||[]).filter(Boolean);const pl=players.slice(0,3).map(esc).join(", ")+(players.length>3?` +${players.length-3} more`:"");
  return`<article class="deck best">
    <div class="best-h">${rank?`<span class="rank">#${rank}</span>`:""}<h3>${esc(d.name)}</h3><span class="pct" title="Win percentage">${Number(r.win_pct).toFixed(0)}%</span></div>
    ${deckFacesHTML(hs)}
    <div class="best-rec"><b>${r.wins}–${r.losses}${r.draws?`–${r.draws}`:""}</b> in ${r.games} game${r.games===1?"":"s"} · vs AI ${r.ai_wins}/${r.ai_games} · online ${r.online_wins}/${r.online_games}</div>
    <div class="note">Played by ${pl||"Guest"} · last game ${esc(new Date(r.last_played).toLocaleDateString())}</div>
    <div class="actions"><button type="button" class="btn sm" data-act="best-view" data-id="${esc(r.deck_key)}">View list</button><button type="button" class="btn sm primary" data-act="best-open" data-id="${esc(r.deck_key)}">Open in Deck Builder</button></div>
  </article>`}
function viewBest(){const b=S.best;
  const head=`<h1>Decklists</h1>${dlTabs("best")}<p class="lede">Decks with the highest win rate in finished Play-tab games (vs AI and online). A deck needs at least ${BEST_MIN_GAMES} games and over ${BEST_MIN_PCT}% wins to be listed. The same Heroes and cards count as one deck, whoever plays it.</p>
    <div class="bar"><button type="button" class="btn sm" data-act="best-refresh">Refresh</button><a class="btn sm" href="#play">Play a game</a></div>`;
  if(!SB)return head+`<div class="empty">Win tracking needs the site's account service, which isn't reachable right now.</div>`;
  if(!b||b.loading&&!b.rows)return head+`<div class="empty">Loading results…</div>`;
  if(b.err)return head+`<div class="empty">Couldn't load results: ${esc(b.err)}</div>`;
  const top=b.rows.filter(r=>showRow(r)&&r.games>=BEST_MIN_GAMES),soon=b.rows.filter(r=>showRow(r)&&r.games<BEST_MIN_GAMES);
  return head+(top.length?`<div class="decks">${top.map((r,i)=>bestCard(r,i+1)).join("")}</div>`:`<div class="empty">No deck has ${BEST_MIN_GAMES}+ games above ${BEST_MIN_PCT}% yet. Finish games in the Play tab to fill this list.</div>`)
    +(soon.length?`<h2 style="margin-top:28px">On the rise</h2><p class="lede">Over ${BEST_MIN_PCT}% wins but fewer than ${BEST_MIN_GAMES} games so far.</p><div class="decks">${soon.slice(0,24).map(r=>bestCard(r,0)).join("")}</div>`:"")}
/* ---------- Decklists: Community Decks (decks players share) + recently played decks ----------
   Supabase table community_decks (see "Community Decks SQL" in the project). Anyone can read; signed-in players add, update or remove their own. */
function dlTabs(on){return`<div class="dl-tabs" role="tablist" aria-label="Decklists"><a role="tab" href="#best" class="btn sm${on==="best"?" on":""}" aria-selected="${on==="best"}">Best Decks</a><a role="tab" href="#community" class="btn sm${on==="community"?" on":""}" aria-selected="${on==="community"}">Community Decks</a></div>`}
async function loadCommunity(){if(!SB){S.comm={at:Date.now(),rows:[],recent:[],err:"off"};render();return}
  S.comm=Object.assign({},S.comm||{},{loading:true,at:Date.now()});
  const[c,r]=await Promise.all([SB.from("community_decks").select("id,user_id,deck_id,name,author,heroes,cards,created_at,updated_at").order("updated_at",{ascending:false}).limit(200),
    SB.from("deck_leaderboard").select("*").order("last_played",{ascending:false}).limit(24)]);
  S.comm={at:Date.now(),rows:c.error?[]:(c.data||[]),err:c.error?c.error.message:null,recent:r.error?[]:(r.data||[]),loading:false};
  if(S.uid&&!c.error){S.commMine=new Map(S.comm.rows.filter(x=>x.user_id===S.uid).map(x=>[x.deck_id,x.id]))}
  if(S.view==="community"||S.view==="decks")render()}
async function loadMineShared(){if(!SB||!S.uid)return;const{data,error}=await SB.from("community_decks").select("id,deck_id").eq("user_id",S.uid);
  S.commMine=new Map(error?[]:(data||[]).map(x=>[x.deck_id,x.id]));S.commErr=error?error.message:null;if(S.view==="decks")render()}
function commDeck(r){const d={id:"comm:"+r.id,name:r.name||"Untitled deck",heroes:(r.heroes||[]).slice(0,3),cards:{...(r.cards||{})}};fixRenames(d);return d}
function commCard(r){const d=commDeck(r);const hs=d.heroes.map(h=>BYID.get(h)).filter(Boolean);const mine=S.uid&&r.user_id===S.uid;
  return`<article class="deck best comm">
    <div class="best-h"><h3>${esc(d.name)}</h3>${mine?'<span class="tag-mine">Yours</span>':""}</div>
    ${deckFacesHTML(hs)}
    <div class="note">Shared by ${esc(r.author||"Player")} · ${esc(new Date(r.updated_at||r.created_at).toLocaleDateString())}</div>
    <div class="actions"><button type="button" class="btn sm" data-act="comm-view" data-id="${esc(r.id)}">View list</button><button type="button" class="btn sm primary" data-act="comm-open" data-id="${esc(r.id)}">Open in Deck Builder</button>${mine?`<button type="button" class="btn sm danger" data-act="comm-del" data-id="${esc(r.id)}">Remove</button>`:""}</div>
  </article>`}
function viewCommunity(){const c=S.comm;
  const head=`<h1>Decklists</h1>${dlTabs("community")}<p class="lede">Decks shared by players. ${S.uid?"Share one of yours from My Decks with <b>Share to community</b>.":SB?'<a href="#account">Sign in</a> to share your own decks from My Decks.':""}</p>
    <div class="bar"><button type="button" class="btn sm" data-act="comm-refresh">Refresh</button><a class="btn sm" href="#decks">My Decks</a></div>`;
  if(!SB)return head+`<div class="empty">Community decks need the site's account service, which isn't reachable right now.</div>`;
  if(!c||c.loading&&!c.rows)return head+`<div class="empty">Loading decks…</div>`;
  const shared=c.err?`<div class="empty">Community decks aren't available yet${/community_decks/.test(c.err)?" (the site's database needs a quick update)":`: ${esc(c.err)}`}.</div>`
    :c.rows.filter(showRow).length?`<div class="decks">${c.rows.filter(showRow).map(commCard).join("")}</div>`:`<div class="empty">No shared decks yet. Be the first: open My Decks and press Share to community.</div>`;
  const recentRows=(c.recent||[]).filter(showRow);const recent=recentRows.length?`<h2 style="margin-top:28px">Recently played</h2><p class="lede">Decks from the latest finished Play-tab games, any win rate.</p><div class="decks">${recentRows.map(r=>bestCard(r,0)).join("")}</div>`:"";
  return head+shared+recent}
function commListModal(r){bestListModal(Object.assign({},r,{_comm:true}))}
async function commShare(d){if(isTrialsDeck(d)){toast("Trials parties can't be shared yet.");return}if(!SB||!S.uid){toast("Sign in to share decks.");return}
  if(issues(d).length||needsRebuild(d)){toast("Only legal decks can be shared. Fix this deck's issues first.");return}
  const row={user_id:S.uid,deck_id:String(d.id),name:(d.name||"Untitled deck").slice(0,80),author:((S.me&&S.me.name)||"Player").slice(0,40),heroes:hcompact(d.heroes).slice(0,3),cards:d.cards,updated_at:new Date().toISOString()};
  const{data,error}=await SB.from("community_decks").upsert(row,{onConflict:"user_id,deck_id"}).select("id,deck_id").single();
  if(error){toast(/community_decks/.test(error.message)?"Sharing isn't switched on yet (the site's database needs a quick update).":"Couldn't share the deck: "+error.message);return}
  S.commMine=S.commMine||new Map();const was=S.commMine.has(data.deck_id);S.commMine.set(data.deck_id,data.id);S.comm=null;toast(was?"Community copy updated.":"Shared to Community Decks.");render()}
async function commUnshare(rowId){if(!SB||!S.uid)return;const{error}=await SB.from("community_decks").delete().eq("id",rowId);
  if(error){toast("Couldn't remove it: "+error.message);return}
  if(S.commMine)for(const[k,v]of S.commMine)if(v===rowId)S.commMine.delete(k);if(S.comm&&S.comm.rows)S.comm.rows=S.comm.rows.filter(x=>x.id!==rowId);toast("Removed from Community Decks.");render()}
function bestListModal(r){const d=r._comm?commDeck(r):bestDeck(r);const l=$("#layer");const m=document.createElement("div");m.className="modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label",d.name);
  const rows=Object.entries(d.cards).map(([id,q])=>({c:BYID.get(id),id,q})).sort((a,b)=>(a.c?costNum(a.c):99)-(b.c?costNum(b.c):99)||a.id.localeCompare(b.id));
  m.innerHTML=`<div class="box"><h2>${esc(d.name)}</h2><p class="note">${r._comm?`Shared by ${esc(r.author||"Player")}`:`${r.wins}–${r.losses}${r.draws?`–${r.draws}`:""} · ${Number(r.win_pct).toFixed(1)}% wins in ${r.games} games`}</p>
    <div class="dl"><h4><span>Heroes</span><span>3</span></h4><ul>${d.heroes.map(h=>{const c=BYID.get(h);return c?`<li style="--cc:${cc(c.cls)};--ci:${ci(c.cls)}"><i class="dot"></i><button type="button" class="n nlink" data-act="inspect" data-id="${esc(c.id)}">${esc(c.name)}</button></li>`:""}).join("")}</ul>
    <h4><span>Cards</span><span>${rows.reduce((a,e)=>a+e.q,0)}</span></h4><ul>${rows.map(e=>`<li style="--cc:${cc(e.c?e.c.cls:"")};--ci:${ci(e.c?e.c.cls:"")}"><span class="q">${e.q}</span><i class="dot"></i>${e.c?`<button type="button" class="n nlink" data-act="inspect" data-id="${esc(e.id)}">${esc(e.c.name)}</button><span class="cst">${esc(e.c.cost)}</span>`:`<span class="n bad">${esc(hiddenLabel(e.id))}</span>`}</li>`).join("")}</ul></div>
    <div class="actions"><button type="button" class="btn primary" data-act="${r._comm?"comm-open":"best-open"}" data-id="${esc(r._comm?r.id:r.deck_key)}">Open in Deck Builder</button><button type="button" class="btn" data-act="close">Close</button></div></div>`;
  m.addEventListener("click",e=>{if(e.target===m)m.remove()});l.appendChild(m)}
function confirmReplace(){return window.confirm("Replace your unsaved draft in the Deck Builder with this deck?")}
function viewDecks(){
  const ds=S.decks;if(S.uid&&SB&&S.commMine===undefined){S.commMine=null;loadMineShared()}
  return`<h1>My Decks</h1>
  <p class="lede">${S.mode==="account"?`Signed in${S.me&&S.me.name?" as "+esc(S.me.name):""}. Decks you save are stored in your account and follow you to any device.`:"You're browsing as a guest, so decks are saved in this browser only."+(SB?' <a href="#account">Create a free account</a> to keep decks on any device.':"")}</p>
  <div class="bar"><button type="button" class="btn primary" data-act="new-deck-go">New deck</button>${trialsOn()?`<button type="button" class="btn" data-act="new-party" title="A 2-Hero party for the co-op Trials">New Trials party</button>`:""}
  ${S.mode==="account"&&localDecks().length?`<button type="button" class="btn" data-act="migrate">Move ${localDecks().length} browser deck(s) into my account</button>`:""}</div>
  <div class="decks">${ds.length?ds.map(d=>{const iss=issues(d);const t=deckTotal(d);const party=isTrialsDeck(d);
    /* without Trials access an owned Trials party shows no names at all */
    if(party&&!trialsOn())return`<div class="deck"><h3>A deck you don't have access to</h3><div class="actions"><button type="button" class="btn sm danger" data-act="del" data-id="${d.id}">Delete</button></div>
      <div class="actions" data-confirm="${d.id}" hidden><span class="note">Delete this deck for good?</span><button type="button" class="btn sm danger" data-act="del-yes" data-id="${d.id}">Delete</button><button type="button" class="btn sm" data-act="del-no" data-id="${d.id}">Keep</button></div></div>`;
    return`<div class="deck"><h3>${esc(d.name)}${party?' <span class="tag party-tag">Trials party</span>':""}</h3>
    ${(hs=>hs.length?deckFacesHTML(hs):'<div class="pips"><span class="note">No Heroes yet</span></div>')(d.heroes.map(h=>BYID.get(h)).filter(Boolean))}
    <div class="note">${t}/${DECK_SIZE} cards${d.updated?" · saved "+new Date(d.updated).toLocaleDateString():""}</div>
    <span class="status ${iss.length?"no":"ok"}">${needsRebuild(d)?"Needs a rebuild (decks are now 50 cards)":iss.length?iss.length+" issue"+(iss.length>1?"s":""):"Legal deck"}</span>
    <div class="actions">${needsRebuild(d)?`<button type="button" class="btn sm primary" data-act="rb-one" data-id="${d.id}">Auto Rebuild</button>`:""}<button type="button" class="btn sm${needsRebuild(d)?"":" primary"}" data-act="open" data-id="${d.id}">Edit</button>
      <button type="button" class="btn sm" data-act="hand" data-src="${d.id}">Test hand</button>
      <button type="button" class="btn sm" data-act="pnp" data-src="${d.id}">Print &amp; Play</button>
      <button type="button" class="btn sm" data-act="tts" data-src="${d.id}">TTS</button>
      <button type="button" class="btn sm" data-act="share" data-src="${d.id}">Share</button>
      <button type="button" class="btn sm" data-act="visual" data-src="${d.id}">Visual View</button>
      <button type="button" class="btn sm" data-act="deckpng" data-src="${d.id}">Deck image</button>
      <button type="button" class="btn sm" data-act="decklog" data-src="${d.id}">Log${d.log&&d.log.length?` (${d.log.length})`:""}</button>
      ${S.uid&&SB&&!party?(S.commMine&&S.commMine.has(String(d.id))?`<button type="button" class="btn sm" data-act="comm-share" data-id="${d.id}" title="Send your latest changes to the community copy">Update community</button><button type="button" class="btn sm" data-act="comm-unshare" data-id="${d.id}">Unshare</button>`:`<button type="button" class="btn sm" data-act="comm-share" data-id="${d.id}" title="List this deck on Decklists → Community Decks">Share to community</button>`):""}
      ${window.CQProf?window.CQProf.privButton(d):""}
      <button type="button" class="btn sm" data-act="dup" data-id="${d.id}">Duplicate</button>
      <button type="button" class="btn sm danger" data-act="del" data-id="${d.id}">Delete</button></div>
    <div class="actions" data-confirm="${d.id}" hidden><span class="note">Delete this deck for good?</span><button type="button" class="btn sm danger" data-act="del-yes" data-id="${d.id}">Delete</button><button type="button" class="btn sm" data-act="del-no" data-id="${d.id}">Keep</button></div>
    </div>`}).join(""):`<div class="empty">No saved decks yet. Build one in the Deck Builder and press Save deck.</div>`}</div>
  <div class="panel"><h2>Import a deck list</h2>
  <p class="note">Paste a list made with Copy list. Format: a "Heroes:" line with three names, then one card per line like "2 Jab".</p>
  <textarea id="import-text" placeholder="# My deck&#10;Heroes: Ember Mage, Dawn Priest, Night Stalker&#10;2 Flame Jab&#10;1 Aura Crystal"></textarea>
  <div class="actions"><button type="button" class="btn" data-act="import">Import into builder</button></div></div>`;
}
/* ---------- art ratings (Card Art theme only: zoomed card view + card grid tiles) ----------
   Anyone can rate; one vote per browser (random voter id in localStorage "cq.voter").
   Supabase: table art_votes is locked (RLS, no policies); RPCs get_art_ratings (all cards, one call per page load),
   get_art_rating (one card, refreshed when a card is zoomed) and cast_art_vote do all reads and writes.
   If the SQL isn't installed the first call fails and every rating bar stays hidden. */
const ART_VOTER=(()=>{try{let v=localStorage.getItem("cq.voter");if(!v||!/^[0-9a-f-]{36}$/i.test(v)){
  if(crypto.randomUUID)v=crypto.randomUUID();else{const b=new Uint8Array(16);crypto.getRandomValues(b);b[6]=b[6]&15|64;b[8]=b[8]&63|128;const h=[...b].map(x=>x.toString(16).padStart(2,"0")).join("");v=`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`}
  localStorage.setItem("cq.voter",v)}return v}catch(e){return null}})();
const artRateKey=c=>c.kind+":"+artKey(c.name);
const ART_RATE=new Map(); // key -> {ups,downs,mine}; cards with no votes have no entry
let ART_RATE_OK=null;     // null = loading, true = ratings available, false = not installed / offline
const ZERO_RATE={ups:0,downs:0,mine:0};
const THUMB='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2 21h4V9H2v12zm20-11a2 2 0 0 0-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1.1L13.2 1 6.6 7.6c-.4.4-.6.9-.6 1.4V19a2 2 0 0 0 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7.1c.1-.2.2-.5.2-.7v-2z"/></svg>';
const canRate=c=>!!(SB&&ART_VOTER&&c&&hasArt(c)&&ownArt(c)&&ART_RATE_OK!==false);
const rateText=(r,short)=>{const n=r.ups+r.downs;return n?`<b>${Math.round(r.ups*100/n)}%</b>${short?` <span class="ar-n">(${n})</span>`:` liked · ${n} ${n===1?"vote":"votes"}`}`:(short?`<span class="ar-n">No votes</span>`:"No ratings yet")};
/* zoomed view: real buttons */
function artRateHTML(c){
  if(!canRate(c))return"";const k=artRateKey(c),r=ART_RATE.get(k)||ZERO_RATE;
  return`<div class="art-rate" data-key="${esc(k)}"${ART_RATE_OK?"":" hidden"}><span class="ar-l">Rate the art</span>
    <button type="button" class="ar-b ar-up" data-act="art-vote" data-v="1" aria-pressed="${r.mine===1}" title="I like this art" aria-label="Thumbs up the art">${THUMB}</button>
    <button type="button" class="ar-b ar-down" data-act="art-vote" data-v="-1" aria-pressed="${r.mine===-1}" title="Not a fan of this art" aria-label="Thumbs down the art">${THUMB}</button>
    <span class="ar-s" aria-live="polite">${rateText(r)}</span></div>`}
function paintArtRate(el,r){
  el.hidden=false;
  el.querySelector(".ar-up").setAttribute("aria-pressed",r.mine===1?"true":"false");
  el.querySelector(".ar-down").setAttribute("aria-pressed",r.mine===-1?"true":"false");
  el.querySelector(".ar-s").innerHTML=rateText(r);
}
function paintArtKey(k){const r=ART_RATE.get(k)||ZERO_RATE;document.querySelectorAll(".art-rate").forEach(el=>{if(el.dataset.key===k)paintArtRate(el,r)})}
function artRateOff(){ART_RATE_OK=false;document.querySelectorAll(".art-rate").forEach(el=>el.remove())}
const artRow=d=>{const r=Array.isArray(d)?d[0]:d;return r?{ups:+r.ups||0,downs:+r.downs||0,mine:+r.mine||0}:null};
async function loadAllArtRates(){
  if(!SB||!ART_VOTER||SKIN!=="art")return;
  try{const{data,error}=await SB.rpc("get_art_ratings",{p_voter:ART_VOTER});
    if(error||!Array.isArray(data)){artRateOff();return}
    ART_RATE.clear();data.forEach(r=>ART_RATE.set(r.card_key,{ups:+r.ups||0,downs:+r.downs||0,mine:+r.mine||0}));
    ART_RATE_OK=true;document.querySelectorAll(".art-rate").forEach(el=>paintArtRate(el,ART_RATE.get(el.dataset.key)||ZERO_RATE))}
  catch(e){artRateOff()}
}
async function loadArtRate(m){
  const el=m&&m.querySelector(".art-rate");if(!el||ART_RATE_OK===false)return;const k=el.dataset.key;
  try{const{data,error}=await SB.rpc("get_art_rating",{p_card:k,p_voter:ART_VOTER});
    const r=!error&&artRow(data);if(!r)return;ART_RATE.set(k,r);if(ART_RATE_OK)paintArtKey(k);else if(el.isConnected)paintArtRate(el,r)}catch(e){}
}
const ART_BUSY=new Set();
async function artVote(b){
  const el=b.closest(".art-rate");if(!el)return;const k=el.dataset.key;if(ART_BUSY.has(k))return;
  const v=+b.dataset.v;
  const old=ART_RATE.get(k)||ZERO_RATE;const want=v===old.mine?0:v;
  ART_BUSY.add(k);ART_RATE.set(k,{ups:old.ups-(old.mine===1)+(want===1),downs:old.downs-(old.mine===-1)+(want===-1),mine:want});paintArtKey(k);
  try{const{data,error}=await SB.rpc("cast_art_vote",{p_card:k,p_voter:ART_VOTER,p_vote:want});
    const x=!error&&artRow(data);if(!x)throw error||new Error("no data");ART_RATE.set(k,x)}
  catch(e){ART_RATE.set(k,old);toast("Couldn't save your art rating. Try again.")}
  finally{ART_BUSY.delete(k);paintArtKey(k)}
}
loadAllArtRates();
function inspect(c){
  const d=S.deck,can=c.kind!=="hero"&&c.kind!=="token"&&HN(d)===3&&allowed(c,d);
  const q=d.cards[c.id]||0;
  const l=$("#layer");const m=document.createElement("div");m.className="modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label",c.name);
  m.innerHTML=`<div class="box">${cardHTML(c,{nozoom:1})}${artRateHTML(c)}<div class="actions">${can?`<button type="button" class="btn primary" data-act="inc-close" data-id="${esc(c.id)}" ${q>=maxCopies(c)?"disabled":""}>Add to ${esc(d.name)} (${q}/${maxCopies(c)})</button>`:""}<button type="button" class="btn" data-act="close">Close</button></div>${c.kind==="token"?`<p class="note">Token. Made by ${esc(c.madeBy)}. Tokens are created during play and don't count toward your deck.</p>`:""}${c.kind!=="hero"&&c.kind!=="token"&&!can?`<p class="note">${HN(d)<3?"Choose three Heroes in the Deck Builder to start adding cards.":"Your current party can't play this card."}</p>`:""}</div>`;
  m.addEventListener("click",e=>{if(e.target===m)m.remove()});
  l.appendChild(m);m.querySelector("[data-act=close]").focus();loadArtRate(m);
}

/* ---------- test draw: starting hand + draw a card ---------- */
function rint(n){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}catch(e){return Math.floor(Math.random()*n)}}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rint(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
const HAND_SIZE=4;
function libraryOf(d){const l=[];for(const[id,q]of Object.entries(d.cards)){if(BYID.get(id))for(let i=0;i<q;i++)l.push(id)}return l}
function dealHand(d){const lib=shuffle(libraryOf(d));const hand=lib.splice(0,HAND_SIZE);
  S.hand={d,lib,hand,mull:false,extra:0,fresh:new Set()}}
function handAura(d){return d.heroes.map(h=>BYID.get(h)).filter(Boolean).reduce((a,h)=>a+(+h.aura||0),0)}
function handBody(){
  const H=S.hand,d=H.d,total=deckTotal(d);
  const heroes=d.heroes.map(h=>BYID.get(h)).filter(Boolean);
  const canMull=!H.mull&&H.extra===0;
  return`<div class="hand-h"><div class="hand-t"><h2>${H.extra?"Hand":"Starting hand"}</h2><p class="note">${esc(d.name)}${heroes.length?" · "+heroes.map(h=>esc(h.name)).join(", "):""}</p></div>
    <div class="hand-r">${heroes.length?`<div class="aura-box" title="${esc(heroes.map(h=>h.name+" "+(+h.aura||0)).join(", "))}"><span class="aura-gem" aria-hidden="true"></span><div><b>${handAura(d)}</b><small>Starting Aura</small><span class="aura-src">${heroes.map(h=>esc(String(+h.aura||0))).join(" + ")}</span></div></div>`:""}
    <button type="button" class="btn sm" data-act="close">Close</button></div></div>
  ${total<DECK_SIZE?`<p class="note warn">This deck has ${total} cards, under the ${DECK_SIZE}-card minimum, so the odds won't match a legal deck.</p>`:""}
  <div class="hand-stats"><span class="pill">In hand <b>${H.hand.length}</b></span><span class="pill">Library <b>${H.lib.length}</b></span>${H.extra?`<span class="pill">Drawn <b>${H.extra}</b></span>`:""}${H.mull?`<span class="pill">Mulliganed</span>`:""}
    <span class="pill">Aura costs <b>${H.hand.map(id=>BYID.get(id).cost).sort((a,b)=>costNum({cost:a})-costNum({cost:b})).map(esc).join(", ")||"—"}</b></span></div>
  <div class="actions">
    <button type="button" class="btn primary" data-act="hand-draw" ${H.lib.length?"":"disabled"}>Draw a card</button>
    <button type="button" class="btn" data-act="hand-mull" ${canMull?"":"disabled"} title="Once, before you draw any extra cards">Mulligan</button>
    <button type="button" class="btn" data-act="hand-new">New hand</button>
  </div>
  <p class="note">${H.lib.length?(canMull?"Setup: draw 4, then you may mulligan once (shuffle your hand back and draw 4 new cards). Draw a card works like the Dawn draw.":"Draw a card works like the Dawn draw. Press D to draw, N for a new hand."):"Your library is empty."}</p>
  <div class="grid hand-grid">${H.hand.map((id,i)=>cardHTML(BYID.get(id),{button:"inspect-hand",slot:H.fresh.has(i)?"NEW":""})).join("")}</div>`;
}
function renderHand(){const m=document.getElementById("handm");if(!m||!S.hand)return;m.querySelector(".box").innerHTML=handBody()}
function openHand(d){
  if(!d)return;const n=deckTotal(d);
  if(n<HAND_SIZE){toast(`Add at least ${HAND_SIZE} cards to draw a hand.`);return}
  dealHand(d);
  document.getElementById("handm")?.remove();
  const m=document.createElement("div");m.className="modal";m.id="handm";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label","Test hand");
  m.innerHTML=`<div class="box wide"></div>`;m.addEventListener("click",e=>{if(e.target===m)m.remove()});
  $("#layer").appendChild(m);renderHand();m.querySelector("[data-act=hand-draw]")?.focus();
}
function handDraw(){const H=S.hand;if(!H||!H.lib.length){toast("Your library is empty.");return}
  H.hand.push(H.lib.shift());H.extra++;H.fresh=new Set([H.hand.length-1]);renderHand()}
function handMull(){const H=S.hand;if(!H||H.mull||H.extra)return;
  const lib=shuffle(H.lib.concat(H.hand));H.hand=lib.splice(0,HAND_SIZE);H.lib=lib;H.mull=true;H.fresh=new Set();renderHand();toast("Mulligan taken. This is your hand.")}

/* ---------- deck list text ---------- */
function deckText(d,withTokens=true){
  const lines=[`# ${d.name}`,`Heroes: ${d.heroes.map(h=>BYID.get(h)?.name||h).join(", ")}`];
  const e=Object.entries(d.cards).filter(([,q])=>q>0).sort((a,b)=>{const A=BYID.get(a[0]),B=BYID.get(b[0]);return(A&&B?clsOrder(A.cls)-clsOrder(B.cls)||costNum(A)-costNum(B):0)||a[0].localeCompare(b[0])});
  for(const[id,q]of e)lines.push(`${q} ${BYID.get(id)?.name||hiddenLabel(id)}`);
  const tk=tokensFor(d);if(withTokens&&tk.length)lines.push(`Tokens: ${tk.map(t=>t.q+" "+t.c.name).join(", ")}`);
  return lines.join("\n");
}
function parseDeck(txt){
  const d=blankDeck();const miss=[];
  const norm=s=>s.trim().toLowerCase().replace(/[“”]/g,'"');
  const find0=(n,pool)=>pool.find(c=>norm(c.name)===norm(n))||pool.find(c=>sortName(c.name)===norm(n).replace(/^"|"$/g,""));
  const find=(n,pool)=>{const c=find0(n,pool);if(c)return c;const old=Object.keys(RENAMES).find(k=>norm(k)===norm(n)||sortName(k)===norm(n).replace(/^"|"$/g,""));return old?find0(RENAMES[old],pool):undefined};
  for(let line of txt.split(/\r?\n/)){line=line.trim();if(!line)continue;
    if(line.startsWith("#")){d.name=line.replace(/^#+\s*/,"")||d.name;continue}
    if(/^tokens?\s*:/i.test(line))continue;
    const hm=line.match(/^heroes?\s*:\s*(.*)$/i);
    if(hm){/* Hero names can contain a comma ("Jorkev, the Pillager"): rejoin a part with the next one when that makes a Hero name */
      const parts=hm[1].split(","),names=[];for(let i=0;i<parts.length;i++){let n=parts[i];if(!find(n,HEROES)&&i+1<parts.length&&find(n+","+parts[i+1],HEROES)){n=n+","+parts[i+1];i++}names.push(n)}
      for(const n of names){if(!n.trim())continue;const h=find(n,HEROES);if(h&&HN(d)<3&&!d.heroes.includes(h.id)){const e=d.heroes.indexOf(null);if(e>=0)d.heroes[e]=h.id;else d.heroes.push(h.id)}else if(!h)miss.push(n.trim())}continue}
    const m=line.match(/^(\d+)\s*x?\s+(.+)$/i);const q=m?+m[1]:1,n=m?m[2]:line;
    const c=find(n,CARDS);if(c)d.cards[c.id]=(d.cards[c.id]||0)+q;else miss.push(n)}
  return{d,miss};
}

/* ---------- canvas card renderer (exports) ---------- */
let fontsReady=null;
function loadFonts(){return fontsReady||(fontsReady=Promise.all(['700 40px "Alegreya SC"','800 40px "Alegreya SC"','400 30px "Alegreya Sans"','700 30px "Alegreya Sans"','italic 400 30px "Alegreya Sans"'].map(f=>document.fonts.load(f).catch(()=>null))))}
const F_DISP='"Alegreya SC", Georgia, serif',F_BODY='"Alegreya Sans", "Segoe UI", sans-serif';
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function hex(ctx,cx,cy,r){ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2;ctx.lineTo(cx+r*Math.cos(a)*0.88,cy+r*Math.sin(a))}ctx.closePath()}
function fitText(ctx,text,font,size,maxW,weight){let s=size;do{ctx.font=`${weight} ${s}px ${font}`;if(ctx.measureText(text).width<=maxW)break;s-=1}while(s>10);return s}
function layoutRules(ctx,text,w,size){
  ctx.font=`400 ${size}px ${F_BODY}`;
  const lh=size*1.28,paraGap=size*0.45,lines=[];
  for(const para of text.split("\n").filter(p=>p.trim())){
    const words=para.replace(/\{A\}/g,"◆").split(/\s+/).filter(Boolean);
    let line=[],lw=0;
    for(const wd of words){
      const pill=/^\{L(\d)\}$/.exec(wd);
      const ww=pill?(ctx.measureText("LV "+pill[1]).width+size*0.6):ctx.measureText(wd).width;
      const sp=line.length?ctx.measureText(" ").width:0;
      if(line.length&&lw+sp+ww>w){lines.push({items:line});line=[];lw=0}
      line.push({t:pill?"LV "+pill[1]:wd,pill:!!pill,w:ww});lw+=(line.length>1?ctx.measureText(" ").width:0)+ww;
    }
    if(line.length)lines.push({items:line});
    lines.push({gap:true});
  }
  if(lines.length&&lines[lines.length-1].gap)lines.pop();
  const h=lines.reduce((a,l)=>a+(l.gap?paraGap:lh),0);
  return{lines,h,lh,paraGap};
}
function drawCard(ctx,c,W,H){
  const s=W/750;ctx.save();ctx.textBaseline="alphabetic";
  const col=CLASS_COLOR_CLEAN[c.cls]||"#777",tcol=CLASS_TEXT_CLEAN[c.cls]||"#FFFFFF";
  ctx.fillStyle=col;rr(ctx,0,0,W,H,34*s);ctx.fill();
  const ix=24*s,iy=24*s,iw=W-48*s,ih=H-48*s;
  ctx.fillStyle="#FBFBF8";rr(ctx,ix,iy,iw,ih,18*s);ctx.fill();
  // header band
  const hb=120*s;ctx.save();rr(ctx,ix,iy,iw,ih,18*s);ctx.clip();ctx.fillStyle=col;ctx.fillRect(ix,iy,iw,hb);ctx.restore();
  const gemR=52*s,gem=hasGem(c);
  const nameMax=iw-40*s-(gem?gemR*2+10*s:0);
  const nm=c.name+(c.face==="up"?" ★":"");ctx.fillStyle=tcol;const ns=fitText(ctx,nm,F_DISP,58*s,nameMax,700);ctx.font=`700 ${ns}px ${F_DISP}`;ctx.fillText(nm,ix+22*s,iy+hb/2+ns*0.34);
  if(gem){const gx=ix+iw-gemR-16*s,gy=iy+hb/2;ctx.fillStyle="#FBFBF8";hex(ctx,gx,gy,gemR);ctx.fill();ctx.strokeStyle="rgba(0,0,0,.25)";ctx.lineWidth=3*s;hex(ctx,gx,gy,gemR-6*s);ctx.stroke();
    ctx.fillStyle="#1C232E";ctx.font=`800 ${52*s}px ${F_DISP}`;ctx.textAlign="center";ctx.fillText(String(c.cost),gx,gy+18*s);ctx.textAlign="left"}
  // type line
  let ty=iy+hb+50*s;ctx.font=`italic 400 ${32*s}px ${F_BODY}`;ctx.fillStyle="#4C5563";
  const tl=c.kind==="hero"?"Hero":c.kind==="token"?"Token — "+c.sub:(c.sup?c.sup+" ":"")+c.type+(c.sub?" — "+c.sub:"");
  ctx.fillText(tl,ix+22*s,ty);ctx.textAlign="right";ctx.font=`700 ${30*s}px ${F_BODY}`;ctx.fillStyle=col==="#D4AE3A"?"#8A6D10":col;ctx.fillText(c.cls.toUpperCase(),ix+iw-22*s,ty);ctx.textAlign="left";
  ctx.strokeStyle="#D9DCD6";ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(ix+22*s,ty+20*s);ctx.lineTo(ix+iw-22*s,ty+20*s);ctx.stroke();
  // footer
  const stats=c.kind==="hero"?[["STR",c.str],["DEF",c.def],["AURA",c.aura],["HP",c.hp]]:c.kind==="token"?tokenStats(c):null;
  const hasFoot=c.kind!=="card"||c.sup==="Legendary";const footH=stats?150*s:(hasFoot?80*s:30*s),footY=iy+ih-footH;
  // rules
  const rx=ix+30*s,rw=iw-60*s,ry=ty+50*s,rh=footY-ry-16*s;
  let size=40*s,L;do{L=layoutRules(ctx,c.rules||"",rw,size);if(L.h<=rh)break;size-=1*s}while(size>16*s);
  let y=ry+L.lh*0.8;ctx.fillStyle="#1C232E";
  for(const ln of L.lines){if(ln.gap){y+=L.paraGap;continue}let x=rx;
    for(const it of ln.items){
      if(it.pill){ctx.fillStyle="#1C232E";rr(ctx,x,y-size*0.85,it.w,size*1.05,6*s);ctx.fill();ctx.fillStyle="#FBFBF8";ctx.font=`700 ${size*0.78}px ${F_BODY}`;ctx.fillText(it.t,x+size*0.3,y-size*0.08);ctx.font=`400 ${size}px ${F_BODY}`;ctx.fillStyle="#1C232E"}
      else{ctx.font=`400 ${size}px ${F_BODY}`;if(it.t.includes("◆")){let xx=x;for(const part of it.t.split(/(◆)/)){if(part==="◆"){ctx.fillStyle="#0E747B";ctx.fillText("◆",xx,y);ctx.fillStyle="#1C232E"}else ctx.fillText(part,xx,y);xx+=ctx.measureText(part).width}}else ctx.fillText(it.t,x,y)}
      x+=it.w+ctx.measureText(" ").width}
    y+=L.lh}
  if(hasFoot){ctx.strokeStyle="#D9DCD6";ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(ix+22*s,footY);ctx.lineTo(ix+iw-22*s,footY);ctx.stroke()}
  if(stats){
    const st=stats,nb=st.length;const bw=(iw-44*s-(nb-1)*14*s)/nb;
    st.forEach(([k,v],i)=>{const bx=ix+22*s+i*(bw+14*s),by=footY+18*s,bh=footH-40*s;ctx.strokeStyle=col;ctx.lineWidth=4*s;rr(ctx,bx,by,bw,bh,12*s);ctx.stroke();
      ctx.textAlign="center";ctx.fillStyle="#1C232E";ctx.font=`800 ${50*s}px ${F_DISP}`;ctx.fillText(String(v),bx+bw/2,by+bh*0.55);ctx.font=`700 ${22*s}px ${F_BODY}`;ctx.fillStyle="#5A6474";ctx.fillText(k,bx+bw/2,by+bh-14*s);ctx.textAlign="left"});
  }else{
    let ft=c.kind==="token"?(c.tkind==="Equipment"?[c.region,"+"+c.str+" STR","Token"].join("  ·  "):"Pillar token"):c.kind==="equip"?[c.region,c.pstr?"+"+c.pstr+" STR":"",c.pdef?"+"+c.pdef+" DEF":"",c.face==="up"?"UPGRADED ("+c.up.cost+" Gold)":(c.up?"Upgrade: "+c.up.cost+" Gold":"")].filter(Boolean).join("  ·  "):isRecipe(c)?(c.face==="up"?[c.up.type==="Equipment"?c.up.region:"",c.pstr?"+"+c.pstr+" STR":"",c.pdef?"+"+c.pdef+" DEF":"","MADE BY "+String(c.backOf||"").toUpperCase()].filter(Boolean).join("  ·  "):(c.sup==="Legendary"?"Legendary · ":"")+"Recipe · sleeve the made side behind it"):(c.sup==="Legendary"?"Legendary · 1 per deck":"");
    ctx.font=`700 ${30*s}px ${F_BODY}`;ctx.fillStyle="#4C5563";ctx.fillText(ft,ix+22*s,footY+50*s);
  }
  ctx.font=`700 ${20*s}px ${F_DISP}`;ctx.fillStyle=tcol;ctx.globalAlpha=.85;ctx.textAlign="center";ctx.fillText("CRYSTAL QUEST",W/2,H-6*s);
  ctx.font=`700 ${19*s}px ${F_BODY}`;ctx.textAlign="right";ctx.fillText("v"+(c.ver||1),W-44*s,H-6*s);ctx.globalAlpha=1;ctx.textAlign="left";
  ctx.restore();
}
function drawBack(ctx,W,H){
  const s=W/750;ctx.save();
  ctx.fillStyle="#14202A";rr(ctx,0,0,W,H,34*s);ctx.fill();
  ctx.strokeStyle="#3BBFC6";ctx.lineWidth=6*s;rr(ctx,30*s,30*s,W-60*s,H-60*s,22*s);ctx.stroke();
  ctx.globalAlpha=.18;ctx.lineWidth=2*s;for(let i=-H;i<W+H;i+=60*s){ctx.beginPath();ctx.moveTo(i,40*s);ctx.lineTo(i+H,H);ctx.stroke();ctx.beginPath();ctx.moveTo(i+H,40*s);ctx.lineTo(i,H);ctx.stroke()}ctx.globalAlpha=1;
  const cx=W/2,cy=H/2;ctx.fillStyle="#14202A";ctx.beginPath();ctx.arc(cx,cy,190*s,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#3BBFC6";ctx.beginPath();ctx.moveTo(cx,cy-150*s);ctx.lineTo(cx+80*s,cy-30*s);ctx.lineTo(cx,cy+150*s);ctx.lineTo(cx-80*s,cy-30*s);ctx.closePath();ctx.fill();
  ctx.fillStyle="#9EE6EA";ctx.beginPath();ctx.moveTo(cx,cy-150*s);ctx.lineTo(cx+80*s,cy-30*s);ctx.lineTo(cx,cy-10*s);ctx.closePath();ctx.fill();
  ctx.fillStyle="#E8F6F7";ctx.textAlign="center";ctx.font=`800 ${64*s}px ${F_DISP}`;ctx.fillText("CRYSTAL",cx,cy-230*s);ctx.fillText("QUEST",cx,cy+270*s);
  ctx.restore();
}
function cardCanvas(c,W,H){const cv=document.createElement("canvas");cv.width=W;cv.height=H;const ctx=cv.getContext("2d");c?drawCard(ctx,c,W,H):drawBack(ctx,W,H);return cv}

/* ---------- exports ---------- */
function deckBySrc(src){return src==="current"?S.deck:S.decks.find(d=>d.id===src)}
const safeName=n=>(n||"deck").replace(/[^\w\- ]+/g,"").trim().replace(/\s+/g,"_")||"deck";
async function offer(filename,data){
  const blob=data instanceof Blob?data:new Blob([data]);const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);toast("Downloaded "+filename);
}
function exportList(d){const l=[];d.heroes.forEach(h=>{const c=BYID.get(h);if(c)l.push(c)});
  Object.entries(d.cards).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([id,q])=>{const c=BYID.get(id);if(c)for(let i=0;i<q;i++)l.push(c)});return l}
/* print tracking: per deck, the version of each card last printed in this browser */
const printKey=d=>"cq.printed."+d.id;
function printRecord(d){return store.get(printKey(d),null)}
function printPlan(d){const rec=printRecord(d);const all=exportList(d);const toks=[];tokensFor(d).forEach(t=>{for(let i=0;i<t.q;i++)toks.push(t.c)});
  if(!rec)return{rec:null,all,toks,upd:null,updToks:null};
  const changed=c=>!(c.id in rec.v)||rec.v[c.id]<(c.ver||1);
  return{rec,all,toks,upd:all.filter(changed),updToks:toks.filter(changed)}}
function choosePrint(d){const p=printPlan(d);const l=$("#layer");const m=document.createElement("div");m.className="modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label","Print and play");
  const names=p.upd?[...new Set([...p.upd,...p.updToks].map(c=>c.name+" v"+(c.ver||1)))]:[];
  m.innerHTML=`<div class="box"><h2>Print &amp; Play</h2><p class="note">Every printed card shows its version (v1, v2…) in the bottom corner.</p>
    <div class="actions" style="flex-direction:column;align-items:stretch">
      <button type="button" class="btn primary" data-act="pnp-go" data-src="${esc(d.id)}" data-v="all">Print the whole deck (${p.all.length+p.toks.length} cards)</button>
      <button type="button" class="btn" data-act="pnp-go" data-src="${esc(d.id)}" data-v="upd" ${p.upd&&p.upd.length+p.updToks.length?"":"disabled"}>Print only updated cards${p.upd?` (${p.upd.length+p.updToks.length})`:""}</button>
    </div>
    <p class="note">${p.rec?`Last printed ${esc(new Date(p.rec.at).toLocaleString())} in this browser. Updated means a newer card version or a card added to the deck since then.${names.length?`<br><b>To print:</b> ${esc(names.join(", "))}`:"<br>Nothing has changed since then."}`:"This deck hasn't been printed from this browser yet, so print the whole deck first."}</p>
    <div class="actions"><button type="button" class="btn" data-act="close">Cancel</button></div></div>`;
  m.addEventListener("click",e=>{if(e.target===m)m.remove()});l.appendChild(m)}
async function exportPnP(d,mode){warnHidden(d);mode=mode||"all";const plan=printPlan(d);
  if(!window.jspdf){toast("The PDF tool didn't load. Reload the page and try again.");return}
  const iss=issues(d);
  busy(true,"Building print & play PDF…");await loadFonts();
  try{
    const{jsPDF}=window.jspdf;const pdf=new jsPDF({unit:"in",format:"letter",orientation:"portrait"});
    // cover page
    pdf.setFont("helvetica","bold");pdf.setFontSize(22);pdf.text(d.name,0.75,1);
    pdf.setFont("helvetica","normal");pdf.setFontSize(11);
    pdf.text(`Crystal Quest deck · ${deckTotal(d)} cards + 3 Heroes · printed ${new Date().toLocaleDateString()}${mode==="upd"?" · UPDATED CARDS ONLY":""}`,0.75,1.3);
    if(iss.length){pdf.setTextColor(170,60,30);pdf.text("Note: "+iss.join(" "),0.75,1.6,{maxWidth:7});pdf.setTextColor(0)}
    let y=2.1;pdf.setFont("helvetica","bold");pdf.text("Heroes",0.75,y);pdf.setFont("helvetica","normal");y+=0.25;
    d.heroes.forEach((h,i)=>{const c=BYID.get(h);pdf.text(`${["Lead","Center","Closer"][i]}: ${c?c.name+" ("+c.cls+")":h}`,0.9,y);y+=0.22});
    y+=0.15;pdf.setFont("helvetica","bold");pdf.text("Deck",0.75,y);pdf.setFont("helvetica","normal");y+=0.25;
    const rows=deckText(d,false).split("\n").slice(2);const half=Math.ceil(rows.length/2);
    rows.forEach((r,i)=>pdf.text(r.replace(/[“”]/g,'"'),i<half?0.9:4.5,y+(i%half)*0.22));
    const toks=tokensFor(d);
    if(toks.length){y+=half*0.22+0.2;pdf.setFont("helvetica","bold");pdf.text("Tokens to print",0.75,y);pdf.setFont("helvetica","normal");y+=0.25;
      const th=Math.ceil(toks.length/2);toks.forEach((t,i)=>pdf.text(`${t.q} ${t.c.name} (${tokenStatLine(t.c)})`,i<th?0.9:4.5,y+(i%th)*0.22));}
    pdf.setFontSize(9);pdf.setTextColor(90);pdf.text("Print at 100% (no scaling). Cut on the gray lines. Cards are 2.5 x 3.5 in, standard sleeve size. Upgraded equipment sides (marked with a star) print after the deck: sleeve each behind its card and flip it when you upgrade at the Blacksmith. The last page has optional card backs.",0.75,10.4,{maxWidth:7});pdf.setTextColor(0);
    const cards=mode==="upd"?plan.upd:plan.all,cache=new Map();
    if(mode==="upd"){pdf.setFontSize(10);pdf.text("This printing only has cards updated since "+(plan.rec?new Date(plan.rec.at).toLocaleDateString():"the last print")+": "+[...new Set([...plan.upd,...plan.updToks].map(c=>c.name+" (v"+(c.ver||1)+")"))].join(", "),0.75,9.6,{maxWidth:7});pdf.setFontSize(11)}
    const W=750,H=1050,mx=0.5,my=0.25,cw=2.5,ch=3.5;
    const img=c=>{if(!cache.has(c.id))cache.set(c.id,cardCanvas(c,W,H).toDataURL("image/jpeg",0.9));return cache.get(c.id)};
    const page=(items,getImg)=>{pdf.addPage();items.forEach((c,i)=>{const x=mx+(i%3)*cw,yy=my+Math.floor(i/3)*ch;pdf.addImage(getImg(c),"JPEG",x,yy,cw,ch,undefined,"FAST")});
      pdf.setDrawColor(170);pdf.setLineWidth(0.005);for(let i=0;i<=3;i++){pdf.line(mx+i*cw,0,mx+i*cw,11);pdf.line(0,my+i*ch,8.5,my+i*ch)}};
    for(let i=0;i<cards.length;i+=9){page(cards.slice(i,i+9),img);await new Promise(r=>setTimeout(r,0))}
    /* upgraded equipment sides (updates 19-20): one per copy, sleeve it behind the card and flip when you upgrade */
    const ups=cards.filter(c=>c.up).map(upFace);
    for(let i=0;i<ups.length;i+=9){page(ups.slice(i,i+9),img);await new Promise(r=>setTimeout(r,0))}
    const tokCards=mode==="upd"?plan.updToks:plan.toks;
    for(let i=0;i<tokCards.length;i+=9){page(tokCards.slice(i,i+9),img);await new Promise(r=>setTimeout(r,0))}
    const back=cardCanvas(null,W,H).toDataURL("image/jpeg",0.9);page(Array(9).fill({}),()=>back);
    const blob=pdf.output("blob");busy(false);
    const rec=mode==="upd"&&plan.rec?{v:{...plan.rec.v}}:{v:{}};[...plan.all,...plan.toks].forEach(c=>{if(mode==="all"||cards.includes(c)||tokCards.includes(c))rec.v[c.id]=c.ver||1});rec.at=Date.now();store.set(printKey(d),rec);
    await offer(safeName(d.name)+(mode==="upd"?"_updated_cards.pdf":"_print_and_play.pdf"),blob);
  }catch(e){busy(false);console.error(e);toast("Couldn't build the PDF. Try again.")}
}
async function exportTTS(d){warnHidden(d);
  if(!window.JSZip){toast("The zip tool didn't load. Reload the page and try again.");return}
  if(HN(d)+Object.keys(d.cards).length===0){toast("This deck is empty.");return}
  busy(true,"Building Tabletop Simulator files…");await loadFonts();
  try{
    const heroes=d.heroes.map(h=>BYID.get(h)).filter(Boolean);
    const uniq=Object.entries(d.cards).filter(([,q])=>q>0).map(([id,q])=>({c:BYID.get(id),q})).filter(x=>x.c).sort((a,b)=>sortName(a.c.name).localeCompare(sortName(b.c.name)));
    const toks=tokensFor(d);
    const faces=[...heroes,...uniq.map(u=>u.c),...toks.map(t=>t.c)];
    const CW=500,CH=700,cols=10,rows=Math.max(2,Math.ceil(faces.length/cols));
    const sheet=document.createElement("canvas");sheet.width=CW*cols;sheet.height=CH*rows;const sx=sheet.getContext("2d");
    sx.fillStyle="#14202A";sx.fillRect(0,0,sheet.width,sheet.height);
    faces.forEach((c,i)=>{sx.save();sx.translate((i%cols)*CW,Math.floor(i/cols)*CH);drawCard(sx,c,CW,CH);sx.restore()});
    const toBlob=cv=>new Promise(r=>cv.toBlob(r,"image/png"));
    const faceBlob=await toBlob(sheet),backBlob=await toBlob(cardCanvas(null,CW,CH));
    const T=(x,z)=>({posX:x,posY:1,posZ:z,rotX:0,rotY:180,rotZ:180,scaleX:1,scaleY:1,scaleZ:1});
    const custom={"1":{FaceURL:"PASTE_FACE_SHEET_URL_HERE",BackURL:"PASTE_CARD_BACK_URL_HERE",NumWidth:cols,NumHeight:rows,BackIsHidden:true,UniqueBack:false,Type:0}};
    const cardObj=(c,idx,x,z)=>({Name:"Card",Transform:T(x,z),Nickname:c.name,Description:rulesPlain(c.rules||""),GMNotes:c.cls+(c.kind==="hero"?" Hero":" "+c.type),CardID:100+idx,SidewaysCard:false,CustomDeck:custom,ColorDiffuse:{r:0.71,g:0.71,b:0.71}});
    const deckObj=(nick,list,x)=>list.length===1?{...cardObj(list[0].c,list[0].i,x,0),Nickname:list[0].c.name}:({Name:"Deck",Transform:T(x,0),Nickname:nick,Description:"",DeckIDs:list.map(o=>100+o.i),CustomDeck:custom,ContainedObjects:list.map(o=>cardObj(o.c,o.i,x,0)),ColorDiffuse:{r:0.71,g:0.71,b:0.71},Locked:false,Grid:true,Snap:true,Autoraise:true,Sticky:true,Tooltip:true,HideWhenFaceDown:true,SidewaysCard:false});
    const heroList=heroes.map((c,i)=>({c,i}));
    const deckList=[];uniq.forEach((u,k)=>{for(let j=0;j<u.q;j++)deckList.push({c:u.c,i:heroes.length+k})});
    const tokList=[];toks.forEach((t,k)=>{for(let j=0;j<t.q;j++)tokList.push({c:t.c,i:heroes.length+uniq.length+k})});
    const objs=[];if(tokList.length)objs.push(deckObj(d.name+" — Tokens",tokList,4));if(heroList.length)objs.push(deckObj(d.name+" — Heroes",heroList,-4));if(deckList.length)objs.push(deckObj(d.name,deckList,0));
    const save={SaveName:d.name,GameMode:"",Gravity:0.5,PlayArea:0.5,Date:new Date().toLocaleString(),Table:"",Sky:"",Note:"",Rules:"",XmlUI:"",LuaScript:"",LuaScriptState:"",ObjectStates:objs,TabStates:{},VersionNumber:""};
    const base=safeName(d.name);
    const readme=`Crystal Quest - ${d.name}
Tabletop Simulator files

face_sheet.png  : all ${faces.length} card faces in a ${cols} x ${rows} grid (Heroes first, then one of each deck card, then tokens)
card_back.png   : the shared card back
${base}_saved_object.json : a saved object with your Heroes, your ${deckTotal(d)}-card deck${toks.length?" and your tokens":""} as named decks
deck_list.txt   : the plain deck list

QUICK WAY (no hosting needed)
1. In Tabletop Simulator: Objects > Components > Custom > Deck. Click on the table.
2. Face: choose face_sheet.png.  Back: choose card_back.png.
3. Width ${cols}, Height ${rows}, Number ${faces.length}. Check "Back is hidden". Import.
   TTS uploads the images to your Steam Cloud. This gives you one of each card;
   copy cards (Ctrl+C / Ctrl+V) for 2-ofs, or use the saved object below.

FULL DECK WITH CARD NAMES (saved object)
1. Upload face_sheet.png and card_back.png somewhere TTS can load them
   (TTS: Modding > Cloud Manager > Upload works well).
2. Open ${base}_saved_object.json in a text editor. Replace PASTE_FACE_SHEET_URL_HERE
   and PASTE_CARD_BACK_URL_HERE with those two links (every occurrence).
3. Put the .json file in your TTS Saved Objects folder:
   Windows: Documents\\My Games\\Tabletop Simulator\\Saves\\Saved Objects
   Mac: ~/Library/Tabletop Simulator/Saves/Saved Objects
4. In TTS: Objects > Saved Objects > ${base}_saved_object.
   You get a Heroes deck and a ${deckTotal(d)}-card deck with names and rules text on hover.
`;
    const zip=new JSZip();zip.file("face_sheet.png",faceBlob);zip.file("card_back.png",backBlob);
    zip.file(base+"_saved_object.json",JSON.stringify(save,null,2));zip.file("deck_list.txt",deckText(d));zip.file("README.txt",readme);
    const blob=await zip.generateAsync({type:"blob"});busy(false);
    await offer(base+"_tabletop_simulator.zip",blob);
  }catch(e){busy(false);console.error(e);toast("Couldn't build the Tabletop Simulator files. Try again.")}
}
async function copyText(t,msg){try{await navigator.clipboard.writeText(t);toast(msg||"Deck list copied.")}catch(e){
  const l=$("#layer");const m=document.createElement("div");m.className="modal";m.innerHTML=`<div class="box"><h2>Deck list</h2><textarea id="copy-box" style="width:100%;min-height:220px"></textarea><button type="button" class="btn" data-act="close">Close</button></div>`;l.appendChild(m);const ta=m.querySelector("textarea");ta.value=t;ta.select()}}


/* ---------- rules ---------- */
S.rules=null;S.rulesErr=false;
function mdInline(t){return esc(t).replace(/\[([^\]]+)\]\((#[a-z0-9/-]+|https:\/\/[^)\s]+)\)/g,(m,x,u)=>u[0]==="#"?`<a href="${u}">${x}</a>`:`<a href="${u}" target="_blank" rel="noopener">${x}</a>`).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>")}
function mdToHtml(md){
  const lines=md.split(/\r?\n/),toc=[];let html="",i=0,open=false,title="",sub=[];
  const slug=t=>"r-"+t.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  while(i<lines.length){const l=lines[i];let m;
    if(!l.trim()){i++;continue}
    if((m=l.match(/^(#{1,3})\s+(.*)$/))){const lv=m[1].length,t=m[2];i++;
      if(lv===1){title=t;continue}
      if(lv===2){if(open)html+="</section>";const id=slug(t);toc.push({id,t});html+=`<section class="rsec" id="${id}">`;open=true}
      html+=`<h${lv}>${mdInline(t)}</h${lv}>`;continue}
    if(/^\|/.test(l)){const rows=[];while(i<lines.length&&/^\|/.test(lines[i]))rows.push(lines[i++]);
      const cells=r=>r.replace(/^\||\|$/g,"").split("|").map(c=>c.trim());
      const head=cells(rows[0]),body=rows.slice(2).map(cells);
      html+=`<div class="tblwrap"><table><thead><tr>${head.map(c=>`<th>${mdInline(c)}</th>`).join("")}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${mdInline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;continue}
    if(/^- /.test(l)){let li="";while(i<lines.length&&/^- /.test(lines[i]))li+=`<li>${mdInline(lines[i++].slice(2))}</li>`;html+=`<ul>${li}</ul>`;continue}
    if(/^\d+\. /.test(l)){let li="";while(i<lines.length&&/^\d+\. /.test(lines[i]))li+=`<li>${mdInline(lines[i++].replace(/^\d+\.\s/,""))}</li>`;html+=`<ol>${li}</ol>`;continue}
    if(!open&&title){sub.push(mdInline(l));i++;continue}
    html+=`<p>${mdInline(l)}</p>`;i++}
  if(open)html+="</section>";
  return{html,toc,title,sub};
}
async function loadRules(){
  try{const r=await fetch("assets/rules.md",{cache:"no-cache"});if(!r.ok)throw new Error(r.status);S.rules=mdToHtml(await r.text());S.rulesErr=false}
  catch(e){S.rulesErr=true}
  if(S.view==="rules"||S.view==="trials-rules"||S.view==="set2-rules")render();
}
function viewRules(){
  if(!S.rules)return`${rulesSubtabs("rules")}<h1>Rules</h1><p class="lede">${S.rulesErr?"The rules didn't load. Check your connection and reload the page.":"Loading the rules…"}</p>`;
  const R=S.rules;
  return`${rulesSubtabs("rules")}<h1>${R.title||"Rules"}</h1>${R.sub.map(x=>`<p class="lede">${x}</p>`).join("")}
  <div class="rules-wrap">
    <nav class="rtoc" aria-label="Rules sections">
      <label class="field col" for="rules-q">Search the rules<input type="search" id="rules-q" data-act="rules-q" placeholder="e.g. Hidden, Guard, Town"></label>
      <span class="count" id="rules-count"></span>
      <select class="rtoc-sel" data-act="rules-sel" aria-label="Jump to section"><option value="">Jump to section…</option>${R.toc.map(t=>`<option value="${t.id}">${esc(t.t)}</option>`).join("")}</select>
      <div class="rtoc-list">${R.toc.map(t=>`<button type="button" data-act="rules-jump" data-id="${t.id}">${esc(t.t)}</button>`).join("")}</div>
    </nav>
    <article class="rules">${R.html}</article>
  </div>`;
}
/* Rules sub-menu: the full rules and the Quick Start guide (assets/quickstart.md, a separate document) */
function rulesSubtabs(cur){return`<nav class="subtabs" aria-label="Rules pages"><a href="#rules"${cur==="rules"?' aria-current="page"':""}>Full Rules</a><a href="#quickstart"${cur==="quickstart"?' aria-current="page"':""}>Quick Start</a>${trialsOn()?`<a href="#trials-rules"${cur==="trials-rules"?' aria-current="page"':""}>Trials Supplement</a>`:""}${set2On()?`<a href="#set2-rules"${cur==="set2-rules"?' aria-current="page"':""}>Set 2 Supplement</a>`:""}</nav>`}
/* Set Two Rules Supplement (assets/set2-rules.md): only for players with Set 2 access; everyone else gets the full rules */
S.s2rules=null;S.s2rulesErr=false;
async function loadSet2Rules(){
  try{const r=await fetch("assets/set2-rules.md",{cache:"no-cache"});if(!r.ok)throw new Error(r.status);S.s2rules=mdToHtml(await r.text());S.s2rulesErr=false}
  catch(e){S.s2rulesErr=true}
  if(S.view==="set2-rules")render();
}
function viewSet2Rules(){
  if(!S.s2rules)return`${rulesSubtabs("set2-rules")}<h1>Set Two Rules Supplement</h1><p class="lede">${S.s2rulesErr?"The Set 2 Supplement didn't load. Check your connection and reload the page.":"Loading…"}</p>`;
  const R=S.s2rules;
  return`${rulesSubtabs("set2-rules")}<h1>${R.title||"Set Two Rules Supplement"}</h1>${R.sub.map(x=>`<p class="lede">${x}</p>`).join("")}<article class="rules quick">${R.html}</article>`;
}
/* Trials Module Supplement (assets/trials-rules.md): only for players with Trials access; everyone else gets the full rules */
S.trules=null;S.trulesErr=false;
async function loadTrialsRules(){
  try{const r=await fetch("assets/trials-rules.md",{cache:"no-cache"});if(!r.ok)throw new Error(r.status);S.trules=mdToHtml(await r.text());S.trulesErr=false}
  catch(e){S.trulesErr=true}
  if(S.view==="trials-rules")render();
}
function viewTrialsRules(){
  if(!S.trules)return`${rulesSubtabs("trials-rules")}<h1>Trials Module Supplement</h1><p class="lede">${S.trulesErr?"The Trials Supplement didn't load. Check your connection and reload the page.":"Loading…"}</p>`;
  const R=S.trules;
  return`${rulesSubtabs("trials-rules")}<h1>${R.title||"Trials Module Supplement"}</h1>${R.sub.map(x=>`<p class="lede">${x}</p>`).join("")}<article class="rules quick">${R.html}</article>`;
}
S.quick=null;S.quickErr=false;
async function loadQuick(){
  try{const r=await fetch("assets/quickstart.md",{cache:"no-cache"});if(!r.ok)throw new Error(r.status);S.quick=mdToHtml(await r.text());S.quickErr=false}
  catch(e){S.quickErr=true}
  if(S.view==="quickstart")render();
}
function viewQuick(){
  if(!S.quick)return`${rulesSubtabs("quickstart")}<h1>Quick Start</h1><p class="lede">${S.quickErr?"The Quick Start guide didn't load. Check your connection and reload the page.":"Loading…"}</p>`;
  const R=S.quick;
  return`${rulesSubtabs("quickstart")}<h1>${R.title||"Quick Start"}</h1>${R.sub.map(x=>`<p class="lede">${x}</p>`).join("")}<article class="rules quick">${R.html}</article>`;
}
function rulesFilter(q){
  q=q.trim().toLowerCase();let n=0;
  document.querySelectorAll(".rules .rsec").forEach(sec=>{const hit=!q||sec.textContent.toLowerCase().includes(q);sec.hidden=!hit;if(hit)n++;
    const b=document.querySelector(`.rtoc-list [data-id="${sec.id}"]`);if(b)b.hidden=!hit});
  const c=document.getElementById("rules-count");if(c)c.textContent=q?`${n} section${n===1?"":"s"} mention “${q}”`:"";
}
function rulesJump(id){const el=document.getElementById(id);if(el){el.hidden=false;el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"})}}

/* ---------- events ---------- */
function go(v){if(location.hash==="#"+v){S.view=v;render();scrollTo(0,0)}else location.hash=v}
function setDeck(fn){fn(S.deck);S.dirty=true;saveDraft();render()}
/* weapon flip icon: swap the tile between its normal and upgraded side in place */
function flipTile(el){const card=el.closest(".card");const c=card&&BYID.get(card.dataset.cid);if(!c||!c.up)return;
  const t=document.createElement("div");t.innerHTML=cardHTML(c,{flipped:!card.classList.contains("upside"),nozoom:!card.querySelector(".zoom")});const n=t.firstElementChild;
  if(card.classList.contains("art")){[".art-frame",".flip"].forEach(k=>{const a=card.querySelector(":scope > "+k),b=n.querySelector(":scope > "+k);if(a&&b)a.replaceWith(b)});card.title=n.title;card.classList.toggle("upside");card.querySelector("[data-flip]")?.focus();return}
  ["c-head","c-type","c-rules","c-foot"].forEach(k=>{const a=card.querySelector(":scope > ."+k),b=n.querySelector(":scope > ."+k);if(a&&b)a.innerHTML=b.innerHTML});
  card.classList.toggle("upside");card.querySelector("[data-flip]")?.focus()}
document.addEventListener("click",e=>{const f=e.target.closest("[data-flip]");if(!f)return;e.preventDefault();e.stopPropagation();flipTile(f)},true);
/* div cards with role="button" (art cards you pick): Enter or Space clicks them like a button */
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target;if(!t.matches||!t.matches('.card[role="button"][data-act]'))return;e.preventDefault();t.click()});
document.addEventListener("keydown",e=>{const f=e.target.closest&&e.target.closest("[data-flip]");if(!f||(e.key!=="Enter"&&e.key!==" "))return;e.preventDefault();e.stopPropagation();flipTile(f)},true);
document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-act]");if(!b||b.tagName==="SELECT"||b.tagName==="INPUT")return;
  if(b.dataset.pool&&e.target.closest(".c-ctrl"))return;
  const a=b.dataset.act,id=b.dataset.id,v=b.dataset.v;
  if(a==="close"){b.closest(".modal")?.remove();return}
  if(a==="rb-auto"||a==="rb-one"){const list=a==="rb-one"?S.decks.filter(d=>d.id===id):rebuildList();b.disabled=true;busy(true,"Rebuilding…");
    const k=await rebuildDecks(list);busy(false);b.closest(".modal")?.remove();toast(`Rebuilt ${k} deck${k===1?"":"s"} to 50 cards.${k?" Open a deck to fine-tune it.":""}`);
    if(a==="rb-auto"&&S.view!=="build")go("decks");render();return}
  if(a==="rb-manual"){const list=rebuildList();b.closest(".modal")?.remove();const d=list[0];if(!d)return;
    if(d!==S.deck){S.deck={id:d.id,name:d.name,heroes:d.heroes.slice(),cards:{...d.cards}};S.dirty=false;saveDraft()}
    S.b.step="cards";go("build");render();toast(`Add ${DECK_SIZE-deckTotal(S.deck)} cards to reach 50, then press Save deck.${list.length>1?" Your other decks are marked in My Decks.":""}`);return}
  if(a==="cat-cls"){S.cat.cls=v;store.set("cq.cat",S.cat);render()}
  else if(a==="hero-cls"){S.b.heroCls=v;render()}
  else if(a==="b-cls"){S.b.cls=v;render()}
  else if(a==="clear-filters"){const f=b.dataset.scope==="cat"?S.cat:S.b;f.q="";f.type="all";f.cls="all";if(f===S.cat)store.set("cq.cat",S.cat);render()}
  else if(a==="inspect"){const c=BYID.get(id);if(c){inspect(c);zoomNav(b,"inspect")}}
  else if(a==="art-vote"){artVote(b)}
  else if(a==="edit-profile"){if(window.CQProf)CQProf.openSetup(false)}
  else if(a==="dc-signin"){await SB.auth.signInWithOAuth({provider:"discord",options:{scopes:DC_SCOPES,redirectTo:location.origin+location.pathname}})}
  else if(a==="dc-link"){const{error}=await SB.auth.linkIdentity({provider:"discord",options:{scopes:DC_SCOPES,redirectTo:location.origin+location.pathname}});if(error)toast("Couldn't connect Discord: "+error.message)}
  else if(a==="dc-unlink"){const{data}=await SB.auth.getUserIdentities();const i=data&&data.identities.find(x=>x.provider==="discord");if(i){const{error}=await SB.auth.unlinkIdentity(i);toast(error?"Couldn't disconnect: "+error.message:"Discord disconnected.");const s=await SB.auth.getSession();setSession(s.data.session)}}
  else if(a==="pick-hero"){let added=false,msg="";setDeck(d=>{const n=HSLOTS(d);while(d.heroes.length<n)d.heroes.push(null);const i=d.heroes.indexOf(id);
      if(S.b.swap!=null&&i<0){const old=BYID.get(d.heroes[S.b.swap]);d.heroes[S.b.swap]=id;msg=`Swapped ${old?old.name:"Hero"} → ${BYID.get(id).name} (${SLOT_NAMES(d)[S.b.swap]}).`;S.b.swap=null;added=true}
      else if(i>=0){d.heroes[i]=null}
      else{const s=S.b.target!=null&&!d.heroes[S.b.target]?S.b.target:d.heroes.indexOf(null);if(s>=0){d.heroes[s]=id;added=true;S.b.target=null}else toast("Your party is full. Use Swap on a Hero to replace it.")}});
    if(msg)toast(msg);if(added&&HN(S.deck)===HSLOTS(S.deck)&&!msg){S.b.step="cards";S.b.cls="all";render();scrollTo(0,0)}else render()}
  else if(a==="hero-swap"){const i=+b.dataset.slot;S.b.swap=S.b.swap===i?null:i;S.b.target=null;render()}
  else if(a==="hero-target"){const i=+b.dataset.slot;S.b.target=S.b.target===i?null:i;S.b.swap=null;render()}
  else if(a==="unhero"){setDeck(d=>{const n=HSLOTS(d);while(d.heroes.length<n)d.heroes.push(null);d.heroes=d.heroes.map(h=>h===id?null:h)});S.b.swap=null;if(HN(S.deck)<HSLOTS(S.deck)){S.b.step="heroes";render()}}
  else if(a==="to-cards"){if(HN(S.deck)===HSLOTS(S.deck)){S.b.step="cards";S.b.cls="all";render();scrollTo(0,0)}}
  else if(a==="to-heroes"){S.b.step="heroes";render()}
  else if(a==="inc-max"){const c=BYID.get(id);if(!c)return;const m=maxCopies(c),q=S.deck.cards[id]||0;if(q>=m)return;setDeck(d=>{d.cards[id]=m});toast(`${m} × ${c.name} in your deck.`)}
  else if(a==="inc"||a==="inc-close"){const c=BYID.get(id);if(!c)return;
    if((S.deck.cards[id]||0)>=maxCopies(c)){toast(c.sup==="Legendary"?"Legendary cards are limited to 1 copy.":"You can include up to 3 copies.");return}
    setDeck(d=>{d.cards[id]=(d.cards[id]||0)+1});if(a==="inc-close"){b.closest(".modal")?.remove();toast(`Added ${c.name}.`)}}
  else if(a==="dec"){setDeck(d=>{if(d.cards[id]>1)d.cards[id]--;else delete d.cards[id]})}
  else if(a==="rmall"){setDeck(d=>{delete d.cards[id]})}
  else if(a==="visual"){const d=deckBySrc(b.dataset.src);if(d)visualModal(d)}
  else if(a==="deckpng"){const d=deckBySrc(b.dataset.src);if(d)exportDeckPNG(d)}
  else if(a==="decklog"){const d=deckBySrc(b.dataset.src);if(d)deckLogModal(d)}
  else if(a==="prune"){setDeck(d=>{for(const k of Object.keys(d.cards)){const c=BYID.get(k);if(!c||!allowed(c,d))delete d.cards[k]}})}
  else if(a==="new-deck-ask"){const d=S.deck;const has=HN(d)||deckTotal(d);
    if(!S.dirty||!has){S.deck=blankDeck();S.dirty=false;S.b.step="heroes";saveDraft();go("build");render();return}
    const l=$("#layer");const m=document.createElement("div");m.className="modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label","Start a new deck");
    m.innerHTML=`<div class="box"><h2>Save this deck first?</h2><p>“${esc(d.name||"Untitled deck")}” has unsaved changes. Save it before starting a new deck?</p><div class="actions newdeck-acts"><button type="button" class="btn primary go" data-act="new-deck-save">Save and start new</button><button type="button" class="btn" data-act="new-deck-go">Don't save</button><button type="button" class="btn" data-act="close">Cancel</button></div></div>`;
    l.appendChild(m);m.addEventListener("click",ev=>{if(ev.target===m)m.remove()});return}
  else if(a==="new-deck-save"){const d=S.deck;d.name=(d.name||"").trim()||"Untitled deck";b.disabled=true;
    try{const where=await persistDeck(d);toast(where==="account"?"Deck saved to your account. New deck started.":"Deck saved in this browser. New deck started.")}catch(err){b.disabled=false;return}
    b.closest(".modal")?.remove();S.deck=blankDeck();S.dirty=false;S.b.step="heroes";saveDraft();go("build");render()}
  else if(a==="new-deck"||a==="new-deck-go"){if(a==="new-deck-go")b.closest(".modal")?.remove();if(S.dirty&&a==="new-deck"&&!b.dataset.sure){b.dataset.sure="1";b.textContent="Discard unsaved changes?";setTimeout(()=>{if(b.isConnected){delete b.dataset.sure;b.textContent=b.closest(".deckpanel")?"New deck":"Start over"}},3500);return}
    S.deck=blankDeck();S.dirty=false;S.b.step="heroes";saveDraft();go("build");render()}
  else if(a==="new-party"){if(!trialsOn())return;b.closest(".modal")?.remove();if(S.dirty&&!b.dataset.sure&&HN(S.deck)+deckTotal(S.deck)>0){b.dataset.sure="1";b.textContent="Discard unsaved changes?";setTimeout(()=>{if(b.isConnected){delete b.dataset.sure;b.textContent="New Trials party"}},3500);return}
    S.deck=Object.assign(blankDeck(),{name:"Untitled Trials party",heroes:[null,null],trials:true});S.dirty=false;S.b.step="heroes";S.b.target=null;S.b.swap=null;saveDraft();go("build");render()}
  else if(a==="save"){const d=S.deck;d.name=(d.name||"").trim()||"Untitled deck";b.disabled=true;
    try{const where=await persistDeck(d);S.dirty=false;saveDraft();toast(where==="account"?"Deck saved to your account.":"Deck saved in this browser.")}catch(err){}
    render()}
  else if(a==="open"){const d=S.decks.find(x=>x.id===id);if(!d)return;if(isTrialsDeck(d)&&!trialsOn())return;S.deck={id:d.id,name:d.name,heroes:d.heroes.slice(),cards:{...d.cards},...(isTrialsDeck(d)?{trials:true}:{})};S.dirty=false;S.b.step=HN(d)===HSLOTS(d)?"cards":"heroes";saveDraft();go("build")}
  else if(a==="dup"){const d=S.decks.find(x=>x.id===id);if(!d)return;const c={id:newId(),name:d.name+" (copy)",heroes:d.heroes.slice(),cards:{...d.cards}};try{await persistDeck(c);toast("Deck duplicated.")}catch(err){}render()}
  else if(a==="del"){const box=document.querySelector(`[data-confirm="${id}"]`);if(box)box.hidden=false}
  else if(a==="del-no"){const box=document.querySelector(`[data-confirm="${id}"]`);if(box)box.hidden=true}
  else if(a==="del-yes"){await removeDeck(id)}
  else if(a==="hand"){openHand(deckBySrc(b.dataset.src))}
  else if(a==="hand-draw"){handDraw()}
  else if(a==="hand-mull"){handMull()}
  else if(a==="hand-new"){if(S.hand){dealHand(S.hand.d);renderHand()}}
  else if(a==="inspect-hand"){const c=BYID.get(id);if(c){zoomOnly(c);zoomNav(b,"zoom")}}
  else if(a==="pnp"){const d=deckBySrc(b.dataset.src);if(d)choosePrint(d)}
  else if(a==="pnp-go"){const d=deckBySrc(b.dataset.src);b.closest(".modal")?.remove();if(d)exportPnP(d,v)}
  else if(a==="tts"){const d=deckBySrc(b.dataset.src);if(d)exportTTS(d)}
  else if(a==="copylist"){const d=deckBySrc(b.dataset.src);if(d)copyText(deckText(d))}
  else if(a==="import"){const t=$("#import-text").value;if(!t.trim()){toast("Paste a deck list first.");return}
    const{d,miss}=parseDeck(t);S.deck=d;S.dirty=true;S.b.step=HN(d)===3?"cards":"heroes";saveDraft();go("build");
    toast(miss.length?`Imported. Not found: ${miss.slice(0,4).join(", ")}${miss.length>4?"…":""}`:"Deck imported. Press Save deck to keep it.")}
  else if(a==="migrate"){b.disabled=true;await migrateLocal()}
  else if(a==="auth-mode"){S.authMode=v;render()}
  else if(a==="signout"){await signOut()}
  else if(a==="rules-jump"){rulesJump(id)}
  else if(a==="best-refresh"){S.best=null;loadBest();render()}
  else if(a==="best-view"){const r=(S.best&&S.best.rows||[]).find(x=>x.deck_key===id)||(S.comm&&S.comm.recent||[]).find(x=>x.deck_key===id);if(r)bestListModal(r)}
  else if(a==="comm-refresh"){S.comm=null;loadCommunity();render()}
  else if(a==="comm-view"){const r=(S.comm&&S.comm.rows||[]).find(x=>x.id===id);if(r)commListModal(r)}
  else if(a==="comm-del"){if(window.confirm("Remove this deck from Community Decks? Your saved deck stays in My Decks."))commUnshare(id)}
  else if(a==="comm-share"){const d=S.decks.find(x=>x.id===id);if(d)commShare(d)}
  else if(a==="comm-unshare"){const rid=S.commMine&&S.commMine.get(id);if(rid&&window.confirm("Remove this deck from Community Decks?"))commUnshare(rid)}
  else if(a==="comm-open"){const r=(S.comm&&S.comm.rows||[]).find(x=>x.id===id);if(!r)return;b.closest(".modal")?.remove();const d=commDeck(r);
    if(openOwn(S.uid&&r.user_id===S.uid?S.decks.find(x=>String(x.id)===String(r.deck_id)):null)||openOwn(ownMatch(d)))return;
    if(S.dirty&&!confirmReplace())return;S.deck={id:newId(),name:d.name+" (copy)",heroes:d.heroes.slice(),cards:{...d.cards}};S.dirty=true;S.b.step="cards";saveDraft();go("build");toast("Deck copied into the Deck Builder. Press Save deck to keep it.")}
  else if(a==="best-open"){const r=(S.best&&S.best.rows||[]).find(x=>x.deck_key===id)||(S.comm&&S.comm.recent||[]).find(x=>x.deck_key===id);if(!r)return;b.closest(".modal")?.remove();const d=bestDeck(r);
    if(openOwn(ownMatch(d)))return;
    if(S.dirty&&!confirmReplace())return;S.deck={id:newId(),name:d.name+" (copy)",heroes:d.heroes.slice(),cards:{...d.cards}};S.dirty=true;S.b.step="cards";saveDraft();go("build");toast("Deck copied into the Deck Builder. Press Save deck to keep it.")}
  else if(a==="share"){const d=deckBySrc(b.dataset.src);if(d&&isTrialsDeck(d)){toast("Trials parties can't be shared yet.");return}if(d)copyText(shareURL(d),"Share link copied. Anyone with it can open this deck.")}
});
let qT;
document.addEventListener("input",e=>{const t=e.target,a=t.dataset&&t.dataset.act;if(!a)return;
  if(a==="deck-name"){S.deck.name=t.value;S.dirty=true;saveDraft();return}
  if(a==="rules-q"){rulesFilter(t.value);return}
  if(a==="cat-q"||a==="b-q"){clearTimeout(qT);qT=setTimeout(()=>{(a==="cat-q"?S.cat:S.b).q=t.value;if(a==="cat-q")store.set("cq.cat",S.cat);const pos=t.selectionStart;render();const n=document.getElementById(a);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}},180)}
});
document.addEventListener("change",e=>{const t=e.target,a=t.dataset&&t.dataset.act;if(!a)return;
  if(a==="cat-type"){S.cat.type=t.value;store.set("cq.cat",S.cat);render()}
  else if(a==="cat-sort"){S.cat.sort=t.value;store.set("cq.cat",S.cat);render()}
  else if(a==="b-type"){S.b.type=t.value;render()}
  else if(a==="b-sort"){S.b.sort=t.value;render()}
  else if(a==="rules-sel"&&t.value){rulesJump(t.value);t.value=""}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){const ms=document.querySelectorAll(".modal");if(ms.length)ms[ms.length-1].remove();return}
  const hm=document.getElementById("handm");if(!hm||document.querySelectorAll(".modal").length>1||e.metaKey||e.ctrlKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(e.key==="d"||e.key==="D"){e.preventDefault();handDraw()}else if(e.key==="n"||e.key==="N"){e.preventDefault();if(S.hand){dealHand(S.hand.d);renderHand()}}});
function route(){const h=location.hash.replace("#","");const pm=/^player\/(.+)$/.exec(h);if(pm){try{S.playerName=decodeURIComponent(pm[1])}catch(e){S.playerName=pm[1]}}
  S.view=pm?"player":h===""?"home":["home","learn","catalog","build","decks","account","rules","quickstart","trials-rules","set2-rules","play","best","community","changelog","admin","leaderboard"].includes(h)?h:"catalog";if(S.view==="build"&&HN(S.deck)===3&&S.b.step!=="heroes")S.b.step="cards";render();}
window.addEventListener("hashchange",()=>{route();scrollTo(0,0)});
(function(){const p=new URLSearchParams(location.search).get("deck");if(!p)return;const d=readShare(p);history.replaceState(null,"",location.pathname+"#build");
  if(d){S.deck=d;S.dirty=true;saveDraft();setTimeout(()=>toast("Shared deck loaded. Press Save deck to keep a copy."),300)}})();
if(HN(S.deck)===3&&deckTotal(S.deck)>0)S.b.step="cards";
route();
initAccount();

/* Hover preview: pointing at a card name in a deck list (.dl) or the Play tab's game log pops the card up zoomed in. Mouse/trackpad only. */
(function(){const canHover=()=>{try{return matchMedia("(hover: hover)").matches}catch(e){return true}};let pop=null,cur=null;
  const SEL=".dl .nlink[data-id],.lgc[data-hc]";
  function hide(){cur=null;if(pop)pop.style.display="none"}
  function place(el){const r=el.getBoundingClientRect();const w=pop.offsetWidth,h=pop.offsetHeight,vw=innerWidth,vh=innerHeight,g=12;
    let x=r.right+g;if(x+w>vw-8)x=r.left-g-w;if(x<8)x=Math.max(8,Math.min(vw-w-8,r.left));
    let y=r.top+r.height/2-h/2;y=Math.max(8,Math.min(vh-h-8,y));pop.style.left=x+"px";pop.style.top=y+"px"}
  function show(el){const id=el.dataset.hc||el.dataset.id;const c=BYID.get(id)||BYID.get("h:"+id)||BYID.get("t:"+id);if(!c){hide();return}
    if(!pop){pop=document.createElement("div");pop.id="hovercard";pop.setAttribute("aria-hidden","true");document.body.appendChild(pop)}
    if(cur!==el){cur=el;pop.innerHTML=cardHTML(c,{nozoom:1});pop.style.display="block"}place(el)}
  document.addEventListener("mouseover",e=>{if(!canHover())return;const el=e.target.closest&&e.target.closest(SEL);if(el)show(el);else if(cur)hide()});
  document.addEventListener("mouseleave",hide);addEventListener("scroll",()=>{if(cur&&cur.isConnected&&cur.matches(":hover"))place(cur);else hide()},true);document.addEventListener("click",hide,true);
  window.CQHoverHide=hide})();
