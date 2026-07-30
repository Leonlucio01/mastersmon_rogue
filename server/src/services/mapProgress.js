import { prisma } from '../lib/prisma.js'
import { serializeMonster } from '../utils/serializers.js'
import { shouldRepeatQuestMonster } from './quests.js'

export async function ensureCharacterProgress(character, client = prisma) {
  const zones = await client.zone.findMany({ orderBy: { sortOrder: 'asc' } })
  const existingRows = await client.characterProgress.findMany({
    where: { characterId: character.id },
  })
  const progressByZone = new Map(
    existingRows.map((progress) => [progress.zoneId, progress]),
  )

  for (const zone of zones) {
    if (!progressByZone.has(zone.id)) {
      const created = await client.characterProgress.create({
        data: {
          characterId: character.id,
          zoneId: zone.id,
          unlocked: zone.initiallyUnlocked,
          currentMonsterOrder: 1,
        },
      })
      progressByZone.set(zone.id, created)
    }
  }

  // Repara progresos antiguos cuando se agrega una zona después de que el
  // personaje ya derrotó al boss anterior.
  for (const [index, zone] of zones.entries()) {
    const progress = progressByZone.get(zone.id)
    const previousProgress =
      index > 0 ? progressByZone.get(zones[index - 1].id) : null
    const shouldBeUnlocked =
      zone.initiallyUnlocked || Boolean(previousProgress?.completed)

    if (shouldBeUnlocked && !progress.unlocked) {
      const updated = await client.characterProgress.update({
        where: { id: progress.id },
        data: { unlocked: true },
      })
      progressByZone.set(zone.id, updated)
    }
  }
}

export async function getCurrentMapState(character, client = prisma) {
  await ensureCharacterProgress(character, client)
  const zone =
    (character.zoneId &&
      (await client.zone.findUnique({
        where: { id: character.zoneId },
        include: {
          monsters: {
            include: { dropItem: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      }))) ||
    (await client.zone.findFirst({
      where: { initiallyUnlocked: true },
      include: {
        monsters: {
          include: { dropItem: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }))

  if (!zone) throw new Error('No hay zonas disponibles. Ejecuta el seed.')

  let progress = await client.characterProgress.findUnique({
    where: {
      characterId_zoneId: {
        characterId: character.id,
        zoneId: zone.id,
      },
    },
  })

  if (!progress?.unlocked) {
    throw new Error('La zona actual todavía está bloqueada.')
  }

  const monster =
    zone.monsters.find(
      (candidate) => candidate.sortOrder === progress.currentMonsterOrder,
    ) ?? zone.monsters[0]

  if (!monster) throw new Error('La zona no tiene enemigos.')

  if (
    progress.currentMonsterOrder !== monster.sortOrder ||
    progress.currentMonsterHealth === null
  ) {
    progress = await client.characterProgress.update({
      where: { id: progress.id },
      data: {
        currentMonsterOrder: monster.sortOrder,
        currentMonsterHealth: monster.maxHealth,
      },
    })
  }

  const [zoneCount, completedZoneCount] = await Promise.all([
    client.zone.count(),
    client.characterProgress.count({
      where: { characterId: character.id, completed: true },
    }),
  ])

  return {
    zone,
    progress,
    monster: {
      ...monster,
      health: progress.currentMonsterHealth,
    },
    totalMonsters: zone.monsters.length,
    allContentCompleted:
      zoneCount > 0 && completedZoneCount >= zoneCount,
  }
}

export async function getZonesForCharacter(character, client = prisma) {
  await ensureCharacterProgress(character, client)
  const [zones, progressRows] = await Promise.all([
    client.zone.findMany({
      include: {
        monsters: {
          select: { id: true, name: true, sortOrder: true, isBoss: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }),
    client.characterProgress.findMany({
      where: { characterId: character.id },
    }),
  ])
  const progressByZone = new Map(progressRows.map((row) => [row.zoneId, row]))

  return zones.map((zone) => {
    const progress = progressByZone.get(zone.id)
    const meetsRequirements =
      character.level >= zone.requiredLevel && character.power >= zone.requiredPower
    return {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      requiredLevel: zone.requiredLevel,
      requiredPower: zone.requiredPower,
      order: zone.sortOrder,
      initiallyUnlocked: zone.initiallyUnlocked,
      unlocked: Boolean(progress?.unlocked),
      completed: Boolean(progress?.completed),
      selected: character.zoneId === zone.id,
      replaying: Boolean(
        progress?.completed &&
          character.zoneId === zone.id &&
          (progress.currentMonsterHealth ?? 0) > 0,
      ),
      currentMonsterOrder: progress?.currentMonsterOrder ?? 1,
      totalMonsters: zone.monsters.length,
      meetsRequirements,
      available: Boolean(progress?.unlocked && meetsRequirements),
      monsters: zone.monsters.map((monster) => ({
        id: monster.id,
        name: monster.name,
        order: monster.sortOrder,
        isBoss: monster.isBoss,
      })),
    }
  })
}

export async function selectCharacterZone(character, zoneId) {
  await ensureCharacterProgress(character)
  const zone = await prisma.zone.findUnique({ where: { id: zoneId } })
  const progress = await prisma.characterProgress.findUnique({
    where: {
      characterId_zoneId: {
        characterId: character.id,
        zoneId,
      },
    },
  })

  if (!zone || !progress) {
    const error = new Error('La zona seleccionada no existe.')
    error.status = 404
    throw error
  }
  if (!progress.unlocked) {
    const error = new Error('Derrota al boss anterior para desbloquear esta zona.')
    error.status = 403
    throw error
  }
  if (character.level < zone.requiredLevel || character.power < zone.requiredPower) {
    const error = new Error(
      `Necesitas nivel ${zone.requiredLevel} y poder ${zone.requiredPower}.`,
    )
    error.status = 403
    throw error
  }

  await prisma.character.update({
    where: { id: character.id },
    data: {
      zoneId,
      currentMonsterOrder: progress.currentMonsterOrder,
    },
  })

  return getCurrentMapState({ ...character, zoneId })
}

export async function replayCharacterZone(character, zoneId) {
  await ensureCharacterProgress(character)
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
    include: { monsters: { orderBy: { sortOrder: 'asc' } } },
  })
  const progress = await prisma.characterProgress.findUnique({
    where: {
      characterId_zoneId: {
        characterId: character.id,
        zoneId,
      },
    },
  })

  if (!zone || !progress) {
    const error = new Error('La zona seleccionada no existe.')
    error.status = 404
    throw error
  }
  if (!progress.unlocked || !progress.completed) {
    const error = new Error(
      'Solo puedes farmear una zona que ya hayas completado.',
    )
    error.status = 409
    throw error
  }
  if (
    character.level < zone.requiredLevel ||
    character.power < zone.requiredPower
  ) {
    const error = new Error(
      `Necesitas nivel ${zone.requiredLevel} y poder ${zone.requiredPower}.`,
    )
    error.status = 403
    throw error
  }

  const firstMonster = zone.monsters.find((monster) => !monster.isBoss)
  if (!firstMonster) {
    const error = new Error('La zona no tiene enemigos normales para farmear.')
    error.status = 409
    throw error
  }

  const [, updatedCharacter] = await prisma.$transaction([
    prisma.characterProgress.update({
      where: { id: progress.id },
      data: {
        currentMonsterOrder: firstMonster.sortOrder,
        currentMonsterHealth: firstMonster.maxHealth,
        // La conquista es permanente; solo se reinicia la ruta de combate.
        completed: true,
      },
    }),
    prisma.character.update({
      where: { id: character.id },
      data: {
        zoneId,
        currentMonsterOrder: firstMonster.sortOrder,
      },
    }),
  ])

  return getCurrentMapState(updatedCharacter)
}

export async function advanceCharacterMonster(character) {
  const state = await getCurrentMapState(character)
  if (state.progress.currentMonsterHealth > 0) {
    const error = new Error('Derrota al enemigo actual antes de avanzar.')
    error.status = 409
    throw error
  }
  if (state.monster.isBoss) {
    const error = new Error('Zona completada. Selecciona la siguiente zona.')
    error.status = 409
    error.zoneComplete = true
    throw error
  }

  if (
    await shouldRepeatQuestMonster(character.id, state.monster.id)
  ) {
    await prisma.characterProgress.update({
      where: { id: state.progress.id },
      data: { currentMonsterHealth: state.monster.maxHealth },
    })
    return getCurrentMapState(character)
  }

  const nextMonster = state.zone.monsters.find(
    (monster) => monster.sortOrder === state.monster.sortOrder + 1,
  )
  if (!nextMonster) {
    const error = new Error('No existe un siguiente enemigo en esta zona.')
    error.status = 409
    throw error
  }

  const [, updatedCharacter] = await prisma.$transaction([
    prisma.characterProgress.update({
      where: { id: state.progress.id },
      data: {
        currentMonsterOrder: nextMonster.sortOrder,
        currentMonsterHealth: nextMonster.maxHealth,
      },
    }),
    prisma.character.update({
      where: { id: character.id },
      data: { currentMonsterOrder: nextMonster.sortOrder },
    }),
  ])

  return getCurrentMapState(updatedCharacter)
}

export function serializeMapState(state) {
  return {
    zone: {
      id: state.zone.id,
      name: state.zone.name,
      description: state.zone.description,
      order: state.zone.sortOrder,
      requiredLevel: state.zone.requiredLevel,
      requiredPower: state.zone.requiredPower,
    },
    progress: {
      currentMonsterOrder: state.progress.currentMonsterOrder,
      totalMonsters: state.totalMonsters,
      completed: state.progress.completed,
      replayMode: Boolean(
        state.progress.completed &&
          (state.progress.currentMonsterHealth ?? 0) > 0,
      ),
      label: state.monster.isBoss
        ? 'Boss'
        : `Enemigo ${state.progress.currentMonsterOrder}/${state.totalMonsters}`,
    },
    enemy: serializeMonster(state.monster),
    allContentCompleted: Boolean(state.allContentCompleted),
    persistence: 'database',
  }
}
