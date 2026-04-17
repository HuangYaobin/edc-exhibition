import { computed, ref } from 'vue'
import { getWishlist, toggleProductWishlist, updateWishlistPurchased } from '@/api'
import type { WishlistItem as ApiWishlistItem } from '@/api/types'

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

function mapApiItem(item: ApiWishlistItem): WishlistItem {
  return {
    productId: item.productId,
    productName: item.productName,
    productImage: item.productImage ?? undefined,
    productPrice: item.productPrice ?? undefined,
    boothId: item.boothId,
    boothNumber: item.boothNumber,
    brandName: item.brandName,
    addedAt: new Date(item.addedAt).getTime(),
    purchased: item.purchased,
  }
}

export function useWishlist() {
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
    isLoading.value = true
    const sort = sortBy ?? 'createdAt'
    const order = sortOrder ?? 'desc'
    const filter = purchased ?? 'all'
    try {
      const response = await getWishlist(1, 100, filter, sort, order)
      console.log('Wishlist API response:', response)
      const list = response.list || (response as any).data?.list || []
      console.log('Wishlist list:', list)
      const mapped = list.map(mapApiItem)
      items.value = mapped
      wishlistProductIds.value = mapped.map(i => i.productId)
      if (filter === 'all') {
        allItems.value = mapped
      }
      console.log('Mapped items:', items.value)
      isLoaded.value = true
    } catch (error) {
      console.warn('Failed to load wishlist:', error)
    } finally {
      isLoading.value = false
    }
  }

  function isInWishlist(productId: string): boolean {
    if (!isLoaded.value && !isLoading.value) {
      loadWishlist()
    }
    return wishlistProductIds.value.includes(productId)
  }

  async function toggleWishlist(item: Omit<WishlistItem, 'addedAt' | 'purchased'>) {
    try {
      const response = await toggleProductWishlist(item.productId, item.boothId)
      if (response.isInWishlist) {
        if (!isInWishlist(item.productId)) {
          items.value = [...items.value, { ...item, addedAt: Date.now(), purchased: false }]
          allItems.value = [...allItems.value, { ...item, addedAt: Date.now(), purchased: false }]
          wishlistProductIds.value = [...wishlistProductIds.value, item.productId]
        }
      } else {
        items.value = items.value.filter(i => i.productId !== item.productId)
        allItems.value = allItems.value.filter(i => i.productId !== item.productId)
        wishlistProductIds.value = wishlistProductIds.value.filter(id => id !== item.productId)
      }
      return response
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
      throw error
    }
  }

  async function removeFromWishlist(productId: string) {
    const item = items.value.find(i => i.productId === productId)
    if (!item) return
    try {
      await toggleProductWishlist(productId, item.boothId)
      items.value = items.value.filter(i => i.productId !== productId)
      allItems.value = allItems.value.filter(i => i.productId !== productId)
      wishlistProductIds.value = wishlistProductIds.value.filter(id => id !== productId)
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
      throw error
    }
  }

  async function markAsPurchased(productId: string) {
    try {
      await updateWishlistPurchased(productId, true)
      items.value = items.value.map(i =>
        i.productId === productId ? { ...i, purchased: true } : i,
      )
      allItems.value = allItems.value.map(i =>
        i.productId === productId ? { ...i, purchased: true } : i,
      )
    } catch (error) {
      console.error('Failed to mark as purchased:', error)
      throw error
    }
  }

  async function unmarkAsPurchased(productId: string) {
    try {
      await updateWishlistPurchased(productId, false)
      items.value = items.value.map(i =>
        i.productId === productId ? { ...i, purchased: false } : i,
      )
      allItems.value = allItems.value.map(i =>
        i.productId === productId ? { ...i, purchased: false } : i,
      )
    } catch (error) {
      console.error('Failed to unmark as purchased:', error)
      throw error
    }
  }

  function clearWishlist() {
    items.value = []
    allItems.value = []
    wishlistProductIds.value = []
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
