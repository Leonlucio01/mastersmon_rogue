const sharedBounds = {
  minX: -6,
  maxX: 6,
  minZ: -5,
  maxZ: 5,
}

export const ZONE_MAPS = {
  'Sendero Esmeralda': {
    theme: 'forest',
    floor: '#294a34',
    path: '#61704a',
    fog: '#142b25',
    light: '#d9ffb0',
    accent: '#9be35f',
    bounds: sharedBounds,
    spawn: [-4.8, 2.8],
    monsters: [
      { order: 1, name: 'Slime musgoso', position: [-1.9, 1.2] },
      { order: 2, name: 'Lobo joven', position: [1.2, -1.4] },
      { order: 3, name: 'Goblin errante', position: [4.2, 2.1] },
    ],
    collectibles: [
      {
        id: 'sendero-chest',
        type: 'chest',
        name: 'Cofre cubierto de musgo',
        position: [-3.6, 2.8],
        message: 'Encontraste un cofre',
        reward: 'Obtuviste 12 oro',
      },
      {
        id: 'sendero-herb',
        type: 'herb',
        name: 'Hierba lunar',
        position: [-3.5, -2.7],
        message: 'Recolectaste hierba lunar',
        reward: 'Ingrediente temporal de exploración',
      },
    ],
  },
  'Mina Umbría': {
    theme: 'mine',
    floor: '#252b2d',
    path: '#4e4b43',
    fog: '#11171c',
    light: '#9ec8dc',
    accent: '#6fb5d1',
    bounds: sharedBounds,
    spawn: [-4.7, -2.8],
    monsters: [
      { order: 1, name: 'Murciélago de hollín', position: [-2.4, 0.8] },
      { order: 2, name: 'Minero corrupto', position: [1.1, 2.1] },
      { order: 3, name: 'Araña de cueva', position: [4.2, -1.8] },
    ],
    collectibles: [
      {
        id: 'mina-chest',
        type: 'chest',
        name: 'Arcón del minero',
        position: [-0.2, -2.9],
        message: 'Encontraste un cofre',
        reward: 'Obtuviste 18 oro',
      },
      {
        id: 'mina-crystal',
        type: 'crystal',
        name: 'Cristal umbrío',
        position: [3.6, 2.8],
        message: 'Recolectaste cristal umbrío',
        reward: 'Fragmento temporal de exploración',
      },
    ],
  },
  'Ruinas Carmesí': {
    theme: 'ruins',
    floor: '#402b2c',
    path: '#684247',
    fog: '#241518',
    light: '#ffb19e',
    accent: '#e76259',
    bounds: sharedBounds,
    spawn: [-4.8, 0],
    monsters: [
      { order: 1, name: 'Esqueleto errante', position: [-2.1, -2] },
      { order: 2, name: 'Cultista sombrío', position: [0.7, 1.8] },
      { order: 3, name: 'Centinela de hueso', position: [4.1, -0.4] },
    ],
    collectibles: [
      {
        id: 'ruinas-chest',
        type: 'chest',
        name: 'Cofre carmesí',
        position: [-0.7, 3.2],
        message: 'Encontraste un cofre',
        reward: 'Obtuviste 25 oro',
      },
      {
        id: 'ruinas-crystal',
        type: 'crystal',
        name: 'Fragmento carmesí',
        position: [2.7, -2.8],
        message: 'Recolectaste fragmento carmesí',
        reward: 'Material temporal de exploración',
      },
    ],
  },
}

export function getZoneMap(zoneName) {
  return ZONE_MAPS[zoneName] ?? ZONE_MAPS['Sendero Esmeralda']
}
