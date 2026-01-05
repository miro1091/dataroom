import { useCallback, useState } from 'react'

import { clearStoredToken, getStoredToken, setStoredToken } from '../utils/auth'

export const useAuthToken = () => {
  const [token, setTokenState] = useState(() => getStoredToken())

  const setToken = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setStoredToken(trimmed)
    setTokenState(trimmed)
  }, [])

  const clearToken = useCallback(() => {
    clearStoredToken()
    setTokenState('')
  }, [])

  return { token, setToken, clearToken }
}
