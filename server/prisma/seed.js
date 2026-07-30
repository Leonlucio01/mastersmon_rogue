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
  const existingMonster = await prisma.monster.findFirst({
    where: {
      zoneId,
      OR: [{ name: data.name }, { sortOrder: data.sortOrder }],
    },
    orderBy: { sortOrder: 'asc' },
  })

  if (existingMonster) {
    return prisma.monster.update({
      where: { id: existingMonster.id },
      data: { ...data, zoneId },
    })
  }

  return prisma.monster.create({ data: { ...data, zoneId } })
}

async function main() {
  const seedTime = new Date()
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
    requiredLevel: 3,
    requiredPower: 22,
    sortOrder: 2,
    initiallyUnlocked: false,
  })
  const ruinas = await upsertZone({
    name: 'Ruinas Carmesí',
    description:
      'Antiguas ruinas teñidas por energía roja, habitadas por no muertos y cultistas.',
    level: 8,
    requiredLevel: 8,
    requiredPower: 65,
    sortOrder: 3,
    initiallyUnlocked: false,
  })

  const itemData = [
    { name: 'Poción menor', description: 'Restaura 30 puntos de vida.', type: 'CONSUMABLE', rarity: 'COMMON', value: 18, power: 0, attackBonus: 0, defenseBonus: 0, healthBonus: 0, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 0, healAmount: 30 },
    { name: 'Espada de aprendiz', description: 'Una hoja fiable para comenzar.', type: 'WEAPON', rarity: 'COMMON', value: 40, power: 5, attackBonus: 4, defenseBonus: 0, healthBonus: 0, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 5 },
    { name: 'Daga ágil', description: 'Hoja ligera que favorece golpes veloces.', type: 'WEAPON', rarity: 'RARE', value: 85, power: 6, attackBonus: 6, defenseBonus: 0, healthBonus: 0, critBonus: 0.04, evasionBonus: 0, agilityBonus: 3, powerBonus: 6 },
    { name: 'Armadura de cuero', description: 'Protección flexible para caminos peligrosos.', type: 'ARMOR', rarity: 'COMMON', value: 70, power: 5, attackBonus: 0, defenseBonus: 3, healthBonus: 18, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 5 },
    { name: 'Escudo de madera', description: 'Protección ligera de roble.', type: 'ARMOR', rarity: 'COMMON', value: 30, power: 3, attackBonus: 0, defenseBonus: 2, healthBonus: 10, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 3 },
    { name: 'Botas ligeras', description: 'Botas reforzadas que mejoran la movilidad.', type: 'BOOTS', rarity: 'RARE', value: 90, power: 5, attackBonus: 0, defenseBonus: 0, healthBonus: 0, critBonus: 0, evasionBonus: 0.04, agilityBonus: 4, powerBonus: 5 },
    { name: 'Anillo del cazador', description: 'Un aro marcado con runas de precisión.', type: 'RING', rarity: 'RARE', value: 110, power: 5, attackBonus: 2, defenseBonus: 0, healthBonus: 0, critBonus: 0.04, evasionBonus: 0, agilityBonus: 0, powerBonus: 5 },
    { name: 'Casco del minero', description: 'Yelmo de hierro curtido bajo tierra.', type: 'HELMET', rarity: 'RARE', value: 105, power: 6, attackBonus: 0, defenseBonus: 5, healthBonus: 12, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 6 },
    { name: 'Amuleto umbrío', description: 'Collar que pulsa con energía de la mina.', type: 'NECKLACE', rarity: 'EPIC', value: 180, power: 10, attackBonus: 0, defenseBonus: 0, healthBonus: 30, critBonus: 0.03, evasionBonus: 0, agilityBonus: 0, powerBonus: 10 },
    { name: 'Núcleo de raíz', description: 'Artefacto vivo extraído de un guardián ancestral.', type: 'ARTIFACT', rarity: 'EPIC', value: 220, power: 12, attackBonus: 4, defenseBonus: 4, healthBonus: 15, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 12 },
    { name: 'Hierba lunar', description: 'Ingrediente alquímico de brillo tenue.', type: 'MATERIAL', rarity: 'COMMON', value: 5, power: 0, attackBonus: 0, defenseBonus: 0, healthBonus: 0, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 0 },
    { name: 'Cristal verde', description: 'Fragmento imbuido con energía natural.', type: 'MATERIAL', rarity: 'RARE', value: 20, power: 0, attackBonus: 0, defenseBonus: 0, healthBonus: 0, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 0 },
    { name: 'Fragmento carmesí', description: 'Esquirla de las ruinas cargada con energía roja.', type: 'MATERIAL', rarity: 'RARE', value: 35, power: 0, attackBonus: 0, defenseBonus: 0, healthBonus: 0, critBonus: 0, evasionBonus: 0, agilityBonus: 0, powerBonus: 0 },
    { name: 'Capa sombría', description: 'Manto de cultista que amortigua golpes y oculta el movimiento.', type: 'ARMOR', rarity: 'EPIC', value: 240, power: 12, attackBonus: 0, defenseBonus: 5, healthBonus: 35, critBonus: 0, evasionBonus: 0.03, agilityBonus: 2, powerBonus: 12 },
    { name: 'Guantes del Duelista', description: 'Guanteletes rituales conservados como artefacto de combate.', type: 'ARTIFACT', rarity: 'EPIC', value: 280, power: 14, attackBonus: 7, defenseBonus: 2, healthBonus: 0, critBonus: 0.04, evasionBonus: 0, agilityBonus: 4, powerBonus: 14 },
    { name: 'Amuleto Carmesí', description: 'Reliquia del Caballero Carmesí que concentra fuerza vital.', type: 'NECKLACE', rarity: 'LEGENDARY', value: 420, power: 18, attackBonus: 8, defenseBonus: 3, healthBonus: 35, critBonus: 0.06, evasionBonus: 0, agilityBonus: 2, powerBonus: 18 },
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

  const shopData = [
    ['Poción menor', 18, 5, sendero.id, 1],
    ['Espada de aprendiz', 45, 12, sendero.id, 2],
    ['Armadura de cuero', 70, 18, sendero.id, 3],
    ['Botas ligeras', 85, 22, mina.id, 4],
    ['Anillo del cazador', 110, 30, mina.id, 5],
    ['Núcleo de raíz', 260, 70, mina.id, 6],
  ]
  for (const [
    name,
    buyPrice,
    sellPrice,
    availableFromZoneId,
    sortOrder,
  ] of shopData) {
    await prisma.shopItem.upsert({
      where: { itemId: items.get(name).id },
      update: {
        buyPrice,
        sellPrice,
        stock: null,
        availableFromZoneId,
        enabled: true,
        sortOrder,
      },
      create: {
        itemId: items.get(name).id,
        buyPrice,
        sellPrice,
        stock: null,
        availableFromZoneId,
        enabled: true,
        sortOrder,
      },
    })
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
      energyCost: 10,
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
      energyCost: 24,
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
      energyCost: 12,
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
      { name: 'Slime musgoso', species: 'Slime', level: 1, health: 32, maxHealth: 32, attack: 6, power: 6, defense: 1, rewardGold: 7, rewardExp: 14, dropChance: 0.3, dropItemId: items.get('Poción menor').id, sortOrder: 1, isBoss: false },
      { name: 'Lobo joven', species: 'Bestia', level: 1, health: 52, maxHealth: 52, attack: 9, power: 9, defense: 3, rewardGold: 12, rewardExp: 22, dropChance: 0.35, dropItemId: items.get('Armadura de cuero').id, sortOrder: 2, isBoss: false },
      { name: 'Goblin errante', species: 'Goblin', level: 2, health: 68, maxHealth: 68, attack: 12, power: 12, defense: 5, rewardGold: 18, rewardExp: 30, dropChance: 0.35, dropItemId: items.get('Daga ágil').id, sortOrder: 3, isBoss: false },
      { name: 'Guardián de Raíz', species: 'Ancestro', level: 3, health: 110, maxHealth: 110, attack: 15, power: 15, defense: 7, rewardGold: 40, rewardExp: 60, dropChance: 1, dropItemId: items.get('Botas ligeras').id, sortOrder: 4, isBoss: true },
    ]],
    [mina.id, [
      { name: 'Murciélago de hollín', species: 'Bestia', level: 3, health: 75, maxHealth: 75, attack: 14, power: 14, defense: 5, rewardGold: 18, rewardExp: 24, dropChance: 0.35, dropItemId: items.get('Botas ligeras').id, sortOrder: 1, isBoss: false },
      { name: 'Minero corrupto', species: 'Humanoide', level: 3, health: 95, maxHealth: 95, attack: 17, power: 17, defense: 7, rewardGold: 24, rewardExp: 30, dropChance: 0.4, dropItemId: items.get('Casco del minero').id, sortOrder: 2, isBoss: false },
      { name: 'Araña de cueva', species: 'Arácnido', level: 4, health: 88, maxHealth: 88, attack: 16, power: 16, defense: 6, rewardGold: 28, rewardExp: 34, dropChance: 0.45, dropItemId: items.get('Poción menor').id, sortOrder: 3, isBoss: false },
      { name: 'Gólem Umbrío', species: 'Constructo', level: 5, health: 135, maxHealth: 135, attack: 19, power: 19, defense: 9, rewardGold: 70, rewardExp: 68, dropChance: 1, dropItemId: items.get('Amuleto umbrío').id, sortOrder: 4, isBoss: true },
    ]],
    [ruinas.id, [
      { name: 'Esqueleto errante', species: 'No muerto', level: 8, health: 160, maxHealth: 160, attack: 23, power: 23, defense: 10, rewardGold: 38, rewardExp: 50, dropChance: 0.45, dropItemId: items.get('Fragmento carmesí').id, sortOrder: 1, isBoss: false },
      { name: 'Cultista sombrío', species: 'Cultista', level: 8, health: 190, maxHealth: 190, attack: 27, power: 27, defense: 12, rewardGold: 48, rewardExp: 62, dropChance: 0.3, dropItemId: items.get('Capa sombría').id, sortOrder: 2, isBoss: false },
      { name: 'Centinela de hueso', species: 'No muerto', level: 9, health: 230, maxHealth: 230, attack: 30, power: 30, defense: 15, rewardGold: 58, rewardExp: 75, dropChance: 0.3, dropItemId: items.get('Guantes del Duelista').id, sortOrder: 3, isBoss: false },
      { name: 'Caballero Carmesí', species: 'Caballero maldito', level: 10, health: 340, maxHealth: 340, attack: 34, power: 34, defense: 18, rewardGold: 120, rewardExp: 140, dropChance: 1, dropItemId: items.get('Amuleto Carmesí').id, sortOrder: 4, isBoss: true },
    ]],
  ]

  const monsterByKey = new Map()
  for (const [zoneId, monsters] of zoneMonsters) {
    for (const monster of monsters) {
      const savedMonster = await upsertMonster(zoneId, monster)
      monsterByKey.set(`${zoneId}:${monster.sortOrder}`, savedMonster)
    }
  }

  const questData = [
    {
      title: 'Derrota 3 Slimes musgosos',
      description: 'Limpia el inicio del Sendero Esmeralda derrotando tres Slimes musgosos.',
      questType: 'MAIN',
      targetType: 'MONSTER_KILL',
      targetMonsterId: monsterByKey.get(`${sendero.id}:1`).id,
      targetZoneId: sendero.id,
      requiredAmount: 3,
      rewardGold: 30,
      rewardExp: 30,
      rewardItemId: items.get('Poción menor').id,
      rewardItemQuantity: 2,
      sortOrder: 1,
      isMainQuest: true,
    },
    {
      title: 'Derrota al Guardián de Raíz',
      description: 'Alcanza el final del sendero y derrota a su guardián ancestral.',
      questType: 'MAIN',
      targetType: 'MONSTER_KILL',
      targetMonsterId: monsterByKey.get(`${sendero.id}:4`).id,
      targetZoneId: sendero.id,
      requiredAmount: 1,
      rewardGold: 75,
      rewardExp: 60,
      rewardItemId: items.get('Anillo del cazador').id,
      rewardItemQuantity: 1,
      sortOrder: 2,
      isMainQuest: true,
    },
    {
      title: 'Explora Mina Umbría',
      description: 'Entra en la Mina Umbría después de conquistar el Sendero Esmeralda.',
      questType: 'MAIN',
      targetType: 'ZONE_ENTER',
      targetMonsterId: null,
      targetZoneId: mina.id,
      requiredAmount: 1,
      rewardGold: 40,
      rewardExp: 30,
      rewardItemId: items.get('Cristal verde').id,
      rewardItemQuantity: 2,
      sortOrder: 3,
      isMainQuest: true,
    },
    {
      title: 'Derrota 3 enemigos en Mina Umbría',
      description: 'Reduce la amenaza de la mina derrotando tres enemigos dentro de la zona.',
      questType: 'ZONE',
      targetType: 'ZONE_KILL',
      targetMonsterId: null,
      targetZoneId: mina.id,
      requiredAmount: 3,
      rewardGold: 90,
      rewardExp: 65,
      rewardItemId: items.get('Amuleto umbrío').id,
      rewardItemQuantity: 1,
      sortOrder: 4,
      isMainQuest: false,
    },
    {
      title: 'Explora Ruinas Carmesí',
      description:
        'Cruza el umbral de las ruinas después de conquistar la Mina Umbría.',
      questType: 'MAIN',
      targetType: 'ZONE_ENTER',
      targetMonsterId: null,
      targetZoneId: ruinas.id,
      requiredAmount: 1,
      rewardGold: 70,
      rewardExp: 70,
      rewardItemId: items.get('Fragmento carmesí').id,
      rewardItemQuantity: 3,
      sortOrder: 5,
      isMainQuest: true,
    },
    {
      title: 'Derrota 3 enemigos en Ruinas Carmesí',
      description:
        'Reduce la presencia de no muertos y cultistas dentro de las ruinas.',
      questType: 'ZONE',
      targetType: 'ZONE_KILL',
      targetMonsterId: null,
      targetZoneId: ruinas.id,
      requiredAmount: 3,
      rewardGold: 140,
      rewardExp: 120,
      rewardItemId: items.get('Capa sombría').id,
      rewardItemQuantity: 1,
      sortOrder: 6,
      isMainQuest: false,
    },
    {
      title: 'Derrota al Caballero Carmesí',
      description:
        'Llega al corazón de las ruinas y derrota al caballero maldito.',
      questType: 'MAIN',
      targetType: 'MONSTER_KILL',
      targetMonsterId: monsterByKey.get(`${ruinas.id}:4`).id,
      targetZoneId: ruinas.id,
      requiredAmount: 1,
      rewardGold: 220,
      rewardExp: 180,
      rewardItemId: items.get('Guantes del Duelista').id,
      rewardItemQuantity: 1,
      sortOrder: 7,
      isMainQuest: true,
    },
  ]

  const quests = []
  for (const quest of questData) {
    quests.push(
      await prisma.quest.upsert({
        where: { title: quest.title },
        update: quest,
        create: quest,
      }),
    )
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
      gold: 35,
      gems: 2,
      health: 110,
      maxHealth: 110,
      energy: 80,
      maxEnergy: 80,
      lastSeenAt: seedTime,
      zoneId: sendero.id,
      currentMonsterOrder: 1,
      baseAttack: 12,
      baseDefense: 4,
      baseMaxHealth: 110,
      baseCritRate: 0.08,
      baseEvasion: 0.05,
      baseAgility: 10,
      basePower: 10,
      attack: 16,
      defense: 4,
      critRate: 0.08,
      evasion: 0.05,
      agility: 10,
      power: 15,
    },
    create: {
      name: 'Kael',
      characterClass: 'Vanguardia',
      level: 1,
      gold: 35,
      gems: 2,
      health: 110,
      maxHealth: 110,
      energy: 80,
      maxEnergy: 80,
      lastSeenAt: seedTime,
      baseAttack: 12,
      baseDefense: 4,
      baseMaxHealth: 110,
      baseCritRate: 0.08,
      baseEvasion: 0.05,
      baseAgility: 10,
      basePower: 10,
      attack: 16,
      defense: 4,
      critRate: 0.08,
      evasion: 0.05,
      agility: 10,
      power: 15,
      currentMonsterOrder: 1,
      userId: user.id,
      zoneId: sendero.id,
    },
  })

  const characters = await prisma.character.findMany()
  for (const currentCharacter of characters) {
    for (const quest of quests) {
      await prisma.characterQuest.upsert({
        where: {
          characterId_questId: {
            characterId: currentCharacter.id,
            questId: quest.id,
          },
        },
        update:
          currentCharacter.id === character.id
            ? { progress: 0, completed: false, claimed: false }
            : {},
        create: {
          characterId: currentCharacter.id,
          questId: quest.id,
        },
      })
    }

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
    await prisma.characterProgress.upsert({
      where: {
        characterId_zoneId: {
          characterId: currentCharacter.id,
          zoneId: ruinas.id,
        },
      },
      update: currentCharacter.id === character.id
        ? {
            unlocked: false,
            completed: false,
            currentMonsterOrder: 1,
            currentMonsterHealth: monsterByKey.get(`${ruinas.id}:1`).maxHealth,
          }
        : {},
      create: {
        characterId: currentCharacter.id,
        zoneId: ruinas.id,
        unlocked: false,
        currentMonsterOrder: 1,
        currentMonsterHealth: monsterByKey.get(`${ruinas.id}:1`).maxHealth,
      },
    })
  }

  const inventoryItems = [
    ['Poción menor', 2],
    ['Espada de aprendiz', 1],
  ]

  await prisma.offlineReward.deleteMany({
    where: { characterId: character.id },
  })

  await prisma.inventoryItem.deleteMany({
    where: { characterId: character.id },
  })

  for (const [name, quantity] of inventoryItems) {
    const item = items.get(name)
    await prisma.inventoryItem.create({
      data: {
        characterId: character.id,
        itemId: item.id,
        stackKey:
          item.type === 'CONSUMABLE'
            ? `${character.id}:${item.id}`
            : null,
        equipped: name === 'Espada de aprendiz',
        slot: name === 'Espada de aprendiz' ? 'WEAPON' : null,
        quantity,
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
    'Seed completado: tienda, equipo, habilidades, 7 misiones, 3 zonas y 12 monstruos.',
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
