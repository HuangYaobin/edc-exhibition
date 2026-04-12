<script setup lang="ts">
const props = defineProps<{
  name: string
  image: string
  description?: string | string[]
  stock?: string
  intended?: boolean
  roundedClass?: string
  imageClassExtra?: string
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

// Fallback handled by ElImage error slot
</script>

<template>
  <div class="border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors" :class="roundedClass || 'rounded'">
    <div class="flex items-center space-x-3">
      <div class="flex-[1] self-stretch">
        <el-image
          :src="image"
          :alt="name"
          class="w-full h-full object-cover rounded cursor-zoom-in"
          :class="imageClassExtra"
          fit="cover"
          :preview-src-list="[image]"
          :initial-index="0"
          :z-index="600"
          preview-teleported
        >
          <template #error>
            <div class="w-full h-full rounded bg-gray-100 border border-gray-200"></div>
          </template>
        </el-image>
      </div>

      <div class="flex-[1.3] p-2 self-stretch flex">
        <div class="flex h-full flex-col min-w-0 flex-1">
          <div class="flex items-center justify-between">
            <h5 class="font-semibold tracking-tight leading-tight text-slate-900 dark:text-slate-100 text-base md:text-lg">
              {{ name }}
            </h5>
            <BaseFavoriteButton :active="!!intended" @toggle="emit('toggle')" />
          </div>

          <div class="flex-1">
            <p v-if="description" class="mt-1 text-xs md:text-sm leading-5 text-slate-600 dark:text-slate-300">
              <template v-if="Array.isArray(description)">
                <div class="list-disc list-inside">
                  <div v-for="(item, index) in description" :key="index">{{ item }}</div>
                </div>
              </template>
              <template v-else>{{ description }}</template>
            </p>
          </div>

          <div class="mt-2 flex justify-end items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <span
              v-if="stock && stock !== ''"
              class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
            >
              <i class="i-fluent-gift-16-regular text-slate-500 text-xl" aria-hidden="true"></i>
              {{ stock }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
