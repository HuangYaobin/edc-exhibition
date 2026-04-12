<script setup lang="ts">
import BaseModal from '@/components/base/BaseModal.vue'
import BoothBrandDirectory from '@/components/exhibition/BoothBrandDirectory.vue'
import { useMobile } from '@/composables/useMobile'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'open-booth', payload: { boothNumber: string; brandName?: string }): void
}>()

const { isMobile } = useMobile(768)

const close = () => {
  emit('update:visible', false)
}

const onOpenBooth = (payload: { boothNumber: string; brandName?: string }) => {
  emit('open-booth', payload)
}
</script>

<template>
  <BaseModal :visible="visible" :is-mobile="isMobile" @update:visible="emit('update:visible', $event)">
    <template #desktop>
      <div class="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div class="pointer-events-auto bg-white w-full max-w-4xl h-[80vh] rounded-lg shadow-xl border border-gray-200 overflow-hidden" @click.stop>
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div class="font-semibold">品牌目录</div>
            <button
              @click.stop="close"
              class="flex items-center justify-center text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
              aria-label="关闭"
            >
              <i class="i-carbon-close text-xl"></i>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <BoothBrandDirectory @open-booth="onOpenBooth" />
          </div>
        </div>
      </div>
    </template>
    <template #drawer>
      <div class="mobile-drawer bg-[#f3f4f6] fixed inset-0 flex flex-col">
        <div class="px-4 pt-3 pb-2 flex items-center justify-between">
          <h3 class="text-lg font-medium">品牌目录</h3>
          <button class="flex items-center justify-center text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors cursor-pointer" @click.stop="close" aria-label="关闭">
            <i class="i-carbon-close text-xl"></i>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-3 bg-white rounded-t-lg">
          <BoothBrandDirectory @open-booth="onOpenBooth" />
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped></style>
