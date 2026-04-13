import type { Booth, Exhibition } from './types'

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
