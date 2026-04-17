<script setup lang="ts">
import { ref } from 'vue'
import FavoriteButton from '@/components/base/FavoriteButton.vue'
import ProductDetailDialog from '@/components/exhibition/ProductDetailDialog.vue'
import type { BoothProduct } from '@/api/types'
import { useWishlist } from '@/composables/useWishlist'

const props = defineProps<{
  product: BoothProduct
  boothNumber: string
  brandName: string
}>()

const showDetailDialog = ref(false)

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const placeholder = target.nextElementSibling as HTMLElement
  if (placeholder) placeholder.style.display = 'flex'
}

// const { wishlistProductIds, toggleWishlist } = useWishlist()
</script>

<template>
  <div
    class="flex rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden hover:border-zinc-600 transition-colors duration-200 cursor-pointer"
    @click="showDetailDialog = true">
    <div class="w-32 shrink-0 bg-zinc-700 relative overflow-hidden h-auto aspect-square">
      <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover absolute inset-0"
        @error="handleImageError" />
      <div class="absolute inset-0 items-center justify-center text-zinc-700 text-3xl" :style="{ display: product.imageUrl ? 'none' : 'flex' }">
        <i class="i-carbon-image" />
      </div>
    </div>
    
    <!-- Info -->
    <div class="flex-1 min-w-0 p-3 flex flex-col justify-between gap-2">
      <div class="flex flex-col gap-1.5">
        <h5 class="text-zinc-100 font-semibold text-sm m-0 leading-snug line-clamp-2">
          {{ product.name }}
        </h5>
        <p v-if="product.description" class="text-zinc-500 text-xs leading-relaxed m-0 line-clamp-2">
          {{ product.description }}
        </p>
      </div>

      <div class="mt-auto">
        <div class="flex items-end gap-3">
          <div v-if="product.price != null" class="flex items-baseline gap-0.5">
            <span class="text-amber-400/70 text-xs font-medium mb-0.5">¥</span>
            <span class="text-amber-300 font-bold text-xl leading-none tracking-tight">
              {{ (product.price / 100).toFixed(2) }}
            </span>
          </div>
          <span v-else class="text-zinc-600 text-sm font-medium">暂无定价</span>
          
          <span class="text-[10px] font-medium leading-none px-2 py-1 rounded border mb-0.5"
            :class="[
              product.totalQuantity == null 
                ? 'text-zinc-500 border-zinc-600' 
                : product.totalQuantity > 0 
                  ? 'text-zinc-300 border-zinc-500' 
                  : 'text-rose-400 border-rose-500'
            ]">
            {{ product.totalQuantity == null ? '不限量' : product.totalQuantity > 0 ? `限量 ${product.totalQuantity}` : '已售罄' }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <ProductDetailDialog
    v-model:visible="showDetailDialog"
    :product="product"
    :booth-number="boothNumber"
    :brand-name="brandName"
  />
</template>
