<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BoothDetail from '@/components/exhibition/BoothDetail.vue'
import ChatroomPanel from '@/components/exhibition/ChatroomPanel.vue'
import DebugMapPanel from '@/components/exhibition/DebugMapPanel.vue'
import ExhibitionLayout from '@/components/exhibition/ExhibitionLayout.vue'
import ExhibitionMap from '@/components/exhibition/ExhibitionMap.vue'
import LeaderboardPanel from '@/components/exhibition/LeaderboardPanel.vue'
import WishlistPanel from '@/components/exhibition/WishlistPanel.vue'
import BrandListPanel from '@/components/exhibition/BrandListPanel.vue'
import BaseTabBar from '@/components/base/BaseTabBar.vue'
import type { TabBarItem } from '@/components/base/BaseTabBar.vue'
import { getBoothByNumber } from '@/api'
import type { Booth } from '@/api/types'

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
  { key: 'wishlist', label: '心愿单', icon: 'i-carbon-favorite' },
  { key: 'leaderboard', label: '排行榜', icon: 'i-carbon-trophy' },
  // { key: 'chat', label: '聊天室', icon: 'i-carbon-chat' },
]

onMounted(() => fetchBoothData('B01'))

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

function onLeaderboardSelect(boothNumber: string, brandName?: string) {
  selectedBrandId.value = null
  selectedBrandName.value = brandName ?? null
  onBoothClick(boothNumber)
  mapRef.value?.focusBooth(boothNumber)
}

function onHighlightBooth(boothNumber: string, brandName?: string) {
  selectedBrandId.value = null
  selectedBrandName.value = brandName ?? null
  selectedBoothId.value = boothNumber
  fetchBoothData(boothNumber)
  mapRef.value?.focusBooth(boothNumber)
}
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
      <Transition name="tab-fade" mode="out-in">
        <BrandListPanel v-if="activeTab === 'brands'" key="brands" @select-brand="onSelectBrand" />
        <BoothDetail v-else-if="activeTab === 'booth'" key="booth"
          :booth="selectedBoothData && !loadingBooth ? selectedBoothData : null"
          :selected-brand-id="selectedBrandId"
          :selected-brand-name="selectedBrandName"
          @updated="selectedBoothId && fetchBoothData(selectedBoothId)" />
        <WishlistPanel v-else-if="activeTab === 'wishlist'" key="wishlist" @highlight-booth="onHighlightBooth" />
        <LeaderboardPanel v-else-if="activeTab === 'leaderboard'" key="leaderboard" @select-booth="onLeaderboardSelect" />
        <ChatroomPanel v-else-if="activeTab === 'chat'" key="chat" />
      </Transition>
    </template>
  </ExhibitionLayout>

  <BaseTabBar v-model="activeTab" :items="tabItems" />
</template>

<style>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.15s ease;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}
</style>
