import { prisma } from '../lib/prisma.js'
import { recalculateCharacterStats } from './equipment.js'
import { getCharacterInventory } from './gameData.js'
import { addItemToInventory } from './inventory.js'
import { serializeCharacter, serializeInventory } from '../utils/serializers.js'

const questInclude = {
  quest: {
    include: {
      targetMonster: { select: { id: true, name: true } },
      targetZone: { select: { id: true, name: true } },
      rewardItem: {
        select: {
          id: true,
          name: true,
          type: true,
          rarity: true,
        },
      },
    },
  },
}

function questError(message, status = 400) {
  return Object.assign(new Error(message), { status })
}

export function serializeCharacterQuest(entry) {
  const { quest } = entry
  return {
    id: entry.id,
    questId: quest.id,
    title: quest.title,
    description: quest.description,
    questType: quest.questType.toLowerCase(),
    targetType: quest.targetType.toLowerCase(),
    targetMonster: quest.targetMonster,
    targetZone: quest.targetZone,
    requiredAmount: quest.requiredAmount,
    progress: Math.min(entry.progress, quest.requiredAmount),
    completed: entry.completed,
    claimed: entry.claimed,
    status: entry.claimed
      ? 'claimed'
      : entry.completed
        ? 'completed'
        : 'in_progress',
    reward: {
      gold: quest.rewardGold,
      experience: quest.rewardExp,
      item: quest.rewardItem
        ? {
            ...quest.rewardItem,
            type: quest.rewardItem.type.toLowerCase(),
            rarity: quest.rewardItem.rarity.toLowerCase(),
            quantity: quest.rewardItemQuantity,
          }
        : null,
    },
    sortOrder: quest.sortOrder,
    isMainQuest: quest.isMainQuest,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }
}

async function loadCharacterQuestRows(characterId, client = prisma) {
  return client.characterQuest.findMany({
    where: { characterId },
    include: questInclude,
    orderBy: [{ quest: { sortOrder: 'asc' } }, { createdAt: 'asc' }],
  })
}

export async function ensureCharacterQuests(character, client = prisma) {
  const quests = await client.quest.findMany({ select: { id: true } })
  if (quests.length) {
    await client.characterQuest.createMany({
      data: quests.map((quest) => ({
        characterId: character.id,
        questId: quest.id,
      })),
      skipDuplicates: true,
    })
  }
}

async function recordQuestEventInternal(
  characterId,
  event,
  client = prisma,
) {
  const rows = await loadCharacterQuestRows(characterId, client)
  const newlyCompleted = []

  for (const entry of rows) {
    if (entry.completed || entry.claimed) continue

    const matches =
      event.type === 'MONSTER_DEFEATED'
        ? (entry.quest.targetType === 'MONSTER_KILL' &&
            entry.quest.targetMonsterId === event.monsterId) ||
          (entry.quest.targetType === 'ZONE_KILL' &&
            entry.quest.targetZoneId === event.zoneId)
        : event.type === 'ZONE_ENTER' &&
          entry.quest.targetType === 'ZONE_ENTER' &&
          entry.quest.targetZoneId === event.zoneId

    if (!matches) continue

    const nextProgress =
      event.type === 'ZONE_ENTER'
        ? entry.quest.requiredAmount
        : Math.min(entry.quest.requiredAmount, entry.progress + 1)
    const completed = nextProgress >= entry.quest.requiredAmount
    const updated = await client.characterQuest.update({
      where: { id: entry.id },
      data: { progress: nextProgress, completed },
      include: questInclude,
    })
    if (completed) newlyCompleted.push(serializeCharacterQuest(updated))
  }

  const quests = (await loadCharacterQuestRows(characterId, client)).map(
    serializeCharacterQuest,
  )
  return { quests, completedQuests: newlyCompleted }
}

export async function getCharacterQuests(character, client = prisma) {
  await ensureCharacterQuests(character, client)
  if (character.zoneId) {
    return recordQuestEventInternal(
      character.id,
      { type: 'ZONE_ENTER', zoneId: character.zoneId },
      client,
    )
  }
  return {
    quests: (await loadCharacterQuestRows(character.id, client)).map(
      serializeCharacterQuest,
    ),
    completedQuests: [],
  }
}

export async function recordMonsterDefeat(
  character,
  monster,
  client = prisma,
) {
  await ensureCharacterQuests(character, client)
  return recordQuestEventInternal(
    character.id,
    {
      type: 'MONSTER_DEFEATED',
      monsterId: monster.id,
      zoneId: monster.zoneId,
    },
    client,
  )
}

export async function recordZoneEntered(character, zoneId, client = prisma) {
  await ensureCharacterQuests(character, client)
  return recordQuestEventInternal(
    character.id,
    { type: 'ZONE_ENTER', zoneId },
    client,
  )
}

export async function shouldRepeatQuestMonster(
  characterId,
  monsterId,
  client = prisma,
) {
  const entry = await client.characterQuest.findFirst({
    where: {
      characterId,
      completed: false,
      claimed: false,
      quest: {
        targetType: 'MONSTER_KILL',
        targetMonsterId: monsterId,
      },
    },
    include: { quest: true },
  })
  return Boolean(entry && entry.progress < entry.quest.requiredAmount)
}

export async function claimCharacterQuest(character, characterQuestId) {
  const entry = await prisma.characterQuest.findFirst({
    where: { id: characterQuestId, characterId: character.id },
    include: questInclude,
  })

  if (!entry) throw questError('La misión no pertenece al personaje.', 404)
  if (!entry.completed) throw questError('La misión todavía no está completada.', 409)
  if (entry.claimed) throw questError('La recompensa ya fue reclamada.', 409)

  return prisma.$transaction(async (transaction) => {
    const claimed = await transaction.characterQuest.updateMany({
      where: {
        id: entry.id,
        characterId: character.id,
        completed: true,
        claimed: false,
      },
      data: { claimed: true },
    })
    if (claimed.count !== 1) {
      throw questError('La recompensa ya fue reclamada.', 409)
    }

    const nextExperience = character.experience + entry.quest.rewardExp
    const nextLevel = Math.max(
      character.level,
      Math.floor(nextExperience / 100) + 1,
    )
    await transaction.character.update({
      where: { id: character.id },
      data: {
        gold: { increment: entry.quest.rewardGold },
        experience: { increment: entry.quest.rewardExp },
        level: nextLevel,
      },
    })

    if (entry.quest.rewardItem && entry.quest.rewardItemQuantity > 0) {
      await addItemToInventory(
        character.id,
        entry.quest.rewardItem,
        entry.quest.rewardItemQuantity,
        transaction,
      )
    }

    const [updatedCharacter, inventory, quests] = await Promise.all([
      recalculateCharacterStats(character.id, transaction),
      getCharacterInventory(character.id, transaction),
      loadCharacterQuestRows(character.id, transaction),
    ])

    return {
      character: serializeCharacter(updatedCharacter),
      inventory: serializeInventory(inventory),
      quests: quests.map(serializeCharacterQuest),
      claimedQuest: serializeCharacterQuest({
        ...entry,
        claimed: true,
      }),
      rewards: {
        gold: entry.quest.rewardGold,
        experience: entry.quest.rewardExp,
        item: entry.quest.rewardItem
          ? {
              id: entry.quest.rewardItem.id,
              name: entry.quest.rewardItem.name,
              quantity: entry.quest.rewardItemQuantity,
            }
          : null,
      },
    }
  })
}
