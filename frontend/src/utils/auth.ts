import { AUTH_TOKEN_KEY } from '../constants/auth'

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  return atob(`${normalized}${padding}`)
}

const isTokenExpired = (token: string) => {
  const parts = token.split('.')
  if (parts.length !== 3) return true

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: unknown }
    if (typeof payload.exp !== 'number') return true
    const nowInSeconds = Math.floor(Date.now() / 1000)
    return payload.exp <= nowInSeconds
  } catch {
    return true
  }
}

export const getStoredToken = () => {
  if (typeof window === 'undefined') return ''
  const token = localStorage.getItem(AUTH_TOKEN_KEY) ?? ''
  if (!token) return ''
  if (isTokenExpired(token)) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    return ''
  }
  return token
}

export const setStoredToken = (token: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const clearStoredToken = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
}
