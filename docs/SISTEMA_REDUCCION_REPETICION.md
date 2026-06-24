# Sistema de Reducción de Repetición

## Descripción General

El sistema de reducción de repetición evita que El Acechador repita las mismas respuestas con demasiada frecuencia, mejorando la inmersión y variedad en las interacciones.

## Componentes Implementados

### 1. Estructura de Datos

```javascript
// Mapa para rastrear respuestas recientes por jugador y categoría
// Estructura: playerName -> { category -> [response1, response2, ...] }
const recentResponses = new Map();

// Máximo de respuestas recientes a recordar por categoría (últimas 10)
const MAX_RECENT_RESPONSES = 10;
```

### 2. Funciones Principales

#### `recordResponse(playerName, category, response)`
- **Propósito**: Registra una respuesta como usada recientemente
- **Parámetros**:
  - `playerName`: Nombre del jugador
  - `category`: Categoría de respuesta (ej: "whoAreYou", "goAway")
  - `response`: Respuesta que fue dada
- **Comportamiento**: Mantiene un historial FIFO de las últimas 10 respuestas por categoría

#### `getRecentResponsesForCategory(playerName, category)`
- **Propósito**: Obtiene las respuestas recientes para un jugador y categoría
- **Retorna**: Array de respuestas recientes (vacío si no hay)

#### `getUniqueResponse(category, tier, playerName)`
- **Propósito**: Obtiene una respuesta que no esté en las respuestas recientes
- **Parámetros**:
  - `category`: Categoría de respuesta del objeto R
  - `tier`: Nivel de vínculo (0-3)
  - `playerName`: Nombre del jugador
- **Retorna**: Respuesta seleccionada que evita repeticiones recientes

#### `pick(arr, recentResponsesArray)`
- **Propósito**: Selecciona una respuesta del array evitando las recientes
- **Características**:
  - Soporta respuestas normales, raras (7% probabilidad) y ultra-raras (1.5% probabilidad)
  - Filtra respuestas recientes para evitar repetición
  - Si todas las respuestas han sido usadas, reinicia implícitamente

### 3. Integración en Funciones Existentes

#### `respond(player, pool, tier, gainAmount, category)`
- **Actualización**: Ahora acepta un parámetro `category` opcional
- **Comportamiento**:
  - Si se proporciona `category`, usa `getUniqueResponse()` para evitar repeticiones
  - Si no, mantiene comportamiento legacy (sin reducción de repetición)

#### `respondToChat(player, intent, tier)`
- **Actualización**: Ahora usa el sistema de reducción de repetición
- **Implementación**:
  - Crea una categoría única por intención: `chat_${intent}`
  - Obtiene respuestas recientes y las evita
  - Registra la respuesta seleccionada

#### `handleCategory(player, category)`
- **Actualización**: Ahora pasa el parámetro `category` a `respond()`
- **Efecto**: Todas las interacciones con la Vara Whisper ahora evitan repeticiones

## Flujo de Funcionamiento

1. **Jugador interactúa** con El Acechador (vía Vara Whisper o chat)
2. **Sistema determina** categoría/intención y tier del jugador
3. **Sistema obtiene** respuestas recientes para esa categoría y jugador
4. **Sistema selecciona** una respuesta que NO esté en las recientes
5. **Sistema registra** la respuesta seleccionada en el historial
6. **Sistema envía** la respuesta al jugador
7. **Si el historial** supera 10 respuestas, elimina la más antigua (FIFO)

## Beneficios

- ✅ **Mayor variedad**: Los jugadores experimentan más respuestas diferentes
- ✅ **Mejor inmersión**: Reduce sensación de repetitividad
- ✅ **Por jugador**: Cada jugador tiene su propio historial de respuestas
- ✅ **Por categoría**: Diferentes categorías mantienen historiales independientes
- ✅ **Automático**: El sistema funciona sin intervención del jugador
- ✅ **Eficiente**: Usa FIFO para mantener memoria controlada

## Cobertura

El sistema de reducción de repetición ahora está activo en:

- ✅ **Vara Whisper**: Todas las 77 categorías del menú
- ✅ **Sistema de Chat**: Todas las intenciones detectadas
- ✅ **Respuestas raras**: Se evita repetir respuestas raras recientes
- ✅ **Respuestas ultra-raras**: Se evita repetir respuestas ultra-raras recientes

## Requisitos Satisfechos

Este sistema satisface el **Requisito 2.9**:

> WHEN el jugador hace la misma pregunta repetidamente, THE Sistema_de_Diálogos SHALL variar las respuestas para reducir repetición

## Ejemplo de Uso

```javascript
// Ejemplo: Jugador usa Vara Whisper y selecciona "¿Quién eres?"
// 1. handleCategory se llama con category="whoAreYou"
// 2. respond se llama con category="whoAreYou"
// 3. getUniqueResponse obtiene las últimas 10 respuestas de "whoAreYou" para ese jugador
// 4. pick filtra esas respuestas del pool y selecciona una nueva
// 5. recordResponse registra la respuesta seleccionada
// 6. La respuesta se envía al jugador

// Si el jugador pregunta lo mismo 5 veces seguidas, recibirá 5 respuestas diferentes
// Si pregunta más de 10 veces, empezará a ver repeticiones, pero no inmediatas
```

## Notas Técnicas

- El sistema usa `Map` de JavaScript para almacenamiento eficiente
- La memoria NO es persistente entre reinicios del servidor (se reinicia al recargar)
- El límite de 10 respuestas recientes es configurable vía `MAX_RECENT_RESPONSES`
- El sistema funciona tanto para respuestas simples como multi-línea
- Compatible con el sistema de respuestas raras y ultra-raras existente
