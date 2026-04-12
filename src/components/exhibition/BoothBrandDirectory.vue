<script setup lang="ts">
import { computed, ref } from 'vue'

// Load event-map brand data (static)
import { brandsByBooth } from '@/mockData'

type BrandItem = {
  name: string
  logo?: string
  exhibitionNumber: string
}

// Emit the same event payload as ExhibitionFavorites for consistency
const emit = defineEmits<{
  (e: 'open-booth', payload: { boothNumber: string; brandName?: string }): void
}>()

// Optional search/filter (minimal)
const query = ref('')

type ParsedBooth = { zone: string; num: number; raw: string }
function parseBooth(booth: string): ParsedBooth {
  const m = booth.match(/^([A-Za-z]+)(\d+)?$/)
  const zone = (m?.[1] || '').toUpperCase()
  const num = m?.[2] ? Number(m[2]) : Number.POSITIVE_INFINITY
  return { zone, num, raw: booth }
}

const zoneOrder = ['C', 'B', 'A']

type ZoneGroup = { zone: string; booths: Array<{ boothNumber: string; brands: BrandItem[]; sortNum: number }> }

const zoneGroups = computed<ZoneGroup[]>(() => {
  const q = query.value.trim().toLowerCase()
  const zoneMap: Record<string, ZoneGroup> = {}
  for (const booth of Object.keys(brandsByBooth)) {
    const parsed = parseBooth(booth)
    const brands = (brandsByBooth as Record<string, BrandItem[]>)[booth] || []
    const matches = !q || brands.some((b) => `${b.name} ${booth}`.toLowerCase().includes(q)) || booth.toLowerCase().includes(q)
    if (!matches) continue
    const key = parsed.zone
    if (!zoneMap[key]) zoneMap[key] = { zone: key, booths: [] }
    zoneMap[key].booths.push({ boothNumber: booth, brands, sortNum: parsed.num })
  }
  const result = Object.values(zoneMap)
  result.forEach((g) => g.booths.sort((a, b) => a.sortNum - b.sortNum))
  return result.sort((a, b) => {
    const ia = zoneOrder.indexOf(a.zone)
    const ib = zoneOrder.indexOf(b.zone)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.zone.localeCompare(b.zone)
  })
})

const open = (boothNumber: string, brandName: string) => {
  emit('open-booth', { boothNumber, brandName })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-sm">
        <i class="i-carbon-search text-gray-500"></i>
        <input v-model="query" type="text" class="bg-transparent outline-none" placeholder="搜索品牌/展位…" />
      </div>
    </div>

    <div class="space-y-6">
      <div v-for="zone in zoneGroups" :key="zone.zone" class="space-y-2">
        <div class="text-base font-semibold text-gray-800">{{ zone.zone }}区</div>
        <div class="md:columns-2 gap-6">
          <div v-for="booth in zone.booths" :key="booth.boothNumber" class="mb-2 break-inside-avoid">
            <div class="text-base">
              <span class="inline-flex items-center font-semibold mr-3">{{ booth.boothNumber }}</span>
              <template v-for="(b, idx) in booth.brands" :key="booth.boothNumber + '_' + b.name">
                <button
                  class="inline-flex items-center gap-2 text-base text-gray-900 hover:text-blue-600 cursor-pointer align-middle"
                  @click="open(booth.boothNumber, b.name)" :title="b.name" aria-label="打开品牌详情">
                  <el-image v-if="b.logo" :src="b.logo" alt="" class="w-6 h-6 rounded object-contain" fit="contain">
                    <template #error>
                      <div class="w-6 h-6 rounded bg-gray-100 border border-gray-200"></div>
                    </template>
                  </el-image>
                  <span>{{ b.name }}</span>
                </button>
                <span v-if="idx < booth.brands.length - 1" class="text-gray-400"> / </span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
