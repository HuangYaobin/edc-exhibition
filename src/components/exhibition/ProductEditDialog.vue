<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import ImageUploader from '@/components/base/ImageUploader.vue'
import { createProduct, updateProduct } from '@/api'
import { ApiError } from '@/api/http'
import type { BoothProduct, CreateProductPayload, UpdateProductPayload } from '@/api/types'
import { useExhibitionTags } from '@/composables/useExhibitionTags'
import { useMessage } from '@/composables/useMessage'

const props = defineProps<{
  visible: boolean
  brandId: string
  exhibitionId: string
  product?: BoothProduct | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}>()

const form = ref({
  name: '',
  description: '',
  imageOssKey: '',
  imagePreviewUrl: '',
  material: '',
  // 价格以「元」为单位展示，提交时换算成「分」
  priceYuan: '',
  salesRule: '',
  totalQuantity: '',
  tagIds: [] as string[],
})
const saving = ref(false)
const errorMsg = ref('')

const { loadTags, getTags } = useExhibitionTags()
const tags = computed(() => getTags(props.exhibitionId).value)
const message = useMessage()

function fenToYuan(fen: number | null | undefined): string {
  if (fen == null) return ''
  return (fen / 100).toFixed(2)
}

function yuanToFen(yuan: string): number | null {
  const trimmed = yuan.trim()
  if (trimmed === '') return null
  const num = Number(trimmed)
  if (!Number.isFinite(num) || num < 0) return null
  return Math.round(num * 100)
}

watch(
  () => [props.visible, props.product, props.exhibitionId],
  () => {
    if (props.visible) {
      const initialImage = props.product?.imageUrl ?? ''
      form.value = {
        name: props.product?.name ?? '',
        description: props.product?.description ?? '',
        imageOssKey: initialImage,
        imagePreviewUrl: initialImage,
        material: props.product?.material ?? '',
        priceYuan: fenToYuan(props.product?.price),
        salesRule: props.product?.salesRule ?? '',
        totalQuantity: props.product?.totalQuantity != null ? String(props.product.totalQuantity) : '',
        tagIds: props.product?.tags?.map(t => t.id) ?? [],
      }
      errorMsg.value = ''
      if (props.exhibitionId) loadTags(props.exhibitionId)
    }
  },
  { immediate: true },
)

function toggleTag(id: string) {
  const idx = form.value.tagIds.indexOf(id)
  if (idx >= 0) form.value.tagIds.splice(idx, 1)
  else form.value.tagIds.push(id)
}

function isTagSelected(id: string) {
  return form.value.tagIds.includes(id)
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 403) return '无权限操作该商品'
    if (error.statusCode === 401) return '登录已失效，请重新登录'
    return error.message || `请求失败 (${error.statusCode})`
  }
  return error instanceof Error ? error.message : '保存失败，请重试'
}

async function handleSave() {
  if (!form.value.name.trim()) {
    errorMsg.value = '展品名称不能为空'
    return
  }
  if (form.value.priceYuan.trim() !== '' && yuanToFen(form.value.priceYuan) == null) {
    errorMsg.value = '价格必须为不小于 0 的数字'
    return
  }

  saving.value = true
  errorMsg.value = ''
  try {
    const name = form.value.name.trim()
    const description = form.value.description.trim() || null
    const imageUrl = form.value.imageOssKey.trim() || null
    const material = form.value.material.trim() || null
    const salesRule = form.value.salesRule.trim() || null
    const price = yuanToFen(form.value.priceYuan)
    const totalQuantity = form.value.totalQuantity.trim() === ''
      ? null
      : Math.max(0, Math.trunc(Number(form.value.totalQuantity)))
    const tagIds = [...form.value.tagIds]

    const isEdit = !!props.product?.id
    if (isEdit) {
      const payload: UpdateProductPayload = {
        name,
        description,
        imageUrl,
        material,
        salesRule,
        price,
        totalQuantity,
        tagIds,
      }
      await updateProduct(props.product!.id, payload)
    }
    else {
      const payload: CreateProductPayload = {
        brandId: props.brandId,
        name,
        description,
        imageUrl,
        material,
        salesRule,
        price,
        totalQuantity,
        tagIds,
      }
      await createProduct(payload)
    }
    message.success(isEdit ? '展品已更新' : '展品已添加')
    emit('saved')
    emit('update:visible', false)
  }
  catch (e) {
    errorMsg.value = formatErrorMessage(e)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseDialog :visible="visible" :title="product ? '编辑展品' : '添加展品'" :close-on-click-overlay="!saving"
    @update:visible="emit('update:visible', $event)">
    <div class="flex flex-col gap-3 min-h-[60vh] max-h-[60vh]">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">展品名称 <span class="text-red-500">*</span></label>
        <input v-model="form.name" type="text" placeholder="请输入展品名称"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">展品描述</label>
        <textarea v-model="form.description" placeholder="请输入展品描述" rows="2"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors resize-none" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">展品图片</label>
        <div class="w-40">
          <ImageUploader v-model="form.imageOssKey" v-model:preview-url="form.imagePreviewUrl" placeholder="上传展品图" />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">材质</label>
        <input v-model="form.material" type="text" placeholder="请输入材质信息"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">价格（元）</label>
        <input v-model="form.priceYuan" type="text" inputmode="decimal" placeholder="可选，留空表示不公开"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">发售规则 & 备注</label>
        <textarea v-model="form.salesRule" placeholder="请输入发售规则和备注信息" rows="2"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors resize-none" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">限量总数（件）</label>
        <input v-model="form.totalQuantity" type="text" inputmode="numeric" placeholder="不填表示不限量"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">商品标签</label>
        <div v-if="tags.length" class="flex flex-wrap gap-1.5">
          <button v-for="tag in tags" :key="tag.id" type="button"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer"
            :class="isTagSelected(tag.id)
              ? 'bg-zinc-700 border-zinc-500 text-zinc-100'
              : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'"
            @click="toggleTag(tag.id)">
            <span v-if="tag.color" class="w-1.5 h-1.5 rounded-full inline-block"
              :style="{ backgroundColor: tag.color }" />
            {{ tag.name }}
          </button>
        </div>
        <p v-else class="text-zinc-600 text-[11px] m-0">暂无可选标签</p>
      </div>

      <p v-if="errorMsg" class="text-red-400 text-xs m-0">{{ errorMsg }}</p>

      <div class="flex gap-2 pt-1">
        <button
          class="flex-1 py-2 rounded-lg text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer bg-transparent"
          :disabled="saving" @click="emit('update:visible', false)">
          取消
        </button>
        <button class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
          :class="saving ? 'bg-zinc-700 text-zinc-500' : 'bg-zinc-100 text-zinc-900 hover:bg-white'" :disabled="saving"
          @click="handleSave">
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </div>
  </BaseDialog>
</template>
