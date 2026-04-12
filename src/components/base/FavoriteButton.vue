<script setup lang="ts">
import { ref } from 'vue'

type Props = {
  active: boolean
  sizeClass?: string
  titleOn?: string
  titleOff?: string
}

const props = withDefaults(defineProps<Props>(), {
  sizeClass: 'text-base',
  titleOn: '取消意向',
  titleOff: '加入意向',
})

const emit = defineEmits<{ (e: 'toggle'): void }>()

const showBubble = ref(false)
const showBroken = ref(false)

type Particle = {
  id: number
  tx: number
  ty: number
  scale: number
  rotate: number
  delay: number
}

const particles = ref<Particle[]>([])

const triggerBubble = () => {
  const list: Particle[] = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    tx: Math.round(Math.random() * 30 - 15),
    ty: -Math.round(14 + Math.random() * 26),
    scale: 0.7 + Math.random() * 0.6,
    rotate: Math.round(Math.random() * 40 - 20),
    delay: Math.round(Math.random() * 100),
  }))
  particles.value = list
  showBubble.value = true
  window.setTimeout(() => (showBubble.value = false), 700)
}

const triggerBroken = () => {
  showBroken.value = true
  window.setTimeout(() => (showBroken.value = false), 650)
}

const handleClick = () => {
  if (!props.active) triggerBubble()
  else triggerBroken()
  emit('toggle')
}
</script>

<template>
  <button
    class="relative inline-flex items-center justify-center p-1.5 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
    :title="active ? titleOn : titleOff"
    :aria-pressed="active"
    aria-label="加入/取消意向"
    @click="handleClick"
  >
    <i :class="[active ? 'i-carbon-favorite-filled text-rose-500' : 'i-carbon-favorite text-slate-500', sizeClass]" :aria-hidden="true"></i>

    <!-- Bubble hearts when toggling on -->
    <span v-if="showBubble" class="pointer-events-none absolute inset-0">
      <i
        v-for="p in particles"
        :key="p.id"
        class="bubble-heart i-carbon-favorite-filled text-rose-400/90 absolute"
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

    <!-- Broken heart when toggling off -->
    <span v-if="showBroken" class="pointer-events-none absolute inset-0">
      <span class="heart-half left i-carbon-favorite-filled text-rose-500 absolute" aria-hidden="true"></span>
      <span class="heart-half right i-carbon-favorite-filled text-rose-500 absolute" aria-hidden="true"></span>
    </span>
  </button>
</template>

<style scoped>
.bubble-heart {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  animation: bubble-pop 650ms ease-out forwards;
}

@keyframes bubble-pop {
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

.heart-half {
  left: 50%;
  top: 50%;
  font-size: 16px;
  transform: translate(-50%, -50%);
  opacity: 1;
}

.heart-half.left {
  clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%);
  animation: break-left 650ms ease forwards;
}

.heart-half.right {
  clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%);
  animation: break-right 650ms ease forwards;
}

@keyframes break-left {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
    opacity: 1;
  }
  40% {
    transform: translate(calc(-50% - 3px), calc(-50% + 1px)) rotate(-10deg);
  }
  100% {
    transform: translate(calc(-50% - 14px), calc(-50% + 6px)) rotate(-25deg);
    opacity: 0;
  }
}

@keyframes break-right {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
    opacity: 1;
  }
  40% {
    transform: translate(calc(-50% + 3px), calc(-50% + 1px)) rotate(10deg);
  }
  100% {
    transform: translate(calc(-50% + 14px), calc(-50% + 6px)) rotate(25deg);
    opacity: 0;
  }
}
</style>
