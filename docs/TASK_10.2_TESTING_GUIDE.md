# Guía de Pruebas - Tarea 10.2: Detección de Ubicaciones Estratégicas

## Objetivo de las Pruebas
Verificar que el sistema de detección de ubicaciones estratégicas funciona correctamente y que el Knocker se posiciona en lugares apropiados según el contexto.

## Requisitos Previos
- Minecraft Bedrock Edition 1.21.50+
- Addon "The Obsessed Knocker" instalado
- Mundo de prueba en modo creativo (recomendado)
- Comandos habilitados

## Escenarios de Prueba

### Escenario 1: Ventanas
**Objetivo**: Verificar que el Knocker prioriza aparecer cerca de ventanas

**Preparación**:
1. Construir una casa simple con paredes y al menos 2-3 ventanas de vidrio
2. Entrar a la casa
3. Usar la Vara Whisper o comando `.findMe`

**Resultado Esperado**:
- El Knocker debe aparecer cerca de una ventana (dentro o fuera)
- Preferiblemente con línea de vista hacia el jugador a través del vidrio

**Indicadores de Éxito**:
- ✅ Aparece dentro de 2-3 bloques de una ventana
- ✅ No aparece en rincones sin ventanas
- ✅ Tiene línea de vista al jugador

---

### Escenario 2: Puertas
**Objetivo**: Verificar detección de puertas como ubicaciones estratégicas

**Preparación**:
1. Construir una estructura con una puerta de entrada
2. Posicionarse dentro de la estructura
3. Invocar al Knocker

**Resultado Esperado**:
- El Knocker aparece cerca de la puerta (idealmente justo afuera o al lado)
- Posición que permite observar desde la entrada

**Indicadores de Éxito**:
- ✅ Aparece dentro de 2 bloques de la puerta
- ✅ Posición lógica (no dentro de la puerta misma)

---

### Escenario 3: Esquinas
**Objetivo**: Verificar que el Knocker detecta y usa esquinas

**Preparación**:
1. Construir una habitación con esquinas claras (paredes en L)
2. Posicionarse en el centro de la habitación
3. Invocar al Knocker múltiples veces (3-5 intentos)

**Resultado Esperado**:
- En al menos 60% de las invocaciones, el Knocker aparece en o cerca de una esquina
- Debe haber al menos 2 bloques sólidos perpendiculares formando esquina

**Indicadores de Éxito**:
- ✅ Mayoría de apariciones en esquinas
- ✅ Posición da sensación de "asomarse" desde esquina

---

### Escenario 4: Sombras (Interior)
**Objetivo**: Verificar detección de áreas sombreadas

**Preparación**:
1. Construir una estructura con techo sólido
2. Entrar a la estructura
3. Invocar al Knocker

**Resultado Esperado**:
- El Knocker prioriza aparecer dentro de la estructura (bajo techo)
- Evita aparecer en áreas abiertas sin techo si hay opción

**Indicadores de Éxito**:
- ✅ Aparece bajo techo cuando está disponible
- ✅ Tiene bloques sólidos arriba (1-5 bloques de altura)

---

### Escenario 5: Elevación (Colinas)
**Objetivo**: Verificar que posiciones elevadas tienen prioridad

**Preparación**:
1. Encontrar o construir una colina o montículo (+3 bloques mínimo)
2. Posicionarse en terreno bajo
3. Invocar al Knocker

**Resultado Esperado**:
- El Knocker aparece en posición elevada si está disponible
- Preferencia por altura sobre terreno plano

**Indicadores de Éxito**:
- ✅ Aparece al menos 3 bloques más alto que el jugador
- ✅ Tiene línea de vista desde elevación

---

### Escenario 6: Combinación Ventana + Esquina (Premium)
**Objetivo**: Verificar la máxima prioridad para combinaciones estratégicas

**Preparación**:
1. Construir una habitación con ventanas en las esquinas
2. Posicionarse dentro
3. Invocar al Knocker múltiples veces

**Resultado Esperado**:
- En la mayoría de casos (70%+), aparece en esquina con ventana
- Esta debería ser la posición más preferida

**Indicadores de Éxito**:
- ✅ Consistentemente aparece en esquina con ventana
- ✅ Raramente elige posiciones sin estas características

---

### Escenario 7: Interior + Ventana (Observando desde Dentro)
**Objetivo**: Verificar la combinación de máxima prioridad

**Preparación**:
1. Estar afuera de una casa con ventanas
2. La casa debe tener interior definido (paredes + techo)
3. Invocar al Knocker

**Resultado Esperado**:
- El Knocker aparece DENTRO de la casa, observando hacia afuera por la ventana
- Esta es la ubicación más estratégica y inquietante

**Indicadores de Éxito**:
- ✅ Aparece dentro de la estructura
- ✅ Cerca de ventana (2 bloques)
- ✅ Con línea de vista al jugador exterior

---

### Escenario 8: Campo Abierto (Sin Estructuras)
**Objetivo**: Verificar comportamiento cuando no hay ubicaciones estratégicas

**Preparación**:
1. Ir a un campo abierto sin construcciones
2. Invocar al Knocker

**Resultado Esperado**:
- El Knocker aún aparece en posición válida
- Prioriza estar detrás del jugador
- Usa pequeñas elevaciones naturales si están disponibles

**Indicadores de Éxito**:
- ✅ No falla al encontrar posición
- ✅ Posición coherente con terreno natural
- ✅ Respeta distancia de observación (16-48 bloques)

---

## Pruebas de Variedad

### Prueba de No-Repetición
**Objetivo**: Verificar que no siempre elige la misma posición

**Procedimiento**:
1. Construir ambiente con múltiples ubicaciones estratégicas
2. Invocar al Knocker 10 veces consecutivas
3. Anotar posición cada vez

**Resultado Esperado**:
- Al menos 5-6 posiciones diferentes
- Variedad en las ubicaciones elegidas
- No siempre la misma esquina/ventana

---

## Pruebas de Integración

### Integración con Sistema de Tier
**Preparación**:
1. Usar comando para ajustar tier: `.bond set [valor]`
   - Tier 0: 0-99
   - Tier 1: 100-249
   - Tier 2: 250-399
   - Tier 3: 400-500

2. Construir estructura con ubicaciones estratégicas
3. Invocar Knocker en cada tier

**Resultado Esperado**:
- El sistema de ubicaciones estratégicas funciona igual en todos los tiers
- La distancia varía según tier (implementado en tarea 10.1)
- Las ubicaciones estratégicas se mantienen consistentes

---

## Debugging y Logs

### Verificar Detecciones en Consola
Si tienes acceso a la consola de desarrollo:

1. Buscar líneas como:
   ```
   "Cerca de ventana"
   "Posición en esquina"
   "Área sombreada"
   "★ Esquina con ventana"
   ```

2. Estas indican que las detecciones están funcionando

### Problemas Comunes

#### El Knocker no aparece en ubicaciones estratégicas
**Posibles causas**:
- Estructuras muy pequeñas (menos de 3x3 bloques)
- Radio de búsqueda limitado (solo 2 bloques de ventanas/puertas)
- No hay línea de vista disponible

**Solución**:
- Construir estructuras más grandes
- Asegurar que hay espacio suficiente
- Verificar que no hay bloques obstruyendo línea de vista

#### Aparece siempre en la misma ubicación
**Causa**: Factor aleatorio puede no estar agregando suficiente variedad
**Es normal si**: La estructura solo tiene una ubicación óptima clara

---

## Criterios de Aceptación

La implementación es exitosa si:

✅ **Ventanas**: Aparece cerca de ventanas al menos 70% del tiempo cuando están disponibles

✅ **Puertas**: Detecta y usa puertas como puntos estratégicos

✅ **Esquinas**: Prioriza esquinas sobre posiciones en medio de paredes

✅ **Sombras**: Prefiere áreas cubiertas sobre espacios abiertos cuando disponible

✅ **Elevación**: Usa colinas y posiciones elevadas cuando existen

✅ **Combinaciones**: Prioriza correctamente las combinaciones premium (ventana+esquina, interior+ventana)

✅ **Variedad**: No siempre elige la misma posición exacta

✅ **Fallback**: Funciona correctamente en campos abiertos sin ubicaciones estratégicas

---

## Notas Finales

- Las pruebas son **cualitativas** - se basan en observación del comportamiento
- La aleatoriedad es intencional para variedad
- No todas las invocaciones serán "perfectas", pero la mayoría deben mostrar el comportamiento esperado
- El sistema prioriza pero no garantiza ubicaciones específicas (por diseño)

## Reportar Problemas

Si encuentras comportamiento inesperado, anota:
1. Escenario exacto de prueba
2. Estructura construida (captura de pantalla)
3. Tier del vínculo actual
4. Posición donde apareció vs donde se esperaba
5. Frecuencia del problema (1/10, 5/10, etc.)

---

**Estado del Documento**: ✅ Completo  
**Última Actualización**: 2024  
**Versión**: 1.0
