# Requirements Document

## Introduction

Este documento especifica los requerimientos para mejorar y expandir "The Obsessed Knocker", un addon de horror psicológico para Minecraft Bedrock Edition. El addon presenta una entidad llamada "El Acechador" (The Knocker) que es un compañero obsesivo que observa, recuerda, aprende y desarrolla un vínculo creciente con el jugador.

**Objetivo Principal:** Mejorar todos los sistemas existentes del addon sin eliminar mecánicas funcionales ni cambiar la identidad del personaje. El addon debe alcanzar su máximo potencial manteniendo su atmósfera de horror psicológico y la personalidad obsesiva de la entidad.

**Alcance:** Este proyecto abarca mejoras en traducción completa al español, sistemas de diálogo, IA conversacional, memoria, consciencia del mundo, comportamiento de acecho, eventos especiales, sistema de vínculo y optimización técnica.

**Contexto Técnico:** 
- Plataforma: Minecraft Bedrock Edition 1.21.50+
- Lenguaje: JavaScript (scripts), JSON (definiciones), MCFunction (comandos)
- Tamaño actual: ~65KB de lógica
- Objetivo: ~200KB de lógica (nivel de referencia: addon "Verity")

## Glossary

- **El_Acechador**: La entidad principal del addon (The Knocker), un compañero obsesivo de horror psicológico
- **Sistema_de_Vínculo**: Sistema de puntuación (0-500) que mide la relación entre el jugador y El_Acechador
- **Tier**: Nivel de relación basado en puntos de vínculo (0=Stranger, 1=Watched, 2=Familiar, 3=Obsessed)
- **Objeto_R**: Estructura de datos en main.js que contiene ~600 respuestas organizadas por categoría y tier
- **Vara_Whisper**: Item especial que permite al jugador interactuar con El_Acechador mediante diálogos
- **Sistema_de_Memoria**: Componente que permite a El_Acechador recordar eventos, conversaciones y acciones del jugador
- **Consciencia_Ambiental**: Capacidad de El_Acechador para detectar y reaccionar a biomas, dimensiones, clima y estructuras
- **Sistema_de_Chat**: Mecanismo para que El_Acechador lea mensajes del chat del jugador y responda apropiadamente
- **Detección_de_Intenciones**: Sistema basado en palabras clave (RegEx) para interpretar mensajes del jugador
- **Cooldown**: Tiempo de espera entre interacciones para evitar spam
- **Behavior_Pack**: Paquete que contiene la lógica del addon (KNOCKERbeh2)
- **Resource_Pack**: Paquete que contiene recursos visuales y de audio (KNOCKERres2)
- **MCFunction**: Archivos de comandos de Minecraft (.mcfunction)
- **Evento_Ultra_Raro**: Interacciones especiales con probabilidad de ocurrencia muy baja (1-2%)

## Requirements

### Requirement 1: Traducción Completa al Español

**User Story:** Como jugador hispanohablante, quiero que todo el contenido del addon esté en español natural, para poder disfrutar completamente de la experiencia de horror psicológico.

#### Acceptance Criteria

1. WHEN el addon se ejecuta, THE Sistema_de_Traducción SHALL mostrar todas las respuestas del Objeto_R en español natural
2. WHEN el jugador interactúa con menús UI, THE Sistema_de_Traducción SHALL mostrar todos los textos de interfaz en español
3. WHEN el jugador usa comandos .bond, THE Sistema_de_Traducción SHALL mostrar mensajes de estado en español
4. THE Sistema_de_Traducción SHALL preservar la atmósfera de horror psicológico en todas las traducciones
5. THE Sistema_de_Traducción SHALL mantener la personalidad obsesiva de El_Acechador en los diálogos traducidos
6. WHEN se traduce contenido, THE Sistema_de_Traducción SHALL usar español natural y no literal
7. THE Sistema_de_Traducción SHALL traducir aproximadamente 600 respuestas del Objeto_R
8. THE Sistema_de_Traducción SHALL traducir aproximadamente 50 strings de menús UI
9. THE Sistema_de_Traducción SHALL traducir 4 mensajes de comando .bond

### Requirement 2: Sistema de Diálogos Mejorado

**User Story:** Como jugador, quiero experimentar mayor variedad y profundidad en las respuestas de El Acechador, para que las interacciones no se sientan repetitivas y mantengan la inmersión.

#### Acceptance Criteria

1. WHEN el jugador usa la Vara_Whisper, THE Sistema_de_Diálogos SHALL seleccionar de un pool expandido de respuestas
2. THE Sistema_de_Diálogos SHALL incluir respuestas raras con probabilidad de selección entre 5-10%
3. THE Sistema_de_Diálogos SHALL incluir respuestas ultra-raras con probabilidad de selección entre 1-2%
4. WHILE el jugador mantiene una conversación, THE Sistema_de_Diálogos SHALL mantener contexto conversacional
5. WHEN El_Acechador responde, THE Sistema_de_Diálogos SHALL considerar el Tier actual del Sistema_de_Vínculo
6. WHEN El_Acechador tiene un estado de ánimo específico, THE Sistema_de_Diálogos SHALL generar respuestas apropiadas al estado
7. THE Sistema_de_Diálogos SHALL soportar conversaciones multi-paso con seguimiento de contexto
8. THE Sistema_de_Diálogos SHALL expandir el Objeto_R de ~600 a ~1200 respuestas variadas
9. WHEN el jugador hace la misma pregunta repetidamente, THE Sistema_de_Diálogos SHALL variar las respuestas para reducir repetición

### Requirement 3: Sistema de IA Conversacional (Chat)

**User Story:** Como jugador, quiero que El Acechador pueda leer y responder a mis mensajes del chat, para crear una experiencia más dinámica e interactiva.

#### Acceptance Criteria

1. WHEN el jugador escribe un mensaje en el chat, THE Sistema_de_Chat SHALL capturar y analizar el mensaje
2. THE Sistema_de_Chat SHALL usar Detección_de_Intenciones basada en palabras clave para interpretar mensajes
3. WHEN se detecta una intención reconocida, THE Sistema_de_Chat SHALL generar una respuesta coherente
4. THE Sistema_de_Chat SHALL ajustar respuestas según el Tier del Sistema_de_Vínculo
5. WHEN El_Acechador responde al chat, THE Sistema_de_Chat SHALL aplicar un Cooldown para evitar spam
6. THE Sistema_de_Chat SHALL implementar probabilidades variables de respuesta según contexto
7. THE Sistema_de_Chat SHALL mantener un mapa de palabras clave (RegEx) de aproximadamente 100 patrones
8. WHEN el Tier es Stranger (0), THE Sistema_de_Chat SHALL responder con probabilidad 20%
9. WHEN el Tier es Watched (1), THE Sistema_de_Chat SHALL responder con probabilidad 40%
10. WHEN el Tier es Familiar (2), THE Sistema_de_Chat SHALL responder con probabilidad 60%
11. WHEN el Tier es Obsessed (3), THE Sistema_de_Chat SHALL responder con probabilidad 80%
12. THE Sistema_de_Chat SHALL implementar Cooldown base de 30 segundos entre respuestas

### Requirement 4: Sistema de Memoria Expandido

**User Story:** Como jugador, quiero que El Acechador recuerde eventos importantes y conversaciones previas, para que la relación se sienta auténtica y persistente.

#### Acceptance Criteria

1. WHEN el jugador muere, THE Sistema_de_Memoria SHALL registrar el evento de muerte
2. WHEN el jugador obtiene un logro, THE Sistema_de_Memoria SHALL registrar el logro obtenido
3. WHEN ocurre una conversación significativa, THE Sistema_de_Memoria SHALL almacenar contexto de la conversación
4. WHEN el jugador realiza una acción específica, THE Sistema_de_Memoria SHALL registrar la acción para referencia futura
5. THE Sistema_de_Memoria SHALL mantener un historial de los últimos 20 eventos significativos
6. THE Sistema_de_Memoria SHALL mantener un historial de las últimas 10 conversaciones
7. WHEN El_Acechador genera diálogos, THE Sistema_de_Memoria SHALL permitir referencias a eventos pasados
8. THE Sistema_de_Memoria SHALL persistir datos entre sesiones de juego
9. WHEN el Sistema_de_Memoria alcanza su capacidad máxima, THE Sistema_de_Memoria SHALL eliminar los eventos más antiguos (FIFO)

### Requirement 5: Consciencia del Mundo

**User Story:** Como jugador, quiero que El Acechador reaccione al entorno, clima y situaciones del mundo, para que se sienta presente y consciente de su entorno.

#### Acceptance Criteria

1. WHEN el jugador entra a un bioma específico, THE Sistema_de_Consciencia_Ambiental SHALL generar comentarios apropiados al bioma
2. WHEN el jugador cambia de dimensión, THE Sistema_de_Consciencia_Ambiental SHALL reaccionar al cambio dimensional
3. WHEN hay mobs hostiles cercanos, THE Sistema_de_Consciencia_Ambiental SHALL comentar sobre la presencia de mobs
4. WHEN el jugador construye estructuras, THE Sistema_de_Consciencia_Ambiental SHALL observar y comentar sobre las construcciones
5. WHEN es de noche, THE Sistema_de_Consciencia_Ambiental SHALL generar diálogos temáticos nocturnos
6. WHEN es de día, THE Sistema_de_Consciencia_Ambiental SHALL generar diálogos temáticos diurnos
7. WHEN llueve o hay tormenta, THE Sistema_de_Consciencia_Ambiental SHALL reaccionar al clima
8. THE Sistema_de_Consciencia_Ambiental SHALL detectar al menos 10 biomas distintos
9. THE Sistema_de_Consciencia_Ambiental SHALL detectar las 3 dimensiones (Overworld, Nether, End)
10. THE Sistema_de_Consciencia_Ambiental SHALL mantener un radio de detección de 32 bloques

### Requirement 6: Comportamiento de Acecho Mejorado

**User Story:** Como jugador, quiero experimentar un acecho más sutil e inquietante, para que la presencia de El Acechador genere tensión psicológica efectiva.

#### Acceptance Criteria

1. WHEN El_Acechador acecha al jugador, THE Sistema_de_Acecho SHALL mantener distancia de observación entre 16-48 bloques
2. THE Sistema_de_Acecho SHALL posicionar a El_Acechador en ubicaciones estratégicas (ventanas, puertas, colinas)
3. WHEN el jugador mira directamente a El_Acechador, THE Sistema_de_Acecho SHALL ocultar a El_Acechador gradualmente
4. WHEN el jugador no está mirando, THE Sistema_de_Acecho SHALL revelar a El_Acechador en posiciones visibles
5. THE Sistema_de_Acecho SHALL implementar movimiento natural e intencional (no errático)
6. WHEN El_Acechador se mueve, THE Sistema_de_Acecho SHALL priorizar rutas que eviten detección directa
7. THE Sistema_de_Acecho SHALL balancear presencia visible y ocultamiento según Tier
8. WHEN el Tier es Stranger (0), THE Sistema_de_Acecho SHALL aparecer visible 10% del tiempo
9. WHEN el Tier es Watched (1), THE Sistema_de_Acecho SHALL aparecer visible 25% del tiempo
10. WHEN el Tier es Familiar (2), THE Sistema_de_Acecho SHALL aparecer visible 50% del tiempo
11. WHEN el Tier es Obsessed (3), THE Sistema_de_Acecho SHALL aparecer visible 75% del tiempo

### Requirement 7: Eventos Ultra-Raros

**User Story:** Como jugador dedicado, quiero descubrir eventos especiales extremadamente raros, para ser recompensado por jugar extensamente y mantener la experiencia fresca.

#### Acceptance Criteria

1. THE Sistema_de_Eventos_Raros SHALL implementar diálogos ultra-raros con probabilidad 1-2%
2. THE Sistema_de_Eventos_Raros SHALL implementar apariciones especiales con probabilidad 0.5-1%
3. THE Sistema_de_Eventos_Raros SHALL implementar interacciones secretas con probabilidad 1%
4. WHEN el jugador acumula más de 50 horas de juego, THE Sistema_de_Eventos_Raros SHALL incrementar probabilidades de eventos raros en 0.5%
5. WHEN el Tier es Obsessed (3), THE Sistema_de_Eventos_Raros SHALL incrementar probabilidades de eventos raros en 1%
6. THE Sistema_de_Eventos_Raros SHALL incluir al menos 10 eventos ultra-raros únicos
7. THE Sistema_de_Eventos_Raros SHALL registrar eventos raros experimentados para evitar repetición excesiva
8. WHEN un evento ultra-raro ocurre, THE Sistema_de_Eventos_Raros SHALL otorgar recompensa única (item especial o diálogo exclusivo)

### Requirement 8: Sistema de Vínculo Refinado

**User Story:** Como jugador, quiero que cada nivel de relación con El Acechador se sienta distintivo y significativo, para experimentar una progresión clara en nuestra relación.

#### Acceptance Criteria

1. WHEN el Sistema_de_Vínculo está en Tier Stranger (0-99), THE Sistema_de_Vínculo SHALL generar comportamientos distantes y observacionales
2. WHEN el Sistema_de_Vínculo está en Tier Watched (100-249), THE Sistema_de_Vínculo SHALL generar comportamientos de interés creciente
3. WHEN el Sistema_de_Vínculo está en Tier Familiar (250-399), THE Sistema_de_Vínculo SHALL generar comportamientos de apego notable
4. WHEN el Sistema_de_Vínculo está en Tier Obsessed (400-500), THE Sistema_de_Vínculo SHALL generar comportamientos de obsesión intensa
5. WHEN el vínculo alcanza exactamente 500, THE Sistema_de_Vínculo SHALL desbloquear diálogos exclusivos de obsesión máxima
6. WHEN el jugador cruza un umbral de Tier, THE Sistema_de_Vínculo SHALL activar un evento especial de transición
7. THE Sistema_de_Vínculo SHALL ajustar frecuencia de apariciones según Tier
8. THE Sistema_de_Vínculo SHALL ajustar intensidad de diálogos según Tier
9. THE Sistema_de_Vínculo SHALL ajustar comportamiento de acecho según Tier
10. WHEN el Sistema_de_Vínculo alcanza hitos (100, 250, 400, 500), THE Sistema_de_Vínculo SHALL mostrar mensaje especial de hito

### Requirement 9: Optimización Técnica y Compatibilidad

**User Story:** Como jugador, quiero que el addon funcione sin problemas en modo multijugador y sin afectar el rendimiento del juego, para disfrutar una experiencia fluida.

#### Acceptance Criteria

1. WHEN el addon se ejecuta, THE Sistema_de_Optimización SHALL consumir menos de 5% del tiempo de tick del servidor
2. THE Sistema_de_Optimización SHALL funcionar correctamente en servidores multijugador con múltiples jugadores
3. WHEN múltiples jugadores están en el servidor, THE Sistema_de_Optimización SHALL instanciar un El_Acechador por jugador
4. THE Sistema_de_Optimización SHALL prevenir conflictos entre instancias de El_Acechador de diferentes jugadores
5. THE Sistema_de_Optimización SHALL almacenar datos de Sistema_de_Vínculo de forma persistente por jugador
6. THE Sistema_de_Optimización SHALL corregir bugs conocidos del addon original
7. THE Sistema_de_Optimización SHALL ser compatible con Minecraft Bedrock 1.21.50 y versiones superiores
8. THE Sistema_de_Optimización SHALL mantener estructura modular para facilitar futuras actualizaciones
9. THE Sistema_de_Optimización SHALL implementar manejo de errores para prevenir crashes
10. WHEN ocurre un error, THE Sistema_de_Optimización SHALL registrar el error en logs sin interrumpir el juego

### Requirement 10: Parser y Serialización de Configuración

**User Story:** Como desarrollador del addon, quiero poder cargar y guardar configuraciones del addon desde archivos, para facilitar personalización y respaldo de datos.

#### Acceptance Criteria

1. WHEN un archivo de configuración válido es proporcionado, THE Parser_de_Configuración SHALL parsearlo a un objeto de Configuración
2. WHEN un archivo de configuración inválido es proporcionado, THE Parser_de_Configuración SHALL retornar un error descriptivo
3. THE Pretty_Printer_de_Configuración SHALL formatear objetos de Configuración de vuelta a archivos de configuración válidos
4. FOR ALL objetos de Configuración válidos, parsear luego imprimir luego parsear SHALL producir un objeto equivalente (propiedad round-trip)
5. THE Parser_de_Configuración SHALL soportar sintaxis JSON estándar
6. THE Parser_de_Configuración SHALL validar tipos de datos en el archivo de configuración
7. WHEN se guarda configuración, THE Pretty_Printer_de_Configuración SHALL formatear con indentación legible (2 espacios)
8. THE Parser_de_Configuración SHALL soportar configuración de Sistema_de_Vínculo (valores iniciales, multiplicadores)
9. THE Parser_de_Configuración SHALL soportar configuración de Sistema_de_Chat (Cooldown, probabilidades)
10. THE Parser_de_Configuración SHALL soportar configuración de Sistema_de_Eventos_Raros (probabilidades de eventos)

### Requirement 11: Sistema de Respuestas Contextuales Avanzadas

**User Story:** Como jugador, quiero que El Acechador responda apropiadamente al contexto de mis acciones recientes, para que las interacciones se sientan más inteligentes y reactivas.

#### Acceptance Criteria

1. WHEN el jugador acaba de minar, THE Sistema_de_Respuestas_Contextuales SHALL generar comentarios relacionados con minería
2. WHEN el jugador acaba de combatir, THE Sistema_de_Respuestas_Contextuales SHALL generar comentarios relacionados con combate
3. WHEN el jugador acaba de construir, THE Sistema_de_Respuestas_Contextuales SHALL generar comentarios relacionados con construcción
4. WHEN el jugador acaba de comerciar, THE Sistema_de_Respuestas_Contextuales SHALL generar comentarios relacionados con comercio
5. THE Sistema_de_Respuestas_Contextuales SHALL mantener ventana temporal de 5 minutos para acciones recientes
6. THE Sistema_de_Respuestas_Contextuales SHALL priorizar contexto más reciente sobre contexto antiguo
7. WHEN múltiples contextos aplican, THE Sistema_de_Respuestas_Contextuales SHALL seleccionar el contexto más relevante
8. THE Sistema_de_Respuestas_Contextuales SHALL incluir al menos 8 categorías de contexto (minería, combate, construcción, comercio, exploración, crafting, farming, death)

### Requirement 12: Sistema de Estados de Ánimo

**User Story:** Como jugador, quiero que El Acechador tenga estados de ánimo variables que afecten sus respuestas, para añadir imprevisibilidad y profundidad al personaje.

#### Acceptance Criteria

1. THE Sistema_de_Estados_de_Ánimo SHALL implementar al menos 5 estados distintos (neutral, curioso, posesivo, celoso, eufórico)
2. WHEN El_Acechador está en estado curioso, THE Sistema_de_Estados_de_Ánimo SHALL generar diálogos inquisitivos
3. WHEN El_Acechador está en estado posesivo, THE Sistema_de_Estados_de_Ánimo SHALL generar diálogos protectores y restrictivos
4. WHEN El_Acechador está en estado celoso, THE Sistema_de_Estados_de_Ánimo SHALL reaccionar negativamente a presencia de otros mobs/jugadores
5. WHEN El_Acechador está en estado eufórico, THE Sistema_de_Estados_de_Ánimo SHALL generar diálogos intensos y apasionados
6. THE Sistema_de_Estados_de_Ánimo SHALL cambiar de estado basado en acciones del jugador y eventos del mundo
7. THE Sistema_de_Estados_de_Ánimo SHALL mantener cada estado durante al menos 10 minutos antes de cambiar
8. WHEN el Tier es Obsessed (3), THE Sistema_de_Estados_de_Ánimo SHALL incrementar frecuencia de estados intensos (posesivo, celoso, eufórico)
9. THE Sistema_de_Estados_de_Ánimo SHALL permitir transiciones naturales entre estados (no cambios abruptos)

### Requirement 13: Sistema de Logros y Recompensas

**User Story:** Como jugador, quiero desbloquear logros especiales relacionados con mi relación con El Acechador, para tener objetivos claros y recompensas tangibles.

#### Acceptance Criteria

1. WHEN el jugador alcanza Tier Watched (100), THE Sistema_de_Logros SHALL otorgar el logro "Primera Mirada"
2. WHEN el jugador alcanza Tier Familiar (250), THE Sistema_de_Logros SHALL otorgar el logro "Conocido Familiar"
3. WHEN el jugador alcanza Tier Obsessed (400), THE Sistema_de_Logros SHALL otorgar el logro "Objeto de Obsesión"
4. WHEN el jugador alcanza vínculo máximo (500), THE Sistema_de_Logros SHALL otorgar el logro "Vínculo Eterno"
5. WHEN el jugador experimenta su primer evento ultra-raro, THE Sistema_de_Logros SHALL otorgar el logro "Encuentro Especial"
6. WHEN el jugador interactúa con El_Acechador 100 veces, THE Sistema_de_Logros SHALL otorgar el logro "Conversador Dedicado"
7. THE Sistema_de_Logros SHALL mostrar notificaciones visuales cuando se desbloquea un logro
8. THE Sistema_de_Logros SHALL persistir logros desbloqueados entre sesiones
9. THE Sistema_de_Logros SHALL implementar al menos 10 logros únicos
10. WHEN un logro es desbloqueado, THE Sistema_de_Logros SHALL otorgar una recompensa (item especial o diálogo exclusivo)

---

## Document Format Notes

Este documento sigue las reglas EARS (Easy Approach to Requirements Syntax) e INCOSE para asegurar claridad, testabilidad y completitud. Cada requerimiento está estructurado con User Stories y Acceptance Criteria verificables.

**Próximos Pasos:**
1. Revisión y retroalimentación del usuario
2. Refinamiento de requerimientos según feedback
3. Creación del documento de Design
4. Generación del documento de Tasks

**Estado Actual:** Documento de Requirements completo y listo para revisión.
