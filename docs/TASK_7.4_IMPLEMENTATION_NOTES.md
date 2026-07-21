# Task 7.4 Implementation Notes: Memory References in Dialogues

## Overview
Task 7.4 implements the integration of memory references into El Acechador's dialogues, allowing the entity to reference past events, conversations, deaths, combat, construction, and other significant player actions during interactions.

## Implementation Status: ✅ COMPLETE

## What Was Implemented

### 1. Memory Reference Function (`getMemoryReference`)
The function `getMemoryReference(player, context)` was already fully implemented with comprehensive logic covering:
- **Death Events**: References to player deaths, causes, dimensions, and death counts
- **Achievements**: References to unlocked achievements 
- **Combat Events**: References to battles, enemy types eliminated, combat counts
- **Construction Events**: References to building activities and block placements
- **Mining Events**: References to mining activities and resources found
- **Conversations**: References to past chats, conversation counts, and time since last interaction
- **General References**: Fallback references when no specific context matches

### 2. Integration into `respondToChat()` Function
**Location**: `main.js` - Chat response system

**What was added**:
```javascript
// INTEGRACIÓN DE REFERENCIAS A MEMORIA (Task 7.4)
// Intentar obtener una referencia relevante a eventos pasados
const memoryRef = getMemoryReference(player, intent);

if (memoryRef) {
    // Enviar la referencia a memoria después de la respuesta principal
    // Delay de 90 ticks (~4.5 segundos) para que aparezca después de la respuesta
    say(player, memoryRef, tier, 90);
}
```

**Behavior**:
- After El Acechador responds to a chat message, the system checks for relevant memory references
- If a memory reference exists and probability check passes (30% chance), it appears ~4.5 seconds after the main response
- The memory reference uses the same tier coloring as the main dialogue
- Context is passed from the detected intent (e.g., "saludo", "pregunta_identidad", "emocion_muerte")

### 3. Integration into `respond()` Function  
**Location**: `main.js` - Whisper Rod and general dialogue responses

**What was added**:
- Memory references for **categorized responses** (when category parameter is provided)
- Memory references for **legacy responses** (uses "general" context as fallback)
- Same 90-tick delay for natural conversation flow

**Behavior**:
- When player uses Whisper Rod or triggers other dialogue interactions
- Memory references appear after the main dialogue response
- Uses category context when available, otherwise defaults to general context

## How Memory References Work

### Reference Selection Logic

1. **Context Matching**: The function looks at the `context` parameter to determine what type of memory to reference
   - "death", "muerte", "miedo" → Death event references
   - "achievement", "logro" → Achievement references
   - "combat", "fight" → Combat event references
   - "construction", "build", "casa" → Construction references
   - "mining", "mine" → Mining references
   - "chat", "talk", "saludo" → Conversation references

2. **Probability**: 30% chance a memory reference will be included (prevents saturation)

3. **Memory Availability**: Only generates references if the player has accumulated relevant memory events

4. **Time Formatting**: Automatically formats time references:
   - "hace un momento" (< 1 minute)
   - "hace X minutos" (< 60 minutes)
   - "hace X horas" (< 24 hours)
   - "hace días" (> 24 hours)

### Example Memory References

**Death References**:
- "Recuerdo cuando moriste en minecraft:overworld. Te vi caer."
- "3 veces te he visto morir. Siempre vuelves."
- "La última vez moriste por entity_attack. Estuve ahí."

**Combat References**:
- "Te vi pelear contra minecraft:zombie. Fuiste... eficiente."
- "Has eliminado 5 enemigos. Cuento cada uno."

**Construction References**:
- "Vi cuando colocaste ese minecraft:stone. ¿Construyes un hogar?"
- "Has construido 12 cosas. Observo cada bloque que colocas."

**Conversation References**:
- "Hemos hablado 3 veces. Recuerdo cada palabra."
- "La última vez hablamos hace 15 minutos. No olvido nada de lo que me dices."

## Testing the Memory Reference System

### Prerequisites
1. Load the addon in Minecraft Bedrock Edition 1.21.50+
2. Have El Acechador spawned and active
3. Have Whisper Rod in inventory (optional, for testing general dialogues)

### Test Scenario 1: Death Memory References

**Steps**:
1. Start a new game or reset bond with `.bond 0`
2. Die 2-3 times in different ways (fall damage, mob attack, lava, etc.)
3. Wait a few minutes
4. Chat with El Acechador using keywords like:
   - "hola" (greeting)
   - "tengo miedo" (fear emotion)
   - "muerte" (death)
5. **Expected**: After El Acechador's main response, wait ~4-5 seconds. A memory reference about your deaths should appear (30% probability)

**Example Output**:
```
[ The Obsessed Knocker ] §6Hola, PlayerName.
(4.5 seconds later)
[ The Obsessed Knocker ] §6Recuerdo cuando moriste en minecraft:overworld. Te vi caer.
```

### Test Scenario 2: Combat Memory References

**Steps**:
1. Kill several mobs (zombies, skeletons, creepers, etc.)
2. Chat with El Acechador using keywords like:
   - "pelear" (fight)
   - "miedo" (fear)
   - "protege" (protect)
3. **Expected**: Memory references about combat encounters

**Example Output**:
```
[ The Obsessed Knocker ] §dTe he estado observando más tiempo del que crees.
(4.5 seconds later)
[ The Obsessed Knocker ] §dTe vi pelear contra minecraft:zombie. Fuiste... eficiente.
```

### Test Scenario 3: Construction Memory References

**Steps**:
1. Build something (place 20+ blocks)
2. Chat with El Acechador using keywords like:
   - "casa" (home)
   - "hogar" (home)
   - "construir" (build)
3. **Expected**: Memory references about building activities

### Test Scenario 4: Conversation Memory References

**Steps**:
1. Chat with El Acechador multiple times (5+ conversations)
2. Wait a few minutes between some conversations
3. Chat again with greetings or general messages
4. **Expected**: References to past conversations and how long ago they happened

### Test Scenario 5: Multiple Memory Types

**Steps**:
1. Die once
2. Kill 3 mobs
3. Build a small structure
4. Mine some blocks
5. Chat with El Acechador multiple times over 10-15 minutes
6. Use various keywords to trigger different contexts
7. **Expected**: Different types of memory references appearing based on context

## Verification Checklist

- [x] `getMemoryReference()` function fully implemented with all event types
- [x] Memory references integrated into `respondToChat()` function
- [x] Memory references integrated into `respond()` function  
- [x] 30% probability check prevents saturation
- [x] 90-tick delay creates natural conversation flow
- [x] Time formatting for conversations and events
- [x] Context-based memory selection working
- [x] Fallback to general references when no specific context matches
- [x] No syntax errors in main.js
- [x] Player name replacement working with `{name}` placeholder

## FIFO Memory Management

Memory follows FIFO (First-In-First-Out) as specified in requirement 4.9:
- **Events**: Maximum 20, oldest removed when capacity reached
- **Conversations**: Maximum 10, oldest removed when capacity reached

This was already implemented in Task 7.1 via the `Memory.addEvent()` and `Memory.addConversation()` methods.

## Technical Details

### Function Signature
```javascript
function getMemoryReference(player, context)
```

**Parameters**:
- `player` (Player): The Minecraft player object
- `context` (string): The context/intent for selecting relevant memories

**Returns**:
- `string`: A memory reference phrase in Spanish
- `null`: If no relevant memory or probability check fails

### Integration Pattern
```javascript
// 1. Generate main response
say(player, response, tier, 0);

// 2. Check for memory reference
const memoryRef = getMemoryReference(player, context);

// 3. Send memory reference after delay
if (memoryRef) {
    say(player, memoryRef, tier, 90);
}
```

## Debugging Tips

If memory references aren't appearing:
1. Check that events are being recorded (use console.log in event listeners)
2. Verify `getPlayerMemory()` is returning a populated Memory object
3. Increase probability temporarily to 100% for testing: `if (Math.random() > 0.0)`
4. Check that context string matches the patterns in `getMemoryReference()`
5. Verify player has accumulated enough memory (check `memory.events.length`)

## Requirements Satisfied

✅ **Requirement 4.7**: "WHEN El_Acechador genera diálogos, THE Sistema_de_Memoria SHALL permitir referencias a eventos pasados"

✅ **Requirement 4.9**: "WHEN el Sistema_de_Memoria alcanza su capacidad máxima, THE Sistema_de_Memoria SHALL eliminar los eventos más antiguos (FIFO)" - Already implemented in Task 7.1

## Related Tasks

- **Task 7.1**: Memory data structure implementation
- **Task 7.2**: Event recording (deaths, achievements, combat, construction, mining)
- **Task 7.3**: Memory persistence system (will save/load memory references between sessions)

## Next Steps

Task 7.4 is **COMPLETE**. The memory reference system is fully integrated and ready for testing. When Task 7.3 (memory persistence) is completed, memory references will persist across game sessions, making El Acechador's memory truly long-term.

## Notes for Future Development

- Consider adding more specific memory reference phrases for rare events
- Could increase probability based on tier (higher tiers = more frequent memory mentions)
- Could add special ultra-rare memory references that only appear after extensive play time
- Memory references could be influenced by current mood system (when implemented in Task 12)
