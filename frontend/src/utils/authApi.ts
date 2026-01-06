import type { AuthCredentials } from '../types/auth'
import { API_LOGIN_URL, API_REGISTER_URL } from '../constants/env'

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { detail?: string }
    if (payload.detail) {
      return payload.detail
    }
  } catch {
    // ignore JSON parsing errors
  }
  return fallback
}

export const requestToken = async (values: AuthCredentials) => {
  const response = await fetch(API_LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, 'Invalid username or password.')
    throw new Error(message)
  }

  const payload = (await response.json()) as { token?: string }
  if (!payload.token) {
    throw new Error('Login failed.')
  }
  return payload.token
}

export const requestRegister = async (values: AuthCredentials) => {
  const response = await fetch(API_REGISTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, 'Registration failed.')
    throw new Error(message)
  }

  const payload = (await response.json()) as { token?: string }
  if (!payload.token) {
    throw new Error('Registration failed.')
  }
  return payload.token
}
