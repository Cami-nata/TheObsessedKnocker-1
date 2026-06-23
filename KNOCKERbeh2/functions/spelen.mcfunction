execute as @s at @s anchored eyes if block ^ ^-0.5 ^ campfire run replaceitem block ^ ^-0.5 ^ slot.container 0 cod 1 0
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ campfire run replaceitem block ^ ^-0.5 ^ slot.container 1 salmon 1 0
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ campfire run replaceitem block ^ ^-0.5 ^ slot.container 2 beef 1 0
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ campfire run replaceitem block ^ ^-0.5 ^ slot.container 3 chicken 1 0
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ campfire run replaceitem entity @s slot.weapon.mainhand 1 cooked_salmon 1 0
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ campfire run playsound block.campfire.crackle @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ bed run playsound bucket.empty_fish @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ bed run playsound mob.fish.flop @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ brewing_stand run replaceitem block ^ ^-0.5 ^ slot.container 1 potion 1 0
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ brewing_stand run replaceitem block ^ ^-0.5 ^ slot.container 2 potion 1 0
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ brewing_stand run replaceitem block ^ ^-0.5 ^ slot.container 3 potion 1 0
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ brewing_stand run replaceitem block ^ ^-0.5 ^ slot.container 4 blaze_powder 1 0
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ brewing_stand run replaceitem block ^ ^-0.5 ^ slot.container 0 nether_wart 1 0
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ brewing_stand run playsound random.potion.brewed @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ stonecutter_block run replaceitem block ^ ^-0.5 ^ slot.container 0 bone 1 0
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ stonecutter_block run replaceitem block ^ ^-0.5 ^ slot.container 1 bone 1 0
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ stonecutter_block run replaceitem entity @s slot.weapon.mainhand 1 bone 1 0
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-0.5 ^ stonecutter_block run say You leave things where I can find them.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-0.5 ^ stonecutter_block run say I've been through every room. You never lock anything.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-0.5 ^ stonecutter_block run say You keep things in the same places. I've learned them all.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-0.5 ^ stonecutter_block run say None of them matter. Not the way you do.
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ stonecutter_block run playsound block.stonecutter.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-0.5 ^ lectern run replaceitem entity @s slot.weapon.mainhand 1 writable_book 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^ campfire run replaceitem block ^ ^-1 ^ slot.container 0 cod 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^ campfire run replaceitem block ^ ^-1 ^ slot.container 1 salmon 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^ campfire run replaceitem block ^ ^-1 ^ slot.container 2 beef 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^ campfire run replaceitem block ^ ^-1 ^ slot.container 3 chicken 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^ campfire run replaceitem entity @s slot.weapon.mainhand 1 cooked_salmon 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^ campfire run playsound block.campfire.crackle @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^ bed run playsound bucket.empty_fish @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^ bed run playsound mob.fish.flop @a[r=16]
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 lever run say Fascinating. Everything about you is fascinating.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 lever run say I notice the small things. The patterns. The choices.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 lever run say I know your habits better than you do.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 lever run say I could watch you do nothing and it would still be enough.
execute as @s at @s anchored eyes if block ^ ^ ^1 bed run playsound bucket.empty_fish @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 bed run playsound mob.fish.flop @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 cake run playsound random.burp @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 air replace cake ["bite_counter"=6]
execute as @s at @s anchored eyes if block ^ ^ ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 cake ["bite_counter"=6] replace cake ["bite_counter"=5]
execute as @s at @s anchored eyes if block ^ ^ ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 cake ["bite_counter"=5] replace cake ["bite_counter"=4]
execute as @s at @s anchored eyes if block ^ ^ ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 cake ["bite_counter"=4] replace cake ["bite_counter"=3]
execute as @s at @s anchored eyes if block ^ ^ ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 cake ["bite_counter"=3] replace cake ["bite_counter"=2]
execute as @s at @s anchored eyes if block ^ ^ ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 cake ["bite_counter"=2] replace cake ["bite_counter"=1]
execute as @s at @s anchored eyes if block ^ ^ ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 cake ["bite_counter"=1] replace cake ["bite_counter"=0]
execute as @s at @s anchored eyes if block ^ ^ ^1 furnace run replaceitem block ^ ^ ^1 slot.container 0 chicken 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 furnace run replaceitem block ^ ^ ^1 slot.container 1 coal 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 smoker run replaceitem block ^ ^ ^1 slot.container 0 salmon 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 smoker run replaceitem block ^ ^ ^1 slot.container 1 wooden_door 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 blast_furnace run replaceitem block ^ ^ ^1 slot.container 0 raw_iron 3 0
execute as @s at @s anchored eyes if block ^ ^ ^1 blast_furnace run replaceitem block ^ ^ ^1 slot.container 1 coal 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 furnace run playsound block.furnace.lit @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 blast_furnace run playsound block.blastfurnace.fire_crackle @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 smoker run playsound block.smoker.smoke @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 barrel run replaceitem entity @s slot.weapon.mainhand 1 cod 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 barrel run playsound block.barrel.open @a[r=16]
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 barrel run say I know what you keep in here.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 barrel run say You reorganize when you're anxious. I've seen it.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 barrel run say You're running low on things you actually need.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 barrel run say I've memorized every item. Every slot. Everything.
execute as @s at @s anchored eyes if block ^ ^ ^1 anvil run playsound random.anvil.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 anvil run tag @a add smash
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 anvil run say That looks useful.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 anvil run say You've used that twice since I started watching.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 anvil run say Let me handle the dangerous work.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 anvil run say I won't let anything hurt you. Nothing.
execute as @s at @s anchored eyes if block ^ ^ ^1 crafting_table run replaceitem entity @s[scores={fakkel=1}] slot.weapon.mainhand 1 wooden_pickaxe 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 crafting_table run replaceitem entity @s[scores={fakkel=2}] slot.weapon.mainhand 1 enchanted_golden_apple 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 crafting_table run replaceitem entity @s[scores={fakkel=3}] slot.weapon.mainhand 1 netherite_sword 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 crafting_table run playsound crafter.craft @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 bookshelf run replaceitem entity @s slot.weapon.mainhand 1 book 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 bookshelf run enchant @s mending 0
execute as @s at @s anchored eyes if block ^ ^ ^1 bookshelf run playsound item.book.put @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 enchanting_table run replaceitem block ^ ^ ^1 slot.container 1 air 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 enchanting_table run replaceitem entity @s slot.weapon.mainhand 1 lapis_lazuli 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 enchanting_table run playsound block.enchanting_table.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 brewing_stand run replaceitem block ^ ^ ^1 slot.container 1 potion 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 brewing_stand run replaceitem block ^ ^ ^1 slot.container 2 potion 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 brewing_stand run replaceitem block ^ ^ ^1 slot.container 3 potion 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 brewing_stand run replaceitem block ^ ^ ^1 slot.container 4 blaze_powder 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 brewing_stand run replaceitem block ^ ^ ^1 slot.container 0 nether_wart 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 brewing_stand run playsound random.potion.brewed @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 chest run replaceitem entity @s slot.weapon.mainhand 1 bread 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 chest run playsound random.chestopen @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 ender_chest run replaceitem entity @s slot.weapon.mainhand 1 chorus_fruit 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 ender_chest run playsound random.enderchestopen @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 fletching_table run replaceitem entity @s slot.weapon.mainhand 1 bow 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 fletching_table run playsound crafter.craft @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 fletching_table run tag @a add robin
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 fletching_table run say Distance means nothing to me.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 fletching_table run say I always know where you are.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 fletching_table run say You can't go anywhere I won't follow.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 fletching_table run say Don't wander too far. I worry.
execute as @s at @s anchored eyes if block ^ ^ ^1 smithing_table run replaceitem entity @s slot.weapon.mainhand 1 trident 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 smithing_table run playsound smithing_table.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 smithing_table run tag @a add nep
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 smithing_table run say I'm already hunting.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 smithing_table run say I chose you specifically. That means something.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 smithing_table run say There's no one I'd rather watch.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 smithing_table run say The hunt ended when I found you.
execute as @s at @s anchored eyes if block ^ ^ ^1 tnt run setblock ^ ^ ^1 fire keep
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 tnt run say You really should be more careful.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 tnt run say I'd prefer you alive.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 tnt run say Don't do anything I can't fix.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 tnt run say Please. I need you to be okay.
execute as @s at @s anchored eyes if block ^ ^ ^1 loom run replaceitem entity @s slot.armor.chest 1 elytra 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 loom run playsound block.loom.use @a[r=16]
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 loom run say High places... what a view.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 loom run say I can see your whole world from up here.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 loom run say I've watched from here before. You never looked up.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 loom run say Even from here I can find you.
execute as @s at @s anchored eyes if block ^ ^ ^1 jukebox run replaceitem block ^ ^ ^1 slot.container 0 music_disc_lava_chicken 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 jukebox run replaceitem block ^ ^ ^1 slot.container 1 music_disc_lava_chicken 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 jukebox run replaceitem entity @s slot.weapon.mainhand 1 music_disc_lava_chicken 1 0
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 jukebox run say Music. I wonder if you can hear this.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 jukebox run say I remember what sounds you react to.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 jukebox run say This one suits you.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 jukebox run say I'd play this for you every night if you asked.
execute as @s at @s anchored eyes if block ^ ^ ^1 jukebox run playsound record.lava_chicken @a[r=28]
execute as @s at @s anchored eyes if block ^ ^ ^1 grindstone run replaceitem block ^ ^ ^1 slot.container 0 iron_axe 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 grindstone run playsound block.grindstone.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 grindstone run replaceitem entity @s slot.weapon.mainhand 1 golden_sword 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 undyed_shulker_box run playsound random.shulkerboxopen @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 undyed_shulker_box run replaceitem entity @s slot.weapon.mainhand 1 cookie 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 beehive run playsound random.drink_honey @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 beehive run replaceitem entity @s slot.weapon.mainhand 1 honey_bottle 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 cauldron run playsound random.drink_honey @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 cauldron run replaceitem entity @s slot.weapon.mainhand 1 goat_horn 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 stonecutter_block run replaceitem block ^ ^ ^1 slot.container 0 bone 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 stonecutter_block run replaceitem block ^ ^ ^1 slot.container 1 bone 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 stonecutter_block run replaceitem entity @s slot.weapon.mainhand 1 bone 1 0
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 stonecutter_block run say You leave things where I can find them.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 stonecutter_block run say I've been through every room. You never lock anything.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 stonecutter_block run say You keep things in the same places. I've learned them all.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 stonecutter_block run say None of them matter. Not the way you do.
execute as @s at @s anchored eyes if block ^ ^ ^1 stonecutter_block run playsound block.stonecutter.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 campfire run replaceitem block ^ ^ ^1 slot.container 0 cod 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 campfire run replaceitem block ^ ^ ^1 slot.container 1 salmon 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 campfire run replaceitem block ^ ^ ^1 slot.container 2 beef 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 campfire run replaceitem block ^ ^ ^1 slot.container 3 chicken 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 campfire run replaceitem entity @s slot.weapon.mainhand 1 cooked_salmon 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 campfire run playsound block.campfire.crackle @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 composter run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 composter  ["composter_fill_level"=7] replace composter
execute as @s at @s anchored eyes if block ^ ^ ^1 composter run playsound block.composter.fill @a[r=16]
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 composter run say I know every corner of this place.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 composter run say You've made changes. Some of them I liked.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 composter run say This world. I've learned it like it's mine.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 composter run say There's nowhere here you could go that I wouldn't find you.
execute as @s at @s anchored eyes if block ^ ^ ^1 cartography_table run replaceitem entity @s slot.weapon.mainhand 1 spyglass 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 cartography_table run playsound block.cartography_table.use @a[r=16]
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 cartography_table run say You've been everywhere. And I've followed.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 cartography_table run say Every place you've gone. I've been right after.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 cartography_table run say I know your routes. Your favorite paths.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 cartography_table run say Wherever you go. That's where I'll be.
execute as @s at @s anchored eyes if block ^ ^ ^1 lectern run replaceitem entity @s slot.weapon.mainhand 1 writable_book 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 bed run playsound bucket.empty_fish @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 bed run playsound mob.fish.flop @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 cake run playsound random.burp @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 air replace cake ["bite_counter"=6]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 cake ["bite_counter"=6] replace cake ["bite_counter"=5]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 cake ["bite_counter"=5] replace cake ["bite_counter"=4]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 cake ["bite_counter"=4] replace cake ["bite_counter"=3]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 cake ["bite_counter"=3] replace cake ["bite_counter"=2]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 cake ["bite_counter"=2] replace cake ["bite_counter"=1]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 cake run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 cake ["bite_counter"=1] replace cake ["bite_counter"=0]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 furnace run replaceitem block ^ ^-1 ^1 slot.container 0 chicken 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 furnace run replaceitem block ^ ^-1 ^1 slot.container 1 coal 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 smoker run replaceitem block ^ ^-1 ^1 slot.container 0 salmon 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 smoker run replaceitem block ^ ^-1 ^1 slot.container 1 wooden_door 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 blast_furnace run replaceitem block ^ ^-1 ^1 slot.container 0 raw_iron 3 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 blast_furnace run replaceitem block ^ ^-1 ^1 slot.container 1 coal 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 furnace run playsound block.furnace.lit @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 blast_furnace run playsound block.blastfurnace.fire_crackle @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 smoker run playsound block.smoker.smoke @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 barrel run replaceitem entity @s slot.weapon.mainhand 1 cod 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 barrel run playsound block.barrel.open @a[r=16]
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 barrel run say I know what you keep in here.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 barrel run say You reorganize when you're anxious. I've seen it.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 barrel run say You're running low on things you actually need.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 barrel run say I've memorized every item. Every slot. Everything.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 anvil run playsound random.anvil.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 anvil run tag @a add smash
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 anvil run say That looks useful.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 anvil run say You've used that twice since I started watching.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 anvil run say Let me handle the dangerous work.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 anvil run say I won't let anything hurt you. Nothing.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 crafting_table run replaceitem entity @s[scores={fakkel=1}] slot.weapon.mainhand 1 fishing_rod 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 crafting_table run replaceitem entity @s[scores={fakkel=2}] slot.weapon.mainhand 1 enchanted_golden_apple 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 crafting_table run replaceitem entity @s[scores={fakkel=3}] slot.weapon.mainhand 1 netherite_pickaxe 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 crafting_table run playsound crafter.craft @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 bookshelf run replaceitem entity @s slot.weapon.mainhand 1 book 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 bookshelf run enchant @s mending 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 bookshelf run playsound item.book.put @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 enchanting_table run replaceitem block ^ ^-1 ^1 slot.container 1 air 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 enchanting_table run replaceitem entity @s slot.weapon.mainhand 1 lapis_lazuli 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 enchanting_table run playsound block.enchanting_table.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 brewing_stand run replaceitem block ^ ^-1 ^1 slot.container 1 potion 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 brewing_stand run replaceitem block ^ ^-1 ^1 slot.container 2 potion 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 brewing_stand run replaceitem block ^ ^-1 ^1 slot.container 3 potion 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 brewing_stand run replaceitem block ^ ^-1 ^1 slot.container 4 blaze_powder 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 brewing_stand run replaceitem block ^ ^-1 ^1 slot.container 0 nether_wart 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 brewing_stand run playsound random.potion.brewed @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 chest run replaceitem entity @s slot.weapon.mainhand 1 bread 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 chest run playsound random.chestopen @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 ender_chest run replaceitem entity @s slot.weapon.mainhand 1 chorus_fruit 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 ender_chest run playsound random.enderchestopen @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 fletching_table run replaceitem entity @s slot.weapon.mainhand 1 bow 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 fletching_table run playsound crafter.craft @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 fletching_table run tag @a add robin
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 fletching_table run say Distance means nothing to me.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 fletching_table run say I always know where you are.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 fletching_table run say You can't go anywhere I won't follow.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 fletching_table run say Don't wander too far. I worry.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 smithing_table run replaceitem entity @s slot.weapon.mainhand 1 trident 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 smithing_table run playsound smithing_table.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 smithing_table run tag @a add nep
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 smithing_table run say I'm already hunting.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 smithing_table run say I chose you specifically. That means something.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 smithing_table run say There's no one I'd rather watch.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 smithing_table run say The hunt ended when I found you.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 tnt run replaceitem entity @s slot.weapon.mainhand 1 flint_and_steel 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 tnt run setblock ^ ^-1 ^1 fire keep
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 tnt run say You really should be more careful.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 tnt run say I'd prefer you alive.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 tnt run say Don't do anything I can't fix.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 tnt run say Please. I need you to be okay.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 loom run replaceitem entity @s slot.armor.chest 1 elytra 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 loom run playsound block.loom.use @a[r=16]
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 loom run say High places... what a view.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 loom run say I can see your whole world from up here.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 loom run say I've watched from here before. You never looked up.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 loom run say Even from here I can find you.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 jukebox run replaceitem block ^ ^-1 ^1 slot.container 0 music_disc_lava_chicken 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 jukebox run replaceitem block ^ ^-1 ^1 slot.container 1 music_disc_lava_chicken 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 jukebox run replaceitem entity @s slot.weapon.mainhand 1 music_disc_lava_chicken 1 0
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 jukebox run say Music. I wonder if you can hear this.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 jukebox run say I remember what sounds you react to.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 jukebox run say This one suits you.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 jukebox run say I'd play this for you every night if you asked.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 jukebox run playsound record.lava_chicken @a[r=28]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 grindstone run replaceitem block ^ ^-1 ^1 slot.container 0 iron_axe 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 grindstone run playsound block.grindstone.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 grindstone run replaceitem entity @s slot.weapon.mainhand 1 golden_sword 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 undyed_shulker_box run playsound random.shulkerboxopen @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 undyed_shulker_box run replaceitem entity @s slot.weapon.mainhand 1 cookie 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 beehive run playsound random.drink_honey @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 beehive run replaceitem entity @s slot.weapon.mainhand 1 honey_bottle 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 cauldron run playsound random.drink_honey @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 cauldron run replaceitem entity @s slot.weapon.mainhand 1 goat_horn 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 stonecutter_block run replaceitem block ^ ^-1 ^1 slot.container 0 bone 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 stonecutter_block run replaceitem block ^ ^-1 ^1 slot.container 1 bone 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 stonecutter_block run replaceitem entity @s slot.weapon.mainhand 1 bone 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 stonecutter_block run say You leave things where I can find them.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 stonecutter_block run playsound block.stonecutter.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 campfire run replaceitem block ^ ^-1 ^1 slot.container 0 cod 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 campfire run replaceitem block ^ ^-1 ^1 slot.container 1 salmon 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 campfire run replaceitem block ^ ^-1 ^1 slot.container 2 beef 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 campfire run replaceitem block ^ ^-1 ^1 slot.container 3 chicken 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 campfire run replaceitem entity @s slot.weapon.mainhand 1 cooked_salmon 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 campfire run playsound block.campfire.crackle @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 composter run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 composter  ["composter_fill_level"=7] replace composter
execute as @s at @s anchored eyes if block ^ ^-1 ^1 composter run playsound block.composter.fill @a[r=16]
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 composter run say I know every corner of this place.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 composter run say You've made changes. Some of them I liked.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 composter run say This world. I've learned it like it's mine.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 composter run say There's nowhere here you could go that I wouldn't find you.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 cartography_table run replaceitem entity @s slot.weapon.mainhand 1 spyglass 1 0
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 cartography_table run say You've been everywhere. And I've followed.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 cartography_table run say Every place you've gone. I've been right after.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 cartography_table run say I know your routes. Your favorite paths.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 cartography_table run say Wherever you go. That's where I'll be.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 cartography_table run playsound block.cartography_table.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 lectern run replaceitem entity @s slot.weapon.mainhand 1 writable_book 1 0
execute as @s at @s run playanimation @s animation.knocker.chest
tag @s add wijs