<script setup lang="ts">
const props = defineProps<{
  title: string
  link: string
  roundedClass?: string
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'copied', title: string): void
}>()

const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const getFaviconUrl = (url: string): string => {
  const hostname = getHostname(url)
  return hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=64` : ''
}

const handleOpen = () => {
  if (process.client) window.open(props.link, '_blank', 'noopener,noreferrer')
}

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.link)
    emit('copied', props.title)
  } catch {}
}
</script>

<template>
  <div class="group relative flex items-start gap-3 p-3 border border-gray-200 bg-white transition cursor-pointer" :class="roundedClass || 'rounded-xl'" @click="handleOpen">
    <el-image :src="getFaviconUrl(link)" alt="" class="w-5 h-5 rounded-sm mt-1" fit="contain" :data-poster-exclude="true">
      <template #error>
        <div class="w-5 h-5 rounded-sm mt-1 bg-gray-100"></div>
      </template>
    </el-image>
    <div class="min-w-0 flex-1">
      <span class="text-sm font-medium text-gray-900 line-clamp-2" :class="compact ? '' : 'group-hover:text-blue-700'" :title="title">
        {{ title }}
      </span>
      <div class="mt-1 flex items-center gap-2 text-xs text-gray-500">
        <i class="i-carbon-link"></i>
        <span class="truncate">{{ getHostname(link) }}</span>
      </div>
    </div>
    <div class="flex flex-col items-end gap-1 ml-1">
      <button
        class="inline-flex items-center justify-center p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md cursor-pointer"
        @click.stop="handleCopy"
        title="复制链接"
        aria-label="复制链接"
      >
        <i class="i-carbon-copy text-base"></i>
      </button>
    </div>
  </div>
</template>

<style scoped></style>
