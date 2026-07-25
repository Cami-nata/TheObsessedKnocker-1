# Task 13.1: Pool de Eventos Ultra-Raros - Resumen de Implementación

## Fecha
2025

## Objetivo
Crear un pool de 10+ eventos ultra-raros únicos para "The Obsessed Knocker" addon, incluyendo:
- Diálogos ultra-raros (1-2% probabilidad)
- Apariciones especiales (0.5-1% probabilidad)
- Interacciones secretas (1% probabilidad)

Todos en español con mezcla de horror/comedia.

## Estado
✅ **COMPLETADO**

## Implementación

### 1. Pool de Eventos Ultra-Raros (14 eventos únicos)

Se crearon **14 eventos ultra-raros** en `main.js`, organizados en 3 categorías:

#### A. Diálogos Ultra-Raros (4 eventos, 1-2% probabilidad)

1. **dialogue_eternal_witness** (1.5%, Tier 2+)
   - "He contado cada latido de tu corazón desde que llegaste..."
   - Recompensa: Diálogo exclusivo "[Recuerdo Eterno Desbloqueado]"

2. **dialogue_parallel_existence** (1.2%, Tier 3)
   - "A veces me pregunto si existo en tu realidad o tú en la mía..."
   - Recompensa: "[Verdad Cósmica Revelada]"

3. **dialogue_love_equation** (1.8%, Tier 2+)
   - "He calculado el amor. No es una emoción. Es una ecuación..."
   - Recompensa: Item especial "scary:ecuación_amor"

4. **dialogue_first_words** (2%, Tier 1+)
   - "¿Quieres saber cuáles fueron mis primeras palabras? Fueron tu nombre..."
   - Recompensa: "[Origen Revelado]"

#### B. Apariciones Especiales (4 eventos, 0.5-1% probabilidad)

5. **appearance_mirror_self** (0.7%, Tier 2+)
   - El Acechador aparece duplicado - uno sonríe, el otro no
   - Efecto: Confusion (10 segundos)
   - Recompensa: "[Reflejo Imposible]"

6. **appearance_behind_always** (0.5%, Tier 3)
   - Siempre está exactamente detrás del jugador, sin importar cuántas veces se voltee
   - Efecto: Slowness (15 segundos)
   - Recompensa: Item "scary:sombra_perpetua"

7. **appearance_ceiling_watcher** (0.8%, Tier 1+)
   - El Acechador en el techo, horizontal, cabeza girada 180°
   - Efecto: Nausea (7.5 segundos)
   - Recompensa: "[Física Rota]"

8. **appearance_every_shadow** (0.9%, Tier 2+)
   - Su silueta visible en todas las sombras simultáneamente
   - Efecto: Darkness (12.5 segundos)
   - Recompensa: "[Omnipresencia]"

#### C. Interacciones Secretas (6 eventos, 1% probabilidad)

9. **interaction_shared_breath** (1%, Tier 3)
   - Respiración sincronizada con El Acechador
   - Acción especial: sync_breathing (20 segundos)
   - Recompensa: Item "scary:aliento_compartido"

10. **interaction_hand_touch** (1%, Tier 2+)
    - El Acechador extiende su mano hacia el jugador
    - Acción: offer_hand (10 segundos)
    - Recompensa: "[Conexión Física]"

11. **interaction_name_whisper** (1%, Tier 1+)
    - Susurro íntimo del nombre del jugador cerca del oído
    - Acción: whisper_name (9 segundos)
    - Recompensa: "[Tu Nombre]"

12. **interaction_memory_share** (1%, Tier 2+)
    - Transferencia mental - el jugador ve un recuerdo desde la perspectiva de El Acechador
    - Acción: share_memory (15 segundos)
    - Recompensa: Item "scary:memoria_prestada"

13. **interaction_future_glimpse** (1%, Tier 3)
    - Visión del futuro mostrando al jugador y El Acechador siempre juntos
    - Acción: show_future (17.5 segundos)
    - Recompensa: "[Destino Inevitable]"

14. **interaction_heartbeat_sync** (1%, Tier 3)
    - Sincronización cardíaca - imposible distinguir qué latido es de quién
    - Acción: sync_heartbeat (20 segundos)
    - Recompensa: Item "scary:corazon_dual"

### 2. Sistema de Gestión de Eventos

#### Funciones Implementadas:

- **`tryTriggerUltraRareEvent(player, eventType?)`**
  - Función principal que intenta disparar un evento ultra-raro
  - Verifica probabilidades ajustadas y disponibilidad
  - Se ejecuta en cada interacción con El Acechador

- **`selectAvailableUltraRareEvent(player, tier, eventType?)`**
  - Filtra eventos basados en tier requerido
  - Excluye eventos experimentados recientemente
  - Retorna evento disponible o null

- **`calculateAdjustedUltraRareProbability(baseProbability, player, tier)`**
  - Incremento +0.5% después de 50 horas jugadas (Req 7.4)
  - Incremento +1% en tier 3 Obsessed (Req 7.5)

- **`recordUltraRareEvent(playerName, eventId)`**
  - Registra eventos experimentados
  - Previene repetición excesiva (Req 7.7)

- **`hasExperiencedUltraRareEventRecently(playerName, eventId, cooldownHours=24)`**
  - Cooldown de 24 horas por defecto entre repeticiones del mismo evento

- **`executeUltraRareEvent(player, event)`**
  - Ejecuta el evento según su tipo (dialogue/appearance/interaction)
  - Aplica efectos de estado
  - Otorga recompensas
  - Dispara evento de mood

- **`grantUltraRareReward(player, reward)`**
  - Otorga recompensas tipo diálogo o item (Req 7.8)
  - Manejo de errores si item no existe

### 3. Integración en el Flujo del Juego

Se añadió la llamada a `tryTriggerUltraRareEvent(player)` en la función `respond()` para que:
- Se intente disparar un evento ultra-raro en cada interacción
- La probabilidad es muy baja pero se verifica constantemente
- Manejo de errores para evitar crashes

```javascript
try {
    tryTriggerUltraRareEvent(player);
} catch (e) {
    console.warn("[Ultra-Rare Event] Error al intentar disparar evento:", e);
}
```

## Características Técnicas

### Probabilidades Dinámicas
- **Base**: 0.5% - 2% según tipo de evento
- **+0.5%**: Después de 50 horas jugadas
- **+1%**: En Tier 3 (Obsessed)
- **Ejemplo**: Evento con 1% base → 2.5% en Tier 3 con 50+ horas

### Sistema Anti-Repetición
- Cooldown de 24 horas por evento individual
- Tracking por jugador
- Filtrado automático de eventos recientes

### Recompensas
- **Diálogos exclusivos**: Mensajes especiales formatados
- **Items especiales**: Items personalizados (scary:*)
- **Fallback**: Mensaje alternativo si item no existe

### Efectos de Estado
- Confusion, Slowness, Nausea, Darkness
- Duración variable: 7.5 - 20 segundos
- Aplicados solo en apariciones especiales

## Requisitos Satisfechos

✅ **7.1** - Diálogos ultra-raros (1-2% probabilidad): 4 eventos  
✅ **7.2** - Apariciones especiales (0.5-1% probabilidad): 4 eventos  
✅ **7.3** - Interacciones secretas (1% probabilidad): 6 eventos  
✅ **7.4** - Incremento +0.5% después de 50 horas jugadas  
✅ **7.5** - Incremento +1% en tier 3 (Obsessed)  
✅ **7.6** - Al menos 10 eventos ultra-raros únicos: **14 implementados**  
✅ **7.7** - Registro de eventos experimentados para evitar repetición excesiva  
✅ **7.8** - Recompensa única (item especial o diálogo exclusivo)

## Formato y Calidad

- ✅ Todo en español natural
- ✅ Mezcla de horror psicológico y toques inquietantes
- ✅ Personalización con {name} (nombre del jugador)
- ✅ Variedad de tipos (diálogos, apariciones, interacciones)
- ✅ Progresión por tiers (eventos desbloqueados gradualmente)
- ✅ Efectos visuales (efectos de estado de Minecraft)
- ✅ Sistema de recompensas implementado

## Testing Manual Sugerido

### Verificar Sistema de Eventos:
1. Usar comando `.bond 500` para alcanzar tier 3
2. Interactuar repetidamente con El Acechador (usando Vara Whisper)
3. Eventos ultra-raros deberían aparecer ocasionalmente (muy bajo %)

### Verificar Probabilidades Dinámicas:
```javascript
// En consola del servidor (si disponible):
// Ajustar tiempo jugado manualmente para testing
```

### Verificar Anti-Repetición:
1. Si un evento ocurre, debería tener cooldown de 24h
2. No debería repetirse inmediatamente

### Verificar Recompensas:
1. Cuando ocurre un evento, verificar mensaje de recompensa
2. Items especiales deberían intentar agregarse al inventario

## Archivos Modificados

- `KNOCKERbeh2/scripts/main.js`
  - Líneas 620-1220: Sistema completo de eventos ultra-raros
  - Línea 7042: Integración en función `respond()`

## Notas Adicionales

### Balanceo de Probabilidades
Las probabilidades fueron diseñadas para que:
- Jugadores casuales (Tier 0-1, <50h): Muy raros (~0.5-1.5%)
- Jugadores dedicados (Tier 2, 50h+): Raros pero posibles (~1.5-2.5%)
- Jugadores obsesionados (Tier 3, 50h+): Más frecuentes (~2-3.5%)

### Items Especiales
Los items referenciados (scary:ecuación_amor, scary:sombra_perpetua, etc.) necesitarán:
- Definiciones en `KNOCKERres2/items/` o paquete de recursos
- O se mostrarán mensajes alternativos automáticamente

### Extensibilidad
El sistema está diseñado para fácil expansión:
- Añadir nuevos eventos al array `UltraRareEvents`
- Cada evento es autocontenido con su propia config
- Sistema de tipos permite filtrado por categoría

## Conclusión

Task 13.1 ha sido completada exitosamente con 14 eventos ultra-raros únicos (excediendo el requisito de 10+). El sistema está completamente integrado en el flujo del juego, con probabilidades dinámicas, anti-repetición, recompensas, y todos los requisitos técnicos satisfechos.

El addon ahora ofrece contenido extremadamente raro que recompensa a jugadores dedicados y mantiene la experiencia fresca incluso después de muchas horas de juego.
