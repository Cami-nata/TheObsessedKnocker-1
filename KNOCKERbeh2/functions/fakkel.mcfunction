execute as @e[family=knocker, tag=pappa] at @s run stopsound @a mob.scary_knocker.breath
execute as @a[tag=silence] at @s run tag @e[family=knocker] add shut
tag @e[type=scary:knocker, tag=shut] add pappa
scoreboard objectives add fakkel dummy fakkel
scoreboard objectives add praat dummy praat
scoreboard objectives add praatx dummy praatx
scoreboard objectives add klopje dummy klopje
scoreboard objectives add lampje dummy lampje
scoreboard objectives add buit dummy buit
scoreboard objectives add sub dummy sub
scoreboard objectives add kan dummy kan
scoreboard objectives add spook dummy spook
scoreboard players random @e[type=scary:knocker] fakkel 1 3
scoreboard players random @e[type=scary:knocker, tag=!shut] praat 1 6
scoreboard players random @e[type=scary:knocker] praatx 1 6
scoreboard players random @e[type=scary:knocker] klopje 1 9000
scoreboard players random @e[type=scary:knocker] sub 1 11111
scoreboard players random @e[type=scary:knocker] kan 1 1111
scoreboard players random @a fakkel 1 1000
scoreboard players random @e[type=scary:knocker] spook 1 4000
# Ultra-rare "You are not alone" score (fires ~once per 3+ minutes)
scoreboard objectives add yalone dummy yalone
scoreboard players random @e[type=scary:knocker] yalone 1 4000
# Bond tier tags for players - refreshed every tick for stage-gating
scoreboard objectives add bond dummy bond
tag @a remove k_stranger
tag @a remove k_watched
tag @a remove k_familiar
tag @a remove k_obsessed
tag @a[scores={bond=..99}] add k_stranger
tag @a[scores={bond=100..249}] add k_watched
tag @a[scores={bond=250..399}] add k_familiar
tag @a[scores={bond=400..}] add k_obsessed
scoreboard players add @e[family=knocker, scores={lampje=1..}] lampje 1
scoreboard players add @e[family=knocker, tag=buit] buit 1
hud @a hide status_effects
gamerule commandblockoutput false
scoreboard players reset @e[type=scary:knocker, tag=shut] praat
execute as @e[type=scary:knocker, hasitem={item=soul_torch, location=slot.weapon.mainhand}] at @s anchored eyes run setblock ~ ~ ~ light_block_7 replace
execute as @e[type=scary:knocker, scores={fakkel=2}] at @s anchored eyes run fill ~6 ~6 ~6 ~-6 ~-6 ~-6 air replace light_block_7
execute as @e[family=knocker] at @s if entity @a[r=6, scores={fakkel=11}, tag=!psy, tag=!pyro] run tag @s add flee
execute as @e[family=knocker, tag=flee, tag=!loot] at @s if entity @a[r=666, rm=33, scores={fakkel=1..3}] run event entity @s pathx
# Rush attacks only for Watched/Familiar (bond 25-74). Stranger = eerie observer. Obsessed = protective.
execute as @e[family=knocker] at @s if entity @a[r=4, scores={fakkel=13..16, bond=100..399}, tag=!psy, tag=!pop, tag=!smak, tag=!k_pacifist] run event entity @s rushx
execute as @e[family=knocker] at @s if entity @a[r=3, scores={fakkel=27..38, bond=100..399}, tag=!psy, tag=!pop, tag=!smak, tag=!k_pacifist] run event entity @s rushx
execute as @e[family=knocker] at @s if entity @a[r=2, scores={fakkel=27..72, bond=100..399}, tag=!psy, tag=!pop, tag=!smak, tag=!k_pacifist] run event entity @s rushx
execute as @a[scores={fakkel=2..222}] at @s anchored eyes run fill ~6 ~6 ~6 ~-6 ~-6 ~-6 air replace light_block_7
# Flee slowness removed: tag=!flee on tier lines above ensures no slowness while fleeing
event entity @e[type=scary:knocker, scores={klopje=13..16}] sneaked
event entity @e[type=scary:knocker, scores={klopje=13..16}] crawled
event entity @e[type=scary:knocker, scores={sub=11..16}, tag=pyro] pathx
event entity @e[type=scary:knocker, scores={sub=11..16}, tag=psy] pathx
execute as @e[family=knocker] at @s run kill @e[family=boat, r=3]
execute as @e[family=knocker] at @s run kill @e[family=minecart, r=3]
replaceitem entity @e[family=knocker, scores={lampje=33..}] slot.weapon.mainhand 1 soul_torch 1 0
scoreboard players reset @e[family=knocker, scores={lampje=34..}] lampje

tag @e[family=knocker, tag=boef] remove flee
execute as @e[family=knocker, tag=pappa] at @s run stopsound @a mob.scary_knocker.breath
# === SLEEP WATCHING (bond-scaled — fires via spook RNG, ~once per 33s per value) ===
# Stranger: barely drifts within range — just enough to feel present
# Watched: closes in, occasionally speaks
execute as @e[type=scary:knocker, tag=b_watched, tag=!shut, scores={spook=411}] at @s if entity @a[r=10] run say Sleep well.
execute as @e[type=scary:knocker, tag=b_watched, tag=!shut, scores={spook=413}] at @s if entity @a[r=10] run say I'll be here when you wake up.
# Familiar: stays very close, speaks softly
execute as @e[type=scary:knocker, tag=b_familiar, tag=!shut, scores={spook=421}] at @s if entity @a[r=6] run say You look peaceful when you sleep.
execute as @e[type=scary:knocker, tag=b_familiar, tag=!shut, scores={spook=422}] at @s if entity @a[r=6] run say I could watch you like this forever.
execute as @e[type=scary:knocker, tag=b_familiar, tag=!shut, scores={spook=423}] at @s if entity @a[r=6] run say Don't wake up yet.
execute as @e[type=scary:knocker, tag=b_familiar, tag=!shut, scores={spook=424}] at @s if entity @a[r=6] run say Shh. Sleep.
# Obsessed: right beside them, speaks constantly
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!shut, scores={spook=431}] at @s if entity @a[r=4] run say I'm right here.
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!shut, scores={spook=432}] at @s if entity @a[r=4] run say Sleep. I'm not going anywhere.
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!shut, scores={spook=433}] at @s if entity @a[r=4] run say I've been here all night.
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!shut, scores={spook=434}] at @s if entity @a[r=4] run say You're so still when you sleep.
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!shut, scores={spook=435}] at @s if entity @a[r=4] run say I won't let anything touch you.
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!shut, scores={spook=436}] at @s if entity @a[r=4] run say ...
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!shut, scores={spook=437}] at @s if entity @a[r=4] run say You don't even know I'm here. That's fine.
# === BEDSHARE (opt-in toggle via The Whisper menu — tag: k_bedshare) ===
# JS already validates 2 beds exist at toggle time, so no bed check needed here
execute as @e[type=scary:knocker, tag=b_familiar, tag=!focus, tag=!psy, tag=!pyro, scores={spook=500}] at @s if entity @a[r=20, tag=k_bedshare] run tp @s @a[r=20, tag=k_bedshare, c=1]
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!focus, tag=!psy, tag=!pyro, scores={spook=501}] at @s if entity @a[r=30, tag=k_bedshare] run tp @s @a[r=30, tag=k_bedshare, c=1]
execute as @e[type=scary:knocker, tag=b_familiar, tag=!shut, scores={spook=503}] at @s if entity @a[r=2, tag=k_bedshare] run say I'll keep you safe tonight.
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!shut, scores={spook=502}] at @s if entity @a[r=2, tag=k_bedshare] run say Right here. Always right here.

execute as @e[type=scary:knocker, tag=buit, scores={buit=111..}] at @s run fill ~-12 ~-12 ~-12 ~12 ~12 ~12 air replace trapped_chest
event entity @e[type=scary:knocker, tag=buit, scores={buit=111..}] thief
tag @e[type=scary:knocker, tag=buit, scores={buit=111..}] remove base
tag @e[type=scary:knocker, tag=buit, scores={buit=111..}] remove buit
scoreboard players reset @e[type=scary:knocker, scores={buit=111..}] buit
execute as @e[type=scary:knocker] at @s if block ^ ^ ^1 trapped_chest run tag @s add buit
execute as @e[type=scary:knocker] at @s if block ^ ^1 ^1 trapped_chest run tag @s add buit
execute as @e[type=scary:knocker] at @s if block ^ ^2 ^1 trapped_chest run tag @s add buit
execute as @e[type=scary:knocker] at @s if block ^1 ^1 ^1 trapped_chest run tag @s add buit
execute as @e[type=scary:knocker] at @s if block ^1 ^2 ^1 trapped_chest run tag @s add buit
execute as @e[type=scary:knocker] at @s if block ^-1 ^1 ^1 trapped_chest run tag @s add buit
execute as @e[type=scary:knocker] at @s if block ^-1 ^2 ^1 trapped_chest run tag @s add buit
execute as @e[family=knocker, tag=pappa] at @s run stopsound @a mob.scary_knocker.breath
execute as @e[type=scary:knocker, tag=!focus, scores={klopje=36..39}] at @s run replaceitem entity @s slot.weapon.mainhand 1 air 1 0
effect @e[type=scary:knocker, hasitem={item=trident, location=slot.weapon.mainhand}] strength 2 2 true
effect @e[type=scary:knocker, hasitem={item=bow, location=slot.weapon.mainhand}] speed 2 1 true
execute as @e[type=scary:knocker, scores={praatx=6}] at @s if entity @s[hasitem={item=bow, location=slot.weapon.mainhand}] run tag @s add boog
execute as @e[type=scary:knocker, scores={praatx=4}] at @s if entity @s[hasitem={item=crossbow, location=slot.weapon.mainhand}] run tag @s add boog
execute as @e[type=scary:knocker, scores={praatx=2}, tag=bah] at @s unless entity @s[hasitem={item=crossbow, location=slot.weapon.mainhand}] run tag @s remove boog
execute as @e[type=scary:knocker, scores={praatx=3}] at @s unless entity @s[hasitem={item=bow, location=slot.weapon.mainhand}] run tag @s remove boog
effect @e[type=scary:knocker, hasitem={item=elytra, location=slot.armor.chest}] slow_falling 2 22 true

execute as @s at @s run replaceitem entity @s[scores={kan=1..8}, tag=loot] slot.weapon.mainhand 1 air 1 0
execute as @e[type=scary:knocker, tag=focus] at @s run tag @a[r=6] add smak
tag @a[scores={fakkel=11}] remove smak

# === SPOOKY NEARBY AWARENESS - lets player sense The Knocker is near ===
# Play subtle breath sound when Knocker is within 24 blocks but not visible (not in rush/psy mode)
execute as @e[type=scary:knocker, tag=!psy, tag=!pyro, tag=!focus, scores={spook=1}] at @s if entity @a[r=24] run playsound mob.scary_knocker.breath @a[r=24] ~ ~ ~ 0.3 1
# Rare whistle heard at distance (only 1-in-12 chance to whistle when within 48 blocks)
execute as @e[type=scary:knocker, tag=!psy, tag=!pyro, tag=!focus, scores={spook=2}] at @s if entity @a[r=48, rm=12] run playsound mob.scary_knocker.whistle @a[r=48] ~ ~ ~ 0.6 1
# Very rare subtitle message warning player something is watching
execute as @e[type=scary:knocker, tag=!psy, tag=!pyro, tag=!focus, tag=!shut, scores={spook=3}] at @s if entity @a[r=32] run titleraw @a[r=32] actionbar {"rawtext":[{"text":"\u00a78..."}]}
# You are not alone - ultra rare, only Stranger and Familiar bond stages
execute as @e[type=scary:knocker, tag=!psy, tag=!pyro, tag=!focus, tag=!shut, scores={yalone=1}] at @s if entity @a[r=20, tag=k_stranger] run titleraw @a[r=20, tag=k_stranger] actionbar {"rawtext":[{"text":"§4You are not alone."}]}
execute as @e[type=scary:knocker, tag=!psy, tag=!pyro, tag=!focus, tag=!shut, scores={yalone=2}] at @s if entity @a[r=20, tag=k_familiar] run titleraw @a[r=20, tag=k_familiar] actionbar {"rawtext":[{"text":"§4You are not alone."}]}
# Darkness flicker when knocker is very close but unseen
execute as @e[type=scary:knocker, tag=!focus, tag=!psy, scores={spook=7}] at @s if entity @a[r=8] run effect @a[r=8] darkness 2 0 true


# === TIER-BASED MOVEMENT CONTROL ===
# tag=!flee excludes fleeing Knockers — behavior.avoid_mob_type handles their speed via
# sprint_speed_multiplier:2.4 and walk_speed_multiplier:1.6. Applying tier slowness
# while they flee counteracts that and was the cause of slow fleeing.
# Stranger: noticeably slow - shuffles occasionally, mostly watches from afar
effect @e[type=scary:knocker, tag=b_stranger, tag=!focus, tag=!psy, tag=!pyro, tag=!flee] slowness 2 2 true
# Watched: slow drift - creeps with purpose
effect @e[type=scary:knocker, tag=b_watched, tag=!focus, tag=!psy, tag=!pyro, tag=!flee] slowness 2 1 true
# Familiar: slight slowness - roams but not urgently
effect @e[type=scary:knocker, tag=b_familiar, tag=!focus, tag=!psy, tag=!pyro, tag=!flee] slowness 2 0 true
# Obsessed: no slowness applied - runs at full base speed (0.24)
# NOTE: do NOT apply slowness 0 here. fakkel runs every tick, so any slowness duration
# including 0 gets clamped to 1 tick and reapplied 20x/second = permanent slowness.
# Leaving this line absent lets the Familiar slowness (2s) expire naturally on tier transition.

# === TIER-BASED PROXIMITY - how close it drifts to the player ===
# Stranger: stays 20-40 blocks away - distant observer
execute as @e[type=scary:knocker, tag=b_stranger, tag=!focus, tag=!psy, tag=!pyro, scores={spook=400}] at @s if entity @a[r=20] run spreadplayers ~ ~ 20 40 @s
# Watched: 12-24 blocks - noticeable but not close
execute as @e[type=scary:knocker, tag=b_watched, tag=!focus, tag=!psy, tag=!pyro, scores={spook=410}] at @s if entity @a[r=12] run spreadplayers ~ ~ 12 24 @s
# Familiar: 6-14 blocks - clearly nearby
execute as @e[type=scary:knocker, tag=b_familiar, tag=!b_obsessed, tag=!focus, tag=!psy, tag=!pyro, scores={spook=44..60}] at @s if entity @a[r=6] run spreadplayers ~ ~ 6 14 @s
# Obsessed: 2-6 blocks - right there
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!focus, tag=!psy, tag=!pyro, scores={spook=18..35}] at @s if entity @a[r=2] run spreadplayers ~ ~ 2 6 @s
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!focus, tag=!psy, tag=!pyro, scores={spook=300..320}] at @s if entity @a[r=2] run spreadplayers ~ ~ 2 6 @s

# === GUARDIAN INTEGRITY CHECK ===
# Ensure Obsessed Knocker always has guardian + follow active (re-fires if somehow lost)
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!guardian_on, tag=!focus, tag=!psy, tag=!pyro, scores={spook=200}] at @s run event entity @s guardian_on
# After a rush ends (focus removed), re-enable guardian+follow for Obsessed
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!focus, tag=!guardian_on, scores={spook=201..210}] at @s run event entity @s guardian_on
# Obsessed proximity follow nudge - gently pull him toward player when more than 16 blocks away
execute as @e[type=scary:knocker, tag=b_obsessed, tag=!focus, tag=!psy, tag=!pyro, scores={spook=9}] at @s unless entity @a[r=16] if entity @a[r=64] run tp @s @a[r=64, c=1] facing @a[r=64, c=1] true

# === PACIFIST THREATS - fires instead of combat when k_pacifist tag is set ===
# Only triggers when player is within attack range but combat is off
execute as @e[family=knocker, tag=b_watched] at @s if entity @a[r=4, scores={fakkel=13..16}, tag=k_pacifist, tag=!psy, tag=!pop] run scoreboard players random @s threatpick 1 4
execute as @e[family=knocker, tag=b_familiar] at @s if entity @a[r=3, scores={fakkel=27..38}, tag=k_pacifist, tag=!psy, tag=!pop] run scoreboard players random @s threatpick 1 4
execute as @e[family=knocker, tag=b_obsessed] at @s if entity @a[r=2, scores={fakkel=27..72}, tag=k_pacifist, tag=!psy, tag=!pop] run scoreboard players random @s threatpick 1 4
