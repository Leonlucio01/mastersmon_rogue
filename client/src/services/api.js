import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 5000,
})

export const getHealth = () => api.get('/health')
export const getCharacter = () => api.get('/character/me')
export const getInventory = () => api.get('/inventory')
export const attackEnemy = () => api.post('/battle/attack')

export default api
