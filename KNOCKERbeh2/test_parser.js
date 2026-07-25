/**
 * Script de prueba para el Parser de Configuración
 * Tarea 15.1: Crear parser de archivos de configuración JSON
 * 
 * Este script prueba:
 * - Parseo de configuración válida
 * - Validación de sintaxis JSON
 * - Validación de tipos de datos
 * - Manejo de errores con mensajes descriptivos
 * - Aplicación de valores por defecto
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// ════════════════════════════════════════════════════════════════════════════
//  COPIAR AQUÍ EL CÓDIGO DEL PARSER DESDE main.js
// ════════════════════════════════════════════════════════════════════════════

// [El código del parser se copiaría aquí para testing standalone]
// Por ahora, este archivo es una plantilla para pruebas manuales

// ════════════════════════════════════════════════════════════════════════════
//  FUNCIONES DE PRUEBA
// ════════════════════════════════════════════════════════════════════════════

function testValidConfig() {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("TEST 1: Configuración Válida");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    try {
        const configJson = readFileSync('./config_example.json', 'utf8');
        console.log("✓ Archivo JSON leído correctamente");
        console.log("Contenido:");
        console.log(configJson);
        console.log("\nResultado esperado: Parseo exitoso con todos los valores validados");
    } catch (error) {
        console.error("✗ Error al leer archivo:", error.message);
    }
}

function testInvalidType() {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("TEST 2: Tipo de Dato Inválido");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    try {
        const configJson = readFileSync('./config_invalid_type.json', 'utf8');
        console.log("✓ Archivo JSON leído correctamente");
        console.log("Contenido (initialBond es string en vez de number):");
        console.log(configJson);
        console.log("\nResultado esperado: Error INVALID_TYPE detectado");
    } catch (error) {
        console.error("✗ Error al leer archivo:", error.message);
    }
}

function testOutOfRange() {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("TEST 3: Valor Fuera de Rango");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    try {
        const configJson = readFileSync('./config_out_of_range.json', 'utf8');
        console.log("✓ Archivo JSON leído correctamente");
        console.log("Contenido (initialBond = 600, max permitido = 500):");
        console.log(configJson);
        console.log("\nResultado esperado: Error OUT_OF_RANGE detectado");
    } catch (error) {
        console.error("✗ Error al leer archivo:", error.message);
    }
}

function testMissingRequired() {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("TEST 4: Campo Requerido Faltante");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    try {
        const configJson = readFileSync('./config_missing_required.json', 'utf8');
        console.log("✓ Archivo JSON leído correctamente");
        console.log("Contenido (falta campo 'initialBond' requerido):");
        console.log(configJson);
        console.log("\nResultado esperado: Error MISSING_FIELD detectado");
    } catch (error) {
        console.error("✗ Error al leer archivo:", error.message);
    }
}

function testInvalidJson() {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("TEST 5: Sintaxis JSON Inválida");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    const invalidJson = '{ "bondSystem": { "initialBond": 0, } }'; // Coma extra
    console.log("JSON con error de sintaxis:");
    console.log(invalidJson);
    console.log("\nResultado esperado: Error SYNTAX_ERROR detectado");
}

function testDefaultValues() {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("TEST 6: Aplicación de Valores por Defecto");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    const partialConfig = `{
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
            }
        },
        "rareEventsSystem": {
            "baseRareDialogueProbability": 0.08,
            "baseUltraRareDialogueProbability": 0.02,
            "specialAppearanceProbability": 0.01,
            "secretInteractionProbability": 0.015
        }
    }`;
    
    console.log("Configuración parcial (faltan campos opcionales):");
    console.log(partialConfig);
    console.log("\nResultado esperado: Campos opcionales faltantes rellenados con valores por defecto");
    console.log("  - chatSystem.enableNicknameSystem = true (default)");
    console.log("  - rareEventsSystem.bonusProbabilityAfter50Hours = 0.005 (default)");
    console.log("  - rareEventsSystem.bonusProbabilityTier3 = 0.01 (default)");
    console.log("  - rareEventsSystem.enableEventTracking = true (default)");
}

// ════════════════════════════════════════════════════════════════════════════
//  EJECUTAR TODAS LAS PRUEBAS
// ════════════════════════════════════════════════════════════════════════════

console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║   SUITE DE PRUEBAS - PARSER DE CONFIGURACIÓN (TAREA 15.1)     ║");
console.log("║   Requisitos: 10.1, 10.2, 10.5, 10.6                          ║");
console.log("╚════════════════════════════════════════════════════════════════╝");

// Ejecutar pruebas
testValidConfig();
testInvalidType();
testOutOfRange();
testMissingRequired();
testInvalidJson();
testDefaultValues();

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("FIN DE PRUEBAS");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

console.log("\n📝 NOTA: Para ejecutar estas pruebas con el parser real:");
console.log("1. Extraer las funciones del parser de main.js");
console.log("2. Importarlas en este archivo");
console.log("3. Ejecutar: node test_parser.js");
console.log("\nO bien, probar directamente en Minecraft cargando el addon.");
