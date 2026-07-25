# Guía de Pruebas - Task 13.1: Eventos Ultra-Raros

## Resumen
Esta guía explica cómo probar el sistema de eventos ultra-raros implementado en Task 13.1.

## Preparación del Entorno de Pruebas

### 1. Cargar el Addon
1. Asegúrate de que el addon esté instalado en tu mundo de Minecraft Bedrock
2. Activa tanto el Behavior Pack (KNOCKERbeh2) como el Resource Pack (KNOCKERres2)
3. Crea un mundo de prueba en modo creativo

### 2. Configurar para Testing
```
/gamemode creative
/time set 0
/gamerule dodaylightcycle false
```

## Métodos de Prueba

### Método 1: Prueba Natural (Largo plazo)
Este método simula la experiencia real del jugador.

**Pasos:**
1. Juega normalmente interactuando con El Acechador
2. Usa la Vara Whisper (scary:whisper) repetidamente
3. Interactúa en diferentes tiers de vínculo
4. Los eventos deberían aparecer ocasionalmente (muy raro)

**Nota:** Este método puede tomar mucho tiempo debido a las bajas probabilidades.

---

### Método 2: Prueba Acelerada (Recomendado para testing)

#### A. Aumentar el Vínculo al Máximo
```
/scoreboard objectives add bond dummy
/scoreboard players set @s bond 500
```

#### B. Verificar Tier Actual
Usa el comando `.bond` en el chat para ver tu tier actual.
- Deberías estar en **Tier 3 (Obsessed)** con bond=500
- Esto da +1% a las probabilidades de eventos ultra-raros

#### C. Interactuar Repetidamente
1. Usa la Vara Whisper para abrir el menú
2. Selecciona cualquier opción de diálogo
3. Repite 50-100 veces

**Probabilidades Esperadas:**
- Tier 3 (Obsessed): ~1.5-3.5% por interacción
- Aproximadamente 1 evento cada 30-70 interacciones

---

### Método 3: Testing de Desarrollo (Modificar Código Temporalmente)

Para testing rápido, puedes temporalmente aumentar las probabilidades:

**main.js - Línea ~1015 (función calculateAdjustedUltraRareProbability):**

```javascript
function calculateAdjustedUltraRareProbability(baseProbability, player, tier) {
    let adjustedProbability = baseProbability;
    
    // TESTING: Multiplicar probabilidad por 50 para testing
    adjustedProbability *= 50; // ← AÑADIR ESTA LÍNEA TEMPORALMENTE
    
    // ... resto del código
}
```

**⚠️ IMPORTANTE:** Recuerda revertir este cambio después del testing.

---

## Qué Observar Durante las Pruebas

### 1. Diálogos Ultra-Raros (1-2% base)
**Características:**
- Mensajes multi-línea que aparecen gradualmente
- Formato: `§8[El Acechador]§r mensaje`
- Recompensa al final

**Ejemplos a buscar:**
- "He contado cada latido de tu corazón desde que llegaste..."
- "A veces me pregunto si existo en tu realidad o tú en la mía..."
- "He calculado el amor. No es una emoción. Es una ecuación..."
- "¿Quieres saber cuáles fueron mis primeras palabras?"

### 2. Apariciones Especiales (0.5-1% base)
**Características:**
- Mensajes con formato especial (§c, §4, §8, §0)
- Efectos de estado aplicados (Confusion, Slowness, Nausea, Darkness)
- Duración: 7.5-15 segundos

**Ejemplos a buscar:**
- "§c¡Algo extraño sucede!§r" → Dos Acechadores aparecen
- "§4[ADVERTENCIA]§r" → Siempre está detrás de ti
- "§8Un escalofrío recorre tu espalda§r" → En el techo
- "§0Las sombras se mueven incorrectamente§r" → En todas las sombras

### 3. Interacciones Secretas (1% base)
**Características:**
- Mensajes con formato distintivo (§d, §e, §7, §b, §5, §c)
- Descripciones de acciones íntimas/inquietantes
- Recompensa al final

**Ejemplos a buscar:**
- "§d[MOMENTO ÍNTIMO]§r" → Respiración sincronizada
- "§e[CONTACTO INESPERADO]§r" → Toque de manos
- "§7[SUSURRO CERCANO]§r" → Nombre susurrado
- "§b[TRANSFERENCIA MENTAL]§r" → Ver recuerdos compartidos
- "§5[VISIÓN TEMPORAL]§r" → Ver el futuro
- "§c[SINCRONIZACIÓN CARDÍACA]§r" → Latidos sincronizados

### 4. Recompensas
Después de cada evento, deberías ver:
- **Diálogo de recompensa:** Mensajes como "[Recuerdo Eterno Desbloqueado]"
- **Items especiales:** Intentará dar items como "scary:ecuación_amor"
  - Si el item no existe: Mensaje alternativo "Has recibido un objeto especial"

---

## Verificación de Requisitos

### ✅ Checklist de Funcionalidad

- [ ] **Diálogos ultra-raros aparecen** (1-2% probabilidad)
- [ ] **Apariciones especiales aparecen** (0.5-1% probabilidad)
- [ ] **Interacciones secretas aparecen** (1% probabilidad)
- [ ] **Eventos filtrados por tier** (eventos de Tier 2-3 no aparecen en Tier 0-1)
- [ ] **Probabilidad aumenta en Tier 3** (+1% observable)
- [ ] **Recompensas se otorgan correctamente**
- [ ] **Anti-repetición funciona** (mismo evento no se repite inmediatamente)
- [ ] **Cambio de estado de ánimo** (después de evento ultra-raro, el mood puede cambiar)

### ✅ Checklist de Calidad

- [ ] **Texto en español natural**
- [ ] **Nombre del jugador reemplaza {name}**
- [ ] **Formato visual correcto** (colores §8, §c, §d, etc.)
- [ ] **Sin errores en consola**
- [ ] **Mensajes aparecen gradualmente** (línea por línea)
- [ ] **Efectos de estado se aplican** (solo en apariciones especiales)

---

## Debugging

### Ver Logs en Consola
Si tienes acceso a la consola del servidor o logs:

```
[El Acechador] <playerName>: Estado de ánimo cambiado...
[Ultra-Rare Event] <playerName> experimentó: <eventId> (<eventType>)
```

### Comandos Útiles
```
# Ver bond actual
.bond

# Ajustar bond para diferentes tiers
/scoreboard players set @s bond 0    # Tier 0: Stranger
/scoreboard players set @s bond 150  # Tier 1: Watched
/scoreboard players set @s bond 300  # Tier 2: Familiar
/scoreboard players set @s bond 450  # Tier 3: Obsessed
/scoreboard players set @s bond 500  # Tier 3: Bond Máximo

# Limpiar efectos de estado (si quedan atascados)
/effect @s clear
```

### Problemas Comunes

**Problema:** No aparecen eventos después de muchas interacciones
- **Solución:** Verifica que estés en un tier apropiado (algunos eventos requieren Tier 2 o 3)
- **Solución:** Usa el Método 3 para aumentar probabilidades temporalmente

**Problema:** Errores en consola sobre items
- **Solución:** Esto es normal si los items especiales (scary:*) no están definidos
- **Verificación:** Deberías ver mensaje alternativo de recompensa

**Problema:** Eventos se repiten constantemente
- **Solución:** Verifica la implementación de `hasExperiencedUltraRareEventRecently()`
- **Solución:** Cooldown de 24 horas debería estar activo

---

## Resultados Esperados

### Frecuencia Aproximada (Tier 3, Bond 500)
Con las probabilidades ajustadas (+1% por Tier 3):
- **Diálogos:** ~2-3% → 1 evento cada ~40 interacciones
- **Apariciones:** ~1.5-2% → 1 evento cada ~60 interacciones
- **Interacciones:** ~2% → 1 evento cada ~50 interacciones

### Experiencia del Jugador
- Jugadores casuales (Tier 0-1): Muy raro, sorpresa genuina
- Jugadores dedicados (Tier 2): Raro pero memorable
- Jugadores obsesionados (Tier 3): Ocasional, recompensa por dedicación

---

## Testing Completado

Una vez que hayas verificado todos los elementos de los checklists, Task 13.1 está funcionando correctamente.

**Próximos pasos:**
- Revertir cualquier cambio temporal de probabilidades
- Documentar cualquier bug encontrado
- Proceder a Task 13.2 (Sistema de probabilidades dinámicas - ya implementado)

---

## Notas Finales

Este sistema está diseñado para ser raro por naturaleza. Si los eventos aparecen con demasiada frecuencia durante el testing normal (sin modificaciones de probabilidad), hay un problema con el código.

La rareza es intencional y parte del diseño para mantener la experiencia fresca incluso después de muchas horas de juego.
