import type { AuthCredentials } from '../types/auth'
import { API_LOGIN_URL } from '../constants/env'

export const requestToken = async (values: AuthCredentials) => {
  const response = await fetch(API_LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  })

  if (!response.ok) {
    throw new Error('Invalid username or password.')
  }

  const payload = (await response.json()) as { token?: string }
  if (!payload.token) {
    throw new Error('Login failed.')
  }
  return payload.token
}
