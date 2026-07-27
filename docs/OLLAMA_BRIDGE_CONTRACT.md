# OLLAMA BRIDGE CONTRACT
## Contrato de Interfaz entre Addon y KnockerBridge

**Versión del Contrato**: 1.0.0  
**Fecha**: Diciembre 2024  
**Estado**: DISEÑO (No implementado)

---

## 1. PROPÓSITO

Este documento define el **contrato de comunicación** entre el addon "The Obsessed Knocker" y el módulo externo KnockerBridge.

### Principios Fundamentales

1. **Ollama es COMPLEMENTO, no REEMPLAZO**
2. **El addon DEBE funcionar 100% sin Ollama**
3. **Ollama SOLO se usa cuando intent === "desconocido"**
4. **Ollama SOLO genera texto, NO toma decisiones de gameplay**

---

## 2. ARQUITECTURA DE INTEGRACIÓN

```
┌─────────────────────────────────────────────────────────┐
│              MINECRAFT BEDROCK ADDON                     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │           main.js (Lógica Principal)           │    │
│  │                                                 │    │
│  │  1. Detecta Intent via RegEx                   │    │
│  │  2. Si intent !== "desconocido" → Responde    │    │
│  │  3. Si intent === "desconocido" → Bridge      │    │
│  └────────────────────────────────────────────────┘    │
│                       │                                  │
│                       │ WebSocket /connect               │
│                       │ localhost:8000                   │
│                       ▼                                  │
└───────────────────────────────────────────────────────┘
                        │
                        │ JSON Request (WebSocket)
                        │
┌───────────────────────▼───────────────────────────────┐
│              KNOCKERBRIDGE (Node.js)                   │
│                                                         │
│  WebSocket Server: ws://localhost:8000                │
│                                                         │
│  ┌──────────────────────────────────────────────┐    │
│  │  1. contextBuilder.js    → Construye prompt  │    │
│  │  2. promptBuilder.js     → Formatea para LLM │    │
│  │  3. ollamaClient.js      → Llama Ollama API  │    │
│  │  4. personalityFilter.js → Valida respuesta  │    │
│  │  5. cache.js             → Cachea respuestas │    │
│  │  6. rateLimiter.js       → Controla requests │    │
│  └──────────────────────────────────────────────┘    │
│                       │                                 │
│                       │ JSON Response (WebSocket)       │
│                       ▼                                 │
└─────────────────────────────────────────────────────────┘
                        │
                        │
┌───────────────────────▼───────────────────────────────┐
│                 OLLAMA (LOCAL)                         │
│                                                         │
│  Modelo: llama3.2 u otro compatible                   │
│  Puerto: 11434 (default)                              │
│  Genera: Solo texto conversacional                    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. PAYLOAD: ADDON → BRIDGE (Request)

### Estructura JSON

```json
{
  "type": "chat_fallback",
  "playerName": "Steve",
  "message": "¿qué piensas de las flores?",
  "intent": "desconocido",
  "context": {
    "bond": 150,
    "tier": 1,
    "tierName": "Watched",
    "mood": "curioso",
    "nickname": null,
    "dimension": "minecraft:overworld",
    "biome": "plains",
    "recentAction": {
      "category": "construcción",
      "timestamp": 1702345678901,
      "details": "Construyó una casa de madera"
    },
    "recentMemory": [
      {
        "type": "conversation",
        "timestamp": 1702345600000,
        "intent": "saludo",
        "response": "Hola... Te he visto por aquí."
      },
      {
        "type": "event",
        "timestamp": 1702340000000,
        "eventType": "tierTransition",
        "details": "Alcanzó tier 1 (Watched)"
      }
    ],
    "nearbyPlayers": ["Alex", "Herobrine"],
    "knockerDistance": 24.5
  },
  "constraints": {
    "maxTokens": 150,
    "temperature": 0.7,
    "stopSequences": ["\n\n", "###"]
  },
  "timestamp": 1702345678901
}
```

### Campos del Request

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `type` | string | ✅ | Siempre `"chat_fallback"` |
| `playerName` | string | ✅ | Nombre del jugador |
| `message` | string | ✅ | Mensaje original del jugador |
| `intent` | string | ✅ | Intent detectado (será `"desconocido"` para Ollama) |
| `context` | object | ✅ | Contexto del juego |
| `context.bond` | number | ✅ | Puntos de vínculo (0-500) |
| `context.tier` | number | ✅ | Tier actual (0-3) |
| `context.tierName` | string | ✅ | Nombre del tier |
| `context.mood` | string | ✅ | Estado de ánimo actual |
| `context.nickname` | string/null | ✅ | Apodo del jugador si existe |
| `context.dimension` | string | ✅ | Dimensión actual |
| `context.biome` | string | ✅ | Bioma actual |
| `context.recentAction` | object/null | ✅ | Última acción significativa |
| `context.recentMemory` | array | ✅ | Últimos eventos (máx 5) |
| `context.nearbyPlayers` | array | ✅ | Jugadores cercanos |
| `context.knockerDistance` | number/null | ✅ | Distancia a El Acechador |
| `constraints` | object | ✅ | Límites de generación |
| `timestamp` | number | ✅ | Unix timestamp en milisegundos |

---

## 4. PAYLOAD: BRIDGE → ADDON (Response)

### Respuesta Exitosa

```json
{
  "ok": true,
  "source": "ollama",
  "text": "Las flores... son hermosas. Como tú cuando no miras. Deberías plantar más cerca de tu casa. Te observaré mientras lo haces.",
  "metadata": {
    "model": "llama3.2",
    "tokensUsed": 45,
    "processingTimeMs": 1250,
    "cacheHit": false,
    "filteredByPersonality": false
  },
  "fallbackUsed": false,
  "timestamp": 1702345680151
}
```

### Respuesta con Error (Bridge No Disponible)

```json
{
  "ok": false,
  "source": "error",
  "error": {
    "code": "BRIDGE_UNAVAILABLE",
    "message": "No se pudo conectar con KnockerBridge",
    "details": "Connection refused on localhost:3000"
  },
  "fallbackUsed": true,
  "fallbackText": "...",
  "timestamp": 1702345680151
}
```

### Respuesta con Timeout

```json
{
  "ok": false,
  "source": "error",
  "error": {
    "code": "TIMEOUT",
    "message": "El bridge no respondió en 5 segundos",
    "details": null
  },
  "fallbackUsed": true,
  "fallbackText": "No tengo palabras para esto.",
  "timestamp": 1702345683901
}
```

### Respuesta con Texto Rechazado

```json
{
  "ok": false,
  "source": "ollama",
  "error": {
    "code": "PERSONALITY_FILTER_REJECTED",
    "message": "El texto generado no cumple con la personalidad de El Acechador",
    "details": "Generated text was too cheerful and out of character"
  },
  "fallbackUsed": true,
  "fallbackText": "Prefiero no decir nada ahora.",
  "timestamp": 1702345680500
}
```

### Campos del Response

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `ok` | boolean | ✅ | `true` si fue exitoso, `false` si hubo error |
| `source` | string | ✅ | `"ollama"`, `"cache"`, o `"error"` |
| `text` | string | ⚠️ | Texto generado (requerido si `ok === true`) |
| `error` | object | ⚠️ | Detalles del error (requerido si `ok === false`) |
| `error.code` | string | ✅ | Código de error |
| `error.message` | string | ✅ | Mensaje descriptivo |
| `error.details` | string/null | ✅ | Detalles adicionales |
| `fallbackUsed` | boolean | ✅ | `true` si el addon debe usar fallback local |
| `fallbackText` | string | ⚠️ | Sugerencia de fallback (opcional) |
| `metadata` | object | ⚠️ | Metadatos (solo si `ok === true`) |
| `timestamp` | number | ✅ | Unix timestamp de la respuesta |

---

## 5. CÓDIGOS DE ERROR

| Código | Descripción | Acción del Addon |
|--------|-------------|-------------------|
| `BRIDGE_UNAVAILABLE` | No se pudo conectar con el bridge | Usar fallback local |
| `TIMEOUT` | El bridge no respondió a tiempo | Usar fallback local |
| `OLLAMA_ERROR` | Ollama retornó error | Usar fallback local |
| `PERSONALITY_FILTER_REJECTED` | Texto no cumple personalidad | Usar fallback local |
| `INVALID_REQUEST` | Request mal formado | Log error, usar fallback |
| `RATE_LIMIT_EXCEEDED` | Demasiados requests | Usar fallback, esperar cooldown |
| `INTERNAL_ERROR` | Error inesperado en bridge | Usar fallback local |

---

## 6. REGLAS OBLIGATORIAS DE INTEGRACIÓN

### ✅ LO QUE OLLAMA PUEDE HACER

1. **Generar texto conversacional** basado en el contexto
2. **Responder a intents desconocidos** cuando RegEx no detecta nada
3. **Ajustar tono** según bond/tier/mood
4. **Mencionar contexto** (bioma, acción reciente, memoria)

### ❌ LO QUE OLLAMA NO PUEDE HACER

1. ❌ **NO decide bond** - El addon calcula bond basado en acciones
2. ❌ **NO decide tier** - El tier depende únicamente del bond
3. ❌ **NO decide mood** - El mood se cambia por eventos del juego
4. ❌ **NO decide items** - No puede dar/quitar items al jugador
5. ❌ **NO decide spawns** - No puede spawnear entidades
6. ❌ **NO decide eventos** - No puede trigger eventos raros/logros
7. ❌ **NO decide cooldowns** - No puede modificar timers del sistema
8. ❌ **NO ejecuta comandos** - Solo genera texto para chat

### 🔒 POLÍTICA DE FALLBACK

**El addon DEBE funcionar 100% sin Ollama. Si el bridge falla:**

1. **Usar respuesta genérica local** del pool `R.desconocido[]`
2. **NO mostrar error al jugador** (silencioso)
3. **Log del error** en consola para debugging
4. **Continuar normalmente** sin degradar experiencia

---

## 7. FLUJO DE DECISIÓN EN main.js

```javascript
// Pseudocódigo del flujo de integración con WebSocket

// Conexión WebSocket global (establecida al iniciar scripts)
let wsConnection = null;
const BRIDGE_WS_URL = "ws://localhost:8000";

function initializeWebSocket() {
    try {
        wsConnection = new WebSocket(BRIDGE_WS_URL);
        
        wsConnection.onopen = () => {
            console.log("[KnockerBridge] WebSocket conectado");
        };
        
        wsConnection.onerror = (error) => {
            console.warn("[KnockerBridge] WebSocket error:", error);
            wsConnection = null; // Forzar uso de fallback
        };
        
        wsConnection.onclose = () => {
            console.warn("[KnockerBridge] WebSocket desconectado");
            wsConnection = null;
        };
    } catch (error) {
        console.warn("[KnockerBridge] No se pudo conectar:", error.message);
        wsConnection = null;
    }
}

function respondToChat(player, message) {
    // 1. Detectar intent con RegEx (SIEMPRE PRIMERO)
    const intent = detectIntent(message);
    
    // 2. Si hay intent conocido → Responder inmediatamente
    if (intent !== "desconocido") {
        const response = generateResponse(intent, player);
        player.sendMessage(response);
        return;
    }
    
    // 3. Solo si intent === "desconocido" → Intentar Ollama
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN && intent === "desconocido") {
        try {
            const context = buildContext(player);
            const payload = {
                type: "chat_fallback",
                playerName: player.name,
                message: message,
                intent: intent,
                context: context,
                timestamp: Date.now()
            };
            
            // Enviar request por WebSocket
            wsConnection.send(JSON.stringify(payload));
            
            // Configurar timeout (5 segundos)
            const timeout = setTimeout(() => {
                console.warn("[KnockerBridge] Timeout, usando fallback");
                useFallback(player);
            }, 5000);
            
            // Esperar respuesta
            wsConnection.onmessage = (event) => {
                clearTimeout(timeout);
                const response = JSON.parse(event.data);
                
                if (response.ok) {
                    player.sendMessage(response.text);
                } else {
                    console.warn("[KnockerBridge] Error:", response.error.message);
                    useFallback(player);
                }
            };
            
            return;
        } catch (error) {
            console.warn("[KnockerBridge] Error:", error.message);
            // Continuar al fallback local
        }
    }
    
    // 4. Fallback local (SIEMPRE disponible)
    useFallback(player);
}

function useFallback(player) {
    const fallbackResponse = pick(R.desconocido);
    player.sendMessage(fallbackResponse);
}
```

### Notas Importantes sobre WebSocket en Bedrock

1. **Comando `/connect`**: En Minecraft Bedrock, los addons pueden usar WebSocket vía el comando `/connect localhost:8000`
2. **Limitaciones**: 
   - Solo `localhost` permitido en desarrollo
   - Requiere que el jugador ejecute `/connect` manualmente (o el addon lo invoque)
   - No hay fetch/HTTP directo disponible en scripts de Bedrock
3. **Alternativa**: El bridge puede también exponer WebSocket directamente sin necesidad de `/connect` si se usa la API nativa de WebSocket de Bedrock

---

## 8. CONFIGURACIÓN DEL BRIDGE

El bridge será configurable vía archivo JSON:

```json
{
  "bridge": {
    "enabled": true,
    "protocol": "websocket",
    "host": "localhost",
    "port": 8000,
    "path": "/",
    "timeout": 5000,
    "retries": 2,
    "fallbackOnError": true,
    "allowedOrigins": ["minecraft://"]
  },
  "ollama": {
    "host": "localhost",
    "port": 11434,
    "model": "llama3.2",
    "temperature": 0.7,
    "maxTokens": 150,
    "systemPrompt": "Eres El Acechador, una entidad obsesiva..."
  },
  "personality": {
    "strictFiltering": true,
    "allowedThemes": ["obsession", "stalking", "mystery", "psychological horror"],
    "forbiddenThemes": ["cheerful", "helpful", "friendly", "jokes"]
  },
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "maxSize": 1000
  },
  "rateLimit": {
    "maxRequestsPerMinute": 20,
    "maxRequestsPerPlayer": 5
  }
}
```

### Notas sobre WebSocket

- **Puerto recomendado**: 8000 (diferente de HTTP estándar)
- **Protocolo**: `ws://` (no `wss://` por limitaciones de Bedrock en localhost)
- **Minecraft command**: `/connect localhost:8000` (ejecutado por el jugador o addon)
- **Alternativa nativa**: Usar API de WebSocket de Bedrock directamente sin `/connect`

---

## 9. MÉTRICAS Y MONITOREO

El bridge debe exponer métricas para monitoring:

```json
{
  "metrics": {
    "totalRequests": 1523,
    "successfulRequests": 1487,
    "failedRequests": 36,
    "cacheHits": 234,
    "cacheMisses": 1253,
    "averageResponseTimeMs": 1250,
    "p95ResponseTimeMs": 2100,
    "p99ResponseTimeMs": 3500,
    "rateLimitRejects": 12,
    "personalityFilterRejects": 8,
    "uptime": 86400000
  }
}
```

---

## 10. ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Infraestructura Base (Sin Ollama)
- [x] Addon funcional 100% standalone
- [x] Sistema de RegEx completo
- [x] Fallbacks locales robustos
- [ ] Documentación de contrato (este documento)

### Fase 2: KnockerBridge Standalone
- [ ] Crear proyecto Node.js separado
- [ ] Implementar servidor WebSocket (puerto 8000)
- [ ] Implementar módulos del bridge (9 componentes)
- [ ] Tests unitarios del bridge
- [ ] Integración con Ollama local

### Fase 3: Integración Addon ↔ Bridge
- [ ] Agregar cliente WebSocket en main.js
- [ ] Manejar conexión/desconexión automática
- [ ] Implementar envío/recepción de mensajes JSON
- [ ] Manejar timeouts y errores
- [ ] Tests de integración

### Fase 4: Optimización y Producción
- [ ] Cache distribuido
- [ ] Rate limiting inteligente
- [ ] Monitoreo y métricas vía WebSocket
- [ ] Documentación de deployment
- [ ] Manejo de reconexión automática

---

## 11. CONCLUSIÓN

Este contrato define una integración **limpia, segura y opcional** entre el addon y Ollama.

**Principios Clave**:
- ✅ Ollama es un **plus**, no un requisito
- ✅ El addon **siempre funciona** sin Ollama
- ✅ Ollama **solo genera texto**, no controla gameplay
- ✅ Arquitectura **modular y testeable**

**Estado del Contrato**: 📋 DISEÑO COMPLETO - Listo para implementación

---

**Documento creado**: Diciembre 2024  
**Versión**: 1.0.0  
**Mantenedor**: Equipo de desarrollo The Obsessed Knocker
