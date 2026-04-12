<script setup lang="ts">
import { reactive, computed } from 'vue'
import { format, parseISO, isAfter, isBefore } from 'date-fns'

type ActivityPrize = {
  name: string
  image?: string
  quantity?: number | string
}

type ActivitySchedule = {
  startAt?: string
  endAt?: string
  timezone?: string
}

export type ExhibitionActivity = {
  type?: string
  title: string
  description?: string
  schedule?: ActivitySchedule
  location?: string
  rules?: string[]
  prizes?: ActivityPrize[]
  eligibility?: string[]
}

const props = defineProps<{
  activities: ExhibitionActivity[]
}>()

// Custom viewer state for rich preview info
const viewer = reactive({ visible: false, activityIdx: -1, index: 0 })

const openViewer = (activityIdx: number, prizeIdx: number) => {
  viewer.activityIdx = activityIdx
  viewer.index = prizeIdx
  viewer.visible = true
}

const activePrizes = computed(() => {
  const prizes = props.activities?.[viewer.activityIdx]?.prizes || []
  return prizes.filter((p) => !!p.image)
})

const urlList = computed(() => activePrizes.value.map((p) => p.image as string))
const currentPrize = computed(() => activePrizes.value[viewer.index])
const onSwitch = (index: number) => (viewer.index = index)

const activityTypeLabel = (type?: string) => {
  switch ((type || '').toLowerCase()) {
    case 'raffle':
      return '抽奖'
    case 'workshop':
      return '工作坊'
    case 'flash-sale':
      return '秒杀'
    case 'talk':
      return '讲座'
    default:
      return '活动'
  }
}

const pickPattern = (s?: string) => {
  if (!s) return 'MM-dd'
  // If includes time portion (e.g., contains 'T' or ':') show time, else show date only
  return /[T\s]\d{2}:\d{2}/.test(s) || s.includes(':') ? 'MM-dd HH:mm' : 'MM-dd'
}

const formatRange = (schedule?: ActivitySchedule) => {
  if (!schedule || (!schedule.startAt && !schedule.endAt)) return ''
  try {
    const startPattern = pickPattern(schedule.startAt)
    const endPattern = pickPattern(schedule.endAt)
    const startStr = schedule.startAt ? format(parseISO(schedule.startAt), startPattern) : ''
    const endStr = schedule.endAt ? format(parseISO(schedule.endAt), endPattern) : ''
    const tz = schedule.timezone ? ` (${schedule.timezone})` : ''
    if (startStr && endStr) return `${startStr} - ${endStr}${tz}`
    return `${startStr || endStr}${tz}`
  } catch {
    return ''
  }
}

const getStatus = (schedule?: ActivitySchedule) => {
  if (!schedule || !schedule.startAt || !schedule.endAt) return { text: '进行中', color: 'bg-emerald-100 text-emerald-700' }
  try {
    const now = new Date()
    const start = parseISO(schedule.startAt)
    const end = parseISO(schedule.endAt)
    if (isBefore(now, start)) return { text: '未开始', color: 'bg-amber-100 text-amber-700' }
    if (isAfter(now, end)) return { text: '已结束', color: 'bg-gray-200 text-gray-600' }
    return { text: '进行中', color: 'bg-emerald-100 text-emerald-700' }
  } catch {
    return { text: '进行中', color: 'bg-emerald-100 text-emerald-700' }
  }
}

// Note: no extra computed helpers needed in this simplified layout

// Local image fallback removed in favor of ElImage error slot
</script>

<template>
  <div class="space-y-3">
    <div v-for="(activity, idx) in activities" :key="idx" class="bg-white rounded border border-gray-200">
      <div class="p-4 sm:p-5">
        <!-- Header: title first line -->
        <h4 class="text-base md:text-lg font-semibold text-slate-900 line-clamp-2">
          {{ activity.title }}
        </h4>

        <!-- Meta row: time first, then tags -->
        <div class="mt-2 flex items-center gap-2 flex-wrap">
          <div v-if="activity.schedule" class="flex items-center gap-1 text-xs md:text-sm text-slate-600">
            <i class="i-fluent-calendar-16-regular"></i>
            <span>{{ formatRange(activity.schedule) }}</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
              <i class="i-fluent-calendar-ltr-16-regular"></i>
              {{ activityTypeLabel(activity.type) }}
            </span>
            <span v-if="activity.location" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
              <i class="i-fluent-location-16-regular"></i>
              {{ activity.location }}
            </span>
            <span v-if="activity.schedule" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs" :class="getStatus(activity.schedule).color">
              <i class="i-fluent-clock-16-regular"></i>
              {{ getStatus(activity.schedule).text }}
            </span>
          </div>
        </div>

        <p v-if="activity.description" class="mt-2 text-xs md:text-sm text-slate-600">
          {{ activity.description }}
        </p>

        <!-- Eligibility -->
        <div v-if="activity.eligibility && activity.eligibility.length > 0" class="mt-4">
          <div class="bg-white rounded border border-gray-200 p-3">
            <div class="font-medium text-slate-800 mb-2 flex items-center gap-1">
              <i class="i-fluent-notepad-16-regular text-slate-600"></i>
              活动规则
            </div>
            <ul class="list-disc list-inside space-y-1 text-xs md:text-sm text-slate-700">
              <li v-for="(rule, ei) in activity.eligibility" :key="ei">{{ rule }}</li>
            </ul>
          </div>
        </div>

        <!-- Prizes -->
        <div v-if="activity.prizes && activity.prizes.length > 0" class="mt-4">
          <div class="font-medium text-slate-800 mb-2 flex items-center gap-1">
            <i class="i-fluent-gift-16-regular text-slate-600"></i>
            奖品
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="(prize, pi) in activity.prizes" :key="pi" class="bg-white rounded border border-gray-200 p-3 flex items-center gap-3">
              <div v-if="prize.image" class="w-16 h-16 rounded overflow-hidden border border-gray-200 shrink-0">
                <el-image class="w-full h-full object-cover cursor-zoom-in" :src="prize.image" :alt="prize.name" fit="cover" lazy @click="openViewer(idx, pi)">
                  <template #error>
                    <div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">加载失败</div>
                  </template>
                </el-image>
              </div>
              <div class="min-w-0">
                <div class="text-sm font-medium text-slate-900">{{ prize.name }}</div>
                <div v-if="prize.quantity !== undefined && prize.quantity !== ''" class="text-xs text-slate-600 mt-0.5">数量：{{ prize.quantity }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <el-image-viewer v-if="viewer.visible" :url-list="urlList" :initial-index="viewer.index" :z-index="600" teleported hide-on-click-modal @close="viewer.visible = false" @switch="onSwitch" />

  <div v-if="viewer.visible" class="fixed left-1/2 -translate-x-1/2 bottom-4 z-[601] px-3 py-2 rounded bg-black/60 text-white text-xs md:text-sm">
    <span class="font-medium">{{ currentPrize?.name }}</span>
    <span v-if="currentPrize?.quantity" class="opacity-80 ml-2">数量：{{ currentPrize?.quantity }}</span>
  </div>
</template>

<style scoped>
/* Image fallback handled by Element Plus */
</style>

<!-- Custom image viewer overlay merged into main template -->
