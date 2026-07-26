/**
 * TEST DE PROPIEDAD ROUND-TRIP (Task 15.4)
 * Requisito: 10.4
 * 
 * OBJETIVO:
 * Validar que la propiedad round-trip funciona correctamente:
 * Parser → Pretty Printer → Parser debe producir un objeto equivalente
 * 
 * CRITERIO DE ACEPTACIÓN:
 * FOR ALL objetos de Configuración válidos, 
 * parsear luego imprimir luego parsear SHALL producir un objeto equivalente
 * 
 * PRUEBAS:
 * 1. Configuración completa (todos los campos)
 * 2. Configuración mínima (solo campos requeridos)
 * 3. Configuración con valores por defecto
 * 4. Configuración con valores en límites (min/max)
 * 5. Configuración mixta (algunos campos requeridos, algunos opcionales)
 */

console.log("════════════════════════════════════════════════════════════════");
console.log("  TEST DE PROPIEDAD ROUND-TRIP - Task 15.4");
console.log("  Parser → Pretty Printer → Parser debe producir objeto equivalente");
console.log("════════════════════════════════════════════════════════════════\n");

// ════════════════════════════════════════════════════════════════════════════
//  CONFIGURACIONES DE PRUEBA
// ════════════════════════════════════════════════════════════════════════════

/**
 * Configuración completa con todos los campos especificados
 */
const fullConfig = {
    bondSystem: {
        initialBond: 10,
        bondMultiplier: 1.5,
        tierThresholds: {
            stranger: 0,
            watched: 100,
            familiar: 250,
            obsessed: 400
        },
        maxBond: 500
    },
    chatSystem: {
        cooldownSeconds: 45,
        responseProbabilities: {
            tier0: 0.25,
            tier1: 0.45,
            tier2: 0.65,
            tier3: 0.85
        },
        enableNicknameSystem: false
    },
    rareEventsSystem: {
        baseRareDialogueProbability: 0.08,
        baseUltraRareDialogueProbability: 0.02,
        specialAppearanceProbability: 0.01,
        secretInteractionProbability: 0.015,
        bonusProbabilityAfter50Hours: 0.008,
        bonusProbabilityTier3: 0.015,
        enableEventTracking: false
    }
};

/**
 * Configuración mínima con solo campos requeridos
 */
const minimalConfig = {
    bondSystem: {
        tierThresholds: {
            stranger: 0,
            watched: 100,
            familiar: 250,
            obsessed: 400
        }
    },
    chatSystem: {
        responseProbabilities: {
            tier0: 0.20,
            tier1: 0.40,
            tier2: 0.60,
            tier3: 0.80
        }
    },
    rareEventsSystem: {}
};

/**
 * Configuración con valores en los límites (min/max)
 */
const boundaryConfig = {
    bondSystem: {
        initialBond: 0,  // Mínimo
        bondMultiplier: 0.1,  // Mínimo
        tierThresholds: {
            stranger: 0,
            watched: 100,
            familiar: 250,
            obsessed: 400
        },
        maxBond: 1000  // Máximo
    },
    chatSystem: {
        cooldownSeconds: 10,  // Mínimo
        responseProbabilities: {
            tier0: 0.01,  // Mínimo
            tier1: 0.25,
            tier2: 0.50,
            tier3: 1.0  // Máximo
        },
        enableNicknameSystem: true
    },
    rareEventsSystem: {
        baseRareDialogueProbability: 0.01,  // Mínimo
        baseUltraRareDialogueProbability: 0.001,  // Mínimo
        specialAppearanceProbability: 0.001,  // Mínimo
        secretInteractionProbability: 0.001,  // Mínimo
        bonusProbabilityAfter50Hours: 0.001,  // Mínimo
        bonusProbabilityTier3: 0.001,  // Mínimo
        enableEventTracking: true
    }
};

/**
 * Configuración mixta (algunos campos especificados, otros usan defaults)
 */
const mixedConfig = {
    bondSystem: {
        initialBond: 25,
        tierThresholds: {
            stranger: 0,
            watched: 120,
            familiar: 280,
            obsessed: 450
        }
        // bondMultiplier y maxBond usarán defaults
    },
    chatSystem: {
        cooldownSeconds: 20,
        responseProbabilities: {
            tier0: 0.15,
            tier1: 0.35,
            tier2: 0.55,
            tier3: 0.75
        }
        // enableNicknameSystem usará default
    },
    rareEventsSystem: {
        baseRareDialogueProbability: 0.06,
        enableEventTracking: false
        // Otros campos usarán defaults
    }
};

// ════════════════════════════════════════════════════════════════════════════
//  FUNCIONES AUXILIARES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Compara dos objetos de configuración profundamente para verificar equivalencia
 * @param {object} obj1 - Primer objeto
 * @param {object} obj2 - Segundo objeto
 * @param {string} path - Ruta actual (para mensajes de error)
 * @returns {{equal: boolean, differences: string[]}} Resultado de la comparación
 */
function deepCompareConfig(obj1, obj2, path = "root") {
    const differences = [];
    
    // Verificar tipo
    if (typeof obj1 !== typeof obj2) {
        differences.push(`${path}: tipo diferente (${typeof obj1} vs ${typeof obj2})`);
        return { equal: false, differences };
    }
    
    // Si no son objetos, comparar directamente
    if (typeof obj1 !== "object" || obj1 === null) {
        if (obj1 !== obj2) {
            // Tolerancia para números flotantes (diferencia < 0.0001)
            if (typeof obj1 === "number" && typeof obj2 === "number") {
                if (Math.abs(obj1 - obj2) < 0.0001) {
                    return { equal: true, differences: [] };
                }
            }
            differences.push(`${path}: valor diferente (${obj1} vs ${obj2})`);
        }
        return { equal: differences.length === 0, differences };
    }
    
    // Comparar arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) {
            differences.push(`${path}: longitud de array diferente (${obj1.length} vs ${obj2.length})`);
            return { equal: false, differences };
        }
        
        for (let i = 0; i < obj1.length; i++) {
            const result = deepCompareConfig(obj1[i], obj2[i], `${path}[${i}]`);
            differences.push(...result.differences);
        }
        
        return { equal: differences.length === 0, differences };
    }
    
    // Comparar objetos
    const keys1 = Object.keys(obj1).sort();
    const keys2 = Object.keys(obj2).sort();
    
    // Verificar que tienen las mismas claves
    const allKeys = new Set([...keys1, ...keys2]);
    
    for (const key of allKeys) {
        if (!(key in obj1)) {
            differences.push(`${path}.${key}: falta en primer objeto`);
            continue;
        }
        if (!(key in obj2)) {
            differences.push(`${path}.${key}: falta en segundo objeto`);
            continue;
        }
        
        const result = deepCompareConfig(obj1[key], obj2[key], `${path}.${key}`);
        differences.push(...result.differences);
    }
    
    return { equal: differences.length === 0, differences };
}

/**
 * Ejecuta el test de round-trip para una configuración
 * @param {string} testName - Nombre del test
 * @param {object} originalConfig - Configuración original
 * @returns {boolean} true si el test pasa
 */
function testRoundTrip(testName, originalConfig) {
    console.log(`\n┌─ TEST: ${testName}`);
    console.log("│");
    
    try {
        // PASO 1: Serializar la configuración original
        console.log("│ PASO 1: Serializar configuración original");
        const serialized1 = serializeConfig(originalConfig);
        console.log(`│   ✓ Serializado (${serialized1.length} caracteres)`);
        
        // PASO 2: Parsear la serialización
        console.log("│ PASO 2: Parsear serialización");
        const parsed1 = parseConfig(serialized1);
        
        if (!parsed1.success) {
            console.log(`│   ✗ Error al parsear: ${parsed1.error.message}`);
            console.log("└─ ❌ FALLO\n");
            return false;
        }
        console.log("│   ✓ Parseado exitosamente");
        
        // PASO 3: Serializar nuevamente
        console.log("│ PASO 3: Serializar segunda vez");
        const serialized2 = serializeConfig(parsed1.config);
        console.log(`│   ✓ Serializado (${serialized2.length} caracteres)`);
        
        // PASO 4: Parsear segunda vez
        console.log("│ PASO 4: Parsear segunda vez");
        const parsed2 = parseConfig(serialized2);
        
        if (!parsed2.success) {
            console.log(`│   ✗ Error al parsear: ${parsed2.error.message}`);
            console.log("└─ ❌ FALLO\n");
            return false;
        }
        console.log("│   ✓ Parseado exitosamente");
        
        // PASO 5: Comparar configuraciones
        console.log("│ PASO 5: Comparar configuraciones");
        const comparison1 = deepCompareConfig(originalConfig, parsed1.config);
        const comparison2 = deepCompareConfig(parsed1.config, parsed2.config);
        
        if (!comparison1.equal) {
            console.log("│   ✗ Original vs Primera Parseada: DIFERENTE");
            for (const diff of comparison1.differences) {
                console.log(`│     - ${diff}`);
            }
            console.log("└─ ❌ FALLO\n");
            return false;
        }
        
        if (!comparison2.equal) {
            console.log("│   ✗ Primera Parseada vs Segunda Parseada: DIFERENTE");
            for (const diff of comparison2.differences) {
                console.log(`│     - ${diff}`);
            }
            console.log("└─ ❌ FALLO\n");
            return false;
        }
        
        console.log("│   ✓ Todas las configuraciones son equivalentes");
        
        // PASO 6: Verificar que las serializaciones son idénticas
        console.log("│ PASO 6: Comparar serializaciones");
        if (serialized1 === serialized2) {
            console.log("│   ✓ Serializaciones idénticas (round-trip perfecto)");
        } else {
            console.log("│   ⚠ Serializaciones diferentes pero objetos equivalentes");
            console.log("│     (Esto es aceptable si los objetos son funcionalmente iguales)");
        }
        
        console.log("└─ ✅ ÉXITO\n");
        return true;
        
    } catch (error) {
        console.log(`│   ✗ Error inesperado: ${error.message}`);
        console.log("└─ ❌ FALLO\n");
        return false;
    }
}

// ════════════════════════════════════════════════════════════════════════════
//  EJECUCIÓN DE TESTS
// ════════════════════════════════════════════════════════════════════════════

console.log("EJECUTANDO TESTS DE ROUND-TRIP...\n");

const results = {
    passed: 0,
    failed: 0,
    total: 0
};

// Test 1: Configuración completa
results.total++;
if (testRoundTrip("Configuración Completa (todos los campos)", fullConfig)) {
    results.passed++;
} else {
    results.failed++;
}

// Test 2: Configuración mínima
results.total++;
if (testRoundTrip("Configuración Mínima (solo campos requeridos)", minimalConfig)) {
    results.passed++;
} else {
    results.failed++;
}

// Test 3: Configuración con límites
results.total++;
if (testRoundTrip("Configuración con Valores en Límites (min/max)", boundaryConfig)) {
    results.passed++;
} else {
    results.failed++;
}

// Test 4: Configuración mixta
results.total++;
if (testRoundTrip("Configuración Mixta (parcial con defaults)", mixedConfig)) {
    results.passed++;
} else {
    results.failed++;
}

// ════════════════════════════════════════════════════════════════════════════
//  RESUMEN DE RESULTADOS
// ════════════════════════════════════════════════════════════════════════════

console.log("════════════════════════════════════════════════════════════════");
console.log("  RESUMEN DE RESULTADOS");
console.log("════════════════════════════════════════════════════════════════");
console.log(`Total de tests:    ${results.total}`);
console.log(`Tests exitosos:    ${results.passed} ✅`);
console.log(`Tests fallidos:    ${results.failed} ❌`);
console.log(`Tasa de éxito:     ${((results.passed / results.total) * 100).toFixed(1)}%`);
console.log("════════════════════════════════════════════════════════════════\n");

if (results.failed === 0) {
    console.log("✅ PROPIEDAD ROUND-TRIP VALIDADA");
    console.log("   Parser → Pretty Printer → Parser produce objetos equivalentes");
    console.log("   Task 15.4 COMPLETADA\n");
} else {
    console.log("❌ PROPIEDAD ROUND-TRIP FALLÓ");
    console.log(`   ${results.failed} de ${results.total} tests fallaron`);
    console.log("   Se requiere corrección\n");
}

// Retornar código de salida apropiado
if (results.failed > 0) {
    process.exit(1);
}
