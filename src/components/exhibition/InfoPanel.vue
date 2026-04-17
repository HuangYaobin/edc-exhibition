<script setup lang="ts">
interface InfoItem {
  icon: string
  label: string
  value: string
}

const exhibitionInfo: InfoItem[] = [
  { icon: 'i-carbon-calendar', label: '时间', value: '2026 4.18 ~ 4.19' },
  { icon: 'i-carbon-time', label: '开放时间', value: '9:00 - 17:00' },
  { icon: 'i-carbon-location', label: '地点', value: '上海市闵行区申昆路1988号虹桥品汇二期A栋' },
]

const icpNumber = '浙ICP备20009839号-1'
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto hide-scrollbar pb-2">
    <!-- 展会信息卡片 -->
    <section class="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex flex-col gap-3">
      <header class="flex items-center gap-2">
        <i class="i-carbon-information text-zinc-300 text-base" />
        <h3 class="text-zinc-100 text-sm font-medium m-0">展会信息</h3>
      </header>

      <ul class="flex flex-col gap-2.5 list-none p-0 m-0">
        <li v-for="item in exhibitionInfo" :key="item.label" class="flex items-start gap-3">
          <i :class="[item.icon, 'text-zinc-500 text-base mt-0.5 shrink-0']" />
          <div class="flex-1 min-w-0">
            <p class="text-zinc-500 text-xs m-0 leading-snug">{{ item.label }}</p>
            <p class="text-zinc-200 text-sm m-0 mt-0.5 leading-snug break-all">{{ item.value }}</p>
          </div>
        </li>
      </ul>
    </section>

    <!-- 意见反馈卡片 -->
    <section class="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex flex-col gap-3 items-center">
      <header class="flex items-center gap-2 self-start">
        <i class="i-carbon-chat text-zinc-300 text-base" />
        <h3 class="text-zinc-100 text-sm font-medium m-0">意见反馈</h3>
      </header>

      <p class="text-zinc-400 text-xs m-0 self-start">扫码提交您的意见和建议</p>

      <img src="https://edcstore.oss-cn-hangzhou.aliyuncs.com/uploads/2026/04/59368beed76bb1c66384cf1afa850b8b.png"
        alt="意见反馈二维码" class="w-[200px] h-[200px] rounded-lg object-contain my-2" />
    </section>

    <footer class="mt-auto pt-4 pb-2 flex justify-center">
      <a :href="`https://beian.miit.gov.cn/`" target="_blank" rel="noopener noreferrer"
        class="text-zinc-600 text-xs no-underline hover:text-zinc-400 transition-colors">
        {{ icpNumber }}
      </a>
    </footer>
  </div>
</template>
