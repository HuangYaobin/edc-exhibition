import mot from './mot.json'
import spinmoon from './spinmoon.json'
import queyinjiang from './queyinjiang.json'
import tw from './tw.json'
import gecko from './gecko.json'
import stable from './stable.json'

const brandNames = [
  '钛度工坊', '指尖艺术', '陀螺大师', '手感研究所', '金属美学',
  '旋转空间', '精密工坊', '指尖陀螺', '重力工坊', '匠心设计',
  '星辰手作', '流光金属'
]

const productNames = [
  '钛合金指尖陀螺', '不锈钢减压玩具', '黄铜重力陀螺',
  '锆金属限定款', '钛马系列', '星空系列',
  '极简设计款', '经典复刻版', '联名限定款'
]

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const createMockBrands = () => {
  const mockBrands = []
  const boothIds = ['B01', 'B02', 'B03', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'C59', 'A01', 'A02']

  boothIds.forEach((boothId, index) => {
    const productCount = Math.floor(Math.random() * 3) + 2
    const products = []
    
    for (let i = 0; i < productCount; i++) {
      products.push({
        productName: randomItem(productNames) + (productCount > 1 ? ` ${String.fromCharCode(65 + i)}` : ''),
        productImage: '/imgs/brands/gecko/gecko-1.jpg',
        productDescription: '精选材质，匠心打造，带来极致手感体验',
        productPrice: String(Math.floor(Math.random() * 500) + 200),
        productStock: String(Math.floor(Math.random() * 50) + 10),
      })
    }

    mockBrands.push({
      name: brandNames[index],
      logo: '/imgs/brands/gecko/gecko-logo.png',
      description: `${brandNames[index]}，专注于高品质EDC产品设计，致力于为玩家带来极致的手感体验。`,
      exhibitionNumber: boothId,
      exhibitionProducts: products,
      exhibitionGifts: [
        {
          giftName: '品牌限定贴纸/周边',
          giftImage: '/imgs/default/gift.jpg',
          giftDescription: '消费即可获得品牌限定周边，数量有限先到先得',
          giftStock: '先到先得',
        },
      ],
      relatedArticles: [
        {
          title: `${brandNames[index]}品牌介绍`,
          link: 'https://mp.weixin.qq.com',
        },
        {
          title: `${brandNames[index]}新品发布`,
          link: 'https://mp.weixin.qq.com',
        },
      ],
    })
  })

  return mockBrands
}

export const brands = [...createMockBrands()]

export const brandsByBooth = brands.reduce<Record<string, any[]>>((acc, b) => {
  const key = b.exhibitionNumber
  if (!acc[key]) acc[key] = []
  acc[key].push(b)
  return acc
}, {})
