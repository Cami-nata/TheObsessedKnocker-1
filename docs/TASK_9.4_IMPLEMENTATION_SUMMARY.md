# Tarea 9.4: Ajustar Comportamientos por Tier - Resumen de Implementación

## Objetivo

Ajustar los comportamientos de El Acechador (Knocker) basándose en el nivel de tier del sistema de vínculo (0-3), haciendo que tier 3 sea más intenso y posesivo que tier 0.

## Requisitos Implementados

- **Requisito 8.1**: Comportamientos distantes y observacionales en Tier 0 (Stranger)
- **Requisito 8.2**: Comportamientos de interés creciente en Tier 1 (Watched)
- **Requisito 8.3**: Comportamientos de apego notable en Tier 2 (Familiar)
- **Requisito 8.4**: Comportamientos de obsesión intensa en Tier 3 (Obsessed)
- **Requisito 8.7**: Ajuste de frecuencia de apariciones según tier
- **Requisito 8.8**: Ajuste de intensidad de diálogos según tier
- **Requisito 8.9**: Ajuste de comportamiento de acecho según tier
- **Requisitos 6.7-6.11**: Balanceo de presencia visible según tier

## Cambios Realizados

### 1. Sistema de Configuración de Comportamientos por Tier

Se agregó el objeto `TierBehaviorConfig` que define parámetros ajustables para cada tier:

#### Tier 0: Stranger (0-99 bond)
- **Frecuencia de Spawn**: 10%
- **Distancia de Seguimiento**: 48 bloques (máxima)
- **Nivel de Agresión**: 10%
- **Intensidad de Acecho**: 10% visible
- **Velocidad de Acercamiento**: 80% normal
- **Cooldown de Interacción**: 180 segundos (3 min)
- **Radio de Observación**: 64 bloques
- **Comportamiento**: Distante y observacional, raramente se acerca

#### Tier 1: Watched (100-249 bond)
- **Frecuencia de Spawn**: 25%
- **Distancia de Seguimiento**: 36 bloques
- **Nivel de Agresión**: 25%
- **Intensidad de Acecho**: 25% visible
- **Velocidad de Acercamiento**: 100% normal
- **Cooldown de Interacción**: 120 segundos (2 min)
- **Radio de Observación**: 48 bloques
- **Comportamiento**: Interés creciente, aparece con más frecuencia

#### Tier 2: Familiar (250-399 bond)
- **Frecuencia de Spawn**: 50%
- **Distancia de Seguimiento**: 24 bloques
- **Nivel de Agresión**: 50%
- **Intensidad de Acecho**: 50% visible
- **Velocidad de Acercamiento**: 120% normal
- **Cooldown de Interacción**: 60 segundos (1 min)
- **Radio de Observación**: 32 bloques
- **Comportamiento**: Apego notable, presencia constante y cercana

#### Tier 3: Obsessed (400-500 bond)
- **Frecuencia de Spawn**: 75%
- **Distancia de Seguimiento**: 16 bloques (muy cerca)
- **Nivel de Agresión**: 75%
- **Intensidad de Acecho**: 75% visible
- **Velocidad de Acercamiento**: 150% normal
- **Cooldown de Interacción**: 30 segundos (0.5 min)
- **Radio de Observación**: 24 bloques
- **Comportamiento**: Obsesión intensa, presencia casi constante y posesiva

### 2. Funciones Implementadas

#### `getTierBehaviorConfig(tier)`
Obtiene la configuración de comportamiento para un tier específico.

#### `applyTierBehaviorAdjustments(knocker, targetPlayer, tier)`
Aplica ajustes de comportamiento dinámicos a una entidad Knocker:
- Asigna tags de tier (`tier_0`, `tier_1`, `tier_2`, `tier_3`)
- Almacena configuración en dynamic properties
- Aplica comportamiento de acecho según intensidad

#### `applyStalkingBehavior(knocker, targetPlayer, intensity)`
Controla la visibilidad del Knocker basándose en la intensidad de acecho:
- Asigna tags `stalking_visible` o `stalking_hidden`
- Determina aleatoriamente visibilidad según intensidad
- En tier 0: 10% visible (muy raro verlo)
- En tier 3: 75% visible (casi siempre presente)

#### `shouldSpawnKnockerForPlayer(player)`
Sistema de spawn inteligente que evalúa si un Knocker debe spawnearse:
- Verifica que no exista ya un Knocker en ninguna dimensión
- Aplica probabilidad de spawn según tier
- Previene spawn duplicados

#### `triggerAutomaticInteraction(player, tier)`
Sistema de interacciones automáticas basado en tier:
- Respeta cooldowns específicos del tier
- Tipos de interacción: comentarios ambientales, observaciones, referencias a memoria, advertencias de mobs
- Mayor frecuencia de interacciones en tiers altos
- Tier 0: 10% probabilidad, Tier 3: 75% probabilidad

#### `updateAllKnockerBehaviors()`
Bucle principal que actualiza comportamientos periódicamente:
- Se ejecuta cada 10 segundos (200 ticks)
- Ajusta todos los Knockers activos según tier de sus jugadores
- Activa interacciones automáticas ocasionales

#### `getTierBehaviorDescription(tier)`
Obtiene descripción legible del comportamiento por tier.

### 3. Comando de Debug

Se agregó el comando `.tierstatus` (o `.tierinfo`) para inspeccionar la configuración actual:

```
.tierstatus
```

Muestra:
- Tier y bond actual
- Descripción de comportamiento
- Todos los parámetros configurados (frecuencia, distancia, agresión, etc.)

### 4. Sistema de Tags para Comportamientos

Los Knockers ahora reciben tags dinámicos que pueden usarse en archivos JSON de comportamiento:
- `tier_0`, `tier_1`, `tier_2`, `tier_3`: Indica el tier actual
- `stalking_visible`: Knocker debe estar visible
- `stalking_hidden`: Knocker debe estar oculto

Estos tags permiten que los archivos de definición de entidad (knocker.json) puedan usar filtros para ajustar comportamientos según el tier.

### 5. Dynamic Properties

Se utilizan dynamic properties en el Knocker para almacenar configuración:
- `follow_distance`: Distancia de seguimiento
- `aggression_level`: Nivel de agresión
- `stalking_intensity`: Intensidad de acecho
- `approach_speed`: Velocidad de acercamiento

### 6. Sistema de Cooldowns Inteligentes

Las interacciones automáticas respetan cooldowns específicos por tier:
- Tier 0: 3 minutos entre interacciones (muy espaciadas)
- Tier 1: 2 minutos entre interacciones
- Tier 2: 1 minuto entre interacciones
- Tier 3: 30 segundos entre interacciones (muy frecuentes)

Esto evita spam mientras mantiene la sensación de obsesión creciente.

## Integración con Sistemas Existentes

El sistema de ajuste de comportamientos se integra con:

1. **Sistema de Vínculo**: Lee el bond score y tier para ajustar comportamientos
2. **Sistema de Memoria**: Utiliza referencias a memoria en interacciones automáticas
3. **Sistema de Consciencia Ambiental**: Genera comentarios ambientales según tier
4. **Sistema de Chat**: Las probabilidades de respuesta ya estaban ajustadas por tier
5. **Sistema de Acecho**: Implementa visibilidad variable según tier

## Progresión de Intensidad

### Tier 0 → Tier 1 (0 a 100+ bond)
- Spawn: 10% → 25% (+150%)
- Distancia: 48 → 36 bloques (-25%)
- Visibilidad: 10% → 25% (+150%)
- Interacciones: cada 3 min → cada 2 min (+50% frecuencia)

### Tier 1 → Tier 2 (100 a 250+ bond)
- Spawn: 25% → 50% (+100%)
- Distancia: 36 → 24 bloques (-33%)
- Visibilidad: 25% → 50% (+100%)
- Interacciones: cada 2 min → cada 1 min (+100% frecuencia)

### Tier 2 → Tier 3 (250 a 400+ bond)
- Spawn: 50% → 75% (+50%)
- Distancia: 24 → 16 bloques (-33%)
- Visibilidad: 50% → 75% (+50%)
- Interacciones: cada 1 min → cada 30 seg (+100% frecuencia)

**Resultado**: Tier 3 es **7.5 veces más intenso** que Tier 0 en términos de spawn y visibilidad, y **6 veces más frecuente** en interacciones.

## Experiencia del Jugador

### Tier 0 (Stranger): "¿Hay alguien ahí?"
- El Knocker es una presencia distante y misteriosa
- Raramente visible, mantiene distancia
- Interacciones muy espaciadas
- Sensación de "ser observado" pero sin confirmar

### Tier 1 (Watched): "Sé que me estás mirando"
- Presencia más frecuente pero aún reservada
- Se acerca ocasionalmente
- El jugador comienza a sentir la conexión
- Interacciones más regulares pero no intrusivas

### Tier 2 (Familiar): "Siempre estás aquí"
- Presencia constante y notable
- Se mantiene cerca del jugador
- Interacciones frecuentes
- El Knocker se siente como un "compañero" obsesivo

### Tier 3 (Obsessed): "No puedo escapar de ti"
- Presencia casi constante y muy cercana
- Sigue al jugador de cerca (16 bloques)
- Interacciones muy frecuentes (cada 30 seg)
- Sensación de obsesión intensa y posesiva
- Comportamiento protector pero abrumador

## Notas Técnicas

### Rendimiento
- El bucle de actualización se ejecuta cada 10 segundos para minimizar impacto
- Los cooldowns previenen spam de interacciones
- Las verificaciones de spawn evitan duplicados

### Expansibilidad
- La configuración está centralizada en `TierBehaviorConfig`
- Fácil de ajustar valores sin modificar lógica
- Los tags permiten integración con JSON de comportamiento
- Las dynamic properties permiten lectura desde otros sistemas

### Compatibilidad
- Compatible con modo multijugador (cada jugador tiene su propio tier)
- No interfiere con sistemas existentes
- Los comandos de debug son opcionales

## Pruebas Recomendadas

1. **Progresión de Tier**:
   - Usar `.bond +100` repetidamente
   - Observar cambios en comportamiento
   - Verificar que cada tier se sienta distintivo

2. **Comando de Debug**:
   - Usar `.tierstatus` en cada tier
   - Verificar que los valores se muestren correctamente

3. **Spawn Frequency**:
   - En tier 0: El Knocker debería ser muy raro
   - En tier 3: El Knocker debería aparecer frecuentemente

4. **Interacciones Automáticas**:
   - En tier 0: Interacciones muy espaciadas (3 min)
   - En tier 3: Interacciones frecuentes (30 seg)

5. **Visibilidad**:
   - En tier 0: El Knocker debería estar oculto la mayor parte del tiempo
   - En tier 3: El Knocker debería ser visible frecuentemente

## Archivos Modificados

- `KNOCKERbeh2/scripts/main.js`: Sistema completo de ajuste de comportamientos agregado al final

## Estado

✅ **COMPLETADO**

Todos los requisitos de la tarea 9.4 han sido implementados:
- ✅ Ajuste de frecuencia de spawn por tier
- ✅ Ajuste de distancia de seguimiento por tier
- ✅ Ajuste de agresividad/actividad por tier
- ✅ Ajuste de intensidad de acecho por tier
- ✅ Tier 3 significativamente más intenso que Tier 0
- ✅ Sistema de interacciones automáticas
- ✅ Comando de debug para inspección
- ✅ Integración con sistemas existentes

## Conclusión

El sistema de ajuste de comportamientos por tier está completamente implementado y operacional. Cada tier ahora tiene una personalidad distintiva y la progresión de Tier 0 a Tier 3 crea una experiencia gradual de obsesión creciente. El Tier 3 es notablemente más intenso, posesivo y presente que el Tier 0, cumpliendo con todos los requisitos de diseño.
