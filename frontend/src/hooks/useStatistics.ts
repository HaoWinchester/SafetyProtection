/**
 * Statistics Hook
 * 用于获取统计数据
 */

import { useState, useEffect, useCallback } from 'react'
import { getOverviewStatistics, getTrendData, getThreatDistribution } from '@/services/statisticsService'
import { OverviewStatistics, ChartData } from '@/types'
import { TimeRange } from '@/types'
import dayjs from 'dayjs'

/**
 * Statistics Hook返回值
 */
interface UseStatisticsReturn {
  overview: OverviewStatistics | null
  trends: ChartData | null
  distribution: any | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * 默认时间范围：最近7天
 */
const defaultTimeRange: TimeRange = {
  start: dayjs().subtract(7, 'day').toISOString(),
  end: dayjs().toISOString(),
}

/**
 * Statistics Hook
 */
export const useStatistics = (
  timeRange: TimeRange = defaultTimeRange,
  autoRefresh: boolean = false,
  refreshInterval: number = 30000 // 30秒
): UseStatisticsReturn => {
  const [overview, setOverview] = useState<OverviewStatistics | null>(null)
  const [trends, setTrends] = useState<ChartData | null>(null)
  const [distribution, setDistribution] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 获取概览统计
   */
  const fetchOverview = useCallback(async () => {
    try {
      const data = await getOverviewStatistics(timeRange)
      setOverview(data)
    } catch (err: any) {
      console.error('Failed to fetch overview statistics:', err)
      throw err
    }
  }, [timeRange])

  /**
   * 获取趋势数据
   */
  const fetchTrends = useCallback(async () => {
    try {
      const data = await getTrendData(timeRange, 'day')
      setTrends(data)
    } catch (err: any) {
      console.error('Failed to fetch trend data:', err)
      throw err
    }
  }, [timeRange])

  /**
   * 获取分布数据
   */
  const fetchDistribution = useCallback(async () => {
    try {
      const data = await getThreatDistribution(timeRange)
      setDistribution(data)
    } catch (err: any) {
      console.error('Failed to fetch distribution data:', err)
      throw err
    }
  }, [timeRange])

  /**
   * 刷新所有数据
   * 优化：独立处理每个请求，避免一个失败影响全部
   */
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 使用Promise.allSettled代替Promise.all，确保每个请求独立处理
      const results = await Promise.allSettled([
        fetchOverview(),
        fetchTrends(),
        fetchDistribution(),
      ])

      // 检查是否有失败的请求
      const failedRequests = results.filter(r => r.status === 'rejected')
      if (failedRequests.length > 0) {
        console.warn('部分统计请求失败:', failedRequests)
        // 如果全部失败才设置错误
        if (failedRequests.length === results.length) {
          setError('无法连接到服务器，请确保后端服务已启动')
        }
      }
    } catch (err: any) {
      setError(err.message || '获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }, [fetchOverview, fetchTrends, fetchDistribution])

  /**
   * 初始化数据
   */
  useEffect(() => {
    refresh()
  }, [refresh])

  /**
   * 自动刷新
   */
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refresh])

  return {
    overview,
    trends,
    distribution,
    loading,
    error,
    refresh,
  }
}

/**
 * 实时统计Hook
 */
export const useRealtimeStatistics = (enabled: boolean = true) => {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    try {
      // 这里可以调用实时统计API
      // const response = await getRealtimeStatistics()
      // setData(response)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    fetchData()

    if (enabled) {
      const interval = setInterval(fetchData, 5000) // 5秒刷新一次
      return () => clearInterval(interval)
    }
  }, [enabled, fetchData])

  return { data, loading, error, refresh: fetchData }
}

export default useStatistics
