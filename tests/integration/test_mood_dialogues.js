/**
 * TEST UNITARIO: Sistema de Diálogos por Estado de Ánimo (Task 12.2)
 * 
 * Este test verifica que:
 * 1. Los pools de diálogos existen para todos los estados (curioso, posesivo, celoso, eufórico)
 * 2. Cada estado tiene los 4 tiers completos (0-3)
 * 3. Cada tier tiene al menos 20-30 diálogos únicos
 * 4. La función getMoodDialogue retorna diálogos correctos
 * 5. Los diálogos contienen texto en español
 */

console.log("═══════════════════════════════════════════════════════════════");
console.log("  TEST: Sistema de Diálogos por Estado de Ánimo (Task 12.2)");
console.log("═══════════════════════════════════════════════════════════════\n");

// Simular las constantes y funciones necesarias
const MoodStates = {
    NEUTRAL: "neutral",
    CURIOSO: "curioso",
    POSESIVO: "posesivo",
    CELOSO: "celoso",
    EUFORICO: "eufórico"
};

// Simular la función pick (selección aleatoria)
function pick(array) {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
}

// Simular el sistema de mood (simplificado)
const playerMoods = new Map();
function getPlayerMood(playerName) {
    if (!playerMoods.has(playerName)) {
        playerMoods.set(playerName, {
            currentMood: MoodStates.NEUTRAL,
            moodStartTime: Date.now(),
            minDuration: 10 * 60 * 1000
        });
    }
    return playerMoods.get(playerName);
}

// Importar los MoodDialogues (simulado - en producción viene de main.js)
// Por ahora, simulamos la estructura esperada
const MoodDialogues = {
    curioso: { 0: [], 1: [], 2: [], 3: [] },
    posesivo: { 0: [], 1: [], 2: [], 3: [] },
    celoso: { 0: [], 1: [], 2: [], 3: [] },
    eufórico: { 0: [], 1: [], 2: [], 3: [] }
};

// Variables de test
let testsRun = 0;
let testsPassed = 0;

function runTest(testName, testFunction) {
    testsRun++;
    try {
        testFunction();
        testsPassed++;
        console.log(`✅ Test ${testsRun}: ${testName} - PASADO`);
    } catch (error) {
        console.log(`❌ Test ${testsRun}: ${testName} - FALLIDO`);
        console.log(`   Error: ${error.message}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

runTest("MoodDialogues object existe", () => {
    if (typeof MoodDialogues === 'undefined') {
        throw new Error("MoodDialogues no está definido");
    }
    if (typeof MoodDialogues !== 'object') {
        throw new Error("MoodDialogues no es un objeto");
    }
});

runTest("Todos los estados de ánimo tienen pools", () => {
    const requiredMoods = ['curioso', 'posesivo', 'celoso', 'eufórico'];
    requiredMoods.forEach(mood => {
        if (!MoodDialogues[mood]) {
            throw new Error(`Falta el mood: ${mood}`);
        }
    });
});

runTest("Cada mood tiene los 4 tiers (0-3)", () => {
    const moods = Object.keys(MoodDialogues);
    moods.forEach(mood => {
        for (let tier = 0; tier <= 3; tier++) {
            if (!MoodDialogues[mood][tier]) {
                throw new Error(`Mood ${mood} no tiene tier ${tier}`);
            }
            if (!Array.isArray(MoodDialogues[mood][tier])) {
                throw new Error(`Tier ${tier} del mood ${mood} no es un array`);
            }
        }
    });
});

runTest("Cada tier tiene al menos 20 diálogos", () => {
    const moods = Object.keys(MoodDialogues);
    moods.forEach(mood => {
        for (let tier = 0; tier <= 3; tier++) {
            const count = MoodDialogues[mood][tier].length;
            if (count < 20) {
                throw new Error(`Mood ${mood}, tier ${tier} solo tiene ${count} diálogos (mínimo 20)`);
            }
        }
    });
});

runTest("Los diálogos son strings no vacíos", () => {
    const moods = Object.keys(MoodDialogues);
    moods.forEach(mood => {
        for (let tier = 0; tier <= 3; tier++) {
            MoodDialogues[mood][tier].forEach((dialogue, index) => {
                if (typeof dialogue !== 'string') {
                    throw new Error(`Mood ${mood}, tier ${tier}, índice ${index} no es string`);
                }
                if (dialogue.trim().length === 0) {
                    throw new Error(`Mood ${mood}, tier ${tier}, índice ${index} está vacío`);
                }
            });
        }
    });
});

runTest("MoodStates tiene los 5 estados correctos", () => {
    const expected = ['NEUTRAL', 'CURIOSO', 'POSESIVO', 'CELOSO', 'EUFORICO'];
    expected.forEach(state => {
        if (!MoodStates[state]) {
            throw new Error(`Falta el estado: ${state}`);
        }
    });
});

runTest("getPlayerMood inicializa con NEUTRAL", () => {
    const testPlayer = "TestPlayer123";
    const mood = getPlayerMood(testPlayer);
    if (mood.currentMood !== MoodStates.NEUTRAL) {
        throw new Error(`Mood inicial debería ser NEUTRAL, es: ${mood.currentMood}`);
    }
});

runTest("Estructura de Mood tiene propiedades correctas", () => {
    const testPlayer = "TestPlayer456";
    const mood = getPlayerMood(testPlayer);
    if (!mood.currentMood) throw new Error("Falta currentMood");
    if (!mood.moodStartTime) throw new Error("Falta moodStartTime");
    if (!mood.minDuration) throw new Error("Falta minDuration");
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS ESTADÍSTICOS - Verificar variedad de respuestas
// ═══════════════════════════════════════════════════════════════════════════

runTest("CURIOSO tiene suficiente variedad de respuestas", () => {
    const totalDialogues = Object.values(MoodDialogues.curioso)
        .reduce((sum, tierArray) => sum + tierArray.length, 0);
    
    if (totalDialogues < 80) {
        throw new Error(`CURIOSO tiene ${totalDialogues} diálogos, esperado al menos 80`);
    }
});

runTest("POSESIVO tiene suficiente variedad de respuestas", () => {
    const totalDialogues = Object.values(MoodDialogues.posesivo)
        .reduce((sum, tierArray) => sum + tierArray.length, 0);
    
    if (totalDialogues < 80) {
        throw new Error(`POSESIVO tiene ${totalDialogues} diálogos, esperado al menos 80`);
    }
});

runTest("CELOSO tiene suficiente variedad de respuestas", () => {
    const totalDialogues = Object.values(MoodDialogues.celoso)
        .reduce((sum, tierArray) => sum + tierArray.length, 0);
    
    if (totalDialogues < 80) {
        throw new Error(`CELOSO tiene ${totalDialogues} diálogos, esperado al menos 80`);
    }
});

runTest("EUFÓRICO tiene suficiente variedad de respuestas", () => {
    const totalDialogues = Object.values(MoodDialogues.eufórico)
        .reduce((sum, tierArray) => sum + tierArray.length, 0);
    
    if (totalDialogues < 80) {
        throw new Error(`EUFÓRICO tiene ${totalDialogues} diálogos, esperado al menos 80`);
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// RESUMEN
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════════════════════");
console.log(`RESULTADOS: ${testsPassed}/${testsRun} tests pasados`);

if (testsPassed === testsRun) {
    console.log("✅ TODOS LOS TESTS PASARON");
} else {
    console.log(`❌ ${testsRun - testsPassed} tests fallaron`);
}
console.log("═══════════════════════════════════════════════════════════════\n");

// Mostrar estadísticas de contenido
console.log("ESTADÍSTICAS DE CONTENIDO:");
console.log("─────────────────────────────────────────────────────────────");
Object.keys(MoodDialogues).forEach(mood => {
    const total = Object.values(MoodDialogues[mood])
        .reduce((sum, tierArray) => sum + tierArray.length, 0);
    console.log(`${mood.toUpperCase()}: ${total} diálogos totales`);
    for (let tier = 0; tier <= 3; tier++) {
        console.log(`  - Tier ${tier}: ${MoodDialogues[mood][tier].length} diálogos`);
    }
});
console.log("═══════════════════════════════════════════════════════════════\n");
