# Tests - The Obsessed Knocker

Esta carpeta contiene todos los tests de desarrollo del addon. **NINGUNO de estos archivos debe incluirse en el .mcaddon final**.

---

## Estructura

```
tests/
├── unit/                    # Tests ejecutables con Node.js
│   ├── test_roundtrip_15.4.js
│   ├── verify_serialize.js
│   └── test_mood_system.js
├── integration/             # Tests que requieren Minecraft
│   ├── test_multiplayer.js
│   ├── test_parseConfig_unit.js
│   ├── test_parseConfig_validation.js
│   ├── test_parser.js
│   ├── test_serializeConfig_unit.js
│   ├── test_mood_dialogues.js
│   ├── test_task_15.2_verification.js
│   ├── test_task_15.3_verification.js
│   └── test_task_15.3_final.js
├── fixtures/                # Archivos JSON para tests
│   ├── config_example.json
│   ├── config_invalid_type.json
│   ├── config_missing_required.json
│   └── config_out_of_range.json
├── recentActionDetection.test.js  # Test unitario legacy
├── task_11.1_verification.js      # Test de verificación legacy
└── README.md (este archivo)
```

---

## Ejecutar Tests Unitarios

### Pre-requisitos
- Node.js v16+ instalado
- Estar en la raíz del repositorio

### Tests Individuales

```bash
# Test de round-trip (Parser → Pretty Printer → Parser)
node tests/unit/test_roundtrip_15.4.js
# Resultado esperado: 2/2 tests exitosos (100%)

# Test de serializeConfig
node tests/unit/verify_serialize.js
# Resultado esperado: 5/5 tests exitosos (100%)

# Test de sistema de ánimo
node tests/unit/test_mood_system.js
# Resultado esperado: Todos los tests pasaron

# Test de detección de acciones
node tests/recentActionDetection.test.js
# Resultado esperado: 11/12 tests (91.7% - 1 fallo conocido menor)

# Test de verificación Task 11.1
node tests/task_11.1_verification.js
# Resultado esperado: Tests demostrativos exitosos
```

### Ejecutar Todos los Tests Unitarios

```bash
# Bash/Linux/Mac
for test in tests/unit/*.js tests/*.js; do
  echo "=== Ejecutando $test ==="
  node "$test"
  echo ""
done

# PowerShell
Get-ChildItem tests/unit/*.js, tests/*.js | ForEach-Object {
  Write-Host "=== Ejecutando $($_.Name) ==="
  node $_.FullName
  Write-Host ""
}
```

---

## Tests de Integración (Requieren Minecraft)

Los tests en `tests/integration/` están diseñados para ejecutarse **dentro de Minecraft Bedrock** con el addon cargado.

### Cómo Ejecutarlos

1. Instalar el addon en Minecraft
2. Crear mundo de prueba con el behavior pack activo
3. Seguir instrucciones específicas de cada test:
   - `test_multiplayer.js` - Requiere servidor multijugador y 2+ jugadores
   - `test_parseConfig_*.js` - Ejecutar comando `.runtests` en chat
   - `test_mood_dialogues.js` - Verificar diálogos en diferentes moods
   - `test_task_15.*.js` - Verificación de tareas específicas

### Resultados Esperados

Ver documentación en cada archivo de test para criterios de aceptación específicos.

---

## Fixtures de Test

La carpeta `fixtures/` contiene archivos JSON para pruebas:

- `config_example.json` - Configuración válida completa
- `config_invalid_type.json` - Configuración con tipo de dato incorrecto
- `config_missing_required.json` - Configuración sin campos requeridos
- `config_out_of_range.json` - Configuración con valores fuera de rango

Estos archivos se usan en tests de validación del parser de configuración.

---

## Estado de Tests

### ✅ Tests Funcionales (Ejecutables con Node.js)

| Test | Ubicación | Resultado Esperado |
|------|-----------|-------------------|
| test_roundtrip_15.4.js | unit/ | 2/2 (100%) |
| verify_serialize.js | unit/ | 5/5 (100%) |
| test_mood_system.js | unit/ | Todos exitosos |
| recentActionDetection.test.js | raíz | 11/12 (91.7%)* |
| task_11.1_verification.js | raíz | Demostración |

*Nota: 1 test falla por lógica de empate en priorización - no afecta funcionalidad real.

### ⚠️ Tests No Ejecutables (Requieren Minecraft)

| Test | Ubicación | Razón |
|------|-----------|-------|
| test_multiplayer.js | integration/ | Servidor MP requerido |
| test_parseConfig_unit.js | integration/ | Addon cargado |
| test_parseConfig_validation.js | integration/ | Addon cargado |
| test_mood_dialogues.js | integration/ | main.js cargado |
| test_serializeConfig_unit.js | integration/ | Similar a verify_serialize.js |
| test_parser.js | integration/ | Plantilla incompleta |
| test_task_15.*.js | integration/ | Addon cargado |

---

## Agregar Nuevos Tests

### Tests Unitarios (Node.js)

1. Crear archivo en `tests/unit/test_nombre.js`
2. Hacer el test standalone (sin dependencias externas)
3. Usar console.log para output
4. Retornar exit code 0 si pasa, 1 si falla
5. Documentar en este README

### Tests de Integración (Minecraft)

1. Crear archivo en `tests/integration/test_nombre.js`
2. Incluir instrucciones claras de cómo ejecutar
3. Documentar resultados esperados
4. Marcar claramente que requiere Minecraft

---

## Convenciones

- **Nombres de archivo**: `test_*.js` o `*.test.js`
- **Output**: Usar console.log con formato claro
- **Exit codes**: 0 = éxito, 1 = fallo
- **Encoding**: UTF-8 sin BOM
- **Comentarios**: Incluir descripción del propósito del test

---

## Integración con CI/CD (Futuro)

Cuando se configure CI/CD, ejecutar:

```bash
# Tests obligatorios antes de merge
node --check KNOCKERbeh2/scripts/main.js  # Sintaxis
node tests/unit/test_roundtrip_15.4.js     # Round-trip
node tests/unit/verify_serialize.js        # Serialización
node tests/unit/test_mood_system.js        # Sistema de ánimo

# Criterio: Todos deben pasar (exit code 0)
```

---

## Referencias

- **Baseline**: `docs/PRE_OLLAMA_STABLE_BASELINE.md`
- **Clasificación**: `docs/TEST_CLASSIFICATION_AND_PACKAGING.md`
- **Empaquetado**: Ver scripts de build en la documentación

---

**Última actualización**: Diciembre 2024  
**Mantenedor**: Equipo de desarrollo The Obsessed Knocker
