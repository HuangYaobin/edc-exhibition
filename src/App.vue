<script setup lang="ts">
import Panzoom from '@panzoom/panzoom'
import type { ComponentPublicInstance } from 'vue'
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch }
 from 'vue'
// 使用 ?skipsvgo：默认 ?component 会走 SVGO，mergePaths 等会把相同样式的 path 合并，导致 id 丢失/交互失效
import EshowMap from '@/assets/eshow-map.svg?skipsvgo'
import BoothDetail from '@/components/exhibition/BoothDetail.vue'
import { getBoothByNumber } from '@/api'
import type { Booth } from '@/api/types'

const SVG_NS = 'http://www.w3.org/2000/svg'

const BOOTH_IDS = ['B01', 'B02', 'B03', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'C59', 'A01', 'A02'] as const
type BoothId = (typeof BOOTH_IDS)[number]

const BOOTH_ID_SET = new Set<string>(BOOTH_IDS)

const selectedBoothId = ref<BoothId | null>('B01')
const selectedBoothData = ref<Booth | null>(null)
const loadingBooth = ref(false)

async function fetchBoothData(boothNumber: string) {
  loadingBooth.value = true
  try {
    const booth = await getBoothByNumber(boothNumber)
    selectedBoothData.value = booth
  } catch (e) {
    console.error('Failed to fetch booth data:', e)
    selectedBoothData.value = null
  } finally {
    loadingBooth.value = false
  }
}
const mapRef = useTemplateRef<ComponentPublicInstance>('mapRef')
const viewportRef = useTemplateRef<HTMLElement>('viewportRef')
const panzoomTargetRef = useTemplateRef<HTMLElement>('panzoomTargetRef')

let panzoom: ReturnType<typeof Panzoom> | null = null
let removeWheelListener: (() => void) | null = null

function isBoothId(id: string): id is BoothId {
  return BOOTH_ID_SET.has(id)
}

function getSvgRoot(): SVGSVGElement | null {
  const inst = mapRef.value
  if (!inst) return null
  const el = inst.$el
  return el instanceof SVGSVGElement ? el : null
}

/** 在 svg 根上追加高亮层；按子节点顺序克隆所有 path 与 text。仅首个 path 用展位高亮色，其余 path（如 logo）无额外 class，颜色与源图一致 */
function syncHighlightOverlay() {
  const svg = getSvgRoot()
  if (!svg) return

  svg.querySelectorAll('.map-highlight-clone').forEach((n) => n.remove())
  svg.querySelector('g.map-highlight-layer')?.remove()

  const id = selectedBoothId.value
  if (!id) return

  const group = svg.querySelector(`#${CSS.escape(id)}`)
  if (!(group instanceof SVGGElement)) return

  const layer = document.createElementNS(SVG_NS, 'g')
  layer.classList.add('map-highlight-layer')
  layer.setAttribute('pointer-events', 'none')

  let pathIndex = 0
  for (const child of group.children) {
    if (child instanceof SVGPathElement) {
      const clone = child.cloneNode(true) as SVGPathElement
      clone.removeAttribute('id')
      // 仅第一个 path 加高亮 class；logo 等额外 path 不加 class，避免任何 CSS 改色，与原图一致
      if (pathIndex === 0) clone.classList.add('map-highlight-clone')
      pathIndex++
      layer.appendChild(clone)
    }
    else if (child instanceof SVGTextElement) {
      const clone = child.cloneNode(true) as SVGTextElement
      clone.removeAttribute('id')
      clone.classList.add('map-highlight-label-clone')
      layer.appendChild(clone)
    }
  }

  if (!layer.firstChild) return
  svg.appendChild(layer)
}

watch(selectedBoothId, syncHighlightOverlay, { flush: 'post' })

function initPanzoom() {
  const target = panzoomTargetRef.value
  const viewport = viewportRef.value
  if (!target || !viewport) return

  panzoom = Panzoom(target, {
    maxScale: 4,
    minScale: 1,
    step: 0.12,
    contain: 'outside',
    panOnlyWhenZoomed: true,
    cursor: 'grab',
  })

  const onWheel = (e: WheelEvent) => {
    panzoom?.zoomWithWheel(e)
  }
  viewport.addEventListener('wheel', onWheel, { passive: false })
  removeWheelListener = () => viewport.removeEventListener('wheel', onWheel)
}

onMounted(() => {
  nextTick(() => {
    syncHighlightOverlay()
    initPanzoom()
  })
  fetchBoothData('B01')
})

onBeforeUnmount(() => {
  removeWheelListener?.()
  removeWheelListener = null
  panzoom?.destroy()
  panzoom = null
})

function onMapClick(e: MouseEvent) {
  const el = (e.target as Element | null)?.closest('g[id]')
  const id = el?.id
  if (!id || !isBoothId(id)) return
  if (selectedBoothId.value === id) {
    selectedBoothId.value = null
    selectedBoothData.value = null
  } else {
    selectedBoothId.value = id
    fetchBoothData(id)
  }
}
</script>

<template>
  <div class="flex flex-col p-4 gap-2" style="height: 100%; overflow: hidden;">
    <div ref="viewportRef"
      class="map-viewport touch-none overflow-hidden border border-neutral-200 rounded-lg bg-neutral-50 flex-1 min-h-0">
      <div ref="panzoomTargetRef" class="map-panzoom-target  w-full origin-top-left bg-neutral-100">
        <EshowMap ref="mapRef" class="eshow-map block  w-full select-none" role="img" aria-label="展会地图"
          @click="onMapClick" />
      </div>
    </div>
    <p class="shrink-0 text-sm op-70" style="min-height: 1.5em">
      <template v-if="loadingBooth">
        <span class="op-50">正在加载展位信息...</span>
      </template>
      <template v-else-if="selectedBoothId">
        当前展位：<code>{{ selectedBoothId }}</code>（再点一次可取消选中）
      </template>
      <template v-else>
        <span class="op-50">点击展位 B01-B10, C59, A01, A02 查看详情。</span>
      </template>
    </p>

    <!-- 展位详情 -->
    <BoothDetail v-if="selectedBoothData && !loadingBooth" :booth="selectedBoothData" class="mt-4 shrink-0" />
  </div>
</template>

<style scoped>
/* 展位为带 id 的 g，子元素 path 继承交互区域 */
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
