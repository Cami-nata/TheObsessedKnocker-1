# Task 10.1: Sistema de Distancia de Observación - Resumen de Implementación

## Fecha de Implementación
2024-01-XX (Actualizar con fecha actual)

## Descripción
Implementación completa del sistema donde El Acechador (Knocker) mantiene una distancia óptima según el tier para observar al jugador sin ser demasiado obvio.

## Requisitos Implementados
- **Requisito 6.1**: Mantener distancia de observación entre 16-48 bloques según tier
- **Requisito 6.2**: Posicionar a El Acechador en ubicaciones estratégicas (ventanas, puertas, colinas)

## Funciones Implementadas

### 1. `getOptimalStalkingPosition(player, distance)`
**Ubicación**: `main.js` (línea ~6527)

**Propósito**: Calcula una posición estratégica óptima donde El Acechador puede observar al jugador.

**Características**:
- Genera 8 posiciones candidatas en un círculo alrededor del jugador (N, NE, E, SE, S, SW, W, NW)
- Busca superficies sólidas válidas (hasta 10 bloques abajo, 5 bloques arriba)
- Asigna puntuación a cada candidato basándose en factores estratégicos:
  - **Posición relativa** (30 puntos): Favorece posiciones detrás o a los lados del jugador
  - **Altura elevada** (hasta 20 puntos): Colinas y estructuras elevadas
  - **Proximidad a estructuras** (hasta 15 puntos): Ventanas, puertas, construcciones
  - **Línea de vista** (25 puntos): Capacidad de observar al jugador sin obstrucciones
  - **Aleatoriedad** (±10 puntos): Variedad natural en el comportamiento
- Retorna la posición con mayor puntuación

**Parámetros**:
- `player` (Player): Jugador objetivo
- `distance` (number): Distancia deseada en bloques

**Retorna**: 
- `Object {x, y, z}`: Posición óptima
- `null`: Si no se encuentra posición válida

### 2. `checkLineOfSight(dimension, pos1, pos2)`
**Ubicación**: `main.js` (línea ~6700)

**Propósito**: Verifica si hay línea de vista clara entre dos posiciones usando ray casting.

**Características**:
- Implementa ray casting simple verificando cada 2 bloques
- Detecta bloques sólidos que obstruyen la vista
- Optimizado para evitar cálculos excesivos

**Parámetros**:
- `dimension` (Dimension): Dimensión donde verificar
- `pos1` (Object): Posición inicial {x, y, z}
- `pos2` (Object): Posición final {x, y, z}

**Retorna**: 
- `boolean`: True si hay línea de vista clara

### 3. `maintainOptimalObservationDistance(knocker, targetPlayer, tier)`
**Ubicación**: `main.js` (línea ~6792)

**Propósito**: Mantiene al Knocker a distancia óptima del jugador, reposicionándolo cuando sea necesario.

**Características**:
- Usa configuración de `followDistance` del tier actual:
  - **Tier 0 (Stranger)**: 48 bloques (distante)
  - **Tier 1 (Watched)**: 36 bloques (media-alta)
  - **Tier 2 (Familiar)**: 24 bloques (media)
  - **Tier 3 (Obsessed)**: 16 bloques (muy cerca)
- Implementa rango de tolerancia (±4 bloques) para evitar reposicionamiento constante
- Añade variación aleatoria (±3 bloques) para comportamiento natural
- Usa `getOptimalStalkingPosition()` para encontrar ubicación estratégica
- Fallback: Si no encuentra posición óptima, posiciona detrás del jugador

**Parámetros**:
- `knocker` (Entity): Entidad del Knocker
- `targetPlayer` (Player): Jugador objetivo
- `tier` (number): Tier del sistema de vínculo (0-3)

## Integración con Sistema Existente

La función `maintainOptimalObservationDistance()` se integra automáticamente con el sistema de comportamiento por tier existente:

1. **Llamada Automática**: Se ejecuta en `applyTierBehaviorAdjustments()` (línea 6519)
2. **Actualización Periódica**: El sistema `updateAllKnockerBehaviors()` ejecuta cada 10 segundos (200 ticks)
3. **Sincronización con Tier**: Los cambios de tier actualizan automáticamente la distancia de observación

## Algoritmo de Puntuación Estratégica

El sistema asigna puntuaciones a posiciones candidatas:

```
Score Total = Puntuación Base + Factores Estratégicos

Factores:
- Posición detrás del jugador: +30 puntos (máximo)
- Altura elevada: +5 por bloque (máximo +20)
- Cerca de ventana (vidrio): +15 puntos
- Cerca de puerta: +10 puntos
- Cerca de estructura: +5 puntos
- Línea de vista clara: +25 puntos
- Aleatoriedad: ±10 puntos
```

La posición con mayor puntuación es seleccionada.

## Comportamiento por Tier

| Tier | Nombre | Distancia | Comportamiento |
|------|--------|-----------|----------------|
| 0 | Stranger | 48 bloques | Muy distante, raramente visible |
| 1 | Watched | 36 bloques | Distancia media-alta, observación discreta |
| 2 | Familiar | 24 bloques | Presencia notable pero no invasiva |
| 3 | Obsessed | 16 bloques | Muy cercano, presencia constante |

## Aspectos Técnicos

### Optimización
- Caché de posiciones para evitar cálculos constantes
- Rango de tolerancia (±4 bloques) previene teleportaciones frecuentes
- Verificación de línea de vista optimizada (cada 2 bloques)

### Manejo de Errores
- Try-catch en todas las funciones críticas
- Fallback a posicionamiento simple si falla el óptimo
- Logs de advertencia para debugging

### Superficie y Validación
- Verifica bloques sólidos para spawning válido
- Busca en rango vertical (10 bloques abajo, 5 arriba)
- Valida espacio libre para la entidad

## Casos de Uso

### Caso 1: Jugador en campo abierto
El sistema genera posiciones en círculo y selecciona la que está detrás del jugador con línea de vista clara.

### Caso 2: Jugador en estructura
El sistema detecta ventanas, puertas y muros, posicionando al Knocker estratégicamente cerca de estas estructuras.

### Caso 3: Jugador en terreno irregular
El sistema busca posiciones elevadas (colinas) que ofrecen ventaja de observación.

### Caso 4: Cambio de tier
Cuando el vínculo aumenta/disminuye y cambia el tier, el sistema ajusta automáticamente la distancia en la próxima actualización (cada 10 segundos).

## Testing Recomendado

Para verificar la implementación:

1. **Verificar distancias por tier**:
   ```
   .bond set 50    # Tier 0 - debe mantener ~48 bloques
   .bond set 150   # Tier 1 - debe mantener ~36 bloques
   .bond set 300   # Tier 2 - debe mantener ~24 bloques
   .bond set 450   # Tier 3 - debe mantener ~16 bloques
   ```

2. **Verificar posicionamiento estratégico**:
   - Construir una casa con ventanas
   - El Knocker debería posicionarse cerca de ventanas/puertas
   - Observar si prefiere posiciones elevadas (colinas)

3. **Verificar línea de vista**:
   - Moverse a diferentes ubicaciones
   - El Knocker debería mantener línea de vista cuando es posible

4. **Verificar comando de debug**:
   ```
   .tierstatus
   ```
   Muestra información actual del tier y configuración de distancia

## Archivos Modificados

- `KNOCKERbeh2/scripts/main.js`
  - Agregadas funciones: `getOptimalStalkingPosition()`, `checkLineOfSight()`, `maintainOptimalObservationDistance()`
  - Líneas aproximadas: 6527-6850

## Compatibilidad

- ✅ Minecraft Bedrock Edition 1.21.50+
- ✅ Compatible con sistema de tiers existente
- ✅ Compatible con sistema de comportamiento por tier
- ✅ No interfiere con otras mecánicas implementadas

## Notas de Implementación

1. **Naturalidad**: La variación aleatoria (±3 bloques) evita comportamiento robótico
2. **Rendimiento**: Las verificaciones de línea de vista son eficientes (muestreo cada 2 bloques)
3. **Escalabilidad**: El sistema de puntuación permite agregar nuevos factores fácilmente
4. **Modularidad**: Las funciones son independientes y reutilizables

## Próximos Pasos Sugeridos

Para mejorar el sistema en futuras iteraciones:

1. **Task 10.2**: Implementar detección de ubicaciones estratégicas más avanzada
2. **Task 10.3**: Implementar ocultamiento basado en mirada del jugador
3. **Task 10.4**: Implementar movimiento natural y furtivo
4. **Task 10.5**: Ajustar visibilidad según tier

## Estado
✅ **COMPLETADO** - Task 10.1 implementado exitosamente

---

**Implementado por**: Kiro AI
**Revisado**: Pendiente de revisión por usuario
**Versión**: 1.0
