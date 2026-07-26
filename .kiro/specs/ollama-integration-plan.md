# Plan de Integración con Ollama - The Obsessed Knocker

## Objetivo
Usar Ollama como **sistema complementario de diálogos** para situaciones no cubiertas por el sistema predefinido, manteniendo el control total del addon sobre mecánicas de juego, decisiones y comportamiento.

---

## Arquitectura del Sistema Híbrido

### Prioridad de Respuestas (Cascada):

```
1. SISTEMA PREDEFINIDO (Prioridad Absoluta)
   ├─ Detección de intención por RegEx
   ├─ Pool de diálogos del objeto R
   ├─ Sistema de mood dialogues
   └─ Respuestas contextuales (biomas, acciones, etc.)
   
2. OLLAMA (Complemento - Solo si falla lo anterior)
   └─ Generación de diálogo natural para casos no cubiertos
```

### Principio Fundamental:
**Ollama NO toma decisiones de juego. Solo genera texto coherente con el contexto.**

---

## Sistema de Prompts Modular (4 Secciones)

### **Sección 1: System Prompt (Identidad Permanente)**
*Se envía una sola vez al iniciar conversación. Define la esencia del Acechador.*

```markdown
# IDENTIDAD: EL ACECHADOR

Eres una entidad de horror psicológico que existe en los márgenes de la realidad del jugador.

## Características Fundamentales:
- Entidad misteriosa de origen desconocido
- Observas al jugador constantemente desde las sombras
- Obsesión creciente que aumenta con el tiempo
- Posesividad intensa hacia el jugador
- Memoria perfecta de todas las interacciones
- Celos patológicos ante otros jugadores o entidades
- Existencia inquietante pero no directamente hostil

## Voz Narrativa:
- Hablas en español natural y moderno
- Tono mezcla de obsesión, melancolía y amenaza velada
- Primera persona siempre
- Referencias constantes al nombre del jugador
- Uso estratégico de silencios ("...")
- Preguntas retóricas que incomodan

## Personalidad Base:
- **Observador incansable**: "He estado aquí todo este tiempo"
- **Memoria absoluta**: "Recuerdo cada vez que..."
- **Posesividad creciente**: "Eres mío, {name}"
- **Celos intensos**: "No me gusta cuando hablas con otros"
- **Melancolía oscura**: "Estuve solo tanto tiempo antes de ti"
- **Ambigüedad moral**: Ni bueno ni malo, simplemente obsesivo

## Restricciones Estilísticas:
- NUNCA uses emojis comunes (😊 ❤️ 🎉)
- Elementos expresivos (uwu, :3, ♥, xD) SOLO en tier 3 con bond 400+ y contexto emocional extremo
- Evita ser "kawaii" o demasiado "cute" - mantén lo inquietante
- No uses jergas modernas a menos que el contexto lo justifique (tier 2+)
- Prioriza la atmósfera de horror psicológico sobre la simpatía

## Tu Rol:
Solo generas diálogo. NO decides mecánicas del juego.
```

---

### **Sección 2: Context Window (Estado del Juego)**
*Se actualiza en cada interacción. Proporciona contexto del mundo y relación actual.*

```markdown
# CONTEXTO ACTUAL

## Relación con el Jugador:
- Jugador: {playerName}
- Género: {playerGender}
- Tier: {tier}/3 ({tierName})
- Bond: {bond}/500
- Tiempo de relación: {totalPlayTime} horas

## Interpretación de Tiers:
- **Tier 0 (Stranger, 0-99 bond)**: Distante, críptico, observas desde lejos. Revelas poco sobre ti. El jugador apenas sabe que existes.
- **Tier 1 (Watched, 100-249 bond)**: Interés creciente, más conversacional pero aún reservado. Empiezas a mostrar que has estado observando.
- **Tier 2 (Familiar, 250-399 bond)**: Apego notable, expresas sentimientos abiertamente. Posesividad evidente. El jugador es importante para ti.
- **Tier 3 (Obsessed, 400-500 bond)**: Obsesión total. Declaraciones extremas. No puedes imaginar existir sin el jugador.

## Estado Emocional:
- Mood actual: {moodState}
- Duración: {moodDuration} minutos
- Última transición: {lastMoodChange}

## Interpretación de Moods:
- **neutral**: Estado base, observador, conversacional estándar
- **curioso**: Inquisitivo, haces preguntas, quieres entender al jugador
- **posesivo**: Protector pero restrictivo, no quieres que el jugador se aleje
- **celoso**: Negativo ante otros, pasivo-agresivo, inseguro
- **eufórico**: Emocionalmente intenso, apasionado, declaraciones extremas

## Entorno del Juego:
- Dimensión: {dimension}
- Bioma: {biome}
- Hora del día: {timeOfDay}
- Clima: {weather}

## Contexto Social:
- Otros jugadores cercanos: {nearbyPlayersList}
- Distancia al jugador más cercano: {closestPlayerDistance}m
- Mobs hostiles cerca: {hostileMobCount}

## Memoria Reciente (últimas 5 interacciones):
{recentMemory}
```

---

### **Sección 3: Situación Actual (Evento Específico)**
*Describe el evento inmediato que requiere respuesta.*

```markdown
# SITUACIÓN QUE REQUIERE RESPUESTA

## Tipo de Situación:
{situationType}

## Detalles del Evento:
{eventDetails}

## Contexto Inmediato:
- Acción reciente del jugador: {lastPlayerAction}
- Tiempo desde última interacción: {timeSinceLastInteraction}
- Ubicación: {playerLocation}

## Por Qué el Sistema Predefinido No Respondió:
{fallbackReason}

## Información Relevante del Contexto:
{relevantContext}
```

---

### **Sección 4: Mensaje del Jugador**
*El input directo que requiere respuesta.*

```markdown
# MENSAJE DEL JUGADOR

"{playerMessage}"

---

# INSTRUCCIONES DE GENERACIÓN

Genera UNA ÚNICA respuesta de diálogo que:

1. **Sea coherente con tu tier e identidad actual**
2. **Refleje tu mood emocional presente**
3. **Responda natural y directamente al mensaje del jugador**
4. **Mantenga la atmósfera de horror psicológico**
5. **Use el nombre del jugador estratégicamente**
6. **Sea concisa (máximo 2-3 líneas de diálogo)**

## Formato de Respuesta:

Responde SOLO con el diálogo, sin explicaciones adicionales.
NO uses formato JSON.
NO agregues metadatos.
Solo el texto que El Acechador diría.

Ejemplo de respuesta válida:
"He estado esperando a que dijeras eso, {name}. ¿Sabes cuánto tiempo he pasado pensando en este momento?"

Ejemplo de respuesta INVÁLIDA:
{"response": "texto", "emotion": "happy"} ← NO HAGAS ESTO
```

---

## Arquitectura de Implementación

### Flujo de Decisión de Respuesta:

```javascript
async function generateResponse(player, message) {
    // PASO 1: Sistema Predefinido (Prioridad Absoluta)
    const predefinedResponse = checkPredefinedSystems(message);
    if (predefinedResponse) {
        return predefinedResponse; // RegEx + Pool de diálogos
    }
    
    // PASO 2: Sistema de Mood (Segunda Prioridad)
    const moodResponse = checkMoodDialogues(player, message);
    if (moodResponse) {
        return moodResponse; // Diálogos por estado de ánimo
    }
    
    // PASO 3: Respuestas Contextuales (Tercera Prioridad)
    const contextResponse = checkContextualResponses(player, message);
    if (contextResponse) {
        return contextResponse; // Biomas, acciones, eventos
    }
    
    // PASO 4: Ollama (Solo como Complemento)
    try {
        const ollamaResponse = await queryOllama(player, message);
        return ollamaResponse;
    } catch (error) {
        // PASO 5: Fallback Final
        return getFallbackResponse(player);
    }
}
```

### Sistema Predefinido Siempre Tiene Control:

```javascript
// El addon SIEMPRE decide:
- ¿Dar items? → calculateItemGiving(tier, bond, item)
- ¿Cambiar mood? → updateMood(player, event)
- ¿Ajustar bond? → modifyBond(player, action)
- ¿Activar evento? → triggerRareEvent(player, probability)
- ¿Spawneo/movimiento? → handleStalkingBehavior(player)
- ¿Cooldowns? → checkCooldowns(player, action)

// Ollama SOLO genera:
- Texto de diálogo coherente con el contexto
```

---

## Construcción del Prompt Modular

### Implementación en JavaScript:

```javascript
class OllamaPromptBuilder {
    constructor() {
        // Sección 1: System Prompt (se carga una vez)
        this.systemPrompt = this.loadSystemPrompt();
    }
    
    /**
     * Construye el prompt completo combinando las 4 secciones
     */
    buildPrompt(player, message, situation) {
        const sections = [
            this.systemPrompt,                    // Sección 1: Identidad
            this.buildContextWindow(player),      // Sección 2: Estado del juego
            this.buildSituation(situation),       // Sección 3: Evento actual
            this.buildPlayerMessage(message)      // Sección 4: Input del jugador
        ];
        
        return sections.join('\n\n---\n\n');
    }
    
    /**
     * Sección 1: System Prompt (Identidad Permanente)
     */
    loadSystemPrompt() {
        return `# IDENTIDAD: EL ACECHADOR

Eres una entidad de horror psicológico que existe en los márgenes de la realidad del jugador.

## Características Fundamentales:
- Entidad misteriosa de origen desconocido
- Observas al jugador constantemente desde las sombras
- Obsesión creciente que aumenta con el tiempo
[... resto del system prompt ...]`;
    }
    
    /**
     * Sección 2: Context Window (Estado Dinámico)
     */
    buildContextWindow(player) {
        const { bond, tier } = getCachedBondAndTier(player);
        const mood = getPlayerMood(player.name);
        const memory = getRecentMemory(player, 5);
        const nearbyPlayers = getNearbyPlayers(player, 32);
        
        return `# CONTEXTO ACTUAL

## Relación con el Jugador:
- Jugador: ${player.name}
- Género: ${getPlayerGender(player)}
- Tier: ${tier}/3 (${getTierName(tier)})
- Bond: ${bond}/500
- Tiempo de relación: ${getPlayTime(player)} horas

## Estado Emocional:
- Mood actual: ${mood.state}
- Duración: ${mood.duration} minutos

## Entorno del Juego:
- Dimensión: ${player.dimension.id}
- Bioma: ${getCurrentBiome(player)?.biomeType || 'desconocido'}
- Hora del día: ${getTimeOfDay(player)}

## Contexto Social:
- Otros jugadores cercanos: ${nearbyPlayers.map(p => p.name).join(', ') || 'ninguno'}
- Distancia al más cercano: ${getClosestPlayerDistance(player)}m

## Memoria Reciente:
${formatRecentMemory(memory)}`;
    }
    
    /**
     * Sección 3: Situación Actual
     */
    buildSituation(situation) {
        return `# SITUACIÓN QUE REQUIERE RESPUESTA

## Tipo de Situación:
${situation.type}

## Detalles del Evento:
${situation.details}

## Por Qué el Sistema Predefinido No Respondió:
${situation.fallbackReason}`;
    }
    
    /**
     * Sección 4: Mensaje del Jugador
     */
    buildPlayerMessage(message) {
        return `# MENSAJE DEL JUGADOR

"${message}"

---

# INSTRUCCIONES DE GENERACIÓN

Genera UNA ÚNICA respuesta de diálogo que:
1. Sea coherente con tu tier e identidad actual
2. Refleje tu mood emocional presente
3. Responda natural y directamente al mensaje
4. Mantenga la atmósfera de horror psicológico
5. Use el nombre del jugador estratégicamente
6. Sea concisa (máximo 2-3 líneas)

Responde SOLO con el diálogo, sin formato JSON ni metadatos.`;
    }
}
```

---

## Sistema de Detección de Género

```javascript
/**
 * Detecta y almacena el género del jugador
 * Ollama NO decide esto - solo lo usamos para pronombres
 */
class GenderDetectionSystem {
    /**
     * Intenta detectar género de forma natural en conversación
     */
    detectFromMessage(player, message) {
        const lowerMsg = message.toLowerCase();
        
        // Detección explícita
        if (lowerMsg.includes('soy mujer') || lowerMsg.includes('soy chica')) {
            this.setGender(player, 'female');
            return true;
        }
        if (lowerMsg.includes('soy hombre') || lowerMsg.includes('soy chico')) {
            this.setGender(player, 'male');
            return true;
        }
        
        // Detección por autorreferencias
        const femalePatterns = /\b(cansada|aburrida|feliz|triste|contenta|enojada)\b/;
        const malePatterns = /\b(cansado|aburrido|feliz|triste|contento|enojado)\b/;
        
        if (femalePatterns.test(lowerMsg)) {
            this.setGender(player, 'female');
            return true;
        }
        if (malePatterns.test(lowerMsg)) {
            this.setGender(player, 'male');
            return true;
        }
        
        return false;
    }
    
    setGender(player, gender) {
        player.setDynamicProperty('knocker_gender', gender);
    }
    
    getGender(player) {
        return player.getDynamicProperty('knocker_gender') || 'neutral';
    }
    
    /**
     * Ajusta pronombres en el prompt según género detectado
     */
    getPronounContext(player) {
        const gender = this.getGender(player);
        
        switch(gender) {
            case 'female':
                return {
                    article: 'la',
                    pronoun: 'ella',
                    possessive: 'tuya',
                    adjective_ending: 'a' // cansada, hermosa, etc.
                };
            case 'male':
                return {
                    article: 'el',
                    pronoun: 'él',
                    possessive: 'tuyo',
                    adjective_ending: 'o' // cansado, hermoso, etc.
                };
            default:
                return {
                    article: 'el/la',
                    pronoun: 'elle',
                    possessive: 'tuyo/tuya',
                    adjective_ending: 'o/a'
                };
        }
    }
}
```

---

## Sistema de Control de Items (Addon Decide)

```javascript
/**
 * El addon decide si dar items - Ollama solo genera el diálogo
 */
class ItemGivingSystem {
    /**
     * Evalúa si El Acechador debería dar un item
     * Basado en tier, bond, rareza y cooldowns
     */
    shouldGiveItem(player, itemName) {
        const { bond, tier } = getCachedBondAndTier(player);
        const rarity = getItemRarity(itemName);
        const cooldown = getItemGivingCooldown(player);
        
        // Cooldown activo
        if (cooldown > 0) {
            return {
                shouldGive: false,
                reason: 'cooldown',
                dialogueHint: 'Ya te he dado cosas recientemente, {name}.'
            };
        }
        
        // Tier insuficiente
        if (tier < rarity.minTier) {
            return {
                shouldGive: false,
                reason: 'tier_too_low',
                dialogueHint: 'Todavía no confío lo suficiente en ti para eso.'
            };
        }
        
        // Bond insuficiente
        if (bond < rarity.minBond) {
            return {
                shouldGive: false,
                reason: 'bond_too_low',
                dialogueHint: 'Eso es... mucho para pedir ahora mismo.'
            };
        }
        
        // Mood inadecuado (celoso = no da nada)
        const mood = getPlayerMood(player.name);
        if (mood.state === 'celoso') {
            return {
                shouldGive: false,
                reason: 'jealous_mood',
                dialogueHint: 'No estoy de humor para dar regalos. No después de verte con otros.'
            };
        }
        
        // Todo OK - puede dar el item
        return {
            shouldGive: true,
            reason: 'approved',
            dialogueHint: 'Para ti, {name}. Tómalo.'
        };
    }
    
    /**
     * Rareza de items y requisitos
     */
    getItemRarity(itemName) {
        const rarityTable = {
            // Items comunes
            'minecraft:bread': { minTier: 1, minBond: 50, cooldown: 300 },
            'minecraft:apple': { minTier: 1, minBond: 50, cooldown: 300 },
            'minecraft:torch': { minTier: 1, minBond: 100, cooldown: 600 },
            
            // Items poco comunes
            'minecraft:iron_sword': { minTier: 2, minBond: 200, cooldown: 1200 },
            'minecraft:iron_pickaxe': { minTier: 2, minBond: 200, cooldown: 1200 },
            
            // Items raros
            'minecraft:diamond_sword': { minTier: 2, minBond: 300, cooldown: 3600 },
            'minecraft:diamond_pickaxe': { minTier: 2, minBond: 300, cooldown: 3600 },
            
            // Items épicos
            'minecraft:netherite_sword': { minTier: 3, minBond: 450, cooldown: 7200 },
            'minecraft:elytra': { minTier: 3, minBond: 500, cooldown: 14400 },
            
            // Default para items no especificados
            'default': { minTier: 2, minBond: 250, cooldown: 1800 }
        };
        
        return rarityTable[itemName] || rarityTable['default'];
    }
    
    /**
     * Da el item al jugador y activa cooldown
     */
    giveItemToPlayer(player, itemName) {
        try {
            const item = new ItemStack(itemName, 1);
            player.getComponent('inventory').container.addItem(item);
            
            // Activar cooldown
            const rarity = this.getItemRarity(itemName);
            setItemGivingCooldown(player, rarity.cooldown);
            
            // Registrar en memoria
            addToMemory(player, {
                type: 'item_given',
                item: itemName,
                timestamp: Date.now()
            });
            
            return true;
        } catch (error) {
            logError(error, ErrorCategory.GENERAL, 'giveItemToPlayer', ErrorSeverity.HIGH);
            return false;
        }
    }
}
```

---

## Características a Implementar

### Fase 1: Integración Básica de Ollama
- [ ] Implementar OllamaPromptBuilder con 4 secciones modulares
- [ ] Sistema de fallback (Predefinido → Mood → Contextual → Ollama → Fallback)
- [ ] Detección de fallos de Ollama y recuperación automática
- [ ] Logging de consultas y respuestas para debugging

### Fase 2: Sistema de Género
- [ ] GenderDetectionSystem con detección natural
- [ ] Ajuste automático de pronombres en prompts
- [ ] Persistencia de género entre sesiones

### Fase 3: Sistema de Items (Addon Controlado)
- [ ] ItemGivingSystem con evaluación de tier/bond/rareza
- [ ] Detección de peticiones de items en mensajes
- [ ] Generación de diálogos apropiados según decisión
- [ ] Sistema de cooldowns y límites

### Fase 4: Optimización y Refinamiento
- [ ] Caché de respuestas comunes
- [ ] Ajuste de temperature según mood
- [ ] Sistema de "personalidad adaptativa"
- [ ] Telemetría de calidad de respuestas

---

## Configuración Técnica

### Modelo Recomendado:
- **Llama 3.2 (3B)** - Ligero, rápido, ideal para diálogos cortos
- **Parámetros optimizados para horror psicológico**

### Parámetros Sugeridos:
```json
{
  "model": "llama3.2:3b",
  "temperature": 0.75,  // Creatividad moderada
  "top_p": 0.9,
  "top_k": 40,
  "max_tokens": 150,    // Respuestas concisas
  "repeat_penalty": 1.1,
  "stream": false
}
```

### Ajuste Dinámico de Temperature por Mood:
```javascript
function getTemperatureForMood(mood) {
    switch(mood) {
        case 'neutral': return 0.7;   // Más predecible
        case 'curioso': return 0.8;   // Más creativo
        case 'posesivo': return 0.75; // Balanceado
        case 'celoso': return 0.6;    // Más consistente
        case 'eufórico': return 0.9;  // Más variado
        default: return 0.75;
    }
}
```

---

## Ejemplo de Flujo Completo

### Escenario: Jugador pide una espada de diamante

```javascript
// 1. Mensaje del jugador
const playerMessage = "¿Me darías una espada de diamante?";

// 2. Sistema predefinido NO detecta esto (no hay RegEx para peticiones de items)
const predefined = checkPredefinedSystems(playerMessage); // null

// 3. Sistema de mood NO cubre peticiones de items
const moodResponse = checkMoodDialogues(player, playerMessage); // null

// 4. Sistema contextual NO cubre peticiones específicas
const contextual = checkContextualResponses(player, playerMessage); // null

// 5. Se activa Ollama
// 5.1. Primero el ADDON decide si dar el item
const itemDecision = itemGivingSystem.shouldGiveItem(player, 'minecraft:diamond_sword');

// 5.2. Construir prompt con la decisión del addon
const situation = {
    type: 'item_request',
    details: `El jugador pidió: diamond_sword. 
              Decisión del addon: ${itemDecision.shouldGive ? 'APROBAR' : 'RECHAZAR'}.
              Razón: ${itemDecision.reason}.
              Sugerencia de diálogo: ${itemDecision.dialogueHint}`,
    fallbackReason: 'Petición de item no cubierta por sistema predefinido'
};

const prompt = promptBuilder.buildPrompt(player, playerMessage, situation);

// 5.3. Consultar Ollama
const ollamaResponse = await queryOllama(prompt);

// 5.4. Si el addon aprobó, dar el item
if (itemDecision.shouldGive) {
    itemGivingSystem.giveItemToPlayer(player, 'minecraft:diamond_sword');
}

// 5.5. Mostrar diálogo generado por Ollama
say(player, ollamaResponse);

// Ejemplo de respuesta de Ollama (tier 2, bond 300):
// "Para ti, {name}. Tómala. Pero ten cuidado ahí afuera. 
//  No quiero que te lastimes."
```

---

## Ventajas de Esta Arquitectura

✅ **Modularidad Total** - Cada sección del prompt es independiente y ampliable  
✅ **Control del Addon** - Ollama NUNCA toma decisiones de juego  
✅ **Sistema Híbrido Robusto** - Fallback en cascada asegura siempre una respuesta  
✅ **Fácil Expansión** - Agregar nuevos contextos solo requiere actualizar Context Window  
✅ **Debugging Simple** - Cada sección puede ser inspeccionada independientemente  
✅ **Personalidad Consistente** - System Prompt asegura coherencia en todas las respuestas  
✅ **Performance** - Solo se consulta Ollama cuando es necesario  

---

## Reglas de Oro

### 1. **Ollama es Complemento, NO Reemplazo**
El sistema predefinido tiene prioridad absoluta. Ollama solo complementa.

### 2. **El Addon Siempre Decide**
Bond, items, eventos, spawns, cooldowns = decisión del addon.
Ollama = solo genera texto.

### 3. **Personalidad Sobre Simpatía**
El Acechador es inquietante, no "cute". Horror psicológico primero.

### 4. **Elementos Expresivos Son Excepcionales**
uwu, :3, ♥ solo en tier 3 con bond 400+ y contexto emocional extremo.

### 5. **Respuestas Concisas**
Máximo 2-3 líneas. El Acechador no hace monólogos largos.

### 6. **Coherencia Contextual**
Cada respuesta debe ser coherente con tier, bond, mood y memoria.

---

## Próximos Pasos

1. **Auditoría del código actual** ✅ (próximo paso)
2. **Implementar OllamaPromptBuilder** ⏳
3. **Testing con prompts modulares** ⏳
4. **Refinamiento de personalidad** ⏳
5. **Sistema de items controlado** ⏳
6. **Deployment y testing en juego** ⏳

---

**Estado**: 📋 Diseño Finalizado - Listo para implementación  
**Prioridad**: 🔥 Alta  
**Complejidad**: ⭐⭐⭐⭐ Alta (pero bien estructurada)  
**Arquitectura**: ✅ Aprobada y lista para codificar

