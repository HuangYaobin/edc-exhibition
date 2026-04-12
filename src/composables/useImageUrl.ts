/**
 * 图片 URL 处理工具
 * 图片服务器只支持缩略图和原图两种格式
 */

/**
 * 获取缩略图 URL (w200q70)
 * @param originalUrl 原始图片 URL
 * @returns 缩略图 URL
 */
export function getThumbnailUrl(originalUrl: string) {
  if (!originalUrl) return ''
  return `${originalUrl}/w200q70`
}

/**
 * 获取卡片图片 URL - 使用缩略图
 */
export function getCardImageUrl(originalUrl: string) {
  return getThumbnailUrl(originalUrl)
}

/**
 * 获取查看器图片 URL - 使用原图
 */
export function getViewerImageUrl(originalUrl: string) {
  if (!originalUrl) return ''
  return originalUrl // 返回原图
}
