<script setup lang="ts">
import BaseModal from '@/components/base/BaseModal.vue'
import { useMobile } from '@/composables/useMobile'

type MenuSection = 'directory' | 'info' | 'favorites'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select-section', section: MenuSection): void
}>()

const { isMobile } = useMobile(768)

const close = () => {
  emit('update:visible', false)
}

const selectSection = (section: MenuSection) => {
  emit('select-section', section)
  close()
}
</script>

<template>
  <BaseModal :visible="visible" :is-mobile="isMobile" @update:visible="emit('update:visible', $event)">
    <template #desktop>
      <div class="fixed inset-0 flex items-end justify-end p-4 pointer-events-none">
        <div class="pointer-events-auto bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-56">
          <div class="p-2 divide-y divide-gray-100">
            <button class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer" @click="selectSection('directory')">
              <i class="i-carbon-catalog text-gray-700"></i>
              <span>品牌目录</span>
            </button>
            <button class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer" @click="selectSection('info')">
              <i class="i-carbon-information text-gray-700"></i>
              <span>展会信息</span>
            </button>
            <button class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer" @click="selectSection('favorites')">
              <i class="i-carbon-favorite text-rose-600"></i>
              <span>收藏与意向</span>
            </button>
          </div>
        </div>
      </div>
    </template>
    <template #drawer>
      <div class="mobile-drawer fixed inset-0 flex flex-col bg-white">
        <div class="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-200">
          <h3 class="text-lg font-medium">展会菜单</h3>
          <button class="flex p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer" @click="close" aria-label="关闭">
            <i class="i-carbon-close text-xl"></i>
          </button>
        </div>
        <div class="p-2">
          <button class="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-3 mb-2 cursor-pointer" @click="selectSection('directory')">
            <i class="i-carbon-catalog text-gray-700"></i>
            <div>
              <div class="text-base">品牌目录</div>
              <div class="text-xs text-gray-500">按展位/品牌快速查找</div>
            </div>
          </button>
          <button class="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-3 mb-2 cursor-pointer" @click="selectSection('info')">
            <i class="i-carbon-information text-gray-700"></i>
            <div>
              <div class="text-base">展会信息</div>
              <div class="text-xs text-gray-500">时间 / 地点 / 路线</div>
            </div>
          </button>
          <button class="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-3 cursor-pointer" @click="selectSection('favorites')">
            <i class="i-carbon-favorite text-rose-600"></i>
            <div>
              <div class="text-base">收藏与意向</div>
              <div class="text-xs text-gray-500">我的收藏品牌与意向产品</div>
            </div>
          </button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped></style>
