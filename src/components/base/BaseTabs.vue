<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  items: any[]
  modelValue: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const activeIndex = computed({
  get: () => props.modelValue ?? 0,
  set: (val: number) => emit('update:modelValue', val),
})

function handleClick(index: number) {
  if (index === activeIndex.value) return
  activeIndex.value = index
}
</script>

<template>
  <div role="tablist" class="flex items-end px-3 pt-2 min-w-0 w-full">
    <button v-for="(item, index) in items" :key="index" role="tab" :aria-selected="index === activeIndex"
      class="base-tab inline-flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-all duration-150 whitespace-nowrap outline-none rounded-t-lg relative select-none min-h-[36px] -mb-px border-none min-w-0 shrink basis-auto"
      :class="index === activeIndex
        ? 'base-tab--active bg-zinc-900 text-zinc-100'
        : 'bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'" @click="handleClick(index)">
      <slot name="tab" :item="item" :index="index" :is-active="index === activeIndex">
        <template v-if="(item as any)?.logo && (item as any)?.name">
          <img :src="(item as any).logo" alt="" class="w-4 h-4 rounded-sm object-contain flex-shrink-0" />
          <span class="truncate min-w-0">{{ (item as any).name }}</span>
        </template>
        <template v-else>
          <span class="truncate min-w-0">{{ String(item) }}</span>
        </template>
      </slot>
    </button>
  </div>
</template>

<style scoped>
/* Pseudo-elements cannot be expressed as utility classes — kept as raw CSS */
.base-tab--active::before,
.base-tab--active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  width: 10px;
  height: 10px;
  background: transparent;
  pointer-events: none;
}

.base-tab--active::before {
  left: -10px;
  border-bottom-right-radius: 10px;
  box-shadow: 4px 4px 0 2px #18181b;
  /* zinc-900 */
}

.base-tab--active::after {
  right: -10px;
  border-bottom-left-radius: 10px;
  box-shadow: -4px 4px 0 2px #18181b;
  /* zinc-900 */
}
</style>
