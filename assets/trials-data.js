/* Crystal Quest Trials module data (co-op boss Trials). Snapshot of the Drive sheets Trials_Bosses, Trials_BossCards, Trials_Spawns, Trials_Loot, 2026-11-12.
   Hidden like Set 2: the site shows these only to admins and accounts with Trials access (Admin > Users). Never merged into RAW_* tables.
   Bosses:     [name, trial, Health Points per party, base Defense, Stone Plates per party, Golems per party at start, ability, version]
   Boss cards: [name, boss, copies, target, effect, version]
   Spawns:     [name, boss, Strength, Defense, Health Points, rules, version]
   Loot:       same shape as RAW_EQUIP [name, supertype, subtype, class, rules, Aura cost, region, +Strength, +Defense, version]
   Loot upgrades: same shape as EQUIP_UPGRADES {name: [Gold cost, upgraded rules, +Strength, +Defense]} */
const TRIALS_BOSSES=[
["Rock Mammoth",1,25,0,1,1,"Stone Plates: the Rock Mammoth starts with 1 Stone Plate per party; each gives it +1 Defense. Whenever a Golem is destroyed, break a Stone Plate and put a Rage counter on the Rock Mammoth. Once the Rock Mammoth has Rage counters equal to the number of parties plus 1, if it would flip a card, instead it does Raging Stampede: deal 3 damage to every player Hero, remove all Rage counters, and the Rock Mammoth has 0 Defense until its next flip.",1]];
const TRIALS_BOSS_CARDS=[
["Tusk Gore","Rock Mammoth",4,"The player Hero with the highest Strength","Deal 4 damage to it.",1],
["Crushing Step","Rock Mammoth",3,"The player Hero with the most Health Points","Deal 3 damage to it.",1],
["Boulder Toss","Rock Mammoth",2,"The player Hero with the fewest Health Points","Deal 3 damage to it.",1],
["Grudge Stomp","Rock Mammoth",2,"The Lead of the party that dealt the Rock Mammoth the most damage this round","Deal 3 damage to it.",1],
["Rockslide","Rock Mammoth",2,"The party with the most total Health Points","Deal 2 damage to each of its Heroes.",1],
["Tremor","Rock Mammoth",1,"The ready Hero with the highest Strength in each party","Exhaust it.",1],
["Call the Mountain","Rock Mammoth",3,"The party with the fewest Golems","Summon a Golem against it.",1],
["The Mountain Wakes","Rock Mammoth",1,"Each party","Summon a Golem against each party.",1],
["Stone Skin","Rock Mammoth",2,"The Rock Mammoth","It gets +2 Defense until its next flip.",1]];
const TRIALS_SPAWNS=[
["Golem","Rock Mammoth",1,0,4,"After each boss flip, attacks the Hero with the most Health Points in the party it was spawned against (if that party is wiped out, the next party clockwise). Ties: the Hero with the least Defense, then Lead before Closer.",1]];
const TRIALS_LOOT=[
["Rockbreaker Maul","Legendary","Weapon","Generic","Equipped Hero gains +3 Strength. When it attacks a target with 3 or more Defense, it has Piercing 2. (Piercing 2 ignores 2 of the target's Defense.)",3,"Two-Handed",3,0,1],
["Mammoth Tusk","Legendary","Weapon","Generic","Equipped Hero gains +1 Strength. Its attacks deal +2 damage to summons.",2,"One-Handed",1,0,1],
["Crag Helm","Legendary","Armor","Generic","Equipped Hero gains +1 Defense. It can't be Stunned.",2,"Head",0,1,1],
["Stampede Boots","Legendary","Armor","Generic","Equipped Hero gains +1 Defense. It can't be exhausted by enemy cards or abilities.",2,"Feet",0,1,1],
["Stoneplate Mantle","Legendary","Armor","Generic","Equipped Hero gains +1 Defense. The first time each game it would die, it stays at 1 Health Point instead.",3,"Chest",0,1,1],
["Heart of the Mountain","Legendary","Accessory","Generic","Once per turn, when an enemy summon dies, gain 1 Aura.",2,"Accessory",0,0,1]];
const TRIALS_LOOT_UPGRADES={
"Rockbreaker Maul":[6,"Equipped Hero gains +4 Strength. When it attacks a target with 3 or more Defense, it has Piercing 2. (Piercing 2 ignores 2 of the target's Defense.)",4,0],
"Mammoth Tusk":[4,"Equipped Hero gains +2 Strength. Its attacks deal +2 damage to summons.",2,0],
"Crag Helm":[5,"Equipped Hero gains +2 Defense. It can't be Stunned.",0,2],
"Stampede Boots":[5,"Equipped Hero gains +2 Defense. It can't be exhausted by enemy cards or abilities.",0,2],
"Stoneplate Mantle":[5,"Equipped Hero gains +2 Defense. The first time each game it would die, it stays at 1 Health Point instead.",0,2],
"Heart of the Mountain":[4,"Once per turn, when an enemy summon dies, gain 1 Aura and heal the equipped Hero for 1 Health Point.",0,0]};
const TRIALS_NAMES=[...TRIALS_BOSSES,...TRIALS_BOSS_CARDS,...TRIALS_SPAWNS,...TRIALS_LOOT].map(r=>r[0]);
