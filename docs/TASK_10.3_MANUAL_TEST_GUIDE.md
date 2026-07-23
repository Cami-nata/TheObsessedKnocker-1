# Guía de Pruebas Manuales: Task 10.3 - Efecto Weeping Angel

## Objetivo
Verificar manualmente que el sistema de ocultamiento basado en mirada funciona correctamente en el juego.

---

## Prerrequisitos

### Configuración del Mundo
1. Crear o usar un mundo de Minecraft Bedrock Edition 1.21.50+
2. Activar el Behavior Pack `KNOCKERbeh2`
3. Activar el Resource Pack `KNOCKERres2`
4. Modo de juego: Creativo o Supervivencia
5. Tiempo recomendado: Día (para mejor visibilidad)

### Herramientas Necesarias
- Vara Whisper (para invocar al Knocker si es necesario)
- Comando `/function spelen` o `/function spelen_ES` para iniciar el addon
- Bloques de construcción (para pruebas de línea de vista)

---

## Test 1: Detección Básica de Mirada

### Objetivo
Verificar que el Knocker se vuelve invisible cuando el jugador lo mira directamente.

### Pasos
1. Invocar al Knocker cerca del jugador (distancia ~20 bloques)
2. **IMPORTANTE:** Esperar al menos 10 segundos para que el sistema se actualice
3. Mirar directamente al Knocker (centrar la cruz en el centro de la entidad)
4. Esperar 10 segundos (tiempo de actualización del sistema)
5. Observar si el Knocker se vuelve invisible

### Resultado Esperado
✅ El Knocker debe volverse invisible (o semi-transparente)
✅ El Knocker debe dejar de moverse (velocidad reducida a 0.05x)

### Notas
- El sistema se actualiza cada 10 segundos (200 ticks)
- Si no ves cambios inmediatos, espera el próximo ciclo de actualización
- El efecto de invisibilidad dura 2 segundos y se reaplica cada ciclo

---

## Test 2: Revelación al Desviar la Mirada

### Objetivo
Verificar que el Knocker reaparece cuando el jugador desvía la mirada.

### Pasos
1. Con el Knocker invisible (resultado del Test 1)
2. Desviar la mirada hacia otro lado (girar completamente)
3. Esperar 10 segundos para el próximo ciclo de actualización
4. Observar si el Knocker reaparece

### Resultado Esperado
✅ El Knocker debe reaparecer (volverse visible)
✅ El Knocker debe poder moverse normalmente

### Notas
- No necesitas mirar completamente en dirección opuesta
- Basta con que el Knocker salga del cono de visión de ~28 grados
- El Knocker puede moverse hacia ti cuando no lo miras (comportamiento correcto)

---

## Test 3: Prueba del Cono de Visión (28 grados)

### Objetivo
Verificar que el ángulo de detección funciona correctamente.

### Pasos
1. Posicionar al Knocker directamente enfrente a ~15 bloques
2. Mirar directamente al Knocker (debe volverse invisible)
3. Lentamente, girar la cámara hacia un lado mientras mantienes al Knocker visible en el borde de la pantalla
4. Esperar ciclos de actualización (10 segundos)
5. Observar en qué momento el Knocker reaparece

### Resultado Esperado
✅ El Knocker debe reaparecer cuando ya no estás mirándolo directamente
✅ Debe haber una zona clara de "mirando" vs "no mirando"

### Diagrama de Referencia
```
        Knocker visible
            ╱│╲
           ╱ │ ╲
          ╱  │  ╲
         ╱   │   ╲
        ╱ 28°│28° ╲
       ╱     │     ╲
      ╱      │      ╲
     ────────P────────
        (Jugador)

Dentro del cono = Knocker invisible
Fuera del cono = Knocker visible
```

---

## Test 4: Prueba de Distancia Máxima (64 bloques)

### Objetivo
Verificar que la detección funciona hasta 64 bloques y no más allá.

### Pasos
1. Posicionar al Knocker a exactamente 64 bloques de distancia
2. Mirar directamente hacia el Knocker
3. Esperar ciclo de actualización
4. Verificar si el Knocker se vuelve invisible
5. Alejarse más (70+ bloques)
6. Mirar al Knocker y verificar que NO se vuelve invisible

### Resultado Esperado
✅ A 64 bloques o menos: El Knocker debe volverse invisible
✅ A más de 64 bloques: El Knocker permanece visible (fuera de rango)

### Cómo Medir Distancia
- Usar comando `/tp` para posicionar con precisión
- O usar bloques de referencia (cada bloque = 1 unidad)
- Coordenadas F3 (Bedrock: mostrar coordenadas en configuración)

---

## Test 5: Verificación de Línea de Vista (< 32 bloques)

### Objetivo
Verificar que bloques sólidos entre jugador y Knocker previenen detección.

### Pasos
1. Posicionar al Knocker a 20 bloques de distancia
2. Construir una pared sólida entre tú y el Knocker (vidrio, piedra, etc.)
3. Mirar en dirección al Knocker (a través de la pared)
4. Esperar ciclo de actualización
5. Observar si el Knocker se vuelve invisible

### Resultado Esperado
✅ Con pared sólida: El Knocker debe permanecer visible (sin línea de vista)
✅ Sin pared: El Knocker debe volverse invisible

### Bloques a Probar
- ✅ Piedra, madera, tierra (sólidos): BLOQUEAN línea de vista
- ✅ Vidrio: BLOQUEA línea de vista (Minecraft lo considera sólido)
- ⚠️ Aire, agua: NO bloquean línea de vista

---

## Test 6: Registro en Memoria

### Objetivo
Verificar que el sistema registra eventos cuando atrapas al Knocker mirándote.

### Pasos
1. Mirar al Knocker hasta que se vuelva invisible
2. Usar el comando `.bond` para verificar estado (si disponible)
3. Interactuar con la Vara Whisper
4. Escuchar si El Acechador menciona que "te vio mirándolo"

### Resultado Esperado
✅ El evento debe registrarse en la memoria del jugador
✅ Cooldown de 60 segundos entre registros (para evitar spam)
✅ En diálogos futuros, El Acechador puede mencionar este evento

### Nota
- Este test es más difícil de verificar directamente
- Depende de la implementación del sistema de diálogos contextuales
- El registro ocurre internamente en la memoria del jugador

---

## Test 7: Compatibilidad con Tiers

### Objetivo
Verificar que el efecto Weeping Angel funciona en todos los tiers.

### Pasos
1. Usar comando para establecer diferentes tiers:
   - `.bond set 0` (Tier 0 - Stranger)
   - `.bond set 150` (Tier 1 - Watched)
   - `.bond set 300` (Tier 2 - Familiar)
   - `.bond set 450` (Tier 3 - Obsessed)
2. Para cada tier, repetir Test 1 (Detección Básica)
3. Verificar que el efecto funciona consistentemente

### Resultado Esperado
✅ El efecto Weeping Angel debe funcionar igual en todos los tiers
✅ No debe haber interferencia con el sistema de intensidad de acecho

### Nota
- El sistema de Weeping Angel tiene PRIORIDAD sobre la intensidad de tier
- Cuando el jugador mira, siempre se oculta (independiente del tier)
- Cuando el jugador NO mira, la intensidad del tier aplica

---

## Test 8: Prueba de Múltiples Ciclos

### Objetivo
Verificar estabilidad del sistema a través de múltiples ciclos de mirar/desviar.

### Pasos
1. Mirar al Knocker (debe volverse invisible)
2. Desviar la mirada (debe reaparecer)
3. Repetir 10 veces
4. Observar si hay comportamiento inconsistente

### Resultado Esperado
✅ El sistema debe funcionar consistentemente en todos los ciclos
✅ No debe haber "lag" o acumulación de efectos
✅ El Knocker debe responder predeciblemente

---

## Test 9: Prueba en Multijugador (Opcional)

### Objetivo
Verificar que el sistema funciona correctamente con múltiples jugadores.

### Pasos
1. Tener 2+ jugadores en el servidor
2. Cada jugador debe tener su propio Knocker
3. Jugador A mira a su Knocker → debe volverse invisible SOLO para él
4. Jugador B no debería ver cambios en el Knocker de A

### Resultado Esperado
✅ Cada jugador tiene su propio Knocker con comportamiento independiente
✅ El efecto Weeping Angel es específico por jugador
✅ No hay interferencia entre instancias

### Nota
- Este test requiere un servidor multijugador
- Es opcional pero recomendado para verificar escalabilidad

---

## Solución de Problemas

### El Knocker NO se vuelve invisible
**Posibles causas:**
1. No has esperado el ciclo de actualización (10 segundos)
2. No estás mirando directamente (debe estar dentro del cono de 28°)
3. El Knocker está a más de 64 bloques de distancia
4. Hay un error en el código (revisar logs de consola)

**Solución:**
- Espera al menos 10-15 segundos entre acciones
- Centra la cruz directamente sobre el Knocker
- Acércate a menos de 64 bloques

### El Knocker NO reaparece al desviar la mirada
**Posibles causas:**
1. No has esperado el ciclo de actualización
2. Sigues mirando parcialmente al Knocker (dentro del cono)

**Solución:**
- Espera 10-15 segundos
- Gira completamente en otra dirección

### El efecto parece "parpadear"
**Explicación:**
- Esto es normal. El efecto de invisibilidad dura 2 segundos
- Se reaplica cada 10 segundos (ciclo de actualización)
- Entre ciclos, puede haber un breve momento visible

### Errores en la consola
**Acción:**
- Reportar los errores completos
- Verificar que la versión de Minecraft sea 1.21.50+
- Verificar que el behavior pack esté correctamente activado

---

## Checklist de Verificación Completa

Marcar cada test al completarlo:

- [ ] Test 1: Detección básica de mirada
- [ ] Test 2: Revelación al desviar la mirada
- [ ] Test 3: Prueba del cono de visión (28°)
- [ ] Test 4: Prueba de distancia máxima (64 bloques)
- [ ] Test 5: Verificación de línea de vista
- [ ] Test 6: Registro en memoria
- [ ] Test 7: Compatibilidad con tiers
- [ ] Test 8: Prueba de múltiples ciclos
- [ ] Test 9: Prueba en multijugador (opcional)

---

## Criterios de Aceptación

El Task 10.3 se considera **COMPLETAMENTE FUNCIONAL** si:

✅ El Knocker se vuelve invisible cuando el jugador lo mira directamente  
✅ El Knocker reaparece cuando el jugador desvía la mirada  
✅ El cono de visión es razonable (~28 grados)  
✅ La distancia máxima funciona (64 bloques)  
✅ La línea de vista previene detección a través de bloques sólidos  
✅ El sistema es estable a través de múltiples ciclos  
✅ No hay errores críticos en la consola  

---

## Notas Finales

### Comportamiento Esperado vs. Realidad
- El sistema se actualiza **cada 10 segundos** por diseño (no en tiempo real)
- Esto es una decisión de **rendimiento** para evitar cálculos constantes
- Si necesitas mayor responsividad, ajustar el intervalo en línea 7460 de `main.js`

### Ajustes Recomendados (Si es necesario)
1. **Ángulo de detección:** Cambiar `lookingThreshold = 0.88` (línea 7175)
   - Más bajo (ej: 0.8) = cono más amplio (~36°)
   - Más alto (ej: 0.95) = cono más estrecho (~18°)

2. **Frecuencia de actualización:** Cambiar intervalo en línea 7460
   - Actual: `200` ticks = 10 segundos
   - Más frecuente: `100` ticks = 5 segundos (más carga CPU)
   - Menos frecuente: `400` ticks = 20 segundos (menos responsivo)

3. **Distancia máxima:** Cambiar `distance > 64` (línea 7151)
   - Aumentar para mayor rango de detección
   - Disminuir para mejor rendimiento

---

## Conclusión

Esta guía proporciona un método sistemático para verificar que el Task 10.3 funciona correctamente en el juego. Si todos los tests pasan, el sistema está implementado exitosamente.

**Fecha de creación:** 31 de Diciembre, 2024  
**Versión del documento:** 1.0  
**Estado:** Listo para testing  
