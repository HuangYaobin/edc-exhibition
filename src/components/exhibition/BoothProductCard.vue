<script setup lang="ts">
import FavoriteButton from '@/components/base/FavoriteButton.vue'
import type { BoothProduct } from '@/api/types'
import { useWishlist } from '@/composables/useWishlist'

const props = defineProps<{
  product: BoothProduct
  boothNumber: string
  brandName: string
}>()

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const placeholder = target.nextElementSibling as HTMLElement
  if (placeholder) placeholder.style.display = 'flex'
}

const { wishlistProductIds, toggleWishlist } = useWishlist()
</script>

<template>
  <div
    class="flex rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden hover:border-zinc-600 transition-colors duration-200">
    <!-- Image -->
    <div class="w-36 shrink-0 bg-zinc-700 relative overflow-hidden">
      <img :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover absolute inset-0"
        @error="handleImageError" />
      <div class="absolute inset-0 items-center justify-center text-zinc-700 text-3xl" style="display: none;">
        <i class="i-carbon-image" />
      </div>
    </div>
    
    <!-- Info -->
    <div class="flex-1 min-w-0 p-3 flex flex-col justify-between gap-2">
      <div class="flex flex-col gap-1.5">
        <h5 class="text-zinc-100 font-semibold text-sm m-0 leading-snug line-clamp-2">
          {{ product.name }}
        </h5>
        <p v-if="product.description" class="text-zinc-500 text-xs leading-relaxed m-0 line-clamp-3">
          {{ product.description }}
        </p>
      </div>

      <div class="flex items-end justify-between mt-auto gap-2">
        <div class="flex flex-col gap-1 min-w-0">
          <span v-if="product.price" class="text-amber-400 font-bold text-base leading-none">
            ¥{{ (product.price / 100).toFixed(2) }}
          </span>
          <span v-else class="text-zinc-600 text-xs leading-none">暂无定价</span>
          <span class="text-[10px] leading-none"
            :class="product.quantity == null ? 'text-zinc-500' : product.quantity > 0 ? 'text-zinc-400' : 'text-rose-400'">
            {{ product.quantity == null ? '不限量' : product.quantity > 0 ? `限量 ${product.quantity} 件` : '已售罄' }}
          </span>
        </div>
        <FavoriteButton :active="wishlistProductIds.includes(product.id)" title-on="移出心愿单" title-off="加入心愿单" size-class="text-sm"
          @toggle="toggleWishlist({
            productId: product.id,
            productName: product.name,
            productImage: product.imageUrl,
            productPrice: product.price,
            boothId: product.boothId,
            boothNumber,
            brandName,
          })" />
      </div>
    </div>
  </div>
</template>
