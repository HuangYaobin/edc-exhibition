export interface BoothBrand {
  id: string
  boothId: string
  name: string
  nameEn?: string
  description?: string
  logoUrl?: string
  wechatQrUrl?: string
  sort: number
}

export interface BoothProduct {
  id: string
  boothId: string
  name: string
  description?: string
  imageUrl?: string
  price?: number
  quantity?: number
  wishlistCount?: number
  sort: number
}

export interface Booth {
  id: string
  exhibitionId: string
  boothNumber: string
  area?: number
  locationDesc?: string
  status: string
  remark?: string
  exhibition?: {
    id: string
    name: string
    startDate: string
    endDate: string
    location: string
  }
  brands: BoothBrand[]
  products: BoothProduct[]
}

export interface ProductRankItem {
  productId: string
  productName: string
  productImage?: string
  boothNumber: string
  brandName: string
  wishlistCount: number
}

export interface BoothRankItem {
  boothNumber: string
  brandName: string
  brandLogo?: string
  checkinCount: number
}

export interface LeaderboardData {
  hotProducts: ProductRankItem[]
  hotBooths: BoothRankItem[]
  updatedAt: number
}

export interface UpdateBrandPayload {
  name?: string
  nameEn?: string
  description?: string
  logoUrl?: string
  wechatQrUrl?: string
}

export interface UpsertProductPayload {
  name: string
  description?: string
  imageUrl?: string
  price?: number
  quantity?: number
}

export interface Exhibition {
  id: string
  name: string
  startDate: string
  endDate: string
  location: string
  description?: string
  status: string
  coverImage?: string
  organizer?: string
  contactPhone?: string
  contactEmail?: string
}

export interface ProductWishlistResponse {
  isInWishlist: boolean
  wishlistCount: number
}

export interface WishlistItem {
  id: string
  productId: string
  productName: string
  productImage?: string | null
  productPrice?: number | null
  boothId: string
  boothNumber: string
  brandName: string
  purchased: boolean
  addedAt: string
}

export interface WishlistListResponse {
  list: WishlistItem[]
  total: number
  hasMore: boolean
}
