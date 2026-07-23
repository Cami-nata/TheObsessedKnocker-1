# Tarea 10.3: Diagrama de Flujo del Sistema Weeping Angel

## Flujo de Ejecución Principal

```
┌─────────────────────────────────────────────────────────────────┐
│                   BUCLE PRINCIPAL (cada 10s)                     │
│                  updateAllKnockerBehaviors()                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Por cada jugador + Knocker activo                   │
│            applyTierBehaviorAdjustments(knocker, player, tier)   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  applyStalkingBehavior()                         │
│              (Lógica de visibilidad por intensidad)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            🆕 applyWeepingAngelEffect()                          │
│         (Sistema de ocultamiento basado en mirada)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
        ┌─────────────────┐   ┌─────────────────┐
        │  JUGADOR MIRA   │   │ JUGADOR NO MIRA │
        │   AL KNOCKER    │   │   AL KNOCKER    │
        └────────┬────────┘   └────────┬────────┘
                 │                     │
                 ▼                     ▼
```

## Detalle del Sistema isPlayerLookingAtKnocker()

```
┌─────────────────────────────────────────────────────────────────┐
│          isPlayerLookingAtKnocker(player, knocker)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Calcular distancia   │
                  │ jugador → knocker    │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Distancia > 64?     │
                  └──────────┬───────────┘
                      SÍ ┌───┴───┐ NO
                         │       │
                         ▼       ▼
                  ┌──────────┐ ┌─────────────────────┐
                  │ return   │ │ Calcular producto   │
                  │  false   │ │ punto (dot product) │
                  └──────────┘ └─────────┬───────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │ dotProduct > 0.88?   │
                              │ (ángulo < 28°)       │
                              └──────────┬───────────┘
                                   NO ┌──┴──┐ SÍ
                                      │     │
                                      ▼     ▼
                               ┌──────────┐ ┌─────────────────┐
                               │ return   │ │ Distancia < 32? │
                               │  false   │ └────────┬────────┘
                               └──────────┘     NO ┌─┴─┐ SÍ
                                                   │   │
                                                   ▼   ▼
                                            ┌──────────┐ ┌──────────────┐
                                            │ return   │ │ Verificar    │
                                            │  true    │ │ línea vista  │
                                            └──────────┘ └──────┬───────┘
                                                                │
                                                                ▼
                                                         ┌──────────────┐
                                                         │ return result│
                                                         └──────────────┘
```

## Detalle del Sistema applyWeepingAngelEffect()

```
┌─────────────────────────────────────────────────────────────────┐
│         applyWeepingAngelEffect(knocker, targetPlayer)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ isPlayerLookingAtKnocker()?  │
              └──────────┬───────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
    ┌──────────────────┐   ┌──────────────────┐
    │   JUGADOR MIRA   │   │ JUGADOR NO MIRA  │
    └─────────┬────────┘   └─────────┬────────┘
              │                      │
              ▼                      ▼
┌─────────────────────────┐ ┌──────────────────────────┐
│ ACCIONES DE OCULTAMIENTO│ │ ACCIONES DE REVELACIÓN   │
├─────────────────────────┤ ├──────────────────────────┤
│ ✓ Aplicar invisibilidad │ │ ✓ Remover invisibilidad  │
│   (2 segundos)          │ │                          │
│ ✓ Add tag:              │ │ ✓ Add tag:               │
│   - being_watched       │ │   - weeping_angel_moving │
│   - weeping_angel_frozen│ │ ✓ Remove tags:           │
│ ✓ Remove tag:           │ │   - being_watched        │
│   - weeping_angel_moving│ │   - weeping_angel_frozen │
│ ✓ Velocidad → 0.05x     │ │ ✓ Velocidad → 1.0x       │
│   (casi congelado)      │ │   (normal)               │
│ ✓ Registrar evento en   │ │                          │
│   memoria (cooldown 1m) │ │                          │
└─────────────────────────┘ └──────────────────────────┘
```

## Integración con Sistema de Tiers

```
┌──────────────────────────────────────────────────────────────────┐
│                    TIER CONFIGURATION                            │
├──────────────────────────────────────────────────────────────────┤
│ Tier 0 (Stranger):   stalkingIntensity = 0.10 (10% visible)     │
│ Tier 1 (Watched):    stalkingIntensity = 0.25 (25% visible)     │
│ Tier 2 (Familiar):   stalkingIntensity = 0.50 (50% visible)     │
│ Tier 3 (Obsessed):   stalkingIntensity = 0.75 (75% visible)     │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │ applyStalkingBehavior() aplica:     │
         │ 1. Weeping Angel Effect (prioridad) │
         │ 2. Intensidad base (si WA inactivo) │
         └─────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │ RESULTADO FINAL:                    │
         │ • Si jugador mira → INVISIBLE       │
         │ • Si no mira → Intensidad por tier  │
         └─────────────────────────────────────┘
```

## Cálculo del Producto Punto (Dot Product)

```
Jugador en (Px, Py, Pz) mirando hacia (Vx, Vy, Vz)
Knocker en (Kx, Ky, Kz)

Vector hacia Knocker:
  T = (Kx - Px, Ky - Py, Kz - Pz)

Vector normalizado:
  Tn = T / |T|

Producto punto:
  dot = Vx·Tnx + Vy·Tny + Vz·Tnz

Interpretación:
  dot =  1.0  → Misma dirección exacta (0°)
  dot =  0.88 → Umbral de detección (~28°)
  dot =  0.0  → Perpendicular (90°)
  dot = -1.0  → Opuesto (180°)

┌────────────────────────────────────────────┐
│        CONO DE VISIÓN (28° aprox)          │
│                                            │
│              Knocker detectado             │
│                    ╱│╲                     │
│                   ╱ │ ╲                    │
│                  ╱  │  ╲                   │
│                 ╱   │   ╲                  │
│                ╱    │    ╲                 │
│               ╱     │     ╲                │
│              ╱      │      ╲               │
│             ╱   28° │ 28°   ╲              │
│            ╱        │        ╲             │
│           ╱         │         ╲            │
│          ╱          │          ╲           │
│         ─ ─ ─ ─ ─ ─ P ─ ─ ─ ─ ─ ─         │
│              (Jugador mirando ↑)           │
│                                            │
│  Fuera del cono = Knocker NO detectado    │
└────────────────────────────────────────────┘
```

## Timeline de Eventos

```
Tiempo (t)     Estado del Knocker           Acción del Jugador
────────────────────────────────────────────────────────────────
t=0s           VISIBLE, moviéndose          Jugador no mira
t=5s           VISIBLE, moviéndose          Jugador no mira
t=10s          VISIBLE, moviéndose          Jugador GIRA y mira →
t=10s          🔄 ACTUALIZACIÓN             ↓
t=10s          INVISIBLE, congelado         Jugador mirando
t=15s          INVISIBLE, congelado         Jugador mirando
t=20s          🔄 ACTUALIZACIÓN             Jugador mirando
t=20s          INVISIBLE, congelado         ↓
t=22s          INVISIBLE, congelado         Jugador DESVÍA mirada ←
t=30s          🔄 ACTUALIZACIÓN             ↓
t=30s          VISIBLE, moviéndose          Jugador no mira
t=35s          VISIBLE, moviéndose          Jugador no mira
t=40s          🔄 ACTUALIZACIÓN             Jugador no mira
t=40s          VISIBLE, moviéndose          Jugador no mira

🔄 = Ciclo de actualización (cada 10 segundos)
```

## Eventos de Memoria Registrados

```
┌─────────────────────────────────────────────────────────────┐
│              EVENTO: caught_knocker_looking                 │
├─────────────────────────────────────────────────────────────┤
│ type: "caught_knocker_looking"                              │
│ timestamp: 1735678934521 (milisegundos desde epoch)         │
│ details: {                                                  │
│   location: { x: 123.4, y: 65.0, z: -456.7 },              │
│   dimension: "minecraft:overworld",                         │
│   timestamp: 1735678934521                                  │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘

Cooldown: 60000ms (1 minuto)
Uso futuro: Diálogos contextuales como "Recuerdo cuando me viste 
            esa vez en las llanuras..."
```

## Prioridad de Sistemas

```
┌──────────────────────────────────────────┐
│         PRIORIDAD 1 (Mayor)              │
│    🆕 Weeping Angel Effect               │
│    (Mirada del jugador)                  │
└──────────────┬───────────────────────────┘
               │ Si NO está siendo mirado...
               ▼
┌──────────────────────────────────────────┐
│         PRIORIDAD 2                      │
│    Intensidad de Acecho por Tier         │
│    (Probabilidad de visibilidad)         │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│         PRIORIDAD 3 (Menor)              │
│    Comportamiento Base del Knocker       │
│    (Pathfinding, targetting, etc.)       │
└──────────────────────────────────────────┘
```

## Notas de Diseño

### ¿Por qué 28 grados?
- 28° es un cono relativamente estrecho
- Requiere que el jugador realmente "mire" al Knocker
- No es tan restrictivo como 10° (muy difícil)
- No es tan amplio como 45° (demasiado fácil)
- Balance entre jugabilidad y realismo

### ¿Por qué actualizar cada 10 segundos?
- Balance entre rendimiento y responsividad
- 10 segundos es frecuente pero no excesivo
- Los efectos (invisibilidad) duran 2 segundos
- Se reaplican en cada ciclo para mantener consistencia

### ¿Por qué velocidad 0.05x y no 0.0x?
- 0.0x podría causar bugs en el sistema de pathfinding
- 0.05x es prácticamente inmóvil pero técnicamente válido
- Permite que el Knocker mantenga animaciones idle
- Previene comportamientos extraños del motor de juego
