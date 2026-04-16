<script setup lang="ts">
import BaseDialog from '@/components/base/BaseDialog.vue'
import type { BoothProduct } from '@/api/types'

const props = defineProps<{
  visible: boolean
  product: BoothProduct | null
  boothNumber: string
  brandName: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const placeholder = target.nextElementSibling as HTMLElement
  if (placeholder) placeholder.style.display = 'flex'
}
</script>

<template>
  <BaseDialog
    :visible="visible"
    title="商品详情"
    max-width="28rem"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="product" class="flex flex-col gap-4">
      <div class="w-full bg-zinc-800 rounded-lg overflow-hidden relative">
        <img
          v-if="product.imageUrl"
          :src="product.imageUrl"
          :alt="product.name"
          class="w-full h-auto max-h-96 object-contain"
          @error="handleImageError"
        />
        <div
          class="w-full h-48 items-center justify-center text-zinc-700 text-4xl"
          :style="{ display: product.imageUrl ? 'none' : 'flex' }"
        >
          <i class="i-carbon-image" />
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-[11px] text-zinc-500 uppercase tracking-wider">商品名称</label>
          <p class="text-zinc-100 font-semibold text-base m-0 leading-snug">{{ product.name }}</p>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] text-zinc-500 uppercase tracking-wider">价格</label>
          <p v-if="product.price != null" class="text-amber-400 font-bold text-xl m-0 leading-none">
            ¥{{ (product.price / 100).toFixed(2) }}
          </p>
          <p v-else class="text-zinc-600 text-sm m-0">暂无定价</p>
        </div>

        <div v-if="product.material" class="flex flex-col gap-1">
          <label class="text-[11px] text-zinc-500 uppercase tracking-wider">材质</label>
          <p class="text-zinc-300 text-sm m-0 leading-relaxed">{{ product.material }}</p>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] text-zinc-500 uppercase tracking-wider">限量总数</label>
          <p class="text-zinc-300 text-sm m-0 leading-relaxed">
            {{ product.totalQuantity == null ? '不限量' : product.totalQuantity > 0 ? `${product.totalQuantity} 件` : '已售罄' }}
          </p>
        </div>

        <div v-if="product.description" class="flex flex-col gap-1">
          <label class="text-[11px] text-zinc-500 uppercase tracking-wider">商品描述</label>
          <p class="text-zinc-300 text-sm m-0 leading-relaxed whitespace-pre-wrap">{{ product.description }}</p>
        </div>

        <div v-if="product.salesRule" class="flex flex-col gap-1">
          <label class="text-[11px] text-zinc-500 uppercase tracking-wider">发售规则 & 备注</label>
          <p class="text-zinc-300 text-sm m-0 leading-relaxed whitespace-pre-wrap">{{ product.salesRule }}</p>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] text-zinc-500 uppercase tracking-wider">展位信息</label>
          <p class="text-zinc-300 text-sm m-0 leading-relaxed">
            {{ boothNumber }} - {{ brandName }}
          </p>
        </div>

        <!-- <div v-if="product.wishlistCount != null" class="flex flex-col gap-1">
          <label class="text-[11px] text-zinc-500 uppercase tracking-wider">收藏数</label>
          <p class="text-zinc-300 text-sm m-0 leading-relaxed">
            {{ product.wishlistCount }} 人收藏
          </p>
        </div> -->
      </div>

      <!-- <div class="pt-2">
        <button
          class="w-full py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none bg-zinc-100 text-zinc-900 hover:bg-white"
          @click="emit('update:visible', false)"
        >
          关闭
        </button>
      </div> -->
    </div>
  </BaseDialog>
</template>
