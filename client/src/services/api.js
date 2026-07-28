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
export const getCurrentBattle = () => api.get('/battle/current')
export const attackEnemy = () => api.post('/battle/attack')
export const getNextEnemy = () => api.post('/battle/next')
export const registerUser = (data) => api.post('/auth/register', data)
export const loginUser = (data) => api.post('/auth/login', data)
export const getCurrentUser = () => api.get('/auth/me')

export default api
