<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import ProductEditDialog from '@/components/exhibition/ProductEditDialog.vue'
import { deleteProduct, updateBrand } from '@/api'
import type { BoothBrand, BoothProduct } from '@/api/types'

const props = defineProps<{
  visible: boolean
  brand: BoothBrand
  boothId: string
  products: BoothProduct[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}>()

type Tab = 'brand' | 'products'
const activeTab = ref<Tab>('brand')

const form = ref({
  name: '',
  nameEn: '',
  description: '',
  logoUrl: '',
  contact: '',
  contactImageUrl: '',
  contactType: 'text' as 'text' | 'image',
})

const saving = ref(false)
const errorMsg = ref('')

const showProductDialog = ref(false)
const editingProduct = ref<BoothProduct | null>(null)
const deletingProductId = ref<string | null>(null)

watch(
  () => [props.visible, props.brand],
  () => {
    if (props.visible) {
      form.value = {
        name: props.brand.name ?? '',
        nameEn: props.brand.nameEn ?? '',
        description: props.brand.description ?? '',
        logoUrl: props.brand.logoUrl ?? '',
        contact: props.brand.contact ?? '',
        contactImageUrl: props.brand.contactImageUrl ?? '',
        contactType: props.brand.contactType ?? 'text',
      }
      activeTab.value = 'brand'
      errorMsg.value = ''
    }
  },
  { immediate: true },
)

async function handleSaveBrand() {
  if (!form.value.name.trim()) {
    errorMsg.value = '品牌名称不能为空'
    return
  }
  saving.value = true
  errorMsg.value = ''
  try {
    await updateBrand(props.brand.id, {
      name: form.value.name.trim(),
      nameEn: form.value.nameEn.trim() || undefined,
      description: form.value.description.trim() || undefined,
      logoUrl: form.value.logoUrl.trim() || undefined,
      contact: form.value.contactType === 'text' ? (form.value.contact.trim() || undefined) : undefined,
      contactImageUrl: form.value.contactType === 'image' ? (form.value.contactImageUrl.trim() || undefined) : undefined,
      contactType: form.value.contactType,
    })
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

function openAddProduct() {
  editingProduct.value = null
  showProductDialog.value = true
}

function openEditProduct(product: BoothProduct) {
  editingProduct.value = product
  showProductDialog.value = true
}

async function handleDeleteProduct(product: BoothProduct) {
  if (!product.id) return
  deletingProductId.value = product.id
  try {
    await deleteProduct(product.id)
    emit('saved')
  }
  catch (e: any) {
    errorMsg.value = e?.message ?? '删除失败，请重试'
  }
  finally {
    deletingProductId.value = null
  }
}

function onProductSaved() {
  emit('saved')
}
</script>

<template>
  <BaseDialog
    :visible="visible"
    :title="`编辑 · ${brand.name}`"
    max-width="30rem"
    :close-on-click-overlay="!saving"
    @update:visible="emit('update:visible', $event)"
  >
    <!-- Tab switcher -->
    <div class="flex gap-1 mb-4 bg-zinc-800 rounded-lg p-1 -mx-0">
      <button
        class="flex-1 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-none"
        :class="activeTab === 'brand' ? 'bg-zinc-700 text-zinc-100' : 'bg-transparent text-zinc-500 hover:text-zinc-300'"
        @click="activeTab = 'brand'"
      >
        品牌信息
      </button>
      <button
        class="flex-1 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-none"
        :class="activeTab === 'products' ? 'bg-zinc-700 text-zinc-100' : 'bg-transparent text-zinc-500 hover:text-zinc-300'"
        @click="activeTab = 'products'"
      >
        展品管理
        <span v-if="products.length" class="ml-1 text-[10px] text-zinc-500">{{ products.length }}</span>
      </button>
    </div>

    <!-- Brand info tab -->
    <div v-if="activeTab === 'brand'" class="flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">品牌名称 <span class="text-red-500">*</span></label>
        <input
          v-model="form.name"
          type="text"
          placeholder="请输入品牌名称"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">英文名称</label>
        <input
          v-model="form.nameEn"
          type="text"
          placeholder="可选"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">品牌介绍</label>
        <textarea
          v-model="form.description"
          placeholder="请输入品牌介绍"
          rows="3"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors resize-none"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">Logo URL</label>
        <input
          v-model="form.logoUrl"
          type="text"
          placeholder="https://..."
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">联系方式类型</label>
        <div class="flex gap-2">
          <button
            class="flex-1 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border"
            :class="form.contactType === 'text' ? 'bg-zinc-700 border-zinc-600 text-zinc-100' : 'bg-transparent border-zinc-700 text-zinc-500 hover:text-zinc-300'"
            @click="form.contactType = 'text'"
          >
            文本
          </button>
          <button
            class="flex-1 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border"
            :class="form.contactType === 'image' ? 'bg-zinc-700 border-zinc-600 text-zinc-100' : 'bg-transparent border-zinc-700 text-zinc-500 hover:text-zinc-300'"
            @click="form.contactType = 'image'"
          >
            图片
          </button>
        </div>
      </div>

      <div v-if="form.contactType === 'text'" class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">联系方式文本</label>
        <textarea
          v-model="form.contact"
          placeholder="请输入联系方式（如微信号、电话等）"
          rows="2"
          class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 transition-colors resize-none"
        />
      </div>

      <div v-else class="flex flex-col gap-1">
        <label class="text-[11px] text-zinc-500">联系方式图片 URL</label>
        <input
          v-model="form.contactImageUrl"
          type="text"
          placeholder="https://..."
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
          @click="handleSaveBrand"
        >
          {{ saving ? '保存中…' : '保存品牌信息' }}
        </button>
      </div>
    </div>

    <!-- Products tab -->
    <div v-else class="flex flex-col gap-2">
      <div v-if="products.length" class="flex flex-col gap-2">
        <div
          v-for="product in products"
          :key="product.id"
          class="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2"
        >
          <div class="w-8 h-8 rounded-md overflow-hidden bg-zinc-700 shrink-0 flex items-center justify-center">
            <img
              v-if="product.imageUrl"
              :src="product.imageUrl"
              :alt="product.name"
              class="w-full h-full object-cover"
            />
            <i v-else class="i-carbon-package text-zinc-500 text-xs" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-zinc-200 text-xs font-medium m-0 truncate">{{ product.name }}</p>
            <p v-if="product.price != null" class="text-zinc-500 text-[10px] m-0">
              ¥{{ product.price.toFixed(2) }}
            </p>
          </div>
          <button
            class="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer border-none bg-transparent"
            @click="openEditProduct(product)"
          >
            <i class="i-carbon-edit text-xs" />
          </button>
          <button
            class="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors cursor-pointer border-none bg-transparent"
            :disabled="deletingProductId === product.id"
            @click="handleDeleteProduct(product)"
          >
            <i class="text-xs" :class="deletingProductId === product.id ? 'i-carbon-circle-dash animate-spin' : 'i-carbon-trash-can'" />
          </button>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center gap-2 py-6 text-zinc-700">
        <i class="i-carbon-package text-2xl" />
        <span class="text-xs">暂无展品</span>
      </div>

      <p v-if="errorMsg" class="text-red-400 text-xs m-0">{{ errorMsg }}</p>

      <button
        class="w-full py-2 rounded-lg text-sm border border-dashed border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer bg-transparent flex items-center justify-center gap-1.5 mt-1"
        @click="openAddProduct"
      >
        <i class="i-carbon-add text-sm" />
        添加展品
      </button>
    </div>
  </BaseDialog>

  <ProductEditDialog
    v-model:visible="showProductDialog"
    :booth-id="boothId"
    :product="editingProduct"
    @saved="onProductSaved"
  />
</template>
