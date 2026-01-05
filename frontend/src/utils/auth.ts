import { AUTH_TOKEN_KEY } from '../constants/auth'

export const getStoredToken = () => {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? ''
}

export const setStoredToken = (token: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const clearStoredToken = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
}
