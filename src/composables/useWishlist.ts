import { computed, ref, watch } from 'vue'
import {
  addToWishlist,
  getWishlist,
  markWishlistPurchased,
  removeFromWishlistApi,
  unmarkWishlistPurchased,
} from '@/api'
import type { WishlistRecord } from '@/api/types'
import { useAuth } from '@/composables/useAuth'

export type SortBy = 'createdAt' | 'price' | 'brand'
export type SortOrder = 'asc' | 'desc'
export type PurchasedFilter = 'true' | 'false' | 'all'

export interface WishlistItem {
  productId: string
  productName: string
  productImage?: string
  productPrice?: number
  boothId: string
  boothNumber: string
  brandName: string
  addedAt: number
  purchased: boolean
}

const items = ref<WishlistItem[]>([])
const allItems = ref<WishlistItem[]>([])
const isLoading = ref(false)
const isLoaded = ref(false)
const wishlistProductIds = ref<string[]>([])

function mapApiItem(record: WishlistRecord): WishlistItem {
  const product = record.product
  return {
    productId: record.productId,
    productName: product.name,
    productImage: product.imageUrl ?? undefined,
    productPrice: product.price ?? undefined,
    boothId: product.boothId,
    boothNumber: product.booth?.boothNumber ?? '',
    brandName: '',
    addedAt: new Date(record.createdAt).getTime(),
    purchased: !!record.purchasedAt,
  }
}

function applyFilterAndSort(
  list: WishlistItem[],
  purchased: PurchasedFilter,
  sortBy: SortBy,
  sortOrder: SortOrder,
): WishlistItem[] {
  let result = list
  if (purchased === 'true') result = result.filter(i => i.purchased)
  else if (purchased === 'false') result = result.filter(i => !i.purchased)

  const dir = sortOrder === 'asc' ? 1 : -1
  const sorted = [...result].sort((a, b) => {
    if (sortBy === 'price') return ((a.productPrice ?? 0) - (b.productPrice ?? 0)) * dir
    if (sortBy === 'brand') return a.brandName.localeCompare(b.brandName) * dir
    return (a.addedAt - b.addedAt) * dir
  })
  return sorted
}

let registeredAuthWatcher = false

export function useWishlist() {
  const auth = useAuth()
  const { ensureAuth, isLoggedIn } = auth

  if (!registeredAuthWatcher) {
    registeredAuthWatcher = true
    watch(isLoggedIn, (val) => {
      if (!val) {
        items.value = []
        allItems.value = []
        wishlistProductIds.value = []
        isLoaded.value = false
      }
    })
  }

  const wishlistItems = computed(() => items.value)
  const wishlistCount = computed(() => items.value.length)

  const pendingItems = computed(() => allItems.value.filter(i => !i.purchased))
  const purchasedItems = computed(() => allItems.value.filter(i => i.purchased))
  const pendingTotal = computed(() =>
    pendingItems.value.reduce((sum, item) => sum + (item.productPrice ?? 0), 0),
  )

  async function loadWishlist(
    force = false,
    sortBy?: SortBy,
    sortOrder?: SortOrder,
    purchased?: PurchasedFilter,
  ) {
    if ((isLoaded.value || isLoading.value) && !force) return
    try {
      await ensureAuth()
    } catch {
      return
    }
    isLoading.value = true
    const sort = sortBy ?? 'createdAt'
    const order = sortOrder ?? 'desc'
    const filter = purchased ?? 'all'
    try {
      const records = await getWishlist()
      const mappedAll = records.map(mapApiItem)
      allItems.value = mappedAll
      const view = applyFilterAndSort(mappedAll, filter, sort, order)
      items.value = view
      wishlistProductIds.value = mappedAll.map(i => i.productId)
    } catch (error) {
      console.warn('Failed to load wishlist:', error)
    } finally {
      isLoading.value = false
      isLoaded.value = true
    }
  }

  function isInWishlist(productId: string): boolean {
    return wishlistProductIds.value.includes(productId)
  }

  async function toggleWishlist(item: Omit<WishlistItem, 'addedAt' | 'purchased'>) {
    try {
      await ensureAuth()
    } catch {
      return { isInWishlist: isInWishlist(item.productId) }
    }
    const currentlyIn = isInWishlist(item.productId)

    if (currentlyIn) {
      const prevItems = items.value
      const prevAll = allItems.value
      const prevIds = wishlistProductIds.value
      items.value = items.value.filter(i => i.productId !== item.productId)
      allItems.value = allItems.value.filter(i => i.productId !== item.productId)
      wishlistProductIds.value = wishlistProductIds.value.filter(id => id !== item.productId)
      try {
        await removeFromWishlistApi(item.productId)
        return { isInWishlist: false }
      } catch (error) {
        items.value = prevItems
        allItems.value = prevAll
        wishlistProductIds.value = prevIds
        console.error('Failed to toggle wishlist:', error)
        throw error
      }
    }

    const optimistic: WishlistItem = {
      ...item,
      addedAt: Date.now(),
      purchased: false,
    }
    const prevItems = items.value
    const prevAll = allItems.value
    const prevIds = wishlistProductIds.value
    items.value = [...items.value, optimistic]
    allItems.value = [...allItems.value, optimistic]
    wishlistProductIds.value = [...wishlistProductIds.value, item.productId]
    try {
      const record = await addToWishlist(item.productId)
      const mapped: WishlistItem = {
        ...item,
        addedAt: new Date(record.createdAt).getTime(),
        purchased: !!record.purchasedAt,
      }
      items.value = items.value.map(i => (i.productId === item.productId ? mapped : i))
      allItems.value = allItems.value.map(i => (i.productId === item.productId ? mapped : i))
      return { isInWishlist: true }
    } catch (error) {
      items.value = prevItems
      allItems.value = prevAll
      wishlistProductIds.value = prevIds
      console.error('Failed to toggle wishlist:', error)
      throw error
    }
  }

  async function removeFromWishlist(productId: string) {
    try {
      await ensureAuth()
    } catch {
      return
    }
    const prevItems = items.value
    const prevAll = allItems.value
    const prevIds = wishlistProductIds.value
    items.value = items.value.filter(i => i.productId !== productId)
    allItems.value = allItems.value.filter(i => i.productId !== productId)
    wishlistProductIds.value = wishlistProductIds.value.filter(id => id !== productId)
    try {
      await removeFromWishlistApi(productId)
    } catch (error) {
      items.value = prevItems
      allItems.value = prevAll
      wishlistProductIds.value = prevIds
      console.error('Failed to remove from wishlist:', error)
      throw error
    }
  }

  async function setPurchased(productId: string, purchased: boolean) {
    try {
      await ensureAuth()
    } catch {
      return
    }
    const prevItems = items.value
    const prevAll = allItems.value
    items.value = items.value.map(i =>
      i.productId === productId ? { ...i, purchased } : i,
    )
    allItems.value = allItems.value.map(i =>
      i.productId === productId ? { ...i, purchased } : i,
    )
    try {
      if (purchased) await markWishlistPurchased(productId)
      else await unmarkWishlistPurchased(productId)
    } catch (error) {
      items.value = prevItems
      allItems.value = prevAll
      console.error(`Failed to ${purchased ? 'mark' : 'unmark'} as purchased:`, error)
      throw error
    }
  }

  async function markAsPurchased(productId: string) {
    return setPurchased(productId, true)
  }

  async function unmarkAsPurchased(productId: string) {
    return setPurchased(productId, false)
  }

  function clearWishlist() {
    items.value = []
    allItems.value = []
    wishlistProductIds.value = []
    isLoaded.value = false
  }

  return {
    wishlistItems,
    wishlistCount,
    wishlistProductIds,
    isLoading,
    loadWishlist,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    markAsPurchased,
    unmarkAsPurchased,
    clearWishlist,
    pendingItems,
    purchasedItems,
    pendingTotal,
    allItems,
  }
}
