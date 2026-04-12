export type ViewMode = 'compact' | 'standard' | 'comfortable'
export type LayoutMode = 'grid' | 'list'

export interface ViewSettings {
  viewMode: ViewMode
  layoutMode: LayoutMode
}

export const useViewSettings = () => {
  // 响应式状态
  const viewMode = ref<ViewMode>('standard')
  const layoutMode = ref<LayoutMode>('grid')

  // 初始化设置
  const initViewSettings = () => {
    if (typeof window !== 'undefined') {
      viewMode.value = (localStorage.getItem('viewMode') as ViewMode) || 'standard'
      layoutMode.value = (localStorage.getItem('layoutMode') as LayoutMode) || 'grid'
    }
  }

  // 刷新设置（用于设置更新后手动调用）
  const refreshSettings = () => {
    initViewSettings()
  }

  // 获取网格列数配置
  const getGridClasses = computed(() => {
    const base = {
      compact: {
        mobile: 'grid-cols-3',
        tablet: 'sm:grid-cols-4',
        desktop: 'lg:grid-cols-5',
        large: 'xl:grid-cols-6',
      },
      standard: {
        mobile: 'grid-cols-2',
        tablet: 'sm:grid-cols-2',
        desktop: 'lg:grid-cols-3',
        large: 'xl:grid-cols-4',
      },
      comfortable: {
        mobile: 'grid-cols-1',
        tablet: 'sm:grid-cols-2',
        desktop: 'lg:grid-cols-3',
        large: 'xl:grid-cols-3',
      },
    }

    const config = base[viewMode.value]
    return `${config.mobile} ${config.tablet} ${config.desktop} ${config.large}`
  })

  // 获取间距配置
  const getSpacingClasses = computed(() => {
    return {
      compact: 'gap-2',
      standard: 'gap-4',
      comfortable: 'gap-6',
    }[viewMode.value]
  })

  // 获取卡片尺寸配置
  const getCardSizeClasses = computed(() => {
    return {
      compact: 'p-1',
      standard: 'p-2',
      comfortable: 'p-3',
    }[viewMode.value]
  })

  // 获取列表布局的列数配置
  const getListColumns = computed(() => {
    const base = {
      compact: {
        mobile: 'grid-cols-1',
        tablet: 'sm:grid-cols-1',
        desktop: 'lg:grid-cols-2',
        large: 'xl:grid-cols-3',
      },
      standard: {
        mobile: 'grid-cols-1',
        tablet: 'sm:grid-cols-1',
        desktop: 'lg:grid-cols-2',
        large: 'xl:grid-cols-2',
      },
      comfortable: {
        mobile: 'grid-cols-1',
        tablet: 'sm:grid-cols-1',
        desktop: 'lg:grid-cols-1',
        large: 'xl:grid-cols-1',
      },
    }

    const config = base[viewMode.value]
    return `${config.mobile} ${config.tablet} ${config.desktop} ${config.large}`
  })

  // 获取布局容器类
  const getLayoutContainerClasses = computed(() => {
    if (layoutMode.value === 'list') {
      return `grid ${getListColumns.value} gap-2`
    }
    return `grid ${getGridClasses.value} ${getSpacingClasses.value}`
  })

  // 检查是否为列表模式
  const isListMode = computed(() => layoutMode.value === 'list')

  // 检查是否为网格模式
  const isGridMode = computed(() => layoutMode.value === 'grid')

  // 监听localStorage变化
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'viewMode' && e.newValue) {
      viewMode.value = e.newValue as ViewMode
    }
    if (e.key === 'layoutMode' && e.newValue) {
      layoutMode.value = e.newValue as LayoutMode
    }
  }

  // 监听设置变化事件
  const handleViewSettingsChange = () => {
    refreshSettings()
  }

  // 在客户端初始化
  onMounted(() => {
    initViewSettings()
    // 监听localStorage变化
    window.addEventListener('storage', handleStorageChange)
    // 监听设置变化事件
    window.addEventListener('viewSettingsChanged', handleViewSettingsChange)
  })

  // 清理事件监听器
  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('viewSettingsChanged', handleViewSettingsChange)
    }
  })

  return {
    // 状态
    viewMode: readonly(viewMode),
    layoutMode: readonly(layoutMode),

    // 计算属性
    getGridClasses,
    getListColumns,
    getSpacingClasses,
    getCardSizeClasses,
    getLayoutContainerClasses,
    isListMode,
    isGridMode,

    // 方法
    initViewSettings,
    refreshSettings,
  }
} 
