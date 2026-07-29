# Tienda inicial: Mercader Rowan

Rowan ofrece consumibles y equipo para las primeras dos zonas. Todas las compras y ventas se procesan en transacciones de PostgreSQL y usan el oro persistente del personaje.

## Catálogo

| Orden | Item | Disponible desde | Compra | Venta | Stock |
| ---: | --- | --- | ---: | ---: | --- |
| 1 | Poción menor | Sendero Esmeralda | 18 | 5 | Ilimitado |
| 2 | Espada de aprendiz | Sendero Esmeralda | 45 | 12 | Ilimitado |
| 3 | Armadura de cuero | Sendero Esmeralda | 70 | 18 | Ilimitado |
| 4 | Botas ligeras | Mina Umbría | 85 | 22 | Ilimitado |
| 5 | Anillo del cazador | Mina Umbría | 110 | 30 | Ilimitado |

Los items asociados a Mina Umbría solo aparecen después de que el personaje desbloquea esa zona.

## Reglas de compra

- El precio se resta del oro persistente del personaje.
- El backend comprueba que el item exista, esté habilitado y pertenezca a una zona desbloqueada.
- El pago utiliza una actualización condicional: si el oro cambió o ya no alcanza, toda la transacción se cancela.
- Si un item tiene stock limitado, el stock se valida y descuenta dentro de la misma transacción.
- Consumibles, materiales y objetos de misión se apilan.
- Armas, armaduras, cascos, botas, collares, anillos y artefactos crean un `InventoryItem` independiente por unidad.
- El equipo comprado llega desequipado.

## Reglas de venta

- Solo se venden items que pertenecen al personaje y tienen una entrada habilitada en `ShopItem`.
- Los objetos equipados no se pueden vender.
- Para vender un arma equipada, primero debe desequiparse.
- Una copia de equipo se vende completa y elimina únicamente su propia fila.
- Los objetos apilables reducen su cantidad. Si llega a cero, se elimina la fila.
- El oro se acredita en la misma transacción que retira el item.
- Si Rowan usa stock limitado, una venta devuelve unidades a ese stock.

## Balance inicial

Kael comienza con 35 de oro:

- Puede comprar una Poción menor, pero no equipo adicional.
- Tres Slimes y su misión entregan suficiente oro para empezar a elegir entre consumibles y ahorro.
- La Armadura de cuero cuesta 70 para que sea una decisión previa al Guardián, no una compra inmediata.
- Botas y Anillo son alternativas tardías o copias adicionales; sus primeras unidades también pueden obtenerse mediante boss y misión.
- Los precios de venta rondan entre 25% y 30% del precio de compra, evitando ciclos rentables de compra/venta.

## Seguridad

- Las rutas resuelven el personaje desde el token o desde el personaje demo; no aceptan `characterId` enviado por el cliente.
- Comprar valida oro, zona, estado del catálogo y stock en backend.
- Vender valida propiedad, cantidad, estado equipado y tarifa de venta en backend.
- Los errores de fondos, stock, zona o equipo usan respuestas `4xx` y revierten la transacción.
- La restricción única `InventoryItem.stackKey` evita stacks duplicados.
- La restricción única `(characterId, slot)` mantiene una sola pieza equipada por slot.
- Las piezas de equipo usan `stackKey = NULL`, lo que permite copias independientes sin perder identidad.
