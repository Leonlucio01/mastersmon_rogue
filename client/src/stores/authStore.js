import { create } from 'zustand'
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from '../services/api'

const TOKEN_KEY = 'mastersmon_token'

function storedToken() {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

function saveToken(token, remember) {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)
}

function friendlyError(error) {
  if (!error.response) return 'No se pudo conectar con el servidor.'
  return error.response.data?.error ?? 'Algo salió mal. Inténtalo de nuevo.'
}

export const useAuthStore = create((set) => ({
  token: storedToken(),
  user: null,
  character: null,
  isChecking: Boolean(storedToken()),
  isSubmitting: false,
  authOpen: !storedToken(),
  error: '',

  checkSession: async () => {
    if (!storedToken()) {
      set({ isChecking: false, authOpen: true })
      return
    }

    try {
      const response = await getCurrentUser()
      set({
        user: response.data.user,
        character: response.data.character,
        isChecking: false,
        authOpen: false,
      })
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
      set({
        token: null,
        user: null,
        character: null,
        isChecking: false,
        authOpen: true,
        error: 'Tu sesión expiró. Vuelve a iniciar sesión.',
      })
    }
  },

  login: async ({ email, password, remember }) => {
    set({ isSubmitting: true, error: '' })
    try {
      const response = await loginUser({ email, password })
      saveToken(response.data.token, remember)
      set({
        token: response.data.token,
        user: response.data.user,
        character: response.data.character,
        authOpen: false,
        isSubmitting: false,
      })
      return true
    } catch (error) {
      set({ error: friendlyError(error), isSubmitting: false })
      return false
    }
  },

  register: async ({ email, password, characterName, remember }) => {
    set({ isSubmitting: true, error: '' })
    try {
      const response = await registerUser({ email, password, characterName })
      saveToken(response.data.token, remember)
      set({
        token: response.data.token,
        user: response.data.user,
        character: response.data.character,
        authOpen: false,
        isSubmitting: false,
      })
      return true
    } catch (error) {
      set({ error: friendlyError(error), isSubmitting: false })
      return false
    }
  },

  continueAsDemo: () => {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    set({
      token: null,
      user: null,
      character: null,
      authOpen: false,
      error: '',
    })
  },

  openAuth: () => set({ authOpen: true, error: '' }),
  clearError: () => set({ error: '' }),

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    set({
      token: null,
      user: null,
      character: null,
      authOpen: true,
      error: '',
    })
  },
}))
