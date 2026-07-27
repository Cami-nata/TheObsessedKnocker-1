# TEST CLASSIFICATION AND PACKAGING GUIDE
## Clasificación de Tests y Guía de Empaquetado

**Fecha**: Diciembre 2024  
**Versión**: 1.0.0

---

## 1. PROPÓSITO

Este documento clasifica todos los archivos de test del proyecto y define qué debe incluirse en el `.mcaddon` final versus qué debe permanecer solo en el repositorio de desarrollo.

---

## 2. CLASIFICACIÓN DE TESTS

### 2.1 Tests Ejecutables y Mantenidos ✅

Estos tests funcionan correctamente y deben conservarse:

| Archivo | Ubicación | Estado | Ejecutable | Mover a tests/ |
|---------|-----------|--------|------------|----------------|
| `test_roundtrip_15.4.js` | `KNOCKERbeh2/` | ✅ Funcional | ✅ Sí (Node.js) | ✅ Sí |
| `verify_serialize.js` | `KNOCKERbeh2/` | ✅ Funcional | ✅ Sí (Node.js) | ✅ Sí |
| `test_mood_system.js` | Raíz | ✅ Funcional | ✅ Sí (Node.js) | ✅ Sí |
| `recentActionDetection.test.js` | `tests/` | ⚠️ 1 fallo menor | ✅ Sí (Node.js) | ✅ Ya está |
| `task_11.1_verification.js` | `tests/` | ✅ Funcional | ✅ Sí (Node.js) | ✅ Ya está |

### 2.2 Tests No Ejecutables (Requieren Minecraft) ⚠️

Estos tests están bien diseñados pero requieren cargar el addon en Minecraft:

| Archivo | Ubicación | Razón No Ejecutable | Conservar | Mover a tests/ |
|---------|-----------|---------------------|-----------|----------------|
| `test_multiplayer.js` | `KNOCKERbeh2/` | Requiere servidor MP | ✅ Sí | ✅ Sí |
| `test_parseConfig_unit.js` | `KNOCKERbeh2/` | Requiere Minecraft | ✅ Sí | ✅ Sí |
| `test_parseConfig_validation.js` | `KNOCKERbeh2/` | Requiere Minecraft | ✅ Sí | ✅ Sí |
| `test_mood_dialogues.js` | Raíz | Requiere main.js cargado | ✅ Sí | ✅ Sí |
| `test_task_15.2_verification.js` | `KNOCKERbeh2/` | Requiere Minecraft | ✅ Sí | ✅ Sí |
| `test_task_15.3_verification.js` | `KNOCKERbeh2/` | Requiere Minecraft | ✅ Sí | ✅ Sí |
| `test_task_15.3_final.js` | `KNOCKERbeh2/` | Requiere Minecraft | ✅ Sí | ✅ Sí |

### 2.3 Tests Incompletos o Plantillas 📝

Estos archivos son plantillas o están incompletos:

| Archivo | Ubicación | Estado | Acción Recomendada |
|---------|-----------|--------|-------------------|
| `test_parser.js` | `KNOCKERbeh2/` | Plantilla incompleta | Conservar como referencia, mover a tests/ |
| `test_serializeConfig_unit.js` | `KNOCKERbeh2/` | Similar a verify_serialize.js | Revisar si es duplicado |

### 2.4 Archivos de Configuración de Test 🔧

Archivos JSON usados por los tests:

| Archivo | Ubicación | Propósito | Acción |
|---------|-----------|-----------|--------|
| `config_example.json` | `KNOCKERbeh2/` | Ejemplo de config válida | Conservar, mover a tests/ |
| `config_invalid_type.json` | `KNOCKERbeh2/` | Test de validación | Conservar, mover a tests/ |
| `config_missing_required.json` | `KNOCKERbeh2/` | Test de validación | Conservar, mover a tests/ |
| `config_out_of_range.json` | `KNOCKERbeh2/` | Test de validación | Conservar, mover a tests/ |

---

## 3. ARCHIVOS QUE DEBEN ESTAR EN EL .MCADDON FINAL

### 3.1 Behavior Pack (KNOCKERbeh2)

**INCLUIR ✅**:
```
KNOCKERbeh2/
├── animations/
│   ├── allowk.json
│   └── respawn.json
├── animation_controllers/
│   ├── stuck.json
│   └── vanish.json
├── entities/
│   └── knocker.json
├── functions/
│   ├── dief.mcfunction
│   ├── fakkel.mcfunction
│   ├── spelen.mcfunction
│   ├── spelen_ES.mcfunction
│   └── tick.json
├── items/
│   └── whisper.json
├── scripts/
│   └── main.js
├── spawn_rules/
│   └── knocker.json
├── manifest.json
└── pack_icon.png
```

**EXCLUIR ❌**:
```
KNOCKERbeh2/
├── test_*.js                    (todos los tests)
├── verify_*.js                  (scripts de verificación)
├── config_*.json                (archivos de test)
└── .gitkeep o archivos temporales
```

### 3.2 Resource Pack (KNOCKERres2)

**INCLUIR ✅** (todos los archivos):
```
KNOCKERres2/
├── entity/
│   └── [archivos de cliente]
├── textures/
│   └── [texturas]
├── sounds/
│   └── [sonidos si aplica]
├── texts/
│   ├── es_MX.lang
│   └── [otros idiomas]
├── manifest.json
└── pack_icon.png
```

### 3.3 Archivos de Repositorio (NO incluir en .mcaddon)

**Conservar en repositorio, EXCLUIR del addon**:
```
/
├── .git/                        (control de versiones)
├── .gitignore
├── .claude/                     (configuración IA)
├── .kiro/                       (especificaciones)
├── tests/                       (todos los tests)
├── docs/                        (documentación)
├── *.md                        (README, guías, etc.)
├── test_*.js                   (tests en raíz)
└── AUDITORIA_TECNICA_FINAL.md
```

---

## 4. SCRIPT DE EMPAQUETADO PROPUESTO

### 4.1 Estructura del Script

```bash
#!/bin/bash
# build_addon.sh - Script para generar .mcaddon

# Configuración
BUILD_DIR="build"
BP_DIR="$BUILD_DIR/KNOCKERbeh2"
RP_DIR="$BUILD_DIR/KNOCKERres2"
OUTPUT_FILE="TheObsessedKnocker_v1.2.6.mcaddon"

# Limpiar build anterior
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copiar Behavior Pack (excluyendo tests)
echo "Copiando Behavior Pack..."
rsync -av --exclude='test_*.js' \
          --exclude='verify_*.js' \
          --exclude='config_*.json' \
          --exclude='.gitkeep' \
          KNOCKERbeh2/ "$BP_DIR/"

# Copiar Resource Pack
echo "Copiando Resource Pack..."
cp -r KNOCKERres2 "$BUILD_DIR/"

# Crear .mcaddon (ZIP)
echo "Creando .mcaddon..."
cd "$BUILD_DIR"
zip -r "../$OUTPUT_FILE" KNOCKERbeh2 KNOCKERres2

echo "✅ Addon creado: $OUTPUT_FILE"
echo "📦 Tamaño: $(du -h ../$OUTPUT_FILE | cut -f1)"
```

### 4.2 Para Windows (PowerShell)

```powershell
# build_addon.ps1

$BuildDir = "build"
$BPDir = "$BuildDir\KNOCKERbeh2"
$RPDir = "$BuildDir\KNOCKERres2"
$OutputFile = "TheObsessedKnocker_v1.2.6.mcaddon"

# Limpiar build anterior
if (Test-Path $BuildDir) { Remove-Item -Recurse -Force $BuildDir }
New-Item -ItemType Directory -Path $BuildDir | Out-Null

# Copiar Behavior Pack (excluyendo tests)
Write-Host "Copiando Behavior Pack..."
Copy-Item -Path "KNOCKERbeh2" -Destination $BPDir -Recurse -Exclude "test_*.js","verify_*.js","config_*.json"

# Copiar Resource Pack
Write-Host "Copiando Resource Pack..."
Copy-Item -Path "KNOCKERres2" -Destination $RPDir -Recurse

# Crear .mcaddon (ZIP)
Write-Host "Creando .mcaddon..."
Compress-Archive -Path "$BuildDir\*" -DestinationPath $OutputFile -Force

Write-Host "✅ Addon creado: $OutputFile"
Write-Host "📦 Tamaño: $((Get-Item $OutputFile).Length / 1MB) MB"
```

---

## 5. REORGANIZACIÓN DE TESTS PROPUESTA

### 5.1 Estructura Actual

```
TheObsessedKnocker-1/
├── test_mood_system.js
├── test_mood_dialogues.js
├── tests/
│   ├── recentActionDetection.test.js
│   └── task_11.1_verification.js
└── KNOCKERbeh2/
    ├── test_*.js (múltiples)
    ├── verify_serialize.js
    └── config_*.json
```

### 5.2 Estructura Propuesta

```
TheObsessedKnocker-1/
├── tests/
│   ├── unit/
│   │   ├── test_mood_system.js
│   │   ├── test_roundtrip_15.4.js
│   │   ├── test_serializeConfig.js
│   │   └── recentActionDetection.test.js
│   ├── integration/
│   │   ├── test_parseConfig_unit.js
│   │   ├── test_parseConfig_validation.js
│   │   ├── test_mood_dialogues.js
│   │   └── test_task_15.*.js
│   ├── manual/
│   │   ├── test_multiplayer.js
│   │   └── MANUAL_TEST_CHECKLIST.md
│   ├── fixtures/
│   │   ├── config_example.json
│   │   ├── config_invalid_type.json
│   │   ├── config_missing_required.json
│   │   └── config_out_of_range.json
│   └── README.md
├── KNOCKERbeh2/          (SIN tests)
└── KNOCKERres2/          (SIN cambios)
```

### 5.3 Beneficios de la Reorganización

1. **Claridad** - Los tests están organizados por tipo
2. **Empaquetado limpio** - Solo copiar KNOCKERbeh2 y KNOCKERres2
3. **CI/CD** - Fácil ejecutar tests automáticos vs manuales
4. **Mantenimiento** - Fácil encontrar y actualizar tests

---

## 6. ACTUALIZACIÓN DE .gitignore

Agregar estas líneas para excluir builds:

```gitignore
# Build artifacts
build/
*.mcaddon
*.mcpack
*.zip

# Test outputs
test_output*.txt
*.log

# Temporary files
*.tmp
.DS_Store
Thumbs.db
```

---

## 7. CHECKLIST PRE-EMPAQUETADO

Antes de crear un `.mcaddon` para distribución:

- [ ] Ejecutar todos los tests automáticos
- [ ] Verificar que main.js no tiene errores de sintaxis: `node --check KNOCKERbeh2/scripts/main.js`
- [ ] Confirmar que no hay archivos de test en KNOCKERbeh2/
- [ ] Actualizar versión en manifests (Behavior + Resource)
- [ ] Actualizar CHANGELOG.md si existe
- [ ] Ejecutar script de build
- [ ] Probar el .mcaddon en Minecraft (instalación limpia)
- [ ] Verificar tamaño del archivo (<50MB recomendado)

---

## 8. TESTS OBLIGATORIOS ANTES DE RELEASE

### Tests Automáticos (Node.js)
```bash
node --check KNOCKERbeh2/scripts/main.js
node tests/unit/test_roundtrip_15.4.js
node tests/unit/test_serializeConfig.js
node tests/unit/test_mood_system.js
node tests/unit/recentActionDetection.test.js
```

**Criterio de Aceptación**: Todos los tests deben pasar (exit code 0)

### Tests Manuales (Minecraft)
Ver: `docs/PRE_OLLAMA_STABLE_BASELINE.md` sección 6

**Criterio de Aceptación**: Checklist completo sin errores críticos

---

## 9. VERSIONADO

Usar Semantic Versioning:

- **MAJOR** (X.0.0): Cambios que rompen compatibilidad
- **MINOR** (1.X.0): Nuevas features compatibles
- **PATCH** (1.2.X): Bug fixes

**Versión Actual**: 1.2.6  
**Próxima versión con Ollama**: 1.3.0 (nueva feature)

---

## 10. PRÓXIMOS PASOS

### Inmediatos (Pre-Ollama)
1. [ ] Mover tests a estructura propuesta
2. [ ] Crear script de empaquetado (bash + PowerShell)
3. [ ] Actualizar .gitignore
4. [ ] Generar primer .mcaddon estable
5. [ ] Probar addon en Minecraft con checklist manual

### Futuros (Post-Ollama)
1. [ ] Tests de integración con KnockerBridge
2. [ ] CI/CD para builds automáticos
3. [ ] Tests de performance con Ollama
4. [ ] Documentación de deployment del bridge

---

## 11. CONCLUSIÓN

Esta clasificación asegura que:
- ✅ El `.mcaddon` solo incluye archivos necesarios
- ✅ Los tests permanecen en el repositorio para desarrollo
- ✅ El proceso de empaquetado es reproducible
- ✅ No hay confusión sobre qué archivos son de producción vs desarrollo

**Estado**: 📋 GUÍA COMPLETA - Lista para implementación

---

**Documento creado**: Diciembre 2024  
**Versión**: 1.0.0  
**Mantenedor**: Equipo de desarrollo The Obsessed Knocker
