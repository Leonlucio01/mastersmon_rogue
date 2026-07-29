# Mejora inicial de equipo

## Reglas del MVP

- Solo se mejoran armas, cascos, armaduras, botas, collares, anillos y artefactos.
- El nivel va de `+0` a `+5`.
- Cada mejora es garantizada; no existe fallo ni pérdida del objeto.
- El coste se paga únicamente con oro. No se consumen materiales en esta versión.
- Un objeto equipado actualiza inmediatamente las estadísticas del personaje.
- Cada pieza conserva su propio `upgradeLevel`, incluso si se desequipa.

## Costes

| Mejora | Coste | Oro acumulado |
|---|---:|---:|
| +0 → +1 | 25 | 25 |
| +1 → +2 | 50 | 75 |
| +2 → +3 | 90 | 165 |
| +3 → +4 | 140 | 305 |
| +4 → +5 | 210 | 515 |

## Fórmula de bonus

Para cada estadística base del objeto:

`bonus final = redondear(bonus base × (1 + nivel × 0.10))`

Crítico y evasión se conservan con cuatro decimales antes de serializarse. Si en
un nivel concreto todos los bonus quedan iguales por efecto del redondeo, ese
nivel aporta `+1 POD`. Así, pagar una mejora siempre produce al menos una
ganancia real.

Ejemplo, Espada de aprendiz (`+4 ATQ`, `+5 POD`):

| Nivel | ATQ | POD |
|---|---:|---:|
| +0 | 4 | 5 |
| +1 | 4 | 6 |
| +2 | 5 | 6 |
| +3 | 5 | 7 |
| +4 | 6 | 7 |
| +5 | 6 | 8 |

## Impacto en poder y venta

El recálculo suma los bonus finales de todas las piezas equipadas a las
estadísticas base del personaje. Mejorar una pieza guardada no altera al
personaje hasta equiparla.

Rowan paga una parte de la inversión:

`precio de venta = precio base + floor(oro invertido × 0.30)`

No se puede vender equipo equipado. El nombre y el precio de venta muestran el
nivel de mejora.

## Seguridad

- La pertenencia del objeto, tipo, nivel y oro se validan en backend.
- El descuento de oro, incremento de nivel y recálculo ocurren en una
  transacción.
- Las actualizaciones condicionales impiden gastar oro dos veces mediante
  solicitudes concurrentes.
- PostgreSQL impone que `upgradeLevel` permanezca entre 0 y 5.

## Evolución futura

Para una progresión hasta `+15` conviene separar tramos de costes, añadir
materiales por zona y decidir qué niveles son seguros. Una eventual probabilidad
de fallo debería incluir protección contra rachas negativas y nunca destruir
equipo sin una confirmación clara.
