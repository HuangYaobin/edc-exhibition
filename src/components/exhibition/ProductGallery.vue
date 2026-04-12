<script setup lang="ts">
type GalleryItem = { src: string; caption?: string }

const props = defineProps<{
  items: GalleryItem[]
  cols?: number
  roundedClass?: string
  showCaption?: boolean
}>()

const gridClass = computed(() => `grid grid-cols-${props.cols || 2} gap-2`)
const srcList = computed(() => props.items.map((i) => i.src))
</script>

<template>
  <div :class="gridClass">
    <div v-for="(img, idx) in items" :key="idx" class="relative w-full overflow-hidden border border-gray-200 bg-gray-100" :class="roundedClass || 'rounded-md'">
      <el-image :src="img.src" :alt="'产品图'" class="absolute inset-0 w-full h-full object-cover" fit="cover" :preview-src-list="srcList" :initial-index="idx" :z-index="600" preview-teleported>
        <template #error>
          <div class="absolute inset-0 w-full h-full bg-gray-100"></div>
        </template>
      </el-image>
      <div v-if="showCaption && img.caption" class="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs px-2 py-1 leading-snug line-clamp-2">
        {{ img.caption }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.progressive-image {
  filter: blur(12px);
  transform: scale(1.02);
  opacity: 0;
  transition: filter 0.35s ease, transform 0.35s ease, opacity 0.35s ease;
}

.progressive-image.loaded {
  filter: blur(0);
  transform: scale(1);
  opacity: 1;
}
</style>
