# Tarea 10.5 - Ajuste de Visibilidad según Tier
## Resumen de Implementación

**Estado:** ✅ COMPLETADA  
**Fecha:** 2024  
**Archivo Principal:** `KNOCKERbeh2/scripts/main.js`

---

## Descripción

Esta tarea implementa el sistema de visibilidad variable del Knocker basándose en el nivel de vínculo (tier) con el jugador. El sistema ajusta dinámicamente cuándo El Acechador es visible o invisible, creando una experiencia de acecho más sutil e inquietante que escala con la relación.

---

## Requisitos Implementados

✅ **Requisito 6.7:** Sistema de Acecho balancea presencia visible y ocultamiento según Tier  
✅ **Requisito 6.8:** Tier 0 (Stranger) - 10% visible  
✅ **Requisito 6.9:** Tier 1 (Watched) - 25% visible  
✅ **Requisito 6.10:** Tier 2 (Familiar) - 50% visible  
✅ **Requisito 6.11:** Tier 3 (Obsessed) - 75% visible

---

## Implementación Técnica

### 1. Configuración de Visibilidad por Tier

Los porcentajes de visibilidad ya estaban definidos en `TierBehaviorConfig`:

```javascript
const TierBehaviorConfig = {
    0: { stalkingIntensity: 0.10, ... },  // 10% visible
    1: { stalkingIntensity: 0.25, ... },  // 25% visible
    2: { stalkingIntensity: 0.50, ... },  // 50% visible
    3: { stalkingIntensity: 0.75, ... }   // 75% visible
};
```

### 2. Función `applyStalkingBehavior()` - MEJORADA

**Ubicación:** `main.js`, líneas ~7089-7180

**Cambios realizados:**

#### Antes (Tarea 10.5)
La función solo establecía tags (`stalking_visible` / `stalking_hidden`) pero **NO aplicaba efectos de invisibilidad reales**. El Knocker permanecía técnicamente visible aunque marcado como "oculto".

#### Después (Tarea 10.5) ✅
La función ahora aplica/remueve el **efecto de invisibilidad de Minecraft** basándose en el porcentaje del tier:

**Cuando debe estar VISIBLE:**
```javascript
// Remover efecto de invisibilidad
knocker.removeEffect("invisibility");

// Marcar con tags
knocker.removeTag("stalking_hidden");
knocker.addTag("stalking_visible");

// Almacenar timestamp
knocker.setDynamicProperty("last_visible_time", Date.now());
```

**Cuando debe estar OCULTO:**
```javascript
// Aplicar efecto de invisibilidad (5 segundos de duración)
knocker.addEffect("invisibility", 100, {
    amplifier: 0,
    showParticles: false  // Sin partículas para mantener el misterio
});

// Marcar con tags
knocker.removeTag("stalking_visible");
knocker.addTag("stalking_hidden");

// Almacenar timestamp
knocker.setDynamicProperty("last_hidden_time", Date.now());
```

### 3. Integración con Weeping Angel Effect

El sistema de visibilidad respeta la **prioridad del efecto Weeping Angel** (Tarea 10.3):

1. **Primer paso:** Se aplica `applyWeepingAngelEffect()` (oculta cuando el jugador mira)
2. **Segundo paso:** Solo si NO está activo el Weeping Angel, se aplica la visibilidad por tier

```javascript
// Solo aplicar visibilidad base si NO está siendo controlado por Weeping Angel
if (!knocker.hasTag("weeping_angel_active")) {
    // Aplicar visibilidad según tier...
}
```

**Resultado:** El Knocker se oculta cuando lo miran (Weeping Angel), pero cuando no lo miran, su visibilidad depende del tier.

### 4. Lógica de Decisión de Visibilidad

La visibilidad se determina probabilísticamente en cada ciclo de actualización:

```javascript
const shouldBeVisible = Math.random() < intensity;
```

**Ejemplos:**
- **Tier 0 (intensity = 0.10):** `Math.random() < 0.10` → 10% de probabilidad de ser visible
- **Tier 1 (intensity = 0.25):** `Math.random() < 0.25` → 25% de probabilidad de ser visible
- **Tier 2 (intensity = 0.50):** `Math.random() < 0.50` → 50% de probabilidad de ser visible
- **Tier 3 (intensity = 0.75):** `Math.random() < 0.75` → 75% de probabilidad de ser visible

---

## Comportamiento Resultante por Tier

### Tier 0: Stranger (Vínculo 0-99)
- **Visibilidad:** 10% del tiempo
- **Experiencia:** El Acechador es extremadamente esquivo, casi un fantasma. Los jugadores rara vez lo ven, creando tensión por su ausencia.
- **Horror:** "Sé que está ahí, pero nunca lo veo"

### Tier 1: Watched (Vínculo 100-249)
- **Visibilidad:** 25% del tiempo
- **Experiencia:** Apariciones más frecuentes pero aún esquivas. El jugador comienza a tener encuentros visuales ocasionales.
- **Horror:** "A veces lo veo en la distancia"

### Tier 2: Familiar (Vínculo 250-399)
- **Visibilidad:** 50% del tiempo
- **Experiencia:** Presencia equilibrada. El Acechador es visible la mitad del tiempo, creando una tensión constante.
- **Horror:** "Está ahí casi siempre que miro"

### Tier 3: Obsessed (Vínculo 400-500)
- **Visibilidad:** 75% del tiempo
- **Experiencia:** Presencia casi constante y agobiante. El jugador ve al Acechador frecuentemente, reforzando la obsesión.
- **Horror:** "No puedo evitarlo, siempre está visible, observándome"

---

## Manejo de Errores

La implementación incluye manejo robusto de errores:

```javascript
try {
    knocker.addEffect("invisibility", 100, { ... });
} catch (effectError) {
    console.warn("No se pudo aplicar invisibilidad en stalking:", effectError);
}
```

**Fallbacks:**
- Si `addEffect()` falla, los tags (`stalking_hidden`) se mantienen para sistemas alternativos
- Si `removeEffect()` falla, la función continúa (el efecto puede no existir)
- Si dynamic properties fallan, el sistema sigue funcionando sin timestamps

---

## Integración con Sistemas Existentes

### 1. Sistema de Comportamiento por Tier (Tarea 9.4)
- Usa `TierBehaviorConfig` para obtener `stalkingIntensity`
- Se llama desde `applyTierBehaviorAdjustments()`

### 2. Sistema Weeping Angel (Tarea 10.3)
- Prioridad absoluta del Weeping Angel sobre visibilidad por tier
- El Knocker se oculta cuando lo miran, independientemente del tier

### 3. Sistema de Distancia (Tarea 10.1)
- La visibilidad funciona en conjunto con `followDistance`
- Tier 0: Invisible 90% + lejos (48 bloques)
- Tier 3: Visible 75% + cerca (16 bloques)

### 4. Sistema de Movimiento Furtivo (Tarea 10.4)
- Cuando invisible, el movimiento es más furtivo
- Cuando visible, el movimiento puede ser más directo

---

## Datos Persistentes

El sistema almacena timestamps para análisis futuro:

```javascript
knocker.setDynamicProperty("last_visible_time", Date.now());
knocker.setDynamicProperty("last_hidden_time", Date.now());
```

**Uso potencial:**
- Estadísticas de visibilidad por jugador
- Patrones de aparición para diálogos ("Hace X minutos que no me ves")
- Ajustes dinámicos de comportamiento

---

## Testing Manual Recomendado

### Test 1: Verificar Porcentajes por Tier
1. Usar comando `.bond set 0` (Tier 0)
2. Observar al Knocker durante 5 minutos
3. Contar cuántas veces es visible vs invisible
4. **Esperado:** ~10% visible (0.5-1 minutos visible de 5)
5. Repetir para Tiers 1, 2, 3

### Test 2: Prioridad de Weeping Angel
1. Establecer Tier 3 (`.bond set 400`) para máxima visibilidad
2. Mirar directamente al Knocker
3. **Esperado:** Se vuelve invisible (Weeping Angel tiene prioridad)
4. Desviar la mirada
5. **Esperado:** Se vuelve visible nuevamente (75% probabilidad)

### Test 3: Transiciones Suaves
1. Observar al Knocker alternando entre visible/invisible
2. **Esperado:** Transiciones sin glitches visuales
3. **Esperado:** Sin partículas del efecto de invisibilidad

### Test 4: Escalado con Vínculo
1. Comenzar con vínculo bajo (Tier 0)
2. **Observar:** Raramente visible
3. Aumentar vínculo gradualmente hasta Tier 3
4. **Observar:** Incremento progresivo de visibilidad

---

## Notas de Implementación

### Decisiones de Diseño

1. **Duración del Efecto: 5 segundos (100 ticks)**
   - Suficientemente largo para ser efectivo
   - Lo suficientemente corto para actualizarse frecuentemente
   - Se reaplica en cada ciclo de actualización del comportamiento

2. **Sin Partículas de Invisibilidad**
   - `showParticles: false` mantiene el misterio
   - No revela la posición del Knocker invisible

3. **Probabilidad Aleatoria**
   - `Math.random() < intensity` en cada ciclo
   - Crea variabilidad natural
   - Evita patrones predecibles

4. **Prioridad del Weeping Angel**
   - Efecto cinemático tiene precedencia
   - Mantiene coherencia narrativa
   - Previene conflictos visuales

### Compatibilidad

- **Minecraft Bedrock:** 1.21.50+
- **API requerida:** `@minecraft/server` (Entity.addEffect, Entity.removeEffect)
- **Fallback:** Tags funcionan si los efectos fallan

---

## Código Relevante

**Función principal modificada:**
```javascript
function applyStalkingBehavior(knocker, targetPlayer, intensity)
```

**Ubicación:** `KNOCKERbeh2/scripts/main.js`, líneas ~7089-7180

**Configuración de tiers:**
```javascript
const TierBehaviorConfig = { ... }
```

**Ubicación:** `main.js`, líneas ~6350-6410

---

## Impacto en la Experiencia

### Tier 0 (Stranger) - "El Fantasma"
El jugador siente paranoia constante. El Acechador está presente pero invisible 90% del tiempo, creando tensión psicológica máxima.

### Tier 1 (Watched) - "El Observador"
Avistamientos ocasionales confirman la presencia del Acechador. El jugador comienza a aceptar que es observado.

### Tier 2 (Familiar) - "El Compañero Inquietante"
Presencia equilibrada. El Acechador es parte visible del mundo del jugador, pero aún mantiene misterio.

### Tier 3 (Obsessed) - "La Sombra Constante"
El Acechador es visible frecuentemente, reflejando su obsesión. El jugador no puede escapar de su presencia.

---

## Próximos Pasos

✅ Tarea 10.5 completada  
⏩ Continuar con Fase 8: Sistema de Respuestas Contextuales y Estados de Ánimo (Tareas 11.x, 12.x)

---

## Referencias

- **Requisitos:** `requirements.md` → Requirement 6, Acceptance Criteria 6.7-6.11
- **Tasks:** `tasks.md` → Tarea 10.5
- **Código:** `KNOCKERbeh2/scripts/main.js`

---

## Conclusión

La implementación de visibilidad por tier está completa y funcional. El sistema aplica efectos de invisibilidad reales de Minecraft basándose en porcentajes precisos según el nivel de vínculo, creando una experiencia de acecho escalable y psicológicamente efectiva.

**El Acechador ahora se adapta visualmente a la intensidad de la relación con el jugador, desde fantasma esquivo hasta sombra obsesiva constante.**
