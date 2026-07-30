# Balance inicial de Mastersmon Rogue

Este documento describe la primera curva jugable de Sendero Esmeralda, Mina Umbría y Ruinas Carmesí. Los valores corresponden al seed y sirven como referencia para pruebas manuales y futuros ajustes.

## Personaje inicial

Kael y los personajes nuevos comienzan con la misma base:

| Atributo | Base | Con Espada de aprendiz |
| --- | ---: | ---: |
| Nivel | 1 | 1 |
| EXP | 0 | 0 |
| Oro | 35 | 35 |
| Gemas | 2 | 2 |
| HP máximo | 110 | 110 |
| Energía máxima | 80 | 80 |
| Ataque | 12 | 16 |
| Defensa | 4 | 4 |
| Crítico | 8% | 8% |
| Evasión | 5% | 5% |
| Agilidad | 10 | 10 |
| Poder | 10 | 15 |

Inventario inicial:

- Espada de aprendiz equipada.
- 2 Pociones menores.

Descansar recupera completamente HP y energía. Cada victoria normal recupera 8 de energía y cada victoria contra un boss recupera 20, sin superar `maxEnergy`. Así se sostiene el farmeo normal sin eliminar la decisión de descansar antes de un combate exigente.

## Habilidades

| Habilidad | Multiplicador | Coste | Cooldown | Efecto |
| --- | ---: | ---: | ---: | --- |
| Ataque básico | x1.0 | 0 | 0 | Ataque estable |
| Corte veloz | x1.2 | 10 | 1 | Daño eficiente y frecuente |
| Golpe sombrío | x1.8 | 24 | 3 | +20% de probabilidad crítica |
| Paso evasivo | — | 12 | 3 | +30% evasión durante 2 turnos |

Con 80 de energía se pueden combinar varias habilidades, pero no repetir indefinidamente las más fuertes.

## Zonas

| Orden | Zona | Nivel requerido | Poder requerido | Desbloqueo |
| ---: | --- | ---: | ---: | --- |
| 1 | Sendero Esmeralda | 1 | 0 | Inicial |
| 2 | Mina Umbría | 3 | 22 | Derrotar al Guardián de Raíz |
| 3 | Ruinas Carmesí | 8 | 65 | Derrotar al Gólem Umbrío |

El Guardián incrementa el poder base en 2. Al reclamar y equipar el Anillo del cazador, el personaje con la espada inicial llega exactamente a poder 22. Así, entrar en Mina Umbría exige completar la misión principal y usar su recompensa.

Ruinas Carmesí exige consolidar el equipo obtenido en las dos primeras zonas. El Núcleo de raíz se habilita en la tienda al desbloquear Mina Umbría; combinarlo con el equipo de Mina y varias mejoras permite llegar a poder 65 antes de entrar.

## Enemigos y recompensas

### Zona 01: Sendero Esmeralda

| Orden | Enemigo | Nivel | HP | ATQ | DEF | Oro | EXP | Drop | Probabilidad |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| 1 | Slime musgoso | 1 | 32 | 6 | 1 | 7 | 14 | Poción menor | 30% |
| 2 | Lobo joven | 1 | 52 | 9 | 3 | 12 | 22 | Armadura de cuero | 35% |
| 3 | Goblin errante | 2 | 68 | 12 | 5 | 18 | 30 | Daga ágil | 35% |
| 4 | Guardián de Raíz | 3 | 110 | 15 | 7 | 40 | 60 | Botas ligeras | 100% |

Rol de la zona:

- El Slime enseña el ciclo de ataque y se repite tres veces por la misión inicial.
- El Lobo introduce daño sostenido y puede entregar la primera defensa.
- El Goblin castiga ignorar habilidades o curación.
- El Guardián requiere administrar energía, Paso evasivo y al menos una poción si no cayó equipo defensivo.

### Zona 02: Mina Umbría

| Orden | Enemigo | Nivel | HP | ATQ | DEF | Oro | EXP | Drop | Probabilidad |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| 1 | Murciélago de hollín | 3 | 75 | 14 | 5 | 18 | 24 | Botas ligeras | 35% |
| 2 | Minero corrupto | 3 | 95 | 17 | 7 | 24 | 30 | Casco del minero | 40% |
| 3 | Araña de cueva | 4 | 88 | 16 | 6 | 28 | 34 | Poción menor | 45% |
| 4 | Gólem Umbrío | 5 | 135 | 19 | 9 | 70 | 68 | Amuleto umbrío | 100% |

Rol de la zona:

- La entrada comprueba que el jugador entendió misiones y equipo.
- Los ataques enemigos hacen importante la Armadura, el Casco, las Botas y Paso evasivo.
- El Gólem tiene defensa alta para favorecer Daga ágil, Golpe sombrío y críticos.
- La poción de la Araña ayuda a preparar el combate final, pero no está garantizada.

### Zona 03: Ruinas Carmesí

| Orden | Enemigo | Nivel | HP | ATQ | DEF | Oro | EXP | Drop | Probabilidad |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| 1 | Esqueleto errante | 8 | 160 | 23 | 10 | 38 | 50 | Fragmento carmesí | 45% |
| 2 | Cultista sombrío | 8 | 190 | 27 | 12 | 48 | 62 | Capa sombría | 30% |
| 3 | Centinela de hueso | 9 | 230 | 30 | 15 | 58 | 75 | Guantes del Duelista | 30% |
| 4 | Caballero Carmesí | 10 | 340 | 34 | 18 | 120 | 140 | Amuleto Carmesí | 100% |

Rol de la zona:

- Comprueba la preparación acumulada: equipo, mejoras, consumibles y uso eficiente de skills.
- La defensa creciente favorece críticos y equipo ofensivo, mientras los contraataques castigan ignorar defensa y evasión.
- El boss entrega un drop especial garantizado en la primera conquista.
- En modo farmeo, los enemigos normales conservan recompensas normales; el boss entrega oro y EXP reducidos, sin drop único ni nuevo desbloqueo.

## Items relevantes

| Item | Rareza | Bonificaciones | Uso en la curva |
| --- | --- | --- | --- |
| Espada de aprendiz | Común | +4 ATQ, +5 poder | Arma inicial |
| Daga ágil | Rara | +6 ATQ, +4% crítico, +3 agilidad, +6 poder | Alternativa ofensiva para Mina Umbría |
| Armadura de cuero | Común | +3 DEF, +18 HP, +5 poder | Reduce el desgaste de contraataques |
| Botas ligeras | Raras | +4% evasión, +4 agilidad, +5 poder | Recompensa garantizada del primer boss |
| Anillo del cazador | Raro | +2 ATQ, +4% crítico, +5 poder | Permite cumplir el requisito de Mina Umbría |
| Núcleo de raíz | Épico | +4 ATQ, +4 DEF, +15 HP, +12 poder | Compra avanzada para alcanzar Ruinas Carmesí |
| Capa sombría | Épica | +5 DEF, +35 HP, +3% evasión, +2 agilidad, +12 poder | Defensa de Zona 03 |
| Guantes del Duelista | Épicos | +7 ATQ, +2 DEF, +4% crítico, +4 agilidad, +14 poder | Artefacto ofensivo de Zona 03 |
| Amuleto Carmesí | Legendario | +8 ATQ, +3 DEF, +35 HP, +6% crítico, +2 agilidad, +18 poder | Drop especial del Caballero Carmesí |
| Fragmento carmesí | Raro | Material | Recurso de misión y futuras mejoras |
| Poción menor | Común | Cura 30 HP | Recurso de seguridad; 2 unidades iniciales |

## Misiones y recompensas

| Orden | Misión | Objetivo | Oro | EXP | Item |
| ---: | --- | --- | ---: | ---: | --- |
| 1 | Derrota 3 Slimes musgosos | 3 Slimes | 30 | 30 | 2 Pociones menores |
| 2 | Derrota al Guardián de Raíz | 1 boss | 75 | 60 | Anillo del cazador |
| 3 | Explora Mina Umbría | Entrar en la zona | 40 | 30 | 2 Cristales verdes |
| 4 | Derrota 3 enemigos en Mina Umbría | 3 enemigos de zona | 90 | 65 | Amuleto umbrío |
| 5 | Explora Ruinas Carmesí | Entrar en la zona | 70 | 70 | 3 Fragmentos carmesí |
| 6 | Derrota 3 enemigos en Ruinas Carmesí | 3 enemigos de zona | 140 | 120 | Capa sombría |
| 7 | Derrota al Caballero Carmesí | 1 boss | 220 | 180 | Guantes del Duelista |

La primera zona entrega aproximadamente 244 EXP contando combates y misiones, suficiente para alcanzar nivel 3. Completar y reclamar la misión del Guardián, además de equipar el anillo, satisface los dos requisitos de Mina Umbría.

## Notas de diseño

- El daño base del jugador es `máximo(1, ataque - defensa enemiga + variación)`.
- El daño del contraataque es `máximo(1, ataque enemigo - defensa del jugador)`.
- Los críticos multiplican el daño por 1.5.
- El equipo no está garantizado en enemigos normales; la ruta sigue siendo viable usando skills y pociones.
- Las recompensas garantizadas de los bosses estabilizan la progresión entre zonas.
- Las mejoras de +0 a +5 y la comparación visual de equipo convierten el oro en una decisión de progreso.
- El seed restablece únicamente a Kael, sus misiones, progreso e inventario inicial. Los personajes registrados conservan su progreso e inventario.
- Las probabilidades de drop deben evaluarse en varias partidas; una muestra pequeña puede dar una percepción engañosa.
