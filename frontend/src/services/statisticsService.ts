/**
 * 统计服务API
 * Statistics service API
 */

import { get } from './api'
import { TimeRange, ChartData, DataPoint } from '@/types'
import { API_ENDPOINTS } from '@/utils/constants'

/**
 * 概览统计接口
 */
export interface OverviewStatistics {
  total_detections: number
  compliant_count: number
  non_compliant_count: number
  avg_risk_score: number
  attack_distribution: Record<string, number>
  trend: DataPoint[]
}

/**
 * 获取概览统计
 */
export const getOverviewStatistics = async (
  timeRange?: TimeRange
): Promise<OverviewStatistics> => {
  return get<OverviewStatistics>(API_ENDPOINTS.STATISTICS_OVERVIEW, { timeRange })
}

/**
 * 获取趋势数据
 */
export const getTrendData = async (
  timeRange: TimeRange,
  interval: 'hour' | 'day' | 'week' | 'month' = 'day'
): Promise<ChartData> => {
  return get<ChartData>(API_ENDPOINTS.STATISTICS_TRENDS, {
    timeRange,
    interval,
  })
}

/**
 * 获取威胁分布数据
 */
export const getThreatDistribution = async (
  timeRange?: TimeRange
): Promise<{
  attackTypes: ChartData
  riskLevels: ChartData
  detectionTime: ChartData
}> => {
  return get(API_ENDPOINTS.STATISTICS_DISTRIBUTION, { timeRange })
}

/**
 * 获取实时统计数据
 */
export const getRealtimeStatistics = async (): Promise<{
  request_rate: number
  avg_response_time: number
  active_detections: number
  success_rate: number
}> => {
  return get(`${API_ENDPOINTS.STATISTICS_OVERVIEW}/realtime`)
}
