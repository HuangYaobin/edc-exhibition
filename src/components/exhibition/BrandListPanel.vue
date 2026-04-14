<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getAllBooths } from '@/api'
import type { BoothBrand } from '@/api/types'

interface BrandEntry extends BoothBrand {
  boothNumber: string
}

const emit = defineEmits<{
  (e: 'select-brand', boothNumber: string, brandId: string): void
}>()

const loading = ref(true)
const brandEntries = ref<BrandEntry[]>([])
const searchQuery = ref('')

const filteredBrands = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return brandEntries.value
  return brandEntries.value.filter(b =>
    b.name.toLowerCase().includes(q)
    || (b.nameEn?.toLowerCase().includes(q) ?? false),
  )
})

onMounted(async () => {
  try {
    const booths = await getAllBooths()
    brandEntries.value = booths.flatMap(booth =>
      booth.brands.map(brand => ({
        ...brand,
        boothNumber: booth.boothNumber,
      })),
    )
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex flex-col overflow-hidden">
    <!-- Search bar -->
    <div class="px-1 pb-2 shrink-0">
      <div class="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2  transition-colors">
        <i class="i-carbon-search text-zinc-500 text-sm shrink-0" />
        <input v-model="searchQuery" type="search" placeholder="搜索品牌…"
          class="flex-1 min-w-0 bg-transparent text-zinc-200 text-sm outline-none placeholder-zinc-600" />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center gap-2 py-10 text-zinc-700">
      <i class="i-carbon-circle-dash text-2xl animate-spin" />
      <span class="text-xs">加载中…</span>
    </div>

    <!-- Empty search result -->
    <div v-else-if="filteredBrands.length === 0"
      class="flex flex-col items-center justify-center gap-2 py-10 text-zinc-700">
      <i class="i-carbon-search text-3xl" />
      <span class="text-xs">未找到相关品牌</span>
    </div>

    <!-- Brand list -->
    <div v-else
      class="flex flex-col gap-2 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
      <button v-for="brand in filteredBrands" :key="brand.id"
        class="flex items-center gap-3 w-full text-left bg-zinc-900 rounded-xl px-3 py-2.5 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/70 active:bg-zinc-800 transition-colors cursor-pointer"
        @click="emit('select-brand', brand.boothNumber, brand.id)">
        <!-- Logo -->
        <div
          class="w-9 h-9 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
          <img v-if="brand.logoUrl" :src="brand.logoUrl" :alt="brand.name" class="w-full h-full object-contain" />
          <i v-else class="i-carbon-building text-zinc-500 text-base" />
        </div>

        <!-- Name -->
        <div class="flex-1 min-w-0">
          <p class="text-zinc-100 text-sm font-medium m-0 leading-snug truncate">{{ brand.name }}</p>
          <p v-if="brand.nameEn" class="text-zinc-500 text-xs m-0 mt-0.5 leading-snug truncate">{{ brand.nameEn }}</p>
        </div>

        <!-- Booth number badge -->
        <span
          class="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-800 border border-zinc-700 rounded-full px-2.5 py-1 shrink-0">
          <i class="i-carbon-location text-zinc-600 text-xs" />
          {{ brand.boothNumber }}
        </span>
      </button>
    </div>
  </div>
</template>
