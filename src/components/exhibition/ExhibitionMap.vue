<script setup lang="ts">
// 使用 ?skipsvgo：默认 ?component 会走 SVGO，mergePaths 等会把相同样式的 path 合并，导致 id 丢失/交互失效
import EshowMap from '@/assets/eshow-map.svg?skipsvgo'
import { useExhibitionMap } from '@/composables/useExhibitionMap'

const BOOTH_IDS = ['A01', 'A02', 'B01', 'B02', 'B03', 'B05', 'B06', 'B07', 'B08', 'B09-B10', 'B11-B12', 'B13-B15', 'B16-B17', 'B18-B19', 'B20-21', 'B22', 'B23', 'B25', 'B26', 'B27', 'B28', 'B29', 'B30-B31', 'B32-B33', 'B35-B36', 'B37-B38', 'B39-B50', 'B51-B52', 'B53', 'B55', 'B56', 'B57', 'B58', 'B59', 'B60', 'B61', 'B62', 'B63', 'B65', 'B66', 'B67', 'B68', 'C01', 'C02', 'C03', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11', 'C12', 'C13', 'C15', 'C16', 'C17', 'C18', 'C19', 'C20', 'C21', 'C22', 'C23', 'C25', 'C26', 'C27', 'C28', 'C29', 'C30', 'C31', 'C32', 'C33', 'C35', 'C36', 'C37', 'C38', 'C39', 'C50', 'C51', 'C52', 'C53', 'C55', 'C56', 'C57', 'C58', 'C59'] as const

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

.eshow-map :deep(.map-highlight-divider-clone) {
  stroke: #422006 !important;
}
</style>
