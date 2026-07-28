export function serializeCharacter(character) {
  if (!character) return null

  return {
    id: character.id,
    name: character.name,
    class: character.characterClass,
    level: character.level,
    experience: character.experience,
    gold: character.gold,
    gems: character.gems,
    health: character.health,
    maxHealth: character.maxHealth,
    energy: character.energy,
    maxEnergy: character.maxEnergy,
    attack: character.attack,
    defense: character.defense,
    critRate: character.critRate,
    evasion: character.evasion,
    agility: character.agility,
    power: character.power,
    currentZoneId: character.zoneId,
    currentMonsterOrder: character.currentMonsterOrder,
    baseStats: {
      attack: character.baseAttack,
      defense: character.baseDefense,
      maxHealth: character.baseMaxHealth,
      critRate: character.baseCritRate,
      evasion: character.baseEvasion,
      agility: character.baseAgility,
      power: character.basePower,
    },
  }
}

export function serializeInventory(items) {
  return items.map(({ item, quantity, equipped, slot, id }) => ({
    inventoryItemId: id,
    id: item.id,
    name: item.name,
    description: item.description,
    type: item.type,
    itemType: item.type.toLowerCase(),
    rarity: item.rarity.toLowerCase(),
    value: item.value,
    power: item.power,
    bonuses: {
      attack: item.attackBonus,
      defense: item.defenseBonus,
      health: item.healthBonus,
      crit: item.critBonus,
      evasion: item.evasionBonus,
      agility: item.agilityBonus,
      power: item.powerBonus,
    },
    quantity,
    equipped,
    slot: slot?.toLowerCase() ?? null,
  }))
}

export function serializeMonster(monster) {
  if (!monster) return null

  return {
    id: monster.id,
    name: monster.name,
    species: monster.species,
    level: monster.level,
    health: monster.health,
    maxHealth: monster.maxHealth,
    power: monster.power,
    defense: monster.defense,
    order: monster.sortOrder,
    isBoss: monster.isBoss,
    rewardGold: monster.rewardGold,
    rewardExp: monster.rewardExp,
  }
}
