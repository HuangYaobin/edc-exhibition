import { computed, ref } from 'vue'
import { getLeaderboard } from '@/api'
import type { LeaderboardData } from '@/api/types'

const data = ref<LeaderboardData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
let lastFetchAt = 0
const CACHE_TTL = 5 * 60 * 1000

export function useLeaderboard() {
  const topProducts = computed(() => data.value?.hotProducts.slice(0, 10) ?? [])
  const topBooths = computed(() => data.value?.hotBooths.slice(0, 10) ?? [])
  const updatedAt = computed(() => data.value?.updatedAt ?? null)

  async function fetchLeaderboard(force = false) {
    if (!force && data.value && Date.now() - lastFetchAt < CACHE_TTL)
      return
    loading.value = true
    error.value = null
    try {
      data.value = await getLeaderboard()
      lastFetchAt = Date.now()
    }
    catch (e) {
      error.value = '加载失败，请重试'
      console.error(e)
    }
    finally {
      loading.value = false
    }
  }

  return { topProducts, topBooths, updatedAt, loading, error, fetchLeaderboard }
}
