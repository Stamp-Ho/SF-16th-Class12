const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured.')
}

export type UserInfo = {
  id: number
  username: string
  role: string
  status: string
}

export type LoginResponse = {
  accessToken: string
  tokenType: string
  accessTokenExpiresIn: number
  refreshTokenExpiresIn: number
  user: UserInfo
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

let accessToken: string | null = null

function readErrorMessage(body: unknown, fallback: string) {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body as { message?: unknown }
    if (typeof message === 'string') return message
  }

  return typeof body === 'string' && body ? body : fallback
}

async function readBody(response: Response) {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  includeAuthorization = true,
): Promise<T> {
  const headers = new Headers(init.headers)

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (includeAuthorization && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })
  const body = await readBody(response)

  if (!response.ok) {
    throw new ApiError(readErrorMessage(body, `HTTP ${response.status}`), response.status)
  }

  return body as T
}

export async function login(username: string, password: string) {
  const result = await request<LoginResponse>(
    '/api/users/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    false,
  )
  accessToken = result.accessToken
  return result
}

export async function refreshSession() {
  const result = await request<LoginResponse>(
    '/api/users/refresh',
    { method: 'POST' },
    false,
  )
  accessToken = result.accessToken
  return result
}

export async function logout() {
  try {
    await request<void>('/api/users/logout', { method: 'POST' })
  } finally {
    accessToken = null
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  try {
    return await request<T>(path, init)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error
    }

    await refreshSession()
    return request<T>(path, init)
  }
}