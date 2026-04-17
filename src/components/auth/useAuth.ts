import { computed, ref } from 'vue'
import { openLoginDialog } from '@/composables/useLoginDialog'

const STORAGE_KEY = 'auth.v1'
const REFRESH_LEEWAY_MS = 30 * 1000

export interface AuthUser {
  id: string
  phone: string | null
  email: string | null
  nickname: string | null
  avatarUrl: string | null
  createdAt: string
}

interface PersistedState {
  identifier?: string | null
  accessToken?: string | null
  refreshToken?: string | null
  expiresAt?: number | null
  user?: AuthUser | null
}

interface LoginResponseData {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: AuthUser
}

interface ApiEnvelope<T> {
  statusCode: number
  message: string
  data: T
}

const identifier = ref<string | null>(null)
const accessToken = ref<string | null>(null)
const refreshToken = ref<string | null>(null)
const expiresAt = ref<number | null>(null)
const user = ref<AuthUser | null>(null)

function loadFromStorage() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as PersistedState
    identifier.value = parsed.identifier ?? null
    accessToken.value = parsed.accessToken ?? null
    refreshToken.value = parsed.refreshToken ?? null
    expiresAt.value = parsed.expiresAt ?? null
    user.value = parsed.user ?? null
  } catch (error) {
    console.warn('Failed to load auth state:', error)
  }
}

function persist() {
  if (typeof window === 'undefined') return
  const state: PersistedState = {
    identifier: identifier.value,
    accessToken: accessToken.value,
    refreshToken: refreshToken.value,
    expiresAt: expiresAt.value,
    user: user.value,
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to persist auth state:', error)
  }
}

loadFromStorage()

const isLoggedIn = computed(
  () => !!accessToken.value && !!expiresAt.value && expiresAt.value > Date.now(),
)

const hasRefreshToken = computed(() => !!refreshToken.value)
const hasIdentifier = computed(() => !!identifier.value)

function applyTokens(data: LoginResponseData) {
  accessToken.value = data.accessToken
  refreshToken.value = data.refreshToken
  expiresAt.value = Date.now() + Math.max(0, (data.expiresIn - 30)) * 1000
  user.value = data.user
  if (data.user.phone) identifier.value = data.user.phone
  else if (data.user.email) identifier.value = data.user.email
  persist()
}

function clearTokens() {
  accessToken.value = null
  refreshToken.value = null
  expiresAt.value = null
  user.value = null
  persist()
}

function clearAll() {
  identifier.value = null
  clearTokens()
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let json: ApiEnvelope<T> | null = null
  try {
    json = await res.json()
  } catch {
    json = null
  }
  if (!res.ok || !json) {
    const message = json?.message ?? `请求失败: ${res.status}`
    throw new Error(message)
  }
  return json.data
}

export function isValidIdentifier(value: string): boolean {
  const v = value.trim()
  if (/^1[3-9]\d{9}$/.test(v)) return true
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return true
  return false
}

async function login(rawIdentifier: string): Promise<void> {
  const value = rawIdentifier.trim()
  if (!isValidIdentifier(value)) {
    throw new Error('请输入有效的手机号或邮箱')
  }
  const data = await postJson<LoginResponseData>('/api/auth/login', { identifier: value })
  identifier.value = value
  applyTokens(data)
}

let refreshing: Promise<boolean> | null = null

async function refresh(): Promise<boolean> {
  if (!refreshToken.value) return false
  if (refreshing) return refreshing
  refreshing = (async () => {
    try {
      const data = await postJson<LoginResponseData>('/api/auth/refresh', {
        refreshToken: refreshToken.value,
      })
      applyTokens(data)
      return true
    } catch (error) {
      console.warn('Refresh token failed:', error)
      clearTokens()
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

async function logout(): Promise<void> {
  const token = accessToken.value
  const rt = refreshToken.value
  clearAll()
  if (!token || !rt) return
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ refreshToken: rt }),
    })
  } catch (error) {
    console.warn('Logout request failed (token already cleared locally):', error)
  }
}

function forgetIdentifier() {
  identifier.value = null
  persist()
}

async function ensureAuth(): Promise<void> {
  if (isLoggedIn.value) return
  if (hasRefreshToken.value) {
    const ok = await refresh()
    if (ok) return
  }
  await openLoginDialog()
}

function maskedIdentifier(): string | null {
  const value = identifier.value
  if (!value) return null
  if (value.includes('@')) {
    const [name, domain] = value.split('@')
    if (!name) return value
    const head = name.slice(0, Math.min(2, name.length))
    return `${head}***@${domain}`
  }
  if (/^\d{11}$/.test(value)) {
    return `${value.slice(0, 3)}****${value.slice(-4)}`
  }
  return value
}

export function useAuth() {
  return {
    identifier,
    accessToken,
    refreshToken,
    expiresAt,
    user,
    isLoggedIn,
    hasIdentifier,
    login,
    refresh,
    logout,
    forgetIdentifier,
    ensureAuth,
    clearTokens,
    clearAll,
    maskedIdentifier,
  }
}
