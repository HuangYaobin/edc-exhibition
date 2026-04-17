import type { Booth, Exhibition, LeaderboardData, ProductWishlistResponse, UpdateBrandPayload, UpsertProductPayload, WishlistListResponse } from './types'

const API_BASE = '/api'
const MOCK_USER_ID = 'user_mock_001'

function getAuthHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': MOCK_USER_ID,
  }
}

export async function getOngoingExhibition(): Promise<Exhibition | null> {
  const res = await fetch(`${API_BASE}/exhibition`)
  if (!res.ok) return null
  return res.json()
}

export async function getBoothByNumber(boothNumber: string, exhibitionId?: string): Promise<Booth | null> {
  const params = new URLSearchParams()
  if (exhibitionId) {
    params.set('exhibitionId', exhibitionId)
  }
  const query = params.toString() ? `?${params.toString()}` : ''

  const res = await fetch(`${API_BASE}/exhibition/booths/${encodeURIComponent(boothNumber)}${query}`)

  if (!res.ok) {
    throw new Error(`获取展位信息失败: ${res.status}`)
  }

  const response = await res.json()
  return response.data || null
}

export async function getBoothById(id: string): Promise<Booth | null> {
  const res = await fetch(`${API_BASE}/exhibition/booth/id/${id}`)
  if (!res.ok) return null
  return res.json()
}

export async function getLeaderboard(): Promise<LeaderboardData> {
  try {
    const res = await fetch(`${API_BASE}/exhibition/leaderboard`)
    if (!res.ok) throw new Error('not ok')
    const response = await res.json()
    return response.data || response
  }
  catch {
    return {} as LeaderboardData
  }
}
export async function getAllBooths(exhibitionId?: string): Promise<Booth[]> {
  const params = new URLSearchParams()
  if (exhibitionId) {
    params.set('exhibitionId', exhibitionId)
  }
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_BASE}/exhibition/booths${query}`)
  if (!res.ok) return []
  const response = await res.json()
  const data = response.data || response
  return Array.isArray(data) ? data : []
}

export async function updateBrand(brandId: string, payload: UpdateBrandPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/exhibition/brands/${encodeURIComponent(brandId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`更新品牌信息失败: ${res.status}`)
}

export async function createProduct(boothId: string, payload: UpsertProductPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/exhibition/booths/${encodeURIComponent(boothId)}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`创建展品失败: ${res.status}`)
}

export async function updateProduct(productId: string, payload: UpsertProductPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/exhibition/products/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`更新展品失败: ${res.status}`)
}

export async function deleteProduct(productId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/exhibition/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`删除展品失败: ${res.status}`)
}

export async function toggleProductWishlist(productId: string, boothId: string): Promise<ProductWishlistResponse> {
  const res = await fetch(`${API_BASE}/exhibition/products/${encodeURIComponent(productId)}/wishlist`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ boothId }),
  })
  if (!res.ok) throw new Error(`操作失败: ${res.status}`)
  return res.json()
}

export async function updateWishlistPurchased(productId: string, purchased: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/exhibition/products/${encodeURIComponent(productId)}/wishlist/purchased`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ purchased }),
  })
  if (!res.ok) throw new Error(`更新购买状态失败: ${res.status}`)
}

export async function getWishlist(
  page = 1,
  pageSize = 20,
  purchased?: 'true' | 'false' | 'all',
  sortBy?: 'createdAt' | 'price' | 'brand',
  sortOrder?: 'asc' | 'desc',
): Promise<WishlistListResponse> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  if (purchased && purchased !== 'all') params.set('purchased', purchased)
  if (sortBy) params.set('sortBy', sortBy)
  if (sortOrder) params.set('sortOrder', sortOrder)

  const res = await fetch(`${API_BASE}/exhibition/wishlist?${params.toString()}`, {
    headers: { 'X-User-Id': MOCK_USER_ID },
  })
  if (!res.ok) throw new Error(`获取心愿单失败: ${res.status}`)
  return res.json()
}
