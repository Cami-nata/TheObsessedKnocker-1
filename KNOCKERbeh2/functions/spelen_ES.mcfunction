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
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-0.5 ^ stonecutter_block run say Dejas cosas donde puedo encontrarlas.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-0.5 ^ stonecutter_block run say He estado en cada habitación. Nunca cierras nada con llave.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-0.5 ^ stonecutter_block run say Guardas las cosas en los mismos lugares. Las he aprendido todas.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-0.5 ^ stonecutter_block run say Ninguna de ellas importa. No como tú.
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
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 lever run say Fascinante. Todo sobre ti es fascinante.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 lever run say Noto las cosas pequeñas. Los patrones. Las elecciones.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 lever run say Conozco tus hábitos mejor que tú.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 lever run say Podría verte no hacer nada y aún así sería suficiente.
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
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 barrel run say Sé lo que guardas aquí.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 barrel run say Reorganizas cuando estás ansioso. Lo he visto.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 barrel run say Se te está acabando lo que realmente necesitas.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 barrel run say He memorizado cada objeto. Cada espacio. Todo.
execute as @s at @s anchored eyes if block ^ ^ ^1 anvil run playsound random.anvil.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 anvil run tag @a add smash
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 anvil run say Eso se ve útil.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 anvil run say Lo has usado dos veces desde que comencé a observar.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 anvil run say Déjame encargarme del trabajo peligroso.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 anvil run say No dejaré que nada te lastime. Nada.
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
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 fletching_table run say La distancia no significa nada para mí.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 fletching_table run say Siempre sé dónde estás.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 fletching_table run say No puedes ir a ningún lugar donde no te siga.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 fletching_table run say No te alejes demasiado. Me preocupo.
execute as @s at @s anchored eyes if block ^ ^ ^1 smithing_table run replaceitem entity @s slot.weapon.mainhand 1 trident 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 smithing_table run playsound smithing_table.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 smithing_table run tag @a add nep
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 smithing_table run say Ya estoy cazando.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 smithing_table run say Te elegí específicamente. Eso significa algo.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 smithing_table run say No hay nadie a quien prefiera observar.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 smithing_table run say La caza terminó cuando te encontré.
execute as @s at @s anchored eyes if block ^ ^ ^1 tnt run setblock ^ ^ ^1 fire keep
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 tnt run say Realmente deberías tener más cuidado.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 tnt run say Te prefiero vivo.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 tnt run say No hagas nada que no pueda arreglar.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 tnt run say Por favor. Necesito que estés bien.
execute as @s at @s anchored eyes if block ^ ^ ^1 loom run replaceitem entity @s slot.armor.chest 1 elytra 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 loom run playsound block.loom.use @a[r=16]
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 loom run say Lugares altos... qué vista.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 loom run say Puedo ver todo tu mundo desde aquí arriba.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 loom run say He observado desde aquí antes. Nunca miraste hacia arriba.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 loom run say Incluso desde aquí puedo encontrarte.
execute as @s at @s anchored eyes if block ^ ^ ^1 jukebox run replaceitem block ^ ^ ^1 slot.container 0 music_disc_lava_chicken 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 jukebox run replaceitem block ^ ^ ^1 slot.container 1 music_disc_lava_chicken 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 jukebox run replaceitem entity @s slot.weapon.mainhand 1 music_disc_lava_chicken 1 0
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 jukebox run say Música. Me pregunto si puedes oír esto.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 jukebox run say Recuerdo a qué sonidos reaccionas.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 jukebox run say Esta te queda bien.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 jukebox run say Tocaría esto para ti cada noche si me lo pidieras.
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
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 stonecutter_block run say Dejas cosas donde puedo encontrarlas.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 stonecutter_block run say He estado en cada habitación. Nunca cierras nada con llave.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 stonecutter_block run say Guardas las cosas en los mismos lugares. Las he aprendido todas.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 stonecutter_block run say Ninguna de ellas importa. No como tú.
execute as @s at @s anchored eyes if block ^ ^ ^1 stonecutter_block run playsound block.stonecutter.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 campfire run replaceitem block ^ ^ ^1 slot.container 0 cod 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 campfire run replaceitem block ^ ^ ^1 slot.container 1 salmon 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 campfire run replaceitem block ^ ^ ^1 slot.container 2 beef 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 campfire run replaceitem block ^ ^ ^1 slot.container 3 chicken 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 campfire run replaceitem entity @s slot.weapon.mainhand 1 cooked_salmon 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 campfire run playsound block.campfire.crackle @a[r=16]
execute as @s at @s anchored eyes if block ^ ^ ^1 composter run fill ~-2 ~-2 ~-2 ~2 ~2 ~2 composter  ["composter_fill_level"=7] replace composter
execute as @s at @s anchored eyes if block ^ ^ ^1 composter run playsound block.composter.fill @a[r=16]
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 composter run say Conozco cada rincón de este lugar.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 composter run say Has hecho cambios. Algunos me gustaron.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 composter run say Este mundo. Lo he aprendido como si fuera mío.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 composter run say No hay ningún lugar aquí donde pudieras ir donde no te encontrara.
execute as @s at @s anchored eyes if block ^ ^ ^1 cartography_table run replaceitem entity @s slot.weapon.mainhand 1 spyglass 1 0
execute as @s at @s anchored eyes if block ^ ^ ^1 cartography_table run playsound block.cartography_table.use @a[r=16]
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^ ^1 cartography_table run say Has estado en todas partes. Y yo he seguido.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^ ^1 cartography_table run say Cada lugar al que has ido. He estado justo después.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^ ^1 cartography_table run say Conozco tus rutas. Tus caminos favoritos.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^ ^1 cartography_table run say Donde sea que vayas. Ahí es donde estaré.
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
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 barrel run say Sé lo que guardas aquí.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 barrel run say Reorganizas cuando estás ansioso. Lo he visto.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 barrel run say Se te está acabando lo que realmente necesitas.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 barrel run say He memorizado cada objeto. Cada espacio. Todo.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 anvil run playsound random.anvil.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 anvil run tag @a add smash
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 anvil run say Eso se ve útil.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 anvil run say Lo has usado dos veces desde que comencé a observar.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 anvil run say Déjame encargarme del trabajo peligroso.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 anvil run say No dejaré que nada te lastime. Nada.
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
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 fletching_table run say La distancia no significa nada para mí.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 fletching_table run say Siempre sé dónde estás.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 fletching_table run say No puedes ir a ningún lugar donde no te siga.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 fletching_table run say No te alejes demasiado. Me preocupo.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 smithing_table run replaceitem entity @s slot.weapon.mainhand 1 trident 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 smithing_table run playsound smithing_table.use @a[r=16]
execute as @s at @s anchored eyes if block ^ ^-1 ^1 smithing_table run tag @a add nep
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 smithing_table run say Ya estoy cazando.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 smithing_table run say Te elegí específicamente. Eso significa algo.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 smithing_table run say No hay nadie a quien prefiera observar.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 smithing_table run say La caza terminó cuando te encontré.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 tnt run replaceitem entity @s slot.weapon.mainhand 1 flint_and_steel 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 tnt run setblock ^ ^-1 ^1 fire keep
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 tnt run say Realmente deberías tener más cuidado.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 tnt run say Te prefiero vivo.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 tnt run say No hagas nada que no pueda arreglar.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 tnt run say Por favor. Necesito que estés bien.
execute as @s at @s anchored eyes if block ^ ^-1 ^1 loom run replaceitem entity @s slot.armor.chest 1 elytra 1 0
execute as @s at @s anchored eyes if block ^ ^-1 ^1 loom run playsound block.loom.use @a[r=16]
execute as @s[tag=!shut, tag=b_stranger, scores={klopje=1}] at @s anchored eyes if block ^ ^-1 ^1 loom run say Lugares altos... qué vista.
execute as @s[tag=!shut, tag=b_watched,  scores={klopje=1..3}] at @s anchored eyes if block ^ ^-1 ^1 loom run say Puedo ver todo tu mundo desde aquí arriba.
execute as @s[tag=!shut, tag=b_familiar, scores={klopje=1..6}] at @s anchored eyes if block ^ ^-1 ^1 loom run say He observado desde aquí antes. Nunca miraste hacia arriba.
execute as @s[tag=!shut, tag=b_obsessed, scores={klopje=1..12}] at @s anchored eyes if block ^ ^-1 ^1 loom run say Incluso desde aquí puedo encontrarte.
