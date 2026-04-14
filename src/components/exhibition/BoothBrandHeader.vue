<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import type { BoothBrand } from '@/api/types'
import { useCheckins } from '@/composables/useCheckins'

const props = defineProps<{
  brand: BoothBrand
  boothId: string
  boothNumber: string
  wechatQrSrc?: string
  isDev?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit'): void
}>()

const descriptionEl = ref<HTMLParagraphElement | null>(null)
const isClamped = ref(false)
const showDescDialog = ref(false)
const showWechatQr = ref(false)

function checkClamped() {
  nextTick(() => {
    if (descriptionEl.value)
      isClamped.value = descriptionEl.value.scrollHeight > descriptionEl.value.clientHeight + 1
  })
}

watch(() => props.brand, () => {
  showDescDialog.value = false
  showWechatQr.value = false
  checkClamped()
})

onMounted(() => checkClamped())

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const placeholder = target.nextElementSibling as HTMLElement
  if (placeholder) placeholder.style.display = 'flex'
}

const { isCheckedIn, toggleCheckin } = useCheckins()
</script>

<template>
  <div class="relative flex gap-4 items-start p-3 border-b border-zinc-800 overflow-hidden">
    <!-- Check-in stamp overlay -->
    <Transition name="stamp">
      <div v-if="isCheckedIn(boothId)"
        class="absolute inset-0 bottom-4 z-1 pointer-events-none flex items-center justify-end pr-6">
        <div class="border-2 border-dashed border-amber-500/60 rounded-xl px-3 py-1.5 rotate-[-12deg]">
          <span class="text-amber-500/75 font-bold text-base tracking-[0.25em]">已打卡</span>
        </div>
      </div>
    </Transition>

    <!-- Booth number badge -->
    <span v-if="boothNumber"
      class="absolute top-3 right-3 inline-flex items-center gap-1 text-[12px] font-medium text-zinc-500">
      <i class="i-carbon-location text-zinc-600 text-[10px]" />
      {{ boothNumber }}
    </span>

    <!-- Logo -->
    <div class="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
      <img :src="brand.logoUrl" :alt="brand.name" class="w-full h-full object-contain" @error="handleImageError" />
      <div class="w-full h-full items-center justify-center text-zinc-600 text-2xl" style="display: none;">
        <i class="i-carbon-building" />
      </div>
    </div>

    <!-- Brand info -->
    <div class="flex-1 min-w-0 py-0.5">
      <h3 class="text-zinc-100 font-semibold text-base m-0 mb-1.5 leading-tight truncate">
        {{ brand.name }}
      </h3>

      <!-- Fixed 2-line height so layout never shifts -->
      <div class="relative h-[2.4375rem]">
        <template v-if="brand.description">
          <p ref="descriptionEl" class="text-zinc-500 text-xs leading-relaxed m-0 line-clamp-2">
            {{ brand.description }}
          </p>
          <button v-if="isClamped"
            class="absolute bottom-0 right-0 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer border-none bg-transparent p-0 leading-[1.625] pl-6"
            style="background: linear-gradient(to right, transparent, #18181b 40%)" @click.stop="showDescDialog = true">
            查看更多
          </button>
        </template>
        <p v-else class="text-zinc-700 text-xs italic m-0 leading-relaxed">
          暂无品牌介绍
        </p>
      </div>

      <BaseDialog v-model:visible="showDescDialog" :title="brand.name">
        <p class="text-zinc-400 text-sm leading-relaxed m-0">
          {{ brand.description }}
        </p>
      </BaseDialog>

      <!-- Action buttons -->
      <div class="flex items-center gap-2 mt-2">
        <button
          class="inline-flex items-center gap-1 text-[11px] px-2.5 py-2 lh-none rounded-full border transition-colors cursor-pointer"
          :class="isCheckedIn(boothId)
            ? 'bg-amber-950/50 border-amber-700/60 text-amber-400'
            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'"
          @click.stop="toggleCheckin(boothId)">
          <i class="text-[11px]"
            :class="isCheckedIn(boothId) ? 'i-carbon-checkmark-filled text-amber-400' : 'i-carbon-stamp text-zinc-500'" />
          {{ isCheckedIn(boothId) ? '已打卡' : '来打卡' }}
        </button>

        <button v-if="wechatQrSrc"
          class="inline-flex items-center gap-1 text-[11px] px-2.5 py-2 lh-none rounded-full border bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          @click.stop="showWechatQr = true">
          <i class="i-carbon-qr-code text-[11px]" />
          微信联系
        </button>

        <button
          class="inline-flex items-center gap-1 text-[11px] px-2.5 py-2 lh-none rounded-full border bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer ml-auto"
          @click.stop="emit('edit')">
          <i class="i-carbon-edit text-[11px]" />
          编辑
        </button>
      </div>

      <BaseDialog v-model:visible="showWechatQr" :title="`${brand.name} · 微信联系方式`">
        <div class="flex flex-col items-center gap-3 py-2">
          <img :src="wechatQrSrc" :alt="`${brand.name} 微信二维码`"
            class="w-48 h-48 object-contain rounded-lg bg-white p-1" />
          <p class="text-zinc-500 text-xs m-0">扫描二维码添加微信</p>
          <p v-if="isDev && !brand.wechatQrUrl" class="text-zinc-600 text-[10px] m-0">
            （开发占位图，接口返回 wechatQrUrl 后替换）
          </p>
        </div>
      </BaseDialog>
    </div>
  </div>
</template>

<style scoped>
.stamp-enter-active,
.stamp-leave-active {
  transition: opacity 0.25s ease;
}

.stamp-enter-from,
.stamp-leave-to {
  opacity: 0;
}
</style>
