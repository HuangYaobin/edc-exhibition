<script setup lang="ts">
import { computed } from 'vue'
import type { Booth } from '@/api/types'

const props = defineProps<{
  booth: Booth | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const primaryBrand = computed(() => {
  if (!props.booth?.brands?.length) return null
  return props.booth.brands[0]
})

const secondaryBrand = computed(() => {
  if (!props.booth?.brands || props.booth.brands.length < 2) return null
  return props.booth.brands[1]
})

const formattedBoothNumber = computed(() => {
  return props.booth?.boothNumber || ''
})

const stats = computed(() => {
  if (!props.booth) return []
  const result = []
  if (props.booth.products?.length) {
    result.push({ value: props.booth.products.length.toString(), label: '展品数量' })
  }
  return result
})

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const placeholder = target.nextElementSibling as HTMLElement
  if (placeholder) placeholder.style.display = 'flex'
}
</script>

<template>
  <div v-if="booth" class="booth-detail">
    <div class="detail-header">
      <div class="booth-number">展位号: {{ formattedBoothNumber }}</div>
      
      <div class="tags-row">
        <span v-if="primaryBrand" class="tag tag-primary">
          <i class="i-carbon-cube"></i>
          {{ primaryBrand.name }}
        </span>
        <span v-if="secondaryBrand" class="tag tag-secondary">
          {{ secondaryBrand.name }}
        </span>
      </div>

      <div v-if="primaryBrand" class="brand-intro-card">
        <div class="brand-logo">
          <img :src="primaryBrand.logoUrl" :alt="primaryBrand.name" @error="handleImageError" />
          <div class="logo-placeholder" style="display: none;">
            <i class="i-carbon-building"></i>
          </div>
        </div>
        <div class="brand-info">
          <h3 class="brand-name">{{ primaryBrand.name }}</h3>
          <p v-if="primaryBrand.description" class="brand-desc">{{ primaryBrand.description }}</p>
          <p v-else class="brand-desc placeholder">暂无品牌介绍</p>
        </div>
      </div>

      <div v-if="stats.length" class="stats-row">
        <div v-for="stat in stats" :key="stat.label" class="stat-item">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <div v-if="booth.products?.length" class="products-section">
      <div class="section-header">
        <h4 class="section-title">核心产品</h4>
        <span class="section-subtitle">PRODUCTS</span>
      </div>
      
      <div class="products-list">
        <div 
          v-for="(product, index) in booth.products" 
          :key="product.id || index"
          class="product-card"
        >
          <div class="product-image-wrapper">
            <img :src="product.imageUrl" :alt="product.name" class="product-image" @error="handleImageError" />
            <div class="image-placeholder" style="display: none;">
              <i class="i-carbon-image"></i>
            </div>
          </div>
          
          <div class="product-info">
            <h5 class="product-name">{{ product.name }}</h5>
            <p v-if="product.description" class="product-desc">
              {{ product.description }}
            </p>
            <div class="product-footer">
              <span v-if="product.price" class="product-price">
                ¥{{ (product.price / 100).toFixed(2) }}
              </span>
              <button class="detail-btn">
                了解详情
                <i class="i-carbon-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.booth-detail {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  max-height: 50vh;
  overflow-y: auto;
}

/* 头部信息 */
.detail-header {
  padding: 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
}

.booth-number {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 12px;
}

.tags-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.tag-primary {
  background: #1a1a2e;
  color: #fff;
}

.tag-secondary {
  background: #e8e8f0;
  color: #666;
}

/* 品牌简介卡片 */
.brand-intro-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.brand-logo {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-logo :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.logo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 24px;
}

.brand-info {
  flex: 1;
  min-width: 0;
}

.brand-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px;
}

.brand-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.brand-desc.placeholder {
  color: #999;
  font-style: italic;
}

/* 统计数据 */
.stats-row {
  display: flex;
  gap: 24px;
  padding: 0 8px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 产品区域 */
.products-section,
.articles-section,
.gifts-section {
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.section-subtitle {
  font-size: 11px;
  color: #999;
  font-weight: 500;
  letter-spacing: 1px;
}

/* 产品卡片 */
.products-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  height: 180px;
  background: #f8f8f8;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
}

.product-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 32px;
}

.stock-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: #52c41a;
  color: #fff;
}

.stock-badge.hot {
  background: #ff4d4f;
}

.product-info {
  padding: 16px;
}

.product-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px;
}

.product-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  font-size: 18px;
  font-weight: 700;
  color: #ff6b6b;
}

.detail-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #1a1a2e;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-btn:hover {
  background: #2d2d44;
}

/* 文章列表 */
.articles-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.article-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9ff;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
}

.article-item:hover {
  background: #e8e8f5;
}

.article-title {
  font-size: 14px;
  color: #1a1a2e;
  font-weight: 500;
}

.article-item i {
  color: #999;
  font-size: 14px;
}

/* 礼品区域 */
.gifts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gift-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fffbf0;
  border-radius: 12px;
  border: 1px solid #ffe4b5;
}

.gift-image-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;
}

.gift-image {
  width: 100%;
  height: 100%;
}

.gift-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gift-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.gift-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px;
}

.gift-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  margin: 0 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.gift-stock {
  font-size: 11px;
  color: #ff9500;
  font-weight: 500;
}
</style>