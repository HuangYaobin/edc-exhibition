<template>
  <div class="exhibition-layout">
    <slot name="map" />
    <slot name="detail" />
  </div>
</template>

<style scoped>
.exhibition-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 16px;
  gap: 0.5rem;
  background-color: #080808;
  position: relative;
}

/* 斜向 logo 水印：inset: -50% 让伪元素超出容器边界，
   旋转后四角不留空；screen 混合令黑色背景消失 */
.exhibition-layout::before {
  content: '';
  position: absolute;
  inset: -50%;
  background-image: url('@/assets/edcshow-logo.svg');
  background-size: 80px 80px;
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
