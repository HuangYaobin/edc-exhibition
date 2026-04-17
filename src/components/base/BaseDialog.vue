<script setup lang="ts">
import { watch } from 'vue'
import { useModalZIndex } from '@/composables/useZIndex'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    closeOnClickOverlay?: boolean
    maxWidth?: string
  }>(),
  {
    closeOnClickOverlay: true,
    maxWidth: '24rem',
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
    <Transition name="dialog-overlay">
      <div v-if="visible" class="fixed inset-0 bg-black/60 backdrop-blur-sm" :style="{ zIndex: overlayZIndex }"
        @click="handleOverlayClick" />
    </Transition>

    <Transition name="dialog-content">
      <div v-if="visible" class="fixed inset-0 flex items-center justify-center pointer-events-none px-4"
        :style="{ zIndex: contentZIndex }">
        <div
          class="pointer-events-auto w-full rounded-2xl bg-zinc-900 border border-zinc-700/60 shadow-2xl overflow-hidden"
          :style="{ maxWidth: maxWidth }" @click.stop>
          <!-- Header -->
          <div v-if="title" class="px-4 py-3 border-b border-zinc-800">
            <h3 class="text-zinc-100 font-semibold text-sm m-0 leading-snug truncate">
              {{ title }}
            </h3>
          </div>

          <!-- Body -->
          <div class="px-4 py-4 max-h-[60vh] overflow-y-auto hide-scrollbar">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.dialog-overlay-enter-active,
.dialog-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-overlay-enter-from,
.dialog-overlay-leave-to {
  opacity: 0;
}

.dialog-content-enter-active,
.dialog-content-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dialog-content-enter-from,
.dialog-content-leave-to {
  opacity: 0;
  transform: scale(0.94) translateY(8px);
}
</style>
