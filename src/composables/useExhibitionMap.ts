import type { ComponentPublicInstance } from 'vue'
import { onBeforeUnmount, onMounted, nextTick, useTemplateRef, watch } from 'vue'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** 展位聚焦动画时长（ms） */
const FOCUS_DURATION = 420

/** 聚焦后展位占 viewBox 短边的目标比例 */
const FOCUS_FILL_RATIO = 0.3

const MIN_SCALE = 1
const MAX_SCALE = 4

/** SVG viewBox 状态 */
interface VB { x: number; y: number; w: number; h: number }

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
  // 保留 ref 名以兼容模板，但不再对它施加 CSS transform
  const panzoomTargetRef = useTemplateRef<HTMLElement>('panzoomTargetRef')

  // ── ViewBox 状态 ──────────────────────────────────────────────────────────

  /** SVG 的初始 viewBox，是所有缩放/平移的基准 */
  let origVb: VB | null = null
  /** 当前 viewBox */
  let curVb: VB | null = null
  let rafId: number | null = null
  let cleanupListeners: (() => void) | null = null

  // ── SVG helpers ──────────────────────────────────────────────────────────

  function getSvgRoot(): SVGSVGElement | null {
    const inst = mapRef.value
    if (!inst) return null
    const el = inst.$el
    return el instanceof SVGSVGElement ? el : null
  }

  // ── ViewBox helpers ──────────────────────────────────────────────────────

  function applyVb(svg: SVGSVGElement, vb: VB) {
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`)
    curVb = { ...vb }
  }

  /**
   * 约束 viewBox，等价于 panzoom 的 contain:'outside'：
   * 任何时候视口都不能显示 SVG 原始内容区域之外的空白。
   */
  function constrain(vb: VB): VB {
    if (!origVb) return vb
    // 缩小超过 minScale 则直接重置
    if (vb.w >= origVb.w) return { ...origVb }
    return {
      x: Math.max(origVb.x, Math.min(origVb.x + origVb.w - vb.w, vb.x)),
      y: Math.max(origVb.y, Math.min(origVb.y + origVb.h - vb.h, vb.y)),
      w: vb.w,
      h: vb.h,
    }
  }

  function getScale(): number {
    if (!origVb || !curVb) return 1
    return origVb.w / curVb.w
  }

  /**
   * 以屏幕坐标 (clientX, clientY) 为焦点缩放到 newScale。
   *
   * 使用 getScreenCTM().inverse() 将屏幕坐标转为 SVG viewBox 坐标，
   * 自动处理 preserveAspectRatio 的 letterbox 偏移，无需手动换算。
   */
  function zoomAt(svg: SVGSVGElement, newScale: number, clientX: number, clientY: number) {
    if (!origVb || !curVb) return
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))

    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const inv = ctm.inverse()

    // 屏幕坐标 → SVG viewBox 坐标
    const p = new DOMPoint(clientX, clientY).matrixTransform(inv)

    // 新 viewBox 尺寸（始终维持原始宽高比）
    const newW = origVb.w / newScale
    const newH = origVb.h / newScale

    // 保持焦点的 viewBox 内相对位置不变，实现"以手指为中心缩放"
    const fracX = (p.x - curVb.x) / curVb.w
    const fracY = (p.y - curVb.y) / curVb.h
    applyVb(svg, constrain({ x: p.x - fracX * newW, y: p.y - fracY * newH, w: newW, h: newH }))
  }

  /**
   * 按屏幕像素 delta 平移（仅在缩放状态下有效）。
   *
   * 用 CTM.inverse() 把屏幕 delta 映射为 viewBox delta，
   * 通过差值消除 CTM 的平移分量，只保留缩放分量。
   */
  function panBy(svg: SVGSVGElement, dx: number, dy: number) {
    if (!origVb || !curVb || getScale() <= 1) return
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const inv = ctm.inverse()
    const origin = new DOMPoint(0, 0).matrixTransform(inv)
    const moved = new DOMPoint(dx, dy).matrixTransform(inv)
    applyVb(svg, constrain({
      x: curVb.x - (moved.x - origin.x),
      y: curVb.y - (moved.y - origin.y),
      w: curVb.w,
      h: curVb.h,
    }))
  }

  // ── 缓动动画（rAF，替代 CSS transition）────────────────────────────────

  function easeInOut(t: number): number {
    // 近似 cubic-bezier(0.4, 0, 0.2, 1)
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  function animateTo(svg: SVGSVGElement, target: VB) {
    if (rafId !== null) cancelAnimationFrame(rafId)
    const from = { ...curVb! }
    const t0 = performance.now()

    function tick(now: number) {
      const t = Math.min(1, (now - t0) / FOCUS_DURATION)
      const e = easeInOut(t)
      applyVb(svg, {
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e,
      })
      rafId = t < 1 ? requestAnimationFrame(tick) : null
    }
    rafId = requestAnimationFrame(tick)
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
    const groupTransform = group.getAttribute('transform')
    if (groupTransform) layer.setAttribute('transform', groupTransform)

    let pathIndex = 0
    for (const child of group.children) {
      const clone = child.cloneNode(true) as SVGElement
      clone.removeAttribute('id')
      if (child instanceof SVGPathElement) {
        if (pathIndex === 0) clone.classList.add('map-highlight-clone')
        pathIndex++
      }
      else if (child instanceof SVGTextElement) {
        clone.classList.add('map-highlight-label-clone')
      }
      else if (child instanceof SVGLineElement) {
        clone.classList.add('map-highlight-divider-clone')
      }
      layer.appendChild(clone)
    }

    if (!layer.firstChild) return
    svg.appendChild(layer)
  }

  // ── 手势处理 ─────────────────────────────────────────────────────────────

  /**
   * 用 PointerEvent 统一处理鼠标/触摸/触控笔，替代 panzoom 的事件绑定。
   *
   * - 单指/鼠标：平移（仅在 scale>1 时有效）
   * - 双指：pinch 缩放，焦点固定在初始中点，避免内容漂移
   * - 滚轮：缩放
   *
   * 使用 SVG viewBox 操控而非 CSS transform，浏览器始终按屏幕分辨率渲染
   * SVG 矢量内容，彻底避免 CSS transform 导致的光栅化模糊。
   */
  function initGestures() {
    const viewport = viewportRef.value
    if (!viewport) return

    viewport.style.touchAction = 'none'

    const ptrs = new Map<number, PointerEvent>()
    let panLastX = 0
    let panLastY = 0
    let pinchActive = false
    let pinchStartDist = 0
    let pinchStartScale = 1
    let pinchOriginX = 0
    let pinchOriginY = 0

    const ensureCapture = (pointerId: number) => {
      if (!viewport.hasPointerCapture(pointerId)) {
        try { viewport.setPointerCapture(pointerId) }
        catch { /* 某些浏览器在事件流中可能抛 InvalidStateError，忽略即可 */ }
      }
    }

    const onPtrDown = (e: PointerEvent) => {
      // 手势开始时取消正在进行的动画
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      ptrs.set(e.pointerId, e)

      if (ptrs.size === 1) {
        panLastX = e.clientX
        panLastY = e.clientY
        pinchActive = false
        // 注意：此处「不」立即 setPointerCapture。
        // setPointerCapture 会同时把 compatibility mouse events（含 click）
        // 劫持到 viewport，导致 SVG 上的 @click 永远收不到——展位点不动。
        // 真正需要捕获是在「拖动开始」之后，见 onPtrMove。
      }
      else if (ptrs.size === 2) {
        // 双指 pinch 必须立刻捕获，否则手指滑出 viewport 会丢事件
        for (const p of ptrs.values()) ensureCapture(p.pointerId)
        const [a, b] = [...ptrs.values()]
        pinchActive = true
        pinchStartDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
        pinchStartScale = getScale()
        // 固定初始中点为缩放焦点，手指移动过程中焦点不漂移
        pinchOriginX = (a.clientX + b.clientX) / 2
        pinchOriginY = (a.clientY + b.clientY) / 2
      }
    }

    const onPtrMove = (e: PointerEvent) => {
      if (!ptrs.has(e.pointerId)) return
      ptrs.set(e.pointerId, e)

      const svg = getSvgRoot()
      if (!svg) return

      if (pinchActive && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()]
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
        zoomAt(svg, pinchStartScale * dist / pinchStartDist, pinchOriginX, pinchOriginY)
      }
      else if (!pinchActive && ptrs.size === 1) {
        // 仅在缩放后真的能 pan 时才捕获指针，避免 scale=1 的轻微抖动也劫持 click
        if (getScale() > 1) ensureCapture(e.pointerId)
        panBy(svg, e.clientX - panLastX, e.clientY - panLastY)
        panLastX = e.clientX
        panLastY = e.clientY
      }
    }

    const onPtrUp = (e: PointerEvent) => {
      ptrs.delete(e.pointerId)
      if (ptrs.size < 2) pinchActive = false
      if (ptrs.size === 1) {
        const [rem] = ptrs.values()
        panLastX = rem.clientX
        panLastY = rem.clientY
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const svg = getSvgRoot()
      if (!svg) return
      // 将不同 deltaMode 统一换算为「像素」单位
      // LINE 模式（鼠标滚轮）: 1 格 ≈ 12px；PAGE 模式: 1页 ≈ 400px
      let delta = e.deltaY
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 12
      else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= 400
      // 每 100px 缩放约 10%；触控板小 delta → 丝滑微调，鼠标大 delta → 适度跳跃
      const factor = Math.pow(0.999, delta)
      zoomAt(svg, getScale() * factor, e.clientX, e.clientY)
    }

    viewport.addEventListener('pointerdown', onPtrDown)
    viewport.addEventListener('pointermove', onPtrMove)
    viewport.addEventListener('pointerup', onPtrUp)
    viewport.addEventListener('pointercancel', onPtrUp)
    viewport.addEventListener('wheel', onWheel, { passive: false })

    cleanupListeners = () => {
      viewport.removeEventListener('pointerdown', onPtrDown)
      viewport.removeEventListener('pointermove', onPtrMove)
      viewport.removeEventListener('pointerup', onPtrUp)
      viewport.removeEventListener('pointercancel', onPtrUp)
      viewport.removeEventListener('wheel', onWheel)
      viewport.style.touchAction = ''
    }
  }

  // ── 聚焦展位 ─────────────────────────────────────────────────────────────

  /**
   * 平滑缩放并移动到指定展位。
   *
   * 原理：
   * 1. getBBox() 取展位在 SVG 本地坐标系中的 bounding box
   * 2. 应用 group 自身的 transform matrix 换算到 viewBox 坐标系
   * 3. 计算目标 viewBox（展位占短边约 FOCUS_FILL_RATIO）
   * 4. rAF 动画插值
   */
  function focusBooth(id: string) {
    const svg = getSvgRoot()
    if (!svg || !origVb || !curVb) return

    const group = svg.querySelector(`#${CSS.escape(id)}`)
    if (!(group instanceof SVGGElement)) return

    const rawBbox = group.getBBox()

    // getBBox() 在元素本地空间中，不含 group 自身的 transform。
    // 用 group 的 transform matrix 将四角映射到 SVG viewBox 坐标系。
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
    const bx = Math.min(...corners.map(p => p.x))
    const by = Math.min(...corners.map(p => p.y))
    const bw = Math.max(...corners.map(p => p.x)) - bx
    const bh = Math.max(...corners.map(p => p.y)) - by

    // 目标 scale：让展位较长边占 viewBox 短边的 FOCUS_FILL_RATIO
    const boothLonger = Math.max(bw, bh)
    const origShorter = Math.min(origVb.w, origVb.h)
    const targetScale = Math.min(MAX_SCALE, Math.max(1.5, (origShorter * FOCUS_FILL_RATIO) / boothLonger))

    const newW = origVb.w / targetScale
    const newH = origVb.h / targetScale

    animateTo(svg, constrain({
      x: (bx + bw / 2) - newW / 2,
      y: (by + bh / 2) - newH / 2,
      w: newW,
      h: newH,
    }))
  }

  /** 重置视图到初始状态 */
  function resetView() {
    const svg = getSvgRoot()
    if (!svg || !origVb) return
    animateTo(svg, { ...origVb })
  }

  // ── 点击 ──────────────────────────────────────────────────────────────────

  function onMapClick(e: MouseEvent) {
    const el = (e.target as Element | null)?.closest('g[id]')
    const id = el?.id
    if (!id || !boothIdSet.has(id)) return
    onBoothClick(selectedBoothId() === id ? null : id)
  }

  // ── 初始化 ────────────────────────────────────────────────────────────────

  function init() {
    const svg = getSvgRoot()
    if (!svg) return
    const vb = svg.viewBox.baseVal
    origVb = { x: vb.x, y: vb.y, w: vb.width, h: vb.height }
    curVb = { ...origVb }
    initGestures()
  }

  // ── 生命周期 ──────────────────────────────────────────────────────────────

  onMounted(() => {
    nextTick(() => {
      syncHighlightOverlay()
      init()
    })
  })

  onBeforeUnmount(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    cleanupListeners?.()
    cleanupListeners = null
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
