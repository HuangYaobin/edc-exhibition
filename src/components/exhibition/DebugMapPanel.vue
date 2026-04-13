<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const emit = defineEmits<{
  focus: [id: string]
  reset: []
}>()

const DEBUG_BOOTHS = ['B01', 'B05', 'B60', 'C59', 'A01'] as const

const visible = ref(true)

function toggle() {
  visible.value = !visible.value
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === '`' && !e.ctrlKey && !e.metaKey && !e.altKey)
    toggle()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Transition name="debug-panel">
    <div v-if="visible"
      class="flex flex-wrap items-center gap-1.5 rounded border border-yellow-600/40 bg-yellow-950/30 px-2 py-1.5">
      <span class="mr-1 text-xs font-medium text-yellow-500/80">DEBUG</span>
      <button v-for="id in DEBUG_BOOTHS" :key="id" type="button"
        class="rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
        @click="emit('focus', id)">
        {{ id }}
      </button>
      <button type="button"
        class="rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
        @click="emit('reset')">
        重置
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.debug-panel-enter-active,
.debug-panel-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.debug-panel-enter-from,
.debug-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
