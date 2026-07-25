# Guía de Pruebas - Parser de Configuración (Tarea 15.1)

## 🎯 Objetivo

Esta guía te ayudará a probar el parser de configuración JSON implementado para El Acechador. El parser permite cargar configuraciones personalizadas para el addon.

## 📋 Requisitos Previos

1. Tener el addon "The Obsessed Knocker" instalado en Minecraft Bedrock Edition
2. Un mundo de prueba donde se pueda usar comandos de chat
3. Habilitar trucos/cheats en el mundo (para ver mensajes de sistema)

## 🧪 Métodos de Prueba

### Método 1: Suite Completa de Pruebas (Recomendado)

Este es el método más completo y rápido para verificar que todo funciona correctamente.

#### Pasos:

1. **Iniciar Minecraft** y cargar un mundo con el addon
2. **Abrir el chat** (presiona T o el botón de chat)
3. **Escribir el comando:**
   ```
   .testparser
   ```
4. **Presionar Enter**

#### Resultado Esperado:

Deberías ver una secuencia de mensajes mostrando 10 pruebas ejecutándose:

```
╔═══════════════════════════════════════════════════════╗
║  SUITE DE PRUEBAS UNITARIAS - PARSER CONFIG (15.1)   ║
╚═══════════════════════════════════════════════════════╝

▶ TEST 1: Configuración válida completa
  ✓ PASADO

▶ TEST 2: Valores personalizados
  ✓ PASADO

▶ TEST 3: Sintaxis JSON inválida
  ✓ PASADO - Error detectado correctamente

▶ TEST 4: Campo requerido faltante
  ✓ PASADO - Campo faltante detectado

▶ TEST 5: Tipo de dato inválido
  ✓ PASADO - Tipo inválido detectado

▶ TEST 6: Valor fuera de rango
  ✓ PASADO - Fuera de rango detectado

▶ TEST 7: String JSON vacío
  ✓ PASADO - String vacío detectado

▶ TEST 8: Input no-string
  ✓ PASADO - Input no-string detectado

▶ TEST 9: Config parcial (defaults)
  ✓ PASADO - Defaults aplicados

▶ TEST 10: Array en vez de objeto
  ✓ PASADO - Array detectado correctamente

╔═══════════════════════════════════════════════════════╗
║              RESUMEN DE PRUEBAS                       ║
╚═══════════════════════════════════════════════════════╝
  ✓ Pasadas: 10/10
  ✗ Fallidas: 0/10
  Éxito: 100%

  🎉 ¡TODAS LAS PRUEBAS PASARON! 🎉
  El parser está funcionando correctamente.
  Tarea 15.1 completada exitosamente.

═══════════════════════════════════════════════════════
```

#### ✅ Prueba Exitosa:
- Todas las pruebas muestran "✓ PASADO"
- El resumen muestra "10/10" pruebas pasadas
- Aparece el mensaje "¡TODAS LAS PRUEBAS PASARON!"

#### ❌ Si algo falla:
- Verás "✗ FALLIDO" o "✗ EXCEPCIÓN" en alguna prueba
- El resumen mostrará menos de 10 pruebas pasadas
- Revisar el log de Minecraft para más detalles

---

### Método 2: Prueba Básica

Una prueba rápida de 3 escenarios fundamentales.

#### Pasos:

1. Abrir el chat en Minecraft
2. Escribir:
   ```
   .configtest
   ```
3. Presionar Enter

#### Resultado Esperado:

```
═══════════════════════════════════════════════════════
  TEST DEL PARSER DE CONFIGURACIÓN
═══════════════════════════════════════════════════════

✓ Probando configuración válida...
✓ ÉXITO: Configuración parseada correctamente
  - bondSystem.initialBond: 0
  - chatSystem.cooldownSeconds: 30
  - rareEventsSystem.baseUltraRareDialogueProbability: 0.015

✗ Probando configuración inválida (campo faltante)...
✓ ERROR DETECTADO CORRECTAMENTE:
  El campo requerido "bondSystem.initialBond" está faltante.

✗ Probando sintaxis JSON incorrecta...
✓ ERROR DE SINTAXIS DETECTADO CORRECTAMENTE

═══════════════════════════════════════════════════════
```

---

### Método 3: Ver Documentación del Esquema

Para ver qué campos están disponibles en la configuración.

#### Pasos:

1. Abrir el chat
2. Escribir:
   ```
   .configdocs
   ```
3. Presionar Enter

#### Resultado:

Verás documentación detallada de todos los campos disponibles:

```
════════════════════════════════════════════════════════════════
  DOCUMENTACIÓN DEL ESQUEMA DE CONFIGURACIÓN
  The Obsessed Knocker - Sistema de Parser de Configuración
════════════════════════════════════════════════════════════════

■ bondSystem
  Configuración del Sistema de Vínculo
  Requerido: Sí

  ◆ initialBond
    Tipo: number
    Requerido: Sí
    Por defecto: 0
    Mínimo: 0
    Máximo: 500
    Descripción: Valor inicial de vínculo para nuevos jugadores (0-500)

  ◆ bondMultiplier
    Tipo: number
    Requerido: Sí
    Por defecto: 1.0
    Mínimo: 0.1
    Máximo: 10.0
    Descripción: Multiplicador para ganancia/pérdida de puntos de vínculo

  [... más campos ...]
```

---

## 📝 Casos de Prueba Detallados

### TEST 1: Configuración Válida Completa
**Objetivo:** Verificar que una configuración válida se parsea correctamente.

**Input:** Configuración completa con todos los campos requeridos y valores válidos.

**Resultado esperado:** 
- `success: true`
- Todos los valores parseados correctamente
- Campos opcionales tienen valores por defecto

---

### TEST 2: Valores Personalizados
**Objetivo:** Verificar que se pueden usar valores personalizados diferentes a los por defecto.

**Input:** Configuración con valores personalizados:
- `initialBond: 50` (en vez de 0)
- `bondMultiplier: 1.5` (en vez de 1.0)
- `cooldownSeconds: 45` (en vez de 30)

**Resultado esperado:**
- `success: true`
- Los valores personalizados se mantienen

---

### TEST 3: Sintaxis JSON Inválida
**Objetivo:** Verificar que errores de sintaxis JSON se detectan.

**Input:** `{"bondSystem": {"initialBond": 0,},}` (comas extras)

**Resultado esperado:**
- `success: false`
- `error.type: "SYNTAX_ERROR"`
- Mensaje descriptivo del error

---

### TEST 4: Campo Requerido Faltante
**Objetivo:** Verificar que campos requeridos faltantes se detectan.

**Input:** Configuración sin `bondSystem.initialBond`

**Resultado esperado:**
- `success: false`
- `error.type: "MISSING_FIELD"`
- `error.field: "bondSystem.initialBond"`
- Mensaje indicando qué campo falta

---

### TEST 5: Tipo de Dato Inválido
**Objetivo:** Verificar validación de tipos de datos.

**Input:** `initialBond: "cero"` (string en vez de number)

**Resultado esperado:**
- `success: false`
- `error.type: "INVALID_TYPE"`
- Mensaje indicando el tipo esperado vs recibido

---

### TEST 6: Valor Fuera de Rango
**Objetivo:** Verificar validación de rangos numéricos.

**Input:** `initialBond: 600` (máximo permitido es 500)

**Resultado esperado:**
- `success: false`
- `error.type: "OUT_OF_RANGE"`
- Mensaje indicando el rango válido

---

### TEST 7: String Vacío
**Objetivo:** Verificar manejo de inputs vacíos.

**Input:** `""` (string vacío)

**Resultado esperado:**
- `success: false`
- `error.type: "SYNTAX_ERROR"`
- Mensaje indicando que el string está vacío

---

### TEST 8: Input No-String
**Objetivo:** Verificar que solo se aceptan strings.

**Input:** `{bondSystem: {initialBond: 0}}` (objeto en vez de string)

**Resultado esperado:**
- `success: false`
- `error.type: "INVALID_TYPE"`
- Mensaje indicando que debe ser string

---

### TEST 9: Configuración Parcial con Defaults
**Objetivo:** Verificar que campos opcionales faltantes usan valores por defecto.

**Input:** Configuración sin campos opcionales como `enableNicknameSystem`

**Resultado esperado:**
- `success: true`
- `config.chatSystem.enableNicknameSystem: true` (default)
- `config.rareEventsSystem.bonusProbabilityAfter50Hours: 0.005` (default)

---

### TEST 10: Array en vez de Objeto
**Objetivo:** Verificar que se rechaza un array JSON.

**Input:** `[{"bondSystem": {...}}]` (array en vez de objeto)

**Resultado esperado:**
- `success: false`
- `error.type: "INVALID_STRUCTURE"`
- Mensaje indicando que debe ser objeto

---

## 🔍 Verificación en Logs

Para ver logs más detallados:

1. Abrir el archivo de logs de Minecraft
2. Buscar mensajes que comiencen con:
   - `[El Acechador]`
   - `[Parser de Configuración]`
   - `[Test Suite]`

Ejemplo de logs exitosos:
```
[El Acechador] Sistema de Parser de Configuración (Tarea 15.1) cargado correctamente.
[El Acechador] Comandos disponibles: .configtest (probar parser), .configdocs (ver documentación del esquema), .testparser (suite completa de pruebas)
[Parser de Configuración] Configuración parseada y validada exitosamente.
```

---

## 🐛 Problemas Comunes

### Problema: Los comandos no funcionan

**Solución:**
- Verificar que el addon está correctamente instalado
- Asegurarse de estar en un mundo con el addon activado
- Revisar que los comandos empiezan con punto (`.testparser`)

---

### Problema: Todas las pruebas fallan

**Solución:**
- Verificar que main.js no tiene errores de sintaxis
- Revisar logs de Minecraft para errores de carga
- Asegurarse de tener la versión correcta del addon

---

### Problema: Algunas pruebas fallan pero otras pasan

**Solución:**
- Anotar qué pruebas específicas fallan
- Revisar los mensajes de error en detalle
- Consultar con el desarrollador si el problema persiste

---

## ✅ Checklist de Verificación

Usa este checklist para confirmar que todo funciona:

- [ ] El addon se carga sin errores
- [ ] El comando `.testparser` ejecuta correctamente
- [ ] Las 10 pruebas pasan exitosamente (10/10)
- [ ] El resumen muestra "100% de éxito"
- [ ] El comando `.configtest` funciona
- [ ] El comando `.configdocs` muestra la documentación
- [ ] Los logs no muestran errores críticos

---

## 📊 Interpretación de Resultados

### ✅ Resultado Ideal:
```
✓ Pasadas: 10/10
✗ Fallidas: 0/10
Éxito: 100%
```

**Significado:** El parser está funcionando perfectamente. Todos los requisitos están cumplidos.

---

### ⚠️ Resultado Parcial:
```
✓ Pasadas: 7/10
✗ Fallidas: 3/10
Éxito: 70%
```

**Significado:** Algunas validaciones no están funcionando correctamente. Revisar qué pruebas fallaron.

---

### ❌ Resultado Crítico:
```
✓ Pasadas: 0/10
✗ Fallidas: 10/10
Éxito: 0%
```

**Significado:** El parser no está funcionando. Hay un problema crítico en la implementación.

---

## 🎓 Conclusión

Si todas las pruebas pasan exitosamente:

✅ **La Tarea 15.1 está completada**
✅ **Todos los requisitos (10.1, 10.2, 10.5, 10.6) están cumplidos**
✅ **El parser está listo para uso en producción**

---

**¿Preguntas o problemas?**
Consulta el archivo `TASK_15.1_IMPLEMENTATION_SUMMARY.md` para más detalles técnicos sobre la implementación.
