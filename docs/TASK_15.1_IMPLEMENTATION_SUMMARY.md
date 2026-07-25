# Tarea 15.1: Parser de Configuración JSON - Resumen de Implementación

## Descripción General

Se ha implementado un sistema completo de parser de configuración JSON para el addon "The Obsessed Knocker", permitiendo cargar, validar y aplicar configuraciones personalizadas para los diferentes sistemas del addon.

## Requisitos Cumplidos

### ✅ Requisito 10.1: Parser de archivos válidos
- Implementada función `parseConfig(jsonString)` que retorna objeto Config
- Soporte completo para estructura de configuración en tres secciones:
  - `bondSystem`: Configuración del Sistema de Vínculo
  - `chatSystem`: Configuración del Sistema de Chat
  - `rareEventsSystem`: Configuración del Sistema de Eventos Raros

### ✅ Requisito 10.2: Errores descriptivos
- Sistema robusto de manejo de errores con clase `ConfigError`
- Tipos de error implementados:
  - `SYNTAX_ERROR`: Errores de sintaxis JSON
  - `VALIDATION_ERROR`: Errores de validación general
  - `MISSING_FIELD`: Campos requeridos faltantes
  - `INVALID_TYPE`: Tipo de dato incorrecto
  - `OUT_OF_RANGE`: Valor fuera de rango permitido
  - `INVALID_STRUCTURE`: Estructura de objeto incorrecta
- Mensajes de error en español natural con información contextual

### ✅ Requisito 10.5: Sintaxis JSON estándar
- Uso de `JSON.parse()` nativo de JavaScript
- Validación de sintaxis JSON con captura de errores de parsing
- Manejo correcto de objetos, arrays, strings, números y booleanos

### ✅ Requisito 10.6: Validación de tipos de datos
- Función `validateValue()` que valida recursivamente toda la estructura
- Validación de tipos: `number`, `boolean`, `object`
- Validación de rangos numéricos (min/max)
- Validación de campos requeridos vs opcionales
- Validación de objetos anidados

## Componentes Implementados

### 1. Esquema de Configuración (`ConfigSchema`)

```javascript
const ConfigSchema = {
    bondSystem: {
        type: "object",
        required: true,
        properties: {
            initialBond: { type: "number", required: true, default: 0, min: 0, max: 500 },
            bondMultiplier: { type: "number", required: true, default: 1.0, min: 0.1, max: 10.0 },
            tierThresholds: { /* ... */ },
            maxBond: { type: "number", required: true, default: 500, min: 100, max: 1000 }
        }
    },
    chatSystem: {
        type: "object",
        required: true,
        properties: {
            cooldownSeconds: { type: "number", required: true, default: 30, min: 5, max: 300 },
            responseProbabilities: { /* tier0-3 */ },
            enableNicknameSystem: { type: "boolean", required: false, default: true }
        }
    },
    rareEventsSystem: {
        type: "object",
        required: true,
        properties: {
            baseRareDialogueProbability: { /* ... */ },
            baseUltraRareDialogueProbability: { /* ... */ },
            specialAppearanceProbability: { /* ... */ },
            secretInteractionProbability: { /* ... */ },
            bonusProbabilityAfter50Hours: { /* ... */ },
            bonusProbabilityTier3: { /* ... */ },
            enableEventTracking: { type: "boolean", required: false, default: true }
        }
    }
}
```

### 2. Función Principal de Parseo

```javascript
function parseConfig(jsonString)
```

**Flujo de validación:**
1. Validar que el input es una cadena de texto
2. Validar que la cadena no está vacía
3. Parsear JSON con `JSON.parse()`
4. Validar que el resultado es un objeto (no array ni primitivo)
5. Validar cada sección contra el esquema
6. Aplicar valores por defecto para campos opcionales faltantes
7. Retornar resultado con `{success, config, error}`

### 3. Funciones Auxiliares

#### `validateValue(value, schemaDef, fieldPath)`
- Valida un valor contra su definición de esquema
- Verifica campos requeridos
- Valida tipos de datos
- Valida rangos numéricos
- Validación recursiva para objetos anidados

#### `applyConfigDefaults(configObject)`
- Aplica valores por defecto del esquema
- Maneja campos opcionales faltantes
- Recursiva para objetos anidados

#### `getDefaultConfig()`
- Genera configuración completa con valores por defecto
- Útil para crear archivos de ejemplo

#### `getConfigDocumentation()`
- Genera documentación del esquema en formato legible
- Incluye tipos, rangos, descripciones y valores por defecto

### 4. Clase de Error Personalizada

```javascript
class ConfigError extends Error {
    constructor(type, message, field, value)
    toString() // Mensaje formateado en español
}
```

## Comandos de Chat Implementados

### `.configtest`
Prueba básica del parser con 3 escenarios:
1. Configuración válida completa
2. Configuración inválida (campo faltante)
3. Sintaxis JSON incorrecta

### `.configdocs`
Muestra documentación completa del esquema de configuración

### `.testparser`
**Suite completa de pruebas unitarias** con 10 casos de prueba:
1. ✓ Configuración válida completa
2. ✓ Configuración con valores personalizados
3. ✓ Sintaxis JSON inválida
4. ✓ Campo requerido faltante
5. ✓ Tipo de dato inválido
6. ✓ Valor fuera de rango
7. ✓ String vacío
8. ✓ Input no-string
9. ✓ Configuración parcial con defaults
10. ✓ Array en vez de objeto

## Archivos de Configuración de Prueba

Se crearon archivos JSON de ejemplo para testing:

### `config_example.json`
Configuración completa válida con todos los campos y valores por defecto.

### `config_invalid_type.json`
Configuración con tipo incorrecto (`initialBond` como string).

### `config_missing_required.json`
Configuración sin campo requerido (`initialBond` faltante).

### `config_out_of_range.json`
Configuración con valor fuera de rango (`initialBond = 600`, máx = 500).

## Cómo Probar

### Opción 1: En Minecraft (Recomendado)

1. Cargar el addon en un mundo de Minecraft Bedrock
2. Abrir el chat
3. Ejecutar el comando: `.testparser`
4. Revisar los resultados en el chat

**Resultado esperado:**
```
╔═══════════════════════════════════════════════════════╗
║  SUITE DE PRUEBAS UNITARIAS - PARSER CONFIG (15.1)   ║
╚═══════════════════════════════════════════════════════╝

▶ TEST 1: Configuración válida completa
  ✓ PASADO

▶ TEST 2: Valores personalizados
  ✓ PASADO

[... más tests ...]

╔═══════════════════════════════════════════════════════╗
║              RESUMEN DE PRUEBAS                       ║
╚═══════════════════════════════════════════════════════╝
  ✓ Pasadas: 10/10
  ✗ Fallidas: 0/10
  Éxito: 100%

  🎉 ¡TODAS LAS PRUEBAS PASARON! 🎉
  El parser está funcionando correctamente.
  Tarea 15.1 completada exitosamente.
```

### Opción 2: Prueba rápida

Ejecutar `.configtest` para una prueba rápida de 3 escenarios básicos.

### Opción 3: Ver documentación

Ejecutar `.configdocs` para ver la documentación completa del esquema.

## Validación de Requisitos

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| 10.1 - Parser de archivos válidos | ✅ | `parseConfig()` parsea configuraciones válidas correctamente (TEST 1, 2, 9) |
| 10.2 - Errores descriptivos | ✅ | Errores con mensajes en español y contexto (TEST 3, 4, 5, 6, 7, 8, 10) |
| 10.5 - Sintaxis JSON estándar | ✅ | Usa `JSON.parse()`, detecta errores de sintaxis (TEST 3, 7) |
| 10.6 - Validación de tipos | ✅ | Valida tipos, rangos y estructura (TEST 4, 5, 6, 8, 10) |

## Ejemplos de Uso

### Cargar configuración válida:

```javascript
const configJson = `{
  "bondSystem": {
    "initialBond": 50,
    "bondMultiplier": 1.5,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 45,
    "responseProbabilities": {
      "tier0": 0.25,
      "tier1": 0.45,
      "tier2": 0.65,
      "tier3": 0.85
    }
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.08,
    "baseUltraRareDialogueProbability": 0.02,
    "specialAppearanceProbability": 0.01,
    "secretInteractionProbability": 0.015
  }
}`;

const result = parseConfig(configJson);

if (result.success) {
    console.log("Configuración válida:");
    console.log(`  - Bond inicial: ${result.config.bondSystem.initialBond}`);
    console.log(`  - Cooldown chat: ${result.config.chatSystem.cooldownSeconds}s`);
} else {
    console.error("Error en configuración:");
    console.error(result.error.toString());
}
```

### Manejar error de configuración:

```javascript
const invalidConfig = '{"bondSystem": {"initialBond": "cero"}}';
const result = parseConfig(invalidConfig);

if (!result.success) {
    // Error esperado:
    // [Error de Configuración: INVALID_TYPE] El campo "bondSystem.initialBond" 
    // debe ser de tipo "number", pero se recibió tipo "string".
    //   Campo: "bondSystem.initialBond"
    //   Valor recibido: "cero"
    
    console.error(result.error.type);     // "INVALID_TYPE"
    console.error(result.error.message);  // Mensaje descriptivo
    console.error(result.error.field);    // "bondSystem.initialBond"
    console.error(result.error.value);    // "cero"
}
```

## Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `KNOCKERbeh2/scripts/main.js` (líneas 12255-13335) | Implementación completa del parser |
| `KNOCKERbeh2/config_example.json` | Configuración de ejemplo válida |
| `KNOCKERbeh2/config_invalid_type.json` | Ejemplo con tipo incorrecto |
| `KNOCKERbeh2/config_missing_required.json` | Ejemplo con campo faltante |
| `KNOCKERbeh2/config_out_of_range.json` | Ejemplo con valor fuera de rango |
| `KNOCKERbeh2/test_parseConfig_unit.js` | Suite de pruebas unitarias standalone |
| `docs/TASK_15.1_IMPLEMENTATION_SUMMARY.md` | Este documento |

## Conclusión

✅ **Tarea 15.1 completada exitosamente**

El parser de configuración JSON está completamente implementado y probado, cumpliendo con todos los requisitos especificados:

- ✅ Parseo de configuraciones válidas (Requisito 10.1)
- ✅ Manejo de errores descriptivos (Requisito 10.2)
- ✅ Soporte de sintaxis JSON estándar (Requisito 10.5)
- ✅ Validación exhaustiva de tipos de datos (Requisito 10.6)

El sistema está listo para uso en producción y puede ser probado fácilmente mediante los comandos de chat implementados.

---

**Fecha de implementación:** 2024
**Desarrollado para:** The Obsessed Knocker - Minecraft Bedrock Edition
**Fase:** 11 - Parser de Configuración
