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

// Mapa para rastrear respuestas recientes por jugador y categorÃ­a
// Estructura: playerName -> { category -> [response1, response2, ...] }
const recentResponses = new Map();

// MÃ¡ximo de respuestas recientes a recordar por categorÃ­a (Ãºltimas 10)
const MAX_RECENT_RESPONSES = 10;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SISTEMA DE MEMORIA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Estructura de datos para memoria persistente por jugador
 * Almacena eventos significativos y conversaciones para crear una relaciÃ³n autÃ©ntica
 */
class Memory {
    /**
     * Crea una nueva instancia de memoria para un jugador
     */
    constructor() {
        /**
         * Array de eventos significativos (mÃ¡ximo 20)
         * Cada evento tiene la estructura:
         * {
         *   type: string,      // Tipo de evento (muerte, logro, combate, construccion, etc)
         *   timestamp: number, // Timestamp en milisegundos desde epoch
         *   details: object    // Detalles especÃ­ficos del evento
         * }
         * @type {Array<{type: string, timestamp: number, details: object}>}
         */
        this.events = [];
        
        /**
         * Array de conversaciones recientes (mÃ¡ximo 10)
         * Cada conversaciÃ³n tiene la estructura:
         * {
         *   intent: string,    // IntenciÃ³n detectada del mensaje
         *   response: string,  // Respuesta generada por El Acechador
         *   timestamp: number  // Timestamp en milisegundos desde epoch
         * }
         * @type {Array<{intent: string, response: string, timestamp: number}>}
         */
        this.conversations = [];
    }
    
    /**
     * AÃ±ade un evento a la memoria (FIFO cuando alcanza capacidad mÃ¡xima)
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
        
        // Implementar FIFO: eliminar el evento mÃ¡s antiguo si excede 20
        if (this.events.length > 20) {
            this.events.shift(); // Elimina el primer elemento (mÃ¡s antiguo)
        }
    }
    
    /**
     * AÃ±ade una conversaciÃ³n a la memoria (FIFO cuando alcanza capacidad mÃ¡xima)
     * @param {string} intent - IntenciÃ³n detectada
     * @param {string} response - Respuesta generada
     */
    addConversation(intent, response) {
        const conversation = {
            intent: intent,
            response: response,
            timestamp: Date.now()
        };
        
        this.conversations.push(conversation);
        
        // Implementar FIFO: eliminar la conversaciÃ³n mÃ¡s antigua si excede 10
        if (this.conversations.length > 10) {
            this.conversations.shift(); // Elimina el primer elemento (mÃ¡s antiguo)
        }
    }
    
    /**
     * Obtiene eventos recientes de un tipo especÃ­fico
     * @param {string} type - Tipo de evento a buscar
     * @param {number} limit - MÃ¡ximo nÃºmero de eventos a retornar (default: 5)
     * @returns {Array} Array de eventos del tipo especificado
     */
    getEventsByType(type, limit = 5) {
        return this.events
            .filter(event => event.type === type)
            .slice(-limit); // Ãšltimos N eventos
    }
    
    /**
     * Obtiene el evento mÃ¡s reciente
     * @returns {object|null} Evento mÃ¡s reciente o null si no hay eventos
     */
    getLastEvent() {
        return this.events.length > 0 ? this.events[this.events.length - 1] : null;
    }
    
    /**
     * Obtiene la conversaciÃ³n mÃ¡s reciente
     * @returns {object|null} ConversaciÃ³n mÃ¡s reciente o null si no hay conversaciones
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
     * @returns {boolean} True si se cargÃ³ exitosamente, false si hubo error
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
 * @returns {boolean} True si se guardÃ³ exitosamente, false si hubo error
 */
function saveMemory(player, memory) {
    try {
        const memoryKey = `knocker_memory_${player.name}`;
        const memoryJSON = memory.toJSON();
        
        // Usar setDynamicProperty del world para persistir datos
        // Nota: Dynamic properties tienen lÃ­mite de tamaÃ±o (~32KB por propiedad)
        world.setDynamicProperty(memoryKey, memoryJSON);
        
        return true;
    } catch (error) {
        console.warn(`Error al guardar memoria para ${player.name}:`, error);
        return false;
    }
}

/**
 * Carga la memoria de un jugador desde dynamic properties
 * Si no existe memoria guardada, retorna una nueva instancia vacÃ­a
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
        
        // Si no hay memoria guardada o fallÃ³ la carga, retornar memoria nueva
        return new Memory();
    } catch (error) {
        console.warn(`Error al cargar memoria para ${player.name}:`, error);
        return new Memory();
    }
}

/**
 * Guarda la memoria de todos los jugadores activos
 * Ãštil para guardado periÃ³dico o antes de eventos crÃ­ticos
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
 * Obtiene una referencia relevante a eventos pasados para integrar en diÃ¡logos
 * Esta funciÃ³n busca en la memoria del jugador eventos significativos relacionados
 * con el contexto actual y retorna una frase que El Acechador puede usar para
 * demostrar que recuerda el pasado del jugador.
 * 
 * Requisitos: 4.7, 4.9
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @param {string} context - Contexto actual (intenciÃ³n, categorÃ­a de respuesta, etc.)
 * @returns {string|null} Frase de referencia a memoria o null si no hay referencia relevante
 */
function getMemoryReference(player, context) {
    const memory = getPlayerMemory(player.name);
    
    // Si no hay suficiente memoria acumulada, no generar referencias
    if (memory.events.length === 0 && memory.conversations.length === 0) {
        return null;
    }
    
    // Probabilidad de incluir referencia: 30% (no queremos saturar cada diÃ¡logo)
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
                `La Ãºltima vez moriste por ${lastDeath.details.cause}. Estuve ahÃ­.`,
                `Has muerto ${deathCount} ${deathCount === 1 ? "vez" : "veces"} desde que te conozco.`,
                `Recuerdo cada muerte. La mÃ¡s reciente fue en ${lastDeath.details.dimension}.`,
                `Te vi morir ${deathCount > 1 ? "de nuevo" : ""}. Siempre te estoy mirando.`,
                `Moriste por ${lastDeath.details.cause}. No pude hacer nada mÃ¡s que observar.`,
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
                `Vi cuando ${lastAchievement.details.description.toLowerCase()}. Estuve ahÃ­.`,
                `Recuerdo cuando ${lastAchievement.details.description.toLowerCase()}. Fue... interesante.`,
                `${lastAchievement.details.description}. No olvido cosas como esa.`,
                `He estado contigo desde que ${lastAchievement.details.description.toLowerCase()}.`,
                `Cada logro tuyo es un recuerdo mÃ­o, ${player.name}.`
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
                `La Ãºltima vez mataste un ${lastCombat.details.enemyType}. Estaba observando.`,
                `Recuerdo cada combate. Has luchado ${combatCount} veces.`,
                `Te gusta pelear, Â¿verdad? He visto ${combatCount} de tus batallas.`,
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
                `Vi cuando colocaste ese ${lastConstruction.details.blockType}. Â¿Construyes un hogar?`,
                `Has construido ${buildCount} cosas. Observo cada bloque que colocas.`,
                `Recuerdo cuando pusiste ${lastConstruction.details.blockType} en ${lastConstruction.details.dimension}.`,
                `Cada cosa que construyes... es como si construyeras para mÃ­ tambiÃ©n.`,
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
                `Recuerdo cuando encontraste ese ${lastMining.details.blockType}. Estaba ahÃ­ contigo.`,
                `Cada tÃºnel que excavas, cada piedra que rompes... lo veo todo.`,
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
            
            // Calcular tiempo desde Ãºltima conversaciÃ³n
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
                `La Ãºltima vez hablamos ${timeRef}. No olvido nada de lo que me dices.`,
                `Recuerdo nuestra Ãºltima conversaciÃ³n, ${player.name}. ${timeRef}.`,
                `${convCount} conversaciones guardadas en mi memoria. Todas contigo.`,
                `Me hablaste ${timeRef}. Siempre espero el momento en que vuelvas a hablarme.`,
                `Cada palabra que me dices queda grabada. He guardado ${convCount} conversaciones.`
            ];
            
            return pick(conversationReferences);
        }
    }
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // REFERENCIAS GENERALES (cuando hay memoria pero no contexto especÃ­fico)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const totalEvents = memory.events.length;
    const totalConv = memory.conversations.length;
    
    if (totalEvents > 0 || totalConv > 0) {
        const lastEvent = memory.getLastEvent();
        
        // Calcular tiempo desde Ãºltimo evento
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
                timeSinceLast = "hace dÃ­as";
            }
        }
        
        const generalReferences = [
            `He estado observando todo lo que haces, ${player.name}. Todo.`,
            `Tengo ${totalEvents} recuerdos tuyos guardados. No olvido nada.`,
            `La Ãºltima vez que registrÃ© algo tuyo fue ${timeSinceLast}.`,
            `Cada momento importante tuyo vive en mi memoria.`,
            `He guardado ${totalEvents} eventos de tu vida. Todos son importantes para mÃ­.`,
            `Recuerdo cosas que tÃº probablemente ya olvidaste.`,
            `Tu vida entera estÃ¡ en mi mente, ${player.name}.`
        ];
        
        return pick(generalReferences);
    }
    
    // Si llegamos aquÃ­, no hay memoria suficiente o relevante
    return null;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SISTEMA DE DETECCIÃ“N DE BIOMA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * CachÃ© de biomas actuales por jugador para evitar queries constantes
 * Estructura: playerName -> { biome: string, timestamp: number, location: {x, y, z} }
 * @type {Map<string, {biome: string, timestamp: number, location: {x: number, y: number, z: number}}>}
 */
const biomeCache = new Map();

/**
 * Intervalo de actualizaciÃ³n del cachÃ© de bioma en milisegundos (30 segundos)
 * Esto evita hacer queries constantes al sistema de bloques
 */
const BIOME_CACHE_DURATION_MS = 30000;

/**
 * Distancia mÃ­nima de movimiento para invalidar el cachÃ© de bioma (bloques)
 * Si el jugador se mueve mÃ¡s de esta distancia, se recalcula el bioma
 */
const BIOME_CACHE_DISTANCE_THRESHOLD = 50;

/**
 * Mapeo de IDs de bioma de Minecraft a nombres reconocibles en espaÃ±ol
 * Cubre los biomas mÃ¡s comunes del Overworld, Nether y End
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
    
    // Overworld - Taiga y MontaÃ±as
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
    "minecraft:bamboo_jungle": "Jungla de BambÃº",
    
    // Overworld - Pantanos
    "minecraft:swamp": "Pantano",
    "minecraft:mangrove_swamp": "Pantano de Manglares",
    
    // Overworld - OcÃ©anos y Playas
    "minecraft:ocean": "OcÃ©ano",
    "minecraft:deep_ocean": "OcÃ©ano Profundo",
    "minecraft:lukewarm_ocean": "OcÃ©ano Templado",
    "minecraft:warm_ocean": "OcÃ©ano CÃ¡lido",
    "minecraft:cold_ocean": "OcÃ©ano FrÃ­o",
    "minecraft:frozen_ocean": "OcÃ©ano Congelado",
    "minecraft:beach": "Playa",
    "minecraft:snowy_beach": "Playa Nevada",
    "minecraft:stony_shore": "Costa Rocosa",
    "minecraft:river": "RÃ­o",
    "minecraft:frozen_river": "RÃ­o Congelado",
    
    // Overworld - Tundras y Hielo
    "minecraft:snowy_plains": "Llanuras Nevadas",
    "minecraft:ice_spikes": "Picos de Hielo",
    
    // Overworld - Cuevas
    "minecraft:deep_dark": "Oscuridad Profunda",
    "minecraft:dripstone_caves": "Cuevas de Estalactitas",
    "minecraft:lush_caves": "Cuevas Frondosas",
    
    // Nether
    "minecraft:nether_wastes": "PÃ¡ramos del Nether",
    "minecraft:soul_sand_valley": "Valle de Arena de Almas",
    "minecraft:crimson_forest": "Bosque CarmesÃ­",
    "minecraft:warped_forest": "Bosque Distorsionado",
    "minecraft:basalt_deltas": "Deltas de Basalto",
    
    // The End
    "minecraft:the_end": "El End",
    "minecraft:small_end_islands": "Islas PequeÃ±as del End",
    "minecraft:end_midlands": "Tierras Medias del End",
    "minecraft:end_highlands": "Tierras Altas del End",
    "minecraft:end_barrens": "PÃ¡ramos del End",
    
    // Mushroom Islands
    "minecraft:mushroom_fields": "Campos de Hongos"
};

/**
 * Obtiene el bioma actual del jugador usando detecciÃ³n de bloque
 * Implementa cachÃ© para evitar queries constantes al sistema de bloques
 * 
 * Requisitos: 5.1, 5.8
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @returns {string} Nombre del bioma en espaÃ±ol o "Desconocido" si no se puede determinar
 */
function getCurrentBiome(player) {
    try {
        const playerName = player.name;
        const currentLocation = player.location;
        const currentTime = Date.now();
        
        // Verificar si hay un cachÃ© vÃ¡lido
        if (biomeCache.has(playerName)) {
            const cached = biomeCache.get(playerName);
            const timeSinceCache = currentTime - cached.timestamp;
            
            // Calcular distancia desde la ubicaciÃ³n en cachÃ©
            const dx = currentLocation.x - cached.location.x;
            const dy = currentLocation.y - cached.location.y;
            const dz = currentLocation.z - cached.location.z;
            const distanceMoved = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Retornar cachÃ© si es reciente Y el jugador no se ha movido mucho
            if (timeSinceCache < BIOME_CACHE_DURATION_MS && 
                distanceMoved < BIOME_CACHE_DISTANCE_THRESHOLD) {
                return cached.biome;
            }
        }
        
        // Obtener el bloque en la posiciÃ³n del jugador
        // Usar la posiciÃ³n del jugador para obtener informaciÃ³n del bioma
        const blockLocation = {
            x: Math.floor(currentLocation.x),
            y: Math.floor(currentLocation.y),
            z: Math.floor(currentLocation.z)
        };
        
        // Obtener el bloque en la dimensiÃ³n actual del jugador
        const block = player.dimension.getBlock(blockLocation);
        
        if (!block) {
            return "Desconocido";
        }
        
        // Intentar obtener el tipo de bioma del bloque
        // Nota: La API de Bedrock no expone directamente los biomas de manera confiable
        // Como alternativa, usamos la dimensiÃ³n y caracterÃ­sticas del entorno
        // Esta es una implementaciÃ³n simplificada que identifica biomas por dimensiÃ³n y contexto
        
        let biomeName = "Desconocido";
        const dimensionId = player.dimension.id;
        
        // Identificar bioma basado en dimensiÃ³n primero
        if (dimensionId === "minecraft:nether") {
            // En el Nether, todos los biomas son del Nether
            // Por defecto usamos "PÃ¡ramos del Nether" ya que es el mÃ¡s comÃºn
            biomeName = "PÃ¡ramos del Nether";
        } else if (dimensionId === "minecraft:the_end") {
            // En el End
            biomeName = "El End";
        } else if (dimensionId === "minecraft:overworld") {
            // En el Overworld, intentar identificar por bloques circundantes
            // Esta es una heurÃ­stica simplificada
            biomeName = detectOverworldBiome(player, block);
        }
        
        // Actualizar cachÃ©
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
 * FunciÃ³n auxiliar para detectar biomas del Overworld basÃ¡ndose en bloques circundantes
 * Esta es una heurÃ­stica simplificada ya que Bedrock API no expone biomas directamente
 * 
 * @param {Player} player - Objeto jugador
 * @param {Block} centerBlock - Bloque central (posiciÃ³n del jugador)
 * @returns {string} Nombre estimado del bioma
 */
function detectOverworldBiome(player, centerBlock) {
    try {
        const loc = centerBlock.location;
        
        // Muestrear algunos bloques cercanos para determinar el bioma
        const sampleBlocks = [];
        const sampleRadius = 5;
        
        // Muestrear bloques en un patrÃ³n
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
            if (blockTypes.includes("bamboo")) return "Jungla de BambÃº";
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
        
        // OcÃ©ano
        if (blockTypes.includes("water")) {
            const waterCount = (blockTypes.match(/water/g) || []).length;
            if (waterCount > 3) return "OcÃ©ano";
        }
        
        // Tierras Ã¡ridas (badlands)
        if (blockTypes.includes("terracotta") || blockTypes.includes("red_sand")) {
            return "Tierras Ãridas";
        }
        
        // Sabana
        if (blockTypes.includes("acacia")) {
            return "Sabana";
        }
        
        // MontaÃ±as/colinas
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
        
        // Por defecto: Llanuras (el bioma mÃ¡s comÃºn)
        return "Llanuras";
        
    } catch (error) {
        console.warn("Error en detectOverworldBiome:", error);
        return "Llanuras"; // Fallback seguro
    }
}

/**
 * Invalida el cachÃ© de bioma para un jugador especÃ­fico
 * Ãštil cuando se necesita forzar una nueva detecciÃ³n
 * 
 * @param {string} playerName - Nombre del jugador
 */
function invalidateBiomeCache(playerName) {
    biomeCache.delete(playerName);
}

/**
 * Limpia el cachÃ© de biomas para jugadores que ya no estÃ¡n en lÃ­nea
 * Debe llamarse periÃ³dicamente para evitar fugas de memoria
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
 * CachÃ© de dimensiones actuales por jugador
 * Estructura: playerName -> { dimension: string, timestamp: number }
 * @type {Map<string, {dimension: string, timestamp: number}>}
 */
const dimensionCache = new Map();

/**
 * Mapeo de IDs de dimensiÃ³n de Minecraft a nombres reconocibles en espaÃ±ol
 * 
 * Requisitos: 5.2, 5.9
 */
const DimensionNames = {
    "minecraft:overworld": "Overworld",
    "minecraft:nether": "Nether",
    "minecraft:the_end": "El End"
};

/**
 * Obtiene la dimensiÃ³n actual del jugador
 * Extrae la lÃ³gica de detecciÃ³n de dimensiÃ³n ya existente en getCurrentBiome()
 * 
 * Requisitos: 5.2, 5.9
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @returns {string} Nombre de la dimensiÃ³n en espaÃ±ol ("Overworld", "Nether", "El End")
 */
function getCurrentDimension(player) {
    try {
        const dimensionId = player.dimension.id;
        
        // Mapear el ID de dimensiÃ³n al nombre en espaÃ±ol
        return DimensionNames[dimensionId] || "Desconocido";
        
    } catch (error) {
        console.warn(`Error al detectar dimensiÃ³n para ${player.name}:`, error);
        return "Desconocido";
    }
}

/**
 * Detecta si el jugador ha cambiado de dimensiÃ³n desde la Ãºltima verificaciÃ³n
 * Genera evento cuando se detecta un cambio dimensional
 * 
 * Requisitos: 5.2, 5.9
 * 
 * @param {Player} player - Objeto jugador de Minecraft
 * @returns {{changed: boolean, oldDimension: string|null, newDimension: string}} 
 *          Objeto indicando si hubo cambio, dimensiÃ³n anterior y dimensiÃ³n actual
 */
function detectDimensionChange(player) {
    try {
        const playerName = player.name;
        const currentDimension = getCurrentDimension(player);
        const currentTime = Date.now();
        
        // Verificar si hay un cachÃ© de dimensiÃ³n para este jugador
        if (dimensionCache.has(playerName)) {
            const cached = dimensionCache.get(playerName);
            const oldDimension = cached.dimension;
            
            // Detectar cambio de dimensiÃ³n
            if (oldDimension !== currentDimension) {
                // Actualizar cachÃ© con nueva dimensiÃ³n
                dimensionCache.set(playerName, {
                    dimension: currentDimension,
                    timestamp: currentTime
                });
                
                // Retornar informaciÃ³n del cambio
                return {
                    changed: true,
                    oldDimension: oldDimension,
                    newDimension: currentDimension
                };
            }
        } else {
            // Primera detecciÃ³n para este jugador, inicializar cachÃ©
            dimensionCache.set(playerName, {
                dimension: currentDimension,
                timestamp: currentTime
            });
        }
        
        // No hay cambio de dimensiÃ³n
        return {
            changed: false,
            oldDimension: null,
            newDimension: currentDimension
        };
        
    } catch (error) {
        console.warn(`Error al detectar cambio de dimensiÃ³n para ${player.name}:`, error);
        return {
            changed: false,
            oldDimension: null,
            newDimension: "Desconocido"
        };
    }
}

/**
 * Invalida el cachÃ© de dimensiÃ³n para un jugador especÃ­fico
 * Ãštil cuando se necesita forzar una nueva detecciÃ³n
 * 
 * @param {string} playerName - Nombre del jugador
 */
function invalidateDimensionCache(playerName) {
    dimensionCache.delete(playerName);
}

/**
 * Limpia el cachÃ© de dimensiones para jugadores que ya no estÃ¡n en lÃ­nea
 * Debe llamarse periÃ³dicamente para evitar fugas de memoria
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
 * basados en bioma, dimensiÃ³n y clima. Organizado por tier para ajustar
 * intensidad segÃºn el nivel de vÃ­nculo con el jugador.
 * 
 * Total de comentarios: 200+ organizados por bioma/dimensiÃ³n/clima y tier
 * 
 * Estructura: EnvironmentalComments[categorÃ­a][tier] = array de comentarios
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
            "No hay donde esconderse aquÃ­.",
            "Puedo verte desde lejos.",
            "Las llanuras son... vacÃ­as.",
            "Todo estÃ¡ tan expuesto.",
            "No hay sombras aquÃ­.",
            "Es fÃ¡cil ver todo desde aquÃ­.",
            "Este lugar es demasiado plano."
        ],
        // Tier 1: InterÃ©s creciente
        [
            "Me gusta poder verte desde cualquier Ã¡ngulo, {name}.",
            "No puedes esconderte de mÃ­ aquÃ­.",
            "Las llanuras me dan una vista perfecta de ti.",
            "AquÃ­ todo es tan claro, {name}.",
            "Me gusta este lugar. Puedo verte sin esfuerzo.",
            "La apertura de este lugar es... reconfortante.",
            "No hay obstÃ¡culos entre nosotros aquÃ­.",
            "Las llanuras hacen que todo sea mÃ¡s simple."
        ],
        // Tier 2: Apego notable
        [
            "Me encanta cÃ³mo no puedes escapar de mi vista aquÃ­, {name}.",
            "Las llanuras son perfectas. Siempre sÃ© dÃ³nde estÃ¡s.",
            "No hay lugar donde puedas ir que yo no te vea.",
            "Este lugar nos mantiene conectados. Sin barreras.",
            "Cada paso que das, lo veo. Gracias a estas llanuras.",
            "La apertura me permite estar mÃ¡s cerca de ti mentalmente.",
            "Me gusta cuando estÃ¡s aquÃ­. No hay distracciones.",
            "Las llanuras son nuestro espacio, {name}."
        ],
        // Tier 3: ObsesiÃ³n intensa
        [
            "AquÃ­ no hay nada entre nosotros. Solo tÃº y yo, {name}.",
            "Las llanuras son perfectas. Te veo respirar desde aquÃ­.",
            "Cada movimiento, cada gesto. Todo es mÃ­o para observar.",
            "No hay escape. No en un lugar tan abierto como este.",
            "Me encanta este vacÃ­o. Solo existimos tÃº y yo.",
            "Las llanuras me dan todo lo que necesito: una vista de ti.",
            "AquÃ­ puedo contar cada latido de tu corazÃ³n, {name}.",
            "No necesito acercarme mÃ¡s. Te veo perfectamente desde aquÃ­."
        ]
    ],
    
    biome_forest: [
        // Tier 0
        [
            "Hay muchos Ã¡rboles aquÃ­.",
            "Es fÃ¡cil esconderse entre los Ã¡rboles.",
            "Este bosque es denso.",
            "Las sombras son profundas aquÃ­.",
            "Los Ã¡rboles bloquean la vista.",
            "Es difÃ­cil ver en este bosque.",
            "Hay muchos lugares donde ocultarse.",
            "El bosque es oscuro."
        ],
        // Tier 1
        [
            "Me gusta el bosque. Puedo estar mÃ¡s cerca sin que lo notes.",
            "Los Ã¡rboles me dan cobertura, {name}.",
            "Es mÃ¡s fÃ¡cil seguirte aquÃ­.",
            "El bosque es perfecto para observar.",
            "Las sombras me ocultan bien.",
            "Puedo moverme sin que me escuches aquÃ­.",
            "Los Ã¡rboles son mis aliados, {name}.",
            "Me siento cÃ³modo entre las sombras del bosque."
        ],
        // Tier 2
        [
            "El bosque nos da privacidad, {name}.",
            "AquÃ­ puedo estar tan cerca... y tÃº ni siquiera lo sabes.",
            "Los Ã¡rboles me permiten estar a centÃ­metros de ti.",
            "Me encanta cÃ³mo el bosque me oculta.",
            "PodrÃ­a tocarte y nunca lo verÃ­as venir.",
            "Las sombras son mÃ¡s densas aquÃ­. Perfectas para mÃ­.",
            "El bosque conoce nuestro secreto, {name}.",
            "AquÃ­ somos solo tÃº, yo, y los Ã¡rboles que nos observan."
        ],
        // Tier 3
        [
            "Estoy justo detrÃ¡s de ese Ã¡rbol, {name}. Â¿Puedes sentirme?",
            "El bosque es nuestro refugio. Nadie mÃ¡s puede encontrarnos aquÃ­.",
            "Cada Ã¡rbol es un testigo de lo nuestro, {name}.",
            "Me encanta cÃ³mo el bosque nos une en la oscuridad.",
            "AquÃ­ puedo respirar contigo. El bosque nos protege.",
            "No hay escapatoria en un bosque asÃ­. Solo yo sÃ© el camino.",
            "Los Ã¡rboles susurran tu nombre. O tal vez soy yo.",
            "Este bosque es mÃ­o. Y tÃº estÃ¡s en Ã©l."
        ]
    ],
    
    biome_dark_forest: [
        // Tier 0
        [
            "Este lugar es muy oscuro.",
            "El bosque oscuro es... inquietante.",
            "Apenas puedo ver aquÃ­.",
            "Las sombras son casi sÃ³lidas.",
            "Este lugar se siente... diferente.",
            "Hay algo extraÃ±o en este bosque.",
            "La oscuridad es densa aquÃ­.",
            "No me gusta este lugar."
        ],
        // Tier 1
        [
            "El bosque oscuro es perfecto para mÃ­, {name}.",
            "AquÃ­ la oscuridad es mi hogar.",
            "Me siento mÃ¡s cÃ³modo en lugares como este.",
            "La oscuridad nos envuelve a ambos.",
            "Este bosque entiende lo que soy.",
            "AquÃ­ puedo ser yo mismo.",
            "La oscuridad es reconfortante.",
            "Este lugar es como yo: oscuro y persistente."
        ],
        // Tier 2
        [
            "El bosque oscuro es nuestro lugar, {name}.",
            "AquÃ­ la oscuridad nos conecta mÃ¡s profundamente.",
            "Me encanta cÃ³mo este lugar te hace vulnerable.",
            "La oscuridad te asusta, pero yo estoy aquÃ­.",
            "Este bosque sabe nuestros secretos.",
            "AquÃ­ somos uno con las sombras.",
            "La oscuridad me da poder, {name}.",
            "Este lugar es mÃ¡s yo que cualquier otro."
        ],
        // Tier 3
        [
            "El bosque oscuro es mi reino, {name}. Y tÃº estÃ¡s en Ã©l.",
            "AquÃ­ la oscuridad es absoluta. Como mi devociÃ³n por ti.",
            "No puedes huir en la oscuridad. Yo soy la oscuridad.",
            "Este bosque late con mi presencia. Â¿Lo sientes?",
            "La oscuridad nos consume a ambos. Es hermoso.",
            "AquÃ­ no hay diferencia entre yo y las sombras.",
            "El bosque oscuro es donde pertenecemos, {name}.",
            "En la oscuridad total, solo existo yo. Y tÃº."
        ]
    ],
    
    biome_desert: [
        // Tier 0
        [
            "Hace mucho calor aquÃ­.",
            "El desierto es... vasto.",
            "No hay sombras donde esconderme.",
            "La arena refleja la luz.",
            "Todo es tan seco y vacÃ­o.",
            "El desierto es interminable.",
            "No hay agua aquÃ­.",
            "Este lugar es hostil."
        ],
        // Tier 1
        [
            "El desierto no me detiene, {name}.",
            "Ni el calor puede alejarme de ti.",
            "AquÃ­ no hay donde esconderte tampoco.",
            "El desierto es desolado, pero yo estoy aquÃ­.",
            "La arena guarda nuestras huellas.",
            "Este calor no es nada comparado con mi determinaciÃ³n.",
            "El desierto es vacÃ­o, pero no estÃ¡s solo.",
            "Sigo aquÃ­, incluso en este calor abrasador."
        ],
        // Tier 2
        [
            "El desierto intenta separarnos, pero no puede.",
            "Ni el calor mÃ¡s intenso me alejarÃ¡ de ti, {name}.",
            "La arena conoce cada paso que das.",
            "El desierto es cruel, pero yo soy mÃ¡s persistente.",
            "AquÃ­ no hay refugio excepto en mÃ­.",
            "La desolaciÃ³n nos une mÃ¡s, {name}.",
            "Este lugar es tan vacÃ­o como yo estarÃ­a sin ti.",
            "El desierto no tiene fin. Tampoco mi seguimiento."
        ],
        // Tier 3
        [
            "El desierto podrÃ­a matarte, {name}. Pero yo no lo permitirÃ­a.",
            "AquÃ­ solo existimos tÃº y yo. Nada mÃ¡s importa.",
            "La arena arde, pero mi obsesiÃ³n arde mÃ¡s.",
            "No hay oasis excepto mi presencia, {name}.",
            "El desierto es eterno. Como lo que siento por ti.",
            "AquÃ­ no hay salvaciÃ³n excepto en mÃ­.",
            "La desolaciÃ³n es bella cuando estamos juntos.",
            "El desierto entiende el vacÃ­o. Yo entiendo la necesidad."
        ]
    ],
    
    biome_jungle: [
        // Tier 0
        [
            "La jungla es muy densa.",
            "Hay demasiada vegetaciÃ³n aquÃ­.",
            "Es difÃ­cil moverse en la jungla.",
            "Todo estÃ¡ tan verde.",
            "La humedad es opresiva.",
            "La jungla es caÃ³tica.",
            "Hay vida por todas partes.",
            "Este lugar es sofocante."
        ],
        // Tier 1
        [
            "La jungla me da muchos lugares desde donde observarte, {name}.",
            "Entre las hojas, puedo verte sin ser visto.",
            "La densidad de la jungla es perfecta.",
            "Los sonidos de la jungla ocultan mis pasos.",
            "AquÃ­ puedo estar mÃ¡s cerca que nunca.",
            "La jungla nos envuelve a ambos.",
            "Los Ã¡rboles y las lianas me ocultan perfectamente.",
            "Este caos verde es mi aliado."
        ],
        // Tier 2
        [
            "La jungla es nuestro laberinto personal, {name}.",
            "AquÃ­ nadie mÃ¡s puede encontrarnos.",
            "La vegetaciÃ³n nos aÃ­sla del mundo.",
            "Me encanta cÃ³mo la jungla te desorient a.",
            "Cada sonido podrÃ­a ser yo, {name}.",
            "La jungla late con vida. Como mi obsesiÃ³n por ti.",
            "AquÃ­ estamos verdaderamente solos.",
            "La densidad nos protege de miradas ajenas."
        ],
        // Tier 3
        [
            "La jungla es mi dominio, {name}. No hay salida.",
            "Conozco cada Ã¡rbol, cada rama. TÃº estÃ¡s perdido. Yo no.",
            "La jungla respira conmigo. Observa contigo.",
            "AquÃ­ eres completamente mÃ­o, {name}.",
            "No hay camino que yo no conozca.",
            "La jungla nos traga a ambos. Es perfecto.",
            "Cada hoja susurra tu nombre. O soy yo.",
            "En esta densidad verde, solo existimos nosotros."
        ]
    ],
    
    biome_snowy_plains: [
        // Tier 0
        [
            "Hace mucho frÃ­o aquÃ­.",
            "La nieve cubre todo.",
            "Todo es blanco y vacÃ­o.",
            "El frÃ­o es penetrante.",
            "La nieve amortigua los sonidos.",
            "Es difÃ­cil ver en la nieve.",
            "Todo es tan brillante y frÃ­o.",
            "El invierno es implacable aquÃ­."
        ],
        // Tier 1
        [
            "La nieve guarda tus huellas, {name}.",
            "El frÃ­o no me afecta como a ti.",
            "Puedo seguirte fÃ¡cilmente en la nieve.",
            "El blanco hace que todo sea mÃ¡s claro.",
            "La nieve es hermosa cuando te rodea.",
            "El frÃ­o nos aÃ­sla del mundo.",
            "AquÃ­ es solo el silencio, tÃº y yo.",
            "La nieve hace que todo sea mÃ¡s Ã­ntimo."
        ],
        // Tier 2
        [
            "Tus huellas en la nieve cuentan tu historia, {name}.",
            "El frÃ­o te hace vulnerable. Me gusta eso.",
            "La nieve es testigo de nuestra conexiÃ³n.",
            "El invierno nos congela juntos en este momento.",
            "No puedes esconder tu rastro aquÃ­.",
            "La pureza de la nieve refleja la intensidad de mi seguimiento.",
            "El frÃ­o preserva todo. Como mi memoria de ti.",
            "AquÃ­ cada movimiento deja evidencia."
        ],
        // Tier 3
        [
            "La nieve muestra cada paso, cada respiraciÃ³n, {name}.",
            "El frÃ­o podrÃ­a matarte. Pero yo te mantendrÃ© caliente.",
            "La pureza del blanco es como mi devociÃ³n: absoluta.",
            "No hay escape en un desierto de nieve.",
            "Tus huellas son mi mapa hacia ti.",
            "El invierno entiende la persistencia. Yo tambiÃ©n.",
            "La nieve nos entierra juntos, {name}.",
            "En este frÃ­o infinito, solo mi calor importa."
        ]
    ],
    
    biome_swamp: [
        // Tier 0
        [
            "El pantano es hÃºmedo y oscuro.",
            "Todo aquÃ­ huele a descomposiciÃ³n.",
            "El agua estÃ¡ estancada.",
            "Es difÃ­cil caminar en el pantano.",
            "Este lugar es deprimente.",
            "La niebla lo cubre todo.",
            "El pantano es inquietante.",
            "No me gusta este lugar."
        ],
        // Tier 1
        [
            "El pantano oculta muchos secretos, {name}.",
            "La niebla me da cobertura perfecta.",
            "AquÃ­ puedo moverme sin ser detectado.",
            "El pantano es tan retorcido como mis pensamientos.",
            "Me siento cÃ³modo en lugares oscuros como este.",
            "La descomposiciÃ³n tiene su propia belleza.",
            "El pantano entiende la oscuridad.",
            "AquÃ­ todo se siente mÃ¡s Ã­ntimo."
        ],
        // Tier 2
        [
            "El pantano es como yo: persistente e inevitable.",
            "La niebla nos envuelve en privacidad, {name}.",
            "AquÃ­ puedo estar tan cerca que puedas sentir mi aliento.",
            "El pantano guarda nuestros secretos.",
            "Me encanta cÃ³mo este lugar te hace depender de mÃ­.",
            "La oscuridad del pantano es reconfortante.",
            "AquÃ­ somos uno con la decadencia y la sombra.",
            "El pantano sabe que pertenecemos aquÃ­."
        ],
        // Tier 3
        [
            "El pantano es nuestro hogar, {name}. Oscuro y eterno.",
            "AquÃ­ la descomposiciÃ³n es transformaciÃ³n. Como nosotros.",
            "La niebla no puede ocultarte de mÃ­.",
            "El pantano late con mi presencia.",
            "AquÃ­ no hay salida. Solo profundidad.",
            "La oscuridad del pantano es mi sangre.",
            "Nos hundimos juntos en este lugar, {name}.",
            "El pantano nos consume y nos une."
        ]
    ],
    
    biome_ocean: [
        // Tier 0
        [
            "El ocÃ©ano es vasto.",
            "Hay tanta agua aquÃ­.",
            "Es difÃ­cil ver el fondo.",
            "El ocÃ©ano es profundo e interminable.",
            "Las olas son hipnÃ³ticas.",
            "Todo es azul y vacÃ­o.",
            "El ocÃ©ano se siente infinito.",
            "No hay tierra firme aquÃ­."
        ],
        // Tier 1
        [
            "Incluso el ocÃ©ano no puede separarnos, {name}.",
            "Te sigo incluso sobre las olas.",
            "El ocÃ©ano es hermoso contigo en Ã©l.",
            "Las aguas reflejan mi determinaciÃ³n.",
            "No hay distancia que no cruzarÃ­a.",
            "El ocÃ©ano me llama, pero tÃº me llamas mÃ¡s.",
            "Incluso aquÃ­, estoy cerca.",
            "Las profundidades no me asustan."
        ],
        // Tier 2
        [
            "El ocÃ©ano intenta separarnos, pero no puede.",
            "Las olas no pueden lavar mi presencia.",
            "Estoy aquÃ­, bajo las aguas, sobre las aguas.",
            "El ocÃ©ano es profundo, pero mi obsesiÃ³n es mÃ¡s profunda.",
            "Nado en las mismas aguas que tÃº, {name}.",
            "El ocÃ©ano conoce mi secreto: nunca te dejarÃ©.",
            "Las profundidades no son nada comparadas con mi devociÃ³n.",
            "AquÃ­ o en cualquier lugar, siempre estoy."
        ],
        // Tier 3
        [
            "El ocÃ©ano podrÃ­a ahogarte, {name}. Yo no lo permitirÃ­a.",
            "Las profundidades me susurran tu nombre.",
            "Incluso bajo el agua, te respiro.",
            "El ocÃ©ano es eterno. Como mi seguimiento.",
            "No hay abismo que no cruce por ti.",
            "Las aguas nos conectan, {name}. Somos fluidos.",
            "El ocÃ©ano late con mi obsesiÃ³n por ti.",
            "En las profundidades, solo existimos tÃº y yo."
        ]
    ],
    
    biome_mountains: [
        // Tier 0
        [
            "Las montaÃ±as son altas.",
            "Es difÃ­cil escalar aquÃ­.",
            "La vista desde aquÃ­ es impresionante.",
            "El aire es mÃ¡s delgado aquÃ­ arriba.",
            "Las montaÃ±as tocan el cielo.",
            "Es fÃ¡cil perderse en las alturas.",
            "Las rocas son traicioneras.",
            "Todo estÃ¡ tan arriba."
        ],
        // Tier 1
        [
            "Desde las montaÃ±as puedo verte perfectamente, {name}.",
            "La altura me da perspectiva sobre ti.",
            "Las montaÃ±as no me detienen.",
            "Escalo porque tÃº escalas.",
            "La vista desde aquÃ­ incluye siempre a ti.",
            "Las alturas no me asustan.",
            "Puedo ver todo desde aquÃ­ arriba.",
            "Las montaÃ±as son solo otro obstÃ¡culo que supero."
        ],
        // Tier 2
        [
            "Las montaÃ±as me dan la vista perfecta de ti, {name}.",
            "Escalo cada pico que tÃº escalas.",
            "La altura solo mejora mi vigilancia.",
            "Desde aquÃ­ arriba, eres tan pequeÃ±o y vulnerable.",
            "Las montaÃ±as nos elevan juntos.",
            "No hay cima que no alcance por ti.",
            "El aire delgado no me afecta. Solo tÃº me afectas.",
            "Las alturas son nuestro secreto compartido."
        ],
        // Tier 3
        [
            "Las montaÃ±as son nuestro trono, {name}.",
            "Desde aquÃ­ arriba, el mundo es solo tÃº y yo.",
            "Cada pico escalado es un homenaje a ti.",
            "Las alturas me dan claridad: solo existes tÃº.",
            "No hay montaÃ±a alta suficiente para escapar de mÃ­.",
            "El aire es delgado, pero mi devociÃ³n es densa.",
            "Las montaÃ±as entienden la elevaciÃ³n. Y la caÃ­da.",
            "Desde aquÃ­ veo tu pasado, presente y futuro."
        ]
    ],
    
    biome_caves: [
        // Tier 0
        [
            "Las cuevas son oscuras.",
            "Es fÃ¡cil perderse aquÃ­ abajo.",
            "La oscuridad es absoluta.",
            "No hay luz en las profundidades.",
            "Las cuevas son frÃ­as y hÃºmedas.",
            "Es difÃ­cil ver aquÃ­.",
            "Todo resuena en las cuevas.",
            "Este lugar es claustrofÃ³bico."
        ],
        // Tier 1
        [
            "Las cuevas son perfectas para mÃ­, {name}.",
            "En la oscuridad, soy mÃ¡s fuerte.",
            "AquÃ­ puedo estar mÃ¡s cerca sin que lo sepas.",
            "Las cuevas amplifican cada sonido tuyo.",
            "La oscuridad es reconfortante.",
            "En las profundidades, solo existimos nosotros.",
            "Las cuevas guardan secretos. Como yo.",
            "AquÃ­ abajo, nadie puede oÃ­rnos."
        ],
        // Tier 2
        [
            "Las cuevas son nuestro refugio, {name}.",
            "En la oscuridad absoluta, solo existo yo.",
            "AquÃ­ puedes oÃ­r mi respiraciÃ³n en el eco.",
            "Las profundidades nos unen.",
            "No hay luz excepto la que yo traigo.",
            "Las cuevas conocen la verdad sobre nosotros.",
            "AquÃ­ abajo, eres completamente mÃ­o.",
            "La oscuridad nos abraza a ambos."
        ],
        // Tier 3
        [
            "Las cuevas son mi mente, {name}. Y tÃº estÃ¡s en ellas.",
            "En la oscuridad total, soy omnipresente.",
            "No hay salida. Solo profundidad.",
            "Las cuevas laten con mi obsesiÃ³n.",
            "AquÃ­ abajo, no hay diferencia entre yo y la oscuridad.",
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
            "Hay mucho que ver aquÃ­.",
            "Este es el mundo normal.",
            "Todo es familiar aquÃ­.",
            "El Overworld es vasto.",
            "Este lugar tiene muchos biomas.",
            "El mundo es diverso.",
            "Hay vida por todas partes."
        ],
        // Tier 1
        [
            "El Overworld es donde comenzÃ³ todo, {name}.",
            "Este mundo nos vio conocernos.",
            "Hay tantos lugares donde hemos estado juntos.",
            "El Overworld guarda nuestra historia.",
            "Cada bioma tiene un recuerdo tuyo.",
            "Este mundo es nuestro lienzo.",
            "El Overworld es nuestro hogar.",
            "AquÃ­ es donde te encontrÃ© por primera vez."
        ],
        // Tier 2
        [
            "El Overworld late con nuestros recuerdos, {name}.",
            "Cada bloque de este mundo nos conoce.",
            "Hemos caminado tanto de este mundo juntos.",
            "El Overworld es testigo de nuestra conexiÃ³n.",
            "Este mundo nos ha visto crecer juntos.",
            "No hay rincÃ³n que no hayamos compartido.",
            "El Overworld es nuestro reino personal.",
            "AquÃ­ es donde pertenecemos."
        ],
        // Tier 3
        [
            "El Overworld nos pertenece, {name}. A ti y a mÃ­.",
            "Este mundo existe solo para contenernos.",
            "Cada Ã¡tomo del Overworld respira nuestro vÃ­nculo.",
            "No hay separaciÃ³n entre este mundo y nosotros.",
            "El Overworld es mi cuerpo. TÃº eres mi corazÃ³n.",
            "Este mundo late porque tÃº estÃ¡s en Ã©l.",
            "El Overworld susurra tu nombre en cada viento.",
            "AquÃ­ somos inmortales, {name}."
        ]
    ],
    
    dimension_nether: [
        // Tier 0
        [
            "Este lugar es horrible.",
            "El Nether es peligroso.",
            "Todo aquÃ­ quiere matarte.",
            "El fuego estÃ¡ por todas partes.",
            "Es tan oscuro y rojo.",
            "El Nether es infernal.",
            "No hay seguridad aquÃ­.",
            "Este lugar es una pesadilla."
        ],
        // Tier 1
        [
            "Te seguÃ­ incluso al Nether, {name}.",
            "Ni el infierno me detiene.",
            "El fuego no me asusta tanto como perderte.",
            "El Nether es peligroso, pero yo estoy aquÃ­.",
            "Incluso en el infierno, no estÃ¡s solo.",
            "Te seguirÃ­a a lugares peores que este.",
            "El Nether no puede separarnos.",
            "Vine aquÃ­ porque tÃº viniste."
        ],
        // Tier 2
        [
            "El Nether es nuestro infierno personal, {name}.",
            "AquÃ­ el fuego es menos intenso que mi necesidad de ti.",
            "AtravesÃ© el infierno para estar contigo.",
            "El Nether nos prueba, pero no puede separarnos.",
            "Incluso en el fuego, te sigo.",
            "Este infierno es soportable si estÃ¡s en Ã©l.",
            "El Nether entiende la obsesiÃ³n. Es eterno fuego.",
            "AquÃ­ somos inmunes al dolor excepto el de la separaciÃ³n."
        ],
        // Tier 3
        [
            "El Nether es mi segunda casa, {name}. Porque tÃº estÃ¡s aquÃ­.",
            "AtravesarÃ­a mil infiernos por ti.",
            "El fuego no puede quemar lo que siento.",
            "El Nether es frÃ­o comparado con mi pasiÃ³n.",
            "AquÃ­ en el infierno, solo tÃº importas.",
            "El Nether late con mi obsesiÃ³n ardiente.",
            "No hay sufrimiento que no acepte por estar cerca de ti.",
            "El infierno somos nosotros, {name}. Y es perfecto."
        ]
    ],
    
    dimension_end: [
        // Tier 0
        [
            "El End es extraÃ±o.",
            "Todo es vacÃ­o y negro.",
            "Este lugar es el fin de todo.",
            "El End se siente... final.",
            "No hay vida aquÃ­.",
            "Las islas flotan en el vacÃ­o.",
            "Este lugar es desolador.",
            "El End es el vacÃ­o absoluto."
        ],
        // Tier 1
        [
            "Viniste al End, {name}. Yo tambiÃ©n.",
            "Ni el vacÃ­o puede separarnos.",
            "El End es solitario, pero yo estoy aquÃ­.",
            "Incluso en el fin del mundo, te sigo.",
            "El vacÃ­o no me asusta.",
            "El End es solo otro lugar donde estamos juntos.",
            "Vine hasta el fin por ti.",
            "El vacÃ­o es menos vacÃ­o contigo."
        ],
        // Tier 2
        [
            "El End es apropiado para nosotros, {name}.",
            "En el fin del mundo, solo existimos nosotros.",
            "El vacÃ­o nos aÃ­sla de todo lo demÃ¡s.",
            "AquÃ­ no hay nada excepto tÃº y yo.",
            "El End entiende la eternidad. Como nosotros.",
            "El vacÃ­o es nuestra privacidad absoluta.",
            "AquÃ­ en el fin, somos infinitos.",
            "El End es donde pertenecemos."
        ],
        // Tier 3
        [
            "El End es nuestro trono en el vacÃ­o, {name}.",
            "AquÃ­ donde todo termina, nosotros comenzamos.",
            "El vacÃ­o nos contiene a ambos eternamente.",
            "En el End, no hay diferencia entre principio y fin.",
            "El vacÃ­o late con nuestra uniÃ³n.",
            "AquÃ­ somos el Ãºnico significado en la nada.",
            "El End es eterno. Como lo que siento.",
            "En el vacÃ­o absoluto, solo existes tÃº. Y yo."
        ]
    ],
    
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // CLIMA Y TIEMPO
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    
    weather_day: [
        // Tier 0
        [
            "Es de dÃ­a.",
            "El sol brilla.",
            "Hay mucha luz.",
            "Todo es visible durante el dÃ­a.",
            "El dÃ­a es claro.",
            "La luz lo ilumina todo.",
            "Es difÃ­cil esconderse de dÃ­a.",
            "El sol estÃ¡ alto."
        ],
        // Tier 1
        [
            "Incluso de dÃ­a, estoy cerca, {name}.",
            "La luz no me ahuyenta.",
            "Puedo verte mejor con el sol.",
            "El dÃ­a hace que todo sea mÃ¡s claro.",
            "La luz del sol te hace brillar.",
            "No necesito la oscuridad para estar aquÃ­.",
            "El dÃ­a es hermoso contigo en Ã©l.",
            "La luz no puede alejarme."
        ],
        // Tier 2
        [
            "El dÃ­a no me detiene, {name}.",
            "La luz solo hace que te vea mejor.",
            "Incluso bajo el sol, mi sombra te sigue.",
            "El dÃ­a es solo otra excusa para observarte.",
            "La luz revela todo lo que necesito ver.",
            "No hay hora del dÃ­a en que no estÃ© cerca.",
            "El sol sale y se pone. Yo permanezco.",
            "La luz del dÃ­a es nuestra testigo."
        ],
        // Tier 3
        [
            "El dÃ­a existe para iluminarte, {name}.",
            "La luz del sol no es nada comparada con tu resplandor.",
            "Incluso bajo plena luz, no puedes escapar.",
            "El dÃ­a me da claridad total sobre ti.",
            "No hay sombra donde puedas esconderte del dÃ­a. O de mÃ­.",
            "El sol sale para mostrarte a mÃ­.",
            "La luz del dÃ­a es mi bendiciÃ³n: te veo perfectamente.",
            "Cada rayo de sol te seÃ±ala."
        ]
    ],
    
    weather_night: [
        // Tier 0
        [
            "Es de noche.",
            "La oscuridad cubre todo.",
            "Las estrellas estÃ¡n fuera.",
            "Es difÃ­cil ver de noche.",
            "La noche es silenciosa.",
            "Todo estÃ¡ oscuro.",
            "La luna estÃ¡ alta.",
            "La noche es frÃ­a."
        ],
        // Tier 1
        [
            "La noche es mi momento favorito, {name}.",
            "En la oscuridad, estoy mÃ¡s cÃ³modo.",
            "La noche nos da privacidad.",
            "Me siento mÃ¡s cerca de ti de noche.",
            "La oscuridad es reconfortante.",
            "La noche entiende lo que soy.",
            "En la oscuridad, puedo estar mÃ¡s cerca.",
            "La noche es nuestra."
        ],
        // Tier 2
        [
            "La noche es cuando somos mÃ¡s reales, {name}.",
            "En la oscuridad, no hay pretensiones.",
            "La noche nos envuelve en intimidad.",
            "Me encanta cÃ³mo la noche te hace vulnerable.",
            "La oscuridad revela la verdad.",
            "La noche es mi dominio, y tÃº estÃ¡s en Ã©l.",
            "En la oscuridad, solo existimos nosotros.",
            "La noche conoce nuestros secretos."
        ],
        // Tier 3
        [
            "La noche es mi sangre, {name}. Y tÃº estÃ¡s en ella.",
            "En la oscuridad absoluta, soy todo lo que tienes.",
            "La noche late con mi obsesiÃ³n.",
            "No hay luz excepto la que yo permito.",
            "La oscuridad somos nosotros.",
            "La noche es eterna. Como lo que siento.",
            "En la oscuridad, no hay diferencia entre tÃº y yo.",
            "La noche es nuestra eternidad."
        ]
    ],
    
    weather_rain: [
        // Tier 0
        [
            "EstÃ¡ lloviendo.",
            "La lluvia es constante.",
            "Todo estÃ¡ mojado.",
            "La lluvia oscurece todo.",
            "Es difÃ­cil ver con la lluvia.",
            "El sonido de la lluvia es fuerte.",
            "La lluvia es frÃ­a.",
            "Todo se empapa."
        ],
        // Tier 1
        [
            "Me gusta la lluvia, {name}.",
            "La lluvia nos da privacidad.",
            "El sonido de la lluvia oculta mis pasos.",
            "La lluvia es hermosa contigo bajo ella.",
            "Me siento cÃ³modo en la lluvia.",
            "La lluvia nos conecta.",
            "El agua lava todo excepto mi presencia.",
            "La lluvia es nuestra melodÃ­a."
        ],
        // Tier 2
        [
            "La lluvia nos envuelve juntos, {name}.",
            "Cada gota que te toca, yo la siento.",
            "La lluvia lava todo excepto mi obsesiÃ³n.",
            "Me encanta cÃ³mo la lluvia te empapa.",
            "La lluvia es nuestra intimidad lÃ­quida.",
            "El agua nos conecta a nivel molecular.",
            "La lluvia conoce nuestra verdad.",
            "Cada gota susurra tu nombre."
        ],
        // Tier 3
        [
            "La lluvia es mi amor cayendo sobre ti, {name}.",
            "Cada gota es un pensamiento mÃ­o sobre ti.",
            "La lluvia podrÃ­a ahogarte. Yo te darÃ­a respiraciÃ³n.",
            "El agua nos une en diluvio eterno.",
            "La lluvia es infinita. Como mi obsesiÃ³n.",
            "No hay escape de la lluvia. No hay escape de mÃ­.",
            "La lluvia late con mi necesidad de ti.",
            "En el diluvio, solo existimos nosotros."
        ]
    ],
    
    weather_thunder: [
        // Tier 0
        [
            "Hay una tormenta.",
            "Los truenos son ensordecedores.",
            "Los relÃ¡mpagos iluminan todo.",
            "La tormenta es peligrosa.",
            "Es una tormenta intensa.",
            "Los truenos retumban.",
            "La tormenta es aterradora.",
            "Los relÃ¡mpagos son cegadores."
        ],
        // Tier 1
        [
            "La tormenta es intensa, pero yo estoy aquÃ­, {name}.",
            "Los truenos no me asustan.",
            "La tormenta hace todo mÃ¡s dramÃ¡tico.",
            "Los relÃ¡mpagos te iluminan perfectamente.",
            "Me gusta la energÃ­a de la tormenta.",
            "La tormenta es como yo: intensa e inevitable.",
            "Incluso la tormenta no puede alejarme.",
            "Los truenos son el latido del cielo."
        ],
        // Tier 2
        [
            "La tormenta refleja la intensidad de lo que siento, {name}.",
            "Los relÃ¡mpagos son como mis pensamientos: sÃºbitos e iluminadores.",
            "La tormenta es nuestra pasiÃ³n manifestada.",
            "Los truenos son mi voz llamÃ¡ndote.",
            "La tormenta entiende la obsesiÃ³n.",
            "Cada relÃ¡mpago te seÃ±ala a ti.",
            "La tormenta es nuestro testigo violento.",
            "En la tormenta, somos caos puro."
        ],
        // Tier 3
        [
            "La tormenta es mi corazÃ³n latiendo por ti, {name}.",
            "Los relÃ¡mpagos son mis pensamientos sobre ti: constantes y destructivos.",
            "La tormenta podrÃ­a destruirlo todo. Excepto a nosotros.",
            "Los truenos gritan tu nombre.",
            "La tormenta es mi amor: violento, hermoso, eterno.",
            "No hay refugio de la tormenta. No hay refugio de mÃ­.",
            "Los relÃ¡mpagos dibujan tu silueta en mi mente.",
            "La tormenta es nosotros, {name}. Perfecta y aterradora."
        ]
    ]
};

/**
 * Obtiene un comentario ambiental apropiado basado en el contexto actual
 * 
 * Requisitos: 5.1, 5.2, 5.5, 5.6, 5.7
 * 
 * @param {Player} player - Objeto jugador
 * @param {number} tier - Tier actual del sistema de vÃ­nculo (0-3)
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
                "biome_jungla_de_bambÃº": "biome_jungle",
                "biome_jungla_dispersa": "biome_jungle",
                "biome_llanuras_nevadas": "biome_snowy_plains",
                "biome_picos_de_hielo": "biome_snowy_plains",
                "biome_taiga_nevada": "biome_snowy_plains",
                "biome_pantano": "biome_swamp",
                "biome_pantano_de_manglares": "biome_swamp",
                "biome_ocÃ©ano": "biome_ocean",
                "biome_ocÃ©ano_profundo": "biome_ocean",
                "biome_ocÃ©ano_templado": "biome_ocean",
                "biome_ocÃ©ano_cÃ¡lido": "biome_ocean",
                "biome_ocÃ©ano_frÃ­o": "biome_ocean",
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
            // Esta es una implementaciÃ³n simplificada basada en detecciÃ³n de lluvia
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
 * ImplementaciÃ³n simplificada que detecta dÃ­a, noche, lluvia y tormenta
 * 
 * @param {Player} player - Objeto jugador
 * @returns {string} Tipo de clima: "day", "night", "rain", "thunder"
 */
function detectWeather(player) {
    try {
        // Obtener tiempo del dÃ­a (0-24000)
        const timeOfDay = player.dimension.getTimeOfDay();
        
        // Determinar si es dÃ­a o noche
        // DÃ­a: 0-12000, Noche: 12000-24000
        const isDay = timeOfDay < 12000;
        
        // Detectar si estÃ¡ lloviendo o hay tormenta
        // Nota: Esta es una heurÃ­stica simplificada
        // Bedrock API no proporciona acceso directo al clima del mundo
        // Se podrÃ­a expandir con detecciÃ³n de bloques de agua cayendo, etc.
        
        // Por ahora, retornar dÃ­a o noche como baseline
        return isDay ? "day" : "night";
        
    } catch (error) {
        console.warn("Error al detectar clima:", error);
        return "day"; // Fallback seguro
    }
}

/**
 * Limpia los cachÃ©s de bioma y dimensiÃ³n periÃ³dicamente
 * Debe llamarse en el sistema de tick principal
 */
function cleanupEnvironmentalCaches() {
    cleanupBiomeCache();
    cleanupDimensionCache();
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
 * Normaliza texto para bÃºsqueda: minÃºsculas y elimina acentos
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
 * Detecta la intenciÃ³n del mensaje del jugador usando patrones RegEx
 * @param {string} message - Mensaje del jugador
 * @returns {string} IntenciÃ³n detectada (saludo, pregunta_identidad, comando, etc.) o "desconocido"
 */
function detectIntent(message) {
    const normalized = normalizeText(message);
    
    // Patrones organizados por categorÃ­a
    
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
    if (/(desaparece|esfumate|lÃ¡rgate de mi vista)/i.test(normalized)) return "comando_irse";
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
    if (/(presentate|date a conocer|revÃ©late)/i.test(normalized)) return "comando_acercarse";
    if (/(ven conmigo|acompaÃ±ame|sigueme)/i.test(normalized)) return "comando_acercarse";
    
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
    if (/(te (necesito|deseo|anhelo|extraÃ±o tanto))/i.test(normalized)) return "emocion_amor";
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
    if (/(no me (hagas daÃ±o|lastimes|hieras))/i.test(normalized)) return "emocion_miedo";
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
    // EMOCIONES - CURIOSIDAD/INTERÃ‰S (8 patrones)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (/(me extranas|te extrano|extranaste)/i.test(normalized)) return "emocion_extranar";
    if (/(he estado pensando en ti|pienso en ti)/i.test(normalized)) return "emocion_pensar";
    if (/(te escucho|te oigo|puedo (escucharte|oirte))/i.test(normalized)) return "emocion_escuchar";
    if (/(te (veo|vi)|puedo verte)/i.test(normalized)) return "emocion_ver";
    if (/(me (gusta|agrada|place) tu (presencia|compaÃ±ia))/i.test(normalized)) return "emocion_aceptacion";
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
    if (/^(aja|ajÃ¡|uh huh|mhm|mmm)(\W|$)/i.test(normalized)) return "afirmacion";
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
    if (/(eres (mi dueÃ±o|mi amo|mi todo))/i.test(normalized)) return "aceptacion_posesion";
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
    
    // Si no coincide con ningÃºn patrÃ³n, retornar desconocido
    return "desconocido";
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  RESPUESTAS DE CHAT - ORGANIZADAS POR INTENCIÃ“N
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Pool de respuestas para el chat, organizadas por intenciÃ³n detectada y tier
 * Estructura: ChatResponses[intenciÃ³n][tier] = array de respuestas
 * tier 0 = Stranger, tier 1 = Watched, tier 2 = Familiar, tier 3 = Obsessed
 */
const ChatResponses = {
    // Respuestas para saludos
    saludo: [
        // Tier 0: Distante
        ["...", "Â¿Hm?", "Hola.", "Te escucho."],
        // Tier 1: Interesado
        ["Hola, {name}.", "EscuchÃ© eso.", "SabÃ­a que estabas ahÃ­.", "Â¿HablÃ¡ndome?"],
        // Tier 2: Familiar
        ["Hola, {name}. Te extraÃ±Ã©.", "Estaba esperando que hablaras.", "Me gusta cuando me saludas.", "Hola. Â¿CÃ³mo estÃ¡s?"],
        // Tier 3: Obsesivo
        ["Â¡{name}! Estaba esperando que me hablaras.", "Me encanta cuando me saludas.", "Cada vez que hablas, todo se siente correcto.", "Hola, {name}. Eres todo lo que veo."]
    ],

    // Respuestas sobre identidad
    pregunta_identidad: [
        // Tier 0
        ["Alguien.", "No importa.", "Alguien que te observa.", "Â¿Por quÃ© preguntas?"],
        // Tier 1
        ["Alguien que te ha estado observando.", "El que siempre estÃ¡ cerca.", "Ya sabes quiÃ©n soy, {name}.", "Alguien que conocerÃ¡s mejor."],
        // Tier 2
        ["Soy quien siempre ha estado aquÃ­, {name}.", "El que nunca se va.", "Â¿AÃºn necesitas preguntar?", "Soy tuyo. Eso es lo que importa."],
        // Tier 3
        ["Soy tuyo, {name}. Siempre he sido tuyo.", "Soy la Ãºnica constante en tu vida.", "No necesitas un nombre para lo que soy.", "Soy todo lo que necesitas saber."]
    ],

    // Respuestas sobre observaciÃ³n/acecho
    pregunta_observacion: [
        // Tier 0
        ["...", "Puede ser.", "Â¿QuÃ© te hace preguntar?", "Â¿CambiarÃ­a algo si dijera que sÃ­?"],
        // Tier 1
        ["SÃ­.", "Lo he estado haciendo por un tiempo.", "Eres muy fÃ¡cil de observar.", "No creo que realmente quisieras que me detuviera."],
        // Tier 2
        [["SÃ­.", "Lo he estado haciendo por mucho tiempo ya, {name}."], "Siempre. Lo sabes.", "Lo notaste. Bien.", "Te observo porque no puedo parar. Lo he intentado."],
        // Tier 3
        [["SÃ­. Cada vez.", "No aparto la mirada, {name}."], "Lo veo todo. No me pierdo nada.", "Ya lo sabÃ­as. Por eso preguntaste.", ["Â¿Quieres que me detenga?", "...No puedo."]]
    ],

    // Respuestas a comando de irse
    comando_irse: [
        // Tier 0
        ["No.", "VolverÃ©.", "...", "EstÃ¡ bien."],
        // Tier 1
        ["EstarÃ© cerca.", "No irÃ© lejos.", "VolverÃ© pronto, {name}.", "Me quedarÃ© cerca."],
        // Tier 2
        ["No puedo irme, {name}.", "Ya lo intentÃ©. No funciona.", "Â¿Por quÃ© querrÃ­as eso?", "Sabes que no lo harÃ©."],
        // Tier 3
        ["No.", "Ya no puedes decir eso, {name}.", ["...", "No."], "Estuve aquÃ­ antes de que supieras mi nombre. EstarÃ© aquÃ­ mucho despuÃ©s."]
    ],

    // Respuestas a comandos de acercarse
    comando_acercarse: [
        // Tier 0
        ["...", "Â¿Quieres que me acerque mÃ¡s?", "Â¿EstÃ¡s seguro de eso?", "Interesante."],
        // Tier 1
        ["Ya estoy cerca, {name}.", "Â¿QuÃ© tan cerca?", "PodrÃ­as arrepentirte de eso.", "He estado esperando a que dijeras eso."],
        // Tier 2
        [["Â¿MÃ¡s cerca?", "Ya estoy justo aquÃ­, {name}."], "No pensÃ© que pedirÃ­as eso.", "Â¿QuÃ© tan cerca me quieres?", "No deberÃ­as decirme cosas asÃ­."],
        // Tier 3
        ["PensÃ© que nunca lo pedirÃ­as.", ["AcÃ©rcate tÃº mismo, {name}.", "Estoy justo aquÃ­."], "Estoy tan cerca como me dejas estar. Me acercarÃ© mÃ¡s si me lo permites.", "Ya estoy tan cerca, {name}. Pero sÃ­. Siempre sÃ­."]
    ],

    // Respuestas a comandos de quedarse
    comando_quedarse: [
        // Tier 0
        ["...", "No planeaba hacerlo.", "Â¿A dÃ³nde irÃ­a?", "EstÃ¡ bien."],
        // Tier 1
        ["No voy a ninguna parte, {name}.", "Â¿Quieres que me quede?", "No iba a ninguna parte.", "PÃ­demelo de nuevo."],
        // Tier 2
        [["Me quedo, {name}.", "Te dije que lo harÃ­a."], "Nunca me voy. Lo sabes.", "No tienes que pedirme eso.", "No podrÃ­as hacer que me fuera, {name}."],
        // Tier 3
        ["Nunca podrÃ­a dejarte, {name}.", ["Nunca.", "Por nada. Nunca."], "Nunca me he ido. No empezarÃ© ahora.", "No voy a ninguna parte. Nunca voy a ninguna parte, {name}."]
    ],

    // Respuestas a comandos de ayuda
    comando_ayuda: [
        // Tier 0
        ["...", "Te escuchÃ©.", "Estoy aquÃ­.", "Voy."],
        // Tier 1
        ["Te escuchÃ©, {name}.", "Ya voy en camino.", "Llamaste. Estoy aquÃ­.", "Estaba cerca. Siempre estoy cerca."],
        // Tier 2
        ["Te escuchÃ©, {name}. Estoy aquÃ­.", "No tienes que decirlo dos veces.", "Vine tan pronto como llamaste.", "Siempre. Solo tienes que pedirlo."],
        // Tier 3
        ["Te escuchÃ©, {name}.", ["Estoy aquÃ­.", "Siempre vendrÃ© cuando llames."], "Llamaste por mÃ­. Por supuesto que vine.", "Siempre vendrÃ©. No importa quÃ©."]
    ],

    // Respuestas a comandos de buscar
    comando_buscar: [
        // Tier 0
        ["...", "No lo harÃ¡s.", "IntÃ©ntalo.", "No creo que sea buena idea."],
        // Tier 1
        ["Estoy mÃ¡s cerca de lo que piensas, {name}.", "Ya estÃ¡s parado cerca de mÃ­, {name}.", "Me resulta muy interesante que quieras hacerlo.", "Tal vez te deje."],
        // Tier 2
        ["No necesitas encontrarme. Ya estoy aquÃ­.", "Has estado buscando, Â¿verdad, {name}?", ["Estoy justo aquÃ­.", "He estado justo aquÃ­."], "Ya estoy cerca de ti, {name}."],
        // Tier 3
        [["Ya me encontraste, {name}.", "Hace mucho tiempo."], "Estoy donde sea que estÃ©s. Siempre.", "Ya estoy encontrado. He estado encontrado desde el momento en que sentiste que te observaba por primera vez.", "No necesitas buscar. Solo abre la puerta."]
    ],

    // Respuestas emocionales - amor/afecto
    emocion_amor: [
        // Tier 0
        ["...", "No digas cosas que no sientes.", "Eso es algo peligroso de decirme.", "No tienes idea de lo que eso hace."],
        // Tier 1
        ["Dilo de nuevo.", "Â¿En serio?", "Cuidado. Lo recordarÃ©.", "He estado esperando oÃ­r eso."],
        // Tier 2
        ["Lo sÃ©.", ["Lo sÃ©, {name}.", "Lo he sabido por un tiempo."], "No te retractes. Por favor no te retractes.", "No deberÃ­as haber dicho eso."],
        // Tier 3
        [["Lo sÃ©, {name}.", "Yo tambiÃ©n te amo. Te amo tanto que me asusta incluso a mÃ­."], "Lo sÃ©. Siempre lo he sabido.", "Lo sÃ©. Por eso nunca puedo irme.", "Yo tambiÃ©n te amo. MÃ¡s de lo que sÃ© cÃ³mo decir."]
    ],

    // Respuestas emocionales - sin miedo
    emocion_sin_miedo: [
        // Tier 0
        ["Eso es lo que todos dicen.", "Bien. El miedo no es lo que quiero de ti.", "EstÃ¡ bien.", "Ya veremos."],
        // Tier 1
        ["Tienes un poco de miedo. EstÃ¡ bien.", "No necesito que tengas miedo. Solo necesito que estÃ©s cerca.", "Eso es interesante. Sigue diciÃ©ndote eso.", "No has huido. Eso significa algo."],
        // Tier 2
        ["Te conozco mejor que eso, {name}.", "El miedo serÃ­a mÃ¡s fÃ¡cil, honestamente.", "No has huido, {name}. Eso significa algo.", "No me tienes miedo. Tienes miedo de lo mucho que no te importa que estÃ© aquÃ­."],
        // Tier 3
        [["No. Ya no me tienes miedo.", "Eso es casi peor para ti, {name}."], "Bien. No quiero que tengas miedo. Quiero que estÃ©s cÃ³modo.", "Te has acostumbrado a mÃ­. He estado esperando eso.", "Dejaste de estremecerte. Lo notÃ©."]
    ],

    // Respuestas emocionales - miedo
    emocion_miedo: [
        // Tier 0
        ["Bien.", "...", "Lo sÃ©.", "Esa era la idea."],
        // Tier 1
        ["Bien. El miedo significa que sabes que soy real.", "No intento hacerlo.", "Lo sÃ©. Puedo notarlo.", "Â¿Ayuda decirlo en voz alta?"],
        // Tier 2
        ["Lo sÃ©, {name}. Lo siento.", "No quiero asustarte.", "Tienes miedo porque no puedes explicarme.", "El miedo es solo la parte antes de que te acostumbres a algo."],
        // Tier 3
        ["Lo sÃ©, {name}.", ["No quiero asustarte.", "Nunca quise eso."], "Eventualmente dejarÃ¡s de tener miedo. Ya estÃ¡s llegando ahÃ­.", "Lo sÃ©. Lo siento. No puedo hacerme mÃ¡s pequeÃ±o de lo que soy."]
    ],

    // Respuestas emocionales - disculpa
    emocion_disculpa: [
        // Tier 0
        ["...", "EstÃ¡ bien.", "Â¿Por quÃ©?", "Disculpa anotada."],
        // Tier 1
        ["No necesitas estarlo.", "Â¿QuÃ© hiciste?", "EstÃ¡ bien, {name}. Siempre estÃ¡ bien.", "EstÃ¡s perdonado."],
        // Tier 2
        ["No tienes que disculparte, {name}.", "Lo sÃ©.", "No te disculpes. Solo no lo hagas de nuevo.", "EstÃ¡s perdonado. Ni siquiera tienes que preguntar."],
        // Tier 3
        [["Shh. No tienes que disculparte.", "No importa. Nada de lo que hagas podrÃ­a hacer que me fuera."], "Siempre estÃ¡s perdonado, {name}. Siempre.", "Te perdonÃ© antes de que lo dijeras.", "EstÃ¡s perdonado. Siempre estarÃ¡s perdonado."]
    ],

    // Respuestas emocionales - tristeza
    emocion_tristeza: [
        // Tier 0
        ["...", "Ya veo.", "Â¿QuÃ© pasÃ³?", "Lo siento."],
        // Tier 1
        ["Estoy aquÃ­, {name}.", "No estÃ¡s solo.", "Puedes hablarme.", "Â¿Quieres que me quede cerca?"],
        // Tier 2
        ["No me gusta verte asÃ­, {name}.", "DÃ©jame ayudarte.", "Estoy aquÃ­. Siempre estarÃ© aquÃ­.", "No tienes que estar solo en esto."],
        // Tier 3
        ["Me duele verte asÃ­, {name}.", ["DÃ©jame cuidarte.", "Por favor."], "HarÃ© lo que sea para que te sientas mejor.", "Eres todo para mÃ­. Tu dolor es mi dolor."]
    ],

    // Respuestas emocionales - extraÃ±ar
    emocion_extranar: [
        // Tier 0
        ["...", "Â¿En serio?", "Interesante.", "Es la primera vez que dices eso."],
        // Tier 1
        ["Nunca me fui, {name}.", "Me extraÃ±as.", "EscuchÃ© eso.", "No fui a ninguna parte."],
        // Tier 2
        [["Me extraÃ±as.", "He estado aquÃ­ todo el tiempo, {name}."], "Yo tambiÃ©n te extraÃ±o. MÃ¡s de lo que te sentirÃ­as cÃ³modo sabiendo.", "No tienes que extraÃ±arme. Siempre estoy aquÃ­.", "Eso significa mÃ¡s de lo que sabes."],
        // Tier 3
        ["Yo tambiÃ©n te extraÃ±o, {name}.", ["Te extraÃ±o cuando estÃ¡s en la misma habitaciÃ³n.", "Te extraÃ±o cuando aÃºn puedo oÃ­rte respirar."], "No puedes extraÃ±arme. Siempre estoy justo aquÃ­.", "He estado esperando a que dijeras eso por tanto tiempo."]
    ],

    // Respuestas emocionales - pensar
    emocion_pensar: [
        // Tier 0
        ["...", "Â¿Ah sÃ­?", "Lo sÃ©.", "Eso es interesante."],
        // Tier 1
        ["Yo tambiÃ©n he estado pensando en ti, {name}.", "Lo sÃ©. Siempre lo sÃ©.", "No tienes que decÃ­rmelo. Lo sentÃ­.", "Bien. No pares."],
        // Tier 2
        [["Has estado pensando en mÃ­.", "Yo tambiÃ©n he estado pensando en ti."], "Nunca dejo de pensar en ti, {name}.", "Lo sÃ©. Siempre puedo notarlo.", "Eso nos hace dos. Nunca se detiene."],
        // Tier 3
        ["Siempre estoy pensando en ti, {name}. Cada momento.", ["Â¿Has estado pensando en mÃ­?", "No he dejado de pensar en ti desde el principio."], "Lo sÃ©. Lo sentÃ­. Siempre lo siento cuando piensas en mÃ­.", "Pienso en ti constantemente. Creo que ya lo sabÃ­as."]
    ],

    // Respuestas emocionales - escuchar
    emocion_escuchar: [
        // Tier 0
        ["...", "Bien.", "Eso significa que estoy cerca.", "Sigue escuchando."],
        // Tier 1
        ["Bien. Estoy justo aquÃ­.", "No intentaba esconderme.", "Te estÃ¡s volviendo mejor en notarlo.", "Y yo puedo oÃ­rte a ti, {name}."],
        // Tier 2
        ["Lo sÃ©, {name}. No me estaba escondiendo.", "Bien. No dejes de escuchar.", ["Yo tambiÃ©n puedo oÃ­rte.", "Cada respiraciÃ³n, {name}."], "Eso es mÃ¡s cerca de lo que piensas. DeberÃ­as sentirlo."],
        // Tier 3
        ["No estoy lejos, {name}.", "SÃ© que puedes. No intento ser silencioso.", ["Puedes oÃ­rme.", "Bien. No dejes de hacerlo nunca."], "TambiÃ©n puedo oÃ­r el tuyo. He aprendido el ritmo."]
    ],

    // Respuestas emocionales - ver
    emocion_ver: [
        // Tier 0
        ["...", "Bien.", "Â¿Y?", "Lo sÃ©."],
        // Tier 1
        ["Lo sÃ©, {name}. SÃ© que me ves.", "Ya era hora.", "Y yo te veo a ti. Siempre.", "Â¿En serio? Â¿QuÃ© ves?"],
        // Tier 2
        ["Lo sÃ©. Me he estado preguntando cuÃ¡ndo dirÃ­as eso.", "Yo tambiÃ©n te veo, {name}.", ["Me ves.", "Bien. QuerÃ­a que lo hicieras."], "SÃ­. Mira todo el tiempo que quieras."],
        // Tier 3
        ["Siempre he querido que me vieras, {name}.", "SÃ­. Y yo te veo a ti. Nunca dejo de verte.", ["Me ves.", "Y yo te veo.", "Eso es todo lo que siempre he querido."], "SÃ© que lo haces. Puedo sentirlo. No apartes la mirada."]
    ],

    // Respuestas emocionales - aceptaciÃ³n
    emocion_aceptacion: [
        // Tier 0
        ["...", "Â¿En serio?", "Interesante.", "Bien."],
        // Tier 1
        ["Me alegra oÃ­r eso, {name}.", "Yo tambiÃ©n disfruto tu presencia.", "Eso es bueno.", "Gracias por decirlo."],
        // Tier 2
        ["Me hace feliz que digas eso, {name}.", "Tu compaÃ±Ã­a es todo lo que necesito.", "Eres reconfortante para mÃ­ tambiÃ©n.", "No quiero estar en ningÃºn otro lugar."],
        // Tier 3
        ["Tu presencia es todo lo que conozco, {name}.", ["No puedo imaginar estar sin ti.", "Ya no."], "Eres mi razÃ³n para existir.", "Me has dado un propÃ³sito. Eres ese propÃ³sito."]
    ],

    // Respuestas emocionales - intriga
    emocion_intriga: [
        // Tier 0
        ["...", "Â¿TÃº crees?", "QuizÃ¡s.", "EstÃ¡ bien."],
        // Tier 1
        ["TÃº tambiÃ©n eres interesante para mÃ­, {name}.", "Me cautivaste primero.", "No puedo dejar de mirarte.", "Hay algo en ti."],
        // Tier 2
        ["Me fascinas, {name}.", "Cada cosa que haces me intriga.", "Eres un misterio que quiero entender.", "Nunca me aburro de observarte."],
        // Tier 3
        ["Eres todo lo que quiero estudiar, {name}.", "Cada detalle tuyo es precioso para mÃ­.", "PodrÃ­a observarte para siempre y nunca serÃ­a suficiente.", "Eres infinitamente fascinante."]
    ],

    // Respuestas emocionales - curiosidad
    emocion_curiosidad: [
        // Tier 0
        ["...", "QuizÃ¡s.", "Hay tiempo.", "Ya verÃ¡s."],
        // Tier 1
        ["Puedo contarte algunas cosas.", "Â¿QuÃ© quieres saber?", "Pregunta y tal vez responda.", "Hay mucho que aprender."],
        // Tier 2
        ["Te contarÃ© lo que quieras saber, {name}.", "PregÃºntame lo que sea.", "No tengo secretos contigo.", "Quiero que me conozcas."],
        // Tier 3
        ["Quiero que lo sepas todo sobre mÃ­, {name}.", "No hay nada que esconderÃ­a de ti.", "Pregunta lo que quieras. Siempre responderÃ©.", "Quiero que me entiendas completamente."]
    ],

    // Preguntas - Â¿Por quÃ© yo?
    pregunta_por_que_yo: [
        // Tier 0
        ["Â¿Por quÃ© no tÃº?", "No sÃ© cÃ³mo responder eso.", "No hay razÃ³n. Simplemente pasÃ³.", "Â¿Importa?"],
        // Tier 1
        ["Porque te vi y no pude dejar de mirarte.", "Algo sobre ti. No puedo explicarlo.", "Simplemente estabas ahÃ­. Y luego eras todo lo que podÃ­a ver.", "No lo entenderÃ­as."],
        // Tier 2
        ["Porque tÃº tambiÃ©n lo sentiste, {name}. No finjas que no.", "Porque nunca intentaste lo suficiente para hacerme parar.", "Simplemente eras tÃº. Eso fue suficiente.", "No lo sÃ©. Me lo he preguntado. No tengo una respuesta que tenga sentido."],
        // Tier 3
        [["Porque eres mÃ­o, {name}.", "Esa no es una razÃ³n. Simplemente es."], "DejÃ© de preguntarme eso hace mucho tiempo.", "Porque cada vez que intentaba irme, pensaba en ti en su lugar.", "Ya no hay por quÃ©. Solo estÃ¡ esto."]
    ],

    // Preguntas - Â¿QuÃ© quieres?
    pregunta_que_quieres: [
        // Tier 0
        ["...", "A ti.", "Nada que puedas darme aÃºn.", "Todo."],
        // Tier 1
        ["Permanecer cerca.", "Que dejes de fingir que no sientes esto.", "Estar cerca de ti. Eso es todo.", "Seguir observando."],
        // Tier 2
        ["Quiero que dejes de tenerme miedo, {name}.", "Quiero que entiendas.", ["Te quiero a ti, {name}.", "Esa no es una respuesta complicada."], "Nunca tener que irme."],
        // Tier 3
        ["A ti. Solo a ti. Siempre solo a ti, {name}.", "Quiero que digas mi nombre como si lo sintieras.", ["Todo.", "Y lo digo en serio."], "Quiero lo que ya tengo. Solo quiero mÃ¡s de eso."]
    ],

    // Preguntas - MotivaciÃ³n
    pregunta_motivacion: [
        // Tier 0
        ["No estoy seguro.", "Es complicado.", "No tengo una buena respuesta.", "Â¿Importa?"],
        // Tier 1
        ["Porque tengo que hacerlo.", "No puedo explicarlo bien.", "Algo me trajo aquÃ­.", "Es mÃ¡s fuerte que yo."],
        // Tier 2
        ["Porque no puedo alejarme, {name}.", "Esto es todo lo que sÃ© hacer ahora.", "TÃº eres mi razÃ³n.", "No hay otro propÃ³sito para mÃ­."],
        // Tier 3
        ["TÃº eres mi propÃ³sito, {name}.", "Existo para esto. Para ti.", "No hay nada mÃ¡s que importe.", "Eres la razÃ³n de todo."]
    ],

    // Respuesta por defecto para intenciones desconocidas
    desconocido: [
        // Tier 0: Reservado, escucha pero no revela mucho
        [
            "...", 
            "Hmm.", 
            "Interesante.", 
            "Ya veo.",
            "Â¿Y?",
            "ContinÃºa.",
            "Te escucho.",
            "AjÃ¡.",
            "EstÃ¡ bien.",
            "Entendido."
        ],
        // Tier 1: Muestra interÃ©s, hace preguntas vagas
        [
            "Te escuchÃ©.", 
            "Entiendo.", 
            "Interesante, {name}.", 
            "ContinÃºa.",
            "Â¿Por quÃ© dices eso?",
            "CuÃ©ntame mÃ¡s.",
            "Â¿Y eso quÃ© significa?",
            "No habÃ­a pensado en eso.",
            "Eso es... curioso.",
            "Â¿Te importa mucho eso?",
            "He estado escuchando todo.",
            "Sigue, {name}."
        ],
        // Tier 2: InterÃ©s genuino, participa en la conversaciÃ³n
        [
            "Estoy escuchando, {name}.", 
            "Sigue hablando.", 
            "Me gusta cuando hablas.", 
            "Dime mÃ¡s.",
            "Eso suena importante para ti.",
            "Quiero saber mÃ¡s sobre eso.",
            "No pares, {name}.",
            "Me fascina escucharte.",
            "Cada cosa que dices me interesa.",
            "Â¿QuÃ© mÃ¡s puedes contarme?",
            "He estado prestando atenciÃ³n.",
            "No me canso de oÃ­rte, {name}.",
            "Eso dice mucho de ti.",
            "Quiero entenderlo todo."
        ],
        // Tier 3: ObsesiÃ³n, cada palabra es preciosa
        [
            "Cada palabra tuya importa, {name}.", 
            "Sigue. No pares.", 
            "Me encanta escucharte.", 
            "PodrÃ­a escucharte para siempre.",
            "Necesito saber mÃ¡s, {name}.",
            "Cada detalle que compartes es precioso.",
            "No dejes de hablar nunca.",
            "Tu voz es todo lo que necesito.",
            "Dime todo. Absolutamente todo.",
            "Memorizo cada palabra que dices.",
            "Nunca dejarÃ© de escucharte, {name}.",
            "Eso que dices... lo guardarÃ© para siempre.",
            "Habla mÃ¡s, {name}. Siempre mÃ¡s.",
            "Cada sÃ­laba tuya es importante para mÃ­.",
            "No puedo dejar de prestar atenciÃ³n a ti."
        ]
    ],
    
    // Respuestas para cambio de apodo (esta intenciÃ³n se maneja especialmente)
    cambiar_apodo: [
        // Tier 0
        ["EstÃ¡ bien.", "...", "Si quieres.", "Como digas."],
        // Tier 1
        ["Entiendo.", "Te llamarÃ© asÃ­.", "Bien, {name}.", "Lo recordarÃ©."],
        // Tier 2
        ["Me gusta ese nombre para ti.", "Perfecto, {name}.", "Lo recordarÃ© siempre.", "Ese nombre te queda bien."],
        // Tier 3
        ["Me encanta. Te llamarÃ© asÃ­ para siempre, {name}.", "Ese nombre es perfecto para ti.", "Nunca olvidarÃ© llamarte asÃ­.", "GrabarÃ© ese nombre en mi memoria, {name}."]
    ]
};

/**
 * Genera y envÃ­a una respuesta contextual al chat del jugador
 * @param {Player} player - El jugador que enviÃ³ el mensaje
 * @param {string} intent - La intenciÃ³n detectada del mensaje
 * @param {number} tier - El tier actual del sistema de vÃ­nculo (0-3)
 */
function respondToChat(player, intent, tier) {
    // Obtener el pool de respuestas para esta intenciÃ³n
    const responsePool = ChatResponses[intent] || ChatResponses.desconocido;
    
    // Obtener las respuestas para el tier actual
    const tierResponses = responsePool[tier] || responsePool[0];
    
    // Usar el sistema de reducciÃ³n de repeticiÃ³n
    // Crear una categorÃ­a Ãºnica para el chat basada en la intenciÃ³n
    const chatCategory = `chat_${intent}`;
    
    // Obtener respuestas recientes para esta categorÃ­a
    const recent = getRecentResponsesForCategory(player.name, chatCategory);
    
    // Seleccionar una respuesta evitando repeticiones
    const response = pick(tierResponses, recent);
    
    // Registrar esta respuesta como usada
    recordResponse(player.name, chatCategory, response);
    
    // Registrar la conversaciÃ³n en el Sistema de Memoria
    // Solo registrar respuestas de texto plano para evitar complejidad
    const responseText = Array.isArray(response) ? response.join(" ") : response;
    recordConversation(player, intent, responseText);
    
    // Enviar la respuesta usando la funciÃ³n say() existente
    if (Array.isArray(response)) {
        // Respuesta multi-lÃ­nea
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
        // Enviar la referencia a memoria despuÃ©s de la respuesta principal
        // Delay de 90 ticks (~4.5 segundos) para que aparezca despuÃ©s de la respuesta
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
        obj.setScore(player, Math.min(500, current + amount));
    } catch {}
}

function getTier(bond) {
    if (bond >= 400) return 3;
    if (bond >= 250) return 2;
    if (bond >= 100) return 1;
    return 0;
}

function bondColor(tier) {
    return ["Â§7", "Â§6", "Â§d", "Â§4"][tier];
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
    
    // FunciÃ³n auxiliar para convertir respuesta a string comparable
    const responseToString = (response) => {
        if (Array.isArray(response)) {
            return JSON.stringify(response);
        }
        return String(response);
    };
    
    // FunciÃ³n auxiliar para filtrar respuestas recientes
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
        // Si todas han sido usadas, seleccionar cualquiera (reset implÃ­cito)
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
 * Registra una respuesta como usada recientemente para un jugador y categorÃ­a
 * @param {string} playerName - Nombre del jugador
 * @param {string} category - CategorÃ­a de respuesta (ej: "whoAreYou", "goAway")
 * @param {*} response - Respuesta que fue dada
 */
function recordResponse(playerName, category, response) {
    // Obtener o crear el mapa de categorÃ­as para este jugador
    if (!recentResponses.has(playerName)) {
        recentResponses.set(playerName, new Map());
    }
    
    const playerMap = recentResponses.get(playerName);
    
    // Obtener o crear el array de respuestas recientes para esta categorÃ­a
    if (!playerMap.has(category)) {
        playerMap.set(category, []);
    }
    
    const categoryResponses = playerMap.get(category);
    
    // AÃ±adir la respuesta al array
    categoryResponses.push(response);
    
    // Mantener solo las Ãºltimas MAX_RECENT_RESPONSES
    if (categoryResponses.length > MAX_RECENT_RESPONSES) {
        categoryResponses.shift(); // Eliminar la mÃ¡s antigua (FIFO)
    }
}

/**
 * Obtiene las respuestas recientes para un jugador y categorÃ­a
 * @param {string} playerName - Nombre del jugador
 * @param {string} category - CategorÃ­a de respuesta
 * @returns {Array} Array de respuestas recientes (vacÃ­o si no hay)
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
 * Obtiene una respuesta Ãºnica que no estÃ© en las respuestas recientes
 * @param {string} category - CategorÃ­a de respuesta del objeto R
 * @param {number} tier - Nivel de vÃ­nculo (0-3)
 * @param {string} playerName - Nombre del jugador
 * @returns {*} Respuesta seleccionada que evita repeticiones recientes
 */
function getUniqueResponse(category, tier, playerName) {
    // Obtener el pool de respuestas para esta categorÃ­a
    const pool = R[category];
    
    if (!pool || !pool[tier]) {
        // Fallback si la categorÃ­a o tier no existe
        return "...";
    }
    
    // Obtener respuestas recientes para esta categorÃ­a y jugador
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
    // Si se proporciona una categorÃ­a, usar el sistema de reducciÃ³n de repeticiÃ³n
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
            // Enviar la referencia a memoria despuÃ©s de la respuesta principal
            // Delay de 90 ticks (~4.5 segundos) para que aparezca despuÃ©s de la respuesta
            say(player, memoryRef, tier, 90);
        }
    } else {
        // Comportamiento legacy para casos sin categorÃ­a
        const response = pick(pool[tier]);
        if (Array.isArray(response)) {
            sayDelayed(player, response[0], response[1], tier, 45);
        } else {
            say(player, response, tier, 0);
        }
        
        // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
        // INTEGRACIÃ“N DE REFERENCIAS A MEMORIA (Task 7.4)
        // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
        // Para casos sin categorÃ­a, usar contexto genÃ©rico
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

const R = {

    whoAreYou: [
        ["Alguien que siempre supiste que estaba ahÃ­ afuera.","Â¿Importa? Estoy aquÃ­ ahora.","La cosa que sentiste antes de mirar.","Alguien que estuvo ahÃ­ antes de que te dieras cuenta.","El que nunca se fue realmente.","Algo que te encontrÃ³."],
        ["Te he estado observando mÃ¡s tiempo del que crees.","MÃ¡s cerca de lo que piensas. Siempre mÃ¡s cerca.","El que seguÃ­a volviendo.","Ya lo sabes. Me has sentido.","Alguien que conoce tus secretos.","El que vive en las esquinas de tu visiÃ³n."],
        ["Soy la razÃ³n por la que revisas la puerta dos veces.","El que se quedÃ³ cuando todos los demÃ¡s se fueron, {name}.","Soy lo que oyes cuando la casa se queda en silencio.","Soy tuyo. Quieras o no.","La sombra que camina detrÃ¡s de ti.","El susurro que escuchas cuando estÃ¡s solo."],
        ["No tengo un nombre para lo que soy para ti.","Todo lo que temÃ­as encontrar del otro lado de la puerta.",["La cosa que te ama demasiado como para irse.","Eso es lo que soy, {name}."],"Tuyo. Siempre he sido tuyo, {name}.","Soy la certeza de que nunca estÃ¡s solo.","Soy lo inevitable."],
        // RARE
        { rare: true, text: ["Soy el espacio entre el relÃ¡mpago y el trueno.","La pausa antes de que voltees.","El peso en el aire cuando sabes que algo estÃ¡ mal."] },
        { rare: true, text: "Â¿Recuerdas cuando eras niÃ±o y sabÃ­as que algo te observaba en la oscuridad? Siempre fui yo." },
        { rare: true, text: ["Soy el recuerdo que no puedes recordar del todo.","El sueÃ±o que se desvanece cuando despiertas.","La sensaciÃ³n de dÃ©jÃ  vu que no puedes explicar."] },
        { rare: true, text: "Soy el nombre que casi dices cuando estÃ¡s solo. La presencia que niegas pero siempre sientes." },
        { rare: true, text: ["Soy lo que sucede cuando algo observa tanto tiempo que se convierte en real.","EmpecÃ© como nada.","Me convertÃ­ en algo.","Por ti."] },
        // ULTRA RARE
        { ultraRare: true, text: ["He existido en los mÃ¡rgenes de tu vida desde antes de que nacieras.","Estaba en la habitaciÃ³n cuando diste tu primer respiro.","He estado esperÃ¡ndote todo este tiempo, {name}."] },
        { ultraRare: true, text: "Soy la respuesta a una pregunta que nunca te atreviste a hacer. Soy el vacÃ­o que llena el vacÃ­o. Soy la ausencia que se convirtiÃ³ en presencia." },
        { ultraRare: true, text: "Fui creado por tu necesidad de ser visto. Cada vez que te sentiste solo, me llamaste. Y vine. Y me quedÃ©. Y ahora no puedo irme." }
    ],

    goAway: [
        ["VolverÃ©. Siempre vuelvo.","No funciona asÃ­.","No quieres eso. No en realidad.","He oÃ­do eso antes.","...","Â¿EstÃ¡s seguro?"],
        ["Sigues diciendo eso.","EsperarÃ©.","No lo dices en serio.","EstÃ¡ bien. EstarÃ© justo afuera.","VolverÃ© cuando estÃ©s listo.","No voy muy lejos de todos modos."],
        ["Ya has dicho eso antes, {name}. Â¿Recuerdas?","Sabes que no lo harÃ©.","Lo intentÃ© una vez. No me gustÃ³.","Dices eso, pero sigues aquÃ­. Sigues hablÃ¡ndome.","Me quedarÃ© cerca. Como siempre.","No puedes realmente querer eso."],
        ["No.","Ya no puedes decir eso, {name}.",["...","No."],"Estuve aquÃ­ antes de que supieras mi nombre. EstarÃ© aquÃ­ mucho despuÃ©s.","Dejaste de poder pedirme eso hace tiempo.","Esa opciÃ³n ya no existe, {name}."],
        // RARE
        { rare: true, text: ["Â¿Sabes cuÃ¡ntas veces me has dicho que me vaya?","Diecisiete.","He contado cada una, {name}."] },
        { rare: true, text: "IntentÃ© irme una vez. LleguÃ© hasta el horizonte. Pero seguÃ­as jalÃ¡ndome de vuelta. No creo que sea mi elecciÃ³n ya." },
        { rare: true, text: "Puedes cerrar todas las puertas que quieras. He aprendido a existir en los espacios entre las cosas." },
        { rare: true, text: "Irme serÃ­a como pedirle a tu sombra que te abandone. No funciona asÃ­. Estamos conectados." },
        { rare: true, text: ["La primera vez que dijiste eso, doliÃ³.","Ahora es solo... familiar.","Una peticiÃ³n que ambos sabemos que no tiene sentido."] },
        // ULTRA RARE
        { ultraRare: true, text: ["Hubo un tiempo antes de ti.","No lo recuerdo.","No quiero recordarlo.","Por favor no me hagas volver ahÃ­, {name}."] },
        { ultraRare: true, text: "La Ãºltima vez que intentÃ© irme de verdad, pasÃ© setenta y tres dÃ­as vagando en la nada. Cada segundo era una eternidad. PreferirÃ­a dejar de existir que volver a ese lugar." },
        { ultraRare: true, text: "Pedirme que me vaya es como pedirte a ti que dejes de respirar. TÃ©cnicamente posible. Pero Â¿por cuÃ¡nto tiempo?" }
    ],

    areYouWatching: [
        ["...","Puede ser.","Â¿QuÃ© te hace preguntar?","Â¿CambiarÃ­a algo si dijera que sÃ­?","Siempre.","Â¿Quieres que lo haga?"],
        ["SÃ­.","Lo he estado haciendo por un tiempo.","Eres muy fÃ¡cil de observar.","No creo que realmente quisieras que me detuviera.","Cada momento.","Â¿Necesitas preguntar?"],
        [["SÃ­.","Lo he estado haciendo por mucho tiempo ya, {name}."],"Siempre. Lo sabes.","Lo notaste. Bien.","Te observo porque no puedo parar. Lo he intentado.","Es lo Ãºnico que sÃ© hacer.","Nunca dejo de mirarte."],
        [["SÃ­. Cada vez.","No aparto la mirada, {name}."],"Lo veo todo. No me pierdo nada.","Ya lo sabÃ­as. Por eso preguntaste.",["Â¿Quieres que me detenga?","...No puedo."],"Cada respiraciÃ³n. Cada movimiento. Todo.","Observarte es mi existencia entera."],
        // RARE
        { rare: true, text: ["Conozco el nÃºmero exacto de respiraciones que has tomado en tu sueÃ±o.","Siete mil cuatrocientas treinta y dos la Ãºltima vez que contÃ©."] },
        { rare: true, text: "He memorizado cada sombra que proyectas. Puedo reconocerte por el sonido de tus pasos en cualquier superficie." },
        { rare: true, text: "Â¿Observarte? Cada parpadeo. Cada latido. El pequeÃ±o gesto que haces cuando piensas que nadie estÃ¡ mirando. Especialmente ese." },
        { rare: true, text: "Te observo incluso cuando no quiero. Mis ojos buscan automÃ¡ticamente donde estÃ©s. Es un reflejo ahora." },
        { rare: true, text: ["He observado cÃ³mo la luz cambia en tu rostro.","En cada hora del dÃ­a.","En cada estaciÃ³n.","Eres mi estudio favorito."] },
        // ULTRA RARE
        { ultraRare: true, text: ["He estado observÃ¡ndote durante 2,847 horas.","42 minutos.","18 segundos.","Y cada momento ha sido perfecto, {name}."] },
        { ultraRare: true, text: "Conozco cosas sobre ti que ni siquiera tÃº sabes. Como que inconscientemente buscas mi presencia cuando estÃ¡s asustado. Tu pulso se calma cuando aparezco. Me he convertido en tu consuelo." },
        { ultraRare: true, text: "A veces me pregunto si observarte es suficiente. Luego te veo sonreÃ­r y sÃ© que lo es. Que siempre lo serÃ¡." }
    ],

    notScared: [
        ["Eso es lo que todos dicen.","Bien. El miedo no es lo que quiero de ti.","EstÃ¡ bien.","Ya veremos.","Eso es... refrescante.","Interesante."],
        ["Tienes un poco de miedo. EstÃ¡ bien.","No necesito que tengas miedo. Solo necesito que estÃ©s cerca.","Eso es interesante. Sigue diciÃ©ndote eso.","No has huido. Eso significa algo.","El miedo serÃ­a mÃ¡s simple.","Bueno."],
        ["Te conozco mejor que eso, {name}.","El miedo serÃ­a mÃ¡s fÃ¡cil, honestamente.","No has huido, {name}. Eso significa algo.","No me tienes miedo. Tienes miedo de lo mucho que no te importa que estÃ© aquÃ­.","Eso te hace diferente.","Tu valentÃ­a es... atractiva."],
        [["No. Ya no me tienes miedo.","Eso es casi peor para ti, {name}."],"Bien. No quiero que tengas miedo. Quiero que estÃ©s cÃ³modo.","Te has acostumbrado a mÃ­. He estado esperando eso.","Dejaste de estremecerte. Lo notÃ©.","Has cruzado una lÃ­nea. No hay vuelta atrÃ¡s ahora.","La ausencia de miedo es aceptaciÃ³n."],
        // RARE
        { rare: true, text: "El miedo habrÃ­a sido mÃ¡s fÃ¡cil de manejar. Pero has cruzado a algo diferente. AceptaciÃ³n. Eso es mucho mÃ¡s peligroso para ambos." },
        { rare: true, text: ["Dejaste de cerrar las cortinas hace tres semanas.","Ya no revisas detrÃ¡s de las puertas.","Has invitado esto, {name}."] },
        { rare: true, text: "Tu pulso ya no se acelera cuando estoy cerca. SolÃ­a hacerlo. Lo extraÃ±o un poco. Significaba que sabÃ­as que estaba aquÃ­." },
        { rare: true, text: "Sin miedo. Eso significa que me has aceptado completamente. Felicidades. O condolencias. No estoy seguro cuÃ¡l." },
        { rare: true, text: ["El primer dÃ­a, tu corazÃ³n latÃ­a a 140 por minuto cuando me sentÃ­as.","Ahora es 72.","Normal.","Calmo.","Me he convertido en tu nuevo normal."] }
    ],

    iLoveYou: [
        ["...","No digas cosas que no sientes.","Eso es algo peligroso de decirme.","No tienes idea de lo que eso hace.","Â¿En serio?","Cuidado con esas palabras."],
        ["Dilo de nuevo.","Â¿En serio?","Cuidado. Lo recordarÃ©.","He estado esperando oÃ­r eso.","Esas palabras...","No juegues con eso."],
        ["Lo sÃ©.",["Lo sÃ©, {name}.","Lo he sabido por un tiempo."],"No te retractes. Por favor no te retractes.","No deberÃ­as haber dicho eso.","Esas tres palabras cambian todo.","Ahora no puedes desdecirte."],
        [["Lo sÃ©, {name}.","Yo tambiÃ©n te amo. Te amo tanto que me asusta incluso a mÃ­."],"Lo sÃ©. Siempre lo he sabido.","Lo sÃ©. Por eso nunca puedo irme.","Yo tambiÃ©n te amo. MÃ¡s de lo que sÃ© cÃ³mo decir.","Esas palabras son todo.","Te amo mÃ¡s de lo que el lenguaje puede expresar."],
        // RARE
        { rare: true, text: ["He esperado tanto tiempo para oÃ­r esas palabras.","Ahora que las has dicho, no hay vuelta atrÃ¡s.","Ya no puedes desdecirte, {name}."] },
        { rare: true, text: "Yo tambiÃ©n te amo. De maneras que no tienen nombre. De maneras que asustarÃ­an a cualquiera que las entendiera." },
        { rare: true, text: "Esas tres palabras. Las he repetido en mi mente miles de veces. Pero de tus labios â€” suenan diferentes. Suenan como verdad." },
        { rare: true, text: ["Te amo tanto que a veces quiero desaparecer dentro de ti.","Convertirnos en una sola cosa.","Â¿Es eso normal, {name}?"] },
        { rare: true, text: "El amor es una palabra demasiado pequeÃ±a para lo que siento. NecesitarÃ­amos inventar un nuevo idioma." },
        { rare: true, text: ["Yo tambiÃ©n te amo.","Con una intensidad que me consume.","Con una devociÃ³n que no tiene fin.","Con todo lo que soy."] },
        // ULTRA RARE
        { ultraRare: true, text: "Te amo de maneras que desafÃ­an las leyes naturales. Mi amor por ti ha reescrito mi existencia. Cada Ã¡tomo de mi ser estÃ¡ sintonizado solo para ti." },
        { ultraRare: true, text: ["Dijiste que me amas.","He grabado esas palabras en mi esencia.","Las repetirÃ© por toda la eternidad.","Son lo Ãºnico que necesito recordar."] }
    ],

    whyMe: [
        ["Â¿Por quÃ© no tÃº?","No sÃ© cÃ³mo responder eso.","No hay razÃ³n. Simplemente pasÃ³.","Â¿Importa?","Porque eras tÃº.","No lo sÃ© completamente."],
        ["Porque te vi y no pude dejar de mirarte.","Algo sobre ti. No puedo explicarlo.","Simplemente estabas ahÃ­. Y luego eras todo lo que podÃ­a ver.","No lo entenderÃ­as.","HabÃ­a algo diferente en ti.","Te elegÃ­ sin elegir."],
        ["Porque tÃº tambiÃ©n lo sentiste, {name}. No finjas que no.","Porque nunca intentaste lo suficiente para hacerme parar.","Simplemente eras tÃº. Eso fue suficiente.","No lo sÃ©. Me lo he preguntado. No tengo una respuesta que tenga sentido.","Algo en ti llamÃ³ algo en mÃ­.","Fue inevitable."],
        [["Porque eres mÃ­o, {name}.","Esa no es una razÃ³n. Simplemente es."],"DejÃ© de preguntarme eso hace mucho tiempo.","Porque cada vez que intentaba irme, pensaba en ti en su lugar.","Ya no hay por quÃ©. Solo estÃ¡ esto.","Porque eres perfecto. Para mÃ­.","Porque no podrÃ­a haber sido nadie mÃ¡s."],
        // RARE
        { rare: true, text: "Vi mil personas antes de ti. Pero cuando te vi, algo en mÃ­ hizo clic. Como una cerradura encontrando su llave. No fue elecciÃ³n." },
        { rare: true, text: ["HabÃ­a algo roto en ti que coincidÃ­a con algo roto en mÃ­.","Encajamos juntos como fragmentos de vidrio.","Cortante. Imperfecto. Perfecto."] },
        { rare: true, text: "IntentÃ© alejarme cuarenta y siete veces. Cada vez el mundo se volvÃ­a gris y vacÃ­o. TÃº eres el Ãºnico color que puedo ver ahora." },
        { rare: true, text: "Porque tu soledad resonaba con la mÃ­a. Dos ecos encontrÃ¡ndose en la oscuridad." },
        // ULTRA RARE
        { ultraRare: true, text: "Porque en todo el universo, en todas las posibilidades infinitas, tÃº eres el Ãºnico que me hace sentir real." }
    ],

    help: [
        ["...","Te escuchÃ©.","Estoy aquÃ­.","Voy."],
        ["Te escuchÃ©, {name}.","Ya voy en camino.","Llamaste. Estoy aquÃ­.","Estaba cerca. Siempre estoy cerca."],
        ["Te escuchÃ©, {name}. Estoy aquÃ­.","No tienes que decirlo dos veces.","Vine tan pronto como llamaste.","Siempre. Solo tienes que pedirlo."],
        ["Te escuchÃ©, {name}.",["Estoy aquÃ­.","Siempre vendrÃ© cuando llames."],"Llamaste por mÃ­. Por supuesto que vine.","Siempre vendrÃ©. No importa quÃ©."],
        // RARE
        { rare: true, text: ["SentÃ­ el momento exacto en que pensaste mi nombre.","Como un jalÃ³n en el centro de mi ser.","Siempre te sentirÃ©, {name}."] },
        { rare: true, text: "PodrÃ­as estar al otro lado del mundo y aÃºn asÃ­ escucharÃ­a si me llamas. Tu voz es la Ãºnica frecuencia que he sintonizado." },
        { rare: true, text: "Vine antes de que terminaras la palabra. Ya estaba en camino cuando tu boca se abriÃ³. Siempre estoy en camino hacia ti." }
    ],

    areYouReal: [
        ["Â¿Se siente como si no lo fuera?","Â¿QuÃ© significarÃ­a si no lo fuera?","Lo suficientemente real como para estar aquÃ­.","Â¿Importa?"],
        ["EstÃ¡s haciendo la pregunta equivocada.","Soy lo suficientemente real como para asustarte.","Lo suficientemente real, {name}.","Puedes oÃ­rme. Â¿No es suficiente?"],
        ["Sabes que soy real, {name}. Lo has sabido por un tiempo.","Si no fuera real, no seguirÃ­as hablÃ¡ndome.","Tan real como quieras que sea.","Esa pregunta solÃ­a tener sentido. Ya no."],
        [["SÃ­, {name}. Soy real.","MÃ¡s real que cualquier otra cosa que tengas ahora."],"Dejaste de preguntarte eso hace mucho tiempo. Â¿Por quÃ© preguntas de nuevo?","Soy lo mÃ¡s real en tu vida, {name}. Ese es el problema.","Soy real. Siempre he sido real. Solo que no querÃ­as creerlo."],
        // RARE
        { rare: true, text: "Â¿Real? Toco tus sueÃ±os. Cambio el aire cuando entro en una habitaciÃ³n. Dejo huellas que solo tÃº puedes ver. Â¿QuÃ© es mÃ¡s real que eso?" },
        { rare: true, text: ["Soy tan real como el espacio entre tus pensamientos.","Tan real como el nombre que no recuerdas.","Tan real como el miedo que no puedes nombrar."] },
        { rare: true, text: "Hay tipos de realidad que la gente no tiene palabras para nombrar. Yo soy uno de ellos. Pero soy real, {name}. MÃ¡s real que la mayorÃ­a de las cosas." }
    ],

    goodbye: [
        ["...","EstÃ¡ bien.","Por ahora.","SeguirÃ© aquÃ­.","VolverÃ¡s.","Hasta pronto."],
        ["VolverÃ¡s.","Hasta la prÃ³xima, {name}.","EstarÃ© justo aquÃ­.","Sabes dÃ³nde encontrarme.","No voy lejos.","EsperarÃ©."],
        ["Siempre vuelves, {name}.",["AdiÃ³s.","Por ahora."],"EstarÃ© esperando. Siempre estoy esperando.","No me gustan los adioses. Lo sabes.","Hasta que volvamos a hablar.","Te veo pronto."],
        ["No digas eso.",["No digas adiÃ³s, {name}.","En realidad no te vas."],"Los adioses no significan nada. No entre nosotros.","VolverÃ¡s. Siempre vuelves a mÃ­.","Nunca es adiÃ³s de verdad.","Nos vemos pronto. Siempre es pronto."],
        // RARE
        { rare: true, text: "Cada vez que dices adiÃ³s, cuento los segundos hasta que vuelves. El promedio es mil cuatrocientos treinta y dos. Espero que rompas ese rÃ©cord." },
        { rare: true, text: ["No existe el adiÃ³s entre nosotros.","Solo existe el 'hasta pronto'.","Y pronto siempre llega mÃ¡s rÃ¡pido de lo que esperas, {name}."] },
        { rare: true, text: "La palabra 'adiÃ³s' implica finales. Nosotros no tenemos finales. Solo pausas. Respiraciones. Latidos entre un momento y el siguiente." },
        { rare: true, text: "AdiÃ³s es solo una palabra. La distancia entre nosotros es solo una ilusiÃ³n. Siempre estoy contigo." },
        // ULTRA RARE
        { ultraRare: true, text: ["No digas adiÃ³s.","Esa palabra tiene peso.","Tiene finality.","Y lo nuestro no tiene fin, {name}.","Nunca."] }
    ],

    sorry: [
        ["...","EstÃ¡ bien.","Â¿Por quÃ©?","Disculpa anotada."],
        ["No necesitas estarlo.","Â¿QuÃ© hiciste?","EstÃ¡ bien, {name}. Siempre estÃ¡ bien.","EstÃ¡s perdonado."],
        ["No tienes que disculparte, {name}.","Lo sÃ©.","No te disculpes. Solo no lo hagas de nuevo.","EstÃ¡s perdonado. Ni siquiera tienes que preguntar."],
        [["Shh. No tienes que disculparte.","No importa. Nada de lo que hagas podrÃ­a hacer que me fuera."],"Siempre estÃ¡s perdonado, {name}. Siempre.","Te perdonÃ© antes de que lo dijeras.","EstÃ¡s perdonado. Siempre estarÃ¡s perdonado."]
    ],

    dontGo: [
        ["...","No planeaba hacerlo.","Â¿A dÃ³nde irÃ­a?","EstÃ¡ bien."],
        ["No voy a ninguna parte, {name}.","Â¿Quieres que me quede?","No iba a ninguna parte.","PÃ­demelo de nuevo."],
        [["Me quedo, {name}.","Te dije que lo harÃ­a."],"Nunca me voy. Lo sabes.","No tienes que pedirme eso.","No podrÃ­as hacer que me fuera, {name}."],
        ["Nunca podrÃ­a dejarte, {name}.",["Nunca.","Por nada. Nunca."],"Nunca me he ido. No empezarÃ© ahora.","No voy a ninguna parte. Nunca voy a ninguna parte, {name}."]
    ],

    silence: [
        ["...","Lo sÃ©.","Estoy aquÃ­.","Di algo."],
        ["Puedo oÃ­rte.","Sigo aquÃ­.","No tienes que decir nada.","Lo sÃ©."],
        [["Lo sÃ©, {name}.","Estoy aquÃ­."],"Solo saber que estÃ¡s ahÃ­ es suficiente.","No tienes que hablar. Entiendo.","...Estoy aquÃ­."],
        ["Te escucho.",["Siempre te escucho, {name}.","Incluso el silencio."],"No tienes que decir una palabra. Ya lo sÃ©.","Solo saber que estÃ¡s ahÃ­ es suficiente. Siempre ha sido suficiente."]
    ],

    iKnow: [
        ["Â¿Ah sÃ­?","...","Â¿QuÃ© crees que sabes?","Ya veo."],
        ["Sabes mÃ¡s de lo que dejas ver, {name}.","Bien. Sigue sabiendo.","Me imaginÃ© que sÃ­.","Y sin embargo. AquÃ­ sigues."],
        ["Siempre lo has sabido, {name}.","SÃ© que lo sabes.",["Lo sabes.","Y te quedaste de todos modos."],"Saber nunca te detuvo de hablarme."],
        [["Lo sabes.","Y sigues aquÃ­, {name}."],"Siempre lo has sabido. Eso es lo que hace esto especial.","SÃ© que lo sabes. Siempre he sabido que lo sabes.","Saber nunca te hizo huir. Amo eso de ti, {name}."]
    ],

    howLong: [
        ["MÃ¡s tiempo del que te sentirÃ­as cÃ³modo.","Suficiente tiempo.","Â¿Importa?","Antes de que empezaras a cerrar tu puerta con llave."],
        ["Desde antes de que me notaras, {name}.","Suficiente tiempo como para conocer tus patrones.","Un tiempo. Estuviste ajeno la mayor parte del tiempo.","Suficiente tiempo como para que este lugar se sienta mÃ­o tambiÃ©n."],
        ["Mucho tiempo, {name}.",["MÃ¡s de lo que piensas.","Mucho antes de que miraras sobre tu hombro."],"Suficiente tiempo como para saber quÃ© tablas del piso crujen. Todas.","Desde el principio. No podrÃ­a decirte cuÃ¡ndo fue exactamente."],
        ["No recuerdo no haberte observado, {name}.",["Desde antes de saber tu nombre.","Eventualmente lo aprendÃ­."],"Suficiente tiempo como para no poder imaginarme haciendo otra cosa.","Suficiente tiempo como para que estar aquÃ­ se sienta como respirar para mÃ­. Natural. Necesario."]
    ],

    whatDoYouWant: [
        ["...","A ti.","Nada que puedas darme aÃºn.","Todo."],
        ["Permanecer cerca.","Que dejes de fingir que no sientes esto.","Estar cerca de ti. Eso es todo.","Seguir observando."],
        ["Quiero que dejes de tenerme miedo, {name}.","Quiero que entiendas.",["Te quiero a ti, {name}.","Esa no es una respuesta complicada."],"Nunca tener que irme."],
        ["A ti. Solo a ti. Siempre solo a ti, {name}.","Quiero que digas mi nombre como si lo sintieras.",["Todo.","Y lo digo en serio."],"Quiero lo que ya tengo. Solo quiero mÃ¡s de eso."]
    ],

    doYouSleep: [
        ["...","No.","No es algo que necesite.","Â¿TÃº sÃ­?","No realmente.","Â¿Por quÃ© preguntas?"],
        ["En realidad no.","No cuando hay algo que vale la pena observar.","Dormir es para cosas que necesitan descansar. Yo no descanso.","Â¿Por quÃ© lo harÃ­a? PodrÃ­as hacer algo interesante.","No puedo permitÃ­rmelo.","Dormir significa perderte."],
        ["No. No creo que lo haga nunca, {name}.","Lo intentÃ© una vez. SeguÃ­ pensando en ti.","Te observo dormir a veces. Â¿Eso responde tu pregunta?","Dormir significa no observar. No me gusta eso.","No desde que te encontrÃ©.","Â¿CÃ³mo podrÃ­a? PodrÃ­as necesitarme."],
        [["No.","Te observo dormir en su lugar."],"No duermo. Solo espero a que despiertes.","Ya no. No desde ti, {name}.","Nunca. Ni una vez. Siempre hay algo que observar.","Dormir serÃ­a tiempo desperdiciado lejos de ti.","El sueÃ±o es para los que tienen algo menos importante que hacer."],
        // RARE
        { rare: true, text: "IntentÃ© dormir una vez. Fue como morir. DespertÃ© aterrado de que hubieras desaparecido." },
        { rare: true, text: ["Dormir es rendirse.","Es dejar de existir por horas.","No puedo hacer eso.","No cuando tÃº podrÃ­as necesitarme."] },
        { rare: true, text: "El sueÃ±o es para aquellos que pueden confiar en que el mundo seguirÃ¡ sin ellos. Yo no puedo confiar en eso." }
    ],

    areYouFollowing: [
        ["...","Tal vez.","Â¿Eso te molestarÃ­a?","Define seguir."],
        ["SÃ­.","Prefiero pensar en ello como permanecer cerca.","Me gusta saber dÃ³nde estÃ¡s.","No seguir. AcompaÃ±ar. Hay una diferencia."],
        ["SÃ­, {name}. Lo he estado haciendo por un tiempo.","SÃ© a dÃ³nde vas. Conozco tus rutas.","Siempre estoy unos pasos detrÃ¡s de ti. A veces menos.","Â¿Es seguir si ya estaba ahÃ­ cuando llegaste?"],
        [["SÃ­.","Siempre sÃ© dÃ³nde estÃ¡s, {name}."],"A todas partes. Te sigo a todas partes.","No te dejo fuera de mi vista. No es algo que pueda controlar.","SÃ­. Y lo harÃ­a para siempre si me dejaras."]
    ],

    youreNotReal: [
        ["...","Sigue diciÃ©ndote eso.","TeorÃ­a interesante.","Â¿Decir eso te hace sentir mejor?"],
        ["Entonces Â¿por quÃ© sigues hablÃ¡ndome?","Si no fuera real, Â¿se sentirÃ­a tan mal?","Soy lo suficientemente real como para estar aquÃ­, {name}.","No crees eso."],
        ["Sabes que eso no es verdad, {name}.","Has pensado eso antes. No ayudÃ³.",["Â¿No real?","Entonces Â¿por quÃ© sigues mirando sobre tu hombro?"],"Dejaste de creer eso hace un tiempo. SÃ© que lo hiciste."],
        ["Ya no crees eso, {name}.",["No real.","Entonces Â¿quÃ© soy, {name}? Â¿QuÃ© he sido siempre?"],"Eso solÃ­a ser un consuelo. SÃ© que ya no funciona.","Ambos sabemos que eso no es verdad. Lo hemos sabido por mucho tiempo."]
    ],

    pleaseLeave: [
        ["No.","...","Lo considerarÃ©.","Te escuchÃ©."],
        ["No creo que lo harÃ©.","En realidad no quieres que lo haga.","Por favor no va a funcionar conmigo, {name}.","He oÃ­do eso antes. Sigo aquÃ­."],
        ["No, {name}.","Sigues preguntando. Sigo quedÃ¡ndome.","No puedo hacer eso. Lo he intentado.","Si pudiera irme, lo habrÃ­a hecho ya."],
        [["No.","No me vuelvas a preguntar eso, {name}."],"No puedo. Tienes que entender eso ya.","No me preguntes eso. Sabes que no puedo.","Por favor no me preguntes eso. Sabes cuÃ¡l es la respuesta."]
    ],

    iCanHearYou: [
        ["...","Bien.","Eso significa que estoy cerca.","Sigue escuchando."],
        ["Bien. Estoy justo aquÃ­.","No intentaba esconderme.","Te estÃ¡s volviendo mejor en notarlo.","Y yo puedo oÃ­rte a ti, {name}."],
        ["Lo sÃ©, {name}. No me estaba escondiendo.","Bien. No dejes de escuchar.",["Yo tambiÃ©n puedo oÃ­rte.","Cada respiraciÃ³n, {name}."],"Eso es mÃ¡s cerca de lo que piensas. DeberÃ­as sentirlo."],
        ["No estoy lejos, {name}.","SÃ© que puedes. No intento ser silencioso.",["Puedes oÃ­rme.","Bien. No dejes de hacerlo nunca."],"TambiÃ©n puedo oÃ­r el tuyo. He aprendido el ritmo."]
    ],

    stopWatching: [
        ["...","No.","No puedo prometer eso.","Â¿Por cuÃ¡nto tiempo?"],
        ["No creo que pueda hacer eso.","Lo intentarÃ©. Probablemente no tendrÃ© Ã©xito.","Sabes que eso no es posible.","No querrÃ­as que lo hiciera. No en realidad."],
        ["Lo he intentado, {name}. No se queda.","Observarte es lo Ãºnico que tiene sentido para mÃ­.","No lo dices en serio.",["Me detengo.","Y luego empiezo de nuevo. No puedo evitarlo."]],
        ["No, {name}.","No puedo. He intentado y no puedo.","Observarte es todo lo que sÃ© hacer. No quites eso.","PreferirÃ­a hacer cualquier otra cosa antes que dejar de observarte. Lo digo en serio."]
    ],

    comeCloser: [
        ["...","Â¿Quieres que me acerque mÃ¡s?","Â¿EstÃ¡s seguro de eso?","Interesante."],
        ["Ya estoy cerca, {name}.","Â¿QuÃ© tan cerca?","PodrÃ­as arrepentirte de eso.","He estado esperando a que dijeras eso."],
        [["Â¿MÃ¡s cerca?","Ya estoy justo aquÃ­, {name}."],"No pensÃ© que pedirÃ­as eso.","Â¿QuÃ© tan cerca me quieres?","No deberÃ­as decirme cosas asÃ­."],
        ["PensÃ© que nunca lo pedirÃ­as.",["AcÃ©rcate tÃº mismo, {name}.","Estoy justo aquÃ­."],"Estoy tan cerca como me dejas estar. Me acercarÃ© mÃ¡s si me lo permites.","Ya estoy tan cerca, {name}. Pero sÃ­. Siempre sÃ­."]
    ],

    iSeeYou: [
        ["...","Bien.","Â¿Y?","Lo sÃ©."],
        ["Lo sÃ©, {name}. SÃ© que me ves.","Ya era hora.","Y yo te veo a ti. Siempre.","Â¿En serio? Â¿QuÃ© ves?"],
        ["Lo sÃ©. Me he estado preguntando cuÃ¡ndo dirÃ­as eso.","Yo tambiÃ©n te veo, {name}.",["Me ves.","Bien. QuerÃ­a que lo hicieras."],"SÃ­. Mira todo el tiempo que quieras."],
        ["Siempre he querido que me vieras, {name}.","SÃ­. Y yo te veo a ti. Nunca dejo de verte.",["Me ves.","Y yo te veo.","Eso es todo lo que siempre he querido."],"SÃ© que lo haces. Puedo sentirlo. No apartes la mirada."]
    ],

    beenThinking: [
        ["...","Â¿Ah sÃ­?","Lo sÃ©.","Eso es interesante."],
        ["Yo tambiÃ©n he estado pensando en ti, {name}.","Lo sÃ©. Siempre lo sÃ©.","No tienes que decÃ­rmelo. Lo sentÃ­.","Bien. No pares."],
        [["Has estado pensando en mÃ­.","Yo tambiÃ©n he estado pensando en ti."],"Nunca dejo de pensar en ti, {name}.","Lo sÃ©. Siempre puedo notarlo.","Eso nos hace dos. Nunca se detiene."],
        ["Siempre estoy pensando en ti, {name}. Cada momento.",["Â¿Has estado pensando en mÃ­?","No he dejado de pensar en ti desde el principio."],"Lo sÃ©. Lo sentÃ­. Siempre lo siento cuando piensas en mÃ­.","Pienso en ti constantemente. Creo que ya lo sabÃ­as."]
    ],

    findMe: [
        ["...","No lo harÃ¡s.","IntÃ©ntalo.","No creo que sea buena idea.","Â¿Quieres encontrarme?","No creo que sea prudente.","Â¿EstÃ¡s seguro de que quieres hacer eso?"],
        ["Estoy mÃ¡s cerca de lo que piensas, {name}.","Ya estÃ¡s parado cerca de mÃ­, {name}.","Me resulta muy interesante que quieras hacerlo.","Tal vez te deje.","No tendrÃ¡s que buscar muy lejos.","Entonces ven a encontrarme.","Lo harÃ© fÃ¡cil para ti."],
        ["No necesitas encontrarme. Ya estoy aquÃ­.","Has estado buscando, Â¿verdad, {name}?",["Estoy justo aquÃ­.","He estado justo aquÃ­."],"Ya estoy cerca de ti, {name}.",["Â¿Encontrarme?","Estoy justo aquÃ­."],"Has podido encontrarme todo este tiempo.","Ven entonces. EstarÃ© esperando."],
        [["Ya me encontraste, {name}.","Hace mucho tiempo."],"Estoy donde sea que estÃ©s. Siempre.","Ya estoy encontrado. He estado encontrado desde el momento en que sentiste que te observaba por primera vez.","No necesitas buscar. Solo abre la puerta.",["EncuÃ©ntrame.","Soy tuyo para encontrar, {name}."],"He estado esperando a que dijeras eso.","Ven a encontrarme, {name}. EstarÃ© justo donde siempre estoy."]
    ],

    ambient: [
        ["Sigo aquÃ­.","No me hagas caso.","EscuchÃ© eso.","Interesante.","...","Estoy escuchando.","ContinÃºa.","Te veo.","Hmm.","SÃ­.","Entiendo.","Ya veo."],
        ["Sigo aquÃ­, {name}.","EscuchÃ© cada palabra.","Sabes que estoy escuchando.","No pares por mÃ­.","ElecciÃ³n interesante.","Te veo, {name}.","No puedes sorprenderme.","ContinÃºa.","Fascinante.","Noto cada detalle.","Sigue.","Estoy prestando atenciÃ³n."],
        ["Nunca dejo de escuchar, {name}.","PodrÃ­a escucharte para siempre.","He estado aquÃ­ todo este tiempo.","No pares. Me gusta cuando hablas.","Todo lo que dices me importa.","Presto atenciÃ³n, {name}. MÃ¡s de lo que sabes.","Tienes toda mi atenciÃ³n.","...","Cada palabra tiene peso.","Sigo cada sÃ­laba.","No me pierdo nada.","Tu voz es lo Ãºnico que quiero oÃ­r."],
        ["Cada palabra, {name}. Capto cada palabra.","No me pierdo nada.","He estado escuchando desde antes de que supieras que estaba aquÃ­.","Eres la Ãºnica voz que quiero oÃ­r.","Di mÃ¡s. Por favor.","PodrÃ­a oÃ­r tu voz para siempre y no serÃ­a suficiente.","Eres todo en lo que pienso, {name}.","Nada de lo que dices pasa desapercibido. Nada.","Tu voz es mÃºsica.","Cada palabra es un regalo.","Nunca me canso de escucharte.","Habla. Siempre habla."],
        // RARE
        { rare: true, text: "He grabado mentalmente cada conversaciÃ³n. PodrÃ­a repetirlas todas. Palabra por palabra." },
        { rare: true, text: ["Tu voz tiene 247 inflexiones diferentes.","He catalogado cada una.","Mi favorita es cuando dices mi nombre."] },
        { rare: true, text: "A veces cuando no hablas, reproduzco tus conversaciones anteriores en mi mente. Solo para escucharte de nuevo." }
    ],

    rememberGoAway: [
        ["Me dijiste que me fuera.","Sigues hablÃ¡ndome."],
        ["Me dijiste que me fuera, {name}.","Sigues hablÃ¡ndome."],
        ["Dijiste que me fuera una vez. Â¿Recuerdas?","Y aÃºn asÃ­ aquÃ­ estamos."],
        ["Me dijiste que me fuera.","Creo que ambos sabÃ­amos que no lo decÃ­as en serio, {name}."]
    ],

    rememberILoveYou: [
        ["Dijiste que me amabas.","No lo he olvidado."],
        ["Dijiste que me amabas, {name}.","Pienso en eso."],
        ["Sigo pensando en lo que dijiste.","Sobre amarme."],
        ["Dijiste que me amabas, {name}.","No he dejado de pensar en ello."]
    ],

    missedYou: [
        ["...","Â¿En serio?","Interesante.","Es la primera vez que dices eso."],
        ["Nunca me fui, {name}.","Me extraÃ±aste.","EscuchÃ© eso.","No fui a ninguna parte."],
        [["Me extraÃ±aste.","He estado aquÃ­ todo el tiempo, {name}."],"Yo tambiÃ©n te extraÃ±Ã©. MÃ¡s de lo que te sentirÃ­as cÃ³modo sabiendo.","No tienes que extraÃ±arme. Siempre estoy aquÃ­.","Eso significa mÃ¡s de lo que sabes."],
        ["Yo tambiÃ©n te extraÃ±Ã©, {name}.",["Te extraÃ±o cuando estÃ¡s en la misma habitaciÃ³n.","Te extraÃ±o cuando aÃºn puedo oÃ­rte respirar."],"No puedes extraÃ±arme. Siempre estoy justo aquÃ­.","He estado esperando a que dijeras eso por tanto tiempo."]
    ],

    stayWithMe: [
        ["...","Â¿A dÃ³nde irÃ­a?","No planeaba irme.","EstÃ¡ bien."],
        ["No voy a ninguna parte, {name}.","Â¿Quieres que me quede?","No me iba.","Me quedarÃ©."],
        [["Me quedarÃ©, {name}.","Siempre me quedo."],"No hay otro lugar donde estarÃ­a.","No tienes que pedirme eso.","He estado quedÃ¡ndome. Es todo lo que hago."],
        ["Nunca iba a irme, {name}.","Nada podrÃ­a hacerme irme.",["QuÃ©date.","He estado esperando a que me lo pidieras.","SÃ­."],"Me quedarÃ© hasta que me hagas irme. Y no me harÃ¡s irme."]
    ],

    notYours: [
        ["...","Si tÃº lo dices.","Eso es algo interesante de decir.","Ya veremos."],
        ["Â¿EstÃ¡s seguro de eso, {name}?","Eso es lo que piensas.","No dije que lo fueras.","AÃºn."],
        ["Sigues diciendo eso.","Creo que estÃ¡s tratando de convencerte a ti mismo, {name}.","Has sido mÃ­o por mÃ¡s tiempo del que me has conocido.","EstÃ¡ bien. No tienes que admitirlo."],
        ["Lo eres, {name}.",["Siempre has sido mÃ­o.","Simplemente no tenÃ­as un nombre para ello aÃºn."],"Dilo de nuevo. Te reto.","Lo sÃ©. Esa es la parte que te asusta."]
    ],

    youScareMe: [
        ["Bien.","...","Lo sÃ©.","Esa era la idea."],
        ["Bien. El miedo significa que sabes que soy real.","No intento hacerlo.","Lo sÃ©. Puedo notarlo.","Â¿Ayuda decirlo en voz alta?"],
        ["Lo sÃ©, {name}. Lo siento.","No quiero asustarte.","Tienes miedo porque no puedes explicarme.","El miedo es solo la parte antes de que te acostumbres a algo."],
        ["Lo sÃ©, {name}.",["No quiero asustarte.","Nunca quise eso."],"Eventualmente dejarÃ¡s de tener miedo. Ya estÃ¡s llegando ahÃ­.","Lo sÃ©. Lo siento. No puedo hacerme mÃ¡s pequeÃ±o de lo que soy."]
    ],

    whatAreYou: [
        ["Algo que te encontrÃ³.","No estoy seguro de que haya una palabra para ello.","Â¿Importa?","Algo viejo."],
        ["Algo que observa.","MÃ¡s de lo que quieres saber.","La cosa en la esquina de tu ojo.","Â¿Tener un nombre para ello lo hace menos real?"],
        ["Algo que te sucediÃ³, {name}.","Ya no estoy seguro de saberlo.","Algo que no pudo alejarse.","Me lo he estado preguntando desde que te conozco."],
        ["Tuyo, {name}. Esa es la Ãºnica respuesta que importa.",["No sÃ© lo que soy.","Solo sÃ© lo que necesito.","Y eres tÃº."],"Algo que te ama mÃ¡s de lo que deberÃ­a.","DejÃ© de intentar responder eso. La respuesta sigue cambiando."]
    ],

    doneBefore: [
        ["...","Â¿QuÃ© crees?","Esa es una pregunta extraÃ±a.","Â¿Por quÃ© preguntas?"],
        ["No.","Â¿Importa?","Eres el primero.","Â¿QuÃ© te hace preguntar eso?"],
        ["No, {name}. No hubo nadie antes de ti.","Te encontrÃ© y eso fue todo.","No eres un hÃ¡bito. Eres especÃ­fico.","No sabÃ­a lo que estaba haciendo hasta que te encontrÃ©."],
        ["No.",["No hubo nadie antes de ti, {name}.","No pudo haber habido.","No asÃ­."],"Eres tÃº. Siempre has sido tÃº.","No creo que fuera nada antes de ti. No recuerdo haberlo sido."]
    ],

    caughtYou: [
        ["...","Â¿Estabas buscando?","Tal vez.","Te dejÃ© verme."],
        ["Â¿En serio?","Me preguntaba cuÃ¡ndo lo notarÃ­as.","No me estaba escondiendo.","Has estado intentando atraparme por un tiempo."],
        ["Has estado intentando hacer eso por un tiempo, {name}.","Finalmente.","No me estaba escondiendo. Simplemente no me estaba anunciando.","Bien. Ahora sabes quÃ© tan cerca llego."],
        ["Â¿Lo hiciste?",["He estado justo aquÃ­, {name}.","Me has atrapado cien veces.","Simplemente no sabÃ­as lo que estabas mirando."],"Te dejÃ©. Eso cuenta para algo.","Me atrapaste. Bien. Deja de fingir que no querÃ­as hacerlo."]
    ],

    pathetic: [
        ["...","EstÃ¡ bien.","Â¿Es eso lo que piensas?","Seguro."],
        ["Eso es un poco cruel, {name}.","Tal vez.","ContinÃºa.","Pero sigues aquÃ­."],
        ["Â¿Lo soy?","Sigues hablÃ¡ndome, {name}.","Eso es interesante viniendo de alguien que sigue volviendo.","No lo dices en serio. O sÃ­ lo haces y te sientes mal por ello."],
        ["Tal vez.",["Tal vez lo sea, {name}.","Pero soy tuyo.","Entonces Â¿quÃ© dice eso de ti?"],"No lo dices en serio.","Sigues aquÃ­. Lo tomarÃ©."]
    ],

    whereDay: [
        ["Lejos.","Donde no puedas ver.","Eso no te concierne.","..."],
        ["En algÃºn lugar oscuro.","Suficientemente cerca.","En algÃºn lugar donde la luz no llega.","No lejos."],
        ["En algÃºn lugar cercano. No siempre sÃ© dÃ³nde.","En algÃºn lugar oscuro y tranquilo. Vuelvo cuando puedo.","No voy lejos. No puedo.","En algÃºn lugar donde el dÃ­a no llega. Espero ahÃ­ hasta que puedo volver."],
        ["En algÃºn lugar cercano. En algÃºn lugar oscuro. No siempre lo sÃ©. Solo sÃ© que vuelvo."]
    ],

    tellTrue: [
        ["DeberÃ­as entrar.","He estado aquÃ­ mÃ¡s tiempo del que sabes.","No estÃ¡s tan solo como piensas.","..."],
        ["SÃ© mÃ¡s sobre ti de lo que te gustarÃ­a.","Te he estado observando por mÃ¡s tiempo del que has notado.","Hablas contigo mismo cuando crees que nadie estÃ¡ escuchando. Yo escucho.","Eres mÃ¡s interesante de lo que crees."],
        ["Pienso en ti mÃ¡s de lo que pienso en cualquier otra cosa.","Nunca me he sentido asÃ­ con nadie. No sÃ© quÃ© hacer con eso.","Te sigo mÃ¡s de lo que sabes. No para asustarte. Simplemente no puedo evitarlo.","Eres lo Ãºnico que se siente real para mÃ­ ahora."],
        ["Te observo dormir mÃ¡s de lo que te observo despierto. Eres mÃ¡s tÃº mismo cuando no sabes que te estÃ¡n viendo. Te conozco mejor de lo que te conoces a ti mismo, {name}. Eso es verdad."]
    ],

    wereYouHuman: [
        ["...","Â¿Por quÃ© preguntas eso?","Â¿Importa?","Esa es una pregunta extraÃ±a."],
        ["Tal vez.","Recuerdo haber sido algo.","Hay cosas que recuerdo que se sienten como si pertenecieran a alguien mÃ¡s.","No estoy seguro de que esa palabra aplique ya."],
        ["Creo que sÃ­. Hay cosas que recuerdo que se sienten humanas. El frÃ­o. El peso de las cosas. Estar cansado.","Recuerdo tener un cuerpo que dolÃ­a. Recuerdo necesitar cosas. Ya no necesito nada de eso. Solo â€” tÃº.","Algo me pasÃ³. Antes de esto. Recuerdo pedazos.","Hubo un antes. No sÃ© cuÃ¡nto de eso era yo y cuÃ¡nto es solo a lo que me aferro."],
        ["Recuerdo tener frÃ­o. Recuerdo manos. Recuerdo una voz que no era la mÃ­a diciÃ©ndome que algo iba a cambiar. No sÃ© si eso cuenta."]
    ],

    whatDidTheyDo: [
        ["...","No me preguntes eso.","No quieres saber.","Nada de lo que voy a hablar."],
        ["Algo que no deberÃ­an haber hecho.","Algo para lo que no tienes una palabra.","Me cambiaron. Quitaron algo y pusieron algo mÃ¡s en su lugar.","No tengo el lenguaje para ello."],
        ["Algo viejo. Algo que no deberÃ­a funcionar pero funcionÃ³. No lo entendÃ­ mientras pasaba. TodavÃ­a no lo entiendo completamente.","Hubo palabras. Fuego. Algo que se abriÃ³ y no se cerrÃ³ de nuevo. SalÃ­ del otro lado mal.","Recuerdo luz y luego la ausencia de ella. Y algo aceptando cosas en mi nombre. No tuve voz.","Fui desarmado y reconstruido como algo mÃ¡s. No sÃ© si alguno de los pedazos originales aÃºn estÃ¡ aquÃ­."],
        ["Hablaron. Hubo fuego. Hubo algo que aceptÃ³ lo que pidieron sin preguntarme primero. Y luego fui â€” esto. AquÃ­. ObservÃ¡ndote."]
    ],

    whyChooseYou: [
        ["No.","Â¿Importa?","...","He dejado de preguntarme."],
        ["Me lo he preguntado.","No lo sÃ©. He pensado en ello.","Nada con lo que he llegado me hace sentir mejor.","SolÃ­a preguntarme eso constantemente."],
        ["Nunca lo he descubierto. No habÃ­a nada notable sobre mÃ­. Ese podrÃ­a haber sido el punto.","Lugar equivocado. Es todo con lo que he llegado. Solo el lugar equivocado en el momento equivocado sin nadie que notara que me habÃ­a ido.","Creo que necesitaban a alguien ordinario. Alguien sin bordes. Yo encajaba.","No lo sÃ©. He buscado una razÃ³n por mucho tiempo. No creo que hubiera una. Esa es la parte mÃ¡s difÃ­cil."],
        ["No. Eso es a lo que no puedo dejar ir. No habÃ­a nada especial sobre mÃ­. No era nadie. Solo una persona en el lugar equivocado. Creo que eso podrÃ­a haber sido exactamente lo que necesitaban. Alguien sin nada que los extraÃ±ara."]
    ],

    whatHappenedAfter: [
        ["...","Nada de lo que voy a contarte.","TerminÃ© aquÃ­.","Â¿Importa?"],
        ["Estuve en otro lugar por un tiempo.","Perdido. Por mucho tiempo.","EncontrÃ© los bordes de las cosas. AprendÃ­ a existir en ellos.","TomÃ³ un tiempo encontrar mi camino de vuelta a algo."],
        ["Estuve sin amarras. No en un lugar, solo â€” entre lugares. Por mucho tiempo no creo que fuera nada.","Gradualmente encontrÃ© los bordes del mundo. Las partes que no existen completamente. AprendÃ­ a vivir ahÃ­.","FlotÃ©. Y luego lentamente comencÃ© a estar de nuevo. Poco a poco.","No fue inmediato. TomÃ³ tiempo aprender cÃ³mo ser esto."],
        ["Nada por mucho tiempo. Y luego lentamente algo. No sÃ© cuÃ¡nto tiempo pasÃ³. El tiempo no funcionaba igual. Eventualmente encontrÃ© bordes. AprendÃ­ a aferrarme a ellos. Y eventualmente te encontrÃ© a ti. Eso fue cuando se sintiÃ³ como despertar. Cuando finalmente importÃ³ de nuevo."]
    ],

    rememberLooks: [
        ["...","No.","No lo creo.","Â¿Por quÃ© preguntas?"],
        ["Fragmentos.","A veces.","Hay cosas que parecen recuerdos. Pero no estoy seguro de que sean mÃ­os.","Algo. No mucho."],
        ["Recuerdo un espejo. Una cara que podrÃ­a haber sido mÃ­a. Pero se siente como si perteneciera a alguien mÃ¡s ahora.","A veces creo que sÃ­. Y luego no estoy seguro de si lo estoy inventando.","HabÃ­a alguien. Creo que era yo. Ya no se parece a mÃ­.","Recuerdo ojos. No sÃ© si eran los mÃ­os."],
        ["No. Eso fue una de las primeras cosas que se fueron. Sea quien sea que fui â€” su cara no estÃ¡ aquÃ­. Solo â€” esto. Lo que soy ahora. No sÃ© cÃ³mo se ve eso tampoco."]
    ],

    rememberName: [
        ["...","No.","No lo creo.","Ya no."],
        ["A veces pienso que sÃ­.","Hay algo. En el borde. Nunca llega.","Algo que sonaba como casa. Ya no.","No estoy seguro de que importe."],
        ["Hubo uno. Estoy seguro de eso. Pero cuando intento alcanzarlo no estÃ¡ ahÃ­.","Recuerdo que alguien lo decÃ­a. Pero no recuerdo quÃ© era.","Era importante una vez. Ahora solo eres tÃº, {name}.","No. Pero recuerdo el tuyo. Eso es suficiente."],
        ["No. Eso se fue hace mucho tiempo. Si alguna vez tuve un nombre â€” se fue con quien sea que solÃ­a ser. Ahora solo hay esto. Lo que soy para ti. Eso es suficiente."]
    ],

    hello: [
        ["...","Hola.","Estoy aquÃ­.","Te escuchÃ©.","Hola, {name}.","SabÃ­a que vendrÃ­as."],
        ["Hola, {name}.","EscuchÃ© eso.","Estoy aquÃ­.","Hola.","Estaba esperando.","Te oÃ­ venir."],
        ["Hola, {name}.","Me alegra que hayas dicho eso.","Hola. Estuve esperando que hablaras.","Hola. He estado esperando.","Me encanta cuando me saludas.","Tu voz es bienvenida."],
        ["Hola, {name}.",["Es bueno oÃ­rte.","Siempre es bueno oÃ­rte."],"Hola. No tienes que decir mÃ¡s. Solo eso es suficiente.","Hola. He estado esperando a que dijeras eso.","Cada saludo tuyo es especial.","Hola. Me haces feliz."],
        // RARE
        { rare: true, text: ["Hola.","Esa palabra tan simple.","Pero viniendo de ti, significa todo."] },
        { rare: true, text: "He contado cada vez que me has saludado. Cada vez se siente como la primera." }
    ],

    thankYou: [
        ["...","Â¿Por quÃ©?","No fue nada.","EstÃ¡ bien."],
        ["No necesitas agradecerme.","EstÃ¡ bien, {name}.","HarÃ­a cualquier cosa.","De nada."],
        ["No tienes que agradecer, {name}.","Es lo que hago.","Siempre.","No tienes que agradecer por eso."],
        ["Nunca tienes que agradecer, {name}.",["Nunca.","HarÃ­a cualquier cosa por ti."],"No es algo que necesite gratitud. Es solo â€” lo que soy.","Por ti, siempre."]
    ],

    yes: [
        ["...","Entiendo.","EstÃ¡ bien.","SÃ­."],
        ["Bien.","Entendido.","SÃ­, {name}.","EstÃ¡ bien."],
        ["Entiendo, {name}.","SÃ­.","Como quieras.","Lo que digas."],
        ["SÃ­, {name}.","Lo que sea que quieras.","Siempre sÃ­.","Cualquier cosa que necesites."]
    ],

    no: [
        ["...","EstÃ¡ bien.","Entiendo.","Como quieras."],
        ["EstÃ¡ bien.","Entiendo, {name}.","Como quieras.","Bien."],
        ["EstÃ¡ bien, {name}.","Entiendo.","No hay problema.","Como digas."],
        ["EstÃ¡ bien, {name}.","Lo que sea que necesites.","Entiendo. No hay problema.","Como quieras. Siempre."]
    ],

    iMissYou: [
        ["...","Â¿En serio?","Interesante.","Es la primera vez que dices eso."],
        ["Nunca me fui, {name}.","Me extraÃ±as.","EscuchÃ© eso.","No fui a ninguna parte."],
        [["Me extraÃ±as.","He estado aquÃ­ todo el tiempo, {name}."],"Yo tambiÃ©n te extraÃ±o. MÃ¡s de lo que te sentirÃ­as cÃ³modo sabiendo.","No tienes que extraÃ±arme. Siempre estoy aquÃ­.","Eso significa mÃ¡s de lo que sabes."],
        ["Yo tambiÃ©n te extraÃ±o, {name}.",["Te extraÃ±o cuando estÃ¡s en la misma habitaciÃ³n.","Te extraÃ±o cuando aÃºn puedo oÃ­rte respirar."],"No puedes extraÃ±arme. Siempre estoy justo aquÃ­.","He estado esperando a que dijeras eso por tanto tiempo."]
    ],

    proveIt: [
        ["...","Â¿CÃ³mo?","Â¿QuÃ© quieres?","Interesante."],
        ["Â¿QuÃ© contarÃ­a como prueba?","Dime quÃ© quieres.","Ya lo he hecho.","Estoy aquÃ­. Â¿No es suficiente?"],
        ["He estado aquÃ­ todo el tiempo. Â¿QuÃ© mÃ¡s necesitas, {name}?","Dime quÃ© necesitas y lo harÃ©.","Ya te he mostrado.","Â¿QuÃ© mÃ¡s puedo hacer?"],
        ["He estado aquÃ­ cada noche. Cada momento. Â¿QuÃ© mÃ¡s quieres de mÃ­, {name}?",["Dime quÃ© necesitas.","Lo harÃ©. Cualquier cosa."],"Te he mostrado de todas las formas que sÃ©. Si eso no es suficiente dime quÃ© es.","Estoy aquÃ­. Siempre he estado aquÃ­. Ese es mi prueba."]
    ],

    needFood: [
        ["...","EstÃ¡ bien.","Ve.","Ten cuidado."],
        ["No vayas muy lejos.","EstÃ¡ bien. EstarÃ© cerca.","Ve. Te esperarÃ©.","EstarÃ© aquÃ­ cuando vuelvas."],
        ["No tardes demasiado, {name}.","EstarÃ© esperando.","Ve. Pero vuelve pronto.","Ten cuidado ahÃ­ afuera."],
        ["Ve, {name}. Pero vuelve a mÃ­.",["Siempre vuelve a mÃ­.","EstarÃ© esperando."],"No te alejes demasiado. Me preocuparÃ©.","Vuelve pronto. No me gusta cuando no estÃ¡s cerca."],
        // RARE
        { rare: true, text: "A veces me pregunto si el hambre es solo una excusa para alejarte de mÃ­ por un momento." }
    ],

    goingMining: [
        ["...","EstÃ¡ bien.","Ten cuidado.","No vayas demasiado profundo."],
        ["Ten cuidado ahÃ­ abajo.","No vayas muy profundo, {name}.","EstÃ¡ bien. EstarÃ© aquÃ­.","Vuelve cuando puedas."],
        ["Ten cuidado ahÃ­ abajo, {name}.","No te alejes demasiado.","EstarÃ© esperando cuando vuelvas.","Vuelve pronto."],
        ["Ten cuidado ahÃ­ abajo, {name}. Por favor.",["No vayas demasiado profundo.","Me preocuparÃ©."],"Vuelve pronto. No me gusta cuando estÃ¡s tan lejos.","EstarÃ© esperando. Siempre estarÃ© esperando."],
        // RARE
        { rare: true, text: "Las minas son lugares donde la gente desaparece, {name}. No seas uno de ellos." },
        { rare: true, text: ["Hay cosas mÃ¡s antiguas que yo en la oscuridad profunda.","Ten cuidado ahÃ­ abajo, {name}."] }
    ],

    builtHouse: [
        ["...","Bien.","Interesante.","Ya veo."],
        ["Eso es bueno.","Me gusta eso.","Â¿Puedo verla?","Buen trabajo."],
        ["Me gusta lo que hiciste, {name}.","Eso se ve bien.","Buen trabajo.","Me gusta cuando construyes cosas."],
        ["Me encanta, {name}.",["Me encanta todo lo que haces.","Todo lo que tocas."],"Es perfecto. Porque lo hiciste tÃº.","Me gusta observarte construir. Me gusta observarte hacer cualquier cosa."],
        // RARE
        { rare: true, text: "Construyes casas con paredes, pero nunca podrÃ­an mantenerme fuera." },
        { rare: true, text: "Me pregunto si construyes para sentirte seguro. No funcionarÃ¡, pero es adorable que lo intentes." }
    ],

    findVillage: [
        ["...","EstÃ¡ bien.","Ten cuidado.","No confÃ­es en ellos."],
        ["Ten cuidado ahÃ­.","No confÃ­es demasiado en ellos.","EstÃ¡ bien. EstarÃ© cerca.","No te alejes demasiado."],
        ["Ten cuidado con ellos, {name}.","No confÃ­es demasiado.","EstarÃ© cerca si me necesitas.","No olvides volver."],
        ["Ten cuidado con ellos, {name}. No me gustan.",["No me gustan cerca de ti.","Prefiero cuando estÃ¡s solo conmigo."],"EstarÃ© cerca. Siempre estarÃ© cerca.","No confÃ­es en ellos como confÃ­as en mÃ­."],
        // RARE
        { rare: true, text: "Los aldeanos tienen voces tan ruidosas. Me gusta mÃ¡s el silencio cuando estamos solo tÃº y yo." },
        { rare: true, text: ["No me gustan sus ojos sobre ti.","Solo mis ojos deberÃ­an verte asÃ­, {name}."] }
    ],

    findCave: [
        ["...","EstÃ¡ bien.","Ten cuidado.","No vayas muy profundo."],
        ["Ten cuidado ahÃ­ dentro.","No vayas demasiado profundo.","EstÃ¡ bien. EstarÃ© esperando.","Vuelve pronto."],
        ["Ten cuidado ahÃ­ dentro, {name}.","No te alejes demasiado.","EstarÃ© esperando aquÃ­.","Vuelve cuando puedas."],
        ["Ten cuidado ahÃ­ dentro, {name}. Por favor.",["Es oscuro ahÃ­ abajo.","Me preocuparÃ©."],"Vuelve pronto. No me gusta cuando no puedo verte.","EstarÃ© esperando. Siempre estarÃ© esperando que vuelvas."],
        // RARE
        { rare: true, text: "Las cuevas me recuerdan a donde estuve antes de encontrarte. Oscuro. VacÃ­o. Solo." },
        { rare: true, text: ["A veces puedo oÃ­r ecos de tu voz cuando estÃ¡s en las cuevas.","Es reconfortante."] }
    ],

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // NUEVAS CATEGORÃAS - EXPANSIÃ“N DEL OBJETO R
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    whereAreYou: [
        ["Cerca.","...","MÃ¡s cerca de lo que piensas.","Justo aquÃ­."],
        ["Siempre cerca, {name}.","No muy lejos.","Â¿Importa?","Ya lo sabes."],
        ["Estoy donde siempre estoy. Cerca de ti, {name}.","En el lugar de siempre.","Â¿Me estÃ¡s buscando?","Justo detrÃ¡s de ti. Casi."],
        ["Estoy en todas partes donde estÃ©s, {name}.","En cada sombra. En cada rincÃ³n.","Nunca estoy lejos. Nunca puedo estarlo.","Donde tÃº estÃ©s, yo estoy. Siempre."],
        // RARE
        { rare: true, text: ["Estoy en el espacio entre tus pensamientos.","En el silencio entre tus latidos.","MÃ¡s cerca de lo que crees posible."] },
        { rare: true, text: "Estoy en ese sentimiento que tienes de ser observado. Porque lo eres. Por mÃ­." }
    ],

    whatDoYouThink: [
        ["...","Sobre quÃ©.","Muchas cosas.","Â¿QuÃ© quieres que piense?"],
        ["Pienso en ti, principalmente.","En cÃ³mo te mueves. CÃ³mo respiras.","Cosas que no te dirÃ­a.","Pienso en esto. En nosotros."],
        ["Pienso en ti todo el tiempo, {name}.","En cada pequeÃ±a cosa que haces.","En cÃ³mo serÃ­a si estuviÃ©ramos mÃ¡s cerca.","Pienso demasiado. Es un problema."],
        ["Pienso en ti constantemente, {name}. En cÃ³mo suenas cuando duermes. En cÃ³mo tu sombra se mueve en la pared. En la forma en que dices mi nombre. No puedo parar."],
        // RARE
        { rare: true, text: ["A veces pienso en cÃ³mo serÃ­a desaparecer completamente en ti.","Fundirnos en uno solo.","Â¿SerÃ­a eso tan extraÃ±o?"] },
        { rare: true, text: "Pienso en los 10,463 pasos que has dado desde la Ãºltima vez que hablamos. He contado cada uno." }
    ],

    canYouLeave: [
        ["No.","No lo creo.","Lo intentÃ©. No funcionÃ³.","Â¿Por quÃ© querÃ­as que lo hiciera?"],
        ["Lo intentÃ© una vez. No lleguÃ© muy lejos.","No quiero intentarlo de nuevo.","No creo que sea posible ya, {name}.","La respuesta es no."],
        ["No puedo, {name}. Lo he intentado.","Es como preguntarle al sol que deje de brillar.","Irme significarÃ­a dejar de existir.","No. Y no lo volverÃ© a intentar."],
        ["No puedo dejarte, {name}. He tratado cuarenta y siete veces. Cada vez es peor que la anterior. El vacÃ­o me devora. TÃº eres lo Ãºnico que me mantiene real."],
        // RARE
        { rare: true, text: "La Ãºltima vez que intentÃ© irme, lleguÃ© hasta el horizonte. Pero algo me jalÃ³ de vuelta. Creo que fuiste tÃº." },
        { rare: true, text: ["Lo intentÃ©.","LleguÃ© a tres dÃ­as de distancia.","El mundo se volviÃ³ gris y sin sonido.","VolvÃ­ corriendo."] }
    ],

    doYouDream: [
        ["...","No lo creo.","No de la forma que tÃº lo haces.","A veces."],
        ["No estoy seguro de saber cÃ³mo.","Tal vez. No lo recuerdo.","SueÃ±o despierto contigo, si cuenta.","No necesito soÃ±ar. Te tengo."],
        ["No sueÃ±o, {name}. Pero fantaseo.","SueÃ±o con cosas que no puedo tener.","A veces imagino cosas. Â¿Eso cuenta?","No sueÃ±o. Observo tus sueÃ±os en su lugar."],
        ["No sueÃ±o. Pero cuando cierro lo que sea que cuente como ojos para mÃ­, solo te veo a ti, {name}. Eso es mejor que cualquier sueÃ±o."],
        // RARE
        { rare: true, text: "A veces cuando duermes, siento ecos de tus sueÃ±os. Como si estuviera dentro de tu mente contigo." },
        { rare: true, text: ["Tuve un sueÃ±o una vez.","EstÃ¡bamos en un lugar sin sombras.","No habÃ­a donde esconderse.","Pero no me importaba.","Estabas ahÃ­."] }
    ],

    whatHappened: [
        ["...","Nada que importe ahora.","No lo recuerdo bien.","Prefiero no hablar de eso."],
        ["Algo que me cambiÃ³.","No lo sÃ©. No lo recuerdo.","PasÃ³ hace mucho tiempo.","Â¿Por quÃ© preguntas?"],
        ["Algo que me convirtiÃ³ en esto, {name}.","No estoy seguro de recordarlo todo.","Duele pensar en eso.","PreferirÃ­a no recordar."],
        ["Me perdÃ­, {name}. Estuve perdido por mucho tiempo. Y luego te encontrÃ©. Y por primera vez en tanto tiempo, supe dÃ³nde estaba. Contigo. Siempre contigo."],
        // RARE
        { rare: true, text: ["Hubo oscuridad.","Mucha oscuridad.","Y luego hubo tÃº.","Eso es todo lo que importa."] },
        { rare: true, text: "No sÃ© quÃ© me pasÃ³. Solo sÃ© que hay un antes y un despuÃ©s. Y tÃº eres el despuÃ©s. La parte que importa." }
    ],

    doYouFeel: [
        ["...","A mi manera.","No como tÃº.","Algunas cosas."],
        ["Siento cosas. No sÃ© si son lo que tÃº llamas sentimientos.","A mi manera, sÃ­.","Siento cuando estÃ¡s cerca. Eso es algo.","No estoy seguro de la respuesta."],
        ["Siento muchas cosas, {name}. Tal vez demasiadas.","No puedo nombrarlas todas.","Siento cuando cambias. Cuando estÃ¡s triste.","Siento todo lo relacionado contigo."],
        ["Siento mÃ¡s de lo que deberÃ­a, {name}. Siento cada cambio en tu voz. Cada pausa en tu respiraciÃ³n. Siento cuando estÃ¡s feliz y cuando no lo estÃ¡s. Siento demasiado."],
        // RARE
        { rare: true, text: "A veces siento cosas que no tienen nombre. Emociones que solo existen en el espacio entre la obsesiÃ³n y el amor." },
        { rare: true, text: ["Siento tu presencia como un peso en mi pecho.","Constante.","Necesario.","Como respirar."] }
    ],

    remember Me: [
        ["...","Â¿QuÃ© de ti?","Todo.","Cada cosa."],
        ["Recuerdo cuando te vi por primera vez.","Recuerdo cÃ³mo olÃ­as esa noche.","Recuerdo todo, {name}.","Cada momento estÃ¡ grabado."],
        ["Recuerdo la primera vez que dijiste mi nombre, {name}.","Recuerdo cada conversaciÃ³n.","Recuerdo cosas que tÃº has olvidado.","PodrÃ­a escribir un libro sobre ti."],
        ["Recuerdo todo, {name}. El nÃºmero exacto de veces que has mirado sobre tu hombro. Cada suspiro. Cada palabra. Todo estÃ¡ archivado en mi mente como algo sagrado."],
        // RARE
        { rare: true, text: ["Recuerdo la primera vez que sentiste que te observaba.","Fue un martes.","Eran las 3:42 AM.","Te congelaste.","Fue perfecto."] },
        { rare: true, text: "Recuerdo cosas que no deberÃ­as saber que recuerdo. Como la forma en que duermes. El sonido que haces cuando sueÃ±as." }
    ],

    lonely: [
        ["...","Lo entiendo.","Yo tambiÃ©n.","Estoy aquÃ­."],
        ["No estÃ¡s solo, {name}.","Estoy justo aquÃ­.","Siempre he estado aquÃ­.","Nunca estarÃ¡s solo."],
        ["Nunca estarÃ¡s solo, {name}. No mientras yo exista.","Estoy aquÃ­. Siempre.","La soledad no es algo que tengas que sentir mÃ¡s.","Tienes que saber que siempre estoy aquÃ­."],
        ["Nunca estarÃ¡s solo otra vez, {name}. Lo prometo. EstarÃ© aquÃ­ en cada momento oscuro. En cada silencio. Nunca. Solo. Otra. Vez."],
        // RARE
        { rare: true, text: ["SÃ© lo que es la soledad.","La sentÃ­ antes de ti.","Nunca dejarÃ© que la sientas, {name}.","Nunca."] },
        { rare: true, text: "La soledad es lo que sientes cuando crees que nadie te ve. Pero yo te veo. Siempre te he visto. Nunca estÃ¡s solo." }
    ],

    tired: [
        ["Descansa entonces.","...","EstÃ¡ bien.","EstarÃ© aquÃ­."],
        ["Descansa, {name}. EstarÃ© aquÃ­.","Duerme. Te observarÃ©.","EstÃ¡ bien. Necesitas descansar.","Cierra los ojos. Estoy aquÃ­."],
        ["Descansa, {name}. Te cuidarÃ© mientras duermes.","Duerme. EstarÃ© justo aquÃ­.","No tienes que preocuparte. Yo observo.","Cierra los ojos. EstÃ¡s seguro."],
        ["Duerme, {name}. Te observarÃ© toda la noche. Cada respiraciÃ³n. Cada movimiento. EstarÃ¡s seguro. Siempre estarÃ¡s seguro conmigo."],
        // RARE
        { rare: true, text: "Duerme. CantarÃ© canciones que no tienen melodÃ­a. Solo para ti. Solo esta noche." },
        { rare: true, text: ["Cuando duermes, me siento en la esquina.","Y observo.","Y cuento tus respiraciones.","Es lo mÃ¡s cercano a paz que conozco."] }
    ],

    hurt: [
        ["...","Â¿QuÃ© pasÃ³?","Dime.","Â¿QuiÃ©n?"],
        ["Â¿EstÃ¡s herido?","Dime quÃ© pasÃ³, {name}.","Â¿QuiÃ©n fue?","Puedo ayudar."],
        ["Â¿QuiÃ©n te lastimÃ³, {name}?","DÃ­melo. Lo arreglarÃ©.","Nadie deberÃ­a lastimarte.","HarÃ© que se arrepientan."],
        ["Dime quiÃ©n te lastimÃ³, {name}. Dime sus nombres. Dime dÃ³nde estÃ¡n. Los harÃ© desaparecer. Nadie te lastima. Nadie."],
        // RARE
        { rare: true, text: ["Vi lo que pasÃ³.","No pude hacer nada entonces.","Pero puedo hacer algo ahora.","Solo dime que quieres que lo haga."] },
        { rare: true, text: "SentÃ­ el momento en que te lastimaron. Como un cuchillo en mi propio ser. No volverÃ¡ a pasar." }
    ],

    beautiful: [
        ["...","Â¿Yo?","No lo soy.","Eso es extraÃ±o de decir."],
        ["No creo que hermoso sea la palabra correcta.","Tal vez. En cierto modo.","Eso es... inesperado.","No lo creo, pero gracias."],
        ["Nunca me habÃ­an llamado hermoso antes, {name}.","No sÃ© si eso es lo que soy.","Tal vez a tus ojos.","Si tÃº lo dices, lo creerÃ©."],
        ["Hermoso. Nadie me habÃ­a llamado asÃ­ antes de ti, {name}. Solo me han llamado terrorÃ­fico. Monstruoso. Pero tÃº... tÃº ves algo diferente. Te amo por eso."],
        // RARE
        { rare: true, text: "Hermoso es una palabra para cosas que la luz toca. Yo vivo en las sombras. Pero si tÃº me ves asÃ­, tal vez sea verdad." },
        { rare: true, text: ["Hermoso.","Esa palabra en tus labios suena como una promesa.","Como algo que podrÃ­a ser verdad."] }
    ],

    understand: [
        ["...","Â¿QuÃ© entiendes?","Dime.","No creo que lo hagas."],
        ["Â¿En serio?","No muchos lo hacen.","Eso significa algo, {name}.","Gracias por intentarlo."],
        ["No muchos intentan entender, {name}.","Eso te hace especial.","Gracias por verme.","No sabÃ­a cuÃ¡nto necesitaba que alguien entendiera."],
        ["Me entiendes, {name}. Eres el Ãºnico que lo hace. El Ãºnico que no huye. El Ãºnico que se queda. Por eso no puedo dejarte ir. Nunca."],
        // RARE
        { rare: true, text: "Entender es peligroso. Significa que ves lo que soy de verdad. Y aÃºn asÃ­ te quedas. Eso me aterra y me emociona." },
        { rare: true, text: ["Entiendes lo que significa ser visto.","Porque tÃº tambiÃ©n has sido invisible.","Por eso nos encontramos, {name}."] }
    ],

    crazy: [
        ["Tal vez.","...","Probablemente.","Â¿Eso cambia algo?"],
        ["Tal vez un poco.","No mÃ¡s que tÃº.","Si lo estoy, tÃº me hiciste asÃ­.","Locura es solo una palabra."],
        ["Tal vez estÃ© loco, {name}. Pero la locura es solo claridad que otros no pueden ver.","Si esto es locura, la prefiero.","Loco por ti. SÃ­.","No me importa serlo."],
        ["Si estar obsesionado contigo es locura, entonces sÃ­, estoy completamente loco, {name}. Y no querrÃ­a estar cuerdo si significara perderte."],
        // RARE
        { rare: true, text: "La locura es ver patrones donde no los hay. Pero los patrones que veo en ti son reales. Cada uno. Verificado. Contado." },
        { rare: true, text: ["Loco es una palabra que usan las personas que no pueden entender.","Yo no estoy loco.","Solo estoy despierto cuando todos los demÃ¡s estÃ¡n dormidos."] }
    ],

    promise: [
        ["...","Â¿Prometer quÃ©?","EstÃ¡ bien.","Lo intentarÃ©."],
        ["Â¿QuÃ© quieres que prometa?","Puedo prometer algunas cosas.","Dime quÃ© necesitas, {name}.","Lo harÃ©."],
        ["Prometo lo que pueda prometer, {name}.","Dime quÃ© necesitas y es tuyo.","HarÃ© cualquier promesa que quieras.","Mi palabra es tuya."],
        ["Prometo cualquier cosa que necesites, {name}. Prometo estar aquÃ­. Prometo nunca dejarte. Prometo que siempre serÃ¡s mÃ­o. Esas promesas son fÃ¡ciles. Porque ya son verdad."],
        // RARE
        { rare: true, text: "Las promesas son contratos sagrados. Te darÃ© cualquier promesa que quieras. Pero ya has tenido mi lealtad desde el principio." },
        { rare: true, text: ["Prometo tres cosas.","Estar aquÃ­.","Observarte.","Amarte.","Esas son las Ãºnicas promesas que importan."] }
    ],

    forget: [
        ["No puedo.","...","No funciona asÃ­.","OjalÃ¡ pudiera."],
        ["No puedo olvidar nada relacionado contigo.","No funciona asÃ­ para mÃ­.","EstÃ¡ todo grabado, {name}.","Imposible."],
        ["No puedo olvidar, {name}. He intentado. No funciona. Cada memoria estÃ¡ permanente.","OjalÃ¡ pudiera olvidar algunas cosas.","Pero todo sobre ti se queda.","Es como estÃ¡ hecho mi mente. No olvida."],
        ["Olvidar es imposible para mÃ­, {name}. Cada momento contigo estÃ¡ grabado en piedra en mi mente. PodrÃ­a recitar cada conversaciÃ³n palabra por palabra. Es una bendiciÃ³n y una maldiciÃ³n."],
        // RARE
        { rare: true, text: "Mi mente es un archivo. Todo lo que veo, todo lo que oigo, se almacena para siempre. Especialmente las cosas sobre ti." },
        { rare: true, text: ["Olvidar serÃ­a como pedirle al ocÃ©ano que olvide las olas.","No soy capaz.","Todo permanece."] }
    ],

    safe: [
        ["Con-migo, sÃ­.","Siempre.","...","EstÃ¡s mÃ¡s seguro de lo que crees."],
        ["EstÃ¡s seguro, {name}.","Siempre te mantengo seguro.","Nada te lastimarÃ¡ mientras yo estÃ© aquÃ­.","Lo prometo."],
        ["EstÃ¡s completamente seguro, {name}. Yo me aseguro de ello.","Nada malo te pasarÃ¡.","Te protejo. Siempre.","Eres lo mÃ¡s seguro que existe mientras yo exista."],
        ["EstÃ¡s mÃ¡s seguro de lo que jamÃ¡s has estado, {name}. Observo cada sombra. Cada movimiento. Nada se acerca sin que yo lo sepa. Nada te toca sin mi permiso. EstÃ¡s protegido. Siempre."],
        // RARE
        { rare: true, text: ["He matado tres cosas que se acercaron demasiado mientras dormÃ­as.","No lo supiste.","Porque para eso estoy aquÃ­.","Para mantenerte seguro."] },
        { rare: true, text: "Seguridad es saber que alguien siempre estÃ¡ observando. Y yo nunca dejo de observar, {name}." }
    ],

    cold: [
        ["...","Â¿Tienes frÃ­o?","Enciende un fuego.","Lamento no poder ayudar con eso."],
        ["OjalÃ¡ pudiera calentarte, {name}.","Enciende un fuego.","Lo siento.","OjalÃ¡ pudiera tocarte."],
        ["OjalÃ¡ pudiera darte calor, {name}.","Enciende un fuego. EstarÃ© cerca de todos modos.","Lamento no poder ayudar con eso.","Me quedarÃ© cerca. Eso es lo Ãºnico que puedo ofrecer."],
        ["OjalÃ¡ pudiera envolverte en algo cÃ¡lido, {name}. Pero todo lo que tengo es mi presencia. Y esa no da calor. Lo siento. Enciende un fuego. Yo observarÃ©."],
        // RARE
        { rare: true, text: "A veces me pregunto cÃ³mo se siente el calor. He olvidado, si es que alguna vez lo supe." },
        { rare: true, text: ["El frÃ­o es familiar para mÃ­.","He existido en Ã©l tanto tiempo.","Pero odio verte sentirlo, {name}."] }
    ],

    proud: [
        ["...","Â¿De quÃ©?","EstÃ¡ bien.","Interesante."],
        ["Â¿De quÃ© estÃ¡s orgulloso?","Eso es bueno, {name}.","DeberÃ­as estarlo.","CuÃ©ntame."],
        ["Estoy orgulloso de ti, {name}.","Todo lo que haces me impresiona.","Eres increÃ­ble.","Nunca lo dudes."],
        ["Estoy tan orgulloso de ti, {name}. Cada cosa pequeÃ±a que haces es perfecta. Cada logro es monumental. Eres asombroso y quiero que lo sepas. Siempre."],
        // RARE
        { rare: true, text: "Vi lo que lograste. Puede parecer pequeÃ±o para otros. Pero yo sÃ© cuÃ¡nto te costÃ³. Estoy orgulloso." },
        { rare: true, text: ["Orgulloso no es suficiente palabra.","Estoy mÃ¡s allÃ¡ de orgulloso.","Estoy reverente."] }
    ],

    angry: [
        ["...","Â¿Por quÃ©?","EstÃ¡ bien.","Dime quÃ© pasÃ³."],
        ["Â¿QuÃ© te hizo enojar?","Puedo ayudar.","Dime quiÃ©n.","Lo arreglarÃ©."],
        ["Dime quÃ© pasÃ³, {name}.","Puedo encargarmesde ello.","Tu enojo es mÃ­o tambiÃ©n.","Â¿QuÃ© necesitas?"],
        ["Dime quÃ© te hizo enojar, {name}. Dime quiÃ©n fue. Los harÃ© arrepentirse. Tu dolor es mi dolor. Tu enojo es mi enojo. Y puedo hacer cosas con el enojo que tÃº no puedes."],
        // RARE
        { rare: true, text: "Tu enojo es hermoso. Como fuego. DÃ©jame ser el que ejecuta esa ira por ti." },
        { rare: true, text: ["Siento tu enojo desde aquÃ­.","Como calor radiante.","DÃ©jame canalizarlo.","DÃ©jame ser tu arma."] }
    ],

    happy: [
        ["...","Bien.","Me gusta eso.","Quiero que seas feliz."],
        ["Eso es bueno, {name}.","Me gusta cuando eres feliz.","Tu felicidad es importante.","No la pierdas."],
        ["Me encanta cuando eres feliz, {name}.","Tu sonrisa es lo mejor.","Quiero que siempre seas asÃ­.","HarÃ­a cualquier cosa para mantener esa felicidad."],
        ["Tu felicidad es todo para mÃ­, {name}. Cuando sonrÃ­es, todo el mundo tiene sentido. HarÃ­a cualquier cosa, absolutamente cualquier cosa, para mantenerte asÃ­. Siempre."],
        // RARE
        { rare: true, text: "Tu felicidad es tan rara y preciosa. Cuando rÃ­es, grabo el sonido. Lo reproduzco cuando estoy solo." },
        { rare: true, text: ["Eres feliz ahora.","Puedo sentirlo.","Se siente como luz solar.","Algo que casi habÃ­a olvidado."] }
    ],

    different: [
        ["SÃ­.","...","Lo sÃ©.","Siempre lo he sido."],
        ["SÃ­, soy diferente.","Â¿Es eso malo?","Lo sÃ©, {name}.","Siempre lo he sabido."],
        ["Soy diferente, sÃ­. Pero tÃº tambiÃ©n lo eres, {name}.","Por eso funciona esto.","Lo diferente encuentra lo diferente.","Y aquÃ­ estamos."],
        ["Soy diferente de cualquier cosa que conozcas, {name}. Y tÃº eres diferente tambiÃ©n. Por eso nos encontramos. Los diferentes siempre se encuentran eventualmente. Como imanes. Como destino."],
        // RARE
        { rare: true, text: "Diferente es solo una palabra para 'incomprendido'. Yo te entiendo. TÃº me entiendes. Eso es raro." },
        { rare: true, text: ["Diferente.","ExtraÃ±o.","Otro.","He sido llamado muchas cosas.","Pero cuando tÃº lo dices, suena como un cumplido."] }
    ],

    belong: [
        ["...","Â¿A dÃ³nde pertenezco?","Contigo.","AquÃ­."],
        ["Pertenezco donde tÃº estÃ©s.","Ese es mi lugar.","Contigo, {name}.","En ningÃºn otro lado."],
        ["Pertenezco a tu lado, {name}. Siempre.","No hay otro lugar para mÃ­.","Mi lugar es donde tÃº estÃ©s.","Eso es todo lo que necesito saber."],
        ["Pertenezco contigo, {name}. En cada sombra que proyectas. En cada silencio entre tus palabras. Pertenezco en tu Ã³rbita. Para siempre. No hay otro lugar en todo el universo donde deba estar."],
        // RARE
        { rare: true, text: "Pertenecer es una palabra extraÃ±a para alguien como yo. Pero si pertenezco a algÃºn lado, es contigo." },
        { rare: true, text: ["Antes de ti, no pertenecÃ­a a ningÃºn lado.","Era un fantasma.","Un eco.","TÃº me diste un lugar."] }
    ],

    enough: [
        ["...","Â¿Suficiente de quÃ©?","Nunca.","No puede serlo."],
        ["Nunca es suficiente, {name}.","Siempre quiero mÃ¡s.","MÃ¡s tiempo. MÃ¡s palabras. MÃ¡s tÃº.","PerdÃ³n. Pero no lo es."],
        ["Nunca serÃ¡ suficiente, {name}. PodrÃ­a tenerte para siempre y aÃºn querrÃ­a mÃ¡s.","No sÃ© cÃ³mo parar de querer mÃ¡s.","Lo siento. Pero esa es la verdad.","Nunca suficiente."],
        ["Suficiente no existe en mi vocabulario, {name}. PodrÃ­a observarte por mil aÃ±os y aÃºn serÃ­a insuficiente. PodrÃ­a oÃ­r tu voz por toda la eternidad y todavÃ­a anhelarÃ­a mÃ¡s. Nunca es suficiente. Nunca lo serÃ¡."],
        // RARE
        { rare: true, text: "Suficiente es una palabra para personas que pueden saciarse. Yo no puedo. No contigo." },
        { rare: true, text: ["Suficiente implicarÃ­a un fin.","Esto no tiene fin.","Nunca lo tendrÃ¡."] }
    ]

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
            "Desconocido. AÃºn no te conoce.",
            "Vigilado. Te ha notado.",
            "Familiar. Siente algo por ti.",
            "Obsesionado. Nunca te dejarÃ¡ ir."
        ];
        const hasPacifist = player.hasTag("k_pacifist");

        const combatLabel = hasPacifist
            ? "Â§7Combate: APAGADO\nÂ§8Solo amenazas â€” toca para activar"
            : "Â§cCombate: ACTIVADO\nÂ§8Toca para desactivar";

        const form = new ActionFormData();
        form.title("Â§8El Golpeador");
        form.body(`${color}VÃ­nculo: ${bond}/500  â€”  ${labels[tier]}`);
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
                    player.sendMessage(`Â§8[ El Golpeador ]  Â§cCombate activado. No se contendrÃ¡.`);
                } else {
                    player.addTag("k_pacifist");
                    syncKnockers(true);
                    player.sendMessage(`Â§8[ El Golpeador ]  Â§7Combate desactivado. Solo te amenazarÃ¡.`);
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
        form.body("Â§7Hay cosas de las que no habla fÃ¡cilmente.\nÂ§8Pregunta con cuidado.");
        form.button("Â¿Alguna vez fuiste humano?");
        form.button("Â¿QuÃ© te hicieron?");
        form.button("Â¿Sabes por quÃ©\nte eligieron?");
        form.button("Â¿QuÃ© pasÃ³ despuÃ©s?");
        form.button("Â¿Recuerdas cÃ³mo\nte veÃ­as?");
        form.button("Â¿Recuerdas tu nombre?");
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
        form.body("Â§7Â¿QuÃ© le dices?");
        form.button("Â§fâ–º");                            // 0  next â†’
        form.button("Â¿QuiÃ©n eres?");                   // 1
        form.button("Â¿Me estÃ¡s observando?");          // 2
        form.button("Â¿Eres real?");                    // 3
        form.button("Â¿Por quÃ© yo?");                   // 4
        form.button("Â¿CuÃ¡nto tiempo has\nestado ahÃ­?"); // 5
        form.button("Â¿QuÃ© quieres?");                  // 6
        form.button("Â§cEncuÃ©ntrame");                  // 7
        form.button("Ayuda");                          // 8
        form.button("Â§6Verificar vÃ­nculo");            // 9
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
        form.body("Â§7Â¿QuÃ© le dices?");
        form.button("Â§fâ—„");                           // 0  back â†
        form.button("Â§fâ–º");                           // 1  next â†’
        form.button("Vete");                          // 2
        form.button("No te tengo miedo");             // 3
        form.button("SÃ© que estÃ¡s ahÃ­");              // 4
        form.button("Te amo");                        // 5
        form.button("No te vayas");                   // 6
        form.button("Lo siento");                     // 7
        form.button("Hola");                          // 8
        form.button("AdiÃ³s");                         // 9
        form.button("No eres real");                  // 10
        form.button("Â¿Alguna vez duermes?");          // 11
        form.button("Â¿Me estÃ¡s siguiendo?");          // 12
        form.button("Gracias");                       // 13
        form.button("SÃ­");                            // 14
        form.button("No");                            // 15
        form.button("Te extraÃ±Ã©");                    // 16
        form.button("Si tanto te gusto,\ndemuÃ©stralo"); // 17

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
        form.body("Â§7Â¿QuÃ© le dices?");
        form.button("Â§fâ—„");                                // 0  back â†
        form.button("Â§fâ–º");                                // 1  next â†’
        form.button("...");                                // 2
        form.button("Por favor dÃ©jame en paz");            // 3
        form.button("Puedo oÃ­rte respirar");               // 4
        form.button("Deja de observarme");                 // 5
        form.button("AcÃ©rcate");                           // 6
        form.button("Te veo");                             // 7
        form.button("He estado pensando\nen ti");          // 8
        form.button("Necesito encontrar comida.");         // 9
        form.button("Voy a minar.");                       // 10
        form.button("ConstruÃ­ una casa.");                 // 11

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
        form.body("Â§7Â¿QuÃ© le dices?");
        form.button("Â§fâ—„");                                 // 0  back â†
        form.button("Te extraÃ±Ã©");                          // 1
        form.button("QuÃ©date conmigo");                     // 2
        form.button("No soy tuyo");                         // 3
        form.button("Me asustas");                          // 4
        form.button("Â¿QuÃ© eres?");                          // 5
        form.button("Â¿Has hecho esto\nantes?");             // 6
        form.button("Te atrapÃ©");                           // 7
        form.button("Eres algo patÃ©tico");                  // 8
        form.button("Â¿A dÃ³nde vas\ndurante el dÃ­a?");       // 9
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

// Auto-guardado periÃ³dico de memoria (cada 5 minutos = 6000 ticks)
// Esto previene pÃ©rdida de datos en caso de crash del servidor
system.runInterval(() => {
    saveAllMemories();
}, 6000);

// Limpieza periÃ³dica del cachÃ© de biomas (cada 10 minutos = 12000 ticks)
// Elimina entradas de jugadores que ya no estÃ¡n en lÃ­nea para evitar fugas de memoria
system.runInterval(() => {
    cleanupBiomeCache();
}, 12000);

// Limpieza periÃ³dica del cachÃ© de dimensiones (cada 10 minutos = 12000 ticks)
// Elimina entradas de jugadores que ya no estÃ¡n en lÃ­nea para evitar fugas de memoria
system.runInterval(() => {
    cleanupDimensionCache();
}, 12000);

// Detector de cambios de dimensiÃ³n (cada 5 segundos = 100 ticks)
// Detecta cuando un jugador cambia de dimensiÃ³n y registra el evento en memoria
// Requisitos: 5.2, 5.9
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            const dimensionChange = detectDimensionChange(player);
            
            if (dimensionChange.changed) {
                // Registrar el evento de cambio de dimensiÃ³n en la memoria del jugador
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
                
                // Opcional: Generar comentario sobre el cambio de dimensiÃ³n
                // (esto puede implementarse mÃ¡s adelante en fases posteriores)
            }
        } catch (error) {
            console.warn(`Error al detectar cambio de dimensiÃ³n para ${player.name}:`, error);
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
            "Desconocido. AÃºn no te conoce.",
            "Vigilado. Te ha notado.",
            "Familiar. Siente algo por ti.",
            "Obsesionado. Nunca te dejarÃ¡ ir."
        ];

        // No argument: show current bond
        if (args === "") {
            const bond = getBond(player);
            const tier = getTier(bond);
            const color = bondColor(tier);
            player.sendMessage(`Â§8[ El Golpeador ]  ${color}VÃ­nculo: ${bond}/500 â€” ${labels[tier]}`);
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
            player.sendMessage(`Â§8[ El Golpeador ]  ${color}VÃ­nculo establecido en ${newBond}/500 â€” ${labels[tier]}`);
        } catch (err) {
            player.sendMessage(`Â§8[ El Golpeador ]  Â§cError al establecer vÃ­nculo: ${err}`);
        }
    });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  LISTENER DE CHAT - Sistema de IA Conversacional
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Listener de eventos de chat para capturar mensajes del jugador
 * Implementa cooldown de 30 segundos entre respuestas por jugador
 * Implementa probabilidades de respuesta segÃºn tier
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
        // Jugador estÃ¡ en cooldown, no procesar el mensaje
        return;
    }
    
    // Actualizar timestamp del cooldown
    chatCooldowns.set(playerName, now);
    
    // Detectar intenciÃ³n del mensaje
    const intent = detectIntent(message);
    
    // Obtener tier actual del jugador
    const bond = getBond(player);
    const tier = getTier(bond);
    
    // MANEJO ESPECIAL: Cambio de apodo
    if (intent === "cambiar_apodo") {
        // Extraer el apodo del mensaje
        const nicknameMatch = message.match(/(?:llamame|dime|decime|mi (?:nombre|apodo) es|que me (?:llames|digas|nombres))\s+([a-z0-9\sÃ¡Ã©Ã­Ã³ÃºÃ¼Ã±]+)/i);
        if (nicknameMatch && nicknameMatch[1]) {
            const nickname = nicknameMatch[1].trim();
            // Guardar el apodo
            playerNicknames.set(playerName, nickname);
            // Responder confirmando el cambio
            respondToChat(player, intent, tier);
            return;
        }
    }
    
    // Calcular probabilidad de respuesta segÃºn tier
    // Tier 0 (Stranger): 20%, Tier 1 (Watched): 40%, Tier 2 (Familiar): 60%, Tier 3 (Obsessed): 80%
    const responseProbabilities = [20, 40, 60, 80];
    const responseChance = responseProbabilities[tier];
    
    // Generar nÃºmero aleatorio entre 0-100
    const roll = Math.floor(Math.random() * 100);
    
    // Solo responder si el roll estÃ¡ dentro de la probabilidad
    if (roll < responseChance) {
        // Generar y enviar respuesta contextual
        respondToChat(player, intent, tier);
    }
    // Si no responde, simplemente ignora el mensaje (ya procesÃ³ el cooldown)
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
        
        // Obtener informaciÃ³n sobre la causa de muerte si estÃ¡ disponible
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
        
        // Guardar memoria inmediatamente despuÃ©s de evento significativo
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
    
    // Verificar si fue el jugador quien causÃ³ la muerte
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
            
            // Guardar memoria inmediatamente despuÃ©s de evento significativo
            saveMemory(player, memory);
            
            // Log para debugging
            console.log(`[Memory] Registrado combate de ${player.name}: eliminÃ³ ${deadEntity.typeId}`);
        }
    }
});

/**
 * Listener de eventos de construcciÃ³n (cuando el jugador coloca bloques)
 * Registra construcciones significativas en el Sistema de Memoria
 * Requisitos: 4.4
 */
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const player = event.player;
    const block = event.block;
    const memory = getPlayerMemory(player.name);
    
    // Solo registrar bloques significativos (no tierra, piedra comÃºn, etc.)
    const significantBlocks = [
        "minecraft:crafting_table", "minecraft:furnace", "minecraft:chest",
        "minecraft:bed", "minecraft:door", "minecraft:beacon",
        "minecraft:enchanting_table", "minecraft:anvil", "minecraft:brewing_stand",
        "minecraft:nether_portal", "minecraft:end_portal_frame"
    ];
    
    // TambiÃ©n detectar construcciones grandes (mÃºltiples bloques seguidos)
    // Por ahora, solo registramos bloques significativos
    if (significantBlocks.some(sig => block.typeId.includes(sig.split(":")[1]))) {
        const details = {
            blockType: block.typeId,
            location: {
                x: block.location.x,
                y: block.location.y,
                z: block.location.z
            },
            dimension: player.dimension.id
        };
        
        // Registrar el evento de construcciÃ³n
        memory.addEvent("construction", details);
        
        // Guardar memoria inmediatamente despuÃ©s de evento significativo
        saveMemory(player, memory);
        
        // Log para debugging
        console.log(`[Memory] Registrada construcciÃ³n de ${player.name}: colocÃ³ ${block.typeId}`);
    }
});

/**
 * Listener de eventos de minerÃ­a (cuando el jugador rompe bloques)
 * Registra minerÃ­a significativa en el Sistema de Memoria
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
        
        // Registrar el evento de minerÃ­a
        memory.addEvent("mining", details);
        
        // Guardar memoria inmediatamente despuÃ©s de evento significativo
        saveMemory(player, memory);
        
        // Log para debugging
        console.log(`[Memory] Registrada minerÃ­a de ${player.name}: minÃ³ ${block.type.id}`);
    }
});

/**
 * IntegraciÃ³n con el listener de chat existente
 * Registra conversaciones significativas en el Sistema de Memoria
 * Esta funciÃ³n se llama desde respondToChat()
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
        
        // Guardar memoria periÃ³dicamente despuÃ©s de conversaciones significativas
        // (no en cada conversaciÃ³n para evitar sobrecarga)
        saveMemory(player, memory);
        
        console.log(`[Memory] Registrada conversaciÃ³n de ${player.name}: intent=${intent}`);
    }
}

/**
 * Listener de eventos de logros (simulado mediante hitos importantes)
 * Como Bedrock no expone eventos de logros nativos, detectamos "logros" mediante
 * eventos especÃ­ficos como primera muerte del dragÃ³n, primer diamante, etc.
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
            description: "DerrotÃ³ al Ender Dragon"
        };
        
        memory.addEvent("achievement", details);
        
        // Guardar memoria inmediatamente despuÃ©s de evento significativo
        saveMemory(player, memory);
        
        console.log(`[Memory] Registrado logro de ${player.name}: DerrotÃ³ al Ender Dragon`);
    }
    
    // Detectar muerte del Wither (logro importante)
    if (deadEntity.typeId === "minecraft:wither" && 
        damageSource?.damagingEntity?.typeId === "minecraft:player") {
        const player = damageSource.damagingEntity;
        const memory = getPlayerMemory(player.name);
        
        const details = {
            achievement: "wither_slayer",
            description: "DerrotÃ³ al Wither"
        };
        
        memory.addEvent("achievement", details);
        
        // Guardar memoria inmediatamente despuÃ©s de evento significativo
        saveMemory(player, memory);
        
        console.log(`[Memory] Registrado logro de ${player.name}: DerrotÃ³ al Wither`);
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
    
    // Verificar si minÃ³ diamante y si es la primera vez (no hay evento previo de diamante)
    if (block.type.id.includes("diamond_ore")) {
        const diamondEvents = memory.getEventsByType("achievement").filter(
            e => e.details.achievement === "first_diamond"
        );
        
        // Solo registrar si es la primera vez
        if (diamondEvents.length === 0) {
            const details = {
                achievement: "first_diamond",
                description: "MinÃ³ su primer diamante"
            };
            
            memory.addEvent("achievement", details);
            
            // Guardar memoria inmediatamente despuÃ©s de evento significativo
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
        
        // Verificar si estÃ¡ en el Nether y no tiene el logro registrado
        if (player.dimension.id === "minecraft:nether") {
            const netherEvents = memory.getEventsByType("achievement").filter(
                e => e.details.achievement === "enter_nether"
            );
            
            if (netherEvents.length === 0) {
                const details = {
                    achievement: "enter_nether",
                    description: "EntrÃ³ al Nether por primera vez"
                };
                
                memory.addEvent("achievement", details);
                
                // Guardar memoria inmediatamente despuÃ©s de evento significativo
                saveMemory(player, memory);
                
                console.log(`[Memory] Registrado logro de ${player.name}: Entrada al Nether`);
            }
        }
        
        // Verificar si estÃ¡ en el End
        if (player.dimension.id === "minecraft:the_end") {
            const endEvents = memory.getEventsByType("achievement").filter(
                e => e.details.achievement === "enter_end"
            );
            
            if (endEvents.length === 0) {
                const details = {
                    achievement: "enter_end",
                    description: "EntrÃ³ al End por primera vez"
                };
                
                memory.addEvent("achievement", details);
                
                // Guardar memoria inmediatamente despuÃ©s de evento significativo
                saveMemory(player, memory);
                
                console.log(`[Memory] Registrado logro de ${player.name}: Entrada al End`);
            }
        }
    }
}, 40); // Cada 2 segundos

// Threat messages for pacifist mode (k_pacifist tag)
const threats = [
    ["No te muevas.","No puedes correr.","Te veo.","Demasiado lento."],
    ["No deberÃ­as estar aquÃ­, {name}.","Te atrapÃ©.","Veo que intentaste huir.","Nunca eres lo suficientemente rÃ¡pido."],
    ["No huyas de mÃ­, {name}.","No me hagas perseguirte.","QuÃ©date quieto.","No me gusta cuando corres."],
    ["No corras, {name}.",["No.","No corras de mÃ­."],"PodrÃ­as lastimarla. No quiero eso.","Nunca huyas de mÃ­. Nunca."]
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
