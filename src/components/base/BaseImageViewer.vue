<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

type ViewerItem = { src: string; caption?: string }

const props = withDefaults(
  defineProps<{
    visible: boolean
    items: ViewerItem[]
    startIndex?: number
  }>(),
  {
    startIndex: 0,
  }
)

const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const currentIndex = ref<number>(0)

const clampIndex = (i: number) => {
  if (!props.items || props.items.length === 0) return 0
  return Math.min(Math.max(i, 0), props.items.length - 1)
}

watch(
  () => [props.visible, props.startIndex, props.items?.length],
  () => {
    if (props.visible) currentIndex.value = clampIndex(props.startIndex || 0)
  }
)

const currentItem = computed<ViewerItem | null>(() => {
  if (!props.items || props.items.length === 0) return null
  return props.items[clampIndex(currentIndex.value)]
})

const close = () => emit('update:visible', false)
const prev = () => (currentIndex.value = clampIndex(currentIndex.value - 1))
const next = () => (currentIndex.value = clampIndex(currentIndex.value + 1))

const onKeydown = (e: KeyboardEvent) => {
  if (!props.visible) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.backgroundColor = '#f3f4f6'
  img.style.border = '1px solid #d1d5db'
  img.style.display = 'flex'
  img.style.alignItems = 'center'
  img.style.justifyContent = 'center'
  img.style.color = '#9ca3af'
  img.style.fontSize = '12px'
  img.style.fontWeight = 'bold'
  img.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEMyOC42ODYzIDIwIDI2IDIyLjY4NjMgMjYgMjZDMjYgMjkuMzEzNyAyOC42ODYzIDMyIDMyIDMyQzM1LjMxMzcgMzIgMzggMjkuMzEzNyAzOCAyNkMzOCAyMi42ODYzIDM1LjMxMzcgMjAgMzIgMjBaIiBmaWxsPSIjOU5BM0FGIi8+CjxwYXRoIGQ9Ik0xNiA0OEg0OEM1Mi40MTgzIDQ4IDU2IDQ0LjQxODMgNTYgNDBWMjRDNjAgMjAgNTYgMTYgNTYgMTJIMTZDMjAgMTYgMTYgMjAgMTYgMjRWNDBDMTYgNDQuNDE4MyAxOS41ODE3IDQ4IDI0IDQ4WiIgZmlsbD0iIzlOQTNBRiIvPgo8L3N2Zz4K'
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-600">
      <div class="absolute inset-0 bg-black/80" @click="close" />
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="relative max-w-[90vw] max-h-[90vh] w-auto h-auto">
          <button class="absolute -top-3 -right-3 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow border border-gray-200 cursor-pointer" @click="close" aria-label="关闭">
            <i class="i-carbon-close text-lg"></i>
          </button>

          <div class="relative">
            <img :src="currentItem?.src" alt="image" class="max-w-[90vw] max-h-[75vh] object-contain rounded-md shadow" @error="onImageError" />
            <div v-if="$slots.actions" class="absolute -bottom-12 left-0 right-0 flex justify-center gap-2">
              <slot name="actions"></slot>
            </div>

            <button
              v-if="items.length > 1"
              class="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow border border-gray-200 cursor-pointer"
              @click.stop="prev"
              aria-label="上一张"
            >
              <i class="i-carbon-chevron-left text-xl"></i>
            </button>
            <button
              v-if="items.length > 1"
              class="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow border border-gray-200 cursor-pointer"
              @click.stop="next"
              aria-label="下一张"
            >
              <i class="i-carbon-chevron-right text-xl"></i>
            </button>
          </div>

          <div v-if="currentItem?.caption" class="mt-2 text-center text-sm text-white/90">
            {{ currentItem?.caption }}
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped></style>
