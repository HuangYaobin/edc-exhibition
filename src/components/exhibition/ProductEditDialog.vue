<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import { createProduct, updateProduct } from '@/api'
import type { BoothProduct } from '@/api/types'

const props = defineProps<{
  visible: boolean
  boothId: string
  product?: BoothProduct | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}>()

const form = ref({ name: '', description: '', imageUrl: '', price: '', quantity: '' })
const saving = ref(false)
const errorMsg = ref('')

watch(
  () => [props.visible, props.product],
  () => {
    if (props.visible) {
      form.value = {
        name: props.product?.name ?? '',
        description: props.product?.description ?? '',
        imageUrl: props.product?.imageUrl ?? '',
        price: props.product?.price != null ? String(props.product.price) : '',
        quantity: props.product?.quantity != null ? String(props.product.quantity) : '',
      }
      errorMsg.value = ''
    }
  },
  { immediate: true },
)

async function handleSave() {
  if (!form.value.name.trim()) {
    errorMsg.value = '展品名称不能为空'
    return
  }
  saving.value = true
  errorMsg.value = ''
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      imageUrl: form.value.imageUrl.trim() || undefined,
      price: form.value.price !== '' ? Number(form.value.price) : undefined,
      quantity: form.value.quantity !== '' ? Number(form.value.quantity) : undefined,
    }
    if (props.product?.id) {
      await updateProduct(props.product.id, payload)
    }
    else {
      await createProduct(props.boothId, payload)
    }
    emit('saved')
    emit('update:visible', false)
  }
  catch (e: any) {
    errorMsg.value = e?.message ?? '保存失败，请重试'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseDialog
    :visible="visible"
    :title="product ? '编辑展品' : '添加展品'"
    :close-on-click-overlay="!saving"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">展品名称 <span class="text-red-500">*</span></label>
        <input
          v-model="form.name"
          type="text"
          placeholder="请输入展品名称"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">展品描述</label>
        <textarea
          v-model="form.description"
          placeholder="请输入展品描述"
          rows="2"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors resize-none"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">图片 URL</label>
        <input
          v-model="form.imageUrl"
          type="text"
          placeholder="https://..."
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">价格（元）</label>
        <input
          v-model="form.price"
          type="number"
          min="0"
          step="0.01"
          placeholder="可选"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">限量数量（件）</label>
        <input
          v-model="form.quantity"
          type="number"
          min="0"
          step="1"
          placeholder="不填表示不限量"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <p v-if="errorMsg" class="text-red-400 text-xs m-0">{{ errorMsg }}</p>

      <div class="flex gap-2 pt-1">
        <button
          class="flex-1 py-2 rounded-lg text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer bg-transparent"
          :disabled="saving"
          @click="emit('update:visible', false)"
        >
          取消
        </button>
        <button
          class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
          :class="saving ? 'bg-zinc-700 text-zinc-500' : 'bg-zinc-100 text-zinc-900 hover:bg-white'"
          :disabled="saving"
          @click="handleSave"
        >
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </div>
  </BaseDialog>
</template>
