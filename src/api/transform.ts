import type { Brand, Product, Gift } from '@/types/brand'
import type { Booth } from '@/api/types'

export function transformBoothToBrand(booth: Booth): Brand | null {
  if (!booth.brands || booth.brands.length === 0) {
    return {
      name: `展位 ${booth.boothNumber}`,
      logo: '/imgs/default/empty.png',
      exhibitionNumber: booth.boothNumber,
      exhibitionProducts: booth.products?.map((p) => ({
        productName: p.name,
        productImage: p.imageUrl || '/imgs/default/empty.png',
        productDescription: p.description,
        productPrice: p.price ? String(p.price / 100) : undefined,
      })) || [],
    }
  }

  const primaryBrand = booth.brands[0]

  const products: Product[] = (booth.products || []).map((p) => ({
    productName: p.name,
    productImage: p.imageUrl || '/imgs/default/empty.png',
    productDescription: p.description,
    productPrice: p.price ? String(p.price / 100) : undefined,
  }))

  const gifts: Gift[] = []

  const articles: Array<{ title: string; link: string }> = []

  return {
    name: primaryBrand.name,
    logo: primaryBrand.logoUrl || '/imgs/default/empty.png',
    description: primaryBrand.description,
    exhibitionNumber: booth.boothNumber,
    exhibitionProducts: products,
    exhibitionGifts: gifts,
    relatedArticles: articles,
  }
}

export function transformBoothToBrands(booth: Booth): Brand[] {
  if (!booth.brands || booth.brands.length === 0) {
    const fallback = transformBoothToBrand(booth)
    return fallback ? [fallback] : []
  }

  return booth.brands.map((brand) => {
    const products: Product[] = (booth.products || []).map((p) => ({
      productName: p.name,
      productImage: p.imageUrl || '/imgs/default/empty.png',
      productDescription: p.description,
      productPrice: p.price ? String(p.price / 100) : undefined,
    }))

    return {
      name: brand.name,
      logo: brand.logoUrl || '/imgs/default/empty.png',
      description: brand.description,
      exhibitionNumber: booth.boothNumber,
      exhibitionProducts: products,
      exhibitionGifts: [],
      relatedArticles: [],
    }
  })
}
