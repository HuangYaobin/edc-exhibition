export interface BoothBrand {
  id: string
  boothId: string
  name: string
  nameEn?: string
  description?: string
  logoUrl?: string
  sort: number
}

export interface BoothProduct {
  id: string
  boothId: string
  name: string
  description?: string
  imageUrl?: string
  price?: number
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
