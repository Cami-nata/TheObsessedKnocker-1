# Guía de Pruebas - Sistema Multijugador (Task 16.2)

## Resumen

Esta guía te ayudará a probar el sistema multijugador de "The Obsessed Knocker" para verificar que cada jugador tiene su propia instancia de El Acechador sin conflictos.

## Requisitos para las Pruebas

- **Mundo multijugador** (servidor dedicado, Realm, o LAN)
- **Mínimo 2 jugadores** (recomendado: 3 jugadores)
- **Addon instalado** en el mundo de prueba
- **Permisos de operador** para ejecutar comandos de verificación

## Preparación

1. **Crear un mundo de prueba multijugador:**
   - Crear un nuevo mundo
   - Activar "Multijugador visible" en la configuración
   - Instalar el addon "The Obsessed Knocker"
   - Activar cheats para comandos de verificación

2. **Conectar múltiples jugadores:**
   - Jugador 1: Host (tú)
   - Jugador 2: Amigo o segunda cuenta
   - (Opcional) Jugador 3: Para pruebas más completas

3. **Configuración inicial:**
   - Todos los jugadores deben tener bond = 0 inicialmente
   - No debe haber Knockers en el mundo al inicio

## Pruebas Paso a Paso

### ✅ Prueba 1: Cada Jugador Tiene Su Propio Knocker

**Objetivo:** Verificar que cada jugador tiene un Knocker único vinculado a ellos.

**Pasos:**
1. Ambos jugadores ejecutan el comando: `.bond`
2. Esperar 1 minuto (el sistema verifica cada 30 segundos)
3. Ejecutar comando: `/testfor @e[type=scary:knocker]`

**Resultado Esperado:**
- Se encuentran exactamente **2 Knockers** (uno por jugador)
- Cada Knocker tiene un tag único: `k_bound_to_<NombreJugador>`

**Verificación:**
```
/execute as @e[type=scary:knocker] run say Estoy vinculado a: @s
```
- Cada Knocker debe mostrar un nombre de jugador diferente

---

### ✅ Prueba 2: Los Knockers No Se Confunden

**Objetivo:** Verificar que el Knocker de un jugador no responde a otro jugador.

**Pasos:**
1. **Jugador 1** escribe en el chat: `hola`
2. Observar qué Knocker responde
3. **Jugador 2** escribe en el chat: `hola`
4. Observar qué Knocker responde

**Resultado Esperado:**
- Solo el Knocker de Jugador 1 responde al mensaje de Jugador 1
- Solo el Knocker de Jugador 2 responde al mensaje de Jugador 2
- No hay respuestas cruzadas

**Verificación:**
- El mensaje de respuesta debe aparecer solo para el jugador que escribió

---

### ✅ Prueba 3: Datos de Vínculo Independientes

**Objetivo:** Verificar que el bond (vínculo) de cada jugador es independiente.

**Pasos:**
1. **Jugador 1**: Interactúa con su Knocker usando la Vara Whisper 10 veces
2. **Jugador 1**: Ejecuta `.bond` y anota el valor
3. **Jugador 2**: NO interactúa con su Knocker
4. **Jugador 2**: Ejecuta `.bond` y anota el valor

**Resultado Esperado:**
- Bond de Jugador 1: > 0 (incrementó por las interacciones)
- Bond de Jugador 2: = 0 (no interactuó)
- Los valores son completamente independientes

**Verificación:**
```
# Como operador, ejecutar:
/scoreboard players list @a
```
- Cada jugador debe tener un score diferente en "bond"

---

### ✅ Prueba 4: Interacciones con Vara Whisper

**Objetivo:** Verificar que solo el Knocker vinculado responde a la Vara Whisper.

**Pasos:**
1. **Jugador 1** obtiene una Vara Whisper: `/give @s scary:whisper`
2. **Jugador 1** usa la Vara Whisper (clic derecho)
3. Observar qué Knocker responde
4. **Jugador 2** hace lo mismo
5. Observar qué Knocker responde

**Resultado Esperado:**
- Solo el Knocker de Jugador 1 abre el menú/diálogo para Jugador 1
- Solo el Knocker de Jugador 2 abre el menú/diálogo para Jugador 2
- No hay interferencia entre jugadores

---

### ✅ Prueba 5: Memoria Independiente

**Objetivo:** Verificar que la memoria de cada Knocker es independiente.

**Pasos:**
1. **Jugador 1**: Muere intencionalmente (caída, lava, etc.)
2. **Jugador 1**: Respawnea y usa Vara Whisper
3. Observar si el Knocker menciona la muerte
4. **Jugador 2**: NO muere, usa Vara Whisper
5. Observar si el Knocker menciona alguna muerte

**Resultado Esperado:**
- El Knocker de Jugador 1 puede mencionar o reaccionar a la muerte reciente
- El Knocker de Jugador 2 NO menciona ninguna muerte (porque Jugador 2 no murió)
- Las memorias son completamente separadas

---

### ✅ Prueba 6: Persistencia Entre Sesiones

**Objetivo:** Verificar que los datos persisten cuando un jugador se desconecta y reconecta.

**Pasos:**
1. **Jugador 1**: Interactúa hasta alcanzar bond = 150
2. **Jugador 1**: Ejecuta `.bond` para confirmar (debe mostrar 150)
3. **Jugador 1**: Se desconecta del mundo
4. Esperar 1 minuto
5. **Jugador 1**: Reconecta al mundo
6. **Jugador 1**: Ejecuta `.bond` nuevamente

**Resultado Esperado:**
- El bond sigue siendo 150 después de reconectar
- Los datos se mantienen entre sesiones
- Un nuevo Knocker se crea automáticamente para Jugador 1

**Verificación:**
```
/scoreboard players list Jugador1
```
- El score de "bond" debe seguir siendo 150

---

### ✅ Prueba 7: Cleanup de Knockers Huérfanos

**Objetivo:** Verificar que los Knockers de jugadores desconectados se eliminan.

**Pasos:**
1. **Jugador 2**: Se desconecta del mundo
2. Esperar 1 minuto (el cleanup se ejecuta cada 30 segundos)
3. **Jugador 1**: Ejecuta `/testfor @e[type=scary:knocker,tag=k_bound_to_Jugador2]`

**Resultado Esperado:**
- El comando NO encuentra ningún Knocker con el tag de Jugador 2
- El Knocker huérfano fue eliminado correctamente
- Solo queda el Knocker de Jugador 1 en el mundo

---

### ✅ Prueba 8: Re-creación al Reconectar

**Objetivo:** Verificar que un nuevo Knocker se crea cuando un jugador reconecta.

**Pasos:**
1. (Continuar desde Prueba 7)
2. **Jugador 2**: Reconecta al mundo
3. Esperar 1 minuto (el sistema verifica cada 30 segundos)
4. Ejecutar: `/testfor @e[type=scary:knocker,tag=k_bound_to_Jugador2]`

**Resultado Esperado:**
- El comando encuentra exactamente 1 Knocker con el tag de Jugador 2
- El nuevo Knocker está correctamente vinculado
- El bond de Jugador 2 se mantiene desde antes de desconectar

---

### ✅ Prueba 9: Logros Independientes

**Objetivo:** Verificar que los logros son independientes por jugador.

**Pasos:**
1. **Jugador 1**: Alcanza Tier 1 (bond >= 100)
2. Observar si recibe logro "Primera Mirada"
3. **Jugador 2**: Mantiene Tier 0 (bond < 100)
4. Observar si Jugador 2 recibe alguna notificación

**Resultado Esperado:**
- Solo Jugador 1 recibe la notificación de logro "Primera Mirada"
- Jugador 2 NO recibe ninguna notificación
- Los logros son completamente independientes

---

### ✅ Prueba 10: Tiers Diferentes

**Objetivo:** Verificar que cada jugador puede tener un tier diferente.

**Pasos:**
1. **Jugador 1**: Alcanza Tier 2 (bond >= 250)
2. **Jugador 2**: Mantiene Tier 0 (bond < 100)
3. Ambos jugadores usan Vara Whisper
4. Observar las respuestas

**Resultado Esperado:**
- El Knocker de Jugador 1 da respuestas de Tier 2 (apego notable)
- El Knocker de Jugador 2 da respuestas de Tier 0 (distante)
- Las respuestas son claramente diferentes en tono e intensidad

---

## Verificación con Comandos

### Ver todos los Knockers en el mundo
```
/testfor @e[type=scary:knocker]
```

### Ver Knockers vinculados a un jugador específico
```
/testfor @e[type=scary:knocker,tag=k_bound_to_NombreJugador]
```

### Ver el bond de todos los jugadores
```
/scoreboard players list @a
```

### Ver los tags de un Knocker específico
```
/execute as @e[type=scary:knocker,c=1] run tag @s list
```

### Forzar creación de Knockers
```
# El sistema lo hace automáticamente cada 30 segundos
# Pero si quieres forzarlo, cada jugador puede ejecutar:
.bond
```

## Interpretación de Resultados

### ✅ TODO CORRECTO si:
- Cada jugador tiene exactamente 1 Knocker
- Los Knockers solo responden a su jugador vinculado
- Los bonds son independientes
- Los datos persisten entre sesiones
- Los Knockers huérfanos se eliminan
- Los Knockers se re-crean al reconectar

### ❌ HAY UN PROBLEMA si:
- Un jugador tiene 0 o más de 1 Knocker
- Un Knocker responde a múltiples jugadores
- Los bonds se mezclan entre jugadores
- Los datos se pierden al desconectar
- Los Knockers huérfanos no se eliminan
- Aparecen errores en el log

## Logs a Revisar

Durante las pruebas, busca estos mensajes en el log de Minecraft:

**Mensajes buenos (normales):**
```
[Multiplayer] Knocker creado para NombreJugador con tag k_bound_to_NombreJugador
[Multiplayer] Knocker ya existe para NombreJugador
[Multiplayer] Eliminando Knocker huérfano de NombreJugador
§a[El Acechador] Sistema multijugador inicializado - Un Knocker por jugador.
```

**Mensajes malos (errores):**
```
Error al obtener Knocker para jugador NombreJugador
Error al crear Knocker para jugador NombreJugador
Error al buscar Knocker en dimensión overworld/nether/the_end
```

Si ves mensajes de error, reporta el problema con el log completo.

## Tabla de Resultados

Completa esta tabla mientras haces las pruebas:

| # | Prueba | Estado | Notas |
|---|--------|--------|-------|
| 1 | Cada jugador tiene su Knocker | ⬜ PASS / ⬜ FAIL | |
| 2 | Knockers no se confunden | ⬜ PASS / ⬜ FAIL | |
| 3 | Datos de vínculo independientes | ⬜ PASS / ⬜ FAIL | |
| 4 | Interacciones con Vara Whisper | ⬜ PASS / ⬜ FAIL | |
| 5 | Memoria independiente | ⬜ PASS / ⬜ FAIL | |
| 6 | Persistencia entre sesiones | ⬜ PASS / ⬜ FAIL | |
| 7 | Cleanup de huérfanos | ⬜ PASS / ⬜ FAIL | |
| 8 | Re-creación al reconectar | ⬜ PASS / ⬜ FAIL | |
| 9 | Logros independientes | ⬜ PASS / ⬜ FAIL | |
| 10 | Tiers diferentes | ⬜ PASS / ⬜ FAIL | |

**RESULTADO FINAL:** ⬜ TODAS PASAN / ⬜ ALGUNAS FALLAN

## Reporte de Problemas

Si encuentras algún problema durante las pruebas, reporta:

1. **Número de prueba** que falló
2. **Qué esperabas** que sucediera
3. **Qué sucedió** en realidad
4. **Logs relevantes** del juego
5. **Comandos ejecutados** antes del problema
6. **Número de jugadores** en el servidor

---

## Conclusión

Si todas las 10 pruebas pasan exitosamente, el sistema multijugador está funcionando correctamente y cumple todos los requisitos (9.2, 9.3, 9.4, 9.5).

**¡Disfruta jugando con amigos y que cada uno tenga su propio Acechador obsesivo!** 👻
