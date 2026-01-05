export const API_GRAPHQL_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/graphql'

const parsed = new URL(API_GRAPHQL_URL)
const basePath = parsed.pathname.replace(/\/graphql\/?$/, '')

export const API_BASE_URL = `${parsed.origin}${basePath}`
export const API_LOGIN_URL = `${API_BASE_URL}/auth/login`
