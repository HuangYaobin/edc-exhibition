<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import { isValidIdentifier, useAuth } from '@/composables/useAuth'
import {
  rejectLoginDialog,
  resolveLoginDialog,
  useLoginDialogState,
} from '@/composables/useLoginDialog'
import { useMessage } from '@/composables/useMessage'

const { visible } = useLoginDialogState()
const { login, identifier: cachedIdentifier } = useAuth()
const message = useMessage()

const input = ref('')
const submitting = ref(false)
const errorText = ref<string | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const canSubmit = computed(() => isValidIdentifier(input.value) && !submitting.value)

watch(visible, async (val) => {
  if (val) {
    input.value = cachedIdentifier.value ?? ''
    errorText.value = null
    submitting.value = false
    await nextTick()
    inputRef.value?.focus()
  }
})

async function handleSubmit() {
  if (submitting.value) return
  const value = input.value.trim()
  if (!isValidIdentifier(value)) {
    errorText.value = '请输入有效的中国大陆手机号或邮箱'
    return
  }
  submitting.value = true
  errorText.value = null
  try {
    await login(value)
    message.success('登录成功')
    resolveLoginDialog()
  } catch (error) {
    const text = error instanceof Error ? error.message : '登录失败，请稍后重试'
    errorText.value = text
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  if (submitting.value) return
  rejectLoginDialog()
}

function onUpdateVisible(val: boolean) {
  if (!val) handleCancel()
}
</script>

<template>
  <BaseDialog
    :visible="visible"
    title="登录后保存心愿单"
    :close-on-click-overlay="!submitting"
    @update:visible="onUpdateVisible"
  >
    <div class="flex flex-col gap-3">
      <p class="text-xs text-zinc-400 leading-relaxed m-0">
        输入手机号或邮箱即可登录，仅用于在云端保存你的心愿单，下次访问自动登录。
      </p>

      <div class="flex flex-col gap-1.5">
        <input
          ref="inputRef"
          v-model="input"
          type="text"
          inputmode="email"
          autocomplete="username"
          placeholder="手机号 或 邮箱"
          :disabled="submitting"
          class="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 transition-colors disabled:opacity-60"
          @keydown.enter="handleSubmit"
        />
        <p v-if="errorText" class="text-[11px] text-rose-400 m-0 leading-snug">
          {{ errorText }}
        </p>
      </div>

      <div class="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          class="px-3 py-1.5 text-xs text-zinc-400 bg-transparent border border-zinc-700 rounded-md cursor-pointer hover:text-zinc-200 hover:border-zinc-600 transition-colors disabled:opacity-50"
          :disabled="submitting"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-zinc-900 bg-amber-400 hover:bg-amber-300 rounded-md cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <span
            v-if="submitting"
            class="w-3 h-3 border-2 border-zinc-900/40 border-t-zinc-900 rounded-full animate-spin"
          />
          <span>{{ submitting ? '登录中...' : '登录' }}</span>
        </button>
      </div>
    </div>
  </BaseDialog>
</template>
