import { create } from 'zustand'
import { authAPI } from '../lib/api'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  register: async (username, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await authAPI.register(username, email, password)
      localStorage.setItem('token', data.access_token)
      set({ token: data.access_token, user: data.user, isLoading: false })
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Registration failed', isLoading: false })
      return false
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await authAPI.login(username, password)
      localStorage.setItem('token', data.access_token)
      set({ token: data.access_token, user: data.user, isLoading: false })
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Login failed', isLoading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, error: null })
  },

  getMe: async () => {
    try {
      const { data } = await authAPI.getMe()
      set({ user: data })
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch user' })
      return false
    }
  },

  isAuthenticated: () => {
    const state = useAuthStore.getState()
    return !!state.token && !!state.user
  },
}))

export const useAuth = () => {
  const { user, token, isLoading, error, register, login, logout, getMe } = useAuthStore()
  return {
    user,
    token,
    isLoading,
    error,
    register,
    login,
    logout,
    getMe,
    isAuthenticated: !!token && !!user,
  }
}
