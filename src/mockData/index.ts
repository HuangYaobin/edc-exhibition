import mot from './mot.json'
import spinmoon from './spinmoon.json'
import queyinjiang from './queyinjiang.json'
import tw from './tw.json'
import gecko from './gecko.json'
import stable from './stable.json'

// 创建更多品牌数据用于测试
const createMockBrands = () => {
  const mockBrands = []

  // A区品牌 (排除A1，因为A1已经被spinmoon占用)
  for (let i = 2; i <= 32; i++) {
    mockBrands.push({
      name: `品牌A${i}`,
      logo: '/imgs/brands/mot/mot-logo.jpg',
      description: `这是A${i}展位的品牌，专注于EDC产品创新`,
      exhibitionNumber: `A${i}`,
      exhibitionProducts: [
        {
          productName: `A${i}产品`,
          productImage: '/imgs/brands/mot/mot-1.jpg',
          productDescription: `A${i}展位的特色产品`,
          productPrice: '100',
          productStock: '50',
        },
      ],
      relatedArticles: [
        {
          title: `A${i}品牌介绍`,
          link: 'https://www.baidu.com',
        },
        {
          title: `A${i}产品评测`,
          link: 'https://www.google.com',
        },
      ],
    })
  }

  // B区品牌
  for (let i = 1; i <= 33; i++) {
    mockBrands.push({
      name: `品牌B${i}`,
      logo: '/imgs/brands/mot/mot-logo.jpg',
      description: `这是B${i}展位的品牌，致力于打造高品质EDC产品`,
      exhibitionNumber: `B${i}`,
      exhibitionProducts: [
        {
          productName: `B${i}产品`,
          productImage: '/imgs/brands/mot/mot-1.jpg',
          productDescription: `B${i}展位的精品展示`,
          productPrice: '150',
          productStock: '30',
        },
      ],
      relatedArticles: [
        {
          title: `B${i}品牌故事`,
          link: 'https://www.baidu.com',
        },
        {
          title: `B${i}新品发布`,
          link: 'https://www.google.com',
        },
      ],
    })
  }

  // C区品牌
  for (let i = 0; i <= 3; i++) {
    mockBrands.push({
      name: `品牌C${i}`,
      logo: '/imgs/brands/mot/mot-logo.jpg',
      description: `这是C${i}展位的品牌，专注于创新设计`,
      exhibitionNumber: `C${i}`,
      exhibitionProducts: [
        {
          productName: `C${i}产品`,
          productImage: '/imgs/brands/mot/mot-1.jpg',
          productDescription: `C${i}展位的创新产品`,
          productPrice: '200',
          productStock: '20',
        },
      ],
      relatedArticles: [
        {
          title: `C${i}创新设计`,
          link: 'https://www.baidu.com',
        },
        {
          title: `C${i}技术解析`,
          link: 'https://www.google.com',
        },
      ],
    })
  }

  return mockBrands
}

export const brands = [mot, spinmoon, queyinjiang, tw, gecko, stable, ...createMockBrands()]

// 将品牌按展位分组，便于一个展位多个品牌的查询
export const brandsByBooth = brands.reduce<Record<string, any[]>>((acc, b) => {
  const key = b.exhibitionNumber
  if (!acc[key]) acc[key] = []
  acc[key].push(b)
  return acc
}, {})
