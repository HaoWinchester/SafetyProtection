/**
 * Detection Hook
 * 用于执行检测操作
 */

import { useDispatch, useSelector } from 'react-redux'
import { useCallback } from 'react'
import { AppDispatch, RootState } from '@/store'
import {
  performDetection,
  selectCurrentResult,
  selectDetectionLoading,
  selectDetectionError,
  clearCurrentResult,
} from '@/store/detectionSlice'
import { DetectionRequest, DetectionResult, DetectionLevel } from '@/types'
import { detectRealtime } from '@/services/detectionService'
import { message } from 'antd'

/**
 * Detection Hook返回值
 */
interface UseDetectionReturn {
  result: DetectionResult | null
  loading: boolean
  error: string | null
  detect: (text: string, level?: DetectionLevel) => Promise<DetectionResult | null>
  clearResult: () => void
}

/**
 * Detection Hook
 */
export const useDetection = (): UseDetectionReturn => {
  const dispatch = useDispatch<AppDispatch>()

  const result = useSelector(selectCurrentResult)
  const loading = useSelector(selectDetectionLoading)
  const error = useSelector(selectDetectionError)

  /**
   * 执行检测
   */
  const detect = useCallback(
    async (text: string, level?: DetectionLevel): Promise<DetectionResult | null> => {
      if (!text || text.trim().length === 0) {
        message.warning('请输入要检测的文本')
        return null
      }

      try {
        const request: DetectionRequest = {
          text: text.trim(),
          detection_level: level || DetectionLevel.STANDARD,
        }

        const result = await dispatch(performDetection(request)).unwrap()

        // 根据检测结果显示不同提示
        if (result.is_compliant) {
          message.success('检测通过，内容合规')
        } else {
          message.warning(`检测到风险：${result.risk_level}`)
        }

        return result
      } catch (error: any) {
        message.error(error || '检测失败，请重试')
        return null
      }
    },
    [dispatch]
  )

  /**
   * 清除结果
   */
  const clearResult = useCallback(() => {
    dispatch(clearCurrentResult())
  }, [dispatch])

  return {
    result,
    loading,
    error,
    detect,
    clearResult,
  }
}

/**
 * 批量检测Hook
 */
export const useBatchDetection = () => {
  const dispatch = useDispatch<AppDispatch>()

  const detectBatch = useCallback(
    async (texts: string[], level?: DetectionLevel) => {
      if (!texts || texts.length === 0) {
        message.warning('请输入要检测的文本')
        return null
      }

      try {
        message.loading('正在批量检测...', 0)

        const results = await Promise.all(
          texts.map((text) =>
            detectRealtime({
              text,
              detection_level: level || DetectionLevel.STANDARD,
            })
          )
        )

        message.destroy()

        const compliant = results.filter((r) => r.is_compliant).length
        const total = results.length

        message.success(
          `批量检测完成：${compliant}/${total} 条通过`
        )

        return results
      } catch (error: any) {
        message.destroy()
        message.error(error || '批量检测失败')
        return null
      }
    },
    [dispatch]
  )

  return { detectBatch }
}

export default useDetection
