import { computed, ref } from 'vue'

export interface WishlistItem {
  productId: string
  productName: string
  productImage?: string
  productPrice?: number
  boothNumber: string
  brandName: string
  addedAt: number
  purchased: boolean
}

const MOCK_ITEMS: WishlistItem[] = [
  {
    productId: 'mock-001',
    productName: 'Benchmade 940-2 Osborne 钛柄折叠刀',
    productPrice: 329800,
    boothNumber: 'A01',
    brandName: 'Benchmade',
    addedAt: Date.now() - 1800000,
    purchased: false,
  },
  {
    productId: 'mock-002',
    productName: 'Olight Warrior 3S 战术手电筒 2300流明',
    productPrice: 79900,
    boothNumber: 'B03',
    brandName: 'Olight',
    addedAt: Date.now() - 3600000,
    purchased: true,
  },
  {
    productId: 'mock-003',
    productName: 'Leatherman Wave+ 多功能工具钳',
    productPrice: 128000,
    boothNumber: 'B03',
    brandName: 'Leatherman',
    addedAt: Date.now() - 5400000,
    purchased: false,
  },
  {
    productId: 'mock-004',
    productName: 'CRKT Provoke 旋转战术刀',
    productPrice: 168000,
    boothNumber: 'C02',
    brandName: 'CRKT',
    addedAt: Date.now() - 7200000,
    purchased: false,
  },
  {
    productId: 'mock-005',
    productName: 'Fenix PD36R Pro 可充电手电筒 2800流明',
    productPrice: 56900,
    boothNumber: 'D04',
    brandName: 'Fenix',
    addedAt: Date.now() - 9000000,
    purchased: false,
  },
  {
    productId: 'mock-006',
    productName: 'Victorinox SwissChamp 瑞士军刀豪华版',
    productPrice: 42800,
    boothNumber: 'A02',
    brandName: 'Victorinox',
    addedAt: Date.now() - 10800000,
    purchased: false,
  },
]

const items = ref<WishlistItem[]>(import.meta.env.DEV ? [...MOCK_ITEMS] : [])

export function useWishlist() {
  const wishlistItems = computed(() => items.value)
  const wishlistCount = computed(() => items.value.length)

  function isInWishlist(productId: string): boolean {
    return items.value.some(i => i.productId === productId)
  }

  function addToWishlist(item: Omit<WishlistItem, 'addedAt' | 'purchased'>) {
    if (!isInWishlist(item.productId))
      items.value = [...items.value, { ...item, addedAt: Date.now(), purchased: false }]
  }

  function removeFromWishlist(productId: string) {
    items.value = items.value.filter(i => i.productId !== productId)
  }

  function toggleWishlist(item: Omit<WishlistItem, 'addedAt' | 'purchased'>) {
    if (isInWishlist(item.productId))
      removeFromWishlist(item.productId)
    else
      addToWishlist(item)
  }

  function markAsPurchased(productId: string) {
    items.value = items.value.map(i =>
      i.productId === productId ? { ...i, purchased: true } : i,
    )
  }

  function unmarkAsPurchased(productId: string) {
    items.value = items.value.map(i =>
      i.productId === productId ? { ...i, purchased: false } : i,
    )
  }

  function clearWishlist() {
    items.value = []
  }

  return {
    wishlistItems,
    wishlistCount,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    markAsPurchased,
    unmarkAsPurchased,
    clearWishlist,
  }
}
