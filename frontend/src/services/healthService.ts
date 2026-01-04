/**
 * 健康检查服务
 * Health check service for backend availability
 */

import axios from 'axios'

/**
 * 健康检查响应
 */
interface HealthStatus {
  status: string
  version?: string
  timestamp?: string
}

/**
 * 检查后端服务是否可用
 * 使用非常短的超时时间(2秒)快速失败
 * 不使用apiClient，避免触发错误消息提示
 */
export const checkBackendHealth = async (): Promise<{
  healthy: boolean
  status?: HealthStatus
  error?: string
}> => {
  try {
    // 直接使用axios，不通过apiClient，避免显示错误消息
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const response = await axios.get<HealthStatus>(
      `${API_BASE_URL}/health`,
      { timeout: 2000 }
    )
    return {
      healthy: true,
      status: response.data,
    }
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message || '后端服务不可用',
    }
  }
}

/**
 * 带缓存的健康检查
 * 避免频繁请求
 */
let lastCheckTime = 0
let lastCheckResult: { healthy: boolean; error?: string } | null = null

const CACHE_DURATION = 10000 // 10秒缓存

export const checkBackendHealthWithCache = async (): Promise<{
  healthy: boolean
  status?: HealthStatus
  error?: string
}> => {
  const now = Date.now()

  // 如果缓存未过期，返回缓存结果
  if (lastCheckResult && (now - lastCheckTime) < CACHE_DURATION) {
    return lastCheckResult
  }

  // 执行健康检查
  const result = await checkBackendHealth()

  // 更新缓存
  lastCheckTime = now
  lastCheckResult = result

  return result
}
