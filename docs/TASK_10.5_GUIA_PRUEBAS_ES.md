# Guía de Pruebas - Tarea 10.5: Visibilidad según Tier
## Sistema de Acecho Variable

**Versión:** 1.0  
**Última Actualización:** 2024

---

## Resumen

Esta guía te ayudará a verificar que el sistema de visibilidad por tier funciona correctamente. El Acechador debe ser visible en diferentes porcentajes según tu nivel de vínculo:

- **Tier 0 (Extraño):** 10% visible
- **Tier 1 (Observado):** 25% visible
- **Tier 2 (Familiar):** 50% visible
- **Tier 3 (Obsesionado):** 75% visible

---

## Preparación para las Pruebas

### Requisitos Previos

1. **Mundo de prueba** (no tu mundo principal)
2. **Modo Creativo o Survival** (preferiblemente Creativo para manipular vínculo fácilmente)
3. **Tiempo disponible:** 20-30 minutos para pruebas completas

### Comandos Útiles

```mcfunction
# Ver tu nivel de vínculo actual
.bond

# Establecer vínculo en un valor específico
.bond set <número>

# Ejemplos:
.bond set 0      # Tier 0 (Stranger)
.bond set 150    # Tier 1 (Watched)
.bond set 300    # Tier 2 (Familiar)
.bond set 450    # Tier 3 (Obsessed)

# Aumentar vínculo
.bond add <número>

# Invocar al Knocker si no está presente
/summon scary:knocker
```

---

## Prueba 1: Verificar Visibilidad en Tier 0 (10%)

### Objetivo
Confirmar que El Acechador es visible solo el ~10% del tiempo en Tier 0.

### Pasos

1. **Establecer Tier 0:**
   ```
   .bond set 0
   ```
   Deberías ver: `"Tu vínculo es ahora 0 (Tier: Stranger)"`

2. **Invocar al Knocker si es necesario:**
   ```
   /summon scary:knocker
   ```

3. **Observar durante 5 minutos:**
   - Camina por el mundo normalmente
   - NO mires directamente al Knocker (esto activa el efecto Weeping Angel)
   - Mira ocasionalmente a tu alrededor

4. **Contar apariciones:**
   - Usa un cronómetro o reloj
   - Cuenta cuántos segundos el Knocker es visible
   - **Esperado:** 30-60 segundos de 300 segundos totales (~10%)

### Resultados Esperados

✅ **CORRECTO:**
- El Knocker es visible raramente (0.5-1 minuto de cada 5)
- Cuando es invisible, no puedes verlo en absoluto
- Sensación de "fantasma esquivo"

❌ **INCORRECTO:**
- El Knocker es visible constantemente
- El Knocker nunca es visible
- El Knocker parpadea erráticament

### Notas

- **Variabilidad:** Como es probabilístico, puede variar entre 5-15%
- **Efecto Weeping Angel:** Si miras al Knocker, se volverá invisible automáticamente (esto es correcto)

---

## Prueba 2: Verificar Visibilidad en Tier 1 (25%)

### Objetivo
Confirmar que El Acechador es visible el ~25% del tiempo en Tier 1.

### Pasos

1. **Establecer Tier 1:**
   ```
   .bond set 150
   ```
   Deberías ver: `"Tu vínculo es ahora 150 (Tier: Watched)"`

2. **Observar durante 4 minutos:**
   - Realiza actividades normales (minar, construir, explorar)
   - Gira la cámara ocasionalmente
   - NO mires fijamente al Knocker

3. **Contar apariciones:**
   - **Esperado:** ~60 segundos de 240 segundos (~25%)

### Resultados Esperados

✅ **CORRECTO:**
- El Knocker es visible aproximadamente 1/4 del tiempo
- Más visible que en Tier 0
- Apariciones ocasionales pero notables

❌ **INCORRECTO:**
- Visibilidad idéntica a Tier 0
- Visible más del 40% del tiempo

---

## Prueba 3: Verificar Visibilidad en Tier 2 (50%)

### Objetivo
Confirmar que El Acechador es visible el ~50% del tiempo en Tier 2.

### Pasos

1. **Establecer Tier 2:**
   ```
   .bond set 300
   ```
   Deberías ver: `"Tu vínculo es ahora 300 (Tier: Familiar)"`

2. **Observar durante 4 minutos:**
   - Explora el mundo
   - Mira alrededor frecuentemente
   - Evita mirar directamente al Knocker por más de 2 segundos

3. **Contar apariciones:**
   - **Esperado:** ~120 segundos de 240 segundos (~50%)

### Resultados Esperados

✅ **CORRECTO:**
- El Knocker es visible aproximadamente la mitad del tiempo
- Presencia constante pero equilibrada
- Alternas entre verlo y no verlo con regularidad

❌ **INCORRECTO:**
- Visible menos del 30% del tiempo
- Visible más del 70% del tiempo

---

## Prueba 4: Verificar Visibilidad en Tier 3 (75%)

### Objetivo
Confirmar que El Acechador es visible el ~75% del tiempo en Tier 3.

### Pasos

1. **Establecer Tier 3:**
   ```
   .bond set 450
   ```
   Deberías ver: `"Tu vínculo es ahora 450 (Tier: Obsessed)"`

2. **Observar durante 4 minutos:**
   - Continúa tu actividad normal
   - El Knocker debería estar visible frecuentemente
   - Solo desaparecerá ocasionalmente

3. **Contar apariciones:**
   - **Esperado:** ~180 segundos de 240 segundos (~75%)

### Resultados Esperados

✅ **CORRECTO:**
- El Knocker es visible la mayor parte del tiempo
- Solo breves momentos de invisibilidad
- Presencia agobiante y constante
- Sensación de "no puedo escapar de él"

❌ **INCORRECTO:**
- Visible menos del 60% del tiempo
- Nunca invisible
- Comportamiento errático

---

## Prueba 5: Prioridad del Efecto Weeping Angel

### Objetivo
Verificar que el efecto Weeping Angel tiene prioridad sobre la visibilidad por tier.

### Pasos

1. **Establecer Tier 3 (máxima visibilidad):**
   ```
   .bond set 450
   ```

2. **Esperar a que el Knocker sea visible**

3. **Mirar directamente al Knocker:**
   - Apunta tu cámara hacia él
   - Mantenlo en el centro de tu pantalla
   - **Esperado:** Se vuelve invisible inmediatamente

4. **Desviar la mirada:**
   - Gira la cámara en otra dirección
   - Espera 2-3 segundos
   - Mira de nuevo hacia donde estaba
   - **Esperado:** Debería ser visible nuevamente (75% probabilidad)

### Resultados Esperados

✅ **CORRECTO:**
- El Knocker se vuelve invisible cuando lo miras
- Se vuelve visible cuando desvías la mirada (con alta probabilidad en Tier 3)
- El efecto Weeping Angel anula temporalmente la visibilidad por tier

❌ **INCORRECTO:**
- El Knocker permanece visible cuando lo miras directamente
- El Knocker nunca se vuelve visible después de desviar la mirada
- Comportamiento inconsistente

---

## Prueba 6: Transición Entre Tiers

### Objetivo
Verificar que la visibilidad escala correctamente al cambiar de tier.

### Pasos

1. **Comenzar en Tier 0:**
   ```
   .bond set 0
   ```
   - Observar durante 2 minutos
   - Anotar frecuencia de visibilidad (debería ser baja)

2. **Subir a Tier 1:**
   ```
   .bond set 150
   ```
   - Observar durante 2 minutos
   - Anotar frecuencia de visibilidad (debería aumentar)

3. **Subir a Tier 2:**
   ```
   .bond set 300
   ```
   - Observar durante 2 minutos
   - Anotar frecuencia de visibilidad (debería ser ~50%)

4. **Subir a Tier 3:**
   ```
   .bond set 450
   ```
   - Observar durante 2 minutos
   - Anotar frecuencia de visibilidad (debería ser ~75%)

### Resultados Esperados

✅ **CORRECTO:**
- Progresión clara: Tier 0 < Tier 1 < Tier 2 < Tier 3
- Incremento perceptible en cada tier
- Sin glitches visuales durante transiciones

❌ **INCORRECTO:**
- Visibilidad aleatoria sin patrón
- Algunos tiers tienen visibilidad idéntica
- Errores visuales o de consola

---

## Prueba 7: Comportamiento a Larga Distancia

### Objetivo
Verificar que la visibilidad funciona correctamente a diferentes distancias.

### Pasos

1. **Establecer Tier 2:**
   ```
   .bond set 300
   ```

2. **Alejarse del Knocker:**
   - Vuela o camina lejos (~40 bloques)
   - Observa desde lejos

3. **Acercarse gradualmente:**
   - Acércate lentamente
   - Observa cambios de visibilidad

### Resultados Esperados

✅ **CORRECTO:**
- La visibilidad es consistente a cualquier distancia
- El Knocker no se vuelve más/menos visible por la distancia
- Transiciones suaves de visible/invisible

❌ **INCORRECTO:**
- El Knocker solo es invisible de cerca
- El Knocker solo es invisible de lejos
- Parpadeos o glitches a distancias específicas

---

## Solución de Problemas

### Problema: El Knocker nunca es visible

**Posibles causas:**
1. Estás en Tier 0 y la probabilidad es muy baja (espera más tiempo)
2. Estás mirando constantemente al Knocker (activa Weeping Angel)
3. Error en el código

**Soluciones:**
- Usa `.bond set 450` para forzar Tier 3
- Deja de mirar al Knocker durante 30 segundos
- Verifica la consola de errores

### Problema: El Knocker siempre es visible

**Posibles causas:**
1. El efecto de invisibilidad no se está aplicando
2. Error en la configuración de tier

**Soluciones:**
- Reinicia el mundo
- Verifica que el tier se estableció correctamente con `.bond`
- Revisa logs de Minecraft para errores

### Problema: Comportamiento errático (parpadea constantemente)

**Posibles causas:**
1. La función se está llamando con demasiada frecuencia
2. Conflicto con otros addons

**Soluciones:**
- Desactiva otros addons temporalmente
- Verifica que no haya modificaciones al código
- Consulta con el desarrollador

---

## Checklist de Verificación Final

Completa este checklist para confirmar que todo funciona:

- [ ] Tier 0 muestra ~10% de visibilidad
- [ ] Tier 1 muestra ~25% de visibilidad
- [ ] Tier 2 muestra ~50% de visibilidad
- [ ] Tier 3 muestra ~75% de visibilidad
- [ ] El efecto Weeping Angel funciona correctamente (oculta cuando miras)
- [ ] La transición entre tiers escala correctamente
- [ ] No hay errores en la consola
- [ ] Las transiciones visible/invisible son suaves
- [ ] El comportamiento es consistente a diferentes distancias
- [ ] El sistema funciona en diferentes dimensiones (Overworld, Nether, End)

---

## Registro de Pruebas

Usa esta tabla para registrar tus resultados:

| Tier | Vínculo | Tiempo Total | Tiempo Visible | % Real | % Esperado | ¿Correcto? |
|------|---------|--------------|----------------|---------|------------|------------|
| 0    | 0       | 5 min        |                |         | 10%        | ☐          |
| 1    | 150     | 4 min        |                |         | 25%        | ☐          |
| 2    | 300     | 4 min        |                |         | 50%        | ☐          |
| 3    | 450     | 4 min        |                |         | 75%        | ☐          |

**Margen de error aceptable:** ±10% (debido a la naturaleza probabilística)

---

## Notas Adicionales

### Comportamiento Normal

- **Variabilidad:** El sistema es probabilístico, habrá variación natural
- **Weeping Angel Priority:** Mirar al Knocker SIEMPRE lo oculta
- **Sin partículas:** No deberías ver partículas de invisibilidad (por diseño)

### Comportamiento Anormal

- **Visible 100% en Tier 0:** ERROR - reportar
- **Nunca visible en Tier 3:** ERROR - reportar
- **Parpadeos constantes:** ERROR - reportar
- **Errores de consola:** ERROR - reportar con log completo

---

## Reportar Problemas

Si encuentras problemas, reporta con:

1. **Tier y vínculo usados**
2. **Comportamiento observado vs esperado**
3. **Logs de consola (si hay errores)**
4. **Otros addons activos**
5. **Versión de Minecraft Bedrock**

---

## Conclusión

Si todas las pruebas pasan, el sistema de visibilidad por tier está funcionando correctamente. El Acechador ahora escalará su presencia visual según tu nivel de vínculo, desde fantasma esquivo hasta sombra obsesiva constante.

**¡Disfruta la experiencia de horror psicológico progresivo!** 👁️
