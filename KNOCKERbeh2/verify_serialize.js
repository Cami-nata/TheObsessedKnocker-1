/**
 * Verificación rápida de serializeConfig - Tarea 15.2
 * Este script verifica que la función serializeConfig cumple los requisitos:
 * - 10.3: Pretty printer que formatea objetos de configuración a JSON válido
 * - 10.7: Formateo con indentación de 2 espacios
 */

// Simular la función serializeConfig tal como está implementada en main.js
function serializeConfig(configObject) {
    // Validar que se proporcionó un objeto
    if (typeof configObject !== "object" || configObject === null) {
        throw new Error("El parámetro debe ser un objeto de configuración válido.");
    }
    
    // Validar que no es un array
    if (Array.isArray(configObject)) {
        throw new Error("El parámetro debe ser un objeto, no un array.");
    }
    
    // Serializar con indentación de 2 espacios
    // JSON.stringify con 3er parámetro = número de espacios para indentación
    return JSON.stringify(configObject, null, 2);
}

console.log("═══════════════════════════════════════════════════════════════");
console.log("  VERIFICACIÓN DE serializeConfig - TAREA 15.2");
console.log("  Requisitos: 10.3, 10.7");
console.log("═══════════════════════════════════════════════════════════════\n");

let testsPassed = 0;
let testsFailed = 0;

// TEST 1: Objeto de configuración completo
console.log("TEST 1: Objeto de configuración completo");
try {
    const config = {
        bondSystem: {
            initialBond: 0,
            bondMultiplier: 1.0,
            maxBond: 500
        },
        chatSystem: {
            cooldownSeconds: 30
        }
    };
    
    const result = serializeConfig(config);
    
    // Verificar que es un string
    if (typeof result !== "string") {
        throw new Error("El resultado debe ser un string");
    }
    
    // Verificar que es JSON válido
    const parsed = JSON.parse(result);
    if (!parsed.bondSystem || !parsed.chatSystem) {
        throw new Error("JSON no contiene las propiedades esperadas");
    }
    
    // Verificar indentación de 2 espacios
    const lines = result.split('\n');
    let hasCorrectIndentation = false;
    for (const line of lines) {
        // Buscar líneas con exactamente 2 espacios de indentación
        if (line.match(/^  "[a-zA-Z]/)) {
            hasCorrectIndentation = true;
            break;
        }
    }
    
    if (!hasCorrectIndentation) {
        throw new Error("No se detectó indentación de 2 espacios");
    }
    
    console.log("✓ PASADO - JSON válido con indentación de 2 espacios");
    console.log("Resultado:");
    console.log(result);
    testsPassed++;
} catch (e) {
    console.log("✗ FALLIDO: " + e.message);
    testsFailed++;
}

// TEST 2: Objeto vacío
console.log("\nTEST 2: Objeto vacío");
try {
    const result = serializeConfig({});
    if (result === "{}") {
        console.log("✓ PASADO - Objeto vacío serializado correctamente");
        testsPassed++;
    } else {
        throw new Error("Resultado incorrecto para objeto vacío");
    }
} catch (e) {
    console.log("✗ FALLIDO: " + e.message);
    testsFailed++;
}

// TEST 3: Input nulo (debe lanzar error)
console.log("\nTEST 3: Input nulo (debe lanzar error)");
try {
    serializeConfig(null);
    console.log("✗ FALLIDO - Debería lanzar error");
    testsFailed++;
} catch (e) {
    console.log("✓ PASADO - Error lanzado correctamente: " + e.message);
    testsPassed++;
}

// TEST 4: Input array (debe lanzar error)
console.log("\nTEST 4: Input array (debe lanzar error)");
try {
    serializeConfig([1, 2, 3]);
    console.log("✗ FALLIDO - Debería lanzar error");
    testsFailed++;
} catch (e) {
    console.log("✓ PASADO - Error lanzado correctamente: " + e.message);
    testsPassed++;
}

// TEST 5: Objeto anidado con múltiples niveles
console.log("\nTEST 5: Objeto anidado con múltiples niveles");
try {
    const config = {
        level1: {
            level2: {
                level3: {
                    value: "deep"
                }
            }
        }
    };
    
    const result = serializeConfig(config);
    const parsed = JSON.parse(result);
    
    if (parsed.level1.level2.level3.value === "deep") {
        // Verificar que cada nivel tiene la indentación correcta
        const lines = result.split('\n');
        let has2spaces = false;
        let has4spaces = false;
        let has6spaces = false;
        
        for (const line of lines) {
            if (line.match(/^  "[a-zA-Z]/)) has2spaces = true;
            if (line.match(/^    "[a-zA-Z]/)) has4spaces = true;
            if (line.match(/^      "[a-zA-Z]/)) has6spaces = true;
        }
        
        if (has2spaces && has4spaces && has6spaces) {
            console.log("✓ PASADO - Indentación correcta en múltiples niveles");
            console.log("Resultado:");
            console.log(result);
            testsPassed++;
        } else {
            throw new Error("Indentación incorrecta en niveles anidados");
        }
    } else {
        throw new Error("Valores no preservados correctamente");
    }
} catch (e) {
    console.log("✗ FALLIDO: " + e.message);
    testsFailed++;
}

// RESUMEN
console.log("\n═══════════════════════════════════════════════════════════════");
console.log("RESUMEN DE PRUEBAS");
console.log("═══════════════════════════════════════════════════════════════");
console.log(`Tests pasados: ${testsPassed}`);
console.log(`Tests fallidos: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
    console.log("\n✅ TODAS LAS PRUEBAS PASARON");
    console.log("La función serializeConfig cumple con los requisitos 10.3 y 10.7");
} else {
    console.log("\n❌ ALGUNAS PRUEBAS FALLARON");
}
