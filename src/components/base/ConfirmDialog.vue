<script setup lang="ts">
import { computed } from 'vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import {
  confirmAccept,
  confirmCancel,
  useConfirmDialogState,
} from '@/composables/useConfirm'

const { visible, state, loading } = useConfirmDialogState()

const isDanger = computed(() => state.value.type === 'danger')

const confirmBtnClass = computed(() => {
  if (loading.value) return 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
  if (isDanger.value) return 'bg-red-500 text-white hover:bg-red-400'
  return 'bg-zinc-100 text-zinc-900 hover:bg-white'
})

const iconClass = computed(() => {
  if (isDanger.value) return 'i-carbon-warning-alt text-red-400'
  return 'i-carbon-help text-zinc-400'
})

function onUpdateVisible(val: boolean) {
  if (val) return
  confirmCancel()
}
</script>

<template>
  <BaseDialog
    :visible="visible"
    :title="state.title"
    max-width="22rem"
    :close-on-click-overlay="state.closeOnClickOverlay && !loading"
    @update:visible="onUpdateVisible"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-start gap-3">
        <div
          class="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
          :class="isDanger ? 'bg-red-500/15' : 'bg-zinc-800'"
        >
          <i class="text-base" :class="iconClass" />
        </div>
        <div class="flex-1 min-w-0 flex flex-col gap-1.5 pt-0.5">
          <p class="text-sm text-zinc-100 m-0 leading-relaxed break-words">
            {{ state.message }}
          </p>
          <p
            v-if="state.description"
            class="text-[11px] text-zinc-500 m-0 leading-relaxed break-words"
          >
            {{ state.description }}
          </p>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 py-2 rounded-lg text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer bg-transparent"
          :disabled="loading"
          @click="confirmCancel"
        >
          {{ state.cancelText }}
        </button>
        <button
          type="button"
          class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
          :class="confirmBtnClass"
          :disabled="loading"
          @click="confirmAccept"
        >
          <span v-if="loading" class="inline-flex items-center justify-center gap-1.5">
            <i class="i-carbon-circle-dash animate-spin text-sm" />
            处理中…
          </span>
          <span v-else>{{ state.confirmText }}</span>
        </button>
      </div>
    </div>
  </BaseDialog>
</template>
