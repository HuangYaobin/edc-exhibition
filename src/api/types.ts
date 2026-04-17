export interface ExhibitionTag {
  id: string
  exhibitionId?: string
  name: string
  color: string | null
  sort: number
}

export interface BoothBrand {
  id: string
  boothId: string
  ownerUserId?: string | null
  name: string
  nameEn?: string | null
  description?: string | null
  logoUrl?: string | null
  /** @deprecated 后端新接口不再维护，仅用于兼容存量数据展示 */
  wechatQrUrl?: string | null
  contact?: string | null
  contactImageUrl?: string | null
  contactType?: 'text' | 'image'
  sort: number
}

export interface BoothProduct {
  id: string
  boothId: string
  brandId?: string | null
  name: string
  description?: string | null
  imageUrl?: string | null
  material?: string | null
  price?: number | null
  salesRule?: string | null
  totalQuantity?: number | null
  wishlistCount?: number
  sort: number
  tags?: ExhibitionTag[]
  createdAt?: string
  updatedAt?: string
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
  nameEn?: string | null
  description?: string | null
  logoUrl?: string | null
  contact?: string | null
  contactImageUrl?: string | null
  contactType?: 'text' | 'image'
  sort?: number
}

export interface CreateProductPayload {
  brandId: string
  name: string
  description?: string | null
  imageUrl?: string | null
  /** 单位：分 */
  price?: number | null
  totalQuantity?: number | null
  material?: string | null
  salesRule?: string | null
  sort?: number
  tagIds?: string[]
}

export interface UpdateProductPayload {
  brandId?: string
  name?: string
  description?: string | null
  imageUrl?: string | null
  /** 单位：分 */
  price?: number | null
  totalQuantity?: number | null
  material?: string | null
  salesRule?: string | null
  sort?: number
  tagIds?: string[]
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

export interface WishlistProductBooth {
  id: string
  boothNumber: string
  exhibitionId: string
}

export interface WishlistProduct {
  id: string
  boothId: string
  brandId: string | null
  name: string
  description: string | null
  imageUrl: string | null
  price: number | null
  totalQuantity: number | null
  material: string | null
  salesRule: string | null
  wishlistCount: number
  sort: number
  createdAt: string
  updatedAt: string
  booth: WishlistProductBooth
}

export interface WishlistRecord {
  id: string
  userId: string
  productId: string
  purchasedAt: string | null
  createdAt: string
  updatedAt: string
  product: WishlistProduct
}

export interface WishlistQuery {
  exhibitionId?: string
  purchased?: boolean
}

export interface UploadImageResult {
  ossKey: string
  url: string
  size: number
  mimeType: string
}
