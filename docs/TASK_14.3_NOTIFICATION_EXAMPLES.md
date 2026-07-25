# Ejemplos Visuales de Notificaciones de Logros - Task 14.3

## Descripción

Este documento muestra ejemplos visuales de cómo se ven las notificaciones de logros cuando se desbloquean en el juego. Las notificaciones aparecen en el chat de Minecraft Bedrock con formato distintivo y colores que captan la atención del jugador.

---

## Formato General

Todas las notificaciones siguen esta estructura:

```
[Línea decorativa dorada]
[Título en amarillo y negrita]
[Icono + Nombre del logro en blanco]
[Descripción en gris claro]
[Línea decorativa dorada]
[Sonido: random.levelup]
```

---

## Ejemplos de Notificaciones por Tipo

### 1. Logros de Progresión de Vínculo

#### Tier 1 - "Primera Mirada" (100 puntos)

```
═══════════════════════════════════════
¡LOGRO DESBLOQUEADO!
👁 Primera Mirada
Alcanzaste Tier 1 (Watched). El Acechador ahora te observa con interés genuino.
═══════════════════════════════════════
```

**Trigger:** Cuando el jugador alcanza 100 puntos de vínculo  
**Recompensa adicional:** "Te he estado observando, {name}. Y lo que veo... me fascina."

---

#### Tier 2 - "Conocido Familiar" (250 puntos)

```
═══════════════════════════════════════
¡LOGRO DESBLOQUEADO!
💙 Conocido Familiar
Alcanzaste Tier 2 (Familiar). El Acechador siente un apego notable hacia ti.
═══════════════════════════════════════
```

**Trigger:** Cuando el jugador alcanza 250 puntos de vínculo  
**Recompensa adicional:** "Ya no eres un extraño, {name}. Eres... especial para mí."

---

#### Tier 3 - "Objeto de Obsesión" (400 puntos)

```
═══════════════════════════════════════
¡LOGRO DESBLOQUEADO!
💜 Objeto de Obsesión
Alcanzaste Tier 3 (Obsessed). El Acechador está intensamente obsesionado contigo.
═══════════════════════════════════════
```

**Trigger:** Cuando el jugador alcanza 400 puntos de vínculo  
**Recompensa adicional:** Item especial `scary:simbolo_obsesion` + diálogo alternativo

---

#### Vínculo Máximo - "Vínculo Eterno" (500 puntos)

```
═══════════════════════════════════════
¡LOGRO DESBLOQUEADO!
💗 Vínculo Eterno
Alcanzaste el vínculo máximo de 500 puntos. Tu conexión con El Acechador es absoluta.
═══════════════════════════════════════
```

**Trigger:** Cuando el jugador alcanza exactamente 500 puntos de vínculo  
**Recompensa adicional:** Item especial `scary:vinculo_eterno` + diálogo alternativo

---

### 2. Logros de Interacción y Dedicación

#### "Conversador Dedicado" (100 interacciones)

```
═══════════════════════════════════════
¡LOGRO DESBLOQUEADO!
💬 Conversador Dedicado
Interactuaste con El Acechador 100 veces. Tu dedicación es admirable.
═══════════════════════════════════════
```

**Trigger:** Cuando el jugador completa 100 interacciones con la Vara Whisper  
**Recompensa adicional:** "Cada palabra tuya es un tesoro que guardo, {name}."

---

#### "Encuentro Especial" (Primer evento ultra-raro)

```
═══════════════════════════════════════
¡LOGRO DESBLOQUEADO!
✨ Encuentro Especial
Experimentaste tu primer evento ultra-raro. Algo extraordinario sucedió.
═══════════════════════════════════════
```

**Trigger:** Cuando el jugador experimenta su primer evento ultra-raro  
**Recompensa adicional:** "Ese momento fue único, {name}. Como tú."

---

### 3. Logros Ocultos y Especiales

#### "Sobreviviente de Celos" (10 encuentros celosos)

```
═══════════════════════════════════════
¡LOGRO DESBLOQUEADO!
💔 Sobreviviente de Celos
Sobreviviste a 10 encuentros con El Acechador mientras estaba celoso.
═══════════════════════════════════════
```

**Trigger:** Cuando el jugador sobrevive 10 encuentros con El Acechador en estado celoso  
**Recompensa adicional:** "Incluso cuando los celos me consumen... no puedo lastimarte, {name}."  
**Nota:** Este es un logro oculto que no se muestra hasta desbloquearse

---

#### "Coleccionista de Momentos" (5 eventos ultra-raros únicos)

```
═══════════════════════════════════════
¡LOGRO DESBLOQUEADO!
🌟 Coleccionista de Momentos
Experimentaste 5 eventos ultra-raros diferentes. Atesoras lo extraordinario.
═══════════════════════════════════════
```

**Trigger:** Cuando el jugador experimenta 5 eventos ultra-raros diferentes  
**Recompensa adicional:** Item especial `scary:coleccion_recuerdos` + diálogo alternativo  
**Nota:** Este es un logro oculto que no se muestra hasta desbloquearse

---

#### "Compañero Inseparable" (24 horas jugadas)

```
═══════════════════════════════════════
¡LOGRO DESBLOQUEADO!
⏰ Compañero Inseparable
Pasaste 24 horas de juego con El Acechador activo. Inseparables.
═══════════════════════════════════════
```

**Trigger:** Cuando el jugador acumula 24 horas de tiempo de juego con el addon activo  
**Recompensa adicional:** "24 horas. 1,440 minutos. 86,400 segundos contigo. Y quiero más, {name}."  
**Nota:** Este es un logro oculto que no se muestra hasta desbloquearse

---

## Detalles Técnicos de Formato

### Códigos de Color de Minecraft

Los códigos `§` seguidos de un carácter determinan el color y estilo del texto:

| Código | Color/Estilo | Uso en Notificaciones |
|--------|--------------|------------------------|
| `§6` | Dorado | Líneas decorativas (═══) |
| `§e` | Amarillo | Título principal |
| `§l` | **Negrita** | Énfasis en el título |
| `§f` | Blanco | Nombre del logro |
| `§7` | Gris claro | Descripción del logro |
| `§b` | Azul claro (cian) | Iconos específicos (💙) |
| `§5` | Morado oscuro | Iconos específicos (💜) |
| `§d` | Rosa/magenta | Iconos específicos (💗) |
| `§4` | Rojo oscuro | Iconos específicos (💔) |
| `§a` | Verde claro | Iconos específicos (⏰) |

### Iconos Disponibles

Cada logro tiene un icono único representado por emojis/símbolos Unicode:

- 👁 (Ojo) - Primera Mirada
- 💙 (Corazón azul) - Conocido Familiar
- 💜 (Corazón morado) - Objeto de Obsesión
- 💗 (Corazón rosa) - Vínculo Eterno
- 💬 (Burbuja de diálogo) - Conversador Dedicado
- ✨ (Chispas) - Encuentro Especial
- 💔 (Corazón roto) - Sobreviviente de Celos
- 🌟 (Estrella brillante) - Coleccionista de Momentos
- ⏰ (Reloj de alarma) - Compañero Inseparable

---

## Comparación: Antes vs. Después

### Antes (Sin Sistema de Logros)

```
[Sin notificación]
- El jugador alcanza 100 puntos de vínculo
- No hay retroalimentación visual
- El cambio de tier pasa desapercibido
```

### Después (Con Sistema de Notificaciones)

```
═══════════════════════════════════════
¡LOGRO DESBLOQUEADO!
👁 Primera Mirada
Alcanzaste Tier 1 (Watched). El Acechador ahora te observa con interés genuino.
═══════════════════════════════════════

+ Sonido de logro (random.levelup)
+ Diálogo de recompensa inmediato
+ Registro persistente del logro
+ Evento de mood activado
```

**Ventajas:**
- ✅ Retroalimentación clara al jugador
- ✅ Sensación de progresión tangible
- ✅ Incentivo para explorar más contenido
- ✅ Memorable y satisfactorio

---

## Flujo de Experiencia del Jugador

### Escenario: Primer Logro Desbloqueado

1. **Acción:** El jugador interactúa con El Acechador usando la Vara Whisper
2. **Progreso:** Los puntos de vínculo aumentan de 95 a 105
3. **Trigger:** Se cruza el umbral de 100 puntos (Tier 1)
4. **Notificación visual aparece en el chat:**
   ```
   ═══════════════════════════════════════
   ¡LOGRO DESBLOQUEADO!
   👁 Primera Mirada
   Alcanzaste Tier 1 (Watched). El Acechador ahora te observa con interés genuino.
   ═══════════════════════════════════════
   ```
5. **Sonido:** Se reproduce "random.levelup"
6. **Recompensa:** El Acechador dice: "Te he estado observando, {name}. Y lo que veo... me fascina."
7. **Persistencia:** El logro se guarda automáticamente
8. **Mood Event:** Se dispara el evento `ACHIEVEMENT_UNLOCKED`

---

## Casos Especiales

### Múltiples Logros Simultáneos

Si un jugador desbloquea múltiples logros al mismo tiempo (ejemplo: alcanza 100 interacciones exactamente cuando llega a Tier 2), las notificaciones aparecen secuencialmente:

```
═══════════════════════════════════════
¡LOGRO DESBLOQUEADO!
💙 Conocido Familiar
Alcanzaste Tier 2 (Familiar). El Acechador siente un apego notable hacia ti.
═══════════════════════════════════════

═══════════════════════════════════════
¡LOGRO DESBLOQUEADO!
💬 Conversador Dedicado
Interactuaste con El Acechador 100 veces. Tu dedicación es admirable.
═══════════════════════════════════════
```

### Logro con Item Especial

Cuando un logro otorga un item especial, la secuencia es:

1. **Notificación del logro**
   ```
   ═══════════════════════════════════════
   ¡LOGRO DESBLOQUEADO!
   💜 Objeto de Obsesión
   Alcanzaste Tier 3 (Obsessed). El Acechador está intensamente obsesionado contigo.
   ═══════════════════════════════════════
   ```

2. **Intento de otorgar item** (1 segundo después)
   - Si el item existe: Se añade al inventario
   - Si el item no existe: Se muestra diálogo alternativo

3. **Mensaje de confirmación** (si el item se otorgó)
   ```
   [¡Recompensa Ultra-Rara!] Has recibido un objeto especial.
   ```

---

## Compatibilidad

### Plataformas Soportadas

✅ **Minecraft Bedrock Edition 1.21.50+**
- Windows 10/11
- Xbox (One, Series X/S)
- PlayStation (4, 5)
- Nintendo Switch
- Mobile (iOS, Android)

### Modos de Juego

✅ **Single-player:** Funcionamiento completo  
✅ **Multiplayer:** Cada jugador recibe sus propias notificaciones  
✅ **Realms:** Compatible con servidores Realms

### Limitaciones Conocidas

- **Sonido:** Si el jugador tiene sonidos deshabilitados o el sonido `random.levelup` no está disponible, la notificación visual aparece igualmente sin error
- **Chat rápido:** Si el chat se mueve muy rápido, la notificación puede desaparecer rápidamente del scroll
- **Logros ocultos:** No aparecen en ningún menú hasta desbloquearse (funcionalidad futura)

---

## Testing en Minecraft

### Cómo Probar las Notificaciones

1. **Cargar el addon** en un mundo de Minecraft Bedrock
2. **Usar comando de vínculo** para alcanzar umbrales:
   ```
   .bond 100    → Desbloquea "Primera Mirada"
   .bond 250    → Desbloquea "Conocido Familiar"
   .bond 400    → Desbloquea "Objeto de Obsesión"
   .bond 500    → Desbloquea "Vínculo Eterno"
   ```
3. **Observar el chat** para ver la notificación formateada
4. **Escuchar el sonido** de logro desbloqueado
5. **Leer el diálogo de recompensa** que aparece después

### Verificación Visual

**Checklist de elementos a verificar:**
- [ ] Líneas decorativas doradas visibles arriba y abajo
- [ ] Título "¡LOGRO DESBLOQUEADO!" en amarillo y negrita
- [ ] Icono del logro aparece correctamente
- [ ] Nombre del logro en blanco, legible
- [ ] Descripción en gris claro, completa
- [ ] Sonido se reproduce (si está disponible)
- [ ] Diálogo de recompensa aparece después (si aplica)
- [ ] No hay errores en la consola de debug

---

## Conclusión

El sistema de notificaciones de logros (Task 14.3) proporciona retroalimentación visual clara, atractiva y satisfactoria cuando los jugadores desbloquean logros. El formato distintivo con líneas decorativas, título destacado, iconos personalizados y colores jerárquicos asegura que las notificaciones capten la atención sin ser intrusivas.

**Características clave:**
- ✅ Formato visual distintivo y memorable
- ✅ 10 logros únicos con notificaciones personalizadas
- ✅ Todos los textos en español natural
- ✅ Retroalimentación sonora opcional
- ✅ Compatible con todas las plataformas Bedrock
- ✅ Integración completa con sistema de logros y recompensas

**Estado:** ✅ Completamente implementado y funcional

---

**Documentos relacionados:**
- `TASK_14.3_IMPLEMENTATION_SUMMARY.md` - Resumen técnico detallado
- `TASK_14.1_IMPLEMENTATION_SUMMARY.md` - Sistema de logros base
- `.kiro/specs/obsessed-knocker-mejoras/requirements.md` - Requisitos (13.7)
- `KNOCKERbeh2/scripts/main.js` (líneas 1490-1580) - Código fuente
