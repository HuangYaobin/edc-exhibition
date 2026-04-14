<script setup lang="ts">
import { watch } from 'vue'
import { useModalZIndex } from '@/composables/useZIndex'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    side?: 'left' | 'right'
    width?: string
    closeOnClickOverlay?: boolean
  }>(),
  {
    side: 'left',
    width: '280px',
    closeOnClickOverlay: true,
  },
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const { overlayZIndex, contentZIndex, acquire, release } = useModalZIndex()

watch(
  () => props.visible,
  (val) => {
    if (val) acquire()
    else release()
  },
  { immediate: true },
)

function close() {
  emit('update:visible', false)
}

function handleOverlayClick() {
  if (props.closeOnClickOverlay) close()
}
</script>

<template>
  <Teleport to="body">
    <!-- 遮罩 -->
    <Transition name="sidebar-overlay">
      <div v-if="visible" class="fixed inset-0 bg-black/60 backdrop-blur-sm" :style="{ zIndex: overlayZIndex }"
        @click="handleOverlayClick" />
    </Transition>

    <!-- 侧边栏面板 -->
    <Transition :name="side === 'left' ? 'sidebar-left' : 'sidebar-right'">
      <div v-if="visible"
        class="fixed top-0 bottom-0 flex flex-col bg-zinc-900 border-zinc-700/60 shadow-2xl overflow-hidden"
        :class="side === 'left' ? 'left-0 border-r' : 'right-0 border-l'"
        :style="{ zIndex: contentZIndex, width: width }" @click.stop>
        <!-- 头部 -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <slot name="header">
            <span v-if="title" class="text-zinc-100 font-semibold text-sm leading-snug truncate">
              {{ title }}
            </span>
          </slot>
        </div>

        <!-- 内容 -->
        <div class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <slot />
        </div>

        <!-- 底部（可选） -->
        <div v-if="$slots.footer" class="border-t border-zinc-800 shrink-0">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.sidebar-overlay-enter-active,
.sidebar-overlay-leave-active {
  transition: opacity 0.25s ease;
}

.sidebar-overlay-enter-from,
.sidebar-overlay-leave-to {
  opacity: 0;
}

.sidebar-left-enter-active,
.sidebar-left-leave-active,
.sidebar-right-enter-active,
.sidebar-right-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-left-enter-from,
.sidebar-left-leave-to {
  transform: translateX(-100%);
}

.sidebar-right-enter-from,
.sidebar-right-leave-to {
  transform: translateX(100%);
}
</style>
