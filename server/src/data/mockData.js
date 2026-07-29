export const character = {
  id: 'demo-character',
  name: 'Kael',
  class: 'Vanguardia',
  level: 1,
  experience: 0,
  gold: 35,
  gems: 2,
  energy: 80,
  maxEnergy: 80,
  attack: 16,
  defense: 4,
  critRate: 0.08,
  evasion: 0.05,
  agility: 10,
  power: 15,
  health: 110,
  maxHealth: 110,
}

export const inventory = [
  {
    id: 'potion',
    name: 'Poción menor',
    description: 'Restaura 30 puntos de vida.',
    type: 'CONSUMABLE',
    quantity: 2,
  },
  {
    id: 'sword',
    name: 'Espada de aprendiz',
    description: 'Una hoja fiable para comenzar la aventura.',
    type: 'WEAPON',
    quantity: 1,
  },
]

export const battle = {
  enemy: {
    id: 'moss-slime',
    name: 'Slime musgoso',
    maxHealth: 32,
    health: 32,
    attack: 6,
    power: 6,
    defense: 1,
    level: 1,
  },
}

export function resetBattle() {
  battle.enemy.health = battle.enemy.maxHealth
}
