import { defineStore } from 'pinia'
import { ref } from 'vue'

type IntentionProductItem = {
  boothNumber: string
  brandName: string
  productName: string
  productImage?: string
}

export const useExhibitionStore = defineStore('exhibition', () => {
  const favoriteBooths = ref<string[]>([])
  const favoriteBrands = ref<string[]>([])
  const checkedInBrands = ref<string[]>([])
  const intentionProducts = ref<IntentionProductItem[]>([])
  const obtainedIntentionKeys = ref<string[]>([])

  function buildIntentionKey(boothNumber: string, productName: string): string {
    return `${boothNumber}__${productName}`
  }

  function addFavoriteBooth(boothNumber: string) {
    const normalized = boothNumber.trim()
    if (!normalized) return
    if (!favoriteBooths.value.includes(normalized)) {
      favoriteBooths.value.push(normalized)
    }
  }

  function removeFavoriteBooth(boothNumber: string) {
    const idx = favoriteBooths.value.indexOf(boothNumber)
    if (idx !== -1) favoriteBooths.value.splice(idx, 1)
  }

  function toggleFavoriteBooth(boothNumber: string) {
    if (isBoothFavorited(boothNumber)) removeFavoriteBooth(boothNumber)
    else addFavoriteBooth(boothNumber)
  }

  function isBoothFavorited(boothNumber: string): boolean {
    return favoriteBooths.value.includes(boothNumber)
  }

  function addFavoriteBrand(brandName: string) {
    const normalized = brandName.trim()
    if (!normalized) return
    if (!favoriteBrands.value.includes(normalized)) {
      favoriteBrands.value.push(normalized)
    }
  }

  function removeFavoriteBrand(brandName: string) {
    const idx = favoriteBrands.value.indexOf(brandName)
    if (idx !== -1) favoriteBrands.value.splice(idx, 1)
  }

  function toggleFavoriteBrand(brandName: string) {
    if (isBrandFavorited(brandName)) removeFavoriteBrand(brandName)
    else addFavoriteBrand(brandName)
  }

  function isBrandFavorited(brandName: string): boolean {
    return favoriteBrands.value.includes(brandName)
  }

  // Checked-in brands
  function addCheckedInBrand(brandName: string) {
    const normalized = brandName.trim()
    if (!normalized) return
    if (!checkedInBrands.value.includes(normalized)) {
      checkedInBrands.value.push(normalized)
    }
  }

  function removeCheckedInBrand(brandName: string) {
    const idx = checkedInBrands.value.indexOf(brandName)
    if (idx !== -1) checkedInBrands.value.splice(idx, 1)
  }

  function toggleCheckedInBrand(brandName: string) {
    if (isBrandCheckedIn(brandName)) removeCheckedInBrand(brandName)
    else addCheckedInBrand(brandName)
  }

  function isBrandCheckedIn(brandName: string): boolean {
    return checkedInBrands.value.includes(brandName)
  }

  function addIntentionProduct(item: IntentionProductItem) {
    const exists = intentionProducts.value.some(
      (p) => p.boothNumber === item.boothNumber && p.productName === item.productName
    )
    if (!exists) intentionProducts.value.push(item)
  }

  function removeIntentionProduct(boothNumber: string, productName: string) {
    const index = intentionProducts.value.findIndex(
      (p) => p.boothNumber === boothNumber && p.productName === productName
    )
    if (index !== -1) intentionProducts.value.splice(index, 1)
  }

  function toggleIntentionProduct(item: IntentionProductItem) {
    if (isProductInIntentionList(item.boothNumber, item.productName)) {
      removeIntentionProduct(item.boothNumber, item.productName)
    } else {
      addIntentionProduct(item)
    }
  }

  function isProductInIntentionList(boothNumber: string, productName: string): boolean {
    return intentionProducts.value.some(
      (p) => p.boothNumber === boothNumber && p.productName === productName
    )
  }

  // Obtained intentions
  function markIntentionObtained(boothNumber: string, productName: string) {
    const key = buildIntentionKey(boothNumber, productName)
    if (!obtainedIntentionKeys.value.includes(key)) obtainedIntentionKeys.value.push(key)
  }

  function unmarkIntentionObtained(boothNumber: string, productName: string) {
    const key = buildIntentionKey(boothNumber, productName)
    const idx = obtainedIntentionKeys.value.indexOf(key)
    if (idx !== -1) obtainedIntentionKeys.value.splice(idx, 1)
  }

  function toggleIntentionObtained(boothNumber: string, productName: string) {
    if (isIntentionObtained(boothNumber, productName)) unmarkIntentionObtained(boothNumber, productName)
    else markIntentionObtained(boothNumber, productName)
  }

  function isIntentionObtained(boothNumber: string, productName: string): boolean {
    const key = buildIntentionKey(boothNumber, productName)
    return obtainedIntentionKeys.value.includes(key)
  }

  return {
    favoriteBooths,
    favoriteBrands,
    checkedInBrands,
    intentionProducts,
    obtainedIntentionKeys,
    addFavoriteBooth,
    removeFavoriteBooth,
    toggleFavoriteBooth,
    isBoothFavorited,
    addFavoriteBrand,
    removeFavoriteBrand,
    toggleFavoriteBrand,
    isBrandFavorited,
    addCheckedInBrand,
    removeCheckedInBrand,
    toggleCheckedInBrand,
    isBrandCheckedIn,
    markIntentionObtained,
    unmarkIntentionObtained,
    toggleIntentionObtained,
    isIntentionObtained,
    addIntentionProduct,
    removeIntentionProduct,
    toggleIntentionProduct,
    isProductInIntentionList,
  }
}, {
  persist: {
    storage: piniaPluginPersistedstate.cookies({
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      sameSite: 'strict',
    })
  }
})

