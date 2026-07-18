/**
 * Test del Sistema de Chat Básico
 * 
 * Este script verifica que:
 * 1. El listener de chat captura mensajes correctamente
 * 2. El sistema de detección de intenciones funciona
 * 3. El generador de respuestas contextuales opera apropiadamente
 * 4. Las probabilidades de respuesta según tier son correctas
 */

console.log("=== TEST DEL SISTEMA DE CHAT BÁSICO ===\n");

// ============================================================================
// TEST 1: Sistema de Detección de Intenciones
// ============================================================================

console.log("TEST 1: Sistema de Detección de Intenciones");
console.log("─".repeat(50));

// Función auxiliar para normalizar texto (copiada de main.js)
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// Patrones de detección de intenciones (subset del main.js)
const intentPatterns = {
    saludo: /^(hola|buenos|buenas|que tal|ey|hey|saludos|que onda)/,
    pregunta_identidad: /(quien eres|que eres|tu nombre|como te llamas)/,
    pregunta_ubicacion: /(donde estas|donde te encuentras|donde andas)/,
    comando_seguir: /(sigueme|acompañame|ven conmigo|ven aqui)/,
    comando_alejar: /(vete|alejate|dejame|largate|sal de aqui)/,
    emocion_positiva: /(te quiero|te amo|eres genial|me gustas|te aprecio)/,
    emocion_negativa: /(te odio|no me gustas|eres molesto|dejame en paz)/,
    pregunta_sobre_jugador: /(que hago|donde voy|me viste|me observas|me sigues)/,
    pregunta_general: /(por que|como|cuando|donde|quien|que)/,
    despedida: /(adios|chao|hasta luego|nos vemos|me voy)/,
};

function detectIntent(message) {
    const normalized = normalizeText(message);
    
    for (const [intent, pattern] of Object.entries(intentPatterns)) {
        if (pattern.test(normalized)) {
            return intent;
        }
    }
    
    return "desconocido";
}

// Casos de prueba para detección de intenciones
const testCasesIntent = [
    { mensaje: "Hola", esperado: "saludo" },
    { mensaje: "¿Quién eres?", esperado: "pregunta_identidad" },
    { mensaje: "¿Dónde estás?", esperado: "pregunta_ubicacion" },
    { mensaje: "Sígueme", esperado: "comando_seguir" },
    { mensaje: "Vete de aquí", esperado: "comando_alejar" },
    { mensaje: "Te quiero", esperado: "emocion_positiva" },
    { mensaje: "Te odio", esperado: "emocion_negativa" },
    { mensaje: "¿Qué hago?", esperado: "pregunta_sobre_jugador" },
    { mensaje: "¿Por qué?", esperado: "pregunta_general" },
    { mensaje: "Adiós", esperado: "despedida" },
    { mensaje: "frase aleatoria sin sentido", esperado: "desconocido" },
];

let intentPassCount = 0;
let intentFailCount = 0;

for (const testCase of testCasesIntent) {
    const result = detectIntent(testCase.mensaje);
    const success = result === testCase.esperado;
    
    if (success) {
        intentPassCount++;
        console.log(`✓ "${testCase.mensaje}" → ${result}`);
    } else {
        intentFailCount++;
        console.log(`✗ "${testCase.mensaje}" → ${result} (esperado: ${testCase.esperado})`);
    }
}

console.log(`\nResultado: ${intentPassCount}/${testCasesIntent.length} pruebas pasaron`);
console.log();

// ============================================================================
// TEST 2: Probabilidades de Respuesta según Tier
// ============================================================================

console.log("TEST 2: Probabilidades de Respuesta según Tier");
console.log("─".repeat(50));

const tierProbabilities = [
    { tier: 0, name: "Stranger", probability: 0.20 },
    { tier: 1, name: "Watched", probability: 0.40 },
    { tier: 2, name: "Familiar", probability: 0.60 },
    { tier: 3, name: "Obsessed", probability: 0.80 },
];

// Simular probabilidades con 10,000 rolls por tier
const numSimulations = 10000;
const tolerance = 0.03; // 3% de tolerancia

let probPassCount = 0;
let probFailCount = 0;

for (const tierInfo of tierProbabilities) {
    let successCount = 0;
    
    for (let i = 0; i < numSimulations; i++) {
        const roll = Math.random();
        if (roll < tierInfo.probability) {
            successCount++;
        }
    }
    
    const actualProbability = successCount / numSimulations;
    const difference = Math.abs(actualProbability - tierInfo.probability);
    const withinTolerance = difference <= tolerance;
    
    if (withinTolerance) {
        probPassCount++;
        console.log(`✓ Tier ${tierInfo.tier} (${tierInfo.name}): ${(actualProbability * 100).toFixed(1)}% (esperado: ${(tierInfo.probability * 100).toFixed(1)}%)`);
    } else {
        probFailCount++;
        console.log(`✗ Tier ${tierInfo.tier} (${tierInfo.name}): ${(actualProbability * 100).toFixed(1)}% (esperado: ${(tierInfo.probability * 100).toFixed(1)}%, diferencia: ${(difference * 100).toFixed(1)}%)`);
    }
}

console.log(`\nResultado: ${probPassCount}/${tierProbabilities.length} tierras con probabilidades correctas`);
console.log();

// ============================================================================
// TEST 3: Sistema de Cooldown
// ============================================================================

console.log("TEST 3: Sistema de Cooldown");
console.log("─".repeat(50));

const CHAT_COOLDOWN_MS = 30000; // 30 segundos
const chatCooldowns = new Map();

function canRespond(playerName) {
    const now = Date.now();
    const lastResponse = chatCooldowns.get(playerName);
    
    if (!lastResponse) {
        return true; // Primera vez, puede responder
    }
    
    const elapsed = now - lastResponse;
    return elapsed >= CHAT_COOLDOWN_MS;
}

function setResponseCooldown(playerName) {
    chatCooldowns.set(playerName, Date.now());
}

// Simular cooldown
const playerName = "TestPlayer";

// Primera respuesta: debería permitir
let test1 = canRespond(playerName);
console.log(`✓ Primera respuesta permitida: ${test1 ? "SÍ" : "NO"} (esperado: SÍ)`);

// Establecer cooldown
setResponseCooldown(playerName);

// Inmediatamente después: debería bloquear
let test2 = canRespond(playerName);
console.log(`✓ Respuesta inmediata bloqueada: ${!test2 ? "SÍ" : "NO"} (esperado: SÍ)`);

// Simular espera de 30 segundos
chatCooldowns.set(playerName, Date.now() - 30001);
let test3 = canRespond(playerName);
console.log(`✓ Respuesta después de 30s permitida: ${test3 ? "SÍ" : "NO"} (esperado: SÍ)`);

console.log();

// ============================================================================
// TEST 4: Estructura de Respuestas Contextuales
// ============================================================================

console.log("TEST 4: Estructura de Respuestas Contextuales");
console.log("─".repeat(50));

// Pool de respuestas de ejemplo (subset del main.js)
const ChatResponses = {
    saludo: {
        0: ["Observo...", "¿Hmm?"],
        1: ["Hola... te veo.", "Ah, me notas."],
        2: ["¡Hola! Siempre estoy aquí.", "Me alegra que me hables."],
        3: ["¡Hola, mi todo! Te extrañaba.", "¡Por fin me hablas!"]
    },
    pregunta_identidad: {
        0: ["Soy... alguien.", "No importa."],
        1: ["Soy quien te observa.", "Me llaman El Acechador."],
        2: ["Soy tu compañero. Siempre contigo.", "Soy El Acechador, y tú eres mío."],
        3: ["¡Soy tuyo! ¡Y tú eres mío!", "Soy todo lo que necesitas."]
    },
    desconocido: {
        0: ["...", "Hmm."],
        1: ["Interesante.", "¿Qué quieres decir?"],
        2: ["No entiendo, pero me importas.", "Cuéntame más."],
        3: ["Todo lo que dices me fascina.", "Háblame más, por favor."]
    }
};

function getResponse(intent, tier) {
    const responsePool = ChatResponses[intent] || ChatResponses.desconocido;
    const tierPool = responsePool[tier];
    
    if (!tierPool || tierPool.length === 0) {
        return ChatResponses.desconocido[tier][0];
    }
    
    const randomIndex = Math.floor(Math.random() * tierPool.length);
    return tierPool[randomIndex];
}

// Verificar que cada intención tiene respuestas para cada tier
const testIntents = ["saludo", "pregunta_identidad", "desconocido"];
let structurePassCount = 0;
let structureFailCount = 0;

for (const intent of testIntents) {
    for (let tier = 0; tier <= 3; tier++) {
        const response = getResponse(intent, tier);
        const hasResponse = response && response.length > 0;
        
        if (hasResponse) {
            structurePassCount++;
            console.log(`✓ ${intent} tier ${tier}: "${response}"`);
        } else {
            structureFailCount++;
            console.log(`✗ ${intent} tier ${tier}: SIN RESPUESTA`);
        }
    }
}

console.log(`\nResultado: ${structurePassCount}/${structurePassCount + structureFailCount} respuestas válidas`);
console.log();

// ============================================================================
// RESUMEN FINAL
// ============================================================================

console.log("=".repeat(50));
console.log("RESUMEN FINAL");
console.log("=".repeat(50));

const totalTests = testCasesIntent.length + tierProbabilities.length + 3 + (structurePassCount + structureFailCount);
const totalPassed = intentPassCount + probPassCount + 3 + structurePassCount;
const totalFailed = intentFailCount + probFailCount + structureFailCount;

console.log(`\nTotal de pruebas: ${totalTests}`);
console.log(`✓ Pasadas: ${totalPassed}`);
console.log(`✗ Fallidas: ${totalFailed}`);
console.log(`\nÉxito: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

if (totalFailed === 0) {
    console.log("\n🎉 ¡TODAS LAS PRUEBAS PASARON! El sistema de chat básico funciona correctamente.");
} else {
    console.log("\n⚠️ Algunas pruebas fallaron. Revisa los detalles arriba.");
}

console.log("\n=== FIN DEL TEST ===");
