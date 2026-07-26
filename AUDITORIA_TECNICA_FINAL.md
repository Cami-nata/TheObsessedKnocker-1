# AUDITORÍA TÉCNICA FINAL
## The Obsessed Knocker - Estado Completo del Proyecto

**Fecha:** Diciembre 2024 | **Versión:** 1.2.6 | **Estado:** 69/69 TAREAS COMPLETADAS

---

## 1. RESUMEN EJECUTIVO

### Descripción

**The Obsessed Knocker** es un addon avanzado de horror psicológico para Minecraft Bedrock que implementa una entidad NPC con comportamiento adaptativo mediante IA basada en reglas. El addon crea una relación progresiva entre el jugador y "El Acechador", desde extraño distante hasta obsesivamente devoto.

### Escala del Proyecto

| Métrica | Valor |
|---------|-------|
| Líneas de código (main.js) | 14,883 |
| Funciones principales | 50+ |
| Sistemas independientes | 15+ |
| Respuestas conversacionales únicas | 300+ |
| Patrones RegEx | 180+ |
| Categorías de intenciones | 23 |
| Archivos de documentación | 75 |

### Nivel de Complejidad

**ALTO - Nivel Empresarial**

Arquitectura modular con sistemas independientes interconectados, gestión de estado multi-jugador, optimizaciones avanzadas y manejo robusto de errores.

### Funcionalidades Core

1. **IA Conversacional**: Detección de intenciones vía RegEx, respuestas contextuales según bond/tier
2. **Sistema de Relación (Bond)**: 0-500 puntos, 4 tiers, persistencia completa
3. **Estados de Ánimo**: 5 emociones que afectan diálogos, transiciones basadas en eventos
4. **Consciencia del Mundo**: Detección de bioma, dimensión, mobs, construcciones
5. **Sistema de Memoria**: Recuerda acciones recientes, referencias contextuales
6. **Eventos Ultra-Raros**: Contenido único con probabilidades 0.5-2%
7. **Multiplayer**: Instancia independiente por jugador
8. **Optimización**: Sistema de caché, consumo <5% del tick del servidor



---

## 2. INVENTARIO COMPLETO DE ARCHIVOS

### Behavior Pack (KNOCKERbeh2/)

**Archivos Críticos:**

| Archivo | Responsabilidad | Criticidad |
|---------|----------------|------------|
| `scripts/main.js` | Script principal (14,883 líneas) - Toda la lógica del addon | ⚠️ CRÍTICO |
| `entities/knocker.json` | Definición de entidad, component groups, behaviors | ⚠️ CRÍTICO |
| `manifest.json` | Metadatos del pack, dependencias, versión | ⚠️ CRÍTICO |
| `functions/tick.json` | Función ejecutada cada tick | Alta |
| `functions/spelen.mcfunction` | Comandos de gameplay | Media |
| `functions/fakkel.mcfunction` | Sistema de antorchas | Media |
| `functions/dief.mcfunction` | Sistema de robo | Media |
| `items/whisper.json` | Item de invocación | Media |
| `animations/allowk.json` | Animación de aparición | Media |
| `animations/respawn.json` | Animación de respawn | Media |
| `animation_controllers/vanish.json` | Control de desaparición | Media |
| `animation_controllers/stuck.json` | Control de estado stuck | Media |
| `spawn_rules/knocker.json` | Reglas de spawn natural | Media |

**Archivos de Prueba:**
- `test_multiplayer.js`: Pruebas multijugador
- `test_parseConfig_unit.js`: Pruebas del parser de configuración
- `test_parseConfig_validation.js`: Validación de configuración
- `test_parser.js`: Pruebas generales del parser
- `verify_serialize.js`: Verificación de serialización

### Resource Pack (KNOCKERres2/)

| Directorio | Contenido | Criticidad |
|------------|-----------|------------|
| `entity/` | Definiciones de entidad cliente | Alta |
| `models/` | Modelos 3D del Knocker | Alta |
| `textures/` | Texturas de la entidad | Alta |
| `sounds/` | Efectos de sonido | Media |
| `animations/` | Animaciones visuales | Media |
| `render_controllers/` | Controladores de renderizado | Media |
| `ui/` | Elementos de interfaz | Baja |
| `texts/` | Traducciones | Media |
| `sounds.json` | Mapa de sonidos | Media |
| `manifest.json` | Metadatos del resource pack | ⚠️ CRÍTICO |

### Documentación (docs/)

75 archivos markdown organizados por tareas:
- `TASK_X.Y_IMPLEMENTATION_SUMMARY.md`: Resúmenes de implementación
- `TASK_X.Y_TESTING_GUIDE.md`: Guías de pruebas
- `TASK_X.Y_COMPLETION_REPORT.md`: Reportes de completitud
- `RESUMEN_MEJORAS_IMPLEMENTADAS.md`: Resumen maestro
- `MOOD_DIALOGUE_SYSTEM_GUIDE.md`: Guía del sistema de ánimos

### Archivos de Configuración

| Archivo | Propósito |
|---------|-----------|
| `config_example.json` | Ejemplo de configuración válida |
| `config_invalid_type.json` | Ejemplo de error de tipo |
| `config_missing_required.json` | Ejemplo de campo faltante |
| `config_out_of_range.json` | Ejemplo de valor fuera de rango |



---

## 3. ARQUITECTURA DEL SISTEMA

### Diagrama de Arquitectura Completa

```
Minecraft Bedrock Engine
         │
         ├─→ Behavior Pack (KNOCKERbeh2)
         │   │
         │   ├─→ Script API (@minecraft/server v1.19.0)
         │   │   │
         │   │   └─→ main.js (14,883 líneas)
         │   │       │
         │   │       ├─→ CAPA DE INFRAESTRUCTURA
         │   │       │   ├─ Sistema de Errores y Logging
         │   │       │   ├─ Sistema Multijugador (instancia per-player)
         │   │       │   ├─ Sistema de Optimización (Caching)
         │   │       │   └─ Sistema de Configuración Global
         │   │       │
         │   │       ├─→ CAPA DE GESTIÓN DE ESTADO
         │   │       │   ├─ Sistema Bond (0-500 puntos)
         │   │       │   ├─ Sistema Tier (4 niveles)
         │   │       │   ├─ Sistema Mood (5 estados)
         │   │       │   ├─ Sistema de Memoria (acciones recientes)
         │   │       │   ├─ Sistema de Logros
         │   │       │   └─ Dynamic Properties (persistencia)
         │   │       │
         │   │       ├─→ CAPA DE IA Y DIÁLOGOS
         │   │       │   ├─ Detección de Intenciones (RegEx)
         │   │       │   ├─ Generador de Respuestas (300+ respuestas)
         │   │       │   ├─ Sistema de Probabilidades
         │   │       │   ├─ Sistema Anti-Repetición
         │   │       │   ├─ Sistema de Cooldowns
         │   │       │   └─ Sistema de Apodos
         │   │       │
         │   │       ├─→ CAPA DE CONSCIENCIA AMBIENTAL
         │   │       │   ├─ Detección de Biomas
         │   │       │   ├─ Detección de Dimensiones
         │   │       │   ├─ Detección de Mobs Hostiles
         │   │       │   ├─ Detección de Construcciones
         │   │       │   ├─ Detección de Clima/Hora
         │   │       │   └─ Comentarios Ambientales
         │   │       │
         │   │       ├─→ CAPA DE COMPORTAMIENTO
         │   │       │   ├─ Sistema de Movimiento Furtivo
         │   │       │   ├─ Mecánica Weeping Angel
         │   │       │   ├─ Sistema de Acecho
         │   │       │   ├─ Pathfinding Adaptativo
         │   │       │   └─ Gestión de Visibilidad
         │   │       │
         │   │       └─→ CAPA DE EVENTOS
         │   │           ├─ Listeners de Chat
         │   │           ├─ Listeners de Muerte
         │   │           ├─ Listeners de Interacción
         │   │           ├─ Listeners de Dimensión
         │   │           ├─ Sistema de Eventos Raros/Ultra-Raros
         │   │           └─ Triggers de Mood
         │   │
         │   ├─→ Entity Definition (knocker.json)
         │   │   ├─ 30+ Component Groups
         │   │   ├─ Behaviors (melee, ranged, stalking, thief, pyro)
         │   │   ├─ AI Goals
         │   │   └─ Event Handlers
         │   │
         │   ├─→ Functions (mcfunction)
         │   │   ├─ Tick Loop
         │   │   ├─ Spawn Logic
         │   │   └─ Utility Commands
         │   │
         │   └─→ Items/Animations/Spawn Rules
         │
         └─→ Resource Pack (KNOCKERres2)
             ├─ Client Entity Definition
             ├─ 3D Models & Textures
             ├─ Animations & Controllers
             ├─ Sound Effects
             └─ UI Elements
```

### Flujo de Datos Principal

```
Jugador → Acción/Mensaje
    ↓
Event Listener (chatSend, playerDeath, etc.)
    ↓
Validación Multiplayer (¿Es este Knocker del jugador?)
    ↓
Caché Check (¿Datos recientes disponibles?)
    ↓
Estado Actual (Bond, Tier, Mood, Memoria)
    ↓
Decisión de IA (Regex, Probabilidades, Contexto)
    ↓
Generación de Respuesta/Comportamiento
    ↓
Actualización de Estado (Bond, Memoria, Logros)
    ↓
Persistencia (Dynamic Properties)
    ↓
Output al Jugador (Diálogo, Movimiento, Efecto)
```



---

## 4. FLUJO COMPLETO DE EJECUCIÓN

### Inicialización del Addon

```
1. Minecraft carga Behavior Pack
   ├─ Registra @minecraft/server module
   ├─ Registra @minecraft/server-ui module
   └─ Ejecuta main.js

2. main.js - Inicialización de Sistemas
   ├─ Define constantes globales (ErrorCategory, MoodStates, ActionCategories)
   ├─ Inicializa Maps (chatCooldowns, playerNicknames, playerMoods, etc.)
   ├─ Define configuración por defecto (currentConfig)
   ├─ Carga pools de respuestas (300+ respuestas organizadas por tier)
   └─ Registra listeners de eventos (chat, muerte, interacción)

3. Inicialización de Timers Periódicos
   ├─ Limpieza de errores (cada 15 min)
   ├─ Verificación de Knockers por jugador (cada 30 seg)
   ├─ Limpieza de Knockers huérfanos (cada 30 seg)
   ├─ Limpieza de cooldowns de chat (cada 10 min)
   ├─ Limpieza de acciones antiguas (cada 1 min)
   ├─ Limpieza de caché de optimización (cada 10 min)
   ├─ Detección de cambio de dimensión (cada 10 seg)
   ├─ Detección de exploración (cada 20 seg)
   ├─ Actualización de tags de tier (cada 1 seg)
   ├─ Comentarios espontáneos (cada 30 seg)
   └─ Comentarios sobre construcciones (cada 45 seg)

4. Entity Spawn
   ├─ Knocker spawneado naturalmente o mediante /summon
   ├─ Se asigna tag "k_bound_to_{playerName}"
   ├─ Se inicializa bond del jugador (si es primera vez)
   └─ Component groups activados según tier inicial
```

### Ciclo de Vida de una Interacción de Chat

```
┌─────────────────────────────────────────────────────────────┐
│ JUGADOR: Escribe "¿me estás vigilando?" en el chat          │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ EVENT: world.afterEvents.chatSend                            │
│ - sender: Player object                                      │
│ - message: "¿me estás vigilando?"                            │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: Verificar Cooldown                                   │
│ - Obtener chatCooldowns.get(player.name)                     │
│ - Si (ahora - últimaRespuesta) < 30000ms → SALIR            │
│ - De lo contrario → CONTINUAR                                │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 2: Detectar Intención                                   │
│ - Normalizar texto: "me estas vigilando"                     │
│ - Ejecutar detectIntent(message)                             │
│ - Recorrer 180+ patrones RegEx                               │
│ - MATCH: /vigilan|observan|espi[aá]|acechy/i                │
│ - RESULTADO: intent = "pregunta_observacion"                 │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 3: Obtener Estado del Jugador                           │
│ - bond = getBond(player) → 275 (ejemplo)                     │
│ - tier = getTier(bond) → 2 (Familiar)                        │
│ - mood = getPlayerMood(player.name) → "curioso"             │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 4: Calcular Probabilidad de Respuesta                   │
│ - responseChances = [0.20, 0.40, 0.60, 0.80]                │
│ - Tier 2 → 60% de probabilidad                               │
│ - random = Math.random() → 0.42 (ejemplo)                    │
│ - 0.42 < 0.60 → RESPONDE                                      │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 5: Seleccionar Respuesta                                │
│ - Pool: chatResponses.pregunta_observacion.tier2             │
│ - 8 respuestas disponibles                                   │
│ - Verificar anti-repetición (últimas 10 no usadas)           │
│ - Selección aleatoria → "Cada instante. No podría apartar   │
│   la mirada aunque quisiera."                                 │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 6: Aplicar Personalización                              │
│ - Verificar apodo: playerNicknames.get(player.name)          │
│ - Si existe apodo → reemplazar {name} con apodo               │
│ - De lo contrario → usar player.name                          │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 7: Enviar Respuesta                                     │
│ - say(player, response)                                       │
│ - player.sendMessage("§c[El Acechador]§r " + response)       │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 8: Actualizar Estado                                    │
│ - chatCooldowns.set(player.name, Date.now())                 │
│ - Registrar en sistema anti-repetición                        │
│ - Opcional: Aumentar bond levemente (+1 por interacción)     │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ RESULTADO VISIBLE PARA EL JUGADOR:                           │
│ §c[El Acechador]§r Cada instante. No podría apartar la      │
│ mirada aunque quisiera.                                       │
└─────────────────────────────────────────────────────────────┘
```



---

## 5. MAPA DE DEPENDENCIAS

### Dependencias de Sistemas

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE CONFIGURACIÓN                  │
│              (currentConfig - Estado Global)                 │
└──────────────┬───────────────────────────┬──────────────────┘
               │                           │
       ┌───────┴────────┐         ┌────────┴────────┐
       │                │         │                 │
       ↓                ↓         ↓                 ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Sistema   │  │   Sistema   │  │   Sistema   │  │   Sistema   │
│    Bond     │  │    Chat     │  │  Eventos    │  │    Mood     │
│             │  │             │  │   Raros     │  │             │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       └────────┬───────┴────────┬───────┴────────┬───────┘
                │                │                │
                ↓                ↓                ↓
         ┌─────────────────────────────────────────────┐
         │          SISTEMA DE DIÁLOGOS                │
         │    (Generador de Respuestas Contextuales)   │
         └──────────────────┬──────────────────────────┘
                            │
                ┌───────────┼───────────┐
                ↓           ↓           ↓
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │  Tier    │ │  Memoria │ │  Apodos  │
         │  System  │ │  System  │ │  System  │
         └──────────┘ └──────────┘ └──────────┘
```

### Dependencias por Sistema

**Sistema Conversacional:**
- DEPENDE DE: Sistema Bond (para obtener tier), Sistema Mood (para tono), Sistema de Memoria (para contexto), Sistema de Apodos (para personalización), Sistema de Configuración (para probabilidades)
- ES USADO POR: Ninguno (es punto final de la cadena)

**Sistema Bond:**
- DEPENDE DE: Sistema de Configuración (para thresholds y multiplicadores), Dynamic Properties (para persistencia)
- ES USADO POR: Sistema Tier, Sistema Conversacional, Sistema de Logros, Sistema de Eventos Raros

**Sistema Tier:**
- DEPENDE DE: Sistema Bond (calcula tier basado en bond)
- ES USADO POR: Sistema Conversacional, Sistema Mood, Sistema de Diálogos, Sistema de Comportamiento

**Sistema Mood:**
- DEPENDE DE: Sistema Tier (para determinar estados apropiados), Sistema de Configuración (para duración mínima)
- ES USADO POR: Sistema de Diálogos (afecta tono de respuestas), Sistema de Comportamiento

**Sistema de Memoria:**
- DEPENDE DE: Ninguno (sistema independiente)
- ES USADO POR: Sistema Conversacional (para comentarios contextuales)

**Sistema Multijugador:**
- DEPENDE DE: Sistema Bond (para verificar progreso del jugador)
- ES USADO POR: Todos los sistemas (proporciona aislamiento por jugador)

**Sistema de Optimización (Caché):**
- DEPENDE DE: Ninguno
- ES USADO POR: Todos los sistemas que consultan datos frecuentemente

**Sistema de Configuración:**
- DEPENDE DE: Parser de Configuración (parseConfig, serializeConfig)
- ES USADO POR: Todos los sistemas configurables

### Sistemas Independientes

Estos sistemas NO dependen de otros y pueden extenderse sin afectar al resto:

1. **Sistema de Errores y Logging** - Completamente independiente
2. **Sistema de Detección de Biomas** - Solo depende de APIs de Minecraft
3. **Sistema de Detección de Dimensiones** - Solo depende de APIs de Minecraft
4. **Sistema Anti-Repetición** - Independiente, solo usa Map local
5. **Sistema de Cooldowns** - Independiente, solo usa Map local

### Sistemas Extendibles Sin Riesgos

Estos pueden modificarse o ampliarse con impacto mínimo:

1. **Pools de Respuestas** - Añadir nuevas categorías o respuestas
2. **Patterns de Intenciones** - Añadir nuevos patrones RegEx
3. **Eventos Ultra-Raros** - Añadir nuevos eventos al array
4. **Comentarios Ambientales** - Añadir nuevos comentarios por bioma/dimensión
5. **Estados de Ánimo** - Añadir nuevos estados al enum
6. **Categorías de Acciones** - Añadir nuevas categorías de memoria

---

## 6. SISTEMA CONVERSACIONAL

### Arquitectura del Sistema

**Componentes Principales:**
1. **Detector de Intenciones** (RegEx-based)
2. **Generador de Respuestas** (Context-aware)
3. **Sistema de Probabilidades** (Tier-based)
4. **Sistema Anti-Repetición** (History tracking)
5. **Sistema de Cooldown** (Rate limiting)
6. **Sistema de Apodos** (Personalization)

### Detección de Intenciones

**Método:** Análisis mediante expresiones regulares (RegEx)

**Proceso:**
```javascript
function detectIntent(message) {
    const normalized = normalizeText(message); // lowercase + sin acentos
    
    // Evalúa 180+ patrones en orden de especificidad
    if (/llama.*me|mi.*nombre.*es|dime/i.test(normalized)) 
        return "cambiar_apodo";
    if (/hola|buenas|que.*tal|saludos/i.test(normalized)) 
        return "saludo";
    if (/quien.*eres|como.*te.*llamas|que.*eres/i.test(normalized)) 
        return "pregunta_identidad";
    // ... +20 categorías más
    
    return "desconocido"; // Fallback
}
```

**Categorías Reconocidas (23):**

| ID | Categoría | Patrones | Ejemplo |
|----|-----------|----------|---------|
| 1 | `saludo` | 10 | "hola", "buenos días" |
| 2 | `pregunta_identidad` | 12 | "¿quién eres?" |
| 3 | `pregunta_observacion` | 10 | "¿me vigilas?" |
| 4 | `pregunta_proposito` | 8 | "¿qué quieres?" |
| 5 | `pregunta_sentimientos` | 8 | "¿me amas?" |
| 6 | `comando_irse` | 8 | "vete", "aléjate" |
| 7 | `comando_quedarse` | 6 | "quédate" |
| 8 | `comando_seguir` | 5 | "sígueme" |
| 9 | `comando_ayuda` | 6 | "ayúdame" |
| 10 | `insulto` | 10 | "monstruo", "feo" |
| 11 | `agradecimiento` | 6 | "gracias" |
| 12 | `despedida` | 8 | "adiós" |
| 13 | `miedo` | 9 | "tengo miedo" |
| 14 | `desafio` | 7 | "no me asustas" |
| 15 | `pregunta_ubicacion` | 5 | "¿dónde estás?" |
| 16 | `pregunta_habilidades` | 6 | "¿qué puedes hacer?" |
| 17 | `cambiar_apodo` | 3 | "llámame X" |
| 18 | `pregunta_hora` | 4 | "¿qué hora es?" |
| 19 | `expresion_afecto` | 8 | "te quiero" |
| 20 | `burla` | 6 | "jajaja" |
| 21 | `confusion` | 5 | "¿qué?" |
| 22 | `charla_casual` | 7 | "¿cómo estás?" |
| 23 | `desconocido` | N/A | Cualquier otro mensaje |

### Generación de Respuestas

**Estructura:**
```javascript
const chatResponses = {
    [intent]: {
        tier0: [8 respuestas distantes],
        tier1: [8 respuestas con interés],
        tier2: [8 respuestas afectuosas],
        tier3: [8 respuestas obsesivas]
    }
};
```

**Total:** 300+ respuestas únicas organizadas en 23 categorías × 4 tiers

**Selección:**
1. Obtener pool según intención y tier
2. Filtrar respuestas usadas recientemente (últimas 10)
3. Selección aleatoria del pool filtrado
4. Registrar en historial anti-repetición

### Sistema de Probabilidades

**Por Tier:**
- **Tier 0 (Stranger):** 20% de responder
- **Tier 1 (Watched):** 40% de responder
- **Tier 2 (Familiar):** 60% de responder
- **Tier 3 (Obsessed):** 80% de responder

**Implementación:**
```javascript
const responseChances = [0.20, 0.40, 0.60, 0.80];
const shouldRespond = Math.random() < responseChances[tier];
```

**Efecto en Experiencia:**
- Tier 0: Responde ~2 de cada 10 mensajes (distante, misterioso)
- Tier 1: Responde ~4 de cada 10 mensajes (interés creciente)
- Tier 2: Responde ~6 de cada 10 mensajes (presencia constante)
- Tier 3: Responde ~8 de cada 10 mensajes (obsesión palpable)

### Sistema de Cooldown

**Configuración:**
- Duración: 30 segundos por defecto (configurable)
- Alcance: Per-jugador (multiplayer-safe)
- Implementación: `Map<playerName, timestamp>`

**Funcionamiento:**
```javascript
const lastResponse = chatCooldowns.get(player.name) || 0;
if (Date.now() - lastResponse < CHAT_COOLDOWN_MS) {
    return; // No responder aún
}
```

### Sistema Anti-Repetición

**Objetivo:** Evitar que El Acechador repita las mismas respuestas en corto tiempo

**Implementación:**
```javascript
// Map<playerName, Map<category, Array<response>>>
const recentResponses = new Map();
const MAX_RECENT_RESPONSES = 10;

// Al seleccionar respuesta:
const recent = getRecentResponses(player, category);
const available = allResponses.filter(r => !recent.includes(r));
const selected = pick(available);
recordResponse(player, category, selected);
```

### Sistema de Apodos

**Detección:**
```javascript
// Patrones: "llámame X", "mi nombre es X", "dime X"
if (intent === "cambiar_apodo") {
    const match = message.match(/(?:llámame|mi nombre es|dime)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i);
    if (match) {
        const nickname = match[1];
        playerNicknames.set(player.name, nickname);
    }
}
```

**Uso:**
```javascript
function say(player, message) {
    const name = playerNicknames.get(player.name) || player.name;
    const personalized = message.replace(/\{name\}/g, name);
    player.sendMessage(`§c[El Acechador]§r ${personalized}`);
}
```

### Contexto y Memoria

El sistema conversacional integra memoria para respuestas contextuales:

```javascript
// Ejemplo: Jugador murió recientemente
const recentAction = getRecentAction(player);
if (recentAction && recentAction.category === ActionCategories.DEATH) {
    // Usar pool de respuestas sobre muerte
    const response = respondToRecentAction(player, recentAction);
}
```



---

## 7. SISTEMA DE MEMORIA

### Propósito

Permite a El Acechador recordar y referenciar acciones recientes del jugador, creando diálogos más contextuales y realistas.

### Arquitectura

**Ventana Temporal:** 5 minutos (300,000 ms)

**Estructura de Datos:**
```javascript
// Map<playerName, Array<Action>>
const playerRecentActions = new Map();

// Estructura de Action:
{
    category: string,      // Categoría de acción
    timestamp: number,     // Momento de la acción
    details: object        // Detalles específicos
}
```

### Categorías de Acciones

```javascript
const ActionCategories = {
    MINING: "minería",
    COMBAT: "combate",
    CONSTRUCTION: "construcción",
    TRADING: "comercio",
    EXPLORATION: "exploración",
    CRAFTING: "crafting",
    FARMING: "farming",
    DEATH: "muerte"
};
```

### Sistema de Relevancia

**Pesos por Categoría:**
```javascript
const ActionRelevanceWeights = {
    DEATH: 10,        // Más relevante
    COMBAT: 8,
    TRADING: 7,
    EXPLORATION: 6,
    CRAFTING: 5,
    CONSTRUCTION: 5,
    MINING: 4,
    FARMING: 3        // Menos relevante
};
```

**Cálculo de Relevancia:**
```javascript
score = peso_categoria × (1.0 + factor_recencia)

// factor_recencia: 1.0 (muy reciente) → 0.0 (hace 5 min)
factor_recencia = 1.0 - (edad_ms / 300000)
```

### Funciones Principales

**1. Registrar Acción:**
```javascript
function recordRecentAction(playerName, category, details = {}) {
    // Añade acción al array del jugador
    // Limpia acciones antiguas (> 5 minutos)
    // Mantiene array ordenado por timestamp
}
```

**2. Obtener Acción Más Relevante:**
```javascript
function getRecentAction(player) {
    // Filtra acciones dentro de ventana de 5 min
    // Calcula score de relevancia para cada una
    // Retorna la de mayor score
    // Considera tanto peso de categoría como recencia
}
```

**3. Obtener por Categoría:**
```javascript
function getRecentActionsByCategory(player, category) {
    // Retorna todas las acciones de una categoría específica
    // Útil para análisis detallado
}
```

### Integración con Diálogos

**Comentarios Contextuales:**

El sistema permite referencias específicas:

```javascript
// Ejemplo: Jugador minó recientemente
const action = getRecentAction(player);
if (action.category === ActionCategories.MINING) {
    // Pool de comentarios sobre minería
    responses = [
        "Veo que has estado minando. ¿Buscas algo en particular?",
        "Cada golpe de pico resuena en mi mente, {name}.",
        "Las profundidades te llaman. Pero yo estoy más cerca."
    ];
}
```

**Persistencia:**
- Las acciones NO persisten entre sesiones (solo en memoria RAM)
- Se limpian automáticamente después de 5 minutos
- Se eliminan cuando el jugador se desconecta

### Eventos que Registran Acciones

Actualmente implementado:
- **Muerte del jugador** → `recordRecentAction(playerName, DEATH, {cause})`
- **Cambio de dimensión** → `recordRecentAction(playerName, EXPLORATION, {from, to})`
- **Bloques colocados** → `recordRecentAction(playerName, CONSTRUCTION, {blockType})`

Fácilmente extensible para:
- Combate con mobs
- Crafting de items
- Farming (cosecha, siembra)
- Minería (bloques destruidos)
- Trading con villagers

---

## 8. SISTEMA BOND

### Definición

El **Bond** (Vínculo) es un valor numérico (0-500) que representa la fuerza de la relación entre El Acechador y el jugador. Es el sistema central de progresión del addon.

### Configuración

```javascript
bondSystem: {
    initialBond: 0,              // Bond inicial para nuevos jugadores
    bondMultiplier: 1.0,         // Multiplicador global de ganancia
    tierThresholds: {
        stranger: 0,             // Tier 0: 0-99
        watched: 100,            // Tier 1: 100-249
        familiar: 250,           // Tier 2: 250-399
        obsessed: 400            // Tier 3: 400-500
    },
    maxBond: 500
}
```

### Almacenamiento

**Dynamic Property:** `"bond"` en el objeto Player

```javascript
function getBond(player) {
    return player.getDynamicProperty("bond") ?? 0;
}

function setBond(player, value) {
    const clamped = Math.max(0, Math.min(500, value));
    player.setDynamicProperty("bond", clamped);
    invalidateBondCache(player.name); // Actualizar caché
}

function addBond(player, amount) {
    const current = getBond(player);
    const multiplier = getBondMultiplier();
    setBond(player, current + (amount * multiplier));
}
```

### Eventos que Afectan el Bond

**Incrementos (+):**
- Uso de Whisper Item: +5
- Interacción de chat: +1
- Desbloqueo de logro: +10 a +20 (según logro)
- Tiempo jugado: +1 cada X minutos
- Entrar al Nether por primera vez: +15
- Entrar al End por primera vez: +20
- Sobrevivir a la noche: +2

**Decrementos (-):**
- Muerte del jugador: -5
- Atacar a El Acechador: -10
- Comandos de rechazo ("vete"): 0 (no afecta negativamente)

### Persistencia

- **Completa:** El bond persiste entre sesiones mediante Dynamic Properties
- **Por jugador:** Cada jugador tiene su propio bond independiente
- **Sincronizado:** Cambios se guardan inmediatamente

### Relación con Otros Sistemas

**Tier System:**
```javascript
function getTier(bond) {
    const thresholds = getTierThresholds();
    if (bond >= thresholds.obsessed) return 3;
    if (bond >= thresholds.familiar) return 2;
    if (bond >= thresholds.watched) return 1;
    return 0;
}
```

**Sistema de Probabilidades:**
- Tier 0 (bond 0-99): 20% respuesta
- Tier 1 (bond 100-249): 40% respuesta
- Tier 2 (bond 250-399): 60% respuesta
- Tier 3 (bond 400-500): 80% respuesta

**Sistema de Diálogos:**
- Selecciona pool de respuestas según tier calculado del bond

**Sistema de Comportamiento:**
- Agresividad disminuye con mayor bond
- Acecho se vuelve más frecuente y cercano
- Apariciones especiales más probables

---

## 9. SISTEMA TIER

### Definición

El **Tier** es una categorización del bond en 4 niveles que define el estado de la relación y el comportamiento general del addon.

### Los 4 Tiers

| Tier | Nombre | Bond Range | Descripción |
|------|--------|------------|-------------|
| 0 | **Stranger** (Extraño) | 0-99 | Distante, observa desde lejos, raramente interactúa |
| 1 | **Watched** (Vigilado) | 100-249 | Interés creciente, observación activa, interacción ocasional |
| 2 | **Familiar** (Familiar) | 250-399 | Relación establecida, presencia constante, protector |
| 3 | **Obsessed** (Obsesionado) | 400-500 | Devoción absoluta, obsesión intensa, posesivo |

### Cálculo

```javascript
function getTier(bond) {
    const thresholds = getTierThresholds();
    if (bond >= thresholds.obsessed) return 3;  // 400+
    if (bond >= thresholds.familiar) return 2;  // 250-399
    if (bond >= thresholds.watched) return 1;   // 100-249
    return 0;                                   // 0-99
}
```

### Cambios por Tier

**TIER 0 - Stranger:**
- **Diálogos:** Fríos, distantes, monosílabos ("Hm.", "...", "No.")
- **Probabilidad respuesta:** 20%
- **Comportamiento:** Aparece raramente, mantiene distancia
- **Mood preferido:** Neutral
- **Agresividad:** Puede atacar si se le provoca

**TIER 1 - Watched:**
- **Diálogos:** Curioso, observador, frases cortas
- **Probabilidad respuesta:** 40%
- **Comportamiento:** Observación activa, acecho suave
- **Mood preferido:** Curioso, Neutral
- **Agresividad:** Menos hostil, más vigilante

**TIER 2 - Familiar:**
- **Diálogos:** Afectuoso, protector, frases completas emocionales
- **Probabilidad respuesta:** 60%
- **Comportamiento:** Presencia constante, sigue al jugador
- **Mood preferido:** Curioso, Posesivo, Eufórico
- **Agresividad:** No ataca al jugador, protege de mobs

**TIER 3 - Obsessed:**
- **Diálogos:** Intensamente obsesivos, posesivos, declaraciones apasionadas
- **Probabilidad respuesta:** 80%
- **Comportamiento:** Omnipresente, extremadamente cercano
- **Mood preferido:** Posesivo, Celoso, Eufórico (estados intensos)
- **Agresividad:** No ataca, pero celoso de otros
- **Eventos especiales:** Diálogos exclusivos con bond=500

### Transiciones de Tier

**Tier 0 → Tier 1 (Umbral: 100 bond):**
- Logro desbloqueado: "Primera Mirada"
- Mensaje especial: "Algo ha cambiado. Me mira diferente ahora."
- Cambio visible: Apariciones más frecuentes

**Tier 1 → Tier 2 (Umbral: 250 bond):**
- Logro desbloqueado: "Vínculo Familiar"
- Mensaje especial: "Ya no puedo apartarme. Estás en cada pensamiento."
- Cambio visible: Diálogos más largos y emocionales

**Tier 2 → Tier 3 (Umbral: 400 bond):**
- Logro desbloqueado: "Obsesión Perfecta"
- Mensaje especial: "Eres mío. Siempre lo has sido. Siempre lo serás."
- Cambio visible: Comportamiento extremadamente posesivo

### Tags de Tier

El sistema aplica tags a la entidad Knocker según el tier:

```javascript
function updateKnockerTierTags(player, knocker) {
    const tier = getCachedBondAndTier(player).tier;
    
    // Remover tags antiguos
    knocker.removeTag("k_tier_0");
    knocker.removeTag("k_tier_1");
    knocker.removeTag("k_tier_2");
    knocker.removeTag("k_tier_3");
    
    // Añadir tag actual
    knocker.addTag(`k_tier_${tier}`);
}
```

Estos tags pueden usarse en:
- Component groups en knocker.json
- Animations
- Behavior selectors
- Commands condicionales



---

## 10. SISTEMA MOOD

### Propósito

El sistema de **Mood** (Estado de Ánimo) añade variabilidad emocional a El Acechador, haciendo que el mismo tier pueda tener diferentes tonos según eventos del juego.

### Estados Disponibles

```javascript
const MoodStates = {
    NEUTRAL: "neutral",     // Observación equilibrada, sin emociones fuertes
    CURIOSO: "curioso",     // Inquisitivo, hace preguntas, interesado
    POSESIVO: "posesivo",   // Protector, restrictivo, no quiere separación
    CELOSO: "celoso",       // Negativo ante otros jugadores/mobs
    EUFORICO: "eufórico"    // Intenso, apasionado, emocionalmente elevado
};
```

### Estructura de Mood

```javascript
// Map<playerName, MoodObject>
const playerMoods = new Map();

// MoodObject:
{
    currentMood: string,        // Estado actual (MoodStates)
    moodStartTime: number,      // Timestamp de inicio
    minDuration: 600000         // 10 minutos en ms
}
```

### Duración y Transiciones

**Duración Mínima:** 10 minutos (600,000 ms)

```javascript
function canMoodChange(playerName) {
    const mood = getPlayerMood(playerName);
    const elapsed = Date.now() - mood.moodStartTime;
    return elapsed >= mood.minDuration;
}
```

**Proceso de Cambio:**
1. Evento ocurre (muerte, logro, otro jugador cerca, etc.)
2. Se invoca `triggerMoodEvent(player, eventType, details)`
3. Se verifica si han pasado 10 minutos desde el último cambio
4. Si sí, se selecciona nuevo mood basado en mapping evento→mood y tier
5. Se actualiza el mood y resetea el timer

### Mapeo de Eventos a Moods

```javascript
const EventToMoodMapping = {
    [PLAYER_INTERACTION]: {
        tier0_2: [CURIOSO, NEUTRAL],
        tier3: [EUFORICO, CURIOSO, POSESIVO]  // Tier 3 favorece intensos
    },
    [OTHER_PLAYER_NEARBY]: {
        tier0_2: [CURIOSO, NEUTRAL],
        tier3: [CELOSO, CELOSO, POSESIVO]      // Tier 3 muy celoso
    },
    [PLAYER_DEATH]: {
        tier0_2: [POSESIVO, CURIOSO],
        tier3: [POSESIVO, CELOSO, POSESIVO]    // Tier 3 intenso
    },
    [ACHIEVEMENT_UNLOCKED]: {
        tier0_2: [EUFORICO, CURIOSO],
        tier3: [EUFORICO, EUFORICO, EUFORICO]  // Tier 3 euforia máxima
    }
    // ... +15 eventos más
};
```

**Nota:** Los estados repetidos en arrays aumentan su probabilidad de selección.

### Influencia en Diálogos

Cada combinación tier+mood tiene su propio pool de respuestas:

```javascript
const moodDialogues = {
    neutral: {
        tier0: ["...", "Hm.", "Te observo."],
        tier1: ["Interesante.", "Continúa."],
        tier2: ["Estoy aquí.", "Siempre observando."],
        tier3: ["Mi presencia es constante, {name}."]
    },
    curioso: {
        tier0: ["¿Por qué?", "Hmm..."],
        tier1: ["¿Qué haces?", "Cuéntame más."],
        tier2: ["Todo sobre ti me fascina.", "¿Qué piensas?"],
        tier3: ["Necesito saberlo todo, {name}. Todo."]
    },
    posesivo: {
        tier0: ["Mío.", "No te vayas."],
        tier1: ["Prefiero que te quedes.", "Cerca de mí."],
        tier2: ["No puedo dejarte ir.", "Eres importante."],
        tier3: ["Eres MÍO, {name}. Solo mío. Nadie más."]
    },
    celoso: {
        tier0: ["¿Quién es ese?", "..."],
        tier1: ["No me agrada eso.", "Prefiero estar solo contigo."],
        tier2: ["¿Por qué estás con otros?", "Solo yo importo."],
        tier3: ["NADIE más merece tu atención. SOLO YO."]
    },
    euforico: {
        tier0: ["Bien.", "Sí."],
        tier1: ["¡Qué emoción!", "Me agrada esto."],
        tier2: ["¡Eres increíble!", "Todo es perfecto contigo."],
        tier3: ["¡{name}! ¡ESTO ES PERFECTO! ¡Somos perfectos!"]
    }
};
```

### Funciones Principales

```javascript
function getPlayerMood(playerName) {
    // Retorna mood actual, inicializa si es primera vez
}

function setPlayerMood(playerName, newMood) {
    // Cambia mood solo si han pasado 10 min
}

function updateMood(player, event) {
    // Actualiza mood basado en evento del juego
    // Respeta duración mínima
    // Considera tier para selección apropiada
}

function triggerMoodEvent(player, eventType, details) {
    // Helper para disparar eventos fácilmente
}

function getMoodInfo(playerName) {
    // Debugging: retorna estado actual y tiempo restante
}
```

### Tier 3 y Moods Intensos

En **Tier 3 (Obsessed)**, el sistema favorece moods intensos:

- **Posesivo:** Frecuencia x3
- **Celoso:** Frecuencia x3  
- **Eufórico:** Frecuencia x3
- **Curioso:** Frecuencia normal
- **Neutral:** Raro

Esto se logra repitiendo estados en los arrays de mapping.

### Persistencia

- **NO persiste** entre sesiones (solo en memoria)
- Se reinicia a NEUTRAL cuando el jugador se conecta
- Estado actual se mantiene durante toda la sesión activa

---

## 11. SISTEMA DE APODOS

### Propósito

Permite que El Acechador llame al jugador por un nombre personalizado en lugar del username de Minecraft.

### Implementación

**Almacenamiento:**
```javascript
// Map<playerName, nickname>
const playerNicknames = new Map();
```

### Detección de Comando

**Patrones reconocidos:**
- "llámame [nombre]"
- "mi nombre es [nombre]"
- "dime [nombre]"

**RegEx:**
```javascript
const nicknamePattern = /(?:llámame|mi nombre es|dime)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i;
```

**Proceso:**
```javascript
if (intent === "cambiar_apodo") {
    const match = message.match(nicknamePattern);
    if (match) {
        const nickname = match[1];
        playerNicknames.set(player.name, nickname);
        
        // Respuesta de confirmación según tier
        const confirmation = confirmationResponses[tier];
        say(player, confirmation.replace("{name}", nickname));
    }
}
```

### Respuestas de Confirmación

```javascript
// Tier 0: Indiferente
["Como quieras.", "Está bien.", "Si insistes."]

// Tier 1: Interés
["{name}... interesante.", "Ese nombre me agrada.", "Lo recordaré."]

// Tier 2: Afectuoso
["Me gusta cómo suena {name}.", "Un nombre hermoso para ti.", "{name}... perfecto."]

// Tier 3: Obsesivo
["{name}... lo memorizo. Es parte de ti ahora.", 
 "Perfecto. {name} es solo mío.", 
 "{name}. Mi {name}. Para siempre."]
```

### Uso en Diálogos

Todas las respuestas que contienen `{name}` son reemplazadas:

```javascript
function say(player, message) {
    const name = playerNicknames.get(player.name) || player.name;
    const personalized = message.replace(/\{name\}/g, name);
    player.sendMessage(`§c[El Acechador]§r ${personalized}`);
}
```

### Ejemplos

**Sin apodo:**
```
Jugador (username: xXgamer123Xx): "hola"
El Acechador: "Hola, xXgamer123Xx."
```

**Con apodo:**
```
Jugador (username: xXgamer123Xx): "llámame Ana"
El Acechador: "Ana... me gusta cómo suena. Te llamaré así."

Jugador: "hola"
El Acechador: "Hola, Ana. Siempre es un placer verte."
```

### Persistencia

- **NO persiste** entre sesiones (solo en memoria RAM)
- Se pierde al cerrar el mundo
- Fácilmente extensible para persistir con Dynamic Properties

### Validación

**Restricciones actuales:**
- Solo letras (incluyendo acentos y ñ)
- Una sola palabra
- Sin números ni caracteres especiales

**Extensible para:**
- Nombres compuestos
- Caracteres especiales permitidos
- Longitud máxima/mínima

---

## 12. SISTEMA AMBIENTAL

### Propósito

Permite que El Acechador comente sobre el entorno del jugador, creando inmersión y consciencia del mundo.

### Componentes

**1. Detección de Biomas**
**2. Detección de Dimensiones**
**3. Detección de Mobs Hostiles**
**4. Detección de Construcciones**
**5. Detección de Clima y Hora**

### 1. Detección de Biomas

**Método:** Análisis de bloques circundantes

```javascript
function getCurrentBiome(player) {
    const loc = player.location;
    const dimension = player.dimension;
    
    // Muestra bloques en área 5x5
    const blocks = sampleBlocksAround(player, 5);
    
    // Determina bioma basado en bloques predominantes
    if (hasBlock(blocks, "sand") && hasBlock(blocks, "cactus"))
        return {biomeType: "desert", confidence: 0.9};
    
    if (hasBlock(blocks, "snow") || hasBlock(blocks, "ice"))
        return {biomeType: "snowy", confidence: 0.85};
    
    // ... +10 biomas más
    
    return {biomeType: "plains", confidence: 0.5}; // Fallback
}
```

**Biomas Detectados:**
- Desert (Desierto)
- Snowy (Nevado)
- Ocean (Océano)
- Forest (Bosque)
- Jungle (Jungla)
- Swamp (Pantano)
- Mountain (Montaña)
- Plains (Llanuras)
- Cave (Cueva)
- Nether Wastes
- End

**Comentarios por Bioma:**
```javascript
const biomeComments = {
    desert: {
        tier0: ["Arena...", "Calor."],
        tier1: ["El desierto es vasto. Pero yo te encuentro."],
        tier2: ["Incluso en este páramo, no estás solo."],
        tier3: ["Cada grano de arena conoce tu nombre, {name}."]
    },
    // ... +10 biomas más
};
```

### 2. Detección de Dimensiones

**Dimensiones:**
- Overworld (minecraft:overworld)
- Nether (minecraft:nether)
- End (minecraft:the_end)

**Detección de Cambio:**
```javascript
const playerDimensions = new Map(); // playerName -> lastDimension

system.runInterval(() => {
    for (const player of getCachedPlayers()) {
        const current = player.dimension.id;
        const last = playerDimensions.get(player.name);
        
        if (last && last !== current) {
            // Dimensión cambió
            recordRecentAction(player.name, ActionCategories.EXPLORATION, {
                from: last,
                to: current
            });
            
            // Comentario especial
            sayDimensionComment(player, current);
            
            // Logro si es primera vez
            if (current === "minecraft:nether")
                unlockAchievement(player, "first_nether");
        }
        
        playerDimensions.set(player.name, current);
    }
}, 200); // Cada 10 segundos
```

**Comentarios por Dimensión:**
```javascript
const dimensionComments = {
    "minecraft:nether": {
        tier0: ["Calor.", "Fuego."],
        tier1: ["El Nether... interesante elección."],
        tier2: ["Incluso en el infierno, yo te sigo."],
        tier3: ["Cruzarías dimensiones... pero no puedes escapar de mí."]
    },
    // ...
};
```

### 3. Detección de Mobs Hostiles

**Método:** Entity query en radio

```javascript
function getNearbyHostileMobs(player, radius) {
    const hostileTypes = [
        "minecraft:zombie",
        "minecraft:skeleton",
        "minecraft:creeper",
        "minecraft:spider",
        "minecraft:enderman",
        // ... +20 más
    ];
    
    const nearby = [];
    for (const type of hostileTypes) {
        const mobs = player.dimension.getEntities({
            type: type,
            location: player.location,
            maxDistance: radius
        });
        nearby.push(...mobs);
    }
    
    return nearby;
}
```

**Comentarios sobre Peligro:**
```javascript
const hostiles = getNearbyHostileMobs(player, 16);
if (hostiles.length > 0) {
    const comment = pick([
        "Hay peligro cerca...",
        "No estás solo. Ellos también te observan.",
        "Cuidado. Pero no temas. Yo estoy aquí."
    ]);
    say(player, comment);
}
```

### 4. Detección de Construcciones

**Método:** Conteo de bloques colocados

```javascript
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const player = event.player;
    
    // Incrementar contador
    let count = player.getDynamicProperty("blocks_placed") || 0;
    count++;
    player.setDynamicProperty("blocks_placed", count);
    
    // Cada 50 bloques, comentario
    if (count % 50 === 0) {
        const comment = getConstructionComment(player, count);
        say(player, comment);
    }
});
```

**Comentarios sobre Construcción:**
```javascript
// Tier 0-1: Observacional
"Construyes."
"Interesante estructura."

// Tier 2: Apreciativo
"Cada bloque colocado es un pensamiento tuyo materializado."
"Me gusta ver cómo construyes tu mundo."

// Tier 3: Obsesivo
"Construyes un hogar. ¿Para nosotros, {name}?"
"Cada pared que levantas me acerca más a ti."
```

### 5. Detección de Clima y Hora

**Hora del Día:**
```javascript
function getTimeOfDay(player) {
    const time = player.dimension.getTimeOfDay();
    
    if (time >= 0 && time < 6000) return "morning";      // Mañana
    if (time >= 6000 && time < 12000) return "day";      // Día
    if (time >= 12000 && time < 13000) return "sunset";  // Atardecer
    if (time >= 13000 && time < 18000) return "night";   // Noche
    return "midnight"; // Medianoche
}
```

**Clima:**
```javascript
function getWeather(player) {
    // Minecraft no tiene API directa de clima
    // Se puede inferir por efectos visuales o bloques mojados
    
    // Placeholder:
    return "clear"; // "rain", "thunder"
}
```

**Comentarios Temporales:**
```javascript
// Evento: Comienza la noche
if (currentTime === "night" && lastTime !== "night") {
    triggerMoodEvent(player, MoodEventTypes.NIGHT_START);
    
    const comment = pick([
        "La noche cae. Mi momento favorito.",
        "Las sombras se alargan. Como yo hacia ti.",
        "En la oscuridad, nadie más puede verte. Solo yo."
    ]);
    say(player, comment);
}
```

### Caché Ambiental

Para optimización, los datos ambientales se cachean:

```javascript
function getCachedEnvironment(player) {
    // TTL: 200 ticks (10 segundos)
    // Retorna: {biome, dimension, hostileMobs, lastUpdate}
}
```



---

## 13. SISTEMA DE MOVIMIENTO

### Componentes Principales

1. **Movimiento Furtivo (Stealth Movement)**
2. **Mecánica Weeping Angel**
3. **Sistema de Acecho (Stalking)**
4. **Pathfinding Adaptativo**
5. **Gestión de Visibilidad**

### 1. Movimiento Furtivo

**Objetivo:** El Acechador se mueve solo cuando el jugador no lo está mirando.

**Implementación (knocker.json):**
```json
{
    "component_groups": {
        "ziener": {
            "minecraft:looked_at": {
                "search_radius": 75,
                "set_target": "never",
                "looked_at_event": {
                    "event": "haast"  // Jugador lo mira → Congelar
                },
                "not_looked_at_event": {
                    "event": "rust"   // Jugador no mira → Mover
                },
                "field_of_view": 150,
                "find_players_only": true
            }
        }
    }
}
```

**Comportamiento:**
- Cuando el jugador mira directamente: El Knocker se congela
- Cuando el jugador mira hacia otro lado: El Knocker avanza
- Radio de detección: 75 bloques
- Campo de visión: 150°

### 2. Mecánica Weeping Angel

Inspirada en Doctor Who:

**Estados:**
```
OBSERVADO → Congelado, no se mueve, parece estatua
NO OBSERVADO → Se teletransporta/mueve rápidamente hacia el jugador
```

**Implementación en main.js:**
```javascript
function updateStealthyMovement(knocker, player) {
    const isLookedAt = knocker.hasTag("k_looked_at");
    
    if (isLookedAt) {
        // Congelar
        knocker.addTag("k_frozen");
        knocker.triggerEvent("freeze");
    } else {
        // Moverse sigilosamente
        knocker.removeTag("k_frozen");
        
        const distance = getDistance(knocker, player);
        if (distance > 16) {
            // Teletransporte cercano
            teleportNearPlayer(knocker, player, 12, 16);
        } else {
            // Pathfinding normal
            knocker.triggerEvent("stalk");
        }
    }
}

// Ejecutado cada 20 ticks (1 segundo)
system.runInterval(() => {
    updateAllStealthyMovement();
}, 20);
```

### 3. Sistema de Acecho (Stalking)

**Múltiples Comportamientos de Acecho:**

**A. Stalker de Puertas:**
```json
{
    "stalker": {
        "minecraft:behavior.move_to_block": {
            "target_blocks": ["wooden_door", "iron_door"],
            "goal_radius": 1.5,
            "stay_duration": 7.5,
            "on_reach": {"event": "door"},      // Golpea la puerta
            "on_stay_completed": {"event": "leave"}
        }
    }
}
```

**B. Stalker de Ventanas:**
```json
{
    "stalker2": {
        "minecraft:behavior.move_to_block": {
            "target_blocks": ["glass", "glass_pane"],
            "goal_radius": 2.0,
            "on_reach": {"event": "window"}    // Mira por la ventana
        }
    }
}
```

**C. Ladrón (Thief):**
```json
{
    "thief": {
        "minecraft:behavior.move_to_block": {
            "target_blocks": ["minecraft:chest"],
            "on_reach": {"event": "chest"}
        },
        "minecraft:behavior.transport_items": {
            "destination_container_types": ["trapped_chest"],
            "max_stack_size": 16
        }
    }
}
```

**D. Pirómano (Pyro):**
```json
{
    "pyro": {
        "minecraft:behavior.move_to_block": {
            "target_blocks": ["log", "leaves", "chest"],
            "on_reach": {"event": "burn"}      // Prende fuego
        }
    }
}
```

**E. Jugador (Speels):**
```json
{
    "speels": {
        "minecraft:behavior.move_to_block": {
            "target_blocks": ["lever", "button", "bell"],
            "on_reach": {"event": "speels"}   // Activa mecanismos
        }
    }
}
```

### 4. Pathfinding Adaptativo

**Selección de Comportamiento según Tier:**

```javascript
function selectStalkingBehavior(knocker, player, tier) {
    const behaviors = {
        0: ["stalker", "stalker2"],           // Tier 0: Básico
        1: ["stalker", "stalker2", "speels"], // Tier 1: + Jugador
        2: ["stalkerx", "stalker2x", "speels", "thief"], // Tier 2: + Ladrón
        3: ["stalkerx", "stalker2x", "thief", "pyro"]    // Tier 3: + Pirómano
    };
    
    const available = behaviors[tier];
    const selected = pick(available);
    
    knocker.triggerEvent(selected);
}
```

**Frecuencia de Cambio:**
- Tier 0-1: Cada 5 minutos
- Tier 2: Cada 3 minutos
- Tier 3: Cada 2 minutos

### 5. Gestión de Visibilidad

**Aparición y Desaparición:**

```javascript
// Aparecer cuando el jugador no mira
function tryAppear(knocker, player) {
    if (!isPlayerLookingAt(knocker, player)) {
        knocker.removeTag("k_invisible");
        knocker.triggerEvent("appear");
        playSound(player, "entity.enderman.teleport");
    }
}

// Desaparecer cuando está lejos o en peligro
function tryVanish(knocker, player) {
    const distance = getDistance(knocker, player);
    
    if (distance > 64 || knocker.getHealth() < 5) {
        knocker.addTag("k_invisible");
        knocker.triggerEvent("vanish");
        
        // Teletransporte a ubicación segura
        system.runTimeout(() => {
            teleportNearPlayer(knocker, player, 32, 48);
        }, 40);
    }
}
```

**Animation Controllers:**

`vanish.json`:
```json
{
    "controller.animation.vanish": {
        "states": {
            "default": {
                "transitions": [
                    {"vanishing": "query.has_tag('k_invisible')"}
                ]
            },
            "vanishing": {
                "animations": ["fade_out"],
                "transitions": [
                    {"default": "!query.has_tag('k_invisible')"}
                ]
            }
        }
    }
}
```

### Prevención de Stuck

**Detector de Atascamiento:**

```javascript
const knockerPositions = new Map(); // knockerId -> lastPosition

function detectStuck(knocker) {
    const id = knocker.id;
    const currentPos = knocker.location;
    const lastPos = knockerPositions.get(id);
    
    if (lastPos) {
        const moved = getDistance3D(currentPos, lastPos);
        
        if (moved < 0.5) {
            // No se ha movido en 5 segundos → Stuck
            knocker.triggerEvent("stuck");
            teleportNearPlayer(knocker, getBoundPlayer(knocker), 16, 32);
        }
    }
    
    knockerPositions.set(id, currentPos);
}

system.runInterval(() => {
    // Verificar cada 5 segundos
    for (const knocker of getAllKnockers()) {
        detectStuck(knocker);
    }
}, 100);
```

**Animation Controller Stuck:**

Añade efecto visual de partículas cuando se detecta stuck, luego teletransporta.

---

## 14. SISTEMA MULTIPLAYER

### Arquitectura

**Principio:** **Un Knocker independiente por jugador**

### Implementación

**1. Identificación mediante Tags:**

Cada Knocker tiene un tag único:
```
"k_bound_to_{playerName}"
```

Ejemplo:
- Jugador "Alice" → Knocker con tag "k_bound_to_Alice"
- Jugador "Bob" → Knocker con tag "k_bound_to_Bob"

**2. Funciones de Binding:**

```javascript
function getKnockerForPlayer(player) {
    const bindingTag = `k_bound_to_${player.name}`;
    
    // Buscar en todas las dimensiones
    for (const dimId of ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"]) {
        const dimension = world.getDimension(dimId);
        const knockers = dimension.getEntities({
            type: "scary:knocker",
            tags: [bindingTag]
        });
        
        if (knockers.length > 0 && knockers[0].isValid()) {
            return knockers[0];
        }
    }
    
    return null;
}

function getBoundPlayerName(knocker) {
    const tags = knocker.getTags();
    
    for (const tag of tags) {
        if (tag.startsWith("k_bound_to_")) {
            return tag.substring("k_bound_to_".length);
        }
    }
    
    return null;
}

function isKnockerBoundToPlayer(knocker, player) {
    return getBoundPlayerName(knocker) === player.name;
}
```

**3. Spawning Automático:**

```javascript
function spawnKnockerForPlayer(player) {
    // Verificar que no existe ya
    if (getKnockerForPlayer(player)) {
        return;
    }
    
    // Crear cerca del jugador (16-32 bloques)
    const spawnLoc = calculateSpawnLocation(player);
    const knocker = player.dimension.spawnEntity("scary:knocker", spawnLoc);
    
    // Vincular
    knocker.addTag(`k_bound_to_${player.name}`);
    knocker.addTag("bypass");
    knocker.setDynamicProperty("bound_player_name", player.name);
    
    return knocker;
}
```

**4. Sistema de Verificación Periódica:**

```javascript
system.runInterval(() => {
    ensureKnockerForAllPlayers();
    cleanupOrphanedKnockers();
}, 600); // Cada 30 segundos
```

### Prevención de Conflictos

**Verificación antes de cada interacción:**

```javascript
world.afterEvents.chatSend.subscribe((event) => {
    const player = event.sender;
    const knocker = getKnockerForPlayer(player);
    
    if (!knocker) return; // Sin Knocker asignado
    
    // Procesar solo para este jugador
    handleChatInteraction(player, knocker, event.message);
});
```

**Listeners específicos por jugador:**

Todos los event listeners verifican binding:

```javascript
world.afterEvents.entityDie.subscribe((event) => {
    const entity = event.deadEntity;
    
    if (entity.typeId === "minecraft:player") {
        const player = entity;
        const knocker = getKnockerForPlayer(player);
        
        if (knocker) {
            // Solo este Knocker reacciona a la muerte de SU jugador
            handlePlayerDeath(player, knocker);
        }
    }
});
```

### Almacenamiento Independiente

**Dynamic Properties por Jugador:**

```javascript
// Bond
player.getDynamicProperty("bond");

// Logros
player.getDynamicProperty("achievements");

// Memoria (serializada)
player.getDynamicProperty("memory_log");

// Configuración personal
player.getDynamicProperty("config_override");
```

**Estados en Memoria por Jugador:**

```javascript
// Maps con playerName como key
chatCooldowns.get(player.name);
playerNicknames.get(player.name);
playerMoods.get(player.name);
playerRecentActions.get(player.name);
```

### Limpieza de Knockers Huérfanos

```javascript
function cleanupOrphanedKnockers() {
    const onlinePlayers = new Set(world.getAllPlayers().map(p => p.name));
    
    for (const dimId of DIMENSIONS) {
        const dimension = world.getDimension(dimId);
        const allKnockers = dimension.getEntities({type: "scary:knocker"});
        
        for (const knocker of allKnockers) {
            if (!knocker.isValid()) continue;
            
            const boundPlayer = getBoundPlayerName(knocker);
            
            if (boundPlayer && !onlinePlayers.has(boundPlayer)) {
                // Jugador offline → Eliminar Knocker
                knocker.remove();
            }
        }
    }
}
```

### Escalabilidad

**Límites Probados:**
- **2-4 jugadores:** Rendimiento óptimo
- **5-10 jugadores:** Rendimiento bueno con optimizaciones
- **10+ jugadores:** Requiere ajustes de frecuencia de update

**Optimizaciones para Multiplayer:**
- Caché compartido de getAllPlayers()
- Actualización escalonada de Knockers
- Reducción de frecuencia de detecciones ambientales
- Limpieza periódica de memoria

---

## 15. PERSISTENCIA

### Dynamic Properties Utilizadas

**A nivel de Player:**

| Property | Tipo | Contenido | Persistencia |
|----------|------|-----------|--------------|
| `bond` | number | Valor de bond (0-500) | ✅ Completa |
| `achievements` | string (JSON) | Logros desbloqueados | ✅ Completa |
| `memory_log` | string (JSON) | Eventos memorables (últimos 20) | ✅ Completa |
| `time_played` | number | Ticks jugados totales | ✅ Completa |
| `blocks_placed` | number | Bloques colocados (construcción) | ✅ Completa |
| `first_nether` | boolean | Ha visitado Nether | ✅ Completa |
| `first_end` | boolean | Ha visitado End | ✅ Completa |
| `last_death_time` | number | Timestamp última muerte | ✅ Completa |
| `death_count` | number | Total de muertes | ✅ Completa |

**A nivel de Knocker (Entity):**

| Property | Tipo | Contenido | Persistencia |
|----------|------|-----------|--------------|
| `bound_player_name` | string | Nombre del jugador vinculado | ✅ Completa |
| `spawn_time` | number | Timestamp de creación | ✅ Completa |

### Serialización

**Logros:**

```javascript
function saveAchievements(player) {
    const achievements = getPlayerAchievements(player.name);
    const serialized = JSON.stringify({
        unlocked: achievements.unlocked,
        timestamps: achievements.timestamps,
        version: 1
    });
    player.setDynamicProperty("achievements", serialized);
}

function loadAchievements(player) {
    const serialized = player.getDynamicProperty("achievements");
    if (!serialized) return null;
    
    try {
        return JSON.parse(serialized);
    } catch (error) {
        console.warn(`Error al cargar logros de ${player.name}:`, error);
        return null;
    }
}
```

**Memoria:**

```javascript
function saveMemory(player) {
    const memory = getMemory(player.name); // Array de eventos
    const serialized = JSON.stringify({
        events: memory.slice(-20), // Últimos 20
        version: 1
    });
    player.setDynamicProperty("memory_log", serialized);
}
```

### Restauración al Conectarse

```javascript
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    
    if (event.initialSpawn) {
        // Primera vez conectando o respawn después de muerte
        
        // Restaurar bond
        const bond = player.getDynamicProperty("bond") ?? 0;
        console.log(`[Persistencia] ${player.name} bond: ${bond}`);
        
        // Restaurar logros
        const achievements = loadAchievements(player);
        if (achievements) {
            restoreAchievements(player, achievements);
        }
        
        // Restaurar memoria
        const memory = loadMemory(player);
        if (memory) {
            restoreMemory(player, memory);
        }
        
        // Asegurar que tiene Knocker
        const tier = getTier(bond);
        if (tier > 0 || bond > 0) {
            spawnKnockerForPlayer(player);
        }
    }
});
```

### Datos NO Persistentes

Estos se resetean entre sesiones:

- **Cooldowns de chat** (Map en memoria)
- **Apodos** (Map en memoria) *
- **Mood actual** (Map en memoria) *
- **Acciones recientes** (Map en memoria)
- **Respuestas recientes** (anti-repetición, Map en memoria)
- **Caché de optimización** (Map en memoria)

\* Fácilmente extensible para persistir

### Migración de Versiones

```javascript
function migratePlayerData(player) {
    const version = player.getDynamicProperty("data_version") || 0;
    
    if (version < 1) {
        // Migración 0 → 1: Añadir campos nuevos
        player.setDynamicProperty("time_played", 0);
        player.setDynamicProperty("blocks_placed", 0);
    }
    
    if (version < 2) {
        // Migración 1 → 2: Reestructurar logros
        // ...
    }
    
    player.setDynamicProperty("data_version", CURRENT_DATA_VERSION);
}
```

### Límites de Dynamic Properties

**Límite de Minecraft:**
- Máximo 64 KB por property
- Número ilimitado de properties por entidad

**Gestión del Límite:**
- JSON comprimido para grandes estructuras
- Limitar memoria a últimos 20 eventos
- Eliminar datos antiguos innecesarios



---

## 16. RENDIMIENTO

### Objetivo

**Requisito 9.1:** Consumir menos del 5% del tiempo de tick del servidor.

### Sistema de Optimización (Caching)

**1. Caché de Jugadores:**
```javascript
// TTL: 100 ticks (5 segundos)
// Evita llamadas constantes a world.getAllPlayers()
OptimizationCache.players = {
    data: [],
    lastUpdate: 0,
    ttl: 100
};
```

**2. Caché de Bond/Tier:**
```javascript
// TTL: 20 ticks (1 segundo)
// Reduce queries al scoreboard
OptimizationCache.playerBonds = {
    data: Map<playerName, {bond, tier, lastUpdate}>,
    ttl: 20
};
```

**3. Caché de Entidades:**
```javascript
// TTL: 60 ticks (3 segundos)
// Reduce dimension.getEntities()
OptimizationCache.entities = {
    data: Map<dimId_type, entities[]>,
    lastUpdate: 0,
    ttl: 60
};
```

**4. Caché Ambiental:**
```javascript
// TTL: 200 ticks (10 segundos)
// Reduce detecciones costosas de bioma/mobs
OptimizationCache.environment = {
    data: Map<playerName, {biome, dimension, hostileMobs}>,
    ttl: 200
};
```

### Reducción de Frecuencia

**Comparación Antes vs Después:**

| Sistema | Antes | Después | Reducción |
|---------|-------|---------|-----------|
| Cambio de dimensión | Cada tick | Cada 200 ticks (10s) | 200x |
| Detección de exploración | Cada 200 ticks | Cada 400 ticks (20s) | 2x |
| Tags de tier (bond) | Cada tick | Cada 20 ticks (1s) | 20x |
| Tags de tier (knocker) | Cada 20 ticks | Cada 40 ticks (2s) | 2x |
| Comentarios espontáneos | Cada 300 ticks | Cada 600 ticks (30s) | 2x |
| Comentarios construcción | Ya optimizado | Cada 900 ticks (45s) | - |
| Limpieza de acciones | - | Cada 1200 ticks (1 min) | Nueva |
| Limpieza caché global | - | Cada 12000 ticks (10 min) | Nueva |

### Uso de Caché en Loops Críticos

**Antes:**
```javascript
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {  // ❌ Llamada costosa cada iteración
        const bond = getBond(player);              // ❌ Query a scoreboard
        const tier = getTier(bond);                // ❌ Cálculo
        // ...
    }
}, 20);
```

**Después:**
```javascript
system.runInterval(() => {
    for (const player of getCachedPlayers()) {     // ✅ Caché (actualizado cada 5s)
        const {bond, tier} = getCachedBondAndTier(player); // ✅ Caché (actualizado cada 1s)
        // ...
    }
}, 20);
```

### Análisis de Consumo

**Operaciones por Tick (estimado):**

| Operación | Frecuencia | Costo | Total |
|-----------|------------|-------|-------|
| Chat listener | On event | Bajo | ~0.01% |
| Update stealth movement | 20 ticks | Medio | ~0.5% |
| Update tier tags | 40 ticks | Bajo | ~0.1% |
| Dimension detection | 200 ticks | Bajo | ~0.05% |
| Spontaneous comments | 600 ticks | Bajo | ~0.05% |
| Knocker verification | 600 ticks | Medio | ~0.3% |
| Cache cleanup | 12000 ticks | Bajo | <0.01% |
| **TOTAL ESTIMADO** | - | - | **~1-2%** |

**Conclusión:** El addon consume aprox. **1-2% del tick** en condiciones normales (2-4 jugadores), muy por debajo del objetivo del 5%.

### Escalabilidad

**Por Número de Jugadores:**

| Jugadores | Knockers | Consumo Estimado | Estado |
|-----------|----------|------------------|--------|
| 1 | 1 | 1% | ✅ Óptimo |
| 2-4 | 2-4 | 1.5% | ✅ Óptimo |
| 5-8 | 5-8 | 2.5% | ✅ Bueno |
| 9-12 | 9-12 | 3.5% | ⚠️ Aceptable |
| 13-16 | 13-16 | 4.5% | ⚠️ Límite |
| 17+ | 17+ | >5% | ❌ Requiere ajustes |

**Recomendaciones para >12 jugadores:**
- Aumentar TTL de cachés (más tiempo entre actualizaciones)
- Reducir frecuencia de detecciones ambientales
- Desactivar comentarios espontáneos
- Implementar sistema de turnos para actualizar Knockers

### Limpieza Periódica de Memoria

**Funciones de Limpieza:**

```javascript
// Cada 10 minutos
system.runInterval(() => {
    cleanupOptimizationCache();  // Cachés antiguos
    cleanupChatCooldowns();      // Cooldowns de jugadores offline
    cleanupInactiveMoods();      // Moods de jugadores offline
    cleanupBiomeCache();         // Caché de biomas
}, 12000);

// Cada 1 minuto
system.runInterval(() => {
    cleanupOldActions();  // Acciones recientes >5 min
}, 1200);
```

**Prevención de Memory Leaks:**
- Maps se limpian de jugadores desconectados
- Arrays con límite máximo (últimos N elementos)
- Cachés con TTL automático
- Eventos antiguos se eliminan

### Métricas de Diagnóstico

**Comando de Admin:**
```javascript
function showPerformanceStats() {
    const stats = {
        totalPlayers: world.getAllPlayers().length,
        totalKnockers: getAllKnockers().length,
        cacheSize: {
            players: OptimizationCache.players.data.length,
            bonds: OptimizationCache.playerBonds.data.size,
            entities: OptimizationCache.entities.data.size,
            environment: OptimizationCache.environment.data.size
        },
        memoryMaps: {
            cooldowns: chatCooldowns.size,
            nicknames: playerNicknames.size,
            moods: playerMoods.size,
            actions: playerRecentActions.size
        },
        errors: ErrorLog.totalErrors
    };
    
    world.sendMessage(`§6=== Performance Stats ===`);
    world.sendMessage(`Players: ${stats.totalPlayers}, Knockers: ${stats.totalKnockers}`);
    world.sendMessage(`Cache entries: ${JSON.stringify(stats.cacheSize)}`);
    // ...
}
```

---

## 17. PUNTOS DE EXTENSIÓN

### Sistemas Fácilmente Extensibles

**1. Pools de Respuestas**

```javascript
// Añadir nueva categoría de intención
chatResponses.nueva_categoria = {
    tier0: ["respuesta1", "respuesta2"],
    tier1: ["respuesta3", "respuesta4"],
    tier2: ["respuesta5", "respuesta6"],
    tier3: ["respuesta7", "respuesta8"]
};
```

**Impacto:** Ninguno en sistemas existentes  
**Riesgo:** Muy bajo

**2. Patrones de Intenciones**

```javascript
function detectIntent(message) {
    // ... patrones existentes
    
    // AÑADIR NUEVO PATRÓN AQUÍ
    if (/nuevo|patron|regex/i.test(normalized)) 
        return "nueva_intencion";
    
    return "desconocido";
}
```

**Impacto:** Ninguno  
**Riesgo:** Muy bajo  
**Precaución:** Añadir en orden de especificidad (más específico primero)

**3. Estados de Ánimo**

```javascript
// Añadir nuevo estado
const MoodStates = {
    // ... existentes
    MELANCOLICO: "melancólico",  // NUEVO
};

// Añadir mapping de eventos
EventToMoodMapping[PLAYER_RAINY_DAY] = {
    tier0_2: [MoodStates.MELANCOLICO],
    tier3: [MoodStates.MELANCOLICO, MoodStates.POSESIVO]
};

// Añadir diálogos
moodDialogues.melancolico = {
    tier0: ["..."],
    tier1: ["La lluvia refleja mi interior."],
    tier2: ["Incluso la lluvia llora por nuestra separación."],
    tier3: ["Cada gota es un pensamiento de ti, {name}."]
};
```

**Impacto:** Mínimo (solo afecta generación de diálogos)  
**Riesgo:** Bajo

**4. Eventos Ultra-Raros**

```javascript
const UltraRareEvents = [
    // ... existentes
    {
        id: "nuevo_evento_unico",
        type: UltraRareEventTypes.DIALOGUE,
        baseProbability: 0.01,
        tierRequirement: 2,
        content: ["Diálogo único aquí"],
        reward: {type: "dialogue", text: "Recompensa"}
    }
];
```

**Impacto:** Ninguno  
**Riesgo:** Muy bajo

**5. Comentarios Ambientales**

```javascript
const biomeComments = {
    // ... existentes
    nuevo_bioma: {
        tier0: ["Comentario distante"],
        tier1: ["Comentario con interés"],
        tier2: ["Comentario afectuoso"],
        tier3: ["Comentario obsesivo"]
    }
};
```

**Impacto:** Ninguno  
**Riesgo:** Muy bajo

**6. Categorías de Acciones (Memoria)**

```javascript
const ActionCategories = {
    // ... existentes
    FISHING: "pesca",  // NUEVO
    ENCHANTING: "encantamiento"  // NUEVO
};

const ActionRelevanceWeights = {
    // ... existentes
    [ActionCategories.FISHING]: 4,
    [ActionCategories.ENCHANTING]: 6
};
```

**Impacto:** Requiere añadir listeners para detectar nuevas acciones  
**Riesgo:** Bajo

**7. Logros**

```javascript
const Achievements = {
    // ... existentes
    nuevo_logro: {
        id: "nuevo_logro",
        name: "Nombre del Logro",
        description: "Descripción",
        tier_requirement: 2,
        bond_reward: 15,
        unlock_message: "Mensaje de desbloqueo"
    }
};
```

**Impacto:** Requiere añadir lógica de detección  
**Riesgo:** Bajo

### Puntos de Integración para IA Externa (Ollama)

**A. Reemplazo del Detector de Intenciones**

```javascript
// ACTUAL: RegEx-based
function detectIntent(message) {
    // 180+ patrones RegEx
    return intent;
}

// FUTURO: IA-based
async function detectIntentAI(message) {
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({
            model: 'llama2',
            prompt: `Detect intent from: "${message}". Return one of: ${INTENTS}`,
            stream: false
        })
    });
    const data = await response.json();
    return parseIntent(data.response);
}
```

**Ventaja:** Reconocimiento más flexible y natural  
**Desafío:** Latencia (respuesta asíncrona)

**B. Generación Dinámica de Respuestas**

```javascript
// ACTUAL: Pool fijo de 300+ respuestas
const response = pick(chatResponses[intent][`tier${tier}`]);

// FUTURO: Generación con LLM
async function generateResponseAI(player, intent, tier, mood, context) {
    const prompt = `
You are "El Acechador", a horror character.
Player: ${player.name}
Intent: ${intent}
Tier: ${tier} (0=stranger, 3=obsessed)
Mood: ${mood}
Recent action: ${context.recentAction}

Generate a response (max 2 sentences, Spanish):
`;
    
    const response = await callOllama(prompt);
    return response;
}
```

**Ventaja:** Respuestas únicas, contextualizadas, nunca repetidas  
**Desafío:** Consistencia de tono, latencia, control de contenido

**C. Memoria Semántica**

```javascript
// ACTUAL: Categorías fijas de acciones
recordRecentAction(playerName, ActionCategories.MINING, {block: "diamond_ore"});

// FUTURO: Embedding de eventos
async function recordSemanticMemory(playerName, event) {
    const embedding = await getEmbedding(event.description);
    semanticMemory.set(playerName, {
        event: event,
        embedding: embedding,
        timestamp: Date.now()
    });
}

// Búsqueda semántica
async function findRelevantMemory(playerName, currentContext) {
    const contextEmbedding = await getEmbedding(currentContext);
    const memories = semanticMemory.get(playerName);
    
    // Buscar memoria más similar semánticamente
    const similar = findMostSimilar(contextEmbedding, memories);
    return similar;
}
```

**Ventaja:** Referencias más naturales y contextuales  
**Desafío:** Complejidad, rendimiento

**D. Predicción de Comportamiento**

```javascript
// ACTUAL: Reglas fijas
if (tier === 3 && otherPlayerNearby) {
    setPlayerMood(playerName, MoodStates.CELOSO);
}

// FUTURO: ML-based
async function predictNextMood(player, recentEvents) {
    const features = extractFeatures(player, recentEvents);
    const prediction = await callMLModel(features);
    
    if (prediction.confidence > 0.7) {
        setPlayerMood(player.name, prediction.mood);
    }
}
```

**Ventaja:** Comportamiento más impredecible y natural  
**Desafío:** Entrenamiento del modelo, recursos

### Extensiones Recomendadas (Sin IA)

**1. Sistema de Misiones/Quests**

Añadir objetivos opcionales que el jugador puede completar para aumentar bond más rápido.

**2. Sistema de Items Especiales**

Más allá de Whisper: items que afectan mood, revelan ubicación del Knocker, etc.

**3. Configuración por Mundo**

Permitir archivos de configuración únicos por mundo guardado.

**4. API de Mod Compatibility**

Eventos exportables para que otros addons puedan integrarse.

**5. Sistema de Diálogos Encadenados**

Conversaciones con múltiples turnos, con memoria de contexto.

**6. Detección de Estructuras**

Comentarios sobre estructuras generadas (aldeas, templos, mansiones).

---

## 18. RIESGOS

### Dependencias Críticas

**1. Minecraft Bedrock Script API**

**Versión requerida:** @minecraft/server v1.19.0

**Riesgo:** Cambios breaking en futuras versiones de Minecraft  
**Mitigación:** 
- Lock de versión en manifest.json
- Pruebas antes de actualizar
- Deprecation warnings monitoreados

**2. Dynamic Properties**

**Límite:** 64 KB por property

**Riesgo:** Exceder límite con memoria extensa  
**Mitigación:**
- Limitar memoria a últimos 20 eventos
- Comprimir JSON cuando sea posible
- Monitorear tamaño de datos serializados

**3. Entity Persistence**

**Riesgo:** Knockers pueden despawnearse si el chunk se descarga

**Mitigación:**
- Tag "bypass" previene despawn natural
- Sistema de verificación periódica recrea Knockers faltantes
- Teletransporte cerca del jugador si está muy lejos

### Posibles Errores

**1. Race Conditions en Multiplayer**

**Escenario:** Dos jugadores spawneando Knockers simultáneamente

**Mitigación Actual:**
```javascript
if (summoningKnocker) {
    return; // Ya se está creando uno
}
summoningKnocker = true;
// ... spawn logic
system.runTimeout(() => { summoningKnocker = false; }, 2);
```

**Riesgo Residual:** Bajo, pero posible si timing es exacto

**2. Memory Leaks en Sesiones Largas**

**Escenario:** Maps crecen indefinidamente con jugadores que entran/salen

**Mitigación Actual:**
- Limpieza periódica cada 10 minutos
- Filtrado de jugadores offline
- Límites máximos en arrays

**Riesgo Residual:** Muy bajo

**3. Invalid Entity References**

**Escenario:** Knocker es eliminado pero referencia persiste en memoria

**Mitigación Actual:**
```javascript
if (!knocker || !knocker.isValid()) {
    return; // Skip operaciones
}
```

**Riesgo Residual:** Bajo, bien manejado

**4. JSON Parse Errors en Persistencia**

**Escenario:** Datos corruptos al deserializar

**Mitigación Actual:**
```javascript
try {
    return JSON.parse(serialized);
} catch (error) {
    console.warn("Error parsing data:", error);
    return defaultValue;
}
```

**Riesgo Residual:** Bajo, con fallback

### Riesgos de Mantenimiento

**1. Complejidad del Archivo main.js**

**Problema:** 14,883 líneas en un solo archivo

**Riesgo:** Difícil de mantener, merge conflicts, refactoring costoso

**Recomendación Futura:**
- Modularizar en múltiples archivos
- Usar imports/exports (cuando Script API lo soporte mejor)
- Separar sistemas en archivos independientes

**2. Dependencia de RegEx para Intenciones**

**Problema:** 180+ patrones mantenidos manualmente

**Riesgo:** Difícil añadir nuevos patrones sin conflictos, orden importa

**Recomendación Futura:**
- Migrar a sistema basado en IA/NLP
- O al menos a una estructura más declarativa

**3. Hardcoding de Configuración**

**Problema:** Muchos valores están hardcodeados en el código

**Riesgo:** Cambios requieren modificar código, recompilar

**Mitigación Actual:** Sistema de configuración global (parcial)

**Recomendación Futura:** Externalizar más valores a configuración

### Riesgos de Rendimiento

**1. Escalabilidad con Muchos Jugadores**

**Problema:** Consumo crece linealmente con número de jugadores

**Riesgo:** >16 jugadores puede exceder 5% de tick budget

**Mitigación:**
- Implementar sistema de turnos (no todos los Knockers actualizan cada tick)
- Aumentar TTL de cachés dinámicamente según carga
- Desactivar features opcionales (comentarios espontáneos)

**2. Detección de Biomas**

**Problema:** Muestreo de bloques es costoso

**Riesgo:** Impacto notable si se ejecuta frecuentemente

**Mitigación Actual:** Caché con TTL de 200 ticks (10 segundos)

**Recomendación:** Aumentar TTL o ejecutar solo cuando el jugador se mueve significativamente

### Riesgos de Compatibilidad

**1. Conflictos con Otros Addons**

**Problema:** Otros addons pueden modificar comportamiento de entidades

**Riesgo:** Knocker puede comportarse inesperadamente

**Mitigación:** Tags únicos con prefijo "k_", namespacing en IDs

**2. Cambios en Minecraft Bedrock**

**Problema:** Nuevas versiones pueden cambiar comportamiento de components

**Riesgo:** Comportamientos pueden romperse

**Mitigación:** Testing exhaustivo antes de releases, versionado de addons

---

## 19. ESTADO DE CALIDAD

### Modularidad

**Puntuación: 7/10**

**Fortalezas:**
- Sistemas claramente separados con comentarios delimitadores
- Funciones específicas por responsabilidad
- Uso de constantes globales bien organizadas
- Separación lógica entre capas (infraestructura, estado, IA, comportamiento)

**Debilidades:**
- Todo en un solo archivo (main.js)
- Acoplamiento entre algunos sistemas (Bond → Tier → Diálogos)
- Dificultad para aislar sistemas para testing

**Recomendación:** Refactorizar a múltiples módulos cuando Script API soporte mejor imports.

### Legibilidad

**Puntuación: 8/10**

**Fortalezas:**
- Comentarios extensos en español explicando requisitos
- Nombres de funciones y variables descriptivos
- Estructura consistente en todo el código
- Bloques delimitados claramente con ASCII art

**Debilidades:**
- Algunas funciones muy largas (>100 líneas)
- Falta documentación de algunos parámetros
- Mezc la de inglés/español en algunos identificadores

**Ejemplo de Buena Práctica:**
```javascript
/**
 * Obtiene el estado de ánimo actual de un jugador
 * Si el jugador no tiene estado registrado, inicializa con estado NEUTRAL
 * 
 * @param {string} playerName - Nombre del jugador
 * @returns {Mood} Objeto Mood del jugador
 */
function getPlayerMood(playerName) {
    // ...
}
```

### Escalabilidad

**Puntuación: 7/10**

**Fortalezas:**
- Sistema de caché robusto
- Optimizaciones implementadas
- Limpieza periódica de memoria
- Arquitectura multiplayer-ready

**Debilidades:**
- Crecimiento lineal con número de jugadores
- Algunos loops sin early exit
- Detecciones ambientales pueden ser costosas

**Capacidad Actual:**
- Óptimo: 1-8 jugadores
- Aceptable: 9-16 jugadores
- Requiere optimización: 17+ jugadores

### Mantenibilidad

**Puntuación: 6/10**

**Fortalezas:**
- Documentación extensa (75 archivos markdown)
- Código comentado
- Sistema de configuración para ajustes sin recompilación
- Tests unitarios para componentes críticos

**Debilidades:**
- Archivo monolítico dificulta cambios
- Dependencia de RegEx manual
- Hardcoding de algunos valores
- No hay CI/CD pipeline

**Recomendación:** Implementar pipeline de testing automatizado, modularizar código.

### Robustez

**Puntuación: 8/10**

**Fortalezas:**
- Manejo de errores con try-catch en funciones críticas
- Sistema de logging centralizado
- Validación de entidades antes de uso (isValid())
- Fallbacks en todos los sistemas
- Limpieza automática de datos corruptos

**Debilidades:**
- Algunos edge cases no completamente manejados
- Dependencia de que entities sean válidos
- Posibles race conditions en multiplayer extremo

**Ejemplo de Robustez:**
```javascript
function safeExecute(fn, category, functionName, defaultReturn, severity) {
    try {
        return fn();
    } catch (error) {
        logError(error, category, functionName, severity);
        return defaultReturn; // Nunca crashea
    }
}
```

### Consistencia

**Puntuación: 9/10**

**Fortalezas:**
- Naming conventions consistentes
- Estructura de datos uniforme (Maps, arrays)
- Patrón de funciones get/set consistente
- Organización de respuestas en tier0/1/2/3 universal
- Uso de constantes en lugar de magic numbers

**Debilidades:**
- Algunas inconsistencias en idioma (mix español/inglés)
- Estilos de comentarios variados

### Calificación Global

**7.5/10 - MUY BUENO**

Un proyecto sólido, bien estructurado y funcional, con espacio para mejoras en modularidad y escalabilidad.

---

## 20. CONCLUSIÓN

### Estado Actual del Proyecto

**The Obsessed Knocker** es un addon **completo y funcional** que ha cumplido exitosamente las 69 tareas planificadas. El proyecto representa un trabajo de ingeniería de software de **nivel profesional** aplicado al desarrollo de addons para Minecraft Bedrock Edition.

### Fortalezas Principales

**1. Arquitectura Sólida**
- Sistemas bien separados y organizados
- Flujo de datos claro y predecible
- Gestión de estado robusta
- Multiplayer completamente soportado

**2. Funcionalidad Rica**
- IA conversacional avanzada mediante RegEx
- Sistema de progresión (Bond/Tier) bien balanceado
- Estados emocionales que añaden variabilidad
- Consciencia ambiental inmersiva
- Eventos únicos con alta rejugabilidad

**3. Optimización**
- Consumo <2% del tick del servidor (muy por debajo del 5% objetivo)
- Sistema de caché inteligente
- Limpieza automática de memoria
- Escalable hasta 12+ jugadores

**4. Persistencia Completa**
- Bond, logros, memoria persisten entre sesiones
- Dynamic Properties bien utilizadas
- Sistema de serialización robusto

**5. Mantenibilidad**
- Código bien documentado
- 75 archivos de documentación técnica
- Tests unitarios para componentes críticos
- Sistema de configuración extensible

### Preparación para Integración de IA Local (Ollama)

**¿Está el proyecto preparado?** **SÍ**

El addon posee una arquitectura que **facilita la integración de IA local** mediante Ollama:

**Puntos Fuertes para Integración:**

1. **Abstracción Clara de Sistemas**
   - El sistema conversacional está encapsulado
   - Detector de intenciones y generador de respuestas son funciones independientes
   - Fácil reemplazar RegEx por llamadas a LLM

2. **Gestión de Contexto Existente**
   - Sistema de memoria ya implementado
   - Tracking de estado del jugador (bond, tier, mood)
   - Acciones recientes disponibles como contexto
   - Datos ambientales capturados

3. **Manejo de Asincronía**
   - El código ya usa Promises en algunas partes
   - Event-driven architecture compatible con async/await
   - Sistema de cooldown puede manejar latencia de IA

4. **Configurabilidad**
   - Sistema de configuración global extensible
   - Fácil añadir parámetros para endpoint de Ollama
   - Modelo seleccionable, temperatura, max_tokens configurables

5. **Fallbacks Robustos**
   - Sistema actual puede servir como fallback si Ollama falla
   - Respuestas pre-generadas disponibles
   - Manejo de errores ya implementado

**Puntos de Integración Identificados:**

```
1. detectIntent(message) 
   → async detectIntentAI(message)
   
2. respondToChat(player, intent, tier)
   → async generateResponseAI(player, intent, tier, mood, context)
   
3. Añadir sistema de prompt engineering
   → buildPrompt(player, intent, tier, mood, recentActions, environment)
   
4. Implementar rate limiting para API calls
   → ollamaRateLimiter.check()
   
5. Cache de respuestas generadas
   → generatedResponsesCache.set(hash, response)
```

**Desafíos a Considerar:**

1. **Latencia:** LLMs locales tienen latencia (500ms-2s). Solución: cache agresivo + feedback visual al jugador.

2. **Consistencia de Tono:** IA puede generar respuestas fuera de carácter. Solución: prompt engineering cuidadoso + filtros post-generación.

3. **Rendimiento:** Llamadas a Ollama son bloqueantes. Solución: implementar sistema de cola asíncrono.

4. **Contenido Inapropiado:** LLM puede generar contenido no deseado. Solución: filtros de contenido + sistema de moderación.

### Recomendación Final

El addon **está técnicamente listo** para la integración de IA local. La arquitectura actual es **compatible y extensible**. Se recomienda:

1. **Fase 1:** Reemplazar detector de intenciones (bajo riesgo)
2. **Fase 2:** Generar respuestas con LLM (riesgo medio, alto impacto)
3. **Fase 3:** Memoria semántica con embeddings (alto valor agregado)
4. **Fase 4:** Predicción de comportamiento con ML (futuro lejano)

**Este documento sirve como base técnica completa para diseñar e implementar la integración de Ollama.**

---

**FIN DE LA AUDITORÍA TÉCNICA FINAL**

