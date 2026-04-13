<script setup lang="ts">
// 使用 ?skipsvgo：默认 ?component 会走 SVGO，mergePaths 等会把相同样式的 path 合并，导致 id 丢失/交互失效
import EshowMap from '@/assets/eshow-map.svg?skipsvgo'
import { useExhibitionMap } from '@/composables/useExhibitionMap'

const BOOTH_IDS = ['B01', 'B02', 'B03', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'C59', 'A01', 'A02'] as const

const props = defineProps<{
  selectedBoothId: string | null
}>()

const emit = defineEmits<{
  (e: 'boothClick', id: string | null): void
}>()

const { onMapClick, focusBooth, resetView } = useExhibitionMap({
  boothIds: BOOTH_IDS,
  selectedBoothId: () => props.selectedBoothId,
  onBoothClick: id => emit('boothClick', id),
})

defineExpose({ focusBooth, resetView })
</script>

<template>
  <div ref="viewportRef" class="h-[33.33vh] w-full touch-none overflow-hidden rounded-xl">
    <div ref="panzoomTargetRef" class="h-full w-full">
      <EshowMap ref="mapRef" class="eshow-map block h-full w-full select-none" role="img" aria-label="展会地图"
        @click="onMapClick" />
    </div>
  </div>
</template>

<style scoped>
/* ── 展位为带 id 的 g，子元素 path 继承交互区域 ── */
.eshow-map :deep(#B01),
.eshow-map :deep(#B02),
.eshow-map :deep(#B03),
.eshow-map :deep(#B05),
.eshow-map :deep(#B06),
.eshow-map :deep(#B07),
.eshow-map :deep(#B08),
.eshow-map :deep(#B09),
.eshow-map :deep(#B10),
.eshow-map :deep(#C59),
.eshow-map :deep(#A01),
.eshow-map :deep(#A02) {
  cursor: pointer;
  transition:
    fill 0.15s ease,
    stroke 0.15s ease,
    stroke-width 0.15s ease;
}

/* 顶层高亮层：第一个 path = 展位外形 */
.eshow-map :deep(.map-highlight-clone) {
  fill: #ffe066 !important;
  stroke: #ca8a04 !important;
  stroke-width: 2px !important;
}

.eshow-map :deep(.map-highlight-label-clone) {
  fill: #422006 !important;
}
</style>
