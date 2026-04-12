<script setup lang="ts">
import { computed } from 'vue'

type StyleVars = Record<string, string>

const props = defineProps<{
  // Items to render as tabs
  items: any[]
  // Selected tab index (v-model)
  modelValue: number
  // Optional style variables for theming the strip
  styleVars?: StyleVars
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const activeIndex = computed({
  get: () => props.modelValue ?? 0,
  set: (val: number) => emit('update:modelValue', val),
})

const handleClick = (index: number) => {
  if (index === activeIndex.value) return
  activeIndex.value = index
}
</script>

<template>
  <div :style="styleVars" style="--tab-strip-bg: #f3f4f6; --tab-active-bg: #ffffff; --tab-hover-bg: #f8fafc">
    <nav class="tab ml-1" role="tablist">
      <button
        v-for="(item, index) in items"
        :key="index"
        role="tab"
        :aria-selected="index === activeIndex"
        class="tab-item inline-flex items-center gap-2"
        :class="{ active: index === activeIndex }"
        @click="handleClick(index)"
      >
        <!-- Default rendering: if item has logo/name keys, show them; otherwise slot or fallback text -->
        <slot name="tab" :item="item" :index="index" :is-active="index === activeIndex">
          <template v-if="(item as any)?.logo && (item as any)?.name">
            <img :src="(item as any).logo" alt="" class="w-4 h-4 rounded-sm object-contain" />
            <span class="truncate max-w-32">{{ (item as any).name }}</span>
          </template>
          <template v-else>
            <span class="truncate max-w-32">{{ String(item) }}</span>
          </template>
        </slot>
      </button>
    </nav>
  </div>
</template>

<style scoped>
/* Chrome-like tab strip */
.tab {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  background-color: var(--tab-strip-bg, #f3f4f6);
  padding: 10px 15px 0 15px;
  font-size: 14px;
  overflow-x: auto;
}

.tab-item {
  position: relative;
  padding: 10px 35px;
  margin: 0 -15px;
  cursor: pointer;
  transition: 0.2s;
  border: none;
  -webkit-mask-box-image: url("data:image/svg+xml,%3Csvg width='67' height='33' viewBox='0 0 67 33' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M27 0c-6.627 0-12 5.373-12 12v6c0 8.284-6.716 15-15 15h67c-8.284 0-15-6.716-15-15v-6c0-6.627-5.373-12-12-12H27z' fill='%23F8EAE7'/%3E%3C/svg%3E")
    12 27 15;
}

.tab-item:not(.active) {
  background: var(--tab-inactive-bg, #f2f2f2a2);
}

.tab-item.active {
  background: var(--tab-active-bg, #ffffff);
  z-index: 1;
}

.tab-item:not(.active):hover {
  background: var(--tab-hover-bg, #f8fafc);
  color: #000;
}
</style>
