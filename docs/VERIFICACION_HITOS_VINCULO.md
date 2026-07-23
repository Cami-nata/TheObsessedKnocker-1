# Guía de Verificación - Hitos de Vínculo

## Propósito

Este documento proporciona instrucciones para verificar que el sistema de hitos de vínculo funciona correctamente en el juego.

## Qué Son los Hitos de Vínculo

Los **hitos de vínculo** son mensajes especiales que aparecen cuando el jugador alcanza exactamente los valores de bond: **100**, **250**, **400**, y **500**.

Son **diferentes** de las transiciones de tier:
- **Transiciones de tier**: Ocurren al cruzar umbrales (0→1 a bond 100, 1→2 a bond 250, etc.)
- **Hitos**: Celebran números exactos con formato visual distintivo

## Comandos de Prueba

### Preparación
1. Entra al mundo con el addon activado
2. Asegúrate de tener el comando `.bond` habilitado

### Prueba 1: Hito 100
```
.bond 0       → Resetear bond a 0
.bond +100    → Alcanzar exactamente 100
```

**Resultado esperado:**
- Mensaje con formato de líneas (━━━━)
- Título: "★ HITO DE VÍNCULO ALCANZADO ★"
- Color oro (§6)
- Diálogo sobre "cien momentos"
- Segundo mensaje adicional después de ~3 segundos

### Prueba 2: Hito 250
```
.bond 0       → Resetear bond a 0
.bond +250    → Alcanzar exactamente 250
```

**Resultado esperado:**
- Mensaje con formato de líneas (━━━━)
- Título: "★★ HITO SIGNIFICATIVO ALCANZADO ★★"
- Subtítulo: "Punto Medio"
- Color magenta (§d)
- Diálogo sobre "mitad del camino"
- Segundo mensaje adicional

### Prueba 3: Hito 400
```
.bond 0       → Resetear bond a 0
.bond +400    → Alcanzar exactamente 400
```

**Resultado esperado:**
- Mensaje con formato de líneas (━━━━)
- Título: "★★★ HITO CRÍTICO ALCANZADO ★★★"
- Subtítulo: "Obsesión Inminente"
- Color rojo oscuro (§4)
- Diálogo sobre "cuatrocientos"
- **DOS** mensajes adicionales secuenciales

### Prueba 4: Hito 500 (Máximo)
```
.bond 0       → Resetear bond a 0
.bond +500    → Alcanzar exactamente 500
```

**Resultado esperado:**
- Mensaje con formato de caja decorativa (╔═══╗)
- Título: "★★★ VÍNCULO MÁXIMO ALCANZADO ★★★"
- Indicador: "Vínculo: 500/500 - MÁXIMO"
- Color rojo oscuro (§4)
- Diálogo sobre "perfección total"
- **TRES** mensajes adicionales secuenciales
- Registro de logro "eternal_bond" en memoria

## Pruebas Incrementales

Para verificar que los hitos se activan al cruzarlos (no solo al alcanzarlos exactamente):

### Prueba 5: Saltar hito
```
.bond 0       → Resetear bond
.bond +50     → Bond en 50
.bond +75     → Bond en 125 (cruzó hito 100)
```

**Resultado esperado:**
- Debe activarse el hito 100 aunque no se alcanzó exactamente
- Solo debe activarse UNA vez (no múltiples hitos a la vez)

### Prueba 6: Transición + Hito simultáneos
```
.bond 0       → Resetear bond (tier 0)
.bond +100    → Alcanzar exactamente 100 (tier 1)
```

**Resultado esperado:**
- Primero: Mensaje de transición de tier (0→1) con formato de caja
- Segundo: Mensaje de hito 100 con formato de líneas
- Ambos mensajes deben aparecer pero ser visualmente distintos

## Verificación en Memoria

Los hitos se registran en la memoria del jugador. Para verificar:

1. Alcanza un hito (ej: 100)
2. El evento debería registrarse como `bond_milestone` en la memoria
3. Verifica usando comandos de debug o revisando logs del servidor

## Formatos Visuales Distintivos

### Hito 100 - Simple
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ★ HITO DE VÍNCULO ALCANZADO ★
   Vínculo: 100/500
   "[mensaje]"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Hito 250 - Medio
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ★★ HITO SIGNIFICATIVO ALCANZADO ★★
   Vínculo: 250/500 - Punto Medio
   "[mensaje]"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Hito 400 - Crítico
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ★★★ HITO CRÍTICO ALCANZADO ★★★
   Vínculo: 400/500 - Obsesión Inminente
   "[mensaje]"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Hito 500 - Máximo
```
╔═══════════════════════════════════════╗
║                                       ║
║   ★★★ VÍNCULO MÁXIMO ALCANZADO ★★★   ║
║                                       ║
║        Vínculo: 500/500 - MÁXIMO     ║
║                                       ║
║   "[mensaje]"
║                                       ║
╚═══════════════════════════════════════╝
```

## Troubleshooting

### No aparece ningún mensaje
- Verifica que el bond se haya actualizado correctamente con `.bond`
- Revisa los logs del servidor para errores
- Confirma que `main.js` contiene las funciones `checkBondMilestone` y `onBondMilestoneReached`

### Mensaje aparece pero sin formato
- Los códigos de color (§) pueden no mostrarse en algunos entornos
- El formato debería funcionar en cliente oficial de Minecraft Bedrock

### Hito se activa múltiples veces
- Esto indica un bug en la lógica de detección
- Verifica que `oldBond < milestone && newBond >= milestone` esté implementado correctamente

### No hay diferencia entre hito y transición
- Los hitos usan líneas (━━━━) excepto el 500 que usa cajas (╔═══╗)
- Las transiciones usan cajas (╔═══╗) para todos los tiers
- Los títulos son diferentes: "HITO" vs "VÍNCULO FORTALECIDO/PROFUNDIZADO/CONSUMADO"

## Checklist de Verificación

- [ ] Hito 100 se activa correctamente
- [ ] Hito 250 se activa correctamente
- [ ] Hito 400 se activa correctamente
- [ ] Hito 500 se activa correctamente
- [ ] Formato visual es distintivo para cada hito
- [ ] Todos los mensajes están en español
- [ ] Diálogos adicionales aparecen con delays apropiados
- [ ] Hitos se registran en la memoria del jugador
- [ ] Hito 500 registra logro "eternal_bond"
- [ ] Hitos y transiciones pueden ocurrir simultáneamente sin conflicto
- [ ] Solo un hito se activa por incremento de bond (no múltiples)

## Estado

✅ **Implementación completada y lista para testing**

Todas las funciones están implementadas en `main.js`:
- `checkBondMilestone()` - Detecta cuando se cruza un hito
- `onBondMilestoneReached()` - Maneja el evento del hito
- Integración en `addBond()` - Verifica hitos en cada incremento

## Fecha de Implementación

Task 9.2 completada - [Fecha actual]
