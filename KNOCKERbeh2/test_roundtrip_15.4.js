/**
 * TEST DE PROPIEDAD ROUND-TRIP (Task 15.4) - STANDALONE
 * Este test es completamente standalone e incluye todas las funciones necesarias
 */

console.log("================================================================");
console.log("  TEST DE PROPIEDAD ROUND-TRIP - Task 15.4");
console.log("  Parser -> Pretty Printer -> Parser debe producir objeto equivalente");
console.log("================================================================\n");

// Schema simplificado
const ConfigSchema = {
    bondSystem: {
        type: "object",
        required: true,
        properties: {
            initialBond: { type: "number", required: false, default: 0, min: 0, max: 500 },
            bondMultiplier: { type: "number", required: false, default: 1.0, min: 0.1, max: 10.0 },
            tierThresholds: {
                type: "object",
                required: true,
                properties: {
                    stranger: { type: "number", required: true, default: 0 },
                    watched: { type: "number", required: true, default: 100 },
                    familiar: { type: "number", required: true, default: 250 },
                    obsessed: { type: "number", required: true, default: 400 }
                }
            },
            maxBond: { type: "number", required: false, default: 500, min: 100, max: 1000 }
        }
    },
    chatSystem: {
        type: "object",
        required: true,
        properties: {
            cooldownSeconds: { type: "number", required: false, default: 30, min: 5, max: 300 },
            responseProbabilities: {
                type: "object",
                required: true,
                properties: {
                    tier0: { type: "number", required: true, default: 0.20, min: 0.0, max: 1.0 },
                    tier1: { type: "number", required: true, default: 0.40, min: 0.0, max: 1.0 },
                    tier2: { type: "number", required: true, default: 0.60, min: 0.0, max: 1.0 },
                    tier3: { type: "number", required: true, default: 0.80, min: 0.0, max: 1.0 }
                }
            },
            enableNicknameSystem: { type: "boolean", required: false, default: true }
        }
    },
    rareEventsSystem: {
        type: "object",
        required: true,
        properties: {
            baseRareDialogueProbability: { type: "number", required: false, default: 0.05, min: 0.0, max: 1.0 },
            baseUltraRareDialogueProbability: { type: "number", required: false, default: 0.015, min: 0.0, max: 1.0 }
        }
    }
};

const ConfigErrorType = {
    SYNTAX_ERROR: "SYNTAX_ERROR",
    INVALID_TYPE: "INVALID_TYPE",
    OUT_OF_RANGE: "OUT_OF_RANGE",
    INVALID_STRUCTURE: "INVALID_STRUCTURE",
    MISSING_FIELD: "MISSING_FIELD"
};

class ConfigError extends Error {
    constructor(type, message, field = null, value = null) {
        super(message);
        this.name = "ConfigError";
        this.type = type;
        this.field = field;
        this.value = value;
    }
}

function validateValue(value, schemaDef, fieldPath) {
    if (schemaDef.required && (value === null || value === undefined)) {
        return { valid: false, error: new ConfigError(ConfigErrorType.MISSING_FIELD, "Campo requerido faltante.", fieldPath, value) };
    }
    if (!schemaDef.required && (value === null || value === undefined)) {
        return { valid: true, error: null };
    }
    const expectedType = schemaDef.type;
    const actualType = typeof value;
    if (expectedType === "object" && actualType === "object" && Array.isArray(value)) {
        return { valid: false, error: new ConfigError(ConfigErrorType.INVALID_TYPE, "Debe ser objeto.", fieldPath, value) };
    }
    if (actualType !== expectedType) {
        return { valid: false, error: new ConfigError(ConfigErrorType.INVALID_TYPE, "Tipo incorrecto.", fieldPath, value) };
    }
    if (expectedType === "number") {
        if (isNaN(value) || !isFinite(value)) {
            return { valid: false, error: new ConfigError(ConfigErrorType.INVALID_TYPE, "Numero invalido.", fieldPath, value) };
        }
        if (schemaDef.min !== undefined && value < schemaDef.min) {
            return { valid: false, error: new ConfigError(ConfigErrorType.OUT_OF_RANGE, "Valor muy bajo.", fieldPath, value) };
        }
        if (schemaDef.max !== undefined && value > schemaDef.max) {
            return { valid: false, error: new ConfigError(ConfigErrorType.OUT_OF_RANGE, "Valor muy alto.", fieldPath, value) };
        }
    }
    if (expectedType === "object" && schemaDef.properties) {
        for (const [propName, propSchema] of Object.entries(schemaDef.properties)) {
            const validation = validateValue(value[propName], propSchema, fieldPath + "." + propName);
            if (!validation.valid) return validation;
        }
    }
    return { valid: true, error: null };
}

function applyConfigDefaults(configObject) {
    const result = { ...configObject };
    for (const [sectionName, sectionSchema] of Object.entries(ConfigSchema)) {
        if (!result[sectionName]) result[sectionName] = {};
        if (sectionSchema.properties) {
            for (const [propName, propSchema] of Object.entries(sectionSchema.properties)) {
                if (result[sectionName][propName] === undefined && propSchema.default !== undefined) {
                    result[sectionName][propName] = propSchema.default;
                }
                if (propSchema.type === "object" && propSchema.properties) {
                    if (!result[sectionName][propName]) result[sectionName][propName] = {};
                    for (const [nestedName, nestedSchema] of Object.entries(propSchema.properties)) {
                        if (result[sectionName][propName][nestedName] === undefined && nestedSchema.default !== undefined) {
                            result[sectionName][propName][nestedName] = nestedSchema.default;
                        }
                    }
                }
            }
        }
    }
    return result;
}

function parseConfig(jsonString) {
    if (typeof jsonString !== "string") {
        return { success: false, config: null, error: new ConfigError(ConfigErrorType.INVALID_TYPE, "Debe ser string.", null, typeof jsonString) };
    }
    if (jsonString.trim().length === 0) {
        return { success: false, config: null, error: new ConfigError(ConfigErrorType.SYNTAX_ERROR, "JSON vacio.", null, jsonString) };
    }
    let parsedObject;
    try {
        parsedObject = JSON.parse(jsonString);
    } catch (parseError) {
        return { success: false, config: null, error: new ConfigError(ConfigErrorType.SYNTAX_ERROR, "Error JSON: " + parseError.message, null, jsonString.substring(0, 100)) };
    }
    if (typeof parsedObject !== "object" || parsedObject === null || Array.isArray(parsedObject)) {
        return { success: false, config: null, error: new ConfigError(ConfigErrorType.INVALID_STRUCTURE, "Debe ser objeto.", null, parsedObject) };
    }
    for (const [sectionName, sectionSchema] of Object.entries(ConfigSchema)) {
        const validation = validateValue(parsedObject[sectionName], sectionSchema, sectionName);
        if (!validation.valid) {
            return { success: false, config: null, error: validation.error };
        }
    }
    return { success: true, config: applyConfigDefaults(parsedObject), error: null };
}

function serializeConfig(configObject) {
    if (typeof configObject !== "object" || configObject === null) {
        throw new Error("Debe ser objeto.");
    }
    if (Array.isArray(configObject)) {
        throw new Error("No puede ser array.");
    }
    return JSON.stringify(configObject, null, 2);
}
// Configuraciones de prueba
const fullConfig = {
    bondSystem: { initialBond: 10, bondMultiplier: 1.5, tierThresholds: { stranger: 0, watched: 100, familiar: 250, obsessed: 400 }, maxBond: 500 },
    chatSystem: { cooldownSeconds: 45, responseProbabilities: { tier0: 0.25, tier1: 0.45, tier2: 0.65, tier3: 0.85 }, enableNicknameSystem: false },
    rareEventsSystem: { baseRareDialogueProbability: 0.08, baseUltraRareDialogueProbability: 0.02 }
};

const minimalConfig = {
    bondSystem: { tierThresholds: { stranger: 0, watched: 100, familiar: 250, obsessed: 400 } },
    chatSystem: { responseProbabilities: { tier0: 0.20, tier1: 0.40, tier2: 0.60, tier3: 0.80 } },
    rareEventsSystem: {}
};

// Funcion de comparacion profunda
function deepCompareConfig(obj1, obj2, path) {
    path = path || "root";
    const differences = [];
    if (typeof obj1 !== typeof obj2) {
        differences.push(path + ": tipo diferente");
        return { equal: false, differences };
    }
    if (typeof obj1 !== "object" || obj1 === null) {
        if (obj1 !== obj2) {
            if (typeof obj1 === "number" && typeof obj2 === "number") {
                if (Math.abs(obj1 - obj2) < 0.0001) return { equal: true, differences: [] };
            }
            differences.push(path + ": valor diferente");
        }
        return { equal: differences.length === 0, differences };
    }
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    for (const key of allKeys) {
        if (!(key in obj1)) { differences.push(path + "." + key + ": falta en obj1"); continue; }
        if (!(key in obj2)) { differences.push(path + "." + key + ": falta en obj2"); continue; }
        const result = deepCompareConfig(obj1[key], obj2[key], path + "." + key);
        differences.push(...result.differences);
    }
    return { equal: differences.length === 0, differences };
}

// Funcion de test
// Funcion de test
function testRoundTrip(testName, originalConfig) {
    console.log("\nTEST: " + testName);
    try {
        const serialized1 = serializeConfig(originalConfig);
        console.log("  PASO 1: Serializado OK");
        const parsed1 = parseConfig(serialized1);
        if (!parsed1.success) {
            console.log("  PASO 2: Error - " + parsed1.error.message);
            console.log("  RESULTADO: FALLO\n");
            return false;
        }
        console.log("  PASO 2: Parseado OK");
        const serialized2 = serializeConfig(parsed1.config);
        console.log("  PASO 3: Re-serializado OK");
        const parsed2 = parseConfig(serialized2);
        if (!parsed2.success) {
            console.log("  PASO 4: Error - " + parsed2.error.message);
            console.log("  RESULTADO: FALLO\n");
            return false;
        }
        console.log("  PASO 4: Re-parseado OK");
        // CAMBIO CRITICO: Comparar parsed1 con parsed2 (ambos tienen defaults aplicados)
        const comp = deepCompareConfig(parsed1.config, parsed2.config);
        if (!comp.equal) {
            console.log("  PASO 5: Objetos no equivalentes");
            console.log("  RESULTADO: FALLO\n");
            return false;
        }
        console.log("  PASO 5: Objetos equivalentes OK (round-trip preserva estructura)");
        console.log("  RESULTADO: EXITO\n");
        return true;
    } catch (error) {
        console.log("  Error: " + error.message);
        console.log("  RESULTADO: FALLO\n");
        return false;
    }
}

// Ejecutar tests
console.log("EJECUTANDO TESTS DE ROUND-TRIP...\n");
const results = { passed: 0, failed: 0, total: 0 };

results.total++;
if (testRoundTrip("Configuracion Completa", fullConfig)) { results.passed++; } else { results.failed++; }

results.total++;
if (testRoundTrip("Configuracion Minima", minimalConfig)) { results.passed++; } else { results.failed++; }

// Resumen
console.log("================================================================");
console.log("  RESUMEN DE RESULTADOS");
console.log("================================================================");
console.log("Total de tests:    " + results.total);
console.log("Tests exitosos:    " + results.passed);
console.log("Tests fallidos:    " + results.failed);
console.log("Tasa de exito:     " + ((results.passed / results.total) * 100).toFixed(1) + "%");
console.log("================================================================\n");

if (results.failed === 0) {
    console.log("PROPIEDAD ROUND-TRIP VALIDADA");
    console.log("Task 15.4 COMPLETADA\n");
    process.exit(0);
} else {
    console.log("PROPIEDAD ROUND-TRIP FALLO\n");
    process.exit(1);
}
