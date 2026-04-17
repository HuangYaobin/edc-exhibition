<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseTabs from '@/components/base/BaseTabs.vue'
import BoothBrandHeader from '@/components/exhibition/BoothBrandHeader.vue'
import BoothProductCard from '@/components/exhibition/BoothProductCard.vue'
// import BrandEditDialog from '@/components/exhibition/BrandEditDialog.vue'
import type { Booth } from '@/api/types'

const props = defineProps<{
  booth: Booth | null
  selectedBrandId?: string | null
  selectedBrandName?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const activeIndex = ref(0)

function resolveActiveIndex() {
  if (!props.booth) return
  if (props.selectedBrandId) {
    const idx = props.booth.brands.findIndex(b => b.id === props.selectedBrandId)
    if (idx >= 0) { activeIndex.value = idx; return }
  }
  if (props.selectedBrandName) {
    const idx = props.booth.brands.findIndex(b => b.name === props.selectedBrandName)
    if (idx >= 0) { activeIndex.value = idx; return }
  }
  activeIndex.value = 0
}

watch(() => [props.booth, props.selectedBrandId, props.selectedBrandName], resolveActiveIndex, { immediate: true })

const brands = computed(() => props.booth?.brands ?? [])
const activeBrand = computed(() => brands.value[activeIndex.value] ?? null)
const hasMultipleBrands = computed(() => brands.value.length > 1)

const showEditDialog = ref(false)

function onEditSaved() {
  emit('updated')
}
</script>

<template>
  <div class="h-full overflow-y-auto hide-scrollbar">
    <template v-if="booth">
      <BaseTabs v-if="hasMultipleBrands" v-model="activeIndex" :items="brands">
        <template #tab="{ item, isActive }">
          <div class="w-4 h-4 rounded-sm overflow-hidden bg-zinc-900 flex items-center justify-center shrink-0">
            <img v-if="item.logoUrl" :src="item.logoUrl" :alt="item.name" class="w-full h-full object-contain" />
            <i v-else class="i-carbon-building text-zinc-500 text-[10px]" />
          </div>
          <span class="truncate max-w-28" :class="isActive ? 'text-zinc-100' : 'text-zinc-500'">{{ item.name }}</span>
        </template>
      </BaseTabs>

      <div class="bg-zinc-900 rounded-lg overflow-hidden">
        <BoothBrandHeader v-if="activeBrand" :brand="activeBrand" :booth-id="booth.id" :booth-number="booth.boothNumber"
          @edit="showEditDialog = true" />

        <div v-if="booth.products?.length" class="flex flex-col gap-3 p-3 pt-1">
          <BoothProductCard v-for="(product, index) in booth.products" :key="product.id || index" :product="product"
            :booth-number="booth.boothNumber" :brand-name="activeBrand?.name ?? ''" />
        </div>

        <div v-else class="flex flex-col items-center justify-center gap-2 py-10 text-zinc-700">
          <i class="i-carbon-package text-3xl" />
          <span class="text-xs">暂无展品</span>
        </div>
      </div>

      <BrandEditDialog v-if="activeBrand" v-model:visible="showEditDialog" :brand="activeBrand" :booth-id="booth.id"
        :products="booth.products ?? []" @saved="onEditSaved" />
    </template>

    <div v-else class="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      <i class="i-carbon-location text-4xl text-zinc-700" />
      <p class="text-sm text-zinc-600 m-0">在地图上点击展位查看详情</p>
    </div>
  </div>
</template>
