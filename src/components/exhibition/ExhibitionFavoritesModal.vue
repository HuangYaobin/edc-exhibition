<script setup lang="ts">
import BaseModal from '@/components/base/BaseModal.vue'
import ExhibitionFavorites from '@/components/exhibition/ExhibitionFavorites.vue'
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
        <div class="pointer-events-auto bg-white dark:bg-[var(--c-bg)] w-full max-w-3xl h-[80vh] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden" @click.stop>
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="font-semibold">我的收藏与意向</div>
            <button
              @click="close"
              class="flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              aria-label="关闭"
            >
              <i class="i-carbon-close text-xl"></i>
            </button>
          </div>
          <div class="h-[calc(80vh-56px)] overflow-y-auto">
            <ExhibitionFavorites :visible="true" @open-booth="onOpenBooth" @update:visible="(v) => emit('update:visible', v)" />
          </div>
        </div>
      </div>
    </template>
    <template #drawer>
      <div class="mobile-drawer fixed inset-0 flex flex-col bg-white dark:bg-[var(--c-bg)]">
        <div class="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium">我的收藏与意向</h3>
          <button class="flex p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 cursor-pointer" @click="close" aria-label="关闭">
            <i class="i-carbon-close text-xl"></i>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <ExhibitionFavorites :visible="true" @open-booth="onOpenBooth" @update:visible="(v) => emit('update:visible', v)" />
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped></style>
