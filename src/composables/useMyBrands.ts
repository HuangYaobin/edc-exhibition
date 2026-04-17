import { computed, ref, watch } from 'vue'
import { ApiError } from '@/api/http'
import { getMyBrands } from '@/api'
import type { BoothBrand } from '@/api/types'
import { useAuth } from '@/composables/useAuth'

const ownedBrands = ref<BoothBrand[]>([])
const ownedBrandIds = ref<Set<string>>(new Set())
const loading = ref(false)
let inflight: Promise<void> | null = null
let watcherInstalled = false

function applyBrands(list: BoothBrand[]) {
  ownedBrands.value = list
  ownedBrandIds.value = new Set(list.map(b => b.id))
}

function clear() {
  applyBrands([])
}

async function refresh(): Promise<void> {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn.value) {
    clear()
    return
  }
  if (inflight) return inflight
  loading.value = true
  inflight = (async () => {
    try {
      const list = await getMyBrands()
      applyBrands(Array.isArray(list) ? list : [])
    }
    catch (error) {
      if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
        clear()
      }
      else {
        console.warn('Failed to load merchant brands:', error)
        clear()
      }
    }
    finally {
      loading.value = false
      inflight = null
    }
  })()
  return inflight
}

function ensureLoaded(): Promise<void> {
  if (ownedBrands.value.length > 0) return Promise.resolve()
  return refresh()
}

function installWatcher() {
  if (watcherInstalled) return
  watcherInstalled = true
  const { isLoggedIn } = useAuth()
  watch(
    isLoggedIn,
    (val) => {
      if (val) refresh()
      else clear()
    },
    { immediate: true },
  )
}

export function useMyBrands() {
  installWatcher()

  const isOwner = (brandId: string | null | undefined) => {
    if (!brandId) return false
    return ownedBrandIds.value.has(brandId)
  }

  return {
    ownedBrands: computed(() => ownedBrands.value),
    ownedBrandIds: computed(() => ownedBrandIds.value),
    loading: computed(() => loading.value),
    isOwner,
    refresh,
    ensureLoaded,
  }
}
