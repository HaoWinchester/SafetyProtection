/**
 * 监控服务API
 * Monitor service API
 */

import { get } from './api'
import { SystemStatus, PerformanceMetrics } from '@/types'
import { API_ENDPOINTS } from '@/utils/constants'

/**
 * 系统健康状态
 */
export interface SystemHealth {
  status: SystemStatus
  services: {
    name: string
    status: SystemStatus
    uptime: number
    last_check: string
  }[]
}

/**
 * 获取系统健康状态
 */
export const getSystemHealth = async (): Promise<SystemHealth> => {
  return get<SystemHealth>(API_ENDPOINTS.MONITOR_SYSTEM)
}

/**
 * 获取性能指标
 */
export const getPerformanceMetrics = async (): Promise<PerformanceMetrics> => {
  return get<PerformanceMetrics>(API_ENDPOINTS.MONITOR_PERFORMANCE)
}

/**
 * 检测引擎状态
 */
export interface EngineStatus {
  running: boolean
  queue_size: number
  processed_count: number
  failed_count: number
  avg_processing_time: number
  last_updated: string
}

/**
 * 获取检测引擎状态
 */
export const getEngineStatus = async (): Promise<EngineStatus> => {
  return get<EngineStatus>(API_ENDPOINTS.MONITOR_ENGINE)
}

/**
 * 获取系统日志
 */
export const getSystemLogs = async (params?: {
  level?: 'info' | 'warning' | 'error'
  limit?: number
  offset?: number
}): Promise<{
  logs: Array<{
    timestamp: string
    level: string
    message: string
    source: string
  }>
  total: number
}> => {
  return get(`${API_ENDPOINTS.MONITOR_SYSTEM}/logs`, params)
}

/**
 * 获取告警列表
 */
export const getAlerts = async (params?: {
  status?: 'active' | 'resolved' | 'all'
  limit?: number
}): Promise<{
  alerts: Array<{
    id: string
    type: string
    severity: 'info' | 'warning' | 'error' | 'critical'
    message: string
    timestamp: string
    resolved: boolean
  }>
  total: number
}> => {
  return get(`${API_ENDPOINTS.MONITOR_SYSTEM}/alerts`, params)
}
