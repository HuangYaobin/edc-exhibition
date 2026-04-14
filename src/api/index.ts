import type { Booth, Exhibition, LeaderboardData, UpdateBrandPayload, UpsertProductPayload } from './types'
import mockLeaderboard from '@/mockData/leaderboard.json'

const API_BASE = '/api'

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
    return mockLeaderboard as LeaderboardData
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`更新品牌信息失败: ${res.status}`)
}

export async function createProduct(boothId: string, payload: UpsertProductPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/exhibition/booths/${encodeURIComponent(boothId)}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`创建展品失败: ${res.status}`)
}

export async function updateProduct(productId: string, payload: UpsertProductPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/exhibition/products/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`更新展品失败: ${res.status}`)
}

export async function deleteProduct(productId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/exhibition/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`删除展品失败: ${res.status}`)
}
