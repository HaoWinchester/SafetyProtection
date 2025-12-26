/**
 * 工具函数
 * Helper functions
 */

import dayjs from 'dayjs'
import { RiskLevel } from '@/types'

/**
 * 格式化时间
 */
export function formatTime(timestamp: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(timestamp).format(format)
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(timestamp: string | Date): string {
  return dayjs(timestamp).fromNow()
}

/**
 * 格式化数字
 */
export function formatNumber(num: number, decimals = 2): string {
  return num.toFixed(decimals)
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * 格式化持续时间
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }
}

/**
 * 获取风险等级颜色
 */
export function getRiskLevelColor(level: RiskLevel): string {
  const colors = {
    [RiskLevel.LOW]: '#52c41a',
    [RiskLevel.MEDIUM]: '#faad14',
    [RiskLevel.HIGH]: '#ff4d4f',
    [RiskLevel.CRITICAL]: '#cf1322',
  }
  return colors[level] || '#d9d9d9'
}

/**
 * 获取风险等级标签
 */
export function getRiskLevelLabel(level: RiskLevel): string {
  const labels = {
    [RiskLevel.LOW]: '低风险',
    [RiskLevel.MEDIUM]: '中风险',
    [RiskLevel.HIGH]: '高风险',
    [RiskLevel.CRITICAL]: '严重风险',
  }
  return labels[level] || '未知'
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength = 100): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

/**
 * 高亮关键词
 */
export function highlightKeywords(text: string, keywords: string[]): string {
  let result = text
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi')
    result = result.replace(regex, '<mark>$1</mark>')
  })
  return result
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  let previous = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = wait - (now - previous)

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any
  }

  if (obj instanceof Object) {
    const clonedObj: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 下载文件
 */
export function downloadFile(data: any, filename: string, type = 'application/json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}

/**
 * 验证URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证邮箱
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 获取随机颜色
 */
export function getRandomColor(): string {
  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
    '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
