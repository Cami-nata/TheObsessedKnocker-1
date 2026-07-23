/**
 * Tests para el Sistema de Detección de Acciones Recientes
 * Requisitos: 11.1, 11.5, 11.6, 11.8
 * 
 * Este archivo contiene pruebas unitarias para verificar que el sistema
 * de detección de acciones recientes funciona correctamente.
 */

// ============================================================================
// MOCK SETUP - Simular el entorno de Minecraft Bedrock
// ============================================================================

// Mock de la estructura de datos
const mockPlayerRecentActions = new Map();
const RECENT_ACTION_WINDOW_MS = 5 * 60 * 1000; // 5 minutos

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

// Funciones bajo prueba (copiadas del main.js)
function recordRecentAction(playerName, category, details = {}) {
    if (!mockPlayerRecentActions.has(playerName)) {
        mockPlayerRecentActions.set(playerName, []);
    }
    
    const actions = mockPlayerRecentActions.get(playerName);
    const now = Date.now();
    
    actions.push({
        category: category,
        timestamp: now,
        details: details
    });
    
    const recentActions = actions.filter(action => 
        (now - action.timestamp) < RECENT_ACTION_WINDOW_MS
    );
    
    mockPlayerRecentActions.set(playerName, recentActions);
}

function getRecentAction(player) {
    const playerName = player.name;
    
    if (!mockPlayerRecentActions.has(playerName)) {
        return null;
    }
    
    const actions = mockPlayerRecentActions.get(playerName);
    const now = Date.now();
    
    const recentActions = actions.filter(action => 
        (now - action.timestamp) < RECENT_ACTION_WINDOW_MS
    );
    
    if (recentActions.length === 0) {
        return null;
    }
    
    const scoredActions = recentActions.map(action => {
        const ageMs = now - action.timestamp;
        const recencyFactor = 1.0 - (ageMs / RECENT_ACTION_WINDOW_MS);
        const relevanceWeight = ActionRelevanceWeights[action.category] || 1;
        const score = relevanceWeight * (1.0 + recencyFactor);
        
        return {
            ...action,
            score: score
        };
    });
    
    scoredActions.sort((a, b) => b.score - a.score);
    
    const mostRelevant = scoredActions[0];
    
    return {
        category: mostRelevant.category,
        timestamp: mostRelevant.timestamp,
        details: mostRelevant.details
    };
}

function getRecentActionsByCategory(player, category) {
    const playerName = player.name;
    
    if (!mockPlayerRecentActions.has(playerName)) {
        return [];
    }
    
    const actions = mockPlayerRecentActions.get(playerName);
    const now = Date.now();
    
    return actions.filter(action => 
        action.category === category &&
        (now - action.timestamp) < RECENT_ACTION_WINDOW_MS
    );
}

function cleanupOldActions() {
    const now = Date.now();
    
    for (const [playerName, actions] of mockPlayerRecentActions.entries()) {
        const recentActions = actions.filter(action => 
            (now - action.timestamp) < RECENT_ACTION_WINDOW_MS
        );
        
        if (recentActions.length === 0) {
            mockPlayerRecentActions.delete(playerName);
        } else {
            mockPlayerRecentActions.set(playerName, recentActions);
        }
    }
}

// Mock player object
function createMockPlayer(name) {
    return {
        name: name,
        location: { x: 0, y: 64, z: 0 },
        dimension: { id: "minecraft:overworld" }
    };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function clearAllActions() {
    mockPlayerRecentActions.clear();
}

// ============================================================================
// TEST SUITE
// ============================================================================

console.log("═══════════════════════════════════════════════════════════════");
console.log("  PRUEBAS: Sistema de Detección de Acciones Recientes");
console.log("═══════════════════════════════════════════════════════════════\n");

let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
    try {
        clearAllActions();
        testFn();
        console.log(`✓ PASS: ${description}`);
        testsPassed++;
    } catch (error) {
        console.log(`✗ FAIL: ${description}`);
        console.log(`  Error: ${error.message}`);
        testsFailed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(
            message || `Expected ${expected} but got ${actual}`
        );
    }
}

function assertNotNull(value, message) {
    if (value === null || value === undefined) {
        throw new Error(message || "Expected non-null value");
    }
}

function assertNull(value, message) {
    if (value !== null && value !== undefined) {
        throw new Error(message || "Expected null value");
    }
}

// ============================================================================
// TEST CASES
// ============================================================================

// Test 1: Registrar una acción simple
test("Debe registrar una acción simple correctamente", () => {
    const player = createMockPlayer("TestPlayer1");
    
    recordRecentAction(player.name, ActionCategories.MINING, {
        blockType: "minecraft:diamond_ore"
    });
    
    const recentAction = getRecentAction(player);
    
    assertNotNull(recentAction, "Debe haber una acción reciente");
    assertEquals(recentAction.category, ActionCategories.MINING, "La categoría debe ser minería");
    assertEquals(recentAction.details.blockType, "minecraft:diamond_ore", "El detalle debe coincidir");
});

// Test 2: Retornar null cuando no hay acciones
test("Debe retornar null cuando no hay acciones recientes", () => {
    const player = createMockPlayer("TestPlayer2");
    
    const recentAction = getRecentAction(player);
    
    assertNull(recentAction, "No debe haber acciones recientes");
});

// Test 3: Priorizar acciones por relevancia
test("Debe priorizar muerte sobre minería (mayor relevancia)", () => {
    const player = createMockPlayer("TestPlayer3");
    
    // Registrar minería primero
    recordRecentAction(player.name, ActionCategories.MINING, {
        blockType: "minecraft:iron_ore"
    });
    
    // Registrar muerte después (más relevante)
    recordRecentAction(player.name, ActionCategories.DEATH, {
        cause: "zombie"
    });
    
    const recentAction = getRecentAction(player);
    
    assertEquals(recentAction.category, ActionCategories.DEATH, 
        "Debe priorizar muerte (peso 10) sobre minería (peso 4)");
});

// Test 4: Priorizar acciones más recientes con igual relevancia
test("Debe priorizar acción más reciente cuando tienen igual relevancia", () => {
    const player = createMockPlayer("TestPlayer4");
    
    // Registrar construcción
    recordRecentAction(player.name, ActionCategories.CONSTRUCTION, {
        blockType: "minecraft:chest"
    });
    
    // Esperar un poco y registrar crafting (misma relevancia: peso 5)
    setTimeout(() => {}, 100);
    
    recordRecentAction(player.name, ActionCategories.CRAFTING, {
        station: "minecraft:crafting_table"
    });
    
    const recentAction = getRecentAction(player);
    
    // La más reciente debe ganar por factor de recencia
    assertEquals(recentAction.category, ActionCategories.CRAFTING,
        "Debe priorizar la acción más reciente cuando tienen igual peso");
});

// Test 5: Filtrar acciones por categoría
test("Debe filtrar acciones por categoría específica", () => {
    const player = createMockPlayer("TestPlayer5");
    
    // Registrar múltiples acciones de diferentes categorías
    recordRecentAction(player.name, ActionCategories.MINING, { blockType: "diamond_ore" });
    recordRecentAction(player.name, ActionCategories.COMBAT, { enemyType: "zombie" });
    recordRecentAction(player.name, ActionCategories.MINING, { blockType: "gold_ore" });
    
    const miningActions = getRecentActionsByCategory(player, ActionCategories.MINING);
    
    assertEquals(miningActions.length, 2, "Debe haber 2 acciones de minería");
    assert(miningActions.every(a => a.category === ActionCategories.MINING), 
        "Todas deben ser de minería");
});

// Test 6: Verificar ventana temporal de 5 minutos
test("Debe considerar solo acciones dentro de ventana de 5 minutos", () => {
    const player = createMockPlayer("TestPlayer6");
    
    // Registrar acción actual
    recordRecentAction(player.name, ActionCategories.MINING, {
        blockType: "minecraft:diamond_ore"
    });
    
    // Simular acción antigua (hace más de 5 minutos)
    const actions = mockPlayerRecentActions.get(player.name);
    actions.push({
        category: ActionCategories.COMBAT,
        timestamp: Date.now() - (6 * 60 * 1000), // Hace 6 minutos
        details: { enemyType: "zombie" }
    });
    
    const recentAction = getRecentAction(player);
    
    assertEquals(recentAction.category, ActionCategories.MINING,
        "Solo debe considerar acción dentro de ventana de 5 minutos");
});

// Test 7: Limpieza de acciones antiguas
test("Debe limpiar acciones fuera de ventana temporal", () => {
    const player = createMockPlayer("TestPlayer7");
    
    // Registrar acción antigua manualmente
    mockPlayerRecentActions.set(player.name, [{
        category: ActionCategories.MINING,
        timestamp: Date.now() - (6 * 60 * 1000), // Hace 6 minutos
        details: {}
    }]);
    
    cleanupOldActions();
    
    assertNull(getRecentAction(player), 
        "No debe haber acciones después de la limpieza");
});

// Test 8: Todas las categorías están disponibles
test("Debe soportar las 8 categorías de acciones (Requisito 11.8)", () => {
    const player = createMockPlayer("TestPlayer8");
    
    const categories = [
        ActionCategories.MINING,
        ActionCategories.COMBAT,
        ActionCategories.CONSTRUCTION,
        ActionCategories.TRADING,
        ActionCategories.EXPLORATION,
        ActionCategories.CRAFTING,
        ActionCategories.FARMING,
        ActionCategories.DEATH
    ];
    
    assertEquals(categories.length, 8, "Debe haber exactamente 8 categorías");
    
    // Verificar que cada categoría se puede registrar
    categories.forEach(category => {
        recordRecentAction(player.name, category, { test: true });
    });
    
    const allActions = mockPlayerRecentActions.get(player.name);
    assertEquals(allActions.length, 8, "Debe haber registrado 8 acciones");
});

// Test 9: Múltiples jugadores independientes
test("Debe manejar acciones de múltiples jugadores independientemente", () => {
    const player1 = createMockPlayer("Player1");
    const player2 = createMockPlayer("Player2");
    
    recordRecentAction(player1.name, ActionCategories.MINING, { blockType: "diamond" });
    recordRecentAction(player2.name, ActionCategories.COMBAT, { enemyType: "zombie" });
    
    const action1 = getRecentAction(player1);
    const action2 = getRecentAction(player2);
    
    assertEquals(action1.category, ActionCategories.MINING, "Player1 debe tener minería");
    assertEquals(action2.category, ActionCategories.COMBAT, "Player2 debe tener combate");
});

// Test 10: Detalles personalizados de acciones
test("Debe preservar detalles personalizados de cada acción", () => {
    const player = createMockPlayer("TestPlayer10");
    
    const customDetails = {
        blockType: "minecraft:diamond_ore",
        location: { x: 100, y: 12, z: 200 },
        dimension: "minecraft:overworld"
    };
    
    recordRecentAction(player.name, ActionCategories.MINING, customDetails);
    
    const recentAction = getRecentAction(player);
    
    assertEquals(recentAction.details.blockType, customDetails.blockType, "Debe preservar blockType");
    assertEquals(recentAction.details.location.x, customDetails.location.x, "Debe preservar ubicación X");
    assertEquals(recentAction.details.dimension, customDetails.dimension, "Debe preservar dimensión");
});

// Test 11: Pesos de relevancia correctos
test("Debe usar pesos de relevancia correctos para cada categoría", () => {
    assertEquals(ActionRelevanceWeights[ActionCategories.DEATH], 10, "Muerte debe tener peso 10");
    assertEquals(ActionRelevanceWeights[ActionCategories.COMBAT], 8, "Combate debe tener peso 8");
    assertEquals(ActionRelevanceWeights[ActionCategories.TRADING], 7, "Comercio debe tener peso 7");
    assertEquals(ActionRelevanceWeights[ActionCategories.EXPLORATION], 6, "Exploración debe tener peso 6");
    assertEquals(ActionRelevanceWeights[ActionCategories.CRAFTING], 5, "Crafting debe tener peso 5");
    assertEquals(ActionRelevanceWeights[ActionCategories.CONSTRUCTION], 5, "Construcción debe tener peso 5");
    assertEquals(ActionRelevanceWeights[ActionCategories.MINING], 4, "Minería debe tener peso 4");
    assertEquals(ActionRelevanceWeights[ActionCategories.FARMING], 3, "Farming debe tener peso 3");
});

// Test 12: Ventana temporal correcta (5 minutos)
test("Debe usar ventana temporal de 5 minutos (300000ms)", () => {
    assertEquals(RECENT_ACTION_WINDOW_MS, 5 * 60 * 1000, 
        "Ventana temporal debe ser exactamente 5 minutos");
});

// ============================================================================
// RESUMEN DE RESULTADOS
// ============================================================================

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("  RESUMEN DE PRUEBAS");
console.log("═══════════════════════════════════════════════════════════════");
console.log(`Total de pruebas: ${testsPassed + testsFailed}`);
console.log(`Pruebas exitosas: ${testsPassed} ✓`);
console.log(`Pruebas fallidas: ${testsFailed} ✗`);
console.log(`Tasa de éxito: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log("═══════════════════════════════════════════════════════════════\n");

if (testsFailed === 0) {
    console.log("¡Todas las pruebas pasaron exitosamente! ✓✓✓");
} else {
    console.log("Algunas pruebas fallaron. Revisa los errores arriba.");
}
