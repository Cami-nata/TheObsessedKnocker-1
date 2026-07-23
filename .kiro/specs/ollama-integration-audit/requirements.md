IMPORTANTE

Esta spec fue creada antes de finalizar el desarrollo principal del addon.

Antes de ejecutar cualquier tarea de esta spec, debe realizarse una verificación contra el estado actual del proyecto.

Si existe alguna diferencia entre esta spec y el código fuente final:

- prevalece siempre el código fuente;
- la spec debe actualizarse antes de implementar cambios;
- no se debe modificar el addon para adaptarlo a la spec.

# Requirements Document

## Introduction

Este documento especifica los requisitos para la **auditoría técnica completa** del addon "The Obsessed Knocker" y el **diseño de integración con IA local (Ollama)** para Minecraft Bedrock Edition.

El objetivo es **complementar** el sistema conversacional existente (180+ patrones RegEx, 300+ respuestas predefinidas) con capacidades de generación dinámica mediante IA local, **sin degradar** ninguna funcionalidad actual.

## Glossary

- **Addon**: Paquete de modificación para Minecraft Bedrock Edition que incluye behavior pack y resource pack
- **El_Acechador**: Personaje NPC principal del addon con personalidad obsesiva e inquietante
- **Bond_System**: Sistema de puntuación que mide el vínculo emocional entre jugador y El_Acechador (0-500)
- **Tier_System**: Clasificación del Bond en niveles: Stranger (0-99), Watched (100-249), Familiar (250-399), Obsessed (400-500)
- **Script_API**: API de scripting de Minecraft Bedrock basada en JavaScript/TypeScript
- **Ollama**: Servidor local de modelos de lenguaje (LLM) que permite ejecutar IA sin conexión externa
- **Bridge**: Componente intermediario que permite comunicación entre Minecraft Bedrock y procesos externos
- **Fallback_System**: Mecanismo que usa respuestas predefinidas cuando Ollama no está disponible
- **Context_Window**: Información contextual enviada a Ollama antes de generar respuestas
- **RegEx_Pattern**: Expresión regular usada para detectar intenciones en mensajes del jugador
- **Chat_Cooldown**: Sistema de 30 segundos que limita frecuencia de respuestas por jugador
- **Apodo_System**: Sistema que permite jugadores establecer nombres personalizados
- **Intent_Detection**: Proceso de análisis de mensajes para clasificar intención del jugador

## Requirements

### Requirement 1: Auditoría del Sistema Conversacional Actual

**User Story:** Como auditor técnico, quiero analizar completamente el sistema conversacional existente, para identificar componentes críticos y dependencias que NO deben degradarse.

#### Acceptance Criteria

1. THE Audit_System SHALL documentar TODOS los patrones RegEx existentes (180+ patrones) con sus intenciones asociadas
2. THE Audit_System SHALL catalogar TODAS las respuestas predefinidas (300+ respuestas) organizadas por tier y categoría
3. THE Audit_System SHALL mapear el flujo completo de detección de intenciones desde input del jugador hasta selección de respuesta
4. THE Audit_System SHALL identificar TODAS las estructuras de datos críticas (chatCooldowns Map, playerNicknames Map, ChatResponses object)
5. THE Audit_System SHALL documentar el sistema de probabilidades por tier (20%, 40%, 60%, 80%)
6. THE Audit_System SHALL listar TODAS las funciones involucradas en el sistema conversacional (detectIntent, respondToChat, normalizeText, say)
7. THE Audit_System SHALL verificar la integridad del sistema de Bond y Tiers incluyendo rangos exactos y comportamientos asociados
8. THE Audit_System SHALL identificar puntos de integración potenciales donde Ollama puede complementar sin reemplazar

### Requirement 2: Auditoría de Personalidad y Comportamiento

**User Story:** Como diseñador de personajes, quiero documentar la personalidad completa de El_Acechador, para asegurar que Ollama mantenga el tono correcto.

#### Acceptance Criteria

1. THE Personality_Audit SHALL documentar TODOS los rasgos de personalidad: obsesivo, dependiente, protector, celoso, inquietante, observador, misterioso
2. THE Personality_Audit SHALL catalogar progresión de tono por tier desde distante (T0) hasta obsesivo extremo (T3)
3. THE Personality_Audit SHALL identificar frases y expresiones características que definen el estilo conversacional
4. THE Personality_Audit SHALL documentar reglas absolutas de comportamiento (nunca romper personaje, nunca mencionar ser IA)
5. THE Personality_Audit SHALL analizar ejemplos de respuestas por cada combinación tier-intención para extraer patrones lingüísticos
6. THE Personality_Audit SHALL identificar vocabulario prohibido y vocabulario preferido
7. THE Personality_Audit SHALL documentar mecánicas emocionales (celos, posesividad, dependencia emocional)

### Requirement 3: Evaluación de Capacidades Técnicas de Bedrock

**User Story:** Como desarrollador de sistemas, quiero determinar las capacidades y limitaciones de Minecraft Bedrock Script API, para diseñar soluciones técnicamente viables.

#### Acceptance Criteria

1. THE Technical_Evaluator SHALL verificar si Script API permite comunicación HTTP con localhost
2. THE Technical_Evaluator SHALL determinar si Script API permite lectura/escritura de archivos locales
3. THE Technical_Evaluator SHALL evaluar si Script API permite ejecutar procesos externos
4. THE Technical_Evaluator SHALL identificar APIs disponibles para comunicación externa (fetch, WebSocket, filesystem)
5. THE Technical_Evaluator SHALL medir latencia típica de operaciones asíncronas en Script API
6. THE Technical_Evaluator SHALL determinar límites de memoria y rendimiento para operaciones de red
7. IF Script API NO permite comunicación directa, THEN THE Technical_Evaluator SHALL documentar necesidad de Bridge externo
8. THE Technical_Evaluator SHALL verificar compatibilidad con sistema operativo objetivo (Windows, Linux, Android)

### Requirement 4: Análisis de Arquitectura de Bridge

**User Story:** Como arquitecto de software, quiero evaluar opciones de arquitectura de comunicación, para seleccionar la solución más robusta y compatible.

#### Acceptance Criteria

1. WHEN Script API NO permite comunicación directa con Ollama, THE Architecture_Analyzer SHALL diseñar arquitectura de Bridge local
2. THE Bridge_Design SHALL especificar protocolo de comunicación (HTTP REST, WebSocket, IPC, file-based)
3. THE Bridge_Design SHALL definir formato de mensajes (JSON schema para requests/responses)
4. THE Bridge_Design SHALL incluir mecanismo de heartbeat para detectar disponibilidad de Ollama
5. THE Bridge_Design SHALL especificar timeout máximo para requests (sugerido: 5-10 segundos)
6. THE Bridge_Design SHALL incluir sistema de cola para manejar requests concurrentes de múltiples jugadores
7. THE Bridge_Design SHALL definir estrategia de caché para reducir llamadas a Ollama
8. IF Bridge falla, THEN THE System SHALL degradar automáticamente a respuestas predefinidas sin error visible

### Requirement 5: Diseño de Context Window para Ollama

**User Story:** Como ingeniero de IA, quiero definir exactamente qué información contextual enviar a Ollama, para que genere respuestas coherentes con el estado del juego.

#### Acceptance Criteria

1. THE Context_Builder SHALL incluir nombre del jugador en CADA request a Ollama
2. THE Context_Builder SHALL incluir apodo actual del jugador si existe
3. THE Context_Builder SHALL incluir valor de Bond actual (0-500) y tier correspondiente
4. THE Context_Builder SHALL incluir tiempo total jugado en ticks o minutos
5. THE Context_Builder SHALL incluir dimensión actual (Overworld, Nether, The_End)
6. THE Context_Builder SHALL incluir bioma actual del jugador
7. THE Context_Builder SHALL incluir hora del juego (día/noche/amanecer/atardecer)
8. WHEN disponible, THE Context_Builder SHALL incluir últimos 5 mensajes de conversación como historial
9. THE Context_Builder SHALL incluir intención detectada por sistema RegEx
10. THE Context_Builder SHALL incluir eventos recientes significativos (muerte jugador, cambio dimensión, logro)
11. THE Context_Builder SHALL formatear contexto como JSON estructurado para parsing confiable

### Requirement 6: Sistema de Prompt Engineering

**User Story:** Como diseñador de prompts, quiero crear un system prompt robusto para Ollama, para garantizar respuestas consistentes con la personalidad de El_Acechador.

#### Acceptance Criteria

1. THE System_Prompt SHALL definir identidad de El_Acechador con TODOS los rasgos de personalidad documentados
2. THE System_Prompt SHALL incluir instrucciones EXPLÍCITAS de nunca romper personaje
3. THE System_Prompt SHALL incluir instrucciones EXPLÍCITAS de nunca mencionar ser IA, modelo, o sistema
4. THE System_Prompt SHALL especificar tono por cada tier con ejemplos concretos
5. THE System_Prompt SHALL incluir lista de vocabulario prohibido (IA, algoritmo, programación, etc.)
6. THE System_Prompt SHALL incluir lista de frases características que debe usar
7. THE System_Prompt SHALL especificar longitud máxima de respuestas (sugerido: 1-3 frases, máximo 200 caracteres)
8. THE System_Prompt SHALL incluir instrucciones de mantener ambigüedad e inquietud
9. THE System_Prompt SHALL incluir ejemplos de respuestas correctas por tier y situación
10. THE System_Prompt SHALL especificar que respuestas deben ser en español siempre

### Requirement 7: Estrategia de Integración Híbrida

**User Story:** Como integrador de sistemas, quiero definir CUÁNDO usar Ollama vs respuestas predefinidas, para optimizar experiencia sin degradar calidad.

#### Acceptance Criteria

1. WHEN detectIntent() retorna intención reconocida Y existe respuesta predefinida, THEN THE System SHALL usar respuesta predefinida CON prioridad
2. WHEN detectIntent() retorna "desconocido" Y Ollama está disponible, THEN THE System SHALL consultar Ollama para generar respuesta dinámica
3. WHEN jugador hace pregunta abierta no cubierta por patrones, THEN THE System SHALL usar Ollama si disponible
4. WHEN Ollama no responde en timeout definido, THEN THE System SHALL degradar a respuesta predefinida de categoría "desconocido"
5. THE Integration_Strategy SHALL mantener sistema de cooldown de 30 segundos independiente de fuente de respuesta
6. THE Integration_Strategy SHALL aplicar probabilidades por tier (20/40/60/80%) ANTES de decidir fuente de respuesta
7. THE Integration_Strategy SHALL registrar origen de cada respuesta (predefinida vs Ollama) para métricas
8. THE Integration_Strategy SHALL implementar circuit breaker que deshabilita Ollama temporalmente tras 3 fallos consecutivos

### Requirement 8: Sistema de Validación de Respuestas de Ollama

**User Story:** Como guardia de calidad, quiero validar respuestas de Ollama antes de mostrarlas, para evitar romper personaje o mostrar contenido inapropiado.

#### Acceptance Criteria

1. THE Response_Validator SHALL rechazar respuestas que contengan palabras prohibidas (IA, modelo, sistema, algoritmo, programación)
2. THE Response_Validator SHALL rechazar respuestas que excedan 200 caracteres de longitud
3. THE Response_Validator SHALL rechazar respuestas que rompan personaje (mencionar ser NPC, juego, código)
4. THE Response_Validator SHALL rechazar respuestas genéricas de asistente (¿En qué puedo ayudarte?, Claro, te ayudo)
5. THE Response_Validator SHALL verificar que respuesta esté en español
6. WHEN respuesta es rechazada, THEN THE System SHALL usar respuesta predefinida como fallback
7. THE Response_Validator SHALL registrar respuestas rechazadas para análisis y mejora de prompts
8. THE Response_Validator SHALL validar que respuesta mantenga tono apropiado para tier actual

### Requirement 9: Compatibilidad Hacia Atrás Total

**User Story:** Como usuario existente del addon, quiero que TODAS las características actuales funcionen exactamente igual, para no perder funcionalidad.

#### Acceptance Criteria

1. THE Integration SHALL mantener funcionamiento idéntico de sistema de cooldown por jugador
2. THE Integration SHALL mantener funcionamiento idéntico de sistema de apodos personalizados
3. THE Integration SHALL mantener funcionamiento idéntico de detección de intenciones por RegEx
4. THE Integration SHALL mantener funcionamiento idéntico de sistema de probabilidades por tier
5. THE Integration SHALL mantener TODAS las respuestas predefinidas existentes sin modificación
6. THE Integration SHALL mantener funcionamiento idéntico de funciones say(), detectIntent(), respondToChat()
7. WHEN Ollama NO está instalado o disponible, THEN THE Addon SHALL funcionar idénticamente a versión actual
8. THE Integration SHALL NO modificar archivos existentes de forma incompatible con versión actual
9. THE Integration SHALL permitir deshabilitar Ollama vía configuración manteniendo funcionalidad completa
10. THE Integration SHALL pasar TODAS las pruebas de validación del sistema actual sin cambios

### Requirement 10: Parser de Configuración Local

**User Story:** Como administrador del addon, quiero definir configuración de integración Ollama, para personalizar comportamiento sin editar código.

#### Acceptance Criteria

1. THE Configuration_Parser SHALL leer archivo JSON de configuración ubicado en ruta específica del addon
2. THE Configuration SHALL incluir parámetro enabled (true/false) para activar/desactivar Ollama
3. THE Configuration SHALL incluir parámetro ollama_url (default: http://localhost:11434)
4. THE Configuration SHALL incluir parámetro model_name (default: llama2 o mistral)
5. THE Configuration SHALL incluir parámetro timeout_ms (default: 8000ms)
6. THE Configuration SHALL incluir parámetro max_retries (default: 2)
7. THE Configuration SHALL incluir parámetro fallback_to_predefined (default: true)
8. THE Configuration SHALL incluir parámetro log_responses (default: false) para debugging
9. WHEN archivo de configuración NO existe, THEN THE System SHALL usar defaults y continuar funcionando
10. WHEN archivo de configuración tiene formato inválido, THEN THE System SHALL usar defaults y registrar warning

### Requirement 11: Pretty Printer de Contexto

**User Story:** Como desarrollador debuggeando integración, quiero formatear contexto de forma legible, para verificar información enviada a Ollama.

#### Acceptance Criteria

1. THE Pretty_Printer SHALL formatear objeto de contexto como JSON indentado con 2 espacios
2. THE Pretty_Printer SHALL incluir timestamp de generación del contexto
3. THE Pretty_Printer SHALL incluir versión del formato de contexto
4. THE Pretty_Printer SHALL incluir TODOS los campos requeridos: nombre, apodo, bond, tier, dimensión, bioma, hora, historial
5. WHEN log_responses está habilitado, THEN THE System SHALL escribir contexto formateado a archivo de log
6. THE Pretty_Printer SHALL sanitizar información sensible antes de logging si aplica
7. THE Pretty_Printer SHALL formatear historial conversacional con timestamps y roles (jugador/acechador)

### Requirement 12: Round-Trip de Comunicación con Ollama

**User Story:** Como desarrollador de integración, quiero probar comunicación completa con Ollama, para verificar que request-response funciona correctamente.

#### Acceptance Criteria

1. FOR ALL requests válidos a Ollama, enviar contexto entonces recibir respuesta entonces parsear respuesta SHALL producir string de texto utilizable
2. THE Round_Trip_Test SHALL enviar contexto de prueba a Ollama con todas las propiedades requeridas
3. THE Round_Trip_Test SHALL recibir respuesta de Ollama en formato esperado (JSON con campo response)
4. THE Round_Trip_Test SHALL extraer texto de respuesta del JSON
5. THE Round_Trip_Test SHALL validar que texto extraído no está vacío
6. THE Round_Trip_Test SHALL validar que texto extraído está en español
7. THE Round_Trip_Test SHALL completar ciclo completo en menos de timeout configurado
8. WHEN round-trip falla, THEN THE System SHALL registrar error detallado con código de error HTTP si aplica

### Requirement 13: Manejo de Errores Graceful

**User Story:** Como jugador del addon, quiero que errores de Ollama sean invisibles, para mantener inmersión sin ver mensajes técnicos.

#### Acceptance Criteria

1. WHEN Ollama no está instalado, THEN THE System SHALL degradar silenciosamente a respuestas predefinidas
2. WHEN Ollama no responde en timeout, THEN THE System SHALL usar respuesta predefinida sin mostrar error
3. WHEN Bridge no está disponible, THEN THE System SHALL funcionar solo con respuestas predefinidas
4. WHEN respuesta de Ollama es inválida, THEN THE System SHALL usar respuesta predefinida sin mostrar error
5. WHEN respuesta de Ollama es rechazada por validación, THEN THE System SHALL usar respuesta predefinida sin mostrar error
6. THE Error_Handler SHALL registrar TODOS los errores en archivo de log para debugging
7. THE Error_Handler SHALL implementar circuit breaker que deshabilita Ollama tras 5 fallos en 1 minuto
8. THE Error_Handler SHALL reactivar Ollama automáticamente tras 5 minutos de circuit breaker
9. THE System SHALL NUNCA mostrar errores técnicos al jugador en chat del juego
10. THE System SHALL NUNCA crashear debido a fallos de Ollama

### Requirement 14: Métricas y Telemetría

**User Story:** Como analista de sistema, quiero recopilar métricas de uso de Ollama, para optimizar configuración y detectar problemas.

#### Acceptance Criteria

1. THE Metrics_System SHALL contar total de requests a Ollama
2. THE Metrics_System SHALL contar total de respuestas exitosas de Ollama
3. THE Metrics_System SHALL contar total de fallbacks a respuestas predefinidas
4. THE Metrics_System SHALL medir latencia promedio de requests a Ollama
5. THE Metrics_System SHALL medir latencia máxima observada
6. THE Metrics_System SHALL contar respuestas rechazadas por validación
7. THE Metrics_System SHALL contar activaciones de circuit breaker
8. WHEN log_responses está habilitado, THEN THE Metrics_System SHALL escribir métricas a archivo JSON cada 5 minutos
9. THE Metrics_System SHALL incluir timestamp de inicio y fin de período de métricas
10. THE Metrics_System SHALL NO impactar rendimiento del juego (overhead < 1ms por mensaje)

### Requirement 15: Documentación de Limitaciones Técnicas

**User Story:** Como documentador técnico, quiero listar explícitamente limitaciones conocidas, para establecer expectativas realistas.

#### Acceptance Criteria

1. THE Documentation SHALL listar limitación de Script API si NO soporta HTTP directo
2. THE Documentation SHALL listar limitación de latencia añadida por Ollama (típicamente 2-8 segundos)
3. THE Documentation SHALL listar limitación de requerir instalación de Ollama en máquina local
4. THE Documentation SHALL listar limitación de requerir Bridge si Script API no soporta comunicación directa
5. THE Documentation SHALL listar limitación de NO funcionar en Realms sin Ollama local
6. THE Documentation SHALL listar limitación de consumo de recursos de Ollama (RAM, CPU)
7. THE Documentation SHALL listar limitación de calidad de respuestas dependiendo del modelo usado
8. THE Documentation SHALL especificar requisitos mínimos de hardware para ejecutar Ollama simultáneamente con Minecraft

### Requirement 16: Requisitos No Funcionales de Rendimiento

**User Story:** Como jugador preocupado por rendimiento, quiero que integración Ollama NO degrade FPS o fluidez del juego.

#### Acceptance Criteria

1. THE Ollama_Integration SHALL procesar requests de forma asíncrona sin bloquear game loop
2. THE Ollama_Integration SHALL completar validación de respuestas en menos de 10ms
3. THE Ollama_Integration SHALL limitar requests concurrentes a Ollama a máximo 3 simultáneos
4. THE Ollama_Integration SHALL implementar sistema de cola con límite de 10 requests pendientes
5. WHEN cola está llena, THEN THE System SHALL rechazar nuevos requests y usar respuestas predefinidas
6. THE Ollama_Integration SHALL NO consumir más de 50MB de RAM adicional en Script API
7. THE Ollama_Integration SHALL NO reducir FPS del juego en más de 2% en promedio
8. THE Ollama_Integration SHALL funcionar correctamente con 10+ jugadores simultáneos en multiplayer

### Requirement 17: Plan de Testing de Integración

**User Story:** Como QA tester, quiero definir casos de prueba completos, para validar integración funciona correctamente.

#### Acceptance Criteria

1. THE Test_Plan SHALL incluir test de Ollama disponible y respondiendo correctamente
2. THE Test_Plan SHALL incluir test de Ollama no disponible y fallback funcionando
3. THE Test_Plan SHALL incluir test de timeout de Ollama y fallback funcionando
4. THE Test_Plan SHALL incluir test de respuesta inválida de Ollama y fallback funcionando
5. THE Test_Plan SHALL incluir test de validación rechazando respuesta inapropiada
6. THE Test_Plan SHALL incluir test de contexto completo siendo enviado correctamente
7. THE Test_Plan SHALL incluir test de respuesta de Ollama manteniendo personalidad por tier
8. THE Test_Plan SHALL incluir test de múltiples jugadores simultáneos con Ollama
9. THE Test_Plan SHALL incluir test de deshabilitar Ollama vía configuración
10. THE Test_Plan SHALL incluir test de circuit breaker activándose y recuperándose

### Requirement 18: Análisis de Riesgos de Integración

**User Story:** Como gerente de proyecto, quiero identificar riesgos técnicos de integración, para planificar mitigaciones.

#### Acceptance Criteria

1. THE Risk_Analysis SHALL identificar riesgo de incompatibilidad de Script API con comunicación externa
2. THE Risk_Analysis SHALL identificar riesgo de latencia alta degradando experiencia
3. THE Risk_Analysis SHALL identificar riesgo de respuestas de Ollama rompiendo personaje
4. THE Risk_Analysis SHALL identificar riesgo de Ollama no disponible causando errores visibles
5. THE Risk_Analysis SHALL identificar riesgo de Bridge externo agregando complejidad de instalación
6. THE Risk_Analysis SHALL identificar riesgo de consumo de recursos afectando rendimiento
7. THE Risk_Analysis SHALL incluir nivel de severidad (bajo/medio/alto) para cada riesgo
8. THE Risk_Analysis SHALL incluir estrategia de mitigación para cada riesgo identificado
9. THE Risk_Analysis SHALL incluir plan de rollback si integración falla en producción

### Requirement 19: Requisitos de Instalación y Configuración

**User Story:** Como usuario instalando el addon, quiero instrucciones claras de instalación con Ollama, para ponerlo en funcionamiento correctamente.

#### Acceptance Criteria

1. THE Installation_Guide SHALL incluir paso de instalar Ollama en sistema operativo objetivo
2. THE Installation_Guide SHALL incluir paso de descargar modelo recomendado (llama2 o mistral)
3. THE Installation_Guide SHALL incluir paso de iniciar servidor Ollama en localhost:11434
4. THE Installation_Guide SHALL incluir paso de instalar Bridge si es necesario
5. THE Installation_Guide SHALL incluir paso de configurar archivo de configuración del addon
6. THE Installation_Guide SHALL incluir paso de verificar que Ollama está funcionando
7. THE Installation_Guide SHALL incluir troubleshooting para problemas comunes
8. THE Installation_Guide SHALL incluir instrucciones de deshabilitación si usuario prefiere modo clásico
9. THE Installation_Guide SHALL estar disponible en español
10. THE Installation_Guide SHALL incluir requisitos de hardware mínimos y recomendados

### Requirement 20: Priorización de Fuente de Respuesta

**User Story:** Como diseñador de sistema, quiero definir prioridad clara entre respuestas predefinidas y Ollama, para mantener calidad consistente.

#### Acceptance Criteria

1. THE Priority_System SHALL dar máxima prioridad a respuestas predefinidas cuando intención está cubierta por patrones RegEx
2. THE Priority_System SHALL usar Ollama solo para intenciones "desconocido" o preguntas abiertas no cubiertas
3. THE Priority_System SHALL permitir configurar modo de operación: pure_predefined, hybrid, ollama_first
4. WHEN modo es pure_predefined, THEN THE System SHALL nunca usar Ollama
5. WHEN modo es hybrid (default), THEN THE System SHALL usar lógica definida en criterios 1-2
6. WHEN modo es ollama_first, THEN THE System SHALL intentar Ollama primero y usar predefinidas como fallback
7. THE Priority_System SHALL registrar decisiones de priorización cuando logging está habilitado
8. THE Priority_System SHALL ser configurable sin requerir cambios en código

## Notes

### Decisiones de Diseño Críticas

**Principio de No Degradación:**
Todos los requisitos están diseñados bajo el principio absoluto de NO degradar funcionalidad existente. Ollama es una capa complementaria opcional, NO un reemplazo.

**Estrategia de Fallback:**
Sistema diseñado para degradación graceful en TODOS los escenarios de fallo. El jugador NUNCA debe ver errores técnicos.

**Preservación de Personalidad:**
Requisitos 2, 6, 8 trabajan juntos para asegurar que respuestas de Ollama mantengan personalidad de El_Acechador.

### Consideraciones de Implementación

**Parser Requirement (Req 11):**
Pretty Printer es esencial para debugging pero NO es parte crítica del flujo de producción. Puede implementarse con prioridad menor.

**Round-Trip Requirement (Req 12):**
Es un caso especial de testing que verifica la integración completa funciona correctamente desde envío de contexto hasta recepción de respuesta válida.

### Próximos Pasos

Tras completar este documento de requisitos:
1. **Fase de Diseño:** Crear arquitectura detallada basada en requisitos validados
2. **Prototipo Técnico:** Implementar prueba de concepto de comunicación Script API ↔ Ollama
3. **Implementación Incremental:** Desarrollar componentes por prioridad manteniendo compatibilidad
4. **Testing Exhaustivo:** Validar TODOS los requisitos antes de release

Este documento establece la fundación para una integración segura, robusta y no invasiva de Ollama en The Obsessed Knocker.
