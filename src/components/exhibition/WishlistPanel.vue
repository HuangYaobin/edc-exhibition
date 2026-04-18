<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Sortable, { type SortableEvent } from 'sortablejs'
import { useWishlist, type SortBy, type PurchasedFilter } from '@/composables/useWishlist'
import { useAuth } from '@/composables/useAuth'
import { openLoginDialog } from '@/composables/useLoginDialog'
import { useMessage } from '@/composables/useMessage'

const emit = defineEmits<{
  (e: 'highlight-booth', boothNumber: string, brandName?: string): void
  (e: 'drag-state', dragging: boolean): void
}>()

const {
  wishlistItems,
  removeFromWishlist,
  markAsPurchased,
  unmarkAsPurchased,
  loadWishlist,
  reorderItems,
  pendingItems,
  purchasedItems,
  pendingTotal,
  allItems,
  customOrder,
  isLoading,
} = useWishlist()

const { isLoggedIn, maskedIdentifier, logout, forgetIdentifier } = useAuth()
const message = useMessage()
const showAccountMenu = ref(false)
const accountMenuRef = ref<HTMLElement | null>(null)

function handleDocumentClick(e: MouseEvent) {
  if (!showAccountMenu.value) return
  const wrapper = accountMenuRef.value
  if (wrapper && !wrapper.contains(e.target as Node)) {
    showAccountMenu.value = false
  }
}

onMounted(() => {
  if (isLoggedIn.value) {
    reloadWithCurrentView()
  }
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

watch(isLoggedIn, (val) => {
  if (val) reloadWithCurrentView()
})

const filterMode = ref<'pending' | 'purchased' | 'all'>('pending')
const sortMode = ref<SortBy>('custom')

// 展位号是字母+数字混合（A1、A10、B2 等），numeric 选项让 A2 排在 A10 前面。
const boothCollator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' })

function getPurchasedFilter(mode: 'pending' | 'purchased' | 'all'): PurchasedFilter {
  if (mode === 'pending') return 'false'
  if (mode === 'purchased') return 'true'
  return 'all'
}

function reloadWithCurrentView() {
  return loadWishlist(true, sortMode.value, 'desc', getPurchasedFilter(filterMode.value))
}

watch([filterMode, sortMode], reloadWithCurrentView)

async function handleLoginClick() {
  try {
    await openLoginDialog()
  } catch {
    /* user cancelled */
  }
}

async function handleLogout() {
  showAccountMenu.value = false
  await logout()
  message.success('已退出登录')
}

function handleSwitchAccount() {
  showAccountMenu.value = false
  forgetIdentifier()
  logout().finally(() => {
    handleLoginClick()
  })
}

const pendingPurchaseIds = ref<Set<string>>(new Set())

const filteredItems = computed(() => {
  const pids = pendingPurchaseIds.value
  let list: typeof wishlistItems.value

  if (filterMode.value === 'all') {
    list = [...wishlistItems.value]
  } else if (filterMode.value === 'purchased') {
    list = wishlistItems.value.filter(i => i.purchased)
  } else {
    const alreadyPending = wishlistItems.value.filter(i => i.purchased && pids.has(i.productId))
    list = [...wishlistItems.value.filter(i => !i.purchased), ...alreadyPending]
  }

  if (sortMode.value === 'custom') {
    return list
  }
  if (sortMode.value === 'price') {
    return list.sort((a, b) => (b.productPrice ?? 0) - (a.productPrice ?? 0))
  }
  return list.sort((a, b) => boothCollator.compare(a.boothNumber, b.boothNumber))
})

const isDragEnabled = computed(
  () => sortMode.value === 'custom' && filterMode.value !== 'purchased',
)

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
  // Fire the mark API immediately. The row stays visible because `alreadyPending`
  // keeps purchased items that are still in `pendingPurchaseIds`. After the badge
  // animation completes, removing the id from the pending set is the single
  // reactive change that drops the row from `filteredItems`, which lets
  // <TransitionGroup> register a clean leave and play its transition.
  markAsPurchased(productId).catch(() => { })
  setTimeout(() => {
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

const listGroupRef = ref<any>(null)
let sortable: Sortable | null = null
let sortableEl: HTMLElement | null = null

function getListEl(): HTMLElement | null {
  const r = listGroupRef.value
  if (!r) return null
  return (r.$el ?? r) as HTMLElement
}

function handleDragStart() {
  emit('drag-state', true)
}

function handleDragEnd(evt: SortableEvent) {
  emit('drag-state', false)
  const { oldIndex, newIndex } = evt
  if (oldIndex == null || newIndex == null || oldIndex === newIndex) return

  const visibleIds = filteredItems.value.map(i => i.productId)
  const [moved] = visibleIds.splice(oldIndex, 1)
  if (!moved) return
  visibleIds.splice(newIndex, 0, moved)

  // Merge the new visible order back into the full customOrder so items
  // hidden by the current filter keep their relative position.
  const visibleSet = new Set(visibleIds)
  const fullOrder: string[] = []
  let vIdx = 0
  for (const id of customOrder.value) {
    if (visibleSet.has(id)) {
      fullOrder.push(visibleIds[vIdx++])
    } else {
      fullOrder.push(id)
    }
  }
  while (vIdx < visibleIds.length) {
    if (!fullOrder.includes(visibleIds[vIdx])) fullOrder.push(visibleIds[vIdx])
    vIdx++
  }

  reorderItems(fullOrder).catch(() => {
    message.error('排序保存失败')
    if (isLoggedIn.value) reloadWithCurrentView()
  })
}

function destroySortable() {
  if (sortable) {
    sortable.destroy()
    sortable = null
    sortableEl = null
  }
}

function setupSortable() {
  const el = getListEl()
  if (!el) {
    destroySortable()
    return
  }
  if (sortable && sortableEl === el) {
    sortable.option('disabled', !isDragEnabled.value)
    return
  }
  destroySortable()
  sortableEl = el
  sortable = new Sortable(el, {
    animation: 180,
    delay: 250,
    delayOnTouchOnly: true,
    touchStartThreshold: 4,
    handle: '.drag-area',
    filter: 'button, [data-no-drag]',
    preventOnFilter: false,
    ghostClass: 'wishlist-sortable-ghost',
    chosenClass: 'wishlist-sortable-chosen',
    dragClass: 'wishlist-sortable-drag',
    disabled: !isDragEnabled.value,
    onStart: handleDragStart,
    onEnd: handleDragEnd,
  })
}

watch(
  [listGroupRef, isDragEnabled, () => filteredItems.value.length, isLoading],
  () => {
    nextTick(setupSortable)
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  destroySortable()
})
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-zinc-800 rounded-xl">
    <!-- Not logged in state -->
    <div v-if="!isLoggedIn" class="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center flex-1">
      <div class="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
        <i class="i-carbon-user-avatar text-3xl text-zinc-600" />
      </div>
      <div class="flex flex-col gap-1.5">
        <p class="text-sm font-medium text-zinc-400 m-0">登录后即可保存心愿单</p>
        <p class="text-xs text-zinc-600 m-0 leading-relaxed max-w-[220px]">
          仅需手机号或邮箱，免密登录，云端同步，下次访问自动免登
        </p>
      </div>
      <button type="button"
        class="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-zinc-900 bg-amber-400 hover:bg-amber-300 rounded-full cursor-pointer transition-colors"
        @click="handleLoginClick">
        <i class="i-carbon-login text-sm" />
        立即登录
      </button>
    </div>

    <!-- Empty state - 全部数据为空（已登录但心愿单为空） -->
    <div v-else-if="allItems.length === 0 && !isLoading"
      class="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center flex-1 relative">
      <div ref="accountMenuRef" class="absolute top-3 right-3">
        <button type="button"
          class="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 bg-zinc-800/60 border border-zinc-700/60 rounded-full px-2 py-1 cursor-pointer transition-colors"
          @click="showAccountMenu = !showAccountMenu">
          <i class="i-carbon-user-avatar text-xs" />
          {{ maskedIdentifier() ?? '账号' }}
        </button>
        <div v-if="showAccountMenu"
          class="absolute right-0 mt-1 min-w-[120px] bg-zinc-900 border border-zinc-700/60 rounded-lg shadow-lg overflow-hidden z-10">
          <button type="button"
            class="block w-full text-left px-3 py-2 text-[11px] text-zinc-300 hover:bg-zinc-800 cursor-pointer bg-transparent border-none"
            @click="handleSwitchAccount">
            切换账号
          </button>
          <button type="button"
            class="block w-full text-left px-3 py-2 text-[11px] text-rose-400 hover:bg-zinc-800 cursor-pointer bg-transparent border-none border-t border-zinc-800"
            @click="handleLogout">
            退出登录
          </button>
        </div>
      </div>
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
          <div ref="accountMenuRef" class="ml-auto relative">
            <button type="button"
              class="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 bg-zinc-800/60 border border-zinc-700/60 rounded-full px-2 py-1 cursor-pointer transition-colors"
              @click="showAccountMenu = !showAccountMenu">
              <i class="i-carbon-user-avatar text-xs" />
              {{ maskedIdentifier() ?? '账号' }}
            </button>
            <div v-if="showAccountMenu"
              class="absolute right-0 mt-1 min-w-[120px] bg-zinc-900 border border-zinc-700/60 rounded-lg shadow-lg overflow-hidden z-10">
              <button type="button"
                class="block w-full text-left px-3 py-2 text-[11px] text-zinc-300 hover:bg-zinc-800 cursor-pointer bg-transparent border-none"
                @click="handleSwitchAccount">
                切换账号
              </button>
              <button type="button"
                class="block w-full text-left px-3 py-2 text-[11px] text-rose-400 hover:bg-zinc-800 cursor-pointer bg-transparent border-none border-t border-zinc-800"
                @click="handleLogout">
                退出登录
              </button>
            </div>
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
            { key: 'custom' as const, label: '自定义' },
            { key: 'price' as const, label: '价格' },
            { key: 'booth' as const, label: '展位' },
          ])" :key="key" class="text-[11px] px-2 py-1 rounded-full transition-colors cursor-pointer border" :class="sortMode === key
            ? 'bg-zinc-700 text-zinc-300 border-zinc-600'
            : 'bg-transparent text-zinc-600 border-transparent hover:text-zinc-400'" @click="sortMode = key">
            {{ label }}
          </button>
        </div>
      </div>

      <!-- Item list -->
      <div class="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <!-- Loading state -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center gap-2 py-12">
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

        <TransitionGroup v-else ref="listGroupRef" name="wishlist-item" tag="div"
          class="flex flex-col divide-y divide-zinc-800/60">
          <div v-for="item in filteredItems" :key="item.productId" :data-id="item.productId"
            class="drag-area flex gap-3 px-4 py-3 transition-colors duration-300 group cursor-pointer select-none relative"
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

.wishlist-sortable-ghost {
  opacity: 0.4;
  background: rgb(63 63 70 / 0.6);
  outline: 1px dashed rgb(161 161 170 / 0.5);
  outline-offset: -2px;
}

.wishlist-sortable-chosen {
  background: rgb(63 63 70 / 0.4);
}

.wishlist-sortable-drag {
  opacity: 0.95;
  background: rgb(39 39 42);
  box-shadow: 0 12px 24px -8px rgb(0 0 0 / 0.5);
  border-radius: 8px;
}
</style>
