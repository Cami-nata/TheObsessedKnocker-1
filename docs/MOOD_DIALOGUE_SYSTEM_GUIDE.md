# Guía del Sistema de Diálogos por Estado de Ánimo

## Vista Rápida

El Sistema de Diálogos por Estado de Ánimo permite a El Acechador expresar diferentes personalidades según su estado emocional actual, creando interacciones más dinámicas y variadas.

---

## Estados de Ánimo Disponibles

### 1. 🔍 CURIOSO (Inquisitivo)
- **Personalidad:** Hace preguntas, quiere saber más, investiga
- **Ejemplos:**
  - Tier 0: "¿Qué haces ahí?"
  - Tier 3: "¿En qué piensas exactamente en este momento, {name}?"
- **Cuándo usar:** Cuando el jugador explora, hace cosas inusuales, o El Acechador quiere aprender más

### 2. 🔒 POSESIVO (Protector y Restrictivo)
- **Personalidad:** No quiere que el jugador se vaya, protector, controlador
- **Ejemplos:**
  - Tier 0: "No deberías alejarte mucho."
  - Tier 3: "No puedes irte, {name}. No lo permitiré."
- **Cuándo usar:** Cuando el jugador intenta alejarse, explorar lejos, o cambiar de dimensión

### 3. 😠 CELOSO (Negativo a Presencia de Otros)
- **Personalidad:** No tolera otros jugadores/mobs, quiere exclusividad
- **Ejemplos:**
  - Tier 0: "¿Quién es ese?"
  - Tier 3: "No puedo... no puedo verte con otros, {name}."
- **Cuándo usar:** Cuando hay otros jugadores cerca, el jugador interactúa con mobs, o comercia con aldeanos

### 4. ✨ EUFÓRICO (Intenso y Apasionado)
- **Personalidad:** Emocionalmente elevado, celebratorio, intenso
- **Ejemplos:**
  - Tier 0: "Hoy es un buen día."
  - Tier 3: "¡{NAME}! ¡ESTO ES TODO! ¡ESTO ES PERFECCIÓN ABSOLUTA!"
- **Cuándo usar:** Cuando el jugador alcanza hitos, el vínculo aumenta significativamente, o eventos positivos

### 5. 😐 NEUTRAL (Estado por Defecto)
- **Personalidad:** Usa el sistema R original
- **Comportamiento:** Diálogos estándar, observación equilibrada
- **Cuándo usar:** Estado por defecto, cuando no hay razón para otro estado

---

## Cómo Usar el Sistema

### Obtener un Diálogo

```javascript
// Obtener diálogo basado en el estado actual
const playerName = "Steve";
const tier = 2; // 0-3

const dialogue = getMoodDialogue(playerName, tier);

if (dialogue) {
    // Reemplazar {name} si es necesario
    const formatted = dialogue.replace(/{name}/g, playerName);
    console.log(formatted);
}
```

### Mostrar un Comentario en el Chat

```javascript
// Forma simple: muestra directamente en el chat
const player = world.getPlayers()[0];
const tier = getTier(player); // Obtener tier del sistema de vínculo

sayMoodComment(player, tier);
// Esto automáticamente:
// 1. Obtiene el estado de ánimo actual
// 2. Selecciona un diálogo apropiado
// 3. Reemplaza {name} con el nombre del jugador
// 4. Muestra el mensaje en el chat
```

### Cambiar el Estado de Ánimo

```javascript
// Cambiar el estado de ánimo (de Task 12.1)
const playerName = "Steve";

// Intentar cambiar a estado curioso
if (setPlayerMood(playerName, MoodStates.CURIOSO)) {
    console.log("Estado cambiado exitosamente");
    // Ahora los diálogos serán del tipo curioso
} else {
    console.log("No se puede cambiar aún (duración mínima no cumplida)");
}
```

---

## Ejemplos de Integración

### Ejemplo 1: Reaccionar a Jugadores Cercanos

```javascript
// Detectar otros jugadores cercanos
function checkNearbyPlayers(player) {
    const nearbyPlayers = world.getPlayers({
        location: player.location,
        maxDistance: 32
    }).filter(p => p.name !== player.name);
    
    if (nearbyPlayers.length > 0) {
        // Cambiar a estado celoso
        setPlayerMood(player.name, MoodStates.CELOSO);
        
        // Mostrar comentario celoso
        const tier = getTier(player);
        sayMoodComment(player, tier);
    }
}
```

### Ejemplo 2: Reaccionar a Exploración

```javascript
// Cuando el jugador se aleja mucho
function onPlayerMoveFar(player, distance) {
    if (distance > 100) {
        // Cambiar a estado posesivo
        if (setPlayerMood(player.name, MoodStates.POSESIVO)) {
            const tier = getTier(player);
            sayMoodComment(player, tier);
        }
    }
}
```

### Ejemplo 3: Celebrar Hitos de Vínculo

```javascript
// Cuando el vínculo aumenta significativamente
function onBondIncrease(player, newBond, oldBond) {
    const increase = newBond - oldBond;
    
    if (increase >= 50) {
        // Cambiar a estado eufórico
        setPlayerMood(player.name, MoodStates.EUFORICO);
        
        const tier = getTier(player);
        sayMoodComment(player, tier);
    }
}
```

### Ejemplo 4: Curiosidad Durante Acciones Extrañas

```javascript
// Cuando el jugador hace algo inusual
function onUnusualAction(player, action) {
    // Cambiar a estado curioso
    if (canMoodChange(player.name)) {
        setPlayerMood(player.name, MoodStates.CURIOSO);
        
        const tier = getTier(player);
        sayMoodComment(player, tier);
    }
}
```

---

## Mejores Prácticas

### ✅ Hacer

1. **Verificar duración mínima:** Usar `canMoodChange()` antes de cambiar estados frecuentemente
2. **Validar tier:** Asegurarse de que el tier esté entre 0-3
3. **Manejar null:** `getMoodDialogue()` retorna `null` para estado NEUTRAL
4. **Usar contexto:** Cambiar estados basado en eventos del jugador
5. **Transiciones naturales:** No cambiar estados abruptamente

```javascript
// ✅ Bueno
if (canMoodChange(playerName)) {
    setPlayerMood(playerName, MoodStates.CURIOSO);
}

// ✅ Bueno - Manejar null
const dialogue = getMoodDialogue(playerName, tier);
if (dialogue) {
    say(player, dialogue);
}
```

### ❌ Evitar

1. **No cambiar estados muy frecuentemente:** Respetar la duración mínima de 10 minutos
2. **No ignorar el estado NEUTRAL:** Es el comportamiento por defecto
3. **No forzar estados sin contexto:** Los cambios deben tener sentido narrativo
4. **No asumir que siempre hay diálogo:** Manejar casos donde retorna `null`

```javascript
// ❌ Malo - Cambiar sin verificar
setPlayerMood(playerName, MoodStates.CELOSO);
setPlayerMood(playerName, MoodStates.CURIOSO); // Fallará

// ❌ Malo - No manejar null
const dialogue = getMoodDialogue(playerName, tier);
say(player, dialogue); // Puede fallar si dialogue es null
```

---

## Progresión de Intensidad por Tier

Cada estado escala en intensidad según el tier del vínculo:

| Tier | Nivel | Intensidad | Comportamiento |
|------|-------|------------|----------------|
| 0 | Stranger | 🟢 Baja | Comentarios sutiles, distantes |
| 1 | Watched | 🟡 Media | Interés notable, más personal |
| 2 | Familiar | 🟠 Alta | Apego evidente, íntimo |
| 3 | Obsessed | 🔴 Extrema | Obsesión intensa, sin límites |

**Ejemplo de progresión (CELOSO):**
- Tier 0: "¿Quién es ese?"
- Tier 1: "¿Por qué pasas tiempo con ellos, {name}?"
- Tier 2: "No soporto verlos cerca de ti, {name}."
- Tier 3: "No puedo... no puedo verte con otros, {name}."

---

## Sustitución de Variables

Los diálogos soportan variables que se reemplazan automáticamente:

### `{name}`
Se reemplaza con el nombre del jugador.

```javascript
// Diálogo original
"¿En qué piensas, {name}?"

// Después de formatear para "Steve"
"¿En qué piensas, Steve?"
```

**Nota:** `sayMoodComment()` hace el reemplazo automáticamente. Si usas `getMoodDialogue()` directamente, debes reemplazar manualmente.

---

## Estadísticas del Sistema

### Totales por Estado

- **CURIOSO:** 123 diálogos (25.3%)
- **POSESIVO:** 121 diálogos (24.8%)
- **CELOSO:** 122 diálogos (25.1%)
- **EUFÓRICO:** 121 diálogos (24.8%)
- **TOTAL:** 487 diálogos únicos

### Distribución por Tier

- **Tier 0:** 120 diálogos (30 por estado)
- **Tier 1:** 120 diálogos (30 por estado)
- **Tier 2:** 121 diálogos (~30 por estado)
- **Tier 3:** 126 diálogos (~31 por estado)

---

## Preguntas Frecuentes

### ¿Qué pasa si el estado es NEUTRAL?

`getMoodDialogue()` retorna `null`, y el sistema debe usar el objeto R original para respuestas. Esto preserva el comportamiento por defecto.

### ¿Puedo cambiar el estado inmediatamente?

No si no han pasado 10 minutos desde el último cambio. Usa `canMoodChange()` para verificar.

### ¿Cómo sé qué estado usar?

Depende del contexto:
- **Jugador explora:** CURIOSO
- **Jugador se aleja:** POSESIVO
- **Otros jugadores cerca:** CELOSO
- **Vínculo aumenta:** EUFÓRICO
- **Sin contexto especial:** NEUTRAL

### ¿Los diálogos se repiten?

Los diálogos se seleccionan aleatoriamente de pools grandes (30+ por tier), pero eventualmente se repetirán. Esto es intencional para mantener consistencia de personalidad.

### ¿Puedo agregar mis propios diálogos?

Sí, edita `MoodDialogues` en `main.js` y agrega strings a los arrays correspondientes.

---

## Diagrama de Flujo

```
Usuario Interactúa
        ↓
¿Hay evento que cambie mood?
        ↓
    [SÍ] → canMoodChange()? → [SÍ] → setPlayerMood()
        ↓                       ↓
    [NO] ──────────────────────┘
        ↓
  sayMoodComment(player, tier)
        ↓
  getMoodDialogue(playerName, tier)
        ↓
  ¿Estado es NEUTRAL? → [SÍ] → return null → Usar sistema R
        ↓
    [NO]
        ↓
  Seleccionar diálogo aleatorio del pool
        ↓
  Reemplazar {name} con nombre del jugador
        ↓
  Mostrar en chat usando say()
```

---

## Referencias

- **Task 12.1:** Sistema de Estados de Ánimo (estructura base)
- **Task 12.2:** Sistema de Diálogos por Estado (este sistema)
- **Task 12.3:** Cambios de Estado Basados en Eventos (próximo)

---

## Contacto y Soporte

Para reportar problemas o sugerir mejoras al sistema de diálogos, consulta la documentación completa en:
- `docs/TASK_12.2_IMPLEMENTATION_SUMMARY.md`
- `docs/TASK_12.1_IMPLEMENTATION_SUMMARY.md`

---

**Versión del Sistema:** 1.0  
**Última Actualización:** 2024  
**Estado:** Producción-Ready ✅
