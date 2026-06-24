# Task 7.2: Implementación de Registro de Eventos Significativos

## Resumen

Esta tarea implementa listeners de eventos que populan las estructuras de memoria creadas en la Task 7.1 con eventos significativos del jugador.

## Eventos Implementados

### 1. Listener de Muerte del Jugador (Requisito 4.1)
- **Evento:** `world.afterEvents.entityDie`
- **Detalles registrados:**
  - Ubicación de la muerte (x, y, z)
  - Dimensión
  - Causa de muerte
  - Entidad que causó el daño (si aplica)

### 2. Listener de Logros Obtenidos (Requisito 4.2)
Como Minecraft Bedrock no expone eventos de logros nativos, implementamos detectores para "logros" importantes:

- **Derrota del Ender Dragon:** Detectado via `entityDie` cuando el jugador mata al dragón
- **Derrota del Wither:** Detectado via `entityDie` cuando el jugador mata al Wither
- **Primer Diamante:** Detectado via `playerBreakBlock` cuando mina diamante por primera vez
- **Entrada al Nether:** Detectado via polling en `system.runInterval` (cada 2 segundos)
- **Entrada al End:** Detectado via polling en `system.runInterval` (cada 2 segundos)

### 3. Listener de Conversaciones Significativas (Requisito 4.3)
- **Función:** `recordConversation(playerName, intent, response)`
- **Integración:** Se llama automáticamente desde `respondToChat()`
- **Intenciones significativas registradas:**
  - pregunta_identidad
  - pregunta_sentimientos
  - pregunta_ubicacion
  - cambiar_apodo
  - expresion_amor
  - expresion_odio
  - despedida
  - saludo

### 4. Listeners de Acciones Específicas (Requisito 4.4)

#### a) Combate
- **Evento:** `world.afterEvents.entityDie`
- **Condición:** Cuando el jugador mata una entidad hostil
- **Entidades significativas:** zombies, esqueletos, creepers, enderman, wither, ender dragon, etc.
- **Detalles registrados:**
  - Tipo de enemigo eliminado
  - Ubicación del combate
  - Dimensión

#### b) Construcción
- **Evento:** `world.afterEvents.playerPlaceBlock`
- **Bloques significativos:**
  - crafting_table, furnace, chest
  - bed, door, beacon
  - enchanting_table, anvil, brewing_stand
  - nether_portal, end_portal_frame
- **Detalles registrados:**
  - Tipo de bloque colocado
  - Ubicación
  - Dimensión

#### c) Minería
- **Evento:** `world.afterEvents.playerBreakBlock`
- **Bloques valiosos:**
  - Minerales de diamante (normal y deepslate)
  - Minerales de oro, hierro, esmeralda
  - Ancient debris
  - Lapis, redstone
- **Detalles registrados:**
  - Tipo de bloque minado
  - Dimensión

## Integración con Sistema de Memoria

Todos los eventos utilizan la función `getPlayerMemory(playerName)` para obtener la instancia de memoria del jugador y los métodos:
- `memory.addEvent(type, details)` para eventos
- `memory.addConversation(intent, response)` para conversaciones

El sistema de memoria automáticamente implementa FIFO (First-In-First-Out) cuando se alcanza la capacidad máxima:
- Eventos: máximo 20, elimina el más antiguo
- Conversaciones: máximo 10, elimina la más antigua

## Logging y Debugging

Cada evento registrado genera un log en consola para facilitar debugging:
```javascript
console.log(`[Memory] Registrada muerte de ${player.name} en ${details.dimension} por ${details.cause}`);
console.log(`[Memory] Registrado combate de ${player.name}: eliminó ${deadEntity.typeId}`);
console.log(`[Memory] Registrada construcción de ${player.name}: colocó ${block.typeId}`);
console.log(`[Memory] Registrada minería de ${player.name}: minó ${block.type.id}`);
console.log(`[Memory] Registrada conversación de ${playerName}: intent=${intent}`);
console.log(`[Memory] Registrado logro de ${player.name}: [descripción]`);
```

## Consideraciones Técnicas

### Rendimiento
- Los listeners solo procesan eventos relevantes (filtrado temprano)
- El polling de dimensiones se ejecuta cada 2 segundos (40 ticks) para minimizar overhead
- Los logros de "primera vez" verifican la memoria existente para evitar duplicados

### Detección de "Primera Vez"
Para eventos de logros que solo deben registrarse una vez, se verifica la memoria existente:
```javascript
const diamondEvents = memory.getEventsByType("achievement").filter(
    e => e.details.achievement === "first_diamond"
);

if (diamondEvents.length === 0) {
    // Es la primera vez, registrar
}
```

### Estructura de Eventos

Todos los eventos siguen la estructura definida en la clase Memory:
```javascript
{
    type: string,      // "death", "combat", "construction", "mining", "achievement"
    timestamp: number, // Date.now()
    details: object    // Específico al tipo de evento
}
```

## Testing Manual

Para probar la implementación:

1. **Muerte del jugador:**
   - Suicidarse o morir en combate
   - Verificar log: `[Memory] Registrada muerte de [nombre]...`

2. **Combate:**
   - Matar zombies, esqueletos, creepers
   - Verificar log: `[Memory] Registrado combate de [nombre]: eliminó...`

3. **Construcción:**
   - Colocar crafting table, furnace, chest
   - Verificar log: `[Memory] Registrada construcción de [nombre]: colocó...`

4. **Minería:**
   - Minar diamantes, oro, hierro
   - Verificar log: `[Memory] Registrada minería de [nombre]: minó...`

5. **Conversaciones:**
   - Hablar en el chat con El Acechador
   - Verificar log: `[Memory] Registrada conversación de [nombre]: intent=...`

6. **Logros:**
   - Minar primer diamante
   - Entrar al Nether
   - Entrar al End
   - Derrotar Wither/Dragon
   - Verificar log: `[Memory] Registrado logro de [nombre]...`

## Próximos Pasos

Las tareas 7.3 y 7.4 implementarán:
- Persistencia de memoria entre sesiones (usando dynamic properties)
- Referencias a eventos pasados en diálogos

## Requisitos Satisfechos

✅ **Requisito 4.1:** Registro de muerte del jugador  
✅ **Requisito 4.2:** Registro de logros obtenidos  
✅ **Requisito 4.3:** Registro de conversaciones significativas  
✅ **Requisito 4.4:** Registro de acciones específicas (crafting, combate, construcción)
