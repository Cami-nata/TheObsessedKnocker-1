/**
 * PRUEBAS UNITARIAS PARA SERIALIZER DE CONFIGURACIÓN - TAREA 15.2
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Este archivo contiene pruebas unitarias exhaustivas para el serializeConfig()
 * implementado en main.js
 * 
 * Requisitos probados:
 * - 10.3: Pretty printer que formatea objetos de configuración a JSON válido
 * - 10.7: Formateo con indentación de 2 espacios
 * 
 * Para ejecutar estas pruebas:
 * 1. Cargar el addon en Minecraft
 * 2. Escribir en chat: .testserialize
 * 3. Revisar resultados en consola y chat
 */

// ═══════════════════════════════════════════════════════════════════════════
//  CASOS DE PRUEBA
// ═══════════════════════════════════════════════════════════════════════════

const SerializeTestCases = {
    // ───────────────────────────────────────────────────────────────────────
    // TEST 1: Configuración Completa (Requisito 10.3, 10.7)
    // ───────────────────────────────────────────────────────────────────────
    completeConfig: {
        name: "Serialización de configuración completa",
        input: {
            bondSystem: {
                initialBond: 0,
                bondMultiplier: 1.0,
                tierThresholds: {
                    stranger: 0,
                    watched: 100,
                    familiar: 250,
                    obsessed: 400
                },
                maxBond: 500
            },
            chatSystem: {
                cooldownSeconds: 30,
                responseProbabilities: {
                    tier0: 0.20,
                    tier1: 0.40,
                    tier2: 0.60,
                    tier3: 0.80
                },
                enableNicknameSystem: true
            },
            rareEventsSystem: {
                baseRareDialogueProbability: 0.05,
                baseUltraRareDialogueProbability: 0.015,
                specialAppearanceProbability: 0.007,
                secretInteractionProbability: 0.01,
                bonusProbabilityAfter50Hours: 0.005,
                bonusProbabilityTier3: 0.01,
                enableEventTracking: true
            }
        },
        shouldSucceed: true,
        validate: (result) => {
            // Debe ser un string
            if (typeof result !== "string") return false;
            
            // Debe ser JSON válido
            try {
                const parsed = JSON.parse(result);
                if (!parsed.bondSystem || !parsed.chatSystem || !parsed.rareEventsSystem) {
                    return false;
                }
            } catch (e) {
                return false;
            }
            
            // Debe tener indentación de 2 espacios
            // Verificar que las líneas tienen indentación correcta
            const lines = result.split('\n');
            let hasCorrectIndentation = false;
            for (const line of lines) {
                // Buscar líneas con indentación (que no sean { o })
                if (line.match(/^  \w/)) {
                    hasCorrectIndentation = true;
                    break;
                }
            }
            
            return hasCorrectIndentation;
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 2: Configuración Personalizada (Requisito 10.3, 10.7)
    // ───────────────────────────────────────────────────────────────────────
    customConfig: {
        name: "Serialización con valores personalizados",
        input: {
            bondSystem: {
                initialBond: 100,
                bondMultiplier: 1.5,
                tierThresholds: {
                    stranger: 0,
                    watched: 150,
                    familiar: 300,
                    obsessed: 450
                },
                maxBond: 600
            },
            chatSystem: {
                cooldownSeconds: 60,
                responseProbabilities: {
                    tier0: 0.10,
                    tier1: 0.30,
                    tier2: 0.50,
                    tier3: 0.90
                },
                enableNicknameSystem: false
            },
            rareEventsSystem: {
                baseRareDialogueProbability: 0.10,
                baseUltraRareDialogueProbability: 0.02,
                specialAppearanceProbability: 0.01,
                secretInteractionProbability: 0.015,
                bonusProbabilityAfter50Hours: 0.01,
                bonusProbabilityTier3: 0.02,
                enableEventTracking: false
            }
        },
        shouldSucceed: true,
        validate: (result) => {
            // Debe ser string JSON válido
            try {
                const parsed = JSON.parse(result);
                return parsed.bondSystem.initialBond === 100 &&
                       parsed.chatSystem.cooldownSeconds === 60 &&
                       parsed.chatSystem.enableNicknameSystem === false;
            } catch (e) {
                return false;
            }
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 3: Configuración Mínima (Requisito 10.3, 10.7)
    // ───────────────────────────────────────────────────────────────────────
    minimalConfig: {
        name: "Serialización de configuración mínima",
        input: {
            bondSystem: {
                initialBond: 0,
                bondMultiplier: 1.0,
                tierThresholds: {
                    stranger: 0,
                    watched: 100,
                    familiar: 250,
                    obsessed: 400
                },
                maxBond: 500
            },
            chatSystem: {
                cooldownSeconds: 30,
                responseProbabilities: {
                    tier0: 0.20,
                    tier1: 0.40,
                    tier2: 0.60,
                    tier3: 0.80
                }
            },
            rareEventsSystem: {
                baseRareDialogueProbability: 0.05,
                baseUltraRareDialogueProbability: 0.015,
                specialAppearanceProbability: 0.007,
                secretInteractionProbability: 0.01
            }
        },
        shouldSucceed: true,
        validate: (result) => {
            try {
                const parsed = JSON.parse(result);
                return typeof parsed === "object" && 
                       parsed.bondSystem !== undefined;
            } catch (e) {
                return false;
            }
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 4: Input Nulo (Requisito 10.3)
    // ───────────────────────────────────────────────────────────────────────
    nullInput: {
        name: "Input nulo (debe lanzar error)",
        input: null,
        shouldSucceed: false,
        validate: (result, error) => {
            return error !== null && error.message.includes("objeto de configuración válido");
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 5: Input Array (Requisito 10.3)
    // ───────────────────────────────────────────────────────────────────────
    arrayInput: {
        name: "Input array (debe lanzar error)",
        input: [{ bondSystem: { initialBond: 0 } }],
        shouldSucceed: false,
        validate: (result, error) => {
            return error !== null && error.message.includes("no un array");
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 6: Input String (Requisito 10.3)
    // ───────────────────────────────────────────────────────────────────────
    stringInput: {
        name: "Input string (debe lanzar error)",
        input: "not an object",
        shouldSucceed: false,
        validate: (result, error) => {
            return error !== null && error.message.includes("objeto de configuración válido");
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 7: Input Number (Requisito 10.3)
    // ───────────────────────────────────────────────────────────────────────
    numberInput: {
        name: "Input numérico (debe lanzar error)",
        input: 12345,
        shouldSucceed: false,
        validate: (result, error) => {
            return error !== null && error.message.includes("objeto de configuración válido");
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 8: Input Boolean (Requisito 10.3)
    // ───────────────────────────────────────────────────────────────────────
    booleanInput: {
        name: "Input booleano (debe lanzar error)",
        input: true,
        shouldSucceed: false,
        validate: (result, error) => {
            return error !== null && error.message.includes("objeto de configuración válido");
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 9: Verificación de Indentación (Requisito 10.7)
    // ───────────────────────────────────────────────────────────────────────
    indentationCheck: {
        name: "Verificación específica de indentación de 2 espacios",
        input: {
            bondSystem: {
                initialBond: 0,
                bondMultiplier: 1.0,
                tierThresholds: {
                    stranger: 0,
                    watched: 100,
                    familiar: 250,
                    obsessed: 400
                },
                maxBond: 500
            }
        },
        shouldSucceed: true,
        validate: (result) => {
            const lines = result.split('\n');
            
            // Verificar que hay líneas con exactamente 2 espacios (nivel 1)
            const level1 = lines.some(line => line.match(/^  "[^"]+"/));
            
            // Verificar que hay líneas con exactamente 4 espacios (nivel 2)
            const level2 = lines.some(line => line.match(/^    "[^"]+"/));
            
            // Verificar que hay líneas con exactamente 6 espacios (nivel 3)
            const level3 = lines.some(line => line.match(/^      "[^"]+"/));
            
            // Verificar que NO hay líneas con 3 espacios (tabs convertidos incorrectamente)
            const noOddIndent = !lines.some(line => line.match(/^   [^\s]/));
            
            return level1 && level2 && level3 && noOddIndent;
        }
    },

    // ───────────────────────────────────────────────────────────────────────
    // TEST 10: Objeto Vacío (Requisito 10.3, 10.7)
    // ───────────────────────────────────────────────────────────────────────
    emptyObject: {
        name: "Serialización de objeto vacío",
        input: {},
        shouldSucceed: true,
        validate: (result) => {
            try {
                const parsed = JSON.parse(result);
                return result === "{}";
            } catch (e) {
                return false;
            }
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════
//  FUNCIÓN DE EJECUCIÓN DE PRUEBAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ejecuta una suite de pruebas para serializeConfig
 * 
 * @param {function} serializeConfigFunction - Función serializeConfig a probar
 * @returns {object} Resultados de las pruebas {passed: number, failed: number, results: array}
 */
function runSerializeConfigTests(serializeConfigFunction) {
    console.log("╔═══════════════════════════════════════════════════════════════════════════╗");
    console.log("║      SUITE DE PRUEBAS UNITARIAS - SERIALIZER DE CONFIGURACIÓN             ║");
    console.log("║                    Tarea 15.2 - Requisitos 10.3, 10.7                     ║");
    console.log("╚═══════════════════════════════════════════════════════════════════════════╝");
    console.log("");

    let passed = 0;
    let failed = 0;
    const results = [];

    for (const [testId, testCase] of Object.entries(SerializeTestCases)) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`▶ TEST: ${testCase.name}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        try {
            let result;
            let error = null;
            
            // Ejecutar serializeConfig con el input del test
            try {
                result = serializeConfigFunction(testCase.input);
            } catch (e) {
                error = e;
            }

            // Validar resultado
            const isValid = testCase.validate(result, error);

            if (testCase.shouldSucceed && isValid && error === null) {
                console.log("✓ PASADO");
                passed++;
                results.push({ test: testCase.name, status: "PASS" });
            } else if (!testCase.shouldSucceed && error !== null && isValid) {
                console.log("✓ PASADO (error esperado capturado correctamente)");
                console.log(`  Error: ${error.message}`);
                passed++;
                results.push({ test: testCase.name, status: "PASS" });
            } else {
                console.log("✗ FALLIDO");
                
                if (testCase.shouldSucceed) {
                    console.log(`  Esperado: éxito`);
                    console.log(`  Recibido: ${error ? "error" : "éxito con validación fallida"}`);
                    if (error) {
                        console.log(`  Error: ${error.message}`);
                    }
                    if (result) {
                        console.log(`  Resultado (primeras 200 chars): ${result.substring(0, 200)}`);
                    }
                } else {
                    console.log(`  Esperado: error`);
                    console.log(`  Recibido: ${error ? "error" : "éxito inesperado"}`);
                }
                
                failed++;
                results.push({ test: testCase.name, status: "FAIL", reason: "Validación falló" });
            }

        } catch (error) {
            console.log("✗ FALLIDO - Excepción inesperada");
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
    console.log(`  ✓ Pasadas: ${passed}/${Object.keys(SerializeTestCases).length}`);
    console.log(`  ✗ Fallidas: ${failed}/${Object.keys(SerializeTestCases).length}`);
    console.log(`  Porcentaje de éxito: ${Math.round((passed / Object.keys(SerializeTestCases).length) * 100)}%`);
    console.log("");

    if (failed === 0) {
        console.log("  🎉 ¡TODAS LAS PRUEBAS PASARON! 🎉");
        console.log("  El serializer de configuración está funcionando correctamente.");
    } else {
        console.log("  ⚠️  ALGUNAS PRUEBAS FALLARON");
        console.log("  Revisar los errores arriba para diagnosticar los problemas.");
    }

    console.log("╚═══════════════════════════════════════════════════════════════════════════╝");

    return {
        passed: passed,
        failed: failed,
        total: Object.keys(SerializeTestCases).length,
        results: results
    };
}

// ═══════════════════════════════════════════════════════════════════════════
//  EXPORTACIÓN Y NOTAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Este archivo proporciona:
 * - SerializeTestCases: Objeto con todos los casos de prueba
 * - runSerializeConfigTests(serializeConfigFn): Función para ejecutar la suite
 * 
 * Para integrar en main.js:
 * 1. Copiar la función runSerializeConfigTests al final de main.js
 * 2. Agregar comando de chat .testserialize que llame a runSerializeConfigTests(serializeConfig)
 */

console.log("[Test Suite] Suite de pruebas para serializeConfig cargada.");
console.log("[Test Suite] Casos de prueba definidos: " + Object.keys(SerializeTestCases).length);
console.log("[Test Suite] Para ejecutar, usar: runSerializeConfigTests(serializeConfig)");
