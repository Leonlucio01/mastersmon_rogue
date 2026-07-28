export const character = {
  id: 'demo-character',
  name: 'Kael',
  level: 1,
  experience: 0,
  gold: 125,
  gems: 8,
  energy: 74,
  maxEnergy: 100,
  power: 18,
  health: 100,
  maxHealth: 100,
}

export const inventory = [
  {
    id: 'potion',
    name: 'Poción menor',
    description: 'Restaura 25 puntos de vida.',
    type: 'CONSUMABLE',
    quantity: 3,
  },
  {
    id: 'sword',
    name: 'Espada de aprendiz',
    description: 'Una hoja fiable para comenzar la aventura.',
    type: 'WEAPON',
    quantity: 1,
  },
  {
    id: 'herb',
    name: 'Hierba lunar',
    description: 'Ingrediente alquímico de brillo tenue.',
    type: 'MATERIAL',
    quantity: 4,
  },
]

export const battle = {
  enemy: {
    id: 'moss-slime',
    name: 'Slime musgoso',
    maxHealth: 45,
    health: 45,
  },
}

export function resetBattle() {
  battle.enemy.health = battle.enemy.maxHealth
}
