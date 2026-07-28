import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const zone = await prisma.zone.upsert({
    where: { name: 'Sendero Esmeralda' },
    update: {
      description: 'Un antiguo sendero cubierto de musgo y criaturas pequeñas.',
      level: 1,
    },
    create: {
      name: 'Sendero Esmeralda',
      description: 'Un antiguo sendero cubierto de musgo y criaturas pequeñas.',
      level: 1,
    },
  })

  const itemData = [
    {
      name: 'Poción menor',
      description: 'Restaura 25 puntos de vida.',
      type: 'CONSUMABLE',
      value: 15,
      power: 0,
    },
    {
      name: 'Espada de aprendiz',
      description: 'Una hoja fiable para comenzar.',
      type: 'WEAPON',
      value: 40,
      power: 5,
    },
    {
      name: 'Escudo de madera',
      description: 'Protección ligera de roble.',
      type: 'ARMOR',
      value: 30,
      power: 1,
    },
    {
      name: 'Hierba lunar',
      description: 'Ingrediente alquímico de brillo tenue.',
      type: 'MATERIAL',
      value: 5,
      power: 0,
    },
    {
      name: 'Cristal verde',
      description: 'Fragmento imbuido con energía natural.',
      type: 'MATERIAL',
      value: 20,
      power: 0,
    },
  ]

  const items = new Map()
  for (const item of itemData) {
    const savedItem = await prisma.item.upsert({
      where: { name: item.name },
      update: item,
      create: item,
    })
    items.set(savedItem.name, savedItem)
  }

  const user = await prisma.user.upsert({
    where: { email: 'demo@mastersmon.local' },
    update: { name: 'Jugador demo' },
    create: {
      email: 'demo@mastersmon.local',
      name: 'Jugador demo',
    },
  })

  const character = await prisma.character.upsert({
    where: { userId: user.id },
    update: {
      zoneId: zone.id,
      attack: 18,
      defense: 4,
      critRate: 0.1,
      evasion: 0.05,
      agility: 11,
      power: 18,
    },
    create: {
      name: 'Kael',
      characterClass: 'Vanguardia',
      level: 1,
      gold: 125,
      gems: 8,
      energy: 74,
      attack: 18,
      defense: 4,
      critRate: 0.1,
      evasion: 0.05,
      agility: 11,
      power: 18,
      userId: user.id,
      zoneId: zone.id,
    },
  })

  const monsterData = [
    {
      name: 'Slime musgoso',
      species: 'Slime',
      level: 1,
      health: 45,
      maxHealth: 45,
      power: 6,
      defense: 2,
      rewardGold: 12,
      rewardExp: 18,
      dropChance: 0.55,
      dropItemId: items.get('Hierba lunar').id,
      sortOrder: 1,
    },
    {
      name: 'Colmillo joven',
      species: 'Bestia',
      level: 2,
      health: 62,
      maxHealth: 62,
      power: 9,
      defense: 4,
      rewardGold: 18,
      rewardExp: 26,
      dropChance: 0.35,
      dropItemId: items.get('Poción menor').id,
      sortOrder: 2,
    },
    {
      name: 'Espora errante',
      species: 'Hongo',
      level: 2,
      health: 38,
      maxHealth: 38,
      power: 7,
      defense: 1,
      rewardGold: 10,
      rewardExp: 22,
      dropChance: 0.25,
      dropItemId: items.get('Cristal verde').id,
      sortOrder: 3,
    },
  ]

  for (const monster of monsterData) {
    await prisma.monster.upsert({
      where: {
        name_zoneId: {
          name: monster.name,
          zoneId: zone.id,
        },
      },
      update: monster,
      create: {
        ...monster,
        zoneId: zone.id,
      },
    })
  }

  const inventoryItems = [
    ['Poción menor', 3],
    ['Espada de aprendiz', 1],
    ['Escudo de madera', 1],
    ['Hierba lunar', 4],
    ['Cristal verde', 2],
  ]

  for (const [name, quantity] of inventoryItems) {
    const item = items.get(name)
    await prisma.inventoryItem.upsert({
      where: {
        characterId_itemId: {
          characterId: character.id,
          itemId: item.id,
        },
      },
      update: { quantity },
      create: {
        characterId: character.id,
        itemId: item.id,
        quantity,
        equipped: name === 'Espada de aprendiz',
      },
    })
  }

  console.log('Seed completado: zona, personaje, 3 monstruos, 5 items y drops.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
