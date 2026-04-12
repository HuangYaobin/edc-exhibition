<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useExhibitionStore } from '@/store'

type BrandLookup = {
  name: string
  exhibitionNumber?: string
  logo?: string
}

// Optional: enrich favorite brands with booth numbers if available
const brandIndex = ref<Record<string, BrandLookup>>({})
type ExhibitionBrand = {
  name: string
  exhibitionNumber: string
  exhibitionProducts?: Array<{
    productName: string
    productImage?: string
    productDescription?: string
    productPrice?: string
    productStock?: string
  }>
}
const boothIndex = ref<Record<string, ExhibitionBrand>>({})
type ProductInfo = {
  productName: string
  productImage?: string
  productDescription?: string
  productPrice?: string
  productStock?: string
}
const productIndex = ref<Record<string, ProductInfo>>({})
onMounted(async () => {
  try {
    const { brands } = await import('@/mockData')
    const data = brands as ExhibitionBrand[]
    brandIndex.value = data.reduce<Record<string, BrandLookup>>((acc, b) => {
      acc[b.name] = { name: b.name, exhibitionNumber: (b as any).exhibitionNumber, logo: (b as any).logo }
      return acc
    }, {})
    boothIndex.value = data.reduce<Record<string, ExhibitionBrand>>((acc, b) => {
      if (b.exhibitionNumber) acc[b.exhibitionNumber] = b
      return acc
    }, {})
    // Build product index by booth + product name
    const nextProductIndex: Record<string, ProductInfo> = {}
    data.forEach((b) => {
      if (Array.isArray(b.exhibitionProducts)) {
        b.exhibitionProducts.forEach((p) => {
          const key = `${b.exhibitionNumber}__${b.name}__${p.productName}`
          nextProductIndex[key] = p
        })
      }
    })
    productIndex.value = nextProductIndex
  } catch {
    // noop
  }
})

const exhibitionStore = useExhibitionStore()
const isOpen = ref(false)

const favoriteBrands = computed(() => exhibitionStore.favoriteBrands)
const intentionProducts = computed(() => exhibitionStore.intentionProducts)
const isBrandCheckedIn = (name: string) => exhibitionStore.isBrandCheckedIn(name)

const toggleOpen = () => (isOpen.value = !isOpen.value)

const handleUnfavoriteBrand = (name: string) => {
  const message = `确认取消收藏品牌：${name}？`
  if (typeof window === 'undefined' || window.confirm(message)) {
    exhibitionStore.toggleFavoriteBrand(name)
  }
}

const handleRemoveIntention = (boothNumber: string, productName: string) => {
  const message = `确认取消该意向：${productName}（展位 ${boothNumber}）？`
  if (typeof window === 'undefined' || window.confirm(message)) {
    exhibitionStore.removeIntentionProduct(boothNumber, productName)
  }
}

// Resolve intention product meta from event-map data (fallback to stored item values)
const resolveProduct = (item: { boothNumber: string; brandName: string; productName: string; productImage?: string }) => {
  const key = `${item.boothNumber}__${item.brandName}__${item.productName}`
  const meta = productIndex.value[key]

  return {
    image: item.productImage || meta?.productImage || '',
    description: meta?.productDescription || '',
    price: meta?.productPrice || '',
    stock: meta?.productStock || '',
  }
}

// Allow external control of visibility while keeping backward compatibility
const props = defineProps<{ visible?: boolean }>()

// Emit open booth event and v-model style visible updates
const emit = defineEmits<{
  (e: 'open-booth', payload: { boothNumber: string; brandName?: string }): void
  (e: 'update:visible', value: boolean): void
}>()

const openBoothByBrandName = (name: string) => {
  const booth = brandIndex.value[name]?.exhibitionNumber || ''
  emit('open-booth', { boothNumber: booth, brandName: name })
}

const getBrandBooth = (name: string) => brandIndex.value[name]?.exhibitionNumber
const getBrandLogo = (name: string) => brandIndex.value[name]?.logo

// Sync internal open state with external prop
watch(
  () => props.visible,
  (v) => {
    if (typeof v === 'boolean') isOpen.value = v
  },
  { immediate: true }
)

watch(isOpen, (v) => emit('update:visible', v))

// Filters & search (independent per tab)
const searchQueryBrands = ref('')
const searchQueryIntentions = ref('')
const selectedZonesBrands = ref<Set<string>>(new Set())
const selectedZonesIntentions = ref<Set<string>>(new Set())
const showOnlyChecked = ref(false)
const activeTab = ref<'brands' | 'intentions'>('brands')

const getZoneFromBooth = (booth?: string) => {
  const match = (booth || '').match(/^([A-Za-z]+)(\d+)?/)
  return match ? match[1].toUpperCase() : ''
}

const allZonesBrands = computed<string[]>(() => {
  const zones = new Set<string>()
  favoriteBrands.value.forEach((name) => {
    const booth = getBrandBooth(name)
    if (booth) zones.add(getZoneFromBooth(booth))
  })
  return Array.from(zones)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
})

const allZonesIntentions = computed<string[]>(() => {
  const zones = new Set<string>()
  intentionProducts.value.forEach((p) => zones.add(getZoneFromBooth(p.boothNumber)))
  return Array.from(zones)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
})

const toggleZoneBrands = (zone: string) => {
  const next = new Set(selectedZonesBrands.value)
  if (next.has(zone)) next.delete(zone)
  else next.add(zone)
  selectedZonesBrands.value = next
}

const toggleZoneIntentions = (zone: string) => {
  const next = new Set(selectedZonesIntentions.value)
  if (next.has(zone)) next.delete(zone)
  else next.add(zone)
  selectedZonesIntentions.value = next
}

function compareBooth(a: string, b: string) {
  if (a === '未分配') return 1
  if (b === '未分配') return -1
  const pa = a.match(/^([A-Za-z]+)(\d+)/)
  const pb = b.match(/^([A-Za-z]+)(\d+)/)
  if (pa && pb) {
    const la = pa[1].toUpperCase()
    const lb = pb[1].toUpperCase()
    if (la !== lb) return la.localeCompare(lb)
    return Number(pa[2]) - Number(pb[2])
  }
  return a.localeCompare(b)
}

type FavoriteBrandItem = { name: string; boothNumber?: string; logo?: string }
const groupedFavoriteBrands = computed(() => {
  const groups: Record<string, FavoriteBrandItem[]> = {}
  const q = searchQueryBrands.value.trim().toLowerCase()
  const zones = selectedZonesBrands.value

  favoriteBrands.value.forEach((name) => {
    const booth = getBrandBooth(name) || ''
    const zone = getZoneFromBooth(booth)
    if (zones.size > 0 && (!zone || !zones.has(zone))) return

    if (q) {
      const haystack = `${name} ${booth}`.toLowerCase()
      if (!haystack.includes(q)) return
    }

    if (showOnlyChecked.value && !isBrandCheckedIn(name)) return

    const key = booth || '未分配'
    if (!groups[key]) groups[key] = []
    groups[key].push({ name, boothNumber: booth, logo: getBrandLogo(name) })
  })

  const sortedBooths = Object.keys(groups).sort(compareBooth)
  return sortedBooths.map((boothNumber) => ({
    boothNumber,
    items: groups[boothNumber].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')),
  }))
})

type IntentionItemView = {
  boothNumber: string
  brandName: string
  productName: string
  image?: string
  description?: string
  price?: string
  stock?: string
}

const groupedIntentionProducts = computed(() => {
  const q = searchQueryIntentions.value.trim().toLowerCase()
  const zones = selectedZonesIntentions.value
  const boothGroups: Record<string, Record<string, IntentionItemView[]>> = {}

  intentionProducts.value.forEach((item) => {
    const meta = resolveProduct(item)
    const zone = getZoneFromBooth(item.boothNumber)
    if (zones.size > 0 && (!zone || !zones.has(zone))) return

    if (q) {
      const haystack = `${item.productName} ${item.brandName} ${item.boothNumber} ${meta.description || ''}`.toLowerCase()
      if (!haystack.includes(q)) return
    }

    if (!boothGroups[item.boothNumber]) boothGroups[item.boothNumber] = {}
    const brandMap = boothGroups[item.boothNumber]
    if (!brandMap[item.brandName]) brandMap[item.brandName] = []
    brandMap[item.brandName].push({
      boothNumber: item.boothNumber,
      brandName: item.brandName,
      productName: item.productName,
      image: meta.image,
      description: meta.description,
      price: meta.price,
      stock: meta.stock,
    })
  })

  const boothsSorted = Object.keys(boothGroups).sort(compareBooth)
  return boothsSorted.map((boothNumber) => {
    const brandMap = boothGroups[boothNumber]
    const brandsSorted = Object.keys(brandMap).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
    return {
      boothNumber,
      brands: brandsSorted.map((brandName) => ({
        brandName,
        items: brandMap[brandName].sort((a, b) => a.productName.localeCompare(b.productName, 'zh-Hans-CN')),
      })),
    }
  })
})
</script>

<template>
  <!-- Content only - Modal wrapper is handled by parent -->
  <div class="space-y-4">
    <!-- Tabs -->
    <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
      <button class="px-3 py-1.5 rounded-md text-sm border transition-colors cursor-pointer"
        :class="activeTab === 'brands' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'"
        @click="activeTab = 'brands'" aria-label="收藏的品牌" :aria-pressed="activeTab === 'brands'">
        收藏的品牌
        <span class="ml-1 text-xs opacity-80">({{ favoriteBrands.length }})</span>
      </button>
      <button class="px-3 py-1.5 rounded-md text-sm border transition-colors cursor-pointer"
        :class="activeTab === 'intentions' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'"
        @click="activeTab = 'intentions'" aria-label="意向产品" :aria-pressed="activeTab === 'intentions'">
        意向产品
        <span class="ml-1 text-xs opacity-80">({{ intentionProducts.length }})</span>
      </button>
    </div>

    <!-- Filters: independent per tab -->
    <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-3">
      <!-- Brands filters -->
      <div v-show="activeTab === 'brands'" class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 flex-1 min-w-[220px]">
          <i class="i-carbon-search text-gray-500"></i>
          <input v-model="searchQueryBrands" type="text" class="w-full bg-transparent outline-none text-sm"
            placeholder="搜索品牌/展位…" aria-label="搜索收藏品牌" />
        </div>
        <div class="flex items-center flex-wrap gap-1 min-h-[28px]">
          <button v-for="z in allZonesBrands" :key="z" class="px-2 py-0.5 rounded text-xs border transition-colors"
            :class="selectedZonesBrands.has(z) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'"
            @click="toggleZoneBrands(z)">
            {{ z }}
          </button>
          <button class="px-2 py-0.5 rounded text-xs text-gray-500 underline disabled:opacity-40"
            :disabled="!selectedZonesBrands.size" @click="selectedZonesBrands = new Set()">清空区域</button>
        </div>
        <div class="flex items-center gap-3 text-xs text-gray-600">
          <button class="px-2 py-0.5 rounded text-xs border transition-colors"
            :class="showOnlyChecked ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'"
            @click="showOnlyChecked = !showOnlyChecked">
            只看已打卡
          </button>
        </div>
      </div>

      <!-- Intentions filters -->
      <div v-show="activeTab === 'intentions'" class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 flex-1 min-w-[220px]">
          <i class="i-carbon-search text-gray-500"></i>
          <input v-model="searchQueryIntentions" type="text" class="w-full bg-transparent outline-none text-sm"
            placeholder="搜索产品/品牌/展位…" aria-label="搜索意向产品" />
        </div>
        <div class="flex items-center flex-wrap gap-1 min-h-[28px]">
          <button v-for="z in allZonesIntentions" :key="z" class="px-2 py-0.5 rounded text-xs border transition-colors"
            :class="selectedZonesIntentions.has(z) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'"
            @click="toggleZoneIntentions(z)">
            {{ z }}
          </button>
          <button class="px-2 py-0.5 rounded text-xs text-gray-500 underline disabled:opacity-40"
            :disabled="!selectedZonesIntentions.size" @click="selectedZonesIntentions = new Set()">
            清空区域
          </button>
        </div>
      </div>
    </div>

    <div>
      <!-- Favorite brands -->
      <div v-show="activeTab === 'brands'" class="p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <i class="i-carbon-star text-yellow-600"></i>
            <span class="font-medium">收藏的品牌</span>
            <span class="text-xs text-gray-500">{{ groupedFavoriteBrands.length }}</span>
          </div>
        </div>
        <div class="min-h-[160px] h-[calc(80vh-180px)] overflow-y-auto">
          <div v-if="groupedFavoriteBrands.length === 0" class="text-sm text-gray-500">暂无匹配结果</div>
          <div v-else class="space-y-3">
            <div v-for="group in groupedFavoriteBrands" :key="group.boothNumber"
              class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40">
              <div
                class="px-2 py-1.5 bg-gray-50 dark:bg-gray-800/60 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <div class="inline-flex items-center gap-1">
                  <i class="i-carbon-location"></i>
                  <span>{{ group.boothNumber }}</span>
                </div>
                <span class="text-[11px] text-gray-500">{{ group.items.length }}</span>
              </div>
              <ul class="divide-y divide-gray-200 dark:divide-gray-700">
                <li v-for="b in group.items" :key="b.name" :class="[
                  'flex items-center justify-between cursor-pointer transition-colors',
                  isBrandCheckedIn(b.name) ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700',
                ]" @click="openBoothByBrandName(b.name)">
                  <!-- Left-most: check-in toggle -->
                  <div class="pl-2 pr-1">
                    <button
                      class="inline-flex items-center justify-center w-7 h-7 rounded-full border transition-colors transition-transform duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 dark:focus:ring-offset-0"
                      :class="isBrandCheckedIn(b.name)
                          ? 'bg-green-600 text-white border-green-600 hover:bg-green-700 active:scale-95'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:text-gray-700 active:scale-95'
                        " @click.stop="exhibitionStore.toggleCheckedInBrand(b.name)"
                      :title="isBrandCheckedIn(b.name) ? '取消打卡' : '标记已打卡'"
                      :aria-label="isBrandCheckedIn(b.name) ? '取消打卡' : '标记已打卡'"
                      :aria-pressed="isBrandCheckedIn(b.name)">
                      <i class="i-carbon-checkmark text-base"
                        :class="isBrandCheckedIn(b.name) ? 'opacity-100' : 'opacity-0'"></i>
                    </button>
                  </div>

                  <div class="flex flex-1 items-center gap-3 min-w-0 p-2">
                    <el-image v-if="b.logo" :src="b.logo" alt="" class="w-8 h-8 rounded object-contain" fit="contain">
                      <template #error>
                        <div class="w-8 h-8 rounded bg-gray-100"></div>
                      </template>
                    </el-image>
                    <div class="min-w-0">
                      <div class="text-sm font-medium truncate">{{ b.name }}</div>
                    </div>
                  </div>
                  <div class="relative flex items-center gap-2 px-4 self-stretch">
                    <span v-if="isBrandCheckedIn(b.name)"
                      class="inline-flex items-center text-[11px] px-1.5 py-0.5 rounded bg-green-100 text-green-800 border border-green-200">
                      <i class="i-carbon-checkmark-filled mr-1"></i>已打卡
                    </span>
                  </div>
                  <div class="flex items-center gap-1 pr-2">
                    <button class="flex text-gray-500 hover:text-gray-700 cursor-pointer"
                      @click.stop="handleUnfavoriteBrand(b.name)" title="取消收藏" aria-label="取消收藏">
                      <i class="i-carbon-close"></i>
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Intention products -->
      <div v-show="activeTab === 'intentions'" class="p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <i class="i-carbon-favorite text-rose-500"></i>
            <span class="font-medium">意向产品</span>
            <span class="text-xs text-gray-500">{{ intentionProducts.length }}</span>
          </div>
        </div>
        <div class="min-h-[160px] h-[calc(80vh-180px)] overflow-y-auto">
          <div v-if="groupedIntentionProducts.length === 0" class="text-sm text-gray-500">暂无匹配结果</div>
          <div v-else class="space-y-3">
            <div v-for="booth in groupedIntentionProducts" :key="booth.boothNumber"
              class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40">
              <div
                class="px-2 py-1.5 bg-gray-50 dark:bg-gray-800/60 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <div class="inline-flex items-center gap-1">
                  <i class="i-carbon-location"></i><span>{{ booth.boothNumber }}</span>
                </div>
                <span class="text-[11px] text-gray-500">{{booth.brands.reduce((sum, b) => sum + b.items.length, 0)
                  }}</span>
              </div>
              <div class="divide-y divide-gray-200 dark:divide-gray-700">
                <div v-for="brand in booth.brands" :key="brand.brandName" class="p-2">
                  <div class="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    {{ brand.brandName }}
                    <span class="text-[11px] text-gray-400">({{ brand.items.length }})</span>
                  </div>
                  <ul class="space-y-2">
                    <li v-for="item in brand.items" :key="item.boothNumber + '_' + item.productName" :class="[
                      'relative flex items-center p-2 pl-0 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                      exhibitionStore.isIntentionObtained(item.boothNumber, item.productName) ? 'bg-emerald-50 dark:bg-emerald-900/20' : '',
                    ]">
                      <!-- Left-most: obtained toggle -->
                      <div class="pl-1 pr-1">
                        <button
                          class="inline-flex items-center justify-center w-7 h-7 rounded-full border transition-colors transition-transform duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 dark:focus:ring-offset-0"
                          :class="exhibitionStore.isIntentionObtained(item.boothNumber, item.productName)
                              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 active:scale-95'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:text-gray-700 active:scale-95'
                            " @click.stop="exhibitionStore.toggleIntentionObtained(item.boothNumber, item.productName)"
                          :title="exhibitionStore.isIntentionObtained(item.boothNumber, item.productName) ? '取消已获得' : '标记已获得'"
                          :aria-label="exhibitionStore.isIntentionObtained(item.boothNumber, item.productName) ? '取消已获得' : '标记已获得'"
                          :aria-pressed="exhibitionStore.isIntentionObtained(item.boothNumber, item.productName)">
                          <i class="i-carbon-checkmark text-base"
                            :class="exhibitionStore.isIntentionObtained(item.boothNumber, item.productName) ? 'opacity-100' : 'opacity-0'"></i>
                        </button>
                      </div>

                      <div class="flex gap-3 min-w-0 flex-1">
                        <div v-if="item.image" class="relative flex-1 min-w-150px max-w-150px">
                          <el-image :src="item.image" alt=""
                            class="h-full rounded object-cover border border-gray-200 dark:border-gray-700" fit="cover"
                            lazy>
                            <template #error>
                              <div class="w-full h-full rounded bg-gray-100"></div>
                            </template>
                          </el-image>
                          <span v-if="exhibitionStore.isIntentionObtained(item.boothNumber, item.productName)"
                            class="absolute bottom-1 left-1 inline-flex items-center text-[11px] px-1.5 py-0.5 rounded bg-emerald-100/95 text-emerald-800 border border-emerald-200 shadow select-none pointer-events-none">
                            <i class="i-carbon-checkmark-filled mr-1"></i>已获得
                          </span>
                        </div>
                        <div class="flex-[1.8] min-w-0 flex flex-col gap-2">
                          <div class="flex items-center gap-2 min-w-0">
                            <div class="text-sm font-medium truncate">{{ item.productName }}</div>
                            <div
                              class="text-xs text-gray-500 truncate border-l border-gray-200 dark:border-gray-700 pl-2">
                              {{
                              item.brandName }}</div>
                          </div>
                          <div v-if="item.description" class="text-xs text-gray-500 flex-1">
                            {{ item.description }}
                          </div>
                          <div class="flex items-center gap-2" v-if="item.price || item.stock">
                            <span v-if="item.price"
                              class="inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 dark:bg-green-900/20 dark:text-purple-300 dark:border-purple-800 font-mono">
                              ￥{{ item.price }}
                            </span>
                            <span v-else
                              class="inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                              免费
                            </span>
                            <span v-if="item.stock"
                              class="inline-flex items-center text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                              <i class="i-fluent-box-16-regular mr-1 text-sm" aria-hidden="true"></i>
                              {{ item.stock }}
                            </span>
                            <span
                              class="shrink-0 inline-flex items-center text-[11px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200"
                              :title="'展位 ' + item.boothNumber" aria-label="展位号">
                              <i class="i-carbon-location text-[13px] mr-0.5"></i>
                              {{ item.boothNumber }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="self-start flex items-center absolute top-2 right-2">
                        <button class="flex text-gray-500 hover:text-gray-700 cursor-pointer"
                          @click="handleRemoveIntention(item.boothNumber, item.productName)" title="取消意向"
                          aria-label="取消意向">
                          <i class="i-carbon-close"></i>
                        </button>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
