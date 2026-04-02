const TOKEN_KEY = 'token'

const isObject = (value) => value !== null && typeof value === 'object'

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY)

export const storeToken = (token) => {
  if (!token) return false
  localStorage.setItem(TOKEN_KEY, token)
  return true
}

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export const extractTokenFromAuthPayload = (payload) => {
  if (!isObject(payload)) return null

  if (typeof payload.token === 'string' && payload.token) return payload.token
  if (typeof payload.access_token === 'string' && payload.access_token) return payload.access_token

  if (isObject(payload.data)) {
    if (typeof payload.data.token === 'string' && payload.data.token) return payload.data.token
    if (typeof payload.data.access_token === 'string' && payload.data.access_token) return payload.data.access_token
  }

  return null
}

export const extractUserFromAuthPayload = (payload) => {
  if (!isObject(payload)) return null

  if (isObject(payload.user)) return payload.user

  if (isObject(payload.data) && isObject(payload.data.user)) {
    return payload.data.user
  }

  if (typeof payload.id !== 'undefined' && typeof payload.username === 'string') {
    return payload
  }

  return null
}