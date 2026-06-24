// Test simple para verificar el sistema de detección de intenciones
// Este archivo es solo para pruebas, no es parte del addon

/**
 * Normaliza texto para búsqueda: minúsculas y elimina acentos
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/**
 * Detecta la intención del mensaje del jugador usando patrones RegEx
 */
function detectIntent(message) {
    const normalized = normalizeText(message);
    
    // SALUDOS
    if (/^(hola|hey|hi|holi|ey|buenas|saludos|que onda|que pasa|que tal|que hay)(\W|$)/i.test(normalized)) return "saludo";
    if (/(buenos dias|buenas tardes|buenas noches)/i.test(normalized)) return "saludo";
    if (/^(ey|oye|oiga|disculpa|perdon)/i.test(normalized)) return "saludo";
    
    // PREGUNTAS SOBRE IDENTIDAD
    if (/(quien|que|quie) (eres|es|sois)(\W|$)/i.test(normalized)) return "pregunta_identidad";
    if (/(como te llamas|cual es tu nombre|tienes nombre)/i.test(normalized)) return "pregunta_identidad";
    if (/(que cosa eres|que tipo de|de que estas hecho)/i.test(normalized)) return "pregunta_identidad";
    if (/(eres (real|humano|una persona|un fantasma|un monstruo|un demonio))/i.test(normalized)) return "pregunta_identidad";
    if (/(que es lo que eres|de donde vienes|de donde sales)/i.test(normalized)) return "pregunta_identidad";
    if (/(eres verdadero|existes de verdad|eres de verdad)/i.test(normalized)) return "pregunta_identidad";
    
    // PREGUNTAS SOBRE OBSERVACIÓN/ACECHO
    if (/(me (estas viendo|estas mirando|estas observando|ves|miras|observas))/i.test(normalized)) return "pregunta_observacion";
    if (/(me (sigues|persigues|acechas|vigilas|espias))/i.test(normalized)) return "pregunta_observacion";
    if (/(estas (vigilando|observando|mirando|espiando))/i.test(normalized)) return "pregunta_observacion";
    if (/(cuanto tiempo (llevas|has estado) (mirando|observando|vigilando|siguiendo))/i.test(normalized)) return "pregunta_observacion";
    
    // COMANDOS - IRSE/ALEJARSE
    if (/(vete|largate|alejate|pierdete|fuera|sal de aqui)/i.test(normalized)) return "comando_irse";
    if (/(dejame (solo|en paz|tranquilo)|deja de (seguirme|mirarme|observarme|acecharme))/i.test(normalized)) return "comando_irse";
    if (/(no te quiero|no me gustas|te odio|eres molesto)/i.test(normalized)) return "comando_irse";
    if (/(por favor (vete|largate|alejate|deja))/i.test(normalized)) return "comando_irse";
    if (/^(vete ya|largate ya|fuera de aqui)/i.test(normalized)) return "comando_irse";
    
    // COMANDOS - ACERCARSE
    if (/(ven (aqui|aca|conmigo)|acercate|ven mas cerca)/i.test(normalized)) return "comando_acercarse";
    if (/(quiero verte|dejame verte|muestrate|aparece)/i.test(normalized)) return "comando_acercarse";
    
    // COMANDOS - QUEDARSE
    if (/(quedate|no te vayas|permanece|quiero que te quedes)/i.test(normalized)) return "comando_quedarse";
    if (/(no me (dejes|abandones)|estate conmigo)/i.test(normalized)) return "comando_quedarse";
    
    // COMANDOS - AYUDA
    if (/(ayuda|ayudame|socorro|auxilio|necesito ayuda)/i.test(normalized)) return "comando_ayuda";
    if (/(ven a ayudarme|puedes ayudarme)/i.test(normalized)) return "comando_ayuda";
    
    // COMANDOS - BUSCAR/ENCONTRAR
    if (/(donde estas|en donde estas|te puedo encontrar|como te encuentro)/i.test(normalized)) return "comando_buscar";
    if (/(quiero (verte|encontrarte))/i.test(normalized)) return "comando_buscar";
    
    // EMOCIONES - AMOR/AFECTO
    if (/(te (amo|quiero|adoro|aprecio)|me gustas)/i.test(normalized)) return "emocion_amor";
    if (/(eres (especial|importante|todo para mi))/i.test(normalized)) return "emocion_amor";
    if (/(mi (amor|corazon|vida|todo))/i.test(normalized)) return "emocion_amor";
    
    // EMOCIONES - MIEDO
    if (/(no tengo miedo|no me asustas|no me das miedo)/i.test(normalized)) return "emocion_sin_miedo";
    if (/(tengo miedo|me asustas|me das miedo|eres aterrador)/i.test(normalized)) return "emocion_miedo";
    if (/(eres (escalofriante|terrorif|espeluzn|horrible))/i.test(normalized)) return "emocion_miedo";
    
    // EMOCIONES - TRISTEZA/DISCULPA
    if (/(lo siento|perdon|disculpa|perdona|disculpame)/i.test(normalized)) return "emocion_disculpa";
    if (/(estoy (triste|deprimido|mal|solo))/i.test(normalized)) return "emocion_tristeza";
    
    // EMOCIONES - CURIOSIDAD/INTERÉS
    if (/(me extranas|te extrano|extranaste)/i.test(normalized)) return "emocion_extranar";
    if (/(he estado pensando en ti|pienso en ti)/i.test(normalized)) return "emocion_pensar";
    if (/(te escucho|te oigo|puedo (escucharte|oirte))/i.test(normalized)) return "emocion_escuchar";
    if (/(te (veo|vi)|puedo verte)/i.test(normalized)) return "emocion_ver";
    
    // PREGUNTAS - MOTIVACIÓN
    if (/(por que (yo|a mi)|me (elegiste|escogiste|seleccionaste))/i.test(normalized)) return "pregunta_por_que_yo";
    if (/(que quieres|que es lo que quieres)/i.test(normalized)) return "pregunta_que_quieres";
    if (/(por que (haces esto|me sigues|me observas|estas aqui))/i.test(normalized)) return "pregunta_motivacion";
    
    // PREGUNTAS - COMPORTAMIENTO
    if (/(duermes|necesitas dormir|alguna vez duermes)/i.test(normalized)) return "pregunta_dormir";
    if (/(donde (vas|estas) (durante el dia|de dia|en el dia))/i.test(normalized)) return "pregunta_donde_dia";
    if (/(has hecho esto antes|hiciste esto antes|habia alguien antes)/i.test(normalized)) return "pregunta_hecho_antes";
    if (/(eras humano|fuiste humano|eras una persona|alguna vez fuiste)/i.test(normalized)) return "pregunta_era_humano";
    if (/(que te (hicieron|paso|sucedio|ocurrio))/i.test(normalized)) return "pregunta_que_paso";
    
    // ACCIONES - DETECTADAS
    if (/(te (atrape|capture|encontre|descubri))/i.test(normalized)) return "accion_atrapar";
    if (/(te (pille|cache|vi))/i.test(normalized)) return "accion_atrapar";
    
    // DESPEDIDAS
    if (/^(adios|chao|bye|nos vemos|hasta luego|me voy)(\W|$)/i.test(normalized)) return "despedida";
    if (/(hasta (luego|pronto|manana|la proxima|la vista))/i.test(normalized)) return "despedida";
    
    // AFIRMACIONES/RECONOCIMIENTOS
    if (/^(si|ok|vale|esta bien|de acuerdo|entiendo|comprendo|ya veo)(\W|$)/i.test(normalized)) return "afirmacion";
    if (/(lo se|ya lo se|lo sabia)/i.test(normalized)) return "afirmacion_conocimiento";
    
    // INSULTOS/NEGATIVIDAD
    if (/(eres (patetico|ridiculo|estupido|idiota|tonto|raro|extrano|enfermo))/i.test(normalized)) return "insulto";
    if (/(no eres (real|verdadero))/i.test(normalized)) return "negacion_real";
    
    // POSESIÓN/PERTENENCIA
    if (/(no soy tuyo|no te pertenezco|no me posees)/i.test(normalized)) return "rechazo_posesion";
    if (/(soy tuyo|te pertenezco|eres mio)/i.test(normalized)) return "aceptacion_posesion";
    
    // SILENCIO/VACÍO
    if (/^(\.\.\.|…|—|-)$/i.test(normalized)) return "silencio";
    if (/^(nada|nada de nada)$/i.test(normalized)) return "silencio";
    
    // VERDAD/CONFESIÓN
    if (/(dime (la verdad|algo|mas))/i.test(normalized)) return "pedir_verdad";
    if (/(cuentame|explicame|habla)/i.test(normalized)) return "pedir_contar";
    
    return "desconocido";
}

// ═══════════════════════════════════════════════════════════════════
// PRUEBAS
// ═══════════════════════════════════════════════════════════════════

const testCases = [
    // Saludos
    { mensaje: "Hola", esperado: "saludo" },
    { mensaje: "Buenos días", esperado: "saludo" },
    { mensaje: "Qué tal?", esperado: "saludo" },
    
    // Identidad
    { mensaje: "¿Quién eres?", esperado: "pregunta_identidad" },
    { mensaje: "¿Cómo te llamas?", esperado: "pregunta_identidad" },
    { mensaje: "¿Eres real?", esperado: "pregunta_identidad" },
    
    // Observación
    { mensaje: "¿Me estás viendo?", esperado: "pregunta_observacion" },
    { mensaje: "¿Me sigues?", esperado: "pregunta_observacion" },
    { mensaje: "¿Cuánto tiempo llevas observando?", esperado: "pregunta_observacion" },
    
    // Comandos
    { mensaje: "Vete", esperado: "comando_irse" },
    { mensaje: "Ven aquí", esperado: "comando_acercarse" },
    { mensaje: "Quédate", esperado: "comando_quedarse" },
    { mensaje: "Ayuda!", esperado: "comando_ayuda" },
    { mensaje: "¿Dónde estás?", esperado: "comando_buscar" },
    
    // Emociones
    { mensaje: "Te amo", esperado: "emocion_amor" },
    { mensaje: "Me asustas", esperado: "emocion_miedo" },
    { mensaje: "No tengo miedo", esperado: "emocion_sin_miedo" },
    { mensaje: "Lo siento", esperado: "emocion_disculpa" },
    { mensaje: "Te extraño", esperado: "emocion_extranar" },
    
    // Preguntas motivación
    { mensaje: "¿Por qué yo?", esperado: "pregunta_por_que_yo" },
    { mensaje: "¿Qué quieres?", esperado: "pregunta_que_quieres" },
    
    // Preguntas comportamiento
    { mensaje: "¿Duermes?", esperado: "pregunta_dormir" },
    { mensaje: "¿Eras humano?", esperado: "pregunta_era_humano" },
    
    // Otros
    { mensaje: "Adiós", esperado: "despedida" },
    { mensaje: "...", esperado: "silencio" },
    { mensaje: "Soy tuyo", esperado: "aceptacion_posesion" },
    { mensaje: "No soy tuyo", esperado: "rechazo_posesion" },
    
    // Tolerancia a acentos
    { mensaje: "quien eres", esperado: "pregunta_identidad" },
    { mensaje: "ADIOS", esperado: "despedida" },
    { mensaje: "TE AMO", esperado: "emocion_amor" },
];

console.log("═══════════════════════════════════════════════════════════════════");
console.log("  PRUEBAS DEL SISTEMA DE DETECCIÓN DE INTENCIONES");
console.log("═══════════════════════════════════════════════════════════════════\n");

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
    const result = detectIntent(testCase.mensaje);
    const success = result === testCase.esperado;
    
    if (success) {
        passed++;
        console.log(`✓ "${testCase.mensaje}" → ${result}`);
    } else {
        failed++;
        console.log(`✗ "${testCase.mensaje}" → ${result} (esperado: ${testCase.esperado})`);
    }
}

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log(`  RESULTADOS: ${passed} pasadas, ${failed} fallidas`);
console.log("═══════════════════════════════════════════════════════════════════");
