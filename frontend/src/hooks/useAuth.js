import { create } from 'zustand'
import { authAPI } from '../lib/api'
import {
  clearStoredToken,
  extractTokenFromAuthPayload,
  extractUserFromAuthPayload,
  getStoredToken,
  storeToken,
} from '../lib/authStorage'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: getStoredToken(),
  isLoading: false,
  error: null,
  initialized: false,

  register: async (username, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await authAPI.register(username, email, password)

      const token = extractTokenFromAuthPayload(data)
      const user = extractUserFromAuthPayload(data)
      const tokenSaved = storeToken(token)

      if (!tokenSaved) {
        throw new Error('JWT token was not returned by API')
      }

      set({ token, user, isLoading: false })
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || err.message || 'Registration failed', isLoading: false })
      return false
    }
  },

  login: async (loginValue, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await authAPI.login(loginValue, password)

      const token = extractTokenFromAuthPayload(data)
      const user = extractUserFromAuthPayload(data)
      const tokenSaved = storeToken(token)

      if (!tokenSaved) {
        throw new Error('JWT token was not returned by API')
      }

      set({ token, user, isLoading: false })
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || err.message || 'Login failed', isLoading: false })
      return false
    }
  },

  logout: () => {
    clearStoredToken()
    set({ user: null, token: null, error: null })
  },

  getMe: async () => {
    const token = get().token
    if (!token) {
      set({ initialized: true })
      return false
    }
    try {
      const { data } = await authAPI.getMe()
      set({ user: data, initialized: true })
      return true
    } catch (err) {
      // Token invalid - clear it
      clearStoredToken()
      set({ token: null, user: null, initialized: true, error: null })
      return false
    }
  },

  initAuth: async () => {
    const { token, initialized, getMe } = get()
    if (initialized) return

    const storedToken = token || getStoredToken()
    if (storedToken && storedToken !== token) {
      set({ token: storedToken })
    }

    if (storedToken) {
      await getMe()
    } else {
      set({ initialized: true })
    }
  },
}))

export const useAuth = () => {
  const { user, token, isLoading, error, register, login, logout, getMe, initialized, initAuth } = useAuthStore()
  return {
    user,
    token,
    isLoading,
    error,
    register,
    login,
    logout,
    getMe,
    initialized,
    initAuth,
    isAuthenticated: !!token,
  }
}
