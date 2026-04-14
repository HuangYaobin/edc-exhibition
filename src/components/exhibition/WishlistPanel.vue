<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useWishlist, type SortBy, type PurchasedFilter } from '@/composables/useWishlist'

const emit = defineEmits<{
  (e: 'highlight-booth', boothNumber: string, brandName?: string): void
}>()

const {
  wishlistItems,
  removeFromWishlist,
  markAsPurchased,
  unmarkAsPurchased,
  loadWishlist,
  pendingItems,
  purchasedItems,
  pendingTotal,
  allItems,
  isLoading,
} = useWishlist()

onMounted(() => {
  loadWishlist(true)
})

const filterMode = ref<'pending' | 'purchased' | 'all'>('pending')
const sortMode = ref<SortBy>('price')

function getPurchasedFilter(mode: 'pending' | 'purchased' | 'all'): PurchasedFilter {
  if (mode === 'pending') return 'false'
  if (mode === 'purchased') return 'true'
  return 'all'
}

watch([filterMode, sortMode], ([newFilter, newSort]) => {
  loadWishlist(true, newSort, 'desc', getPurchasedFilter(newFilter))
})

const pendingPurchaseIds = ref<Set<string>>(new Set())

const filteredItems = computed(() => {
  const pids = pendingPurchaseIds.value
  let list: typeof wishlistItems.value
  
  if (filterMode.value === 'all') {
    list = [...wishlistItems.value]
  } else if (filterMode.value === 'purchased') {
    list = [...wishlistItems.value]
  } else {
    const alreadyPending = wishlistItems.value.filter(i => i.purchased && pids.has(i.productId))
    list = [...wishlistItems.value.filter(i => !i.purchased), ...alreadyPending]
  }

  if (sortMode.value === 'price') {
    return list.sort((a, b) => (b.productPrice ?? 0) - (a.productPrice ?? 0))
  }
  return list.sort((a, b) => a.brandName.localeCompare(b.brandName))
})

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const placeholder = target.nextElementSibling as HTMLElement
  if (placeholder)
    placeholder.style.display = 'flex'
}

function handleMarkPurchased(productId: string) {
  pendingPurchaseIds.value = new Set([...pendingPurchaseIds.value, productId])
  setTimeout(() => {
    markAsPurchased(productId)
    const next = new Set([...pendingPurchaseIds.value])
    next.delete(productId)
    pendingPurchaseIds.value = next
  }, 520)
}

function isPendingPurchase(productId: string) {
  return pendingPurchaseIds.value.has(productId)
}

const activeBooth = ref<string | null>(null)

function handleRowClick(boothNumber: string, brandName?: string) {
  activeBooth.value = boothNumber
  emit('highlight-booth', boothNumber, brandName)
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-zinc-800 rounded-xl">
    <!-- Empty state - 全部数据为空 -->
    <div v-if="allItems.length === 0 && !isLoading"
      class="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center flex-1">
      <div class="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
        <i class="i-carbon-favorite text-3xl text-zinc-600" />
      </div>
      <div class="flex flex-col gap-1.5">
        <p class="text-sm font-medium text-zinc-400 m-0">心愿单是空的</p>
        <p class="text-xs text-zinc-600 m-0 leading-relaxed max-w-[200px]">
          浏览展位，点击商品旁边的 ♡ 收藏感兴趣的单品
        </p>
      </div>
    </div>

    <template v-else>
      <!-- Stats header -->
      <div class="shrink-0 px-4 pt-3 pb-2.5 border-b border-zinc-800/60">
        <div class="flex items-center gap-3">
          <div class="flex flex-col">
            <span class="text-[10px] text-zinc-600 leading-none mb-0.5">待购入</span>
            <span class="text-zinc-200 font-bold text-sm leading-none">
              {{ pendingItems.length }}
              <span class="text-zinc-500 font-normal text-xs">件</span>
            </span>
          </div>
          <div class="w-px h-6 bg-zinc-700" />
          <div class="flex flex-col">
            <span class="text-[10px] text-zinc-600 leading-none mb-0.5">已购入</span>
            <span class="text-emerald-400 font-bold text-sm leading-none">
              {{ purchasedItems.length }}
              <span class="text-zinc-500 font-normal text-xs">件</span>
            </span>
          </div>
          <div class="w-px h-6 bg-zinc-700" />
          <div class="flex flex-col">
            <span class="text-[10px] text-zinc-600 leading-none mb-0.5">待购合计</span>
            <span class="text-amber-400 font-bold text-sm leading-none">
              ¥{{ formatPrice(pendingTotal) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Filter tabs + sort pills -->
      <div class="shrink-0 flex items-center justify-between gap-2 px-4 py-2 border-b border-zinc-800/60">
        <div class="flex items-center gap-1">
          <button v-for="({ key, label }) in ([
            { key: 'pending', label: '待购入' },
            { key: 'purchased', label: '已购入' },
            { key: 'all', label: '全部' },
          ] as const)" :key="key" class="text-[11px] px-2.5 py-1 rounded-full transition-colors cursor-pointer border"
            :class="filterMode === key
              ? 'bg-zinc-600 text-zinc-100 border-zinc-500'
              : 'bg-transparent text-zinc-600 border-zinc-700 hover:text-zinc-400 hover:border-zinc-600'"
            @click="filterMode = key">
            {{ label }}
          </button>
        </div>
        <div class="flex items-center gap-1">
          <button v-for="({ key, label }) in ([
            { key: 'price' as const, label: '按价格' },
            { key: 'brand' as const, label: '按品牌' },
          ])" :key="key" class="text-[11px] px-2 py-1 rounded-full transition-colors cursor-pointer border"
            :class="sortMode === key
              ? 'bg-zinc-700 text-zinc-300 border-zinc-600'
              : 'bg-transparent text-zinc-600 border-transparent hover:text-zinc-400'" @click="sortMode = key">
            {{ label }}
          </button>
        </div>
      </div>

      <!-- Item list -->
      <div class="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <!-- Loading state -->
        <div v-if="isLoading"
          class="flex flex-col items-center justify-center gap-2 py-12">
          <div class="w-6 h-6 border-2 border-zinc-600 border-t-amber-400 rounded-full animate-spin" />
          <span class="text-xs text-zinc-500">加载中...</span>
        </div>

        <!-- Filtered empty state -->
        <div v-else-if="filteredItems.length === 0"
          class="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center">
          <i class="i-carbon-checkmark-outline text-2xl text-zinc-600" />
          <p class="text-xs text-zinc-600 m-0">
            {{ filterMode === 'purchased' ? '还没有已购入的商品' : filterMode === 'pending' ? '所有商品已购入 ✓' : '没有符合条件的商品' }}
          </p>
        </div>

        <TransitionGroup v-else name="wishlist-item" tag="div" class="flex flex-col divide-y divide-zinc-800/60">
          <div v-for="item in filteredItems" :key="item.productId"
            class="flex gap-3 px-4 py-3 transition-colors duration-300 group cursor-pointer select-none relative"
            :class="activeBooth === item.boothNumber
              ? 'bg-zinc-700/30 active:bg-zinc-700/50'
              : (item.purchased || isPendingPurchase(item.productId))
                ? 'bg-zinc-800/20 active:bg-zinc-800/40'
                : 'active:bg-zinc-700/30'" @click="handleRowClick(item.boothNumber, item.brandName)">

            <!-- Active booth indicator -->
            <Transition name="booth-bar">
              <div v-if="activeBooth === item.boothNumber"
                class="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-amber-400" />
            </Transition>

            <!-- Thumbnail -->
            <div class="w-[60px] h-[60px] shrink-0 rounded-xl border relative overflow-hidden" :class="(item.purchased || isPendingPurchase(item.productId))
              ? 'bg-zinc-800/60 border-zinc-700/30'
              : 'bg-zinc-800 border-zinc-700/60'">
              <template v-if="item.productImage">
                <img :src="item.productImage" :alt="item.productName"
                  class="w-full h-full object-cover absolute inset-0 transition-opacity"
                  :class="(item.purchased || isPendingPurchase(item.productId)) ? 'opacity-35' : ''"
                  @error="handleImageError" />
                <div class="absolute inset-0 items-center justify-center text-zinc-700 text-xl" style="display: none;">
                  <i class="i-carbon-image" />
                </div>
              </template>
              <div v-else class="absolute inset-0 flex items-center justify-center text-zinc-700 text-xl">
                <i class="i-carbon-package" />
              </div>
              <Transition name="badge-pop">
                <div v-if="item.purchased || isPendingPurchase(item.productId)"
                  class="absolute inset-0 flex items-center justify-center">
                  <div class="w-5 h-5 rounded-full bg-emerald-500/90 flex items-center justify-center">
                    <i class="i-carbon-checkmark text-white text-[10px]" />
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0 flex flex-col justify-between gap-1 py-0.5">
              <!-- Top: name + remove -->
              <div class="flex items-start gap-1">
                <h5 class="flex-1 min-w-0 font-medium text-sm m-0 leading-snug line-clamp-2 transition-colors" :class="(item.purchased || isPendingPurchase(item.productId))
                  ? 'text-zinc-500 line-through decoration-zinc-600'
                  : 'text-zinc-100'">
                  {{ item.productName }}
                </h5>
                <button
                  class="shrink-0 mt-0.5 text-zinc-500 active:text-rose-400 transition-colors p-0.5 cursor-pointer border-none bg-transparent"
                  title="移出心愿单" @click.stop="removeFromWishlist(item.productId)">
                  <i class="i-carbon-trash-can text-11px" />
                </button>
              </div>

              <!-- Brand -->
              <p class="text-xs m-0 leading-none truncate"
                :class="(item.purchased || isPendingPurchase(item.productId)) ? 'text-zinc-600' : 'text-zinc-500'">
                {{ item.brandName }}
              </p>

              <!-- Bottom row -->
              <div class="flex items-center gap-2 flex-wrap mt-0.5">
                <span v-if="item.productPrice" class="font-bold text-sm leading-none transition-colors" :class="(item.purchased || isPendingPurchase(item.productId))
                  ? 'text-zinc-600 line-through'
                  : 'text-amber-400'">
                  ¥{{ formatPrice(item.productPrice) }}
                </span>
                <span v-else class="text-zinc-600 text-xs">价格待定</span>

                <!-- Booth number — plain display -->
                <span class="inline-flex items-center gap-0.5 text-[11px] text-zinc-600">
                  <i class="i-carbon-location text-[11px]" />
                  {{ item.boothNumber }}
                </span>

                <!-- Purchase toggle -->
                <div class="ml-auto">
                  <!-- Normal: not purchased, not pending -->
                  <button v-if="!item.purchased && !isPendingPurchase(item.productId)"
                    class="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-700/50 border border-zinc-600/40 rounded-full px-2 py-0.5 cursor-pointer active:bg-zinc-600/50 transition-colors"
                    @click.stop="handleMarkPurchased(item.productId)">
                    <i class="i-carbon-shopping-bag-check text-[11px]" />
                    拿下
                  </button>
                  <!-- Pending: visually confirmed, stays visible until animation plays -->
                  <span v-else-if="isPendingPurchase(item.productId)"
                    class="inline-flex items-center gap-1 text-[11px] text-emerald-500/70 bg-emerald-900/20 border border-emerald-800/30 rounded-full px-2 py-0.5">
                    <i class="i-carbon-checkmark text-[11px]" />
                    拿下
                  </span>
                  <!-- Purchased: show undo -->
                  <button v-else-if="item.purchased"
                    class="inline-flex items-center gap-1 text-[11px] text-zinc-600 bg-transparent border border-zinc-700/50 rounded-full px-2 py-0.5 cursor-pointer active:bg-zinc-700/30 transition-colors"
                    @click.stop="unmarkAsPurchased(item.productId)">
                    <i class="i-carbon-undo text-[11px]" />
                    撤销
                  </button>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
        <div class="h-4" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.wishlist-item-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.wishlist-item-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease, max-height 0.4s ease, padding-top 0.4s ease, padding-bottom 0.4s ease;
  max-height: 120px;
  overflow: hidden;
}

.wishlist-item-enter-from {
  opacity: 0;
  transform: translateX(-6px);
}

.wishlist-item-leave-to {
  opacity: 0;
  transform: translateX(10px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.badge-pop-enter-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.badge-pop-enter-from {
  opacity: 0;
  transform: scale(0.4);
}

.booth-bar-enter-active,
.booth-bar-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.booth-bar-enter-from,
.booth-bar-leave-to {
  opacity: 0;
  transform: scaleY(0.4);
}
</style>
