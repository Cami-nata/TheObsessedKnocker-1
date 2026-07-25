/**
 * PRUEBAS UNITARIAS PARA PARSER DE CONFIGURACIÓN - TAREA 15.1
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Este archivo contiene pruebas unitarias exhaustivas para el parseConfig()
 * implementado en main.js
 * 
 * Requisitos probados:
 * - 10.1: Parser de archivos de configuración válidos
 * - 10.2: Retornar errores descriptivos para configuraciones inválidas
 * - 10.5: Soporte de sintaxis JSON estándar
 * - 10.6: Validación de tipos de datos
 * 
 * Para ejecutar estas pruebas:
 * 1. Cargar el addon en Minecraft
 * 2. Escribir en chat: .runtests
 * 3. Revisar resultados en consola y chat
 */

// ═══════════════════════════════════════════════════════════════════════════
//  CASOS DE PRUEBA
// ═══════════════════════════════════════════════════════════════════════════

const TestCases = {
    // ───────────────────────────────────────────────────────────────────────
    // TEST 1: Configuración Válida Completa (Requisito 10.1, 10.5)
    // ───────────────────────────────────────────────────────────────────────
    validComplete: {
        name: "Configuración válida completa",
        input: `{
  "bondSystem": {
    "initialBond": 0,
    "bondMultiplier": 1.0,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 30,
    "responseProbabilities": {
      "tier0": 0.20,
      "tier1": 0.40,
      "tier2": 0.60,
      "tier3": 0.80
    },
    "enableNicknameSystem": true
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.05,
    "baseUltraRareDialogueProbability": 0.015,
    "specialAppearanceProbability": 0.007,
    "secretInteractionProbability": 0.01,
    "bonusProbabilityAfter50Hours": 0.005,
    "bonusProbabilityTier3": 0.01,
    "enableEventTracking": true
  }
}`,
        expectedSuccess: true,
        expectedError: null,
        validate: (result) => {
            return result.success === true &&
                   result.config.bondSystem.initialBond === 0 &&
                   result.config.chatSystem.cooldownSeconds === 30 &&
                   result.config.rareEventsSystem.baseRareDialogueProbability === 0.05;
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 2: Configuración con Valores Personalizados (Requisito 10.1, 10.8, 10.9, 10.10)
    // ───────────────────────────────────────────────────────────────────────
    validCustom: {
        name: "Configuración con valores personalizados",
        input: `{
  "bondSystem": {
    "initialBond": 50,
    "bondMultiplier": 1.5,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 45,
    "responseProbabilities": {
      "tier0": 0.25,
      "tier1": 0.45,
      "tier2": 0.65,
      "tier3": 0.85
    },
    "enableNicknameSystem": false
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.08,
    "baseUltraRareDialogueProbability": 0.02,
    "specialAppearanceProbability": 0.01,
    "secretInteractionProbability": 0.015,
    "bonusProbabilityAfter50Hours": 0.008,
    "bonusProbabilityTier3": 0.015,
    "enableEventTracking": false
  }
}`,
        expectedSuccess: true,
        expectedError: null,
        validate: (result) => {
            return result.success === true &&
                   result.config.bondSystem.initialBond === 50 &&
                   result.config.bondSystem.bondMultiplier === 1.5 &&
                   result.config.chatSystem.cooldownSeconds === 45 &&
                   result.config.chatSystem.enableNicknameSystem === false;
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 3: Sintaxis JSON Inválida (Requisito 10.2, 10.5)
    // ───────────────────────────────────────────────────────────────────────
    invalidSyntax: {
        name: "Sintaxis JSON inválida (coma extra)",
        input: `{
  "bondSystem": {
    "initialBond": 0,
  },
}`,
        expectedSuccess: false,
        expectedError: "SYNTAX_ERROR",
        validate: (result) => {
            return result.success === false &&
                   result.error.type === "SYNTAX_ERROR";
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 4: Campo Requerido Faltante (Requisito 10.2, 10.6)
    // ───────────────────────────────────────────────────────────────────────
    missingRequired: {
        name: "Campo requerido faltante (bondSystem.initialBond)",
        input: `{
  "bondSystem": {
    "bondMultiplier": 1.0,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 30,
    "responseProbabilities": {
      "tier0": 0.20,
      "tier1": 0.40,
      "tier2": 0.60,
      "tier3": 0.80
    }
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.05,
    "baseUltraRareDialogueProbability": 0.015,
    "specialAppearanceProbability": 0.007,
    "secretInteractionProbability": 0.01
  }
}`,
        expectedSuccess: false,
        expectedError: "MISSING_FIELD",
        validate: (result) => {
            return result.success === false &&
                   result.error.type === "MISSING_FIELD" &&
                   result.error.field.includes("initialBond");
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 5: Tipo de Dato Inválido (Requisito 10.2, 10.6)
    // ───────────────────────────────────────────────────────────────────────
    invalidType: {
        name: "Tipo de dato inválido (initialBond es string)",
        input: `{
  "bondSystem": {
    "initialBond": "cero",
    "bondMultiplier": 1.0,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 30,
    "responseProbabilities": {
      "tier0": 0.20,
      "tier1": 0.40,
      "tier2": 0.60,
      "tier3": 0.80
    }
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.05,
    "baseUltraRareDialogueProbability": 0.015,
    "specialAppearanceProbability": 0.007,
    "secretInteractionProbability": 0.01
  }
}`,
        expectedSuccess: false,
        expectedError: "INVALID_TYPE",
        validate: (result) => {
            return result.success === false &&
                   result.error.type === "INVALID_TYPE";
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 6: Valor Fuera de Rango (Requisito 10.2, 10.6)
    // ───────────────────────────────────────────────────────────────────────
    outOfRange: {
        name: "Valor fuera de rango (initialBond = 600, máx = 500)",
        input: `{
  "bondSystem": {
    "initialBond": 600,
    "bondMultiplier": 1.0,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 30,
    "responseProbabilities": {
      "tier0": 0.20,
      "tier1": 0.40,
      "tier2": 0.60,
      "tier3": 0.80
    }
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.05,
    "baseUltraRareDialogueProbability": 0.015,
    "specialAppearanceProbability": 0.007,
    "secretInteractionProbability": 0.01
  }
}`,
        expectedSuccess: false,
        expectedError: "OUT_OF_RANGE",
        validate: (result) => {
            return result.success === false &&
                   result.error.type === "OUT_OF_RANGE";
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 7: String Vacío (Requisito 10.2, 10.5)
    // ───────────────────────────────────────────────────────────────────────
    emptyString: {
        name: "String JSON vacío",
        input: "",
        expectedSuccess: false,
        expectedError: "SYNTAX_ERROR",
        validate: (result) => {
            return result.success === false &&
                   result.error.type === "SYNTAX_ERROR";
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 8: Input No-String (Requisito 10.2, 10.6)
    // ───────────────────────────────────────────────────────────────────────
    nonStringInput: {
        name: "Input no-string (objeto en vez de string)",
        input: { bondSystem: { initialBond: 0 } },
        expectedSuccess: false,
        expectedError: "INVALID_TYPE",
        validate: (result) => {
            return result.success === false &&
                   result.error.type === "INVALID_TYPE";
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 9: Configuración Parcial con Valores por Defecto (Requisito 10.1)
    // ───────────────────────────────────────────────────────────────────────
    partialWithDefaults: {
        name: "Configuración parcial (campos opcionales con valores por defecto)",
        input: `{
  "bondSystem": {
    "initialBond": 0,
    "bondMultiplier": 1.0,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 30,
    "responseProbabilities": {
      "tier0": 0.20,
      "tier1": 0.40,
      "tier2": 0.60,
      "tier3": 0.80
    }
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.05,
    "baseUltraRareDialogueProbability": 0.015,
    "specialAppearanceProbability": 0.007,
    "secretInteractionProbability": 0.01
  }
}`,
        expectedSuccess: true,
        expectedError: null,
        validate: (result) => {
            return result.success === true &&
                   result.config.chatSystem.enableNicknameSystem === true &&
                   result.config.rareEventsSystem.bonusProbabilityAfter50Hours === 0.005 &&
                   result.config.rareEventsSystem.enableEventTracking === true;
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 10: JSON Array en vez de Objeto (Requisito 10.2, 10.6)
    // ───────────────────────────────────────────────────────────────────────
    arrayInsteadOfObject: {
        name: "Array JSON en vez de objeto",
        input: `[
  {
    "bondSystem": {
      "initialBond": 0
    }
  }
]`,
        expectedSuccess: false,
        expectedError: "INVALID_STRUCTURE",
        validate: (result) => {
            return result.success === false &&
                   result.error.type === "INVALID_STRUCTURE";
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════
//  FUNCIÓN DE EJECUCIÓN DE PRUEBAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ejecuta una suite de pruebas para parseConfig
 * Esta función NO está diseñada para ejecutarse standalone.
 * Debe ser copiada a main.js y adaptada para usar el parseConfig real.
 * 
 * @param {function} parseConfigFunction - Función parseConfig a probar
 * @returns {object} Resultados de las pruebas {passed: number, failed: number, results: array}
 */
function runParseConfigTests(parseConfigFunction) {
    console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
    console.log("║         SUITE DE PRUEBAS UNITARIAS - PARSER DE CONFIGURACIÓN              ║");
    console.log("║                    Tarea 15.1 - Requisitos 10.1, 10.2, 10.5, 10.6         ║");
    console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
    console.log("");

    let passed = 0;
    let failed = 0;
    const results = [];

    for (const [testId, testCase] of Object.entries(TestCases)) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`▶ TEST: ${testCase.name}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        try {
            // Ejecutar parseConfig con el input del test
            const result = parseConfigFunction(testCase.input);

            // Validar resultado usando la función de validación del test case
            const isValid = testCase.validate(result);

            if (isValid) {
                console.log("✓ PASADO");
                passed++;
                results.push({ test: testCase.name, status: "PASS" });
            } else {
                console.log("✗ FALLIDO - La validación no pasó");
                console.log(`  Esperado success: ${testCase.expectedSuccess}`);
                console.log(`  Recibido success: ${result.success}`);
                
                if (result.error) {
                    console.log(`  Tipo de error: ${result.error.type}`);
                    console.log(`  Mensaje: ${result.error.message}`);
                }
                
                failed++;
                results.push({ test: testCase.name, status: "FAIL", reason: "Validación falló" });
            }

        } catch (error) {
            console.log("✗ FALLIDO - Excepción lanzada");
            console.log(`  Error: ${error.message}`);
            console.log(`  Stack: ${error.stack}`);
            failed++;
            results.push({ test: testCase.name, status: "FAIL", reason: `Excepción: ${error.message}` });
        }

        console.log("");
    }

    console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
    console.log("║                         RESUMEN DE PRUEBAS                                 ║");
    console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
    console.log(`  ✓ Pasadas: ${passed}/${Object.keys(TestCases).length}`);
    console.log(`  ✗ Fallidas: ${failed}/${Object.keys(TestCases).length}`);
    console.log(`  Porcentaje de éxito: ${Math.round((passed / Object.keys(TestCases).length) * 100)}%`);
    console.log("");

    if (failed === 0) {
        console.log("  🎉 ¡TODAS LAS PRUEBAS PASARON! 🎉");
        console.log("  El parser de configuración está funcionando correctamente.");
    } else {
        console.log("  ⚠️  ALGUNAS PRUEBAS FALLARON");
        console.log("  Revisar los errores arriba para diagnosticar los problemas.");
    }

    console.log("╚═══════════════════════════════════════════════════════════════════════════╝");

    return {
        passed: passed,
        failed: failed,
        total: Object.keys(TestCases).length,
        results: results
    };
}

// ═══════════════════════════════════════════════════════════════════════════
//  EXPORTACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Este archivo proporciona:
 * - TestCases: Objeto con todos los casos de prueba
 * - runParseConfigTests(parseConfigFn): Función para ejecutar la suite
 * 
 * Para integrar en main.js:
 * 1. Copiar la función runParseConfigTests al final de main.js
 * 2. Agregar comando de chat .runtests que llame a runParseConfigTests(parseConfig)
 */

console.log("[Test Suite] Suite de pruebas para parseConfig cargada.");
console.log("[Test Suite] Casos de prueba definidos: " + Object.keys(TestCases).length);
console.log("[Test Suite] Para ejecutar, usar: runParseConfigTests(parseConfig)");
