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
  }
}

export function serializeInventory(items) {
  return items.map(({ item, quantity, equipped, id }) => ({
    inventoryItemId: id,
    id: item.id,
    name: item.name,
    description: item.description,
    type: item.type,
    value: item.value,
    power: item.power,
    quantity,
    equipped,
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
  }
}
