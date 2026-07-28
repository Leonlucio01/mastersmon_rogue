import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const zone = await prisma.zone.upsert({
    where: { name: 'Sendero Esmeralda' },
    update: {},
    create: {
      name: 'Sendero Esmeralda',
      description: 'Un antiguo sendero cubierto de musgo y criaturas pequeñas.',
      level: 1,
    },
  })

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
    update: { zoneId: zone.id },
    create: {
      name: 'Kael',
      level: 1,
      gold: 125,
      gems: 8,
      energy: 74,
      power: 18,
      userId: user.id,
      zoneId: zone.id,
    },
  })

  const monsterData = [
    { name: 'Slime musgoso', species: 'Slime', health: 45, maxHealth: 45, power: 6, rewardGold: 12 },
    { name: 'Colmillo joven', species: 'Bestia', health: 62, maxHealth: 62, power: 9, rewardGold: 18 },
    { name: 'Espora errante', species: 'Hongo', health: 38, maxHealth: 38, power: 7, rewardGold: 10 },
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
        level: 1,
        zoneId: zone.id,
      },
    })
  }

  const itemData = [
    { name: 'Poción menor', description: 'Restaura 25 puntos de vida.', type: 'CONSUMABLE', value: 15 },
    { name: 'Espada de aprendiz', description: 'Una hoja fiable para comenzar.', type: 'WEAPON', value: 40, power: 5 },
    { name: 'Escudo de madera', description: 'Protección ligera de roble.', type: 'ARMOR', value: 30 },
    { name: 'Hierba lunar', description: 'Ingrediente alquímico de brillo tenue.', type: 'MATERIAL', value: 5 },
    { name: 'Cristal verde', description: 'Fragmento imbuido con energía natural.', type: 'MATERIAL', value: 20 },
  ]

  const items = []
  for (const item of itemData) {
    items.push(
      await prisma.item.upsert({
        where: { name: item.name },
        update: item,
        create: item,
      }),
    )
  }

  const inventoryQuantities = [3, 1, 1, 4, 2]
  for (const [index, item] of items.entries()) {
    await prisma.inventoryItem.upsert({
      where: {
        characterId_itemId: {
          characterId: character.id,
          itemId: item.id,
        },
      },
      update: { quantity: inventoryQuantities[index] },
      create: {
        characterId: character.id,
        itemId: item.id,
        quantity: inventoryQuantities[index],
        equipped: item.name === 'Espada de aprendiz',
      },
    })
  }

  console.log('Seed completado: zona, personaje, monstruos, items e inventario creados.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
