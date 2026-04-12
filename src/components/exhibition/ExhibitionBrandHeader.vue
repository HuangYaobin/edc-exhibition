<script setup lang="ts">
const props = defineProps<{
  name: string
  logo: string
  description?: string
  isFavorited: boolean
  logoClass?: string
  titleClass?: string
  descriptionClass?: string
  hideActions?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-favorite'): void
  (e: 'edit'): void
  (e: 'contact'): void
}>()

// Image fallback handled via ElImage error slots
</script>

<template>
  <div class="flex gap-4 items-start">
    <div class="flex flex-col items-center">
      <div class="flex-shrink-0">
        <el-image :src="logo" :alt="name" class="object-contain rounded-md border border-gray-200" :class="logoClass || 'w-28 h-28'" fit="contain">
          <template #error>
            <div class="w-full h-full rounded-md bg-gray-100"></div>
          </template>
        </el-image>
      </div>
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <h2 class="font-bold whitespace-nowrap" :class="titleClass || 'text-2xl text-gray-800'">{{ name }}</h2>
        <div class="flex-shrink-0 flex items-center gap-2" v-if="!hideActions">
          <BaseStarButton :active="isFavorited" @toggle="emit('toggle-favorite')" />
          <button
            class="inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            @click="emit('contact')"
            aria-label="联系方式"
          >
            <i class="i-carbon-phone text-base"></i>
            <span class="text-sm">联系方式</span>
          </button>
          <button
            class="inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
            @click="emit('edit')"
            aria-label="编辑品牌信息"
          >
            <i class="i-carbon-edit text-base"></i>
            <span class="text-sm">编辑</span>
          </button>
        </div>
      </div>

      <p v-if="description" class="mt-3 break-words" :class="descriptionClass || 'text-sm text-gray-600'">{{ description }}</p>
    </div>
  </div>
</template>

<style scoped></style>
