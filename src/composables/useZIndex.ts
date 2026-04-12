import { onBeforeUnmount, ref, computed } from 'vue'

// Simple global z-index stack manager for modals
// Ensures later opened modals appear above earlier ones
const MODAL_Z_INDEX_BASE = 300
const MODAL_Z_INDEX_STEP = 2 // reserve one level for content above mask

const activeModalZIndexes: number[] = []

function acquireNextZIndex(): number {
  const currentTop = activeModalZIndexes.length
    ? Math.max(...activeModalZIndexes)
    : MODAL_Z_INDEX_BASE - MODAL_Z_INDEX_STEP
  const next = currentTop + MODAL_Z_INDEX_STEP
  activeModalZIndexes.push(next)
  return next
}

function releaseZIndex(z: number): void {
  const index = activeModalZIndexes.indexOf(z)
  if (index !== -1) {
    activeModalZIndexes.splice(index, 1)
  }
}

export function useModalZIndex() {
  const overlayZIndex = ref<number>(MODAL_Z_INDEX_BASE)
  const contentZIndex = computed(() => overlayZIndex.value + 1)

  function acquire() {
    overlayZIndex.value = acquireNextZIndex()
  }

  function release() {
    releaseZIndex(overlayZIndex.value)
  }

  onBeforeUnmount(() => {
    release()
  })

  return {
    overlayZIndex,
    contentZIndex,
    acquire,
    release,
  }
}

