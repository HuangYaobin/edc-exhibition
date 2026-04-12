import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Detect whether the current client is a mobile device.
 * - SSR safe: defaults to false on server
 * - Combines User-Agent and viewport width (max-width breakpoint)
 */
export function useMobile(breakpoint = 768) {
  const isMobile = ref(false)

  let mediaQuery: MediaQueryList | null = null
  const isMobileUA = (): boolean => {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
  }

  const update = () => {
    const matchesWidth = typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches : false
    isMobile.value = isMobileUA() || matchesWidth
  }

  const handleMediaChange = () => {
    update()
  }

  onMounted(() => {
    update()
    if (typeof window !== 'undefined') {
      mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`)
      // Use modern event API; Safari 14+ supports it
      mediaQuery.addEventListener('change', handleMediaChange)
    }
  })

  onBeforeUnmount(() => {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  })

  return { isMobile }
}


