<script setup lang="ts">
import { ref, computed } from 'vue'
import ExhibitionMenuPicker from '@/components/exhibition/ExhibitionMenuPicker.vue'
import ExhibitionInfoModal from '@/components/exhibition/ExhibitionInfoModal.vue'
import BoothBrandDirectoryModal from '@/components/exhibition/BoothBrandDirectoryModal.vue'
import ExhibitionFavoritesModal from '@/components/exhibition/ExhibitionFavoritesModal.vue'
import { useMobile } from '@/composables/useMobile'

type MenuSection = 'directory' | 'info' | 'favorites'

// Minimal exhibition info; parent can pass via props later if needed
const props = defineProps<{
  info?: {
    title?: string
    dateRange?: string
    time?: string
    location?: string
    address?: string
    routes?: Array<{ label: string; url?: string }>
    notes?: string[]
  }
}>()

const visible = ref(false)
const pickerVisible = ref(false)
const active = ref<MenuSection>('directory')
const { isMobile } = useMobile(768)

const isOpenDirectory = computed(() => visible.value && active.value === 'directory')
const isOpenInfo = computed(() => visible.value && active.value === 'info')
const isOpenFavorites = computed(() => visible.value && active.value === 'favorites')

const emit = defineEmits<{
  (e: 'open-booth', payload: { boothNumber: string; brandName?: string }): void
}>()

const open = (section?: MenuSection) => {
  if (section) {
    active.value = section
    visible.value = true
    pickerVisible.value = false
  } else {
    pickerVisible.value = true
  }
}

const close = () => {
  visible.value = false
  pickerVisible.value = false
}

defineExpose({ open, close })

const onOpenBooth = (payload: { boothNumber: string; brandName?: string }) => emit('open-booth', payload)
</script>

<template>
  <div class="fixed right-4 bottom-4 z-300 flex flex-col items-end gap-2">
    <!-- 主按钮（更简洁） -->
    <button
      class="w-12 h-12 rounded-full shadow-lg bg-blue-600 text-white flex items-center justify-center border border-blue-700 hover:bg-blue-700 active:scale-95 transition cursor-pointer"
      aria-label="打开展会菜单"
      @click="open()"
    >
      <i class="i-carbon-menu text-xl"></i>
    </button>

    <!-- 选择器：桌面端面板 / 移动端抽屉 -->
    <ExhibitionMenuPicker :visible="pickerVisible" @update:visible="pickerVisible = $event" @select-section="open" />

    <!-- Directory modal -->
    <BoothBrandDirectoryModal
      :visible="isOpenDirectory"
      @update:visible="
        (newVisible) => {
          if (!newVisible) visible = false
        }
      "
      @open-booth="onOpenBooth"
    />

    <!-- Info modal -->
    <ExhibitionInfoModal
      :visible="isOpenInfo"
      :info="props.info"
      @update:visible="
        (newVisible) => {
          if (!newVisible) visible = false
        }
      "
    />

    <!-- Favorites modal -->
    <ExhibitionFavoritesModal
      :visible="isOpenFavorites"
      @update:visible="
        (newVisible) => {
          if (!newVisible) visible = false
        }
      "
      @open-booth="onOpenBooth"
    />
  </div>
</template>

<style scoped></style>
