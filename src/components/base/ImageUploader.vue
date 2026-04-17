<script setup lang="ts">
import { computed, ref } from 'vue'
import { uploadImage } from '@/api'

const props = withDefaults(
  defineProps<{
    /** 存储值：ossKey（或兼容初始的 URL） */
    modelValue: string
    /** 预览值：可直接渲染到 img 的 URL */
    previewUrl?: string
    /** Tailwind 宽高比类名，如 aspect-square / aspect-video / aspect-[4/3] */
    aspect?: string
    /** 接受的 mime 类型，逗号分隔 */
    accept?: string
    /** 最大文件大小（MB），默认 10 */
    maxSizeMB?: number
    /** 占位提示文案 */
    placeholder?: string
    /** 禁用状态 */
    disabled?: boolean
  }>(),
  {
    previewUrl: '',
    aspect: 'aspect-square',
    accept: 'image/jpeg,image/png,image/webp,image/gif',
    maxSizeMB: 10,
    placeholder: '点击上传图片',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:previewUrl', value: string): void
  (e: 'error', message: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const localError = ref('')

// 预览优先用 previewUrl，没有就回退到 modelValue（兼容初始值是 URL 的情况）
const displayUrl = computed(() => props.previewUrl || props.modelValue)
const hasImage = computed(() => Boolean(displayUrl.value))

function openPicker() {
  if (props.disabled || uploading.value) return
  localError.value = ''
  fileInput.value?.click()
}

function validate(file: File): string | null {
  const allowed = props.accept.split(',').map(s => s.trim()).filter(Boolean)
  if (allowed.length > 0 && !allowed.includes(file.type)) {
    return '仅支持 jpg / png / webp / gif 格式'
  }
  const maxBytes = props.maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    return `图片大小不能超过 ${props.maxSizeMB}MB`
  }
  return null
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const err = validate(file)
  if (err) {
    localError.value = err
    emit('error', err)
    return
  }

  uploading.value = true
  try {
    const result = await uploadImage(file)
    emit('update:modelValue', result.ossKey)
    emit('update:previewUrl', result.url)
  }
  catch (e: any) {
    const msg = e?.message ?? '上传失败，请重试'
    localError.value = msg
    emit('error', msg)
  }
  finally {
    uploading.value = false
  }
}

function handleRemove(e: Event) {
  e.stopPropagation()
  if (props.disabled || uploading.value) return
  emit('update:modelValue', '')
  emit('update:previewUrl', '')
  localError.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <div
      class="relative w-full rounded-lg border border-dashed bg-zinc-800 overflow-hidden transition-colors"
      :class="[
        aspect,
        hasImage ? 'border-zinc-700' : 'border-zinc-700',
        disabled || uploading ? 'cursor-not-allowed' : 'cursor-pointer hover:border-zinc-500',
      ]"
      @click="openPicker"
    >
      <img
        v-if="hasImage"
        :src="displayUrl"
        alt=""
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div
        v-else
        class="absolute inset-0 flex flex-col items-center justify-center gap-1 text-zinc-600"
      >
        <i class="i-carbon-add-alt text-2xl" />
        <span class="text-[11px]">{{ placeholder }}</span>
      </div>

      <div
        v-if="uploading"
        class="absolute inset-0 bg-zinc-900/70 flex flex-col items-center justify-center gap-1 text-zinc-200"
      >
        <i class="i-carbon-circle-dash animate-spin text-lg" />
        <span class="text-[11px]">上传中…</span>
      </div>

      <button
        v-if="hasImage && !uploading && !disabled"
        type="button"
        class="absolute top-1 right-1 w-6 h-6 rounded-full bg-zinc-900/80 text-zinc-200 hover:bg-zinc-900 hover:text-red-300 border-none cursor-pointer flex items-center justify-center transition-colors"
        @click="handleRemove"
      >
        <i class="i-carbon-close text-xs" />
      </button>
    </div>

    <p v-if="localError" class="text-red-400 text-[11px] m-0">
      {{ localError }}
    </p>

    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      class="hidden"
      @change="handleFileChange"
    >
  </div>
</template>
