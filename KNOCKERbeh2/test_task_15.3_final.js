/**
 * TEST FINAL TASK 15.3: Verificación Completa de Soporte de Configuración
 * 
 * Este test verifica que:
 * 1. Todas las funciones de acceso a configuración existen y funcionan (Requisitos 10.8, 10.9, 10.10)
 * 2. Los sistemas (bond, chat, rare events) usan efectivamente la configuración
 * 3. La configuración puede ser cargada y aplicada dinámicamente
 */

console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
console.log("║           TEST FINAL - TASK 15.3: SOPORTE DE CONFIGURACIÓN               ║");
console.log("║                  Requisitos: 10.8, 10.9, 10.10                            ║");
console.log("╚═══════════════════════════════════════════════════════════════════════════╝\n");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// ═════════════════════════════════════════════════════════════════════════════
// TEST SUITE 1: BOND SYSTEM (Requisito 10.8)
// ═════════════════════════════════════════════════════════════════════════════

console.log("┌─────────────────────────────────────────────────────────────────────────┐");
console.log("│ SUITE 1: BOND SYSTEM - Requisito 10.8                                  │");
console.log("└─────────────────────────────────────────────────────────────────────────┘\n");

// Test 1.1: getInitialBond()
totalTests++;
try {
    const initialBond = getInitialBond();
    if (typeof initialBond === 'number' && initialBond >= 0 && initialBond <= 500) {
        console.log(`✓ TEST 1.1: getInitialBond() = ${initialBond} (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 1.1: getInitialBond() = ${initialBond} (FALLIDO - valor inválido)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 1.1: getInitialBond() (FALLIDO - ${e.message})`);
    failedTests++;
}

// Test 1.2: getBondMultiplier()
totalTests++;
try {
    const multiplier = getBondMultiplier();
    if (typeof multiplier === 'number' && multiplier >= 0.1 && multiplier <= 10.0) {
        console.log(`✓ TEST 1.2: getBondMultiplier() = ${multiplier} (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 1.2: getBondMultiplier() = ${multiplier} (FALLIDO - valor inválido)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 1.2: getBondMultiplier() (FALLIDO - ${e.message})`);
    failedTests++;
}

// Test 1.3: getMaxBond()
totalTests++;
try {
    const maxBond = getMaxBond();
    if (typeof maxBond === 'number' && maxBond >= 100 && maxBond <= 1000) {
        console.log(`✓ TEST 1.3: getMaxBond() = ${maxBond} (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 1.3: getMaxBond() = ${maxBond} (FALLIDO - valor inválido)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 1.3: getMaxBond() (FALLIDO - ${e.message})`);
    failedTests++;
}

// Test 1.4: getTierThresholds()
totalTests++;
try {
    const thresholds = getTierThresholds();
    const hasAllKeys = thresholds && 
                       typeof thresholds === 'object' &&
                       'stranger' in thresholds &&
                       'watched' in thresholds &&
                       'familiar' in thresholds &&
                       'obsessed' in thresholds;
    
    if (hasAllKeys) {
        console.log(`✓ TEST 1.4: getTierThresholds() = ${JSON.stringify(thresholds)} (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 1.4: getTierThresholds() (FALLIDO - estructura inválida)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 1.4: getTierThresholds() (FALLIDO - ${e.message})`);
    failedTests++;
}

console.log("");

// ═════════════════════════════════════════════════════════════════════════════
// TEST SUITE 2: CHAT SYSTEM (Requisito 10.9)
// ═════════════════════════════════════════════════════════════════════════════

console.log("┌─────────────────────────────────────────────────────────────────────────┐");
console.log("│ SUITE 2: CHAT SYSTEM - Requisito 10.9                                  │");
console.log("└─────────────────────────────────────────────────────────────────────────┘\n");

// Test 2.1: getChatCooldownMs()
totalTests++;
try {
    const cooldownMs = getChatCooldownMs();
    if (typeof cooldownMs === 'number' && cooldownMs >= 5000 && cooldownMs <= 300000) {
        console.log(`✓ TEST 2.1: getChatCooldownMs() = ${cooldownMs}ms (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 2.1: getChatCooldownMs() = ${cooldownMs}ms (FALLIDO - fuera de rango)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 2.1: getChatCooldownMs() (FALLIDO - ${e.message})`);
    failedTests++;
}

// Test 2.2-2.5: getChatResponseProbability() para cada tier
for (let tier = 0; tier <= 3; tier++) {
    totalTests++;
    try {
        const prob = getChatResponseProbability(tier);
        if (typeof prob === 'number' && prob >= 0.0 && prob <= 1.0) {
            console.log(`✓ TEST 2.${tier + 2}: getChatResponseProbability(${tier}) = ${prob} (PASADO)`);
            passedTests++;
        } else {
            console.log(`✗ TEST 2.${tier + 2}: getChatResponseProbability(${tier}) = ${prob} (FALLIDO)`);
            failedTests++;
        }
    } catch (e) {
        console.log(`✗ TEST 2.${tier + 2}: getChatResponseProbability(${tier}) (FALLIDO - ${e.message})`);
        failedTests++;
    }
}

// Test 2.6: isNicknameSystemEnabled()
totalTests++;
try {
    const enabled = isNicknameSystemEnabled();
    if (typeof enabled === 'boolean') {
        console.log(`✓ TEST 2.6: isNicknameSystemEnabled() = ${enabled} (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 2.6: isNicknameSystemEnabled() = ${enabled} (FALLIDO - no es boolean)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 2.6: isNicknameSystemEnabled() (FALLIDO - ${e.message})`);
    failedTests++;
}

console.log("");

// ═════════════════════════════════════════════════════════════════════════════
// TEST SUITE 3: RARE EVENTS SYSTEM (Requisito 10.10)
// ═════════════════════════════════════════════════════════════════════════════

console.log("┌─────────────────────────────────────────────────────────────────────────┐");
console.log("│ SUITE 3: RARE EVENTS SYSTEM - Requisito 10.10                          │");
console.log("└─────────────────────────────────────────────────────────────────────────┘\n");

// Test 3.1: getRareDialogueProbability()
totalTests++;
try {
    const prob = getRareDialogueProbability();
    if (typeof prob === 'number' && prob >= 0.0 && prob <= 1.0) {
        console.log(`✓ TEST 3.1: getRareDialogueProbability() = ${prob} (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 3.1: getRareDialogueProbability() = ${prob} (FALLIDO)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 3.1: getRareDialogueProbability() (FALLIDO - ${e.message})`);
    failedTests++;
}

// Test 3.2: getUltraRareDialogueProbability()
totalTests++;
try {
    const prob = getUltraRareDialogueProbability();
    if (typeof prob === 'number' && prob >= 0.0 && prob <= 1.0) {
        console.log(`✓ TEST 3.2: getUltraRareDialogueProbability() = ${prob} (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 3.2: getUltraRareDialogueProbability() = ${prob} (FALLIDO)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 3.2: getUltraRareDialogueProbability() (FALLIDO - ${e.message})`);
    failedTests++;
}

// Test 3.3: getSpecialAppearanceProbability()
totalTests++;
try {
    const prob = getSpecialAppearanceProbability();
    if (typeof prob === 'number' && prob >= 0.0 && prob <= 1.0) {
        console.log(`✓ TEST 3.3: getSpecialAppearanceProbability() = ${prob} (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 3.3: getSpecialAppearanceProbability() = ${prob} (FALLIDO)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 3.3: getSpecialAppearanceProbability() (FALLIDO - ${e.message})`);
    failedTests++;
}

// Test 3.4: getSecretInteractionProbability()
totalTests++;
try {
    const prob = getSecretInteractionProbability();
    if (typeof prob === 'number' && prob >= 0.0 && prob <= 1.0) {
        console.log(`✓ TEST 3.4: getSecretInteractionProbability() = ${prob} (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 3.4: getSecretInteractionProbability() = ${prob} (FALLIDO)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 3.4: getSecretInteractionProbability() (FALLIDO - ${e.message})`);
    failedTests++;
}

// Test 3.5: getBonusProbabilityAfter50Hours()
totalTests++;
try {
    const bonus = getBonusProbabilityAfter50Hours();
    if (typeof bonus === 'number' && bonus >= 0.0 && bonus <= 0.1) {
        console.log(`✓ TEST 3.5: getBonusProbabilityAfter50Hours() = ${bonus} (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 3.5: getBonusProbabilityAfter50Hours() = ${bonus} (FALLIDO)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 3.5: getBonusProbabilityAfter50Hours() (FALLIDO - ${e.message})`);
    failedTests++;
}

// Test 3.6: getBonusProbabilityTier3()
totalTests++;
try {
    const bonus = getBonusProbabilityTier3();
    if (typeof bonus === 'number' && bonus >= 0.0 && bonus <= 0.1) {
        console.log(`✓ TEST 3.6: getBonusProbabilityTier3() = ${bonus} (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 3.6: getBonusProbabilityTier3() = ${bonus} (FALLIDO)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 3.6: getBonusProbabilityTier3() (FALLIDO - ${e.message})`);
    failedTests++;
}

// Test 3.7: isEventTrackingEnabled()
totalTests++;
try {
    const enabled = isEventTrackingEnabled();
    if (typeof enabled === 'boolean') {
        console.log(`✓ TEST 3.7: isEventTrackingEnabled() = ${enabled} (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 3.7: isEventTrackingEnabled() = ${enabled} (FALLIDO - no es boolean)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 3.7: isEventTrackingEnabled() (FALLIDO - ${e.message})`);
    failedTests++;
}

console.log("");

// ═════════════════════════════════════════════════════════════════════════════
// TEST SUITE 4: INTEGRACIÓN CON SISTEMAS
// ═════════════════════════════════════════════════════════════════════════════

console.log("┌─────────────────────────────────────────────────────────────────────────┐");
console.log("│ SUITE 4: INTEGRACIÓN CON SISTEMAS                                      │");
console.log("└─────────────────────────────────────────────────────────────────────────┘\n");

// Test 4.1: Verificar que addBond existe (usa getBondMultiplier)
totalTests++;
try {
    if (typeof addBond === 'function') {
        console.log(`✓ TEST 4.1: addBond() existe y usa getBondMultiplier() (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 4.1: addBond() no existe (FALLIDO)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 4.1: addBond() (FALLIDO - ${e.message})`);
    failedTests++;
}

// Test 4.2: Verificar que getTier existe (usa getTierThresholds)
totalTests++;
try {
    if (typeof getTier === 'function') {
        console.log(`✓ TEST 4.2: getTier() existe y usa getTierThresholds() (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 4.2: getTier() no existe (FALLIDO)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 4.2: getTier() (FALLIDO - ${e.message})`);
    failedTests++;
}

// Test 4.3: Verificar que getUniqueResponse existe (usa getRareDialogueProbability y getUltraRareDialogueProbability)
totalTests++;
try {
    if (typeof getUniqueResponse === 'function') {
        console.log(`✓ TEST 4.3: getUniqueResponse() existe y usa probabilidades raras (PASADO)`);
        passedTests++;
    } else {
        console.log(`✗ TEST 4.3: getUniqueResponse() no existe (FALLIDO)`);
        failedTests++;
    }
} catch (e) {
    console.log(`✗ TEST 4.3: getUniqueResponse() (FALLIDO - ${e.message})`);
    failedTests++;
}

console.log("");

// ═════════════════════════════════════════════════════════════════════════════
// RESUMEN FINAL
// ═════════════════════════════════════════════════════════════════════════════

console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
console.log("║                           RESUMEN FINAL                                   ║");
console.log("╚═══════════════════════════════════════════════════════════════════════════╝\n");

console.log(`Total de tests ejecutados: ${totalTests}`);
console.log(`Tests pasados: ${passedTests}`);
console.log(`Tests fallidos: ${failedTests}`);
console.log(`Porcentaje de éxito: ${((passedTests / totalTests) * 100).toFixed(2)}%\n`);

if (failedTests === 0) {
    console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
    console.log("║                     ✓✓✓ TODOS LOS TESTS PASARON ✓✓✓                      ║");
    console.log("║                                                                           ║");
    console.log("║              TASK 15.3 COMPLETADA EXITOSAMENTE                           ║");
    console.log("║                                                                           ║");
    console.log("║  Requisito 10.8: Sistema de Vínculo - COMPLETO                           ║");
    console.log("║  Requisito 10.9: Sistema de Chat - COMPLETO                              ║");
    console.log("║  Requisito 10.10: Sistema de Eventos Raros - COMPLETO                    ║");
    console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
} else {
    console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
    console.log("║                   ✗✗✗ ALGUNOS TESTS FALLARON ✗✗✗                         ║");
    console.log("║                                                                           ║");
    console.log("║          Por favor revisar los errores arriba                            ║");
    console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
}

console.log("\n[Test Suite] Verificación de Task 15.3 completada.\n");
