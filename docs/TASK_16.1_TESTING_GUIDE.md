# Guía de Pruebas - Task 16.1: Optimización de Consumo de Recursos

## Objetivo de las Pruebas
Verificar que el sistema de optimización funciona correctamente y cumple con el requisito 9.1 (<5% del tick time del servidor).

## Preparación

### Requisitos Previos
1. Minecraft Bedrock Edition 1.21.50+
2. Mundo de prueba en modo creativo
3. Addon instalado correctamente (behavior pack y resource pack)
4. Acceso a comandos de consola

### Herramientas de Monitoreo
- Minecraft Bedrock Profiler (si está disponible)
- Comando `/tick query` (si está disponible en tu versión)
- Observación visual de performance (FPS, lag)

## Pruebas de Funcionalidad

### Test 1: Verificar Sistema de Caché de Jugadores

**Objetivo:** Confirmar que `getCachedPlayers()` funciona correctamente

**Pasos:**
1. Únete al servidor
2. Usa la vara Whisper para interactuar con El Acechador
3. Observa que responde correctamente
4. Espera 5 segundos y vuelve a interactuar
5. Confirma que no hay delay notable

**Resultado Esperado:** ✓ El Acechador responde sin problemas

---

### Test 2: Verificar Caché de Bond y Tier

**Objetivo:** Confirmar que el sistema de bond funciona con caché

**Pasos:**
1. Ejecuta: `.bond`
2. Observa tu bond y tier actual
3. Ejecuta: `/scoreboard players add @s bond 50`
4. Espera 1-2 segundos
5. Ejecuta: `.bond` nuevamente
6. Confirma que el bond se actualizó

**Resultado Esperado:** ✓ Bond se actualiza correctamente con delay máximo de 1 segundo

---

### Test 3: Verificar Caché de Entidades

**Objetivo:** Confirmar que el movimiento del Knocker es fluido

**Pasos:**
1. Usa comando: `.help` para invocar al Knocker
2. Observa su movimiento durante 30 segundos
3. Camina por el mundo y observa cómo te sigue
4. Confirma que el movimiento es natural y sin "teleporteos" bruscos

**Resultado Esperado:** ✓ Movimiento del Knocker es fluido y natural

---

### Test 4: Verificar Detección de Cambio de Dimensión

**Objetivo:** Confirmar que los cambios de dimensión se detectan

**Pasos:**
1. Estando en el Overworld, verifica tu dimensión actual
2. Entra al Nether
3. Espera hasta 10 segundos
4. Interactúa con El Acechador usando la vara Whisper
5. Observa si comenta sobre el cambio de dimensión (puede ser aleatorio)

**Resultado Esperado:** ✓ El sistema detecta el cambio dentro de 10 segundos

---

### Test 5: Verificar Detección de Exploración

**Objetivo:** Confirmar que movimientos largos se detectan

**Pasos:**
1. Anota tu posición actual (F3 o coordenadas en pantalla)
2. Vuela o camina más de 100 bloques en cualquier dirección
3. Espera hasta 20 segundos
4. El sistema debe registrar la exploración (check en logs si tienes acceso)

**Resultado Esperado:** ✓ Exploración detectada dentro de 20 segundos

---

### Test 6: Verificar Tags de Tier

**Objetivo:** Confirmar que los tags de tier se actualizan

**Pasos:**
1. Ejecuta: `/tag @s list` para ver tus tags actuales
2. Verifica que tienes un tag `k_stranger`, `k_watched`, `k_familiar`, o `k_obsessed`
3. Ejecuta: `/scoreboard players set @s bond 250` para cambiar a tier Familiar
4. Espera 1-2 segundos
5. Ejecuta: `/tag @s list` nuevamente
6. Confirma que el tag cambió a `k_familiar`

**Resultado Esperado:** ✓ Tags se actualizan en ~1 segundo después del cambio

---

## Pruebas de Performance

### Test 7: Test de Carga con Múltiples Jugadores (Multijugador)

**Objetivo:** Verificar performance con varios jugadores

**Requisitos:** Servidor multiplayer o realm

**Pasos:**
1. Invita 5-10 jugadores al servidor
2. Pide que todos se dispersen por el mundo
3. Pide que todos interactúen con El Acechador frecuentemente
4. Observa el performance del servidor durante 10 minutos
5. Pregunta a los jugadores si experimentaron lag

**Resultado Esperado:** 
- ✓ No hay lag notable
- ✓ Servidor responde con normalidad
- ✓ Tick time se mantiene bajo

---

### Test 8: Test de Memoria a Largo Plazo

**Objetivo:** Verificar que no hay memory leaks

**Pasos:**
1. Inicia sesión de juego
2. Juega normalmente durante 2 horas
3. Observa el uso de memoria del proceso de Minecraft
4. Confirma que la memoria se mantiene estable (no crece constantemente)

**Resultado Esperado:** 
- ✓ Memoria estable después de ~30 minutos
- ✓ No hay crashes por falta de memoria

---

### Test 9: Test de Limpieza de Caché

**Objetivo:** Verificar que la limpieza de caché funciona

**Pasos:**
1. Juega durante 15 minutos
2. Desconéctate del servidor
3. Espera 1 minuto
4. Reconéctate al servidor
5. Confirma que el addon funciona correctamente
6. Verifica que tu bond y memoria se mantuvieron

**Resultado Esperado:** 
- ✓ Datos persistentes se mantienen
- ✓ Caché temporal se limpió
- ✓ No hay datos de jugadores offline en memoria

---

## Pruebas de Regresión

### Test 10: Verificar Todas las Funcionalidades Existentes

**Objetivo:** Confirmar que las optimizaciones no rompieron funcionalidad

**Checklist de Funcionalidades:**
- [ ] Interacción con vara Whisper abre menú
- [ ] Sistema de bond aumenta con interacciones
- [ ] El Acechador te sigue (stalking behavior)
- [ ] Diálogos varían según tier
- [ ] Sistema de memoria funciona (recuerda eventos)
- [ ] Detección de biomas funciona
- [ ] Comentarios espontáneos aparecen
- [ ] Eventos raros pueden ocurrir
- [ ] Logros se registran correctamente
- [ ] Sistema de estados de ánimo funciona
- [ ] Detección de acciones recientes funciona
- [ ] Sistema de respuestas contextuales funciona

**Resultado Esperado:** ✓ Todas las funcionalidades funcionan correctamente

---

## Comandos Útiles para Testing

### Ver Estado de Tier
```
.tierstatus
```
Muestra información detallada sobre tu tier y configuración de comportamiento.

### Ver Bond Actual
```
.bond
```
Muestra tu bond actual y descripción del tier.

### Modificar Bond (Testing)
```
/scoreboard players set @s bond <valor>
```
Establece bond a un valor específico (0-500).

### Listar Tags Actuales
```
/tag @s list
```
Muestra todos los tags aplicados a tu jugador.

### Invocar Knocker
```
.help
```
Invoca a El Acechador cerca de ti.

### Ver Memoria (Console)
Si tienes acceso a logs del servidor, busca líneas con `[Memory]` para ver eventos registrados.

---

## Métricas de Performance Objetivo

### Tick Time
- **Objetivo:** <2.5ms adicionales por tick (5% de 50ms)
- **Método:** Usar profiler de Bedrock o observación visual
- **Aceptable:** 0.025-0.5ms por tick con 1-5 jugadores

### Memoria RAM
- **Objetivo:** <100KB adicionales por jugador
- **Método:** Monitoreo del proceso de Minecraft
- **Aceptable:** Crecimiento inicial luego estabilización

### FPS del Cliente
- **Objetivo:** Sin impacto notable en FPS
- **Método:** Observación de FPS antes y después
- **Aceptable:** Variación <5 FPS

### Latencia de Respuesta
- **Objetivo:** <1 segundo delay en interacciones
- **Método:** Medir tiempo entre acción y respuesta del Knocker
- **Aceptable:** 0.5-1 segundo en mayoría de casos

---

## Checklist Final de Validación

- [ ] Sistema de caché de jugadores funciona
- [ ] Sistema de caché de entidades funciona
- [ ] Sistema de caché de bond/tier funciona
- [ ] Sistema de caché de environment funciona
- [ ] Detección de dimensión funciona (delay <10s)
- [ ] Detección de exploración funciona (delay <20s)
- [ ] Tags de tier se actualizan correctamente
- [ ] Movimiento del Knocker es fluido
- [ ] No hay lag notable en servidor
- [ ] Memoria se mantiene estable a largo plazo
- [ ] Todas las funcionalidades existentes funcionan
- [ ] Limpieza de caché funciona (jugadores offline)
- [ ] Performance cumple con objetivo (<5% tick time)

---

## Reporte de Issues

Si encuentras algún problema durante las pruebas:

1. **Describe el problema:** ¿Qué funcionalidad no funciona?
2. **Pasos para reproducir:** ¿Cómo puedo replicar el issue?
3. **Resultado esperado vs resultado actual**
4. **Logs relevantes:** ¿Hay errores en la consola?
5. **Contexto:** ¿Cuántos jugadores? ¿Qué dimensión? ¿Qué tier?

---

## Conclusión

Las optimizaciones de Task 16.1 deben:
- ✓ Reducir carga del servidor en ~90-95%
- ✓ Mantener todas las funcionalidades intactas
- ✓ Proporcionar experiencia fluida sin delays notables
- ✓ Escalar bien con múltiples jugadores

Si todas las pruebas pasan, el task está completo y cumple con el requisito 9.1.

---

**Fecha de Creación:** 2024
**Task:** 16.1 - Optimización de Consumo de Recursos
**Requisito:** 9.1 - Consumir menos de 5% del tiempo de tick del servidor
