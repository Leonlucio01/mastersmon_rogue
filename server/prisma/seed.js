import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function upsertZone(data) {
  return prisma.zone.upsert({
    where: { name: data.name },
    update: data,
    create: data,
  })
}

async function upsertMonster(zoneId, data) {
  return prisma.monster.upsert({
    where: {
      name_zoneId: {
        name: data.name,
        zoneId,
      },
    },
    update: data,
    create: { ...data, zoneId },
  })
}

async function main() {
  const sendero = await upsertZone({
    name: 'Sendero Esmeralda',
    description: 'Un antiguo sendero cubierto de musgo y criaturas pequeñas.',
    level: 1,
    requiredLevel: 1,
    requiredPower: 0,
    sortOrder: 1,
    initiallyUnlocked: true,
  })
  const mina = await upsertZone({
    name: 'Mina Umbría',
    description: 'Galerías olvidadas donde el hierro parece respirar en la oscuridad.',
    level: 2,
    requiredLevel: 2,
    requiredPower: 18,
    sortOrder: 2,
    initiallyUnlocked: false,
  })

  const itemData = [
    { name: 'Poción menor', description: 'Restaura 25 puntos de vida.', type: 'CONSUMABLE', value: 15, power: 0 },
    { name: 'Espada de aprendiz', description: 'Una hoja fiable para comenzar.', type: 'WEAPON', value: 40, power: 5 },
    { name: 'Escudo de madera', description: 'Protección ligera de roble.', type: 'ARMOR', value: 30, power: 1 },
    { name: 'Hierba lunar', description: 'Ingrediente alquímico de brillo tenue.', type: 'MATERIAL', value: 5, power: 0 },
    { name: 'Cristal verde', description: 'Fragmento imbuido con energía natural.', type: 'MATERIAL', value: 20, power: 0 },
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

  const zoneMonsters = [
    [sendero.id, [
      { name: 'Slime musgoso', species: 'Slime', level: 1, health: 45, maxHealth: 45, power: 6, defense: 2, rewardGold: 12, rewardExp: 18, dropChance: 0.55, dropItemId: items.get('Hierba lunar').id, sortOrder: 1, isBoss: false },
      { name: 'Colmillo joven', species: 'Bestia', level: 1, health: 62, maxHealth: 62, power: 9, defense: 4, rewardGold: 18, rewardExp: 26, dropChance: 0.35, dropItemId: items.get('Poción menor').id, sortOrder: 2, isBoss: false },
      { name: 'Espora errante', species: 'Hongo', level: 2, health: 55, maxHealth: 55, power: 8, defense: 2, rewardGold: 16, rewardExp: 24, dropChance: 0.3, dropItemId: items.get('Cristal verde').id, sortOrder: 3, isBoss: false },
      { name: 'Guardián de Raíz', species: 'Ancestro', level: 3, health: 115, maxHealth: 115, power: 13, defense: 6, rewardGold: 48, rewardExp: 55, dropChance: 1, dropItemId: items.get('Cristal verde').id, sortOrder: 4, isBoss: true },
    ]],
    [mina.id, [
      { name: 'Murciélago de hollín', species: 'Bestia', level: 2, health: 72, maxHealth: 72, power: 11, defense: 4, rewardGold: 22, rewardExp: 28, dropChance: 0.35, dropItemId: items.get('Hierba lunar').id, sortOrder: 1, isBoss: false },
      { name: 'Minero espectral', species: 'Espectro', level: 3, health: 88, maxHealth: 88, power: 14, defense: 6, rewardGold: 28, rewardExp: 34, dropChance: 0.4, dropItemId: items.get('Poción menor').id, sortOrder: 2, isBoss: false },
      { name: 'Escarabajo férreo', species: 'Insecto', level: 3, health: 105, maxHealth: 105, power: 12, defense: 9, rewardGold: 32, rewardExp: 38, dropChance: 0.3, dropItemId: items.get('Cristal verde').id, sortOrder: 3, isBoss: false },
      { name: 'Capataz Umbrío', species: 'Señor de la mina', level: 4, health: 165, maxHealth: 165, power: 18, defense: 10, rewardGold: 80, rewardExp: 90, dropChance: 1, dropItemId: items.get('Escudo de madera').id, sortOrder: 4, isBoss: true },
    ]],
  ]

  const monsterByKey = new Map()
  for (const [zoneId, monsters] of zoneMonsters) {
    for (const monster of monsters) {
      const savedMonster = await upsertMonster(zoneId, monster)
      monsterByKey.set(`${zoneId}:${monster.sortOrder}`, savedMonster)
    }
  }

  const user = await prisma.user.upsert({
    where: { email: 'demo@mastersmon.local' },
    update: { name: 'Jugador demo' },
    create: { email: 'demo@mastersmon.local', name: 'Jugador demo' },
  })

  const character = await prisma.character.upsert({
    where: { userId: user.id },
    update: {
      level: 1,
      experience: 0,
      gold: 125,
      gems: 8,
      health: 100,
      maxHealth: 100,
      energy: 74,
      maxEnergy: 100,
      zoneId: sendero.id,
      currentMonsterOrder: 1,
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
      currentMonsterOrder: 1,
      userId: user.id,
      zoneId: sendero.id,
    },
  })

  const characters = await prisma.character.findMany()
  for (const currentCharacter of characters) {
    await prisma.characterProgress.upsert({
      where: {
        characterId_zoneId: {
          characterId: currentCharacter.id,
          zoneId: sendero.id,
        },
      },
      update: currentCharacter.id === character.id
        ? {
            unlocked: true,
            completed: false,
            currentMonsterOrder: 1,
            currentMonsterHealth: monsterByKey.get(`${sendero.id}:1`).maxHealth,
          }
        : {},
      create: {
        characterId: currentCharacter.id,
        zoneId: sendero.id,
        unlocked: true,
        currentMonsterOrder: 1,
        currentMonsterHealth: monsterByKey.get(`${sendero.id}:1`).maxHealth,
      },
    })
    await prisma.characterProgress.upsert({
      where: {
        characterId_zoneId: {
          characterId: currentCharacter.id,
          zoneId: mina.id,
        },
      },
      update: currentCharacter.id === character.id
        ? {
            unlocked: false,
            completed: false,
            currentMonsterOrder: 1,
            currentMonsterHealth: monsterByKey.get(`${mina.id}:1`).maxHealth,
          }
        : {},
      create: {
        characterId: currentCharacter.id,
        zoneId: mina.id,
        unlocked: false,
        currentMonsterOrder: 1,
        currentMonsterHealth: monsterByKey.get(`${mina.id}:1`).maxHealth,
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

  console.log('Seed completado: 2 zonas, 8 monstruos, bosses, progreso y drops.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
