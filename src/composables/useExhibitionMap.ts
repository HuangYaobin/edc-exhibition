import Panzoom from '@panzoom/panzoom'
import type { ComponentPublicInstance } from 'vue'
import { onBeforeUnmount, onMounted, nextTick, useTemplateRef, watch } from 'vue'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** 展位聚焦动画时长（ms） */
const FOCUS_DURATION = 420

/** 聚焦后展位占 viewport 短边的目标比例 */
const FOCUS_FILL_RATIO = 0.4

export interface UseExhibitionMapOptions {
  /** 可交互的展位 id 列表 */
  boothIds: readonly string[]
  /** 当前选中展位（reactive getter） */
  selectedBoothId: () => string | null
  /** 点击展位回调 */
  onBoothClick: (id: string | null) => void
}

export function useExhibitionMap(options: UseExhibitionMapOptions) {
  const { boothIds, selectedBoothId, onBoothClick } = options
  const boothIdSet = new Set<string>(boothIds)

  const mapRef = useTemplateRef<ComponentPublicInstance>('mapRef')
  const viewportRef = useTemplateRef<HTMLElement>('viewportRef')
  const panzoomTargetRef = useTemplateRef<HTMLElement>('panzoomTargetRef')

  let panzoom: ReturnType<typeof Panzoom> | null = null
  let removeWheelListener: (() => void) | null = null

  // ── SVG helpers ──────────────────────────────────────────────────────────

  function getSvgRoot(): SVGSVGElement | null {
    const inst = mapRef.value
    if (!inst) return null
    const el = inst.$el
    return el instanceof SVGSVGElement ? el : null
  }

  /**
   * 计算 SVG 在 panzoom-target 内（scale=1 时）的渲染比例和偏移。
   * SVG 默认 preserveAspectRatio="xMidYMid meet"，内容等比居中适配容器。
   */
  function getSvgRenderTransform(svg: SVGSVGElement) {
    const vb = svg.viewBox.baseVal
    const vpRect = viewportRef.value!.getBoundingClientRect()
    const vpW = vpRect.width
    const vpH = vpRect.height
    const scale = Math.min(vpW / vb.width, vpH / vb.height)
    const offsetX = (vpW - vb.width * scale) / 2
    const offsetY = (vpH - vb.height * scale) / 2
    return { scale, offsetX, offsetY, vpW, vpH }
  }

  // ── 高亮 overlay ─────────────────────────────────────────────────────────

  /** 在 SVG 顶层叠加选中展位的高亮克隆层 */
  function syncHighlightOverlay() {
    const svg = getSvgRoot()
    if (!svg) return

    svg.querySelectorAll('.map-highlight-clone').forEach(n => n.remove())
    svg.querySelector('g.map-highlight-layer')?.remove()

    const id = selectedBoothId()
    if (!id) return

    const group = svg.querySelector(`#${CSS.escape(id)}`)
    if (!(group instanceof SVGGElement)) return

    const layer = document.createElementNS(SVG_NS, 'g')
    layer.classList.add('map-highlight-layer')
    layer.setAttribute('pointer-events', 'none')
    // Preserve the group's own transform (e.g. translate added by Inkscape) so
    // the cloned children render at the correct visual position.
    const groupTransform = group.getAttribute('transform')
    if (groupTransform) layer.setAttribute('transform', groupTransform)

    let pathIndex = 0
    for (const child of group.children) {
      if (child instanceof SVGPathElement) {
        const clone = child.cloneNode(true) as SVGPathElement
        clone.removeAttribute('id')
        // 仅第一个 path（展位外形）加高亮色；后续 path（logo 等）保持原色
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

  // ── Panzoom ───────────────────────────────────────────────────────────────

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

    const onWheel = (e: WheelEvent) => panzoom?.zoomWithWheel(e)
    viewport.addEventListener('wheel', onWheel, { passive: false })
    removeWheelListener = () => viewport.removeEventListener('wheel', onWheel)
  }

  /**
   * 平滑移动并缩放到指定展位。
   *
   * 原理：
   * 1. 用 getBBox() 取展位在 SVG viewBox 坐标系中的 bounding box
   * 2. 将坐标换算为 panzoom-target 坐标系（scale=1 时）的像素位置
   * 3. 计算出目标 panzoom scale（展位占短边约 40%）
   * 4. 算出使展位中心对齐 viewport 中心的 translate
   * 5. 通过 CSS transition 一次性动画缩放+平移（避免分两步抖动）
   * 6. 动画结束后同步 panzoom 内部状态，保证后续手势正常
   *
   * 注意：panzoom 对 HTML 元素强制写入 transform-origin: 50% 50%（inline style，
   * 会覆盖 Tailwind origin-* 类），并以 scale(s) translate(x, y) 格式设置 transform。
   * 该格式下屏幕坐标公式为：screen = s*(point + x) + vpW/2*(1-s)
   * → 要把 (bcx, bcy) 居中：x = vpW/2 - bcx（与 scale 无关）
   * contain:'outside' 约束：x ∈ [-vpW*(s-1)/(2s), vpW*(s-1)/(2s)]
   */
  function focusBooth(id: string) {
    const svg = getSvgRoot()
    const viewport = viewportRef.value
    const target = panzoomTargetRef.value
    if (!svg || !viewport || !target || !panzoom) return

    const group = svg.querySelector(`#${CSS.escape(id)}`)
    if (!(group instanceof SVGGElement)) return

    const rawBbox = group.getBBox()
    const { scale: svgScale, offsetX, offsetY, vpW, vpH } = getSvgRenderTransform(svg)

    // getBBox() returns coordinates in the element's local space, ignoring the
    // element's own transform. Apply the group's transform matrix to obtain the
    // real bounding box in SVG viewBox space (handles Inkscape translate offsets).
    const ownMatrix = group.transform.baseVal.consolidate()?.matrix
    function applyM(x: number, y: number) {
      if (!ownMatrix) return { x, y }
      return {
        x: ownMatrix.a * x + ownMatrix.c * y + ownMatrix.e,
        y: ownMatrix.b * x + ownMatrix.d * y + ownMatrix.f,
      }
    }
    const corners = [
      applyM(rawBbox.x, rawBbox.y),
      applyM(rawBbox.x + rawBbox.width, rawBbox.y),
      applyM(rawBbox.x, rawBbox.y + rawBbox.height),
      applyM(rawBbox.x + rawBbox.width, rawBbox.y + rawBbox.height),
    ]
    const svgMinX = Math.min(...corners.map(p => p.x))
    const svgMinY = Math.min(...corners.map(p => p.y))
    const svgMaxX = Math.max(...corners.map(p => p.x))
    const svgMaxY = Math.max(...corners.map(p => p.y))
    const bbox = {
      x: svgMinX,
      y: svgMinY,
      width: svgMaxX - svgMinX,
      height: svgMaxY - svgMinY,
    }

    // 展位中心在 panzoom-target 坐标系（scale=1）中的像素位置
    const bcx = (bbox.x + bbox.width / 2) * svgScale + offsetX
    const bcy = (bbox.y + bbox.height / 2) * svgScale + offsetY

    // 目标 panzoom scale：让展位占 viewport 短边的 FOCUS_FILL_RATIO
    const boothLongerSidePx = Math.max(bbox.width, bbox.height) * svgScale
    const targetScale = Math.min(
      4,
      Math.max(2, (Math.min(vpW, vpH) * FOCUS_FILL_RATIO) / boothLongerSidePx),
    )

    // panzoom pre-scale translate：使展位中心出现在 viewport 中心
    // screen = s*(bcx + x) + vpW/2*(1-s) = vpW/2  →  x = vpW/2 - bcx
    const xIdeal = vpW / 2 - bcx
    const yIdeal = vpH / 2 - bcy

    // contain:'outside' 合法范围（panzoom 源码 constrainXY）：
    //   x ∈ [-vpW*(s-1)/(2s), vpW*(s-1)/(2s)]
    const xBound = vpW * (targetScale - 1) / (2 * targetScale)
    const yBound = vpH * (targetScale - 1) / (2 * targetScale)
    const x = Math.max(-xBound, Math.min(xBound, xIdeal))
    const y = Math.max(-yBound, Math.min(yBound, yIdeal))

    // 用 CSS transition 驱动动画，格式与 panzoom 一致
    const prevTransition = target.style.transition
    target.style.transition = `transform ${FOCUS_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`
    target.style.transform = `scale(${targetScale}) translate(${x}px, ${y}px)`

    // 动画结束后同步 panzoom 内部状态，保证后续手势正常
    target.addEventListener('transitionend', () => {
      target.style.transition = prevTransition
      panzoom!.zoom(targetScale, { animate: false })
      panzoom!.pan(x, y, { animate: false })
    }, { once: true })
  }

  /** 重置视图到初始状态 */
  function resetView() {
    panzoom?.reset({ animate: true })
  }

  // ── 点击 ──────────────────────────────────────────────────────────────────

  function onMapClick(e: MouseEvent) {
    const el = (e.target as Element | null)?.closest('g[id]')
    const id = el?.id
    if (!id || !boothIdSet.has(id)) return
    onBoothClick(selectedBoothId() === id ? null : id)
  }

  // ── 生命周期 ──────────────────────────────────────────────────────────────

  onMounted(() => {
    nextTick(() => {
      syncHighlightOverlay()
      initPanzoom()
    })
  })

  onBeforeUnmount(() => {
    removeWheelListener?.()
    removeWheelListener = null
    panzoom?.destroy()
    panzoom = null
  })

  watch(selectedBoothId, syncHighlightOverlay, { flush: 'post' })

  return {
    mapRef,
    viewportRef,
    panzoomTargetRef,
    onMapClick,
    focusBooth,
    resetView,
  }
}
