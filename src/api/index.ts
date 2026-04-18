import type {
  Booth,
  BoothBrand,
  BoothProduct,
  CreateProductPayload,
  Exhibition,
  ExhibitionTag,
  LeaderboardData,
  UpdateBrandPayload,
  UpdateProductPayload,
  UploadImageResult,
  WishlistQuery,
  WishlistRecord,
} from './types'
import { request } from './http'

const API_BASE = '/api'

export async function getOngoingExhibition(): Promise<Exhibition | null> {
  const res = await fetch(`${API_BASE}/exhibition`)
  if (!res.ok) return null
  const response = await res.json()
  return response.data || null
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

export async function getExhibitionTags(exhibitionId?: string): Promise<ExhibitionTag[]> {
  const params = new URLSearchParams()
  if (exhibitionId) params.set('exhibitionId', exhibitionId)
  const qs = params.toString()
  const path = qs ? `/api/exhibition/tags?${qs}` : '/api/exhibition/tags'
  return request<ExhibitionTag[]>(path, { method: 'GET', auth: false })
}

export async function getMyBrands(): Promise<BoothBrand[]> {
  return request<BoothBrand[]>('/api/merchant/brands', { method: 'GET' })
}

export async function updateBrand(brandId: string, payload: UpdateBrandPayload): Promise<BoothBrand> {
  return request<BoothBrand>(`/api/merchant/brands/${encodeURIComponent(brandId)}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function createProduct(payload: CreateProductPayload): Promise<BoothProduct> {
  return request<BoothProduct>('/api/merchant/products', {
    method: 'POST',
    body: payload,
  })
}

export async function updateProduct(productId: string, payload: UpdateProductPayload): Promise<BoothProduct> {
  return request<BoothProduct>(`/api/merchant/products/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteProduct(productId: string): Promise<void> {
  await request<{ success: boolean }>(`/api/merchant/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  })
}

export async function getWishlist(query: WishlistQuery = {}): Promise<WishlistRecord[]> {
  const params = new URLSearchParams()
  if (query.exhibitionId) params.set('exhibitionId', query.exhibitionId)
  if (typeof query.purchased === 'boolean') params.set('purchased', String(query.purchased))
  const qs = params.toString()
  const path = qs ? `/api/wishlist?${qs}` : '/api/wishlist'
  return request<WishlistRecord[]>(path, { method: 'GET' })
}

export async function addToWishlist(productId: string): Promise<WishlistRecord> {
  return request<WishlistRecord>('/api/wishlist', {
    method: 'POST',
    body: { productId },
  })
}

export async function removeFromWishlistApi(productId: string): Promise<void> {
  await request<{ success: boolean }>(`/api/wishlist/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  })
}

export async function markWishlistPurchased(productId: string): Promise<WishlistRecord> {
  return request<WishlistRecord>(`/api/wishlist/${encodeURIComponent(productId)}/purchase`, {
    method: 'POST',
  })
}

export async function unmarkWishlistPurchased(productId: string): Promise<WishlistRecord> {
  return request<WishlistRecord>(`/api/wishlist/${encodeURIComponent(productId)}/unpurchase`, {
    method: 'POST',
  })
}

export async function reorderWishlistApi(productIds: string[]): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/api/wishlist/reorder', {
    method: 'PATCH',
    body: { productIds },
  })
}

export async function uploadImage(file: File): Promise<UploadImageResult> {
  const form = new FormData()
  form.append('file', file)
  return request<UploadImageResult>('/api/upload/image', {
    method: 'POST',
    body: form,
  })
}

export async function recordExhibitionView(exhibitionId: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/exhibition/${encodeURIComponent(exhibitionId)}/view`, {
      method: 'POST',
    })
  } catch {}
}
