# Recompensas offline

El sistema de farmeo offline entrega una versión reducida de las recompensas de enemigos normales ya alcanzados en la zona actual del personaje. El cálculo y el reclamo son autoritativos en el backend.

## Reglas

| Regla | Valor |
| --- | --- |
| Acumulación máxima pendiente | 4 horas |
| Intervalo por intento | 2 minutos |
| Intentos máximos | 120 |
| Oro por intento | 50% del enemigo, redondeado hacia abajo |
| EXP por intento | 50% del enemigo, redondeada hacia abajo |
| Probabilidad de drop | 50% de la probabilidad normal |

Restricciones:

- Nunca selecciona bosses.
- No modifica progreso de mapa ni misiones.
- No desbloquea zonas.
- Solo usa monstruos normales cuyo orden ya alcanzó el personaje.
- La zona actual debe estar desbloqueada para el personaje.
- Si la zona actual no es válida, usa Sendero Esmeralda.
- Un personaje con 0 HP no genera nuevas recompensas.
- Un registro pendiente no puede superar 120 intentos aunque se consulte varias veces.
- El reclamo cambia el registro de `PENDING` a `CLAIMED` antes de entregar oro, EXP e items.

## Selección de enemigos

El sistema recorre en orden los enemigos normales disponibles. Por ejemplo, si el personaje llegó hasta el Goblin errante en Sendero Esmeralda, los intentos rotan entre:

1. Slime musgoso.
2. Lobo joven.
3. Goblin errante.

El Guardián de Raíz queda excluido por ser boss.

## Ejemplos

### 30 minutos al inicio de Sendero Esmeralda

El personaje solo alcanzó al Slime musgoso:

- `30 minutos / 2 = 15 intentos`.
- Oro del Slime: `floor(7 × 0.5) = 3` por intento.
- EXP del Slime: `floor(14 × 0.5) = 7` por intento.
- Total: `45 oro` y `105 EXP`.
- Drop de Poción menor: `30% × 0.5 = 15%` por intento.

Los drops se sortean en el backend al calcular el estado y se guardan en PostgreSQL. Por eso recargar la página no vuelve a sortearlos.

### 10 horas offline

- Tiempo real: 10 horas.
- Tiempo recompensado: 4 horas.
- Intentos: 120.
- `limitApplied`: `true`.

Las seis horas restantes no generan recompensas.

### Personaje derrotado

Si `Character.health` es 0 cuando se calcula el periodo:

- Intentos nuevos: 0.
- Oro nuevo: 0.
- EXP nueva: 0.
- Drops nuevos: ninguno.

Las recompensas que ya estaban pendientes antes de la derrota siguen siendo reclamables.

## Persistencia

`Character.lastSeenAt` registra la última actividad conocida. Cada lote se guarda en `OfflineReward`:

- `offlineStartedAt`: inicio del periodo.
- `calculatedAt`: momento del cálculo.
- `offlineSeconds`: tiempo recompensado.
- `attempts`: intentos acumulados.
- `gold` y `experience`: recompensa pendiente.
- `drops`: items pendientes en JSON.
- `limitApplied`: indica si se alcanzó el máximo.
- `status`: `PENDING` o `CLAIMED`.
- `claimedAt`: fecha del reclamo.

El frontend actualiza actividad mientras la pestaña está visible y al ocultarla. Al volver a la pestaña consulta nuevamente el estado offline.
