# Balance inicial de Mastersmon Rogue

Este documento describe la primera curva jugable de las zonas Sendero Esmeralda y Mina Umbría. Los valores corresponden al seed y sirven como referencia para pruebas manuales y futuros ajustes.

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

Descansar recupera completamente HP y energía. La energía no se regenera por turno; debe administrarse durante cada tramo y recuperarse descansando.

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

El Guardián incrementa el poder base en 2. Al reclamar y equipar el Anillo del cazador, el personaje con la espada inicial llega exactamente a poder 22. Así, entrar en Mina Umbría exige completar la misión principal y usar su recompensa.

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

## Items relevantes

| Item | Rareza | Bonificaciones | Uso en la curva |
| --- | --- | --- | --- |
| Espada de aprendiz | Común | +4 ATQ, +5 poder | Arma inicial |
| Daga ágil | Rara | +6 ATQ, +4% crítico, +3 agilidad, +6 poder | Alternativa ofensiva para Mina Umbría |
| Armadura de cuero | Común | +3 DEF, +18 HP, +5 poder | Reduce el desgaste de contraataques |
| Botas ligeras | Raras | +4% evasión, +4 agilidad, +5 poder | Recompensa garantizada del primer boss |
| Anillo del cazador | Raro | +2 ATQ, +4% crítico, +5 poder | Permite cumplir el requisito de Mina Umbría |
| Poción menor | Común | Cura 30 HP | Recurso de seguridad; 2 unidades iniciales |

## Misiones y recompensas

| Orden | Misión | Objetivo | Oro | EXP | Item |
| ---: | --- | --- | ---: | ---: | --- |
| 1 | Derrota 3 Slimes musgosos | 3 Slimes | 30 | 30 | 2 Pociones menores |
| 2 | Derrota al Guardián de Raíz | 1 boss | 75 | 60 | Anillo del cazador |
| 3 | Explora Mina Umbría | Entrar en la zona | 40 | 30 | 2 Cristales verdes |
| 4 | Derrota 3 enemigos en Mina Umbría | 3 enemigos de zona | 90 | 65 | Amuleto umbrío |

La primera zona entrega aproximadamente 244 EXP contando combates y misiones, suficiente para alcanzar nivel 3. Completar y reclamar la misión del Guardián, además de equipar el anillo, satisface los dos requisitos de Mina Umbría.

## Notas de diseño

- El daño base del jugador es `máximo(1, ataque - defensa enemiga + variación)`.
- El daño del contraataque es `máximo(1, ataque enemigo - defensa del jugador)`.
- Los críticos multiplican el daño por 1.5.
- El equipo no está garantizado en enemigos normales; la ruta sigue siendo viable usando skills y pociones.
- Las recompensas garantizadas de los bosses estabilizan la progresión entre zonas.
- El oro queda preparado para una futura tienda; en este MVP funciona como indicador de progreso.
- El seed restablece únicamente a Kael, sus misiones, progreso e inventario inicial. Los personajes registrados conservan su progreso e inventario.
- Las probabilidades de drop deben evaluarse en varias partidas; una muestra pequeña puede dar una percepción engañosa.
