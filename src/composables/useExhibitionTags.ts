import { computed, ref } from 'vue'
import { getExhibitionTags } from '@/api'
import type { ExhibitionTag } from '@/api/types'

const cache = ref<Map<string, ExhibitionTag[]>>(new Map())
const inflight = new Map<string, Promise<ExhibitionTag[]>>()

async function loadTags(exhibitionId: string, force = false): Promise<ExhibitionTag[]> {
  if (!exhibitionId) return []
  if (!force && cache.value.has(exhibitionId)) {
    return cache.value.get(exhibitionId)!
  }
  const existing = inflight.get(exhibitionId)
  if (existing) return existing

  const promise = (async () => {
    try {
      const list = await getExhibitionTags(exhibitionId)
      const tags = Array.isArray(list) ? list : []
      const next = new Map(cache.value)
      next.set(exhibitionId, tags)
      cache.value = next
      return tags
    }
    catch (error) {
      console.warn('Failed to load exhibition tags:', error)
      const next = new Map(cache.value)
      next.set(exhibitionId, [])
      cache.value = next
      return []
    }
    finally {
      inflight.delete(exhibitionId)
    }
  })()

  inflight.set(exhibitionId, promise)
  return promise
}

export function useExhibitionTags() {
  const getTags = (exhibitionId: string | null | undefined) =>
    computed(() => (exhibitionId ? cache.value.get(exhibitionId) ?? [] : []))

  return {
    loadTags,
    getTags,
  }
}
