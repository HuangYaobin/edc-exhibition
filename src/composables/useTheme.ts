export const useTheme = () => {
  // 使用localStorage存储主题偏好
  const isDark = ref(false)

  // 检查系统主题偏好
  const getSystemTheme = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  }

  // 应用主题
  const applyTheme = (dark: boolean) => {
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  // 初始化主题
  const initTheme = () => {
    if (typeof window !== 'undefined') {
      // 优先从localStorage读取用户偏好
      const stored = localStorage.getItem('theme')
      let theme: boolean

      if (stored) {
        theme = stored === 'dark'
      } else {
        // 如果没有存储的偏好，使用系统主题
        theme = getSystemTheme()
      }

      isDark.value = theme
      applyTheme(theme)
    }
  }

  // 切换主题
  const toggleTheme = () => {
    const newTheme = !isDark.value
    isDark.value = newTheme
    applyTheme(newTheme)

    // 保存到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    }
  }

  // 设置特定主题
  const setTheme = (dark: boolean) => {
    isDark.value = dark
    applyTheme(dark)

    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    }
  }

  // 监听系统主题变化
  const watchSystemTheme = () => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      const handleChange = (e: MediaQueryListEvent) => {
        // 只有在用户没有手动设置过主题时才跟随系统
        const stored = localStorage.getItem('theme')
        if (!stored) {
          isDark.value = e.matches
          applyTheme(e.matches)
        }
      }

      mediaQuery.addEventListener('change', handleChange)

      // 返回清理函数
      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }
  }

  // 在客户端初始化
  onMounted(() => {
    initTheme()
    watchSystemTheme()
  })

  return {
    isDark: readonly(isDark),
    toggleTheme,
    setTheme,
    getSystemTheme
  }
}


