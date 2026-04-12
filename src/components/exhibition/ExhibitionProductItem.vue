<script setup lang="ts">
type Props = {
  name: string
  image: string
  description?: string
  price?: string
  stock?: string
  intended: boolean
  roundedClass?: string
  imageClassExtra?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  price: '',
  stock: '',
  roundedClass: 'rounded',
  imageClassExtra: '',
})

const emit = defineEmits<{ (e: 'toggle'): void }>()

// Fallback handled by ElImage error slot
</script>

<template>
  <div class="border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors" :class="roundedClass">
    <div class="flex items-center space-x-3">
      <div class="flex-[1] self-stretch">
        <el-image :src="image" :alt="name" class="w-full h-full rounded object-cover" :class="imageClassExtra" fit="cover" lazy>
          <template #error>
            <div class="w-full h-full rounded bg-gray-100 border border-gray-200"></div>
          </template>
        </el-image>
      </div>

      <div class="flex-[1.3] p-2 self-stretch flex">
        <div class="flex h-full flex-col min-w-0 flex-1">
          <div class="flex items-center justify-between">
            <h5 class="text-base md:text-lg font-semibold tracking-tight leading-tight text-slate-900 dark:text-slate-100 line-clamp-2">{{ name }}</h5>
            <BaseFavoriteButton :active="intended" @toggle="emit('toggle')" />
          </div>
          <div class="flex-1">
            <p v-if="description" class="mt-1 text-xs md:text-sm leading-5 text-slate-600 dark:text-slate-300">{{ description }}</p>
          </div>

          <div class="mt-2 flex justify-between items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <span class="text-base md:text-lg font-semibold tabular-nums">
              <template v-if="price && price !== ''">¥ {{ price }}</template>
              <template v-else>
                <div class="text-green-600">免费</div>
              </template>
            </span>

            <span
              v-if="stock && stock !== ''"
              class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
            >
              <i class="i-fluent-box-16-regular text-slate-500 text-md" aria-hidden="true"></i>
              {{ stock }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
