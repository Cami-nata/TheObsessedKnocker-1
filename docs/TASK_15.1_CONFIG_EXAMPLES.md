# Ejemplos de Configuración - The Obsessed Knocker

## Introducción

Este documento proporciona ejemplos de archivos de configuración JSON para personalizar el comportamiento de The Obsessed Knocker. Todos los ejemplos son configuraciones válidas que pueden ser parseadas por el sistema implementado en la Tarea 15.1.

---

## Ejemplo 1: Configuración Por Defecto

Esta es la configuración estándar del addon con todos los valores por defecto.

```json
{
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
}
```

**Características:**
- Vínculo comienza en 0
- Progresión de vínculo normal (multiplicador 1.0)
- Tiers estándar: 0-99, 100-249, 250-399, 400-500
- Cooldown de chat de 30 segundos
- Probabilidades de respuesta estándar por tier
- Eventos raros con probabilidades equilibradas

---

## Ejemplo 2: Modo "Vínculo Rápido"

Configuración para jugadores que quieren alcanzar obsesión más rápidamente.

```json
{
  "bondSystem": {
    "initialBond": 50,
    "bondMultiplier": 2.0,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 15,
    "responseProbabilities": {
      "tier0": 0.30,
      "tier1": 0.50,
      "tier2": 0.70,
      "tier3": 0.90
    },
    "enableNicknameSystem": true
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.10,
    "baseUltraRareDialogueProbability": 0.03,
    "specialAppearanceProbability": 0.015,
    "secretInteractionProbability": 0.02,
    "bonusProbabilityAfter50Hours": 0.01,
    "bonusProbabilityTier3": 0.02,
    "enableEventTracking": true
  }
}
```

**Cambios respecto al defecto:**
- ✨ Vínculo inicial: 50 (comienza con algo de familiaridad)
- ✨ Multiplicador de vínculo: 2.0 (progresión doble de rápida)
- ✨ Cooldown de chat reducido: 15s (más conversaciones)
- ✨ Probabilidades de respuesta aumentadas (+10% en cada tier)
- ✨ Eventos raros duplicados en frecuencia
- ✨ Bonos de probabilidad aumentados

**Ideal para:**
- Primera experiencia con el addon
- Jugadores con tiempo limitado
- Modo "historia acelerada"
- Testing y debugging

---

## Ejemplo 3: Modo "Slow Burn" (Quemado Lento)

Configuración para una experiencia de horror psicológico más lenta e inquietante.

```json
{
  "bondSystem": {
    "initialBond": 0,
    "bondMultiplier": 0.5,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 60,
    "responseProbabilities": {
      "tier0": 0.10,
      "tier1": 0.25,
      "tier2": 0.50,
      "tier3": 0.75
    },
    "enableNicknameSystem": true
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.03,
    "baseUltraRareDialogueProbability": 0.008,
    "specialAppearanceProbability": 0.004,
    "secretInteractionProbability": 0.005,
    "bonusProbabilityAfter50Hours": 0.003,
    "bonusProbabilityTier3": 0.008,
    "enableEventTracking": true
  }
}
```

**Cambios respecto al defecto:**
- 🐌 Multiplicador de vínculo: 0.5 (progresión más lenta)
- 🐌 Cooldown de chat aumentado: 60s (menos conversaciones, más inquietante)
- 🐌 Probabilidades de respuesta reducidas (-10% en tiers 0-2, -5% en tier 3)
- 🐌 Eventos raros más raros (aproximadamente mitad de frecuencia)
- 🐌 Bonos de probabilidad reducidos

**Ideal para:**
- Jugadores experimentados buscando desafío
- Experiencia de horror atmosférico
- Playthroughs largos (100+ horas)
- Máxima tensión psicológica

---

## Ejemplo 4: Modo "Obsesión Instantánea"

Configuración extrema donde El Acechador comienza ya obsesionado.

```json
{
  "bondSystem": {
    "initialBond": 400,
    "bondMultiplier": 3.0,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 10,
    "responseProbabilities": {
      "tier0": 0.50,
      "tier1": 0.70,
      "tier2": 0.85,
      "tier3": 0.95
    },
    "enableNicknameSystem": true
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.15,
    "baseUltraRareDialogueProbability": 0.05,
    "specialAppearanceProbability": 0.025,
    "secretInteractionProbability": 0.03,
    "bonusProbabilityAfter50Hours": 0.02,
    "bonusProbabilityTier3": 0.03,
    "enableEventTracking": false
  }
}
```

**Cambios respecto al defecto:**
- 🔥 Vínculo inicial: 400 (comienza en Tier 3 - Obsessed!)
- 🔥 Multiplicador de vínculo: 3.0 (alcanza máximo rápidamente)
- 🔥 Cooldown de chat mínimo: 10s (conversaciones casi constantes)
- 🔥 Probabilidades de respuesta máximas (hasta 95% en tier 3)
- 🔥 Eventos raros MUY frecuentes (3x más que defecto)
- 🔥 Event tracking deshabilitado (permite repetición de eventos raros)

**Ideal para:**
- Testing de contenido de tier 3
- Experiencia "caótica"
- Showcase de eventos raros
- Modo "pesadilla"

**⚠️ Advertencia:** Esta configuración puede ser abrumadora y reducir la tensión psicológica al hacer las interacciones demasiado frecuentes.

---

## Ejemplo 5: Modo "Sin Apodos" (Formal)

Configuración donde El Acechador mantiene distancia y no usa apodos personalizados.

```json
{
  "bondSystem": {
    "initialBond": 0,
    "bondMultiplier": 0.8,
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
      "tier0": 0.15,
      "tier1": 0.35,
      "tier2": 0.55,
      "tier3": 0.75
    },
    "enableNicknameSystem": false
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
}
```

**Cambios respecto al defecto:**
- 📜 Multiplicador de vínculo: 0.8 (progresión ligeramente más lenta)
- 📜 Cooldown de chat aumentado: 45s
- 📜 Probabilidades de respuesta reducidas (-5% en cada tier)
- 📜 **Sistema de apodos DESHABILITADO** (usa siempre el nombre real del jugador)

**Ideal para:**
- Atmósfera más formal y distante
- Jugadores que prefieren ser llamados por su nombre
- Roleplay específico
- Mayor sensación de "observador impersonal"

---

## Ejemplo 6: Modo "Cazador de Eventos Raros"

Configuración optimizada para experimentar todos los eventos raros del addon.

```json
{
  "bondSystem": {
    "initialBond": 100,
    "bondMultiplier": 2.5,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 20,
    "responseProbabilities": {
      "tier0": 0.25,
      "tier1": 0.45,
      "tier2": 0.65,
      "tier3": 0.85
    },
    "enableNicknameSystem": true
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.20,
    "baseUltraRareDialogueProbability": 0.10,
    "specialAppearanceProbability": 0.05,
    "secretInteractionProbability": 0.08,
    "bonusProbabilityAfter50Hours": 0.05,
    "bonusProbabilityTier3": 0.10,
    "enableEventTracking": false
  }
}
```

**Cambios respecto al defecto:**
- 🎲 Vínculo inicial: 100 (comienza en Tier 1)
- 🎲 Multiplicador de vínculo: 2.5 (alcanza tier 3 rápidamente)
- 🎲 Eventos raros EXTREMADAMENTE frecuentes:
  - Diálogos raros: 20% (4x más)
  - Diálogos ultra-raros: 10% (6.6x más)
  - Apariciones especiales: 5% (7x más)
  - Interacciones secretas: 8% (8x más)
- 🎲 Bonos de probabilidad aumentados (5x-10x)
- 🎲 Event tracking deshabilitado (eventos raros pueden repetirse)

**Ideal para:**
- Completar catálogo de eventos raros
- Content creators / streamers
- Testing de contenido raro
- Experiencia "caótica máxima"

**⚠️ Advertencia:** Los eventos raros pierden su "rareza" con esta configuración. Recomendado solo para propósitos específicos.

---

## Ejemplo 7: Modo "Equilibrado Competitivo"

Configuración balanceada para experiencia consistente en multiplayer.

```json
{
  "bondSystem": {
    "initialBond": 25,
    "bondMultiplier": 1.2,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 25,
    "responseProbabilities": {
      "tier0": 0.25,
      "tier1": 0.45,
      "tier2": 0.65,
      "tier3": 0.85
    },
    "enableNicknameSystem": true
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.08,
    "baseUltraRareDialogueProbability": 0.02,
    "specialAppearanceProbability": 0.01,
    "secretInteractionProbability": 0.015,
    "bonusProbabilityAfter50Hours": 0.008,
    "bonusProbabilityTier3": 0.015,
    "enableEventTracking": true
  }
}
```

**Cambios respecto al defecto:**
- ⚖️ Vínculo inicial: 25 (pequeño boost inicial)
- ⚖️ Multiplicador de vínculo: 1.2 (progresión ligeramente más rápida)
- ⚖️ Cooldown de chat reducido: 25s (más interactivo)
- ⚖️ Probabilidades de respuesta aumentadas (+5% en cada tier)
- ⚖️ Eventos raros moderadamente aumentados (1.5x-2x)

**Ideal para:**
- Servidores multiplayer
- Experiencia consistente entre jugadores
- Balance entre progresión y contenido raro
- Playthroughs de duración media (20-50 horas)

---

## Ejemplo 8: Modo "Minimalista"

Configuración para experimentar el addon con mínima interferencia.

```json
{
  "bondSystem": {
    "initialBond": 0,
    "bondMultiplier": 0.3,
    "tierThresholds": {
      "stranger": 0,
      "watched": 100,
      "familiar": 250,
      "obsessed": 400
    },
    "maxBond": 500
  },
  "chatSystem": {
    "cooldownSeconds": 120,
    "responseProbabilities": {
      "tier0": 0.05,
      "tier1": 0.15,
      "tier2": 0.30,
      "tier3": 0.60
    },
    "enableNicknameSystem": false
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.02,
    "baseUltraRareDialogueProbability": 0.005,
    "specialAppearanceProbability": 0.002,
    "secretInteractionProbability": 0.003,
    "bonusProbabilityAfter50Hours": 0.001,
    "bonusProbabilityTier3": 0.005,
    "enableEventTracking": true
  }
}
```

**Cambios respecto al defecto:**
- 🔇 Multiplicador de vínculo: 0.3 (progresión MUY lenta)
- 🔇 Cooldown de chat: 120s (2 minutos - mínimas conversaciones)
- 🔇 Probabilidades de respuesta muy bajas (tier 0 casi nunca responde)
- 🔇 Eventos raros extremadamente raros (2x-5x más raros que defecto)
- 🔇 Sistema de apodos deshabilitado
- 🔇 Bonos de probabilidad mínimos

**Ideal para:**
- Jugadores que quieren "presencia sutil"
- Construcción/survival sin muchas interrupciones
- Experiencia de "observador silencioso"
- Máxima duración para alcanzar tier 3 (200+ horas)

**Nota:** Con esta configuración, El Acechador será extremadamente pasivo en tiers bajos.

---

## Ejemplo 9: Modo "Customizado Avanzado"

Configuración ejemplo con ajustes finos personalizados.

```json
{
  "bondSystem": {
    "initialBond": 75,
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
    "cooldownSeconds": 22,
    "responseProbabilities": {
      "tier0": 0.28,
      "tier1": 0.48,
      "tier2": 0.68,
      "tier3": 0.88
    },
    "enableNicknameSystem": true
  },
  "rareEventsSystem": {
    "baseRareDialogueProbability": 0.075,
    "baseUltraRareDialogueProbability": 0.022,
    "specialAppearanceProbability": 0.012,
    "secretInteractionProbability": 0.018,
    "bonusProbabilityAfter50Hours": 0.008,
    "bonusProbabilityTier3": 0.015,
    "enableEventTracking": true
  }
}
```

**Características:**
- Valores finamente ajustados para experiencia específica
- Vínculo inicial en tier 0 alto (75 puntos)
- Progresión moderadamente acelerada (1.5x)
- Cooldown de chat ajustado a 22 segundos (sweet spot entre 15-30)
- Probabilidades incrementadas en pasos de 8% por tier
- Eventos raros con frecuencias intermedias personalizadas

**Ideal para:**
- Jugadores con preferencias muy específicas
- Ajuste fino después de experimentar con otras configuraciones
- Balanceo personalizado para estilo de juego único

---

## Cómo Usar Estos Ejemplos

### En Minecraft (usando el parser)

1. Copia uno de los ejemplos anteriores
2. Guarda el JSON en un archivo o úsalo directamente en código
3. En el juego, usa el parser implementado:

```javascript
// Ejemplo dentro del addon
const configJson = `{ ... }`;  // Pegar configuración aquí
const result = parseConfig(configJson);

if (result.success) {
    console.log("✓ Configuración cargada correctamente");
    // Aplicar configuración al addon
} else {
    console.error("✗ Error:", result.error.toString());
}
```

### Testing

Usa el comando `.configtest` en el juego para probar que el parser funciona correctamente.

### Personalización

Puedes mezclar y combinar valores de diferentes ejemplos para crear tu configuración ideal:

- Toma `bondMultiplier` de "Vínculo Rápido"
- Toma `cooldownSeconds` de "Slow Burn"
- Toma probabilidades de eventos de "Equilibrado"
- Ajusta valores finamente según tu preferencia

---

## Notas Importantes

### Rangos Válidos

Asegúrate de que tus valores personalizados estén dentro de los rangos permitidos:

**bondSystem:**
- `initialBond`: 0-500
- `bondMultiplier`: 0.1-10.0
- `tierThresholds.*`: Según tier (ver esquema)
- `maxBond`: 100-1000

**chatSystem:**
- `cooldownSeconds`: 5-300
- `responseProbabilities.*`: 0.0-1.0

**rareEventsSystem:**
- Todas las probabilidades: 0.0-1.0

### Valores Recomendados

**Para progresión equilibrada:**
- `bondMultiplier`: 0.8-1.5
- `cooldownSeconds`: 20-40
- `responseProbabilities`: Incrementos de 15-25% por tier

**Para eventos raros:**
- `baseRareDialogueProbability`: 0.03-0.10 (3-10%)
- `baseUltraRareDialogueProbability`: 0.01-0.03 (1-3%)
- `specialAppearanceProbability`: 0.005-0.015 (0.5-1.5%)

### Conflictos y Consideraciones

- **`enableEventTracking: false`** permite repetición de eventos raros, pero puede hacer que pierdan su "rareza"
- **`cooldownSeconds` muy bajo** (<10s) puede ser spam y romper la inmersión
- **`bondMultiplier` muy alto** (>3.0) puede hacer que alcances tier 3 demasiado rápido
- **`responseProbabilities` muy altas** (>0.95) eliminan la incertidumbre

---

## Conclusión

Estos ejemplos cubren una amplia gama de estilos de juego y preferencias. Puedes usar uno tal cual o usarlos como base para crear tu configuración personalizada perfecta.

**Recomendación:** Comienza con la configuración por defecto o "Equilibrado Competitivo", juega algunas horas, y luego ajusta según tu experiencia.

¡Experimenta y encuentra tu configuración ideal para The Obsessed Knocker!
