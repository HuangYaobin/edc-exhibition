<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import BaseTabs from '@/components/base/BaseTabs.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import type { Booth } from '@/api/types'

const props = defineProps<{
  booth: Booth | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const activeIndex = ref(0)

watch(() => props.booth, () => {
  activeIndex.value = 0
})

const brands = computed(() => props.booth?.brands ?? [])
const activeBrand = computed(() => brands.value[activeIndex.value] ?? null)
const hasMultipleBrands = computed(() => brands.value.length > 1)

const formattedBoothNumber = computed(() => props.booth?.boothNumber || '')

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const placeholder = target.nextElementSibling as HTMLElement
  if (placeholder) placeholder.style.display = 'flex'
}

// Description overflow detection
const descriptionEl = ref<HTMLParagraphElement | null>(null)
const isClamped = ref(false)
const showDescDialog = ref(false)

function checkClamped() {
  nextTick(() => {
    if (descriptionEl.value) {
      isClamped.value = descriptionEl.value.scrollHeight > descriptionEl.value.clientHeight + 1
    }
  })
}

watch(activeBrand, () => {
  showDescDialog.value = false
  checkClamped()
})

onMounted(() => {
  checkClamped()
})
</script>

<template>
  <div v-if="booth"
    class="max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
    <!-- Brand tabs — only shown when multiple brands -->
    <BaseTabs v-if="hasMultipleBrands" v-model="activeIndex" :items="brands">
      <template #tab="{ item, isActive }">
        <div class="w-4 h-4 rounded-sm overflow-hidden bg-zinc-900 flex items-center justify-center shrink-0">
          <img v-if="item.logoUrl" :src="item.logoUrl" :alt="item.name" class="w-full h-full object-contain" />
          <i v-else class="i-carbon-building text-zinc-500 text-[10px]" />
        </div>
        <span class="truncate max-w-28" :class="isActive ? 'text-zinc-100' : 'text-zinc-500'">{{ item.name }}</span>
      </template>
    </BaseTabs>

    <div class="bg-zinc-900 rounded-lg overflow-hidden ">
      <!-- Brand header -->
      <div v-if="activeBrand" class="relative flex gap-4 items-start p-4 pb-2 border-b border-zinc-800">
        <!-- Booth number — absolute top-right -->
        <span v-if="formattedBoothNumber"
          class="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-zinc-800 border border-zinc-700 rounded-full px-2 py-0.5">
          <i class="i-carbon-location text-zinc-600 text-[10px]" />
          {{ formattedBoothNumber }}
        </span>
        <!-- Logo -->
        <div class="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
          <img :src="activeBrand.logoUrl" :alt="activeBrand.name" class="w-full h-full object-contain"
            @error="handleImageError" />
          <div class="w-full h-full items-center justify-center text-zinc-600 text-2xl" style="display: none;">
            <i class="i-carbon-building" />
          </div>
        </div>

        <!-- Brand info -->
        <div class="flex-1 min-w-0 py-0.5">
          <h3 class="text-zinc-100 font-semibold text-base m-0 mb-1.5 leading-tight truncate">
            {{ activeBrand.name }}
          </h3>
          <!-- fixed 2-line height so layout never shifts -->
          <div class="relative h-[2.4375rem]">
            <template v-if="activeBrand.description">
              <p ref="descriptionEl" class="text-zinc-500 text-xs leading-relaxed m-0 line-clamp-2">
                {{ activeBrand.description }}
              </p>
              <!-- "查看更多" fades in at bottom-right when text is clamped -->
              <button v-if="isClamped"
                class="absolute bottom-0 right-0 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer border-none bg-transparent p-0 leading-[1.625] pl-6"
                style="background: linear-gradient(to right, transparent, #18181b 40%)"
                @click.stop="showDescDialog = true">
                查看更多
              </button>
            </template>
            <p v-else class="text-zinc-700 text-xs italic m-0 leading-relaxed">
              暂无品牌介绍
            </p>
          </div>

          <!-- Description dialog -->
          <BaseDialog v-model:visible="showDescDialog" :title="activeBrand.name">
            <p class="text-zinc-400 text-sm leading-relaxed m-0">
              {{ activeBrand.description }}
            </p>
          </BaseDialog>
        </div>
      </div>

      <!-- Products list -->
      <div v-if="booth.products?.length" class="flex flex-col gap-3 p-4">
        <div v-for="(product, index) in booth.products" :key="product.id || index"
          class="flex rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden hover:border-zinc-600 transition-colors duration-200">
          <!-- Image — left side -->
          <div class="w-36 shrink-0 bg-zinc-700 relative overflow-hidden">
            <img :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover absolute inset-0"
              @error="handleImageError" />
            <div class="absolute inset-0 items-center justify-center text-zinc-700 text-3xl" style="display: none;">
              <i class="i-carbon-image" />
            </div>
          </div>

          <!-- Info — right side -->
          <div class="flex-1 min-w-0 p-3 flex flex-col justify-between gap-2">
            <div class="flex flex-col gap-1.5">
              <h5 class="text-zinc-100 font-semibold text-sm m-0 leading-snug line-clamp-2">
                {{ product.name }}
              </h5>
              <p v-if="product.description" class="text-zinc-500 text-xs leading-relaxed m-0 line-clamp-3">
                {{ product.description }}
              </p>
            </div>

            <div class="flex items-center justify-between mt-auto">
              <span v-if="product.price" class="text-amber-400 font-bold text-base leading-none">
                ¥{{ (product.price / 100).toFixed(2) }}
              </span>
              <span v-else class="flex-1" />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center gap-2 py-10 text-zinc-700">
        <i class="i-carbon-package text-3xl" />
        <span class="text-xs">暂无展品</span>
      </div>
    </div>
  </div>
</template>
