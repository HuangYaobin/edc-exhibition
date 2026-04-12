<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import { useMobile } from '@/composables/useMobile'
import { useMessage } from '@/composables/useMessage'

type BrandContact = {
  wechatQr?: string
  officialAccountQr?: string
  wechatId?: string
  phone?: string
}

const props = defineProps<{ visible: boolean; contact?: BrandContact | null }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const { isMobile } = useMobile()

const close = () => emit('update:visible', false)

const hasQr = computed(() => {
  const c = props.contact
  if (!c) return false
  return Boolean(c.wechatQr || c.officialAccountQr)
})

const hasText = computed(() => {
  const c = props.contact
  if (!c) return false
  return Boolean(c.wechatId || c.phone)
})

const { success, error } = useMessage()

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (e) {}
  return false
}

async function handleCopy(value: string, label: string): Promise<void> {
  if (!value) return
  const ok = await copyTextToClipboard(value)
  if (ok) success(`${label}已复制`)
  else error(`无法复制${label}，请手动复制`)
}
</script>

<template>
  <BaseModal :visible="visible" :is-mobile="isMobile" :enableModal="!isMobile" @update:visible="emit('update:visible', $event)">
    <!-- Desktop modal -->
    <template #desktop>
      <div class="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-500">
        <div class="relative bg-white rounded-md shadow-xl w-[92vw] max-w-md pointer-events-auto">
          <div class="flex items-center justify-between p-3 border-b border-gray-200">
            <div class="text-base font-medium text-gray-800">联系方式</div>
            <button class="flex p-1 rounded hover:bg-gray-100 cursor-pointer" @click="close" aria-label="关闭">
              <i class="i-carbon-close text-xl text-gray-600"></i>
            </button>
          </div>
          <div class="p-4">
            <div class="space-y-3">
              <div v-if="hasQr" class="grid grid-cols-2 gap-3">
                <div v-if="contact?.wechatQr" class="p-2 border border-gray-200 rounded">
                  <div class="text-xs text-gray-600 mb-1">微信二维码</div>
                  <el-image :src="contact!.wechatQr" fit="cover" class="w-full h-44 rounded overflow-hidden">
                    <template #error>
                      <div class="w-full h-44 bg-gray-100 rounded"></div>
                    </template>
                  </el-image>
                </div>
                <div v-if="contact?.officialAccountQr" class="p-2 border border-gray-200 rounded">
                  <div class="text-xs text-gray-600 mb-1">公众号二维码</div>
                  <el-image :src="contact!.officialAccountQr" fit="cover" class="w-full h-44 rounded overflow-hidden">
                    <template #error>
                      <div class="w-full h-44 bg-gray-100 rounded"></div>
                    </template>
                  </el-image>
                </div>
              </div>

              <div v-if="hasText" class="space-y-2">
                <div v-if="contact?.wechatId" class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                  <div class="text-sm text-gray-700">微信号</div>
                  <div class="flex items-center gap-2">
                    <div class="text-sm font-medium text-gray-900">{{ contact!.wechatId }}</div>
                    <button class="flex items-center p-1 rounded hover:bg-gray-100 cursor-pointer" aria-label="复制微信号" @click="handleCopy(contact!.wechatId!, '微信号')">
                      <i class="i-carbon-copy text-base text-gray-600"></i>
                    </button>
                  </div>
                </div>
                <div v-if="contact?.phone" class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                  <div class="text-sm text-gray-700">手机号</div>
                  <div class="flex items-center gap-2">
                    <div class="text-sm font-medium text-gray-900">{{ contact!.phone }}</div>
                    <button class="flex items-center p-1 rounded hover:bg-gray-100 cursor-pointer" aria-label="复制手机号" @click="handleCopy(contact!.phone!, '手机号')">
                      <i class="i-carbon-copy text-base text-gray-600"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="!hasQr && !hasText" class="text-center text-gray-500 text-sm">暂无联系方式</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Mobile drawer -->
    <template #drawer>
      <div class="mobile-drawer bg-white fixed inset-0 flex flex-col z-500">
        <div class="px-4 pt-3 pb-2 border-b border-gray-200">
          <div class="h-1.5 w-12 bg-gray-300 rounded mx-auto mb-2"></div>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">联系方式</h3>
            <button class="p-1 rounded hover:bg-gray-100 text-gray-600 cursor-pointer" @click="close" aria-label="关闭">
              <i class="i-carbon-close text-xl"></i>
            </button>
          </div>
        </div>
        <div class="p-3 flex-1 overflow-auto">
          <div class="space-y-3">
            <div v-if="hasQr" class="grid grid-cols-2 gap-3">
              <div v-if="contact?.wechatQr" class="p-2 border border-gray-200 rounded">
                <div class="text-xs text-gray-600 mb-1">微信二维码</div>
                <el-image :src="contact!.wechatQr" fit="cover" class="w-full h-44 rounded overflow-hidden">
                  <template #error>
                    <div class="w-full h-44 bg-gray-100 rounded"></div>
                  </template>
                </el-image>
              </div>
              <div v-if="contact?.officialAccountQr" class="p-2 border border-gray-200 rounded">
                <div class="text-xs text-gray-600 mb-1">公众号二维码</div>
                <el-image :src="contact!.officialAccountQr" fit="cover" class="w-full h-44 rounded overflow-hidden">
                  <template #error>
                    <div class="w-full h-44 bg-gray-100 rounded"></div>
                  </template>
                </el-image>
              </div>
            </div>

            <div v-if="hasText" class="space-y-2">
              <div v-if="contact?.wechatId" class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <div class="text-sm text-gray-700">微信号</div>
                <div class="flex items-center gap-2">
                  <div class="text-sm font-medium text-gray-900">{{ contact!.wechatId }}</div>
                  <button class="flex items-center p-1 rounded hover:bg-gray-100 cursor-pointer" aria-label="复制微信号" @click="handleCopy(contact!.wechatId!, '微信号')">
                    <i class="i-carbon-copy text-base text-gray-600"></i>
                  </button>
                </div>
              </div>
              <div v-if="contact?.phone" class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <div class="text-sm text-gray-700">手机号</div>
                <div class="flex items-center gap-2">
                  <div class="text-sm font-medium text-gray-900">{{ contact!.phone }}</div>
                  <button class="flex items-center p-1 rounded hover:bg-gray-100 cursor-pointer" aria-label="复制手机号" @click="handleCopy(contact!.phone!, '手机号')">
                    <i class="i-carbon-copy text-base text-gray-600"></i>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="!hasQr && !hasText" class="text-center text-gray-500 text-sm">暂无联系方式</div>
          </div>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped></style>
