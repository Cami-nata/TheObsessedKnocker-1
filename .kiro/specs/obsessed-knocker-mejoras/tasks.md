# Plan de Implementación: The Obsessed Knocker - Mejoras

## Resumen

Este plan implementa mejoras al addon "The Obsessed Knocker" organizadas en fases priorizadas. Las tareas se enfocan primero en funcionalidad core (traducción y chat básico), luego en sistemas avanzados (memoria, consciencia ambiental), y finalmente en características premium (eventos raros, logros).

**Estructura del Proyecto:**
- `KNOCKERbeh2/scripts/main.js` - Lógica principal del addon
- `KNOCKERres2/texts/es_MX.lang` - Archivos de traducción
- `KNOCKERbeh2/entities/knocker.json` - Definición de entidad
- `KNOCKERbeh2/functions/` - Comandos MCFunction

**Enfoque:** Modificar y expandir código existente sin eliminar mecánicas funcionales, manteniendo la identidad del personaje y la atmósfera de horror psicológico.

---

## Tareas

### Fase 1: Traducción Completa y Sistema Base

- [x] 1. Traducir completamente el objeto R (Response Pools) a español
  - [x] 1.1 Traducir respuestas del objeto R de main.js a español natural
    - Traducir aproximadamente 600 respuestas del objeto `R` en `main.js`
    - Preservar atmósfera de horror psicológico y personalidad obsesiva
    - Usar español natural, no literal
    - Mantener estructura de arrays por tier (0-3)
    - Mantener respuestas multi-línea como arrays
    - _Requisitos: 1.1, 1.4, 1.5, 1.6_
  
  - [x] 1.2 Traducir mensajes de sistema y comandos
    - Traducir mensajes de comando `.bond` (4 mensajes)
    - Traducir strings de UI y menús (~50 strings)
    - Actualizar función `say()` para usar nombre correcto: "El Acechador"
    - _Requisitos: 1.2, 1.3, 1.9_
  
  - [x] 1.3 Actualizar archivos .lang con traducciones
    - Revisar y completar `KNOCKERres2/texts/es_MX.lang`
    - Asegurar consistencia terminológica en todos los archivos
    - _Requisitos: 1.1, 1.2_

- [x] 2. Checkpoint - Verificar traducciones
  - Asegurar que todas las traducciones funcionen correctamente, revisar calidad del español y consistencia. Preguntar al usuario si hay ajustes necesarios.

### Fase 2: Sistema de Chat Básico (IA Conversacional)

- [x] 3. Implementar sistema de captura de mensajes del chat
  - [x] 3.1 Crear listener de eventos de chat
    - Registrar listener para evento `world.afterEvents.chatSend`
    - Capturar mensaje y remitente (player)
    - Aplicar cooldown de 30 segundos entre respuestas
    - _Requisitos: 3.1, 3.5, 3.12_
  
  - [x] 3.2 Implementar sistema de detección de intenciones
    - Crear mapa de ~100 patrones de palabras clave (RegEx)
    - Categorías: saludos, preguntas sobre identidad, comandos, emociones, lugares, acciones
    - Función `detectIntent(message)` que retorna intención detectada
    - Función case-insensitive y tolerante a acentos
    - _Requisitos: 3.2, 3.7_
  
  - [x] 3.3 Implementar generador de respuestas contextuales al chat
    - Crear pool de respuestas organizadas por intención detectada
    - Función `respondToChat(player, intent, tier)` que genera respuesta apropiada
    - Ajustar respuestas según tier del sistema de vínculo
    - _Requisitos: 3.3, 3.4_
  
  - [x] 3.4 Implementar probabilidades de respuesta según tier
    - Tier 0 (Stranger): 20% probabilidad
    - Tier 1 (Watched): 40% probabilidad
    - Tier 2 (Familiar): 60% probabilidad
    - Tier 3 (Obsessed): 80% probabilidad
    - _Requisitos: 3.6, 3.8, 3.9, 3.10, 3.11_

- [ ] 4. Checkpoint - Probar sistema de chat básico
  - Asegurar que el sistema de chat capture mensajes, detecte intenciones y responda apropiadamente. Preguntar al usuario si hay ajustes necesarios.

### Fase 3: Expansión de Diálogos y Variedad

- [ ] 5. Expandir objeto R con respuestas adicionales
  - [x] 5.1 Añadir respuestas raras (5-10% probabilidad)
    - Expandir cada categoría del objeto R con respuestas raras
    - Marcar respuestas raras con comentario `// RARE`
    - Implementar lógica de selección con probabilidad 5-10%
    - _Requisitos: 2.2_
  
  - [ ] 5.2 Añadir respuestas ultra-raras (1-2% probabilidad)
    - Crear respuestas ultra-raras únicas y memorables
    - Marcar con comentario `// ULTRA RARE`
    - Implementar lógica de selección con probabilidad 1-2%
    - _Requisitos: 2.3_
  
  - [x] 5.3 Duplicar tamaño del objeto R (~600 a ~1200 respuestas)
    - Añadir variaciones a categorías existentes
    - Crear nuevas categorías de diálogo
    - Mantener balance entre tiers (0-3)
    - _Requisitos: 2.1, 2.8_
  
  - [x] 5.4 Implementar sistema de reducción de repetición
    - Registrar últimas 10 respuestas dadas por categoría
    - Evitar repetir respuestas recientes
    - Implementar función `getUniqueResponse(category, tier, recentResponses)`
    - _Requisitos: 2.9_

- [ ] 6. Checkpoint - Verificar variedad de diálogos
  - Probar que las respuestas raras y ultra-raras aparezcan correctamente. Asegurar que no haya repetición excesiva. Preguntar al usuario si hay ajustes necesarios.

### Fase 4: Sistema de Memoria

- [x] 7. Implementar sistema de memoria persistente
  - [x] 7.1 Crear estructura de datos para memoria
    - Objeto `Memory` con arrays: `events` (últimos 20), `conversations` (últimas 10)
    - Cada evento: `{type, timestamp, details}`
    - Cada conversación: `{intent, response, timestamp}`
    - _Requisitos: 4.5, 4.6_
  
  - [x] 7.2 Implementar registro de eventos significativos
    - Listener para evento de muerte del jugador
    - Listener para logros obtenidos
    - Registro de conversaciones significativas del chat
    - Registro de acciones específicas (crafting, combate, construcción)
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 7.3 Implementar persistencia de memoria entre sesiones
    - Usar dynamic properties para guardar memoria por jugador
    - Función `saveMemory(player, memory)` y `loadMemory(player)`
    - Serialización JSON de estructura de memoria
    - _Requisitos: 4.8_
  
  - [x] 7.4 Implementar referencias a eventos pasados en diálogos
    - Función `getMemoryReference(player, context)` que retorna referencia relevante
    - Integrar referencias en generación de respuestas
    - Implementar lógica FIFO para límite de capacidad
    - _Requisitos: 4.7, 4.9_

### Fase 5: Consciencia del Mundo

- [ ] 8. Implementar detección de biomas y dimensiones
  - [x] 8.1 Crear sistema de detección de bioma actual
    - Función `getCurrentBiome(player)` usando `player.dimension.getBlock()`
    - Mapeo de al menos 10 biomas reconocibles
    - Cache de bioma actual para evitar queries constantes
    - _Requisitos: 5.1, 5.8_
  
  - [x] 8.2 Crear sistema de detección de dimensión
    - Función `getCurrentDimension(player)` usando `player.dimension.id`
    - Detectar Overworld, Nether, End
    - Generar evento cuando jugador cambia de dimensión
    - _Requisitos: 5.2, 5.9_
  
  - [x] 8.3 Crear pool de comentarios ambientales
    - Comentarios por bioma (10+ biomas)
    - Comentarios por dimensión (3 dimensiones)
    - Comentarios por clima (lluvia, tormenta, día, noche)
    - Organizar por tier para ajustar intensidad
    - _Requisitos: 5.1, 5.2, 5.5, 5.6, 5.7_
  
  - [x] 8.4 Implementar detección de mobs hostiles cercanos
    - Función `getNearbyHostileMobs(player, radius)` con radio 32 bloques
    - Generar comentarios cuando hay peligro cercano
    - _Requisitos: 5.3, 5.10_
  
  - [ ] 8.5 Implementar detección de construcciones del jugador
    - Detectar cambios significativos en bloques cercanos
    - Generar comentarios sobre construcciones
    - _Requisitos: 5.4_

### Fase 6: Sistema de Vínculo Refinado

- [ ] 9. Refinar transiciones de tier
  - [ ] 9.1 Implementar eventos especiales de transición de tier
    - Crear función `onTierTransition(player, oldTier, newTier)`
    - Diálogos exclusivos para cada transición (0→1, 1→2, 2→3)
    - Efectos visuales/sonoros opcionales en transición
    - _Requisitos: 8.6_
  
  - [ ] 9.2 Implementar mensajes de hitos de vínculo
    - Mensajes especiales en vínculo 100, 250, 400, 500
    - Formato distintivo para hitos
    - _Requisitos: 8.10_
  
  - [ ] 9.3 Crear diálogos exclusivos para vínculo máximo (500)
    - Pool de diálogos únicos para tier 3 con bond=500
    - Intensidad máxima de obsesión
    - _Requisitos: 8.5_
  
  - [ ] 9.4 Ajustar comportamientos por tier
    - Tier 0: distante, observacional
    - Tier 1: interés creciente
    - Tier 2: apego notable
    - Tier 3: obsesión intensa
    - Aplicar a frecuencia de apariciones, diálogos y acecho
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.7, 8.8, 8.9_

### Fase 7: Comportamiento de Acecho Mejorado

- [ ] 10. Mejorar sistema de posicionamiento y acecho
  - [ ] 10.1 Implementar sistema de distancia de observación
    - Mantener distancia entre 16-48 bloques del jugador
    - Función `getOptimalStalkingPosition(player, distance)` que retorna posición estratégica
    - _Requisitos: 6.1_
  
  - [ ] 10.2 Implementar detección de ubicaciones estratégicas
    - Detectar ventanas, puertas, colinas cercanas
    - Priorizar posiciones con línea de vista al jugador
    - _Requisitos: 6.2_
  
  - [ ] 10.3 Implementar ocultamiento basado en mirada del jugador
    - Detectar dirección de vista del jugador usando `player.getViewDirection()`
    - Ocultar gradualmente cuando jugador mira directamente
    - Revelar cuando jugador no está mirando
    - _Requisitos: 6.3, 6.4_
  
  - [ ] 10.4 Implementar movimiento natural y furtivo
    - Evitar movimiento errático
    - Rutas que eviten detección directa
    - _Requisitos: 6.5, 6.6_
  
  - [ ] 10.5 Ajustar visibilidad según tier
    - Tier 0: 10% visible
    - Tier 1: 25% visible
    - Tier 2: 50% visible
    - Tier 3: 75% visible
    - _Requisitos: 6.7, 6.8, 6.9, 6.10, 6.11_

### Fase 8: Respuestas Contextuales y Estados de Ánimo

- [ ] 11. Implementar sistema de respuestas contextuales avanzadas
  - [ ] 11.1 Crear sistema de detección de acciones recientes
    - Rastrear últimas acciones del jugador (5 minutos)
    - Categorías: minería, combate, construcción, comercio, exploración, crafting, farming, muerte
    - Función `getRecentAction(player)` que retorna acción más relevante
    - _Requisitos: 11.5, 11.6, 11.8_
  
  - [ ] 11.2 Crear pools de comentarios por categoría de acción
    - Comentarios sobre minería
    - Comentarios sobre combate
    - Comentarios sobre construcción
    - Comentarios sobre comercio
    - Comentarios sobre exploración, crafting, farming, muerte
    - _Requisitos: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 11.3 Implementar priorización de contexto
    - Función `selectMostRelevantContext(contexts)` que elige el más apropiado
    - _Requisitos: 11.7_

- [ ] 12. Implementar sistema de estados de ánimo
  - [ ] 12.1 Crear estructura de estados de ánimo
    - Estados: neutral, curioso, posesivo, celoso, eufórico
    - Objeto `Mood` con estado actual, timestamp, duración mínima (10 min)
    - _Requisitos: 12.1, 12.7_
  
  - [ ] 12.2 Implementar generación de diálogos por estado
    - Pool de diálogos por cada estado de ánimo
    - Curioso: inquisitivo
    - Posesivo: protector y restrictivo
    - Celoso: negativo a presencia de otros
    - Eufórico: intenso y apasionado
    - _Requisitos: 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 12.3 Implementar cambios de estado basados en eventos
    - Función `updateMood(player, event)` que actualiza estado según acciones
    - Transiciones naturales entre estados
    - Mayor frecuencia de estados intensos en tier 3
    - _Requisitos: 12.6, 12.8, 12.9_

### Fase 9: Eventos Ultra-Raros

- [ ] 13. Implementar sistema de eventos ultra-raros
  - [ ] 13.1 Crear pool de 10+ eventos ultra-raros únicos
    - Diálogos ultra-raros (1-2% probabilidad)
    - Apariciones especiales (0.5-1% probabilidad)
    - Interacciones secretas (1% probabilidad)
    - _Requisitos: 7.1, 7.2, 7.3, 7.6_
  
  - [ ] 13.2 Implementar sistema de probabilidades dinámicas
    - Incremento +0.5% después de 50 horas jugadas
    - Incremento +1% en tier 3 (Obsessed)
    - _Requisitos: 7.4, 7.5_
  
  - [ ] 13.3 Implementar registro de eventos experimentados
    - Prevenir repetición excesiva de eventos raros
    - Guardar en memoria persistente
    - _Requisitos: 7.7_
  
  - [ ] 13.4 Implementar recompensas por eventos raros
    - Item especial o diálogo exclusivo al experimentar evento
    - _Requisitos: 7.8_

### Fase 10: Sistema de Logros

- [ ] 14. Implementar sistema de logros y recompensas
  - [ ] 14.1 Crear estructura de logros
    - Objeto `Achievements` con logros desbloqueados
    - Persistir entre sesiones usando dynamic properties
    - _Requisitos: 13.8_
  
  - [ ] 14.2 Implementar 10+ logros únicos
    - "Primera Mirada" (tier 1 alcanzado)
    - "Conocido Familiar" (tier 2 alcanzado)
    - "Objeto de Obsesión" (tier 3 alcanzado)
    - "Vínculo Eterno" (bond máximo 500)
    - "Encuentro Especial" (primer evento ultra-raro)
    - "Conversador Dedicado" (100 interacciones)
    - Logros adicionales según criterios creativos
    - _Requisitos: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.9_
  
  - [ ] 14.3 Implementar notificaciones de logros
    - Notificación visual cuando se desbloquea logro
    - Formato distintivo en chat
    - _Requisitos: 13.7_
  
  - [ ] 14.4 Implementar recompensas por logros
    - Item especial o diálogo exclusivo al desbloquear
    - _Requisitos: 13.10_

### Fase 11: Parser de Configuración

- [ ] 15. Implementar sistema de configuración
  - [ ] 15.1 Crear parser de archivos de configuración JSON
    - Función `parseConfig(jsonString)` que retorna objeto Config
    - Validación de sintaxis JSON
    - Validación de tipos de datos
    - Manejo de errores con mensajes descriptivos
    - _Requisitos: 10.1, 10.2, 10.5, 10.6_
  
  - [ ] 15.2 Crear serializer de configuración (pretty printer)
    - Función `serializeConfig(configObject)` que retorna JSON formateado
    - Indentación de 2 espacios
    - _Requisitos: 10.3, 10.7_
  
  - [ ] 15.3 Implementar soporte para opciones de configuración
    - Sistema de Vínculo: valores iniciales, multiplicadores
    - Sistema de Chat: cooldown, probabilidades
    - Sistema de Eventos Raros: probabilidades
    - _Requisitos: 10.8, 10.9, 10.10_
  
  - [ ]* 15.4 Validar propiedad round-trip
    - Parser → Pretty Printer → Parser debe producir objeto equivalente
    - _Requisitos: 10.4_

### Fase 12: Optimización y Compatibilidad

- [ ] 16. Optimizar rendimiento y compatibilidad multijugador
  - [ ] 16.1 Optimizar consumo de recursos
    - Implementar caching para queries costosas
    - Reducir frecuencia de detecciones ambientales
    - Objetivo: <5% tiempo de tick del servidor
    - _Requisitos: 9.1_
  
  - [ ] 16.2 Implementar soporte multijugador
    - Instanciar un El_Acechador por jugador
    - Prevenir conflictos entre instancias
    - Almacenar datos de vínculo por jugador separadamente
    - _Requisitos: 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 16.3 Corregir bugs conocidos del addon original
    - Revisar issues reportados
    - Aplicar fixes necesarios
    - _Requisitos: 9.6_
  
  - [ ] 16.4 Asegurar compatibilidad con versiones actuales
    - Probar en Minecraft Bedrock 1.21.50+
    - Actualizar dependencies en manifest.json si es necesario
    - _Requisitos: 9.7_
  
  - [ ] 16.5 Implementar estructura modular y manejo de errores
    - Separar funcionalidades en módulos lógicos
    - Try-catch en funciones críticas
    - Logging de errores sin interrumpir juego
    - _Requisitos: 9.8, 9.9, 9.10_

- [ ] 17. Checkpoint final - Pruebas integrales
  - Verificar que todas las funcionalidades trabajen en conjunto. Probar en singleplayer y multiplayer. Asegurar que no haya conflictos ni errores críticos. Preguntar al usuario si hay ajustes finales necesarios.

---

## Notas

- **Priorización:** Las fases están ordenadas por impacto y dependencias. Traducción y chat básico primero, características avanzadas después.
- **Código Existente:** Todas las tareas modifican y expanden código existente en `main.js` y archivos relacionados. No se elimina funcionalidad.
- **Atmósfera:** Mantener siempre el tono de horror psicológico y la personalidad obsesiva de El Acechador.
- **Testing:** Los checkpoints permiten validación iterativa. Las pruebas deben hacerse en mundo de prueba antes de aplicar en mundo principal.
- **Modularidad:** Considerar separar funcionalidades grandes (chat, memoria, consciencia) en archivos JavaScript independientes si `main.js` crece demasiado.
- **Referencias:** Cada tarea indica los requisitos que satisface usando notación `_Requisitos: X.Y_`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 5, "tasks": ["5.4"] },
    { "id": 6, "tasks": ["7.1", "7.2"] },
    { "id": 7, "tasks": ["7.3", "7.4"] },
    { "id": 8, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 9, "tasks": ["8.4", "8.5"] },
    { "id": 10, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 11, "tasks": ["9.4"] },
    { "id": 12, "tasks": ["10.1", "10.2"] },
    { "id": 13, "tasks": ["10.3", "10.4"] },
    { "id": 14, "tasks": ["10.5"] },
    { "id": 15, "tasks": ["11.1", "12.1"] },
    { "id": 16, "tasks": ["11.2", "12.2"] },
    { "id": 17, "tasks": ["11.3", "12.3"] },
    { "id": 18, "tasks": ["13.1"] },
    { "id": 19, "tasks": ["13.2", "13.3"] },
    { "id": 20, "tasks": ["13.4"] },
    { "id": 21, "tasks": ["14.1"] },
    { "id": 22, "tasks": ["14.2", "14.3"] },
    { "id": 23, "tasks": ["14.4"] },
    { "id": 24, "tasks": ["15.1"] },
    { "id": 25, "tasks": ["15.2", "15.3"] },
    { "id": 26, "tasks": ["15.4"] },
    { "id": 27, "tasks": ["16.1", "16.2", "16.3"] },
    { "id": 28, "tasks": ["16.4", "16.5"] }
  ]
}
```
