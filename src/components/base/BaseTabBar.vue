<script setup lang="ts">
export interface TabBarItem {
  key: string
  label: string
  icon: string
  badge?: number
}

const props = defineProps<{
  items: TabBarItem[]
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <nav class="flex items-stretch shrink-0 bg-zinc-900 border-t border-zinc-800">
    <button
      v-for="item in items"
      :key="item.key"
      class="flex-1 relative flex flex-col items-center justify-center gap-1 py-2.5 border-none bg-transparent cursor-pointer transition-colors outline-none select-none"
      :class="item.key === modelValue ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-400 active:text-zinc-300'"
      @click="emit('update:modelValue', item.key)"
    >
      <!-- Active top indicator line -->
      <span
        class="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-b-full transition-all duration-200"
        :class="item.key === modelValue ? 'w-6 bg-zinc-300' : 'w-0 bg-transparent'"
      />

      <!-- Icon with badge -->
      <div class="relative">
        <i :class="[item.icon, 'text-[22px] block']" />
        <span
          v-if="item.badge"
          class="absolute -top-1 -right-2 min-w-[14px] h-3.5 rounded-full bg-red-500 text-[9px] font-semibold text-white flex items-center justify-center px-0.5 leading-none"
        >
          {{ item.badge > 99 ? '99+' : item.badge }}
        </span>
      </div>

      <!-- Label -->
      <span class="text-[10px] leading-none font-medium">{{ item.label }}</span>
    </button>
  </nav>
</template>
