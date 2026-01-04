/**
 * 页面数据刷新Hook
 * 当路由变化或页面重新激活时刷新数据
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 刷新数据的Hook
 * @param refreshFn 刷新函数
 * @param deps 依赖项数组
 */
export function useRefreshData(refreshFn: () => void | Promise<void>, deps: any[] = []) {
  const location = useLocation()
  const hasInitialized = useRef(false)
  const isRefreshing = useRef(false)

  useEffect(() => {
    // 首次加载时执行
    if (!hasInitialized.current) {
      hasInitialized.current = true
      refreshFn().catch((err) => {
        console.warn('数据加载失败:', err.message)
      })
    }
  }, [])

  // 路由变化时刷新
  useEffect(() => {
    if (hasInitialized.current && !isRefreshing.current) {
      isRefreshing.current = true
      refreshFn()
        .catch((err) => {
          console.warn('数据刷新失败:', err.message)
        })
        .finally(() => {
          isRefreshing.current = false
        })
    }
  }, [location.pathname, ...deps])
}

/**
 * 定时刷新Hook
 * @param refreshFn 刷新函数
 * @param interval 刷新间隔(毫秒)
 */
export function useAutoRefresh(refreshFn: () => void | Promise<void>, interval: number = 5000) {
  const location = useLocation()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 清除旧的定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // 设置新的定时器
    intervalRef.current = setInterval(() => {
      refreshFn()
    }, interval)

    // 组件卸载时清除定时器
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [location.pathname, interval])

  // 页面隐藏时停止刷新,显示时恢复
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时停止刷新
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        // 页面显示时恢复刷新并立即刷新一次
        refreshFn()
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            refreshFn()
          }, interval)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshFn, interval])
}
