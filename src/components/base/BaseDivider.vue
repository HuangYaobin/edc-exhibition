<template>
  <div class="flex items-center gap-3 my-4 select-none" role="separator" aria-orientation="horizontal">
    <div class="flex-1 h-px bg-gray-200"></div>
    <div class="px-3 text-gray-800 font-semibold text-md md:text-sm whitespace-nowrap" role="heading"
      :aria-level="level">
      <slot>{{ title }}</slot>
    </div>
    <div class="flex-1 h-px bg-gray-200"></div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    level?: number
  }>(),
  {
    title: '',
    level: 4,
  }
)
// Expose for template binding
const { title, level } = toRefs(props)
</script>

<style scoped></style>
