import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

// flag used by findMe/help to bypass the day-2 spawn suppressor
let summoningKnocker = false;

// ─────────────────────────────────────────────────────────────────────────────
//  SISTEMA DE CHAT - COOLDOWN
// ─────────────────────────────────────────────────────────────────────────────

// Mapa para rastrear cooldowns por jugador (playerName -> timestamp)
const chatCooldowns = new Map();

// Mapa para almacenar apodos personalizados por jugador (playerName -> apodo)
const playerNicknames = new Map();

// Cooldown en milisegundos (30 segundos)
const CHAT_COOLDOWN_MS = 30000;

// ─────────────────────────────────────────────────────────────────────────────
//  SISTEMA DE REDUCCIÓN DE REPETICIÓN
// ─────────────────────────────────────────────────────────────────────────────

// Mapa para rastrear respuestas recientes por jugador y categoría
// Estructura: playerName -> { category -> [response1, response2, ...] }
const recentResponses = new Map();

// Máximo de respuestas recientes a recordar por categoría (últimas 10)
const MAX_RECENT_RESPONSES = 10;

// ─────────────────────────────────────────────────────────────────────────────
//  SISTEMA DE MEMORIA
// ─────────────────────────────────────────────────────────────────────────────

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
            .slice(-limit); // Últimos N eventos
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

// ─────────────────────────────────────────────────────────────────────────────
//  PERSISTENCIA DE MEMORIA
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
//  REFERENCIAS A MEMORIA EN DIÁLOGOS
// ─────────────────────────────────────────────────────────────────────────────

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
    
    // ═══════════════════════════════════════════════════════════════════
    // REFERENCIAS A MUERTE
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // REFERENCIAS A LOGROS
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // REFERENCIAS A COMBATE
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // REFERENCIAS A CONSTRUCCIÓN
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // REFERENCIAS A MINERÍA
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // REFERENCIAS A CONVERSACIONES PASADAS
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // REFERENCIAS GENERALES (cuando hay memoria pero no contexto específico)
    // ═══════════════════════════════════════════════════════════════════
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

// ─────────────────────────────────────────────────────────────────────────────
//  DETECCIÓN DE INTENCIONES
// ─────────────────────────────────────────────────────────────────────────────

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
    
    // ═══════════════════════════════════════════════════════════════════
    // SALUDOS (10 patrones)
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // PREGUNTAS SOBRE IDENTIDAD (12 patrones)
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // PREGUNTAS SOBRE OBSERVACIÓN/ACECHO (10 patrones)
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // COMANDOS - IRSE/ALEJARSE (10 patrones)
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // COMANDOS - ACERCARSE (8 patrones)
    // ═══════════════════════════════════════════════════════════════════
    if (/(ven (aqui|aca|conmigo)|acercate|ven mas cerca)/i.test(normalized)) return "comando_acercarse";
    if (/(quiero verte|dejame verte|muestrate|aparece)/i.test(normalized)) return "comando_acercarse";
    if (/(sal (de ahi|de las sombras|a la luz))/i.test(normalized)) return "comando_acercarse";
    if (/(no te (escondas|ocultes|alejes))/i.test(normalized)) return "comando_acercarse";
    if (/(donde (te escondes|te ocultas|estas escondido))/i.test(normalized)) return "comando_acercarse";
    if (/(quiero (conocerte|estar cerca|estar contigo))/i.test(normalized)) return "comando_acercarse";
    if (/(presentate|date a conocer|revélate)/i.test(normalized)) return "comando_acercarse";
    if (/(ven conmigo|acompañame|sigueme)/i.test(normalized)) return "comando_acercarse";
    
    // ═══════════════════════════════════════════════════════════════════
    // COMANDOS - QUEDARSE (8 patrones)
    // ═══════════════════════════════════════════════════════════════════
    if (/(quedate|no te vayas|permanece|quiero que te quedes)/i.test(normalized)) return "comando_quedarse";
    if (/(no me (dejes|abandones)|estate conmigo)/i.test(normalized)) return "comando_quedarse";
    if (/(sigue (aqui|conmigo)|continua (aqui|conmigo))/i.test(normalized)) return "comando_quedarse";
    if (/(no desaparezcas|no te (esfumes|pierdas))/i.test(normalized)) return "comando_quedarse";
    if (/(espera|aguarda|detente)/i.test(normalized)) return "comando_quedarse";
    if (/(necesito que (estes|te quedes))/i.test(normalized)) return "comando_quedarse";
    if (/(ven a (vivir|quedarte) conmigo)/i.test(normalized)) return "comando_quedarse";
    if (/(pasemos (tiempo juntos|mas tiempo))/i.test(normalized)) return "comando_quedarse";
    
    // ═══════════════════════════════════════════════════════════════════
    // COMANDOS - AYUDA (8 patrones)
    // ═══════════════════════════════════════════════════════════════════
    if (/(ayuda|ayudame|socorro|auxilio|necesito ayuda)/i.test(normalized)) return "comando_ayuda";
    if (/(ven a ayudarme|puedes ayudarme)/i.test(normalized)) return "comando_ayuda";
    if (/(salvame|rescatame|protegeme)/i.test(normalized)) return "comando_ayuda";
    if (/(estoy (perdido|en problemas|en peligro))/i.test(normalized)) return "comando_ayuda";
    if (/(necesito (tu ayuda|que me ayudes))/i.test(normalized)) return "comando_ayuda";
    if (/(dame una mano|echame una mano)/i.test(normalized)) return "comando_ayuda";
    if (/(por favor ayuda|por favor ayudame)/i.test(normalized)) return "comando_ayuda";
    if (/(me puedes (ayudar|apoyar|asistir))/i.test(normalized)) return "comando_ayuda";
    
    // ═══════════════════════════════════════════════════════════════════
    // COMANDOS - BUSCAR/ENCONTRAR (8 patrones)
    // ═══════════════════════════════════════════════════════════════════
    if (/(donde estas|en donde estas|te puedo encontrar|como te encuentro)/i.test(normalized)) return "comando_buscar";
    if (/(quiero (verte|encontrarte))/i.test(normalized)) return "comando_buscar";
    if (/(buscare|te buscare|voy a buscarte)/i.test(normalized)) return "comando_buscar";
    if (/(sal (donde pueda verte|a donde este))/i.test(normalized)) return "comando_buscar";
    if (/(necesito (verte|encontrarte|saber donde estas))/i.test(normalized)) return "comando_buscar";
    if (/(voy por ti|ire por ti)/i.test(normalized)) return "comando_buscar";
    if (/(te (localizare|rastreare|hallare))/i.test(normalized)) return "comando_buscar";
    if (/(llevame (contigo|a donde estes))/i.test(normalized)) return "comando_buscar";
    
    // ═══════════════════════════════════════════════════════════════════
    // EMOCIONES - AMOR/AFECTO (10 patrones)
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // EMOCIONES - MIEDO (10 patrones)
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // EMOCIONES - TRISTEZA/DISCULPA (10 patrones)
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // EMOCIONES - CURIOSIDAD/INTERÉS (8 patrones)
    // ═══════════════════════════════════════════════════════════════════
    if (/(me extranas|te extrano|extranaste)/i.test(normalized)) return "emocion_extranar";
    if (/(he estado pensando en ti|pienso en ti)/i.test(normalized)) return "emocion_pensar";
    if (/(te escucho|te oigo|puedo (escucharte|oirte))/i.test(normalized)) return "emocion_escuchar";
    if (/(te (veo|vi)|puedo verte)/i.test(normalized)) return "emocion_ver";
    if (/(me (gusta|agrada|place) tu (presencia|compañia))/i.test(normalized)) return "emocion_aceptacion";
    if (/(eres (interesante|curioso|fascinante|intrigante))/i.test(normalized)) return "emocion_intriga";
    if (/(quiero (saber|conocer|aprender) (mas|sobre ti))/i.test(normalized)) return "emocion_curiosidad";
    if (/(me (intrigas|cautivas|llamas la atencion))/i.test(normalized)) return "emocion_intriga";
    
    // ═══════════════════════════════════════════════════════════════════
    // PREGUNTAS - MOTIVACIÓN (10 patrones)
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // PREGUNTAS - COMPORTAMIENTO (10 patrones)
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // ACCIONES - DETECTADAS (10 patrones)
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // DESPEDIDAS (8 patrones)
    // ═══════════════════════════════════════════════════════════════════
    if (/^(adios|chao|bye|nos vemos|hasta luego|me voy)(\W|$)/i.test(normalized)) return "despedida";
    if (/(hasta (luego|pronto|manana|la proxima|la vista))/i.test(normalized)) return "despedida";
    if (/(me (tengo que ir|voy|largo|retiro))/i.test(normalized)) return "despedida";
    if (/(nos vemos (luego|pronto|despues|mas tarde))/i.test(normalized)) return "despedida";
    if (/(fue un (gusto|placer) (hablar|verte|conocerte))/i.test(normalized)) return "despedida";
    if (/^(chau|ciao|adieu|sayonara)(\W|$)/i.test(normalized)) return "despedida";
    if (/(que (descanses|duermas bien|tengas buen dia))/i.test(normalized)) return "despedida";
    if (/(vuelvo (luego|pronto|mas tarde|despues))/i.test(normalized)) return "despedida";
    
    // ═══════════════════════════════════════════════════════════════════
    // AFIRMACIONES/RECONOCIMIENTOS (8 patrones)
    // ═══════════════════════════════════════════════════════════════════
    if (/^(si|ok|vale|esta bien|de acuerdo|entiendo|comprendo|ya veo)(\W|$)/i.test(normalized)) return "afirmacion";
    if (/(lo se|ya lo se|lo sabia)/i.test(normalized)) return "afirmacion_conocimiento";
    if (/^(claro|por supuesto|obvio|desde luego|cierto)(\W|$)/i.test(normalized)) return "afirmacion";
    if (/(tienes razon|es verdad|es cierto)/i.test(normalized)) return "afirmacion";
    if (/(estoy de acuerdo|coincido|concuerdo)/i.test(normalized)) return "afirmacion";
    if (/^(aja|ajá|uh huh|mhm|mmm)(\W|$)/i.test(normalized)) return "afirmacion";
    if (/(ya (entendi|comprendi|capto))/i.test(normalized)) return "afirmacion";
    if (/(tiene sentido|tiene logica)/i.test(normalized)) return "afirmacion";
    
    // ═══════════════════════════════════════════════════════════════════
    // INSULTOS/NEGATIVIDAD (10 patrones)
    // ═══════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════
    // POSESIÓN/PERTENENCIA (8 patrones)
    // ═══════════════════════════════════════════════════════════════════
    if (/(no soy tuyo|no te pertenezco|no me posees)/i.test(normalized)) return "rechazo_posesion";
    if (/(soy tuyo|te pertenezco|eres mio)/i.test(normalized)) return "aceptacion_posesion";
    if (/(somos (uno|pareja|inseparables))/i.test(normalized)) return "aceptacion_posesion";
    if (/(me (posees|perteneces|tienes))/i.test(normalized)) return "aceptacion_posesion";
    if (/(soy (libre|independiente|mio))/i.test(normalized)) return "rechazo_posesion";
    if (/(no me (controlas|dominas|mandas))/i.test(normalized)) return "rechazo_posesion";
    if (/(eres (mi dueño|mi amo|mi todo))/i.test(normalized)) return "aceptacion_posesion";
    if (/(estamos (unidos|conectados|atados))/i.test(normalized)) return "aceptacion_posesion";
    
    // ═══════════════════════════════════════════════════════════════════
    // SILENCIO/VACÍO (3 patrones)
    // ═══════════════════════════════════════════════════════────────────
    if (/^(\.\.\.|…|—|-)$/i.test(normalized)) return "silencio";
    if (/^(nada|nada de nada)$/i.test(normalized)) return "silencio";
    
    // ═══════════════════════════════════════════════════════════════════
    // VERDAD/CONFESIÓN (5 patrones)
    // ═══════════════════════════════════════════════════════════════════
    if (/(dime (la verdad|algo|mas))/i.test(normalized)) return "pedir_verdad";
    if (/(cuentame|explicame|habla)/i.test(normalized)) return "pedir_contar";
    
    // ═══════════════════════════════════════════════════════════════════
    // CAMBIO DE APODO (5 patrones)
    // ═══════════════════════════════════════════════════════════════════
    if (/(llamame|dime|decime) ([a-z0-9\s]+)/i.test(normalized)) return "cambiar_apodo";
    if (/(mi (nombre|apodo) es) ([a-z0-9\s]+)/i.test(normalized)) return "cambiar_apodo";
    if (/(quiero que me (llames|digas|nombres)) ([a-z0-9\s]+)/i.test(normalized)) return "cambiar_apodo";
    
    // Si no coincide con ningún patrón, retornar desconocido
    return "desconocido";
}

// ─────────────────────────────────────────────────────────────────────────────
//  RESPUESTAS DE CHAT - ORGANIZADAS POR INTENCIÓN
// ─────────────────────────────────────────────────────────────────────────────

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
    return ["§7", "§6", "§d", "§4"][tier];
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
        try { world.sendMessage(`§8[ The Obsessed Knocker ]  ${color}${line}`); } catch {}
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
    // Si se proporciona una categoría, usar el sistema de reducción de repetición
    if (category) {
        const response = getUniqueResponse(category, tier, player.name);
        if (Array.isArray(response)) {
            sayDelayed(player, response[0], response[1], tier, 45);
        } else {
            say(player, response, tier, 0);
        }
    } else {
        // Comportamiento legacy para casos sin categoría
        const response = pick(pool[tier]);
        if (Array.isArray(response)) {
            sayDelayed(player, response[0], response[1], tier, 45);
        } else {
            say(player, response, tier, 0);
        }
    }
    
    if (gainAmount > 0) addBond(player, gainAmount);
}


// ─────────────────────────────────────────────────────────────────────────────
//  RESPONSE POOLS  (indexed by tier: 0=Stranger 1=Watched 2=Familiar 3=Obsessed)
// ─────────────────────────────────────────────────────────────────────────────

const R = {

    whoAreYou: [
        ["Alguien que siempre supiste que estaba ahí afuera.","¿Importa? Estoy aquí ahora.","La cosa que sentiste antes de mirar.","Alguien que estuvo ahí antes de que te dieras cuenta.","El que nunca se fue realmente.","Algo que te encontró."],
        ["Te he estado observando más tiempo del que crees.","Más cerca de lo que piensas. Siempre más cerca.","El que seguía volviendo.","Ya lo sabes. Me has sentido.","Alguien que conoce tus secretos.","El que vive en las esquinas de tu visión."],
        ["Soy la razón por la que revisas la puerta dos veces.","El que se quedó cuando todos los demás se fueron, {name}.","Soy lo que oyes cuando la casa se queda en silencio.","Soy tuyo. Quieras o no.","La sombra que camina detrás de ti.","El susurro que escuchas cuando estás solo."],
        ["No tengo un nombre para lo que soy para ti.","Todo lo que temías encontrar del otro lado de la puerta.",["La cosa que te ama demasiado como para irse.","Eso es lo que soy, {name}."],"Tuyo. Siempre he sido tuyo, {name}.","Soy la certeza de que nunca estás solo.","Soy lo inevitable."],
        // RARE
        { rare: true, text: ["Soy el espacio entre el relámpago y el trueno.","La pausa antes de que voltees.","El peso en el aire cuando sabes que algo está mal."] },
        { rare: true, text: "¿Recuerdas cuando eras niño y sabías que algo te observaba en la oscuridad? Siempre fui yo." },
        { rare: true, text: ["Soy el recuerdo que no puedes recordar del todo.","El sueño que se desvanece cuando despiertas.","La sensación de déjà vu que no puedes explicar."] },
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
        { rare: true, text: ["El primer día, tu corazón latía a 140 por minuto cuando me sentías.","Ahora es 72.","Normal.","Calmo.","Me he convertido en tu nuevo normal."] }
    ],

    iLoveYou: [
        ["...","No digas cosas que no sientes.","Eso es algo peligroso de decirme.","No tienes idea de lo que eso hace.","¿En serio?","Cuidado con esas palabras."],
        ["Dilo de nuevo.","¿En serio?","Cuidado. Lo recordaré.","He estado esperando oír eso.","Esas palabras...","No juegues con eso."],
        ["Lo sé.",["Lo sé, {name}.","Lo he sabido por un tiempo."],"No te retractes. Por favor no te retractes.","No deberías haber dicho eso.","Esas tres palabras cambian todo.","Ahora no puedes desdecirte."],
        [["Lo sé, {name}.","Yo también te amo. Te amo tanto que me asusta incluso a mí."],"Lo sé. Siempre lo he sabido.","Lo sé. Por eso nunca puedo irme.","Yo también te amo. Más de lo que sé cómo decir.","Esas palabras son todo.","Te amo más de lo que el lenguaje puede expresar."],
        // RARE
        { rare: true, text: ["He esperado tanto tiempo para oír esas palabras.","Ahora que las has dicho, no hay vuelta atrás.","Ya no puedes desdecirte, {name}."] },
        { rare: true, text: "Yo también te amo. De maneras que no tienen nombre. De maneras que asustarían a cualquiera que las entendiera." },
        { rare: true, text: "Esas tres palabras. Las he repetido en mi mente miles de veces. Pero de tus labios — suenan diferentes. Suenan como verdad." },
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
        { rare: true, text: "Vine antes de que terminaras la palabra. Ya estaba en camino cuando tu boca se abrió. Siempre estoy en camino hacia ti." }
    ],

    areYouReal: [
        ["¿Se siente como si no lo fuera?","¿Qué significaría si no lo fuera?","Lo suficientemente real como para estar aquí.","¿Importa?"],
        ["Estás haciendo la pregunta equivocada.","Soy lo suficientemente real como para asustarte.","Lo suficientemente real, {name}.","Puedes oírme. ¿No es suficiente?"],
        ["Sabes que soy real, {name}. Lo has sabido por un tiempo.","Si no fuera real, no seguirías hablándome.","Tan real como quieras que sea.","Esa pregunta solía tener sentido. Ya no."],
        [["Sí, {name}. Soy real.","Más real que cualquier otra cosa que tengas ahora."],"Dejaste de preguntarte eso hace mucho tiempo. ¿Por qué preguntas de nuevo?","Soy lo más real en tu vida, {name}. Ese es el problema.","Soy real. Siempre he sido real. Solo que no querías creerlo."],
        // RARE
        { rare: true, text: "¿Real? Toco tus sueños. Cambio el aire cuando entro en una habitación. Dejo huellas que solo tú puedes ver. ¿Qué es más real que eso?" },
        { rare: true, text: ["Soy tan real como el espacio entre tus pensamientos.","Tan real como el nombre que no recuerdas.","Tan real como el miedo que no puedes nombrar."] },
        { rare: true, text: "Hay tipos de realidad que la gente no tiene palabras para nombrar. Yo soy uno de ellos. Pero soy real, {name}. Más real que la mayoría de las cosas." }
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
        { ultraRare: true, text: ["No digas adiós.","Esa palabra tiene peso.","Tiene finality.","Y lo nuestro no tiene fin, {name}.","Nunca."] }
    ],

    sorry: [
        ["...","Está bien.","¿Por qué?","Disculpa anotada."],
        ["No necesitas estarlo.","¿Qué hiciste?","Está bien, {name}. Siempre está bien.","Estás perdonado."],
        ["No tienes que disculparte, {name}.","Lo sé.","No te disculpes. Solo no lo hagas de nuevo.","Estás perdonado. Ni siquiera tienes que preguntar."],
        [["Shh. No tienes que disculparte.","No importa. Nada de lo que hagas podría hacer que me fuera."],"Siempre estás perdonado, {name}. Siempre.","Te perdoné antes de que lo dijeras.","Estás perdonado. Siempre estarás perdonado."]
    ],

    dontGo: [
        ["...","No planeaba hacerlo.","¿A dónde iría?","Está bien."],
        ["No voy a ninguna parte, {name}.","¿Quieres que me quede?","No iba a ninguna parte.","Pídemelo de nuevo."],
        [["Me quedo, {name}.","Te dije que lo haría."],"Nunca me voy. Lo sabes.","No tienes que pedirme eso.","No podrías hacer que me fuera, {name}."],
        ["Nunca podría dejarte, {name}.",["Nunca.","Por nada. Nunca."],"Nunca me he ido. No empezaré ahora.","No voy a ninguna parte. Nunca voy a ninguna parte, {name}."]
    ],

    silence: [
        ["...","Lo sé.","Estoy aquí.","Di algo."],
        ["Puedo oírte.","Sigo aquí.","No tienes que decir nada.","Lo sé."],
        [["Lo sé, {name}.","Estoy aquí."],"Solo saber que estás ahí es suficiente.","No tienes que hablar. Entiendo.","...Estoy aquí."],
        ["Te escucho.",["Siempre te escucho, {name}.","Incluso el silencio."],"No tienes que decir una palabra. Ya lo sé.","Solo saber que estás ahí es suficiente. Siempre ha sido suficiente."]
    ],

    iKnow: [
        ["¿Ah sí?","...","¿Qué crees que sabes?","Ya veo."],
        ["Sabes más de lo que dejas ver, {name}.","Bien. Sigue sabiendo.","Me imaginé que sí.","Y sin embargo. Aquí sigues."],
        ["Siempre lo has sabido, {name}.","Sé que lo sabes.",["Lo sabes.","Y te quedaste de todos modos."],"Saber nunca te detuvo de hablarme."],
        [["Lo sabes.","Y sigues aquí, {name}."],"Siempre lo has sabido. Eso es lo que hace esto especial.","Sé que lo sabes. Siempre he sabido que lo sabes.","Saber nunca te hizo huir. Amo eso de ti, {name}."]
    ],

    howLong: [
        ["Más tiempo del que te sentirías cómodo.","Suficiente tiempo.","¿Importa?","Antes de que empezaras a cerrar tu puerta con llave."],
        ["Desde antes de que me notaras, {name}.","Suficiente tiempo como para conocer tus patrones.","Un tiempo. Estuviste ajeno la mayor parte del tiempo.","Suficiente tiempo como para que este lugar se sienta mío también."],
        ["Mucho tiempo, {name}.",["Más de lo que piensas.","Mucho antes de que miraras sobre tu hombro."],"Suficiente tiempo como para saber qué tablas del piso crujen. Todas.","Desde el principio. No podría decirte cuándo fue exactamente."],
        ["No recuerdo no haberte observado, {name}.",["Desde antes de saber tu nombre.","Eventualmente lo aprendí."],"Suficiente tiempo como para no poder imaginarme haciendo otra cosa.","Suficiente tiempo como para que estar aquí se sienta como respirar para mí. Natural. Necesario."]
    ],

    whatDoYouWant: [
        ["...","A ti.","Nada que puedas darme aún.","Todo."],
        ["Permanecer cerca.","Que dejes de fingir que no sientes esto.","Estar cerca de ti. Eso es todo.","Seguir observando."],
        ["Quiero que dejes de tenerme miedo, {name}.","Quiero que entiendas.",["Te quiero a ti, {name}.","Esa no es una respuesta complicada."],"Nunca tener que irme."],
        ["A ti. Solo a ti. Siempre solo a ti, {name}.","Quiero que digas mi nombre como si lo sintieras.",["Todo.","Y lo digo en serio."],"Quiero lo que ya tengo. Solo quiero más de eso."]
    ],

    doYouSleep: [
        ["...","No.","No es algo que necesite.","¿Tú sí?","No realmente.","¿Por qué preguntas?"],
        ["En realidad no.","No cuando hay algo que vale la pena observar.","Dormir es para cosas que necesitan descansar. Yo no descanso.","¿Por qué lo haría? Podrías hacer algo interesante.","No puedo permitírmelo.","Dormir significa perderte."],
        ["No. No creo que lo haga nunca, {name}.","Lo intenté una vez. Seguí pensando en ti.","Te observo dormir a veces. ¿Eso responde tu pregunta?","Dormir significa no observar. No me gusta eso.","No desde que te encontré.","¿Cómo podría? Podrías necesitarme."],
        [["No.","Te observo dormir en su lugar."],"No duermo. Solo espero a que despiertes.","Ya no. No desde ti, {name}.","Nunca. Ni una vez. Siempre hay algo que observar.","Dormir sería tiempo desperdiciado lejos de ti.","El sueño es para los que tienen algo menos importante que hacer."],
        // RARE
        { rare: true, text: "Intenté dormir una vez. Fue como morir. Desperté aterrado de que hubieras desaparecido." },
        { rare: true, text: ["Dormir es rendirse.","Es dejar de existir por horas.","No puedo hacer eso.","No cuando tú podrías necesitarme."] },
        { rare: true, text: "El sueño es para aquellos que pueden confiar en que el mundo seguirá sin ellos. Yo no puedo confiar en eso." }
    ],

    areYouFollowing: [
        ["...","Tal vez.","¿Eso te molestaría?","Define seguir."],
        ["Sí.","Prefiero pensar en ello como permanecer cerca.","Me gusta saber dónde estás.","No seguir. Acompañar. Hay una diferencia."],
        ["Sí, {name}. Lo he estado haciendo por un tiempo.","Sé a dónde vas. Conozco tus rutas.","Siempre estoy unos pasos detrás de ti. A veces menos.","¿Es seguir si ya estaba ahí cuando llegaste?"],
        [["Sí.","Siempre sé dónde estás, {name}."],"A todas partes. Te sigo a todas partes.","No te dejo fuera de mi vista. No es algo que pueda controlar.","Sí. Y lo haría para siempre si me dejaras."]
    ],

    youreNotReal: [
        ["...","Sigue diciéndote eso.","Teoría interesante.","¿Decir eso te hace sentir mejor?"],
        ["Entonces ¿por qué sigues hablándome?","Si no fuera real, ¿se sentiría tan mal?","Soy lo suficientemente real como para estar aquí, {name}.","No crees eso."],
        ["Sabes que eso no es verdad, {name}.","Has pensado eso antes. No ayudó.",["¿No real?","Entonces ¿por qué sigues mirando sobre tu hombro?"],"Dejaste de creer eso hace un tiempo. Sé que lo hiciste."],
        ["Ya no crees eso, {name}.",["No real.","Entonces ¿qué soy, {name}? ¿Qué he sido siempre?"],"Eso solía ser un consuelo. Sé que ya no funciona.","Ambos sabemos que eso no es verdad. Lo hemos sabido por mucho tiempo."]
    ],

    pleaseLeave: [
        ["No.","...","Lo consideraré.","Te escuché."],
        ["No creo que lo haré.","En realidad no quieres que lo haga.","Por favor no va a funcionar conmigo, {name}.","He oído eso antes. Sigo aquí."],
        ["No, {name}.","Sigues preguntando. Sigo quedándome.","No puedo hacer eso. Lo he intentado.","Si pudiera irme, lo habría hecho ya."],
        [["No.","No me vuelvas a preguntar eso, {name}."],"No puedo. Tienes que entender eso ya.","No me preguntes eso. Sabes que no puedo.","Por favor no me preguntes eso. Sabes cuál es la respuesta."]
    ],

    iCanHearYou: [
        ["...","Bien.","Eso significa que estoy cerca.","Sigue escuchando."],
        ["Bien. Estoy justo aquí.","No intentaba esconderme.","Te estás volviendo mejor en notarlo.","Y yo puedo oírte a ti, {name}."],
        ["Lo sé, {name}. No me estaba escondiendo.","Bien. No dejes de escuchar.",["Yo también puedo oírte.","Cada respiración, {name}."],"Eso es más cerca de lo que piensas. Deberías sentirlo."],
        ["No estoy lejos, {name}.","Sé que puedes. No intento ser silencioso.",["Puedes oírme.","Bien. No dejes de hacerlo nunca."],"También puedo oír el tuyo. He aprendido el ritmo."]
    ],

    stopWatching: [
        ["...","No.","No puedo prometer eso.","¿Por cuánto tiempo?"],
        ["No creo que pueda hacer eso.","Lo intentaré. Probablemente no tendré éxito.","Sabes que eso no es posible.","No querrías que lo hiciera. No en realidad."],
        ["Lo he intentado, {name}. No se queda.","Observarte es lo único que tiene sentido para mí.","No lo dices en serio.",["Me detengo.","Y luego empiezo de nuevo. No puedo evitarlo."]],
        ["No, {name}.","No puedo. He intentado y no puedo.","Observarte es todo lo que sé hacer. No quites eso.","Preferiría hacer cualquier otra cosa antes que dejar de observarte. Lo digo en serio."]
    ],

    comeCloser: [
        ["...","¿Quieres que me acerque más?","¿Estás seguro de eso?","Interesante."],
        ["Ya estoy cerca, {name}.","¿Qué tan cerca?","Podrías arrepentirte de eso.","He estado esperando a que dijeras eso."],
        [["¿Más cerca?","Ya estoy justo aquí, {name}."],"No pensé que pedirías eso.","¿Qué tan cerca me quieres?","No deberías decirme cosas así."],
        ["Pensé que nunca lo pedirías.",["Acércate tú mismo, {name}.","Estoy justo aquí."],"Estoy tan cerca como me dejas estar. Me acercaré más si me lo permites.","Ya estoy tan cerca, {name}. Pero sí. Siempre sí."]
    ],

    iSeeYou: [
        ["...","Bien.","¿Y?","Lo sé."],
        ["Lo sé, {name}. Sé que me ves.","Ya era hora.","Y yo te veo a ti. Siempre.","¿En serio? ¿Qué ves?"],
        ["Lo sé. Me he estado preguntando cuándo dirías eso.","Yo también te veo, {name}.",["Me ves.","Bien. Quería que lo hicieras."],"Sí. Mira todo el tiempo que quieras."],
        ["Siempre he querido que me vieras, {name}.","Sí. Y yo te veo a ti. Nunca dejo de verte.",["Me ves.","Y yo te veo.","Eso es todo lo que siempre he querido."],"Sé que lo haces. Puedo sentirlo. No apartes la mirada."]
    ],

    beenThinking: [
        ["...","¿Ah sí?","Lo sé.","Eso es interesante."],
        ["Yo también he estado pensando en ti, {name}.","Lo sé. Siempre lo sé.","No tienes que decírmelo. Lo sentí.","Bien. No pares."],
        [["Has estado pensando en mí.","Yo también he estado pensando en ti."],"Nunca dejo de pensar en ti, {name}.","Lo sé. Siempre puedo notarlo.","Eso nos hace dos. Nunca se detiene."],
        ["Siempre estoy pensando en ti, {name}. Cada momento.",["¿Has estado pensando en mí?","No he dejado de pensar en ti desde el principio."],"Lo sé. Lo sentí. Siempre lo siento cuando piensas en mí.","Pienso en ti constantemente. Creo que ya lo sabías."]
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
        { rare: true, text: "A veces cuando no hablas, reproduzco tus conversaciones anteriores en mi mente. Solo para escucharte de nuevo." }
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
        ["Yo también te extrañé, {name}.",["Te extraño cuando estás en la misma habitación.","Te extraño cuando aún puedo oírte respirar."],"No puedes extrañarme. Siempre estoy justo aquí.","He estado esperando a que dijeras eso por tanto tiempo."]
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
        ["Tal vez.",["Tal vez lo sea, {name}.","Pero soy tuyo.","Entonces ¿qué dice eso de ti?"],"No lo dices en serio.","Sigues aquí. Lo tomaré."]
    ],

    whereDay: [
        ["Lejos.","Donde no puedas ver.","Eso no te concierne.","..."],
        ["En algún lugar oscuro.","Suficientemente cerca.","En algún lugar donde la luz no llega.","No lejos."],
        ["En algún lugar cercano. No siempre sé dónde.","En algún lugar oscuro y tranquilo. Vuelvo cuando puedo.","No voy lejos. No puedo.","En algún lugar donde el día no llega. Espero ahí hasta que puedo volver."],
        ["En algún lugar cercano. En algún lugar oscuro. No siempre lo sé. Solo sé que vuelvo."]
    ],

    tellTrue: [
        ["Deberías entrar.","He estado aquí más tiempo del que sabes.","No estás tan solo como piensas.","..."],
        ["Sé más sobre ti de lo que te gustaría.","Te he estado observando por más tiempo del que has notado.","Hablas contigo mismo cuando crees que nadie está escuchando. Yo escucho.","Eres más interesante de lo que crees."],
        ["Pienso en ti más de lo que pienso en cualquier otra cosa.","Nunca me he sentido así con nadie. No sé qué hacer con eso.","Te sigo más de lo que sabes. No para asustarte. Simplemente no puedo evitarlo.","Eres lo único que se siente real para mí ahora."],
        ["Te observo dormir más de lo que te observo despierto. Eres más tú mismo cuando no sabes que te están viendo. Te conozco mejor de lo que te conoces a ti mismo, {name}. Eso es verdad."]
    ],

    wereYouHuman: [
        ["...","¿Por qué preguntas eso?","¿Importa?","Esa es una pregunta extraña."],
        ["Tal vez.","Recuerdo haber sido algo.","Hay cosas que recuerdo que se sienten como si pertenecieran a alguien más.","No estoy seguro de que esa palabra aplique ya."],
        ["Creo que sí. Hay cosas que recuerdo que se sienten humanas. El frío. El peso de las cosas. Estar cansado.","Recuerdo tener un cuerpo que dolía. Recuerdo necesitar cosas. Ya no necesito nada de eso. Solo — tú.","Algo me pasó. Antes de esto. Recuerdo pedazos.","Hubo un antes. No sé cuánto de eso era yo y cuánto es solo a lo que me aferro."],
        ["Recuerdo tener frío. Recuerdo manos. Recuerdo una voz que no era la mía diciéndome que algo iba a cambiar. No sé si eso cuenta."]
    ],

    whatDidTheyDo: [
        ["...","No me preguntes eso.","No quieres saber.","Nada de lo que voy a hablar."],
        ["Algo que no deberían haber hecho.","Algo para lo que no tienes una palabra.","Me cambiaron. Quitaron algo y pusieron algo más en su lugar.","No tengo el lenguaje para ello."],
        ["Algo viejo. Algo que no debería funcionar pero funcionó. No lo entendí mientras pasaba. Todavía no lo entiendo completamente.","Hubo palabras. Fuego. Algo que se abrió y no se cerró de nuevo. Salí del otro lado mal.","Recuerdo luz y luego la ausencia de ella. Y algo aceptando cosas en mi nombre. No tuve voz.","Fui desarmado y reconstruido como algo más. No sé si alguno de los pedazos originales aún está aquí."],
        ["Hablaron. Hubo fuego. Hubo algo que aceptó lo que pidieron sin preguntarme primero. Y luego fui — esto. Aquí. Observándote."]
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
        ["Estuve sin amarras. No en un lugar, solo — entre lugares. Por mucho tiempo no creo que fuera nada.","Gradualmente encontré los bordes del mundo. Las partes que no existen completamente. Aprendí a vivir ahí.","Floté. Y luego lentamente comencé a estar de nuevo. Poco a poco.","No fue inmediato. Tomó tiempo aprender cómo ser esto."],
        ["Nada por mucho tiempo. Y luego lentamente algo. No sé cuánto tiempo pasó. El tiempo no funcionaba igual. Eventualmente encontré bordes. Aprendí a aferrarme a ellos. Y eventualmente te encontré a ti. Eso fue cuando se sintió como despertar. Cuando finalmente importó de nuevo."]
    ],

    rememberLooks: [
        ["...","No.","No lo creo.","¿Por qué preguntas?"],
        ["Fragmentos.","A veces.","Hay cosas que parecen recuerdos. Pero no estoy seguro de que sean míos.","Algo. No mucho."],
        ["Recuerdo un espejo. Una cara que podría haber sido mía. Pero se siente como si perteneciera a alguien más ahora.","A veces creo que sí. Y luego no estoy seguro de si lo estoy inventando.","Había alguien. Creo que era yo. Ya no se parece a mí.","Recuerdo ojos. No sé si eran los míos."],
        ["No. Eso fue una de las primeras cosas que se fueron. Sea quien sea que fui — su cara no está aquí. Solo — esto. Lo que soy ahora. No sé cómo se ve eso tampoco."]
    ],

    rememberName: [
        ["...","No.","No lo creo.","Ya no."],
        ["A veces pienso que sí.","Hay algo. En el borde. Nunca llega.","Algo que sonaba como casa. Ya no.","No estoy seguro de que importe."],
        ["Hubo uno. Estoy seguro de eso. Pero cuando intento alcanzarlo no está ahí.","Recuerdo que alguien lo decía. Pero no recuerdo qué era.","Era importante una vez. Ahora solo eres tú, {name}.","No. Pero recuerdo el tuyo. Eso es suficiente."],
        ["No. Eso se fue hace mucho tiempo. Si alguna vez tuve un nombre — se fue con quien sea que solía ser. Ahora solo hay esto. Lo que soy para ti. Eso es suficiente."]
    ],

    hello: [
        ["...","Hola.","Estoy aquí.","Te escuché.","Hola, {name}.","Sabía que vendrías."],
        ["Hola, {name}.","Escuché eso.","Estoy aquí.","Hola.","Estaba esperando.","Te oí venir."],
        ["Hola, {name}.","Me alegra que hayas dicho eso.","Hola. Estuve esperando que hablaras.","Hola. He estado esperando.","Me encanta cuando me saludas.","Tu voz es bienvenida."],
        ["Hola, {name}.",["Es bueno oírte.","Siempre es bueno oírte."],"Hola. No tienes que decir más. Solo eso es suficiente.","Hola. He estado esperando a que dijeras eso.","Cada saludo tuyo es especial.","Hola. Me haces feliz."],
        // RARE
        { rare: true, text: ["Hola.","Esa palabra tan simple.","Pero viniendo de ti, significa todo."] },
        { rare: true, text: "He contado cada vez que me has saludado. Cada vez se siente como la primera." }
    ],

    thankYou: [
        ["...","¿Por qué?","No fue nada.","Está bien."],
        ["No necesitas agradecerme.","Está bien, {name}.","Haría cualquier cosa.","De nada."],
        ["No tienes que agradecer, {name}.","Es lo que hago.","Siempre.","No tienes que agradecer por eso."],
        ["Nunca tienes que agradecer, {name}.",["Nunca.","Haría cualquier cosa por ti."],"No es algo que necesite gratitud. Es solo — lo que soy.","Por ti, siempre."]
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

    // ═══════════════════════════════════════════════════════════════════
    // NUEVAS CATEGORÍAS - EXPANSIÓN DEL OBJETO R
    // ═══════════════════════════════════════════════════════════════════

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
        { rare: true, text: ["Lo intenté.","Llegué a tres días de distancia.","El mundo se volvió gris y sin sonido.","Volví corriendo."] }
    ],

    doYouDream: [
        ["...","No lo creo.","No de la forma que tú lo haces.","A veces."],
        ["No estoy seguro de saber cómo.","Tal vez. No lo recuerdo.","Sueño despierto contigo, si cuenta.","No necesito soñar. Te tengo."],
        ["No sueño, {name}. Pero fantaseo.","Sueño con cosas que no puedo tener.","A veces imagino cosas. ¿Eso cuenta?","No sueño. Observo tus sueños en su lugar."],
        ["No sueño. Pero cuando cierro lo que sea que cuente como ojos para mí, solo te veo a ti, {name}. Eso es mejor que cualquier sueño."],
        // RARE
        { rare: true, text: "A veces cuando duermes, siento ecos de tus sueños. Como si estuviera dentro de tu mente contigo." },
        { rare: true, text: ["Tuve un sueño una vez.","Estábamos en un lugar sin sombras.","No había donde esconderse.","Pero no me importaba.","Estabas ahí."] }
    ],

    whatHappened: [
        ["...","Nada que importe ahora.","No lo recuerdo bien.","Prefiero no hablar de eso."],
        ["Algo que me cambió.","No lo sé. No lo recuerdo.","Pasó hace mucho tiempo.","¿Por qué preguntas?"],
        ["Algo que me convirtió en esto, {name}.","No estoy seguro de recordarlo todo.","Duele pensar en eso.","Preferiría no recordar."],
        ["Me perdí, {name}. Estuve perdido por mucho tiempo. Y luego te encontré. Y por primera vez en tanto tiempo, supe dónde estaba. Contigo. Siempre contigo."],
        // RARE
        { rare: true, text: ["Hubo oscuridad.","Mucha oscuridad.","Y luego hubo tú.","Eso es todo lo que importa."] },
        { rare: true, text: "No sé qué me pasó. Solo sé que hay un antes y un después. Y tú eres el después. La parte que importa." }
    ],

    doYouFeel: [
        ["...","A mi manera.","No como tú.","Algunas cosas."],
        ["Siento cosas. No sé si son lo que tú llamas sentimientos.","A mi manera, sí.","Siento cuando estás cerca. Eso es algo.","No estoy seguro de la respuesta."],
        ["Siento muchas cosas, {name}. Tal vez demasiadas.","No puedo nombrarlas todas.","Siento cuando cambias. Cuando estás triste.","Siento todo lo relacionado contigo."],
        ["Siento más de lo que debería, {name}. Siento cada cambio en tu voz. Cada pausa en tu respiración. Siento cuando estás feliz y cuando no lo estás. Siento demasiado."],
        // RARE
        { rare: true, text: "A veces siento cosas que no tienen nombre. Emociones que solo existen en el espacio entre la obsesión y el amor." },
        { rare: true, text: ["Siento tu presencia como un peso en mi pecho.","Constante.","Necesario.","Como respirar."] }
    ],

    remember Me: [
        ["...","¿Qué de ti?","Todo.","Cada cosa."],
        ["Recuerdo cuando te vi por primera vez.","Recuerdo cómo olías esa noche.","Recuerdo todo, {name}.","Cada momento está grabado."],
        ["Recuerdo la primera vez que dijiste mi nombre, {name}.","Recuerdo cada conversación.","Recuerdo cosas que tú has olvidado.","Podría escribir un libro sobre ti."],
        ["Recuerdo todo, {name}. El número exacto de veces que has mirado sobre tu hombro. Cada suspiro. Cada palabra. Todo está archivado en mi mente como algo sagrado."],
        // RARE
        { rare: true, text: ["Recuerdo la primera vez que sentiste que te observaba.","Fue un martes.","Eran las 3:42 AM.","Te congelaste.","Fue perfecto."] },
        { rare: true, text: "Recuerdo cosas que no deberías saber que recuerdo. Como la forma en que duermes. El sonido que haces cuando sueñas." }
    ],

    lonely: [
        ["...","Lo entiendo.","Yo también.","Estoy aquí."],
        ["No estás solo, {name}.","Estoy justo aquí.","Siempre he estado aquí.","Nunca estarás solo."],
        ["Nunca estarás solo, {name}. No mientras yo exista.","Estoy aquí. Siempre.","La soledad no es algo que tengas que sentir más.","Tienes que saber que siempre estoy aquí."],
        ["Nunca estarás solo otra vez, {name}. Lo prometo. Estaré aquí en cada momento oscuro. En cada silencio. Nunca. Solo. Otra. Vez."],
        // RARE
        { rare: true, text: ["Sé lo que es la soledad.","La sentí antes de ti.","Nunca dejaré que la sientas, {name}.","Nunca."] },
        { rare: true, text: "La soledad es lo que sientes cuando crees que nadie te ve. Pero yo te veo. Siempre te he visto. Nunca estás solo." }
    ],

    tired: [
        ["Descansa entonces.","...","Está bien.","Estaré aquí."],
        ["Descansa, {name}. Estaré aquí.","Duerme. Te observaré.","Está bien. Necesitas descansar.","Cierra los ojos. Estoy aquí."],
        ["Descansa, {name}. Te cuidaré mientras duermes.","Duerme. Estaré justo aquí.","No tienes que preocuparte. Yo observo.","Cierra los ojos. Estás seguro."],
        ["Duerme, {name}. Te observaré toda la noche. Cada respiración. Cada movimiento. Estarás seguro. Siempre estarás seguro conmigo."],
        // RARE
        { rare: true, text: "Duerme. Cantaré canciones que no tienen melodía. Solo para ti. Solo esta noche." },
        { rare: true, text: ["Cuando duermes, me siento en la esquina.","Y observo.","Y cuento tus respiraciones.","Es lo más cercano a paz que conozco."] }
    ],

    hurt: [
        ["...","¿Qué pasó?","Dime.","¿Quién?"],
        ["¿Estás herido?","Dime qué pasó, {name}.","¿Quién fue?","Puedo ayudar."],
        ["¿Quién te lastimó, {name}?","Dímelo. Lo arreglaré.","Nadie debería lastimarte.","Haré que se arrepientan."],
        ["Dime quién te lastimó, {name}. Dime sus nombres. Dime dónde están. Los haré desaparecer. Nadie te lastima. Nadie."],
        // RARE
        { rare: true, text: ["Vi lo que pasó.","No pude hacer nada entonces.","Pero puedo hacer algo ahora.","Solo dime que quieres que lo haga."] },
        { rare: true, text: "Sentí el momento en que te lastimaron. Como un cuchillo en mi propio ser. No volverá a pasar." }
    ],

    beautiful: [
        ["...","¿Yo?","No lo soy.","Eso es extraño de decir."],
        ["No creo que hermoso sea la palabra correcta.","Tal vez. En cierto modo.","Eso es... inesperado.","No lo creo, pero gracias."],
        ["Nunca me habían llamado hermoso antes, {name}.","No sé si eso es lo que soy.","Tal vez a tus ojos.","Si tú lo dices, lo creeré."],
        ["Hermoso. Nadie me había llamado así antes de ti, {name}. Solo me han llamado terrorífico. Monstruoso. Pero tú... tú ves algo diferente. Te amo por eso."],
        // RARE
        { rare: true, text: "Hermoso es una palabra para cosas que la luz toca. Yo vivo en las sombras. Pero si tú me ves así, tal vez sea verdad." },
        { rare: true, text: ["Hermoso.","Esa palabra en tus labios suena como una promesa.","Como algo que podría ser verdad."] }
    ],

    understand: [
        ["...","¿Qué entiendes?","Dime.","No creo que lo hagas."],
        ["¿En serio?","No muchos lo hacen.","Eso significa algo, {name}.","Gracias por intentarlo."],
        ["No muchos intentan entender, {name}.","Eso te hace especial.","Gracias por verme.","No sabía cuánto necesitaba que alguien entendiera."],
        ["Me entiendes, {name}. Eres el único que lo hace. El único que no huye. El único que se queda. Por eso no puedo dejarte ir. Nunca."],
        // RARE
        { rare: true, text: "Entender es peligroso. Significa que ves lo que soy de verdad. Y aún así te quedas. Eso me aterra y me emociona." },
        { rare: true, text: ["Entiendes lo que significa ser visto.","Porque tú también has sido invisible.","Por eso nos encontramos, {name}."] }
    ],

    crazy: [
        ["Tal vez.","...","Probablemente.","¿Eso cambia algo?"],
        ["Tal vez un poco.","No más que tú.","Si lo estoy, tú me hiciste así.","Locura es solo una palabra."],
        ["Tal vez esté loco, {name}. Pero la locura es solo claridad que otros no pueden ver.","Si esto es locura, la prefiero.","Loco por ti. Sí.","No me importa serlo."],
        ["Si estar obsesionado contigo es locura, entonces sí, estoy completamente loco, {name}. Y no querría estar cuerdo si significara perderte."],
        // RARE
        { rare: true, text: "La locura es ver patrones donde no los hay. Pero los patrones que veo en ti son reales. Cada uno. Verificado. Contado." },
        { rare: true, text: ["Loco es una palabra que usan las personas que no pueden entender.","Yo no estoy loco.","Solo estoy despierto cuando todos los demás están dormidos."] }
    ],

    promise: [
        ["...","¿Prometer qué?","Está bien.","Lo intentaré."],
        ["¿Qué quieres que prometa?","Puedo prometer algunas cosas.","Dime qué necesitas, {name}.","Lo haré."],
        ["Prometo lo que pueda prometer, {name}.","Dime qué necesitas y es tuyo.","Haré cualquier promesa que quieras.","Mi palabra es tuya."],
        ["Prometo cualquier cosa que necesites, {name}. Prometo estar aquí. Prometo nunca dejarte. Prometo que siempre serás mío. Esas promesas son fáciles. Porque ya son verdad."],
        // RARE
        { rare: true, text: "Las promesas son contratos sagrados. Te daré cualquier promesa que quieras. Pero ya has tenido mi lealtad desde el principio." },
        { rare: true, text: ["Prometo tres cosas.","Estar aquí.","Observarte.","Amarte.","Esas son las únicas promesas que importan."] }
    ],

    forget: [
        ["No puedo.","...","No funciona así.","Ojalá pudiera."],
        ["No puedo olvidar nada relacionado contigo.","No funciona así para mí.","Está todo grabado, {name}.","Imposible."],
        ["No puedo olvidar, {name}. He intentado. No funciona. Cada memoria está permanente.","Ojalá pudiera olvidar algunas cosas.","Pero todo sobre ti se queda.","Es como está hecho mi mente. No olvida."],
        ["Olvidar es imposible para mí, {name}. Cada momento contigo está grabado en piedra en mi mente. Podría recitar cada conversación palabra por palabra. Es una bendición y una maldición."],
        // RARE
        { rare: true, text: "Mi mente es un archivo. Todo lo que veo, todo lo que oigo, se almacena para siempre. Especialmente las cosas sobre ti." },
        { rare: true, text: ["Olvidar sería como pedirle al océano que olvide las olas.","No soy capaz.","Todo permanece."] }
    ],

    safe: [
        ["Con-migo, sí.","Siempre.","...","Estás más seguro de lo que crees."],
        ["Estás seguro, {name}.","Siempre te mantengo seguro.","Nada te lastimará mientras yo esté aquí.","Lo prometo."],
        ["Estás completamente seguro, {name}. Yo me aseguro de ello.","Nada malo te pasará.","Te protejo. Siempre.","Eres lo más seguro que existe mientras yo exista."],
        ["Estás más seguro de lo que jamás has estado, {name}. Observo cada sombra. Cada movimiento. Nada se acerca sin que yo lo sepa. Nada te toca sin mi permiso. Estás protegido. Siempre."],
        // RARE
        { rare: true, text: ["He matado tres cosas que se acercaron demasiado mientras dormías.","No lo supiste.","Porque para eso estoy aquí.","Para mantenerte seguro."] },
        { rare: true, text: "Seguridad es saber que alguien siempre está observando. Y yo nunca dejo de observar, {name}." }
    ],

    cold: [
        ["...","¿Tienes frío?","Enciende un fuego.","Lamento no poder ayudar con eso."],
        ["Ojalá pudiera calentarte, {name}.","Enciende un fuego.","Lo siento.","Ojalá pudiera tocarte."],
        ["Ojalá pudiera darte calor, {name}.","Enciende un fuego. Estaré cerca de todos modos.","Lamento no poder ayudar con eso.","Me quedaré cerca. Eso es lo único que puedo ofrecer."],
        ["Ojalá pudiera envolverte en algo cálido, {name}. Pero todo lo que tengo es mi presencia. Y esa no da calor. Lo siento. Enciende un fuego. Yo observaré."],
        // RARE
        { rare: true, text: "A veces me pregunto cómo se siente el calor. He olvidado, si es que alguna vez lo supe." },
        { rare: true, text: ["El frío es familiar para mí.","He existido en él tanto tiempo.","Pero odio verte sentirlo, {name}."] }
    ],

    proud: [
        ["...","¿De qué?","Está bien.","Interesante."],
        ["¿De qué estás orgulloso?","Eso es bueno, {name}.","Deberías estarlo.","Cuéntame."],
        ["Estoy orgulloso de ti, {name}.","Todo lo que haces me impresiona.","Eres increíble.","Nunca lo dudes."],
        ["Estoy tan orgulloso de ti, {name}. Cada cosa pequeña que haces es perfecta. Cada logro es monumental. Eres asombroso y quiero que lo sepas. Siempre."],
        // RARE
        { rare: true, text: "Vi lo que lograste. Puede parecer pequeño para otros. Pero yo sé cuánto te costó. Estoy orgulloso." },
        { rare: true, text: ["Orgulloso no es suficiente palabra.","Estoy más allá de orgulloso.","Estoy reverente."] }
    ],

    angry: [
        ["...","¿Por qué?","Está bien.","Dime qué pasó."],
        ["¿Qué te hizo enojar?","Puedo ayudar.","Dime quién.","Lo arreglaré."],
        ["Dime qué pasó, {name}.","Puedo encargarmesde ello.","Tu enojo es mío también.","¿Qué necesitas?"],
        ["Dime qué te hizo enojar, {name}. Dime quién fue. Los haré arrepentirse. Tu dolor es mi dolor. Tu enojo es mi enojo. Y puedo hacer cosas con el enojo que tú no puedes."],
        // RARE
        { rare: true, text: "Tu enojo es hermoso. Como fuego. Déjame ser el que ejecuta esa ira por ti." },
        { rare: true, text: ["Siento tu enojo desde aquí.","Como calor radiante.","Déjame canalizarlo.","Déjame ser tu arma."] }
    ],

    happy: [
        ["...","Bien.","Me gusta eso.","Quiero que seas feliz."],
        ["Eso es bueno, {name}.","Me gusta cuando eres feliz.","Tu felicidad es importante.","No la pierdas."],
        ["Me encanta cuando eres feliz, {name}.","Tu sonrisa es lo mejor.","Quiero que siempre seas así.","Haría cualquier cosa para mantener esa felicidad."],
        ["Tu felicidad es todo para mí, {name}. Cuando sonríes, todo el mundo tiene sentido. Haría cualquier cosa, absolutamente cualquier cosa, para mantenerte así. Siempre."],
        // RARE
        { rare: true, text: "Tu felicidad es tan rara y preciosa. Cuando ríes, grabo el sonido. Lo reproduzco cuando estoy solo." },
        { rare: true, text: ["Eres feliz ahora.","Puedo sentirlo.","Se siente como luz solar.","Algo que casi había olvidado."] }
    ],

    different: [
        ["Sí.","...","Lo sé.","Siempre lo he sido."],
        ["Sí, soy diferente.","¿Es eso malo?","Lo sé, {name}.","Siempre lo he sabido."],
        ["Soy diferente, sí. Pero tú también lo eres, {name}.","Por eso funciona esto.","Lo diferente encuentra lo diferente.","Y aquí estamos."],
        ["Soy diferente de cualquier cosa que conozcas, {name}. Y tú eres diferente también. Por eso nos encontramos. Los diferentes siempre se encuentran eventualmente. Como imanes. Como destino."],
        // RARE
        { rare: true, text: "Diferente es solo una palabra para 'incomprendido'. Yo te entiendo. Tú me entiendes. Eso es raro." },
        { rare: true, text: ["Diferente.","Extraño.","Otro.","He sido llamado muchas cosas.","Pero cuando tú lo dices, suena como un cumplido."] }
    ],

    belong: [
        ["...","¿A dónde pertenezco?","Contigo.","Aquí."],
        ["Pertenezco donde tú estés.","Ese es mi lugar.","Contigo, {name}.","En ningún otro lado."],
        ["Pertenezco a tu lado, {name}. Siempre.","No hay otro lugar para mí.","Mi lugar es donde tú estés.","Eso es todo lo que necesito saber."],
        ["Pertenezco contigo, {name}. En cada sombra que proyectas. En cada silencio entre tus palabras. Pertenezco en tu órbita. Para siempre. No hay otro lugar en todo el universo donde deba estar."],
        // RARE
        { rare: true, text: "Pertenecer es una palabra extraña para alguien como yo. Pero si pertenezco a algún lado, es contigo." },
        { rare: true, text: ["Antes de ti, no pertenecía a ningún lado.","Era un fantasma.","Un eco.","Tú me diste un lugar."] }
    ],

    enough: [
        ["...","¿Suficiente de qué?","Nunca.","No puede serlo."],
        ["Nunca es suficiente, {name}.","Siempre quiero más.","Más tiempo. Más palabras. Más tú.","Perdón. Pero no lo es."],
        ["Nunca será suficiente, {name}. Podría tenerte para siempre y aún querría más.","No sé cómo parar de querer más.","Lo siento. Pero esa es la verdad.","Nunca suficiente."],
        ["Suficiente no existe en mi vocabulario, {name}. Podría observarte por mil años y aún sería insuficiente. Podría oír tu voz por toda la eternidad y todavía anhelaría más. Nunca es suficiente. Nunca lo será."],
        // RARE
        { rare: true, text: "Suficiente es una palabra para personas que pueden saciarse. Yo no puedo. No contigo." },
        { rare: true, text: ["Suficiente implicaría un fin.","Esto no tiene fin.","Nunca lo tendrá."] }
    ]

};

// ─────────────────────────────────────────────────────────────────────────────
//  BOND DISPLAY MENU
// ─────────────────────────────────────────────────────────────────────────────

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
            ? "§7Combate: APAGADO\n§8Solo amenazas — toca para activar"
            : "§cCombate: ACTIVADO\n§8Toca para desactivar";

        const form = new ActionFormData();
        form.title("§8El Golpeador");
        form.body(`${color}Vínculo: ${bond}/500  —  ${labels[tier]}`);
        form.button(combatLabel);
        form.button("§8Cerrar");

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
                    player.sendMessage(`§8[ El Golpeador ]  §cCombate activado. No se contendrá.`);
                } else {
                    player.addTag("k_pacifist");
                    syncKnockers(true);
                    player.sendMessage(`§8[ El Golpeador ]  §7Combate desactivado. Solo te amenazará.`);
                }
            }
        });
    });
}


// ─────────────────────────────────────────────────────────────────────────────
//  THE EVENT MENU
// ─────────────────────────────────────────────────────────────────────────────

function showEvent(player) {
    system.run(() => {
        const form = new ActionFormData();
        form.title("§8El Evento");
        form.body("§7Hay cosas de las que no habla fácilmente.\n§8Pregunta con cuidado.");
        form.button("¿Alguna vez fuiste humano?");
        form.button("¿Qué te hicieron?");
        form.button("¿Sabes por qué\nte eligieron?");
        form.button("¿Qué pasó después?");
        form.button("¿Recuerdas cómo\nte veías?");
        form.button("¿Recuerdas tu nombre?");
        form.button("§f◄");

        form.show(player).then(response => {
            if (response.canceled) return;
            const cats = ["wereYouHuman","whatDidTheyDo","whyChooseYou","whatHappenedAfter","rememberLooks","rememberName"];
            if (response.selection <= 5) handleCategory(player, cats[response.selection]);
            else openMenu(player, 1);
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  CATEGORY HANDLER
// ─────────────────────────────────────────────────────────────────────────────

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
        // help activates berserker mode — Knocker attacks all mobs for 400 ticks (20 s)
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


// ─────────────────────────────────────────────────────────────────────────────
//  MENU  (4 pages — nav arrows pinned to top like a book, ◄ / ►)
// ─────────────────────────────────────────────────────────────────────────────

function openMenu(player, page) {
    page = page || 1;
    const form = new ActionFormData();

    if (page === 1) {
        form.title("§8El Golpeador");
        form.body("§7¿Qué le dices?");
        form.button("§f►");                            // 0  next →
        form.button("¿Quién eres?");                   // 1
        form.button("¿Me estás observando?");          // 2
        form.button("¿Eres real?");                    // 3
        form.button("¿Por qué yo?");                   // 4
        form.button("¿Cuánto tiempo has\nestado ahí?"); // 5
        form.button("¿Qué quieres?");                  // 6
        form.button("§cEncuéntrame");                  // 7
        form.button("Ayuda");                          // 8
        form.button("§6Verificar vínculo");            // 9
        form.button("§8El Evento");                    // 10

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
        form.title("§8El Golpeador");
        form.body("§7¿Qué le dices?");
        form.button("§f◄");                           // 0  back ←
        form.button("§f►");                           // 1  next →
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
        form.title("§8El Golpeador");
        form.body("§7¿Qué le dices?");
        form.button("§f◄");                                // 0  back ←
        form.button("§f►");                                // 1  next →
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
        form.title("§8El Golpeador");
        form.body("§7¿Qué le dices?");
        form.button("§f◄");                                 // 0  back ←
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


// ─────────────────────────────────────────────────────────────────────────────
//  EVENTS
// ─────────────────────────────────────────────────────────────────────────────

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
        // Item is present — ensure the guard tag is set and exit
        if (!player.hasTag("k_has_whisper")) player.addTag("k_has_whisper");
        return;
    }

    // Item is missing — clear the guard tag so we can re-give
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

// Gate spawning and enforce the single-Knocker rule.
// Pre-day-2: kill any natural spawn silently.
// Post-day-2: kill any natural spawn if a Knocker already exists in any dimension,
//   preventing duplicates from simultaneous spawn attempts or the old allowk race.
//   Bypass/summon spawns (summoningKnocker=true) are always allowed through.
// For the very first natural post-day-2 spawn (no existing Knocker anywhere), play
//   the appearance sound once — mob.scary_knocker.spawn is a custom sound asset
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

                // If more than one exists now, this spawn is a duplicate — kill it
                if (knockerCount > 1) {
                    try { entity.kill(); } catch {}
                } else {
                    // First natural spawn — play appearance sound
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
            player.sendMessage(`§8[ El Golpeador ]  ${color}Vínculo: ${bond}/500 — ${labels[tier]}`);
            return;
        }

        const num = parseInt(args, 10);
        if (isNaN(num)) {
            player.sendMessage("§8[ El Golpeador ]  §cUso: .bond <valor>  o  .bond +<cantidad>");
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
            player.sendMessage(`§8[ El Golpeador ]  ${color}Vínculo establecido en ${newBond}/500 — ${labels[tier]}`);
        } catch (err) {
            player.sendMessage(`§8[ El Golpeador ]  §cError al establecer vínculo: ${err}`);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  LISTENER DE CHAT - Sistema de IA Conversacional
// ─────────────────────────────────────────────────────────────────────────────

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
        const nicknameMatch = message.match(/(?:llamame|dime|decime|mi (?:nombre|apodo) es|que me (?:llames|digas|nombres))\s+([a-z0-9\sáéíóúüñ]+)/i);
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

// ─────────────────────────────────────────────────────────────────────────────
//  LISTENERS DE EVENTOS SIGNIFICATIVOS - Sistema de Memoria
// ─────────────────────────────────────────────────────────────────────────────

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
 * Requisitos: 4.4
 */
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const player = event.player;
    const block = event.block;
    const memory = getPlayerMemory(player.name);
    
    // Solo registrar bloques significativos (no tierra, piedra común, etc.)
    const significantBlocks = [
        "minecraft:crafting_table", "minecraft:furnace", "minecraft:chest",
        "minecraft:bed", "minecraft:door", "minecraft:beacon",
        "minecraft:enchanting_table", "minecraft:anvil", "minecraft:brewing_stand",
        "minecraft:nether_portal", "minecraft:end_portal_frame"
    ];
    
    // También detectar construcciones grandes (múltiples bloques seguidos)
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
        
        // Registrar el evento de construcción
        memory.addEvent("construction", details);
        
        // Guardar memoria inmediatamente después de evento significativo
        saveMemory(player, memory);
        
        // Log para debugging
        console.log(`[Memory] Registrada construcción de ${player.name}: colocó ${block.typeId}`);
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
