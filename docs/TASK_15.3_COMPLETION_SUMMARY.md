# Task 15.3 - Implementar soporte para opciones de configuración

## Estado: ✅ COMPLETADO

## Resumen

La tarea 15.3 requería implementar soporte para opciones de configuración de tres sistemas principales:
1. **Sistema de Vínculo** (Requisito 10.8)
2. **Sistema de Chat** (Requisito 10.9)
3. **Sistema de Eventos Raros** (Requisito 10.10)

**Resultado**: Todo el soporte de configuración fue implementado como parte de la tarea 15.1, por lo que la tarea 15.3 ya está completada.

## Implementación

### 1. Sistema de Vínculo (Requisito 10.8)

El ConfigSchema y las funciones de acceso para el Sistema de Vínculo incluyen:

#### Opciones de Configuración:
- `initialBond`: Valor inicial de vínculo para nuevos jugadores (0-500)
- `bondMultiplier`: Multiplicador para ganancia/pérdida de puntos (0.1-10.0)
- `tierThresholds`: Umbrales para cada tier (stranger, watched, familiar, obsessed)
- `maxBond`: Valor máximo de vínculo alcanzable (100-1000)

#### Funciones de Acceso:
```javascript
function getInitialBond()           // Retorna initialBond
function getBondMultiplier()        // Retorna bondMultiplier
function getMaxBond()               // Retorna maxBond
function getTierThresholds()        // Retorna objeto con umbrales
```

#### Integración:
Las funciones están integradas en el sistema de vínculo:
- `initializeBond()` usa `getInitialBond()` para inicializar jugadores nuevos
- `addBond()` aplica `getBondMultiplier()` al amount: `adjustedAmount = amount * getBondMultiplier()`
- `addBond()` respeta `getMaxBond()` como límite superior

### 2. Sistema de Chat (Requisito 10.9)

El ConfigSchema y las funciones de acceso para el Sistema de Chat incluyen:

#### Opciones de Configuración:
- `cooldownSeconds`: Cooldown entre respuestas (5-300 segundos)
- `responseProbabilities`: Probabilidades de respuesta por tier
  - `tier0`: Probabilidad en tier Stranger (default: 0.20)
  - `tier1`: Probabilidad en tier Watched (default: 0.40)
  - `tier2`: Probabilidad en tier Familiar (default: 0.60)
  - `tier3`: Probabilidad en tier Obsessed (default: 0.80)
- `enableNicknameSystem`: Habilitar/deshabilitar sistema de apodos (boolean)

#### Funciones de Acceso:
```javascript
function getChatCooldownMs()                    // Retorna cooldown en milisegundos
function getChatResponseProbability(tier)       // Retorna probabilidad por tier (0-3)
function isNicknameSystemEnabled()              // Retorna boolean
```

#### Integración:
Las funciones están integradas en el sistema de chat:
- El listener de chat usa `getChatCooldownMs()` para verificar cooldown
- El sistema de respuestas usa `getChatResponseProbability(tier)` para calcular probabilidad de respuesta

### 3. Sistema de Eventos Raros (Requisito 10.10)

El ConfigSchema y las funciones de acceso para el Sistema de Eventos Raros incluyen:

#### Opciones de Configuración:
- `baseRareDialogueProbability`: Probabilidad de diálogos raros (default: 0.05 = 5%)
- `baseUltraRareDialogueProbability`: Probabilidad de diálogos ultra-raros (default: 0.015 = 1.5%)
- `specialAppearanceProbability`: Probabilidad de apariciones especiales (default: 0.007 = 0.7%)
- `secretInteractionProbability`: Probabilidad de interacciones secretas (default: 0.01 = 1%)
- `bonusProbabilityAfter50Hours`: Bonus después de 50 horas (default: 0.005 = +0.5%)
- `bonusProbabilityTier3`: Bonus en tier 3 (default: 0.01 = +1%)
- `enableEventTracking`: Habilitar tracking de eventos (boolean)

#### Funciones de Acceso:
```javascript
function getRareDialogueProbability()           // Retorna prob. diálogos raros
function getUltraRareDialogueProbability()      // Retorna prob. diálogos ultra-raros
function getSpecialAppearanceProbability()      // Retorna prob. apariciones
function getSecretInteractionProbability()      // Retorna prob. interacciones
function getBonusProbabilityAfter50Hours()      // Retorna bonus +50h
function getBonusProbabilityTier3()             // Retorna bonus tier 3
function isEventTrackingEnabled()               // Retorna boolean
```

#### Integración:
Las funciones están integradas en el sistema de diálogos:
- `getUniqueResponse()` usa `getRareDialogueProbability()` y `getUltraRareDialogueProbability()` para seleccionar respuestas raras
- El cálculo de probabilidades ajustadas usa `getBonusProbabilityAfter50Hours()` y `getBonusProbabilityTier3()`

## Archivo de Configuración de Ejemplo

El archivo `config_example.json` contiene una configuración completa con valores por defecto:

```json
{
  "bondSystem": {
    "initialBond": 0,
    "bondMultiplier": 1.0,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 30,
    "responseProbabilities": {
      "tier0": 0.20,
      "tier1": 0.40,
      "tier2": 0.60,
      "tier3": 0.80
    },
    "enableNicknameSystem": true
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.05,
    "baseUltraRareDialogueProbability": 0.015,
    "specialAppearanceProbability": 0.007,
    "secretInteractionProbability": 0.01,
    "bonusProbabilityAfter50Hours": 0.005,
    "bonusProbabilityTier3": 0.01,
    "enableEventTracking": true
  }
}
```

## Comandos de Prueba In-Game

Para probar la configuración en Minecraft, usa estos comandos en el chat:

1. **`.configtest`** - Prueba el parser con configuraciones válidas e inválidas
2. **`.configdocs`** - Muestra documentación completa del esquema
3. **`.testparser`** - Suite completa de pruebas unitarias (15.1)

## Verificación

### Verificación Manual

Para verificar la funcionalidad en Minecraft:

1. Inicia un mundo con el addon instalado
2. Ejecuta `.configtest` en el chat
3. Verifica que muestra:
   - ✓ Configuración válida parseada correctamente
   - ✓ Errores detectados en configuraciones inválidas
   - ✓ Valores de configuración correctos

### Archivos de Prueba

Existen archivos de configuración de prueba para validación:
- `config_example.json` - Configuración válida completa
- `config_invalid_type.json` - Tipos de datos incorrectos
- `config_missing_required.json` - Campos requeridos faltantes
- `config_out_of_range.json` - Valores fuera de rango

## Requisitos Satisfechos

### ✅ Requisito 10.8: Parser SHALL soportar configuración de Sistema_de_Vínculo
- ✅ Valores iniciales: `initialBond`
- ✅ Multiplicadores: `bondMultiplier`
- ✅ Adicional: `tierThresholds`, `maxBond`

### ✅ Requisito 10.9: Parser SHALL soportar configuración de Sistema_de_Chat
- ✅ Cooldown: `cooldownSeconds`
- ✅ Probabilidades: `responseProbabilities` (tier0-tier3)
- ✅ Adicional: `enableNicknameSystem`

### ✅ Requisito 10.10: Parser SHALL soportar configuración de Sistema_de_Eventos_Raros
- ✅ Probabilidades de eventos raros
- ✅ Probabilidades de eventos ultra-raros
- ✅ Probabilidades de apariciones especiales
- ✅ Probabilidades de interacciones secretas
- ✅ Probabilidades bonus (50h, tier3)
- ✅ Control de tracking de eventos

## Código Relevante

### Ubicación de la Implementación
- **Archivo**: `KNOCKERbeh2/scripts/main.js`
- **Líneas**: 1-220 (Sistema de Configuración Global)
- **Líneas**: 12518-13000 (ConfigSchema y Parser)

### Funciones Principales
1. **currentConfig** - Objeto global con configuración activa
2. **loadConfig(jsonString)** - Carga configuración desde JSON
3. **getCurrentConfig()** - Obtiene configuración actual
4. **get*()** - Funciones de acceso a valores de configuración

## Conclusión

La tarea 15.3 está **completamente implementada**. Todo el soporte de configuración para los tres sistemas (Vínculo, Chat, Eventos Raros) fue incluido durante la implementación de la tarea 15.1, por lo que no se requieren cambios adicionales.

La configuración es:
- ✅ **Funcional**: Todas las funciones de acceso están implementadas
- ✅ **Integrada**: Los sistemas usan las funciones de configuración
- ✅ **Validada**: Existe validación de tipos y rangos
- ✅ **Documentada**: Incluye documentación completa
- ✅ **Testeable**: Comandos in-game para pruebas

---

**Fecha de Completación**: Task implementada en 15.1, verificada en 15.3  
**Estado Final**: ✅ COMPLETADO - No requiere cambios adicionales
