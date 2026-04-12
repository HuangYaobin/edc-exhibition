<script setup lang="ts">
import { reactive, watch, toRaw, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import { useMobile } from '@/composables/useMobile'
import type { UploadFile, UploadUserFile } from 'element-plus'

type BrandImageItem = string | { src: string; caption?: string }

type BrandItem = {
  name: string
  logo: string
  description?: string
  exhibitionNumber: string
  backgroundImage?: string
  productImages?: BrandImageItem[]
  exhibitionProducts?: Array<{
    productName: string
    productImage: string
    productDescription?: string
    productPrice?: string
    productStock?: string
  }>
  exhibitionGifts?: Array<{
    giftName: string
    giftImage: string
    giftDescription?: string[]
    giftStock?: string
  }>
  exhibitionActivities?: Array<{
    type: string
    title: string
    description?: string
    schedule?: { startAt?: string; endAt?: string }
    location?: string
    eligibility?: string[]
    prizes?: Array<{ name: string; image?: string; quantity?: number | string }>
  }>
  exhibitionExperience?: Array<{
    experienceName: string
    experienceImage: string
    experienceDescription?: string[]
  }>
  relatedArticles?: { title: string; link: string }[]
}

const props = defineProps<{
  visible: boolean
  brand: BrandItem | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'save', brand: BrandItem): void
}>()

const { isMobile } = useMobile()

// Local editable copy
const form = reactive<BrandItem>({
  name: '',
  logo: '',
  description: '',
  exhibitionNumber: '',
  backgroundImage: '',
  productImages: [],
  exhibitionProducts: [],
  exhibitionGifts: [],
  exhibitionActivities: [],
  exhibitionExperience: [],
  relatedArticles: [],
}) as BrandItem

watch(
  () => props.brand,
  (b) => {
    if (!b) return
    const cloned = JSON.parse(JSON.stringify(b)) as BrandItem
    Object.assign(form, cloned)
    if (!form.exhibitionProducts) form.exhibitionProducts = []
    if (!form.productImages) form.productImages = []
    else {
      // Normalize gallery items to object form for editing convenience
      form.productImages = (form.productImages as any[]).map((it: any) => (typeof it === 'string' ? { src: it } : it))
    }
    if (!form.exhibitionGifts) form.exhibitionGifts = []
    if (!form.exhibitionActivities) form.exhibitionActivities = []
    if (!form.exhibitionExperience) form.exhibitionExperience = []
    if (!form.relatedArticles) form.relatedArticles = []
  },
  { immediate: true }
)

const close = () => emit('update:visible', false)

const onSubmit = () => {
  // Emit a clean object
  const payload = JSON.parse(JSON.stringify(toRaw(form))) as BrandItem
  emit('save', payload)
  close()
}

// Exhibition products helpers
const addProduct = () => {
  if (!form.exhibitionProducts) form.exhibitionProducts = []
  form.exhibitionProducts.push({
    productName: '',
    productImage: '',
    productDescription: '',
    productPrice: '',
    productStock: '',
  })
}

const removeProduct = (index: number) => {
  if (!form.exhibitionProducts) return
  form.exhibitionProducts.splice(index, 1)
}

// Related articles helpers
const addArticle = () => {
  if (!form.relatedArticles) form.relatedArticles = []
  form.relatedArticles.push({ title: '', link: '' })
}

const removeArticle = (index: number) => {
  if (!form.relatedArticles) return
  form.relatedArticles.splice(index, 1)
}

// Image upload helpers (Element Plus)
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

// Brand logo
const logoFileList = computed<UploadUserFile[]>(() => (form.logo ? [{ name: 'logo', url: form.logo }] : []))
const onLogoChange = async (file: UploadFile) => {
  if (!file.raw) return
  form.logo = await fileToDataUrl(file.raw)
}
const onLogoRemove = () => {
  form.logo = ''
}

// Background image
const bgFileList = computed<UploadUserFile[]>(() => (form.backgroundImage ? [{ name: 'background', url: form.backgroundImage }] : []))
const onBgChange = async (file: UploadFile) => {
  if (!file.raw) return
  form.backgroundImage = await fileToDataUrl(file.raw)
}
const onBgRemove = () => {
  form.backgroundImage = ''
}

// Product image
const getProductImageFileList = (index: number): UploadUserFile[] => {
  const img = form.exhibitionProducts?.[index]?.productImage
  return img ? [{ name: `product-${index}`, url: img }] : []
}
const onProductImageChange = async (index: number, file: UploadFile) => {
  if (!file.raw || !form.exhibitionProducts) return
  const dataUrl = await fileToDataUrl(file.raw)
  form.exhibitionProducts[index].productImage = dataUrl
}
const onProductImageRemove = (index: number) => {
  if (!form.exhibitionProducts) return
  form.exhibitionProducts[index].productImage = ''
}

// Reverse render helpers
const reversedExhibitionProducts = computed(() => {
  return [...(form.exhibitionProducts || [])].reverse()
})
const getOriginalIndex = (reversedIndex: number): number => {
  const len = form.exhibitionProducts ? form.exhibitionProducts.length : 0
  return len - 1 - reversedIndex
}

// Product gallery helpers
const getGalleryImageSrc = (index: number): string => {
  const item = form.productImages?.[index] as any
  if (!item) return ''
  return typeof item === 'string' ? item : item.src
}
const getGalleryImageFileList = (index: number): UploadUserFile[] => {
  const src = getGalleryImageSrc(index)
  return src ? [{ name: `gallery-${index}`, url: src }] : []
}
const addGalleryImage = () => {
  if (!form.productImages) form.productImages = []
  ;(form.productImages as any[]).push({ src: '', caption: '' })
}
const removeGalleryImage = (index: number) => {
  if (!form.productImages) return
  ;(form.productImages as any[]).splice(index, 1)
}
const onGalleryImageChange = async (index: number, file: UploadFile) => {
  if (!file.raw || !form.productImages) return
  const dataUrl = await fileToDataUrl(file.raw)
  const item = (form.productImages as any[])[index]
  if (typeof item === 'string') {
    ;(form.productImages as any[])[index] = { src: dataUrl, caption: '' }
  } else {
    item.src = dataUrl
  }
}
const onGalleryImageRemove = (index: number) => {
  if (!form.productImages) return
  const item = (form.productImages as any[])[index]
  if (typeof item === 'string') {
    ;(form.productImages as any[])[index] = '' as any
  } else {
    item.src = ''
  }
}

// Exhibition gifts helpers
const addGift = () => {
  if (!form.exhibitionGifts) form.exhibitionGifts = []
  form.exhibitionGifts.push({ giftName: '', giftImage: '', giftDescription: [], giftStock: '' })
}
const removeGift = (index: number) => {
  if (!form.exhibitionGifts) return
  form.exhibitionGifts.splice(index, 1)
}
const addGiftDescription = (giftIndex: number) => {
  const gift = form.exhibitionGifts?.[giftIndex]
  if (!gift) return
  if (!gift.giftDescription) gift.giftDescription = []
  gift.giftDescription.push('')
}
const removeGiftDescription = (giftIndex: number, descIndex: number) => {
  const gift = form.exhibitionGifts?.[giftIndex]
  if (!gift || !gift.giftDescription) return
  gift.giftDescription.splice(descIndex, 1)
}
const getGiftImageFileList = (index: number): UploadUserFile[] => {
  const img = form.exhibitionGifts?.[index]?.giftImage
  return img ? [{ name: `gift-${index}`, url: img }] : []
}
const onGiftImageChange = async (index: number, file: UploadFile) => {
  if (!file.raw || !form.exhibitionGifts) return
  const dataUrl = await fileToDataUrl(file.raw)
  form.exhibitionGifts[index].giftImage = dataUrl
}
const onGiftImageRemove = (index: number) => {
  if (!form.exhibitionGifts) return
  form.exhibitionGifts[index].giftImage = ''
}

// Exhibition activities helpers
const addActivity = () => {
  if (!form.exhibitionActivities) form.exhibitionActivities = []
  form.exhibitionActivities.push({
    type: '',
    title: '',
    description: '',
    schedule: { startAt: '', endAt: '' },
    location: '',
    eligibility: [],
    prizes: [],
  })
}
const removeActivity = (index: number) => {
  if (!form.exhibitionActivities) return
  form.exhibitionActivities.splice(index, 1)
}
const addEligibility = (activityIndex: number) => {
  const act = form.exhibitionActivities?.[activityIndex]
  if (!act) return
  if (!act.eligibility) act.eligibility = []
  act.eligibility.push('')
}
const removeEligibility = (activityIndex: number, eliIndex: number) => {
  const act = form.exhibitionActivities?.[activityIndex]
  if (!act || !act.eligibility) return
  act.eligibility.splice(eliIndex, 1)
}
const addPrize = (activityIndex: number) => {
  const act = form.exhibitionActivities?.[activityIndex]
  if (!act) return
  if (!act.prizes) act.prizes = []
  act.prizes.push({ name: '', image: '', quantity: '' })
}
const removePrize = (activityIndex: number, prizeIndex: number) => {
  const act = form.exhibitionActivities?.[activityIndex]
  if (!act || !act.prizes) return
  act.prizes.splice(prizeIndex, 1)
}
const getPrizeImageFileList = (activityIndex: number, prizeIndex: number): UploadUserFile[] => {
  const img = form.exhibitionActivities?.[activityIndex]?.prizes?.[prizeIndex]?.image
  return img ? [{ name: `prize-${activityIndex}-${prizeIndex}`, url: img }] : []
}
const onPrizeImageChange = async (activityIndex: number, prizeIndex: number, file: UploadFile) => {
  if (!file.raw) return
  const act = form.exhibitionActivities?.[activityIndex]
  if (!act || !act.prizes) return
  const dataUrl = await fileToDataUrl(file.raw)
  act.prizes[prizeIndex].image = dataUrl
}
const onPrizeImageRemove = (activityIndex: number, prizeIndex: number) => {
  const act = form.exhibitionActivities?.[activityIndex]
  if (!act || !act.prizes) return
  act.prizes[prizeIndex].image = ''
}

// Exhibition experience helpers
const addExperience = () => {
  if (!form.exhibitionExperience) form.exhibitionExperience = []
  form.exhibitionExperience.push({ experienceName: '', experienceImage: '', experienceDescription: [] })
}
const removeExperience = (index: number) => {
  if (!form.exhibitionExperience) return
  form.exhibitionExperience.splice(index, 1)
}
const addExperienceDescription = (index: number) => {
  const exp = form.exhibitionExperience?.[index]
  if (!exp) return
  if (!exp.experienceDescription) exp.experienceDescription = []
  exp.experienceDescription.push('')
}
const removeExperienceDescription = (index: number, descIndex: number) => {
  const exp = form.exhibitionExperience?.[index]
  if (!exp || !exp.experienceDescription) return
  exp.experienceDescription.splice(descIndex, 1)
}
const getExperienceImageFileList = (index: number): UploadUserFile[] => {
  const img = form.exhibitionExperience?.[index]?.experienceImage
  return img ? [{ name: `experience-${index}`, url: img }] : []
}
const onExperienceImageChange = async (index: number, file: UploadFile) => {
  if (!file.raw || !form.exhibitionExperience) return
  const dataUrl = await fileToDataUrl(file.raw)
  form.exhibitionExperience[index].experienceImage = dataUrl
}
const onExperienceImageRemove = (index: number) => {
  if (!form.exhibitionExperience) return
  form.exhibitionExperience[index].experienceImage = ''
}

// Related articles reverse helpers
const reversedRelatedArticles = computed(() => {
  return [...(form.relatedArticles || [])].reverse()
})
const getOriginalArticleIndex = (reversedIndex: number): number => {
  const len = form.relatedArticles ? form.relatedArticles.length : 0
  return len - 1 - reversedIndex
}
</script>

<template>
  <BaseModal :visible="visible" :is-mobile="isMobile" @update:visible="emit('update:visible', $event)">
    <!-- Desktop -->
    <template #desktop>
      <div class="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-500">
        <div class="pointer-events-auto w-60vw h-90vh bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
          <div class="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 class="text-lg font-semibold">编辑品牌信息</h3>
            <button class="flex p-1.5 rounded-md hover:bg-gray-100 cursor-pointer" @click="close" aria-label="关闭">
              <i class="i-carbon-close text-xl text-gray-600"></i>
            </button>
          </div>

          <el-form class="flex-1 overflow-y-auto" :model="form" @submit.prevent>
            <div class="p-6 space-y-8">
              <!-- 基础信息区域 -->
              <div class="bg-gray-50 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i class="i-carbon-information mr-2 text-blue-600"></i>
                  基础信息
                </h4>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <el-form-item label="品牌名称" class="mb-4">
                    <el-input v-model="form.name" placeholder="如：Spinmoon" size="large" />
                  </el-form-item>
                  <el-form-item label="展位号码" class="mb-4">
                    <el-input v-model="form.exhibitionNumber" placeholder="如：A1" size="large" />
                  </el-form-item>
                </div>
                <el-form-item label="品牌描述" class="mb-0">
                  <el-input type="textarea" :rows="4" v-model="form.description" placeholder="请输入品牌的详细介绍和特色" size="large" show-word-limit maxlength="500" />
                </el-form-item>
              </div>

              <!-- 品牌图片区域 -->
              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i class="i-carbon-image mr-2 text-indigo-600"></i>
                  品牌图片
                </h4>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">品牌 Logo</label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                      <el-upload
                        class="logo-uploader w-full"
                        :file-list="logoFileList"
                        list-type="picture-card"
                        :auto-upload="false"
                        :show-file-list="true"
                        :limit="1"
                        :multiple="false"
                        accept="image/*"
                        :on-change="onLogoChange"
                        :on-remove="onLogoRemove"
                      >
                        <div class="flex flex-col items-center justify-center py-4">
                          <i class="i-carbon-add text-2xl text-gray-400 mb-2"></i>
                          <span class="text-sm text-gray-500">上传 Logo</span>
                        </div>
                      </el-upload>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">背景图片</label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                      <el-upload
                        class="bg-uploader w-full"
                        :file-list="bgFileList"
                        list-type="picture-card"
                        :auto-upload="false"
                        :show-file-list="true"
                        :limit="1"
                        :multiple="false"
                        accept="image/*"
                        :on-change="onBgChange"
                        :on-remove="onBgRemove"
                      >
                        <div class="flex flex-col items-center justify-center py-4">
                          <i class="i-carbon-add text-2xl text-gray-400 mb-2"></i>
                          <span class="text-sm text-gray-500">上传背景</span>
                        </div>
                      </el-upload>
                    </div>
                  </div>
                </div>

                <!-- 产品图集已移动到独立版块 -->
              </div>

              <!-- 产品图集区域（独立） -->
              <div class="bg-cyan-50 rounded-lg p-6">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <i class="i-carbon-gallery mr-2 text-cyan-600"></i>
                    产品图集
                  </h4>
                  <el-button type="primary" size="small" @click="addGalleryImage">
                    <i class="i-carbon-add mr-1"></i>
                    新增图片
                  </el-button>
                </div>
                <div v-if="form.productImages && form.productImages.length" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div v-for="(img, idx) in form.productImages" :key="idx" class="bg-white rounded-lg border border-gray-200 p-3">
                    <div class="mb-2">
                      <el-upload
                        :file-list="getGalleryImageFileList(idx)"
                        list-type="picture-card"
                        :auto-upload="false"
                        :show-file-list="true"
                        :limit="1"
                        :multiple="false"
                        accept="image/*"
                        :on-change="(file) => onGalleryImageChange(idx, file)"
                        :on-remove="() => onGalleryImageRemove(idx)"
                      >
                        <div class="flex flex-col items-center justify-center py-2">
                          <i class="i-carbon-add text-xl text-gray-400 mb-1"></i>
                          <span class="text-xs text-gray-500">图片</span>
                        </div>
                      </el-upload>
                    </div>
                    <el-input v-model="(form.productImages[idx] as any).caption" placeholder="图片标题（可选）" size="small" />
                    <div class="mt-2 text-right">
                      <el-button type="danger" size="small" link @click="removeGalleryImage(idx)">
                        <i class="i-carbon-trash-can mr-1"></i>
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center text-gray-500 text-sm py-6">暂无图集，点击上方“新增图片”添加</div>
              </div>

              <!-- 礼包/活动礼区域 -->
              <div class="bg-yellow-50 rounded-lg p-6">
                <div class="flex items-center justify-between mb-6">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <i class="i-carbon-gift mr-2 text-yellow-700"></i>
                    展位礼包/互动礼
                  </h4>
                  <el-button type="primary" @click="addGift" size="large">
                    <i class="i-carbon-add mr-2"></i>
                    新增礼包
                  </el-button>
                </div>
                <div v-if="form.exhibitionGifts && form.exhibitionGifts.length" class="space-y-4">
                  <div v-for="(g, gIdx) in form.exhibitionGifts" :key="gIdx" class="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                      <div class="flex items-center">
                        <span class="w-8 h-8 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-sm font-semibold mr-3">{{ gIdx + 1 }}</span>
                        <span class="font-medium text-gray-900">礼包信息</span>
                      </div>
                      <el-button type="danger" link @click="removeGift(gIdx)" size="small">
                        <i class="i-carbon-trash-can mr-1"></i>
                        删除
                      </el-button>
                    </div>
                    <div class="p-6 space-y-6">
                      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-2 space-y-4">
                          <el-form-item label="礼包名称" class="mb-0">
                            <el-input v-model="form.exhibitionGifts![gIdx].giftName" placeholder="如：老玩家福利 & 互动礼" size="large" />
                          </el-form-item>
                          <el-form-item label="库存/数量" class="mb-0">
                            <el-input v-model="form.exhibitionGifts![gIdx].giftStock" placeholder="如：先到先得/限量100" size="large" />
                          </el-form-item>
                        </div>
                        <div class="space-y-2">
                          <label class="block text-sm font-medium text-gray-700 mb-2">礼包图片</label>
                          <div class="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-yellow-400 transition-colors">
                            <el-upload
                              :file-list="getGiftImageFileList(gIdx)"
                              list-type="picture-card"
                              :auto-upload="false"
                              :show-file-list="true"
                              :limit="1"
                              :multiple="false"
                              accept="image/*"
                              :on-change="(file) => onGiftImageChange(gIdx, file)"
                              :on-remove="() => onGiftImageRemove(gIdx)"
                            >
                              <div class="flex flex-col items-center justify-center py-2">
                                <i class="i-carbon-add text-xl text-gray-400 mb-1"></i>
                                <span class="text-xs text-gray-500">礼包图</span>
                              </div>
                            </el-upload>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-2">
                          <label class="block text-sm font-medium text-gray-700">礼包描述</label>
                          <el-button size="small" type="primary" @click="addGiftDescription(gIdx)">
                            <i class="i-carbon-add mr-1"></i>
                            新增描述
                          </el-button>
                        </div>
                        <div v-if="form.exhibitionGifts![gIdx].giftDescription && form.exhibitionGifts![gIdx].giftDescription!.length" class="space-y-2">
                          <div v-for="(d, dIdx) in form.exhibitionGifts![gIdx].giftDescription" :key="dIdx" class="flex items-center gap-2">
                            <el-input v-model="form.exhibitionGifts![gIdx].giftDescription![dIdx]" placeholder="输入一条描述" size="large" />
                            <el-button type="danger" link size="small" @click="removeGiftDescription(gIdx, dIdx)">
                              <i class="i-carbon-trash-can"></i>
                            </el-button>
                          </div>
                        </div>
                        <div v-else class="text-gray-500 text-sm">暂无描述，点击“新增描述”添加</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-8">
                  <div class="text-gray-400 mb-2">
                    <i class="i-carbon-gift text-4xl"></i>
                  </div>
                  <p class="text-gray-500 text-sm">暂无礼包信息</p>
                </div>
              </div>

              <!-- 展会活动区域 -->
              <div class="bg-orange-50 rounded-lg p-6">
                <div class="flex items-center justify-between mb-6">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <i class="i-carbon-calendar mr-2 text-orange-600"></i>
                    展会活动
                  </h4>
                  <el-button type="primary" @click="addActivity" size="large">
                    <i class="i-carbon-add mr-2"></i>
                    新增活动
                  </el-button>
                </div>
                <div v-if="form.exhibitionActivities && form.exhibitionActivities.length" class="space-y-4">
                  <div v-for="(a, aIdx) in form.exhibitionActivities" :key="aIdx" class="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                      <div class="flex items-center">
                        <span class="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">{{ aIdx + 1 }}</span>
                        <span class="font-medium text-gray-900">活动信息</span>
                      </div>
                      <el-button type="danger" link @click="removeActivity(aIdx)" size="small">
                        <i class="i-carbon-trash-can mr-1"></i>
                        删除
                      </el-button>
                    </div>
                    <div class="p-6 space-y-6">
                      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <el-form-item label="活动类型" class="mb-0">
                          <el-input v-model="form.exhibitionActivities![aIdx].type" placeholder="如：raffle" size="large" />
                        </el-form-item>
                        <el-form-item label="活动标题" class="mb-0">
                          <el-input v-model="form.exhibitionActivities![aIdx].title" placeholder="输入标题" size="large" />
                        </el-form-item>
                        <el-form-item label="活动位置" class="mb-0">
                          <el-input v-model="form.exhibitionActivities![aIdx].location" placeholder="如：A6" size="large" />
                        </el-form-item>
                      </div>
                      <el-form-item label="活动描述" class="mb-0">
                        <el-input type="textarea" :rows="3" v-model="form.exhibitionActivities![aIdx].description" placeholder="输入活动描述" size="large" />
                      </el-form-item>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <el-form-item label="开始日期" class="mb-0">
                          <el-input v-model="(form.exhibitionActivities![aIdx].schedule as any).startAt" placeholder="YYYY-MM-DD" size="large" />
                        </el-form-item>
                        <el-form-item label="结束日期" class="mb-0">
                          <el-input v-model="(form.exhibitionActivities![aIdx].schedule as any).endAt" placeholder="YYYY-MM-DD" size="large" />
                        </el-form-item>
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-2">
                          <label class="block text-sm font-medium text-gray-700">参与条件</label>
                          <el-button size="small" type="primary" @click="addEligibility(aIdx)">
                            <i class="i-carbon-add mr-1"></i>
                            新增条件
                          </el-button>
                        </div>
                        <div v-if="form.exhibitionActivities![aIdx].eligibility && form.exhibitionActivities![aIdx].eligibility!.length" class="space-y-2">
                          <div v-for="(e, eIdx) in form.exhibitionActivities![aIdx].eligibility" :key="eIdx" class="flex items-center gap-2">
                            <el-input v-model="form.exhibitionActivities![aIdx].eligibility![eIdx]" placeholder="输入一条条件" size="large" />
                            <el-button type="danger" link size="small" @click="removeEligibility(aIdx, eIdx)">
                              <i class="i-carbon-trash-can"></i>
                            </el-button>
                          </div>
                        </div>
                        <div v-else class="text-gray-500 text-sm">暂无条件，点击“新增条件”添加</div>
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-2">
                          <label class="block text-sm font-medium text-gray-700">奖品设置</label>
                          <el-button size="small" type="primary" @click="addPrize(aIdx)">
                            <i class="i-carbon-add mr-1"></i>
                            新增奖品
                          </el-button>
                        </div>
                        <div v-if="form.exhibitionActivities![aIdx].prizes && form.exhibitionActivities![aIdx].prizes!.length" class="space-y-3">
                          <div v-for="(p, pIdx) in form.exhibitionActivities![aIdx].prizes" :key="pIdx" class="bg-gray-50 rounded-md border border-gray-200 p-4">
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                              <el-form-item label="奖品名称" class="mb-0">
                                <el-input v-model="form.exhibitionActivities![aIdx].prizes![pIdx].name" placeholder="如：头奖：定制名额" size="large" />
                              </el-form-item>
                              <el-form-item label="数量" class="mb-0">
                                <el-input v-model="(form.exhibitionActivities![aIdx].prizes![pIdx] as any).quantity" placeholder="如：1/若干" size="large" />
                              </el-form-item>
                              <div class="space-y-1">
                                <label class="block text-sm font-medium text-gray-700">奖品图片</label>
                                <el-upload
                                  :file-list="getPrizeImageFileList(aIdx, pIdx)"
                                  list-type="picture-card"
                                  :auto-upload="false"
                                  :show-file-list="true"
                                  :limit="1"
                                  :multiple="false"
                                  accept="image/*"
                                  :on-change="(file) => onPrizeImageChange(aIdx, pIdx, file)"
                                  :on-remove="() => onPrizeImageRemove(aIdx, pIdx)"
                                >
                                  <div class="flex flex-col items-center justify-center py-2">
                                    <i class="i-carbon-add text-lg text-gray-400 mb-1"></i>
                                    <span class="text-xs text-gray-500">奖品图</span>
                                  </div>
                                </el-upload>
                              </div>
                            </div>
                            <div class="text-right mt-2">
                              <el-button type="danger" link size="small" @click="removePrize(aIdx, pIdx)">
                                <i class="i-carbon-trash-can mr-1"></i>
                                删除奖品
                              </el-button>
                            </div>
                          </div>
                        </div>
                        <div v-else class="text-gray-500 text-sm">暂无奖品，点击“新增奖品”添加</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-8">
                  <div class="text-gray-400 mb-2">
                    <i class="i-carbon-calendar text-4xl"></i>
                  </div>
                  <p class="text-gray-500 text-sm">暂无活动信息</p>
                </div>
              </div>

              <!-- 展位体验区域 -->
              <div class="bg-teal-50 rounded-lg p-6">
                <div class="flex items-center justify-between mb-6">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <i class="i-carbon-user mr-2 text-teal-700"></i>
                    体验项目
                  </h4>
                  <el-button type="primary" @click="addExperience" size="large">
                    <i class="i-carbon-add mr-2"></i>
                    新增体验
                  </el-button>
                </div>
                <div v-if="form.exhibitionExperience && form.exhibitionExperience.length" class="space-y-4">
                  <div v-for="(ex, exIdx) in form.exhibitionExperience" :key="exIdx" class="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                      <div class="flex items-center">
                        <span class="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-semibold mr-3">{{ exIdx + 1 }}</span>
                        <span class="font-medium text-gray-900">体验信息</span>
                      </div>
                      <el-button type="danger" link @click="removeExperience(exIdx)" size="small">
                        <i class="i-carbon-trash-can mr-1"></i>
                        删除
                      </el-button>
                    </div>
                    <div class="p-6 space-y-6">
                      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-2 space-y-4">
                          <el-form-item label="体验名称" class="mb-0">
                            <el-input v-model="form.exhibitionExperience![exIdx].experienceName" placeholder="如：上手体验" size="large" />
                          </el-form-item>
                        </div>
                        <div class="space-y-2">
                          <label class="block text-sm font-medium text-gray-700 mb-2">体验图片</label>
                          <div class="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-teal-400 transition-colors">
                            <el-upload
                              :file-list="getExperienceImageFileList(exIdx)"
                              list-type="picture-card"
                              :auto-upload="false"
                              :show-file-list="true"
                              :limit="1"
                              :multiple="false"
                              accept="image/*"
                              :on-change="(file) => onExperienceImageChange(exIdx, file)"
                              :on-remove="() => onExperienceImageRemove(exIdx)"
                            >
                              <div class="flex flex-col items-center justify-center py-2">
                                <i class="i-carbon-add text-xl text-gray-400 mb-1"></i>
                                <span class="text-xs text-gray-500">体验图</span>
                              </div>
                            </el-upload>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div class="flex items-center justify-between mb-2">
                          <label class="block text-sm font-medium text-gray-700">体验描述</label>
                          <el-button size="small" type="primary" @click="addExperienceDescription(exIdx)">
                            <i class="i-carbon-add mr-1"></i>
                            新增描述
                          </el-button>
                        </div>
                        <div v-if="form.exhibitionExperience![exIdx].experienceDescription && form.exhibitionExperience![exIdx].experienceDescription!.length" class="space-y-2">
                          <div v-for="(d, dIdx) in form.exhibitionExperience![exIdx].experienceDescription" :key="dIdx" class="flex items-center gap-2">
                            <el-input v-model="form.exhibitionExperience![exIdx].experienceDescription![dIdx]" placeholder="输入一条描述" size="large" />
                            <el-button type="danger" link size="small" @click="removeExperienceDescription(exIdx, dIdx)">
                              <i class="i-carbon-trash-can"></i>
                            </el-button>
                          </div>
                        </div>
                        <div v-else class="text-gray-500 text-sm">暂无描述，点击“新增描述”添加</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-8">
                  <div class="text-gray-400 mb-2">
                    <i class="i-carbon-user text-4xl"></i>
                  </div>
                  <p class="text-gray-500 text-sm">暂无体验信息</p>
                </div>
              </div>

              <!-- 展位产品区域 -->
              <div class="bg-green-50 rounded-lg p-6">
                <div class="flex items-center justify-between mb-6">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <i class="i-carbon-shopping-cart mr-2 text-green-600"></i>
                    展位可购买产品
                  </h4>
                  <el-button type="primary" @click="addProduct" size="large">
                    <i class="i-carbon-add mr-2"></i>
                    新增产品
                  </el-button>
                </div>

                <div v-if="form.exhibitionProducts && form.exhibitionProducts.length" class="space-y-4">
                  <div v-for="(p, rIdx) in reversedExhibitionProducts" :key="rIdx" class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                      <div class="flex items-center">
                        <span class="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                          {{ getOriginalIndex(rIdx) + 1 }}
                        </span>
                        <span class="font-medium text-gray-900">产品信息</span>
                      </div>
                      <el-button type="danger" link @click="removeProduct(getOriginalIndex(rIdx))" size="small">
                        <i class="i-carbon-trash-can mr-1"></i>
                        删除
                      </el-button>
                    </div>
                    <div class="p-6">
                      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div class="lg:col-span-2">
                          <el-form-item label="产品名称" class="mb-4">
                            <el-input v-model="form.exhibitionProducts![getOriginalIndex(rIdx)].productName" placeholder="请输入产品名称" size="large" />
                          </el-form-item>
                          <el-form-item label="产品描述" class="mb-0">
                            <el-input v-model="form.exhibitionProducts![getOriginalIndex(rIdx)].productDescription" placeholder="请输入产品的详细描述" size="large" show-word-limit maxlength="200" />
                          </el-form-item>
                        </div>
                        <div class="space-y-2">
                          <label class="block text-sm font-medium text-gray-700 mb-2">产品图片</label>
                          <div class="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-green-400 transition-colors">
                            <el-upload
                              :file-list="getProductImageFileList(getOriginalIndex(rIdx))"
                              list-type="picture-card"
                              :auto-upload="false"
                              :show-file-list="true"
                              :limit="1"
                              :multiple="false"
                              accept="image/*"
                              :on-change="(file) => onProductImageChange(getOriginalIndex(rIdx), file)"
                              :on-remove="() => onProductImageRemove(getOriginalIndex(rIdx))"
                              class="product-image-upload"
                            >
                              <div class="flex flex-col items-center justify-center py-2">
                                <i class="i-carbon-add text-xl text-gray-400 mb-1"></i>
                                <span class="text-xs text-gray-500">产品图</span>
                              </div>
                            </el-upload>
                          </div>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <el-form-item label="产品价格" class="mb-0">
                          <el-input v-model="form.exhibitionProducts![getOriginalIndex(rIdx)].productPrice" placeholder="如：199" size="large">
                            <template #append>元</template>
                          </el-input>
                        </el-form-item>
                        <el-form-item label="库存数量" class="mb-0">
                          <el-input v-model="form.exhibitionProducts![getOriginalIndex(rIdx)].productStock" placeholder="如：50" size="large">
                            <template #append>件</template>
                          </el-input>
                        </el-form-item>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-8">
                  <div class="text-gray-400 mb-2">
                    <i class="i-carbon-shopping-cart text-4xl"></i>
                  </div>
                  <p class="text-gray-500 text-sm">暂无产品信息</p>
                  <p class="text-gray-400 text-xs">点击上方"新增产品"按钮开始添加</p>
                </div>
              </div>

              <!-- 相关文章区域 -->
              <div class="bg-purple-50 rounded-lg p-6">
                <div class="flex items-center justify-between mb-6">
                  <h4 class="text-lg font-semibold text-gray-800 flex items-center">
                    <i class="i-carbon-document mr-2 text-purple-600"></i>
                    相关文章
                  </h4>
                  <el-button type="primary" @click="addArticle" size="large">
                    <i class="i-carbon-add mr-2"></i>
                    新增文章
                  </el-button>
                </div>

                <div v-if="form.relatedArticles && form.relatedArticles.length" class="space-y-4">
                  <div v-for="(a, rIdx) in reversedRelatedArticles" :key="rIdx" class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                      <div class="flex items-center">
                        <span class="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                          {{ getOriginalArticleIndex(rIdx) + 1 }}
                        </span>
                        <span class="font-medium text-gray-900">文章链接</span>
                      </div>
                      <el-button type="danger" link @click="removeArticle(getOriginalArticleIndex(rIdx))" size="small">
                        <i class="i-carbon-trash-can mr-1"></i>
                        删除
                      </el-button>
                    </div>
                    <div class="p-6">
                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <el-form-item label="文章标题" class="mb-0">
                          <el-input v-model="form.relatedArticles![getOriginalArticleIndex(rIdx)].title" placeholder="请输入文章标题" size="large" />
                        </el-form-item>
                        <el-form-item label="文章链接" class="mb-0">
                          <el-input v-model="form.relatedArticles![getOriginalArticleIndex(rIdx)].link" placeholder="https://..." size="large">
                            <template #prepend>
                              <i class="i-carbon-link text-gray-500"></i>
                            </template>
                          </el-input>
                        </el-form-item>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-8">
                  <div class="text-gray-400 mb-2">
                    <i class="i-carbon-document text-4xl"></i>
                  </div>
                  <p class="text-gray-500 text-sm">暂无相关文章</p>
                  <p class="text-gray-400 text-xs">点击上方"新增文章"按钮开始添加</p>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <el-button @click="close" size="large">取消</el-button>
                <el-button type="primary" @click="onSubmit" size="large">
                  <i class="i-carbon-checkmark mr-2"></i>
                  保存更改
                </el-button>
              </div>
            </div>
          </el-form>
        </div>
      </div>
    </template>

    <!-- Drawer (Mobile) -->
    <template #drawer>
      <div class="fixed inset-0 bg-white flex flex-col z-500">
        <div class="px-4 pt-3 pb-2 border-b flex items-center justify-between">
          <h3 class="text-base font-semibold">编辑品牌信息</h3>
          <button class="p-1.5 rounded-md hover:bg-gray-100" @click="close" aria-label="关闭">
            <i class="i-carbon-close text-xl text-gray-600"></i>
          </button>
        </div>

        <el-form class="overflow-y-auto" :model="form" @submit.prevent>
          <div class="p-4 space-y-6">
            <!-- 基础信息区域 -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-base font-semibold text-gray-800 mb-4 flex items-center">
                <i class="i-carbon-information mr-2 text-blue-600"></i>
                基础信息
              </h4>
              <div class="space-y-4">
                <el-form-item label="品牌名称">
                  <el-input v-model="form.name" placeholder="如：Spinmoon" size="large" />
                </el-form-item>
                <el-form-item label="展位号码">
                  <el-input v-model="form.exhibitionNumber" placeholder="如：A1" size="large" />
                </el-form-item>
                <el-form-item label="品牌描述">
                  <el-input type="textarea" :rows="3" v-model="form.description" placeholder="请输入品牌的详细介绍和特色" size="large" show-word-limit maxlength="500" />
                </el-form-item>
              </div>
            </div>

            <!-- 品牌图片区域 -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
              <h4 class="text-base font-semibold text-gray-800 mb-4 flex items-center">
                <i class="i-carbon-image mr-2 text-indigo-600"></i>
                品牌图片
              </h4>
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">品牌 Logo</label>
                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-blue-400 transition-colors">
                    <el-upload
                      class="logo-uploader w-full"
                      :file-list="logoFileList"
                      list-type="picture-card"
                      :auto-upload="false"
                      :show-file-list="true"
                      :limit="1"
                      :multiple="false"
                      accept="image/*"
                      :on-change="onLogoChange"
                      :on-remove="onLogoRemove"
                    >
                      <div class="flex flex-col items-center justify-center py-3">
                        <i class="i-carbon-add text-xl text-gray-400 mb-1"></i>
                        <span class="text-xs text-gray-500">上传 Logo</span>
                      </div>
                    </el-upload>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">背景图片</label>
                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-blue-400 transition-colors">
                    <el-upload
                      class="bg-uploader w-full"
                      :file-list="bgFileList"
                      list-type="picture-card"
                      :auto-upload="false"
                      :show-file-list="true"
                      :limit="1"
                      :multiple="false"
                      accept="image/*"
                      :on-change="onBgChange"
                      :on-remove="onBgRemove"
                    >
                      <div class="flex flex-col items-center justify-center py-3">
                        <i class="i-carbon-add text-xl text-gray-400 mb-1"></i>
                        <span class="text-xs text-gray-500">上传背景</span>
                      </div>
                    </el-upload>
                  </div>
                </div>
              </div>
            </div>

            <!-- 产品图集区域（移动端独立） -->
            <div class="bg-cyan-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-base font-semibold text-gray-800 flex items-center">
                  <i class="i-carbon-gallery mr-2 text-cyan-600"></i>
                  产品图集
                </h4>
                <el-button type="primary" size="small" @click="addGalleryImage">
                  <i class="i-carbon-add mr-1"></i>
                  新增
                </el-button>
              </div>
              <div v-if="form.productImages && form.productImages.length" class="grid grid-cols-2 gap-2">
                <div v-for="(img, idx) in form.productImages" :key="idx" class="bg-white rounded-lg border border-gray-200 p-2">
                  <div class="mb-2">
                    <el-upload
                      :file-list="getGalleryImageFileList(idx)"
                      list-type="picture-card"
                      :auto-upload="false"
                      :show-file-list="true"
                      :limit="1"
                      :multiple="false"
                      accept="image/*"
                      :on-change="(file) => onGalleryImageChange(idx, file)"
                      :on-remove="() => onGalleryImageRemove(idx)"
                    >
                      <div class="flex flex-col items-center justify-center py-2">
                        <i class="i-carbon-add text-lg text-gray-400 mb-1"></i>
                        <span class="text-xs text-gray-500">图片</span>
                      </div>
                    </el-upload>
                  </div>
                  <el-input v-model="(form.productImages[idx] as any).caption" placeholder="标题（可选）" size="small" />
                  <div class="mt-1 text-right">
                    <el-button type="danger" size="small" link @click="removeGalleryImage(idx)">
                      <i class="i-carbon-trash-can mr-1"></i>
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
              <div v-else class="text-gray-500 text-xs">暂无图集，点击右上角“新增”添加</div>
            </div>

            <!-- 礼包/活动礼区域（移动端） -->
            <div class="bg-yellow-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-base font-semibold text-gray-800 flex items-center">
                  <i class="i-carbon-gift mr-2 text-yellow-700"></i>
                  礼包/互动礼
                </h4>
                <el-button type="primary" size="small" @click="addGift">
                  <i class="i-carbon-add mr-1"></i>
                  新增
                </el-button>
              </div>
              <div v-if="form.exhibitionGifts && form.exhibitionGifts.length" class="space-y-3">
                <div v-for="(g, gIdx) in form.exhibitionGifts" :key="gIdx" class="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                    <div class="flex items-center">
                      <span class="w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-xs font-semibold mr-2">{{ gIdx + 1 }}</span>
                      <span class="text-sm font-medium text-gray-900">礼包信息</span>
                    </div>
                    <el-button type="danger" link @click="removeGift(gIdx)" size="small">
                      <i class="i-carbon-trash-can"></i>
                    </el-button>
                  </div>
                  <div class="p-4 space-y-3">
                    <el-form-item label="礼包名称">
                      <el-input v-model="form.exhibitionGifts![gIdx].giftName" placeholder="礼包名称" />
                    </el-form-item>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">礼包图片</label>
                      <div class="border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-yellow-400 transition-colors">
                        <el-upload
                          :file-list="getGiftImageFileList(gIdx)"
                          list-type="picture-card"
                          :auto-upload="false"
                          :show-file-list="true"
                          :limit="1"
                          :multiple="false"
                          accept="image/*"
                          :on-change="(file) => onGiftImageChange(gIdx, file)"
                          :on-remove="() => onGiftImageRemove(gIdx)"
                        >
                          <div class="flex flex-col items-center justify-center py-2">
                            <i class="i-carbon-add text-lg text-gray-400 mb-1"></i>
                            <span class="text-xs text-gray-500">礼包图</span>
                          </div>
                        </el-upload>
                      </div>
                    </div>
                    <el-form-item label="库存/数量">
                      <el-input v-model="form.exhibitionGifts![gIdx].giftStock" placeholder="先到先得/限量100" />
                    </el-form-item>
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <label class="block text-sm font-medium text-gray-700">礼包描述</label>
                        <el-button size="small" type="primary" @click="addGiftDescription(gIdx)">
                          <i class="i-carbon-add mr-1"></i>
                          新增描述
                        </el-button>
                      </div>
                      <div v-if="form.exhibitionGifts![gIdx].giftDescription && form.exhibitionGifts![gIdx].giftDescription!.length" class="space-y-2">
                        <div v-for="(d, dIdx) in form.exhibitionGifts![gIdx].giftDescription" :key="dIdx" class="flex items-center gap-2">
                          <el-input v-model="form.exhibitionGifts![gIdx].giftDescription![dIdx]" placeholder="输入一条描述" />
                          <el-button type="danger" link size="small" @click="removeGiftDescription(gIdx, dIdx)">
                            <i class="i-carbon-trash-can"></i>
                          </el-button>
                        </div>
                      </div>
                      <div v-else class="text-gray-500 text-xs">暂无描述，点击“新增描述”添加</div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4 text-gray-500 text-xs">暂无礼包信息</div>
            </div>

            <!-- 展会活动区域（移动端） -->
            <div class="bg-orange-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-base font-semibold text-gray-800 flex items-center">
                  <i class="i-carbon-calendar mr-2 text-orange-600"></i>
                  活动
                </h4>
                <el-button type="primary" size="small" @click="addActivity">
                  <i class="i-carbon-add mr-1"></i>
                  新增
                </el-button>
              </div>
              <div v-if="form.exhibitionActivities && form.exhibitionActivities.length" class="space-y-3">
                <div v-for="(a, aIdx) in form.exhibitionActivities" :key="aIdx" class="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                    <div class="flex items-center">
                      <span class="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-semibold mr-2">{{ aIdx + 1 }}</span>
                      <span class="text-sm font-medium text-gray-900">活动信息</span>
                    </div>
                    <el-button type="danger" link @click="removeActivity(aIdx)" size="small">
                      <i class="i-carbon-trash-can"></i>
                    </el-button>
                  </div>
                  <div class="p-4 space-y-3">
                    <el-form-item label="类型">
                      <el-input v-model="form.exhibitionActivities![aIdx].type" placeholder="如：raffle" />
                    </el-form-item>
                    <el-form-item label="标题">
                      <el-input v-model="form.exhibitionActivities![aIdx].title" placeholder="标题" />
                    </el-form-item>
                    <el-form-item label="描述">
                      <el-input type="textarea" :rows="2" v-model="form.exhibitionActivities![aIdx].description" placeholder="描述" />
                    </el-form-item>
                    <div class="grid grid-cols-2 gap-2">
                      <el-form-item label="开始">
                        <el-input v-model="(form.exhibitionActivities![aIdx].schedule as any).startAt" placeholder="YYYY-MM-DD" />
                      </el-form-item>
                      <el-form-item label="结束">
                        <el-input v-model="(form.exhibitionActivities![aIdx].schedule as any).endAt" placeholder="YYYY-MM-DD" />
                      </el-form-item>
                    </div>
                    <el-form-item label="位置">
                      <el-input v-model="form.exhibitionActivities![aIdx].location" placeholder="如：A6" />
                    </el-form-item>
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <label class="block text-sm font-medium text-gray-700">参与条件</label>
                        <el-button size="small" type="primary" @click="addEligibility(aIdx)">
                          <i class="i-carbon-add mr-1"></i>
                          新增条件
                        </el-button>
                      </div>
                      <div v-if="form.exhibitionActivities![aIdx].eligibility && form.exhibitionActivities![aIdx].eligibility!.length" class="space-y-2">
                        <div v-for="(e, eIdx) in form.exhibitionActivities![aIdx].eligibility" :key="eIdx" class="flex items-center gap-2">
                          <el-input v-model="form.exhibitionActivities![aIdx].eligibility![eIdx]" placeholder="输入条件" />
                          <el-button type="danger" link size="small" @click="removeEligibility(aIdx, eIdx)">
                            <i class="i-carbon-trash-can"></i>
                          </el-button>
                        </div>
                      </div>
                      <div v-else class="text-gray-500 text-xs">暂无条件，点击“新增条件”添加</div>
                    </div>
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <label class="block text-sm font-medium text-gray-700">奖品</label>
                        <el-button size="small" type="primary" @click="addPrize(aIdx)">
                          <i class="i-carbon-add mr-1"></i>
                          新增奖品
                        </el-button>
                      </div>
                      <div v-if="form.exhibitionActivities![aIdx].prizes && form.exhibitionActivities![aIdx].prizes!.length" class="space-y-2">
                        <div v-for="(p, pIdx) in form.exhibitionActivities![aIdx].prizes" :key="pIdx" class="bg-gray-50 rounded-md border border-gray-200 p-3">
                          <div class="grid grid-cols-2 gap-2 items-start">
                            <el-form-item label="名称" class="mb-0">
                              <el-input v-model="form.exhibitionActivities![aIdx].prizes![pIdx].name" placeholder="奖品名称" />
                            </el-form-item>
                            <el-form-item label="数量" class="mb-0">
                              <el-input v-model="(form.exhibitionActivities![aIdx].prizes![pIdx] as any).quantity" placeholder="1/若干" />
                            </el-form-item>
                            <div class="col-span-2">
                              <label class="block text-sm font-medium text-gray-700 mb-1">奖品图片</label>
                              <el-upload
                                :file-list="getPrizeImageFileList(aIdx, pIdx)"
                                list-type="picture-card"
                                :auto-upload="false"
                                :show-file-list="true"
                                :limit="1"
                                :multiple="false"
                                accept="image/*"
                                :on-change="(file) => onPrizeImageChange(aIdx, pIdx, file)"
                                :on-remove="() => onPrizeImageRemove(aIdx, pIdx)"
                              >
                                <div class="flex flex-col items-center justify-center py-2">
                                  <i class="i-carbon-add text-lg text-gray-400 mb-1"></i>
                                  <span class="text-xs text-gray-500">奖品图</span>
                                </div>
                              </el-upload>
                            </div>
                          </div>
                          <div class="text-right mt-1">
                            <el-button type="danger" link size="small" @click="removePrize(aIdx, pIdx)">
                              <i class="i-carbon-trash-can mr-1"></i>
                              删除
                            </el-button>
                          </div>
                        </div>
                      </div>
                      <div v-else class="text-gray-500 text-xs">暂无奖品</div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4 text-gray-500 text-xs">暂无活动信息</div>
            </div>

            <!-- 体验区域（移动端） -->
            <div class="bg-teal-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-base font-semibold text-gray-800 flex items-center">
                  <i class="i-carbon-user mr-2 text-teal-700"></i>
                  体验
                </h4>
                <el-button type="primary" size="small" @click="addExperience">
                  <i class="i-carbon-add mr-1"></i>
                  新增
                </el-button>
              </div>
              <div v-if="form.exhibitionExperience && form.exhibitionExperience.length" class="space-y-3">
                <div v-for="(ex, exIdx) in form.exhibitionExperience" :key="exIdx" class="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                    <div class="flex items-center">
                      <span class="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-semibold mr-2">{{ exIdx + 1 }}</span>
                      <span class="text-sm font-medium text-gray-900">体验信息</span>
                    </div>
                    <el-button type="danger" link @click="removeExperience(exIdx)" size="small">
                      <i class="i-carbon-trash-can"></i>
                    </el-button>
                  </div>
                  <div class="p-4 space-y-3">
                    <el-form-item label="体验名称">
                      <el-input v-model="form.exhibitionExperience![exIdx].experienceName" placeholder="体验名称" />
                    </el-form-item>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">体验图片</label>
                      <div class="border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-teal-400 transition-colors">
                        <el-upload
                          :file-list="getExperienceImageFileList(exIdx)"
                          list-type="picture-card"
                          :auto-upload="false"
                          :show-file-list="true"
                          :limit="1"
                          :multiple="false"
                          accept="image/*"
                          :on-change="(file) => onExperienceImageChange(exIdx, file)"
                          :on-remove="() => onExperienceImageRemove(exIdx)"
                        >
                          <div class="flex flex-col items-center justify-center py-2">
                            <i class="i-carbon-add text-lg text-gray-400 mb-1"></i>
                            <span class="text-xs text-gray-500">体验图</span>
                          </div>
                        </el-upload>
                      </div>
                    </div>
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <label class="block text-sm font-medium text-gray-700">体验描述</label>
                        <el-button size="small" type="primary" @click="addExperienceDescription(exIdx)">
                          <i class="i-carbon-add mr-1"></i>
                          新增描述
                        </el-button>
                      </div>
                      <div v-if="form.exhibitionExperience![exIdx].experienceDescription && form.exhibitionExperience![exIdx].experienceDescription!.length" class="space-y-2">
                        <div v-for="(d, dIdx) in form.exhibitionExperience![exIdx].experienceDescription" :key="dIdx" class="flex items-center gap-2">
                          <el-input v-model="form.exhibitionExperience![exIdx].experienceDescription![dIdx]" placeholder="输入一条描述" />
                          <el-button type="danger" link size="small" @click="removeExperienceDescription(exIdx, dIdx)">
                            <i class="i-carbon-trash-can"></i>
                          </el-button>
                        </div>
                      </div>
                      <div v-else class="text-gray-500 text-xs">暂无描述</div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4 text-gray-500 text-xs">暂无体验信息</div>
            </div>

            <!-- 展位产品区域 -->
            <div class="bg-green-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-base font-semibold text-gray-800 flex items-center">
                  <i class="i-carbon-shopping-cart mr-2 text-green-600"></i>
                  展位产品
                </h4>
                <el-button type="primary" @click="addProduct" size="default">
                  <i class="i-carbon-add mr-1"></i>
                  新增
                </el-button>
              </div>

              <div v-if="form.exhibitionProducts && form.exhibitionProducts.length" class="space-y-3">
                <div v-for="(p, rIdx) in reversedExhibitionProducts" :key="rIdx" class="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                    <div class="flex items-center">
                      <span class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-semibold mr-2">
                        {{ getOriginalIndex(rIdx) + 1 }}
                      </span>
                      <span class="text-sm font-medium text-gray-900">产品信息</span>
                    </div>
                    <el-button type="danger" link @click="removeProduct(getOriginalIndex(rIdx))" size="small">
                      <i class="i-carbon-trash-can"></i>
                    </el-button>
                  </div>
                  <div class="p-4 space-y-4">
                    <el-form-item label="产品名称">
                      <el-input v-model="form.exhibitionProducts![getOriginalIndex(rIdx)].productName" placeholder="请输入产品名称" />
                    </el-form-item>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">产品图片</label>
                      <div class="border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-green-400 transition-colors">
                        <el-upload
                          :file-list="getProductImageFileList(getOriginalIndex(rIdx))"
                          list-type="picture-card"
                          :auto-upload="false"
                          :show-file-list="true"
                          :limit="1"
                          :multiple="false"
                          accept="image/*"
                          :on-change="(file) => onProductImageChange(getOriginalIndex(rIdx), file)"
                          :on-remove="() => onProductImageRemove(getOriginalIndex(rIdx))"
                          class="product-image-upload"
                        >
                          <div class="flex flex-col items-center justify-center py-2">
                            <i class="i-carbon-add text-lg text-gray-400 mb-1"></i>
                            <span class="text-xs text-gray-500">产品图</span>
                          </div>
                        </el-upload>
                      </div>
                    </div>
                    <el-form-item label="产品描述">
                      <el-input v-model="form.exhibitionProducts![getOriginalIndex(rIdx)].productDescription" placeholder="请输入产品的详细描述" show-word-limit maxlength="200" />
                    </el-form-item>
                    <div class="grid grid-cols-2 gap-3">
                      <el-form-item label="价格">
                        <el-input v-model="form.exhibitionProducts![getOriginalIndex(rIdx)].productPrice" placeholder="199">
                          <template #append>元</template>
                        </el-input>
                      </el-form-item>
                      <el-form-item label="库存">
                        <el-input v-model="form.exhibitionProducts![getOriginalIndex(rIdx)].productStock" placeholder="50">
                          <template #append>件</template>
                        </el-input>
                      </el-form-item>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-6">
                <div class="text-gray-400 mb-2">
                  <i class="i-carbon-shopping-cart text-3xl"></i>
                </div>
                <p class="text-gray-500 text-sm">暂无产品信息</p>
                <p class="text-gray-400 text-xs">点击上方"新增"按钮开始添加</p>
              </div>
            </div>

            <!-- 相关文章区域 -->
            <div class="bg-purple-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-base font-semibold text-gray-800 flex items-center">
                  <i class="i-carbon-document mr-2 text-purple-600"></i>
                  相关文章
                </h4>
                <el-button type="primary" @click="addArticle" size="default">
                  <i class="i-carbon-add mr-1"></i>
                  新增
                </el-button>
              </div>

              <div v-if="form.relatedArticles && form.relatedArticles.length" class="space-y-3">
                <div v-for="(a, rIdx) in reversedRelatedArticles" :key="rIdx" class="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                    <div class="flex items-center">
                      <span class="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold mr-2">
                        {{ getOriginalArticleIndex(rIdx) + 1 }}
                      </span>
                      <span class="text-sm font-medium text-gray-900">文章链接</span>
                    </div>
                    <el-button type="danger" link @click="removeArticle(getOriginalArticleIndex(rIdx))" size="small">
                      <i class="i-carbon-trash-can"></i>
                    </el-button>
                  </div>
                  <div class="p-4 space-y-4">
                    <el-form-item label="文章标题">
                      <el-input v-model="form.relatedArticles![getOriginalArticleIndex(rIdx)].title" placeholder="请输入文章标题" />
                    </el-form-item>
                    <el-form-item label="文章链接">
                      <el-input v-model="form.relatedArticles![getOriginalArticleIndex(rIdx)].link" placeholder="https://...">
                        <template #prepend>
                          <i class="i-carbon-link text-gray-500"></i>
                        </template>
                      </el-input>
                    </el-form-item>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-6">
                <div class="text-gray-400 mb-2">
                  <i class="i-carbon-document text-3xl"></i>
                </div>
                <p class="text-gray-500 text-sm">暂无相关文章</p>
                <p class="text-gray-400 text-xs">点击上方"新增"按钮开始添加</p>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <el-button @click="close" size="large">取消</el-button>
              <el-button type="primary" @click="onSubmit" size="large">
                <i class="i-carbon-checkmark mr-1"></i>
                保存
              </el-button>
            </div>
          </div>
        </el-form>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* 卡片优化 */
.bg-gray-50,
.bg-green-50,
.bg-purple-50 {
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.bg-gradient-to-br {
  border: 1px solid rgba(59, 130, 246, 0.1);
}

/* 滚动条优化 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 上传列表优化 */
:deep(.el-upload-list--picture-card) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

:deep(.el-upload-list__item) {
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  margin: 0;
}

/* 响应式优化 */
@media (max-width: 640px) {
  .grid.grid-cols-2 {
    grid-template-columns: 1fr;
  }

  .lg\\:col-span-2 {
    grid-column: span 1;
  }

  .lg\\:col-span-3 {
    grid-column: span 1;
  }
}

/* 动画效果 */
.shadow-sm {
  transition: box-shadow 0.2s ease;
}

.hover\\:shadow-md:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* 空状态优化 */
.text-center i {
  display: block;
  margin: 0 auto;
}
</style>
