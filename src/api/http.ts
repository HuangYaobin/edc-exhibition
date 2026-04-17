import { useAuth } from '@/composables/useAuth'

export class ApiError extends Error {
  statusCode: number
  payload: unknown

  constructor(statusCode: number, message: string, payload?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.payload = payload
    this.name = 'ApiError'
  }
}

interface ApiEnvelope<T> {
  statusCode: number
  message: string
  data: T
  errors?: unknown
  timestamp?: string
  path?: string
}

export interface RequestOptions extends Omit<RequestInit, 'headers' | 'body'> {
  headers?: Record<string, string>
  body?: unknown
  auth?: boolean
}

async function parseJsonSafe(res: Response): Promise<any | null> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function doFetch(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { ...(options.headers || {}) }
  const hasBody = options.body !== undefined && options.body !== null
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  if (hasBody && !isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let body: BodyInit | undefined
  if (hasBody) {
    body = isFormData ? (options.body as FormData) : JSON.stringify(options.body)
  }

  const init: RequestInit = {
    ...options,
    headers,
    body,
  }

  return fetch(path, init)
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, ...rest } = options
  const { accessToken, refresh, ensureAuth } = useAuth()

  if (auth) {
    await ensureAuth()
  }

  let res = await doFetch(path, rest, auth ? accessToken.value : null)

  if (auth && res.status === 401) {
    const refreshed = await refresh()
    if (refreshed) {
      res = await doFetch(path, rest, accessToken.value)
    } else {
      try {
        await ensureAuth()
        res = await doFetch(path, rest, accessToken.value)
      } catch (error) {
        throw new ApiError(401, error instanceof Error ? error.message : '未登录', error)
      }
    }
  }

  const json = await parseJsonSafe(res) as ApiEnvelope<T> | T | null

  if (!res.ok) {
    const message = (json as ApiEnvelope<T>)?.message ?? `请求失败: ${res.status}`
    throw new ApiError(res.status, message, json)
  }

  if (json && typeof json === 'object' && 'data' in (json as object) && 'statusCode' in (json as object)) {
    return (json as ApiEnvelope<T>).data
  }
  return json as T
}
