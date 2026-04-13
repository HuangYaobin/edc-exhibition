export interface Product {
  productName: string
  productImage: string
  productDescription?: string
  productPrice?: string
  productStock?: string
}

export interface Gift {
  giftName: string
  giftImage: string
  giftDescription?: string
  giftStock?: string
  productPrice?: string
}

export interface Article {
  title: string
  link: string
}

export interface Brand {
  name: string
  logo: string
  description?: string
  backgroundImage?: string
  exhibitionNumber: string
  exhibitionProducts?: Product[]
  exhibitionGifts?: Gift[]
  relatedArticles?: Article[]
}
