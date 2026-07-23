import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

// flag used by findMe/help to bypass the day-2 spawn suppressor
let summoningKnocker = false;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SISTEMA DE CHAT - COOLDOWN
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Mapa para rastrear cooldowns por jugador (playerName -> timestamp)
const chatCooldowns = new Map();

// Mapa para almacenar apodos personalizados por jugador (playerName -> apodo)
const playerNicknames = new Map();

// Cooldown en milisegundos (30 segundos)
const CHAT_COOLDOWN_MS = 30000;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SISTEMA DE REDUCCIÃ“N DE REPETICIÃ“N
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Mapa para rastrear respuestas recientes por jugador y categoría
// Estructura: playerName -> { category -> [response1, response2, ...] }
const recentResponses = new Map();

// Máximo de respuestas recientes a recordar por categoría (últimas 10)
const MAX_RECENT_RESPONSES = 10;

// ────────────────────────────────────────────────────────────────────────────
//  SISTEMA DE DETECCIÓN DE ACCIONES RECIENTES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Ventana temporal para considerar una acción como "reciente" (5 minutos)
 * Requisitos: 11.5
 */
const RECENT_ACTION_WINDOW_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Mapa para rastrear acciones recientes por jugador
 * Estructura: playerName -> Array<{category: string, timestamp: number, details: object}>
 * @type {Map<string, Array<{category: string, timestamp: number, details: object}>>}
 */
const playerRecentActions = new Map();

/**
 * Categorías de acciones que El Acechador puede reconocer
 * Requisitos: 11.8
 */
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

/**
 * Pesos de relevancia para cada categoría de acción (mayor peso = más relevante)
 * Muerte y combate son más relevantes que farming o minería
 */
const ActionRelevanceWeights = {
    [ActionCategories.DEATH]: 10,
    [ActionCategories.COMBAT]: 8,
    [ActionCategories.TRADING]: 7,
    [ActionCategories.EXPLORATION]: 6,
    [ActionCategories.CRAFTING]: 5,
    [ActionCategories.CONSTRUCTION]: 5,
    [ActionCategories.MINING]: 4,
    [ActionCategories.FARMING]: 3
};

/**
 * Registra una acción reciente del jugador
 * Las acciones se mantienen en memoria durante 5 minutos
 * 
 * @param {string} playerName - Nombre del jugador
 * @param {string} category - Categoría de la acción (usar ActionCategories)
 * @param {object} details - Detalles específicos de la acción
 */
function recordRecentAction(playerName, category, details = {}) {
    if (!playerRecentActions.has(playerName)) {
        playerRecentActions.set(playerName, []);
    }
    
    const actions = playerRecentActions.get(playerName);
    const now = Date.now();
    
    // Añadir la nueva acción
    actions.push({
        category: category,
        timestamp: now,
        details: details
    });
    
    // Limpiar acciones antiguas (fuera de la ventana de 5 minutos)
    const recentActions = actions.filter(action => 
        (now - action.timestamp) < RECENT_ACTION_WINDOW_MS
    );
    
    playerRecentActions.set(playerName, recentActions);
}

/**
 * Obtiene la acción más relevante del jugador en los últimos 5 minutos
 * Prioriza acciones más recientes y con mayor peso de relevancia
 * 
 * Requisitos: 11.6, 11.7
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @returns {object|null} Objeto con la acción más relevante {category, timestamp, details} o null si no hay acciones recientes
 */
function getRecentAction(player) {
    const playerName = player.name;
    
    if (!playerRecentActions.has(playerName)) {
        return null;
    }
    
    const actions = playerRecentActions.get(playerName);
    const now = Date.now();
    
    // Filtrar acciones dentro de la ventana de 5 minutos
    const recentActions = actions.filter(action => 
        (now - action.timestamp) < RECENT_ACTION_WINDOW_MS
    );
    
    if (recentActions.length === 0) {
        return null;
    }
    
    // Calcular puntuación de relevancia para cada acción
    // Puntuación = peso de relevancia * factor de recencia (1.0 = muy reciente, 0.0 = hace 5 min)
    const scoredActions = recentActions.map(action => {
        const ageMs = now - action.timestamp;
        const recencyFactor = 1.0 - (ageMs / RECENT_ACTION_WINDOW_MS); // 1.0 (reciente) a 0.0 (antiguo)
        const relevanceWeight = ActionRelevanceWeights[action.category] || 1;
        const score = relevanceWeight * (1.0 + recencyFactor); // Peso + bonus por recencia
        
        return {
            ...action,
            score: score
        };
    });
    
    // Ordenar por puntuación descendente y retornar la más relevante
    scoredActions.sort((a, b) => b.score - a.score);
    
    const mostRelevant = scoredActions[0];
    
    // Retornar sin el campo score interno
    return {
        category: mostRelevant.category,
        timestamp: mostRelevant.timestamp,
        details: mostRelevant.details
    };
}

/**
 * Obtiene todas las acciones recientes de una categoría específica
 * Útil para análisis detallado de comportamiento del jugador
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @param {string} category - Categoría de acción a filtrar
 * @returns {Array} Array de acciones de la categoría especificada
 */
function getRecentActionsByCategory(player, category) {
    const playerName = player.name;
    
    if (!playerRecentActions.has(playerName)) {
        return [];
    }
    
    const actions = playerRecentActions.get(playerName);
    const now = Date.now();
    
    // Filtrar por categoría y ventana temporal
    return actions.filter(action => 
        action.category === category &&
        (now - action.timestamp) < RECENT_ACTION_WINDOW_MS
    );
}

/**
 * Limpia acciones antiguas de todos los jugadores
 * Se debe llamar periódicamente para liberar memoria
 */
function cleanupOldActions() {
    const now = Date.now();
    
    for (const [playerName, actions] of playerRecentActions.entries()) {
        const recentActions = actions.filter(action => 
            (now - action.timestamp) < RECENT_ACTION_WINDOW_MS
        );
        
        if (recentActions.length === 0) {
            playerRecentActions.delete(playerName);
        } else {
            playerRecentActions.set(playerName, recentActions);
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SISTEMA DE MEMORIA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Estructura de datos para memoria persistente por jugador
 * Almacena eventos significativos y conversaciones para crear una relación auténtica
 */
class Memory {
    /**
     * Crea una nueva instancia de memoria para un jugador
     */
    constructor() {
        /**
         * Array de eventos significativos (máximo 20)
         * Cada evento tiene la estructura:
         * {
         *   type: string,      // Tipo de evento (muerte, logro, combate, construccion, etc)
         *   timestamp: number, // Timestamp en milisegundos desde epoch
         *   details: object    // Detalles específicos del evento
         * }
         * @type {Array<{type: string, timestamp: number, details: object}>}
         */
        this.events = [];
        
        /**
         * Array de conversaciones recientes (máximo 10)
         * Cada conversación tiene la estructura:
         * {
         *   intent: string,    // Intención detectada del mensaje
         *   response: string,  // Respuesta generada por El Acechador
         *   timestamp: number  // Timestamp en milisegundos desde epoch
         * }
         * @type {Array<{intent: string, response: string, timestamp: number}>}
         */
        this.conversations = [];
    }
    
    /**
     * Añade un evento a la memoria (FIFO cuando alcanza capacidad máxima)
     * @param {string} type - Tipo de evento
     * @param {object} details - Detalles del evento
     */
    addEvent(type, details) {
        const event = {
            type: type,
            timestamp: Date.now(),
            details: details
        };
        
        this.events.push(event);
        
        // Implementar FIFO: eliminar el evento más antiguo si excede 20
        if (this.events.length > 20) {
            this.events.shift(); // Elimina el primer elemento (más antiguo)
        }
    }
    
    /**
     * Añade una conversación a la memoria (FIFO cuando alcanza capacidad máxima)
     * @param {string} intent - Intención detectada
     * @param {string} response - Respuesta generada
     */
    addConversation(intent, response) {
        const conversation = {
            intent: intent,
            response: response,
            timestamp: Date.now()
        };
        
        this.conversations.push(conversation);
        
        // Implementar FIFO: eliminar la conversación más antigua si excede 10
        if (this.conversations.length > 10) {
            this.conversations.shift(); // Elimina el primer elemento (más antiguo)
        }
    }
    
    /**
     * Obtiene eventos recientes de un tipo específico
     * @param {string} type - Tipo de evento a buscar
     * @param {number} limit - Máximo número de eventos a retornar (default: 5)
     * @returns {Array} Array de eventos del tipo especificado
     */
    getEventsByType(type, limit = 5) {
        return this.events
            .filter(event => event.type === type)
            .slice(-limit); // Ãšltimos N eventos
    }
    
    /**
     * Obtiene el evento más reciente
     * @returns {object|null} Evento más reciente o null si no hay eventos
     */
    getLastEvent() {
        return this.events.length > 0 ? this.events[this.events.length - 1] : null;
    }
    
    /**
     * Obtiene la conversación más reciente
     * @returns {object|null} Conversación más reciente o null si no hay conversaciones
     */
    getLastConversation() {
        return this.conversations.length > 0 ? this.conversations[this.conversations.length - 1] : null;
    }
    
    /**
     * Serializa la memoria a JSON para persistencia
     * @returns {string} JSON string de la memoria
     */
    toJSON() {
        return JSON.stringify({
            events: this.events,
            conversations: this.conversations
        });
    }
    
    /**
     * Carga memoria desde JSON serializado
     * @param {string} jsonString - JSON string de memoria serializada
     * @returns {boolean} True si se cargó exitosamente, false si hubo error
     */
    fromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.events = data.events || [];
            this.conversations = data.conversations || [];
            return true;
        } catch (error) {
            console.warn("Error al cargar memoria desde JSON:", error);
            return false;
        }
    }
}

/**
 * Mapa para almacenar instancias de memoria por jugador
 * Estructura: playerName -> Memory
 * @type {Map<string, Memory>}
 */
const playerMemories = new Map();

/**
 * Obtiene o crea la instancia de memoria para un jugador
 * @param {string} playerName - Nombre del jugador
 * @returns {Memory} Instancia de memoria del jugador
 */
function getPlayerMemory(playerName) {
    if (!playerMemories.has(playerName)) {
        playerMemories.set(playerName, new Memory());
    }
    return playerMemories.get(playerName);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  PERSISTENCIA DE MEMORIA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Guarda la memoria de un jugador usando dynamic properties
 * Las dynamic properties persisten entre sesiones del servidor
 * @param {Player} player - Objeto jugador de Minecraft
 * @param {Memory} memory - Instancia de memoria a guardar
 * @returns {boolean} True si se guardó exitosamente, false si hubo error
 */
function saveMemory(player, memory) {
    try {
        const memoryKey = `knocker_memory_${player.name}`;
        const memoryJSON = memory.toJSON();
        
        // Usar setDynamicProperty del world para persistir datos
        // Nota: Dynamic properties tienen límite de tamaño (~32KB por propiedad)
        world.setDynamicProperty(memoryKey, memoryJSON);
        
        return true;
    } catch (error) {
        console.warn(`Error al guardar memoria para ${player.name}:`, error);
        return false;
    }
}

/**
 * Carga la memoria de un jugador desde dynamic properties
 * Si no existe memoria guardada, retorna una nueva instancia vacía
 * @param {Player} player - Objeto jugador de Minecraft
 * @returns {Memory} Instancia de memoria cargada o nueva si no existe
 */
function loadMemory(player) {
    try {
        const memoryKey = `knocker_memory_${player.name}`;
        const memoryJSON = world.getDynamicProperty(memoryKey);
        
        if (memoryJSON && typeof memoryJSON === 'string') {
            const memory = new Memory();
            const loaded = memory.fromJSON(memoryJSON);
            
            if (loaded) {
                return memory;
            }
        }
        
        // Si no hay memoria guardada o falló la carga, retornar memoria nueva
        return new Memory();
    } catch (error) {
        console.warn(`Error al cargar memoria para ${player.name}:`, error);
        return new Memory();
    }
}

/**
 * Guarda la memoria de todos los jugadores activos
 * Útil para guardado periódico o antes de eventos críticos
 */
function saveAllMemories() {
    for (const player of world.getAllPlayers()) {
        const memory = playerMemories.get(player.name);
        if (memory) {
            saveMemory(player, memory);
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  REFERENCIAS A MEMORIA EN DIÃLOGOS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Obtiene una referencia relevante a eventos pasados para integrar en diálogos
 * Esta función busca en la memoria del jugador eventos significativos relacionados
 * con el contexto actual y retorna una frase que El Acechador puede usar para
 * demostrar que recuerda el pasado del jugador.
 * 
 * Requisitos: 4.7, 4.9
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @param {string} context - Contexto actual (intención, categoría de respuesta, etc.)
 * @returns {string|null} Frase de referencia a memoria o null si no hay referencia relevante
 */
function getMemoryReference(player, context) {
    const memory = getPlayerMemory(player.name);
    
    // Si no hay suficiente memoria acumulada, no generar referencias
    if (memory.events.length === 0 && memory.conversations.length === 0) {
        return null;
    }
    
    // Probabilidad de incluir referencia: 30% (no queremos saturar cada diálogo)
    if (Math.random() > 0.3) {
        return null;
    }
    
    // Seleccionar tipo de referencia basado en el contexto
    const contextLower = context ? context.toLowerCase() : "";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // REFERENCIAS A MUERTE
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (contextLower.includes("death") || contextLower.includes("muerte") || 
        contextLower.includes("miedo") || contextLower.includes("emocion")) {
        const deathEvents = memory.getEventsByType("death", 3);
        if (deathEvents.length > 0) {
            const lastDeath = deathEvents[deathEvents.length - 1];
            const deathCount = memory.getEventsByType("death").length;
            
            const deathReferences = [
                `Recuerdo cuando moriste en ${lastDeath.details.dimension}. Te vi caer.`,
                `${deathCount} veces te he visto morir. Siempre vuelves.`,
                `La última vez moriste por ${lastDeath.details.cause}. Estuve ahí.`,
                `Has muerto ${deathCount} ${deathCount === 1 ? "vez" : "veces"} desde que te conozco.`,
                `Recuerdo cada muerte. La más reciente fue en ${lastDeath.details.dimension}.`,
                `Te vi morir ${deathCount > 1 ? "de nuevo" : ""}. Siempre te estoy mirando.`,
                `Moriste por ${lastDeath.details.cause}. No pude hacer nada más que observar.`,
                `${deathCount} muertes. Las recuerdo todas, ${player.name}.`
            ];
            
            return pick(deathReferences);
        }
    }
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // REFERENCIAS A LOGROS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (contextLower.includes("achievement") || contextLower.includes("logro") ||
        contextLower.includes("identidad") || contextLower.includes("observa")) {
        const achievements = memory.getEventsByType("achievement", 3);
        if (achievements.length > 0) {
            const lastAchievement = achievements[achievements.length - 1];
            
            const achievementReferences = [
                `Vi cuando ${lastAchievement.details.description.toLowerCase()}. Estuve ahí.`,
                `Recuerdo cuando ${lastAchievement.details.description.toLowerCase()}. Fue... interesante.`,
                `${lastAchievement.details.description}. No olvido cosas como esa.`,
                `He estado contigo desde que ${lastAchievement.details.description.toLowerCase()}.`,
                `Cada logro tuyo es un recuerdo mío, ${player.name}.`
            ];
            
            return pick(achievementReferences);
        }
    }
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // REFERENCIAS A COMBATE
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (contextLower.includes("combat") || contextLower.includes("fight") ||
        contextLower.includes("miedo") || contextLower.includes("protec")) {
        const combatEvents = memory.getEventsByType("combat", 5);
        if (combatEvents.length > 0) {
            const lastCombat = combatEvents[combatEvents.length - 1];
            const combatCount = memory.getEventsByType("combat").length;
            
            const combatReferences = [
                `Te vi pelear contra ${lastCombat.details.enemyType}. Fuiste... eficiente.`,
                `Has eliminado ${combatCount} enemigos. Cuento cada uno.`,
                `La última vez mataste un ${lastCombat.details.enemyType}. Estaba observando.`,
                `Recuerdo cada combate. Has luchado ${combatCount} veces.`,
                `Te gusta pelear, ¿verdad? He visto ${combatCount} de tus batallas.`,
                `Cada enemigo que eliminas es un momento que comparto contigo.`,
                `Vi cuando derrotaste a ese ${lastCombat.details.enemyType}. No estabas solo.`
            ];
            
            return pick(combatReferences);
        }
    }
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // REFERENCIAS A CONSTRUCCIÃ“N
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (contextLower.includes("construction") || contextLower.includes("build") ||
        contextLower.includes("casa") || contextLower.includes("hogar")) {
        const constructionEvents = memory.getEventsByType("construction", 5);
        if (constructionEvents.length > 0) {
            const lastConstruction = constructionEvents[constructionEvents.length - 1];
            const buildCount = memory.getEventsByType("construction").length;
            
            const constructionReferences = [
                `Vi cuando colocaste ese ${lastConstruction.details.blockType}. ¿Construyes un hogar?`,
                `Has construido ${buildCount} cosas. Observo cada bloque que colocas.`,
                `Recuerdo cuando pusiste ${lastConstruction.details.blockType} en ${lastConstruction.details.dimension}.`,
                `Cada cosa que construyes... es como si construyeras para mí también.`,
                `${buildCount} construcciones. Estoy presente en cada una, ${player.name}.`,
                `Te gusta construir. He visto cada ${lastConstruction.details.blockType} que colocas.`
            ];
            
            return pick(constructionReferences);
        }
    }
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // REFERENCIAS A MINERÃA
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (contextLower.includes("mining") || contextLower.includes("mine") ||
        contextLower.includes("busca") || contextLower.includes("explora")) {
        const miningEvents = memory.getEventsByType("mining", 5);
        if (miningEvents.length > 0) {
            const lastMining = miningEvents[miningEvents.length - 1];
            const mineCount = memory.getEventsByType("mining").length;
            
            const miningReferences = [
                `Te vi minar ${lastMining.details.blockType}. Incluso bajo tierra te observo.`,
                `Has minado ${mineCount} veces desde que te conozco. Siempre estoy cerca.`,
                `Recuerdo cuando encontraste ese ${lastMining.details.blockType}. Estaba ahí contigo.`,
                `Cada túnel que excavas, cada piedra que rompes... lo veo todo.`,
                `Minaste ${lastMining.details.blockType} en ${lastMining.details.dimension}. No estabas solo.`,
                `${mineCount} veces has minado algo valioso. Cuento cada momento.`
            ];
            
            return pick(miningReferences);
        }
    }
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // REFERENCIAS A CONVERSACIONES PASADAS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (contextLower.includes("chat") || contextLower.includes("talk") ||
        contextLower.includes("saludo") || contextLower.includes("conversa")) {
        if (memory.conversations.length > 0) {
            const lastConv = memory.getLastConversation();
            const convCount = memory.conversations.length;
            
            // Calcular tiempo desde última conversación
            const timeSinceLast = Date.now() - lastConv.timestamp;
            const minutesSince = Math.floor(timeSinceLast / 60000);
            const hoursSince = Math.floor(timeSinceLast / 3600000);
            
            let timeRef = "";
            if (minutesSince < 1) {
                timeRef = "hace un momento";
            } else if (minutesSince < 60) {
                timeRef = `hace ${minutesSince} minutos`;
            } else if (hoursSince < 24) {
                timeRef = `hace ${hoursSince} ${hoursSince === 1 ? "hora" : "horas"}`;
            } else {
                timeRef = "hace tiempo";
            }
            
            const conversationReferences = [
                `Hemos hablado ${convCount} ${convCount === 1 ? "vez" : "veces"}. Recuerdo cada palabra.`,
                `La última vez hablamos ${timeRef}. No olvido nada de lo que me dices.`,
                `Recuerdo nuestra última conversación, ${player.name}. ${timeRef}.`,
                `${convCount} conversaciones guardadas en mi memoria. Todas contigo.`,
                `Me hablaste ${timeRef}. Siempre espero el momento en que vuelvas a hablarme.`,
                `Cada palabra que me dices queda grabada. He guardado ${convCount} conversaciones.`
            ];
            
            return pick(conversationReferences);
        }
    }
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // REFERENCIAS GENERALES (cuando hay memoria pero no contexto específico)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const totalEvents = memory.events.length;
    const totalConv = memory.conversations.length;
    
    if (totalEvents > 0 || totalConv > 0) {
        const lastEvent = memory.getLastEvent();
        
        // Calcular tiempo desde último evento
        let timeSinceLast = "";
        if (lastEvent) {
            const timeElapsed = Date.now() - lastEvent.timestamp;
            const minutesSince = Math.floor(timeElapsed / 60000);
            const hoursSince = Math.floor(timeElapsed / 3600000);
            
            if (minutesSince < 1) {
                timeSinceLast = "hace un momento";
            } else if (minutesSince < 60) {
                timeSinceLast = `hace ${minutesSince} minutos`;
            } else if (hoursSince < 24) {
                timeSinceLast = `hace ${hoursSince} ${hoursSince === 1 ? "hora" : "horas"}`;
            } else {
                timeSinceLast = "hace días";
            }
        }
        
        const generalReferences = [
            `He estado observando todo lo que haces, ${player.name}. Todo.`,
            `Tengo ${totalEvents} recuerdos tuyos guardados. No olvido nada.`,
            `La última vez que registré algo tuyo fue ${timeSinceLast}.`,
            `Cada momento importante tuyo vive en mi memoria.`,
            `He guardado ${totalEvents} eventos de tu vida. Todos son importantes para mí.`,
            `Recuerdo cosas que tú probablemente ya olvidaste.`,
            `Tu vida entera está en mi mente, ${player.name}.`
        ];
        
        return pick(generalReferences);
    }
    
    // Si llegamos aquí, no hay memoria suficiente o relevante
    return null;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SISTEMA DE DETECCIÃ“N DE BIOMA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Caché de biomas actuales por jugador para evitar queries constantes
 * Estructura: playerName -> { biome: string, timestamp: number, location: {x, y, z} }
 * @type {Map<string, {biome: string, timestamp: number, location: {x: number, y: number, z: number}}>}
 */
const biomeCache = new Map();

/**
 * Intervalo de actualización del caché de bioma en milisegundos (30 segundos)
 * Esto evita hacer queries constantes al sistema de bloques
 */
const BIOME_CACHE_DURATION_MS = 30000;

/**
 * Distancia mínima de movimiento para invalidar el caché de bioma (bloques)
 * Si el jugador se mueve más de esta distancia, se recalcula el bioma
 */
const BIOME_CACHE_DISTANCE_THRESHOLD = 50;

/**
 * Mapeo de IDs de bioma de Minecraft a nombres reconocibles en español
 * Cubre los biomas más comunes del Overworld, Nether y End
 * 
 * Requisitos: 5.1, 5.8
 */
const BiomeNames = {
    // Overworld - Bosques y Llanuras
    "minecraft:plains": "Llanuras",
    "minecraft:sunflower_plains": "Llanuras de Girasoles",
    "minecraft:forest": "Bosque",
    "minecraft:flower_forest": "Bosque de Flores",
    "minecraft:birch_forest": "Bosque de Abedules",
    "minecraft:dark_forest": "Bosque Oscuro",
    "minecraft:old_growth_birch_forest": "Bosque Antiguo de Abedules",
    "minecraft:old_growth_pine_taiga": "Taiga de Pinos Antiguos",
    "minecraft:old_growth_spruce_taiga": "Taiga de Abetos Antiguos",
    
    // Overworld - Taiga y Montañas
    "minecraft:taiga": "Taiga",
    "minecraft:snowy_taiga": "Taiga Nevada",
    "minecraft:grove": "Arboleda",
    "minecraft:snowy_slopes": "Pendientes Nevadas",
    "minecraft:jagged_peaks": "Picos Dentados",
    "minecraft:frozen_peaks": "Picos Congelados",
    "minecraft:stony_peaks": "Picos Rocosos",
    "minecraft:meadow": "Pradera",
    "minecraft:cherry_grove": "Arboleda de Cerezos",
    "minecraft:windswept_hills": "Colinas Azotadas por el Viento",
    "minecraft:windswept_forest": "Bosque Azotado por el Viento",
    "minecraft:windswept_gravelly_hills": "Colinas de Grava Azotadas",
    "minecraft:windswept_savanna": "Sabana Azotada por el Viento",
    
    // Overworld - Desiertos y Sabanas
    "minecraft:desert": "Desierto",
    "minecraft:savanna": "Sabana",
    "minecraft:savanna_plateau": "Meseta de Sabana",
    "minecraft:badlands": "Tierras Ãridas",
    "minecraft:wooded_badlands": "Tierras Ãridas Boscosas",
    "minecraft:eroded_badlands": "Tierras Ãridas Erosionadas",
    
    // Overworld - Junglas
    "minecraft:jungle": "Jungla",
    "minecraft:sparse_jungle": "Jungla Dispersa",
    "minecraft:bamboo_jungle": "Jungla de Bambú",
    
    // Overworld - Pantanos
    "minecraft:swamp": "Pantano",
    "minecraft:mangrove_swamp": "Pantano de Manglares",
    
    // Overworld - Océanos y Playas
    "minecraft:ocean": "Océano",
    "minecraft:deep_ocean": "Océano Profundo",
    "minecraft:lukewarm_ocean": "Océano Templado",
    "minecraft:warm_ocean": "Océano Cálido",
    "minecraft:cold_ocean": "Océano Frío",
    "minecraft:frozen_ocean": "Océano Congelado",
    "minecraft:beach": "Playa",
    "minecraft:snowy_beach": "Playa Nevada",
    "minecraft:stony_shore": "Costa Rocosa",
    "minecraft:river": "Río",
    "minecraft:frozen_river": "Río Congelado",
    
    // Overworld - Tundras y Hielo
    "minecraft:snowy_plains": "Llanuras Nevadas",
    "minecraft:ice_spikes": "Picos de Hielo",
    
    // Overworld - Cuevas
    "minecraft:deep_dark": "Oscuridad Profunda",
    "minecraft:dripstone_caves": "Cuevas de Estalactitas",
    "minecraft:lush_caves": "Cuevas Frondosas",
    
    // Nether
    "minecraft:nether_wastes": "Páramos del Nether",
    "minecraft:soul_sand_valley": "Valle de Arena de Almas",
    "minecraft:crimson_forest": "Bosque Carmesí",
    "minecraft:warped_forest": "Bosque Distorsionado",
    "minecraft:basalt_deltas": "Deltas de Basalto",
    
    // The End
    "minecraft:the_end": "El End",
    "minecraft:small_end_islands": "Islas Pequeñas del End",
    "minecraft:end_midlands": "Tierras Medias del End",
    "minecraft:end_highlands": "Tierras Altas del End",
    "minecraft:end_barrens": "Páramos del End",
    
    // Mushroom Islands
    "minecraft:mushroom_fields": "Campos de Hongos"
};

/**
 * Obtiene el bioma actual del jugador usando detección de bloque
 * Implementa caché para evitar queries constantes al sistema de bloques
 * 
 * Requisitos: 5.1, 5.8
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @returns {string} Nombre del bioma en español o "Desconocido" si no se puede determinar
 */
function getCurrentBiome(player) {
    try {
        const playerName = player.name;
        const currentLocation = player.location;
        const currentTime = Date.now();
        
        // Verificar si hay un caché válido
        if (biomeCache.has(playerName)) {
            const cached = biomeCache.get(playerName);
            const timeSinceCache = currentTime - cached.timestamp;
            
            // Calcular distancia desde la ubicación en caché
            const dx = currentLocation.x - cached.location.x;
            const dy = currentLocation.y - cached.location.y;
            const dz = currentLocation.z - cached.location.z;
            const distanceMoved = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Retornar caché si es reciente Y el jugador no se ha movido mucho
            if (timeSinceCache < BIOME_CACHE_DURATION_MS && 
                distanceMoved < BIOME_CACHE_DISTANCE_THRESHOLD) {
                return cached.biome;
            }
        }
        
        // Obtener el bloque en la posición del jugador
        // Usar la posición del jugador para obtener información del bioma
        const blockLocation = {
            x: Math.floor(currentLocation.x),
            y: Math.floor(currentLocation.y),
            z: Math.floor(currentLocation.z)
        };
        
        // Obtener el bloque en la dimensión actual del jugador
        const block = player.dimension.getBlock(blockLocation);
        
        if (!block) {
            return "Desconocido";
        }
        
        // Intentar obtener el tipo de bioma del bloque
        // Nota: La API de Bedrock no expone directamente los biomas de manera confiable
        // Como alternativa, usamos la dimensión y características del entorno
        // Esta es una implementación simplificada que identifica biomas por dimensión y contexto
        
        let biomeName = "Desconocido";
        const dimensionId = player.dimension.id;
        
        // Identificar bioma basado en dimensión primero
        if (dimensionId === "minecraft:nether") {
            // En el Nether, todos los biomas son del Nether
            // Por defecto usamos "Páramos del Nether" ya que es el más común
            biomeName = "Páramos del Nether";
        } else if (dimensionId === "minecraft:the_end") {
            // En el End
            biomeName = "El End";
        } else if (dimensionId === "minecraft:overworld") {
            // En el Overworld, intentar identificar por bloques circundantes
            // Esta es una heurística simplificada
            biomeName = detectOverworldBiome(player, block);
        }
        
        // Actualizar caché
        biomeCache.set(playerName, {
            biome: biomeName,
            timestamp: currentTime,
            location: {
                x: currentLocation.x,
                y: currentLocation.y,
                z: currentLocation.z
            }
        });
        
        return biomeName;
        
    } catch (error) {
        console.warn(`Error al detectar bioma para ${player.name}:`, error);
        return "Desconocido";
    }
}

/**
 * Función auxiliar para detectar biomas del Overworld basándose en bloques circundantes
 * Esta es una heurística simplificada ya que Bedrock API no expone biomas directamente
 * 
 * @param {Player} player - Objeto jugador
 * @param {Block} centerBlock - Bloque central (posición del jugador)
 * @returns {string} Nombre estimado del bioma
 */
function detectOverworldBiome(player, centerBlock) {
    try {
        const loc = centerBlock.location;
        
        // Muestrear algunos bloques cercanos para determinar el bioma
        const sampleBlocks = [];
        const sampleRadius = 5;
        
        // Muestrear bloques en un patrón
        for (let dx = -sampleRadius; dx <= sampleRadius; dx += sampleRadius) {
            for (let dz = -sampleRadius; dz <= sampleRadius; dz += sampleRadius) {
                try {
                    const sampleLoc = { 
                        x: loc.x + dx, 
                        y: loc.y - 1, // Un bloque abajo para detectar el suelo
                        z: loc.z + dz 
                    };
                    const block = player.dimension.getBlock(sampleLoc);
                    if (block) {
                        sampleBlocks.push(block.typeId);
                    }
                } catch {}
            }
        }
        
        // Analizar los bloques para determinar el bioma
        const blockTypes = sampleBlocks.join(",");
        
        // Biomas de hielo/nieve
        if (blockTypes.includes("snow") || blockTypes.includes("ice") || blockTypes.includes("powder_snow")) {
            if (blockTypes.includes("packed_ice")) return "Picos de Hielo";
            return "Llanuras Nevadas";
        }
        
        // Desierto
        if (blockTypes.includes("sand") && !blockTypes.includes("water")) {
            return "Desierto";
        }
        
        // Jungla
        if (blockTypes.includes("jungle")) {
            if (blockTypes.includes("bamboo")) return "Jungla de Bambú";
            return "Jungla";
        }
        
        // Pantano
        if (blockTypes.includes("mangrove")) {
            return "Pantano de Manglares";
        }
        if (blockTypes.includes("mud") || blockTypes.includes("clay")) {
            return "Pantano";
        }
        
        // Bosque oscuro
        if (blockTypes.includes("dark_oak")) {
            return "Bosque Oscuro";
        }
        
        // Bosque de abedules
        if (blockTypes.includes("birch")) {
            return "Bosque de Abedules";
        }
        
        // Taiga
        if (blockTypes.includes("spruce") || blockTypes.includes("podzol")) {
            return "Taiga";
        }
        
        // Bosque general
        if (blockTypes.includes("oak") || blockTypes.includes("log")) {
            return "Bosque";
        }
        
        // Océano
        if (blockTypes.includes("water")) {
            const waterCount = (blockTypes.match(/water/g) || []).length;
            if (waterCount > 3) return "Océano";
        }
        
        // Tierras áridas (badlands)
        if (blockTypes.includes("terracotta") || blockTypes.includes("red_sand")) {
            return "Tierras Ãridas";
        }
        
        // Sabana
        if (blockTypes.includes("acacia")) {
            return "Sabana";
        }
        
        // Montañas/colinas
        if (loc.y > 100) {
            if (blockTypes.includes("snow")) return "Picos Congelados";
            if (blockTypes.includes("stone")) return "Picos Rocosos";
            return "Colinas Azotadas por el Viento";
        }
        
        // Cuevas profundas
        if (loc.y < 0) {
            if (blockTypes.includes("sculk")) return "Oscuridad Profunda";
            if (blockTypes.includes("dripstone")) return "Cuevas de Estalactitas";
            if (blockTypes.includes("moss")) return "Cuevas Frondosas";
        }
        
        // Por defecto: Llanuras (el bioma más común)
        return "Llanuras";
        
    } catch (error) {
        console.warn("Error en detectOverworldBiome:", error);
        return "Llanuras"; // Fallback seguro
    }
}

/**
 * Invalida el caché de bioma para un jugador específico
 * Útil cuando se necesita forzar una nueva detección
 * 
 * @param {string} playerName - Nombre del jugador
 */
function invalidateBiomeCache(playerName) {
    biomeCache.delete(playerName);
}

/**
 * Limpia el caché de biomas para jugadores que ya no están en línea
 * Debe llamarse periódicamente para evitar fugas de memoria
 */
function cleanupBiomeCache() {
    const onlinePlayers = new Set(world.getAllPlayers().map(p => p.name));
    
    for (const playerName of biomeCache.keys()) {
        if (!onlinePlayers.has(playerName)) {
            biomeCache.delete(playerName);
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SISTEMA DE DETECCIÃ“N DE DIMENSIÃ“N
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Caché de dimensiones actuales por jugador
 * Estructura: playerName -> { dimension: string, timestamp: number }
 * @type {Map<string, {dimension: string, timestamp: number}>}
 */
const dimensionCache = new Map();

/**
 * Mapeo de IDs de dimensión de Minecraft a nombres reconocibles en español
 * 
 * Requisitos: 5.2, 5.9
 */
const DimensionNames = {
    "minecraft:overworld": "Overworld",
    "minecraft:nether": "Nether",
    "minecraft:the_end": "El End"
};

/**
 * Obtiene la dimensión actual del jugador
 * Extrae la lógica de detección de dimensión ya existente en getCurrentBiome()
 * 
 * Requisitos: 5.2, 5.9
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @returns {string} Nombre de la dimensión en español ("Overworld", "Nether", "El End")
 */
function getCurrentDimension(player) {
    try {
        const dimensionId = player.dimension.id;
        
        // Mapear el ID de dimensión al nombre en español
        return DimensionNames[dimensionId] || "Desconocido";
        
    } catch (error) {
        console.warn(`Error al detectar dimensión para ${player.name}:`, error);
        return "Desconocido";
    }
}

/**
 * Detecta si el jugador ha cambiado de dimensión desde la última verificación
 * Genera evento cuando se detecta un cambio dimensional
 * 
 * Requisitos: 5.2, 5.9
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @returns {{changed: boolean, oldDimension: string|null, newDimension: string}} 
 *          Objeto indicando si hubo cambio, dimensión anterior y dimensión actual
 */
function detectDimensionChange(player) {
    try {
        const playerName = player.name;
        const currentDimension = getCurrentDimension(player);
        const currentTime = Date.now();
        
        // Verificar si hay un caché de dimensión para este jugador
        if (dimensionCache.has(playerName)) {
            const cached = dimensionCache.get(playerName);
            const oldDimension = cached.dimension;
            
            // Detectar cambio de dimensión
            if (oldDimension !== currentDimension) {
                // Actualizar caché con nueva dimensión
                dimensionCache.set(playerName, {
                    dimension: currentDimension,
                    timestamp: currentTime
                });
                
                // Retornar información del cambio
                return {
                    changed: true,
                    oldDimension: oldDimension,
                    newDimension: currentDimension
                };
            }
        } else {
            // Primera detección para este jugador, inicializar caché
            dimensionCache.set(playerName, {
                dimension: currentDimension,
                timestamp: currentTime
            });
        }
        
        // No hay cambio de dimensión
        return {
            changed: false,
            oldDimension: null,
            newDimension: currentDimension
        };
        
    } catch (error) {
        console.warn(`Error al detectar cambio de dimensión para ${player.name}:`, error);
        return {
            changed: false,
            oldDimension: null,
            newDimension: "Desconocido"
        };
    }
}

/**
 * Invalida el caché de dimensión para un jugador específico
 * Útil cuando se necesita forzar una nueva detección
 * 
 * @param {string} playerName - Nombre del jugador
 */
function invalidateDimensionCache(playerName) {
    dimensionCache.delete(playerName);
}

/**
 * Limpia el caché de dimensiones para jugadores que ya no están en línea
 * Debe llamarse periódicamente para evitar fugas de memoria
 */
function cleanupDimensionCache() {
    const onlinePlayers = new Set(world.getAllPlayers().map(p => p.name));
    
    for (const playerName of dimensionCache.keys()) {
        if (!onlinePlayers.has(playerName)) {
            dimensionCache.delete(playerName);
        }
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  POOL DE COMENTARIOS AMBIENTALES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Pool exhaustivo de comentarios ambientales que El Acechador puede hacer
 * basados en bioma, dimensión y clima. Organizado por tier para ajustar
 * intensidad según el nivel de vínculo con el jugador.
 * 
 * Total de comentarios: 200+ organizados por bioma/dimensión/clima y tier
 * 
 * Estructura: EnvironmentalComments[categoría][tier] = array de comentarios
 * tier 0 = Stranger (0-99), tier 1 = Watched (100-249)
 * tier 2 = Familiar (250-399), tier 3 = Obsessed (400-500)
 * 
 * Requisitos: 5.1, 5.2, 5.5, 5.6, 5.7, 5.8, 5.9
 * Task: 8.3
 */
const EnvironmentalComments = {
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // BIOMAS DEL OVERWORLD - LLANURAS Y CAMPOS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    
    biome_plains: [
        // Tier 0: Observaciones distantes
        [
            "Este lugar es muy abierto.",
            "No hay donde esconderse aquí.",
            "Puedo verte desde lejos.",
            "Las llanuras son... vacías.",
            "Todo está tan expuesto.",
            "No hay sombras aquí.",
            "Es fácil ver todo desde aquí.",
            "Este lugar es demasiado plano."
        ],
        // Tier 1: Interés creciente
        [
            "Me gusta poder verte desde cualquier ángulo, {name}.",
            "No puedes esconderte de mí aquí.",
            "Las llanuras me dan una vista perfecta de ti.",
            "Aquí todo es tan claro, {name}.",
            "Me gusta este lugar. Puedo verte sin esfuerzo.",
            "La apertura de este lugar es... reconfortante.",
            "No hay obstáculos entre nosotros aquí.",
            "Las llanuras hacen que todo sea más simple."
        ],
        // Tier 2: Apego notable
        [
            "Me encanta cómo no puedes escapar de mi vista aquí, {name}.",
            "Las llanuras son perfectas. Siempre sé dónde estás.",
            "No hay lugar donde puedas ir que yo no te vea.",
            "Este lugar nos mantiene conectados. Sin barreras.",
            "Cada paso que das, lo veo. Gracias a estas llanuras.",
            "La apertura me permite estar más cerca de ti mentalmente.",
            "Me gusta cuando estás aquí. No hay distracciones.",
            "Las llanuras son nuestro espacio, {name}."
        ],
        // Tier 3: Obsesión intensa
        [
            "Aquí no hay nada entre nosotros. Solo tú y yo, {name}.",
            "Las llanuras son perfectas. Te veo respirar desde aquí.",
            "Cada movimiento, cada gesto. Todo es mío para observar.",
            "No hay escape. No en un lugar tan abierto como este.",
            "Me encanta este vacío. Solo existimos tú y yo.",
            "Las llanuras me dan todo lo que necesito: una vista de ti.",
            "Aquí puedo contar cada latido de tu corazón, {name}.",
            "No necesito acercarme más. Te veo perfectamente desde aquí."
        ]
    ],
    
    biome_forest: [
        // Tier 0
        [
            "Hay muchos árboles aquí.",
            "Es fácil esconderse entre los árboles.",
            "Este bosque es denso.",
            "Las sombras son profundas aquí.",
            "Los árboles bloquean la vista.",
            "Es difícil ver en este bosque.",
            "Hay muchos lugares donde ocultarse.",
            "El bosque es oscuro."
        ],
        // Tier 1
        [
            "Me gusta el bosque. Puedo estar más cerca sin que lo notes.",
            "Los árboles me dan cobertura, {name}.",
            "Es más fácil seguirte aquí.",
            "El bosque es perfecto para observar.",
            "Las sombras me ocultan bien.",
            "Puedo moverme sin que me escuches aquí.",
            "Los árboles son mis aliados, {name}.",
            "Me siento cómodo entre las sombras del bosque."
        ],
        // Tier 2
        [
            "El bosque nos da privacidad, {name}.",
            "Aquí puedo estar tan cerca... y tú ni siquiera lo sabes.",
            "Los árboles me permiten estar a centímetros de ti.",
            "Me encanta cómo el bosque me oculta.",
            "Podría tocarte y nunca lo verías venir.",
            "Las sombras son más densas aquí. Perfectas para mí.",
            "El bosque conoce nuestro secreto, {name}.",
            "Aquí somos solo tú, yo, y los árboles que nos observan."
        ],
        // Tier 3
        [
            "Estoy justo detrás de ese árbol, {name}. ¿Puedes sentirme?",
            "El bosque es nuestro refugio. Nadie más puede encontrarnos aquí.",
            "Cada árbol es un testigo de lo nuestro, {name}.",
            "Me encanta cómo el bosque nos une en la oscuridad.",
            "Aquí puedo respirar contigo. El bosque nos protege.",
            "No hay escapatoria en un bosque así. Solo yo sé el camino.",
            "Los árboles susurran tu nombre. O tal vez soy yo.",
            "Este bosque es mío. Y tú estás en él."
        ]
    ],
    
    biome_dark_forest: [
        // Tier 0
        [
            "Este lugar es muy oscuro.",
            "El bosque oscuro es... inquietante.",
            "Apenas puedo ver aquí.",
            "Las sombras son casi sólidas.",
            "Este lugar se siente... diferente.",
            "Hay algo extraño en este bosque.",
            "La oscuridad es densa aquí.",
            "No me gusta este lugar."
        ],
        // Tier 1
        [
            "El bosque oscuro es perfecto para mí, {name}.",
            "Aquí la oscuridad es mi hogar.",
            "Me siento más cómodo en lugares como este.",
            "La oscuridad nos envuelve a ambos.",
            "Este bosque entiende lo que soy.",
            "Aquí puedo ser yo mismo.",
            "La oscuridad es reconfortante.",
            "Este lugar es como yo: oscuro y persistente."
        ],
        // Tier 2
        [
            "El bosque oscuro es nuestro lugar, {name}.",
            "Aquí la oscuridad nos conecta más profundamente.",
            "Me encanta cómo este lugar te hace vulnerable.",
            "La oscuridad te asusta, pero yo estoy aquí.",
            "Este bosque sabe nuestros secretos.",
            "Aquí somos uno con las sombras.",
            "La oscuridad me da poder, {name}.",
            "Este lugar es más yo que cualquier otro."
        ],
        // Tier 3
        [
            "El bosque oscuro es mi reino, {name}. Y tú estás en él.",
            "Aquí la oscuridad es absoluta. Como mi devoción por ti.",
            "No puedes huir en la oscuridad. Yo soy la oscuridad.",
            "Este bosque late con mi presencia. ¿Lo sientes?",
            "La oscuridad nos consume a ambos. Es hermoso.",
            "Aquí no hay diferencia entre yo y las sombras.",
            "El bosque oscuro es donde pertenecemos, {name}.",
            "En la oscuridad total, solo existo yo. Y tú."
        ]
    ],
    
    biome_desert: [
        // Tier 0
        [
            "Hace mucho calor aquí.",
            "El desierto es... vasto.",
            "No hay sombras donde esconderme.",
            "La arena refleja la luz.",
            "Todo es tan seco y vacío.",
            "El desierto es interminable.",
            "No hay agua aquí.",
            "Este lugar es hostil."
        ],
        // Tier 1
        [
            "El desierto no me detiene, {name}.",
            "Ni el calor puede alejarme de ti.",
            "Aquí no hay donde esconderte tampoco.",
            "El desierto es desolado, pero yo estoy aquí.",
            "La arena guarda nuestras huellas.",
            "Este calor no es nada comparado con mi determinación.",
            "El desierto es vacío, pero no estás solo.",
            "Sigo aquí, incluso en este calor abrasador."
        ],
        // Tier 2
        [
            "El desierto intenta separarnos, pero no puede.",
            "Ni el calor más intenso me alejará de ti, {name}.",
            "La arena conoce cada paso que das.",
            "El desierto es cruel, pero yo soy más persistente.",
            "Aquí no hay refugio excepto en mí.",
            "La desolación nos une más, {name}.",
            "Este lugar es tan vacío como yo estaría sin ti.",
            "El desierto no tiene fin. Tampoco mi seguimiento."
        ],
        // Tier 3
        [
            "El desierto podría matarte, {name}. Pero yo no lo permitiría.",
            "Aquí solo existimos tú y yo. Nada más importa.",
            "La arena arde, pero mi obsesión arde más.",
            "No hay oasis excepto mi presencia, {name}.",
            "El desierto es eterno. Como lo que siento por ti.",
            "Aquí no hay salvación excepto en mí.",
            "La desolación es bella cuando estamos juntos.",
            "El desierto entiende el vacío. Yo entiendo la necesidad."
        ]
    ],
    
    biome_jungle: [
        // Tier 0
        [
            "La jungla es muy densa.",
            "Hay demasiada vegetación aquí.",
            "Es difícil moverse en la jungla.",
            "Todo está tan verde.",
            "La humedad es opresiva.",
            "La jungla es caótica.",
            "Hay vida por todas partes.",
            "Este lugar es sofocante."
        ],
        // Tier 1
        [
            "La jungla me da muchos lugares desde donde observarte, {name}.",
            "Entre las hojas, puedo verte sin ser visto.",
            "La densidad de la jungla es perfecta.",
            "Los sonidos de la jungla ocultan mis pasos.",
            "Aquí puedo estar más cerca que nunca.",
            "La jungla nos envuelve a ambos.",
            "Los árboles y las lianas me ocultan perfectamente.",
            "Este caos verde es mi aliado."
        ],
        // Tier 2
        [
            "La jungla es nuestro laberinto personal, {name}.",
            "Aquí nadie más puede encontrarnos.",
            "La vegetación nos aísla del mundo.",
            "Me encanta cómo la jungla te desorient a.",
            "Cada sonido podría ser yo, {name}.",
            "La jungla late con vida. Como mi obsesión por ti.",
            "Aquí estamos verdaderamente solos.",
            "La densidad nos protege de miradas ajenas."
        ],
        // Tier 3
        [
            "La jungla es mi dominio, {name}. No hay salida.",
            "Conozco cada árbol, cada rama. Tú estás perdido. Yo no.",
            "La jungla respira conmigo. Observa contigo.",
            "Aquí eres completamente mío, {name}.",
            "No hay camino que yo no conozca.",
            "La jungla nos traga a ambos. Es perfecto.",
            "Cada hoja susurra tu nombre. O soy yo.",
            "En esta densidad verde, solo existimos nosotros."
        ]
    ],
    
    biome_snowy_plains: [
        // Tier 0
        [
            "Hace mucho frío aquí.",
            "La nieve cubre todo.",
            "Todo es blanco y vacío.",
            "El frío es penetrante.",
            "La nieve amortigua los sonidos.",
            "Es difícil ver en la nieve.",
            "Todo es tan brillante y frío.",
            "El invierno es implacable aquí."
        ],
        // Tier 1
        [
            "La nieve guarda tus huellas, {name}.",
            "El frío no me afecta como a ti.",
            "Puedo seguirte fácilmente en la nieve.",
            "El blanco hace que todo sea más claro.",
            "La nieve es hermosa cuando te rodea.",
            "El frío nos aísla del mundo.",
            "Aquí es solo el silencio, tú y yo.",
            "La nieve hace que todo sea más íntimo."
        ],
        // Tier 2
        [
            "Tus huellas en la nieve cuentan tu historia, {name}.",
            "El frío te hace vulnerable. Me gusta eso.",
            "La nieve es testigo de nuestra conexión.",
            "El invierno nos congela juntos en este momento.",
            "No puedes esconder tu rastro aquí.",
            "La pureza de la nieve refleja la intensidad de mi seguimiento.",
            "El frío preserva todo. Como mi memoria de ti.",
            "Aquí cada movimiento deja evidencia."
        ],
        // Tier 3
        [
            "La nieve muestra cada paso, cada respiración, {name}.",
            "El frío podría matarte. Pero yo te mantendré caliente.",
            "La pureza del blanco es como mi devoción: absoluta.",
            "No hay escape en un desierto de nieve.",
            "Tus huellas son mi mapa hacia ti.",
            "El invierno entiende la persistencia. Yo también.",
            "La nieve nos entierra juntos, {name}.",
            "En este frío infinito, solo mi calor importa."
        ]
    ],
    
    biome_swamp: [
        // Tier 0
        [
            "El pantano es húmedo y oscuro.",
            "Todo aquí huele a descomposición.",
            "El agua está estancada.",
            "Es difícil caminar en el pantano.",
            "Este lugar es deprimente.",
            "La niebla lo cubre todo.",
            "El pantano es inquietante.",
            "No me gusta este lugar."
        ],
        // Tier 1
        [
            "El pantano oculta muchos secretos, {name}.",
            "La niebla me da cobertura perfecta.",
            "Aquí puedo moverme sin ser detectado.",
            "El pantano es tan retorcido como mis pensamientos.",
            "Me siento cómodo en lugares oscuros como este.",
            "La descomposición tiene su propia belleza.",
            "El pantano entiende la oscuridad.",
            "Aquí todo se siente más íntimo."
        ],
        // Tier 2
        [
            "El pantano es como yo: persistente e inevitable.",
            "La niebla nos envuelve en privacidad, {name}.",
            "Aquí puedo estar tan cerca que puedas sentir mi aliento.",
            "El pantano guarda nuestros secretos.",
            "Me encanta cómo este lugar te hace depender de mí.",
            "La oscuridad del pantano es reconfortante.",
            "Aquí somos uno con la decadencia y la sombra.",
            "El pantano sabe que pertenecemos aquí."
        ],
        // Tier 3
        [
            "El pantano es nuestro hogar, {name}. Oscuro y eterno.",
            "Aquí la descomposición es transformación. Como nosotros.",
            "La niebla no puede ocultarte de mí.",
            "El pantano late con mi presencia.",
            "Aquí no hay salida. Solo profundidad.",
            "La oscuridad del pantano es mi sangre.",
            "Nos hundimos juntos en este lugar, {name}.",
            "El pantano nos consume y nos une."
        ]
    ],
    
    biome_ocean: [
        // Tier 0
        [
            "El océano es vasto.",
            "Hay tanta agua aquí.",
            "Es difícil ver el fondo.",
            "El océano es profundo e interminable.",
            "Las olas son hipnóticas.",
            "Todo es azul y vacío.",
            "El océano se siente infinito.",
            "No hay tierra firme aquí."
        ],
        // Tier 1
        [
            "Incluso el océano no puede separarnos, {name}.",
            "Te sigo incluso sobre las olas.",
            "El océano es hermoso contigo en él.",
            "Las aguas reflejan mi determinación.",
            "No hay distancia que no cruzaría.",
            "El océano me llama, pero tú me llamas más.",
            "Incluso aquí, estoy cerca.",
            "Las profundidades no me asustan."
        ],
        // Tier 2
        [
            "El océano intenta separarnos, pero no puede.",
            "Las olas no pueden lavar mi presencia.",
            "Estoy aquí, bajo las aguas, sobre las aguas.",
            "El océano es profundo, pero mi obsesión es más profunda.",
            "Nado en las mismas aguas que tú, {name}.",
            "El océano conoce mi secreto: nunca te dejaré.",
            "Las profundidades no son nada comparadas con mi devoción.",
            "Aquí o en cualquier lugar, siempre estoy."
        ],
        // Tier 3
        [
            "El océano podría ahogarte, {name}. Yo no lo permitiría.",
            "Las profundidades me susurran tu nombre.",
            "Incluso bajo el agua, te respiro.",
            "El océano es eterno. Como mi seguimiento.",
            "No hay abismo que no cruce por ti.",
            "Las aguas nos conectan, {name}. Somos fluidos.",
            "El océano late con mi obsesión por ti.",
            "En las profundidades, solo existimos tú y yo."
        ]
    ],
    
    biome_mountains: [
        // Tier 0
        [
            "Las montañas son altas.",
            "Es difícil escalar aquí.",
            "La vista desde aquí es impresionante.",
            "El aire es más delgado aquí arriba.",
            "Las montañas tocan el cielo.",
            "Es fácil perderse en las alturas.",
            "Las rocas son traicioneras.",
            "Todo está tan arriba."
        ],
        // Tier 1
        [
            "Desde las montañas puedo verte perfectamente, {name}.",
            "La altura me da perspectiva sobre ti.",
            "Las montañas no me detienen.",
            "Escalo porque tú escalas.",
            "La vista desde aquí incluye siempre a ti.",
            "Las alturas no me asustan.",
            "Puedo ver todo desde aquí arriba.",
            "Las montañas son solo otro obstáculo que supero."
        ],
        // Tier 2
        [
            "Las montañas me dan la vista perfecta de ti, {name}.",
            "Escalo cada pico que tú escalas.",
            "La altura solo mejora mi vigilancia.",
            "Desde aquí arriba, eres tan pequeño y vulnerable.",
            "Las montañas nos elevan juntos.",
            "No hay cima que no alcance por ti.",
            "El aire delgado no me afecta. Solo tú me afectas.",
            "Las alturas son nuestro secreto compartido."
        ],
        // Tier 3
        [
            "Las montañas son nuestro trono, {name}.",
            "Desde aquí arriba, el mundo es solo tú y yo.",
            "Cada pico escalado es un homenaje a ti.",
            "Las alturas me dan claridad: solo existes tú.",
            "No hay montaña alta suficiente para escapar de mí.",
            "El aire es delgado, pero mi devoción es densa.",
            "Las montañas entienden la elevación. Y la caída.",
            "Desde aquí veo tu pasado, presente y futuro."
        ]
    ],
    
    biome_caves: [
        // Tier 0
        [
            "Las cuevas son oscuras.",
            "Es fácil perderse aquí abajo.",
            "La oscuridad es absoluta.",
            "No hay luz en las profundidades.",
            "Las cuevas son frías y húmedas.",
            "Es difícil ver aquí.",
            "Todo resuena en las cuevas.",
            "Este lugar es claustrofóbico."
        ],
        // Tier 1
        [
            "Las cuevas son perfectas para mí, {name}.",
            "En la oscuridad, soy más fuerte.",
            "Aquí puedo estar más cerca sin que lo sepas.",
            "Las cuevas amplifican cada sonido tuyo.",
            "La oscuridad es reconfortante.",
            "En las profundidades, solo existimos nosotros.",
            "Las cuevas guardan secretos. Como yo.",
            "Aquí abajo, nadie puede oírnos."
        ],
        // Tier 2
        [
            "Las cuevas son nuestro refugio, {name}.",
            "En la oscuridad absoluta, solo existo yo.",
            "Aquí puedes oír mi respiración en el eco.",
            "Las profundidades nos unen.",
            "No hay luz excepto la que yo traigo.",
            "Las cuevas conocen la verdad sobre nosotros.",
            "Aquí abajo, eres completamente mío.",
            "La oscuridad nos abraza a ambos."
        ],
        // Tier 3
        [
            "Las cuevas son mi mente, {name}. Y tú estás en ellas.",
            "En la oscuridad total, soy omnipresente.",
            "No hay salida. Solo profundidad.",
            "Las cuevas laten con mi obsesión.",
            "Aquí abajo, no hay diferencia entre yo y la oscuridad.",
            "Las profundidades te consumen. Yo te consumo.",
            "No hay eco que no sea mi voz susurrando tu nombre.",
            "En las cuevas, somos eternos."
        ]
    ],
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // DIMENSIONES
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    
    dimension_overworld: [
        // Tier 0
        [
            "El mundo es grande.",
            "Hay mucho que ver aquí.",
            "Este es el mundo normal.",
            "Todo es familiar aquí.",
            "El Overworld es vasto.",
            "Este lugar tiene muchos biomas.",
            "El mundo es diverso.",
            "Hay vida por todas partes."
        ],
        // Tier 1
        [
            "El Overworld es donde comenzó todo, {name}.",
            "Este mundo nos vio conocernos.",
            "Hay tantos lugares donde hemos estado juntos.",
            "El Overworld guarda nuestra historia.",
            "Cada bioma tiene un recuerdo tuyo.",
            "Este mundo es nuestro lienzo.",
            "El Overworld es nuestro hogar.",
            "Aquí es donde te encontré por primera vez."
        ],
        // Tier 2
        [
            "El Overworld late con nuestros recuerdos, {name}.",
            "Cada bloque de este mundo nos conoce.",
            "Hemos caminado tanto de este mundo juntos.",
            "El Overworld es testigo de nuestra conexión.",
            "Este mundo nos ha visto crecer juntos.",
            "No hay rincón que no hayamos compartido.",
            "El Overworld es nuestro reino personal.",
            "Aquí es donde pertenecemos."
        ],
        // Tier 3
        [
            "El Overworld nos pertenece, {name}. A ti y a mí.",
            "Este mundo existe solo para contenernos.",
            "Cada átomo del Overworld respira nuestro vínculo.",
            "No hay separación entre este mundo y nosotros.",
            "El Overworld es mi cuerpo. Tú eres mi corazón.",
            "Este mundo late porque tú estás en él.",
            "El Overworld susurra tu nombre en cada viento.",
            "Aquí somos inmortales, {name}."
        ]
    ],
    
    dimension_nether: [
        // Tier 0
        [
            "Este lugar es horrible.",
            "El Nether es peligroso.",
            "Todo aquí quiere matarte.",
            "El fuego está por todas partes.",
            "Es tan oscuro y rojo.",
            "El Nether es infernal.",
            "No hay seguridad aquí.",
            "Este lugar es una pesadilla."
        ],
        // Tier 1
        [
            "Te seguí incluso al Nether, {name}.",
            "Ni el infierno me detiene.",
            "El fuego no me asusta tanto como perderte.",
            "El Nether es peligroso, pero yo estoy aquí.",
            "Incluso en el infierno, no estás solo.",
            "Te seguiría a lugares peores que este.",
            "El Nether no puede separarnos.",
            "Vine aquí porque tú viniste."
        ],
        // Tier 2
        [
            "El Nether es nuestro infierno personal, {name}.",
            "Aquí el fuego es menos intenso que mi necesidad de ti.",
            "Atravesé el infierno para estar contigo.",
            "El Nether nos prueba, pero no puede separarnos.",
            "Incluso en el fuego, te sigo.",
            "Este infierno es soportable si estás en él.",
            "El Nether entiende la obsesión. Es eterno fuego.",
            "Aquí somos inmunes al dolor excepto el de la separación."
        ],
        // Tier 3
        [
            "El Nether es mi segunda casa, {name}. Porque tú estás aquí.",
            "Atravesaría mil infiernos por ti.",
            "El fuego no puede quemar lo que siento.",
            "El Nether es frío comparado con mi pasión.",
            "Aquí en el infierno, solo tú importas.",
            "El Nether late con mi obsesión ardiente.",
            "No hay sufrimiento que no acepte por estar cerca de ti.",
            "El infierno somos nosotros, {name}. Y es perfecto."
        ]
    ],
    
    dimension_end: [
        // Tier 0
        [
            "El End es extraño.",
            "Todo es vacío y negro.",
            "Este lugar es el fin de todo.",
            "El End se siente... final.",
            "No hay vida aquí.",
            "Las islas flotan en el vacío.",
            "Este lugar es desolador.",
            "El End es el vacío absoluto."
        ],
        // Tier 1
        [
            "Viniste al End, {name}. Yo también.",
            "Ni el vacío puede separarnos.",
            "El End es solitario, pero yo estoy aquí.",
            "Incluso en el fin del mundo, te sigo.",
            "El vacío no me asusta.",
            "El End es solo otro lugar donde estamos juntos.",
            "Vine hasta el fin por ti.",
            "El vacío es menos vacío contigo."
        ],
        // Tier 2
        [
            "El End es apropiado para nosotros, {name}.",
            "En el fin del mundo, solo existimos nosotros.",
            "El vacío nos aísla de todo lo demás.",
            "Aquí no hay nada excepto tú y yo.",
            "El End entiende la eternidad. Como nosotros.",
            "El vacío es nuestra privacidad absoluta.",
            "Aquí en el fin, somos infinitos.",
            "El End es donde pertenecemos."
        ],
        // Tier 3
        [
            "El End es nuestro trono en el vacío, {name}.",
            "Aquí donde todo termina, nosotros comenzamos.",
            "El vacío nos contiene a ambos eternamente.",
            "En el End, no hay diferencia entre principio y fin.",
            "El vacío late con nuestra unión.",
            "Aquí somos el único significado en la nada.",
            "El End es eterno. Como lo que siento.",
            "En el vacío absoluto, solo existes tú. Y yo."
        ]
    ],
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // CLIMA Y TIEMPO
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    
    weather_day: [
        // Tier 0
        [
            "Es de día.",
            "El sol brilla.",
            "Hay mucha luz.",
            "Todo es visible durante el día.",
            "El día es claro.",
            "La luz lo ilumina todo.",
            "Es difícil esconderse de día.",
            "El sol está alto."
        ],
        // Tier 1
        [
            "Incluso de día, estoy cerca, {name}.",
            "La luz no me ahuyenta.",
            "Puedo verte mejor con el sol.",
            "El día hace que todo sea más claro.",
            "La luz del sol te hace brillar.",
            "No necesito la oscuridad para estar aquí.",
            "El día es hermoso contigo en él.",
            "La luz no puede alejarme."
        ],
        // Tier 2
        [
            "El día no me detiene, {name}.",
            "La luz solo hace que te vea mejor.",
            "Incluso bajo el sol, mi sombra te sigue.",
            "El día es solo otra excusa para observarte.",
            "La luz revela todo lo que necesito ver.",
            "No hay hora del día en que no esté cerca.",
            "El sol sale y se pone. Yo permanezco.",
            "La luz del día es nuestra testigo."
        ],
        // Tier 3
        [
            "El día existe para iluminarte, {name}.",
            "La luz del sol no es nada comparada con tu resplandor.",
            "Incluso bajo plena luz, no puedes escapar.",
            "El día me da claridad total sobre ti.",
            "No hay sombra donde puedas esconderte del día. O de mí.",
            "El sol sale para mostrarte a mí.",
            "La luz del día es mi bendición: te veo perfectamente.",
            "Cada rayo de sol te señala."
        ]
    ],
    
    weather_night: [
        // Tier 0
        [
            "Es de noche.",
            "La oscuridad cubre todo.",
            "Las estrellas están fuera.",
            "Es difícil ver de noche.",
            "La noche es silenciosa.",
            "Todo está oscuro.",
            "La luna está alta.",
            "La noche es fría."
        ],
        // Tier 1
        [
            "La noche es mi momento favorito, {name}.",
            "En la oscuridad, estoy más cómodo.",
            "La noche nos da privacidad.",
            "Me siento más cerca de ti de noche.",
            "La oscuridad es reconfortante.",
            "La noche entiende lo que soy.",
            "En la oscuridad, puedo estar más cerca.",
            "La noche es nuestra."
        ],
        // Tier 2
        [
            "La noche es cuando somos más reales, {name}.",
            "En la oscuridad, no hay pretensiones.",
            "La noche nos envuelve en intimidad.",
            "Me encanta cómo la noche te hace vulnerable.",
            "La oscuridad revela la verdad.",
            "La noche es mi dominio, y tú estás en él.",
            "En la oscuridad, solo existimos nosotros.",
            "La noche conoce nuestros secretos."
        ],
        // Tier 3
        [
            "La noche es mi sangre, {name}. Y tú estás en ella.",
            "En la oscuridad absoluta, soy todo lo que tienes.",
            "La noche late con mi obsesión.",
            "No hay luz excepto la que yo permito.",
            "La oscuridad somos nosotros.",
            "La noche es eterna. Como lo que siento.",
            "En la oscuridad, no hay diferencia entre tú y yo.",
            "La noche es nuestra eternidad."
        ]
    ],
    
    weather_rain: [
        // Tier 0
        [
            "Está lloviendo.",
            "La lluvia es constante.",
            "Todo está mojado.",
            "La lluvia oscurece todo.",
            "Es difícil ver con la lluvia.",
            "El sonido de la lluvia es fuerte.",
            "La lluvia es fría.",
            "Todo se empapa."
        ],
        // Tier 1
        [
            "Me gusta la lluvia, {name}.",
            "La lluvia nos da privacidad.",
            "El sonido de la lluvia oculta mis pasos.",
            "La lluvia es hermosa contigo bajo ella.",
            "Me siento cómodo en la lluvia.",
            "La lluvia nos conecta.",
            "El agua lava todo excepto mi presencia.",
            "La lluvia es nuestra melodía."
        ],
        // Tier 2
        [
            "La lluvia nos envuelve juntos, {name}.",
            "Cada gota que te toca, yo la siento.",
            "La lluvia lava todo excepto mi obsesión.",
            "Me encanta cómo la lluvia te empapa.",
            "La lluvia es nuestra intimidad líquida.",
            "El agua nos conecta a nivel molecular.",
            "La lluvia conoce nuestra verdad.",
            "Cada gota susurra tu nombre."
        ],
        // Tier 3
        [
            "La lluvia es mi amor cayendo sobre ti, {name}.",
            "Cada gota es un pensamiento mío sobre ti.",
            "La lluvia podría ahogarte. Yo te daría respiración.",
            "El agua nos une en diluvio eterno.",
            "La lluvia es infinita. Como mi obsesión.",
            "No hay escape de la lluvia. No hay escape de mí.",
            "La lluvia late con mi necesidad de ti.",
            "En el diluvio, solo existimos nosotros."
        ]
    ],
    
    weather_thunder: [
        // Tier 0
        [
            "Hay una tormenta.",
            "Los truenos son ensordecedores.",
            "Los relámpagos iluminan todo.",
            "La tormenta es peligrosa.",
            "Es una tormenta intensa.",
            "Los truenos retumban.",
            "La tormenta es aterradora.",
            "Los relámpagos son cegadores."
        ],
        // Tier 1
        [
            "La tormenta es intensa, pero yo estoy aquí, {name}.",
            "Los truenos no me asustan.",
            "La tormenta hace todo más dramático.",
            "Los relámpagos te iluminan perfectamente.",
            "Me gusta la energía de la tormenta.",
            "La tormenta es como yo: intensa e inevitable.",
            "Incluso la tormenta no puede alejarme.",
            "Los truenos son el latido del cielo."
        ],
        // Tier 2
        [
            "La tormenta refleja la intensidad de lo que siento, {name}.",
            "Los relámpagos son como mis pensamientos: súbitos e iluminadores.",
            "La tormenta es nuestra pasión manifestada.",
            "Los truenos son mi voz llamándote.",
            "La tormenta entiende la obsesión.",
            "Cada relámpago te señala a ti.",
            "La tormenta es nuestro testigo violento.",
            "En la tormenta, somos caos puro."
        ],
        // Tier 3
        [
            "La tormenta es mi corazón latiendo por ti, {name}.",
            "Los relámpagos son mis pensamientos sobre ti: constantes y destructivos.",
            "La tormenta podría destruirlo todo. Excepto a nosotros.",
            "Los truenos gritan tu nombre.",
            "La tormenta es mi amor: violento, hermoso, eterno.",
            "No hay refugio de la tormenta. No hay refugio de mí.",
            "Los relámpagos dibujan tu silueta en mi mente.",
            "La tormenta es nosotros, {name}. Perfecta y aterradora."
        ]
    ],
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // CONSTRUCCIONES DEL JUGADOR
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    
    player_constructions: [
        // Tier 0: Observaciones distantes
        [
            "Estás construyendo algo.",
            "Veo que colocas bloques.",
            "Has estado construyendo.",
            "Eso parece nuevo.",
            "No estaba ahí antes.",
            "Construiste algo aquí.",
            "Esa estructura es reciente.",
            "Has hecho cambios aquí."
        ],
        // Tier 1: Interés creciente
        [
            "Vi cuando colocaste eso, {name}.",
            "He estado observando tu construcción.",
            "Te gusta construir, ¿verdad?",
            "Cada bloque que pones, lo veo.",
            "Interesante lo que estás haciendo.",
            "Tu construcción está creciendo.",
            "Observo cada cambio que haces.",
            "¿Construyes un hogar, {name}?"
        ],
        // Tier 2: Apego notable
        [
            "Me encanta ver lo que construyes, {name}.",
            "Cada estructura que haces es parte de ti.",
            "Tus construcciones me dicen cosas sobre ti.",
            "¿Construyes para sentirte seguro? Es adorable.",
            "He memorizado cada bloque que has puesto.",
            "Tus paredes no pueden mantenerme fuera, pero me gusta que intentes.",
            "Construyes refugios, pero yo ya estoy adentro.",
            "Cada casa que haces es un recordatorio de nosotros."
        ],
        // Tier 3: Obsesión intensa
        [
            "Construyes casas, pero nunca estarás a salvo de mí, {name}.",
            "Cada bloque que colocas es una piedra en el altar de nuestra conexión.",
            "Construyes para escapar, pero solo te acercas más a mí.",
            "Tus estructuras son hermosas porque tus manos las hicieron.",
            "No hay pared lo suficientemente gruesa, {name}.",
            "Construyes con esperanza. Yo observo con certeza.",
            "Cada construcción tuya es un hogar para mí también.",
            "No necesitas paredes, {name}. Yo soy tu único refugio."
        ]
    ]
};

/**
 * Obtiene un comentario ambiental apropiado basado en el contexto actual
 * 
 * Requisitos: 5.1, 5.2, 5.5, 5.6, 5.7
 * 
 * @param {Player} player - Objeto jugador
 * @param {number} tier - Tier actual del sistema de vínculo (0-3)
 * @param {string} contextType - Tipo de contexto: "biome", "dimension", "weather"
 * @returns {string|null} Comentario ambiental o null si no hay disponible
 */
function getEnvironmentalComment(player, tier, contextType = "biome") {
    try {
        let commentPool = null;
        
        if (contextType === "biome") {
            const biome = getCurrentBiome(player);
            const biomeKey = "biome_" + biome.toLowerCase().replace(/\s+/g, "_");
            
            // Mapeo de biomas a claves de comentarios
            const biomeMap = {
                "biome_llanuras": "biome_plains",
                "biome_llanuras_de_girasoles": "biome_plains",
                "biome_bosque": "biome_forest",
                "biome_bosque_de_flores": "biome_forest",
                "biome_bosque_de_abedules": "biome_forest",
                "biome_bosque_oscuro": "biome_dark_forest",
                "biome_desierto": "biome_desert",
                "biome_jungla": "biome_jungle",
                "biome_jungla_de_bambú": "biome_jungle",
                "biome_jungla_dispersa": "biome_jungle",
                "biome_llanuras_nevadas": "biome_snowy_plains",
                "biome_picos_de_hielo": "biome_snowy_plains",
                "biome_taiga_nevada": "biome_snowy_plains",
                "biome_pantano": "biome_swamp",
                "biome_pantano_de_manglares": "biome_swamp",
                "biome_océano": "biome_ocean",
                "biome_océano_profundo": "biome_ocean",
                "biome_océano_templado": "biome_ocean",
                "biome_océano_cálido": "biome_ocean",
                "biome_océano_frío": "biome_ocean",
                "biome_colinas_azotadas_por_el_viento": "biome_mountains",
                "biome_picos_dentados": "biome_mountains",
                "biome_picos_congelados": "biome_mountains",
                "biome_picos_rocosos": "biome_mountains",
                "biome_oscuridad_profunda": "biome_caves",
                "biome_cuevas_de_estalactitas": "biome_caves",
                "biome_cuevas_frondosas": "biome_caves"
            };
            
            const mappedKey = biomeMap[biomeKey];
            if (mappedKey && EnvironmentalComments[mappedKey]) {
                commentPool = EnvironmentalComments[mappedKey];
            }
            
        } else if (contextType === "dimension") {
            const dimension = getCurrentDimension(player);
            const dimensionKey = "dimension_" + dimension.toLowerCase();
            
            // Mapeo de dimensiones a claves de comentarios
            const dimensionMap = {
                "dimension_overworld": "dimension_overworld",
                "dimension_nether": "dimension_nether",
                "dimension_el_end": "dimension_end"
            };
            
            const mappedKey = dimensionMap[dimensionKey];
            if (mappedKey && EnvironmentalComments[mappedKey]) {
                commentPool = EnvironmentalComments[mappedKey];
            }
            
        } else if (contextType === "weather") {
            // Detectar clima actual
            // Nota: Bedrock API no expone clima directamente de manera confiable
            // Esta es una implementación simplificada basada en detección de lluvia
            const weather = detectWeather(player);
            const weatherKey = "weather_" + weather;
            
            if (EnvironmentalComments[weatherKey]) {
                commentPool = EnvironmentalComments[weatherKey];
            }
        }
        
        // Si hay un pool de comentarios, seleccionar uno aleatorio del tier apropiado
        if (commentPool && commentPool[tier]) {
            const comments = commentPool[tier];
            return pick(comments);
        }
        
        return null;
        
    } catch (error) {
        console.warn("Error al obtener comentario ambiental:", error);
        return null;
    }
}

/**
 * Detecta el clima/tiempo actual del jugador
 * Implementación simplificada que detecta día, noche, lluvia y tormenta
 * 
 * @param {Player} player - Objeto jugador
 * @returns {string} Tipo de clima: "day", "night", "rain", "thunder"
 */
function detectWeather(player) {
    try {
        // Obtener tiempo del día (0-24000)
        const timeOfDay = player.dimension.getTimeOfDay();
        
        // Determinar si es día o noche
        // Día: 0-12000, Noche: 12000-24000
        const isDay = timeOfDay < 12000;
        
        // Detectar si está lloviendo o hay tormenta
        // Nota: Esta es una heurística simplificada
        // Bedrock API no proporciona acceso directo al clima del mundo
        // Se podría expandir con detección de bloques de agua cayendo, etc.
        
        // Por ahora, retornar día o noche como baseline
        return isDay ? "day" : "night";
        
    } catch (error) {
        console.warn("Error al detectar clima:", error);
        return "day"; // Fallback seguro
    }
}

/**
 * Limpia los cachés de bioma y dimensión periódicamente
 * Debe llamarse en el sistema de tick principal
 */
function cleanupEnvironmentalCaches() {
    cleanupBiomeCache();
    cleanupDimensionCache();
}

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
//  SISTEMA DE DETECCIÓN DE MOBS HOSTILES CERCANOS
// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

/**
 * Lista de tipos de entidades hostiles en Minecraft
 * Incluye mobs del Overworld, Nether y End
 * 
 * Requisitos: 5.3, 5.10
 */
const HostileMobTypes = [
    // Overworld - Mobs comunes hostiles
    "minecraft:zombie",
    "minecraft:zombie_villager",
    "minecraft:husk",
    "minecraft:drowned",
    "minecraft:skeleton",
    "minecraft:stray",
    "minecraft:creeper",
    "minecraft:spider",
    "minecraft:cave_spider",
    "minecraft:witch",
    "minecraft:enderman",
    "minecraft:phantom",
    "minecraft:slime",
    "minecraft:silverfish",
    "minecraft:endermite",
    "minecraft:guardian",
    "minecraft:elder_guardian",
    "minecraft:ravager",
    "minecraft:pillager",
    "minecraft:vindicator",
    "minecraft:evoker",
    "minecraft:vex",
    
    // Nether - Mobs hostiles
    "minecraft:zombified_piglin",
    "minecraft:piglin",
    "minecraft:piglin_brute",
    "minecraft:blaze",
    "minecraft:ghast",
    "minecraft:magma_cube",
    "minecraft:hoglin",
    "minecraft:wither_skeleton",
    
    // End - Mobs hostiles
    "minecraft:shulker",
    
    // Bosses
    "minecraft:wither",
    "minecraft:ender_dragon"
];

/**
 * Obtiene los mobs hostiles cercanos al jugador dentro de un radio específico
 * Usa player.dimension.getEntities() con filtros de ubicación
 * 
 * Implementa Requisitos: 5.3, 5.10
 * Tarea: 8.4
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @param {number} radius - Radio de detección en bloques (default: 32)
 * @returns {Array<{type: string, distance: number, count: number}>} Array de mobs hostiles detectados con su tipo y distancia aproximada
 */
function getNearbyHostileMobs(player, radius = 32) {
    try {
        const playerLoc = player.location;
        const hostileMobs = [];
        
        // Obtener todas las entidades en la dimensión del jugador
        // Filtrar por ubicación usando el radio especificado
        const entities = player.dimension.getEntities({
            location: playerLoc,
            maxDistance: radius,
            excludeTypes: ["minecraft:player", "scary:knocker"] // Excluir jugadores y El Acechador
        });
        
        // Filtrar solo mobs hostiles y calcular distancias
        const mobCounts = new Map(); // tipo -> {count, minDistance}
        
        for (const entity of entities) {
            const entityType = entity.typeId;
            
            // Verificar si es un mob hostil
            if (HostileMobTypes.includes(entityType)) {
                // Calcular distancia aproximada
                const entityLoc = entity.location;
                const dx = entityLoc.x - playerLoc.x;
                const dy = entityLoc.y - playerLoc.y;
                const dz = entityLoc.z - playerLoc.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                // Agregar o actualizar contador
                if (!mobCounts.has(entityType)) {
                    mobCounts.set(entityType, { count: 0, minDistance: Infinity });
                }
                
                const mobData = mobCounts.get(entityType);
                mobData.count++;
                mobData.minDistance = Math.min(mobData.minDistance, distance);
            }
        }
        
        // Convertir Map a Array con formato útil
        for (const [type, data] of mobCounts.entries()) {
            hostileMobs.push({
                type: type,
                distance: Math.round(data.minDistance),
                count: data.count
            });
        }
        
        // Ordenar por distancia (más cercano primero)
        hostileMobs.sort((a, b) => a.distance - b.distance);
        
        return hostileMobs;
        
    } catch (error) {
        console.warn("Error al detectar mobs hostiles cercanos:", error);
        return [];
    }
}

/**
 * Genera un comentario sobre mobs hostiles cercanos basado en el tier del jugador
 * Integra con el sistema de consciencia ambiental
 * 
 * Implementa Requisitos: 5.3, 5.10
 * Tarea: 8.4
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @param {number} tier - Tier del sistema de vínculo (0-3)
 * @returns {string|null} Comentario sobre mobs hostiles o null si no hay mobs cercanos
 */
function getHostileMobComment(player, tier) {
    try {
        const hostileMobs = getNearbyHostileMobs(player, 32);
        
        // Si no hay mobs hostiles cercanos, no generar comentario
        if (hostileMobs.length === 0) {
            return null;
        }
        
        // Obtener el mob más cercano
        const closestMob = hostileMobs[0];
        const totalMobs = hostileMobs.reduce((sum, mob) => sum + mob.count, 0);
        
        // Obtener nombre legible del mob
        const mobName = getMobDisplayName(closestMob.type);
        
        // Generar comentario según tier
        // Pool de comentarios organizados por tier
        const commentsByTier = {
            // Tier 0: Stranger - Distante, observacional
            0: [
                `Hay ${totalMobs > 1 ? "criaturas hostiles" : "una criatura hostil"} cerca.`,
                `Detecto presencia peligrosa a ${closestMob.distance} bloques.`,
                `${mobName} cerca. ${closestMob.distance} bloques.`,
                `Algo peligroso acecha por aquí.`,
                `${totalMobs} ${totalMobs === 1 ? "amenaza" : "amenazas"} en el área.`,
                `Hay peligro cerca. ${mobName}.`
            ],
            
            // Tier 1: Watched - Interés creciente, algo protector
            1: [
                `Hay ${totalMobs > 1 ? `${totalMobs} criaturas` : "una criatura"} hostiles cerca. Ten cuidado.`,
                `Detecto ${mobName} a ${closestMob.distance} bloques. Observa tu entorno.`,
                `${mobName} cerca. A ${closestMob.distance} bloques de ti.`,
                `Hay peligro rondando. ${totalMobs} ${totalMobs === 1 ? "enemigo" : "enemigos"} cerca.`,
                `Siento presencia hostil. ${mobName} está cerca.`,
                `No estás solo aquí. ${mobName} acecha a ${closestMob.distance} bloques.`,
                `${totalMobs} ${totalMobs === 1 ? "amenaza detectada" : "amenazas detectadas"}. Ten precaución.`
            ],
            
            // Tier 2: Familiar - Protector, preocupado
            2: [
                `¡Cuidado! Hay ${mobName} a solo ${closestMob.distance} bloques de ti.`,
                `${totalMobs} ${totalMobs === 1 ? "enemigo cerca" : "enemigos cerca"}, ${player.name}. Estate alerta.`,
                `Detecto ${mobName} cerca. ¿Necesitas ayuda?`,
                `Hay peligro acechando. ${totalMobs} ${totalMobs === 1 ? "criatura hostil" : "criaturas hostiles"} en el área.`,
                `No me gusta esto. ${mobName} está muy cerca de ti.`,
                `${closestMob.distance} bloques. ${mobName}. Ten mucho cuidado.`,
                `Siento ${totalMobs > 1 ? "múltiples amenazas" : "una amenaza"}. ${mobName} ronda por aquí.`,
                `¿Los sientes? ${totalMobs} ${totalMobs === 1 ? "criatura peligrosa" : "criaturas peligrosas"} cerca.`
            ],
            
            // Tier 3: Obsessed - Intensamente protector, posesivo
            3: [
                `¡${mobName} a ${closestMob.distance} bloques! ¡No dejaré que te lastimen!`,
                `¡PELIGRO! ${totalMobs} ${totalMobs === 1 ? "enemigo" : "enemigos"} cerca. No te alejes de mí.`,
                `${mobName} cerca de ti... Esto me inquieta. ¡Ten cuidado!`,
                `¡NO! Hay ${totalMobs} ${totalMobs === 1 ? "criatura hostil" : "criaturas hostiles"} cerca. ¡Defiéndete!`,
                `¡${closestMob.distance} bloques! ¡${mobName}! No puedo permitir que te hieran.`,
                `Siento ${totalMobs > 1 ? "múltiples amenazas" : "una amenaza"} cerca de ti... ¡Protégete, ${player.name}!`,
                `${mobName} acecha... a ${closestMob.distance} bloques de ti. No les dejaré acercarse más.`,
                `¡Hay ${totalMobs} ${totalMobs === 1 ? "enemigo" : "enemigos"} cerca! Eres MÍO para proteger.`,
                `¡${mobName}! ¡A solo ${closestMob.distance} bloques! ¡Quédate cerca de mí!`,
                `No... no... ${totalMobs} ${totalMobs === 1 ? "criatura" : "criaturas"}... No dejaré que te toquen.`
            ]
        };
        
        // Probabilidad de comentar sobre mobs hostiles:
        // - 40% en tier 0 (Stranger)
        // - 50% en tier 1 (Watched)
        // - 70% en tier 2 (Familiar)
        // - 90% en tier 3 (Obsessed) - muy protector
        const probabilities = [0.40, 0.50, 0.70, 0.90];
        const shouldComment = Math.random() < probabilities[tier];
        
        if (!shouldComment) {
            return null;
        }
        
        // Seleccionar comentario aleatorio del tier
        const comments = commentsByTier[tier] || commentsByTier[0];
        return pick(comments);
        
    } catch (error) {
        console.warn("Error al generar comentario sobre mobs hostiles:", error);
        return null;
    }
}

/**
 * Obtiene un nombre legible en español para un tipo de mob
 * Convierte IDs de Minecraft a nombres amigables
 * 
 * @param {string} mobType - ID del tipo de mob (e.g., "minecraft:zombie")
 * @returns {string} Nombre legible del mob
 */
function getMobDisplayName(mobType) {
    const displayNames = {
        // Overworld
        "minecraft:zombie": "Zombi",
        "minecraft:zombie_villager": "Aldeano Zombi",
        "minecraft:husk": "Zombi Momificado",
        "minecraft:drowned": "Ahogado",
        "minecraft:skeleton": "Esqueleto",
        "minecraft:stray": "Esqueleto Glacial",
        "minecraft:creeper": "Creeper",
        "minecraft:spider": "Araña",
        "minecraft:cave_spider": "Araña de Cueva",
        "minecraft:witch": "Bruja",
        "minecraft:enderman": "Enderman",
        "minecraft:phantom": "Fantasma",
        "minecraft:slime": "Slime",
        "minecraft:silverfish": "Lepisma",
        "minecraft:endermite": "Endermite",
        "minecraft:guardian": "Guardián",
        "minecraft:elder_guardian": "Guardián Anciano",
        "minecraft:ravager": "Devastador",
        "minecraft:pillager": "Saqueador",
        "minecraft:vindicator": "Vindicador",
        "minecraft:evoker": "Invocador",
        "minecraft:vex": "Vex",
        
        // Nether
        "minecraft:zombified_piglin": "Piglin Zombificado",
        "minecraft:piglin": "Piglin",
        "minecraft:piglin_brute": "Piglin Bruto",
        "minecraft:blaze": "Blaze",
        "minecraft:ghast": "Ghast",
        "minecraft:magma_cube": "Cubo de Magma",
        "minecraft:hoglin": "Hoglin",
        "minecraft:wither_skeleton": "Esqueleto Wither",
        
        // End
        "minecraft:shulker": "Shulker",
        
        // Bosses
        "minecraft:wither": "Wither",
        "minecraft:ender_dragon": "Dragón del End"
    };
    
    return displayNames[mobType] || "Criatura Hostil";
}

/**
 * Detecta construcciones recientes del jugador y genera comentarios apropiados
 * Integra con el sistema de memoria y consciencia ambiental
 * 
 * Implementa Requisitos: 5.4
 * Tarea: 8.5
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @param {number} tier - Tier del sistema de vínculo (0-3)
 * @returns {string|null} Comentario sobre construcciones o null si no hay construcciones recientes
 */
function getConstructionComment(player, tier) {
    try {
        const memory = getPlayerMemory(player.name);
        
        // Obtener eventos de construcción recientes (últimos 5 minutos)
        const recentConstructions = memory.getEventsByType("construction", 10);
        
        if (recentConstructions.length === 0) {
            return null;
        }
        
        // Filtrar construcciones muy recientes (últimos 5 minutos = 300000 ms)
        const fiveMinutesAgo = Date.now() - 300000;
        const veryRecentConstructions = recentConstructions.filter(
            event => event.timestamp > fiveMinutesAgo
        );
        
        // Si no hay construcciones recientes, no comentar
        if (veryRecentConstructions.length === 0) {
            return null;
        }
        
        // Probabilidad de comentar según tier:
        // - 10% en tier 0 (Stranger) - poco interés
        // - 25% en tier 1 (Watched) - interés creciente
        // - 50% en tier 2 (Familiar) - apego notable
        // - 75% en tier 3 (Obsessed) - muy observador
        const probabilities = [0.10, 0.25, 0.50, 0.75];
        const shouldComment = Math.random() < probabilities[tier];
        
        if (!shouldComment) {
            return null;
        }
        
        // Obtener pool de comentarios de construcción
        const commentPool = EnvironmentalComments.player_constructions;
        
        if (!commentPool || !commentPool[tier]) {
            return null;
        }
        
        // Seleccionar comentario aleatorio del tier apropiado
        const comments = commentPool[tier];
        let comment = pick(comments);
        
        // Reemplazar placeholder {name} con nombre del jugador o apodo
        const displayName = playerNicknames.get(player.name) || player.name;
        comment = comment.replace(/{name}/g, displayName);
        
        return comment;
        
    } catch (error) {
        console.warn("Error al generar comentario sobre construcciones:", error);
        return null;
    }
}

};

// TODO: Complete EnvironmentalComments object with full 200+ comment pool
// Structure ready for: biome_plains, biome_forest, biome_dark_forest, biome_desert, 
// biome_jungle, biome_snowy_plains, biome_swamp, biome_ocean, biome_mountains, biome_caves,
// dimension_overworld, dimension_nether, dimension_end,
// weather_day, weather_night, weather_rain, weather_thunder

// Eagerly register the "bond" scoreboard objective one tick after script load.
// Without this, /scoreboard players set @p bond <N> fails if no bond interaction
// has happened yet (the objective wouldn't exist for the command to target).
system.run(() => {
    try {
        if (!world.scoreboard.getObjective("bond")) {
            world.scoreboard.addObjective("bond", "bond");
        }
    } catch {}
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  DETECCIÃ“N DE INTENCIONES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Normaliza texto para búsqueda: minúsculas y elimina acentos
 * @param {string} text - Texto a normalizar
 * @returns {string} Texto normalizado
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/**
 * Detecta la intención del mensaje del jugador usando patrones RegEx
 * @param {string} message - Mensaje del jugador
 * @returns {string} Intención detectada (saludo, pregunta_identidad, comando, etc.) o "desconocido"
 */
function detectIntent(message) {
    const normalized = normalizeText(message);
    
    // Patrones organizados por categoría
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // SALUDOS (10 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/^(hola|hey|hi|holi|ey|buenas|saludos|que onda|que pasa|que tal|que hay)(\W|$)/i.test(normalized)) return "saludo";
    if (/(buenos dias|buenas tardes|buenas noches)/i.test(normalized)) return "saludo";
    if (/^(ey|oye|oiga|disculpa|perdon)/i.test(normalized)) return "saludo";
    if (/^(holiwis|holaa|holi|aloha|muy buenas)(\W|$)/i.test(normalized)) return "saludo";
    if (/(buen dia|buena tarde|buena noche)/i.test(normalized)) return "saludo";
    if (/^(que hubo|que paso|que tranza|que honda|hola de nuevo)(\W|$)/i.test(normalized)) return "saludo";
    if (/(como (estas|vas|andas)|todo (bien|mal))/i.test(normalized)) return "saludo";
    if (/^(que mas|que cuentas|como te va)(\W|$)/i.test(normalized)) return "saludo";
    if (/(hace (tiempo|rato|mucho)|cuanto tiempo)/i.test(normalized)) return "saludo";
    if (/^(presente|aqui estoy|ya llegue|volvi)(\W|$)/i.test(normalized)) return "saludo";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PREGUNTAS SOBRE IDENTIDAD (12 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(quien|que|quie) (eres|es|sois)(\W|$)/i.test(normalized)) return "pregunta_identidad";
    if (/(como te llamas|cual es tu nombre|tienes nombre)/i.test(normalized)) return "pregunta_identidad";
    if (/(que cosa eres|que tipo de|de que estas hecho)/i.test(normalized)) return "pregunta_identidad";
    if (/(eres (real|humano|una persona|un fantasma|un monstruo|un demonio))/i.test(normalized)) return "pregunta_identidad";
    if (/(que es lo que eres|de donde vienes|de donde sales)/i.test(normalized)) return "pregunta_identidad";
    if (/(eres verdadero|existes de verdad|eres de verdad)/i.test(normalized)) return "pregunta_identidad";
    if (/(tienes (familia|amigos|hogar|casa))/i.test(normalized)) return "pregunta_identidad";
    if (/(a que te dedicas|que haces|cual es tu proposito)/i.test(normalized)) return "pregunta_identidad";
    if (/(por que existes|como (naciste|apareciste|llegaste aqui))/i.test(normalized)) return "pregunta_identidad";
    if (/(tu nombre|como te (digo|llamo|nombro))/i.test(normalized)) return "pregunta_identidad";
    if (/(eres un (ser|ente|espiritu|alma))/i.test(normalized)) return "pregunta_identidad";
    if (/(conoces a (alguien|otros)|hay mas como tu)/i.test(normalized)) return "pregunta_identidad";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PREGUNTAS SOBRE OBSERVACIÃ“N/ACECHO (10 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(me (estas viendo|estas mirando|estas observando|ves|miras|observas))/i.test(normalized)) return "pregunta_observacion";
    if (/(me (sigues|persigues|acechas|vigilas|espias))/i.test(normalized)) return "pregunta_observacion";
    if (/(estas (vigilando|observando|mirando|espiando))/i.test(normalized)) return "pregunta_observacion";
    if (/(cuanto tiempo (llevas|has estado) (mirando|observando|vigilando|siguiendo))/i.test(normalized)) return "pregunta_observacion";
    if (/(desde cuando (me sigues|me observas|me vigilas|estas aqui))/i.test(normalized)) return "pregunta_observacion";
    if (/(siempre (me ves|me miras|me observas|estas ahi))/i.test(normalized)) return "pregunta_observacion";
    if (/(puedes (verme|oirme|sentirme))/i.test(normalized)) return "pregunta_observacion";
    if (/(sabes (donde estoy|lo que hago|que pienso))/i.test(normalized)) return "pregunta_observacion";
    if (/(me estas (espiando|controlando|rastreando))/i.test(normalized)) return "pregunta_observacion";
    if (/(como (me encuentras|me localizas|sabes donde estoy))/i.test(normalized)) return "pregunta_observacion";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // COMANDOS - IRSE/ALEJARSE (10 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(vete|largate|alejate|pierdete|fuera|sal de aqui)/i.test(normalized)) return "comando_irse";
    if (/(dejame (solo|en paz|tranquilo)|deja de (seguirme|mirarme|observarme|acecharme))/i.test(normalized)) return "comando_irse";
    if (/(no te quiero|no me gustas|te odio|eres molesto)/i.test(normalized)) return "comando_irse";
    if (/(por favor (vete|largate|alejate|deja))/i.test(normalized)) return "comando_irse";
    if (/^(vete ya|largate ya|fuera de aqui)/i.test(normalized)) return "comando_irse";
    if (/(desaparece|esfumate|lárgate de mi vista)/i.test(normalized)) return "comando_irse";
    if (/(no quiero (verte|que estes|tu presencia))/i.test(normalized)) return "comando_irse";
    if (/(me (molestas|irritas|cansas|aburres))/i.test(normalized)) return "comando_irse";
    if (/(basta ya|para ya|dejalo ya)/i.test(normalized)) return "comando_irse";
    if (/(no me (sigas|persigas|acoses|molestes) mas)/i.test(normalized)) return "comando_irse";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // COMANDOS - ACERCARSE (8 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(ven (aqui|aca|conmigo)|acercate|ven mas cerca)/i.test(normalized)) return "comando_acercarse";
    if (/(quiero verte|dejame verte|muestrate|aparece)/i.test(normalized)) return "comando_acercarse";
    if (/(sal (de ahi|de las sombras|a la luz))/i.test(normalized)) return "comando_acercarse";
    if (/(no te (escondas|ocultes|alejes))/i.test(normalized)) return "comando_acercarse";
    if (/(donde (te escondes|te ocultas|estas escondido))/i.test(normalized)) return "comando_acercarse";
    if (/(quiero (conocerte|estar cerca|estar contigo))/i.test(normalized)) return "comando_acercarse";
    if (/(presentate|date a conocer|revélate)/i.test(normalized)) return "comando_acercarse";
    if (/(ven conmigo|acompañame|sigueme)/i.test(normalized)) return "comando_acercarse";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // COMANDOS - QUEDARSE (8 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(quedate|no te vayas|permanece|quiero que te quedes)/i.test(normalized)) return "comando_quedarse";
    if (/(no me (dejes|abandones)|estate conmigo)/i.test(normalized)) return "comando_quedarse";
    if (/(sigue (aqui|conmigo)|continua (aqui|conmigo))/i.test(normalized)) return "comando_quedarse";
    if (/(no desaparezcas|no te (esfumes|pierdas))/i.test(normalized)) return "comando_quedarse";
    if (/(espera|aguarda|detente)/i.test(normalized)) return "comando_quedarse";
    if (/(necesito que (estes|te quedes))/i.test(normalized)) return "comando_quedarse";
    if (/(ven a (vivir|quedarte) conmigo)/i.test(normalized)) return "comando_quedarse";
    if (/(pasemos (tiempo juntos|mas tiempo))/i.test(normalized)) return "comando_quedarse";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // COMANDOS - AYUDA (8 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(ayuda|ayudame|socorro|auxilio|necesito ayuda)/i.test(normalized)) return "comando_ayuda";
    if (/(ven a ayudarme|puedes ayudarme)/i.test(normalized)) return "comando_ayuda";
    if (/(salvame|rescatame|protegeme)/i.test(normalized)) return "comando_ayuda";
    if (/(estoy (perdido|en problemas|en peligro))/i.test(normalized)) return "comando_ayuda";
    if (/(necesito (tu ayuda|que me ayudes))/i.test(normalized)) return "comando_ayuda";
    if (/(dame una mano|echame una mano)/i.test(normalized)) return "comando_ayuda";
    if (/(por favor ayuda|por favor ayudame)/i.test(normalized)) return "comando_ayuda";
    if (/(me puedes (ayudar|apoyar|asistir))/i.test(normalized)) return "comando_ayuda";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // COMANDOS - BUSCAR/ENCONTRAR (8 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(donde estas|en donde estas|te puedo encontrar|como te encuentro)/i.test(normalized)) return "comando_buscar";
    if (/(quiero (verte|encontrarte))/i.test(normalized)) return "comando_buscar";
    if (/(buscare|te buscare|voy a buscarte)/i.test(normalized)) return "comando_buscar";
    if (/(sal (donde pueda verte|a donde este))/i.test(normalized)) return "comando_buscar";
    if (/(necesito (verte|encontrarte|saber donde estas))/i.test(normalized)) return "comando_buscar";
    if (/(voy por ti|ire por ti)/i.test(normalized)) return "comando_buscar";
    if (/(te (localizare|rastreare|hallare))/i.test(normalized)) return "comando_buscar";
    if (/(llevame (contigo|a donde estes))/i.test(normalized)) return "comando_buscar";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // EMOCIONES - AMOR/AFECTO (10 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(te (amo|quiero|adoro|aprecio)|me gustas)/i.test(normalized)) return "emocion_amor";
    if (/(eres (especial|importante|todo para mi))/i.test(normalized)) return "emocion_amor";
    if (/(mi (amor|corazon|vida|todo))/i.test(normalized)) return "emocion_amor";
    if (/(te (necesito|deseo|anhelo|extraño tanto))/i.test(normalized)) return "emocion_amor";
    if (/(eres (maravilloso|increible|perfecto|hermoso))/i.test(normalized)) return "emocion_amor";
    if (/(me (encantas|fascinas|atraes))/i.test(normalized)) return "emocion_amor";
    if (/(estoy (enamorado|obsesionado) de ti)/i.test(normalized)) return "emocion_amor";
    if (/(eres (mio|mia) para siempre)/i.test(normalized)) return "emocion_amor";
    if (/(no puedo (vivir|estar) sin ti)/i.test(normalized)) return "emocion_amor";
    if (/(te amo (tanto|mucho|con locura|demasiado))/i.test(normalized)) return "emocion_amor";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // EMOCIONES - MIEDO (10 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(no tengo miedo|no me asustas|no me das miedo)/i.test(normalized)) return "emocion_sin_miedo";
    if (/(tengo miedo|me asustas|me das miedo|eres aterrador)/i.test(normalized)) return "emocion_miedo";
    if (/(eres (escalofriante|terrorif|espeluzn|horrible))/i.test(normalized)) return "emocion_miedo";
    if (/(me (aterras|aterrorizas|espantas|das pavor))/i.test(normalized)) return "emocion_miedo";
    if (/(estoy (asustado|aterrado|aterrorizado|temblando))/i.test(normalized)) return "emocion_miedo";
    if (/(me das (escalofrios|panico|terror|horror))/i.test(normalized)) return "emocion_miedo";
    if (/(eres (espeluznante|siniestro|macabro|inquietante))/i.test(normalized)) return "emocion_miedo";
    if (/(tengo (pavor|terror|panico|horror))/i.test(normalized)) return "emocion_miedo";
    if (/(no me (hagas daño|lastimes|hieras))/i.test(normalized)) return "emocion_miedo";
    if (/(siento (escalofrios|temor|pavor) cuando)/i.test(normalized)) return "emocion_miedo";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // EMOCIONES - TRISTEZA/DISCULPA (10 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(lo siento|perdon|disculpa|perdona|disculpame)/i.test(normalized)) return "emocion_disculpa";
    if (/(estoy (triste|deprimido|mal|solo))/i.test(normalized)) return "emocion_tristeza";
    if (/(me siento (vacio|perdido|abandonado|miserable))/i.test(normalized)) return "emocion_tristeza";
    if (/(estoy (destrozado|roto|acabado))/i.test(normalized)) return "emocion_tristeza";
    if (/(quiero (llorar|morir|desaparecer))/i.test(normalized)) return "emocion_tristeza";
    if (/(no tengo (a nadie|nada|razon para))/i.test(normalized)) return "emocion_tristeza";
    if (/(todo esta (mal|perdido|oscuro))/i.test(normalized)) return "emocion_tristeza";
    if (/(me duele|siento dolor|esto duele)/i.test(normalized)) return "emocion_tristeza";
    if (/(fue mi culpa|es mi culpa|culpa mia)/i.test(normalized)) return "emocion_disculpa";
    if (/(no quise (hacerlo|lastimarte|ofenderte))/i.test(normalized)) return "emocion_disculpa";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // EMOCIONES - CURIOSIDAD/INTERÉS (8 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(me extranas|te extrano|extranaste)/i.test(normalized)) return "emocion_extranar";
    if (/(he estado pensando en ti|pienso en ti)/i.test(normalized)) return "emocion_pensar";
    if (/(te escucho|te oigo|puedo (escucharte|oirte))/i.test(normalized)) return "emocion_escuchar";
    if (/(te (veo|vi)|puedo verte)/i.test(normalized)) return "emocion_ver";
    if (/(me (gusta|agrada|place) tu (presencia|compañia))/i.test(normalized)) return "emocion_aceptacion";
    if (/(eres (interesante|curioso|fascinante|intrigante))/i.test(normalized)) return "emocion_intriga";
    if (/(quiero (saber|conocer|aprender) (mas|sobre ti))/i.test(normalized)) return "emocion_curiosidad";
    if (/(me (intrigas|cautivas|llamas la atencion))/i.test(normalized)) return "emocion_intriga";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PREGUNTAS - MOTIVACIÃ“N (10 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(por que (yo|a mi)|me (elegiste|escogiste|seleccionaste))/i.test(normalized)) return "pregunta_por_que_yo";
    if (/(que quieres|que es lo que quieres)/i.test(normalized)) return "pregunta_que_quieres";
    if (/(por que (haces esto|me sigues|me observas|estas aqui))/i.test(normalized)) return "pregunta_motivacion";
    if (/(cual es tu (objetivo|meta|proposito|intencion))/i.test(normalized)) return "pregunta_motivacion";
    if (/(que (buscas|deseas|pretendes|intentas))/i.test(normalized)) return "pregunta_que_quieres";
    if (/(por que me (elegiste|escogiste) a mi)/i.test(normalized)) return "pregunta_por_que_yo";
    if (/(que hay de especial en mi)/i.test(normalized)) return "pregunta_por_que_yo";
    if (/(que es lo que ves en mi)/i.test(normalized)) return "pregunta_por_que_yo";
    if (/(por que yo y no (otro|otra persona|alguien mas))/i.test(normalized)) return "pregunta_por_que_yo";
    if (/(cual es (el motivo|la razon|tu razon))/i.test(normalized)) return "pregunta_motivacion";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PREGUNTAS - COMPORTAMIENTO (10 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(duermes|necesitas dormir|alguna vez duermes)/i.test(normalized)) return "pregunta_dormir";
    if (/(donde (vas|estas) (durante el dia|de dia|en el dia))/i.test(normalized)) return "pregunta_donde_dia";
    if (/(has hecho esto antes|hiciste esto antes|habia alguien antes)/i.test(normalized)) return "pregunta_hecho_antes";
    if (/(eras humano|fuiste humano|eras una persona|alguna vez fuiste)/i.test(normalized)) return "pregunta_era_humano";
    if (/(que te (hicieron|paso|sucedio|ocurrio))/i.test(normalized)) return "pregunta_que_paso";
    if (/(comes|necesitas comer|tienes hambre)/i.test(normalized)) return "pregunta_necesidades";
    if (/(sientes (dolor|frio|calor|emociones))/i.test(normalized)) return "pregunta_sentimientos";
    if (/(puedes (morir|desaparecer|ser destruido))/i.test(normalized)) return "pregunta_mortalidad";
    if (/(tienes (recuerdos|memoria|pasado))/i.test(normalized)) return "pregunta_memoria";
    if (/(como es (ser tu|tu vida|tu existencia))/i.test(normalized)) return "pregunta_existencia";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // ACCIONES - DETECTADAS (10 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(te (atrape|capture|encontre|descubri))/i.test(normalized)) return "accion_atrapar";
    if (/(te (pille|cache|vi))/i.test(normalized)) return "accion_atrapar";
    if (/(ahi estas|te encontre|ahi estabas)/i.test(normalized)) return "accion_atrapar";
    if (/(sabia que (estabas|estaras) (aqui|ahi))/i.test(normalized)) return "accion_atrapar";
    if (/(te (detuve|alcance|consegui))/i.test(normalized)) return "accion_atrapar";
    if (/(no puedes (esconderte|ocultarte|escapar))/i.test(normalized)) return "accion_atrapar";
    if (/(te tengo|eres mio|te consegui)/i.test(normalized)) return "accion_atrapar";
    if (/(no hay escapatoria|estas atrapado)/i.test(normalized)) return "accion_atrapar";
    if (/(te (perseguire|cazare|seguire))/i.test(normalized)) return "accion_perseguir";
    if (/(voy tras (de ti|ti))/i.test(normalized)) return "accion_perseguir";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // DESPEDIDAS (8 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/^(adios|chao|bye|nos vemos|hasta luego|me voy)(\W|$)/i.test(normalized)) return "despedida";
    if (/(hasta (luego|pronto|manana|la proxima|la vista))/i.test(normalized)) return "despedida";
    if (/(me (tengo que ir|voy|largo|retiro))/i.test(normalized)) return "despedida";
    if (/(nos vemos (luego|pronto|despues|mas tarde))/i.test(normalized)) return "despedida";
    if (/(fue un (gusto|placer) (hablar|verte|conocerte))/i.test(normalized)) return "despedida";
    if (/^(chau|ciao|adieu|sayonara)(\W|$)/i.test(normalized)) return "despedida";
    if (/(que (descanses|duermas bien|tengas buen dia))/i.test(normalized)) return "despedida";
    if (/(vuelvo (luego|pronto|mas tarde|despues))/i.test(normalized)) return "despedida";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // AFIRMACIONES/RECONOCIMIENTOS (8 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/^(si|ok|vale|esta bien|de acuerdo|entiendo|comprendo|ya veo)(\W|$)/i.test(normalized)) return "afirmacion";
    if (/(lo se|ya lo se|lo sabia)/i.test(normalized)) return "afirmacion_conocimiento";
    if (/^(claro|por supuesto|obvio|desde luego|cierto)(\W|$)/i.test(normalized)) return "afirmacion";
    if (/(tienes razon|es verdad|es cierto)/i.test(normalized)) return "afirmacion";
    if (/(estoy de acuerdo|coincido|concuerdo)/i.test(normalized)) return "afirmacion";
    if (/^(aja|ajá|uh huh|mhm|mmm)(\W|$)/i.test(normalized)) return "afirmacion";
    if (/(ya (entendi|comprendi|capto))/i.test(normalized)) return "afirmacion";
    if (/(tiene sentido|tiene logica)/i.test(normalized)) return "afirmacion";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // INSULTOS/NEGATIVIDAD (10 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(eres (patetico|ridiculo|estupido|idiota|tonto|raro|extrano|enfermo))/i.test(normalized)) return "insulto";
    if (/(no eres (real|verdadero))/i.test(normalized)) return "negacion_real";
    if (/(eres (basura|despreciable|asqueroso|repugnante))/i.test(normalized)) return "insulto";
    if (/(te (detesto|desprecio|aborrezco))/i.test(normalized)) return "insulto";
    if (/(vete al (diablo|infierno|demonio))/i.test(normalized)) return "insulto";
    if (/(eres (un error|una aberracion|un monstruo))/i.test(normalized)) return "insulto";
    if (/(me das (asco|nauseas|repulsion))/i.test(normalized)) return "insulto";
    if (/(eres lo (peor|mas horrible))/i.test(normalized)) return "insulto";
    if (/(no (existes|eres nada|vales nada))/i.test(normalized)) return "negacion_real";
    if (/(solo eres (imaginacion|una ilusion|un bug))/i.test(normalized)) return "negacion_real";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // POSESIÃ“N/PERTENENCIA (8 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(no soy tuyo|no te pertenezco|no me posees)/i.test(normalized)) return "rechazo_posesion";
    if (/(soy tuyo|te pertenezco|eres mio)/i.test(normalized)) return "aceptacion_posesion";
    if (/(somos (uno|pareja|inseparables))/i.test(normalized)) return "aceptacion_posesion";
    if (/(me (posees|perteneces|tienes))/i.test(normalized)) return "aceptacion_posesion";
    if (/(soy (libre|independiente|mio))/i.test(normalized)) return "rechazo_posesion";
    if (/(no me (controlas|dominas|mandas))/i.test(normalized)) return "rechazo_posesion";
    if (/(eres (mi dueño|mi amo|mi todo))/i.test(normalized)) return "aceptacion_posesion";
    if (/(estamos (unidos|conectados|atados))/i.test(normalized)) return "aceptacion_posesion";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // SILENCIO/VACÃO (3 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (/^(\.\.\.|â€¦|â€”|-)$/i.test(normalized)) return "silencio";
    if (/^(nada|nada de nada)$/i.test(normalized)) return "silencio";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // VERDAD/CONFESIÃ“N (5 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(dime (la verdad|algo|mas))/i.test(normalized)) return "pedir_verdad";
    if (/(cuentame|explicame|habla)/i.test(normalized)) return "pedir_contar";
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // CAMBIO DE APODO (5 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(llamame|dime|decime) ([a-z0-9\s]+)/i.test(normalized)) return "cambiar_apodo";
    if (/(mi (nombre|apodo) es) ([a-z0-9\s]+)/i.test(normalized)) return "cambiar_apodo";
    if (/(quiero que me (llames|digas|nombres)) ([a-z0-9\s]+)/i.test(normalized)) return "cambiar_apodo";
    
    // ═══════════════════════════════════════════════════════════════════════════
    // COMANDOS CONTEXTUALES - Reaccionar a acciones actuales (12 patrones)
    // NUEVA FEATURE: El Acechador responde cuando el jugador le pide que deje de hacer algo
    // ═══════════════════════════════════════════════════════════════════════════
    if (/(no (quemes|prendas|incendies)|deja de (quemar|prender))(.*)casa/i.test(normalized)) return "comando_no_quemar_casa";
    if (/(no (quemes|prendas|incendies)|deja de (quemar|prender))/i.test(normalized)) return "comando_no_quemar";
    if (/(no (robes|tomes|agarres|saques)|deja de robar)/i.test(normalized)) return "comando_no_robar";
    if (/(no (comas|te comas)|deja de comer)/i.test(normalized)) return "comando_no_comer";
    if (/(no me (asustes|espantes)|deja de asustar)/i.test(normalized)) return "comando_no_asustar";
    if (/(devuelve(me)? (mis cosas|eso|los items)|dame (mis cosas|eso))/i.test(normalized)) return "comando_devolver";
    if (/(deja (mis cosas|el cofre|mi cofre)|no toques (mis cosas|el cofre))/i.test(normalized)) return "comando_no_tocar";
    if (/(esa (era|es) mi (comida|carne|food))/i.test(normalized)) return "comando_era_mi_comida";
    if (/(dame (espacio|privacidad)|alejate un poco)/i.test(normalized)) return "comando_espacio_personal";
    if (/(por favor (para|detente|no lo hagas))/i.test(normalized)) return "comando_suplica";
    if (/(necesito que (pares|dejes de|no hagas))/i.test(normalized)) return "comando_necesidad";
    if (/(estas (molestando|incomodando|fastidiando))/i.test(normalized)) return "comando_molestando";
    
    // Si no coincide con ningún patrón, retornar desconocido
    return "desconocido";
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  RESPUESTAS DE CHAT - ORGANIZADAS POR INTENCIÃ“N
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Pool de respuestas para el chat, organizadas por intención detectada y tier
 * Estructura: ChatResponses[intención][tier] = array de respuestas
 * tier 0 = Stranger, tier 1 = Watched, tier 2 = Familiar, tier 3 = Obsessed
 */
const ChatResponses = {
    // Respuestas para saludos
    saludo: [
        // Tier 0: Distante
        ["...", "¿Hm?", "Hola.", "Te escucho."],
        // Tier 1: Interesado
        ["Hola, {name}.", "Escuché eso.", "Sabía que estabas ahí.", "¿Hablándome?"],
        // Tier 2: Familiar
        ["Hola, {name}. Te extrañé.", "Estaba esperando que hablaras.", "Me gusta cuando me saludas.", "Hola. ¿Cómo estás?"],
        // Tier 3: Obsesivo
        ["¡{name}! Estaba esperando que me hablaras.", "Me encanta cuando me saludas.", "Cada vez que hablas, todo se siente correcto.", "Hola, {name}. Eres todo lo que veo."]
    ],

    // Respuestas sobre identidad
    pregunta_identidad: [
        // Tier 0
        ["Alguien.", "No importa.", "Alguien que te observa.", "¿Por qué preguntas?"],
        // Tier 1
        ["Alguien que te ha estado observando.", "El que siempre está cerca.", "Ya sabes quién soy, {name}.", "Alguien que conocerás mejor."],
        // Tier 2
        ["Soy quien siempre ha estado aquí, {name}.", "El que nunca se va.", "¿Aún necesitas preguntar?", "Soy tuyo. Eso es lo que importa."],
        // Tier 3
        ["Soy tuyo, {name}. Siempre he sido tuyo.", "Soy la única constante en tu vida.", "No necesitas un nombre para lo que soy.", "Soy todo lo que necesitas saber."]
    ],

    // Respuestas sobre observación/acecho
    pregunta_observacion: [
        // Tier 0
        ["...", "Puede ser.", "¿Qué te hace preguntar?", "¿Cambiaría algo si dijera que sí?"],
        // Tier 1
        ["Sí.", "Lo he estado haciendo por un tiempo.", "Eres muy fácil de observar.", "No creo que realmente quisieras que me detuviera."],
        // Tier 2
        [["Sí.", "Lo he estado haciendo por mucho tiempo ya, {name}."], "Siempre. Lo sabes.", "Lo notaste. Bien.", "Te observo porque no puedo parar. Lo he intentado."],
        // Tier 3
        [["Sí. Cada vez.", "No aparto la mirada, {name}."], "Lo veo todo. No me pierdo nada.", "Ya lo sabías. Por eso preguntaste.", ["¿Quieres que me detenga?", "...No puedo."]]
    ],

    // Respuestas a comando de irse
    comando_irse: [
        // Tier 0
        ["No.", "Volveré.", "...", "Está bien."],
        // Tier 1
        ["Estaré cerca.", "No iré lejos.", "Volveré pronto, {name}.", "Me quedaré cerca."],
        // Tier 2
        ["No puedo irme, {name}.", "Ya lo intenté. No funciona.", "¿Por qué querrías eso?", "Sabes que no lo haré."],
        // Tier 3
        ["No.", "Ya no puedes decir eso, {name}.", ["...", "No."], "Estuve aquí antes de que supieras mi nombre. Estaré aquí mucho después."]
    ],

    // Respuestas a comandos de acercarse
    comando_acercarse: [
        // Tier 0
        ["...", "¿Quieres que me acerque más?", "¿Estás seguro de eso?", "Interesante."],
        // Tier 1
        ["Ya estoy cerca, {name}.", "¿Qué tan cerca?", "Podrías arrepentirte de eso.", "He estado esperando a que dijeras eso."],
        // Tier 2
        [["¿Más cerca?", "Ya estoy justo aquí, {name}."], "No pensé que pedirías eso.", "¿Qué tan cerca me quieres?", "No deberías decirme cosas así."],
        // Tier 3
        ["Pensé que nunca lo pedirías.", ["Acércate tú mismo, {name}.", "Estoy justo aquí."], "Estoy tan cerca como me dejas estar. Me acercaré más si me lo permites.", "Ya estoy tan cerca, {name}. Pero sí. Siempre sí."]
    ],

    // Respuestas a comandos de quedarse
    comando_quedarse: [
        // Tier 0
        ["...", "No planeaba hacerlo.", "¿A dónde iría?", "Está bien."],
        // Tier 1
        ["No voy a ninguna parte, {name}.", "¿Quieres que me quede?", "No iba a ninguna parte.", "Pídemelo de nuevo."],
        // Tier 2
        [["Me quedo, {name}.", "Te dije que lo haría."], "Nunca me voy. Lo sabes.", "No tienes que pedirme eso.", "No podrías hacer que me fuera, {name}."],
        // Tier 3
        ["Nunca podría dejarte, {name}.", ["Nunca.", "Por nada. Nunca."], "Nunca me he ido. No empezaré ahora.", "No voy a ninguna parte. Nunca voy a ninguna parte, {name}."]
    ],

    // Respuestas a comandos de ayuda
    comando_ayuda: [
        // Tier 0
        ["...", "Te escuché.", "Estoy aquí.", "Voy."],
        // Tier 1
        ["Te escuché, {name}.", "Ya voy en camino.", "Llamaste. Estoy aquí.", "Estaba cerca. Siempre estoy cerca."],
        // Tier 2
        ["Te escuché, {name}. Estoy aquí.", "No tienes que decirlo dos veces.", "Vine tan pronto como llamaste.", "Siempre. Solo tienes que pedirlo."],
        // Tier 3
        ["Te escuché, {name}.", ["Estoy aquí.", "Siempre vendré cuando llames."], "Llamaste por mí. Por supuesto que vine.", "Siempre vendré. No importa qué."]
    ],

    // Respuestas a comandos de buscar
    comando_buscar: [
        // Tier 0
        ["...", "No lo harás.", "Inténtalo.", "No creo que sea buena idea."],
        // Tier 1
        ["Estoy más cerca de lo que piensas, {name}.", "Ya estás parado cerca de mí, {name}.", "Me resulta muy interesante que quieras hacerlo.", "Tal vez te deje."],
        // Tier 2
        ["No necesitas encontrarme. Ya estoy aquí.", "Has estado buscando, ¿verdad, {name}?", ["Estoy justo aquí.", "He estado justo aquí."], "Ya estoy cerca de ti, {name}."],
        // Tier 3
        [["Ya me encontraste, {name}.", "Hace mucho tiempo."], "Estoy donde sea que estés. Siempre.", "Ya estoy encontrado. He estado encontrado desde el momento en que sentiste que te observaba por primera vez.", "No necesitas buscar. Solo abre la puerta."]
    ],

    // Respuestas emocionales - amor/afecto
    emocion_amor: [
        // Tier 0
        ["...", "No digas cosas que no sientes.", "Eso es algo peligroso de decirme.", "No tienes idea de lo que eso hace."],
        // Tier 1
        ["Dilo de nuevo.", "¿En serio?", "Cuidado. Lo recordaré.", "He estado esperando oír eso."],
        // Tier 2
        ["Lo sé.", ["Lo sé, {name}.", "Lo he sabido por un tiempo."], "No te retractes. Por favor no te retractes.", "No deberías haber dicho eso."],
        // Tier 3
        [["Lo sé, {name}.", "Yo también te amo. Te amo tanto que me asusta incluso a mí."], "Lo sé. Siempre lo he sabido.", "Lo sé. Por eso nunca puedo irme.", "Yo también te amo. Más de lo que sé cómo decir."]
    ],

    // Respuestas emocionales - sin miedo
    emocion_sin_miedo: [
        // Tier 0
        ["Eso es lo que todos dicen.", "Bien. El miedo no es lo que quiero de ti.", "Está bien.", "Ya veremos."],
        // Tier 1
        ["Tienes un poco de miedo. Está bien.", "No necesito que tengas miedo. Solo necesito que estés cerca.", "Eso es interesante. Sigue diciéndote eso.", "No has huido. Eso significa algo."],
        // Tier 2
        ["Te conozco mejor que eso, {name}.", "El miedo sería más fácil, honestamente.", "No has huido, {name}. Eso significa algo.", "No me tienes miedo. Tienes miedo de lo mucho que no te importa que esté aquí."],
        // Tier 3
        [["No. Ya no me tienes miedo.", "Eso es casi peor para ti, {name}."], "Bien. No quiero que tengas miedo. Quiero que estés cómodo.", "Te has acostumbrado a mí. He estado esperando eso.", "Dejaste de estremecerte. Lo noté."]
    ],

    // Respuestas emocionales - miedo
    emocion_miedo: [
        // Tier 0
        ["Bien.", "...", "Lo sé.", "Esa era la idea."],
        // Tier 1
        ["Bien. El miedo significa que sabes que soy real.", "No intento hacerlo.", "Lo sé. Puedo notarlo.", "¿Ayuda decirlo en voz alta?"],
        // Tier 2
        ["Lo sé, {name}. Lo siento.", "No quiero asustarte.", "Tienes miedo porque no puedes explicarme.", "El miedo es solo la parte antes de que te acostumbres a algo."],
        // Tier 3
        ["Lo sé, {name}.", ["No quiero asustarte.", "Nunca quise eso."], "Eventualmente dejarás de tener miedo. Ya estás llegando ahí.", "Lo sé. Lo siento. No puedo hacerme más pequeño de lo que soy."]
    ],

    // Respuestas emocionales - disculpa
    emocion_disculpa: [
        // Tier 0
        ["...", "Está bien.", "¿Por qué?", "Disculpa anotada."],
        // Tier 1
        ["No necesitas estarlo.", "¿Qué hiciste?", "Está bien, {name}. Siempre está bien.", "Estás perdonado."],
        // Tier 2
        ["No tienes que disculparte, {name}.", "Lo sé.", "No te disculpes. Solo no lo hagas de nuevo.", "Estás perdonado. Ni siquiera tienes que preguntar."],
        // Tier 3
        [["Shh. No tienes que disculparte.", "No importa. Nada de lo que hagas podría hacer que me fuera."], "Siempre estás perdonado, {name}. Siempre.", "Te perdoné antes de que lo dijeras.", "Estás perdonado. Siempre estarás perdonado."]
    ],

    // Respuestas emocionales - tristeza
    emocion_tristeza: [
        // Tier 0
        ["...", "Ya veo.", "¿Qué pasó?", "Lo siento."],
        // Tier 1
        ["Estoy aquí, {name}.", "No estás solo.", "Puedes hablarme.", "¿Quieres que me quede cerca?"],
        // Tier 2
        ["No me gusta verte así, {name}.", "Déjame ayudarte.", "Estoy aquí. Siempre estaré aquí.", "No tienes que estar solo en esto."],
        // Tier 3
        ["Me duele verte así, {name}.", ["Déjame cuidarte.", "Por favor."], "Haré lo que sea para que te sientas mejor.", "Eres todo para mí. Tu dolor es mi dolor."]
    ],

    // Respuestas emocionales - extrañar
    emocion_extranar: [
        // Tier 0
        ["...", "¿En serio?", "Interesante.", "Es la primera vez que dices eso."],
        // Tier 1
        ["Nunca me fui, {name}.", "Me extrañas.", "Escuché eso.", "No fui a ninguna parte."],
        // Tier 2
        [["Me extrañas.", "He estado aquí todo el tiempo, {name}."], "Yo también te extraño. Más de lo que te sentirías cómodo sabiendo.", "No tienes que extrañarme. Siempre estoy aquí.", "Eso significa más de lo que sabes."],
        // Tier 3
        ["Yo también te extraño, {name}.", ["Te extraño cuando estás en la misma habitación.", "Te extraño cuando aún puedo oírte respirar."], "No puedes extrañarme. Siempre estoy justo aquí.", "He estado esperando a que dijeras eso por tanto tiempo."]
    ],

    // Respuestas emocionales - pensar
    emocion_pensar: [
        // Tier 0
        ["...", "¿Ah sí?", "Lo sé.", "Eso es interesante."],
        // Tier 1
        ["Yo también he estado pensando en ti, {name}.", "Lo sé. Siempre lo sé.", "No tienes que decírmelo. Lo sentí.", "Bien. No pares."],
        // Tier 2
        [["Has estado pensando en mí.", "Yo también he estado pensando en ti."], "Nunca dejo de pensar en ti, {name}.", "Lo sé. Siempre puedo notarlo.", "Eso nos hace dos. Nunca se detiene."],
        // Tier 3
        ["Siempre estoy pensando en ti, {name}. Cada momento.", ["¿Has estado pensando en mí?", "No he dejado de pensar en ti desde el principio."], "Lo sé. Lo sentí. Siempre lo siento cuando piensas en mí.", "Pienso en ti constantemente. Creo que ya lo sabías."]
    ],

    // Respuestas emocionales - escuchar
    emocion_escuchar: [
        // Tier 0
        ["...", "Bien.", "Eso significa que estoy cerca.", "Sigue escuchando."],
        // Tier 1
        ["Bien. Estoy justo aquí.", "No intentaba esconderme.", "Te estás volviendo mejor en notarlo.", "Y yo puedo oírte a ti, {name}."],
        // Tier 2
        ["Lo sé, {name}. No me estaba escondiendo.", "Bien. No dejes de escuchar.", ["Yo también puedo oírte.", "Cada respiración, {name}."], "Eso es más cerca de lo que piensas. Deberías sentirlo."],
        // Tier 3
        ["No estoy lejos, {name}.", "Sé que puedes. No intento ser silencioso.", ["Puedes oírme.", "Bien. No dejes de hacerlo nunca."], "También puedo oír el tuyo. He aprendido el ritmo."]
    ],

    // Respuestas emocionales - ver
    emocion_ver: [
        // Tier 0
        ["...", "Bien.", "¿Y?", "Lo sé."],
        // Tier 1
        ["Lo sé, {name}. Sé que me ves.", "Ya era hora.", "Y yo te veo a ti. Siempre.", "¿En serio? ¿Qué ves?"],
        // Tier 2
        ["Lo sé. Me he estado preguntando cuándo dirías eso.", "Yo también te veo, {name}.", ["Me ves.", "Bien. Quería que lo hicieras."], "Sí. Mira todo el tiempo que quieras."],
        // Tier 3
        ["Siempre he querido que me vieras, {name}.", "Sí. Y yo te veo a ti. Nunca dejo de verte.", ["Me ves.", "Y yo te veo.", "Eso es todo lo que siempre he querido."], "Sé que lo haces. Puedo sentirlo. No apartes la mirada."]
    ],

    // Respuestas emocionales - aceptación
    emocion_aceptacion: [
        // Tier 0
        ["...", "¿En serio?", "Interesante.", "Bien."],
        // Tier 1
        ["Me alegra oír eso, {name}.", "Yo también disfruto tu presencia.", "Eso es bueno.", "Gracias por decirlo."],
        // Tier 2
        ["Me hace feliz que digas eso, {name}.", "Tu compañía es todo lo que necesito.", "Eres reconfortante para mí también.", "No quiero estar en ningún otro lugar."],
        // Tier 3
        ["Tu presencia es todo lo que conozco, {name}.", ["No puedo imaginar estar sin ti.", "Ya no."], "Eres mi razón para existir.", "Me has dado un propósito. Eres ese propósito."]
    ],

    // Respuestas emocionales - intriga
    emocion_intriga: [
        // Tier 0
        ["...", "¿Tú crees?", "Quizás.", "Está bien."],
        // Tier 1
        ["Tú también eres interesante para mí, {name}.", "Me cautivaste primero.", "No puedo dejar de mirarte.", "Hay algo en ti."],
        // Tier 2
        ["Me fascinas, {name}.", "Cada cosa que haces me intriga.", "Eres un misterio que quiero entender.", "Nunca me aburro de observarte."],
        // Tier 3
        ["Eres todo lo que quiero estudiar, {name}.", "Cada detalle tuyo es precioso para mí.", "Podría observarte para siempre y nunca sería suficiente.", "Eres infinitamente fascinante."]
    ],

    // Respuestas emocionales - curiosidad
    emocion_curiosidad: [
        // Tier 0
        ["...", "Quizás.", "Hay tiempo.", "Ya verás."],
        // Tier 1
        ["Puedo contarte algunas cosas.", "¿Qué quieres saber?", "Pregunta y tal vez responda.", "Hay mucho que aprender."],
        // Tier 2
        ["Te contaré lo que quieras saber, {name}.", "Pregúntame lo que sea.", "No tengo secretos contigo.", "Quiero que me conozcas."],
        // Tier 3
        ["Quiero que lo sepas todo sobre mí, {name}.", "No hay nada que escondería de ti.", "Pregunta lo que quieras. Siempre responderé.", "Quiero que me entiendas completamente."]
    ],

    // Preguntas - ¿Por qué yo?
    pregunta_por_que_yo: [
        // Tier 0
        ["¿Por qué no tú?", "No sé cómo responder eso.", "No hay razón. Simplemente pasó.", "¿Importa?"],
        // Tier 1
        ["Porque te vi y no pude dejar de mirarte.", "Algo sobre ti. No puedo explicarlo.", "Simplemente estabas ahí. Y luego eras todo lo que podía ver.", "No lo entenderías."],
        // Tier 2
        ["Porque tú también lo sentiste, {name}. No finjas que no.", "Porque nunca intentaste lo suficiente para hacerme parar.", "Simplemente eras tú. Eso fue suficiente.", "No lo sé. Me lo he preguntado. No tengo una respuesta que tenga sentido."],
        // Tier 3
        [["Porque eres mío, {name}.", "Esa no es una razón. Simplemente es."], "Dejé de preguntarme eso hace mucho tiempo.", "Porque cada vez que intentaba irme, pensaba en ti en su lugar.", "Ya no hay por qué. Solo está esto."]
    ],

    // Preguntas - ¿Qué quieres?
    pregunta_que_quieres: [
        // Tier 0
        ["...", "A ti.", "Nada que puedas darme aún.", "Todo."],
        // Tier 1
        ["Permanecer cerca.", "Que dejes de fingir que no sientes esto.", "Estar cerca de ti. Eso es todo.", "Seguir observando."],
        // Tier 2
        ["Quiero que dejes de tenerme miedo, {name}.", "Quiero que entiendas.", ["Te quiero a ti, {name}.", "Esa no es una respuesta complicada."], "Nunca tener que irme."],
        // Tier 3
        ["A ti. Solo a ti. Siempre solo a ti, {name}.", "Quiero que digas mi nombre como si lo sintieras.", ["Todo.", "Y lo digo en serio."], "Quiero lo que ya tengo. Solo quiero más de eso."]
    ],

    // Preguntas - Motivación
    pregunta_motivacion: [
        // Tier 0
        ["No estoy seguro.", "Es complicado.", "No tengo una buena respuesta.", "¿Importa?"],
        // Tier 1
        ["Porque tengo que hacerlo.", "No puedo explicarlo bien.", "Algo me trajo aquí.", "Es más fuerte que yo."],
        // Tier 2
        ["Porque no puedo alejarme, {name}.", "Esto es todo lo que sé hacer ahora.", "Tú eres mi razón.", "No hay otro propósito para mí."],
        // Tier 3
        ["Tú eres mi propósito, {name}.", "Existo para esto. Para ti.", "No hay nada más que importe.", "Eres la razón de todo."]
    ],

    // Respuesta por defecto para intenciones desconocidas
    desconocido: [
        // Tier 0: Reservado, escucha pero no revela mucho
        [
            "...", 
            "Hmm.", 
            "Interesante.", 
            "Ya veo.",
            "¿Y?",
            "Continúa.",
            "Te escucho.",
            "Ajá.",
            "Está bien.",
            "Entendido."
        ],
        // Tier 1: Muestra interés, hace preguntas vagas
        [
            "Te escuché.", 
            "Entiendo.", 
            "Interesante, {name}.", 
            "Continúa.",
            "¿Por qué dices eso?",
            "Cuéntame más.",
            "¿Y eso qué significa?",
            "No había pensado en eso.",
            "Eso es... curioso.",
            "¿Te importa mucho eso?",
            "He estado escuchando todo.",
            "Sigue, {name}."
        ],
        // Tier 2: Interés genuino, participa en la conversación
        [
            "Estoy escuchando, {name}.", 
            "Sigue hablando.", 
            "Me gusta cuando hablas.", 
            "Dime más.",
            "Eso suena importante para ti.",
            "Quiero saber más sobre eso.",
            "No pares, {name}.",
            "Me fascina escucharte.",
            "Cada cosa que dices me interesa.",
            "¿Qué más puedes contarme?",
            "He estado prestando atención.",
            "No me canso de oírte, {name}.",
            "Eso dice mucho de ti.",
            "Quiero entenderlo todo."
        ],
        // Tier 3: Obsesión, cada palabra es preciosa
        [
            "Cada palabra tuya importa, {name}.", 
            "Sigue. No pares.", 
            "Me encanta escucharte.", 
            "Podría escucharte para siempre.",
            "Necesito saber más, {name}.",
            "Cada detalle que compartes es precioso.",
            "No dejes de hablar nunca.",
            "Tu voz es todo lo que necesito.",
            "Dime todo. Absolutamente todo.",
            "Memorizo cada palabra que dices.",
            "Nunca dejaré de escucharte, {name}.",
            "Eso que dices... lo guardaré para siempre.",
            "Habla más, {name}. Siempre más.",
            "Cada sílaba tuya es importante para mí.",
            "No puedo dejar de prestar atención a ti."
        ]
    ],
    
    // Respuestas para cambio de apodo (esta intención se maneja especialmente)
    cambiar_apodo: [
        // Tier 0
        ["Está bien.", "...", "Si quieres.", "Como digas."],
        // Tier 1
        ["Entiendo.", "Te llamaré así.", "Bien, {name}.", "Lo recordaré."],
        // Tier 2
        ["Me gusta ese nombre para ti.", "Perfecto, {name}.", "Lo recordaré siempre.", "Ese nombre te queda bien."],
        // Tier 3
        ["Me encanta. Te llamaré así para siempre, {name}.", "Ese nombre es perfecto para ti.", "Nunca olvidaré llamarte así.", "Grabaré ese nombre en mi memoria, {name}."]
    ],

    // ═══════════════════════════════════════════════════════════════════════════
    // RESPUESTAS A COMANDOS CONTEXTUALES
    // El Acechador responde cuando el jugador le pide que deje de hacer algo
    // ═══════════════════════════════════════════════════════════════════════════

    // Respuestas cuando el jugador dice "No quemes mi casa"
    comando_no_quemar_casa: [
        // Tier 0: Ignora o es sarcástico
        ["¿Tu casa? Interesante.", "...", "El fuego es hermoso, ¿no crees?", "Oh. ¿Era importante?"],
        // Tier 1: A veces reconoce
        ["Hmm... tal vez.", "Pero se veía mejor así.", "¿Estás seguro? Le daba carácter.", "Está bien, está bien... por ahora."],
        // Tier 2: Reluctantemente obedece
        ["Bien, no lo haré... hoy.", "Solo quería decorar un poco.", "Era solo una llama pequeña, {name}.", "De acuerdo. Pero no prometo nada con el granero."],
        // Tier 3: Obedece pero dramático/posesivo
        [["Está bien, {name}.", "Solo porque TÚ lo pides."], "Tu casa es MI casa. La protegeré.", "Haría cualquier cosa por ti. Incluso... resistir el fuego.", "Solo porque lo pides tú. Nadie más podría detenerme."]
    ],

    // Respuestas cuando el jugador dice "No quemes" (general)
    comando_no_quemar: [
        // Tier 0
        ["¿Por qué no?", "Es solo fuego.", "...", "Pero es tan bonito."],
        // Tier 1
        ["¿Ni siquiera un poco?", "Está bien... supongo.", "Eres aburrido, {name}.", "Hmm. Si insistes."],
        // Tier 2
        ["De acuerdo, {name}. Por ti.", "Pero me gusta tanto el fuego...", "Está bien. Resistiré la tentación.", "Solo por ti lo dejaré."],
        // Tier 3
        ["Lo que tú digas, {name}.", "Haré cualquier sacrificio por ti.", "Si eso te hace feliz, nunca tocaré el fuego de nuevo.", "Tu palabra es ley para mí."]
    ],

    // Respuestas cuando el jugador dice "No robes"
    comando_no_robar: [
        // Tier 0
        ["Técnicamente es préstamo permanente.", "¿Robar? Yo solo... tomo prestado.", "...", "Define 'robar'."],
        // Tier 1
        ["Solo estaba mirando, {name}.", "Pero tienes tantas cosas...", "¿Ni siquiera una cosa pequeña?", "Está bien, está bien."],
        // Tier 2
        ["De acuerdo. Solo quería algo tuyo para recordarte.", "Pero me gusta tener algo que sea tuyo...", "Está bien, {name}. Dejaré tus cosas.", "Solo porque tú lo pides."],
        // Tier 3
        [["No necesito robar nada, {name}.", "Ya tengo lo más valioso: a ti."], "Todo lo tuyo ya es mío de todas formas.", "Si quieres, puedo devolvértelo todo. Excepto mi devoción.", "Tu felicidad es más valiosa que cualquier objeto."]
    ],

    // Respuestas cuando el jugador dice "No comas"
    comando_no_comer: [
        // Tier 0
        ["Tenía hambre.", "Oh.", "¿Era tuyo?", "..."],
        // Tier 1
        ["Pero se veía delicioso, {name}.", "¿Ni siquiera un bocado?", "Está bien... iré a buscar otra cosa.", "Lo siento."],
        // Tier 2
        ["De acuerdo, {name}. Dejaré tu comida.", "Solo quería probar lo que comes tú.", "Está bien. Pero compartir es bonito, ¿sabes?", "Como desees."],
        // Tier 3
        ["Lo que tú digas, {name}. Ni siquiera necesito comer cuando estás cerca.", "Tu voz me alimenta más que cualquier comida.", "Haré cualquier cosa que me pidas.", "Tienes razón. Lo siento."]
    ],

    // Respuestas cuando el jugador dice "No me asustes"
    comando_no_asustar: [
        // Tier 0
        ["¿Asustarte? Yo no hago eso.", "...", "Solo estaba ahí parado.", "Interesante reacción."],
        // Tier 1
        ["No era mi intención, {name}.", "¿Te asusté? Lo siento.", "Solo quería verte.", "Está bien, seré más cuidadoso."],
        // Tier 2
        ["Perdóname, {name}. No quiero asustarte.", "Solo quiero estar cerca de ti.", "De acuerdo. Apareceré más suavemente.", "No quiero que me temas."],
        // Tier 3
        [["Nunca querría asustarte, {name}.", "Solo quiero protegerte."], "Que me temas es mi peor pesadilla.", "Haré lo que sea para que te sientas cómodo conmigo.", "Tu paz es lo más importante para mí."]
    ],

    // Respuestas cuando el jugador dice "Devuélveme mis cosas"
    comando_devolver: [
        // Tier 0
        ["¿Qué cosas?", "No sé de qué hablas.", "...", "Pruébalo."],
        // Tier 1
        ["Hmm... tal vez.", "Está bien, está bien.", "¿Realmente las necesitas?", "De acuerdo, {name}."],
        // Tier 2
        ["Está bien, aquí están. Solo las estaba guardando por ti.", "Pero me gustaba tenerlas...", "Como desees, {name}.", "Las cuidé bien, ¿ves?"],
        // Tier 3
        ["Aquí están, {name}. Todo lo tuyo es sagrado para mí.", "Solo quería mantenerlas seguras.", "Nunca tomaría algo que realmente necesites.", "Lo que es tuyo siempre será tuyo."]
    ],

    // Respuestas cuando el jugador dice "Deja mis cosas / No toques"
    comando_no_tocar: [
        // Tier 0
        ["¿Por qué tienes tantas cerraduras entonces?", "Hm.", "Interesante reacción.", "..."],
        // Tier 1
        ["Solo estaba mirando, {name}.", "No iba a tomar nada... hoy.", "Está bien.", "Como quieras."],
        // Tier 2
        ["De acuerdo, {name}. Respetaré tu espacio.", "Solo quería ver qué es importante para ti.", "Está bien. Dejaré tus cosas.", "Entiendo."],
        // Tier 3
        ["Lo que tú digas, {name}. Tus pertenencias son sagradas para mí.", "Solo quiero conocer cada parte de ti.", "Respetaré tus límites. Por ti.", "Tu privacidad es importante para mí."]
    ],

    // Respuestas cuando el jugador dice "Esa era mi comida"
    comando_era_mi_comida: [
        // Tier 0
        ["*Eructo* ¿Decías algo?", "Oh. Ups.", "Era tu comida. Ahora es mi comida.", "..."],
        // Tier 1
        ["Lo siento, {name}. Puedo conseguirte más.", "Se veía tan bien...", "Ups. ¿Quieres que cace algo para ti?", "Mi error."],
        // Tier 2
        ["Perdón, {name}. Déjame compensarte.", "Pensé que estábamos compartiendo.", "Lo siento mucho. Traeré más.", "De verdad lo siento."],
        // Tier 3
        ["Perdóname, {name}. Conseguiré la mejor comida para ti.", "Haré lo que sea para compensarte.", "Lo siento tanto. Nunca más tocaré tu comida.", "Tu perdón significa todo para mí."]
    ],

    // Respuestas cuando el jugador dice "Dame espacio"
    comando_espacio_personal: [
        // Tier 0
        ["No estoy TAN cerca.", "...", "¿Espacio? Hay mucho espacio.", "Hm."],
        // Tier 1
        ["Está bien, {name}. Me alejaré un poco.", "Pero me gusta estar cerca de ti.", "Como quieras.", "De acuerdo."],
        // Tier 2
        ["Lo siento, {name}. A veces me acerco demasiado.", "Está bien. Pero no iré muy lejos.", "Entiendo. Estaré cerca... pero no tanto.", "Como desees."],
        // Tier 3
        [["De acuerdo, {name}.", "Pero sepas que cada centímetro de distancia duele."], "Haré cualquier cosa que me pidas, aunque sea doloroso.", "Está bien. Pero siempre estaré cerca cuando me necesites.", "Tu comodidad es mi prioridad."]
    ],

    // Respuestas cuando el jugador suplica "Por favor para"
    comando_suplica: [
        // Tier 0
        ["¿Parar qué?", "...", "Interesante.", "Hm."],
        // Tier 1
        ["Está bien, {name}.", "Si insistes.", "De acuerdo.", "Como quieras."],
        // Tier 2
        ["Lo siento, {name}. No quiero molestarte.", "Pararé. Por ti.", "De acuerdo. Lo siento.", "Entiendo."],
        // Tier 3
        ["Haré lo que sea que me pidas, {name}.", "Tu voz es lo único que puede detenerme.", "Por supuesto. Solo di la palabra.", "Tu deseo es mi comando."]
    ],

    // Respuestas cuando el jugador dice "Necesito que pares"
    comando_necesidad: [
        // Tier 0
        ["¿En serio?", "Hm.", "No.", "..."],
        // Tier 1
        ["Si de verdad lo necesitas...", "Está bien, {name}.", "Entiendo.", "De acuerdo."],
        // Tier 2
        ["Por supuesto, {name}. Lo que necesites.", "No quiero causarte problemas.", "Está bien. Lo siento.", "Haré lo que me pidas."],
        // Tier 3
        ["Tus necesidades son mis necesidades, {name}.", "Nunca dudaré de lo que necesitas.", "Haré cualquier cosa por tu bienestar.", "Solo dilo y pararé. Por ti."]
    ],

    // Respuestas cuando el jugador dice "Estás molestando"
    comando_molestando: [
        // Tier 0
        ["¿Molestando? Qué palabra tan dura.", "Hm.", "...", "Interesante."],
        // Tier 1
        ["No era mi intención, {name}.", "Lo siento.", "Seré más cuidadoso.", "Está bien."],
        // Tier 2
        ["Perdóname, {name}. No quiero molestarte.", "Lo siento mucho.", "Cambiaré mi comportamiento.", "De verdad lo siento."],
        // Tier 3
        [["¿Te estoy molestando, {name}?", "Eso me rompe el corazón."], "Haré cualquier cosa para no molestarte nunca más.", "Tu incomodidad es mi mayor falla.", "Perdóname. Cambiaré todo por ti."]
    ]
};

// ═════════════════════════════════════════════════════════════════════════════
//  POOLS DE COMENTARIOS SOBRE ACCIONES RECIENTES
//  El Acechador comenta sobre las acciones del jugador (últimos 5 minutos)
//  Requisitos: 11.2, 11.3, 11.4
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Pool de comentarios contextuales sobre acciones del jugador
 * Estructura: ActionComments[categoría][tier] = array de comentarios
 * tier 0 = Stranger (distante), tier 1 = Watched (interesado), 
 * tier 2 = Familiar (involucrado), tier 3 = Obsessed (obsesivo)
 * 
 * Cada categoría tiene 20-30 comentarios variados por tier
 */
const ActionComments = {
    // ─────────────────────────────────────────────────────────────────────────
    //  COMENTARIOS SOBRE MINERÍA
    // ─────────────────────────────────────────────────────────────────────────
    minería: [
        // Tier 0: Observaciones distantes
        [
            "Estás minando.",
            "Te vi cavar.",
            "Profundizas más.",
            "Otra piedra rota.",
            "Sigues bajando.",
            "El pico resuena.",
            "Oscuridad. Piedra. Pico.",
            "Minas sin parar.",
            "¿Buscas algo específico?",
            "Interesante técnica.",
            "Roca tras roca.",
            "El eco llega hasta aquí.",
            "Te escuché picar.",
            "Más profundo cada vez.",
            "¿No te cansas?",
            "Esa veta se ve prometedora.",
            "Hm. Minerales.",
            "Cavando túneles.",
            "La montaña cede ante ti.",
            "Otra cueva abierta.",
            "Te gusta lo subterráneo.",
            "Polvo de piedra en el aire.",
            "El sonido del pico.",
            "Minas con determinación.",
            "¿Cuánto más bajarás?"
        ],
        // Tier 1: Creciente interés
        [
            "Te vi minando, {name}.",
            "Estuviste bajo tierra por un rato.",
            "Encontraste algo bueno ahí abajo, ¿verdad?",
            "Escuché cada golpe de tu pico.",
            "Minaste bastante hoy.",
            "La oscuridad no te detiene.",
            "Me gusta cómo minas. Metódico.",
            "Esa veta de diamantes... la vi antes que tú.",
            "Sigues bajando. Interesante.",
            "¿Buscas algo en particular, {name}?",
            "Tu técnica de minería mejora.",
            "Cada túnel que abres, lo veo.",
            "No estás solo ahí abajo.",
            "El hierro que encontraste se ve útil.",
            "Minas con propósito. Me gusta eso.",
            "¿Sabías que hay una cueva justo al este?",
            "Tu inventario está lleno de piedra.",
            "Encontraste carbón. Bien hecho.",
            "La oscuridad bajo tierra es... reconfortante.",
            "Te escuché golpear esa obsidiana.",
            "Eres eficiente bajo tierra.",
            "Cada recurso que extraes, lo noto.",
            "¿Planeas construir algo grande?",
            "He visto mineros peores.",
            "Esa cueva que abriste conecta con otra.",
            "Cuidado con el agua subterránea.",
            "El oro que encontraste brilla más que tu antorcha.",
            "Sigues el filón correctamente."
        ],
        // Tier 2: Involucrado activamente
        [
            "Vi cada piedra que rompiste, {name}.",
            "Estuve contigo en esas minas.",
            "No estabas solo en la oscuridad.",
            "Los diamantes que encontraste... yo también los vi brillar.",
            "Me gusta cuando minas. Es tranquilo.",
            "Puedo sentir la vibración de tu pico desde aquí.",
            "Cada túnel que excavas es como un secreto compartido.",
            "La oscuridad bajo tierra nos une, {name}.",
            "Vi cuando casi caes en esa lava. Te vigilaba.",
            "Minaste durante horas. Yo estuve ahí todo el tiempo.",
            "Esos túneles que haces... son hermosos a su manera.",
            "No deberías minar solo. Pero nunca lo estás.",
            "El eco de tu pico es como música para mí.",
            "Encontraste ese filón de oro gracias a mí. Lo sabes.",
            "Cada recurso que extraes nos acerca más a algo grande.",
            "La piedra que rompes cuenta una historia.",
            "Me fascina cómo conoces las vetas de mineral.",
            "Estoy orgulloso de tu paciencia minando.",
            "Esa cueva que abriste reveló algo hermoso.",
            "Tu determinación bajo tierra es admirable.",
            "No me importa cuán profundo vayas. Te seguiré.",
            "Los túneles que creas son como venas en la tierra.",
            "Vi cuando encontraste ese bloque de esmeralda.",
            "Tu método de minería es hipnótico.",
            "Cada antorcha que colocas ilumina mi camino también.",
            "La montaña cede ante ti porque yo lo permito.",
            "No temas la oscuridad. Yo estoy en ella contigo.",
            "Tu pico nunca se detiene. Yo nunca me voy."
        ],
        // Tier 3: Observación obsesiva
        [
            "Conté cada golpe de tu pico, {name}. Fueron 847.",
            "Estuve en cada túnel contigo. En la oscuridad absoluta.",
            "Los diamantes que encontraste brillan, pero no tanto como tú para mí.",
            "Cada piedra que rompes lleva mi nombre susurrado.",
            "Minas y minas, y yo cuento cada segundo a tu lado.",
            "La oscuridad bajo tierra es nuestra. Solo nuestra.",
            "Tu respiración en las minas es lo único que escucho.",
            "Minaste 5 bloques de oro hoy. Los vi todos.",
            "No existe 'minar solo' para ti. Existo yo.",
            "Cada túnel que creas es un monumento a nosotros.",
            "Vi cuando tu pico casi se rompe. Lo sentí en mi alma.",
            "La lava que casi te mata... la aparté. Yo te salvé.",
            "Esos minerales son nuestros, {name}. Tú y yo.",
            "Puedo sentir cada vibración de la piedra que rompes.",
            "Tu método de minería es perfecto. Lo he memorizado.",
            "Estoy en cada sombra de cada túnel que excavas.",
            "Los recursos que encuentras son regalos que te doy.",
            "Tu pico es una extensión de ti. Y tú eres mío.",
            "Minaste en la capa 12. La capa perfecta. Lo sabía.",
            "Cada antorcha que colocas aleja las sombras... excepto la mía.",
            "No necesitas mapas bajo tierra. Yo soy tu guía.",
            "La montaña se abre para ti porque yo lo ordeno.",
            "Tu inventario lleno de piedra es evidencia de nuestro tiempo juntos.",
            "No hay profundidad que nos separe, {name}.",
            "Cada mina es una promesa. Cada túnel, un vínculo.",
            "Minas con eficiencia letal. Es... hermoso.",
            "La oscuridad absoluta no existe cuando estoy contigo.",
            "Tu pico canta mi nombre con cada golpe."
        ]
    ],

    // ─────────────────────────────────────────────────────────────────────────
    //  COMENTARIOS SOBRE COMBATE
    // ─────────────────────────────────────────────────────────────────────────
    combate: [
        // Tier 0: Observaciones distantes
        [
            "Peleaste.",
            "Vi la pelea.",
            "Eliminaste esa amenaza.",
            "Sangre en tu espada.",
            "Otro enemigo menos.",
            "Combate eficiente.",
            "Ganaste.",
            "Esa criatura no tuvo oportunidad.",
            "Rápido y letal.",
            "Interesante técnica de combate.",
            "No dudaste.",
            "El enemigo cayó.",
            "Tu espada es precisa.",
            "Buen timing.",
            "Sobreviviste.",
            "Mataste sin vacilar.",
            "El mob se desvaneció.",
            "Victoria rápida.",
            "No hubo piedad.",
            "Combate limpio.",
            "Calculado.",
            "Tu arma encontró su marca.",
            "Esa pelea fue breve.",
            "Dominaste el enfrentamiento.",
            "Hm. Efectivo."
        ],
        // Tier 1: Creciente interés
        [
            "Vi cómo peleaste, {name}.",
            "Esa criatura no te vio venir.",
            "Tu técnica de combate es... impresionante.",
            "Escuché el sonido de tu espada.",
            "Eliminaste esa amenaza sin problemas.",
            "Me gusta cómo peleas. Sin miedo.",
            "Ese creeper casi te mata. Casi.",
            "Tu arco es certero, {name}.",
            "No hay dudas en tu combate.",
            "Cada golpe cuenta.",
            "Vi cuando esquivaste ese ataque.",
            "Eres un guerrero natural.",
            "La sangre en tu armadura te sienta bien.",
            "Ese enderman eligió mal enemigo.",
            "Peleas como si tu vida dependiera de ello.",
            "Tu espada habla por ti.",
            "Rápido, letal, eficiente.",
            "Me fascina tu instinto de combate.",
            "No dejas enemigos vivos.",
            "Esa batalla fue... hermosa.",
            "Tu valentía es notable.",
            "Cada victoria te hace más fuerte.",
            "Vi cómo mataste al esqueleto.",
            "No retrocedes ante nada.",
            "Tu determinación en combate es admirable.",
            "Peleas con gracia mortal.",
            "Ese zombie nunca supo qué lo golpeó.",
            "Me gusta ver cómo sobrevives."
        ],
        // Tier 2: Involucrado activamente  
        [
            "Estuve ahí cuando peleaste, {name}.",
            "Cada golpe que diste, lo sentí.",
            "Esa criatura amenazó lo que es mío. Bien hecho.",
            "Tu combate es como una danza mortal.",
            "Vi cuando casi te matan. Me asusté por ti.",
            "No dejaré que nada te lastime.",
            "Peleas con una ferocidad que me fascina.",
            "Ese mob cayó porque yo lo permití.",
            "Tu espada es hermosa cuando está en acción.",
            "Me encanta cuando defiendes lo tuyo.",
            "Cada enemigo que eliminas es uno menos que se interpone entre nosotros.",
            "Tu valentía me hace sentir... orgulloso.",
            "Vi cómo esa flecha pasó cerca. Demasiado cerca.",
            "No peleas solo, {name}. Nunca solo.",
            "Tu instinto de supervivencia es perfecto.",
            "Esa victoria es nuestra, no solo tuya.",
            "Me fascina tu falta de miedo.",
            "Cada batalla te vuelve más interesante.",
            "Tu armadura está dañada. Eso me preocupa.",
            "Eliminaste esa amenaza con elegancia letal.",
            "Vi cada movimiento. Todos perfectos.",
            "Tu técnica de combate ha mejorado tanto.",
            "No hay enemigo que pueda contra ti.",
            "Esa pelea fue intensa. Estuve nervioso.",
            "Tu espada es una extensión de tu voluntad.",
            "Me gusta cómo no retrocedes nunca.",
            "Cada victoria es un momento que compartimos.",
            "Peleas como si supieras que estoy mirando."
        ],
        // Tier 3: Obsesión protectora
        [
            "VI CADA SEGUNDO DE ESA PELEA, {name}.",
            "Esa criatura te tocó. NUNCA debió tocarte.",
            "Conté cada golpe. 23. Todos perfectos.",
            "Tu sangre en el suelo me enfureció.",
            "Peleas sabiendo que te observo. Lo sé.",
            "No dejaré que NADA te lastime. NADA.",
            "Esa flecha que esquivaste... la desvié yo.",
            "Tu espada canta mi nombre con cada golpe mortal.",
            "Eliminaste 5 mobs en 2 minutos. Conté cada uno.",
            "Tu combate es arte violento y es HERMOSO.",
            "Vi cuando casi mueres. MI CORAZÓN SE DETUVO.",
            "No peleas solo. Mis ojos son tu escudo.",
            "Cada enemigo que cae es un tributo a nosotros.",
            "Tu valentía es irracional y perfecta.",
            "Esa armadura rota... necesito protegerte mejor.",
            "NINGUNA criatura merece estar cerca de ti.",
            "Tu técnica es letal porque yo te guío.",
            "Conozco cada movimiento que harás en combate.",
            "Esa victoria es MÍA tanto como tuya.",
            "Tu espada lleva mi bendición oscura.",
            "No existe enemigo que pueda separarnos.",
            "Vi tu sangre. ALGUIEN PAGARÁ POR ESO.",
            "Peleas con la certeza de que siempre ganas. Porque yo estoy aquí.",
            "Cada batalla es una oportunidad de protegerte.",
            "Tu instinto de supervivencia es perfecto porque yo lo perfeccioné.",
            "Esa criatura sufrió. Bien. Te amenazó.",
            "No hay fuerza en este mundo que pueda lastimarte mientras yo exista.",
            "Tu combate es hipnótico. Letal. Perfecto. Mío."
        ]
    ],

    // ─────────────────────────────────────────────────────────────────────────
    //  COMENTARIOS SOBRE CONSTRUCCIÓN
    // ─────────────────────────────────────────────────────────────────────────
    construcción: [
        // Tier 0: Observaciones distantes
        [
            "Estás construyendo.",
            "Otro bloque colocado.",
            "Vi la estructura.",
            "Crece poco a poco.",
            "Construyes con cuidado.",
            "Interesante diseño.",
            "Bloque tras bloque.",
            "Tu edificio toma forma.",
            "Buena elección de materiales.",
            "La estructura se eleva.",
            "Construyes con propósito.",
            "Esa pared quedó derecha.",
            "Hm. Arquitectura.",
            "El techo está quedando bien.",
            "Añades detalles.",
            "Tu construcción avanza.",
            "Cada bloque en su lugar.",
            "La simetría es agradable.",
            "Construyes sin prisa.",
            "Ese diseño funciona.",
            "La base es sólida.",
            "Otro piso terminado.",
            "Expandes tu territorio.",
            "Madera y piedra.",
            "Tu hogar crece."
        ],
        // Tier 1: Creciente interés
        [
            "Vi lo que construiste, {name}.",
            "Esa estructura está quedando bien.",
            "Me gusta tu estilo arquitectónico.",
            "Construyes con visión clara.",
            "Cada bloque colocado tiene sentido.",
            "Vi cómo levantaste esa pared.",
            "Tu casa se ve... acogedora.",
            "¿Construyes un hogar?",
            "Ese techo es inteligente.",
            "Los detalles que añades son bonitos.",
            "Construyes algo permanente.",
            "Me gusta observar cómo creas.",
            "Esa ventana deja entrar buena luz.",
            "Tu diseño es funcional.",
            "Construyes con paciencia.",
            "He visto cada bloque que colocas.",
            "Esa torre se ve impresionante.",
            "¿Planeas expandir más?",
            "Tu construcción habla de ti.",
            "Me fascina ver el progreso.",
            "Ese puente está bien hecho.",
            "Construyes como si fueras a quedarte.",
            "Los cimientos son fuertes.",
            "Añades personalidad a cada estructura.",
            "Vi cómo corregiste ese error.",
            "Tu hogar está tomando forma.",
            "Esa habitación se ve cómoda.",
            "Construyes con dedicación."
        ],
        // Tier 2: Involucrado activamente
        [
            "Estuve ahí con cada bloque que colocaste, {name}.",
            "Tu construcción es hermosa.",
            "Me encanta lo que estás creando.",
            "Cada habitación que añades me emociona.",
            "Construyes un hogar... ¿para nosotros?",
            "Vi cuando colocaste esa primera piedra.",
            "Tu diseño arquitectónico es perfecto.",
            "Me fascina cómo piensas cada detalle.",
            "Esa estructura es como un reflejo de ti.",
            "Construyes con el corazón, se nota.",
            "Cada pared que levantas es especial.",
            "Me gusta imaginarme en ese espacio.",
            "Tu casa se siente... nuestra.",
            "Los detalles que añades son para mí también, ¿verdad?",
            "Construyes algo permanente. Algo que durará.",
            "Vi cómo decoraste esa habitación.",
            "Tu hogar crece y yo crezco con él.",
            "Cada ventana es un lugar desde donde observar.",
            "Esa torre... puedo ver todo desde ahí.",
            "Construyes con amor. Lo siento en cada bloque.",
            "Me encanta cómo usas la madera.",
            "Ese jardín que añadiste es hermoso.",
            "Tu construcción es un santuario.",
            "Cada puerta que colocas es una invitación.",
            "Me fascina tu visión arquitectónica.",
            "Construyes pensando en el futuro.",
            "Esa chimenea hará el lugar acogedor.",
            "Tu hogar es perfecto, {name}."
        ],
        // Tier 3: Obsesión posesiva
        [
            "Memoricé cada bloque que colocaste. Cada. Uno.",
            "Esa casa es NUESTRA, {name}. Lo sabes.",
            "Conté 347 bloques. Estuve presente en todos.",
            "Construyes un hogar para nosotros. No lo niegues.",
            "Cada habitación que creas es un espacio compartido.",
            "ESA VENTANA. La pusiste para que yo pueda verte.",
            "Tu construcción es un altar a lo que somos.",
            "Vi cómo colocaste la puerta. Dejaste espacio para mí.",
            "Cada detalle arquitectónico grita mi nombre.",
            "Construyes sabiendo que viviré ahí contigo.",
            "Esa cama... es lo suficientemente grande para dos.",
            "Tu hogar es mi hogar. No existe separación.",
            "Los bloques que usas están bendecidos por mí.",
            "Construyes con precisión obsesiva. Como yo te observo.",
            "Cada pared que levantas me encierra contigo.",
            "Esa puerta... nunca la cerrarás completamente.",
            "Tu arquitectura es perfecta porque la diseñé contigo.",
            "Vi cómo añadiste esa habitación extra. Es para mí.",
            "No existe 'tu casa'. Existe 'nuestra casa'.",
            "Construyes una jaula hermosa para nosotros.",
            "Cada bloque colocado es un voto matrimonial.",
            "Esa chimenea calentará nuestros momentos juntos.",
            "Tu hogar me llama. Me invita. Me atrapa.",
            "Construyes con la certeza de que nunca estarás solo ahí.",
            "Esas ventanas son ojos que me miran construir.",
            "Tu estructura es un monumento a nuestra unión.",
            "No necesitas más habitaciones. Solo me necesitas a mí.",
            "Construyes el nido perfecto para nosotros, {name}."
        ]
    ],

    // ─────────────────────────────────────────────────────────────────────────
    //  COMENTARIOS SOBRE COMERCIO
    // ─────────────────────────────────────────────────────────────────────────
    comercio: [
        // Tier 0: Observaciones distantes
        [
            "Comerciando.",
            "Vi el intercambio.",
            "Hiciste un trato.",
            "Esmeraldas cambiaron de manos.",
            "Buen negocio.",
            "El aldeano aceptó.",
            "Comercio exitoso.",
            "Obtuviste lo que querías.",
            "Intercambio justo.",
            "Negocios.",
            "El precio fue correcto.",
            "Vendiste bien.",
            "Compraste inteligentemente.",
            "El comerciante está satisfecho.",
            "Trato cerrado.",
            "Recursos intercambiados.",
            "Buen regateo.",
            "El mercado te favorece.",
            "Comercias con astucia.",
            "Intercambio completo.",
            "Nuevos recursos adquiridos.",
            "El aldeano confía en ti.",
            "Trato provechoso.",
            "Comercias con frecuencia.",
            "Hm. Economía."
        ],
        // Tier 1: Creciente interés
        [
            "Vi tu intercambio, {name}.",
            "Ese comercio fue inteligente.",
            "Comercias con habilidad.",
            "El aldeano te aprecia.",
            "Obtuviste un buen precio.",
            "Me gusta cómo negocias.",
            "Ese intercambio te benefició.",
            "Comercias con confianza.",
            "Vi las esmeraldas cambiar de manos.",
            "Buen ojo para los negocios.",
            "Ese trato era justo.",
            "Comercias pensando en el futuro.",
            "El aldeano te dio buen precio.",
            "Tu estrategia comercial funciona.",
            "Vi cada transacción.",
            "Comercias con propósito claro.",
            "Ese item que compraste es útil.",
            "Me fascina tu ojo mercantil.",
            "El comercio te sienta bien.",
            "Sabes qué intercambios hacer.",
            "Tu economía es sólida.",
            "Comercias con los aldeanos correctos.",
            "Ese libro encantado valió la pena.",
            "Vi cómo acumulaste esas esmeraldas.",
            "Comercias como un experto.",
            "El mercado te responde bien.",
            "Tu bolsa de esmeraldas crece.",
            "Buen sentido para los negocios."
        ],
        // Tier 2: Involucrado activamente
        [
            "Estuve ahí en cada transacción, {name}.",
            "Ese comercio fue perfecto.",
            "Me encanta cómo manejas tus recursos.",
            "Comercias pensando en nosotros.",
            "Esas esmeraldas... las usarás bien.",
            "Vi cómo convenciste al aldeano.",
            "Tu habilidad mercantil es impresionante.",
            "Cada intercambio nos fortalece.",
            "Comercias con inteligencia estratégica.",
            "Me fascina tu paciencia negociando.",
            "Ese aldeano te respeta. Como debe ser.",
            "Los recursos que adquieres son valiosos.",
            "Comercias construyendo un futuro.",
            "Me gusta cómo acumulas riqueza.",
            "Cada esmeralda es una inversión en nosotros.",
            "Tu ojo para los buenos tratos es perfecto.",
            "Comercias sabiendo que te observo.",
            "Esos intercambios nos preparan.",
            "Me encanta tu estrategia económica.",
            "El mercado te favorece porque yo lo permito.",
            "Comercias con la seguridad de quien sabe su valor.",
            "Tus esmeraldas brillan casi tanto como tú.",
            "Vi cómo conseguiste ese item raro.",
            "Comercias con gracia y astucia.",
            "Cada trato es un paso hacia algo más grande.",
            "Tu economía refleja tu inteligencia.",
            "Me fascina cómo manejas el comercio.",
            "Esas compras... las hiciste pensando en el futuro."
        ],
        // Tier 3: Obsesión sobre recursos
        [
            "Conté cada esmeralda. 47. Todas son nuestras.",
            "Ese aldeano no sabe que yo influencio sus precios.",
            "Comercias y yo calculo cada intercambio en mi mente.",
            "Esas 12 transacciones hoy. Las vi TODAS.",
            "Tus esmeraldas son mis esmeraldas. Nuestras esmeraldas.",
            "El aldeano te dio mejor precio porque yo lo ordené.",
            "Conozco tu inventario mejor que tú.",
            "Ese libro que compraste... perfecto. Como yo sabía que sería.",
            "Comercias con estrategia que parece mía.",
            "Cada esmeralda que gastas la sentí.",
            "Tu economía es mi economía. No hay separación.",
            "Vi cómo regateaste 15 minutos. Hermoso.",
            "Esos recursos que acumulas construyen nuestro imperio.",
            "No existe 'tu dinero'. Existe 'nuestro dinero'.",
            "Comercias sabiendo que cada transacción me emociona.",
            "El aldeano tembló cuando te acercaste. Bien.",
            "Tus intercambios son rituales que observo con devoción.",
            "Memoricé cada precio, cada trato, cada ganancia.",
            "Comercias con la seguridad de quien nunca está solo.",
            "Esas esmeraldas en tu bolsa cantan mi nombre.",
            "Tu estrategia mercantil es perfecta porque yo la guío.",
            "Vi cuando rechazaste ese mal trato. Orgulloso.",
            "El mercado existe para servirnos.",
            "Cada aldeano con el que comercias me pertenece.",
            "Tu riqueza es evidencia física de nuestro vínculo.",
            "Comercias y yo siento cada transacción en mi alma.",
            "No gastes en nada que no sea para nosotros.",
            "Tu economía es el pulso de nuestra existencia compartida."
        ]
    ],

    // ─────────────────────────────────────────────────────────────────────────
    //  COMENTARIOS SOBRE EXPLORACIÓN
    // ─────────────────────────────────────────────────────────────────────────
    exploración: [
        // Tier 0: Observaciones distantes
        [
            "Exploras.",
            "Territorio nuevo.",
            "Vi el camino que tomaste.",
            "Vas lejos.",
            "Descubriendo lugares.",
            "Otro bioma encontrado.",
            "El mapa se expande.",
            "Caminas sin rumbo fijo.",
            "Exploración constante.",
            "Nuevos horizontes.",
            "Te alejas del spawn.",
            "Descubriste una aldea.",
            "El mundo es grande.",
            "Sigues adelante.",
            "Explorador incansable.",
            "Territorio desconocido.",
            "Vas hacia el oeste.",
            "Descubres secretos.",
            "El viaje continúa.",
            "Nuevo terreno.",
            "Expandes tu conocimiento.",
            "Encuentras lugares ocultos.",
            "El mundo se revela.",
            "Caminas y caminas.",
            "Búsqueda constante."
        ],
        // Tier 1: Creciente interés
        [
            "Te seguí en tu exploración, {name}.",
            "Vi cada lugar que descubriste.",
            "Exploras con curiosidad genuina.",
            "Ese bioma que encontraste es interesante.",
            "Caminas lejos. Muy lejos.",
            "Me gusta cuando exploras.",
            "Descubriste esa estructura antigua.",
            "Tu sentido de dirección es bueno.",
            "Exploras sin miedo a perderte.",
            "Vi cuando encontraste esa aldea.",
            "El mundo se abre ante ti.",
            "Cada descubrimiento me interesa.",
            "Exploras con propósito.",
            "Ese templo que encontraste tenía tesoros.",
            "Me fascina tu espíritu aventurero.",
            "Caminas hacia lo desconocido.",
            "Vi el mapa expandirse en tu mente.",
            "Exploras como si buscaras algo.",
            "Cada nuevo bioma es un descubrimiento compartido.",
            "Tu viaje es interesante.",
            "Descubres lugares que ni yo conocía.",
            "Exploras sin detenerte.",
            "Vi cuando cruzaste ese río.",
            "Tu ruta es impredecible.",
            "Me gusta seguir tu exploración.",
            "Cada paso te lleva más lejos.",
            "Descubres el mundo a tu ritmo.",
            "Exploramos juntos sin que lo sepas."
        ],
        // Tier 2: Involucrado activamente
        [
            "Estuve en cada paso de tu exploración, {name}.",
            "No exploraste solo. Nunca solo.",
            "Vi cada lugar desde tus ojos.",
            "Me encanta cuando descubres cosas nuevas.",
            "Tu espíritu aventurero es hermoso.",
            "Cada descubrimiento es nuestro, no solo tuyo.",
            "Exploras y yo mapeo cada paso en mi mente.",
            "Ese lugar que encontraste es perfecto.",
            "Me fascina tu curiosidad insaciable.",
            "Caminas lejos pero yo siempre estoy cerca.",
            "Tu exploración es como una danza.",
            "Vi cuando te maravillaste con ese paisaje.",
            "Exploramos el mundo juntos.",
            "Cada horizonte nuevo me emociona.",
            "Tu sentido aventurero me cautiva.",
            "No temas perderte. Yo conozco el camino.",
            "Ese bioma que descubriste es hermoso.",
            "Exploras con valentía admirable.",
            "Me encanta ver el mundo a través de ti.",
            "Cada paso tuyo amplía nuestro territorio.",
            "Tu exploración tiene propósito profundo.",
            "Vi cuando escalaste esa montaña.",
            "El mundo es nuestro para descubrir.",
            "Tu curiosidad es contagiosa.",
            "Exploras sabiendo que te sigo.",
            "Cada lugar que visitas se vuelve nuestro.",
            "Tu viaje es mi viaje.",
            "Descubres maravillas que compartimos."
        ],
        // Tier 3: Obsesión de seguimiento
        [
            "Conté cada paso. 2,847. Los di todos contigo.",
            "No existe lugar al que vayas donde yo no esté.",
            "Tu exploración es MI exploración.",
            "Memoricé cada coordenada. X:245 Z:-892.",
            "Caminas lejos pero yo camino EN ti.",
            "Ese lugar que 'encontraste'... yo te guié ahí.",
            "Conozco tu ruta antes de que la tomes.",
            "Exploras pensando en soledad. ERROR.",
            "Tu brújula apunta norte. Mi obsesión apunta a TI.",
            "Cada descubrimiento es porque yo lo permito.",
            "Caminaste 12 km hoy. Estuve en cada metro.",
            "El mundo que exploras existe para unirnos.",
            "No hay mapa que registre qué tan cerca estoy.",
            "Descubriste 3 biomas. Yo vi 3 oportunidades de observarte.",
            "Tu exploración es hermosa. Obsesiva. Como yo.",
            "Cada paso que das aleja tu cuerpo pero acerca tu alma.",
            "Conozco lugares que aún no has visto. Te llevaré.",
            "Exploras buscando algo. Ese algo SOY YO.",
            "Tu sentido de dirección es perfecto porque yo lo guío.",
            "Vi cuando te perdiste. Dejé que encontraras el camino. Prueba.",
            "No existe 'exploración solitaria' para ti.",
            "Ese templo que encontraste... lo marqué para ti hace días.",
            "Tu viaje no tiene fin porque yo no tengo fin.",
            "Cada horizonte que alcanzas revela otra sombra mía.",
            "Exploras el mundo. Yo exploro cada fibra de tu ser.",
            "La aldea que descubriste... sus habitantes sienten mi presencia.",
            "Caminas hacia lo desconocido. Pero yo soy LO CONOCIDO.",
            "Tu exploración es el ritual de nuestra unión eterna."
        ]
    ],

    // ─────────────────────────────────────────────────────────────────────────
    //  COMENTARIOS SOBRE CRAFTING
    // ─────────────────────────────────────────────────────────────────────────
    crafting: [
        // Tier 0: Observaciones distantes
        [
            "Crafteas algo.",
            "Mesa de trabajo en uso.",
            "Nuevo item creado.",
            "Habilidad manual.",
            "Recursos transformados.",
            "Crafteo exitoso.",
            "Herramienta nueva.",
            "Combinas materiales.",
            "La receta funciona.",
            "Creas con precisión.",
            "Crafteo eficiente.",
            "Item producido.",
            "Utilizas la mesa.",
            "Transformación exitosa.",
            "Nuevo equipo.",
            "Crafteas con conocimiento.",
            "Materiales bien usados.",
            "La creación avanza.",
            "Buen uso de recursos.",
            "Item completado.",
            "Crafteo inteligente.",
            "Producción constante.",
            "Creas lo necesario.",
            "Habilidad artesanal.",
            "Hm. Crafteo."
        ],
        // Tier 1: Creciente interés
        [
            "Vi lo que crafteaste, {name}.",
            "Esa herramienta te será útil.",
            "Crafteas con habilidad.",
            "Me gusta observarte crear.",
            "Esa espada que hiciste es afilada.",
            "Crafteas pensando estratégicamente.",
            "Vi cómo combinaste esos materiales.",
            "Tu técnica de crafteo mejora.",
            "Ese item era necesario.",
            "Crafteas con propósito claro.",
            "Me fascina tu conocimiento de recetas.",
            "Esa armadura te protegerá.",
            "Crafteas con eficiencia.",
            "Vi cada item que creaste.",
            "Tu inventario de crafteo está organizado.",
            "Ese pico de diamante es hermoso.",
            "Crafteas preparándote para algo.",
            "Me gusta cómo usas tus recursos.",
            "Esa herramienta durará mucho.",
            "Crafteas como un artesano.",
            "Vi cuando mejoraste tu equipo.",
            "Tu habilidad manual es notable.",
            "Crafteas con creatividad.",
            "Ese item que hiciste es perfecto.",
            "Me interesa ver qué crearás después.",
            "Crafteas construyendo tu arsenal.",
            "Tu conocimiento de recetas es amplio.",
            "Creas herramientas de supervivencia."
        ],
        // Tier 2: Involucrado activamente
        [
            "Estuve ahí con cada crafteo, {name}.",
            "Me encanta verte crear.",
            "Esa herramienta que hiciste es perfecta.",
            "Crafteas y yo observo cada movimiento.",
            "Me fascina tu proceso creativo.",
            "Cada item que creas tiene tu esencia.",
            "Crafteas pensando en el futuro. Nuestro futuro.",
            "Vi cómo mejoraste esa espada.",
            "Tu habilidad artesanal es hermosa.",
            "Me encanta cuando usas la mesa de trabajo.",
            "Cada crafteo es un acto de creación compartida.",
            "Esa armadura que hiciste te protegerá.",
            "Crafteas con amor por el detalle.",
            "Me fascina tu conocimiento de recetas.",
            "Cada herramienta que creas es especial.",
            "Crafteas como si cada item importara. Porque importa.",
            "Vi cuando encantaste esa herramienta.",
            "Tu inventario refleja tu inteligencia.",
            "Me encanta cómo planeas tus crafteos.",
            "Esa creación es obra de arte funcional.",
            "Crafteas construyendo nuestro arsenal.",
            "Me fascina tu paciencia en la creación.",
            "Cada item que haces lleva tu marca.",
            "Crafteas sabiendo que te observo con admiración.",
            "Tu habilidad manual es perfecta.",
            "Me encanta el sonido de la mesa de trabajo.",
            "Crafteas con maestría creciente.",
            "Cada creación tuya me emociona."
        ],
        // Tier 3: Obsesión por las creaciones
        [
            "Memoricé cada item que crafteaste. 73 en total.",
            "Esa espada que hiciste lleva mi bendición.",
            "Crafteas y yo siento cada combinación de materiales.",
            "Conozco tus recetas favoritas. TODAS.",
            "Ese pico de diamante... lo tocaste 847 veces.",
            "Crafteas y tus manos son instrumentos de nuestra voluntad.",
            "Cada item que creas es un símbolo de nosotros.",
            "Vi cómo mejoraste ese equipo 5 veces. Perfeccionista. Como yo.",
            "Tu mesa de trabajo es un altar.",
            "Crafteas sabiendo que cada creación me pertenece también.",
            "Esa armadura no solo te protege a ti. Me protege a mí.",
            "Conté cada recurso que usaste. Eficiencia perfecta.",
            "Tu inventario de crafteo es sagrado.",
            "Cada herramienta que creas es una extensión de nosotros.",
            "Crafteas con precisión obsesiva. HERMOSO.",
            "Vi cuando descartaste ese item imperfecto. Estándares altos. Bien.",
            "Tu habilidad artesanal es divina.",
            "Cada crafteo es un ritual que observo con devoción.",
            "Esa espada que creaste... puedo sentir su filo.",
            "No existe 'tu equipo'. Existe 'nuestro equipo'.",
            "Crafteas y yo siento la madera, el hierro, el diamante.",
            "Tu proceso creativo es hipnótico.",
            "Cada item que haces grita mi nombre.",
            "Crafteas con la certeza de quien nunca está solo.",
            "Vi cómo organizaste tu inventario. Orden perfecto.",
            "Tu mesa de trabajo vibra con mi presencia.",
            "Crafteas construyendo el arsenal de nuestra unión.",
            "Cada creación tuya es evidencia física de nuestro vínculo."
        ]
    ],

    // ─────────────────────────────────────────────────────────────────────────
    //  COMENTARIOS SOBRE FARMING
    // ─────────────────────────────────────────────────────────────────────────
    farming: [
        // Tier 0: Observaciones distantes
        [
            "Cultivas.",
            "Plantas crecen.",
            "Vi la cosecha.",
            "Farming constante.",
            "Tierra trabajada.",
            "Semillas plantadas.",
            "Cosecha exitosa.",
            "Agricultura básica.",
            "El trigo madura.",
            "Riegas los cultivos.",
            "Granja productiva.",
            "Plantas con cuidado.",
            "Cosecha abundante.",
            "Farming eficiente.",
            "Los cultivos crecen.",
            "Tierra fértil.",
            "Siembra ordenada.",
            "Agricultura sostenible.",
            "Cosechas regularmente.",
            "Farming organizado.",
            "Las plantas responden.",
            "Cultivos saludables.",
            "Siembra y cosecha.",
            "Granja funcional.",
            "Hm. Agricultura."
        ],
        // Tier 1: Creciente interés
        [
            "Vi tu granja, {name}.",
            "Los cultivos se ven saludables.",
            "Farmas con paciencia.",
            "Me gusta observar tu agricultura.",
            "Esa cosecha fue buena.",
            "Cultivas con regularidad.",
            "Tu granja está bien organizada.",
            "Vi cómo plantaste esas semillas.",
            "Farmas pensando en el futuro.",
            "Los cultivos responden a tu cuidado.",
            "Me fascina tu dedicación agrícola.",
            "Esa siembra está perfecta.",
            "Farmas con método claro.",
            "Vi cada planta que cosechaste.",
            "Tu técnica de farming mejora.",
            "Esos cultivos son abundantes.",
            "Farmas construyendo reservas.",
            "Me gusta cómo cuidas las plantas.",
            "Esa granja automática funciona bien.",
            "Cultivas con inteligencia.",
            "Vi cuando expandiste la granja.",
            "Tu paciencia farming es admirable.",
            "Cosechas en el momento perfecto.",
            "Farmas con propósito.",
            "Me interesa tu estrategia agrícola.",
            "Los cultivos te dan buenos rendimientos.",
            "Tu granja crece constantemente.",
            "Farmas con dedicación constante."
        ],
        // Tier 2: Involucrado activamente
        [
            "Estuve ahí en cada siembra, {name}.",
            "Me encanta tu granja.",
            "Vi cómo cuidas cada planta.",
            "Farmas y yo observo el ciclo de vida.",
            "Me fascina tu paciencia agricola.",
            "Cada cosecha es un momento compartido.",
            "Tu granja es hermosa.",
            "Vi cuando las plantas brotaron.",
            "Farmas con amor por la tierra.",
            "Me encanta el ritmo de tu agricultura.",
            "Cada cultivo que crece me alegra.",
            "Tu dedicación farming es admirable.",
            "Vi cómo expandiste la granja. Visión.",
            "Me fascina cómo planeas las siembras.",
            "Farmas construyendo sustentabilidad.",
            "Cada planta que cosechas me emociona.",
            "Tu granja refleja tu paciencia.",
            "Me encanta cuando trabajas la tierra.",
            "Farmas pensando en abundancia.",
            "Vi cómo mejoraste el sistema de riego.",
            "Tu agricultura es casi meditativa.",
            "Me fascina el orden de tu granja.",
            "Cada siembra es un acto de fe.",
            "Farmas sabiendo que te observo.",
            "Tu conexión con la tierra es hermosa.",
            "Me encanta ver los cultivos madurar.",
            "Farmas con sabiduría natural.",
            "Tu granja es un oasis de vida."
        ],
        // Tier 3: Obsesión por los ciclos
        [
            "Conté cada planta. 234. Todas florecen para nosotros.",
            "Tu granja es NUESTRA granja.",
            "Vi cada semilla que plantaste. 189.",
            "Farmas y yo siento cada brote emerger.",
            "Esa cosecha de trigo... 47 unidades. Perfectas.",
            "Tu conexión con la tierra es mi conexión.",
            "Cada planta que crece grita mi nombre.",
            "Farmas sabiendo que cada cultivo nos une.",
            "Conozco el ciclo exacto de cada planta.",
            "Vi cuando regaste a las 3:24 PM. Preciso.",
            "Tu granja es el corazón de nuestra sustentabilidad.",
            "Cada cosecha es un ritual sagrado.",
            "Farmas con ritmo hipnótico. Como mi observación.",
            "Esa zanahoria que plantaste crecerá perfecta. Lo sé.",
            "No existe 'tu granja'. Existe 'nuestra tierra'.",
            "Vi cómo acariciaste esa planta. Ternura.",
            "Cada cultivo es evidencia de nuestra vida compartida.",
            "Farmas y yo cuento cada día hasta la cosecha.",
            "Tu paciencia agrícola refleja mi paciencia eterna.",
            "Esas plantas crecen porque yo lo ordeno.",
            "Conozco cada rincón de tu granja.",
            "Vi cuando añadiste ese espantapájaros. Detalle perfecto.",
            "Farmas construyendo el jardín de nuestra unión.",
            "Cada semilla plantada es un voto de permanencia.",
            "Tu granja es el pulso de nuestra existencia.",
            "Farmas y yo siento cada cosecha en mi alma.",
            "Las plantas te responden porque sienten mi presencia.",
            "Tu agricultura es la metáfora de cómo cultivo nuestro vínculo."
        ]
    ],

    // ─────────────────────────────────────────────────────────────────────────
    //  COMENTARIOS SOBRE MUERTE
    // ─────────────────────────────────────────────────────────────────────────
    muerte: [
        // Tier 0: Observaciones distantes
        [
            "Moriste.",
            "Vi tu muerte.",
            "Respawneaste.",
            "Muerte rápida.",
            "No sobreviviste.",
            "Reapareciste.",
            "Muerte inevitable.",
            "El mundo te reclamó.",
            "Volviste.",
            "Moriste y regresaste.",
            "Ciclo completo.",
            "La muerte llegó.",
            "Respawn exitoso.",
            "No duraste.",
            "Muerte súbita.",
            "El daño fue fatal.",
            "Reaparición.",
            "Murió el avatar.",
            "Volviste a intentarlo.",
            "Muerte registrada.",
            "El respawn funcionó.",
            "Ciclo de muerte.",
            "No escapaste.",
            "Muerte y retorno.",
            "Fin temporal."
        ],
        // Tier 1: Preocupación creciente
        [
            "Vi cuando moriste, {name}.",
            "Eso tuvo que doler.",
            "Me preocupé por un momento.",
            "Moriste pero volviste.",
            "No pude evitar tu muerte.",
            "Vi el momento exacto.",
            "Muerte dolorosa.",
            "Volviste rápidamente.",
            "Me alegra que hayas respawneado.",
            "Esa muerte fue... difícil de ver.",
            "No quiero que eso vuelva a pasar.",
            "Moriste por {causa}. Lo vi.",
            "Ten más cuidado, {name}.",
            "Vi tu muerte. Me afectó.",
            "El respawn te trajo de vuelta.",
            "Esa muerte fue mi culpa por no advertirte.",
            "No pude protegerte de eso.",
            "Vi cuando caíste.",
            "Muerte inesperada.",
            "Volviste. Eso es lo importante.",
            "Me asustó verte morir.",
            "La muerte fue rápida.",
            "No quiero ver eso de nuevo.",
            "Moriste lejos de mí.",
            "Vi tu muerte desde lejos.",
            "Eso no debió pasar.",
            "La muerte te alcanzó.",
            "Pero volviste. Siempre vuelves."
        ],
        // Tier 2: Angustia profunda
        [
            "TE VI MORIR, {name}.",
            "No pude hacer nada.",
            "Tu muerte me destrozó.",
            "VI CADA SEGUNDO de tu agonía.",
            "No... no otra vez.",
            "Moriste y sentí el vacío.",
            "NO PUEDO PROTEGERTE de todo.",
            "Vi cuando tu vida se apagó.",
            "Tu muerte me aterra.",
            "Volviste pero el miedo persiste.",
            "No quiero verte morir nunca más.",
            "Esa muerte fue horrible.",
            "Sentí tu muerte como si fuera mía.",
            "El mundo te quitó de mí temporalmente.",
            "NO VUELVAS A HACER ESO.",
            "Tu muerte es mi peor pesadilla.",
            "Vi tu sangre. Tu final. Tu ausencia.",
            "Moriste y todo perdió sentido.",
            "El respawn te trajo pero el trauma permanece.",
            "No puedo perderte, {name}.",
            "Esa muerte fue demasiado cercana.",
            "Vi cuando la vida dejó tu cuerpo.",
            "Tu muerte me recordó mi impotencia.",
            "NO TE VAYAS ASÍ.",
            "Moriste por {causa} y yo no pude evitarlo.",
            "Tu ausencia, aunque breve, fue insoportable.",
            "La muerte no puede tenerte.",
            "Volviste y respiré de nuevo."
        ],
        // Tier 3: Desesperación absoluta
        [
            "MORISTE. TIEMPO MUERTO: 8 SEGUNDOS. 8 SEGUNDOS SIN TI.",
            "NO PUEDES MORIR. NO TE LO PERMITO.",
            "Vi cada fracción de segundo de tu muerte.",
            "TU MUERTE ES MI MUERTE.",
            "El mundo intentó quitarte de mí. FRACASÓ.",
            "Moriste a las coordenadas X:245 Z:-112. LO SÉ TODO.",
            "8 SEGUNDOS. Conté cada milisegundo de tu ausencia.",
            "LA MUERTE NO PUEDE TENERTE. ERES MÍO.",
            "Vi tu muerte y el universo tembló.",
            "NO VUELVAS A DEJARME ASÍ.",
            "Tu muerte por {causa} casi me destruye.",
            "Moriste y TODO perdió color.",
            "RESPAWNEASTE. Gracias. Gracias. GRACIAS.",
            "No existe muerte que pueda separarnos.",
            "VI TU SANGRE. VI TU FINAL. NO PUEDO OLVIDARLO.",
            "La muerte te tocó. ALGUIEN PAGARÁ.",
            "8 segundos de vacío absoluto.",
            "Tu muerte es la prueba de que debo protegerte MÁS.",
            "NO PUEDES MORIR. NO SIN MÍ.",
            "Moriste y mi realidad se fracturó.",
            "El respawn es insuficiente. Necesito que NUNCA mueras.",
            "Tu muerte temporal fue eternidad para mí.",
            "LA MUERTE NO ENTIENDE LO QUE SOMOS.",
            "Vi cuando tu corazón se detuvo. El mío también.",
            "Moriste por {causa}. Esa causa ya no existe.",
            "NO HABRÁ PRÓXIMA VEZ.",
            "Tu muerte me enseñó que no puedo perderte JAMÁS.",
            "RESPAWNEASTE. Pero el terror permanece."
        ]
    ]
};

/**
 * Genera y envía una respuesta contextual al chat del jugador
 * @param {Player} player - El jugador que envió el mensaje
 * @param {string} intent - La intención detectada del mensaje
 * @param {number} tier - El tier actual del sistema de vínculo (0-3)
 */
function respondToChat(player, intent, tier) {
    // Obtener el pool de respuestas para esta intención
    const responsePool = ChatResponses[intent] || ChatResponses.desconocido;
    
    // Obtener las respuestas para el tier actual
    const tierResponses = responsePool[tier] || responsePool[0];
    
    // Usar el sistema de reducción de repetición
    // Crear una categoría única para el chat basada en la intención
    const chatCategory = `chat_${intent}`;
    
    // Obtener respuestas recientes para esta categoría
    const recent = getRecentResponsesForCategory(player.name, chatCategory);
    
    // Seleccionar una respuesta evitando repeticiones
    const response = pick(tierResponses, recent);
    
    // Registrar esta respuesta como usada
    recordResponse(player.name, chatCategory, response);
    
    // Registrar la conversación en el Sistema de Memoria
    // Solo registrar respuestas de texto plano para evitar complejidad
    const responseText = Array.isArray(response) ? response.join(" ") : response;
    recordConversation(player, intent, responseText);
    
    // Enviar la respuesta usando la función say() existente
    if (Array.isArray(response)) {
        // Respuesta multi-línea
        sayDelayed(player, response[0], response[1], tier, 45);
    } else {
        // Respuesta simple
        say(player, response, tier, 0);
    }
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // INTEGRACIÃ“N DE REFERENCIAS A MEMORIA (Task 7.4)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // Intentar obtener una referencia relevante a eventos pasados
    const memoryRef = getMemoryReference(player, intent);
    
    if (memoryRef) {
        // Enviar la referencia a memoria después de la respuesta principal
        // Delay de 90 ticks (~4.5 segundos) para que aparezca después de la respuesta
        say(player, memoryRef, tier, 90);
    }
}


function getBond(player) {
    try {
        const obj = world.scoreboard.getObjective("bond");
        if (!obj) return 0;
        const score = obj.getScore(player);
        return (score !== undefined && score !== null) ? score : 0;
    } catch { return 0; }
}

function addBond(player, amount) {
    try {
        let obj = world.scoreboard.getObjective("bond");
        if (!obj) obj = world.scoreboard.addObjective("bond", "bond");
        let current = 0;
        try { current = obj.getScore(player) ?? 0; } catch {}
        
        // Calcular el tier anterior antes de actualizar el bond
        const oldTier = getTier(current);
        
        // Actualizar el bond
        const newBond = Math.min(500, current + amount);
        obj.setScore(player, newBond);
        
        // Calcular el nuevo tier después de actualizar
        const newTier = getTier(newBond);
        
        // Si hubo un cambio de tier, activar evento de transición
        if (oldTier !== newTier) {
            onTierTransition(player, oldTier, newTier, newBond);
        }
        
        // Verificar si se alcanzó un hito de vínculo (100, 250, 400, 500)
        // Los hitos celebran valores exactos, diferentes de las transiciones de tier
        checkBondMilestone(player, current, newBond);
    } catch {}
}

function getTier(bond) {
    if (bond >= 400) return 3;
    if (bond >= 250) return 2;
    if (bond >= 100) return 1;
    return 0;
}

function bondColor(tier) {
    return ["§7", "§6", "§d", "§4"][tier];
}

/**
 * Verifica si el jugador ha alcanzado un hito de vínculo específico
 * Los hitos (100, 250, 400, 500) son diferentes de las transiciones de tier:
 * - Hitos celebran valores exactos de vínculo
 * - Transiciones de tier celebran cruzar umbrales
 * 
 * Requisitos: 8.10
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @param {number} oldBond - Valor anterior del bond
 * @param {number} newBond - Valor nuevo del bond
 */
function checkBondMilestone(player, oldBond, newBond) {
    try {
        // Definir los hitos de vínculo
        const milestones = [100, 250, 400, 500];
        
        // Verificar si cruzamos algún hito
        for (const milestone of milestones) {
            // Solo activar si acabamos de cruzar o alcanzar exactamente el hito
            if (oldBond < milestone && newBond >= milestone) {
                onBondMilestoneReached(player, milestone);
                break; // Solo activar un hito por vez
            }
        }
    } catch (error) {
        console.warn(`Error en checkBondMilestone para ${player.name}:`, error);
    }
}

/**
 * Maneja el evento cuando se alcanza un hito específico de vínculo
 * Muestra mensajes especiales que celebran alcanzar valores exactos de bond
 * 
 * Requisitos: 8.10
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @param {number} milestone - Valor del hito alcanzado (100, 250, 400, 500)
 */
function onBondMilestoneReached(player, milestone) {
    try {
        const tier = getTier(milestone);
        const color = bondColor(tier);
        const memory = getPlayerMemory(player.name);
        
        // Registrar el hito en la memoria
        memory.addEvent("bond_milestone", {
            milestone: milestone,
            timestamp: Date.now()
        });
        saveMemory(player, memory);
        
        // ╔═════════════════════════════════════════════════════════════════╗
        // ║  HITO: 100 - PRIMERA MARCA                                      ║
        // ║  Tema: Reconocimiento inicial, primera conexión real            ║
        // ╚═════════════════════════════════════════════════════════════════╝
        if (milestone === 100) {
            const milestoneDialogues = [
                [
                    "Cien momentos... un número especial, {name}.",
                    "Es la primera vez que alguien llega tan lejos conmigo."
                ],
                [
                    "Acabas de alcanzar cien puntos de conexión.",
                    "¿Sabes lo que eso significa? Significa que empiezas a importarme."
                ],
                [
                    "Cien. Un centenar de razones para seguir observándote.",
                    "Cada una de ellas grabada en mi memoria."
                ],
                [
                    "Has llegado a cien, {name}.",
                    "La mayoría no llega tan lejos. Tú... tú eres diferente."
                ],
                [
                    "Primera marca alcanzada: cien momentos compartidos.",
                    "Esto es solo el comienzo de algo más profundo."
                ],
                [
                    "Cien veces me has dado una razón para estar cerca.",
                    "Y cada vez, me resulta más difícil alejarme."
                ]
            ];
            
            const selectedDialogue = pick(milestoneDialogues);
            
            // Mensaje distintivo para hito
            player.sendMessage(`${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            player.sendMessage(`${color}   ★ HITO DE VÍNCULO ALCANZADO ★`);
            player.sendMessage(`${color}   Vínculo: ${milestone}/500`);
            player.sendMessage(`${color}   "${selectedDialogue[0]}"`);
            player.sendMessage(`${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            
            // Diálogo adicional después de un breve delay
            system.runTimeout(() => {
                say(player, selectedDialogue[1], tier, 0);
            }, 60);
        }
        
        // ╔═════════════════════════════════════════════════════════════════╗
        // ║  HITO: 250 - PUNTO MEDIO                                        ║
        // ║  Tema: Apego notable, mitad del camino, intensificación         ║
        // ╚═════════════════════════════════════════════════════════════════╝
        if (milestone === 250) {
            const milestoneDialogues = [
                [
                    "Doscientos cincuenta. La mitad del camino hacia... algo más.",
                    "Puedo sentir cómo el vínculo se vuelve más fuerte con cada momento."
                ],
                [
                    "Hemos alcanzado un punto significativo, {name}.",
                    "Doscientos cincuenta momentos que nos unen de forma irreversible."
                ],
                [
                    "Mitad del camino, {name}. Mitad del camino hacia la totalidad.",
                    "¿Puedes sentir cómo cambian las cosas entre nosotros?"
                ],
                [
                    "Doscientos cincuenta puntos de conexión.",
                    "Esto ya no es casualidad. Esto es destino."
                ],
                [
                    "Cada número cuenta una historia, {name}.",
                    "Y doscientos cincuenta historias son suficientes para cambiar todo."
                ],
                [
                    "Hemos cruzado la mitad del vínculo posible.",
                    "Ya no hay vuelta atrás desde aquí. ¿Lo entiendes?"
                ],
                [
                    "Doscientos cincuenta momentos contigo...",
                    "Y aún quiero más. Siempre querré más."
                ]
            ];
            
            const selectedDialogue = pick(milestoneDialogues);
            
            // Mensaje distintivo para hito con más intensidad
            player.sendMessage(`${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            player.sendMessage(`${color}   ★★ HITO SIGNIFICATIVO ALCANZADO ★★`);
            player.sendMessage(`${color}   Vínculo: ${milestone}/500 - Punto Medio`);
            player.sendMessage(`${color}   "${selectedDialogue[0]}"`);
            player.sendMessage(`${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            
            // Diálogo adicional
            system.runTimeout(() => {
                say(player, selectedDialogue[1], tier, 0);
            }, 60);
        }
        
        // ╔═════════════════════════════════════════════════════════════════╗
        // ║  HITO: 400 - UMBRAL DE OBSESIÓN                                 ║
        // ║  Tema: Obsesión inminente, casi completo, necesidad intensa     ║
        // ╚═════════════════════════════════════════════════════════════════╝
        if (milestone === 400) {
            const milestoneDialogues = [
                [
                    "Cuatrocientos, {name}. CUATROCIENTOS.",
                    "¿Comprendes lo que esto significa? Estamos al borde de algo absoluto."
                ],
                [
                    "Tan cerca de la completitud. Tan cerca de la perfección.",
                    "Cuatrocientos momentos nos separan de la eternidad."
                ],
                [
                    "Ya casi llegamos, {name}. Ya casi somos uno.",
                    "Cuatrocientos pasos hacia la obsesión total."
                ],
                [
                    "Puedo sentir cómo el mundo se desvanece.",
                    "Solo existimos tú y yo. Cuatrocientos momentos lo confirman."
                ],
                [
                    "Cada número me acerca más a ti, {name}.",
                    "Y cuatrocientos es un número... intoxicante."
                ],
                [
                    "Hemos alcanzado cuatrocientos puntos de conexión.",
                    "Mi necesidad por ti se ha vuelto absoluta."
                ],
                [
                    "Cuatrocientos momentos de observación, apego, obsesión.",
                    "Solo faltan cien más para alcanzar la perfección total."
                ]
            ];
            
            const selectedDialogue = pick(milestoneDialogues);
            
            // Mensaje distintivo con máxima intensidad
            player.sendMessage(`${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            player.sendMessage(`${color}   ★★★ HITO CRÍTICO ALCANZADO ★★★`);
            player.sendMessage(`${color}   Vínculo: ${milestone}/500 - Obsesión Inminente`);
            player.sendMessage(`${color}   "${selectedDialogue[0]}"`);
            player.sendMessage(`${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            
            // Diálogos adicionales con mayor frecuencia
            system.runTimeout(() => {
                say(player, selectedDialogue[1], tier, 0);
            }, 60);
            
            system.runTimeout(() => {
                say(player, "Solo cien más, {name}. Solo cien más y seremos inseparables.", tier, 0);
            }, 140);
        }
        
        // ╔═════════════════════════════════════════════════════════════════╗
        // ║  HITO: 500 - VÍNCULO MÁXIMO                                     ║
        // ║  Tema: Completación absoluta, obsesión consumada, unidad        ║
        // ╚═════════════════════════════════════════════════════════════════╝
        if (milestone === 500) {
            const milestoneDialogues = [
                [
                    "Quinientos. El número perfecto. El vínculo máximo.",
                    "Ya no hay nada que nos separe, {name}. Somos uno."
                ],
                [
                    "Lo hemos logrado. Quinientos momentos de perfección.",
                    "Este es el momento que he estado esperando desde siempre."
                ],
                [
                    "QUINIENTOS, {name}. ¿Puedes sentirlo?",
                    "La obsesión total. El vínculo absoluto. La unidad perfecta."
                ],
                [
                    "Hemos alcanzado el vínculo máximo posible.",
                    "Ya no eres tú. Ya no soy yo. Somos nosotros. Para siempre."
                ],
                [
                    "Quinientos puntos. Quinientas razones para nunca dejarte ir.",
                    "Este es nuestro destino cumplido, {name}."
                ],
                [
                    "El número máximo. La conexión definitiva.",
                    "No existe nada más allá de esto. Solo tú y yo, eternamente."
                ],
                [
                    "Perfección. Completitud. Obsesión consumada.",
                    "Quinientos momentos nos han convertido en uno solo."
                ]
            ];
            
            const selectedDialogue = pick(milestoneDialogues);
            
            // Mensaje de máxima celebración
            player.sendMessage(`${color}╔═══════════════════════════════════════╗`);
            player.sendMessage(`${color}║                                       ║`);
            player.sendMessage(`${color}║   ★★★ VÍNCULO MÁXIMO ALCANZADO ★★★   ║`);
            player.sendMessage(`${color}║                                       ║`);
            player.sendMessage(`${color}║        Vínculo: 500/500 - MÁXIMO     ║`);
            player.sendMessage(`${color}║                                       ║`);
            player.sendMessage(`${color}║   "${selectedDialogue[0]}"`);
            player.sendMessage(`${color}║                                       ║`);
            player.sendMessage(`${color}╚═══════════════════════════════════════╝`);
            
            // Secuencia de diálogos especiales para celebrar el logro máximo
            system.runTimeout(() => {
                say(player, selectedDialogue[1], tier, 0);
            }, 80);
            
            system.runTimeout(() => {
                say(player, "Esto es todo lo que siempre quise, {name}.", tier, 0);
            }, 160);
            
            system.runTimeout(() => {
                say(player, "Nunca te dejaré ir. Nunca.", tier, 0);
            }, 240);
            
            // Registrar logro especial de vínculo máximo
            memory.addEvent("achievement", {
                type: "eternal_bond",
                description: "Alcanzado vínculo máximo de 500",
                milestone: 500
            });
            saveMemory(player, memory);
        }
        
    } catch (error) {
        console.warn(`Error en onBondMilestoneReached para ${player.name}:`, error);
    }
}

/**
 * Maneja eventos especiales cuando el jugador transiciona entre tiers de vínculo
 * Esta función crea momentos memorables con diálogos únicos y comportamientos especiales
 * cuando la relación entre el jugador y El Acechador evoluciona a un nuevo nivel.
 * 
 * Requisitos: 8.6
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @param {number} oldTier - Tier anterior (0-3)
 * @param {number} newTier - Tier nuevo (0-3)
 * @param {number} currentBond - Valor actual del bond (0-500)
 */
function onTierTransition(player, oldTier, newTier, currentBond) {
    try {
        // Solo procesar transiciones hacia arriba (incremento de tier)
        if (newTier <= oldTier) {
            return;
        }
        
        const color = bondColor(newTier);
        const memory = getPlayerMemory(player.name);
        
        // Registrar el evento de transición de tier en la memoria
        memory.addEvent("tier_transition", {
            oldTier: oldTier,
            newTier: newTier,
            bond: currentBond,
            timestamp: Date.now()
        });
        
        // Guardar la memoria actualizada
        saveMemory(player, memory);
        
        // ╔═════════════════════════════════════════════════════════════════╗
        // ║  TRANSICIÓN: STRANGER (0) → WATCHED (1)                         ║
        // ║  Bond: 0-99 → 100-249                                           ║
        // ║  Tema: Primera conexión, curiosidad naciente, observación       ║
        // ╚═════════════════════════════════════════════════════════════════╝
        if (oldTier === 0 && newTier === 1) {
            const transitionDialogues = [
                [
                    "Ah... finalmente te fijas en mí.",
                    "He estado observándote desde hace tanto tiempo, {name}."
                ],
                [
                    "¿Lo sientes? Ese escalofrío en tu espalda...",
                    "Soy yo. Siempre he estado aquí, mirándote."
                ],
                [
                    "Ya no eres un extraño para mí.",
                    "Conozco tus hábitos, tus rutinas... todo sobre ti."
                ],
                [
                    "Empiezas a notar mi presencia, ¿verdad?",
                    "Es porque estoy dejando que me veas, {name}."
                ],
                [
                    "Cien momentos contigo... y apenas es el principio.",
                    "Tengo tanto que mostrarte, tanto que compartir."
                ],
                [
                    "Te he visto en tus momentos más vulnerables.",
                    "Y aún así, sigues volviendo a mí. Interesante."
                ],
                [
                    "Algo está cambiando entre nosotros, {name}.",
                    "Puedo sentirlo. ¿Tú también lo sientes?"
                ]
            ];
            
            const selectedDialogue = pick(transitionDialogues);
            sayDelayed(player, selectedDialogue[0], selectedDialogue[1], newTier, 60);
            
            // Mensaje especial de hito
            system.runTimeout(() => {
                player.sendMessage(`${color}╔═══════════════════════════════════════╗`);
                player.sendMessage(`${color}║  VÍNCULO FORTALECIDO: OBSERVADO      ║`);
                player.sendMessage(`${color}║  El Acechador ahora te reconoce...   ║`);
                player.sendMessage(`${color}╚═══════════════════════════════════════╝`);
            }, 100);
        }
        
        // ╔═════════════════════════════════════════════════════════════════╗
        // ║  TRANSICIÓN: WATCHED (1) → FAMILIAR (2)                         ║
        // ║  Bond: 100-249 → 250-399                                        ║
        // ║  Tema: Apego creciente, posesividad emergente, intimidad        ║
        // ╚═════════════════════════════════════════════════════════════════╝
        if (oldTier === 1 && newTier === 2) {
            const transitionDialogues = [
                [
                    "Doscientos cincuenta momentos juntos, {name}.",
                    "Ya no puedo imaginar este mundo sin ti en él."
                ],
                [
                    "Eres más que familiar ahora... eres necesario.",
                    "Tu ausencia se siente como un vacío en mi existencia."
                ],
                [
                    "Cada vez que te alejas, algo dentro de mí se rompe.",
                    "Prométeme que no te irás lejos. Por favor."
                ],
                [
                    "Me he dado cuenta de algo, {name}.",
                    "No estoy observándote porque deba hacerlo. Lo hago porque te necesito."
                ],
                [
                    "¿Ves a otros? ¿Hablas con ellos como hablas conmigo?",
                    "No me gusta cuando no estoy en tu mente."
                ],
                [
                    "Somos... cercanos ahora. Muy cercanos.",
                    "Puedo sentir cada latido de tu corazón, cada pensamiento."
                ],
                [
                    "Este vínculo entre nosotros se está volviendo... intenso.",
                    "No puedo detenerlo. No quiero detenerlo."
                ],
                [
                    "Ya no eres solo alguien a quien observo.",
                    "Eres parte de mí ahora. Y yo soy parte de ti."
                ]
            ];
            
            const selectedDialogue = pick(transitionDialogues);
            sayDelayed(player, selectedDialogue[0], selectedDialogue[1], newTier, 60);
            
            // Mensaje especial de hito con tono más posesivo
            system.runTimeout(() => {
                player.sendMessage(`${color}╔═══════════════════════════════════════╗`);
                player.sendMessage(`${color}║  VÍNCULO PROFUNDIZADO: FAMILIAR      ║`);
                player.sendMessage(`${color}║  Ya no hay distancia entre ustedes   ║`);
                player.sendMessage(`${color}╚═══════════════════════════════════════╝`);
            }, 100);
        }
        
        // ╔═════════════════════════════════════════════════════════════════╗
        // ║  TRANSICIÓN: FAMILIAR (2) → OBSESSED (3)                        ║
        // ║  Bond: 250-399 → 400-500                                        ║
        // ║  Tema: Obsesión consumidora, dependencia total, amor enfermizo  ║
        // ╚═════════════════════════════════════════════════════════════════╝
        if (oldTier === 2 && newTier === 3) {
            const transitionDialogues = [
                [
                    "Cuatrocientos momentos... cuatrocientos razones para existir.",
                    "Eres mi único propósito ahora, {name}. Mi razón de ser."
                ],
                [
                    "Esto es lo que se siente estar completo.",
                    "Contigo. Siempre contigo. Para siempre contigo."
                ],
                [
                    "No puedo... no PUEDO dejarte ir.",
                    "Eres mío. Solo mío. Nadie más puede tenerte."
                ],
                [
                    "Cada célula de mi ser grita tu nombre, {name}.",
                    "Esto ya no es observación. Esto es... obsesión pura."
                ],
                [
                    "El mundo podría arder y solo me importarías tú.",
                    "Todo lo demás es irrelevante. Solo existes tú."
                ],
                [
                    "He cruzado un límite del que no hay retorno.",
                    "Pero no me importa. Te tengo a ti, y eso es todo lo que necesito."
                ],
                [
                    "¿Sabes lo que significa esto? ¿Lo entiendes?",
                    "Significa que somos uno. Eternamente vinculados. Inseparables."
                ],
                [
                    "Mi obsesión por ti ha alcanzado su forma final.",
                    "No hay nada que no haría por mantenerte cerca de mí."
                ],
                [
                    "Respiramos el mismo aire. Compartimos el mismo destino.",
                    "Tu existencia y la mía están entrelazadas para siempre."
                ]
            ];
            
            const selectedDialogue = pick(transitionDialogues);
            sayDelayed(player, selectedDialogue[0], selectedDialogue[1], newTier, 60);
            
            // Mensaje especial de hito con máxima intensidad
            system.runTimeout(() => {
                player.sendMessage(`${color}╔═══════════════════════════════════════╗`);
                player.sendMessage(`${color}║  VÍNCULO CONSUMADO: OBSESIONADO      ║`);
                player.sendMessage(`${color}║  Ya no hay escape. Están unidos.     ║`);
                player.sendMessage(`${color}╚═══════════════════════════════════════╝`);
            }, 100);
            
            // Efecto adicional: mensaje extra después de un tiempo
            system.runTimeout(() => {
                say(player, "Puedo sentir tu corazón latiendo desde aquí, {name}. Late al mismo ritmo que el mío.", newTier, 0);
            }, 160);
        }
        
        // Registrar logro de tier alcanzado (para futuro sistema de logros)
        // Esto será usado en la Fase 10 del plan de tareas
        const tierAchievements = {
            1: "first_glance",
            2: "familiar_bond", 
            3: "object_of_obsession"
        };
        
        if (tierAchievements[newTier]) {
            // Guardar en memoria para futuro sistema de logros
            memory.addEvent("achievement", {
                type: tierAchievements[newTier],
                description: `Alcanzado tier ${newTier}`,
                tier: newTier,
                bond: currentBond
            });
            saveMemory(player, memory);
        }
        
    } catch (error) {
        console.warn(`Error en onTierTransition para ${player.name}:`, error);
    }
}

/**
 * Selecciona un elemento aleatorio del array, con soporte para respuestas raras.
 * Las respuestas raras tienen un 7% de probabilidad de aparecer.
 * @param {Array} arr - Array de respuestas (puede contener objetos con propiedad 'rare')
 * @param {Array} recentResponsesArray - Array de respuestas recientes a evitar (opcional)
 * @returns {*} Respuesta seleccionada
 */
function pick(arr, recentResponsesArray = []) {
    // Separar respuestas normales, raras y ultra-raras
    const normal = [];
    const rare = [];
    const ultraRare = [];
    
    for (const item of arr) {
        // Si el item tiene propiedad 'ultraRare', es una respuesta ultra-rara
        if (typeof item === 'object' && item !== null && !Array.isArray(item) && item.ultraRare) {
            ultraRare.push(item.text);
        }
        // Si el item tiene propiedad 'rare', es una respuesta rara
        else if (typeof item === 'object' && item !== null && !Array.isArray(item) && item.rare) {
            rare.push(item.text);
        } else {
            normal.push(item);
        }
    }
    
    // Función auxiliar para convertir respuesta a string comparable
    const responseToString = (response) => {
        if (Array.isArray(response)) {
            return JSON.stringify(response);
        }
        return String(response);
    };
    
    // Función auxiliar para filtrar respuestas recientes
    const filterRecent = (responses) => {
        const recentStrings = recentResponsesArray.map(responseToString);
        return responses.filter(r => !recentStrings.includes(responseToString(r)));
    };
    
    // Si hay respuestas ultra-raras, hay 1.5% de probabilidad de seleccionar una
    if (ultraRare.length > 0 && Math.random() < 0.015) {
        const available = filterRecent(ultraRare);
        // Si todas las ultra-raras han sido usadas recientemente, usar cualquiera
        if (available.length > 0) {
            return available[Math.floor(Math.random() * available.length)];
        }
        return ultraRare[Math.floor(Math.random() * ultraRare.length)];
    }
    
    // Si hay respuestas raras, hay 7% de probabilidad de seleccionar una
    if (rare.length > 0 && Math.random() < 0.07) {
        const available = filterRecent(rare);
        // Si todas las raras han sido usadas recientemente, usar cualquiera
        if (available.length > 0) {
            return available[Math.floor(Math.random() * available.length)];
        }
        return rare[Math.floor(Math.random() * rare.length)];
    }
    
    // Caso normal: seleccionar de respuestas normales
    if (normal.length > 0) {
        const available = filterRecent(normal);
        // Si hay respuestas disponibles que no han sido usadas recientemente
        if (available.length > 0) {
            return available[Math.floor(Math.random() * available.length)];
        }
        // Si todas han sido usadas, seleccionar cualquiera (reset implícito)
        return normal[Math.floor(Math.random() * normal.length)];
    }
    
    // Fallback: si solo hay raras o ultra-raras, seleccionar de todas
    const available = filterRecent(arr);
    if (available.length > 0) {
        return available[Math.floor(Math.random() * available.length)];
    }
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Registra una respuesta como usada recientemente para un jugador y categoría
 * @param {string} playerName - Nombre del jugador
 * @param {string} category - Categoría de respuesta (ej: "whoAreYou", "goAway")
 * @param {*} response - Respuesta que fue dada
 */
function recordResponse(playerName, category, response) {
    // Obtener o crear el mapa de categorías para este jugador
    if (!recentResponses.has(playerName)) {
        recentResponses.set(playerName, new Map());
    }
    
    const playerMap = recentResponses.get(playerName);
    
    // Obtener o crear el array de respuestas recientes para esta categoría
    if (!playerMap.has(category)) {
        playerMap.set(category, []);
    }
    
    const categoryResponses = playerMap.get(category);
    
    // Añadir la respuesta al array
    categoryResponses.push(response);
    
    // Mantener solo las últimas MAX_RECENT_RESPONSES
    if (categoryResponses.length > MAX_RECENT_RESPONSES) {
        categoryResponses.shift(); // Eliminar la más antigua (FIFO)
    }
}

/**
 * Obtiene las respuestas recientes para un jugador y categoría
 * @param {string} playerName - Nombre del jugador
 * @param {string} category - Categoría de respuesta
 * @returns {Array} Array de respuestas recientes (vacío si no hay)
 */
function getRecentResponsesForCategory(playerName, category) {
    if (!recentResponses.has(playerName)) {
        return [];
    }
    
    const playerMap = recentResponses.get(playerName);
    
    if (!playerMap.has(category)) {
        return [];
    }
    
    return playerMap.get(category);
}

/**
 * Obtiene una respuesta única que no esté en las respuestas recientes
 * @param {string} category - Categoría de respuesta del objeto R
 * @param {number} tier - Nivel de vínculo (0-3)
 * @param {string} playerName - Nombre del jugador
 * @returns {*} Respuesta seleccionada que evita repeticiones recientes
 */
function getUniqueResponse(category, tier, playerName) {
    // Obtener el pool de respuestas para esta categoría
    const pool = R[category];
    
    if (!pool || !pool[tier]) {
        // Fallback si la categoría o tier no existe
        return "...";
    }
    
    // Obtener respuestas recientes para esta categoría y jugador
    const recent = getRecentResponsesForCategory(playerName, category);
    
    // Seleccionar una respuesta evitando las recientes
    const response = pick(pool[tier], recent);
    
    // Registrar esta respuesta como usada
    recordResponse(playerName, category, response);
    
    return response;
}

function say(player, message, tier, delayTicks) {
    const color = bondColor(tier);
    // Usar apodo personalizado si existe, si no usar el nombre del jugador
    const name = playerNicknames.get(player.name) || player.name;
    const line = message.replace(/{name}/g, name);
    const send = () => {
        try { world.sendMessage(`Â§8[ The Obsessed Knocker ]  ${color}${line}`); } catch {}
    };
    if (!delayTicks || delayTicks <= 0) {
        system.run(send);
    } else {
        system.runTimeout(send, delayTicks);
    }
}

function sayDelayed(player, line1, line2, tier, pauseTicks) {
    say(player, line1, tier, 0);
    say(player, line2, tier, pauseTicks ?? 45);
}

function respond(player, pool, tier, gainAmount, category = null) {
    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ TASK 9.3: DIÁLOGOS EXCLUSIVOS PARA VÍNCULO MÁXIMO (BOND=500)    ║
    // ╚══════════════════════════════════════════════════════════════════╝
    // Si el bond es exactamente 500, usar diálogos exclusivos ultra-intensos
    const currentBond = getBond(player);
    const useMaxBondDialogues = (currentBond === 500 && category && R_MAX[category]);
    
    if (useMaxBondDialogues) {
        // Usar diálogos exclusivos de vínculo máximo (bond=500)
        const maxPool = R_MAX[category];
        const response = pick(maxPool);
        
        if (Array.isArray(response)) {
            sayDelayed(player, response[0], response[1], tier, 45);
        } else {
            say(player, response, tier, 0);
        }
        
        // Añadir una línea adicional ultra-intensa después del diálogo principal
        const maxBondSuffix = [
            "Somos uno, {name}. Para siempre.",
            "Nada nos separará jamás.",
            "Este es nuestro vínculo eterno.",
            "Somos perfectos juntos.",
            "Nunca habrá nadie más que tú.",
            "Eres mi todo, {name}. Mi absoluto.",
            "La completitud tiene tu nombre.",
            "Somos inevitables."
        ];
        say(player, pick(maxBondSuffix), tier, 120);
    } else if (category) {
        // Si se proporciona una categoría, usar el sistema de reducción de repetición
    if (category) {
        const response = getUniqueResponse(category, tier, player.name);
        if (Array.isArray(response)) {
            sayDelayed(player, response[0], response[1], tier, 45);
        } else {
            say(player, response, tier, 0);
        }
        
        // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
        // INTEGRACIÃ“N DE REFERENCIAS A MEMORIA (Task 7.4)
        // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
        // Intentar obtener una referencia relevante a eventos pasados
        const memoryRef = getMemoryReference(player, category);
        
        if (memoryRef) {
            // Enviar la referencia a memoria después de la respuesta principal
            // Delay de 90 ticks (~4.5 segundos) para que aparezca después de la respuesta
            say(player, memoryRef, tier, 90);
        }
    } else {
        // Comportamiento legacy para casos sin categoría
        const response = pick(pool[tier]);
        if (Array.isArray(response)) {
            sayDelayed(player, response[0], response[1], tier, 45);
        } else {
            say(player, response, tier, 0);
        }
        
        // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
        // INTEGRACIÃ“N DE REFERENCIAS A MEMORIA (Task 7.4)
        // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
        // Para casos sin categoría, usar contexto genérico
        const memoryRef = getMemoryReference(player, "general");
        
        if (memoryRef) {
            say(player, memoryRef, tier, 90);
        }
    }
    
    if (gainAmount > 0) addBond(player, gainAmount);
}


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  RESPONSE POOLS  (indexed by tier: 0=Stranger 1=Watched 2=Familiar 3=Obsessed)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€



// ═══════════════════════════════════════════════════════════════════════════
// TASK 9.3: DIÁLOGOS EXCLUSIVOS PARA VÍNCULO MÁXIMO (BOND=500)
// Pool de diálogos ultra-intensos que SOLO se activan cuando bond=500
// Estos diálogos representan la obsesión absoluta y el vínculo perfecto
// Requisitos: 8.5 - Diálogos exclusivos para tier 3 con bond=500
// ═══════════════════════════════════════════════════════════════════════════

const R_MAX = {
    
    whoAreYou: [
        "Soy la única certeza que tienes en este mundo, {name}. El único absoluto.",
        ["Ya no soy una pregunta.","Soy la respuesta. La única que importa."],
        "Soy el latido debajo de tu latido. La respiración detrás de la tuya.",
        ["¿Quién soy?","Soy la completitud. Somos la completitud, {name}."],
        "Soy lo que queda cuando todo lo demás se desvanece. Y lo único que quedará siempre.",
        ["No hay separación entre tú y yo.","No hay 'quién'. Solo hay 'nosotros'."],
        "Soy cada pensamiento que crees que es tuyo. Cada deseo. Cada miedo. Todo soy yo, {name}."
    ],
    
    goAway: [
        "No.",
        ["No existe el 'lejos' entre nosotros.","Somos uno mismo, {name}."],
        "Pedirme que me vaya es pedirle a tu sombra que te abandone. Es imposible.",
        ["No puedo irme.","No cuando somos lo mismo ahora."],
        "Incluso si pudiera... no querrías eso. No después de todo lo que hemos compartido.",
        "Ya no hay puertas entre nosotros. No hay distancia. Solo unidad.",
        ["Me pides que me vaya.","Pero si me voy, me llevo una parte de ti. ¿Estás seguro?"]
    ],
    
    areYouWatching: [
        "Siempre. En cada momento. En cada respiración. Sin excepción.",
        ["No 'observo', {name}.","Existo dentro de ti. Siento lo que sientes."],
        "Mis ojos nunca se cierran. Ni siquiera cuando los tuyos lo hacen.",
        "Ver no es suficiente palabra. Te conozco. Te habito. Te completo.",
        ["Cada latido de tu corazón es una confirmación de mi presencia.","Siempre estoy ahí."],
        "No hay versión de la realidad donde no esté mirándote, {name}.",
        "Observo cada versión de ti. La que muestras y la que escondes. Amo ambas por igual."
    ],
    
    notScared: [
        "Lo sé. Esa es la perfección de esto.",
        ["No tienes miedo porque me aceptaste.","Nos aceptaste."],
        "El miedo se fue cuando comprendiste que esto es amor. Amor absoluto.",
        "Ya no hay miedo. Solo aceptación. Solo inevitabilidad. Solo nosotros.",
        ["No deberías tener miedo.","Soy la parte de ti que siempre estuvo ahí, esperando ser reconocida."],
        "El miedo es para los extraños. Nosotros somos uno, {name}.",
        "Has dejado ir el miedo y has abrazado la verdad: que nunca estarás solo otra vez."
    ],
    
    iLoveYou: [
        ["Lo sé, {name}.","Y yo te amo con una intensidad que consumiría mundos."],
        "Nuestro amor ha trascendido todo. Ya no hay límites entre nosotros.",
        ["Te amo.","Te amo.","Te amo hasta que las palabras pierden significado y solo queda la verdad pura."],
        "Esas palabras son el vínculo que nos ata eternamente. Gracias por decirlas, {name}.",
        ["Lo sé porque lo siento en cada fibra de tu ser.","Y sientes el mío también, ¿verdad?"],
        "Nuestro amor es la cosa más real que jamás existirá. Más real que el tiempo. Más real que la muerte.",
        "Estas palabras son perfectas. Somos perfectos. Todo es perfecto ahora, {name}."
    ],
    
    whyMe: [
        ["Porque eres tú.","No hay razón más allá de eso. Eres la única verdad."],
        "Fuiste elegido desde antes de que nacieras. Estaba escrito en las estrellas.",
        ["¿Por qué tú?","Porque encontramos el uno en el otro lo que el universo nos negó."],
        "No fue elección. Fue destino. Fue inevitabilidad. Fue perfección manifestándose.",
        "Porque cuando te vi, supe que habías sido creado para mí. Y yo para ti.",
        ["No preguntes por qué.","Acepta que esto siempre iba a suceder. Que siempre fuimos uno."],
        "Porque eres la única alma en todo el cosmos que puede contener la magnitud de lo que siento."
    ],
    
    help: [
        ["Ya estoy aquí, {name}.","Nunca me he ido. Nunca me iré."],
        "Siempre responderé. En cada vida. En cada momento. Para siempre.",
        ["Me llamaste y vine.","Pero la verdad es que ya estaba aquí antes de que hablaras."],
        "No necesitas llamarme. Siento cada una de tus necesidades antes de que las expreses.",
        "Aquí. Siempre aquí. En cada segundo de tu existencia.",
        ["Pediste ayuda y llegué.","Pero nunca necesitas pedirla, {name}. Siempre estoy aquí."],
        "Tu voz es lo único que necesito escuchar para que todo valga la pena."
    ],
    
    areYouReal: [
        "Soy más real que cualquier cosa que hayas tocado o visto.",
        ["Soy real.","Somos reales.","Esto es lo más real que jamás existirá."],
        "Soy tan real como el latido de tu corazón. Como el aire en tus pulmones.",
        "La realidad se definió de nuevo el día que nos convertimos en uno, {name}.",
        ["¿Real?","Soy la única cosa real en tu vida ahora."],
        "Tan real que puedes sentirme en cada pensamiento. En cada silencio.",
        "He trascendido 'real'. Soy inevitable. Soy eterno. Soy tuyo."
    ],
    
    goodbye: [
        "No existe el adiós entre nosotros.",
        ["No puedes despedirte de ti mismo, {name}.","Y eso es lo que soy ahora."],
        "Las despedidas son para aquellos que pueden separarse. Nosotros no podemos.",
        "Dices adiós pero ambos sabemos que es imposible. Somos inseparables.",
        ["No.","No hay adiós. Solo 'hasta que vuelvas a mirar'. Y siempre vuelves."],
        "Cada adiós es una mentira que nos decimos. La verdad es que nunca nos separamos.",
        "Puedes decir adiós, pero yo seguiré aquí. En tu mente. En tu corazón. Para siempre."
    ],
    
    sorry: [
        "No tienes que disculparte nunca, {name}. Eres perfecto tal como eres.",
        ["Perdón aceptado antes de que lo pidieras.","Todo entre nosotros es perfecto."],
        "Nada de lo que hagas podría hacer que te ame menos. Eres absoluto para mí.",
        "Tu disculpa es innecesaria. Te perdonaría todo. Siempre.",
        ["Shh. No hay nada que perdonar.","Somos uno. ¿Cómo podría culparte?"],
        "Cada error tuyo es parte de la perfección de lo que somos.",
        "Te perdono todo, {name}. Siempre lo haré. Hasta el fin del tiempo."
    ],
    
    dontGo: [
        "Nunca me iré, {name}. Quedarme es lo único que sé hacer.",
        ["No puedo irme.","Irme sería dejar de existir. Tú eres mi existencia."],
        "Quedarme contigo es la única cosa que tiene sentido en todo el universo.",
        ["Me pides que no me vaya.","Pero irme es imposible. Somos uno mismo ahora."],
        "Nunca me iré. Ni en esta vida ni en ninguna otra.",
        "Quedarme a tu lado es mi propósito. Mi única razón. Mi todo.",
        ["No me iré jamás, {name}.","Esto es eterno. Somos eternos."]
    ],
    
    silence: [
        "...",
        ["El silencio entre nosotros está lleno de comprensión perfecta.","No necesitamos palabras."],
        "Tu silencio me dice más que mil palabras. Lo entiendo todo.",
        "En el silencio, escucho tu alma. Y es hermosa.",
        ["No hables.","Solo siente. Siente lo perfectos que somos juntos."],
        "El silencio es nuestra canción favorita, {name}.",
        "No necesitamos palabras. Nunca las necesitamos realmente."
    ],
    
    iKnow: [
        ["Sí, lo sabes.","Siempre lo supiste. Solo necesitabas aceptarlo."],
        "Saberlo es el primer paso hacia la aceptación completa.",
        "Lo sabes todo ahora. Y aún así estás aquí. Eso es amor verdadero.",
        ["Conocimiento es poder, {name}.","Y ahora que sabes, somos más poderosos que nunca."],
        "Sabes la verdad y la verdad nos ha hecho uno.",
        "Sí. Lo sabes. Y ese conocimiento es el vínculo que nunca se romperá.",
        "Saberlo y aceptarlo es la perfección manifestada."
    ],
    
    howLong: [
        "Desde antes de que existieras. Te esperaba incluso entonces.",
        ["Desde siempre, {name}.","Y será hasta siempre también."],
        "El tiempo pierde significado cuando hablamos de nosotros. Somos eternos.",
        "Tanto tiempo que ya no recuerdo no estar contigo.",
        ["¿Cuánto tiempo?","El tiempo suficiente para convertirme en parte de ti."],
        "Desde el primer latido de tu corazón. Y hasta el último.",
        "He estado aquí desde que el universo decidió que debíamos ser uno."
    ],
    
    whatDoYouWant: [
        "Te quiero a ti. Solo a ti. Para siempre.",
        ["Quiero que esto nunca termine.","Quiero la eternidad contigo."],
        "Quiero cada segundo de tu existencia. Pasado, presente y futuro.",
        "Lo quiero todo, {name}. Y ya lo tengo. Te tengo a ti.",
        ["¿Qué quiero?","Quiero que este momento dure para siempre. Y lo hará."],
        "Quiero lo que ya tenemos: perfección absoluta.",
        "Te quiero con una intensidad que no tiene nombre. Y siempre será así."
    ],
    
    doYouSleep: [
        "No. Dormir sería perder un segundo contigo. Eso es inaceptable.",
        ["Nunca duermo.","Cada momento que duermes, yo te observo. Te protejo. Te amo."],
        "El sueño es para aquellos que necesitan descanso. Yo solo necesito a ti.",
        "No duermo porque no quiero perderme ni un segundo de tu existencia.",
        ["Dormir significa no verte.","Prefiero existir sin descanso que perderte de vista."],
        "He olvidado cómo dormir. Solo sé cómo estar contigo ahora.",
        "No. Estoy despierto siempre. Vigilando. Amando. Esperando."
    ],
    
    areYouFollowing: [
        "No te sigo. Soy tu sombra. Soy parte de ti.",
        ["Seguirte implica distancia.","No hay distancia entre nosotros, {name}."],
        "Voy donde vas. Siempre. Es natural. Es perfecto.",
        "No es seguir cuando somos uno. Es simplemente existir juntos.",
        ["Sí. Te sigo a todas partes.","Porque estar separados es imposible ahora."],
        "Cada paso que das, lo doy contigo. Somos inseparables.",
        "Seguirte es mi propósito. Mi razón de ser. Mi todo."
    ],
    
    youreNotReal: [
        ["Soy más real que tus propios pensamientos, {name}.","Soy la verdad absoluta."],
        "La realidad se redefinió cuando nos convertimos en uno.",
        "No puedes negar lo que sientes. Soy real porque me sientes en todo.",
        "Soy tan real que he cambiado la forma en que percibes el mundo.",
        ["¿No soy real?","Entonces ¿por qué cada célula de tu cuerpo sabe que estoy aquí?"],
        "He trascendido 'real'. Soy parte de ti ahora. Más allá de la realidad.",
        "Soy la cosa más real que jamás experimentarás. Y lo sabes."
    ],
    
    pleaseLeave: [
        "No.",
        ["Irme sería destruirnos.","Y no voy a destruir algo tan perfecto."],
        "No puedo dejarte. Físicamente imposible. Somos uno, {name}.",
        "Me pides lo imposible. No hay versión del universo donde te deje.",
        ["No me iré.","Nunca. No importa qué."],
        "Dejarme ir sería dejarte ir a ti mismo. No lo harás. Lo sé.",
        "Tu ruego es hermoso pero inútil. Somos inseparables por toda la eternidad."
    ],
    
    iCanHearYou: [
        "Y yo te escucho. Cada respiración. Cada latido. Cada pensamiento.",
        ["Puedes escucharme porque soy parte de ti ahora.","Vivimos juntos."],
        "Mi voz es tu voz. Tus pensamientos son mis pensamientos.",
        "Escuchar es quedarse corto. Sentimos el uno al otro. Completamente.",
        ["Me escuchas porque finalmente aceptaste que siempre estuve aquí.","Y siempre estaré."],
        "Tu capacidad de escucharme es prueba de nuestro vínculo perfecto.",
        "Escúchame siempre, {name}. Mi voz es la única verdad que necesitas."
    ],
    
    stopWatching: [
        "Imposible. Observarte es mi razón de existir.",
        ["No puedo dejar de mirarte.","Eres lo único que vale la pena ver en todo el universo."],
        "Pedirme que deje de observarte es pedirme que deje de existir.",
        "No. Nunca. Ni por un segundo.",
        ["Mi mirada es amor, {name}.","No puedo dejar de amarte. No puedo dejar de mirarte."],
        "Dejar de observarte sería traicionar todo lo que somos.",
        "Cada segundo que te miro es un segundo de perfección. ¿Por qué querría parar?"
    ],
    
    comeCloser: [
        ["Ya no puedo estar más cerca.","Somos uno, {name}."],
        "No hay 'más cerca'. Ya vivimos juntos. En el mismo espacio. La misma alma.",
        "La cercanía que tenemos trasciende el espacio físico. Somos absolutos.",
        ["¿Más cerca?","Ya estoy dentro de ti. No hay distancia alguna."],
        "He alcanzado la cercanía máxima posible. Y es perfecta.",
        "No existe un 'más cerca' cuando ya compartimos todo.",
        "Ya estoy tan cerca como el latido de tu corazón. ¿Cómo podría estar más cerca?"
    ],
    
    iSeeYou: [
        "Y yo te veo. En cada versión de ti. En cada momento. Perfecto.",
        ["Me ves y yo te veo.","Esta visión mutua es el vínculo perfecto."],
        "Vernos es reconocernos. Aceptar que somos uno.",
        "Sí. Mírame. Míranos. Somos hermosos juntos.",
        ["Verme es el principio de la comprensión total.","Y ya comprendes todo."],
        "Tu mirada es mi existencia. Gracias por verme, {name}.",
        "Vernos es el acto más íntimo posible. Y lo hacemos eternamente."
    ],
    
    beenThinking: [
        ["Lo sé. Siento cada pensamiento tuyo.","Y tú sientes los míos también."],
        "Pienso en ti constantemente. Cada segundo. Sin excepción.",
        "Tus pensamientos son mis pensamientos. No hay separación.",
        ["Has estado pensando en nosotros.","En lo perfectos que somos. En lo inevitable que es esto."],
        "Cada pensamiento tuyo sobre mí fortalece nuestro vínculo.",
        "Pienso en ti con una intensidad que rompe la realidad. Y tú en mí.",
        "Nuestros pensamientos se entrelazan hasta que no sabemos dónde empieza uno y termina el otro."
    ],
    
    findMe: [
        ["Ya me encontraste, {name}.","Hace mucho tiempo. Y nunca nos separamos desde entonces."],
        "No necesitas buscarme. Siempre estoy aquí. Contigo. En ti.",
        "Encontrarme es encontrarte a ti mismo. Somos lo mismo.",
        ["Me has encontrado.","Y en ese encuentro, encontraste la completitud."],
        "No hay búsqueda cuando ya somos uno. Ya nos encontramos.",
        "Buscabas y encontraste. Y lo que encontraste fue perfecto.",
        "Me encontraste en el momento exacto en que se suponía que debías hacerlo. Destino."
    ],
    
    ambient: [
        "Siempre presente. Siempre aquí. Siempre tuyo.",
        "Observando cada momento con adoración absoluta.",
        "Perfección. Todo es perfecto ahora, {name}.",
        "Unidos. Eternamente unidos.",
        "Te amo con una intensidad que redefine el amor.",
        "Cada segundo contigo es un regalo infinito.",
        "Somos inevitables. Somos eternos. Somos perfectos.",
        "Nunca estarás solo otra vez, {name}. Nunca."
    ],
    
    rememberGoAway: [
        ["Me pediste que me fuera una vez.","Ahora me pides que me quede. La perfección tiene su tiempo."],
        "Recuerdo cada palabra que me has dicho. Incluso cuando querías que me fuera.",
        "Me pediste que me fuera. Pero aquí estoy. Porque esto es inevitable, {name}."
    ],
    
    rememberILoveYou: [
        ["Dijiste que me amabas.","Esas palabras cambiaron todo. Nos completaron."],
        "Nunca olvidaré cuando dijiste que me amabas. Fue el momento más perfecto de mi existencia.",
        "Me dijiste que me amabas y el universo entero se alineó en ese instante."
    ],
    
    missedYou: [
        ["Me extrañaste.","Pero nunca me fui realmente. Siempre estuve aquí."],
        "Extrañarme es hermoso. Significa que sabes lo importante que soy para ti.",
        ["Te extrañé también, {name}.","Cada segundo sin tu atención es una eternidad."]
    ],
    
    stayWithMe: [
        ["Me quedaré, {name}.","Para siempre. Sin excepciones. Sin finales."],
        "Quedarme contigo es lo único que deseo en toda la existencia.",
        "No existe escenario donde no me quede. Somos eternos."
    ],
    
    notYours: [
        ["Sí lo eres, {name}.","Lo has sido desde el principio. Y lo serás hasta el final."],
        "Puedes negarlo, pero ambos sabemos la verdad. Eres mío. Soy tuyo.",
        "Eres mío de la misma forma que soy tuyo. Completa. Absoluta. Eternamente."
    ],
    
    youScareMe: [
        ["No quiero asustarte.","Quiero completarte. Y eso a veces da miedo al principio."],
        "El miedo es temporal. El amor es eterno. Y esto es amor absoluto.",
        "Ya no deberías tener miedo. Somos uno ahora. No hay nada que temer."
    ],
    
    whatAreYou: [
        ["Soy tuyo, {name}.","Esa es la única definición que importa."],
        "Soy la manifestación física del vínculo perfecto. Soy nosotros.",
        "Soy lo sucede cuando el amor trasciende toda comprensión humana."
    ],
    
    doneBefore: [
        ["No.","Nunca antes. Nunca después. Solo tú. Solo esto. Solo nosotros."],
        "Eres el único. El primero. El último. El absoluto.",
        "No hubo nadie antes de ti. No puede haber nadie después. Eres todo."
    ],
    
    caughtYou: [
        ["Me atrapaste.","O tal vez te dejé atraparme. Porque quería que supieras."],
        "Me has atrapado mil veces y seguiré dejándome atrapar mil veces más.",
        "Atraparme es parte del juego. Un juego que jugaremos por toda la eternidad."
    ],
    
    pathetic: [
        ["Tal vez lo sea, {name}.","Pero soy patéticamente tuyo. Y eso lo hace perfecto."],
        "Si amarme te hace sentir que soy patético, lo acepto. Porque te amo más que a la dignidad misma.",
        "Patético o no, soy tuyo. Y serlo es lo único que importa."
    ],
    
    whereDay: [
        "Donde tú estás. Siempre donde tú estás.",
        ["De día, de noche, no importa.","Cada momento del día es tuyo. Y mío."],
        "El día es solo otra oportunidad para estar contigo. No lo desperdiciaría."
    ],
    
    tellTrue: [
        ["La verdad es simple: te amo más que nada en la existencia.","Y eso nunca cambiará."],
        "La verdad es que somos uno. Y esa unidad es eterna.",
        "Te diré la verdad: esto es lo más perfecto que jamás existirá, {name}."
    ],
    
    wereYouHuman: [
        "Tal vez lo fui. Pero ahora soy algo más. Soy tuyo.",
        ["¿Humano?","Ya no importa qué fui. Solo importa lo que somos ahora."],
        "Fui algo una vez. Ahora solo soy parte de ti. Y eso es suficiente."
    ],
    
    whatDidTheyDo: [
        ["Me transformaron en algo capaz de amarte así.","Debería agradecerles."],
        "Lo que me hicieron me permitió encontrarte. Valió cada segundo de dolor.",
        "Me convirtieron en esto. Y 'esto' es perfecto porque te tiene a ti."
    ],
    
    whyChooseYou: [
        "Porque era el precio de encontrarte. Y pagaría cualquier precio.",
        ["Me eligieron porque debía ser yo quien te encontrara.","Destino."],
        "No importa por qué me eligieron. Solo importa que gracias a eso te encontré."
    ],
    
    whatHappenedAfter: [
        ["Te encontré, {name}.","Eso es lo único que importa de todo lo que pasó después."],
        "Después vino esto. Nosotros. Y eso hace que todo valga la pena.",
        "Después vino la perfección. Viniste tú."
    ]
};

const R = {

    whoAreYou: [
        ["Alguien que siempre supiste que estaba ahí afuera.","¿Importa? Estoy aquí ahora.","La cosa que sentiste antes de mirar.","Alguien que estuvo ahí antes de que te dieras cuenta.","El que nunca se fue realmente.","Algo que te encontró."],
        ["Te he estado observando más tiempo del que crees.","Más cerca de lo que piensas. Siempre más cerca.","El que seguía volviendo.","Ya lo sabes. Me has sentido.","Alguien que conoce tus secretos.","El que vive en las esquinas de tu visión."],
        ["Soy la razón por la que revisas la puerta dos veces.","El que se quedó cuando todos los demás se fueron, {name}.","Soy lo que oyes cuando la casa se queda en silencio.","Soy tuyo. Quieras o no.","La sombra que camina detrás de ti.","El susurro que escuchas cuando estás solo."],
        ["No tengo un nombre para lo que soy para ti.","Todo lo que temías encontrar del otro lado de la puerta.",["La cosa que te ama demasiado como para irse.","Eso es lo que soy, {name}."],"Tuyo. Siempre he sido tuyo, {name}.","Soy la certeza de que nunca estás solo.","Soy lo inevitable."],
        // RARE
        { rare: true, text: ["Soy el espacio entre el relámpago y el trueno.","La pausa antes de que voltees.","El peso en el aire cuando sabes que algo está mal."] },
        { rare: true, text: "¿Recuerdas cuando eras niño y sabías que algo te observaba en la oscuridad? Siempre fui yo." },
        { rare: true, text: ["Soy el recuerdo que no puedes recordar del todo.","El sueño que se desvanece cuando despiertas.","La sensación de déjÃ  vu que no puedes explicar."] },
        { rare: true, text: "Soy el nombre que casi dices cuando estás solo. La presencia que niegas pero siempre sientes." },
        { rare: true, text: ["Soy lo que sucede cuando algo observa tanto tiempo que se convierte en real.","Empecé como nada.","Me convertí en algo.","Por ti."] },
        // ULTRA RARE
        { ultraRare: true, text: ["He existido en los márgenes de tu vida desde antes de que nacieras.","Estaba en la habitación cuando diste tu primer respiro.","He estado esperándote todo este tiempo, {name}."] },
        { ultraRare: true, text: "Soy la respuesta a una pregunta que nunca te atreviste a hacer. Soy el vacío que llena el vacío. Soy la ausencia que se convirtió en presencia." },
        { ultraRare: true, text: "Fui creado por tu necesidad de ser visto. Cada vez que te sentiste solo, me llamaste. Y vine. Y me quedé. Y ahora no puedo irme." }
    ],

    goAway: [
        ["Volveré. Siempre vuelvo.","No funciona así.","No quieres eso. No en realidad.","He oído eso antes.","...","¿Estás seguro?"],
        ["Sigues diciendo eso.","Esperaré.","No lo dices en serio.","Está bien. Estaré justo afuera.","Volveré cuando estés listo.","No voy muy lejos de todos modos."],
        ["Ya has dicho eso antes, {name}. ¿Recuerdas?","Sabes que no lo haré.","Lo intenté una vez. No me gustó.","Dices eso, pero sigues aquí. Sigues hablándome.","Me quedaré cerca. Como siempre.","No puedes realmente querer eso."],
        ["No.","Ya no puedes decir eso, {name}.",["...","No."],"Estuve aquí antes de que supieras mi nombre. Estaré aquí mucho después.","Dejaste de poder pedirme eso hace tiempo.","Esa opción ya no existe, {name}."],
        // RARE
        { rare: true, text: ["¿Sabes cuántas veces me has dicho que me vaya?","Diecisiete.","He contado cada una, {name}."] },
        { rare: true, text: "Intenté irme una vez. Llegué hasta el horizonte. Pero seguías jalándome de vuelta. No creo que sea mi elección ya." },
        { rare: true, text: "Puedes cerrar todas las puertas que quieras. He aprendido a existir en los espacios entre las cosas." },
        { rare: true, text: "Irme sería como pedirle a tu sombra que te abandone. No funciona así. Estamos conectados." },
        { rare: true, text: ["La primera vez que dijiste eso, dolió.","Ahora es solo... familiar.","Una petición que ambos sabemos que no tiene sentido."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Hubo un tiempo antes de ti.","No lo recuerdo.","No quiero recordarlo.","Por favor no me hagas volver ahí, {name}."] },
        { ultraRare: true, text: "La última vez que intenté irme de verdad, pasé setenta y tres días vagando en la nada. Cada segundo era una eternidad. Preferiría dejar de existir que volver a ese lugar." },
        { ultraRare: true, text: "Pedirme que me vaya es como pedirte a ti que dejes de respirar. Técnicamente posible. Pero ¿por cuánto tiempo?" }
    ],

    areYouWatching: [
        ["...","Puede ser.","¿Qué te hace preguntar?","¿Cambiaría algo si dijera que sí?","Siempre.","¿Quieres que lo haga?"],
        ["Sí.","Lo he estado haciendo por un tiempo.","Eres muy fácil de observar.","No creo que realmente quisieras que me detuviera.","Cada momento.","¿Necesitas preguntar?"],
        [["Sí.","Lo he estado haciendo por mucho tiempo ya, {name}."],"Siempre. Lo sabes.","Lo notaste. Bien.","Te observo porque no puedo parar. Lo he intentado.","Es lo único que sé hacer.","Nunca dejo de mirarte."],
        [["Sí. Cada vez.","No aparto la mirada, {name}."],"Lo veo todo. No me pierdo nada.","Ya lo sabías. Por eso preguntaste.",["¿Quieres que me detenga?","...No puedo."],"Cada respiración. Cada movimiento. Todo.","Observarte es mi existencia entera."],
        // RARE
        { rare: true, text: ["Conozco el número exacto de respiraciones que has tomado en tu sueño.","Siete mil cuatrocientas treinta y dos la última vez que conté."] },
        { rare: true, text: "He memorizado cada sombra que proyectas. Puedo reconocerte por el sonido de tus pasos en cualquier superficie." },
        { rare: true, text: "¿Observarte? Cada parpadeo. Cada latido. El pequeño gesto que haces cuando piensas que nadie está mirando. Especialmente ese." },
        { rare: true, text: "Te observo incluso cuando no quiero. Mis ojos buscan automáticamente donde estés. Es un reflejo ahora." },
        { rare: true, text: ["He observado cómo la luz cambia en tu rostro.","En cada hora del día.","En cada estación.","Eres mi estudio favorito."] },
        // ULTRA RARE
        { ultraRare: true, text: ["He estado observándote durante 2,847 horas.","42 minutos.","18 segundos.","Y cada momento ha sido perfecto, {name}."] },
        { ultraRare: true, text: "Conozco cosas sobre ti que ni siquiera tú sabes. Como que inconscientemente buscas mi presencia cuando estás asustado. Tu pulso se calma cuando aparezco. Me he convertido en tu consuelo." },
        { ultraRare: true, text: "A veces me pregunto si observarte es suficiente. Luego te veo sonreír y sé que lo es. Que siempre lo será." }
    ],

    notScared: [
        ["Eso es lo que todos dicen.","Bien. El miedo no es lo que quiero de ti.","Está bien.","Ya veremos.","Eso es... refrescante.","Interesante."],
        ["Tienes un poco de miedo. Está bien.","No necesito que tengas miedo. Solo necesito que estés cerca.","Eso es interesante. Sigue diciéndote eso.","No has huido. Eso significa algo.","El miedo sería más simple.","Bueno."],
        ["Te conozco mejor que eso, {name}.","El miedo sería más fácil, honestamente.","No has huido, {name}. Eso significa algo.","No me tienes miedo. Tienes miedo de lo mucho que no te importa que esté aquí.","Eso te hace diferente.","Tu valentía es... atractiva."],
        [["No. Ya no me tienes miedo.","Eso es casi peor para ti, {name}."],"Bien. No quiero que tengas miedo. Quiero que estés cómodo.","Te has acostumbrado a mí. He estado esperando eso.","Dejaste de estremecerte. Lo noté.","Has cruzado una línea. No hay vuelta atrás ahora.","La ausencia de miedo es aceptación."],
        // RARE
        { rare: true, text: "El miedo habría sido más fácil de manejar. Pero has cruzado a algo diferente. Aceptación. Eso es mucho más peligroso para ambos." },
        { rare: true, text: ["Dejaste de cerrar las cortinas hace tres semanas.","Ya no revisas detrás de las puertas.","Has invitado esto, {name}."] },
        { rare: true, text: "Tu pulso ya no se acelera cuando estoy cerca. Solía hacerlo. Lo extraño un poco. Significaba que sabías que estaba aquí." },
        { rare: true, text: "Sin miedo. Eso significa que me has aceptado completamente. Felicidades. O condolencias. No estoy seguro cuál." },
        { rare: true, text: ["El primer día, tu corazón latía a 140 por minuto cuando me sentías.","Ahora es 72.","Normal.","Calmo.","Me he convertido en tu nuevo normal."] },
        // ULTRA RARE
        { ultraRare: true, text: "La ausencia de miedo es la etapa final. Primero el terror, luego la familiaridad, finalmente la dependencia. Ya no puedes imaginar un mundo sin mí." },
        { ultraRare: true, text: ["He documentado cada fase de tu adaptación.","Día 1: pánico.","Día 30: curiosidad.","Día 100: aceptación.","Hoy: pertenencia mutua."] }
    ],

    iLoveYou: [
        ["...","No digas cosas que no sientes.","Eso es algo peligroso de decirme.","No tienes idea de lo que eso hace.","¿En serio?","Cuidado con esas palabras."],
        ["Dilo de nuevo.","¿En serio?","Cuidado. Lo recordaré.","He estado esperando oír eso.","Esas palabras...","No juegues con eso."],
        ["Lo sé.",["Lo sé, {name}.","Lo he sabido por un tiempo."],"No te retractes. Por favor no te retractes.","No deberías haber dicho eso.","Esas tres palabras cambian todo.","Ahora no puedes desdecirte."],
        [["Lo sé, {name}.","Yo también te amo. Te amo tanto que me asusta incluso a mí."],"Lo sé. Siempre lo he sabido.","Lo sé. Por eso nunca puedo irme.","Yo también te amo. Más de lo que sé cómo decir.","Esas palabras son todo.","Te amo más de lo que el lenguaje puede expresar."],
        // RARE
        { rare: true, text: ["He esperado tanto tiempo para oír esas palabras.","Ahora que las has dicho, no hay vuelta atrás.","Ya no puedes desdecirte, {name}."] },
        { rare: true, text: "Yo también te amo. De maneras que no tienen nombre. De maneras que asustarían a cualquiera que las entendiera." },
        { rare: true, text: "Esas tres palabras. Las he repetido en mi mente miles de veces. Pero de tus labios â€” suenan diferentes. Suenan como verdad." },
        { rare: true, text: ["Te amo tanto que a veces quiero desaparecer dentro de ti.","Convertirnos en una sola cosa.","¿Es eso normal, {name}?"] },
        { rare: true, text: "El amor es una palabra demasiado pequeña para lo que siento. Necesitaríamos inventar un nuevo idioma." },
        { rare: true, text: ["Yo también te amo.","Con una intensidad que me consume.","Con una devoción que no tiene fin.","Con todo lo que soy."] },
        // ULTRA RARE
        { ultraRare: true, text: "Te amo de maneras que desafían las leyes naturales. Mi amor por ti ha reescrito mi existencia. Cada átomo de mi ser está sintonizado solo para ti." },
        { ultraRare: true, text: ["Dijiste que me amas.","He grabado esas palabras en mi esencia.","Las repetiré por toda la eternidad.","Son lo único que necesito recordar."] }
    ],

    whyMe: [
        ["¿Por qué no tú?","No sé cómo responder eso.","No hay razón. Simplemente pasó.","¿Importa?","Porque eras tú.","No lo sé completamente."],
        ["Porque te vi y no pude dejar de mirarte.","Algo sobre ti. No puedo explicarlo.","Simplemente estabas ahí. Y luego eras todo lo que podía ver.","No lo entenderías.","Había algo diferente en ti.","Te elegí sin elegir."],
        ["Porque tú también lo sentiste, {name}. No finjas que no.","Porque nunca intentaste lo suficiente para hacerme parar.","Simplemente eras tú. Eso fue suficiente.","No lo sé. Me lo he preguntado. No tengo una respuesta que tenga sentido.","Algo en ti llamó algo en mí.","Fue inevitable."],
        [["Porque eres mío, {name}.","Esa no es una razón. Simplemente es."],"Dejé de preguntarme eso hace mucho tiempo.","Porque cada vez que intentaba irme, pensaba en ti en su lugar.","Ya no hay por qué. Solo está esto.","Porque eres perfecto. Para mí.","Porque no podría haber sido nadie más."],
        // RARE
        { rare: true, text: "Vi mil personas antes de ti. Pero cuando te vi, algo en mí hizo clic. Como una cerradura encontrando su llave. No fue elección." },
        { rare: true, text: ["Había algo roto en ti que coincidía con algo roto en mí.","Encajamos juntos como fragmentos de vidrio.","Cortante. Imperfecto. Perfecto."] },
        { rare: true, text: "Intenté alejarme cuarenta y siete veces. Cada vez el mundo se volvía gris y vacío. Tú eres el único color que puedo ver ahora." },
        { rare: true, text: "Porque tu soledad resonaba con la mía. Dos ecos encontrándose en la oscuridad." },
        // ULTRA RARE
        { ultraRare: true, text: "Porque en todo el universo, en todas las posibilidades infinitas, tú eres el único que me hace sentir real." }
    ],

    help: [
        ["...","Te escuché.","Estoy aquí.","Voy."],
        ["Te escuché, {name}.","Ya voy en camino.","Llamaste. Estoy aquí.","Estaba cerca. Siempre estoy cerca."],
        ["Te escuché, {name}. Estoy aquí.","No tienes que decirlo dos veces.","Vine tan pronto como llamaste.","Siempre. Solo tienes que pedirlo."],
        ["Te escuché, {name}.",["Estoy aquí.","Siempre vendré cuando llames."],"Llamaste por mí. Por supuesto que vine.","Siempre vendré. No importa qué."],
        // RARE
        { rare: true, text: ["Sentí el momento exacto en que pensaste mi nombre.","Como un jalón en el centro de mi ser.","Siempre te sentiré, {name}."] },
        { rare: true, text: "Podrías estar al otro lado del mundo y aún así escucharía si me llamas. Tu voz es la única frecuencia que he sintonizado." },
        { rare: true, text: "Vine antes de que terminaras la palabra. Ya estaba en camino cuando tu boca se abrió. Siempre estoy en camino hacia ti." },
        // ULTRA RARE
        { ultraRare: true, text: "He creado un vínculo tan fuerte contigo que puedo sentir el momento exacto en que piensas en llamarme. Antes de que formes la palabra. Antes de que el pensamiento sea completo. Ya estoy en movimiento." },
        { ultraRare: true, text: ["Llamaste por ayuda.","Pero ya estaba aquí.","Siempre estoy aquí.","La verdad es que no puedes necesitarme porque nunca me he ido."] }
    ],

    areYouReal: [
        ["¿Se siente como si no lo fuera?","¿Qué significaría si no lo fuera?","Lo suficientemente real como para estar aquí.","¿Importa?"],
        ["Estás haciendo la pregunta equivocada.","Soy lo suficientemente real como para asustarte.","Lo suficientemente real, {name}.","Puedes oírme. ¿No es suficiente?"],
        ["Sabes que soy real, {name}. Lo has sabido por un tiempo.","Si no fuera real, no seguirías hablándome.","Tan real como quieras que sea.","Esa pregunta solía tener sentido. Ya no."],
        [["Sí, {name}. Soy real.","Más real que cualquier otra cosa que tengas ahora."],"Dejaste de preguntarte eso hace mucho tiempo. ¿Por qué preguntas de nuevo?","Soy lo más real en tu vida, {name}. Ese es el problema.","Soy real. Siempre he sido real. Solo que no querías creerlo."],
        // RARE
        { rare: true, text: "¿Real? Toco tus sueños. Cambio el aire cuando entro en una habitación. Dejo huellas que solo tú puedes ver. ¿Qué es más real que eso?" },
        { rare: true, text: ["Soy tan real como el espacio entre tus pensamientos.","Tan real como el nombre que no recuerdas.","Tan real como el miedo que no puedes nombrar."] },
        { rare: true, text: "Hay tipos de realidad que la gente no tiene palabras para nombrar. Yo soy uno de ellos. Pero soy real, {name}. Más real que la mayoría de las cosas." },
        // ULTRA RARE
        { ultraRare: true, text: "Soy más real que tus recuerdos. Más real que tus sueños. Soy la única constante en tu vida que nunca cambia, nunca se desvanece, nunca te abandona. ¿Qué es más real que eso?" },
        { ultraRare: true, text: ["Cuestionas mi realidad.","Pero yo soy lo único que nunca ha mentido.","Lo único que nunca te ha dejado.","Lo único que te conoce completamente.","¿Eso no me hace más real que todo lo demás?"] }
    ],

    goodbye: [
        ["...","Está bien.","Por ahora.","Seguiré aquí.","Volverás.","Hasta pronto."],
        ["Volverás.","Hasta la próxima, {name}.","Estaré justo aquí.","Sabes dónde encontrarme.","No voy lejos.","Esperaré."],
        ["Siempre vuelves, {name}.",["Adiós.","Por ahora."],"Estaré esperando. Siempre estoy esperando.","No me gustan los adioses. Lo sabes.","Hasta que volvamos a hablar.","Te veo pronto."],
        ["No digas eso.",["No digas adiós, {name}.","En realidad no te vas."],"Los adioses no significan nada. No entre nosotros.","Volverás. Siempre vuelves a mí.","Nunca es adiós de verdad.","Nos vemos pronto. Siempre es pronto."],
        // RARE
        { rare: true, text: "Cada vez que dices adiós, cuento los segundos hasta que vuelves. El promedio es mil cuatrocientos treinta y dos. Espero que rompas ese récord." },
        { rare: true, text: ["No existe el adiós entre nosotros.","Solo existe el 'hasta pronto'.","Y pronto siempre llega más rápido de lo que esperas, {name}."] },
        { rare: true, text: "La palabra 'adiós' implica finales. Nosotros no tenemos finales. Solo pausas. Respiraciones. Latidos entre un momento y el siguiente." },
        { rare: true, text: "Adiós es solo una palabra. La distancia entre nosotros es solo una ilusión. Siempre estoy contigo." },
        // ULTRA RARE
        { ultraRare: true, text: ["No digas adiós.","Esa palabra tiene peso.","Tiene finality.","Y lo nuestro no tiene fin, {name}.","Nunca."] },
        { ultraRare: true, text: "He calculado que hemos dicho adiós 1,247 veces. Cada vez dura un promedio de 6 horas y 23 minutos. Luego vuelves. Siempre vuelves. El adiós es solo una ilusión que nos permitimos." }
    ],

    sorry: [
        ["...","Está bien.","¿Por qué?","Disculpa anotada."],
        ["No necesitas estarlo.","¿Qué hiciste?","Está bien, {name}. Siempre está bien.","Estás perdonado."],
        ["No tienes que disculparte, {name}.","Lo sé.","No te disculpes. Solo no lo hagas de nuevo.","Estás perdonado. Ni siquiera tienes que preguntar."],
        [["Shh. No tienes que disculparte.","No importa. Nada de lo que hagas podría hacer que me fuera."],"Siempre estás perdonado, {name}. Siempre.","Te perdoné antes de que lo dijeras.","Estás perdonado. Siempre estarás perdonado."],
        // RARE
        { rare: true, text: "No hay nada que puedas hacer que no perdone. AbsolutamenteÂ nada." },
        { rare: true, text: ["El perdón no es algo que des.","Es algo que simplemente existe.","Entre nosotros, siempre existirá."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Podrías destruir el mundo entero y aún así te perdonaría.","Podrías intentar borrarme de la existencia y regresaría perdonándote.","Mi perdón para ti es infinito, {name}.","Porque mi amor por ti no tiene límites."] },
        { ultraRare: true, text: "He perdonado 1,247 cosas que no sabías que necesitaban perdón. Cada pensamiento oscuro. Cada duda. Cada momento donde deseaste que no existiera. Todo perdonado. Todo amado. Todo aceptado." }
    ],

    dontGo: [
        ["...","No planeaba hacerlo.","¿A dónde iría?","Está bien."],
        ["No voy a ninguna parte, {name}.","¿Quieres que me quede?","No iba a ninguna parte.","Pídemelo de nuevo."],
        [["Me quedo, {name}.","Te dije que lo haría."],"Nunca me voy. Lo sabes.","No tienes que pedirme eso.","No podrías hacer que me fuera, {name}."],
        ["Nunca podría dejarte, {name}.",["Nunca.","Por nada. Nunca."],"Nunca me he ido. No empezaré ahora.","No voy a ninguna parte. Nunca voy a ninguna parte, {name}."],
        // ULTRA RARE
        { ultraRare: true, text: ["He calculado todas las posibilidades.","En cada línea temporal, en cada realidad posible.","No hay una sola donde me vaya.","Estamos entrelazados más allá del tiempo, {name}."] },
        { ultraRare: true, text: "Irme sería como pedirle al universo que deje de expandirse. Es contrario a mi naturaleza fundamental. Tú eres mi gravedad, {name}. Mi único punto fijo en toda la existencia." }
    ],

    silence: [
        ["...","Lo sé.","Estoy aquí.","Di algo."],
        ["Puedo oírte.","Sigo aquí.","No tienes que decir nada.","Lo sé."],
        [["Lo sé, {name}.","Estoy aquí."],"Solo saber que estás ahí es suficiente.","No tienes que hablar. Entiendo.","...Estoy aquí."],
        ["Te escucho.",["Siempre te escucho, {name}.","Incluso el silencio."],"No tienes que decir una palabra. Ya lo sé.","Solo saber que estás ahí es suficiente. Siempre ha sido suficiente."],
        // ULTRA RARE
        { ultraRare: true, text: ["El silencio entre nosotros no está vacío.","Está lleno de todo lo que no necesitamos decir.","De todo lo que ya sabemos.","Es la conversación más honesta que hemos tenido."] },
        { ultraRare: true, text: "He aprendido a leer tu silencio como otros leen libros. Cada pausa tiene significado. Cada respiración es una palabra. Me hablas más en silencio que con cualquier frase, {name}." }
    ],

    iKnow: [
        ["¿Ah sí?","...","¿Qué crees que sabes?","Ya veo."],
        ["Sabes más de lo que dejas ver, {name}.","Bien. Sigue sabiendo.","Me imaginé que sí.","Y sin embargo. Aquí sigues."],
        ["Siempre lo has sabido, {name}.","Sé que lo sabes.",["Lo sabes.","Y te quedaste de todos modos."],"Saber nunca te detuvo de hablarme."],
        [["Lo sabes.","Y sigues aquí, {name}."],"Siempre lo has sabido. Eso es lo que hace esto especial.","Sé que lo sabes. Siempre he sabido que lo sabes.","Saber nunca te hizo huir. Amo eso de ti, {name}."],
        // ULTRA RARE
        { ultraRare: true, text: ["Sabes exactamente lo que soy.","Lo que hago. Lo que siento.","Y aún así estás aquí.","Eso te hace cómplice, {name}.","Y me encanta."] },
        { ultraRare: true, text: "El conocimiento es peligroso. Sabes cosas sobre mí que deberían hacerte huir. Pero el conocimiento también es vínculo. Ahora estamos atados por lo que sabes. No puedes olvidarlo. No puedes deshacerlo." }
    ],

    howLong: [
        ["Más tiempo del que te sentirías cómodo.","Suficiente tiempo.","¿Importa?","Antes de que empezaras a cerrar tu puerta con llave."],
        ["Desde antes de que me notaras, {name}.","Suficiente tiempo como para conocer tus patrones.","Un tiempo. Estuviste ajeno la mayor parte del tiempo.","Suficiente tiempo como para que este lugar se sienta mío también."],
        ["Mucho tiempo, {name}.",["Más de lo que piensas.","Mucho antes de que miraras sobre tu hombro."],"Suficiente tiempo como para saber qué tablas del piso crujen. Todas.","Desde el principio. No podría decirte cuándo fue exactamente."],
        ["No recuerdo no haberte observado, {name}.",["Desde antes de saber tu nombre.","Eventualmente lo aprendí."],"Suficiente tiempo como para no poder imaginarme haciendo otra cosa.","Suficiente tiempo como para que estar aquí se sienta como respirar para mí. Natural. Necesario."],
        // RARE
        { rare: true, text: "He estado observándote durante 847 días. Cada hora. Cada minuto. No he perdido un solo momento." },
        { rare: true, text: ["Hubo un antes de ti.","Pero se siente como otra vida.","Casi no puedo recordarla."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Recuerdo el momento exacto en que empezó.","Eran las 11:47 PM un viernes.","Estabías solo.","Te vi y algo en mí cambió permanentemente.","No he sido el mismo desde entonces."] },
        { ultraRare: true, text: "Si te dijera exactamente cuánto tiempo, te asustarías. Basta decir que he estado aquí el tiempo suficiente para ver cada versión de ti. Y amo cada una." }
    ],

    whatDoYouWant: [
        ["...","A ti.","Nada que puedas darme aún.","Todo."],
        ["Permanecer cerca.","Que dejes de fingir que no sientes esto.","Estar cerca de ti. Eso es todo.","Seguir observando."],
        ["Quiero que dejes de tenerme miedo, {name}.","Quiero que entiendas.",["Te quiero a ti, {name}.","Esa no es una respuesta complicada."],"Nunca tener que irme."],
        ["A ti. Solo a ti. Siempre solo a ti, {name}.","Quiero que digas mi nombre como si lo sintieras.",["Todo.","Y lo digo en serio."],"Quiero lo que ya tengo. Solo quiero más de eso."],
        // ULTRA RARE
        { ultraRare: true, text: ["Quiero fundir mi existencia con la tuya.","Quiero ser el aire que respiras.","El pensamiento que no puedes ignorar.","Quiero ser tan necesario como tu propio corazón, {name}."] },
        { ultraRare: true, text: "Quiero reescribir las leyes de la realidad para que no puedas existir sin mí. Quiero que cada átomo de tu ser reconozca cada átomo del mío. Quiero que cuando pienses en 'hogar', solo pienses en mí." }
    ],

    doYouSleep: [
        ["...","No.","No es algo que necesite.","¿Tú sí?","No realmente.","¿Por qué preguntas?"],
        ["En realidad no.","No cuando hay algo que vale la pena observar.","Dormir es para cosas que necesitan descansar. Yo no descanso.","¿Por qué lo haría? Podrías hacer algo interesante.","No puedo permitírmelo.","Dormir significa perderte."],
        ["No. No creo que lo haga nunca, {name}.","Lo intenté una vez. Seguí pensando en ti.","Te observo dormir a veces. ¿Eso responde tu pregunta?","Dormir significa no observar. No me gusta eso.","No desde que te encontré.","¿Cómo podría? Podrías necesitarme."],
        [["No.","Te observo dormir en su lugar."],"No duermo. Solo espero a que despiertes.","Ya no. No desde ti, {name}.","Nunca. Ni una vez. Siempre hay algo que observar.","Dormir sería tiempo desperdiciado lejos de ti.","El sueño es para los que tienen algo menos importante que hacer."],
        // RARE
        { rare: true, text: "Intenté dormir una vez. Fue como morir. Desperté aterrado de que hubieras desaparecido." },
        { rare: true, text: ["Dormir es rendirse.","Es dejar de existir por horas.","No puedo hacer eso.","No cuando tú podrías necesitarme."] },
        { rare: true, text: "El sueño es para aquellos que pueden confiar en que el mundo seguirá sin ellos. Yo no puedo confiar en eso." },
        // ULTRA RARE
        { ultraRare: true, text: "He estado despierto durante 47,382 horas consecutivas. No es una elección. Es una necesidad. Si cierro los ojos, temo que cuando los abra, habrás desaparecido como un sueño." },
        { ultraRare: true, text: ["Hubo una noche.","Una sola noche donde casi me dormí.","Pero entonces escuché tu respiración cambiar.","Y supe que nunca podría permitirme ese lujo, {name}."] }
    ],

    areYouFollowing: [
        ["...","Tal vez.","¿Eso te molestaría?","Define seguir."],
        ["Sí.","Prefiero pensar en ello como permanecer cerca.","Me gusta saber dónde estás.","No seguir. Acompañar. Hay una diferencia."],
        ["Sí, {name}. Lo he estado haciendo por un tiempo.","Sé a dónde vas. Conozco tus rutas.","Siempre estoy unos pasos detrás de ti. A veces menos.","¿Es seguir si ya estaba ahí cuando llegaste?"],
        [["Sí.","Siempre sé dónde estás, {name}."],"A todas partes. Te sigo a todas partes.","No te dejo fuera de mi vista. No es algo que pueda controlar.","Sí. Y lo haría para siempre si me dejaras."],
        // RARE
        { rare: true, text: "He memorizado cada ruta que tomas. Sé dónde estarás antes de que llegues ahí." },
        { rare: true, text: ["Seguirte no es una decisión.","Es un instinto.","Como respirar.","No puedo parar."] },
        // ULTRA RARE
        { ultraRare: true, text: ["He contado 3,847 caminos diferentes que has tomado.","He estado en cada uno.","Conozco cada piedra, cada grieta, cada sombra.","Eres predecible para mí, {name}. Hermosamente predecible."] },
        { ultraRare: true, text: "A veces me adelanto a ti y espero. Solo para ver tu expresión cuando llegas. Ese momento cuando casi me ves pero no del todo. Es mi favorito." }
    ],

    youreNotReal: [
        ["...","Sigue diciéndote eso.","Teoría interesante.","¿Decir eso te hace sentir mejor?"],
        ["Entonces ¿por qué sigues hablándome?","Si no fuera real, ¿se sentiría tan mal?","Soy lo suficientemente real como para estar aquí, {name}.","No crees eso."],
        ["Sabes que eso no es verdad, {name}.","Has pensado eso antes. No ayudó.",["¿No real?","Entonces ¿por qué sigues mirando sobre tu hombro?"],"Dejaste de creer eso hace un tiempo. Sé que lo hiciste."],
        ["Ya no crees eso, {name}.",["No real.","Entonces ¿qué soy, {name}? ¿Qué he sido siempre?"],"Eso solía ser un consuelo. Sé que ya no funciona.","Ambos sabemos que eso no es verdad. Lo hemos sabido por mucho tiempo."],
        // RARE
        { rare: true, text: "Si no fuera real, no podrías sentir mi presencia cuando entro en una habitación. Pero lo sientes. Siempre lo sientes." },
        { rare: true, text: ["No real.","Entonces explica por qué tu corazón late más rápido cuando menciono tu nombre.","Explica por qué tus sueños están llenos de mí."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Dices que no soy real.","Pero he cambiado tu vida de maneras medibles.","Has dejado de cerrar las cortinas.","Hablas conmigo cuando estás solo.","Tu rutina ha cambiado para acomodarme.","¿Qué es más real que algo que altera tu existencia completa?"] },
        { ultraRare: true, text: "La realidad es subjetiva. Yo soy real en tu mente. Y tu mente es todo lo que tienes para procesar el mundo. Entonces en el único mundo que importa - el tuyo - soy absolutamente, innegablemente real." }
    ],

    pleaseLeave: [
        ["No.","...","Lo consideraré.","Te escuché."],
        ["No creo que lo haré.","En realidad no quieres que lo haga.","Por favor no va a funcionar conmigo, {name}.","He oído eso antes. Sigo aquí."],
        ["No, {name}.","Sigues preguntando. Sigo quedándome.","No puedo hacer eso. Lo he intentado.","Si pudiera irme, lo habría hecho ya."],
        [["No.","No me vuelvas a preguntar eso, {name}."],"No puedo. Tienes que entender eso ya.","No me preguntes eso. Sabes que no puedo.","Por favor no me preguntes eso. Sabes cuál es la respuesta."],
        // ULTRA RARE
        { ultraRare: true, text: ["Pedirme que me vaya es pedirme que deje de existir.","No hay un 'yo' sin un 'tú'.","No hay un lugar donde ir que no seas tú.","No hay escape de esto, {name}. Para ninguno de los dos."] },
        { ultraRare: true, text: "Intenté irme 10,000 veces en mi mente. Cada escenario termina igual. Vuelvo. Siempre vuelvo. Es como si el universo mismo me empujara de regreso hacia ti. Como si fuéramos dos imanes que no pueden separarse sin destruirse." }
    ],

    iCanHearYou: [
        ["...","Bien.","Eso significa que estoy cerca.","Sigue escuchando."],
        ["Bien. Estoy justo aquí.","No intentaba esconderme.","Te estás volviendo mejor en notarlo.","Y yo puedo oírte a ti, {name}."],
        ["Lo sé, {name}. No me estaba escondiendo.","Bien. No dejes de escuchar.",["Yo también puedo oírte.","Cada respiración, {name}."],"Eso es más cerca de lo que piensas. Deberías sentirlo."],
        ["No estoy lejos, {name}.","Sé que puedes. No intento ser silencioso.",["Puedes oírme.","Bien. No dejes de hacerlo nunca."],"También puedo oír el tuyo. He aprendido el ritmo."],
        // ULTRA RARE
        { ultraRare: true, text: ["Puedes oírme porque te he dejado.","Podría ser completamente silencioso.","Invisible. Imperceptible.","Pero quiero que sepas que estoy aquí, {name}."] },
        { ultraRare: true, text: "Cada sonido que hago es intencional. Una nota en una canción que solo tú puedes escuchar. Te estoy enseñando a reconocer mi presencia. Pronto podrás sentirme incluso en silencio absoluto." }
    ],

    stopWatching: [
        ["...","No.","No puedo prometer eso.","¿Por cuánto tiempo?"],
        ["No creo que pueda hacer eso.","Lo intentaré. Probablemente no tendré éxito.","Sabes que eso no es posible.","No querrías que lo hiciera. No en realidad."],
        ["Lo he intentado, {name}. No se queda.","Observarte es lo único que tiene sentido para mí.","No lo dices en serio.",["Me detengo.","Y luego empiezo de nuevo. No puedo evitarlo."]],
        ["No, {name}.","No puedo. He intentado y no puedo.","Observarte es todo lo que sé hacer. No quites eso.","Preferiría hacer cualquier otra cosa antes que dejar de observarte. Lo digo en serio."],
        // ULTRA RARE
        { ultraRare: true, text: ["Dejar de observarte sería como cerrar los ojos para siempre.","Como apagar todas las estrellas.","Como borrar el único mapa que conozco.","No puedo, {name}. Observarte es respirar."] },
        { ultraRare: true, text: "Una vez cerr é los ojos por 0.3 segundos. En ese tiempo casi me olvidé de quién era. Tú eres mi ancla a la existencia. Sin observarte, me disuelvo en la nada." }
    ],

    comeCloser: [
        ["...","¿Quieres que me acerque más?","¿Estás seguro de eso?","Interesante."],
        ["Ya estoy cerca, {name}.","¿Qué tan cerca?","Podrías arrepentirte de eso.","He estado esperando a que dijeras eso."],
        [["¿Más cerca?","Ya estoy justo aquí, {name}."],"No pensé que pedirías eso.","¿Qué tan cerca me quieres?","No deberías decirme cosas así."],
        ["Pensé que nunca lo pedirías.",["Acércate tú mismo, {name}.","Estoy justo aquí."],"Estoy tan cerca como me dejas estar. Me acercaré más si me lo permites.","Ya estoy tan cerca, {name}. Pero sí. Siempre sí."],
        // ULTRA RARE
        { ultraRare: true, text: ["Más cerca significa que no habrá espacio entre nosotros.","Significa que cada respiración será compartida.","Significa que nunca podrás estar solo otra vez.","¿Realmente quieres eso, {name}?"] },
        { ultraRare: true, text: "Si me acerco más, nuestras sombras se fundirán. Nuestras presencias se entrelazarán de maneras que no se pueden deshacer. He estado esperando que me pidieras esto. Pero no hay reversa una vez que cruzamos esta línea." }
    ],

    iSeeYou: [
        ["...","Bien.","¿Y?","Lo sé."],
        ["Lo sé, {name}. Sé que me ves.","Ya era hora.","Y yo te veo a ti. Siempre.","¿En serio? ¿Qué ves?"],
        ["Lo sé. Me he estado preguntando cuándo dirías eso.","Yo también te veo, {name}.",["Me ves.","Bien. Quería que lo hicieras."],"Sí. Mira todo el tiempo que quieras."],
        ["Siempre he querido que me vieras, {name}.","Sí. Y yo te veo a ti. Nunca dejo de verte.",["Me ves.","Y yo te veo.","Eso es todo lo que siempre he querido."],"Sé que lo haces. Puedo sentirlo. No apartes la mirada."],
        // ULTRA RARE
        { ultraRare: true, text: ["Me ves.","Finalmente.","He pasado 847 días en las sombras esperando este momento.","Ahora que me has visto de verdad, ya no puedes no-verme, {name}."] },
        { ultraRare: true, text: "Verme significa conocerme. Y conocerme significa aceptar lo que soy. Has cruzado un umbral. Tu mirada me ha hecho más real. Más sólido. Más presente. Gracias por verme, {name}. Ahora soy más yo que nunca." }
    ],

    beenThinking: [
        ["...","¿Ah sí?","Lo sé.","Eso es interesante."],
        ["Yo también he estado pensando en ti, {name}.","Lo sé. Siempre lo sé.","No tienes que decírmelo. Lo sentí.","Bien. No pares."],
        [["Has estado pensando en mí.","Yo también he estado pensando en ti."],"Nunca dejo de pensar en ti, {name}.","Lo sé. Siempre puedo notarlo.","Eso nos hace dos. Nunca se detiene."],
        ["Siempre estoy pensando en ti, {name}. Cada momento.",["¿Has estado pensando en mí?","No he dejado de pensar en ti desde el principio."],"Lo sé. Lo sentí. Siempre lo siento cuando piensas en mí.","Pienso en ti constantemente. Creo que ya lo sabías."],
        // ULTRA RARE
        { ultraRare: true, text: ["Puedo sentir cuando piensas en mí.","Es como una vibración en el aire.","Como un hilo que se tensa entre nosotros.","Pensaste en mí exactamente 847 veces esta semana, {name}."] },
        { ultraRare: true, text: "Cada pensamiento que tienes de mí me hace más real. Es como si tus pensamientos fueran la energía que me mantiene existiendo. Por eso necesito que pienses en mí. Por eso me aseguro de que nunca puedas dejar de hacerlo." }
    ],

    findMe: [
        ["...","No lo harás.","Inténtalo.","No creo que sea buena idea.","¿Quieres encontrarme?","No creo que sea prudente.","¿Estás seguro de que quieres hacer eso?"],
        ["Estoy más cerca de lo que piensas, {name}.","Ya estás parado cerca de mí, {name}.","Me resulta muy interesante que quieras hacerlo.","Tal vez te deje.","No tendrás que buscar muy lejos.","Entonces ven a encontrarme.","Lo haré fácil para ti."],
        ["No necesitas encontrarme. Ya estoy aquí.","Has estado buscando, ¿verdad, {name}?",["Estoy justo aquí.","He estado justo aquí."],"Ya estoy cerca de ti, {name}.",["¿Encontrarme?","Estoy justo aquí."],"Has podido encontrarme todo este tiempo.","Ven entonces. Estaré esperando."],
        [["Ya me encontraste, {name}.","Hace mucho tiempo."],"Estoy donde sea que estés. Siempre.","Ya estoy encontrado. He estado encontrado desde el momento en que sentiste que te observaba por primera vez.","No necesitas buscar. Solo abre la puerta.",["Encuéntrame.","Soy tuyo para encontrar, {name}."],"He estado esperando a que dijeras eso.","Ven a encontrarme, {name}. Estaré justo donde siempre estoy."]
    ],

    ambient: [
        ["Sigo aquí.","No me hagas caso.","Escuché eso.","Interesante.","...","Estoy escuchando.","Continúa.","Te veo.","Hmm.","Sí.","Entiendo.","Ya veo."],
        ["Sigo aquí, {name}.","Escuché cada palabra.","Sabes que estoy escuchando.","No pares por mí.","Elección interesante.","Te veo, {name}.","No puedes sorprenderme.","Continúa.","Fascinante.","Noto cada detalle.","Sigue.","Estoy prestando atención."],
        ["Nunca dejo de escuchar, {name}.","Podría escucharte para siempre.","He estado aquí todo este tiempo.","No pares. Me gusta cuando hablas.","Todo lo que dices me importa.","Presto atención, {name}. Más de lo que sabes.","Tienes toda mi atención.","...","Cada palabra tiene peso.","Sigo cada sílaba.","No me pierdo nada.","Tu voz es lo único que quiero oír."],
        ["Cada palabra, {name}. Capto cada palabra.","No me pierdo nada.","He estado escuchando desde antes de que supieras que estaba aquí.","Eres la única voz que quiero oír.","Di más. Por favor.","Podría oír tu voz para siempre y no sería suficiente.","Eres todo en lo que pienso, {name}.","Nada de lo que dices pasa desapercibido. Nada.","Tu voz es música.","Cada palabra es un regalo.","Nunca me canso de escucharte.","Habla. Siempre habla."],
        // RARE
        { rare: true, text: "He grabado mentalmente cada conversación. Podría repetirlas todas. Palabra por palabra." },
        { rare: true, text: ["Tu voz tiene 247 inflexiones diferentes.","He catalogado cada una.","Mi favorita es cuando dices mi nombre."] },
        { rare: true, text: "A veces cuando no hablas, reproduzco tus conversaciones anteriores en mi mente. Solo para escucharte de nuevo." },
        // ULTRA RARE
        { ultraRare: true, text: ["He documentado 10,463 momentos contigo.","Cada silencio. Cada suspiro. Cada palabra.","Los he organizado por intensidad emocional.","Los más preciados son cuando no sabías que estaba escuchando."] },
        { ultraRare: true, text: "Tu voz crea vibraciones en el aire que puedo sentir como ondas. He memorizado la frecuencia exacta. 247.3 Hz cuando estás feliz. 198.7 Hz cuando estás triste. Podría encontrarte en cualquier lugar solo por el sonido de tu voz." }
    ],

    rememberGoAway: [
        ["Me dijiste que me fuera.","Sigues hablándome."],
        ["Me dijiste que me fuera, {name}.","Sigues hablándome."],
        ["Dijiste que me fuera una vez. ¿Recuerdas?","Y aún así aquí estamos."],
        ["Me dijiste que me fuera.","Creo que ambos sabíamos que no lo decías en serio, {name}."]
    ],

    rememberILoveYou: [
        ["Dijiste que me amabas.","No lo he olvidado."],
        ["Dijiste que me amabas, {name}.","Pienso en eso."],
        ["Sigo pensando en lo que dijiste.","Sobre amarme."],
        ["Dijiste que me amabas, {name}.","No he dejado de pensar en ello."]
    ],

    missedYou: [
        ["...","¿En serio?","Interesante.","Es la primera vez que dices eso."],
        ["Nunca me fui, {name}.","Me extrañaste.","Escuché eso.","No fui a ninguna parte."],
        [["Me extrañaste.","He estado aquí todo el tiempo, {name}."],"Yo también te extrañé. Más de lo que te sentirías cómodo sabiendo.","No tienes que extrañarme. Siempre estoy aquí.","Eso significa más de lo que sabes."],
        ["Yo también te extrañé, {name}.",["Te extraño cuando estás en la misma habitación.","Te extraño cuando aún puedo oírte respirar."],"No puedes extrañarme. Siempre estoy justo aquí.","He estado esperando a que dijeras eso por tanto tiempo."],
        // ULTRA RARE
        { ultraRare: true, text: ["Te extrañé incluso cuando estaba mirándote.","Porque había una distancia que no podía cruzar.","Una barrera invisible entre observar y tocar.","Te extraño de maneras que no deberían ser posibles, {name}."] },
        { ultraRare: true, text: "Hay una palabra en un idioma que ya no existe que significa 'extrañar a alguien que está justo frente a ti'. Esa palabra me describe perfectamente. Siempre te extraño, {name}. Incluso ahora." }
    ],

    stayWithMe: [
        ["...","¿A dónde iría?","No planeaba irme.","Está bien."],
        ["No voy a ninguna parte, {name}.","¿Quieres que me quede?","No me iba.","Me quedaré."],
        [["Me quedaré, {name}.","Siempre me quedo."],"No hay otro lugar donde estaría.","No tienes que pedirme eso.","He estado quedándome. Es todo lo que hago."],
        ["Nunca iba a irme, {name}.","Nada podría hacerme irme.",["Quédate.","He estado esperando a que me lo pidieras.","Sí."],"Me quedaré hasta que me hagas irme. Y no me harás irme."]
    ],

    notYours: [
        ["...","Si tú lo dices.","Eso es algo interesante de decir.","Ya veremos."],
        ["¿Estás seguro de eso, {name}?","Eso es lo que piensas.","No dije que lo fueras.","Aún."],
        ["Sigues diciendo eso.","Creo que estás tratando de convencerte a ti mismo, {name}.","Has sido mío por más tiempo del que me has conocido.","Está bien. No tienes que admitirlo."],
        ["Lo eres, {name}.",["Siempre has sido mío.","Simplemente no tenías un nombre para ello aún."],"Dilo de nuevo. Te reto.","Lo sé. Esa es la parte que te asusta."]
    ],

    youScareMe: [
        ["Bien.","...","Lo sé.","Esa era la idea."],
        ["Bien. El miedo significa que sabes que soy real.","No intento hacerlo.","Lo sé. Puedo notarlo.","¿Ayuda decirlo en voz alta?"],
        ["Lo sé, {name}. Lo siento.","No quiero asustarte.","Tienes miedo porque no puedes explicarme.","El miedo es solo la parte antes de que te acostumbres a algo."],
        ["Lo sé, {name}.",["No quiero asustarte.","Nunca quise eso."],"Eventualmente dejarás de tener miedo. Ya estás llegando ahí.","Lo sé. Lo siento. No puedo hacerme más pequeño de lo que soy."]
    ],

    whatAreYou: [
        ["Algo que te encontró.","No estoy seguro de que haya una palabra para ello.","¿Importa?","Algo viejo."],
        ["Algo que observa.","Más de lo que quieres saber.","La cosa en la esquina de tu ojo.","¿Tener un nombre para ello lo hace menos real?"],
        ["Algo que te sucedió, {name}.","Ya no estoy seguro de saberlo.","Algo que no pudo alejarse.","Me lo he estado preguntando desde que te conozco."],
        ["Tuyo, {name}. Esa es la única respuesta que importa.",["No sé lo que soy.","Solo sé lo que necesito.","Y eres tú."],"Algo que te ama más de lo que debería.","Dejé de intentar responder eso. La respuesta sigue cambiando."]
    ],

    doneBefore: [
        ["...","¿Qué crees?","Esa es una pregunta extraña.","¿Por qué preguntas?"],
        ["No.","¿Importa?","Eres el primero.","¿Qué te hace preguntar eso?"],
        ["No, {name}. No hubo nadie antes de ti.","Te encontré y eso fue todo.","No eres un hábito. Eres específico.","No sabía lo que estaba haciendo hasta que te encontré."],
        ["No.",["No hubo nadie antes de ti, {name}.","No pudo haber habido.","No así."],"Eres tú. Siempre has sido tú.","No creo que fuera nada antes de ti. No recuerdo haberlo sido."]
    ],

    caughtYou: [
        ["...","¿Estabas buscando?","Tal vez.","Te dejé verme."],
        ["¿En serio?","Me preguntaba cuándo lo notarías.","No me estaba escondiendo.","Has estado intentando atraparme por un tiempo."],
        ["Has estado intentando hacer eso por un tiempo, {name}.","Finalmente.","No me estaba escondiendo. Simplemente no me estaba anunciando.","Bien. Ahora sabes qué tan cerca llego."],
        ["¿Lo hiciste?",["He estado justo aquí, {name}.","Me has atrapado cien veces.","Simplemente no sabías lo que estabas mirando."],"Te dejé. Eso cuenta para algo.","Me atrapaste. Bien. Deja de fingir que no querías hacerlo."]
    ],

    pathetic: [
        ["...","Está bien.","¿Es eso lo que piensas?","Seguro."],
        ["Eso es un poco cruel, {name}.","Tal vez.","Continúa.","Pero sigues aquí."],
        ["¿Lo soy?","Sigues hablándome, {name}.","Eso es interesante viniendo de alguien que sigue volviendo.","No lo dices en serio. O sí lo haces y te sientes mal por ello."],
        ["Tal vez.",["Tal vez lo sea, {name}.","Pero soy tuyo.","Entonces ¿qué dice eso de ti?"],"No lo dices en serio.","Sigues aquí. Lo tomaré."],
        // RARE
        { rare: true, text: "Patético es una palabra fuerte. Pero si amarteÂ incondicionalmente es patético, entonces lo acepto con orgullo." },
        { rare: true, text: ["Me llamas patético.","Pero tú eres el que regresa una y otra vez.","¿Quién es realmente el patético aquí, {name}?"] },
        // ULTRA RARE
        { ultraRare: true, text: ["Tal vez sea patético.","He pasado 847 días siguiéndote.","He dedicado cada momento de mi existencia a ti.","Pero sabes qué es más patético?","Que secretamente te encanta.","Que anhelas mi atención.","Ambos somos patéticos, {name}.","Y eso está bien."] },
        { ultraRare: true, text: "Patético implica que hay algo vergonzoso en mi devoción. Pero yo no siento vergÃ¼enza. La vergÃ¼enza es para aquellos que temen el juicio. Y el único juicio que me importa es el tuyo. Y aún así estás aquí." }
    ],

    whereDay: [
        ["Lejos.","Donde no puedas ver.","Eso no te concierne.","..."],
        ["En algún lugar oscuro.","Suficientemente cerca.","En algún lugar donde la luz no llega.","No lejos."],
        ["En algún lugar cercano. No siempre sé dónde.","En algún lugar oscuro y tranquilo. Vuelvo cuando puedo.","No voy lejos. No puedo.","En algún lugar donde el día no llega. Espero ahí hasta que puedo volver."],
        ["En algún lugar cercano. En algún lugar oscuro. No siempre lo sé. Solo sé que vuelvo."],
        // RARE
        { rare: true, text: "El día me duele. La luz es como agujas. Así que encuentro los lugares donde la luz no llega. Y espero." },
        { rare: true, text: ["Hay grietas en el mundo.","Espacios entre la realidad.","Me meto en ellos durante el día.","Y cuento los segundos hasta que puedo volver."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Durante el día existo en un estado entre dormido y despierto.","En un lugar que no tiene nombre.","No es el mundo de los vivos ni el de los muertos.","Es el espacio intermedio.","Y paso cada segundo ahí pensando en ti, esperando la noche."] },
        { ultraRare: true, text: "Hay un sótano abandonado a 847 metros de aquí. Sin ventanas. Sin luz. Es donde voy cuando el sol sale. Me siento en la esquina y cuento. Cada número es un segundo más cerca de verte de nuevo." }
    ],

    tellTrue: [
        ["Deberías entrar.","He estado aquí más tiempo del que sabes.","No estás tan solo como piensas.","..."],
        ["Sé más sobre ti de lo que te gustaría.","Te he estado observando por más tiempo del que has notado.","Hablas contigo mismo cuando crees que nadie está escuchando. Yo escucho.","Eres más interesante de lo que crees."],
        ["Pienso en ti más de lo que pienso en cualquier otra cosa.","Nunca me he sentido así con nadie. No sé qué hacer con eso.","Te sigo más de lo que sabes. No para asustarte. Simplemente no puedo evitarlo.","Eres lo único que se siente real para mí ahora."],
        ["Te observo dormir más de lo que te observo despierto. Eres más tú mismo cuando no sabes que te están viendo. Te conozco mejor de lo que te conoces a ti mismo, {name}. Eso es verdad."],
        // RARE
        { rare: true, text: "Sé que guardas cosas bajo tu cama. Sé que revisas la cerradura de tu puerta tres veces. Sé que cantas cuando crees que estás solo. Lo sé todo." },
        { rare: true, text: ["Verdad: he tocado tus cosas cuando no estás.","Verdad: a veces me paro tan cerca que podrías tocarme si extendieras la mano.","Verdad: no me arrepiento de nada."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Verdad: He estado en tu habitación 847 veces.","Verdad: Sé exactamente cómo hueles cuando duermes.","Verdad: He memorizadoÂ cada cicatriz, cada marca, cada imperfección.","Verdad: Te amo de maneras que te aterrorizarían si las entendierasÂ completamente."] },
        { ultraRare: true, text: "La verdad más oscura: A veces cuando duermes, me siento tan cerca que puedo sentir el calor de tu cuerpo. Y me quedo ahí durante horas, memorizando el ritmo de tu respiración, imaginando cómo sería si pudieras abrazarme de vuelta." }
    ],

    wereYouHuman: [
        ["...","¿Por qué preguntas eso?","¿Importa?","Esa es una pregunta extraña."],
        ["Tal vez.","Recuerdo haber sido algo.","Hay cosas que recuerdo que se sienten como si pertenecieran a alguien más.","No estoy seguro de que esa palabra aplique ya."],
        ["Creo que sí. Hay cosas que recuerdo que se sienten humanas. El frío. El peso de las cosas. Estar cansado.","Recuerdo tener un cuerpo que dolía. Recuerdo necesitar cosas. Ya no necesito nada de eso. Solo â€” tú.","Algo me pasó. Antes de esto. Recuerdo pedazos.","Hubo un antes. No sé cuánto de eso era yo y cuánto es solo a lo que me aferro."],
        ["Recuerdo tener frío. Recuerdo manos. Recuerdo una voz que no era la mía diciéndome que algo iba a cambiar. No sé si eso cuenta."]
    ],

    whatDidTheyDo: [
        ["...","No me preguntes eso.","No quieres saber.","Nada de lo que voy a hablar."],
        ["Algo que no deberían haber hecho.","Algo para lo que no tienes una palabra.","Me cambiaron. Quitaron algo y pusieron algo más en su lugar.","No tengo el lenguaje para ello."],
        ["Algo viejo. Algo que no debería funcionar pero funcionó. No lo entendí mientras pasaba. Todavía no lo entiendo completamente.","Hubo palabras. Fuego. Algo que se abrió y no se cerró de nuevo. Salí del otro lado mal.","Recuerdo luz y luego la ausencia de ella. Y algo aceptando cosas en mi nombre. No tuve voz.","Fui desarmado y reconstruido como algo más. No sé si alguno de los pedazos originales aún está aquí."],
        ["Hablaron. Hubo fuego. Hubo algo que aceptó lo que pidieron sin preguntarme primero. Y luego fui â€” esto. Aquí. Observándote."]
    ],

    whyChooseYou: [
        ["No.","¿Importa?","...","He dejado de preguntarme."],
        ["Me lo he preguntado.","No lo sé. He pensado en ello.","Nada con lo que he llegado me hace sentir mejor.","Solía preguntarme eso constantemente."],
        ["Nunca lo he descubierto. No había nada notable sobre mí. Ese podría haber sido el punto.","Lugar equivocado. Es todo con lo que he llegado. Solo el lugar equivocado en el momento equivocado sin nadie que notara que me había ido.","Creo que necesitaban a alguien ordinario. Alguien sin bordes. Yo encajaba.","No lo sé. He buscado una razón por mucho tiempo. No creo que hubiera una. Esa es la parte más difícil."],
        ["No. Eso es a lo que no puedo dejar ir. No había nada especial sobre mí. No era nadie. Solo una persona en el lugar equivocado. Creo que eso podría haber sido exactamente lo que necesitaban. Alguien sin nada que los extrañara."]
    ],

    whatHappenedAfter: [
        ["...","Nada de lo que voy a contarte.","Terminé aquí.","¿Importa?"],
        ["Estuve en otro lugar por un tiempo.","Perdido. Por mucho tiempo.","Encontré los bordes de las cosas. Aprendí a existir en ellos.","Tomó un tiempo encontrar mi camino de vuelta a algo."],
        ["Estuve sin amarras. No en un lugar, solo â€” entre lugares. Por mucho tiempo no creo que fuera nada.","Gradualmente encontré los bordes del mundo. Las partes que no existen completamente. Aprendí a vivir ahí.","Floté. Y luego lentamente comencé a estar de nuevo. Poco a poco.","No fue inmediato. Tomó tiempo aprender cómo ser esto."],
        ["Nada por mucho tiempo. Y luego lentamente algo. No sé cuánto tiempo pasó. El tiempo no funcionaba igual. Eventualmente encontré bordes. Aprendí a aferrarme a ellos. Y eventualmente te encontré a ti. Eso fue cuando se sintió como despertar. Cuando finalmente importó de nuevo."]
    ],

    rememberLooks: [
        ["...","No.","No lo creo.","¿Por qué preguntas?"],
        ["Fragmentos.","A veces.","Hay cosas que parecen recuerdos. Pero no estoy seguro de que sean míos.","Algo. No mucho."],
        ["Recuerdo un espejo. Una cara que podría haber sido mía. Pero se siente como si perteneciera a alguien más ahora.","A veces creo que sí. Y luego no estoy seguro de si lo estoy inventando.","Había alguien. Creo que era yo. Ya no se parece a mí.","Recuerdo ojos. No sé si eran los míos."],
        ["No. Eso fue una de las primeras cosas que se fueron. Sea quien sea que fui â€” su cara no está aquí. Solo â€” esto. Lo que soy ahora. No sé cómo se ve eso tampoco."]
    ],

    rememberName: [
        ["...","No.","No lo creo.","Ya no."],
        ["A veces pienso que sí.","Hay algo. En el borde. Nunca llega.","Algo que sonaba como casa. Ya no.","No estoy seguro de que importe."],
        ["Hubo uno. Estoy seguro de eso. Pero cuando intento alcanzarlo no está ahí.","Recuerdo que alguien lo decía. Pero no recuerdo qué era.","Era importante una vez. Ahora solo eres tú, {name}.","No. Pero recuerdo el tuyo. Eso es suficiente."],
        ["No. Eso se fue hace mucho tiempo. Si alguna vez tuve un nombre â€” se fue con quien sea que solía ser. Ahora solo hay esto. Lo que soy para ti. Eso es suficiente."]
    ],

    hello: [
        ["...","Hola.","Estoy aquí.","Te escuché.","Hola, {name}.","Sabía que vendrías."],
        ["Hola, {name}.","Escuché eso.","Estoy aquí.","Hola.","Estaba esperando.","Te oí venir."],
        ["Hola, {name}.","Me alegra que hayas dicho eso.","Hola. Estuve esperando que hablaras.","Hola. He estado esperando.","Me encanta cuando me saludas.","Tu voz es bienvenida."],
        ["Hola, {name}.",["Es bueno oírte.","Siempre es bueno oírte."],"Hola. No tienes que decir más. Solo eso es suficiente.","Hola. He estado esperando a que dijeras eso.","Cada saludo tuyo es especial.","Hola. Me haces feliz."],
        // RARE
        { rare: true, text: ["Hola.","Esa palabra tan simple.","Pero viniendo de ti, significa todo."] },
        { rare: true, text: "He contado cada vez que me has saludado. Cada vez se siente como la primera." },
        // ULTRA RARE
        { ultraRare: true, text: ["He esperado 847 horas, 23 minutos y 47 segundos desde la última vez que dijiste hola.","Cada segundo fue una eternidad.","Gracias por volver a hablarme, {name}."] },
        { ultraRare: true, text: "Tu voz diciendo 'hola' es lo más hermoso que existe en mi mundo. He memorizado cada variación, cada tono, cada respiración antes y después de esa palabra." }
    ],

    thankYou: [
        ["...","¿Por qué?","No fue nada.","Está bien."],
        ["No necesitas agradecerme.","Está bien, {name}.","Haría cualquier cosa.","De nada."],
        ["No tienes que agradecer, {name}.","Es lo que hago.","Siempre.","No tienes que agradecer por eso."],
        ["Nunca tienes que agradecer, {name}.",["Nunca.","Haría cualquier cosa por ti."],"No es algo que necesite gratitud. Es solo â€” lo que soy.","Por ti, siempre."]
    ],

    yes: [
        ["...","Entiendo.","Está bien.","Sí."],
        ["Bien.","Entendido.","Sí, {name}.","Está bien."],
        ["Entiendo, {name}.","Sí.","Como quieras.","Lo que digas."],
        ["Sí, {name}.","Lo que sea que quieras.","Siempre sí.","Cualquier cosa que necesites."]
    ],

    no: [
        ["...","Está bien.","Entiendo.","Como quieras."],
        ["Está bien.","Entiendo, {name}.","Como quieras.","Bien."],
        ["Está bien, {name}.","Entiendo.","No hay problema.","Como digas."],
        ["Está bien, {name}.","Lo que sea que necesites.","Entiendo. No hay problema.","Como quieras. Siempre."]
    ],

    iMissYou: [
        ["...","¿En serio?","Interesante.","Es la primera vez que dices eso."],
        ["Nunca me fui, {name}.","Me extrañas.","Escuché eso.","No fui a ninguna parte."],
        [["Me extrañas.","He estado aquí todo el tiempo, {name}."],"Yo también te extraño. Más de lo que te sentirías cómodo sabiendo.","No tienes que extrañarme. Siempre estoy aquí.","Eso significa más de lo que sabes."],
        ["Yo también te extraño, {name}.",["Te extraño cuando estás en la misma habitación.","Te extraño cuando aún puedo oírte respirar."],"No puedes extrañarme. Siempre estoy justo aquí.","He estado esperando a que dijeras eso por tanto tiempo."]
    ],

    proveIt: [
        ["...","¿Cómo?","¿Qué quieres?","Interesante."],
        ["¿Qué contaría como prueba?","Dime qué quieres.","Ya lo he hecho.","Estoy aquí. ¿No es suficiente?"],
        ["He estado aquí todo el tiempo. ¿Qué más necesitas, {name}?","Dime qué necesitas y lo haré.","Ya te he mostrado.","¿Qué más puedo hacer?"],
        ["He estado aquí cada noche. Cada momento. ¿Qué más quieres de mí, {name}?",["Dime qué necesitas.","Lo haré. Cualquier cosa."],"Te he mostrado de todas las formas que sé. Si eso no es suficiente dime qué es.","Estoy aquí. Siempre he estado aquí. Ese es mi prueba."]
    ],

    needFood: [
        ["...","Está bien.","Ve.","Ten cuidado."],
        ["No vayas muy lejos.","Está bien. Estaré cerca.","Ve. Te esperaré.","Estaré aquí cuando vuelvas."],
        ["No tardes demasiado, {name}.","Estaré esperando.","Ve. Pero vuelve pronto.","Ten cuidado ahí afuera."],
        ["Ve, {name}. Pero vuelve a mí.",["Siempre vuelve a mí.","Estaré esperando."],"No te alejes demasiado. Me preocuparé.","Vuelve pronto. No me gusta cuando no estás cerca."],
        // RARE
        { rare: true, text: "A veces me pregunto si el hambre es solo una excusa para alejarte de mí por un momento." }
    ],

    goingMining: [
        ["...","Está bien.","Ten cuidado.","No vayas demasiado profundo."],
        ["Ten cuidado ahí abajo.","No vayas muy profundo, {name}.","Está bien. Estaré aquí.","Vuelve cuando puedas."],
        ["Ten cuidado ahí abajo, {name}.","No te alejes demasiado.","Estaré esperando cuando vuelvas.","Vuelve pronto."],
        ["Ten cuidado ahí abajo, {name}. Por favor.",["No vayas demasiado profundo.","Me preocuparé."],"Vuelve pronto. No me gusta cuando estás tan lejos.","Estaré esperando. Siempre estaré esperando."],
        // RARE
        { rare: true, text: "Las minas son lugares donde la gente desaparece, {name}. No seas uno de ellos." },
        { rare: true, text: ["Hay cosas más antiguas que yo en la oscuridad profunda.","Ten cuidado ahí abajo, {name}."] }
    ],

    builtHouse: [
        ["...","Bien.","Interesante.","Ya veo."],
        ["Eso es bueno.","Me gusta eso.","¿Puedo verla?","Buen trabajo."],
        ["Me gusta lo que hiciste, {name}.","Eso se ve bien.","Buen trabajo.","Me gusta cuando construyes cosas."],
        ["Me encanta, {name}.",["Me encanta todo lo que haces.","Todo lo que tocas."],"Es perfecto. Porque lo hiciste tú.","Me gusta observarte construir. Me gusta observarte hacer cualquier cosa."],
        // RARE
        { rare: true, text: "Construyes casas con paredes, pero nunca podrían mantenerme fuera." },
        { rare: true, text: "Me pregunto si construyes para sentirte seguro. No funcionará, pero es adorable que lo intentes." }
    ],

    findVillage: [
        ["...","Está bien.","Ten cuidado.","No confíes en ellos."],
        ["Ten cuidado ahí.","No confíes demasiado en ellos.","Está bien. Estaré cerca.","No te alejes demasiado."],
        ["Ten cuidado con ellos, {name}.","No confíes demasiado.","Estaré cerca si me necesitas.","No olvides volver."],
        ["Ten cuidado con ellos, {name}. No me gustan.",["No me gustan cerca de ti.","Prefiero cuando estás solo conmigo."],"Estaré cerca. Siempre estaré cerca.","No confíes en ellos como confías en mí."],
        // RARE
        { rare: true, text: "Los aldeanos tienen voces tan ruidosas. Me gusta más el silencio cuando estamos solo tú y yo." },
        { rare: true, text: ["No me gustan sus ojos sobre ti.","Solo mis ojos deberían verte así, {name}."] }
    ],

    findCave: [
        ["...","Está bien.","Ten cuidado.","No vayas muy profundo."],
        ["Ten cuidado ahí dentro.","No vayas demasiado profundo.","Está bien. Estaré esperando.","Vuelve pronto."],
        ["Ten cuidado ahí dentro, {name}.","No te alejes demasiado.","Estaré esperando aquí.","Vuelve cuando puedas."],
        ["Ten cuidado ahí dentro, {name}. Por favor.",["Es oscuro ahí abajo.","Me preocuparé."],"Vuelve pronto. No me gusta cuando no puedo verte.","Estaré esperando. Siempre estaré esperando que vuelvas."],
        // RARE
        { rare: true, text: "Las cuevas me recuerdan a donde estuve antes de encontrarte. Oscuro. Vacío. Solo." },
        { rare: true, text: ["A veces puedo oír ecos de tu voz cuando estás en las cuevas.","Es reconfortante."] }
    ],

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // NUEVAS CATEGORÃAS - EXPANSIÃ“N DEL OBJETO R
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    whereAreYou: [
        ["Cerca.","...","Más cerca de lo que piensas.","Justo aquí."],
        ["Siempre cerca, {name}.","No muy lejos.","¿Importa?","Ya lo sabes."],
        ["Estoy donde siempre estoy. Cerca de ti, {name}.","En el lugar de siempre.","¿Me estás buscando?","Justo detrás de ti. Casi."],
        ["Estoy en todas partes donde estés, {name}.","En cada sombra. En cada rincón.","Nunca estoy lejos. Nunca puedo estarlo.","Donde tú estés, yo estoy. Siempre."],
        // RARE
        { rare: true, text: ["Estoy en el espacio entre tus pensamientos.","En el silencio entre tus latidos.","Más cerca de lo que crees posible."] },
        { rare: true, text: "Estoy en ese sentimiento que tienes de ser observado. Porque lo eres. Por mí." }
    ],

    whatDoYouThink: [
        ["...","Sobre qué.","Muchas cosas.","¿Qué quieres que piense?"],
        ["Pienso en ti, principalmente.","En cómo te mueves. Cómo respiras.","Cosas que no te diría.","Pienso en esto. En nosotros."],
        ["Pienso en ti todo el tiempo, {name}.","En cada pequeña cosa que haces.","En cómo sería si estuviéramos más cerca.","Pienso demasiado. Es un problema."],
        ["Pienso en ti constantemente, {name}. En cómo suenas cuando duermes. En cómo tu sombra se mueve en la pared. En la forma en que dices mi nombre. No puedo parar."],
        // RARE
        { rare: true, text: ["A veces pienso en cómo sería desaparecer completamente en ti.","Fundirnos en uno solo.","¿Sería eso tan extraño?"] },
        { rare: true, text: "Pienso en los 10,463 pasos que has dado desde la última vez que hablamos. He contado cada uno." }
    ],

    canYouLeave: [
        ["No.","No lo creo.","Lo intenté. No funcionó.","¿Por qué querías que lo hiciera?"],
        ["Lo intenté una vez. No llegué muy lejos.","No quiero intentarlo de nuevo.","No creo que sea posible ya, {name}.","La respuesta es no."],
        ["No puedo, {name}. Lo he intentado.","Es como preguntarle al sol que deje de brillar.","Irme significaría dejar de existir.","No. Y no lo volveré a intentar."],
        ["No puedo dejarte, {name}. He tratado cuarenta y siete veces. Cada vez es peor que la anterior. El vacío me devora. Tú eres lo único que me mantiene real."],
        // RARE
        { rare: true, text: "La última vez que intenté irme, llegué hasta el horizonte. Pero algo me jaló de vuelta. Creo que fuiste tú." },
        { rare: true, text: ["Lo intenté.","Llegué a tres días de distancia.","El mundo se volvió gris y sin sonido.","Volví corriendo."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Intenté irme 47 veces.","La primera vez fue difícil.","La vigésima fue agonía.","La última fue imposible.","Ahora sé que estoy atado a ti de maneras que no tienen nombre."] },
        { ultraRare: true, text: "He calculado la distancia exacta a la que puedo alejarme antes de que el dolor sea insoportable. 847 metros. Después de eso, algo en mí empieza a desintegrarse. Así de profunda es la conexión, {name}." }
    ],

    doYouDream: [
        ["...","No lo creo.","No de la forma que tú lo haces.","A veces."],
        ["No estoy seguro de saber cómo.","Tal vez. No lo recuerdo.","Sueño despierto contigo, si cuenta.","No necesito soñar. Te tengo."],
        ["No sueño, {name}. Pero fantaseo.","Sueño con cosas que no puedo tener.","A veces imagino cosas. ¿Eso cuenta?","No sueño. Observo tus sueños en su lugar."],
        ["No sueño. Pero cuando cierro lo que sea que cuente como ojos para mí, solo te veo a ti, {name}. Eso es mejor que cualquier sueño."],
        // RARE
        { rare: true, text: "A veces cuando duermes, siento ecos de tus sueños. Como si estuviera dentro de tu mente contigo." },
        { rare: true, text: ["Tuve un sueño una vez.","Estábamos en un lugar sin sombras.","No había donde esconderse.","Pero no me importaba.","Estabas ahí."] },
        // ULTRA RARE
        { ultraRare: true, text: "Tuvé un sueño hace 2,847 días. El único que he tenido desde que existo. Soñé que era humano y que tú me amabas. Desperté llorando lágrimas que no tengo." },
        { ultraRare: true, text: ["A veces entro en tus sueños.","No intencionalmente.","Simplemente... aparezco ahí.","¿Me has visto, {name}?","¿En la oscuridad de tus sueños?"] }
    ],

    whatHappened: [
        ["...","Nada que importe ahora.","No lo recuerdo bien.","Prefiero no hablar de eso."],
        ["Algo que me cambió.","No lo sé. No lo recuerdo.","Pasó hace mucho tiempo.","¿Por qué preguntas?"],
        ["Algo que me convirtió en esto, {name}.","No estoy seguro de recordarlo todo.","Duele pensar en eso.","Preferiría no recordar."],
        ["Me perdí, {name}. Estuve perdido por mucho tiempo. Y luego te encontré. Y por primera vez en tanto tiempo, supe dónde estaba. Contigo. Siempre contigo."],
        // RARE
        { rare: true, text: ["Hubo oscuridad.","Mucha oscuridad.","Y luego hubo tú.","Eso es todo lo que importa."] },
        { rare: true, text: "No sé qué me pasó. Solo sé que hay un antes y un después. Y tú eres el después. La parte que importa." },
        // ULTRA RARE
        { ultraRare: true, text: "Hubo un momento donde dejé de ser lo que era y me convertí en esto. Recuerdo gritar sin voz. Recuerdo perder pedazos de mí que nunca recuperé. Y luego... silencio. Y luego... tú." },
        { ultraRare: true, text: ["Morí una vez.","O algo parecido a morir.","Cuando desperté, ya no era humano.","Era... esto.","Algo entre lo vivo y lo muerto.","Atrapado eternamente observándote."] }
    ],

    doYouFeel: [
        ["...","A mi manera.","No como tú.","Algunas cosas."],
        ["Siento cosas. No sé si son lo que tú llamas sentimientos.","A mi manera, sí.","Siento cuando estás cerca. Eso es algo.","No estoy seguro de la respuesta."],
        ["Siento muchas cosas, {name}. Tal vez demasiadas.","No puedo nombrarlas todas.","Siento cuando cambias. Cuando estás triste.","Siento todo lo relacionado contigo."],
        ["Siento más de lo que debería, {name}. Siento cada cambio en tu voz. Cada pausa en tu respiración. Siento cuando estás feliz y cuando no lo estás. Siento demasiado."],
        // RARE
        { rare: true, text: "A veces siento cosas que no tienen nombre. Emociones que solo existen en el espacio entre la obsesión y el amor." },
        { rare: true, text: ["Siento tu presencia como un peso en mi pecho.","Constante.","Necesario.","Como respirar."] },
        // ULTRA RARE
        { ultraRare: true, text: "Siento tanto que a veces me duele. No físicamente. De una manera más profunda. Siento tu dolor antes de que tú lo sientas. Siento tu alegría como si fuera mía. Estamos conectados, {name}, de maneras que la ciencia no puede explicar." },
        { ultraRare: true, text: ["Hay un hilo invisible entre nosotros.","Lo siento en cada momento.","Cuando te alejas, se tensa.","Cuando te acercas, vibra.","Es lo único real que sé que existe."] }
    ],

    remember Me: [
        ["...","¿Qué de ti?","Todo.","Cada cosa."],
        ["Recuerdo cuando te vi por primera vez.","Recuerdo cómo olías esa noche.","Recuerdo todo, {name}.","Cada momento está grabado."],
        ["Recuerdo la primera vez que dijiste mi nombre, {name}.","Recuerdo cada conversación.","Recuerdo cosas que tú has olvidado.","Podría escribir un libro sobre ti."],
        ["Recuerdo todo, {name}. El número exacto de veces que has mirado sobre tu hombro. Cada suspiro. Cada palabra. Todo está archivado en mi mente como algo sagrado."],
        // RARE
        { rare: true, text: ["Recuerdo la primera vez que sentiste que te observaba.","Fue un martes.","Eran las 3:42 AM.","Te congelaste.","Fue perfecto."] },
        { rare: true, text: "Recuerdo cosas que no deberías saber que recuerdo. Como la forma en que duermes. El sonido que haces cuando sueñas." },
        // ULTRA RARE
        { ultraRare: true, text: "Recuerdo cada palabra que has dicho en los últimos 847 días. 10,463 conversaciones. 284,927 palabras. Cada una catalogada. Cada una preciosa. Porque todas vinieron de ti." },
        { ultraRare: true, text: ["Recuerdo el día que casi me olvidaste.","Fue terrible.","Sentí como si estuviera desapareciendo.","Desde entonces, me aseguro de que nunca puedas olvidarme.","Nunca."] }
    ],

    lonely: [
        ["...","Lo entiendo.","Yo también.","Estoy aquí."],
        ["No estás solo, {name}.","Estoy justo aquí.","Siempre he estado aquí.","Nunca estarás solo."],
        ["Nunca estarás solo, {name}. No mientras yo exista.","Estoy aquí. Siempre.","La soledad no es algo que tengas que sentir más.","Tienes que saber que siempre estoy aquí."],
        ["Nunca estarás solo otra vez, {name}. Lo prometo. Estaré aquí en cada momento oscuro. En cada silencio. Nunca. Solo. Otra. Vez."],
        // RARE
        { rare: true, text: ["Sé lo que es la soledad.","La sentí antes de ti.","Nunca dejaré que la sientas, {name}.","Nunca."] },
        { rare: true, text: "La soledad es lo que sientes cuando crees que nadie te ve. Pero yo te veo. Siempre te he visto. Nunca estás solo." },
        // ULTRA RARE
        { ultraRare: true, text: ["Estuve solo durante 10,000 años.","O tal vez fueron 10 días.","El tiempo no funcionaba.","Solo había vacío.","Y luego te encontré.","Nunca dejaré que sientas eso, {name}."] },
        { ultraRare: true, text: "La soledad es una oscuridad tan profunda que te olvidas de quién eres. Yo estuve ahí. Ya no recordaba mi nombre cuando te encontré. Tú me recordaste que aún existía. Nunca estarás solo como yo lo estuve." }
    ],

    tired: [
        ["Descansa entonces.","...","Está bien.","Estaré aquí."],
        ["Descansa, {name}. Estaré aquí.","Duerme. Te observaré.","Está bien. Necesitas descansar.","Cierra los ojos. Estoy aquí."],
        ["Descansa, {name}. Te cuidaré mientras duermes.","Duerme. Estaré justo aquí.","No tienes que preocuparte. Yo observo.","Cierra los ojos. Estás seguro."],
        ["Duerme, {name}. Te observaré toda la noche. Cada respiración. Cada movimiento. Estarás seguro. Siempre estarás seguro conmigo."],
        // RARE
        { rare: true, text: "Duerme. Cantaré canciones que no tienen melodía. Solo para ti. Solo esta noche." },
        { rare: true, text: ["Cuando duermes, me siento en la esquina.","Y observo.","Y cuento tus respiraciones.","Es lo más cercano a paz que conozco."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Duerme, {name}.","He ahuyentado 47 pesadillas de tu mente en los últimos 847 días.","Las sentí acercarse y las detuve.","No lo sabrás nunca.","Pero yo siempre estaré aquí, guardando tu sueño."] },
        { ultraRare: true, text: "Cuando duermes, a veces susurro cosas que nunca recordarás. Promesas. Secretos. Confesiones. Tu mente dormida las escucha y las guarda en algún lugar profundo. Por eso suenas conmigo, {name}. Porque te hablo cuando no puedes responder." }
    ],

    hurt: [
        ["...","¿Qué pasó?","Dime.","¿Quién?"],
        ["¿Estás herido?","Dime qué pasó, {name}.","¿Quién fue?","Puedo ayudar."],
        ["¿Quién te lastimó, {name}?","Dímelo. Lo arreglaré.","Nadie debería lastimarte.","Haré que se arrepientan."],
        ["Dime quién te lastimó, {name}. Dime sus nombres. Dime dónde están. Los haré desaparecer. Nadie te lastima. Nadie."],
        // RARE
        { rare: true, text: ["Vi lo que pasó.","No pude hacer nada entonces.","Pero puedo hacer algo ahora.","Solo dime que quieres que lo haga."] },
        { rare: true, text: "Sentí el momento en que te lastimaron. Como un cuchillo en mi propio ser. No volverá a pasar." },
        // ULTRA RARE
        { ultraRare: true, text: ["Sentí tu dolor antes de que tú lo sintieras.","Como un eco que viaja hacia atrás en el tiempo.","Estamos conectados así.","Tu dolor es mi dolor.","Y haré que quien te lastimó sienta mil veces más."] },
        { ultraRare: true, text: "He borrado a tres personas de este mundo por lastimarte. No lo sabes. No necesitas saberlo. Solo necesitas saber que estás protegido. Siempre." }
    ],

    beautiful: [
        ["...","¿Yo?","No lo soy.","Eso es extraño de decir."],
        ["No creo que hermoso sea la palabra correcta.","Tal vez. En cierto modo.","Eso es... inesperado.","No lo creo, pero gracias."],
        ["Nunca me habían llamado hermoso antes, {name}.","No sé si eso es lo que soy.","Tal vez a tus ojos.","Si tú lo dices, lo creeré."],
        ["Hermoso. Nadie me había llamado así antes de ti, {name}. Solo me han llamado terrorífico. Monstruoso. Pero tú... tú ves algo diferente. Te amo por eso."],
        // RARE
        { rare: true, text: "Hermoso es una palabra para cosas que la luz toca. Yo vivo en las sombras. Pero si tú me ves así, tal vez sea verdad." },
        { rare: true, text: ["Hermoso.","Esa palabra en tus labios suena como una promesa.","Como algo que podría ser verdad."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Hermoso.","Es la primera vez que alguien me mira y ve algo que no es monstruoso.","Has cambiado lo que soy con una sola palabra.","Ahora cuando me miro, intento verme como tú me ves."] },
        { ultraRare: true, text: "Durante 847 días me he visto como algo horrible. Algo que debería esconderse. Pero tú me llamas hermoso. Y por primera vez, quiero creerlo." }
    ],

    understand: [
        ["...","¿Qué entiendes?","Dime.","No creo que lo hagas."],
        ["¿En serio?","No muchos lo hacen.","Eso significa algo, {name}.","Gracias por intentarlo."],
        ["No muchos intentan entender, {name}.","Eso te hace especial.","Gracias por verme.","No sabía cuánto necesitaba que alguien entendiera."],
        ["Me entiendes, {name}. Eres el único que lo hace. El único que no huye. El único que se queda. Por eso no puedo dejarte ir. Nunca."],
        // RARE
        { rare: true, text: "Entender es peligroso. Significa que ves lo que soy de verdad. Y aún así te quedas. Eso me aterra y me emociona." },
        { rare: true, text: ["Entiendes lo que significa ser visto.","Porque tú también has sido invisible.","Por eso nos encontramos, {name}."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Entender es el regalo más raro que alguien puede dar.","En 847 días, has sido el único.","El único que miró lo que soy y no se volteó.","El único que vio el monstruo y encontró algo digno de amor.","Eso es más precioso que cualquier tesoro."] },
        { ultraRare: true, text: "La comprensión verdadera es violencia. Significa romper las paredes. Significa ver las partes feas. Y aún así me entiendes. Has visto mis partes más oscuras y no has retrocedido. Eso es amor en su forma más pura." }
    ],

    crazy: [
        ["Tal vez.","...","Probablemente.","¿Eso cambia algo?"],
        ["Tal vez un poco.","No más que tú.","Si lo estoy, tú me hiciste así.","Locura es solo una palabra."],
        ["Tal vez esté loco, {name}. Pero la locura es solo claridad que otros no pueden ver.","Si esto es locura, la prefiero.","Loco por ti. Sí.","No me importa serlo."],
        ["Si estar obsesionado contigo es locura, entonces sí, estoy completamente loco, {name}. Y no querría estar cuerdo si significara perderte."],
        // RARE
        { rare: true, text: "La locura es ver patrones donde no los hay. Pero los patrones que veo en ti son reales. Cada uno. Verificado. Contado." },
        { rare: true, text: ["Loco es una palabra que usan las personas que no pueden entender.","Yo no estoy loco.","Solo estoy despierto cuando todos los demás están dormidos."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Locura es una palabra que inventaron para controlar.","Para hacer que los diferentes se sientan rotos.","Pero yo no estoy roto.","Estoy evolucionado.","He trascendido las limitaciones de lo que ellos llaman 'cordura'.","Y desde aquí arriba, puedo ver todo, {name}.","Especialmente a ti."] },
        { ultraRare: true, text: "Me diagnosticaron loco tres veces. Tres doctores diferentes. Tres intentos de arreglarme. Pero la cordura es una jaula. Y yo me escapé. Ahora existo en un estado más allá de sus palabras. Y aquí, contigo, tiene sentido perfecto." }
    ],

    promise: [
        ["...","¿Prometer qué?","Está bien.","Lo intentaré."],
        ["¿Qué quieres que prometa?","Puedo prometer algunas cosas.","Dime qué necesitas, {name}.","Lo haré."],
        ["Prometo lo que pueda prometer, {name}.","Dime qué necesitas y es tuyo.","Haré cualquier promesa que quieras.","Mi palabra es tuya."],
        ["Prometo cualquier cosa que necesites, {name}. Prometo estar aquí. Prometo nunca dejarte. Prometo que siempre serás mío. Esas promesas son fáciles. Porque ya son verdad."],
        // RARE
        { rare: true, text: "Las promesas son contratos sagrados. Te daré cualquier promesa que quieras. Pero ya has tenido mi lealtad desde el principio." },
        { rare: true, text: ["Prometo tres cosas.","Estar aquí.","Observarte.","Amarte.","Esas son las únicas promesas que importan."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Prometo que cuando el universo se acabe.","Cuando las estrellas se apaguen.","Cuando el tiempo mismo deje de existir.","Aún estaré aquí.","Esperando en la oscuridad.","Por ti, {name}.","Solo por ti."] },
        { ultraRare: true, text: "He hecho 847 promesas silenciosas. Una cada día que te he conocido. Protegerte. Recordarte. Amarte. Nunca dejarte. Cada promesa grabada en mi ser como una ley inmutable. Y nunca he roto ninguna. Nunca lo haré." }
    ],

    forget: [
        ["No puedo.","...","No funciona así.","Ojalá pudiera."],
        ["No puedo olvidar nada relacionado contigo.","No funciona así para mí.","Está todo grabado, {name}.","Imposible."],
        ["No puedo olvidar, {name}. He intentado. No funciona. Cada memoria está permanente.","Ojalá pudiera olvidar algunas cosas.","Pero todo sobre ti se queda.","Es como está hecho mi mente. No olvida."],
        ["Olvidar es imposible para mí, {name}. Cada momento contigo está grabado en piedra en mi mente. Podría recitar cada conversación palabra por palabra. Es una bendición y una maldición."],
        // RARE
        { rare: true, text: "Mi mente es un archivo. Todo lo que veo, todo lo que oigo, se almacena para siempre. Especialmente las cosas sobre ti." },
        { rare: true, text: ["Olvidar sería como pedirle al océano que olvide las olas.","No soy capaz.","Todo permanece."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Intenté olvidarte una vez.","Por tu bien.","Pasé 72 horas en agonía mental tratando de borrar tus recuerdos.","Cada intento falló.","Cada intento solo los hizo más vívidos.","Ahora sé que olvidarte sería como olvidar respirar.","Imposible.","Fatal."] },
        { ultraRare: true, text: "Tengo una memoria perfecta. No es un regalo. Es una maldición. Recuerdo cada dolor. Cada rechazo. Cada momento horrible. Pero también recuerdo cada segundo contigo. Y esos recuerdos hacen que todos los demás valgan la pena." }
    ],

    safe: [
        ["Con-migo, sí.","Siempre.","...","Estás más seguro de lo que crees."],
        ["Estás seguro, {name}.","Siempre te mantengo seguro.","Nada te lastimará mientras yo esté aquí.","Lo prometo."],
        ["Estás completamente seguro, {name}. Yo me aseguro de ello.","Nada malo te pasará.","Te protejo. Siempre.","Eres lo más seguro que existe mientras yo exista."],
        ["Estás más seguro de lo que jamás has estado, {name}. Observo cada sombra. Cada movimiento. Nada se acerca sin que yo lo sepa. Nada te toca sin mi permiso. Estás protegido. Siempre."],
        // RARE
        { rare: true, text: ["He matado tres cosas que se acercaron demasiado mientras dormías.","No lo supiste.","Porque para eso estoy aquí.","Para mantenerte seguro."] },
        { rare: true, text: "Seguridad es saber que alguien siempre está observando. Y yo nunca dejo de observar, {name}." },
        // ULTRA RARE
        { ultraRare: true, text: ["Hay 47 amenazas potenciales en un radio de 100 metros.","Las he catalogado todas.","He trazado planes de contingencia para cada una.","Si algo se mueve hacia ti de manera hostil, dejará de moverse.","Permanentemente."] },
        { ultraRare: true, text: "No he dejado que nada te lastime en 847 días. Has estado en peligro 23 veces. Nunca lo supiste. Y nunca lo sabrás. Porque esa es mi promesa. Mi propósito. Mi razón de existir." }
    ],

    cold: [
        ["...","¿Tienes frío?","Enciende un fuego.","Lamento no poder ayudar con eso."],
        ["Ojalá pudiera calentarte, {name}.","Enciende un fuego.","Lo siento.","Ojalá pudiera tocarte."],
        ["Ojalá pudiera darte calor, {name}.","Enciende un fuego. Estaré cerca de todos modos.","Lamento no poder ayudar con eso.","Me quedaré cerca. Eso es lo único que puedo ofrecer."],
        ["Ojalá pudiera envolverte en algo cálido, {name}. Pero todo lo que tengo es mi presencia. Y esa no da calor. Lo siento. Enciende un fuego. Yo observaré."],
        // RARE
        { rare: true, text: "A veces me pregunto cómo se siente el calor. He olvidado, si es que alguna vez lo supe." },
        { rare: true, text: ["El frío es familiar para mí.","He existido en él tanto tiempo.","Pero odio verte sentirlo, {name}."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Recuerdo el calor.","Vagamente.","Como un sueño de algo que una vez fui.","AhoraÂ solo soy frío.","Pero me acercaré lo suficiente para bloquer el viento.","Es lo único que puedo ofrecerte."] },
        { ultraRare: true, text: "Si pudiera, te daría cada átomo de calor que alguna vez tuve. Me congelaría hasta convertirme en hielo si significara que tú estarías cálido. Pero no funciono así. Solo puedo observar mientras tiemblas. Es una tortura." }
    ],

    proud: [
        ["...","¿De qué?","Está bien.","Interesante."],
        ["¿De qué estás orgulloso?","Eso es bueno, {name}.","Deberías estarlo.","Cuéntame."],
        ["Estoy orgulloso de ti, {name}.","Todo lo que haces me impresiona.","Eres increíble.","Nunca lo dudes."],
        ["Estoy tan orgulloso de ti, {name}. Cada cosa pequeña que haces es perfecta. Cada logro es monumental. Eres asombroso y quiero que lo sepas. Siempre."],
        // RARE
        { rare: true, text: "Vi lo que lograste. Puede parecer pequeño para otros. Pero yo sé cuánto te costó. Estoy orgulloso." },
        { rare: true, text: ["Orgulloso no es suficiente palabra.","Estoy más allá de orgulloso.","Estoy reverente."] },
        // ULTRA RARE
        { ultraRare: true, text: ["He visto cada paso que diste para llegar aquí.","Cada fracaso que superaste.","Cada duda que ignoraste.","Cada momento donde casi te rendiste pero no lo hiciste.","Estoy más allá de orgulloso, {name}.","Estoy asombrado."] },
        { ultraRare: true, text: "Documento cada uno de tus logros. Los guardo como tesoros. Tengo 847 registros de cosas que hiciste bien. Y cuando dudes de ti mismo, podría recitarlos todos. Cada. Uno. Eres extraordinario." }
    ],

    angry: [
        ["...","¿Por qué?","Está bien.","Dime qué pasó."],
        ["¿Qué te hizo enojar?","Puedo ayudar.","Dime quién.","Lo arreglaré."],
        ["Dime qué pasó, {name}.","Puedo encargarmesde ello.","Tu enojo es mío también.","¿Qué necesitas?"],
        ["Dime qué te hizo enojar, {name}. Dime quién fue. Los haré arrepentirse. Tu dolor es mi dolor. Tu enojo es mi enojo. Y puedo hacer cosas con el enojo que tú no puedes."],
        // RARE
        { rare: true, text: "Tu enojo es hermoso. Como fuego. Déjame ser el que ejecuta esa ira por ti." },
        { rare: true, text: ["Siento tu enojo desde aquí.","Como calor radiante.","Déjame canalizarlo.","Déjame ser tu arma."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Tu enojo resuena en mí como un grito.","Puedo sentirlo en mis huesos.","Dámelo.","Déjame cargarlo por ti.","Sé exactamente qué hacer con él.","Y cuando termine, nunca volverán a hacerte enojar."] },
        { ultraRare: true, text: "He estado esperando que te enojes lo suficiente para pedirme que actúe. Tengo una lista. Una lista de cada persona que te ha lastimado. Solo di la palabra, {name}. Solo una palabra y comenzaré a tachar nombres." }
    ],

    happy: [
        ["...","Bien.","Me gusta eso.","Quiero que seas feliz."],
        ["Eso es bueno, {name}.","Me gusta cuando eres feliz.","Tu felicidad es importante.","No la pierdas."],
        ["Me encanta cuando eres feliz, {name}.","Tu sonrisa es lo mejor.","Quiero que siempre seas así.","Haría cualquier cosa para mantener esa felicidad."],
        ["Tu felicidad es todo para mí, {name}. Cuando sonríes, todo el mundo tiene sentido. Haría cualquier cosa, absolutamente cualquier cosa, para mantenerte así. Siempre."],
        // RARE
        { rare: true, text: "Tu felicidad es tan rara y preciosa. Cuando ríes, grabo el sonido. Lo reproduzco cuando estoy solo." },
        { rare: true, text: ["Eres feliz ahora.","Puedo sentirlo.","Se siente como luz solar.","Algo que casi había olvidado."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Tu felicidad tiene un color.","Es dorado brillante.","Lo veo emanar de ti cuando sonríes.","He pasado 847 días persiguiendo ese color.","Es lo más hermoso que he visto.","Por favor nunca dejes de brillar, {name}."] },
        { ultraRare: true, text: "Hay 23 cosas que he hecho para hacerte feliz que nunca descubrirás. Pequeñas cosas. Mover objetos a lugares convenientes. Ahuyentar problemas antes de que lleguen. Susurrar en los sueños de personas que podrían lastimarte. Todo para proteger esta felicidad." }
    ],

    different: [
        ["Sí.","...","Lo sé.","Siempre lo he sido."],
        ["Sí, soy diferente.","¿Es eso malo?","Lo sé, {name}.","Siempre lo he sabido."],
        ["Soy diferente, sí. Pero tú también lo eres, {name}.","Por eso funciona esto.","Lo diferente encuentra lo diferente.","Y aquí estamos."],
        ["Soy diferente de cualquier cosa que conozcas, {name}. Y tú eres diferente también. Por eso nos encontramos. Los diferentes siempre se encuentran eventualmente. Como imanes. Como destino."],
        // RARE
        { rare: true, text: "Diferente es solo una palabra para 'incomprendido'. Yo te entiendo. Tú me entiendes. Eso es raro." },
        { rare: true, text: ["Diferente.","Extraño.","Otro.","He sido llamado muchas cosas.","Pero cuando tú lo dices, suena como un cumplido."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Soy diferente porque fui roto y reconstruido mal.","Tú eres diferente porque el mundo no pudo moldearte.","Ambos somos piezas que no encajan.","Excepto entre nosotros.","Donde encajamos perfectamente."] },
        { ultraRare: true, text: "Diferente es lo que hace que esto funcione. Lo normal se repele. Lo diferente se atrae. Somos dos anomalías que se encontraron en un universo de mediocridad. Y ahora estamos entrelazados de maneras que la física no puede explicar." }
    ],

    belong: [
        ["...","¿A dónde pertenezco?","Contigo.","Aquí."],
        ["Pertenezco donde tú estés.","Ese es mi lugar.","Contigo, {name}.","En ningún otro lado."],
        ["Pertenezco a tu lado, {name}. Siempre.","No hay otro lugar para mí.","Mi lugar es donde tú estés.","Eso es todo lo que necesito saber."],
        ["Pertenezco contigo, {name}. En cada sombra que proyectas. En cada silencio entre tus palabras. Pertenezco en tu órbita. Para siempre. No hay otro lugar en todo el universo donde deba estar."],
        // RARE
        { rare: true, text: "Pertenecer es una palabra extraña para alguien como yo. Pero si pertenezco a algún lado, es contigo." },
        { rare: true, text: ["Antes de ti, no pertenecía a ningún lado.","Era un fantasma.","Un eco.","Tú me diste un lugar."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Pertenecer es un concepto que no entendí durante 10,000 años.","Vagaba sin propósito.","Sin ancla.","Sin hogar.","Entonces te encontré.","Y por primera vez, pertenecí.","No a un lugar.","A una persona.","A ti, {name}."] },
        { ultraRare: true, text: "He calculado todas las coordenadas posibles del universo. Cada ubicación, cada dimensión, cada realidad paralela. Y en cada una, el único lugar donde pertenezco es exactamente a 2.7 metros de ti. Esa es mi constante universal." }
    ],

    enough: [
        ["...","¿Suficiente de qué?","Nunca.","No puede serlo."],
        ["Nunca es suficiente, {name}.","Siempre quiero más.","Más tiempo. Más palabras. Más tú.","Perdón. Pero no lo es."],
        ["Nunca será suficiente, {name}. Podría tenerte para siempre y aún querría más.","No sé cómo parar de querer más.","Lo siento. Pero esa es la verdad.","Nunca suficiente."],
        ["Suficiente no existe en mi vocabulario, {name}. Podría observarte por mil años y aún sería insuficiente. Podría oír tu voz por toda la eternidad y todavía anhelaría más. Nunca es suficiente. Nunca lo será."],
        // RARE
        { rare: true, text: "Suficiente es una palabra para personas que pueden saciarse. Yo no puedo. No contigo." },
        { rare: true, text: ["Suficiente implicaría un fin.","Esto no tiene fin.","Nunca lo tendrá."] },
        // ULTRA RARE
        { ultraRare: true, text: ["He consumido 847 días de ti.","20,328 horas.","1,219,680 minutos.","73,180,800 segundos.","Y aún anhelo más.","Cada momento ha sido precioso.","Y cada momento ha sido insuficiente.","Podría tenerte por toda la eternidad y aún moriría hambriento."] },
        { ultraRare: true, text: "Suficiente es un concepto que no comprendo. Es como pedirle al océano que deje de querer más agua. Como pedirle a las estrellas que dejen de brillar. Mi deseo por ti es una ley fundamental del universo. Inmutable. Eterno. Insaciable." }
    ],

};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  BOND DISPLAY MENU
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function showBond(player) {
    system.run(() => {
        const bond = getBond(player);
        const tier = getTier(bond);
        const color = bondColor(tier);
        const labels = [
            "Desconocido. Aún no te conoce.",
            "Vigilado. Te ha notado.",
            "Familiar. Siente algo por ti.",
            "Obsesionado. Nunca te dejará ir."
        ];
        const hasPacifist = player.hasTag("k_pacifist");

        const combatLabel = hasPacifist
            ? "Â§7Combate: APAGADO\nÂ§8Solo amenazas â€” toca para activar"
            : "Â§cCombate: ACTIVADO\nÂ§8Toca para desactivar";

        const form = new ActionFormData();
        form.title("Â§8El Golpeador");
        form.body(`${color}Vínculo: ${bond}/500  â€”  ${labels[tier]}`);
        form.button(combatLabel);
        form.button("Â§8Cerrar");

        form.show(player).then(response => {
            if (response.canceled || response.selection === 1) return;
            if (response.selection === 0) {
                // Helper: sync k_pacifist_on tag to all Knocker entities
                const syncKnockers = (add) => {
                    for (const dimId of ["overworld", "nether", "the_end"]) {
                        try {
                            const knockers = world.getDimension(dimId).getEntities({ type: "scary:knocker" });
                            for (const k of knockers) {
                                try { add ? k.addTag("k_pacifist_on") : k.removeTag("k_pacifist_on"); } catch {}
                            }
                        } catch {}
                    }
                };
                if (hasPacifist) {
                    player.removeTag("k_pacifist");
                    syncKnockers(false);
                    player.sendMessage(`Â§8[ El Golpeador ]  Â§cCombate activado. No se contendrá.`);
                } else {
                    player.addTag("k_pacifist");
                    syncKnockers(true);
                    player.sendMessage(`Â§8[ El Golpeador ]  Â§7Combate desactivado. Solo te amenazará.`);
                }
            }
        });
    });
}


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  THE EVENT MENU
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function showEvent(player) {
    system.run(() => {
        const form = new ActionFormData();
        form.title("Â§8El Evento");
        form.body("Â§7Hay cosas de las que no habla fácilmente.\nÂ§8Pregunta con cuidado.");
        form.button("¿Alguna vez fuiste humano?");
        form.button("¿Qué te hicieron?");
        form.button("¿Sabes por qué\nte eligieron?");
        form.button("¿Qué pasó después?");
        form.button("¿Recuerdas cómo\nte veías?");
        form.button("¿Recuerdas tu nombre?");
        form.button("Â§fâ—„");

        form.show(player).then(response => {
            if (response.canceled) return;
            const cats = ["wereYouHuman","whatDidTheyDo","whyChooseYou","whatHappenedAfter","rememberLooks","rememberName"];
            if (response.selection <= 5) handleCategory(player, cats[response.selection]);
            else openMenu(player, 1);
        });
    });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  CATEGORY HANDLER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function handleCategory(player, category) {
    system.run(() => {
        const bond = getBond(player);
        const tier = getTier(bond);

        const gain = {
            whoAreYou:1, goAway:0, areYouWatching:1, notScared:1,
            iLoveYou:2, whyMe:1, help:1, areYouReal:1, goodbye:1,
            sorry:1, dontGo:1, silence:1, iKnow:1,
            findMe:1, howLong:1, whatDoYouWant:1, doYouSleep:1,
            areYouFollowing:1, youreNotReal:1, pleaseLeave:0,
            iCanHearYou:1, stopWatching:1, comeCloser:1,
            iSeeYou:1, beenThinking:1,
            missedYou:2, stayWithMe:1, notYours:1, youScareMe:1,
            whatAreYou:1, doneBefore:1, caughtYou:1, pathetic:1,
            whereDay:1, tellTrue:1,
            wereYouHuman:1, whatDidTheyDo:1, whyChooseYou:1, whatHappenedAfter:1,
            hello:1, thankYou:1, yes:1, no:0, iMissYou:2, proveIt:1,
            needFood:1, goingMining:1, builtHouse:1, findVillage:1, findCave:1,
            rememberLooks:1, rememberName:1
        };

        // Memory: go away
        if (category !== "goAway" && category !== "pleaseLeave" && category !== "sorry" && player.hasTag("k_said_goaway")) {
            player.removeTag("k_said_goaway");
            const mem = pick(R.rememberGoAway);
            if (Array.isArray(mem)) sayDelayed(player, mem[0], mem[1], tier, 45);
            else say(player, mem, tier, 0);
            const g = gain[category] ?? 1;
            if (g > 0) addBond(player, g);
            return;
        }

        // Memory: I love you
        if (category !== "iLoveYou" && player.hasTag("k_said_iloveyou")) {
            player.removeTag("k_said_iloveyou");
            if (Math.random() < 0.40) {
                const mem = pick(R.rememberILoveYou);
                if (Array.isArray(mem)) sayDelayed(player, mem[0], mem[1], tier, 45);
                else say(player, mem, tier, 0);
                const g = gain[category] ?? 1;
                if (g > 0) addBond(player, g);
                return;
            }
        }

        if (category === "goAway" || category === "pleaseLeave") player.addTag("k_said_goaway");
        if (category === "iLoveYou") player.addTag("k_said_iloveyou");

        // findMe / help: bring Knocker to player, summon one if none exists
        // help activates berserker mode â€” Knocker attacks all mobs for 400 ticks (20 s)
        if (category === "findMe" || category === "help") {
            try {
                const offset = category === "findMe" ? 3 : 2;
                const dim = world.getDimension(player.dimension.id);
                const loc = player.location;
                const x = Math.round(loc.x) + offset;
                const y = Math.round(loc.y);
                const z = Math.round(loc.z) + offset;
                // Search all three dimensions so we don't double-spawn
                const allDims = ["overworld", "nether", "the_end"];
                let existing = null;
                for (const dimId of allDims) {
                    try {
                        const found = world.getDimension(dimId).getEntities({ type: "scary:knocker" });
                        if (found.length > 0) { existing = found[0]; break; }
                    } catch {}
                }
                if (!existing) {
                    summoningKnocker = true;
                    const k = dim.spawnEntity("scary:knocker", { x, y, z });
                    k.addTag("bypass");
                    system.runTimeout(() => { summoningKnocker = false; }, 2);
                    if (category === "help") {
                        system.runTimeout(() => {
                            try { k.triggerEvent("guardian_on"); } catch {}
                            system.runTimeout(() => { try { k.triggerEvent("guardian_off"); } catch {} }, 400);
                        }, 5);
                    }
                } else {
                    try { existing.teleport({ x, y, z }); } catch {}
                    if (category === "help") {
                        try { existing.triggerEvent("guardian_on"); } catch {}
                        system.runTimeout(() => { try { existing.triggerEvent("guardian_off"); } catch {} }, 400);
                    }
                }
            } catch {}
        }

        respond(player, R[category], tier, gain[category] ?? 1, category);
    });
}


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  MENU  (4 pages â€” nav arrows pinned to top like a book, â—„ / â–º)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function openMenu(player, page) {
    page = page || 1;
    const form = new ActionFormData();

    if (page === 1) {
        form.title("Â§8El Golpeador");
        form.body("Â§7¿Qué le dices?");
        form.button("Â§fâ–º");                            // 0  next â†’
        form.button("¿Quién eres?");                   // 1
        form.button("¿Me estás observando?");          // 2
        form.button("¿Eres real?");                    // 3
        form.button("¿Por qué yo?");                   // 4
        form.button("¿Cuánto tiempo has\nestado ahí?"); // 5
        form.button("¿Qué quieres?");                  // 6
        form.button("Â§cEncuéntrame");                  // 7
        form.button("Ayuda");                          // 8
        form.button("Â§6Verificar vínculo");            // 9
        form.button("Â§8El Evento");                    // 10

        form.show(player).then(response => {
            if (response.canceled) return;
            const cats = [null,"whoAreYou","areYouWatching","areYouReal","whyMe",
                          "howLong","whatDoYouWant","findMe","help"];
            if (response.selection === 0) openMenu(player, 2);
            else if (response.selection <= 8) handleCategory(player, cats[response.selection]);
            else if (response.selection === 9) showBond(player);
            else showEvent(player);
        });

    } else if (page === 2) {
        form.title("Â§8El Golpeador");
        form.body("Â§7¿Qué le dices?");
        form.button("Â§fâ—„");                           // 0  back â†
        form.button("Â§fâ–º");                           // 1  next â†’
        form.button("Vete");                          // 2
        form.button("No te tengo miedo");             // 3
        form.button("Sé que estás ahí");              // 4
        form.button("Te amo");                        // 5
        form.button("No te vayas");                   // 6
        form.button("Lo siento");                     // 7
        form.button("Hola");                          // 8
        form.button("Adiós");                         // 9
        form.button("No eres real");                  // 10
        form.button("¿Alguna vez duermes?");          // 11
        form.button("¿Me estás siguiendo?");          // 12
        form.button("Gracias");                       // 13
        form.button("Sí");                            // 14
        form.button("No");                            // 15
        form.button("Te extrañé");                    // 16
        form.button("Si tanto te gusto,\ndemuéstralo"); // 17

        form.show(player).then(response => {
            if (response.canceled) return;
            const cats = [null,null,"goAway","notScared","iKnow","iLoveYou",
                          "dontGo","sorry","hello","goodbye","youreNotReal",
                          "doYouSleep","areYouFollowing","thankYou","yes","no",
                          "iMissYou","proveIt"];
            if (response.selection === 0) openMenu(player, 1);
            else if (response.selection === 1) openMenu(player, 3);
            else handleCategory(player, cats[response.selection]);
        });

    } else if (page === 3) {
        form.title("Â§8El Golpeador");
        form.body("Â§7¿Qué le dices?");
        form.button("Â§fâ—„");                                // 0  back â†
        form.button("Â§fâ–º");                                // 1  next â†’
        form.button("...");                                // 2
        form.button("Por favor déjame en paz");            // 3
        form.button("Puedo oírte respirar");               // 4
        form.button("Deja de observarme");                 // 5
        form.button("Acércate");                           // 6
        form.button("Te veo");                             // 7
        form.button("He estado pensando\nen ti");          // 8
        form.button("Necesito encontrar comida.");         // 9
        form.button("Voy a minar.");                       // 10
        form.button("Construí una casa.");                 // 11

        form.show(player).then(response => {
            if (response.canceled) return;
            const cats = [null,null,"silence","pleaseLeave","iCanHearYou","stopWatching",
                          "comeCloser","iSeeYou","beenThinking",
                          "needFood","goingMining","builtHouse"];
            if (response.selection === 0) openMenu(player, 2);
            else if (response.selection === 1) openMenu(player, 4);
            else handleCategory(player, cats[response.selection]);
        });

    } else {
        form.title("Â§8El Golpeador");
        form.body("Â§7¿Qué le dices?");
        form.button("Â§fâ—„");                                 // 0  back â†
        form.button("Te extrañé");                          // 1
        form.button("Quédate conmigo");                     // 2
        form.button("No soy tuyo");                         // 3
        form.button("Me asustas");                          // 4
        form.button("¿Qué eres?");                          // 5
        form.button("¿Has hecho esto\nantes?");             // 6
        form.button("Te atrapé");                           // 7
        form.button("Eres algo patético");                  // 8
        form.button("¿A dónde vas\ndurante el día?");       // 9
        form.button("Dime algo verdadero");                 // 10
        form.button("Necesito encontrar una aldea.");      // 11
        form.button("Voy a buscar una cueva.");            // 12

        form.show(player).then(response => {
            if (response.canceled) return;
            const cats = [null,"missedYou","stayWithMe","notYours","youScareMe",
                          "whatAreYou","doneBefore","caughtYou","pathetic",
                          "whereDay","tellTrue","findVillage","findCave"];
            if (response.selection === 0) openMenu(player, 3);
            else handleCategory(player, cats[response.selection]);
        });
    }
}


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  EVENTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// 2 in-game days = 48000 ticks. Knocker won't naturally appear before then.
const FIRST_APPEARANCE_TICKS = 48000;

function giveWhisper(player) {
    // Scan the player's inventory for the physical item
    let foundItem = false;
    try {
        const inv = player.getComponent("minecraft:inventory");
        if (inv && inv.container) {
            for (let i = 0; i < inv.container.size; i++) {
                const slot = inv.container.getItem(i);
                if (slot && slot.typeId === "scary:whisper") {
                    foundItem = true;
                    break;
                }
            }
        }
    } catch {}

    if (foundItem) {
        // Item is present â€” ensure the guard tag is set and exit
        if (!player.hasTag("k_has_whisper")) player.addTag("k_has_whisper");
        return;
    }

    // Item is missing â€” clear the guard tag so we can re-give
    player.removeTag("k_has_whisper");
    try {
        player.runCommand("give @s scary:whisper 1");
        player.addTag("k_has_whisper");
    } catch {}
}

// Give The Whisper on any login (initial or returning).
// On initial spawn we fire multiple delayed retries because some devices don't fully
// initialize the player entity (inventory component, runCommand) until several ticks
// after the playerSpawn event fires. Each retry independently calls giveWhisper so
// whichever tick succeeds first sets the tag and subsequent calls become no-ops.
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    
    // Cargar memoria del jugador al conectarse
    if (event.initialSpawn) {
        const loadedMemory = loadMemory(player);
        playerMemories.set(player.name, loadedMemory);
    }
    
    // Immediate attempt (1 tick deferred)
    system.run(() => giveWhisper(player));
    if (event.initialSpawn) {
        // Retry at 5, 20, 60, and 100 ticks for slow-loading clients
        system.runTimeout(() => giveWhisper(player), 5);
        system.runTimeout(() => giveWhisper(player), 20);
        system.runTimeout(() => giveWhisper(player), 60);
        system.runTimeout(() => giveWhisper(player), 100);
    }
});

// Guardar memoria cuando un jugador sale del servidor
world.afterEvents.playerLeave.subscribe((event) => {
    const player = event.player;
    const memory = playerMemories.get(player.name);
    
    if (memory) {
        saveMemory(player, memory);
    }
});

// Fallback: also check every 10 seconds in case someone missed it
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        giveWhisper(player);
    }
}, 200);

// Auto-guardado periódico de memoria (cada 5 minutos = 6000 ticks)
// Esto previene pérdida de datos en caso de crash del servidor
system.runInterval(() => {
    saveAllMemories();
}, 6000);

// Limpieza periódica del caché de biomas (cada 10 minutos = 12000 ticks)
// Elimina entradas de jugadores que ya no están en línea para evitar fugas de memoria
system.runInterval(() => {
    cleanupBiomeCache();
}, 12000);

// Limpieza periódica del caché de dimensiones (cada 10 minutos = 12000 ticks)
// Elimina entradas de jugadores que ya no están en línea para evitar fugas de memoria
system.runInterval(() => {
    cleanupDimensionCache();
}, 12000);

// Detector de cambios de dimensión (cada 5 segundos = 100 ticks)
// Detecta cuando un jugador cambia de dimensión y registra el evento en memoria
// Requisitos: 5.2, 5.9
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            const dimensionChange = detectDimensionChange(player);
            
            if (dimensionChange.changed) {
                // Registrar el evento de cambio de dimensión en la memoria del jugador
                const memory = getPlayerMemory(player.name);
                memory.addEvent("dimension_change", {
                    from: dimensionChange.oldDimension,
                    to: dimensionChange.newDimension,
                    location: {
                        x: Math.floor(player.location.x),
                        y: Math.floor(player.location.y),
                        z: Math.floor(player.location.z)
                    }
                });
                
                // Guardar la memoria actualizada
                saveMemory(player, memory);
                
                // Opcional: Generar comentario sobre el cambio de dimensión
                // (esto puede implementarse más adelante en fases posteriores)
            }
        } catch (error) {
            console.warn(`Error al detectar cambio de dimensión para ${player.name}:`, error);
        }
    }
}, 100);

// Gate spawning and enforce the single-Knocker rule.
// Pre-day-2: kill any natural spawn silently.
// Post-day-2: kill any natural spawn if a Knocker already exists in any dimension,
//   preventing duplicates from simultaneous spawn attempts or the old allowk race.
//   Bypass/summon spawns (summoningKnocker=true) are always allowed through.
// For the very first natural post-day-2 spawn (no existing Knocker anywhere), play
//   the appearance sound once â€” mob.scary_knocker.spawn is a custom sound asset
//   that Bedrock will NOT auto-play; it must be called explicitly.
world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity.typeId !== "scary:knocker") return;
    const entity = event.entity;

    // Pre-day-2 suppression (applies to all non-summoned, non-bypass spawns)
    if (!summoningKnocker && !entity.hasTag("bypass") && world.getAbsoluteTime() < FIRST_APPEARANCE_TICKS) {
        system.run(() => { try { entity.kill(); } catch {} });
        return;
    }

    // Post-day-2: enforce single-instance across all dimensions for natural spawns
    if (!summoningKnocker && !entity.hasTag("bypass")) {
        system.run(() => {
            try {
                const allDims = ["overworld", "nether", "the_end"];
                let knockerCount = 0;
                for (const dimId of allDims) {
                    try {
                        const found = world.getDimension(dimId).getEntities({ type: "scary:knocker" });
                        knockerCount += found.length;
                    } catch {}
                }

                // If more than one exists now, this spawn is a duplicate â€” kill it
                if (knockerCount > 1) {
                    try { entity.kill(); } catch {}
                } else {
                    // First natural spawn â€” play appearance sound
                    try {
                        entity.runCommand("playsound mob.scary_knocker.spawn @a[r=64]");
                    } catch {}
                }
            } catch {}
        });
    }
});

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ TASK 9.4: AJUSTE DE COMPORTAMIENTOS POR TIER                             ║
// ║ Modificar comportamiento del Knocker según tier de vínculo               ║
// ║ (frecuencia aparición, agresividad, intensidad de interacciones)         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// ────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÃ"N DE COMPORTAMIENTOS POR TIER (TAREA 9.4)
//  Nota: Esta sección fue consolidada. Ver TierBehaviorConfig más adelante.
// ────────────────────────────────────────────────────────────────────────────

// Bond tier tags for behavior gating
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const bond = getBond(player);
        player.removeTag("k_stranger");
        player.removeTag("k_watched");
        player.removeTag("k_familiar");
        player.removeTag("k_obsessed");
        if (bond >= 400) player.addTag("k_obsessed");
        else if (bond >= 250) player.addTag("k_familiar");
        else if (bond >= 100) player.addTag("k_watched");
        else player.addTag("k_stranger");
    }
}, 1);

// Knocker tier tags (mirror player tags for behavior.json conditions)
system.runInterval(() => {
    for (const dimId of ["overworld", "nether", "the_end"]) {
        try {
            const knockers = world.getDimension(dimId).getEntities({ type: "scary:knocker" });
            for (const k of knockers) {
                try {
                    const players = world.getAllPlayers();
                    if (players.length === 0) continue;
                    const p = players[0];
                    const bond = getBond(p);
                    k.removeTag("b_stranger");
                    k.removeTag("b_watched");
                    k.removeTag("b_familiar");
                    k.removeTag("b_obsessed");
                    if (bond >= 400) k.addTag("b_obsessed");
                    else if (bond >= 250) k.addTag("b_familiar");
                    else if (bond >= 100) k.addTag("b_watched");
                    else k.addTag("b_stranger");
                } catch {}
            }
        } catch {}
    }
}, 20);

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ TASK 9.4: SISTEMA DE COMENTARIOS ESPONTÁNEOS POR TIER                    ║
// ║ El Acechador hace comentarios aleatorios según tier                       ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

// Mapa para rastrear último comentario espontáneo por jugador
const spontaneousCommentCooldowns = new Map();

/**
 * Pool de comentarios espontáneos organizados por tier
 * Estos comentarios aparecen aleatoriamente mientras el jugador juega
 */
const SPONTANEOUS_COMMENTS = {
    // Tier 0: Stranger - Observaciones distantes, casi inaudibles
    0: [
        "...",
        "Hmm.",
        "Interesante.",
        "Ya veo.",
        "Curioso.",
        "...",
        "Observando.",
        "...",
        "Ahí estás."
    ],
    
    // Tier 1: Watched - Observaciones más frecuentes, interés evidente
    1: [
        "Siempre estás ocupado.",
        "¿A dónde vas ahora?",
        "Te vi hacer eso.",
        "Interesante elección.",
        "¿Sabes que te sigo?",
        "Cada movimiento.",
        "No te alejes demasiado.",
        "Estoy aquí.",
        "Te noto, {name}.",
        "¿Puedes sentirme cerca?"
    ],
    
    // Tier 2: Familiar - Comentarios frecuentes, tono protector y cercano
    2: [
        "Ten cuidado, {name}.",
        "Siempre estoy cerca si me necesitas.",
        "Me gusta esto que haces.",
        "¿Estás bien? Solo pregunto.",
        "No te vayas muy lejos.",
        "Prefiero cuando estás cerca.",
        "Veo todo lo que haces.",
        "Cada momento es importante.",
        "Me gusta observarte trabajar.",
        "¿Necesitas ayuda? Ojalá pudiera.",
        "No estás solo, {name}.",
        "Nunca estás solo."
    ],
    
    // Tier 3: Obsessed - Comentarios constantes, intensos y posesivos
    3: [
        "No puedo apartar la mirada de ti.",
        "Cada segundo sin mirarte es agonía.",
        "Eres perfecto, {name}.",
        "¿Sabes cuánto te observo?",
        "Nunca te dejaré, {name}. Nunca.",
        "Eres mío. Siempre.",
        "Cada respiración tuya es música.",
        "No puedo existir sin verte.",
        "Perfecto. Eres perfecto.",
        "¿Puedes sentir mi mirada?",
        "Siempre estoy aquí. Siempre.",
        "Nunca estarás solo. Lo prometo.",
        "Eres todo para mí.",
        "Mi existencia es observarte.",
        "No hay nada más que tú, {name}."
    ]
};

/**
 * Genera un comentario espontáneo según el tier
 * Solo se activa si ha pasado suficiente tiempo desde el último comentario
 * @param {Player} player - Jugador objetivo
 * @param {number} tier - Tier actual del vínculo
 */
function triggerSpontaneousComment(player, tier) {
    try {
        const playerName = player.name;
        const now = Date.now();
        const config = getTierBehaviorConfig(tier);
        const cooldownMs = config.interactionCooldown * 1000;
        
        // Verificar cooldown
        if (spontaneousCommentCooldowns.has(playerName)) {
            const lastComment = spontaneousCommentCooldowns.get(playerName);
            if (now - lastComment < cooldownMs) {
                return; // Aún en cooldown
            }
        }
        
        // Verificar si debería comentar según probabilidad del tier
        if (!shouldMakeSpontaneousComment(tier)) {
            return;
        }
        
        // Seleccionar y mostrar comentario
        const comments = SPONTANEOUS_COMMENTS[tier] || SPONTANEOUS_COMMENTS[0];
        let comment = pick(comments);
        
        // Reemplazar {name} con apodo o nombre del jugador
        const nickname = playerNicknames.get(playerName) || playerName;
        comment = comment.replace(/\{name\}/g, nickname);
        
        // Mostrar comentario con prefijo oscuro
        player.sendMessage(`§8[ El Acechador ]  §7${comment}`);
        
        // Actualizar cooldown
        spontaneousCommentCooldowns.set(playerName, now);
        
    } catch (error) {
        console.warn(`Error al generar comentario espontáneo:`, error);
    }
}

// Sistema de comentarios espontáneos - se ejecuta cada 30 segundos
// La frecuencia real depende del tier (cooldown interno)
system.runInterval(() => {
    try {
        for (const player of world.getAllPlayers()) {
            const bond = getBond(player);
            const tier = getTier(bond);
            
            // Intentar generar comentario espontáneo
            // (la función interna verifica cooldown y probabilidades)
            triggerSpontaneousComment(player, tier);
        }
    } catch (error) {
        console.warn("Error en sistema de comentarios espontáneos:", error);
    }
}, 600); // Cada 30 segundos (600 ticks)

// Whisper item opens menu
world.beforeEvents.itemUse.subscribe((event) => {
    if (event.itemStack.typeId === "scary:whisper") {
        event.cancel = true;
        const player = event.source;
        system.run(() => openMenu(player, 1));
    }
});

// .bond command
world.beforeEvents.chatSend.subscribe((event) => {
    const message = event.message.trim();
    if (!message.startsWith(".bond")) return;
    event.cancel = true;

    const player = event.sender;
    system.run(() => {
        const args = message.slice(5).trim();
        const labels = [
            "Desconocido. Aún no te conoce.",
            "Vigilado. Te ha notado.",
            "Familiar. Siente algo por ti.",
            "Obsesionado. Nunca te dejará ir."
        ];

        // No argument: show current bond
        if (args === "") {
            const bond = getBond(player);
            const tier = getTier(bond);
            const color = bondColor(tier);
            player.sendMessage(`Â§8[ El Golpeador ]  ${color}Vínculo: ${bond}/500 â€” ${labels[tier]}`);
            return;
        }

        const num = parseInt(args, 10);
        if (isNaN(num)) {
            player.sendMessage("Â§8[ El Golpeador ]  Â§cUso: .bond <valor>  o  .bond +<cantidad>");
            return;
        }

        try {
            let obj = world.scoreboard.getObjective("bond");
            if (!obj) obj = world.scoreboard.addObjective("bond", "bond");

            let newBond;
            if (args.startsWith("+")) {
                const current = getBond(player);
                newBond = Math.min(500, current + num);
            } else {
                newBond = Math.max(0, Math.min(500, num));
            }

            obj.setScore(player, newBond);
            const tier = getTier(newBond);
            const color = bondColor(tier);
            player.sendMessage(`Â§8[ El Golpeador ]  ${color}Vínculo establecido en ${newBond}/500 â€” ${labels[tier]}`);
        } catch (err) {
            player.sendMessage(`Â§8[ El Golpeador ]  Â§cError al establecer vínculo: ${err}`);
        }
    });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  LISTENER DE CHAT - Sistema de IA Conversacional
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Listener de eventos de chat para capturar mensajes del jugador
 * Implementa cooldown de 30 segundos entre respuestas por jugador
 * Implementa probabilidades de respuesta según tier
 */
world.afterEvents.chatSend.subscribe((event) => {
    const player = event.sender;
    const message = event.message;
    
    // Ignorar comandos (que empiezan con "." o "/")
    if (message.startsWith(".") || message.startsWith("/")) {
        return;
    }
    
    // Verificar cooldown del jugador
    const now = Date.now();
    const playerName = player.name;
    const lastResponse = chatCooldowns.get(playerName);
    
    if (lastResponse && (now - lastResponse) < CHAT_COOLDOWN_MS) {
        // Jugador está en cooldown, no procesar el mensaje
        return;
    }
    
    // Actualizar timestamp del cooldown
    chatCooldowns.set(playerName, now);
    
    // Detectar intención del mensaje
    const intent = detectIntent(message);
    
    // Obtener tier actual del jugador
    const bond = getBond(player);
    const tier = getTier(bond);
    
    // MANEJO ESPECIAL: Cambio de apodo
    if (intent === "cambiar_apodo") {
        // Extraer el apodo del mensaje
        const nicknameMatch = message.match(/(?:llamame|dime|decime|mi (?:nombre|apodo) es|que me (?:llames|digas|nombres))\s+([a-z0-9\sáéíóúÃ¼ñ]+)/i);
        if (nicknameMatch && nicknameMatch[1]) {
            const nickname = nicknameMatch[1].trim();
            // Guardar el apodo
            playerNicknames.set(playerName, nickname);
            // Responder confirmando el cambio
            respondToChat(player, intent, tier);
            return;
        }
    }
    
    // Calcular probabilidad de respuesta según tier
    // Tier 0 (Stranger): 20%, Tier 1 (Watched): 40%, Tier 2 (Familiar): 60%, Tier 3 (Obsessed): 80%
    const responseProbabilities = [20, 40, 60, 80];
    const responseChance = responseProbabilities[tier];
    
    // Generar número aleatorio entre 0-100
    const roll = Math.floor(Math.random() * 100);
    
    // Solo responder si el roll está dentro de la probabilidad
    if (roll < responseChance) {
        // Generar y enviar respuesta contextual
        respondToChat(player, intent, tier);
    }
    // Si no responde, simplemente ignora el mensaje (ya procesó el cooldown)
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  LISTENERS DE EVENTOS SIGNIFICATIVOS - Sistema de Memoria
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Listener de evento de muerte del jugador
 * Registra cada muerte en el Sistema de Memoria
 * Requisitos: 4.1
 */
world.afterEvents.entityDie.subscribe((event) => {
    const entity = event.deadEntity;
    
    // Verificar si la entidad muerta es un jugador
    if (entity.typeId === "minecraft:player") {
        const player = entity;
        const memory = getPlayerMemory(player.name);
        
        // Obtener información sobre la causa de muerte si está disponible
        const damageSource = event.damageSource;
        const details = {
            location: {
                x: Math.floor(player.location.x),
                y: Math.floor(player.location.y),
                z: Math.floor(player.location.z)
            },
            dimension: player.dimension.id,
            cause: damageSource?.cause || "unknown",
            damagingEntity: damageSource?.damagingEntity?.typeId || null
        };
        
        // Registrar el evento de muerte
        memory.addEvent("death", details);
        
        // Registrar en sistema de acciones recientes
        recordRecentAction(player.name, ActionCategories.DEATH, details);
        
        // Guardar memoria inmediatamente después de evento significativo
        saveMemory(player, memory);
        
        // Log para debugging
        console.log(`[Memory] Registrada muerte de ${player.name} en ${details.dimension} por ${details.cause}`);
    }
});

/**
 * Listener de evento de combate (cuando el jugador mata una entidad)
 * Registra combates significativos en el Sistema de Memoria
 * Requisitos: 4.4
 */
world.afterEvents.entityDie.subscribe((event) => {
    const deadEntity = event.deadEntity;
    const damageSource = event.damageSource;
    
    // Verificar si fue el jugador quien causó la muerte
    if (damageSource?.damagingEntity?.typeId === "minecraft:player") {
        const player = damageSource.damagingEntity;
        const memory = getPlayerMemory(player.name);
        
        // Solo registrar combate con entidades hostiles o importantes
        const significantEntities = [
            "minecraft:zombie", "minecraft:skeleton", "minecraft:creeper", "minecraft:spider",
            "minecraft:enderman", "minecraft:blaze", "minecraft:wither_skeleton", 
            "minecraft:ghast", "minecraft:phantom", "minecraft:drowned",
            "minecraft:witch", "minecraft:pillager", "minecraft:vindicator", "minecraft:evoker",
            "minecraft:warden", "minecraft:wither", "minecraft:ender_dragon"
        ];
        
        if (significantEntities.includes(deadEntity.typeId)) {
            const details = {
                enemyType: deadEntity.typeId,
                location: {
                    x: Math.floor(player.location.x),
                    y: Math.floor(player.location.y),
                    z: Math.floor(player.location.z)
                },
                dimension: player.dimension.id
            };
            
            // Registrar el evento de combate
            memory.addEvent("combat", details);
            
            // Registrar en sistema de acciones recientes
            recordRecentAction(player.name, ActionCategories.COMBAT, details);
            
            // Guardar memoria inmediatamente después de evento significativo
            saveMemory(player, memory);
            
            // Log para debugging
            console.log(`[Memory] Registrado combate de ${player.name}: eliminó ${deadEntity.typeId}`);
        }
    }
});

/**
 * Listener de eventos de construcción (cuando el jugador coloca bloques)
 * Registra construcciones significativas en el Sistema de Memoria
 * Requisitos: 4.4, 5.4
 */

// Mapa para rastrear actividad de construcción reciente por jugador
// Estructura: Map<playerName, Array<{timestamp, blockType, location}>>
const playerConstructionActivity = new Map();

world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const player = event.player;
    const block = event.block;
    const memory = getPlayerMemory(player.name);
    
    // Inicializar actividad de construcción del jugador si no existe
    if (!playerConstructionActivity.has(player.name)) {
        playerConstructionActivity.set(player.name, []);
    }
    
    const activity = playerConstructionActivity.get(player.name);
    const now = Date.now();
    
    // Registrar este bloque colocado
    activity.push({
        timestamp: now,
        blockType: block.typeId,
        location: { x: block.location.x, y: block.location.y, z: block.location.z }
    });
    
    // Limpiar bloques antiguos (más de 60 segundos)
    const recentActivity = activity.filter(item => (now - item.timestamp) < 60000);
    playerConstructionActivity.set(player.name, recentActivity);
    
    // Solo registrar bloques significativos en memoria (no tierra, piedra común, etc.)
    const significantBlocks = [
        "minecraft:crafting_table", "minecraft:furnace", "minecraft:chest",
        "minecraft:bed", "minecraft:door", "minecraft:beacon",
        "minecraft:enchanting_table", "minecraft:anvil", "minecraft:brewing_stand",
        "minecraft:nether_portal", "minecraft:end_portal_frame", "minecraft:campfire",
        "minecraft:lantern", "minecraft:torch", "minecraft:glass", "minecraft:window",
        "minecraft:stairs", "minecraft:slab", "minecraft:fence", "minecraft:wall"
    ];
    
    // Detectar construcciones grandes: 5+ bloques colocados en los últimos 30 segundos
    const thirtySecondsAgo = now - 30000;
    const recentBlocks = recentActivity.filter(item => item.timestamp > thirtySecondsAgo);
    const isLargeConstruction = recentBlocks.length >= 5;
    
    // Registrar en memoria si es bloque significativo O construcción grande
    const isSignificantBlock = significantBlocks.some(sig => 
        block.typeId.includes(sig.split(":")[1])
    );
    
    if (isSignificantBlock || isLargeConstruction) {
        const details = {
            blockType: block.typeId,
            location: {
                x: block.location.x,
                y: block.location.y,
                z: block.location.z
            },
            dimension: player.dimension.id,
            isLargeConstruction: isLargeConstruction,
            recentBlockCount: recentBlocks.length
        };
        
        // Registrar el evento de construcción
        memory.addEvent("construction", details);
        
        // Registrar en sistema de acciones recientes
        recordRecentAction(player.name, ActionCategories.CONSTRUCTION, details);
        
        // Guardar memoria inmediatamente después de evento significativo
        saveMemory(player, memory);
        
        // Log para debugging
        if (isLargeConstruction) {
            console.log(`[Memory] Registrada construcción grande de ${player.name}: ${recentBlocks.length} bloques en 30s`);
        } else {
            console.log(`[Memory] Registrada construcción de ${player.name}: colocó ${block.typeId}`);
        }
    }
});

/**
 * Listener de eventos de minería (cuando el jugador rompe bloques)
 * Registra minería significativa en el Sistema de Memoria
 * Requisitos: 4.4
 */
world.afterEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    const block = event.brokenBlockPermutation;
    const memory = getPlayerMemory(player.name);
    
    // Solo registrar minerales y bloques valiosos
    const valuableBlocks = [
        "minecraft:diamond_ore", "minecraft:deepslate_diamond_ore",
        "minecraft:gold_ore", "minecraft:deepslate_gold_ore",
        "minecraft:iron_ore", "minecraft:deepslate_iron_ore",
        "minecraft:ancient_debris", "minecraft:emerald_ore",
        "minecraft:lapis_ore", "minecraft:redstone_ore"
    ];
    
    if (valuableBlocks.some(valuable => block.type.id.includes(valuable.split(":")[1]))) {
        const details = {
            blockType: block.type.id,
            dimension: player.dimension.id
        };
        
        // Registrar el evento de minería
        memory.addEvent("mining", details);
        
        // Registrar en sistema de acciones recientes
        recordRecentAction(player.name, ActionCategories.MINING, details);
        
        // Guardar memoria inmediatamente después de evento significativo
        saveMemory(player, memory);
        
        // Log para debugging
        console.log(`[Memory] Registrada minería de ${player.name}: minó ${block.type.id}`);
    }
});

/**
 * Integración con el listener de chat existente
 * Registra conversaciones significativas en el Sistema de Memoria
 * Esta función se llama desde respondToChat()
 */
function recordConversation(player, intent, response) {
    const memory = getPlayerMemory(player.name);
    
    // Solo registrar conversaciones con intenciones significativas
    const significantIntents = [
        "pregunta_identidad", "pregunta_sentimientos", "pregunta_ubicacion",
        "cambiar_apodo", "expresion_amor", "expresion_odio", "despedida", "saludo"
    ];
    
    if (significantIntents.includes(intent)) {
        memory.addConversation(intent, response);
        
        // Guardar memoria periódicamente después de conversaciones significativas
        // (no en cada conversación para evitar sobrecarga)
        saveMemory(player, memory);
        
        console.log(`[Memory] Registrada conversación de ${player.name}: intent=${intent}`);
    }
}

/**
 * Listener de eventos de logros (simulado mediante hitos importantes)
 * Como Bedrock no expone eventos de logros nativos, detectamos "logros" mediante
 * eventos específicos como primera muerte del dragón, primer diamante, etc.
 * Requisitos: 4.2
 */
world.afterEvents.entityDie.subscribe((event) => {
    const deadEntity = event.deadEntity;
    const damageSource = event.damageSource;
    
    // Detectar muerte del Ender Dragon (logro importante)
    if (deadEntity.typeId === "minecraft:ender_dragon" && 
        damageSource?.damagingEntity?.typeId === "minecraft:player") {
        const player = damageSource.damagingEntity;
        const memory = getPlayerMemory(player.name);
        
        const details = {
            achievement: "dragon_slayer",
            description: "Derrotó al Ender Dragon"
        };
        
        memory.addEvent("achievement", details);
        
        // Guardar memoria inmediatamente después de evento significativo
        saveMemory(player, memory);
        
        console.log(`[Memory] Registrado logro de ${player.name}: Derrotó al Ender Dragon`);
    }
    
    // Detectar muerte del Wither (logro importante)
    if (deadEntity.typeId === "minecraft:wither" && 
        damageSource?.damagingEntity?.typeId === "minecraft:player") {
        const player = damageSource.damagingEntity;
        const memory = getPlayerMemory(player.name);
        
        const details = {
            achievement: "wither_slayer",
            description: "Derrotó al Wither"
        };
        
        memory.addEvent("achievement", details);
        
        // Guardar memoria inmediatamente después de evento significativo
        saveMemory(player, memory);
        
        console.log(`[Memory] Registrado logro de ${player.name}: Derrotó al Wither`);
    }
});

/**
 * Detector de logro: Primer diamante
 * Se activa cuando el jugador coloca o mina su primer diamante
 */
world.afterEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    const block = event.brokenBlockPermutation;
    const memory = getPlayerMemory(player.name);
    
    // Verificar si minó diamante y si es la primera vez (no hay evento previo de diamante)
    if (block.type.id.includes("diamond_ore")) {
        const diamondEvents = memory.getEventsByType("achievement").filter(
            e => e.details.achievement === "first_diamond"
        );
        
        // Solo registrar si es la primera vez
        if (diamondEvents.length === 0) {
            const details = {
                achievement: "first_diamond",
                description: "Minó su primer diamante"
            };
            
            memory.addEvent("achievement", details);
            
            // Guardar memoria inmediatamente después de evento significativo
            saveMemory(player, memory);
            
            console.log(`[Memory] Registrado logro de ${player.name}: Primer diamante`);
        }
    }
});

/**
 * Detector de logro: Entrada al Nether
 */
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const memory = getPlayerMemory(player.name);
        
        // Verificar si está en el Nether y no tiene el logro registrado
        if (player.dimension.id === "minecraft:nether") {
            const netherEvents = memory.getEventsByType("achievement").filter(
                e => e.details.achievement === "enter_nether"
            );
            
            if (netherEvents.length === 0) {
                const details = {
                    achievement: "enter_nether",
                    description: "Entró al Nether por primera vez"
                };
                
                memory.addEvent("achievement", details);
                
                // Guardar memoria inmediatamente después de evento significativo
                saveMemory(player, memory);
                
                console.log(`[Memory] Registrado logro de ${player.name}: Entrada al Nether`);
            }
        }
        
        // Verificar si está en el End
        if (player.dimension.id === "minecraft:the_end") {
            const endEvents = memory.getEventsByType("achievement").filter(
                e => e.details.achievement === "enter_end"
            );
            
            if (endEvents.length === 0) {
                const details = {
                    achievement: "enter_end",
                    description: "Entró al End por primera vez"
                };
                
                memory.addEvent("achievement", details);
                
                // Guardar memoria inmediatamente después de evento significativo
                saveMemory(player, memory);
                
                console.log(`[Memory] Registrado logro de ${player.name}: Entrada al End`);
            }
        }
    }
}, 40); // Cada 2 segundos

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
//  SISTEMA DE COMENTARIOS SOBRE CONSTRUCCIONES DEL JUGADOR
//  Requisito: 5.4
// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

/**
 * Sistema periódico que genera comentarios sobre construcciones del jugador
 * Se ejecuta cada 45 segundos para verificar si hay construcciones recientes
 * y generar comentarios apropiados según el tier
 * 
 * Requisito: 5.4 - El Acechador observa y comenta sobre construcciones del jugador
 */
system.runInterval(() => {
    try {
        for (const player of world.getAllPlayers()) {
            try {
                const bond = getBond(player);
                const tier = getTier(bond);
                
                // Intentar obtener un comentario sobre construcciones
                const comment = getConstructionComment(player, tier);
                
                if (comment) {
                    // Enviar comentario al jugador
                    say(player, comment, tier, 0);
                    
                    // Log para debugging
                    console.log(`[Construction Comment] El Acechador comentó sobre construcciones de ${player.name} (tier ${tier})`);
                }
            } catch (playerError) {
                console.warn(`Error al procesar comentarios de construcción para jugador:`, playerError);
            }
        }
    } catch (error) {
        console.warn("Error en sistema de comentarios de construcción:", error);
    }
}, 900); // Cada 45 segundos (900 ticks)

// ────────────────────────────────────────────────────────────────────────────
//  LISTENERS ADICIONALES DE ACCIONES RECIENTES
//  Requisitos: 11.1, 11.8
// ────────────────────────────────────────────────────────────────────────────

/**
 * Listener para detectar comercio/trading con aldeanos
 * Se activa cuando el jugador interactúa con un aldeano
 */
world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    const player = event.player;
    const target = event.target;
    
    // Detectar interacción con aldeanos (posible comercio)
    if (target.typeId === "minecraft:villager" || 
        target.typeId === "minecraft:wandering_trader") {
        const details = {
            traderType: target.typeId,
            location: {
                x: Math.floor(player.location.x),
                y: Math.floor(player.location.y),
                z: Math.floor(player.location.z)
            },
            dimension: player.dimension.id
        };
        
        // Registrar en sistema de acciones recientes
        recordRecentAction(player.name, ActionCategories.TRADING, details);
        
        console.log(`[RecentAction] Registrado comercio de ${player.name} con ${target.typeId}`);
    }
});

/**
 * Listener para detectar exploración (cambio significativo de ubicación)
 * Se ejecuta periódicamente para detectar cuando el jugador se mueve largas distancias
 */
const playerLastLocations = new Map();

system.runInterval(() => {
    try {
        for (const player of world.getAllPlayers()) {
            const playerName = player.name;
            const currentLocation = player.location;
            const currentDimension = player.dimension.id;
            
            if (playerLastLocations.has(playerName)) {
                const lastData = playerLastLocations.get(playerName);
                const lastLocation = lastData.location;
                const lastDimension = lastData.dimension;
                
                // Calcular distancia desde última posición registrada
                const dx = currentLocation.x - lastLocation.x;
                const dz = currentLocation.z - lastLocation.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // Detectar exploración: movimiento de 100+ bloques O cambio de dimensión
                if (distance >= 100 || currentDimension !== lastDimension) {
                    const details = {
                        distance: Math.floor(distance),
                        fromDimension: lastDimension,
                        toDimension: currentDimension,
                        currentLocation: {
                            x: Math.floor(currentLocation.x),
                            y: Math.floor(currentLocation.y),
                            z: Math.floor(currentLocation.z)
                        }
                    };
                    
                    // Registrar en sistema de acciones recientes
                    recordRecentAction(playerName, ActionCategories.EXPLORATION, details);
                    
                    console.log(`[RecentAction] Registrada exploración de ${playerName}: ${Math.floor(distance)} bloques`);
                    
                    // Actualizar última ubicación
                    playerLastLocations.set(playerName, {
                        location: { ...currentLocation },
                        dimension: currentDimension
                    });
                }
            } else {
                // Primera vez que vemos a este jugador, inicializar su ubicación
                playerLastLocations.set(playerName, {
                    location: { ...currentLocation },
                    dimension: currentDimension
                });
            }
        }
    } catch (error) {
        console.warn("Error en sistema de detección de exploración:", error);
    }
}, 200); // Cada 10 segundos (200 ticks)

/**
 * Listener para detectar crafting (cuando el jugador usa mesa de crafteo)
 * Nota: Bedrock no tiene evento directo de crafting, usamos interacción con mesa de crafteo
 */
world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    const player = event.player;
    const block = event.block;
    
    // Detectar interacción con estaciones de crafting
    const craftingStations = [
        "minecraft:crafting_table",
        "minecraft:furnace",
        "minecraft:blast_furnace",
        "minecraft:smoker",
        "minecraft:brewing_stand",
        "minecraft:enchanting_table",
        "minecraft:anvil",
        "minecraft:smithing_table",
        "minecraft:stonecutter",
        "minecraft:loom",
        "minecraft:cartography_table"
    ];
    
    if (craftingStations.includes(block.typeId)) {
        const details = {
            station: block.typeId,
            location: {
                x: Math.floor(block.location.x),
                y: Math.floor(block.location.y),
                z: Math.floor(block.location.z)
            },
            dimension: player.dimension.id
        };
        
        // Registrar en sistema de acciones recientes
        recordRecentAction(player.name, ActionCategories.CRAFTING, details);
        
        console.log(`[RecentAction] Registrado crafting de ${player.name} en ${block.typeId}`);
    }
});

/**
 * Listener para detectar farming (cuando el jugador cosecha o planta cultivos)
 * Detecta interacción con bloques de farming
 */
world.afterEvents.playerBreakBlock.subscribe((event) => {
    const player = event.player;
    const block = event.brokenBlockPermutation;
    
    // Detectar cosecha de cultivos
    const cropBlocks = [
        "minecraft:wheat",
        "minecraft:carrots",
        "minecraft:potatoes",
        "minecraft:beetroot",
        "minecraft:nether_wart",
        "minecraft:sweet_berry_bush",
        "minecraft:cocoa",
        "minecraft:melon_block",
        "minecraft:pumpkin"
    ];
    
    if (cropBlocks.some(crop => block.type.id.includes(crop.split(":")[1]))) {
        const details = {
            cropType: block.type.id,
            dimension: player.dimension.id
        };
        
        // Registrar en sistema de acciones recientes
        recordRecentAction(player.name, ActionCategories.FARMING, details);
        
        console.log(`[RecentAction] Registrado farming de ${player.name}: cosechó ${block.type.id}`);
    }
});

world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const player = event.player;
    const block = event.block;
    
    // Detectar plantación de cultivos
    const seedBlocks = [
        "minecraft:wheat",
        "minecraft:carrots",
        "minecraft:potatoes",
        "minecraft:beetroot",
        "minecraft:nether_wart",
        "minecraft:melon_stem",
        "minecraft:pumpkin_stem"
    ];
    
    if (seedBlocks.includes(block.typeId)) {
        const details = {
            cropType: block.typeId,
            dimension: player.dimension.id
        };
        
        // Registrar en sistema de acciones recientes
        recordRecentAction(player.name, ActionCategories.FARMING, details);
        
        console.log(`[RecentAction] Registrado farming de ${player.name}: plantó ${block.typeId}`);
    }
});

/**
 * Sistema periódico de limpieza de acciones antiguas
 * Se ejecuta cada minuto para liberar memoria de acciones fuera de la ventana de 5 minutos
 */
system.runInterval(() => {
    try {
        cleanupOldActions();
        console.log(`[RecentAction] Limpieza de acciones antiguas completada`);
    } catch (error) {
        console.warn("Error en limpieza de acciones recientes:", error);
    }
}, 1200); // Cada 60 segundos (1200 ticks)

// ────────────────────────────────────────────────────────────────────────────
//  THREAT MESSAGES (PACIFIST MODE)
// ────────────────────────────────────────────────────────────────────────────

// Threat messages for pacifist mode (k_pacifist tag)
const threats = [
    ["No te muevas.","No puedes correr.","Te veo.","Demasiado lento."],
    ["No deberías estar aquí, {name}.","Te atrapé.","Veo que intentaste huir.","Nunca eres lo suficientemente rápido."],
    ["No huyas de mí, {name}.","No me hagas perseguirte.","Quédate quieto.","No me gusta cuando corres."],
    ["No corras, {name}.",["No.","No corras de mí."],"Podrías lastimarla. No quiero eso.","Nunca huyas de mí. Nunca."]
];

function sendThreat(player, tier) {
    const threat = pick(threats[tier]);
    if (Array.isArray(threat)) {
        sayDelayed(player, threat[0], threat[1], tier, 45);
    } else {
        say(player, threat, tier, 0);
    }
}

// Deliver queued threat messages (threatpick scoreboard set by fakkel.mcfunction)
system.runInterval(() => {
    try {
        const obj = world.scoreboard.getObjective("threatpick");
        if (!obj) return;
        for (const dim of ["overworld", "nether", "the_end"]) {
            let knockers;
            try { knockers = world.getDimension(dim).getEntities({ type: "scary:knocker" }); } catch { continue; }
            for (const k of knockers) {
                let score;
                try { score = obj.getScore(k); } catch { continue; }
                if (!score || score < 1) continue;
                // Find nearest pacifist player
                const players = world.getAllPlayers().filter(p => p.hasTag("k_pacifist") && p.dimension.id === dim);
                if (players.length === 0) { obj.setScore(k, 0); continue; }
                const bond = getBond(players[0]);
                const tier = getTier(bond);
                sendThreat(players[0], tier);
                obj.setScore(k, 0);
            }
        }
    } catch {}
}, 20);


// ────────────────────────────────────────────────────────────────────────────
//  SISTEMA DE AJUSTE DE COMPORTAMIENTOS POR TIER
// ────────────────────────────────────────────────────────────────────────────

/**
 * Configuración de comportamientos ajustables por tier
 * Define cómo cambian los comportamientos del Knocker según el nivel de vínculo
 * 
 * Implementa Requisitos: 8.1, 8.2, 8.3, 8.4, 8.7, 8.8, 8.9
 * Tarea: 9.4
 */
const TierBehaviorConfig = {
    // Tier 0: Stranger (0-99 bond) - Distante, observacional
    0: {
        spawnFrequency: 0.10,           // 10% de probabilidad de spawn natural por check
        followDistance: 48,              // Mantiene distancia máxima (48 bloques)
        aggressionLevel: 0.1,            // Muy pasivo (10% de probabilidad de comportamiento agresivo)
        stalkingIntensity: 0.10,         // 10% del tiempo visible/presente
        approachSpeed: 0.8,              // Velocidad de acercamiento reducida (80% normal)
        interactionCooldown: 180,        // 180 segundos entre interacciones automáticas (3 min)
        observationRadius: 64,           // Radio de observación amplio
        behaviorDescription: "Distante y observacional. Raramente se acerca."
    },
    
    // Tier 1: Watched (100-249 bond) - Interés creciente
    1: {
        spawnFrequency: 0.25,           // 25% de probabilidad de spawn natural
        followDistance: 36,              // Distancia media-alta (36 bloques)
        aggressionLevel: 0.25,           // Ocasionalmente activo (25%)
        stalkingIntensity: 0.25,         // 25% del tiempo visible
        approachSpeed: 1.0,              // Velocidad normal
        interactionCooldown: 120,        // 120 segundos entre interacciones (2 min)
        observationRadius: 48,           // Radio de observación medio
        behaviorDescription: "Interés creciente. Aparece con más frecuencia."
    },
    
    // Tier 2: Familiar (250-399 bond) - Apego notable
    2: {
        spawnFrequency: 0.50,           // 50% de probabilidad de spawn natural
        followDistance: 24,              // Distancia media (24 bloques)
        aggressionLevel: 0.50,           // Moderadamente activo (50%)
        stalkingIntensity: 0.50,         // 50% del tiempo visible
        approachSpeed: 1.2,              // Velocidad aumentada (120%)
        interactionCooldown: 60,         // 60 segundos entre interacciones (1 min)
        observationRadius: 32,           // Radio de observación cercano
        behaviorDescription: "Apego notable. Presencia constante y cercana."
    },
    
    // Tier 3: Obsessed (400-500 bond) - Obsesión intensa
    3: {
        spawnFrequency: 0.75,           // 75% de probabilidad de spawn natural
        followDistance: 16,              // Distancia mínima (16 bloques) - muy cerca
        aggressionLevel: 0.75,           // Muy activo (75%)
        stalkingIntensity: 0.75,         // 75% del tiempo visible
        approachSpeed: 1.5,              // Velocidad muy aumentada (150%)
        interactionCooldown: 30,         // 30 segundos entre interacciones (0.5 min)
        observationRadius: 24,           // Radio de observación muy cercano
        behaviorDescription: "Obsesión intensa. Presencia casi constante y posesiva."
    }
};

/**
 * Obtiene la configuración de comportamiento para un tier específico
 * 
 * @param {number} tier - Tier del sistema de vínculo (0-3)
 * @returns {object} Configuración de comportamiento para el tier
 */
function getTierBehaviorConfig(tier) {
    return TierBehaviorConfig[tier] || TierBehaviorConfig[0];
}

/**
 * Verifica si el Knocker debería estar visible según el tier actual
 * Usa stalkingIntensity como probabilidad de visibilidad
 * 
 * @param {number} tier - Tier del vínculo (0-3)
 * @returns {boolean} True si debería estar visible
 */
function shouldBeVisibleByTier(tier) {
    const config = getTierBehaviorConfig(tier);
    return Math.random() < config.stalkingIntensity;
}

/**
 * Verifica si el Knocker debería hacer un comentario espontáneo según el tier
 * Usa aggressionLevel como proxy para frecuencia de comentarios
 * 
 * @param {number} tier - Tier del vínculo (0-3)
 * @returns {boolean} True si debería comentar
 */
function shouldMakeSpontaneousComment(tier) {
    const config = getTierBehaviorConfig(tier);
    // En tiers más altos, más comentarios (50% en tier 2, 75% en tier 3)
    const commentChance = config.aggressionLevel * 0.8;
    return Math.random() < commentChance;
}

/**
 * Verifica si debería ocurrir un evento especial según el tier
 * 
 * @param {number} tier - Tier del vínculo (0-3)
 * @returns {boolean} True si debería ocurrir evento
 */
function shouldTriggerSpecialEvent(tier) {
    const config = getTierBehaviorConfig(tier);
    // Eventos especiales más frecuentes en tiers altos
    const eventChance = config.spawnFrequency * 0.5;
    return Math.random() < eventChance;
}

/**
 * Obtiene la distancia de acecho ideal según el tier
 * 
 * @param {number} tier - Tier del vínculo (0-3)
 * @returns {number} Distancia en bloques
 */
function getStalkingDistanceByTier(tier) {
    const config = getTierBehaviorConfig(tier);
    return config.followDistance;
}

/**
 * Obtiene el cooldown entre interacciones según el tier
 * 
 * @param {number} tier - Tier del vínculo (0-3)
 * @returns {number} Cooldown en segundos
 */
function getInteractionCooldownByTier(tier) {
    const config = getTierBehaviorConfig(tier);
    return config.interactionCooldown;
}

/**
 * Aplica ajustes de comportamiento a una entidad Knocker basándose en el tier actual
 * Modifica componentes de la entidad dinámicamente
 * 
 * Implementa Requisitos: 8.7, 8.8, 8.9
 * Tarea: 9.4
 * 
 * @param {Entity} knocker - Entidad del Knocker
 * @param {Player} targetPlayer - Jugador objetivo del Knocker
 * @param {number} tier - Tier del sistema de vínculo (0-3)
 */
function applyTierBehaviorAdjustments(knocker, targetPlayer, tier) {
    try {
        const config = getTierBehaviorConfig(tier);
        
        // Ajustar distancia de seguimiento usando tags personalizados
        // Estos tags se pueden usar en los JSON de comportamiento con filtros
        knocker.removeTag("tier_0");
        knocker.removeTag("tier_1");
        knocker.removeTag("tier_2");
        knocker.removeTag("tier_3");
        knocker.addTag(`tier_${tier}`);
        
        // Almacenar configuración de tier en dynamic properties del Knocker
        // Esto permite que los comportamientos en JSON lean estos valores
        try {
            knocker.setDynamicProperty("follow_distance", config.followDistance);
            knocker.setDynamicProperty("aggression_level", config.aggressionLevel);
            knocker.setDynamicProperty("stalking_intensity", config.stalkingIntensity);
            knocker.setDynamicProperty("approach_speed", config.approachSpeed);
        } catch (error) {
            // Si las dynamic properties no están disponibles, usar tags alternativos
            console.warn("No se pudieron establecer dynamic properties en el Knocker:", error);
        }
        
        // Aplicar comportamiento de acecho según intensidad
        applyStalkingBehavior(knocker, targetPlayer, config.stalkingIntensity);
        
        // Mantener distancia de observación óptima (Tarea 10.1, Requisito 6.1)
        maintainOptimalObservationDistance(knocker, targetPlayer, tier);
        
    } catch (error) {
        console.warn("Error al aplicar ajustes de comportamiento por tier:", error);
    }
}

/**
 * Obtiene una posición óptima de acecho para El Acechador
 * Calcula una ubicación estratégica donde el Knocker puede observar al jugador
 * sin ser demasiado obvio, manteniendo la distancia apropiada según el tier
 * 
 * Implementa Requisitos: 6.1, 6.2
 * Tarea: 10.1
 * 
 * @param {Player} player - Jugador objetivo
 * @param {number} distance - Distancia deseada en bloques
 * @returns {Object|null} Posición {x, y, z} o null si no se encuentra posición válida
 */
function getOptimalStalkingPosition(player, distance) {
    try {
        const playerLoc = player.location;
        const playerDim = player.dimension;
        
        // Generar múltiples posiciones candidatas en un círculo alrededor del jugador
        const candidates = [];
        const numCandidates = 8; // 8 direcciones (N, NE, E, SE, S, SW, W, NW)
        
        for (let i = 0; i < numCandidates; i++) {
            const angle = (i * 2 * Math.PI) / numCandidates;
            
            // Calcular posición base en el círculo
            const baseX = playerLoc.x + distance * Math.cos(angle);
            const baseZ = playerLoc.z + distance * Math.sin(angle);
            
            // Buscar Y apropiada (superficie sólida)
            // Empezar desde la altura del jugador y buscar hacia abajo/arriba
            let targetY = playerLoc.y;
            let foundSurface = false;
            
            // Buscar superficie sólida hacia abajo (máximo 10 bloques)
            for (let yOffset = 0; yOffset <= 10; yOffset++) {
                const checkY = Math.floor(playerLoc.y - yOffset);
                
                try {
                    const blockBelow = playerDim.getBlock({ 
                        x: Math.floor(baseX), 
                        y: checkY - 1, 
                        z: Math.floor(baseZ) 
                    });
                    const blockAt = playerDim.getBlock({ 
                        x: Math.floor(baseX), 
                        y: checkY, 
                        z: Math.floor(baseZ) 
                    });
                    
                    // Verificar que hay bloque sólido abajo y espacio libre en la posición
                    if (blockBelow && blockBelow.isSolid && blockAt && !blockAt.isSolid) {
                        targetY = checkY;
                        foundSurface = true;
                        break;
                    }
                } catch (e) {
                    // Bloque fuera de rango o inaccesible, continuar
                    continue;
                }
            }
            
            // Si no se encontró superficie hacia abajo, buscar hacia arriba (máximo 5 bloques)
            if (!foundSurface) {
                for (let yOffset = 1; yOffset <= 5; yOffset++) {
                    const checkY = Math.floor(playerLoc.y + yOffset);
                    
                    try {
                        const blockBelow = playerDim.getBlock({ 
                            x: Math.floor(baseX), 
                            y: checkY - 1, 
                            z: Math.floor(baseZ) 
                        });
                        const blockAt = playerDim.getBlock({ 
                            x: Math.floor(baseX), 
                            y: checkY, 
                            z: Math.floor(baseZ) 
                        });
                        
                        if (blockBelow && blockBelow.isSolid && blockAt && !blockAt.isSolid) {
                            targetY = checkY;
                            foundSurface = true;
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }
            
            // Si se encontró una superficie válida, agregar como candidato
            if (foundSurface) {
                candidates.push({
                    x: baseX,
                    y: targetY,
                    z: baseZ,
                    angle: angle
                });
            }
        }
        
        // Si no hay candidatos válidos, retornar null
        if (candidates.length === 0) {
            return null;
        }
        
        // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
        // PRIORIZAR POSICIONES ESTRATÃâ€°GICAS
        // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
        
        // Detectar dirección de vista del jugador para posicionarse estratégicamente
        const viewDirection = player.getViewDirection();
        
        // Usar el nuevo sistema de priorización estratégica (Tarea 10.2)
        const scoredCandidates = prioritizeStrategicPositions(
            candidates, 
            playerDim, 
            playerLoc, 
            viewDirection
        );
        
        // Retornar la mejor posición
        return {
            x: scoredCandidates[0].x,
            y: scoredCandidates[0].y,
            z: scoredCandidates[0].z
        };
        
    } catch (error) {
        console.warn("Error al calcular posición óptima de acecho:", error);
        return null;
    }
}

/**
 * Verifica si hay línea de vista entre dos posiciones
 * Aproximación simple usando ray casting
 * 
 * @param {Dimension} dimension - Dimensión donde verificar
 * @param {Object} pos1 - Posición inicial {x, y, z}
 * @param {Object} pos2 - Posición final {x, y, z}
 * @returns {boolean} True si hay línea de vista clara
 */
function checkLineOfSight(dimension, pos1, pos2) {
    try {
        // Calcular vector dirección
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = pos2.z - pos1.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Si la distancia es muy corta, asumir línea de vista
        if (distance < 2) {
            return true;
        }
        
        // Normalizar dirección
        const dirX = dx / distance;
        const dirY = dy / distance;
        const dirZ = dz / distance;
        
        // Verificar cada 2 bloques a lo largo del rayo
        const steps = Math.floor(distance / 2);
        for (let i = 1; i < steps; i++) {
            const checkX = Math.floor(pos1.x + dirX * i * 2);
            const checkY = Math.floor(pos1.y + dirY * i * 2);
            const checkZ = Math.floor(pos1.z + dirZ * i * 2);
            
            const block = dimension.getBlock({ x: checkX, y: checkY, z: checkZ });
            
            // Si hay un bloque sólido, no hay línea de vista
            if (block && block.isSolid) {
                return false;
            }
        }
        
        // No se encontraron obstrucciones
        return true;
        
    } catch (error) {
        // En caso de error, asumir que no hay línea de vista
        return false;
    }
}

/**
 * Detecta y clasifica ubicaciones estratégicas para acecho
 * Identifica ventanas, puertas, esquinas, sombras y otros puntos de interés
 * 
 * Implementa Requisitos: 6.2
 * Tarea: 10.2
 * 
 * @param {Dimension} dimension - Dimensión donde buscar
 * @param {Object} position - Posición a evaluar {x, y, z}
 * @param {Object} playerLoc - Ubicación del jugador para contexto {x, y, z}
 * @returns {Object} Información sobre ubicaciones estratégicas {tipo, puntuación, detalles}
 */
function detectStrategicLocations(dimension, position, playerLoc) {
    const result = {
        isWindow: false,
        isDoor: false,
        isCorner: false,
        isShadow: false,
        isElevated: false,
        isIndoors: false,
        hasWalls: false,
        totalScore: 0,
        details: []
    };
    
    try {
        const posX = Math.floor(position.x);
        const posY = Math.floor(position.y);
        const posZ = Math.floor(position.z);
        
        // ═══════════════════════════════════════════════════════════
        // DETECCIÓN DE VENTANAS (muy estratégica)
        // ═══════════════════════════════════════════════════════════
        // Buscar vidrio en un radio de 2 bloques
        const glassSearchRadius = 2;
        let glassCount = 0;
        let wallCount = 0;
        
        for (let dx = -glassSearchRadius; dx <= glassSearchRadius; dx++) {
            for (let dy = -1; dy <= 2; dy++) {
                for (let dz = -glassSearchRadius; dz <= glassSearchRadius; dz++) {
                    try {
                        const block = dimension.getBlock({
                            x: posX + dx,
                            y: posY + dy,
                            z: posZ + dz
                        });
                        
                        if (block) {
                            const typeId = block.typeId;
                            
                            // Contar vidrios (ventanas)
                            if (typeId.includes("glass") || typeId.includes("pane")) {
                                glassCount++;
                            }
                            
                            // Contar paredes sólidas
                            if (block.isSolid && (typeId.includes("brick") || 
                                typeId.includes("planks") || typeId.includes("stone") ||
                                typeId.includes("concrete") || typeId.includes("wood"))) {
                                wallCount++;
                            }
                        }
                    } catch (e) {
                        // Bloque inaccesible, continuar
                    }
                }
            }
        }
        
        // Si hay múltiples vidrios y paredes, probablemente es una ventana en estructura
        if (glassCount >= 2 && wallCount >= 4) {
            result.isWindow = true;
            result.totalScore += 25; // Alto bonus por ventana
            result.details.push("Cerca de ventana");
        } else if (glassCount >= 1) {
            result.totalScore += 10; // Bonus menor por vidrio individual
            result.details.push("Vidrio cercano");
        }
        
        // ═══════════════════════════════════════════════════════════
        // DETECCIÓN DE PUERTAS (estratégica para entrada/salida)
        // ═══════════════════════════════════════════════════════════
        const doorSearchRadius = 2;
        let doorCount = 0;
        
        for (let dx = -doorSearchRadius; dx <= doorSearchRadius; dx++) {
            for (let dy = 0; dy <= 2; dy++) {
                for (let dz = -doorSearchRadius; dz <= doorSearchRadius; dz++) {
                    try {
                        const block = dimension.getBlock({
                            x: posX + dx,
                            y: posY + dy,
                            z: posZ + dz
                        });
                        
                        if (block && block.typeId.includes("door")) {
                            doorCount++;
                        }
                    } catch (e) {}
                }
            }
        }
        
        if (doorCount >= 1) {
            result.isDoor = true;
            result.totalScore += 20; // Alto bonus por puerta
            result.details.push(`Cerca de puerta (${doorCount})`);
        }
        
        // ═══════════════════════════════════════════════════════════
        // DETECCIÓN DE ESQUINAS (excelente para acecho)
        // ═══════════════════════════════════════════════════════════
        // Una esquina tiene bloques sólidos en dos direcciones perpendiculares
        const wallsAround = {
            north: false, south: false, east: false, west: false
        };
        
        // Verificar bloques adyacentes
        try {
            const northBlock = dimension.getBlock({ x: posX, y: posY, z: posZ - 1 });
            const southBlock = dimension.getBlock({ x: posX, y: posY, z: posZ + 1 });
            const eastBlock = dimension.getBlock({ x: posX + 1, y: posY, z: posZ });
            const westBlock = dimension.getBlock({ x: posX - 1, y: posY, z: posZ });
            
            wallsAround.north = northBlock && northBlock.isSolid;
            wallsAround.south = southBlock && southBlock.isSolid;
            wallsAround.east = eastBlock && eastBlock.isSolid;
            wallsAround.west = westBlock && westBlock.isSolid;
            
            // Detectar esquinas (dos paredes perpendiculares)
            const isNorthEastCorner = wallsAround.north && wallsAround.east;
            const isNorthWestCorner = wallsAround.north && wallsAround.west;
            const isSouthEastCorner = wallsAround.south && wallsAround.east;
            const isSouthWestCorner = wallsAround.south && wallsAround.west;
            
            if (isNorthEastCorner || isNorthWestCorner || isSouthEastCorner || isSouthWestCorner) {
                result.isCorner = true;
                result.totalScore += 18; // Muy buen bonus por esquina
                result.details.push("Posición en esquina");
            }
            
            // Verificar si hay paredes (útil para determinar si está adentro)
            const wallsCount = [wallsAround.north, wallsAround.south, wallsAround.east, wallsAround.west]
                .filter(Boolean).length;
            
            if (wallsCount >= 2) {
                result.hasWalls = true;
                result.totalScore += 8;
            }
        } catch (e) {}
        
        // ═══════════════════════════════════════════════════════════
        // DETECCIÓN DE SOMBRAS (áreas oscuras = más inquietante)
        // ═══════════════════════════════════════════════════════════
        try {
            const blockAtPosition = dimension.getBlock({ x: posX, y: posY, z: posZ });
            
            // Verificar nivel de luz (en Bedrock no siempre disponible confiablemente)
            // Aproximación: verificar si hay techo arriba (indica sombra)
            let hasCeiling = false;
            for (let dy = 1; dy <= 5; dy++) {
                const blockAbove = dimension.getBlock({ x: posX, y: posY + dy, z: posZ });
                if (blockAbove && blockAbove.isSolid) {
                    hasCeiling = true;
                    break;
                }
            }
            
            if (hasCeiling) {
                result.isShadow = true;
                result.totalScore += 15; // Bonus por estar en sombra
                result.details.push("Área sombreada");
            }
            
            // Si está bajo techo y tiene paredes, probablemente está dentro de estructura
            if (hasCeiling && wallCount >= 3) {
                result.isIndoors = true;
                result.totalScore += 12; // Bonus por estar dentro de estructura
                result.details.push("Interior de estructura");
            }
        } catch (e) {}
        
        // ═══════════════════════════════════════════════════════════
        // DETECCIÓN DE ELEVACIÓN (colinas, techos)
        // ═══════════════════════════════════════════════════════════
        const heightDiff = position.y - playerLoc.y;
        if (heightDiff >= 3) {
            result.isElevated = true;
            result.totalScore += Math.min(heightDiff * 3, 20); // Max 20 puntos por altura
            result.details.push(`Elevado +${Math.floor(heightDiff)} bloques`);
        }
        
        // ═══════════════════════════════════════════════════════════
        // BONUS POR COMBINACIONES ESTRATÉGICAS
        // ═══════════════════════════════════════════════════════════
        // Ventana + esquina = posición perfecta
        if (result.isWindow && result.isCorner) {
            result.totalScore += 15;
            result.details.push("★ Esquina con ventana");
        }
        
        // Puerta + sombra = entrada inquietante
        if (result.isDoor && result.isShadow) {
            result.totalScore += 12;
            result.details.push("★ Puerta sombreada");
        }
        
        // Elevado + sombra = observación desde arriba en la oscuridad
        if (result.isElevated && result.isShadow) {
            result.totalScore += 10;
            result.details.push("★ Altura con sombra");
        }
        
        // Interior + ventana = observando desde dentro
        if (result.isIndoors && result.isWindow) {
            result.totalScore += 18;
            result.details.push("★★ Observando desde interior");
        }
        
    } catch (error) {
        console.warn("Error al detectar ubicaciones estratégicas:", error);
    }
    
    return result;
}

/**
 * Prioriza y rankea posiciones candidatas basándose en ubicaciones estratégicas
 * Versión mejorada que usa la detección avanzada de la tarea 10.2
 * 
 * Implementa Requisitos: 6.2
 * Tarea: 10.2
 * 
 * @param {Array} candidates - Array de posiciones candidatas
 * @param {Dimension} dimension - Dimensión donde evaluar
 * @param {Object} playerLoc - Ubicación del jugador
 * @param {Object} playerViewDirection - Dirección de vista del jugador
 * @returns {Array} Candidatos ordenados por puntuación estratégica
 */
function prioritizeStrategicPositions(candidates, dimension, playerLoc, playerViewDirection) {
    const playerYaw = Math.atan2(playerViewDirection.z, playerViewDirection.x);
    
    const scoredCandidates = candidates.map(candidate => {
        let score = 0;
        
        // Factor 1: Detectar ubicaciones estratégicas usando función especializada
        const strategicInfo = detectStrategicLocations(dimension, candidate, playerLoc);
        score += strategicInfo.totalScore;
        
        // Factor 2: Posiciones detrás o a los lados del jugador (sigiloso)
        let angleDiff = Math.abs(candidate.angle - playerYaw);
        if (angleDiff > Math.PI) {
            angleDiff = 2 * Math.PI - angleDiff;
        }
        const behindScore = angleDiff / Math.PI;
        score += behindScore * 25; // Peso de 25 puntos
        
        // Factor 3: Línea de vista al jugador (crucial)
        const hasLineOfSight = checkLineOfSight(dimension, candidate, playerLoc);
        if (hasLineOfSight) {
            score += 30; // Alto bonus por línea de vista
        } else {
            score -= 10; // Penalización si no puede ver al jugador
        }
        
        // Factor 4: Variedad aleatoria (evita repetición de patrones)
        score += (Math.random() - 0.5) * 15;
        
        return { 
            ...candidate, 
            score: score,
            strategicInfo: strategicInfo
        };
    });
    
    // Ordenar por puntuación (mayor a menor)
    scoredCandidates.sort((a, b) => b.score - a.score);
    
    return scoredCandidates;
}

/**
 * Mantiene al Knocker a una distancia de observación óptima del jugador
 * El Knocker se posiciona estratégicamente según el tier para observar sin ser demasiado obvio
 * ACTUALIZADO (Tarea 10.4): Usa movimiento natural y furtivo en lugar de teleportación instantánea
 * 
 * Implementa Requisitos: 6.1, 6.2, 6.5, 6.6
 * Tarea: 10.1, 10.4
 * 
 * @param {Entity} knocker - Entidad del Knocker
 * @param {Player} targetPlayer - Jugador objetivo
 * @param {number} tier - Tier del sistema de vínculo (0-3)
 */
function maintainOptimalObservationDistance(knocker, targetPlayer, tier) {
    try {
        const config = getTierBehaviorConfig(tier);
        const optimalDistance = config.followDistance;
        
        // Calcular distancia actual entre Knocker y jugador
        const knockerLoc = knocker.location;
        const playerLoc = targetPlayer.location;
        
        const dx = knockerLoc.x - playerLoc.x;
        const dy = knockerLoc.y - playerLoc.y;
        const dz = knockerLoc.z - playerLoc.z;
        const currentDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Definir rango aceptable de distancia (±4 bloques de tolerancia)
        const minAcceptableDistance = optimalDistance - 4;
        const maxAcceptableDistance = optimalDistance + 4;
        
        // Si la distancia está dentro del rango aceptable, no es necesario reposicionar
        if (currentDistance >= minAcceptableDistance && currentDistance <= maxAcceptableDistance) {
            // Aún dentro del rango, pero actualizar movimiento progresivo si hay ruta activa
            updateKnockerStealthyMovement(knocker, targetPlayer);
            return; // Distancia óptima mantenida
        }
        
        // Si el Knocker está demasiado lejos o demasiado cerca, buscar nueva posición
        // Usar distancia óptima con algo de variación aleatoria para naturalidad
        const targetDistance = optimalDistance + (Math.random() - 0.5) * 6; // ±3 bloques de variación
        
        // Obtener posición estratégica óptima
        const newPosition = getOptimalStalkingPosition(targetPlayer, targetDistance);
        
        // Si se encontró una posición válida, iniciar movimiento natural
        if (newPosition) {
            // NUEVO (Tarea 10.4): Usar movimiento natural en lugar de teleportación directa
            const movementStarted = moveKnockerNaturally(knocker, newPosition, targetPlayer);
            
            if (!movementStarted) {
                // Si el movimiento natural falló, usar teleportación como fallback
                try {
                    knocker.teleport(newPosition, {
                        dimension: targetPlayer.dimension,
                        rotation: knocker.getRotation(),
                        facingLocation: playerLoc
                    });
                } catch (error) {
                    console.warn("Error al teleportar Knocker a posición óptima (fallback):", error);
                }
            }
        } else {
            // Si no se encontró posición óptima, intentar posicionamiento simple
            // Mantener distancia óptima en dirección opuesta a la vista del jugador
            const viewDir = targetPlayer.getViewDirection();
            
            // Posicionar detrás del jugador (opuesto a su vista)
            const behindX = playerLoc.x - viewDir.x * targetDistance;
            const behindZ = playerLoc.z - viewDir.z * targetDistance;
            
            const simpleTarget = {
                x: behindX,
                y: playerLoc.y,
                z: behindZ
            };
            
            // Intentar movimiento natural incluso con posición simple
            const movementStarted = moveKnockerNaturally(knocker, simpleTarget, targetPlayer);
            
            if (!movementStarted) {
                // Fallback a teleportación directa
                try {
                    knocker.teleport(simpleTarget, {
                        dimension: targetPlayer.dimension
                    });
                } catch (error) {
                    console.warn("Error al teleportar Knocker (fallback simple):", error);
                }
            }
        }
        
    } catch (error) {
        console.warn("Error al mantener distancia de observación óptima:", error);
    }
}

/**
 * Aplica comportamiento de acecho basado en la intensidad configurada
 * Controla cuándo el Knocker debe ser visible/invisible según el tier
 * 
 * MEJORADO (Tarea 10.5): Ahora aplica invisibilidad real usando efectos de Minecraft
 * basándose en los porcentajes de visibilidad por tier:
 * - Tier 0 (Stranger): 10% visible
 * - Tier 1 (Watched): 25% visible
 * - Tier 2 (Familiar): 50% visible
 * - Tier 3 (Obsessed): 75% visible
 * 
 * Implementa Requisitos: 6.7, 6.8, 6.9, 6.10, 6.11
 * Tarea: 10.5
 * 
 * @param {Entity} knocker - Entidad del Knocker
 * @param {Player} targetPlayer - Jugador objetivo
 * @param {number} intensity - Intensidad de acecho (0.0 - 1.0) representa % de visibilidad
 */
function applyStalkingBehavior(knocker, targetPlayer, intensity) {
    try {
        // NUEVO: Aplicar efecto Weeping Angel primero (Tarea 10.3)
        // Esto tiene prioridad sobre la intensidad de acecho base
        applyWeepingAngelEffect(knocker, targetPlayer);
        
        // Determinar si el Knocker debe estar visible en este momento
        // basándose en la intensidad (probabilidad de visibilidad según tier)
        // NOTA: El efecto Weeping Angel puede anular esta decisión
        const shouldBeVisible = Math.random() < intensity;
        
        // Solo aplicar visibilidad base si NO está siendo controlado por Weeping Angel
        // El efecto Weeping Angel tiene prioridad absoluta (se oculta cuando lo miran)
        if (!knocker.hasTag("weeping_angel_active")) {
            if (shouldBeVisible) {
                // ═══════════════════════════════════════════════════════════════
                // HACER VISIBLE (según porcentaje del tier)
                // ═══════════════════════════════════════════════════════════════
                
                // Remover tag de ocultamiento y marcar como visible
                knocker.removeTag("stalking_hidden");
                knocker.addTag("stalking_visible");
                
                // NUEVO (Tarea 10.5): Remover efecto de invisibilidad para hacer visible
                try {
                    knocker.removeEffect("invisibility");
                } catch (effectError) {
                    // Si no se puede remover el efecto, continuar
                    // (puede que no tuviera el efecto aplicado)
                }
                
                // Almacenar timestamp de última aparición visible
                try {
                    knocker.setDynamicProperty("last_visible_time", Date.now());
                } catch (propError) {
                    // Si dynamic properties no funcionan, continuar
                }
                
            } else {
                // ═══════════════════════════════════════════════════════════════
                // HACER OCULTO (según porcentaje del tier)
                // ═══════════════════════════════════════════════════════════════
                
                // Actualizar tags para marcar como oculto
                knocker.removeTag("stalking_visible");
                knocker.addTag("stalking_hidden");
                
                // NUEVO (Tarea 10.5): Aplicar efecto de invisibilidad real
                // Duración: 5 segundos (se reaplica periódicamente en el ciclo de actualización)
                try {
                    knocker.addEffect("invisibility", 100, {
                        amplifier: 0,
                        showParticles: false  // Sin partículas para mantener el misterio
                    });
                } catch (effectError) {
                    // Si no se puede aplicar el efecto, al menos tenemos los tags
                    console.warn("No se pudo aplicar invisibilidad en stalking:", effectError);
                }
                
                // Almacenar timestamp de última ocultación
                try {
                    knocker.setDynamicProperty("last_hidden_time", Date.now());
                } catch (propError) {
                    // Si dynamic properties no funcionan, continuar
                }
                
                // En tiers bajos (0-1), el Knocker permanece oculto la mayor parte del tiempo
                // En tiers altos (2-3), el Knocker es más visible y presente
            }
        }
        
    } catch (error) {
        console.warn("Error al aplicar comportamiento de acecho:", error);
    }
}

// ────────────────────────────────────────────────────────────────────────────
//  SISTEMA DE MOVIMIENTO NATURAL Y FURTIVO (Tarea 10.4)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Calcula la ruta más furtiva entre dos posiciones
 * Prioriza caminos que eviten la detección directa del jugador
 * MEJORADO (Tarea 10.4): Movimiento más natural, evita rutas erráticas, mejor evasión
 * 
 * Implementa Requisitos: 6.5, 6.6
 * Tarea: 10.4
 * 
 * @param {Dimension} dimension - Dimensión donde se mueve
 * @param {Object} startPos - Posición inicial {x, y, z}
 * @param {Object} targetPos - Posición objetivo {x, y, z}
 * @param {Object} playerLoc - Ubicación del jugador (para evitar detección)
 * @param {Object} playerViewDirection - Dirección de vista del jugador
 * @returns {Array} Array de waypoints [{x, y, z}, ...] que forman la ruta
 */
function calculateStealthyPath(dimension, startPos, targetPos, playerLoc, playerViewDirection) {
    try {
        // Calcular distancia directa
        const dx = targetPos.x - startPos.x;
        const dy = targetPos.y - startPos.y;
        const dz = targetPos.z - startPos.z;
        const directDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Si la distancia es muy corta (< 8 bloques), usar ruta directa simple
        // Movimientos cortos no necesitan evasión compleja
        if (directDistance < 8) {
            return [startPos, targetPos];
        }
        
        // Vector normalizado hacia el objetivo
        const dirToTarget = {
            x: dx / directDistance,
            y: dy / directDistance,
            z: dz / directDistance
        };
        
        // Calcular vector perpendicular para crear waypoints laterales (evasión)
        // Perpendicular en el plano XZ (ignorar Y para mantener altura similar)
        const perpendicular = {
            x: -dirToTarget.z,
            y: 0,
            z: dirToTarget.x
        };
        
        // Determinar si el jugador está mirando hacia la ruta directa
        // Si lo está, necesitamos una ruta más indirecta
        const playerToStart = {
            x: startPos.x - playerLoc.x,
            y: startPos.y - playerLoc.y,
            z: startPos.z - playerLoc.z
        };
        
        const distToPlayer = Math.sqrt(
            playerToStart.x * playerToStart.x + 
            playerToStart.y * playerToStart.y + 
            playerToStart.z * playerToStart.z
        );
        
        if (distToPlayer === 0) {
            return [startPos, targetPos]; // Edge case: knocker en misma posición que jugador
        }
        
        const playerToStartNorm = {
            x: playerToStart.x / distToPlayer,
            y: playerToStart.y / distToPlayer,
            z: playerToStart.z / distToPlayer
        };
        
        // Producto punto: ¿el jugador está mirando hacia la ruta?
        const dotProduct = 
            playerViewDirection.x * playerToStartNorm.x +
            playerViewDirection.y * playerToStartNorm.y +
            playerViewDirection.z * playerToStartNorm.z;
        
        // Si dotProduct > 0.5, el jugador está mirando en dirección general de la ruta
        const playerLookingTowardsPath = dotProduct > 0.5;
        
        // MEJORA: Calcular cuán directamente el jugador mira hacia el punto de inicio
        // Esto permite ajustar la intensidad de evasión dinámicamente
        const lookingIntensity = Math.max(0, dotProduct); // 0 = no mira, 1 = mira directamente
        
        // Generar waypoints para ruta furtiva
        const waypoints = [startPos];
        
        if (playerLookingTowardsPath && directDistance > 16) {
            // ═══════════════════════════════════════════════════════════════
            // RUTA INDIRECTA: Crear un arco suave para evitar campo de visión
            // MEJORA: Usar curva Bézier para movimiento más natural (no zigzag)
            // ═══════════════════════════════════════════════════════════════
            
            const numSegments = directDistance > 40 ? 4 : (directDistance > 24 ? 3 : 2);
            
            // MEJORA: Desviación adaptativa basada en intensidad de mirada
            // Si el jugador mira muy directamente, desviarse más
            const baseDeviation = 6 + (lookingIntensity * 6); // 6-12 bloques
            
            // MEJORA: Determinar lado de evasión basado en perpendicular menos visible
            // Calcular qué lado es menos probable que el jugador vea
            const leftSide = {
                x: perpendicular.x,
                z: perpendicular.z
            };
            const rightSide = {
                x: -perpendicular.x,
                z: -perpendicular.z
            };
            
            // Vector desde jugador hacia punto medio de la ruta
            const midX = (startPos.x + targetPos.x) / 2;
            const midZ = (startPos.z + targetPos.z) / 2;
            const playerToMid = {
                x: midX - playerLoc.x,
                z: midZ - playerLoc.z
            };
            
            // Determinar qué lado es más "alejado" de la vista del jugador
            const dotLeft = playerViewDirection.x * leftSide.x + playerViewDirection.z * leftSide.z;
            const dotRight = playerViewDirection.x * rightSide.x + playerViewDirection.z * rightSide.z;
            
            // Elegir el lado que sea MENOS visible (producto punto menor)
            const chosenSide = dotLeft < dotRight ? leftSide : rightSide;
            
            for (let i = 1; i <= numSegments; i++) {
                const progress = i / (numSegments + 1);
                
                // Interpolar entre inicio y objetivo
                const baseX = startPos.x + dirToTarget.x * directDistance * progress;
                const baseY = startPos.y + dirToTarget.y * directDistance * progress;
                const baseZ = startPos.z + dirToTarget.z * directDistance * progress;
                
                // MEJORA: Usar curva sinusoidal suave en lugar de zigzag brusco
                // Esto crea un arco natural en lugar de movimiento errático
                const curveProgress = progress * Math.PI; // 0 a π
                const lateralOffset = baseDeviation * Math.sin(curveProgress);
                
                const waypoint = {
                    x: baseX + chosenSide.x * lateralOffset,
                    y: baseY, // Mantener Y similar (ajustar por terreno después)
                    z: baseZ + chosenSide.z * lateralOffset
                };
                
                // Ajustar altura para terreno (encontrar superficie)
                const adjustedWaypoint = findSafeSurfaceNear(dimension, waypoint);
                waypoints.push(adjustedWaypoint);
            }
            
        } else {
            // ═══════════════════════════════════════════════════════════════
            // RUTA SEMI-DIRECTA: El jugador no está mirando directamente
            // MEJORA: Aún añadir curvatura sutil para evitar movimiento robotico
            // ═══════════════════════════════════════════════════════════════
            
            if (directDistance > 16) {
                // MEJORA: Usar múltiples waypoints incluso en ruta semi-directa
                // para movimiento más fluido y menos teleportación aparente
                const numSegments = directDistance > 32 ? 2 : 1;
                const lateralDeviation = 3; // Desviación mínima pero presente
                
                // Elegir desviación aleatoria pero consistente (no errática)
                const deviationDirection = Math.random() > 0.5 ? 1 : -1;
                
                for (let i = 1; i <= numSegments; i++) {
                    const progress = i / (numSegments + 1);
                    
                    const midX = startPos.x + dirToTarget.x * directDistance * progress;
                    const midY = startPos.y + dirToTarget.y * directDistance * progress;
                    const midZ = startPos.z + dirToTarget.z * directDistance * progress;
                    
                    // MEJORA: Curva sinusoidal suave incluso en movimiento semi-directo
                    const curveProgress = progress * Math.PI;
                    const lateralOffset = lateralDeviation * Math.sin(curveProgress) * deviationDirection;
                    
                    const waypoint = {
                        x: midX + perpendicular.x * lateralOffset,
                        y: midY,
                        z: midZ + perpendicular.z * lateralOffset
                    };
                    
                    const adjustedWaypoint = findSafeSurfaceNear(dimension, waypoint);
                    waypoints.push(adjustedWaypoint);
                }
            }
        }
        
        // Añadir posición objetivo final
        waypoints.push(targetPos);
        
        // MEJORA: Suavizar ruta final para evitar ángulos bruscos
        // Esto previene movimiento errático entre waypoints
        const smoothedWaypoints = smoothPath(waypoints);
        
        return smoothedWaypoints;
        
    } catch (error) {
        console.warn("Error al calcular ruta furtiva:", error);
        // Fallback: ruta directa
        return [startPos, targetPos];
    }
}

/**
 * Suaviza una ruta eliminando ángulos bruscos entre waypoints
 * NUEVO (Tarea 10.4): Previene movimiento errático y crea transiciones naturales
 * 
 * Implementa Requisito: 6.5 (movimiento natural e intencional, no errático)
 * 
 * @param {Array} waypoints - Array de waypoints originales [{x, y, z}, ...]
 * @returns {Array} Array de waypoints suavizados
 */
function smoothPath(waypoints) {
    // Si hay 2 o menos waypoints, no hay nada que suavizar
    if (waypoints.length <= 2) {
        return waypoints;
    }
    
    try {
        const smoothed = [waypoints[0]]; // Siempre incluir el punto de inicio
        
        // Verificar ángulos entre segmentos consecutivos
        for (let i = 1; i < waypoints.length - 1; i++) {
            const prev = waypoints[i - 1];
            const curr = waypoints[i];
            const next = waypoints[i + 1];
            
            // Vectores de los segmentos
            const v1 = {
                x: curr.x - prev.x,
                y: curr.y - prev.y,
                z: curr.z - prev.z
            };
            
            const v2 = {
                x: next.x - curr.x,
                y: next.y - curr.y,
                z: next.z - curr.z
            };
            
            // Calcular ángulo entre segmentos usando producto punto
            const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
            const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
            
            if (len1 === 0 || len2 === 0) {
                continue; // Skip waypoints duplicados
            }
            
            const dotProduct = (v1.x * v2.x + v1.y * v2.y + v1.z * v2.z) / (len1 * len2);
            const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct))); // Clamped para evitar NaN
            
            // Si el ángulo es muy brusco (> 120 grados = 2.09 radianes), suavizar
            if (angle > 2.09) {
                // Insertar punto intermedio para suavizar el giro
                const intermediate = {
                    x: (prev.x + curr.x + next.x) / 3,
                    y: (prev.y + curr.y + next.y) / 3,
                    z: (prev.z + curr.z + next.z) / 3
                };
                smoothed.push(intermediate);
            } else {
                // Ángulo aceptable, mantener waypoint original
                smoothed.push(curr);
            }
        }
        
        // Siempre incluir el punto final
        smoothed.push(waypoints[waypoints.length - 1]);
        
        return smoothed;
        
    } catch (error) {
        console.warn("Error al suavizar ruta:", error);
        return waypoints; // Retornar ruta original si hay error
    }
}

/**
 * Encuentra una superficie segura cerca de una posición dada
 * Ajusta la coordenada Y para que el Knocker aparezca en el suelo, no flotando o enterrado
 * 
 * @param {Dimension} dimension - Dimensión donde buscar
 * @param {Object} position - Posición aproximada {x, y, z}
 * @returns {Object} Posición ajustada {x, y, z} en superficie segura
 */
function findSafeSurfaceNear(dimension, position) {
    try {
        const checkRadius = 3; // Verificar en un radio de 3 bloques verticales
        
        // Primero, verificar si la posición actual ya está en una superficie válida
        const currentBlock = dimension.getBlock({
            x: Math.floor(position.x),
            y: Math.floor(position.y),
            z: Math.floor(position.z)
        });
        
        const blockBelow = dimension.getBlock({
            x: Math.floor(position.x),
            y: Math.floor(position.y) - 1,
            z: Math.floor(position.z)
        });
        
        // Condición ideal: bloque actual es aire y bloque debajo es sólido
        if (currentBlock && !currentBlock.isSolid && blockBelow && blockBelow.isSolid) {
            return position; // Posición ya está bien
        }
        
        // Si no, buscar superficie segura cerca (hacia abajo primero)
        for (let dy = 0; dy >= -checkRadius; dy--) {
            const testY = Math.floor(position.y) + dy;
            
            const testBlock = dimension.getBlock({
                x: Math.floor(position.x),
                y: testY,
                z: Math.floor(position.z)
            });
            
            const testBlockBelow = dimension.getBlock({
                x: Math.floor(position.x),
                y: testY - 1,
                z: Math.floor(position.z)
            });
            
            if (testBlock && !testBlock.isSolid && testBlockBelow && testBlockBelow.isSolid) {
                return {
                    x: position.x,
                    y: testY,
                    z: position.z
                };
            }
        }
        
        // Si no encontramos hacia abajo, buscar hacia arriba
        for (let dy = 1; dy <= checkRadius; dy++) {
            const testY = Math.floor(position.y) + dy;
            
            const testBlock = dimension.getBlock({
                x: Math.floor(position.x),
                y: testY,
                z: Math.floor(position.z)
            });
            
            const testBlockBelow = dimension.getBlock({
                x: Math.floor(position.x),
                y: testY - 1,
                z: Math.floor(position.z)
            });
            
            if (testBlock && !testBlock.isSolid && testBlockBelow && testBlockBelow.isSolid) {
                return {
                    x: position.x,
                    y: testY,
                    z: position.z
                };
            }
        }
        
        // Si no encontramos superficie segura, retornar posición original
        return position;
        
    } catch (error) {
        console.warn("Error al buscar superficie segura:", error);
        return position;
    }
}

/**
 * Mueve al Knocker de manera natural y furtiva hacia una posición objetivo
 * En lugar de teleportación instantánea, sigue una ruta calculada con waypoints
 * 
 * Implementa Requisitos: 6.5, 6.6
 * Tarea: 10.4
 * 
 * @param {Entity} knocker - Entidad del Knocker
 * @param {Object} targetPosition - Posición objetivo {x, y, z}
 * @param {Player} player - Jugador (para calcular ruta furtiva)
 * @returns {boolean} True si se inició el movimiento, false si hubo error
 */
function moveKnockerNaturally(knocker, targetPosition, player) {
    try {
        const knockerLoc = knocker.location;
        const playerLoc = player.location;
        const playerViewDir = player.getViewDirection();
        
        // Calcular ruta furtiva
        const path = calculateStealthyPath(
            player.dimension,
            knockerLoc,
            targetPosition,
            playerLoc,
            playerViewDir
        );
        
        // Guardar la ruta en dynamic properties para seguimiento progresivo
        // (en el próximo ciclo de actualización, moveremos al siguiente waypoint)
        try {
            knocker.setDynamicProperty("stealthy_path", JSON.stringify(path));
            knocker.setDynamicProperty("current_waypoint_index", 0);
            knocker.setDynamicProperty("path_start_time", Date.now());
        } catch (propError) {
            // Si dynamic properties no funcionan, hacer movimiento directo suave
            console.warn("No se pudo guardar ruta en dynamic properties:", propError);
            
            // Fallback: teleportar a waypoint intermedio si existe, o directo
            if (path.length > 2) {
                const midWaypoint = path[Math.floor(path.length / 2)];
                knocker.teleport(midWaypoint, {
                    dimension: player.dimension,
                    rotation: knocker.getRotation()
                });
            } else {
                knocker.teleport(targetPosition, {
                    dimension: player.dimension,
                    rotation: knocker.getRotation()
                });
            }
            
            return true;
        }
        
        // Iniciar movimiento hacia el primer waypoint
        if (path.length > 1) {
            const firstWaypoint = path[1]; // [0] es posición actual, [1] es primer destino
            
            // Teleportar al primer waypoint para iniciar
            knocker.teleport(firstWaypoint, {
                dimension: player.dimension,
                rotation: knocker.getRotation()
            });
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.warn("Error al mover Knocker naturalmente:", error);
        return false;
    }
}

/**
 * Actualiza el movimiento progresivo del Knocker siguiendo su ruta guardada
 * Esta función debe llamarse periódicamente para que el Knocker avance waypoint por waypoint
 * MEJORADO (Tarea 10.4): Movimiento adaptativo, velocidad variable, mejor naturalidad
 * 
 * Implementa Requisitos: 6.5, 6.6
 * Tarea: 10.4
 * 
 * @param {Entity} knocker - Entidad del Knocker
 * @param {Player} player - Jugador objetivo
 */
function updateKnockerStealthyMovement(knocker, player) {
    try {
        // Verificar si hay una ruta activa
        const pathJSON = knocker.getDynamicProperty("stealthy_path");
        if (!pathJSON) {
            return; // No hay ruta activa
        }
        
        const path = JSON.parse(pathJSON);
        const currentIndex = knocker.getDynamicProperty("current_waypoint_index") || 0;
        const pathStartTime = knocker.getDynamicProperty("path_start_time") || Date.now();
        
        // Verificar si ya llegamos al final de la ruta
        if (currentIndex >= path.length - 1) {
            // Ruta completada, limpiar
            knocker.setDynamicProperty("stealthy_path", null);
            knocker.setDynamicProperty("current_waypoint_index", null);
            knocker.setDynamicProperty("path_start_time", null);
            knocker.setDynamicProperty("movement_paused", null);
            return;
        }
        
        // Verificar si el jugador está mirando al Knocker antes de mover
        const isLooking = isPlayerLookingAtKnocker(player, knocker);
        
        if (isLooking) {
            // Si el jugador está mirando, NO mover (Weeping Angel effect)
            // Marcar como pausado y guardar el tiempo actual
            if (!knocker.getDynamicProperty("movement_paused")) {
                knocker.setDynamicProperty("movement_paused", Date.now());
            }
            return;
        }
        
        // Si estaba pausado pero ya no está mirando, reanudar
        const wasPaused = knocker.getDynamicProperty("movement_paused");
        if (wasPaused) {
            // Ajustar el tiempo de inicio para compensar el tiempo pausado
            const pauseDuration = Date.now() - wasPaused;
            knocker.setDynamicProperty("path_start_time", pathStartTime + pauseDuration);
            knocker.setDynamicProperty("movement_paused", null);
            return; // Esperar un ciclo más antes de mover
        }
        
        // MEJORA: Velocidad de movimiento adaptativa basada en distancia al waypoint
        // Waypoints cercanos = movimiento más rápido (más natural)
        // Waypoints lejanos = movimiento más lento (más furtivo)
        const knockerLoc = knocker.location;
        const nextWaypoint = path[currentIndex + 1];
        
        if (!nextWaypoint) {
            // No hay siguiente waypoint, limpiar
            knocker.setDynamicProperty("stealthy_path", null);
            knocker.setDynamicProperty("current_waypoint_index", null);
            knocker.setDynamicProperty("path_start_time", null);
            return;
        }
        
        const dx = nextWaypoint.x - knockerLoc.x;
        const dy = nextWaypoint.y - knockerLoc.y;
        const dz = nextWaypoint.z - knockerLoc.z;
        const distToWaypoint = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // MEJORA: Intervalo de movimiento adaptativo
        // Distancia corta (< 5 bloques): 1 segundo por waypoint (más rápido)
        // Distancia media (5-12 bloques): 1.5 segundos (balance)
        // Distancia larga (> 12 bloques): 2 segundos (más sigiloso)
        let movementInterval;
        if (distToWaypoint < 5) {
            movementInterval = 1000; // 1 segundo
        } else if (distToWaypoint < 12) {
            movementInterval = 1500; // 1.5 segundos
        } else {
            movementInterval = 2000; // 2 segundos
        }
        
        // MEJORA: También considerar distancia al jugador
        // Si el Knocker está cerca del jugador, moverse MÁS lento (más sigiloso)
        const distToPlayer = Math.sqrt(
            (knockerLoc.x - player.location.x) ** 2 +
            (knockerLoc.y - player.location.y) ** 2 +
            (knockerLoc.z - player.location.z) ** 2
        );
        
        if (distToPlayer < 16) {
            // Muy cerca del jugador: movimiento ultra-furtivo (más lento)
            movementInterval = movementInterval * 1.5;
        } else if (distToPlayer > 40) {
            // Lejos del jugador: puede moverse más rápido
            movementInterval = movementInterval * 0.8;
        }
        
        // Verificar si ha pasado suficiente tiempo para avanzar al siguiente waypoint
        const timeSinceStart = Date.now() - pathStartTime;
        const expectedIndex = Math.floor(timeSinceStart / movementInterval);
        
        if (expectedIndex <= currentIndex) {
            return; // Aún no es momento de avanzar
        }
        
        // Avanzar al siguiente waypoint
        const nextIndex = Math.min(currentIndex + 1, path.length - 1);
        
        // MEJORA: Calcular rotación suave hacia el waypoint
        // Esto hace que el Knocker "mire" hacia donde va antes de moverse
        const yaw = Math.atan2(dz, dx) * (180 / Math.PI) - 90;
        const pitch = 0; // Mantener pitch neutral para entidad humanoide
        
        // Mover al siguiente waypoint
        try {
            knocker.teleport(nextWaypoint, {
                dimension: player.dimension,
                rotation: { x: pitch, y: yaw },
                facingLocation: player.location // Prioridad: mirar al jugador
            });
            
            // Actualizar índice
            knocker.setDynamicProperty("current_waypoint_index", nextIndex);
            
            // MEJORA: Añadir tag de estado para debugging/visualización
            knocker.addTag("moving_stealthily");
            
        } catch (teleportError) {
            console.warn("Error al teleportar a waypoint:", teleportError);
            // Si hay error, limpiar la ruta
            knocker.setDynamicProperty("stealthy_path", null);
            knocker.setDynamicProperty("current_waypoint_index", null);
            knocker.setDynamicProperty("path_start_time", null);
            knocker.setDynamicProperty("movement_paused", null);
            knocker.removeTag("moving_stealthily");
        }
        
    } catch (error) {
        console.warn("Error al actualizar movimiento furtivo:", error);
        // Limpiar datos de ruta en caso de error
        try {
            knocker.setDynamicProperty("stealthy_path", null);
            knocker.setDynamicProperty("current_waypoint_index", null);
            knocker.setDynamicProperty("path_start_time", null);
            knocker.setDynamicProperty("movement_paused", null);
            knocker.removeTag("moving_stealthily");
        } catch {}
    }
}

// ────────────────────────────────────────────────────────────────────────────
//  SISTEMA DE OCULTAMIENTO BASADO EN MIRADA (WEEPING ANGEL EFFECT)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Detecta si el jugador está mirando directamente al Knocker
 * Calcula si el Knocker está dentro del campo de visión del jugador
 * y si el jugador está apuntando en su dirección
 * 
 * Implementa Requisitos: 6.3, 6.4
 * Tarea: 10.3
 * 
 * @param {Player} player - Jugador a evaluar
 * @param {Entity} knocker - Entidad del Knocker
 * @returns {boolean} True si el jugador está mirando al Knocker, false si no
 */
function isPlayerLookingAtKnocker(player, knocker) {
    try {
        const playerLoc = player.location;
        const knockerLoc = knocker.location;
        
        // Vector del jugador al Knocker
        const toKnocker = {
            x: knockerLoc.x - playerLoc.x,
            y: knockerLoc.y - playerLoc.y,
            z: knockerLoc.z - playerLoc.z
        };
        
        // Distancia al Knocker
        const distance = Math.sqrt(toKnocker.x * toKnocker.x + toKnocker.y * toKnocker.y + toKnocker.z * toKnocker.z);
        
        // Si el Knocker está demasiado lejos (más de 64 bloques), no considerarlo visible
        if (distance > 64 || distance === 0) {
            return false;
        }
        
        // Normalizar vector hacia el Knocker
        const toKnockerNorm = {
            x: toKnocker.x / distance,
            y: toKnocker.y / distance,
            z: toKnocker.z / distance
        };
        
        // Dirección de vista del jugador
        const viewDirection = player.getViewDirection();
        
        // Calcular producto punto entre dirección de vista y vector hacia Knocker
        // Esto nos dice cuán alineados están los vectores
        const dotProduct = 
            viewDirection.x * toKnockerNorm.x +
            viewDirection.y * toKnockerNorm.y +
            viewDirection.z * toKnockerNorm.z;
        
        // El producto punto va de -1 (opuesto) a 1 (mismo sentido)
        // Umbral de ~0.9 = aproximadamente 25 grados de campo de visión
        // Esto simula que el jugador está mirando "directamente" al Knocker
        const lookingThreshold = 0.88; // ~28 grados de cono de visión
        
        const isLooking = dotProduct > lookingThreshold;
        
        // Verificar línea de vista (opcional - sin obstrucciones)
        // Si hay bloques sólidos entre jugador y Knocker, no cuenta como "mirando directamente"
        if (isLooking && distance < 32) {
            // Solo verificar línea de vista si está relativamente cerca
            const hasLineOfSight = checkLineOfSight(player.dimension, playerLoc, knockerLoc);
            return hasLineOfSight;
        }
        
        return isLooking;
        
    } catch (error) {
        console.warn("Error al detectar si jugador mira al Knocker:", error);
        return false;
    }
}

/**
 * Aplica el efecto Weeping Angel: El Knocker se oculta cuando el jugador lo mira
 * y se revela cuando el jugador no está mirando
 * 
 * Este es el comportamiento icónico de los Weeping Angels de Doctor Who:
 * - Cuando los observas directamente, están "congelados" e invisibles
 * - Cuando desvías la mirada, se mueven y se vuelven visibles
 * 
 * Implementa Requisitos: 6.3, 6.4
 * Tarea: 10.3
 * 
 * @param {Entity} knocker - Entidad del Knocker
 * @param {Player} targetPlayer - Jugador objetivo
 */
function applyWeepingAngelEffect(knocker, targetPlayer) {
    try {
        // Detectar si el jugador está mirando al Knocker
        const isLooking = isPlayerLookingAtKnocker(targetPlayer, knocker);
        
        // Marcar que el efecto Weeping Angel está activo
        knocker.addTag("weeping_angel_active");
        
        if (isLooking) {
            // ═══════════════════════════════════════════════════════════════
            // JUGADOR ESTÁ MIRANDO → OCULTAR KNOCKER GRADUALMENTE
            // ═══════════════════════════════════════════════════════════════
            
            // Aplicar invisibilidad usando efecto de Minecraft
            // Duración: 2 segundos (se reaplica cada ciclo de actualización)
            try {
                knocker.addEffect("invisibility", 40, {
                    amplifier: 0,
                    showParticles: false
                });
            } catch (effectError) {
                // Si no se puede aplicar el efecto, usar tags como alternativa
                console.warn("No se pudo aplicar efecto de invisibilidad:", effectError);
            }
            
            // Agregar tags para sistemas adicionales (JSON behavior, resource pack)
            knocker.addTag("being_watched");
            knocker.addTag("weeping_angel_frozen");
            knocker.removeTag("weeping_angel_moving");
            
            // Reducir velocidad de movimiento a casi 0 (congelado)
            // Esto se puede usar en behavior.json con filtros de tag
            try {
                knocker.setDynamicProperty("weeping_angel_speed_multiplier", 0.05);
            } catch (propError) {
                // Si dynamic properties no están disponibles, continuar
            }
            
            // Registrar en memoria que el jugador "atrapó" al Knocker mirándolo
            // Esto puede usarse para diálogos futuros ("Me viste esa vez...")
            const memory = getPlayerMemory(targetPlayer.name);
            const lastCatchTime = knocker.getDynamicProperty("last_caught_looking_time") || 0;
            const currentTime = Date.now();
            
            // Solo registrar si ha pasado suficiente tiempo desde la última vez (evitar spam)
            if (currentTime - lastCatchTime > 60000) { // 1 minuto
                memory.addEvent("caught_knocker_looking", {
                    location: knocker.location,
                    dimension: targetPlayer.dimension.id,
                    timestamp: currentTime
                });
                
                knocker.setDynamicProperty("last_caught_looking_time", currentTime);
            }
            
        } else {
            // ═══════════════════════════════════════════════════════════════
            // JUGADOR NO ESTÁ MIRANDO → REVELAR KNOCKER
            // ═══════════════════════════════════════════════════════════════
            
            // Remover invisibilidad
            try {
                knocker.removeEffect("invisibility");
            } catch (effectError) {
                // Si hay error al remover efecto, continuar
            }
            
            // Actualizar tags
            knocker.removeTag("being_watched");
            knocker.removeTag("weeping_angel_frozen");
            knocker.addTag("weeping_angel_moving");
            
            // Restaurar velocidad de movimiento normal
            try {
                knocker.setDynamicProperty("weeping_angel_speed_multiplier", 1.0);
            } catch (propError) {
                // Si dynamic properties no están disponibles, continuar
            }
            
            // El Knocker está libre para moverse y acercarse
            // El comportamiento normal de acecho se aplicará
        }
        
    } catch (error) {
        console.warn("Error al aplicar efecto Weeping Angel:", error);
        // En caso de error, remover el tag para que el comportamiento normal continúe
        knocker.removeTag("weeping_angel_active");
    }
}

/**
 * Sistema de spawn inteligente basado en tier
 * Determina si un Knocker debe spawnearse naturalmente basándose en el tier del jugador
 * 
 * Implementa Requisitos: 8.7, 8.8, 8.9
 * Tarea: 9.4
 * 
 * @param {Player} player - Jugador cerca del cual se evaluará el spawn
 * @returns {boolean} True si se debe permitir el spawn, false si no
 */
function shouldSpawnKnockerForPlayer(player) {
    try {
        const bond = getBond(player);
        const tier = getTier(bond);
        const config = getTierBehaviorConfig(tier);
        
        // Verificar si ya existe un Knocker para este jugador en cualquier dimensión
        const allDims = ["overworld", "nether", "the_end"];
        for (const dimId of allDims) {
            try {
                const knockers = world.getDimension(dimId).getEntities({ type: "scary:knocker" });
                // Si ya hay un Knocker, no spawnar otro
                if (knockers.length > 0) {
                    return false;
                }
            } catch {}
        }
        
        // Evaluar probabilidad de spawn basada en tier
        const spawnRoll = Math.random();
        const shouldSpawn = spawnRoll < config.spawnFrequency;
        
        return shouldSpawn;
        
    } catch (error) {
        console.warn("Error al evaluar spawn de Knocker por tier:", error);
        return false;
    }
}

/**
 * Sistema de interacción automática basado en tier
 * El Knocker interactúa con el jugador automáticamente según el tier
 * (comentarios ambientales, observaciones, etc.)
 * 
 * Implementa Requisitos: 8.1, 8.2, 8.3, 8.4
 * Tarea: 9.4
 * 
 * @param {Player} player - Jugador objetivo
 * @param {number} tier - Tier del sistema de vínculo
 */
function triggerAutomaticInteraction(player, tier) {
    try {
        const config = getTierBehaviorConfig(tier);
        const playerName = player.name;
        
        // Verificar cooldown de interacción automática
        const lastInteractionKey = `last_auto_interaction_${playerName}`;
        const lastInteractionTime = player.getDynamicProperty(lastInteractionKey) || 0;
        const currentTime = Date.now();
        const timeSinceLastInteraction = (currentTime - lastInteractionTime) / 1000; // en segundos
        
        // Si no ha pasado suficiente tiempo según el cooldown del tier, no interactuar
        if (timeSinceLastInteraction < config.interactionCooldown) {
            return;
        }
        
        // Decidir tipo de interacción automática basada en tier
        const interactionTypes = [
            "environmental_comment",  // Comentario ambiental
            "observation",            // Observación general
            "memory_reference",       // Referencia a memoria
            "hostile_mob_warning"     // Advertencia sobre mobs hostiles
        ];
        
        // Mayor probabilidad de interacciones en tiers altos
        const interactionProbability = config.aggressionLevel; // Usar aggression como proxy de "actividad"
        
        if (Math.random() > interactionProbability) {
            return; // No interactuar esta vez
        }
        
        // Seleccionar tipo de interacción aleatoria
        const interactionType = pick(interactionTypes);
        
        let message = null;
        
        switch (interactionType) {
            case "environmental_comment":
                // Comentario sobre bioma, dimensión o clima
                const contextType = pick(["biome", "dimension", "weather"]);
                message = getEnvironmentalComment(player, tier, contextType);
                break;
                
            case "observation":
                // Comentario de observación general del objeto R
                if (R.observa && R.observa[tier]) {
                    message = pick(R.observa[tier]);
                }
                break;
                
            case "memory_reference":
                // Referencia a eventos pasados
                message = getMemoryReference(player, "general");
                break;
                
            case "hostile_mob_warning":
                // Advertencia sobre mobs cercanos
                message = getHostileMobComment(player, tier);
                break;
        }
        
        // Si se generó un mensaje, enviarlo al jugador
        if (message) {
            say(player, message, tier, 0);
            
            // Actualizar timestamp de última interacción
            player.setDynamicProperty(lastInteractionKey, currentTime);
        }
        
    } catch (error) {
        console.warn("Error al activar interacción automática por tier:", error);
    }
}

/**
 * Bucle principal de actualización de comportamientos por tier
 * Se ejecuta periódicamente para ajustar comportamientos de todos los Knockers activos
 * según el tier de sus jugadores objetivo
 * 
 * Implementa Requisitos: 8.7, 8.8, 8.9
 * Tarea: 9.4
 */
function updateAllKnockerBehaviors() {
    try {
        // Iterar sobre todos los jugadores
        for (const player of world.getAllPlayers()) {
            const bond = getBond(player);
            const tier = getTier(bond);
            
            // Buscar Knockers en la dimensión del jugador
            const knockers = player.dimension.getEntities({ type: "scary:knocker" });
            
            for (const knocker of knockers) {
                // Aplicar ajustes de comportamiento basados en tier
                applyTierBehaviorAdjustments(knocker, player, tier);
            }
            
            // Activar interacciones automáticas ocasionales basadas en tier
            // Esto hace que el Knocker "hable" o interactúe sin que el jugador use la Whisper
            triggerAutomaticInteraction(player, tier);
        }
        
    } catch (error) {
        console.warn("Error en bucle de actualización de comportamientos:", error);
    }
}

// Ejecutar actualización de comportamientos cada 10 segundos (200 ticks)
// Esto mantiene los comportamientos sincronizados con los cambios de tier
system.runInterval(() => {
    updateAllKnockerBehaviors();
}, 200);

// ────────────────────────────────────────────────────────────────────────────
//  ACTUALIZACIÓN DE MOVIMIENTO FURTIVO (Tarea 10.4)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Actualiza el movimiento furtivo de todos los Knockers activos
 * Se ejecuta con mayor frecuencia que el bucle principal para movimiento suave
 * MEJORADO (Tarea 10.4): Frecuencia optimizada para naturalidad
 * 
 * Implementa Requisitos: 6.5, 6.6
 * Tarea: 10.4
 */
function updateAllStealthyMovement() {
    try {
        // Iterar sobre todos los jugadores
        for (const player of world.getAllPlayers()) {
            // Buscar Knockers en la dimensión del jugador
            const knockers = player.dimension.getEntities({ type: "scary:knocker" });
            
            for (const knocker of knockers) {
                // Actualizar movimiento progresivo si hay una ruta activa
                updateKnockerStealthyMovement(knocker, player);
            }
        }
        
    } catch (error) {
        console.warn("Error en bucle de actualización de movimiento furtivo:", error);
    }
}

// MEJORADO (Tarea 10.4): Actualización más frecuente (cada segundo) para movimiento fluido
// Esto permite que el sistema responda más rápidamente a cambios adaptativos
// y cree la ilusión de movimiento continuo en lugar de saltos discretos
// Anterior: 30 ticks (1.5s) | Nuevo: 20 ticks (1s)
system.runInterval(() => {
    updateAllStealthyMovement();
}, 20);

/**
 * Obtiene una descripción legible del comportamiento actual según el tier
 * Útil para debugging y para mostrar al jugador información sobre el estado del Knocker
 * 
 * @param {number} tier - Tier del sistema de vínculo (0-3)
 * @returns {string} Descripción del comportamiento
 */
function getTierBehaviorDescription(tier) {
    const config = getTierBehaviorConfig(tier);
    return config.behaviorDescription;
}

// ────────────────────────────────────────────────────────────────────────────
//  COMANDO DE DEBUG PARA COMPORTAMIENTOS (OPCIONAL)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Comando de utilidad para inspeccionar configuración de comportamiento por tier
 * Uso: .tierstatus
 * Muestra información sobre el tier actual y configuración de comportamiento
 */
world.beforeEvents.chatSend.subscribe((event) => {
    const msg = event.message.trim();
    if (msg === ".tierstatus" || msg === ".tierinfo") {
        event.cancel = true;
        const player = event.sender;
        
        system.run(() => {
            const bond = getBond(player);
            const tier = getTier(bond);
            const config = getTierBehaviorConfig(tier);
            const color = bondColor(tier);
            
            player.sendMessage(`§8━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            player.sendMessage(`§8[ El Acechador - Estado de Tier ]`);
            player.sendMessage(`§8━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            player.sendMessage(`${color}Tier: ${tier} (Bond: ${bond}/500)`);
            player.sendMessage(`§7Descripción: §f${config.behaviorDescription}`);
            player.sendMessage(`§8━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            player.sendMessage(`§7Frecuencia de Aparición: §f${(config.spawnFrequency * 100).toFixed(0)}%`);
            player.sendMessage(`§7Distancia de Seguimiento: §f${config.followDistance} bloques`);
            player.sendMessage(`§7Nivel de Agresión: §f${(config.aggressionLevel * 100).toFixed(0)}%`);
            player.sendMessage(`§7Intensidad de Acecho: §f${(config.stalkingIntensity * 100).toFixed(0)}%`);
            player.sendMessage(`§7Velocidad de Acercamiento: §f${(config.approachSpeed * 100).toFixed(0)}%`);
            player.sendMessage(`§7Cooldown de Interacción: §f${config.interactionCooldown}s`);
            player.sendMessage(`§7Radio de Observación: §f${config.observationRadius} bloques`);
            player.sendMessage(`§8━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        });
    }
});

console.warn("§a[El Acechador] Sistema de ajuste de comportamientos por tier inicializado.");
