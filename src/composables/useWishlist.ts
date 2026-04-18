import { computed, ref, watch } from 'vue'
import {
  addToWishlist,
  getWishlist,
  markWishlistPurchased,
  removeFromWishlistApi,
  reorderWishlistApi,
  unmarkWishlistPurchased,
} from '@/api'
import type { WishlistRecord } from '@/api/types'
import { useAuth } from '@/composables/useAuth'

export type SortBy = 'createdAt' | 'price' | 'booth' | 'custom'
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
const customOrder = ref<string[]>([])

// 展位号通常是字母+数字混合（例如 A1、A10、B2、C-101），
// 用 numeric collation 让 A2 排在 A10 前面，避免按字符串字典序导致的奇怪结果。
const boothCollator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' })

function compareBoothNumber(a: string, b: string): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return boothCollator.compare(a, b)
}

function sortByCustomOrder(list: WishlistItem[], order: string[]): WishlistItem[] {
  if (order.length === 0) return list
  const idx = new Map(order.map((id, i) => [id, i]))
  return [...list].sort(
    (a, b) => (idx.get(a.productId) ?? Number.MAX_SAFE_INTEGER) - (idx.get(b.productId) ?? Number.MAX_SAFE_INTEGER),
  )
}

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

  if (sortBy === 'custom') {
    return sortByCustomOrder(result, customOrder.value)
  }

  const dir = sortOrder === 'asc' ? 1 : -1
  const sorted = [...result].sort((a, b) => {
    if (sortBy === 'price') return ((a.productPrice ?? 0) - (b.productPrice ?? 0)) * dir
    if (sortBy === 'booth') return compareBoothNumber(a.boothNumber, b.boothNumber) * dir
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
        customOrder.value = []
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
    // 后端在未指定排序时已按用户保存的自定义顺序返回，所以前端默认也用 custom，
    // 这样 items.value 保持接口给的顺序，避免被本地按 createdAt 再排一遍。
    const sort = sortBy ?? 'custom'
    const order = sortOrder ?? 'desc'
    const filter = purchased ?? 'all'
    try {
      const records = await getWishlist()
      const mappedAll = records.map(mapApiItem)
      const orderedIds = mappedAll.map(i => i.productId)
      customOrder.value = orderedIds
      allItems.value = mappedAll
      const view = applyFilterAndSort(mappedAll, filter, sort, order)
      items.value = view
      wishlistProductIds.value = orderedIds
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
      const prevOrder = customOrder.value
      items.value = items.value.filter(i => i.productId !== item.productId)
      allItems.value = allItems.value.filter(i => i.productId !== item.productId)
      wishlistProductIds.value = wishlistProductIds.value.filter(id => id !== item.productId)
      customOrder.value = customOrder.value.filter(id => id !== item.productId)
      try {
        await removeFromWishlistApi(item.productId)
        return { isInWishlist: false }
      } catch (error) {
        items.value = prevItems
        allItems.value = prevAll
        wishlistProductIds.value = prevIds
        customOrder.value = prevOrder
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
    const prevOrder = customOrder.value
    items.value = [...items.value, optimistic]
    allItems.value = [...allItems.value, optimistic]
    wishlistProductIds.value = [...wishlistProductIds.value, item.productId]
    customOrder.value = [...customOrder.value, item.productId]
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
      customOrder.value = prevOrder
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
    const prevOrder = customOrder.value
    items.value = items.value.filter(i => i.productId !== productId)
    allItems.value = allItems.value.filter(i => i.productId !== productId)
    wishlistProductIds.value = wishlistProductIds.value.filter(id => id !== productId)
    customOrder.value = customOrder.value.filter(id => id !== productId)
    try {
      await removeFromWishlistApi(productId)
    } catch (error) {
      items.value = prevItems
      allItems.value = prevAll
      wishlistProductIds.value = prevIds
      customOrder.value = prevOrder
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
    customOrder.value = []
    isLoaded.value = false
  }

  async function reorderItems(newOrder: string[]) {
    try {
      await ensureAuth()
    } catch {
      return
    }
    const prevOrder = customOrder.value
    const prevAll = allItems.value
    const prevItems = items.value

    customOrder.value = newOrder
    allItems.value = sortByCustomOrder(allItems.value, newOrder)
    items.value = sortByCustomOrder(items.value, newOrder)

    try {
      await reorderWishlistApi(newOrder)
    } catch (error) {
      customOrder.value = prevOrder
      allItems.value = prevAll
      items.value = prevItems
      console.error('Failed to reorder wishlist:', error)
      throw error
    }
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
    reorderItems,
    pendingItems,
    purchasedItems,
    pendingTotal,
    allItems,
    customOrder,
  }
}
