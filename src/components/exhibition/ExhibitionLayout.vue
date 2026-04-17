<template>
  <div class="exhibition-layout flex flex-col flex-1 min-h-0 overflow-hidden py-4 gap-2 bg-[#080808] relative">
    <!-- 顶部操作区（菜单按钮等） -->
    <div v-if="$slots.actions" class="absolute! z-2! top-4 left-4 z-10 flex items-center gap-2">
      <slot name="actions" />
    </div>
    <slot name="map" />
    <div class="flex-1 min-h-0 overflow-hidden">
      <slot name="detail" />
    </div>
  </div>
</template>

<style scoped>
/* 斜向 logo 水印：inset: -50% 让伪元素超出容器边界，
   旋转后四角不留空；screen 混合令黑色背景消失 */
.exhibition-layout::before {
  content: '';
  position: absolute;
  inset: -50%;
  background-image: url('@/assets/edcshow-logo.svg');
  background-size: 90px 90px;
  background-repeat: repeat;
  mix-blend-mode: screen;
  opacity: 0.13;
  pointer-events: none;
  z-index: 0;
  transform: rotate(-25deg);
}

/* 内容层浮于水印之上 */
.exhibition-layout> :deep(*) {
  position: relative;
  z-index: 1;
}
</style>
