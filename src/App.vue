<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BoothDetail from '@/components/exhibition/BoothDetail.vue'
import DebugMapPanel from '@/components/exhibition/DebugMapPanel.vue'
import ExhibitionLayout from '@/components/exhibition/ExhibitionLayout.vue'
import ExhibitionMap from '@/components/exhibition/ExhibitionMap.vue'
import { getBoothByNumber } from '@/api'
import type { Booth } from '@/api/types'

const mapRef = ref<InstanceType<typeof ExhibitionMap> | null>(null)

const selectedBoothId = ref<string | null>('B01')
const selectedBoothData = ref<Booth | null>(null)
const loadingBooth = ref(false)

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
  if (id)
    fetchBoothData(id)
  else
    selectedBoothData.value = null
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
      <BoothDetail v-if="selectedBoothData && !loadingBooth" :booth="selectedBoothData" />
    </template>
  </ExhibitionLayout>
</template>
