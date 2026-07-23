# Tarea 10.3: Ocultamiento Basado en Mirada del Jugador - Resumen de Implementación

## Descripción
Implementación del efecto "Weeping Angel" para El Acechador (The Knocker). El sistema detecta cuando el jugador mira directamente al Knocker y lo oculta gradualmente, revelándolo cuando el jugador desvía la mirada.

## Requisitos Implementados
- **Requisito 6.3**: WHEN el jugador mira directamente a El_Acechador, THE Sistema_de_Acecho SHALL ocultar a El_Acechador gradualmente
- **Requisito 6.4**: WHEN el jugador no está mirando, THE Sistema_de_Acecho SHALL revelar a El_Acechador en posiciones visibles

## Funciones Implementadas

### 1. `isPlayerLookingAtKnocker(player, knocker)`
**Ubicación**: `KNOCKERbeh2/scripts/main.js` (línea ~7125)

**Propósito**: Detecta si el jugador está mirando directamente al Knocker.

**Funcionamiento**:
- Calcula el vector desde el jugador hacia el Knocker
- Obtiene la dirección de vista del jugador usando `player.getViewDirection()`
- Calcula el producto punto entre ambos vectores para determinar alineación
- Usa un umbral de ~0.88 (aproximadamente 28 grados de cono de visión)
- Verifica línea de vista sin obstrucciones para distancias menores a 32 bloques
- Rango máximo de detección: 64 bloques

**Retorna**: `true` si el jugador está mirando al Knocker, `false` si no.

### 2. `applyWeepingAngelEffect(knocker, targetPlayer)`
**Ubicación**: `KNOCKERbeh2/scripts/main.js` (línea ~7175)

**Propósito**: Aplica el efecto Weeping Angel basado en la mirada del jugador.

**Comportamiento cuando el jugador MIRA al Knocker**:
- Aplica efecto de invisibilidad (2 segundos, sin partículas)
- Agrega tags: `being_watched`, `weeping_angel_frozen`
- Remueve tag: `weeping_angel_moving`
- Reduce velocidad de movimiento a 0.05x (casi congelado)
- Registra evento en memoria del jugador (máximo 1 vez por minuto)

**Comportamiento cuando el jugador NO MIRA al Knocker**:
- Remueve efecto de invisibilidad
- Agrega tag: `weeping_angel_moving`
- Remueve tags: `being_watched`, `weeping_angel_frozen`
- Restaura velocidad de movimiento a 1.0x (normal)
- Permite que el comportamiento de acecho normal continúe

### 3. Modificación a `applyStalkingBehavior(knocker, targetPlayer, intensity)`
**Ubicación**: `KNOCKERbeh2/scripts/main.js` (línea ~7070)

**Cambios**:
- Ahora llama a `applyWeepingAngelEffect()` ANTES de aplicar la lógica de intensidad de acecho
- El efecto Weeping Angel tiene prioridad sobre la visibilidad base
- Agrega tag `weeping_angel_active` para indicar que el sistema está activo
- La lógica de intensidad solo se aplica si el tag `weeping_angel_active` NO está presente

## Tags Utilizados

### Tags de Estado
- `weeping_angel_active`: Indica que el sistema de Weeping Angel está activo
- `being_watched`: El jugador está mirando al Knocker actualmente
- `weeping_angel_frozen`: El Knocker está congelado por la mirada
- `weeping_angel_moving`: El Knocker está libre para moverse

### Tags Existentes (No modificados)
- `stalking_visible`: Knocker visible (lógica de intensidad normal)
- `stalking_hidden`: Knocker oculto (lógica de intensidad normal)
- `tier_0`, `tier_1`, `tier_2`, `tier_3`: Tags de tier (sin cambios)

## Integración con Sistemas Existentes

### Sistema de Memoria
- Registra eventos de tipo `caught_knocker_looking` cuando el jugador atrapa al Knocker mirándolo
- Cooldown de 1 minuto entre registros para evitar spam
- Puede usarse en diálogos futuros ("Me viste esa vez...")

### Sistema de Comportamiento por Tier
- Se ejecuta dentro de `applyTierBehaviorAdjustments()`
- Respeta la configuración de tier pero tiene prioridad en visibilidad
- Compatible con el sistema de intensidad de acecho existente

### Sistema de Dynamic Properties
- Usa `weeping_angel_speed_multiplier` para controlar velocidad
- Usa `last_caught_looking_time` para cooldown de eventos de memoria
- Manejo de errores robusto si las propiedades no están disponibles

## Ciclo de Actualización
El sistema se actualiza cada **10 segundos (200 ticks)** a través de:
1. `updateAllKnockerBehaviors()` (bucle principal)
2. `applyTierBehaviorAdjustments()` (por jugador/knocker)
3. `applyStalkingBehavior()` (aplicar intensidad)
4. `applyWeepingAngelEffect()` (aplicar efecto Weeping Angel)

## Efectos Visuales
- **Invisibilidad**: Efecto de Minecraft `invisibility` con duración de 2 segundos
- **Sin partículas**: El efecto es silencioso y discreto
- **Gradual**: Se reaplica cada ciclo de actualización (10 segundos)

## Consideraciones de Rendimiento
- Cálculos vectoriales simples (producto punto)
- Verificación de línea de vista solo para distancias < 32 bloques
- Cooldown de 1 minuto para eventos de memoria
- Manejo de errores robusto para prevenir crashes

## Compatibilidad
- Compatible con comportamientos JSON existentes usando tags
- No requiere cambios en resource pack
- Funciona con sistema de tiers existente
- No interfiere con otros sistemas de acecho

## Uso en Behavior Pack (Opcional)
Los tags pueden usarse en `knocker.json` para comportamientos condicionales:

```json
{
  "minecraft:behavior.panic": {
    "priority": 1,
    "speed_multiplier": 1.0,
    "filters": {
      "test": "has_tag",
      "value": "weeping_angel_frozen"
    }
  }
}
```

## Testing Sugerido
1. **Test básico**: Mirar directamente al Knocker y verificar que se vuelve invisible
2. **Test de desvío**: Desviar la mirada y verificar que reaparece
3. **Test de distancia**: Verificar que funciona hasta 64 bloques
4. **Test de obstrucción**: Verificar que bloques sólidos entre jugador y Knocker previenen detección
5. **Test de memoria**: Verificar que se registran eventos en memoria del jugador
6. **Test de tier**: Verificar compatibilidad con todos los tiers (0-3)

## Notas Adicionales
- El sistema es completamente automático y no requiere intervención del jugador
- El efecto es más prominente cuando el jugador está cerca (< 32 bloques)
- La velocidad reducida (0.05x) hace que el Knocker esté casi inmóvil cuando es observado
- Los eventos de memoria pueden usarse para generar diálogos contextuales futuros

## Estado
✅ **IMPLEMENTADO** - Tarea 10.3 completada exitosamente.

## Archivos Modificados
- `KNOCKERbeh2/scripts/main.js` - Funciones principales agregadas
