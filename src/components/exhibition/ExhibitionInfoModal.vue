<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import { useMobile } from '@/composables/useMobile'

type ExhibitionBasicInfo = {
  title?: string
  time?: string
  dateRange?: string
  location?: string
  address?: string
  routes?: Array<{ label: string; url?: string }>
  notes?: string[]
}

const props = defineProps<{
  visible: boolean
  info?: ExhibitionBasicInfo
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const { isMobile } = useMobile(768)

const hasRoutes = computed(() => Array.isArray(props.info?.routes) && props.info!.routes!.length > 0)
const hasNotes = computed(() => Array.isArray(props.info?.notes) && props.info!.notes!.length > 0)

const close = () => {
  emit('update:visible', false)
}
</script>

<template>
  <BaseModal :visible="visible" :is-mobile="isMobile" @update:visible="emit('update:visible', $event)">
    <template #desktop>
      <div class="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div class="pointer-events-auto bg-white w-full max-w-2xl rounded-lg shadow-xl border border-gray-200 overflow-hidden" @click.stop>
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div class="font-semibold">展会信息</div>
            <button @click="close" class="flex items-center justify-center text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors cursor-pointer" aria-label="关闭">
              <i class="i-carbon-close text-xl"></i>
            </button>
          </div>
          <div class="p-4 space-y-3 text-sm text-gray-700">
            <div v-if="info?.title" class="text-base font-semibold text-gray-900">{{ info!.title }}</div>
            <div v-if="info?.dateRange" class="flex items-center gap-2">
              <i class="i-carbon-calendar"></i>
              <span>{{ info!.dateRange }}</span>
            </div>
            <div v-else-if="info?.time" class="flex items-center gap-2">
              <i class="i-carbon-time"></i>
              <span>{{ info!.time }}</span>
            </div>
            <div v-if="info?.location || info?.address" class="flex items-start gap-2">
              <i class="i-carbon-location"></i>
              <div>
                <div v-if="info?.location" class="font-medium">{{ info!.location }}</div>
                <div v-if="info?.address" class="text-gray-600">{{ info!.address }}</div>
              </div>
            </div>
            <div v-if="hasRoutes" class="space-y-1">
              <div class="text-gray-600">路线</div>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="(r, idx) in info!.routes!" :key="idx">
                  <a v-if="r.url" class="text-blue-600 hover:underline" :href="r.url" target="_blank" rel="noopener noreferrer">{{ r.label }}</a>
                  <span v-else>{{ r.label }}</span>
                </li>
              </ul>
            </div>
            <div v-if="hasNotes" class="space-y-1">
              <div class="text-gray-600">提示</div>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="(n, i) in info!.notes!" :key="i">{{ n }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #drawer>
      <div class="mobile-drawer fixed inset-0 flex flex-col bg-white">
        <div class="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-200">
          <h3 class="text-lg font-medium">展会信息</h3>
          <button class="flex p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer" @click="close" aria-label="关闭">
            <i class="i-carbon-close text-xl"></i>
          </button>
        </div>
        <div class="p-4 space-y-3 text-sm text-gray-700">
          <div v-if="info?.title" class="text-base font-semibold text-gray-900">{{ info!.title }}</div>
          <div v-if="info?.dateRange" class="flex items-center gap-2">
            <i class="i-carbon-calendar"></i>
            <span>{{ info!.dateRange }}</span>
          </div>
          <div v-else-if="info?.time" class="flex items-center gap-2">
            <i class="i-carbon-time"></i>
            <span>{{ info!.time }}</span>
          </div>
          <div v-if="info?.location || info?.address" class="flex items-start gap-2">
            <i class="i-carbon-location"></i>
            <div>
              <div v-if="info?.location" class="font-medium">{{ info!.location }}</div>
              <div v-if="info?.address" class="text-gray-600">{{ info!.address }}</div>
            </div>
          </div>
          <div v-if="hasRoutes" class="space-y-1">
            <div class="text-gray-600">路线</div>
            <ul class="list-disc list-inside space-y-1">
              <li v-for="(r, idx) in info!.routes!" :key="idx">
                <a v-if="r.url" class="text-blue-600 hover:underline" :href="r.url" target="_blank" rel="noopener noreferrer">{{ r.label }}</a>
                <span v-else>{{ r.label }}</span>
              </li>
            </ul>
          </div>
          <div v-if="hasNotes" class="space-y-1">
            <div class="text-gray-600">提示</div>
            <ul class="list-disc list-inside space-y-1">
              <li v-for="(n, i) in info!.notes!" :key="i">{{ n }}</li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped></style>
