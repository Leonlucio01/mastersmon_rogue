import { prisma } from '../lib/prisma.js'
import { getCharacterInventory } from './gameData.js'
import { recalculateCharacterStats } from './equipment.js'
import { getCurrentMapState } from './mapProgress.js'
import { addItemToInventory } from './inventory.js'
import { recordMonsterDefeat } from './quests.js'
import {
  BASIC_ATTACK_NAME,
  ensureCharacterSkills,
  getActiveEffects,
  serializeCharacterSkill,
} from './skills.js'
import {
  serializeCharacter,
  serializeInventory,
  serializeMonster,
} from '../utils/serializers.js'

function combatError(message, status = 400, details = {}) {
  return Object.assign(new Error(message), { status, ...details })
}

export const NORMAL_ENERGY_RECOVERY = 8
export const BOSS_ENERGY_RECOVERY = 20

async function updateSkillTurns(characterSkills, usedCharacterSkill, transaction) {
  const updates = characterSkills.map((entry) => {
    const isUsed = entry.id === usedCharacterSkill.id
    return transaction.characterSkill.update({
      where: { id: entry.id },
      data: {
        cooldownRemaining: isUsed
          ? entry.skill.cooldownTurns
          : Math.max(0, entry.cooldownRemaining - 1),
        activeTurns:
          isUsed && entry.skill.skillType === 'BUFF'
            ? Math.max(0, entry.skill.durationTurns - 1)
            : Math.max(0, entry.activeTurns - 1),
      },
      include: { skill: true },
    })
  })

  return Promise.all(updates)
}

export async function executeCombatAction(character, skillId) {
  const state = await getCurrentMapState(character)
  const monster = state.monster
  const isReplay = Boolean(state.progress.completed)
  const isReplayBoss = isReplay && monster.isBoss

  if (character.health <= 0) {
    throw combatError(
      'Has sido derrotado. Descansa o usa un consumible antes de continuar.',
      409,
      { playerDefeated: true },
    )
  }

  if (state.progress.currentMonsterHealth <= 0) {
    throw combatError(
      monster.isBoss
        ? 'El boss fue derrotado. Selecciona la siguiente zona.'
        : 'El enemigo fue derrotado. Avanza al siguiente.',
      409,
      {
        canAdvance: !monster.isBoss,
        zoneComplete: monster.isBoss,
      },
    )
  }

  const characterSkills = await ensureCharacterSkills(character)
  const selected = characterSkills.find(({ skill }) =>
    skillId ? skill.id === skillId : skill.name === BASIC_ATTACK_NAME,
  )

  if (!selected) {
    throw combatError(
      skillId
        ? 'La habilidad no pertenece al personaje o todavía no está disponible.'
        : 'Ataque básico no está configurado. Ejecuta el seed.',
      skillId ? 403 : 503,
    )
  }
  if (character.level < selected.skill.requiredLevel) {
    throw combatError(`Necesitas nivel ${selected.skill.requiredLevel} para usar esta habilidad.`, 403)
  }
  if (selected.cooldownRemaining > 0) {
    throw combatError(
      `${selected.skill.name} estará disponible en ${selected.cooldownRemaining} turno(s).`,
      409,
    )
  }
  if (character.energy < selected.skill.energyCost) {
    throw combatError(`Energía insuficiente: necesitas ${selected.skill.energyCost}.`, 409)
  }

  const isBuff = selected.skill.skillType === 'BUFF'
  const variance = Math.floor(Math.random() * 4) - 1
  const baseDamage = Math.max(1, character.attack - monster.defense + variance)
  const criticalChance = Math.min(
    1,
    Math.max(0, (character.critRate || 0) + selected.skill.critBonus),
  )
  const wasCritical = !isBuff && Math.random() < criticalChance
  const damage = isBuff
    ? 0
    : Math.max(
        1,
        Math.round(
          baseDamage *
            selected.skill.damageMultiplier *
            (wasCritical ? 1.5 : 1),
        ),
      )
  const remainingHealth = Math.max(
    0,
    state.progress.currentMonsterHealth - damage,
  )
  const defeated = !isBuff && remainingHealth === 0
  const rewardGold =
    defeated && isReplayBoss
      ? Math.max(1, Math.floor(monster.rewardGold * 0.25))
      : defeated
        ? monster.rewardGold
        : 0
  const rewardExp =
    defeated && isReplayBoss
      ? Math.max(1, Math.floor(monster.rewardExp * 0.25))
      : defeated
        ? monster.rewardExp
        : 0
  const rewardPower = defeated && monster.isBoss && !isReplayBoss ? 2 : 0
  const energyAfterCost = Math.max(
    0,
    character.energy - selected.skill.energyCost,
  )
  const requestedEnergyRecovery = defeated
    ? monster.isBoss
      ? BOSS_ENERGY_RECOVERY
      : NORMAL_ENERGY_RECOVERY
    : 0
  const currentEnergy = Math.min(
    character.maxEnergy,
    energyAfterCost + requestedEnergyRecovery,
  )
  const energyRecovered = currentEnergy - energyAfterCost
  const droppedItem =
    defeated &&
    !isReplayBoss &&
    monster.dropItem &&
    Math.random() < monster.dropChance
      ? monster.dropItem
      : null
  const activeEvasionBonus = characterSkills.reduce(
    (total, entry) =>
      total +
      (entry.activeTurns > 0 && entry.skill.evasionBonus > 0
        ? entry.skill.evasionBonus
        : 0),
    0,
  )
  const selectedEvasionBonus = isBuff ? selected.skill.evasionBonus : 0
  const evasionChance = Math.min(
    0.95,
    Math.max(0, character.evasion + activeEvasionBonus + selectedEvasionBonus),
  )
  const playerEvaded = !defeated && Math.random() < evasionChance
  const monsterAttack = monster.attack ?? monster.power
  const enemyDamage =
    defeated || playerEvaded
      ? 0
      : Math.max(1, monsterAttack - character.defense)
  const remainingPlayerHealth = Math.max(0, character.health - enemyDamage)
  const playerDefeated = remainingPlayerHealth === 0
  const battleResult = playerDefeated
    ? 'PLAYER_DEFEATED'
    : defeated
      ? monster.isBoss
        ? 'BOSS_VICTORY'
        : 'VICTORY'
      : playerEvaded
        ? 'EVADED'
        : isBuff
          ? 'BUFF'
          : 'HIT'

  const result = await prisma.$transaction(async (transaction) => {
    const progress = await transaction.characterProgress.update({
      where: { id: state.progress.id },
      data: {
        currentMonsterHealth: remainingHealth,
        completed: defeated && monster.isBoss ? true : state.progress.completed,
      },
    })

    const nextExperience = character.experience + rewardExp
    const nextLevel = Math.max(
      character.level,
      Math.floor(nextExperience / 100) + 1,
    )
    await transaction.character.update({
      where: { id: character.id },
      data: {
        energy: currentEnergy,
        health: remainingPlayerHealth,
        ...(defeated
          ? {
              gold: { increment: rewardGold },
              experience: { increment: rewardExp },
              level: nextLevel,
              basePower: rewardPower > 0 ? { increment: rewardPower } : undefined,
            }
          : {}),
      },
    })
    const updatedCharacter = await recalculateCharacterStats(
      character.id,
      transaction,
    )

    if (droppedItem) {
      await addItemToInventory(character.id, droppedItem, 1, transaction)
    }

    await transaction.battleLog.create({
      data: {
        characterId: character.id,
        monsterId: monster.id,
        skillId: selected.skill.id,
        skillName: selected.skill.name,
        damage,
        enemyDamage,
        wasCritical,
        playerEvaded,
        playerDefeated,
        monsterDefeated: defeated,
        goldReward: rewardGold,
        expReward: rewardExp,
        droppedItemId: droppedItem?.id,
        result: battleResult,
      },
    })

    const questProgress = defeated
      ? await recordMonsterDefeat(character, monster, transaction)
      : null

    const updatedSkills = await updateSkillTurns(
      characterSkills,
      selected,
      transaction,
    )

    let unlockedZone = null
    if (defeated && monster.isBoss && !isReplayBoss) {
      unlockedZone = await transaction.zone.findFirst({
        where: { sortOrder: { gt: state.zone.sortOrder } },
        orderBy: { sortOrder: 'asc' },
      })
      if (unlockedZone) {
        await transaction.characterProgress.upsert({
          where: {
            characterId_zoneId: {
              characterId: character.id,
              zoneId: unlockedZone.id,
            },
          },
          update: { unlocked: true },
          create: {
            characterId: character.id,
            zoneId: unlockedZone.id,
            unlocked: true,
            currentMonsterOrder: 1,
          },
        })
      }
    }

    const [availableZoneCount, completedZoneCount] = await Promise.all([
      transaction.zone.count(),
      transaction.characterProgress.count({
        where: { characterId: character.id, completed: true },
      }),
    ])
    const inventory = await getCharacterInventory(character.id, transaction)
    return {
      progress,
      updatedCharacter,
      inventory,
      updatedSkills,
      unlockedZone,
      questProgress,
      allContentCompleted:
        availableZoneCount > 0 &&
        completedZoneCount >= availableZoneCount,
    }
  })

  const actionMessage = isBuff
    ? `${character.name} activa ${selected.skill.name}.`
    : defeated
      ? monster.isBoss
        ? isReplayBoss
          ? `${monster.name} fue derrotado de nuevo con ${selected.skill.name}. El farmeo ha terminado.`
          : `${monster.name} cayó ante ${selected.skill.name}. La zona ha sido conquistada.`
        : `${monster.name} ha sido derrotado con ${selected.skill.name}.`
      : `${character.name} usa ${selected.skill.name} contra ${monster.name}.`
  const counterMessage = defeated
    ? ''
    : playerEvaded
      ? ' Esquivaste el contraataque.'
      : playerDefeated
        ? ` ${monster.name} inflige ${enemyDamage} de daño. Has sido derrotado.`
        : ` ${monster.name} contraataca e inflige ${enemyDamage} de daño.`
  const energyMessage =
    energyRecovered > 0
      ? ` Recuperaste +${energyRecovered} de energía.`
      : ''
  const message = `${actionMessage}${counterMessage}${energyMessage}`
  const serializedDrop = droppedItem
    ? {
        id: droppedItem.id,
        name: droppedItem.name,
        rarity: droppedItem.rarity.toLowerCase(),
        type: droppedItem.type.toLowerCase(),
        quantity: 1,
        bossDrop: monster.isBoss,
      }
    : null

  return {
    skillName: selected.skill.name,
    skill: serializeCharacterSkill(
      result.updatedSkills.find(({ id }) => id === selected.id),
    ),
    skills: result.updatedSkills.map(serializeCharacterSkill),
    activeEffects: getActiveEffects(result.updatedSkills),
    damage,
    enemyDamage,
    wasCritical,
    playerEvaded,
    playerDefeated,
    monsterDefeated: defeated,
    healedAmount: 0,
    energyRecovered,
    currentEnergy: result.updatedCharacter.energy,
    maxEnergy: result.updatedCharacter.maxEnergy,
    droppedItem: serializedDrop,
    droppedItemName: serializedDrop?.name ?? null,
    droppedItemRarity: serializedDrop?.rarity ?? null,
    droppedItemType: serializedDrop?.type ?? null,
    droppedItemQuantity: serializedDrop?.quantity ?? 0,
    result: battleResult,
    quests: result.questProgress?.quests,
    completedQuests: result.questProgress?.completedQuests ?? [],
    evasionChance,
    defeated,
    enemy: serializeMonster({ ...monster, health: remainingHealth }),
    character: serializeCharacter(result.updatedCharacter),
    inventory: serializeInventory(result.inventory),
    rewards: defeated
      ? {
          gold: rewardGold,
          experience: rewardExp,
          power: rewardPower,
          reduced: isReplayBoss,
          droppedItem: serializedDrop,
        }
      : null,
    progress: {
      currentMonsterOrder: result.progress.currentMonsterOrder,
      totalMonsters: state.totalMonsters,
      completed: result.progress.completed,
      replayMode: isReplay,
      label: monster.isBoss
        ? 'Boss'
        : `Enemigo ${result.progress.currentMonsterOrder}/${state.totalMonsters}`,
    },
    canAdvance: defeated && !monster.isBoss,
    zoneComplete: defeated && monster.isBoss,
    replayMode: isReplay,
    allContentCompleted: Boolean(result.allContentCompleted),
    unlockedZone: result.unlockedZone
      ? { id: result.unlockedZone.id, name: result.unlockedZone.name }
      : null,
    persistence: 'database',
    message,
  }
}
