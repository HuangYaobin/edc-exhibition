<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseTabs from '@/components/base/BaseTabs.vue'
import { useExhibitionStore } from '@/store'
import { useMobile } from '@/composables/useMobile'
import { useMessage } from '@/composables/useMessage'
import BrandEditModal from '@/components/exhibition/BrandEditModal.vue'
import ExhibitionProductItem from '@/components/exhibition/ExhibitionProductItem.vue'
import ExhibitionGiftItem from '@/components/exhibition/ExhibitionGiftItem.vue'
import ExhibitionArticleItem from '@/components/exhibition/ExhibitionArticleItem.vue'
import ProductGallery from '@/components/exhibition/ProductGallery.vue'
import ExhibitionBrandHeader from '@/components/exhibition/ExhibitionBrandHeader.vue'
import ExhibitionActivities from '@/components/exhibition/ExhibitionActivities.vue'
import ExhibitionExperience from '@/components/exhibition/ExhibitionExperience.vue'
import ExhibitionContact from '@/components/exhibition/ExhibitionContact.vue'

type BrandProduct = {
  productName: string
  productImage: string
  productDescription?: string
  productPrice?: string
  productStock?: string
}

type BrandImageItem = string | { src: string; caption?: string }

type BrandGift = {
  giftName: string
  giftImage: string
  giftDescription?: string[]
  giftStock?: string
}

type BrandItem = {
  name: string
  logo: string
  description?: string
  exhibitionNumber: string
  backgroundImage?: string
  productImages?: BrandImageItem[]
  exhibitionProducts?: BrandProduct[]
  exhibitionGifts?: BrandGift[]
  exhibitionActivities?: Array<{
    type: string
    title: string
    description?: string
    schedule?: { startAt?: string; endAt?: string }
    location?: string
    eligibility?: string[]
    prizes?: Array<{ name: string; image?: string; quantity?: number | string }>
  }>
  exhibitionExperience?: Array<{
    experienceName: string
    experienceImage: string
    experienceDescription?: string[]
  }>
  relatedArticles?: { title: string; link: string }[]
  contact?: {
    wechatQr?: string
    officialAccountQr?: string
    wechatId?: string
    phone?: string
  }
}

type Brand = BrandItem | null

const props = defineProps<{
  visible: boolean
  brands: BrandItem[]
  boothNumber?: string
  focusBrandName?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'copied', title: string): void
}>()

// Active brand switching
const activeIndex = ref<number>(0)
const transitionName = ref<string>('fade')
const brand = computed<Brand>(() => {
  if (!props.brands || props.brands.length === 0) return null
  return props.brands[Math.min(activeIndex.value, props.brands.length - 1)]
})

// Slide direction based on tab index change
watch(activeIndex, (newVal, oldVal) => {
  if (newVal === oldVal) return
  transitionName.value = newVal > oldVal ? 'slide-left' : 'slide-right'
})

watch(
  () => [props.brands, props.visible, props.focusBrandName],
  () => {
    // Prefer focusing a specific brand if requested
    if (props.focusBrandName && props.brands && props.brands.length > 0) {
      const idx = props.brands.findIndex((b) => b.name === props.focusBrandName)
      activeIndex.value = idx >= 0 ? idx : 0
    } else {
      activeIndex.value = 0
    }
  },
  { deep: true }
)

// Mobile detection (via composable)
const { isMobile } = useMobile()

// Close
const handleClose = () => emit('update:visible', false)

// Edit modal
const showEdit = ref(false)
const openEdit = () => {
  if (!brand.value) return
  showEdit.value = true
}
const handleSaveBrand = (updated: BrandItem) => {
  if (!brand.value) return
  const target = brand.value as BrandItem
  target.name = updated.name
  target.logo = updated.logo
  target.description = updated.description
  target.exhibitionNumber = updated.exhibitionNumber
  target.backgroundImage = updated.backgroundImage
  target.exhibitionProducts = updated.exhibitionProducts || []
  target.exhibitionGifts = (updated as any).exhibitionGifts || []
  ;(target as any).exhibitionActivities = (updated as any).exhibitionActivities || []
  target.relatedArticles = updated.relatedArticles || []
}

// Prevent body scroll when open
onMounted(() => {
  if (props.visible) document.body.classList.add('modal-open')
})
onUnmounted(() => {
  document.body.classList.remove('modal-open')
})

// Keep body scroll locked while modal visible (covers subsequent opens)
watch(
  () => props.visible,
  (isOpen) => {
    if (typeof document === 'undefined') return
    const classList = document.body.classList
    if (isOpen) classList.add('modal-open')
    else classList.remove('modal-open')
  }
)

// Image fallback now handled via ElImage error slots

// bubble article copy event
const handleArticleCopied = (title: string) => emit('copied', title)

// Exhibition store
const exhibitionStore = useExhibitionStore()

const isBrandFavorited = computed(() => {
  if (!brand.value) return false
  return exhibitionStore.isBrandFavorited(brand.value.name)
})

const toggleBrandFavorite = () => {
  if (!brand.value) return
  exhibitionStore.toggleFavoriteBrand(brand.value.name)
}

// Contact modal state
const contactVisible = ref(false)
const openContact = () => {
  if (!brand.value) return
  contactVisible.value = true
}

// Backend poster preview state
const posterPreviewVisible = ref(false)
const posterPreviewItems = ref<{ src: string; caption?: string }[]>([])
const downloadingPoster = ref(false)

async function requestBackendPoster(): Promise<void> {
  if (!brand.value) return
  try {
    downloadingPoster.value = true
    const res = await fetch('/api/poster/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boothNumber: brand.value.exhibitionNumber, brandName: brand.value.name, width: 750 }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(errText || '生成失败')
    }
    const blob = await res.blob()
    if (blob.type && blob.type.includes('application/json')) {
      const text = await blob.text()
      throw new Error(text || '生成失败')
    }
    const url = URL.createObjectURL(blob)
    posterPreviewItems.value = [{ src: url, caption: `${brand.value.name} · 展位 ${brand.value.exhibitionNumber}` }]
    posterPreviewVisible.value = true
  } catch (e) {
    const msg = e instanceof Error ? e.message : '海报生成失败，请稍后重试'
    error(msg)
  } finally {
    downloadingPoster.value = false
  }
}

// Poster actions
function getDeepLinkUrl(): string {
  if (typeof window === 'undefined' || !brand.value) return ''
  return `${window.location.origin}/event-map?booth=${encodeURIComponent(brand.value.exhibitionNumber)}&brand=${encodeURIComponent(brand.value.name)}`
}

async function downloadPosterFromPreview(): Promise<void> {
  const item = posterPreviewItems.value[0]
  if (!item?.src) return
  const a = document.createElement('a')
  const safeBrand = brand.value ? `${brand.value.name}-${brand.value.exhibitionNumber}` : 'poster'
  a.href = item.src
  a.download = `${safeBrand}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

async function shareDeepLink(): Promise<void> {
  const url = getDeepLinkUrl()
  if (!url) return
  try {
    if (navigator.share) {
      await navigator.share({
        title: brand.value ? `${brand.value.name} · 展位 ${brand.value.exhibitionNumber}` : '展位信息',
        text: '查看品牌展位信息',
        url,
      })
      return
    }
  } catch (e) {}
  try {
    await navigator.clipboard.writeText(url)
    success('链接已复制，可直接分享')
  } catch (e) {
    error('无法复制链接，请手动复制')
  }
}

// Cleanup object URLs when closing preview
watch(
  () => posterPreviewVisible.value,
  (v) => {
    if (!v) {
      for (const it of posterPreviewItems.value) {
        try {
          if (it?.src?.startsWith('blob:')) URL.revokeObjectURL(it.src)
        } catch {}
      }
      posterPreviewItems.value = []
    }
  }
)

const isProductIntended = (productName: string) => {
  if (!brand.value) return false
  return exhibitionStore.isProductInIntentionList(brand.value.exhibitionNumber, productName)
}

const toggleProductIntention = (product: BrandProduct) => {
  if (!brand.value) return
  exhibitionStore.toggleIntentionProduct({
    boothNumber: brand.value.exhibitionNumber,
    brandName: brand.value.name,
    productName: product.productName,
    productImage: product.productImage,
  })
}

const isGiftIntended = (giftName: string) => {
  if (!brand.value) return false
  return exhibitionStore.isProductInIntentionList(brand.value.exhibitionNumber, giftName)
}

const toggleGiftIntention = (gift: BrandGift) => {
  if (!brand.value) return
  exhibitionStore.toggleIntentionProduct({
    boothNumber: brand.value.exhibitionNumber,
    brandName: brand.value.name,
    productName: gift.giftName,
    productImage: gift.giftImage,
  })
}

// Product gallery with captions support
type GalleryItem = { src: string; caption?: string }

const productGallery = computed<GalleryItem[]>(() => {
  if (!brand.value) return []
  const images = (brand.value as any).productImages as BrandImageItem[] | undefined
  if (Array.isArray(images) && images.length > 0) {
    return images.map((img) => (typeof img === 'string' ? { src: img } : { src: img.src, caption: img.caption })).filter((g) => Boolean(g.src))
  }
  if (brand.value.exhibitionProducts && brand.value.exhibitionProducts.length > 0) {
    return brand.value.exhibitionProducts.map((p) => ({ src: p.productImage, caption: p.productName || p.productDescription })).filter((g) => Boolean(g.src))
  }
  return []
})

// v-lazy moved to directives; kept type import for compatibility

// Mobile swipe to switch brands
const touchStartX = ref(0)
const touchStartY = ref(0)
const onTouchStart = (e: TouchEvent) => {
  if (!e.touches || e.touches.length === 0) return
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}
const onTouchEnd = (e: TouchEvent) => {
  if (!props.brands || props.brands.length <= 1) return
  const touch = e.changedTouches && e.changedTouches[0]
  if (!touch) return
  const dx = touch.clientX - touchStartX.value
  const dy = touch.clientY - touchStartY.value
  // Ignore vertical scrolls
  if (Math.abs(dy) > 40) return
  // Swipe threshold
  if (dx > 50) {
    activeIndex.value = Math.max(0, activeIndex.value - 1)
  } else if (dx < -50) {
    activeIndex.value = Math.min(props.brands.length - 1, activeIndex.value + 1)
  }
}

// Removed client-side poster generation; handled by server now
const desktopContentRef = ref<HTMLElement | null>(null)
const mobileContentRef = ref<HTMLElement | null>(null)
const { success, error } = useMessage()

// Client-side poster download removed

const shareLink = async () => {
  if (!brand.value || typeof window === 'undefined') return
  const url = `${window.location.origin}/event-map?booth=${encodeURIComponent(brand.value.exhibitionNumber)}&brand=${encodeURIComponent(brand.value.name)}`
  try {
    if (navigator.share) {
      await navigator.share({
        title: `${brand.value.name} · 展位 ${brand.value.exhibitionNumber}`,
        text: '查看品牌展位信息',
        url,
      })
      return
    }
  } catch (e) {
    // fallthrough to clipboard
  }
  try {
    await navigator.clipboard.writeText(url)
    success('链接已复制，可直接分享')
  } catch (e) {
    error('无法复制链接，请手动复制')
  }
}
</script>

<template>
  <BaseModal :visible="visible" :is-mobile="isMobile" @update:visible="emit('update:visible', $event)" :enableModal="!isMobile">
    <!-- Desktop -->
    <template #desktop>
      <div class="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-500">
        <div class="flex flex-col bg-[#f3f4f6] rounded-md w-60vw overflow-hidden pointer-events-auto relative h-90vh" role="dialog" aria-modal="true">
          <!-- Header -->
          <div class="flex justify-between items-center p-4 pb-2 relative z-1">
            <h3 class="font-medium flex items-center bg-black/60 rounded-md">
              <span v-if="brand" text="sm blue-800" class="bg-blue-100 px-3 py-1 rounded-md font-semibold">{{ brand.exhibitionNumber }}</span>
              <span text="sm gray-200 dark:gray-100" class="px-2">展位信息</span>
            </h3>
            <div class="flex items-center gap-2">
              <button
                @click="requestBackendPoster"
                :disabled="downloadingPoster"
                class="flex items-center justify-center p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-60"
                text="xl gray-600 hover:gray-800 dark:gray-300 dark:hover:gray-100"
                aria-label="分享海报"
                title="分享海报"
              >
                <i class="i-carbon-share"></i>
              </button>
              <button
                @click="handleClose"
                text="xl gray-500 hover:gray-700 dark:gray-400 dark:hover:gray-200"
                class="flex items-center justify-center p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                aria-label="关闭"
              >
                <i class="i-carbon-close"></i>
              </button>
            </div>
          </div>

          <!-- Tabs Bar (fixed, Chrome-like) -->
          <BaseTabs v-if="brands && brands.length > 1" v-model:model-value="activeIndex" :items="brands">
            <template #tab="{ item, isActive }">
              <el-image :src="(item as any).logo" alt="" class="w-4 h-4 rounded-sm object-contain" fit="contain">
                <template #error>
                  <div class="w-4 h-4 rounded-sm bg-gray-100"></div>
                </template>
              </el-image>
              <span class="truncate max-w-32" :class="{ 'font-medium': isActive }">{{ (item as any).name }}</span>
            </template>
          </BaseTabs>

          <!-- Content -->
          <div class="p-1 rounded-lg bg-white flex flex-col min-h-0 flex-1 relative">
            <div class="flex-1 overflow-x-hidden overflow-y-auto p-5">
              <div>
                <transition :name="transitionName" mode="out-in">
                  <div v-if="brand" :key="activeIndex" ref="desktopContentRef">
                    <div v-if="brand && brand.backgroundImage" class="h-300px pointer-events-none select-none rounded-md overflow-hidden mb-8">
                      <el-image :src="brand.backgroundImage" alt="" class="w-full h-full object-cover" fit="cover" lazy aria-hidden="true">
                        <template #error>
                          <div class="w-full h-full bg-gray-100"></div>
                        </template>
                      </el-image>
                    </div>

                    <!-- Header: Left-Right Layout -->
                    <ExhibitionBrandHeader
                      class="mb-8"
                      :name="brand.name"
                      :logo="brand.logo"
                      :description="brand.description"
                      :is-favorited="isBrandFavorited"
                      :logo-class="'w-28 h-28 md:w-32 md:h-32'"
                      :title-class="'text-2xl text-gray-800'"
                      :description-class="'text-sm text-gray-600 indent-4'"
                      @toggle-favorite="toggleBrandFavorite"
                      @edit="openEdit"
                      @contact="openContact"
                    />

                    <!-- Experience -->
                    <div v-if="(brand as any).exhibitionExperience && (brand as any).exhibitionExperience.length > 0" class="mb-8">
                      <BaseDivider title="产品体验" />
                      <ExhibitionExperience :experiences="(brand as any).exhibitionExperience" />
                    </div>

                    <!-- Products -->
                    <div v-if="brand.exhibitionProducts && brand.exhibitionProducts.length > 0" class="mb-8">
                      <BaseDivider title="展位可购买产品" />
                      <div class="space-y-3">
                        <ExhibitionProductItem
                          v-for="(product, index) in brand.exhibitionProducts"
                          :key="index"
                          :name="product.productName"
                          :image="product.productImage"
                          :description="product.productDescription"
                          :price="product.productPrice"
                          :stock="product.productStock"
                          :intended="isProductIntended(product.productName)"
                          rounded-class="rounded"
                          @toggle="toggleProductIntention(product)"
                        />
                      </div>
                    </div>

                    <!-- Gifts -->
                    <div v-if="brand.exhibitionGifts && brand.exhibitionGifts.length > 0" class="mb-8">
                      <BaseDivider title="展会小礼品" />
                      <div class="space-y-3">
                        <ExhibitionGiftItem
                          v-for="(gift, idx) in brand.exhibitionGifts"
                          :key="idx"
                          :name="gift.giftName"
                          :image="gift.giftImage"
                          :description="gift.giftDescription"
                          :stock="gift.giftStock"
                          :intended="isGiftIntended(gift.giftName)"
                          rounded-class="rounded"
                          @toggle="toggleGiftIntention(gift)"
                        />
                      </div>
                    </div>

                    <!-- Activities -->
                    <div v-if="(brand as any).exhibitionActivities && (brand as any).exhibitionActivities.length > 0" class="mb-8">
                      <BaseDivider title="展会活动" />
                      <ExhibitionActivities :activities="(brand as any).exhibitionActivities" :booth-number="brand.exhibitionNumber" />
                    </div>

                    <!-- Experience (mobile) -->
                    <div v-if="(brand as any).exhibitionExperience && (brand as any).exhibitionExperience.length > 0">
                      <BaseDivider title="产品体验" />
                      <ExhibitionExperience :experiences="(brand as any).exhibitionExperience" />
                    </div>

                    <!-- Articles -->
                    <div v-if="brand.relatedArticles && brand.relatedArticles.length > 0" class="mb-8" :data-poster-exclude="true">
                      <BaseDivider title="相关文章" />
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ExhibitionArticleItem v-for="(article, index) in brand.relatedArticles" :key="index" :title="article.title" :link="article.link" @copied="handleArticleCopied" />
                      </div>
                    </div>

                    <!-- No articles -->
                    <div v-else-if="brand" class="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm text-gray-500">暂无相关文章</div>

                    <!-- Product Gallery (Desktop) -->
                    <div v-if="productGallery.length > 0">
                      <BaseDivider title="产品图集" />
                      <ProductGallery :items="productGallery" :cols="2" show-caption />
                    </div>
                  </div>
                </transition>
              </div>

              <!-- No brand -->
              <div v-if="!brand" class="text-center py-8">
                <div class="text-gray-500 text-lg mb-2">暂无品牌信息</div>
                <div class="text-gray-400 text-sm">展位号: {{ boothNumber }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Drawer (Mobile) -->
    <template #drawer>
      <div class="mobile-drawer bg-[#f3f4f6] fixed inset-0 flex flex-col z-500" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="px-4 pt-3 pb-2">
          <div class="h-1.5 w-12 bg-gray-300 rounded mx-auto mb-2"></div>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <span v-if="brand" class="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-semibold mr-1">{{ brand.exhibitionNumber }}</span>
              <span>展位信息</span>
            </h3>
            <div class="flex items-center gap-2">
              <button
                @click="requestBackendPoster"
                :disabled="downloadingPoster"
                class="flex items-center justify-center text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-60"
                aria-label="分享海报"
                title="分享海报"
              >
                <i class="i-carbon-share text-xl"></i>
              </button>
              <button
                @click="handleClose"
                class="flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                aria-label="关闭"
              >
                <i class="i-carbon-close text-xl"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Tabs Bar (fixed, Chrome-like) -->
        <BaseTabs v-if="brands && brands.length > 1" v-model:model-value="activeIndex" :items="brands">
          <template #tab="{ item, isActive }">
            <el-image :src="(item as any).logo" alt="" class="w-4 h-4 rounded-sm object-contain" fit="contain">
              <template #error>
                <div class="w-4 h-4 rounded-sm bg-gray-100"></div>
              </template>
            </el-image>
            <span class="truncate max-w-32" :class="{ 'font-medium': isActive }">{{ (item as any).name }}</span>
          </template>
        </BaseTabs>

        <!-- Content -->
        <div class="p-2 rounded-lg bg-white flex flex-col min-h-0 flex-1">
          <div class="flex-1 overflow-x-hidden overflow-y-auto p-3" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
            <transition :name="transitionName" mode="out-in">
              <div v-if="brand" class="space-y-4" :key="activeIndex" ref="mobileContentRef" style="background-color: #ffffff">
                <!-- Background banner (mobile) -->
                <div v-if="brand && brand.backgroundImage" class="h-44 rounded-md overflow-hidden mb-2 pointer-events-none select-none">
                  <el-image :src="brand.backgroundImage" alt="" class="w-full h-full object-cover" fit="cover" lazy aria-hidden="true">
                    <template #error>
                      <div class="w-full h-full bg-gray-100"></div>
                    </template>
                  </el-image>
                </div>
                <!-- Header: Left-Right Layout (match desktop structure) -->
                <ExhibitionBrandHeader
                  :name="brand.name"
                  :logo="brand.logo"
                  :description="brand.description"
                  :is-favorited="isBrandFavorited"
                  :logo-class="'w-28 h-28'"
                  :title-class="'text-2xl text-gray-800'"
                  :description-class="'text-gray-600'"
                  @toggle-favorite="toggleBrandFavorite"
                  @edit="openEdit"
                />

                <!-- Products (match desktop ordering and naming) -->
                <div v-if="brand.exhibitionProducts && brand.exhibitionProducts.length > 0">
                  <BaseDivider title="展位可购买产品" />
                  <div class="space-y-3">
                    <ExhibitionProductItem
                      v-for="(product, index) in brand.exhibitionProducts"
                      :key="index"
                      :name="product.productName"
                      :image="product.productImage"
                      :description="product.productDescription"
                      :price="product.productPrice"
                      :stock="product.productStock"
                      :intended="isProductIntended(product.productName)"
                      rounded-class="rounded-xl"
                      image-class-extra="border border-gray-200"
                      @toggle="toggleProductIntention(product)"
                    />
                  </div>
                </div>

                <!-- Gifts (mobile) -->
                <div v-if="brand.exhibitionGifts && brand.exhibitionGifts.length > 0">
                  <BaseDivider title="展会小礼品" />
                  <div class="space-y-3">
                    <ExhibitionGiftItem
                      v-for="(gift, idx) in brand.exhibitionGifts"
                      :key="idx"
                      :name="gift.giftName"
                      :image="gift.giftImage"
                      :description="gift.giftDescription"
                      :stock="gift.giftStock"
                      :intended="isGiftIntended(gift.giftName)"
                      rounded-class="rounded-xl"
                      image-class-extra="border border-gray-200"
                      @toggle="toggleGiftIntention(gift)"
                    />
                  </div>
                </div>

                <!-- Activities (mobile) -->
                <div v-if="(brand as any).exhibitionActivities && (brand as any).exhibitionActivities.length > 0">
                  <BaseDivider title="展会活动" />
                  <ExhibitionActivities :activities="(brand as any).exhibitionActivities" />
                </div>

                <!-- Experience (mobile) -->
                <div v-if="(brand as any).exhibitionExperience && (brand as any).exhibitionExperience.length > 0">
                  <BaseDivider title="产品体验" />
                  <ExhibitionExperience :experiences="(brand as any).exhibitionExperience" />
                </div>

                <div v-if="brand.relatedArticles && brand.relatedArticles.length > 0" :data-poster-exclude="true">
                  <BaseDivider title="相关文章" />
                  <div class="grid grid-cols-1 gap-2">
                    <ExhibitionArticleItem v-for="(article, index) in brand.relatedArticles" :key="index" :title="article.title" :link="article.link" @copied="handleArticleCopied" />
                  </div>
                </div>

                <div v-else-if="brand" class="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm text-gray-500">暂无相关文章</div>

                <!-- Product Gallery (Mobile moved to bottom to match desktop order) -->
                <div v-if="productGallery.length > 0">
                  <BaseDivider title="产品图集" />
                  <ProductGallery :items="productGallery" :cols="2" show-caption />
                </div>
              </div>
            </transition>
          </div>

          <div v-if="!brand" class="text-center py-8">
            <div class="text-gray-500 text-lg mb-2">暂无品牌信息</div>
            <div class="text-gray-400 text-sm">展位号: {{ boothNumber }}</div>
          </div>
        </div>
      </div>
    </template>
  </BaseModal>

  <!-- Backend poster preview using BaseModal -->
  <BaseModal :visible="posterPreviewVisible" :is-mobile="isMobile" @update:visible="(v) => (posterPreviewVisible = v)" :enableModal="!isMobile">
    <template #desktop>
      <div class="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-500">
        <div class="flex flex-col bg-white rounded-md overflow-hidden pointer-events-auto relative max-w-[90vw]">
          <div class="flex justify-between items-center p-3 border-b border-gray-200">
            <div class="text-gray-800 font-medium">海报预览</div>
            <button class="p-1 rounded hover:bg-gray-100 cursor-pointer" @click="posterPreviewVisible = false" aria-label="关闭">
              <i class="i-carbon-close text-xl text-gray-600"></i>
            </button>
          </div>
          <div class="p-3">
            <img :src="posterPreviewItems[0]?.src" alt="poster" class="max-w-[86vw] max-h-[72vh] object-contain rounded border border-gray-200" />
          </div>
          <div class="px-3 pb-3 flex justify-center gap-2">
            <button class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer" @click="downloadPosterFromPreview">下载海报</button>
            <button class="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded cursor-pointer" @click="shareDeepLink">分享链接</button>
          </div>
        </div>
      </div>
    </template>

    <template #drawer>
      <div class="mobile-drawer bg-white fixed inset-0 flex flex-col z-500">
        <div class="px-4 pt-3 pb-2 border-b border-gray-200">
          <div class="h-1.5 w-12 bg-gray-300 rounded mx-auto mb-2"></div>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">海报预览</h3>
            <button class="p-1 rounded hover:bg-gray-100 text-gray-600 cursor-pointer" @click="posterPreviewVisible = false" aria-label="关闭">
              <i class="i-carbon-close text-xl"></i>
            </button>
          </div>
        </div>
        <div class="p-3 flex-1 overflow-auto">
          <img :src="posterPreviewItems[0]?.src" alt="poster" class="w-full max-h-[70vh] object-contain rounded border border-gray-200" />
        </div>
        <div class="p-3 flex justify-center gap-2 border-t border-gray-200">
          <button class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer" @click="downloadPosterFromPreview">下载海报</button>
          <button class="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded cursor-pointer" @click="shareDeepLink">分享链接</button>
        </div>
      </div>
    </template>
  </BaseModal>

  <!-- Contact modal using BaseModal -->
  <ExhibitionContact :visible="contactVisible" :contact="(brand as any)?.contact" @update:visible="(v) => (contactVisible = v)" />

  <!-- Edit brand modal -->
  <BrandEditModal :visible="showEdit" :brand="(brand as any)" @update:visible="(v) => (showEdit = v)" @save="handleSaveBrand" />
</template>

<style scoped>
/* Smooth brand switching */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Direction-aware slide transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-left-enter-from {
  transform: translateX(24px);
  opacity: 0;
}
.slide-left-leave-to {
  transform: translateX(-24px);
  opacity: 0;
}
.slide-right-enter-from {
  transform: translateX(-24px);
  opacity: 0;
}
.slide-right-leave-to {
  transform: translateX(24px);
  opacity: 0;
}

/* Tabs styles moved to BaseTabs */

@media (max-width: 768px) {
  .mobile-drawer {
    will-change: transform;
    backface-visibility: hidden;
  }
}

/* iOS/Android 安全区适配，避免刘海与 Home 指示条遮挡 */
.mobile-drawer {
  /* 旧版 iOS Safari */
  padding-top: constant(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-left: constant(safe-area-inset-left);
  padding-right: constant(safe-area-inset-right);

  /* 现代浏览器 */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* Progressive image blur-up */
.progressive-image {
  filter: blur(12px);
  transform: scale(1.02);
  opacity: 0;
  transition: filter 0.35s ease, transform 0.35s ease, opacity 0.35s ease;
}

.progressive-image.loaded {
  filter: blur(0);
  transform: scale(1);
  opacity: 1;
}
</style>
