import { prisma } from '../lib/prisma.js'
import { serializeCharacter, serializeInventory } from '../utils/serializers.js'
import { recalculateCharacterStats } from './equipment.js'
import { getCharacterInventory } from './gameData.js'

export const OFFLINE_ATTEMPT_SECONDS = 2 * 60
export const OFFLINE_MAX_SECONDS = 4 * 60 * 60
export const OFFLINE_MAX_ATTEMPTS =
  OFFLINE_MAX_SECONDS / OFFLINE_ATTEMPT_SECONDS
export const OFFLINE_REWARD_MULTIPLIER = 0.5
export const OFFLINE_DROP_MULTIPLIER = 0.5

function offlineError(message, status = 400) {
  return Object.assign(new Error(message), { status })
}

function normalizeDrops(drops) {
  if (!Array.isArray(drops)) return []
  return drops
    .filter((drop) => drop?.itemId && drop?.name && drop?.quantity > 0)
    .map((drop) => ({
      itemId: drop.itemId,
      name: drop.name,
      quantity: Math.floor(drop.quantity),
    }))
}

function mergeDrops(currentDrops, generatedDrops) {
  const byItem = new Map()

  for (const drop of [...normalizeDrops(currentDrops), ...generatedDrops]) {
    const current = byItem.get(drop.itemId)
    byItem.set(drop.itemId, {
      itemId: drop.itemId,
      name: drop.name,
      quantity: (current?.quantity ?? 0) + drop.quantity,
    })
  }

  return [...byItem.values()]
}

function emptyStatus(character, now = new Date(), extra = {}) {
  return {
    id: null,
    hasRewards: false,
    zoneName: extra.zoneName ?? null,
    offlineSeconds: 0,
    attempts: 0,
    gold: 0,
    experience: 0,
    drops: [],
    limitApplied: false,
    defeated: character.health <= 0,
    calculatedAt: now,
    lastSeenAt: character.lastSeenAt ?? now,
    maxOfflineSeconds: OFFLINE_MAX_SECONDS,
    maxOfflineHours: OFFLINE_MAX_SECONDS / 3600,
    attemptIntervalSeconds: OFFLINE_ATTEMPT_SECONDS,
  }
}

function serializeOfflineReward(reward, character, extra = {}) {
  if (!reward) return emptyStatus(character, extra.now, extra)

  const drops = normalizeDrops(reward.drops)
  return {
    id: reward.id,
    hasRewards:
      reward.attempts > 0 &&
      (reward.gold > 0 || reward.experience > 0 || drops.length > 0),
    zoneName: reward.zoneName,
    offlineSeconds: reward.offlineSeconds,
    attempts: reward.attempts,
    gold: reward.gold,
    experience: reward.experience,
    drops,
    limitApplied: reward.limitApplied,
    defeated: character.health <= 0,
    calculatedAt: reward.calculatedAt,
    lastSeenAt: character.lastSeenAt,
    maxOfflineSeconds: OFFLINE_MAX_SECONDS,
    maxOfflineHours: OFFLINE_MAX_SECONDS / 3600,
    attemptIntervalSeconds: OFFLINE_ATTEMPT_SECONDS,
  }
}

async function getEligibleFarm(client, character) {
  const progressRows = await client.characterProgress.findMany({
    where: {
      characterId: character.id,
      unlocked: true,
    },
    include: {
      zone: {
        include: {
          monsters: {
            where: { isBoss: false },
            include: { dropItem: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })

  let selectedProgress = progressRows.find(
    (progress) => progress.zoneId === character.zoneId,
  )
  if (!selectedProgress) {
    selectedProgress =
      progressRows.find((progress) => progress.zone.initiallyUnlocked) ??
      progressRows.sort(
        (left, right) => left.zone.sortOrder - right.zone.sortOrder,
      )[0]
  }

  if (selectedProgress) {
    const reachedOrder = Math.max(1, selectedProgress.currentMonsterOrder)
    const monsters = selectedProgress.zone.monsters.filter(
      (monster) => monster.sortOrder <= reachedOrder,
    )
    return {
      zoneName: selectedProgress.zone.name,
      monsters:
        monsters.length > 0
          ? monsters
          : selectedProgress.zone.monsters.slice(0, 1),
    }
  }

  const fallbackZone = await client.zone.findFirst({
    where: { initiallyUnlocked: true },
    include: {
      monsters: {
        where: { isBoss: false },
        include: { dropItem: true },
        orderBy: { sortOrder: 'asc' },
        take: 1,
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return {
    zoneName: fallbackZone?.name ?? 'Sendero Esmeralda',
    monsters: fallbackZone?.monsters ?? [],
  }
}

function generateRewards(monsters, attempts) {
  let gold = 0
  let experience = 0
  const drops = new Map()

  for (let index = 0; index < attempts; index += 1) {
    const monster = monsters[index % monsters.length]
    gold += Math.floor(monster.rewardGold * OFFLINE_REWARD_MULTIPLIER)
    experience += Math.floor(monster.rewardExp * OFFLINE_REWARD_MULTIPLIER)

    if (
      monster.dropItem &&
      Math.random() < monster.dropChance * OFFLINE_DROP_MULTIPLIER
    ) {
      const current = drops.get(monster.dropItem.id)
      drops.set(monster.dropItem.id, {
        itemId: monster.dropItem.id,
        name: monster.dropItem.name,
        quantity: (current?.quantity ?? 0) + 1,
      })
    }
  }

  return { gold, experience, drops: [...drops.values()] }
}

async function calculateWithClient(client, characterId, now) {
  const character = await client.character.findUnique({
    where: { id: characterId },
  })
  if (!character) throw offlineError('No existe un personaje activo.', 404)

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - character.lastSeenAt.getTime()) / 1000),
  )

  const touched = await client.character.updateMany({
    where: {
      id: character.id,
      lastSeenAt: character.lastSeenAt,
    },
    data: { lastSeenAt: now },
  })

  if (touched.count !== 1) {
    const [freshCharacter, pending] = await Promise.all([
      client.character.findUnique({ where: { id: character.id } }),
      client.offlineReward.findUnique({
        where: { pendingKey: character.id },
      }),
    ])
    return serializeOfflineReward(pending, freshCharacter, { now })
  }

  const activeCharacter = { ...character, lastSeenAt: now }
  const pending = await client.offlineReward.findUnique({
    where: { pendingKey: character.id },
  })

  if (character.health <= 0) {
    return serializeOfflineReward(pending, activeCharacter, { now })
  }

  const rawAttempts = Math.floor(elapsedSeconds / OFFLINE_ATTEMPT_SECONDS)
  const pendingAttempts = pending?.attempts ?? 0
  const remainingCapacity = Math.max(
    0,
    OFFLINE_MAX_ATTEMPTS - pendingAttempts,
  )
  const generatedAttempts = Math.min(rawAttempts, remainingCapacity)
  const limitApplied =
    Boolean(pending?.limitApplied) ||
    elapsedSeconds > OFFLINE_MAX_SECONDS ||
    rawAttempts > remainingCapacity

  if (generatedAttempts <= 0) {
    if (pending && limitApplied !== pending.limitApplied) {
      const updated = await client.offlineReward.update({
        where: { id: pending.id },
        data: { limitApplied, calculatedAt: now },
      })
      return serializeOfflineReward(updated, activeCharacter, { now })
    }
    return serializeOfflineReward(pending, activeCharacter, { now })
  }

  const farm = await getEligibleFarm(client, character)
  if (farm.monsters.length === 0) {
    return serializeOfflineReward(pending, activeCharacter, {
      now,
      zoneName: farm.zoneName,
    })
  }

  const generated = generateRewards(farm.monsters, generatedAttempts)
  const zoneName =
    pending && pending.zoneName !== farm.zoneName
      ? 'Varias zonas'
      : farm.zoneName
  const offlineSeconds = Math.min(
    OFFLINE_MAX_SECONDS,
    (pending?.offlineSeconds ?? 0) +
      generatedAttempts * OFFLINE_ATTEMPT_SECONDS,
  )
  const drops = mergeDrops(pending?.drops, generated.drops)

  const reward = await client.offlineReward.upsert({
    where: { pendingKey: character.id },
    update: {
      zoneName,
      calculatedAt: now,
      offlineSeconds,
      attempts: { increment: generatedAttempts },
      gold: { increment: generated.gold },
      experience: { increment: generated.experience },
      drops,
      limitApplied,
    },
    create: {
      characterId: character.id,
      pendingKey: character.id,
      zoneName,
      offlineStartedAt: character.lastSeenAt,
      calculatedAt: now,
      offlineSeconds,
      attempts: generatedAttempts,
      gold: generated.gold,
      experience: generated.experience,
      drops,
      limitApplied,
    },
  })

  return serializeOfflineReward(reward, activeCharacter, { now })
}

export async function calculateOfflineStatus(
  characterId,
  now = new Date(),
) {
  return prisma.$transaction((transaction) =>
    calculateWithClient(transaction, characterId, now),
  )
}

export async function touchCharacterActivity(
  characterId,
  now = new Date(),
) {
  const character = await prisma.character.update({
    where: { id: characterId },
    data: { lastSeenAt: now },
  })
  return { lastSeenAt: character.lastSeenAt }
}

export async function claimOfflineRewards(
  characterId,
  now = new Date(),
) {
  return prisma.$transaction(async (transaction) => {
    await calculateWithClient(transaction, characterId, now)

    const [character, pending] = await Promise.all([
      transaction.character.findUnique({ where: { id: characterId } }),
      transaction.offlineReward.findUnique({
        where: { pendingKey: characterId },
      }),
    ])
    if (!character) throw offlineError('No existe un personaje activo.', 404)
    if (!pending || pending.attempts <= 0) {
      throw offlineError('No hay recompensas offline pendientes.', 409)
    }

    const claimed = await transaction.offlineReward.updateMany({
      where: {
        id: pending.id,
        characterId,
        pendingKey: characterId,
        status: 'PENDING',
      },
      data: {
        pendingKey: null,
        status: 'CLAIMED',
        claimedAt: now,
        calculatedAt: now,
      },
    })
    if (claimed.count !== 1) {
      throw offlineError('Estas recompensas ya fueron reclamadas.', 409)
    }

    const nextExperience = character.experience + pending.experience
    const nextLevel = Math.max(
      character.level,
      Math.floor(nextExperience / 100) + 1,
    )
    await transaction.character.update({
      where: { id: character.id },
      data: {
        gold: { increment: pending.gold },
        experience: { increment: pending.experience },
        level: nextLevel,
        lastSeenAt: now,
      },
    })

    const drops = normalizeDrops(pending.drops)
    for (const drop of drops) {
      await transaction.inventoryItem.upsert({
        where: {
          characterId_itemId: {
            characterId: character.id,
            itemId: drop.itemId,
          },
        },
        update: { quantity: { increment: drop.quantity } },
        create: {
          characterId: character.id,
          itemId: drop.itemId,
          quantity: drop.quantity,
        },
      })
    }

    const [updatedCharacter, inventory] = await Promise.all([
      recalculateCharacterStats(character.id, transaction),
      getCharacterInventory(character.id, transaction),
    ])

    return {
      character: serializeCharacter(updatedCharacter),
      inventory: serializeInventory(inventory),
      claimed: {
        id: pending.id,
        zoneName: pending.zoneName,
        offlineSeconds: pending.offlineSeconds,
        attempts: pending.attempts,
        gold: pending.gold,
        experience: pending.experience,
        drops,
        limitApplied: pending.limitApplied,
      },
      status: emptyStatus(
        { ...updatedCharacter, lastSeenAt: now },
        now,
      ),
      message: `Reclamaste ${pending.gold} de oro y ${pending.experience} EXP del farmeo offline.`,
      persistence: 'database',
    }
  })
}
