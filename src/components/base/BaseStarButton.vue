<script setup lang="ts">
import { ref } from 'vue'

type Props = {
  active: boolean
  sizeClass?: string
  titleOn?: string
  titleOff?: string
}

const props = withDefaults(defineProps<Props>(), {
  sizeClass: 'text-lg',
  titleOn: '取消收藏',
  titleOff: '加入收藏',
})

const emit = defineEmits<{ (e: 'toggle'): void }>()

const showBurst = ref(false)
const showShatter = ref(false)

type Particle = {
  id: number
  tx: number
  ty: number
  scale: number
  rotate: number
  delay: number
}

const particles = ref<Particle[]>([])

const triggerBurst = () => {
  const list: Particle[] = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    tx: Math.round(Math.random() * 32 - 16),
    ty: -Math.round(12 + Math.random() * 24),
    scale: 0.7 + Math.random() * 0.7,
    rotate: Math.round(Math.random() * 60 - 30),
    delay: Math.round(Math.random() * 120),
  }))
  particles.value = list
  showBurst.value = true
  window.setTimeout(() => (showBurst.value = false), 700)
}

const triggerShatter = () => {
  showShatter.value = true
  window.setTimeout(() => (showShatter.value = false), 650)
}

const handleClick = () => {
  if (!props.active) triggerBurst()
  else triggerShatter()
  emit('toggle')
}
</script>

<template>
  <button
    class="relative inline-flex items-center justify-center px-2 py-1.5 rounded-md border transition-colors cursor-pointer"
    :class="active ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'"
    :title="active ? titleOn : titleOff"
    :aria-pressed="active"
    aria-label="加入/取消收藏"
    @click="handleClick"
  >
    <i :class="[active ? 'i-carbon-star-filled text-yellow-500' : 'i-carbon-star', sizeClass]" aria-hidden="true"></i>

    <!-- Burst sparkles when toggling on -->
    <span v-if="showBurst" class="pointer-events-none absolute inset-0">
      <i
        v-for="p in particles"
        :key="p.id"
        class="spark i-carbon-star-filled text-yellow-400/90 absolute"
        :style="{
          '--tx': p.tx + 'px',
          '--ty': p.ty + 'px',
          '--scale': String(p.scale),
          '--rot': p.rotate + 'deg',
          animationDelay: p.delay + 'ms',
        } as any"
        aria-hidden="true"
      />
    </span>

    <!-- Shatter effect when toggling off -->
    <span v-if="showShatter" class="pointer-events-none absolute inset-0">
      <span class="star-half left i-carbon-star-filled text-yellow-500 absolute" aria-hidden="true"></span>
      <span class="star-half right i-carbon-star-filled text-yellow-500 absolute" aria-hidden="true"></span>
    </span>
  </button>
</template>

<style scoped>
.spark {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  animation: star-burst 650ms ease-out forwards;
}

@keyframes star-burst {
  0% {
    transform: translate(-50%, -50%) translate(0, 0) scale(0.5) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(var(--scale)) rotate(var(--rot));
    opacity: 0;
  }
}

.star-half {
  left: 50%;
  top: 50%;
  font-size: 16px;
  transform: translate(-50%, -50%);
  opacity: 1;
}

.star-half.left {
  clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%);
  animation: star-left 650ms ease forwards;
}

.star-half.right {
  clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%);
  animation: star-right 650ms ease forwards;
}

@keyframes star-left {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
    opacity: 1;
  }
  40% {
    transform: translate(calc(-50% - 3px), calc(-50% + 1px)) rotate(-12deg);
  }
  100% {
    transform: translate(calc(-50% - 14px), calc(-50% + 6px)) rotate(-28deg);
    opacity: 0;
  }
}

@keyframes star-right {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
    opacity: 1;
  }
  40% {
    transform: translate(calc(-50% + 3px), calc(-50% + 1px)) rotate(12deg);
  }
  100% {
    transform: translate(calc(-50% + 14px), calc(-50% + 6px)) rotate(28deg);
    opacity: 0;
  }
}
</style>
