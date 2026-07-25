# Guía de Pruebas - Task 14.1: Sistema de Logros

## Objetivo
Verificar que el sistema de logros funciona correctamente: desbloqueo, persistencia, notificaciones y recompensas.

## Preparación

### 1. Cargar el Addon
1. Asegúrate de que el addon esté instalado en Minecraft Bedrock
2. Crea un mundo nuevo o usa uno existente con el addon activo
3. Asegúrate de que El Acechador esté spawneado y activo

### 2. Comandos Útiles
Para testing, necesitarás acceso a estos comandos:
- `.bond add [cantidad]` - Añadir puntos de vínculo
- `.bond set [cantidad]` - Establecer puntos de vínculo exactos
- `.bond` - Ver puntos de vínculo actuales

## Pruebas a Realizar

### Prueba 1: Logros de Tier Básicos

#### 1.1 Primera Mirada (Tier 1)
**Pasos:**
1. Inicia con vínculo en 0
2. Ejecuta: `.bond set 100`
3. **Resultado esperado:**
   - Notificación visual en chat con bordes dorados
   - Título: "¡LOGRO DESBLOQUEADO!"
   - Icono: §7👁
   - Nombre: "Primera Mirada"
   - Descripción visible
   - Diálogo de recompensa de El Acechador
   - Sonido de logro (si está disponible)

#### 1.2 Conocido Familiar (Tier 2)
**Pasos:**
1. Ejecuta: `.bond set 250`
2. **Resultado esperado:**
   - Notificación similar a la anterior
   - Icono: §b💙
   - Nombre: "Conocido Familiar"
   - Diálogo de recompensa diferente

#### 1.3 Objeto de Obsesión (Tier 3)
**Pasos:**
1. Ejecuta: `.bond set 400`
2. **Resultado esperado:**
   - Notificación con icono §5💜
   - Nombre: "Objeto de Obsesión"
   - Intento de dar item `scary:simbolo_obsesion` (puede fallar si no existe)
   - Si el item no existe, debe mostrar diálogo alternativo

#### 1.4 Vínculo Eterno (Bond Máximo)
**Pasos:**
1. Ejecuta: `.bond set 500`
2. **Resultado esperado:**
   - Notificación con icono §d💗
   - Nombre: "Vínculo Eterno"
   - Intento de dar item `scary:vinculo_eterno`
   - Diálogo especial de vínculo máximo

**✅ Verificación:** 4 logros desbloqueados

---

### Prueba 2: Persistencia de Logros

**Pasos:**
1. Desbloquea al menos 2 logros (ej: Primera Mirada y Conocido Familiar)
2. Sal completamente del mundo (guardar y salir)
3. Vuelve a entrar al mundo
4. Verifica que los logros ya desbloqueados NO se vuelvan a desbloquear
5. Ejecuta `.bond set 400` para desbloquear el siguiente tier
6. **Resultado esperado:**
   - Solo el nuevo logro (Objeto de Obsesión) debe desbloquearse
   - Los anteriores deben mantenerse desbloqueados sin notificación

**✅ Verificación:** Logros persisten entre sesiones

---

### Prueba 3: Sistema de Estadísticas (Interacciones)

**Nota:** Esta prueba requiere integración con el sistema de interacción (Task 14.2+)

**Pasos manuales (sin integración):**
1. En la consola del servidor/debug, verifica que exista la función `registrarInteraccion()`
2. Interactúa con El Acechador usando la Vara Whisper 100 veces
3. **Resultado esperado:**
   - Al llegar a la interacción #100, debe desbloquearse "Conversador Dedicado"
   - Icono: §e💬

**⏳ Pendiente:** Requiere integración con sistema de interacción

---

### Prueba 4: Logros de Eventos Ultra-Raros

**Nota:** Esta prueba requiere integración con el sistema de eventos ultra-raros (Task 14.2+)

**Pasos:**
1. Experimenta tu primer evento ultra-raro
2. **Resultado esperado:**
   - Debe desbloquearse "Encuentro Especial"
   - Icono: §6✨
3. Experimenta 5 eventos ultra-raros diferentes
4. **Resultado esperado:**
   - Debe desbloquearse "Coleccionista de Momentos" (logro oculto)
   - Icono: §5🌟

**⏳ Pendiente:** Requiere integración con sistema de eventos ultra-raros

---

### Prueba 5: Logros Ocultos

#### 5.1 Sobreviviente de Celos
**Requisito:** 10 encuentros con El Acechador en estado celoso
**⏳ Pendiente:** Requiere integración con sistema de mood

#### 5.2 Compañero Inseparable
**Requisito:** 24 horas de juego
**⏳ Pendiente:** Requiere tiempo de juego o manipulación de estadística

---

### Prueba 6: No Duplicación de Logros

**Pasos:**
1. Desbloquea "Primera Mirada" (tier 1)
2. Ejecuta nuevamente: `.bond set 100`
3. **Resultado esperado:**
   - NO debe aparecer notificación nuevamente
   - El logro ya está desbloqueado

**✅ Verificación:** Los logros no se duplican

---

### Prueba 7: Guardado de Dynamic Properties

**Pasos técnicos (requiere acceso a logs):**
1. Desbloquea un logro
2. Revisa los logs de la consola
3. Busca: `[Logros] [nombre_jugador] desbloqueó: [nombre_logro]`
4. Sal del mundo
5. Vuelve a entrar
6. Busca en logs: `[Logros] Logros de [nombre_jugador] cargados correctamente`

**✅ Verificación:** Guardado y carga funcionan correctamente

---

## Resultados Esperados por Prueba

| Prueba | Estado | Notas |
|--------|--------|-------|
| 1.1 Primera Mirada | ⏳ | Requiere testing en juego |
| 1.2 Conocido Familiar | ⏳ | Requiere testing en juego |
| 1.3 Objeto de Obsesión | ⏳ | Requiere testing en juego |
| 1.4 Vínculo Eterno | ⏳ | Requiere testing en juego |
| 2. Persistencia | ⏳ | Requiere testing en juego |
| 3. Interacciones | ⏳ | Requiere integración (Task 14.2+) |
| 4. Eventos Ultra-Raros | ⏳ | Requiere integración (Task 14.2+) |
| 5. Logros Ocultos | ⏳ | Requiere integraciones varias |
| 6. No Duplicación | ⏳ | Requiere testing en juego |
| 7. Dynamic Properties | ⏳ | Requiere acceso a logs |

## Checklist de Funcionalidad

### Funcionalidad Core
- [ ] Los logros se desbloquean correctamente al cumplir requisitos
- [ ] Las notificaciones se muestran con el formato correcto
- [ ] Los iconos y colores se visualizan correctamente
- [ ] Las recompensas (diálogos) se muestran después de la notificación
- [ ] Los logros persisten entre sesiones de juego
- [ ] Los logros no se duplican al cumplir requisito nuevamente

### Funcionalidad de Recompensas
- [ ] Las recompensas de tipo "dialogo" se muestran correctamente
- [ ] Las recompensas de tipo "item" intentan dar el item
- [ ] Si el item no existe, se muestra el diálogo alternativo (textoAlt)
- [ ] El sonido de logro se reproduce (si está disponible)

### Funcionalidad de Persistencia
- [ ] Los logros se guardan en dynamic properties
- [ ] Los logros se cargan correctamente al entrar al mundo
- [ ] Las estadísticas se mantienen entre sesiones
- [ ] No hay errores al guardar/cargar datos

### Funcionalidad de Estadísticas
- [ ] El contador de interacciones funciona (requiere integración)
- [ ] El contador de eventos ultra-raros funciona (requiere integración)
- [ ] El contador de encuentros por mood funciona (requiere integración)
- [ ] El tiempo jugado se actualiza correctamente (requiere integración)

## Problemas Conocidos

### Items Especiales No Existen
**Problema:** Los items de recompensa (`scary:simbolo_obsesion`, `scary:vinculo_eterno`, etc.) no existen aún.

**Comportamiento esperado:** El sistema debe intentar dar el item, fallar, y mostrar el diálogo alternativo (textoAlt).

**Solución futura:** Crear los items en el resource pack o actualizar las recompensas a solo diálogos.

### Integraciones Pendientes
**Problema:** Algunas funciones de tracking requieren ser llamadas desde otros sistemas.

**Soluciones necesarias:**
1. Llamar `registrarInteraccion(player)` cuando el jugador use la Vara Whisper
2. Llamar `registrarEventoUltraRaroParaLogros(player, eventId)` cuando ocurra un evento ultra-raro
3. Llamar `registrarEncuentroPorMood(player, mood)` durante encuentros con El Acechador
4. Llamar `actualizarTiempoJugado(player)` periódicamente
5. Llamar `loadPlayerAchievements(player)` al iniciar sesión

## Notas para el Desarrollador

### Debugging
Para verificar el estado de los logros en tiempo de ejecución, puedes añadir comandos temporales que llamen a:
```javascript
getAchievementsInfo(player)
```

Esto retornará un array con todos los logros y su estado de desbloqueo.

### Logging
El sistema incluye logs en console para debugging:
- `[Logros] [nombre_jugador] desbloqueó: [nombre_logro]` - Cuando se desbloquea un logro
- `[Logros] Logros de [nombre_jugador] cargados correctamente` - Al cargar datos
- `[Logros] Error al guardar/cargar logros...` - Errores de persistencia

### Extensión del Sistema
Para añadir nuevos logros:
1. Añade una entrada en el objeto `Achievements`
2. Define id, nombre, descripcion, icono, requisito, recompensa, oculto
3. Añade la lógica de verificación en `actualizarProgresoLogros()`

## Conclusión

El sistema de logros está implementado y listo para testing. Las pruebas básicas (logros de tier y persistencia) pueden realizarse inmediatamente. Las pruebas de estadísticas e integraciones requerirán implementación de Tasks posteriores (14.2, 14.3, 14.4).

**Estado actual:** ✅ Estructura completa - ⏳ Testing pendiente
