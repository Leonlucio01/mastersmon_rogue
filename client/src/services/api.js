import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 5000,
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('mastersmon_token') ??
    sessionStorage.getItem('mastersmon_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const getHealth = () => api.get('/health')
export const getCharacter = () => api.get('/character/me')
export const getInventory = () => api.get('/inventory')
export const useInventoryItem = (inventoryItemId) =>
  api.post('/inventory/use', { inventoryItemId })
export const getEquipment = () => api.get('/equipment')
export const equipItem = (inventoryItemId) =>
  api.post('/equipment/equip', { inventoryItemId })
export const unequipItem = (inventoryItemId) =>
  api.post('/equipment/unequip', { inventoryItemId })
export const getCurrentBattle = () => api.get('/battle/current')
export const attackEnemy = () => api.post('/battle/attack')
export const useBattleSkill = (skillId) =>
  api.post('/battle/use-skill', { skillId })
export const getSkills = () => api.get('/skills')
export const getNextEnemy = () => api.post('/battle/next')
export const getMapZones = () => api.get('/map/zones')
export const getMapCurrent = () => api.get('/map/current')
export const selectMapZone = (zoneId) => api.post('/map/select-zone', { zoneId })
export const nextMapMonster = () => api.post('/map/next-monster')
export const registerUser = (data) => api.post('/auth/register', data)
export const loginUser = (data) => api.post('/auth/login', data)
export const getCurrentUser = () => api.get('/auth/me')
export const restCharacter = () => api.post('/character/rest')
export const getQuests = () => api.get('/quests')
export const claimQuest = (characterQuestId) =>
  api.post('/quests/claim', { characterQuestId })
export const getOfflineStatus = () => api.get('/offline/status')
export const claimOfflineRewards = () => api.post('/offline/claim')
export const touchOfflineActivity = () => api.post('/offline/touch')
export const getShop = () => api.get('/shop')
export const buyShopItem = (shopItemId, quantity = 1) =>
  api.post('/shop/buy', { shopItemId, quantity })
export const sellShopItem = (inventoryItemId, quantity = 1) =>
  api.post('/shop/sell', { inventoryItemId, quantity })
export const getUpgrade = () => api.get('/upgrade')
export const upgradeEquipment = (inventoryItemId) =>
  api.post('/upgrade/equipment', { inventoryItemId })

export default api
