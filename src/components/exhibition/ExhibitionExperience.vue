<script setup lang="ts">
import { computed } from 'vue'
type Experience = {
  experienceName: string
  experienceImage: string
  experienceDescription?: string | string[]
}

const props = defineProps<{
  experiences: Experience[]
  roundedClass?: string
  imageClassExtra?: string
}>()

// Build preview list for Element Plus Image viewer
const srcList = computed(() => props.experiences.map((e) => e.experienceImage))
const viewerVisible = ref(false)
const viewerIndex = ref(0)

const openViewer = (index: number) => {
  viewerIndex.value = index
  viewerVisible.value = true
}

const viewerItems = computed(() => props.experiences.map((e) => ({ src: e.experienceImage, caption: e.experienceName })))
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div v-for="(exp, idx) in experiences" :key="idx" class="border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors rounded overflow-hidden">
      <div class="relative">
        <div class="w-full relative cursor-zoom-in h-48">
          <el-image
            class="absolute inset-0 w-full h-full object-cover"
            :src="exp.experienceImage"
            fit="cover"
            loading="lazy"
            :preview-src-list="srcList"
            :initial-index="idx"
            :z-index="600"
            preview-teleported
          >
            <template #error>
              <div class="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">加载失败</div>
            </template>
          </el-image>
        </div>
      </div>

      <div class="p-2">
        <h5 class="font-semibold tracking-tight leading-tight text-slate-900 dark:text-slate-100 line-clamp-2 text-base md:text-lg">
          {{ exp.experienceName }}
        </h5>
        <div v-if="exp.experienceDescription" class="mt-1 text-xs md:text-sm leading-5 text-slate-600 dark:text-slate-300">
          <template v-if="Array.isArray(exp.experienceDescription)">
            <ul class="list-disc list-inside space-y-0.5">
              <li v-for="(d, di) in exp.experienceDescription" :key="di">{{ d }}</li>
            </ul>
          </template>
          <template v-else>{{ exp.experienceDescription }}</template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
