<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useLeaderboard } from '@/composables/useLeaderboard'

type ActiveSection = 'products' | 'booths'

const emit = defineEmits<{
  (e: 'select-booth', boothNumber: string, brandName?: string): void
}>()

const { topProducts, topBooths, updatedAt, loading, error, fetchLeaderboard } = useLeaderboard()
const activeSection = ref<ActiveSection>('products')

onMounted(() => fetchLeaderboard())

function formatUpdatedAt(ts: number | null) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} 更新`
}

const MEDAL_COLORS = ['text-amber-400', 'text-zinc-300', 'text-amber-600']
</script>

<template>
  <div class="flex flex-col gap-0 overflow-hidden h-full bg-zinc-800 rounded-xl">
    <!-- Header -->
    <div class="px-4 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-zinc-800/60 shrink-0">
      <div class="flex items-center gap-2">
        <i class="i-carbon-trophy text-amber-400 text-base" />
        <span class="text-zinc-200 font-semibold text-sm">排行榜</span>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="updatedAt" class="text-[10px] text-zinc-600">
          {{ formatUpdatedAt(updatedAt) }}
        </span>
        <button
          class="flex items-center justify-center w-6 h-6 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer border-none bg-transparent"
          :class="loading ? 'animate-spin pointer-events-none' : ''" title="刷新" @click="fetchLeaderboard(true)">
          <i class="i-carbon-renew text-sm" />
        </button>
      </div>
    </div>

    <!-- Section tabs -->
    <div class="flex items-center gap-1.5 px-4 py-2 border-b border-zinc-800/60 shrink-0">
      <button v-for="({ key, label, icon }) in ([
        { key: 'products', label: '热门产品', icon: 'i-carbon-favorite-filled' },
        { key: 'booths', label: '热门展位', icon: 'i-carbon-location-filled' },
      ] as const)" :key="key"
        class="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full transition-colors cursor-pointer border"
        :class="activeSection === key
          ? 'bg-zinc-700 text-zinc-200 border-zinc-600'
          : 'bg-transparent text-zinc-600 border-zinc-800 hover:text-zinc-400 hover:border-zinc-700'"
        @click="activeSection = key">
        <i :class="[icon, 'text-[11px]']" />
        {{ label }}
      </button>
    </div>

    <!-- Error state -->
    <div v-if="error" class="flex flex-col items-center gap-3 py-12 px-6 text-center">
      <i class="i-carbon-warning text-2xl text-zinc-600" />
      <p class="text-xs text-zinc-500 m-0">{{ error }}</p>
      <button
        class="text-xs text-zinc-400 border border-zinc-700 rounded-lg px-3 py-1.5 hover:bg-zinc-800 transition-colors cursor-pointer bg-transparent"
        @click="fetchLeaderboard(true)">
        重新加载
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-else-if="loading && !topProducts.length && !topBooths.length"
      class="flex flex-col divide-y divide-zinc-800/60 overflow-y-auto">
      <div v-for="i in 8" :key="i" class="flex items-center gap-3 px-4 py-3">
        <div class="w-7 h-5 rounded bg-zinc-800 animate-pulse shrink-0" />
        <div class="w-10 h-10 rounded-xl bg-zinc-800 animate-pulse shrink-0" />
        <div class="flex-1 flex flex-col gap-1.5">
          <div class="h-3 bg-zinc-800 rounded animate-pulse w-3/4" />
          <div class="h-2.5 bg-zinc-800/60 rounded animate-pulse w-1/2" />
        </div>
        <div class="w-10 h-4 rounded bg-zinc-800 animate-pulse" />
      </div>
    </div>

    <!-- Hot Products list -->
    <div v-else-if="activeSection === 'products'"
      class="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent flex-1">
      <div class="flex flex-col divide-y divide-zinc-800/60">
        <button v-for="(item, index) in topProducts" :key="item.productId"
          class="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors text-left w-full border-none bg-transparent cursor-pointer group"
          @click="emit('select-booth', item.boothNumber, item.brandName)">

          <!-- Rank number -->
          <div class="w-7 shrink-0 flex justify-center">
            <span v-if="index < 3" class="text-lg font-black leading-none" :class="MEDAL_COLORS[index]">
              {{ index + 1 }}
            </span>
            <span v-else class="text-sm font-medium text-zinc-600 leading-none">
              {{ index + 1 }}
            </span>
          </div>

          <!-- Product image placeholder -->
          <div
            class="w-10 h-10 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center overflow-hidden">
            <img v-if="item.productImage" :src="item.productImage" :alt="item.productName"
              class="w-full h-full object-cover" />
            <i v-else class="i-carbon-package text-zinc-600 text-base" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0 flex flex-col gap-0.5">
            <p
              class="text-zinc-100 text-xs font-medium m-0 leading-snug line-clamp-2 group-hover:text-white transition-colors">
              {{ item.productName }}
            </p>
            <div class="flex items-center gap-1.5">
              <span class="text-zinc-500 text-[10px]">{{ item.brandName }}</span>
              <span class="text-zinc-700 text-[10px]">·</span>
              <span class="text-zinc-600 text-[10px]">{{ item.boothNumber }}</span>
            </div>
          </div>

          <!-- Count -->
          <div class="shrink-0 flex items-center gap-1 text-zinc-500">
            <i class="i-carbon-favorite text-[11px]" />
            <span class="text-[11px] font-medium tabular-nums">{{ item.wishlistCount }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Hot Booths list -->
    <div v-else-if="activeSection === 'booths'"
      class="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent flex-1">
      <div class="flex flex-col divide-y divide-zinc-800/60">
        <button v-for="(item, index) in topBooths" :key="item.boothNumber"
          class="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors text-left w-full border-none bg-transparent cursor-pointer group"
          @click="emit('select-booth', item.boothNumber, item.brandName)">

          <!-- Rank number -->
          <div class="w-7 shrink-0 flex justify-center">
            <span v-if="index < 3" class="text-lg font-black leading-none" :class="MEDAL_COLORS[index]">
              {{ index + 1 }}
            </span>
            <span v-else class="text-sm font-medium text-zinc-600 leading-none">
              {{ index + 1 }}
            </span>
          </div>

          <!-- Brand logo placeholder -->
          <div
            class="w-10 h-10 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center overflow-hidden">
            <img v-if="item.brandLogo" :src="item.brandLogo" :alt="item.brandName"
              class="w-full h-full object-contain p-1" />
            <i v-else class="i-carbon-store text-zinc-600 text-base" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0 flex flex-col gap-0.5">
            <p class="text-zinc-100 text-xs font-medium m-0 leading-snug group-hover:text-white transition-colors">
              {{ item.brandName }}
            </p>
            <span class="text-zinc-600 text-[10px]">展位 {{ item.boothNumber }}</span>
          </div>

          <!-- Count -->
          <div class="shrink-0 flex items-center gap-1 text-zinc-500">
            <i class="i-carbon-checkmark-outline text-[11px]" />
            <span class="text-[11px] font-medium tabular-nums">{{ item.checkinCount }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
