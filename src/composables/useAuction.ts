import type { AuctionProductsResponseDto, AuctionProductPriceResponseDto } from '@edc-auction/types'

export const useAuction = () => {

  const getAuctionProductPrice = async (auctionId: string) => {
    return useFetch<AuctionProductPriceResponseDto>('/api/getAuctionProductPrice', {
      immediate: true,
      server: false,
      method: 'POST',
      body: {
        auctionId
      }
    })
  };

  const getAllAuctionProducts = async () => {
    return useFetch<AuctionProductsResponseDto>('/api/getAllAuctionProducts', {
      immediate: true,
      server: false,
      key: 'auction-products-' + Date.now(), // 添加时间戳避免缓存
      cache: 'no-cache' // 禁用缓存
    })
  }

  return {
    getAuctionProductPrice,
    getAllAuctionProducts
  };
}; 
