# Tarea 15.1: Parser de Configuración JSON - Resumen de Implementación

## Estado: ✅ COMPLETADO

La Tarea 15.1 requería implementar la función `parseConfig(jsonString)` con validación JSON, validación de tipos, y manejo de errores descriptivos. **Esta tarea ya está completamente implementada** en el archivo `main.js`.

## Ubicación del Código

**Archivo:** `KNOCKERbeh2/scripts/main.js`  
**Líneas:** Aproximadamente 12256-13150  
**Sección:** "SISTEMA DE PARSER DE CONFIGURACIÓN (TAREA 15.1)"

## Funcionalidad Implementada

### parseConfig(jsonString)

Función principal que parsea y valida archivos de configuración JSON.

**Parámetros:**
- `jsonString` (string): Cadena JSON con la configuración

**Retorno:**
```javascript
{
    success: boolean,        // true si el parseo fue exitoso
    config: object|null,     // Objeto de configuración (si success=true)
    error: ConfigError|null  // Error descriptivo (si success=false)
}
```

## Requisitos Cumplidos

### ✅ 10.1: Parser de archivos de configuración válidos
- Parsea JSON estándar correctamente
- Retorna objeto de configuración validado
- Aplica valores por defecto para campos opcionales

### ✅ 10.2: Errores descriptivos para configuraciones inválidas
- Clase `ConfigError` con información detallada
- Mensajes en español
- Indica campo y valor que causó el error

### ✅ 10.5: Soporte de sintaxis JSON estándar
- Usa `JSON.parse()` nativo
- Maneja objetos JSON complejos con anidamiento

### ✅ 10.6: Validación de tipos de datos
- Valida tipos: number, string, boolean, object
- Verifica rangos (min/max)
- Detecta NaN e Infinity
- Distingue objetos de arrays

## Tipos de Errores

La función detecta y reporta los siguientes errores:

| Tipo | Descripción |
|------|-------------|
| `SYNTAX_ERROR` | Error de sintaxis JSON (comas extra, comillas faltantes, etc.) |
| `MISSING_FIELD` | Campo requerido no está presente |
| `INVALID_TYPE` | Tipo de dato incorrecto (ej: string donde se espera number) |
| `OUT_OF_RANGE` | Valor numérico fuera del rango permitido (min/max) |
| `INVALID_STRUCTURE` | Estructura incorrecta (ej: array donde se espera object) |

## Esquema de Configuración Soportado

### bondSystem (Sistema de Vínculo)
- `initialBond` (number, 0-500): Vínculo inicial
- `bondMultiplier` (number, 0.1-10.0): Multiplicador de vínculo
- `tierThresholds` (object): Umbrales de tier
- `maxBond` (number, 100-1000): Vínculo máximo

### chatSystem (Sistema de Chat)
- `cooldownSeconds` (number, 5-300): Cooldown entre respuestas
- `responseProbabilities` (object): Probabilidades por tier
- `enableNicknameSystem` (boolean, opcional): Habilitar apodos

### rareEventsSystem (Sistema de Eventos Raros)
- `baseRareDialogueProbability` (number, 0.0-1.0): Probabilidad diálogos raros
- `baseUltraRareDialogueProbability` (number, 0.0-1.0): Probabilidad diálogos ultra-raros
- `specialAppearanceProbability` (number, 0.0-1.0): Probabilidad apariciones especiales
- `secretInteractionProbability` (number, 0.0-1.0): Probabilidad interacciones secretas
- `bonusProbabilityAfter50Hours` (number, 0.0-0.1, opcional): Bonus después de 50 horas
- `bonusProbabilityTier3` (number, 0.0-0.1, opcional): Bonus en Tier 3
- `enableEventTracking` (boolean, opcional): Habilitar rastreo de eventos

## Archivos de Prueba Incluidos

Se incluyen 4 archivos de configuración para pruebas:

1. **config_example.json** ✅ - Configuración válida completa
2. **config_invalid_type.json** ❌ - Tipo de dato incorrecto
3. **config_missing_required.json** ❌ - Campo requerido faltante
4. **config_out_of_range.json** ❌ - Valor fuera de rango

## Comandos de Prueba en Minecraft

Puedes probar el parser directamente en el juego:

### .testparser
Ejecuta suite completa de 10 pruebas unitarias y muestra resultados en el chat.

```
Uso: .testparser
```

**Resultado esperado:** 10/10 pruebas pasadas (100% éxito)

### .configtest
Ejecuta prueba rápida con configuraciones válidas e inválidas.

```
Uso: .configtest
```

### .configdocs
Muestra documentación completa del esquema de configuración.

```
Uso: .configdocs
```

## Ejemplo de Uso

### Configuración Válida

```javascript
const configJSON = `{
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
    }
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.05,
    "baseUltraRareDialogueProbability": 0.015,
    "specialAppearanceProbability": 0.007,
    "secretInteractionProbability": 0.01
  }
}`;

const result = parseConfig(configJSON);

if (result.success) {
    console.log("✓ Configuración válida");
    console.log("Bond inicial:", result.config.bondSystem.initialBond);
    // Usar result.config...
} else {
    console.error(result.error.toString());
}
```

### Configuración Inválida

```javascript
const invalidConfig = `{
  "bondSystem": {
    "initialBond": "cero"
  }
}`;

const result = parseConfig(invalidConfig);

// result.success === false
// result.error.type === "INVALID_TYPE"
// result.error.message === 'El campo "bondSystem.initialBond" debe ser de tipo "number"...'
```

## Validaciones Implementadas

| Validación | Descripción |
|------------|-------------|
| **Sintaxis JSON** | Detecta errores de sintaxis (comas, comillas, llaves) |
| **Tipo string** | Verifica que strings sean strings |
| **Tipo number** | Verifica que números sean números válidos |
| **Tipo boolean** | Verifica que booleanos sean booleanos |
| **Tipo object** | Verifica que objetos sean objetos (no arrays) |
| **Campos requeridos** | Verifica presencia de campos obligatorios |
| **Rangos numéricos** | Verifica valores min/max |
| **NaN/Infinity** | Rechaza números inválidos |
| **Valores por defecto** | Aplica defaults a campos opcionales faltantes |
| **Validación recursiva** | Valida objetos anidados profundamente |

## Funciones Auxiliares

Además de `parseConfig()`, se implementaron:

### validateValue(value, schemaDef, fieldPath)
Valida un valor individual contra su definición de esquema.

### applyConfigDefaults(configObject)
Aplica valores por defecto a campos opcionales faltantes.

### getDefaultConfig()
Retorna configuración con todos los valores por defecto.

### getConfigDocumentation()
Genera documentación legible del esquema en texto.

## Mensajes de Error Descriptivos

Los errores incluyen información completa:

```
[Error de Configuración: INVALID_TYPE] El campo "bondSystem.initialBond" debe ser de tipo "number", pero se recibió tipo "string".
  Campo: "bondSystem.initialBond"
  Valor recibido: "cero"
```

```
[Error de Configuración: OUT_OF_RANGE] El campo "bondSystem.initialBond" debe ser como máximo 500, pero se recibió 600.
  Campo: "bondSystem.initialBond"
  Valor recibido: 600
```

```
[Error de Configuración: MISSING_FIELD] El campo requerido "bondSystem.initialBond" está faltante.
  Campo: "bondSystem.initialBond"
```

## Cómo Probar

### Opción 1: En Minecraft (Recomendado)

1. Carga el addon en Minecraft Bedrock
2. Entra a un mundo con el addon activado
3. Escribe en el chat: `.testparser`
4. Revisa los resultados (deberían ser 10/10 ✓)

### Opción 2: Script de Validación

```bash
cd KNOCKERbeh2
node test_parseConfig_validation.js
```

Este script verifica que todos los componentes estén presentes.

## Archivos Relacionados

- **Implementación:** `KNOCKERbeh2/scripts/main.js` (líneas 12256+)
- **Pruebas unitarias:** `KNOCKERbeh2/test_parseConfig_unit.js`
- **Script de prueba:** `KNOCKERbeh2/test_parser.js`
- **Validación:** `KNOCKERbeh2/test_parseConfig_validation.js`
- **Configs de prueba:** 
  - `KNOCKERbeh2/config_example.json`
  - `KNOCKERbeh2/config_invalid_type.json`
  - `KNOCKERbeh2/config_missing_required.json`
  - `KNOCKERbeh2/config_out_of_range.json`
- **Documentación:** 
  - `docs/TASK_15.1_IMPLEMENTATION_VERIFICATION.md`
  - `docs/TASK_15.1_RESUMEN_ES.md`

## Conclusión

✅ **La Tarea 15.1 está completamente implementada y funcional.**

La función `parseConfig()` cumple con todos los requisitos:
- ✅ Parsea archivos JSON válidos (Req 10.1)
- ✅ Retorna errores descriptivos (Req 10.2)
- ✅ Soporta sintaxis JSON estándar (Req 10.5)
- ✅ Valida tipos de datos (Req 10.6)

El código está listo para uso en producción e incluye:
- Suite completa de pruebas unitarias
- Comandos de prueba integrados en el juego
- Documentación exhaustiva
- Mensajes de error en español
- Validación robusta de configuraciones

**No se requiere ninguna implementación adicional.**

---

**Para cualquier pregunta o para ejecutar las pruebas, carga el addon en Minecraft y ejecuta `.testparser` en el chat.**
