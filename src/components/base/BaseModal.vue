<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <!-- 遮罩层 -->
    <Transition name="modal-overlay" v-if="enableModal">
      <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-40 dark:bg-opacity-60" :style="{ zIndex: overlayZIndex }" @click="handleClickMask" />
    </Transition>

    <Transition name="modal-content">
      <!-- 桌面端 -->
      <div v-if="visible && !isMobile" class="fixed inset-0 pointer-events-none" :style="{ zIndex: contentZIndex }">
        <slot name="desktop" />
      </div>
    </Transition>

    <!-- 移动端 -->
    <Transition name="drawer" appear>
      <div v-if="visible && isMobile" class="fixed inset-0" :style="{ zIndex: contentZIndex }">
        <slot name="drawer" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useModalZIndex } from '~/composables/useZIndex'
const props = withDefaults(
  defineProps<{
    visible: boolean
    isMobile?: boolean
    closeOnClickMask?: boolean
    enableModal?: boolean
  }>(),
  {
    isMobile: false,
    closeOnClickMask: true,
    enableModal: true,
  }
)
const emit = defineEmits(['update:visible'])

// z-index 动态管理
const { overlayZIndex, contentZIndex, acquire, release } = useModalZIndex()

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      acquire()
    } else {
      release()
    }
  },
  { immediate: true }
)

const handleClickMask = () => {
  if (props.closeOnClickMask) {
    emit('update:visible', false)
  }
}
</script>

<style scoped>
/* 移动端优化 */
@media (max-width: 768px) {
  .mobile-drawer {
    will-change: transform;
    backface-visibility: hidden;
  }
}

/* 全局滚动锁定样式 */
:global(body.modal-open) {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100vh;
}
</style>

<style>
/* 弹窗遮罩动画 */
.modal-overlay-enter-active,
.modal-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.modal-overlay-enter-from,
.modal-overlay-leave-to {
  opacity: 0;
}

/* 桌面端弹窗内容动画 */
.modal-content-enter-active,
.modal-content-leave-active {
  transition: all 0.3s ease;
}

.modal-content-enter-from,
.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

/* 移动端抽屉动画 */
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.drawer-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
