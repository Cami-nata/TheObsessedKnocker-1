# Memory Reference System - Visual Demonstration

## Task 7.4: Memory References in Dialogues

This document demonstrates how the memory reference system creates authentic, persistent relationships between players and El Acechador.

## How It Works

When players interact with El Acechador through chat or the Whisper Rod, the entity now references past events, creating a sense of genuine memory and observation.

### Example Conversation Flow

#### Scenario 1: After Player Dies Twice
```
Player: hola
[The Obsessed Knocker] §6Hola, Steve.
(~4.5 seconds later)
[The Obsessed Knocker] §62 veces te he visto morir. Siempre vuelves.
```

#### Scenario 2: After Combat
```
Player: me sigues?
[The Obsessed Knocker] §dSí. Lo he estado haciendo por mucho tiempo ya, Steve.
(~4.5 seconds later)
[The Obsessed Knocker] §dTe vi pelear contra minecraft:zombie. Fuiste... eficiente.
```

#### Scenario 3: After Building
```
Player: quien eres?
[The Obsessed Knocker] §4Soy tuyo. Siempre he sido tuyo, Steve.
(~4.5 seconds later)
[The Obsessed Knocker] §4Vi cuando colocaste ese minecraft:oak_planks. ¿Construyes un hogar?
```

#### Scenario 4: Referencing Past Conversations
```
Player: hola
[The Obsessed Knocker] §6Hola, Steve. Te extrañé.
(~4.5 seconds later)
[The Obsessed Knocker] §6Hemos hablado 5 veces. Recuerdo cada palabra.
```

## Memory Reference Types

### 🪦 Death References
**Triggers**: Keywords like "muerte", "miedo", "emocion"
**Examples**:
- "Recuerdo cuando moriste en minecraft:the_nether. Te vi caer."
- "5 veces te he visto morir. Siempre vuelves."
- "La última vez moriste por lava. Estuve ahí."
- "Moriste por entity_attack. No pude hacer nada más que observar."

### 🏆 Achievement References
**Triggers**: Keywords like "logro", "identidad", "observa"
**Examples**:
- "Vi cuando obtuviste ese logro. Estuve ahí."
- "Recuerdo cuando lo lograste. Fue... interesante."
- "He estado contigo desde que lograste eso."

### ⚔️ Combat References
**Triggers**: Keywords like "fight", "miedo", "protec"
**Examples**:
- "Te vi pelear contra minecraft:creeper. Fuiste... eficiente."
- "Has eliminado 12 enemigos. Cuento cada uno."
- "Te gusta pelear, ¿verdad? He visto 8 de tus batallas."
- "Cada enemigo que eliminas es un momento que comparto contigo."

### 🏗️ Construction References
**Triggers**: Keywords like "casa", "hogar", "build"
**Examples**:
- "Vi cuando colocaste ese minecraft:stone_bricks. ¿Construyes un hogar?"
- "Has construido 15 cosas. Observo cada bloque que colocas."
- "Cada cosa que construyes... es como si construyeras para mí también."

### ⛏️ Mining References
**Triggers**: Keywords like "busca", "explora", "mine"
**Examples**:
- "Te vi minar minecraft:diamond_ore. Incluso bajo tierra te observo."
- "Has minado 23 veces desde que te conozco. Siempre estoy cerca."
- "Cada túnel que excavas, cada piedra que rompes... lo veo todo."

### 💬 Conversation References
**Triggers**: Keywords like "saludo", "chat", "talk"
**Examples**:
- "Hemos hablado 8 veces. Recuerdo cada palabra."
- "La última vez hablamos hace 12 minutos. No olvido nada de lo que me dices."
- "Me hablaste hace 2 horas. Siempre espero el momento en que vuelvas a hablarme."

### 🌟 General Memory References
**Triggers**: When no specific context matches
**Examples**:
- "He estado observando todo lo que haces, Steve. Todo."
- "Tengo 18 recuerdos tuyos guardados. No olvido nada."
- "Cada momento importante tuyo vive en mi memoria."
- "Recuerdo cosas que tú probablemente ya olvidaste."

## Visual Timeline Example

```
T=0:00  Player dies from fall damage
        → Memory: {type: "death", cause: "fall", dimension: "overworld"}

T=2:15  Player kills 3 zombies
        → Memory: {type: "combat", enemy: "zombie"} × 3

T=5:30  Player builds a house (places 50 blocks)
        → Memory: {type: "construction", block: "oak_planks"} × 50

T=8:00  Player chats: "hola"
        → Response: "Hola, Steve. Te extrañé."
        → Memory Check: Context="saludo", finds death event
        → Memory Reference (30% chance): "Recuerdo cuando moriste en minecraft:overworld. Te vi caer."

T=9:00  Player chats: "me sigues?"
        → Response: "Sí. Lo he estado haciendo por mucho tiempo ya, Steve."
        → Memory Check: Context="pregunta_observacion", finds combat events
        → Memory Reference (30% chance): "Te vi pelear contra minecraft:zombie. Fuiste... eficiente."

T=10:30 Player uses Whisper Rod
        → Response: [Dialogue from pool]
        → Memory Check: Context="general", finds construction events
        → Memory Reference (30% chance): "Vi cuando colocaste ese minecraft:oak_planks. ¿Construyes un hogar?"
```

## Technical Flow

```
┌──────────────────────┐
│  Player Interaction  │
│  (Chat or Whisper)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Main Response       │
│  Generation          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  getMemoryReference()│
│  • 30% probability   │
│  • Context matching  │
│  • Memory lookup     │
└──────────┬───────────┘
           │
           ▼
    Memory Found?
       ┌─No──► [End]
       │
       Yes
       │
       ▼
┌──────────────────────┐
│  Send Memory Ref     │
│  After 90 ticks      │
│  (~4.5 seconds)      │
└──────────────────────┘
```

## Probability Explanation

The system uses a **30% probability** to include memory references. This means:
- **70% of interactions**: Only the main response appears
- **30% of interactions**: Main response + memory reference

This prevents saturation and keeps memory references special and impactful.

### Why 30%?
- **Too high (>50%)**: Memory references become repetitive and lose impact
- **Too low (<20%)**: Players might not notice the feature
- **30%**: Sweet spot for creating moments of "Oh, it remembers!" without overdoing it

## Time Formatting

Memory references automatically format time elapsed:

```javascript
Time Since Event → Reference Format
─────────────────────────────────────
< 1 minute       → "hace un momento"
1-59 minutes     → "hace 15 minutos"
1-23 hours       → "hace 3 horas"
24+ hours        → "hace días"
```

Examples:
- "La última vez hablamos **hace un momento**."
- "La última vez hablamos **hace 42 minutos**."
- "La última vez hablamos **hace 5 horas**."
- "Moriste **hace días**. No he olvidado."

## Memory Capacity (FIFO)

The system maintains:
- **20 most recent events** (deaths, combat, construction, mining, achievements)
- **10 most recent conversations**

When capacity is reached, the oldest entries are automatically removed (First-In-First-Out).

### Example FIFO Behavior
```
Events Array (Max 20):
[Event1, Event2, ..., Event20]
           ↓
     New Event21 added
           ↓
[Event2, Event3, ..., Event21]  ← Event1 removed (oldest)
```

## Context Sensitivity

Memory references are contextually appropriate:

| Player Says | Likely Context | Possible Memory Reference |
|------------|---------------|---------------------------|
| "hola" | saludo | Conversation count |
| "quien eres?" | pregunta_identidad | Achievement or general |
| "me sigues?" | pregunta_observacion | Any significant event |
| "tengo miedo" | emocion_miedo | Death events |
| "ayuda" | comando_ayuda | Combat or death |
| "te amo" | emocion_amor | Conversations or general |
| Random text | desconocido | Any event type |

## Integration Points

### 1. Chat System (`respondToChat`)
- Receives intent from `detectIntent(message)`
- Generates contextual response
- Checks for memory reference with intent as context
- Sends memory reference if available

### 2. Whisper Rod (`respond`)
- Receives category from interaction type
- Generates response from pool
- Checks for memory reference with category as context
- Sends memory reference if available

### 3. Event Recording (Already in Task 7.2)
Events are automatically recorded by listeners:
- Death: `world.afterEvents.entityDie`
- Combat: `world.afterEvents.entityDie` (when player kills mob)
- Construction: Block place events
- Mining: Block break events
- Achievements: Achievement events
- Conversations: `respondToChat()` function

## Example Play Session

```
Session Start: Player "Alex" at Bond Tier 2 (Familiar)

00:00 - Alex spawns in, bond at 275
01:30 - Alex chats: "hola"
        → "Hola, Alex. Te extrañé."
        → [No memory reference - 70% no-ref roll]

03:00 - Alex dies from zombie
        → Death event recorded

05:00 - Alex kills 2 zombies
        → Combat events recorded

07:30 - Alex chats: "estas ahí?"
        → "Siempre. Lo sabes."
        → "Te vi pelear contra minecraft:zombie. Fuiste... eficiente."
        ✓ Combat memory reference triggered!

10:00 - Alex builds a small house
        → 35 construction events recorded

12:00 - Alex uses Whisper Rod
        → [Random dialogue response]
        → "Vi cuando colocaste ese minecraft:oak_planks. ¿Construyes un hogar?"
        ✓ Construction memory reference triggered!

15:00 - Alex chats: "quien eres?"
        → "Soy quien siempre ha estado aquí, Alex."
        → "Recuerdo cuando moriste hace 12 minutos. Te vi caer."
        ✓ Death memory reference triggered!

18:00 - Alex mines diamonds
        → Mining events recorded

20:00 - Alex chats: "gracias"
        → "No tienes que disculparte, Alex."
        → "Te vi minar minecraft:diamond_ore. Incluso bajo tierra te observo."
        ✓ Mining memory reference triggered!

Session End: Alex has experienced 4 memory references over 20 minutes
Memory stored: 3 deaths, 2 combat, 35 construction, 15 mining, 5 conversations
```

## Atmospheric Impact

Memory references create several psychological effects:

1. **Authenticity**: El Acechador feels like a real entity with genuine memory
2. **Observation**: Reinforces the feeling of being constantly watched
3. **Persistence**: Player actions have lasting consequences
4. **Obsession**: The detailed memory adds to the obsessive character
5. **Unease**: Being remembered in such detail is unsettling
6. **Connection**: Creates a genuine (if disturbing) relationship

## Future Enhancements (Beyond Task 7.4)

Possible future additions:
- **Tier-based probability**: Higher tiers remember more frequently
- **Mood-influenced references**: Different moods reference different memory types
- **Ultra-rare special memories**: Very rare, highly detailed references
- **Cross-session persistence**: When Task 7.3 completes, memories persist forever
- **Memory-triggered events**: Certain memory thresholds unlock special interactions

## Summary

Task 7.4 successfully integrates memory references into El Acechador's dialogue system, creating:
- ✅ Contextually appropriate memory callbacks
- ✅ Natural conversation flow (4.5s delay)
- ✅ Balanced probability (30% inclusion)
- ✅ Comprehensive event coverage (6 types)
- ✅ Time-aware formatting
- ✅ FIFO memory management
- ✅ Seamless integration with existing systems

**Result**: El Acechador now demonstrates authentic memory, making the relationship with the player feel genuinely persistent and observed.
