/**
 * 检测服务API
 * Detection service API
 */

import { get, post } from './api'
import {
  DetectionRequest,
  DetectionResult,
  BatchDetectionRequest,
  BatchDetectionResult,
  DetectionHistory,
  PageParams,
} from '@/types'
import { API_ENDPOINTS } from '@/utils/constants'

/**
 * 实时检测API
 */
export const detectRealtime = async (
  request: DetectionRequest
): Promise<DetectionResult> => {
  return post<DetectionResult>(API_ENDPOINTS.DETECTION_REALTIME, request)
}

/**
 * 批量检测API
 */
export const detectBatch = async (
  request: BatchDetectionRequest
): Promise<BatchDetectionResult> => {
  return post<BatchDetectionResult>(API_ENDPOINTS.DETECTION_BATCH, request)
}

/**
 * 获取检测历史记录
 */
export const getDetectionHistory = async (
  params?: PageParams & {
    start_time?: string
    end_time?: string
    risk_level?: string
  }
): Promise<DetectionHistory> => {
  return get<DetectionHistory>(API_ENDPOINTS.DETECTION_HISTORY, params)
}

/**
 * 获取单个检测结果详情
 */
export const getDetectionDetail = async (
  id: string
): Promise<DetectionResult> => {
  return get<DetectionResult>(`${API_ENDPOINTS.DETECTION_REALTIME}/${id}`)
}

/**
 * 导出检测记录
 */
export const exportDetections = async (
  params?: PageParams & {
    start_time?: string
    end_time?: string
    format?: 'json' | 'csv' | 'excel'
  }
): Promise<Blob> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.DETECTION_HISTORY}/export?${new URLSearchParams(params as any)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error('导出失败')
  }

  return response.blob()
}

/**
 * 重新检测
 */
export const redetect = async (
  id: string
): Promise<DetectionResult> => {
  return post<DetectionResult>(`${API_ENDPOINTS.DETECTION_REALTIME}/${id}/redetect`)
}
