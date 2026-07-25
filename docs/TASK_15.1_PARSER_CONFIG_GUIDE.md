# Guía del Parser de Configuración - Tarea 15.1

## Resumen

La Tarea 15.1 implementa un **parser de archivos de configuración JSON** para el addon "The Obsessed Knocker". Este sistema permite cargar, validar y aplicar configuraciones personalizadas para los diferentes sistemas del addon.

### Requisitos Implementados

- ✅ **10.1**: Parser que convierte JSON string a objeto Config
- ✅ **10.2**: Retorna errores descriptivos para configuraciones inválidas
- ✅ **10.5**: Soporta sintaxis JSON estándar
- ✅ **10.6**: Valida tipos de datos en el archivo de configuración

---

## Características Principales

### 1. Parseo de Configuración JSON

La función principal `parseConfig(jsonString)` permite parsear un archivo de configuración JSON y retorna un objeto validado:

```javascript
const configJson = '{ "bondSystem": { ... } }';
const result = parseConfig(configJson);

if (result.success) {
    console.log("Configuración válida:", result.config);
} else {
    console.error("Error:", result.error.toString());
}
```

### 2. Validación de Tipos de Datos

El parser valida automáticamente:
- **Números** (con rangos mín/máx)
- **Booleanos**
- **Strings**
- **Objetos** (con propiedades anidadas)

### 3. Manejo de Errores Descriptivos

Cuando la configuración es inválida, el parser retorna errores claros en **español**:

```
[Error de Configuración: INVALID_TYPE] El campo "bondSystem.initialBond" debe ser un número. Tipo recibido: string
  Campo: "bondSystem.initialBond"
  Valor recibido: "cero"
```

### 4. Valores por Defecto

Los campos opcionales faltantes se rellenan automáticamente con valores por defecto.

---

## Estructura de Configuración

El parser soporta tres secciones principales:

### 📊 **bondSystem** - Sistema de Vínculo

```json
{
  "bondSystem": {
    "initialBond": 0,           // Vínculo inicial (0-500)
    "bondMultiplier": 1.0,      // Multiplicador de ganancia/pérdida (0.1-10.0)
    "tierThresholds": {
      "stranger": 0,            // Umbral Tier 0 (0-99)
      "watched": 100,           // Umbral Tier 1 (100-249)
      "familiar": 250,          // Umbral Tier 2 (250-399)
      "obsessed": 400           // Umbral Tier 3 (400-500)
    },
    "maxBond": 500              // Vínculo máximo (100-1000)
  }
}
```

### 💬 **chatSystem** - Sistema de Chat (IA Conversacional)

```json
{
  "chatSystem": {
    "cooldownSeconds": 30,      // Cooldown entre respuestas (5-300 seg)
    "responseProbabilities": {
      "tier0": 0.20,            // Probabilidad Tier 0 (0.0-1.0)
      "tier1": 0.40,            // Probabilidad Tier 1 (0.0-1.0)
      "tier2": 0.60,            // Probabilidad Tier 2 (0.0-1.0)
      "tier3": 0.80             // Probabilidad Tier 3 (0.0-1.0)
    },
    "enableNicknameSystem": true  // Habilitar apodos personalizados (opcional)
  }
}
```

### ✨ **rareEventsSystem** - Sistema de Eventos Raros

```json
{
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.05,        // Diálogos raros 5-10%
    "baseUltraRareDialogueProbability": 0.015,  // Diálogos ultra-raros 1-2%
    "specialAppearanceProbability": 0.007,      // Apariciones especiales 0.5-1%
    "secretInteractionProbability": 0.01,       // Interacciones secretas 1%
    "bonusProbabilityAfter50Hours": 0.005,      // Bonus +0.5% después 50h (opcional)
    "bonusProbabilityTier3": 0.01,              // Bonus +1% en Tier 3 (opcional)
    "enableEventTracking": true                 // Rastrear eventos (opcional)
  }
}
```

---

## Ejemplos de Uso

### ✅ Ejemplo 1: Configuración Válida

```javascript
const validConfig = `{
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

const result = parseConfig(validConfig);
// result.success === true
// result.config contiene la configuración validada
```

### ❌ Ejemplo 2: Tipo de Dato Incorrecto

```javascript
const invalidConfig = `{
  "bondSystem": {
    "initialBond": "cero",  // ❌ Debe ser número
    "bondMultiplier": 1.0,
    ...
  },
  ...
}`;

const result = parseConfig(invalidConfig);
// result.success === false
// result.error.type === "INVALID_TYPE"
// result.error.field === "bondSystem.initialBond"
```

### ❌ Ejemplo 3: Valor Fuera de Rango

```javascript
const outOfRangeConfig = `{
  "bondSystem": {
    "initialBond": 600,  // ❌ Máximo permitido: 500
    ...
  },
  ...
}`;

const result = parseConfig(outOfRangeConfig);
// result.success === false
// result.error.type === "OUT_OF_RANGE"
// result.error.message incluye "Valor máximo: 500"
```

### ❌ Ejemplo 4: Campo Requerido Faltante

```javascript
const missingFieldConfig = `{
  "bondSystem": {
    // ❌ Falta "initialBond" (requerido)
    "bondMultiplier": 1.0,
    ...
  },
  ...
}`;

const result = parseConfig(missingFieldConfig);
// result.success === false
// result.error.type === "MISSING_FIELD"
// result.error.message === "El campo requerido 'bondSystem.initialBond' está faltante."
```

### ❌ Ejemplo 5: Sintaxis JSON Inválida

```javascript
const syntaxErrorConfig = `{
  "bondSystem": {
    "initialBond": 0,  // ❌ Coma extra
  }
}`;

const result = parseConfig(syntaxErrorConfig);
// result.success === false
// result.error.type === "SYNTAX_ERROR"
// result.error.message incluye el error específico de JSON.parse()
```

---

## Funciones Públicas

### `parseConfig(jsonString)`

Parsea y valida una configuración JSON.

**Parámetros:**
- `jsonString` (string): Configuración en formato JSON

**Retorna:**
```javascript
{
  success: boolean,
  config: object | null,  // Configuración validada (si success=true)
  error: ConfigError | null  // Objeto de error (si success=false)
}
```

**Ejemplo:**
```javascript
const result = parseConfig(jsonString);
if (result.success) {
    // Usar result.config
} else {
    console.error(result.error.toString());
}
```

---

### `getDefaultConfig()`

Genera un objeto de configuración con todos los valores por defecto.

**Retorna:**
```javascript
{
  bondSystem: { ... },
  chatSystem: { ... },
  rareEventsSystem: { ... }
}
```

**Ejemplo:**
```javascript
const defaultConfig = getDefaultConfig();
console.log(defaultConfig.chatSystem.cooldownSeconds);  // 30
```

---

### `ConfigError`

Clase de error con información descriptiva.

**Propiedades:**
- `type`: Tipo de error (SYNTAX_ERROR, INVALID_TYPE, etc.)
- `message`: Mensaje descriptivo en español
- `field`: Campo que causó el error (opcional)
- `value`: Valor que causó el error (opcional)

**Método:**
- `toString()`: Genera mensaje de error formateado

**Ejemplo:**
```javascript
if (!result.success) {
    console.error(result.error.toString());
    // [Error de Configuración: INVALID_TYPE] El campo "..." debe ser...
    //   Campo: "..."
    //   Valor recibido: ...
}
```

---

## Archivos de Prueba Incluidos

El sistema incluye archivos de configuración de ejemplo para probar diferentes casos:

1. **config_example.json** - Configuración válida completa
2. **config_invalid_type.json** - Error de tipo de dato
3. **config_out_of_range.json** - Error de valor fuera de rango
4. **config_missing_required.json** - Error de campo requerido faltante
5. **test_parser.js** - Script de pruebas standalone

### Ejecutar Pruebas

```bash
# En Minecraft Bedrock
1. Cargar el addon en un mundo de prueba
2. El parser se carga automáticamente con main.js
3. Descomentar la línea "exampleParseConfig();" al final de main.js
4. Los resultados aparecen en la consola de contenido

# Standalone (requiere extraer funciones)
node KNOCKERbeh2/test_parser.js
```

---

## Tipos de Errores

El parser detecta y reporta los siguientes tipos de errores:

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `SYNTAX_ERROR` | Error de sintaxis JSON | Coma extra, comillas faltantes |
| `INVALID_TYPE` | Tipo de dato incorrecto | String en vez de number |
| `OUT_OF_RANGE` | Valor fuera de rango | initialBond = 600 (max: 500) |
| `MISSING_FIELD` | Campo requerido faltante | Falta "initialBond" |
| `INVALID_STRUCTURE` | Estructura incorrecta | Array en vez de objeto |
| `VALIDATION_ERROR` | Error genérico de validación | Tipo no reconocido |

---

## Mejores Prácticas

### ✅ Recomendaciones

1. **Siempre verificar `result.success`** antes de usar la configuración
2. **Usar `getDefaultConfig()`** como base para configuraciones personalizadas
3. **Validar configuración al inicio** del addon para detectar errores temprano
4. **Registrar errores en logs** para debugging
5. **Aplicar valores razonables** dentro de los rangos permitidos

### ⚠️ Advertencias

1. **No modificar ConfigSchema** sin actualizar validaciones
2. **No parsear configuraciones de fuentes no confiables** sin sanitización
3. **No ignorar errores de configuración** - pueden causar comportamiento inesperado
4. **No usar valores extremos** sin probar primero

---

## Integración con Otros Sistemas

El parser de configuración está diseñado para integrarse con:

- **Sistema de Vínculo** (Fase 6): Valores iniciales y multiplicadores
- **Sistema de Chat** (Fase 2): Cooldowns y probabilidades
- **Sistema de Eventos Raros** (Fase 9): Probabilidades de eventos

### Ejemplo de Integración

```javascript
// Al inicio del addon
const configJson = loadConfigFromFile();  // Función hipotética
const result = parseConfig(configJson);

if (result.success) {
    // Aplicar configuración a sistemas
    CHAT_COOLDOWN_MS = result.config.chatSystem.cooldownSeconds * 1000;
    
    // Actualizar probabilidades de eventos
    UltraRareEvents.forEach(event => {
        event.baseProbability = result.config.rareEventsSystem.baseUltraRareDialogueProbability;
    });
    
    console.log("✓ Configuración cargada exitosamente");
} else {
    console.error("✗ Error al cargar configuración:");
    console.error(result.error.toString());
    console.log("→ Usando configuración por defecto");
}
```

---

## Preguntas Frecuentes

### ¿Puedo usar configuración parcial?

**Sí.** Los campos opcionales se rellenan automáticamente con valores por defecto.

### ¿Qué pasa si un archivo tiene campos extra?

Los campos extra se **ignoran**. El parser solo valida campos definidos en `ConfigSchema`.

### ¿Cómo guardo una configuración personalizada?

Usa la función `serializeConfig()` (Tarea 15.2) para convertir un objeto Config de vuelta a JSON formateado.

### ¿Puedo cambiar los rangos permitidos?

Sí, modificando `ConfigSchema`. Ejemplo:
```javascript
ConfigSchema.bondSystem.properties.initialBond.max = 1000;
```

### ¿El parser funciona en multiplayer?

**Sí.** El parser es independiente del servidor/cliente y funciona en ambos modos.

---

## Estado de Implementación

✅ **COMPLETADO** - Tarea 15.1

### Siguiente Fase

- **Tarea 15.2**: Crear serializer de configuración (pretty printer)
- **Tarea 15.3**: Implementar soporte para opciones adicionales
- **Tarea 15.4**: Validar propiedad round-trip (parse → print → parse)

---

## Soporte

Para problemas o preguntas sobre el parser:

1. Revisar los archivos de ejemplo incluidos
2. Ejecutar el script de pruebas (`test_parser.js`)
3. Verificar que la configuración cumple con el esquema
4. Revisar mensajes de error descriptivos

---

**Última actualización:** Tarea 15.1 completada  
**Autor:** Sistema de Parser de Configuración - The Obsessed Knocker
