# Guía de Pruebas: Tarea 10.4 - Movimiento Natural y Furtivo

## Introducción

Esta guía te ayudará a probar el nuevo sistema de movimiento natural y furtivo de El Acechador. Las mejoras incluyen movimiento fluido sin zigzag, evasión inteligente y velocidad adaptativa.

---

## Preparación

### Requisitos:
- Minecraft Bedrock Edition 1.21.50+
- Addon "The Obsessed Knocker" instalado
- Mundo de prueba (se recomienda modo creativo)

### Comandos Útiles:
- `.fakkel 1` - Invocar El Acechador
- `.bond` - Ver tu nivel de vínculo actual
- `.tierstatus` - Ver información detallada de comportamiento

---

## Prueba 1: Verificar Movimiento Suave (NO Errático)

### Objetivo:
Confirmar que El Acechador ya no se mueve en zigzag errático

### Pasos:
1. Invoca El Acechador: `.fakkel 1`
2. Aléjate aproximadamente 30-40 bloques en línea recta
3. Quédate quieto y observa cómo se acerca El Acechador
4. **Observar:** La ruta que toma

### Resultado Esperado:
✅ El Acechador se mueve en una **curva suave y fluida**  
✅ **NO** hay cambios de dirección bruscos  
✅ El movimiento parece **natural y orgánico**  

### Resultado NO Esperado:
❌ Movimiento en zigzag con ángulos de 90°  
❌ Cambios de dirección repentinos  
❌ Movimiento robotico o mecánico  

---

## Prueba 2: Verificar Evasión de Detección

### Objetivo:
Confirmar que El Acechador evita la línea de vista directa

### Pasos:
1. Invoca El Acechador a ~40 bloques
2. **Gira hacia donde está** El Acechador y **míralo directamente**
3. Sin desviar la mirada, retrocede lentamente 20 bloques
4. Observa el camino que toma El Acechador para acercarse
5. Usa F5 (vista tercera persona) para ver mejor si es necesario

### Resultado Esperado:
✅ El Acechador se mueve **por los LADOS** (no directo hacia ti)  
✅ Crea una **ruta en ARCO** que evita tu línea de vista  
✅ La desviación lateral es **notoria** (6-12 bloques)  


### Resultado NO Esperado:
❌ El Acechador viene directo hacia ti en línea recta  
❌ No hay desviación lateral  

### Tip:
Puedes probar desde diferentes ángulos para verificar que siempre elige el lado menos visible.

---

## Prueba 3: Verificar Velocidad Adaptativa

### Objetivo:
Confirmar que la velocidad cambia según la distancia al jugador

### Pasos:
1. Invoca El Acechador a 50+ bloques de distancia
2. Quédate quieto (NO mires al Acechador)
3. **Cronometra** cuánto tarda en recorrer:
   - Los primeros 30 bloques (lejos)
   - Los últimos 15 bloques (cerca)
4. Compara velocidades

### Resultado Esperado:
✅ **Lejos (> 40 bloques):** Se mueve **más RÁPIDO** (~1-1.2s por waypoint)  
✅ **Cerca (< 16 bloques):** Se mueve **más LENTO** (~2-2.5s por waypoint)  
✅ La transición de velocidad es **gradual**, no abrupta  

### Resultado NO Esperado:
❌ Velocidad constante sin importar distancia  
❌ Cambios de velocidad abruptos  

---

## Prueba 4: Integración con Weeping Angel

### Objetivo:
Verificar que el movimiento se pausa correctamente cuando lo miras

### Pasos:
1. Invoca El Acechador a 30 bloques
2. Deja que se empiece a mover hacia ti (NO lo mires aún)
3. Después de 3-4 segundos, **gira y míralo DIRECTAMENTE**
4. Mantén la mirada fija por 5 segundos
5. **Desvía la mirada**
6. Observa si el movimiento se reanuda

### Resultado Esperado:
✅ Cuando lo miras: **Movimiento se PAUSA inmediatamente**  
✅ Mientras lo miras: **Permanece inmóvil e invisible**  
✅ Al desviar la mirada: **Movimiento se REANUDA suavemente**  
✅ **NO hay saltos** de posición al reanudar  

### Resultado NO Esperado:
❌ Sigue moviéndose mientras lo miras  
❌ Se teletransporta al reanudar (salto de posición)  
❌ No reanuda el movimiento después de desviar mirada  

---


## Prueba 5: Suavizado de Ángulos en Terreno Complejo

### Objetivo:
Verificar que no hay giros bruscos en terreno irregular

### Pasos:
1. Ve a una zona de **montañas** o terreno muy irregular
2. Invoca El Acechador en la cima de una montaña
3. Baja al valle (30+ bloques de diferencia de altura)
4. Observa la ruta que toma para bajar hacia ti
5. Presta atención a los **ángulos de giro**

### Resultado Esperado:
✅ La ruta sigue el terreno de forma **suave**  
✅ **NO hay giros de 90° o más**  
✅ Si hay un ángulo brusco, se inserta un **punto intermedio** para suavizarlo  
✅ El descenso es **gradual**, no saltos directos  

### Resultado NO Esperado:
❌ Giros en ángulo recto (90°+)  
❌ Caídas o saltos abruptos  
❌ Movimiento que ignora el terreno  

---

## Prueba 6: Comparación de Lados de Evasión

### Objetivo:
Verificar que El Acechador elige el lado menos visible

### Pasos:
1. Construye un pasillo largo (40 bloques) con paredes a ambos lados
2. Colócate en un extremo del pasillo
3. Invoca El Acechador en el otro extremo
4. **Mira hacia la IZQUIERDA** del pasillo (no hacia El Acechador)
5. Observa por qué lado se mueve El Acechador
6. Repite mirando hacia la DERECHA

### Resultado Esperado:
✅ Si miras a la izquierda: El Acechador se mueve por la **DERECHA**  
✅ Si miras a la derecha: El Acechador se mueve por la **IZQUIERDA**  
✅ Siempre elige el **lado opuesto** a tu mirada  

### Diagrama:
```
   Tú mirando ←     [El Acechador se mueve por DERECHA →]
   Tú mirando →     [← El Acechador se mueve por IZQUIERDA]
```

---

## Prueba 7: Prueba de Estrés (Múltiples Cambios)

### Objetivo:
Verificar robustez del sistema con cambios constantes

### Pasos:
1. Invoca El Acechador
2. Durante 2 minutos, realiza estas acciones aleatorias:
   - Corre en círculos
   - Míralo y deja de mirarlo repetidamente
   - Cambia de dirección abruptamente
   - Acércate y aléjate
3. Observa si hay comportamientos extraños

### Resultado Esperado:
✅ El sistema maneja todos los cambios sin problemas  
✅ **No hay errores** en el chat (console.warn)  
✅ El movimiento se adapta continuamente  
✅ No hay teletransportaciones inesperadas  


### Resultado NO Esperado:
❌ Errores en el chat/consola  
❌ El Acechador se "pierde" o deja de moverse  
❌ Teletransportaciones erráticas  
❌ Caída del juego o lag severo  

---

## Solución de Problemas

### Problema: El Acechador NO se mueve
**Causas posibles:**
- Está atascado en un bloque sólido
- El tier es 0 y tiene baja frecuencia de aparición
- Error al calcular la ruta

**Soluciones:**
1. Usa `.bond` para verificar tu tier
2. Invócalo de nuevo con `.fakkel 1`
3. Revisa la consola por errores

### Problema: Movimiento sigue siendo errático
**Causas posibles:**
- El archivo main.js no se actualizó correctamente
- Caché del addon no se refrescó

**Soluciones:**
1. Cierra completamente Minecraft
2. Borra caché del addon:
   - Windows: `%localappdata%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\behavior_packs`
3. Reinstala el addon
4. Abre Minecraft y prueba de nuevo

### Problema: El Acechador se mueve a través de paredes
**Causa:**
- La función `findSafeSurfaceNear()` no pudo encontrar superficie válida
- Teleportación de fallback se activó

**Solución:**
- Esto es comportamiento de fallback normal
- Si ocurre muy frecuentemente, ajusta el parámetro `checkRadius` en línea 7288

---

## Tabla de Verificación Final

Marca cada prueba al completarla:

- [ ] **Prueba 1:** Movimiento suave ✅ / ❌
- [ ] **Prueba 2:** Evasión de detección ✅ / ❌
- [ ] **Prueba 3:** Velocidad adaptativa ✅ / ❌
- [ ] **Prueba 4:** Integración Weeping Angel ✅ / ❌
- [ ] **Prueba 5:** Suavizado de ángulos ✅ / ❌
- [ ] **Prueba 6:** Lado menos visible ✅ / ❌
- [ ] **Prueba 7:** Prueba de estrés ✅ / ❌

**Estado General:** ✅ TODAS PASARON / ❌ ALGUNAS FALLARON

---

## Feedback

Si encuentras comportamientos inesperados o tienes sugerencias de mejora:

1. Anota exactamente qué ocurrió
2. Incluye las condiciones (tier, distancia, bioma, etc.)
3. Captura de pantalla si es posible
4. Consulta `TASK_10.4_IMPLEMENTATION_SUMMARY.md` para parámetros ajustables

---

**¡Disfruta del nuevo comportamiento mejorado de El Acechador! 👻**

