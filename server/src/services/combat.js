import { prisma } from '../lib/prisma.js'
import { getCharacterInventory } from './gameData.js'
import { recalculateCharacterStats } from './equipment.js'
import { getCurrentMapState } from './mapProgress.js'
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
            ? entry.skill.durationTurns
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
  const droppedItem =
    defeated && monster.dropItem && Math.random() < monster.dropChance
      ? monster.dropItem
      : null

  const result = await prisma.$transaction(async (transaction) => {
    const progress = await transaction.characterProgress.update({
      where: { id: state.progress.id },
      data: {
        currentMonsterHealth: remainingHealth,
        completed: defeated && monster.isBoss ? true : state.progress.completed,
      },
    })

    const nextExperience =
      character.experience + (defeated ? monster.rewardExp : 0)
    const nextLevel = Math.max(
      character.level,
      Math.floor(nextExperience / 100) + 1,
    )
    await transaction.character.update({
      where: { id: character.id },
      data: {
        energy: { decrement: selected.skill.energyCost },
        ...(defeated
          ? {
              gold: { increment: monster.rewardGold },
              experience: { increment: monster.rewardExp },
              level: nextLevel,
              basePower: monster.isBoss ? { increment: 2 } : undefined,
            }
          : {}),
      },
    })
    const updatedCharacter = await recalculateCharacterStats(
      character.id,
      transaction,
    )

    if (droppedItem) {
      await transaction.inventoryItem.upsert({
        where: {
          characterId_itemId: {
            characterId: character.id,
            itemId: droppedItem.id,
          },
        },
        update: { quantity: { increment: 1 } },
        create: {
          characterId: character.id,
          itemId: droppedItem.id,
          quantity: 1,
        },
      })
    }

    await transaction.battleLog.create({
      data: {
        characterId: character.id,
        monsterId: monster.id,
        skillId: selected.skill.id,
        skillName: selected.skill.name,
        damage,
        wasCritical,
        monsterDefeated: defeated,
        goldReward: defeated ? monster.rewardGold : 0,
        expReward: defeated ? monster.rewardExp : 0,
        droppedItemId: droppedItem?.id,
        result: isBuff
          ? 'BUFF'
          : defeated
            ? monster.isBoss
              ? 'BOSS_VICTORY'
              : 'VICTORY'
            : 'HIT',
      },
    })

    const updatedSkills = await updateSkillTurns(
      characterSkills,
      selected,
      transaction,
    )

    let unlockedZone = null
    if (defeated && monster.isBoss) {
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

    const inventory = await getCharacterInventory(character.id, transaction)
    return {
      progress,
      updatedCharacter,
      inventory,
      updatedSkills,
      unlockedZone,
    }
  })

  const message = isBuff
    ? `${character.name} activa ${selected.skill.name}: evasión aumentada durante ${selected.skill.durationTurns} turnos.`
    : defeated
      ? monster.isBoss
        ? `${monster.name} cayó ante ${selected.skill.name}. La zona ha sido conquistada.`
        : `${monster.name} ha sido derrotado con ${selected.skill.name}.`
      : `${character.name} usa ${selected.skill.name} contra ${monster.name}.`

  return {
    skill: serializeCharacterSkill(
      result.updatedSkills.find(({ id }) => id === selected.id),
    ),
    skills: result.updatedSkills.map(serializeCharacterSkill),
    activeEffects: getActiveEffects(result.updatedSkills),
    damage,
    wasCritical,
    defeated,
    enemy: serializeMonster({ ...monster, health: remainingHealth }),
    character: serializeCharacter(result.updatedCharacter),
    inventory: serializeInventory(result.inventory),
    rewards: defeated
      ? {
          gold: monster.rewardGold,
          experience: monster.rewardExp,
          power: monster.isBoss ? 2 : 0,
          droppedItem: droppedItem
            ? { id: droppedItem.id, name: droppedItem.name }
            : null,
        }
      : null,
    progress: {
      currentMonsterOrder: result.progress.currentMonsterOrder,
      totalMonsters: state.totalMonsters,
      label: monster.isBoss
        ? 'Boss'
        : `Enemigo ${result.progress.currentMonsterOrder}/${state.totalMonsters}`,
    },
    canAdvance: defeated && !monster.isBoss,
    zoneComplete: defeated && monster.isBoss,
    unlockedZone: result.unlockedZone
      ? { id: result.unlockedZone.id, name: result.unlockedZone.name }
      : null,
    persistence: 'database',
    message,
  }
}
