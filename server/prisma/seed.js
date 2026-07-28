import { PrismaClient } from '@prisma/client'
import {
  getSlotForItem,
  isEquipableItem,
  recalculateCharacterStats,
} from '../src/services/equipment.js'

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
    { name: 'Poción menor', description: 'Restaura 25 puntos de vida.', type: 'CONSUMABLE', rarity: 'COMMON', value: 15, power: 0, attackBonus: 0, defenseBonus: 0, healthBonus: 0, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 0 },
    { name: 'Espada de aprendiz', description: 'Una hoja fiable para comenzar.', type: 'WEAPON', rarity: 'COMMON', value: 40, power: 5, attackBonus: 5, defenseBonus: 0, healthBonus: 0, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 5 },
    { name: 'Daga ágil', description: 'Hoja ligera que favorece golpes veloces.', type: 'WEAPON', rarity: 'RARE', value: 85, power: 7, attackBonus: 7, defenseBonus: 0, healthBonus: 0, critBonus: 0.03, evasionBonus: 0, agilityBonus: 3, powerBonus: 7 },
    { name: 'Armadura de cuero', description: 'Protección flexible para caminos peligrosos.', type: 'ARMOR', rarity: 'COMMON', value: 70, power: 5, attackBonus: 0, defenseBonus: 4, healthBonus: 20, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 5 },
    { name: 'Escudo de madera', description: 'Protección ligera de roble.', type: 'ARMOR', rarity: 'COMMON', value: 30, power: 3, attackBonus: 0, defenseBonus: 2, healthBonus: 10, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 3 },
    { name: 'Botas ligeras', description: 'Botas reforzadas que mejoran la movilidad.', type: 'BOOTS', rarity: 'RARE', value: 90, power: 6, attackBonus: 0, defenseBonus: 0, healthBonus: 0, critBonus: 0, evasionBonus: 0.03, agilityBonus: 4, powerBonus: 6 },
    { name: 'Anillo del cazador', description: 'Un aro marcado con runas de precisión.', type: 'RING', rarity: 'RARE', value: 110, power: 6, attackBonus: 2, defenseBonus: 0, healthBonus: 0, critBonus: 0.05, evasionBonus: 0, agilityBonus: 0, powerBonus: 6 },
    { name: 'Casco del minero', description: 'Yelmo de hierro curtido bajo tierra.', type: 'HELMET', rarity: 'RARE', value: 105, power: 6, attackBonus: 0, defenseBonus: 5, healthBonus: 12, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 6 },
    { name: 'Amuleto umbrío', description: 'Collar que pulsa con energía de la mina.', type: 'NECKLACE', rarity: 'EPIC', value: 180, power: 10, attackBonus: 0, defenseBonus: 0, healthBonus: 30, critBonus: 0.03, evasionBonus: 0, agilityBonus: 0, powerBonus: 10 },
    { name: 'Núcleo de raíz', description: 'Artefacto vivo extraído de un guardián ancestral.', type: 'ARTIFACT', rarity: 'EPIC', value: 220, power: 12, attackBonus: 4, defenseBonus: 4, healthBonus: 15, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 12 },
    { name: 'Hierba lunar', description: 'Ingrediente alquímico de brillo tenue.', type: 'MATERIAL', rarity: 'COMMON', value: 5, power: 0, attackBonus: 0, defenseBonus: 0, healthBonus: 0, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 0 },
    { name: 'Cristal verde', description: 'Fragmento imbuido con energía natural.', type: 'MATERIAL', rarity: 'RARE', value: 20, power: 0, attackBonus: 0, defenseBonus: 0, healthBonus: 0, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 0 },
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

  const skillData = [
    {
      name: 'Ataque básico',
      description: 'Un golpe fiable sin coste de energía ni enfriamiento.',
      skillType: 'BASIC',
      damageMultiplier: 1,
      critBonus: 0,
      energyCost: 0,
      cooldownTurns: 0,
      requiredLevel: 1,
      icon: '⚔',
      evasionBonus: 0,
      durationTurns: 0,
    },
    {
      name: 'Corte veloz',
      description: 'Una estocada rápida que inflige 120% de daño.',
      skillType: 'DAMAGE',
      damageMultiplier: 1.2,
      critBonus: 0,
      energyCost: 12,
      cooldownTurns: 1,
      requiredLevel: 1,
      icon: '≋',
      evasionBonus: 0,
      durationTurns: 0,
    },
    {
      name: 'Golpe sombrío',
      description: 'Un ataque devastador con 180% de daño y crítico aumentado.',
      skillType: 'DAMAGE',
      damageMultiplier: 1.8,
      critBonus: 0.2,
      energyCost: 28,
      cooldownTurns: 3,
      requiredLevel: 1,
      icon: '☾',
      evasionBonus: 0,
      durationTurns: 0,
    },
    {
      name: 'Paso evasivo',
      description: 'Aumenta la evasión un 30% durante 2 turnos.',
      skillType: 'BUFF',
      damageMultiplier: 0,
      critBonus: 0,
      energyCost: 14,
      cooldownTurns: 3,
      requiredLevel: 1,
      icon: '◇',
      evasionBonus: 0.3,
      durationTurns: 2,
    },
  ]

  const skills = []
  for (const skill of skillData) {
    skills.push(
      await prisma.skill.upsert({
        where: { name: skill.name },
        update: skill,
        create: skill,
      }),
    )
  }

  const zoneMonsters = [
    [sendero.id, [
      { name: 'Slime musgoso', species: 'Slime', level: 1, health: 45, maxHealth: 45, power: 6, defense: 2, rewardGold: 12, rewardExp: 18, dropChance: 0.55, dropItemId: items.get('Hierba lunar').id, sortOrder: 1, isBoss: false },
      { name: 'Colmillo joven', species: 'Bestia', level: 1, health: 62, maxHealth: 62, power: 9, defense: 4, rewardGold: 18, rewardExp: 26, dropChance: 0.35, dropItemId: items.get('Botas ligeras').id, sortOrder: 2, isBoss: false },
      { name: 'Espora errante', species: 'Hongo', level: 2, health: 55, maxHealth: 55, power: 8, defense: 2, rewardGold: 16, rewardExp: 24, dropChance: 0.3, dropItemId: items.get('Daga ágil').id, sortOrder: 3, isBoss: false },
      { name: 'Guardián de Raíz', species: 'Ancestro', level: 3, health: 115, maxHealth: 115, power: 13, defense: 6, rewardGold: 48, rewardExp: 55, dropChance: 1, dropItemId: items.get('Núcleo de raíz').id, sortOrder: 4, isBoss: true },
    ]],
    [mina.id, [
      { name: 'Murciélago de hollín', species: 'Bestia', level: 2, health: 72, maxHealth: 72, power: 11, defense: 4, rewardGold: 22, rewardExp: 28, dropChance: 0.35, dropItemId: items.get('Hierba lunar').id, sortOrder: 1, isBoss: false },
      { name: 'Minero espectral', species: 'Espectro', level: 3, health: 88, maxHealth: 88, power: 14, defense: 6, rewardGold: 28, rewardExp: 34, dropChance: 0.4, dropItemId: items.get('Anillo del cazador').id, sortOrder: 2, isBoss: false },
      { name: 'Escarabajo férreo', species: 'Insecto', level: 3, health: 105, maxHealth: 105, power: 12, defense: 9, rewardGold: 32, rewardExp: 38, dropChance: 0.3, dropItemId: items.get('Casco del minero').id, sortOrder: 3, isBoss: false },
      { name: 'Capataz Umbrío', species: 'Señor de la mina', level: 4, health: 165, maxHealth: 165, power: 18, defense: 10, rewardGold: 80, rewardExp: 90, dropChance: 1, dropItemId: items.get('Amuleto umbrío').id, sortOrder: 4, isBoss: true },
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
      baseAttack: 13,
      baseDefense: 4,
      baseMaxHealth: 100,
      baseCritRate: 0.1,
      baseEvasion: 0.05,
      baseAgility: 11,
      basePower: 13,
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
      baseAttack: 13,
      baseDefense: 4,
      baseMaxHealth: 100,
      baseCritRate: 0.1,
      baseEvasion: 0.05,
      baseAgility: 11,
      basePower: 13,
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
    for (const skill of skills) {
      await prisma.characterSkill.upsert({
        where: {
          characterId_skillId: {
            characterId: currentCharacter.id,
            skillId: skill.id,
          },
        },
        update:
          currentCharacter.id === character.id
            ? { cooldownRemaining: 0, activeTurns: 0 }
            : {},
        create: {
          characterId: currentCharacter.id,
          skillId: skill.id,
        },
      })
    }

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
    ['Daga ágil', 1],
    ['Armadura de cuero', 1],
    ['Escudo de madera', 1],
    ['Botas ligeras', 1],
    ['Anillo del cazador', 1],
    ['Casco del minero', 1],
    ['Amuleto umbrío', 1],
    ['Núcleo de raíz', 1],
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
      update: {
        quantity,
        equipped: name === 'Espada de aprendiz',
        slot: name === 'Espada de aprendiz' ? 'WEAPON' : null,
      },
      create: {
        characterId: character.id,
        itemId: item.id,
        quantity,
        equipped: name === 'Espada de aprendiz',
        slot: name === 'Espada de aprendiz' ? 'WEAPON' : null,
      },
    })
  }

  for (const currentCharacter of characters) {
    const legacyEquipped = await prisma.inventoryItem.findMany({
      where: {
        characterId: currentCharacter.id,
        equipped: true,
        slot: null,
      },
      include: { item: true },
    })
    const occupiedSlots = new Set(
      (
        await prisma.inventoryItem.findMany({
          where: {
            characterId: currentCharacter.id,
            equipped: true,
            slot: { not: null },
          },
          select: { slot: true },
        })
      ).map((entry) => entry.slot),
    )

    for (const entry of legacyEquipped) {
      const slot = getSlotForItem(entry.item)
      if (isEquipableItem(entry.item) && !occupiedSlots.has(slot)) {
        await prisma.inventoryItem.update({
          where: { id: entry.id },
          data: { slot },
        })
        occupiedSlots.add(slot)
      } else {
        await prisma.inventoryItem.update({
          where: { id: entry.id },
          data: { equipped: false, slot: null },
        })
      }
    }

    await recalculateCharacterStats(currentCharacter.id, prisma)
  }

  console.log(
    'Seed completado: equipo, 4 habilidades, 2 zonas, 8 monstruos y drops.',
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
