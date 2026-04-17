<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import type { Swiper as SwiperClass } from 'swiper/types'
import 'swiper/css'
import BoothDetail from '@/components/exhibition/BoothDetail.vue'
import DebugMapPanel from '@/components/exhibition/DebugMapPanel.vue'
import ExhibitionLayout from '@/components/exhibition/ExhibitionLayout.vue'
import ExhibitionMap from '@/components/exhibition/ExhibitionMap.vue'
// import LeaderboardPanel from '@/components/exhibition/LeaderboardPanel.vue'
// import WishlistPanel from '@/components/exhibition/WishlistPanel.vue'
import BrandListPanel from '@/components/exhibition/BrandListPanel.vue'
import BaseTabBar from '@/components/base/BaseTabBar.vue'
import type { TabBarItem } from '@/components/base/BaseTabBar.vue'
import { getBoothByNumber } from '@/api'
import type { Booth } from '@/api/types'
// import { useWishlist } from '@/composables/useWishlist'

const mapRef = ref<InstanceType<typeof ExhibitionMap> | null>(null)

const activeTab = ref<'brands' | 'booth' | 'wishlist' | 'leaderboard' | 'chat'>('brands')
const selectedBoothId = ref<string | null>('B01')
const selectedBoothData = ref<Booth | null>(null)
const selectedBrandId = ref<string | null>(null)
const selectedBrandName = ref<string | null>(null)
const loadingBooth = ref(false)

const tabItems: TabBarItem[] = [
  { key: 'brands', label: '品牌列表', icon: 'i-carbon-catalog' },
  { key: 'booth', label: '展位详情', icon: 'i-carbon-location' },
  // { key: 'wishlist', label: '心愿单', icon: 'i-carbon-favorite' },
  // { key: 'leaderboard', label: '排行榜', icon: 'i-carbon-trophy' },
  // { key: 'chat', label: '聊天室', icon: 'i-carbon-chat' },
]

const swiperTabKeys = ['brands', 'booth'] as const
type SwiperTabKey = typeof swiperTabKeys[number]
const swiperRef = ref<SwiperClass | null>(null)

function onSlideChange(swiper: SwiperClass) {
  const key = swiperTabKeys[swiper.activeIndex]
  if (key && key !== activeTab.value)
    activeTab.value = key
}

watch(activeTab, (key) => {
  const idx = swiperTabKeys.indexOf(key as SwiperTabKey)
  if (idx >= 0 && swiperRef.value && swiperRef.value.activeIndex !== idx)
    swiperRef.value.slideTo(idx)
})

// const { loadWishlist } = useWishlist()

onMounted(() => {
  fetchBoothData('A01')
  // loadWishlist()
})

async function fetchBoothData(id: string) {
  loadingBooth.value = true
  try {
    const booth = await getBoothByNumber(id)
    selectedBoothData.value = booth
  }
  catch (e) {
    console.error('Failed to fetch booth data:', e)
    selectedBoothData.value = null
  }
  finally {
    loadingBooth.value = false
  }
}

function onBoothClick(id: string | null) {
  selectedBoothId.value = id
  if (id) {
    fetchBoothData(id)
    activeTab.value = 'booth'
  }
  else {
    selectedBoothData.value = null
  }
}

function onSelectBrand(boothNumber: string, brandId?: string) {
  selectedBrandId.value = brandId ?? null
  selectedBrandName.value = null
  onBoothClick(boothNumber)
  mapRef.value?.focusBooth(boothNumber)
}

// function onLeaderboardSelect(boothNumber: string, brandName?: string) {
//   selectedBrandId.value = null
//   selectedBrandName.value = brandName ?? null
//   onBoothClick(boothNumber)
//   mapRef.value?.focusBooth(boothNumber)
// }

// function onHighlightBooth(boothNumber: string, brandName?: string) {
//   selectedBrandId.value = null
//   selectedBrandName.value = brandName ?? null
//   selectedBoothId.value = boothNumber
//   fetchBoothData(boothNumber)
//   mapRef.value?.focusBooth(boothNumber)
// }
</script>

<template>
  <ExhibitionLayout>
    <template #map>
      <div class="flex flex-col gap-2">
        <DebugMapPanel @focus="(id) => { onBoothClick(id); mapRef?.focusBooth(id) }" @reset="mapRef?.resetView()" />
        <ExhibitionMap ref="mapRef" :selected-booth-id="selectedBoothId" @booth-click="onBoothClick" />
      </div>
    </template>

    <template #detail>
      <div class="h-full flex flex-col">
        <!-- <div
          class="relative flex items-center gap-2.5 px-2 py-1 bg-gradient-to-r from-amber-500/8 to-transparent shrink-0">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-400/60 rounded-r-full" />
          <i class="i-carbon-information text-amber-400/90 text-base shrink-0 relative -top-px" />
          <span class="text-[13px] text-amber-200/80 font-medium tracking-wide">内容为参考信息，具体以官方为准</span>
        </div> -->
        <div class="flex-1 min-h-0 flex flex-col">
          <Swiper class="h-full w-full" :slides-per-view="1" :space-between="0" :touch-angle="40" :threshold="8"
            :resistance-ratio="0" @swiper="swiperRef = $event" @slide-change="onSlideChange">
            <SwiperSlide class="!flex flex-col min-h-0">
              <BrandListPanel @select-brand="onSelectBrand" />
            </SwiperSlide>
            <SwiperSlide class="!flex flex-col min-h-0">
              <BoothDetail :booth="selectedBoothData && !loadingBooth ? selectedBoothData : null"
                :selected-brand-id="selectedBrandId" :selected-brand-name="selectedBrandName"
                @updated="selectedBoothId && fetchBoothData(selectedBoothId)" />
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </template>
  </ExhibitionLayout>

  <BaseTabBar v-model="activeTab" :items="tabItems" />
</template>

<style>
.swiper,
.swiper-wrapper {
  height: 100%;
}
</style>
