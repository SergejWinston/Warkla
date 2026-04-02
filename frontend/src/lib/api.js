import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  login: (login, password) =>
    api.post('/auth/login', { login, username: login, email: login, password }),
  getMe: () => api.get('/auth/me'),
}

export const subjectsAPI = {
  getAll: () => api.get('/subjects'),
  getBySlug: (subjectSlug) => api.get(`/subjects/by-slug/${subjectSlug}`),
  getThemes: (subjectId) => api.get(`/subjects/${subjectId}/themes`),
  getBanner: (subjectSlug) => api.get(`/subjects/${subjectSlug}/banner`),
  sync: () => api.post('/subjects/sync'),
  getProgress: (subjectId) => api.get(`/subjects/${subjectId}/progress`),
}

export const questionsAPI = {
  getPage: ({ subjectSlug, themeId, page = 1, perPage = 15, sortBy = 'id', sortOrder = 'asc' }) =>
    api.get('/questions', {
      params: {
        subject_slug: subjectSlug,
        theme_id: themeId,
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    }),
  getById: (questionId) => api.get(`/questions/${questionId}`),
  getSolution: (questionId) => api.get(`/questions/${questionId}/solution`),
}

export const answersAPI = {
  submit: (questionId, userAnswer) =>
    api.post('/answers', { question_id: questionId, answer: userAnswer }),
  getHistory: (params = {}) => api.get('/answers/history', { params }),
}

export const statsAPI = {
  getOverall: () => api.get('/stats'),
  getBySubjects: () => api.get('/stats/subjects'),
  getBySubject: (subjectId) => api.get(`/stats/subjects/${subjectId}`),
  getByTheme: (themeId) => api.get(`/stats/themes/${themeId}`),
  getStreak: () => api.get('/stats/streak'),
  getLeaderboard: (limit = 10) => api.get('/stats/leaderboard', { params: { limit } }),
}

export default api
