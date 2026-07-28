import { prisma } from '../lib/prisma.js'

export const BASIC_ATTACK_NAME = 'Ataque básico'

export function serializeCharacterSkill(characterSkill) {
  const { skill } = characterSkill

  return {
    id: skill.id,
    characterSkillId: characterSkill.id,
    name: skill.name,
    description: skill.description,
    skillType: skill.skillType.toLowerCase(),
    damageMultiplier: skill.damageMultiplier,
    critBonus: skill.critBonus,
    energyCost: skill.energyCost,
    cooldownTurns: skill.cooldownTurns,
    cooldownRemaining: characterSkill.cooldownRemaining,
    requiredLevel: skill.requiredLevel,
    icon: skill.icon,
    evasionBonus: skill.evasionBonus,
    durationTurns: skill.durationTurns,
    activeTurns: characterSkill.activeTurns,
  }
}

export async function ensureCharacterSkills(character, client = prisma) {
  const skills = await client.skill.findMany({
    where: { requiredLevel: { lte: character.level } },
    orderBy: [{ requiredLevel: 'asc' }, { energyCost: 'asc' }],
  })

  if (skills.length) {
    await client.characterSkill.createMany({
      data: skills.map((skill) => ({
        characterId: character.id,
        skillId: skill.id,
      })),
      skipDuplicates: true,
    })
  }

  return client.characterSkill.findMany({
    where: { characterId: character.id },
    include: { skill: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getCharacterSkills(character, client = prisma) {
  const characterSkills = await ensureCharacterSkills(character, client)
  return characterSkills.map(serializeCharacterSkill)
}

export function getActiveEffects(characterSkills) {
  return characterSkills
    .filter(({ activeTurns, skill }) => activeTurns > 0 && skill.evasionBonus > 0)
    .map(({ activeTurns, skill }) => ({
      skillId: skill.id,
      name: skill.name,
      icon: skill.icon,
      activeTurns,
      evasionBonus: skill.evasionBonus,
    }))
}
