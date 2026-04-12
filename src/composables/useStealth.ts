export type StealthStyle = 'office' | 'email' | 'document' | 'webpage'
export type BossKey = 'esc' | 'alt-tab' | 'ctrl-shift-h' | 'f12' | 'mobile-gesture'

export interface StealthSettings {
  stealthMode: boolean
  stealthStyle: StealthStyle
  bossKey: BossKey
  webpageUrl?: string
}

export const useStealth = () => {
  // 响应式状态
  const isStealthMode = ref(false)
  const stealthStyle = ref<StealthStyle>('office')
  const bossKey = ref<BossKey>('esc')
  const isStealthOverlayVisible = ref(false)
  const isSilentMode = ref(false)
  const webpageUrl = ref('https://www.baidu.com')

  // 移动端手势相关状态
  let touchStartTime = 0
  let touchCount = 0
  let shakeThreshold = 15
  let lastShakeTime = 0
  let lastTouchTime = 0 // 添加防抖
  const touchDebounceDelay = 100 // 防抖延迟

  // 工作文档伪装标题库
  const fakeWorkTitles = {
    office: [
      '2024年度预算报告.xlsx',
      'Q4季度总结PPT.pptx',
      '项目进度跟踪表.xlsx',
      '会议纪要_产品规划.docx',
      '客户需求分析文档.docx',
      '市场调研报告.pptx',
      '团队绩效评估表.xlsx',
      '业务流程优化方案.docx',
      '年度培训计划.xlsx',
      '部门预算申请.docx'
    ],
    email: [
      '关于项目进度的汇报',
      'Re: 下周会议安排',
      '月度工作总结',
      'Fwd: 客户反馈整理',
      '关于预算申请的讨论',
      '项目里程碑更新',
      '团队会议纪要',
      '季度目标制定',
      '工作计划调整通知',
      '部门协作事宜'
    ],
    document: [
      '技术文档 - 系统架构设计',
      '产品规格说明书',
      '用户手册 v2.3',
      '开发指南 - 前端规范',
      '测试用例文档',
      '部署流程文档',
      '接口文档 API v1.2',
      '数据库设计说明',
      '安全规范指南',
      '维护手册'
    ]
  }

  // 获取伪装标题
  const getFakeTitle = (originalTitle: string): string => {
    if (!isStealthMode.value || stealthStyle.value === 'webpage') return originalTitle

    const titles = fakeWorkTitles[stealthStyle.value as keyof typeof fakeWorkTitles]
    const hash = originalTitle.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    const index = Math.abs(hash) % titles.length
    return titles[index]
  }

  // 获取伪装价格
  const getFakePrice = (originalPrice: string): string => {
    if (!isStealthMode.value || stealthStyle.value === 'webpage') return originalPrice

    const styles = {
      office: '进行中',
      email: '待回复',
      document: 'v1.0'
    }
    return styles[stealthStyle.value as keyof typeof styles]
  }

  // 获取伪装时间
  const getFakeTime = (originalTime: string): string => {
    if (!isStealthMode.value) return originalTime

    const now = new Date()
    const variations = [
      `${now.getMonth() + 1}/${now.getDate()}`,
      '今天 14:30',
      '昨天 16:45',
      '周一',
      '上周五'
    ]
    const hash = originalTime.length
    return variations[hash % variations.length]
  }

  // 获取老板键组合
  const getBossKeyCombo = (key: BossKey) => {
    const combos = {
      'esc': { key: 'Escape' },
      'alt-tab': { altKey: true, key: '`' },
      'ctrl-shift-h': { ctrlKey: true, shiftKey: true, key: 'h' },
      'f12': { key: 'F12' },
      'mobile-gesture': null // 移动端手势不需要键盘事件
    }
    return combos[key]
  }

  // 老板键监听器
  const handleKeydown = (event: KeyboardEvent) => {
    if (!isStealthMode.value) return

    const combo = getBossKeyCombo(bossKey.value)

    // 如果是移动端手势或者combo为null，不处理键盘事件
    if (!combo) return

    const isMatch = Object.entries(combo).every(([modifier, value]) => {
      if (modifier === 'key') {
        return event.key === value || event.code === value
      }
      return event[modifier as keyof KeyboardEvent] === value
    })

    if (isMatch) {
      event.preventDefault()
      toggleStealthOverlay()
    }
  }

  // 切换伪装覆盖层
  const toggleStealthOverlay = () => {
    isStealthOverlayVisible.value = !isStealthOverlayVisible.value

    // 触发伪装时启用静音模式
    if (isStealthOverlayVisible.value) {
      isSilentMode.value = true
    }
  }

  // 检测是否为移动设备
  const isMobileDevice = () => {
    if (typeof window !== 'undefined') {
      // 检查是否为真实移动设备或Chrome模拟器
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth <= 768

      // 只有在真实移动设备上才启用手势，避免在桌面Chrome模拟器中出现问题
      return isMobileUA && hasTouch && isSmallScreen
    }
    return false
  }

  // 处理移动端触摸事件
  const handleTouchStart = (event: TouchEvent) => {
    if (!isStealthMode.value || !isMobileDevice()) return

    const now = Date.now()

    // 防抖处理
    if (now - lastTouchTime < touchDebounceDelay) return
    lastTouchTime = now

    touchStartTime = now

    // 处理双击右上角 - 简化逻辑
    if (bossKey.value === 'ctrl-shift-h') {
      const touch = event.touches[0]
      const { clientX, clientY } = touch
      const { innerWidth, innerHeight } = window

      // 检查是否在右上角区域（右上角30%区域）
      if (clientX > innerWidth * 0.7 && clientY < innerHeight * 0.3) {
        touchCount++
        if (touchCount >= 2) {
          toggleStealthOverlay()
          touchCount = 0
        }

        // 重置计数器
        setTimeout(() => {
          touchCount = 0
        }, 1000)
      }
    }
  }

  // 处理触摸移动事件（简化处理，避免性能问题）
  const handleTouchMove = (event: TouchEvent) => {
    // 移除复杂的触摸移动逻辑，避免在Chrome模拟器中卡死
    // 保持空函数以避免移除监听器时出错
  }

  // 处理长按事件
  const handleTouchEnd = (event: TouchEvent) => {
    if (!isStealthMode.value || !isMobileDevice()) return

    const touchDuration = Date.now() - touchStartTime

    // 处理长按标题栏
    if (bossKey.value === 'f12' && touchDuration > 1000) { // 增加到1秒，避免误触
      const touch = event.changedTouches[0]
      if (touch) {
        const { clientY } = touch
        const { innerHeight } = window

        // 检查是否在标题栏区域（顶部15%区域）
        if (clientY < innerHeight * 0.15) {
          toggleStealthOverlay()
        }
      }
    }

    // 重置状态
    touchCount = 0
    touchStartTime = 0
  }

  // 暂时移除摇一摇功能，避免在Chrome模拟器中出现问题
  // const handleDeviceMotion = (event: DeviceMotionEvent) => {
  //   // 功能暂时禁用
  // }



  // 初始化设置
  const initStealthSettings = () => {
    if (typeof window !== 'undefined') {
      isStealthMode.value = localStorage.getItem('stealthMode') === 'true'
      stealthStyle.value = (localStorage.getItem('stealthStyle') as StealthStyle) || 'office'
      bossKey.value = (localStorage.getItem('bossKey') as BossKey) || 'esc'
      webpageUrl.value = localStorage.getItem('webpageUrl') || 'https://www.baidu.com'
    }
  }

  // 监听设置变化
  const handleStealthSettingsChange = () => {
    initStealthSettings()
  }

  // 应用CSS类到文档
  const applyStealthStyles = () => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement

      if (isStealthMode.value) {
        root.classList.add('stealth-mode')
        root.classList.add(`stealth-${stealthStyle.value}`)
      } else {
        root.classList.remove('stealth-mode', 'stealth-office', 'stealth-email', 'stealth-document')
      }
    }
  }

  // 监听摸鱼模式变化
  watch([isStealthMode, stealthStyle], () => {
    applyStealthStyles()
  })

  // 在客户端初始化
  onMounted(() => {
    initStealthSettings()
    applyStealthStyles()

    // 监听键盘事件
    document.addEventListener('keydown', handleKeydown)
    // 监听设置变化事件
    window.addEventListener('stealthSettingsChanged', handleStealthSettingsChange)

    // 移动端手势监听 - 只在真实移动设备上启用
    if (isMobileDevice()) {
      console.log('启用移动端手势监听')
      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      document.addEventListener('touchmove', handleTouchMove, { passive: true })
      document.addEventListener('touchend', handleTouchEnd, { passive: true })

      // 暂时禁用摇一摇功能，避免在模拟器中出现问题
      // if (bossKey.value === 'mobile-gesture' && 'DeviceMotionEvent' in window) {
      //   // 摇一摇功能暂时禁用
      // }
    } else {
      console.log('非移动设备，跳过手势监听')
    }
  })

  // 清理事件监听器
  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', handleKeydown)

      // 清理移动端事件监听器
      if (isMobileDevice()) {
        document.removeEventListener('touchstart', handleTouchStart)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('stealthSettingsChanged', handleStealthSettingsChange)
      // devicemotion监听器已暂时禁用
    }
  })

  return {
    // 状态
    isStealthMode: readonly(isStealthMode),
    stealthStyle: readonly(stealthStyle),
    bossKey: readonly(bossKey),
    isStealthOverlayVisible: readonly(isStealthOverlayVisible),
    isSilentMode: readonly(isSilentMode),
    webpageUrl: readonly(webpageUrl),

    // 方法
    getFakeTitle,
    getFakePrice,
    getFakeTime,
    toggleStealthOverlay,
    initStealthSettings
  }
} 
